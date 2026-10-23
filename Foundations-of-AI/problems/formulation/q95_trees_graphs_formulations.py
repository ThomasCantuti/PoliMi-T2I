TITLE = 'Search trees, repeated states and formulation choices'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['states vs nodes', 'tree search vs graph search', 'repeated states', 'state-space size', 'exam-style']

STATEMENT = r"""
Exam-style questions on slides p. 71–109: how formulations change the state space, nodes vs states,
frontier and `reached`, tree search vs graph search.
"""

QUESTIONS = [
    {
        'q': 'Which statements about **states and nodes** are true? (select all)',
        'options': [
            'A node corresponds to a path from the initial state to a state.',
            'Each state corresponds to exactly one node of the search tree.',
            'A node stores its state, its parent, the action that generated it and the path cost.',
            'If states can be revisited, the search tree can be infinite even if the state space is finite.',
        ],
        'answer': [0, 2, 3],
        'explain': 'A state reachable by several paths corresponds to several nodes (slides p. 95–96).',
    },
    {
        'q': 'The **frontier** is…',
        'options': [
            'the set of states already expanded',
            'the set of nodes that have been generated but not yet chosen for expansion',
            'the set of goal states',
        ],
        'answer': 1,
        'explain': 'Slides p. 99. Expanded states are what the `reached` table remembers in graph search.',
    },
    {
        'q': 'What distinguishes one search **strategy** from another in the generic algorithm?',
        'options': [
            'The goal test.',
            'The ordering of the nodes in the frontier (which node is selected next).',
            'The `result` function.',
        ],
        'answer': 1,
        'explain': 'Slides p. 100: "A search strategy determines the ordering of nodes in the frontier." In '
                   '`best_first_search(problem, f)` the strategy is just $f$.',
    },
    {
        'q': 'In the graph-search algorithm (slides p. 106), a newly generated child is added to the frontier when…',
        'options': [
            'always',
            'its state is not in `reached`, **or** its path cost is lower than that of the node stored in `reached`',
            'its state is not the parent\'s state',
            'its state is a goal',
        ],
        'answer': 1,
        'explain': 'The second condition matters when costs differ: a cheaper path to an already reached state must '
                   'not be thrown away.',
    },
    {
        'q': '8-queens, first formulation: the slides say the space contains $64 \\times 63 \\times \\dots \\times 57 '
             '\\approx 1.8 \\times 10^{14}$ "states". What does this number actually count?',
        'options': [
            'The number of distinct arrangements of 8 queens on the board.',
            'The number of **sequences** of 8 placements (nodes at depth 8 of the search tree); each arrangement '
            'is counted $8!$ times.',
            'The number of solutions.',
        ],
        'answer': 1,
        'explain': 'Distinct arrangements of 8 queens are $\\binom{64}{8} \\approx 4.4 \\times 10^9$. Placing the same '
                   'queens in a different order gives a different **node** but the same **state**.',
    },
    {
        'q': 'Why does the **second** 8-queens formulation have only 2057 states?',
        'options': [
            'Because it uses a better search algorithm.',
            'Because queens are placed column by column (leftmost empty column) and only on non-attacked '
            'squares: states are consistent partial solutions and each is reached by a single path.',
            'Because it ignores diagonals.',
        ],
        'answer': 1,
        'explain': 'The formulation, not the algorithm, shrinks the space: order is fixed and constraints are '
                   'enforced inside `actions()`.',
    },
    {
        'q': 'Match the slides\' classification (p. 107): which problems have **many repeated states** '
             '(infinite search tree)? (select all)',
        'options': ['8-queens (incremental)', 'assembly planning', '8-puzzle', 'robot navigation on a grid'],
        'answer': [2, 3],
        'explain': '8-queens: no repeated states; assembly planning: few. Both have finite trees. The 8-puzzle and '
                   'grid navigation have **reversible** actions: every move can be undone, so the tree is infinite.',
    },
    {
        'q': 'Tree search vs graph search: which is true?',
        'options': [
            'Graph search uses less memory than tree search.',
            'Graph search avoids re-expanding repeated states at the price of storing the `reached` table '
            '(memory proportional to the states reached).',
            'Tree search never terminates.',
        ],
        'answer': 1,
        'explain': 'Tree search can terminate (e.g. BFS when a goal is reachable) but can waste exponential time '
                   're-exploring states — or loop forever with DFS. Graph search trades memory for time.',
    },
    {
        'q': 'How many states of the 8-puzzle are **reachable** from a given state?',
        'options': ['$9! = 362\\,880$', '$9!/2 = 181\\,440$', '$8! = 40\\,320$', '$2^9$'],
        'answer': 1,
        'explain': 'The slides count $9!$ arrangements; the parity of the permutation is invariant under moves, so '
                   'the state space splits into two disconnected halves.',
    },
    {
        'q': 'Path planning (slides p. 81–86): which formulation has the **fewest states** and still contains '
             'the true **shortest path** among polygonal obstacles?',
        'options': ['8-connected grid', 'cell decomposition', 'visibility graph (obstacle vertices)'],
        'answer': 2,
        'explain': 'Shortest paths among polygons bend only at obstacle corners, so the visibility graph (start, goal, '
                   'vertices) is enough. The grid has many states and 45° paths; cell decomposition has few states '
                   'but its paths through region centers are not optimal.',
    },
    {
        'q': 'Water jugs `(4, 3)`: a student defines the state as the **whole history** of actions done so far. '
             'What is wrong with that formulation?',
        'options': [
            'Nothing: it is more informative.',
            'The state space becomes infinite and every node has its own state, so repeated situations '
            'are never recognized: the state must contain only what matters for the future (the liters per jug).',
            'It makes the goal test impossible.',
        ],
        'answer': 1,
        'explain': 'Abstraction: keep exactly the information needed to decide applicable actions, their results, '
                   'the goal test and the costs. Then 14 states suffice.',
    },
]
