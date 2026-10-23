TITLE = 'Exam · Jan 2023 · Minimax values and alpha-beta pruned nodes'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jan 2023', 'alpha-beta', 'minimax', 'pruning on equality']

STATEMENT = r"""
*Written exam of 18 January 2023 — Adversarial Search.*

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
 15  13  19   6  17   2  18  15   7   2  13   1  11  17   2   7
```

**Question 1.** Apply the minimax algorithm and report the minimax value of each node.

**Question 2.** Apply alpha-beta pruning and, for each node (internal nodes and leaves), specify whether it has been
pruned. Children are generated and explored **left to right**.

**Conventions** (AIMA Figure 6.7): a node receives its parent's current $\alpha, \beta$; MAX updates
$\alpha = \max(\alpha, v)$ and prunes when $v \ge \beta$; MIN updates $\beta = \min(\beta, v)$ and prunes when
$v \le \alpha$ — **also on equality**. Leaves are named L1 … L16 from left to right.
"""

HINTS = [
    'Question 1 bottom-up: N07 = 13, N08 = 6, N03 = 13; N09 = 2, N10 = 15, N04 = 15; so N01 = 13.',
    'After N01 the root has α = 13, and every node below N02 receives α = 13.',
    'N12 sees 13 first: is 13 ≤ α = 13? The test is ≤, not <.',
]

EXPLANATION = r"""
**Question 1 — minimax values** (official solution, verified):

| node | value | node | value |
|---|---|---|---|
| N00 | **13** | N08 | 6 |
| N01 | 13 | N09 | 2 |
| N02 | 2 | N10 | 15 |
| N03 | 13 | N11 | 2 |
| N04 | 15 | N12 | 1 |
| N05 | 2 | N13 | 11 |
| N06 | 11 | N14 | 2 |
| N07 | 13 | | |

**Question 2 — alpha-beta** (identical to the official table): pruned nodes **N06, N13, N14**; pruned leaves
L10 (2), L12 (1) and L13–L16 (11, 17, 2, 7):

```text
leaves: 15 13 19 6 17 2 18 15 7 [2] 13 [1] [11] [17] [2] [7]      [x] = pruned
```

| node | receives (α, β) | returns | why |
|---|---|---|---|
| N04 | (−∞, 13) | 15 | N09 = 2 gives α = 2; N10 is entered with (2, 13), sees 18 then 15: no cut |
| N11 | (13, +∞) | ≤ 7 | 7 ≤ α = 13 → prune L10 |
| N12 | (13, +∞) | ≤ 13 | **13 ≤ 13** → prune L12 (pruning on equality) |
| N05 | (13, +∞) | ≤ 13 | max(7, 13) = 13 |
| N02 | (13, +∞) | ≤ 13 | 13 ≤ α = 13 → prune N06 with its whole subtree |

The root is worth 13 (move towards N01). Alpha-beta evaluates 10 of the 16 leaves (22 of the 31 nodes).

> **Exam trap:** with a strict test ($v < \alpha$) the leaf L12 = 1 would be evaluated too. The official solution
> prunes it: the course's alpha-beta cuts off on **equality** ($v \le \alpha$, $v \ge \beta$), because a branch that
> can at best *tie* the move MAX already has cannot change the decision.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'tree': {'type': 'max', 'label': 'N00', 'children': [
    {'type': 'min', 'label': 'N01', 'children': [
        {'type': 'max', 'label': 'N03', 'children': [
            {'type': 'min', 'label': 'N07', 'children': [{'value': 15, 'label': 'L1'}, {'value': 13, 'label': 'L2'}]},
            {'type': 'min', 'label': 'N08', 'children': [{'value': 19, 'label': 'L3'}, {'value': 6, 'label': 'L4'}]}]},
        {'type': 'max', 'label': 'N04', 'children': [
            {'type': 'min', 'label': 'N09', 'children': [{'value': 17, 'label': 'L5'}, {'value': 2, 'label': 'L6'}]},
            {'type': 'min', 'label': 'N10', 'children': [{'value': 18, 'label': 'L7'}, {'value': 15, 'label': 'L8'}]}]}]},
    {'type': 'min', 'label': 'N02', 'children': [
        {'type': 'max', 'label': 'N05', 'children': [
            {'type': 'min', 'label': 'N11', 'children': [{'value': 7, 'label': 'L9'}, {'value': 2, 'label': 'L10'}]},
            {'type': 'min', 'label': 'N12', 'children': [{'value': 13, 'label': 'L11'}, {'value': 1, 'label': 'L12'}]}]},
        {'type': 'max', 'label': 'N06', 'children': [
            {'type': 'min', 'label': 'N13', 'children': [{'value': 11, 'label': 'L13'}, {'value': 17, 'label': 'L14'}]},
            {'type': 'min', 'label': 'N14', 'children': [{'value': 2, 'label': 'L15'}, {'value': 7, 'label': 'L16'}]}]}]}]}}
