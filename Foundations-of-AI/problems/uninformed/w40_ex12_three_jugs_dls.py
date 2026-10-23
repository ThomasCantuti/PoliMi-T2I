from harness import Test
from aima import Node, expand, LIFOQueue, failure, cutoff, path_actions
from formulation_lib import shortest_solution

TITLE = 'Exercise book 1.2 · Three containers (12, 8, 3 l) and depth-limited search'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exercise book', 'problem formulation', 'depth-limited search', 'water jugs', 'action order']

STATEMENT = r"""
*Exercise book (Restelli, Gatti, Papini, Metelli), Exercise 1.2.*

You have three containers that hold **12, 8 and 3 liters**, and a water faucet. You can **fill** a container from
the faucet, **pour** one container into another (until the first is empty or the second is full), or **empty** it
onto the ground. The goal is to measure **exactly one liter**.

1. Give a precise specification of the task as a search problem.
2. Draw the search tree produced by **depth-limited search with maximum depth 3** and elimination of repeated
   states.

Implement the formulation of the book:

- **state** `(x, y, z)`: liters in the 12, 8 and 3 liter containers; **initial state** `(0, 0, 0)`;
- **actions**, returned **in this order** and only when they change the state:
  `'Fill12', 'Fill8', 'Fill3', 'Empty12', 'Empty8', 'Empty3', 'Pour12-8', 'Pour12-3', 'Pour8-12', 'Pour8-3',
  'Pour3-12', 'Pour3-8'` (a fill needs a container that is not full, an empty a container that is not empty, a
  pour a non-empty source and a non-full destination);
- **goal test**: some container holds exactly 1 liter; every action costs 1.

The tests also run depth-limited search with the book's conventions (limit 3, the **first action is explored
first**, goal test at selection, a child whose state equals one of its **ancestors** is discarded when generated)
and compare the visited states with the book's tree.
"""

STARTER = '''from aima import Problem

class ThreeJugs(Problem):
    CAPACITY = (12, 8, 3)
    NAMES = ('12', '8', '3')

    def __init__(self, initial: tuple[int, int, int] = (0, 0, 0)):
        super().__init__(initial=initial)

    def actions(self, state: tuple[int, int, int]) -> list[str]:
        # TODO: applicable actions, in the order Fill*, Empty*, Pour12-8, Pour12-3, Pour8-12, Pour8-3, Pour3-12, Pour3-8
        return []

    def result(self, state: tuple[int, int, int], action: str) -> tuple[int, int, int]:
        # TODO
        return state

    def is_goal(self, state: tuple[int, int, int]) -> bool:
        # TODO: some container holds exactly one liter
        return False
'''

SOLUTION = '''from aima import Problem

class ThreeJugs(Problem):
    CAPACITY = (12, 8, 3)
    NAMES = ('12', '8', '3')

    def __init__(self, initial: tuple[int, int, int] = (0, 0, 0)):
        super().__init__(initial=initial)

    def actions(self, state: tuple[int, int, int]) -> list[str]:
        n, cap = self.NAMES, self.CAPACITY
        acts = ['Fill' + n[i] for i in range(3) if state[i] < cap[i]]
        acts += ['Empty' + n[i] for i in range(3) if state[i] > 0]
        acts += [f'Pour{n[i]}-{n[j]}' for i in range(3) for j in range(3)
                 if i != j and state[i] > 0 and state[j] < cap[j]]
        return acts

    def result(self, state: tuple[int, int, int], action: str) -> tuple[int, int, int]:
        s, n, cap = list(state), self.NAMES, self.CAPACITY
        if action.startswith('Fill'):
            i = n.index(action[4:])
            s[i] = cap[i]
        elif action.startswith('Empty'):
            s[n.index(action[5:])] = 0
        else:
            src, dst = action[4:].split('-')
            i, j = n.index(src), n.index(dst)
            amount = min(s[i], cap[j] - s[j])
            s[i] -= amount
            s[j] += amount
        return tuple(s)

    def is_goal(self, state: tuple[int, int, int]) -> bool:
        return 1 in state
'''

HINTS = [
    'A pour moves `min(x, capacity_of_destination - y)` liters: until the source is empty or the destination full.',
    'Keep the order of the list in the statement: depth-first search explores the first action first, so the '
    'order decides the shape of the tree.',
    'In `(12, 8, 0)` only five actions change the state: Fill3, Empty12, Empty8, Pour12-3, Pour8-3.',
]

