from harness import Test
from csp_lib import australia, queens, is_solution

TITLE = 'Backtracking search (and counting its work)'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['backtracking', 'depth-first search', 'variable ordering']

STATEMENT = r"""
Implement **BACKTRACKING-SEARCH** exactly as on the slides (p. 275):

```text
function BACKTRACK(csp, assignment):
    if assignment is complete: return assignment
    var <- SELECT-UNASSIGNED-VARIABLE(csp, assignment)
    for each value in ORDER-DOMAIN-VALUES(csp, var, assignment):
        if value is consistent with assignment:
            add {var = value} to assignment
            result <- BACKTRACK(csp, assignment)
            if result != failure: return result
            remove {var = value} from assignment
    return failure
```

Use the **static** orders: the first unassigned variable of `csp.variables`, and the values in the order
of `csp.domains[var]`. Use `None` for *failure*.

Return a pair `(solution, n_assignments)`:
- `solution`: a dict `{var: value}` (a **copy**, since you remove values while backtracking), or `None`;
- `n_assignments`: how many times you executed *add {var = value}* (consistent values only).

`is_consistent` from the previous problem is available: `from csp_lib import is_consistent`.

**Example:** `backtracking_search(australia())` →
`({'WA': 'R', 'NT': 'G', 'Q': 'R', 'NSW': 'G', 'V': 'R', 'SA': 'B', 'T': 'R'}, 7)`: no backtracking at all.
"""

STARTER = '''from typing import Any
from csp_lib import CSP, is_consistent

def backtracking_search(csp: CSP) -> tuple[dict[str, Any] | None, int]:
    """Return (solution dict or None, number of assignments made)."""
    count = 0

    def backtrack(assignment: dict[str, Any]) -> dict[str, Any] | None:
        nonlocal count
        # TODO: complete? -> return a copy
        # TODO: pick the first unassigned variable of csp.variables
        # TODO: try its values in domain order
        return None

    return backtrack({}), count
'''

SOLUTION = '''from typing import Any
from csp_lib import CSP, is_consistent

def backtracking_search(csp: CSP) -> tuple[dict[str, Any] | None, int]:
    """Return (solution dict or None, number of assignments made)."""
    count = 0

    def backtrack(assignment: dict[str, Any]) -> dict[str, Any] | None:
        nonlocal count
        if len(assignment) == len(csp.variables):
            return dict(assignment)
        var = next(v for v in csp.variables if v not in assignment)
        for value in csp.domains[var]:
            if is_consistent(csp, var, value, assignment):
                assignment[var] = value
                count += 1
                result = backtrack(assignment)
                if result is not None:
                    return result
                del assignment[var]
        return None

    return backtrack({}), count
'''

HINTS = [
    'It is a recursive depth-first search where a "node" is a partial assignment and each level assigns **one** variable.',
    'Base case: `len(assignment) == len(csp.variables)` → `return dict(assignment)` (a copy!).',
    '`var = next(v for v in csp.variables if v not in assignment)`; for each `value in csp.domains[var]` that '
    '`is_consistent(...)`: assign, `count += 1`, recurse, return the result if not `None`, else `del assignment[var]`.',
]

EXPLANATION = r"""
Backtracking is **depth-first search** specialized for CSPs with two principles (p. 273):
1. **one variable per level** – assignments are commutative, so fixing the order shrinks the tree
   from $n!\,d^n$ leaves to $d^n$;
2. **check constraints as you go** – an inconsistent partial assignment is never extended.

What the counts tell you:
- Australia in the order `WA, NT, Q, NSW, V, SA, T`: **7** assignments, zero backtracking.
  In the slide order `WA, NT, SA, T, NSW, V, Q` (p. 263): **9** – `NSW=R` leaves no color for Q,
  which is discovered only when Q's turn comes. **Variable order matters.**
- With only two colors there is no solution (WA, NT, SA form a triangle), yet plain backtracking
  wanders through **10** assignments before giving up – it cannot "see" the triangle.
- n-queens: 113 assignments for 8 queens, 10 052 for 16, ~200 000 for 20. Exponential growth:
  the search notices a dead end only when it **reaches** the dead variable.

Next problems: **forward checking** and **arc consistency** detect those dead ends earlier, and
**MRV** picks the variable that is about to die first.
"""

ENTRY = 'backtracking_search'


def _check(expected_sol, expected_count, why=''):
    def check(got, csp):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (solution, n_assignments).'
        sol, count = got
        if expected_sol is None:
            if sol is not None:
                return False, 'This CSP has no solution: return None as the solution.'
        elif not is_solution(csp, sol):
            return False, 'The returned assignment is not a complete, consistent solution.'
        elif sol != expected_sol:
            return False, (f'Valid, but not the first solution in the static orders. Expected {expected_sol}. '
                           'Pick the FIRST unassigned variable of csp.variables and try values in domain order.')
        if count != expected_count:
            return False, (f'Expected {expected_count} assignments, you counted {count}. Count +1 each time you '
                           f'add var=value to the assignment (consistent values only). {why}')
        return True
    return check


_SLIDE_ORDER = australia(order=('WA', 'NT', 'SA', 'T', 'NSW', 'V', 'Q'))
_Q8 = {f'X{i}': r for i, r in enumerate([1, 5, 8, 6, 3, 7, 2, 4], 1)}

TESTS = [
    Test('Australia, default order', args=(australia(),),
         check=_check({'WA': 'R', 'NT': 'G', 'Q': 'R', 'NSW': 'G', 'V': 'R', 'SA': 'B', 'T': 'R'}, 7),
         show='australia()  order WA, NT, Q, NSW, V, SA, T'),
    Test('Australia, slide order (p. 263)', args=(_SLIDE_ORDER,),
         check=_check({'WA': 'R', 'NT': 'G', 'SA': 'B', 'T': 'R', 'NSW': 'G', 'V': 'R', 'Q': 'R'}, 9,
                      'Here NSW=R, V=G is undone because Q has no color left.'),
         show='order WA, NT, SA, T, NSW, V, Q'),
    Test('Australia with 2 colors (no solution)', args=(australia('RG'),), check=_check(None, 10),
         show="australia('RG')"),
    Test('4-queens', args=(queens(4),), check=_check({'X1': 2, 'X2': 4, 'X3': 1, 'X4': 3}, 8), show='queens(4)'),
    Test('3-queens (no solution)', args=(queens(3),), check=_check(None, 5), show='queens(3)'),
    Test('8-queens', args=(queens(8),), check=_check(_Q8, 113), show='queens(8)'),
    Test('16-queens: exponential growth', args=(queens(16),),
         check=lambda got, csp: (isinstance(got, tuple) and is_solution(csp, got[0]) and got[1] == 10052,
                                 'Expected a solution after exactly 10052 assignments.'),
         show='queens(16)', timeout=10),
]
