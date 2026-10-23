from harness import Test
from rl_lib import GridWorld, goal_reward, action_penalty, EXAM_AUG_2022

TITLE = 'Fill the Q-table after given episodes'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['Q-learning', 'Q-table', 'episodes', 'grid world']

STATEMENT = r"""
The classic exam exercise (30 Aug 2022, 18 Jan 2023): the **episodes are given** (the action sequence is fixed, no
exploration policy involved), and you must report the Q-table after them.

Write `replay(world, episodes, beta, gamma, reward)`:

- `world` is a `GridWorld` (from `rl_lib`): `world.start`, `world.states`, `world.actions(s)` (available actions in
  `N, E, S, W` order, empty in the goal), `world.result(s, a)` and `world.is_terminal(s)`;
- `episodes` is a list of strings of actions, e.g. `'EESS'`; each episode starts in `world.start`;
- `reward(s, a, s2, world)` returns $r_{t+1}$ (`goal_reward` or `action_penalty` from `rl_lib`);
- the table starts at **0 for every pair**; apply the update of the previous problem after **every** step, in order;
  entering the goal ends the episode, with no discounted term.

Return the table as a dict `{(state, action): value}` with an entry for **every** non-terminal state and every
available action (zeros included).

```text
     1   2   3          exam of 30 Aug 2022: gamma = 0.5, beta = 0.25, reward 1 entering G (goal_reward)
 1 [ S ][   ][   ]      episode 1 = episode 2 = east, east, south, south
 2 [   ][###][   ]
 3 [   ][   ][ G ]
```
"""

STARTER = '''from rl_lib import GridWorld

def replay(world: GridWorld, episodes: list[str], beta: float, gamma: float, reward) -> dict:
    """Q-learning on fixed action sequences; return {(s, a): Q} for every non-terminal s and available a."""
    Q = {(s, a): 0.0 for s in world.states for a in world.actions(s)}
    # TODO: for each episode, start at world.start and apply the Q-learning update after every action
    return Q
'''

SOLUTION = '''from rl_lib import GridWorld

def replay(world: GridWorld, episodes: list[str], beta: float, gamma: float, reward) -> dict:
    """Q-learning on fixed action sequences; return {(s, a): Q} for every non-terminal s and available a."""
    Q = {(s, a): 0.0 for s in world.states for a in world.actions(s)}
    for episode in episodes:
        s = world.start
        for a in episode:
            s2 = world.result(s, a)
            r = reward(s, a, s2, world)
            future = max((Q[s2, b] for b in world.actions(s2)), default=0.0)
            Q[s, a] += beta * (r + gamma * future - Q[s, a])
            s = s2
    return Q
'''

HINTS = [
    'Inner loop: `s2 = world.result(s, a)`, `r = reward(s, a, s2, world)`, then the update, then `s = s2`.',
    'The goal has no actions, so `max(..., default=0.0)` over `world.actions(s2)` gives 0 when entering it.',
    'Do the updates **in order**: the max must see the table as it is at that moment.',
]

EXPLANATION = r"""
**Episode 1** (goal-reward): every entry is 0, so every update before the goal computes $0 + \beta(0 + \gamma \cdot 0 - 0) = 0$.
Only the last one changes: $Q((2,3), S) = 0.25 \cdot 1 = 0.25$.

**Episode 2**: $Q((1,3), S) = 0.25\,(0 + 0.5 \cdot 0.25) = 0.03125$, because now $(2,3)$ has a non-zero action;
then $Q((2,3), S) = 0.25 + 0.25\,(1 - 0.25) = 0.4375$. The reward travels **backwards one step per episode**.

**Action-penalty** (exam 18 Jan 2023): every step that does not enter the goal gets −1, so after episode 1 the three
first actions are at $0.25 \cdot (-1) = -0.25$ and the last one, into the goal, stays 0. Same episode, different reward
design, different table.

With enough (exploring) episodes the table converges to the values computed by hand in the next problem, whatever
$\beta$ is.
"""

ENTRY = 'replay'

AUG = GridWorld(EXAM_AUG_2022)


def _nonzero(got):
    return {k: round(v, 6) for k, v in got.items() if abs(v) > 1e-12}


def _table(expected_nonzero):
    def check(got, *args):
        if not isinstance(got, dict):
            return False, 'return a dict {(state, action): value}'
        missing = [k for k in [(s, a) for s in AUG.states for a in AUG.actions(s)] if k not in got]
        if missing:
            return False, f'missing entries (zeros must be included): {missing[:3]}'
        nz = _nonzero(got)
        return nz == expected_nonzero, f'non-zero entries: {nz}, expected {expected_nonzero}'
    return check


TESTS = [
    Test('exam 30 Aug 2022, Q1: after episode 1', args=(AUG, ['EESS'], 0.25, 0.5, goal_reward),
         check=_table({((2, 3), 'S'): 0.25}), show="GridWorld(EXAM_AUG_2022), ['EESS'], beta=0.25, gamma=0.5, goal_reward"),
    Test('exam 30 Aug 2022, Q2: after episode 2', args=(AUG, ['EESS', 'EESS'], 0.25, 0.5, goal_reward),
         check=_table({((1, 3), 'S'): 0.03125, ((2, 3), 'S'): 0.4375}),
         show="GridWorld(EXAM_AUG_2022), ['EESS'] * 2, beta=0.25, gamma=0.5, goal_reward"),
    Test('exam 18 Jan 2023, Q1: action penalty', args=(AUG, ['EESS'], 0.25, 0.5, action_penalty),
         check=_table({((1, 1), 'E'): -0.25, ((1, 2), 'E'): -0.25, ((1, 3), 'S'): -0.25}),
         show="GridWorld(EXAM_AUG_2022), ['EESS'], beta=0.25, gamma=0.5, action_penalty"),
    Test('three episodes (the reward reaches (1,2))', args=(AUG, ['EESS'] * 3, 0.25, 0.5, goal_reward),
         check=_table({((1, 2), 'E'): 0.003906, ((1, 3), 'S'): 0.078125, ((2, 3), 'S'): 0.578125}),
         show="GridWorld(EXAM_AUG_2022), ['EESS'] * 3, beta=0.25, gamma=0.5, goal_reward"),
    Test('a wandering episode revisits a state', args=(AUG, ['EWEESS'], 0.5, 0.5, action_penalty),
         check=_table({((1, 1), 'E'): -0.75, ((1, 2), 'W'): -0.5, ((1, 2), 'E'): -0.5, ((1, 3), 'S'): -0.5}),
         show="GridWorld(EXAM_AUG_2022), ['EWEESS'], beta=0.5, gamma=0.5, action_penalty"),
]
