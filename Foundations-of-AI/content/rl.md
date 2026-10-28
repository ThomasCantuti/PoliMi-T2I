# Learning to Search and Play

Every agent seen so far was given its knowledge: the problem's actions and goal, a heuristic, the rules of the game
and maybe an evaluation function. A **learning agent** improves with experience instead. In **reinforcement learning**
(RL) nobody tells it which action is right: it acts, receives a numeric **reward**, and learns which actions pay off
in the long run (slides of the deck *Learning to Search and Play*, p. 1–80, cited below as "RL p.").

## Intuition

Two questions drive everything:

1. *How much future reward will I get if I do $a_t$ in $s_t$ and then keep doing my best?* That number is the
   **action value** $Q(s_t, a_t)$ (RL p. 18–19). With the right $Q$ table, acting well is easy: pick the action with
   the largest $Q$.
2. *How do I fill the table without a model of the world?* Act, look at the reward and at the value of the state you
   landed in, and nudge the old estimate toward that new estimate (**Q-learning**, RL p. 36–37).

> **Intuition:** A* finds **one** path for **one** start state, using a model of the world (actions, results,
> costs). Q-learning finds, by trial and error and without the model, **how good every action is in every state**: a
> whole map of arrows towards the goal (RL p. 46–47). Search plans; RL learns from experience.

## Learning agents (RL p. 2–4)

All the architectures seen so far (simple reflex, model-based, goal-based, utility-based) can be improved with
learning, which also lets the agent work in initially unknown environments.

| component | role |
|---|---|
| **performance element** | selects the external actions from the percepts: it *is* the whole agent we considered before |
| **learning element** | makes the improvements, i.e. changes the performance element |
| **critic** | gives feedback on how the agent is doing with respect to a fixed **performance standard** |
| **problem generator** | suggests exploratory actions that lead to new, informative experiences |

```fig rl-learner
Simulation of the learning-agent diagram of RL p. 3 on the exams' 3×3 grid (wall (2,2), G (3,3), reward 1 into G, gamma 0.5, beta 0.25, Q = 0). Each step lights up, in order: the sensors give the state; the performance element picks the greedy move (largest Q), unless the problem generator, with probability epsilon (default 0.2), proposes a random exploratory move; the effectors act and the environment moves the agent; the critic compares the new state with the performance standard (reach G) and gives the reward r; the learning element applies the Q-learning update, shown with its numbers, which changes the performance element. The grid shows the greedy arrows learned so far and a bar chart the steps of the last 30 episodes against the shortest path of 4.
```

> **Exam trap:** "What is the relation between the four architectures and the learning agent?" (exam 11 Jun 2026).
> The learning agent is not a fifth alternative: it adds learning **around** any of them, because its performance
> element can be implemented with any of the four architectures.

## Machine learning in brief (RL p. 6–8)

"A computer program is said to learn from experience E with respect to some class of tasks T and performance measure P
if its performance at tasks in T, as measured by P, improves with experience E" (Mitchell, 1997). Traditional
programming turns data + program into output; machine learning turns data + output into a program.

| | supervised | unsupervised | reinforcement |
|---|---|---|---|
| given | inputs $x_i$ with desired outputs $y_i$ | inputs only | actions $a_1, \dots$ that affect the environment, rewards $r_1, \dots$ |
| feedback | direct (the label) | none | a reward, often delayed |
| goal | predict the output of unseen data | find hidden structure | learn a **sequence of actions** that maximizes the **long-term** reward |

```fig rl-ml
Simulation: an agent walks at random from S to G on the exams' 3×3 grid (wall (2,2), G (3,3), shortest path 4 moves). Under each move a timeline shows the feedback each kind of learner would get: supervised, the right move (a check mark for a shortest-path move, otherwise the correct arrows); unsupervised, nothing; reinforcement, the reward, 0 after every move and 1 only for the move into G. At the end the caption counts the labels and the zeros: supervised feedback is direct, reinforcement feedback is delayed and has to be credited to the earlier moves.
```

