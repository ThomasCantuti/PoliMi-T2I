from harness import Test
from adversarial_lib import ChanceTreeGame

TITLE = 'Expectiminimax'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['expectiminimax', 'chance nodes', 'stochastic games', 'expected value']

STATEMENT = r"""
In games with dice (backgammon) or unpredictable outcomes, the game tree has **chance nodes**.
MAX can no longer count on the worst case: the value of a chance node is the **expected value**
of its outcomes (slides p. 392, 400):

$$
\text{EXPECTIMINIMAX}(s) =
\begin{cases}
\text{UTILITY}(s, \text{MAX}) & \text{if IS-TERMINAL}(s) \\
\max_a \text{EXPECTIMINIMAX}(\text{RESULT}(s, a)) & \text{if TO-MOVE}(s) = \text{MAX} \\
\min_a \text{EXPECTIMINIMAX}(\text{RESULT}(s, a)) & \text{if TO-MOVE}(s) = \text{MIN} \\
\sum_r P(r)\, \text{EXPECTIMINIMAX}(\text{RESULT}(s, r)) & \text{if TO-MOVE}(s) = \text{CHANCE}
\end{cases}
$$

Write `expectiminimax(game, state)` → `(value, move)`: the value of `state` and the best move
there (the **first** best on ties; `None` at CHANCE and terminal states).

`ChanceTreeGame(tree)` (from `adversarial_lib`) is an explicit tree:

```text
leaf:   a number (utility for MAX)
        ('MAX', [tree, ...])   ('MIN', [tree, ...])   ('CHANCE', [(p, tree), ...])

game = ChanceTreeGame(('MAX', [('CHANCE', [(.5, 10), (.5, 10)]),      # = 10
                               ('CHANCE', [(.5, 9),  (.5, 100)])]))   # = 54.5
state.to_move in {'MAX', 'MIN', 'CHANCE', None}; game.actions(state); game.result(state, a)
at a CHANCE state the actions are the outcomes r, with probability game.probability(state, r)
```

**Example (slide p. 393):** the tree above → `(54.5, 1)`. With MIN nodes instead of chance
nodes, minimax would pick the left branch (value 10).
"""

STARTER = '''from aima import TreeState, infinity
from adversarial_lib import ChanceTreeGame

def expectiminimax(game: ChanceTreeGame, state: TreeState) -> tuple[float, int | None]:
    """Return (value, move): the expectiminimax value of state (for MAX) and the best
    move at state (None at CHANCE and terminal states)."""

    def value(state: TreeState) -> tuple[float, int | None]:
        # TODO: terminal -> utility for 'MAX'
        # TODO: CHANCE -> sum of P(r) * value(result(state, r)) over the outcomes r
        # TODO: MAX / MIN -> best child, keep the first best move
        return 0, None

    return value(state)
'''

SOLUTION = '''from aima import TreeState, infinity
from adversarial_lib import ChanceTreeGame

def expectiminimax(game: ChanceTreeGame, state: TreeState) -> tuple[float, int | None]:
    """Return (value, move): the expectiminimax value of state (for MAX) and the best
    move at state (None at CHANCE and terminal states)."""

    def value(state: TreeState) -> tuple[float, int | None]:
        if game.is_terminal(state):
            return game.utility(state, 'MAX'), None
        if state.to_move == 'CHANCE':
            return sum(game.probability(state, r) * value(game.result(state, r))[0]
                       for r in game.actions(state)), None
        if state.to_move == 'MAX':
            v, move = -infinity, None
            for a in game.actions(state):
                v2, _ = value(game.result(state, a))
                if v2 > v:
                    v, move = v2, a
        else:
            v, move = +infinity, None
            for a in game.actions(state):
                v2, _ = value(game.result(state, a))
                if v2 < v:
                    v, move = v2, a
        return v, move

    return value(state)
'''

HINTS = [
    'One recursive function `value(state)` is enough: look at `state.to_move` to decide whether to take a max, a min or an average.',
    'Utilities are always for MAX: `game.utility(state, \'MAX\')` (MIN minimizes that same number).',
    'Chance node: `sum(game.probability(state, r) * value(game.result(state, r))[0] for r in game.actions(state))`, with move `None`.',
]

