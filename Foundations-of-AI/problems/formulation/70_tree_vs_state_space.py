from harness import Test
from aima import GraphProblem, EightPuzzle, undirected, directed

TITLE = 'Search tree vs state space: count them'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['search tree', 'state space', 'repeated states', 'tree search vs graph search']

STATEMENT = r"""
*"If states can be visited multiple times, the search tree can be infinite even if the state space is
finite!"* (slides p. 96, 104). Measure it.

- `count_tree_nodes(problem, d)`: the number of **nodes** of the search tree truncated at depth `d`
  (the root has depth 0). Repeated states count every time they appear — this is what **tree search**
  explores.
- `count_states(problem, d)`: the number of **distinct states** reachable from `problem.initial` with at
  most `d` actions — what **graph search** (with a `reached` table) explores.

```text
A ⇄ B   (one undirected edge),  d = 3
search tree:  A ─ B ─ A ─ B          count_tree_nodes = 4,  count_states = 2
```
"""

STARTER = '''from aima import Problem

def count_tree_nodes(problem: Problem, d: int) -> int:
    # TODO: 1 (this node) + the nodes of the subtrees of its children, down to depth d
    return 0


def count_states(problem: Problem, d: int) -> int:
    # TODO: distinct states within d actions of problem.initial
    return 0
'''

SOLUTION = '''from typing import Any

from aima import Problem

def count_tree_nodes(problem: Problem, d: int, state: Any = None) -> int:
    if state is None:
        state = problem.initial
    if d == 0:
        return 1
    return 1 + sum(count_tree_nodes(problem, d - 1, problem.result(state, a))
                   for a in problem.actions(state))


def count_states(problem: Problem, d: int) -> int:
    reached = {problem.initial}
    layer = [problem.initial]
    for _ in range(d):
        next_layer: list = []
        for s in layer:
            for a in problem.actions(s):
                s1 = problem.result(s, a)
                if s1 not in reached:
                    reached.add(s1)
                    next_layer.append(s1)
        layer = next_layer
    return len(reached)
'''

HINTS = [
    'Tree nodes: recursion. A tree of depth 0 is just the root; otherwise 1 + the sizes of the children\'s '
    'subtrees of depth `d - 1`. Never check for repeated states here.',
    'States: proceed **layer by layer** (all states at distance 1, then 2, …) with a `reached` set. '
    'A depth-limited DFS with a visited set gives wrong answers — see the test "DFS trap".',
    'For each layer: for every state, every action → `s1`; if `s1` not in `reached`, add it and put it in the next layer.',
]

EXPLANATION = r"""
Numbers from the tests:

| problem | $d$ | tree nodes | distinct states |
|---|---|---|---|
| A ⇄ B | 10 | 11 | 2 |
| 5×5 grid (4 moves) | 8 | 11 391 | 25 |
| 8-puzzle (slides' state) | 10 | 37 449 | 706 |
| 8-puzzle (slides' state) | 12 | 299 593 | 1 850 |

The tree grows like $b^d$ (≈ 2.7ᵈ for the 8-puzzle) because every **reversible action** creates a
repeated state one level down; the number of states grows much more slowly and **saturates** when the
whole (finite) state space has been reached. That is why graph search keeps a `reached` table
(slides p. 105–106): it trades memory for not re-exploring the same states.

**DFS trap.** In `S→A→C→D, S→C` with $d = 2$, a depth-limited DFS first meets `C` at depth 2 (via `A`),
marks it visited, and later refuses `C` at depth 1 — so `D` is never counted. A "visited" state is not
necessarily reached by its *shortest* path: breadth-first layers guarantee it.
"""

ENTRY = 'count_tree_nodes'

_AB = GraphProblem('A', None, undirected([('A', 'B', 1)]))
_DIAMOND = GraphProblem('S', None, directed([('S', 'A', 1), ('S', 'B', 1), ('A', 'C', 1), ('B', 'C', 1), ('C', 'D', 1)]))
_TRAP = GraphProblem('S', None, directed([('S', 'A', 1), ('A', 'C', 1), ('C', 'D', 1), ('S', 'C', 1)]))
_GRID = GraphProblem(0, None, undirected([(r * 10 + c, r * 10 + c + 1, 1) for r in range(5) for c in range(4)] +
                                         [(r * 10 + c, r * 10 + c + 10, 1) for r in range(4) for c in range(5)]))
_PUZZLE = EightPuzzle((8, 2, 0, 3, 4, 7, 5, 1, 6))


def _both(problem, d):
    return lambda sol: (sol.count_tree_nodes(problem, d), sol.count_states(problem, d))


def _trap_check(got):
    if got == 4:
        return True
    return False, ('expected 4 (S, A, C, D). Did you use a DFS with a visited set? It reaches C first at depth 2 '
                   'and then ignores it at depth 1, so D is lost. Go layer by layer.')


TESTS = [
    Test('depth 0', call=_both(_AB, 0), expected=(1, 1), show='A ⇄ B, d = 0'),
    Test('A ⇄ B, d = 3', call=_both(_AB, 3), expected=(4, 2)),
    Test('A ⇄ B, d = 10: finite states, growing tree', call=_both(_AB, 10), expected=(11, 2)),
    Test('diamond: two paths to C', call=_both(_DIAMOND, 3), expected=(7, 5),
         show='S→A, S→B, A→C, B→C, C→D, d = 3'),
    Test('DFS trap', call=lambda sol: sol.count_states(_TRAP, 2), check=_trap_check,
         show='S→A, A→C, C→D, S→C, d = 2'),
    Test('5×5 grid, d = 4', call=_both(_GRID, 4), expected=(87, 15), show='4-connected 5×5 grid from a corner'),
    Test('5×5 grid, d = 8', call=_both(_GRID, 8), expected=(11391, 25), show='4-connected 5×5 grid from a corner'),
    Test('8-puzzle, d = 5', call=_both(_PUZZLE, 5), expected=(201, 51), show='8 2 _ / 3 4 7 / 5 1 6'),
    Test('8-puzzle, d = 10', call=_both(_PUZZLE, 10), expected=(37449, 706), show='8 2 _ / 3 4 7 / 5 1 6'),
    Test('8-puzzle, d = 12', call=_both(_PUZZLE, 12), expected=(299593, 1850), show='8 2 _ / 3 4 7 / 5 1 6',
         timeout=10),
]
