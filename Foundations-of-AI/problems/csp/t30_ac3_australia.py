TITLE = 'Trace: AC-3 finds the dead end forward checking missed (slides p. 290–293)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['arc consistency', 'AC-3', 'revise', 'hand simulation']

STATEMENT = r"""
Start from the domains of slide p. 290: WA = R and Q = G are assigned and forward checking left

NT = {B}, NSW = {R, B}, V = {R, G, B}, SA = {B}, T = {R, G, B}.

Run **AC-3**. For every arc popped from the queue predict what `revise(Xi, Xj)` removes from the **tail** `Xi`
(click the chips, or *Check* with nothing selected).

Conventions:

- `revise(Xi, Xj)` deletes each `x` in D(Xi) such that **no** `y` in D(Xj) satisfies `x ≠ y`.
- The queue is **FIFO**. To replay the slides it starts with NSW→V, NSW→SA, V→NSW, SA→NT, followed by all the
  other arcs.
- When D(Xi) shrinks (and is not empty), every arc (Xk, Xi) with Xk a neighbour of Xi other than Xj is appended —
  unless it is already in the queue.
- An empty domain stops AC-3 with **failure**.
"""

HINTS = [
    'An arc Xi → Xj can only remove a value x of Xi when D(Xj) is exactly {x}: with "≠" any other value of Xj supports x.',
    'NSW → V: V has three colors, so every color of NSW has a support.',
    'After NSW loses B it is {R}; now look at V → NSW.',
]

EXPLANATION = r"""
The slides' sequence: NSW→V is consistent; NSW→SA removes B from NSW (SA = {B}); V→NSW removes R from V
(NSW = {R}); SA→NT removes B from SA (NT = {B}) → **SA is empty** → AC-3 returns false.

So the partial assignment {WA = R, Q = G} cannot be extended — exactly the inconsistency forward checking
could not see (p. 286). The final outcome of AC-3 does not depend on the queue order (the arc-consistent
closure is unique); only the sequence of revisions does. Cost: each arc is re-inserted at most $d$ times and
`revise` is $O(d^2)$, so AC-3 is $O(n s d^3)$ (p. 295).
"""

VIZ = 'csp'
CONFIG = {
    'preset': 'australia', 'algorithm': 'ac3', 'assignment': {'WA': 'R', 'Q': 'G'},
    'domains': {'WA': ['R'], 'NT': ['B'], 'Q': ['G'], 'NSW': ['R', 'B'], 'V': ['R', 'G', 'B'], 'SA': ['B'],
                'T': ['R', 'G', 'B']},
    'queue': [['NSW', 'V'], ['NSW', 'SA'], ['V', 'NSW'], ['SA', 'NT']],
}
