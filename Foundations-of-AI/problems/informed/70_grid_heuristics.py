import math

from harness import Test
from informed_lib import GridProblem, SLIDE_GRID, Instrumented, astar_search, problem_graph, cost_to

TITLE = 'Grid navigation: Manhattan, Euclidean and octile distance'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['heuristic', 'relaxed problem', 'admissibility', 'dominance', 'grid', 'diagonal moves']

STATEMENT = r"""
A robot moves on a grid with obstacles (slides p. 198–215). A cell is `(x, y)`. Two versions:

- **4 moves** (up/down/left/right), each of cost 1;
- **8 moves**: also the 4 diagonals, each of cost $\sqrt 2$.

Implement three heuristics, functions of the current cell `a` and the goal cell `b` only
(they cannot see the obstacles):

1. `manhattan(a, b)` $= |x_a - x_b| + |y_a - y_b|$;
2. `euclidean(a, b)` $= \sqrt{(x_a - x_b)^2 + (y_a - y_b)^2}$;
3. `octile(a, b)`: the **exact cost of the relaxed problem "8 moves, no obstacles"**. Work it
   out: to cover $dx$ columns and $dy$ rows, how many diagonal steps should you take, and how
   many straight ones?

```text
 n . . . .
 . \ . . .      from n to G: dx = 4, dy = 4
 . . \ . .      Manhattan = 8,  Euclidean = 4*sqrt(2) = 5.66
 . . . \ .      true cost with diagonal moves h* = 4*sqrt(2) = 5.66   (slide p. 212)
 . . . . G
```

The tests then use your functions to check which heuristic is admissible in which version
of the problem, which one dominates, and what happens to A*.
"""

STARTER = '''import math

def manhattan(a: tuple[int, int], b: tuple[int, int]) -> int:
    # TODO
    return 0

def euclidean(a: tuple[int, int], b: tuple[int, int]) -> float:
    # TODO
    return 0

def octile(a: tuple[int, int], b: tuple[int, int]) -> float:
    """Cheapest cost from a to b with 8 moves (diagonal = sqrt(2)) and no obstacles."""
    # TODO
    return 0
'''

SOLUTION = '''import math

def manhattan(a: tuple[int, int], b: tuple[int, int]) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

def euclidean(a: tuple[int, int], b: tuple[int, int]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])

def octile(a: tuple[int, int], b: tuple[int, int]) -> float:
    """Cheapest cost from a to b with 8 moves (diagonal = sqrt(2)) and no obstacles."""
    dx, dy = abs(a[0] - b[0]), abs(a[1] - b[1])
    return math.sqrt(2) * min(dx, dy) + (max(dx, dy) - min(dx, dy))
'''

HINTS = [
    'A diagonal step covers one column **and** one row for $\\sqrt 2 \\approx 1.41$, two straight steps '
    'cover the same for 2. So use as many diagonal steps as possible.',
    'You can take at most $\\min(dx, dy)$ diagonal steps; the remaining $\\max(dx, dy) - \\min(dx, dy)$ '
    'squares are covered with straight steps.',
    '`octile = sqrt(2) * min(dx, dy) + (max(dx, dy) - min(dx, dy))` with `dx, dy` the absolute differences.',
]

EXPLANATION = r"""
**Every admissible heuristic is the exact cost of a relaxed problem** (slides p. 214–215):

| heuristic | relaxed problem | admissible with 4 moves | admissible with 8 moves |
|---|---|---|---|
| Manhattan | no obstacles, 4 moves | ✓ (exact if no obstacles) | ✗ overestimates diagonals |
| octile | no obstacles, 8 moves | ✓ | ✓ (exact if no obstacles) |
| Euclidean | no obstacles, move in any direction | ✓ | ✓ |

The **fewer constraints you remove, the closer to $h^*$** you stay: with 4 moves
Manhattan $\ge$ octile $\ge$ Euclidean, so Manhattan dominates; with 8 moves octile is the best
admissible choice and dominates Euclidean, which ignores that the robot cannot move at any angle.

**Manhattan with diagonal moves** (slide p. 212): from $(0,0)$ to $(4,4)$ it says 8, the
truth is $4\sqrt 2 \approx 5.66$. An overestimating $h$ makes A* lose its guarantee: on the
test map it returns a path of cost 8.24 instead of 7.66 (and it does so expanding very few
nodes — like weighted A*, it trades optimality for speed).

**Consistency** comes for free here: each of these is a true distance in a relaxed problem, so
the triangle inequality holds for every move of the real problem that is also a move of the
relaxed one.
"""

ENTRY = 'octile'

_R2 = math.sqrt(2)
_OPEN = ['S....', '.....', '.....', '.....', '....G']
_TRAP = ['S.#.#.#', '#...#..', '...#...', '...#...', '......G']
_WALL = ['S...........', '............', '.......#....', '.......#....', '.......#....', '.......#...G']


