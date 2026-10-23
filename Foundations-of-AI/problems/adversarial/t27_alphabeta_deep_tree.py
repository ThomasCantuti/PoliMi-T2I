TITLE = 'Alpha-beta on a deep tree (slide p. 376)'
DIFFICULTY = 'hard'
KIND = 'trace'
TAGS = ['alpha-beta', 'pruning', 'deep tree', 'hand simulation']

STATEMENT = r"""
The *alpha-beta pruning example* of slide p. 376: a depth-6 tree, MAX at the root, then MIN and MAX
alternating; some nodes have only one child. Leaves, left to right:

```text
0 5 | -3 3 | 3 | -3 0 2 | -2 3 | 5 2 | 5 -5 | 0 1 | 5 1 | -3 0 | -5 5 | -3 3 | 2
```

Predict every value that is returned and every cut-off.

**Conventions** (Figure 6.7): children **left to right**; at MAX `α = max(α, v)` and prune when $v \ge \beta$;
at MIN `β = min(β, v)` and prune when $v \le \alpha$; a node receives its parent's current $\alpha, \beta$.
Internal nodes are labelled A, B, C, … in breadth-first order; leaves are named after their parent
(V1, V2, …). Use the call stack panel to keep track of $\alpha$ and $\beta$.
"""

HINTS = [
    'The first cut-off happens very early: after the left MIN subtree returns 0, a MAX node has α = 0 and its next MIN child sees −3 first.',
    'Keep track of where α and β come from: a value only propagates as a bound to nodes *below* the node that set it.',
    'The root ends with value 1: the left MIN child is worth 0, the right one 1.',
]

EXPLANATION = r"""
The root is worth **1** (move to the right subtree): the left MIN child is worth 0, the right one 1.

Alpha-beta evaluates only **11 of the 25 leaves**; 14 are pruned, exactly the red nodes of the slide.
Every cut-off has the same shape: a node whose current $v$ is already outside the window
$(\alpha, \beta)$ handed down from above —
a MIN node with $v \le \alpha$ (MAX above already has $\alpha$), or a MAX node with $v \ge \beta$
(MIN above already has $\beta$). Whole subtrees disappear when the cut happens high in the tree
(e.g. the second child of a MAX node with value $\ge 2$ against $\beta = 0$).

Note that the pruned nodes show bounds (≤ v or ≥ v), not exact values: alpha-beta does not need them.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'tree': [
    [[[[[0, 5], [-3, 3]], [[3], [-3, 0, 2], [-2, 3]]]], [[[[5, 2], [5, -5]]], [[[0, 1]]]]],
    [[[[[5, 1], [-3, 0]]], [[[-5, 5]], [[-3, 3]]]], [[[[2]]]]]]}
