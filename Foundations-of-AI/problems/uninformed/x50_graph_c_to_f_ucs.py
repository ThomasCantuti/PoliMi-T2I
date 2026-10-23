TITLE = 'Exam · Jun 2023 · Graph from C to F: uniform-cost search'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jun 2023', 'UCS', 'reached table', 'ties', 'stale nodes']

STATEMENT = r"""
*Written exam of 14 June 2023 — Problem 3 (8 points), UCS part.*

State space (undirected; numbers are step costs). **C** is the initial state, **F** the goal.

```text
C–D 2   C–A 4   A–B 1   A–G 3   A–H 4   B–E 4   D–G 3   E–F 3   E–G 2   E–H 1
```

**Question.** Write the order in which the states are **visited** by uniform-cost search (start and goal
included), the solution returned and its cost.

**Conventions (from the exam and the course code `best_first_search` with $f = g$)**
- graph search with a **reached table**: a child is added if its state is new **or** its $g$ is strictly
  lower than the reached one; the old, more expensive frontier entry is **not removed**: if it is popped later
  it is visited (and expanded) again;
- ties on $g$ resolved in **alphabetical** order;
- the goal check is executed when nodes are **visited** (extracted from the frontier).

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'After C: D (g=2) and A (g=4). D comes first because it is cheaper, not because of the alphabet.',
    'B and G both reach g = 5: the alphabetical tie-break visits B first.',
    'E enters the frontier with g = 9 (via B) and again with g = 7 (via G). Both entries stay in the frontier.',
]

EXPLANATION = r"""
| # | visited (g) | children added | frontier after (g) |
|---|---|---|---|
| 1 | C 0 | A 4, D 2 | D2 A4 |
| 2 | D 2 | G 5 | A4 G5 |
| 3 | A 4 | B 5, H 8 (G 7 is not < 5) | B5 G5 H8 |
| 4 | B 5 | E 9 | G5 H8 E9 |
| 5 | G 5 | E 7 (< 9: reached updated) | E7 H8 E9 |
| 6 | E 7 | F 10 (H 8 is not < 8) | H8 E9 F10 |
| 7 | H 8 | — | E9 F10 |
| 8 | E 9 | — (stale entry: nothing cheaper) | F10 |
| 9 | **F 10** | goal | |

Visited: **C, D, A, B, G, E, H, E, F**; solution **C, D, G, E, F with cost 2 + 3 + 2 + 3 = 10** (official
answer, which also lists E twice). UCS is optimal: when F is selected with $g = 10$ every cheaper path has
already been explored, while BFS returned C, A, B, E, F with cost 12.

> **Exam trap:** with an expanded (closed) list the stale E (9) would be discarded instead of visited again:
> C, D, A, B, G, E, H, F. Both are correct UCS implementations, but the official answer follows the course code,
> which keeps the outdated entry in the priority queue.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'ucs', 'ties': 'alpha', 'start': 'C', 'goal': 'F',
    'graph': {'nodes': {'C': {'x': 50, 'y': 5}, 'D': {'x': 18, 'y': 15}, 'B': {'x': 82, 'y': 15}, 'E': {'x': 4, 'y': 50},
                        'A': {'x': 92, 'y': 50}, 'F': {'x': 16, 'y': 86}, 'H': {'x': 82, 'y': 86}, 'G': {'x': 50, 'y': 96}},
              'edges': [['C', 'D', 2], ['C', 'A', 4], ['A', 'B', 1], ['A', 'G', 3], ['A', 'H', 4], ['B', 'E', 4],
                        ['D', 'G', 3], ['E', 'F', 3], ['E', 'G', 2], ['E', 'H', 1]]},
}
