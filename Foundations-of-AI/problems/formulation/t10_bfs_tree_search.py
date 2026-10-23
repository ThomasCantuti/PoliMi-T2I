TITLE = 'Trace: repeated states in tree search (BFS)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['tree search', 'repeated states', 'is_cycle', 'BFS', 'states vs nodes']

STATEMENT = r"""
Run **breadth-first search as a tree-like search** from **S** to **G** on this undirected graph
(all step costs 1):

```text
S–A, S–B, A–B, A–C, B–C, C–G
```

**Conventions**
- frontier: **FIFO queue**; the goal test is done when a node is **selected** (popped);
- children are generated in **alphabetical** order;
- **tree search**: there is no reached table, so the same state can appear in many tree nodes.
  A child is dropped only if its state already appears **on its own path** (`is_cycle`).

Click, step by step, the node that is selected next (in the graph, the search tree or the frontier).
At the end, pick the path that is returned and its cost.
"""

HINTS = [
    'A search-tree node is a *path*: B reached as S→B and B reached as S→A→B are two different nodes.',
    'Only drop a child whose state is already an ancestor of it; a state that is merely "seen before" elsewhere stays.',
    'FIFO: always take the oldest node in the queue, even if its state was already expanded in another branch.',
]

EXPLANATION = r"""
Selections (the path of each node in brackets):

| # | selected | frontier after the step |
|---|---|---|
| 1 | S | A(S) B(S) |
| 2 | A(S) | B(S) B(SA) C(SA) |
| 3 | B(S) | B(SA) C(SA) A(SB) C(SB) |
| 4 | B(SA) | C(SA) A(SB) C(SB) C(SAB) |
| 5 | C(SA) | A(SB) C(SB) C(SAB) B(SAC) G(SAC) |
| 6 | A(SB) | C(SB) C(SAB) B(SAC) G(SAC) C(SBA) |
| 7 | C(SB) | … A(SBC) G(SBC) |
| 8 | C(SAB) | … G(SABC) |
| 9 | B(SAC) | all its children are on its path → dropped |
| 10 | **G(SAC)** | goal test succeeds |

It returns **S → A → C → G, cost 3** after **9 expansions**: B is expanded three times and C three times,
because without a reached table every new path to a state creates a new node. With **graph search**
(next exercise) the same problem needs only 4 expansions. This is the "states vs nodes" distinction of the
slides: a finite state space can produce a much bigger (even infinite) search tree.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'bfs', 'graphSearch': False, 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 5, 'y': 50}, 'A': {'x': 35, 'y': 15}, 'B': {'x': 35, 'y': 85},
                        'C': {'x': 65, 'y': 50}, 'G': {'x': 95, 'y': 50}},
              'edges': [['S', 'A', 1], ['S', 'B', 1], ['A', 'B', 1], ['A', 'C', 1], ['B', 'C', 1], ['C', 'G', 1]]},
}
