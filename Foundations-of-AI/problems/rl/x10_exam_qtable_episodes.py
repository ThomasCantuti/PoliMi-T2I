TITLE = 'Exam · Aug 2022 & Jan 2023 · Q-table after given episodes, and at convergence'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Aug 2022', 'Jan 2023', 'Q-learning', 'Q-table']

STATEMENT = r"""
*Written exam of 30 August 2022 — Reinforcement Learning (8 points); written exam of 18 January 2023 — Problem 2.*

Consider the grid below: the black cell is an obstacle, S the start, G the goal. Cells are $(r, c)$ = row, column. The
agent moves north, east, south, west; it may occupy any free cell, S and G, and it is **not allowed** to move toward an
obstacle or outside the grid (from (2,1) it can only go north or south). Q-learning with discount factor
$\gamma = 0.5$ and learning rate $\beta = 0.25$; the Q-table is initialized with zeros.

```text
     1   2   3
 1 [ S ][   ][   ]
 2 [   ][###][   ]
 3 [   ][   ][ G ]
```

- **30 Aug 2022:** reward 1 when the agent reaches the goal, 0 otherwise.
- **18 Jan 2023:** reward 0 when the agent reaches the goal, −1 otherwise.

In every training episode the agent starts in S and performs east, east, south, south, reaching the goal.
Compute the answers on paper first, then pick the option.
"""

QUESTIONS = [
    {
        'q': '30 Aug 2022, Question 1: after the first episode, which entries of the Q-table are non-zero?',
        'options': [
            'All four actions taken, each at 0.25',
            'Only $Q((2,3), \\text{south}) = 0.25$',
            'Only $Q((2,3), \\text{south}) = 1$',
            'None: Q-learning needs at least two episodes',
        ],
        'answer': 1,
        'explain': 'Every update before the last one computes $0 + 0.25\\,(0 + 0.5 \\cdot 0 - 0) = 0$. The last step enters the goal: $Q((2,3), S) = 0 + 0.25\\,(1 - 0) = 0.25$, with no discounted term because the episode ends. **Model answer:** the table with 0.25 in ((2,3), south) and zeros elsewhere, plus this one-line computation.',
    },
    {
        'q': '30 Aug 2022, Question 2: after the second episode, what is $Q((1,3), \\text{south})$?',
        'options': ['0', '0.03125', '0.0625', '0.125'],
        'answer': 1,
        'explain': 'Now the max over the actions of (2,3) is 0.25 (from episode 1): $Q((1,3), S) = 0 + 0.25\\,(0 + 0.5 \\cdot 0.25 - 0) = 0.03125$ (the official table rounds it to 0.031).',
    },
    {
        'q': '30 Aug 2022, Question 2: after the second episode, what is $Q((2,3), \\text{south})$?',
        'options': ['0.25', '0.4375', '0.5', '0.5625'],
        'answer': 1,
        'explain': '$0.25 + 0.25\\,(1 - 0.25) = 0.4375$. The two updates of episode 2 happen in order, and $Q((1,3), S)$ used the old 0.25. All the other entries are still 0: the reward travels backwards one step per episode.',
    },
    {
        'q': '30 Aug 2022, Question 3: after convergence, what is $Q((1,2), \\text{west})$?',
        'options': ['0', '0.0625', '0.125', '0.25'],
        'answer': 1,
        'explain': 'West leads to (1,1) whose best value is 0.125 (a shortest path of 4 moves: $0.5^3$). So $Q((1,2), W) = 0 + 0.5 \\cdot 0.125 = 0.0625$. Full converged table: (1,1) E 0.125, S 0.125; (1,2) E 0.25, W 0.0625; (1,3) S 0.5, W 0.125; (2,1) N 0.0625, S 0.25; (2,3) N 0.25, S 1; (3,1) N 0.125, E 0.5; (3,2) E 1, W 0.25.',
    },
    {
        'q': '30 Aug 2022, Question 3: after convergence, what is $Q((2,3), \\text{north})$?',
        'options': ['0', '0.25', '0.5', '1'],
        'answer': 1,
        'explain': 'Going north and then acting optimally (south, south) gives the rewards 0, 0, 1: discounted, $0.5^2 = 0.25$. **Model answer** (as in the official solution): at convergence each entry is the expected discounted cumulative reward $\\mathbb{E}[\\sum_k \\gamma^k R_{t+k+1}]$ of taking that action and then the best ones.',
    },
    {
        'q': '18 Jan 2023, Question 1 (action penalty): after the first episode, which entries are non-zero?',
        'options': [
            'Only $Q((2,3), \\text{south})$',
            '$Q((1,1), E)$, $Q((1,2), E)$ and $Q((1,3), S)$, each −0.25',
            'All four actions taken, each −0.25',
            'All four actions taken: −0.25, −0.25, −0.25 and 0.25',
        ],
        'answer': 1,
        'explain': 'Each step that does not reach the goal gets $r = -1$: $0 + 0.25\\,(-1 + 0.5 \\cdot 0 - 0) = -0.25$. The step into the goal gets $r = 0$ and no future, so it stays 0. The reward design decides which entries move first.',
    },
    {
        'q': 'Same setting as 18 Jan 2023: if the same episode is repeated a second time, what is $Q((1,1), \\text{east})$ after it?',
        'options': ['−0.25', '−0.375', '−0.4375', '−0.5'],
        'answer': 2,
        'explain': '$\\max_b Q((1,2), b) = \\max(-0.25, 0) = 0$: west from (1,2) was never tried and is still 0. So $-0.25 + 0.25\\,(-1 + 0.5 \\cdot 0 + 0.25) = -0.4375$. The same happens to the next two entries. Zero initialization is **optimistic** under action penalty: untried actions look better, which pushes exploration.',
    },
]
