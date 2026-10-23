from harness import Test
from rl_lib import (GridWorld, goal_reward, action_penalty, grey_penalty,
                    EXAM_AUG_2022, EXAM_JUN_2026, EXAM_JUL_2026)

TITLE = 'Values at convergence: what the Q-table is trying to learn'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['Bellman equation', 'converged values', 'V(s)', 'grid world']

STATEMENT = r"""
"Suppose you continue to train the agent until the Q-table converges. What would be the values in the final table?"
(exam 30 Aug 2022). At convergence, in a **deterministic** grid where the best action is always selected afterwards,

$$Q(s, a) = r(s, a, s') + \gamma\,V(s'), \qquad V(s) = \max_a Q(s, a), \qquad V(\text{goal}) = 0,
\qquad s' = \text{result}(s, a)$$

(the Bellman equation of RL p. 35 without the expectation). The learning rate $\beta$ plays no role.

Write `converged_q(world, gamma, reward)` → dict `{(s, a): value}` for every non-terminal state and available action.
Suggested method (**value iteration**): start with $V = 0$ everywhere, recompute all the $Q$ and $V$ from the formulas
above, and repeat until nothing changes by more than `1e-12`.

The `GridWorld` interface is the one of the previous problem (`world.states`, `world.actions(s)`,
`world.result(s, a)`, `world.is_terminal(s)`).
"""

STARTER = '''from rl_lib import GridWorld

def converged_q(world: GridWorld, gamma: float, reward) -> dict:
    """Q*(s, a) = reward(s, a, s2, world) + gamma * V*(s2), V*(s) = max_a Q*(s, a), V*(goal) = 0."""
    V = {s: 0.0 for s in world.states}
    Q = {}
    # TODO: repeat the two formulas until the values stop changing
    return Q
'''

SOLUTION = '''from rl_lib import GridWorld

def converged_q(world: GridWorld, gamma: float, reward) -> dict:
    """Q*(s, a) = reward(s, a, s2, world) + gamma * V*(s2), V*(s) = max_a Q*(s, a), V*(goal) = 0."""
    V = {s: 0.0 for s in world.states}
    while True:
        Q = {}
        for s in world.states:
            for a in world.actions(s):
                s2 = world.result(s, a)
                Q[s, a] = reward(s, a, s2, world) + gamma * V[s2]
        newV = {s: max((Q[s, a] for a in world.actions(s)), default=0.0) for s in world.states}
        if all(abs(newV[s] - V[s]) < 1e-12 for s in world.states):
            return Q
        V = newV
'''

HINTS = [
    'The goal has no actions: its V stays 0 (`max(..., default=0.0)`).',
    'One sweep: for every s and available a, `Q[s, a] = reward(s, a, s2, world) + gamma * V[s2]`; then `V[s] = max` of its Q.',
    'Repeat the sweep until no V changes by more than 1e-12 (a `while True` loop with an `all(...)` test).',
]

EXPLANATION = r"""
By hand you do the same thing backwards from the goal, one ring of cells at a time. Exam of 30 Aug 2022
(goal-reward, $\gamma = 0.5$):

| state | north | east | south | west |
|---|---|---|---|---|
| (1,1) | – | 0.125 | 0.125 | – |
| (1,2) | – | 0.25 | – | 0.0625 |
| (1,3) | – | – | 0.5 | 0.125 |
| (2,1) | 0.0625 | – | 0.25 | – |
| (2,3) | 0.25 | – | 1 | – |
| (3,1) | 0.125 | 0.5 | – | – |
| (3,2) | – | 1 | – | 0.25 |

(– = action not available; the official table writes 0 there.) A suboptimal action is still valued: north from
(2,3) gives the rewards 0, 0, 1, i.e. $0.5^2 = 0.25$, as the official solution explains.

With action-penalty (exam 11 Jun 2026) the values are negative: −1.75, −1.5, −1, 0. With the grey cell of the exam of
8 Jul 2026, entering it costs −2, which is never better than going around: the values do not change, and the grey cell
itself gets $V = 0$ because from it one step enters the goal.

> **Exam trap:** Q-learning reaches these values only if every state–action pair keeps being tried (enough
> exploration) — that is why optimality is asymptotic. The **values** do not depend on $\beta$; the **speed** does.
"""

