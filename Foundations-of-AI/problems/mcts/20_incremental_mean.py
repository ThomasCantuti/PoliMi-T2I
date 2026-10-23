import random

from harness import Test

TITLE = 'Action values: incremental sample average'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['bandits', 'action value', 'sample average', 'incremental update']

STATEMENT = r"""
A bandit agent must learn how much it can expect from each action, the **action value**
$Q^*(a) = \mathbb{E}[R_t \mid A_t = a]$ (slides p. 434). The **sample-average** estimate is the mean
of the rewards received so far — and it can be computed **incrementally**, in $O(1)$ time and
memory per reward:

$$Q_{t+1} = Q_t + \frac{1}{t}\,(R_t - Q_t) \qquad\qquad Q_{t+1} = Q_t + \alpha\,(R_t - Q_t),\ \alpha \in [0, 1]$$

Write `estimates(rewards, alpha=None)` → the list $[Q_2, Q_3, \dots, Q_{n+1}]$ of the estimates after
each reward of one action, starting from $Q_1 = 0$:

- `alpha=None` → step size $1/t$ (exact sample average);
- a number → constant step size $\alpha$ (a *recency-weighted* average).

**Example:** `estimates([1, 0, 1, 1])` → `[1.0, 0.5, 0.666…, 0.75]`;
`estimates([1, 1, 1, 1], alpha=0.5)` → `[0.5, 0.75, 0.875, 0.9375]`.

Do not re-sum the whole list at every step: one test has 200 000 rewards.
"""

STARTER = '''def estimates(rewards: list[float], alpha: float | None = None) -> list[float]:
    """Estimates Q after each reward, starting from Q = 0.
    alpha=None: step 1/t (sample average); otherwise constant step alpha."""
    Q, out = 0.0, []
    # TODO: one update per reward
    return out
'''

SOLUTION = '''def estimates(rewards: list[float], alpha: float | None = None) -> list[float]:
    """Estimates Q after each reward, starting from Q = 0.
    alpha=None: step 1/t (sample average); otherwise constant step alpha."""
    Q, out = 0.0, []
    for t, R in enumerate(rewards, start=1):
        step = 1 / t if alpha is None else alpha
        Q += step * (R - Q)
        out.append(Q)
    return out
'''

HINTS = [
    'Read the update as: new estimate = old estimate + step size × (target − old estimate). $R_t - Q_t$ is the *error* of the old estimate.',
    'Number the rewards from $t = 1$: `for t, R in enumerate(rewards, start=1)`.',
    'Inside the loop: `step = 1 / t if alpha is None else alpha`, then `Q += step * (R - Q)` and append `Q`.',
]

EXPLANATION = r"""
**Why $1/t$ gives the exact mean.** If $Q_t$ is the mean of the first $t-1$ rewards, then
$Q_t + \frac1t(R_t - Q_t) = \frac{(t-1)Q_t + R_t}{t}$, the mean of the first $t$ rewards. Only $Q$
and $t$ are stored — this is exactly how MCTS keeps $U(n)$ and $N(n)$ in each node.

**Constant $\alpha$** weights the reward received $k$ steps ago by $\alpha(1-\alpha)^k$: recent rewards
count more. It never fully converges but **tracks** a changing (non-stationary) reward: after 100
zeros and 100 ones, $\alpha = 0.1$ says ≈ 1.0, the sample average still says 0.5. It is also biased
by the initial value $Q_1$ (with all rewards 1, $\alpha = 0.5$ gives 0.5, 0.75, 0.875, …).
"""

ENTRY = 'estimates'

_rng = random.Random(434)
_FLOATS = [round(_rng.uniform(-5, 5), 3) for _ in range(50)]
_SHIFT = [0] * 100 + [1] * 100
_LONG = [_rng.randint(0, 1) for _ in range(200_000)]


def _prefix_means(rewards):
    out, s = [], 0
    for t, r in enumerate(rewards, start=1):
        s += r
        out.append(s / t)
    return out


TESTS = [
    Test('sample average (example)', args=([1, 0, 1, 1],), expected=[1.0, 0.5, 2 / 3, 0.75]),
    Test('equals the mean of the rewards so far', args=(_FLOATS,), expected=_prefix_means(_FLOATS),
         show='50 random rewards in [-5, 5]'),
    Test('constant alpha = 0.5 (example)', args=([1, 1, 1, 1], 0.5), expected=[0.5, 0.75, 0.875, 0.9375]),
    Test('alpha = 1 forgets everything but the last reward', args=([3, 7, 2], 1.0), expected=[3, 7, 2]),
    Test('alpha = 0 never moves', args=([3, 7, 2], 0.0), expected=[0, 0, 0]),
    Test('non-stationary: sample average is stuck at 0.5', args=(_SHIFT,),
         check=lambda got, r: abs(got[-1] - 0.5) < 1e-9 or (False, f'last estimate {got[-1]}'),
         show='100 zeros then 100 ones, alpha=None -> last estimate'),
    Test('non-stationary: alpha = 0.1 tracks the change', args=(_SHIFT, 0.1),
         check=lambda got, r, a: got[-1] > 0.99 or (False, f'last estimate {got[-1]}'),
         show='100 zeros then 100 ones, alpha=0.1 -> last estimate'),
    Test('O(1) per reward', args=(_LONG,), check=lambda got, r: abs(got[-1] - sum(r) / len(r)) < 1e-9,
         show='200 000 rewards (re-summing the list each time is too slow)', timeout=3),
    Test('no rewards', args=([],), expected=[]),
]
