TITLE = 'Exam · Short questions on agent architectures (2023–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'agent architectures', 'model-based reflex agent', 'utility-based agent', 'learning agent']

STATEMENT = r"""
Architecture questions from the written exams of **14 June 2023** (Problem 1, 4 points), **12 July 2024**
(Intelligent Agent Architectures, Questions 1–3), **11 June 2026** (Problem 2, Question 2) and **31 August 2026**
(Problem 1, Question 3). The simple reflex architecture (July 2022) is in the light-seeking robot problem.

"Draw the architecture" questions are answered with the box diagram of the slides (p.37, 43, 47, 50): sensors and
effectors at the border with the environment, the internal boxes, and arrows from percept to action. Name every
box and say what it does.
"""

QUESTIONS = [
    {
        'q': '(Jun 2023) **Reflex agent with state** (model-based reflex agent): which components does it have that a '
             '*simple* reflex agent does not? (select all that apply)',
        'options': [
            'an internal **state**: the agent\'s current picture of the world',
            'a model of **how the world evolves** independently of the agent (environment model)',
            'a model of **what my actions do** (action model)',
            '**goals** describing desirable situations',
            'a **utility** function',
        ],
        'answer': [0, 1, 2],
        'explain': '**Model answer (diagram):** sensors → "what the world is like now", computed from the percept, the '
                   'internal **state**, the **environment model** (how the world evolves) and the **action model** '
                   '(what my actions do); then **condition–action rules** → "what action I should do now" → effectors. '
                   'Role: the state keeps track of the part of the world the sensors cannot see now; the two models '
                   '(together: the transition model, plus a sensor model in AIMA 4th ed.) update it at every step. Goals '
                   'and utility belong to the next two architectures; the rules are still reflex rules.',
    },
    {
        'q': '(Jun 2023) In `state ← UPDATE-STATE(state, action, percept, transition_model, sensor_model)`, what is '
             'combined to obtain the new state?',
        'options': [
            'The previous state, the last action performed, the current percept and the models of the world',
            'Only the current percept, as in a simple reflex agent',
            'The whole percept sequence, looked up in a table',
            'The predicted outcomes of every possible action, weighted by their utility',
        ],
        'answer': 0,
        'explain': '**Model answer:** "The agent predicts how the world has changed since the last step (previous state + '
                   'last action through the transition model) and corrects the prediction with what it perceives now '
                   '(sensor model); then it matches the rules against this state." A table over percept sequences is '
                   'the table-driven agent; weighing outcomes by utility is the utility-based agent.',
    },
    {
        'q': '(Jun 2023) Which is a good **example of application** of a reflex agent with state?',
        'options': [
            'The Roomba 980, which builds a map of the house with SLAM while cleaning and uses it to cover every room',
            'The first Roomba, which moved more or less randomly and turned when it bumped into an obstacle',
            'A thermostat that switches the heating on when the temperature is below 20 °C',
            'An investor agent that chooses the portfolio with maximum expected gain',
        ],
        'answer': 0,
        'explain': 'Slides p.45: the map is the internal state, kept up to date as the robot moves and perceives. The '
                   'first Roomba and the thermostat react to the current percept only (simple reflex); the investor '
                   'maximizes expected utility (utility-based). The vacuum agent that remembers which squares are clean '
                   '(and stops with NoOp) is another good example.',
    },
    {
        'q': '(Jul 2024 Q1) **Draw the architecture of a utility-based agent and explain its components.** What does it '
             'add to the goal-based agent?',
        'options': [
            'After predicting "what the world will be like if I do action $a$" (state + models), a **utility** box '
            'evaluates "how happy I will be in such a state"; the agent chooses the action with the best (expected) '
            'utility',
            'A table that maps each percept to an action',
            'A critic that compares the behaviour with a performance standard',
            'Nothing: utility-based and goal-based are two names for the same architecture',
        ],
        'answer': 0,
        'explain': r'**Model answer (diagram):** sensors → state, environment model, action model → "what the world is like '
                   r'now" → "what it will be like if I do action $a$" → **utility**: "how happy I will be in such a state" '
                   r'→ "what action I should do now" → effectors. The goal-based agent has a **goals** box in place of the '
                   r'utility: a binary happy/unhappy test. With uncertain outcomes the agent maximizes the **expected** '
                   r"utility $\sum_{s'} P(s' \mid s, a)\, U(s')$. The critic belongs to the learning agent.",
    },
    {
        'q': '(Jul 2024 Q2) Give an example of application of a **utility-based** agent that **could not** be implemented '
             'by a goal-based agent.',
        'options': [
            'A stock-market agent that must maximize the financial gain: there is no precise goal state, only better '
            'and worse outcomes (also: a taxi trading off speed against safety)',
            'A route finder that must reach a given city',
            'An 8-puzzle solver',
            'A thermostat',
        ],
        'answer': 0,
        'explain': '**Model answer:** "A stock-market agent maximizing financial gain, or any task with no precise '
                   'definition of a goal state" (official answer). A goal only distinguishes success from failure; a '
                   'utility measures *how* good a state is, so it can trade off conflicting objectives (speed vs safety) '
                   'and weigh the likelihood of success against the importance of the goals (slides p.51).',
    },
    {
        'q': '(Jul 2024 Q3) Give an example of application of a **goal-based** agent that **could not** be implemented '
             'by a utility-based agent.',
        'options': [
            'There is none: a utility-based agent can always implement a goal-based agent (utility 1 in goal states, '
            '0 elsewhere)',
            'A route finder: utilities cannot express "reach Bucharest"',
            'Chess: only goals can express checkmate',
            'Any agent in a deterministic environment',
        ],
        'answer': 0,
        'explain': '**Model answer:** "None exists: a utility-based agent can always implement a goal-based one, by giving '
                   'maximum utility to the goal states and minimum to the others" (official answer: e.g. the tic-tac-toe '
                   'AI based on Q-learning compared in class with goal-based players). It is a trick question: the '
                   'correct answer is to say that the example does not exist and **why**. Inventing an example costs '
                   'negative points.',
    },
    {
        'q': '(Aug 2026 Q3) Colleagues state that (1) **all goal-based agents can be implemented with a utility-based '
             'architecture**, and therefore (2) **the company should only develop utility-based agents**. Do you agree?',
        'options': [
            '(1) yes: utility maximal in the goal states and zero elsewhere (e.g. the maze solved with A* and then '
            'with Q-learning in class). (2) no, or at least questionable: use the technique that fits the problem — '
            'goal-based methods like A* find one optimal path with guarantees, Q-learning learns a whole state-action '
            'mapping and is optimal only asymptotically',
            '(1) yes and (2) yes: a more general architecture is always better',
            '(1) no: goal-based agents can solve problems that utility-based agents cannot',
            '(1) no and (2) no: the two architectures are unrelated',
        ],
        'answer': 0,
        'explain': '**Model answer:** "(1) is true: set the utility to the maximum when the agent reaches the goal and to '
                   'zero in every other state. (2) is questionable: utility-based agents can solve all the problems of '
                   'goal-based agents, but it is better to use the technique most appropriate to the problem (do not use '
                   'a sledgehammer to crack a nut). In the maze task A* searches one optimal path, with optimality and '
                   'termination guarantees; a Q-learning agent learns a much more complex object (the expected payoff of '
                   'every state-action pair) and its optimality is only asymptotic, under specific conditions" (official '
                   'answer). Answer (1) and (2) separately, as the question asks.',
    },
    {
        'q': '(Jun 2026 Q2) What is the relation between the four architectures (simple reflex, model-based reflex, '
             'goal-based, utility-based) and the architecture of the **learning agent**?',
        'options': [
            'The learning agent adds the elements needed to learn (learning element, critic, problem generator) around '
            'a **performance element**, which can be implemented with any of the four architectures',
            'The learning agent is a fifth architecture that replaces the other four',
            'Only utility-based agents can learn',
            'The learning agent is a simple reflex agent whose rules are chosen at random',
        ],
        'answer': 0,
        'explain': '**Model answer:** "A learning agent consists of the elements that introduce learning into any agent '
                   'architecture: its performance element (which selects the actions) can be implemented with any of the '
                   'four architectures" (official answer). The other components (AIMA §2.4.6, not on the slides): the '
                   '**critic** judges the behaviour against a fixed performance standard, the **learning element** uses '
                   'that feedback to improve the performance element, the **problem generator** suggests exploratory '
                   'actions.',
    },
]
