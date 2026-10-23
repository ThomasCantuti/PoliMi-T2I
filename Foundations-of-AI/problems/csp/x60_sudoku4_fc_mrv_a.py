TITLE = 'Exam · Jan 2026 · 4×4 Sudoku with forward checking and MRV (version A)'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['exam', 'Jan 2026', 'sudoku', 'MRV', 'forward checking', 'hand simulation']

STATEMENT = r"""
*Written exam of 14 January 2026 (version A) — Constraint Satisfaction Problems, Questions 1–2.*

A 4×4 Sudoku has four 2×2 subgrids and admissible numbers {1, 2, 3, 4}: cells in the same row, in the same column or
in the same subgrid must hold different numbers. Variables $X_{i,j}$ = the number in row $i$, column $j$.

**Question 1.** List all the constraints using a compact notation and the $X_{i,j}$ variables.

**Question 2.** Starting from the configuration below, solve the puzzle by applying **forward checking** and the
**MRV** heuristic. Ties: all else being equal, choose the variable with the **lower i**, then the **lower j** (e.g.
X1,2 before X2,2; X2,2 before X2,3). Write the step-by-step solution, explaining how the assignments are updated.

```text
+-----+-----+
| . 2 | . 4 |
| 1 4 | . . |
+-----+-----+
| 4 1 | . 3 |
| 2 3 | 4 1 |
+-----+-----+
```

In the visualizer the given digits are already propagated: only the 5 empty cells are shown, with the domains left
after removing the digits of their row, column and subgrid (iteration 1 of the official solution — compute it
yourself first). Edges = the ≠ constraints between empty cells. At each step predict the variable MRV selects and
the values forward checking removes.
"""

HINTS = [
    'Iteration 1: X1,1 sees 2, 4 (row), 1, 4, 2 (column) and 2, 1, 4 (subgrid) → only 3 is left.',
    'Three cells start with a single value: X1,1, X2,4 and X3,3. The tie-break picks the lowest row.',
    'X1,1 and X1,3 are in the same row: what does X1,1 = 3 do to D(X1,3) = {1, 3}?',
]

EXPLANATION = r"""
**Question 1 — model answer:**
- rows: $X_{i,j} \ne X_{i,k}$ for every $i$ and every $j \ne k$;
- columns: $X_{j,i} \ne X_{k,i}$ for every $i$ and every $j \ne k$;
- subgrids: all different inside each 2×2 block; the pairs not already covered by rows/columns are the diagonals,
  e.g. $X_{1,1} \ne X_{2,2}$, $X_{1,2} \ne X_{2,1}$, $X_{1,3} \ne X_{2,4}$, $X_{1,4} \ne X_{2,3}$, …

(equivalently, an *Alldiff* per row, column and subgrid: 12 Alldiff = 56 binary ≠ constraints).

**Question 2:**

| step | choice | domains of the empty cells after forward checking |
|---|---|---|
| 1 | (givens propagated) | X1,1 = {3}, X1,3 = {1, 3}, X2,3 = {2, 3}, X2,4 = {2}, X3,3 = {2} |
| 2 | X1,1 = 3 (tie X1,1 / X2,4 / X3,3 → lowest i) | X1,3 = {1} |
| 3 | X1,3 = 1 (tie with X2,4, X3,3) | nothing changes |
| 4 | X2,4 = 2 (tie with X3,3) | X2,3 = {3} |
| 5 | X2,3 = 3 (tie with X3,3) | nothing changes |
| 6 | X3,3 = 2 | solved |

Solution: row 1 = 3 2 1 4, row 2 = 1 4 3 2, row 3 = 4 1 2 3, row 4 = 2 3 4 1. No backtracking.

> **Official solution typo:** its explanation of step 2 says "assign X1,1 = 3, nothing changes in the other
> positions", but its own table shows X1,3 going from {1, 3} to {1}: forward checking does remove 3 from X1,3
> (same row).
"""

_GRID = ['.2.4', '14..', '41.3', '2341']
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
