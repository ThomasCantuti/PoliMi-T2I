TITLE = 'Trace: steepest-descent hill climbing on homes & hospitals (slides p. 322–330)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['hill climbing', 'steepest descent', 'local minimum', 'plateau', 'hand simulation']

STATEMENT = r"""
A 10 × 5 grid (rows 0–4 from the top, columns 0–9) has houses at (0, 8), (1, 2), (3, 1), (4, 6) and two
hospitals, initially at H1 = (0, 4) and H2 = (3, 9). The **cost** of a state is the sum, over the houses, of the
Manhattan distance to the **nearest** hospital: 4 + 3 + 6 + 4 = 17 (p. 324).

Run **steepest-descent hill climbing**: at each step evaluate **every** neighbour and move to the cheapest one;
stop when no neighbour is **strictly** cheaper. At each step click the cell the hospital moves to, or *Stop*.

Conventions:

- A **neighbour** moves ONE hospital by one cell up, down, left or right, staying inside the grid and not onto a
  house or the other hospital.
- **Ties:** the first move in the order H1 ↑ ↓ ← →, then H2 ↑ ↓ ← → (any tied move is accepted as an answer;
  the trace continues with the first one).
- The neighbour costs are hidden: compute them (*show neighbour costs* reveals them).
"""

HINTS = [
    'Moving a hospital one cell changes the distance of each house it serves by exactly ±1 — and a house may switch '
    'to the other hospital.',
    'From the start three moves reach 15: H1 down, H1 left, H2 left.',
    'At cost 11 look carefully: is any neighbour strictly better, or only equal?',
]

EXPLANATION = r"""
The costs go 17 → 15 → 13 → 11 and then hill climbing **stops at 11**: the best neighbours cost exactly 11
(e.g. H1 one cell down), none is strictly better. This is a **plateau / shoulder**, not the optimum: the global
minimum is **9** (e.g. H1 = (2, 2), H2 = (3, 8), the final picture of the slides).

Allowing **one sideways move** (explore mode → *Sideways moves*) walks across the plateau: H1 moves down
(cost still 11) and then left to (2, 2), reaching 9. Hill climbing is greedy and memoryless: it finds a local
optimum fast, but which one depends on the start (p. 330) — hence sideways moves and random restarts.
"""

VIZ = 'local'
CONFIG = {'problem': 'hospitals', 'width': 10, 'height': 5, 'houses': [[0, 8], [1, 2], [3, 1], [4, 6]],
          'hospitals': [[0, 4], [3, 9]], 'algorithm': 'steepest', 'maxSideways': 0}
