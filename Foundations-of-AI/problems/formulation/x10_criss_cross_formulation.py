from math import comb

from harness import Test
from formulation_lib import shortest_solution

TITLE = 'Exam · Jan 2022 · Criss-Cross solitaire as a search problem'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Jan 2022', 'problem formulation', 'actions', 'result', 'state-space size']

STATEMENT = r"""
*Written exam of 25 January 2022 — Problem 1 (Search, 8 points), Question 1.*

The **Criss-Cross solitaire** has a board with 17 square cells: two 3 × 3 squares that share one corner cell (the
central cell). Initially the 8 other cells of the left square hold **white** tokens, the 8 other cells of the
right square hold **black** tokens, and the central cell is empty. The objective is to **exchange** the two sets
of tokens with the minimum number of moves. A token moves either to an **adjacent** empty cell (cells are
adjacent if they share an edge, not if they share only a corner) or by **jumping over one adjacent token** (of
any colour) into an empty cell. Tokens cannot be removed.

**Question 1.** Define a search problem that represents the Criss-Cross solitaire, describing precisely all the
elements of the formalization.

The exam draws the squares as diamonds. Rotated by 45° clockwise (NE → right, SE → down, SW → left, NW → up) the
board is a 5 × 5 grid where `·` is not a cell. The 17 cells are numbered row by row:

```text
 cell indices            start                goal
  0  1  2  ·  ·        W W W · ·            B B B · ·
  3  4  5  ·  ·        W W W · ·            B B B · ·
  6  7  8  9 10        W W _ B B            B B _ W W
  ·  · 11 12 13        · · B B B            · · W W W
  ·  · 14 15 16        · · B B B            · · W W W
```

Implement the official formulation:

- **state**: a tuple of 17 numbers, one per cell in the order above: `-1` white token, `1` black token, `0` the
  empty cell. Initial state: eight `-1`, a `0` (cell 8), eight `1`; the goal is the opposite;
- **actions**: as in the 8-puzzle, the **empty cell** moves: `'MoveNE'`, `'MoveSE'`, `'MoveSW'`, `'MoveNW'` (to
  the adjacent cell in that direction) and `'JumpNE'`, …, `'JumpNW'` (two cells in that direction, over the token
  in between). Return the applicable ones in the order of `ACTIONS`;
- **result**: swap the empty cell with the token that moves; **goal test** (inherited) and **step cost** 1.
"""

STARTER = '''from aima import Problem

class CrissCross(Problem):
    # (row, col) of the 17 cells in the 5x5 grid, in index order
    CELLS = [(r, c) for r in range(5) for c in range(5) if (r <= 2 and c <= 2) or (r >= 2 and c >= 2)]
    # direction in which the EMPTY cell moves: (d_row, d_col) after the 45-degree rotation
    DIRECTIONS = {'NE': (0, 1), 'SE': (1, 0), 'SW': (0, -1), 'NW': (-1, 0)}
    ACTIONS = ['MoveNE', 'MoveSE', 'MoveSW', 'MoveNW', 'JumpNE', 'JumpSE', 'JumpSW', 'JumpNW']

    def __init__(self, initial: tuple[int, ...] | None = None):
        start = tuple(-1 if i < 8 else 0 if i == 8 else 1 for i in range(17))
        super().__init__(initial=initial or start, goal=tuple(-v for v in start))

    def actions(self, state: tuple[int, ...]) -> list[str]:
        # TODO: the actions whose target cell is on the board, in the order of ACTIONS
        return []

    def result(self, state: tuple[int, ...], action: str) -> tuple[int, ...]:
        # TODO: swap the empty cell with the target cell
        return state
'''

SOLUTION = '''from aima import Problem

class CrissCross(Problem):
    # (row, col) of the 17 cells in the 5x5 grid, in index order
    CELLS = [(r, c) for r in range(5) for c in range(5) if (r <= 2 and c <= 2) or (r >= 2 and c >= 2)]
    # direction in which the EMPTY cell moves: (d_row, d_col) after the 45-degree rotation
    DIRECTIONS = {'NE': (0, 1), 'SE': (1, 0), 'SW': (0, -1), 'NW': (-1, 0)}
    ACTIONS = ['MoveNE', 'MoveSE', 'MoveSW', 'MoveNW', 'JumpNE', 'JumpSE', 'JumpSW', 'JumpNW']

    def __init__(self, initial: tuple[int, ...] | None = None):
        start = tuple(-1 if i < 8 else 0 if i == 8 else 1 for i in range(17))
        super().__init__(initial=initial or start, goal=tuple(-v for v in start))

    def target(self, state: tuple[int, ...], action: str) -> tuple[int, int]:
        r, c = self.CELLS[state.index(0)]
        dr, dc = self.DIRECTIONS[action[-2:]]
        k = 1 if action.startswith('Move') else 2
        return (r + k * dr, c + k * dc)

    def actions(self, state: tuple[int, ...]) -> list[str]:
        return [a for a in self.ACTIONS if self.target(state, a) in self.CELLS]

    def result(self, state: tuple[int, ...], action: str) -> tuple[int, ...]:
        empty, other = state.index(0), self.CELLS.index(self.target(state, action))
        s = list(state)
        s[empty], s[other] = s[other], s[empty]
        return tuple(s)
'''

