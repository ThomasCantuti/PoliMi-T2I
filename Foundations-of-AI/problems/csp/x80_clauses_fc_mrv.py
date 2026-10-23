from harness import Test

TITLE = 'Exam · Feb 2024 · Propositional clauses as a CSP: FC + MRV + degree'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Feb 2024', 'formulation', 'forward checking', 'MRV', 'degree heuristic', 'satisfiability']

STATEMENT = r"""
*Written exam of 6 February 2024 — Constraint Satisfaction Problems and Logic (8 points), Questions 1–2.*

Consider the problem of satisfying the following set of clauses in propositional logic:

$$A \lor B,\quad B \lor \lnot E,\quad \lnot C \lor \lnot D,\quad \lnot C \lor \lnot E,\quad \lnot D \lor E$$

1. Formulate a CSP that represents this satisfiability problem: variables, domains, constraints.
2. Solve it with **backtracking + forward checking**, **MRV** as the primary heuristic, the **degree** heuristic as
   the secondary one (it counts the constraints with **unassigned** variables), and **alphabetical order** for any
   further tie. Values are tried in the order **t, f**. Report the tree and the solution.

Write it in code, for any set of clauses with exactly two literals over two different symbols. A literal is a
string: `'A'` or `'~A'` (= ¬A).

- `clauses_csp(clauses)` → a `csp_lib.CSP`: variables = the symbols in **alphabetical** order, domains `['t', 'f']`,
  one binary constraint per pair of symbols (several clauses on the same pair become a single constraint that
  requires **all** of them), `neighbors` = the symbols sharing a clause.
- `solve_clauses(clauses)` → `(solution or None, trace)`, where `trace` lists every assignment made, in order,
  as `'X=v'` (including those later undone). Use the course helpers `forward_checking` and
  `select_unassigned_variable` (MRV, then degree, then `csp.variables` order); recurse only if no unassigned
  domain is empty.

The exam's answer: tree {} → E=t → B=t → C=f → A=t → D=t, solution A = t, B = t, C = f, D = t, E = t.
"""

STARTER = '''from typing import Any
from csp_lib import CSP, forward_checking, select_unassigned_variable

def clauses_csp(clauses: list[tuple[str, str]]) -> CSP:
    """One variable per symbol (alphabetical), domains ['t', 'f'], one constraint per pair of symbols."""
    # TODO: for a literal 'X' the satisfying value is 't', for '~X' it is 'f'
    return CSP([], {}, {}, lambda A, a, B, b: True)

def solve_clauses(clauses: list[tuple[str, str]]) -> tuple[dict[str, Any] | None, list[str]]:
    """Backtracking + forward checking + MRV/degree/alphabetical; values t then f."""
    csp = clauses_csp(clauses)
    trace: list[str] = []
    # TODO
    return None, trace
'''

SOLUTION = '''from typing import Any
from csp_lib import CSP, forward_checking, select_unassigned_variable

def clauses_csp(clauses: list[tuple[str, str]]) -> CSP:
    """One variable per symbol (alphabetical), domains ['t', 'f'], one constraint per pair of symbols."""
    def lit(l: str) -> tuple[str, str]:
        return (l[1:], 'f') if l.startswith('~') else (l, 't')     # (symbol, value that makes it true)

    variables = sorted({lit(l)[0] for clause in clauses for l in clause})
    allowed: dict[tuple[str, str], list[tuple[str, str]]] = {}        # (X, Y) -> clauses as (x_true, y_true)
    for a, b in clauses:
        (X, x), (Y, y) = lit(a), lit(b)
        allowed.setdefault((X, Y), []).append((x, y))
        allowed.setdefault((Y, X), []).append((y, x))
    neighbors = {v: sorted(Y for (X, Y) in allowed if X == v) for v in variables}

    def constraints(A, a, B, b):
        return all(a == x or b == y for x, y in allowed[(A, B)])

    return CSP(variables, {v: ['t', 'f'] for v in variables}, neighbors, constraints)

def solve_clauses(clauses: list[tuple[str, str]]) -> tuple[dict[str, Any] | None, list[str]]:
    """Backtracking + forward checking + MRV/degree/alphabetical; values t then f."""
    csp = clauses_csp(clauses)
    trace: list[str] = []

    def bt(assignment, domains):
        if len(assignment) == len(csp.variables):
            return dict(assignment)
        var = select_unassigned_variable(csp, domains, assignment)
        for value in domains[var]:
            assignment[var] = value
            trace.append(f'{var}={value}')
            new = forward_checking(csp, domains, var, value, assignment)
            if all(new[v] for v in csp.variables if v not in assignment):
                result = bt(assignment, new)
                if result is not None:
                    return result
            del assignment[var]
        return None

    return bt({}, {v: list(d) for v, d in csp.domains.items()}), trace
'''

HINTS = [
    'A clause l1 ∨ l2 over X and Y forbids exactly one pair of values: the one that makes both literals false. '
    'The constraint between X and Y is "for every clause on this pair, X takes its satisfying value or Y does".',
    'Store the clauses per ordered pair (X, Y) **and** (Y, X), with the values swapped: `csp.constraints` is called in both directions.',
    'Variables sorted alphabetically: `select_unassigned_variable` breaks the last tie with the `csp.variables` order.',
    'The search is problem 70 plus a trace: `trace.append(f"{var}={value}")` right after each assignment.',
]

