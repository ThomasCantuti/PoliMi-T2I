import math

from harness import Test
from mcts_lib import make_tree

TITLE = 'MCTS selection with UCB1 (UCT)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['MCTS', 'selection', 'UCT', 'UCB1']

STATEMENT = r"""
**Selection** (slides p. 413): starting at the root, descend the tree choosing at each node the child
with the largest $\text{UCB1}$ (slides p. 444), until you reach a node that has **untried moves** or
**no children**. This is UCB1 applied to trees: **UCT**.

Write `select(root, C)` → the list of **moves** along the path from the root to that node
(`[]` if the root itself is returned).

Each node is an `MCTSNode` (from `mcts_lib`) with:

- `node.children` (list of nodes, in order), `node.untried` (list of moves not expanded yet), `node.move`, `node.parent`;
- `node.U`, `node.N`: wins and simulations. **Convention:** `U` counts the wins of the player who made
  the move **into** the node — the player choosing at the parent. So every player simply picks the
  child with the **largest** UCB1. A child with `N = 0` has an infinite UCB1. Ties → the first child.

```text
step-by-step example, slide p. 446-447  (C = 1)          stats written as U/N
            root 2/4
         a1 /      \ a2
         2/3        0/1          UCB1(a1) = 2/3 + sqrt(ln 4 / 3) = 1.346  >  UCB1(a2) = 1.177
      b1 /   \ b2
       1/1   0/1                 MIN wins, i.e. 0/1 and 1/1 in the slide's "MAX wins" notation

select(root, 1) -> ['a1', 'b1']
```

Build your own trees with `make_tree((U, N, {move: (U, N, {...}), ...}))`.
"""

STARTER = '''import math
from mcts_lib import MCTSNode

def ucb1(n: MCTSNode, C: float) -> float:
    """UCB1 of node n (infinite if never visited)."""
    # TODO: your ucb1 from the previous problem, with n.U, n.N, n.parent.N
    return 0.0


def select(root: MCTSNode, C: float) -> list[str]:
    """Descend from root by largest UCB1 while the node has children and no untried moves.
    Return the list of moves of the path."""
    node, path = root, []
    # TODO
    return path
'''

SOLUTION = '''import math
from mcts_lib import MCTSNode

def ucb1(n: MCTSNode, C: float) -> float:
    """UCB1 of node n (infinite if never visited)."""
    if n.N == 0:
        return math.inf
    return n.U / n.N + C * math.sqrt(math.log(n.parent.N) / n.N)


def select(root: MCTSNode, C: float) -> list[str]:
    """Descend from root by largest UCB1 while the node has children and no untried moves.
    Return the list of moves of the path."""
    node, path = root, []
    while node.children and not node.untried:
        node = max(node.children, key=lambda child: ucb1(child, C))
        path.append(node.move)
    return path
'''

HINTS = [
    'The loop condition is the stopping rule of the slides: keep going `while node.children and not node.untried`.',
    'At each node: `node = max(node.children, key=lambda c: ucb1(c, C))` — `max` returns the first of equal values, which is the tie rule.',
    '$N(\\text{Parent}(n))$ is `n.parent.N`. Append `node.move` after each step.',
]

EXPLANATION = r"""
Selection is a **bandit problem at every node**: each child is an arm whose payoff is the win rate
of the simulations through it. UCB1 sends most simulations to the promising branches while still
checking the others now and then — MCTS grows a **sparse, asymmetric** tree (slides p. 410).

Why the convention matters: if every node stored the wins of the **root** player (the first option on
slide p. 419), at the opponent's levels you would have to choose the child that is best **for the
opponent**, i.e. with the largest $(N - U)/N$ + bonus. The slide's step 10 does exactly that: from
$a_1$ it descends into the child marked 0/1 (MAX wins) — the best reply for MIN. Storing the wins
of the player who moved into $n$ (the convention of AIMA Figure 6.10) makes the rule uniform.

Effect of $C$ on Figure 6.10: with $C = \sqrt2$ (or $C = 0$) selection follows 60/79 → 16/53 → 27/35,
as in the book; with $C = 2$ the root prefers the barely explored 2/11 node.
"""

