TITLE = 'Exam · Jun & Jul 2026 · State values V(s) at convergence in a small maze'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['exam', 'Jun 2026', 'Jul 2026', 'V(s)', 'converged values']

STATEMENT = r"""
*Written exam of 11 June 2026 — Problem 2, Question 3; written exam of 8 July 2026 — Problem 2, Question 3.*

Consider the deterministic maze navigation problem below. An agent must learn how to reach the goal (G), moving on the
free positions, while avoiding the obstacles. It applies reinforcement learning with discount factor $\gamma = 0.5$
and learning rate $\beta = 0.2$; it can move up, down, left, right.

```text
 11 Jun 2026                              8 Jul 2026
 ┌───────┬───────┬───────┐                ┌───────┬───────┬───────┐
 │ (1,1) │ (1,2) │ (1,3) │                │ (1,1) │ (1,2) │ (1,3) │
 ├───────┼───────┼───────┤                ├───────┼───────┼───────┤
 │ (2,1) │ ##### │   G   │                │ (2,1) │ grey  │   G   │
 └───────┴───────┴───────┘                └───────┴───────┴───────┘
 reward 0 reaching the goal, −1 otherwise  reward 0 reaching the goal, −1 moving to a white
                                           position, −2 moving into the grey position
```

"For each free position, compute the final state values $V(s)$ that we expect to obtain when the learning process is
converged and the best action is always selected."
"""

QUESTIONS = [
    {
        'q': '11 Jun 2026: what is $V(1,3)$?',
        'options': ['−1', '0', '−0.5', '1'],
        'answer': 1,
        'explain': 'From (1,3) the best action is down into the goal: reward 0 and the episode ends, so $V(1,3) = 0$.',
    },
    {
        'q': '11 Jun 2026: what are $V(1,2)$, $V(1,1)$ and $V(2,1)$?',
        'options': [
            '−1, −2, −3',
            '−1, −1.5, −1.75',
            '−0.5, −0.75, −0.875',
            '−1, −1.5, −2',
        ],
        'answer': 1,
        'explain': '$V(1,2) = -1 + 0.5 \\cdot 0 = -1$; $V(1,1) = -1 + 0.5\\,(-1) = -1.5$; $V(2,1) = -1 + 0.5\\,(-1.5) = -1.75$ (its only useful move is up). **Model answer** (as the official one): the value of $s_t$ is the expected discounted sum of future payoffs, $V(s_t) = \\mathbb{E}[G_t] = \\mathbb{E}[\\sum_{k} \\gamma^k R_{t+k+1}]$, computed from the intermediate rewards and the discount factor; then the grid of values.',
    },
    {
        'q': 'Where does $\\beta = 0.2$ enter the computation?',
        'options': [
            'It multiplies every value',
            'Nowhere: the learning rate changes how fast the estimates move, not the values they converge to',
            'It replaces γ in the last step',
            'It is the reward of the goal',
        ],
        'answer': 1,
        'explain': 'Converged values depend only on rewards and γ. The data of β is a distractor in both exams.',
    },
    {
        'q': '8 Jul 2026: what is the value of the **grey** cell (2,2)?',
        'options': ['−2', '0', '−1', 'It has no value: it is an obstacle'],
        'answer': 1,
        'explain': 'The grey cell is a free position; the penalty is paid when **entering** it. From it, the best action is right, into the goal: reward 0, so $V(2,2) = 0$ (the official solution writes 0 in it).',
    },
    {
        'q': '8 Jul 2026: do the other values change with respect to 11 Jun 2026?',
        'options': [
            'No: −1.5, −1, 0 on the first row and −1.75 in (2,1); going through the grey cell is never better',
            'Yes: (1,2) becomes −2 because it can move into the grey cell',
            'Yes: (2,1) becomes −2 because its shortest path crosses the grey cell',
            'Yes: all values decrease by 1',
        ],
        'answer': 0,
        'explain': 'From (1,2): right gives $-1 + 0.5 \\cdot 0 = -1$, down into grey gives $-2 + 0.5 \\cdot 0 = -2$: keep −1. From (2,1): up gives $-1 + 0.5\\,(-1.5) = -1.75$, right into grey gives $-2 + 0 = -2$: keep −1.75. "The best action is always selected", so $V(s) = \\max_a Q(s, a)$.',
    },
]
