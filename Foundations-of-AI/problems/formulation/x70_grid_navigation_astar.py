from harness import Test
from aima import Node, expand, PriorityQueue, path_states
from formulation_lib import shortest_solution

TITLE = 'Exam · Jan 2023 · Grid navigation as a search problem for A*'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['exam', 'Jan 2023', 'problem formulation', 'grid', 'heuristic', 'A*']

STATEMENT = r"""
*Written exam of 18 January 2023 — Problem 2, Question 2.*

A deterministic 3 × 3 grid: the black cell is an obstacle, **S** is the start cell and **G** the goal cell. Cells
are pairs `(r, c)` (row, column, from 1). The agent moves **North** (up), **East** (right), **South** (down) or
**West** (left); it cannot move into the obstacle or outside the grid: e.g. from `(2, 1)` it can only go North to
S or South to `(3, 1)`.

```text
      1   2   3
 1    S   .   .
 2    .   #   .
 3    .   .   G
```

The exam first trains a Q-learning agent on this grid (Question 1, not here). **Question 2:** the company does not
like reinforcement learning and asks you to model the same navigation task as a **search problem**. Define the
functions you need to solve it with **A\***.

Implement them for any grid (the tests also use other sizes and obstacles):

- `actions(state)`: the applicable moves, in the order **North, East, South, West**;
- `result(state, action)`: the cell reached; the goal test and the unit step cost are inherited from `Problem`;
- `h(node)`: an **admissible** heuristic for A*: the **Manhattan distance** from `node.state` to the goal.
"""

STARTER = '''from aima import Problem, Node

class GridNavigation(Problem):
    MOVES = {'North': (-1, 0), 'East': (0, 1), 'South': (1, 0), 'West': (0, -1)}

    def __init__(self, rows: int = 3, cols: int = 3, obstacles=((2, 2),),
                 initial: tuple[int, int] = (1, 1), goal: tuple[int, int] = (3, 3)):
        super().__init__(initial=initial, goal=goal, rows=rows, cols=cols, obstacles=set(obstacles))

    def actions(self, state: tuple[int, int]) -> list[str]:
        # TODO: moves that stay inside the grid and avoid the obstacles, in the order of MOVES
        return []

    def result(self, state: tuple[int, int], action: str) -> tuple[int, int]:
        # TODO
        return state

    def h(self, node: Node) -> int:
        # TODO: Manhattan distance to the goal
        return 0
'''

SOLUTION = '''from aima import Problem, Node

class GridNavigation(Problem):
    MOVES = {'North': (-1, 0), 'East': (0, 1), 'South': (1, 0), 'West': (0, -1)}

    def __init__(self, rows: int = 3, cols: int = 3, obstacles=((2, 2),),
                 initial: tuple[int, int] = (1, 1), goal: tuple[int, int] = (3, 3)):
        super().__init__(initial=initial, goal=goal, rows=rows, cols=cols, obstacles=set(obstacles))

    def actions(self, state: tuple[int, int]) -> list[str]:
        r, c = state
        return [a for a, (dr, dc) in self.MOVES.items()
                if 1 <= r + dr <= self.rows and 1 <= c + dc <= self.cols
                and (r + dr, c + dc) not in self.obstacles]

    def result(self, state: tuple[int, int], action: str) -> tuple[int, int]:
        dr, dc = self.MOVES[action]
        return (state[0] + dr, state[1] + dc)

    def h(self, node: Node) -> int:
        (r, c), (gr, gc) = node.state, self.goal
        return abs(r - gr) + abs(c - gc)
'''

HINTS = [
    'Rows grow downwards: North is `(-1, 0)`. Cells are numbered from 1, so the bounds are `1 <= r <= rows`.',
    'Iterate over `self.MOVES.items()` to keep the order North, East, South, West.',
    '`h` receives a **node**: use `node.state`.',
]

EXPLANATION = r"""
**Model answer** (official solution, all the functions of a search problem plus $g$ and $h$):

- states: the free cells $\{(1,1), \dots, (3,3)\} \setminus \{(2,2)\}$; initial state $s_0 = (1,1)$;
- `actions(s)`: the moves that stay in the grid and avoid obstacles, e.g. `actions((1,1)) = {East, South}`;
- `result(s, a)`: the cell reached, e.g. `result((1,1), East) = (1,2)`;
- goal test: `s == (3,3)`; step cost: 1 for every action, so $g(n)$ = number of moves;
- heuristic: since the agent cannot move diagonally, both the **Manhattan** and the **Euclidean** distance are
  admissible (Manhattan is better: it dominates Euclidean and is still $\le h^*$, because every move changes one
  coordinate by 1).

A* returns a 4-move path: two optimal paths exist (East, East, South, South and South, South, East, East); on this
grid Manhattan is even exact ($h = h^*$ on every cell: the obstacle never forces a detour), so A* expands only
cells of optimal paths. Same task, different architecture:
Q-learning (utility-based, Question 1) learns values for every state-action pair; A* (goal-based) plans one optimal
path from the model.
"""

ENTRY = 'GridNavigation'


def _astar(problem):
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=lambda n: n.path_cost + problem.h(n))
    reached = {problem.initial: node}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            s = child.state
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child
                frontier.add(child)
    return None


_BIG = dict(rows=4, cols=5, obstacles=[(1, 3), (2, 3), (3, 3), (3, 5)], initial=(1, 1), goal=(1, 5))


def _admissible(sol):
    """h(s) <= true distance for every reachable cell of the big grid."""
    bad = []
    for r in range(1, 5):
        for c in range(1, 6):
            if (r, c) in _BIG['obstacles']:
                continue
            p = sol.GridNavigation(**{**_BIG, 'initial': (r, c)})
            moves = shortest_solution(p)
            if moves is not None and p.h(Node((r, c))) > len(moves):
                bad.append((r, c))
    return bad


TESTS = [
    Test('actions((1, 1))', call=lambda sol: sol.GridNavigation().actions((1, 1)), expected=['East', 'South']),
    Test('actions((2, 1))', call=lambda sol: sol.GridNavigation().actions((2, 1)), expected=['North', 'South']),
    Test('actions((1, 2)): the obstacle is below', call=lambda sol: sol.GridNavigation().actions((1, 2)),
         expected=['East', 'West']),
    Test('actions((3, 3))', call=lambda sol: sol.GridNavigation().actions((3, 3)), expected=['North', 'West']),
    Test('result((1, 1), East)', call=lambda sol: sol.GridNavigation().result((1, 1), 'East'), expected=(1, 2)),
    Test('result((2, 3), South)', call=lambda sol: sol.GridNavigation().result((2, 3), 'South'), expected=(3, 3)),
    Test('h at S and next to G', call=lambda sol: [sol.GridNavigation().h(Node(s)) for s in [(1, 1), (2, 3), (3, 3)]],
         expected=[4, 1, 0]),
    Test('A* on the exam grid: cost 4', call=lambda sol: (lambda n: (n.path_cost, len(path_states(n))))(
        _astar(sol.GridNavigation())), expected=(4, 5)),
    Test('A* on a 4x5 grid with a wall', call=lambda sol: _astar(sol.GridNavigation(**_BIG)).path_cost, expected=10,
         show='wall in column 3 (rows 1-3): go around it through row 4'),
    Test('Manhattan h is admissible on the 4x5 grid', call=_admissible, expected=[]),
]
