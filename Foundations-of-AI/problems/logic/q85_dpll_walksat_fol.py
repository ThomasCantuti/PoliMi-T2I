TITLE = 'DPLL, WalkSAT and a glimpse of first-order logic'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['DPLL', 'WalkSAT', 'random SAT', 'first-order logic', 'quantifiers']

STATEMENT = r"""
Model checking done well (AIMA §7.6) and the first-order logic overview (AIMA ch. 8).
"""

QUESTIONS = [
    {
        'q': 'Clauses $(A \\vee \\neg B)$, $(\\neg B \\vee \\neg C)$, $(C \\vee A)$. Which symbols are **pure**? (select all)',
        'options': ['$A$', '$B$', '$C$', 'none'],
        'answer': [0, 1],
        'explain': '$A$ appears only positive, $B$ only negative ($\\neg B$ twice), $C$ with both signs. AIMA §7.6.1 uses '
                   'this very example: DPLL can set $A = true$ and $B = false$ without losing any model.',
    },
    {
        'q': 'Partial model $\\{A = false\\}$. Is $(A \\vee \\neg B)$ a unit clause?',
        'options': ['Yes: its only literal not yet false is $\\neg B$, so $B$ is forced to false',
                    'No: it has two literals', 'Only if $B$ is already assigned', 'No: unit clauses are written with one literal in the KB'],
        'answer': 0,
        'explain': 'In DPLL a clause is unit when all its literals but one are false under the partial model. Assigning '
                   'the forced literal can make other clauses unit: **unit propagation**.',
    },
    {
        'q': 'What does **early termination** give DPLL? (select all)',
        'options': [
            'A clause is true as soon as one of its literals is true',
            'The formula is false as soon as one clause is false',
            'The search stops when every clause is true, even if some symbols are unassigned',
            'The search stops at the first split',
        ],
        'answer': [0, 1, 2],
        'explain': 'Partial models decide the answer early: whole subtrees are never generated. A model found with '
                   'unassigned symbols stands for all their completions (exam 8 Sep 2023: "$\\{a, d, \\neg c\\}$ + any value '
                   'for $b$ and $e$").',
    },
    {
        'q': 'DPLL runs **without** the pure symbol and unit clause heuristics. Compared with the full DPLL…',
        'options': [
            'same answer, usually more nodes explored',
            'it may answer "satisfiable" for an unsatisfiable formula',
            'it may not terminate',
            'same answer, always fewer nodes',
        ],
        'answer': 0,
        'explain': 'The heuristics only prune branches that cannot contain a needed model; without them DPLL is plain '
                   'backtracking with early termination: still sound, complete and terminating (at most $2^n$ leaves).',
    },
    {
        'q': 'WalkSAT returns failure after `max_flips` flips. What can you conclude?',
        'options': ['Nothing certain: the formula may be satisfiable', 'The formula is unsatisfiable',
                    'The formula is valid', 'The KB entails the query'],
        'answer': 0,
        'explain': 'WalkSAT is incomplete: it can find models but never prove that none exists. Hence it cannot be used '
                   'to prove entailment (which needs unsatisfiability of $KB \\wedge \\neg\\alpha$).',
    },
    {
        'q': 'In WalkSAT, why flip a **random** symbol of the chosen false clause with probability $p$?',
        'options': ['To escape local minima of the number of unsatisfied clauses',
                    'To guarantee completeness', 'To implement unit propagation', 'To pick the pure symbols'],
        'answer': 0,
        'explain': 'The greedy flip (maximize satisfied clauses) is hill climbing and gets stuck; the random walk step '
                   'adds noise, like the random moves of local search. The clause is false, so flipping any of its '
                   'symbols makes it true.',
    },
    {
        'q': 'Random 3-CNF with $m$ clauses and $n$ symbols. Where are the **hardest** instances?',
        'options': ['Around $m/n \\approx 4.26$, the satisfiability threshold', 'For very small $m/n$',
                    'For very large $m/n$', 'Hardness does not depend on $m/n$'],
        'answer': 0,
        'explain': 'Under-constrained problems (small ratio) have many models and are easy; over-constrained ones are '
                   'quickly refuted. Near the threshold the probability of satisfiability drops from ~1 to ~0 and '
                   'DPLL/WalkSAT run longest (AIMA §7.6.3).',
    },
    {
        'q': 'A SAT problem is solved as a CSP (Boolean variables, one constraint per clause) with backtracking, forward '
             'checking and MRV. What does DPLL do differently? (select all)',
        'options': [
            'Early termination on clauses and on the formula',
            'The pure symbol heuristic',
            'Unit propagation, which cascades (forward checking stops after one step)',
            'DPLL cannot solve problems that CSP backtracking can',
        ],
        'answer': [0, 1, 2],
        'explain': 'Exam 6 Feb 2024, Q4: "DPLL uses different heuristics for selecting variables and values and '
                   'implements early termination." Both are complete; DPLL is specialized for clauses.',
    },
    {
        'q': 'FOL: "All kings are persons". Which sentence is right?',
        'options': ['$\\forall x\\ King(x) \\Rightarrow Person(x)$', '$\\forall x\\ King(x) \\wedge Person(x)$',
                    '$\\exists x\\ King(x) \\Rightarrow Person(x)$', '$King \\Rightarrow Person$'],
        'answer': 0,
        'explain': '$\\forall$ goes with $\\Rightarrow$. Option 2 says that **everything** is a king and a person. Option 3 is '
                   'true as soon as one object is not a king. Option 4 is propositional: no objects at all.',
    },
    {
        'q': 'FOL: "Some crown is on John\'s head". Which sentence is right?',
        'options': ['$\\exists x\\ Crown(x) \\wedge OnHead(x, John)$', '$\\exists x\\ Crown(x) \\Rightarrow OnHead(x, John)$',
                    '$\\forall x\\ Crown(x) \\Rightarrow OnHead(x, John)$', '$\\forall x\\ Crown(x) \\wedge OnHead(x, John)$'],
        'answer': 0,
        'explain': '$\\exists$ goes with $\\wedge$. With $\\Rightarrow$ the sentence is satisfied by any object that is not a '
                   'crown (a false premise makes the implication true), so it says almost nothing.',
    },
    {
        'q': 'What does FOL add to propositional logic? (select all)',
        'options': ['Objects, relations and functions', 'Quantifiers $\\forall$ and $\\exists$ over objects',
                    'Equality between terms', 'Truth tables with $2^n$ rows for every KB'],
        'answer': [0, 1, 2],
        'explain': 'PL needs one symbol per fact ("breeze in [1,1]", "breeze in [2,1]", …); FOL states the rule once '
                   'for all squares. A FOL model has a domain of objects and there are infinitely many models, so '
                   'truth tables are not an option.',
    },
]
