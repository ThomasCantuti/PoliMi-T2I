from harness import Test
from planning_lib import (Action, Schema, atoms, ground, ground_all, possible, fluents, satplan_sentences,
                          equivalent, show, symbols)

TITLE = 'Exam · Write the SATPlan sentences (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'SATPlan', 'fluent axiom', 'precondition axiom', 'action exclusion', 'Jun 2022', 'Sep 2023', 'Aug 2026']

STATEMENT = r"""
*Written exams of 14 June 2022, 9 February 2023, 8 September 2023, 18 January 2024, 16 January 2025,
14 January 2026, 11 June 2026, 31 August 2026 — Planning.* Write the answers **as data**: formulas are tuples
(`('not', f)`, `('and', …)`, `('or', …)`, `('implies', f, g)`, `('iff', f, g)`) over symbols written as in the
course — the ground atom glued together, then `^t`: `'AtR1^0'`, `'MoveR1L1L2^0'`, `'InBa1Bk1^1'`,
`'at-robotStorage^1'`, `'MoveCorridorStorage^0'`. Static atoms (Ball, Room, connected, …) get **no** symbol: only
fluents and possible ground actions are reified. Any equivalent formula is accepted (checked by truth table).

1. `TWO_ROOMS` (14 Jun 2022, $L = 1$): robot, rooms R1 and R2, init At(R1), goal At(R2);
   `MoveR  P: At(R1)  E: ¬At(R1), At(R2)`, `MoveL  P: At(R2)  E: ¬At(R2), At(R1)`. A dict with the five keys
   `'init'`, `'goal'`, `'precondition'`, `'fluent'`, `'exclusion'`, each a list of formulas.
2. `ROBOT_L` and `ROBOT` (8 Sep 2023): constants R1, L1, L2; init At(R1,L1); goal At(R1,L2);
   `Move(r,l,l')  P: At(r,l), l ≠ l'  E: ¬At(r,l), At(r,l')`. The shortest $L$ for which SATPlan finds a plan,
   and the complete encoding (dict as above) for that $L$.
3. `A1A2` (31 Aug 2026, $L = 2$): no constants, predicates A, B, init empty, goal A ∧ B;
   `a1()  P: —  E: A`; `a2()  P: A  E: B`. Dict as above. And `A1A2_SAT`: is it satisfiable (bool)?
4. `BASKETS_IN_FLUENTS` and `BASKETS_AXIOM` (18 Jan 2024): fixed baskets domain (problem x20; balls Ba1, Ba2,
   baskets Bk1, Bk2). All the fluents derived from In() (glued names, no time), and the fluent axiom of
   $InBa1Bk1^{1}$ (with $t = 0$).
5. `ARMS_AXIOMS` (14 Jan 2026): two-armed robot (problem x40). The fluent axioms of $AtRobotRA^1$ and of
   $CarryLeftB1^1$ (list of two formulas, $t = 0$). Action symbols: `MoveRARB`, `PickUpB1RALeft`, `DropB1RBLeft`, …
6. `WAREHOUSE_FLUENTS`, `WAREHOUSE_AXIOMS` (11 Jun 2026, problem x40): the list of all fluents (glued, no time)
   and a list with the fluent axiom of $at\text{-}robotStorage^1$ and the precondition axiom of
   $MoveCorridorStorage^0$.
7. `BOXES_COUNTS` (16 Jan 2025): boxes B1, B2, tables T1, T2, `Move(x,y,z)  P: Box(x), Table(y), Table(z),
   At(x,y)  E: At(x,z), ¬At(x,y)`, init At(B1,T1), At(B2,T1), goal At(B1,T2), At(B2,T2). For $L = 1$: the
   tuple (number of precondition axioms, of fluent axioms, of action exclusion axioms).
8. `WUMPUS_MOVES` (9 Feb 2023): the number of propositional symbols reifying `Move(c1,c2)` at one time step over
   the 16 cells: (in principle, with $c_1 \ne c_2$, with only adjacent cells) — a tuple of three ints.
"""

STARTER = '''TWO_ROOMS = {'init': [], 'goal': [], 'precondition': [], 'fluent': [], 'exclusion': []}

ROBOT_L = 0
ROBOT = {'init': [], 'goal': [], 'precondition': [], 'fluent': [], 'exclusion': []}

A1A2 = {'init': [], 'goal': [], 'precondition': [], 'fluent': [], 'exclusion': []}
A1A2_SAT = False

BASKETS_IN_FLUENTS = []
BASKETS_AXIOM = None

ARMS_AXIOMS = []

WAREHOUSE_FLUENTS = []
WAREHOUSE_AXIOMS = []

BOXES_COUNTS = (0, 0, 0)
WUMPUS_MOVES = (0, 0, 0)
'''

