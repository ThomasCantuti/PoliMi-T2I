from harness import Test
from aima import infinity
from adversarial_lib import ChanceTreeGame

TITLE = 'Pruning chance nodes with bounded utilities'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['expectimax', 'alpha-beta', 'chance nodes', 'bounds']

STATEMENT = r"""
Can alpha-beta prune **chance nodes**? At first sight no: one unseen outcome could have a huge
value and change the average. But if we **know the range** $[lo, hi]$ of the utilities, an
upper bound on a chance node is available before all its outcomes are seen (slides p. 398–399):

$$\text{value} \;\le\; \underbrace{\textstyle\sum_{\text{seen}} P(r)\, v_r}_{\text{partial sum}} \;+\; \Big(1 - \textstyle\sum_{\text{seen}} P(r)\Big)\cdot hi$$

If this bound is already $\le \alpha$ (the best value MAX has so far), the remaining outcomes are
**pruned**: the chance node cannot be strictly better.

Write `expectimax_alphabeta(game, state, lo, hi)` → `(value, move)` for trees shaped like the slide:
a **MAX** root whose children are **CHANCE** nodes whose outcomes are **leaves**. Visit the chance
nodes and their outcomes left to right, read each leaf with `game.utility(result, 'MAX')`, and stop a
chance node as soon as its bound is $\le \alpha$. The tests check `game.evaluated`.

```text
                  MAX = 8
        /           |              \
   CHANCE = 8   CHANCE <= 7      CHANCE <= 7      (each outcome p = 1/3), range [0, 15]
   /  |  \      /  |   ×          /  |   ×
  3  12   9    2   4   6         0   6   15

second node: after 2 and 4 the bound is (2 + 4 + 15)/3 = 7 <= 8  -> 6 is pruned
evaluated: [3, 12, 9, 2, 4, 0, 6]
```
"""

STARTER = '''from aima import TreeState, infinity
from adversarial_lib import ChanceTreeGame

def expectimax_alphabeta(game: ChanceTreeGame, state: TreeState, lo: float,
                         hi: float) -> tuple[float, int | None]:
    """MAX root -> CHANCE children -> leaves. Utilities are known to lie in [lo, hi].
    Return (value, move), pruning the outcomes that cannot make a chance node better than alpha."""
    alpha, best = -infinity, None
    for a in game.actions(state):
        chance = game.result(state, a)
        # TODO: accumulate P(r) * utility over the outcomes r of `chance`,
        #       stop early when partial + (remaining probability) * hi <= alpha,
        #       otherwise update alpha / best if the chance node is strictly better
    return alpha, best
'''

SOLUTION = '''from aima import TreeState, infinity
from adversarial_lib import ChanceTreeGame

def expectimax_alphabeta(game: ChanceTreeGame, state: TreeState, lo: float,
                         hi: float) -> tuple[float, int | None]:
    """MAX root -> CHANCE children -> leaves. Utilities are known to lie in [lo, hi].
    Return (value, move), pruning the outcomes that cannot make a chance node better than alpha."""
    alpha, best = -infinity, None
    for a in game.actions(state):
        chance = game.result(state, a)
        total, remaining = 0, 1
        for r in game.actions(chance):
            p = game.probability(chance, r)
            total += p * game.utility(game.result(chance, r), 'MAX')
            remaining -= p
            if total + remaining * hi <= alpha:   # cannot beat alpha: prune
                break
        else:
            if total > alpha:
                alpha, best = total, a
    return alpha, best
'''

HINTS = [
    'Keep two numbers per chance node: the partial sum $\\sum P(r) v_r$ of the outcomes seen so far and the probability mass not seen yet.',
    'After each outcome, the best the chance node can still reach is `total + remaining * hi`. If that is `<= alpha`, `break`: the node is useless for MAX.',
    'Only a chance node that was **fully** evaluated can become the new best (`for … else:` in Python runs the `else` only when the loop did not `break`). With `hi = +infinity` nothing is ever pruned.',
]

