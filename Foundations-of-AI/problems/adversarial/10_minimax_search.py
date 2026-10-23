from harness import Test
from aima import TreeGame, TicTacToe
from adversarial_lib import ttt_position

TITLE = 'Minimax search'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['minimax', 'game tree', 'MAX/MIN', 'backed-up values']

STATEMENT = r"""
Implement **minimax search** exactly as on the slides (p. 354–355): two mutually recursive
functions `max_value` and `min_value` that walk the game tree **depth-first** and *back up*
the minimax values from the leaves to the root.

Return the pair `(value, move)`: the minimax value of `state` and the best move for the player to move.

- `player = state.to_move` at the **root** is MAX: every utility is read from MAX's point of view,
  `game.utility(state, player)`, also inside `min_value`.
- MAX node → the **maximum** of its children's values; MIN node → the **minimum**.
- Keep the **first** best move: update only when strictly better (`v2 > v` in MAX, `v2 < v` in MIN).

`TreeGame(tree)` is an explicit game tree given as nested lists; the leaves are utilities for MAX,
MAX moves at the root and the players alternate. Moves are the child indices `0, 1, 2, …`

```text
TreeGame([[3, 12, 8], [2, 4, 6], [14, 5, 2]])      (Figure 5.2, slides p. 353)

                MAX              value 3, best move 0
         /       |       \
       MIN      MIN      MIN     values 3, 2, 2
      / | \    / | \    / | \
     3 12  8  2  4  6  14  5  2
```

Use only the `Game` interface (`actions`, `result`, `is_terminal`, `utility`): the same function
must also play `TicTacToe()` (moves are `(x, y)` squares, utility +1 / 0 / −1).

**Example:** `minimax_search(game, game.initial)` → `(3, 0)` for the tree above.
"""

STARTER = '''from typing import Any
from aima import Game, infinity

def minimax_search(game: Game, state: Any) -> tuple[float, Any]:
    """Search game tree to determine best move; return (value, move) pair."""
    player = state.to_move

    def max_value(state: Any) -> tuple[float, Any]:
        # TODO: terminal state -> (utility for player, None)
        # TODO: otherwise keep the action whose min_value is the HIGHEST
        return 0, None

    def min_value(state: Any) -> tuple[float, Any]:
        # TODO: the mirror image of max_value
        return 0, None

    # the Minimax search plays for MAX
    return max_value(state)
'''

SOLUTION = '''from typing import Any
from aima import Game, infinity

def minimax_search(game: Game, state: Any) -> tuple[float, Any]:
    """Search game tree to determine best move; return (value, move) pair."""
    player = state.to_move

    def max_value(state: Any) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        v, move = -infinity, None
        for a in game.actions(state):
            v2, _ = min_value(game.result(state, a))
            if v2 > v:
                v, move = v2, a
        return v, move

    def min_value(state: Any) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        v, move = +infinity, None
        for a in game.actions(state):
            v2, _ = max_value(game.result(state, a))
            if v2 < v:
                v, move = v2, a
        return v, move

    # the Minimax search plays for MAX
    return max_value(state)
'''

HINTS = [
    'MAX is simply the player to move at the root (`player = state.to_move`). Utilities are always read from **that** player\'s point of view.',
    'In `max_value`: if the state is terminal return `(game.utility(state, player), None)`; otherwise start from `v, move = -infinity, None` and loop over `game.actions(state)`.',
    'For each action `a`: `v2, _ = min_value(game.result(state, a))`, then `if v2 > v: v, move = v2, a`. `min_value` is the mirror: start from `+infinity`, call `max_value`, keep `v2 < v`.',
]

EXPLANATION = r"""
The **minimax value** of a node is the utility (for MAX) of the terminal state reached if *both*
players play optimally from there: MAX nodes take the max of their children, MIN nodes the min,
terminal nodes their utility. Backing the values up from the leaves gives MAX the move that
maximizes its **worst-case** outcome.

- Minimax is **optimal** against an optimal opponent when the whole tree is built (slides p. 356).
  Against a weaker opponent it still guarantees *at least* the minimax value.
- It is a depth-first search: time $O(b^h)$, space $O(bh)$ (slides p. 357).
- The whole tic-tac-toe tree has about 550 000 nodes, so the full-game test above takes a
  second or two; chess ($b \approx 35$, $h \approx 100$) is hopeless. Notice also that minimax
  read **every** leaf of Figure 5.2 — the next problem shows that this is not necessary.
- `ttt_position(['X..', '.O.', '..X'])`: value 0 and move `(0, 1)`. O must answer on an **edge**:
  a corner lets X create a fork (two threats at once). Minimax "knows" this without any tic-tac-toe
  knowledge — only the rules and the utility.
"""

ENTRY = 'minimax_search'

_FIG52 = [[3, 12, 8], [2, 4, 6], [14, 5, 2]]


def _tree(sol, tree):
    game = TreeGame(tree)
    return sol.minimax_search(game, game.initial)


def _leaves(sol, tree):
    game = TreeGame(tree)
    sol.minimax_search(game, game.initial)
    return game.evaluated


def _ttt(sol, rows=None):
    game = TicTacToe()
    return sol.minimax_search(game, ttt_position(rows) if rows else game.initial)


TESTS = [
    Test('Figure 5.2 (slides p. 353)', call=lambda sol: _tree(sol, _FIG52), expected=(3, 0),
         show='TreeGame([[3, 12, 8], [2, 4, 6], [14, 5, 2]])'),
    Test('best move is not the first one', call=lambda sol: _tree(sol, [[1, 9], [4, 7], [2, 8]]),
         expected=(4, 1), show='TreeGame([[1, 9], [4, 7], [2, 8]])'),
    Test('ties keep the first best move', call=lambda sol: _tree(sol, [[2, 3], [2, 5]]),
         expected=(2, 0), show='TreeGame([[2, 3], [2, 5]])'),
    Test('three plies', call=lambda sol: _tree(sol, [[[3, 5], [6, 9]], [[1, 2], [0, -1]]]),
         expected=(5, 0), show='TreeGame([[[3, 5], [6, 9]], [[1, 2], [0, -1]]])'),
    Test('leaves at different depths', call=lambda sol: _tree(sol, [5, [1, 10], [[8, 9], 4]]),
         expected=(5, 0), show='TreeGame([5, [1, 10], [[8, 9], 4]])'),
    Test('the root is already terminal', call=lambda sol: _tree(sol, 7), expected=(7, None),
         show='TreeGame(7)'),
    Test('plain minimax reads every leaf', call=lambda sol: _leaves(sol, _FIG52),
         expected=[3, 12, 8, 2, 4, 6, 14, 5, 2], show='game.evaluated after searching Figure 5.2'),
    Test('tic-tac-toe: X wins in one', call=lambda sol: _ttt(sol, ['XX.', 'OO.', '...']),
         expected=(1, (2, 0)), show="ttt_position(['XX.', 'OO.', '...'])  X to move"),
    Test('tic-tac-toe: minimax plays for O too', call=lambda sol: _ttt(sol, ['XX.', 'OO.', 'X..']),
         expected=(1, (2, 1)), show="ttt_position(['XX.', 'OO.', 'X..'])  O to move"),
    Test('tic-tac-toe: O must defend on an edge', call=lambda sol: _ttt(sol, ['X..', '.O.', '..X']),
         expected=(0, (0, 1)), show="ttt_position(['X..', '.O.', '..X'])  O to move"),
    Test('tic-tac-toe: the whole game is a draw', call=lambda sol: _ttt(sol), expected=(0, (0, 0)),
         show='TicTacToe().initial (empty board)', timeout=30),
]
