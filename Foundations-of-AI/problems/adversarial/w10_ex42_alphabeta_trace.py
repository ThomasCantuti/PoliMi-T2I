TITLE = 'Exercise book 4.2 · Minimax and alpha-beta with α, β, v at every node'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exercise book', 'alpha-beta', 'α/β bounds', 'negative utilities']

STATEMENT = r"""
*Exercise book (Restelli, Gatti, Papini, Metelli), Exercise 4.2.*

Zero-sum game tree: MAX at the root, then MIN, MAX, MIN; leaves are utilities for MAX. (The book draws the tree rotated,
root on the left; here it is drawn top-down, with the book's bottom leaf first.)

```text
                               A                                  MAX
                ┌──────────────┴───────────────┐
                B                               C                 MIN
        ┌───────┴───────┐               ┌───────┴───────┐
        D               E               F               G         MAX
    ┌───┴───┐       ┌───┴───┐       ┌───┴───┐       ┌───┴───┐
    H       I       J       K       L       M       N       O     MIN
  ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐
 -2   4   6  -8  -3  -1   7  -5   2  -4  -6   8   3   1  -7   5
```

1. Apply minimax to find the best action for MAX at the root.
2. Do the same with alpha-beta pruning: predict the $(\alpha, \beta)$ each node receives, every cut-off and every
   returned value.

**Conventions** (AIMA Figure 6.7): children left to right; MAX: `α = max(α, v)`, prune when $v \ge \beta$;
MIN: `β = min(β, v)`, prune when $v \le \alpha$.
"""

HINTS = [
    'Minimax bottom-up: H = −2, I = −8, D = −2; J = −3, K = −5, E = −3; so B = −3. On the right, C = −4. Root = −3.',
    'E receives β = −2 from B (after D = −2). J then reads −3 and −1: −3 becomes E\'s α.',
    'C is entered with α = −3. F reads L = −4 (≤ α, but L is F\'s first child — F is a MAX node: does it cut?), then M sees −6 first.',
]

EXPLANATION = r"""
**Minimax** (book solution, verified): H = −2, I = −8, J = −3, K = −5, L = −4, M = −6, N = 1, O = −7;
D = −2, E = −3, F = −4, G = 1; B = −3, C = −4; **root = −3**, best action towards B.

**Alpha-beta** (book solution, verified): 11 of the 16 leaves are evaluated; the leaf 8 below M and the whole subtree G
(3, 1, −7, 5) are pruned.

| node | receives (α, β) | values of v | returns |
|---|---|---|---|
| A (MAX) | (−∞, +∞) | −∞, −3 | **−3** |
| B (MIN) | (−∞, +∞) | +∞, −2, −3 | −3 |
| D (MAX) | (−∞, +∞) | −∞, −2 | −2 |
| H (MIN) | (−∞, +∞) | +∞, −2 | −2 |
| I (MIN) | (−2, +∞) | +∞, 6, −8 | −8 |
| E (MAX) | (−∞, −2) | −∞, −3 | −3 |
| J (MIN) | (−∞, −2) | +∞, −3 | −3 |
| K (MIN) | (−3, −2) | +∞, 7, −5 | −5 |
| C (MIN) | (−3, +∞) | +∞, −4 | ≤ −4, **cut**: G pruned |
| F (MAX) | (−3, +∞) | −∞, −4 | −4 |
| L (MIN) | (−3, +∞) | +∞, 2, −4 | −4 |
| M (MIN) | (−3, +∞) | +∞, −6 | ≤ −6, **cut**: leaf 8 pruned |

Note F: it receives L = −4, which is below α = −3, but F is a MAX node: it can only cut when $v \ge \beta = +\infty$, so it
must also look at M. It is C (MIN) that finally cuts, once F returns −4 ≤ α = −3.

> **Convention difference.** At the nodes that cut off (C, M) the book does not write the last update of β (C: β = +∞
> instead of −4; M: β = +∞ instead of −6), and L and I stop their β list before the last leaf: it follows the
> 3rd-edition pseudocode, which tests `v ≤ α` **before** updating β. The course code (and this visualizer) updates
> first and then tests. Values, cut-offs and pruned nodes are identical; only the final β written at those nodes
> differs — in the exam use the course's order (see the Jan 2022 problem: min02 ends with β = 10).
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'alphabeta', 'askAlphaBeta': True,
          'tree': [[[[-2, 4], [6, -8]], [[-3, -1], [7, -5]]], [[[2, -4], [-6, 8]], [[3, 1], [-7, 5]]]]}
