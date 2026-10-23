TITLE = 'Trace: IDA* (iterative deepening A*)'
DIFFICULTY = 'hard'
KIND = 'trace'
TAGS = ['IDA*', 'f-cutoff', 'depth-first', 'memory']

STATEMENT = r"""
Trace **IDA\*** (slides p.241–254) from **S** to **G**:

```text
edges:  S–A 1   S–B 2   A–C 2   B–D 1   C–G 3   D–G 3
h:      S 4   A 3   B 3   C 2   D 1   G 0
```

```text
cutoff = f(root)
repeat
  1. depth-first search, expanding only nodes with f(n) = g(n) + h(n) ≤ cutoff
  2. cutoff = smallest f among the nodes that exceeded it
until a solution is found
```

**Conventions:** depth-first with a LIFO stack, alphabetically-first child first · tree search with
`is_cycle` · a child with f > cutoff is generated but **pruned** (it only sets the next cutoff) · goal test
when a node is **selected**.

Predict every selected node and each new cutoff, then the returned path and cost.
"""

HINTS = [
    'The first cutoff is f(S) = 0 + 4.',
    'Within a round, children with f > cutoff are not pushed; remember the smallest of their f values.',
    'Every round restarts from S: IDA* keeps no memory between rounds except the cutoff.',
]

EXPLANATION = r"""
| cutoff | selected nodes | pruned (f) | next cutoff |
|---|---|---|---|
| 4 | S, A | B (5), C (5) | 5 |
| 5 | S, A, C, B, D | G via C (6), G via D (6) | 6 |
| 6 | S, A, C, **G** | — | found |

Returns **S → A → C → G, cost 6** (optimal; S → B → D → G also costs 6 but A comes first).
IDA* uses only the memory of a depth-first search, at the price of regenerating the tree at every new
cutoff: 10 expansions here versus 5 for A*.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'idastar', 'childOrder': 'alpha', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 4, 'y': 50, 'h': 4}, 'A': {'x': 35, 'y': 16, 'h': 3}, 'B': {'x': 35, 'y': 84, 'h': 3},
                        'C': {'x': 66, 'y': 16, 'h': 2}, 'D': {'x': 66, 'y': 84, 'h': 1}, 'G': {'x': 96, 'y': 50, 'h': 0}},
              'edges': [['S', 'A', 1], ['S', 'B', 2], ['A', 'C', 2], ['B', 'D', 1], ['C', 'G', 3], ['D', 'G', 3]]},
}
