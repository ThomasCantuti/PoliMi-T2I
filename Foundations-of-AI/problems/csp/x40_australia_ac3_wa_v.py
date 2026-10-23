TITLE = 'Exam · Jun 2025 · AC-3 proves {WA = G, V = R} inconsistent (Australia)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['exam', 'Jun 2025', 'AC-3', 'map coloring', 'hand simulation']

STATEMENT = r"""
*Written exam of 11 June 2025 — CSP and Uninformed Search, Question 1.*

Use **AC-3** to show that arc consistency detects the inconsistency of the partial assignment **{WA = G, V = R}** in
the Australia map-coloring problem seen in class (all the other variables have domains {R, G, B}).

```text
       NT --- Q
      /  \   / \
    WA -- SA -- NSW        T
            \   /
              V
```

AC-3 starts with the queue

  SA→WA, SA→V, NT→WA, NT→SA, NSW→SA, NSW→V, Q→NT, Q→SA, Q→NSW.

For every arc extracted from the queue, specify how the domains are modified and which arcs are added to the queue
(in the exam: a table with columns *arc · modification to the domains · arcs added*).

In the visualizer, predict what each `revise(Xi, Xj)` removes from the tail `Xi`.

Conventions: FIFO queue; after D(Xi) shrinks, append (Xk, Xi) for every neighbour Xk ≠ Xj **not already in the
queue**. The visualizer cannot start from a partial queue: after the 9 arcs above it also queues the 9 remaining
arcs, so it reports them as "already queued" instead of "added". The 9 revisions it performs are exactly those of the
exam; the *arcs added* column is in the explanation.
"""

HINTS = [
    'With "≠", Xi → Xj removes x from D(Xi) only when D(Xj) = {x}: SA → WA removes G, SA → V removes R.',
    'Arcs to re-queue after D(Xi) shrinks: (Xk, Xi) for the other neighbours Xk of Xi — unless already waiting in the queue.',
    'Count the colors left for Q at the end: its three neighbours NT, SA and NSW are all singletons by then.',
]

EXPLANATION = r"""
The official table (it matches the run step by step):

| arc | modification to the domains | arcs added to the queue |
|---|---|---|
| SA → WA | D(SA) = {R, B} | V → SA |
| SA → V | D(SA) = {B} | WA → SA |
| NT → WA | D(NT) = {R, B} | SA → NT |
| NT → SA | D(NT) = {R} | WA → NT |
| NSW → SA | D(NSW) = {R, G} | V → NSW |
| NSW → V | D(NSW) = {G} | SA → NSW |
| Q → NT | D(Q) = {G, B} | SA → Q, NSW → Q |
| Q → SA | D(Q) = {G} | NT → Q |
| Q → NSW | D(Q) = {} | stop: inconsistency detected |

Why only those arcs are added: after SA → WA, the arcs NT→SA, Q→SA, NSW→SA are already waiting, so only V → SA is
new; after SA → V, the missing one is WA → SA; and so on. (WA → SA and V → SA would not remove anything anyway: WA
and V are assigned.)

Q's three neighbours end up as NT = {R}, SA = {B}, NSW = {G}: Q has no color left, so **{WA = G, V = R} cannot be
extended to a solution** — forward checking alone would not see it (after WA = G and V = R it only shrinks the
neighbours of WA and V: no domain becomes empty).
"""

VIZ = 'csp'
CONFIG = {
    'preset': 'australia', 'algorithm': 'ac3', 'assignment': {'WA': 'G', 'V': 'R'},
    'domains': {'WA': ['G'], 'NT': ['R', 'G', 'B'], 'Q': ['R', 'G', 'B'], 'NSW': ['R', 'G', 'B'], 'V': ['R'],
                'SA': ['R', 'G', 'B'], 'T': ['R', 'G', 'B']},
    'queue': [['SA', 'WA'], ['SA', 'V'], ['NT', 'WA'], ['NT', 'SA'], ['NSW', 'SA'], ['NSW', 'V'],
              ['Q', 'NT'], ['Q', 'SA'], ['Q', 'NSW']],
}
