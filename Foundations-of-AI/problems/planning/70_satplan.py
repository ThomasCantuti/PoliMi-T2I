import itertools

from harness import Test
from planning_lib import (Action, Schema, atoms, ground, satplan_sentences, equivalent, show, symbols, is_plan,
                          spare_tire)

TITLE = 'SATPlan: the full encoding and the loop over L'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['SATPlan', 'propositional logic', 'SAT', 'closed-world assumption', 'plan extraction']

STATEMENT = r"""
SATPlan (AIMA §7.7.4) asks a SAT solver whether a plan of length $L$ exists, for $L = 0, 1, 2, \dots$

```text
function SATPLAN(init, transition, goal, Lmax) returns solution or failure
    for L = 0 to Lmax do
        cnf <- TRANSLATE-TO-SAT(init, transition, goal, L)
        model <- SAT-SOLVER(cnf)
        if model is not null then return EXTRACT-SOLUTION(model)
    return failure
```

1. `satplan_sentences(init, goal, actions, L)` → a dict with five lists of formulas (same tuple syntax and
   `'X^t'` symbols as problem 60):
   - `'init'`: for **every fluent** $F$, $F^0$ if $F \in$ init, else $\lnot F^0$;
   - `'goal'`: $G^L$ for every goal atom;
   - `'precondition'`, `'fluent'`, `'exclusion'`: the axioms of problem 60 for every $t = 0, \dots, L-1$.

   The fluents are the atoms that some action adds or deletes (`fluents(actions)` in `planning_lib`); the other
   atoms are static and get no symbol. `actions` contains only the possible (type-correct) ground actions.
2. `satplan(init, goal, actions, L_max)` → the plan (list of action names, in time order) for the **smallest**
   satisfiable $L \le L_{max}$, or `None`. Use `satisfiable(list_of_formulas)` from `planning_lib`: it returns a
   model `{symbol: bool}` or `None`. The plan is read from the action symbols that are true in the model.
"""

STARTER = '''import itertools
from planning_lib import Action, fluents, satisfiable

def sym(x: str, t: int) -> str:
    return f'{x}^{t}'

def satplan_sentences(init: frozenset, goal: frozenset, actions: list[Action], L: int) -> dict[str, list]:
    out = {'init': [], 'goal': [], 'precondition': [], 'fluent': [], 'exclusion': []}
    # TODO
    return out

def satplan(init: frozenset, goal: frozenset, actions: list[Action], L_max: int) -> list[str] | None:
    # TODO: for L = 0 .. L_max: encode, satisfiable(...), extract the plan
    return None
'''

SOLUTION = '''import itertools
from planning_lib import Action, fluents, satisfiable

def sym(x: str, t: int) -> str:
    return f'{x}^{t}'

def satplan_sentences(init: frozenset, goal: frozenset, actions: list[Action], L: int) -> dict[str, list]:
    fl = fluents(actions)
    out = {'init': [sym(f, 0) if f in init else ('not', sym(f, 0)) for f in fl],
           'goal': [sym(g, L) for g in sorted(goal)],
           'precondition': [], 'fluent': [], 'exclusion': []}
    for t in range(L):
        for a in actions:
            lits = [sym(p, t) for p in sorted(a.pre) if p in fl] + \\
                   [('not', sym(p, t)) for p in sorted(a.neg) if p in fl]
            if lits:
                out['precondition'].append(('implies', sym(a.name, t), ('and', *lits)))
        for f in fl:
            causes = [sym(a.name, t) for a in actions if f in a.add]
            causes_not = [sym(a.name, t) for a in actions if f in a.delete and f not in a.add]
            out['fluent'].append(('iff', sym(f, t + 1),
                                  ('or', *causes, ('and', sym(f, t), ('not', ('or', *causes_not))))))
        for a, b in itertools.combinations(actions, 2):
            out['exclusion'].append(('or', ('not', sym(a.name, t)), ('not', sym(b.name, t))))
    return out

def satplan(init: frozenset, goal: frozenset, actions: list[Action], L_max: int) -> list[str] | None:
    for L in range(L_max + 1):
        groups = satplan_sentences(init, goal, actions, L)
        model = satisfiable([f for group in groups.values() for f in group])
        if model is not None:
            return [a.name for t in range(L) for a in actions if model.get(sym(a.name, t))]
    return None
'''

HINTS = [
    'Init must list **every** fluent at time 0, negated when it is not in `init`: a SAT solver knows nothing about '
    'the closed-world assumption, so an unconstrained $F^0$ could be chosen true.',
    'The goal only constrains the **last** time step $L$; with $L = 0$ there are no actions and no axioms: the '
    'sentence is init ∧ goal.',
    'Loop `for t in range(L)` and reuse the three axiom constructions of problem 60.',
    'Plan extraction: `[a.name for t in range(L) for a in actions if model.get(sym(a.name, t))]` — at most one '
    'action per step thanks to the exclusion axioms.',
]

