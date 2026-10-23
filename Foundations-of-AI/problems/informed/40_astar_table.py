from harness import Test
from aima import GraphProblem, EightPuzzle, undirected, directed, path_states, path_actions, failure
from informed_lib import GridProblem, SLIDE_GRID, misplaced_tiles

TITLE = 'A* search, step by step: the expansion table'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['A*', 'trace', 'f = g + h', 'tie-breaking', 'consistency']

STATEMENT = r"""
A* is best-first search with $f(n) = g(n) + h(n)$ (slides p. 193–194): $g$ is what the path
to $n$ **cost for sure**, $h$ is the **guess** for the rest. Exam exercises ask you to trace
it: in which order are nodes selected, and with which $g$ and $f$?

Implement `astar_table(problem, h=None)` (default `h = problem.h`). Run A* with the course's
`best_first_search` loop (slide p. 186: goal test on selection, `reached` table, re-add a state
reached by a cheaper path), and record one row `(state, g, f)` **for every node selected
from the frontier**, in order, including the goal node (last row). Return `(node, rows)`:
the goal node (or `failure`) and the list of rows.

```text
            A(6) ---4--- D(2)
          2/   \3           \5
       S(8)     C(3) ---4--- G(0)        h(n) in brackets
          3\   /4           /6
            B(6) ---3--- E(5)
```

| # | state | g | h | f |
|---|---|---|---|---|
| 1 | S | 0 | 8 | 8 |
| 2 | A | 2 | 6 | 8 |
| 3 | C | 5 | 3 | 8 |
| 4 | D | 6 | 2 | 8 |
| 5 | B | 3 | 6 | 9 |
| 6 | G | 9 | 0 | 9 |

so `rows == [('S', 0, 8), ('A', 2, 8), ('C', 5, 8), ('D', 6, 8), ('B', 3, 9), ('G', 9, 9)]`
and the solution is `S → A → C → G` with cost 9. Trace it by hand first: why does C come
before D, and B before G, although they have the same $f$?
"""

STARTER = '''from collections.abc import Callable
from typing import Any
from aima import Problem, Node, expand, PriorityQueue, failure

def astar_table(problem: Problem, h: Callable[[Node], float] | None = None) -> tuple[Node, list[tuple]]:
    """A* search. Returns (goal node or failure, rows) where rows lists (state, g, f)
    for every node selected from the frontier, in order."""
    h = h or problem.h
    rows: list[tuple] = []
    # TODO: best_first_search with f(n) = g(n) + h(n), appending a row at every pop
    return failure, rows
'''

SOLUTION = '''from collections.abc import Callable
from typing import Any
from aima import Problem, Node, expand, PriorityQueue, failure

def astar_table(problem: Problem, h: Callable[[Node], float] | None = None) -> tuple[Node, list[tuple]]:
    """A* search. Returns (goal node or failure, rows) where rows lists (state, g, f)
    for every node selected from the frontier, in order."""
    h = h or problem.h
    def f(n: Node) -> float: return n.path_cost + h(n)
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached: dict[Any, Node] = {problem.initial: node}
    rows: list[tuple] = []
    while frontier:
        node = frontier.pop()
        rows.append((node.state, node.path_cost, f(node)))
        if problem.is_goal(node.state):
            return node, rows
        for child in expand(problem, node):
            s = child.state
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child
                frontier.add(child)
    return failure, rows
'''

HINTS = [
    'Start from your `best_first_search`: only $f$ and the bookkeeping of `rows` are new.',
    'Define `f(n) = n.path_cost + h(n)` and pass it as the `key` of the `PriorityQueue`. '
    'Append the row right after `frontier.pop()`, *before* the goal test, so the goal row is included.',
    'Ties: `PriorityQueue` pops equal-$f$ nodes in insertion order, and `expand` generates children in '
    'alphabetical order. Do not sort anything yourself.',
]

EXPLANATION = r"""
**Reading the table.** C and D both have $f = 8$: C was added to the frontier first (children are
generated alphabetically), so it is popped first. B and G both have $f = 9 = C^*$: B entered the
frontier when S was expanded, long before G, so B is expanded although it is useless. This is the
slide p. 232 statement *"A* expands **some** nodes with $f(n) = C^*$"*: which ones depends on tie-breaking.

**$f$ never decreases (consistent $h$).** For a child $n'$ of $n$:
$f(n') = g(n) + c(n, a, n') + h(n') \ge g(n) + h(n) = f(n)$ because $h(n) \le c + h(n')$
(slide p. 225). So the $f$ column is non-decreasing, A* expands nodes in **contours** of increasing
$f$, and the first time a state is selected it has its optimal $g$.

**Inconsistent $h$** (slide p. 227 test): the $f$ column goes 101 → 92 and **C is selected
twice**: the first time with $g = 4$, then again with the cheaper $g = 2$ found later through A.
The course's `best_first_search` re-adds C, so A* still returns the optimal cost 102 — it just
pays for it with a re-expansion.

**$h = 0$** turns A* into uniform-cost search (slide p. 235): the table lists nodes in order of $g$.
On the navigation grid A* with the Manhattan distance selects 26 nodes, UCS 30.
"""

