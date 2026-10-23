from numbers import Real

from harness import Test
from aima import (GraphProblem, Node, undirected, expand, FIFOQueue, LIFOQueue, PriorityQueue,
                  failure, is_cycle, path_states)

TITLE = 'Break the algorithms: build counterexamples'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['optimality', 'counterexample', 'BFS', 'DFS', 'UCS', 'early goal test']

STATEMENT = r"""
Exam favourite: *"show with an example that algorithm X is not optimal"*. Here **you** build the
examples and the tests run the course algorithms on them.

Each function returns the edges of a small **undirected** graph as a list of `(state, state, cost)`
tuples (at most 10 edges, positive costs). The search always goes from `'S'` to `'G'`, actions in
**alphabetical order** (as in `GraphProblem`).

1. `bfs_not_optimal()` — breadth-first search (goal test at selection) returns a path that **costs more**
   than the one uniform-cost search returns.
2. `dfs_not_shallowest()` — the iterative DFS of the slides (p. 145: LIFO, children pushed in order,
   `is_cycle`) returns a path with **more actions** than the BFS one.
3. `ucs_early_goal_test_wrong()` — a "UCS" that goal-tests nodes when they are **generated** returns a
   **costlier** path than the real UCS.

Example of the format: `[('S', 'A', 1), ('A', 'G', 5)]`.
"""

STARTER = '''def bfs_not_optimal() -> list[tuple[str, str, float]]:
    # TODO: edges where BFS's solution costs more than UCS's
    return []

def dfs_not_shallowest() -> list[tuple[str, str, float]]:
    # TODO: edges where DFS's solution has more steps than BFS's
    return []

def ucs_early_goal_test_wrong() -> list[tuple[str, str, float]]:
    # TODO: edges where UCS with the goal test at generation is not optimal
    return []
'''

SOLUTION = '''def bfs_not_optimal() -> list[tuple[str, str, float]]:
    # BFS: S-G (1 step, cost 10).  UCS: S-A-G (cost 2).
    return [('S', 'G', 10), ('S', 'A', 1), ('A', 'G', 1)]

def dfs_not_shallowest() -> list[tuple[str, str, float]]:
    # LIFO: Z is pushed after A, so it is popped first: S-Z-Y-G (3 steps) vs S-A-G (2 steps).
    return [('S', 'A', 1), ('A', 'G', 1), ('S', 'Z', 1), ('Z', 'Y', 1), ('Y', 'G', 1)]

def ucs_early_goal_test_wrong() -> list[tuple[str, str, float]]:
    # Expanding S generates G (cost 10): an early test stops there. UCS would find S-A-G (cost 2).
    return [('S', 'G', 10), ('S', 'A', 1), ('A', 'G', 1)]
'''

HINTS = [
    'Start from the property each algorithm optimizes. BFS minimizes the number of actions, DFS follows the '
    'last-pushed child, early-test UCS stops at the first goal it *generates*.',
    'A direct but expensive edge S–G versus a cheap two-step detour S–A–G breaks two of the three. '
    'For DFS, remember which child of S is popped first: the alphabetically **last** one.',
    'BFS / early UCS: `[(\'S\', \'G\', 10), (\'S\', \'A\', 1), (\'A\', \'G\', 1)]`. DFS: give S a neighbor late in '
    'the alphabet (Z) that starts a long path to G, and an early one (A) with a short path.',
]

EXPLANATION = r"""
- **BFS** minimizes the *number of actions*, not their cost: it is optimal only if all step costs are
  equal (more generally, non-decreasing with depth). One expensive direct edge breaks it.
- **DFS** returns the first solution along its (arbitrary) exploration order: the length of that path
  is unrelated to the shallowest one — it is not optimal even with unit costs.
- **UCS with an early goal test**: a goal is often first *generated* through an expensive edge; the
  cheaper path is discovered later. Only when a node is *selected* (minimum $g$ in the frontier) do we
  know its cost is optimal. That's why best-first algorithms (UCS, A*) use the **late** goal test,
  while BFS may use the early one (the first goal generated is also a shallowest one).

Minimal counterexamples like these are exactly what an exam answer should contain: 3 states, a
picture, and one line saying what each algorithm returns.
"""

ENTRY = 'bfs_not_optimal'


# ---- reference algorithms (course code)

def _bfs(problem):
    node = Node(problem.initial)
    frontier, reached = FIFOQueue([node]), {problem.initial}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            if child.state not in reached:
                reached.add(child.state)
                frontier.appendleft(child)
    return failure


def _ucs(problem, early=False):
    node = Node(problem.initial)
    if early and problem.is_goal(node.state):
        return node
    frontier, reached = PriorityQueue([node], key=lambda n: n.path_cost), {problem.initial: node}
    while frontier:
        node = frontier.pop()
        if not early and problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            s = child.state
            if early and problem.is_goal(s):
                return child
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child
                frontier.add(child)
    return failure


def _dfs(problem):
    frontier = LIFOQueue([Node(problem.initial)])
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        elif not is_cycle(node):
            for child in expand(problem, node):
                frontier.append(child)
    return failure


def _show(node):
    return '{} (cost {:g}, {} steps)'.format('-'.join(map(str, path_states(node))), node.path_cost, len(node))


def _problem(edges):
    """GraphProblem S -> G from the user's edges, or an error message."""
    if not isinstance(edges, (list, tuple)) or not edges:
        return 'return a non-empty list of (state, state, cost) edges'
    if len(edges) > 10:
        return f'{len(edges)} edges: keep it small (at most 10)'
    for e in edges:
        if not (isinstance(e, (list, tuple)) and len(e) == 3 and isinstance(e[2], Real) and e[2] > 0):
            return f'{e!r} is not a (state, state, positive cost) edge'
    graph = undirected([tuple(e) for e in edges])
    if 'S' not in graph or 'G' not in graph:
        return "the graph must contain the states 'S' and 'G'"
    problem = GraphProblem('S', 'G', graph)
    if _bfs(problem) is failure:
        return 'G is not reachable from S'
    return problem


def _judge(test):
    def check(edges):
        problem = _problem(edges)
        if isinstance(problem, str):
            return False, problem
        return test(problem)
    return check


def _bfs_vs_ucs(p):
    b, u = _bfs(p), _ucs(p)
    return b.path_cost > u.path_cost, f'BFS: {_show(b)}; UCS: {_show(u)}'


def _dfs_vs_bfs(p):
    d, b = _dfs(p), _bfs(p)
    return len(d) > len(b), f'DFS: {_show(d)}; BFS: {_show(b)}'


def _early_vs_ucs(p):
    e, u = _ucs(p, early=True), _ucs(p)
    return e.path_cost > u.path_cost, f'early-test UCS: {_show(e)}; UCS: {_show(u)}'


TESTS = [
    Test('BFS is not optimal', call=lambda sol: sol.bfs_not_optimal(), check=_judge(_bfs_vs_ucs),
         show='bfs_not_optimal()'),
    Test('DFS does not find the shallowest goal', call=lambda sol: sol.dfs_not_shallowest(),
         check=_judge(_dfs_vs_bfs), show='dfs_not_shallowest()'),
    Test('UCS needs the late goal test', call=lambda sol: sol.ucs_early_goal_test_wrong(),
         check=_judge(_early_vs_ucs), show='ucs_early_goal_test_wrong()'),
]
