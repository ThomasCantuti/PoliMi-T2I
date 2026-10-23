TITLE = 'SATPlan: how the encoding works'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['SATPlan', 'propositional logic', 'fluent axiom', 'frame problem', 'action exclusion']

STATEMENT = r"""
Planning as satisfiability (AIMA §7.7.4, §11.2): reification of fluents and actions, the five groups of
sentences, and the loop over the plan length $L$.
"""

QUESTIONS = [
    {
        'q': r'With $|F|$ ground fluents, $|A|$ reified ground actions and plan length $L$, how many propositional '
             r'symbols does the SATPlan encoding use?',
        'options': [
            r'$|F| \cdot L + |A| \cdot L$',
            r'$|F| \cdot (L + 1) + |A| \cdot L$',
            r'$(|F| + |A|) \cdot (L + 1)$',
            r'$|F| + |A|$',
        ],
        'answer': 1,
        'explain': r'Fluents are needed at every time step $0, \dots, L$ (states $s_0 \dots s_L$), actions only at '
                   r'$0, \dots, L - 1$ (the action at time $t$ leads from $s_t$ to $s_{t+1}$). Two rooms, $L = 1$: '
                   r'$AtR1^0, AtR2^0, AtR1^1, AtR2^1, MoveR^0, MoveL^0$.',
    },
    {
        'q': 'Why does the initial-state part list **negative** literals (e.g. $\\lnot AtR2^0$)?',
        'options': [
            'Because PDDL states contain negative literals',
            'SAT has no closed-world assumption: without $\\lnot AtR2^0$ the solver could choose $AtR2^0$ = true '
            'and "start" in the goal',
            'To make the formula shorter',
            'They are optional',
        ],
        'answer': 1,
        'explain': 'A planning state is closed-world (unlisted = false), a propositional symbol is free unless a '
                   'sentence constrains it. The official solution of 16 Jan 2025 notes it: "the closed world '
                   'assumption does not hold in this case".',
    },
    {
        'q': r'Which is the fluent (successor-state) axiom for $AtR1$ in the two-rooms problem (MoveR: '
             r'R1 → R2, MoveL: R2 → R1)?',
        'options': [
            r'$AtR1^1 \Rightarrow MoveL^0$',
            r'$AtR1^1 \Leftrightarrow MoveL^0 \lor (AtR1^0 \land \lnot MoveR^0)$',
            r'$MoveL^0 \Rightarrow AtR1^1$',
            r'$AtR1^1 \Leftrightarrow MoveL^0 \land \lnot MoveR^0$',
        ],
        'answer': 1,
        'explain': r'$F^{t+1} \Leftrightarrow \textit{ActionCausesF}^t \lor (F^t \land \lnot '
                   r'\textit{ActionCausesNotF}^t)$: true next iff an action makes it true, or it was true and no '
                   r'action made it false. The biconditional also says that nothing else changes it (frame '
                   r'problem). Option 3 is only the effect half.',
    },
    {
        'q': 'Why is the precondition axiom an implication $A^t \\Rightarrow PRE(A)^t$ and not a biconditional?',
        'options': [
            'Because the preconditions being true must not force the action to be executed',
            'Because SAT solvers do not accept biconditionals',
            'It is a biconditional in AIMA',
            'Because actions have no effects at time $t$',
        ],
        'answer': 0,
        'explain': 'Many actions are applicable at the same time, but at most one is executed. '
                   '$PRE(A)^t \\Rightarrow A^t$ would force every applicable action and, with the exclusion '
                   'axioms, make the formula unsatisfiable.',
    },
    {
        'q': 'With $n$ reified actions, how many action exclusion axioms per time step, and why not a single one?',
        'options': [
            '$n$; one per action',
            '$n(n-1)/2$; one clause $\\lnot A_1^t \\lor \\dots \\lor \\lnot A_n^t$ would only forbid executing all $n$ together',
            '$n^2$; ordered pairs',
            '1; it is equivalent',
        ],
        'answer': 1,
        'explain': 'The big clause is false only when **all** $n$ symbols are true, so it allows up to $n - 1$ '
                   'simultaneous actions (exam 3 Feb 2025). One clause per unordered pair = "at most one action '
                   'per step".',
    },
    {
        'q': 'How are **static** predicates such as Connected(x,y) or Box(x) handled in the course\'s SATPlan '
             'encodings? (select all that are correct)',
        'options': [
            'They are not fluents: no time-indexed symbols and no fluent axioms are needed for them',
            'Ground actions whose static preconditions are false are simply not reified (no MoveStorageShipping)',
            'They need one fluent axiom per time step like every other atom',
            'Keeping them as symbols ($Bo1^t$) in the precondition axioms is also acceptable, just longer',
        ],
        'answer': [0, 1, 3],
        'explain': 'Exam 11 Jun 2026: "connected(Corridor, Storage) is not a fluent and it is accounted for by not '
                   'reifying impossible actions". Exam 16 Jan 2025 keeps $Bo1$, $Ta1$ as symbols in the precondition '
                   'axioms instead; both are correct.',
    },
    {
        'q': 'SATPlan tries $L = 0, 1, 2, \\dots$ and stops at the first satisfiable encoding. If the shortest '
             'plan has 2 actions, is the encoding for $L = 3$ satisfiable?',
        'options': [
            'No: the goal must be reached exactly at the last step with one action per step',
            'Yes: the axioms allow time steps with no action, so the 2-action plan plus an idle step is a model',
            'Only if some action can be repeated',
            'It depends on the SAT solver',
        ],
        'answer': 1,
        'explain': 'Exclusion axioms say "at most one", nothing says "at least one". This is why the loop starts '
                   'from 0: the first satisfiable $L$ is the length of a shortest plan, and its model has exactly '
                   'one action per step.',
    },
    {
        'q': 'What does a model of the SATPlan sentence for length $L$ represent?',
        'options': [
            'Only the final state',
            'A sequence of states $s_0, \\dots, s_L$ and the actions executed between them: the plan is read '
            'from the action symbols that are true, in time order',
            'The set of all plans of length $L$',
            'A proof that no plan exists',
        ],
        'answer': 1,
        'explain': 'EXTRACT-SOLUTION collects the true $A^t$. If the sentence is unsatisfiable, no plan of length '
                   '$\\le L$ exists and SATPlan increases $L$.',
    },
    {
        'q': '$L = 0$ for a problem whose goal is not true initially. What does DPLL find?',
        'options': [
            'A model with no actions',
            'Unsatisfiable, by unit propagation: the init literal $\\lnot G^0$ and the goal literal $G^0$ clash',
            'It cannot run: there are no actions',
            'Satisfiable, because there are no axioms',
        ],
        'answer': 1,
        'explain': 'With $L = 0$ the sentence is just init ∧ goal (exam 16 Jan 2025). Both $\\lnot AtB1T2^0$ and '
                   '$AtB1T2^0$ are unit clauses: contradiction, so no plan with zero actions exists.',
    },
]
