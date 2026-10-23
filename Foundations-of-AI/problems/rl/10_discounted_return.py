from harness import Test

TITLE = 'Discounted return: what is a reward k steps away worth?'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['expected payoff', 'discount factor', 'return G_t']

STATEMENT = r"""
The agent maximizes the reward it receives **in the long run**. To keep the sum finite, future rewards are discounted
by $\gamma$, $0 < \gamma < 1$ (RL p. 30):

$$G_t = r_{t+1} + \gamma r_{t+2} + \gamma^2 r_{t+3} + \dots = \sum_{k=0}^{\infty} \gamma^k r_{t+k+1}$$

Write `discounted_return(rewards, gamma)`: `rewards` is the list $[r_{t+1}, r_{t+2}, \dots]$ received in an episode
(the episode ends after the last one); return $G_t$.

**Example:** in the 3×3 grid of the exam of 30 August 2022 the agent goes north from (2,3) and then south twice: the
rewards are 0, 0, 1 and with $\gamma = 0.5$ the return is $0 + 0.5 \cdot 0 + 0.25 \cdot 1 = 0.25$.
"""

STARTER = '''def discounted_return(rewards: list[float], gamma: float) -> float:
    """G_t = sum over k of gamma**k * rewards[k]  (rewards[0] is r_{t+1})."""
    # TODO
    return 0.0
'''

SOLUTION = '''def discounted_return(rewards: list[float], gamma: float) -> float:
    """G_t = sum over k of gamma**k * rewards[k]  (rewards[0] is r_{t+1})."""
    return sum(gamma ** k * r for k, r in enumerate(rewards))
'''

HINTS = [
    'The first reward, $r_{t+1}$, is multiplied by $\\gamma^0 = 1$: it is not discounted.',
    '`enumerate(rewards)` gives the exponent `k` together with each reward.',
    '`sum(gamma ** k * r for k, r in enumerate(rewards))`',
]

EXPLANATION = r"""
A reward $k$ steps in the future is worth $\gamma^k$ of the same reward now. With $\gamma$ close to 0 the agent is
short-sighted, close to 1 it is far-sighted. Since every term is at most $R_{max}\gamma^k$, the geometric series gives
the bound of RL p. 30:

$$\mathbb{E}[G_t] \le R_{max}\,(1 + \gamma + \gamma^2 + \dots) = R_{max}\frac{1}{1-\gamma}$$

**Both reward designs prefer short paths.** With **goal-reward** (1 at the goal) a path of $d$ steps returns
$\gamma^{d-1}$, larger when $d$ is small. With **action-penalty** (−1 per step, 0 entering the goal) it returns
$-(1 + \gamma + \dots + \gamma^{d-2})$, closer to 0 when $d$ is small. The values of the 2026 exam mazes (−1, −1.5,
−1.75 with $\gamma = 0.5$) are exactly these sums.

The **value** of a state, $V(s_t) = \mathbb{E}[G_t]$ (exam 6 Feb 2026), is this quantity in expectation: the
environment or the policy may be stochastic, so the same state can be followed by different reward sequences.
"""

ENTRY = 'discounted_return'

TESTS = [
    Test('exam 30 Aug 2022: north then south twice, gamma = 0.5', args=([0, 0, 1], 0.5), expected=0.25),
    Test('a single reward is not discounted', args=([1], 0.9), expected=1.0),
    Test('action penalty, 3 steps (exam 11 Jun 2026)', args=([-1, -1, 0], 0.5), expected=-1.5),
    Test('action penalty, 4 steps (exam 11 Jun 2026)', args=([-1, -1, -1, 0], 0.5), expected=-1.75),
    Test('empty episode', args=([], 0.9), expected=0.0),
    Test('long episode approaches R_max / (1 - gamma)', args=([1] * 200, 0.9),
         check=lambda got, *a: (abs(got - 10) < 1e-6, f'got {got}, expected about 10 = 1 / (1 - 0.9)')),
    Test('gamma = 0.95, goal reached after 19 steps (RL p. 48)', args=([0] * 18 + [1], 0.95), expected=0.95 ** 18),
]
