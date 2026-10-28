# Adversarial Search: Minimax & Alpha-Beta

In a game the world fights back: the outcome depends on what an **opponent** chooses, so there is no fixed
sequence of actions that wins. Adversarial search plans *against* the best possible replies: minimax computes
the value of every position under optimal play, alpha-beta gets the same answer while skipping branches that
cannot matter, and evaluation functions and chance nodes make the idea work in real games (slides p. 337–403).

## Intuition

You are MAX. Before moving you imagine: "if I play here, what will MIN answer? and then what do I do?" You
assume MIN is as smart as you, so for each of your moves you only care about MIN's **best** reply — the worst
case for you — and you pick the move whose worst case is best.

> **Intuition:** minimax is a pessimist with perfect foresight. It never hopes for a mistake, so it can never be
> disappointed: against a weaker opponent it gets *at least* its minimax value.

Solving a game = finding the best action for MAX (or MIN) in a state (slides p. 346).

## Games as search problems

The games of the course are **two-player, turn-taking, zero-sum, with perfect information**, deterministic or
stochastic (slides p. 339).

- **Zero-sum:** if one player wins (+1) the other loses (−1); the sum is zero.
- **Perfect information:** the state is fully observable (chess, Go — not poker).

Formulation (slides p. 341–342), as in `aima` `Game`:

| Element | Meaning | `aima` |
|---|---|---|
| Players | MAX and MIN alternate; MAX moves first | `state.to_move` |
| Initial state | initial configuration of the board | `game.initial` |
| Actions(s) | legal moves in s | `game.actions(s)` |
| Result(s, a) | state after move a | `game.result(s, a)` |
| Terminal test | is the game over? | `game.is_terminal(s)` |
| Utility(s, p) | value of terminal s for player p (e.g. +1, 0, −1) | `game.utility(s, p)` |

`play_game(game, strategies)` (slides p. 343) loops: ask `strategies[state.to_move](game, state)` for a move,
apply it, until a terminal state. A *player* is just a function `(game, state) -> move`.

**Convention** (slides p. 349–350): `Utility(s)` is given **relative to MAX** — positive = good for MAX,
negative = good for MIN, 0 = tie. MIN's values are the opposite (multiply by −1): that is what zero-sum means.

The **game tree** alternates MAX levels (MAX to move, ▲) and MIN levels (▼) down to terminal states (slides p. 344).

```fig adv-ttt-tree
The tic-tac-toe game tree grown level by level. Level d has 1, 9, 72, 504, 3 024, 15 120, 54 720, 148 176, 200 448, 127 872 nodes
(move sequences) but only 1, 9, 72, 252, 756, 1 260, 1 520, 1 140, 390, 78 distinct positions. Games first end at level 5 (1 440 X wins).
In total 549 946 nodes, 255 168 complete games (131 184 X wins, 77 904 O wins, 46 080 draws) and 5 478 distinct positions.
```

## Minimax

**Minimax value** of a node (slides p. 351–352): the utility (for MAX) of the terminal state reached if both
players play optimally from there:

$$
\text{MINIMAX}(s) =
\begin{cases}
\text{UTILITY}(s, \text{MAX}) & \text{if } s \text{ is terminal} \\
\max_{a} \text{MINIMAX}(\text{RESULT}(s, a)) & \text{if MAX is to move} \\
\min_{a} \text{MINIMAX}(\text{RESULT}(s, a)) & \text{if MIN is to move}
\end{cases}
$$

MAX builds the tree **depth-first**, evaluates the leaves with the utility, **backs up** the values and picks the
move with the largest value (slides p. 348). The course code (slides p. 354–355):

```python
def minimax_search(game: Game, state: Any) -> tuple[float, Any]:
    """Search game tree to determine best move; return (value, move) pair."""
    player = state.to_move
    def max_value(state: Any) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        v, move = -infinity, None
        for a in game.actions(state):
            v2, _ = min_value(game.result(state, a))
            if v2 > v:
                v, move = v2, a
        return v, move
    def min_value(state: Any) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        v, move = +infinity, None
        for a in game.actions(state):
            v2, _ = max_value(game.result(state, a))
            if v2 < v:
                v, move = v2, a
        return v, move
    return max_value(state)          # the Minimax search plays for MAX
```

### Worked example (Figure 5.2, slides p. 353)

