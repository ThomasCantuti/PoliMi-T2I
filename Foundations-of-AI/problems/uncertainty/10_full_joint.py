from harness import Test
from uncertainty_lib import DENTIST_VARIABLES, DENTIST_JOINT

TITLE = 'Full joint distribution: marginalization and conditioning'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['probability', 'full joint distribution', 'marginalization', 'conditioning']

STATEMENT = r"""
A **full joint distribution** gives the probability of every possible world; every other probability follows
from it with two operations (AIMA §12.3):

- **marginalization**: sum the rows that agree with the event,
  $P(X = x_i) = \sum_j P(X = x_i \wedge Y = y_j)$ (exam 6 Feb 2024, Question 1);
- **conditioning**: $P(a \mid b) = \dfrac{P(a \wedge b)}{P(b)}$, a ratio of two marginals.

The distribution is given as `variables` (a tuple of names) and `joint` (a dict from a tuple of values, one per
variable **in that order**, to its probability). Events are partial assignments `{name: value}`.

Write `prob(variables, joint, event, given=None)` → $P(event \mid given)$ (just $P(event)$ when `given` is
`None` or empty).

The dentist table (AIMA Figure 12.3), `variables = ('Toothache', 'Catch', 'Cavity')`:

| | toothache, catch | toothache, ¬catch | ¬toothache, catch | ¬toothache, ¬catch |
|---|---|---|---|---|
| **cavity** | 0.108 | 0.012 | 0.072 | 0.008 |
| **¬cavity** | 0.016 | 0.064 | 0.144 | 0.576 |

**Example:** `prob(V, J, {'Cavity': True})` → 0.2;
`prob(V, J, {'Cavity': True}, {'Toothache': True})` → $0.12 / 0.2 = 0.6$.
"""

STARTER = '''def matches(variables: tuple, row: tuple, event: dict) -> bool:
    """Does the row (one value per variable, in the order of `variables`) agree with the partial event?"""
    # TODO
    return False

def prob(variables: tuple, joint: dict, event: dict, given: dict | None = None) -> float:
    """P(event | given) from the full joint distribution."""
    given = given or {}
    # TODO: P(event and given) / P(given), each one a sum of matching rows
    return 0.0
'''

SOLUTION = '''def matches(variables: tuple, row: tuple, event: dict) -> bool:
    """Does the row (one value per variable, in the order of `variables`) agree with the partial event?"""
    return all(row[variables.index(X)] == x for X, x in event.items())

def prob(variables: tuple, joint: dict, event: dict, given: dict | None = None) -> float:
    """P(event | given) from the full joint distribution."""
    given = given or {}
    both = sum(p for row, p in joint.items() if matches(variables, row, event) and matches(variables, row, given))
    p_given = sum(p for row, p in joint.items() if matches(variables, row, given))
    return both / p_given
'''

HINTS = [
    'A row agrees with an event if, for every `(X, x)` in the event, the value in position `variables.index(X)` is `x`.',
    '$P(event)$ = sum of `p` over the rows that agree with the event (marginalization). The empty event agrees with '
    'every row, so $P(\\{\\}) = 1$.',
    '$P(event \\mid given)$: numerator = rows that agree with **both** the event and the evidence; denominator = rows '
    'that agree with the evidence. Do not merge the two dicts: `{Cavity: True}` given `{Cavity: False}` must give 0.',
]

