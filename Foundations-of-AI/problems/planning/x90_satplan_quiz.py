TITLE = 'Exam · Short questions on SATPlan (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'SATPlan', 'fluents', 'action exclusion', 'DPLL', 'reification']

STATEMENT = r"""
*SATPlan questions from the Planning problems of 14 Jun 2022, 9 Feb 2023, 8 Sep 2023, 18 Jan 2024, 20 Jun 2024,
16 Jan 2025, 3 Feb 2025, 11 Jun 2025, 14 Jan 2026, 11 Jun 2026 and 31 Aug 2026.* The full encodings are written
in problem x50; here are the counting and "why" questions.
"""

QUESTIONS = [
    {
        'q': '14 Jun 2022 — robot, rooms R1, R2, predicate At(x), actions MoveR, MoveL. "List all the ground literals '
             'that could be potentially used in the representation of a state" (for SATPlan).',
        'options': [
            'AtR1^t, AtR2^t and their negations',
            'At(R1) only',
            'MoveR^t, MoveL^t',
            'At(x)^t',
        ],
        'answer': 0,
        'explain': '**Model answer:** "AtR1^t, AtR2^t and their negations." These are the fluents that SATPlan reifies at '
                   'every time step; the actions are separate symbols MoveR^t, MoveL^t.',
    },
    {
        'q': '8 Sep 2023 — robot R1, locations L1, L2, init At(R1,L1), goal At(R1,L2), Move(r,l,l′). What is the '
             'shortest L for which SATPlan finds a solution?',
        'options': ['1', '0', '2', 'It depends on the SAT solver'],
        'answer': 0,
        'explain': '**Model answer:** "Trivially, L = 1, since there is an obvious plan composed of one action that achieves '
                   'the goal: Move(R1, L1, L2)." With L = 0 the sentence is init ∧ goal and $\\lnot AtR1L2^0$ contradicts '
                   '$AtR1L2^0$.',
    },
    {
        'q': '16 Jan 2025 — two boxes, two tables, goal At(B1,T2), At(B2,T2). SATPlan for **L = 0**, solved with DPLL: what '
             'do you obtain, and what does it mean?',
        'options': [
            'Unsatisfiable (e.g. ¬AtB1T2^0 from init and AtB1T2^0 from the goal): no plan with zero actions exists',
            'Satisfiable: the empty plan',
            'DPLL cannot be applied without actions',
            'Unsatisfiable: the problem has no solution at all',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Applying DPLL to Bo1^0, Bo2^0, Ta1^0, Ta2^0, AtB1T1^0, AtB2T1^0, ¬AtB1T2^0, '
                   '¬AtB2T2^0, AtB1T2^0, AtB2T2^0 trivially leads to an inconsistency (¬AtB1T2^0 and AtB1T2^0 cannot be '
                   'simultaneously satisfied). This means that there are no solutions composed of no actions." The init '
                   'must contain the negative literals: "the closed world assumption does not hold in this case". (The '
                   'official text writes ¬AtB1T2^0 and AtB1T2^0 twice — typos for the B2 literals.) Unsatisfiable at '
                   'L = 0 says nothing about larger L: here L = 2 works.',
    },
    {
        'q': '16 Jan 2025 — same problem (`Move(x,y,z)  P: Box(x) ∧ Table(y) ∧ Table(z) ∧ At(x,y)  E: At(x,z) ∧ ¬At(x,y)`), '
             'L = 1. How many precondition, fluent and action exclusion axioms?',
        'options': ['8, 4, 28', '64, 16, 2016', '8, 8, 8', '2, 4, 1'],
        'answer': 0,
        'explain': '**Model answer:** "8 precondition axioms, one for each reified action: moveB1T1T1^t, moveB1T1T2^t, '
                   'moveB1T2T1^t, moveB1T2T2^t, moveB2T1T1^t, …; example moveB1T1T1^t ⇒ Bo1^t ∧ Ta1^t ∧ Ta1^t ∧ AtB1T1^t. '
                   '4 fluent axioms, one for each fluent AtB1T1, AtB1T2, AtB2T1, AtB2T2; example AtB1T1^1 ⇔ (moveB1T1T1^0 '
                   '∨ moveB1T2T1^0) ∨ (AtB1T1^0 ∧ ¬(moveB1T1T1^0 ∨ moveB1T1T2^0)). 28 action exclusion axioms, one for each '
                   'pair of reified actions (C(8,2)); example ¬moveB1T1T1^t ∨ ¬moveB1T1T2^t." Only type-correct actions '
                   'are reified (2 boxes × 2 × 2 tables).',
    },
    {
        'q': '3 Feb 2025 — with n actions, each time step needs n(n − 1)/2 exclusion axioms ¬(a_i^t ∧ a_j^t). Why not the '
             'single axiom ¬(action1^t ∧ action2^t ∧ … ∧ actionn^t)?',
        'options': [
            'The single axiom is false only when all n actions are true, so it is satisfied with up to n − 1 simultaneous '
            'actions; the pairwise axioms allow at most one action per step',
            'Because SAT solvers only accept binary clauses',
            'The single axiom would forbid every action',
            'They are equivalent; the pairwise form is just faster',
        ],
        'answer': 0,
        'explain': '**Model answer:** "You cannot use a single axiom ¬(action1^t ∧ … ∧ actionn^t) because it is satisfied '
                   'when up to n − 1 actions are executed simultaneously (it is true when up to n − 1 literals actioni^t '
                   'are true). This case is excluded by the usual formulation with n(n − 1)/2 axioms, in which at most '
                   'one action can be executed at each time step." (Hint of the exam: look at its truth table.)',
    },
    {
        'q': '9 Feb 2023 — Wumpus world (cells 11 … 44), Move(c1,c2). How many propositional symbols reify the Move '
             'actions (per time step)?',
        'options': [
            '256 in principle (16 × 16); fewer if preconditions are used when grounding: 240 with c1 ≠ c2, 48 with Adj',
            '16',
            '32',
            '4',
        ],
        'answer': 0,
        'explain': '**Model answer:** "In principle a symbol for each Move(c1,c2) obtained by instantiating c1 and c2 over '
                   'the constants representing the cells (ignoring the other constants): 16 × 16 = 256, e.g. Move1111^t, '
                   'Move1112^t, Move1113^t, … This number can be reduced if some preconditions are taken into account: '
                   'with c1 ≠ c2, Move1111^t is not generated; with Adj(c1,c2), Move1113^t and Move1114^t are not '
                   'generated." 24 adjacent pairs in a 4×4 grid × 2 directions = 48.',
    },
    {
        'q': 'Which predicates are **fluents** for SATPlan? (select all correct statements) — 18 Jan 2024 baskets, '
             '20 Jun 2024 Hanoi, 11 Jun 2025 cake, 11 Jun 2026 warehouse.',
        'options': [
            'Baskets: from In() the fluents InBa1Bk1, InBa1Bk2, InBa2Bk1, InBa2Bk2 (not meaningless ones like InBa1Ba1)',
            'Hanoi: on() and clear(), because actions change them; smaller() is static',
            'Cake: 5 fluents (dry-/wet-ingredients-mixed, ingredients-mixed, batter-in-pan, cake-baked)',
            'Warehouse: 8 fluents (at-robot × 3 rooms, at-package × 3 rooms, carrying(PKG), handempty), connected() is not one',
        ],
        'answer': [0, 1, 2, 3],
        'explain': '**Model answer:** "Assuming meaningless fluents are not generated: InBa1Bk1^t, InBa1Bk2^t, InBa2Bk1^t, '
                   'InBa2Bk2^t." / "The two predicates that can change due to actions are on() and clear(), thus they are '
                   'fluents." / "5 fluents, because the predicates that can change over time are …" / "at-robotStorage^t, '
                   'at-robotCorridor^t, at-robotShipping^t, at-packagePKGStorage^t, …, carryingPKG^t, handempty^t". The '
                   'test is always the same: does some action add or delete it?',
    },
    {
        'q': '11 Jun 2026 — write the precondition axiom of one reification of Move(from,to) (P: at-robot(from), '
             'connected(from,to)).',
        'options': [
            'MoveCorridorStorage^t ⇒ at-robotCorridor^t',
            'MoveCorridorStorage^t ⇔ at-robotCorridor^t ∧ connectedCorridorStorage^t',
            'at-robotCorridor^t ⇒ MoveCorridorStorage^t',
            'MoveCorridorStorage^t ⇒ at-robotStorage^(t+1)',
        ],
        'answer': 0,
        'explain': '**Model answer:** "moveCorridorStorage^t ⟹ at-robotCorridor^t. Note that connected(Corridor, Storage) is '
                   'not a fluent and it is accounted for by not reifying impossible actions like moveStorageShipping^t." '
                   'Option 4 is an effect, which belongs to the fluent axioms. The fluent axiom of the first fluent: '
                   'at-robotStorage^(t+1) ⟺ moveCorridorStorage^t ∨ (at-robotStorage^t ∧ ¬moveStorageCorridor^t).',
    },
    {
        'q': '14 Jan 2026 — which is the fluent axiom of Carry(Left,B1) (PickUp(x,y,z) adds Carry(z,x); Drop(x,y,z) '
             'deletes it; rooms RA, RB)?',
        'options': [
            'CarryLeftB1^(t+1) ⟺ (PickupB1RALeft^t ∨ PickupB1RBLeft^t) ∨ (CarryLeftB1^t ∧ ¬DropB1RALeft^t ∧ ¬DropB1RBLeft^t)',
            'CarryLeftB1^(t+1) ⟺ PickupB1RALeft^t ∧ ¬DropB1RALeft^t',
            'CarryLeftB1^(t+1) ⇒ PickupB1RALeft^t ∨ PickupB1RBLeft^t',
            'CarryLeftB1^t ⟺ PickupB1RALeft^t ∨ CarryLeftB1^(t+1)',
        ],
        'answer': 0,
        'explain': '**Model answer:** "CarryLeftB1^(t+1) ⟺ (PickupB1RALeft^t ∨ PickupB1RBLeft^t) ∨ (CarryLeftB1^t ∧ '
                   '¬DropB1RALeft^t ∧ ¬DropB1RBLeft^t)" (official), together with AtRobotRA^(t+1) ⟺ MoveRBRA^t ∨ (AtRobotRA^t ∧ '
                   '¬MoveRARB^t). Both rooms appear: the ball can be picked up or dropped in either room. Option 3 is '
                   'only one direction of the biconditional.',
    },
    {
        'q': '31 Aug 2026 — no constants, predicates A, B; init empty; goal A ∧ B; a1(): P —, E A; a2(): P A, E B. Is the '
             'set of SATPlan sentences for **L = 2** satisfiable?',
        'options': [
            'Yes: the plan a1, a2 has length 2, and SATPlan finds it (a1^0, a2^1 true)',
            'No: a2 needs A at the same step',
            'No: two actions cannot both be true',
            'Only for L = 3',
        ],
        'answer': 0,
        'explain': '**Model answer:** "The set of sentences is satisfiable because there is trivially a plan of length L = 2 '
                   'that solves the problem and the SAT planning approach will find it." In fact it has exactly one '
                   'model: a1^0 and a2^1 true, a2^0 and a1^1 false (checked by enumeration); with L = 1 it is '
                   'unsatisfiable. The sentences: ¬A^0, ¬B^0; A^2, B^2; a2^0 ⇒ A^0, a2^1 ⇒ A^1; A^1 ⟺ a1^0 ∨ A^0, '
                   'A^2 ⟺ a1^1 ∨ A^1, B^1 ⟺ a2^0 ∨ B^0, B^2 ⟺ a2^1 ∨ B^1; ¬a1^0 ∨ ¬a2^0, ¬a1^1 ∨ ¬a2^1.',
    },
]
