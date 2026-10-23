TITLE = 'Acting under uncertainty and probability basics'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['uncertainty', 'degree of belief', 'marginalization', "Bayes' rule", 'independence']

STATEMENT = r"""
Why logic is not enough, what a probability means for an agent, and the rules you need for every exam exercise:
marginalization, conditioning, Bayes' rule, independence (AIMA §12.1–12.5). Use the dentist table:

| | toothache, catch | toothache, ¬catch | ¬toothache, catch | ¬toothache, ¬catch |
|---|---|---|---|---|
| **cavity** | 0.108 | 0.012 | 0.072 | 0.008 |
| **¬cavity** | 0.016 | 0.064 | 0.144 | 0.576 |
"""

QUESTIONS = [
    {
        'q': 'Why does a logical rule like $Toothache \\Rightarrow Cavity$ fail for dental diagnosis? '
             '(select **all** the reasons given in AIMA §12.1)',
        'options': [
            '**Laziness**: listing every antecedent and consequent needed for an exceptionless rule is too much work.',
            '**Theoretical ignorance**: medicine has no complete theory of the domain.',
            '**Practical ignorance**: even knowing all the rules, we cannot run every test on this patient.',
            'Logic cannot represent disjunctions such as $Cavity \\vee GumProblem$.',
        ],
        'answer': [0, 1, 2],
        'explain': 'Logic *can* write the disjunction, but the list never ends and we could not check it anyway. '
                   'Probability **summarizes** the uncertainty that comes from laziness and ignorance.',
    },
    {
        'q': 'An agent believes "the patient has a cavity" with probability 0.8 after seeing a toothache. This number is…',
        'options': [
            'a **degree of belief**, relative to the evidence the agent has; it changes with new evidence',
            'a **degree of truth**: the cavity is 80% true',
            'a property of the patient that does not depend on what the agent knows',
            'the probability that the rule $Toothache \\Rightarrow Cavity$ is valid in 80% of the models',
        ],
        'answer': 0,
        'explain': 'Probability theory describes degrees of **belief** in propositions that are either true or false; '
                   'degrees of **truth** are the business of fuzzy logic. The cavity is there or not; the agent just '
                   'does not know. Every probability is conditioned on the agent\'s current evidence.',
    },
    {
        'q': 'Plan $A_{1440}$ (leave for the airport 24 hours before the flight) almost surely makes the flight. Why is it '
             'not the rational choice?',
        'options': [
            'Rational choice needs **preferences** too: decision theory = probability theory + utility theory; the agent '
            'maximizes **expected utility**, and a night at the airport has a very low utility.',
            'Because its probability of success is lower than that of $A_{90}$.',
            'Because a rational agent must be certain of the outcome before acting.',
            'Because probabilities cannot be attached to plans.',
        ],
        'answer': 0,
        'explain': 'AIMA §12.1.2: the rational action is the one with **maximum expected utility** (MEU) averaged over its '
                   'possible outcomes, not the most likely to succeed.',
    },
    {
        'q': 'From the dentist table, $P(cavity \\vee toothache)$ = ?',
        'options': ['0.28', '0.20', '0.40', '0.108'],
        'answer': 0,
        'explain': 'Sum the worlds where the proposition holds: the whole cavity row (0.2) plus the ¬cavity worlds with '
                   'toothache, $0.016 + 0.064$: $0.28$. Equivalently $P(cavity) + P(toothache) - P(cavity \\wedge '
                   'toothache) = 0.2 + 0.2 - 0.12$.',
    },
    {
        'q': 'Which is the **marginalization** formula (asked verbatim on 6 Feb 2024)?',
        'options': [
            '$P(X = x_i) = \\sum_j P(X = x_i \\wedge Y = y_j)$',
            '$P(X = x_i) = \\prod_j P(X = x_i \\wedge Y = y_j)$',
            '$P(X = x_i) = \\sum_j P(X = x_i \\mid Y = y_j)$',
            '$P(X = x_i) = \\sum_i P(X = x_i \\wedge Y = y_j)$',
        ],
        'answer': 0,
        'explain': 'Sum the joint over **every value of the other variable**. The third option forgets the weights: the '
                   'correct "conditioning" form is $\\sum_j P(X = x_i \\mid Y = y_j)\\,P(Y = y_j)$. The last one sums over '
                   'the wrong index.',
    },
    {
        'q': '$P(cavity \\mid toothache)$ = ?',
        'options': ['0.6', '0.12', '0.108', '0.2'],
        'answer': 0,
        'explain': '$P(cavity \\wedge toothache) / P(toothache) = (0.108 + 0.012) / (0.108 + 0.012 + 0.016 + 0.064) = '
                   '0.12 / 0.2 = 0.6$. With normalization: $\\alpha \\langle 0.12, 0.08 \\rangle = \\langle 0.6, 0.4 \\rangle$. '
                   '0.12 is the **joint**, not the conditional.',
    },
    {
        'q': 'Which statements are equivalent to "$X$ and $Y$ are independent"? (select **all**)',
        'options': [
            '$P(x \\mid y) = P(x)$ for all values with $P(y) > 0$',
            '$P(x \\wedge y) = P(x)\\,P(y)$ for all values',
            '$P(y \\mid x) = P(y)$ for all values with $P(x) > 0$',
            '$P(x \\wedge y) = P(x) + P(y)$ for all values',
        ],
        'answer': [0, 1, 2],
        'explain': 'The three forms are equivalent by the product rule. Adding probabilities is for **mutually exclusive** '
                   'events (disjunctions), not for independent ones.',
    },
    {
        'q': 'In the dentist table, Toothache and Catch are…',
        'options': [
            'dependent, but conditionally independent given Cavity',
            'independent, and conditionally independent given Cavity',
            'independent, but dependent given Cavity',
            'dependent, also given Cavity',
        ],
        'answer': 0,
        'explain': '$P(toothache \\wedge catch) = 0.124 \\ne P(toothache)\\,P(catch) = 0.2 \\cdot 0.34 = 0.068$: dependent, '
                   'because both are effects of the cavity. Given the cavity: $0.108 / 0.2 = 0.54 = 0.6 \\cdot 0.9$, and the '
                   'same holds for ¬cavity ($0.016 / 0.8 = 0.02 = 0.1 \\cdot 0.2$): conditionally independent.',
    },
    {
        'q': 'Meningitis causes a stiff neck 70% of the time; $P(m) = 1/50000$, $P(s) = 0.01$. $P(m \\mid s)$ = ?',
        'options': ['0.0014', '0.7', '0.00002', '0.014'],
        'answer': 0,
        'explain': 'Bayes\' rule: $P(m \\mid s) = P(s \\mid m) P(m) / P(s) = 0.7 \\cdot 0.00002 / 0.01 = 0.0014$. The '
                   'evidence multiplies the belief by 70, but a tiny prior keeps the posterior small (AIMA §12.5.1).',
    },
    {
        'q': 'Why do knowledge bases store $P(s \\mid m)$ (causal) rather than $P(m \\mid s)$ (diagnostic)?',
        'options': [
            'The causal direction is more **robust**: an epidemic changes $P(m)$ and therefore $P(m \\mid s)$, but not how '
            'meningitis produces a stiff neck; Bayes\' rule recomputes the diagnostic number when needed.',
            'Because $P(m \\mid s)$ cannot be computed.',
            'Because $P(s \\mid m) = P(m \\mid s)$ anyway.',
            'Because the diagnostic direction violates the axioms of probability.',
        ],
        'answer': 0,
        'explain': 'Causal knowledge describes a mechanism; diagnostic knowledge mixes the mechanism with the current '
                   'priors. This is also why Bayesian networks are built in the causal direction.',
    },
    {
        'q': 'Assuming Toothache and Catch conditionally independent given Cavity, with $P(cavity) = 0.2$, '
             '$P(toothache \\mid Cavity) = \\langle 0.6, 0.1 \\rangle$, $P(catch \\mid Cavity) = \\langle 0.9, 0.2 \\rangle$: '
             '$P(cavity \\mid toothache \\wedge catch)$ = ?',
        'options': ['0.871', '0.108', '0.54', '0.6'],
        'answer': 0,
        'explain': '$\\alpha \\langle 0.6 \\cdot 0.9 \\cdot 0.2,\\ 0.1 \\cdot 0.2 \\cdot 0.8 \\rangle = \\alpha \\langle 0.108, '
                   '0.016 \\rangle = \\langle 0.871, 0.129 \\rangle$: the same value as the full table ($0.108 / 0.124$). '
                   'One cause with conditionally independent effects is the naive Bayes model.',
    },
    {
        'q': 'How many independent numbers does the full joint distribution of $n$ boolean variables need?',
        'options': ['$2^n - 1$', '$2^n$', '$n$', '$n \\cdot 2^{n-1}$'],
        'answer': 0,
        'explain': '$2^n$ worlds, and they must sum to 1, so the last one is determined. With 30 variables that is over a '
                   'billion numbers: the reason for Bayesian networks.',
    },
]
