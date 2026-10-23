from harness import Test
from aima import GraphProblem, undirected, failure
from uninformed_lib import CountingProblem, BFS_TREE, expect

TITLE = 'Breadth-First Search (graph search)'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['BFS', 'FIFO frontier', 'reached set', 'late goal test']

STATEMENT = r"""
Implement **breadth-first search** exactly as on the slides (p. 130):

- the frontier is a **FIFO queue** (`FIFOQueue`: add with `appendleft()`, remove with `pop()`);
- the goal test is done when a node is **selected** (popped) from the frontier;
- a `reached` **set** of states stops a state from entering the frontier twice.

Return the **solution node** (the goal `Node`; its path is `path_states(node)`), or `failure`
if the goal cannot be reached.

`expand(problem, node)` generates the children in the order of `problem.actions`, which for a
`GraphProblem` is **alphabetical / numeric** order: this is the tie-breaker among nodes at the same depth.

**Slide example (p. 124).** Goal = 7:

```text
              1
          /       \
        2           3
       / \         / \
      4   5       6   7    <- goal
     / \ / \     / \
    8  9 10 11  12 13
```

Frontier: ⟨1⟩ → ⟨2,3⟩ → ⟨3,4,5⟩ → ⟨4,5,6,7⟩ → ⟨5,6,7,8,9⟩ → … → ⟨7,8,9,…⟩. State 7 is generated
early, but it is recognized as a goal only when it is **selected**: by then 1–6 have been expanded.
"""

STARTER = '''from aima import Problem, Node, expand, FIFOQueue, failure

def breadth_first_search(problem: Problem) -> Node:
    node = Node(problem.initial)
    frontier = FIFOQueue([node])      # appendleft() to add, pop() to remove
    reached: set = {problem.initial}
    # TODO: while the frontier is not empty:
    #   pop a node, goal-test it, expand it, add the children whose state is new
    return failure
'''

SOLUTION = '''from aima import Problem, Node, expand, FIFOQueue, failure

def breadth_first_search(problem: Problem) -> Node:
    node = Node(problem.initial)
    frontier = FIFOQueue([node])
    reached: set = {problem.initial}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            s = child.state
            if s not in reached:
                reached.add(s)
                frontier.appendleft(child)
    return failure
'''

HINTS = [
    'BFS always selects the **shallowest** node. Which queue discipline hands you the oldest node first?',
    'Loop `while frontier:` → `node = frontier.pop()` → goal test on `node.state` → expand.',
    'For each child: if `child.state not in reached`, add the state to `reached` **and** `frontier.appendleft(child)`. '
    'After the loop, `return failure`.',
]

EXPLANATION = r"""
BFS explores the search tree **level by level** (all of level $k$ before any of level $k+1$), so the
first goal it selects has **minimum depth**: BFS is optimal when all step costs are equal (more
generally, when path cost is a non-decreasing function of depth). With costs, the fewest-hops path
`S → F → G` (cost 10) beats the cheaper `S → A → C → E → G` (cost 4): that's what UCS fixes.

Because the goal test is done at **selection**, in the worst case every node at depth $d$ is expanded
before the goal is selected, so the nodes of level $d+1$ get generated: time and space
$O(b^{d+1})$ (slides p. 125–126). On the slide tree you generated 12 nodes but needed only 6 —
the next problem fixes that with the **early goal test**.

`reached` is updated when a node is **generated**, not when it is expanded: a state never enters the
frontier twice, and with unit costs the first path found to a state is already a shallowest one.
"""

ENTRY = 'breadth_first_search'

_G1 = undirected([('S', 'A', 1), ('A', 'G', 1), ('S', 'B', 1), ('B', 'G', 1)])
_G2 = undirected([('S', 'A', 1), ('S', 'B', 1), ('A', 'C', 1), ('B', 'D', 1), ('C', 'E', 1),
                  ('D', 'E', 1), ('E', 'G', 1), ('S', 'F', 1), ('F', 'G', 9)])
_G3 = undirected([('S', 'A', 1), ('A', 'B', 1), ('X', 'Y', 1)])
_GRID = undirected([((r, c), (r, c + 1), 1) for r in range(4) for c in range(3)] +
                   [((r, c), (r + 1, c), 1) for r in range(3) for c in range(4)])
_CHAIN = undirected([(i, i + 1, 1) for i in range(2000)])


def _slide_order(got, p):
    ok, msg = expect([1, 3, 7])(got, p)
    if not ok:
        return ok, msg
    if p.expanded == [1, 2, 3]:
        return False, ('you recognized 7 as soon as it was generated (early goal test). Here do the goal test '
                       'when a node is SELECTED: 4, 5, 6 must be expanded before 7 is popped.')
    if p.expanded != [1, 2, 3, 4, 5, 6]:
        return False, f'expanded {p.expanded}, expected [1, 2, 3, 4, 5, 6]: level by level, left to right.'
    return True, f'expanded {p.expanded}, generated {len(p.generated)} nodes (2..13)'


def _no_repeats(got, p):
    ok, msg = expect([(0, 0), (0, 1), (0, 2), (0, 3), (1, 3), (2, 3), (3, 3)])(got, p)
    if not ok:
        return ok, msg
    dup = sorted({s for s in p.expanded if p.expanded.count(s) > 1})
    if dup:
        return False, f'states expanded more than once: {dup}. Add a state to `reached` when it is generated.'
    return True, f'{len(p.expanded)} expansions, each state at most once'


TESTS = [
    Test('slide tree p. 124 (goal 7)', args=(CountingProblem(1, 7, BFS_TREE),), check=_slide_order,
         show='binary tree 1..13, goal 7'),
    Test('square graph: alphabetical tie-break', args=(GraphProblem('S', 'G', _G1),),
         check=expect(['S', 'A', 'G']), show='S-A-G and S-B-G'),
    Test('fewest hops wins (costs ignored)', args=(GraphProblem('S', 'G', _G2),),
         check=expect(['S', 'F', 'G']), show='S-F-G: 2 hops, cost 10;  S-A-C-E-G: 4 hops, cost 4'),
    Test('start is goal', args=(GraphProblem('S', 'S', _G1),), check=expect(['S'])),
    Test('unreachable goal', args=(GraphProblem('S', 'Y', _G3),), check=expect(result=failure),
         show='S-A-B and X-Y (two components), goal Y'),
    Test('4x4 grid: no state expanded twice', args=(CountingProblem((0, 0), (3, 3), _GRID),), check=_no_repeats,
         show='4x4 grid graph, (0,0) to (3,3)'),
    Test('long chain (2000 states)', args=(GraphProblem(0, 2000, _CHAIN),),
         check=lambda got, p: expect(list(range(2001)))(got, p)[0], show='0-1-2-...-2000'),
]
