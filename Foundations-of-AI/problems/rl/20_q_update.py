from harness import Test

TITLE = 'One Q-learning update'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['Q-learning', 'update rule', 'learning rate', 'discount factor']

STATEMENT = r"""
Q-learning (RL p. 36–37) keeps a table $Q(s, a)$. After performing $a_t$ in $s_t$, receiving $r_{t+1}$ and landing in
$s_{t+1}$:

$$Q(s_t, a_t) \leftarrow Q(s_t, a_t) + \beta\big(r_{t+1} + \gamma \max_{a \in A} Q(s_{t+1}, a) - Q(s_t, a_t)\big)$$

Write `q_update(Q, s, a, r, s2, actions2, beta, gamma)`:

- `Q` is a dict mapping `(state, action)` to a number; **missing entries count as 0** (the exams initialize the table
  with zeros);
- `actions2` lists the actions available in `s2`; it is **empty when `s2` is terminal** (the goal): the episode ends, so
  there is no discounted term;
- update `Q[(s, a)]` in place and also return the new value.

**Example (exam 30 Aug 2022, episode 2):** $Q((2,3), S) = 0.25$, $\beta = 0.25$, the agent enters the goal and gets 1:
$0.25 + 0.25\,(1 - 0.25) = 0.4375$.
"""

STARTER = '''def q_update(Q: dict, s, a, r: float, s2, actions2: list, beta: float, gamma: float) -> float:
    """Apply Q(s,a) <- Q(s,a) + beta * (r + gamma * max_b Q(s2,b) - Q(s,a)); missing entries are 0.
    actions2 is empty when s2 is terminal (no future). Return the new Q(s,a)."""
    # TODO
    return 0.0
'''

SOLUTION = '''def q_update(Q: dict, s, a, r: float, s2, actions2: list, beta: float, gamma: float) -> float:
    """Apply Q(s,a) <- Q(s,a) + beta * (r + gamma * max_b Q(s2,b) - Q(s,a)); missing entries are 0.
    actions2 is empty when s2 is terminal (no future). Return the new Q(s,a)."""
    future = max((Q.get((s2, b), 0.0) for b in actions2), default=0.0)
    old = Q.get((s, a), 0.0)
    Q[(s, a)] = old + beta * (r + gamma * future - old)
    return Q[(s, a)]
'''

HINTS = [
    'Read missing entries with `Q.get((s, a), 0.0)`.',
    'The future value is the **max** over the actions of `s2`; with no actions (terminal) it is 0: `max(..., default=0.0)`.',
    'new = old + beta * (r + gamma * future - old); store it in `Q[(s, a)]` and return it.',
]

EXPLANATION = r"""
The bracket is the **temporal-difference error**: new estimate minus previous value. $\beta$ decides how far the old
value moves toward the new estimate: $\beta = 1$ overwrites it, a small $\beta$ averages many noisy experiences.

Why the **max**? Q-learning estimates the value of acting **optimally** from $s_{t+1}$ on ("and then continues to do its
best", RL p. 18), whatever action the exploring policy will actually take next. That is why it can learn the optimal
values while behaving ε-greedily.

> **Exam trap:** the max is taken on the table **as it is now**. In episode 2 of the exam of 30 Aug 2022,
> $Q((1,3), S)$ uses $\max Q((2,3), \cdot) = 0.25$ from episode 1, not the 0.4375 that $(2,3)$ will get one step later.
"""

ENTRY = 'q_update'


def _seq(updates, beta, gamma):
    def run(sol):
        Q = {}
        out = []
        for s, a, r, s2, actions2 in updates:
            out.append(round(sol.q_update(Q, s, a, r, s2, actions2, beta, gamma), 6))
        return out
    return run


AUG22_EP = [((1, 1), 'E', 0, (1, 2), ['E', 'W']), ((1, 2), 'E', 0, (1, 3), ['S', 'W']),
            ((1, 3), 'S', 0, (2, 3), ['N', 'S']), ((2, 3), 'S', 1, (3, 3), [])]

TESTS = [
    Test('exam 30 Aug 2022, last step of episode 2', args=({((2, 3), 'S'): 0.25}, (2, 3), 'S', 1, (3, 3), [], 0.25, 0.5),
         expected=0.4375),
    Test('exam 30 Aug 2022, (1,3) south in episode 2',
         args=({((2, 3), 'S'): 0.25}, (1, 3), 'S', 0, (2, 3), ['N', 'S'], 0.25, 0.5), expected=0.03125),
    Test('missing entries are 0 (exam 18 Jan 2023, first step)', args=({}, (1, 1), 'E', -1, (1, 2), ['E', 'W'], 0.25, 0.5),
         expected=-0.25),
    Test('the dict is updated in place',
         call=lambda sol: (lambda Q: (sol.q_update(Q, 's', 'a', 2, 't', ['x'], 0.5, 0.9), Q))({('t', 'x'): 1.0}),
         check=lambda got: (abs(got[1].get(('s', 'a'), 0) - 1.45) < 1e-9, f'Q[("s","a")] = {got[1].get(("s","a"))}, expected 1.45')),
    Test('max over the next actions, not the sum or the first',
         args=({('t', 'x'): 1.0, ('t', 'y'): 3.0, ('t', 'z'): -2.0}, 's', 'a', 0, 't', ['x', 'y', 'z'], 1.0, 0.5), expected=1.5),
    Test('terminal next state: no future term', args=({('g', 'x'): 9.0}, 's', 'a', 1, 'g', [], 0.5, 0.9), expected=0.5),
    Test('episode 1 of the exam of 30 Aug 2022, step by step', call=_seq(AUG22_EP, 0.25, 0.5), expected=[0, 0, 0, 0.25]),
]