SOLUTION = '''TWO_ROOMS = {
    'init': ['AtR1^0', ('not', 'AtR2^0')],
    'goal': ['AtR2^1'],
    'precondition': [('implies', 'MoveR^0', 'AtR1^0'), ('implies', 'MoveL^0', 'AtR2^0')],
    'fluent': [('iff', 'AtR1^1', ('or', 'MoveL^0', ('and', 'AtR1^0', ('not', 'MoveR^0')))),
               ('iff', 'AtR2^1', ('or', 'MoveR^0', ('and', 'AtR2^0', ('not', 'MoveL^0'))))],
    'exclusion': [('or', ('not', 'MoveR^0'), ('not', 'MoveL^0'))],
}

ROBOT_L = 1
ROBOT = {
    'init': ['AtR1L1^0', ('not', 'AtR1L2^0')],
    'goal': ['AtR1L2^1'],
    'precondition': [('implies', 'MoveR1L1L2^0', 'AtR1L1^0'), ('implies', 'MoveR1L2L1^0', 'AtR1L2^0')],
    'fluent': [('iff', 'AtR1L1^1', ('or', 'MoveR1L2L1^0', ('and', 'AtR1L1^0', ('not', 'MoveR1L1L2^0')))),
               ('iff', 'AtR1L2^1', ('or', 'MoveR1L1L2^0', ('and', 'AtR1L2^0', ('not', 'MoveR1L2L1^0'))))],
    'exclusion': [('or', ('not', 'MoveR1L1L2^0'), ('not', 'MoveR1L2L1^0'))],
}

A1A2 = {
    'init': [('not', 'A^0'), ('not', 'B^0')],
    'goal': ['A^2', 'B^2'],
    'precondition': [('implies', 'a2^0', 'A^0'), ('implies', 'a2^1', 'A^1')],
    'fluent': [('iff', 'A^1', ('or', 'a1^0', 'A^0')), ('iff', 'A^2', ('or', 'a1^1', 'A^1')),
               ('iff', 'B^1', ('or', 'a2^0', 'B^0')), ('iff', 'B^2', ('or', 'a2^1', 'B^1'))],
    'exclusion': [('or', ('not', 'a1^0'), ('not', 'a2^0')), ('or', ('not', 'a1^1'), ('not', 'a2^1'))],
}
A1A2_SAT = True

BASKETS_IN_FLUENTS = ['InBa1Bk1', 'InBa1Bk2', 'InBa2Bk1', 'InBa2Bk2']
BASKETS_AXIOM = ('iff', 'InBa1Bk1^1', ('or', 'DropBa1Bk1^0', ('and', 'InBa1Bk1^0', ('not', 'PickUpBa1Bk1^0'))))

ARMS_AXIOMS = [
    ('iff', 'AtRobotRA^1', ('or', 'MoveRBRA^0', ('and', 'AtRobotRA^0', ('not', 'MoveRARB^0')))),
    ('iff', 'CarryLeftB1^1', ('or', 'PickUpB1RALeft^0', 'PickUpB1RBLeft^0',
                              ('and', 'CarryLeftB1^0', ('not', 'DropB1RALeft^0'), ('not', 'DropB1RBLeft^0')))),
]

WAREHOUSE_FLUENTS = ['at-robotStorage', 'at-robotCorridor', 'at-robotShipping', 'at-packagePKGStorage',
                     'at-packagePKGCorridor', 'at-packagePKGShipping', 'carryingPKG', 'handempty']
WAREHOUSE_AXIOMS = [
    ('iff', 'at-robotStorage^1', ('or', 'MoveCorridorStorage^0', ('and', 'at-robotStorage^0', ('not', 'MoveStorageCorridor^0')))),
    ('implies', 'MoveCorridorStorage^0', 'at-robotCorridor^0'),
]

BOXES_COUNTS = (8, 4, 28)
WUMPUS_MOVES = (256, 240, 48)
'''

HINTS = [
    'Init lists **every** fluent at time 0, negated if false; the goal is at time $L$; precondition, fluent and '
    'exclusion axioms for every $t = 0, \\dots, L-1$.',
    'Fluent axiom: $F^{t+1} \\Leftrightarrow$ (actions adding F)$^t$ $\\lor$ ($F^t \\land \\lnot$ (actions deleting F)$^t$). '
    'If nothing deletes F: $F^{t+1} \\Leftrightarrow$ (actions adding F)$^t \\lor F^t$.',
    'Counting: one precondition axiom per reified action, one fluent axiom per fluent, $n(n-1)/2$ exclusion '
    'axioms per time step. Only type-correct actions are reified (8 Move actions, 4 At fluents).',
    'Wumpus: $16 \\times 16$ pairs; minus the 16 with $c_1 = c_2$; the 4×4 grid has 24 adjacent pairs, each in two '
    'directions.',
]

