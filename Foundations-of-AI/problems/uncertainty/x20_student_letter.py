from harness import Test
from uncertainty_lib import student, STUDENT_PRIORS

TITLE = 'Exam · Feb 2024 · Student network: derive and compute P(Letter)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Feb 2024', 'marginalization', 'chain rule', 'student network']

STATEMENT = r"""
*Written exam of 6 February 2024 — Uncertainty problem, Questions 3–4 (versions A–D differ in the priors and in
the value of Letter asked).*

```text
   Difficulty {d0, d1}          Knowledge {k0, k1}
              \                /           \
               v              v             v
              Grade {g1, g2, g3}         Test {s0, s1}
                     |
                     v
              Letter {L0, L1}
```

| $K, D$ | $g_1$ | $g_2$ | $g_3$ | | $G$ | $L_0$ | $L_1$ | | $K$ | $s_0$ | $s_1$ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| $k_0, d_0$ | 0.3 | 0.4 | 0.3 | | $g_1$ | 0.1 | 0.9 | | $k_0$ | 0.95 | 0.05 |
| $k_0, d_1$ | 0.05 | 0.25 | 0.7 | | $g_2$ | 0.4 | 0.6 | | $k_1$ | 0.2 | 0.8 |
| $k_1, d_0$ | 0.9 | 0.08 | 0.02 | | $g_3$ | 0.99 | 0.01 | | | | |
| $k_1, d_1$ | 0.5 | 0.3 | 0.2 | | | | | | | | |

| version | $P(d_0)$ | $P(d_1)$ | $P(k_0)$ | $P(k_1)$ | asked |
|---|---|---|---|---|---|
| A | 0.1 | 0.9 | 0.7 | 0.3 | $P(Letter = L_1)$ |
| B | 0.5 | 0.5 | 0.4 | 0.6 | $P(Letter = L_0)$ |
| C | 0.6 | 0.4 | 0.1 | 0.9 | $P(Letter = L_1)$ |
| D | 0.6 | 0.4 | 0.1 | 0.9 | $P(Letter = L_0)$ |

**Question 3:** derive the formula to compute $P(Letter = L_1)$. **Question 4:** compute it with three-digit
precision ("graded if and only if the formula is correct").

Write `p_letter(net, l)` → $P(Letter = l)$ by writing the formula of Question 3 explicitly (three nested sums),
reading the CPTs from `net` (format of the previous problems): `net['Difficulty'][1][()]['d1']`,
`net['Grade'][1][('k1', 'd0')]['g2']` (the key of Grade is **(knowledge, difficulty)**, in the order of its
parents), `net['Letter'][1][('g3',)]['L1']`.
"""

STARTER = '''def p_letter(net: dict, l: str) -> float:
    """P(Letter = l) = sum_d sum_k sum_g P(d) P(k) P(g | d, k) P(l | g)."""
    PD = net['Difficulty'][1][()]
    PK = net['Knowledge'][1][()]
    PG = net['Grade'][1]
    PL = net['Letter'][1]
    total = 0.0
    # TODO: three nested sums over d in PD, k in PK, g in ('g1', 'g2', 'g3')
    return total
'''

SOLUTION = '''def p_letter(net: dict, l: str) -> float:
    """P(Letter = l) = sum_d sum_k sum_g P(d) P(k) P(g | d, k) P(l | g)."""
    PD = net['Difficulty'][1][()]
    PK = net['Knowledge'][1][()]
    PG = net['Grade'][1]
    PL = net['Letter'][1]
    total = 0.0
    for d in PD:
        for k in PK:
            for g in ('g1', 'g2', 'g3'):
                total += PD[d] * PK[k] * PG[(k, d)][g] * PL[(g,)][l]
    return total
'''

