from harness import Test
from uncertainty_lib import burglary, dentist, student, flu, heart

TITLE = 'Inference by enumeration'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['inference by enumeration', 'marginalization', 'normalization', 'Bayesian network']

STATEMENT = r"""
To answer a query $\mathbf{P}(X \mid e)$, sum the joint over the **hidden** variables $Y$ (neither queried nor
observed), computing each joint term with the chain rule, then normalize (AIMA §13.3.1):

$$\mathbf{P}(X \mid e) = \alpha\,\mathbf{P}(X, e) = \alpha \sum_y \mathbf{P}(X, e, y)
= \alpha \sum_y \prod_i P(\cdot \mid parents)$$

```text
function ENUMERATION-ASK(X, e, bn) returns a distribution over X
    Q(X) <- a distribution over X, initially empty
    for each value xi of X do
        Q(xi) <- ENUMERATE-ALL(bn.VARS, e extended with X = xi)
    return NORMALIZE(Q(X))

function ENUMERATE-ALL(vars, e) returns a real number        # vars in topological order
    if EMPTY?(vars) then return 1.0
    V <- FIRST(vars)
    if V has value v in e then return P(v | parents(V)) * ENUMERATE-ALL(REST(vars), e)
    else return SUM over v of P(v | parents(V)) * ENUMERATE-ALL(REST(vars), e extended with V = v)
```

Write `enumeration_ask(X, evidence, net)` → `{x: P(X = x | evidence)}` (normalized). Networks use the format of
the previous problem; `values(net, Y)` (the domain of `Y`) and `joint_prob(net, event)` (the chain rule) are
given. The dict of a network is **not** necessarily in topological order: either sort it, or simply enumerate
every combination of the hidden variables (`itertools.product`) and call `joint_prob`.

**Example (AIMA):** `enumeration_ask('Burglary', {'JohnCalls': True, 'MaryCalls': True}, burglary())` →
`{True: 0.284, False: 0.716}` (rounded).
"""

STARTER = '''import itertools
from uncertainty_lib import values, joint_prob

def enumeration_ask(X: str, evidence: dict, net: dict) -> dict:
    """P(X | evidence) as {x: probability}, by enumeration of the hidden variables."""
    hidden = [Y for Y in net if Y != X and Y not in evidence]
    Q = {}
    for x in values(net, X):
        Q[x] = 0.0
        # TODO: add joint_prob(...) for every combination of values of the hidden variables
    return Q          # TODO: normalize
'''

SOLUTION = '''import itertools
from uncertainty_lib import values, joint_prob

def enumeration_ask(X: str, evidence: dict, net: dict) -> dict:
    """P(X | evidence) as {x: probability}, by enumeration of the hidden variables."""
    hidden = [Y for Y in net if Y != X and Y not in evidence]
    Q = {}
    for x in values(net, X):
        Q[x] = 0.0
        for combo in itertools.product(*(values(net, Y) for Y in hidden)):
            event = {**evidence, X: x, **dict(zip(hidden, combo))}
            Q[x] += joint_prob(net, event)
    alpha = 1 / sum(Q.values())
    return {x: alpha * q for x, q in Q.items()}
'''

HINTS = [
    '`itertools.product(*(values(net, Y) for Y in hidden))` yields one tuple of values per combination of the hidden '
    'variables (a single empty tuple if there are none).',
    'Each combination plus the evidence plus `X = x` is a **complete** event: add `joint_prob(net, event)` to `Q[x]`.',
    'Normalize at the end: `alpha = 1 / sum(Q.values())`. The sum is $P(e)$.',
]

