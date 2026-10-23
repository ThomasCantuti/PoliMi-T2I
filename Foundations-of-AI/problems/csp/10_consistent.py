from harness import Test
from csp_lib import australia, queens

TITLE = 'Is this value consistent? (incremental goal test)'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['constraints', 'partial assignment', 'constraint graph']

STATEMENT = r"""
Backtracking search checks constraints **as it goes** (Principle #2, slides p. 273): before adding
`var = value` to a **partial assignment**, it asks whether the new value conflicts with the values
already assigned.

Write `is_consistent(csp, var, value, assignment)` → `True` iff `var = value` satisfies every
constraint between `var` and the variables **already in** `assignment`.

The CSP (from `csp_lib`) is **binary**:

| field | meaning |
|---|---|
| `csp.variables` | `['WA', 'NT', 'Q', 'NSW', 'V', 'SA', 'T']` |
| `csp.domains[X]` | `['R', 'G', 'B']` |
| `csp.neighbors[X]` | variables sharing a constraint with `X`, e.g. `neighbors['WA'] == ['NT', 'SA']` |
| `csp.constraints(A, a, B, b)` | `True` if `A=a, B=b` is allowed (map coloring: `a != b`) |

```text
       NT --- Q
      /  \   / \
    WA -- SA -- NSW        T  (no neighbors)
            \   /
              V
```

**Example:** with `assignment = {'WA': 'R'}`, `NT = 'R'` → `False`, `Q = 'R'` → `True` (Q is not WA's neighbor).

The same function works for **4-queens** (`queens(4)`): variable `Xi` is the row of the queen in column `i`,
and the constraint is "different rows and not on the same diagonal": $X_i \ne X_j$ and $|X_i - X_j| \ne |i-j|$.
"""

STARTER = '''from typing import Any
from csp_lib import CSP

def is_consistent(csp: CSP, var: str, value: Any, assignment: dict[str, Any]) -> bool:
    """True iff var=value satisfies the constraints with every variable already in assignment."""
    # TODO: look only at the neighbors of var that are already assigned
    return True
'''

SOLUTION = '''from typing import Any
from csp_lib import CSP

def is_consistent(csp: CSP, var: str, value: Any, assignment: dict[str, Any]) -> bool:
    """True iff var=value satisfies the constraints with every variable already in assignment."""
    for Y in csp.neighbors[var]:
        if Y in assignment and not csp.constraints(var, value, Y, assignment[Y]):
            return False
    return True
'''

HINTS = [
    'Which constraints can a brand-new value violate? Only those that involve `var` **and** an already-assigned variable.',
    'Loop over `csp.neighbors[var]`; skip the neighbors that are not in `assignment`.',
    'For an assigned neighbor `Y`: if `not csp.constraints(var, value, Y, assignment[Y])` → return `False`. After the loop → `True`.',
]

EXPLANATION = r"""
This is the **incremental goal test**: instead of generating a complete assignment and testing it at the
end ($O(d^n)$ complete assignments!), backtracking rejects a value as soon as it conflicts with the
partial assignment, pruning the whole subtree below it.

Only the **neighbors in the constraint graph** matter: a value can never conflict with a variable it
shares no constraint with (Q vs WA, anything vs Tasmania). The cost is $O(s)$ constraint checks, where
$s$ is the number of constraints on `var`.

Notice what this check does **not** do: it does not look ahead at unassigned variables. That is the job
of **forward checking** (problem 30).
"""

ENTRY = 'is_consistent'

_AUS = australia()
_Q4 = queens(4)

TESTS = [
    Test('neighbor with the same color', args=(_AUS, 'NT', 'R', {'WA': 'R'}), expected=False,
         show="NT=R with {WA: R}"),
    Test('neighbor with a different color', args=(_AUS, 'NT', 'G', {'WA': 'R'}), expected=True,
         show="NT=G with {WA: R}"),
    Test('same color but NOT neighbors', args=(_AUS, 'Q', 'R', {'WA': 'R'}), expected=True,
         show="Q=R with {WA: R}  (Q and WA do not share a border)"),
    Test('empty assignment', args=(_AUS, 'SA', 'B', {}), expected=True, show='SA=B with {}'),
    Test('SA sees all its neighbors', args=(_AUS, 'SA', 'B', {'WA': 'R', 'NT': 'G', 'Q': 'R', 'NSW': 'G', 'V': 'B'}),
         expected=False, show='SA=B with WA=R, NT=G, Q=R, NSW=G, V=B'),
    Test('Tasmania is unconstrained', args=(_AUS, 'T', 'R', {'WA': 'R', 'NT': 'G', 'SA': 'B', 'Q': 'R', 'NSW': 'G', 'V': 'R'}),
         expected=True, show='T=R with the whole mainland colored'),
    Test('4-queens: diagonal attack', args=(_Q4, 'X2', 2, {'X1': 1}), expected=False,
         show='X2=2 with {X1: 1}'),
    Test('4-queens: safe square', args=(_Q4, 'X2', 3, {'X1': 1}), expected=True,
         show='X2=3 with {X1: 1}'),
    Test('4-queens: diagonal at distance 2', args=(_Q4, 'X3', 3, {'X1': 1}), expected=False,
         show='X3=3 with {X1: 1}  (|3-1| == |3-1|)'),
    Test('4-queens: same row', args=(_Q4, 'X4', 1, {'X1': 1, 'X2': 3}), expected=False,
         show='X4=1 with {X1: 1, X2: 3}'),
]
