from harness import Test
from adversarial_lib import ttt_position

TITLE = 'Evaluation function e(s) for tic-tac-toe'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['evaluation function', 'e(s)', 'features', 'tic-tac-toe']

STATEMENT = r"""
When we cannot search to the end of the game we need an **evaluation function** $e(s)$ that
estimates the expected utility of a non-terminal state $s$ for a player $p$ (slides p. 384):
$e(s) > 0$ good for $p$, $e(s) < 0$ good for the opponent, $0$ neutral.

The slides' tic-tac-toe example (p. 385):

$$e(s) = (\text{lines still open for } p) - (\text{lines still open for the opponent})$$

A **line** is one of the 8 rows, columns and diagonals; it is *open* for $p$ if it contains
**no opponent piece** (it may contain $p$'s pieces or be empty).

```text
 . . .        . . .        X O X
 . . .        . X O        . O .
 . . .        . . .        . . .
e = 8-8 = 0  e = 6-4 = 2  e = 3-3 = 0      (for p = X)
```

Write `e(board, player)`. The board is an aima `Board`: `board[x, y]` is `'X'`, `'O'` or `'.'`
(empty), with `x` the column and `y` the row, both in `0..2`; `player` is `'X'` or `'O'`.
"""

STARTER = '''from aima import Board

def e(board: Board, player: str) -> int:
    """Open lines for player minus open lines for the opponent (rows, columns, diagonals)."""
    opponent = 'O' if player == 'X' else 'X'
    lines: list[list[tuple]] = []   # TODO: the 8 lines, each a list of 3 (x, y) squares
    # TODO: count the lines with no opponent piece, and the lines with no player piece
    return 0
'''

SOLUTION = '''from aima import Board

LINES = ([[(x, y) for x in range(3)] for y in range(3)] +      # rows
         [[(x, y) for y in range(3)] for x in range(3)] +      # columns
         [[(i, i) for i in range(3)], [(i, 2 - i) for i in range(3)]])  # diagonals


def e(board: Board, player: str) -> int:
    """Open lines for player minus open lines for the opponent (rows, columns, diagonals)."""
    opponent = 'O' if player == 'X' else 'X'

    def open_lines(blocker: str) -> int:   # lines with no piece of `blocker`
        return sum(all(board[sq] != blocker for sq in line) for line in LINES)

    return open_lines(opponent) - open_lines(player)
'''

HINTS = [
    'Build the 8 lines once as lists of `(x, y)` squares: 3 rows, 3 columns, the diagonal `(i, i)` and the anti-diagonal `(i, 2 - i)`.',
    'A line is open for `player` when **none** of its squares holds the opponent: `all(board[sq] != opponent for sq in line)`.',
    'Return `open(player) - open(opponent)`; by symmetry `e(board, "O") == -e(board, "X")` (zero-sum).',
]

EXPLANATION = r"""
$e(s)$ is a **weighted linear sum of features** (slides p. 388):
$e(s) = w_1 f_1(s) + w_2 f_2(s)$ with $f_1$ = open lines for MAX, $f_2$ = open lines for MIN,
$w_1 = 1$, $w_2 = -1$.

Look at the first move: X in the **center** scores $8-4 = 4$, a **corner** $8-5 = 3$, an **edge**
$8-6 = 2$. The same ranking appears in the MCTS slides, where 10 000 random playouts give X a win
rate of 69.2% (center), 60.9% (corner), 53.8% (edge): a good evaluation function and random
simulations agree.

$e(s)$ is only an estimate: it does not see a fork coming. The ideal evaluation function would
return the true minimax value; in practice the **deeper** it is applied in the tree, the less its
imperfections matter (slides p. 389). The slides also suggest normalizing $e$ into $[-1, +1]$ —
the next problem shows why that matters when $e$ and real utilities are compared.
"""

ENTRY = 'e'


def _e(rows, player):
    return lambda sol: sol.e(ttt_position(rows), player)


TESTS = [
    Test('empty board (slide p. 385)', call=_e(['...', '...', '...'], 'X'), expected=0,
         show="ttt_position(['...', '...', '...']), 'X'"),
    Test('X center, O right (slide p. 385)', call=_e(['...', '.XO', '...'], 'X'), expected=2,
         show="ttt_position(['...', '.XO', '...']), 'X'"),
    Test('X O X / . O . (slide p. 385)', call=_e(['XOX', '.O.', '...'], 'X'), expected=0,
         show="ttt_position(['XOX', '.O.', '...']), 'X'"),
    Test("same board from O's point of view", call=_e(['...', '.XO', '...'], 'O'), expected=-2,
         show="ttt_position(['...', '.XO', '...']), 'O'"),
    Test('first move: center', call=_e(['...', '.X.', '...'], 'X'), expected=4,
         show="ttt_position(['...', '.X.', '...']), 'X'"),
    Test('first move: corner', call=_e(['X..', '...', '...'], 'X'), expected=3,
         show="ttt_position(['X..', '...', '...']), 'X'"),
    Test('first move: edge', call=_e(['.X.', '...', '...'], 'X'), expected=2,
         show="ttt_position(['.X.', '...', '...']), 'X'"),
    Test('X corner, O center', call=_e(['X..', '.O.', '...'], 'X'), expected=-1,
         show="ttt_position(['X..', '.O.', '...']), 'X'"),
    Test('full board, draw', call=_e(['XOX', 'XOO', 'OXX'], 'X'), expected=0,
         show="ttt_position(['XOX', 'XOO', 'OXX']), 'X'"),
]