ENTRY = 'select'

_STEP9 = (2, 4, {'a1': (2, 3, {'b1': (1, 1), 'b2': (0, 1)}), 'a2': (0, 1)})
_STEP11 = (3, 5, {'a1': (2, 4, {'b1': (2, 2, {'c1': (0, 1)}), 'b2': (0, 1)}), 'a2': (0, 1)})
_FIG610 = (37, 100, {'A': (60, 79, {'A1': (3, 26), 'A2': (16, 53, {'A21': (27, 35), 'A22': (10, 18)})}),
                     'B': (1, 10, {'B1': (6, 6, {'B11': (0, 3), 'B12': (0, 3)}), 'B2': (3, 4)}),
                     'C': (2, 11)})
_FIG_SHOW = 'Figure 6.10: 37/100 -> A 60/79 (A1 3/26, A2 16/53 (A21 27/35, A22 10/18)), B 1/10 (...), C 2/11'


def _select(spec, C, edit=None):
    def call(sol):
        root = make_tree(spec)
        if edit:
            edit(root)
        return sol.select(root, C)
    return call


def _with_untried(root):
    root.children[0].untried = ['b3']        # a1 still has an unexpanded move


TESTS = [
    Test('step-by-step example (9-10), C = 1', call=_select(_STEP9, 1), expected=['a1', 'b1'],
         show="root 2/4: a1 2/3 (b1 1/1, b2 0/1), a2 0/1 ; C=1"),
    Test('same tree, C = sqrt(2): exploration wins', call=_select(_STEP9, math.sqrt(2)), expected=['a2'],
         show="root 2/4: a1 2/3 (b1 1/1, b2 0/1), a2 0/1 ; C=sqrt(2)"),
    Test('same tree, C = 0: pure exploitation', call=_select(_STEP9, 0), expected=['a1', 'b1'],
         show="root 2/4: a1 2/3 (b1 1/1, b2 0/1), a2 0/1 ; C=0"),
    Test('step-by-step example (11), C = 1', call=_select(_STEP11, 1), expected=['a2'],
         show="root 3/5: a1 2/4 (b1 2/2 (c1 0/1), b2 0/1), a2 0/1 ; C=1"),
    Test('Figure 6.10, C = sqrt(2)', call=_select(_FIG610, math.sqrt(2)), expected=['A', 'A2', 'A21'],
         show=_FIG_SHOW + ' ; C=sqrt(2)'),
    Test('Figure 6.10, C = 2', call=_select(_FIG610, 2), expected=['C'], show=_FIG_SHOW + ' ; C=2'),
    Test('stop at a node with untried moves', call=_select(_STEP9, 1, _with_untried), expected=['a1'],
         show="step-9 tree where a1 still has an untried move ; C=1"),
    Test('a never-visited child: infinite UCB1', call=lambda sol: sol.select(make_tree((5, 9, {'x': (4, 8), 'y': (0, 0)})), 1),
         expected=['y'], show="root 5/9: x 4/8, y 0/0 ; C=1"),
    Test('a never-visited grandchild', call=_select((1, 10, {'x': (8, 9, {'x1': (1, 8), 'x2': (0, 0)}), 'y': (0, 1)}), 0.5),
         expected=['x', 'x2'], show="root 1/10: x 8/9 (x1 1/8, x2 0/0), y 0/1 ; C=0.5"),
    Test('ties go to the first child', call=lambda sol: sol.select(make_tree((2, 4, {'x': (1, 2), 'y': (1, 2)})), 1),
         expected=['x'], show="root 2/4: x 1/2, y 1/2 ; C=1"),
    Test('a lone root', call=lambda sol: sol.select(make_tree((0, 0)), 1), expected=[], show='root 0/0, no children'),
]
