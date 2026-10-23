TITLE = 'Exam · Jan 2026 · Alpha-beta values and pruned nodes (version B)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jan 2026', 'alpha-beta', 'pruning', 'bounds']

STATEMENT = r"""
*Written exam of 14 January 2026 (version B) — Adversarial Search.*

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
 17   7  12   7   6  15   4   1  18   2   3   1  16   8   4  14
```

**Question 1.** Apply alpha-beta pruning, exploring children **left to right**, and
- for each internal node, specify the minimax value and whether it was pruned;
- for each leaf, say whether it has been pruned.

**Question 2.** Compare the number of nodes that have been evaluated with the values we should expect for alpha-beta
in the best case and in the average case.

**Conventions** (AIMA Figure 6.7): a node receives its parent's current $\alpha, \beta$; MAX prunes when $v \ge \beta$,
MIN when $v \le \alpha$ (also on equality). Leaves are named L1 … L16 from left to right.
"""

HINTS = [
    'N03 = 7 (N07 = 7, then N08 is entered with α = 7: it sees 12, then 7 — the last leaf, so nothing left to prune).',
    'N04 receives β = 7 and N09 returns 6, so N10 is entered with (α, β) = (6, 7). Its first leaf is 4.',
    'The root has α = 6 when it enters N02. Which MIN nodes on the right meet a value ≤ 6 before their last child?',
]

EXPLANATION = r"""
**Question 1** (identical to the official solution):

| node | minimax value | alpha-beta returns | pruned? | node | minimax value | alpha-beta returns | pruned? |
|---|---|---|---|---|---|---|---|
| N00 | **6** | 6 | no | N08 | 7 | 7 | no |
| N01 | 6 | 6 | no | N09 | 6 | 6 | no |
| N02 | 2 | ≤ 3 | no | N10 | 1 | ≤ 4 | no |
| N03 | 7 | 7 | no | N11 | 2 | 2 | no |
| N04 | 6 | 6 | no | N12 | 1 | ≤ 3 | no |
| N05 | 2 | ≤ 3 | no | N13 | 8 | — | **yes** |
| N06 | 8 | — | **yes** | N14 | 4 | — | **yes** |
| N07 | 7 | 7 | no | | | | |

```text
leaves: 17 7 12 7 6 15 4 [1] 18 2 3 [1] [16] [8] [4] [14]      [x] = pruned
```

The official table writes the cut-off nodes as "2 (≤ 3)", "1 (≤ 4)", "1 (≤ 3)": true minimax value, and in brackets
the bound alpha-beta actually returned. The cut-offs:

- N10 (MIN) receives (6, 7): leaf 4 ≤ α = 6 → prune L8;
- N11 receives (6, +∞) and reads 18, 2: no cut-off is possible, 2 is the last leaf;
- N12 receives (6, +∞): leaf 3 ≤ 6 → prune L12; N05 = max(2, 3) = 3 (a bound: its true value is 2);
- N02 (MIN): N05 returns 3 ≤ α = 6 → prune N06 with N13, N14 and their four leaves.

**Question 2.** As in version A: 12 internal nodes + 10 leaves = **22 of the 31 nodes**; the official solution compares
them with $2^{h/2} \approx 5.7$ (best) and $2^{3h/4} \approx 13.5$ (average) computed with $h = 5$ levels. With the depth
$h = 4$ the orders are $4$ and $8$ against $16$ leaves; exactly, perfect ordering would read 7 leaves (18 nodes), and
the average over all child orderings of this tree is ≈ 11.6 leaves (≈ 25 nodes).
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'tree': {'type': 'max', 'label': 'N00', 'children': [
    {'type': 'min', 'label': 'N01', 'children': [
        {'type': 'max', 'label': 'N03', 'children': [
            {'type': 'min', 'label': 'N07', 'children': [{'value': 17, 'label': 'L1'}, {'value': 7, 'label': 'L2'}]},
            {'type': 'min', 'label': 'N08', 'children': [{'value': 12, 'label': 'L3'}, {'value': 7, 'label': 'L4'}]}]},
        {'type': 'max', 'label': 'N04', 'children': [
            {'type': 'min', 'label': 'N09', 'children': [{'value': 6, 'label': 'L5'}, {'value': 15, 'label': 'L6'}]},
            {'type': 'min', 'label': 'N10', 'children': [{'value': 4, 'label': 'L7'}, {'value': 1, 'label': 'L8'}]}]}]},
    {'type': 'min', 'label': 'N02', 'children': [
        {'type': 'max', 'label': 'N05', 'children': [
            {'type': 'min', 'label': 'N11', 'children': [{'value': 18, 'label': 'L9'}, {'value': 2, 'label': 'L10'}]},
            {'type': 'min', 'label': 'N12', 'children': [{'value': 3, 'label': 'L11'}, {'value': 1, 'label': 'L12'}]}]},
        {'type': 'max', 'label': 'N06', 'children': [
            {'type': 'min', 'label': 'N13', 'children': [{'value': 16, 'label': 'L13'}, {'value': 8, 'label': 'L14'}]},
            {'type': 'min', 'label': 'N14', 'children': [{'value': 4, 'label': 'L15'}, {'value': 14, 'label': 'L16'}]}]}]}]}}