EXPLANATION = r"""
**What a model is.** A satisfying assignment fixes the truth of every fluent at every time step (a sequence of
states) and of every action symbol (which action happens when). The precondition axioms make the actions
legal, the fluent axioms make the states follow from the actions, init and goal pin the two ends: the true
action symbols, read in time order, are a plan.

**Why iterate on L?** SAT solvers answer yes/no for a fixed formula; the formula must fix the horizon. Starting
from $L = 0$ and stopping at the first satisfiable $L$ returns a **shortest** plan (3 actions for the spare tire).
With $L$ larger than needed the formula is still satisfiable, because nothing forces an action at every step:
the two-rooms encoding with $L = 2$ has 2 models (move at step 0 or at step 1).

**L = 0 (exam 16 Jan 2025).** The sentence is init ∧ goal: $\lnot AtB1T2^0$ and $AtB1T2^0$ are both unit clauses,
so DPLL fails immediately: no plan with zero actions.

**Size.** Per time step: one symbol per fluent and per ground action, $|A|$ precondition axioms, $|F|$ fluent
axioms and $|A|(|A| - 1)/2$ exclusion axioms — quadratic in the number of ground actions. That is why reifying
only the possible actions (type-correct, static preconditions true) matters: 8 Move symbols instead of 64 in
the two-boxes problem. The simple backtracking `satisfiable` of `planning_lib` solves these small encodings
instantly but would need seconds for the 6-step Sussman anomaly; real planners use CDCL SAT solvers.
"""

ENTRY = 'satplan'

_TWO = [Action('MoveR', atoms('At(R1)'), atoms('At(R2)'), atoms('At(R1)')),
        Action('MoveL', atoms('At(R2)'), atoms('At(R1)'), atoms('At(R2)'))]
_AB = [Action('a1', frozenset(), atoms('A'), frozenset()), Action('a2', atoms('A'), atoms('B'), frozenset())]
_BOX = ground(Schema('Move(x,y,z)', 'Box(x), Table(y), Table(z), At(x,y)', 'At(x,z), ¬At(x,y)'),
              {'x': ['B1', 'B2'], 'y': ['T1', 'T2'], 'z': ['T1', 'T2']})
_BOXI = atoms('Box(B1), Box(B2), Table(T1), Table(T2), At(B1,T1), At(B2,T1)')
_BOXG = atoms('At(B1,T2), At(B2,T2)')
_KEYS = ('init', 'goal', 'precondition', 'fluent', 'exclusion')


def _matches(got, want):
    if not isinstance(got, list) or len(got) != len(want):
        return False, f'expected {len(want)} sentences, got {len(got) if isinstance(got, list) else got!r}'
    left = list(want)
    for g in got:
        hit = next((w for w in left if symbols(w) == symbols(g) and equivalent(g, w)), None)
        if hit is None:
            return False, f'unexpected or wrong sentence {show(g)}'
        left.remove(hit)
    return True, ''


def _encoding(init, goal, actions, L):
    want = satplan_sentences(init, goal, actions, L)

    def check(got, *args):
        if not isinstance(got, dict) or set(got) != set(_KEYS):
            return False, f'return a dict with the keys {_KEYS}'
        for k in _KEYS:
            ok, msg = _matches(got[k], want[k])
            if not ok:
                return False, f'{k}: {msg}'
        return True, ', '.join(f'{k}: {len(want[k])}' for k in _KEYS)
    return check


def _plan(init, goal, actions, length):
    def check(got, *args):
        if length is None:
            return got is None, f'expected None, got {got!r}'
        if not isinstance(got, list) or len(got) != length or not is_plan(init, goal, actions, got):
            return False, f'expected a valid plan of {length} actions, got {got!r}'
        return True
    return check


_TI, _TG, _TA = spare_tire()

TESTS = [
    Test('encoding: two rooms, L = 1 (exam 14 Jun 2022)', call=lambda sol: sol.satplan_sentences(atoms('At(R1)'), atoms('At(R2)'), _TWO, 1),
         check=_encoding(atoms('At(R1)'), atoms('At(R2)'), _TWO, 1), show='MoveR, MoveL; init At(R1); goal At(R2)'),
    Test('encoding: L = 0 is init and goal only', call=lambda sol: sol.satplan_sentences(_BOXI, _BOXG, _BOX, 0),
         check=_encoding(_BOXI, _BOXG, _BOX, 0), show='two boxes, two tables (exam 16 Jan 2025)'),
    Test('encoding: two boxes, L = 1 (8 / 4 / 28 axioms)', call=lambda sol: sol.satplan_sentences(_BOXI, _BOXG, _BOX, 1),
         check=_encoding(_BOXI, _BOXG, _BOX, 1), show='exam 16 Jan 2025'),
    Test('encoding: a1, a2, L = 2 (exam 31 Aug 2026)', call=lambda sol: sol.satplan_sentences(frozenset(), atoms('A, B'), _AB, 2),
         check=_encoding(frozenset(), atoms('A, B'), _AB, 2), show='a1: E A;  a2: P A, E B;  init empty; goal A, B'),
    Test('plan: two rooms', args=(atoms('At(R1)'), atoms('At(R2)'), _TWO, 3), expected=['MoveR'], show='L_max = 3'),
    Test('plan: a1 then a2', args=(frozenset(), atoms('A, B'), _AB, 3), expected=['a1', 'a2'], show='L_max = 3'),
    Test('plan: nothing to do', args=(atoms('A, B'), atoms('A, B'), _AB, 3), expected=[], show='the goal holds at L = 0'),
    Test('plan: two boxes', args=(_BOXI, _BOXG, _BOX, 3), check=_plan(_BOXI, _BOXG, _BOX, 2), show='L_max = 3'),
    Test('plan: spare tire (AIMA Fig. 11.2, negative preconditions)', args=(_TI, _TG, _TA, 4),
         check=_plan(_TI, _TG, _TA, 3), show='L_max = 4'),
    Test('no plan within L_max', args=(_BOXI, _BOXG, _BOX, 1), expected=None, show='two boxes need 2 moves; L_max = 1'),
]
