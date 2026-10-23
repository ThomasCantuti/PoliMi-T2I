from harness import Test
from uncertainty_lib import student, enumeration_ask

TITLE = 'Exam · Jul 2024 · Student network: evidential reasoning P(k1 | g3, d1)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Jul 2024', 'evidential reasoning', "Bayes' rule", 'student network']

STATEMENT = r"""
*Written exam of 12 July 2024 — Uncertainty problem, Questions 3–4 (version A; version B asks the symmetric
question).*

Student network with $P(d_0) = 0.1$, $P(d_1) = 0.9$, $P(k_0) = 0.7$, $P(k_1) = 0.3$:

```text
   Difficulty {d0, d1}          Knowledge {k0, k1}
              \                /           \
               v              v             v
              Grade {g1, g2, g3}         Test {s0, s1}
                     |
                     v
              Letter {L0, L1}
```

| $K, D$ | $g_1$ | $g_2$ | $g_3$ |
|---|---|---|---|
| $k_0, d_0$ | 0.3 | 0.4 | 0.3 |
| $k_0, d_1$ | 0.05 | 0.25 | 0.7 |
| $k_1, d_0$ | 0.9 | 0.08 | 0.02 |
| $k_1, d_1$ | 0.5 | 0.3 | 0.2 |

(Letter and Test tables as usual; they are not needed here.)

- **Version A.** We know that the course is hard ($d_1$) and that the student received a C ($g_3$). Derive the
  formula for our evaluation of the student's high knowledge, compute it, and discuss the difference with the
  prior.
- **Version B.** We know that the student's knowledge is high ($k_1$) and that she received a B ($g_2$). Same
  questions for the course's high difficulty $d_1$.

Write `p_k1(net, g, d)` → $P(k_1 \mid g, d)$ and `p_d1(net, g, k)` → $P(d_1 \mid g, k)$, with the formula of the
official solution (ratio of a joint and a sum over the unknown parent). Access the CPTs as
`net['Knowledge'][1][()]['k1']`, `net['Grade'][1][(k, d)][g]`.
"""

STARTER = '''def p_k1(net: dict, g: str, d: str) -> float:
    """P(k1 | g, d)."""
    PD = net['Difficulty'][1][()]
    PK = net['Knowledge'][1][()]
    PG = net['Grade'][1]
    # TODO: P(g ∧ k1 ∧ d) / P(g ∧ d), the denominator summed over k
    return PK['k1']

def p_d1(net: dict, g: str, k: str) -> float:
    """P(d1 | g, k)."""
    return 0.0
'''

SOLUTION = '''def p_k1(net: dict, g: str, d: str) -> float:
    """P(k1 | g, d)."""
    PD = net['Difficulty'][1][()]
    PK = net['Knowledge'][1][()]
    PG = net['Grade'][1]
    joint = PG[('k1', d)][g] * PK['k1'] * PD[d]
    evidence = sum(PG[(k, d)][g] * PK[k] * PD[d] for k in PK)
    return joint / evidence

def p_d1(net: dict, g: str, k: str) -> float:
    """P(d1 | g, k)."""
    PD = net['Difficulty'][1][()]
    PK = net['Knowledge'][1][()]
    PG = net['Grade'][1]
    joint = PG[(k, 'd1')][g] * PD['d1'] * PK[k]
    evidence = sum(PG[(k, d)][g] * PD[d] * PK[k] for d in PD)
    return joint / evidence
'''

HINTS = [
    'Definition of conditional probability: $P(k_1 \\mid d_1, g_3) = P(g_3 \\wedge k_1 \\wedge d_1) / P(d_1 \\wedge g_3)$.',
    'Numerator by the chain rule (Letter and Test sum to 1): $P(g_3 \\mid k_1, d_1)\\,P(k_1)\\,P(d_1)$. Denominator by '
    'marginalization over Knowledge: $\\sum_k P(g_3 \\mid d_1, k)\\,P(d_1)\\,P(k)$.',
    '`p_d1` is the same with the roles of the two parents swapped: sum over `d` in the denominator.',
]

