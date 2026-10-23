from harness import Test
from aima import Node

TITLE = 'Exercise book 2.2 · The 3-digit puzzle: state, heuristic and A* tree search'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['exercise book', 'A*', 'tree search', 'state design', 'admissible heuristic', 'tie-breaking']

STATEMENT = r"""
*Exercise book (Restelli et al.), Exercise 2.2.*

A puzzle on the numbers from 100 to 999. You are given a start number **S**, a goal number **G** and a set of
**bad** numbers. A move adds 1 to one digit or subtracts 1 from one digit (678 → 679, 234 → 134), with the
constraints:

- no carries: you cannot add to a 9 or subtract from a 0;
- you cannot move to a number in **bad**;
- you cannot change **the same digit twice in two successive moves**.

Reach G from S with the fewest moves, with A\*.

1. **State.** The digits are not enough: because of the third rule the state must also remember **which digit was
   changed last**. Implement `DigitPuzzle(start, goal, bad)` with states `(digits, last)`: `digits` a 3-character
   string, `last` ∈ {1, 2, 3} (1 = leftmost digit) or `None` in the initial state. Actions in this order: digit 1
   first, then 2, then 3; for each digit **subtract before add**; skip the illegal ones. `is_goal` only looks at the
   digits.
2. **Heuristic.** `h(node)` = sum over the digits of $|x_i - g_i|$. Why is it admissible?
3. **A\* tree search** (no reached table): `digit_astar(start, goal, bad)` returns `(path, expanded)`, the digit
   strings of the solution path and of every node **selected** from the frontier, in order (goal included). Ties:
   the node with the **higher path cost** first; if still tied, the **oldest** node first (FIFO).

Book instance: S = 567, G = 777, bad = {666, 667}. Expected: expanded `567, 577, 677, 687, 787, 777`, a solution of
5 moves although $h(567) = 3$.
"""

STARTER = '''from aima import Problem, Node, expand, PriorityQueue, path_states

class DigitPuzzle(Problem):
    """State = (digits, last): digits like '567', last = 1..3 (digit changed by the previous move) or None."""

    def __init__(self, start: str, goal: str, bad):
        super().__init__((start, None), goal, bad=set(bad))

    def actions(self, state) -> list:
        # TODO: digit 1, 2, 3; for each digit -1 before +1; skip the illegal moves
        return []

    def result(self, state, action):
        # TODO
        return state

    def is_goal(self, state) -> bool:
        return state[0] == self.goal

    def h(self, node: Node) -> int:
        # TODO: sum of |digit - goal digit|
        return 0


def digit_astar(start: str, goal: str, bad) -> tuple[list[str], list[str]]:
    """A* tree search; ties: higher path cost first, then FIFO. Returns (path, expanded) as digit strings."""
    problem = DigitPuzzle(start, goal, bad)
    expanded: list[str] = []
    # TODO
    return [], expanded
'''

SOLUTION = '''from aima import Problem, Node, expand, PriorityQueue, path_states

class DigitPuzzle(Problem):
    """State = (digits, last): digits like '567', last = 1..3 (digit changed by the previous move) or None."""

    def __init__(self, start: str, goal: str, bad):
        super().__init__((start, None), goal, bad=set(bad))

    def actions(self, state) -> list:
        digits, last = state
        moves = []
        for i in (1, 2, 3):
            if i == last:                                   # same digit twice in a row
                continue
            for d in (-1, +1):                              # subtract before add
                v = int(digits[i - 1]) + d
                if 0 <= v <= 9 and self._change(digits, i, v) not in self.bad:
                    moves.append((i, d))
        return moves

    def result(self, state, action):
        digits, _ = state
        i, d = action
        return (self._change(digits, i, int(digits[i - 1]) + d), i)

    @staticmethod
    def _change(digits: str, i: int, v: int) -> str:
        return digits[:i - 1] + str(v) + digits[i:]

    def is_goal(self, state) -> bool:
        return state[0] == self.goal

    def h(self, node: Node) -> int:
        return sum(abs(int(x) - int(g)) for x, g in zip(node.state[0], self.goal))


def digit_astar(start: str, goal: str, bad) -> tuple[list[str], list[str]]:
    """A* tree search; ties: higher path cost first, then FIFO. Returns (path, expanded) as digit strings."""
    problem = DigitPuzzle(start, goal, bad)
    expanded: list[str] = []
    f = lambda n: (n.path_cost + problem.h(n), -n.path_cost)   # f first, then the deeper node
    frontier = PriorityQueue([Node(problem.initial)], key=f)  # PriorityQueue: remaining ties FIFO
    while frontier:
        node = frontier.pop()
        expanded.append(node.state[0])
        if problem.is_goal(node.state):
            return [s for s, _ in path_states(node)], expanded
        for child in expand(problem, node):
            frontier.add(child)
    return [], expanded
'''

HINTS = [
    'Without `last`, two nodes with the same digits could have different legal moves: the state would not be '
    'enough to decide the actions. That is why the state is `(digits, last)`.',
    'Admissibility: every move changes one digit by exactly 1, so it reduces $\\sum_i |x_i - g_i|$ by at most 1. '
    'It is the cost of the relaxed puzzle without the bad set and without the "same digit" rule.',
    'Ties: use a tuple key `(g + h, -g)` in the `PriorityQueue`; it already breaks the remaining ties first-in '
    'first-out. Tree search: add every child, no `reached` table.',
]

