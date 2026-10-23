TITLE = 'Exam · Jul 2022 · Knight on a 3×4 board: A* search'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jul 2022', 'A*', 'ties', 'graph search']

STATEMENT = r"""
*Written exam of 14 July 2022 — Problem 1 (8 points), Question 2 (A* part).*

Move a chess **knight** (L-shaped moves) on this 3×4 board from **S** to **G**; every move costs 1. Each
square shows its heuristic value $h$. The graph in the visualizer is the state space (one edge per knight move).

```text
  S (h=3)  H (h=1)  D (h=1)  K (h=1)
  I (h=1)  J (h=2)  A (h=2)  E (h=2)
  C (h=1)  B (h=2)  G (h=0)  F (h=3)
```

**Questions.** Give the ordered sequence of nodes **visited** by A* search, and the final path found by A*
with its cost.

**Conventions (from the exam)**
- graph search with the course reached table ($f = g + h$, a state is re-added only with a smaller $g$);
- ties on $f$ broken in **alphabetical** order;
- a node is *visited* when it is at the front of the queue: goal test on **selection**.

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'f(S) = 0 + 3. Its children A and B both have f = 1 + 2 = 3: alphabetical order picks A first.',
    'Four nodes have f = 3 (S, A, B, then C and D): they are all visited before any node with f = 4.',
    'Among the nodes with f = 4 (E, H, I, then G), alphabetical order decides.',
]

EXPLANATION = r"""
| # | visited (g + h) | children added | frontier after (f) |
|---|---|---|---|
| 1 | S (0+3=3) | A 1+2, B 1+2 | A3 B3 |
| 2 | A (1+2=3) | C 2+1 | B3 C3 |
| 3 | B (1+2=3) | D 2+1, E 2+2 | C3 D3 E4 |
| 4 | C (2+1=3) | H 3+1 | D3 E4 H4 |
| 5 | D (2+1=3) | F 3+3, I 3+1 | E4 H4 I4 F6 |
| 6 | E (2+2=4) | — (H via E has g = 3, not smaller) | H4 I4 F6 |
| 7 | H (3+1=4) | G 4+0 | G4 I4 F6 |
| 8 | **G (4+0=4)** | goal | |

Visited: **S A B C D E H G**; path **S → A → C → H → G, cost 4** (official answer: SABCDEHG, SACHG with cost 4).

Is $h$ admissible? Yes: the true distances to G are S 4, A 3, B 3, C 2, D 2, E 2, F 3, H 1, I 1, J 2, K 1, and
$h \le h^*$ everywhere. It is **not consistent**: $h(F) = 3 > c(F, D) + h(D) = 2$. That does not matter here
because F (f = 6) is never selected, but it is a good check to do before trusting graph-search A*.

> **Exam trap:** with FIFO ties instead of alphabetical ones, I (inserted before G) would be visited before G:
> S A B C D E H I G. Read the tie-breaking rule of the exercise.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'astar', 'ties': 'alpha', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 10, 'y': 12, 'h': 3}, 'H': {'x': 37, 'y': 12, 'h': 1}, 'D': {'x': 63, 'y': 12, 'h': 1},
                        'K': {'x': 90, 'y': 12, 'h': 1}, 'I': {'x': 10, 'y': 50, 'h': 1}, 'J': {'x': 37, 'y': 50, 'h': 2},
                        'A': {'x': 63, 'y': 50, 'h': 2}, 'E': {'x': 90, 'y': 50, 'h': 2}, 'C': {'x': 10, 'y': 88, 'h': 1},
                        'B': {'x': 37, 'y': 88, 'h': 2}, 'G': {'x': 63, 'y': 88, 'h': 0}, 'F': {'x': 90, 'y': 88, 'h': 3}},
              'edges': [['S', 'A', 1], ['S', 'B', 1], ['A', 'C', 1], ['B', 'D', 1], ['B', 'E', 1], ['C', 'H', 1],
                        ['D', 'F', 1], ['D', 'I', 1], ['E', 'H', 1], ['F', 'J', 1], ['G', 'H', 1], ['G', 'I', 1],
                        ['G', 'K', 1], ['J', 'K', 1]]},
}
