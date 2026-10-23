import random
from collections import deque

from harness import Test
from aima import undirected
from uninformed_lib import CountingProblem

TITLE = 'Bidirectional Breadth-First Search'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['bidirectional search', 'BFS', 'complexity']

STATEMENT = r"""
Bidirectional search runs **two searches at once**: forward from the initial state and backward from
the goal, and stops when they **meet** (slides p. 163–168). Two BFS of depth $d/2$ generate about
$2\,b^{d/2}$ nodes instead of $b^d$: for $b = 10, d = 6$ that is 2,000 instead of 1,000,000.

Write `bidirectional_bfs(problem)` for an **undirected** `GraphProblem` (so the predecessors of a
state are just its neighbors, and `expand(problem, Node(problem.goal))` searches backward). Return the
**list of states** from `problem.initial` to `problem.goal` (a shortest one), or `None`.

Rules (they guarantee a shortest path):

1. Keep one `reached` dict per direction (state → node) and one frontier per direction.
2. At each step expand **one whole layer** of the side whose frontier is **smaller** (forward on ties).
3. When you generate a state that is new for this side, record it; if the **other** side has already
   reached it, the searches met there: join the two half-paths and return.

Joining: `path_states(fwd[s])` goes initial → s, `path_states(bwd[s])` goes goal → s.
"""

STARTER = '''from typing import Any
from aima import GraphProblem, Node, expand, path_states

def bidirectional_bfs(problem: GraphProblem) -> list | None:
    start, goal = problem.initial, problem.goal
    if start == goal:
        return [start]
    fwd: dict[Any, Node] = {start: Node(start)}  # reached by the forward search
    bwd: dict[Any, Node] = {goal: Node(goal)}    # reached by the backward search
    frontier_f, frontier_b = [fwd[start]], [bwd[goal]]
    # TODO: while both frontiers are non-empty, expand a whole layer of the smaller one;
    #       if a newly reached state is also reached by the other side, join the paths
    return None
'''

SOLUTION = '''from typing import Any
from aima import GraphProblem, Node, expand, path_states

def bidirectional_bfs(problem: GraphProblem) -> list | None:
    start, goal = problem.initial, problem.goal
    if start == goal:
        return [start]
    fwd: dict[Any, Node] = {start: Node(start)}
    bwd: dict[Any, Node] = {goal: Node(goal)}
    frontier_f, frontier_b = [fwd[start]], [bwd[goal]]
    while frontier_f and frontier_b:
        if len(frontier_f) <= len(frontier_b):
            frontier_f, meet = expand_layer(problem, frontier_f, fwd, bwd)
        else:
            frontier_b, meet = expand_layer(problem, frontier_b, bwd, fwd)
        if meet is not None:
            return path_states(fwd[meet]) + path_states(bwd[meet])[-2::-1]
    return None

def expand_layer(problem: GraphProblem, layer: list[Node], reached: dict[Any, Node],
                 other: dict[Any, Node]) -> tuple[list[Node], Any]:
    """Expand every node of `layer`. Return (next layer, meeting state or None)."""
    next_layer: list[Node] = []
    for node in layer:
        for child in expand(problem, node):
            s = child.state
            if s not in reached:
                reached[s] = child
                if s in other:
                    return next_layer, s
                next_layer.append(child)
    return next_layer, None
'''

HINTS = [
    'Write a helper `expand_layer(problem, layer, reached, other)` that expands all nodes of one layer and '
    'returns the next layer, plus the meeting state if it found one. Call it for the forward side with '
    '`(fwd, bwd)` and for the backward side with `(bwd, fwd)`.',
    'Inside the helper: for each child whose state `s` is not in `reached`: `reached[s] = child`; '
    '`if s in other: return next_layer, s`; else append the child to the next layer.',
    'Join: `path_states(fwd[s]) + path_states(bwd[s])[-2::-1]` (the backward half reversed, without '
    'repeating `s`). If one frontier becomes empty, its whole component was explored: return `None`.',
]

EXPLANATION = r"""
**Why it is fast.** Each side only goes about $d/2$ deep: $O(b^{d/2})$ time and space instead of $O(b^d)$.
On the random graph with $d = 9$, BFS expanded almost all of its ~4,000 nodes; the two half-searches
together expanded about a hundred.

**Why it finds a shortest path.** Before a forward layer is expanded, the forward side has reached every
state within $k_f$ steps of the start, the backward side every state within $k_b$ steps of the goal,
and the two sets are disjoint (otherwise we would have stopped): so the shortest path has length
$\ge k_f + k_b + 1$. The meeting found in this layer has length $\le (k_f + 1) + k_b$: it is a shortest
one. Expanding node by node instead of layer by layer can return a path one step too long: in the
"whole layers" test, alternating single nodes expands S, G, A, then B, which generates C (already
reached forward through A) before D, and returns S → A → C → B → G instead of S → D → B → G.

**What it needs** (why it is not always applicable):
- an **explicit goal state** to search back from (fine for the 8-puzzle, p. 164–165; not for
  "checkmate" or "8 queens placed", which describe goals only by a test);
- a way to compute **predecessors** (easy with reversible actions / undirected graphs);
- memory: at least one side must keep its `reached` table to detect the meeting, so space is
  $O(b^{d/2})$ — unlike IDS.

With unit costs and BFS on both sides it is complete and optimal.
"""

