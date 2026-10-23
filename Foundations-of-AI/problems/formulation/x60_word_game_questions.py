TITLE = 'Exam · Jul 2026 · Word-concatenation game: branching factor, paths, depth bound, A*'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Jul 2026', 'branching factor', 'depth of the goal', 'admissible heuristic']

STATEMENT = r"""
*Written exam of 8 July 2026 — Problem 1 (Search), Questions 1–4.*

A solver for a word game is given a **list of strings** and a **target string**. The state is the list of strings;
the only action **concatenates two strings** of the list: both are removed and the result is added. Example: from
`["A", "B", "C", "B"]` (the two `"B"` are indistinguishable), concatenating `"A"` and the first `"B"` gives
`["AB", "C", "B"]`; concatenating `"B"` and `"B"` gives `["BB", "A", "C"]`. A goal state is any list that contains
the target (`["BB", "A", "C"]` and `["A", "C", "BB"]` are both goal states for target `"BB"`).

The code problem on the same exam implements this formulation.
"""

QUESTIONS = [
    {
        'q': 'Question 1: the initial state consists of $L$ **unique** strings. What is the **maximum branching '
             'factor**?',
        'options': [r'$L(L-1)$', r'$L^2$', r'$L(L-1)/2$', r'$L - 1$'],
        'answer': 0,
        'explain': r'**Model answer:** "An action chooses an ordered pair of two different strings ($x$ then $y$; '
                   r'$x + y \ne y + x$ in general): $L(L-1)$ actions. The list shrinks by one string per action, so the '
                   r'maximum is at the initial state: $b = L(L-1) = O(L^2)$." '
                   r'**Discrepancy with the official solution**, which answers $L^2$: that counts also the $L$ pairs '
                   r'$(x, x)$, but a string cannot be concatenated with itself (both operands are removed from the list, '
                   r'and the strings are unique). $L^2$ is a correct upper bound and the same order of magnitude; the exact '
                   r'maximum is $L(L-1)$. $L(L-1)/2$ forgets that concatenation is not commutative. Distinct successor '
                   r'*states* can be fewer (e.g. `"a" + "aa"` = `"aa" + "a"`).',
    },
    {
        'q': 'Question 2: can there be **multiple paths** from the start state to a goal state? (answer with an '
             'example)',
        'options': [
            'Yes: from ["A", "B", "C"] with target "ABC", either A+B then AB+C, or B+C then A+BC; the order of the '
            'concatenations does not matter',
            'No: each action removes two strings, so the same state can never be reached twice',
            'No: the target string determines a unique sequence of concatenations',
            'Only if the list contains duplicate strings',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Yes. The goal is to generate the target string and the order of the actions is '
                   'unimportant: from [A, B, C] with target ABC, A+B then AB+C and B+C then A+BC are two different paths '
                   'to the goal state [ABC]." Independent concatenations (on disjoint strings) also commute: [A, B, C, D] '
                   '→ A+B then C+D, or C+D then A+B, reach the same state [AB, CD]. Hence repeated states, and graph '
                   'search is worth its memory.',
    },
    {
        'q': r'Question 3: the initial state contains $L$ strings with minimum, maximum and average lengths $S_{min}$, '
             r'$S_{max}$, $S_{avg}$; the goal string has length $T$. Give an **upper bound for the depth of a shallowest '
             r'goal** (when a goal is reachable).',
        'options': [
            r'$T / S_{min}$ (more precisely $\lfloor T / S_{min} \rfloor - 1$): the target is made of at most '
            r'$T / S_{min}$ original strings, and $k$ pieces need $k - 1$ concatenations',
            r'$L^2$, the branching factor',
            r'$T / S_{max}$',
            r'$T \cdot S_{avg}$',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "Every concatenation that builds the target adds a piece of at least $S_{min}$ '
                   r'characters, so the target is made of at most $T / S_{min}$ original strings and the shallowest goal '
                   r'is at depth at most $T / S_{min}$" (official answer). Tight version: $k \le \lfloor T/S_{min} \rfloor$ '
                   r'pieces need $k - 1$ actions, so depth $\le \lfloor T/S_{min} \rfloor - 1$ (and also $\le L - 1$); '
                   r'extra concatenations of strings that are not part of the target are never needed. $T/S_{max}$ is a '
                   r'**lower** bound on the number of pieces, not an upper bound.',
    },
    {
        'q': 'Question 4: given two **admissible** heuristics $H_1$ and $H_2$, can A* tree search with $H_1$ find a '
             '**lower-cost** solution than A* tree search with $H_2$?',
        'options': [
            'No: with any admissible heuristic A* tree search returns an optimal (lowest-cost) solution, so both '
            'return the same cost (possibly different paths, and with different numbers of expansions)',
            'Yes, if $H_1$ dominates $H_2$',
            'Yes, if $H_2$ is not consistent',
            'It depends on the tie-breaking rule',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "No: A* tree search with an admissible heuristic is optimal, so both find a '
                   r'lowest-cost solution" (official answer). Dominance ($H_1 \ge H_2$) changes how many nodes are '
                   r'expanded, not the cost found; ties can change *which* optimal path is returned, not its cost. '
                   r'Consistency matters only for **graph** search, and here the question says tree search.',
    },
]
