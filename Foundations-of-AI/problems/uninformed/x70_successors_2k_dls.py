TITLE = 'Exam · Jun 2024 · States k → 2k, 2k+1: depth-limited search (L = 3)'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['exam', 'Jun 2024', 'depth-limited search', 'DFS', 'LIFO stack']

STATEMENT = r"""
*Written exam of 20 June 2024 — Problem 1 (Search), Questions 1–2 (depth-limited part).*

The initial state is **1** and each state $k$ has two successors, **2k** (left child) and **2k + 1** (right
child). The graph in the visualizer is the portion of the state space for states 1 to 15 asked by Question 1
(state 1 at the top, $2k$ drawn as the left child and $2k + 1$ as the right child of $k$). The goal is **11**.

**Question.** List the order in which nodes are **visited** (selected from the frontier) by **depth-limited
search with limit 3**. Nodes must be inserted in the frontier starting from the leftmost child to the
rightmost one.

**Conventions**
- DFS with a LIFO frontier, the **leftmost child is selected first**;
- goal test when a node is **selected**; a node at depth $\ge 3$ is goal-tested but **not expanded**
  (the root has depth 0).

Predict every selected node, then the returned path and its cost.
"""

HINTS = [
    'Depth of state k = number of halvings to reach 1: 8 … 15 are at depth 3.',
    'With L = 3, the nodes 8 and 9 are visited (goal-tested) but not expanded.',
    'After the subtree of 4 is exhausted, DFS backtracks to 5, the right child of 2.',
]

EXPLANATION = r"""
| # | visited | depth | action |
|---|---|---|---|
| 1 | 1 | 0 | expand: push 3, 2 (2 on top) |
| 2 | 2 | 1 | expand: push 5, 4 |
| 3 | 4 | 2 | expand: push 9, 8 |
| 4 | 8 | 3 | limit reached: not expanded |
| 5 | 9 | 3 | limit reached: not expanded |
| 6 | 5 | 2 | expand: push 11, 10 |
| 7 | 10 | 3 | limit reached |
| 8 | **11** | 3 | goal |

Visited: **1 2 4 8 9 5 10 11** (official answer); path **1 → 2 → 5 → 11, cost 3**. The goal is at depth 3 = L,
so it is found: the limit test `len(node) >= limit` is applied only after the goal test.

The official answer also gives plain **DFS** the same sequence 1 2 4 8 9 5 10 11. That holds only on the
drawn portion (states 1–15, where 8–15 have no successors). On the real, infinite state space DFS would go
1, 2, 4, 8, 16, 32, … forever and never reach 11: DFS is not complete on infinite spaces, which is exactly
why the depth limit is useful here.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'dls', 'limit': 3, 'childOrder': 'alpha', 'start': '1', 'goal': '11',
    'graph': {'directed': True,
              'nodes': {'1': {'x': 50, 'y': 6}, '2': {'x': 25, 'y': 35}, '3': {'x': 75, 'y': 35}, '4': {'x': 12.5, 'y': 64},
                        '5': {'x': 37.5, 'y': 64}, '6': {'x': 62.5, 'y': 64}, '7': {'x': 87.5, 'y': 64}, '8': {'x': 6.2, 'y': 93},
                        '9': {'x': 18.8, 'y': 93}, '10': {'x': 31.2, 'y': 93}, '11': {'x': 43.8, 'y': 93},
                        '12': {'x': 56.2, 'y': 93}, '13': {'x': 68.8, 'y': 93}, '14': {'x': 81.2, 'y': 93},
                        '15': {'x': 93.8, 'y': 93}},
              'edges': [['1', '2', 1], ['1', '3', 1], ['2', '4', 1], ['2', '5', 1], ['3', '6', 1], ['3', '7', 1],
                        ['4', '8', 1], ['4', '9', 1], ['5', '10', 1], ['5', '11', 1], ['6', '12', 1], ['6', '13', 1],
                        ['7', '14', 1], ['7', '15', 1]]},
}