ENTRY = 'bidirectional_bfs'


def _random_graph(n, k, seed):
    rng = random.Random(seed)
    edges = set()
    for i in range(n):
        for _ in range(k):
            j = rng.randrange(n)
            if j != i:
                edges.add((min(i, j), max(i, j)))
    return undirected([(a, b, 1) for a, b in sorted(edges)])


def _bfs_stats(graph, start, goal):
    """(distance start->goal or None, nodes a plain BFS expands before selecting the goal)."""
    dist, q, expanded = {start: 0}, deque([start]), 0
    while q:
        u = q.popleft()
        if u == goal:
            return dist[u], expanded
        expanded += 1
        for v in sorted(graph.get(u, {})):
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return None, expanded


_CHAIN = undirected([('S', 'A', 1), ('A', 'B', 1), ('B', 'C', 1), ('C', 'G', 1)])
_SQUARE = undirected([('S', 'A', 1), ('A', 'G', 1), ('S', 'B', 1), ('B', 'G', 1), ('S', 'X', 1),
                      ('X', 'Y', 1), ('Y', 'Z', 1), ('Z', 'G', 1)])
_TRAP = undirected([('S', 'A', 1), ('S', 'D', 1), ('A', 'C', 1), ('B', 'C', 1), ('B', 'D', 1), ('B', 'G', 1)])
_SPLIT = undirected([('S', 'A', 1), ('A', 'B', 1), ('X', 'Y', 1), ('Y', 'G', 1)])
_BIG = _random_graph(4000, 2, 7)


def _check(compare_bfs=False):
    def check(got, p):
        dist, bfs_expanded = _bfs_stats(p.graph, p.initial, p.goal)
        if dist is None:
            return got is None, 'no path exists: return None' if got is not None else 'returned None'
        if not isinstance(got, list) or not got:
            return False, f'return the list of states from start to goal, not {got!r}'
        if got[0] != p.initial or got[-1] != p.goal:
            return False, f'the path must go from {p.initial!r} to {p.goal!r}; yours goes {got[0]!r} → {got[-1]!r}'
        bad = [(a, b) for a, b in zip(got, got[1:]) if b not in p.graph.get(a, {})]
        if bad:
            return False, f'{bad[0][0]!r} → {bad[0][1]!r} is not an edge: check how you join the two halves'
        if len(got) - 1 != dist:
            return False, (f'your path has {len(got) - 1} steps, the shortest has {dist}. Expand a whole layer '
                           'at a time and stop at the first meeting.')
        msg = f'{dist} steps, {len(p.expanded)} expansions'
        if compare_bfs:
            msg += f' (plain BFS: {bfs_expanded})'
            if len(p.expanded) * 5 > bfs_expanded:
                return False, msg + ': too many — expand the smaller frontier, and stop as soon as the searches meet.'
        return True, msg
    return check


TESTS = [
    Test('chain S-A-B-C-G', args=(CountingProblem('S', 'G', _CHAIN),), check=_check(), show='S-A-B-C-G'),
    Test('start is goal', args=(CountingProblem('S', 'S', _CHAIN),), check=_check()),
    Test('two routes: take the short one', args=(CountingProblem('S', 'G', _SQUARE),), check=_check(),
         show='S-A-G, S-B-G (2 steps) and S-X-Y-Z-G (4 steps)'),
    Test('whole layers, not single nodes', args=(CountingProblem('S', 'G', _TRAP),), check=_check(),
         show='S-A, S-D, A-C, B-C, B-D, B-G: shortest S-D-B-G'),
    Test('no path → None', args=(CountingProblem('S', 'G', _SPLIT),), check=_check(),
         show='S-A-B and X-Y-G (two components)'),
    Test('random graph, 4000 states, d = 7', args=(CountingProblem(0, 2, _BIG),), check=_check(True),
         show='random graph (4000 states, ~4 neighbors each), from 0 to 2'),
    Test('random graph, 4000 states, d = 9', args=(CountingProblem(0, 32, _BIG),), check=_check(True),
         show='random graph (4000 states, ~4 neighbors each), from 0 to 32'),
]
