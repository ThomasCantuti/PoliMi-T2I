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

## The reinforcement-learning loop (RL p. 13–17)

At time $t$ the agent perceives state $s_t$ and performs action $a_t$; at time $t+1$ the environment moves to $s_{t+1}$
and the agent receives the reward $r_{t+1}$.

```text
        s_t, r_t
   ┌───────────────── Environment ◀──┐
   ▼                                 │ a_t
 Agent ──────────────────────────────┘
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

## Computing the converged values by hand

This is the most frequent RL exercise (exams 30 Aug 2022, 11 Jun 2026, 8 Jul 2026). Start from the goal and move
backwards, one ring of cells at a time; each cell takes the best of its available actions.

Exam of 11 June 2026: the agent moves up/down/left/right, $\gamma = 0.5$, reward 0 entering the goal and −1 otherwise.

```text
 ┌───────┬───────┬───────┐
 │ -1.5  │  -1   │   0   │      (1,3): down into G      → 0 + 0.5·0       =  0
 ├───────┼───────┼───────┤      (1,2): right to (1,3)   → -1 + 0.5·0      = -1
 │ -1.75 │ ##### │   G   │      (1,1): right to (1,2)   → -1 + 0.5·(-1)   = -1.5
 └───────┴───────┴───────┘      (2,1): up to (1,1)      → -1 + 0.5·(-1.5) = -1.75
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

## The environment: Markov decision processes (RL p. 27–28)

The environment must satisfy the **Markov property**: $s_{t+1}$ and $r_{t+1}$ depend only on $s_t$ and $a_t$, not on the
earlier history. It is then a **Markov Decision Process** (MDP) with one-step dynamics
$p(s_{t+1}, r_{t+1} \mid s_t, a_t)$, a probability distribution: $\sum_{s'} \sum_{r} p(s', r \mid s, a) = 1$ for every
$s$ and every $a \in A(s)$.

## Q-learning (RL p. 36–37)

The table $Q(\cdot, \cdot)$ is initialized (randomly in the slides, **with zeros in every exam**). At every step $t$:

$$Q(s_t, a_t) \leftarrow \underbrace{Q(s_t, a_t)}_{\text{previous value}} + \beta\Big(
\underbrace{r_{t+1}}_{\text{incoming reward}} + \underbrace{\gamma \max_{a \in A} Q(s_{t+1}, a)}_{\text{value of the next state}}
- Q(s_t, a_t)\Big)$$

The term $r_{t+1} + \gamma \max_a Q(s_{t+1}, a)$ is the **new estimate**; $\beta$ moves the old value a fraction of the
way toward it. Parameters: discount factor $\gamma$, learning rate $\beta$, and the action-selection strategy during
learning (ε-greedy is the most common), which must guarantee **sufficient exploration**.

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

```text
     1   2   3
 1 [ S ][   ][   ]       episode 1: only the last step changes something:
 2 [   ][###][   ]         Q((2,3), S) = 0 + 0.25·(1 − 0) = 0.25
 3 [   ][   ][ G ]       episode 2: Q((1,3), S) = 0 + 0.25·(0 + 0.5·0.25 − 0) = 0.03125
                                    Q((2,3), S) = 0.25 + 0.25·(1 − 0.25)     = 0.4375
```

The reward travels backwards **one step per episode**: Q-learning needs many episodes to propagate it to the start.

> **Exam trap:** when $s_{t+1}$ is the goal the episode ends: **no discounted term** (the official solution of
> 30 Aug 2022 says so explicitly). Only the reward is used.

> **Exam trap:** with the action-penalty reward and $Q = 0$ (exam 18 Jan 2023) the first episode changes **every**
> step taken before the goal: each gets $0 + 0.25\cdot(-1 + 0.5 \cdot 0 - 0) = -0.25$; the last one, into the goal,
> stays 0. The reward function changes which entries move first.

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

## Search vs learning: navigation (RL p. 39–53)

An empty 10×10 grid, start top-left, goal bottom-right, goal-reward. **A*** returns one shortest path from the start.
**Q-learning** needs about 200 learning problems (episodes) before the number of steps per episode drops to the optimum,
and then knows the best action from **every** cell. In the computed table, values shrink by a factor 0.95 per step
away from the goal: the discount factor of the run.

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

The agent learns to play first (X). The state is the board, there are at most 9 actions, the reward is 1 for a win,
−1 for a loss and 0 otherwise, received only at the end; parameters $\beta$, $\gamma$ and the initial value $q_0$. From
the agent's point of view the opponent's reply is part of the **environment**: after its move $s_t$ it observes
$s_{t+2}$ (RL p. 59–60). So the opponent used for training shapes what is learned.

| Player 1 (X), against Player 2 (O) = tabular Q-learning | what happens (RL p. 62–73) |
|---|---|
| **Minimax** (deterministic, optimal) | Minimax wins about 95% at first; after about 100 games every game is a **draw**. The environment is deterministic: Q-learning only has to learn a reply to one fixed strategy |
| **Random Minimax** (optimal, picks at random among equally good moves) | still stochastic: the same board and move can lead to different next boards. Draws rise slowly, 100% after about 5000 games |
| **Q-learning vs Q-learning** | both learn different roles from scratch; noisy for about 6000 games, then all draws |
| **Random player** | the Q-learner wins about 90% (draws about 10%); it can learn to exploit any opponent, even a random one |

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
