from harness import Test
from planning_lib import Schema, atoms, ground, ground_all, possible, split_atom

TITLE = 'Exam · Regressing the goal: how many ways, which new goals (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'backward planning', 'regression', 'relevant', 'consistent', 'Jan 2026', 'Jun 2026', 'Jul 2025']

STATEMENT = r"""
*Written exams of 14 July 2022, 9 February 2023, 8 July 2025, 14 January 2026 and 11 June 2026 — Planning.*
"When solving the problem using backward planning, in how many ways can the goal be regressed through an
action? Report the new goals" / "report the first two levels of the planning tree" / "can actions be relevant
but not consistent?".

Implement:

1. `regressions(goal, actions)` → `{action name: R[goal, a]}` for every action that is relevant **and**
   consistent, with $R[G, a] = (G - \textit{ADD}(a)) \cup \textit{PRE}(a)$ (static preconditions included);
2. `relevant_not_consistent(goal, actions)` → the names of the actions that achieve a goal literal but also
   delete one (in the order of `actions`).

The tests pass the **possible** ground actions (static preconditions true in the initial state), as the
official answers do. The domains:

- **14 Jan 2026** — robot with two arms: `Move(x,y)`, `PickUp(x,y,z)`, `Drop(x,y,z)` with
  `Drop(x,y,z)  P: Ball(x), Room(y), Arm(z), Carry(z,x), AtRobot(y)  E: ¬Carry(z,x), AtBall(x,y), Free(z)`;
  goal AtBall(B1,RB) ∧ AtBall(B2,RB) ∧ AtBall(B3,RB) ∧ AtBall(B4,RB).
- **11 Jun 2026** — warehouse: rooms Storage, Corridor, Shipping (connected Storage–Corridor–Shipping), package
  PKG; `Move(from,to)  P: at-robot(from), connected(from,to)  E: ¬at-robot(from), at-robot(to)`;
  `Pickup(p,r)  P: at-robot(r), at-package(p,r), handempty  E: carrying(p), ¬at-package(p,r), ¬handempty`;
  `Drop(p,r)  P: at-robot(r), carrying(p)  E: at-package(p,r), handempty, ¬carrying(p)`; goal
  at-package(PKG, Shipping).
- **8 Jul 2025** — boxes A, B, C (x ≠ y ≠ z): `MoveToTable(x,y)`, `MoveFromTable(x,y)
  P: Box(x), Box(y), Clear(x), Clear(y), On(x,Table)  E: On(x,y), ¬Clear(y), ¬On(x,Table)`,
  `Move(x,y,z)  P: Box(x), Box(y), Box(z), Clear(x), Clear(z), On(x,y)  E: On(x,z), Clear(y), ¬On(x,y), ¬Clear(z)`;
  goal On(B,C) ∧ On(C,A).
- **14 Jul 2022** — $n$ rooms, actions Move$_{x\text{-}x'}$ (P: At(R$_x$), E: ¬At(R$_x$) ∧ At(R$_{x'}$)) for every
  $x \ne x'$, or only for $x' = x \pm 1$; goal At(R$_n$).
- **9 Feb 2023** — Wumpus world with the three move schemas of problem x20; goal At(Agent,23) ∧ At(Gold,23) ∧
  Alive (the gold is in 23).
"""

STARTER = '''from planning_lib import Action

def regressions(goal: frozenset, actions: list[Action]) -> dict[str, frozenset]:
    # TODO
    return {}

def relevant_not_consistent(goal: frozenset, actions: list[Action]) -> list[str]:
    # TODO
    return []
'''

SOLUTION = '''from planning_lib import Action

def regressions(goal: frozenset, actions: list[Action]) -> dict[str, frozenset]:
    return {a.name: (goal - a.add) | a.pre for a in actions if a.add & goal and not (a.delete & goal)}

def relevant_not_consistent(goal: frozenset, actions: list[Action]) -> list[str]:
    return [a.name for a in actions if a.add & goal and a.delete & goal]
'''

HINTS = [
    'Relevant: `a.add & goal` is non-empty. Consistent: `a.delete & goal` is empty.',
    'Keep the static preconditions in $R[G, a]$ (Ball(B1), Room(RB), Arm(Left)): the official answers write them.',
]

