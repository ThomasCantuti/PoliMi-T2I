TITLE = 'Trace: A* with an inconsistent heuristic (expanded list)'
DIFFICULTY = 'hard'
KIND = 'trace'
TAGS = ['A*', 'inconsistent heuristic', 'admissible', 'graph search', 'expanded list']

STATEMENT = r"""
A directed graph with an **admissible but inconsistent** heuristic (in the spirit of slides p.227–229):

```text
edges:  S→A 1   S→B 2   A→C 1   B→C 2   C→G 10
h:      S 6   A 10   B 1   C 6   G 0
```

Run **A\*** as **graph search with an expanded list** (slides p.105 and p.228): a selected node whose state
was already expanded is discarded, and a child whose state was already expanded is dropped.

**Conventions:** priority queue on f = g + h, ties FIFO · goal test when **selected** · children in
alphabetical order.

Predict every expanded node, then the returned path and cost. Is it optimal?
"""

HINTS = [
    'Check consistency on the edge A→C: is h(A) ≤ c(A,C) + h(C)?',
    'C is expanded first via B (f = 4 + 6). What happens when A later generates a cheaper C?',
]

EXPLANATION = r"""
| # | expanded (g+h=f) | children | frontier (f) |
|---|---|---|---|
| 1 | S 0+6=6 | A 1+10=11, B 2+1=3 | B3 A11 |
| 2 | B 3 | C 4+6=10 | C10 A11 |
| 3 | C 10 | G 14+0=14 | A11 G14 |
| 4 | A 11 | C (g=2) is already expanded → **dropped** | G14 |
| 5 | **G 14** | goal | |

Returns **S → B → C → G, cost 14**, but S → A → C → G costs **12**. h is admissible (h(A)=10 ≤ h*(A)=11)
but **not consistent**: h(A) = 10 > c(A,C) + h(C) = 1 + 6. C was expanded before its optimal path was known,
and the expanded list throws the better path away.

Fixes: use **tree search** (keep the new node → 2+6=8, then G with 12 is selected first), or the aima
**reached table**, which re-adds a state when a cheaper path is found (try both in the playground).
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'astar', 'graphSearch': 'expanded', 'start': 'S', 'goal': 'G',
    'graph': {'directed': True,
              'nodes': {'S': {'x': 50, 'y': 2, 'h': 6}, 'A': {'x': 15, 'y': 36, 'h': 10}, 'B': {'x': 85, 'y': 36, 'h': 1},
                        'C': {'x': 50, 'y': 64, 'h': 6}, 'G': {'x': 50, 'y': 98, 'h': 0}},
              'edges': [['S', 'A', 1], ['S', 'B', 2], ['A', 'C', 1], ['B', 'C', 2], ['C', 'G', 10]]},
}
