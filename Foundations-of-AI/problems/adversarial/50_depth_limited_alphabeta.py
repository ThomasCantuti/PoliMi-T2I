from harness import Test
from aima import TreeGame, TicTacToe
from adversarial_lib import ttt_position

TITLE = 'Depth-limited alpha-beta with e(s)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['depth-limited search', 'evaluation function', 'cutoff', 'alpha-beta']

STATEMENT = r"""
In realistic games we cannot search to the leaves. **Depth-limited search** (slides p. 383)
stops at a maximum depth $h$ and replaces the utility of the (non-terminal) states there with
an evaluation function $e(s)$.

Write `h_alphabeta_search(game, state, depth, e)` → `(value, move)`: your alpha-beta search where
each state also knows its depth $d$ (the root has $d = 0$, its children $d = 1$, …). In both
`max_value` and `min_value`:

1. if the state is **terminal** → `game.utility(state, player)` (a real result always wins);
2. else if $d$ = `depth` → `e(state, player)` (cut off: estimate);
3. else expand the children with $d + 1$, exactly as in alpha-beta.

The order of the two tests matters: a terminal state at the cutoff depth is a real result, not an
estimate. `e(state, player)` is given by the tests (e.g. the open-lines function of the previous
problem, from the point of view of `player`).

**Slide p. 386** — tic-tac-toe with $h = 2$ from the empty board: X's best move is the center,
with backed-up value $\min(5-4, 6-4) = 1$; a corner is worth $-1$, an edge $-2$.
"""

STARTER = '''from collections.abc import Callable
from typing import Any
from aima import Game, infinity

def h_alphabeta_search(game: Game, state: Any, depth: int,
                       e: Callable[[Any, str], float]) -> tuple[float, Any]:
    """Alpha-beta search cut off at `depth` plies: states at that depth are scored with
    e(state, player) instead of being expanded. Return (value, move)."""
    player = state.to_move

    def max_value(state: Any, alpha: float, beta: float, d: int) -> tuple[float, Any]:
        # TODO: terminal? -> utility.  d == depth? -> e(state, player).  else: alpha-beta step (d + 1)
        return 0, None

    def min_value(state: Any, alpha: float, beta: float, d: int) -> tuple[float, Any]:
        # TODO: mirror image
        return 0, None

    return max_value(state, -infinity, +infinity, 0)
'''

SOLUTION = '''from collections.abc import Callable
from typing import Any
from aima import Game, infinity

def h_alphabeta_search(game: Game, state: Any, depth: int,
                       e: Callable[[Any, str], float]) -> tuple[float, Any]:
    """Alpha-beta search cut off at `depth` plies: states at that depth are scored with
    e(state, player) instead of being expanded. Return (value, move)."""
    player = state.to_move

    def max_value(state: Any, alpha: float, beta: float, d: int) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        if d == depth:
            return e(state, player), None
        v, move = -infinity, None
        for a in game.actions(state):
            v2, _ = min_value(game.result(state, a), alpha, beta, d + 1)
            if v2 > v:
                v, move = v2, a
                alpha = max(alpha, v)
            if v >= beta:
                return v, move
        return v, move

    def min_value(state: Any, alpha: float, beta: float, d: int) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        if d == depth:
            return e(state, player), None
        v, move = +infinity, None
        for a in game.actions(state):
            v2, _ = max_value(game.result(state, a), alpha, beta, d + 1)
            if v2 < v:
                v, move = v2, a
                beta = min(beta, v)
            if v <= alpha:
                return v, move
        return v, move

    return max_value(state, -infinity, +infinity, 0)
'''

HINTS = [
    'Copy your alpha-beta and add a fourth parameter `d` (depth of the state) to `max_value` and `min_value`.',
    'At the top of both functions: first `if game.is_terminal(state): return game.utility(state, player), None`, then `if d == depth: return e(state, player), None`.',
    'Recursive calls pass `d + 1`; the root call is `max_value(state, -infinity, +infinity, 0)`. With `depth = 0` you return `(e(root), None)`.',
]

