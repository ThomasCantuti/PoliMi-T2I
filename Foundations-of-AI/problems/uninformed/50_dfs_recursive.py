from harness import Test
from aima import GraphProblem, undirected, failure
from uninformed_lib import CountingProblem, DFS_TREE, expect

TITLE = 'Depth-First Search (recursive)'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['DFS', 'recursion', 'backtracking', 'is_cycle']

STATEMENT = r"""
Write the **recursive** depth-first search of the slides (p. 144). The call stack *is* the frontier:

- goal-test the node; if it is a goal, return it;
- if it forms a cycle (`is_cycle(node)`), this path is a dead end: return `failure`;
- otherwise try each child in the order `expand(problem, node)` generates them, recursively; return
  the first result that is a solution. If no child leads to a solution, return `failure` (**backtrack**).

On the slide tree (p. 141–143) this reproduces exactly the hand-drawn frontier trace:

```text
⟨1⟩ ⟨2,3⟩ ⟨4,5,3⟩ ⟨6,7,5,3⟩ ⟨7,5,3⟩ ⟨5,3⟩ ⟨3⟩ ⟨8,9⟩ ⟨11,12,9⟩ ⟨13,14,12,9⟩ ⟨14,12,9⟩ ⟨12,9⟩
```

so the nodes are goal-tested in the order 1, 2, 4, 6, 7, 5, 3, 8, 11, 13, 14, 12.
"""

STARTER = '''from aima import Problem, Node, expand, failure, is_cycle

def depth_first_recursive_search(problem: Problem, node: Node | None = None) -> Node:
    if node is None:
        node = Node(problem.initial)
    # TODO: goal test, cycle check, then recurse on each child
    return failure
'''

SOLUTION = '''from aima import Problem, Node, expand, failure, is_cycle

def depth_first_recursive_search(problem: Problem, node: Node | None = None) -> Node:
    if node is None:
        node = Node(problem.initial)
    if problem.is_goal(node.state):
        return node
    elif is_cycle(node):
        return failure
    else:
        for child in expand(problem, node):
            result = depth_first_recursive_search(problem, child)
            if result:
                return result
        return failure
'''

HINTS = [
    'Three cases, in this order: the node is a goal; the node closes a cycle; otherwise explore the children.',
    'Do not `return` the result of the first recursive call blindly: if that subtree fails you must '
    '**backtrack** and try the next child.',
    '`for child in expand(problem, node): result = depth_first_recursive_search(problem, child)`; '
    '`if result is not failure: return result`. After the loop: `return failure`.',
]

EXPLANATION = r"""
The recursion keeps on the Python call stack exactly what the iterative version keeps in its
LIFO queue: the current path, plus (implicitly, in each `for` loop) the siblings still to try.
Here siblings are tried **left to right**, matching the slide drawing; the iterative code of p. 145
pushes all children and pops the last one first, so it goes right to left.

**About `if result:`** (slide code): `failure` is a `Node` with no parent, so `len(failure) == 0`
and it is *falsy*; any real solution returned by a child has depth $\ge 1$, so it is truthy.
`if result is not failure:` says the same thing more explicitly.

**Why `is_cycle` matters even more here:** without it, the loop B → C → D → B → … would recurse until
Python raises `RecursionError` — the programming twin of "DFS is not complete: it can get stuck in
an infinite loop" (p. 147). With it, DFS is complete on finite state spaces, but still **not optimal**:
it returned `S → A → B → C → G` although `S → Z → G` exists.

Space: $O(bm)$ for the iterative version; the recursive one needs only $O(m)$ stack frames, since each
frame generates the next sibling lazily (`expand` is a generator) — this is called backtracking search,
and it is how CSPs are solved later in the course.
"""

ENTRY = 'depth_first_recursive_search'

_LONG_FIRST = undirected([('S', 'A', 1), ('A', 'B', 1), ('B', 'C', 1), ('C', 'G', 1), ('S', 'Z', 1), ('Z', 'G', 1)])
_LOOP = undirected([('A', 'B', 1), ('B', 'C', 1), ('C', 'D', 1), ('D', 'B', 1), ('A', 'Z', 1), ('Z', 'G', 1)])
_TRIANGLE = undirected([('A', 'B', 1), ('B', 'C', 1), ('C', 'A', 1), ('Y', 'Z', 1)])
_ORDER = [1, 2, 4, 6, 7, 5, 3, 8, 11, 13, 14, 12]


def _slide(got, p):
    ok, msg = expect([1, 3, 8, 12])(got, p)
    if p.goal_tests[:4] == [1, 2, 4, 6] and got is failure:
        return False, (f'you goal-tested {p.goal_tests} and returned failure: when the first child fails, '
                       'backtrack and try the next one instead of returning.')
    if ok and p.goal_tests != _ORDER:
        return False, f'goal-tested {p.goal_tests}, expected {_ORDER} (the slide trace)'
    return ok, msg + ('; goal-tested in the slide order' if ok else '')


TESTS = [
    Test('slide tree p. 141 (goal 12)', args=(CountingProblem(1, 12, DFS_TREE),), check=_slide,
         show='slide tree, goal 12'),
    Test('start is goal', args=(GraphProblem('S', 'S', _LONG_FIRST),), check=expect(['S'])),
    Test('DFS is not optimal', args=(GraphProblem('S', 'G', _LONG_FIRST),), check=expect(['S', 'A', 'B', 'C', 'G']),
         show='S-A-B-C-G (4 steps) and S-Z-G (2 steps)'),
    Test('loop B-C-D on the way: needs is_cycle', args=(GraphProblem('A', 'G', _LOOP),),
         check=expect(['A', 'Z', 'G']), show='A-B with a loop B-C-D-B, and A-Z-G'),
    Test('unreachable goal in a cyclic graph → failure', args=(GraphProblem('A', 'Z', _TRIANGLE),),
         check=expect(result=failure), show='triangle A-B-C, goal Z in another component'),
]
