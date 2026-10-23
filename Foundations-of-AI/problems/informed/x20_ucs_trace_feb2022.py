TITLE = 'Exam · Feb 2022 · Uniform-cost search with a closed list'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Feb 2022', 'uniform-cost search', 'graph search', 'closed list', 'ties']

STATEMENT = r"""
*Written exam of 17 February 2022 — Problem 2 (Search, 5 points), Question 1.*

Consider the state space below: **S** is the initial state, **G** the goal; each vertex reports $h(n)$ (used in the
next exercise), values on the arcs are step costs (all arcs are **directed**).

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

Apply **Uniform Cost Search**. Conventions of the exam: **graph search** (a closed list of expanded states) ·
goal check when a node is **extracted** from the frontier, not when it is created · ties resolved in
**alphabetical** order.

Write down the order in which the states are visited (including the start and the goal), the returned path and its
cost. Predict every extracted node.
"""

HINTS = [
    'Keep the frontier sorted by g. After A: B 2, D 4, E 9.',
    'D gives a cheaper way to E (g = 5 instead of 9): both E entries stay in the frontier, the cheaper one comes out first.',
    'F and H both reach g = 7: alphabetical order decides. What happens to the old E (g = 9) when it is extracted?',
]

EXPLANATION = r"""
| # | extracted (g) | children | frontier after (g) |
|---|---|---|---|
| 1 | S 0 | A 1 | A1 |
| 2 | A 1 | B 2, D 4, E 9 | B2 D4 E9 |
| 3 | B 2 | C 3 | C3 D4 E9 |
| 4 | C 3 | — | D4 E9 |
| 5 | D 4 | E 5, F 7 | E5 F7 E9 |
| 6 | E 5 | H 7 | F7 H7 E9 |
| 7 | F 7 (tie with H: alphabetical) | G 10 | H7 E9 G10 |
| 8 | H 7 | F 8: F already expanded → dropped | E9 G10 |
| 9 | E 9: already expanded → discarded; **G 10** | goal | |

Official answer: visited **S, A, B, C, D, E, F, H, (F, E), G**; returned path **S → A → D → F → G**, cost **10**.
The states in brackets are the stale copies that come out of the frontier and are thrown away when you check the
closed list only at extraction (then F 8 is also inserted). Here F is dropped already at generation, so only E is
discarded: the sequence of *expanded* states is the same.

**Model answer:** "S, A, B, C, D, E, F, H, G — path S, A, D, F, G — cost 10." UCS is optimal (costs ≥ ε > 0):
it extracts nodes in order of $g$, so the first extracted goal is the cheapest. Notice how E is first reached
through the expensive arc A→E (8) and later through D ($g = 4 + 1 = 5$): the goal test at extraction and the cheaper
duplicate are what make UCS optimal. (The aima `reached` table of the playground behaves the same, except that it
re-expands the stale E 9 instead of discarding it.)
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'ucs', 'graphSearch': 'expanded', 'ties': 'alpha', 'start': 'S', 'goal': 'G',
    'graph': {'directed': True,
              'nodes': {'S': {'x': 3, 'y': 50, 'h': 9}, 'A': {'x': 21, 'y': 50, 'h': 8}, 'B': {'x': 38, 'y': 12, 'h': 9},
                        'C': {'x': 56, 'y': 12, 'h': 10}, 'D': {'x': 38, 'y': 50, 'h': 5}, 'E': {'x': 56, 'y': 86, 'h': 4},
                        'H': {'x': 72, 'y': 86, 'h': 2}, 'F': {'x': 80, 'y': 60, 'h': 3}, 'G': {'x': 97, 'y': 60, 'h': 0}},
              'edges': [['S', 'A', 1], ['A', 'B', 1], ['B', 'C', 1], ['A', 'D', 3], ['A', 'E', 8], ['D', 'F', 3],
                        ['D', 'E', 1], ['E', 'H', 2], ['H', 'F', 1], ['F', 'G', 3]]},
}