EXPLANATION = r"""
- **Unknown range** (`hi = +infinity`): the bound is always $+\infty$, nothing can be pruned — any
  unseen outcome might be enormous. This is the first question on slide p. 398.
- **Known range** $[0, 15]$: 6 and 15 are never read. The tighter the known bounds, the earlier the
  cut: with range $[0, 100]$ nothing is pruned on the same tree.
- Below a MIN node the mirror test uses the **lower** bound: $\text{partial} + \text{remaining}\cdot lo \ge \beta$.

The slides add two remarks: as depth increases, the probability of reaching a given node shrinks,
so the usefulness of deep search is diminished — and a limited depth is less damaging than in
deterministic games.

*Floating point:* with probabilities like 1/3 the bound may come out as 8.000000000000002 instead
of 8 and miss an "equal" cut; the tests use exact binary probabilities (0.5, 0.25) for that case.
"""

ENTRY = 'expectimax_alphabeta'


def _tree(*chance_nodes):
    return ('MAX', [('CHANCE', list(pairs)) for pairs in chance_nodes])


def _thirds(*rows):
    return _tree(*[[(1 / 3, v) for v in row] for row in rows])


def _run(tree, lo, hi):
    def call(sol):
        game = ChanceTreeGame(tree)
        value, move = sol.expectimax_alphabeta(game, game.initial, lo, hi)
        return value, move, game.evaluated
    return call


_SLIDE = _thirds([3, 12, 9], [2, 4, 6], [0, 6, 15])

TESTS = [
    Test('slide p. 399: range [0, 15]', call=_run(_SLIDE, 0, 15),
         expected=(8, 0, [3, 12, 9, 2, 4, 0, 6]),
         show='outcomes 1/3 each: [3, 12, 9] [2, 4, 6] [0, 6, 15], lo=0, hi=15  -> (value, move, evaluated)'),
    Test('unknown range: nothing can be pruned', call=_run(_SLIDE, -infinity, infinity),
         expected=(8, 0, [3, 12, 9, 2, 4, 6, 0, 6, 15]), show='same tree, lo=-inf, hi=+inf'),
    Test('loose range [0, 100]: nothing pruned', call=_run(_SLIDE, 0, 100),
         expected=(8, 0, [3, 12, 9, 2, 4, 6, 0, 6, 15]), show='same tree, lo=0, hi=100'),
    Test('prune after the first outcome', call=_run(_tree([(.5, 8), (.5, 8)], [(.9, 0), (.1, 10)]), 0, 10),
         expected=(8, 0, [8, 8, 0]), show='[(.5, 8), (.5, 8)]  [(.9, 0), (.1, 10)], lo=0, hi=10'),
    Test('equal bound is pruned too', call=_run(_tree([(.5, 6), (.5, 10)], [(.5, 0), (.5, 16)]), 0, 16),
         expected=(8, 0, [6, 10, 0]), show='[(.5, 6), (.5, 10)]  [(.5, 0), (.5, 16)], lo=0, hi=16'),
    Test('best move is not the first',
         call=_run(_tree([(.5, 2), (.5, 4)], [(.5, 5), (.5, 3)], [(.5, 1), (.5, 1)]), 0, 5),
         expected=(4, 1, [2, 4, 5, 3, 1]), show='[2, 4] [5, 3] [1, 1] (p = .5 each), lo=0, hi=5'),
    Test('unequal probabilities, no cut possible',
         call=_run(_tree([(.5, 6), (.5, 10)], [(.2, 1), (.8, 9)], [(.8, 9), (.2, 1)]), 0, 10),
         expected=(8, 0, [6, 10, 1, 9, 9, 1]), show='[(.5,6),(.5,10)] [(.2,1),(.8,9)] [(.8,9),(.2,1)], lo=0, hi=10'),
]
