from harness import Test
from aima import GraphProblem, undirected, directed, path_states, failure
from informed_lib import Instrumented, GridProblem, SLIDE_GRID

TITLE = 'Best-first search and greedy best-first search'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['best-first search', 'greedy', 'priority queue', 'reached table', 'evaluation function']

STATEMENT = r"""
Every informed strategy is the same algorithm, **best-first search**, with a different
evaluation function $f(n)$: the frontier is a priority queue and the node with the
**smallest** $f$ is selected first (slides p. 176, 186).

1. Implement `best_first_search(problem, f)` exactly as on slide p. 186:
   - `frontier = PriorityQueue([node], key=f)` (ties are broken first-in first-out);
   - the **goal test** is done when a node is **selected** (popped);
   - `reached = {state: node}`: add a child if its state is new **or** if the child reaches
     it with a **lower path cost** than `reached[s]` (then update `reached[s]` too).
   Return the goal **node**, or `failure` when the frontier empties.
2. Implement `greedy_search(problem, h=None)`: best-first search with $f(n) = h(n)$
   (default `h = problem.h`).

```text
            A(6) ---4--- D(2)
          2/   \3           \5
       S(8)     C(3) ---4--- G(0)        h(n) in brackets
          3\   /4           /6
            B(6) ---3--- E(5)
```

On this graph greedy best-first search returns `S → A → D → G` (cost 11), although
`S → A → C → G` costs only 9. `GraphProblem` gives the neighbors in alphabetical order and
`problem.h(node)` reads the `h_table`.
"""

STARTER = '''from collections.abc import Callable
from typing import Any
from aima import Problem, Node, expand, PriorityQueue, failure

def best_first_search(problem: Problem, f: Callable[[Node], float]) -> Node:
    "Search nodes with minimum f(node) value first."
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached: dict[Any, Node] = {problem.initial: node}
    # TODO: pop, goal test, expand, add the children that deserve it
    return failure

def greedy_search(problem: Problem, h: Callable[[Node], float] | None = None) -> Node:
    "Greedy best-first search: f(n) = h(n)."
    h = h or problem.h
    # TODO
    return failure
'''

SOLUTION = '''from collections.abc import Callable
from typing import Any
from aima import Problem, Node, expand, PriorityQueue, failure

def best_first_search(problem: Problem, f: Callable[[Node], float]) -> Node:
    "Search nodes with minimum f(node) value first."
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached: dict[Any, Node] = {problem.initial: node}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            s = child.state
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child
                frontier.add(child)
    return failure

def greedy_search(problem: Problem, h: Callable[[Node], float] | None = None) -> Node:
    "Greedy best-first search: f(n) = h(n)."
    h = h or problem.h
    return best_first_search(problem, f=h)
'''

HINTS = [
    'The loop is the BFS loop of the uninformed chapter, with `PriorityQueue` instead of `FIFOQueue`. '
    'What changes in the test that decides whether a child enters the frontier?',
    '`while frontier:` → `node = frontier.pop()` → `if problem.is_goal(node.state): return node` → '
    '`for child in expand(problem, node): ...`.',
    'Add the child when `s not in reached or child.path_cost < reached[s].path_cost`, setting `reached[s] = child`. '
    'Greedy is then one line: `return best_first_search(problem, f=h)`.',
]

EXPLANATION = r"""
**One template, many algorithms.** Only $f$ changes:

| $f(n)$ | algorithm |
|---|---|
| $g(n)$ | uniform-cost search |
| $h(n)$ | greedy best-first search |
| $g(n) + h(n)$ | A* |
| $g(n) + w\,h(n)$ | weighted A* |

**Why greedy is not optimal.** It looks only *ahead* ($h$) and never *back* ($g$): on the
example it jumps to D because $h(D) = 2$ is the smallest value, ignoring that reaching G through
D costs 11. On the navigation grid of slides p. 199–200 it follows the bottom corridor to the
cell just under the goal ($h = 2$, but a wall is in between), and then takes a long detour
(cost 25 instead of 11): the **local minima problem**.

**Why the `reached` rule has two parts.** With $f = g$ (uniform-cost search) a state can be
reached first through an expensive path and later through a cheaper one: if you only checked
`s not in reached`, the cheaper path would be thrown away and the search would return the
expensive one. That is why the course's graph search *re-adds* a state when a cheaper path to it
is found.

Greedy best-first search: not optimal, not complete in infinite spaces (it can follow an
infinite path), worst-case time and space $O(b^m)$ with $m$ the maximum depth (slide p. 191).
"""

