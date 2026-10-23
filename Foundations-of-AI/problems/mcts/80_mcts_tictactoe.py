import random

from harness import Test
from aima import TicTacToe
from adversarial_lib import ttt_position

TITLE = 'Monte Carlo Tree Search for tic-tac-toe'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['MCTS', 'UCT', 'anytime', 'tic-tac-toe']

STATEMENT = r"""
Put the four phases together (slides p. 413–414, AIMA Figure 6.11):

```text
function MONTE-CARLO-TREE-SEARCH(state) returns an action
    tree <- NODE(state)
    while IS-TIME-REMAINING() do                     # here: n_iter iterations
        leaf   <- SELECT(tree)                       # UCB1 down the tree
        child  <- EXPAND(leaf)                       # add one new node (if not terminal)
        result <- SIMULATE(child)                    # random playout to the end
        BACK-PROPAGATE(result, child)                # update U and N up to the root
    return the move in ACTIONS(state) whose node has the highest number of playouts
```

Write `mcts(game, state, n_iter, rng, C=1.4)` → a move, for `TicTacToe()`. Use `MCTSNode` from `mcts_lib`:

- **root** = `MCTSNode(state, untried=game.actions(state), player=<the opponent of state.to_move>)`;
- **select**: while the node has children and no untried moves, go to the child with the largest UCB1;
- **expand**: if the node has untried moves, pop one at random (`rng`) and create the child
  `MCTSNode(s, parent=node, move=move, player=node.state.to_move, untried=[] if terminal else game.actions(s))`;
- **simulate**: random moves with `rng.choice` until the game ends; the winner is `'X'` if
  `game.utility(final, 'X') > 0`, `'O'` if `< 0`, `None` for a draw;
- **backpropagate** as in the previous problem (`U` = wins of the player who moved into the node).

All randomness must come from `rng`. The tests run several seeds and accept any correct move.
"""

STARTER = '''import math
from random import Random
from aima import Board, TicTacToe
from mcts_lib import MCTSNode


def ucb1(n: MCTSNode, C: float) -> float:
    # TODO: from the selection problem
    return 0.0


def mcts(game: TicTacToe, state: Board, n_iter: int, rng: Random, C: float = 1.4) -> tuple[int, int]:
    """Monte Carlo Tree Search: return the move with the most simulations after n_iter iterations."""
    root = MCTSNode(state, untried=game.actions(state),
                    player='O' if state.to_move == 'X' else 'X')
    for _ in range(n_iter):
        node = root
        # TODO 1. selection
        # TODO 2. expansion
        # TODO 3. simulation (random playout from node.state)
        # TODO 4. backpropagation
    return max(root.children, key=lambda c: c.N).move
'''

SOLUTION = '''import math
from random import Random
from aima import Board, TicTacToe
from mcts_lib import MCTSNode


def ucb1(n: MCTSNode, C: float) -> float:
    if n.N == 0:
        return math.inf
    return n.U / n.N + C * math.sqrt(math.log(n.parent.N) / n.N)


def mcts(game: TicTacToe, state: Board, n_iter: int, rng: Random, C: float = 1.4) -> tuple[int, int]:
    """Monte Carlo Tree Search: return the move with the most simulations after n_iter iterations."""
    root = MCTSNode(state, untried=game.actions(state),
                    player='O' if state.to_move == 'X' else 'X')
    for _ in range(n_iter):
        node = root
        # 1. selection
        while node.children and not node.untried:
            node = max(node.children, key=lambda c: ucb1(c, C))
        # 2. expansion
        if node.untried:
            move = node.untried.pop(rng.randrange(len(node.untried)))
            s = game.result(node.state, move)
            child = MCTSNode(s, parent=node, move=move, player=node.state.to_move,
                             untried=[] if game.is_terminal(s) else game.actions(s))
            node.children.append(child)
            node = child
        # 3. simulation
        s = node.state
        while not game.is_terminal(s):
            s = game.result(s, rng.choice(game.actions(s)))
        u = game.utility(s, 'X')
        winner = 'X' if u > 0 else 'O' if u < 0 else None
        # 4. backpropagation
        while node is not None:
            node.N += 1
            node.U += 0.5 if winner is None else (1 if winner == node.player else 0)
            node = node.parent
    return max(root.children, key=lambda c: c.N).move
'''

HINTS = [
    'Write the four phases one after the other inside the loop, all working on the same variable `node`; after expansion `node` is the new child.',
    'A terminal node has no untried moves and no children: selection stops there, expansion does nothing, the "playout" is empty and you backpropagate its real result. That is how MCTS discovers forced wins.',
    'Expansion: `move = node.untried.pop(rng.randrange(len(node.untried)))`; simulation: `while not game.is_terminal(s): s = game.result(s, rng.choice(game.actions(s)))`.',
]

