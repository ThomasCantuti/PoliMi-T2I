import random

from harness import Test
from aima import GraphProblem, undirected
from informed_lib import Instrumented, astar_search, cost_from, cost_to

TITLE = 'Which nodes does A* expand? f(n) vs C*'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['A*', 'C*', 'contours', 'optimal efficiency', 'dominance']

STATEMENT = r"""
With a consistent heuristic, A* can be predicted **without running it** (slide p. 232):

- it expands **all** nodes with $f(n) < C^*$,
- **some** nodes with $f(n) = C^*$ (it depends on tie-breaking),
- **no** node with $f(n) > C^*$,

where $f(n) = g^*(n) + h(n)$ uses the optimal cost $g^*(n)$ from the start (with a consistent
$h$, A* reaches every state it expands through an optimal path) and $C^* = g^*(\text{goal})$.

Implement `classify(graph, h, start, goal)` returning a dict `{state: label}` for every state
of the graph:

- `'surely'` if $f(n) < C^*$, `'maybe'` if $f(n) = C^*$,
- `'never'` if $f(n) > C^*$ **or** the state cannot be reached from `start`.

`graph` is `{state: {neighbor: cost}}`, `h` a dict `{state: value}` (consistent), and the goal is
reachable. On the graph of the A* problem ($C^* = 9$):

| n | S | A | B | C | D | E | G |
|---|---|---|---|---|---|---|---|
| $g^*$ | 0 | 2 | 3 | 5 | 6 | 6 | 9 |
| $h$ | 8 | 6 | 6 | 3 | 2 | 5 | 0 |
| $f$ | 8 | 8 | 9 | 8 | 8 | 11 | 9 |
| label | surely | surely | maybe | surely | surely | never | maybe |
"""

STARTER = '''import math
from aima import PriorityQueue

def classify(graph: dict[str, dict], h: dict[str, float], start: str, goal: str) -> dict[str, str]:
    """{state: 'surely' | 'maybe' | 'never'} comparing f(n) = g*(n) + h(n) with C*."""
    # TODO: 1. g*(n) for every state (uniform-cost search from start)
    #       2. C* = g*(goal);  3. label every state of the graph
    return {}
'''

SOLUTION = '''import math
from aima import PriorityQueue

def classify(graph: dict[str, dict], h: dict[str, float], start: str, goal: str) -> dict[str, str]:
    """{state: 'surely' | 'maybe' | 'never'} comparing f(n) = g*(n) + h(n) with C*."""
    g: dict[str, float] = {start: 0}                 # uniform-cost search from start
    frontier = PriorityQueue([start], key=lambda s: g[s])
    done: set[str] = set()
    while frontier:
        s = frontier.pop()
        if s in done:
            continue
        done.add(s)
        for s1, c in graph.get(s, {}).items():
            if g[s] + c < g.get(s1, math.inf):
                g[s1] = g[s] + c
                frontier.add(s1)
    c_star = g[goal]
    states = set(graph) | {s1 for nbrs in graph.values() for s1 in nbrs}
    labels: dict[str, str] = {}
    for s in states:
        f = g.get(s, math.inf) + h.get(s, 0)
        labels[s] = 'surely' if f < c_star else 'maybe' if f == c_star else 'never'
    return labels
'''

HINTS = [
    'Two ingredients: the optimal cost $g^*(n)$ from `start` to every state, and $C^*$. Both come from the '
    'same uniform-cost search (Dijkstra) started at `start`.',
    'Pop states in order of `g`, relax `g[s1] = min(g[s1], g[s] + c)`, skip states already done. '
    'States never reached keep `g = math.inf`.',
    'Then `f = g.get(s, math.inf) + h.get(s, 0)` and compare with `C* = g[goal]`. '
    'Don\'t forget states that only appear as neighbors.',
]

EXPLANATION = r"""
**Why "all nodes with $f < C^*$"?** With a consistent $h$, $f$ is non-decreasing along every
path and A* pops nodes in non-decreasing order of $f$. The goal is popped with $f = C^*$, so
every node with $f < C^*$ was popped (and expanded) before it; nodes with $f > C^*$ are still
waiting when the search stops.

**Optimally efficient** (slide p. 232): any algorithm that is guaranteed to find optimal
solutions with the same heuristic must also expand every node with $f(n) < C^*$, otherwise it
could miss a cheaper solution hidden below that node. So no optimal algorithm can do better than
A*, apart from tie-breaking among the $f = C^*$ nodes.

**Dominance, seen through the labels.** If $h_2 \ge h_1$, then
$\{n : g^* + h_2 < C^*\} \subseteq \{n : g^* + h_1 < C^*\}$: a more informed heuristic can only
shrink the "surely" set. The extremes on the example graph:

- $h = 0$ (uniform-cost search): every state with $g^* < 9$ is `surely` expanded;
- $h = h^*$ (perfect): $f(n) = g^*(n) + h^*(n) \ge C^*$ everywhere, so nothing is `surely`
  expanded, and the `maybe` states are exactly those on optimal paths.
"""

