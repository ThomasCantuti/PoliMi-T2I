from collections import deque
from harness import Test

TITLE = 'Exam · Jun 2025 · Optimal paths from every cell of a maze by repeated A*'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['exam', 'Jun 2025', 'A*', 'reuse of solutions', 'principle of optimality', 'maze']

STATEMENT = r"""
*Written exam of 11 June 2025 — Problem 1 (Informed Search), Question 2.*

A rational agent must reach the **exit** of a maze from **any** position. The maze is discrete, fully observable and
deterministic; the agent knows all the $N$ free cells and moves in 4 directions, each move costs 1. A colleague
proposes to *apply A\* several times to compute the optimal path to the exit from all the states and memorize them*,
with the **Euclidean distance** as heuristic.

> Write the pseudo-code to implement the solution proposed by your colleague in the most efficient way.
> *Hint: do you need to compute all the shortest paths starting from scratch?*

Implement it: `costs_to_exit(rows)` returns `(cost, runs)` where `cost[cell]` is the optimal number of moves from
`cell` to the exit for **every** free cell (the exit included, cost 0) and `runs` is the number of A\* searches you
ran. Cells are `(row, col)`, `'#'` is a wall, `'.'` a free cell, `'X'` the exit (free).

```text
     012345678
  0  ####X####
  1  #.......#
  2  #.###.#.#
  3  #...#.#.#
  4  ###.#.#.#
  5  #...#...#
  6  #.#####.#
  7  #.......#
  8  #########
```

Requirements:

- **Reuse**: do not run A\* from scratch for every cell (34 free cells here). Once an optimal path is known, every
  cell on it has its optimal cost too. The tests check `runs < N - 1`.
- **Optimality**: an A\* search may stop as soon as it selects a cell whose cost is already known — but it must
  still return the cheapest route **to the exit**, not just to the nearest known cell.

Use the course `astar_search` (from `informed_lib`) on the `Problem` subclass of the starter; `math.dist` gives the
Euclidean distance. Any processing order is fine; starting from the cells **farthest** from the exit reuses the most.
"""

STARTER = '''import math
from aima import Problem, Node, path_states
from informed_lib import astar_search

MOVES = ((-1, 0), (0, 1), (1, 0), (0, -1))  # N, E, S, W

class ToKnown(Problem):
    """Move from `initial` until a cell whose cost to the exit is already known."""

    def __init__(self, free: set, start: tuple, known: dict, exit_: tuple):
        super().__init__(start, None, free=free, known=known, exit=exit_)

    def actions(self, s):
        return [m for m in MOVES if (s[0] + m[0], s[1] + m[1]) in self.free]

    def result(self, s, a):
        return (s[0] + a[0], s[1] + a[1])

    def is_goal(self, s):
        # TODO
        return False

    def h(self, node: Node) -> float:
        # TODO: an estimate of the cost from node.state to the EXIT (admissible!)
        return 0


def costs_to_exit(rows: list[str]) -> tuple[dict, int]:
    free = {(r, c) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch != '#'}
    exit_ = next((r, c) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch == 'X')
    known = {exit_: 0}
    runs = 0
    # TODO: for every cell without a known cost, run A* (ToKnown), then store the cost of every cell on the path
    return known, runs
'''

SOLUTION = '''import math
from aima import Problem, Node, path_states
from informed_lib import astar_search

MOVES = ((-1, 0), (0, 1), (1, 0), (0, -1))  # N, E, S, W

class ToKnown(Problem):
    """Move from `initial` until a cell whose cost to the exit is already known."""

    def __init__(self, free: set, start: tuple, known: dict, exit_: tuple):
        super().__init__(start, None, free=free, known=known, exit=exit_)

    def actions(self, s):
        return [m for m in MOVES if (s[0] + m[0], s[1] + m[1]) in self.free]

    def result(self, s, a):
        return (s[0] + a[0], s[1] + a[1])

    def is_goal(self, s):
        return s in self.known                  # the rest of the way is already solved

    def h(self, node: Node) -> float:
        s = node.state
        if s in self.known:                     # exact remaining cost: f = g + known = cost of the whole route
            return self.known[s]
        return math.dist(s, self.exit)          # admissible estimate everywhere else


def costs_to_exit(rows: list[str]) -> tuple[dict, int]:
    free = {(r, c) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch != '#'}
    exit_ = next((r, c) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch == 'X')
    known = {exit_: 0}
    runs = 0
    for cell in sorted(free, key=lambda s: -math.dist(s, exit_)):   # farthest first: long paths, more reuse
        if cell in known:                       # already on a previously found optimal path
            continue
        path = path_states(astar_search(ToKnown(free, cell, known, exit_)))
        runs += 1
        cost = known[path[-1]]
        for s in reversed(path[:-1]):           # every suffix of an optimal path is optimal
            cost += 1
            known[s] = cost
    return known, runs
'''

