TITLE = 'Exam · Short questions on resolution, chaining and DPLL (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'inference algorithms', 'Aug 2026', 'Jul 2026', 'Jun 2026', 'Jan 2026', 'Feb 2025', 'Jul 2024', 'Jan 2023']

STATEMENT = r"""
*Short questions from the written exams of 17 Feb 2022, 14 Jul 2022, 18 Jan 2023, 14 Jun 2023, 8 Sep 2023,
6 Feb 2024, 12 Jul 2024, 3 Feb 2025, 8 Jul 2025, 14 Jan 2026, 11 Jun 2026, 8 Jul 2026 and 31 Aug 2026.*
Each explanation ends with the **model answer** to write ("adequately motivated").
"""

QUESTIONS = [
    {
        'q': '*(12 Jul 2024, Q5)* "Both forward chaining and backward chaining are sound inference algorithms for '
             'propositional logic, but only backward chaining is complete." True or false?',
        'options': ['True', 'False'],
        'answer': 1,
        'explain': '**Model answer:** False, both are sound and both are complete for KBs of definite clauses.',
    },
    {
        'q': '*(8 Jul 2025, Q1)* "Given a generic KB and a generic formula $\\alpha$, if $KB \\models \\alpha$ then '
             '$KB \\vdash_{FC} \\alpha$." True or false?',
        'options': ['True', 'False'],
        'answer': 1,
        'explain': '**Model answer:** False. FC is complete only for KBs of definite clauses (and it only derives '
                   'symbols, so $\\alpha$ must be a positive literal).',
    },
    {
        'q': '*(12 Jul 2024, Q7)* "Given two clauses, there could be more than one way to resolve them using the '
             'resolution rule." True or false?',
        'options': ['True', 'False'],
        'answer': 0,
        'explain': '**Model answer:** True. $A \\vee \\neg B \\vee C$ and $B \\vee \\neg C \\vee D$ can be resolved on $\\neg B/B$ or on '
                   '$C/\\neg C$. (One pair at a time: resolving on both at once would wrongly give $A \\vee D$.)',
    },
    {
        'q': '*(12 Jul 2024, Q8)* "Given a KB and a sentence that is not entailed by the KB, DPLL is guaranteed to '
             'terminate." True or false?',
        'options': ['True', 'False'],
        'answer': 0,
        'explain': '**Model answer:** True. Run on the KB and the negated sentence, DPLL builds a tree that, in the worst '
                   'case, generates all the (finitely many) assignments, and finds one that satisfies the KB and the '
                   'negated sentence. (Contrast: WalkSAT may stop without an answer.)',
    },
    {
        'q': '*(14 Jul 2022, Q3; 31 Aug 2026, Q2)* Are the unit resolution and the input resolution strategies complete?',
        'options': [
            'Not in general; both are complete for Horn clauses',
            'Yes, both are complete',
            'Unit resolution is complete, input resolution is not',
            'Neither is complete, even for Horn clauses',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Not complete in general. Unit: $P \\vee Q$, $P \\vee \\neg Q$, $\\neg P \\vee R$, $\\neg P \\vee \\neg R$ '
                   'is unsatisfiable but there is no unit clause, so no pair can be resolved. Input: from $A \\vee B$, '
                   '$A \\vee \\neg B$, $\\neg A \\vee B$, $\\neg A \\vee \\neg B$ it derives $A$ and $\\neg A$ but cannot resolve them, since '
                   'neither is an input clause. Both strategies are complete for Horn clauses."',
    },
    {
        'q': '*(18 Jan 2023, Q2)* BC found a proof of $B$ from a KB of definite clauses. Does $KB \\vdash_{BC} B$ hold? '
             'And $KB \\models B$?',
        'options': [
            'Both: a proof was found, and BC is sound',
            '$KB \\vdash_{BC} B$ only: BC is not sound',
            '$KB \\models B$ only',
            'Neither: BC only searches',
        ],
        'answer': 0,
        'explain': '**Model answer:** "$KB \\vdash_{BC} B$ holds because a proof has been found. $KB \\models B$ holds because '
                   '$KB \\vdash_{BC} B$ and BC is sound (for definite clauses, as in the KB)."',
    },
    {
        'q': '*(18 Jan 2023, Q3)* Could resolution with the **unit resolution strategy** establish $KB \\models B$ for the '
             'KB $A \\Rightarrow B$, $C \\Rightarrow A$, $G \\wedge E \\Rightarrow C$, $F \\Rightarrow D$, $D \\wedge E \\Rightarrow C$, $H \\Rightarrow E$, '
             '$H \\Rightarrow F$, $H$? (No need to apply it.)',
        'options': [
            'Yes, because unit resolution is complete for Horn clauses, as in the KB',
            'No, because unit resolution is incomplete',
            'Only if we use input resolution instead',
            'No, because $B$ is not a unit clause',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Yes: the KB (plus the negated query $\\neg B$) is made of Horn clauses, and the unit '
                   'resolution strategy is complete for Horn clauses."',
    },
    {
        'q': '*(14 Jun 2023, Q2)* KB: $Swimming \\Rightarrow Wet$, $Raining \\wedge Outside \\Rightarrow Wet$, '
             '$Warm \\wedge \\neg Raining \\Rightarrow Pleasant$, $\\neg Wet$, $Outside$, $Warm$. Is it composed of definite clauses?',
        'options': [
            'No: $\\neg Warm \\vee Raining \\vee Pleasant$ has two positive literals and $\\neg Wet$ has none',
            'Yes: every sentence is an implication or a literal',
            'Yes: it is in CNF',
            'No: it contains $\\wedge$',
        ],
        'answer': 0,
        'explain': '**Model answer:** "No, because there is a negated antecedent in an implication and a negative fact: '
                   'as clauses, $\\neg Warm \\vee Raining \\vee Pleasant$ has two positive literals and $\\neg Wet$ has zero, while a '
                   'definite clause has exactly one."',
    },
    {
        'q': '*(14 Jun 2023, Q4)* The proof 8. $\\neg Outside \\vee Wet$ (2, 7), 9. $\\neg Outside$ (4, 8), 10. ⊥ (5, 9), with '
             '7. $Raining$ the negated query. Could it have been obtained with the unit resolution strategy? With the input '
             'resolution strategy?',
        'options': ['Both', 'Only unit', 'Only input', 'Neither'],
        'answer': 0,
        'explain': '**Model answer:** "Yes, with both: every step uses at least one unit clause (7, 4, 5) — unit resolution — '
                   'and at least one clause of the KB or the negated query (2/7, 4, 5) — input resolution."',
    },
    {
        'q': '*(3 Feb 2025, Q2–Q4)* The KB is made of definite clauses and BC proved $A$. Which statements are correct? '
             '(select all)',
        'options': [
            'FC could have been used to obtain the same result',
            'BC can directly derive $A \\wedge D$',
            'FC can directly derive $A \\wedge D$',
            'Running BC twice, for $A$ and for $D$, and combining the results derives $A \\wedge D$',
        ],
        'answer': [0, 3],
        'explain': '**Model answer:** "Yes for FC: the KB is composed of definite clauses and both FC and BC are sound and '
                   'complete. No for $A \\wedge D$: BC and FC directly derive only positive literals like $A$ or $D$, not '
                   'complex formulas; a workaround is to derive $A$ and $D$ separately and then conclude $A \\wedge D$."',
    },
    {
        'q': '*(14 Jan 2026, Q3)* Could the entailment $\\dots \\models (\\neg Z \\Rightarrow \\neg Y)$ over the clauses '
             '$X \\vee Y \\vee Z$, $X \\vee Y \\vee \\neg Z$, … have been decided with forward chaining?',
        'options': [
            'No: the clauses are not definite (e.g. $X \\vee Y \\vee Z$) and FC derives only positive literals',
            'Yes: FC is complete',
            'Yes, after converting to CNF',
            'Only with backward chaining',
        ],
        'answer': 0,
        'explain': '**Model answer:** "No, because FC applies to definite clauses and the clauses involved are not definite '
                   '(e.g. $X \\vee Y \\vee Z$). Moreover, FC derives positive literals and $\\neg Z \\Rightarrow \\neg Y$ is not a positive '
                   'literal."',
    },
    {
        'q': '*(8 Sep 2023, Q1)* A variant of DPLL on $(a \\vee \\neg b) \\wedge (a \\vee c \\vee \\neg d) \\wedge (\\neg c \\vee \\neg e) '
             '\\wedge (\\neg c \\vee e) \\wedge (c \\vee d)$ produced this tree (edge = literal set true, ✗ = a clause is false):\n\n'
             '```text\n'
             '{}  -¬a->  {¬a}  -b->  {¬a,b} ✗\n'
             '                 -¬b-> {¬a,¬b}  -¬c-> {¬a,¬b,¬c}  -¬d-> ✗   -d-> ✗\n'
             '                                -c->  {¬a,¬b,c}   -¬e-> ✗   -e-> ✗\n'
             '    -a->   {a}   -¬c-> {a,¬c}   -¬d-> ✗\n'
             '                                -d->  {a,¬c,d}  -b-> {a,¬c,d,b}  -e-> {a,¬c,d,b,e}  (model)\n'
             '```\n\n'
             'Which differences from the classical DPLL can you deduce? (select all)',
        'options': [
            'It does not use the pure symbol heuristic: $a$ is pure at the root, yet $\\neg a$ is tried first',
            'It does not use the unit clause heuristic: at $\\{\\neg a\\}$ the clause $a \\vee \\neg b$ forces $\\neg b$, yet $b$ is tried first',
            'It applies early termination to failures but not to success: $\\{a, \\neg c, d\\}$ already satisfies every clause',
            'It never backtracks',
        ],
        'answer': [0, 1, 2],
        'explain': '**Model answer** (official): "The variant does not use the pure symbol heuristic nor the unit literal '
                   'heuristic: at the beginning the pure symbol $a$ should be selected instead of trying first $\\neg a$; at '
                   '$\\{\\neg a\\}$ the unit literal $\\neg b$ should be chosen instead of trying first $b$. Early termination is '
                   'applied to detect failure (the search stops after $\\{\\neg a, b\\}$) but not to detect success (after '
                   '$\\{a, \\neg c, d\\}$ the formula is satisfied and there is no need to assign the remaining literals)."',
    },
    {
        'q': '*(17 Feb 2022, Q2; 8 Jul 2026, Q4)* DPLL with all heuristics, without the unit clause heuristic, and without '
             'any heuristic, on a satisfiable KB. Same final answer? Which is cheapest?',
        'options': [
            'Same answer in all cases; with the heuristics the effort is smallest',
            'Different answers: without heuristics DPLL may miss the model',
            'Same answer; the effort is the same',
            'Same answer; without heuristics it is cheaper because there is less to check',
        ],
        'answer': 0,
        'explain': '**Model answer:** "The final answer is the same because DPLL systematically explores the space of '
                   'possible assignments in all cases; the heuristics just avoid exploring parts of this space that '
                   'will for sure not provide a solution. With the heuristics the effort is smaller: on 8 Jul 2026 unit '
                   'propagation reaches the model with no split at all, so the algorithm never has to backtrack and try '
                   'both values of a split."',
    },
    {
        'q': '*(6 Feb 2024, Q4)* A set of clauses is solved as a CSP (Boolean variables, one constraint per clause, '
             'backtracking with forward checking and MRV/degree) instead of with DPLL. Main differences?',
        'options': [
            'DPLL uses different heuristics to select variables and values (pure symbols, unit clauses) and implements early termination',
            'DPLL can find models that the CSP formulation cannot',
            'The CSP formulation cannot detect unsatisfiability',
            'There is no difference',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): "The DPLL algorithm uses different heuristics for selecting variables '
                   'and values to assign them and implements an early termination approach." Both are complete. In the '
                   'same exam (Q3, CSP part) AC-3 on the initial domains reduces nothing: for every two-literal clause, '
                   'each value of one variable has a consistent value for the other.',
    },
    {
        'q': '*(11 Jun 2026, Q1)* "If the robot must stop, then the delivery is delayed unless a backup robot is '
             'available": the official solution accepts $S \\Rightarrow (D \\vee B)$, $(S \\wedge \\neg B) \\Rightarrow D$ and '
             '$(S \\Rightarrow D) \\vee B$. Why are they equivalent?',
        'options': [
            'All three become the same clause $\\neg S \\vee D \\vee B$ after eliminating the implications',
            'They are not equivalent: only the first is correct',
            'They have the same symbols',
            'Because ∨ is commutative',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Eliminating ⇒: $\\neg S \\vee (D \\vee B)$; $\\neg(S \\wedge \\neg B) \\vee D = \\neg S \\vee B \\vee D$ '
                   '(De Morgan); $(\\neg S \\vee D) \\vee B$. Same clause, hence same models." "D unless B" = "if not B then '
                   'D" = $D \\vee B$.',
    },
]
