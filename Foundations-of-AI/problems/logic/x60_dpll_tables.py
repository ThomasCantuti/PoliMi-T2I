from harness import Test
from logic_lib import check_dpll, dpll_table

TITLE = 'Exam · DPLL tables (2023–2026)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'DPLL', 'Jul 2026', 'Jan 2026', 'Sep 2025', 'Sep 2023', 'Jul 2023', 'pure symbol', 'unit clause']

STATEMENT = r"""
*Written exams of 10 Jul 2023 (Q3), 8 Sep 2023 (Q2), 8 Sep 2025 (Q1), 14 Jan 2026 (Q1) and 8 Jul 2026 (Q1).*
"Apply the DPLL algorithm … Report the steps." Write the step column of your table: each function returns
`(steps, answer)` where `steps` is a list of `'pure L'`, `'unit L'`, `'split L'`, `'backtrack'` (`L` = `'A'` or
`'~A'`) and `answer` is `'SAT'` or `'UNSAT'`.

The checker replays your steps with the course rules: when a pure symbol or a unit clause exists you must use
**one of them** (any one: the official solutions use different orders); otherwise split on any unassigned symbol,
either value first; after a false clause write `'backtrack'` and then the other value of the last split; stop as
soon as every clause is true (early termination). On success the test shows your table.

**`jul23()`** — 10 Jul 2023: "Assume that you are a POLIMI student and you study. Prove, using DPLL, that you pass
the exam." The clauses to refute ($KB + POLIMI + Study + \neg Pass$):
`~POLIMI | Smart,  ~Smart | ~Study | Pass,  ~Lucky | ~Smart | Pass,  ~Lucky | ~Study | Pass,  POLIMI,  Study,  ~Pass`

**`sep23()`** — 8 Sep 2023, "apply the classical DPLL algorithm we have seen in class":
$(a \vee \neg b) \wedge (a \vee c \vee \neg d) \wedge (\neg c \vee \neg e) \wedge (\neg c \vee e) \wedge (c \vee d)$

**`sep25()`** — 8 Sep 2025: $(A \vee B) \wedge (\neg A \vee \neg D) \wedge (C \vee D) \wedge (B \vee C) \wedge (A \vee \neg C) \wedge (\neg B \vee D) \wedge (\neg A \vee \neg C)$

**`jan26()`** — 14 Jan 2026: $X \vee Y \vee Z$, $X \vee Y \vee \neg Z$, $X \vee T \vee \neg Y$, $\neg T \vee X$, $\neg X \vee Y$, $\neg Y \vee Z$, $\neg Y \vee \neg Z$

**`jul26()`** — 8 Jul 2026: 1. $\neg A \vee B \vee C$ 2. $A \vee \neg B$ 3. $A \vee \neg C$ 4. $\neg B \vee D$ 5. $\neg C \vee E$
6. $\neg D \vee F$ 7. $\neg E \vee F$ 8. $\neg F \vee G$ 9. $\neg G \vee H$ 10. $\neg H$
"""

STARTER = '''def jul23():
    return [], 'UNSAT'

def sep23():
    return [], 'SAT'

def sep25():
    return [], 'SAT'

def jan26():
    return [], 'UNSAT'

def jul26():
    return [], 'SAT'
'''

SOLUTION = '''def jul23():   # official solution
    return ['pure ~Lucky', 'unit ~Pass', 'unit Study', 'unit POLIMI', 'unit Smart'], 'UNSAT'

def sep23():   # official solution
    return ['pure a', 'pure d', 'pure ~c'], 'SAT'

def sep25():   # official solution
    return ['split A', 'unit ~D', 'unit C', 'backtrack', 'split ~A', 'unit B', 'unit ~C', 'unit D'], 'SAT'

def jan26():   # official solution
    return ['split X', 'unit Y', 'unit Z', 'backtrack', 'split ~X', 'unit ~T', 'unit ~Y', 'unit Z'], 'UNSAT'

def jul26():   # official solution
    return ['unit ~H', 'unit ~G', 'unit ~F', 'unit ~E', 'unit ~D', 'unit ~C', 'unit ~B', 'unit ~A'], 'SAT'
'''

