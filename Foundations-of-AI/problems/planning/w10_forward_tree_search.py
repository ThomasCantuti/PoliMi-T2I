from harness import Test
from planning_lib import Schema, atoms, ground_all

TITLE = 'Exercise book 6.1 · Forward BFS without elimination of repeated states'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exercise book', 'forward planning', 'BFS', 'tree search', 'blocks world']

STATEMENT = r"""
*Exercise book, Exercise 6.1.* A robotic arm must turn the stack B-on-A into A-on-B:

```text
  B            A
  A     →      B
```

```text
Init(OnTable(A) ∧ On(B,A) ∧ Clear(B) ∧ ArmEmpty)
Goal(OnTable(B) ∧ On(A,B) ∧ Clear(A) ∧ ArmEmpty)
Stack(x,y)    P: Holding(x) ∧ Clear(y)              E: ¬Holding(x) ∧ ¬Clear(y) ∧ On(x,y) ∧ Clear(x) ∧ ArmEmpty
UnStack(x,y)  P: On(x,y) ∧ Clear(x) ∧ ArmEmpty      E: ¬On(x,y) ∧ ¬Clear(x) ∧ ¬ArmEmpty ∧ Holding(x) ∧ Clear(y)
PutDown(x)    P: Holding(x)                         E: ¬Holding(x) ∧ OnTable(x) ∧ Clear(x) ∧ ArmEmpty
PickUp(x)     P: OnTable(x) ∧ Clear(x) ∧ ArmEmpty   E: ¬OnTable(x) ∧ ¬Clear(x) ∧ ¬ArmEmpty ∧ Holding(x)
```

"Solve the planning problem using forward search in the state space (using breadth-first search **without
elimination of repeated states**), drawing the search tree and showing the solution."

The book's tree corresponds to BFS **tree search** with the goal test when a node is **selected** for
expansion, children in the order of the schemas above (Stack, UnStack, PutDown, PickUp) with arguments A
before B. Implement `bfs_tree_search(init, goal, actions)` → `(plan, expanded)`: the plan (list of action
names) and the list of the **expanded** nodes in order, each as the tuple of actions from the root (the root
is `()`); the node that passes the goal test is not expanded.
"""

STARTER = '''from collections import deque
from planning_lib import Action, applicable, result

def bfs_tree_search(init: frozenset, goal: frozenset, actions: list[Action]):
    expanded: list[tuple] = []
    # TODO: FIFO queue of (state, path); goal test when a node is popped; no repeated-state check
    return None, expanded
'''

SOLUTION = '''from collections import deque
from planning_lib import Action, applicable, result

def bfs_tree_search(init: frozenset, goal: frozenset, actions: list[Action]):
    expanded: list[tuple] = []
    frontier = deque([(init, ())])
    while frontier:
        s, path = frontier.popleft()
        if goal <= s:
            return list(path), expanded
        expanded.append(path)
        for a in actions:
            if applicable(s, a):
                frontier.append((result(s, a), path + (a.name,)))
    return None, expanded
'''

HINTS = [
    'Tree search: no `reached` set at all; every applicable action produces a child, even if it recreates an old state.',
    'The goal test goes right after `popleft()`; if it fails, record `path` in `expanded` and generate the children.',
]

EXPLANATION = r"""
**The book's tree, level by level** (states abbreviated):

```text
L0  [OnTable(A), On(B,A), Clear(B), ArmEmpty]
L1  UnStack(B,A)                    → Holding(B), Clear(A), OnTable(A)
L2  Stack(B,A)  (= root)            PutDown(B) → A and B on the table
L3  UnStack(B,A)                    PickUp(A) → Holding(A)        PickUp(B) → Holding(B)
L4  Stack(B,A)  PutDown(B)          Stack(A,B) GOAL  PutDown(A)   Stack(B,A)  PutDown(B)
L5  UnStack(B,A) | PickUp(A) PickUp(B)       (children of the first two L4 nodes)
```

**9 expansions**, 16 generated nodes. Because the goal is tested on **selection**, the goal node Stack(A,B) is
generated at level 4 but recognized only after the two level-4 nodes before it have been expanded — that is why
level 5 is partly drawn. Solution: UnStack(B,A), PutDown(B), PickUp(A), Stack(A,B).

**Without repeated-state elimination** the tree re-generates the initial state at level 2 (Stack(B,A) undoes
UnStack(B,A)) and keeps cycling; BFS still terminates because the goal is at finite depth, but the work grows
as $b^d$. With graph search (the exam convention, problem 30) the Stack(B,A) child would be dropped as repeated.
"""

ENTRY = 'bfs_tree_search'

_SCHEMAS = [Schema('Stack(x,y)', 'Holding(x), Clear(y)', '¬Holding(x), ¬Clear(y), On(x,y), Clear(x), ArmEmpty'),
            Schema('UnStack(x,y)', 'On(x,y), Clear(x), ArmEmpty', '¬On(x,y), ¬Clear(x), ¬ArmEmpty, Holding(x), Clear(y)'),
            Schema('PutDown(x)', 'Holding(x)', '¬Holding(x), OnTable(x), Clear(x), ArmEmpty'),
            Schema('PickUp(x)', 'OnTable(x), Clear(x), ArmEmpty', '¬OnTable(x), ¬Clear(x), ¬ArmEmpty, Holding(x)')]
_ACTS = ground_all(_SCHEMAS, ['A', 'B'])
_INIT = atoms('OnTable(A), On(B,A), Clear(B), ArmEmpty')
_GOAL = atoms('OnTable(B), On(A,B), Clear(A), ArmEmpty')
_U, _S, _P = 'UnStack(B,A)', 'Stack(B,A)', 'PutDown(B)'

TESTS = [
    Test('Exercise 6.1: plan', call=lambda sol: sol.bfs_tree_search(_INIT, _GOAL, _ACTS)[0],
         expected=['UnStack(B,A)', 'PutDown(B)', 'PickUp(A)', 'Stack(A,B)'], show='B on A → A on B'),
    Test('Exercise 6.1: expanded nodes, in order', call=lambda sol: sol.bfs_tree_search(_INIT, _GOAL, _ACTS)[1],
         expected=[(), (_U,), (_U, _S), (_U, _P), (_U, _S, _U), (_U, _P, 'PickUp(A)'), (_U, _P, 'PickUp(B)'),
                   (_U, _S, _U, _S), (_U, _S, _U, _P)],
         show='9 expansions, as in the book\'s tree'),
    Test('goal already true', call=lambda sol: sol.bfs_tree_search(_GOAL, _GOAL, _ACTS), expected=([], []),
         show='init = goal: nothing is expanded'),
]
