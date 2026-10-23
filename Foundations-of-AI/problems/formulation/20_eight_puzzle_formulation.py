from harness import Test
from formulation_lib import shortest_solution

TITLE = 'Formulate the 8-puzzle: actions() and result()'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['problem formulation', '8-puzzle', 'actions', 'result']

STATEMENT = r"""
Formulate the **8-puzzle** exactly as in slides p. 58–61.

- **State:** a tuple of 9 numbers read row by row, `0` is the blank.
  `(8, 2, 7, 3, 4, 0, 5, 1, 6)` is
  ```text
  8 2 7
  3 4 _
  5 1 6
  ```
- **Actions:** the movement of the **blank**: `'UP'`, `'DOWN'`, `'LEFT'`, `'RIGHT'`.
  `actions(s)` returns the applicable ones, in this order.
- **result(s, a):** the new state (a new tuple: never modify `s`).
- **Goal test / step cost:** inherited from `Problem` (`state == goal`, cost 1).

```python
p = EightPuzzleProblem((8, 2, 7, 3, 4, 0, 5, 1, 6))
p.actions(p.initial)          # ['UP', 'DOWN', 'LEFT']
p.result(p.initial, 'LEFT')   # (8, 2, 7, 3, 0, 4, 5, 1, 6)
```

The tests then run a breadth-first search on **your** formulation.
"""

STARTER = '''from aima import Problem

class EightPuzzleProblem(Problem):
    """State: tuple of 9 numbers row by row, 0 = blank. Action: where the BLANK moves."""

    def __init__(self, initial: tuple[int, ...], goal: tuple[int, ...] = (1, 2, 3, 4, 5, 6, 7, 8, 0)):
        super().__init__(initial=tuple(initial), goal=tuple(goal))

    def actions(self, state: tuple[int, ...]) -> list[str]:
        blank = state.index(0)
        row, col = divmod(blank, 3)
        # TODO: list the applicable moves of the blank, in the order UP, DOWN, LEFT, RIGHT
        return []

    def result(self, state: tuple[int, ...], action: str) -> tuple[int, ...]:
        # TODO: swap the blank with the neighbouring tile, return a NEW tuple
        return state
'''

SOLUTION = '''from aima import Problem

class EightPuzzleProblem(Problem):
    """State: tuple of 9 numbers row by row, 0 = blank. Action: where the BLANK moves."""

    DELTA = {'UP': -3, 'DOWN': +3, 'LEFT': -1, 'RIGHT': +1}

    def __init__(self, initial: tuple[int, ...], goal: tuple[int, ...] = (1, 2, 3, 4, 5, 6, 7, 8, 0)):
        super().__init__(initial=tuple(initial), goal=tuple(goal))

    def actions(self, state: tuple[int, ...]) -> list[str]:
        blank = state.index(0)
        row, col = divmod(blank, 3)
        moves: list[str] = []
        if row > 0: moves.append('UP')
        if row < 2: moves.append('DOWN')
        if col > 0: moves.append('LEFT')
        if col < 2: moves.append('RIGHT')
        return moves

    def result(self, state: tuple[int, ...], action: str) -> tuple[int, ...]:
        blank = state.index(0)
        target = blank + self.DELTA[action]
        s = list(state)
        s[blank], s[target] = s[target], s[blank]
        return tuple(s)
'''

HINTS = [
    'Work with the index of the blank: `blank = state.index(0)`, `row, col = divmod(blank, 3)`.',
    'UP is applicable if `row > 0`, DOWN if `row < 2`, LEFT if `col > 0`, RIGHT if `col < 2`. '
    'In the flat tuple, UP is index −3, DOWN +3, LEFT −1, RIGHT +1.',
    'Copy into a list, swap `s[blank]` and `s[target]`, return `tuple(s)` (states must be hashable '
    'to be stored in `reached`).',
]

EXPLANATION = r"""
Describing the action as "**the blank moves**" instead of "tile $k$ moves in direction $d$" gives at
most 4 actions instead of up to $8 \times 4$: the choice of what an action *is* is part of the formulation.

- The branching factor is 2 (corner), 3 (edge) or 4 (center): on average about $b \approx 2.7$.
- Every action is **reversible** (`UP` undoes `DOWN`): this is why the search tree of the 8-puzzle is
  infinite and full of **repeated states** (slides p. 96, 104) — the tests checked this property.
- The slides' initial state needs **26** moves: BFS had to look at ~170 000 states to prove it.
  The 8-puzzle has $9! = 362\,880$ arrangements, but only half are reachable from a given state
  (see the *reachable states* problem).
"""

ENTRY = 'EightPuzzleProblem'

