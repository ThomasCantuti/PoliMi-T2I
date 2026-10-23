TITLE = 'Exam · Sep 2025 · Telescopes: which networks are correct?'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Sep 2025', 'network structure', 'node ordering', 'conditional independence']

STATEMENT = r"""
*Written exam of 8 September 2025 — Uncertainty problem (from AIMA's exercises on network construction).*

Two astronomers in different parts of the world make measurements $M_1$ and $M_2$ of the number of stars $N$ in
some small region of the sky, using their telescopes. Normally there is a small probability $e$ of an error by
up to one star in each direction ($\pm 1$). Each telescope can also (with a much smaller probability $f$) be
badly out of focus (events $F_1$ and $F_2$), in which case the scientist will undercount by three or more stars
(or, if $N$ is less than 3, fail to detect any star at all).

```text
      (i)                       (ii)                        (iii)
  F1        F2            F1     N     F2            M1 ---------> M2
  |         |              \   /   \   /             |  \       /  |
  v         v               v v     v v              |   v     v   |
  M1        M2              M1       M2              |     N       |
    \      /                                         |   /   \     |
     v    v                                          v  v     v    v
       N                                             F1          F2
```

Arrows: (i) $F_1 \to M_1$, $F_2 \to M_2$, $M_1 \to N$, $M_2 \to N$. (ii) $F_1 \to M_1$, $N \to M_1$, $N \to M_2$,
$F_2 \to M_2$. (iii) $M_1 \to M_2$, $M_1 \to N$, $M_2 \to N$, $M_1 \to F_1$, $N \to F_1$, $N \to F_2$,
$M_2 \to F_2$.

- **Question 1:** which of these networks provide correct (but not necessarily efficient) representations of the
  information above? Answers must be adequately motivated.
- **Question 2:** for each network selected, list the probability distributions it represents.
"""