EXPLANATION = r"""
**14 Jan 2026 — 8 ways.** Only `Drop` adds AtBall(…): 4 balls × 2 arms with y = RB. Model answer: "The only
action schema useful for regressing G is Drop(), because it is the only one that adds AtBall(…). There are 8
regressions, through Drop(B1,RB,Left), Drop(B1,RB,Right), …, Drop(B4,RB,Right). For example
R[G, Drop(B1,RB,Left)] = AtBall(B2,RB), AtBall(B3,RB), AtBall(B4,RB), Ball(B1), Room(RB), Arm(Left),
Carry(Left,B1), AtRobot(RB)." Grounding *all* parameters over all 8 constants would give 32 "relevant" Drop
actions (z = RA, B2, …): their regressions require Arm(RA) and can never be satisfied — this is why only the
type-correct ground actions are used.

**11 Jun 2026 — 1 way.** Only `Drop` adds at-package(p, r), and p, r are forced to PKG, Shipping: new goal
at-robot(Shipping) ∧ carrying(PKG).

**8 Jul 2025 — 4 children**, as in the official tree: MoveFromTable(B,C), Move(B,A,C) (for On(B,C)) and
MoveFromTable(C,A), Move(C,B,A) (for On(C,A)). Note R[G, Move(B,A,C)] contains On(B,A) **and** On(C,A): two
blocks on A, an impossible (inconsistent) goal that a consistency check on the action does not detect.
The initial state contains no Clear(…) atom, so no plan is ever found.

**14 Jul 2022.** Root At(R$_n$); children At(R1), …, At(R$_{n-1}$) through Move$_{x\text{-}n}$ ($n - 1$
children); with adjacent moves only, a single child At(R$_{n-1}$). Every goal in the tree is a **single
literal** (regressing {At(R$_x$)} through Move$_{x'\text{-}x}$ removes At(R$_x$) and adds At(R$_{x'}$)), so no
inconsistent goal can ever be generated: one literal cannot contradict itself.

**9 Feb 2023 — relevant but not consistent.** MoveToWumpusCell(c1,23) and MoveToPitCell(c1,23) add At(Agent,23)
(relevant) and delete Alive (not consistent); Move(c1,c2) never deletes a goal literal. Among the *possible*
ground actions they exist only "when the gold is in the same cell as the Wumpus or as a pit" (official answer):
in the exam's world they are not even possible (no Wumpus or pit in 23), while if the gold shared the cell with
the Wumpus, MoveToWumpusCell(13,23), (22,23), (24,23), (33,23) would be relevant but not consistent.
"""

ENTRY = 'regressions'

_ROBOT = [Schema('Move(x,y)', 'Room(x), Room(y), x≠y, AtRobot(x)', '¬AtRobot(x), AtRobot(y)'),
          Schema('PickUp(x,y,z)', 'Ball(x), Room(y), Arm(z), AtBall(x,y), AtRobot(y), Free(z)', 'Carry(z,x), ¬AtBall(x,y), ¬Free(z)'),
          Schema('Drop(x,y,z)', 'Ball(x), Room(y), Arm(z), Carry(z,x), AtRobot(y)', '¬Carry(z,x), AtBall(x,y), Free(z)')]
_R_I = atoms('Room(RA), Room(RB), Ball(B1), Ball(B2), Ball(B3), Ball(B4), Arm(Left), Arm(Right), Free(Left), Free(Right), '
             'AtRobot(RA), AtBall(B1,RA), AtBall(B2,RA), AtBall(B3,RA), AtBall(B4,RA)')
_R_A = possible(ground_all(_ROBOT, ['RA', 'RB', 'B1', 'B2', 'B3', 'B4', 'Left', 'Right']), _R_I)
_R_G = atoms('AtBall(B1,RB), AtBall(B2,RB), AtBall(B3,RB), AtBall(B4,RB)')

_ROOMS3 = ['Storage', 'Corridor', 'Shipping']
_WH = [Schema('Move(from,to)', 'at-robot(from), connected(from,to)', '¬at-robot(from), at-robot(to)'),
       Schema('Pickup(p,r)', 'at-robot(r), at-package(p,r), handempty', 'carrying(p), ¬at-package(p,r), ¬handempty'),
       Schema('Drop(p,r)', 'at-robot(r), carrying(p)', 'at-package(p,r), handempty, ¬carrying(p)')]
_WH_I = atoms('at-robot(Storage), at-package(PKG,Storage), handempty, connected(Storage,Corridor), '
              'connected(Corridor,Storage), connected(Corridor,Shipping), connected(Shipping,Corridor)')
_WH_A = possible(ground_all(_WH, {'from': _ROOMS3, 'to': _ROOMS3, 'p': ['PKG'], 'r': _ROOMS3}), _WH_I)

_BOXES = [Schema('MoveToTable(x,y)', 'Box(x), Box(y), Clear(x), On(x,y), x≠y', 'On(x,Table), Clear(y), ¬On(x,y)'),
          Schema('MoveFromTable(x,y)', 'Box(x), Box(y), Clear(x), Clear(y), On(x,Table), x≠y', 'On(x,y), ¬Clear(y), ¬On(x,Table)'),
          Schema('Move(x,y,z)', 'Box(x), Box(y), Box(z), Clear(x), Clear(z), On(x,y), x≠y, y≠z, x≠z',
                 'On(x,z), Clear(y), ¬On(x,y), ¬Clear(z)')]
_B_I = atoms('Box(A), Box(B), Box(C), On(A,Table), On(B,Table), On(C,A)')
_B_A = possible(ground_all(_BOXES, ['A', 'B', 'C']), _B_I)


