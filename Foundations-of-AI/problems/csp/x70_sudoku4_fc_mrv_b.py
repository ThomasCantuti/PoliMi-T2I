TITLE = 'Exam · Jan 2026 · 4×4 Sudoku with forward checking and MRV (version B)'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['exam', 'Jan 2026', 'sudoku', 'MRV', 'forward checking', 'hand simulation']

STATEMENT = r"""
*Written exam of 14 January 2026 (version B) — Constraint Satisfaction Problems, Question 2.*

Same 4×4 Sudoku as version A (four 2×2 subgrids, numbers {1, 2, 3, 4}, all different in every row, column and
subgrid; variables $X_{i,j}$ = number in row $i$, column $j$), with a different starting grid.

Solve the puzzle by applying **forward checking** and the **MRV** heuristic. Ties: all else being equal, choose the
variable with the **lower i**, then the **lower j**. Write the step-by-step solution, explaining how the assignments
are updated.

```text
+-----+-----+
| 4 1 | . 3 |
| 2 3 | 4 1 |
+-----+-----+
| . 2 | . 4 |
| 1 4 | . . |
+-----+-----+
```

In the visualizer the given digits are already propagated: only the 5 empty cells are shown, with the domains left
after removing the digits of their row, column and subgrid (iteration 1 of the official solution — compute it
yourself first). At each step predict the variable MRV selects and the values forward checking removes.
"""

HINTS = [
    'Iteration 1: X1,3 sees 4, 1, 3 in its row → {2}. X3,3 sees 2, 4 (row) and 4 (column) → {1, 3}.',
    'Three cells start with a single value: X1,3, X3,1 and X4,4. The tie-break picks the lowest row.',
    'X1,3 and X4,3 are in the same column; X3,1 and X3,3 are in the same row.',
]

EXPLANATION = r"""
| step | choice | domains of the empty cells after forward checking |
|---|---|---|
| 1 | (givens propagated) | X1,3 = {2}, X3,1 = {3}, X3,3 = {1, 3}, X4,3 = {2, 3}, X4,4 = {2} |
| 2 | X1,3 = 2 (tie X1,3 / X3,1 / X4,4 → lowest i) | X4,3 = {3} |
| 3 | X3,1 = 3 (tie with X4,3, X4,4 → lowest i) | X3,3 = {1} |
| 4 | X3,3 = 1 (tie: all have one value; lowest i, then j) | nothing changes |
| 5 | X4,3 = 3 | nothing changes |
| 6 | X4,4 = 2 | solved |

Solution: row 1 = 4 1 2 3, row 2 = 2 3 4 1, row 3 = 3 2 1 4, row 4 = 1 4 3 2. No backtracking.

The official solution stops after step 3 ("all the variables have one value, so we found the solution"): with
forward checking every remaining domain is a singleton and, being forward-checked against every assignment so far,
the three remaining values are consistent with each other here, so the last three assignments are forced. Formally
backtracking still performs them (steps 4–6).

**Question 3 of the same exam** (AC-3 and the order of the arcs) is in the quiz *Short questions on arc consistency
and filtering*.
"""

_GRID = ['41.3', '2341', '.2.4', '14..']
_ALL = ['X%d%d' % (i, j) for i in range(1, 5) for j in range(1, 5)]


def _linked(a, b):
    (i1, j1), (i2, j2) = (int(a[1]), int(a[2])), (int(b[1]), int(b[2]))
    return i1 == i2 or j1 == j2 or ((i1 - 1) // 2, (j1 - 1) // 2) == ((i2 - 1) // 2, (j2 - 1) // 2)


_GIVEN = {'X%d%d' % (i, j): int(c) for i, row in enumerate(_GRID, 1) for j, c in enumerate(row, 1) if c != '.'}
_EMPTY = [v for v in _ALL if v not in _GIVEN]

VIZ = 'csp'
CONFIG = {
    'variables': _EMPTY,
    'domains': {v: [x for x in range(1, 5) if all(_GIVEN.get(w) != x for w in _ALL if w != v and _linked(v, w))]
                for v in _EMPTY},
    'constraints': [[a, b] for k, a in enumerate(_EMPTY) for b in _EMPTY[k + 1:] if _linked(a, b)],
    'layout': {v: {'x': (int(v[2]) - 1) * 110, 'y': (int(v[1]) - 1) * 100, 'chips': 'below'} for v in _EMPTY},
    'inference': 'fc', 'varOrder': 'mrv', 'valOrder': 'static',
    'ask': ['var', 'prune'],
}