EXPLANATION = r"""
**Model answer, version A** (official):
$$P(k_1 \mid d_1, g_3) = \frac{P(g_3 \wedge k_1 \wedge d_1)}{P(d_1 \wedge g_3)}
= \frac{P(g_3 \mid k_1 \wedge d_1)\,P(k_1)\,P(d_1)}{\sum_k P(g_3 \mid d_1, k)\,P(d_1)\,P(k)}
= \frac{0.2 \cdot 0.9 \cdot 0.3}{0.7 \cdot 0.9 \cdot 0.7 + 0.2 \cdot 0.9 \cdot 0.3} = \frac{0.054}{0.495} = 0.109$$
The prior belief in high knowledge was $P(k_1) = 0.3$; after seeing a C it drops to about a third of it: this is
**evidential** reasoning, from the effect (Grade) back to a cause (Knowledge). $P(d_1)$ cancels; it is kept in
the official computation, which is also correct.

**Model answer, version B** (official):
$$P(d_1 \mid g_2 \wedge k_1) = \frac{P(g_2 \mid d_1 \wedge k_1)\,P(d_1)\,P(k_1)}{\sum_d P(g_2 \mid d \wedge k_1)\,P(d)\,P(k_1)}
= \frac{0.3 \cdot 0.9 \cdot 0.3}{0.3 \cdot 0.9 \cdot 0.3 + 0.08 \cdot 0.1 \cdot 0.3} = \frac{0.0810}{0.0834} = 0.971$$
(official: 0.97). A good student getting only a B makes a hard course even more likely than the prior 0.9.

**Explaining away, for the discussion:** without knowing the difficulty, $P(k_1 \mid g_3) = 0.106$. Knowing the
course was hard raises it slightly to 0.109 (the difficulty explains part of the C); knowing it was easy drops it
to $P(k_1 \mid g_3, d_0) = 0.028$. Difficulty and Knowledge are independent a priori but become dependent once
their common effect Grade is observed.
"""

ENTRY = 'p_k1'

_S = student()


def _all_k1(sol):
    return all(abs(sol.p_k1(_S, g, d) - enumeration_ask('Knowledge', {'Grade': g, 'Difficulty': d}, _S)['k1']) < 1e-9
               for g in ('g1', 'g2', 'g3') for d in ('d0', 'd1'))


def _all_d1(sol):
    return all(abs(sol.p_d1(_S, g, k) - enumeration_ask('Difficulty', {'Grade': g, 'Knowledge': k}, _S)['d1']) < 1e-9
               for g in ('g1', 'g2', 'g3') for k in ('k0', 'k1'))


TESTS = [
    Test('version A: P(k1 | g3, d1) ≈ 0.109', args=(_S, 'g3', 'd1'), expected=0.054 / 0.495),
    Test('a C in an easy course: P(k1 | g3, d0)', args=(_S, 'g3', 'd0'), expected=0.006 / 0.216),
    Test('an A in a hard course: P(k1 | g1, d1)', args=(_S, 'g1', 'd1'), expected=0.15 / 0.185),
    Test('version B: P(d1 | g2, k1) ≈ 0.971', call=lambda sol: sol.p_d1(_S, 'g2', 'k1'), expected=0.081 / 0.0834,
         show="p_d1(student, 'g2', 'k1')"),
    Test('every grade and difficulty', call=_all_k1, expected=True, show='p_k1 for all 6 combinations'),
    Test('every grade and knowledge', call=_all_d1, expected=True, show='p_d1 for all 6 combinations'),
    Test('P(d1) cancels: same result with P(d1) = 0.4', args=(student(0.4, 0.3), 'g3', 'd1'), expected=0.06 / 0.55,
         show="student(0.4, 0.3), 'g3', 'd1'"),
]