## The reinforcement-learning loop (RL p. 13–17)

At time $t$ the agent perceives state $s_t$ and performs action $a_t$; at time $t+1$ the environment moves to $s_{t+1}$
and the agent receives the reward $r_{t+1}$.

```fig rl-loop
The agent performs action a_t on the environment; the environment answers with the next state s_t+1 and the reward r_t+1; then t becomes t + 1.
```

**Sequential decision making** (RL p. 14): we take a sequence of decisions to reach the goal; the optimal actions are
context-dependent; we generally have no examples of correct actions; actions may have long-term consequences; and the
short-term consequences of optimal actions might seem negative.

## Expected payoff (RL p. 18–20, 30)

The agent maximizes the total reward received **in the long run**. Summed naively it can be infinite, so future rewards
are **discounted** by a factor $\gamma$, $0 < \gamma < 1$:

$$G_t = r_{t+1} + \gamma r_{t+2} + \gamma^2 r_{t+3} + \dots = \sum_{k=0}^{\infty} \gamma^k r_{t+k+1},
\qquad \mathbb{E}[G_t] \le R_{max} \frac{1}{1-\gamma}$$

A reward received $k$ steps later is worth $\gamma^k$ of the same reward now: $\gamma$ close to 0 makes the agent short-
sighted, close to 1 far-sighted. In an **episodic** task (navigation: the episode ends at the goal; a game: it ends at
the final position) the sum stops at the end of the episode.

```fig rl-discount
Bar chart of gamma^k for k = 0..39 with a gamma slider (default 0.95): the weight of a reward k steps away halves every ln 0.5 / ln gamma steps (13.5 steps for 0.95, 1 step for 0.5). Next to it, the running sum of a reward of 1 at every step, approaching the bound 1/(1 − gamma) (20 for 0.95, 2 for 0.5).
```

> **Exam trap:** "Write the formula to compute the value of a state at time $t$" (exam 6 Feb 2026). The answer is
> $V(s_t) = \mathbb{E}[G_t] = \mathbb{E}\left[\sum_{k=0}^{\infty} \gamma^k r_{t+k+1}\right]$, the **expected
> discounted sum of future payoffs**. The first reward is $r_{t+1}$, discounted by $\gamma^0 = 1$.

## Rewards (RL p. 21, 31–32)

**Reward hypothesis** (Sutton): "all of what we mean by goals and purposes can be well thought of as maximization of the
expected value of the cumulative sum of a received scalar signal (reward)". We must design a reward function that
represents our learning goal:

- **goal-reward**: 1 when the goal is reached, 0 otherwise (the 10×10 navigation example, RL p. 44);
- **action-penalty**: −1 at every step that does not reach the goal, 0 once it is reached (mountain car, RL p. 21).

Both make the shortest path optimal: with goal-reward because the single reward is discounted less the sooner it
arrives, with action-penalty because every extra step costs −1. Open challenges: representing risk-sensitive behaviour
and capturing diversity in behaviour.

```fig rl-returns
Interactive: two plots of the discounted return of a path that reaches G in d moves (d = 1 to 12), under goal-reward (gamma^(d−1)) and under action-penalty (−(1 − gamma^(d−1))/(1 − gamma)), with a gamma slider. With gamma 0.5 the exam grid's shortest path of 4 moves is worth 0.125 and −1.75, a 6-move detour 0.031 and −1.94: both returns fall with every extra move, so both reward functions make the shortest path optimal. With gamma = 1 goal-reward is flat (every path to G is worth 1) while action-penalty still gives −(d − 1).
```

In a game: +1 if the agent wins, −1 if it loses, 0 otherwise, received only at the end of the match (tic-tac-toe,
RL p. 57–58). A score difference can also be used as a reward, so that winning by more is rewarded more (exam 20 Jun 2024).