def _rooms(n, adjacent):
    rooms = [f'R{i}' for i in range(1, n + 1)]
    acts = ground(Schema('Move(x,y)', 'At(x), x≠y', '¬At(x), At(y)'), rooms)
    return [a for a in acts if not adjacent or
            abs(int(split_atom(a.name)[1][0][1:]) - int(split_atom(a.name)[1][1][1:])) == 1]


_CELLS = ['{}{}'.format(x, y) for x in range(1, 5) for y in range(1, 5)]
_ADJ = frozenset({f'Adj({a},{b})' for a in _CELLS for b in _CELLS
                  if abs(int(a[0]) - int(b[0])) + abs(int(a[1]) - int(b[1])) == 1})
_WUMPUS = [Schema('Move(c1,c2)', 'Alive, At(Agent,c1), Adj(c1,c2), ¬At(Pit,c2), ¬At(Wumpus,c2), c1≠c2', '¬At(Agent,c1), At(Agent,c2)'),
           Schema('MoveToWumpusCell(c1,c2)', 'Alive, At(Agent,c1), Adj(c1,c2), ¬At(Pit,c2), At(Wumpus,c2), c1≠c2',
                  '¬At(Agent,c1), At(Agent,c2), ¬Alive'),
           Schema('MoveToPitCell(c1,c2)', 'Alive, At(Agent,c1), Adj(c1,c2), At(Pit,c2), ¬At(Wumpus,c2), c1≠c2',
                  '¬At(Agent,c1), At(Agent,c2), ¬Alive')]
_W_G = atoms('At(Agent,23), At(Gold,23), Alive')


def _wumpus_world(wumpus):
    init = _ADJ | atoms(f'At(Agent,11), At(Wumpus,{wumpus}), At(Gold,23), At(Pit,31), At(Pit,33), At(Pit,44), Alive')
    return possible(ground_all(_WUMPUS, _CELLS), init)


def _count(goal, actions):
    return lambda sol: len(sol.regressions(goal, actions))


TESTS = [
    Test('14 Jan 2026: number of regressions', call=_count(_R_G, _R_A), expected=8, show='goal: the 4 balls in RB'),
    Test('14 Jan 2026: R[G, Drop(B1,RB,Left)]', call=lambda sol: sol.regressions(_R_G, _R_A).get('Drop(B1,RB,Left)'),
         expected=atoms('AtBall(B2,RB), AtBall(B3,RB), AtBall(B4,RB), Ball(B1), Room(RB), Arm(Left), Carry(Left,B1), AtRobot(RB)'),
         show='the example of the official solution'),
    Test('11 Jun 2026: warehouse', args=(atoms('at-package(PKG,Shipping)'), _WH_A),
         expected={'Drop(PKG,Shipping)': atoms('at-robot(Shipping), carrying(PKG)')}, show='goal at-package(PKG,Shipping)'),
    Test('8 Jul 2025: the children of the root', args=(atoms('On(B,C), On(C,A)'), _B_A),
         expected={'MoveFromTable(B,C)': atoms('Box(B), Box(C), Clear(B), Clear(C), On(B,Table), On(C,A)'),
                   'MoveFromTable(C,A)': atoms('Box(C), Box(A), Clear(C), Clear(A), On(C,Table), On(B,C)'),
                   'Move(B,A,C)': atoms('Box(A), Box(B), Box(C), Clear(B), Clear(C), On(B,A), On(C,A)'),
                   'Move(C,B,A)': atoms('Box(A), Box(B), Box(C), Clear(C), Clear(A), On(B,C), On(C,B)')},
         show='goal On(B,C), On(C,A)'),
    Test('14 Jul 2022: n = 5 rooms, any move', args=(atoms('At(R5)'), _rooms(5, False)),
         expected={f'Move(R{x},R5)': atoms(f'At(R{x})') for x in range(1, 5)}, show='goal At(R5)'),
    Test('14 Jul 2022: n = 5 rooms, adjacent moves', args=(atoms('At(R5)'), _rooms(5, True)),
         expected={'Move(R4,R5)': atoms('At(R4)')}, show='goal At(R5)'),
    Test('9 Feb 2023: Move is never relevant-but-inconsistent', call=lambda sol: sol.relevant_not_consistent(_W_G, _wumpus_world('13')),
         expected=[], show='the exam\'s world: Wumpus in 13, gold in 23'),
    Test('9 Feb 2023: gold in the Wumpus cell', call=lambda sol: sol.relevant_not_consistent(_W_G, _wumpus_world('23')),
         expected=['MoveToWumpusCell(13,23)', 'MoveToWumpusCell(22,23)', 'MoveToWumpusCell(24,23)', 'MoveToWumpusCell(33,23)'],
         show='variant: the Wumpus is also in 23'),
    Test('9 Feb 2023: all groundings, no pruning', call=lambda sol: len(sol.relevant_not_consistent(_W_G, ground_all(_WUMPUS, _CELLS))),
         expected=30, show='MoveToWumpusCell(c1,23) and MoveToPitCell(c1,23) for every c1 ≠ 23'),
]
