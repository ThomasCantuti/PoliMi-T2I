from harness import Test

TITLE = 'N-queens as optimization: h = number of attacking pairs'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['heuristic', 'objective function', 'n-queens', 'CSP as optimization']

STATEMENT = r"""
To turn a CSP into an optimization problem we start from an **infeasible complete state** and need a function
saying **how far** it is from a feasible one (slides p. 333–334): count the **violated constraints**.

For n-queens a state is a tuple: `state[i]` is the row (1 = top) of the queen in column `i + 1`.
Write `attacking_pairs(state)` → $h$ = number of pairs of queens that attack each other
(same row, or same diagonal: $|r_i - r_j| = |i - j|$). Each pair counts **once**, even if another queen sits
between them.

**Slide p. 334:**

```text
 h = 5            h = 2            h = 0
 . . . .          . Q . .          . Q . .
 . Q . Q          . . . Q          . . . Q
 Q . Q .          Q . Q .          Q . . .
 . . . .          . . . .          . . Q .
 (3,2,3,2)        (3,1,3,2)        (3,1,4,2)
```
"""

STARTER = '''def attacking_pairs(state: tuple[int, ...]) -> int:
    """Number of pairs of queens on the same row or on the same diagonal."""
    # TODO
    return 0
'''

SOLUTION = '''from itertools import combinations

def attacking_pairs(state: tuple[int, ...]) -> int:
    """Number of pairs of queens on the same row or on the same diagonal."""
    return sum(1 for i, j in combinations(range(len(state)), 2)
               if state[i] == state[j] or abs(state[i] - state[j]) == j - i)
'''

HINTS = [
    'Look at every unordered pair of columns $i < j$ once: `itertools.combinations(range(n), 2)`.',
    'Pair $(i, j)$ attacks iff `state[i] == state[j]` (row) or `abs(state[i] - state[j]) == j - i` (diagonal). Columns never clash: one queen per column.',
]

EXPLANATION = r"""
$h$ counts violated constraints – exactly the binary constraints $X_i \ne X_j$, $|X_i - X_j| \ne |i - j|$ of the
CSP formulation (p. 267). $h = 0$ **iff** the state is a solution, so "solve the CSP" becomes "minimize $h$".

It is a coarse measure: on Figure 4.3(b) (p. 335) the state has $h = 17$ and each of the 56 neighbors (move one
queen inside its column) has a value between 12 and 18 – the numbers drawn on the board, which your
function reproduces exactly. **Eight** moves tie for the best value, 12: plateaus and ties are the norm, which
is why tie-breaking matters in hill climbing.

Cost: $O(n^2)$ per evaluation, so evaluating all $n(n-1)$ neighbors naively costs $O(n^4)$; min-conflicts
(problem 50) avoids this by looking at one queen at a time.
"""

ENTRY = 'attacking_pairs'

_FIG_B = (5, 6, 7, 4, 5, 6, 7, 6)   # Figure 4.3(b), p. 335
_FIG_A = (8, 3, 7, 4, 2, 5, 1, 6)   # Figure 4.3(a), p. 335
# h of every successor of _FIG_B, as printed on the board (row r, column c); None = the queen itself
_TABLE = [[18, 12, 14, 13, 13, 12, 14, 14],
          [14, 16, 13, 15, 12, 14, 12, 16],
          [14, 12, 18, 13, 15, 12, 14, 14],
          [15, 14, 14, None, 13, 16, 13, 16],
          [None, 14, 17, 15, None, 14, 16, 16],
          [17, None, 16, 18, 15, None, 15, None],
          [18, 14, None, 15, 15, 14, None, 16],
          [14, 14, 13, 17, 12, 14, 12, 18]]


def _table(sol):
    return [[None if _FIG_B[c] == r + 1 else sol.attacking_pairs(_FIG_B[:c] + (r + 1,) + _FIG_B[c + 1:])
             for c in range(8)] for r in range(8)]


def _check_table(got):
    for r in range(8):
        for c in range(8):
            if got[r][c] != _TABLE[r][c]:
                return False, f'moving the queen of column {c + 1} to row {r + 1}: h should be {_TABLE[r][c]}, got {got[r][c]}'
    return True


TESTS = [
    Test('p. 334, first board', args=((3, 2, 3, 2),), expected=5, show='(3, 2, 3, 2)'),
    Test('p. 334, second board', args=((3, 1, 3, 2),), expected=2, show='(3, 1, 3, 2)'),
    Test('p. 334, solution', args=((3, 1, 4, 2),), expected=0, show='(3, 1, 4, 2)'),
    Test('all queens on one row', args=((4,) * 8,), expected=28, show='8 queens on row 4: every pair, C(8,2)'),
    Test('one long diagonal', args=(tuple(range(1, 9)),), expected=28, show='(1, 2, ..., 8)'),
    Test('Figure 4.3(b): h = 17', args=(_FIG_B,), expected=17, show=str(_FIG_B)),
    Test('Figure 4.3(a): almost a solution', args=(_FIG_A,), expected=1, show=str(_FIG_A)),
    Test('Figure 4.3(b): the whole successor table', call=_table, check=_check_table,
         show='h after moving each queen to each row of its column (the numbers on the board)'),
    Test('single queen', args=((1,),), expected=0, show='(1,)'),
]
