from harness import Test
from logic_lib import clause, show_clause, pl_resolve, is_tautology, satisfiable, clause_formula

TITLE = 'Exam · Unit and input resolution: when they fail (Jul 2022, Aug 2026)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'resolution strategies', 'Aug 2026', 'Jul 2022', 'Jan 2023', 'Horn clauses', 'completeness']

STATEMENT = r"""
*Written exams of 31 Aug 2026 (Q1–Q2), 14 Jul 2022 (Q3) and 18 Jan 2023 (Q3).* A resolution **strategy**
restricts the pairs that may be resolved (AIMA §9.5.6):

- **unit resolution**: at least one of the two clauses is a unit clause (one literal);
- **input resolution**: at least one of the two clauses is an **input** clause, i.e. one of the starting clauses
  (the KB in CNF plus the negated query).

1. Write `saturate(clauses, strategy=None)`: start from the given clauses (`frozenset`s; drop tautologies),
   repeatedly add every non-tautological resolvent of an **allowed** pair, until the empty clause appears or nothing
   new can be added. Return `(found_empty, closure)`, where `closure` is the set of clauses obtained (input
   clauses included). `strategy` is `None`, `'unit'` or `'input'`; `pl_resolve` is in `logic_lib`.
2. Write `counterexample()` (14 Jul 2022, Q3: "Is the unit resolution strategy complete in general?"):
   return a list of clause strings that is **unsatisfiable** but from which unit resolution cannot derive ⊥.

31 Aug 2026: KB = {1. $A \vee B$, 2. $A \vee \neg B$, 3. $\neg A \vee B$}, query $A \wedge B$, negated query
4. $\neg A \vee \neg B$. The official solution derives 5. $A$ (1, 2), 6. $B$ (1, 3), 7. $\neg B$ (2, 4), 8. $\neg A$ (3, 4) "and
input resolution cannot derive anything new".
"""

STARTER = '''from logic_lib import pl_resolve, is_tautology

def saturate(clauses: list[frozenset], strategy: str | None = None) -> tuple[bool, set[frozenset]]:
    given = {c for c in clauses if not is_tautology(c)}
    closure = set(given)
    # TODO: add the resolvents of the allowed pairs until ⊥ or nothing new
    return False, closure

def counterexample() -> list[str]:
    return []
'''

SOLUTION = '''from logic_lib import pl_resolve, is_tautology

def saturate(clauses: list[frozenset], strategy: str | None = None) -> tuple[bool, set[frozenset]]:
    given = {c for c in clauses if not is_tautology(c)}
    closure = set(given)
    while True:
        new = set()
        for ci in closure:
            for cj in closure:
                if strategy == 'unit' and len(ci) != 1 and len(cj) != 1:
                    continue
                if strategy == 'input' and ci not in given and cj not in given:
                    continue
                for r in pl_resolve(ci, cj):
                    if not r:
                        return True, closure | {r}
                    if not is_tautology(r) and r not in closure:
                        new.add(r)
        if not new:
            return False, closure
        closure |= new

def counterexample() -> list[str]:
    # unsatisfiable, but no clause is a unit clause: unit resolution cannot even start
    return ['P | Q', 'P | ~Q', '~P | R', '~P | ~R']
'''

HINTS = [
    'Same loop as PL-RESOLUTION (problem 40), with a `continue` that skips the pairs the strategy forbids.',
    'Input: remember the starting set `given`; a pair is allowed if `ci in given or cj in given`.',
    'Counterexample: unit resolution needs a unit clause to start. Can you write an unsatisfiable set of clauses '
    'with two literals each? Think of all four combinations of signs of $P$ and $Q$ — or the official one with $R$.',
]

EXPLANATION = r"""
**31 Aug 2026.** Input resolution saturates at $\{1, 2, 3, 4, A, B, \neg A, \neg B\}$ without ⊥: resolving a two-literal
input clause with a unit gives a unit (or a tautology), never the empty clause, and ⊥ would need $A$ with $\neg A$ —
two **derived** clauses. Yet $KB \models A \wedge B$ (unrestricted resolution finds ⊥ at once). **Model answer (Q2):**
"Input resolution is not complete in general: here $A$ and $\neg A$ would give the empty clause, but neither is an input
clause. It is complete only for Horn clauses, and $A \vee B$ is not Horn."

**14 Jul 2022, Q3.** "The unit resolution strategy is not complete in general: $P \vee Q$, $P \vee \neg Q$, $\neg P \vee R$,
$\neg P \vee \neg R$ is unsatisfiable, but no pair can be resolved because there is no unit clause." The same set also
defeats input resolution (test below).

**18 Jan 2023, Q3** ("can unit resolution establish $KB \models B$?"): **yes**, because the KB is made of **Horn
clauses** (definite clauses $\neg A \vee B$, …, $H$; the negated query $\neg B$ is a goal clause), and on Horn clauses
unit resolution and input resolution are complete. Intuition: on Horn clauses unit resolution behaves like forward
chaining (each fact cancels a premise), and input resolution like backward chaining from the negated query.
"""