EXPLANATION = r"""
**Marginalization** sums out the variables that are not mentioned: $P(cavity) = 0.108 + 0.012 + 0.072 + 0.008 = 0.2$. **Conditioning** is a ratio of two marginals:
$$P(cavity \mid toothache) = \frac{P(cavity \wedge toothache)}{P(toothache)} = \frac{0.108 + 0.012}{0.2} = 0.6 .$$
The denominator is the same for every value of the query variable, which is why AIMA writes
$\mathbf{P}(Cavity \mid toothache) = \alpha \langle 0.12, 0.08 \rangle = \langle 0.6, 0.4 \rangle$: compute the
unnormalized numbers and divide by their sum.

**Independence checks** come for free: $P(toothache \wedge catch) = 0.124$ but $P(toothache)\,P(catch) = 0.2 \cdot 0.34 = 0.068$, so they are dependent; given the cavity, $P(toothache \wedge catch \mid cavity) = 0.54 = 0.6 \cdot 0.9$: conditionally independent.

**Why we need more than this.** The table has $2^n$ rows for $n$ boolean variables, and every query scans it:
fine for 3 variables, hopeless for 30. Bayesian networks (next problems) store the same distribution with far
fewer numbers.
"""

ENTRY = 'prob'

V, J = DENTIST_VARIABLES, DENTIST_JOINT

# Same table with the columns in another order: the code must use variables.index, not fixed positions.
_V2 = ('Cavity', 'Toothache', 'Catch')
_J2 = {(cav, t, c): p for (t, c, cav), p in DENTIST_JOINT.items()}

# Weather (AIMA §12.2) independent of Cavity: a non-boolean variable.
_WEATHER = {'sunny': 0.6, 'rain': 0.1, 'cloudy': 0.29, 'snow': 0.01}
_VW = ('Weather', 'Cavity')
_JW = {(w, c): pw * (0.2 if c else 0.8) for w, pw in _WEATHER.items() for c in (True, False)}

TESTS = [
    Test('P(cavity) = 0.2', args=(V, J, {'Cavity': True}), expected=0.2, show="dentist table, P(Cavity=True)"),
    Test('P(toothache) = 0.2', args=(V, J, {'Toothache': True}), expected=0.2, show="dentist table, P(Toothache=True)"),
    Test('P(¬cavity ∧ catch)', args=(V, J, {'Cavity': False, 'Catch': True}), expected=0.16,
         show="P(Cavity=False, Catch=True)"),
    Test('empty event: P({}) = 1', args=(V, J, {}), expected=1.0, show='P({})'),
    Test('P(cavity | toothache) = 0.6', args=(V, J, {'Cavity': True}, {'Toothache': True}), expected=0.6,
         show='P(Cavity=True | Toothache=True)'),
    Test('P(¬cavity | toothache) = 0.4', args=(V, J, {'Cavity': False}, {'Toothache': True}), expected=0.4,
         show='P(Cavity=False | Toothache=True)'),
    Test('P(cavity | toothache ∧ catch)', args=(V, J, {'Cavity': True}, {'Toothache': True, 'Catch': True}),
         expected=0.108 / 0.124, show='P(Cavity=True | Toothache=True, Catch=True)'),
    Test('P(toothache ∧ catch | cavity) = 0.54', args=(V, J, {'Toothache': True, 'Catch': True}, {'Cavity': True}),
         expected=0.54, show='P(Toothache=True, Catch=True | Cavity=True)'),
    Test('contradiction: P(cavity | ¬cavity) = 0', args=(V, J, {'Cavity': True}, {'Cavity': False}), expected=0.0,
         show='P(Cavity=True | Cavity=False)'),
    Test('columns in another order', args=(_V2, _J2, {'Cavity': True}, {'Toothache': True}), expected=0.6,
         show="variables = ('Cavity', 'Toothache', 'Catch'): P(Cavity=True | Toothache=True)"),
    Test('non-boolean variable: P(Weather = sunny)', args=(_VW, _JW, {'Weather': 'sunny'}), expected=0.6,
         show="Weather in {sunny, rain, cloudy, snow}, independent of Cavity: P(Weather=sunny)"),
    Test('independence: P(cloudy | cavity) = P(cloudy)', args=(_VW, _JW, {'Weather': 'cloudy'}, {'Cavity': True}),
         expected=0.29, show='P(Weather=cloudy | Cavity=True)'),
]