## Value functions and the Bellman equation (RL p. 19, 33–35)

- **Action-value function** $Q(s_t, a_t)$: expected future payoff when performing $a_t$ in $s_t$ (and then continuing).
- **State-value function** $V(s_t)$: expected future payoff starting from $s_t$.

Both decompose into the **immediate reward** plus the **discounted value of the successor state** (Bellman expectation
equation):

$$V(s) = \mathbb{E}[r_{t+1} + \gamma V(s_{t+1}) \mid s_t = s] \qquad
Q(s, a) = \mathbb{E}[r_{t+1} + \gamma V(s_{t+1}) \mid s_t = s, a_t = a]$$

When the best action is always selected, $V(s) = \max_a Q(s, a)$. In a **deterministic** environment the expectation
disappears: $Q(s, a) = r(s, a) + \gamma V(\text{result}(s, a))$, with $V(\text{goal}) = 0$ because nothing follows the end
of the episode.

```fig rl-backup
Interactive on the exams' 3×3 grid (wall (2,2), G (3,3)): converged values V for goal-reward or action-penalty, with sliders for gamma (default 0.5) and for p, the probability that a move succeeds (default 1, deterministic as in the exams; otherwise the agent slips to the sides). Clicking a cell shows its backup: each allowed action's Q(s, a) = r + gamma·V(next cell), or with p < 1 the probability-weighted sum over the possible next cells, and V(s) as the largest of them. With gamma 0.5 and goal-reward: V(2,3) = V(3,2) = 1, V(1,3) = V(3,1) = 0.5, V(1,2) = V(2,1) = 0.25, V(1,1) = 0.125; with action-penalty 0, −1, −1.5, −1.75 at the same distances. The best-action arrows are the same under both reward functions.
```

## Computing the converged values by hand

This is the most frequent RL exercise (exams 30 Aug 2022, 11 Jun 2026, 8 Jul 2026). Start from the goal and move
backwards, one ring of cells at a time; each cell takes the best of its available actions.

Exam of 11 June 2026: the agent moves up/down/left/right, $\gamma = 0.5$, reward 0 entering the goal and −1 otherwise.

```fig rl-bellman
Grid with two rows: (1,1) (1,2) (1,3) on top; (2,1), a wall and G below. Values computed backward from G:
(1,3): down into G → 0 + 0.5·0 = 0
(1,2): right to (1,3) → -1 + 0.5·0 = -1
(1,1): right to (1,2) → -1 + 0.5·(-1) = -1.5
(2,1): up to (1,1) → -1 + 0.5·(-1.5) = -1.75
```

With goal-reward (1 at the goal, 0 otherwise) the same reasoning gives $V = \gamma^{d-1}$ for a cell at distance $d$ from
the goal: 1, 0.5, 0.25, … (exam 30 Aug 2022, $\gamma = 0.5$).

> **Exam trap:** the learning rate $\beta$ (0.2 in the 2026 exams) **does not appear** in the converged values. It only
> sets how fast the estimates move; the limit is fixed by the rewards and $\gamma$.

> **Exam trap:** $V(\text{goal})$ is 0 even with goal-reward: the reward of 1 belongs to the **transition into** the
> goal ($r_{t+1}$ of the last action), and the episode ends there. In the 2026 grids the goal cell is left empty.

## Policies and exploration (RL p. 22–26)

A **policy** $\pi$ chooses the action in each state from the current payoff estimates.

- **Deterministic**: $\pi: S \to A$, e.g. the action with the largest $Q$; it fits in a table.
- **Stochastic**: $\pi(s, a)$ is the probability of choosing $a$ in $s$ (non-negative, summing to 1 over the actions); it
  can also represent a deterministic policy.

**Exploration–exploitation dilemma:** to get a lot of reward the agent must prefer actions it has tried and found
rewarding; to discover them it must try actions it has never selected.