```viz gametree
Figure 5.2 – minimax on a 3 × 3 tree
MAX root over three MIN nodes with leaves (3, 12, 8), (2, 4, 6), (14, 5, 2): MIN values 3, 2, 2; MAX = 3, best move the left one.
```

Each MIN node takes the minimum of its leaves (3, 2, 2); MAX takes the maximum (3).

### Properties

| Property | Minimax |
|---|---|
| Optimal? | yes, against an optimal opponent, when the entire tree is built (slides p. 356) |
| Time | $O(b^h)$ — $b$ legal moves per state, $h$ maximum depth |
| Space | $O(bh)$ — depth-first |
| Feasible? | tic-tac-toe yes (≈ 550 000 nodes); chess $b \approx 35, h \approx 100$ no; Go $b \approx 250$, $h \approx 150$ no |

> **Exam trap:** minimax space is $O(bh)$ (or $O(h)$ generating one child at a time), **not** $O(b^h)$ — it is a
> depth-first search. Only the time is exponential.

```fig adv-cost
Nodes against search depth on a log scale: b^h (minimax), b^(3h/4) (alpha-beta, random order), b^(h/2) (alpha-beta, perfect order),
with the node budget as a horizontal line. With b = 35 and 100 s at 10 000 nodes/s (10^6 nodes): minimax reaches depth 3.89,
alpha-beta 5.18 in random order and 7.77 with perfect ordering (the slides' "about depth 8"). Memory stays b·h.
```

## Alpha-beta pruning

Can MAX choose the optimal action without examining all the nodes? Yes (slides p. 358–359): once MAX has a move
worth 3, a MIN node that has already found a reply worth −1 is worth **at most** −1: the rest of its subtree
"has no effect on the minimax value backed up to the root".

> **Key idea:** alpha-beta prunes branches that **cannot influence the final decision** and returns the **same
> outcome** as vanilla minimax (slides p. 361).

**The two parameters** (slides p. 362):

| | meaning | read as | changes |
|---|---|---|---|
| $\alpha$ | value of the best move found so far **for MAX** along the path | "MAX gets **at least** α" | never decreases |
| $\beta$ | value of the best move found so far **for MIN** along the path | "MIN gets **at most** β" | never increases |

**Pruning rule** (slides p. 367): the search below a MIN node can be interrupted when its value $\le \alpha$; below a
MAX node when its value $\ge \beta$. Sketch (p. 368): update α and β as soon as possible, interrupt when they show
it is not interesting to continue.

AIMA Figure 6.7 (slides p. 369) — the minimax code plus α, β:

```python
def alphabeta_search(game: Game, state: Any) -> tuple[float, Any]:
    player = state.to_move
    def max_value(state: Any, alpha: float, beta: float) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        v, move = -infinity, None
        for a in game.actions(state):
            v2, _ = min_value(game.result(state, a), alpha, beta)
            if v2 > v:
                v, move = v2, a
                alpha = max(alpha, v)
            if v >= beta:
                return v, move          # MIN above will never allow this
        return v, move
    def min_value(state: Any, alpha: float, beta: float) -> tuple[float, Any]:
        if game.is_terminal(state):
            return game.utility(state, player), None
        v, move = +infinity, None
        for a in game.actions(state):
            v2, _ = max_value(game.result(state, a), alpha, beta)
            if v2 < v:
                v, move = v2, a
                beta = min(beta, v)
            if v <= alpha:
                return v, move          # MAX above already has better
        return v, move
    return max_value(state, -infinity, +infinity)
```

### Worked example (Figure 6.5, slides p. 370–375)

Same tree as Figure 5.2, children left to right. The figure labels each node with the interval of its possible
values.

| step | node | leaf read | node interval | effect |
|---|---|---|---|---|
| a | B (MIN) | 3 | $[-\infty, 3]$ | B is worth at most 3 |
| b | B | 12 | $[-\infty, 3]$ | no change |
| c | B | 8 | $[3, 3]$ | B = 3, so A $\in [3, +\infty]$: $\alpha = 3$ |
| d | C (MIN) | 2 | $[-\infty, 2]$ | $2 \le \alpha = 3$: **prune** C's leaves 4 and 6 |
| e | D (MIN) | 14 | $[-\infty, 14]$ | A $\in [3, 14]$ |
| f | D | 5, then 2 | $[2, 2]$ | A $= [3, 3]$: value 3, move to B |

Leaves read: 3, 12, 8, 2, 14, 5, 2 (7 of 9).