EXPLANATION = r"""
The book's tree (limit 3; depth-3 nodes are goal-tested but not expanded; crossed nodes repeat an ancestor):

```text
(0,0,0)
├─ Fill12 (12,0,0)
│   ├─ Fill8 (12,8,0)    → (12,8,3) (0,8,0) [(12,0,0)] (9,8,3) (12,5,3)
│   ├─ Fill3 (12,0,3)    → (12,8,3) (0,0,3) [(12,0,0)] (4,8,3) (12,3,0)
│   ├─ [Empty12 (0,0,0)]
│   ├─ Pour12-8 (4,8,0)  → (12,8,0) (4,8,3) (0,8,0) (4,0,0) (1,8,3) ← goal
│   └─ Pour12-3 (9,0,3)     (never reached)
├─ Fill8 (0,8,0)            (never reached)
└─ Fill3 (0,0,3)            (never reached)
```

Solution **Fill12, Pour12-8, Pour12-3**: 12 liters, pour 8 into the 8-liter container (4 left), pour 3 into the
3-liter one: **1 liter** left in the big container. 18 goal tests, 5 expansions. It is also a shortest solution
(BFS finds 3 actions as well), but depth-limited search does not guarantee it: it returns the first goal found
within the limit. With a limit of 2 the result would be `cutoff` ("no solution within 2 actions", not "no
solution").

Note: the book prints the result of Pour12-3 with a sign typo (`z + −min(x, 3 − z)`): the 3-liter container
gains `min(x, 3 − z)`.
"""

ENTRY = 'ThreeJugs'

_BOOK = [(0, 0, 0), (12, 0, 0), (12, 8, 0), (12, 8, 3), (0, 8, 0), (9, 8, 3), (12, 5, 3), (12, 0, 3), (12, 8, 3),
         (0, 0, 3), (4, 8, 3), (12, 3, 0), (4, 8, 0), (12, 8, 0), (4, 8, 3), (0, 8, 0), (4, 0, 0), (1, 8, 3)]


def _book_dls(problem, limit):
    """DLS with the book's conventions: leftmost child first, goal test at selection,
    a child whose state is on its own path is discarded at generation."""
    visited, result = [], failure
    frontier = LIFOQueue([Node(problem.initial)])
    while frontier:
        node = frontier.pop()
        visited.append(node.state)
        if problem.is_goal(node.state):
            return node, visited
        if len(node) >= limit:
            result = cutoff
            continue
        children = []
        for child in expand(problem, node):
            a, seen = node, False
            while a is not None:
                seen = seen or a.state == child.state
                a = a.parent
            if not seen:
                children.append(child)
        frontier.extend(reversed(children))
    return result, visited


def _dls_check(got, *args):
    node, visited = got
    if visited != _BOOK:
        return False, f'visited {visited}\nbook    {_BOOK}'
    return path_actions(node) == ['Fill12', 'Pour12-8', 'Pour12-3'], f'solution {path_actions(node)}'


TESTS = [
    Test('actions in (0, 0, 0)', call=lambda sol: sol.ThreeJugs().actions((0, 0, 0)),
         expected=['Fill12', 'Fill8', 'Fill3']),
    Test('actions in (12, 8, 0)', call=lambda sol: sol.ThreeJugs().actions((12, 8, 0)),
         expected=['Fill3', 'Empty12', 'Empty8', 'Pour12-3', 'Pour8-3']),
    Test('actions in (4, 5, 3)', call=lambda sol: sol.ThreeJugs().actions((4, 5, 3)),
         expected=['Fill12', 'Fill8', 'Empty12', 'Empty8', 'Empty3', 'Pour12-8', 'Pour8-12', 'Pour3-12', 'Pour3-8']),
    Test('Pour12-8 from (12, 0, 0)', call=lambda sol: sol.ThreeJugs().result((12, 0, 0), 'Pour12-8'), expected=(4, 8, 0)),
    Test('Pour12-3 from (4, 8, 0)', call=lambda sol: sol.ThreeJugs().result((4, 8, 0), 'Pour12-3'), expected=(1, 8, 3)),
    Test('Pour8-12 from (9, 8, 3)', call=lambda sol: sol.ThreeJugs().result((9, 8, 3), 'Pour8-12'), expected=(12, 5, 3)),
    Test('Empty8 from (4, 5, 3)', call=lambda sol: sol.ThreeJugs().result((4, 5, 3), 'Empty8'), expected=(4, 0, 3)),
    Test('goal test', call=lambda sol: [sol.ThreeJugs().is_goal(s) for s in [(1, 8, 3), (12, 1, 0), (0, 0, 1), (4, 8, 3)]],
         expected=[True, True, True, False]),
    Test('depth-limited search, limit 3 (book tree)', call=lambda sol: _book_dls(sol.ThreeJugs(), 3), check=_dls_check,
         show='leftmost first, ancestor check at generation'),
    Test('depth-limited search, limit 2 → cutoff', call=lambda sol: _book_dls(sol.ThreeJugs(), 2)[0] is cutoff,
         expected=True),
    Test('shortest solution has 3 actions', call=lambda sol: len(shortest_solution(sol.ThreeJugs())), expected=3),
]
