from harness import Test
from aima import GraphProblem, EightPuzzle, undirected, path_states, failure
from informed_lib import (Instrumented, weighted_astar_search, GridProblem, SLIDE_GRID,
                          manhattan_tiles, cost_to, states_of, validate_graph, check_admissible)

TITLE = 'Weighted A*: trading optimality for speed'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['weighted A*', 'satisficing', 'suboptimality bound', 'counterexample']

STATEMENT = r"""
A* is optimal but may expand a huge number of nodes. If a **"good enough"** (satisficing)
solution is fine, **weighted A*** inflates the heuristic (slides p. 236–238):
$$f(n) = g(n) + w \cdot h(n), \qquad 1 \le w < \infty .$$

1. Implement `weighted_astar_search(problem, h=None, weight=1.4)` (default `h = problem.h`):
   best-first search with that $f$. You may import `best_first_search` from `informed_lib`
   (it is the course code you wrote in the greedy problem). Return the goal node.
2. Implement `weighted_trap()` returning `(graph, h, start, goal)` where $h$ is **admissible** but
   weighted A* with **`weight=2`** returns a path that is **more expensive than the optimal one**.

The tests run your search on the slide grid and on a hard 8-puzzle (optimal cost 31) for
several weights: look at the costs and at the number of expanded nodes.
"""

STARTER = '''from collections.abc import Callable
from informed_lib import best_first_search, g
from aima import Problem, Node, directed, undirected

def weighted_astar_search(problem: Problem, h: Callable[[Node], float] | None = None,
                          weight: float = 1.4) -> Node:
    """Best-first search with f(n) = g(n) + weight * h(n)."""
    h = h or problem.h
    # TODO
    return None

def weighted_trap() -> tuple[dict[str, dict], dict[str, float], str, str]:
    """Return (graph, h, start, goal): h admissible, yet weight=2 gives a suboptimal path."""
    graph = directed([('S', 'G', 1)])     # TODO
    h = {'S': 1, 'G': 0}
    return graph, h, 'S', 'G'
'''

SOLUTION = '''from collections.abc import Callable
from informed_lib import best_first_search, g
from aima import Problem, Node, directed, undirected

def weighted_astar_search(problem: Problem, h: Callable[[Node], float] | None = None,
                          weight: float = 1.4) -> Node:
    """Best-first search with f(n) = g(n) + weight * h(n)."""
    h = h or problem.h
    return best_first_search(problem, f=lambda n: g(n) + weight * h(n))

def weighted_trap() -> tuple[dict[str, dict], dict[str, float], str, str]:
    """Return (graph, h, start, goal): h admissible, yet weight=2 gives a suboptimal path."""
    # Optimal: S-A-G costing 4. With w = 2: f(A) = 1 + 2*3 = 7 > f(G via B) = 5 + 0 = 5.
    graph = directed([('S', 'A', 1), ('A', 'G', 3), ('S', 'B', 1), ('B', 'G', 4)])
    h = {'S': 4, 'A': 3, 'B': 0, 'G': 0}   # h(B) = 0 makes B look great (still admissible)
    return graph, h, 'S', 'G'
'''

HINTS = [
    '`weighted_astar_search` is one line on top of `best_first_search`: only $f$ changes.',
    'For the trap: weighted A* multiplies $h$ by 2, so a node with a large (but correct) $h$ looks twice as '
    'far as it is. Put the optimal path behind a node with a large $h$, and the worse path behind a node '
    'with a small $h$.',
    'Two routes S→A→G and S→B→G with the same first step: give A an $h$ equal to its true cost $h^*(A)$, '
    'give B $h = 0$, and make S→B→G only a bit more expensive. Check: when is $g + 2h$ of A larger than '
    'the cost of the solution through B?',
]

EXPLANATION = r"""
**The bound.** With an admissible $h$, weighted A* returns a solution of cost $\le w \cdot C^*$.
When the suboptimal goal $G'$ is selected, the frontier still holds a node $n$ of an optimal
path (with $g(n) = g^*(n)$), and $G'$ was preferred to it:
$$g(G') = f(G') \le f(n) = g^*(n) + w\,h(n) \le g^*(n) + w\,h^*(n) \le w\,(g^*(n) + h^*(n)) = w\,C^*.$$

**The trade-off** on the hard 8-puzzle (Manhattan $h$, $C^* = 31$):

| $w$ | 1 (A*) | 1.5 | 2 | 5 |
|---|---|---|---|---|
| cost | 31 | 31 | 31 | 45 |
| expanded | 20450 | 967 | 427 | 286 |

Inflating $h$ makes the search **trust the heuristic more**: it dives towards the goal instead
of checking every alternative with $f < C^*$. The cost grows slowly, the work drops dramatically.

**The family** (slide p. 238 plus the other cases):

| weight | $f(n)$ | algorithm |
|---|---|---|
| $w = 0$ | $g$ | uniform-cost search |
| $w = 1$ | $g + h$ | A* |
| $1 < w < \infty$ | $g + w h$ | weighted A*, cost $\le w C^*$ |
| $w \to \infty$ | $\approx h$ | greedy best-first search |
"""

