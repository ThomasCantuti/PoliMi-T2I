TITLE = 'Minimax & alpha-beta: concepts'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['minimax', 'alpha-beta', 'move ordering', 'complexity']

QUESTIONS = [
    {
        'q': 'The games of this chapter are two-player, turn-taking, **zero-sum**, with **perfect information**. Which game violates one of these assumptions?',
        'options': ['Chess', 'Tic-tac-toe', 'Poker', 'Go'],
        'answer': 2,
        'explain': 'In poker you cannot see the opponent\'s cards: the state is only partially observable, so the information is **imperfect** (slides p. 339). Chess, Go and tic-tac-toe are deterministic, fully observable and zero-sum.',
    },
    {
        'q': 'During alpha-beta, what does $\\alpha$ represent at a node?',
        'options': [
            'The exact minimax value of the node',
            'The value of the best move found so far for MAX along the path: a **lower bound** ("at least")',
            'The value of the best move found so far for MIN along the path: an upper bound ("at most")',
            'The utility of the leftmost leaf below the node',
        ],
        'answer': 1,
        'explain': '$\\alpha$ = best (highest) value MAX can already secure on the path to the root; it can only increase. $\\beta$ is the mirror for MIN: "at most", it can only decrease (slides p. 362–366).',
    },
    {
        'q': 'Below a **MIN** node, when can alpha-beta stop examining the remaining children?',
        'options': [
            'When $v \\ge \\beta$',
            'When $v \\le \\alpha$',
            'When $\\alpha = -\\infty$',
            'Never: pruning only happens below MAX nodes',
        ],
        'answer': 1,
        'explain': 'The MIN node is worth at most $v$, and MAX (above) already has a move worth $\\alpha \\ge v$: MAX will never come here (slides p. 367: "when β is less than or equal to α"). Below MAX nodes the symmetric test is $v \\ge \\beta$.',
    },
    {
        'q': 'Figure 6.5: `[[3, 12, 8], [2, 4, 6], [14, 5, 2]]`, children examined left to right. Which leaves does alpha-beta **never** examine?',
        'options': ['12 and 8', '4 and 6', '5 and 2', 'None: every leaf is needed'],
        'answer': 1,
        'explain': 'After the first MIN node $\\alpha = 3$. The second MIN node sees 2 first: it is worth $\\le 2 \\le 3$, so 4 and 6 are pruned. The third MIN node sees 14 ($\\beta = 14$), 5, 2: none of these values is $\\le 3$ until the last one, so nothing is pruned there.',
    },
    {
        'q': 'Compared with minimax on the same tree, alpha-beta…',
        'options': [
            'may return a slightly different value, but much faster',
            'returns the same value and the same move, examining at most as many nodes',
            'returns the same value but possibly a worse move',
            'is only correct with perfect move ordering',
        ],
        'answer': 1,
        'explain': 'Pruned branches are exactly those that cannot influence the decision at the root: alpha-beta returns the same outcome as "vanilla" minimax (slides p. 361). Ordering changes only **how much** is pruned.',
    },
    {
        'q': 'With $b$ legal moves per state and depth $h$, how many nodes does alpha-beta expand (slides p. 377)?',
        'options': [
            'Worst $O(b^h)$, best $O(b^{h/2})$, random order about $O(b^{3h/4})$',
            'Always $O(b^{h/2})$',
            'Worst $O(b^{h/2})$, best $O(b)$',
            'Worst $O(bh)$, best $O(h)$',
        ],
        'answer': 0,
        'explain': 'With the worst ordering nothing is pruned ($O(b^h)$, same as minimax). With perfect ordering $O(b^{h/2})$: in the same time you search **twice as deep**. Random ordering gives about $O(b^{3h/4})$. Space stays $O(bh)$ (depth-first).',
    },
    {
        'q': 'Move ordering example (slides p. 378): MAX root with children `[10]` and a MIN node with leaves 11 and 0. Which order of the MIN node\'s leaves lets alpha-beta prune a leaf?',
        'options': ['11 then 0', '0 then 11', 'Both orders prune the same', 'Neither order prunes anything'],
        'answer': 1,
        'explain': 'After the first branch $\\alpha = 10$. If MIN sees 0 first, it is worth $\\le 0 \\le 10$ and 11 is pruned. If it sees 11 first ($11 > 10$, no cut) it must also look at 0. For MIN nodes, the best (lowest) child first.',
    },
    {
        'q': 'Homework tree (slides p. 379): `[[[10, 6], [100, 8]], [[1, 2], [20, 4]]]` (MAX, MIN, MAX, leaves). With the **best** possible move ordering, how many of the 8 leaves does alpha-beta examine?',
        'options': ['3', '5', '6', '8'],
        'answer': 1,
        'explain': 'Perfect ordering on a uniform tree with $b = 2$, $m = 3$: $b^{\\lceil m/2\\rceil} + b^{\\lfloor m/2\\rfloor} - 1 = 4 + 2 - 1 = 5$. Here the given order is already optimal: 10, 6 (MAX = 10, so β = 10), 100 (≥ β: 8 pruned), then 1, 2 (MAX = 2 ≤ α = 10: the subtree [20, 4] is pruned).',
    },
    {
        'q': 'Which statements about minimax are true? (select all)',
        'options': [
            'It builds the game tree depth-first, so its memory is $O(bh)$',
            'It is optimal against an optimal opponent when the whole tree is searched',
            'Against a weaker opponent it can do worse than its minimax value',
            'For chess ($b \\approx 35$, $h \\approx 100$) the full tree cannot be searched',
        ],
        'answer': [0, 1, 3],
        'explain': 'Minimax assumes the worst case: a weaker opponent can only give MAX **at least** the minimax value, never less. The full tree is $O(b^h)$ — impossible for chess or Go, hence pruning and depth limits (slides p. 356–357).',
    },
]
