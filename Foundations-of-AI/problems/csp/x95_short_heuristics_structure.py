TITLE = 'Exam · Short questions on CSP heuristics, structure and complexity (2024–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'MRV', 'LCV', 'problem structure', 'complexity', 'all solutions']

STATEMENT = r"""
Short questions from the written exams of Feb 2024, Jun 2024, Feb 2025 and Feb 2026 on the definition of a
solution, the ordering heuristics, exhaustive search for **all** solutions, problem structure and complexity.
Answers must be **adequately motivated**: read the *Model answer* in each explanation.

Two constraint graphs of the Feb 2025 exam (every edge is a binary constraint):

```text
 graph 1 (no arcs):   A   B   C   D   E

 graph 2:     D ------- G
              / \       / \
             /   \     /   \
            /     \   /     H
      A -- C ----- F ------'
       \  / \     /
        B ----- E
```

Graph 2 edges: A–B, A–C, B–C, B–E, C–D, C–E, C–F, D–F, D–G, E–F, F–G, F–H, G–H.
"""

QUESTIONS = [
    {
        'q': '*Jun 2024.* What is a **solution** of a CSP? (precise definition)',
        'options': [
            'An assignment of values to variables that is **complete** (every variable has a value) and **consistent** '
            '(every constraint is satisfied)',
            'A consistent assignment, possibly partial',
            'A complete assignment that satisfies at least one constraint per variable',
            'The path of assignments found by backtracking, with minimum cost',
        ],
        'answer': 0,
        'explain': '**Model answer:** *A solution is an assignment of values (from their domains) to the variables that is '
                   'complete — all variables have a value — and consistent — all constraints are satisfied by the assigned '
                   'values.* CSPs are identification problems: the path does not matter.',
    },
    {
        'q': '*Feb 2026.* Why is it a good heuristic to choose the variable that is **most** constrained (MRV) but the value '
             'that is **least** constraining (LCV)?',
        'options': [
            'Every variable must be assigned anyway, so tackling the one most likely to fail detects dead ends early '
            '(fail first); only one value per variable has to work, so trying the one that leaves the most options to '
            'the others maximizes the chance of success (succeed first)',
            'Both heuristics minimize the number of constraints checked at each node',
            'MRV reduces memory, LCV reduces time',
            'MRV picks the variable with the most values so that more of the tree is explored',
        ],
        'answer': 0,
        'explain': '**Model answer:** *MRV selects a variable that is (all other things being equal) likely to cause a failure: '
                   'it lets us fail as early as possible, pruning large parts of the search space — and since every '
                   'variable must eventually be assigned, nothing is lost by doing the hard one first. LCV offers the '
                   'greatest opportunity to avoid future conflicts once we go down a branch: we need just one value that '
                   'works, so we try the most promising one first.* Asymmetry: variables = all must be done (fail first), '
                   'values = one must succeed (succeed first).',
    },
    {
        'q': '*Feb 2025.* We want **all** the solutions: backtracking, when it finds a solution, stores it and keeps '
             'backtracking until the whole tree is explored. On **graph 1** (no arcs, equal domains), which techniques '
             'do **not** reduce the number of explored nodes? (select **all** that apply)',
        'options': ['Forward checking', 'AC-3', 'MRV', 'LCV'],
        'answer': [0, 1, 2, 3],
        'explain': '**Model answer:** *None of them helps. There are no constraints, so forward checking and AC-3 never remove '
                   'a value; every partial assignment extends to solutions and every value of every variable must be '
                   'enumerated, so the order of values (LCV) is irrelevant; all domains have the same size and no '
                   'constraints, so MRV only produces ties and the tree is the same for any variable order.* (The official '
                   'key: "all the techniques will not reduce the search".) Strictly, if the domains had different sizes, '
                   'putting the small ones first (MRV) would reduce the number of internal nodes, not the leaves.',
    },
    {
        'q': '*Feb 2025.* Same exhaustive search, on **graph 2**. Which techniques do **not** reduce the number of explored '
             'nodes? (select **all** that apply)',
        'options': ['Forward checking', 'AC-3', 'MRV', 'LCV'],
        'answer': [3],
        'explain': '**Model answer:** *LCV does not help: all the values of every variable are explored anyway, so ordering '
                   'them only changes the order in which the same nodes are visited. Forward checking and AC-3 do help: '
                   'they delete values that cannot lead to any solution, cutting subtrees. MRV still helps: variable '
                   'ordering changes the shape and size of the tree, and failing first cuts dead subtrees higher up.*\n\n'
                   '**Discrepancy with the official key**, which answers "LCV and MRV". MRV can reduce the explored nodes '
                   'even when all solutions are enumerated. Tiny example: X ∈ {1, 2, 3}, Y ∈ {1}, X ≠ Y. Order X, Y: '
                   'X = 1, 2, 3 and Y = 1 twice → 5 nodes; MRV picks Y first: Y = 1, then X = 2, 3 → 3 nodes. On graph 2 '
                   'with 3 colors and forward checking, enumerating the 6 solutions costs 57 assignments with the alphabetical '
                   'order and 45 with MRV (checked by code). In the exam, if you follow the official key, motivate it: MRV '
                   'is designed to reach *one* solution quickly; it cannot avoid enumerating the solutions themselves.',
    },
    {
        'q': '*Feb 2025.* A CSP has a "flower" constraint graph: one central variable, and four "petals" — cycles of '
             'variables that leave the centre and come back to it, not connected to each other. How would you solve '
             'it efficiently?',
        'options': [
            'Assign the central variable first: once it is fixed, the four petals become four independent subproblems '
            '(each one a simple chain), solved separately',
            'Run AC-3 only: it solves every problem whose graph has cycles',
            'Use LCV on the central variable and MRV on the petals',
            'Nothing better than plain backtracking on all the variables',
        ],
        'answer': 0,
        'explain': '**Model answer:** *Choose the central variable first (it is also the one the degree heuristic picks): '
                   'for each of its d values, the remaining constraint graph splits into four disconnected petals, i.e. '
                   'four independent subproblems that can be solved separately. With k variables per petal the cost drops '
                   'from O(d^(4k+1)) to O(d · 4 · d^k).* Removing the centre also turns each petal into a chain (a tree): '
                   'in AIMA this is *cutset conditioning* with the cycle cutset {centre}, and tree-structured CSPs are '
                   'solvable in O(k d²) — beyond the slides, which cover independent subproblems (p. 299–300).',
    },
    {
        'q': '*Feb 2025.* A CSP has n variables, each with d values. In the worst case, how many times may backtracking '
             'search have to backtrack (because an assignment violated some constraint) before finding a solution or '
             'concluding that none exists?',
        'options': ['O(n · d)', 'O(d^n)', 'O(n^d)', 'O(n! · d^n)'],
        'answer': 1,
        'explain': '**Model answer:** *O(dⁿ): in the worst case the search explores the whole tree, which has dⁿ complete '
                   'assignments (leaves) — each failing branch causes a backtrack.* n!·dⁿ is the size of the naive '
                   'formulation that assigns any variable at any level; fixing the variable order (assignments commute) '
                   'brings it down to dⁿ.',
    },
    {
        'q': '*Feb 2024.* What are the main differences between solving a set of clauses as a **CSP** (backtracking + FC + '
             'MRV/degree) and solving it directly with **DPLL**?',
        'options': [
            'DPLL works on the clauses themselves, with SAT-specific heuristics to choose variables and values (pure '
            'symbols, unit clauses) and early termination (a clause is true as soon as one literal is true; a model can '
            'be found with symbols left unassigned)',
            'DPLL is incomplete, the CSP approach is complete',
            'The CSP approach cannot handle negated literals',
            'There is no difference: DPLL is backtracking with forward checking',
        ],
        'answer': 0,
        'explain': '**Model answer:** *DPLL uses different heuristics to select variables and values (pure symbol heuristic, '
                   'unit clause heuristic) and implements early termination: it can decide a clause or the whole sentence '
                   'with a partial model. The CSP formulation uses generic heuristics (MRV, degree, LCV) and filtering '
                   '(FC, AC-3) on binary constraints.* Both are complete, sound backtracking searches; forward checking on '
                   'the clause CSP behaves much like unit propagation (E = t makes B ∨ ¬E a unit clause and FC sets B = t).',
    },
]
