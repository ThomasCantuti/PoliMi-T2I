TITLE = 'Exam · Jul 2022 · Knight on a 3×4 board: depth-first search'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jul 2022', 'DFS', 'graph search', 'expanded list', 'state space']

STATEMENT = r"""
*Written exam of 14 July 2022 — Problem 1 (8 points), Questions 1–2 (DFS part).*

A chess **knight** moves in an L-shape: two squares vertically and one horizontally, or two squares
horizontally and one vertically. Move the knight on this 3×4 board from **S** to **G**; every move costs 1.

```text
  S  H  D  K
  I  J  A  E
  C  B  G  F
```

**Question 1** asks to draw the state space: the states are the 12 squares, and there is an (undirected)
edge between two squares when a knight move joins them. The graph in the visualizer is that state space,
drawn on the board (each line is one knight move).

**Question 2 (DFS).** Give the ordered sequence of nodes **visited** by depth-first search.

**Conventions (from the exam)**
- graph search: no state is expanded twice. In the official answer this means an **expanded (closed)
  list**: a child whose state has already been expanded is discarded, and a node popped for a state that
  was already expanded is skipped;
- ties in alphabetical order: the children are pushed so that the **alphabetically-first child is
  selected first**;
- a node is *visited* when it is at the front of the queue (selected): the goal test is done there.

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'Knight moves from S: two right and one down lands on A, two down and one right lands on B.',
    'Only states already **expanded** are discarded: B was generated as a child of S, but when E generates B '
    'again it has not been expanded yet, so it is pushed.',
    'From H the children are E and G (C is already expanded): E comes first alphabetically, so DFS goes '
    'to E even though G is the goal.',
]

EXPLANATION = r"""
**State space (Question 1).** Neighbours of each square:
S: A, B · A: C, S · B: D, E, S · C: A, H · D: B, F, I · E: B, H · F: D, J · G: H, I, K · H: C, E, G ·
I: D, G · J: F, K · K: G, J (14 edges, every square has 2 or 3 moves).

| # | selected | children pushed | stack after (top first) |
|---|---|---|---|
| 1 | S | A, B | A B |
| 2 | A | C (S expanded) | C B |
| 3 | C | H (A expanded) | H B |
| 4 | H | E, G (C expanded) | E G B |
| 5 | E | B (H expanded) | B G B |
| 6 | B | D (E, S expanded) | D G B |
| 7 | D | F, I (B expanded) | F I G B |
| 8 | F | J | J I G B |
| 9 | J | K | K I G B |
| 10 | K | G | G I G B |
| 11 | **G** | goal | |

Visited: **S A C H E B D F J K G** (official answer: SACHEBDFJKG). The returned path is the whole
branch S → A → C → H → E → B → D → F → J → K → G, **cost 10**, while the optimal one (S → A → C → H → G)
costs 4: at H, DFS chose E before the goal G and never came back. DFS is not optimal.

> **Exam trap:** with the other graph-search convention (a **reached** set filled when children are
> *generated*, slides p.106) B and G would already be "reached" when E and K generate them: E would have
> no children left and the visit would be S A C H E G. The official answer corresponds to an expanded
> list (here it is also what tree search with the `is_cycle` check gives). Always state your convention.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'dfs', 'graphSearch': 'expanded', 'childOrder': 'alpha', 'start': 'S', 'goal': 'G',
    'graph': {'nodes': {'S': {'x': 10, 'y': 12}, 'H': {'x': 37, 'y': 12}, 'D': {'x': 63, 'y': 12}, 'K': {'x': 90, 'y': 12},
                        'I': {'x': 10, 'y': 50}, 'J': {'x': 37, 'y': 50}, 'A': {'x': 63, 'y': 50}, 'E': {'x': 90, 'y': 50},
                        'C': {'x': 10, 'y': 88}, 'B': {'x': 37, 'y': 88}, 'G': {'x': 63, 'y': 88}, 'F': {'x': 90, 'y': 88}},
              'edges': [['S', 'A', 1], ['S', 'B', 1], ['A', 'C', 1], ['B', 'D', 1], ['B', 'E', 1], ['C', 'H', 1],
                        ['D', 'F', 1], ['D', 'I', 1], ['E', 'H', 1], ['F', 'J', 1], ['G', 'H', 1], ['G', 'I', 1],
                        ['G', 'K', 1], ['J', 'K', 1]]},
}
