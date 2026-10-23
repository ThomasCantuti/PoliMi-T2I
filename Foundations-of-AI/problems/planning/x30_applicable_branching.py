from harness import Test
from planning_lib import Schema, atoms, ground, possible, split_atom

TITLE = 'Exam · Applicable actions and branching factor (2022–2026)'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['exam', 'applicable actions', 'branching factor', 'forward planning', 'grounding']

STATEMENT = r"""
*Written exams of 14 July 2022, 18 January 2023, 9 February 2023, 20 June 2024, 12 July 2024, 3 February 2025,
8 September 2025, 14 January 2026, 6 February 2026 — Planning.* "Considering forward planning, how many actions
are applicable in the initial state? Report their signatures" and "what is the branching factor?".

Implement:

1. `applicable_ground(schemas, objects, state)` → the names of the ground actions applicable in `state`, in
   grounding order (schemas in order, `itertools.product` order inside a schema). Use `ground(schema, objects)`
   from `planning_lib` (objects: list or `{parameter: list}` for typed parameters).
2. `max_branching(init, actions)` → the maximum number of applicable actions over all the states reachable from
   `init` (the maximum branching factor of the forward search tree).

The exam domains used by the tests (P = precondition, E = effect):

| exam | schemas | initial state | official answer |
|---|---|---|---|
| 18 Jan 2023 | PickUp(o,t) P: HandAt(t), On(o,t), HandEmpty; PutDown(o,t) P: Holding(o), HandAt(t); Move(t1,t2) P: HandAt(t1), Table(t1), Table(t2), t1≠t2 | 2 boxes, 2 books on T1, hand empty at T1 | 5 |
| 9 Feb 2023 | Move / MoveToWumpusCell / MoveToPitCell (problem x20) | agent in 11, Wumpus 13, pits 31, 33, 44 | 2 |
| 20 Jun 2024 | Hanoi Move(x,y,z) (problem x20) | 4 discs on peg1 | 2 |
| 12 Jul 2024 | move-object(ℓ,ℓ′,o), move(ℓ,ℓ′), paint(o,o′,o″); o ranges over the objects O1…O6 | all objects and the robot at A, unpainted | 7 |
| 3 Feb 2025 | Move(x,y,z) P: At(x,y), Location(y), Location(z), y≠z; Assemble, Disassemble (at B), Check (at C) | O1, O2, O3 at A, assembled | 6 |
| 8 Sep 2025 | GetSite(x) P: — (problem x10) | 3 objects A, B, C | 3 children of the root |
| 14 Jan 2026 | Move(x,y), PickUp(x,y,z), Drop(x,y,z) (ball x, room y, arm z) | robot and 4 balls in RA, both arms free | 9 |
| 14 Jul 2022 | Move$_{x\text{-}x'}$: P At(R$_x$), E ¬At(R$_x$), At(R$_{x'}$), any $x \ne x'$ / only $x' = x \pm 1$ | robot in R1 | branching $n - 1$ / 2 |
| 6 Feb 2026 | Mars rover Move with fuel (problem x20) + Recharging(x,z) at L3 | L1, fuel 5 | branching 3 |
"""

STARTER = '''from collections import deque
from planning_lib import Action, Schema, ground, applicable, result

def applicable_ground(schemas: list[Schema], objects, state: frozenset) -> list[str]:
    # TODO
    return []

def max_branching(init: frozenset, actions: list[Action]) -> int:
    # TODO: visit every reachable state, count its applicable actions
    return 0
'''

SOLUTION = '''from collections import deque
from planning_lib import Action, Schema, ground, applicable, result

def applicable_ground(schemas: list[Schema], objects, state: frozenset) -> list[str]:
    return [a.name for s in schemas for a in ground(s, objects) if applicable(state, a)]

def max_branching(init: frozenset, actions: list[Action]) -> int:
    seen, queue, best = {init}, deque([init]), 0
    while queue:
        s = queue.popleft()
        children = [a for a in actions if applicable(s, a)]
        best = max(best, len(children))
        for a in children:
            s1 = result(s, a)
            if s1 not in seen:
                seen.add(s1)
                queue.append(s1)
    return best
'''

HINTS = [
    '`applicable_ground` is one list comprehension over `schemas` and `ground(s, objects)`.',
    '`max_branching`: BFS over the reachable states (a `seen` set), and keep the maximum of '
    '`len([a for a in actions if applicable(s, a)])`.',
]

