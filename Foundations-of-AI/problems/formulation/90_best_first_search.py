from harness import Test
from aima import GraphProblem, directed, undirected, path_states, failure

TITLE = 'The general scheme: best-first search(problem, f)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['best-first search', 'graph search', 'reached table', 'evaluation function']

STATEMENT = r"""
Every search algorithm of the next lectures is the same graph-search loop with a different
**evaluation function** $f(n)$ ordering the frontier (AIMA Fig. 3.7, slides p. 109 — "logic to learn"):

```text
function BEST-FIRST-SEARCH(problem, f) returns a solution node or failure
    node ← NODE(STATE = problem.INITIAL)
    frontier ← a priority queue ordered by f, with node as an element
    reached ← a lookup table, with one entry with key problem.INITIAL and value node
    while not IS-EMPTY(frontier) do
        node ← POP(frontier)
        if problem.IS-GOAL(node.STATE) then return node
        for each child in EXPAND(problem, node) do
            s ← child.STATE
            if s is not in reached or child.PATH-COST < reached[s].PATH-COST then
                reached[s] ← child
                add child to frontier
    return failure
```

Implement `best_first_search(problem, f)` returning the goal **node** or `failure` (from `aima`).
Use `PriorityQueue(items, key=f)` (`add`, `pop`, `len`; ties are popped in insertion order) and
`expand(problem, node)`. The tests call it with different `f`:

| `f(n)` | algorithm you get |
|---|---|
| `n.path_cost` | uniform-cost search |
| `len(n)` (depth) | breadth-first-like |
| `n.path_cost + problem.h(n)` | A* |
"""

STARTER = '''from collections.abc import Callable
from typing import Any

from aima import Node, Problem, PriorityQueue, expand, failure

def best_first_search(problem: Problem, f: Callable[[Node], float]) -> Node:
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached: dict[Any, Node] = {problem.initial: node}
    # TODO: the while loop of the pseudocode
    return failure
'''

SOLUTION = '''from collections.abc import Callable
from typing import Any

from aima import Node, Problem, PriorityQueue, expand, failure

def best_first_search(problem: Problem, f: Callable[[Node], float]) -> Node:
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
'''

HINTS = [
    'Translate line by line: `while frontier:` → `node = frontier.pop()` → goal test → loop over `expand(problem, node)`.',
    'The goal test is done when a node is **popped**, not when it is generated.',
    '`reached` maps a state to the best node found so far for it: add the child if its state is new **or** '
    'if it found a cheaper path (`child.path_cost < reached[s].path_cost`).',
]

EXPLANATION = r"""
Three details make this loop correct for every $f$:

1. **Goal test on pop.** Testing when a node is *generated* would return `S→G` (cost 10) in the
   "late goal test" test, before the cheaper `S→A→G` (cost 2) is even generated. With $f = g$ the node
   popped first among the goal nodes is the cheapest one.
2. **Re-opening states.** A state can be reached first by an expensive path and later by a cheaper one:
   the `child.path_cost < reached[s].path_cost` condition (slides p. 106) puts the better node in the
   frontier. The old, worse node stays in the queue but is popped later and does no harm.
3. **The strategy is only $f$.** Changing $f$ changes the *order* of the frontier (slides p. 100: "a search
   strategy determines the ordering of nodes in the frontier"): UCS, BFS-like, greedy ($f = h$), A*
   ($f = g + h$) are all this function.

The `reached` table is what makes this **graph search**: drop it and you get the (possibly infinite)
tree search of slides p. 98.
"""

ENTRY = 'best_first_search'

_ROMANIA_PART = undirected([('Arad', 'Sibiu', 140), ('Arad', 'Timisoara', 118), ('Arad', 'Zerind', 75),
                            ('Sibiu', 'Fagaras', 99), ('Sibiu', 'Rimnicu', 80), ('Rimnicu', 'Pitesti', 97),
                            ('Fagaras', 'Bucharest', 211), ('Pitesti', 'Bucharest', 101),
                            ('Zerind', 'Oradea', 71), ('Oradea', 'Sibiu', 151), ('Timisoara', 'Lugoj', 111)])
