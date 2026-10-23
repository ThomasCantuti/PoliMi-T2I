TITLE = 'Formulating CSPs'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['formulation', 'factored representation', 'constraint graph', 'cryptarithmetic', 'sudoku']

STATEMENT = r"""
Variables, domains, constraints – and what the factored representation buys us. Slides p. 258–271.
"""

QUESTIONS = [
    {
        'q': 'What is special about a **CSP state** compared with the states of the search problems seen so far?',
        'options': [
            'It is a black box: only the goal test can look inside it.',
            'It has a **factored representation**: a set of variable–value pairs.',
            'It always contains the path from the initial state.',
            'It is a single number, so it can be compared with `<`.',
        ],
        'answer': 1,
        'explain': 'Slides p. 264–265. Standard search treats states as black boxes; a CSP state is a (partial) '
                   'assignment of values to variables. This structure lets general-purpose algorithms look inside the '
                   'state: check single constraints, prune domains, pick the most constrained variable.',
    },
    {
        'q': 'A **solution** of a CSP is an assignment that is… (select **all** that apply)',
        'options': [
            '**complete**: every variable has a value',
            '**consistent**: every constraint is satisfied',
            'reached by the cheapest path',
            'the first one found in breadth-first order',
        ],
        'answer': [0, 1],
        'explain': 'Slide p. 265. CSPs are **identification** problems (p. 260): the goal matters, not the path, '
                   'so path cost plays no role.',
    },
    {
        'q': 'With $n$ variables and domains of size $d$, how many **complete** assignments are there?',
        'options': ['$n^d$', '$d^n$', '$n \\cdot d$', '$n! \\cdot d$'],
        'answer': 1,
        'explain': 'Each of the $n$ variables independently takes one of $d$ values: $O(d^n)$ (p. 265). '
                   'A naive search formulation where *any* unassigned variable may be assigned at each step even '
                   'builds a tree with $n!\\,d^n$ leaves; fixing the variable order (assignments are commutative, '
                   'p. 273) brings it back to $d^n$.',
    },
    {
        'q': 'Why is **depth-first** search the natural choice for CSPs, rather than breadth-first? (select **all** that apply)',
        'options': [
            'Every solution is at the same depth $n$ (one level per variable).',
            'BFS would have to generate the whole, exponentially large level $n-1$ before reaching any solution.',
            'The path to a solution is irrelevant, so nothing is lost by diving.',
            'DFS is optimal for CSPs.',
        ],
        'answer': [0, 1, 2],
        'explain': 'p. 262–263 and 273. All complete assignments live at depth $n$, so BFS only wastes memory; DFS reaches '
                   'depth $n$ immediately with linear memory. "Optimal" means nothing here: there is no path cost.',
    },
    {
        'q': 'In the 8-queens formulation $X_i \\in \\{1,\\dots,8\\}$ = row of the queen in column $i$, which '
             'constraint is **not** written explicitly?',
        'options': [
            '$X_i \\ne X_j$ (different rows)',
            '$|X_i - X_j| \\ne |i - j|$ (different diagonals)',
            'no two queens in the same **column**',
            'every queen must be on the board',
        ],
        'answer': 2,
        'explain': 'Slide p. 267: one queen per variable and one variable per column, so "different columns" is '
                   'encoded in the representation itself. Choosing a representation that makes constraints implicit '
                   'shrinks the space from $\\binom{64}{8}$ to $8^8$ states.',
    },
    {
        'q': 'TWO + TWO = FOUR (p. 268) uses the extra variables $C_1, C_2, C_3$ and the constraint $C_3 = F$. '
             'What value **must** F take?',
        'options': ['0', '1', 'any digit from 1 to 9', 'it cannot be determined without search'],
        'answer': 1,
        'explain': '$C_3$ is the **carry** out of the hundreds column: two digits plus a carry give at most 19, so '
                   '$C_3 \\in \\{0,1\\}$. F is a leading digit, so $F \\ne 0$, hence $F = C_3 = 1$. That is inference '
                   'on a single constraint – no search needed.',
    },
    {
        'q': '$Alldiff(F, T, U, W, R, O)$ involves 6 variables. Rewritten with **binary** constraints only, how many '
             '$\\ne$ constraints does it become?',
        'options': ['5', '6', '15', '36'],
        'answer': 2,
        'explain': 'One $\\ne$ per pair: $\\binom{6}{2} = 15$. Alldiff is a global constraint that binarizes easily; the '
                   'column constraints such as $O + O = R + 10\\,C_1$ (three variables) need the auxiliary-variable '
                   'construction instead – that is why the slide draws a constraint **hypergraph** (p. 268, 271).',
    },
    {
        'q': 'Sudoku as a CSP (p. 269): how many 9-way $Alldiff$ constraints does it have?',
        'options': ['9', '18', '27', '81'],
        'answer': 2,
        'explain': '9 rows + 9 columns + 9 regions (3×3 boxes) = 27. Variables are the open squares with domain '
                   '$\\{1,\\dots,9\\}$; the given digits are variables with a single-value domain.',
    },
    {
        'q': 'What does the **constraint graph** of Australia (p. 271) tell you about Tasmania?',
        'options': [
            'It must get a different color from Victoria.',
            'It is an **independent subproblem**: it can be colored separately from the mainland.',
            'It makes the problem unsolvable with three colors.',
            'It should be assigned first by the degree heuristic.',
        ],
        'answer': 1,
        'explain': 'T has no edges: it is a separate connected component, so any color works and the mainland can be '
                   'solved on its own (p. 300). Degree heuristic: T has degree 0, it would be chosen **last**.',
    },
    {
        'q': 'In the task-scheduling homework (p. 270) which pair of tasks is **not** linked in the constraint graph?',
        'options': ['T1 – T3', 'T2 – T1', 'T3 – T4', 'T4 – T1'],
        'answer': 2,
        'explain': 'Edges exist only between variables that appear together in a constraint: T1 during T3, T2 before T1, '
                   'T2 overlaps T3, T4 after T1. T3 and T4 interact only *through* T1 (code problem 90).',
    },
]
