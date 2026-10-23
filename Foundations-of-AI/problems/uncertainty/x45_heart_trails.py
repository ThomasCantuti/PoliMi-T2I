TITLE = 'Exam · Jan 2025 · Heart-disease network: active trails'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Jan 2025', 'active trail', 'v-structure', 'd-separation']

STATEMENT = r"""
*Written exam of 16 January 2025 — Uncertainty problem, Questions 3–4 (same in versions A and B).*

```text
    Exercise (E)            Diet (D)
           \               /       \
            v             v         v
          HeartDisease (HD)       HeartBurn (Hb)
           /            \           /
          v              v         v
   BloodPressure (BP)    ChestPain (CP)
```

- **Question 3:** list at least four active trails involving at least three variables given that
  HeartBurn = Yes.
- **Question 4:** suppose that we also know that HeartDisease = Yes. How does this modify the list of all the
  possible active trails?

Rules: a trail is active iff every v-structure $X \to Y \leftarrow Z$ on it has $Y$ or a descendant of $Y$
observed, and no other node of the trail (endpoints included) is observed.
"""

QUESTIONS = [
    {
        'q': 'Given $Hb$ = yes, which trails are **active**? (select **all**)',
        'options': [
            '$E \\to HD \\to CP$',
            '$D \\to HD \\to BP$',
            '$BP \\leftarrow HD \\to CP$',
            '$D \\to Hb \\to CP$',
            '$E \\to HD \\leftarrow D$',
            '$E \\to HD \\to CP \\leftarrow Hb$',
        ],
        'answer': [0, 1, 2],
        'explain': '$HD$ is not observed, so chains and forks through it are active. $D \\to Hb \\to CP$ is a chain through '
                   'the **observed** $Hb$: blocked. $E \\to HD \\leftarrow D$ is a v-structure and neither $HD$ nor its '
                   'descendants (BP, CP) are observed: blocked. The last trail ends in the observed $Hb$ (and its collider '
                   '$CP$ is not observed).',
    },
    {
        'q': 'Question 3: how many distinct active trails with at least three variables are there given $Hb$ = yes '
             '(a trail and its reverse counted once)?',
        'options': ['5', '4', '8', '3'],
        'answer': 0,
        'explain': '**Model answer** (official): $E \\to HD \\to CP$, $E \\to HD \\to BP$, $D \\to HD \\to CP$, '
                   '$D \\to HD \\to BP$, $BP \\leftarrow HD \\to CP$, and the reverses of the first four. Every longer trail '
                   'passes through $Hb$ (observed, not a collider), through $CP$ as an unobserved collider, or through '
                   '$E \\to HD \\leftarrow D$ (blocked). Listing four of them, with the reason, was enough for full marks.',
    },
    {
        'q': 'Question 4: we also observe $HD$ = yes. Which trails with at least three variables are active now?',
        'options': [
            'Only $E \\to HD \\leftarrow D$',
            'The same five as before',
            'None',
            '$E \\to HD \\leftarrow D$ and $BP \\leftarrow HD \\to CP$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): all the trails passing through $HD$ as a chain or a fork become inactive, '
                   'but the v-structure $E \\to HD \\leftarrow D$ becomes active, since its middle node is observed. $BP$ '
                   'and $CP$ are now cut off: every trail from them goes through $HD$ or $Hb$, both observed.',
    },
    {
        'q': 'Given only $Hb$ = yes, are Exercise and Diet independent?',
        'options': [
            'Yes: their trails $E \\to HD \\leftarrow D$ and $E \\to HD \\to CP \\leftarrow Hb \\leftarrow D$ are both blocked',
            'No: $Hb$ is a child of $D$, so observing it opens the v-structure at $HD$',
            'No: they have a common child',
            'It depends on the numbers in the tables',
        ],
        'answer': 0,
        'explain': '$Hb$ is not a descendant of $HD$, so it does not open $E \\to HD \\leftarrow D$; the long trail is blocked '
                   'at $CP$ (unobserved collider) and at $Hb$ (observed chain node). They are d-separated, hence independent '
                   'for any CPTs. Observing $CP$ instead (a descendant of $HD$) would make them dependent.',
    },
    {
        'q': 'Which variables form the Markov blanket of HeartDisease?',
        'options': [
            'E, D, BP, CP, Hb',
            'E, D, BP, CP',
            'E, D',
            'all the other variables',
        ],
        'answer': 0,
        'explain': 'Parents (E, D), children (BP, CP) and the children\'s other parents (Hb, parent of CP). Given these five, '
                   'HD is independent of everything else — here there is nothing else left.',
    },
]
