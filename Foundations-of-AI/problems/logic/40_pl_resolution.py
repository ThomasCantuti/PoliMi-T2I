from harness import Test
from logic_lib import parse

TITLE = 'PL-RESOLUTION: entailment by refutation'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['resolution', 'refutation', 'entailment', 'completeness']

STATEMENT = r"""
To decide $KB \models \alpha$, resolution proves that $KB \wedge \neg\alpha$ is **unsatisfiable** (refutation
theorem, AIMA §7.5.1–7.5.2):

```text
function PL-RESOLUTION(KB, α) returns true or false
    clauses <- the set of clauses in the CNF representation of KB ∧ ¬α
    new <- { }
    loop do
        for each pair of clauses Ci, Cj in clauses do
            resolvents <- PL-RESOLVE(Ci, Cj)
            if resolvents contains the empty clause then return true
            new <- new ∪ resolvents
        if new ⊆ clauses then return false
        clauses <- clauses ∪ new
```

Write `pl_resolution(kb, alpha)`: `kb` is a list of formulas (nested tuples), `alpha` a formula. The course
helpers are available: `from logic_lib import to_cnf, pl_resolve` (problems 20 and 30). Discard tautological
resolvents (they can never help to reach ⊥, and dropping them keeps the clause set small).

The tests include exam KBs where the answer is **no**: the loop must then stop because nothing new can be
derived.
"""

STARTER = '''from logic_lib import to_cnf, pl_resolve

def pl_resolution(kb: list, alpha) -> bool:
    """True iff KB ∧ ¬alpha is unsatisfiable (so KB ⊨ alpha)."""
    clauses = set().union(*(to_cnf(f) for f in kb), to_cnf(('~', alpha)))
    # TODO: saturate
    return False
'''

SOLUTION = '''from logic_lib import to_cnf, pl_resolve

def pl_resolution(kb: list, alpha) -> bool:
    """True iff KB ∧ ¬alpha is unsatisfiable (so KB ⊨ alpha)."""
    clauses = set().union(*(to_cnf(f) for f in kb), to_cnf(('~', alpha)))
    while True:
        new = set()
        for ci in clauses:
            for cj in clauses:
                for r in pl_resolve(ci, cj):
                    if not r:
                        return True                    # empty clause: contradiction
                    if not any('~' + l in r for l in r):
                        new.add(r)
        if new <= clauses:
            return False                               # saturated without ⊥
        clauses |= new
'''

HINTS = [
    'Negate the query **before** converting: the clauses are CNF(KB) ∪ CNF(¬α). '
    'If ¬α is already a contradiction with the KB, the empty clause appears.',
    'Loop: try every pair, collect the resolvents in `new`; stop with `True` at the empty clause; stop with `False` '
    'when `new` adds nothing (`new <= clauses`).',
    'A clause `r` is a tautology if some literal and its complement are both in it: skip it.',
]

EXPLANATION = r"""
**Why it terminates.** Over $n$ symbols there are at most $3^n$ different clauses (each symbol positive,
negative or absent), so the clause set cannot grow forever: when no new clause appears, the **resolution
closure** is complete.

**Why "false" means "not entailed".** Ground resolution theorem (§7.5.2): if a set of clauses is
unsatisfiable, its resolution closure contains the empty clause. So reaching saturation without ⊥ proves that
$KB \wedge \neg\alpha$ is satisfiable, i.e. $KB \not\models \alpha$ — resolution is **refutation-complete**.
On exam 18 Jan 2024 the KB does not entail $S$: the model with every symbol false satisfies the KB.

**Why we refute instead of deriving $\alpha$.** Resolution is not complete for deriving entailed sentences
directly: $\{A\} \models A \vee B$, but no resolution step applies to the single clause $A$. Refutation sidesteps
this: $A, \neg A, \neg B$ gives ⊥ at once.

**Cost.** Saturation tries every pair, round after round: exponential in general. The exam proofs are short
because you choose the pairs (start from the negated query); the strategies of problem x40 restrict the pairs
automatically.
"""

ENTRY = 'pl_resolution'


def _kb(*s):
    return [parse(x) for x in s]


TESTS = [
    Test('modus ponens', args=(_kb('A', 'A => B'), parse('B')), expected=True, show='A, A ⇒ B ⊨ B ?'),
    Test('affirming the consequent is wrong', args=(_kb('B', 'A => B'), parse('A')), expected=False,
         show='B, A ⇒ B ⊨ A ?'),
    Test('exam 14 Jul 2022 / 16 Jan 2025', args=(_kb('P', '(P & Q) => R', '(S | T) => Q', 'T'), parse('R')),
         expected=True, show='P, (P ∧ Q) ⇒ R, (S ∨ T) ⇒ Q, T ⊨ R ?'),
    Test('exam 14 Jun 2023: ¬Raining', args=(_kb('Swimming => Wet', 'Raining & Outside => Wet',
                                                 'Warm & ~Raining => Pleasant', '~Wet', 'Outside', 'Warm'),
                                             parse('~Raining')), expected=True, show='swimming KB ⊨ ¬Raining ?'),
    Test('exam 11 Jun 2025: IWin', args=(_kb('Heads | Tails', '~Heads | ~Tails', 'Heads => IWin',
                                             'Tails => YouLose', 'YouLose => IWin', 'IWin => YouLose'),
                                         parse('IWin')), expected=True, show='heads/tails KB ⊨ IWin ?'),
    Test('exam 11 Jun 2026: delivered on time', args=(_kb('(O & ~P) => R', 'S => (D | B)', '(R & M) => ~D',
                                                          '(~D | B) => T', 'O & ~P & M & ~B'), parse('T')),
         expected=True, show='warehouse KB ⊨ T ?'),
    Test('exam 18 Jan 2024: S is NOT entailed', args=(_kb('P & L => D', 'D & T => AH', 'C | A => TH', 'AH & TH => S'),
                                                      parse('S')), expected=False,
         show='P∧L⇒D, D∧T⇒AH, C∨A⇒TH, AH∧TH⇒S ⊨ S ?'),
    Test('exercise book 5.3: Φ1 ⊨ Φ2', args=(_kb('A & (B | Q)'), parse('(A & B) | (A & Q)')), expected=True,
         show='A ∧ (B ∨ Q) ⊨ (A ∧ B) ∨ (A ∧ Q) ?'),
    Test('exercise book 5.3: Φ2 ⊨ Φ1', args=(_kb('(A & B) | (A & Q)'), parse('A & (B | Q)')), expected=True,
         show='(A ∧ B) ∨ (A ∧ Q) ⊨ A ∧ (B ∨ Q) ?'),
    Test('A ⊨ A ∨ B (by refutation)', args=(_kb('A'), parse('A | B')), expected=True, show='A ⊨ A ∨ B ?'),
    Test('wumpus: P22 not known', args=(_kb('~P11', 'B11 <=> (P12 | P21)', 'B21 <=> (P11 | P22 | P31)', '~B11', 'B21'),
                                        parse('P22')), expected=False, show='R1..R5 ⊨ P22 ?'),
    Test('exam 31 Aug 2026: unrestricted resolution proves A ∧ B',
         args=(_kb('A | B', 'A | ~B', '~A | B'), parse('A & B')), expected=True, show='A∨B, A∨¬B, ¬A∨B ⊨ A ∧ B ?'),
]
