from harness import Test
from csp_lib import CSP, AUSTRALIA_NEIGHBORS, australia, queens, different_values, is_solution

TITLE = 'Search + inference: the complete 4-queens example'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['backtracking', 'AC-3', 'forward checking', 'search vs inference', '4-queens']

STATEMENT = r"""
Implement the modified backtracking of slide p. 317, which interleaves **search** and **inference**:

```text
CSP-BACKTRACKING(A, var-domains)
    IF assignment A is complete THEN RETURN A
    run AC-3 and reduce var-domains of unassigned variables
    IF a variable has an empty domain THEN RETURN failure
    X <- choose a variable not in A
    D <- choose an order of values in the domain of X
    FOR EACH v in D DO
        add (X <- v) to A
        var-domains <- FORWARD-CHECKING(var-domains, X, v, A)
        IF no variable has an empty domain THEN
            result <- CSP-BACKTRACKING(A, var-domains)
            IF result != failure THEN RETURN result
        remove (X <- v) from A
    RETURN failure
```

Choose variables in the **static** order of `csp.variables` and values in the order of the current domain
(as in the slides: "heuristics do not help in this case").

Return `(solution or None, trace)` where `trace` is the list of `(variable, value)` pairs in the order they
were **added** to `A` – the edges of the search tree.

Available: `from csp_lib import forward_checking, ac3`. `ac3(csp, domains)` works **in place** and returns
`False` on an empty domain; that is safe here because every call receives its own fresh dict (a copy of
`csp.domains` at the root, the result of `forward_checking` below).

**The slide run (p. 304–315):** AC-3 removes nothing; X1=1 → FC → AC-3 empties X3 → backtrack;
X1=2 → FC → AC-3 leaves X2={4}, X3={1}, X4={3} → the rest is forced. Trace:
`[('X1', 1), ('X1', 2), ('X2', 4), ('X3', 1), ('X4', 3)]`.
"""

STARTER = '''from typing import Any
from csp_lib import CSP, forward_checking, ac3

def csp_backtracking(csp: CSP) -> tuple[dict[str, Any] | None, list[tuple]]:
    """Return (solution or None, trace of (var, value) assignments)."""
    trace: list[tuple[str, Any]] = []

    def bt(assignment: dict[str, Any], domains: dict[str, list]) -> dict[str, Any] | None:
        # TODO: follow the slide pseudocode line by line
        return None

    return bt({}, {v: list(d) for v, d in csp.domains.items()}), trace
'''

