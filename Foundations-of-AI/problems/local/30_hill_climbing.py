from harness import Test
from local_lib import HOUSES, ROWS, COLS, START, queens_h, queen_neighbors

TITLE = 'Hill climbing: local optima, shoulders and sideways moves'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['hill climbing', 'steepest descent', 'local optimum', 'plateau', 'sideways moves']

STATEMENT = r"""
The hill-climbing algorithm of slide p. 321 – written for **minimizing a cost** (steepest descent):

```text
function HILL-CLIMBING(problem) returns a state that is a local optimum
    current <- problem.INITIAL
    while true do
        neighbor <- a lowest-cost successor state of current
        if COST(neighbor) >= COST(current) then return current
        current <- neighbor
```

Write `hill_climbing(initial, neighbors, cost, max_sideways=0)` that returns the **list of visited states**
(`[initial, ..., final]`):
- `neighbors(state)` returns a list of states, `cost(state)` a number;
- the best neighbor is the **first** one of minimum cost in the order given by `neighbors` (Python's `min`);
- move if it is strictly better; **also** move if it is *equal* and fewer than `max_sideways` **consecutive**
  sideways moves have been made (the counter resets after an improving move); otherwise stop;
- stop as well when there are no neighbors.

With `max_sideways=0` this is exactly the slide algorithm. On the slide's 4-queens run (p. 334) your path must be
`[(3,2,3,2), (3,1,3,2), (3,1,4,2)]` with $h = 5, 2, 0$.
"""

STARTER = '''from collections.abc import Callable
from typing import Any

def hill_climbing(initial: Any, neighbors: Callable[[Any], list], cost: Callable[[Any], float],
                  max_sideways: int = 0) -> list:
    """Steepest descent. Returns the list of visited states."""
    path = [initial]
    # TODO: loop: best neighbor, move or stop
    return path
'''

SOLUTION = '''from collections.abc import Callable
from typing import Any

def hill_climbing(initial: Any, neighbors: Callable[[Any], list], cost: Callable[[Any], float],
                  max_sideways: int = 0) -> list:
    """Steepest descent. Returns the list of visited states."""
    path, sideways = [initial], 0
    while True:
        current = path[-1]
        options = neighbors(current)
        if not options:
            return path
        best = min(options, key=cost)
        if cost(best) < cost(current):
            sideways = 0
        elif cost(best) == cost(current) and sideways < max_sideways:
            sideways += 1
        else:
            return path
        path.append(best)
'''

HINTS = [
    'Each iteration looks only at the neighbors of the **current** state: no frontier, no memory of the past.',
    '`best = min(options, key=cost)` gives the first lowest-cost neighbor. Compare `cost(best)` with `cost(path[-1])`.',
    'Three cases: better → reset `sideways = 0` and move; equal and `sideways < max_sideways` → `sideways += 1` and move; otherwise `return path`.',
]

EXPLANATION = r"""
Hill climbing is greedy: it never looks further than the immediate neighbors, so it stops at the first state
with no better neighbor – a **local** optimum (p. 330). What the tests show:

| start | result | why |
|---|---|---|
| 4-queens (3,2,3,2) | h: 5 → 2 → 0 | lucky: a solution |
| hospitals (p. 324) | cost: 17 → 15 → 13 → **11**, stop | **shoulder**: the best neighbor of (1,3),(3,8) also costs 11 |
| hospitals, 1 sideways move | 17 → 15 → 13 → 11 → 11 → **9** | crossing the flat part reaches the global optimum 9 (p. 329) |
| 8-queens Fig. 4.3(b) | h: 17 → 12 → 7 → 3 → 2 → **1**, stop | local minimum after 5 moves |
| 8-queens Fig. 4.3(a) | stays at h = 1 | every one of its 56 neighbors is worse |

The slides' jump from 11 to 9 (p. 328 → 329) is not one move of a single cell: with these neighbors you need a
**sideways move** first. Landscape features (Figure 4.1, p. 331): **local maxima/minima**, **plateaus** (flat
local optima or **shoulders** that lead somewhere), and ridges. From random 8-queens states, steepest descent
solves only ≈ 14% of the instances – but it takes just a handful of steps either way.

Sideways moves need a limit: on a flat local optimum they would go on forever (or bounce between two states,
as the deterministic "first best" rule does).
"""

ENTRY = 'hill_climbing'


