import math
import random

from harness import Test
from aima import undirected, directed
from informed_lib import (GridProblem, SLIDE_GRID, problem_graph, cost_to,
                          check_admissible, check_consistent)

TITLE = 'Is this heuristic admissible? Is it consistent?'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['admissibility', 'consistency', 'h*', 'uniform-cost search', 'triangle inequality']

STATEMENT = r"""
The two properties that make A* optimal (slides p. 206, 218):

- **admissible**: $0 \le h(n) \le h^*(n)$ for every $n$, where $h^*(n)$ is the true cost of
  the cheapest path from $n$ to the goal (*h never overestimates*);
- **consistent**: $h(n) \le c(n, a, n') + h(n')$ for every node $n$ and successor $n'$, and
  $h(\text{goal}) = 0$ (*triangle inequality*).

A graph is a dict `{state: {neighbor: cost}}` (possibly **directed**), a heuristic is a dict
`{state: value}` — use `h.get(s, 0)` for missing states. Implement:

1. `h_star(graph, goal)` → dict `{state: true cost to goal}` for **every** state of the graph
   (states appearing only as neighbors included), `math.inf` if the goal is unreachable from it.
   Hint: run uniform-cost search (Dijkstra) **backwards from the goal**, following the edges in
   reverse;
2. `is_admissible(graph, h, goal)` → `True` / `False`;
3. `is_consistent(graph, h, goal)` → `True` / `False`.

The last test checks your functions on hundreds of random graphs, and counts how many of the
random heuristics were consistent, admissible, or neither.
"""

STARTER = '''import math
from typing import Any
from aima import PriorityQueue

def h_star(graph: dict[Any, dict], goal: Any) -> dict[Any, float]:
    """True cost from every state to the goal (math.inf if the goal cannot be reached)."""
    # TODO: reverse the edges, then uniform-cost search from the goal
    return {}

def is_admissible(graph: dict[Any, dict], h: dict[Any, float], goal: Any) -> bool:
    # TODO: 0 <= h(n) <= h*(n) for every n
    return False

def is_consistent(graph: dict[Any, dict], h: dict[Any, float], goal: Any) -> bool:
    # TODO: h(goal) == 0 and h(n) <= c(n, n') + h(n') on every edge
    return False
'''

SOLUTION = '''import math
from typing import Any
from aima import PriorityQueue

def h_star(graph: dict[Any, dict], goal: Any) -> dict[Any, float]:
    """True cost from every state to the goal (math.inf if the goal cannot be reached)."""
    reverse: dict[Any, dict] = {}                   # reverse[s1][s] = cost of s -> s1
    for s, neighbors in graph.items():
        for s1, c in neighbors.items():
            reverse.setdefault(s1, {})[s] = c
    states = set(graph) | set(reverse)
    cost: dict[Any, float] = {s: math.inf for s in states}
    cost[goal] = 0
    frontier = PriorityQueue([goal], key=lambda s: cost[s])
    done: set = set()
    while frontier:
        s = frontier.pop()
        if s in done:
            continue
        done.add(s)
        for s0, c in reverse.get(s, {}).items():  # s0 -> s costs c
            if cost[s] + c < cost[s0]:
                cost[s0] = cost[s] + c
                frontier.add(s0)
    return cost

def is_admissible(graph: dict[Any, dict], h: dict[Any, float], goal: Any) -> bool:
    hs = h_star(graph, goal)
    return all(0 <= h.get(s, 0) <= hs[s] for s in hs)

def is_consistent(graph: dict[Any, dict], h: dict[Any, float], goal: Any) -> bool:
    if h.get(goal, 0) != 0:
        return False
    return all(h.get(s, 0) <= c + h.get(s1, 0)
               for s, neighbors in graph.items() for s1, c in neighbors.items())
'''

HINTS = [
    '$h^*(n)$ is a shortest-path distance *to* the goal. Uniform-cost search computes shortest distances '
    '*from* its start state... so start it from the goal, on a graph with every edge reversed.',
    'Build `reverse[s1][s] = c` for every edge `s -> s1`; then pop states in order of cost from a '
    '`PriorityQueue(key=lambda s: cost[s])` and relax `cost[s0] = min(cost[s0], cost[s] + c)`. '
    'A state may be in the queue several times: skip it if already done.',
    'Admissible: `all(0 <= h.get(s, 0) <= hs[s] for s in hs)`. Consistent: check `h(goal) == 0`, '
    'then the inequality on every `(s, s1, c)` edge of `graph`.',
]

EXPLANATION = r"""
**Admissibility needs $h^*$, consistency does not.** To check admissibility you must solve the
problem from *every* state (here: one backward uniform-cost search). Consistency is a **local**
test on each edge: that is why it is the property we verify when designing heuristics.

**Consistent ⇒ admissible** (slide p. 218). Take an optimal path
$n = n_0, n_1, \dots, n_k = \text{goal}$ and chain the inequality along it:
$$h(n_0) \le c(n_0, n_1) + h(n_1) \le \dots \le \sum_i c(n_i, n_{i+1}) + h(\text{goal}) = h^*(n).$$
The converse is false: the slide p. 227 heuristic is admissible ($100 \le 101$, $90 \le 100$, …)
but $h(A) = 100 > c(A, C) + h(C) = 1 + 90$.

The random test shows it empirically: every heuristic that was consistent was also admissible,
while many admissible ones were not consistent.

**Grid maps (slides p. 211, 222).** With 4 moves the Manhattan distance is admissible *and*
consistent; once diagonal moves of cost $\sqrt 2$ are allowed it is neither: one diagonal step
lowers it by 2 but costs only $\sqrt 2 \approx 1.41$.
"""

