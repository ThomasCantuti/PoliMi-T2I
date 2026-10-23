TITLE = 'Trace: MRV + degree heuristic with forward checking (Australia)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['MRV', 'degree heuristic', 'forward checking', 'variable ordering', 'hand simulation']

STATEMENT = r"""
Color Australia with R, G, B using **backtracking + forward checking**, choosing the variable with
**MRV** and breaking ties with the **degree heuristic** (slide p. 298). At each step predict

1. **which variable is selected** (click its node), then
2. **which values forward checking removes** (click the chips, then *Check*).

Conventions:

- **MRV:** the unassigned variable with the fewest values left in its (forward-checked) domain.
- **Degree** (tie-breaker): the one with the most constraints with **unassigned** variables.
- Still tied → the first in the order WA, NT, Q, NSW, V, SA, T.
- Values are tried in the order R, G, B.
"""

HINTS = [
    'At the start every domain has 3 values, so MRV ties everywhere and the **degree** decides: count the edges of '
    'each node in the constraint graph.',
    'Degree counts only neighbours that are still **unassigned** — it changes as the search proceeds.',
    'Tasmania has degree 0: it is always the last choice (an independent subproblem, p. 300).',
]

EXPLANATION = r"""
SA has the largest degree (5), so it goes first; forward checking then removes R from all five neighbours.
From there MRV and degree drive the search straight to a solution **without a single backtrack**:
SA = R, NT = G, Q = B, NSW = G, WA = B, V = B, T = R.

MRV is *fail-first*: picking the most constrained variable discovers dead ends as early as possible; the degree
heuristic reduces the branching of the remaining problem. Compare with the static order of the previous trace,
which wandered for dozens of steps.
"""

VIZ = 'csp'
CONFIG = {'preset': 'australia', 'inference': 'fc', 'varOrder': 'mrv+degree', 'valOrder': 'static',
          'ask': ['var', 'prune']}
