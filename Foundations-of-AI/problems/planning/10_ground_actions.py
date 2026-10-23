from harness import Test
from planning_lib import Schema, ground as _ground

TITLE = 'From action schemas to ground actions'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['action schema', 'ground action', 'STRIPS', 'PDDL', 'grounding']

STATEMENT = r"""
An **action schema** has parameters; substituting a constant for every parameter gives a **ground action**
(AIMA §11.1). A schema with $k$ parameters over $n$ constants has $n^k$ groundings.

A schema is a `Schema` object (`planning_lib`):

```python
s = Schema('Move(x,y,z)', pre='Box(x), Table(y), Table(z), At(x,y)', eff='At(x,z), ¬At(x,y)')
s.signature   # 'Move(x,y,z)'
s.params      # ('x', 'y', 'z')
s.pre         # ['Box(x)', 'Table(y)', 'Table(z)', 'At(x,y)']    literals; '¬P(..)' negative, 'x≠y' inequality
s.eff         # ['At(x,z)', '¬At(x,y)']                         '¬' = delete
```

A ground action is `Action(name, pre, add, delete, neg)` (all but `name` are frozensets of ground atoms;
`neg` = negative preconditions, PDDL only). Implement:

1. `substitute(atom, theta)`: replace the arguments of an atom that are keys of `theta`; other arguments are
   constants and stay. `substitute('On(x,TABLE)', {'x': 'A'}) == 'On(A,TABLE)'`, `substitute('Handempty', {}) == 'Handempty'`.
2. `ground(schema, objects)`: the list of ground actions, one per combination of values in
   `itertools.product` order over `schema.params`. `objects` is a list (every parameter ranges over it) or a
   dict `{parameter: list}` (typed parameters; a name of the signature missing from the dict is a constant).
   Combinations that violate an inequality `x≠y` are skipped; inequalities do not go in the action.

`split_atom('On(A,B)') == ('On', ('A', 'B'))` is given.
"""

STARTER = '''import itertools
from planning_lib import Action, Schema, split_atom

def substitute(atom: str, theta: dict[str, str]) -> str:
    name, args = split_atom(atom)
    # TODO
    return atom

def ground(schema: Schema, objects) -> list[Action]:
    """All ground actions of the schema (itertools.product order over schema.params)."""
    out: list[Action] = []
    # TODO: for each combination: check the inequalities, split pre into pre / neg, eff into add / delete
    return out
'''

SOLUTION = '''import itertools
from planning_lib import Action, Schema, split_atom

def substitute(atom: str, theta: dict[str, str]) -> str:
    name, args = split_atom(atom)
    if not args:
        return name
    return name + '(' + ','.join(theta.get(a, a) for a in args) + ')'

def ground(schema: Schema, objects) -> list[Action]:
    """All ground actions of the schema (itertools.product order over schema.params)."""
    domains = [objects.get(p, [p]) if isinstance(objects, dict) else objects for p in schema.params]
    out: list[Action] = []
    for values in itertools.product(*domains):
        theta = dict(zip(schema.params, values))
        pre, neg, add, delete, ok = set(), set(), set(), set(), True
        for lit in schema.pre:
            if '≠' in lit:
                a, b = lit.split('≠')
                ok = ok and theta.get(a, a) != theta.get(b, b)
            elif lit.startswith('¬'):
                neg.add(substitute(lit[1:], theta))
            else:
                pre.add(substitute(lit, theta))
        for lit in schema.eff:
            if lit.startswith('¬'):
                delete.add(substitute(lit[1:], theta))
            else:
                add.add(substitute(lit, theta))
        if ok:
            out.append(Action(substitute(schema.signature, theta), frozenset(pre), frozenset(add),
                              frozenset(delete), frozenset(neg)))
    return out
'''

HINTS = [
    '`substitute`: `theta.get(a, a)` maps a variable to its value and leaves a constant unchanged. Rebuild '
    '`name(arg1,arg2)` with `",".join(...)`, no spaces; an atom with no arguments is just its name.',
    'Domains: `objects.get(p, [p]) if isinstance(objects, dict) else objects` for each parameter, then '
    '`for values in itertools.product(*domains): theta = dict(zip(schema.params, values))`.',
    'For each literal of `schema.pre`: `"x≠y"` → split on `≠` and compare the two substituted values; '
    '`"¬P(x)"` → `neg`; otherwise → `pre`. For `schema.eff`: `"¬"` → `delete`, otherwise `add`.',
    'The name of the ground action is `substitute(schema.signature, theta)`; wrap the sets in `frozenset`.',
]

EXPLANATION = r"""
**Why ground at all?** Forward search needs the **applicable ground actions** of a state, and SATPlan needs one
propositional symbol per ground action and time step: both work on ground actions. Backward search can keep some
variables (lifted regression), which is one reason why its branching factor is smaller.

**How many?** $n^k$ before any filtering:

| schema | constants | groundings |
|---|---|---|
| `Move(x,y,z)` (exam 16 Jan 2025) | B1, B2, T1, T2 | $4^3 = 64$; with typed parameters (boxes × tables × tables) 8 |
| `Move(c1,c2)` in the Wumpus world (exam 9 Feb 2023) | 16 cells | $16^2 = 256$; with $c_1 \ne c_2$ 240; adjacent pairs only 48 |
| `Move(b,x,y)` with $b \ne x$, $b \ne y$, $x \ne y$ (AIMA) | A, B, C, Table | $4 \cdot 3 \cdot 2 = 24$ |

Untyped grounding produces nonsense such as `Move(T1,B1,B2)` whose precondition `Box(T1)` is false forever: a
static atom false in the initial state stays false. Planners therefore keep only the ground actions whose
**static** preconditions hold (`possible()` in `planning_lib`): exam 16 Jan 2025 counts 8 Move actions, not 64.

**Negative preconditions** (`¬At(Pit,c2)`) are PDDL, not STRIPS: they go in a separate set `neg`, checked as
"this atom must be absent from the state" under the closed-world assumption.
"""