ENTRY = 'weighted_astar_search'

_G = undirected([('S', 'A', 2), ('S', 'B', 3), ('A', 'C', 3), ('B', 'C', 4), ('A', 'D', 4),
                 ('C', 'G', 4), ('D', 'G', 5), ('B', 'E', 3), ('E', 'G', 6)])
_H = {'S': 8, 'A': 6, 'B': 6, 'C': 3, 'D': 2, 'E': 5, 'G': 0}
_HARD = (8, 6, 7, 2, 5, 4, 3, 0, 1)


def _run(sol, problem, h, w):
    p = Instrumented(problem)
    node = sol.weighted_astar_search(p, h, w)
    if node is None or node is failure:
        raise ValueError('weighted_astar_search returned no solution')
    return node, p.expanded


def _w1(sol):
    node, expanded = _run(sol, GraphProblem('S', 'G', _G, _H), None, 1)
    return path_states(node), expanded


def _grid(sol):
    out = []
    for w in (1, 2, 1000):
        p = GridProblem(SLIDE_GRID)
        gx, gy = p.goal
        node, expanded = _run(sol, p, lambda n: abs(n.state[0] - gx) + abs(n.state[1] - gy), w)
        out.append((w, node.path_cost, len(expanded)))
    return out


def _hard(sol):
    rows = []
    for w in (1.5, 2, 5):
        node, expanded = _run(sol, EightPuzzle(_HARD), lambda n: manhattan_tiles(n.state), w)
        rows.append((w, node.path_cost, len(expanded)))
    msg = '; '.join(f'w = {w}: cost {c}, {e} expanded' for w, c, e in rows) + ' (A*: cost 31, 20450 expanded)'
    ok = all(c <= w * 31 and e < 20450 / 10 for w, c, e in rows)
    return ok, msg


def _unpack(got):
    try:
        graph, h, start, goal = got
    except (TypeError, ValueError):
        raise ValueError('weighted_trap() must return a tuple (graph, h, start, goal)')
    validate_graph(graph)
    if not isinstance(h, dict):
        raise TypeError('h must be a dict {state: value}')
    if start not in states_of(graph) or start not in cost_to(graph, goal):
        raise ValueError(f'{goal} must be reachable from {start}')
    return graph, h, start, goal


def _trap_admissible(sol):
    graph, h, start, goal = _unpack(sol.weighted_trap())
    ok, why = check_admissible(graph, h, goal)
    return ok, why or 'h is admissible'


def _trap_fails(sol):
    graph, h, start, goal = _unpack(sol.weighted_trap())
    node = weighted_astar_search(GraphProblem(start, goal, graph, h), weight=2)
    best = cost_to(graph, goal)[start]
    msg = f'weighted A* (w = 2) returns {path_states(node)} with cost {node.path_cost}; C* = {best}'
    return best < node.path_cost <= 2 * best, msg


TESTS = [
    Test('weight = 1 is A*', call=_w1, expected=(['S', 'A', 'C', 'G'], ['S', 'A', 'C', 'D', 'B']),
         show='(path, expanded states) on the graph of the A* problem'),
    Test('navigation grid: w = 1, 2, 1000', call=_grid, expected=[(1, 11, 25), (2, 11, 23), (1000, 25, 27)],
         show='[(weight, cost, expanded)] with the Manhattan distance; w = 1000 behaves like greedy'),
    Test('hard 8-puzzle: cost <= w * C*, far fewer expansions', call=_hard, check=lambda got: got,
         show='8 6 7 / 2 5 4 / 3 _ 1 with Manhattan h, w = 1.5, 2, 5', timeout=20),
    Test('trap: h is admissible', call=_trap_admissible, check=lambda got: got, show='weighted_trap()'),
    Test('trap: w = 2 returns a suboptimal path', call=_trap_fails, check=lambda got: got,
         show='weighted_trap() with weight=2'),
]