EXPLANATION = r"""
**Formulation (Question 1).** Variables = the propositional symbols A, B, C, D, E; domains {t, f}; one constraint
per clause, "the clause is true" — e.g. $B \lor \lnot E$ only forbids (B = f, E = t). Every clause has two literals,
so every constraint is **binary** and the constraint graph has the edges A–B, B–E, C–D, C–E, D–E.

**Search (Question 2).**

| node | choice | domains after forward checking |
|---|---|---|
| {} | all domains have 2 values → degree: E has 3 constraints (B, C, D), B, C, D 2, A 1 → **E** | |
| E = t | | B = {t} ($B \lor \lnot E$), C = {f} ($\lnot C \lor \lnot E$), D = {t, f}, A = {t, f} |
| B = t | MRV tie B / C (1 value), degree tie (1 unassigned neighbour each) → alphabetical **B** | A = {t, f} |
| C = f | MRV: C has 1 value | D = {t, f} |
| A = t | A, D: 2 values, degree 0 → alphabetical | |
| D = t | | |

Solution A = t, B = t, C = f, D = t, E = t — the official one, with no backtracking.

Note how forward checking performs **unit propagation** for free: once E = t, the clauses $B \lor \lnot E$ and
$\lnot C \lor \lnot E$ become unit clauses and FC leaves B and C a single value. The other questions of this exam
(why AC-3 removes nothing here, CSP vs DPLL) are in the quiz *Short questions on arc consistency and filtering*.
"""

ENTRY = 'solve_clauses'

_EXAM = [('A', 'B'), ('B', '~E'), ('~C', '~D'), ('~C', '~E'), ('~D', 'E')]
_SAME_PAIR = [('C', 'A'), ('F', '~C'), ('E', '~B'), ('E', 'B'), ('D', '~F'), ('~D', '~E')]
_UNSAT2 = [('A', 'B'), ('A', '~B'), ('~A', 'B'), ('~A', '~B')]
_UNSAT6 = [('~F', '~D'), ('~E', '~A'), ('~C', 'F'), ('~E', 'C'), ('D', 'B'), ('F', 'E'), ('~B', 'D')]


def _expect(sol, trace):
    def check(got, clauses):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (solution, trace).'
        s, t = got
        if list(t) != trace:
            return False, (f'Trace {list(t)}, expected {trace}. Check MRV (forward-checked domain sizes), then degree '
                           '(unassigned neighbours), then alphabetical order; values t before f.')
        if s != sol:
            return False, f'Solution {s}, expected {sol}.'
        return True
    return check


def _graph(sol):
    csp = sol.clauses_csp(_EXAM)
    return (csp.variables, {v: sorted(csp.neighbors[v]) for v in csp.variables},
            [csp.constraints('B', b, 'E', e) for b in 'tf' for e in 'tf'],
            [csp.constraints('E', e, 'B', b) for b in 'tf' for e in 'tf'])


TESTS = [
    Test('clauses_csp: variables, neighbours, B ∨ ¬E in both directions', call=_graph,
         expected=(['A', 'B', 'C', 'D', 'E'],
                   {'A': ['B'], 'B': ['A', 'E'], 'C': ['D', 'E'], 'D': ['C', 'E'], 'E': ['B', 'C', 'D']},
                   [True, True, False, True], [True, True, False, True]),
         show='exam clauses; constraint B–E for (B,E) = tt, tf, ft, ff'),
    Test('the exam (Feb 2024)', args=(_EXAM,),
         check=_expect({'A': 't', 'B': 't', 'C': 'f', 'D': 't', 'E': 't'}, ['E=t', 'B=t', 'C=f', 'A=t', 'D=t']),
         show='A∨B, B∨¬E, ¬C∨¬D, ¬C∨¬E, ¬D∨E'),
    Test('two clauses on the same pair, with backtracking', args=(_SAME_PAIR,),
         check=_expect({'A': 't', 'B': 't', 'C': 'f', 'D': 'f', 'E': 't', 'F': 'f'},
                       ['C=t', 'F=t', 'D=t', 'E=f', 'C=f', 'A=t', 'D=t', 'E=f', 'D=f', 'F=f', 'B=t', 'E=t']),
         show='C∨A, F∨¬C, E∨¬B, E∨B, D∨¬F, ¬D∨¬E'),
    Test('unsatisfiable: all four clauses on A, B', args=(_UNSAT2,), check=_expect(None, ['A=t', 'A=f']),
         show='A∨B, A∨¬B, ¬A∨B, ¬A∨¬B'),
    Test('unsatisfiable, six symbols', args=(_UNSAT6,),
         check=_expect(None, ['E=t', 'C=t', 'F=t', 'D=f', 'E=f', 'F=t', 'D=f']),
         show='¬F∨¬D, ¬E∨¬A, ¬C∨F, ¬E∨C, D∨B, F∨E, ¬B∨D'),
]
