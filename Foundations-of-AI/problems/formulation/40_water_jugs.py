from harness import Test
from formulation_lib import shortest_solution

TITLE = 'Water pouring problem'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['problem formulation', 'water jugs', 'actions', 'result', 'goal test']

STATEMENT = r"""
The *water pouring problem* from the homework (search4e notebook, slides p. 110): you have jugs of
given `sizes` (liters), a tap and a sink. Get **exactly `goal` liters in some jug**.

- **State:** a tuple with the liters in each jug, e.g. `(0, 0)`.
- **Actions** (jug indices `i`, `j`):
  - `('Fill', i)` — fill jug `i` from the tap; applicable if jug `i` is not full;
  - `('Dump', i)` — empty jug `i` into the sink; applicable if jug `i` is not empty;
  - `('Pour', i, j)` — pour from `i` into `j` (`i != j`) until `i` is empty or `j` is full;
    applicable if `i` is not empty and `j` is not full.
- **Goal test:** `goal` is in the state. **Step cost:** 1.

```python
p = PourProblem((0, 0), 2, sizes=(4, 3))
p.actions((3, 3))               # [('Dump', 0), ('Dump', 1), ('Fill', 0), ('Pour', 1, 0)]  (any order)
p.result((3, 3), ('Pour', 1, 0))   # (4, 2): only 1 liter fits in jug 0
```
"""

STARTER = '''from aima import Problem

class PourProblem(Problem):
    """State: tuple of liters per jug. self.sizes = capacities, self.goal = liters wanted."""

    def __init__(self, initial: tuple[int, ...], goal: int, sizes: tuple[int, ...]):
        super().__init__(initial=tuple(initial), goal=goal, sizes=tuple(sizes))

    def actions(self, state: tuple[int, ...]) -> list[tuple]:
        jugs = range(len(state))
        # TODO: ('Fill', i), ('Dump', i), ('Pour', i, j)
        return []

    def result(self, state: tuple[int, ...], action: tuple) -> tuple[int, ...]:
        # TODO: return the new tuple of levels
        return state

    def is_goal(self, state: tuple[int, ...]) -> bool:
        # TODO
        return False
'''

SOLUTION = '''from aima import Problem

class PourProblem(Problem):
    """State: tuple of liters per jug. self.sizes = capacities, self.goal = liters wanted."""

    def __init__(self, initial: tuple[int, ...], goal: int, sizes: tuple[int, ...]):
        super().__init__(initial=tuple(initial), goal=goal, sizes=tuple(sizes))

    def actions(self, state: tuple[int, ...]) -> list[tuple]:
        jugs = range(len(state))
        return ([('Fill', i) for i in jugs if state[i] < self.sizes[i]] +
                [('Dump', i) for i in jugs if state[i] > 0] +
                [('Pour', i, j) for i in jugs for j in jugs
                 if i != j and state[i] > 0 and state[j] < self.sizes[j]])

    def result(self, state: tuple[int, ...], action: tuple) -> tuple[int, ...]:
        s = list(state)
        if action[0] == 'Fill':
            s[action[1]] = self.sizes[action[1]]
        elif action[0] == 'Dump':
            s[action[1]] = 0
        else:
            _, i, j = action
            amount = min(state[i], self.sizes[j] - state[j])
            s[i] -= amount
            s[j] += amount
        return tuple(s)

    def is_goal(self, state: tuple[int, ...]) -> bool:
        return self.goal in state
'''

HINTS = [
    'List comprehensions make `actions` short: `[("Fill", i) for i in jugs if state[i] < self.sizes[i]]`, …',
    'For a pour, the amount moved is `min(state[i], self.sizes[j] - state[j])`: whatever is in `i`, '
    'but no more than the free space in `j`.',
    'Copy the state into a list, change it, return `tuple(...)`. The goal test is `self.goal in state`.',
]

EXPLANATION = r"""
A few formulation choices hide in this tiny problem:

- **Abstraction:** a state records only the liters in each jug — not *how* we got there, nor the water
  in the sink. With sizes `(4, 3)` there are just 14 reachable states.
- **Applicability:** pouring into a full jug would be a *self-loop* (`result(s, a) = s`). The search4e
  version allows it; excluding it in `actions` makes the state space smaller to explore.
- **Goal test as a function:** the goal is a *set* of states (any state containing `goal`), not one state.
- **No solution:** with jugs `(2, 4, 6)` every reachable amount is even, so 1 liter is impossible and the
  search must explore *every* reachable state before answering `failure` — a problem may have no solution
  (slides p. 65).

The last tests are the classics: *Die Hard* (5 and 3 liters → 4 in 6 actions) and the search4e example.
"""

