from harness import Test
from aima import GraphProblem, directed, path_states, failure
from informed_lib import Instrumented

TITLE = 'Exam · Jul 2023 · Pseudocode: best_first_graph_search(p, f) and A* on top of it'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['exam', 'Jul 2023', 'best-first search', 'A*', 'pseudocode', 'reached table']

STATEMENT = r"""
*Written exam of 10 July 2023 — Problem 1 (Informed Search, 8 points).*

> Write the pseudocode of the function `best_first_graph_search(p, f)` that, given a problem `p` and a function `f`,
> applies Best First Greedy Search algorithm for graphs. Next, given the function `g(n)` that returns the cost of the
> path from the initial state `p.initial` to node `n`, and function `h(n)` that returns the heuristic value for node
> `n`, implement the **A\* algorithm** using the `best_first_graph_search` function. The functions must be written
> using either the textbook notation or the python-like syntax used in the course slides and notebooks.
> Pseudocode must be adequately commented to explain how the algorithms work.

Write it as real Python with the course helpers (`Node`, `expand`, `PriorityQueue`, `failure`), **with the
comments you would write in the exam**:

1. `best_first_graph_search(p, f)`: the frontier is a priority queue on `f` (ties FIFO); goal test when a node is
   **selected**; a `reached` table `{state: node}`: a child is added if its state is new **or** reached with a
   **lower path cost**.
2. `g(n)`: the path cost of node `n`.
3. `astar_search(p, h=None)`: A* = best-first graph search with $f(n) = g(n) + h(n)$ (default `h = p.h`).

The tests run them on the graph of the February 2022 exam (start S, goal G):

```text
arcs:  S→A 1   A→B 1   A→D 3   A→E 8   B→C 1   D→E 1   D→F 3   E→H 2   H→F 1   F→G 3
h:     S 9   A 8   B 9   C 10   D 5   E 4   H 2   F 3   G 0
```
"""

STARTER = '''from collections.abc import Callable
from typing import Any
from aima import Problem, Node, expand, PriorityQueue, failure

def best_first_graph_search(p: Problem, f: Callable[[Node], float]) -> Node:
    "Search nodes with minimum f(node) value first."
    # TODO
    return failure

def g(n: Node) -> float:
    "Cost of the path from p.initial to n."
    # TODO
    return 0

def astar_search(p: Problem, h: Callable[[Node], float] | None = None) -> Node:
    "A*: best-first graph search with f(n) = g(n) + h(n)."
    # TODO
    return failure
'''

SOLUTION = '''from collections.abc import Callable
from typing import Any
from aima import Problem, Node, expand, PriorityQueue, failure

def best_first_graph_search(p: Problem, f: Callable[[Node], float]) -> Node:
    "Search nodes with minimum f(node) value first."
    node = Node(p.initial)                          # root node: initial state, no parent, path cost 0
    frontier = PriorityQueue([node], key=f)         # frontier ordered by f: the smallest f is popped first
    reached: dict[Any, Node] = {p.initial: node}    # best node found so far for every state (graph search)
    while frontier:                                 # empty frontier = no solution
        node = frontier.pop()                       # select the most promising node
        if p.is_goal(node.state):                   # goal test on SELECTION, not on generation
            return node
        for child in expand(p, node):               # generate the successors
            s = child.state
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child                  # new state, or a cheaper path to it:
                frontier.add(child)                 # (re-)insert it in the frontier
    return failure

def g(n: Node) -> float:
    "Cost of the path from p.initial to n."
    return n.path_cost

def astar_search(p: Problem, h: Callable[[Node], float] | None = None) -> Node:
    "A*: best-first graph search with f(n) = g(n) + h(n)."
    h = h or p.h                                    # default: the heuristic of the problem
    return best_first_graph_search(p, f=lambda n: g(n) + h(n))
'''

HINTS = [
    'It is the course `best_first_search` (slide p. 186): `node = Node(p.initial)`, '
    '`frontier = PriorityQueue([node], key=f)`, `reached = {p.initial: node}`.',
    'Loop: pop, goal test on the popped node, then for every child of `expand(p, node)` add it when '
    '`s not in reached or child.path_cost < reached[s].path_cost` (and update `reached[s]`).',
    'A* is one line: `return best_first_graph_search(p, f=lambda n: g(n) + h(n))`, with `h = h or p.h`. '
    'Greedy would be `f=h`, uniform-cost `f=g`.',
]