EXPLANATION = r"""
**Values matter** (slides p. 397). Map the leaves of the left tree with the order-preserving
transformation $1 \to 1,\ 2 \to 20,\ 3 \to 30,\ 4 \to 400$: the best move flips from $a_1$
($0.9 \cdot 2 + 0.1 \cdot 3 = 2.1$ vs $1.3$) to $a_2$ ($21$ vs $0.9 \cdot 1 + 0.1 \cdot 400 = 40.9$).

- In **deterministic** games only the **order** of the values matters: max and min commute with any
  increasing transformation, so minimax picks the same move — $e(s)$ only needs to rank states.
- With **chance** nodes the averages depend on the actual magnitudes: $e(s)$ must be a positive
  **linear** transformation of the expected utility (e.g. a probability of winning). The test with
  $2x + 1$ keeps the decision, the one with $1, 20, 30, 400$ does not.

Complexity: with $n$ distinct dice outcomes, $O(b^m n^m)$ — chance multiplies the branching, so
expectiminimax cannot look very far ahead (backgammon: $n = 21$). If there are no MIN nodes the
algorithm is called **expectimax** (slides p. 393, 400).
"""

ENTRY = 'expectiminimax'


def MAX(*children):
    return ('MAX', list(children))


def MIN(*children):
    return ('MIN', list(children))


def CHANCE(*pairs):
    return ('CHANCE', list(pairs))


def _run(tree):
    def call(sol):
        game = ChanceTreeGame(tree)
        return sol.expectiminimax(game, game.initial)
    return call


_P393 = MAX(CHANCE((.5, 10), (.5, 10)), CHANCE((.5, 9), (.5, 100)))
_P392 = MAX(MIN(10, 10), MIN(9, 100))
_F397 = MAX(CHANCE((.9, MIN(2, 2)), (.1, MIN(3, 3))), CHANCE((.9, MIN(1, 1)), (.1, MIN(4, 4))))
_F397T = MAX(CHANCE((.9, MIN(20, 20)), (.1, MIN(30, 30))), CHANCE((.9, MIN(1, 1)), (.1, MIN(400, 400))))
_LINEAR = MAX(CHANCE((.9, MIN(5, 5)), (.1, MIN(7, 7))), CHANCE((.9, MIN(3, 3)), (.1, MIN(9, 9))))
_DICE = MAX(CHANCE((1 / 36, MIN(CHANCE((.5, 3), (.5, -1)), 2)), (35 / 36, MIN(4, CHANCE((.5, 6), (.5, 0))))),
            CHANCE((1 / 36, MIN(1, 5)), (35 / 36, MIN(CHANCE((.5, 8), (.5, 2)), 6))))

TESTS = [
    Test('slide p. 393: MAX + chance nodes', call=_run(_P393), expected=(54.5, 1),
         show="('MAX', [('CHANCE', [(.5, 10), (.5, 10)]), ('CHANCE', [(.5, 9), (.5, 100)])])"),
    Test('slide p. 392: the same tree with MIN nodes', call=_run(_P392), expected=(10, 0),
         show="('MAX', [('MIN', [10, 10]), ('MIN', [9, 100])])"),
    Test('slide p. 397 (left): 2.1 vs 1.3', call=_run(_F397), expected=(2.1, 0),
         show='MAX -> CHANCE(.9 / .1) -> MIN -> leaves 2 2 | 3 3 | 1 1 | 4 4'),
    Test('slide p. 397 (right): order-preserving change flips the move', call=_run(_F397T),
         expected=(40.9, 1), show='same tree, leaves 20 20 | 30 30 | 1 1 | 400 400'),
    Test('linear change 2x+1 keeps the move', call=_run(_LINEAR), expected=(5.2, 0),
         show='same tree, leaves 5 5 | 7 7 | 3 3 | 9 9'),
    Test('dice probabilities, chance below MIN', call=_run(_DICE), expected=(4.888888888888889, 1),
         show='MAX -> CHANCE(1/36, 35/36) -> MIN -> (leaf or CHANCE(.5, .5))'),
    Test('the root is a chance node', call=_run(CHANCE((.25, 4), (.75, 8))), expected=(7.0, None),
         show="('CHANCE', [(.25, 4), (.75, 8)])"),
    Test('no chance nodes: plain minimax', call=_run(MAX(MIN(3, 12, 8), MIN(2, 4, 6), MIN(14, 5, 2))),
         expected=(3, 0), show='Figure 5.2 written with MAX/MIN nodes'),
    Test('the root is a leaf', call=_run(7), expected=(7, None), show='ChanceTreeGame(7)'),
]
