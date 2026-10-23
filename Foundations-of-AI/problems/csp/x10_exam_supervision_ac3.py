TITLE = 'Exam · Jan 2022 · AC-3 on the exam-supervision CSP'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jan 2022', 'AC-3', 'formulation', 'unary constraints', 'hand simulation']

STATEMENT = r"""
*Written exam of 25 January 2022 — Constraint Satisfaction Problems (8 points).*

Five exams take place on the same day:

| exam | course | time |
|---|---|---|
| E1 | Foundations of Artificial Intelligence | 8:30 – 10:00 |
| E2 | Data Mining | 9:00 – 11:00 |
| E3 | Machine Learning | 10:30 – 12:30 |
| E4 | Multiagent Systems | 10:30 – 12:30 |
| E5 | Artificial Neural Networks and Deep Learning | 11:30 – 13:00 |

Three PhD students can supervise the exams of the courses they know something about: **A** can supervise E3 and
E4; **B** can supervise E2, E3, E4 and E5; **C** can supervise all five. Every exam needs exactly one supervisor and,
at any time instant, a supervisor can supervise a single exam. The exams are the **variables** and the PhD students
are the **values**.

1. Write the domains of the variables, enforcing the unary constraints (who *can* supervise what).
2. Write the constraints, using only binary constraints.
3. Apply **AC-3** to the domains of question 1; report the main steps and the final domains.
4. Looking at the final domains, what can you conclude about the existence of a solution?

Work out 1 and 2 on paper first: the visualizer shows the domains and the constraint graph. Then predict, for every
arc popped from the queue, what `revise(Xi, Xj)` removes from the **tail** `Xi` (click the chips, or *Check* with
nothing selected).

Conventions (those of the official solution):

- The queue is **FIFO** and initially contains the 12 arcs in this order: E1→E2, E2→E1, E2→E3, E3→E2, E2→E4,
  E4→E2, E3→E4, E4→E3, E3→E5, E5→E3, E4→E5, E5→E4.
- When D(Xi) shrinks, (Xk, Xi) is appended for every neighbour Xk ≠ Xj **that is not already in the queue**.
"""

HINTS = [
    'Unary constraints first: a value is in D(Ei) only if that student can supervise Ei. E1 has a single candidate.',
    'Two exams are linked by a ≠ constraint iff their time intervals overlap. E1 overlaps only E2; E5 does not overlap E2 (11:00 < 11:30).',
    'With "≠" an arc Xi → Xj removes a value x only when D(Xj) = {x}. Which domains are singletons?',
]

EXPLANATION = r"""
**1. Domains** (unary constraints applied): D1 = {C}, D2 = {B, C}, D3 = {A, B, C}, D4 = {A, B, C}, D5 = {B, C}.

**2. Constraints** — exams that overlap in time need different supervisors:
E1 ≠ E2, E2 ≠ E3, E2 ≠ E4, E3 ≠ E4, E3 ≠ E5, E4 ≠ E5 (E1 overlaps only E2; E2 ends at 11:00, before E5 starts).

**3. AC-3** — only three arcs change something:

| arc | effect |
|---|---|
| E2 → E1 | C has no support (D1 = {C}) → D2 = {B} |
| E3 → E2 | B has no support (D2 = {B}) → D3 = {A, C} |
| E4 → E2 | B has no support → D4 = {A, C} |

All the other arcs are already consistent. No arc is added after a revision because the arcs that should be
re-checked are **already in the queue** (e.g. after E2 shrinks, E3→E2 and E4→E2 have not been popped yet) — this is
the "why?" the official solution asks about. Final domains: D1 = {C}, D2 = {B}, D3 = {A, C}, D4 = {A, C},
D5 = {B, C}.

**4. Model answer:** *No domain is empty, so AC-3 has not proved the problem unsolvable: a solution **may** exist,
but arc consistency does not guarantee it (AC-3 only checks pairs of variables; see the triangle of p. 316). We
still have to search.* Here search succeeds immediately: E1 = C, E2 = B, {E3, E4} = {A, C} in either order, E5 = B
(two solutions).

> **Exam trap:** "no empty domain" ≠ "solution exists". Only an empty domain gives a definite answer (no solution).
"""

VIZ = 'csp'
CONFIG = {
    'variables': ['E1', 'E2', 'E3', 'E4', 'E5'],
    'domains': {'E1': ['C'], 'E2': ['B', 'C'], 'E3': ['A', 'B', 'C'], 'E4': ['A', 'B', 'C'], 'E5': ['B', 'C']},
    'constraints': [['E1', 'E2'], ['E2', 'E3'], ['E2', 'E4'], ['E3', 'E4'], ['E3', 'E5'], ['E4', 'E5']],
    'layout': {'E1': {'x': 0, 'y': 0, 'chips': 'below'}, 'E2': {'x': 160, 'y': 0, 'chips': 'below'},
               'E3': {'x': 320, 'y': -80, 'chips': 'above'}, 'E4': {'x': 320, 'y': 80, 'chips': 'below'},
               'E5': {'x': 480, 'y': 0, 'chips': 'below'}},
    'algorithm': 'ac3',
    'queue': [['E1', 'E2'], ['E2', 'E1'], ['E2', 'E3'], ['E3', 'E2'], ['E2', 'E4'], ['E4', 'E2'],
              ['E3', 'E4'], ['E4', 'E3'], ['E3', 'E5'], ['E5', 'E3'], ['E4', 'E5'], ['E5', 'E4']],
}
