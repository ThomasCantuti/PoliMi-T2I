TITLE = 'Exam · Short questions on STRIPS/PDDL modeling (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'modeling', 'STRIPS', 'PDDL', 'fluents', 'typing']

STATEMENT = r"""
*Modeling questions from the Planning problems of 25 Jan 2022, 30 Aug 2022, 18 Jan 2023, 18 Jan 2024,
20 Jun 2024, 12 Jul 2024, 3 Feb 2025 and 6 Feb 2026.* The exam wants the formulation written out (constants,
predicates, init, goal, schemas with P and E) and every choice motivated. Each question below gives the official
answer as the **Model answer** and the traps found in it.
"""

QUESTIONS = [
    {
        'q': '25 Jan 2022 — making tea: water (hot or cold) in a bottle, a kettle or a cup; kettle, cup, bottle '
             'empty or not; a teabag in the cup or not. With the predicates water(x), bottle(x), kettle(x), cup(x), '
             'teabag(x), in(x,y), hot(x), empty(x), which are the **fluents**?',
        'options': [
            'in(x,y), hot(x), empty(x)',
            'water(x), bottle(x), kettle(x), cup(x), teabag(x)',
            'in(x,y) only',
            'all of them, since everything is part of the state',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Constants: W, K, C, B, TB. Time-independent predicates: water(x), bottle(x), '
                   'kettle(x), cup(x), teabag(x). Time-dependent predicates (fluents): in(x,y), hot(x), empty(x)." '
                   'No redundant predicates: cold = ¬hot, not-empty = ¬empty (that is why the model is PDDL: '
                   'negative literals are needed). The typing predicates make the model general (more kettles, '
                   'cups, …).',
    },
    {
        'q': '25 Jan 2022 — goal "a cup full of hot water with a teabag in it". Which goal is right?',
        'options': [
            'in(W, C), in(TB, C)',
            'cup(y), teabag(x), water(z), in(z,y), in(x,y), hot(z)',
            'cup(C) ∧ ¬empty(C) ∧ hot(C)',
            'hot(W) ∧ in(TB, C)',
        ],
        'answer': 1,
        'explain': '**Model answer:** "cup(y), teabag(x), water(z), in(z,y), in(x,y), hot(z)" — variables in the goal '
                   'are existential (some cup, some teabag, some water), which keeps it general. Hot is a property '
                   'of the water, not of the cup.',
    },
    {
        'q': '25 Jan 2022 — the official schemas are `Pour(x,from,to)  P: water(x) ∧ in(x,from) ∧ ¬in(x,to) ∧ empty(to)  '
             'E: ¬in(x,from) ∧ in(x,to) ∧ ¬empty(to) ∧ empty(from)` and `BoilWaterInKettle(w,k)  P: water(x) ∧ kettle(k) '
             '∧ ¬hot(w) ∧ in(w,k)  E: hot(w)`. Which remarks are correct? (select all)',
        'options': [
            '`water(x)` in BoilWaterInKettle is a typo for `water(w)`: x is not a parameter',
            'Pour and Boil use negative preconditions, so this is PDDL, not STRIPS',
            '`¬in(x,to)` in Pour is implied by `empty(to)`, but writing it is harmless',
            'Pour must also require `hot(x)`',
        ],
        'answer': [0, 1, 2],
        'explain': '**Model answer:** "BoilWaterInKettle(w,k)  P: water(w) ∧ kettle(k) ∧ ¬hot(w) ∧ in(w,k)  E: hot(w)" '
                   '(the official text writes water(x), a typo). A variable that is not a parameter would be read as "some x is water": always true, so the type '
                   'check on w is lost. Negative preconditions (¬hot, ¬in) require PDDL. Pouring works for cold water '
                   'too. AddTeaBag(t,c) `P: teabag(t) ∧ cup(c) ∧ ¬in(t,c)  E: in(t,c)` — the official note asks '
                   '"can you do better and ensure that t has not been already used?": ¬in(t,c) only checks *this* '
                   'cup; one option is a fluent such as unused(t), deleted by AddTeaBag.',
    },
    {
        'q': '30 Aug 2022 — `GoThru(d,r1,r2)` and `PushThru(b,d,r1,r2)` with initial state InRoom(ROBOT,R1), '
             'InRoom(BOX1,R2), Connects(D1,R1,R2), Connects(D2,R2,R3), Box(BOX1); goal Box(x), InRoom(x,R1). The '
             'representation is inadequate: what must change? (select all)',
        'options': [
            'Add Connects(D1,R2,R1) and Connects(D2,R3,R2): Connects is not symmetric, so the box can never come back to R1',
            'Add Box(b) to the preconditions of PushThru: otherwise b can be the ROBOT itself',
            'Remove ¬InRoom(ROBOT,r1) from GoThru',
            'Add Clear(r2) to the preconditions of both schemas',
        ],
        'answer': [0, 1],
        'explain': '**Model answer:** "Predicate Connects(D1,R1,R2) is not symmetric and the robot cannot move or push '
                   'the box from R2 to R1: add Connects(D1,R2,R1), Connects(D2,R3,R2) to the initial state. In '
                   'PushThru(b,d,r1,r2) the variable b could be linked to the constant ROBOT, which is wrong: add '
                   'Box(b) to its preconditions." Without the fix, forward search finds no plan at all.',
    },
    {
        'q': '18 Jan 2023 — robotic arm, two boxes, two books, two tables; the hand can pick up / put down objects and '
             'move between tables. Which `Move` schema is right (≠ allowed)?',
        'options': [
            'Move(t1,t2)  P: HandAt(t1), Table(t1), Table(t2), t1≠t2   E: ¬HandAt(t1), HandAt(t2)',
            'Move(t1,t2)  P: HandAt(t1), HandEmpty   E: HandAt(t2)',
            'Move(o,t1,t2)  P: On(o,t1)   E: ¬On(o,t1), On(o,t2)',
            'Move(t1,t2)  P: Table(t1), Table(t2)   E: HandAt(t2)',
        ],
        'answer': 0,
        'explain': '**Model answer:** "PickUp(o,t)  P: HandAt(t), On(o,t), HandEmpty  E: ¬On(o,t), ¬HandEmpty, '
                   'Holding(o); PutDown(o,t)  P: Holding(o), HandAt(t)  E: ¬Holding(o), HandEmpty, On(o,t); '
                   'Move(t1,t2)  P: HandAt(t1), Table(t1), Table(t2), t1≠t2  E: ¬HandAt(t1), HandAt(t2)"; goal '
                   'Box(x), On(x,T2). Option 2 forbids carrying and forgets ¬HandAt(t1) (the hand would be at both '
                   'tables); option 3 teleports objects without the hand.',
    },
    {
        'q': '18 Jan 2023 — modeling the same setting in **PDDL** instead of STRIPS, do you expect more or fewer '
             'constants, predicates, action schemas?',
        'options': [
            'Same constants and schemas, fewer (or equal) predicates: negative preconditions make some predicates '
            'redundant (HandEmpty can be expressed through Holding)',
            'More predicates, because PDDL needs typing',
            'Fewer action schemas, because PDDL has conditional effects',
            'Exactly the same model',
        ],
        'answer': 0,
        'explain': '**Model answer:** "the same constants (objects of the world) and the same action schemas (actions '
                   'available to the agent), but fewer predicates (using negations in preconditions we can for example '
                   'substitute HandEmpty with ¬Holding(z))". **Trap:** `¬Holding(z)` with z free (or a parameter) means '
                   '"some z is not held", not "nothing is held"; write ¬Holding(o) for every object, or keep HandEmpty.',
    },
    {
        'q': '18 Jan 2024 — baskets: `PickUp(b,k)  P: Ball(b), Basket(k), At(k), In(b,k), Handfree  E: ¬Handfree, '
             'Holding(b)`; `Drop(b,k)  … E: ¬Holding(b), Handfree, In(b,k)`; `Move(k1,k2)  P: Basket(k1), Basket(k2), '
             'At(k1), Handfree  E: ¬At(k1), At(k2)`. What is wrong? (select all)',
        'options': [
            'PickUp must also delete In(b,k): otherwise the ball is both held and in the basket',
            'Move must not require Handfree: otherwise the robot can never carry a ball to the other basket',
            'Drop must require Handfree',
            'Move must delete Handfree',
        ],
        'answer': [0, 1],
        'explain': '**Model answer:** add ¬In(b,k) to the effects of PickUp ("otherwise a ball will be both held by '
                   'the robot and in a basket") and remove Handfree from the preconditions of Move ("otherwise the robot '
                   'cannot move a ball from one basket to another basket"). With the original schemas no plan exists. '
                   '(The goal "In(Ba1,Bu2)" in the text is a typo for Bk2.)',
    },
    {
        'q': '18 Jan 2024 — "write a PDDL formulation without Handfree, adding no predicate". The official answer is '
             '`PickUp(b,k,x)  P: Ball(b), Basket(k), At(k), In(b,k), ¬Holding(x)  E: ¬In(b,k), Holding(b)`. Is it right?',
        'options': [
            'Yes: ¬Holding(x) says the hand is empty',
            'No: x is a parameter, so the planner can pick x = a ball it is not holding; holding Ba1, '
            'PickUp(Ba2,Bk1,Ba2) is applicable and the robot holds two balls. Use ¬Holding(Ba1) ∧ ¬Holding(Ba2)',
            'No: PDDL does not allow negative preconditions',
            'Yes, but only with typing',
        ],
        'answer': 1,
        'explain': '**Model answer:** "No: with x as a parameter the precondition only says that some x is not held. '
                   'Write PickUp(b,k) with P: Ball(b), Basket(k), At(k), In(b,k), ¬Holding(Ba1), ¬Holding(Ba2)." '
                   'A parameter in a negative literal is chosen by the planner: the precondition becomes "**some** x is '
                   'not held". Checked by search: from the initial state, PickUp(Ba1,Bk1,Ba1) then PickUp(Ba2,Bk1,Ba2) '
                   'reaches Holding(Ba1) ∧ Holding(Ba2). With the constants listed (`¬Holding(Ba1), ¬Holding(Ba2)` in '
                   'PickUp(b,k)) the model is correct for this instance; in general a universally quantified '
                   'precondition (a PDDL extension) is needed. Initial state and goal: as before without Handfree.',
    },
    {
        'q': '20 Jun 2024 — Tower of Hanoi with clear/on/smaller and one schema `Move(x,y,z)  P: on(x,y), clear(x), '
             'clear(z), smaller(x,z)  E: ¬on(x,y), clear(y), on(x,z), ¬clear(z)`. Why does the initial state contain '
             'on(d1, peg1) and smaller(d, peg) for every disc and peg?',
        'options': [
            'So that pegs behave like "very large discs": a disc can be moved onto an empty peg (clear(peg), '
            'smaller(d,peg)) and off the bottom of a peg (on(d1,peg1)) with the same single schema',
            'They are not needed',
            'To make the pegs fluents',
            'To forbid moving the largest disc',
        ],
        'answer': 0,
        'explain': '**Model answer:** the initial state lists smaller(d4,d3), …, smaller(d2,d1) (sizes), smaller(d,peg) '
                   'for every disc and peg ("a disc can go as the first disc on any peg"), on(d4,d3), on(d3,d2), '
                   'on(d2,d1), on(d1,peg1), clear(d4), clear(peg2), clear(peg3); goal on(d1,peg3), on(d2,d1), '
                   'on(d3,d2), on(d4,d3). Without on(d1,peg1), d1 could never be moved (Move needs on(x,y)).',
    },
    {
        'q': '12 Jul 2024 — `paint(o,o′,o″)  P: at(B,o), at(B,o′), at(B,o″), ¬painted(o), ¬painted(o′), ¬painted(o″)  '
             'E: painted(o), painted(o′), painted(o″)`. Why not impose o ≠ o′ ≠ o″?',
        'options': [
            'Because "paints up to 3 objects": with repeated arguments, paint(O1,O1,O1) or paint(O1,O2,O2) paints 1 or 2 '
            'objects; with distinctness one could not paint fewer than 3',
            'Because ≠ is not allowed in PDDL',
            'Because the objects are always distinct anyway',
            'It is a mistake: distinctness is required',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Allowing equal arguments lets the same schema paint 1, 2 or 3 objects (\'up to '
                   '3\'); with o ≠ o′ ≠ o″ every paint action would paint exactly 3 objects (impossible, e.g., with 4 or 5 objects, or '
                   'when only 1 or 2 are left unpainted)." The official '
                   'answer leaves this as a question in brackets. The '
                   'other schemas: `move-object(ℓ,ℓ′,o)  P: location(ℓ), location(ℓ′), at(ℓ,o), at(ℓ,Robot), ℓ≠ℓ′  '
                   'E: ¬at(ℓ,o), ¬at(ℓ,Robot), at(ℓ′,o), at(ℓ′,Robot)`; `move(ℓ,ℓ′)` for the robot alone. Init: '
                   'location(A), location(B), at(A,Oi) for all i, at(A,Robot); goal: at(A,Oi) ∧ painted(Oi) for all i.',
    },
    {
        'q': '3 Feb 2025 — objects to check and assemble: at B objects can be assembled or disassembled, at C '
             '**disassembled** objects can be checked. Which `Check(x)` is right?',
        'options': [
            'Check(x)  P: At(x,C) ∧ ¬Assembled(x) ∧ ¬Checked(x)   E: Checked(x)',
            'Check(x)  P: At(x,C)   E: Checked(x) ∧ ¬Assembled(x)',
            'Check(x)  P: At(x,B) ∧ Assembled(x)   E: Checked(x)',
            'Check(x)  P: Location(C)   E: Checked(x)',
        ],
        'answer': 0,
        'explain': '**Model answer:** Move(x,y,z) P: At(x,y) ∧ Location(y) ∧ Location(z) ∧ y≠z, E: At(x,z) ∧ ¬At(x,y); '
                   'Assemble(x) P: At(x,B) ∧ ¬Assembled(x), E: Assembled(x); Disassemble(x) P: At(x,B) ∧ Assembled(x), '
                   'E: ¬Assembled(x); Check(x) as option 1. Init: At(Oi,A), Assembled(Oi), Location(A/B/C); goal: '
                   'At(Oi,A) ∧ Assembled(Oi) ∧ Checked(Oi). A shortest plan has 21 actions.',
    },
    {
        'q': '6 Feb 2026 — Mars rover: Connected(L1,L2), Connected(L2,L3), Connected(L2,L4), Connected(L3,L4), '
             'Connected(L4,L5) in the initial state; Move needs Connected(x,y). What is missing for reaching generic goals?',
        'options': [
            'The symmetric facts Connected(L2,L1), Connected(L3,L2), Connected(L4,L2), Connected(L4,L3), Connected(L5,L4)',
            'A Recharge fact for every location',
            'Fuel(0) … Fuel(4)',
            'Nothing: At(L5) is reachable',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Connected() must be symmetric: add Connected(L2,L1), Connected(L3,L2), '
                   'Connected(L4,L2), Connected(L4,L3), Connected(L5,L4)." At(L5) is reachable even without them, but '
                   'e.g. At(L1) ∧ Fuel(1) is not (the rover can never come back); with them it is. In STRIPS, without ≥ '
                   'and −, Move becomes one schema per fuel level: Move-Fuel2 … Move-Fuel5 (problem x20).',
    },
    {
        'q': '6 Feb 2026 (short question) — search problems can be defined without any assumption on the state. Why '
             'did we introduce factored (CSP) and logic-based (planning) representations?',
        'options': [
            'Specialized representations restrict the application domain but let algorithms exploit domain knowledge '
            '(constraint checks and backtracking in CSPs; relevance, regression, SATPlan in planning)',
            'Because generic search cannot solve CSPs or planning problems',
            'Only to make the problems shorter to write',
            'Because they are always faster on every problem',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Specialized representations restrict the application domain but allow to exploit '
                   'the knowledge of the domain and design better algorithms." In planning: domain-independent '
                   'successor functions, backward search through relevant actions, domain-independent heuristics, '
                   'translation to SAT.',
    },
]
