from harness import Test
from uncertainty_lib import burglary, dentist, student, five_vars

TITLE = 'Checking (conditional) independence numerically'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['independence', 'conditional independence', 'explaining away', 'Bayesian network']

STATEMENT = r"""
$X$ and $Y$ are **conditionally independent given** a set of variables $Z$ iff, for **every** value $x$, $y$
and every combination $z$ of values of $Z$ (AIMA §12.4):

$$P(x \wedge y \mid z) = P(x \mid z)\,P(y \mid z)
\quad\Longleftrightarrow\quad P(x, y, z)\,P(z) = P(x, z)\,P(y, z)$$

(with $Z$ empty this is plain independence, $P(x, y) = P(x)\,P(y)$). The right-hand form needs no division,
so it also works when $P(z) = 0$.

Write `independent(net, X, Y, given=())` → `True` iff $X \perp Y \mid$ `given` in the distribution of the
network. Use the given helpers: `values(net, V)` (domain of `V`) and `prob(net, event)` (probability of a
**partial** event, by marginalization). Compare floats with
`math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-15)`.

**Examples (burglary):** `independent(net, 'Burglary', 'Earthquake')` → `True`;
`independent(net, 'Burglary', 'Earthquake', ('Alarm',))` → `False` (explaining away).
"""

STARTER = '''import itertools
import math
from uncertainty_lib import values, prob

def independent(net: dict, X: str, Y: str, given: tuple = ()) -> bool:
    """X and Y conditionally independent given the variables in `given`?"""
    for z_values in itertools.product(*(values(net, Z) for Z in given)):
        z = dict(zip(given, z_values))
        # TODO: check P(x, y, z) P(z) == P(x, z) P(y, z) for every x and y
    return False
'''

SOLUTION = '''import itertools
import math
from uncertainty_lib import values, prob

def independent(net: dict, X: str, Y: str, given: tuple = ()) -> bool:
    """X and Y conditionally independent given the variables in `given`?"""
    for z_values in itertools.product(*(values(net, Z) for Z in given)):
        z = dict(zip(given, z_values))
        pz = prob(net, z)
        for x in values(net, X):
            for y in values(net, Y):
                lhs = prob(net, {**z, X: x, Y: y}) * pz
                rhs = prob(net, {**z, X: x}) * prob(net, {**z, Y: y})
                if not math.isclose(lhs, rhs, rel_tol=1e-9, abs_tol=1e-15):
                    return False
    return True
'''

HINTS = [
    'For one combination `z` of the conditioning variables: `pz = prob(net, z)`, then two loops over `values(net, X)` '
    'and `values(net, Y)`.',
    'Compare `prob(net, {**z, X: x, Y: y}) * pz` with `prob(net, {**z, X: x}) * prob(net, {**z, Y: y})`. One '
    'mismatch is enough to return `False`; return `True` only after every combination passed.',
    'With `given = ()`, `itertools.product()` yields one empty tuple: `z = {}` and `prob(net, {}) = 1`.',
]

EXPLANATION = r"""
**What the numbers show** (compare with the trail rules of the next problems):

| query | result | why (structure) |
|---|---|---|
| Burglary ⊥ Earthquake | yes | $B \to A \leftarrow E$: v-structure, nothing observed |
| Burglary ⊥ Earthquake given Alarm | **no** | observing the common effect opens it (explaining away) |
| Burglary ⊥ Earthquake given JohnCalls | **no** | a **descendant** of the common effect is enough |
| JohnCalls ⊥ MaryCalls | no | common cause Alarm, not observed |
| JohnCalls ⊥ MaryCalls given Alarm | yes | the fork is blocked |
| Toothache ⊥ Catch given Cavity | yes | the dentist example of AIMA §12.4 |

Numerically: $P(b \mid a) = 0.374$ but $P(b \mid a, e) = 0.003$: once the earthquake explains the alarm, the
burglary is not needed.

**Numbers vs graph.** A numerical check tells you about **these** CPTs; the graph tells you what holds for
**every** choice of CPTs. If the graph says "independent" (no active trail), the numbers always agree. The
converse can fail for special numbers (e.g. a CPT whose rows are identical makes a parent irrelevant), which is
why the exam asks you to argue from the structure.

**Exam (6 Feb 2026):** $P(A = 1 \mid E = 0) = P(A = 1)$ because $A \perp E$; but given $B$ and $D$ the trail
$A \to B \leftarrow C \to D \leftarrow E$ is active, and the shortcut is no longer allowed.
"""

ENTRY = 'independent'

_B, _D, _S, _F = burglary(), dentist(), student(), five_vars('A')

TESTS = [
    Test('B ⊥ E', args=(_B, 'Burglary', 'Earthquake'), expected=True, show="burglary: 'Burglary', 'Earthquake'"),
    Test('B, E given Alarm: explaining away', args=(_B, 'Burglary', 'Earthquake', ('Alarm',)), expected=False,
         show="burglary: 'Burglary', 'Earthquake', ('Alarm',)"),
    Test('B, E given JohnCalls (descendant)', args=(_B, 'Burglary', 'Earthquake', ('JohnCalls',)), expected=False,
         show="burglary: 'Burglary', 'Earthquake', ('JohnCalls',)"),
    Test('J, M: common cause', args=(_B, 'JohnCalls', 'MaryCalls'), expected=False, show="burglary: 'JohnCalls', 'MaryCalls'"),
    Test('J ⊥ M given Alarm', args=(_B, 'JohnCalls', 'MaryCalls', ('Alarm',)), expected=True,
         show="burglary: 'JohnCalls', 'MaryCalls', ('Alarm',)"),
    Test('B ⊥ J given Alarm (chain blocked)', args=(_B, 'Burglary', 'JohnCalls', ('Alarm',)), expected=True,
         show="burglary: 'Burglary', 'JohnCalls', ('Alarm',)"),
    Test('Toothache, Catch: dependent', args=(_D, 'Toothache', 'Catch'), expected=False, show="dentist: 'Toothache', 'Catch'"),
    Test('Toothache ⊥ Catch given Cavity', args=(_D, 'Toothache', 'Catch', ('Cavity',)), expected=True,
         show="dentist: 'Toothache', 'Catch', ('Cavity',)"),
    Test('6 Feb 2026: A ⊥ E', args=(_F, 'A', 'E'), expected=True, show="five_vars A: 'A', 'E'"),
    Test('6 Feb 2026: A, E given B and D', args=(_F, 'A', 'E', ('B', 'D')), expected=False,
         show="five_vars A: 'A', 'E', ('B', 'D')"),
    Test('6 Feb 2026: B ⊥ D given C', args=(_F, 'B', 'D', ('C',)), expected=True, show="five_vars A: 'B', 'D', ('C',)"),
    Test('student: Letter ⊥ Test given Grade', args=(_S, 'Letter', 'Test', ('Grade',)), expected=True,
         show="student: 'Letter', 'Test', ('Grade',)"),
    Test('student: Difficulty, Knowledge given Letter', args=(_S, 'Difficulty', 'Knowledge', ('Letter',)), expected=False,
         show="student: 'Difficulty', 'Knowledge', ('Letter',)"),
]
