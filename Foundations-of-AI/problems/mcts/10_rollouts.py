import random

from harness import Test
from aima import TicTacToe
from adversarial_lib import ttt_position

TITLE = 'Evaluation by rollouts'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['rollout', 'playout', 'Monte Carlo', 'win rate']

STATEMENT = r"""
What if we have **no evaluation function** and no domain knowledge? Evaluate a state by
**playing many random games** from it and counting wins (slides p. 408–409).

Write `rollout_stats(game, state, n, rng)` → `{move: win_rate}`: for every legal move of the player
to move, play `n` random **playouts** from the resulting state and return the fraction won by the
player to move at `state` (draws and losses count as non-wins).

A playout (or rollout) chooses `rng.choice(game.actions(s))` until `game.is_terminal(s)`; the
result is read with `game.utility(final, player)` (> 0 means `player` won). Always use the given
seeded `rng` (a `random.Random`), never the global `random` module.

```text
slide p. 409, X to move on the empty board, 10 000 playouts per first move:
  center  X wins 69.2%      corner  X wins 60.9%      edge  X wins 53.8%
```
"""

STARTER = '''from random import Random
from aima import Board, TicTacToe

def rollout(game: TicTacToe, state: Board, rng: Random) -> Board:
    """Play random moves until the game is over; return the terminal state."""
    # TODO
    return state


def rollout_stats(game: TicTacToe, state: Board, n: int, rng: Random) -> dict[tuple[int, int], float]:
    """{move: fraction of n random playouts won by state.to_move after playing move}."""
    player = state.to_move
    stats: dict[tuple[int, int], float] = {}
    # TODO: for each move, n playouts from game.result(state, move)
    return stats
'''

SOLUTION = '''from random import Random
from aima import Board, TicTacToe

def rollout(game: TicTacToe, state: Board, rng: Random) -> Board:
    """Play random moves until the game is over; return the terminal state."""
    while not game.is_terminal(state):
        state = game.result(state, rng.choice(game.actions(state)))
    return state


def rollout_stats(game: TicTacToe, state: Board, n: int, rng: Random) -> dict[tuple[int, int], float]:
    """{move: fraction of n random playouts won by state.to_move after playing move}."""
    player = state.to_move
    stats: dict[tuple[int, int], float] = {}
    for move in game.actions(state):
        s = game.result(state, move)
        wins = sum(game.utility(rollout(game, s, rng), player) > 0 for _ in range(n))
        stats[move] = wins / n
    return stats
'''

HINTS = [
    'Split the work: `rollout(game, state, rng)` plays one random game to the end; `rollout_stats` calls it `n` times per move.',
    'Remember who you are counting for: `player = state.to_move` **before** playing the move (after it, it is the opponent\'s turn).',
    'If a move ends the game, `rollout` must return immediately: the loop `while not game.is_terminal(state): state = game.result(state, rng.choice(game.actions(state)))` does that.',
]

EXPLANATION = r"""
A rollout is a very noisy evaluation (random players blunder all the time), but **averaging** many of
them gives a usable estimate of how good a position is — with zero knowledge of the game. The
ranking center > corner > edge matches the open-lines evaluation function (4 > 3 > 2) without
anyone having designed it.

Limits that MCTS will fix:

- every move gets the **same** number of playouts, even hopeless ones (no *selective search*);
- the statistics have uncertainty: with $n$ playouts the standard error of a win rate is
  $\sqrt{p(1-p)/n}$, about 1.5% for $n = 1000$; "70 wins of 100" is less reliable than "692 of 1000"
  (slides p. 427–428);
- random playouts assume a random opponent: a move can look good on average and still lose to a
  single precise reply.

The more complex the game, the more simulations we need — and the more expensive each one becomes
(slides p. 411).
"""

ENTRY = 'rollout_stats'

_CORNERS = [(0, 0), (2, 0), (0, 2), (2, 2)]
_EDGES = [(1, 0), (0, 1), (2, 1), (1, 2)]


def _first_move(sol):
    game = TicTacToe()
    return sol.rollout_stats(game, game.initial, 1000, random.Random(409))


def _check_first_move(got):
    if not isinstance(got, dict) or len(got) != 9:
        return False, 'expected a dict with the 9 first moves as keys'
    center, corner = got[(1, 1)], sum(got[m] for m in _CORNERS) / 4
    edge = sum(got[m] for m in _EDGES) / 4
    msg = f'center {center:.1%}, corners {corner:.1%}, edges {edge:.1%} (slides: 69.2%, 60.9%, 53.8%)'
    ok = center > corner > edge and abs(center - .692) < .07 and abs(edge - .538) < .07
    return ok, msg


def _position(rows, n=50, seed=0):
    return lambda sol: sol.rollout_stats(TicTacToe(), ttt_position(rows), n, random.Random(seed))


def _check_win_in_one(move, others_below=1):
    def check(got):
        if got.get(move) != 1:
            return False, f'{move} wins immediately: every "playout" from there is a win, so its rate must be 1.0'
        if any(v >= others_below for m, v in got.items() if m != move):
            return False, 'the other moves cannot all be sure wins'
        return True
    return check


def _seeded(sol):
    rows = ttt_position(['X..', '.O.', '...'])
    a = sol.rollout_stats(TicTacToe(), rows, 200, random.Random(7))
    b = sol.rollout_stats(TicTacToe(), rows, 200, random.Random(7))
    return a == b


TESTS = [
    Test('slide p. 409: center > corner > edge', call=_first_move, check=_check_first_move,
         show='empty board, n=1000 playouts per move', timeout=20),
    Test('the winning move is a sure win', call=_position(['XX.', 'OO.', '...']),
         check=_check_win_in_one((2, 0)), show="ttt_position(['XX.', 'OO.', '...']), n=50  (X to move)"),
    Test('counts wins for the player to move (O)', call=_position(['XX.', 'OO.', 'X..']),
         check=_check_win_in_one((2, 1)), show="ttt_position(['XX.', 'OO.', 'X..']), n=50  (O to move)"),
    Test('one key per legal move', call=lambda sol: sorted(_position(['XOX', 'OXO', '...'], 10)(sol)),
         expected=[(0, 2), (1, 2), (2, 2)], show="ttt_position(['XOX', 'OXO', '...']) -> sorted keys"),
    Test('rates are fractions of n', call=_position(['XO.', '...', '...'], 40, 3),
         check=lambda got: all(abs(v * 40 - round(v * 40)) < 1e-9 and 0 <= v <= 1 for v in got.values())
         or (False, 'each value must be wins / n'), show="ttt_position(['XO.', '...', '...']), n=40"),
    Test('same seed, same statistics', call=_seeded, expected=True,
         show='two calls with random.Random(7) must agree: use only the rng you are given'),
]
