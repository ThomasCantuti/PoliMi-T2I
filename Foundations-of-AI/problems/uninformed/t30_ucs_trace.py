TITLE = 'Trace: uniform-cost search (ties and updates)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['UCS', 'priority queue', 'reached table', 'ties', 'optimality']

STATEMENT = r"""
Trace **uniform-cost search** (best-first search with f = g, slides p.135 and the code of p.186)
from **S** to **G**:

```text
S–A 1   S–B 2   A–C 2   B–C 1   A–G 9   C–D 3   D–G 2   B–E 4   E–G 1
```

**Conventions (aima `best_first_search`)**
- priority queue on **g**; ties broken by **insertion order** (FIFO), like `aima.PriorityQueue`;
- goal test when a node is **selected**;
- children in **alphabetical** order;
- reached table: a child is added if its state is new **or** its g is **strictly lower** than the
  reached one (the old frontier entry is not removed).

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'C is reached via A with g=3 and via B with g=3: not strictly cheaper, so the second one is skipped.',
    'G first enters the frontier with g=10 (via A). Keep looking: a cheaper G may appear later.',
    'D and E both have g=6: which one entered the frontier first?',
]

EXPLANATION = r"""
| # | selected (g) | children | frontier (g) |
|---|---|---|---|
| 1 | S 0 | A 1, B 2 | A1 B2 |
| 2 | A 1 | C 3, G 10 | B2 C3 G10 |
| 3 | B 2 | C 3 not < 3 → skip; E 6 | C3 E6 G10 |
| 4 | C 3 | D 6 | E6 D6 G10 |
| 5 | E 6 (tie, inserted before D) | G 7 < 10 → reached updated | D6 G7 G10 |
| 6 | D 6 | G 8 not < 7 → skip | G7 G10 |
| 7 | **G 7** | goal | |

Returns **S → B → E → G, cost 7**. UCS returns the optimal path because it selects nodes in order of g
and the goal test is done on selection: when G (g=7) is popped, every cheaper path has already been
explored. An early goal test would have wrongly returned S → A → G (cost 10).
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'ucs', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 4, 'y': 50}, 'A': {'x': 28, 'y': 10}, 'B': {'x': 28, 'y': 88}, 'C': {'x': 50, 'y': 50},
                        'D': {'x': 72, 'y': 44}, 'E': {'x': 62, 'y': 92}, 'G': {'x': 96, 'y': 30}},
              'edges': [['S', 'A', 1], ['S', 'B', 2], ['A', 'C', 2], ['B', 'C', 1], ['A', 'G', 9], ['C', 'D', 3],
                        ['D', 'G', 2], ['B', 'E', 4], ['E', 'G', 1]]},
}