HINTS = [
    'Find the empty cell with `state.index(0)`, convert it to `(row, col)` with `CELLS`, add the direction '
    '(once for a move, twice for a jump).',
    'An action is applicable iff the target `(row, col)` is a cell of the board (`in CELLS`). The cell jumped '
    'over always holds a token, because there is only one empty cell.',
    '`result` swaps two entries of the tuple: build a list, swap, convert back with `tuple(...)`.',
]

EXPLANATION = r"""
**Model answer** (what to write): "State: vector of 17 numbers, −1 white token, 1 black token, 0 empty cell
(we can also store the index of the empty cell). Initial state: [−1 × 8, 0, 1 × 8]; goal: [1 × 8, 0, −1 × 8].
Actions: the empty cell moves, as in the 8-puzzle: MoveNE, MoveSE, MoveSW, MoveNW, JumpNE, JumpSE, JumpSW,
JumpNW, applicable when the target cell exists. Result: the vector with the empty cell and the moved token
swapped. Goal test: state = goal. Step cost: 1."

> **Discrepancy with the official solution:** the official initial state lists only seven −1 and seven 1
> (15 numbers) for a 17-cell board: it should be eight of each. The idea is right, the vector has a typo.

Moving the empty cell instead of the tokens keeps the action set small (8 actions instead of "token $t$ moves in
direction $d$"). The tests show what the formulation implies:

- the branching factor depends only on where the empty cell is: **8** in the central cell (the start state),
  **5** in the four cells next to it (one jump crosses the centre), **4** elsewhere (e.g. a corner: two moves and
  two jumps);
- the state space has $17 \cdot \binom{16}{8} = 218\,790$ states (position of the empty cell × positions of the 8
  white tokens among the other 16 cells), and **all** of them are reachable;
- the minimum number of moves is **46** (breadth-first search over the whole space): far beyond what a person
  finds by hand, which is why Questions 2–3 ask for an admissible heuristic and A*.
"""

ENTRY = 'CrissCross'

_START = tuple(-1 if i < 8 else 0 if i == 8 else 1 for i in range(17))


def _corner():
    s = list(_START)
    s[0], s[8] = 0, -1           # empty cell in the top-left corner
    return tuple(s)


def _reachable(sol):
    p = sol.CrissCross()
    seen, todo = {p.initial}, [p.initial]
    while todo:
        s = todo.pop()
        for a in p.actions(s):
            s1 = p.result(s, a)
            if s1 not in seen:
                seen.add(s1)
                todo.append(s1)
    return len(seen)


TESTS = [
    Test('actions of the start state', call=lambda sol: sol.CrissCross().actions(_START),
         expected=['MoveNE', 'MoveSE', 'MoveSW', 'MoveNW', 'JumpNE', 'JumpSE', 'JumpSW', 'JumpNW']),
    Test('actions with the empty cell in corner 0', call=lambda sol: sol.CrissCross().actions(_corner()),
         expected=['MoveNE', 'MoveSE', 'JumpNE', 'JumpSE']),
    Test('actions with the empty cell in cell 2', call=lambda sol: sol.CrissCross().actions(
        tuple(0 if i == 2 else -1 if i == 8 else v for i, v in enumerate(_START))),
         expected=['MoveSE', 'MoveSW', 'JumpSE', 'JumpSW']),
    Test('MoveNW from the start (token of cell 5 moves into the centre)',
         call=lambda sol: sol.CrissCross().result(_START, 'MoveNW'),
         expected=tuple(0 if i == 5 else -1 if i == 8 else v for i, v in enumerate(_START))),
    Test('JumpNE from the start (token of cell 10 jumps over cell 9)',
         call=lambda sol: sol.CrissCross().result(_START, 'JumpNE'),
         expected=tuple(0 if i == 10 else 1 if i == 8 else v for i, v in enumerate(_START))),
    Test('goal test', call=lambda sol: [sol.CrissCross().is_goal(_START),
                                       sol.CrissCross().is_goal(tuple(-v for v in _START))],
         expected=[False, True]),
    Test('every one of the 17·C(16,8) states is reachable', call=_reachable, expected=17 * comb(16, 8), timeout=20),
    Test('minimum number of moves', call=lambda sol: len(shortest_solution(sol.CrissCross())), expected=46,
         timeout=25),
]