HINTS = [
    'Marginalize the joint over every variable except Letter: $P(L_1) = \\sum_d \\sum_k \\sum_g \\sum_s P(d, k, g, s, L_1)$, '
    'then expand each joint term with the chain rule of the network.',
    'Test is a leaf you do not ask about: $\\sum_s P(s \\mid k) = 1$, so it disappears. What is left: '
    '$P(d)\\,P(k)\\,P(g \\mid d \\wedge k)\\,P(L_1 \\mid g)$.',
    'In code: `PD[d] * PK[k] * PG[(k, d)][g] * PL[(g,)][l]`, summed over the three loops.',
]

EXPLANATION = r"""
**Model answer (Question 3):**
$$P(L_1) = \sum_d \sum_k \sum_g P(L_1 \wedge d \wedge k \wedge g) = \sum_d \sum_k \sum_g P(d)\,P(k)\,P(g \mid d \wedge k)\,P(L_1 \mid g)$$
(the Standardized Test variable sums to 1 and is dropped).

**Question 4, version A**, grouping by grade — first $P(g) = \sum_d \sum_k P(d) P(k) P(g \mid d, k)$:

| | $g_1$ | $g_2$ | $g_3$ |
|---|---|---|---|
| $P(g)$ | $0.1{\cdot}0.7{\cdot}0.3 + 0.9{\cdot}0.7{\cdot}0.05 + 0.1{\cdot}0.3{\cdot}0.9 + 0.9{\cdot}0.3{\cdot}0.5 = 0.2145$ | 0.2689 | 0.5166 |
| $P(L_1 \mid g)$ | 0.9 | 0.6 | 0.01 |

$P(L_1) = 0.2145 \cdot 0.9 + 0.2689 \cdot 0.6 + 0.5166 \cdot 0.01 = 0.19305 + 0.16134 + 0.00517 = 0.3596 \approx 0.360$ (official). Other versions: B $P(L_0) = 0.40994 \approx 0.410$, C $P(L_1) = 0.72981 \approx 0.730$,
D $P(L_0) = 0.27019 \approx 0.270$ — all as in the official solutions. $P(L_0) = 1 - P(L_1)$ is a valid shortcut
once one of them is computed.

**Discrepancy in the official solution:** the formula written for $P(L_0)$ keeps $L_1$ inside the sums
($\sum_d \sum_k \sum_g P(L_1 \wedge d \wedge k \wedge g)$ and $P(L_1 \mid g)$) — a copy-paste typo; it must be
$L_0$ in both places. The numerical answers are correct.

> **Exam trap:** the order of the parents in the Grade table is $(K, D)$; reading the row $(d_1, k_0)$ as
> $(k_1, d_0)$ silently changes the result. Write the symbolic formula before substituting: without it the
> number is not graded.
"""

ENTRY = 'p_letter'


def _net(v):
    return student(*STUDENT_PRIORS[v])


TESTS = [
    Test('version A: P(L1) ≈ 0.360', args=(_net('A'), 'L1'), expected=0.359556, show="student A (P(d1)=0.9, P(k1)=0.3), 'L1'"),
    Test('version B: P(L0) ≈ 0.410', args=(_net('B'), 'L0'), expected=0.40994, show="student B (P(d1)=0.5, P(k1)=0.6), 'L0'"),
    Test('version C: P(L1) ≈ 0.730', args=(_net('C'), 'L1'), expected=0.729808, show="student C (P(d1)=0.4, P(k1)=0.9), 'L1'"),
    Test('version D: P(L0) ≈ 0.270', args=(_net('D'), 'L0'), expected=0.270192, show="student D (P(d1)=0.4, P(k1)=0.9), 'L0'"),
    Test('version A: P(L0) + P(L1) = 1', call=lambda sol: round(sol.p_letter(_net('A'), 'L0') + sol.p_letter(_net('A'), 'L1'), 9),
         expected=1.0),
    Test('Koller\'s original priors P(d1)=0.4, P(k1)=0.3', args=(student(0.4, 0.3), 'L1'), expected=0.502336,
         show="student(P(d1)=0.4, P(k1)=0.3), 'L1'"),
]
