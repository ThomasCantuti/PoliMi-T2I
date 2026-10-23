TITLE = 'Trace: the complete 4-queens example – forward checking + AC-3 (slides p. 303–315)'
DIFFICULTY = 'hard'
KIND = 'trace'
TAGS = ['N-queens', 'AC-3', 'forward checking', 'MAC', 'hand simulation']

STATEMENT = r"""
Replay the **complete example** of the slides with the modified backtracking of p. 317:

```text
CSP-BACKTRACKING(A, var-domains)
    IF A is complete THEN RETURN A
    run AC-3 and reduce the domains of the unassigned variables
    IF a variable has an empty domain THEN RETURN failure
    X <- next variable;  FOR EACH v in D(X):
        add X = v;  forward checking;  IF no empty domain THEN recurse
        remove X = v
    RETURN failure
```

Variables X1…X4 (column), values 1…4 (row, 1 = top), static order X1…X4, values in increasing order.
Predict every **forward-checking** pruning and every **revise(Xi, Xj)** of AC-3.

AC-3 conventions: FIFO queue, initially the arcs (Xi, Xj) between **unassigned** variables in the order
X1→X2, X1→X3, …, X4→X3; after `revise(Xi, Xj)` shrinks D(Xi), append (Xk, Xi) for every unassigned
Xk ≠ Xj not already queued; an empty domain means failure.
"""

HINTS = [
    'At the root all domains are full: every arc is consistent, AC-3 removes nothing (p. 304).',
    'After X1 = 1 and forward checking: X2 = {3, 4}, X3 = {2, 4}, X4 = {2, 3}. Which value of X2 is compatible with no value of X3?',
    'X3 = 4 is in the same row as X2 = 4; X3 = 2 conflicts with both values left for X4 (row 2: same row, row 3: diagonal).',
]

EXPLANATION = r"""
After X1 = 1, AC-3 removes 3 from X2, then empties X3 (it loses 4 because of X2 = {4} and 2 because of
X4 = {2, 3}) → failure **before assigning X2** (p. 308–311). The slides apply the arcs in a slightly different order
(X3 loses 2 first, then 4): the result of AC-3 does not depend on the order.

With X1 = 2, forward checking gives X2 = {4}, X3 = {1, 3}, X4 = {1, 3, 4}; AC-3 then reduces X3 to {1} and X4 to
{3} (p. 315): every remaining domain is a singleton, and the search just reads off the solution
X = (2, 4, 1, 3). Interleaving inference and search is a trade-off: AC-3 costs $O(n s d^3)$ per call but can
save whole subtrees.
"""

VIZ = 'csp'
CONFIG = {'preset': 'nqueens', 'n': 4, 'inference': 'mac', 'varOrder': 'static', 'valOrder': 'static',
          'ask': ['prune', 'revise']}