EXPLANATION = r"""
**How to answer in the exam.** Ground every schema, and for each candidate check **every** precondition
against the initial state (closed world: an atom not listed is false). List the signatures:

- 18 Jan 2023: PickUp(Bx1,T1), PickUp(Bx2,T1), PickUp(Bk1,T1), PickUp(Bk2,T1), Move(T1,T2) — **5**;
- 9 Feb 2023: Move(11,12), Move(11,21) — **2** (12 and 21 hold only a stench and a breeze);
- 20 Jun 2024: Move(d4,d3,peg2), Move(d4,d3,peg3) — **2** (only d4 is clear; its targets must be clear and larger);
- 12 Jul 2024: move-object(A,B,Oi) for the 6 objects and move(A,B) — **7**;
- 3 Feb 2025: Move(Oi,A,B), Move(Oi,A,C) for 3 objects — **6**;
- 8 Sep 2025, 3 objects: GetSite(A), GetSite(B), GetSite(C) — **3**;
- 14 Jan 2026: Move(RA,RB) and PickUp(Bi,RA,arm) for 4 balls × 2 arms — **9**.

> **Exam trap (12 Jul 2024).** The painting model only has the predicates location, at, painted: nothing in
> move-object(ℓ,ℓ′,o) says that o is an *object*. Grounded over **all** constants, `move-object(A,B,Robot)` is
> applicable too (at(A,Robot) holds twice) and the count is 8 — it is a duplicate of move(A,B). The official
> answer 7 assumes, as the statement says, that o ranges over the objects. Say which assumption you make.

**Branching factor.** 14 Jul 2022: with moves between any two rooms, every state has $n - 1$ successors forward,
and every single-literal goal At(R$_x$) has $n - 1$ relevant actions backward (Move$_{x'\text{-}x}$): the same branching
factor, so forward and backward planning are equivalent (the official solution says "$n$"; the exact value is
$n - 1$, as the $n - 1$ children At(R1) … At(R$_{n-1}$) of the backward root show). With moves only between adjacent
rooms it is 2 in both directions (1 at the two ends). 6 Feb 2026: at most 3 successors (e.g. at L3 with enough
fuel: move to L2, move to L4, recharge) in both the PDDL and the STRIPS formulation, because the STRIPS schemas
Move-Fuel2 … Move-Fuel5 produce exactly the same ground actions as the PDDL Move with $z \in \{2, \dots, 5\}$.
"""

ENTRY = 'applicable_ground'

_ARM = [Schema('PickUp(o,t)', 'HandAt(t), On(o,t), HandEmpty', '¬On(o,t), ¬HandEmpty, Holding(o)'),
        Schema('PutDown(o,t)', 'Holding(o), HandAt(t)', '¬Holding(o), HandEmpty, On(o,t)'),
        Schema('Move(t1,t2)', 'HandAt(t1), Table(t1), Table(t2), t1≠t2', '¬HandAt(t1), HandAt(t2)')]
_ARM_I = atoms('Box(Bx1), Box(Bx2), Book(Bk1), Book(Bk2), Table(T1), Table(T2), HandEmpty, On(Bx1,T1), On(Bx2,T1), '
               'On(Bk1,T1), On(Bk2,T1), HandAt(T1)')

_CELLS = ['{}{}'.format(x, y) for x in range(1, 5) for y in range(1, 5)]
_WUMPUS = [Schema('Move(c1,c2)', 'Alive, At(Agent,c1), Adj(c1,c2), ¬At(Pit,c2), ¬At(Wumpus,c2), c1≠c2', '¬At(Agent,c1), At(Agent,c2)'),
           Schema('MoveToWumpusCell(c1,c2)', 'Alive, At(Agent,c1), Adj(c1,c2), ¬At(Pit,c2), At(Wumpus,c2), c1≠c2',
                  '¬At(Agent,c1), At(Agent,c2), ¬Alive'),
           Schema('MoveToPitCell(c1,c2)', 'Alive, At(Agent,c1), Adj(c1,c2), At(Pit,c2), ¬At(Wumpus,c2), c1≠c2',
                  '¬At(Agent,c1), At(Agent,c2), ¬Alive')]
_W_I = frozenset({f'Adj({a},{b})' for a in _CELLS for b in _CELLS
                  if abs(int(a[0]) - int(b[0])) + abs(int(a[1]) - int(b[1])) == 1}) | \
    atoms('At(Agent,11), At(Wumpus,13), At(Gold,23), At(Breeze,21), At(Stench,12), At(Pit,31), At(Pit,33), At(Pit,44), Alive')

