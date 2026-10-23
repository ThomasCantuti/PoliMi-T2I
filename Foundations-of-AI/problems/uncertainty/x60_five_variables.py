from harness import Test
from uncertainty_lib import joint_prob, enumeration_ask, five_vars

TITLE = 'Exam · Feb 2026 · Five-variable network with CPTs given by formulas'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Feb 2026', 'CPT', 'chain rule', 'independence']

STATEMENT = r"""
*Written exam of 6 February 2026 — Uncertainty problem (versions A and B have different numbers and
different Questions 3–4).*

```text
    A       C       E
     \     / \     /
      v   v   v   v
        B       D
```

- All variables are binary (0/1). $A$, $C$, $E$ have the same prior: $P(A{=}0) = P(C{=}0) = P(E{=}0) = p_0$.
- $\theta(A{=}y, C{=}z) = a\,y + b\,z$ and $\varphi(C{=}y, E{=}z) = c\,y + d\,z$.
- $P(B{=}x \mid A{=}y, C{=}z) = \theta(y, z)^x\,(1 - \theta(y, z))^{1-x}$ and
  $P(D{=}x \mid C{=}y, E{=}z) = \varphi(y, z)^x\,(1 - \varphi(y, z))^{1-x}$.

| version | $p_0$ | $\theta(y, z)$ | $\varphi(y, z)$ | Question 3 | Question 4 |
|---|---|---|---|---|---|
| A | 0.7 | $0.2y + 0.4z$ | $0.4y + 0.2z$ | $P(A{=}1 \mid E{=}0)$ | $P(E{=}1 \mid D{=}1, C{=}1)$ |
| B | 0.6 | $0.1y + 0.3z$ | $0.3y + 0.1z$ | $P(A{=}0 \mid E{=}1)$ | $P(C{=}1 \mid A{=}1, B{=}0)$ |

Question 1: write the expression of $P(A, B, C, D, E)$. Question 2: compute $P(A{=}1, B{=}1, C{=}1, D{=}1, E{=}1)$.

Write `make_network(p0, theta, phi)` → the network in the format of the previous problems: variables `'A'`…`'E'`
with values `0` and `1`, parents `('A', 'C')` for `B` and `('C', 'E')` for `D` (in this order), CPT rows
`{0: …, 1: …}`. `theta` and `phi` are Python functions of `(y, z)`. The tests then ask the exam's questions to
your network with `joint_prob` and `enumeration_ask`.
"""

STARTER = '''def make_network(p0: float, theta, phi) -> dict:
    """The network of 6 Feb 2026 as {variable: (parents, cpt)}."""
    root = {(): {0: p0, 1: 1 - p0}}
    net = {'A': ((), root), 'C': ((), root), 'E': ((), root)}
    # TODO: B with parents (A, C) and D with parents (C, E); P(X=1 | y, z) = theta(y, z) or phi(y, z)
    return net
'''

SOLUTION = '''def make_network(p0: float, theta, phi) -> dict:
    """The network of 6 Feb 2026 as {variable: (parents, cpt)}."""
    root = {(): {0: p0, 1: 1 - p0}}
    net = {'A': ((), root), 'C': ((), root), 'E': ((), root)}
    net['B'] = (('A', 'C'), {(y, z): {1: theta(y, z), 0: 1 - theta(y, z)} for y in (0, 1) for z in (0, 1)})
    net['D'] = (('C', 'E'), {(y, z): {1: phi(y, z), 0: 1 - phi(y, z)} for y in (0, 1) for z in (0, 1)})
    return net
'''

HINTS = [
    '$\\theta^x (1 - \\theta)^{1 - x}$ is just a compact way to write "$\\theta$ if $x = 1$, $1 - \\theta$ if $x = 0$" '
    '(a Bernoulli distribution).',
    'One CPT row per combination of the parents\' values: `{(y, z): {1: theta(y, z), 0: 1 - theta(y, z)} for y in (0, 1) '
    'for z in (0, 1)}`.',
]

