TITLE = 'Exam · Feb 2023 · Flu network: joint probabilities and an extended network'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['exam', 'Feb 2023', 'chain rule', 'marginalization', 'network structure']

STATEMENT = r"""
*Written exam of 9 February 2023 — Uncertainty problem (versions A, B, C have different numbers).*

There is an influenza outbreak in Milan. You were vaccinated, but there is a 20% probability that the vaccine was
ineffective; yesterday you spent the day with your friend Margherita, who might have had the flu.

- $V$: the vaccine was effective and you are immune ($V$ = True) or not;
- $M$: Margherita had the flu;
- $F$: you contracted the flu.

```text
     V       M
      \     /
       v   v
         F
```

| version | $P(V = T)$ | $P(M = T)$ | $P(F = T \mid V{=}F, M{=}F)$ | $P(F = T \mid V{=}T, M{=}F)$ | $P(F = T \mid V{=}F, M{=}T)$ | $P(F = T \mid V{=}T, M{=}T)$ |
|---|---|---|---|---|---|---|
| A | 0.80 | 0.60 | 0.20 | 0.00 | 0.70 | 0.00 |
| B | 0.70 | 0.70 | 0.30 | 0.10 | 0.80 | 0.10 |
| C | 0.80 | 0.70 | 0.10 | 0.20 | 0.70 | 0.00 |

(The exam tables also list the "False" columns, $1 - p$.) Questions: (1) compute four joint probabilities with
three-digit precision; (2) compute $P(F = False)$; (3) add two variables and draw the new network.
"""

