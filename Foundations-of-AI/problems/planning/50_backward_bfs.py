from harness import Test
from planning_lib import (Schema, atoms, ground_all, possible, is_plan, air_cargo, blocks_hand, hanoi)

TITLE = 'Backward (regression) planning with breadth-first search'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['backward planning', 'regression', 'BFS', 'graph search', 'relevant action']

STATEMENT = r"""
Backward planning searches in the space of **goals** (AIMA §11.2.2): the root is the goal of the problem, the
children of a goal $g$ are the regressions $R[g, a] = (g - \textit{ADD}(a)) \cup \textit{PRE}(a)$ through the
actions that are **relevant** and **consistent** for $g$, and the search stops when the **initial state
satisfies** a goal ($g \subseteq \textit{Init}$).

Implement `backward_bfs(init, goal, actions)`:

- breadth-first **graph** search over goals (a goal already generated is not added again);
- actions tried in the order of the list; the test $g \subseteq \textit{Init}$ is done when a goal is
  **generated** (and on the root);
- return the plan in **execution order** (the action found first is the *last* one executed), `[]` if the
  initial state already satisfies the goal, `None` if no plan exists.

`relevant`, `consistent`, `regress` from `planning_lib` may be used. The action lists contain only the
type-correct ground actions (whose static preconditions such as `Cargo(c)`, `Block(x)` hold in the initial
state): see the explanation for why this matters much more backward than forward.
"""

STARTER = '''from collections import deque
from planning_lib import Action, relevant, consistent, regress

def backward_bfs(init: frozenset, goal: frozenset, actions: list[Action]) -> list[str] | None:
    # TODO
    return None
'''

SOLUTION = '''from collections import deque
from planning_lib import Action, relevant, consistent, regress

def backward_bfs(init: frozenset, goal: frozenset, actions: list[Action]) -> list[str] | None:
    if goal <= init:
        return []
    frontier = deque([(goal, [])])
    reached = {goal}
    while frontier:
        g, plan = frontier.popleft()
        for a in actions:
            if relevant(g, a) and consistent(g, a):
                g1 = regress(g, a)
                if g1 <= init:
                    return [a.name] + plan
                if g1 not in reached:
                    reached.add(g1)
                    frontier.append((g1, [a.name] + plan))
    return None
'''

HINTS = [
    'Same skeleton as forward BFS, with goals instead of states: `(goal, plan)` pairs in a deque.',
    'Successors: `for a in actions: if relevant(g, a) and consistent(g, a): g1 = regress(g, a)`.',
    'The new action goes in **front** of the plan: `[a.name] + plan`, because backward search discovers the '
    'last action first.',
    'Stop as soon as `g1 <= init`: the initial state satisfies the regressed goal.',
]

EXPLANATION = r"""
**Goal test reversed.** A goal is a *partial* description: it is satisfied by every state that contains it.
The search ends when the **initial state** is one of them.

**Shortest plans.** Every regression step adds one action in front of the plan, so BFS over goals also returns a
shortest plan: 6 actions for the Sussman anomaly and for the air cargo problem.

**Why only type-correct actions?** Backward search reasons about goals, not states, so nothing stops it from
regressing through `Unload(C1, C2, JFK)` (a cargo "inside" a cargo): the regressed goal contains `Plane(C2)`,
which is false in the initial state and can never become true (no action adds it), yet the search keeps
regressing that goal further. With the 612 untyped ground actions of the air cargo problem a backward BFS takes
minutes; with the 20 type-correct ones it is instantaneous. Forward search does not suffer from this: an action
with a false static precondition is simply never applicable. Rule: drop the actions whose **static**
preconditions are false in the initial state (`possible()` in `planning_lib`), or prune goals that contain such
atoms. Similar pruning: goals containing mutually exclusive facts (inconsistent goals, exercise book 6.2).

**Backward is not always better.** On the Tower of Hanoi the 2-disc instance is solved after 69 expansions, but
the 3-disc one does not finish within a minute: regressed goals multiply, and most of them describe impossible
situations (two discs on the same disc, a disc both clear and covered) that no consistency check removes. Forward
BFS on the same instance visits at most $3^3 = 27$ states. Backward search pays off when the goal is small and
few actions are relevant to it; it suffers when the goals it generates do not correspond to real states.

**No solution.** In exam 8 Jul 2025 the initial state has no `Clear(...)` atom; every action requires one, so
every regressed goal contains some `Clear(...)` and none is ever satisfied by the initial state. With graph
search the space of goals is finite and the search returns failure.
"""

