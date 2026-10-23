from harness import Test
from formulation_lib import shortest_solution

TITLE = 'Eight queens: two formulations, two state spaces'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['problem formulation', '8-queens', 'state-space size', 'incremental formulation']

STATEMENT = r"""
Place $n$ queens on an $n \times n$ board so that no two attack each other (same row, column or
diagonal). Implement both formulations of slides p. 74–75. Squares are `(col, row)`, both in `0..n-1`.

**`QueensNaive(n)`** — first formulation
- state: a `frozenset` of the squares holding a queen (initially empty);
- `actions(s)`: every empty square `(col, row)`, as long as fewer than $n$ queens are on the board;
- `result(s, a)`: add a queen on square `a`;
- `is_goal(s)`: $n$ queens and no two attacking each other.

**`QueensIncremental(n)`** — second formulation
- state: a tuple of rows: `state[c]` is the row of the queen in column `c`; initially `()`;
- `actions(s)`: every row `r` such that the square `(len(s), r)` — in the **leftmost empty column** — is not
  attacked by any queen already on the board;
- `result(s, r)`: `s + (r,)`;
- `is_goal(s)`: $n$ queens on the board.

```python
QueensIncremental(4).actions((0,))   # [2, 3]: rows 0 and 1 of column 1 are attacked
```
Both inherit from `Problem`; write `attacking(q1, q2)` once and use it in both.
"""

STARTER = '''from aima import Problem

def attacking(q1: tuple[int, int], q2: tuple[int, int]) -> bool:
    """Do queens on squares q1 = (c1, r1) and q2 = (c2, r2) attack each other?"""
    # TODO: same column, same row, or same diagonal
    return False


class QueensNaive(Problem):
    def __init__(self, n: int):
        super().__init__(initial=frozenset(), n=n)

    def actions(self, state: frozenset[tuple[int, int]]) -> list[tuple[int, int]]:
        # TODO
        return []

    def result(self, state: frozenset[tuple[int, int]],
               action: tuple[int, int]) -> frozenset[tuple[int, int]]:
        # TODO
        return state

    def is_goal(self, state: frozenset[tuple[int, int]]) -> bool:
        # TODO
        return False


class QueensIncremental(Problem):
    def __init__(self, n: int):
        super().__init__(initial=(), n=n)

    def actions(self, state: tuple[int, ...]) -> list[int]:
        col = len(state)               # leftmost empty column
        # TODO: rows of col not attacked by the queens (c, state[c])
        return []

    def result(self, state: tuple[int, ...], row: int) -> tuple[int, ...]:
        return state + (row,)

    def is_goal(self, state: tuple[int, ...]) -> bool:
        # TODO
        return False
'''

SOLUTION = '''from aima import Problem

def attacking(q1: tuple[int, int], q2: tuple[int, int]) -> bool:
    """Do queens on squares q1 = (c1, r1) and q2 = (c2, r2) attack each other?"""
    (c1, r1), (c2, r2) = q1, q2
    return c1 == c2 or r1 == r2 or abs(c1 - c2) == abs(r1 - r2)


class QueensNaive(Problem):
    def __init__(self, n: int):
        super().__init__(initial=frozenset(), n=n)

    def actions(self, state: frozenset[tuple[int, int]]) -> list[tuple[int, int]]:
        if len(state) == self.n:
            return []
        return [(c, r) for c in range(self.n) for r in range(self.n) if (c, r) not in state]

    def result(self, state: frozenset[tuple[int, int]],
               action: tuple[int, int]) -> frozenset[tuple[int, int]]:
        return state | {action}

    def is_goal(self, state: frozenset[tuple[int, int]]) -> bool:
        queens = list(state)
        return len(queens) == self.n and not any(
            attacking(queens[i], queens[j]) for i in range(len(queens)) for j in range(i))


class QueensIncremental(Problem):
    def __init__(self, n: int):
        super().__init__(initial=(), n=n)

    def actions(self, state: tuple[int, ...]) -> list[int]:
        col = len(state)
        if col == self.n:
            return []
        return [row for row in range(self.n)
                if not any(attacking((c, r), (col, row)) for c, r in enumerate(state))]

    def result(self, state: tuple[int, ...], row: int) -> tuple[int, ...]:
        return state + (row,)

    def is_goal(self, state: tuple[int, ...]) -> bool:
        return len(state) == self.n
'''

HINTS = [
    'Two queens attack each other if `c1 == c2`, or `r1 == r2`, or `abs(c1 - c2) == abs(r1 - r2)` (diagonal).',
    'Naive: no more actions once $n$ queens are placed. `frozenset | {square}` returns a new frozenset.',
    'Incremental: the queens already placed are `enumerate(state)` → `(col, row)` pairs; keep the rows of '
    'column `len(state)` that none of them attacks. The goal test needs no attack check — why?',
]