EXPLANATION = r"""
**14 Jun 2022 / 8 Sep 2023 (official answers).** Init $AtR1^0 \land \lnot AtR2^0$; goal $AtR2^1$; precondition
axioms $MoveR^0 \Rightarrow AtR1^0$, $MoveL^0 \Rightarrow AtR2^0$; fluent axioms
$AtR1^1 \Leftrightarrow MoveL^0 \lor (AtR1^0 \land \lnot MoveR^0)$,
$AtR2^1 \Leftrightarrow MoveR^0 \lor (AtR2^0 \land \lnot MoveL^0)$; exclusion $\lnot MoveR^0 \lor \lnot MoveL^0$.
The robot of 8 Sep 2023 is the same with longer names; its shortest $L$ is **1** because the one-action plan
Move(R1,L1,L2) exists (and $L = 0$ fails: $\lnot AtR1L2^0$ vs $AtR1L2^0$). "For applying SATPlan the formulas must
be converted to CNF and checked for satisfiability."

**31 Aug 2026.** Fluents $A^t$, $B^t$, actions $a1^t$, $a2^t$; no precondition axiom for a1 (it has no
preconditions); fluent axioms without the "stays true unless deleted" negation, since nothing deletes A or B:
$A^1 \Leftrightarrow a1^0 \lor A^0$, etc. **Satisfiable**: the plan a1, a2 is a model — indeed the only one
($a1^0, a2^1$ true, everything else forced). With $L = 1$ it is unsatisfiable.

**18 Jan 2024.** "Assuming that meaningless fluents (like $InBa1Ba1^t$) are not generated": $InBa1Bk1$, $InBa1Bk2$,
$InBa2Bk1$, $InBa2Bk2$; $InBa1Bk1^{t+1} \Leftrightarrow DropBa1Bk1^t \lor (InBa1Bk1^t \land \lnot PickUpBa1Bk1^t)$
(after the fix PickUp deletes In(b,k); without the fix nothing would delete it).

**14 Jan 2026.** $AtRobotRA^{t+1} \Leftrightarrow MoveRBRA^t \lor (AtRobotRA^t \land \lnot MoveRARB^t)$;
$CarryLeftB1^{t+1} \Leftrightarrow (PickUpB1RALeft^t \lor PickUpB1RBLeft^t) \lor (CarryLeftB1^t \land
\lnot DropB1RALeft^t \land \lnot DropB1RBLeft^t)$.

**11 Jun 2026.** 8 fluents (3 robot positions, 3 package positions, carryingPKG, handempty);
$at\text{-}robotStorage^{t+1} \Leftrightarrow MoveCorridorStorage^t \lor (at\text{-}robotStorage^t \land
\lnot MoveStorageCorridor^t)$ and $MoveCorridorStorage^t \Rightarrow at\text{-}robotCorridor^t$ — connected() is
static and "accounted for by not reifying impossible actions like MoveStorageShipping".

**16 Jan 2025.** 8 precondition axioms (one per reified action Move(Bi, Tj, Tk)), 4 fluent axioms (one per fluent
At(Bi, Tj)), $\binom{8}{2} = 28$ exclusion axioms. (The official solution keeps $Bo1$, $Ta1$ as symbols in the
precondition axioms, $moveB1T1T1^t \Rightarrow Bo1^t \land Ta1^t \land Ta1^t \land AtB1T1^t$; the count does not
change. Its L = 0 answer also contains two typos: $\lnot AtB1T2^0$ is written twice instead of
$\lnot AtB1T2^0, \lnot AtB2T2^0$, and the goal $AtB1T2^0$ twice instead of $AtB1T2^0, AtB2T2^0$; and it says "a
precondition axiom for each fluent" where it means a fluent axiom.)

**9 Feb 2023.** "In principle … $16 \times 16 = 256$ propositional symbols" per time step; 240 if $c_1 \ne c_2$ is
used when grounding; 48 if Adj(c1,c2) is also used (24 adjacent pairs × 2 directions).
"""

ENTRY = 'TWO_ROOMS'

_KEYS = ('init', 'goal', 'precondition', 'fluent', 'exclusion')