- **Greedy policy**: in each state, deterministically pick an action with maximal value.
- **ε-greedy policy**: with probability ε a random action, with probability 1 − ε the action promising the highest
  payoff.

```fig rl-egreedy
Simulation: one state, cell (1,10) of the 10×10 grid, with its converged Q row for gamma 0.95 (up 0.630, right 0.630, down 0.663, left 0.599). The agent picks actions again and again; a live histogram splits each bar into picks of the greedy branch and picks of the random draw, next to the exact probabilities. With epsilon = 0.1 the greedy action down gets 1 − 0.1 + 0.1/4 = 0.925 and every other action 0.025; epsilon 0 always picks down (greedy); epsilon 1 gives 0.25 each (random). An epsilon slider and presets change the policy.
```

## The environment: Markov decision processes (RL p. 27–28)

The environment must satisfy the **Markov property**: $s_{t+1}$ and $r_{t+1}$ depend only on $s_t$ and $a_t$, not on the
earlier history. It is then a **Markov Decision Process** (MDP) with one-step dynamics
$p(s_{t+1}, r_{t+1} \mid s_t, a_t)$, a probability distribution: $\sum_{s'} \sum_{r} p(s', r \mid s, a) = 1$ for every
$s$ and every $a \in A(s)$.

```fig rl-mdp
Simulation on the exams' 3×3 grid (wall at (2,2), G at (3,3), reward 1 into G) made slippery: the intended move succeeds with probability p (default 0.8), otherwise the agent slips to one side with (1 − p)/2 each, staying put if that side is a wall or the edge. For s = (1,1) and a = right: (1,2) with 0.8, (1,1) with 0.1 (slip up into the edge), (2,1) with 0.1; the probabilities sum to 1. A random walk samples the grid live; the observed frequencies converge to these values, and they are the same whether the agent arrived at (1,1) from (1,2), from (2,1), by staying, or at the start of an episode: the Markov property. p = 1 gives the deterministic grids of the exams.
```

## Q-learning (RL p. 36–37)

The table $Q(\cdot, \cdot)$ is initialized (randomly in the slides, **with zeros in every exam**). At every step $t$:

$$Q(s_t, a_t) \leftarrow \underbrace{Q(s_t, a_t)}_{\text{previous value}} + \beta\Big(
\underbrace{r_{t+1}}_{\text{incoming reward}} + \underbrace{\gamma \max_{a \in A} Q(s_{t+1}, a)}_{\text{value of the next state}}
- Q(s_t, a_t)\Big)$$

The term $r_{t+1} + \gamma \max_a Q(s_{t+1}, a)$ is the **new estimate**; $\beta$ moves the old value a fraction of the
way toward it. Parameters: discount factor $\gamma$, learning rate $\beta$, and the action-selection strategy during
learning (ε-greedy is the most common), which must guarantee **sufficient exploration**.

```fig rl-beta
Interactive: one entry of the exam grid, Q((2,3), S), the move into G with reward 1 (exam 30 Aug 2022), updated once per episode with Q ← Q + beta·(1 − Q). A number line shows, for the chosen episode, the old value, the new estimate 1 and the updated value, which closes the fraction beta of the gap; a plot shows Q after each of 25 episodes, 1 − (1 − beta)^k. With beta = 0.25: 0.25, 0.4375, 0.578, …, within 1% of the limit after 17 episodes; with 0.2 after 21; with 0.9 after 3; beta = 1 jumps to 1 at once. Every beta heads to the same limit 1: beta sets the speed, not the converged value.
```

```python
def q_learning(env, episodes, beta, gamma, epsilon):
    Q = defaultdict(float)                       # the exams initialize every entry to 0
    for _ in range(episodes):
        s = env.start
        while not env.is_terminal(s):
            a = epsilon_greedy(Q, s, env.actions(s), epsilon)
            s2 = env.result(s, a)
            r = env.reward(s, a, s2)
            future = 0 if env.is_terminal(s2) else max(Q[s2, b] for b in env.actions(s2))
            Q[s, a] += beta * (r + gamma * future - Q[s, a])
            s = s2
    return Q
```

