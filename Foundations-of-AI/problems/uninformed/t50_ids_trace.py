TITLE = 'Trace: iterative deepening search'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['IDS', 'depth-limited search', 'LIFO stack', 'cutoff']

STATEMENT = r"""
Trace **iterative deepening search** from **S** to **G** on this undirected graph (all costs 1):

```text
S–A, S–B, A–C, A–D, B–E, C–G, E–G
```

IDS runs depth-limited search with **L = 0, 1, 2, …** (as drawn in slides p.157–159; the aima code
starts at 1, which only skips the trivial L = 0 round). Depth-limited search (slides p.153):

```python
node = frontier.pop()
if problem.is_goal(node.state): return node
elif len(node) >= limit:        result = cutoff     # goal-tested, not expanded
elif not is_cycle(node):        push the children
```

**Conventions:** LIFO stack · alphabetically-first child expanded first · tree search with `is_cycle`.
Predict every selected node (the tree is rebuilt from scratch at each new limit), then the result.
"""

HINTS = [
    'With L = 1 the root is expanded, its children are goal-tested but not expanded.',
    'Each round restarts from S: the first selection of every round is S.',
    'G is at depth 3: which limit is the first one that can find it?',
]

EXPLANATION = r"""
| L | selected nodes (greyed = at the limit, not expanded) | result |
|---|---|---|
| 0 | S | cutoff |
| 1 | S, A, B | cutoff |
| 2 | S, A, C, D, B, E | cutoff |
| 3 | S, A, C, **G** | found |

Returns **S → A → C → G, cost 3**. IDS is complete and optimal for unit costs (like BFS) with the memory of
DFS (O(bd)). Regenerating the upper levels costs little: most nodes are in the deepest level.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'ids', 'idsStart': 0, 'childOrder': 'alpha', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 5, 'y': 50}, 'A': {'x': 35, 'y': 18}, 'B': {'x': 35, 'y': 82}, 'C': {'x': 65, 'y': 8},
                        'D': {'x': 65, 'y': 40}, 'E': {'x': 65, 'y': 82}, 'G': {'x': 95, 'y': 30}},
              'edges': [['S', 'A', 1], ['S', 'B', 1], ['A', 'C', 1], ['A', 'D', 1], ['B', 'E', 1], ['C', 'G', 1], ['E', 'G', 1]]},
}