```viz gametree
Figure 6.5 – alpha-beta on the same tree
Alpha-beta on the Figure 5.2 tree: C is pruned after its first leaf 2 (2 ≤ α = 3); value 3, move to B.
```

> **Exam trap:** the value returned for a pruned node is only a **bound** (C is "≤ 2", not "= 2"). Write bounds,
> not exact values, for pruned nodes. And prune on **equality** too: $v \le \alpha$ / $v \ge \beta$.

> **Exam trap:** α and β are passed **down** the recursion. A cut can use an α that comes from several levels above
> (a *deep cut-off*): in `[5, [[[1, 9], 7], 8]]` the leaf 9 is pruned thanks to the root's α = 5.

### Move ordering

The efficiency of alpha-beta depends on the order in which nodes are examined (slides p. 377):

| ordering | nodes expanded |
|---|---|
| worst case (nothing pruned) | $O(b^h)$ |
| best case: children of MIN in **increasing** order, of MAX in **decreasing** order | $O(b^{h/2})$ — doubles the solvable depth |
| average (random order) | $O(b^{3h/4})$ |

With perfect ordering and distinct leaves, a uniform tree evaluates exactly $b^{\lceil h/2\rceil} + b^{\lfloor h/2\rfloor} - 1$
leaves (17 of 81 for $b = 3$, $h = 4$).

```fig adv-ordering
Alpha-beta on random uniform trees (b = 2…5, depth up to 8), each tree searched three times: best first, random order, worst first.
Left: which leaves of the last tree are read. Right: average leaves read against the depth on a log scale, next to b^h, b^(3h/4), b^(h/2).
Best first always reads b^⌈h/2⌉ + b^⌊h/2⌋ − 1 leaves (53 of 729 for b = 3, h = 6); random order about 250 (≈ 1.8 × 3^(4.5) = 140);
worst first about 650: the measured counts grow parallel to the three textbook curves.
```

Example (slides p. 378): MAX with children `[10]` and a MIN node with leaves 11, 0. Order 11, 0: nothing is pruned.
Order 0, 11: after 0 the MIN node is $\le 0 \le \alpha = 10$ and 11 is pruned.

Homework tree (slides p. 379), MAX–MIN–MAX: `[[[10, 6], [100, 8]], [[1, 2], [20, 4]]]` (edges a…n). Value 10.
Alpha-beta reads 10, 6, 100 (then 8 is pruned: MAX ≥ 100 ≥ β = 10), 1, 2 (MAX = 2 ≤ α = 10: the subtree l with 20
and 4 is pruned). 5 leaves $= 2^2 + 2^1 - 1$: this order is already optimal.

```viz gametree
Move ordering homework – slide p. 379
Alpha-beta on [[[10, 6], [100, 8]], [[1, 2], [20, 4]]]: reads 10, 6, 100, 1, 2; value 10. Try "Shuffle" and "Best ordering".
```

Perfect ordering cannot be guaranteed in practice (it requires knowing the values!), but as a general principle
**the most promising moves should be expanded first** (slides p. 380): previous best moves from iterative deepening,
captures, threats.

## Depth-limited search and evaluation functions

In realistic games we cannot search to the leaves (slides p. 382–383):

- search only to a limited depth $h$ and replace terminal utilities with an **evaluation function** $e(s)$ for
  non-terminal positions;
- the **guarantee of optimal play is gone**;
- apply **iterative deepening** for an anytime algorithm;
- example: 100 s per move at 10 000 nodes/s = 10⁶ nodes, about depth 8 with alpha-beta.

**Evaluation function** (slides p. 384): given a state $s$ and a player $p$, a real number estimating the expected
utility of $s$ to $p$: $e(s) > 0$ good for MAX, $< 0$ good for MIN, $= 0$ neutral. In practice a **weighted linear sum
of features** (slides p. 388):

$$e(s) = w_1 f_1(s) + w_2 f_2(s) + \dots + w_n f_n(s)$$

The ideal evaluation function returns the actual minimax value.

### Tic-tac-toe example (slides p. 385–386)

$e(s)$ = rows, columns and diagonals still **open** for MAX − those open for MIN ($f_1$, $f_2$ with $w_1 = 1$, $w_2 = -1$).
A line is open for a player if it contains no opponent piece.

