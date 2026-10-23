TITLE = 'Exam · Short questions on arc consistency and forward checking (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'AC-3', 'forward checking', 'true/false', 'hand simulation']

STATEMENT = r"""
Short questions and small computations on forward checking and AC-3 from the written exams of Jan 2022, Jun 2022,
Feb 2023, Feb 2024, Jun 2024, Jan 2025, Jan 2026 and Jul 2026. The exams want every answer **adequately
motivated** (a completely wrong answer costs points): read the *Model answer* in each explanation.

Conventions: REVISE(Xi, Xj) deletes values from the **tail** Xi; FIFO queue.
"""

QUESTIONS = [
    {
        'q': '*Jun 2022.* Variables A, B, C, D with domains {1, 2, 3, 4}; constraints A > B, B = C, D ≠ A. AC-3 starts with '
             'the queue ⟨A > B, B < A, B = C, C = B, D ≠ A, A ≠ D⟩ (directed arcs, the first variable is the tail). '
             'What happens in the **first two steps**?',
        'options': [
            'A > B: D_A = {2, 3, 4}, no arc inserted; B < A: D_B = {1, 2, 3}, no arc inserted',
            'A > B: D_B = {1, 2, 3}; B < A: D_A = {2, 3, 4}',
            'A > B: D_A = {2, 3, 4}, the reverse arc B < A is inserted at the end; B < A: D_B = {1, 2, 3}, A > B is inserted',
            'A > B: D_A = {2, 3, 4} and D_B = {1, 2, 3} together; B < A: no change',
        ],
        'answer': 0,
        'explain': '**Write:** *A > B: D_A = {2, 3, 4}, arc removed from the queue, no arc inserted (D ≠ A is already '
                   'queued); B < A: D_B = {1, 2, 3}, no arc inserted (C = B is already queued).* '
                   'Arc A > B (tail A): A = 1 has no B smaller than it → D_A = {2, 3, 4}. The arcs to re-check point at A '
                   'from its other neighbours: (D, A), already in the queue → nothing inserted. Arc B < A: B = 4 has no '
                   'larger A → D_B = {1, 2, 3}; (C, B) is already queued. Continuing, C = B removes 4 from C and nothing '
                   'else changes: final D_A = {2, 3, 4}, D_B = D_C = {1, 2, 3}, D_D = {1, 2, 3, 4}. (The official solution '
                   'labels the second step "B > A": it means the arc B < A, whose tail is B.) Option 2 revises the head: '
                   'the classic mistake. The reverse arc (Xj, Xi) is never re-added: the deleted values had no partner in '
                   'Xj, so no value of Xj relied on them. (With the pseudocode taken literally, without the "not already '
                   'queued" check, D ≠ A and C = B would be appended a second time — harmless, but the official answer, '
                   'like the visualizer, does not duplicate them.)',
    },
    {
        'q': '*Jun 2024.* Two variables x, y with D_x = D_y = {1, 2, 3} and the constraint x < y. Initial queue '
             '{x → y, y → x}. Steps and resulting domains?',
        'options': [
            'x → y: D_x = {1, 2}; y → x: D_y = {2, 3}; no arc added; result D_x = {1, 2}, D_y = {2, 3}',
            'x → y: D_y = {2, 3}; y → x: D_x = {1, 2}; then x → y is added again',
            'x → y: D_x = {1}; y → x: D_y = {3}',
            'Nothing changes: AC-3 only works with ≠ constraints',
        ],
        'answer': 0,
        'explain': '**Write:** *pop x → y: D_x = {1, 2}, no arc added; pop y → x: D_y = {2, 3}, no arc added; resulting '
                   'domains D_x = {1, 2}, D_y = {2, 3}.* x = 3 has no larger y → removed; y = 1 has no smaller x → removed. After x shrinks, the arcs (Xk, x) '
                   'for the neighbours Xk ≠ y would be added: x has no other neighbour, so nothing is added (and y → x is '
                   'still queued). Note that AC-3 does **not** reduce to x = 1, y = 2: x = 2 is supported by y = 3. '
                   'Version B of the exam had x > y: D_x = {2, 3}, D_y = {1, 2}.',
    },
    {
        'q': '*Jun 2022, true or false?* "Solving a CSP with backtracking search **with forward checking** always expands no '
             'more nodes than solving it with backtracking **without** forward checking."',
        'options': [
            'True (same variable and value ordering)',
            'False: forward checking adds work at every node, so it explores more nodes',
            'False: forward checking may remove values that lead to the solution',
            'True only if the CSP has no solution',
        ],
        'answer': 0,
        'explain': '**Model answer:** *True. Forward checking only removes values that are inconsistent with the current '
                   'assignment — values that plain backtracking would also reject when it reaches that variable — and in '
                   'addition it abandons a node as soon as a future domain becomes empty, cutting subtrees that plain '
                   'backtracking would still explore. With the same orderings, every node generated with FC is also '
                   'generated without it.* FC costs more **per node** (O(nsd)), but never generates more nodes. It never '
                   'removes a value that belongs to a solution extending the current assignment.',
    },
    {
        'q': '*Jun 2022, true or false?* "Given a CSP with finite variables, domains and constraints, AC-3 applied to the '
             'initial domains always terminates."',
        'options': [
            'True: an arc is re-inserted only when a domain loses a value, and domains are finite',
            'False: arcs keep re-entering the queue forever when there are cycles in the constraint graph',
            'True, but only if the constraint graph is a tree',
            'False: it terminates only if the CSP has a solution',
        ],
        'answer': 0,
        'explain': '**Model answer:** *True. Every step pops an arc; an arc (Xk, Xi) is added back only when D(Xi) loses a '
                   'value, which can happen at most |D(Xi)| ≤ d times. With finitely many arcs and values the queue '
                   'eventually empties (or a domain becomes empty and AC-3 stops).* This is also the complexity argument: '
                   'each of the ≤ ns arcs enters the queue at most d times, REVISE is O(d²) → O(nsd³) (p. 295).',
    },
    {
        'q': '*Jun 2022, true or false?* "If a CSP admits at least one solution, AC-3 applied to the initial domains always '
             'finds a solution."',
        'options': [
            'False: AC-3 only reduces the domains; they may still contain several values, so search is still needed',
            'True: AC-3 removes every value that is not part of a solution',
            'True, because AC-3 is complete',
            'False: AC-3 may remove the values of the only solution',
        ],
        'answer': 0,
        'explain': '**Model answer:** *False. AC-3 is inference, not search: it returns a simplified CSP whose domains can '
                   'still contain more than one value (e.g. the Australia map at the start: nothing is removed), so a '
                   'search is still needed to find an assignment.* AC-3 is sound (it never deletes a value belonging to a '
                   'solution — the last option is false too), but values surviving AC-3 are not necessarily part of a '
                   'solution (triangle X ≠ Y ≠ Z ≠ X with {1, 2}, p. 316).',
    },
    {
        'q': '*Jan 2025.* "Checking arc consistency (AC-3) on the original domains **always** reduces the number of nodes of '
             'the tree built by backtracking." True or false?',
        'options': [
            'False: AC-3 may remove nothing, and then the tree is exactly the same',
            'True: AC-3 always removes at least one value',
            'True: AC-3 is O(nsd³), so it always pays off',
            'False: AC-3 can make the tree larger',
        ],
        'answer': 0,
        'explain': '**Model answer:** *False. There are problems in which AC-3 does not reduce any domain — e.g. map coloring '
                   'of Australia with all domains {R, G, B}, or the slides\' example X ≠ Y, Y ≠ Z, X ≠ Z with domains {1, 2} '
                   '(p. 316): every arc is already consistent, the domains are unchanged and backtracking builds the same '
                   'tree.* (AC-3 never makes the tree larger: it only deletes values.)',
    },
    {
        'q': '*Jan 2026.* "When enforcing arc consistency, the set of values that remain when the algorithm terminates does '
             '**not** depend on the order in which arcs are processed from the queue." True or false?',
        'options': [
            'True: the arc-consistent result is unique; the order only changes the intermediate steps',
            'False: different orders remove different values',
            'True, but only for ≠ constraints',
            'False: with a bad order AC-3 may stop before the domains are arc consistent',
        ],
        'answer': 0,
        'explain': '**Model answer:** *True. A value is deleted only when it has no support in the current domain of a '
                   'neighbour; since domains only shrink, a value deleted in one order would also lose its support in any '
                   'other order. Every order therefore ends with the same domains: the largest arc-consistent sub-domains '
                   '(or an empty domain).* The number of REVISE calls and the sequence of deletions do depend on the order '
                   '(compare the slides\' 4-queens order with the visualizer\'s).',
    },
    {
        'q': '*Jan 2022.* After AC-3 the exam-supervision CSP has D1 = {C}, D2 = {B}, D3 = {A, C}, D4 = {A, C}, '
             'D5 = {B, C}. What can you conclude about the existence of a solution?',
        'options': [
            'A solution may exist (no domain is empty), but AC-3 does not guarantee it: we still have to search',
            'A solution exists, because no domain is empty',
            'There is no solution, because some domains still have two values',
            'There is exactly one solution',
        ],
        'answer': 0,
        'explain': '**Model answer:** *No domain is empty, so AC-3 has not detected an inconsistency: a solution could exist, '
                   'but arc consistency is only a pairwise check and does not guarantee it.* Here two solutions exist '
                   '(E3/E4 = A/C or C/A, E5 = B), but only search can tell. An empty domain is the only definite answer AC-3 '
                   'gives ("no solution").',
    },
    {
        'q': '*Feb 2023.* Five cells colored R/B (1–2–3 in a row, 4 under 1, 5 under 2; adjacent cells differ), D5 = {B}. '
             'Does AC-3 on the **initial** domains reduce the complexity of the problem?',
        'options': [
            'Yes: it propagates D5 = {B} through the board and leaves one value per cell — the solution 1 = B, 2 = R, 3 = B, '
            '4 = R, 5 = B, without search',
            'No: AC-3 only works after an assignment',
            'No: with two colors every arc is consistent',
            'Yes, but it only removes B from D4',
        ],
        'answer': 0,
        'explain': '**Model answer:** *Yes. The arcs 4 → 5 and 2 → 5 remove B from D4 and D2 (D5 = {B}); then R is removed '
                   'from D1 (arc 1 → 2) and from D3 (arc 3 → 2). Every domain becomes a singleton: AC-3 finds the solution '
                   'directly.* (The official solution calls the first arc "5 → 4"; with the slides\' convention the tail '
                   'is revised, so it is 4 → 5.) See the trace problem of the same exam.',
    },
    {
        'q': '*Feb 2024.* The clauses A ∨ B, B ∨ ¬E, ¬C ∨ ¬D, ¬C ∨ ¬E, ¬D ∨ E as a CSP (domains {t, f}, one binary constraint '
             'per clause). Which domains does AC-3 on the initial domains reduce?',
        'options': [
            'None: for every clause and every value of one variable there is a value of the other that makes the clause true',
            'D(E) = {t}, because E appears in three clauses',
            'D(C) = {f}, because C appears only negated',
            'All of them: AC-3 performs unit propagation',
        ],
        'answer': 0,
        'explain': '**Model answer:** *No domain is reduced. Given a constraint (clause) and any value of one of its two '
                   'variables, the other variable can always take the value that makes its own literal true, so every arc '
                   'is consistent.* Values disappear only after an assignment: E = t turns B ∨ ¬E into the unit clause B '
                   '(forward checking then leaves D(B) = {t}). A domain would shrink only with two clauses on the same pair '
                   'such as (A ∨ B) and (A ∨ ¬B), which together force A = t.',
    },
    {
        'q': '*Jul 2026.* Two 9×9 Sudoku boards: one empty, one with 50% of the cells filled (and guaranteed to have a '
             'solution). Backtracking search with AC-3 is applied to both. Which one gives the **larger search tree**, '
             'independently of the variable/value ordering strategies?',
        'options': [
            'The empty board: each assignment removes just one value from a few domains, so domains stay large and '
            'the branching factor stays high for many levels',
            'The half-filled board, because AC-3 has more constraints to check',
            'They are the same: AC-3 always solves Sudoku without search',
            'The half-filled board, because it may have no solution',
        ],
        'answer': 0,
        'explain': '**Model answer:** *The empty board. There all 81 variables can take all 9 values, and each assignment '
                   'removes only one value from the domains of the cells in the same row, column and 3×3 square, so the '
                   'problem is simplified very slowly. With 50% of the cells assigned, the constraints (propagated by AC-3) '
                   'already leave the unassigned cells very few feasible values: fewer variables, smaller domains, fewer '
                   'feasible assignments, hence (in general) a much smaller tree.* (Also: the empty board has 81 levels, '
                   'the half-filled one about 40.)',
    },
]
