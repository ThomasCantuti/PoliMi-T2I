TITLE = 'Exercise book 1.1 · DFS optimized for space (ancestor check only)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exercise book', 'DFS', 'tree search', 'is_cycle', 'memory']

STATEMENT = r"""
*Exercise book (Restelli, Gatti, Papini, Metelli), Exercise 1.1 — DFS "optimized for space".*

Directed state space with step costs; **A** is the initial state and **L** the goal:

```text
A → B 1   A → E 3   A → F 3   B → C 1   C → D 1   D → B 1
E → A 1   E → F 2   E → G 4   F → H 1   G → F 3   G → I 1
G → L 3   H → G 2   H → I 2   L → E 2   L → I 1
```

The appeal of DFS is its low memory. To avoid storing a closed list, a new node is discarded only if one of
its **ancestors** has the same state (the course's `is_cycle` check). Run this depth-first search. Which
solution does it find, of what cost, and how many goal tests are performed?

**Conventions of the book:** goal test at **selection**; ties in lexicographic order (the alphabetically
first child is expanded first).

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'The first branch A → B → C → D ends when D generates B, which is its own ancestor.',
    'Under E, the child F is now kept: F is not an ancestor of E (it is only a sibling of E).',
    'H generates G (and I): G is not on the path A → E → F → H, so it is expanded here.',
]

EXPLANATION = r"""
| # | selected (path) | children kept | discarded (ancestor) |
|---|---|---|---|
| 1 | A | B, E, F | — |
| 2 | B (A B) | C | — |
| 3 | C (A B C) | D | — |
| 4 | D (A B C D) | — | B |
| 5 | E (A E) | F, G | A |
| 6 | F (A E F) | H | — |
| 7 | H (A E F H) | G, I | — |
| 8 | G (A E F H G) | I, L | F |
| 9 | I | — | — |
| 10 | **L** | goal | |

Solution **A → E → F → H → G → L, cost 3 + 2 + 1 + 2 + 3 = 11**: not optimal (optimum 9) and worse than the
version with the closed list (cost 10). **10 goal tests**; the book counts 13 generated nodes but at most **9 in
memory** at the same time. Without the closed list memory stays (bm)$, but the same state can be explored
several times along different paths (G, I and F appear more than once in the tree).
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'dfs', 'graphSearch': False, 'childOrder': 'alpha', 'start': 'A', 'goal': 'L',
    'graph': {'directed': True,
              'nodes': {'E': {'x': 50, 'y': 8}, 'L': {'x': 80, 'y': 8}, 'B': {'x': 20, 'y': 50}, 'A': {'x': 42, 'y': 50},
                        'G': {'x': 66, 'y': 50}, 'I': {'x': 95, 'y': 50}, 'D': {'x': 5, 'y': 92}, 'C': {'x': 30, 'y': 92},
                        'F': {'x': 50, 'y': 92}, 'H': {'x': 80, 'y': 92}},
              'edges': [['A', 'B', 1], ['A', 'E', 3], ['A', 'F', 3], ['E', 'A', 1], ['E', 'F', 2], ['E', 'G', 4],
                        ['L', 'E', 2], ['G', 'L', 3], ['L', 'I', 1], ['G', 'I', 1], ['G', 'F', 3], ['H', 'G', 2],
                        ['H', 'I', 2], ['F', 'H', 1], ['B', 'C', 1], ['C', 'D', 1], ['D', 'B', 1]]},
}
