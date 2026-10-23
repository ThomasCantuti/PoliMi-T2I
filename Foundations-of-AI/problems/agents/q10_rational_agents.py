TITLE = 'Rational agents and PEAS'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['rationality', 'performance measure', 'PEAS', 'agent function']

STATEMENT = r"""
Check that you can state **what makes an agent rational** and describe a task environment with
**PEAS** (Performance measure, Environment, Actuators, Sensors). Slides p. 20–30.
"""

QUESTIONS = [
    {
        'q': 'Which definition of a **rational agent** matches the course?',
        'options': [
            'An agent that always reaches the best possible outcome.',
            'For every possible percept sequence, it chooses the action that maximizes the **expected** '
            'value of its performance measure, given its knowledge up to that moment.',
            'An agent that thinks like a human, so that it passes the Turing test.',
            'An agent that knows the actual outcome of each of its actions before acting.',
        ],
        'answer': 1,
        'explain': 'Rationality is about the **expected** value of the performance measure, given the '
                   '**percept sequence** and the agent\'s **knowledge so far** (slides p. 24). '
                   'It is not omniscience (knowing actual outcomes) and it is not "acting humanly".',
    },
    {
        'q': 'An agent looks both ways, crosses an empty street, and is hit by a cargo door falling from a plane. '
             'Was its action rational?',
        'options': [
            'No: the outcome was terrible, so the action was irrational.',
            'Yes: given its percepts and knowledge, crossing maximized the expected performance.',
            'It cannot be judged without knowing the agent architecture.',
        ],
        'answer': 1,
        'explain': 'Rational ≠ omniscient. Rationality is judged on the **expected** performance given what the '
                   'agent could perceive and knew, not on the actual outcome.',
    },
    {
        'q': 'Rationality at a given time depends on… (select **all** that apply)',
        'options': [
            'the performance measure that defines success',
            'the agent\'s prior knowledge of the environment',
            'the actions the agent can perform',
            'the agent\'s percept sequence to date',
            'the percepts the agent will receive in the future',
        ],
        'answer': [0, 1, 2, 3],
        'explain': 'The four ingredients of rationality. Future percepts are not available when deciding.',
    },
    {
        'q': 'Who defines the **performance measure**?',
        'options': [
            'The agent itself, according to what it finds pleasant.',
            'The designer, as a criterion evaluating the behavior (the sequence of environment states).',
            'The environment, through the percepts.',
        ],
        'answer': 1,
        'explain': 'Slides p. 30: the performance measure is the criterion for evaluating the success of the '
                   'behavior of an agent, **defined by the designer**. If the agent could choose it, it could '
                   'simply declare itself successful ("sour grapes").',
    },
    {
        'q': 'What is the difference between the **agent function** and the **agent program**?',
        'options': [
            'They are synonyms.',
            'The agent function is an abstract mapping from percept **sequences** to actions; the agent '
            'program is a concrete implementation that runs on the architecture and receives one percept at a time.',
            'The agent program maps percept sequences to actions; the agent function is the hardware.',
        ],
        'answer': 1,
        'explain': '$f: P^\\ast \\to A$ is a mathematical description (slides p. 23). The program implements it: it gets '
                   'the **current** percept and must remember whatever else it needs (persistent variables).',
    },
    {
        'q': 'PEAS of a **part-picking robot**: "percentage of parts in correct bins" is the…',
        'options': ['Performance measure', 'Environment', 'Actuators', 'Sensors'],
        'answer': 0,
        'explain': 'AIMA Fig. 2.5 (slides p. 26). Environment: conveyor belt with parts, bins. Actuators: jointed '
                   'arm and hand. Sensors: camera, tactile and joint angle sensors.',
    },
    {
        'q': 'PEAS of a **medical diagnosis system**: "display of questions, tests, diagnoses, treatments" is the…',
        'options': ['Performance measure', 'Environment', 'Actuators', 'Sensors'],
        'answer': 2,
        'explain': 'A software agent acts by **displaying** things: that is its actuator. Its sensors are the '
                   'touchscreen/voice entry of symptoms and findings; P = healthy patient, reduced costs.',
    },
    {
        'q': 'Automated taxi: which of these are **sensors**? (select all)',
        'options': ['cameras', 'GPS', 'accelerator and brake', 'speedometer', '"safe, fast, legal trip"'],
        'answer': [0, 1, 3],
        'explain': 'Accelerator/brake are **actuators**; "safe, fast, legal, comfortable trip" is the '
                   '**performance measure**.',
    },
]