QUESTIONS = [
    {
        'q': 'Question 1: which networks are **correct** representations? (select **all**)',
        'options': ['(i)', '(ii)', '(iii)'],
        'answer': [1, 2],
        'explain': '**Model answer** (official): (i) depicts the "flow of information" during the calculation, but it is '
                   'incorrect as a network, since it says that given the measurements $M_1$ and $M_2$ the number of stars '
                   'is independent of the focus. (ii) correctly represents the causal structure: each measurement is '
                   'influenced by the actual number of stars and by the focus, and the two telescopes are independent of '
                   'each other. (iii) is correct but more complicated: it is the network obtained with the ordering '
                   '$M_1, M_2, N, F_1, F_2$.',
    },
    {
        'q': 'Which **false** independence claims does network (i) make? (select **all**)',
        'options': [
            '$N \\perp F_1 \\mid M_1, M_2$: once the measurements are known, the focus tells nothing more about $N$',
            '$M_1 \\perp M_2$: the two measurements are independent when nothing is observed',
            '$F_1 \\perp F_2$: the two focus problems are independent',
            '$N \\perp M_1$',
        ],
        'answer': [0, 1],
        'explain': 'In (i) the chain $F_1 \\to M_1 \\to N$ is blocked by $M_1$, and the v-structure $M_1 \\to N \\leftarrow M_2$ '
                   'is blocked when $N$ is unobserved. Both claims are false: a blurred telescope explains a low count '
                   '(so it changes our belief in $N$ even given $M_1$), and two measurements of the same stars are '
                   'correlated. $F_1 \\perp F_2$ is true in the domain too; (i) does not claim $N \\perp M_1$.',
    },
    {
        'q': 'Question 2: which distributions does network (ii) need?',
        'options': [
            '$P(F_1)$, $P(F_2)$, $P(N)$, $P(M_1 \\mid N, F_1)$, $P(M_2 \\mid N, F_2)$',
            '$P(F_1)$, $P(F_2)$, $P(N)$, $P(M_1 \\mid N)$, $P(M_1 \\mid F_1)$, $P(M_2 \\mid N)$, $P(M_2 \\mid F_2)$',
            '$P(F_1)$, $P(F_2)$, $P(N \\mid M_1, M_2)$, $P(M_1 \\mid F_1)$, $P(M_2 \\mid F_2)$',
            '$P(N)$, $P(M_1 \\mid N)$, $P(M_2 \\mid N)$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): one table per node given **all** its parents: $P(F_1)$, $P(F_2)$, $P(N)$, '
                   '$P(M_1 \\mid N, F_1)$, $P(M_2 \\mid N, F_2)$. The second option splits a CPT into one table per arrow; '
                   'the third is network (i).',
    },
    {
        'q': 'Question 2: which distributions does network (iii) need?',
        'options': [
            '$P(M_1)$, $P(M_2 \\mid M_1)$, $P(N \\mid M_1, M_2)$, $P(F_1 \\mid M_1, N)$, $P(F_2 \\mid M_2, N)$',
            '$P(M_1)$, $P(M_2)$, $P(N \\mid M_1, M_2)$, $P(F_1 \\mid N)$, $P(F_2 \\mid N)$',
            '$P(M_1)$, $P(M_2 \\mid M_1)$, $P(N \\mid M_1, M_2)$, $P(F_1 \\mid M_1, M_2, N)$, $P(F_2 \\mid M_1, M_2, N, F_1)$',
            '$P(F_1)$, $P(F_2)$, $P(N)$, $P(M_1 \\mid N, F_1)$, $P(M_2 \\mid N, F_2)$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): $P(M_1)$, $P(M_2 \\mid M_1)$, $P(N \\mid M_1, M_2)$, $P(F_1 \\mid M_1, N)$, '
                   '$P(F_2 \\mid M_2, N)$. The third option is the general chain rule with no independence used: correct '
                   'but it is not network (iii) — (iii) drops $M_2$ from the parents of $F_1$ because $F_1 \\perp M_2 \\mid '
                   'M_1, N$.',
    },
    {
        'q': 'Which node ordering produces network (iii) with the construction method (each node gets a minimal set of '
             'parents among its predecessors)?',
        'options': [
            '$M_1, M_2, N, F_1, F_2$',
            '$F_1, F_2, N, M_1, M_2$',
            '$N, M_1, M_2, F_1, F_2$',
            'No ordering: (iii) is not a valid network',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): ordering $M_1, M_2, N, F_1, F_2$. If you order $M_2$ before $M_1$ you get '
                   'the same network with the arrow $M_1 \\to M_2$ reversed. The causal ordering (second option) gives (ii). '
                   'Problem 80 (node ordering) runs this construction.',
    },
    {
        'q': 'Why is (ii) preferable to (iii), although both are correct?',
        'options': [
            'It follows the causal direction: fewer parameters (11 vs 15 if all variables were boolean) and numbers that '
            'are easy to assess (focus probability $f$, error probability $e$)',
            'Because (iii) contains a cycle',
            'Because (ii) has fewer nodes',
            'Because (iii) gives different values for the joint distribution',
        ],
        'answer': 0,
        'explain': 'Both represent the same joint distribution exactly. (iii) needs tables like $P(F_1 \\mid M_1, N)$, which '
                   'nobody knows directly, while (ii) needs exactly the quantities described in the text. (iii) has no '
                   'cycle (it is a DAG).',
    },
    {
        'q': '(Beyond the exam) In network (ii), are $F_1$ and $F_2$ independent given both measurements $M_1$, $M_2$?',
        'options': [
            'No: the trail $F_1 \\to M_1 \\leftarrow N \\to M_2 \\leftarrow F_2$ is active (two observed colliders, $N$ unobserved)',
            'Yes: they are roots, and roots are always independent',
            'Yes: $M_1$ and $M_2$ block every trail',
            'No: there is an arrow between them',
        ],
        'answer': 0,
        'explain': 'Observed common effects open their v-structures. Intuition: if both astronomers report very different '
                   'counts, one of the telescopes is probably out of focus; learning that $F_1$ is fine makes $F_2$ more '
                   'likely. Given $N$ as well, the fork at $N$ blocks the trail and they are independent again.',
    },
]
