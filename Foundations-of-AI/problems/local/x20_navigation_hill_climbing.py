import itertools
from harness import Test
from local_lib import hill_climbing

TITLE = 'Exam · Jan 2023 · Grid navigation as a hill-climbing problem'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Jan 2023', 'hill climbing', 'complete-state formulation', 'local minimum', 'sideways moves']

STATEMENT = r"""
*Written exam of 18 January 2023 — Problem 2, Question 3:* "How would you model the same navigation task as a
hill-climbing problem?" The official answer: the candidate is an **entire solution**, a sequence of actions of a
maximum length; **neighbours** change one action of the sequence; the **evaluation function** is the heuristic used
for A\*. Make that answer concrete and see how hill climbing behaves on it.

```text
       1   2   3          S = (1, 1)   G = (3, 3)   # = obstacle in (2, 2)
  1    S   .   .          moves N (row - 1), E (col + 1), S (row + 1), W (col - 1)
  2    .   #   .
  3    .   .   G
```

A **plan** is a string of moves such as `'EESS'`. Implement:

1. `plan_cost(plan)`: execute the plan from S; a move into the obstacle or off the grid **leaves the agent where it
   is**; return the **Manhattan distance** between the final cell and G (0 = the plan reaches G).
2. `plan_neighbors(plan)`: all the plans that differ in exactly **one** move, ordered by position (first move
   first) and, at each position, by the move order `N, E, S, W` (skipping the move already there). A 4-move plan has
   12 neighbours.

The tests run the course `hill_climbing(initial, neighbors, cost, max_sideways=0)` of `local_lib` (steepest
descent, first best neighbour on ties) with your two functions.
"""

STARTER = '''FREE = {(r, c) for r in (1, 2, 3) for c in (1, 2, 3)} - {(2, 2)}
START, GOAL = (1, 1), (3, 3)
MOVES = {'N': (-1, 0), 'E': (0, 1), 'S': (1, 0), 'W': (0, -1)}

def plan_cost(plan: str) -> int:
    """Manhattan distance from G of the cell where the plan ends (blocked moves leave the agent in place)."""
    # TODO
    return 0

def plan_neighbors(plan: str) -> list[str]:
    """Plans that differ in one move: position by position, moves in the order N, E, S, W."""
    # TODO
    return []
'''

SOLUTION = '''FREE = {(r, c) for r in (1, 2, 3) for c in (1, 2, 3)} - {(2, 2)}
START, GOAL = (1, 1), (3, 3)
MOVES = {'N': (-1, 0), 'E': (0, 1), 'S': (1, 0), 'W': (0, -1)}

def plan_cost(plan: str) -> int:
    """Manhattan distance from G of the cell where the plan ends (blocked moves leave the agent in place)."""
    r, c = START
    for m in plan:
        dr, dc = MOVES[m]
        if (r + dr, c + dc) in FREE:
            r, c = r + dr, c + dc
    return abs(r - GOAL[0]) + abs(c - GOAL[1])

def plan_neighbors(plan: str) -> list[str]:
    """Plans that differ in one move: position by position, moves in the order N, E, S, W."""
    return [plan[:i] + m + plan[i + 1:] for i in range(len(plan)) for m in 'NESW' if m != plan[i]]
'''

HINTS = [
    'Cost: walk the plan from `START`, moving only when the next cell is in `FREE`; then `abs(dr) + abs(dc)` to `GOAL`.',
    'Neighbours: a comprehension over the positions `i` and the moves `m in "NESW"` with `m != plan[i]`: '
    '`plan[:i] + m + plan[i + 1:]`.',
    'From `ESES` (E, then S into the obstacle, E, S) the agent ends in (2, 3): cost 1. Is any single change strictly better?',
]

EXPLANATION = r"""
**The formulation works but the landscape is rugged.** Of the $4^4 = 256$ plans only `EESS` and `SSEE` have cost 0,
and 26 plans are **local minima**: no single change improves them. Steepest descent solves the problem from only
123 of the 256 starting plans.

| start | hill climbing (steepest descent) | |
|---|---|---|
| `NNNN` (4) | `ENNN` 3 → `EENN` 2 → `EENS` 1 → `EESS` **0** | solved |
| `NWNW` (4) | `NWSW` 3 → `SWSW` 2 → `SWSE` **1** | stuck: local minimum |
| `ESES` (1) | — | stuck at once |
| `ESES`, 5 sideways moves | `SSES` 1 → `SSEE` **0** | the plateau is crossed |

`ESES` tries to cut through the obstacle: fixing it needs **two** changes (first move to S, then last move to E), and
every single change keeps or worsens the cost. This is the exam point: in
local search the state is a whole candidate solution, and the quality of the method depends on the neighbourhood
and the evaluation function. Remedies: sideways moves, random restarts (≈ 2 climbs on average here, since about
half of the starts succeed), or a richer evaluation (e.g. also count the blocked moves).

Compare with A\* on the same grid: it explores partial paths, needs a frontier, and is complete and optimal.
"""

ENTRY = 'plan_cost'

_ALL4 = [''.join(p) for p in itertools.product('NESW', repeat=4)]


def _climb(start, sideways=0):
    def call(sol):
        return hill_climbing(start, sol.plan_neighbors, sol.plan_cost, max_sideways=sideways)
    return call


def _local_minima(sol):
    return sum(1 for p in _ALL4
               if sol.plan_cost(p) > 0 and min(sol.plan_cost(n) for n in sol.plan_neighbors(p)) >= sol.plan_cost(p))


TESTS = [
    Test('a solution', args=('EESS',), expected=0),
    Test('the other solution', args=('SSEE',), expected=0),
    Test('bumping into the obstacle', args=('ESES',), expected=1, show="'ESES' ends in (2, 3)"),
    Test('bumping into the border', args=('NNNN',), expected=4, show="'NNNN' never moves"),
    Test('a longer plan', args=('EEEESSSS',), expected=0, show="'EEEESSSS' (extra moves are blocked)"),
    Test('neighbours of EESS', call=lambda sol: sol.plan_neighbors('EESS'),
         expected=['NESS', 'SESS', 'WESS', 'ENSS', 'ESSS', 'EWSS', 'EENS', 'EEES', 'EEWS', 'EESN', 'EESE', 'EESW'],
         show="plan_neighbors('EESS')"),
    Test('hill climbing from NNNN', call=_climb('NNNN'), expected=['NNNN', 'ENNN', 'EENN', 'EENS', 'EESS'],
         show="hill_climbing('NNNN', plan_neighbors, plan_cost)"),
    Test('hill climbing from NWNW gets stuck', call=_climb('NWNW'), expected=['NWNW', 'NWSW', 'SWSW', 'SWSE'],
         show="hill_climbing('NWNW', ...): local minimum with cost 1"),
    Test('sideways moves cross the plateau', call=_climb('ESES', 5), expected=['ESES', 'SSES', 'SSEE'],
         show="hill_climbing('ESES', ..., max_sideways=5)"),
    Test('how many 4-move plans are local minima?', call=_local_minima, expected=26,
         show='plans with cost > 0 and no strictly better neighbour'),
]
