TITLE = 'STRIPS and PDDL: states, goals, action schemas'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['STRIPS', 'PDDL', 'closed-world assumption', 'action schema', 'fluents', 'frame problem']

STATEMENT = r"""
The representation of classical planning (AIMA §11.1): ground atoms, the closed-world assumption, action
schemas with preconditions and effects, STRIPS vs PDDL, fluents vs static predicates.
"""

QUESTIONS = [
    {
        'q': 'Which of these can **not** appear in a STRIPS/PDDL **state**? (select all)',
        'options': [
            '`On(A,B)`',
            '`¬Clear(A)`',
            '`At(x, SFO)`',
            '`At(Father(Ali), SFO)`',
        ],
        'answer': [1, 2, 3],
        'explain': 'A state is a set of **ground, function-free, positive** atoms. Negative literals are not '
                   'written: under the closed-world assumption an atom that is not listed is false. `At(x,SFO)` '
                   'has a variable, `Father(Ali)` is a function term.',
    },
    {
        'q': 'State $s$ = {On(C,A), On(A,Table), On(B,Table), Clear(B), Clear(C), Handempty}. What is the truth '
             'value of Clear(A) in $s$?',
        'options': ['True', 'False', 'Unknown: it is not mentioned', 'It depends on the goal'],
        'answer': 1,
        'explain': '**Closed-world assumption**: every atom not in the state is false. (When planning with '
                   'belief states, AIMA §11.5, this assumption is dropped and unmentioned atoms become unknown.)',
    },
    {
        'q': r'Which formula gives the state reached by applying an applicable ground action $a$ in $s$?',
        'options': [
            r'$(s \cup \textit{ADD}(a)) - \textit{DEL}(a)$',
            r'$(s - \textit{DEL}(a)) \cup \textit{ADD}(a)$',
            r'$\textit{ADD}(a)$',
            r'$s \cup \textit{ADD}(a) \cup \textit{PRE}(a)$',
        ],
        'answer': 1,
        'explain': r'AIMA: $\textit{RESULT}(s, a) = (s - \textit{DEL}(a)) \cup \textit{ADD}(a)$. The order matters '
                   r'only if an atom is both deleted and added (`Move(B1,T1,T1)`, exam 16 Jan 2025): with this '
                   r'formula it stays true. All the atoms not mentioned in the effect are copied unchanged.',
    },
    {
        'q': 'How do STRIPS action schemas deal with the **frame problem** (what does not change)?',
        'options': [
            'With one frame axiom per action and per predicate',
            'They do not: every effect must list all the true atoms of the next state',
            'Implicitly: every atom not in the add or delete list keeps its value',
            'With negative preconditions',
        ],
        'answer': 2,
        'explain': 'The effect lists only the changes; RESULT copies everything else. In SATPlan, where states '
                   'become propositional symbols, the same information must be written explicitly: that is the '
                   'job of the fluent (successor-state) axioms.',
    },
    {
        'q': 'Which feature does PDDL have that (basic) STRIPS does not, in the course?',
        'options': [
            'Negative literals in preconditions and goals, e.g. `¬At(Pit, c2)`',
            'Delete lists',
            'The closed-world assumption',
            'Action schemas with parameters',
        ],
        'answer': 0,
        'explain': 'STRIPS preconditions and goals are positive. PDDL allows negated literals (and, in its '
                   'extensions, typing, quantifiers, arithmetic). Both have delete effects, parameters and the '
                   'closed-world assumption for states. Consequence (exam 18 Jan 2023): a PDDL model needs the '
                   'same constants and schemas but possibly **fewer predicates** (`HandEmpty` is no longer '
                   'needed as a separate positive fact).',
    },
    {
        'q': 'Making tea (exam 25 Jan 2022) with predicates water(x), kettle(x), cup(x), in(x,y), hot(x), '
             'empty(x). Which are **fluents** (time-dependent)?',
        'options': [
            'water(x), kettle(x), cup(x)',
            'in(x,y), hot(x), empty(x)',
            'all of them',
            'only in(x,y)',
        ],
        'answer': 1,
        'explain': 'A fluent is a predicate some action can change: pouring changes in() and empty(), boiling '
                   'changes hot(). water(), kettle(), cup() are **static** typing predicates, true or false '
                   'forever. SATPlan reifies only the fluents.',
    },
    {
        'q': 'The goal `Box(x) ∧ InRoom(x, R1)` (exam 30 Aug 2022) means:',
        'options': [
            'every object x is a box in R1',
            'some box is in R1 (x is existentially quantified)',
            'it is not a legal goal: goals must be ground',
            'the box called x is in R1',
        ],
        'answer': 1,
        'explain': 'Variables in a goal are read existentially: any state containing Box(c) and InRoom(c, R1) '
                   'for some constant c satisfies it. With a single box it is the same as the ground goal '
                   'Box(BOX1) ∧ InRoom(BOX1, R1).',
    },
    {
        'q': r'`Fly(p, from, to)` with $\textit{from} \ne \textit{to}$, 2 planes and 3 airports, typed '
             r'parameters. How many ground actions?',
        'options': ['6', '12', '18', '216'],
        'answer': 1,
        'explain': r'$2 \cdot 3 \cdot 2 = 12$: 2 planes × 3 departure airports × 2 different destinations. Without '
                   r'typing over the 5 constants and without ≠ it would be $5^3 = 125$; typing and ≠ remove '
                   r'the meaningless groundings.',
    },
    {
        'q': 'Why does the fixed `PushThru(b,d,r1,r2)` of exam 30 Aug 2022 need the precondition `Box(b)`?',
        'options': [
            'It does not: preconditions are only for fluents',
            'Without it, b can be bound to the constant ROBOT: the robot "pushes itself"',
            'To make the action relevant in backward search',
            'Because STRIPS requires every parameter to be typed',
        ],
        'answer': 1,
        'explain': 'Parameters range over **all** constants. InRoom(ROBOT, r1) ∧ InRoom(b, r1) is true with '
                   'b = ROBOT, so `PushThru(ROBOT, D1, R1, R2)` would be applicable. Typing predicates (static, '
                   'time-independent) restrict what a parameter can be.',
    },
    {
        'q': 'A STRIPS formulation for 2 boxes on 2 tables uses `Move(x,y,z)` with P: Box(x) ∧ Table(y) ∧ '
             'Table(z) ∧ At(x,y). Is it a problem that nothing forbids $y = z$?',
        'options': [
            'Yes: Move(B1,T1,T1) makes the box disappear',
            'No harm: Move(B1,T1,T1) is applicable but leaves the state unchanged (delete first, then add); '
            'adding y ≠ z would just remove useless actions',
            'Yes: the problem becomes unsolvable',
            'Yes: STRIPS forbids equal arguments',
        ],
        'answer': 1,
        'explain': 'RESULT = (s − {At(B1,T1)}) ∪ {At(B1,T1)} = s. It is a useless self-loop, not an error; with ≠ '
                   'the planner has fewer ground actions to consider (8 → 4 in exam 16 Jan 2025).',
    },
]
