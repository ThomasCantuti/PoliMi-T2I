TITLE = 'Exam · Sep 2023 · A tree where alpha-beta prunes nothing, and the best reordering'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Sep 2023', 'alpha-beta', 'move ordering', 'pruning']

STATEMENT = r"""
*Written exam of 8 September 2023 — Adversarial Search (8 points).*

Consider the game tree below (MAX at the root; the leaves are utilities for MAX).

```text
                               N00                                MAX
                ┌───────────────┴───────────────┐
               N01                             N02                MIN
        ┌───────┴───────┐               ┌───────┴───────┐
       N03             N04             N05             N06        MAX
    ┌───┴───┐       ┌───┴───┐       ┌───┴───┐       ┌───┴───┐
   N07     N08     N09     N10     N11     N12     N13     N14    MIN
  ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐
 22  17  28  25  71  14  83   8  59   4  65  60  38  17  80  79
```

**Question 1.** Apply alpha-beta pruning (children **left to right**) and specify which nodes and leaves are pruned.

**Question 2.** Rearrange the ordering of the leaves to obtain the **maximum** number of pruned nodes and leaves, and
mark what alpha-beta prunes in the new tree. The new ordering must keep the parent–child relations intact: you may
only swap the children of a node (with their whole subtrees), e.g. the two leaves of N11 must stay below the same MIN
node, and N11, N12 below the same MAX node.

In the trace, replay Question 1: predict every value and every cut-off decision. Then solve Question 2 on paper
before reading the explanation.

**Conventions** (AIMA Figure 6.7): a node receives its parent's current $\alpha, \beta$; MAX prunes when $v \ge \beta$,
MIN when $v \le \alpha$.
"""

HINTS = [
    'Question 1: at every node, look at the order of the leaves. A MIN node can cut only if a value ≤ α comes *before* its last leaf.',
    'Question 2: the best ordering puts the best move first: children of MAX in **decreasing** order of minimax value, children of MIN in **increasing** order (slides p. 377).',
    'Minimax values: N07 = 17, N08 = 25, N09 = 14, N10 = 8, N11 = 4, N12 = 60, N13 = 17, N14 = 79; N03 = 25, N04 = 14, N05 = 60, N06 = 79; N01 = 14, N02 = 60; root = 60.',
]

EXPLANATION = r"""
**Question 1: nothing is pruned** (official answer). All 16 leaves and 15 internal nodes are evaluated; the root is
worth 60 (move towards N02). Every potential cut-off fails because the value that would trigger it always comes
**last**: e.g. N11 receives $\alpha = 14$ and reads 59 before 4; N14 receives $(17, 60)$ and its leaves 80, 79 never go
below 17; N06 reaches $v = 79 \ge \beta = 60$ only with its last child.

**Question 2.** Sort the children with the best move first (MAX: decreasing minimax value, MIN: increasing). The
official solution draws this tree (one of several optimal answers):

```text
                                MAX = 60
                ┌───────────────────┴───────────────────┐
           N02 = 60                                 N01 ≤ 28
        ┌───────┴───────┐                       ┌───────┴───────┐
   N05 = 60         N06 ≥ 79               N03 ≤ 28           [N04]
    ┌───┴───┐       ┌───┴───┐               ┌───┴───┐       ┌───┴───┐
  N12     N11     N14     [N13]           N08     N07     [N09]   [N10]
  ┌┴─┐    ┌┴─┐    ┌┴─┐    ┌┴─┐            ┌┴─┐    ┌┴─┐    ┌┴─┐    ┌┴─┐
 60  65   4 [59] 80  79 [17][38]         28 [25] 17 [22] [71][14] [8][83]
```

Alpha-beta now evaluates only **7 leaves** (60, 65, 4, 80, 79, 28, 17) and 11 internal nodes: 4 internal nodes
(N13, N04, N09, N10) and 9 leaves are pruned.

- N11 meets 4 ≤ α = 60 first → prune 59; N06's first child is worth 79 ≥ β = 60 → prune N13;
- in the right MIN node, N08 meets 28 ≤ α = 60 → prune 25, N07 meets 17 ≤ 60 → prune 22; N03 returns ≤ 28 ≤ 60 →
  prune N04 and everything below it (the official drawing forgets to cross the leaf 14, which is pruned too).

This is optimal: on a uniform tree with $b = 2$ and depth 4 no ordering can read fewer than
$b^{\lceil 4/2\rceil} + b^{\lfloor 4/2\rfloor} - 1 = 7$ leaves. Checking all $2^{15}$ orderings of this tree, 1280 of them
reach this minimum (7 leaves, 18 nodes); putting N01's children in increasing order (N04 = 14 first) works just as well.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'tree': {'type': 'max', 'label': 'N00', 'children': [
    {'type': 'min', 'label': 'N01', 'children': [
        {'type': 'max', 'label': 'N03', 'children': [
            {'type': 'min', 'label': 'N07', 'children': [{'value': 22, 'label': 'L1'}, {'value': 17, 'label': 'L2'}]},
            {'type': 'min', 'label': 'N08', 'children': [{'value': 28, 'label': 'L3'}, {'value': 25, 'label': 'L4'}]}]},
        {'type': 'max', 'label': 'N04', 'children': [
            {'type': 'min', 'label': 'N09', 'children': [{'value': 71, 'label': 'L5'}, {'value': 14, 'label': 'L6'}]},
            {'type': 'min', 'label': 'N10', 'children': [{'value': 83, 'label': 'L7'}, {'value': 8, 'label': 'L8'}]}]}]},
    {'type': 'min', 'label': 'N02', 'children': [
        {'type': 'max', 'label': 'N05', 'children': [
            {'type': 'min', 'label': 'N11', 'children': [{'value': 59, 'label': 'L9'}, {'value': 4, 'label': 'L10'}]},
            {'type': 'min', 'label': 'N12', 'children': [{'value': 65, 'label': 'L11'}, {'value': 60, 'label': 'L12'}]}]},
        {'type': 'max', 'label': 'N06', 'children': [
            {'type': 'min', 'label': 'N13', 'children': [{'value': 38, 'label': 'L13'}, {'value': 17, 'label': 'L14'}]},
            {'type': 'min', 'label': 'N14', 'children': [{'value': 80, 'label': 'L15'}, {'value': 79, 'label': 'L16'}]}]}]}]}}
