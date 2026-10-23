TITLE = 'Exam · Search or CSP? Choosing the representation (2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Jun 2026', 'Feb 2026', 'representation', 'CSP', 'uninformed search']

STATEMENT = r"""
Design questions from the written exams of **11 June 2026** (Problem 1, Artificial Intelligence) and
**6 February 2026** (Problem 1, Question 2).

**Jun 2026, Problem 1.** You must design a solver for a tile puzzle: the solver receives an empty $N \times N$
grid ($N = 3$ in the example) and a set of tiles, and must arrange the tiles on the grid so that the coloured
shapes along every edge connect perfectly with the matching shapes of the neighbouring tiles and with the clues on
the board's outer border. Propose two solutions, one based on **uninformed search** and one based on **CSP**:
describe them at a high level, give the **pros and cons** of each, and say which one you would implement and why.
"""

QUESTIONS = [
    {
        'q': '(Jun 2026) High-level **uninformed-search** solution: which description fits, with its main pro and con?',
        'options': [
            'Depth-first search over the placements: a state is a partial arrangement, an action places a tile in the '
            'next empty cell, the goal test checks that every edge matches. Pro: very simple modelling, no '
            'constraints to specify (everything is checked by the goal test). Con: the search is completely blind',
            'Breadth-first search, because it is optimal: pro, the shortest arrangement; con, none',
            'A* with the number of misplaced tiles as heuristic: pro, admissible; con, slow',
            'Uninformed search cannot be used, because the goal is not a single explicit state',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Solve it with depth-first search: states are partial arrangements, actions place '
                   'a tile, the goal test checks all the edges. Pros: modelling is very simple, no constraints have to be '
                   'specified because everything is checked in the goal test. Cons: the search is completely blind: it '
                   'only discovers at depth $N^2$ that an early placement was already incompatible." All solutions are '
                   'at the same depth $N^2$ (one tile per cell), so DFS is the natural uninformed choice: BFS would store '
                   'almost the whole tree and "shortest" means nothing here. A goal **test** works fine for search; only '
                   'bidirectional search needs an explicit goal state.',
    },
    {
        'q': '(Jun 2026) High-level **CSP** solution and its pros and cons:',
        'options': [
            'Variables = grid cells, domain = the tiles (with their rotations, if allowed), constraints = adjacent '
            'edges must match, border edges must match the clues, each tile used once; backtracking search. Pro: '
            'unfeasible partial arrangements are pruned as soon as a constraint fails, and MRV/LCV/forward checking '
            'can be used. Con: the modelling is more complex (a factored state and all the constraints)',
            'Variables = tiles, domain = colours; pro: fewer variables; con: none',
            'The CSP has a single variable (the whole arrangement): pro, simple; con, a huge domain',
            'CSP is not applicable because the constraints involve more than two variables',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Model it as a CSP solved with backtracking search. Pros: it saves the time that '
                   'blind search wastes on arrangements that are unfeasible from the start, because constraints are '
                   'checked while searching; heuristics (MRV, degree, LCV) and inference (forward checking, AC-3) '
                   'optimize the choice of variables and values. Cons: the modelling is more complex: we must design a '
                   'factored representation and specify the constraints" (official answer). Edge-matching constraints '
                   'are binary (two neighbouring cells); "each tile once" is an AllDiff.',
    },
    {
        'q': '(Jun 2026) **Which solution would you choose, and why?**',
        'options': [
            'The CSP: with a limited extra modelling effort it makes the search far more efficient, because '
            'inconsistent partial arrangements are cut immediately instead of being discovered at the goal test',
            'Uninformed search: it is complete and the CSP is not',
            'Uninformed search: it is easier to write, and efficiency does not matter for puzzles',
            'Neither: only local search can solve puzzles',
        ],
        'answer': 0,
        'explain': '**Model answer:** "The CSP: with a limited modelling effort it makes the search extremely efficient" '
                   '(official answer). Both are complete (backtracking is a depth-first search of a finite tree); the '
                   'difference is how much of the tree they visit. Motivate the choice with the pruning, not with '
                   'completeness.',
    },
    {
        'q': '(Feb 2026) Our first definition of search problem made no assumption on the state and could be applied '
             'to any domain, including CSPs and planning. **Why did we introduce the factored representation of CSPs and '
             'the structured (logic-based) representation of planning?**',
        'options': [
            'Specialized representations restrict the domain of application but let the algorithm exploit knowledge '
            'of the domain: e.g. in a CSP constraints are checked on partial assignments, so backtracking prunes '
            'without expanding the whole tree, and general-purpose heuristics (MRV, LCV) become possible',
            'Because generic search cannot represent goals defined by a test',
            'Because generic search algorithms are not complete on CSPs',
            'Only to save memory: the algorithms are the same',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Specialized representations restrict the application domain but allow us to exploit '
                   'domain knowledge and design better algorithms. For example, in a CSP we avoid expanding the entire '
                   'search tree by checking the constraints as we go and backtracking as soon as needed" (official '
                   'answer). With an atomic state the algorithm sees a black box with `actions`, `result` and a goal '
                   'test; a factored or structured state exposes its *parts* (variables, literals), which enables '
                   'inference, domain-independent heuristics and early failure detection.',
    },
]
