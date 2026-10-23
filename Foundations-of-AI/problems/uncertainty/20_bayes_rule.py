from harness import Test

TITLE = "Bayes' rule and normalization"
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ["Bayes' rule", 'normalization', 'conditional independence', 'naive Bayes']

STATEMENT = r"""
Tables store the **causal** direction $P(\text{effect} \mid \text{cause})$; diagnosis needs the **diagnostic**
direction. Bayes' rule turns one into the other (AIMA §12.5):

$$P(h \mid e) = \frac{P(e \mid h)\,P(h)}{P(e)} \qquad\Longrightarrow\qquad \mathbf{P}(H \mid e) = \alpha\,\mathbf{P}(e \mid H)\,\mathbf{P}(H)$$

$\alpha = 1 / P(e)$ is just the constant that makes the result sum to 1, so we never need $P(e)$ explicitly.
With several pieces of evidence that are **conditionally independent given $H$**:
$\mathbf{P}(H \mid e_1, \dots, e_k) = \alpha\,\mathbf{P}(H) \prod_j \mathbf{P}(e_j \mid H)$ (naive Bayes).

Write `posterior(prior, *likelihoods)`:
- `prior`: `{h: P(h)}` over the values of the hypothesis variable $H$;
- each likelihood: `{h: P(e_j | h)}` for one observed piece of evidence $e_j$;
- returns `{h: P(h | e_1, ..., e_k)}` (same keys, sums to 1). With no likelihoods, the prior.

**Example (dentist, AIMA §12.5.2):** `posterior({True: 0.2, False: 0.8}, {True: 0.6, False: 0.1})` →
`{True: 0.6, False: 0.4}` = $\mathbf{P}(Cavity \mid toothache)$.
"""

STARTER = '''def posterior(prior: dict, *likelihoods: dict) -> dict:
    """P(H | e1, ..., ek) = alpha * P(H) * prod_j P(ej | H)."""
    unnormalized = dict(prior)
    # TODO: multiply in each likelihood, then normalize
    return unnormalized
'''

SOLUTION = '''def posterior(prior: dict, *likelihoods: dict) -> dict:
    """P(H | e1, ..., ek) = alpha * P(H) * prod_j P(ej | H)."""
    unnormalized = dict(prior)
    for lik in likelihoods:
        for h in unnormalized:
            unnormalized[h] *= lik[h]
    alpha = 1 / sum(unnormalized.values())
    return {h: alpha * p for h, p in unnormalized.items()}
'''

HINTS = [
    'Start from a copy of the prior; for each likelihood multiply every entry `h` by `lik[h]`.',
    'Normalize at the end: divide every entry by the sum of all entries. That sum is $P(e_1, \\dots, e_k)$.',
]

EXPLANATION = r"""
**Meningitis (AIMA §12.5.1):** $P(s \mid m) = 0.7$, $P(m) = 1/50000$, $P(s) = 0.01$, so
$P(m \mid s) = 0.7 \cdot 0.00002 / 0.01 = 0.0014$. A stiff neck makes meningitis 70 times more likely than
before, and it is still very unlikely: a small prior dominates. The causal number $P(s \mid m)$ is also the
**robust** one: during an epidemic $P(m)$ and $P(m \mid s)$ change, $P(s \mid m)$ does not.

**Normalization** avoids computing $P(e)$ separately: the unnormalized values are the joints
$P(h \wedge e)$, and their sum is $P(e)$ by marginalization. In the exams the denominator is written explicitly,
e.g. $P(k_1 \mid g_3, d_1) = \frac{P(g_3 \mid k_1, d_1) P(k_1)}{\sum_k P(g_3 \mid k, d_1) P(k)}$ (exam 12 Jul 2024).

**Combining evidence:** with toothache and catch, $\alpha \langle 0.6 \cdot 0.9 \cdot 0.2,\ 0.1 \cdot 0.2 \cdot 0.8 \rangle = \alpha \langle 0.108, 0.016 \rangle = \langle 0.871, 0.129 \rangle$, exactly the value of the full
joint table: in that table Toothache and Catch *are* conditionally independent given Cavity. If they were not,
multiplying the likelihoods would be the **naive Bayes** approximation.

**Zero likelihood:** in the flu network of 9 Feb 2023 an effective vaccine means no flu, so
$P(F = T \mid V = T) = 0$ and observing the flu gives $P(V = T \mid F = T) = 0$: one observation can rule a
hypothesis out completely.
"""

ENTRY = 'posterior'

_PM = 1 / 50000
_PS_NOT_M = (0.01 - 0.7 * _PM) / (1 - _PM)          # chosen so that P(s) = 0.01
_PG = {'g1': 0.2145, 'g2': 0.2689, 'g3': 0.5166}     # P(Grade) in the student network (6 Feb 2024, version A)
_PL1 = {'g1': 0.9, 'g2': 0.6, 'g3': 0.01}
_Z = sum(_PG[g] * _PL1[g] for g in _PG)


def _close(expected):
    def check(got, *args):
        if not isinstance(got, dict) or set(got) != set(expected):
            return False, f'Expected a dict with keys {sorted(expected, key=str)}.'
        bad = [h for h in expected if abs(got[h] - expected[h]) > 1e-6]
        return (not bad), ('' if not bad else f'Wrong value for {bad}.')
    return check


TESTS = [
    Test('dentist: P(Cavity | toothache)', args=({True: 0.2, False: 0.8}, {True: 0.6, False: 0.1}),
         check=_close({True: 0.6, False: 0.4})),
    Test('two pieces of evidence: P(Cavity | toothache, catch)',
         args=({True: 0.2, False: 0.8}, {True: 0.6, False: 0.1}, {True: 0.9, False: 0.2}),
         check=_close({True: 0.108 / 0.124, False: 0.016 / 0.124})),
    Test('meningitis: P(m | s) = 0.0014', args=({'m': _PM, 'not m': 1 - _PM}, {'m': 0.7, 'not m': _PS_NOT_M}),
         check=_close({'m': 0.0014, 'not m': 0.9986}), show="P(m) = 1/50000, P(s|m) = 0.7, P(s|¬m) such that P(s) = 0.01"),
    Test('no evidence: the prior', args=({'a': 0.25, 'b': 0.75},), check=_close({'a': 0.25, 'b': 0.75})),
    Test('uniform prior: normalized likelihood', args=({1: 0.5, 2: 0.5}, {1: 0.3, 2: 0.1}), check=_close({1: 0.75, 2: 0.25})),
    Test('three values: P(Grade | L1) in the student network', args=(_PG, _PL1),
         check=_close({g: _PG[g] * _PL1[g] / _Z for g in _PG}),
         show='prior P(G) = (0.2145, 0.2689, 0.5166), P(L1 | G) = (0.9, 0.6, 0.01)'),
    Test('zero likelihood rules a hypothesis out (flu, 9 Feb 2023)',
         args=({True: 0.8, False: 0.2}, {True: 0.0, False: 0.5}), check=_close({True: 0.0, False: 1.0}),
         show='P(V) = (0.8, 0.2), P(F=T | V) = (0, 0.5) -> P(V | F=T)'),
    Test('the prior is not modified', call=lambda sol: (lambda pr: (sol.posterior(pr, {0: 0.5, 1: 0.5}), pr)[1])({0: 0.4, 1: 0.6}),
         expected={0: 0.4, 1: 0.6}, show='prior after the call'),
]
