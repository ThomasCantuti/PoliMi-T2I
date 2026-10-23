from harness import Test
from aima import GraphProblem, undirected, failure, path_states
from uninformed_lib import CountingProblem, expect

TITLE = 'Uniform-Cost Search'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['UCS', 'best-first search', 'priority queue', 'optimality', 'late goal test']

STATEMENT = r"""
Uniform-cost search selects the frontier node with the **smallest path cost** $g(n)$ from the root
(slides p. 135–138). It is best-first search with $f(n) = g(n)$:

```text
function UNIFORM-COST-SEARCH(problem) returns a solution node, or failure
    return BEST-FIRST-SEARCH(problem, PATH-COST)
```

Implement **`best_first_search(problem, f)`** (textbook Fig. 3.7) and then `uniform_cost_search`:

- `frontier`: a `PriorityQueue([node], key=f)` (`add(node)`, `pop()` = min $f$, ties FIFO);
- `reached`: a **dict** state → best node found so far;
- pop a node, **goal-test it**, expand it; a child enters the frontier if its state is not in `reached`
  **or** it reaches that state with a **lower path cost** (then `reached[s] = child`).

Return the solution node or `failure`.

**Test map (textbook Fig. 3.10), from Sibiu to Bucharest:**

```text
   Sibiu --99-- Fagaras
     |             \
     80             211
     |                \
  Rimnicu --97-- Pitesti --101-- Bucharest
```
"""

STARTER = '''from collections.abc import Callable
from typing import Any
from aima import Problem, Node, expand, PriorityQueue, failure

def best_first_search(problem: Problem, f: Callable[[Node], float]) -> Node:
    "Search nodes with minimum f(node) value first."
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached: dict[Any, Node] = {problem.initial: node}  # state -> best node reaching it so far
    # TODO: pop, goal test, expand; add a child if its state is new or reached more cheaply
    return failure

def g(n: Node) -> float:
    return n.path_cost

def uniform_cost_search(problem: Problem) -> Node:
    # TODO: one line
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

def g(n: Node) -> float:
    return n.path_cost

def uniform_cost_search(problem: Problem) -> Node:
    return best_first_search(problem, f=g)
'''

HINTS = [
    'The loop is BFS\'s loop with a priority queue instead of a FIFO queue. The two differences that '
    'matter are **when** you goal-test and **when** a reached state may enter the frontier again.',
    'Goal-test a node when it is **popped**, never when it is generated: a goal generated now may be '
    'reached later by a cheaper path (Bucharest is generated at 310 before the 278 path is found).',
    'For each child `s = child.state`: `if s not in reached or child.path_cost < reached[s].path_cost:` '
    '→ `reached[s] = child; frontier.add(child)`. Then `uniform_cost_search` is '
    '`return best_first_search(problem, f=g)`.',
]

EXPLANATION = r"""
Trace from Sibiu (the frontier is ordered by $g$):

| pop (g) | generated children | frontier after |
|---|---|---|
| Sibiu (0) | Fagaras 99, Rimnicu 80 | Rimnicu 80, Fagaras 99 |
| Rimnicu (80) | Pitesti 177 (Sibiu 160: worse, skip) | Fagaras 99, Pitesti 177 |
| Fagaras (99) | **Bucharest 310** | Pitesti 177, Bucharest 310 |
| Pitesti (177) | **Bucharest 278** < 310 → update | Bucharest 278, Bucharest 310 |
| Bucharest (278) | goal! | |

Bucharest is **generated** first with cost 310, but **selected** first with cost 278. UCS expands
nodes in order of their optimal path cost, so the first goal *selected* is optimal: an early goal
test would return the 310 path, and a `reached` *set* would discard the 278 path.

**Properties (p. 137–138).** Complete if $b$ is finite and every step cost is $\ge \varepsilon > 0$
(zero-cost loops could trap it); optimal; time and space $O(b^{1+\lfloor C^*/\varepsilon\rfloor})$,
where $C^*$ is the optimal cost: UCS may explore many cheap small steps before an expensive one.
With equal step costs it behaves like BFS and the bound is $O(b^{d+1})$ — and indeed
`best_first_search(problem, f=len)` (f = depth) *is* breadth-first search (slide p. 132).

`best_first_search` is the engine of the next chapter: greedy search uses $f=h$, A* uses $f=g+h$.
"""

ENTRY = 'uniform_cost_search'

_ROMANIA = undirected([('Sibiu', 'Fagaras', 99), ('Sibiu', 'Rimnicu', 80), ('Rimnicu', 'Pitesti', 97),
                       ('Pitesti', 'Bucharest', 101), ('Fagaras', 'Bucharest', 211)])
_UPDATE = undirected([('S', 'A', 1), ('S', 'B', 5), ('A', 'B', 1), ('B', 'G', 1)])
_G2 = undirected([('S', 'A', 1), ('S', 'B', 1), ('A', 'C', 1), ('B', 'D', 1), ('C', 'E', 1),
                  ('D', 'E', 1), ('E', 'G', 1), ('S', 'F', 1), ('F', 'G', 9)])
_G3 = undirected([('S', 'A', 1), ('A', 'B', 1), ('X', 'Y', 1)])


def _romania(got, p):
    ok, msg = expect(['Sibiu', 'Rimnicu', 'Pitesti', 'Bucharest'], 278)(got, p)
    if ok or getattr(got, 'path_cost', None) != 310:
        return ok, msg
    if len(p.goal_tests) > len(p.expanded) + 1:
        return False, msg + ('. You goal-tested Bucharest when it was GENERATED (via Fagaras, cost 310); '
                             'UCS must goal-test a node when it is SELECTED from the frontier.')
    return False, msg + ('. When Pitesti generated Bucharest with cost 278 < 310, that cheaper child must '
                         'replace reached[Bucharest] and enter the frontier.')


def _update(got, p):
    ok, msg = expect(['S', 'A', 'B', 'G'], 3)(got, p)
    if not ok and getattr(got, 'path_cost', None) == 6:
        msg += ('. B was first reached directly (cost 5), then via A (cost 2): a cheaper path to a reached '
                'state must update reached[B] and go in the frontier.')
    return ok, msg


def _bfs_via_best_first(sol):
    node = sol.best_first_search(GraphProblem('S', 'G', _G2), len)
    return path_states(node) if node is not failure else 'failure'


TESTS = [
    Test('Sibiu → Bucharest (textbook Fig. 3.10)', args=(CountingProblem('Sibiu', 'Bucharest', _ROMANIA),),
         check=_romania, show='Romania subset, Sibiu to Bucharest'),
    Test('cheaper path to an already reached state', args=(CountingProblem('S', 'G', _UPDATE),), check=_update,
         show='S-A 1, S-B 5, A-B 1, B-G 1'),
    Test('many cheap steps beat few expensive ones', args=(GraphProblem('S', 'G', _G2),),
         check=expect(['S', 'A', 'C', 'E', 'G'], 4), show='S-F-G: 2 hops, cost 10;  S-A-C-E-G: 4 hops, cost 4'),
    Test('start is goal', args=(GraphProblem('S', 'S', _G2),), check=expect(['S'], 0)),
    Test('unreachable goal', args=(GraphProblem('S', 'Y', _G3),), check=expect(result=failure),
         show='S-A-B and X-Y (two components), goal Y'),
    Test('best_first_search with f = depth is BFS', call=_bfs_via_best_first, expected=['S', 'F', 'G'],
         show='best_first_search(problem, f=len) on the S-F-G graph'),
]
