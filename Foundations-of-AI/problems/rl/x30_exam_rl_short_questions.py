TITLE = 'Exam · Short questions on reinforcement learning (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Q-learning', 'rewards', 'Q-table size']

STATEMENT = r"""
Short questions from the written exams (25 Jan 2022, 20 Jun 2024, 11 Jun 2025, 8 Sep 2025, 6 Feb 2026, 31 Aug 2026).
In the exam each answer must be **adequately motivated** in a few lines: read the model answer in each explanation,
it is what you should write.
"""

QUESTIONS = [
    {
        'q': '6 Feb 2026: "Write the formula to compute the value of a state at time $t$." Which one?',
        'options': [
            '$V(s_t) = r_{t+1}$',
            '$V(s_t) = \\mathbb{E}[G_t] = \\mathbb{E}\\left[\\sum_{k=0}^{\\infty} \\gamma^k r_{t+k+1}\\right]$',
            '$V(s_t) = \\sum_{k=0}^{\\infty} \\beta^k r_{t+k}$',
            '$V(s_t) = \\max_a r(s_t, a)$',
        ],
        'answer': 1,
        'explain': '**Model answer:** the value of the state $s_t$ is the expected discounted sum of future payoffs, $V(s_t) = \\mathbb{E}[G_t] = \\mathbb{E}[\\sum_{k=0}^{\\infty}\\gamma^k R_{t+k+1}]$. γ is the discount factor (β is the learning rate, unrelated), and the first reward is $r_{t+1}$.',
    },
    {
        'q': '31 Aug 2026: a colleague uses UCB to solve a reinforcement learning problem. Is it appropriate, or would Q-learning be better?',
        'options': [
            'UCB is always better: it explores more cleverly than ε-greedy',
            'It depends: UCB fits tasks with one immediate decision (immediate rewards); with delayed rewards, as in maze navigation, Q-learning is the right choice',
            'Q-learning is always better, UCB only works for games',
            'They are the same algorithm with different names',
        ],
        'answer': 1,
        'explain': '**Model answer:** it depends on the problem. UCB is designed for tasks with one immediate decision and not a sequential decision process: if only immediate rewards matter, UCB is appropriate. If the task involves delayed rewards (e.g. maze navigation, where the reward depends on previous actions), Q-learning is the appropriate choice.',
    },
    {
        'q': '8 Sep 2025: what is the main difference between a multi-armed bandit problem and the usual reinforcement learning scenario, and which method fits a bandit?',
        'options': [
            'In a bandit the actions have no consequences on future rewards, in RL they may have long-term consequences; for a bandit, UCB',
            'A bandit has a continuous state space; for a bandit, Q-learning',
            'In a bandit rewards are deterministic; for a bandit, minimax',
            'There is no difference; ε-greedy for both',
        ],
        'answer': 0,
        'explain': '**Model answer:** in a multi-armed bandit the action the agent performs does not affect future rewards, while in the usual RL scenario actions may have long-term consequences. I would apply UCB (it balances exploration and exploitation with a confidence bound).',
    },
    {
        'q': '11 Jun 2025: a maze with N free positions and four moves is solved with tabular Q-learning (reward 1 at the exit). What are its space and time complexity?',
        'options': [
            'Space O(4N) for the Q-table; time cannot be bounded, because optimality is only asymptotic (every state–action pair must be tried infinitely often)',
            'Space O(N), time O(N log N)',
            'Space O(4^N), time O(4^N)',
            'Space O(1), time O(N)',
        ],
        'answer': 0,
        'explain': '**Model answer:** the space is the Q-table, 4N entries. To guarantee optimality every state–action pair must be explored an infinite number of times, so optimality is asymptotic and the time complexity cannot be evaluated — unlike A*, whose time is exponential but bounded.',
    },
    {
        'q': '11 Jun 2025: Q-learning vs computing (with A*) and memorizing the optimal path from every state. Which differences are correct? (select all)',
        'options': [
            'Q-learning implements a utility-based agent, the A* solution a goal-based agent',
            'Q-learning also computes the value of suboptimal actions; A* only returns the best action in each state',
            'A* has an exponential but bounded time; Q-learning has no such bound (asymptotic optimality)',
            'Q-learning is one sequential process, while the A* runs are many searches that could be parallelized',
        ],
        'answer': [0, 1, 2, 3],
        'explain': 'All four are in the official answer. Note also that the repeated A* runs can reuse the paths already computed (a state on an optimal path inherits the rest of the path).',
    },
    {
        'q': '20 Jun 2024: a 6×6 two-player disc game gives each player a score at the end. How would you define the reward for a tabular Q-learning player?',
        'options': [
            'A reward after every move equal to the number of discs placed',
            'Reward only at the end of the game: +1 win, −1 loss, 0 otherwise (or the score difference, so winning by more is rewarded more)',
            'A reward of 1 for every legal move',
            'The minimax value of the position after every move',
        ],
        'answer': 1,
        'explain': '**Model answer:** the outcome is only known at the end, so the reward is given at the end of the game: +1 when the player wins, −1 when it loses, 0 otherwise. The score difference can also be used, so a larger win is rewarded more. This is the tic-tac-toe design of RL p. 57.',
    },
    {
        'q': '20 Jun 2024: the minimax tree of that game has $4!\\,12!\\,20!$ nodes and a move can be placed in any of the 36 positions. Most accurate upper bound on the size of the Q-table?',
        'options': ['$4!\\,12!\\,20!$', '$36^{36}$', '$4!\\,12!\\,20! \\times 36$', '$36!$'],
        'answer': 2,
        'explain': 'Size of a Q-table = (number of states) × (number of actions). The states are bounded by the nodes of the game tree, the actions by the 36 positions. The official solution adds that the two players might keep separate Q-tables.',
    },
    {
        'q': '25 Jan 2022: Criss-Cross solitaire (17 cells, 8 white and 8 black tokens, one empty cell; 8 actions moving the empty cell) as an RL problem. How many entries has the Q-table?',
        'options': [
            '$17 \\times 8$',
            '$17! \\times 8$',
            '$17 \\times \\binom{16}{8} \\times 8 = 1\\,750\\,320$',
            '$2^{17} \\times 8$',
        ],
        'answer': 2,
        'explain': '**Model answer:** states × actions. The empty cell can be in any of 17 positions; the other 16 hold 8 white and 8 black tokens: choosing the 8 white positions fixes the black ones, $\\binom{16}{8} = 12870$. With 8 actions: $17 \\cdot 12870 \\cdot 8$. The reward can be 1 at the goal and 0 otherwise (or −1 until the goal); learning rate and discount factor are set by experimentation. A reasonable over-estimate is accepted, an under-estimate is a mistake.',
    },
]
