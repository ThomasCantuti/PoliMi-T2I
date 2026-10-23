TITLE = 'Exam · Jan 2024 · Alpha-beta on a depth-5 tree (N00–N30)'
DIFFICULTY = 'hard'
KIND = 'trace'
TAGS = ['exam', 'Jan 2024', 'alpha-beta', 'minimax', 'deep tree']

STATEMENT = r"""
*Written exam of 18 January 2024 — Adversarial Search.*

Consider the game tree below: MAX at the root, five levels of internal nodes (MAX, MIN, MAX, MIN, MAX), 32 leaves
(utilities for MAX).

```text
                                              N00                                                 MAX
                       ┌───────────────────────┴───────────────────────┐
                      N01                                             N02                         MIN
           ┌───────────┴───────────┐                       ┌───────────┴───────────┐
          N03                     N04                     N05                     N06             MAX
     ┌─────┴─────┐           ┌─────┴─────┐           ┌─────┴─────┐           ┌─────┴─────┐
    N07         N08         N09         N10         N11         N12         N13         N14       MIN
  ┌──┴──┐     ┌──┴──┐     ┌──┴──┐     ┌──┴──┐     ┌──┴──┐     ┌──┴──┐     ┌──┴──┐     ┌──┴──┐
 N15   N16   N17   N18   N19   N20   N21   N22   N23   N24   N25   N26   N27   N28   N29   N30    MAX
 ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐  ┌┴─┐
 3 11 13 13 16 12 11 14  8 14 19 17  8  6 13  5  9 12  9 16 11  9  5  4 17 14  7  7 17  5  6 16
```

**Question 1.** Apply the minimax algorithm and report the minimax value of each node.

**Question 2.** Apply alpha-beta pruning and, for each node, specify whether it has been pruned or evaluated.
Children are generated and explored **left to right**.

**Conventions** (AIMA Figure 6.7): a node receives its parent's current $\alpha, \beta$; MAX updates
$\alpha = \max(\alpha, v)$ and prunes when $v \ge \beta$; MIN updates $\beta = \min(\beta, v)$ and prunes when
$v \le \alpha$ (also on equality). Leaves are named L1 … L32 from left to right. Use the call-stack panel to keep track
of where each $\alpha$ and $\beta$ comes from.
"""

HINTS = [
    'Question 1, bottom-up: the 16 MAX nodes N15–N30 take the larger of their two leaves (N15 = 11, N16 = 13, …), then the MIN nodes N07–N14, and so on. The root is 14.',
    'The first cut-off is very early: N07 gets β = 11 from N15, and N16 sees 13 ≥ 11.',
    'N04 receives β = 14 from N01. N09 returns exactly 14: 14 ≥ 14 is enough to cut off N10.',
    'The whole right half receives α = 14 from the root: N11 and N12 are cut off after their first child, then N02 after N05.',
]

