from harness import Test
from aima import GraphProblem, EightPuzzle, undirected, directed, path_states, path_actions, failure
from informed_lib import misplaced_tiles, manhattan_tiles

TITLE = 'Iterative deepening A* (IDA*)'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['IDA*', 'iterative deepening', 'f-cutoff', 'memory', 'depth-first search']

STATEMENT = r"""
A* keeps every generated node in memory. **IDA*** keeps only the current path: it runs
depth-first searches bounded by a **cutoff on $f = g + h$**, raising the cutoff each time
(slides p. 241–242):

```text
cutoff = f(root)
repeat
  1. depth-first search, expanding all nodes n with f(n) <= cutoff
  2. cutoff = smallest f() among the non-expanded (pruned) nodes
until a solution is found (or there is nothing left to explore)
```

Implement `ida_star(problem, h=None)` (default `h = problem.h`) returning `(node, cutoffs)`:

- `node` is the goal node, or `failure` if the goal cannot be reached;
- `cutoffs` is the list of cutoff values used, one per iteration (the first is $f(\text{root})$).

In each depth-first search: a node with $f(n) > \text{cutoff}$ is **not** expanded (remember its
$f$ for the next cutoff); otherwise goal-test it, then visit its children in `expand` order,
**skipping a child whose state is already on the current path** (`is_cycle(child)`). If an
iteration prunes nothing and finds no goal, return `failure`.

On the slide example (8-puzzle `2 8 3 / 1 6 4 / 7 _ 5`, goal `1 2 3 / 8 _ 4 / 7 6 5`,
misplaced tiles) the cutoffs are `[4, 5]` and the solution has 5 moves.
"""

STARTER = '''import math
from collections.abc import Callable
from aima import Problem, Node, expand, is_cycle, failure

def ida_star(problem: Problem, h: Callable[[Node], float] | None = None) -> tuple[Node, list[float]]:
    """Iterative deepening A*. Returns (goal node or failure, list of cutoffs used)."""
    h = h or problem.h
    def f(n: Node) -> float: return n.path_cost + h(n)
    root = Node(problem.initial)
    cutoff = f(root)
    cutoffs: list[float] = []
    # TODO: repeat bounded depth-first searches, raising the cutoff
    return failure, cutoffs
'''

SOLUTION = '''import math
from collections.abc import Callable
from aima import Problem, Node, expand, is_cycle, failure

def ida_star(problem: Problem, h: Callable[[Node], float] | None = None) -> tuple[Node, list[float]]:
    """Iterative deepening A*. Returns (goal node or failure, list of cutoffs used)."""
    h = h or problem.h
    def f(n: Node) -> float: return n.path_cost + h(n)

    def search(node: Node, cutoff: float) -> tuple[Node | None, float]:
        """Depth-first search below node: (goal node or None, smallest pruned f)."""
        if f(node) > cutoff:
            return None, f(node)
        if problem.is_goal(node.state):
            return node, cutoff
        smallest = math.inf
        for child in expand(problem, node):
            if not is_cycle(child):
                found, value = search(child, cutoff)
                if found:
                    return found, value
                smallest = min(smallest, value)
        return None, smallest

    root = Node(problem.initial)
    cutoff = f(root)
    cutoffs: list[float] = []
    while True:
        cutoffs.append(cutoff)
        found, next_cutoff = search(root, cutoff)
        if found:
            return found, cutoffs
        if next_cutoff == math.inf:
            return failure, cutoffs
        cutoff = next_cutoff
'''

HINTS = [
    'Write a recursive helper `search(node, cutoff)` that returns two things: the goal node if found below '
    '`node` (or `None`), and the smallest $f$ among the nodes it pruned.',
    'In the helper: if `f(node) > cutoff` return `(None, f(node))`; if the node is a goal return it; otherwise '
    'recurse on every child that is not a cycle, keeping the minimum of the returned values.',
    'Outer loop: `cutoffs.append(cutoff)`, call `search(root, cutoff)`; stop on a goal, return `failure` if the '
    'smallest pruned value is `math.inf`, else `cutoff = smallest` and repeat.',
]

EXPLANATION = r"""
**Why the next cutoff is the smallest pruned $f$.** Every node with $f \le$ cutoff has been
explored, and nothing was found. Any solution must pass through one of the pruned nodes, so its
cost is at least the smallest pruned $f$ (with an admissible $h$, $f$ underestimates the cost of
solutions through a node). Raising the cutoff exactly to that value never skips a cheaper
solution: the first goal found has $g = f \le$ cutoff, and is **optimal** (slide p. 255).

**Memory vs time.** IDA* stores only the current path: memory is linear in the depth, like
DFS, and there is no frontier to sort. The price is time: every iteration **re-generates** all
the nodes of the previous ones, and states reachable by different paths are explored again,
because nothing but the path is remembered.

**The number of iterations depends on how many distinct $f$ values there are.** Manhattan
distance on the 8-puzzle changes $f$ by 0 or 2 per move: cutoffs 14, 16, 18, 20 from
`7 2 4 / 5 _ 6 / 8 3 1` (4 iterations). Misplaced tiles: 6, 7, …, 20 (15 iterations). With $h = 0$ on a graph
with varied costs you get one iteration per distinct path cost — iterative *lengthening*.

**Cycle check.** Without skipping the states on the current path, the search keeps moving the
blank back and forth until $f$ exceeds the cutoff: correct but exponentially slower (the last
test times out).
"""

