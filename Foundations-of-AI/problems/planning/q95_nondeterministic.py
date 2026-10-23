TITLE = 'Planning and acting in nondeterministic domains'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['belief state', 'sensorless planning', 'contingent planning', 'replanning', 'execution monitoring']

STATEMENT = r"""
What changes when the world is partially observable or nondeterministic (AIMA §11.5). This section is in the
course calendar but has not been asked in the past written exams: the questions check the main ideas only.
"""

QUESTIONS = [
    {
        'q': 'Which assumptions of classical planning are dropped in AIMA §11.5? (select all)',
        'options': [
            'Full observability: the agent may not know the current state',
            'Determinism: an action may have several possible outcomes',
            'The world is described with logical atoms',
            'Action schemas have preconditions and effects',
        ],
        'answer': [0, 1],
        'explain': 'The representation (atoms, schemas) stays; what changes is that the agent reasons about '
                   '**belief states** (sets of possible states) and possibly about percepts.',
    },
    {
        'q': 'In a belief state, what is the status of an atom that is not mentioned?',
        'options': [
            'False, by the closed-world assumption',
            'Unknown: the closed-world assumption is dropped (open world)',
            'True',
            'It cannot happen',
        ],
        'answer': 1,
        'explain': 'A belief state describes what the agent **knows**: an unmentioned fluent may be true or false. '
                   'Under the closed-world assumption it would be considered false, which is wrong when the agent '
                   'simply does not know (e.g. the color of a chair it has not looked at).',
    },
    {
        'q': 'A **sensorless (conformant)** plan is:',
        'options': [
            'a plan with if-then-else branches on percepts',
            'a single sequence of actions that reaches the goal from **every** state of the initial belief state, '
            'without using percepts',
            'a plan that is recomputed after every action',
            'a plan that only works in deterministic worlds',
        ],
        'answer': 1,
        'explain': 'AIMA\'s example: paint the chair and the table with the same can (open it, paint both). '
                   'Whatever the initial colors, both objects end up with the same color: no sensing needed.',
    },
    {
        'q': 'A **contingent** plan differs from a classical one because it:',
        'options': [
            'contains conditional branches that depend on what the agent perceives during execution',
            'is always shorter',
            'never uses percepts',
            'is found by SATPlan',
        ],
        'answer': 0,
        'explain': 'E.g. look at the table and the chair; **if** they already have the same color do nothing, '
                   '**else** open a can, look at its color and paint accordingly. Percept schemas describe what can '
                   'be sensed and when.',
    },
    {
        'q': 'Online planning with **execution monitoring**: which checks are performed while executing a plan? '
             '(select all)',
        'options': [
            'Action monitoring: are the preconditions of the next action still satisfied?',
            'Plan monitoring: will the remaining plan still achieve the goal?',
            'Goal monitoring: is there a better goal to pursue now?',
            'Proof monitoring: is the plan logically valid in every possible world?',
        ],
        'answer': [0, 1, 2],
        'explain': 'When monitoring detects that something unexpected happened, the agent **replans** (often a '
                   'repair that gets back to some point of the old plan) instead of failing.',
    },
]
