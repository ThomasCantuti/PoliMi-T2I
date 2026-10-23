TITLE = 'Exam · Jun 2023 · Baltic map coloring: unary constraints, MRV/degree, AC-3'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jun 2023', 'AC-3', 'map coloring', 'MRV', 'degree heuristic', 'hand simulation']

STATEMENT = r"""
*Written exam of 14 June 2023 — Constraint Satisfaction Problems (8 points).*

Color Estonia (EST), Latvia (LAT), Lithuania (LIT), Belarus (BEL), Poland (POL) and Russia (RUS) with four colors:
green (G), blue (B), yellow (Y), red (R), so that neighbouring countries have different colors. **Russia must be
red, Estonia cannot be yellow, Belarus cannot be blue.** Borders (Russia includes the Kaliningrad exclave, which
touches Lithuania and Poland):

```text
EST: LAT, RUS            LIT: LAT, BEL, POL, RUS        POL: LIT, BEL, RUS
LAT: EST, LIT, BEL, RUS  BEL: LAT, LIT, POL, RUS        RUS: EST, LAT, LIT, BEL, POL
```

1. Formulate the CSP: variables, domains (enforce all unary constraints by reducing the initial domains), constraint
   graph with labelled edges.
2. For the first assignment of backtracking, which variable does **MRV** choose? And the **degree** heuristic?
3. Starting from the CSP of question 1, Poland is colored **yellow** and then **AC-3** is applied. Report only the
   relevant steps (those that change a domain) and the final domains of the unassigned variables.
4. Running backtracking on the CSP simplified by question 3, how many backtracks happen, in the worst case, before
   finding a solution? Why?

The visualizer replays question 3: predict what each `revise(Xi, Xj)` removes from the tail `Xi`.

Conventions: FIFO queue; to replay the official answer it starts with the arcs towards RUS (EST→RUS, LAT→RUS,
LIT→RUS, BEL→RUS — the official solution does not report them), then LIT→POL, BEL→POL, LAT→BEL, LIT→BEL, LAT→LIT,
followed by all the other arcs; re-queued arcs are appended only if not already in the queue.
"""

HINTS = [
    'Unary constraints shrink the domains before any search: D(RUS) = {R}, D(EST) = {G, B, R}, D(BEL) = {G, Y, R}.',
    'Every country borders Russia, so every arc X → RUS removes R from X.',
    'POL = Y: its neighbours LIT and BEL lose Y. BEL is then left with a single color — follow the chain from there.',
]

EXPLANATION = r"""
**1. Formulation.** Variables EST, LAT, LIT, BEL, POL, RUS. Domains: D(EST) = {G, B, R}, D(LAT) = D(LIT) = D(POL) =
{G, B, Y, R}, D(BEL) = {G, Y, R}, D(RUS) = {R}. Constraint graph with 11 edges, each labelled ≠: EST–LAT, EST–RUS,
LAT–LIT, LAT–BEL, LAT–RUS, LIT–BEL, LIT–POL, LIT–RUS, BEL–POL, BEL–RUS, POL–RUS.

**2.** MRV chooses **RUS** (1 remaining value); the degree heuristic also chooses **RUS** (5 constraints, against 4
for LAT, LIT, BEL, 3 for POL, 2 for EST).

**3. AC-3 after POL = Y** — relevant steps (the arcs X → RUS first remove R from EST, LAT, LIT, BEL):

| arc | domain after the revision |
|---|---|
| LIT → POL | D(LIT) = {G, B} |
| BEL → POL | D(BEL) = {G} |
| LAT → BEL | D(LAT) = {B, Y} |
| LIT → BEL | D(LIT) = {B} |
| LAT → LIT | D(LAT) = {Y} |

Final domains: D(EST) = {G, B}, D(LAT) = {Y}, D(LIT) = {B}, D(BEL) = {G}, D(RUS) = {R} (and POL = Y). With a
different queue order the intermediate steps change, the final domains do not.

**4. Model answer:** *No backtracks. Every variable except EST has a single value left, and these values are
mutually consistent (AC-3 checked every pair); EST's neighbours are LAT = Y and RUS = R, so both G and B work for
EST. Whatever order backtracking follows, every value it tries is consistent with the previous ones.*
"""

VIZ = 'csp'
CONFIG = {
    'variables': ['EST', 'LAT', 'LIT', 'BEL', 'POL', 'RUS'],
    'domains': {'EST': ['G', 'B', 'R'], 'LAT': ['G', 'B', 'Y', 'R'], 'LIT': ['G', 'B', 'Y', 'R'],
                'BEL': ['G', 'Y', 'R'], 'POL': ['G', 'B', 'Y', 'R'], 'RUS': ['R']},
    'constraints': [['EST', 'LAT'], ['EST', 'RUS'], ['LAT', 'LIT'], ['LAT', 'BEL'], ['LAT', 'RUS'], ['LIT', 'BEL'],
                    ['LIT', 'POL'], ['LIT', 'RUS'], ['BEL', 'POL'], ['BEL', 'RUS'], ['POL', 'RUS']],
    'layout': {'EST': {'x': 150, 'y': 0, 'chips': 'above'}, 'LAT': {'x': 0, 'y': 110, 'chips': 'left'},
               'RUS': {'x': 330, 'y': 70, 'chips': 'right'}, 'LIT': {'x': 30, 'y': 260, 'chips': 'left'},
               'BEL': {'x': 340, 'y': 250, 'chips': 'right'}, 'POL': {'x': 180, 'y': 360, 'chips': 'below'}},
    'algorithm': 'ac3',
    'assignment': {'POL': 'Y'},
    'queue': [['EST', 'RUS'], ['LAT', 'RUS'], ['LIT', 'RUS'], ['BEL', 'RUS'],
              ['LIT', 'POL'], ['BEL', 'POL'], ['LAT', 'BEL'], ['LIT', 'BEL'], ['LAT', 'LIT']],
}