_DISCS, _PEGS = ['d1', 'd2', 'd3', 'd4'], ['peg1', 'peg2', 'peg3']
_HANOI = [Schema('Move(x,y,z)', 'on(x,y), clear(x), clear(z), smaller(x,z)', '¬on(x,y), clear(y), on(x,z), ¬clear(z)')]
_H_I = frozenset({f'smaller({a},{b})' for i, a in enumerate(_DISCS) for b in _DISCS[:i]} |
                 {f'smaller({d},{p})' for d in _DISCS for p in _PEGS}) | \
    atoms('on(d4,d3), on(d3,d2), on(d2,d1), on(d1,peg1), clear(d4), clear(peg2), clear(peg3)')

_OBJ = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6']
_PAINT = [Schema('move-object(l,l2,o)', 'location(l), location(l2), at(l,o), at(l,Robot), l≠l2',
                 '¬at(l,o), ¬at(l,Robot), at(l2,o), at(l2,Robot)'),
          Schema('move(l,l2)', 'location(l), location(l2), at(l,Robot), l≠l2', '¬at(l,Robot), at(l2,Robot)'),
          Schema('paint(o,o2,o3)', 'at(B,o), at(B,o2), at(B,o3), ¬painted(o), ¬painted(o2), ¬painted(o3)',
                 'painted(o), painted(o2), painted(o3)')]
_P_I = atoms('location(A), location(B), at(A,Robot)') | {f'at(A,{o})' for o in _OBJ}
_P_TYPED = {'l': ['A', 'B'], 'l2': ['A', 'B'], 'o': _OBJ, 'o2': _OBJ, 'o3': _OBJ}

_CHECK = [Schema('Move(x,y,z)', 'At(x,y), Location(y), Location(z), y≠z', 'At(x,z), ¬At(x,y)'),
          Schema('Assemble(x)', 'At(x,B), ¬Assembled(x)', 'Assembled(x)'),
          Schema('Disassemble(x)', 'At(x,B), Assembled(x)', '¬Assembled(x)'),
          Schema('Check(x)', 'At(x,C), ¬Assembled(x), ¬Checked(x)', 'Checked(x)')]
_C_I = atoms('At(O1,A), At(O2,A), At(O3,A), Assembled(O1), Assembled(O2), Assembled(O3), Location(A), Location(B), Location(C)')

_SEC = [Schema('GetSite(x)', '', 'inGotSite(x)'),
        Schema('AttackXSSGet(x)', 'inGotSite(x), inAttackedSQL(x)', 'inAttackedXSS(x), inFinished(x)'),
        Schema('AttackXSSPost(x)', 'inGotSite(x), inAttackedSQL(x)', 'inAttackedXSS(x), inFinished(x)'),
        Schema('AttackSQLGet(x)', 'inGotSite(x)', 'inAttackedSQL(x), inFinished(x)'),
        Schema('AttackSQLPost(x)', 'inGotSite(x), inAttackedXSS(x)', 'inAttackedSQL(x), inFinished(x)')]

_ROBOT = [Schema('Move(x,y)', 'Room(x), Room(y), x≠y, AtRobot(x)', '¬AtRobot(x), AtRobot(y)'),
          Schema('PickUp(x,y,z)', 'Ball(x), Room(y), Arm(z), AtBall(x,y), AtRobot(y), Free(z)', 'Carry(z,x), ¬AtBall(x,y), ¬Free(z)'),
          Schema('Drop(x,y,z)', 'Ball(x), Room(y), Arm(z), Carry(z,x), AtRobot(y)', '¬Carry(z,x), AtBall(x,y), Free(z)')]
_R_I = atoms('Room(RA), Room(RB), Ball(B1), Ball(B2), Ball(B3), Ball(B4), Arm(Left), Arm(Right), Free(Left), Free(Right), '
             'AtRobot(RA), AtBall(B1,RA), AtBall(B2,RA), AtBall(B3,RA), AtBall(B4,RA)')


def _rooms(n, adjacent):
    rooms = [f'R{i}' for i in range(1, n + 1)]
    acts = [a for a in ground(Schema('Move(x,y)', 'At(x), x≠y', '¬At(x), At(y)'), rooms)
            if not adjacent or abs(int(split_atom(a.name)[1][0][1:]) - int(split_atom(a.name)[1][1][1:])) == 1]
    return atoms('At(R1)'), acts


_LOCS = ['L1', 'L2', 'L3', 'L4', 'L5']
_CONN = [('L1', 'L2'), ('L2', 'L3'), ('L2', 'L4'), ('L3', 'L4'), ('L4', 'L5')]


