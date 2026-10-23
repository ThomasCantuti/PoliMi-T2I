TITLE = 'Exam · Short questions on probability and Bayesian networks (2024–2026)'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['exam', 'Feb 2024', 'Jul 2024', 'Feb 2026', 'formulas', 'causal reasoning', 'evidential reasoning']

STATEMENT = r"""
*Short questions from the Uncertainty problems of 6 February 2024 (Questions 1–3), 12 July 2024 (Questions 1–3)
and 6 February 2026 (Questions 1, 3, 4).* The computations of the same exams are in the code problems x20, x30
and x60. The student network:

```text
   Difficulty {d0, d1}          Knowledge {k0, k1}
              \                /           \
               v              v             v
              Grade {g1, g2, g3}         Test {s0, s1}
                     |
                     v
              Letter {L0, L1}
```

The network of 6 Feb 2026: $A \to B \leftarrow C \to D \leftarrow E$.
"""

QUESTIONS = [
    {
        'q': '(Feb 2024, Q1) Write the marginalization formula to compute $P(X = x_i)$ knowing $P(X = x_i \\wedge Y = y_j)$ '
             'for all the values $x_i$ and $y_j$.',
        'options': [
            '$P(X = x_i) = \\sum_j P(X = x_i \\wedge Y = y_j)$',
            '$P(X = x_i) = \\sum_i \\sum_j P(X = x_i \\wedge Y = y_j)$',
            '$P(X = x_i) = \\prod_j P(X = x_i \\wedge Y = y_j)$',
            '$P(X = x_i) = \\max_j P(X = x_i \\wedge Y = y_j)$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official, "from the slides"): $P(X = x_i) = \\sum_j P(X = x_i \\wedge Y = y_j)$. Summing '
                   'also over $i$ gives 1.',
    },
    {
        'q': '(Feb 2024, Q2) Write the chain rule for a Bayesian network with $n$ random variables $X_1, \\dots, X_n$.',
        'options': [
            '$P(X_1, \\dots, X_n) = \\prod_i P(X_i \\mid \\text{Parents}_G(X_i))$',
            '$P(X_1, \\dots, X_n) = \\prod_i P(X_i \\mid X_1, \\dots, X_n)$',
            '$P(X_1, \\dots, X_n) = \\prod_i P(X_i \\mid \\text{Children}_G(X_i))$',
            '$P(X_1, \\dots, X_n) = \\sum_i P(X_i \\mid \\text{Parents}_G(X_i))$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): $P(X_1, \\dots, X_n) = \\Pi_i P(X_i \\mid \\text{Parents}_G(X_i))$. The general '
                   'chain rule conditions on the **previous** variables $X_{i-1}, \\dots, X_1$; the network shortens each '
                   'condition to the parents.',
    },
    {
        'q': '(Feb 2026, Q1) For $A \\to B \\leftarrow C \\to D \\leftarrow E$, write the expression to compute '
             '$P(A, B, C, D, E)$.',
        'options': [
            '$P(A)\\,P(C)\\,P(E)\\,P(B \\mid A, C)\\,P(D \\mid C, E)$',
            '$P(A)\\,P(B)\\,P(C)\\,P(D)\\,P(E)$',
            '$P(A)\\,P(B \\mid A)\\,P(C \\mid B)\\,P(D \\mid C)\\,P(E \\mid D)$',
            '$P(B \\mid A, C)\\,P(D \\mid C, E)$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): $P(A,B,C,D,E) = P(A)P(C)P(E)P(B \\mid A,C)P(D \\mid C,E)$. The roots keep their '
                   'priors; forgetting them (last option) gives a product of conditionals, not a joint.',
    },
    {
        'q': '(Feb 2024, Q3, versions B and D) Derive the formula to compute $P(Letter = L_0)$.',
        'options': [
            '$P(L_0) = \\sum_d \\sum_k \\sum_g P(d)\\,P(k)\\,P(g \\mid d \\wedge k)\\,P(L_0 \\mid g)$',
            '$P(L_0) = \\sum_g P(L_0 \\mid g)$',
            '$P(L_0) = \\sum_d \\sum_k \\sum_g P(d)\\,P(k)\\,P(g \\mid d \\wedge k)\\,P(L_1 \\mid g)$',
            '$P(L_0) = \\sum_d \\sum_k \\sum_g \\sum_s P(d)\\,P(k)\\,P(g \\mid d \\wedge k)\\,P(L_0 \\mid g)\\,P(s)$',
        ],
        'answer': 0,
        'explain': '**Model answer:** $P(L_0) = \\sum_d \\sum_k \\sum_g P(L_0 \\wedge d \\wedge k \\wedge g) = \\sum_d \\sum_k '
                   '\\sum_g P(d)P(k)P(g \\mid d \\wedge k)P(L_0 \\mid g)$; Test sums out to 1. **Note:** the official sheet '
                   'writes this formula with $L_1$ inside the sums (third option) — a copy-paste typo from the $P(L_1)$ '
                   'version; it computes $P(L_1)$, not $P(L_0)$. $\\sum_g P(L_0 \\mid g)$ forgets to weight by $P(g)$, and '
                   '$P(s)$ is not a CPT of this network (Test has parent Knowledge).',
    },
    {
        'q': '(Jul 2024, Q1) Explain the difference between causal and evidential reasoning.',
        'options': [
            'Causal reasoning flows in the causal direction, from the priors (Difficulty, Knowledge) down to the effects; '
            'evidential reasoning flows the opposite way and changes our beliefs about the causes given what happened',
            'Causal reasoning uses Bayes\' rule, evidential reasoning does not',
            'Causal reasoning is about the structure of the network, evidential reasoning about its numbers',
            'Evidential reasoning is only possible between two causes of the same effect',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): causal reasoning flows top-down, e.g. the probability that a student will '
                   'receive a recommendation letter given that she studied a lot, $P(L_1 \\mid k_1)$. Evidential reasoning '
                   'flows bottom-up and revises our beliefs about the priors given some knowledge of what happened, e.g. '
                   '$P(k_1 \\mid g_3)$. Reasoning between two causes of the same effect is **intercausal** (explaining away). '
                   'Evidential queries are the ones that need Bayes\' rule, since the tables store the causal direction.',
    },
    {
        'q': '(Jul 2024, Q2) Write a question that evidential reasoning might try to answer on the student network.',
        'options': [
            'We know that the student got a C ($g_3$): how does this change the probability that the exam was difficult, or '
            'that the student knew the material?',
            'The student knows the material: how likely is a recommendation letter?',
            'The course is hard: how likely is a C?',
            'What is the prior probability that the course is hard?',
        ],
        'answer': 0,
        'explain': '**Model answer** (official, "from the course slide"): we know that the student got a C; how does this '
                   'information change the probability that the exam is difficult, or that the student knew the study '
                   'material? (Numbers: $P(d_1 \\mid g_3) = 0.958$ vs 0.9, $P(k_1 \\mid g_3) = 0.106$ vs 0.3.) The second and '
                   'third options are causal questions.',
    },
    {
        'q': '(Jul 2024, Q3) The course is hard ($d_1$) and the student got a C ($g_3$). Which formula expresses what '
             'happens to our evaluation of the student\'s high knowledge?',
        'options': [
            '$P(k_1 \\mid g_3, d_1) = \\dfrac{P(g_3 \\mid k_1, d_1)\\,P(k_1)\\,P(d_1)}{\\sum_k P(g_3 \\mid d_1, k)\\,P(d_1)\\,P(k)}$',
            '$P(k_1 \\mid g_3, d_1) = P(g_3 \\mid k_1, d_1)\\,P(k_1)\\,P(d_1)$',
            '$P(k_1 \\mid g_3, d_1) = P(g_3 \\mid k_1, d_1)$',
            '$P(k_1 \\mid g_3, d_1) = P(k_1)$, because Knowledge and Difficulty are independent',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): $P(k_1 \\mid d_1, g_3) = P(g_3 \\wedge k_1 \\wedge d_1) / P(d_1 \\wedge g_3) = '
                   '0.054 / 0.495 = 0.109$, against the prior 0.3. The second option is only the numerator (a joint); the '
                   'third inverts the conditional; the last forgets that Grade is observed, which makes $K$ and $D$ '
                   'dependent.',
    },
    {
        'q': '(Feb 2026, Q3, version A: $P(A{=}0) = P(C{=}0) = P(E{=}0) = 0.7$) Compute $P(A = 1 \\mid E = 0)$.',
        'options': [
            '0.3, because $A$ and $E$ are independent when no other variable is known',
            '0.7, because $P(E = 0) = 0.7$',
            '0.21, because $P(A{=}1)\\,P(E{=}0) = 0.3 \\cdot 0.7$',
            'It cannot be computed without $\\theta$ and $\\varphi$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): $A$ and $E$ are independent when the other nodes are unknown, so '
                   '$P(A{=}1 \\mid E{=}0) = P(A{=}1) = 0.3$. Motivate it: the only trail $A \\to B \\leftarrow C \\to D '
                   '\\leftarrow E$ is blocked by the unobserved v-structures at $B$ and $D$. Version B asked '
                   '$P(A{=}0 \\mid E{=}1) = P(A{=}0) = 0.6$; its official solution says "A and C are independent", a typo for '
                   'A and E. 0.21 is the **joint** $P(A{=}1, E{=}0)$.',
    },
    {
        'q': '(Feb 2026, Q4, version A) Which expression computes $P(E = 1 \\mid D = 1, C = 1)$?',
        'options': [
            '$\\dfrac{P(E{=}1)\\,P(C{=}1)\\,P(D{=}1 \\mid E{=}1, C{=}1)}{\\sum_e P(D{=}1 \\mid C{=}1, E{=}e)\\,P(C{=}1)\\,P(E{=}e)}$',
            '$P(D{=}1 \\mid C{=}1, E{=}1)$',
            '$\\dfrac{P(E{=}1)\\,P(D{=}1 \\mid E{=}1, C{=}1)}{P(D{=}1)}$ with $P(D{=}1) = \\varphi(1, 1)$',
            '$P(E{=}1) = 0.3$, because $E$ is a root',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): $\\frac{0.3^2 \\cdot 0.6}{0.3^2 \\cdot 0.6 + 0.3 \\cdot 0.7 \\cdot 0.4} = 0.39$. '
                   'The denominator is $P(D{=}1, C{=}1)$, obtained by summing over $E$ ($A$ and $B$ sum out to 1). $P(D = 1)$ '
                   'is not $\\varphi(1, 1)$: that is a conditional. Roots can change once their descendants are observed.',
    },
]
