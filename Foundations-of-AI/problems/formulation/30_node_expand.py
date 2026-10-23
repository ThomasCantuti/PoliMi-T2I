from harness import Test
from aima import GraphProblem, EightPuzzle, Node, directed

TITLE = 'Search nodes: child_node, expand, path'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['search tree', 'node', 'expand', 'states vs nodes']

STATEMENT = r"""
A **node** of the search tree is not a state: it is a *path* to a state (slides p. 95–97).

```python
class Node:                                    # already in aima (len(node) = depth)
    def __init__(self, state, parent=None, action=None, path_cost=0): ...
```

Write the node functions yourself (slides p. 101–102, AIMA Fig. 3.7):

- `child_node(problem, node, action)`: the node reached by doing `action` in `node.state`;
  its path cost is `node.path_cost + problem.action_cost(s, action, s1)`;
- `expand(problem, node)`: the **list** of child nodes, one per action in `problem.actions(node.state)`, in that order;
- `path_actions(node)` and `path_states(node)`: the actions / states from the root to `node`.

```text
graph:  S --2--> A --3--> G        expand(problem, root) → [<A>, <B>]
        S --1--> B --5--> G        path_states(<G> via A) → ['S', 'A', 'G'],  path_cost 5
```
"""

STARTER = '''from typing import Any

from aima import Node, Problem

def child_node(problem: Problem, node: Node, action: Any) -> Node:
    # TODO: compute the next state and its path cost
    return None


def expand(problem: Problem, node: Node) -> list[Node]:
    # TODO: one child node for each action applicable in node.state
    return []


def path_actions(node: Node) -> list:
    # TODO: follow the parent pointers back to the root
    return []


def path_states(node: Node) -> list:
    # TODO
    return []
'''

SOLUTION = '''from typing import Any

from aima import Node, Problem

def child_node(problem: Problem, node: Node, action: Any) -> Node:
    s = node.state
    s1 = problem.result(s, action)
    cost = node.path_cost + problem.action_cost(s, action, s1)
    return Node(s1, node, action, cost)


def expand(problem: Problem, node: Node) -> list[Node]:
    return [child_node(problem, node, action) for action in problem.actions(node.state)]


def path_actions(node: Node) -> list:
    actions: list = []
    while node.parent is not None:
        actions.append(node.action)
        node = node.parent
    return actions[::-1]


def path_states(node: Node) -> list:
    states: list = []
    while node is not None:
        states.append(node.state)
        node = node.parent
    return states[::-1]
'''

HINTS = [
    'A child node records four things: the new state, its parent (the node you expanded), the action, '
    'and the accumulated path cost.',
    '`s1 = problem.result(node.state, action)`; `cost = node.path_cost + problem.action_cost(node.state, action, s1)`.',
    'For the paths, walk up with `node = node.parent` until `None`, collecting states/actions, then reverse.',
]

EXPLANATION = r"""
`expand` is where the **problem formulation** meets the **search algorithm**: it is the only place that
calls `actions`, `result` and `action_cost`. Everything else (frontier, `reached`, strategy) works
on nodes.

The last test is the key idea of slides p. 95–96: after expanding twice, the root state of the 8-puzzle
appears again — as a **different node**, with depth 2 and path cost 2. One state, many nodes: the search
tree can be infinite even though the state space is finite. A node stores the whole path (through the
parent pointers), so `path_states` costs $O(d)$ and the solution is read back from the goal node.
"""

ENTRY = 'expand'

_G = directed([('S', 'A', 2), ('S', 'B', 1), ('A', 'G', 3), ('B', 'G', 5)])


def _children(sol):
    p = GraphProblem('S', 'G', _G)
    return [(c.state, c.action, c.path_cost, c.parent.state) for c in sol.expand(p, Node('S'))]


def _goal_node(sol, first):
    p = GraphProblem('S', 'G', _G)
    a = [c for c in sol.expand(p, Node('S')) if c.state == first][0]
    return sol.expand(p, a)[0]


def _path(sol, first):
    g = _goal_node(sol, first)
    return sol.path_states(g), sol.path_actions(g), g.path_cost, len(g)


def _child_node(sol):
    p = GraphProblem('S', 'G', _G)
    c = sol.child_node(p, Node('S'), 'B')
    return c.state, c.action, c.path_cost, c.parent.state


def _repeated(sol):
    p = EightPuzzle((8, 2, 0, 3, 4, 7, 5, 1, 6))
    root = Node(p.initial)
    for child in sol.expand(p, root):
        for grandchild in sol.expand(p, child):
            if grandchild.state == root.state:
                if grandchild is root:
                    return False, 'expand must create NEW nodes'
                return True, (f'state {root.state} again, as a new node at depth {len(grandchild)} '
                              f'with path cost {grandchild.path_cost}')
    return False, 'no grandchild has the initial state: is result() applied to the right state?'


TESTS = [
    Test('child_node', call=_child_node, expected=('B', 'B', 1, 'S'), show="child_node(problem, <S>, 'B')"),
    Test('expand the root', call=_children, expected=[('A', 'A', 2, 'S'), ('B', 'B', 1, 'S')],
         show='children of S: (state, action, path_cost, parent)'),
    Test('path through A', call=lambda sol: _path(sol, 'A'), expected=(['S', 'A', 'G'], ['A', 'G'], 5, 2),
         show='(path_states, path_actions, path_cost, depth) of G reached via A'),
    Test('path through B (costs add up)', call=lambda sol: _path(sol, 'B'),
         expected=(['S', 'B', 'G'], ['B', 'G'], 6, 2), show='G reached via B'),
    Test('root paths', call=lambda sol: (sol.path_states(Node('S')), sol.path_actions(Node('S'))),
         expected=(['S'], []), show='path_states(<S>), path_actions(<S>)'),
    Test('expanding a dead end', call=lambda sol: list(sol.expand(GraphProblem('S', 'G', _G), Node('G'))),
         expected=[], show='G has no outgoing arcs'),
    Test('8-puzzle: one state, many nodes', call=_repeated, check=lambda got: got,
         show='expand the slides\' initial state twice'),
]