ENTRY = 'classify'

_G = undirected([('S', 'A', 2), ('S', 'B', 3), ('A', 'C', 3), ('B', 'C', 4), ('A', 'D', 4),
                 ('C', 'G', 4), ('D', 'G', 5), ('B', 'E', 3), ('E', 'G', 6)])
_H = {'S': 8, 'A': 6, 'B': 6, 'C': 3, 'D': 2, 'E': 5, 'G': 0}
_HSTAR = {'S': 9, 'A': 7, 'B': 8, 'C': 4, 'D': 5, 'E': 6, 'G': 0}
_GX = dict(_G, X={'G': 1})


def _reference(graph, h, start, goal):
    g = cost_from(graph, start)
    states = set(graph) | {s1 for nbrs in graph.values() for s1 in nbrs}
    labels = {}
    for s in states:
        f = g.get(s, float('inf')) + h.get(s, 0)
        labels[s] = 'surely' if f < g[goal] else 'maybe' if f == g[goal] else 'never'
    return labels


def _random_graph(rng):
    n = rng.randint(5, 9)
    names = ['S'] + [chr(ord('A') + i) for i in range(n - 2)] + ['G']
    rng.shuffle(names)
    edges = [(names[i], rng.choice(names[:i]), rng.randint(1, 6)) for i in range(1, n)]  # spanning tree
    edges += [tuple(rng.sample(names, 2)) + (rng.randint(1, 6),) for _ in range(n)]
    return undirected(edges)


def _random(sol):
    rng = random.Random(7)
    sizes = {0: 0, 0.5: 0, 1: 0}
    for trial in range(100):
        graph = _random_graph(rng)
        hstar = cost_to(graph, 'G')
        for r in sizes:
            h = {s: r * hstar[s] for s in graph}             # r * h* is consistent
            want = _reference(graph, h, 'S', 'G')
            got = sol.classify(graph, h, 'S', 'G')
            if got != want:
                diff = sorted(s for s in want if got.get(s) != want[s])
                return False, (f'graph {graph}, h = {r} * h*: wrong label for {diff} '
                               f'(got {[got.get(s) for s in diff]}, expected {[want[s] for s in diff]})')
            p = Instrumented(GraphProblem('S', 'G', graph, h))
            astar_search(p)
            surely = {s for s, lab in got.items() if lab == 'surely'}
            maybe = {s for s, lab in got.items() if lab == 'maybe'}
            if not surely <= set(p.expanded) <= surely | maybe:
                return False, f'A* expanded {p.expanded}, inconsistent with your labels {got}'
            sizes[r] += len(surely)
    return True, ('A* agreed with your labels on 300 runs. Total "surely" states: '
                  f'h = 0: {sizes[0]},  h = 0.5 h*: {sizes[0.5]},  h = h*: {sizes[1]}')


TESTS = [
    Test('example graph', args=(_G, _H, 'S', 'G'),
         expected={'S': 'surely', 'A': 'surely', 'B': 'maybe', 'C': 'surely', 'D': 'surely',
                   'E': 'never', 'G': 'maybe'}, show='the table above'),
    Test('h = 0 (uniform-cost search)', args=(_G, {}, 'S', 'G'),
         expected={'S': 'surely', 'A': 'surely', 'B': 'surely', 'C': 'surely', 'D': 'surely',
                   'E': 'surely', 'G': 'maybe'}, show='same graph, h(n) = 0'),
    Test('h = h* (perfect heuristic)', args=(_G, _HSTAR, 'S', 'G'),
         expected={'S': 'maybe', 'A': 'maybe', 'B': 'never', 'C': 'maybe', 'D': 'never',
                   'E': 'never', 'G': 'maybe'}, show='same graph, h = h*'),
    Test('state not reachable from the start', args=(_GX, _H, 'S', 'G'),
         expected={'S': 'surely', 'A': 'surely', 'B': 'maybe', 'C': 'surely', 'D': 'surely',
                   'E': 'never', 'G': 'maybe', 'X': 'never'}, show='example graph + one-way edge X->G'),
    Test('100 random graphs, checked against A*', call=_random, check=lambda got: got,
         show='h = 0, 0.5 h*, h* on each graph', timeout=20),
]
