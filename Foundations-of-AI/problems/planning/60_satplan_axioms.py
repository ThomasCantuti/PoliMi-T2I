import itertools

from harness import Test
from planning_lib import Action, Schema, atoms, ground, fluents, equivalent, show, symbols

TITLE = 'SATPlan building blocks: precondition, fluent and exclusion axioms'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['SATPlan', 'fluent axiom', 'successor-state axiom', 'precondition axiom', 'action exclusion']

STATEMENT = r"""
SATPlan gives every ground fluent $F$ a symbol $F^t$ per time step and every ground action $A$ a symbol $A^t$
($A$ is executed at time $t$). In code the symbols are strings `'At(R1)^0'`, `'MoveR^0'` (the course writes
$AtR1^0$, $MoveR^0$); use `sym(x, t)` = `f'{x}^{t}'`. Formulas are nested tuples:
`('not', f)`, `('and', f, g, ...)`, `('or', f, g, ...)`, `('implies', f, g)`, `('iff', f, g)`.

Implement the three axiom families of one time step $t$ (AIMA §7.7.4):

1. `precondition_axiom(a, t, fl)` → $A^t \Rightarrow \bigwedge \textit{PRE}(A)^t$, using only the preconditions
   that are fluents (`fl`, a set of atoms); negative preconditions (`a.neg`) appear negated. Return `None` if the
   action has no fluent precondition.
2. `fluent_axiom(f, t, actions)` → the successor-state axiom
   $$F^{t+1} \Leftrightarrow \textit{ActionCausesF}^t \lor (F^t \land \lnot \textit{ActionCausesNotF}^t)$$
   where *ActionCausesF* is the disjunction of the actions that add $F$ and *ActionCausesNotF* that of the
   actions that delete $F$ **without adding it**.
3. `exclusion_axioms(actions, t)` → the list of $\lnot A_i^t \lor \lnot A_j^t$, one per **pair** of actions.

Two rooms (exam 14 Jun 2022), $t = 0$: $MoveR^0 \Rightarrow AtR1^0$;
$AtR1^1 \Leftrightarrow MoveL^0 \lor (AtR1^0 \land \lnot MoveR^0)$; $\lnot MoveR^0 \lor \lnot MoveL^0$.
The tests compare your formulas with the expected ones by **truth table**, so any equivalent form is accepted
(e.g. `('or', ('not', x), y)` for an implication, or an empty `('or',)` = False).
"""

STARTER = '''from planning_lib import Action

def sym(x: str, t: int) -> str:
    return f'{x}^{t}'

def precondition_axiom(a: Action, t: int, fl: set[str]):
    # TODO: ('implies', sym(a.name, t), ('and', ...)) or None
    return None

def fluent_axiom(f: str, t: int, actions: list[Action]):
    # TODO: ('iff', sym(f, t + 1), ...)
    return None

def exclusion_axioms(actions: list[Action], t: int) -> list:
    # TODO
    return []
'''

SOLUTION = '''import itertools
from planning_lib import Action

def sym(x: str, t: int) -> str:
    return f'{x}^{t}'

def precondition_axiom(a: Action, t: int, fl: set[str]):
    lits = [sym(p, t) for p in sorted(a.pre) if p in fl] + \\
           [('not', sym(p, t)) for p in sorted(a.neg) if p in fl]
    if not lits:
        return None
    return ('implies', sym(a.name, t), ('and', *lits))

def fluent_axiom(f: str, t: int, actions: list[Action]):
    causes = [sym(a.name, t) for a in actions if f in a.add]
    causes_not = [sym(a.name, t) for a in actions if f in a.delete and f not in a.add]
    stays = ('and', sym(f, t), ('not', ('or', *causes_not)))
    return ('iff', sym(f, t + 1), ('or', *causes, stays))

def exclusion_axioms(actions: list[Action], t: int) -> list:
    return [('or', ('not', sym(a.name, t)), ('not', sym(b.name, t)))
            for a, b in itertools.combinations(actions, 2)]
'''

HINTS = [
    'Precondition axiom: collect `sym(p, t)` for the positive fluent preconditions and `("not", sym(p, t))` for '
    'the negative ones; if the list is empty return `None` (exam 31 Aug 2026: "no preconditions for action a1").',
    'Fluent axiom: `causes` = actions with `f in a.add`, `causes_not` = actions with `f in a.delete` and not in '
    '`a.add`. An empty `("or",)` is False, so `("not", ("or",))` is True: no special case is needed.',
    'Exclusion: `itertools.combinations(actions, 2)` gives each unordered pair once.',
]

EXPLANATION = r"""
**Why an implication for preconditions?** Executing $A$ *requires* its preconditions; the preconditions do not
*force* $A$. Static preconditions (`Box(B1)`, `Connected(x,y)`) are left out: they never change, and the actions
whose static preconditions are false are simply not reified (exam 11 Jun 2026: "connected(Corridor, Storage) is
not a fluent and it is accounted for by not reifying impossible actions"). The official solution of 16 Jan 2025
keeps them as symbols ($Bo1^t$, $Ta1^t$) instead: also correct, just longer.

**Why a biconditional for fluents?** The $\Leftarrow$ direction says how $F$ becomes or stays true; the
$\Rightarrow$ direction says that **nothing else** makes it true. Together they solve the frame problem in
propositional logic: without them, a model could flip $AtR2^1$ to true with no action at all.

**The add-and-delete corner case.** `Move(B1,T1,T1)` (exam 16 Jan 2025) adds and deletes `At(B1,T1)`. With
RESULT $= (s - \textit{DEL}) \cup \textit{ADD}$ the atom stays true, so the action belongs to *ActionCausesF* only.
The official axiom lists it in both disjunctions,
$AtB1T1^1 \Leftrightarrow (moveB1T1T1^0 \lor moveB1T2T1^0) \lor (AtB1T1^0 \land \lnot(moveB1T1T1^0 \lor moveB1T1T2^0))$:
it is equivalent, because when $moveB1T1T1^0$ is true the first disjunct already holds.

**Why pairwise exclusion?** $\lnot A_1^t \lor \dots \lor \lnot A_n^t$ only forbids executing **all** actions at
once; it is satisfied with up to $n - 1$ simultaneous actions (exam 3 Feb 2025). One clause per pair, $n(n-1)/2$
clauses per step, says "at most one action at a time".

**Counting (exam 16 Jan 2025, L = 1).** 8 reified Move actions → 8 precondition axioms; 4 fluents At(Bi,Tj) →
4 fluent axioms; $\binom{8}{2} = 28$ exclusion axioms.
"""

