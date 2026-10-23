from harness import Test
from aima import Problem, GraphProblem, Node, undirected, failure, cutoff, path_states, path_actions
from uninformed_lib import CountingProblem, FULL_TREE, expect, describe

TITLE = 'Iterative Deepening Search'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['iterative deepening', 'depth-limited search', 'completeness', 'cutoff']

STATEMENT = r"""
Iterative deepening runs depth-limited searches with **increasing limits** $L = 0, 1, 2, \dots$ until one
of them does **not** return `cutoff` (slides p. 154–155):

```python
def iterative_deepening_search(problem):
    "Do depth-limited search with increasing depth limits."
    for limit in range(1, sys.maxsize):
        result = depth_limited_search(problem, limit)
        if result != cutoff:
            return result
```

`depth_limited_search` from the previous problem is already in the starter. Write
`iterative_deepening_search(problem)`; it returns the solution node or `failure`.

Then look at the tests: IDS finds the **shallowest** goal like BFS, terminates with `failure` on a
finite graph, and works on an **infinite** state space where DFS dives forever. On the slide tree
(p. 157–159, goal = node 6 at depth 2) the tests also look at which nodes get expanded: the whole
tree is regenerated at every iteration (p. 160).
"""

_DLS = '''from aima import Problem, Node, expand, LIFOQueue, failure, cutoff, is_cycle
import sys

def depth_limited_search(problem: Problem, limit: int = 10) -> Node:
    "Search deepest nodes in the search tree first, never below depth `limit`."
    frontier = LIFOQueue([Node(problem.initial)])
    result = failure
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        elif len(node) >= limit:
            result = cutoff
        elif not is_cycle(node):
            for child in expand(problem, node):
                frontier.append(child)
    return result
'''

STARTER = _DLS + '''
def iterative_deepening_search(problem: Problem) -> Node:
    "Do depth-limited search with increasing depth limits."
    # TODO
    return failure
'''

SOLUTION = _DLS + '''
def iterative_deepening_search(problem: Problem) -> Node:
    "Do depth-limited search with increasing depth limits."
    for limit in range(1, sys.maxsize):
        result = depth_limited_search(problem, limit)
        if result != cutoff:
            return result
'''

HINTS = [
    'A `for` loop over the limit, calling `depth_limited_search(problem, limit)` each time.',
    'Stop as soon as the result is a solution **or** `failure`. Only `cutoff` means "try deeper". '
    'Careful: `if result:` does not work: `failure` and `cutoff` are falsy (`len(node)` is the depth, 0 for them), '
    'but so is a solution at depth 0 (start = goal).',
    '`for limit in range(1, sys.maxsize): result = depth_limited_search(problem, limit); '
    'if result is not cutoff: return result`.',
]

EXPLANATION = r"""
**Why it works.** Iteration $L$ explores the tree down to depth $L$, so the first iteration that finds
a goal has $L = d$: IDS is **complete** (for finite $b$) and finds a **shallowest** goal, hence it is
optimal when all step costs are equal — like BFS. Yet each iteration is a DFS: space $O(bd)$.

**Why the repeated work is cheap.** Nodes at depth $d$ are generated once, at depth $d-1$ twice, …,
at depth 1 $d$ times:
$$N(\text{IDS}) = d\,b + (d-1)\,b^2 + \dots + 1\cdot b^d = O(b^d)$$
For $b = 10, d = 5$: $50 + 400 + 3{,}000 + 20{,}000 + 100{,}000 = 123{,}450$ vs $111{,}110$ for BFS
(early goal test): only ~11% more, because almost all nodes of a tree live in its **last level**.
(Problem 80 makes you compute this.)

**Why `failure` must stop the loop.** If depth-limited search returns `failure`, no node was cut off:
the whole cycle-free tree was explored, and deeper limits would explore exactly the same tree.

**Infinite spaces.** From 1, with actions `+1` and `*2`, DFS always pops `*2` first and never comes
back (1, 2, 4, 8, 16, …). IDS reaches 10 at depth 4 (e.g. 1 → 2 → 4 → 5 → 10).

**Summary (p. 161–162):** complete, optimal for unit costs, time $O(b^d)$, space $O(bd)$ — the best of
BFS and DFS. It is the preferred uninformed method when the state space is large and $d$ is unknown.
"""

ENTRY = 'iterative_deepening_search'

_DETOUR = undirected([('S', 'A', 1), ('A', 'G', 1), ('S', 'Z', 1), ('Z', 'Y', 1), ('Y', 'X', 1), ('X', 'G', 1)])
_TRIANGLE = undirected([('A', 'B', 1), ('B', 'C', 1), ('C', 'A', 1), ('Y', 'Z', 1)])


class NumberLine(Problem):
    """States are positive integers; from n you can go to n + 1 or 2n. Infinitely many states."""

    def actions(self, state):
        return ['+1', '*2']

    def result(self, state, action):
        return state + 1 if action == '+1' else 2 * state


def _slide(got, p):
    ok, msg = expect([1, 3, 6])(got, p)
    if ok and p.expanded.count(1) != 2:
        return False, (f'expanded {p.expanded}: the root should be expanded once per iteration with L >= 1 '
                       '(L=1 and L=2), i.e. twice.')
    return ok, msg + (f'; expanded {p.expanded}: the tree is regenerated at each iteration' if ok else '')


def _number_line(got, p):
    if not isinstance(got, Node) or got is failure or got is cutoff:
        return False, 'expected a solution node, got ' + describe(got)
    states = path_states(got)
    ok = (states[0] == 1 and states[-1] == 10 and len(states) == 5 and
          all(b in (a + 1, 2 * a) for a, b in zip(states, states[1:])))
    return ok, f'you returned {" → ".join(map(str, states))} ({", ".join(path_actions(got))}); shortest has 4 actions'


def _triangle(got, p):
    if got is not failure and not isinstance(got, Node):
        return False, f'returned {got!r}: when depth-limited search says failure, return failure'
    return expect(result=failure)(got, p)


TESTS = [
    Test('slide tree p. 157-159 (goal 6, depth 2)', args=(CountingProblem(1, 6, FULL_TREE),), check=_slide,
         show='complete binary tree 1..15, goal 6'),
    Test('shallowest goal (DFS returned S-Z-Y-X-G)', args=(GraphProblem('S', 'G', _DETOUR),),
         check=expect(['S', 'A', 'G']), show='S-A-G (2 steps) and S-Z-Y-X-G (4 steps)'),
    Test('start is goal', args=(GraphProblem('S', 'S', _DETOUR),), check=expect(['S']), timeout=1),
    Test('infinite state space: 1 → 10 with +1 / *2', args=(NumberLine(1, 10),), check=_number_line, timeout=2,
         show='NumberLine(1, 10): actions +1 and *2'),
    Test('unreachable goal in a cyclic graph → failure', args=(GraphProblem('A', 'Z', _TRIANGLE),),
         check=_triangle, timeout=1, show='triangle A-B-C, goal Z in another component'),
]
