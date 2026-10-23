TITLE = 'Exam · Jun 2024 · States k → 2k, 2k+1: iterative deepening search'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jun 2024', 'IDS', 'depth-limited search', 'cutoff']

STATEMENT = r"""
*Written exam of 20 June 2024 — Problem 1 (Search), Question 2 (iterative deepening part).*

The initial state is **1** and each state $k$ has two successors, **2k** (left child) and **2k + 1** (right
child); the graph shows states 1 to 15. The goal is **11**.

**Question.** List the order in which nodes are **visited** (selected from the frontier) by **iterative
deepening search**. Nodes are inserted in the frontier from the leftmost child to the rightmost one.

**Conventions**
- depth-limited searches with $L = 0, 1, 2, \dots$ (as in the slides p.157–159), each restarting from the root;
- inside each round: DFS, **leftmost child selected first**, goal test on **selection**, nodes at depth
  $\ge L$ goal-tested but not expanded.

Predict every selected node (round by round), then the returned path and its cost.
"""

HINTS = [
    'L = 0: only the root is visited, then the round ends with cutoff.',
    'Each round visits every node of depth ≤ L in depth-first (preorder) order.',
    '11 has depth 3: the round with L = 3 finds it.',
]

EXPLANATION = r"""
| L | visited | result |
|---|---|---|
| 0 | 1 | cutoff |
| 1 | 1 2 3 | cutoff |
| 2 | 1 2 4 5 3 6 7 | cutoff |
| 3 | 1 2 4 8 9 5 10 **11** | found |

Official answer: **1; 1 2 3; 1 2 4 5 3 6 7; 1 2 4 8 9 5 10 11**. Path **1 → 2 → 5 → 11, cost 3**. In total 19
visits against 11 for BFS (1 2 … 11): the regeneration of the upper levels is the price of the $O(bd)$ memory.
Unlike plain DFS, IDS is complete even though the real state space (k → 2k, 2k + 1 for every k) is infinite.

> **Exam trap:** the course code starts from $L = 1$ (`range(1, sys.maxsize)`); the slides' drawing and the
> official answer start from $L = 0$, which just adds the single visit "1" at the beginning. Say which one you use.
"""

VIZ = 'search'
CONFIG = {
    'algorithm': 'ids', 'idsStart': 0, 'childOrder': 'alpha', 'start': '1', 'goal': '11',
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
