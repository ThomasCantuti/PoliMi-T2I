TITLE = 'Filtering, ordering, structure: exam-style reasoning'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['forward checking', 'AC-3', 'MRV', 'LCV', 'complexity', 'problem structure', 'hand simulation']

STATEMENT = r"""
Hand-simulation and "why" questions on forward checking, AC-3, the ordering heuristics and problem structure,
the way they appear in the exam. Slides p. 277–317. Keep pen and paper ready.
"""

QUESTIONS = [
    {
        'q': 'Australia, colors R, G, B. Assign **WA = G**, then **Q = B**, with forward checking after each step. '
             'What are the domains of NT, SA, NSW?',
        'options': [
            'NT = {R}, SA = {R}, NSW = {R, G}',
            'NT = {R, B}, SA = {R, B}, NSW = {R, G}',
            'NT = {R}, SA = {}, NSW = {R, G}',
            'NT = {R}, SA = {R}, NSW = {R, G, B}',
        ],
        'answer': 0,
        'explain': 'WA = G removes G from NT and SA → {R, B}. Q = B removes B from its neighbors NT, SA, NSW → '
                   'NT = {R}, SA = {R}, NSW = {R, G}. No domain is empty, so **forward checking does not backtrack**, '
                   'although NT and SA are neighbors that both need R: the same blind spot as p. 286.',
    },
    {
        'q': 'Same state (NT = {R}, SA = {R}). What does **AC-3** do?',
        'options': [
            'Nothing: every domain is non-empty.',
            'REVISE(SA, NT) deletes R from SA → empty domain → AC-3 returns false.',
            'It assigns NT = R and SA = R.',
            'It deletes R from WA.',
        ],
        'answer': 1,
        'explain': 'The arc SA → NT: the value R of SA needs some value of NT different from R, and NT = {R} offers none. '
                   'SA becomes empty, so the current assignment {WA = G, Q = B} is a dead end (p. 293).',
    },
    {
        'q': '4-queens, $X_i$ = row of the queen in column $i$. After **X1 = 1** and forward checking, the domains are:',
        'options': [
            'X2 = {3, 4}, X3 = {2, 4}, X4 = {2, 3}',
            'X2 = {2, 3, 4}, X3 = {2, 3, 4}, X4 = {2, 3, 4}',
            'X2 = {3, 4}, X3 = {2, 4}, X4 = {2, 3, 4}',
            'X2 = {4}, X3 = {}, X4 = {2, 3}',
        ],
        'answer': 0,
        'explain': 'Remove the row (1) and the two diagonals: column $i$ loses rows $1 \\pm (i-1)$. X2 loses 1, 2; '
                   'X3 loses 1, 3; X4 loses 1, 4 (p. 306). The last option is what **AC-3** produces afterwards (p. 311).',
    },
    {
        'q': 'In REVISE($X_i$, $X_j$), which domain can change?',
        'options': ['Only $D_i$ (the tail)', 'Only $D_j$ (the head)', 'Both', 'Neither: REVISE only checks'],
        'answer': 0,
        'explain': 'The arc $X_i \\to X_j$ is consistent iff every $x \\in D_i$ has a support $y \\in D_j$; we fix it by '
                   'deleting unsupported values from the **tail** (p. 287–288). The reverse arc is a separate arc.',
    },
    {
        'q': 'When REVISE($X_i$, $X_j$) deletes a value, AC-3 adds the arcs $(X_k, X_i)$ for $X_k \\in$ neighbors($X_i$) '
             '$\\setminus \\{X_j\\}$. Why is $(X_j, X_i)$ **not** re-added?',
        'options': [
            'Because it is already in the queue.',
            'Because the deleted values had no compatible value in $D_j$, so no value of $X_j$ was using them as support.',
            'Because arcs are never checked twice.',
            'It is an arbitrary optimization that can make AC-3 incorrect.',
        ],
        'answer': 1,
        'explain': 'A value $x$ was deleted precisely because no $y \\in D_j$ is compatible with it; therefore no $y$ '
                   'relied on $x$, and the arc $X_j \\to X_i$ cannot have become inconsistent. Every **other** neighbor '
                   '$X_k$ may have lost the only support of one of its values.',
    },
    {
        'q': 'AC-3 complexity (p. 295) with $n$ variables, at most $s$ constraints per variable, domain size $d$. '
             'Match the reasoning (select **all** true statements):',
        'options': [
            'Each arc is inserted in the queue at most $d$ times, because its head can lose at most $d$ values.',
            'REVISE costs $O(d^2)$: for each of the $d$ values of the tail, scan the $d$ values of the head.',
            'There are at most $n \\cdot s$ arcs, so AC-3 is $O(n s d^3)$.',
            'AC-3 is $O(d^n)$ because it may have to try every assignment.',
        ],
        'answer': [0, 1, 2],
        'explain': '$ns$ arcs × $d$ insertions × $O(d^2)$ per REVISE = $O(nsd^3)$: polynomial. AC-3 never enumerates '
                   'assignments; that is why it is incomplete (next question). Forward checking per step: $O(nsd)$ (p. 284).',
    },
    {
        'q': 'X, Y, Z with domains {1, 2} and constraints X ≠ Y, Y ≠ Z, X ≠ Z (p. 316). AC-3 returns **true**. Therefore…',
        'options': [
            'the CSP has a solution',
            'the CSP has no solution, and AC-3 could not detect it: every **pair** of variables is fine, only the triple fails',
            'AC-3 has a bug',
            'the CSP has exactly one solution',
        ],
        'answer': 1,
        'explain': 'Arc consistency is a **local** (pairwise) property: each value of X finds a different value in Y. '
                   'Three pairwise-different variables with two values are impossible, but seeing it needs '
                   'path / k-consistency, which costs more. AC-3 = good compromise between search and propagation.',
    },
    {
        'q': 'Pick the correct pairing of heuristic and motivation.',
        'options': [
            'MRV: succeed first; LCV: fail first',
            'MRV: **fail first**; LCV: **succeed first**',
            'Both: fail first',
            'Both: succeed first',
        ],
        'answer': 1,
        'explain': 'Every variable must eventually be assigned, so tackle the one most likely to fail **now** (MRV, '
                   'p. 298: "why min rather than max? to fail fast"). Only one value per variable must work, so try '
                   'the one that leaves the most freedom to the others (LCV).',
    },
    {
        'q': 'Australia, nothing assigned, all domains {R, G, B}. Which variable do MRV + degree choose?',
        'options': ['WA (first in the list)', 'T (fewest constraints)', 'SA', 'NSW'],
        'answer': 2,
        'explain': 'All domains have 3 values (MRV tie); SA is involved in 5 constraints with unassigned variables, more '
                   'than anyone else.',
    },
    {
        'q': 'The constraint graph splits into independent subproblems of $c$ variables each. Worst-case cost (p. 300)?',
        'options': [
            '$O(d^n)$ – structure does not help',
            '$O\\left(\\frac{n}{c}\\, d^c\\right)$ – linear in $n$',
            '$O(c^d)$',
            '$O(n\\, d^2)$',
        ],
        'answer': 1,
        'explain': 'Solve the $n/c$ components separately, each costing $d^c$. With $n = 80$, $d = 2$, $c = 20$: '
                   '$2^{80}$ nodes ≈ 4 billion years vs $4 \\cdot 2^{20}$ ≈ 0.4 s at 10 million nodes/s. '
                   'Find the components with a BFS/DFS on the constraint graph.',
    },
    {
        'q': 'With the algorithm of p. 317 (AC-3 at the start of every call, forward checking after every assignment), '
             'what happens on **3-queens**?',
        'options': [
            'It tries all 3 values of X1 before giving up.',
            'AC-3 at the root already empties a domain: failure with **zero** assignments.',
            'It finds a solution.',
            'It loops forever.',
        ],
        'answer': 1,
        'explain': 'A chain of REVISE steps: X2 = 2 attacks the whole first column, so it goes; X1 = 2 and X3 = 2 then '
                   'lose their supports in X2; finally X1 ∈ {1, 3} and X3 ∈ {1, 3} cannot support each other (same row or '
                   'same diagonal) → an empty domain before any search. Inference can replace search entirely '
                   '(Sudoku is the slide example).',
    },
    {
        'q': 'Which statements about **forward checking** are true? (select **all** that apply)',
        'options': [
            'It only checks constraints between the **just-assigned** variable and its unassigned neighbors.',
            'It can detect that two unassigned neighbors are left with the same single value.',
            'It makes MRV much more useful, because domain sizes are kept up to date.',
            'If it empties a domain, the current partial assignment can be abandoned.',
        ],
        'answer': [0, 2, 3],
        'explain': 'FC never looks at constraints between two unassigned variables (p. 286), so it misses NT = SA = {B}; '
                   'AC-3 propagates along all arcs and catches it. With FC + MRV, 20-queens drops from ~200 000 to 145 '
                   'assignments (problem 70).',
    },
]
