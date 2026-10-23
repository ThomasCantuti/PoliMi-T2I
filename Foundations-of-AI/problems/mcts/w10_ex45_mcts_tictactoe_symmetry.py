TITLE = 'Exercise book 4.5 · Seven MCTS iterations on the empty tic-tac-toe board'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exercise book', 'MCTS', 'UCB1', 'robust child']

STATEMENT = r"""
*Exercise book (Restelli, Gatti, Papini, Metelli), Exercise 4.5.* Show an example of the first seven iterations of MCTS on
tic-tac-toe from the **empty board** (simulation results may be invented). Using the **robust child** criterion (the most
visited child of the root), which action does the first player play?

The book's worked answer uses conventions that differ from the class example — read them carefully:

- **Q** = sum of the payoffs (+1 win, −1 loss) **from the perspective of the player who made the move into the node**
  (so the root's Q is from O's point of view, even though X moves first); **N** = visits;
- $U = \dfrac{Q}{N} + 2\sqrt{\dfrac{2\ln N_{parent}}{N}}$;
- **symmetries** are exploited: the empty board has only three different first moves (corner, centre, edge), and after
  X in the centre O has only two (corner, edge).

The book's invented playouts: it. 1 (X corner) X loses; it. 2 (X centre) X wins; it. 3 (X edge) X loses;
it. 4 (centre → O corner) X wins; it. 5 (centre → O edge) X wins; it. 6 (centre → O corner → X corner) X wins;
it. 7 (centre → O edge → X corner) X wins.
"""

QUESTIONS = [
    {
        'q': 'Why is the root **fully expanded** after only three iterations?',
        'options': [
            'Because by symmetry every first move is equivalent to a corner, the centre or an edge',
            'Because MCTS always stops expanding the root after three children',
            'Because $C = 2$',
            'Because the other six moves lose',
        ],
        'answer': 0,
        'explain': 'Rotations and reflections of the board map every corner onto every other corner (and edges onto edges), so they lead to positions with the same value. Treating them as one node shrinks the branching factor from 9 to 3 (and from 8 to 2 after X in the centre). Without symmetries the root would need 9 iterations just to be fully expanded — this is what the visualizer\'s tic-tac-toe mode does.',
    },
    {
        'q': 'Iteration 4: root Q = 1, N = 3; children corner (Q = −1, N = 1), centre (Q = 1, N = 1), edge (Q = −1, N = 1). What are their U values?',
        'options': ['1.96, 3.96, 1.96', '0.48, 2.48, 0.48', '−1, 1, −1', '2.33, 3.35, 2.33'],
        'answer': 0,
        'explain': '$2\\sqrt{2 \\ln 3} = 2.96$: corner $-1 + 2.96 = 1.96$, centre $1 + 2.96 = 3.96$, edge 1.96 (book values, verified). The centre is selected; it is not fully expanded, so a child (O in a corner) is added and simulated: X wins. The second option uses the course formula with $C = \\sqrt 2$ ($\\sqrt{2}\\sqrt{\\ln 3} = 1.48$); the book\'s formula corresponds to $C = 2\\sqrt 2 \\approx 2.83$ in the course\'s notation — much more exploration.',
    },
    {
        'q': 'Iteration 5: root N = 4, centre Q = 2, N = 2, corner and edge Q = −1, N = 1. What does selection do?',
        'options': [
            'It picks the centre (U = 3.35 vs 2.33); the centre is not fully expanded (O on an edge is untried), so it expands that child',
            'It picks a corner, because its exploration term is larger',
            'It picks the centre and then O in the corner, since the centre is fully expanded',
            'It stops: the root has the most visits',
        ],
        'answer': 0,
        'explain': 'Centre $1 + 2\\sqrt{2\\ln 4 / 2} = 1 + 2.35 = 3.35$; corner/edge $-1 + 2\\sqrt{2 \\ln 4} = 2.33$. The centre has one child out of the two distinct O replies, so selection stops there and expands "O on an edge". The playout is a win for X: the new node gets Q = −1 (it is O\'s move), the centre Q = 3, N = 3, the root Q = −1, N = 5.',
    },
    {
        'q': 'Iteration 7: root N = 6; centre Q = 4, N = 4; corner/edge Q = −1, N = 1. Below the centre (N = 4): O corner Q = −2, N = 2 and O edge Q = −1, N = 1. Which path is selected?',
        'options': [
            'Centre (2.89 > 2.79), then O on an edge (2.33 > 1.35)',
            'Corner (2.79 > 2.89 is false, but corners are tried first)',
            'Centre, then O in the corner, because it has more visits',
            'Centre, then O in the corner, because its Q is lower',
        ],
        'answer': 0,
        'explain': 'Root level: centre $1 + 2\\sqrt{2\\ln 6/4} = 2.89$, corner/edge $-1 + 2\\sqrt{2\\ln 6} = 2.79$ (the book prints 2.78, truncating 2.786; likewise 2.58 for 2.588 in iteration 6 — the choices are unaffected). Below the centre, Q is from **O\'s** perspective: O corner $-2/2 + 2\\sqrt{2\\ln 4/2} = 1.35$, O edge $-1 + 2\\sqrt{2\\ln 4} = 2.33$ → O edge, which is then expanded (X corner) and simulated: X wins.',
    },
    {
        'q': 'After the 7 iterations the root\'s children have N = 1 (corner), 5 (centre), 1 (edge). Which move is played with the **robust child** criterion?',
        'options': [
            'X in the centre: the most visited child (5 visits)',
            'X in a corner: highest U at the last selection',
            'Any move: the values are not reliable after 7 iterations',
            'The child with the highest Q/N, whatever its visits',
        ],
        'answer': 0,
        'explain': 'The robust child is the root child with the most visits — here the centre (Q = 5, N = 5), so the first player puts X in the middle (book answer). It coincides with the course\'s rule (AIMA Figure 6.11: "the move whose node has highest number of playouts"). With invented playouts the numbers are only an example; with random playouts the centre is also the best first move (slides p. 409: 69% wins for the centre).',
    },
]
