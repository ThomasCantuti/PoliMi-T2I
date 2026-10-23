TITLE = 'Exam · Jun 2023 · Graph from C to F: A* search'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jun 2023', 'A*', 'consistent heuristic', 'ties']

STATEMENT = r"""
*Written exam of 14 June 2023 — Problem 3 (8 points), A* part.*

State space (undirected; numbers are step costs). **C** is the initial state, **F** the goal; each state has
a heuristic value $h$.

```text
C–D 2   C–A 4   A–B 1   A–G 3   A–H 4   B–E 4   D–G 3   E–F 3   E–G 2   E–H 1

h:  A 4   B 5   C 3   D 4   E 2   F 0   G 2   H 1
```

**Question.** Write the order in which the states are **visited** by A* (start and goal included), the solution
returned and its cost.

**Conventions (from the exam)**
- graph search with the course reached table ($f = g + h$, a state is re-added only with a smaller $g$);
- ties on $f$ resolved in **alphabetical** order;
- the goal check is executed when nodes are **visited** (extracted from the frontier).

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'f(D) = 2 + 4 = 6 and f(A) = 4 + 4 = 8: D first.',
    'From G (g = 5) the path to E costs 7, so f(E) = 7 + 2 = 9, while A still waits with f = 8.',
    'E and H both have f = 9 at some point: alphabetical order. B and F both end with f = 10.',
]

EXPLANATION = r"""
| # | visited (g + h) | children added | frontier after (f) |
|---|---|---|---|
| 1 | C (0+3=3) | A 4+4, D 2+4 | D6 A8 |
| 2 | D (2+4=6) | G 5+2 | G7 A8 |
| 3 | G (5+2=7) | E 7+2 (A via G: g = 8, not < 4) | A8 E9 |
| 4 | A (4+4=8) | B 5+5, H 8+1 | E9 H9 B10 |
| 5 | E (7+2=9) | F 10+0 (H via E: g = 8, not < 8) | H9 B10 F10 |
| 6 | H (8+1=9) | — | B10 F10 |
| 7 | B (5+5=10) | — | F10 |
| 8 | **F (10+0=10)** | goal | |

Visited: **C, D, G, A, E, H, B, F**; solution **C, D, G, E, F with cost 10** (official answer). The heuristic is
consistent ($|h(u) - h(v)| \le c(u, v)$ on every edge, e.g. $h(B) - h(E) = 3 \le 4$), so graph-search A* is
optimal and never needs to re-open a state. Compared with UCS (9 visits, E twice) A* visits 8 nodes: here
the heuristic helps very little because B and H are still visited before the goal (ties with F at f = 10 are
won by B alphabetically).
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'astar', 'ties': 'alpha', 'start': 'C', 'goal': 'F',
    'graph': {'nodes': {'C': {'x': 50, 'y': 5, 'h': 3}, 'D': {'x': 18, 'y': 15, 'h': 4}, 'B': {'x': 82, 'y': 15, 'h': 5},
                        'E': {'x': 4, 'y': 50, 'h': 2}, 'A': {'x': 92, 'y': 50, 'h': 4}, 'F': {'x': 16, 'y': 86, 'h': 0},
                        'H': {'x': 82, 'y': 86, 'h': 1}, 'G': {'x': 50, 'y': 96, 'h': 2}},
              'edges': [['C', 'D', 2], ['C', 'A', 4], ['A', 'B', 1], ['A', 'G', 3], ['A', 'H', 4], ['B', 'E', 4],
                        ['D', 'G', 3], ['E', 'F', 3], ['E', 'G', 2], ['E', 'H', 1]]},
}
