from harness import Test
from planning_lib import (Schema, atoms, ground_all, possible, is_plan, air_cargo, spare_tire, blocks_hand, hanoi)

TITLE = 'Forward (progression) planning with breadth-first search'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['forward planning', 'progression', 'BFS', 'graph search', 'state space']

STATEMENT = r"""
Forward planning is ordinary search in the space of states (AIMA §11.2.1): the successors of a state are the
results of its **applicable** ground actions, the goal test is $\textit{Goal} \subseteq s$, every action costs 1.

Implement `forward_bfs(init, goal, actions)` with the exam conventions:

- breadth-first **graph** search: a state already generated is not added to the frontier again;
- the actions of a state are tried **in the order of the list** `actions`;
- the goal test is done when a node is **generated** (and on the initial state before the loop).

Return the plan as a list of action names, `[]` if `init` already satisfies the goal, `None` if no plan exists.
`applicable(s, a)` and `result(s, a)` are available in `planning_lib`.

```text
[InRoom(ROBOT,R1), InRoom(BOX1,R2), ...]              exam 30 Aug 2022, actions in lexicographic order
 └─ GoThru(D1,R1,R2)
     ├─ GoThru(D1,R2,R1)          repeated
     ├─ GoThru(D2,R2,R3)
     └─ PushThru(BOX1,D1,R2,R1)   goal → plan GoThru(D1,R1,R2), PushThru(BOX1,D1,R2,R1)
```
"""

STARTER = '''from collections import deque
from planning_lib import Action, applicable, result

def forward_bfs(init: frozenset, goal: frozenset, actions: list[Action]) -> list[str] | None:
    """Breadth-first graph search; goal test when a node is generated."""
    # TODO
    return None
'''

SOLUTION = '''from collections import deque
from planning_lib import Action, applicable, result

def forward_bfs(init: frozenset, goal: frozenset, actions: list[Action]) -> list[str] | None:
    """Breadth-first graph search; goal test when a node is generated."""
    if goal <= init:
        return []
    frontier = deque([(init, [])])
    reached = {init}
    while frontier:
        s, plan = frontier.popleft()
        for a in actions:
            if applicable(s, a):
                s1 = result(s, a)
                if goal <= s1:
                    return plan + [a.name]
                if s1 not in reached:
                    reached.add(s1)
                    frontier.append((s1, plan + [a.name]))
    return None
'''

HINTS = [
    'Store `(state, plan_so_far)` pairs in a `deque`; `popleft()` gives FIFO order.',
    'For each popped state, loop over `actions` in order, skip the non-applicable ones, compute `s1 = result(s, a)`.',
    'Goal test right after computing `s1` (`goal <= s1`); otherwise add `s1` to `reached` and to the frontier '
    'only if it is new. States are frozensets, so they can go in a set.',
    'Without the `reached` set the 4-disc Tower of Hanoi (15 moves, branching factor up to 3) does not finish.',
]

EXPLANATION = r"""
**It is just BFS.** Nothing in the code knows about blocks or planes: the logical representation gives a
**domain-independent** successor function (applicable ground actions) and goal test (subset). That is the point
of the representation.

**Graph search matters.** Most actions can be undone (`Pickup`/`Putdown`, `Fly` back), so the state space is
full of cycles. The 4-disc Tower of Hanoi has only $3^4 = 81$ states, but tree search would generate about
$3^{15}$ nodes before reaching depth 15.

**BFS returns a shortest plan** (unit costs): 6 actions for the air cargo problem, 3 for the spare tire, 6 for
the Sussman anomaly with a hand, $2^n - 1$ for the Tower of Hanoi. That is why exam 8 Jul 2026 can say that an
LLM plan of the same length as the BFS plan is **optimal**.

**Branching factor.** Every applicable ground action is a child, relevant or not: in the air cargo initial
state both planes may fly away empty. With many objects forward search drowns in irrelevant actions; that is
the motivation for backward search and for heuristics (A* with an admissible $h$).
"""

ENTRY = 'forward_bfs'

_ROOMS = [Schema('GoThru(d,r1,r2)', 'InRoom(ROBOT,r1), Connects(d,r1,r2)', 'InRoom(ROBOT,r2), ¬InRoom(ROBOT,r1)'),
          Schema('PushThru(b,d,r1,r2)', 'InRoom(ROBOT,r1), InRoom(b,r1), Connects(d,r1,r2), Box(b)',
                 'InRoom(ROBOT,r2), InRoom(b,r2), ¬InRoom(ROBOT,r1), ¬InRoom(b,r1)')]
_RI = atoms('InRoom(ROBOT,R1), InRoom(BOX1,R2), Connects(D1,R1,R2), Connects(D2,R2,R3), Connects(D1,R2,R1), '
            'Connects(D2,R3,R2), Box(BOX1)')
_RG = atoms('Box(BOX1), InRoom(BOX1,R1)')
_RA = sorted(possible(ground_all(_ROOMS, ['BOX1', 'D1', 'D2', 'R1', 'R2', 'R3', 'ROBOT']), _RI), key=lambda a: a.name)
_RI_ONEWAY = atoms('InRoom(ROBOT,R1), InRoom(BOX1,R2), Connects(D1,R1,R2), Connects(D2,R2,R3), Box(BOX1)')


def _optimal(problem, length):
    init, goal, actions = problem

    def check(got, *args):
        if got is None or not isinstance(got, list):
            return False, f'expected a plan of {length} actions, got {got!r}'
        if not is_plan(init, goal, actions, got):
            return False, 'this sequence is not executable from the initial state or does not reach the goal'
        if len(got) != length:
            return False, f'valid plan of {len(got)} actions, but BFS must return a shortest one ({length})'
        return True
    return check


TESTS = [
    Test('exam 30 Aug 2022: robot, doors, box', args=(_RI, _RG, _RA),
         expected=['GoThru(D1,R1,R2)', 'PushThru(BOX1,D1,R2,R1)'], show='fixed formulation, lexicographic action order'),
    Test('goal already true', args=(_RI, atoms('Box(BOX1)'), _RA), expected=[], show='goal Box(BOX1)'),
    Test('one-way doors: no plan', args=(_RI_ONEWAY, _RG, _RA), expected=None,
         show='only Connects(D1,R1,R2), Connects(D2,R2,R3): the box can never go back to R1'),
    Test('spare tire (AIMA Fig. 11.2)', args=spare_tire(), check=_optimal(spare_tire(), 3), show='3 actions'),
    Test('air cargo (AIMA Fig. 11.1)', args=air_cargo(), check=_optimal(air_cargo(), 6), show='6 actions'),
    Test('Sussman anomaly, blocks world with a hand', args=blocks_hand(), check=_optimal(blocks_hand(), 6),
         show='C on A; goal On(A,B), On(B,C)'),
    Test('Tower of Hanoi, 3 discs (exam 20 Jun 2024 formulation)', args=hanoi(3), check=_optimal(hanoi(3), 7),
         show='2^3 - 1 moves'),
    Test('Tower of Hanoi, 4 discs: needs graph search', args=hanoi(4), check=_optimal(hanoi(4), 15),
         show='2^4 - 1 moves', timeout=5),
]
