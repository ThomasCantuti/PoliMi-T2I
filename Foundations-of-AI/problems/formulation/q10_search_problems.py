TITLE = 'What is a search problem?'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['problem formulation', 'state space', 'solution', 'abstraction']

STATEMENT = r"""
The vocabulary of problem formulation (slides p. 53–70): states, `actions(s)`, `result(s, a)`, goal
test, step cost, state space, solution, optimal solution, abstraction.
"""

QUESTIONS = [
    {
        'q': 'Which of these is **not** part of the formulation of a search problem?',
        'options': [
            'the set of states and the initial state $s_0$',
            'the function `actions(s)` and the function `result(s, a)`',
            'the goal test and the step cost $c(s, a, s\')$',
            'the frontier and the order in which nodes are expanded',
        ],
        'answer': 3,
        'explain': 'The frontier and its ordering belong to the **search algorithm** (the strategy), not to the '
                   'problem (slides p. 62 vs p. 99–100). The same problem can be solved by many strategies.',
    },
    {
        'q': 'A **solution** to a search problem is…',
        'options': [
            'a state that satisfies the goal test',
            'a path in the state space from the initial state to a state that satisfies the goal test',
            'the search tree built by the algorithm',
        ],
        'answer': 1,
        'explain': 'Slides p. 64: the solution is the **sequence of actions** (path), not just the goal state. '
                   'In the 8-puzzle the goal state is known in advance — what we search for is how to get there.',
    },
    {
        'q': 'The **optimal** solution is the one with…',
        'options': ['the fewest actions', 'the lowest path cost (sum of the step costs)', 'the fewest expanded nodes'],
        'answer': 1,
        'explain': 'Slides p. 65. "Fewest actions" coincides with "lowest cost" only when all step costs are equal. '
                   'And a problem could have no solution at all.',
    },
    {
        'q': 'The **state space** is…',
        'options': [
            'a directed graph: nodes are states, arcs are actions (an arc s → s\' iff s\' is a successor of s)',
            'the search tree rooted at the initial state',
            'the set of goal states',
        ],
        'answer': 0,
        'explain': 'Slides p. 63. The state space is usually **implicit** — defined by `actions` and `result` — '
                   'and far too large to be built explicitly (slides p. 67).',
    },
    {
        'q': 'In the slides\' 8-puzzle state below, which actions does `actions(s)` return? (an action is the move '
             'of the **blank**)\n\n```text\n8 2 7\n3 4 _\n5 1 6\n```',
        'options': ['{up, down, left}', '{up, down, left, right}', '{left, right}', '{up, down}'],
        'answer': 0,
        'explain': 'The blank is on the right edge: it cannot move right (slides p. 60).',
    },
    {
        'q': 'Same state. What is `result(s, left)`?',
        'options': [
            '```text\n8 2 7\n3 _ 4\n5 1 6\n```',
            '```text\n8 2 _\n3 4 7\n5 1 6\n```',
            '```text\n8 2 7\n3 4 6\n5 1 _\n```',
        ],
        'answer': 0,
        'explain': 'The blank moves left, i.e. tile 4 slides right (slides p. 61). The other two options are '
                   '`result(s, up)` and `result(s, down)`.',
    },
    {
        'q': 'A state of the 8-puzzle ignores the colors and the material of the tiles. This is an example of…',
        'options': ['abstraction', 'a heuristic', 'a relaxed problem', 'partial observability'],
        'answer': 0,
        'explain': 'Slides p. 70: a state is an abstract representation of all the physical situations that share '
                   'the fundamental properties (relative positions of the tiles). A good abstraction removes as much '
                   'detail as possible while every abstract solution can still be carried out in the real world.',
    },
    {
        'q': 'Problem-solving agents (search) are examples of…',
        'options': ['simple reflex agents', 'goal-based agents', 'table-driven agents'],
        'answer': 1,
        'explain': 'Slides p. 55: formulate the problem → search for the solution → execute it. They use a model '
                   '(`result`) to predict what happens and a goal to decide.',
    },
    {
        'q': 'Why can we not just build the whole state space and then look for the goal?',
        'options': [
            'Because the state space is not a graph.',
            'Because it is usually astronomically large (15-puzzle ~10¹³ states, chess 10⁴³–10⁵⁰, Go 10¹⁷⁰): '
            'the agent must find a solution exploring only a small portion of it.',
            'Because states cannot be compared.',
        ],
        'answer': 1,
        'explain': 'Slides p. 66–68: it is a matter of time **and** memory.',
    },
]
