from collections import deque

from harness import Test
from aima import EightPuzzle
from informed_lib import Instrumented, astar_search

TITLE = '8-puzzle heuristics: misplaced tiles h1 and Manhattan h2'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['heuristic', '8-puzzle', 'relaxed problem', 'admissibility', 'dominance']

STATEMENT = r"""
A **heuristic** $h(n)$ estimates the cost of the cheapest path from $n$ to a goal. For the
8-puzzle the course uses two classics (slides p. 181):

- $h_1(n)$ = number of **misplaced tiles**;
- $h_2(n)$ = sum of the **Manhattan distances** of every tile from its goal square
  (horizontal + vertical moves only).

The **blank is not a tile**: never count it.

A state is a tuple of 9 ints read row by row, `0` is the blank, and index `i` is at
row `i // 3`, column `i % 3`. Implement `h1(state, goal)` and `h2(state, goal)`
(the default goal is `(1, 2, 3, 4, 5, 6, 7, 8, 0)`).

```text
 5 _ 8       1 2 3
 4 2 1       4 5 6      h1 = 6   (only 4 and 7 are in place)
 7 3 6       7 8 _      h2 = 2 (5) + 3 (8) + 0 (4) + 1 (2) + 3 (1) + 0 (7) + 3 (3) + 1 (6) = 13
 node n      goal
```

The last two tests use your functions to check, on thousands of states, that
$h_1(n) \le h_2(n) \le h^*(n)$, and then run A* with each of them: watch the number of
expanded nodes.
"""

STARTER = '''GOAL = (1, 2, 3, 4, 5, 6, 7, 8, 0)

def h1(state: tuple[int, ...], goal: tuple[int, ...] = GOAL) -> int:
    """Number of misplaced tiles (the blank does not count)."""
    # TODO
    return 0

def h2(state: tuple[int, ...], goal: tuple[int, ...] = GOAL) -> int:
    """Sum of the Manhattan distances of the tiles from their goal squares."""
    # TODO: tile t at index i is at (i // 3, i % 3)
    return 0
'''

SOLUTION = '''GOAL = (1, 2, 3, 4, 5, 6, 7, 8, 0)

def h1(state: tuple[int, ...], goal: tuple[int, ...] = GOAL) -> int:
    """Number of misplaced tiles (the blank does not count)."""
    return sum(1 for s, g in zip(state, goal) if s != 0 and s != g)

def h2(state: tuple[int, ...], goal: tuple[int, ...] = GOAL) -> int:
    """Sum of the Manhattan distances of the tiles from their goal squares."""
    where: dict[int, int] = {tile: i for i, tile in enumerate(goal)}
    return sum(abs(i // 3 - where[t] // 3) + abs(i % 3 - where[t] % 3)
               for i, t in enumerate(state) if t != 0)
'''

HINTS = [
    '`h1`: walk the 9 squares of `state` and `goal` together (`zip`). Which square must you skip?',
    '`h2`: first build `where = {tile: index in goal}`. Tile `t` at index `i` is at `(i // 3, i % 3)`, '
    'its goal square is at `(where[t] // 3, where[t] % 3)`.',
    '`h2 = sum(abs(r - gr) + abs(c - gc) for every tile t != 0)`.',
]

EXPLANATION = r"""
Both heuristics are **optimal solution costs of relaxed problems** (slides p. 182–183, 214–215):

| heuristic | relaxed rule | why $\le h^*$ |
|---|---|---|
| $h_1$ | a tile can jump to any square in one move | every misplaced tile needs at least one move |
| $h_2$ | a tile can slide onto an occupied square | one move moves one tile by one square, reducing $h_2$ by at most 1 |

Every misplaced tile is at Manhattan distance $\ge 1$, so $h_1(n) \le h_2(n)$ for every $n$:
**$h_2$ dominates $h_1$** (it is *more informed*). Both are also **consistent**: one move
changes $h_1$ by at most 1 and $h_2$ by exactly 1, while the move costs 1.

Why dominance matters: A* expands **every** node with $f(n) = g(n) + h(n) < C^*$. A larger
(but still admissible) $h$ pushes more nodes above $C^*$, so fewer get expanded. On the
slide state (C* = 21): **5802** expansions with $h_1$, **932** with $h_2$, same optimal cost.

The blank is excluded because it is not a tile: counting it could make $h$ overestimate
(state `1 2 3 / 4 5 6 / 7 _ 8` is one move from the goal, but counting the blank gives 2).
"""

ENTRY = 'h1'

