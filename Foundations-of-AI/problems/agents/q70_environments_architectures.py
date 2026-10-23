TITLE = 'Environment properties and agent architectures'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['environment properties', 'agent architectures', 'exam-style']

STATEMENT = r"""
Exam-style questions: classify task environments along the seven dimensions of slides p. 27–29 and
pick the right agent architecture (slides p. 35–51).
"""

QUESTIONS = [
    {
        'q': 'A **crossword puzzle** solver. Select all properties of its task environment.',
        'options': ['fully observable', 'single-agent', 'deterministic', 'episodic', 'static', 'discrete'],
        'answer': [0, 1, 2, 4, 5],
        'explain': 'AIMA Fig. 2.6: fully observable, single, deterministic, **sequential** (a word you write '
                   'constrains later words), static, discrete.',
    },
    {
        'q': '**Poker**: which statement is **false**?',
        'options': [
            'It is partially observable (you cannot see the other hands).',
            'It is multiagent.',
            'It is deterministic, because the rules are fixed.',
            'It is sequential.',
        ],
        'answer': 2,
        'explain': 'The deck is shuffled: the outcome of dealing is uncertain → **stochastic**. Fixed rules do '
                   'not make an environment deterministic; "deterministic" means the next state is completely '
                   'determined by the current state and the action.',
    },
    {
        'q': '**Taxi driving** is…',
        'options': [
            'partially observable, multiagent, stochastic, sequential, dynamic, continuous',
            'fully observable, multiagent, stochastic, episodic, dynamic, continuous',
            'partially observable, single-agent, deterministic, sequential, static, discrete',
        ],
        'answer': 0,
        'explain': 'The hardest case on every axis: the "real world".',
    },
    {
        'q': 'Why is **image analysis** (classifying each picture) **episodic**?',
        'options': [
            'Because images are continuous.',
            'Because each decision depends only on the current image and does not affect future decisions.',
            'Because the camera is fully observable.',
        ],
        'answer': 1,
        'explain': 'Episodic = experience divided into independent atomic episodes. In a **sequential** '
                   'environment the current decision can affect all future ones (chess, driving).',
    },
    {
        'q': '**Chess with a clock** is classified as **semidynamic**. Why?',
        'options': [
            'The board changes while the player is thinking.',
            'The environment does not change while the agent deliberates, but its performance score does (time runs).',
            'Because the opponent is unpredictable.',
        ],
        'answer': 1,
        'explain': 'Static: nothing changes while you think. Dynamic: the world changes. Semidynamic: the world '
                   'stays, but the clock (and so the score) does not.',
    },
    {
        'q': '**Known vs unknown** refers to…',
        'options': [
            'whether the agent can see the whole state (same as fully vs partially observable).',
            'the agent\'s (or designer\'s) knowledge of the "laws of physics" of the environment: the outcomes of actions.',
            'whether other agents are present.',
        ],
        'answer': 1,
        'explain': 'They are independent axes: solitaire card games are **known** but partially observable; a new '
                   'video game whose screen shows everything can be fully observable but **unknown** (you do not '
                   'know what the buttons do yet).',
    },
    {
        'q': 'Stochastic vs nondeterministic: which is correct?',
        'options': [
            'They are synonyms.',
            'Stochastic: uncertainty about outcomes quantified with probabilities. Nondeterministic: possible outcomes '
            'listed without probabilities.',
            'Nondeterministic: probabilities are known; stochastic: they are not.',
        ],
        'answer': 1,
        'explain': 'AIMA 4th ed. distinction (slides p. 27 lists both).',
    },
    {
        'q': 'Which architectures **need a model** of how the world evolves and of the effects of actions? (select all)',
        'options': ['simple reflex agent', 'model-based reflex agent', 'goal-based agent', 'utility-based agent'],
        'answer': [1, 2, 3],
        'explain': 'Only the simple reflex agent maps the current percept directly to an action. The others keep a '
                   'state; goal- and utility-based agents also use the model to predict "what the world will be '
                   'like if I do action a" (slides p. 43, 47, 50).',
    },
    {
        'q': 'Match the robot to the architecture: the **first Roomba** (moves more or less randomly, turns when it '
             'bumps) and the **Roomba 980** (builds a map with SLAM).',
        'options': [
            'simple reflex agent; model-based reflex agent',
            'model-based reflex agent; goal-based agent',
            'simple reflex agent; utility-based agent',
        ],
        'answer': 0,
        'explain': 'Slides p. 40 and 45. The map is the internal state that the model-based agent keeps up to date.',
    },
    {
        'q': 'A simple reflex agent in a **partially observable** environment…',
        'options': [
            'is always rational.',
            'can get stuck in infinite loops; randomizing its actions or keeping an internal state helps.',
            'becomes a goal-based agent.',
        ],
        'answer': 1,
        'explain': 'It works only if the right decision can be made from the current percept alone '
                   '(i.e. essentially when the environment is fully observable).',
    },
    {
        'q': 'When is a **utility-based** agent needed instead of a goal-based one?',
        'options': [
            'When there are conflicting goals (speed vs safety) or uncertain outcomes whose likelihood must be '
            'weighed against the importance of the goals.',
            'Whenever the environment is discrete.',
            'Only in multiagent environments.',
        ],
        'answer': 0,
        'explain': 'Slides p. 51. A goal only says "happy / unhappy"; a utility function says *how* happy.',
    },
    {
        'q': 'The search problems of the next lectures assume the environment is… (select all)',
        'options': ['fully observable', 'static', 'discrete', 'deterministic', 'multiagent'],
        'answer': [0, 1, 2, 3],
        'explain': 'Slides p. 69. Then the solution is a fixed sequence of actions that can be computed in advance '
                   'and executed "with eyes closed". Multiagent (adversarial) settings come later with games.',
    },
]
