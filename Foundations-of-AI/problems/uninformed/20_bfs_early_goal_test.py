from harness import Test
from aima import GraphProblem, undirected, failure
from uninformed_lib import CountingProblem, BFS_TREE, tree, expect

TITLE = 'BFS with the early goal test'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['BFS', 'early goal test', 'complexity', 'generated nodes']

STATEMENT = r"""
In BFS we can do the goal test when a node is **generated** instead of when it is selected
(slides p. 127–131). Implement `breadth_first_search_early_goal_test(problem)` like the textbook
(Figure 3.9):

1. if the **initial state** is a goal, return its node right away;
2. otherwise loop: pop a node, and for each child: **if it is a goal, return it**; else, if its state is
   not in `reached`, add it to `reached` and to the frontier.

Return the solution node or `failure`.

On the slide tree (goal 7) the late test of the previous problem expanded 1–6 and generated
**12** nodes (2…13). How many will you generate now? The tests count them.
"""

STARTER = '''from aima import Problem, Node, expand, FIFOQueue, failure

def breadth_first_search_early_goal_test(problem: Problem) -> Node:
    node = Node(problem.initial)
    # TODO 1: the initial state might already be a goal
    frontier = FIFOQueue([node])
    reached: set = {problem.initial}
    # TODO 2: BFS loop, goal-testing every child as soon as it is generated
    return failure
'''

SOLUTION = '''from aima import Problem, Node, expand, FIFOQueue, failure

def breadth_first_search_early_goal_test(problem: Problem) -> Node:
    node = Node(problem.initial)
    if problem.is_goal(problem.initial):
        return node
    frontier = FIFOQueue([node])
    reached: set = {problem.initial}
    while frontier:
        node = frontier.pop()
        for child in expand(problem, node):
            s = child.state
            if problem.is_goal(s):
                return child
            if s not in reached:
                reached.add(s)
                frontier.appendleft(child)
    return failure
'''

HINTS = [
    'Same skeleton as BFS: what changes is **where** `problem.is_goal` is called.',
    'Children are goal-tested inside the `for child in expand(problem, node)` loop. '
    'But the root is never anybody\'s child: who tests it?',
    'Before the loop: `if problem.is_goal(problem.initial): return node`. Inside the loop, for each child: '
    '`if problem.is_goal(child.state): return child`, then the usual `reached` check.',
]

EXPLANATION = r"""
On the slide tree the goal 7 is detected when node 3 is expanded: **3 expansions, 6 generated nodes**
instead of 6 and 12. In general the late test generates all of level $d+1$ in the worst case
($b^{d+1}-b$ extra nodes), the early test stops at level $d$:

| goal test | worst-case nodes generated | complexity |
|---|---|---|
| at selection (late) | $b + b^2 + \dots + b^d + (b^{d+1}-b)$ | $O(b^{d+1})$ |
| at generation (early) | $b + b^2 + \dots + b^d$ | $O(b^d)$ |

On the depth-10 binary tree that is 2046 vs 4092 generated nodes: the early test halves the work
when $b=2$, and saves a factor $\approx b$ in general.

**Why is it still optimal?** BFS generates nodes in order of depth, so the first goal *generated*
is also a shallowest one. This is **only** true for BFS: for uniform-cost search the first goal
generated is not necessarily the cheapest (next problem). That's why the textbook says BFS can do the
early test *because* it uses a FIFO queue and a plain `reached` set (slide p. 132).

Forgetting the initial check gives a funny bug: with start = goal = S, the search would return
`S → A → S` (when S is generated again as A's child) — a non-optimal "solution" of cost 2.
"""

ENTRY = 'breadth_first_search_early_goal_test'

_G1 = undirected([('S', 'A', 1), ('A', 'G', 1), ('S', 'B', 1), ('B', 'G', 1)])
_G2 = undirected([('S', 'A', 1), ('S', 'B', 1), ('A', 'C', 1), ('B', 'D', 1), ('C', 'E', 1),
                  ('D', 'E', 1), ('E', 'G', 1), ('S', 'F', 1), ('F', 'G', 9)])
_G3 = undirected([('S', 'A', 1), ('A', 'B', 1), ('X', 'Y', 1)])
_DEEP = tree({i: [2 * i, 2 * i + 1] for i in range(1, 2048)})  # binary tree, levels 0..11


def _slide(got, p):
    ok, msg = expect([1, 3, 7])(got, p)
    if not ok:
        return ok, msg
    if p.generated != [2, 3, 4, 5, 6, 7]:
        return False, (f'you generated {len(p.generated)} nodes {p.generated}; with the early test 7 is found '
                       'when node 3 is expanded, so only 2..7 are generated.')
    return True, 'expanded [1, 2, 3], generated 6 nodes (late test: 12)'


def _start_is_goal(got, p):
    ok, msg = expect(['S'])(got, p)
    if not ok:
        return False, msg + '. The initial state is never generated as a child: test it before the loop.'
    return (p.expanded == [], 'no expansion needed' if not p.expanded else 'you expanded the root needlessly')


def _deep(got, p):
    ok, msg = expect(list(_path_to(2047)))(got, p)
    if not ok:
        return ok, msg
    n = len(p.generated)
    return n == 2046, f'{n} nodes generated (late goal test: 4092, early: 2046)'


def _path_to(i):
    return _path_to(i // 2) + [i] if i > 1 else [1]


TESTS = [
    Test('slide tree p. 124 (goal 7)', args=(CountingProblem(1, 7, BFS_TREE),), check=_slide,
         show='binary tree 1..13, goal 7'),
    Test('start is goal', args=(CountingProblem('S', 'S', _G1),), check=_start_is_goal,
         show='S-A-G and S-B-G, start = goal = S'),
    Test('fewest hops wins', args=(GraphProblem('S', 'G', _G2),), check=expect(['S', 'F', 'G']),
         show='S-F-G: 2 hops, cost 10;  S-A-C-E-G: 4 hops, cost 4'),
    Test('unreachable goal', args=(GraphProblem('S', 'Y', _G3),), check=expect(result=failure),
         show='S-A-B and X-Y (two components), goal Y'),
    Test('binary tree, goal = last node of depth 10', args=(CountingProblem(1, 2047, _DEEP),), check=_deep,
         show='complete binary tree 1..4095, goal 2047 (d = 10)'),
]
