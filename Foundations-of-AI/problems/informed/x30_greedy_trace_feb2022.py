TITLE = 'Exam · Feb 2022 · Greedy best-first search on the same graph'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['exam', 'Feb 2022', 'greedy best-first', 'graph search', 'not optimal']

STATEMENT = r"""
*Written exam of 17 February 2022 — Problem 2 (Search, 5 points), Question 2.*

Same state space as the previous exercise: **S** initial state, **G** goal, $h(n)$ in brackets, directed arcs with
step costs.

```text
                   B(9) --1--> C(10)
                   ^
                   |1
   S(9) --1--> A(8) --3--> D(5) ------------3-----------> F(3) --3--> G(0)
                     \         \                           ^
                      \8        \1                         |1
                       \         v                         |
                        `-----> E(4) --2--> H(2) ----------'

   S→A 1   A→B 1   A→D 3   A→E 8   B→C 1   D→E 1   D→F 3   E→H 2   H→F 1   F→G 3
```

Apply **Best-First Greedy Search** ($f(n) = h(n)$). Conventions of the exam: **graph search** (closed list) · goal
check when a node is **extracted** from the frontier · ties in **alphabetical** order.

Write down the visited states (including start and goal), the returned path and its cost. Predict every extracted
node.
"""

HINTS = [
    'Only h matters: after A the frontier holds B 9, D 5, E 4.',
    'Greedy does not care that the arc A→E costs 8.',
]

EXPLANATION = r"""
| # | extracted (h) | children | frontier after (h) |
|---|---|---|---|
| 1 | S 9 | A 8 | A8 |
| 2 | A 8 | B 9, D 5, E 4 | E4 D5 B9 |
| 3 | E 4 | H 2 | H2 D5 B9 |
| 4 | H 2 | F 3 | F3 D5 B9 |
| 5 | F 3 | G 0 | G0 D5 B9 |
| 6 | **G 0** | goal | |

**Model answer** (official): visited **S, A, E, H, F, G**; returned path **S → A → E → H → F → G**; cost
1 + 8 + 2 + 1 + 3 = **15**, against the optimal 10 found by uniform-cost search. Greedy expands only 5 nodes, but it
ignores $g$: E has the smallest $h$, so it is reached through the expensive arc A→E ($g = 9$), although the
route through D reaches it with $g = 5$.
Greedy best-first search is **not optimal** (and complete only on finite graphs with repeated-state checking).
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'greedy', 'graphSearch': 'expanded', 'ties': 'alpha', 'start': 'S', 'goal': 'G',
    'graph': {'directed': True,
              'nodes': {'S': {'x': 3, 'y': 50, 'h': 9}, 'A': {'x': 21, 'y': 50, 'h': 8}, 'B': {'x': 38, 'y': 12, 'h': 9},
                        'C': {'x': 56, 'y': 12, 'h': 10}, 'D': {'x': 38, 'y': 50, 'h': 5}, 'E': {'x': 56, 'y': 86, 'h': 4},
                        'H': {'x': 72, 'y': 86, 'h': 2}, 'F': {'x': 80, 'y': 60, 'h': 3}, 'G': {'x': 97, 'y': 60, 'h': 0}},
              'edges': [['S', 'A', 1], ['A', 'B', 1], ['B', 'C', 1], ['A', 'D', 3], ['A', 'E', 8], ['D', 'F', 3],
                        ['D', 'E', 1], ['E', 'H', 2], ['H', 'F', 1], ['F', 'G', 3]]},
}
