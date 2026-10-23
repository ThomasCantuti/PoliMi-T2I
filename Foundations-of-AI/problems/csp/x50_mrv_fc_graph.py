TITLE = 'Exam · Jun 2024 · Backtracking with MRV and forward checking'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['exam', 'Jun 2024', 'MRV', 'forward checking', 'backtracking', 'hand simulation']

STATEMENT = r"""
*Written exam of 20 June 2024 — CSPs, Question 3.*

Solve the CSP of the constraint graph below (every edge is a ≠ constraint; the domains are written next to the
nodes) using **backtracking search with the Minimum Remaining Values (MRV) heuristic and forward checking**.
Report the generated tree and, for each node, the updated domains of the unassigned variables; then report the
solution found.

```text
  {1,2}    A ----------- B    {2,3}
           | \         / |
           |  \       /  |
 {1,2,3}   D   \     /   C    {1,2,3}
            \   \   /   /
             \   \ /   /
              `-- E --'
                {1,2}
```

Edges: A–B, A–D, A–E, B–C, B–E, C–E, D–E.

Conventions (from the exam):

- **MRV** = fewest values left in the forward-checked domain; ties → **alphabetical** order.
- Values from the smallest to the largest.
- Forward checking after X = v removes v from every unassigned neighbour of X.

At every step predict the selected variable (click its node), then the values forward checking removes.
"""

HINTS = [
    'At the root A, B and E all have 2 values: the tie goes to A (alphabetical).',
    'A = 1 is a neighbour of B, D and E: which of them contain 1?',
    'After A = 1, E is left with a single value — MRV goes there next, not to B.',
]

EXPLANATION = r"""
| node | domains of the unassigned variables after forward checking |
|---|---|
| A = 1 | B = {2, 3}, C = {1, 2, 3}, D = {2, 3}, E = {2} |
| E = 2 | B = {3}, C = {1, 3}, D = {3} |
| B = 3 (tie with D, alphabetical) | C = {1}, D = {3} |
| C = 1 (tie with D) | D = {3} |
| D = 3 | — |

The tree is a single path, no backtracking: solution **A = 1, B = 3, C = 1, D = 3, E = 2** — the same as the
official one.

MRV is *fail first*: after A = 1 it jumps on E (one value left), and every later choice is forced. With forward
checking keeping the domains up to date, MRV turns this problem into a sequence of forced moves.
"""

VIZ = 'csp'
CONFIG = {
    'variables': ['A', 'B', 'C', 'D', 'E'],
    'domains': {'A': [1, 2], 'B': [2, 3], 'C': [1, 2, 3], 'D': [1, 2, 3], 'E': [1, 2]},
    'constraints': [['A', 'B'], ['A', 'D'], ['A', 'E'], ['B', 'C'], ['B', 'E'], ['C', 'E'], ['D', 'E']],
    'layout': {'A': {'x': 0, 'y': 0, 'chips': 'left'}, 'B': {'x': 260, 'y': 0, 'chips': 'right'},
               'D': {'x': 0, 'y': 120, 'chips': 'left'}, 'C': {'x': 260, 'y': 120, 'chips': 'right'},
               'E': {'x': 130, 'y': 210, 'chips': 'below'}},
    'inference': 'fc', 'varOrder': 'mrv', 'valOrder': 'static',
    'ask': ['var', 'prune'],
}