EXPLANATION = r"""
**Burglary, AIMA §13.3.1:**
$$P(b \mid j, m) = \alpha \sum_e \sum_a P(b)\,P(e)\,P(a \mid b, e)\,P(j \mid a)\,P(m \mid a)$$
$P(b, j, m) = 0.00059224$, $P(\neg b, j, m) = 0.0014919$, so $\mathbf{P}(B \mid j, m) = \langle 0.284, 0.716 \rangle$. Two calls make a burglary 284 times more likely than its prior 0.001, and it is still less likely
than not: false alarms (0.001 per day, but $\neg b$ is very likely) dominate.

**Cost:** the hidden-variable sum has $2^{h}$ terms of $n$ factors each: $O(n 2^n)$ as written, $O(2^n)$ with
AIMA's depth-first ENUMERATE-ALL (which moves each factor out of the sums that do not depend on it), and linear
space. Exact inference in general networks is NP-hard; the course only needs small networks.

**Exam shortcut:** unobserved leaves outside the query sum to 1 and can be dropped before computing:
$\sum_{bp} P(bp \mid hd) = 1$ in the heart network, $\sum_s P(s \mid k) = 1$ in the student network. Enumeration
does not know this and still works, it just does useless work.

**Reading the results:** $P(V = T \mid F = T) = 0$ in the flu network of 9 Feb 2023: if the vaccine works you
cannot get the flu, so having it proves the vaccine failed (evidential reasoning). $P(L_1) = 0.360$ (no evidence)
is the marginal asked on 6 Feb 2024; $P(k_1 \mid g_3, d_1) = 0.109$ is the posterior of 12 Jul 2024.
"""

ENTRY = 'enumeration_ask'

T, F = True, False


def _dist(expected, tol=1e-6):
    def check(got, X, evidence, net):
        if not isinstance(got, dict) or set(got) != set(expected):
            return False, f'Expected a dict with keys {sorted(expected, key=str)}.'
        bad = [x for x in expected if abs(got[x] - expected[x]) > tol]
        return (not bad), ('' if not bad else 'Wrong probability for ' + ', '.join(map(str, bad)) +
                           '. Did you normalize? Did you sum over every hidden variable?')
    return check


_P_BJM = 0.00059224259
_P_NBJM = 0.001491857649

TESTS = [
    Test('AIMA: P(Burglary | j, m)', args=('Burglary', {'JohnCalls': T, 'MaryCalls': T}, burglary()),
         check=_dist({T: _P_BJM / (_P_BJM + _P_NBJM), F: _P_NBJM / (_P_BJM + _P_NBJM)}), show="'Burglary', {j, m}, burglary"),
    Test('P(Earthquake | j, m)', args=('Earthquake', {'JohnCalls': T, 'MaryCalls': T}, burglary()),
         check=_dist({T: 0.176067, F: 0.823933}), show="'Earthquake', {j, m}, burglary"),
    Test('no evidence: P(JohnCalls)', args=('JohnCalls', {}, burglary()), check=_dist({T: 0.0521390, F: 0.9478610}),
         show="'JohnCalls', {}, burglary"),
    Test('explaining away: P(Burglary | a, e)', args=('Burglary', {'Alarm': T, 'Earthquake': T}, burglary()),
         check=_dist({T: 0.0032684, F: 0.9967316}), show="'Burglary', {a, e}, burglary"),
    Test('dentist: P(Cavity | toothache)', args=('Cavity', {'Toothache': T}, dentist()), check=_dist({T: 0.6, F: 0.4}),
         show="'Cavity', {toothache}, dentist"),
    Test('flu (9 Feb 2023, A): P(V | F = True)', args=('V', {'F': T}, flu('A')), check=_dist({T: 0.0, F: 1.0}),
         show="'V', {F: True}, flu A"),
    Test('student (6 Feb 2024, A): P(Letter)', args=('Letter', {}, student()), check=_dist({'L0': 0.640444, 'L1': 0.359556}),
         show="'Letter', {}, student"),
    Test('student (12 Jul 2024): P(Knowledge | g3, d1)', args=('Knowledge', {'Grade': 'g3', 'Difficulty': 'd1'}, student()),
         check=_dist({'k0': 0.441 / 0.495, 'k1': 0.054 / 0.495}), show="'Knowledge', {g3, d1}, student"),
    Test('three values: P(Grade | L1)', args=('Grade', {'Letter': 'L1'}, student()),
         check=_dist({'g1': 0.19305 / 0.359556, 'g2': 0.16134 / 0.359556, 'g3': 0.005166 / 0.359556}),
         show="'Grade', {L1}, student"),
    Test('heart (16 Jan 2025): P(HD)', args=('HD', {}, heart()), check=_dist({'yes': 0.49, 'no': 0.51}),
         show="'HD', {}, heart"),
]
