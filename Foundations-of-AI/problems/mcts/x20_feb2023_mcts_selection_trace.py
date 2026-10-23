TITLE = 'Exam · Feb 2023 · Continue the white player\'s MCTS tree with UCB1'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Feb 2023', 'MCTS', 'UCB1', 'selection']

STATEMENT = r"""
*Written exam of 9 February 2023 — Monte Carlo Tree Search, Question 2 replayed with UCB1.*

The MCTS tree of the exam, for the **white** player (white = MAX, to move at the root; black = MIN). Every node stores
**white's** wins / playouts. Action 0 is drawn as `a1`, action 1 as `a2`:

```text
                     N00 68/100                  white (MAX) to move
              a1 /                \ a2
          N01 34/59              N02 34/41        black (MIN) to move
        a1 /     \ a2          a1 /     \ a2
   N03 15/34   N04 19/25   N05 16/21   N06 18/20  leaves of the tree (no child expanded yet)
```

Question 2 of the exam asks which action is selected first, and from which node. Here you go further and run
**three complete iterations**, with selection by UCB1 ($C = 1.4$). The rollouts end with: white **loses**, white
**wins**, white **wins** (the same results as the exam's Question 3, whose paths are imposed instead — see the Feb 2023
quiz).

**Conventions** (the class example):

- $\text{UCB1}(n) = \dfrac{U(n)}{N(n)} + C\sqrt{\dfrac{\ln N(\text{Parent}(n))}{N(n)}}$, where $U = W$ when white chooses and
  $U = N - W$ when black chooses (black wants white to lose); ties → leftmost;
- selection descends while the node is fully expanded; expansion adds **one** child, `a1` before `a2`;
- backpropagation: $N + 1$ on every node of the path, $W + 1$ only when white wins;
- at the end MCTS plays the root move with the most playouts.

In the visualizer nodes are named by their path: N01 = `a1`, N02 = `a2`, N05 = `a2·a1`, N06 = `a2·a2`, and the first
child expanded below N05 is `a2·a1·a1` (written N05·a1 in the explanation).
"""

HINTS = [
    'At the root: UCB1(N01) = 34/59 + 1.4·√(ln 100 / 59) ≈ 0.967 and UCB1(N02) = 34/41 + 1.4·√(ln 100 / 41) ≈ 1.298.',
    'At N02 black chooses: N05 gives black (21 − 16)/21 ≈ 0.24, N06 only (20 − 18)/20 = 0.10. Add the exploration terms.',
    'N05 has no children, i.e. two untried actions: selection stops there and expansion adds N05·a1.',
]

EXPLANATION = r"""
| it. | selection (UCB1) | new node | result | root after |
|---|---|---|---|---|
| 1 | root: N01 0.967, **N02 1.298**; N02 (black): **N05 0.827**, N06 0.703 | N05·a1 | white loses | 68/101 |
| 2 | root: N01 0.968, **N02 1.274**; N02: **N05 0.850**, N06 0.705 | N05·a2 | white wins | 69/102 |
| 3 | root: **N02 1.273**; N02: **N05 0.827**; N05 (white, N = 23): a1 0/1 → 2.479, **a2 1/1 → 3.479** | N05·a2·a1 | white wins | 70/103 |

So the answer to the exam's Question 2 is: **action 1 from N00** (towards N02), the largest UCB1 at the root; the
descent then continues with action 0 from N02 (black's best UCB1 is N05) and expands below N05.

Final statistics: N00 70/103, N02 36/44, N05 18/24, N05·a1 0/1, N05·a2 2/2, N05·a2·a1 1/1; N01 and its subtree are
unchanged. MCTS would still **play action 0** (N01, 59 playouts): the move with the most playouts, not the last one
selected.

Note how black's perspective matters: maximising white's win rate at N02 would pick N06 (18/20 = 0.9 for white),
exactly the move black wants to avoid.
"""

VIZ = 'mcts'
CONFIG = {'C': 1.4, 'branching': 2, 'rollouts': [-1, 1, 1], 'init': {'W': 68, 'N': 100, 'children': [
    {'W': 34, 'N': 59, 'children': [{'W': 15, 'N': 34}, {'W': 19, 'N': 25}]},
    {'W': 34, 'N': 41, 'children': [{'W': 16, 'N': 21}, {'W': 18, 'N': 20}]}]}}