ENTRY = 'greedy_search'

_G = undirected([('S', 'A', 2), ('S', 'B', 3), ('A', 'C', 3), ('B', 'C', 4), ('A', 'D', 4),
                 ('C', 'G', 4), ('D', 'G', 5), ('B', 'E', 3), ('E', 'G', 6)])
_H = {'S': 8, 'A': 6, 'B': 6, 'C': 3, 'D': 2, 'E': 5, 'G': 0}


def _path(expected, cost):
    def check(got, *args):
        if got is failure or got is None:
            return False, 'no solution returned'
        states = path_states(got)
        if states != expected:
            return False, f'returned {states} (cost {got.path_cost}), expected {expected}'
        return got.path_cost == cost, f'path {states}, cost {got.path_cost}'
    return check


def _greedy_order(sol):
    p = Instrumented(GraphProblem('S', 'G', _G, _H))
    sol.greedy_search(p)
    return p.expanded


def _grid(sol):
    p = GridProblem(SLIDE_GRID)
    gx, gy = p.goal
    return sol.greedy_search(p, lambda n: abs(n.state[0] - gx) + abs(n.state[1] - gy))


def _grid_check(got):
    if got is failure or got is None:
        return False, 'no solution returned'
    return got.path_cost == 25, (f'greedy cost {got.path_cost} (optimal is 11): it follows the bottom '
                                 'corridor to the cell under the goal (h = 2, a local minimum behind the '
                                 'wall), then has to go all the way around')


_READD = directed([('S', 'A', 5), ('S', 'B', 1), ('B', 'A', 1), ('A', 'G', 1)])
_LATE = directed([('S', 'G', 10), ('S', 'A', 1), ('A', 'G', 1)])


def _ucs_check(expected, cost, why):
    inner = _path(expected, cost)

    def check(got, *args):
        ok, msg = inner(got)
        return ok, msg if ok else msg + ' - ' + why
    return check


TESTS = [
    Test('greedy on the example graph', args=(GraphProblem('S', 'G', _G, _H),),
         check=_path(['S', 'A', 'D', 'G'], 11), show='graph above, S -> G'),
    Test('greedy expansion order', call=_greedy_order, expected=['S', 'A', 'D'],
         show='states expanded by greedy on the graph above'),
    Test('greedy on the grid of slides p.199-200', call=_grid, check=_grid_check,
         show='Manhattan distance, 4 moves, start (0, 3), goal (6, 2)'),
    Test('f = g gives uniform-cost search (cheaper path to a reached state)',
         call=lambda sol: sol.best_first_search(GraphProblem('S', 'G', _READD), lambda n: n.path_cost),
         check=_ucs_check(['S', 'B', 'A', 'G'], 3,
                          'when a cheaper path to an already reached state is found, update reached[s] '
                          'and add the child again'),
         show='S->A 5, S->B 1, B->A 1, A->G 1;  f = g'),
    Test('goal test when the node is selected, not generated',
         call=lambda sol: sol.best_first_search(GraphProblem('S', 'G', _LATE), lambda n: n.path_cost),
         check=_ucs_check(['S', 'A', 'G'], 2, 'test is_goal on the popped node, not on the children'),
         show='S->G 10, S->A 1, A->G 1;  f = g'),
    Test('start is the goal', args=(GraphProblem('S', 'S', _G, _H),), check=_path(['S'], 0)),
    Test('unreachable goal returns failure', args=(GraphProblem('S', 'Z', _G, _H),),
         check=lambda got, p: (got is failure, '' if got is failure else
                               'return `failure` (from aima) when the frontier is empty')),
]
