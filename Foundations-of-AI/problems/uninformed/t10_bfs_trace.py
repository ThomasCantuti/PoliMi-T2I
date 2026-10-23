TITLE = 'Trace: breadth-first search'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['BFS', 'FIFO queue', 'graph search', 'late goal test']

STATEMENT = r"""
Trace **breadth-first search** (slides p.130) from **S** to **G** on this undirected graph
(all step costs 1):

```text
S–A, S–B, S–C, A–D, B–D, B–E, C–F, E–F, D–G, E–G
```

**Conventions:** FIFO queue · goal test when a node is **selected** (popped) · children in
**alphabetical** order · **graph search** with a reached set (a state is marked reached when generated).

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'Level by level: first S, then all depth-1 nodes (A, B, C), then depth 2, …',
    'G is generated while expanding D, but the goal test happens only when G is popped.',
    'E and F are still in the queue in front of G: they are selected (and expanded) first.',
]

EXPLANATION = r"""
| # | selected | new children | frontier |
|---|---|---|---|
| 1 | S | A B C | A B C |
| 2 | A | D | B C D |
| 3 | B | E (D reached) | C D E |
| 4 | C | F | D E F |
| 5 | D | G | E F G |
| 6 | E | — (G reached) | F G |
| 7 | F | — | G |
| 8 | **G** | goal | |

Returns **S → A → D → G, cost 3** after 7 expansions. With the late goal test BFS expands every node of
depth d−1 = 2 before it pops G; the next exercise performs the goal test at generation instead.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'bfs', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 5, 'y': 50}, 'A': {'x': 32, 'y': 12}, 'B': {'x': 32, 'y': 50}, 'C': {'x': 32, 'y': 88},
                        'D': {'x': 63, 'y': 12}, 'E': {'x': 63, 'y': 50}, 'F': {'x': 63, 'y': 88}, 'G': {'x': 95, 'y': 50}},
              'edges': [['S', 'A', 1], ['S', 'B', 1], ['S', 'C', 1], ['A', 'D', 1], ['B', 'D', 1], ['B', 'E', 1],
                        ['C', 'F', 1], ['D', 'G', 1], ['E', 'G', 1], ['F', 'E', 1]]},
}
