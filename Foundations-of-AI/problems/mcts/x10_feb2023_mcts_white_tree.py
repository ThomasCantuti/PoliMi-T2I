TITLE = 'Exam · Feb 2023 · MCTS for the white player: UCB1, selection, three iterations'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Feb 2023', 'MCTS', 'UCB1', 'backpropagation']

STATEMENT = r"""
*Written exam of 9 February 2023 — Monte Carlo Tree Search (8 points).*

Abstract game: white and black alternate, each has two actions (0 or 1), a game is either won (utility 1) or lost
(utility 0) — the game used in class for MCTS. Consider the MCTS tree below for the **white** player. As in the class
example, **every node stores the statistics of the player at the root (white)**, as wins/playouts:

```text
                 N00 68/100                 white to move
           0 /              \ 1
        N01 34/59         N02 34/41         black to move
       0 /    \ 1        0 /    \ 1
  N03 15/34  N04 19/25  N05 16/21  N06 18/20
```

$$\text{UCB1}(n) = \frac{U(n)}{N(n)} + C\sqrt{\frac{\log N(\text{Parent}(n))}{N(n)}} \qquad (\log = \text{natural logarithm})$$
"""

QUESTIONS = [
    {
        'q': '**Question 1.** Compute the UCB1 values of N01, N02 and N03 with $C = 1.4$.',
        'options': [
            'N01 = 0.967, N02 = 1.298, N03 = 0.926',
            'N01 = 0.576, N02 = 0.829, N03 = 0.441',
            'N01 = 0.834, N02 = 1.139, N03 = 0.761',
            'N01 = 0.967, N02 = 1.298, N03 = 0.956',
        ],
        'answer': 0,
        'explain': r'''**Model answer** (official, verified): N01 $= \frac{34}{59} + 1.4\sqrt{\frac{\ln 100}{59}} = 0.576 + 0.391 = 0.967$; N02 $= \frac{34}{41} + 1.4\sqrt{\frac{\ln 100}{41}} = 0.829 + 0.469 = 1.298$; N03 $= \frac{15}{34} + 1.4\sqrt{\frac{\ln 59}{34}} = 0.441 + 0.485 = 0.926$ — the parent of N03 is **N01** (N = 59), not the root. N00 has no UCB1: it has no parent ("not possible and not interesting").

Distractors: the second option forgets the exploration term, the third uses $\log_{10}$, the fourth uses the root's 100 visits for N03.

> **Trap (beyond the official answer):** 0.926 applies the formula to white's statistics. N03 is chosen by **black** (at N01 black is to move), and in the class convention black maximises *its own* win rate $(N - U)/N$: $\frac{19}{34} + 0.485 = 1.044$ for N03 against $\frac{6}{25} + 0.565 = 0.805$ for N04. If you report 0.926, say that it is white's value.''',
    },
    {
        'q': '**Question 2.** We now start another MCTS iteration with the selection step. Given the UCB1 values just computed, what is the **first action selected, and from which node**?',
        'options': [
            'Action 1 from the root N00 (towards N02), the child with the largest UCB1 (1.298 > 0.967)',
            'Action 0 from N00: N01 has more playouts (59 > 41)',
            'Action 1 from N02: N06 has the best win rate (18/20)',
            'Nothing is selected: the root is not fully expanded',
        ],
        'answer': 0,
        'explain': r'''**Model answer:** selection starts at the root and picks the child with the highest UCB1: N02 (1.298 > 0.967), i.e. **action 1 from N00**. The number of playouts decides the move to *play* at the end, not the selection. Continuing: at N02 it is black's turn; with black's win rates N05 gets $\frac{5}{21} + 1.4\sqrt{\frac{\ln 41}{21}} = 0.827$ and N06 $\frac{2}{20} + 0.603 = 0.703$, so black selects **N05** (action 0); N05 has no children, so it is expanded and a playout is run from the new node (replayed step by step in the Feb 2023 trace problem). The root is fully expanded (both actions have a child), so the last option is false.''',
    },
    {
        'q': 'What is the role of the constant $C$ in UCB1?',
        'options': [
            'It balances exploration and exploitation: the larger $C$, the more weight to rarely tried nodes (exploration); the smaller, the more weight to the win rate (exploitation)',
            'It is the number of playouts per iteration',
            'It discounts future rewards',
            'It must always be exactly $\\sqrt 2$, otherwise MCTS is wrong',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): $C$ influences the exploration/exploitation balance: the higher it is, the more exploration; the lower, the more exploitation. $C = 0$ is pure greedy selection on the win rate. $\\sqrt 2$ is the theoretical value for rewards in $[0, 1]$, but in practice $C$ is tuned (the slides\' example needs $C = 1$, this exam uses 1.4).',
    },
    {
        'q': r'''**Question 3.** Starting from the original tree, three iterations are performed (the paths are **given**, not chosen by UCB1):

1. actions 0, 1, 0 from the root, then a rollout: **white loses**;
2. actions 1, 1, 1, rollout: **white wins**;
3. actions 0, 0, 0, rollout: **white wins**.

What is the final tree?''',
        'options': [
            'N00 70/103; N01 35/61, N02 35/42; N03 16/35, N04 19/26, N05 16/21, N06 19/21; new nodes N03→0 1/1, N04→0 0/1, N06→1 1/1',
            'N00 70/103; N01 35/61, N02 35/42; N03 16/35, N04 20/26, N05 16/21, N06 19/21; new nodes N03→0 1/1, N04→0 1/1, N06→1 1/1',
            'N00 68/100 and N01–N06 unchanged; new nodes N03→0 1/1, N04→0 0/1, N06→1 1/1',
            'N00 70/103; N01 35/61, N02 35/42; N03 16/35, N04 19/26, N05 16/21, N06 19/21; no new nodes',
        ],
        'answer': 0,
        'explain': r'''**Model answer** (official picture, verified). Each iteration: selection along the given actions down to N03/N04/N06 (leaves of the tree), **expansion** of one new child (the third action), rollout from it, **backpropagation** to every node on the path: $N + 1$ everywhere, $U + 1$ only when white wins (all statistics are white's).

1. 0,1,0, loss: new node below N04 = 0/1; N04 19/26, N01 34/60, N00 68/101.
2. 1,1,1, win: new node below N06 = 1/1; N06 19/21, N02 35/42, N00 69/102.
3. 0,0,0, win: new node below N03 = 1/1; N03 16/35, N01 35/61, N00 70/103.

N05 is untouched (16/21). Distractor 2 counts the loss as a win; 3 updates only the new nodes; 4 forgets the expansion.''',
    },
    {
        'q': '"Write any comment about the process." Which comments are correct? (select all)',
        'options': [
            'Iteration 1 is not what UCB1 would choose from the original tree: selection would go to N02 first',
            'The moves made during each rollout are not added to the tree: only one new node per iteration',
            'In iteration 1 N04 gets $U + 1$ because black won, and black chose action 1 at N01',
            'With statistics stored for white, at black\'s levels selection should maximise black\'s win rate $(N - U)/N$',
        ],
        'answer': [0, 1, 3],
        'explain': 'The exercise imposes the paths to test **expansion and backpropagation** only: from the original tree, UCB1 would select N02 (1.298 > 0.967). Rollout states are forgotten (slide p. 418). All nodes store **white\'s** wins, so a black win adds nothing to $U$ anywhere — option 3 mixes in the other convention (wins of the player who moved into the node, AIMA Figure 6.10). Because of the class convention, black\'s choices use $(N - U)/N$.',
    },
]