def _hcost(h):
    return sum(min(abs(r - a) + abs(c - b) for a, b in h) for r, c in HOUSES)


def _hneighbors(h):
    out = []
    for i, (r, c) in enumerate(h):
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            cell = (r + dr, c + dc)
            if 0 <= cell[0] < ROWS and 0 <= cell[1] < COLS and cell not in HOUSES and cell not in h:
                out.append(h[:i] + (cell,) + h[i + 1:])
    return out


def _landscape(values):
    """A 1-D objective to MAXIMIZE (Figure 4.1 in miniature): states are indices, neighbors i+1 then i-1."""
    return (lambda i: [j for j in (i + 1, i - 1) if 0 <= j < len(values)]), (lambda i: -values[i])


_LAND = [1, 2, 3, 5, 5, 5, 8, 9, 4, 2, 6, 7, 3]
_lneighbors, _lcost = _landscape(_LAND)
_LAND2 = [1, 3, 3, 4, 6, 6, 8]   # two short shoulders
_l2neighbors, _l2cost = _landscape(_LAND2)


def _path(expected, f=None):
    def check(got, *args):
        got = [tuple(s) if isinstance(s, (list, tuple)) else s for s in got]
        if got != expected:
            costs = [f(s) for s in got] if f else ''
            return False, f'expected the path {expected}, got {got} {costs}'
        return True
    return check


def _hospitals_sideways(got, *args):
    costs = [_hcost(s) for s in got]
    if costs[:6] != [17, 15, 13, 11, 11, 9] or costs[-1] != 9:
        return False, f'costs along your path: {costs}; expected to start 17, 15, 13, 11, 11, 9 and end at 9'
    return True


TESTS = [
    Test('4-queens, slide p. 334', args=((3, 2, 3, 2), queen_neighbors, queens_h),
         check=_path([(3, 2, 3, 2), (3, 1, 3, 2), (3, 1, 4, 2)], queens_h),
         show='(3,2,3,2), h = attacking pairs: two neighbors tie at h = 2, take the first'),
    Test('hospitals: stuck on a shoulder', args=(START, _hneighbors, _hcost),
         check=_path([((0, 4), (3, 9)), ((1, 4), (3, 9)), ((1, 3), (3, 9)), ((1, 3), (3, 8))], _hcost),
         show='slide p. 324 start, cost 17'),
    Test('hospitals: one sideways move reaches 9', args=(START, _hneighbors, _hcost, 1), check=_hospitals_sideways,
         show='same start, max_sideways=1'),
    Test('8-queens Figure 4.3(b)', args=((5, 6, 7, 4, 5, 6, 7, 6), queen_neighbors, queens_h),
         check=lambda got, *a: ([queens_h(s) for s in got] == [17, 12, 7, 3, 2, 1] and tuple(got[-1]) == (3, 1, 7, 4, 2, 5, 8, 6),
                                f'h along your path: {[queens_h(s) for s in got]}; expected 17, 12, 7, 3, 2, 1 ending in (3, 1, 7, 4, 2, 5, 8, 6)'),
         show='(5,6,7,4,5,6,7,6), h = 17'),
    Test('8-queens Figure 4.3(a): a local minimum', args=((8, 3, 7, 4, 2, 5, 1, 6), queen_neighbors, queens_h),
         check=_path([(8, 3, 7, 4, 2, 5, 1, 6)]), show='(8,3,7,4,2,5,1,6), h = 1'),
    Test('landscape: stops on the shoulder', args=(1, _lneighbors, _lcost), check=_path([1, 2, 3]),
         show=f'values {_LAND}, start at index 1, maximize'),
    Test('landscape: 1 sideways move is not enough', args=(1, _lneighbors, _lcost, 1), check=_path([1, 2, 3, 4]),
         show='same, max_sideways=1'),
    Test('landscape: 2 sideways moves cross the shoulder', args=(1, _lneighbors, _lcost, 2),
         check=_path([1, 2, 3, 4, 5, 6, 7]), show='same, max_sideways=2'),
    Test('landscape: the sideways counter resets after an improvement', args=(0, _l2neighbors, _l2cost, 1),
         check=_path([0, 1, 2, 3, 4, 5, 6]),
         show=f'values {_LAND2}, start 0, max_sideways=1: two separate shoulders, one sideways move each'),
    Test('landscape: a local maximum', args=(10, _lneighbors, _lcost, 5), check=_path([10, 11]),
         show='start at index 10, max_sideways=5'),
]