SOLUTION = '''from typing import Any
from csp_lib import CSP, forward_checking, ac3

def csp_backtracking(csp: CSP) -> tuple[dict[str, Any] | None, list[tuple]]:
    """Return (solution or None, trace of (var, value) assignments)."""
    trace: list[tuple[str, Any]] = []

    def bt(assignment: dict[str, Any], domains: dict[str, list]) -> dict[str, Any] | None:
        if len(assignment) == len(csp.variables):
            return dict(assignment)
        if not ac3(csp, domains):
            return None
        var = next(v for v in csp.variables if v not in assignment)
        for value in domains[var]:
            assignment[var] = value
            trace.append((var, value))
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
    'Translate the pseudocode literally: AC-3 at the top of each call, forward checking after each assignment.',
    'At the top of `bt`: completeness check, then `if not ac3(csp, domains): return None` (it prunes this call\'s own dict in place).',
    'In the loop: `assignment[var] = value; trace.append((var, value))`, `new = forward_checking(csp, domains, var, value, assignment)`, '
    'recurse only if every unassigned variable still has values; then `del assignment[var]`.',
]

EXPLANATION = r"""
This is how you should hand-simulate the exam exercise "backtracking + forward checking + AC-3":

| step | X1 | X2 | X3 | X4 | |
|---|---|---|---|---|---|
| AC-3 at the root | 1234 | 1234 | 1234 | 1234 | nothing removed |
| X1=1, forward checking | **1** | 34 | 24 | 23 | |
| AC-3 | 1 | 4 | ∅ | 23 | X2=3 has no support in X3; then X3 loses 2 (vs X4) and 4 (vs X2) → backtrack |
| X1=2, forward checking | **2** | 4 | 13 | 134 | |
| AC-3 | 2 | 4 | 1 | 3 | solution forced |

Search tree size (assignments) for the same orders:

| instance | plain backtracking | + forward checking | + FC + AC-3 (this) |
|---|---|---|---|
| 4-queens | 8 | 8 | **5** |
| 8-queens | 113 | 88 | **20** |
| Australia, slide scenario (WA, Q, V first) | 18 | 17 | **9** |

**Search vs inference** (p. 317): inference can replace search. 3-queens is declared unsolvable by AC-3 at
the root, with an **empty** search tree; many Sudoku puzzles are solved by propagation alone. The opposite
extreme is the triangle X≠Y≠Z with 2 values: AC-3 finds nothing to prune, and only search discovers that
both branches fail. AC-3 at every node costs $O(nsd^3)$ per node instead of $O(nsd)$ for forward checking
alone – it pays when it cuts big subtrees, as here.
"""

ENTRY = 'csp_backtracking'

_SLIDE_AUS = CSP(['WA', 'Q', 'V', 'NT', 'SA', 'NSW', 'T'],
                 {'WA': 'RGB', 'Q': 'GRB', 'V': 'BRG', 'NT': 'RGB', 'SA': 'RGB', 'NSW': 'RGB', 'T': 'RGB'},
                 AUSTRALIA_NEIGHBORS, different_values)
_TRIANGLE = CSP('XYZ', {v: [1, 2] for v in 'XYZ'}, {'X': ['Y', 'Z'], 'Y': ['X', 'Z'], 'Z': ['X', 'Y']},
                different_values)


def _check(expected_trace, solvable=True, note=''):
    def check(got, csp):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (solution, trace).'
        sol, trace = got
        if solvable and not is_solution(csp, sol):
            return False, 'The returned assignment is not a complete, consistent solution.'
        if not solvable and sol is not None:
            return False, 'No solution exists: return None.'
        trace = [tuple(t) for t in trace]
        if isinstance(expected_trace, int):
            if len(trace) != expected_trace:
                return False, f'Expected {expected_trace} assignments in the trace, got {len(trace)}. {note}'
        elif trace != expected_trace:
            return False, f'Trace should be {expected_trace}. {note}'
        return True
    return check


TESTS = [
    Test('4-queens, the slide example', args=(queens(4),),
         check=_check([('X1', 1), ('X1', 2), ('X2', 4), ('X3', 1), ('X4', 3)],
                      note='X1=1 must fail right after FC + AC-3; X1=2 then forces everything.'),
         show='queens(4)'),
    Test('3-queens: inference alone, empty tree', args=(queens(3),), check=_check([], solvable=False,
         note='AC-3 at the root already empties a domain: nothing is ever assigned.'), show='queens(3)'),
    Test('Australia, slide scenario', args=(_SLIDE_AUS,),
         check=_check([('WA', 'R'), ('Q', 'G'), ('Q', 'R'), ('V', 'B'), ('V', 'R'), ('NT', 'G'), ('SA', 'B'),
                       ('NSW', 'G'), ('T', 'R')],
                      note='Q=G dies at once (NT and SA would both need blue, p. 293).'),
         show='order WA, Q, V, NT, SA, NSW, T; Q tries G first, V tries B first'),
    Test('beyond AC-3: the triangle needs search', args=(_TRIANGLE,),
         check=_check([('X', 1), ('X', 2)], solvable=False), show='X≠Y, Y≠Z, X≠Z with domains {1,2}'),
    Test('Australia with 2 colors', args=(australia('RG'),),
         check=_check([('WA', 'R'), ('WA', 'G')], solvable=False), show="australia('RG')"),
    Test('8-queens: 20 assignments (plain: 113)', args=(queens(8),), check=_check(20), show='queens(8)'),
]
