TITLE = 'Exam · Short questions on MCTS (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'MCTS', 'UCB1', 'minimax vs MCTS', 'true/false']

QUESTIONS = [
    {
        'q': '*Aug 2022 (4 points).* A student asks what makes Monte Carlo Tree Search so different from minimax and alpha-beta pruning: what are the most important **conceptual** differences? (select all)',
        'options': [
            'MCTS is an anytime algorithm: it can be stopped at any time and still return an answer, while vanilla minimax and alpha-beta must complete the search',
            'MCTS evaluates states by simulations (playouts), so it needs no evaluation function $e(s)$ and no domain knowledge beyond the legal moves; depth-limited minimax/alpha-beta need a hand-crafted $e(s)$',
            'MCTS builds an asymmetric tree, focusing the search on the most promising parts of the search space',
            'MCTS always finds the minimax-optimal move with fewer nodes than alpha-beta',
            'MCTS needs perfect move ordering to work well',
        ],
        'answer': [0, 1, 2],
        'explain': '**Model answer** (official): (1) MCTS is anytime — it can be stopped at any time and still provides an answer, whereas vanilla minimax and alpha-beta need to complete the process; (2) depth-limited minimax/alpha-beta require an evaluation function encoding domain knowledge (e.g. a score for a chess position), while MCTS evaluates states with simulations and needs only the feasible actions in each state; (3) MCTS builds an **asymmetric** tree focused on the promising area, whereas for minimax/alpha-beta all branches are equally important. MCTS gives no optimality guarantee with a finite budget (option 4), and move ordering is an alpha-beta concern (option 5).',
    },
    {
        'q': '*Feb 2024 (Q5).* "Monte Carlo Tree Search will perform optimally against an optimal opponent." True or false?',
        'options': [
            'True: UCB1 guarantees the optimal move at every iteration',
            'False: its quality depends on the number of playouts; with a finite budget its statistics are estimates and it can choose a sub-optimal move',
            'True, because MCTS is equivalent to minimax',
            'False, because MCTS can only play against random opponents',
        ],
        'answer': 1,
        'explain': '**Model answer** (official): false — the performance of MCTS depends on the number of rollouts (playouts) performed. The win rates are sample estimates; with few playouts a strong-looking move can hide a refutation the tree has not explored yet (tic-tac-toe: MCTS with few playouts can lose against alpha-beta). Only in the limit of infinitely many playouts does UCT converge to the minimax move.',
    },
    {
        'q': '*Feb 2026 (Q2).* MCTS applies UCB1 to select the nodes to visit. Which nodes are likely to be visited **more frequently** during the search?',
        'options': [
            'Nodes with a higher win ratio (exploitation) and, to a lesser extent, nodes with few rollouts so far (exploration)',
            'Only the nodes with the fewest rollouts, so that all nodes end up with the same number of visits',
            'Only the node with the highest win ratio; the others are never visited again',
            'The nodes closest to the root and nothing deeper',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): UCB1 has an exploitation component (the win rate $U/N$) and an exploration component $C\\sqrt{\\ln N(\\text{Parent})/N(n)}$ that favours less-explored nodes; so MCTS visits more frequently the nodes with a higher win ratio and the nodes with fewer rollouts. In the long run most visits go to the best moves (that is why the final move is the most visited child), while the exploration bonus of a neglected node grows with $\\ln N(\\text{Parent})$ and keeps sending it occasional playouts.',
    },
    {
        'q': '*Aug 2026 (Q2).* Two players, **two actions** each; MCTS with a budget of $N$ playouts (one playout per iteration). What is the **maximum depth** of the search tree it can build (root at depth 0)?',
        'options': ['$\\lceil N/2 \\rceil$', '$N$', '$\\log_2 N$', '$N/4$'],
        'answer': 0,
        'explain': '**Model answer** (official, verified): in the course\'s MCTS every iteration adds **one** node, and selection descends only through nodes that are **fully expanded**. Starting at the root, the first two playouts expand its two children (depth 1); to put a node at depth 2, one of them must be selected and expanded, and to go below depth 2 that node must first get both its children, and so on. The deepest tree is obtained when selection always follows the same branch: every level costs two playouts except the last one, so depth $d$ needs $2(d - 1) + 1 = 2d - 1$ playouts and the maximum depth is $\\lfloor (N + 1)/2 \\rfloor = \\lceil N/2 \\rceil$. With $b$ actions: $\\lfloor (N - 1)/b \\rfloor + 1$. Trap: if the expansion step added **all** children at once (AIMA allows "one or more"), each iteration could go one level deeper and the bound would be $N$; and whether UCB1 really keeps choosing the same branch depends on the playout results — this is a theoretical maximum.',
    },
]
