TITLE = 'Trace: weighted A* (w = 2)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['weighted A*', 'satisficing', 'f = g + w·h', 'priority queue']

STATEMENT = r"""
Trace **weighted A\*** with **w = 2**, i.e. f(n) = g(n) + 2·h(n) (slides p.236–239), from **S** to **G**:

```text
edges:  S–A 3   A–G 5   S–B 1   B–C 2   C–D 2   D–G 1   C–E 1   E–G 3
h:      S 6   A 4   B 5   C 3   D 1   E 2   G 0
```

**Conventions:** priority queue on f, ties by insertion order (FIFO) · goal test when **selected** ·
children in alphabetical order · graph search with the aima reached table.

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'f(A) = 3 + 2·4 and f(B) = 1 + 2·5: a tie, broken by insertion order.',
    'Doubling h makes the search trust the heuristic more than the cost already paid.',
]

EXPLANATION = r"""
| # | selected (f = g + 2h) | children | frontier |
|---|---|---|---|
| 1 | S 0+12=12 | A 3+8=11, B 1+10=11 | A11 B11 |
| 2 | A 11 (tie, inserted first) | G 8+0=8 | G8 B11 |
| 3 | **G 8** | goal | |

Returns **S → A → G, cost 8** after 2 expansions. Plain A* (w = 1) expands S, B, C, D, E and returns
**S → B → C → D → G, cost 6**. Weighted A* trades optimality for speed: the solution is *satisficing*,
with cost at most w·C* when h is admissible.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'wastar', 'weight': 2, 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 4, 'y': 50, 'h': 6}, 'A': {'x': 45, 'y': 8, 'h': 4}, 'B': {'x': 22, 'y': 84, 'h': 5},
                        'C': {'x': 48, 'y': 70, 'h': 3}, 'D': {'x': 72, 'y': 90, 'h': 1}, 'E': {'x': 72, 'y': 52, 'h': 2},
                        'G': {'x': 96, 'y': 50, 'h': 0}},
              'edges': [['S', 'A', 3], ['A', 'G', 5], ['S', 'B', 1], ['B', 'C', 2], ['C', 'D', 2], ['D', 'G', 1],
                        ['C', 'E', 1], ['E', 'G', 3]]},
}
