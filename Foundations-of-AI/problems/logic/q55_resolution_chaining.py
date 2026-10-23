TITLE = 'Resolution, Horn clauses, forward and backward chaining'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['resolution', 'CNF', 'Horn clauses', 'definite clauses', 'forward chaining', 'backward chaining']

STATEMENT = r"""
Theorem proving in PL (AIMA §7.5.2–7.5.4, strategies from §9.5.6): what each method can do, on which
sentences, at which cost.
"""

QUESTIONS = [
    {
        'q': 'Which is the CNF of $A \\vee B \\Rightarrow C$?',
        'options': ['$\\neg A \\vee \\neg B \\vee C$', '$(\\neg A \\vee C) \\wedge (\\neg B \\vee C)$',
                    '$(\\neg A \\wedge \\neg B) \\vee C$', '$\\neg A \\vee B \\vee C$'],
        'answer': 1,
        'explain': '$\\neg(A \\vee B) \\vee C = (\\neg A \\wedge \\neg B) \\vee C$ (De Morgan), then distribute: '
                   '$(\\neg A \\vee C) \\wedge (\\neg B \\vee C)$. Option 3 is correct but not in CNF; option 1 is the CNF of '
                   '$A \\wedge B \\Rightarrow C$ (exam 18 Jan 2024 has both shapes).',
    },
    {
        'q': 'Which clauses are **definite**? (select all)',
        'options': ['$\\neg L \\vee \\neg B \\vee M$', '$\\neg W \\vee \\neg P$', '$A$', '$\\neg A \\vee B \\vee C$',
                    '$\\neg Warm \\vee Raining \\vee Pleasant$'],
        'answer': [0, 2],
        'explain': 'Definite = **exactly one** positive literal: $L \\wedge B \\Rightarrow M$ and the fact $A$. '
                   '$\\neg W \\vee \\neg P$ is a goal clause (zero positive literals: still Horn). The last two have two '
                   'positive literals: not even Horn.',
    },
    {
        'q': 'Why do we prove $KB \\models \\alpha$ by **refutation** ($KB \\wedge \\neg\\alpha \\vdash \\bot$) instead of '
             'deriving $\\alpha$ directly with resolution?',
        'options': [
            'Because resolution is unsound when used directly.',
            'Because resolution is only **refutation-complete**: some entailed sentences cannot be derived directly '
            '($A \\models A \\vee B$, but no step applies to $A$ alone).',
            'Because $\\neg\\alpha$ is always shorter than $\\alpha$.',
            'Because it is faster.',
        ],
        'answer': 1,
        'explain': 'Ground resolution theorem: an unsatisfiable clause set has ⊥ in its resolution closure. So the '
                   'refutation version is complete; the direct version is not.',
    },
    {
        'q': 'PL-RESOLUTION stops because no new clause can be generated, without finding ⊥. You conclude…',
        'options': ['$KB \\models \\alpha$', '$KB \\not\\models \\alpha$', 'nothing: resolution may need more time',
                    'the KB is inconsistent'],
        'answer': 1,
        'explain': 'The closure is finite (at most $3^n$ clauses over $n$ symbols) and refutation-complete: no ⊥ in '
                   'the complete closure means $KB \\wedge \\neg\\alpha$ is satisfiable.',
    },
    {
        'q': 'Under the **unit resolution** strategy, which pairs may be resolved?',
        'options': ['Pairs where at least one clause is a single literal',
                    'Pairs where both clauses are single literals',
                    'Pairs where one clause comes from the KB or the negated query',
                    'Pairs containing the negated query'],
        'answer': 0,
        'explain': 'Unit resolution: at least one unit parent, so each step shortens the other clause. Option 3 is '
                   '**input** resolution; option 4 resembles **set of support**.',
    },
    {
        'q': 'Which statements about strategies are true? (select all)',
        'options': [
            'Unit resolution is complete for Horn clauses.',
            'Input resolution is complete for Horn clauses.',
            'Unit resolution is complete for any CNF.',
            'Set of support is complete if the clauses outside the set of support are satisfiable.',
        ],
        'answer': [0, 1, 3],
        'explain': '$\\{P \\vee Q, P \\vee \\neg Q, \\neg P \\vee R, \\neg P \\vee \\neg R\\}$ is unsatisfiable but has no unit clause '
                   '(exam 14 Jul 2022). With the KB as the satisfiable part and the negated query as the set of '
                   'support, every step involves the query side: a goal-directed but complete search (AIMA §9.5.6).',
    },
    {
        'q': 'Forward chaining is…',
        'options': ['data-driven and complete for definite clauses', 'goal-driven and complete for any KB',
                    'data-driven and complete for any KB', 'goal-driven and complete for definite clauses'],
        'answer': 0,
        'explain': 'FC starts from the facts and fires rules (data-driven); BC starts from the query (goal-driven). '
                   'Both are sound and complete **for definite clauses** only (exams 12 Jul 2024, 8 Jul 2025).',
    },
    {
        'q': 'In PL-FC-ENTAILS, what is `count[c]`?',
        'options': ['The number of premises of $c$ not yet known to be true',
                    'The number of times $c$ fired', 'The number of symbols inferred so far',
                    'The number of clauses that conclude $c$'],
        'answer': 0,
        'explain': 'Initialized to the number of premise symbols, decremented when one of them is inferred. At 0 the '
                   'rule fires. That bookkeeping is what makes FC linear in the size of the KB.',
    },
    {
        'q': 'Which can backward chaining prove directly from a definite KB? (select all)',
        'options': ['A symbol $A$', 'A conjunction $A \\wedge D$ in one run', 'A negated symbol $\\neg A$',
                    'An implication $\\neg Z \\Rightarrow \\neg Y$'],
        'answer': [0],
        'explain': 'FC and BC only derive positive literals (symbols). For $A \\wedge D$, run BC twice and combine '
                   '(exam 3 Feb 2025). Negations and implications are out of reach (exam 14 Jan 2026).',
    },
    {
        'q': 'Why can backward chaining be much cheaper than forward chaining?',
        'options': [
            'It only touches the rules relevant to the query',
            'It does not need definite clauses',
            'It never backtracks',
            'It uses resolution internally',
        ],
        'answer': 0,
        'explain': 'FC derives every consequence of the facts, relevant or not ($D$ on exam 3 Feb 2025). BC works '
                   'backwards from the goal, so its cost is often much less than linear in the KB size; it does '
                   'backtrack (the ✗ in the exam trees).',
    },
    {
        'q': 'In a backward-chaining tree, the rule $(B \\wedge C) \\Rightarrow A$ is tried and $B$ fails. What happens to $C$?',
        'options': ['$C$ is drawn but not expanded; BC tries the next rule for $A$',
                    '$C$ is expanded anyway', '$A$ fails immediately', 'BC restarts from $C$'],
        'answer': 0,
        'explain': 'The premises are an AND: one failure kills the rule, so proving $C$ is useless (exam 3 Feb 2025: '
                   '"backward chaining does not continue downward here: why?"). BC then backtracks to the next rule '
                   'that concludes $A$ ($G \\Rightarrow A$).',
    },
]
