from harness import Test
from aima import Node, expand, PriorityQueue

TITLE = 'Path planning on a grid (with step costs)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['problem formulation', 'path planning', 'step cost', 'action_cost']

STATEMENT = r"""
The **first path-planning formulation** of slides p. 81: overlay a grid on the map; the robot moves
from a cell to any of its **8 neighbours**, with cost **1** for a horizontal/vertical move and **1.41**
for a diagonal one.

- **State:** a cell `(x, y)`, with `0 <= x < width`, `0 <= y < height`.
- **Actions:** the moves `(dx, dy)` of `DIRECTIONS` (keep that order) whose target cell is inside the
  grid and not in `obstacles`.
- **result(s, a):** the target cell.
- **action_cost(s, a, s1):** `1` or `1.41` — the step cost $c(s, a, s')$.
- **Goal test:** inherited (`state == goal`).

```text
. . . . .        GridPathProblem((0, 2), (4, 2), 5, 5, obstacles={(2, 1), (2, 2), (2, 3)})
. . # . .        actions((1, 2)) → [(-1, 0), (0, 1), (0, -1), (-1, 1), (-1, -1)]
S . # . G        (the three moves towards x = 2 are blocked)
. . # . .
. . . . .
```
The tests run uniform-cost search on your formulation and compare the optimal path cost.
"""

STARTER = '''from collections.abc import Iterable

from aima import Problem

class GridPathProblem(Problem):
    DIRECTIONS = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
    DIAGONAL = 1.41

    def __init__(self, initial: tuple[int, int], goal: tuple[int, int], width: int, height: int,
                 obstacles: Iterable[tuple[int, int]] = ()):
        super().__init__(initial=initial, goal=goal, width=width, height=height,
                         obstacles=set(obstacles))

    def actions(self, state: tuple[int, int]) -> list[tuple[int, int]]:
        # TODO: moves whose target cell is inside the grid and free
        return []

    def result(self, state: tuple[int, int], action: tuple[int, int]) -> tuple[int, int]:
        # TODO
        return state

    def action_cost(self, s: tuple[int, int], action: tuple[int, int], s1: tuple[int, int]) -> float:
        # TODO: 1 for straight moves, DIAGONAL for diagonal ones
        return 1
'''

SOLUTION = '''from collections.abc import Iterable

from aima import Problem

class GridPathProblem(Problem):
    DIRECTIONS = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
    DIAGONAL = 1.41

    def __init__(self, initial: tuple[int, int], goal: tuple[int, int], width: int, height: int,
                 obstacles: Iterable[tuple[int, int]] = ()):
        super().__init__(initial=initial, goal=goal, width=width, height=height,
                         obstacles=set(obstacles))

    def actions(self, state: tuple[int, int]) -> list[tuple[int, int]]:
        x, y = state
        return [(dx, dy) for (dx, dy) in self.DIRECTIONS
                if 0 <= x + dx < self.width and 0 <= y + dy < self.height
                and (x + dx, y + dy) not in self.obstacles]

    def result(self, state: tuple[int, int], action: tuple[int, int]) -> tuple[int, int]:
        (x, y), (dx, dy) = state, action
        return (x + dx, y + dy)

    def action_cost(self, s: tuple[int, int], action: tuple[int, int], s1: tuple[int, int]) -> float:
        dx, dy = action
        return self.DIAGONAL if dx and dy else 1
'''

HINTS = [
    'A move `(dx, dy)` from `(x, y)` lands on `(x + dx, y + dy)`: check the bounds and the obstacles there.',
    'A move is diagonal when both `dx` and `dy` are non-zero.',
    'Keep `DIRECTIONS` order in `actions` with a list comprehension and a filter.',
]

