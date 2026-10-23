TITLE = 'MCTS step by step: the slides example (6 iterations)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['MCTS', 'UCB1', 'selection', 'expansion', 'simulation', 'backpropagation']

STATEMENT = r"""
Replay the step-by-step example of slides p. 417–452: six iterations of Monte Carlo tree search on a game
where **every node has two moves** ($a_1$, $a_2$) and MAX plays at the root. The playouts end with:

| iteration | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| playout result | +1 | −1 | −1 | +1 | −1 | +1 |

You predict **which child UCB1 selects** (click it) and the **new W/N** of every node after backpropagation.

**Conventions** (the slides'):

- every node stores **W/N** = playouts won **by MAX** (the root player) / playouts through the node;
- **selection** descends while the node is fully expanded, maximising
  $\text{UCB1}(n) = \dfrac{U(n)}{N(n)} + C\sqrt{\dfrac{\ln N(\text{Parent}(n))}{N(n)}}$ with $C = 1$ and the natural log,
  where $U(n) = W$ when **MAX** chooses and $U(n) = N - W$ when **MIN** chooses (MIN wants MAX to lose);
  ties → leftmost child;
- **expansion** adds **one** child: the first untried move, $a_1$ before $a_2$;
- **backpropagation**: every node on the path gets $N + 1$, and $W + 1$ only if MAX won;
- at the end MCTS returns the root move with the **most playouts**.
"""

HINTS = [
    'Iterations 1 and 2 need no UCB1: the root still has untried moves, so they are expanded in order (a1, then a2).',
    'Iteration 3: UCB1(a1) = 1/1 + √(ln 2 / 1) ≈ 1.83 and UCB1(a2) = 0/1 + √(ln 2 / 1) ≈ 0.83.',
    'At a1 it is MIN who chooses: use U = N − W. A child where MAX won 0 of 1 is great for MIN.',
    'Backpropagation touches only the nodes on the path of this iteration — including the new node.',
]

EXPLANATION = r"""
| it. | selection | new node | result | root after |
|---|---|---|---|---|
| 1 | — (root has untried moves) | a1 | +1 | 1/1 |
| 2 | — | a2 | −1 | 1/2 |
| 3 | a1: 1.833 vs a2: 0.833 | a1·a1 | −1 | 1/3 |
| 4 | a1: 1/2 + √(ln3/2) = 1.241 vs a2: 1.048 | a1·a2 | +1 | 2/4 |
| 5 | a1: 1.346 vs a2: 1.177; then at a1 (MIN): a1·a1 = (1−0)/1 + √ln3 = 2.048 vs a1·a2 = 0 + 1.048 | a1·a1·a1 | −1 | 2/5 |
| 6 | a1: 2/4 + √(ln5/4) = 1.134 vs a2: 0 + √ln5 = 1.269 → **a2** | a2·a1 | +1 | 3/6 |

Final tree: root 3/6, a1 2/4, a2 1/2, a1·a1 0/2, a1·a2 1/1, a1·a1·a1 0/1, a2·a1 1/1 — the last slide shows
a1 = 2/3, a typo: a1 took part in 4 of the 6 playouts. MCTS returns **a1** (4 playouts).

Why $C = 1$: the slides do not state $C$, but it is the value that reproduces their choices. With $C = \sqrt 2$,
iteration 5 would already explore a2 ($0 + \sqrt 2\sqrt{\ln 4} = 1.665 > 2/3 + \sqrt 2\sqrt{\ln 4/3} = 1.628$).
In iteration 5, the MIN perspective is essential: maximising $W/N$ at a1 would wrongly pick a1·a2.
"""

VIZ = 'mcts'
CONFIG = {'C': 1, 'branching': 2, 'rollouts': [1, -1, -1, 1, -1, 1]}
