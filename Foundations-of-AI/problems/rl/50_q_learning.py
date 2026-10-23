import random

from harness import Test
from rl_lib import (GridWorld, goal_reward, action_penalty, shortest_path_length,
                    EXAM_AUG_2022, SLIDES_MAZE1)

TITLE = 'Q-learning with ε-greedy: learn the maze of the slides'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['Q-learning', 'ε-greedy', 'exploration', 'learning curve']

STATEMENT = r"""
Now nobody gives the episodes: the agent chooses its actions with an **ε-greedy** policy (RL p. 26) and learns from
what happens (RL p. 37). Write `q_learning(world, episodes, beta, gamma, epsilon, reward, rng, max_steps=1000)` →
`(Q, steps)`, where `Q` is the table `{(s, a): value}` (all pairs, initialized to 0) and `steps[i]` is the number of
moves of episode `i`. Follow this protocol exactly (seeded runs must be reproducible):

```text
for each episode:
    s = world.start, n = 0
    while s is not the goal and n < max_steps:
        acts = world.actions(s)
        if rng.random() < epsilon:  a = rng.choice(acts)                       # explore
        else:  best = max of Q[s, b] over acts;  a = rng.choice([b in acts with Q[s, b] == best])   # exploit
        s2 = world.result(s, a);  r = reward(s, a, s2, world)
        Q[s, a] += beta * (r + gamma * max_b Q[s2, b] - Q[s, a])                # max = 0 if s2 is the goal
        s = s2;  n += 1
    steps.append(n)
```

The tests train on the 3×3 exam grid and on the 10×10 "maze1" of RL p. 50 (`SLIDES_MAZE1` in `rl_lib`), with the
goal-reward of the slides: 0 everywhere, 1 entering the goal.
"""

STARTER = '''from random import Random
from rl_lib import GridWorld

def q_learning(world: GridWorld, episodes: int, beta: float, gamma: float, epsilon: float,
               reward, rng: Random, max_steps: int = 1000):
    """Tabular Q-learning with epsilon-greedy (random tie-breaking). Return (Q, steps per episode)."""
    Q = {(s, a): 0.0 for s in world.states for a in world.actions(s)}
    steps = []
    # TODO: follow the protocol of the statement
    return Q, steps
'''

SOLUTION = '''from random import Random
from rl_lib import GridWorld

def q_learning(world: GridWorld, episodes: int, beta: float, gamma: float, epsilon: float,
               reward, rng: Random, max_steps: int = 1000):
    """Tabular Q-learning with epsilon-greedy (random tie-breaking). Return (Q, steps per episode)."""
    Q = {(s, a): 0.0 for s in world.states for a in world.actions(s)}
    steps = []
    for _ in range(episodes):
        s, n = world.start, 0
        while not world.is_terminal(s) and n < max_steps:
            acts = world.actions(s)
            if rng.random() < epsilon:
                a = rng.choice(acts)
            else:
                best = max(Q[s, b] for b in acts)
                a = rng.choice([b for b in acts if Q[s, b] == best])
            s2 = world.result(s, a)
            r = reward(s, a, s2, world)
            future = max((Q[s2, b] for b in world.actions(s2)), default=0.0)
            Q[s, a] += beta * (r + gamma * future - Q[s, a])
            s, n = s2, n + 1
        steps.append(n)
    return Q, steps
'''

HINTS = [
    'Exactly one `rng.random()` per step, then one `rng.choice(...)` (among all actions when exploring, among the best ones when exploiting).',
    'Break ties **at random**: with goal-reward every Q is 0 at the start, and a fixed tie-break (always "N" first) makes the agent drift toward a corner and never find the goal.',
    'The update is the one of problem 20: `future = max((Q[s2, b] for b in world.actions(s2)), default=0.0)`.',
]

EXPLANATION = r"""
**Learning curve.** At first the agent wanders: with $Q = 0$ everywhere it is a random walk, hundreds of steps per
episode (RL p. 45 and 52 show 1000 steps at the start, the cap of the run). Once the goal is found, the reward
propagates backwards one step per visit and the greedy part takes over: after a few hundred episodes it follows the
shortest path (20 moves here) plus the occasional exploratory detour, exactly the drop of the plots in the slides.

**Ties matter.** With goal-reward and zero initialization all actions look equal until the first success. A
deterministic tie-break turns "exploit" into "always go north", and the agent may never reach the goal. With the
**action-penalty** reward, instead, every action tried gets negative, so untried actions (still 0) look better:
zero initialization becomes **optimistic** and drives a systematic exploration.

**What it learned.** Not a path but a **policy for every cell** (the arrows of RL p. 47 and 52) and, with enough
exploration, the converged values of problem 40: on the exam grid the table matches the official one of 30 Aug 2022.
"""

ENTRY = 'q_learning'