HINTS = [
    'At every row: first look for a unit clause (a clause reduced to one literal) or a pure symbol (one sign only '
    'among the clauses not yet true). Only when there is none, split.',
    'Jul 2023: $Lucky$ appears only negated; $POLIMI$, $Study$, $\\neg Pass$ are unit clauses from the start. '
    'Jul 2026: $\\neg H$ starts a chain of unit clauses that runs through the whole KB.',
    'Sep 2025 and Jan 2026 have no pure symbol and no unit clause at the root: split, propagate, and when a clause '
    'becomes ⊥ write `backtrack` and the opposite value of the split.',
]

EXPLANATION = r"""
The official tables (the solution reproduces them):

- **10 Jul 2023**: pure $\neg Lucky$, unit $\neg Pass$, unit $Study$, unit $POLIMI$, unit $Smart$ → the clause
  $\neg Smart \vee \neg Study \vee Pass$ becomes false: **unsatisfiable**, so $KB + POLIMI + Study \models Pass$ (refutation
  theorem). Pure first and then units is AIMA's order; the order among the units is free.
- **8 Sep 2023**: pure $a$, pure $d$, pure $\neg c$ → every clause true: **satisfiable**, model $\{a, d, \neg c\}$ + any
  value of $b$ and $e$ (early termination leaves them unassigned).
- **8 Sep 2025**: split $A$, unit $\neg D$, unit $C$ → ⊥ (clause $\neg A \vee \neg C$), backtrack to 0, split $\neg A$, unit $B$,
  unit $\neg C$, unit $D$ → **satisfiable**, model $\{\neg A, B, \neg C, D\}$. After $\neg A$ the symbol $D$ is also pure: AIMA's
  pseudocode (pure symbols first) would write pure $D$, pure $B$, pure $\neg C$ — same model; both are accepted.
- **14 Jan 2026**: split $X$, unit $Y$, unit $Z$ → ⊥; split $\neg X$, unit $\neg T$, unit $\neg Y$, unit $Z$ → ⊥: no split
  left, **unsatisfiable**.
- **8 Jul 2026**: units $\neg H, \neg G, \neg F, \neg E, \neg D, \neg C, \neg B, \neg A$ → **satisfiable**, every symbol false.
  The official solution picks $\neg E$ before $\neg D$ (both are units after $\neg F$); $\neg A$ at the end is both unit and pure.
"""

ENTRY = 'jul23'

_CLAUSES = {
    'jul23': ['~POLIMI | Smart', '~Smart | ~Study | Pass', '~Lucky | ~Smart | Pass', '~Lucky | ~Study | Pass',
              'POLIMI', 'Study', '~Pass'],
    'sep23': ['a | ~b', 'a | c | ~d', '~c | ~e', '~c | e', 'c | d'],
    'sep25': ['A | B', '~A | ~D', 'C | D', 'B | C', 'A | ~C', '~B | D', '~A | ~C'],
    'jan26': ['X | Y | Z', 'X | Y | ~Z', 'X | T | ~Y', '~T | X', '~X | Y', '~Y | Z', '~Y | ~Z'],
    'jul26': ['~A | B | C', 'A | ~B', 'A | ~C', '~B | D', '~C | E', '~D | F', '~E | F', '~F | G', '~G | H', '~H'],
}


def _check(fn):
    clauses = _CLAUSES[fn]

    def check(got):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (steps, answer).'
        steps, answer = got
        ok, msg = check_dpll(clauses, steps, answer)
        return (True, 'Your table:\n' + dpll_table(clauses, steps)) if ok else (False, msg)
    return check


TESTS = [
    Test('10 Jul 2023: KB + POLIMI + Study + ¬Pass', call=lambda sol: sol.jul23(), check=_check('jul23'), show='jul23()'),
    Test('8 Sep 2023: classical DPLL', call=lambda sol: sol.sep23(), check=_check('sep23'), show='sep23()'),
    Test('8 Sep 2025', call=lambda sol: sol.sep25(), check=_check('sep25'), show='sep25()'),
    Test('14 Jan 2026', call=lambda sol: sol.jan26(), check=_check('jan26'), show='jan26()'),
    Test('8 Jul 2026', call=lambda sol: sol.jul26(), check=_check('jul26'), show='jul26()'),
]
