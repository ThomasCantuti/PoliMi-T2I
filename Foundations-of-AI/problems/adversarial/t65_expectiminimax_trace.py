TITLE = 'Expectiminimax: values matter (slide p. 397)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['expectiminimax', 'chance nodes', 'stochastic games', 'hand simulation']

STATEMENT = r"""
A stochastic game (left tree of slide p. 397, Figure 5.14 of the textbook): MAX chooses $a_1$ or $a_2$,
then a **chance** event happens (probabilities on the edges), then MIN moves.

```text
                        A (MAX)
              a1 /                 \ a2
          B (chance)               C (chance)
         .9 /    \ .1             .9 /    \ .1
      D (MIN)   E (MIN)       F (MIN)   G (MIN)
       /  \      /  \          /  \      /  \
      2    2    3    3        1    1    4    4
```

Predict the value returned by every node.

**Conventions** (EXPECTIMINIMAX, slide p. 400): MAX takes the maximum, MIN the minimum, a chance node
the **expected value** $\sum_r P(r)\,\text{value}(r)$; children left to right. Type decimals like `2.1`.
"""

HINTS = [
    'D, E, F, G are MIN nodes over two equal leaves: their values are just those leaves.',
    'B = 0.9 · D + 0.1 · E.',
    'Compare B and C at the root: which move does MAX choose?',
]

EXPLANATION = r"""
$D = 2$, $E = 3$, $F = 1$, $G = 4$; $B = 0.9 \cdot 2 + 0.1 \cdot 3 = 2.1$, $C = 0.9 \cdot 1 + 0.1 \cdot 4 = 1.3$;
$A = \max(2.1, 1.3) = 2.1$: MAX plays $a_1$.

**Values matter.** Apply the order-preserving transformation $1 \to 1, 2 \to 20, 3 \to 30, 4 \to 400$ (right
tree of the slide): now $B = 0.9 \cdot 20 + 0.1 \cdot 30 = 21$ and $C = 0.9 \cdot 1 + 0.1 \cdot 400 = 40.9$,
so the best move becomes $a_2$. With chance nodes the evaluation function must be a positive *linear*
transformation of the expected utility; in deterministic minimax only the *order* of the values matters.
Try it: in the Playground, click the leaves to edit them.
"""

VIZ = 'gametree'
CONFIG = {'algorithm': 'expectiminimax', 'tree': {'type': 'max', 'children': [
    {'type': 'chance', 'children': [{'p': 0.9, 'node': [2, 2]}, {'p': 0.1, 'node': [3, 3]}]},
    {'type': 'chance', 'children': [{'p': 0.9, 'node': [1, 1]}, {'p': 0.1, 'node': [4, 4]}]}]}}