def _mars(symmetric):
    init = frozenset({f'Connected({a},{b})' for a, b in _CONN} |
                     ({f'Connected({b},{a})' for a, b in _CONN} if symmetric else set()) |
                     {f'Location({l})' for l in _LOCS} | {'Recharge(L3)', 'At(L1)', 'Fuel(5)'})
    acts = [a for z in range(2, 6) for a in ground(
        Schema(f'Move(x,y,{z})', f'Location(x), Location(y), Connected(x,y), At(x), Fuel({z})',
               f'¬At(x), At(y), ¬Fuel({z}), Fuel({z - 2})'), {'x': _LOCS, 'y': _LOCS})]
    acts += [a for z in range(6) for a in ground(
        Schema(f'Recharging(x,{z})', f'Location(x), Recharge(x), At(x), Fuel({z})', f'¬Fuel({z}), Fuel(5)'), {'x': _LOCS})]
    return init, possible(acts, init)


TESTS = [
    Test('18 Jan 2023: arm, boxes, books', args=(_ARM, ['Bx1', 'Bx2', 'Bk1', 'Bk2', 'T1', 'T2'], _ARM_I),
         expected=['PickUp(Bx1,T1)', 'PickUp(Bx2,T1)', 'PickUp(Bk1,T1)', 'PickUp(Bk2,T1)', 'Move(T1,T2)'],
         show='constants Bx1, Bx2, Bk1, Bk2, T1, T2'),
    Test('9 Feb 2023: Wumpus world', args=(_WUMPUS, _CELLS, _W_I), expected=['Move(11,12)', 'Move(11,21)'],
         show='cells 11 … 44'),
    Test('20 Jun 2024: Tower of Hanoi', args=(_HANOI, _DISCS + _PEGS, _H_I),
         expected=['Move(d4,d3,peg2)', 'Move(d4,d3,peg3)'], show='d1 … d4, peg1 … peg3'),
    Test('12 Jul 2024: painting, o ranges over the objects', args=(_PAINT, _P_TYPED, _P_I),
         expected=[f'move-object(A,B,{o})' for o in _OBJ] + ['move(A,B)'], show='typed parameters'),
    Test('12 Jul 2024: the same, untyped (the trap)', args=(_PAINT, ['A', 'B', 'Robot'] + _OBJ, _P_I),
         expected=['move-object(A,B,Robot)'] + [f'move-object(A,B,{o})' for o in _OBJ] + ['move(A,B)'],
         show='every parameter over A, B, Robot, O1 … O6'),
    Test('3 Feb 2025: check and assemble', args=(_CHECK, ['O1', 'O2', 'O3', 'A', 'B', 'C'], _C_I),
         expected=['Move(O1,A,B)', 'Move(O1,A,C)', 'Move(O2,A,B)', 'Move(O2,A,C)', 'Move(O3,A,B)', 'Move(O3,A,C)'],
         show='constants O1, O2, O3, A, B, C'),
    Test('8 Sep 2025: three objects', args=(_SEC, ['A', 'B', 'C'], atoms('ininitial(A)')),
         expected=['GetSite(A)', 'GetSite(B)', 'GetSite(C)'], show='initial state ininitial(A)'),
    Test('14 Jan 2026: robot with two arms', args=(_ROBOT, ['RA', 'RB', 'B1', 'B2', 'B3', 'B4', 'Left', 'Right'], _R_I),
         expected=['Move(RA,RB)'] + [f'PickUp(B{i},RA,{z})' for i in range(1, 5) for z in ('Left', 'Right')],
         show='rooms RA, RB; balls B1 … B4; arms Left, Right'),
    Test('14 Jul 2022: n = 6 rooms, any move', call=lambda sol: sol.max_branching(*_rooms(6, False)), expected=5,
         show='n (n - 1) actions Move_x-x\''),
    Test('14 Jul 2022: n = 6 rooms, adjacent moves only', call=lambda sol: sol.max_branching(*_rooms(6, True)), expected=2,
         show='2 (n - 1) actions'),
    Test('6 Feb 2026: Mars rover, symmetric connections', call=lambda sol: sol.max_branching(*_mars(True)), expected=3,
         show='Move with fuel levels 2 … 5, Recharging at L3'),
    Test('6 Feb 2026: Mars rover, original one-way connections', call=lambda sol: sol.max_branching(*_mars(False)), expected=2,
         show='Connected only as listed in the exam'),
]
