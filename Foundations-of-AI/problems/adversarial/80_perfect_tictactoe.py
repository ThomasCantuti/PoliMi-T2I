import random

from harness import Test
from aima import TicTacToe, play_game, random_player
from adversarial_lib import ttt_position

TITLE = 'A tic-tac-toe player that never loses'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['alpha-beta', 'play_game', 'strategy', 'tic-tac-toe']

STATEMENT = r"""
Time to turn search into a **player**. A strategy for `play_game` (slides p. 343) is a function
`strategy(game, state)` → move:

```python
play_game(game, {'X': perfect_player, 'O': lambda g, s: random_player(g, s, rng)})
```

Write `perfect_player(game, state)` that returns an **optimal** move for the player to move,
using alpha-beta search to the end of the game (paste and reuse your `alphabeta_search`).

The tests play many games against a (seeded) random player, as X and as O, and against itself.
Your player must **never lose**. The first move on the empty board is the most expensive search:
alpha-beta handles it in a fraction of a second; plain minimax would take a couple of seconds per game.
"""

STARTER = '''from typing import Any
from aima import Board, Game, TicTacToe, infinity

def alphabeta_search(game: Game, state: Any) -> tuple[float, Any]:
    """Paste your alpha-beta search here: it returns (value, move)."""
    # TODO
    return 0, None


def perfect_player(game: TicTacToe, state: Board) -> tuple[int, int]:
    """A strategy for play_game: the optimal move for state.to_move."""
    # TODO: use the search
    return None
'''

SOLUTION = '''from typing import Any
from aima import Board, Game, TicTacToe, infinity

def alphabeta_search(game: Game, state: Any) -> tuple[float, Any]:
    """Search game to determine best action; use alpha-beta pruning."""
    player = state.to_move

    def max_value(state: Any, alpha: float, beta: float) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        v, move = -infinity, None
        for a in game.actions(state):
            v2, _ = min_value(game.result(state, a), alpha, beta)
            if v2 > v:
                v, move = v2, a
                alpha = max(alpha, v)
            if v >= beta:
                return v, move
        return v, move

    def min_value(state: Any, alpha: float, beta: float) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        v, move = +infinity, None
        for a in game.actions(state):
            v2, _ = max_value(game.result(state, a), alpha, beta)
            if v2 < v:
                v, move = v2, a
                beta = min(beta, v)
            if v <= alpha:
                return v, move
        return v, move

    return max_value(state, -infinity, +infinity)


def perfect_player(game: TicTacToe, state: Board) -> tuple[int, int]:
    """A strategy for play_game: the optimal move for state.to_move."""
    return alphabeta_search(game, state)[1]
'''

HINTS = [
    'A strategy only has to return a **move**; your search returns `(value, move)`.',
    'Because `alphabeta_search` plays for `state.to_move`, the same function works for X and for O.',
    '`def perfect_player(game, state): return alphabeta_search(game, state)[1]`',
]

EXPLANATION = r"""
This is the slides' **option #2** for building a player (p. 464–467): simulate what might happen
ahead with minimax/alpha-beta and the utility function. It needs no tic-tac-toe knowledge at all —
only the rules — and it is optimal, but its cost grows as $O(b^h)$: fine for tic-tac-toe,
impossible for chess or Go without an evaluation function (option #2 with $e(s)$) or simulations
(option #3, MCTS).

What the games show (the "quiz time" of slides p. 455):

- **vs random:** it never loses and wins most games; the few draws come from random moves that
  happen to be good.
- **vs itself:** every game is a draw — tic-tac-toe is a draw under perfect play, and since the
  search is deterministic the two players replay the very same game every time.
- Minimax vs alpha-beta would also always draw: same values, same (first best) moves.

Note that minimax does not care *how fast* it wins: all wins are worth +1. To prefer quick wins,
make the utility depend on the number of moves played.
"""

ENTRY = 'perfect_player'


def _match(sol, me, n, seed):
    """Play n games: sol.perfect_player as `me` vs a seeded random player. Return (wins, draws, losses)."""
    game, rng = TicTacToe(), random.Random(seed)
    other = 'O' if me == 'X' else 'X'
    results = [0, 0, 0]
    for _ in range(n):
        end = play_game(game, {me: sol.perfect_player, other: lambda g, s: random_player(g, s, rng)})
        u = game.utility(end, me)
        results[0 if u > 0 else 1 if u == 0 else 2] += 1
    return tuple(results)


def _never_loses(got):
    w, d, l = got
    return l == 0, f'{w} wins, {d} draws, {l} losses'


def _self_play(sol):
    game = TicTacToe()
    return [game.utility(play_game(game, {'X': sol.perfect_player, 'O': sol.perfect_player}), 'X')
            for _ in range(3)]


TESTS = [
    Test('as X vs random: 30 games', call=lambda sol: _match(sol, 'X', 30, 1), check=_never_loses,
         show='(wins, draws, losses) as X against random_player', timeout=30),
    Test('as O vs random: 30 games', call=lambda sol: _match(sol, 'O', 30, 2), check=_never_loses,
         show='(wins, draws, losses) as O against random_player', timeout=30),
    Test('against itself: always a draw', call=_self_play, expected=[0, 0, 0],
         show='3 games perfect_player vs perfect_player, utility for X', timeout=30),
    Test('takes the immediate win', call=lambda sol: sol.perfect_player(TicTacToe(), ttt_position(['XX.', 'OO.', '...'])),
         expected=(2, 0), show="ttt_position(['XX.', 'OO.', '...'])  X to move"),
    Test('blocks the fork: O answers on an edge',
         call=lambda sol: sol.perfect_player(TicTacToe(), ttt_position(['X..', '.O.', '..X'])),
         check=lambda got: got in [(1, 0), (0, 1), (2, 1), (1, 2)] or (False, 'any corner lets X build a fork'),
         show="ttt_position(['X..', '.O.', '..X'])  O to move"),
]
