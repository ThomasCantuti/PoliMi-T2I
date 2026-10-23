TITLE = 'Trace: greedy best-first search'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['greedy best-first', 'heuristic', 'priority queue', 'not optimal']

STATEMENT = r"""
Trace **greedy best-first search** (f(n) = h(n), slides p.179 and the code of p.186) from **S** to **G**:

```text
edges:  S–A 3   S–B 2   A–C 4   A–D 3   B–D 2   B–E 6   C–G 6   D–G 4   E–G 2
h:      S 8   A 5   B 6   C 3   D 4   E 2   G 0
```

**Conventions:** priority queue on **h**, ties by insertion order (FIFO) · goal test when **selected** ·
children in **alphabetical** order · graph search with the aima reached table.

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'Greedy looks only at h: the cost already paid (g) plays no role in the choice.',
    'After S, compare h(A)=5 and h(B)=6.',
    'Compare the returned cost with the path through B and D.',
]

EXPLANATION = r"""
| # | selected (h) | children | frontier (h) |
|---|---|---|---|
| 1 | S 8 | A 5, B 6 | A5 B6 |
| 2 | A 5 | C 3, D 4 | C3 D4 B6 |
| 3 | C 3 | G 0 | G0 D4 B6 |
| 4 | **G 0** | goal | |

Returns **S → A → C → G, cost 13** after only 3 expansions, but the optimal path S → B → D → G costs **8**.
Greedy best-first is fast when h is informative, yet **not optimal**: it ignores g, so the expensive edges
A–C (4) and C–G (6) do not slow it down. Run A* on the same graph in the next exercise.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'greedy', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 4, 'y': 50, 'h': 8}, 'A': {'x': 30, 'y': 14, 'h': 5}, 'B': {'x': 30, 'y': 86, 'h': 6},
                        'C': {'x': 58, 'y': 6, 'h': 3}, 'D': {'x': 62, 'y': 58, 'h': 4}, 'E': {'x': 78, 'y': 92, 'h': 2},
                        'G': {'x': 96, 'y': 42, 'h': 0}},
              'edges': [['S', 'A', 3], ['S', 'B', 2], ['A', 'C', 4], ['A', 'D', 3], ['B', 'D', 2], ['B', 'E', 6],
                        ['C', 'G', 6], ['D', 'G', 4], ['E', 'G', 2]]},
}
