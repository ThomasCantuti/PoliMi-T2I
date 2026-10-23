TITLE = 'Trace: 4-queens with backtracking and forward checking'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['N-queens', 'forward checking', 'backtracking', 'hand simulation']

STATEMENT = r"""
Variables X1…X4 (the queen of column *i*), domains {1, 2, 3, 4} (the row, 1 = top). Constraints: no two queens
on the same row (`Xi ≠ Xj`) or diagonal (`|Xi − Xj| ≠ |i − j|`).

Run **backtracking + forward checking** with the **static** variable order X1, X2, X3, X4 and values in increasing
order. After every assignment predict which squares forward checking crosses out (click them, then *Check*).
When a domain becomes empty, undo the assignment and try the next value; when a variable has no values
left, backtrack.
"""

HINTS = [
    'A queen at (column i, row v) attacks, in column j, the squares v (same row), v − |i − j| and v + |i − j| (diagonals).',
    'Only cross out values that are still in the domain — already-removed squares do not count twice.',
    'X1 = 1, X2 = 3: what is left for X3?',
]

EXPLANATION = r"""
X1 = 1 leaves X2 = {3, 4}, X3 = {2, 4}, X4 = {2, 3}. X2 = 3 empties X3 → try X2 = 4, which leaves X3 = {2},
X4 = {3}; X3 = 2 empties X4 → X3 and then X2 have no values left → back to X1. With X1 = 2 everything is
forced: X2 = 4, X3 = 1, X4 = 3.

Forward checking never assigns a value that conflicts with the current assignment, but it only looks one step
ahead. The complete example of the slides (next trace) adds AC-3 and discovers the failure of X1 = 1 **without
assigning X2 at all**.
"""

VIZ = 'csp'
CONFIG = {'preset': 'nqueens', 'n': 4, 'inference': 'fc', 'varOrder': 'static', 'valOrder': 'static', 'ask': ['prune']}
