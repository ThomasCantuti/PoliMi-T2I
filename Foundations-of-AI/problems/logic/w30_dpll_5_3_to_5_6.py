from harness import Test
from logic_lib import check_dpll, dpll_table

TITLE = 'Exercise book 5.3–5.6 · DPLL runs'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['exercise book', 'DPLL', 'pure symbol', 'unit clause', 'satisfiability']

STATEMENT = r"""
*Exercise book, exercises 5.3 (DPLL part), 5.4, 5.5, 5.6:* "use the DPLL algorithm to find an assignment that
satisfies the formula or to show that such assignment does not exist." Same format and checker as problem x60:
each function returns `(steps, answer)` with steps `'pure L'`, `'unit L'`, `'split L'`, `'backtrack'` and answer
`'SAT'` / `'UNSAT'`. (The book calls the unit clause heuristic "One-Literal" and the pure symbol one
"Pure-Literal".)

- `ex53_1()` — 5.3 (2): $\Phi_1 \models \Phi_2$ by DPLL, i.e. refute $A \wedge (B \vee Q) \wedge (\neg A \vee \neg B) \wedge (\neg A \vee \neg Q)$
- `ex53_2()` — 5.3 (4): $\Phi_2 \models \Phi_1$, refute $A \wedge (A \vee Q) \wedge (A \vee B) \wedge (B \vee Q) \wedge (\neg A \vee \neg B) \wedge (\neg A \vee \neg Q)$
- `ex54()` — $(P \vee Q \vee \neg R) \wedge (P \vee \neg Q) \wedge \neg P \wedge R \wedge U$
- `ex55()` — $(P \vee Q) \wedge \neg Q \wedge (\neg P \vee Q \vee \neg R)$
- `ex56()` — $(P \vee Q) \wedge (P \vee \neg Q) \wedge (\neg P \vee Q) \wedge (\neg P \vee \neg R)$
"""

STARTER = '''def ex53_1():
    return [], 'UNSAT'

def ex53_2():
    return [], 'UNSAT'

def ex54():
    return [], 'UNSAT'

def ex55():
    return [], 'SAT'

def ex56():
    return [], 'SAT'
'''

SOLUTION = '''def ex53_1():
    return ['unit A', 'unit ~B', 'unit Q'], 'UNSAT'

def ex53_2():
    return ['unit A', 'unit ~B', 'unit Q'], 'UNSAT'

def ex54():
    return ['pure U', 'unit ~P', 'unit ~Q', 'unit ~R'], 'UNSAT'

def ex55():
    return ['pure ~R', 'pure P', 'pure ~Q'], 'SAT'

def ex56():   # as in the book: the split tries ~P first
    return ['pure ~R', 'split ~P', 'unit Q', 'backtrack', 'split P', 'pure Q'], 'SAT'
'''

HINTS = [
    'Before each step list the pure literals (one sign only among the clauses not yet true) and the unit clauses. '
    'If either list is non-empty, pick from it.',
    '5.4: $U$ appears only positively; $\\neg P$ is a unit clause. 5.5: $R$ appears only negated.',
    '5.6: after $\\neg R$ there is no pure symbol and no unit clause: split on $P$ (either value first).',
]

EXPLANATION = r"""
Book traces:

| exercise | steps | result |
|---|---|---|
| 5.3 (2) and (4) | One-Literal $A$, One-Literal $\neg B$, One-Literal $Q$ → {} | unsatisfiable: the entailment holds |
| 5.4 | Pure-Literal $U$, One-Literal $\neg P$, $\neg Q$, $\neg R$ → {} | unsatisfiable |
| 5.5 | Pure-Literal $\neg R$, $P$, $\neg Q$ | satisfiable, $\{P, \neg Q, \neg R\}$ |
| 5.6 | Pure-Literal $\neg R$, split on $P$: $\{\neg P, \neg R\}$ gives $Q \wedge \neg Q$, One-Literal $Q$ → {}; then $\{P, \neg R\}$, Pure-Literal $Q$ | satisfiable, $\{P, Q, \neg R\}$ |

Notes on the book's conventions: in 5.6 the split tries $\neg P$ **first** (AIMA tries $true$ first; both are
legal), and the last step is labelled Pure-Literal although $Q$ is also a unit clause. In 5.5 $\neg Q$ is a unit
clause from the start, but the book (like AIMA's pseudocode) applies the pure symbols first. In 5.4 $U$ is a
symbol that occurs in a single unit clause: it is pure and unit at once.

The book's title of the last part of 5.3 reads "$\Phi_1 \models \Phi_2$ by DPLL" twice: the second one is
$\Phi_2 \models \Phi_1$ (it refutes $\Phi_2 \wedge \neg\Phi_1$).
"""

ENTRY = 'ex54'

_CL = {
    'ex53_1': ['A', 'B | Q', '~A | ~B', '~A | ~Q'],
    'ex53_2': ['A', 'A | Q', 'A | B', 'B | Q', '~A | ~B', '~A | ~Q'],
    'ex54': ['P | Q | ~R', 'P | ~Q', '~P', 'R', 'U'],
    'ex55': ['P | Q', '~Q', '~P | Q | ~R'],
    'ex56': ['P | Q', 'P | ~Q', '~P | Q', '~P | ~R'],
}


def _check(fn):
    def check(got):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (steps, answer).'
        ok, msg = check_dpll(_CL[fn], got[0], got[1])
        return (True, dpll_table(_CL[fn], got[0])) if ok else (False, msg)
    return check


_NAMES = {'ex53_1': 'exercise 5.3 (2): Φ1 ⊨ Φ2', 'ex53_2': 'exercise 5.3 (4): Φ2 ⊨ Φ1', 'ex54': 'exercise 5.4',
          'ex55': 'exercise 5.5', 'ex56': 'exercise 5.6'}

TESTS = [Test(_NAMES[fn], call=lambda sol, fn=fn: getattr(sol, fn)(), check=_check(fn), show=f'{fn}()') for fn in _CL]
