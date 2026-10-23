TITLE = 'Trace alpha-beta with α and β at every node (Figure 6.5)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['alpha-beta', 'pruning', 'α/β bounds', 'hand simulation']

STATEMENT = r"""
Run **alpha-beta search** (Figure 6.7) on the tree of Figure 6.5 and predict, step by step:

- the $(\alpha, \beta)$ each MAX/MIN node **receives** from its parent,
- after each update, whether the node **cuts off** its remaining children,
- the value each node returns.

```text
                 A (MAX)
       /            |            \
    B (MIN)      C (MIN)      D (MIN)
   /  |  \      /  |  \      /  |   \
  3  12   8    2   4   6    14   5   2
```

**Conventions** (exactly Figure 6.7, slides p. 368):

- the root is called with $\alpha = -\infty$, $\beta = +\infty$; children are examined **left to right**;
- MAX: `if v2 > v: v = v2; α = max(α, v)` then `if v ≥ β: return v` (prune the rest);
- MIN: `if v2 < v: v = v2; β = min(β, v)` then `if v ≤ α: return v` (prune the rest);
- a child receives its parent's **current** $\alpha$ and $\beta$.

You are only asked about pruning when a cut-off is possible (a MIN node with $\alpha = -\infty$ or a
MAX node with $\beta = +\infty$ can never prune).
"""

HINTS = [
    'α is "MAX can already get at least α" along the path; β is "MIN can already hold MAX to at most β".',
    'After B returns 3, the root has α = 3. C is entered with (α, β) = (3, +∞).',
    'C sees the leaf 2 first: v = 2 ≤ α = 3. Can C ever be worth more than 2? Would MAX ever choose it?',
    'D is entered with (3, +∞): its leaves 14 and 5 do not go ≤ 3, only the last one does — and there is nothing left to prune.',
]

EXPLANATION = r"""
| node | receives (α, β) | returns | note |
|---|---|---|---|
| A | (−∞, +∞) | 3 | best move → B |
| B | (−∞, +∞) | 3 | β: 3 (12 and 8 do not lower it) |
| C | (3, +∞) | ≤ 2 | 2 ≤ α = 3 → **prune 4 and 6** |
| D | (3, +∞) | 2 | β: 14 → 5 → 2, last leaf, nothing to prune |

Alpha-beta evaluates **7 of the 9 leaves** and returns the same value and move as minimax (3, move to B).
C's value is only known to be "at most 2" — Figure 6.5 writes it as the range $[-\infty, 2]$ — and that is
enough: MAX already has 3.

If D's leaves were ordered $2, 5, 14$, D would also be cut off after its first leaf: ordering matters.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'askAlphaBeta': True, 'tree': [[3, 12, 8], [2, 4, 6], [14, 5, 2]]}