EXPLANATION = r"""
Depth-limited search gives up the guarantee of optimal play (slides p. 383): the result is only as
good as $e(s)$. Two consequences worth remembering:

- **Scale.** Utilities are ±1 here, but the raw open-lines $e(s)$ ranges up to ±8. In
  `['XX.', 'OO.', '...']` with depth 1, raw $e$ scores X's move `(0, 2)` at $3-2 = 1$ — a **tie** with
  the actual win `(2, 0)`, which is found later in move order: the search plays `(0, 2)` and O wins
  next move! That is why the slides suggest normalizing $e$ into $[-1, +1]$ (the tests use $e/10$):
  an estimate must never look as good as a real win.
- **Horizon.** Anything that happens just beyond the cutoff is invisible; the deeper $e$ is
  "buried" in the tree, the less its errors matter (slides p. 389).

With a time budget, use **iterative deepening**: search with depth 1, 2, 3, … and keep the move of the
last completed search — an *anytime* algorithm. The slides' estimate: 100 s at 10 000 nodes/s
= 10⁶ nodes per move, enough for alpha-beta to reach about depth 8 in chess.
"""

ENTRY = 'h_alphabeta_search'

_LINES = ([[(x, y) for x in range(3)] for y in range(3)] + [[(x, y) for y in range(3)] for x in range(3)]
          + [[(i, i) for i in range(3)], [(i, 2 - i) for i in range(3)]])


def _open_lines(board, player):
    opponent = 'O' if player == 'X' else 'X'

    def count(blocker):
        return sum(all(board[sq] != blocker for sq in line) for line in _LINES)
    return count(opponent) - count(player)


def _scaled(board, player):
    return _open_lines(board, player) / 10


def _ttt(sol, rows, depth, e):
    game = TicTacToe()
    return sol.h_alphabeta_search(game, ttt_position(rows) if rows else game.initial, depth, e)


_TREE = [[[3, 12], 7], [[2, 4], [6, 1]], 5]
_E = {(0, 0): 10, (1, 0): 1, (1, 1): 8, (0,): 4, (1,): 6, (): 42}


def _tree(sol, depth):
    """Returns (value, move, leaves read with utility, states scored with e)."""
    game, scored = TreeGame(_TREE), []

    def e(state, player):
        scored.append(tuple(state))
        return _E.get(tuple(state), 0)

    value, move = sol.h_alphabeta_search(game, game.initial, depth, e)
    return value, move, game.evaluated, scored


_SHOW = 'TreeGame([[[3, 12], 7], [[2, 4], [6, 1]], 5]), e = {(0,0): 10, (1,0): 1, (1,1): 8, (0,): 4, (1,): 6, (): 42}, depth=%d  -> (value, move, utilities read, states scored by e)'

TESTS = [
    Test('slide p. 386: h = 2 from the empty board', call=lambda sol: _ttt(sol, None, 2, _open_lines),
         expected=(1, (1, 1)), show='TicTacToe().initial, depth=2, e = open lines'),
    Test('h = 1: greedy on e', call=lambda sol: _ttt(sol, None, 1, _open_lines),
         expected=(4, (1, 1)), show='TicTacToe().initial, depth=1, e = open lines'),
    Test('depth 0 only evaluates the root', call=lambda sol: _tree(sol, 0),
         expected=(42, None, [], [()]), show=_SHOW % 0),
    Test('cutoff at depth 1', call=lambda sol: _tree(sol, 1),
         expected=(6, 1, [5], [(0,), (1,)]), show=_SHOW % 1),
    Test('terminal beats cutoff: leaf 7 at depth 2 is a utility', call=lambda sol: _tree(sol, 2),
         expected=(7, 0, [7, 5], [(0, 0), (1, 0)]), show=_SHOW % 2),
    Test('deeper than the tree = plain alpha-beta', call=lambda sol: _tree(sol, 5),
         expected=(7, 0, [3, 12, 7, 2, 4, 5], []), show=_SHOW % 5),
    Test('takes the win (e scaled into (-1, 1))', call=lambda sol: _ttt(sol, ['XX.', 'OO.', '...'], 1, _scaled)[1],
         expected=(2, 0), show="ttt_position(['XX.', 'OO.', '...']), depth=1, e = open lines / 10  -> move"),
    Test('blocks the threat at depth 2', call=lambda sol: _ttt(sol, ['O..', '.X.', 'X..'], 2, _scaled)[1],
         expected=(2, 0), show="ttt_position(['O..', '.X.', 'X..'])  O to move, depth=2  -> move"),
    Test('depth 9 = whole game: a draw', call=lambda sol: _ttt(sol, None, 9, _scaled),
         expected=(0, (0, 0)), show='TicTacToe().initial, depth=9', timeout=10),
]
