from harness import Test
from aima import GraphProblem, undirected, failure, cutoff
from uninformed_lib import CountingProblem, DFS_TREE, expect

TITLE = 'Depth-Limited Search: cutoff vs failure'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['depth-limited search', 'cutoff', 'failure', 'is_cycle']

STATEMENT = r"""
Depth-limited search is DFS with a depth limit $L$: **nodes at depth $L$ are treated as if they had
no successors** (slides p. 152–153). It can end in three ways:

| return | meaning |
|---|---|
| a solution node | found a goal at depth $\le L$ |
| `cutoff` | no goal found, but **some node was not expanded because of the limit**: a solution might exist deeper |
| `failure` | the whole (cycle-free) search tree was explored: there is **no solution at any depth** |

Implement `depth_limited_search(problem, limit)` as on the slides: the iterative DFS of the previous
problems, plus one new case after the goal test — if `len(node) >= limit` (its depth), don't expand it
and remember `result = cutoff`.

```text
                1                 depth 0
           /          \
          2            3          depth 1
        /   \        /   \
       4     5      8     9       depth 2
      / \          / \
     6   7       11   12          depth 3
                 / \
               13   14            depth 4
```
"""

STARTER = '''from aima import Problem, Node, expand, LIFOQueue, failure, cutoff, is_cycle

def depth_limited_search(problem: Problem, limit: int = 10) -> Node:
    "Search deepest nodes in the search tree first, never below depth `limit`."
    frontier = LIFOQueue([Node(problem.initial)])
    result = failure
    # TODO: like DFS, but a node at depth >= limit is not expanded (result becomes cutoff)
    return result
'''

SOLUTION = '''from aima import Problem, Node, expand, LIFOQueue, failure, cutoff, is_cycle

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

HINTS = [
    '`len(node)` is the depth of a node (the root has depth 0). A node at depth `limit` may still be '
    'goal-tested, but it must not be expanded.',
    'Do not return `cutoff` as soon as you hit the limit: other branches may still contain a goal. '
    'Just remember it in `result` and go on.',
    'Inside the loop: `if problem.is_goal(node.state): return node` / `elif len(node) >= limit: result = cutoff` '
    '/ `elif not is_cycle(node):` push the children. After the loop `return result`.',
]

EXPLANATION = r"""
**cutoff ≠ failure.** `failure` is a *proof* that no solution exists (every cycle-free path was explored
to its end). `cutoff` only says "not within $L$ steps": with $L = 2$ the goal 12 (depth 3) is invisible,
and the honest answer is "I don't know". Iterative deepening relies on exactly this difference: it keeps
increasing $L$ while the answer is `cutoff`, and stops on a solution **or on `failure`**.

**Why `is_cycle` still matters.** In the triangle A–B–C, without the cycle check the path
A, B, A, B, … would hit the limit and return `cutoff` — so iterative deepening would never stop.
With it, every path dies at a repeated state, the search runs out of nodes, and returns `failure`.

**Properties (p. 152).** Complete only if $L \ge d$ (and $d$ is usually unknown); not optimal
(it is a DFS); time $O(b^L)$, space $O(bL)$.

Note the convention: the slide code checks `len(node) >= limit`, i.e. a goal at depth exactly $L$ is
still found, but nothing deeper is ever generated (the textbook figure writes `DEPTH(node) > ℓ`, an
off-by-one variant: always check which one an exercise uses).
"""

ENTRY = 'depth_limited_search'

_TRIANGLE = undirected([('A', 'B', 1), ('B', 'C', 1), ('C', 'A', 1), ('Y', 'Z', 1)])


def _limit2_goal5(got, p, limit):
    ok, msg = expect([1, 2, 5])(got, p)
    if ok and p.expanded != [1, 3, 2]:
        return False, f'expanded {p.expanded}, expected [1, 3, 2]: nodes 9 and 8 are at depth 2 = limit, not expanded'
    return ok, msg + ('; expanded [1, 3, 2]' if ok else '')


def _limit2_goal12(got, p, limit):
    if got is failure:
        return False, ('you returned failure, but nodes at depth 2 were cut off: the goal might be deeper '
                       '(it is, at depth 3). Return cutoff.')
    if got is not cutoff and getattr(got, 'state', None) == 12:
        return False, 'you found 12 at depth 3 with limit 2: nodes at depth >= limit must not be expanded.'
    return expect(result=cutoff)(got, p, limit)


def _triangle(got, p, limit):
    if got is cutoff:
        return False, ('you returned cutoff: going around the cycle A-B-C you hit the limit. Use is_cycle '
                       'so cyclic paths die, the search tree becomes finite, and you can prove failure.')
    return expect(result=failure)(got, p, limit)


TESTS = [
    Test('goal at depth 3, limit 3', args=(CountingProblem(1, 12, DFS_TREE), 3), check=expect([1, 3, 8, 12]),
         show='slide tree, goal 12, limit 3'),
    Test('goal at depth 3, limit 2 → cutoff', args=(CountingProblem(1, 12, DFS_TREE), 2), check=_limit2_goal12,
         show='slide tree, goal 12, limit 2'),
    Test('limit 2: depth-2 nodes are not expanded', args=(CountingProblem(1, 5, DFS_TREE), 2), check=_limit2_goal5,
         show='slide tree, goal 5, limit 2'),
    Test('limit 0, start is goal', args=(GraphProblem(1, 1, DFS_TREE), 0), check=expect([1])),
    Test('limit 0, start is not goal → cutoff', args=(GraphProblem(1, 12, DFS_TREE), 0), check=expect(result=cutoff)),
    Test('absent goal, tree deeper than limit → cutoff', args=(GraphProblem(1, 99, DFS_TREE), 3),
         check=expect(result=cutoff), show='slide tree, goal 99 (not in the tree), limit 3'),
    Test('absent goal, whole tree explored → failure', args=(GraphProblem(1, 99, DFS_TREE), 5),
         check=expect(result=failure), show='slide tree (depth 4), goal 99, limit 5'),
    Test('cyclic graph, unreachable goal → failure', args=(GraphProblem('A', 'Z', _TRIANGLE), 10), check=_triangle,
         show='triangle A-B-C, goal Z in another component, limit 10'),
]
