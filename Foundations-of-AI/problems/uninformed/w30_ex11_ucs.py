TITLE = 'Exercise book 1.1 · Uniform-cost search with elimination of repeated states'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exercise book', 'UCS', 'graph search', 'expanded list', 'optimality']

STATEMENT = r"""
*Exercise book (Restelli, Gatti, Papini, Metelli), Exercise 1.1 — part 3.*

Directed state space with step costs; **A** is the initial state and **L** the goal:

```text
A → B 1   A → E 3   A → F 3   B → C 1   C → D 1   D → B 1
E → A 1   E → F 2   E → G 4   F → H 1   G → F 3   G → I 1
G → L 3   H → G 2   H → I 2   L → E 2   L → I 1
```

Solve the problem with **uniform-cost search with elimination of repeated states**. Did it find a solution? Of
what cost? Was it optimal? How many goal tests were performed?

**Conventions**
- goal test at **selection**; ties on $ broken in **lexicographic** order;
- the book keeps, for each repeated state, only the node with the **smallest path cost** (a worse duplicate is
  dropped as soon as it is generated, a better one replaces the worse one). The visualizer replays it with an
  **expanded list**: a child whose state was already expanded is dropped, and a worse duplicate left in the
  frontier is discarded (not goal-tested, not expanded) when it is popped. The sequence of **expanded** nodes and
  the result are the same as in the book.

Predict every expanded node (discarded duplicates are skipped automatically), then the returned path and its cost.
"""

HINTS = [
    'After A: B (1), E (3), F (3). D also reaches g = 3 later: D, E, F are then expanded in alphabetical order.',
    'G is first generated via E with g = 7, then via H with g = 6: the cheaper one wins.',
    'L is generated with g = 9 when G (6) is expanded; it is selected only after every node with g < 9.',
]

EXPLANATION = r"""
| # | expanded (g) | children (g) | note |
|---|---|---|---|
| 1 | A 0 | B 1, E 3, F 3 | |
| 2 | B 1 | C 2 | |
| 3 | C 2 | D 3 | |
| 4 | D 3 | — | B already expanded |
| 5 | E 3 | F 5, G 7 | F 5 is worse than F 3 (book: dropped at once) |
| 6 | F 3 | H 4 | |
| 7 | H 4 | G 6, I 6 | G 6 replaces G 7 |
| 8 | G 6 | I 7, L 9 | I 7 worse than I 6 |
| 9 | I 6 | — | |
| 10 | **L 9** | goal | |

Solution **A → F → H → G → L, cost 3 + 1 + 2 + 3 = 9: found and optimal** (UCS always is, with positive step
costs). The book counts **10 goal tests** and 11 generated nodes, with at most 10 in memory because the G (7) node
is eliminated when G (6) appears. Compare with BFS (A → E → G → L, cost 10, 10 goal tests) and the two DFS
versions (cost 10 and 11).

> **Exam trap:** for UCS the repeated-state check must keep the **cheapest** node: a plain set of generated states
> (as in BFS/DFS) would keep G with  = 7$ and return A → E → G → L (cost 10).
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'ucs', 'graphSearch': 'expanded', 'ties': 'alpha', 'start': 'A', 'goal': 'L',
    'graph': {'directed': True,
              'nodes': {'E': {'x': 50, 'y': 8}, 'L': {'x': 80, 'y': 8}, 'B': {'x': 20, 'y': 50}, 'A': {'x': 42, 'y': 50},
                        'G': {'x': 66, 'y': 50}, 'I': {'x': 95, 'y': 50}, 'D': {'x': 5, 'y': 92}, 'C': {'x': 30, 'y': 92},
                        'F': {'x': 50, 'y': 92}, 'H': {'x': 80, 'y': 92}},
              'edges': [['A', 'B', 1], ['A', 'E', 3], ['A', 'F', 3], ['E', 'A', 1], ['E', 'F', 2], ['E', 'G', 4],
                        ['L', 'E', 2], ['G', 'L', 3], ['L', 'I', 1], ['G', 'I', 1], ['G', 'F', 3], ['H', 'G', 2],
                        ['H', 'I', 2], ['F', 'H', 1], ['B', 'C', 1], ['C', 'D', 1], ['D', 'B', 1]]},
}
