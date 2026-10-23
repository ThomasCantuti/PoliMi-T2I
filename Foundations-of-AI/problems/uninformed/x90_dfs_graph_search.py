from harness import Test
from aima import Problem, GraphProblem, undirected, failure
from uninformed_lib import CountingProblem, expect

TITLE = 'Exam · Jun 2022 · Iterative DFS as graph search (and why it is not optimal)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Jun 2022', 'DFS', 'graph search', 'expanded list', '8-puzzle', 'not optimal']

STATEMENT = r"""
*Written exam of 14 June 2022 — Problem 2 (Uninformed Search, 8 points), Questions 1 and 3.*

**Question 1.** Write the Python-like pseudo-code of the **iterative** version of depth-first search that,
given the problem, returns the solution. The search should **avoid repeated states** and thus implement a
**graph search**. Use `problem.initial`, `problem.is_goal(state)`, `Node` and `expand(problem, node)` as in the
course.

Implement `depth_first_graph_search(problem)` with an **expanded (closed) set** of states:

- the frontier is a LIFO stack (`LIFOQueue`, i.e. a list: `append` / `pop`);
- pop a node; if its state was **already expanded**, skip it (no goal test, no expansion);
- otherwise goal-test it (return it if it is a goal), add its state to the expanded set and push the children
  whose state is not expanded, **in reverse order**, so that the **first action** returned by
  `problem.actions` is explored first;
- return `failure` when the stack is empty.

**Question 3.** On the 8-puzzle, from the state below, show that depth-first search is **not optimal**
(the optimal solution is one move: the blank goes right). The tests run your search with different orders
of the blank's moves.

```text
1 2 3        goal  1 2 3
4 5 6              4 5 6
7 _ 8              7 8 _
```
"""

STARTER = '''from aima import Problem, Node, expand, LIFOQueue, failure

def depth_first_graph_search(problem: Problem) -> Node:
    frontier = LIFOQueue([Node(problem.initial)])
    expanded = set()
    # TODO: pop, skip already-expanded states, goal test, expand (first action on top of the stack)
    return failure
'''

SOLUTION = '''from aima import Problem, Node, expand, LIFOQueue, failure

def depth_first_graph_search(problem: Problem) -> Node:
    frontier = LIFOQueue([Node(problem.initial)])
    expanded = set()
    while frontier:
        node = frontier.pop()
        if node.state in expanded:
            continue                      # a duplicate reached by another path: discard it
        if problem.is_goal(node.state):
            return node
        expanded.add(node.state)
        children = [child for child in expand(problem, node) if child.state not in expanded]
        frontier.extend(reversed(children))   # first action ends on top of the stack
    return failure
'''

HINTS = [
    'Same loop as the course DFS (slides p.145), plus a set of expanded states instead of `is_cycle`.',
    'A state can be pushed twice (two different paths reach it before it is expanded): check the set **when '
    'you pop**, not only when you push.',
    '`frontier.extend(reversed(children))`: the last element pushed is the first popped, so reversing makes the '
    'first action the next one explored.',
]

EXPLANATION = r"""
**Model answer for Question 1** (what to write in the exam):

```python
def depth_first_graph_search(problem):
    frontier = LIFOQueue([Node(problem.initial)])   # stack
    expanded = set()                                 # closed list of states
    while frontier:
        node = frontier.pop()                        # deepest node first
        if node.state in expanded: continue          # repeated state: skip it
        if problem.is_goal(node.state): return node
        expanded.add(node.state)
        for child in reversed(list(expand(problem, node))):
            if child.state not in expanded:
                frontier.append(child)
    return failure
```

> **Discrepancy with the official solution:** the official answer reports the course code of slides p.145, which
> uses `is_cycle(node)`. That only discards states repeated **on the current path**: it is a tree-like search,
> not the graph search the question asks for (a state can still be explored again on another branch).

**Question 3 (the tests).** With the blank's moves ordered **Up, Right, Left, Down**, DFS explores the "Up"
subtree first and returns a solution of **41 moves** instead of 1. With **Up, Down, Left, Right** the solution
has **106 329 moves**: graph search still terminates, because each of the 181 440 reachable states is expanded at
most once. A tree search *without* any repeated-state check would instead loop forever (Up, Down, Up, Down, …), as
the official solution says; the `is_cycle` version avoids that 2-cycle but did not finish within 300 000 pops
in our runs. Only an order that tries **Right** first returns the optimal 1-move path: DFS returns the first
solution on its way, not the cheapest one.

> **Exam trap:** with a *reached* set filled when children are **generated**, the goal state (child "Right" of
> the root) is marked at the first expansion and can never be reached by another path: DFS then returns the
> optimal 1-move path, but only after popping all the other 181 439 states.

**Question 2 (complexity):** see the short-questions quiz: time $O(b^m)$, space $O(bm)$ for the tree-like
version; the expanded set makes the space proportional to the number of states.
"""

