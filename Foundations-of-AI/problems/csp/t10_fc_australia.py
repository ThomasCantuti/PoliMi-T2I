TITLE = 'Trace: forward checking on the Australia map (slides p. 280–283)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['forward checking', 'backtracking', 'map coloring', 'hand simulation']

STATEMENT = r"""
Run **backtracking search with forward checking** on the Australia map-coloring CSP and predict, after
every assignment, **which values forward checking crosses out** (click them, then *Check*).

Conventions (exactly as in the slides' table, p. 280–283):

- **Variable order (static):** WA, Q, V, NT, NSW, SA, T.
- **Value order:** WA, NT, NSW, SA, T try R, G, B; **Q tries G first** (G, R, B) and **V tries B first** (B, R, G).
- **Forward checking** after `X = v`: from every **unassigned neighbour** of X remove the values inconsistent with
  `X = v` (here: remove `v` itself). If a domain becomes **empty** → dead end: undo `X = v` (restoring the pruned
  values) and try the next value of X; if X has no values left, backtrack to the previous variable.

The first three rows of the domain table are exactly the slide: WA = R, Q = G, V = B empties SA.
Then keep going — how long does it take forward checking to get out of the trap?
"""

HINTS = [
    'Only the **neighbours** of the variable you just assigned can lose values, and only the value you assigned.',
    'Assigned variables are never touched; a neighbour that has already lost that value loses nothing.',
    'After WA = R and Q = G, both NT and SA are left with {B} — they are neighbours, but forward checking does '
    'not compare two unassigned variables, so it will not notice.',
]

EXPLANATION = r"""
Forward checking only propagates **from the assigned variable to its neighbours**. After WA = R, Q = G the
domains are NT = {B}, SA = {B}: the partial assignment is already hopeless (NT and SA are adjacent), but no
domain is empty, so the search keeps assigning V, NT, NSW… and hits three dead ends before giving up on
Q = G (p. 286: *"NT and SA cannot both be blue. But forward checking cannot detect this inconsistency"*).

Arc consistency (AC-3, p. 290–293) detects it immediately, and MRV would have picked NT or SA (1 value left)
right after Q = G and failed at once. Complexity of one forward-checking step: $O(n\,s\,d)$ (p. 284).
"""

VIZ = 'csp'
CONFIG = {
    'preset': 'australia', 'inference': 'fc', 'varOrder': 'static', 'valOrder': 'static',
    'order': ['WA', 'Q', 'V', 'NT', 'NSW', 'SA', 'T'],
    'domains': {'WA': ['R', 'G', 'B'], 'NT': ['R', 'G', 'B'], 'Q': ['G', 'R', 'B'], 'NSW': ['R', 'G', 'B'],
                'V': ['B', 'R', 'G'], 'SA': ['R', 'G', 'B'], 'T': ['R', 'G', 'B']},
    'ask': ['prune'],
}
