TITLE = 'Bayesian networks: semantics, compactness and construction'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['Bayesian network', 'chain rule', 'Markov blanket', 'node ordering', 'noisy-OR']

STATEMENT = r"""
What a Bayesian network is, what it means, how big it is, how to build it (AIMA §13.1–13.2.2). Burglary network
(AIMA Figure 13.2): $P(b) = 0.001$, $P(e) = 0.002$; $P(a \mid B, E) = 0.95, 0.94, 0.29, 0.001$ for
$(B, E) = (t,t), (t,f), (f,t), (f,f)$; $P(j \mid A) = 0.90 / 0.05$, $P(m \mid A) = 0.70 / 0.01$ for $A = t / f$.

```text
   Burglary      Earthquake
         \        /
          v      v
           Alarm
          /     \
         v       v
   JohnCalls   MaryCalls
```
"""

QUESTIONS = [
    {
        'q': 'Which is the definition of a Bayesian network?',
        'options': [
            'A **directed acyclic** graph whose nodes are random variables, each with a table $P(X_i \\mid Parents(X_i))$',
            'An undirected graph with one probability table per edge',
            'A directed graph (cycles allowed) with the prior $P(X_i)$ of each node',
            'A directed acyclic graph where each arrow carries the probability $P(\\text{child} \\mid \\text{parent})$',
        ],
        'answer': 0,
        'explain': 'One CPT **per node**, conditioned on **all** its parents jointly (a CPT with two parents has a row for '
                   'each pair of values, not one number per arrow). Cycles are not allowed: the chain rule needs an order.',
    },
    {
        'q': 'Which formula gives the joint distribution of a network (6 Feb 2024, Question 2)?',
        'options': [
            '$P(X_1, \\dots, X_n) = \\prod_i P(X_i \\mid \\text{Parents}_G(X_i))$',
            '$P(X_1, \\dots, X_n) = \\prod_i P(X_i)$',
            '$P(X_1, \\dots, X_n) = \\sum_i P(X_i \\mid \\text{Parents}_G(X_i))$',
            '$P(X_1, \\dots, X_n) = \\prod_i P(\\text{Parents}_G(X_i) \\mid X_i)$',
        ],
        'answer': 0,
        'explain': 'The chain rule of Bayesian networks: one factor per node, each conditioned on its parents. The second '
                   'option would claim that all the variables are independent.',
    },
    {
        'q': '$P(j, m, a, \\neg b, \\neg e)$ = ?',
        'options': [
            '$0.90 \\cdot 0.70 \\cdot 0.001 \\cdot 0.999 \\cdot 0.998 \\approx 0.000628$',
            '$0.90 \\cdot 0.70 \\cdot 0.001 \\cdot 0.001 \\cdot 0.002$',
            '$0.90 \\cdot 0.70 \\cdot 0.999 \\cdot 0.999 \\cdot 0.998$',
            '$0.90 \\cdot 0.70 \\cdot 0.001$',
        ],
        'answer': 0,
        'explain': '$P(j \\mid a)\\,P(m \\mid a)\\,P(a \\mid \\neg b, \\neg e)\\,P(\\neg b)\\,P(\\neg e)$. For the negated roots '
                   'use $1 - p$; for the alarm use the row $(f, f)$ with **its** True column, $0.001$.',
    },
    {
        'q': 'A boolean node with 3 boolean parents: how many independent numbers does its CPT need?',
        'options': ['8', '3', '16', '6'],
        'answer': 0,
        'explain': 'One row per combination of the parents\' values, $2^3 = 8$ rows, and one free number per row (the other '
                   'column is $1 - p$). In general $2^k$ for $k$ parents.',
    },
    {
        'q': 'How many numbers does the burglary network need, and how many the full joint distribution of its 5 variables?',
        'options': ['10 and 31', '10 and 32', '5 and 31', '13 and 31'],
        'answer': 0,
        'explain': '$1 + 1 + 4 + 2 + 2 = 10$ against $2^5 - 1 = 31$. With $n = 30$ nodes and at most 5 parents: '
                   '$30 \\cdot 2^5 = 960$ against more than a billion (AIMA §13.2).',
    },
    {
        'q': 'Which independences follow directly from the **local semantics** (each node is conditionally independent of '
             'its non-descendants given its parents)? (select **all**)',
        'options': [
            'JohnCalls ⊥ {Burglary, Earthquake, MaryCalls} given Alarm',
            'Burglary ⊥ Earthquake',
            'Burglary ⊥ Earthquake given Alarm',
            'MaryCalls ⊥ JohnCalls',
        ],
        'answer': [0, 1],
        'explain': 'JohnCalls\' parent is Alarm and its non-descendants are B, E, M. Burglary is a root: its parents are the '
                   'empty set and Earthquake is a non-descendant, so they are (marginally) independent. Given Alarm (a '
                   '**descendant**) they become dependent; the two calls share the cause Alarm, so they are dependent unless '
                   'Alarm is known.',
    },
    {
        'q': 'The **Markov blanket** of Alarm is…',
        'options': [
            'Burglary, Earthquake, JohnCalls, MaryCalls (parents, children, children\'s other parents)',
            'Burglary and Earthquake (its parents)',
            'JohnCalls and MaryCalls (its children)',
            'every node of the network',
        ],
        'answer': 0,
        'explain': 'Parents + children + the other parents of the children (none here). Given its Markov blanket a node is '
                   'conditionally independent of every other node. In the heart network of 16 Jan 2025 the blanket of '
                   'HD is E, D (parents), BP, CP (children) and Hb (other parent of CP).',
    },
    {
        'q': 'Building the burglary network with the ordering MaryCalls, JohnCalls, Earthquake, Burglary, Alarm gives…',
        'options': [
            'a fully connected network with 31 numbers: correct, but no more compact than the full joint',
            'an incorrect network',
            'the original network with 10 numbers',
            'a network with 13 numbers',
        ],
        'answer': 0,
        'explain': 'Every ordering gives a **correct** network, but a diagnostic one adds arrows: here each node needs all '
                   'its predecessors as parents, $1 + 2 + 4 + 8 + 16 = 31$ (AIMA Figure 13.3). M, J, A, B, E gives 13. '
                   'Causes first gives the most compact network, with numbers that are easy to estimate.',
    },
    {
        'q': 'When is a network a **correct** (not necessarily efficient) representation of a domain?',
        'options': [
            'When every conditional independence it claims (through missing arrows) really holds in the domain',
            'Only when all the arrows go from causes to effects',
            'Only when it has the minimum number of arrows',
            'When every pair of variables is connected by an arrow',
        ],
        'answer': 0,
        'explain': 'Missing arrows are claims; extra arrows are only inefficiency. So a fully connected network is always '
                   'correct, and a sparse one can be wrong. This is the key to the telescope question of 8 Sep 2025.',
    },
    {
        'q': 'Noisy-OR (AIMA §13.2.2): $q_{cold} = 0.6$, $q_{flu} = 0.2$, $q_{malaria} = 0.1$ are the probabilities that '
             'each cause alone fails to produce fever. $P(fever \\mid cold, flu, \\neg malaria)$ = ?',
        'options': ['0.88', '0.12', '0.8', '0.988'],
        'answer': 0,
        'explain': 'The inhibitors are independent: $P(\\neg fever \\mid cold, flu, \\neg malaria) = q_{cold}\\,q_{flu} = 0.12$, '
                   'so $P(fever) = 0.88$. With all three causes: $1 - 0.6 \\cdot 0.2 \\cdot 0.1 = 0.988$. Noisy-OR needs '
                   '$k$ numbers instead of $2^k$ rows.',
    },
    {
        'q': 'Which are compact ways to specify a CPT mentioned in AIMA §13.2.2? (select **all**)',
        'options': [
            'Deterministic nodes ($NorthAmerican \\Leftrightarrow Canadian \\vee US \\vee Mexican$)',
            'Noisy-OR',
            'Context-specific independence (a parent matters only for some values of the other parents)',
            'Replacing the CPT with the prior of the node',
        ],
        'answer': [0, 1, 2],
        'explain': 'All three exploit structure inside the CPT. Replacing it with the prior would delete the arrows, i.e. '
                   'claim independences that may be false.',
    },
]
