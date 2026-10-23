TITLE = 'Evaluation functions, chance and more players'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['evaluation function', 'expectiminimax', 'multiplayer', 'homework']

QUESTIONS = [
    {
        'q': 'With the slides\' tic-tac-toe evaluation function (open lines for MAX minus open lines for MIN), what is $e(s)$ for X when X is in a **corner** and O in the **center**?',
        'options': ['$+1$', '$-1$', '$0$', '$+3$'],
        'answer': 1,
        'explain': 'Open for X = lines without O = 8 − 4 (the center lies on 4 lines) = 4. Open for O = lines without X = 8 − 3 (a corner lies on 3 lines) = 5. $e = 4 - 5 = -1$.',
    },
    {
        'q': 'In depth-limited search, what happens at the cutoff depth $h$?',
        'options': [
            'The search returns $0$ for every state at depth $h$',
            'Non-terminal states at depth $h$ are scored with $e(s)$; terminal states still use their utility',
            'All states at depth $h$ are scored with $e(s)$, even terminal ones',
            'The search continues with random moves until the end of the game',
        ],
        'answer': 1,
        'explain': 'A terminal state is a real result and must keep its utility; $e(s)$ only estimates non-terminal states. The guarantee of optimal play is lost (slides p. 383). Random moves to the end would be a rollout — that is MCTS.',
    },
    {
        'q': 'Why do the slides suggest normalizing $e(s)$ into $[-1, +1]$ when utilities are $\\pm 1$?',
        'options': [
            'It makes alpha-beta prune more',
            'It is required for minimax to terminate',
            'So that a heuristic estimate is never preferred to (or tied with) an actual win or loss',
            'Normalized values are cheaper to compute',
        ],
        'answer': 2,
        'explain': 'If $e$ can reach 8 while a win is worth 1, a search may prefer a non-terminal position with a big $e$ over a real win (the previous problem shows a tie that makes X miss a win in one).',
    },
    {
        'q': 'Which statements are true? (select all)',
        'options': [
            'In minimax, an order-preserving transformation of the leaf values never changes the chosen move',
            'In expectiminimax, an order-preserving transformation of the leaf values can change the chosen move',
            'In expectiminimax, a positive linear transformation $a\\,x + b$ ($a > 0$) can change the chosen move',
            'In games of chance it is enough that $e(s)$ ranks the positions correctly',
        ],
        'answer': [0, 1],
        'explain': 'Max and min only compare values, so only their order matters. Averages depend on magnitudes: 2, 3, 1, 4 → 20, 30, 1, 400 flips the decision (slides p. 397). A positive linear map scales every average the same way and keeps the decision, so with chance nodes $e(s)$ should be a positive linear function of the expected utility.',
    },
    {
        'q': 'MAX chooses between two chance nodes: A with outcomes 4 and 6 (probability 0.5 each), and B with outcomes 0 (probability 0.25) and 8 (probability 0.75). Expectimax value and move?',
        'options': ['5, move A', '6, move B', '8, move B', '4, move A'],
        'answer': 1,
        'explain': 'A = 0.5·4 + 0.5·6 = 5. B = 0.25·0 + 0.75·8 = 6. MAX takes the larger average: 6, move B. Minimax (worst case) would have picked A (4 > 0).',
    },
    {
        'q': 'Slide p. 398: a MAX root over three chance nodes with leaves [3, 12, 9], [2, 4, 6], [0, 6, 15] (probability 1/3 each). Why can nothing be pruned if we do **not** know the range of the utilities?',
        'options': [
            'Because chance nodes always have to be fully expanded by definition',
            'Because an unseen outcome could be arbitrarily large, so no partial average bounds the chance node from above',
            'Because MAX nodes cannot prune',
            'Because the probabilities are equal',
        ],
        'answer': 1,
        'explain': 'With the range [0, 15], after 2 and 4 the second node is at most (2 + 4 + 15)/3 = 7 ≤ 8 and 6 is pruned; likewise 15 in the third node. Without an upper bound on the utility the bound is $+\\infty$.',
    },
    {
        'q': 'Three players (red at the root, then blue, then green) each maximize **their own** component of the utility tuple. Leaves left to right: (1,6,6) (7,1,2) (6,1,2) (7,2,1) (5,1,7) (1,5,2) (7,7,1) (5,2,5). What tuple is backed up to the root (slides p. 401)?',
        'options': ['(1, 6, 6)', '(5, 1, 7)', '(5, 2, 5)', '(7, 7, 1)'],
        'answer': 2,
        'explain': 'Green (3rd component): (1,6,6), (6,1,2), (5,1,7), (5,2,5). Blue (2nd): max(6, 1) → (1,6,6); max(1, 2) → (5,2,5). Red (1st): max(1, 5) → **(5,2,5)**. Values become tuples; players may cooperate or compete.',
    },
    {
        'q': 'Homework (slides p. 402): your opponent runs a depth-2 minimax, uses its result 80% of the time and moves randomly otherwise. What tree search should you use?',
        'options': [
            'Plain minimax: always assume the worst case',
            'An expectimax-style search: model the opponent\'s nodes as chance nodes — probability 0.8 + 0.2/k on the move its depth-2 minimax would pick, 0.2/k on each of the other k − 1 moves',
            'Alpha-beta with perfect move ordering',
            'Greedy search on $e(s)$',
        ],
        'answer': 1,
        'explain': 'When you have a probabilistic model of the opponent, its nodes are no longer MIN nodes but **chance** nodes with known probabilities (with probability 0.2 it plays uniformly among its k moves, which may also hit the minimax move). You maximize expected utility, as in expectimax.',
    },
    {
        'q': 'Quiz time (slides p. 455): what do you expect in tic-tac-toe? (select all)',
        'options': [
            'Minimax vs a random player: minimax never loses',
            'Two minimax players: every game ends in a draw',
            'Minimax vs alpha-beta: alpha-beta wins most games because it searches faster',
            'Alpha-beta vs a well-tuned MCTS with many playouts: mostly draws, alpha-beta never loses',
        ],
        'answer': [0, 1, 3],
        'explain': 'Tic-tac-toe is a draw under perfect play. Minimax and alpha-beta compute the same values and moves, so they draw every time. MCTS converges to optimal play as the number of playouts grows; with few playouts it may blunder and lose against alpha-beta.',
    },
]