ENTRY = 'astar_table'

_G = undirected([('S', 'A', 2), ('S', 'B', 3), ('A', 'C', 3), ('B', 'C', 4), ('A', 'D', 4),
                 ('C', 'G', 4), ('D', 'G', 5), ('B', 'E', 3), ('E', 'G', 6)])
_H = {'S': 8, 'A': 6, 'B': 6, 'C': 3, 'D': 2, 'E': 5, 'G': 0}
_INCONSISTENT = directed([('S', 'A', 1), ('S', 'B', 2), ('A', 'C', 1), ('B', 'C', 2), ('C', 'G', 100)])
_H_INC = {'S': 0, 'A': 100, 'B': 1, 'C': 90, 'G': 0}
_NILSSON, _NILSSON_GOAL = (2, 8, 3, 1, 6, 4, 7, 0, 5), (1, 2, 3, 8, 0, 4, 7, 6, 5)


def _unpack(got):
    if not (isinstance(got, (tuple, list)) and len(got) == 2):
        raise TypeError('astar_table must return a tuple (node, rows)')
    return got


def _rows(expected, path=None):
    def check(got, *args):
        node, rows = _unpack(got)
        rows = [tuple(r) for r in rows]
        if rows != expected:
            for i, (a, b) in enumerate(zip(rows, expected)):
                if a != b:
                    return False, f'row {i + 1}: got {a}, expected {b}'
            return False, f'got {len(rows)} rows, expected {len(expected)}'
        if path is not None and (node is failure or path_states(node) != path):
            return False, f'rows are right but the returned node has path {path_states(node)}, expected {path}'
        return True, ''
    return check


def _nilsson(sol):
    p = EightPuzzle(_NILSSON, _NILSSON_GOAL)
    node, rows = _unpack(sol.astar_table(p, lambda n: misplaced_tiles(n.state, _NILSSON_GOAL)))
    return [(g, f) for _, g, f in rows], len(path_actions(node))


def _grid(sol):
    p = GridProblem(SLIDE_GRID)
    gx, gy = p.goal
    node, rows = _unpack(sol.astar_table(p, lambda n: abs(n.state[0] - gx) + abs(n.state[1] - gy)))
    node0, rows0 = _unpack(sol.astar_table(GridProblem(SLIDE_GRID), lambda n: 0))
    return node.path_cost, len(rows), [f for _, _, f in rows], node0.path_cost, len(rows0)


def _grid_check(got):
    cost, n, fs, cost0, n0 = got
    if cost != 11 or cost0 != 11:
        return False, f'costs {cost} (Manhattan) and {cost0} (h = 0), both should be 11'
    if any(b < a for a, b in zip(fs, fs[1:])):
        return False, 'the f column decreases somewhere, but Manhattan is consistent: check your f'
    return n == 26 and n0 == 30, f'Manhattan: {n} nodes selected, h = 0 (uniform-cost): {n0} nodes; f never decreases'


TESTS = [
    Test('example graph: the table', args=(GraphProblem('S', 'G', _G, _H),),
         check=_rows([('S', 0, 8), ('A', 2, 8), ('C', 5, 8), ('D', 6, 8), ('B', 3, 9), ('G', 9, 9)],
                     ['S', 'A', 'C', 'G']),
         show='graph above, S -> G'),
    Test('h = 0 is uniform-cost search', call=lambda sol: sol.astar_table(GraphProblem('S', 'G', _G, _H),
                                                                         lambda n: 0),
         check=_rows([('S', 0, 0), ('A', 2, 2), ('B', 3, 3), ('C', 5, 5), ('D', 6, 6), ('E', 6, 6),
                      ('G', 9, 9)], ['S', 'A', 'C', 'G']),
         show='same graph, h(n) = 0'),
    Test('slide p.196: 8-puzzle with misplaced tiles', call=_nilsson,
         expected=([(0, 4), (1, 4), (2, 5), (2, 5), (3, 5), (4, 5), (5, 5)], 5),
         show='([(g, f) of each selected node], solution length) for 2 8 3 / 1 6 4 / 7 _ 5'),
    Test('navigation grid of slide p.201', call=_grid, check=_grid_check,
         show='Manhattan h vs h = 0 on the slide grid'),
    Test('slide p.227: admissible but inconsistent h', args=(GraphProblem('S', 'G', _INCONSISTENT, _H_INC),),
         check=_rows([('S', 0, 0), ('B', 2, 3), ('C', 4, 94), ('A', 1, 101), ('C', 2, 92), ('G', 102, 102)],
                     ['S', 'A', 'C', 'G']),
         show='S->A 1, S->B 2, A->C 1, B->C 2, C->G 100;  h: A 100, B 1, C 90'),
    Test('unreachable goal', args=(GraphProblem('S', 'G', directed([('S', 'A', 1), ('A', 'B', 2)])),),
         check=_rows([('S', 0, 0), ('A', 1, 1), ('B', 3, 3)]), show='S->A 1, A->B 2, goal G unreachable'),
]
