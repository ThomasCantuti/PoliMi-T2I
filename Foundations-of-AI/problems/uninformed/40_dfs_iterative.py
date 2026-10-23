from harness import Test
from aima import GraphProblem, undirected, failure
from uninformed_lib import CountingProblem, DFS_TREE, expect

TITLE = 'Depth-First Search (iterative, LIFO frontier)'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['DFS', 'LIFO frontier', 'is_cycle', 'tree-like search']

STATEMENT = r"""
Implement the iterative **depth-first search** of the slides (p. 145):

- the frontier is a **LIFO queue** (a stack: `LIFOQueue` is a list, use `append()` and `pop()`);
- pop a node and goal-test it; if it is not a goal **and does not form a cycle**
  (`is_cycle(node)`: its state already appears among its ancestors), push **all** its children,
  in the order `expand(problem, node)` generates them;
- **no `reached` table**: DFS is a *tree-like* search (slide p. 148) — that's where its small memory comes from.

Return the solution node or `failure`.

**Careful with the order.** The drawing on slide p. 143 shows the frontier ⟨2,3⟩ with node 2 selected
first. The Python code on p. 145 instead appends 2 then 3, so **3 is on top of the stack and is
selected first**: siblings are explored right to left. Both are depth-first, they only break ties
differently. Follow the code here; the recursive version (next problem) gives the left-to-right order.

```text
                1
           /          \
          2            3
        /   \        /   \
       4     5      8     9
      / \          / \
     6   7       11   12  <- goal
                 / \
               13   14
```
"""

STARTER = '''from aima import Problem, Node, expand, LIFOQueue, failure, is_cycle

def depth_first_search_iterative(problem: Problem) -> Node:
    "Search deepest nodes in the search tree first."
    frontier = LIFOQueue([Node(problem.initial)])
    result = failure
    # TODO: pop, goal test, and (if the node is not a cycle) push its children
    return result
'''

SOLUTION = '''from aima import Problem, Node, expand, LIFOQueue, failure, is_cycle

def depth_first_search_iterative(problem: Problem) -> Node:
    "Search deepest nodes in the search tree first."
    frontier = LIFOQueue([Node(problem.initial)])
    result = failure
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        elif not is_cycle(node):
            for child in expand(problem, node):
                frontier.append(child)
    return result
'''

HINTS = [
    'The loop has the same shape as BFS, but `frontier.pop()` on a list returns the **most recently** added node.',
    'There is no `reached` set. What stops the search from going around a loop A → B → C → A → … forever?',
    '`while frontier:` → `node = frontier.pop()` → `if problem.is_goal(node.state): return node` → '
    '`elif not is_cycle(node):` push every child with `frontier.append(child)`.',
]

EXPLANATION = r"""
On the slide tree the code selects 1, **3, 9, 8, 12**: the last child pushed is the first popped.
The slide drawing (p. 143) selects 1, 2, 4, 6, 7, 5, 3, 8, 11, 13, 14, 12 instead — the same
algorithm with the opposite sibling order (push the children in *reverse* to get it). In an exam,
follow the tie-breaking rule stated in the exercise (usually: alphabetical order = leftmost first).

**Why `is_cycle`?** Without a `reached` table, an undirected edge A–B already makes the search tree
infinite (A, B, A, B, …): DFS would never come back. `is_cycle` only removes paths that revisit a state
of the *current path*, which costs no extra memory. Still, a state can be explored many times along
different paths, and on an infinite state space DFS can still dive forever.

**Properties (p. 147).** Not complete (infinite paths; with cycle checking it is complete on
*finite* spaces), **not optimal** (it found `S → Z → Y → X → G` while `S → A → G` exists).
Time $O(b^m)$ with $m$ the maximum depth (possibly $m \gg d$, even $\infty$); space only $O(bm)$:
one path plus the unexpanded siblings of its nodes.
"""

ENTRY = 'depth_first_search_iterative'

_DETOUR = undirected([('S', 'A', 1), ('A', 'G', 1), ('S', 'Z', 1), ('Z', 'Y', 1), ('Y', 'X', 1), ('X', 'G', 1)])
_TRIANGLE = undirected([('A', 'B', 1), ('B', 'C', 1), ('C', 'A', 1), ('Y', 'Z', 1)])
_LOOP = undirected([('A', 'B', 1), ('B', 'G', 1), ('A', 'C', 1), ('C', 'D', 1), ('D', 'E', 1), ('E', 'C', 1)])
_CHAIN = undirected([(i, i + 1, 1) for i in range(2000)])
_RECURSIVE_ORDER = [1, 2, 4, 6, 7, 5, 3, 8, 11, 13, 14, 12]


def _slide(got, p):
    ok, msg = expect([1, 3, 8, 12])(got, p)
    if p.goal_tests == _RECURSIVE_ORDER:
        return False, ('you selected the children left to right (like the slide drawing). The course code '
                       'appends them in generation order, so the LAST child is on top of the stack: '
                       'expected selections [1, 3, 9, 8, 12].')
    if ok and p.goal_tests != [1, 3, 9, 8, 12]:
        return False, f'selected {p.goal_tests}, expected [1, 3, 9, 8, 12] (goal-test each node once, when popped)'
    return ok, msg + ('; selected 1, 3, 9, 8, 12' if ok else '')


TESTS = [
    Test('slide tree p. 141 (goal 12)', args=(CountingProblem(1, 12, DFS_TREE),), check=_slide,
         show='slide tree, goal 12'),
    Test('start is goal', args=(GraphProblem('S', 'S', _DETOUR),), check=expect(['S'])),
    Test('DFS is not optimal', args=(GraphProblem('S', 'G', _DETOUR),), check=expect(['S', 'Z', 'Y', 'X', 'G']),
         show='S-A-G (2 steps) and S-Z-Y-X-G (4 steps)', timeout=1),
    Test('long chain (2000 states)', args=(GraphProblem(0, 2000, _CHAIN),),
         check=lambda got, p: expect(list(range(2001)))(got, p)[0], show='0-1-2-...-2000'),
    Test('loop C-D-E on the way: needs is_cycle', args=(GraphProblem('A', 'G', _LOOP),), check=expect(['A', 'B', 'G']),
         show='A-B-G, and A-C with a loop C-D-E-C', timeout=1),
    Test('unreachable goal in a cyclic graph → failure', args=(GraphProblem('A', 'Z', _TRIANGLE),),
         check=expect(result=failure), show='triangle A-B-C, goal Z in another component', timeout=1),
]
