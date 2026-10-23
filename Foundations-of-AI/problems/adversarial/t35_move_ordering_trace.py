TITLE = 'Move ordering: the worst order for alpha-beta'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['alpha-beta', 'move ordering', 'pruning', 'hand simulation']

STATEMENT = r"""
Slide p. 379 asks: *what can be pruned with optimal move ordering?* Here is the same game tree
(MAX → MIN → MAX → leaves) with its children deliberately in the **worst** order:

```text
                     A (MAX)
            /                    \
        B (MIN)                C (MIN)
       /       \              /       \
   D (MAX)   E (MAX)      F (MAX)   G (MAX)
    /  \      /   \        /  \      /   \
   4   20    1     2      8   100   6    10
```

Run **alpha-beta** (Figure 6.7, children **left to right**) and predict every value and every cut-off
decision. Count how many leaves are evaluated.
"""

HINTS = [
    'Best ordering = children of MAX in decreasing value, children of MIN in increasing value (slide p. 377). Here it is the opposite.',
    'B = min(20, 2) = 2, so after B the root has α = 2.',
    'Inside C, a cut-off needs v ≤ α = 2 at C or v ≥ β at F/G. Do the values ever get there?',
]

EXPLANATION = r"""
Values: $D = 20$, $E = 2$, $B = 2$; $F = 100$, $G = 10$, $C = 10$; root $A = 10$ (move to C).

**All 8 leaves are evaluated — no pruning at all.** Every node meets its weakest children first,
so $v$ never crosses the window $(\alpha, \beta)$ before the last child.

With the order of slide p. 379 — `[[[10, 6], [100, 8]], [[1, 2], [20, 4]]]`, which is already optimal —
alpha-beta evaluates only **5 leaves**: inside B, once D = 10 has set $\beta = 10$, E is cut off after
its first leaf ($v = 100 \ge \beta = 10$, prune 8); B returns 10, the root gets $\alpha = 10$, and C is cut
off after F = 2 ($v = 2 \le \alpha = 10$, prune the whole subtree G with 20 and 4).

This is the $O(b^m)$ worst case vs the $O(b^{m/2})$ best case of slide p. 377: examine the most promising
moves first (killer moves, iterative deepening, …). Try **Best ordering** and **Shuffle** in the Playground.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'tree': [[[4, 20], [1, 2]], [[8, 100], [6, 10]]]}
