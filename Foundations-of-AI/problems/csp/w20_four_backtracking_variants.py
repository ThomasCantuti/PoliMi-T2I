TITLE = 'Exercise book 3.2 · Backtracking, FC, MRV, LCV on the same table CSP'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exercise book', 'backtracking', 'forward checking', 'MRV', 'LCV', 'hand simulation']

STATEMENT = r"""
*Exercise book, Exercise 3.2.* Constraints are sets of allowed combinations:

```text
Variables: X1, X2, X3      Domains: D1 = {1, 2, 3, 4}, D2 = {a, b, c}, D3 = {α, β, γ}
C(X1, X2) = {<1,a>, <2,b>, <3,a>, <3,b>, <4,b>}
C(X1, X3) = {<1,β>, <3,β>, <4,β>}
C(X2, X3) = {<a,γ>, <b,β>, <b,α>, <c,γ>}
```

Solve it with (1) backtracking, (2) backtracking + forward checking, (3) backtracking + MRV + forward checking,
(4) backtracking + MRV + LCV + forward checking. When not specified, follow the **lexicographic order** (variables
X1, X2, X3; values as listed). Draw each tree on paper, with the domains after every forward-checking step, then
answer.
"""

QUESTIONS = [
    {
        'q': 'How many solutions does the CSP have, and which one does **plain backtracking** (lexicographic order) return?',
        'options': [
            'One solution, X1 = 3, X2 = b, X3 = β',
            'Two solutions, (3, b, β) and (4, b, β); backtracking returns (3, b, β)',
            'Two solutions; backtracking returns (4, b, β)',
            'Three solutions, including (1, a, β)',
        ],
        'answer': 1,
        'explain': 'X3 = β is the only value with partners in C(X1, X3), so X1 ∈ {1, 3, 4}; X2 must pair with β → X2 = b; '
                   'X1 must pair with b → X1 ∈ {3, 4}. Plain backtracking: X1 = 1 → X2 = a → no X3 works '
                   '(β is not allowed with a); X1 = 2 → X2 = b → no X3 (2 has no partner in X3); X1 = 3 → X2 = a fails, '
                   'X2 = b → X3 = β: **(3, b, β)**. (1, a, β) violates C(X2, X3).',
    },
    {
        'q': 'Backtracking + forward checking. What happens right after **X1 = 2**?',
        'options': [
            'D2 = {b}, D3 = {α, β, γ}: the search goes on with X2 = b',
            'D2 = {b}, D3 = {}: dead end, X2 is never assigned under X1 = 2',
            'D2 = {a, b, c}, D3 = {}: dead end',
            'Nothing is pruned: forward checking only looks at assigned variables',
        ],
        'answer': 1,
        'explain': 'Forward checking keeps in each unassigned neighbour only the values compatible with X1 = 2: in X2 only b '
                   '(<2,b>), in X3 nothing (no pair <2,·> in C(X1, X3)). An empty domain → backtrack immediately. '
                   'Similarly X1 = 1 gives D2 = {a}, D3 = {β}, and then X2 = a empties D3. The FC tree has 7 assignments: '
                   'X1=1, X2=a, X1=2, X1=3, X2=a, X2=b, X3=β.',
    },
    {
        'q': 'Backtracking + **MRV** + forward checking. Which variable is assigned first?',
        'options': [
            'X1: it comes first in lexicographic order',
            'X2: X2 and X3 tie with 3 values (X1 has 4), lexicographic order breaks the tie',
            'X3: it has the most constraints',
            'X1: it has the most values, hence the most information',
        ],
        'answer': 1,
        'explain': 'MRV picks the smallest domain: |D1| = 4, |D2| = |D3| = 3. The tie X2 / X3 is broken lexicographically '
                   '(every variable has degree 2 here, so the degree heuristic would not help either).',
    },
    {
        'q': 'MRV + FC: after **X2 = a**, which domains does forward checking leave, and what happens next?',
        'options': [
            'D1 = {1, 3}, D3 = {γ}; MRV picks X3 = γ, which empties D1 → backtrack to X2 = b',
            'D1 = {1, 3}, D3 = {γ}; MRV picks X1 = 1, then X3 fails',
            'D1 = {1, 2, 3, 4}, D3 = {γ}; X3 = γ, then X1 = 1',
            'D1 = {1, 3}, D3 = {}: dead end at once',
        ],
        'answer': 0,
        'explain': 'With X2 = a only <1,a>, <3,a> survive in C(X1, X2) and only <a,γ> in C(X2, X3). X3 has 1 value → MRV '
                   'chooses it; X3 = γ leaves no value of X1 (C(X1, X3) only allows β) → D1 = {} → back to X2 = b: '
                   'D1 = {2, 3, 4}, D3 = {α, β}; X3 = α empties D1, X3 = β leaves D1 = {3, 4}; X1 = 3. Six assignments.',
    },
    {
        'q': 'MRV + **LCV** + FC: in which order are the values of X2 tried? (count the values each one rules out in X1 and X3)',
        'options': ['a, b, c', 'b, a, c', 'c, a, b', 'b, c, a'],
        'answer': 1,
        'explain': 'a rules out X1 ∈ {2, 4} and X3 ∈ {α, β} → 4; **b** rules out X1 = 1 and X3 = γ → 2; c rules out all four '
                   'values of X1 and X3 ∈ {α, β} → 6. Least constraining first: b, a, c. After X2 = b, LCV on X3: α rules out '
                   '3 values of D1 = {2, 3, 4}, β only 1 → β; then X1 = 3. **Three assignments, no backtracking.**',
    },
    {
        'q': 'Number of assignments to reach the solution: BT + FC → 7, MRV + FC → 6, MRV + LCV + FC → 3. What is the right '
             'reading of these numbers?',
        'options': [
            'LCV is the most important heuristic in general, MRV barely matters',
            'MRV reduces the tree by failing early on the most constrained variable; LCV helps here because a solution '
            'exists below the first value it picks — it cannot help when the current branch has no solution',
            'Forward checking is useless once MRV is used',
            'All three explore the same nodes in a different order',
        ],
        'answer': 1,
        'explain': '**Model answer:** *MRV (fail first) chooses the variable most likely to fail, cutting dead subtrees high in '
                   'the tree; LCV (succeed first) orders values so that the first one tried is the most likely to extend to '
                   'a solution. Value ordering only matters when a solution exists in the current subtree (or when we want '
                   'just one solution); variable ordering affects the size of the tree in every case.* Forward checking is '
                   'what makes MRV and LCV informative: both read the filtered domains.',
    },
]
