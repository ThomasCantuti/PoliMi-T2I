import math
import random

from harness import Test
from mcts_lib import Bandit

TITLE = 'UCB action selection on a bandit'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['bandits', 'UCB', 'exploration', 'regret']

STATEMENT = r"""
**UCB action selection** (slides p. 440–442) replaces ε-greedy's random exploration with optimism:

$$a_t = \arg\max_a \left[\, Q_t(a) + c \sqrt{\frac{\ln t}{N_t(a)}} \,\right]$$

where $t = 1, 2, \dots, T$ is the current step and $N_t(a)$ the number of times $a$ was taken
**before** step $t$. An arm with $N_t(a) = 0$ has an infinite bound, so untried arms are taken first.

Write `ucb_bandit(bandit, T, c)` → the list of the `T` arms pulled:

```text
Q = [0.0] * k, N = [0] * k
for t = 1 .. T:
    if some arm has N[a] == 0:  a = the first such arm
    else:                       a = argmax of Q[a] + c * sqrt(ln t / N[a])   (lowest index on ties)
    r = bandit.pull(a);  N[a] += 1;  Q[a] += (r - Q[a]) / N[a]
```

No random numbers are needed: all the randomness is in the bandit's rewards.

**Example:** with `Bandit([0.0, 1.0, 0.0])` (arm 1 always pays) and `c = 1`, 12 steps give
`[0, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0, 2]` — look at the last two.
"""

STARTER = '''import math
from mcts_lib import Bandit

def ucb_bandit(bandit: Bandit, T: int, c: float) -> list[int]:
    """Play T steps of UCB action selection; return the list of arms pulled."""
    k = bandit.k
    Q, N, arms = [0.0] * k, [0] * k, []
    for t in range(1, T + 1):
        # TODO: untried arm first, otherwise the arm with the largest upper confidence bound
        a = 0
        r = bandit.pull(a)
        # TODO: update N[a] and Q[a]
        arms.append(a)
    return arms
'''

SOLUTION = '''import math
from mcts_lib import Bandit

def ucb_bandit(bandit: Bandit, T: int, c: float) -> list[int]:
    """Play T steps of UCB action selection; return the list of arms pulled."""
    k = bandit.k
    Q, N, arms = [0.0] * k, [0] * k, []
    for t in range(1, T + 1):
        if 0 in N:
            a = N.index(0)
        else:
            a = max(range(k), key=lambda i: Q[i] + c * math.sqrt(math.log(t) / N[i]))
        r = bandit.pull(a)
        N[a] += 1
        Q[a] += (r - Q[a]) / N[a]
        arms.append(a)
    return arms
'''

HINTS = [
    '`0 in N` tells you whether an arm is still untried; `N.index(0)` gives the first one.',
    'Use the step number `t` (1-based) inside the log, and the counts **before** this step\'s pull.',
    '`a = max(range(k), key=lambda i: Q[i] + c * math.sqrt(math.log(t) / N[i]))`, then pull and update exactly as in ε-greedy.',
]

EXPLANATION = r"""
In the example, arm 1 always pays and arms 0 and 2 never do — yet at $t = 11, 12$ UCB tries them
again: their bonus $\sqrt{\ln t / 1}$ has grown with $t$ while arm 1's shrank with its 8 pulls.
Exploration never stops, but it happens **less and less** often (logarithmically).

What the tests show:

- **$c = 0$ is greedy after one pull per arm** and can lock onto the wrong arm: on `Bandit([0.6, 0.4])`
  (T = 500) it spends most pulls on the worse arm in 15 seeds out of 100; with $c = 1$, in none.
- **Directed exploration pays:** averaged over 50 random 5-armed bandits (T = 1000), UCB with
  $c = 0.5$ earns ≈ 98% of the best possible reward, ε-greedy (ε = 0.1) ≈ 94%, greedy ≈ 59%.
  Too much optimism also costs: $c = 2$ gives ≈ 88%.

MCTS faces this same dilemma at **every node**: which child deserves the next simulation?
UCB1 applied to trees is **UCT** (next problem).
"""

