TITLE = 'Search vs learning, minimax vs Q-learning'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['search vs RL', 'tic-tac-toe', 'tabular limits', 'deep Q-learning']

QUESTIONS = [
    {
        'q': 'In the 10×10 navigation example (RL p. 40–48), what does each approach compute?',
        'options': [
            'Both compute one path from the start to the goal',
            'A* computes one solution path; Q-learning an action-value function, i.e. the best action for every position',
            'A* computes the best action for every position; Q-learning one path',
            'Both compute an action-value function',
        ],
        'answer': 1,
        'explain': '"Search finds a solution, reinforcement learning an action value function" (RL p. 46). The arrows of RL p. 47 give the best action from **every** cell, not only from the start.',
    },
    {
        'q': 'What does Q-learning need that A* does not, and vice versa? (select all)',
        'options': [
            'Q-learning needs many episodes of experience (about 200 in the 10×10 example)',
            'A* needs a model of the problem: actions, results, step costs (and a heuristic)',
            'Q-learning needs an admissible heuristic',
            'A* needs a reward function',
        ],
        'answer': [0, 1],
        'explain': 'Q-learning learns by acting, with only rewards as feedback: it needs experience. A* plans with a model and needs no experience. Neither of the last two is true.',
    },
    {
        'q': 'In the slides\' empty grid the converged values go 0.440, 0.463, 0.488, … moving one cell closer to the goal. What does the ratio tell you?',
        'options': [
            'The learning rate is 0.95',
            'The discount factor is 0.95: each step farther from the goal multiplies the value by γ',
            'ε is 0.05',
            'Nothing: the values are random',
        ],
        'answer': 1,
        'explain': 'With goal-reward, a cell $d$ moves from the goal has value $\\gamma^{d-1}$; consecutive cells differ by a factor $\\gamma = 0.440/0.463 = 0.95$. The learning rate never appears in converged values.',
    },
    {
        'q': 'Tic-tac-toe (RL p. 57–60): when the Q-learner (playing X) moves in $s_t$, what is its next state?',
        'options': [
            '$s_{t+1}$, the board right after its move',
            '$s_{t+2}$, the board after the opponent\'s reply: the opponent is part of the environment',
            'The final board of the match',
            'The board with the best reply of a minimax opponent',
        ],
        'answer': 1,
        'explain': 'The learner only acts when it is X\'s turn; between its moves the opponent plays, so from its point of view the opponent is part of the environment (RL p. 60). That is why the training opponent shapes what is learned.',
    },
    {
        'q': 'Why does Q-learning learn to draw against **Minimax** in about 100 games but against **Random Minimax** only after about 5000 (RL p. 64, 67)?',
        'options': [
            'Random Minimax is a weaker player',
            'Minimax is deterministic, so the environment is deterministic; Random Minimax picks randomly among optimal moves, so the same board and move can lead to different next boards',
            'Random Minimax uses alpha-beta pruning',
            'Against Minimax the learner plays first',
        ],
        'answer': 1,
        'explain': 'Both opponents are optimal. Against the deterministic one the learner only has to answer one fixed strategy; against the stochastic one it must learn a reply to every optimal line, and noisy outcomes slow learning down.',
    },
    {
        'q': 'Which statements are in "Some thoughts about Minimax and tabular Q-learning" (RL p. 74)? (select all)',
        'options': [
            'Tabular Q-learning, like minimax and alpha-beta, is feasible only for a small number of states',
            'Minimax and alpha-beta play optimally from the start; Q-learning must be trained',
            'Q-learning can learn an optimal strategy against any opponent, even a random one',
            'Q-learning needs an evaluation function',
        ],
        'answer': [0, 1, 2],
        'explain': 'Q-learning uses only the rules and the final reward, no evaluation function. Its quality depends on the opponent used for training. Minimax values mean "at least": they assume an optimal opponent and can exploit its weaknesses.',
    },
    {
        'q': 'Replacing the Q-table with a deep neural network (RL p. 38, 75) …',
        'options': [
            'guarantees convergence to the optimal values',
            'is needed when the number of states is huge, but convergence is not guaranteed: we learn the q-values and how to approximate them at the same time',
            'removes the need for exploration',
            'turns Q-learning into minimax',
        ],
        'answer': 1,
        'explain': 'The table is a function from state–action pairs to q-values, so it can be approximated. The approximator works on intermediate estimates while also providing them to the learning: no convergence guarantee.',
    },
]