def _glue(f):
    if isinstance(f, str):
        return f.replace('(', '').replace(')', '').replace(',', '')
    return (f[0],) + tuple(_glue(g) for g in f[1:])


def _ref(init, goal, actions, L):
    return {k: [_glue(f) for f in v] for k, v in satplan_sentences(init, goal, actions, L).items()}


def _matches(got, want):
    if not isinstance(got, list) or len(got) != len(want):
        return False, f'expected {len(want)} sentences, got {len(got) if isinstance(got, list) else got!r}'
    left = list(want)
    for g in got:
        try:
            hit = next((w for w in left if symbols(w) == symbols(g) and equivalent(g, w)), None)
        except Exception as e:
            return False, f'cannot evaluate {g!r}: {e}'
        if hit is None:
            return False, f'unexpected or wrong sentence {show(g)}; expected (in some order) {[show(w) for w in left]}'
        left.remove(hit)
    return True, ''


def _encoding(want):
    def check(got):
        if not isinstance(got, dict) or set(got) != set(_KEYS):
            return False, f'a dict with the keys {_KEYS}'
        for k in _KEYS:
            ok, msg = _matches(got[k], want[k])
            if not ok:
                return False, f'{k}: {msg}'
        return True, ' · '.join(show(f) for k in _KEYS for f in want[k])
    return check


def _formula(want):
    def check(got):
        try:
            ok = got is not None and equivalent(got, want)
        except Exception as e:
            return False, f'cannot evaluate {got!r}: {e}'
        return ok, f'expected (up to equivalence) {show(want)}'
    return check


_TWO = [Action('MoveR', atoms('At(R1)'), atoms('At(R2)'), atoms('At(R1)')),
        Action('MoveL', atoms('At(R2)'), atoms('At(R1)'), atoms('At(R2)'))]
_ROBOT = ground(Schema('Move(r,l,l2)', 'At(r,l), l≠l2', '¬At(r,l), At(r,l2)'), {'r': ['R1'], 'l': ['L1', 'L2'], 'l2': ['L1', 'L2']})
_AB = [Action('a1', frozenset(), atoms('A'), frozenset()), Action('a2', atoms('A'), atoms('B'), frozenset())]

_BASKETS = [Schema('PickUp(b,k)', 'Ball(b), Basket(k), At(k), In(b,k), Handfree', '¬In(b,k), ¬Handfree, Holding(b)'),
            Schema('Drop(b,k)', 'Ball(b), Basket(k), At(k), Holding(b)', '¬Holding(b), Handfree, In(b,k)'),
            Schema('Move(k1,k2)', 'Basket(k1), Basket(k2), At(k1)', '¬At(k1), At(k2)')]
_BK_I = atoms('Ball(Ba1), Ball(Ba2), Basket(Bk1), Basket(Bk2), Handfree, In(Ba1,Bk1), In(Ba2,Bk1), At(Bk1)')
_BK_A = possible(ground_all(_BASKETS, ['Ba1', 'Ba2', 'Bk1', 'Bk2']), _BK_I)
_BK_S = _ref(_BK_I, atoms('In(Ba1,Bk2), In(Ba2,Bk2)'), _BK_A, 1)

_ARMS = [Schema('Move(x,y)', 'Room(x), Room(y), x≠y, AtRobot(x)', '¬AtRobot(x), AtRobot(y)'),
         Schema('PickUp(x,y,z)', 'Ball(x), Room(y), Arm(z), AtBall(x,y), AtRobot(y), Free(z)', 'Carry(z,x), ¬AtBall(x,y), ¬Free(z)'),
         Schema('Drop(x,y,z)', 'Ball(x), Room(y), Arm(z), Carry(z,x), AtRobot(y)', '¬Carry(z,x), AtBall(x,y), Free(z)')]
_AR_I = atoms('Room(RA), Room(RB), Ball(B1), Ball(B2), Ball(B3), Ball(B4), Arm(Left), Arm(Right), Free(Left), Free(Right), '
              'AtRobot(RA), AtBall(B1,RA), AtBall(B2,RA), AtBall(B3,RA), AtBall(B4,RA)')
_AR_A = possible(ground_all(_ARMS, ['RA', 'RB', 'B1', 'B2', 'B3', 'B4', 'Left', 'Right']), _AR_I)
_AR_S = _ref(_AR_I, atoms('AtBall(B1,RB)'), _AR_A, 1)

_R3 = ['Storage', 'Corridor', 'Shipping']
_WH = [Schema('Move(from,to)', 'at-robot(from), connected(from,to)', '¬at-robot(from), at-robot(to)'),
       Schema('Pickup(p,r)', 'at-robot(r), at-package(p,r), handempty', 'carrying(p), ¬at-package(p,r), ¬handempty'),
       Schema('Drop(p,r)', 'at-robot(r), carrying(p)', 'at-package(p,r), handempty, ¬carrying(p)')]
