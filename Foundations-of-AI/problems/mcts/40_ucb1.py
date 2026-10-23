import math

from harness import Test

TITLE = 'UCB1: optimism in the face of uncertainty'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['UCB1', 'UCT', 'exploration term', 'confidence bound']

STATEMENT = r"""
Instead of exploring blindly, be **optimistic in the face of uncertainty**: score each option by an
**upper confidence bound** on its value and pick the highest (slides p. 437–445). For a node $n$ of
the MCTS tree:

$$\text{UCB1}(n) = \underbrace{\frac{U(n)}{N(n)}}_{\text{exploitation}} + \underbrace{C \cdot \sqrt{\frac{\log N(\text{Parent}(n))}{N(n)}}}_{\text{exploration}}$$

- $U(n)$: utility of $n$ (number of wins), $N(n)$: number of simulations involving $n$,
  $N(\text{Parent}(n))$: number of simulations involving its parent, $C$: exploration parameter.
- $\log$ is the **natural** logarithm (`math.log`): on slide p. 442,
  $\sqrt{\ln 10000 / 10} = 0.960$.
- A node never tried ($N(n) = 0$) has an infinite bound: return `math.inf`.

Write `ucb1(U, N, N_parent, C)`.

**Example (step-by-step example, slide p. 446, $C = 1$):** root 2/4 with children
$a_1$ = 2/3 and $a_2$ = 0/1 → `ucb1(2, 3, 4, 1)` ≈ 1.3464 and `ucb1(0, 1, 4, 1)` ≈ 1.1774: selection goes to $a_1$.
"""

STARTER = '''import math

def ucb1(U: float, N: int, N_parent: int, C: float) -> float:
    """UCB1(n) = U/N + C * sqrt(log(N_parent) / N); infinite if the node was never tried."""
    # TODO
    return 0.0
'''

SOLUTION = '''import math

def ucb1(U: float, N: int, N_parent: int, C: float) -> float:
    """UCB1(n) = U/N + C * sqrt(log(N_parent) / N); infinite if the node was never tried."""
    if N == 0:
        return math.inf
    return U / N + C * math.sqrt(math.log(N_parent) / N)
'''

HINTS = [
    'Two terms: the average reward `U / N`, plus a bonus that is large when `N` is small compared to `N_parent`.',
    'Handle `N == 0` first (return `math.inf`), otherwise you divide by zero.',
    '`return U / N + C * math.sqrt(math.log(N_parent) / N)` — `math.log` is the natural log.',
]

EXPLANATION = r"""
The exploration term is the width of a confidence interval: it **shrinks** as $N(n)$ grows
(slide p. 442, $c\sqrt{\ln 10000 / N}$ = $0.960c$, $0.303c$, $0.096c$, $0.043c$ for
$N$ = 10, 100, 1000, 5000) and **grows slowly** (logarithmically) while the parent is visited and $n$
is not. So a neglected option is eventually re-tried, but more and more rarely: exploration never
stops completely, yet it costs only $O(\log t)$ pulls of each bad option.

- $C = 0$: pure exploitation (greedy). $C \to \infty$: pure exploration (slides p. 445).
- $C = \sqrt{2}$ is the theoretical choice for rewards in $[0, 1]$; in practice $C$ is tuned.
- In the slides' example $a_1$ (2/3) beats $a_2$ (0/1) with $C = 1$, but with $C = \sqrt2$
  $a_2$ wins (1.665 > 1.629): the less-explored node gets its chance.
"""

ENTRY = 'ucb1'

TESTS = [
    Test('step-by-step example, a1 = 2/3 under 2/4, C = 1', args=(2, 3, 4, 1), expected=2 / 3 + math.sqrt(math.log(4) / 3)),
    Test('step-by-step example, a2 = 0/1 under 2/4, C = 1', args=(0, 1, 4, 1), expected=math.sqrt(math.log(4))),
    Test('slide p. 442: N = 10 of 10000', args=(0, 10, 10000, 1),
         check=lambda got, *a: (abs(got - 0.960) < 5e-4, 'expected 0.960 — natural log!' if abs(got - 0.960) >= 5e-4 else '')),
    Test('slide p. 442: N = 5000 of 10000', args=(0, 5000, 10000, 1),
         check=lambda got, *a: (abs(got - 0.043) < 5e-4, 'expected 0.043 — natural log!' if abs(got - 0.043) >= 5e-4 else '')),
    Test('C = 0 is pure exploitation', args=(3, 4, 100, 0), expected=0.75),
    Test('C = sqrt(2) favours the less explored a2', args=(0, 1, 4, math.sqrt(2)), expected=math.sqrt(2 * math.log(4))),
    Test('never tried: infinite', args=(0, 0, 7, 1.4), expected=math.inf),
    Test('Figure 6.10: the 60/79 child of 37/100, C = sqrt(2)', args=(60, 79, 100, math.sqrt(2)),
         expected=60 / 79 + math.sqrt(2 * math.log(100) / 79)),
]
