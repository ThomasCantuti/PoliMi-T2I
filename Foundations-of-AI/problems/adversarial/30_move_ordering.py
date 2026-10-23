import math
import random

from harness import Test
from aima import TreeGame, infinity

TITLE = 'Perfect move ordering for alpha-beta'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['alpha-beta', 'move ordering', 'O(b^(h/2))', 'best case']

STATEMENT = r"""
The efficiency of alpha-beta depends on the **order** in which children are examined
(slides p. 377). In the best case:

- children of **MAX** nodes are considered in **decreasing** order of their minimax values,
- children of **MIN** nodes in **increasing** order.

Write `order_moves(tree)` that returns a **reordered copy** of a nested-list game tree
(MAX at the root, players alternate, leaves are utilities for MAX) with this perfect ordering
at **every** node. Keep equal-valued siblings in their original relative order (a *stable* sort:
Python's `sorted` is stable, also with `reverse=True`).

```text
order_moves([[3, 12, 8], [2, 4, 6], [14, 5, 2]])
     -> [[3, 8, 12], [2, 4, 6], [2, 5, 14]]
alpha-beta now reads 5 leaves instead of 7:  3, 8, 12, then one leaf (2) per other MIN node
```

You will need the minimax value of every subtree: write a small helper `value(tree, maximizing)`.
The tests run alpha-beta on your tree and compare the number of leaves read with the theoretical
best case for a uniform tree with branching $b$, depth $m$ and distinct leaves:
$\;b^{\lceil m/2 \rceil} + b^{\lfloor m/2 \rfloor} - 1$.
"""

STARTER = '''def order_moves(tree: list | float, maximizing: bool = True) -> list | float:
    """Return a copy of tree where the children of MAX nodes are sorted by decreasing
    minimax value and the children of MIN nodes by increasing value (stable)."""
    if not isinstance(tree, list):      # a leaf: utility for MAX
        return tree
    # TODO: reorder each child's subtree first (the players alternate),
    #       then sort the children by their minimax value
    return tree
'''

SOLUTION = '''def value(tree: list | float, maximizing: bool = True) -> float:
    """Minimax value of a nested-list tree."""
    if not isinstance(tree, list):
        return tree
    values = [value(child, not maximizing) for child in tree]
    return max(values) if maximizing else min(values)


def order_moves(tree: list | float, maximizing: bool = True) -> list | float:
    """Return a copy of tree where the children of MAX nodes are sorted by decreasing
    minimax value and the children of MIN nodes by increasing value (stable)."""
    if not isinstance(tree, list):
        return tree
    children = [order_moves(child, not maximizing) for child in tree]
    return sorted(children, key=lambda c: value(c, not maximizing), reverse=maximizing)
'''

HINTS = [
    'The best move for the player to move should be tried **first**: it produces the tightest α (or β) as early as possible, and tight bounds prune.',
    'Recursion: a leaf stays as it is; an internal node reorders each child (with `not maximizing`), then sorts the reordered children.',
    'Sort key: the minimax value of the child, computed with the *child\'s* role: `sorted(children, key=lambda c: value(c, not maximizing), reverse=maximizing)`.',
]

EXPLANATION = r"""
With perfect ordering the first child of every node is its best one, so:

- at a MAX node the first child fixes α to the **true** value of the node;
- every other child (a MIN node) is refuted by its **first** grandchild: that grandchild is
  already $\le \alpha$, so the rest of the MIN node is pruned.

Counting the leaves that survive gives $b^{\lceil m/2\rceil} + b^{\lfloor m/2\rfloor} - 1$
(Knuth & Moore), i.e. $O(b^{m/2})$: with the same time alpha-beta searches **twice as deep**.
For the 3-ary tree of depth 4 in the tests that is 17 leaves out of 81.

Of course, ordering by the *true* minimax values requires already knowing them — this cannot be
guaranteed in practice (slides p. 377). Real programs approximate it: try first the moves that were
best in a previous shallower search (iterative deepening), captures and threats, "killer moves".
The general principle (slides p. 380): **expand the most promising moves first**.
"""

ENTRY = 'order_moves'


def _value(tree, maximizing=True):
    if not isinstance(tree, list):
        return tree
    vals = [_value(c, not maximizing) for c in tree]
    return max(vals) if maximizing else min(vals)


def _order(tree, maximizing=True):
    if not isinstance(tree, list):
        return tree
    kids = [_order(c, not maximizing) for c in tree]
    return sorted(kids, key=lambda c: _value(c, not maximizing), reverse=maximizing)


def _ab_leaves(tree):
    """Number of leaves read by alpha-beta (AIMA Figure 6.7) on a nested-list tree."""
    game = TreeGame(tree)

    def max_value(s, alpha, beta):
        if game.is_terminal(s):
            return game.utility(s, 'MAX')
        v = -infinity
        for a in game.actions(s):
            v = max(v, min_value(game.result(s, a), alpha, beta))
            alpha = max(alpha, v)
            if v >= beta:
                return v
        return v

    def min_value(s, alpha, beta):
        if game.is_terminal(s):
            return game.utility(s, 'MAX')
        v = +infinity
        for a in game.actions(s):
            v = min(v, max_value(game.result(s, a), alpha, beta))
            beta = min(beta, v)
            if v <= alpha:
                return v
        return v

    max_value(game.initial, -infinity, +infinity)
    return len(game.evaluated)


def _check(got, tree):
    want = _order(tree)
    if got == want:
        return True, f'alpha-beta reads {_ab_leaves(got)} leaves (original order: {_ab_leaves(tree)})'
    try:
        mine = f'; your tree makes alpha-beta read {_ab_leaves(got)} leaves, the perfect ordering {_ab_leaves(want)}'
    except Exception:
        mine = ''
    return False, f'expected {want}{mine}'


def _check_uniform(b, m):
    def check(got, tree):
        ok, msg = _check(got, tree)
        best = b ** math.ceil(m / 2) + b ** (m // 2) - 1
        return ok, f'{msg}; best case b^ceil(m/2) + b^floor(m/2) - 1 = {best} of {b ** m}'
    return check


def _uniform(b, m, seed):
    rng = random.Random(seed)
    leaves = rng.sample(range(-99, 100), b ** m)

    def build(depth):
        return leaves.pop() if depth == 0 else [build(depth - 1) for _ in range(b)]
    return build(m)


TESTS = [
    Test('move ordering example p. 378', args=([[10], [11, 0]],), check=_check),
    Test('Figure 5.2', args=([[3, 12, 8], [2, 4, 6], [14, 5, 2]],), check=_check),
    Test('homework tree p. 379', args=([[[10, 6], [100, 8]], [[1, 2], [20, 4]]],), check=_check),
    Test('equal values keep their order', args=([[5, 2], [9, 2]],), check=_check),
    Test('leaves at different depths', args=([5, [1, 10], [[8, 9], 4]],), check=_check),
    Test('a single leaf', args=(42,), expected=42),
    Test('uniform tree b=2, m=4', args=(_uniform(2, 4, 1),), check=_check_uniform(2, 4),
         show='binary tree of depth 4 (16 distinct leaves)'),
    Test('uniform tree b=3, m=3', args=(_uniform(3, 3, 2),), check=_check_uniform(3, 3),
         show='3-ary tree of depth 3 (27 distinct leaves)'),
    Test('uniform tree b=3, m=4', args=(_uniform(3, 4, 3),), check=_check_uniform(3, 4),
         show='3-ary tree of depth 4 (81 distinct leaves)'),
]
