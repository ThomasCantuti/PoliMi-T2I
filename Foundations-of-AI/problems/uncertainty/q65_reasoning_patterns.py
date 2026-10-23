TITLE = 'Reading the graph: reasoning patterns and active trails'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['causal reasoning', 'evidential reasoning', 'explaining away', 'active trail', 'd-separation']

STATEMENT = r"""
How evidence flows in a network: causal, evidential and intercausal reasoning, and the trail rules
(AIMA §13.2.1; exams 12 Jul 2024 and 16 Jan 2025). Student network (priors of 12 Jul 2024:
$P(d_1) = 0.9$, $P(k_1) = 0.3$):

```text
   Difficulty {d0, d1}          Knowledge {k0, k1}
              \                /           \
               v              v             v
              Grade {g1, g2, g3}         Test {s0, s1}
                     |
                     v
              Letter {L0, L1}
```
"""

QUESTIONS = [
    {
        'q': 'Which query is an example of **causal** (predictive) reasoning?',
        'options': [
            '$P(L_1 \\mid k_1)$: the student studied a lot; will she get a recommendation letter?',
            '$P(k_1 \\mid g_3)$: she got a C; did she know the material?',
            '$P(d_1 \\mid g_3)$: she got a C; was the course hard?',
            '$P(k_1 \\mid g_3, d_1)$',
        ],
        'answer': 0,
        'explain': 'Causal reasoning goes **down** the arrows, from causes (the priors Difficulty, Knowledge) to effects: '
                   '$P(L_1) = 0.360$ rises to $P(L_1 \\mid k_1) = 0.655$. The next two are evidential (up the arrows), the '
                   'last one intercausal.',
    },
    {
        'q': 'She got a C ($g_3$). How do $P(k_1)$ and $P(d_1)$ change (evidential reasoning)?',
        'options': [
            '$P(k_1)$: 0.3 → 0.106 (down); $P(d_1)$: 0.9 → 0.958 (up)',
            '$P(k_1)$: 0.3 → 0.3; $P(d_1)$: 0.9 → 0.9 (roots cannot change)',
            '$P(k_1)$: 0.3 → 0.7 (up); $P(d_1)$: 0.9 → 0.5 (down)',
            '$P(k_1)$: 0.3 → 0.106; $P(d_1)$ unchanged, because Difficulty and Knowledge are independent',
        ],
        'answer': 0,
        'explain': 'Evidence flows **up** the arrows too: a bad grade is explained by low knowledge or a hard course, and both '
                   'become more likely. Priors are beliefs before the evidence; posteriors can differ. Independence of the '
                   'two roots does not stop the grade from informing each of them.',
    },
    {
        'q': 'Now we also learn the course was hard ($d_1$): $P(k_1 \\mid g_3) = 0.106$ but $P(k_1 \\mid g_3, d_1) = 0.109$, '
             'while $P(k_1 \\mid g_3, d_0) = 0.028$. What is going on?',
        'options': [
            '**Intercausal** reasoning (explaining away): the hard course explains part of the C, so low knowledge is needed '
            'less; a C in an easy course is strong evidence of low knowledge',
            'A rounding error: Difficulty and Knowledge are independent, so $d$ cannot change $P(k_1)$',
            'Causal reasoning from Difficulty to Knowledge along the arrow $D \\to K$',
            'Evidential reasoning from Letter',
        ],
        'answer': 0,
        'explain': 'Difficulty and Knowledge are independent a priori, but **given the common effect Grade** the v-structure '
                   '$D \\to G \\leftarrow K$ is active, and one cause changes the belief in the other. There is no arrow '
                   'between D and K.',
    },
    {
        'q': 'In which triples is the trail $X - Y - Z$ **active** when the middle node $Y$ is **observed**? (select **all**)',
        'options': [
            '$X \\to Y \\leftarrow Z$ (common effect, v-structure)',
            '$X \\to Y \\to Z$ (chain)',
            '$X \\leftarrow Y \\to Z$ (common cause)',
            '$X \\leftarrow Y \\leftarrow Z$ (chain the other way)',
        ],
        'answer': [0],
        'explain': 'Observing the middle node **blocks** chains and forks (it screens off), and **opens** v-structures. Without '
                   'evidence it is the opposite: chains and forks active, v-structures blocked (unless a descendant of $Y$ '
                   'is observed).',
    },
    {
        'q': 'Student network: are Difficulty and Test independent? And given Letter?',
        'options': [
            'Independent; dependent given Letter',
            'Dependent; independent given Letter',
            'Independent in both cases',
            'Dependent in both cases',
        ],
        'answer': 0,
        'explain': 'The only trail is $D \\to G \\leftarrow K \\to T$. Without evidence the v-structure at G blocks it. Letter '
                   'is a **descendant** of Grade: observing it opens $D \\to G \\leftarrow K$, and $K \\to T$ is an '
                   'unobserved chain, so the trail is active.',
    },
    {
        'q': 'Student network: which pairs are d-separated given **Grade**? (select **all**)',
        'options': ['Letter and Test', 'Letter and Knowledge', 'Difficulty and Knowledge', 'Difficulty and Test'],
        'answer': [0, 1],
        'explain': 'Grade blocks every trail **through** it as a chain or fork: $L \\leftarrow G \\leftarrow K \\to T$ and '
                   '$L \\leftarrow G \\leftarrow K$. But Grade is the collider of $D \\to G \\leftarrow K$: observing it makes '
                   'Difficulty and Knowledge dependent, and Difficulty and Test as well ($D \\to G \\leftarrow K \\to T$).',
    },
    {
        'q': 'Burglary network ($B \\to A \\leftarrow E$, $A \\to J$, $A \\to M$). We only know that John called. Are '
             'Burglary and Earthquake independent?',
        'options': [
            'No: JohnCalls is a descendant of the common effect Alarm, so the v-structure is active',
            'Yes: Alarm is not observed, so the v-structure is blocked',
            'Yes: Burglary and Earthquake are roots, roots are always independent',
            'No: there is an arrow between Burglary and Earthquake',
        ],
        'answer': 0,
        'explain': 'A v-structure is opened by observing its middle node **or any descendant** of it: John\'s call is evidence '
                   'about the alarm. Roots are independent only when nothing below their common effects is observed.',
    },
    {
        'q': 'Network $X \\to Y \\to Z$, $Y \\to W \\leftarrow V$. Which trails are **active** given the evidence $\\{W\\}$? '
             '(select **all**)',
        'options': ['$Y \\to W \\leftarrow V$', '$X \\to Y \\to Z$', '$X \\to Y \\to W \\leftarrow V$',
                    '$Z \\leftarrow Y \\to W$'],
        'answer': [0, 1, 2],
        'explain': '$W$ is observed: the v-structure $Y \\to W \\leftarrow V$ opens. $X \\to Y \\to Z$ does not touch $W$ '
                   'and $Y$ is unobserved: active. $X \\to Y \\to W \\leftarrow V$: chain through unobserved $Y$, observed '
                   'collider $W$: active. $Z \\leftarrow Y \\to W$ ends in the observed node $W$: a trail with an observed '
                   'endpoint is not counted (no influence can flow towards a variable whose value we know).',
    },
]
