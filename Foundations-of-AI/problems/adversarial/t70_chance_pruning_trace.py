TITLE = 'Pruning chance nodes with a known range (slide p. 399)'
DIFFICULTY = 'hard'
KIND = 'trace'
TAGS = ['expectiminimax', 'alpha-beta', 'chance nodes', 'bounds', 'hand simulation']

STATEMENT = r"""
Slide p. 398–399: alpha-beta can also prune **chance** nodes, *if the range of the utility is known*.
Here MAX chooses among three chance nodes, each with three equally likely outcomes ($P = 1/3$), and every
utility is known to lie in $[0, 15]$.

```text
                      A (MAX)
          /              |              \
     B (chance)      C (chance)      D (chance)
     /   |   \       /   |   \       /   |   \
    3   12    9     2    4    6     0    6    15
```

Predict each value and, after every outcome of a chance node, whether the remaining outcomes can be pruned.

**Conventions:** children left to right; MAX as in Figure 6.7 ($\alpha$ = best value found so far).
After seeing some outcomes, a chance node's value is at most
$\sum_{\text{seen}} P \cdot v \;+\; P(\text{unseen}) \cdot 15$; if this **upper bound** is $\le \alpha$,
MAX will never choose the node → prune the remaining outcomes (the node returns that bound, shown as "≤").
"""

HINTS = [
    'B has no α to beat yet: it is evaluated completely, (3 + 12 + 9)/3 = 8, so α = 8 at the root.',
    'In C after the outcome 2: the best case is (2 + 15 + 15)/3 ≈ 10.67 > 8 — keep going.',
    'In C after 2 and 4: the best case is (2 + 4 + 15)/3 = 7 ≤ 8.',
]

EXPLANATION = r"""
$B = (3 + 12 + 9)/3 = 8$, so $\alpha = 8$.
In C, after 2 the bound is $(2 + 15 + 15)/3 \approx 10.67 > 8$; after 4 it is $(2 + 4 + 15)/3 = 7 \le 8$ →
**prune the leaf 6**, C is worth $\le 7$. D is the same: after 0 and 6 the bound is $(0 + 6 + 15)/3 = 7 \le 8$
→ **prune 15**. The root is worth **8** (move to B), with 7 of the 9 leaves evaluated — the "8, ≤ 7, ≤ 7"
of the slide.

Without a known range the bound would be $+\infty$ and nothing could be pruned below a chance node.
The deeper the tree, the smaller the probability of reaching a node, so pruning and limited-depth
search help less in stochastic games.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'range': [0, 15], 'tree': {'type': 'max', 'children': [
    {'type': 'chance', 'children': [3, 12, 9]}, {'type': 'chance', 'children': [2, 4, 6]},
    {'type': 'chance', 'children': [0, 6, 15]}]}}
