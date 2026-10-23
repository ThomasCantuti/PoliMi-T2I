from harness import Test
from uncertainty_lib import heart, prob

TITLE = 'Exam · Jan 2025 · Heart-disease network: P(ChestPain, HeartDisease, HeartBurn)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Jan 2025', 'marginalization', 'chain rule', 'hidden variables']

STATEMENT = r"""
*Written exam of 16 January 2025 — Uncertainty problem, Questions 1–2 (version A; version B asks another
assignment).*

```text
    Exercise (E)            Diet (D)
           \               /       \
            v             v         v
          HeartDisease (HD)       HeartBurn (Hb)
           /            \           /
          v              v         v
   BloodPressure (BP)    ChestPain (CP)
```

| $P(E = yes)$ | $P(D = healthy)$ |
|---|---|
| 0.7 | 0.25 |

| $E, D$ | $P(HD = yes)$ | | $D$ | $P(Hb = yes)$ | | $HD$ | $P(BP = high)$ | | $HD, Hb$ | $P(CP = yes)$ |
|---|---|---|---|---|---|---|---|---|---|---|
| yes, healthy | 0.25 | | healthy | 0.2 | | yes | 0.85 | | yes, yes | 0.8 |
| yes, unhealthy | 0.45 | | unhealthy | 0.85 | | no | 0.2 | | yes, no | 0.6 |
| no, healthy | 0.55 | | | | | | | | no, yes | 0.4 |
| no, unhealthy | 0.75 | | | | | | | | no, no | 0.1 |

- **Question 1:** write the formula to compute $P(ChestPain = Yes, HeartDisease = No, HeartBurn = No)$ using the
  probabilities of the network.
- **Question 2:** compute it with at least three digits of precision.
- Version B asks the same for $P(ChestPain = No, HeartDisease = No, HeartBurn = Yes)$.

Write `p_cp_hd_hb(net, cp, hd, hb)` → $P(CP = cp, HD = hd, Hb = hb)$ with the formula of Question 1 (values
`'yes'` / `'no'`; $D$ takes `'healthy'` / `'unhealthy'`). Read the CPTs as `net['E'][1][()]['yes']`,
`net['HD'][1][(e, d)]['no']`, `net['Hb'][1][(d,)]['yes']`, `net['CP'][1][(hd, hb)]['yes']`.
"""

STARTER = '''def p_cp_hd_hb(net: dict, cp: str, hd: str, hb: str) -> float:
    """P(CP = cp, HD = hd, Hb = hb): sum over the hidden variables of the chain rule."""
    PE, PD = net['E'][1][()], net['D'][1][()]
    PHD, PHb, PCP = net['HD'][1], net['Hb'][1], net['CP'][1]
    total = 0.0
    # TODO: which variables are hidden? Which one can be dropped?
    return total
'''

SOLUTION = '''def p_cp_hd_hb(net: dict, cp: str, hd: str, hb: str) -> float:
    """P(CP = cp, HD = hd, Hb = hb): sum over the hidden variables of the chain rule."""
    PE, PD = net['E'][1][()], net['D'][1][()]
    PHD, PHb, PCP = net['HD'][1], net['Hb'][1], net['CP'][1]
    total = 0.0
    for e in PE:
        for d in PD:
            total += PE[e] * PD[d] * PHD[(e, d)][hd] * PHb[(d,)][hb] * PCP[(hd, hb)][cp]
    return total
'''

HINTS = [
    'Hidden variables: $E$, $D$ (ancestors of the queried ones) and $BP$. $BP$ is a leaf outside the query: '
    '$\\sum_{bp} P(bp \\mid hd) = 1$, drop it.',
    '$P(cp, hd, hb) = \\sum_e \\sum_d P(e)\\,P(d)\\,P(hd \\mid e \\wedge d)\\,P(hb \\mid d)\\,P(cp \\mid hd \\wedge hb)$.',
    'The last factor does not depend on $e$, $d$: you may take it out of the sums (the exam computation is shorter).',
]

EXPLANATION = r"""
**Model answer (Question 1, official):**
$$P(CP{=}yes \wedge HD{=}no \wedge Hb{=}no) = \sum_e \sum_d P(CP{=}yes \wedge HD{=}no \wedge Hb{=}no \wedge E{=}e \wedge D{=}d)$$
$$= \sum_e \sum_d P(E{=}e)\,P(D{=}d)\,P(HD{=}no \mid E{=}e \wedge D{=}d)\,P(Hb{=}no \mid D{=}d)\,P(CP{=}yes \mid HD{=}no \wedge Hb{=}no)$$

**Question 2:** $P(CP{=}yes \mid HD{=}no, Hb{=}no) = 0.1$ comes out of the sums:

| $e$, $d$ | $P(e) P(d)$ | $P(HD{=}no \mid e, d)$ | $P(Hb{=}no \mid d)$ | product |
|---|---|---|---|---|
| yes, healthy | $0.7 \cdot 0.25$ | 0.75 | 0.8 | 0.105 |
| yes, unhealthy | $0.7 \cdot 0.75$ | 0.55 | 0.15 | 0.0433125 |
| no, healthy | $0.3 \cdot 0.25$ | 0.45 | 0.8 | 0.027 |
| no, unhealthy | $0.3 \cdot 0.75$ | 0.25 | 0.15 | 0.0084375 |

sum $= 0.18375$, times $0.1$: **0.018375** (official, version A).

**Version B:** $P(CP{=}no \mid HD{=}no, Hb{=}yes) = 1 - 0.4 = 0.6$, and the sum with $P(Hb{=}yes \mid d)$ is
$0.02625 + 0.2454375 + 0.00675 + 0.0478125 = 0.32625$, so the result is $0.6 \cdot 0.32625 = $ **0.19575**.

**Discrepancy in the official solution:** version B reports 0.19757; with the network's numbers the value is
0.19575 (two digits swapped). The official formula of version A also writes "CB=no" on the left-hand side, a
typo for $HB = no$.

> **Exam trap:** BP must not appear in the formula with a fixed value: it is not in the query, and summing it
> out gives 1. E and D, instead, must be summed out — they are parents of the queried variables.
"""

ENTRY = 'p_cp_hd_hb'

_H = heart()


def _all_match(sol):
    return all(abs(sol.p_cp_hd_hb(_H, cp, hd, hb) - prob(_H, {'CP': cp, 'HD': hd, 'Hb': hb})) < 1e-12
               for cp in ('yes', 'no') for hd in ('yes', 'no') for hb in ('yes', 'no'))


TESTS = [
    Test('version A: P(CP=yes, HD=no, Hb=no) = 0.018375', args=(_H, 'yes', 'no', 'no'), expected=0.018375),
    Test('version B: P(CP=no, HD=no, Hb=yes) = 0.19575', args=(_H, 'no', 'no', 'yes'), expected=0.19575),
    Test('P(CP=yes, HD=yes, Hb=yes)', args=(_H, 'yes', 'yes', 'yes'), expected=prob(_H, {'CP': 'yes', 'HD': 'yes', 'Hb': 'yes'})),
    Test('all 8 assignments', call=_all_match, expected=True, show='every (cp, hd, hb)'),
    Test('the 8 assignments sum to 1',
         call=lambda sol: round(sum(sol.p_cp_hd_hb(_H, a, b, c) for a in ('yes', 'no') for b in ('yes', 'no')
                                    for c in ('yes', 'no')), 9), expected=1.0),
]