```fig adv-ttt-eval
Three positions: empty board e = 8 − 8 = 0; X center, O right edge e = 6 − 4 = 2; X O X / . O . / . . . e = 3 − 3 = 0.
X's first move: center 4, corner 3, edge 2. With h = 2: center 1, corner −1, edge −2, so X plays the center.
```

First move: center $8-4 = 4$, corner $8-5 = 3$, edge $8-6 = 2$. With $h = 2$ (X moves, O replies, then evaluate),
the backed-up values are center $\min(5-4, 6-4) = 1$, corner $-1$, edge $-2$: X plays the center.

> **Exam trap:** at the cutoff, test **terminal first**: a terminal state keeps its real utility, only non-terminal
> states get $e(s)$. And keep the scales consistent: if wins are worth ±1 but $e$ goes up to 8, the search can prefer a
> big estimate to a real win — normalize $e$ into $[-1, +1]$ (slides p. 385).

Evaluation functions are always imperfect; **the deeper in the tree they are buried, the less their quality
matters**; there is a trade-off between complex features and computation (slides p. 389). Beyond the cutoff the
search is blind (the *horizon*).

```fig adv-depth
Depth-limited minimax with the open-lines e(s) on four tic-tac-toe positions; a slider sets the depth limit h and each square shows the
backed-up value of playing there, with its true outcome under perfect play. Empty board, h = 2: center 1, corner −1, edge −2 (slides p. 386).
"A win beyond the horizon" (O on c1, X on c3): b2 for h = 1–3, b1 for h = 4, the winning a1 only from h = 5. "A loss beyond the horizon":
b1 looks best up to h = 3 but loses; h = 4 switches to a drawing move. "e(s) not normalized": with e up to 8 and wins worth 1, h = 1 prefers
c1 (e = 2) to the immediate win a1, and c1 loses; dividing e by 8 fixes it.
```

## Stochastic games: expectiminimax

Dice (backgammon), unpredictable opponents, actions that fail (wheels slip): we add **chance nodes** to the tree
(slides p. 391). MAX's value now represents the **average** case, not the worst case.

Slides p. 392–393: each MIN action happens with probability 0.5:

```viz gametree
Expectimax – slide p. 393
MAX over two chance nodes with outcomes 0.5/0.5: left 0.5·10 + 0.5·10 = 10, right 0.5·9 + 0.5·100 = 54.5; MAX = 54.5, move right.
```

With MIN nodes the answer would be the left branch (10 vs 9). With chance nodes, right (10 vs 54.5).
If there are no MIN nodes the algorithm is **expectimax**.

**Expectiminimax** (slides p. 400):

$$
\text{EXPECTIMINIMAX}(s) =
\begin{cases}
\text{UTILITY}(s, \text{MAX}) & \text{if IS-TERMINAL}(s) \\
\max_a \text{EXPECTIMINIMAX}(\text{RESULT}(s, a)) & \text{if TO-MOVE}(s) = \text{MAX} \\
\min_a \text{EXPECTIMINIMAX}(\text{RESULT}(s, a)) & \text{if TO-MOVE}(s) = \text{MIN} \\
\sum_r P(r)\,\text{EXPECTIMINIMAX}(\text{RESULT}(s, r)) & \text{if TO-MOVE}(s) = \text{CHANCE}
\end{cases}
$$

Backgammon (Figure 5.13): MAX → CHANCE (21 distinct rolls, 1/36 or 1/18) → MIN → CHANCE → MAX …
Time $O(b^m n^m)$ with $n$ outcomes per chance node: chance multiplies the branching.

### Values matter (slides p. 397)

```fig adv-values-matter
MAX over two chance nodes with outcomes 0.9/0.1 (each outcome a MIN node with equal leaves).
Leaves 2, 3 | 1, 4: chance values 2.1 and 1.3, MAX plays a1. Leaves 20, 30 | 1, 400: chance values 21 and 40.9, MAX plays a2.
```

The transformation $1 \to 1, 2 \to 20, 3 \to 30, 4 \to 400$ preserves the order of the leaves, yet the best move flips
from $a_1$ to $a_2$.

> **Key idea:** in **deterministic** games only the **order** of the values matters (max and min commute with any
> increasing transformation), so $e(s)$ only has to rank positions. With **chance** nodes the magnitudes matter:
> $e(s)$ must be a positive **linear** transformation of the expected utility (e.g. a probability of winning).

### Alpha-beta with chance nodes (slides p. 398–399)