_H_SLD = {'Arad': 366, 'Bucharest': 0, 'Fagaras': 176, 'Lugoj': 244, 'Oradea': 380, 'Pitesti': 100,
          'Rimnicu': 193, 'Sibiu': 253, 'Timisoara': 329, 'Zerind': 374}
_REOPEN = directed([('S', 'A', 1), ('S', 'B', 5), ('A', 'B', 1), ('B', 'G', 1)])
_LATE = directed([('S', 'G', 10), ('S', 'A', 1), ('A', 'G', 1)])
_HOPS = undirected([('S', 'A', 1), ('A', 'B', 1), ('B', 'G', 1), ('S', 'G', 10)])


def _run(sol, problem, f):
    node = sol.best_first_search(problem, f)
    if node is failure or node is None:
        return 'failure'
    return path_states(node), node.path_cost


def _ucs(problem):
    return lambda n: n.path_cost


def _check(expected, hint):
    def check(got):
        if got == expected:
            return True
        return False, f'expected {expected}. {hint}'
    return check


_P_REOPEN = GraphProblem('S', 'G', _REOPEN)
_P_LATE = GraphProblem('S', 'G', _LATE)
_P_ROMANIA = GraphProblem('Arad', 'Bucharest', _ROMANIA_PART, _H_SLD)

TESTS = [
    Test('start is goal', call=lambda sol: _run(sol, GraphProblem('S', 'S', _LATE), _ucs(None)),
         expected=(['S'], 0)),
    Test('late goal test (f = path cost)', call=lambda sol: _run(sol, _P_LATE, _ucs(_P_LATE)),
         check=_check((['S', 'A', 'G'], 2), 'Do the goal test when the node is POPPED, not when it is generated.'),
         show='S→G (10), S→A (1), A→G (1)'),
    Test('cheaper path to a reached state', call=lambda sol: _run(sol, _P_REOPEN, _ucs(_P_REOPEN)),
         check=_check((['S', 'A', 'B', 'G'], 3),
                      'B is first reached with cost 5, then with cost 2 via A: update reached[B] and re-add it.'),
         show='S→A (1), S→B (5), A→B (1), B→G (1)'),
    Test('f = depth: fewest actions', call=lambda sol: _run(sol, GraphProblem('S', 'G', _HOPS), len),
         expected=(['S', 'G'], 10), show='S-G (10) vs S-A-B-G (3), f = len(n)'),
    Test('f = path cost: cheapest', call=lambda sol: _run(sol, GraphProblem('S', 'G', _HOPS), lambda n: n.path_cost),
         expected=(['S', 'A', 'B', 'G'], 3), show='same graph, f = n.path_cost'),
    Test('Romania, uniform cost', call=lambda sol: _run(sol, _P_ROMANIA, _ucs(_P_ROMANIA)),
         expected=(['Arad', 'Sibiu', 'Rimnicu', 'Pitesti', 'Bucharest'], 418), show='Arad → Bucharest, f = g'),
    Test('Romania, A*', call=lambda sol: _run(sol, _P_ROMANIA, lambda n: n.path_cost + _P_ROMANIA.h(n)),
         expected=(['Arad', 'Sibiu', 'Rimnicu', 'Pitesti', 'Bucharest'], 418),
         show='Arad → Bucharest, f = g + h_SLD'),
    Test('Romania, greedy (f = h)', call=lambda sol: _run(sol, _P_ROMANIA, _P_ROMANIA.h),
         expected=(['Arad', 'Sibiu', 'Fagaras', 'Bucharest'], 450), show='Arad → Bucharest, f = h_SLD'),
    Test('unreachable goal → failure', call=lambda sol: _run(sol, GraphProblem('S', 'X', _HOPS), len),
         expected='failure', show='X is not in the graph'),
]