ENTRY = 'PourProblem'


def _actions(sol, state, sizes):
    return sorted(sol.PourProblem(state, 99, sizes).actions(state))


def _check_set(expected):
    expected = sorted(expected)

    def check(got):
        if got == expected:
            return True
        missing = [a for a in expected if a not in got]
        extra = [a for a in got if a not in expected]
        return False, f'missing {missing}, not applicable {extra}'
    return check


def _solve(sol, initial, goal, sizes):
    p = sol.PourProblem(initial, goal, sizes)
    actions = shortest_solution(p)
    if actions is None:
        return None
    s = p.initial
    for a in actions:
        s = p.result(s, a)
    return len(actions), goal in s


TESTS = [
    Test('actions from empty jugs', call=lambda sol: _actions(sol, (0, 0), (4, 3)),
         check=_check_set([('Fill', 0), ('Fill', 1)]), show='state (0, 0), sizes (4, 3)'),
    Test('actions with both jugs full', call=lambda sol: _actions(sol, (4, 3), (4, 3)),
         check=_check_set([('Dump', 0), ('Dump', 1)]), show='state (4, 3): pouring is not applicable'),
    Test('actions from (2, 0)', call=lambda sol: _actions(sol, (2, 0), (4, 3)),
         check=_check_set([('Fill', 0), ('Fill', 1), ('Dump', 0), ('Pour', 0, 1)]), show='state (2, 0), sizes (4, 3)'),
    Test('actions with three jugs', call=lambda sol: _actions(sol, (1, 0, 5), (2, 4, 5)),
         check=_check_set([('Fill', 0), ('Fill', 1), ('Dump', 0), ('Dump', 2),
                           ('Pour', 0, 1), ('Pour', 2, 0), ('Pour', 2, 1)]),
         show='state (1, 0, 5), sizes (2, 4, 5)'),
    Test('Fill', call=lambda sol: sol.PourProblem((0, 0), 2, (4, 3)).result((1, 0), ('Fill', 1)),
         expected=(1, 3), show="result((1, 0), ('Fill', 1))"),
    Test('Dump', call=lambda sol: sol.PourProblem((0, 0), 2, (4, 3)).result((1, 3), ('Dump', 0)),
         expected=(0, 3), show="result((1, 3), ('Dump', 0))"),
    Test('Pour everything', call=lambda sol: sol.PourProblem((0, 0), 2, (4, 3)).result((0, 3), ('Pour', 1, 0)),
         expected=(3, 0), show="result((0, 3), ('Pour', 1, 0))"),
    Test('Pour until full', call=lambda sol: sol.PourProblem((0, 0), 2, (4, 3)).result((3, 3), ('Pour', 1, 0)),
         expected=(4, 2), show="result((3, 3), ('Pour', 1, 0))"),
    Test('goal test', call=lambda sol: [sol.PourProblem((0, 0), 2, (4, 3)).is_goal(s)
                                        for s in [(4, 2), (2, 0), (4, 3)]],
         expected=[True, True, False], show='goal 2: (4, 2), (2, 0), (4, 3)'),
    Test('solve: 2 liters with jugs 4 and 3', call=lambda sol: _solve(sol, (0, 0), 2, (4, 3)),
         expected=(4, True), show='PourProblem((0, 0), 2, sizes=(4, 3))'),
    Test('Die Hard: 4 liters with jugs 5 and 3', call=lambda sol: _solve(sol, (0, 0), 4, (5, 3)),
         expected=(6, True), show='PourProblem((0, 0), 4, sizes=(5, 3))'),
    Test('search4e example', call=lambda sol: _solve(sol, (1, 1, 1), 13, (2, 16, 32)),
         expected=(4, True), show='PourProblem((1, 1, 1), 13, sizes=(2, 16, 32))'),
    Test('no solution: odd amount with even jugs', call=lambda sol: _solve(sol, (0, 0, 0), 1, (2, 4, 6)),
         expected=None, show='PourProblem((0, 0, 0), 1, sizes=(2, 4, 6))'),
]