**Worked example** (exam 30 Aug 2022): the 3×3 grid below, $\gamma = 0.5$, $\beta = 0.25$, reward 1 entering the goal and
0 otherwise, $Q = 0$. Each episode is east, east, south, south from S.

```fig rl-qlearning
3×3 grid: S = (1,1), a wall at (2,2), G = (3,3); every episode goes east, east, south, south.
Episode 1: only the last step changes something: Q((2,3), S) = 0 + 0.25·(1 − 0) = 0.25.
Episode 2: Q((1,3), S) = 0 + 0.25·(0 + 0.5·0.25 − 0) = 0.03125; Q((2,3), S) = 0.25 + 0.25·(1 − 0.25) = 0.4375.
```

The reward travels backwards **one step per episode**: Q-learning needs many episodes to propagate it to the start.

> **Exam trap:** when $s_{t+1}$ is the goal the episode ends: **no discounted term** (the official solution of
> 30 Aug 2022 says so explicitly). Only the reward is used.

> **Exam trap:** with the action-penalty reward and $Q = 0$ (exam 18 Jan 2023) the first episode changes **every**
> step taken before the goal: each gets $0 + 0.25\cdot(-1 + 0.5 \cdot 0 - 0) = -0.25$; the last one, into the goal,
> stays 0. The reward function changes which entries move first.

```fig rl-rewards
Interactive, two Q-tables side by side on the 3×3 grid of the exams (wall (2,2), G (3,3), gamma 0.5, beta 0.25, Q = 0), one with goal-reward (1 into G, 0 otherwise) and one with action-penalty (−1 per step, 0 into G). The exam episode east, east, south, south, or moves chosen with the buttons or arrow keys, update both tables with the Q-learning rule, shown with its numbers. After the exam episode goal-reward has one non-zero entry, Q((2,3),S) = 0.25 (exam 30 Aug 2022), and action-penalty three, Q((1,1),E) = Q((1,2),E) = Q((1,3),S) = −0.25 (exam 18 Jan 2023), while the step into G stays 0. In a second identical episode the action-penalty entries become −0.4375, because the max in the next cell still picks an untried move worth 0.
```

**Properties** (exam 11 Jun 2025): the Q-table takes $|S| \times |A|$ space (4N for N free cells and four moves).
Optimality is only **asymptotic**: every state–action pair must be tried infinitely often, so no bound on the time can be
given, unlike A*.

## Tabular RL does not scale (RL p. 20, 38, 75–79)

The table needs one entry per state–action pair; the number of possible inputs in the real world is huge, so an exact
$Q(s_t, a_t)$ cannot be afforded. **Approximators** (for example a deep neural network that maps the board to
q-values, RL p. 75–76) are used for interesting problems, with a caveat: we learn the q-values and how to approximate
them **at the same time**, the approximator works on intermediate estimates, and convergence is not guaranteed.

**Sizing a Q-table** is a recurring question: (number of states) × (number of actions).

- Criss-Cross solitaire (exam 25 Jan 2022): 17 positions for the empty cell × $\binom{16}{8}$ ways to place the 8 white
  tokens among the other 16 cells, × 8 actions: $17 \cdot 12870 \cdot 8 = 1\,750\,320$ entries.
- The 6×6 disc game (exam 20 Jun 2024): at most $4! \cdot 12! \cdot 20!$ states (from the minimax tree) × 36 actions.