def _three(sol, a, b):
    return sol.manhattan(a, b), sol.euclidean(a, b), sol.octile(a, b)


def _true(rows, diagonal):
    p = GridProblem(rows, diagonal)
    return p, cost_to(problem_graph(p), p.goal)


def _over(fn, goal, hstar):
    "First cell where fn overestimates, or None."
    for c in sorted(hstar):
        if fn(c, goal) > hstar[c] + 1e-9:
            return c
    return None


def _four_moves(sol):
    p, hstar = _true(SLIDE_GRID, False)
    for name in ('manhattan', 'euclidean', 'octile'):
        c = _over(getattr(sol, name), p.goal, hstar)
        if c:
            return False, f'{name}{c, p.goal} = {getattr(sol, name)(c, p.goal):.3f} > h* = {hstar[c]:.3f}'
    for c in hstar:
        m, e, o = _three(sol, c, p.goal)
        if not m + 1e-9 >= o >= e - 1e-9:
            return False, f'at {c}: Manhattan {m}, octile {o:.3f}, Euclidean {e:.3f} - expected M >= O >= E'
    return True, f'on all {len(hstar)} cells: all three admissible, and Manhattan >= octile >= Euclidean'


def _eight_moves(sol):
    p, hstar = _true(_OPEN, True)
    c = _over(sol.manhattan, p.goal, hstar)
    if c is None:
        return False, 'Manhattan never overestimates here? With diagonal moves it should (check your function)'
    for name in ('euclidean', 'octile'):
        bad = _over(getattr(sol, name), p.goal, hstar)
        if bad:
            return False, f'{name} overestimates at {bad}: check your formula'
    return True, (f'Manhattan overestimates, e.g. at {c}: {sol.manhattan(c, p.goal)} > h* = {hstar[c]:.3f}; '
                  f'Euclidean and octile are admissible')


def _exact(sol):
    p, hstar = _true(_OPEN, True)
    for c, hs in hstar.items():
        if abs(sol.octile(c, p.goal) - hs) > 1e-9:
            return False, f'octile{c, p.goal} = {sol.octile(c, p.goal):.3f} but h* = {hs:.3f} on an empty grid'
    return True, f'octile = h* on all {len(hstar)} cells of an empty 5x5 grid'


def _astar(sol, rows, name):
    p = Instrumented(GridProblem(rows, True))
    fn = getattr(sol, name)
    node = astar_search(p, lambda n: fn(n.state, p.goal))
    return node.path_cost, len(p.expanded)


def _trap(sol):
    (co, eo), (cm, em) = _astar(sol, _TRAP, 'octile'), _astar(sol, _TRAP, 'manhattan')
    best = _true(_TRAP, True)[1][(0, 0)]
    msg = (f'A* + octile: cost {co:.3f} ({eo} expansions);  A* + Manhattan: cost {cm:.3f} '
           f'({em} expansions);  C* = {best:.3f}')
    return abs(co - best) < 1e-9 and cm > best + 1e-9, msg


def _dominance(sol):
    (co, eo), (ce, ee) = _astar(sol, _WALL, 'octile'), _astar(sol, _WALL, 'euclidean')
    msg = f'A* + octile: cost {co:.3f}, {eo} expansions;  A* + Euclidean: cost {ce:.3f}, {ee} expansions'
    return abs(co - ce) < 1e-9 and eo < ee, msg


TESTS = [
    Test('slide p.212: (0,0) -> (4,4)', call=lambda sol: _three(sol, (0, 0), (4, 4)),
         expected=(8, 4 * _R2, 4 * _R2), show='(manhattan, euclidean, octile)'),
    Test('(7,1) -> (2,3)', call=lambda sol: _three(sol, (7, 1), (2, 3)),
         expected=(7, math.sqrt(29), 3 + 2 * _R2), show='(manhattan, euclidean, octile): dx = 5, dy = 2'),
    Test('zero at the goal', call=lambda sol: _three(sol, (3, 5), (3, 5)), expected=(0, 0, 0),
         show='(manhattan, euclidean, octile) from (3, 5) to itself'),
    Test('4 moves: all admissible, Manhattan dominates', call=_four_moves, check=lambda got: got,
         show='slide grid, exact h* by uniform-cost search from the goal'),
    Test('8 moves: Manhattan overestimates', call=_eight_moves, check=lambda got: got,
         show='empty 5x5 grid with diagonal moves'),
    Test('octile is the exact cost of the relaxed problem', call=_exact, check=lambda got: got,
         show='empty 5x5 grid with diagonal moves: octile == h*'),
    Test('A* with an overestimating heuristic', call=_trap, check=lambda got: got,
         show=' / '.join(_TRAP) + ' (8 moves)'),
    Test('the dominating heuristic expands fewer nodes', call=_dominance, check=lambda got: got,
         show=' / '.join(_WALL) + ' (8 moves)'),
]