ENTRY = 'ground'

_BOX = Schema('Move(x,y,z)', 'Box(x), Table(y), Table(z), At(x,y)', 'At(x,z), ¬At(x,y)')
_CELLS = ['{}{}'.format(x, y) for x in range(1, 5) for y in range(1, 5)]
_WUMPUS = Schema('Move(c1,c2)', 'Alive, At(Agent,c1), Adj(c1,c2), ¬At(Pit,c2), ¬At(Wumpus,c2), c1≠c2',
                 '¬At(Agent,c1), At(Agent,c2)')
_AIMA_MOVE = Schema('Move(b,x,y)', 'On(b,x), Clear(b), Clear(y), Block(b), Block(y), b≠x, b≠y, x≠y',
                    'On(b,y), Clear(x), ¬On(b,x), ¬Clear(y)')
_PUTON = Schema('PutOn(t,Axle)', 'Tire(t), At(t,Ground), ¬At(Flat,Axle), ¬At(Spare,Axle)', '¬At(t,Ground), At(t,Axle)')
_LEAVE = Schema('LeaveOvernight', '', '¬At(Spare,Ground), ¬At(Flat,Axle)')


def _same_actions(schema, objects):
    def check(got, *args):
        want = _ground(schema, objects)
        if not isinstance(got, list):
            return False, 'Return a list of Action.'
        names = [getattr(a, 'name', a) for a in got]
        if names != [a.name for a in want]:
            return False, f'{len(names)} actions {names[:6]}…, expected {len(want)} actions {[a.name for a in want][:6]}…'
        for g, w in zip(got, want):
            if tuple(g) != tuple(w):
                return False, f'{w.name}: got {g!r} fields {tuple(g)[1:]}, expected {tuple(w)[1:]}'
        return True, f'{len(want)} ground actions'
    return check


TESTS = [
    Test('substitute variables', call=lambda sol: sol.substitute('At(x,y)', {'x': 'B1', 'y': 'T1'}),
         expected='At(B1,T1)', show="substitute('At(x,y)', {'x': 'B1', 'y': 'T1'})"),
    Test('constants stay', call=lambda sol: sol.substitute('On(x,TABLE)', {'x': 'A', 'y': 'B'}),
         expected='On(A,TABLE)', show="substitute('On(x,TABLE)', {'x': 'A', 'y': 'B'})"),
    Test('atom without arguments', call=lambda sol: sol.substitute('Handempty', {'x': 'A'}),
         expected='Handempty', show="substitute('Handempty', {'x': 'A'})"),
    Test('one ground action, all fields', call=lambda sol: sol.ground(_BOX, {'x': ['B1'], 'y': ['T1'], 'z': ['T2']}),
         check=_same_actions(_BOX, {'x': ['B1'], 'y': ['T1'], 'z': ['T2']}),
         show="Move(x,y,z) with x=B1, y=T1, z=T2  →  Move(B1,T1,T2)"),
    Test('untyped: 4^3 = 64 groundings (exam 16 Jan 2025)', call=lambda sol: sol.ground(_BOX, ['B1', 'B2', 'T1', 'T2']),
         check=_same_actions(_BOX, ['B1', 'B2', 'T1', 'T2']), show='Move(x,y,z) over B1, B2, T1, T2'),
    Test('typed parameters: 8 groundings', call=lambda sol: sol.ground(_BOX, {'x': ['B1', 'B2'], 'y': ['T1', 'T2'], 'z': ['T1', 'T2']}),
         check=_same_actions(_BOX, {'x': ['B1', 'B2'], 'y': ['T1', 'T2'], 'z': ['T1', 'T2']}),
         show='x in boxes, y and z in tables'),
    Test('negative preconditions and ≠: 240 Wumpus moves (exam 9 Feb 2023)', call=lambda sol: sol.ground(_WUMPUS, _CELLS),
         check=_same_actions(_WUMPUS, _CELLS), show='Move(c1,c2) over the 16 cells, c1≠c2'),
    Test('three inequalities: 24 Move actions (AIMA blocks world)', call=lambda sol: sol.ground(_AIMA_MOVE, ['A', 'B', 'C', 'Table']),
         check=_same_actions(_AIMA_MOVE, ['A', 'B', 'C', 'Table']), show='Move(b,x,y), b≠x, b≠y, x≠y over A, B, C, Table'),
    Test('a constant in the signature (AIMA spare tire)', call=lambda sol: sol.ground(_PUTON, {'t': ['Flat', 'Spare']}),
         check=_same_actions(_PUTON, {'t': ['Flat', 'Spare']}), show="PutOn(t,Axle) with {'t': ['Flat', 'Spare']}"),
    Test('a schema without parameters is one action', call=lambda sol: sol.ground(_LEAVE, ['Flat', 'Spare']),
         check=_same_actions(_LEAVE, ['Flat', 'Spare']), show='LeaveOvernight'),
]
