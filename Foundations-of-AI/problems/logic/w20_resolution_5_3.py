from harness import Test
from logic_lib import check_cnf, check_proof

TITLE = 'Exercise book 5.3 · Resolution in both directions'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exercise book', 'resolution', 'CNF', 'equivalence']

STATEMENT = r"""
*Exercise book, exercise 5.3 (resolution part).* $\Phi_1 = A \wedge (B \vee Q)$, $\Phi_2 = (A \wedge B) \vee (A \wedge Q)$.
Prove (1) $\Phi_1 \models \Phi_2$ and (3) $\Phi_2 \models \Phi_1$ by resolution — together they say that $\Phi_1 \equiv \Phi_2$
(distributivity).

Each function returns `(clauses, steps)`:
- `clauses`: the clauses of $\mathrm{CNF}(\Phi_i) \wedge \mathrm{CNF}(\neg\Phi_j)$ as strings, numbered 1, 2, … in your order
  (the test checks that together they are equivalent to $\Phi_i \wedge \neg\Phi_j$);
- `steps`: the refutation, `(clause, i, j)` per new clause, ending with `'⊥'` (format of problem x30).

- `phi1_entails_phi2()`
- `phi2_entails_phi1()`
"""

STARTER = '''def phi1_entails_phi2():
    clauses = []        # CNF(Φ1) and CNF(¬Φ2)
    steps = []
    return clauses, steps

def phi2_entails_phi1():
    return [], []
'''

SOLUTION = '''def phi1_entails_phi2():
    clauses = ['A', 'B | Q', '~A | ~B', '~A | ~Q']           # 1-2: Φ1, 3-4: ¬Φ2
    steps = [('~B', 1, 3), ('~Q', 1, 4), ('Q', 2, 5), ('⊥', 6, 7)]
    return clauses, steps

def phi2_entails_phi1():
    clauses = ['A', 'A | Q', 'A | B', 'B | Q', '~A | ~B', '~A | ~Q']   # 1-4: Φ2, 5-6: ¬Φ1
    steps = [('~B', 1, 5), ('~Q', 1, 6), ('Q', 4, 7), ('⊥', 8, 9)]
    return clauses, steps
'''

HINTS = [
    '$\\neg\\Phi_2 = \\neg(A \\wedge B) \\wedge \\neg(A \\wedge Q) = (\\neg A \\vee \\neg B) \\wedge (\\neg A \\vee \\neg Q)$.',
    '$\\mathrm{CNF}(\\Phi_2)$: distribute $(A \\wedge B) \\vee (A \\wedge Q)$ into $A \\wedge (A \\vee Q) \\wedge (A \\vee B) \\wedge (B \\vee Q)$; '
    '$\\neg\\Phi_1 = \\neg A \\vee (\\neg B \\wedge \\neg Q) = (\\neg A \\vee \\neg B) \\wedge (\\neg A \\vee \\neg Q)$.',
    'In both cases the unit $A$ turns the two negated clauses into $\\neg B$ and $\\neg Q$, which kill $B \\vee Q$.',
]

EXPLANATION = r"""
The book's refutations are longer (it resolves every pair level by level: 8 steps for (1), 10 for (3)), e.g. for (1):
5. $\neg B$ (1, 3), 6. $\neg Q$ (1, 4), 7. $\neg A \vee Q$ (2, 3), 8. $\neg A \vee B$ (2, 4), 9. $Q$ (1, 7), 10. $B$ (1, 8),
11. $\neg A$ (3, 8), 12. {} (1, 11). Any correct refutation is fine; a goal-directed one is 4 steps:
$\neg B$, $\neg Q$, then $Q$ from $B \vee Q$, then ⊥.

Two entailments in opposite directions = **logical equivalence** ($\alpha \equiv \beta$ iff $\alpha \models \beta$ and
$\beta \models \alpha$): this exercise proves the distributivity of $\wedge$ over $\vee$. Note that $\mathrm{CNF}(\Phi_2)$
contains the clauses $A \vee Q$ and $A \vee B$, subsumed by $A$: harmless, the four steps do not remove them.
"""

ENTRY = 'phi1_entails_phi2'


def _check(premise, conclusion):
    def check(got):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (clauses, steps).'
        clauses, steps = got
        ok, msg = check_cnf(clauses, [premise, f'~({conclusion})'])
        if not ok:
            return False, 'clauses: ' + msg
        return check_proof(list(clauses), steps)
    return check


TESTS = [
    Test('(1) Φ1 ⊨ Φ2 by resolution', call=lambda sol: sol.phi1_entails_phi2(),
         check=_check('A & (B | Q)', '(A & B) | (A & Q)'), show='phi1_entails_phi2()'),
    Test('(3) Φ2 ⊨ Φ1 by resolution', call=lambda sol: sol.phi2_entails_phi1(),
         check=_check('(A & B) | (A & Q)', 'A & (B | Q)'), show='phi2_entails_phi1()'),
]