ENTRY = 'converged_q'


def _q(rows, gamma, reward, expected):
    w = GridWorld(rows)

    def check(got, *args):
        got_r = {k: round(v, 6) for k, v in got.items()}
        bad = [(k, got_r.get(k), v) for k, v in expected.items() if got_r.get(k) != v]
        return not bad, '' if not bad else f'first mismatches (pair, got, expected): {bad[:3]}'
    return w, check


def _v(rows, gamma, reward, expected):
    w = GridWorld(rows)

    def run(sol):
        Q = sol.converged_q(w, gamma, reward)
        return {s: round(max((Q[s, a] for a in w.actions(s)), default=0.0), 6) for s in w.states}
    return run, expected


AUG_Q = {((1, 1), 'E'): 0.125, ((1, 1), 'S'): 0.125, ((1, 2), 'E'): 0.25, ((1, 2), 'W'): 0.0625,
         ((1, 3), 'S'): 0.5, ((1, 3), 'W'): 0.125, ((2, 1), 'N'): 0.0625, ((2, 1), 'S'): 0.25,
         ((2, 3), 'N'): 0.25, ((2, 3), 'S'): 1.0, ((3, 1), 'N'): 0.125, ((3, 1), 'E'): 0.5,
         ((3, 2), 'E'): 1.0, ((3, 2), 'W'): 0.25}
AUG_W, AUG_CHECK = _q(EXAM_AUG_2022, 0.5, goal_reward, AUG_Q)
JUN_RUN, JUN_V = _v(EXAM_JUN_2026, 0.5, action_penalty, {(1, 1): -1.5, (1, 2): -1.0, (1, 3): 0.0, (2, 1): -1.75, (2, 3): 0.0})
JUL_RUN, JUL_V = _v(EXAM_JUL_2026, 0.5, grey_penalty,
                    {(1, 1): -1.5, (1, 2): -1.0, (1, 3): 0.0, (2, 1): -1.75, (2, 2): 0.0, (2, 3): 0.0})
EMPTY = ['S' + '.' * 9] + ['.' * 10] * 8 + ['.' * 9 + 'G']

TESTS = [
    Test('exam 30 Aug 2022, Q3: the converged Q-table', args=(AUG_W, 0.5, goal_reward), check=AUG_CHECK,
         show='GridWorld(EXAM_AUG_2022), gamma=0.5, goal_reward'),
    Test('exam 11 Jun 2026: V(s) of every cell', call=JUN_RUN, expected=JUN_V,
         show='GridWorld(EXAM_JUN_2026), gamma=0.5, action_penalty -> V'),
    Test('exam 8 Jul 2026: the grey cell costs -2', call=JUL_RUN, expected=JUL_V,
         show='GridWorld(EXAM_JUL_2026), gamma=0.5, grey_penalty -> V'),
    Test('empty 10x10 grid of RL p. 48 (gamma = 0.95)',
         call=lambda sol: (lambda Q: (round(Q[(1, 2), 'E'], 3), round(Q[(2, 6), 'S'], 3)))(
             sol.converged_q(GridWorld(EMPTY), 0.95, goal_reward)),
         expected=(0.440, 0.569), show='10x10 empty grid, gamma=0.95, goal_reward -> Q((1,2),E), Q((2,6),S)'),
    Test('gamma = 0.9: (1,1) is three steps from the goal', args=(AUG_W, 0.9, goal_reward),
         check=lambda got, *a: (abs(got[(1, 1), 'E'] - 0.9 ** 3) < 1e-9, f'Q((1,1),E) = {got.get(((1, 1), "E"))}, expected 0.9^3 = 0.729')),
]
