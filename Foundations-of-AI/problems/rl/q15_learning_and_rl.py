TITLE = 'Learning agents, rewards, values and policies'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['learning agent', 'MDP', 'policy', 'reward']

QUESTIONS = [
    {
        'q': 'In the learning-agent architecture (RL p. 3–4), which component decides the external actions?',
        'options': [
            'The learning element',
            'The critic',
            'The performance element',
            'The problem generator',
        ],
        'answer': 2,
        'explain': 'The performance element selects the actions: it is the whole agent we considered before (any of the four architectures). The learning element changes it, the critic gives feedback against a fixed performance standard, the problem generator suggests exploratory actions.',
    },
    {
        'q': 'Which statements describe reinforcement learning, as opposed to supervised learning? (select all)',
        'options': [
            'The agent performs actions that affect the environment',
            'For each input the correct output is given',
            'The feedback is a reward, possibly received long after the action that caused it',
            'The agent learns a sequence of actions that maximizes the long-term reward',
        ],
        'answer': [0, 2, 3],
        'explain': 'RL p. 7: supervised learning has desired outputs and direct feedback; RL has a decision process, a reward system and a long-term expectation. In sequential decision making we generally have no examples of correct actions (RL p. 14).',
    },
    {
        'q': 'An episode gives the rewards $r_{t+1} = 0$, $r_{t+2} = 0$, $r_{t+3} = 1$ and ends. With $\\gamma = 0.5$, what is $G_t$?',
        'options': ['1', '0.5', '0.25', '0.125'],
        'answer': 2,
        'explain': '$G_t = \\sum_k \\gamma^k r_{t+k+1} = 0 + 0.5 \\cdot 0 + 0.5^2 \\cdot 1 = 0.25$. The first reward is not discounted, the third is discounted twice.',
    },
    {
        'q': 'Why are future rewards discounted with $0 < \\gamma < 1$ (RL p. 30)?',
        'options': [
            'To make the agent prefer risky actions',
            'To keep the expected payoff finite: it is at most $R_{max}/(1-\\gamma)$',
            'Because the learning rate must be smaller than 1',
            'Because rewards are always negative',
        ],
        'answer': 1,
        'explain': 'Without discounting, the sum of rewards of a continuing task can be infinite. The geometric series bounds it by $R_{max}\\,\\frac{1}{1-\\gamma}$. As a side effect, a reward is worth more the sooner it arrives.',
    },
    {
        'q': 'Which reward function is the **action-penalty** representation (RL p. 32)?',
        'options': [
            '1 when the goal is reached, 0 otherwise',
            '−1 in every step that does not reach the goal, 0 once the goal is reached',
            '+1 for a win, −1 for a loss, 0 otherwise',
            'The negative Manhattan distance to the goal',
        ],
        'answer': 1,
        'explain': 'Goal-reward: 1 at the goal, 0 otherwise. Action-penalty: −1 until the goal, 0 there (the mountain car of RL p. 21 uses it). Both make the shortest path optimal.',
    },
    {
        'q': 'Which statements about value functions are true? (select all)',
        'options': [
            '$Q(s_t, a_t)$ is the expected future payoff when performing $a_t$ in $s_t$',
            '$V(s_t)$ is the expected future payoff starting from $s_t$',
            'Both decompose into the immediate reward $r_{t+1}$ plus the discounted value of the next state',
            '$V(s)$ is the reward received in $s$',
        ],
        'answer': [0, 1, 2],
        'explain': 'RL p. 34–35 (Bellman expectation equation): $V(s) = \\mathbb{E}[r_{t+1} + \\gamma V(s_{t+1}) \\mid s_t = s]$, and the same decomposition for $Q$. $V$ is a long-term expectation, not the immediate reward.',
    },
    {
        'q': 'With an **ε-greedy** policy, what does the agent do?',
        'options': [
            'Always the action with the highest Q',
            'With probability ε a random action, otherwise the action promising the highest payoff',
            'With probability ε the best action, otherwise a random one',
            'The action with the highest Q plus a bonus that shrinks with the number of visits',
        ],
        'answer': 1,
        'explain': 'RL p. 26. The greedy policy deterministically picks an action with maximal value; ε-greedy explores with probability ε. The last option is UCB, from the bandit lecture.',
    },
    {
        'q': 'What does the **Markov property** require of the environment (RL p. 28)?',
        'options': [
            'The environment is deterministic',
            '$s_{t+1}$ and $r_{t+1}$ depend only on $s_t$ and $a_t$',
            'Rewards are received only at the end of the episode',
            'The agent sees the whole state',
        ],
        'answer': 1,
        'explain': 'The next state and reward depend only on the current state and action, not on the history. The environment is then an MDP with one-step dynamics $p(s_{t+1}, r_{t+1} \\mid s_t, a_t)$, which may well be stochastic.',
    },
    {
        'q': 'A stochastic policy $\\pi(s, a)$ …',
        'options': [
            'returns the reward of $a$ in $s$',
            'returns the probability of selecting $a$ in $s$; for each $s$ the values are ≥ 0 and sum to 1',
            'cannot represent a deterministic policy',
            'is required by Q-learning',
        ],
        'answer': 1,
        'explain': 'RL p. 24. A deterministic policy is the special case that gives probability 1 to one action.',
    },
]
