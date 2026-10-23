from harness import Test
from uncertainty_lib import burglary, dentist, student, all_events, DENTIST_VARIABLES, DENTIST_JOINT

TITLE = 'Bayesian networks: the chain rule'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['Bayesian network', 'chain rule', 'CPT', 'joint probability']

STATEMENT = r"""
A Bayesian network defines the full joint distribution as the product of its conditional probability tables
(AIMA §13.2; exam 6 Feb 2024, Question 2):

$$P(X_1, \dots, X_n) = \prod_i P(X_i \mid \text{Parents}_G(X_i))$$

A network is a dict `{variable: (parents, cpt)}`: `parents` is a tuple of names, `cpt` maps the tuple of the
parents' values (`()` for a root) to a row `{value: probability}`. Burglary network (AIMA Figure 13.2):

```python
net['Alarm'] = (('Burglary', 'Earthquake'),
                {(True, True): {True: 0.95, False: 0.05}, (True, False): {True: 0.94, False: 0.06},
                 (False, True): {True: 0.29, False: 0.71}, (False, False): {True: 0.001, False: 0.999}})
net['Burglary'] = ((), {(): {True: 0.001, False: 0.999}})
```

Write
- `cond_prob(net, X, x, event)` → $P(X = x \mid \text{parents of } X)$, the parents' values read from `event`;
- `joint_prob(net, event)` → the probability of a **complete** event (every variable has a value).

**Example:** $P(j, m, a, \neg b, \neg e) = 0.90 \cdot 0.70 \cdot 0.001 \cdot 0.999 \cdot 0.998 = 0.000628$.
"""

STARTER = '''def cond_prob(net: dict, X: str, x, event: dict) -> float:
    """P(X = x | parents(X)), with the parents' values taken from event."""
    parents, cpt = net[X]
    # TODO: build the key of the CPT row from the parents' values
    return 0.0

def joint_prob(net: dict, event: dict) -> float:
    """P(x1, ..., xn) = prod_i P(xi | parents(Xi)) for a complete event."""
    p = 1.0
    # TODO
    return p
'''

SOLUTION = '''def cond_prob(net: dict, X: str, x, event: dict) -> float:
    """P(X = x | parents(X)), with the parents' values taken from event."""
    parents, cpt = net[X]
    return cpt[tuple(event[P] for P in parents)][x]

def joint_prob(net: dict, event: dict) -> float:
    """P(x1, ..., xn) = prod_i P(xi | parents(Xi)) for a complete event."""
    p = 1.0
    for X in net:
        p *= cond_prob(net, X, event[X], event)
    return p
'''

HINTS = [
    'The CPT row key is the tuple of the parents\' values **in the order of `parents`**: '
    '`tuple(event[P] for P in parents)`. A root has `parents == ()`, so its key is `()`.',
    '`cpt[key]` is a dict `{value: probability}`: index it with `x`.',
    '`joint_prob`: one factor per variable, `for X in net: p *= cond_prob(net, X, event[X], event)`.',
]

EXPLANATION = r"""
**Why a product?** The general chain rule $P(x_1, \dots, x_n) = \prod_i P(x_i \mid x_{i-1}, \dots, x_1)$ holds
for any distribution. A network orders its variables so that parents come first and **claims** that each
variable is conditionally independent of its other predecessors given its parents, so every factor shrinks to
$P(x_i \mid parents(X_i))$.

**Compactness:** the dentist network Cavity → Toothache, Cavity → Catch needs $1 + 2 + 2 = 5$ numbers and
reproduces all 8 entries of the full joint table (7 free numbers); the burglary network needs 10 instead of 31.
With 30 boolean variables and at most 5 parents: 960 instead of more than a billion.

**Exam habit:** write the symbolic product first, one factor per node, then substitute. For "False" values
take $1 - p$ **of the same row**: $P(\neg a \mid \neg b, \neg e) = 1 - 0.001 = 0.999$.
"""

ENTRY = 'joint_prob'

T, F = True, False
_B = burglary()
_D = dentist()
_S = student()


def _dentist_table(sol):
    worst = 0.0
    for row, p in DENTIST_JOINT.items():
        worst = max(worst, abs(sol.joint_prob(_D, dict(zip(DENTIST_VARIABLES, row))) - p))
    return worst < 1e-12


def _sums_to_one(net):
    return lambda sol: round(sum(sol.joint_prob(net, e) for e in all_events(net)), 9)


# A network whose dict lists a child before its parent: the order of the dict must not matter.
_REVERSED = {'Toothache': _D['Toothache'], 'Catch': _D['Catch'], 'Cavity': _D['Cavity']}

TESTS = [
    Test('cond_prob: a root', call=lambda sol: sol.cond_prob(_B, 'Burglary', F, {'Burglary': F}), expected=0.999,
         show="cond_prob(burglary, 'Burglary', False, ...)"),
    Test('cond_prob: two parents', call=lambda sol: sol.cond_prob(_B, 'Alarm', F, {'Burglary': T, 'Earthquake': F, 'Alarm': F}),
         expected=0.06, show="cond_prob(burglary, 'Alarm', False, {Burglary: T, Earthquake: F})"),
    Test('AIMA: P(j, m, a, ¬b, ¬e) = 0.000628',
         args=(_B, {'JohnCalls': T, 'MaryCalls': T, 'Alarm': T, 'Burglary': F, 'Earthquake': F}),
         expected=0.9 * 0.7 * 0.001 * 0.999 * 0.998, show='burglary: j, m, a, ¬b, ¬e'),
    Test('burglary: everything false', args=(_B, {X: F for X in _B}), expected=0.95 * 0.99 * 0.999 * 0.999 * 0.998,
         show='burglary: all False'),
    Test('dentist network reproduces the full joint table', call=_dentist_table, expected=True,
         show='all 8 rows of AIMA Figure 12.3'),
    Test('order of the dict does not matter', args=(_REVERSED, {'Cavity': T, 'Toothache': T, 'Catch': F}),
         expected=0.012, show='children listed before the parent: P(toothache, ¬catch, cavity)'),
    Test('student network, multi-valued Grade',
         args=(_S, {'Difficulty': 'd1', 'Knowledge': 'k1', 'Grade': 'g1', 'Letter': 'L1', 'Test': 's1'}),
         expected=0.9 * 0.3 * 0.5 * 0.9 * 0.8, show='P(d1, k1, g1, L1, s1)'),
    Test('student network: the 48 joint entries sum to 1', call=_sums_to_one(_S), expected=1.0),
]
