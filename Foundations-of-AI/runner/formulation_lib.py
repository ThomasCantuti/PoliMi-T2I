"""Reference solver for the `formulation` problems: the tests use it to check that
YOUR formulation (actions / result / is_goal) is correct and solvable.

    from formulation_lib import shortest_solution
"""
from collections import deque

from aima import Node, expand, path_actions


def shortest_solution(problem):
    """Breadth-first search over states: the action list of a solution with the
    fewest actions, or None if no goal state is reachable."""
    node = Node(problem.initial)
    if problem.is_goal(node.state):
        return []
    frontier, reached = deque([node]), {node.state}
    while frontier:
        node = frontier.popleft()
        for child in expand(problem, node):
            if problem.is_goal(child.state):
                return path_actions(child)
            if child.state not in reached:
                reached.add(child.state)
                frontier.append(child)
    return None