AUG = GridWorld(EXAM_AUG_2022)
MAZE = GridWorld(SLIDES_MAZE1)
AUG_STAR = {((1, 1), 'E'): 0.125, ((1, 1), 'S'): 0.125, ((1, 2), 'E'): 0.25, ((1, 2), 'W'): 0.0625,
            ((1, 3), 'S'): 0.5, ((1, 3), 'W'): 0.125, ((2, 1), 'N'): 0.0625, ((2, 1), 'S'): 0.25,
            ((2, 3), 'N'): 0.25, ((2, 3), 'S'): 1.0, ((3, 1), 'N'): 0.125, ((3, 1), 'E'): 0.5,
            ((3, 2), 'E'): 1.0, ((3, 2), 'W'): 0.25}


def _greedy_length(world, Q, limit=200):
    s, n = world.start, 0
    while not world.is_terminal(s) and n < limit:
        s = world.result(s, max(world.actions(s), key=lambda b: Q[s, b]))
        n += 1
    return n


def _ref(world, episodes, beta, gamma, epsilon, reward, rng, max_steps=1000):
    Q = {(s, a): 0.0 for s in world.states for a in world.actions(s)}
    steps = []
    for _ in range(episodes):
        s, n = world.start, 0
        while not world.is_terminal(s) and n < max_steps:
            acts = world.actions(s)
            if rng.random() < epsilon:
                a = rng.choice(acts)
            else:
                best = max(Q[s, b] for b in acts)
                a = rng.choice([b for b in acts if Q[s, b] == best])
            s2 = world.result(s, a)
            future = max((Q[s2, b] for b in world.actions(s2)), default=0.0)
            Q[s, a] += beta * (reward(s, a, s2, world) + gamma * future - Q[s, a])
            s, n = s2, n + 1
        steps.append(n)
    return Q, steps


def _exact(got, *args):
    want = _ref(AUG, 20, 0.5, 0.5, 0.2, goal_reward, random.Random(5))
    if not (isinstance(got, tuple) and len(got) == 2):
        return False, 'return the pair (Q, steps)'
    if got[1] != want[1]:
        return False, f'steps per episode {got[1]}, expected {want[1]} (one rng.random() + one rng.choice() per step)'
    bad = [k for k in want[0] if abs(got[0].get(k, 0) - want[0][k]) > 1e-12]
    return not bad, f'Q differs on {bad[:3]}'


def _maze(sol):
    Q, steps = sol.q_learning(MAZE, 500, 0.5, 0.95, 0.1, goal_reward, random.Random(3))
    return _greedy_length(MAZE, Q), round(sum(steps[:50]) / 50, 1), round(sum(steps[-50:]) / 50, 1)


TESTS = [
    Test('exact protocol (seeded, 20 episodes on the exam grid)', args=(AUG, 20, 0.5, 0.5, 0.2, goal_reward, random.Random(5)),
         check=_exact, show='GridWorld(EXAM_AUG_2022), 20 episodes, beta=0.5, gamma=0.5, epsilon=0.2, Random(5)'),
    Test('converges to the official table of 30 Aug 2022',
         call=lambda sol: sol.q_learning(AUG, 3000, 0.5, 0.5, 0.3, goal_reward, random.Random(0))[0],
         check=lambda got: (all(abs(got[k] - v) < 1e-6 for k, v in AUG_STAR.items()),
                            'max error ' + str(round(max(abs(got.get(k, 0) - v) for k, v in AUG_STAR.items()), 6))),
         show='GridWorld(EXAM_AUG_2022), 3000 episodes, epsilon=0.3 -> Q close to Q*'),
    Test('maze1 of the slides: greedy path is a shortest path, the learning curve drops', call=_maze,
         check=lambda got: (got[0] == shortest_path_length(MAZE) and got[1] > 3 * got[2],
                            f'greedy path {got[0]} moves (shortest {shortest_path_length(MAZE)}), '
                            f'avg steps first 50 episodes {got[1]}, last 50 {got[2]}'),
         show='GridWorld(SLIDES_MAZE1), 500 episodes, beta=0.5, gamma=0.95, epsilon=0.1, goal_reward', timeout=10),
    Test('action penalty also learns the maze',
         call=lambda sol: _greedy_length(MAZE, sol.q_learning(MAZE, 300, 0.5, 0.95, 0.1, action_penalty, random.Random(1))[0]),
         expected=20, show='GridWorld(SLIDES_MAZE1), 300 episodes, action_penalty -> greedy path length', timeout=10),
    Test('max_steps caps an episode',
         call=lambda sol: max(sol.q_learning(MAZE, 3, 0.5, 0.95, 1.0, goal_reward, random.Random(2), max_steps=7)[1]),
         check=lambda got: (got <= 7, f'an episode lasted {got} moves with max_steps=7')),
]
