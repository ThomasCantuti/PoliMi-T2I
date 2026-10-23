from harness import Test
from csp_lib import australia, queens, is_solution

TITLE = 'Backtracking + forward checking + MRV: how much do they save?'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['backtracking', 'forward checking', 'MRV', 'n-queens', 'node count']

STATEMENT = r"""
Combine the pieces: backtracking that **carries the current domains**, runs **forward checking** after each
assignment, and picks the next variable with **MRV** (+ degree, + `csp.variables` order).

```text
BT(assignment, domains):
    if assignment is complete: return assignment
    var <- SELECT-UNASSIGNED-VARIABLE(csp, domains, assignment)       # MRV + degree
    for each value in domains[var]:                                    # current domain, in order
        add {var = value} to assignment                                # count it!
        new <- FORWARD-CHECKING(csp, domains, var, value, assignment)
        if no unassigned variable has an empty domain in new:
            result <- BT(assignment, new);  if result != failure: return result
        remove {var = value} from assignment
    return failure
```

Values left in `domains[var]` are already consistent with the assignment (forward checking removed the others),
so no `is_consistent` call is needed.

Return `(solution or None, n_assignments)` where `n_assignments` counts every *add {var = value}*.
The course versions are available: `from csp_lib import forward_checking, select_unassigned_variable`.

Plain backtracking (problem 20) needs **113** assignments for 8 queens and **199 635** for 20 queens.
How many do you need?
"""

STARTER = '''from typing import Any
from csp_lib import CSP, forward_checking, select_unassigned_variable

def fc_mrv_search(csp: CSP) -> tuple[dict[str, Any] | None, int]:
    """Return (solution or None, number of assignments)."""
    count = 0

    def bt(assignment: dict[str, Any], domains: dict[str, list]) -> dict[str, Any] | None:
        nonlocal count
        # TODO
        return None

    return bt({}, {v: list(d) for v, d in csp.domains.items()}), count
'''

SOLUTION = '''from typing import Any
from csp_lib import CSP, forward_checking, select_unassigned_variable

def fc_mrv_search(csp: CSP) -> tuple[dict[str, Any] | None, int]:
    """Return (solution or None, number of assignments)."""
    count = 0

    def bt(assignment: dict[str, Any], domains: dict[str, list]) -> dict[str, Any] | None:
        nonlocal count
        if len(assignment) == len(csp.variables):
            return dict(assignment)
        var = select_unassigned_variable(csp, domains, assignment)
        for value in domains[var]:
            assignment[var] = value
            count += 1
            new = forward_checking(csp, domains, var, value, assignment)
            if all(new[v] for v in csp.variables if v not in assignment):
                result = bt(assignment, new)
                if result is not None:
                    return result
            del assignment[var]
        return None

    return bt({}, {v: list(d) for v, d in csp.domains.items()}), count
'''

HINTS = [
    'Same skeleton as problem 20, but `bt` also receives the current `domains`, and the variable comes from `select_unassigned_variable(csp, domains, assignment)`.',
    'After `assignment[var] = value; count += 1`, compute `new = forward_checking(csp, domains, var, value, assignment)`. '
    'Recurse with `new` only if `all(new[v] for v in csp.variables if v not in assignment)`.',
    'Because `forward_checking` returns a **new** dict, undoing is just `del assignment[var]`: the parent\'s `domains` were never touched.',
]

EXPLANATION = r"""
Assignments needed to find the first solution of n-queens:

| n | plain backtracking | + forward checking (static order) | + FC + MRV |
|---|---|---|---|
| 8 | 113 | 88 | **75** |
| 16 | 10 052 | 7 560 | **44** |
| 20 | 199 635 | 145 151 | **145** |
| 50 | (hopeless) | (hopeless) | **2 068** |

Two lessons:
1. **Forward checking alone** saves only a constant factor here: it detects a dead variable earlier, but with
   a static order the search still has to *reach* the bad region to backtrack out of it.
2. **FC + MRV** is a game changer: FC keeps the domain sizes up to date, and MRV immediately jumps on the
   variable with 0 or 1 values left – a forced move or an instant failure. The two heuristics need each
   other: MRV is blind without filtering, and filtering is wasted if you don't use its information.

Each node is more expensive ($O(n s d)$ for FC, plus the MRV scan), but the tree shrinks by orders of
magnitude. The next step (problem 80) is to also run **AC-3** at every node.
"""

ENTRY = 'fc_mrv_search'


def _check(expected_count, expected_sol=None, solvable=True, plain=None):
    def check(got, csp):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (solution, n_assignments).'
        sol, count = got
        if not solvable:
            if sol is not None:
                return False, 'No solution exists: return None.'
        elif not is_solution(csp, sol):
            return False, 'The returned assignment is not a complete, consistent solution.'
        elif expected_sol is not None and sol != expected_sol:
            return False, f'Valid, but expected the solution {expected_sol} (MRV, then degree, then csp.variables order; values in domain order).'
        if count != expected_count:
            extra = f' (plain backtracking: {plain})' if plain else ''
            return False, (f'Expected {expected_count} assignments{extra}, you counted {count}. Count +1 for every value you assign, '
                           'pick variables with MRV + degree, and recurse only if no unassigned domain is empty.')
        return True
    return check


TESTS = [
    Test('Australia', args=(australia(),),
         check=_check(7, {'SA': 'R', 'NT': 'G', 'Q': 'B', 'NSW': 'G', 'WA': 'B', 'V': 'B', 'T': 'R'}),
         show='australia(): SA first (degree), then MRV'),
    Test('Australia with 2 colors', args=(australia('RG'),), check=_check(4, solvable=False, plain=10),
         show="australia('RG'): plain backtracking needed 10"),
    Test('4-queens', args=(queens(4),), check=_check(8, {'X1': 2, 'X2': 4, 'X3': 1, 'X4': 3}), show='queens(4)'),
    Test('8-queens', args=(queens(8),), check=_check(75, plain=113), show='queens(8)'),
    Test('16-queens', args=(queens(16),), check=_check(44, plain=10052), show='queens(16)'),
    Test('50-queens', args=(queens(50),), check=_check(2068), show='queens(50): out of reach for plain backtracking',
         timeout=10),
    Test('20-queens', args=(queens(20),), check=_check(145, plain=199635), show='queens(20)', timeout=10),
]