ENTRY = 'saturate'


def _cls(*cs):
    return [clause(c) for c in cs]


_AUG26 = _cls('A | B', 'A | ~B', '~A | B', '~A | ~B')
_JUL22CX = _cls('P | Q', 'P | ~Q', '~P | R', '~P | ~R')
_JUL22 = _cls('P', '~P | ~Q | R', '~S | Q', '~T | Q', 'T', '~R')
_JAN23 = _cls('~A | B', '~C | A', '~G | ~E | C', '~F | D', '~D | ~E | C', '~H | E', '~H | F', 'H', '~B')


def _closure(expected_found, expected=None):
    exp = None if expected is None else {clause(c) for c in expected}

    def check(got, *args):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (found_empty, closure).'
        found, closure = got
        if found is not expected_found:
            return False, f'found_empty should be {expected_found}.'
        if exp is not None and {frozenset(c) for c in closure} != exp:
            return False, 'closure should be {' + ', '.join(sorted(show_clause(c) for c in exp)) + '}'
        return True
    return check


def _counterexample(got):
    try:
        cls = [clause(c) for c in got]
    except (ValueError, TypeError, AttributeError) as e:
        return False, str(e)
    if not cls:
        return False, 'Return a non-empty list of clauses.'
    if satisfiable([clause_formula(c) for c in cls]):
        return False, 'Your clauses are satisfiable: a counterexample must be unsatisfiable.'
    found, _ = _ref_saturate(cls, 'unit')
    return (not found, 'Unit resolution does derive ⊥ from your clauses: not a counterexample.')


def _ref_saturate(clauses, strategy):
    given = {c for c in clauses if not is_tautology(c)}
    closure = set(given)
    while True:
        new = {r for ci in closure for cj in closure
               if not (strategy == 'unit' and len(ci) != 1 and len(cj) != 1)
               and not (strategy == 'input' and ci not in given and cj not in given)
               for r in pl_resolve(ci, cj) if not is_tautology(r)} - closure
        if frozenset() in new:
            return True, closure | new
        if not new:
            return False, closure
        closure |= new


TESTS = [
    Test('31 Aug 2026: unrestricted resolution finds ⊥', args=(_AUG26, None), check=_closure(True),
         show='A∨B, A∨¬B, ¬A∨B, ¬A∨¬B; strategy None'),
    Test('31 Aug 2026: input resolution saturates without ⊥', args=(_AUG26, 'input'),
         check=_closure(False, ['A | B', 'A | ~B', '~A | B', '~A | ~B', 'A', 'B', '~A', '~B']),
         show='same clauses; strategy input'),
    Test('31 Aug 2026: unit resolution cannot start', args=(_AUG26, 'unit'),
         check=_closure(False, ['A | B', 'A | ~B', '~A | B', '~A | ~B']), show='same clauses; strategy unit'),
    Test('14 Jul 2022: unit resolution proves R (Horn KB)', args=(_JUL22, 'unit'), check=_closure(True),
         show='P, ¬P∨¬Q∨R, ¬S∨Q, ¬T∨Q, T, ¬R; unit'),
    Test('14 Jul 2022: input resolution proves R (Horn KB)', args=(_JUL22, 'input'), check=_closure(True),
         show='same; input'),
    Test('18 Jan 2023: unit resolution proves B (Horn KB)', args=(_JAN23, 'unit'), check=_closure(True),
         show='KB of 18 Jan 2023 + ¬B; unit'),
    Test('18 Jan 2023: input resolution proves B (Horn KB)', args=(_JAN23, 'input'), check=_closure(True),
         show='KB of 18 Jan 2023 + ¬B; input'),
    Test('official counterexample also defeats input resolution', args=(_JUL22CX, 'input'), check=_closure(False),
         show='P∨Q, P∨¬Q, ¬P∨R, ¬P∨¬R; input'),
    Test('14 Jul 2022 Q3: your counterexample for unit resolution', call=lambda sol: sol.counterexample(),
         check=_counterexample, show='counterexample()'),
]