EXPLANATION = r"""
**Book solution** (f = g + h on each node; the expansion number in brackets):

```text
567,- (1) f=0+3
├─ 467,1  f=1+4      ├─ 557,2  f=1+4      ├─ 566,3  f=1+4      ├─ 568,3  f=1+4
└─ 577,2 (2) f=1+2
   ├─ 477,1  f=2+3   ├─ 576,3  f=2+3      ├─ 578,3  f=2+3
   └─ 677,1 (3) f=2+1                      (667 is bad)
      ├─ 676,3  f=3+2   ├─ 678,3  f=3+2
      └─ 687,2 (4) f=3+2                   (tie at f = 5 with many nodes: highest g wins)
         ├─ 587,1  f=4+3   ├─ 686,3  f=4+3   ├─ 688,3  f=4+3
         └─ 787,1 (5) f=4+1
            └─ 777,2  f=5+0  → goal (6); its siblings 797, 786, 788 have f = 5+2
```

Path 567 → 577 → 677 → 687 → 787 → 777: **5 moves**. The direct 567 → 667 → 767 → 777 is blocked (667 is bad), and
the third rule forbids 677 → 777 right after changing the first digit, hence the detour through 687.

**Why the tie rule matters.** At step 4 ten nodes have $f = 5$. Preferring the higher $g$ (the deeper node, whose
$f$ is made more of real cost and less of estimate) dives straight to the goal: 6 selections. Plain FIFO ties
would first expand all the older $f = 5$ nodes: 32 selections for the same answer.

**Heuristic.** $h = \sum_i |x_i - g_i|$ is the exact cost of the relaxed problem without the bad numbers and the
"same digit" rule, so it is admissible (each move changes $h$ by exactly 1, so it is also consistent). It can be far from the true cost: 3 against 5 on the book instance, 3 against 7 on 555 → 585 with
bad = {565, 575}.
"""

ENTRY = 'digit_astar'


def _successors(sol, start, goal, bad, state):
    p = sol.DigitPuzzle(start, goal, bad)
    return [p.result(state, a) for a in p.actions(state)]


def _shape(path_len=None, n_expanded=None, path=None, expanded=None):
    def check(got, *args):
        if not (isinstance(got, (tuple, list)) and len(got) == 2):
            return False, 'return a tuple (path, expanded)'
        p, e = list(got[0]), list(got[1])
        if path is not None and p != path:
            return False, f'path {p}, expected {path}'
        if expanded is not None and e != expanded:
            for i, (a, b) in enumerate(zip(e, expanded)):
                if a != b:
                    return False, f'selection {i + 1}: got {a}, expected {b} (tie rule: higher g first, then FIFO)'
            return False, f'{len(e)} selections, expected {len(expanded)}'
        if path_len is not None and len(p) - 1 != path_len:
            return False, f'a solution of {len(p) - 1} moves, the optimum is {path_len}'
        if n_expanded is not None and len(e) != n_expanded:
            return False, f'{len(e)} nodes selected, expected {n_expanded} (tie rule: higher g first, then FIFO)'
        return True, f'{len(p) - 1} moves, {len(e)} nodes selected'
    return check


TESTS = [
    Test('successors of the initial state', call=lambda sol: _successors(sol, '567', '777', {'666', '667'}, ('567', None)),
         expected=[('467', 1), ('557', 2), ('577', 2), ('566', 3), ('568', 3)],
         show="S = 567, bad = {666, 667}: 667 is bad"),
    Test('the same digit cannot change twice', call=lambda sol: _successors(sol, '567', '777', {'666', '667'}, ('677', 1)),
         expected=[('687', 2), ('676', 3), ('678', 3)], show="state (677, last = 1): 667 is bad, digit 1 is blocked"),
    Test('no carries', call=lambda sol: _successors(sol, '900', '111', set(), ('900', 3)),
         expected=[('800', 1), ('910', 2)], show="state (900, last = 3)"),
    Test('heuristic', call=lambda sol: sol.DigitPuzzle('567', '777', set()).h(Node(('190', None))),
         expected=15, show="goal 777: h(190) = |1-7| + |9-7| + |0-7| = 6 + 2 + 7"),
    Test('book instance', args=('567', '777', {'666', '667'}),
         check=_shape(path=['567', '577', '677', '687', '787', '777'],
                      expanded=['567', '577', '677', '687', '787', '777']),
         show="S = 567, G = 777, bad = {666, 667}"),
    Test('no bad numbers', args=('123', '321', set()),
         check=_shape(path=['123', '223', '222', '322', '321'], expanded=['123', '223', '222', '322', '321']),
         show="S = 123, G = 321"),
    Test('a detour around two bad numbers', args=('555', '585', {'565', '575'}), check=_shape(7, 15),
         show="S = 555, G = 585, bad = {565, 575}"),
    Test('alternating digits', args=('190', '119', {'110'}), check=_shape(17, 34),
         show="S = 190, G = 119, bad = {110}"),
]
