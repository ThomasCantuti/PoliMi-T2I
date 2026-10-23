TITLE = 'Bandits: exploration vs exploitation'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['bandits', 'ε-greedy', 'UCB', 'exploration-exploitation']

QUESTIONS = [
    {
        'q': 'An arm has estimate $Q_t = 0.5$ after 4 rewards. The 5th reward is $R = 1$. With the sample-average update, what is the new estimate?',
        'options': ['0.55', '0.6', '0.75', '1.0'],
        'answer': 1,
        'explain': '$Q_{t+1} = Q_t + \\frac1t(R_t - Q_t) = 0.5 + \\frac15(1 - 0.5) = 0.6$ — the mean of 2 + 1 = 3 wins in 5 pulls.',
    },
    {
        'q': 'Why can a purely **greedy** agent perform badly on a bandit?',
        'options': [
            'It explores too much',
            'It may never try an arm that looks worse now but is actually better, so its estimate is never corrected',
            'It cannot compute sample averages',
            'It needs to know the true action values in advance',
        ],
        'answer': 1,
        'explain': 'Exploitation uses current knowledge for short-term benefit; without exploration the knowledge never improves (slides p. 436). With all estimates starting at 0, greedy may stick to the first arm forever.',
    },
    {
        'q': 'ε-greedy with $\\varepsilon = 0.1$ and $k = 5$ arms. With what probability does it pull the arm it currently believes is best?',
        'options': ['0.9', '0.92', '0.98', '0.1'],
        'answer': 1,
        'explain': 'With probability $1 - \\varepsilon = 0.9$ it exploits; with probability $\\varepsilon = 0.1$ it picks uniformly among 5 arms, which hits the best one with probability $0.1/5 = 0.02$. Total $0.92$.',
    },
    {
        'q': '"Optimism in the face of uncertainty" means…',
        'options': [
            'assume every arm is as good as its lower confidence bound',
            'pick the arm with the highest **upper** confidence bound: either it is really good, or it is uncertain and trying it reduces the uncertainty',
            'pick a random arm when unsure',
            'always pick the arm pulled the fewest times',
        ],
        'answer': 1,
        'explain': 'Slides p. 438–439: rank arms by the upper end of their confidence interval. A well-known good arm and a barely-tried arm can both be selected; the uncertainty of the second shrinks every time it is tried.',
    },
    {
        'q': 'In $\\text{UCB1}(n) = \\frac{U(n)}{N(n)} + C\\sqrt{\\frac{\\log N(\\text{Parent}(n))}{N(n)}}$, what happens with $C = 0$ and with $C \\to \\infty$?',
        'options': [
            '$C = 0$: pure exploration; $C \\to \\infty$: pure exploitation',
            '$C = 0$: pure exploitation; $C \\to \\infty$: pure exploration',
            'Both give random selection',
            '$C$ only changes the speed of the computation',
        ],
        'answer': 1,
        'explain': 'With $C = 0$ only the average $U/N$ counts (greedy). With a huge $C$ the bonus dominates and the least-visited node is always chosen (slides p. 445).',
    },
    {
        'q': 'Slide p. 442: $c\\sqrt{\\ln 10000 / N_t(a)}$ is $0.960c$ for $N_t(a) = 10$ and $0.043c$ for $N_t(a) = 5000$. What does this show?',
        'options': [
            'Arms pulled more often get a bigger bonus',
            'The exploration bonus shrinks as an arm is pulled more: its estimate is more reliable',
            'The bonus does not depend on $N_t(a)$',
            'The bonus is always below $0.1c$',
        ],
        'answer': 1,
        'explain': 'The bonus is the width of a confidence interval, proportional to $1/\\sqrt{N}$. Meanwhile it grows (slowly, $\\sqrt{\\ln t}$) for arms that are not pulled, so they are eventually re-tried.',
    },
    {
        'q': 'Step-by-step example (slide p. 446), $C = 1$: root 2/4, children $a_1$ = 2/3 and $a_2$ = 0/1. Which child does UCB1 select?',
        'options': [
            '$a_1$: $0.667 + 0.680 = 1.346$ vs $a_2$: $0 + 1.177 = 1.177$',
            '$a_2$: it has been visited less',
            '$a_1$: UCB1 always picks the highest win rate',
            'They tie',
        ],
        'answer': 0,
        'explain': '$\\sqrt{\\ln 4 / 3} = 0.680$ and $\\sqrt{\\ln 4 / 1} = 1.177$. With $C = 1$ $a_1$ wins; with $C = \\sqrt2$ the bonus of $a_2$ (1.665) overtakes $a_1$ (1.629).',
    },
    {
        'q': 'Which real situations are k-armed bandit problems? (select all)',
        'options': [
            'A doctor choosing among 3 treatments for successive patients (slides p. 432)',
            'Choosing which artwork to show for a video to maximize clicks (slides p. 433)',
            'Choosing which child of an MCTS node gets the next simulation',
            'Solving the 8-puzzle with A*',
        ],
        'answer': [0, 1, 2],
        'explain': 'Each is a repeated choice among options with unknown, noisy payoffs, where you learn by trying. MCTS selection is a bandit at every node — that is UCT. A* is deterministic search with known costs.',
    },
]