EXPLANATION = r"""
**Question 1 — minimax values** (official solution, verified):

| node | value | node | value | node | value | node | value |
|---|---|---|---|---|---|---|---|
| N00 | **14** | N08 | 14 | N16 | 13 | N24 | 16 |
| N01 | 14 | N09 | 14 | N17 | 16 | N25 | 11 |
| N02 | 12 | N10 | 8 | N18 | 14 | N26 | 5 |
| N03 | 14 | N11 | 12 | N19 | 14 | N27 | 17 |
| N04 | 14 | N12 | 5 | N20 | 19 | N28 | 7 |
| N05 | 12 | N13 | 7 | N21 | 8 | N29 | 17 |
| N06 | 16 | N14 | 16 | N22 | 13 | N30 | 16 |
| N07 | 11 | N15 | 11 | N23 | 12 | | |

**Question 2 — alpha-beta** (identical to the official table). Pruned nodes: **N06, N10, N13, N14, N21, N22, N24,
N26, N27, N28, N29, N30**; evaluated: all the others. Leaves (pruned in brackets):

```text
3 11 13 [13] 16 12 11 14 8 14 19 [17] [8 6 13 5] 9 12 [9 16] 11 9 [5 4] [17 14 7 7 17 5 6 16]
```

The cut-offs, in order:

| node | receives (α, β) | cut-off | prunes |
|---|---|---|---|
| N16 (MAX) | (−∞, 11) | 13 ≥ β = 11 | L4 |
| N20 (MAX) | (−∞, 14) | 19 ≥ β = 14 | L12 |
| N04 (MAX) | (−∞, 14) | N09 = 14 ≥ β = 14 (equality) | N10 with N21, N22 |
| N11 (MIN) | (14, +∞) | N23 = 12 ≤ α = 14 | N24 |
| N12 (MIN) | (14, +∞) | N25 = 11 ≤ α = 14 | N26 |
| N02 (MIN) | (14, +∞) | N05 = 12 ≤ α = 14 | N06 with N13, N14, N27–N30 |

Alpha-beta evaluates only **14 of the 32 leaves** (33 of the 63 nodes) and returns the minimax value 14, move towards N01.

> **Exam trap:** nodes cut off by alpha-beta return **bounds**: N16 "≥ 13", N04 "≥ 14", N11 "≤ 12", N12 "≤ 11",
> N02 "≤ 12". When the exam asks for "the value" under alpha-beta, write the bound; when it asks for the minimax
> value (Question 1), compute it on the full tree.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'tree': {'type': 'max', 'label': 'N00', 'children': [
    {'type': 'min', 'label': 'N01', 'children': [
        {'type': 'max', 'label': 'N03', 'children': [
            {'type': 'min', 'label': 'N07', 'children': [
                {'type': 'max', 'label': 'N15', 'children': [{'value': 3, 'label': 'L1'}, {'value': 11, 'label': 'L2'}]},
                {'type': 'max', 'label': 'N16', 'children': [{'value': 13, 'label': 'L3'}, {'value': 13, 'label': 'L4'}]}]},
            {'type': 'min', 'label': 'N08', 'children': [
                {'type': 'max', 'label': 'N17', 'children': [{'value': 16, 'label': 'L5'}, {'value': 12, 'label': 'L6'}]},
                {'type': 'max', 'label': 'N18', 'children': [{'value': 11, 'label': 'L7'}, {'value': 14, 'label': 'L8'}]}]}]},
        {'type': 'max', 'label': 'N04', 'children': [
            {'type': 'min', 'label': 'N09', 'children': [
                {'type': 'max', 'label': 'N19', 'children': [{'value': 8, 'label': 'L9'}, {'value': 14, 'label': 'L10'}]},
                {'type': 'max', 'label': 'N20', 'children': [{'value': 19, 'label': 'L11'}, {'value': 17, 'label': 'L12'}]}]},
            {'type': 'min', 'label': 'N10', 'children': [
                {'type': 'max', 'label': 'N21', 'children': [{'value': 8, 'label': 'L13'}, {'value': 6, 'label': 'L14'}]},
                {'type': 'max', 'label': 'N22', 'children': [{'value': 13, 'label': 'L15'}, {'value': 5, 'label': 'L16'}]}]}]}]},
    {'type': 'min', 'label': 'N02', 'children': [
        {'type': 'max', 'label': 'N05', 'children': [
            {'type': 'min', 'label': 'N11', 'children': [
                {'type': 'max', 'label': 'N23', 'children': [{'value': 9, 'label': 'L17'}, {'value': 12, 'label': 'L18'}]},
                {'type': 'max', 'label': 'N24', 'children': [{'value': 9, 'label': 'L19'}, {'value': 16, 'label': 'L20'}]}]},
            {'type': 'min', 'label': 'N12', 'children': [
                {'type': 'max', 'label': 'N25', 'children': [{'value': 11, 'label': 'L21'}, {'value': 9, 'label': 'L22'}]},
                {'type': 'max', 'label': 'N26', 'children': [{'value': 5, 'label': 'L23'}, {'value': 4, 'label': 'L24'}]}]}]},
        {'type': 'max', 'label': 'N06', 'children': [
            {'type': 'min', 'label': 'N13', 'children': [
                {'type': 'max', 'label': 'N27', 'children': [{'value': 17, 'label': 'L25'}, {'value': 14, 'label': 'L26'}]},
                {'type': 'max', 'label': 'N28', 'children': [{'value': 7, 'label': 'L27'}, {'value': 7, 'label': 'L28'}]}]},
            {'type': 'min', 'label': 'N14', 'children': [
                {'type': 'max', 'label': 'N29', 'children': [{'value': 17, 'label': 'L29'}, {'value': 5, 'label': 'L30'}]},
                {'type': 'max', 'label': 'N30', 'children': [{'value': 6, 'label': 'L31'}, {'value': 16, 'label': 'L32'}]}]}]}]}]}}
