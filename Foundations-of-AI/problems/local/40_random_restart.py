import random

from harness import Test
from local_lib import queens_h

TITLE = 'Random-restart hill climbing for n-queens'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['random restart', 'hill climbing', 'n-queens', 'seeded randomness']

STATEMENT = r"""
Hill climbing gets stuck in local minima, but each climb is **cheap**. So: if at first you don't succeed,
try again from a new random state.

Write `random_restart(n, rng, max_restarts=100)` for n-queens → `(best_state, climbs)`:
- repeat at most `max_restarts` times:
  - draw a random state **exactly** as `tuple(rng.randint(1, n) for _ in range(n))` (column 1 first);
  - run `hill_climbing(state, queen_neighbors, queens_h)` from `local_lib` (no sideways moves);
  - append the **h of the final state** of that climb to `climbs`; stop as soon as it is 0;
- `best_state` is a final state with the lowest h seen.

`rng` is a `random.Random(seed)`: using it exactly as specified makes your run reproducible and testable.

**Example:** `random_restart(8, random.Random(0))` → climbs `[2, 0]`: the first climb gets stuck at h = 2,
the second one solves the puzzle.
"""

STARTER = '''from random import Random

from local_lib import hill_climbing, queen_neighbors, queens_h

def random_restart(n: int, rng: Random, max_restarts: int = 100) -> tuple[tuple[int, ...], list[int]]:
    """Return (best final state, list of the final h of every climb)."""
    best, climbs = None, []
    for _ in range(max_restarts):
        state = tuple(rng.randint(1, n) for _ in range(n))
        # TODO: climb, record, keep the best, stop on h == 0
    return best, climbs
'''

SOLUTION = '''from random import Random

from local_lib import hill_climbing, queen_neighbors, queens_h

def random_restart(n: int, rng: Random, max_restarts: int = 100) -> tuple[tuple[int, ...], list[int]]:
    """Return (best final state, list of the final h of every climb)."""
    best, climbs = None, []
    for _ in range(max_restarts):
        state = tuple(rng.randint(1, n) for _ in range(n))
        final = hill_climbing(state, queen_neighbors, queens_h)[-1]
        climbs.append(queens_h(final))
        if best is None or climbs[-1] < queens_h(best):
            best = final
        if climbs[-1] == 0:
            break
    return best, climbs
'''

HINTS = [
    '`hill_climbing(...)` returns the whole path: the final state is `path[-1]`.',
    'After each climb: `climbs.append(queens_h(final))`; update `best` only on a **strictly** lower h; `break` when h is 0.',
]

EXPLANATION = r"""
**Why it works.** If one climb succeeds with probability $p$, the number of climbs until the first success is
geometric with mean $1/p$. For 8-queens steepest descent succeeds about 14% of the time (measured here: 14.8%),
so about **7 climbs** are expected – each only ~4–5 steps long. The spread is large: seeds 0–4 need 2, 4, 12, 3
and 26 climbs.

**Complete in the limit.** With unlimited restarts the probability of never generating a state from which the
climb reaches a solution goes to 0, so random-restart hill climbing finds a solution with probability → 1
(when one exists: 3-queens has none, and every climb ends at h ≥ 1).

**Seeded randomness.** Passing a `random.Random(seed)` instead of using the global `random` module makes every
run reproducible: the same seed gives the same restarts, which is what lets the tests check your exact trace.
"""

ENTRY = 'random_restart'


def _check(expected_climbs, expected_best_h=0):
    def check(got, n, rng, *rest):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (best_state, climbs).'
        best, climbs = got
        if list(climbs) != expected_climbs:
            return False, (f'climbs should be {expected_climbs}, got {list(climbs)}. Draw each start as '
                           'tuple(rng.randint(1, n) for _ in range(n)) and use local_lib.hill_climbing without sideways moves.')
        if best is None or len(best) != n or queens_h(tuple(best)) != expected_best_h:
            return False, f'best_state should be an {n}-queens state with h = {expected_best_h}, got {best}'
        return True
    return check


TESTS = [
    Test('8-queens, seed 0', args=(8, random.Random(0)), check=_check([2, 0]), show='random_restart(8, Random(0))'),
    Test('8-queens, seed 1', args=(8, random.Random(1)), check=_check([1, 1, 1, 0]), show='random_restart(8, Random(1))'),
    Test('8-queens, seed 2', args=(8, random.Random(2)), check=_check([1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 0]),
         show='random_restart(8, Random(2))'),
    Test('8-queens, seed 2, only 3 restarts', args=(8, random.Random(2), 3), check=_check([1, 2, 1], 1),
         show='random_restart(8, Random(2), max_restarts=3): keep the best (h = 1)'),
    Test('4-queens, seed 0', args=(4, random.Random(0)), check=_check([0]), show='random_restart(4, Random(0))'),
    Test('3-queens has no solution', args=(3, random.Random(5), 6),
         check=lambda got, *a: (isinstance(got, tuple) and len(got[1]) == 6 and min(got[1]) >= 1
                                and queens_h(tuple(got[0])) == min(got[1]),
                                'All 6 climbs must fail (h >= 1) and best_state must have the lowest h.'),
         show='random_restart(3, Random(5), max_restarts=6)'),
]
