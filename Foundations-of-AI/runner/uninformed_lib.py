"""Helpers for the uninformed-search problems (used by the tests; you may import them too).

    from uninformed_lib import CountingProblem, BFS_TREE, DFS_TREE, FULL_TREE
"""
from aima import GraphProblem, Node, directed, path_states, failure, cutoff


class CountingProblem(GraphProblem):
    """A GraphProblem that records what a search algorithm does with it:
        expanded   - states of the expanded nodes (expand(problem, node) calls actions()), in order
        generated  - states of the generated child nodes (expand calls result()), in order
        goal_tests - states passed to problem.is_goal(), in order
    """

    def __init__(self, initial, goal, graph, h_table=None):
        super().__init__(initial, goal, graph, h_table)
        self.expanded, self.generated, self.goal_tests = [], [], []

    def actions(self, state):
        self.expanded.append(state)
        return super().actions(state)

    def result(self, state, action):
        s1 = super().result(state, action)
        self.generated.append(s1)
        return s1

    def is_goal(self, state):
        self.goal_tests.append(state)
        return super().is_goal(state)


def tree(children):
    """{parent: [children]} -> directed graph with unit step costs."""
    return directed([(p, c, 1) for p, cs in children.items() for c in cs])


# The trees drawn in the slides (children are listed left to right = numeric order).
BFS_TREE = tree({1: [2, 3], 2: [4, 5], 3: [6, 7], 4: [8, 9], 5: [10, 11], 6: [12, 13]})  # p. 124-128
DFS_TREE = tree({1: [2, 3], 2: [4, 5], 4: [6, 7], 3: [8, 9], 8: [11, 12], 11: [13, 14]})  # p. 141-143
FULL_TREE = tree({i: [2 * i, 2 * i + 1] for i in range(1, 8)})  # complete binary tree, depth 3 (p. 157-159)


def describe(node):
    """Human-readable search result."""
    if node is failure:
        return 'failure'
    if node is cutoff:
        return 'cutoff'
    if isinstance(node, Node):
        return 'path {} (cost {:g})'.format(' → '.join(map(str, path_states(node))), node.path_cost)
    return repr(node)


def expect(path=None, cost=None, result=None):
    """Build a check= function: the returned node must follow `path` (and cost `cost`),
    or be the sentinel `result` (failure / cutoff)."""
    def check(got, *args):
        if not isinstance(got, Node):  # failure and cutoff are Nodes too
            return False, 'Return the solution Node (or failure / cutoff), not a {}.'.format(type(got).__name__)
        if result is not None:
            return got is result, 'you returned ' + describe(got)
        if got is failure or got is cutoff:
            return False, 'you returned {}, but a solution exists: {}'.format(describe(got), ' → '.join(map(str, path)))
        ok = path_states(got) == list(path) and (cost is None or got.path_cost == cost)
        return ok, 'you returned ' + describe(got)
    return check
