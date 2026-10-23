TITLE = 'Exam · Jan 2022 · Minimax and alpha-beta with final α, β at every node'
DIFFICULTY = 'hard'
KIND = 'trace'
TAGS = ['exam', 'Jan 2022', 'alpha-beta', 'α/β bounds', 'minimax']

STATEMENT = r"""
*Written exam of 25 January 2022 — Games (8 points).*

Consider the game tree below (MAX at the root, then MIN and MAX alternate; the leaves are utilities for MAX).

```text
                                     max00                                       MAX
                   ┌───────────────────┴───────────────────┐
                 min01                                   min02                   MIN
         ┌─────────┴─────────┐                   ┌─────────┴─────────┐
       max03               max04               max05               max06         MAX
    ┌────┴────┐         ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
  min07     min08     min09     min10     min11     min12     min13     min14    MIN
  ┌─┴──┐    ┌─┴──┐    ┌─┴──┐    ┌─┴──┐    ┌─┴──┐    ┌─┴──┐    ┌─┴──┐    ┌─┴──┐
 20   11    5   13   12   15    9   34   10    6   20    2    5    9   23   13
```

**Question 1.** Apply the minimax algorithm and report the minimax value of each node.

**Question 2.** Apply alpha-beta pruning and, for each node, specify (i) whether it was pruned or evaluated;
in the latter case (ii) the node value and the **final** values of $\alpha$ and $\beta$ when the procedure ends
at that node. Also say which leaves are pruned. Children are generated and explored **left to right**.

**Conventions** (the course's alpha-beta, AIMA Figure 6.7): a node receives its parent's **current** $\alpha, \beta$;
MAX: `if v2 > v: v = v2; α = max(α, v)` then `if v ≥ β: prune`; MIN: `if v2 < v: v = v2; β = min(β, v)` then
`if v ≤ α: prune`. The leaves are named L1 … L16 from left to right.

In the trace you predict the $(\alpha, \beta)$ each node **receives**, every cut-off and every returned value; the
**final** $\alpha, \beta$ asked by the exam are the values shown on each node when it returns (also in the
explanation table).
"""

HINTS = [
    'Question 1 is plain minimax, bottom-up: MIN nodes take the minimum of their two leaves, then MAX the maximum, and so on. The root is 11.',
    'After min01 returns 11, the root has α = 11: every node of the right half receives α = 11.',
    'max04 receives β = 11 from min01. Its first child is worth 12 ≥ 11: MIN would never let the game reach max04.',
    'min11 sees 10 first: 10 ≤ α = 11, so it is cut off and returns "≤ 10". max05 then only gets bounds below 11, and min02 is cut off after max05.',
]

EXPLANATION = r"""
**Question 1 — minimax values** (official solution, verified):

| node | value | node | value |
|---|---|---|---|
| max00 | **11** | min08 | 5 |
| min01 | 11 | min09 | 12 |
| min02 | 6 | min10 | 9 |
| max03 | 11 | min11 | 6 |
| max04 | 12 | min12 | 2 |
| max05 | 6 | min13 | 5 |
| max06 | 13 | min14 | 13 |
| min07 | 11 | | |

**Question 2 — alpha-beta** (identical to the official table):

| node | pruned? | final α | final β | value | received (α, β) |
|---|---|---|---|---|---|
| max00 | no | 11 | +∞ | 11 | (−∞, +∞) |
| min01 | no | −∞ | 11 | 11 | (−∞, +∞) |
| min02 | no | 11 | 10 | 10 (≤ 10) | (11, +∞) |
| max03 | no | 11 | +∞ | 11 | (−∞, +∞) |
| max04 | no | 12 | 11 | 12 (≥ 12, cut-off) | (−∞, 11) |
| max05 | no | 11 | +∞ | 10 (≤ 10) | (11, +∞) |
| max06 | **yes** | | | | |
| min07 | no | −∞ | 11 | 11 | (−∞, +∞) |
| min08 | no | 11 | 5 | 5 (cut-off) | (11, +∞) |
| min09 | no | −∞ | 11 | 12 | (−∞, 11) |
| min10 | **yes** | | | | |
| min11 | no | 11 | 10 | 10 (≤ 10) | (11, +∞) |
| min12 | no | 11 | 2 | 2 | (11, +∞) |
| min13 | **yes** | | | | |
| min14 | **yes** | | | | |

Leaves, left to right: 20 11 5 ~~13~~ 12 15 ~~9~~ ~~34~~ 10 ~~6~~ 20 2 ~~5~~ ~~9~~ ~~23~~ ~~13~~ — 8 of the 16 leaves are
pruned. The root value (11) and the move (towards min01) are the minimax ones.

**How to fill the α/β columns.** α only changes at MAX nodes and β only at MIN nodes, so a node's "other" bound is
just the one it received: min09 keeps β = 11 (its leaves 12 and 15 never go below 11), max05 keeps α = 11 (its children
return only 10 and 2). A MAX node that cuts off ends with α ≥ β (max04: 12 ≥ 11), a MIN node that cuts off with
β ≤ α (min02, min08, min11).

> **Exam trap:** max05 and min02 return 10 although their true minimax value is 6: after a cut-off the returned number
> is only a **bound** (written "10 (≤ 10)" in the official table). It is good enough, because MAX already has 11.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'askAlphaBeta': True, 'tree': {
    'type': 'max', 'label': 'max00', 'children': [
        {'type': 'min', 'label': 'min01', 'children': [
            {'type': 'max', 'label': 'max03', 'children': [
                {'type': 'min', 'label': 'min07', 'children': [{'value': 20, 'label': 'L1'}, {'value': 11, 'label': 'L2'}]},
                {'type': 'min', 'label': 'min08', 'children': [{'value': 5, 'label': 'L3'}, {'value': 13, 'label': 'L4'}]}]},
            {'type': 'max', 'label': 'max04', 'children': [
                {'type': 'min', 'label': 'min09', 'children': [{'value': 12, 'label': 'L5'}, {'value': 15, 'label': 'L6'}]},
                {'type': 'min', 'label': 'min10', 'children': [{'value': 9, 'label': 'L7'}, {'value': 34, 'label': 'L8'}]}]}]},
        {'type': 'min', 'label': 'min02', 'children': [
            {'type': 'max', 'label': 'max05', 'children': [
                {'type': 'min', 'label': 'min11', 'children': [{'value': 10, 'label': 'L9'}, {'value': 6, 'label': 'L10'}]},
                {'type': 'min', 'label': 'min12', 'children': [{'value': 20, 'label': 'L11'}, {'value': 2, 'label': 'L12'}]}]},
            {'type': 'max', 'label': 'max06', 'children': [
                {'type': 'min', 'label': 'min13', 'children': [{'value': 5, 'label': 'L13'}, {'value': 9, 'label': 'L14'}]},
                {'type': 'min', 'label': 'min14', 'children': [{'value': 23, 'label': 'L15'}, {'value': 13, 'label': 'L16'}]}]}]}]}}
