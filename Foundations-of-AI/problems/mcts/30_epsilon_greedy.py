import random

from harness import Test
from mcts_lib import Bandit

TITLE = 'ε-greedy on a k-armed bandit'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['bandits', 'ε-greedy', 'exploration', 'exploitation']

STATEMENT = r"""
**k-armed bandit** (slides p. 431): at each step $t$ the agent picks one of $k$ actions (arms),
receives a reward $R_t$ and wants to maximize $\sum_{t=1}^{T} R_t$. It does not know which arm is best:
it must **explore** to learn and **exploit** what it learned (slides p. 435–436).

**ε-greedy**: with probability ε pick a random arm, otherwise the arm with the highest estimate $Q(a)$.

Write `epsilon_greedy_bandit(bandit, T, epsilon, rng)` → the list of the `T` arms you pulled.
Follow this protocol exactly, so that seeded runs are reproducible:

```text
Q = [0.0] * k, N = [0] * k                       (k = bandit.k)
repeat T times:
    if rng.random() < epsilon:  a = rng.randrange(k)              # explore
    else:                       a = arm with max Q, lowest index on ties   # exploit
    r = bandit.pull(a)                           # 1 (win) or 0
    N[a] += 1;  Q[a] += (r - Q[a]) / N[a]        # incremental sample average
```

`Bandit(probs, seed)` (from `mcts_lib`) has `k` arms; arm `a` pays 1 with probability `probs[a]`.
"""

STARTER = '''from random import Random
from mcts_lib import Bandit

def epsilon_greedy_bandit(bandit: Bandit, T: int, epsilon: float, rng: Random) -> list[int]:
    """Play T steps of epsilon-greedy; return the list of arms pulled."""
    k = bandit.k
    Q, N, arms = [0.0] * k, [0] * k, []
    # TODO: T times: choose (explore or exploit), pull, update Q and N
    return arms
'''

SOLUTION = '''from random import Random
from mcts_lib import Bandit

def epsilon_greedy_bandit(bandit: Bandit, T: int, epsilon: float, rng: Random) -> list[int]:
    """Play T steps of epsilon-greedy; return the list of arms pulled."""
    k = bandit.k
    Q, N, arms = [0.0] * k, [0] * k, []
    for _ in range(T):
        if rng.random() < epsilon:
            a = rng.randrange(k)
        else:
            a = max(range(k), key=lambda i: Q[i])
        r = bandit.pull(a)
        N[a] += 1
        Q[a] += (r - Q[a]) / N[a]
        arms.append(a)
    return arms
'''

HINTS = [
    'Exactly one `rng.random()` per step, and `rng.randrange(k)` only when exploring — otherwise your run will not match the seeded test.',
    '`max(range(k), key=lambda i: Q[i])` returns the **first** arm with the highest estimate.',
    'After `r = bandit.pull(a)`: `N[a] += 1` and `Q[a] += (r - Q[a]) / N[a]` (the update of the previous problem).',
]

EXPLANATION = r"""
**Greedy gets stuck.** With $Q$ starting at 0, pure greedy (ε = 0) pulls arm 0, gets 0, and its
estimate stays 0 = the others' — it never tries arm 1, which pays every time. Exploitation alone
cannot discover what it has never tried: *exploration improves knowledge for long-term benefit,
exploitation uses it for short-term benefit* (slides p. 436).

With ε = 0.1 the agent keeps sampling every arm forever, so the estimates converge and the best arm is
exploited about $1 - \varepsilon + \varepsilon/k$ of the time. Averaged over 50 random 5-armed bandits
(T = 1000) greedy earns about 59% of the best possible reward, ε = 0.1 about 94%.

The weakness: ε-greedy explores **blindly** — an arm that has clearly lost is tried as often as a
promising, barely tested one. UCB (next problems) explores where the uncertainty is.
"""

ENTRY = 'epsilon_greedy_bandit'


def _ref(bandit, T, epsilon, rng):
    k = bandit.k
    Q, N, arms = [0.0] * k, [0] * k, []
    for _ in range(T):
        a = rng.randrange(k) if rng.random() < epsilon else max(range(k), key=lambda i: Q[i])
        r = bandit.pull(a)
        N[a] += 1
        Q[a] += (r - Q[a]) / N[a]
        arms.append(a)
    return arms


def _same_as_protocol(got, bandit, T, epsilon, rng):
    want = _ref(Bandit(bandit.probs, 3), T, epsilon, random.Random(7))
    if got == want:
        return True
    i = next((i for i, (x, y) in enumerate(zip(got, want)) if x != y), min(len(got), len(want)))
    return False, f'first difference at step {i}: expected {want[:i + 1]} … (one rng.random() per step, randrange(k) only when exploring)'


def _reward(bandit):
    return sum(r for _, r in bandit.history)


def _average(sol, epsilon, n=50, T=1000):
    total = 0
    for s in range(n):
        rng = random.Random(100 + s)
        probs = [rng.random() for _ in range(5)]
        b = Bandit(probs, seed=s)
        sol.epsilon_greedy_bandit(b, T, epsilon, rng)
        total += _reward(b) / (T * max(probs))
    return total / n


TESTS = [
    Test('greedy never tries the paying arm', args=(Bandit([0.0, 1.0]), 50, 0.0, random.Random(0)),
         check=lambda got, b, *_: got == [0] * 50 or (False, 'with Q = [0, 0] greedy always picks arm 0 (first max)'),
         show='Bandit([0.0, 1.0]), T=50, epsilon=0'),
    Test('ε = 0.1 finds it', args=(Bandit([0.0, 1.0]), 1000, 0.1, random.Random(1)),
         check=lambda got, b, *_: (len(got) == 1000 and _reward(b) >= 800, f'total reward {_reward(b)} of 1000'),
         show='Bandit([0.0, 1.0]), T=1000, epsilon=0.1 -> total reward'),
    Test('exact protocol (seeded)', args=(Bandit([0.2, 0.5, 0.8], 3), 20, 0.3, random.Random(7)),
         check=_same_as_protocol, show='Bandit([0.2, 0.5, 0.8], seed=3), T=20, epsilon=0.3, rng=Random(7)'),
    Test('ε = 1 is uniform exploration', args=(Bandit([0.5] * 4, 3), 4000, 1.0, random.Random(2)),
         check=lambda got, *_: (all(900 < got.count(a) < 1100 for a in range(4)), f'counts {[got.count(a) for a in range(4)]}'),
         show='Bandit([0.5] * 4), T=4000, epsilon=1 -> pulls per arm'),
    Test('ε = 0.1 beats greedy on 50 random bandits',
         call=lambda sol: (round(_average(sol, 0.0), 3), round(_average(sol, 0.1), 3)),
         check=lambda got: (got[1] > got[0] + 0.2, f'fraction of the best reward: greedy {got[0]}, ε=0.1 {got[1]}'),
         show='5 arms, T=1000 -> (greedy, ε-greedy) reward / best possible', timeout=10),
]
