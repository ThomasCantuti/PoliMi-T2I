TITLE = 'Trace: graph search with an expanded list (UCS)'
DIFFICULTY = 'hard'
KIND = 'trace'
TAGS = ['graph search', 'expanded list', 'closed list', 'repeated states', 'UCS']

STATEMENT = r"""
Run **uniform-cost search** from **S** to **G** on this undirected graph:

```text
S–A 1   S–B 1   A–C 3   B–C 1   B–D 4   C–E 2   D–E 1   E–G 2   C–G 6
```

Use the graph-search variant described in the slides (p.105) with an **expanded list**:

- when a node is **selected**, if its state is already in the expanded list it is **discarded**
  (popped, not goal-tested, not expanded) and the next one is popped;
- otherwise it is goal-tested, its state is added to the expanded list and it is expanded;
- a child whose state is already in the expanded list is dropped; the frontier **may contain several
  nodes for the same state** (no replacement).

**Conventions:** priority queue on g, ties broken **FIFO** (insertion order) · goal test when **selected** ·
children in **alphabetical** order.

Predict which node is **expanded** next (discarded duplicates are skipped automatically), then the result.
"""

HINTS = [
    'C is generated twice: with g=4 (via A) and with g=2 (via B). Both stay in the frontier.',
    'When the C with g=4 comes out, C is already in the expanded list: it is thrown away.',
    'Ties on g are broken by insertion order: the node that entered the frontier first wins.',
]

EXPLANATION = r"""
| # | expanded | children added | frontier (g) |
|---|---|---|---|
| 1 | S (0) | A 1, B 1 | A1 B1 |
| 2 | A (1) | C 4 | B1 C4 |
| 3 | B (1) | C 2, D 5 | C2 C4 D5 |
| 4 | C (2) | E 4, G 8 | C4 E4 D5 G8 |
| 5 | pop C (4): already expanded → discarded; **E (4)** | D 5, G 6 | D5 D5 G6 G8 |
| 6 | D (5, via B) | B, E already expanded | D5 G6 G8 |
| 7 | pop D (5, via E): discarded; **G (6)** | goal | |

Returns **S → B → C → E → G, cost 6** (optimal). The expanded list is the "closed set" view of graph
search: duplicates are allowed in the frontier and filtered when they are popped. The aima
`best_first_search` instead keeps a *reached table* and only re-adds a state when the new path is cheaper.
Both are correct for UCS; they differ with inconsistent heuristics (see the informed exercises).
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'ucs', 'graphSearch': 'expanded', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 5, 'y': 50}, 'A': {'x': 30, 'y': 15}, 'B': {'x': 30, 'y': 85}, 'C': {'x': 58, 'y': 15},
                        'D': {'x': 58, 'y': 85}, 'E': {'x': 80, 'y': 50}, 'G': {'x': 97, 'y': 15}},
              'edges': [['S', 'A', 1], ['S', 'B', 1], ['A', 'C', 3], ['B', 'C', 1], ['B', 'D', 4], ['C', 'E', 2],
                        ['D', 'E', 1], ['E', 'G', 2], ['C', 'G', 6]]},
}