```fig rl-qsize
Interactive log-scale bar chart of Q-table sizes |S|·|A| at 8 bytes per entry. 10×10 grid: 100 cells × 4 moves = 400 entries, 3.2 kB (a slider changes the grid side). Tic-tac-toe: 4 520 reachable boards where the game is not over × 9 = 40 680 entries, 325 kB (3^9·9 = 177 147 counting every filling). Criss-Cross: 17 × C(16,8) = 12 870 × 8 = 1 750 320 entries, 14 MB. 6×6 disc game: 4!·12!·20! × 36 ≈ 1.01·10^30 entries, about 8·10^30 bytes. Chess, from a published estimate of 4.8·10^44 positions × at most 218 moves: about 10^47 entries. Go 19×19, 2.08·10^170 legal positions × 362 moves: about 7.5·10^172 entries, more than the about 10^80 atoms in the observable universe. Clicking a row shows its computation.
```

## Search vs learning: navigation (RL p. 39–53)

An empty 10×10 grid, start top-left, goal bottom-right, goal-reward. **A*** returns one shortest path from the start.
**Q-learning** needs about 200 learning problems (episodes) before the number of steps per episode drops to the optimum,
and then knows the best action from **every** cell. In the computed table, values shrink by a factor 0.95 per step
away from the goal: the discount factor of the run.

```fig rl-navigation
Simulation on the 10×10 grid of RL p. 40–48 (start top-left, goal bottom-right, reward 1 into the goal, gamma 0.95, beta 0.25, epsilon 0.1). Q-learning runs live: episode 1 is a random walk of hundreds of steps; the values then spread backwards from the goal, and the steps per episode fall to about the A* length (18 on the empty grid, 20 in the slides' maze of RL p. 50), slightly above it while epsilon > 0. A* gives one 18-step path at once. Q-learning learns arrows only where it goes: with epsilon 0.1 about 65 of the 99 cells after 1000 episodes, about 94 with epsilon 0.5 but with longer episodes (exploration vs exploitation). Cells can be clicked to add walls.
```

| | search (A*) | reinforcement learning (Q-learning) |
|---|---|---|
| needs | a model: actions, result, costs, a heuristic | only the ability to act and observe rewards |
| computes | one solution path from the start | an action-value function for every state |
| agent | goal-based | utility-based |
| guarantees | optimal with an admissible $h$; exponential but bounded time | optimal only asymptotically; no time bound |
| suboptimal actions | not evaluated | their values are learned too |

(Last two rows: exams 11 Jun 2025 and 31 Aug 2026.) Every goal-based agent can be implemented as a utility-based one
(maximum utility at the goal), as with the maze solved both by A* and by Q-learning in class, but that is often overkill:
search algorithms are built for goal-based problems and give guarantees, such as optimality, that Q-learning lacks.

## Adversarial search vs learning: tic-tac-toe (RL p. 54–74)

The problem definition (RL p. 57) has the agent play first (X); in the experiments of RL p. 62–73 the Q-learner is
Player 2 (O). The state is the board, there are at most 9 actions, the reward is 1 for a win,
−1 for a loss and 0 otherwise, received only at the end; parameters $\beta$, $\gamma$ and the initial value $q_0$. From
the agent's point of view the opponent's reply is part of the **environment**: after its move $s_t$ it observes
$s_{t+2}$ (RL p. 59–60). So the opponent used for training shapes what is learned.

| Player 1 (X), against Player 2 (O) = tabular Q-learning | what happens (RL p. 62–73) |
|---|---|
| **Minimax** (deterministic, optimal) | Minimax wins about 95% at first; after about 100 games every game is a **draw**. The environment is deterministic: Q-learning only has to learn a reply to one fixed strategy |
| **Random Minimax** (optimal, picks at random among equally good moves) | still stochastic: the same board and move can lead to different next boards. Draws rise slowly, 100% after about 5000 games |
| **Q-learning vs Q-learning** | both learn different roles from scratch; noisy for about 6000 games, then all draws |
| **Random player** | the Q-learner wins about 90% (draws about 10%); it can learn to exploit any opponent, even a random one |

