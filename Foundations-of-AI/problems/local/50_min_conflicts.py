import random

from harness import Test
from local_lib import queens_h

TITLE = 'Min-conflicts: local search for CSPs'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['min-conflicts', 'CSP as optimization', 'n-queens', 'seeded randomness']

STATEMENT = r"""
**Min-conflicts** applies the idea of p. 333 ("start from an infeasible solution and modify it a little bit")
to any CSP: repeatedly pick a **conflicted** variable at random and give it the value that **minimizes** its
number of conflicts.

Write `min_conflicts(state, rng, max_steps=1000)` for n-queens (`state[i]` = row 1..n of the queen in column `i+1`)
→ `(final_state, steps)`. Follow this recipe **exactly** (it fixes how `rng` is used):

```text
current <- list(state)
for step = 0, 1, ..., max_steps-1:
    conflicted <- columns c (in increasing order) whose queen is attacked by at least one other queen
    if conflicted is empty: return (tuple(current), step)
    col <- rng.choice(conflicted)
    for every row r = 1..n: count the queens (other than col's) attacking square (r, col)
    current[col] <- rng.choice(rows with the minimum count, in increasing order)
return (tuple(current), max_steps)
```

The current row is a candidate too (the queen may stay where it is). `steps` = number of moves made.

**Example:** from the slide's 4-queens state `(3, 2, 3, 2)` with `random.Random(0)` →
`((2, 4, 1, 3), 7)`.
"""

STARTER = '''from random import Random

def conflicts(state: list[int], col: int, row: int) -> int:
    """Number of queens (other than the one in col) attacking square (row, col)."""
    # TODO
    return 0

def min_conflicts(state: tuple[int, ...], rng: Random, max_steps: int = 1000) -> tuple[tuple[int, ...], int]:
    current = list(state)
    n = len(current)
    for step in range(max_steps):
        # TODO
        pass
    return tuple(current), max_steps
'''

SOLUTION = '''from random import Random

def conflicts(state: list[int], col: int, row: int) -> int:
    """Number of queens (other than the one in col) attacking square (row, col)."""
    return sum(1 for c, r in enumerate(state)
               if c != col and (r == row or abs(r - row) == abs(c - col)))

def min_conflicts(state: tuple[int, ...], rng: Random, max_steps: int = 1000) -> tuple[tuple[int, ...], int]:
    current = list(state)
    n = len(current)
    for step in range(max_steps):
        conflicted = [c for c in range(n) if conflicts(current, c, current[c]) > 0]
        if not conflicted:
            return tuple(current), step
        col = rng.choice(conflicted)
        counts = {r: conflicts(current, col, r) for r in range(1, n + 1)}
        best = min(counts.values())
        current[col] = rng.choice([r for r in range(1, n + 1) if counts[r] == best])
    return tuple(current), max_steps
'''

HINTS = [
    'First write `conflicts(state, col, row)`: loop over the other columns `c` and count `r == row or abs(r - row) == abs(c - col)`.',
    'A column is conflicted iff `conflicts(current, c, current[c]) > 0`. Build the list in increasing column order.',
    'Exactly two `rng.choice` calls per step: one for the column, one among the best rows (`[r for r in range(1, n + 1) if count == best]`).',
]

EXPLANATION = r"""
Min-conflicts is hill climbing on $h$ restricted to **one variable at a time**, with randomness in *which*
variable and in tie-breaking. Each step costs $O(n^2)$ instead of evaluating all $n(n-1)$ neighbors, and random
tie-breaking lets it wander across plateaus (sideways moves come for free).

It is astonishingly effective on n-queens: the number of steps barely grows with $n$ (here ~100–300 steps for
n = 50…200; AIMA reports ~50 steps for a **million** queens with a greedy initial state). Solutions are dense in
the state space, so there is almost always a good move nearby.

But it is **still local search**: from Figure 4.3(a) (h = 1) both conflicted queens are already on their
unique min-conflicts row, so nothing ever changes – the same trap that stops hill climbing. Fixes: random
restarts, random walk steps, or simulated annealing (beyond the course slides).

Compare with backtracking: min-conflicts starts from a complete but **infeasible** assignment and repairs it;
backtracking extends a **consistent** partial assignment. Min-conflicts cannot prove that no solution exists.
"""

ENTRY = 'min_conflicts'


def _check(expected_state=None, expected_steps=None):
    def check(got, state, rng, *rest):
        if not (isinstance(got, tuple) and len(got) == 2):
            return False, 'Return a pair (final_state, steps).'
        final, steps = tuple(got[0]), got[1]
        if expected_state is not None and (final, steps) != (expected_state, expected_steps):
            return False, (f'expected ({expected_state}, {expected_steps}), got ({final}, {steps}). Use rng exactly as in '
                           'the recipe: rng.choice(conflicted columns), then rng.choice(best rows), both lists in increasing order.')
        if expected_state is None and queens_h(final) != 0:
            return False, f'not solved: h = {queens_h(final)} after {steps} steps'
        return True
    return check


_R50 = random.Random(50)
_START50 = tuple(_R50.randint(1, 50) for _ in range(50))

TESTS = [
    Test('slide 4-queens, seed 0', args=((3, 2, 3, 2), random.Random(0)), check=_check((2, 4, 1, 3), 7),
         show='min_conflicts((3,2,3,2), Random(0))'),
    Test('slide 4-queens, seed 1', args=((3, 2, 3, 2), random.Random(1)), check=_check((3, 1, 4, 2), 2),
         show='min_conflicts((3,2,3,2), Random(1))'),
    Test('already a solution: 0 steps', args=((2, 4, 1, 3), random.Random(0)), check=_check((2, 4, 1, 3), 0),
         show='min_conflicts((2,4,1,3), Random(0))'),
    Test('Figure 4.3(b), seed 0', args=((5, 6, 7, 4, 5, 6, 7, 6), random.Random(0)),
         check=_check((3, 6, 2, 7, 5, 1, 8, 4), 12), show='h = 17 start'),
    Test('all queens on one row', args=((4,) * 8, random.Random(0)), check=_check((5, 8, 4, 1, 7, 2, 6, 3), 18),
         show='(4,4,4,4,4,4,4,4), Random(0)'),
    Test('Figure 4.3(a): trapped in a local minimum', args=((8, 3, 7, 4, 2, 5, 1, 6), random.Random(3), 50),
         check=_check((8, 3, 7, 4, 2, 5, 1, 6), 50), show='h = 1 start, max_steps=50: nothing ever changes'),
    Test('50 queens from a random state', args=(_START50, random.Random(0), 2000), check=_check(),
         show='random 50-queens start, solved well within 2000 steps'),
    Test('200 queens, all on row 1', args=((1,) * 200, random.Random(0), 3000), check=_check(),
         show='h = 19900 at the start', timeout=10),
]