ENTRY = 'exclusion_axioms'


def _sym(x, t):
    return f'{x}^{t}'


def _pre_ref(a, t, fl):
    lits = [_sym(p, t) for p in sorted(a.pre) if p in fl] + [('not', _sym(p, t)) for p in sorted(a.neg) if p in fl]
    return ('implies', _sym(a.name, t), ('and', *lits)) if lits else None


def _flu_ref(f, t, actions):
    causes = [_sym(a.name, t) for a in actions if f in a.add]
    causes_not = [_sym(a.name, t) for a in actions if f in a.delete and f not in a.add]
    return ('iff', _sym(f, t + 1), ('or', *causes, ('and', _sym(f, t), ('not', ('or', *causes_not)))))


def _equiv(got, want):
    if want is None:
        return (got is None, f'expected None, got {got!r}')
    try:
        if got is None or not equivalent(got, want):
            return False, f'expected (up to equivalence) {show(want)}, got {show(got) if got else None}'
    except Exception as e:
        return False, f'cannot evaluate your formula {got!r}: {type(e).__name__}: {e}'
    return True, show(got)


def _matches(got, want):
    if not isinstance(got, list) or len(got) != len(want):
        return False, f'expected {len(want)} axioms, got {len(got) if isinstance(got, list) else got!r}'
    left = list(want)
    for g in got:
        hit = next((w for w in left if symbols(w) == symbols(g) and equivalent(g, w)), None)
        if hit is None:
            return False, f'unexpected or wrong axiom {show(g)}'
        left.remove(hit)
    return True, f'{len(want)} axioms'


_TWO = [Action('MoveR', atoms('At(R1)'), atoms('At(R2)'), atoms('At(R1)')),
        Action('MoveL', atoms('At(R2)'), atoms('At(R1)'), atoms('At(R2)'))]
_AB = [Action('a1', frozenset(), atoms('A'), frozenset()), Action('a2', atoms('A'), atoms('B'), frozenset())]
_BOX = ground(Schema('Move(x,y,z)', 'Box(x), Table(y), Table(z), At(x,y)', 'At(x,z), ¬At(x,y)'),
              {'x': ['B1', 'B2'], 'y': ['T1', 'T2'], 'z': ['T1', 'T2']})
_BOXFL = set(fluents(_BOX))
_LAMP = [Action('SwitchOn', frozenset(), atoms('Light'), frozenset(), atoms('Light')),
         Action('SwitchOff', atoms('Light'), frozenset(), atoms('Light'))]


def _pre(a, t, fl):
    return Test(f'precondition axiom {a.name}^{t}', call=lambda sol: sol.precondition_axiom(a, t, fl),
                check=lambda got: _equiv(got, _pre_ref(a, t, fl)), show=f'{a.name}, t = {t}')


def _flu(f, t, actions, note=''):
    return Test(f'fluent axiom {f}^{t + 1}{note}', call=lambda sol: sol.fluent_axiom(f, t, actions),
                check=lambda got: _equiv(got, _flu_ref(f, t, actions)), show=f'{f}, t = {t}')


TESTS = [
    _pre(_TWO[0], 0, {'At(R1)', 'At(R2)'}),
    _pre(_AB[1], 1, {'A', 'B'}),
    _pre(_AB[0], 0, {'A', 'B'}),
    _pre(_BOX[1], 0, _BOXFL),
    _pre(_LAMP[0], 2, {'Light'}),
    _flu('At(R1)', 0, _TWO, ' (exam 14 Jun 2022)'),
    _flu('At(R2)', 3, _TWO),
    _flu('B', 1, _AB, ': nothing deletes B (exam 31 Aug 2026)'),
    _flu('At(B1,T1)', 0, _BOX, ': Move(B1,T1,T1) adds and deletes it (exam 16 Jan 2025)'),
    _flu('At(B2,T2)', 0, _BOX),
    _flu('Light', 0, _LAMP, ': negative precondition'),
    Test('exclusion axioms, two rooms', args=(_TWO, 0),
         check=lambda got, *a: _matches(got, [('or', ('not', 'MoveR^0'), ('not', 'MoveL^0'))]), show='MoveR, MoveL, t = 0'),
    Test('exclusion axioms, 8 Move actions: 28 pairs', args=(_BOX, 0),
         check=lambda got, *a: _matches(got, [('or', ('not', f'{x.name}^0'), ('not', f'{y.name}^0'))
                                              for x, y in itertools.combinations(_BOX, 2)]),
         show='exam 16 Jan 2025, t = 0'),
    Test('exclusion axioms at t = 1', args=(_AB, 1),
         check=lambda got, *a: _matches(got, [('or', ('not', 'a1^1'), ('not', 'a2^1'))]), show='a1, a2, t = 1'),
]