_SLIDE = (8, 2, 7, 3, 4, 0, 5, 1, 6)
_INITIAL = (8, 2, 0, 3, 4, 7, 5, 1, 6)       # slides p. 58


def _actions(sol, s):
    return list(sol.EightPuzzleProblem(s).actions(s))


def _result(sol, s, a):
    return sol.EightPuzzleProblem(s).result(s, a)


def _check_hashable(sol):
    p = sol.EightPuzzleProblem(_SLIDE)
    s1 = p.result(_SLIDE, 'UP')
    if not isinstance(s1, tuple):
        return False, f'result() returned a {type(s1).__name__}: states must be tuples (hashable)'
    if p.initial != _SLIDE:
        return False, 'result() modified the original state!'
    return True


def _reversible(sol):
    """Every action can be undone by the opposite one, in every state within 4 moves."""
    opposite = {'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'}
    p = sol.EightPuzzleProblem(_SLIDE)
    layer, seen = [_SLIDE], {_SLIDE}
    for _ in range(4):
        nxt = []
        for s in layer:
            for a in p.actions(s):
                s1 = p.result(s, a)
                if sorted(s1) != list(range(9)):
                    return False, f'result({s}, {a!r}) = {s1} is not a permutation of 0..8'
                if p.result(s1, opposite[a]) != s:
                    return False, f'{a} then {opposite[a]} from {s} does not come back to {s}'
                if s1 not in seen:
                    seen.add(s1)
                    nxt.append(s1)
        layer = nxt
    return True


def _solve(sol, initial):
    p = sol.EightPuzzleProblem(initial)
    actions = shortest_solution(p)
    if actions is None:
        return None
    s = p.initial
    for a in actions:
        s = p.result(s, a)
    return len(actions), s == p.goal


TESTS = [
    Test('actions in the slides\' state (p. 60)', call=lambda sol: _actions(sol, _SLIDE),
         expected=['UP', 'DOWN', 'LEFT'], show='8 2 7 / 3 4 _ / 5 1 6'),
    Test('actions with the blank in a corner', call=lambda sol: _actions(sol, (0, 1, 2, 3, 4, 5, 6, 7, 8)),
         expected=['DOWN', 'RIGHT'], show='_ 1 2 / 3 4 5 / 6 7 8'),
    Test('actions with the blank in the center', call=lambda sol: _actions(sol, (1, 2, 3, 4, 0, 5, 6, 7, 8)),
         expected=['UP', 'DOWN', 'LEFT', 'RIGHT'], show='1 2 3 / 4 _ 5 / 6 7 8'),
    Test('actions with the blank bottom-middle', call=lambda sol: _actions(sol, (1, 2, 3, 4, 5, 6, 7, 0, 8)),
         expected=['UP', 'LEFT', 'RIGHT'], show='1 2 3 / 4 5 6 / 7 _ 8'),
    Test('result(s, UP) (p. 61)', call=lambda sol: _result(sol, _SLIDE, 'UP'),
         expected=(8, 2, 0, 3, 4, 7, 5, 1, 6), show='8 2 7 / 3 4 _ / 5 1 6, UP'),
    Test('result(s, DOWN) (p. 61)', call=lambda sol: _result(sol, _SLIDE, 'DOWN'),
         expected=(8, 2, 7, 3, 4, 6, 5, 1, 0), show='8 2 7 / 3 4 _ / 5 1 6, DOWN'),
    Test('result(s, LEFT) (p. 61)', call=lambda sol: _result(sol, _SLIDE, 'LEFT'),
         expected=(8, 2, 7, 3, 0, 4, 5, 1, 6), show='8 2 7 / 3 4 _ / 5 1 6, LEFT'),
    Test('states are new tuples', call=_check_hashable, check=lambda got: got,
         show='result() must not modify its input'),
    Test('actions are reversible', call=_reversible, check=lambda got: got,
         show='every state within 4 moves of the slides\' state'),
    Test('solve a 2-move instance', call=lambda sol: _solve(sol, (1, 2, 3, 4, 5, 6, 0, 7, 8)),
         expected=(2, True), show='1 2 3 / 4 5 6 / _ 7 8'),
    Test('solve a 7-move instance', call=lambda sol: _solve(sol, (1, 2, 3, 0, 7, 6, 5, 4, 8)),
         expected=(7, True), show='1 2 3 / _ 7 6 / 5 4 8'),
    Test('solve the slides\' instance (p. 58)', call=lambda sol: _solve(sol, _INITIAL),
         expected=(26, True), show='8 2 _ / 3 4 7 / 5 1 6', timeout=20),
]
