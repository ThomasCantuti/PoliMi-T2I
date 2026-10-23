from harness import Test
from mcts_lib import MCTSNode, make_tree

TITLE = 'MCTS backpropagation: whose win is it?'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['MCTS', 'backpropagation', 'perspective', 'W/N statistics']

STATEMENT = r"""
**Backpropagation** (slides p. 413): the result of the playout is used to update **all** the nodes
on the path from the simulated node back to the root.

Write `backpropagate(node, winner)`: starting at `node` and following `.parent` up to the root
(included), add 1 to `N` of every node, and add to `U`:

- `1` if `winner == node.player` (the player who made the move **into** that node won),
- `0.5` if the game was a draw (`winner is None`),
- `0` otherwise.

```text
AIMA Figure 6.10 (black to move at the root; each node counts the wins of the player who moved into it)

before:  37/100  ->  60/79 (black)  ->  16/53 (white)  ->  27/35 (black)  ->  new 0/0 (white)
playout from the new node: black wins
after:   37/101  ->  61/80          ->  16/54          ->  28/36          ->  0/1
```

Wins alternate: one playout is a win for one player and a loss for the other, so only every other
node on the path gets `U + 1`. Nothing to return: the nodes are updated in place.
"""

STARTER = '''from mcts_lib import MCTSNode

def backpropagate(node: MCTSNode, winner: str | None) -> None:
    """Update N and U from node up to the root.
    winner: the player who won the playout, or None for a draw."""
    # TODO: walk up with node = node.parent until None
    pass
'''

SOLUTION = '''from mcts_lib import MCTSNode

def backpropagate(node: MCTSNode, winner: str | None) -> None:
    """Update N and U from node up to the root.
    winner: the player who won the playout, or None for a draw."""
    while node is not None:
        node.N += 1
        if winner is None:
            node.U += 0.5
        elif winner == node.player:
            node.U += 1
        node = node.parent
'''

HINTS = [
    'A simple loop: `while node is not None: …; node = node.parent`.',
    '`N` grows for **every** node on the path: each of them took part in this simulation.',
    '`U` grows only where `node.player == winner` (or by 0.5 everywhere for a draw).',
]

EXPLANATION = r"""
Each node's $U/N$ is the win rate **of the player who chooses that node** — the one deciding at its
parent. That is what makes UCB1 selection work unchanged at every level: MAX picks the child best for
MAX, MIN the child best for MIN (just as in minimax, the opponent is assumed to play well).

The slides' step-by-step example (p. 417–424) writes instead the wins of the **root** player in every
node (the first option on slide p. 419). Both are fine as long as you are consistent: with root-player
counts, at the opponent's levels the win rate to maximize is $(N - U)/N$. A classic bug is to add the
reward to every node on the path: then MIN "chooses" the moves that are best for MAX.

Draws count one half for both sides. The root's own `U` is never used by selection (it has no parent
to choose it); only $N(\text{root})$ matters, in the $\log N(\text{Parent}(n))$ of its children.
"""

ENTRY = 'backpropagate'

_FIG610 = (37, 100, {'A': (60, 79, {'A1': (3, 26), 'A2': (16, 53, {'A21': (27, 35), 'A22': (10, 18)})}),
                     'B': (1, 10), 'C': (2, 11)})


def _path_stats(node):
    out = []
    while node is not None:
        out.append(f'{node.U:g}/{node.N}')
        node = node.parent
    return out[::-1]


def _fig610(sol, winner):
    root = make_tree(_FIG610, players=('black', 'white'))
    leaf = root.children[0].children[1].children[0]                  # 27/35
    new = MCTSNode(parent=leaf, move='new', player='white')
    leaf.children.append(new)
    sol.backpropagate(new, winner)
    return _path_stats(new)


def _siblings(sol):
    root = make_tree(_FIG610, players=('black', 'white'))
    sol.backpropagate(root.children[0].children[1].children[0], 'white')
    return [f'{c.U:g}/{c.N}' for c in root.children] + [f'{c.U:g}/{c.N}' for c in root.children[0].children]


def _step10(sol):
    # slide p. 448-449: the new node under b1 is simulated and MIN wins (utility -1)
    root = make_tree((2, 4, {'a1': (2, 3, {'b1': (1, 1), 'b2': (0, 1)}), 'a2': (0, 1)}))
    b1 = root.children[0].children[0]
    new = MCTSNode(parent=b1, move='c1', player='MAX')
    b1.children.append(new)
    sol.backpropagate(new, 'MIN')
    return _path_stats(new)


TESTS = [
    Test('Figure 6.10: black wins', call=lambda sol: _fig610(sol, 'black'),
         expected=['37/101', '61/80', '16/54', '28/36', '0/1'],
         show='path 37/100 -> 60/79 -> 16/53 -> 27/35 -> new 0/0, winner black'),
    Test('same path, white wins', call=lambda sol: _fig610(sol, 'white'),
         expected=['38/101', '60/80', '17/54', '27/36', '1/1'],
         show='path 37/100 -> 60/79 -> 16/53 -> 27/35 -> new 0/0, winner white'),
    Test('a draw is half a win for everybody', call=lambda sol: _fig610(sol, None),
         expected=['37.5/101', '60.5/80', '16.5/54', '27.5/36', '0.5/1'],
         show='same path, winner None'),
    Test('nodes off the path are untouched', call=_siblings,
         expected=['60/80', '1/10', '2/11', '3/26', '17/54'],
         show='backpropagate(27/35 node, white) -> stats of A, B, C, A1, A2'),
    Test('step-by-step example (slide p. 449): MIN wins', call=_step10,
         expected=['3/5', '2/4', '2/2', '0/1'],
         show='root 2/4 -> a1 2/3 -> b1 1/1 -> new c1, winner MIN  (slide notation, MAX wins: 2/5, 2/4, 0/2, 0/1)'),
]
