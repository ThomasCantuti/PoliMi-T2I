TITLE = 'UCB1 selection on a tree with statistics'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['UCB1', 'UCT', 'MCTS', 'exploration vs exploitation']

STATEMENT = r"""
After 160 playouts, MAX's root has three moves (slide p. 428: *X wins 70 of 100, 30 of 50, 5 of 10*;
a3 has collected one more win since):

```text
                         root 106/160  (MAX)
          a1 /              a2 |                 \ a3
        70/100            30/50                 6/10   (MIN to move)
                                              a1 /   \ a2
                                              3/6     2/3   (MAX to move)
                                                    a1 /  \ a2      a3 untried
                                                    0/1    1/1
```

Nodes drawn without children have not been expanded yet (all their moves are untried).
Run three more iterations (playout results **+1, −1, +1**, from MAX's point of view) and predict every
UCB1 choice and every backpropagation update.

**Conventions:** W/N = MAX's wins / playouts at every node;
$\text{UCB1}(n) = \dfrac{U(n)}{N(n)} + C\sqrt{\dfrac{\ln N(\text{Parent}(n))}{N(n)}}$ with $C = 1.41$ and the
natural log, $U = W$ where MAX chooses and $U = N - W$ where MIN chooses; ties → leftmost; expansion adds the
first untried move ($a_1, a_2, a_3$ in order; every new node has 3 moves); MCTS finally returns the root move
with the most playouts.
"""

HINTS = [
    'At the root: a1 = 0.70 + 1.41·√(ln 160 / 100) ≈ 1.02. Now a2 and a3 — the bonus of a rarely tried move is big.',
    'At a3, MIN chooses: a1 gives MIN (6 − 3)/6 = 0.5, a2 gives (3 − 2)/3 ≈ 0.33 — but a2 has fewer visits.',
    'The node a3·a2 has an untried move, so selection stops there and expands it.',
]

EXPLANATION = r"""
1. root: a1 1.018, a2 1.049, **a3 1.604** → at a3 (MIN, N = 10): a1 = 3/6 + 1.41√(ln10/6) = 1.373,
   **a2** = 1/3 + 1.41√(ln10/3) = 1.569 → a3·a2 has an untried move → expand **a3·a2·a3**; +1 →
   root 107/161, a3 7/11, a3·a2 3/4, a3·a2·a3 1/1.
2. root: **a3** 1.595 → at a3 (N = 11): **a1** = 3/6 + 1.41√(ln11/6) = 1.391 > a2 = 1/4 + 1.41√(ln11/4) = 1.342 →
   expand a3·a1·a1; −1 → root 107/162, a3 7/12, a3·a1 3/7, a3·a1·a1 0/1.
3. root: **a3** 1.501 → at a3 (N = 12): **a1** 1.412 vs a2 1.361 → expand a3·a1·a2; +1 → root 108/163,
   a3 8/13, a3·a1 4/8, a3·a1·a2 1/1.

Even though a1 has by far the best win rate (70 %), UCB1 keeps exploring a3: with only 10–13 visits its
exploration bonus $1.41\sqrt{\ln N / n}$ is about 0.9–1.0, against 0.32 for a1. The final answer is still **a1**:
MCTS returns the move with the **most playouts** (100), not the one selected last.
"""

VIZ = 'mcts'
CONFIG = {'C': 1.41, 'branching': 3, 'rollouts': [1, -1, 1], 'init': {'W': 106, 'N': 160, 'children': [
    {'W': 70, 'N': 100}, {'W': 30, 'N': 50},
    {'W': 6, 'N': 10, 'children': [{'W': 3, 'N': 6},
                                   {'W': 2, 'N': 3, 'actions': 3, 'children': [{'W': 0, 'N': 1}, {'W': 1, 'N': 1}]}]}]}}