ENTRY = 'h_star'

_G = undirected([('S', 'A', 2), ('S', 'B', 3), ('A', 'C', 3), ('B', 'C', 4), ('A', 'D', 4),
                 ('C', 'G', 4), ('D', 'G', 5), ('B', 'E', 3), ('E', 'G', 6)])
_H = {'S': 8, 'A': 6, 'B': 6, 'C': 3, 'D': 2, 'E': 5, 'G': 0}
_ONE_WAY = directed([('S', 'A', 1), ('A', 'G', 5), ('S', 'G', 10), ('G', 'B', 1), ('B', 'A', 1),
                     ('C', 'S', 2), ('G', 'X', 1)])
_INCONSISTENT = directed([('S', 'A', 1), ('S', 'B', 2), ('A', 'C', 1), ('B', 'C', 2), ('C', 'G', 100)])
_H_INC = {'S': 0, 'A': 100, 'B': 1, 'C': 90, 'G': 0}
_P219 = directed([('N', 'M', 10), ('M', 'G', 25)])


def _both(sol, graph, h, goal='G'):
    return sol.is_admissible(graph, h, goal), sol.is_consistent(graph, h, goal)


def _grid(sol, diagonal):
    p = GridProblem(SLIDE_GRID, diagonal)
    graph = problem_graph(p)
    gx, gy = p.goal
    h = {(x, y): abs(x - gx) + abs(y - gy) for (x, y) in graph}
    return _both(sol, graph, h, p.goal)


def _random(sol):
    rng = random.Random(2024)
    counts = {'consistent': 0, 'admissible only': 0, 'not admissible': 0}
    for trial in range(300):
        n = rng.randint(3, 7)
        names = 'GABCDEF'[:n]
        graph = {s: {} for s in names}
        for _ in range(rng.randint(n, 2 * n)):
            a, b = rng.sample(names, 2)
            graph[a][b] = rng.randint(1, 5)
        hs = cost_to(graph, 'G')
        kind = trial % 3
        h = {}
        for s in names:
            top = hs.get(s, 6)
            h[s] = (top // 2 if kind == 0 else rng.randint(0, top) if kind == 1 else rng.randint(0, 2 * top))
        if kind == 0:
            h['G'] = 0
        want = (check_admissible(graph, h, 'G')[0], check_consistent(graph, h, 'G')[0])
        got = _both(sol, graph, h)
        if got != want:
            return False, f'graph {graph}, h = {h}: you say (admissible, consistent) = {got}, expected {want}'
        counts['consistent' if want[1] else 'admissible only' if want[0] else 'not admissible'] += 1
    return True, (f"300 random heuristics: {counts['consistent']} consistent (all of them admissible), "
                  f"{counts['admissible only']} admissible but not consistent, "
                  f"{counts['not admissible']} not admissible")


TESTS = [
    Test('h* on the example graph', args=(_G, 'G'),
         expected={'G': 0, 'C': 4, 'D': 5, 'E': 6, 'A': 7, 'B': 8, 'S': 9},
         show='the graph of the A* problem, goal G'),
    Test('h* with one-way edges', args=(_ONE_WAY, 'G'),
         expected={'G': 0, 'A': 5, 'S': 6, 'B': 6, 'C': 8, 'X': math.inf},
         show='S->A 1, A->G 5, S->G 10, G->B 1, B->A 1, C->S 2, G->X 1  (X cannot reach G)'),
    Test('consistent heuristic', call=lambda sol: _both(sol, _G, _H), expected=(True, True),
         show='(is_admissible, is_consistent) on the example graph'),
    Test('slide p.227: admissible, not consistent', call=lambda sol: _both(sol, _INCONSISTENT, _H_INC),
         expected=(True, False), show='h(A) = 100 > c(A, C) + h(C) = 1 + 90'),
    Test('slide p.219: overestimating', call=lambda sol: _both(sol, _P219, {'N': 100, 'M': 20}),
         expected=(False, False), show='N->M 10, M->G 25;  h(N) = 100, h(M) = 20'),
    Test('h(goal) must be 0', call=lambda sol: _both(sol, _G, dict(_H, G=1)), expected=(False, False),
         show='example graph with h(G) = 1'),
    Test('h must not be negative', call=lambda sol: sol.is_admissible(_G, dict(_H, E=-1), 'G'),
         expected=False, show='example graph with h(E) = -1'),
    Test('Manhattan distance, 4 moves (slides p.211, 222)', call=lambda sol: _grid(sol, False),
         expected=(True, True), show='slide grid, moves of cost 1'),
    Test('Manhattan distance with diagonal moves', call=lambda sol: _grid(sol, True),
         expected=(False, False), show='slide grid, diagonal moves cost sqrt(2)'),
    Test('300 random graphs and heuristics', call=_random, check=lambda got: got,
         show='compared with a reference implementation', timeout=20),
]
