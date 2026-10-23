TITLE = 'Predict the UCB choices of a 3-armed bandit'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['k-armed bandit', 'UCB', 'exploration vs exploitation']

STATEMENT = r"""
Three treatments (slide p. 432), i.e. a **3-armed bandit** with rewards 1 (success) or 0. The agent uses
**UCB action selection** (slides p. 440–441):

$$a_t = \arg\max_a \Big( Q_t(a) + c\sqrt{\frac{\ln t}{N_t(a)}} \Big), \qquad c = 1$$

**Conventions:**

- $Q(a)$ is the sample average of the rewards of arm $a$ (it starts at 0);
- $t$ = number of pulls made **so far** (the same quantity as $N(\text{Parent})$ in UCB1 for trees);
- an arm with $N(a) = 0$ has an infinite bound, so every arm is pulled once first (this first round is
  played for you);
- ties go to the **lowest-numbered** arm.

Then predict the next 10 arms UCB pulls: click an arm. $Q$ and $N$ of every arm are shown; the bounds are
hidden until you answer.
"""

HINTS = [
    'Compute the bonus c·√(ln t / N) for each arm first: it is the same for arms with the same N.',
    'An arm that keeps paying 0 still gets pulled again eventually: its bonus grows like √(ln t) while N stays the same.',
    'When two arms have identical Q and N, the tie goes to the lower arm number.',
]

EXPLANATION = r"""
After the first round ($Q = 0, 0, 1$) UCB exploits arm 3 while its bound stays the largest
($1 + \sqrt{\ln 3/1} = 2.05$, then $1 + \sqrt{\ln 4/2} = 1.83$, …). Two failures bring $Q(3)$ down to 0.5;
at $t = 6$ the untouched arms 1 and 2 have the bound $0 + \sqrt{\ln 6} = 1.34 > 0.5 + \sqrt{\ln 6/4} = 1.17$,
so UCB **explores** them again (arm 1 by the tie rule, then arm 2). Arm 2 pays this time and earns one more
pull; then arm 3 — whose true mean is the highest, 0.8 — takes over.

This is *optimism in the face of uncertainty*: the exploration term shrinks as $1/\sqrt{N(a)}$ for the
arm you pull, but grows (slowly, as $\sqrt{\ln t}$) for the arms you neglect, so no arm is abandoned
for ever — unlike greedy, and without the blind random choices of ε-greedy.
"""

VIZ = 'bandit'
CONFIG = {'arms': [0.2, 0.5, 0.8], 'seed': 5, 'c': 1, 'policy': 'ucb', 'predictSteps': 10}