ENTRY = 'depth_first_graph_search'


class _Puzzle(Problem):
    """8-puzzle where an action is the direction the BLANK moves, tried in the given order."""
    DELTA = {'Up': -3, 'Down': 3, 'Left': -1, 'Right': 1}

    def __init__(self, order, initial=(1, 2, 3, 4, 5, 6, 7, 0, 8)):
        super().__init__(tuple(initial), (1, 2, 3, 4, 5, 6, 7, 8, 0), order=tuple(order))

    def actions(self, s):
        r, c = divmod(s.index(0), 3)
        ok = {'Up': r > 0, 'Down': r < 2, 'Left': c > 0, 'Right': c < 2}
        return [a for a in self.order if ok[a]]

    def result(self, s, a):
        b = s.index(0)
        t = list(s)
        t[b], t[b + self.DELTA[a]] = t[b + self.DELTA[a]], t[b]
        return tuple(t)


def _moves(expected):
    def check(got, p):
        if got is failure or not hasattr(got, 'parent'):
            return False, 'expected a solution Node'
        n, node = 0, got
        while node.parent is not None:      # iterative: the path can be very long
            n, node = n + 1, node.parent
        if not p.is_goal(got.state):
            return False, 'the returned node is not a goal'
        return n == expected, f'solution with {n} moves (expected {expected})'
    return check


_KNIGHT = undirected([(a, b, 1) for a, b in ['SA', 'SB', 'AC', 'BD', 'BE', 'CH', 'DF', 'DI', 'EH', 'FJ', 'GH',
                                             'GI', 'GK', 'JK']])
_CF = undirected([('C', 'D', 2), ('C', 'A', 4), ('A', 'B', 1), ('A', 'G', 3), ('A', 'H', 4), ('B', 'E', 4),
                  ('D', 'G', 3), ('E', 'F', 3), ('E', 'G', 2), ('E', 'H', 1)])
_TRIANGLE = undirected([('A', 'B', 1), ('B', 'C', 1), ('C', 'A', 1), ('Y', 'Z', 1)])


def _knight(got, p):
    order = list('SACHEBDFJKG')
    if p.goal_tests != order:
        return False, f'goal-tested {"".join(map(str, p.goal_tests))}, expected {"".join(order)} (exam of July 2022)'
    return expect(order)(got, p)


def _once(got, p):
    dup = sorted({s for s in p.expanded if p.expanded.count(s) > 1})
    if dup:
        return False, f'states expanded more than once: {dup}'
    return expect(['C', 'A', 'B', 'E', 'F'])(got, p)


TESTS = [
    Test('knight exam (Jul 2022): visit order', args=(CountingProblem('S', 'G', _KNIGHT),), check=_knight,
         show='3x4 knight graph, S → G, alphabetical order'),
    Test('no state expanded twice', args=(CountingProblem('E', 'Z', _CF),),
         check=lambda got, p: ((got is failure and len(set(p.expanded)) == len(p.expanded)),
                               f'expanded {p.expanded}'),
         show='graph of the Jun 2023 exam, unreachable goal Z'),
    Test('graph C → F (Jun 2023 exam)', args=(CountingProblem('C', 'F', _CF),), check=_once),
    Test('start is the goal', args=(GraphProblem('A', 'A', _TRIANGLE),), check=expect(['A'])),
    Test('cyclic graph, unreachable goal → failure', args=(GraphProblem('A', 'Z', _TRIANGLE),),
         check=expect(result=failure), timeout=1),
    Test('8-puzzle, order Right, Up, Left, Down', args=(_Puzzle(['Right', 'Up', 'Left', 'Down']),), check=_moves(1),
         show='blank tries Right first'),
    Test('8-puzzle, order Up, Right, Left, Down (not optimal)', args=(_Puzzle(['Up', 'Right', 'Left', 'Down']),),
         check=_moves(41), show='official example: Up first'),
    Test('8-puzzle, order Up, Down, Left, Right (terminates)', args=(_Puzzle(['Up', 'Down', 'Left', 'Right']),),
         check=_moves(106329), show='a tree search would loop Up/Down forever', timeout=15),
]
