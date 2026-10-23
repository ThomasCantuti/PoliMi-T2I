TITLE = 'MCTS, AlphaZero and the four ways to build a player'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['MCTS', 'UCT', 'AlphaZero', 'summary']

QUESTIONS = [
    {
        'q': 'What is the order of the four phases of one MCTS iteration?',
        'options': [
            'Expansion → Selection → Simulation → Backpropagation',
            'Selection → Expansion → Simulation → Backpropagation',
            'Simulation → Selection → Expansion → Backpropagation',
            'Selection → Simulation → Expansion → Backpropagation',
        ],
        'answer': 1,
        'explain': 'Descend the tree with the tree policy (UCB1) until a node with an unexpanded move or a leaf; add one (or more) children; run a playout with the default policy (typically random) from the new node; update all the nodes on the path (slides p. 413–414).',
    },
    {
        'q': 'Which statements about MCTS are true? (select all)',
        'options': [
            'It does not need an evaluation function: random playouts are enough to evaluate states',
            'It is an anytime method: whenever it stops it can provide an answer',
            'It expands the game tree uniformly, like minimax with a depth limit',
            'Every playout is kept in the tree, node by node',
        ],
        'answer': [0, 1],
        'explain': 'MCTS builds a **sparse, asymmetric** tree: promising branches get more simulations (slides p. 410). Only one new node per iteration is added; the moves of the playout itself are forgotten (slide p. 418: "simulation has been forgotten").',
    },
    {
        'q': 'After the time is up, which move does MCTS return (AIMA Figure 6.11)?',
        'options': [
            'The child with the largest UCB1',
            'The child with the highest win rate $U/N$, whatever $N$',
            'The child with the highest number of playouts $N$',
            'A random child',
        ],
        'answer': 2,
        'explain': 'UCB1 contains an exploration bonus, and a raw win rate on a handful of playouts is unreliable (1/1 = 100%). Since selection sends simulations to the best moves, the most-visited child is the most robust choice.',
    },
    {
        'q': 'AIMA Figure 6.10: each node stores the wins of the player who moved into it. Path 37/100 → 60/79 → 16/53 → 27/35 → new node; the playout is a win for **black**, the player to move at the root. Which nodes get $U + 1$?',
        'options': [
            'All the nodes on the path',
            '60/79 and 27/35 (the nodes reached by a black move)',
            '37/100, 16/53 and the new node',
            'Only the new node',
        ],
        'answer': 1,
        'explain': 'The result becomes 61/80 and 28/36; the others only get $N + 1$: 37/101, 16/54, 0/1. A win for one player is a loss for the other, so the wins alternate along the path.',
    },
    {
        'q': 'Why was alpha-beta pruning only a weak-to-intermediate Go player (slides p. 406)? (select all)',
        'options': [
            'The branching factor is huge (around 250) and games last more than 200 moves',
            'It lacks a good evaluation function: similar positions can have completely different outcomes',
            'Go has chance nodes',
            'Go is not zero-sum',
        ],
        'answer': [0, 1],
        'explain': 'Go is deterministic, zero-sum and with perfect information. The problem is size and the lack of a reliable $e(s)$ — exactly the two things MCTS does not need.',
    },
    {
        'q': 'AlphaZero\'s network computes $f_\\theta(s) = (\\mathbf{p}, v)$. What are $\\mathbf{p}$ and $v$?',
        'options': [
            '$\\mathbf{p}$: probabilities of the moves in $s$; $v$: estimated probability that the current player wins from $s$',
            '$\\mathbf{p}$: the principal variation; $v$: the number of visits',
            '$\\mathbf{p}$: the parameters; $v$: the learning rate',
            '$\\mathbf{p}$: UCB1 values; $v$: the minimax value computed by search',
        ],
        'answer': 0,
        'explain': 'One network both evaluates positions ($v$, replacing random playouts) and suggests moves ($\\mathbf{p}$, guiding selection). Input: only the raw board and its history (slides p. 473–474).',
    },
    {
        'q': 'How does AlphaZero learn (slides p. 475–477)?',
        'options': [
            'From a database of human expert games',
            'By self-play: in every position an MCTS guided by $f_\\theta$ produces move probabilities $\\pi$ stronger than the raw $\\mathbf{p}$, and the network is trained to match $\\pi$ and the game outcome',
            'By hand-tuning the weights of a linear evaluation function',
            'By exhaustive minimax on small boards',
        ],
        'answer': 1,
        'explain': 'MCTS acts as a **policy improvement operator**: its search probabilities $\\pi$ are better than the network\'s own $\\mathbf{p}$, so the network learns from its own search. Reinforcement learning with lookahead search inside the training loop.',
    },
    {
        'q': 'The four options to build a tic-tac-toe player (slides p. 457–472). Match: hand-coded rules / minimax & alpha-beta / MCTS / AlphaZero. Which statement is **false**?',
        'options': [
            'Hand-coded rules require expertise and must be redone for every new game (Connect 4 vs Gomoku)',
            'Minimax with the utility explores all the matches: optimal, but exponential',
            'MCTS needs no evaluation function, but simulations are expensive and may not provide enough information',
            'AlphaZero needs a hand-designed evaluation function to start learning',
        ],
        'answer': 3,
        'explain': 'AlphaZero learns from scratch by self-play, from the board alone: it **learns** how to evaluate states from simulations (option #4). The other three statements are the slides\' pros and cons of options #1–#3.',
    },
]
