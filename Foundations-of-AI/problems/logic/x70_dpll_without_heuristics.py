from harness import Test
from logic_lib import check_dpll, dpll_table

TITLE = 'Exam · DPLL with the heuristics switched off (Feb 2022, Jul 2026)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'DPLL', 'Jul 2026', 'Feb 2022', 'heuristics', 'pure symbol', 'unit clause']

STATEMENT = r"""
*Written exams of 17 Feb 2022 (Q1–Q2, 8 points) and 8 Jul 2026 (Q2–Q3).* Same step format and checker as
problem x60 (`'pure L'`, `'unit L'`, `'split L'`, `'backtrack'`), but some heuristics are **forbidden**: a
heuristic step that is switched off is rejected, and when no **allowed** heuristic applies you must split.

**17 Feb 2022**, KB: $\neg p \vee \neg q$, $\neg s \vee t$, $\neg t \vee p$, $s$, $\neg s \vee u$, $\neg u \vee q$.
"We want to check whether this KB is satisfiable."
- `feb22_no_pure()` → `(steps, answer)`: Q1, "use the DPLL algorithm **without the pure symbol heuristic**… report the
  steps of the computation and the final answer".
- `feb22_first_two()` → `steps`: Q2, "without the pure symbol **and** the unit clause heuristics… report the **first
  two steps**".

**8 Jul 2026**, the KB of problem x60 (`¬A ∨ B ∨ C, A ∨ ¬B, A ∨ ¬C, ¬B ∨ D, ¬C ∨ E, ¬D ∨ F, ¬E ∨ F, ¬F ∨ G, ¬G ∨ H, ¬H`).
- `jul26_no_unit()` → `steps`: Q2, "the DPLL algorithm **cannot use the unit clause heuristic**. Report the
  computations up to the third step (up to when you make the third assignment)".
- `jul26_no_heuristics()` → `steps`: Q3, "**cannot use any heuristic**", first three steps.
"""

STARTER = '''def feb22_no_pure():
    return [], 'SAT'

def feb22_first_two():
    return []

def jul26_no_unit():
    return []

def jul26_no_heuristics():
    return []
'''

SOLUTION = '''def feb22_no_pure():
    # s is a unit clause; then t and u become units, t forces p, p forces ~q, and u needs q
    return ['unit s', 'unit t', 'unit p', 'unit ~q', 'unit u'], 'UNSAT'

def feb22_first_two():
    return ['split p', 'split q']

def jul26_no_unit():   # official solution: no pure symbol in these states, so split (any literal)
    return ['split ~H', 'split ~G', 'split ~F']

def jul26_no_heuristics():   # official solution
    return ['split ~H', 'split ~G', 'split ~F']
'''

HINTS = [
    'Feb 2022 Q1: the KB contains the unit clause $s$. Follow the cascade of unit clauses until a clause becomes false.',
    'Without heuristics every step is a split, on any unassigned symbol and with either value first.',
    'Jul 2026 Q2: unit clauses are forbidden but pure symbols are allowed — check that none exists before each split. '
    'The official solution splits on $\\neg H$, $\\neg G$, $\\neg F$ (the literals the unit clauses would have forced).',
]

EXPLANATION = r"""
**17 Feb 2022** (no official solution is available for this logic problem; this is the computation with the course
rules). Q1: there is no pure symbol anyway; unit $s$ makes $\neg s \vee t$ and $\neg s \vee u$ unit; $t$ forces $p$
($\neg t \vee p$), $p$ forces $\neg q$ ($\neg p \vee \neg q$), and then $u$ makes $\neg u \vee q$ false: **unsatisfiable**, no split
needed. Q2: two splits, e.g. $p$ then $q$ (then $\neg p \vee \neg q$ is already false). "Do you expect the same final answer?"
**Yes**: the heuristics only avoid exploring assignments that cannot lead to a model; DPLL without them is still
sound and complete, it just explores more of the $2^5$ assignments.

**8 Jul 2026, Q4** — official model answer: "The final answer will be the same because the DPLL algorithm will, in
all cases, systematically explore the space of possible assignments (heuristics just avoid exploring some parts of
this space that will for sure not provide a solution). In the case of Question 1 the computational effort is
definitely smaller because the algorithm does not have to backtrack and check all the splits ($\neg\alpha$ and then
$\alpha$)." (Why can this be claimed? The KB is satisfiable, and with unit clauses DPLL reaches the model without a
single split; without them, a split with the wrong value first costs a whole failed subtree.)

Note that "first three steps" without heuristics depend on the split choices: the official solution splits on
$\neg H$, $\neg G$, $\neg F$; AIMA's pseudocode would split on $A$, $B$, $C$ (first symbol, $true$ first). Both are legal.
"""

ENTRY = 'feb22_no_pure'

_FEB22 = ['~p | ~q', '~s | t', '~t | p', 's', '~s | u', '~u | q']
_JUL26 = ['~A | B | C', 'A | ~B', 'A | ~C', '~B | D', '~C | E', '~D | F', '~E | F', '~F | G', '~G | H', '~H']


def _prefix(clauses, n, **flags):
    def check(steps):
        if not isinstance(steps, (list, tuple)) or len(steps) != n:
            return False, f'Return exactly the first {n} steps.'
        ok, msg = check_dpll(clauses, steps, complete=False, **flags)
        return (True, dpll_table(clauses, steps)) if ok else (False, msg)
    return check


def _full(got):
    if not (isinstance(got, tuple) and len(got) == 2):
        return False, 'Return a pair (steps, answer).'
    ok, msg = check_dpll(_FEB22, got[0], got[1], pure=False)
    return (True, dpll_table(_FEB22, got[0])) if ok else (False, msg)


TESTS = [
    Test('17 Feb 2022 Q1: without pure symbols', call=lambda sol: sol.feb22_no_pure(), check=_full, show='feb22_no_pure()'),
    Test('17 Feb 2022 Q2: no heuristics, first two steps', call=lambda sol: sol.feb22_first_two(),
         check=_prefix(_FEB22, 2, pure=False, unit=False), show='feb22_first_two()'),
    Test('8 Jul 2026 Q2: no unit clauses, first three steps', call=lambda sol: sol.jul26_no_unit(),
         check=_prefix(_JUL26, 3, unit=False), show='jul26_no_unit()'),
    Test('8 Jul 2026 Q3: no heuristics, first three steps', call=lambda sol: sol.jul26_no_heuristics(),
         check=_prefix(_JUL26, 3, pure=False, unit=False), show='jul26_no_heuristics()'),
]