EXPLANATION = r"""
The grid formulation is the easiest to write but has many states (one per free cell) and **many
repeated states** (8 reversible moves per cell: slides p. 107 puts robot navigation in the "search
tree is infinite" column). Its paths are also only approximately shortest: they are restricted to
45° angles.

The other two formulations of slides p. 83–86 trade states for geometry:

| formulation | states | path quality |
|---|---|---|
| grid (8-connected) | one per free cell — many | zig-zag, near-optimal for fine grids |
| cell decomposition | one per free region — few | goes through region centers: not optimal |
| visibility graph | start, goal, obstacle vertices — very few | **true shortest path** (hugs obstacle corners) |

Note how the **step cost** $c(s, a, s')$ is part of the problem: with all costs equal to 1, going
`(0,0) → (4,2)` would cost 4 by *any* mix of 4 moves, and the optimal solution would minimize moves,
not distance.
"""

ENTRY = 'GridPathProblem'


def _ucs(problem):
    node = Node(problem.initial)
    frontier, reached = PriorityQueue([node], key=lambda n: n.path_cost), {problem.initial: node}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            if child.state not in reached or child.path_cost < reached[child.state].path_cost:
                reached[child.state] = child
                frontier.add(child)
    return None


def _cost(sol, start, goal, w, h, obstacles=()):
    node = _ucs(sol.GridPathProblem(start, goal, w, h, obstacles))
    return None if node is None else round(node.path_cost, 2)


_WALL = {(2, 1), (2, 2), (2, 3)}
_U = {(1, 1), (2, 1), (3, 1), (3, 2), (3, 3), (2, 3), (1, 3)}   # a U open to the left, start inside

TESTS = [
    Test('actions in a corner', call=lambda sol: list(sol.GridPathProblem((0, 0), (2, 2), 3, 3).actions((0, 0))),
         expected=[(1, 0), (0, 1), (1, 1)], show='(0, 0) in an empty 3×3 grid'),
    Test('actions in the middle', call=lambda sol: len(sol.GridPathProblem((1, 1), (0, 0), 3, 3).actions((1, 1))),
         expected=8, show='(1, 1) in an empty 3×3 grid'),
    Test('actions next to a wall', call=lambda sol: list(sol.GridPathProblem((0, 2), (4, 2), 5, 5, _WALL).actions((1, 2))),
         expected=[(-1, 0), (0, 1), (0, -1), (-1, 1), (-1, -1)], show='(1, 2), wall at x = 2, y = 1..3'),
    Test('result', call=lambda sol: sol.GridPathProblem((0, 0), (2, 2), 3, 3).result((1, 1), (1, -1)),
         expected=(2, 0), show='(1, 1) + (1, -1)'),
    Test('step costs', call=lambda sol: [sol.GridPathProblem((0, 0), (2, 2), 3, 3).action_cost((1, 1), a, None)
                                         for a in [(1, 0), (0, -1), (1, 1), (-1, 1)]],
         expected=[1, 1, 1.41, 1.41], show='right, up, two diagonals'),
    Test('straight line', call=lambda sol: _cost(sol, (0, 0), (4, 0), 5, 5), expected=4, show='(0,0) → (4,0)'),
    Test('diagonals are worth it', call=lambda sol: _cost(sol, (0, 0), (4, 2), 5, 5), expected=4.82,
         show='(0,0) → (4,2): 2 diagonals + 2 straight = 2·1.41 + 2'),
    Test('around the wall', call=lambda sol: _cost(sol, (0, 2), (4, 2), 5, 5, _WALL), expected=5.64,
         show='(0,2) → (4,2) with a wall at x = 2, y = 1..3'),
    Test('escape from a U-shaped obstacle', call=lambda sol: _cost(sol, (2, 2), (4, 2), 5, 5, _U), expected=8.23,
         show='start inside a U open to the left'),
    Test('no path', call=lambda sol: _cost(sol, (0, 0), (2, 2), 3, 3, {(1, 0), (1, 1), (1, 2)}), expected=None,
         show='a full wall at x = 1'),
]
