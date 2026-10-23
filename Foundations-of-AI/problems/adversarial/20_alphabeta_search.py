import random

from harness import Test
from aima import TreeGame, TicTacToe
from adversarial_lib import ttt_position

TITLE = 'Alpha-beta pruning'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['alpha-beta', 'pruning', 'α/β bounds', 'Figure 6.5']

STATEMENT = r"""
Implement **alpha-beta search** (AIMA Figure 6.7, slides p. 369). It returns the **same**
`(value, move)` as minimax, but skips the branches that cannot influence the decision.

- **α** = value of the best move found so far for MAX along the path — "MAX gets **at least** α".
- **β** = value of the best move found so far for MIN along the path — "MIN gets **at most** β".

Start with `max_value(state, -infinity, +infinity)` and pass α, β **down** the recursion:

| in `max_value`, after `v` improves | in `min_value`, after `v` improves |
|---|---|
| `alpha = max(alpha, v)` | `beta = min(beta, v)` |
| `if v >= beta: return v, move` (MIN above will never allow this) | `if v <= alpha: return v, move` (MAX above already has better) |

The tests also check **which leaves you looked at** (`game.evaluated`). On Figure 6.5:

```text
                 MAX [3, 3]
          /          |           \
   MIN [3,3]      MIN [-inf,2]     MIN [2,2]
   / | \          / ×   ×          / | \
  3 12  8        2  4   6        14  5  2      evaluated: [3, 12, 8, 2, 14, 5, 2]
```

After the leaf 2, the middle MIN node is worth **at most** 2 while MAX already has 3 (α = 3):
its other leaves cannot matter, so 4 and 6 are pruned.
"""

STARTER = '''from typing import Any
from aima import Game, infinity

def alphabeta_search(game: Game, state: Any) -> tuple[float, Any]:
    """Search game to determine best action; use alpha-beta pruning.
    Return the same (value, move) pair as minimax_search."""
    player = state.to_move

    def max_value(state: Any, alpha: float, beta: float) -> tuple[float, Any]:
        # TODO: like minimax, plus: update alpha when v improves, stop when v >= beta
        return 0, None

    def min_value(state: Any, alpha: float, beta: float) -> tuple[float, Any]:
        # TODO: the mirror image: update beta, stop when v <= alpha
        return 0, None

    return max_value(state, -infinity, +infinity)
'''

SOLUTION = '''from typing import Any
from aima import Game, infinity

def alphabeta_search(game: Game, state: Any) -> tuple[float, Any]:
    """Search game to determine best action; use alpha-beta pruning.
    Return the same (value, move) pair as minimax_search."""
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
'''

HINTS = [
    'Start from your minimax: the loop, `v`, `move` and the strict `>` / `<` updates stay exactly the same.',
    'The only new things: α and β travel **down** as arguments; MAX raises α, MIN lowers β, whenever its own `v` improves.',
    'Pruning test after each child: in `max_value` `if v >= beta: return v, move`; in `min_value` `if v <= alpha: return v, move`. Use `>=` / `<=`: on equality the branch cannot be *strictly* better (slides p. 367).',
]

EXPLANATION = r"""
**Why the result never changes.** A MIN node whose value is already $\le \alpha$ can only get
*smaller* (β never increases), and MAX already has a move worth α: whatever the pruned leaves
hold, MAX will not choose this branch. The value returned for a pruned node is only a bound,
but it is a bound that loses the comparison at the parent, so the root value and the chosen
move are exactly those of minimax.

**Deep cut-offs.** In `[5, [[[1, 9], 7], 8]]` the leaf 9 is pruned using the α = 5 that comes
from the **root**, two levels above: that is why α and β must be passed down, not reset.

**Efficiency depends on move ordering** (slides p. 377): worst case $O(b^h)$ — nothing pruned,
as in `[[10], [11, 0]]` —, best case $O(b^{h/2})$ (the solvable depth doubles), random order
about $O(b^{3h/4})$. On the empty tic-tac-toe board alpha-beta reads 7 330 terminal positions
instead of minimax's 255 168 (about 35× fewer). The next problem builds the perfect ordering.
"""