_WH_I = atoms('at-robot(Storage), at-package(PKG,Storage), handempty, connected(Storage,Corridor), '
              'connected(Corridor,Storage), connected(Corridor,Shipping), connected(Shipping,Corridor)')
_WH_A = possible(ground_all(_WH, {'from': _R3, 'to': _R3, 'p': ['PKG'], 'r': _R3}), _WH_I)
_WH_S = _ref(_WH_I, atoms('at-package(PKG,Shipping)'), _WH_A, 1)

_BOX = ground(Schema('Move(x,y,z)', 'Box(x), Table(y), Table(z), At(x,y)', 'At(x,z), ¬At(x,y)'),
              ['B1', 'B2', 'T1', 'T2'])
_BOX_I = atoms('Box(B1), Box(B2), Table(T1), Table(T2), At(B1,T1), At(B2,T1)')
_BOX_S = satplan_sentences(_BOX_I, atoms('At(B1,T2), At(B2,T2)'), _BOX, 1)


def _pick(sentences, head):
    return next(f for f in sentences if f[1] == head)


def _same_set(want):
    return lambda got: (isinstance(got, (list, tuple)) and sorted(got) == sorted(want) and len(set(got)) == len(got),
                        f'expected {len(want)} fluents: {sorted(want)}')


TESTS = [
    Test('14 Jun 2022: two rooms, L = 1', call=lambda sol: sol.TWO_ROOMS,
         check=_encoding(_ref(atoms('At(R1)'), atoms('At(R2)'), _TWO, 1)), show='TWO_ROOMS'),
    Test('8 Sep 2023: shortest L', call=lambda sol: sol.ROBOT_L, expected=1, show='ROBOT_L'),
    Test('8 Sep 2023: complete encoding', call=lambda sol: sol.ROBOT,
         check=_encoding(_ref(atoms('At(R1,L1)'), atoms('At(R1,L2)'), _ROBOT, 1)), show='ROBOT'),
    Test('31 Aug 2026: a1, a2, L = 2', call=lambda sol: sol.A1A2,
         check=_encoding(_ref(frozenset(), atoms('A, B'), _AB, 2)), show='A1A2'),
    Test('31 Aug 2026: satisfiable?', call=lambda sol: sol.A1A2_SAT, expected=True, show='A1A2_SAT'),
    Test('18 Jan 2024: fluents from In()', call=lambda sol: sol.BASKETS_IN_FLUENTS,
         check=_same_set([f for f in (_glue(x) for x in fluents(_BK_A)) if f.startswith('In')]), show='BASKETS_IN_FLUENTS'),
    Test('18 Jan 2024: fluent axiom of InBa1Bk1', call=lambda sol: sol.BASKETS_AXIOM,
         check=_formula(_pick(_BK_S['fluent'], 'InBa1Bk1^1')), show='BASKETS_AXIOM'),
    Test('14 Jan 2026: fluent axioms of AtRobotRA and CarryLeftB1', call=lambda sol: sol.ARMS_AXIOMS,
         check=lambda got: _matches(got, [_pick(_AR_S['fluent'], 'AtRobotRA^1'), _pick(_AR_S['fluent'], 'CarryLeftB1^1')]),
         show='ARMS_AXIOMS'),
    Test('11 Jun 2026: all the fluents', call=lambda sol: sol.WAREHOUSE_FLUENTS,
         check=_same_set([_glue(f) for f in fluents(_WH_A)]), show='WAREHOUSE_FLUENTS'),
    Test('11 Jun 2026: a fluent axiom and a precondition axiom', call=lambda sol: sol.WAREHOUSE_AXIOMS,
         check=lambda got: _matches(got, [_pick(_WH_S['fluent'], 'at-robotStorage^1'),
                                         _pick(_WH_S['precondition'], 'MoveCorridorStorage^0')]),
         show='WAREHOUSE_AXIOMS'),
    Test('16 Jan 2025: axioms for L = 1', call=lambda sol: tuple(sol.BOXES_COUNTS),
         expected=(len(_BOX_S['precondition']), len(_BOX_S['fluent']), len(_BOX_S['exclusion'])), show='BOXES_COUNTS'),
    Test('9 Feb 2023: Move symbols per time step', call=lambda sol: tuple(sol.WUMPUS_MOVES), expected=(256, 240, 48),
         show='WUMPUS_MOVES'),
]
