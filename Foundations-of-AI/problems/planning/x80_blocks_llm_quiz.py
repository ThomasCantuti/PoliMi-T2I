TITLE = 'Exam · Blocks world variants and checking LLM models (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'blocks world', 'STRIPS', 'LLM', 'modeling', 'plan correctness']

STATEMENT = r"""
*Planning problems of 17 Feb 2022, 10 Jul 2023, 11 Jun 2025 and 8 Jul 2026.* The course blocks world:

```text
Unstack(x,y)  P: Handempty ∧ Block(x) ∧ Block(y) ∧ Clear(x) ∧ On(x,y)
              E: ¬Handempty ∧ ¬Clear(x) ∧ ¬On(x,y) ∧ Holding(x) ∧ Clear(y)
Stack(x,y)    P: Holding(x) ∧ Block(x) ∧ Block(y) ∧ Clear(y)
              E: ¬Holding(x) ∧ ¬Clear(y) ∧ On(x,y) ∧ Clear(x) ∧ Handempty
Pickup(x)     P: Handempty ∧ Block(x) ∧ Clear(x) ∧ On(x,TABLE)
              E: ¬Handempty ∧ ¬Clear(x) ∧ ¬On(x,TABLE) ∧ Holding(x)
Putdown(x)    P: Holding(x) ∧ Block(x)
              E: ¬Holding(x) ∧ On(x,TABLE) ∧ Clear(x) ∧ Handempty
```

Initial state (17 Feb 2022): Block(A), Block(B), Block(C), On(A,TABLE), On(B,TABLE), On(C,A), Clear(B),
Clear(C), Handempty; goal On(A,B) ∧ On(B,C).
"""

