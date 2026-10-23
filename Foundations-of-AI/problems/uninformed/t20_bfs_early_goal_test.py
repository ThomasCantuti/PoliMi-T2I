TITLE = 'Trace: BFS with the early goal test'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['BFS', 'early goal test', 'FIFO queue', 'graph search']

STATEMENT = r"""
Same graph as "Trace: breadth-first search" (undirected, all costs 1):

```text
S–A, S–B, S–C, A–D, B–D, B–E, C–F, E–F, D–G, E–G
```

Now use the **early goal test** variant (slides p.131): a child is goal-tested **as soon as it is generated**,
before checking `reached`; the search returns that child immediately.

```python
for child in expand(problem, node):
    if problem.is_goal(child.state):
        return child
    if child.state not in reached: ...
```

**Conventions:** FIFO queue · children in **alphabetical** order · graph search with a reached set.
Predict every selected node, then the returned path and cost.
"""

HINTS = [
    'The order of the first selections is the same as with the late goal test.',
    'Which expansion generates G for the first time? The search stops right there.',
]

EXPLANATION = r"""
Selections: **S, A, B, C, D**. While expanding D its children are A, B (reached) and **G**: the goal test on
generation succeeds and BFS returns **S → A → D → G, cost 3**.

Only 5 expansions instead of 7: the early test saves the whole last level (E and F here). That is why the
variant has complexity O(b^d) instead of O(b^{d+1}). It is safe for BFS because the first time a state is
generated it is already at minimum depth; it would **not** be safe for UCS or A*, where a cheaper path can
still be found later.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'bfs_early', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 5, 'y': 50}, 'A': {'x': 32, 'y': 12}, 'B': {'x': 32, 'y': 50}, 'C': {'x': 32, 'y': 88},
                        'D': {'x': 63, 'y': 12}, 'E': {'x': 63, 'y': 50}, 'F': {'x': 63, 'y': 88}, 'G': {'x': 95, 'y': 50}},
              'edges': [['S', 'A', 1], ['S', 'B', 1], ['S', 'C', 1], ['A', 'D', 1], ['B', 'D', 1], ['B', 'E', 1],
                        ['C', 'F', 1], ['D', 'G', 1], ['E', 'G', 1], ['F', 'E', 1]]},
}