_SLIDE = (5, 0, 8, 4, 2, 1, 7, 3, 6)
_NILSSON, _NILSSON_GOAL = (2, 8, 3, 1, 6, 4, 7, 0, 5), (1, 2, 3, 8, 0, 4, 7, 6, 5)
_ONE_MOVE = (1, 2, 3, 4, 5, 6, 7, 0, 8)


def _blank_check(got, *args):
    if got == 2:
        return False, 'You counted the blank: it is not a tile (and counting it makes h overestimate h* = 1).'
    return got == 1, ''


def _true_costs(depth=14):
    "h*(s) for every state within `depth` moves of the goal (BFS backwards from the goal)."
    goal = (1, 2, 3, 4, 5, 6, 7, 8, 0)
    dist, q = {goal: 0}, deque([goal])
    while q:
        s = q.popleft()
        if dist[s] == depth:
            continue
        b = s.index(0)
        for a in EightPuzzle.MOVES[b]:
            s1 = list(s)
            s1[a], s1[b] = s1[b], s1[a]
            s1 = tuple(s1)
            if s1 not in dist:
                dist[s1] = dist[s] + 1
                q.append(s1)
    return dist


def _admissible_dominance(sol):
    dist = _true_costs()
    for s, hstar in dist.items():
        a, b = sol.h1(s), sol.h2(s)
        if not a <= b <= hstar:
            return False, f'state {s}: h1 = {a}, h2 = {b}, h* = {hstar} violates h1 <= h2 <= h*'
    return True, f'h1 <= h2 <= h* holds on all {len(dist)} states within 14 moves of the goal'


def _astar_compare(sol):
    out = {}
    for name in ('h1', 'h2'):
        h = getattr(sol, name)
        p = Instrumented(EightPuzzle(_SLIDE))
        node = astar_search(p, lambda n: h(n.state))
        out[name] = (node.path_cost, len(p.expanded))
    (c1, e1), (c2, e2) = out['h1'], out['h2']
    msg = f'A* with h1: cost {c1}, {e1} expansions;  with h2: cost {c2}, {e2} expansions'
    return (c1 == c2 == 21 and e2 < e1), msg


TESTS = [
    Test('slide p.181: h1', args=(_SLIDE,), expected=6, show='5 _ 8 / 4 2 1 / 7 3 6'),
    Test('slide p.181: h2', call=lambda sol: sol.h2(_SLIDE), expected=13, show='h2(5 _ 8 / 4 2 1 / 7 3 6)'),
    Test('goal state: h1 = h2 = 0', call=lambda sol: (sol.h1((1, 2, 3, 4, 5, 6, 7, 8, 0)),
                                                      sol.h2((1, 2, 3, 4, 5, 6, 7, 8, 0))),
         expected=(0, 0), show='(h1(goal), h2(goal))'),
    Test('blank is not a tile (h1)', args=(_ONE_MOVE,), check=_blank_check, show='1 2 3 / 4 5 6 / 7 _ 8'),
    Test('blank is not a tile (h2)', call=lambda sol: sol.h2(_ONE_MOVE), check=_blank_check,
         show='h2(1 2 3 / 4 5 6 / 7 _ 8)'),
    Test('custom goal (slides p.187-189)', call=lambda sol: (sol.h1(_NILSSON, _NILSSON_GOAL),
                                                             sol.h2(_NILSSON, _NILSSON_GOAL)),
         expected=(4, 5), show='(h1, h2) of 2 8 3 / 1 6 4 / 7 _ 5 with goal 1 2 3 / 8 _ 4 / 7 6 5'),
    Test('textbook example (AIMA, blank-first goal)',
         call=lambda sol: (sol.h1((7, 2, 4, 5, 0, 6, 8, 3, 1), (0, 1, 2, 3, 4, 5, 6, 7, 8)),
                           sol.h2((7, 2, 4, 5, 0, 6, 8, 3, 1), (0, 1, 2, 3, 4, 5, 6, 7, 8))),
         expected=(8, 18), show='(h1, h2) of 7 2 4 / 5 _ 6 / 8 3 1 with goal _ 1 2 / 3 4 5 / 6 7 8'),
    Test('h1 <= h2 <= h* on every state within 14 moves', call=_admissible_dominance,
         check=lambda got: got, show='exact h* by breadth-first search backwards from the goal', timeout=20),
    Test('dominance pays off: A* with h1 vs h2', call=_astar_compare, check=lambda got: got,
         show='A* on 5 _ 8 / 4 2 1 / 7 3 6 (C* = 21)', timeout=20),
]
