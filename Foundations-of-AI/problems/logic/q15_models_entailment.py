TITLE = 'Models, entailment, validity and satisfiability'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['models', 'entailment', 'validity', 'satisfiability', 'soundness', 'completeness']

STATEMENT = r"""
The vocabulary every logic exam question is built on (AIMA §7.1, §7.3–7.5.1). Think in terms of **sets of
models**: $\alpha \models \beta$ iff $M(\alpha) \subseteq M(\beta)$.
"""

QUESTIONS = [
    {
        'q': 'Symbols $A, B, C$. How many models does $A \\vee B$ have, and how many does $A \\wedge B$ have?',
        'options': ['3 and 1', '6 and 2', '4 and 2', '2 and 1'],
        'answer': 1,
        'explain': 'With three symbols there are $2^3 = 8$ models. $A \\vee B$ is false only when $A$ and $B$ are both '
                   'false: $8 - 2 = 6$ models ($C$ is free). $A \\wedge B$: 2 models ($C$ true or false). '
                   'Fewer models = stronger sentence: $A \\wedge B \\models A \\vee B$.',
    },
    {
        'q': '$\\alpha \\models \\beta$ means…',
        'options': [
            'every model of $\\beta$ is a model of $\\alpha$',
            'every model of $\\alpha$ is a model of $\\beta$',
            '$\\alpha$ and $\\beta$ have at least one model in common',
            '$\\beta$ can be derived from $\\alpha$ with resolution',
        ],
        'answer': 1,
        'explain': '$M(\\alpha) \\subseteq M(\\beta)$: wherever $\\alpha$ is true, $\\beta$ is true. The last option is '
                   '$\\alpha \\vdash_R \\beta$, a statement about an **algorithm**; it coincides with entailment only because '
                   'resolution is sound and refutation-complete.',
    },
    {
        'q': 'Which sentences are **valid**? (select all)',
        'options': ['$P \\vee \\neg P$', '$P \\Rightarrow P$', '$(P \\Rightarrow Q) \\Rightarrow (Q \\Rightarrow P)$',
                    '$((P \\Rightarrow Q) \\wedge P) \\Rightarrow Q$', '$P \\wedge \\neg P \\Rightarrow Q$'],
        'answer': [0, 1, 3, 4],
        'explain': 'Valid = true in every model. Option 4 is Modus Ponens written as a sentence (deduction theorem). '
                   'Option 5 has an unsatisfiable premise, so the implication is always true. Option 3 fails with '
                   '$P$ false, $Q$ true: the converse of an implication is not implied.',
    },
    {
        'q': 'Which statements are equivalent to "$KB \\models \\alpha$"? (select all)',
        'options': [
            '$KB \\Rightarrow \\alpha$ is valid',
            '$KB \\wedge \\neg\\alpha$ is unsatisfiable',
            '$KB \\wedge \\alpha$ is satisfiable',
            '$\\neg KB \\vee \\alpha$ is valid',
        ],
        'answer': [0, 1, 3],
        'explain': 'Deduction theorem (1), refutation theorem (2), and (4) is (1) with the implication eliminated. '
                   '(3) only says $\\alpha$ is **consistent** with the KB: $KB = \\{A\\}$, $\\alpha = B$ satisfies it, but '
                   '$A \\not\\models B$.',
    },
    {
        'q': 'An inference algorithm is **sound** if…',
        'options': [
            'every sentence it derives is entailed by the KB',
            'it derives every sentence entailed by the KB',
            'it always terminates',
            'it works for every sentence of the language',
        ],
        'answer': 0,
        'explain': 'Sound = truth-preserving: $KB \\vdash \\alpha \\Rightarrow KB \\models \\alpha$. Option 2 is '
                   '**completeness**. An algorithm that derives nothing at all is sound (and useless); one that derives '
                   'everything is complete (and wrong).',
    },
    {
        'q': 'The KB contains both $A$ and $\\neg A$. Which statements are true? (select all)',
        'options': [
            'The KB has no models.',
            '$KB \\models Q$ for every sentence $Q$.',
            '$KB \\models \\neg Q$ for every sentence $Q$.',
            'Resolution derives ⊥ from the KB plus any negated query.',
        ],
        'answer': [0, 1, 2, 3],
        'explain': '$M(KB) = \\emptyset \\subseteq M(Q)$ for every $Q$: an inconsistent KB entails everything, '
                   'contradictions included. Resolution finds ⊥ from $A$ and $\\neg A$ alone, whatever is added '
                   '(exam 8 Jul 2025).',
    },
    {
        'q': '**Monotonicity** of propositional logic says that…',
        'options': [
            'if $KB \\models \\alpha$ then $KB \\wedge \\beta \\models \\alpha$ for any $\\beta$',
            'the number of models grows when sentences are added',
            'if $KB \\models \\alpha$ then $\\alpha \\models KB$',
            'inference steps can be undone when new percepts arrive',
        ],
        'answer': 0,
        'explain': 'Adding $\\beta$ can only remove models, and $\\alpha$ was true in all of them. So a conclusion, once '
                   'drawn, stays valid: inference rules can be applied whenever their premises are in the KB, '
                   'regardless of what else it contains.',
    },
    {
        'q': 'Which equivalences are correct? (select all)',
        'options': [
            '$A \\Rightarrow B \\equiv \\neg B \\Rightarrow \\neg A$',
            '$A \\Rightarrow B \\equiv B \\Rightarrow A$',
            '$\\neg(A \\wedge B) \\equiv \\neg A \\vee \\neg B$',
            '$A \\vee (B \\wedge C) \\equiv (A \\vee B) \\wedge (A \\vee C)$',
            '$A \\Leftrightarrow B \\equiv (A \\wedge B) \\vee (\\neg A \\wedge \\neg B)$',
        ],
        'answer': [0, 2, 3, 4],
        'explain': 'Contraposition, De Morgan, distributivity of ∨ over ∧ (step 4 of the CNF conversion), and the '
                   '"same truth value" reading of ⇔. Option 2 confuses an implication with its converse.',
    },
    {
        'q': 'TT-ENTAILS on a KB with $n$ symbols: time and space?',
        'options': ['$O(2^n)$ time, $O(n)$ space', '$O(n^2)$ time, $O(n)$ space', '$O(2^n)$ time, $O(2^n)$ space',
                    'linear time in the size of the KB'],
        'answer': 0,
        'explain': 'It enumerates all $2^n$ models depth-first (one recursion level per symbol), so the memory is '
                   'linear. Sound and complete, but exponential: entailment in PL is co-NP-complete. Linear time is '
                   'what FC/BC achieve on **definite** clauses.',
    },
    {
        'q': 'Wumpus world, the agent knows $R_1..R_5$ (§7.4.3). Which are entailed? (select all)',
        'options': ['$\\neg P_{1,2}$', '$\\neg P_{2,1}$', '$P_{2,2}$', '$P_{2,2} \\vee P_{3,1}$'],
        'answer': [0, 1, 3],
        'explain': 'No breeze in [1,1] ($\\neg B_{1,1}$ with $R_2$) rules out pits in [1,2] and [2,1]. The breeze in [2,1] '
                   'needs a pit in [1,1], [2,2] or [3,1]; [1,1] is safe, so $P_{2,2} \\vee P_{3,1}$ — but the KB has models '
                   'with and without $P_{2,2}$.',
    },
    {
        'q': 'What does **grounding** refer to?',
        'options': [
            'The connection between the KB and the real world: if the KB is true in the world and inference is sound, '
            'the conclusions are true in the world',
            'Replacing variables with constants in first-order logic',
            'Converting a KB into CNF',
            'The base case of TT-CHECK-ALL',
        ],
        'answer': 0,
        'explain': 'Logic guarantees "true in every model of the KB"; whether the KB describes the real world depends '
                   'on the sensors (percept sentences) and on learning (general rules). (Option 2 is a different use '
                   'of the word in FOL, "ground terms".)',
    },
]
