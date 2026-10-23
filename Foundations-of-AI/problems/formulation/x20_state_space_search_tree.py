TITLE = 'Exam · Short questions on state spaces and search trees (2023–2025)'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['exam', 'state space', 'search tree', 'search strategy', 'true/false']

STATEMENT = r"""
Definitions asked in the written exams of **8 September 2023** (Problem 1, Questions 1–5), **6 February 2024**
(Artificial Intelligence, Question 6, all four versions) and **16 January 2025** (Problem 4, Question 1).

These are "define" questions: two or three precise sentences are enough, but they must use the right words
(directed graph, successor, path, frontier). After each question, read the **model answer**.
"""

QUESTIONS = [
    {
        'q': '(Sep 2023 Q1, Jan 2025 Q1) **What is the state space?**',
        'options': [
            'A directed graph whose nodes are the states and with an arc from $s_1$ to $s_2$ iff $s_2$ is a '
            'successor of $s_1$ (the result of an action applicable in $s_1$)',
            'The tree of all the paths explored by the search algorithm',
            'The set of states stored in the frontier',
            'The set of goal states',
        ],
        'answer': 0,
        'explain': '**Model answer:** "The state space is a directed graph: nodes represent states, arcs represent '
                   'actions; there is an arc from $s_1$ to $s_2$ if and only if $s_2$ is a successor of $s_1$." '
                   '(official answer, slides p.63). It is defined **implicitly** by the initial state, `actions` and '
                   '`result`: it is almost never built explicitly. The tree of explored paths is the *search tree*.',
    },
    {
        'q': '(Sep 2023 Q2) **What is a search tree?**',
        'options': [
            'A tree built on top of the state space: the root is the initial state, each node corresponds to a '
            '**path** from the initial state to a state, and the children of a node are its successors',
            'A spanning tree of the state space that contains each state exactly once',
            'The state space when it has no cycles',
            'The tree of the recursive calls of the goal test',
        ],
        'answer': 0,
        'explain': '**Model answer:** "A search tree is superimposed on the state space: it is made of search nodes, '
                   'its root corresponds to the initial state, its edges to actions, and each node corresponds to a '
                   'path from the initial state to a state of the state space." A node stores state, parent, action '
                   'and path cost. It is not a spanning tree: the same state can appear in many nodes.',
    },
    {
        'q': '(Sep 2023 Q3) **What is the relation between the state space and the search tree?** (select all that '
             'apply)',
        'options': [
            'Each node of the search tree corresponds to one state of the state space',
            'A state can correspond to several nodes, one for each path that reaches it from the initial state',
            'The search tree can be infinite even if the state space is finite (e.g. reversible actions)',
            'The search tree always has fewer nodes than the state space has states',
        ],
        'answer': [0, 1, 2],
        'explain': '**Model answer:** "Each node corresponds to a state; each state can correspond to multiple nodes '
                   'when it can be reached from the initial state by multiple paths. With cycles (e.g. 8-puzzle moves '
                   'that can be undone) the tree is infinite although the state space is finite." The tree is usually '
                   'only partially built, but in general it is much **larger** than the state space (slides p.95–97).',
    },
    {
        'q': '(Sep 2023 Q4) **Write the pseudocode of a generic search algorithm.** Which elements must it contain? '
             '(select all that apply)',
        'options': [
            'Initialize the tree (the frontier) with the root node of the initial state',
            'Loop: if there are no candidate nodes for expansion, return failure',
            'Select a node not yet expanded (according to the strategy); if it corresponds to a goal state, return '
            'the solution',
            'Otherwise expand it: generate its children and add them to the tree (frontier)',
            'Always select the child with the smallest heuristic value',
        ],
        'answer': [0, 1, 2, 3],
        'explain': '**Model answer** (slides p.98):\n\n'
                   '```text\ninitialize the root of the tree with the initial state of problem\nLOOP DO\n'
                   '    IF there are no more nodes candidate for expansion THEN RETURN failure\n'
                   '    select a node not yet expanded\n'
                   '    IF the node corresponds to a goal state THEN RETURN the corresponding solution\n'
                   '    ELSE expand the chosen node, adding the resulting nodes to the tree\n```\n\n'
                   'For graph search add a `reached` table and add a child only if its state is new or reached with '
                   'a higher cost. "Smallest heuristic value" is one particular strategy (greedy), not part of the '
                   'generic scheme.',
    },
    {
        'q': '(Sep 2023 Q5) Given the generic algorithm, **how is a search strategy defined?**',
        'options': [
            'By the order of the nodes in the frontier, i.e. by which node is selected next for expansion',
            'By the goal test it uses',
            'By the way `result` computes the successors',
            'By whether it returns the path or only the goal state',
        ],
        'answer': 0,
        'explain': '**Model answer:** "A search strategy determines the selection of the next node to expand, by '
                   'ordering the nodes in the frontier" (official answer). FIFO → breadth-first, LIFO → depth-first, '
                   'priority on $g$ → uniform-cost, on $g + h$ → A*. In `best_first_search(problem, f)` the strategy is '
                   'just the function $f$.',
    },
    {
        'q': '(Feb 2024 Q6) True or false: *consider a search problem in which the state space includes variable '
             '$x$. Then any quantity that is a deterministic function of $x$ does not need to be included in the state '
             'space.*',
        'options': ['True', 'False'],
        'answer': 0,
        'explain': r'**Model answer:** "True: if $y = f(x)$, every state with the same value of $x$ has the same $y$, so '
                   r'$y$ does not distinguish any states and can be recomputed from $x$ whenever actions, results, goal '
                   r'test or costs need it" (official answer: "for each value of $x$ the value of $y$ will always be the '
                   r'same"). Storing it anyway is only a cache (like keeping the index of the 8-puzzle blank). The trap: '
                   r'a quantity that depends on **how** you reached $x$ (the history) is *not* a function of $x$ and, if it '
                   r'matters for the future, must be in the state.',
    },
]