EXPLANATION = r"""
MCTS found the winning moves, the blocks and even the fork defence **without an evaluation function**
and without any tic-tac-toe knowledge: random playouts are enough to explore the search space
(slides p. 453). Selective search does the rest — after a few hundred iterations most simulations go
through the moves that matter, and the tree near the root becomes a (sampled) minimax tree:
a move that allows an immediate loss gets refuted because the opponent's winning reply is a
terminal node whose UCB1 keeps attracting simulations.

- **Anytime** (slides p. 415): stop after any number of iterations and you still get an answer
  (the most-visited child); more iterations → better answers.
- The final choice uses the **visit count** $N$, not UCB1 and not the raw win rate: a child with 1 win
  in 1 playout is not trustworthy, the most explored one is.
- Costs: simulations are expensive in complex games and random playouts can be misleading — which
  is why AlphaZero replaces them with a learned value network (option #4, slides p. 471–477).

Compared with alpha-beta: no $e(s)$ needed, a sparse asymmetric tree instead of a uniform one, but
only a statistical guarantee: with few iterations MCTS can blunder.
"""

ENTRY = 'mcts'

_SEEDS = (0, 1, 2)


def _moves(rows, n_iter=1000):
    def call(sol):
        game = TicTacToe()
        return [sol.mcts(game, ttt_position(rows), n_iter, random.Random(seed)) for seed in _SEEDS]
    return call


def _all_in(good, why):
    def check(got):
        bad = [m for m in got if m not in good]
        return not bad, '' if not bad else f'seeds {list(_SEEDS)} returned {got}: {why}'
    return check


def _deterministic(sol):
    game, s = TicTacToe(), ttt_position(['X..', '...', '...'])
    return sol.mcts(game, s, 300, random.Random(5)) == sol.mcts(game, s, 300, random.Random(5))


_EDGES = [(1, 0), (0, 1), (2, 1), (1, 2)]

TESTS = [
    Test('X wins in one', call=_moves(['XX.', 'OO.', '...']), check=_all_in([(2, 0)], '(2, 0) completes the top row'),
         show="ttt_position(['XX.', 'OO.', '...']), n_iter=1000, seeds 0-2"),
    Test('O wins in one', call=_moves(['XX.', 'OO.', 'X..']), check=_all_in([(2, 1)], '(2, 1) completes the middle row'),
         show="ttt_position(['XX.', 'OO.', 'X..']), n_iter=1000, seeds 0-2"),
    Test('X must block the top row', call=_moves(['OO.', 'X..', 'X..']), check=_all_in([(2, 0)], 'O threatens (2, 0)'),
         show="ttt_position(['OO.', 'X..', 'X..']), n_iter=1000, seeds 0-2"),
    Test('O must block the diagonal', call=_moves(['O..', '.X.', 'X..']), check=_all_in([(2, 0)], 'X threatens (2, 0)'),
         show="ttt_position(['O..', '.X.', 'X..']), n_iter=1000, seeds 0-2"),
    Test('O must block (2, 2)', call=_moves(['XO.', '.X.', '...']), check=_all_in([(2, 2)], 'X threatens the main diagonal'),
         show="ttt_position(['XO.', '.X.', '...']), n_iter=1000, seeds 0-2"),
    Test('fork defence: O answers on an edge', call=_moves(['X..', '.O.', '..X'], 2000), check=_all_in(_EDGES, 'a corner lets X build a fork'),
         show="ttt_position(['X..', '.O.', '..X']), n_iter=2000, seeds 0-2"),
    Test('first move: not an edge', call=_moves(['...', '...', '...'], 2000),
         check=_all_in([(1, 1), (0, 0), (2, 0), (0, 2), (2, 2)], 'edges are the weakest first moves (usually MCTS picks the center)'),
         show='empty board, n_iter=2000, seeds 0-2  (the center, almost always)', timeout=20),
    Test('anytime: one iteration still gives a legal move',
         call=lambda sol: sol.mcts(TicTacToe(), ttt_position(['XO.', '.X.', '...']), 1, random.Random(0)),
         check=lambda got: got in TicTacToe().actions(ttt_position(['XO.', '.X.', '...'])) or (False, 'not a legal move'),
         show="ttt_position(['XO.', '.X.', '...']), n_iter=1"),
    Test('same seed, same move', call=_deterministic, expected=True,
         show='two runs with random.Random(5) must agree: use only the rng you are given'),
]
