# Monte Carlo Tree Search & Bandits

Alpha-beta needs a good evaluation function and treats every branch as equally important; in Go it has neither luxury.
Monte Carlo Tree Search evaluates positions by **playing random games** (rollouts) and spends its simulations
**selectively** on the promising branches, choosing where to look next with the same rule that solves the
**multi-armed bandit** problem: UCB (slides p. 404–478).

## Intuition

Two questions drive everything:

1. *How good is this position, if I know nothing about the game?* — Play it out many times at random and count the
   wins. Noisy, but averages of noise converge.
2. *Which branch deserves the next simulation?* — The one that looks best (**exploit**), unless another one has been
   tried so little that it might be even better (**explore**).

> **Intuition:** MCTS is a gambler in a casino of slot machines, one machine per move, recursively: every node of the
> tree is a bandit problem, and the answer at the root improves with every coin spent.

## Why not alpha-beta everywhere? (slides p. 405–407)

- Alpha-beta reduces the visited states, and we can stop at a given depth — but then we need an **evaluation function**
  and must know the problem well.
- For minimax and alpha-beta **all branches are equally important**.
- Go: branching factor ≈ 250 (vs ≈ 20–35 in chess), more than 200 moves per game, no good evaluation function
  (similar positions can have completely different outcomes). Alpha-beta reached only a weak-to-intermediate level.
- Are all branches equally promising? In chess, capturing a queen or a pawn changes the odds very differently.

MCTS combines **evaluation by rollouts** and **selective search** (slides p. 408).

## Evaluation by rollouts (slides p. 409)

Run 10 000 random playouts after each first move of X in tic-tac-toe:

| first move | X wins | O wins | ties |
|---|---|---|---|
| center | 69.2% | 19.1% | 11.7% |
| corner | 60.9% | 26.2% | 12.9% |
| edge | 53.8% | 33.5% | 12.6% |

The ranking matches the open-lines evaluation function (center 4 > corner 3 > edge 2) — with no knowledge of the
game. But the statistics are **uncertain**, and in a tree they are computed on samples of **different sizes**:
"70 of 100" is less reliable than "692 of 1000", while "5 of 10" is almost no information (slides p. 427–428).

MCTS develops a **sparse, asymmetric** game tree while evaluating states with random simulations; simulations are run
incrementally, one after the other, while deeper nodes are added (slides p. 410). The more complex the game, the more
simulations we need — and the more expensive each one becomes (p. 411).

## The four phases (slides p. 413–414)

| phase | what happens | policy |
|---|---|---|
| **Selection** | descend from the root choosing successors until a node with an **unexpanded** move or a leaf | tree policy (UCB1) |
| **Expansion** | if the node is not terminal, add one (or more) children | |
| **Simulation** | play out from the new node to the end of the game; the outcome gives a **reward** | default / playout policy (typically random) |
| **Backpropagation** | use the reward to update **all** the nodes visited in this iteration | |

AIMA Figure 6.11:

```text
function MONTE-CARLO-TREE-SEARCH(state) returns an action
    tree <- NODE(state)
    while IS-TIME-REMAINING() do
        leaf   <- SELECT(tree)
        child  <- EXPAND(leaf)
        result <- SIMULATE(child)
        BACK-PROPAGATE(result, child)
    return the move in ACTIONS(state) whose node has highest number of playouts
```

**When does MCTS stop?** It is an **anytime** method: whenever it stops it can provide an answer — typically after a
time limit or a given number of rollouts (slides p. 415).

> **Exam trap:** the final move is the child with the most **playouts** $N$, not the largest UCB1 (that includes an
> exploration bonus) and not the raw win rate (1/1 = 100% is meaningless).

## Node statistics (slides p. 419)

Each node $n$ stores a pair: **wins** $U(n)$ and **number of simulations** $N(n)$ that involved $n$. Two conventions:

