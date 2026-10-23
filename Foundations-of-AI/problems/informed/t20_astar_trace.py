TITLE = 'Trace: A* search (ties and a reached-table update)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['A*', 'f = g + h', 'priority queue', 'reached table', 'ties', 'optimality']

STATEMENT = r"""
Trace **A\*** (f(n) = g(n) + h(n), slides p.193–194) on the same graph as the greedy exercise,
from **S** to **G**:

```text
edges:  S–A 3   S–B 2   A–C 4   A–D 3   B–D 2   B–E 6   C–G 6   D–G 4   E–G 2
h:      S 8   A 5   B 6   C 3   D 4   E 2   G 0
```

**Conventions (aima `best_first_search`):** priority queue on **f**, ties by **insertion order** (FIFO) ·
goal test when **selected** · children in **alphabetical** order · reached table: a child is added if its state
is new or its g is strictly lower (the old frontier entry stays in the queue).

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'f(A) = 3 + 5 and f(B) = 2 + 6: a tie. A entered the frontier first.',
    'D is first reached via A with g = 6; later via B with g = 4, which is cheaper.',
    'With f = 8 the goal G ties with nothing smaller: compare all frontier values.',
]

EXPLANATION = r"""
| # | selected (g+h=f) | children | frontier (f) |
|---|---|---|---|
| 1 | S 0+8=8 | A 3+5=8, B 2+6=8 | A8 B8 |
| 2 | A 8 (tie, inserted first) | C 7+3=10, D 6+4=10 | B8 C10 D10 |
| 3 | B 8 | D 4+4=8 (cheaper than g=6: reached updated), E 8+2=10 | D8 C10 D10 E10 |
| 4 | D 8 | G 8+0=8 | G8 C10 D10 E10 |
| 5 | **G 8** | goal | |

Returns **S → B → D → G, cost 8** = the optimal cost. h is admissible (never above the true cost) and
consistent, so A* is optimal and every f along the optimal path stays ≤ C* = 8; nodes with f > 8
(C, E and the stale D) are never expanded. Compare with greedy (cost 13).
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'astar', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 4, 'y': 50, 'h': 8}, 'A': {'x': 30, 'y': 14, 'h': 5}, 'B': {'x': 30, 'y': 86, 'h': 6},
                        'C': {'x': 58, 'y': 6, 'h': 3}, 'D': {'x': 62, 'y': 58, 'h': 4}, 'E': {'x': 78, 'y': 92, 'h': 2},
                        'G': {'x': 96, 'y': 42, 'h': 0}},
              'edges': [['S', 'A', 3], ['S', 'B', 2], ['A', 'C', 4], ['A', 'D', 3], ['B', 'D', 2], ['B', 'E', 6],
                        ['C', 'G', 6], ['D', 'G', 4], ['E', 'G', 2]]},
}