MAX root over three chance nodes (each outcome 1/3): `[3, 12, 9]`, `[2, 4, 6]`, `[0, 6, 15]`.

- **Range of Utility() and e() unknown:** nothing can be pruned — an unseen outcome could be arbitrarily large.
- **Range known, $[0, 15]$:** the first node is worth 8 ($\alpha = 8$). In the second, after 2 and 4 the node is at most
  $(2 + 4 + 15)/3 = 7 \le 8$: prune 6. In the third, after 0 and 6: $(0 + 6 + 15)/3 = 7 \le 8$: prune 15.

$$\text{upper bound} = \textstyle\sum_{\text{seen}} P(r)\,v_r + \big(1 - \sum_{\text{seen}} P(r)\big)\cdot \max U$$

```fig adv-chance
The tree of slides p. 398–399 with a slider for the known maximum utility M. With M = 15: the first chance node is worth 8 (α = 8);
in the second, after 2 and 4 the bound is (2 + 4 + 15)/3 = 7 ≤ 8, so 6 is pruned; in the third, after 0 and 6 the bound is 7, so 15 is pruned:
7 of 9 leaves read, value 8. Pruning stops once M > 18. With the range unknown every bound is +∞ and all 9 leaves are read.
```

As depth increases, the probability of reaching a given node shrinks: the usefulness of search is diminished and a
limited depth is less damaging.

## More than two players (slides p. 401)

Values become **tuples** (one component per player); each player maximizes its **own** component. Example with three
players (red, blue, green) and leaves (1,6,6) (7,1,2) (6,1,2) (7,2,1) (5,1,7) (1,5,2) (7,7,1) (5,2,5):

| level | choice |
|---|---|
| green (3rd) | (1,6,6), (6,1,2), (5,1,7), (5,2,5) |
| blue (2nd) | (1,6,6), (5,2,5) |
| red (1st) | **(5,2,5)** |

Players may cooperate or compete; alliances can emerge.

```fig adv-multiplayer
The three-player tree of slide p. 401 backed up step by step. Green picks the larger third component: (1,6,6), (6,1,2), (5,1,7), (5,2,5).
Blue the larger second: (1,6,6) and (5,2,5). Red the larger first: (5,2,5), the value of the game.
```

## Homework (slides p. 402)

*Your opponent runs a depth-2 minimax, uses its result 80% of the time and moves randomly otherwise. What tree
search should you use?* Not minimax (the opponent is not optimal) but an **expectimax**-style search where the
opponent's nodes are chance nodes: the move its depth-2 minimax would choose gets probability $0.8 + 0.2/k$, every other
move $0.2/k$ ($k$ legal moves). With a model of the opponent you maximize expected utility.

## Comparison

| | minimax | alpha-beta | depth-limited α-β | expectiminimax |
|---|---|---|---|---|
| result | exact minimax value | same as minimax | estimate (depends on $e$) | expected value |
| time | $O(b^h)$ | $O(b^{h/2})$ … $O(b^h)$ | bounded by depth | $O(b^m n^m)$ |
| needs | utility | utility + good ordering | $e(s)$ | probabilities, values on a meaningful scale |
| optimal? | yes (full tree) | yes (full tree) | no | yes in expectation (full tree) |

```fig adv-race
The four algorithms of the table choose X's first move in tic-tac-toe, advancing the same number of nodes per frame. Minimax: 549 946 nodes,
value 0, a1 (all nine first moves draw). Alpha-beta: same value and move after 18 297 nodes (30× fewer). Depth-limited alpha-beta with
h = 2 and e(s): 36 nodes, b2 with the estimate 1. Expectiminimax with O as a random player: 549 946 nodes, value 0.9948, best move a1 (a corner).
```

## How it connects

- **Search (uninformed/informed):** minimax is a depth-first search where the "goal" is replaced by backed-up values;
  iterative deepening returns as the anytime version of depth-limited search, and move ordering plays the role a
  heuristic plays in A*.
- **MCTS (next topic):** when $b$ is huge and no good $e(s)$ exists (Go), replace the evaluation function with
  random playouts and the uniform tree with **selective** search. Alpha-beta treats all branches as equally important;
  MCTS does not (slides p. 405).
- The four ways to build a player (slides p. 457–472): hand-written rules, minimax/alpha-beta (+ $e(s)$), MCTS,
  learned evaluation (AlphaZero).
