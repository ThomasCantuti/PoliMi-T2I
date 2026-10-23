TITLE = 'Trace: depth-first search (tree search)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['DFS', 'LIFO stack', 'tree search', 'is_cycle', 'not optimal']

STATEMENT = r"""
Trace **depth-first search** (iterative version, slides p.145) from **S** to **G** on this undirected graph
(all costs 1):

```text
S–A, S–B, A–B, A–C, B–D, C–D, C–E, D–G, E–G
```

**Conventions**
- frontier: **LIFO stack**; goal test when a node is **selected**;
- **tree-like search** (no reached table): a child whose state is already on its own path is dropped
  (`is_cycle`);
- children are generated in alphabetical order and pushed so that the **alphabetically-first child is
  expanded first** (as in the hand-traced example of slides p.143).

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'Always continue from the most recently generated node: go deep before going wide.',
    'From S→A the children are B, C (S is on the path). B comes first.',
    'The node B under S is still waiting at the bottom of the stack, but DFS never gets back to it.',
]

EXPLANATION = r"""
| # | selected (path) | stack after (top first) |
|---|---|---|
| 1 | S | A B |
| 2 | A (S→A) | B C B |
| 3 | B (S→A→B) | D C B |
| 4 | D (…→B→D) | C G C B |
| 5 | C (…→D→C) | E G C B |
| 6 | E (…→C→E) | G G C B |
| 7 | **G** (…→E→G) | goal |

Returns **S → A → B → D → C → E → G, cost 6**, while the shallowest path S → B → D → G costs 3:
DFS is **not optimal**. It commits to the first branch and only backtracks at dead ends. Its advantage is
memory: the stack holds one path plus the siblings along it (O(bm)).
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'dfs', 'graphSearch': False, 'childOrder': 'alpha', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 5, 'y': 50}, 'A': {'x': 28, 'y': 15}, 'B': {'x': 28, 'y': 85}, 'C': {'x': 55, 'y': 15},
                        'D': {'x': 55, 'y': 85}, 'E': {'x': 78, 'y': 30}, 'G': {'x': 96, 'y': 70}},
              'edges': [['S', 'A', 1], ['S', 'B', 1], ['A', 'B', 1], ['A', 'C', 1], ['B', 'D', 1], ['C', 'D', 1],
                        ['C', 'E', 1], ['D', 'G', 1], ['E', 'G', 1]]},
}