1. wins **for the player at the root** in every node (used in the slides' step-by-step example);
2. wins **for the player at the node** — more precisely, as in AIMA Figure 6.10, for the player who made the move
   *into* the node, i.e. the player choosing it at the parent.

With convention 2 every player simply picks the child with the largest UCB1. With convention 1, at the opponent's
levels you must maximize the opponent's win rate $(N(n) - U(n))/N(n)$ instead. A draw counts ½.

## Step-by-step example (slides p. 417–452)

Convention 1 (wins of MAX, the player at the root). Notation U/N.

| step | what happens | tree after the step |
|---|---|---|
| 1 | tree = root only; expand a child, playout → **+1** (MAX wins) | root 1/1, child $a_1$ 1/1 |
| 2 | the playout's states are forgotten; new child $a_2$, playout → **−1** | root 1/2, $a_1$ 1/1, $a_2$ 0/1 |
| 5–6 | select $a_1$, add a child $b_1$, playout → −1 | root 1/3, $a_1$ 1/2, $b_1$ 0/1 |
| 7–8 | select $a_1$, add $b_2$, playout → +1 | root 2/4, $a_1$ 2/3 ($b_1$ 0/1, $b_2$ 1/1), $a_2$ 0/1 |
| 9–10 | UCB1 at the root, then at $a_1$ (MIN to move) → $b_1$; add a child $c_1$, playout → −1 | root 2/5, $a_1$ 2/4, $b_1$ 0/2, $c_1$ 0/1 |
| 11 | UCB1 at the root → $a_2$; add a child, playout → +1 | root 3/6, $a_1$ 2/4, $a_2$ 1/2 (child 1/1) |

```viz mcts
Step-by-step example – slides p. 417-452
The six iterations of the slides with C = 1 and playout results +1, −1, −1, +1, −1, +1: final tree root 3/6, a1 2/4, a2 1/2.
```

The UCB1 numbers with $C = 1$ (the value consistent with the slides):

- step 9, root (N = 4): $a_1$: $\frac23 + \sqrt{\frac{\ln 4}{3}} = 0.667 + 0.680 = 1.346$; $a_2$: $0 + \sqrt{\ln 4} = 1.177$ → $a_1$.
- at $a_1$ MIN chooses: $b_1$ (0/1 for MAX = 1/1 for MIN) beats $b_2$ (1/1 for MAX = 0/1 for MIN) → $b_1$.
- step 11, root (N = 5): $a_1$: $\frac24 + \sqrt{\frac{\ln 5}{4}} = 0.5 + 0.634 = 1.134$; $a_2$: $\sqrt{\ln 5} = 1.269$ → $a_2$.

> **Exam trap:** slides p. 450–452 redraw the tree of step 11 with the old numbers (root 2/4, $a_1$ 2/3). After step 10
> the root is 2/5 and $a_1$ 2/4 — and only with these numbers does UCB1 pick $a_2$. The final tree is root 3/6,
> $a_1$ 2/4, $a_2$ 1/2 (the slide's "2/3" for $a_1$ is a typo: its children add up to 4 visits).

> **Exam trap:** with $C = \sqrt 2$ the choice at step 9 is already $a_2$ ($0.667 + 1.414 \cdot 0.680 = 1.629 < 1.414 \cdot 1.177 = 1.665$).
> Always check which $C$ the exercise uses, and use the **natural** log.

## Multi-armed bandits (slides p. 430–442)

**The k-armed bandit** (p. 431): an agent repeatedly chooses one of $k$ actions and receives a reward depending on the
action; it must maximize $\sum_{t=1}^{T} R_t$. Applications: a doctor choosing treatments in a randomized study (p. 432),
Netflix choosing the artwork to show (p. 433) — and MCTS choosing the child to simulate.

**Action value** (p. 434): $Q^*(a) = \mathbb{E}[R_t \mid A_t = a]$, estimated by the **sample average**

$$Q_t(a) = \frac{\sum_{i=1}^{t-1} R_i}{t-1}
\qquad\text{incrementally:}\qquad Q_{t+1} = Q_t + \frac1t (R_t - Q_t)
\qquad\text{or}\qquad Q_{t+1} = Q_t + \alpha (R_t - Q_t),\ \alpha \in [0,1]$$

(new estimate = old estimate + step × error). The $1/t$ step gives the exact mean in $O(1)$ memory; a constant $\alpha$
weights recent rewards more and tracks rewards that change over time.

**Which action?** (p. 435) Greedy (the best estimate)? Random? Or mix: **ε-greedy** — a random action with probability
ε, the best one otherwise.

> **Key idea:** the **exploration–exploitation dilemma** (p. 436). Exploration improves knowledge for long-term benefit;
> exploitation exploits knowledge for short-term benefit. Pure greedy can lock onto a bad arm forever (an arm never
> tried is never corrected); ε-greedy explores **blindly**, wasting pulls on arms that have clearly lost.

### Optimism in the face of uncertainty (p. 437–439)

Each estimate $Q_t(a)$ has a **confidence interval** around it; the true $Q^*(a)$ is probably inside. Choose the action
with the **highest upper bound**: either it is truly good, or it is uncertain — and trying it shrinks the interval.

**UCB action selection** (p. 440–441):

$$a_t = \arg\max_a \left[\, \underbrace{Q_t(a)}_{\text{current estimate}} + \underbrace{c\sqrt{\frac{\ln t}{N_t(a)}}}_{\text{upper confidence bound / exploration term}} \,\right]$$

$c$ = amount of exploration (user defined), $N_t(a)$ = number of times $a$ was taken. An untried action
($N_t(a) = 0$) is maximizing: try every arm once first.

How the bonus shrinks with experience (p. 442), $t = 10\,000$:

| $N_t(a)$ | 10 | 100 | 1000 | 5000 |
|---|---|---|---|---|
| $c\sqrt{\ln t / N_t(a)}$ | $0.960c$ | $0.303c$ | $0.096c$ | $0.043c$ |

Meanwhile the bonus of an arm that is not pulled grows slowly with $\ln t$: neglected arms are re-tried, more and more
rarely. Averaged over random 5-armed Bernoulli bandits (1000 steps), UCB ($c = 0.5$) earns ≈ 98% of the best possible
reward, ε-greedy (0.1) ≈ 94%, greedy ≈ 59%.

```viz bandit
UCB vs ε-greedy – 5 arms, close means
Five Bernoulli arms with means 0.3, 0.5, 0.6, 0.45, 0.65: compare the pulls and the regret of UCB (c = 1) and ε-greedy (ε = 0.1).
```

## UCB1 for trees: UCT (slides p. 443–445)

$$\text{UCB1}(n) = \frac{U(n)}{N(n)} + C \cdot \sqrt{\frac{\log N(\text{Parent}(n))}{N(n)}}$$

| symbol | meaning |
|---|---|
| $U(n)$ | utility of node $n$ (number of wins) |
| $N(n)$ | number of simulations involving $n$ |
| $N(\text{Parent}(n))$ | number of simulations involving the parent of $n$ |
| $C$ | exploration parameter: $C = 0$ pure exploitation, $C \to \infty$ pure exploration |

The first term is **exploitation**, the second **exploration**. The node with the **largest** UCB1 is selected; a
node with $N(n) = 0$ has UCB1 $= \infty$. In theory $C = \sqrt2$ for rewards in $[0, 1]$; in practice it is tuned.

### AIMA Figure 6.10 (slides p. 425)

Convention 2 (wins of the player who moved into the node). One iteration, $C = \sqrt 2$:

```fig mcts-fig610
(a) selection from 37/100: UCB1 1.101, 1.060, 1.097 → 60/79; then 0.695, 0.708 → 16/53; then 1.248, 1.220 → 27/35 (leaf).
(b) expansion: new child 0/0 of 27/35; playout: black wins.
(c) backpropagation: 0/1 → 28/36 → 16/54 → 61/80 → 37/101.
```

Black (the player to move at the root) won: $U + 1$ only on the nodes reached by a black move (60/79 and 27/35);
every node on the path gets $N + 1$.

> **Exam trap:** a classic bug adds the win to every node on the path. Then the opponent "chooses" the moves that are
> best for you, the tree assumes a cooperative opponent, and MCTS stops seeing threats.

## MCTS vs minimax / alpha-beta

| | minimax / alpha-beta | MCTS |
|---|---|---|
| evaluation of non-terminal states | utility at the leaves, or $e(s)$ at a depth limit | random playouts (no $e(s)$ needed) |
| tree shape | uniform up to a depth | sparse, asymmetric: more simulations where it matters |
| anytime | with iterative deepening | naturally |
| guarantee | optimal on the full tree | converges with more simulations; few simulations can blunder |
| weak spot | huge $b$, no good $e(s)$ | expensive simulations; playouts may not be informative (traps) |

> **Key idea:** MCTS does not need an explicit evaluation function: random playouts are enough to explore the search
> space, so it can be used when an evaluation function, or a substantial corpus of knowledge, is unavailable (slides p. 453).

**Quiz time (slides p. 455)**, tic-tac-toe: minimax vs random → minimax never loses; two minimax players → always a
draw (and the same game every time); minimax vs alpha-beta → always draws (same values, same moves); two minimax players
at Breakthrough → the game is too big to search fully, so they need a depth limit and $e(s)$; alpha-beta vs MCTS →
alpha-beta never loses, a well-tuned MCTS with enough playouts draws.

## Four ways to build a player (slides p. 457–472)

| option | idea | pros | cons |
|---|---|---|---|
| #1 knowledge | hand-coded rules: win if you can, block, center, corners near your pieces, then sides | fast, simple | must be proficient; no general strategy; cannot be sure all situations are covered; start from scratch for a new game (Connect 4 vs Gomoku) |
| #2 lookahead | simulate what happens ahead: minimax / alpha-beta with the utility (or $e(s)$) | general, optimal, needs only rules | explores all matches: exponential; $e(s)$ needs domain knowledge |
| #3 rollouts | MCTS: evaluate states by incrementally simulating matches | no $e(s)$ | simulations are expensive and may not provide enough information |
| #4 learning | learn from simulations how to evaluate states | once learned, no random rollouts needed | training cost |

## AlphaZero (slides p. 473–477)

- Learns **from scratch by self-play**, with only the board as input.
- One deep neural network $f_\theta$ with input the raw board $s$ (and its history) and output
  $f_\theta(s) = (\mathbf{p}, v)$: $\mathbf{p}$ the move probabilities $p_a = \Pr(a \mid s)$, $v$ the estimated probability that
  the current player wins from $s$.
- In each position $s_t$ of a self-play game an **MCTS guided by $f_\theta$** is run; it outputs search probabilities
  $\pi_t$ and moves are sampled as $a_t \sim \pi_t$. These probabilities select much stronger moves than the raw $\mathbf{p}$:
  **MCTS is a policy improvement operator**.
- The network is trained by reinforcement learning to match $\pi$ and the game outcome: lookahead search inside the
  training loop. Random rollouts are replaced by the value $v$; selection is guided by $\mathbf{p}$.

## How it connects

- **Adversarial search:** MCTS approximates the minimax tree by sampling; with the "wins of the player who moved into
  the node" convention, UCB1 selection is the statistical analogue of max/min backing up.
- **Bandits → reinforcement learning:** sample averages, incremental updates, ε-greedy and UCB reappear wherever an agent
  must learn by acting.
- **Local search:** like random restarts, rollouts trade knowledge for many cheap samples; unlike them, MCTS **reuses**
  every sample through the statistics stored in the tree.
