TITLE = 'Trace: 4-queens as an optimization problem (slide p. 334)'
DIFFICULTY = 'easy'
KIND = 'trace'
TAGS = ['hill climbing', 'N-queens', 'heuristic h', 'hand simulation']

STATEMENT = r"""
Complete-state formulation: one queen per column; the queens start in rows (3, 2, 3, 2) for columns 1–4
(row 1 = top). The cost **h** is the number of **pairs of queens that attack each other** (same row or same
diagonal), directly or through other queens. The start has h = 5 (p. 334).

Run **steepest descent**: a neighbour moves ONE queen to another square of its column; evaluate all 12
neighbours and move to the one with the lowest h; stop when none is strictly better or when h = 0.
Click the square the queen moves to (or *Stop*). Ties: first by column, then by row (any tied move is accepted).
"""

HINTS = [
    'Count pairs, not queens: two queens on the same row are one pair, whatever lies between them.',
    'From h = 5, look for a move that breaks a row conflict and a diagonal conflict at the same time.',
    'Moving the queen of column 2 to row 1 gives h = 2.',
]

EXPLANATION = r"""
h = 5 → 2 → 0, exactly the slide's sequence: the queen of column 2 moves to row 1 (h = 2; moving column 3 to
row 4 ties), then the queen of column 3 moves to row 4. Rows (3, 1, 4, 2) have no attacking pair: h = 0,
a solution.

Here hill climbing solves the problem in two moves, but on 8-queens steepest descent from a random state gets
stuck about 86 % of the time (AIMA §4.1.1) — see the next trace.
"""

VIZ = 'local'
CONFIG = {'problem': 'queens', 'n': 4, 'start': [3, 2, 3, 2], 'algorithm': 'steepest'}
