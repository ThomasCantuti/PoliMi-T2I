TITLE = 'Exam · Feb 2023 · Forward checking prunes the backtracking tree (5 cells, 2 colors)'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['exam', 'Feb 2023', 'forward checking', 'backtracking', 'AC-3', 'hand simulation']

STATEMENT = r"""
*Written exam of 9 February 2023 — Constraint Satisfaction Problems (8 points).*

Color the 5 cells of the board so that cells adjacent **vertically or horizontally** have different colors. Two
colors: red (R) and black (B). Every cell is a variable with domain {R, B}, except cell 5, whose domain is reduced
to {B}; the constraints are the obvious ≠ ones.

```text
+---+---+---+
| 1 | 2 | 3 |          constraints: 1≠2, 2≠3, 1≠4, 2≠5, 4≠5
+---+---+---+
| 4 | 5 |
+---+---+
```

**Question 1.** The "largest tree" that pure backtracking could generate (variables in numerical order 1, 2, 3, 4, 5,
values in the order R, B) is the complete binary tree on cells 1–4 (each node has a child R and a child B), with a
single child 5 = B under every node of level 4: 2 + 4 + 8 + 16 + 16 nodes. **Mark the roots of the subtrees that are
not generated when backtracking uses forward checking**, and motivate at least two marks.

**Question 2.** Does applying AC-3 to the **initial** domains reduce the complexity of the problem? Why?

Use the visualizer for Question 1: run backtracking + forward checking (static order 1…5, values R then B) and, after
every assignment, predict which values forward checking removes (click them, then *Check*). In the visualizer black
is drawn in blue.
"""

HINTS = [
    'Forward checking after X = v removes v from every unassigned neighbour of X. Cell 2 has three neighbours: 1, 3 and 5.',
    'After 1 = R, 2 = B: what is left in the domain of cell 5?',
    'A subtree is "not generated" either because forward checking removed its value from the domain, or because its '
    'parent was a dead end, or because the search stopped at the first solution.',
]

EXPLANATION = r"""
**Run.** 1 = R removes R from 2 and 4 → D2 = {B}, D4 = {B}. 2 = B removes B from 3 and from 5 → **D5 = {}**: dead
end, undo. Cell 2 has no other value → back to cell 1. 1 = B → D2 = {R}, D4 = {R}; 2 = R → D3 = {B}; 3 = B; 4 = R
(D5 = {B} is untouched); 5 = B → solution **1 = B, 2 = R, 3 = B, 4 = R, 5 = B** after 7 assignments.

**Question 1 — the crosses** (roots of subtrees that are never generated):

| subtree root | why it is not generated |
|---|---|
| 1 = R → 2 = R | forward checking removed R from D2 after 1 = R |
| 1 = R → 2 = B → 3 = R and 3 = B | after 2 = B, D5 is empty: dead end, its children are never generated |
| 1 = B → 2 = R → 3 = R | forward checking removed R from D3 after 2 = R |
| 1 = B → 2 = R → 3 = B → 4 = B | forward checking removed B from D4 after 1 = B |
| 1 = B → 2 = B | B was removed from D2 by forward checking after 1 = B (and, anyway, the solution was already found) |

The official solution motivates the leftmost cross with forward checking and the rightmost with "a solution has
been found and the algorithm does not reach that part of the tree"; both motivations are correct for the rightmost
subtree.

**Question 2 — model answer:** *Yes. AC-3 on the initial domains already removes values: the arc 2 → 5 deletes B
from D2 and the arc 4 → 5 deletes B from D4 (D5 = {B}); then 3 → 2 deletes R from D3 and 1 → 2 (or 1 → 4) deletes
R from D1. Every domain becomes a singleton, D = (B, R, B, R, B): AC-3 finds the solution without any search.*

> **Exam trap:** the official text writes the first step as "arc 5 → 4 reduces the domain of variable 4". With the
> slides' convention, REVISE(Xi, Xj) deletes values from the **tail** Xi, so the arc that shrinks D4 is **4 → 5**.
> State the convention you use.
"""

VIZ = 'csp'
CONFIG = {
    'variables': ['1', '2', '3', '4', '5'],
    'domains': {'1': ['R', 'B'], '2': ['R', 'B'], '3': ['R', 'B'], '4': ['R', 'B'], '5': ['B']},
    'constraints': [['1', '2'], ['2', '3'], ['1', '4'], ['2', '5'], ['4', '5']],
    'layout': {'1': {'x': 0, 'y': 0, 'chips': 'above'}, '2': {'x': 150, 'y': 0, 'chips': 'above'},
               '3': {'x': 300, 'y': 0, 'chips': 'above'}, '4': {'x': 0, 'y': 150, 'chips': 'below'},
               '5': {'x': 150, 'y': 150, 'chips': 'below'}},
    'inference': 'fc', 'varOrder': 'static', 'valOrder': 'static',
    'ask': ['prune'],
}