ENTRY = 'alphabeta_search'


def _value(tree, maximizing):
    if not isinstance(tree, list):
        return tree
    vals = [_value(c, not maximizing) for c in tree]
    return max(vals) if maximizing else min(vals)


def _pick(tree):
    vals = [_value(c, False) for c in tree]
    return max(vals), vals.index(max(vals))


def _leaves(tree):
    return [tree] if not isinstance(tree, list) else [x for c in tree for x in _leaves(c)]


def _run(sol, tree):
    game = TreeGame(tree)
    value, move = sol.alphabeta_search(game, game.initial)
    return value, move, game.evaluated


def _random_trees(n=40, seed=6):
    rng = random.Random(seed)

    def build(depth):
        if depth == 0 or (depth < 3 and rng.random() < 0.2):
            return rng.randint(-9, 9)
        return [build(depth - 1) for _ in range(rng.randint(1, 3))]
    return [[build(rng.randint(2, 4)) for _ in range(rng.randint(2, 3))] for _ in range(n)]


def _same_as_minimax(sol):
    for tree in _random_trees():
        value, move, seen = _run(sol, tree)
        if (value, move) != _pick(tree):
            return False, f'tree {tree}: you returned {(value, move)}, minimax gives {_pick(tree)}'
        if len(seen) > len(_leaves(tree)):
            return False, f'tree {tree}: you evaluated {len(seen)} leaves, the tree has only {len(_leaves(tree))}'
    return True


def _ttt(sol, rows=None):
    game = TicTacToe()
    return sol.alphabeta_search(game, ttt_position(rows) if rows else game.initial)


TESTS = [
    Test('Figure 6.5: value, move and pruned leaves',
         call=lambda sol: _run(sol, [[3, 12, 8], [2, 4, 6], [14, 5, 2]]),
         expected=(3, 0, [3, 12, 8, 2, 14, 5, 2]),
         show='TreeGame([[3, 12, 8], [2, 4, 6], [14, 5, 2]])  -> (value, move, game.evaluated)'),
    Test('prune also on equality (v <= alpha)', call=lambda sol: _run(sol, [[3, 5], [3, 1]]),
         expected=(3, 0, [3, 5, 3]), show='TreeGame([[3, 5], [3, 1]])'),
    Test('below MAX too (v >= beta)', call=lambda sol: _run(sol, [[3, [3, 9]]]),
         expected=(3, 0, [3, 3]), show='TreeGame([[3, [3, 9]]])'),
    Test('move ordering p. 378: nothing to prune', call=lambda sol: _run(sol, [[10], [11, 0]]),
         expected=(10, 0, [10, 11, 0]), show='TreeGame([[10], [11, 0]])'),
    Test('move ordering p. 378: 11 is pruned', call=lambda sol: _run(sol, [[10], [0, 11]]),
         expected=(10, 0, [10, 0]), show='TreeGame([[10], [0, 11]])'),
    Test('homework tree p. 379', call=lambda sol: _run(sol, [[[10, 6], [100, 8]], [[1, 2], [20, 4]]]),
         expected=(10, 0, [10, 6, 100, 1, 2]), show='TreeGame([[[10, 6], [100, 8]], [[1, 2], [20, 4]]])'),
    Test('deep cut-off: alpha comes from the root', call=lambda sol: _run(sol, [5, [[[1, 9], 7], 8]]),
         expected=(7, 1, [5, 1, 7, 8]), show='TreeGame([5, [[[1, 9], 7], 8]])'),
    Test('same (value, move) as minimax on 40 random trees', call=_same_as_minimax,
         check=lambda got: got, show='random trees, depth 2-4, branching 1-3'),
    Test('tic-tac-toe: O must defend on an edge', call=lambda sol: _ttt(sol, ['X..', '.O.', '..X']),
         expected=(0, (0, 1)), show="ttt_position(['X..', '.O.', '..X'])  O to move"),
    Test('tic-tac-toe: whole game, fast', call=lambda sol: _ttt(sol), expected=(0, (0, 0)),
         show='TicTacToe().initial (empty board)', timeout=10),
]