QUESTIONS = [
    {
        'q': '17 Feb 2022, Q1 — "each block can touch the table **at most one time** (the initial state counts one '
             'time)". How do you modify the STRIPS formulation? (no official solution is available for this exam)',
        'options': [
            'Add a fluent CanTouchTable(x), true initially only for C; Putdown(x) requires CanTouchTable(x) and deletes it',
            'Add the precondition ¬Touched(x) to Putdown(x)',
            'Delete the Putdown schema',
            'Add ¬On(x,TABLE) to the effects of Stack',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Add a predicate CanTouchTable(x) (x has not touched the table yet). Initial '
                   'state: add CanTouchTable(C) only, since A and B are on the table and have used their one time. '
                   'Putdown(x): add CanTouchTable(x) to P and ¬CanTouchTable(x) to E." A positive predicate is needed '
                   'because STRIPS has no negative preconditions (¬Touched(x) would be PDDL). Without Putdown the '
                   'problem becomes unsolvable: C must go to the table. The plan Unstack(C,A), Putdown(C), Pickup(B), '
                   'Stack(B,C), Pickup(A), Stack(A,B) still works.',
    },
    {
        'q': '17 Feb 2022, Q2 — forget Q1: "each block can be **moved at most one time**". How?',
        'options': [
            'Add a fluent CanMove(x), true initially for A, B, C; Unstack(x,y) and Pickup(x) require CanMove(x) and delete it',
            'Add CanMove(x) to Stack and Putdown only',
            'Limit the plan length to 3',
            'It cannot be expressed in STRIPS',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Add CanMove(A), CanMove(B), CanMove(C) to the initial state; add CanMove(x) to '
                   'the preconditions and ¬CanMove(x) to the effects of Unstack(x,y) and Pickup(x)" — a move starts '
                   'when the block is lifted, so once put down it cannot be lifted again. The same 6-action plan '
                   'moves each block exactly once. (The reprint of Stack in Q2 has a typo: "Clear(y)" appears in the '
                   'effects instead of Clear(x).)',
    },
    {
        'q': '17 Feb 2022, Q3 — a friend proposes one schema with Clear(TABLE) in the initial state: '
             '`Move(x,f,t)  P: Block(x) ∧ Clear(x) ∧ Clear(t) ∧ On(o,f)  E: ¬Clear(t) ∧ ¬On(o,f) ∧ On(o,t) ∧ Clear(f)`. '
             'Is the friend right? (select all true statements)',
        'options': [
            'The idea of a single "move" (hand abstracted away) is legitimate, but this schema is wrong',
            'o is not a parameter: it should be x (as written, the moved block is not tied to x)',
            'The table is treated like a block: moving a block onto it deletes Clear(TABLE), so a second block can '
            'no longer be put on the table',
            'Nothing forbids t = x (Move(B,TABLE,B) puts B on itself): x ≠ t, x ≠ f, f ≠ t are needed',
        ],
        'answer': [0, 1, 2, 3],
        'explain': '**Model answer:** "Not with this schema. Besides the typo o/x and the missing inequalities, the table '
                   'cannot be handled like a block: Clear(TABLE) is deleted the first time a block is put on it. AIMA '
                   'uses two schemas, Move(b,x,y) for blocks (with Block(y)) and MoveToTable(b,x)." Checked by search: '
                   'with o replaced by x, the Sussman instance is still solved (Move(C,A,TABLE), Move(B,TABLE,C), '
                   'Move(A,TABLE,B), because moving B off the table re-adds Clear(TABLE)), but unstacking a 3-block tower '
                   'onto the table is impossible.',
    },
    {
        'q': '10 Jul 2023, Q1 — `Swap(x,y,z)` reverses the top two blocks (x on y on z, x clear → y on x, x on z, '
             'y clear), hand empty. Minimal schema (P / D = delete list / A = add list)?',
        'options': [
            'P: Handempty, On(x,y), On(y,z), Clear(x)   D: On(x,y), On(y,z), Clear(x)   A: On(y,x), On(x,z), Clear(y)',
            'P: Handempty, On(x,y), On(y,z)   D: On(x,y)   A: On(y,x)',
            'P: Holding(x), On(y,z)   D: Holding(x)   A: On(x,z), Handempty',
            'P: Clear(x), Clear(y)   D: On(x,y), On(y,z)   A: On(y,x), On(x,z)',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Swap(x,y,z)  P: Handempty, On(x,y), On(y,z), Clear(x)  D: On(x,y), On(y,z), '
                   'Clear(x)  A: On(y,x), On(x,z), Clear(y)" (official). Block(x), Block(y) are not needed: On(x,y), On(y,z) already '
                   'say what x and y are. Option 2 leaves y on z and on x at the same time; option 4 requires y clear, '
                   'which is false when x is on y.',
    },
    {
        'q': '10 Jul 2023, Q2/Q3 — `Clone(x)` creates a copy CopyOf(x) of the held block on the table; `Destroy(x)` '
             'removes the held block from the world. Which pair is right?',
        'options': [
            'Clone: P Holding(x), D —, A On(CopyOf(x),Table), Block(CopyOf(x)), Clear(CopyOf(x));  '
            'Destroy: P Holding(x), D Holding(x), Block(x), A Handempty',
            'Clone: P Holding(x), D Holding(x), A On(x,Table);  Destroy: P Holding(x), D Block(x), A —',
            'Clone: P Handempty, A Block(CopyOf(x));  Destroy: P Clear(x), D On(x,y)',
            'Clone and Destroy cannot be written in STRIPS',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Clone(x)  P: Holding(x)  D: —  A: On(CopyOf(x),Table), Block(CopyOf(x)), '
                   'Clear(CopyOf(x)); Destroy(x)  P: Holding(x)  D: Holding(x), Block(x)  A: Handempty" (official). '
                   'Clone keeps the original in the hand (no deletes). Destroy '
                   'must free the hand and remove Block(x), otherwise the "destroyed" block could still be referred to. '
                   'Note: CopyOf(x) is a **function term**; standard STRIPS/PDDL atoms are function-free, so this is '
                   'accepted only because the question imposes the naming.',
    },
    {
        'q': '11 Jun 2025, Q1 — an LLM wrote the cake STRIPS model (has-ingredients(flour/sugar/eggs/milk/baking-powder/'
             'butter); actions mix-dry-ingredients, mix-wet-ingredients, combine-ingredients, pour-batter, bake-cake; '
             'only has-ingredients, ingredients-mixed, batter-in-pan, cake-baked are declared). What is wrong? (select all)',
        'options': [
            'It contains elements not in the description (baking powder, butter)',
            'It uses predicates that are not declared (dry-ingredients-mixed, wet-ingredients-mixed): syntactically inconsistent',
            'The goal should list every predicate',
            'STRIPS actions must always have parameters',
        ],
        'answer': [0, 1],
        'explain': '**Model answer:** "The representation has some problems: it contains elements that are not mentioned '
                   'in the original description of the problem (baking powder and butter); syntactically, it does not '
                   'define some predicates that are used (dry-ingredients-mixed and wet-ingredients-mixed)." The goal '
                   'cake-baked is fine (partial description). With only the four ingredients of the description in the '
                   'initial state, the model would have **no plan**: mix-dry needs baking-powder, mix-wet needs butter.',
    },
    {
        'q': '11 Jun 2025, Q2 — with that model, how many alternative plans exist?',
        'options': [
            '2 optimal plans of 5 actions (mix-dry and mix-wet in either order, then combine, pour, bake), and infinitely '
            'many non-optimal ones',
            'Exactly 1',
            '5! = 120',
            '2, and no others',
        ],
        'answer': 0,
        'explain': '**Model answer:** "2 alternative optimal plans (5 actions): mix-dry, mix-wet, combine, pour, bake and '
                   'mix-wet, mix-dry, combine, pour, bake; the order of most actions is fixed by their preconditions and '
                   'effects. There are infinitely many non-optimal plans, since mix-dry-ingredients and '
                   'mix-wet-ingredients can be repeated indefinitely." Enumeration: 0 plans of length ≤ 4, 2 of length 5, '
                   '18 of length 6.',
    },
    {
        'q': '11 Jun 2025, Q3/Q4 — the LLM calls them "Actions": should they be "Action Schemas"? And how many fluents '
             'does SATPlan need?',
        'options': [
            'They are actions (no parameters, already ground); 5 fluents: dry-ingredients-mixed, wet-ingredients-mixed, '
            'ingredients-mixed, batter-in-pan, cake-baked',
            'They are schemas; 11 fluents (all atoms)',
            'They are schemas; 6 fluents (the has-ingredients atoms)',
            'They are actions; 4 fluents (the declared predicates)',
        ],
        'answer': 0,
        'explain': '**Model answer:** "In principle STRIPS formulations have action schemas, but here the actions have no '
                   'parameters, so they are actually actions." Fluents = atoms that some action changes: the 5 listed; '
                   'has-ingredients(…) is never added or deleted (static).',
    },
    {
        'q': '8 Jul 2026, Q1 — the official STRIPS formalization of the LLM prompt has constants A, B, C, Table and '
             '`Putdown(x)  P: Holding(x)  E: On(x,Table), HandEmpty, ¬Holding(x)`, `UnStack(x,y)  P: On(x,y), Clear(x), '
             'HandEmpty  E: Holding(x), Clear(y), ¬On(x,y), ¬Clear(x), ¬HandEmpty`. What would you fix? (select all)',
        'options': [
            'Putdown must add Clear(x): PickUp deleted it, and without it the block can never be picked up again',
            'UnStack must require y to be a block (e.g. Block(y)): otherwise UnStack(B,Table) is applicable initially',
            'PickUp must not delete Clear(x)',
            'The goal must contain HandEmpty',
        ],
        'answer': [0, 1],
        'explain': '**Model answer:** "Putdown(x) must also add Clear(x), and UnStack(x,y) must require y to be a block '
                   '(add Block(A), Block(B), Block(C) and Block(y)), otherwise UnStack(B,Table) is applicable." '
                   'No official solution flags this. The official tree shows Clear(B) after PickUp(B), PutDown(B) and only two children of the root '
                   '(PickUp(B), UnStack(C,A)), as if these fixes were there; with the schemas literally as written the '
                   'root has a third child UnStack(B,Table) and the PutDown(B) child lacks Clear(B). The solution '
                   'PickUp(B), Stack(B,C) is the same in all versions (problem x10).',
    },
    {
        'q': '8 Jul 2026, Q3 — LLM answers: A1 = Pick up B, Stack B on C. A2 = Unstack C from A, Put C on the table, '
             'Pick up B, Stack B on C. Correctness and optimality (unit costs)?',
        'options': [
            'A1 correct and optimal; A2 not correct (executable, but C ends on the table, violating On(C,A)), so '
            'optimality is pointless',
            'Both correct; A1 optimal',
            'A1 not executable: B must be unstacked',
            'Both incorrect',
        ],
        'answer': 0,
        'explain': '**Model answer:** "A1 is identical to the answer of the STRIPS planner, and thus it is correct. It is '
                   'also optimal because breadth-first search returns the shortest solution. A2 is not correct because '
                   'it does not achieve the subgoal On(C,A). That said, asking if it is optimal is pointless." Check a '
                   'plan by simulating it: every action applicable in turn, goal ⊆ final state.',
    },
]