EXPLANATION = r"""
Same puzzle, wildly different state spaces (numbers from your code, see the tests):

| $n$ | naive: states | naive: search-tree nodes | incremental: states |
|---|---|---|---|
| 4 | 2 517 | 47 297 | 17 |
| 8 | $\approx 5.1 \times 10^9$ | $\approx 1.8 \times 10^{14}$ | **2 057** |

- The naive formulation lets queens be placed **anywhere, in any order**: the same arrangement is reached by
  $k!$ different paths (one state, many nodes), and states with attacking queens are kept around.
  The slides' $64 \times 63 \times \dots \times 57 \approx 1.8 \times 10^{14}$ counts these *sequences*
  (search-tree nodes at depth 8); distinct arrangements are "only" $\binom{64}{8} \approx 4.4 \times 10^9$.
- The incremental formulation **fixes the order** (leftmost empty column) and **prunes** attacked squares
  inside `actions`. Every state is consistent, so the goal test only counts queens, each state has exactly
  one path from the root (the search tree *is* the state space: no repeated states, slides p. 107), and
  dead ends like `(0, 2)` for $n = 4$ are detected early.

Moving constraints from the goal test into `actions` is the formulation trick you will meet again in CSPs.
"""

ENTRY = 'QueensIncremental'


def _reachable(problem):
    reached, frontier = {problem.initial}, [problem.initial]
    while frontier:
        s = frontier.pop()
        for a in problem.actions(s):
            s1 = problem.result(s, a)
            if s1 not in reached:
                reached.add(s1)
                frontier.append(s1)
    return reached


def _tree_nodes(problem, state):
    return 1 + sum(_tree_nodes(problem, problem.result(state, a)) for a in problem.actions(state))


def _count_check(expected, hint):
    def check(got):
        if got == expected:
            return True
        return False, f'{got} states, expected {expected}. {hint}'
    return check


def _valid_solution(sol, n):
    p = sol.QueensIncremental(n)
    actions = shortest_solution(p)
    if actions is None:
        return None
    s = p.initial
    for a in actions:
        s = p.result(s, a)
    squares = list(enumerate(s))
    ok = len(s) == n and all(not sol.attacking(squares[i], squares[j]) for i in range(n) for j in range(i))
    return ok


_SOLUTION4 = frozenset({(0, 1), (1, 3), (2, 0), (3, 2)})

TESTS = [
    Test('attacking', call=lambda sol: [sol.attacking((0, 0), (0, 5)), sol.attacking((0, 0), (5, 0)),
                                        sol.attacking((1, 1), (3, 3)), sol.attacking((1, 3), (3, 1)),
                                        sol.attacking((0, 0), (1, 2))],
         expected=[True, True, True, True, False],
         show='same column, same row, diagonal, anti-diagonal, knight move'),
    Test('naive: actions on the empty 4×4 board', call=lambda sol: len(sol.QueensNaive(4).actions(frozenset())),
         expected=16),
    Test('naive: result', call=lambda sol: sol.QueensNaive(4).result(frozenset({(0, 0)}), (2, 1)),
         expected=frozenset({(0, 0), (2, 1)}), show='frozenset({(0, 0)}) + queen on (2, 1)'),
    Test('naive: no actions with n queens', call=lambda sol: sol.QueensNaive(4).actions(_SOLUTION4),
         check=lambda got: list(got) == [], show='4 queens already on a 4×4 board'),
    Test('naive: goal test', call=lambda sol: [sol.QueensNaive(4).is_goal(s) for s in
                                               [_SOLUTION4, frozenset({(0, 1), (1, 3), (2, 0)}),
                                                frozenset({(0, 0), (1, 2), (2, 1), (3, 3)})]],
         expected=[True, False, False], show='a solution; only 3 queens; 4 queens with an attack'),
    Test('incremental: first column', call=lambda sol: list(sol.QueensIncremental(4).actions(())),
         expected=[0, 1, 2, 3]),
    Test('incremental: second column', call=lambda sol: [list(sol.QueensIncremental(4).actions(s))
                                                         for s in [(0,), (1,)]],
         expected=[[2, 3], [3]], show='after a queen in row 0, after a queen in row 1'),
    Test('incremental: dead end', call=lambda sol: list(sol.QueensIncremental(4).actions((0, 2))),
         expected=[], show='queens (0,0) and (1,2): every square of column 2 is attacked'),
    Test('incremental: goal test', call=lambda sol: [sol.QueensIncremental(4).is_goal(s)
                                                     for s in [(1, 3, 0, 2), (1, 3, 0)]],
         expected=[True, False]),
    Test('naive 4×4: reachable states', call=lambda sol: len(_reachable(sol.QueensNaive(4))),
         check=_count_check(2517, 'All arrangements of 0..4 queens: sum of C(16, k).'), timeout=10),
    Test('naive 4×4: search-tree nodes', call=lambda sol: _tree_nodes(sol.QueensNaive(4), frozenset()),
         expected=47297, show='1 + 16 + 16·15 + 16·15·14 + 16·15·14·13 — nodes ≠ states!', timeout=10),
    Test('incremental 4×4: reachable states', call=lambda sol: len(_reachable(sol.QueensIncremental(4))),
         check=_count_check(17, 'Only non-attacked squares of the leftmost empty column.')),
    Test('incremental 8×8: 2057 states (slides p. 75)',
         call=lambda sol: len(_reachable(sol.QueensIncremental(8))),
         check=_count_check(2057, 'Only non-attacked squares of the leftmost empty column.')),
    Test('incremental 8×8: number of solutions',
         call=lambda sol: sum(map(sol.QueensIncremental(8).is_goal, _reachable(sol.QueensIncremental(8)))),
         expected=92),
    Test('BFS finds a valid 8-queens solution', call=lambda sol: _valid_solution(sol, 8), expected=True),
]