EXPLANATION = r"""
**Question 1 (official):** $P(A, B, C, D, E) = P(A)\,P(C)\,P(E)\,P(B \mid A, C)\,P(D \mid C, E)$.

**Question 2.** Version A: $\theta(1, 1) = 0.6$, $\varphi(1, 1) = 0.6$, so
$P(A{=}1, B{=}1, C{=}1, D{=}1, E{=}1) = 0.3 \cdot 0.3 \cdot 0.3 \cdot 0.6 \cdot 0.6 = 0.00972$ (official: 0.0097).
Version B: $\theta(1, 1) = \varphi(1, 1) = 0.4$, $P = 0.4^5 = 0.01024$ (official).

**Question 3 (model answer):** $A$ and $E$ are independent when nothing else is known: the only trail
$A \to B \leftarrow C \to D \leftarrow E$ contains two v-structures with unobserved middle nodes. So
$P(A{=}1 \mid E{=}0) = P(A{=}1) = 0.3$ (version A) and $P(A{=}0 \mid E{=}1) = P(A{=}0) = 0.6$ (version B).
The official solution of version B writes "A and C are independent" — a typo for A and E (A and C are
independent too, but that is not what the question needs).

**Question 4, version A (official):**
$$P(E{=}1 \mid D{=}1, C{=}1) = \frac{P(E{=}1)\,P(C{=}1)\,P(D{=}1 \mid E{=}1, C{=}1)}{\sum_e P(D{=}1 \mid C{=}1, E{=}e)\,P(C{=}1)\,P(E{=}e)}
= \frac{0.3^2 \cdot 0.6}{0.3^2 \cdot 0.6 + 0.3 \cdot 0.7 \cdot 0.4} = \frac{0.054}{0.138} = 0.391$$
($A$ and $B$ sum out to 1; $P(C{=}1)$ cancels.) Observing $D = 1$ raises $P(E = 1)$ from 0.3 to 0.391.

**Question 4, version B (official):**
$$P(C{=}1 \mid A{=}1, B{=}0) = \frac{P(B{=}0 \mid A{=}1, C{=}1)\,P(A{=}1)\,P(C{=}1)}{\sum_c P(B{=}0 \mid A{=}1, C{=}c)\,P(A{=}1)\,P(C{=}c)}
= \frac{0.6 \cdot 0.4 \cdot 0.4}{0.6 \cdot 0.4 \cdot 0.4 + 0.9 \cdot 0.4 \cdot 0.6} = \frac{0.096}{0.312} = 0.308$$
(official: 0.31).

> **Exam trap:** with $\theta^x (1 - \theta)^{1-x}$, $P(B = 0 \mid \dots) = 1 - \theta$, not $\theta$. And the
> independence shortcut of Question 3 must be **motivated** with the structure: it would be wrong given $B$ and
> $D$ (both v-structures open, $C$ unobserved).
"""

ENTRY = 'make_network'

_A = (0.7, lambda y, z: 0.2 * y + 0.4 * z, lambda y, z: 0.4 * y + 0.2 * z)
_B = (0.6, lambda y, z: 0.1 * y + 0.3 * z, lambda y, z: 0.3 * y + 0.1 * z)
_ONES = {X: 1 for X in 'ABCDE'}


def _ask(version, X, x, evidence):
    return lambda sol: enumeration_ask(X, evidence, sol.make_network(*version))[x]


def _structure(sol):
    net = sol.make_network(*_A)
    return {X: tuple(net[X][0]) for X in sorted(net)}


def _same_cpts(sol):
    mine, ref = sol.make_network(*_B), five_vars('B')
    return all(abs(mine[X][1][k][v] - ref[X][1][k][v]) < 1e-12 for X in ref for k in ref[X][1] for v in (0, 1))


TESTS = [
    Test('structure', call=_structure, expected={'A': (), 'B': ('A', 'C'), 'C': (), 'D': ('C', 'E'), 'E': ()},
         show='parents of each variable'),
    Test('version B: every CPT entry', call=_same_cpts, expected=True, show='make_network(0.6, θ_B, φ_B)'),
    Test('version A, Q2: P(all ones) = 0.00972', call=lambda sol: joint_prob(sol.make_network(*_A), _ONES), expected=0.00972,
         show='joint_prob(network A, A=B=C=D=E=1)'),
    Test('version B, Q2: P(all ones) = 0.01024', call=lambda sol: joint_prob(sol.make_network(*_B), _ONES), expected=0.01024,
         show='joint_prob(network B, A=B=C=D=E=1)'),
    Test('version A, Q3: P(A=1 | E=0) = P(A=1) = 0.3', call=_ask(_A, 'A', 1, {'E': 0}), expected=0.3),
    Test('version B, Q3: P(A=0 | E=1) = P(A=0) = 0.6', call=_ask(_B, 'A', 0, {'E': 1}), expected=0.6),
    Test('version A, Q4: P(E=1 | D=1, C=1) ≈ 0.391', call=_ask(_A, 'E', 1, {'D': 1, 'C': 1}), expected=0.054 / 0.138),
    Test('version B, Q4: P(C=1 | A=1, B=0) ≈ 0.308', call=_ask(_B, 'C', 1, {'A': 1, 'B': 0}), expected=0.096 / 0.312),
    Test('version A: P(C=1 | A=1, B=0)', call=_ask(_A, 'C', 1, {'A': 1, 'B': 0}), expected=0.12 / 0.68),
    Test('version B: P(E=1 | D=1, C=1)', call=_ask(_B, 'E', 1, {'D': 1, 'C': 1}), expected=0.16 / 0.34),
]
