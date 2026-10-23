TITLE = 'Trace minimax by hand (Figure 5.2)'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['minimax', 'backed-up values', 'hand simulation']

STATEMENT = r"""
Run **minimax** on the game tree of Figure 5.2 (slides p. 353) and predict every backed-up value.

```text
                 A (MAX)
       /            |            \
    B (MIN)      C (MIN)      D (MIN)
   /  |  \      /  |  \      /  |   \
  3  12   8    2   4   6    14   5   2
```

**Conventions** (as in `minimax_search`, slides p. 354–355):

- leaves are utilities **for MAX**; MAX moves at the root, then the players alternate;
- children are examined **left to right**, depth first;
- a MAX node returns the **maximum** of its children's values, a MIN node the **minimum**;
- the move kept at a node changes only on a **strict** improvement (`if v2 > v`), so ties keep the leftmost move.

Step through the search: each time a node has seen all of its children you will be asked for the value
it returns. At the end, the edge of the move chosen by MAX is highlighted.
"""

HINTS = [
    'Work bottom-up: a MIN node whose children are all leaves just takes the smallest leaf.',
    'B = min(3, 12, 8). Then do C and D the same way.',
    'The root is MAX: it picks the largest of the values of B, C and D.',
]

EXPLANATION = r"""
$B = \min(3, 12, 8) = 3$, $C = \min(2, 4, 6) = 2$, $D = \min(14, 5, 2) = 2$, and
$A = \max(3, 2, 2) = 3$: MAX plays the move to **B** (the first move with value 3).

Minimax visits **all 9 leaves**: time $O(b^m)$, space $O(bm)$ for the depth-first recursion.
The minimax value is what MAX can guarantee against an *optimal* opponent: if MIN plays badly,
MAX can only do better.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'minimax', 'tree': [[3, 12, 8], [2, 4, 6], [14, 5, 2]]}
