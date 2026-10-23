TITLE = 'Trace: the reached set in graph search (BFS)'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['graph search', 'reached set', 'repeated states', 'BFS']

STATEMENT = r"""
Same graph as the previous exercise (undirected, all costs 1), from **S** to **G**:

```text
S–A, S–B, A–B, A–C, B–C, C–G
```

This time run **BFS as a graph search**, exactly like the course code (slides p.130):

```python
reached = {problem.initial}
...
for child in expand(problem, node):
    if child.state not in reached:
        reached.add(child.state)
        frontier.appendleft(child)
```

**Conventions:** FIFO queue · goal test when a node is **selected** · children in **alphabetical** order ·
a state is added to `reached` as soon as it is **generated**.

Predict each selected node, then the returned path and cost.
"""

HINTS = [
    'A child is added to the frontier only if its state has never been generated before.',
    'reached starts as {S}: S is never added again when it shows up as a child of A or B.',
    'G is generated while expanding C but, with the late goal test, it is returned only when selected.',
]

EXPLANATION = r"""
| # | selected | children | frontier | reached |
|---|---|---|---|---|
| 1 | S | A, B | A B | S A B |
| 2 | A | B (reached), C, S (reached) | B C | + C |
| 3 | B | A, C, S: all reached | C | |
| 4 | C | A, B reached, **G** | G | + G |
| 5 | **G** | goal | | |

Returns **S → A → C → G, cost 3** after **4 expansions** (tree search needed 9). Every state enters the
frontier at most once, so BFS graph search expands at most |S| nodes; the price is the memory for `reached`.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'bfs', 'graphSearch': True, 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 5, 'y': 50}, 'A': {'x': 35, 'y': 15}, 'B': {'x': 35, 'y': 85},
                        'C': {'x': 65, 'y': 50}, 'G': {'x': 95, 'y': 50}},
              'edges': [['S', 'A', 1], ['S', 'B', 1], ['A', 'B', 1], ['A', 'C', 1], ['B', 'C', 1], ['C', 'G', 1]]},
}