ENTRY = 'ida_star'

_G = undirected([('S', 'A', 2), ('S', 'B', 3), ('A', 'C', 3), ('B', 'C', 4), ('A', 'D', 4),
                 ('C', 'G', 4), ('D', 'G', 5), ('B', 'E', 3), ('E', 'G', 6)])
_H = {'S': 8, 'A': 6, 'B': 6, 'C': 3, 'D': 2, 'E': 5, 'G': 0}
_INCONSISTENT = directed([('S', 'A', 1), ('S', 'B', 2), ('A', 'C', 1), ('B', 'C', 2), ('C', 'G', 100)])
_H_INC = {'S': 0, 'A': 100, 'B': 1, 'C': 90, 'G': 0}
_NILSSON, _NILSSON_GOAL = (2, 8, 3, 1, 6, 4, 7, 0, 5), (1, 2, 3, 8, 0, 4, 7, 6, 5)
_BOOK = (7, 2, 4, 5, 0, 6, 8, 3, 1)


def _unpack(got):
    if not (isinstance(got, (tuple, list)) and len(got) == 2):
        raise TypeError('ida_star must return a tuple (node, cutoffs)')
    return got


def _graph(expected_path, expected_cutoffs):
    def check(got, *args):
        node, cutoffs = _unpack(got)
        if list(cutoffs) != expected_cutoffs:
            return False, (f'cutoffs {list(cutoffs)}, expected {expected_cutoffs}: the next cutoff is the '
                           'smallest f among pruned nodes; skip children already on the path (is_cycle)')
        if node is failure or node is None:
            return False, 'no solution returned'
        return path_states(node) == expected_path, f'path {path_states(node)}, cost {node.path_cost}'
    return check


def _puzzle(start, goal, h):
    def call(sol):
        node, cutoffs = _unpack(sol.ida_star(EightPuzzle(start, goal), lambda n: h(n.state, goal)))
        return list(cutoffs), len(path_actions(node))
    return call


TESTS = [
    Test('slides p.243-254: 8-puzzle, misplaced tiles', call=_puzzle(_NILSSON, _NILSSON_GOAL, misplaced_tiles),
         expected=([4, 5], 5), show='(cutoffs, solution length) for 2 8 3 / 1 6 4 / 7 _ 5'),
    Test('example graph', args=(GraphProblem('S', 'G', _G, _H),), check=_graph(['S', 'A', 'C', 'G'], [8, 9]),
         show='the graph of the A* problem'),
    Test('h = 0: one iteration per distinct cost', call=lambda sol: sol.ida_star(GraphProblem('S', 'G', _G), lambda n: 0),
         check=_graph(['S', 'A', 'C', 'G'], [0, 2, 3, 5, 6, 7, 9]), show='same graph, h(n) = 0'),
    Test('admissible but inconsistent h is fine (tree search)', args=(GraphProblem('S', 'G', _INCONSISTENT, _H_INC),),
         check=_graph(['S', 'A', 'C', 'G'], [0, 3, 94, 101, 102]),
         show='slide p.227 graph: optimal cost 102'),
    Test('unreachable goal', args=(GraphProblem('S', 'G', directed([('S', 'A', 1), ('A', 'B', 2)])),),
         check=lambda got, p: ((_unpack(got)[0] is failure and list(got[1]) == [0, 1, 3]),
                               'expected (failure, [0, 1, 3]): stop when an iteration prunes nothing'),
         show='S->A 1, A->B 2, goal G unreachable'),
    Test('7 2 4 / 5 _ 6 / 8 3 1, Manhattan distance', call=_puzzle(_BOOK, (1, 2, 3, 4, 5, 6, 7, 8, 0), manhattan_tiles),
         expected=([14, 16, 18, 20], 20), show='(cutoffs, solution length), goal 1 2 3 / 4 5 6 / 7 8 _'),
    Test('7 2 4 / 5 _ 6 / 8 3 1, misplaced tiles', call=_puzzle(_BOOK, (1, 2, 3, 4, 5, 6, 7, 8, 0), misplaced_tiles),
         expected=(list(range(6, 21)), 20), show='(cutoffs, solution length), goal 1 2 3 / 4 5 6 / 7 8 _'),
]