```fig rl-ttt
Simulation: a tabular Q-learner trains live against Minimax, Random Minimax, another Q-learner or a random player, with the outcome of every 100 games plotted as in the slides. Defaults as in the slides' runs: the learner plays O (second), beta 0.9, gamma 0.95, epsilon 0, q0 = 0.2, reward +1/−1/0 at the end of the game. Measured over 50 runs (a run counts as settled from the first block of 100 games after which every block has at least 98% draws): against Minimax from game 200 in every run (slides: 100), with only 27 boards ever seen; against Random Minimax from game 5100–9700, median 6550 (slides: about 5000), about 920 boards; Q-learner against Q-learner from game 7100–8400, median 7550 (slides: about 6500); against a random player the learner wins 87–94% of the last 1000 of 50 000 games and draws about 9% (slides: about 90% and 10%). With epsilon > 0 the draws never reach 100%. The learner can also play X.
```

Thoughts (RL p. 74): tabular Q-learning, like minimax and alpha-beta, is feasible only for few states; minimax explores
the whole tree (infeasible already for Connect-4), alpha-beta only the relevant part, tabular Q-learning stores a value
for every state–action pair. Minimax and alpha-beta assume an optimal opponent (their values mean "at least") and play
optimally from the start; Q-learning must be trained, and the quality of the training opponent affects learning, but it
can learn an optimal strategy against any opponent.

> **Exam trap:** "MCTS with one playout vs Minimax" (exam 8 Jul 2025): with a single simulation MCTS just picks the
> first action it tries, so it plays like a random player and Minimax wins almost every game, apart from the few lucky
> draws.

## Bandits vs RL

A **multi-armed bandit** has a single, immediate decision: the action does not change future rewards. In the usual RL
setting actions have long-term consequences (delayed rewards, as in a maze). So UCB is the right tool for a bandit task
with only immediate rewards, Q-learning for sequential tasks with delayed rewards (exams 8 Sep 2025 and 31 Aug 2026).

```fig rl-bandit
Side-by-side simulation of one decision with a delayed consequence: in S, stop pays 1 at once and ends the episode; go pays 0 now and 5 three moves later. A bandit learner averages the reward that follows each choice at once (1 for stop, 0 for go) and settles on stop; Q-learning (beta 0.5, gamma 0.9) adds the discounted value of the next state, so the 5 travels back along the corridor and go becomes worth gamma^3·5 = 3.645 > 1. Both explore with epsilon 0.1 for 300 episodes; live counters show how often each picks go in the last 50 episodes and the reward per episode. Below gamma ≈ 0.585 (gamma^3·5 = 1) even Q-learning prefers stop.
```

## How the exam asks it

| question type | where | how to answer |
|---|---|---|
| fill the Q-table after one or two given episodes | 30 Aug 2022, 18 Jan 2023 | apply the update step by step **in order**; the max uses the table **as it is now**; no discount term into the goal |
| converged $Q$ or $V$ values in a small grid | 30 Aug 2022, 11 Jun 2026, 8 Jul 2026 | backwards from the goal, best action in each cell; $\beta$ is irrelevant |
| formula of $V(s_t)$ | 6 Feb 2026 | $\mathbb{E}[\sum_k \gamma^k r_{t+k+1}]$ |
| design a reward function; size of the Q-table | 25 Jan 2022, 20 Jun 2024 | win/lose/draw (+1/−1/0) or score difference; \|S\|·\|A\| |
| Q-learning vs A* (complexity, what each computes, agent type) | 11 Jun 2025, 31 Aug 2026 | table above |
| UCB vs Q-learning, bandits vs RL | 8 Sep 2025, 31 Aug 2026 | immediate vs delayed rewards |
| expected results of minimax / Q-learning / MCTS matches | 8 Jul 2025 | deterministic opponent → fast convergence to draws; stochastic → slower |
| relation between learning agent and the four architectures | 11 Jun 2026 | performance element = any architecture |
