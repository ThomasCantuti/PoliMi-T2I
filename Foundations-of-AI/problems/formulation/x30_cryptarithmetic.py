TITLE = 'Exam · Jan 2024 · Cryptarithmetic SAVE + MORE = MONEY as a search problem'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Jan 2024', 'problem formulation', 'search tree', 'depth of the goal', 'CSP']

STATEMENT = r"""
*Written exam of 18 January 2024 — Problem 2 (Search), Questions 1–4.*

Find the digits (0 to 9) to assign to the letters so that the operation is valid. Each letter has a unique value,
independent of where and how many times it appears.

```text
   S A V E +
   M O R E =
 ---------
 M O N E Y
```

1. Model the problem as a search problem: states, initial state, goal test, actions, step cost.
2. According to your formulation, what are the **minimum and maximum depths** of the search tree where a goal node
   can appear?
3. Draw a small portion of the search tree (at least the root and two nodes).
4. Is the representation as a search problem the best model for this problem? If not, which model and why?
"""

QUESTIONS = [
    {
        'q': 'Question 1: which formulation is correct (and is the one of the official solution)?',
        'options': [
            'State: a set of assignments letter → digit (a partial assignment). Initial state: {} . Action: add one '
            'assignment for a letter not yet assigned. Goal test: all letters assigned, with distinct digits, and the '
            'sum is correct. Step cost: 1',
            'State: the number SAVE + MORE computed so far. Initial state: 0. Action: add a digit. Goal test: the '
            'result is MONEY',
            'State: a letter. Action: move to the next letter. Goal test: the last letter Y is reached',
            'State: the list of the 10 digits. Action: remove a digit. Goal test: the list is empty',
        ],
        'answer': 0,
        'explain': '**Model answer:** "State: a set of assigned values, e.g. {A: 3} or {V: 5, E: 3}. Initial state: {}. '
                   'Actions: add an assignment (letter not yet assigned, digit) to the current set. Goal test: checks '
                   'whether the arithmetic operation is valid given the assignments (false if some letter is not '
                   'assigned). Step cost: always 1." (official answer). The distinctness of the digits can be checked '
                   'either in `actions` (only unused digits) or in the goal test. Usually the leading letters S and M must '
                   'also be non-zero.',
    },
    {
        'q': 'Question 2: in this formulation, what are the **minimum and maximum depths** at which a goal node can '
             'appear?',
        'options': [
            'Both 9: a goal needs all 9 letters (S, A, V, E, M, O, R, N, Y) assigned, one per action',
            'Minimum 1, maximum 9',
            'Minimum 5 (the letters of MONEY), maximum 9',
            'Minimum 9, maximum 10 (one level per digit)',
        ],
        'answer': 0,
        'explain': '**Model answer:** "A goal can only be a complete assignment of the 9 distinct letters S, A, V, E, M, '
                   'O, R, N, Y, and each action assigns exactly one letter: every goal node is at depth 9, so minimum = '
                   'maximum = 9." Count the **distinct** letters, not the letters written (E appears three times). '
                   'Like 8-queens, all solutions are at the same depth: optimality is not an issue and depth-first '
                   'search is the natural strategy.',
    },
    {
        'q': 'Question 3: drawing the portion of the tree, how many children does the **root** have in this '
             'formulation (any unassigned letter, any digit)?',
        'options': ['90', '10', '9', r'$9! = 362\,880$'],
        'answer': 0,
        'explain': r'**Model answer (drawing):** root `{}` with children such as `{S: 0}`, `{S: 1}`, …, `{A: 0}`, …: '
                   r'9 letters × 10 digits = **90** children; a child `{S: 9}` has children `{S: 9, A: 0}`, `{S: 9, A: 1}`, '
                   r'… The tree is huge: at depth 1 there are 90 nodes, and the branching factor only slowly decreases.',
    },
    {
        'q': 'In this formulation, how many different paths of the search tree lead to the **same** complete '
             'assignment? What does it suggest?',
        'options': [
            r'$9! = 362\,880$ (one per order in which the letters are assigned): fix the order of the letters, as in '
            r'the incremental 8-queens formulation, so that each assignment is reached by exactly one path',
            r'One: assignments are sets, so the order does not matter',
            r'$10! $: one per permutation of the digits',
            r'90: one per child of the root',
        ],
        'answer': 0,
        'explain': r'The **state** {S: 9, A: 3, …} is a set, but the **nodes** are paths: assigning S then A or A then S '
                   r'gives two nodes with the same state. Fixing the letter order (S, then A, then V, …) and allowing only '
                   r'unused digits leaves at most $10 \cdot 9 \cdots 2 = 3\,628\,800$ leaves, each a different assignment. '
                   r'That is exactly how a CSP backtracking search works (next question).',
    },
    {
        'q': 'Question 4: is the search representation the best model for this problem?',
        'options': [
            'No: a **CSP** is better. Variables = letters (plus the column carries), domains = digits 0–9, constraints = '
            'all-different and the column equations; backtracking checks the constraints on partial assignments and '
            'prunes as soon as one is violated',
            'Yes: the generic search problem is always the best model, because it makes no assumption on the state',
            'No: local search is better, because the problem has a single solution',
            'No: it must be modelled as a game against the person who wrote the puzzle',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "No. As for 8-queens, at every step we add an assignment and the validity depends '
                   r'on constraints among the letters: it is naturally a CSP. With a **factored** state (variables S, A, '
                   r'…, Y and carries $C_1..C_4$, domains $\{0..9\}$, constraints AllDiff, $E + E = Y + 10C_1$, '
                   r'$V + R + C_1 = E + 10C_2$, $A + O + C_2 = N + 10C_3$, $S + M + C_3 = O + 10C_4$, $C_4 = M$, $S, M \ne 0$) '
                   r'backtracking with forward checking and MRV detects dead ends long before depth 9 (e.g. $M = 1$ '
                   r'immediately)." The generic search only checks the sum at the goal test, so it explores blindly. '
                   r'With $S, M \ne 0$ the puzzle has 4 solutions, e.g. 9376 + 1086 = 10462.',
    },
]
