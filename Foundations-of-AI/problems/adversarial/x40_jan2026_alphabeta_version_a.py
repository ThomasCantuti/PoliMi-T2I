TITLE = 'Exam · Jan 2026 · Alpha-beta values, pruned nodes and best/average case (version A)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jan 2026', 'alpha-beta', 'pruning', 'complexity']

STATEMENT = r"""
*Written exam of 14 January 2026 (version A) — Adversarial Search.*

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
  6   0  11  14   7   7  15   0   6  18   0  11   2  13  17   8
```

**Question 1.** Apply alpha-beta pruning, exploring children **left to right**, and
- for each internal node, specify the minimax value and whether it was pruned;
- for each leaf, say whether it has been pruned.

**Question 2.** Compare the number of nodes that have been evaluated with the values we should expect for alpha-beta
in the best case and in the average case.

**Conventions** (AIMA Figure 6.7): a node receives its parent's current $\alpha, \beta$; MAX prunes when $v \ge \beta$,
MIN when $v \le \alpha$. Leaves are named L1 … L16 from left to right.
"""

HINTS = [
    'Left half: N07 = 0, then N08 is entered with α = 0 and returns 11, so N03 = 11. N04 gets β = 11.',
    'After N01 = 7 the root has α = 7. Every MIN node in the right half that meets a value ≤ 7 stops immediately.',
    'For Question 2 count the evaluated nodes: internal nodes that were entered plus leaves that were read.',
]

EXPLANATION = r"""
**Question 1** (identical to the official solution):

| node | minimax value | pruned? | node | minimax value | pruned? |
|---|---|---|---|---|---|
| N00 | **7** | no | N08 | 11 | no |
| N01 | 7 | no | N09 | 7 | no |
| N02 | 6 | no | N10 | 0 | no |
| N03 | 11 | no | N11 | 6 | no |
| N04 | 7 | no | N12 | 0 | no |
| N05 | 6 | no | N13 | 2 | **yes** |
| N06 | 8 | **yes** | N14 | 8 | **yes** |
| N07 | 0 | no | | | |

```text
leaves: 6 0 11 14 7 7 15 0 6 [18] 0 [11] [2] [13] [17] [8]      [x] = pruned
```

The official table reports the **true** minimax values also for the pruned nodes (N06 = 8, N13 = 2, N14 = 8), as
the question asks. What alpha-beta actually returns: N11 "≤ 6" (6 ≤ α = 7, prune L10), N12 "≤ 0" (prune L12),
N02 "≤ 6" (6 ≤ 7, prune N06 and its subtree). Root = 7, move towards N01.

**Question 2.** Evaluated: 12 internal nodes + 10 leaves = **22 of the 31 nodes**. The official answer: best case
$O(b^{h/2})$, average case $O(b^{3h/4})$, "with $h = 5$" $2^{2.5} \approx 5.7$ and $2^{3.75} \approx 13.5$.

Two remarks, to write the comparison well:

- the official numbers use $h = 5$, the number of **levels**; the depth of this tree (number of moves) is $h = 4$, which
  gives $2^2 = 4$ and $2^3 = 8$, to be compared with the $b^h = 16$ leaves. These are **orders of growth**, not exact
  counts, so on a tree this small they only give the trend;
- exactly: with perfect ordering this tree would need $b^{\lceil h/2\rceil} + b^{\lfloor h/2\rfloor} - 1 = 7$ leaves
  (18 nodes); averaged over all $2^{15}$ ways of ordering the children it needs ≈ 12.6 leaves (≈ 26 nodes). The 10 leaves
  (22 nodes) of the exam's ordering sit between the best and the average case.

Version B of the same exam has a different tree: see the next problem.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'tree': {'type': 'max', 'label': 'N00', 'children': [
    {'type': 'min', 'label': 'N01', 'children': [
        {'type': 'max', 'label': 'N03', 'children': [
            {'type': 'min', 'label': 'N07', 'children': [{'value': 6, 'label': 'L1'}, {'value': 0, 'label': 'L2'}]},
            {'type': 'min', 'label': 'N08', 'children': [{'value': 11, 'label': 'L3'}, {'value': 14, 'label': 'L4'}]}]},
        {'type': 'max', 'label': 'N04', 'children': [
            {'type': 'min', 'label': 'N09', 'children': [{'value': 7, 'label': 'L5'}, {'value': 7, 'label': 'L6'}]},
            {'type': 'min', 'label': 'N10', 'children': [{'value': 15, 'label': 'L7'}, {'value': 0, 'label': 'L8'}]}]}]},
    {'type': 'min', 'label': 'N02', 'children': [
        {'type': 'max', 'label': 'N05', 'children': [
            {'type': 'min', 'label': 'N11', 'children': [{'value': 6, 'label': 'L9'}, {'value': 18, 'label': 'L10'}]},
            {'type': 'min', 'label': 'N12', 'children': [{'value': 0, 'label': 'L11'}, {'value': 11, 'label': 'L12'}]}]},
        {'type': 'max', 'label': 'N06', 'children': [
            {'type': 'min', 'label': 'N13', 'children': [{'value': 2, 'label': 'L13'}, {'value': 13, 'label': 'L14'}]},
            {'type': 'min', 'label': 'N14', 'children': [{'value': 17, 'label': 'L15'}, {'value': 8, 'label': 'L16'}]}]}]}]}}