ENTRY = 'ucb_bandit'


def _ref(bandit, T, c):
    k = bandit.k
    Q, N, arms = [0.0] * k, [0] * k, []
    for t in range(1, T + 1):
        a = N.index(0) if 0 in N else max(range(k), key=lambda i: Q[i] + c * math.sqrt(math.log(t) / N[i]))
        r = bandit.pull(a)
        N[a] += 1
        Q[a] += (r - Q[a]) / N[a]
        arms.append(a)
    return arms


def _reward(bandit):
    return sum(r for _, r in bandit.history)


def _first_diff(got, want):
    if got == want:
        return True
    i = next((i for i, (x, y) in enumerate(zip(got, want)) if x != y), min(len(got), len(want)))
    return False, f'first difference at step t={i + 1}: expected {want[:i + 1]} …'


def _exact(probs, seed, T, c):
    return lambda got, b, *_: _first_diff(got, _ref(Bandit(probs, seed), T, c))


def _locks(sol, c, n=100):
    """Seeds (of n) where most of the 500 pulls go to the worse arm of Bandit([0.6, 0.4])."""
    return sum(sol.ucb_bandit(Bandit([0.6, 0.4], s), 500, c).count(1) > 250 for s in range(n))


def _vs_eps_greedy(sol, n=50, T=1000):
    ucb = eps = 0
    for s in range(n):
        rng = random.Random(100 + s)
        probs = [rng.random() for _ in range(5)]
        b = Bandit(probs, s)
        sol.ucb_bandit(b, T, 0.5)
        ucb += _reward(b) / (T * max(probs) * n)
        b, Q, N = Bandit(probs, s), [0.0] * 5, [0] * 5
        for _ in range(T):
            a = rng.randrange(5) if rng.random() < 0.1 else max(range(5), key=lambda i: Q[i])
            r = b.pull(a)
            N[a] += 1
            Q[a] += (r - Q[a]) / N[a]
        eps += _reward(b) / (T * max(probs) * n)
    return round(ucb, 3), round(eps, 3)


TESTS = [
    Test('example: exploration never stops', args=(Bandit([0.0, 1.0, 0.0]), 12, 1.0), check=_exact([0.0, 1.0, 0.0], 0, 12, 1.0),
         show='Bandit([0.0, 1.0, 0.0]), T=12, c=1'),
    Test('every arm is tried once first', args=(Bandit([0.9, 0.1, 0.5, 0.3], 5), 4, 2.0),
         expected=[0, 1, 2, 3], show='Bandit([0.9, 0.1, 0.5, 0.3]), T=4, c=2'),
    Test('c = 0: greedy after the first round', args=(Bandit([0.0, 1.0, 0.0]), 12, 0.0), check=_exact([0.0, 1.0, 0.0], 0, 12, 0.0),
         show='Bandit([0.0, 1.0, 0.0]), T=12, c=0'),
    Test('exact run on a random bandit', args=(Bandit([0.2, 0.5, 0.8], 1), 60, 1.0), check=_exact([0.2, 0.5, 0.8], 1, 60, 1.0),
         show='Bandit([0.2, 0.5, 0.8], seed=1), T=60, c=1'),
    Test('mostly pulls the best arm', args=(Bandit([0.2, 0.5, 0.8], 1), 2000, 1.0),
         check=lambda got, *_: (got.count(2) > 1700, f'best arm pulled {got.count(2)} times of 2000'),
         show='Bandit([0.2, 0.5, 0.8], seed=1), T=2000, c=1'),
    Test('c = 1 never locks onto the worse arm', call=lambda sol: _locks(sol, 1.0), expected=0,
         show='Bandit([0.6, 0.4], seed=0..99), T=500, c=1 -> runs that pull arm 1 most'),
    Test('UCB (c = 0.5) beats ε-greedy (ε = 0.1)', call=_vs_eps_greedy,
         check=lambda got: (got[0] > got[1], f'fraction of the best reward: UCB {got[0]}, ε-greedy {got[1]}'),
         show='50 random 5-armed bandits, T=1000 -> (UCB, ε-greedy)', timeout=10),
]
