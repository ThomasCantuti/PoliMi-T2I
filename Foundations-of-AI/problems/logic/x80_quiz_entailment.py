TITLE = 'Exam · Short questions on entailment, validity, soundness and completeness (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'entailment', 'true/false', 'Jan 2026', 'Sep 2025', 'Jul 2025', 'Jan 2025', 'Jul 2024', 'Jan 2024']

STATEMENT = r"""
*Short questions from the written exams of 14 Jul 2022, 14 Jun 2023, 8 Sep 2023, 18 Jan 2024, 12 Jul 2024,
16 Jan 2025, 8 Jul 2025, 8 Sep 2025 and 14 Jan 2026.* The exam asks "true or false, and motivate concisely but
clearly": a bare "true" is worth nothing, a wrong answer costs points. Each explanation ends with the
**model answer** to write.
"""

QUESTIONS = [
    {
        'q': '*(12 Jul 2024, Q1)* "A sound inference algorithm $A$ is able to derive all the conclusions that logically '
             'follow from (are entailed by) a KB." True or false?',
        'options': ['True', 'False'],
        'answer': 1,
        'explain': '**Model answer:** False: soundness means that everything $A$ derives is entailed by the KB '
                   '($KB \\vdash_A \\alpha \\Rightarrow KB \\models \\alpha$). Deriving all the entailed conclusions is '
                   '**completeness**.',
    },
    {
        'q': '*(12 Jul 2024, Q2)* "A complete inference algorithm $A$ supports formulas using all the basic logical '
             'connectives (and, or, not, implies, …)." True or false?',
        'options': ['True', 'False'],
        'answer': 1,
        'explain': '**Model answer:** False: completeness means that $A$ derives all the conclusions entailed by the KB. '
                   'It says nothing about the syntax accepted: FC is complete for definite clauses, which use only ∧ and ⇒.',
    },
    {
        'q': '*(12 Jul 2024, Q3)* "A valid sentence is true under all models." True or false?',
        'options': ['True', 'False'],
        'answer': 0,
        'explain': '**Model answer:** True, this is the definition of a valid sentence (a tautology, e.g. $P \\vee \\neg P$).',
    },
    {
        'q': '*(12 Jul 2024, Q4)* "Conjunctive normal form is a representation in which the KB is a conjunction of '
             'clauses where each clause is a conjunction of literals." True or false?',
        'options': ['True', 'False'],
        'answer': 1,
        'explain': '**Model answer:** False, each clause is a **disjunction** of literals (and the clauses are joined by ∧).',
    },
    {
        'q': '*(12 Jul 2024, Q6)* "It is always possible to translate every sentence in propositional logic into a set '
             'of sentences in conjunctive normal form." True or false?',
        'options': ['True', 'False'],
        'answer': 0,
        'explain': '**Model answer:** True, by applying the four steps: eliminate ⇔, eliminate ⇒, move ¬ inwards, '
                   'distribute ∨ over ∧. Each step preserves equivalence (the result can be exponentially larger).',
    },
    {
        'q': '*(8 Jul 2025, Q2)* "A satisfiable formula $\\alpha$ can be unsatisfiable in some models." True or false?',
        'options': ['True', 'False'],
        'answer': 0,
        'explain': '**Model answer:** True: $\\alpha$ is satisfiable when it is true in **some** model; it can be false in '
                   'the others (e.g. $A$ is false when $A = false$). The official wording "unsatisfiable in some models" '
                   'means "false in some models": only a **valid** formula is true in all of them.',
    },
    {
        'q': '*(8 Jul 2025, Q3)* "If a generic KB contains both $A$ and $\\neg A$, then resolution can prove that any '
             'formula $\\alpha$ logically follows from the KB." True or false?',
        'options': ['True', 'False'],
        'answer': 0,
        'explain': '**Model answer:** True. The KB is inconsistent: whatever $\\neg\\alpha$ we add, resolving $A$ with $\\neg A$ '
                   'gives ⊥, so resolution proves $KB \\models \\alpha$. Semantically, the KB has no model, so every $\\alpha$ '
                   'is true in all of its models.',
    },
    {
        'q': '*(8 Jul 2025, Q4)* "Given a valid formula $\\alpha$, the formula $\\alpha \\vee \\neg\\alpha \\vee A$ is valid." '
             'True or false?',
        'options': ['True', 'False'],
        'answer': 0,
        'explain': '**Model answer:** True: if $\\alpha$ is true in all models, $\\alpha \\vee \\neg\\alpha \\vee A$ is true in all models '
                   'independently of $A$. (It would be valid for any $\\alpha$: $\\alpha \\vee \\neg\\alpha$ alone is.)',
    },
    {
        'q': '*(16 Jan 2025, Q2–Q3)* Resolution proved $R$ from the KB $\\{P, (P \\wedge Q) \\Rightarrow R, (S \\vee T) \\Rightarrow Q, T\\}$. '
             'Which conclusions are correct? (select all)',
        'options': [
            '$R$ is a valid sentence',
            'The KB is unsatisfiable',
            '$KB \\cup \\{\\neg R\\}$ is unsatisfiable',
            '$KB \\models R$',
        ],
        'answer': [2, 3],
        'explain': '**Model answer:** "$R$ is not valid: it is trivially not true in all models (take $R$ false). The KB is '
                   'not unsatisfiable: what we proved unsatisfiable is $KB \\cup \\{\\neg R\\}$ (the KB has the model '
                   '$P, Q, R, T$ true)." Entailment is about the models **of the KB**, validity about **all** models.',
    },
    {
        'q': '*(18 Jan 2024, Q2–Q3)* KB: $P \\wedge L \\Rightarrow D$, $D \\wedge T \\Rightarrow AH$, $C \\vee A \\Rightarrow TH$, '
             '$AH \\wedge TH \\Rightarrow S$. What must be proved to conclude that the patient is saved, and does it hold?',
        'options': [
            '$KB \\models S$; it does not hold: the model with all symbols false satisfies the KB and has $S$ false',
            '$KB \\models S$; it holds, because $S$ is the conclusion of a rule',
            '$S$ satisfiable together with the KB; it holds',
            '$KB \\models \\neg S$; it holds',
        ],
        'answer': 0,
        'explain': '**Model answer:** "We should prove $KB \\models S$, because we want $S$ true whenever the KB is true. '
                   'It does not hold: not every model of the KB is a model of $S$ — e.g. all symbols false satisfies '
                   'every implication and makes $S$ false." Option 3 only shows that $S$ is **possible**; $\\neg S$ is not '
                   'entailed either (all symbols true is also a model).',
    },
    {
        'q': '*(14 Jul 2022, Q2; 14 Jun 2023, Q5)* Resolution derived ⊥ from $KB \\cup \\{\\neg R\\}$. Why does this show '
             '$KB \\models R$?',
        'options': [
            'Refutation theorem: $KB \\models R$ iff $KB \\wedge \\neg R$ is unsatisfiable, and resolution is sound, so '
            'deriving ⊥ proves the unsatisfiability',
            'Because resolution is complete',
            'Because ⊥ entails $R$',
            'Because $\\neg R$ is in the KB',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Given that $KB \\cup \\{\\neg R\\} \\vdash_R \\bot$, by the soundness of resolution '
                   '$KB \\wedge \\neg R$ is unsatisfiable, and by the refutation theorem (AIMA §7.5) $KB \\models R$." Completeness '
                   'is what guarantees that a proof **exists** when the entailment holds; here we already have one.',
    },
    {
        'q': '*(8 Sep 2025, Q2)* DPLL found $(A \\vee B), (\\neg A \\vee \\neg D), (C \\vee D), (B \\vee C), (A \\vee \\neg C), '
             '(\\neg B \\vee D), (\\neg A \\vee \\neg C)$ satisfiable. Can you conclude that the first six clauses entail '
             '$A \\wedge C$?',
        'options': [
            'No: the last clause is $\\neg(A \\wedge C)$, so we showed $KB \\wedge \\neg\\alpha$ satisfiable: $KB \\not\\models \\alpha$',
            'Yes: the formula is satisfiable',
            'Yes, because DPLL is complete',
            'Nothing can be said',
        ],
        'answer': 0,
        'explain': '**Model answer:** "No: with $KB$ = the first six clauses and $\\alpha = A \\wedge C$, the last clause is '
                   '$\\neg\\alpha$, and we proved $KB + \\neg\\alpha$ satisfiable; by the refutation theorem we cannot conclude '
                   '$KB \\models \\alpha$." The model $\\{\\neg A, B, \\neg C, D\\}$ is an explicit counterexample.',
    },
    {
        'q': '*(14 Jan 2026, Q2)* DPLL showed that $X \\vee Y \\vee Z$, $X \\vee Y \\vee \\neg Z$, $X \\vee T \\vee \\neg Y$, $\\neg T \\vee X$, '
             '$\\neg X \\vee Y$, $\\neg Y \\vee Z$, $\\neg Y \\vee \\neg Z$ is unsatisfiable. Does this answer prove that the KB made of '
             'all clauses except $\\neg Y \\vee Z$ entails $\\neg Z \\Rightarrow \\neg Y$?',
        'options': [
            'No: $\\neg Z \\Rightarrow \\neg Y$ is exactly $\\neg Y \\vee Z$, so we proved $KB + \\alpha$ unsatisfiable, while '
            'entailment needs $KB + \\neg\\alpha$ unsatisfiable; from Q1 alone nothing follows',
            'Yes, by the refutation theorem',
            'Yes, because the set is unsatisfiable',
            'No, because DPLL is not sound',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): "KB plus $\\alpha = \\neg Z \\Rightarrow \\neg Y = Z \\vee \\neg Y$ form exactly the set '
                   'shown unsatisfiable, so we proved $KB + \\alpha \\vdash \\bot$. The entailment holds if $KB + \\neg\\alpha \\vdash \\bot$, '
                   'and from Q1 we cannot say anything (the KB itself could be unsatisfiable)." Going further: $KB + \\alpha$ '
                   'unsatisfiable means $KB \\models \\neg\\alpha = Y \\wedge \\neg Z$; the KB is satisfiable (e.g. $X, Y, \\neg Z$), so in '
                   'fact the entailment does **not** hold.',
    },
    {
        'q': '*(8 Sep 2023, Q3)* The classical DPLL finds the model $\\{a, d, \\neg c\\}$; the variant of the exam found '
             '$\\{a, \\neg c, d, b, e\\}$. How do you explain that the models differ?',
        'options': [
            'The formula has several models: $b$ and $e$ can take any value once $a, d, \\neg c$ hold',
            'One of the two algorithms is wrong',
            'DPLL is not complete',
            'The variant uses a different formula',
        ],
        'answer': 0,
        'explain': '**Model answer:** "According to the truth values assigned to $b$ and $e$ we can find different models: '
                   'the formula has multiple models." Early termination stops the classical DPLL with $b$, $e$ unassigned: '
                   'the partial model stands for all four completions.',
    },
]
