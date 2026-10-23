from harness import Test
from formulation_lib import shortest_solution

TITLE = 'Exam · Jul 2026 · Word-concatenation game: formulation and branching factor'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Jul 2026', 'problem formulation', 'branching factor', 'repeated states']

STATEMENT = r"""
*Written exam of 8 July 2026 — Problem 1 (Search).*

You must build a solver for a word game. The solver is given a **list of strings** and a **target string**. The
state is the list of strings. There is only one action: **concatenate two strings** of the list; the two strings
are removed and the resulting string is added. For example, from `["A", "B", "C", "B"]` (the two `"B"` are
indistinguishable), concatenating `"A"` and the first `"B"` gives `["AB", "C", "B"]`; concatenating `"B"` and `"B"`
gives `["BB", "A", "C"]`. If `"BB"` is the target, `["BB", "A", "C"]` is a goal state, and so is `["A", "C", "BB"]`.

Implement the formulation:

- **state**: the list as a **sorted tuple** — the order of the strings and the identity of equal strings do not
  matter, so `("A", "BB", "C")` stands for all the lists with those strings;
- **actions(state)**: the pairs `(x, y)` meaning "append `y` to `x`", where `x` and `y` are strings at **two
  different positions** of the list (so `("B", "B")` is allowed only if `"B"` appears twice). Return each distinct
  pair once, as a **sorted** list;
- **result(state, (x, y))**: remove one `x` and one `y`, add `x + y`, return the sorted tuple;
- **goal test**: the target is one of the strings; every action costs 1.

The tests then measure the branching factor asked by Question 1 of the exam (see the quiz on the same exam).
"""

STARTER = '''from aima import Problem

class WordGame(Problem):
    def __init__(self, strings: list[str], target: str):
        super().__init__(initial=tuple(strings), goal=target)   # TODO: canonical form of the state

    def actions(self, state: tuple[str, ...]) -> list[tuple[str, str]]:
        # TODO: distinct ordered pairs (x, y) of strings at two different positions, sorted
        return []

    def result(self, state: tuple[str, ...], action: tuple[str, str]) -> tuple[str, ...]:
        # TODO
        return state

    def is_goal(self, state: tuple[str, ...]) -> bool:
        # TODO
        return False
'''

SOLUTION = '''from aima import Problem

class WordGame(Problem):
    def __init__(self, strings: list[str], target: str):
        super().__init__(initial=tuple(sorted(strings)), goal=target)

    def actions(self, state: tuple[str, ...]) -> list[tuple[str, str]]:
        return sorted({(x, y) for i, x in enumerate(state) for j, y in enumerate(state) if i != j})

    def result(self, state: tuple[str, ...], action: tuple[str, str]) -> tuple[str, ...]:
        x, y = action
        rest = list(state)
        rest.remove(x)
        rest.remove(y)
        return tuple(sorted(rest + [x + y]))

    def is_goal(self, state: tuple[str, ...]) -> bool:
        return self.goal in state
'''

HINTS = [
    'Canonical form: `tuple(sorted(strings))`. Then `["A", "C", "BB"]` and `["BB", "A", "C"]` are the same state.',
    'Enumerate positions, not values: `for i, x in enumerate(state) for j, y in enumerate(state) if i != j`, and '
    'collect the pairs in a set so that the two `"B"` do not produce the same action twice.',
    '`list.remove` removes one occurrence: remove `x`, then `y` (it works also when `x == y`).',
]

EXPLANATION = r"""
**Branching factor.** With $L$ distinct strings every ordered pair of different strings is an action, and
concatenation is not commutative (`"A" + "B"` ≠ `"B" + "A"`): there are $L(L-1)$ actions. A string cannot be
concatenated with itself (it would have to be removed twice), so the $L$ pairs $(x, x)$ do not exist. Each action
reduces the list by one string, so the maximum branching factor is at the initial state: $L(L-1)$, i.e. $O(L^2)$.
(The official solution writes $L^2$: an upper bound, see the quiz.)

**Why a sorted tuple?** The list order is irrelevant for the goal and for the future actions. Keeping it would
multiply the states (and make `["BB", "A", "C"]` and `["A", "C", "BB"]` different states that graph search would not
recognize as repeated). This is the abstraction principle: keep in the state exactly what matters.

**Multiple paths.** From `("A", "B", "C")` with target `"ABC"`: `A+B` then `AB+C`, or `B+C` then `A+BC`. Both
paths reach the same state `("ABC",)`: the order of independent concatenations does not matter, so the tree has
repeated states and graph search pays off.
"""

ENTRY = 'WordGame'

_ABCB = ('A', 'B', 'B', 'C')


def _count_paths(sol, strings, target):
    """Number of distinct action sequences of minimum length that reach a goal."""
    p = sol.WordGame(strings, target)
    n = len(shortest_solution(p))

    def count(state, depth):
        if p.is_goal(state):
            return 1 if depth == n else 0
        if depth == n:
            return 0
        return sum(count(p.result(state, a), depth + 1) for a in p.actions(state))
    return count(p.initial, 0)


TESTS = [
    Test('initial state is canonical', call=lambda sol: sol.WordGame(['A', 'B', 'C', 'B'], 'BB').initial,
         expected=_ABCB),
    Test('actions of ("A", "B", "B", "C")', call=lambda sol: sol.WordGame(list(_ABCB), 'BB').actions(_ABCB),
         expected=[('A', 'B'), ('A', 'C'), ('B', 'A'), ('B', 'B'), ('B', 'C'), ('C', 'A'), ('C', 'B')]),
    Test('A + B', call=lambda sol: sol.WordGame(list(_ABCB), 'BB').result(_ABCB, ('A', 'B')), expected=('AB', 'B', 'C')),
    Test('B + B', call=lambda sol: sol.WordGame(list(_ABCB), 'BB').result(_ABCB, ('B', 'B')), expected=('A', 'BB', 'C')),
    Test('C + A (order matters)', call=lambda sol: sol.WordGame(list(_ABCB), 'BB').result(_ABCB, ('C', 'A')),
         expected=('B', 'B', 'CA')),
    Test('goal test', call=lambda sol: [sol.WordGame(list(_ABCB), 'BB').is_goal(s) for s in [('A', 'BB', 'C'), _ABCB]],
         expected=[True, False]),
    Test('branching factor with L = 2..6 distinct strings',
         call=lambda sol: [len(sol.WordGame(list('ABCDEF'[:L]), 'X').actions(tuple('ABCDEF'[:L]))) for L in range(2, 7)],
         expected=[2, 6, 12, 20, 30], show='L(L-1)'),
    Test('shortest solution for "ABC" from A, B, C', call=lambda sol: len(shortest_solution(sol.WordGame(['C', 'A', 'B'], 'ABC'))),
         expected=2),
    Test('two different shortest paths to "ABC"', call=lambda sol: _count_paths(sol, ['A', 'B', 'C'], 'ABC'), expected=2,
         show='A+B then AB+C, or B+C then A+BC'),
    Test('unreachable target', call=lambda sol: shortest_solution(sol.WordGame(['A', 'B'], 'C')), expected=None),
    Test('target already present', call=lambda sol: shortest_solution(sol.WordGame(['XY', 'Z'], 'XY')), expected=[]),
]
