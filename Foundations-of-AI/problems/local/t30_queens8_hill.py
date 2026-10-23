TITLE = 'Trace: 8-queens hill climbing from Figure 4.3(b)'
DIFFICULTY = 'medium'
KIND = 'trace'
TAGS = ['hill climbing', 'N-queens', 'local minimum', 'plateau', 'AIMA Fig. 4.3']

STATEMENT = r"""
Start from the state of AIMA Figure 4.3(b) (shown on p. 335): queens in rows (5, 6, 7, 4, 5, 6, 7, 6) for
columns 1–8 (row 1 = top), h = 17 attacking pairs. Every square shows the h of the state obtained by moving
that column's queen there — the numbers of the figure (8 moves tie at 12).

Run **steepest descent**: move to the neighbour with the lowest h; **ties → the first in column order, then
row order** (any tied move is accepted as an answer); stop when no neighbour is strictly better.
Predict each move by clicking its square, or *Stop*.
"""

HINTS = [
    'Steepest descent looks at ALL 56 neighbours and takes the minimum — not the first improving one.',
    'Several squares share the minimum: any of them is a correct prediction.',
    'Near the end, check whether the best number on the board is smaller than, or only equal to, the current h.',
]

EXPLANATION = r"""
h goes 17 → 12 → 7 → 3 → 2 → 1 and then **no neighbour has h < 1**: hill climbing stops with one attacking
pair left. The best neighbours have h = 1 too, so this is a **plateau**; with sideways moves the search wanders
along it (try *Sideways moves* in explore mode) and with **random restarts** it eventually finds h = 0.

Steepest descent is fast (5 steps here) but incomplete: from random 8-queens states it solves only about 14 %
of the instances; allowing up to 100 sideways moves raises that to about 94 % (AIMA §4.1.1).
"""

VIZ = 'local'
CONFIG = {'problem': 'queens', 'n': 8, 'start': [5, 6, 7, 4, 5, 6, 7, 6], 'algorithm': 'steepest',
          'maxSideways': 0, 'showCosts': True}