QUESTIONS = [
    {
        'q': 'Which expression gives $P(V = v \\wedge M = m \\wedge F = f)$ in this network?',
        'options': [
            '$P(V = v)\\,P(M = m)\\,P(F = f \\mid V = v \\wedge M = m)$',
            '$P(F = f \\mid V = v \\wedge M = m)$',
            '$P(V = v)\\,P(M = m)\\,P(F = f)$',
            '$P(V = v \\mid F = f)\\,P(M = m \\mid F = f)\\,P(F = f)$',
        ],
        'answer': 0,
        'explain': '**Model answer:** by the chain rule of Bayesian networks, one factor per node given its parents: '
                   '$P(V, M, F) = P(V)\\,P(M)\\,P(F \\mid V \\wedge M)$. The CPT entry alone is a conditional, not a joint; '
                   'the third option ignores the arrows; the last one describes a different network.',
    },
    {
        'q': 'Version A: $P(V{=}T \\wedge M{=}T \\wedge F{=}F)$, $P(V{=}T \\wedge M{=}F \\wedge F{=}F)$, '
             '$P(V{=}F \\wedge M{=}F \\wedge F{=}T)$, $P(V{=}F \\wedge M{=}F \\wedge F{=}F)$ = ?',
        'options': [
            '0.480, 0.320, 0.016, 0.064',
            '0.480, 0.320, 0.064, 0.016',
            '0.600, 0.400, 0.080, 0.320',
            '0.000, 0.000, 0.016, 0.064',
        ],
        'answer': 0,
        'explain': '**Model answer** (official values): $0.8 \\cdot 0.6 \\cdot 1.00 = 0.480$; $0.8 \\cdot 0.4 \\cdot 1.00 = 0.320$; '
                   '$0.2 \\cdot 0.4 \\cdot 0.20 = 0.016$; $0.2 \\cdot 0.4 \\cdot 0.80 = 0.064$. Traps: swapping the True/False '
                   'columns of $F$ (second option), forgetting the factor $P(V)$ (third), using the True column for $F = F$ '
                   '(fourth).',
    },
    {
        'q': 'Version A: $P(F = False)$ = ?',
        'options': ['0.900', '0.864', '0.100', '0.775'],
        'answer': 0,
        'explain': '**Model answer:** marginalize over the parents, $P(F{=}F) = \\sum_v \\sum_m P(v)\\,P(m)\\,P(F{=}F \\mid v, m)$ '
                   '$= 0.480 + 0.320 + 0.064 + 0.2 \\cdot 0.6 \\cdot 0.30 = 0.900$ (official). 0.864 forgets the term '
                   '$V{=}F, M{=}T$ (0.036), which is not among the four joints of Question 1; 0.100 is $P(F = True)$; 0.775 is '
                   'the plain average of the False column, which ignores the priors.',
    },
    {
        'q': 'Version B: the four joints of Question 1 and $P(F = False)$ = ? (Careful: the text still says "20% probability '
             'that the vaccine was ineffective", but the table of version B says $P(V = T) = 0.70$.)',
        'options': [
            '0.441, 0.189, 0.027, 0.063; $P(F{=}F) = 0.735$',
            '0.504, 0.216, 0.018, 0.042; $P(F{=}F) = 0.790$',
            '0.441, 0.189, 0.063, 0.027; $P(F{=}F) = 0.735$',
            '0.630, 0.270, 0.090, 0.210; $P(F{=}F) = 0.735$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official, from the table): $0.7 \\cdot 0.7 \\cdot 0.9 = 0.441$; $0.7 \\cdot 0.3 \\cdot 0.9 = '
                   '0.189$; $0.3 \\cdot 0.3 \\cdot 0.3 = 0.027$; $0.3 \\cdot 0.3 \\cdot 0.7 = 0.063$; $P(F{=}F) = 0.441 + 0.189 + '
                   '0.063 + 0.3 \\cdot 0.7 \\cdot 0.2 = 0.735$. The second option uses $P(V = T) = 0.8$ from the text. When text '
                   'and table disagree, use the table and say so in your answer.',
    },
    {
        'q': 'Version C: the four joints of Question 1 and $P(F = False)$ = ?',
        'options': [
            '0.560, 0.192, 0.006, 0.054; $P(F{=}F) = 0.848$',
            '0.560, 0.192, 0.006, 0.054; $P(F{=}F) = 0.806$',
            '0.000, 0.048, 0.006, 0.054; $P(F{=}F) = 0.848$',
            '0.560, 0.240, 0.006, 0.054; $P(F{=}F) = 0.896$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): $0.8 \\cdot 0.7 \\cdot 1.0 = 0.560$; $0.8 \\cdot 0.3 \\cdot 0.8 = 0.192$; '
                   '$0.2 \\cdot 0.3 \\cdot 0.1 = 0.006$; $0.2 \\cdot 0.3 \\cdot 0.9 = 0.054$; plus $P(V{=}F, M{=}T, F{=}F) = '
                   '0.2 \\cdot 0.7 \\cdot 0.3 = 0.042$: $P(F{=}F) = 0.848$. 0.806 forgets the last term.',
    },
    {
        'q': 'Question 3. Margherita went to a party where someone might have had the flu ($P$); you and Margherita were '
             'vaccinated at the same clinic, which may have given the wrong vaccine ($R$), affecting both your immunity and '
             'Margherita\'s chance of getting the flu. Which arrows does the new network have?',
        'options': [
            '$R \\to V$, $R \\to M$, $P \\to M$, $V \\to F$, $M \\to F$',
            '$R \\to V$, $P \\to M$, $V \\to F$, $M \\to F$',
            '$R \\to V$, $R \\to M$, $P \\to M$, $P \\to F$, $V \\to F$, $M \\to F$',
            '$V \\to R$, $M \\to R$, $M \\to P$, $V \\to F$, $M \\to F$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official drawing): $R$ and $P$ are new roots; $R$ is a common cause of $V$ and $M$ '
                   '("both your immunity and Margherita\'s probability to get the flu depend on whether you received the '
                   'right vaccine"), $P$ is a cause of $M$; $F$ keeps its parents $V$, $M$.\n\n'
                   '```text\nR ---> V ---> F\nR ---> M ---> F\nP ---> M\n```\n\n'
                   'No arrow $P \\to F$: in the story you can only catch the flu from Margherita, so given $M$ the party is '
                   'irrelevant to you. Arrows go from causes to effects, not the reverse (last option).',
    },
    {
        'q': 'Which tables does the extended network need?',
        'options': [
            '$P(R)$, $P(P)$, $P(V \\mid R)$, $P(M \\mid R, P)$, $P(F \\mid V, M)$',
            '$P(R)$, $P(P)$, $P(V)$, $P(M)$, $P(F \\mid V, M)$',
            '$P(R \\mid V, M)$, $P(P \\mid M)$, $P(V)$, $P(M)$, $P(F \\mid V, M)$',
            '$P(R)$, $P(P)$, $P(V \\mid R)$, $P(M \\mid R)$, $P(M \\mid P)$, $P(F \\mid V, M)$',
        ],
        'answer': 0,
        'explain': 'One CPT per node, conditioned on **all** its parents together: $M$ has a single table $P(M \\mid R, P)$ '
                   'with 4 rows, not two separate tables. With boolean variables: $1 + 1 + 2 + 4 + 4 = 12$ numbers.',
    },
    {
        'q': 'In the extended network, are $V$ and $M$ still independent (no evidence)?',
        'options': [
            'No: the trail $V \\leftarrow R \\to M$ (common cause, $R$ not observed) is active',
            'Yes: the only trail between them is $V \\to F \\leftarrow M$, a blocked v-structure',
            'Yes: $V$ and $M$ have no arrow between them',
            'No: because $P \\to M$',
        ],
        'answer': 0,
        'explain': 'In the original network $V$ and $M$ were independent roots. The new common cause $R$ opens a trail: a '
                   'wrong vaccine makes both "not immune" and "Margherita got the flu" more likely. Given $R$ they are '
                   'independent again (if $F$ is not observed).',
    },
    {
        'q': '(Beyond the exam, version A) You wake up with the flu. $P(V = False \\mid F = True)$ = ?',
        'options': ['1.000', '0.200', '0.500', '0.840'],
        'answer': 0,
        'explain': 'Evidential reasoning: $P(F{=}T \\mid V{=}T, m) = 0$ for both values of $m$, so $P(V{=}T \\wedge F{=}T) = 0$ '
                   'and the posterior of an effective vaccine is 0: the flu proves the vaccine failed. (0.840 is '
                   '$P(M = T \\mid F = T)$: $0.084 / 0.1$.)',
    },
]