HINTS = [
    'Principle of optimality: if S → … → n → … → exit is optimal for S, its suffix from n is optimal for n. So after '
    'one A* run you know the cost of **every** cell on the path, and later searches can stop at any of them.',
    'Goal test: `s in self.known`. Then, walking the returned path backwards from its last cell, '
    '`known[s] = known[next] + 1`.',
    'Trap: with $h$ = Euclidean distance everywhere, A* may select a known cell that is close to the exit as the crow '
    'flies but far along the maze (e.g. on the bottom corridor, just below a wall). Give known cells their **exact** '
    'remaining cost, `h = known[s]`: then $f = g + h$ of a known cell is the cost of the complete route, and the goal '
    'test on selection keeps A* optimal.',
]

EXPLANATION = r"""
**Model pseudo-code** (official solution, with the fix discussed below):

```text
Known = {Exit: 0}                      # cells whose optimal cost to the exit is known
repeat
    pick a cell S not in Known (randomly; better: the farthest from the exit)
    P = A*(S, goal = "any cell in Known", h(n) = Known[n] if n in Known else Euclidean(n, Exit))
    for each cell n of P, from the end:  Known[n] = Known[next(n)] + 1
until every free cell is in Known
```

Motivation: every suffix of an optimal path is optimal (otherwise the whole path could be improved), so one search
gives the optimal path of all the cells it crosses, and the following searches become shorter and shorter because
they stop at the first known cell. On this maze: 6 searches (farthest cells first) or 24 (row by row) instead of 33.

**About the official pseudo-code.** It says *"apply A\* to compute the optimal path P from S to one of the
ProcessedStates"*. Taken literally (goal = any processed state, $h$ = Euclidean distance) it is **not** optimal: on
this maze the bottom-corridor cell (7, 3) stops at the known cell (7, 2) — Euclidean distance 7.3 from the exit,
but 15 moves away — and gets 16 instead of 14 (with either processing order). The
search must keep minimizing the cost **to the exit**: using the stored cost as the exact $h$ of a known cell does
it, and is still admissible.

The truly cheapest solution needs no A\* at all: one breadth-first search **backwards from the exit** gives every
cost in $O(N)$ — but the question asks to implement the colleague's A\*-based idea.
"""

ENTRY = 'costs_to_exit'

_MAZE = ['####X####',
         '#.......#',
         '#.###.#.#',
         '#...#.#.#',
         '###.#.#.#',
         '#...#...#',
         '#.#####.#',
         '#.......#',
         '#########']
_OPEN = ['..#X...',
         '...#.#.',
         '.#.....',
         '..##..#',
         '.......']
_CORRIDOR = ['#X#', '#.#', '#.#', '#.#']


def _bfs(rows):
    free = {(r, c) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch != '#'}
    exit_ = next((r, c) for r, row in enumerate(rows) for c, ch in enumerate(row) if ch == 'X')
    d, q = {exit_: 0}, deque([exit_])
    while q:
        r, c = q.popleft()
        for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):
            t = (r + dr, c + dc)
            if t in free and t not in d:
                d[t] = d[(r, c)] + 1
                q.append(t)
    return d


def _check_costs(rows, max_runs=None):
    want = _bfs(rows)

    def check(got, *args):
        if not (isinstance(got, (tuple, list)) and len(got) == 2):
            return False, 'return a tuple (cost, runs)'
        cost, runs = got
        missing = sorted(set(want) - set(cost))
        if missing:
            return False, f'no cost for {missing[:5]}'
        wrong = [(s, cost[s], want[s]) for s in sorted(want) if cost[s] != want[s]]
        if wrong:
            s, a, b = wrong[0]
            return False, (f'{len(wrong)} wrong costs, e.g. cost[{s}] = {a} but the optimum is {b}: did a search stop '
                           f'at a known cell without counting its real cost to the exit?')
        if max_runs is not None and runs > max_runs:
            return False, f'{runs} A* runs for {len(want)} cells: reuse the paths you already found'
        return True, f'all {len(want)} costs optimal, {runs} A* runs'
    return check


TESTS = [
    Test('the maze above', args=(_MAZE,), check=_check_costs(_MAZE, max_runs=len(_bfs(_MAZE)) - 2),
         show='9 x 9 maze, exit at (0, 4)'),
    Test('an open area', args=(_OPEN,), check=_check_costs(_OPEN, max_runs=len(_bfs(_OPEN)) - 2),
         show=' / '.join(_OPEN)),
    Test('a dead-end corridor', args=(_CORRIDOR,), check=_check_costs(_CORRIDOR),
         show=' / '.join(_CORRIDOR)),
    Test('only the exit', args=(['X'],), expected=({(0, 0): 0}, 0), show="['X']"),
]
