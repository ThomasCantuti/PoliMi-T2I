TITLE = 'Local search: concepts and hand simulation'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['local search', 'hill climbing', 'local optimum', 'plateau', 'min-conflicts', 'random restart']

STATEMENT = r"""
Complete-state formulation, hill climbing and its traps, CSPs as optimization. Slides p. 318–336.
"""

QUESTIONS = [
    {
        'q': 'What changes when we move from systematic search (BFS, A*, backtracking) to **local search**? '
             '(select **all** that apply)',
        'options': [
            'We start from a **complete** (possibly infeasible) state and modify it a little at a time.',
            'Only the current state is kept in memory: no frontier, no reached set.',
            'We need a function that evaluates whether a modified state is better than the current one.',
            'The algorithm returns the path from the initial state to the goal.',
            'If no solution exists, local search proves it.',
        ],
        'answer': [0, 1, 2],
        'explain': 'p. 319–320 and 333. Local search ignores paths (identification problems) and uses constant memory. '
                   'It is **incomplete**: failing to find a solution says nothing about whether one exists.',
    },
    {
        'q': 'Hill climbing (p. 321) stops when…',
        'options': [
            'it reaches a global optimum',
            'the best neighbor is **not better** than the current state',
            'it has visited every state',
            'the frontier is empty',
        ],
        'answer': 1,
        'explain': '`if VALUE(neighbor) <= VALUE(current) then return current`. That state is a **local** optimum (or the '
                   'edge of a plateau); whether it is global, hill climbing cannot know (p. 330).',
    },
    {
        'q': 'Homes & hospitals, start state of p. 324 (hospitals at (0,4) and (3,9), cost 17). How many **neighbor** '
             'states are there if a neighbor moves one hospital one cell up/down/left/right?',
        'options': ['4', '6', '8', '16'],
        'answer': 1,
        'explain': '(0,4) cannot move up (grid edge) and (3,9) cannot move right: 3 + 3 = 6, the six green cells of p. 325. '
                   'Their costs are 15, 15, 18, 17, 16, 15, so hill climbing moves to a 15.',
    },
    {
        'q': 'On the slides the hospital cost goes 17 → 15 → 13 → 11 → 9. With one-cell moves, strict hill climbing '
             'from 17 always stops at **11**. Why?',
        'options': [
            '11 is the global optimum.',
            'At 11 the best neighbor also costs 11 (a **plateau/shoulder**): a **sideways** move is needed before 9 becomes reachable.',
            'The cost function is wrong on the slides.',
            'Because the hospitals cannot overlap.',
        ],
        'answer': 1,
        'explain': 'From (1,3),(3,8) the best neighbors cost 11, e.g. (2,3),(3,8); from there (2,2),(3,8) costs 9 = the '
                   'global optimum. Every tie-breaking choice of strict steepest descent ends at 11 (code problem 30).',
    },
    {
        'q': 'Match Figure 4.1 (p. 331): a **shoulder** is…',
        'options': [
            'a peak higher than its neighbors but lower than the global maximum',
            'a flat region from which an uphill exit exists',
            'a flat region with no uphill exit',
            'the global maximum',
        ],
        'answer': 1,
        'explain': 'Option 1 is a local maximum; option 3 is a "flat" local maximum. Both kinds of plateau stop strict '
                   'hill climbing; on a shoulder a limited number of sideways moves can get it moving again.',
    },
    {
        'q': '8-queens with one queen per column (Figure 4.3(b), h = 17). How many neighbors does a state have, if a '
             'neighbor moves one queen within its column?',
        'options': ['8', '28', '56', '64'],
        'answer': 2,
        'explain': '8 queens × 7 other rows = 56. On that board 8 of them tie for the best value h = 12: hill climbing '
                   'must break ties (first, last, random…).',
    },
    {
        'q': '4-queens, state (3, 2, 3, 2) with h = 5 (p. 334). What is the **lowest** h among its neighbors?',
        'options': ['4', '3', '2', '0'],
        'answer': 2,
        'explain': 'Two neighbors reach h = 2: (3,1,3,2) – the slide\'s move – and (3,2,4,2). From (3,1,3,2) moving the third '
                   'queen to row 4 gives (3,1,4,2) with h = 0. No single move solves it directly.',
    },
    {
        'q': 'Steepest-descent hill climbing solves about 14% of random 8-queens instances. Using random restarts, how '
             'many climbs do you expect on average?',
        'options': ['about 1.14', 'about 7', 'about 14', 'about 86'],
        'answer': 1,
        'explain': 'Each climb succeeds independently with $p \\approx 0.14$: geometric distribution, mean $1/p \\approx 7$. '
                   'Each climb is only a few steps long, so this is very cheap.',
    },
    {
        'q': 'To treat a CSP as an optimization problem (p. 333–334) we minimize…',
        'options': [
            'the number of assigned variables',
            'the number of **violated constraints** (e.g. attacking pairs of queens)',
            'the depth of the search tree',
            'the sum of the domain sizes',
        ],
        'answer': 1,
        'explain': 'h = number of conflicts; h = 0 iff the complete assignment is a solution. For 4-queens: 5 → 2 → 0 on p. 334.',
    },
    {
        'q': 'Which statements about **min-conflicts** are true? (select **all** that apply)',
        'options': [
            'It picks a conflicted variable at random and assigns it the value with the fewest conflicts.',
            'It starts from a complete, usually infeasible assignment.',
            'It can still get stuck in a local minimum.',
            'It explores partial assignments like backtracking does.',
        ],
        'answer': [0, 1, 2],
        'explain': 'It is local search over complete assignments. On Figure 4.3(a) (h = 1) both conflicted queens are '
                   'already on their best row, so it never moves (code problem 50). Random restarts or random walk steps help.',
    },
    {
        'q': 'Hill climbing is…',
        'options': [
            'complete and optimal',
            'complete but not optimal',
            'neither complete nor optimal, but uses $O(1)$ memory and is often fast',
            'optimal but not complete',
        ],
        'answer': 2,
        'explain': 'It can stop at a local optimum (not optimal) and miss existing solutions (not complete). Its strengths '
                   'are constant memory and speed on huge or continuous spaces where systematic search is hopeless.',
    },
]
