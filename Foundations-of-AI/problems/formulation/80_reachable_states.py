from harness import Test
from aima import Problem, GraphProblem, EightPuzzle, undirected, directed

TITLE = 'How big is the state space? (9! or 9!/2?)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['state space', 'reachable states', '8-puzzle', 'parity']

STATEMENT = r"""
Slides p. 66 say *"the 8-puzzle has 9! (362 880) states"*. Check it yourself.

Implement `count_reachable(problem)`: the number of distinct states reachable from `problem.initial`
(including it), following `problem.actions` and `problem.result`. There is no goal: explore everything.

It must work on big state spaces: **no recursion** (Python's stack is too small for long paths) —
use an explicit frontier and a `reached` set.

```python
count_reachable(GraphProblem('A', None, undirected([('A', 'B', 1), ('C', 'D', 1)])))   # 2
```
"""

STARTER = '''from aima import Problem

def count_reachable(problem: Problem) -> int:
    reached = {problem.initial}
    frontier = [problem.initial]
    # TODO: pop a state, generate its successors, keep the new ones
    return len(reached)
'''

SOLUTION = '''from aima import Problem

def count_reachable(problem: Problem) -> int:
    reached = {problem.initial}
    frontier = [problem.initial]
    while frontier:
        s = frontier.pop()
        for a in problem.actions(s):
            s1 = problem.result(s, a)
            if s1 not in reached:
                reached.add(s1)
                frontier.append(s1)
    return len(reached)
'''

HINTS = [
    'This is graph search without a goal test: the loop ends when the frontier is empty.',
    'Pop any state (the order does not matter for counting), generate `result(s, a)` for each action.',
    'Add a successor to `reached` **and** to the frontier only if it was not in `reached` yet.',
]

EXPLANATION = r"""
**The 8-puzzle has $9! = 362\,880$ arrangements, but only $9!/2 = 181\,440$ are reachable** from any
given state. The other half forms a separate, disconnected component of the state space: the
smaller sliding puzzles in the tests show the same pattern ($4!/2 = 12$, $6!/2 = 360$).

Why? Read the tiles in order, ignoring the blank, and count the *inversions* (pairs in the wrong order).
A horizontal move of the blank does not change the order; a vertical move jumps a tile over two others,
changing the inversion count by $\pm 2$ or $0$. So the **parity of the inversions is invariant**: states
with odd parity can never reach the goal (it has 0 inversions). This is the check that
`aima.EightPuzzle` does in its constructor.

> **Exam trap:** "number of states" (all arrangements, $9!$) vs "number of **reachable** states" ($9!/2$).
> Say which one you mean. The same holds for the 15-puzzle: $16!$ arrangements, $16!/2$ reachable.

Explicit frontier vs recursion: a recursive DFS on the 20 000-state chain would need a call stack
20 000 frames deep — an explicit list as frontier has no such limit.
"""

ENTRY = 'count_reachable'


class _Sliding(Problem):
    """rows × cols sliding puzzle; state = tuple, 0 = blank; action = index the blank moves to."""

    def __init__(self, rows, cols):
        super().__init__(initial=tuple(range(1, rows * cols)) + (0,), rows=rows, cols=cols)

    def actions(self, state):
        r, c = divmod(state.index(0), self.cols)
        return [(r + dr) * self.cols + c + dc for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1))
                if 0 <= r + dr < self.rows and 0 <= c + dc < self.cols]

    def result(self, state, action):
        s, b = list(state), state.index(0)
        s[b], s[action] = s[action], s[b]
        return tuple(s)


class _Pour(Problem):
    def actions(self, state):
        jugs = range(len(state))
        return ([('Fill', i) for i in jugs if state[i] < self.sizes[i]] +
                [('Dump', i) for i in jugs if state[i]] +
                [('Pour', i, j) for i in jugs for j in jugs if i != j and state[i] and state[j] < self.sizes[j]])

    def result(self, state, action):
        s = list(state)
        if action[0] == 'Fill':
            s[action[1]] = self.sizes[action[1]]
        elif action[0] == 'Dump':
            s[action[1]] = 0
        else:
            _, i, j = action
            amount = min(state[i], self.sizes[j] - state[j])
            s[i], s[j] = s[i] - amount, s[j] + amount
        return tuple(s)


def _eight_check(got):
    if got == 181440:
        return True, 'exactly 9!/2: half of the 9! arrangements'
    if got == 362880:
        return False, '9! would mean every arrangement is reachable: it is not!'
    return False, 'expected 181440'


TESTS = [
    Test('two components', call=lambda sol: sol.count_reachable(
        GraphProblem('A', None, undirected([('A', 'B', 1), ('C', 'D', 1)]))), expected=2,
         show="A-B and C-D, start in A"),
    Test('arcs are one-way', call=lambda sol: sol.count_reachable(
        GraphProblem('S', None, directed([('S', 'A', 1), ('A', 'B', 1), ('C', 'S', 1)]))), expected=3,
         show='S→A→B, C→S (C cannot be reached)'),
    Test('cycles', call=lambda sol: sol.count_reachable(
        GraphProblem('A', None, directed([('A', 'B', 1), ('B', 'C', 1), ('C', 'A', 1)]))), expected=3,
         show='A→B→C→A'),
    Test('water jugs (4, 3)', call=lambda sol: sol.count_reachable(_Pour((0, 0), 2, sizes=(4, 3))), expected=14),
    Test('long chain (no recursion!)', call=lambda sol: sol.count_reachable(
        GraphProblem(0, None, undirected([(i, i + 1, 1) for i in range(20000)]))), expected=20001,
         show='0-1-2-...-20000'),
    Test('2×2 sliding puzzle', call=lambda sol: sol.count_reachable(_Sliding(2, 2)), expected=12,
         show='4! = 24 arrangements'),
    Test('2×3 sliding puzzle', call=lambda sol: sol.count_reachable(_Sliding(2, 3)), expected=360,
         show='6! = 720 arrangements'),
    Test('the 8-puzzle', call=lambda sol: sol.count_reachable(EightPuzzle((1, 2, 3, 4, 5, 6, 7, 8, 0))),
         check=_eight_check, show='9! = 362880 arrangements', timeout=20),
]