EXPLANATION = r"""
The official solution is exactly the course code: `best_first_search` with the `reached` table (slide p. 186) and
`astar_search` = `best_first_search(problem, f=lambda n: g(n) + h(n))` with `g(n) = n.path_cost`. In the exam,
the comments are what earns the points: say **why** the goal test is on selection (a goal generated through an
expensive path could still be beaten by a cheaper one in the frontier) and **why** a reached state is re-added when
a cheaper path is found (otherwise an admissible but inconsistent $h$ can lose the optimal path, slide p. 227).

On the February 2022 graph:

| $f$ | algorithm | expanded | returned path | cost |
|---|---|---|---|---|
| $g$ | uniform-cost | S A B C D E F H (E) | S A D F G | 10 |
| $h$ | greedy | S A E H F | S A E H F G | 15 |
| $g + h$ | A* | S A D E H F | S A D F G | 10 |

$h$ is consistent there, so A* returns the optimal cost 10 after 6 expansions; with `reached` the stale entry E 9
is re-expanded by UCS (it is not discarded), which is harmless.
"""

ENTRY = 'astar_search'

_FEB = directed([('S', 'A', 1), ('A', 'B', 1), ('B', 'C', 1), ('A', 'D', 3), ('A', 'E', 8), ('D', 'F', 3),
                 ('D', 'E', 1), ('E', 'H', 2), ('H', 'F', 1), ('F', 'G', 3)])
_H = {'S': 9, 'A': 8, 'B': 9, 'C': 10, 'D': 5, 'E': 4, 'H': 2, 'F': 3, 'G': 0}
_INC = directed([('S', 'A', 1), ('S', 'B', 2), ('A', 'C', 1), ('B', 'C', 2), ('C', 'G', 100)])
_H_INC = {'S': 0, 'A': 100, 'B': 1, 'C': 90, 'G': 0}
_LATE = directed([('S', 'G', 10), ('S', 'A', 1), ('A', 'G', 1)])


def _path(expected, cost):
    def check(got, *args):
        if got is failure or got is None:
            return False, 'no solution returned'
        states = path_states(got)
        if states != expected:
            return False, f'returned {states} (cost {got.path_cost}), expected {expected}'
        return got.path_cost == cost, f'path {states}, cost {got.path_cost}'
    return check


def _astar_order(sol):
    p = Instrumented(GraphProblem('S', 'G', _FEB, _H))
    sol.astar_search(p)
    return p.expanded


TESTS = [
    Test('A* on the Feb 2022 graph', args=(GraphProblem('S', 'G', _FEB, _H),),
         check=_path(['S', 'A', 'D', 'F', 'G'], 10), show='graph above, S -> G'),
    Test('A* expansion order', call=_astar_order, expected=['S', 'A', 'D', 'E', 'H', 'F'],
         show='states expanded by A* on the graph above'),
    Test('f = g: uniform-cost search',
         call=lambda sol: sol.best_first_graph_search(GraphProblem('S', 'G', _FEB, _H), sol.g),
         check=_path(['S', 'A', 'D', 'F', 'G'], 10), show='best_first_graph_search(p, g)'),
    Test('f = h: greedy best-first search',
         call=lambda sol: sol.best_first_graph_search(GraphProblem('S', 'G', _FEB, _H), lambda n: _H[n.state]),
         check=_path(['S', 'A', 'E', 'H', 'F', 'G'], 15), show='best_first_graph_search(p, h)'),
    Test('explicit h argument', call=lambda sol: sol.astar_search(GraphProblem('S', 'G', _FEB), lambda n: _H[n.state]),
         check=_path(['S', 'A', 'D', 'F', 'G'], 10), show='astar_search(p, h) with p.h = 0'),
    Test('goal test on selection', call=lambda sol: sol.best_first_graph_search(GraphProblem('S', 'G', _LATE), sol.g),
         check=_path(['S', 'A', 'G'], 2), show='S->G 10, S->A 1, A->G 1;  f = g'),
    Test('re-add a state reached by a cheaper path (slide p.227)', args=(GraphProblem('S', 'G', _INC, _H_INC),),
         check=_path(['S', 'A', 'C', 'G'], 102), show='S->A 1, S->B 2, A->C 1, B->C 2, C->G 100;  h: A 100, B 1, C 90'),
    Test('unreachable goal', args=(GraphProblem('S', 'Z', _FEB, _H),),
         check=lambda got, p: (got is failure, '' if got is failure else 'return `failure` when the frontier is empty')),
]