ENTRY = 'backward_bfs'

_ROOMS = [Schema('GoThru(d,r1,r2)', 'InRoom(ROBOT,r1), Connects(d,r1,r2)', 'InRoom(ROBOT,r2), ¬InRoom(ROBOT,r1)'),
          Schema('PushThru(b,d,r1,r2)', 'InRoom(ROBOT,r1), InRoom(b,r1), Connects(d,r1,r2), Box(b)',
                 'InRoom(ROBOT,r2), InRoom(b,r2), ¬InRoom(ROBOT,r1), ¬InRoom(b,r1)')]
_RI = atoms('InRoom(ROBOT,R1), InRoom(BOX1,R2), Connects(D1,R1,R2), Connects(D2,R2,R3), Connects(D1,R2,R1), '
            'Connects(D2,R3,R2), Box(BOX1)')
_RA = sorted(possible(ground_all(_ROOMS, ['BOX1', 'D1', 'D2', 'R1', 'R2', 'R3', 'ROBOT']), _RI), key=lambda a: a.name)
_BOXES = [Schema('MoveToTable(x,y)', 'Box(x), Box(y), Clear(x), On(x,y)', 'On(x,Table), Clear(y), ¬On(x,y)'),
          Schema('MoveFromTable(x,y)', 'Box(x), Box(y), Clear(x), Clear(y), On(x,Table)', 'On(x,y), ¬Clear(y), ¬On(x,Table)'),
          Schema('Move(x,y,z)', 'Box(x), Box(y), Box(z), Clear(x), Clear(z), On(x,y), x≠y, y≠z, x≠z',
                 'On(x,z), Clear(y), ¬On(x,y), ¬Clear(z)')]
_NOCLEAR = atoms('Box(A), Box(B), Box(C), On(A,Table), On(B,Table), On(C,A)')
_BOXA = possible(ground_all(_BOXES, ['A', 'B', 'C']), _NOCLEAR)


def _optimal(problem, length):
    init, goal, actions = problem

    def check(got, *args):
        if got is None or not isinstance(got, list):
            return False, f'expected a plan of {length} actions, got {got!r}'
        if not is_plan(init, goal, actions, got):
            return False, ('not a valid plan in execution order (did you append the new action at the end '
                           'instead of the front?)')
        if len(got) != length:
            return False, f'valid plan of {len(got)} actions, but BFS must return a shortest one ({length})'
        return True
    return check


TESTS = [
    Test('exam 30 Aug 2022: robot, doors, box', args=(_RI, atoms('Box(BOX1), InRoom(BOX1,R1)'), _RA),
         expected=['GoThru(D1,R1,R2)', 'PushThru(BOX1,D1,R2,R1)'], show='goal Box(BOX1), InRoom(BOX1,R1)'),
    Test('goal already satisfied', args=(_RI, atoms('InRoom(ROBOT,R1)'), _RA), expected=[], show='goal InRoom(ROBOT,R1)'),
    Test('air cargo (AIMA Fig. 11.1)', args=air_cargo(), check=_optimal(air_cargo(), 6), show='6 actions'),
    Test('Sussman anomaly, blocks world with a hand', args=blocks_hand(), check=_optimal(blocks_hand(), 6),
         show='goal On(A,B), On(B,C)'),
    Test('Tower of Hanoi, 2 discs', args=hanoi(2), check=_optimal(hanoi(2), 3), show='3 moves'),
    Test('exam 8 Jul 2025: no Clear(...) in the initial state', args=(_NOCLEAR, atoms('On(B,C), On(C,A)'), _BOXA),
         expected=None, show='MoveToTable / MoveFromTable / Move; initial state without Clear facts'),
    Test('same problem with Clear(B), Clear(C)', args=(_NOCLEAR | atoms('Clear(B), Clear(C)'), atoms('On(B,C), On(C,A)'), _BOXA),
         expected=['MoveFromTable(B,C)'], show='now one action suffices'),
]
