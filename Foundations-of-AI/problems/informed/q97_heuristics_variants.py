TITLE = 'Designing heuristics, weighted A* and IDA*'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['relaxed problem', 'dominance', 'weighted A*', 'IDA*', 'grid heuristics']

QUESTIONS = [
    {
        'q': r'$h_1$ (misplaced tiles) is the exact optimal cost of which relaxed 8-puzzle?',
        'options': [
            'A tile can move to **any** square in one move',
            'A tile can move to an adjacent square even if it is occupied',
            'Tiles can also move diagonally',
            'The blank can move two squares at a time',
        ],
        'answer': 0,
        'explain': r'If a tile can jump anywhere, each misplaced tile needs exactly one move (slide p. 215: '
                   r'"removing the constraint of moving only by sliding the tiles"). The second relaxation gives '
                   r'$h_2$, the Manhattan distance: each tile moves as if alone on the board.',
    },
    {
        'q': r'Why is the optimal cost of a **relaxed** problem an admissible heuristic for the original one?',
        'options': [
            'Because relaxed problems are always solvable in one step',
            'Every solution of the original problem is also a solution of the relaxed one, so the relaxed '
            'optimum cannot be more expensive',
            'Because relaxed problems have fewer states',
            'It is not: it can overestimate',
        ],
        'answer': 1,
        'explain': r'Removing constraints only **adds** actions: the original optimal path is still available in '
                   r'the relaxed problem, which may have even cheaper ones. So $h_{\text{relaxed}}(n) \le h^*(n)$ '
                   r'(slide p. 214). It is also consistent, being a true distance in the relaxed problem.',
    },
    {
        'q': r'On the state `5 _ 8 / 4 2 1 / 7 3 6`: $h_1 = 6$, $h_2 = 13$, true cost 21. Which statements are '
             r'true? (select all)',
        'options': [
            r'$h_2$ dominates $h_1$: $h_1(n) \le h_2(n)$ for every $n$',
            r'A* with $h_2$ never expands a node with $g(n) + h_2(n) < C^*$ that A* with $h_1$ skips',
            r'$h_1 + h_2 = 19 \le 21$ here, so $h_1 + h_2$ is admissible',
            r'$\max(h_1, h_2)$ is admissible',
        ],
        'answer': [0, 1, 3],
        'explain': r'A misplaced tile is at Manhattan distance $\ge 1$, so $h_1 \le h_2$. If $g + h_2 < C^*$ then '
                   r'$g + h_1 < C^*$ too: every node A*/$h_2$ surely expands is also surely expanded by A*/$h_1$ '
                   r'(on this state: 932 vs 5802 expansions). The max of admissible heuristics is admissible (here '
                   r'it is just $h_2$). One state is not a proof: $h_1 + h_2$ overestimates on `1 2 3 / 4 5 6 / '
                   r'7 _ 8` (2 > 1).',
    },
    {
        'q': r'Is $h(n) = 2\,h_1(n)$ admissible for the 8-puzzle?',
        'options': [
            'Yes: it dominates $h_1$, so it is better',
            r'No: one move from the goal $h_1 = 1$, so $h = 2 > h^* = 1$',
            'Yes, because $h_1$ is consistent',
            'It depends on the initial state',
        ],
        'answer': 1,
        'explain': r'Dominance only helps **between admissible heuristics**. Doubling $h$ is what weighted A* does '
                   r'with $w = 2$: faster, but the optimality guarantee becomes "cost $\le 2 C^*$".',
    },
    {
        'q': r'Grid with 8 moves (straight 1, diagonal $\sqrt 2$). Which heuristics are admissible? (select all)',
        'options': [
            r'Euclidean distance $\sqrt{dx^2 + dy^2}$',
            r'Manhattan distance $dx + dy$',
            r'Octile distance $\sqrt 2 \min(dx, dy) + |dx - dy|$',
            r'$\max(dx, dy)$',
        ],
        'answer': [0, 2, 3],
        'explain': r'Manhattan overestimates diagonals: from $(0,0)$ to $(4,4)$ it says 8, the true cost is '
                   r'$4\sqrt 2 \approx 5.66$ (slide p. 212). Octile is the exact cost without obstacles, and '
                   r'Euclidean $\le$ octile. $\max(dx, dy) \le$ octile too (it prices diagonals at 1): admissible '
                   r'but less informed.',
    },
    {
        'q': r'Same grid but only **4 moves** of cost 1. Which admissible heuristic is the most informed?',
        'options': ['Euclidean', 'Manhattan', 'Octile', r'$h = 0$'],
        'answer': 1,
        'explain': r'With 4 moves Manhattan is the exact cost without obstacles, and Manhattan $\ge$ octile $\ge$ '
                   r'Euclidean on every cell: it dominates the others (slide p. 211, 215).',
    },
    {
        'q': r'Weighted A* with $w = 1.5$ and an admissible $h$; the optimal cost is $C^* = 40$. The returned '
             r'solution costs at most:',
        'options': ['40', '41.5', '60', 'There is no bound'],
        'answer': 2,
        'explain': r'Weighted A* ($f = g + w h$) returns a solution of cost $\le w \cdot C^* = 60$: a '
                   r'**satisficing** solution, found with far fewer expansions (slides p. 236–238).',
    },
    {
        'q': r'Weighted A*, $f(n) = g(n) + w\,h(n)$. Match the limit cases: which statement is correct?',
        'options': [
            r'$w = 0$: A*;  $w = 1$: greedy;  $w \to \infty$: uniform-cost',
            r'$w = 0$: uniform-cost;  $w = 1$: A*;  $w \to \infty$: greedy best-first',
            r'$w = 0$: greedy;  $w = 1$: uniform-cost;  $w \to \infty$: A*',
            r'$w$ only changes the running time, never the solution',
        ],
        'answer': 1,
        'explain': r'$w = 0$ leaves $f = g$; $w = 1$ is A*; for huge $w$ the $g$ term is negligible and the '
                   r'search ranks nodes by $h$ alone, like greedy (on the slide grid $w = 1000$ returns the '
                   r'greedy detour of cost 25).',
    },
    {
        'q': r'IDA*: in the iteration with cutoff 7 no goal is found, and the pruned nodes had $f = 9, 8, 12, 8$. '
             r'What is the next cutoff?',
        'options': ['8', '9', '12', '14'],
        'answer': 0,
        'explain': r'The next cutoff is the **smallest** $f$ among the non-expanded nodes (slide p. 242): any '
                   r'larger value could skip a cheaper solution and lose optimality.',
    },
    {
        'q': r'Which statements about IDA* are true? (select all)',
        'options': [
            'Its memory grows only linearly with the depth of the search',
            'It never expands the same state twice',
            r'It is optimal when $h$ is admissible',
            'It needs a priority queue for the frontier',
        ],
        'answer': [0, 2],
        'explain': r'IDA* is a depth-first search remembering only the current path and the cutoff, and it does '
                   r'not sort any frontier. The price: it regenerates the previous iterations and revisits states '
                   r'not on the current path (slide p. 255).',
    },
    {
        'q': r'IDA* on the 8-puzzle with the Manhattan distance uses cutoffs 14, 16, 18, 20. Why does the cutoff '
             r'always grow by 2?',
        'options': [
            'Because IDA* always adds 2 to the cutoff',
            r'Each move changes $g$ by 1 and $h_2$ by exactly $\pm 1$, so $f$ changes by 0 or 2 and keeps the '
            r'parity of $f(\text{root})$',
            'Because the branching factor is 2',
            'Because the 8-puzzle has two kinds of moves',
        ],
        'answer': 1,
        'explain': r'One move shifts one tile by one square: $h_2$ changes by exactly 1, so $f = g + h_2$ changes by '
                   r'$1 \pm 1$. With $h_1$ (changes by 0 or ±1) the cutoffs go 6, 7, 8, …, 20: 15 iterations '
                   r'instead of 4.',
    },
]
