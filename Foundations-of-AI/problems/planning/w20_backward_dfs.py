from harness import Test
from planning_lib import Action, atoms

TITLE = 'Exercise book 6.2 · Backward DFS with repeated and inconsistent goals'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['exercise book', 'backward planning', 'regression', 'DFS', 'inconsistent goals']

STATEMENT = r"""
*Exercise book, Exercise 6.2.* Robby moves between rooms Ra and Rb with a gripper; the ball B is in Ra, Robby in
Rb. Bring the ball to Rb.

```text
Init(Ball(B) ∧ AtRa(B) ∧ AtRobbyRb ∧ GripperEmpty)          Goal(AtRb(B))
MoveRaRb   P: AtRobbyRa                                  E: ¬AtRobbyRa ∧ AtRobbyRb
MoveRbRa   P: AtRobbyRb                                  E: ¬AtRobbyRb ∧ AtRobbyRa
PickRa(o)  P: Ball(o) ∧ AtRa(o) ∧ AtRobbyRa ∧ GripperEmpty  E: ¬AtRa(o) ∧ ¬GripperEmpty ∧ Carry(o)
PickRb(o)  P: Ball(o) ∧ AtRb(o) ∧ AtRobbyRb ∧ GripperEmpty  E: ¬AtRb(o) ∧ ¬GripperEmpty ∧ Carry(o)
DropRa(o)  P: Ball(o) ∧ AtRobbyRa ∧ Carry(o)                E: ¬Carry(o) ∧ AtRa(o) ∧ GripperEmpty
DropRb(o)  P: Ball(o) ∧ AtRobbyRb ∧ Carry(o)                E: ¬Carry(o) ∧ AtRb(o) ∧ GripperEmpty
```

"Solve the planning problem using backward search in the state space (using depth-first search with elimination
of repeated states), drawing the search tree and showing the solution." The book also crosses out
**inconsistent goals**: goals that no state can satisfy because they contain mutually exclusive atoms (Robby in
both rooms).

Implement `backward_dfs(init, goal, actions, mutex)` → `(plan, tree)`, reproducing the book's tree:

- **expanding** a goal generates **all** its children, one per relevant and consistent action in the order of
  `actions`, $R[g, a] = (g - \textit{ADD}(a)) \cup \textit{PRE}(a)$; each child is tagged
  `'init'` (satisfied by the initial state), else `'inconsistent'` (contains every atom of some set in `mutex`),
  else `'repeated'` (equal to a goal generated before, root included), else `'new'`;
- `tree` lists every generated child as `(path, tag)`, `path` = tuple of action names from the root (backward
  order); after generating the children, if one is tagged `'init'` stop and return its plan (path reversed);
- otherwise expand the `'new'` children depth-first, in order. Return `(None, tree)` if no plan exists.
"""

STARTER = '''from planning_lib import Action

def backward_dfs(init: frozenset, goal: frozenset, actions: list[Action], mutex: list[frozenset]):
    tree: list[tuple[tuple, str]] = []
    # TODO
    return None, tree
'''

SOLUTION = '''from planning_lib import Action

def backward_dfs(init: frozenset, goal: frozenset, actions: list[Action], mutex: list[frozenset]):
    tree: list[tuple[tuple, str]] = []
    reached = {goal}

    def expand(g, path):
        children = []
        for a in actions:
            if a.add & g and not (a.delete & g):
                g1 = (g - a.add) | a.pre
                if g1 <= init:
                    tag = 'init'
                elif any(m <= g1 for m in mutex):
                    tag = 'inconsistent'
                elif g1 in reached:
                    tag = 'repeated'
                else:
                    tag = 'new'
                    reached.add(g1)
                children.append((g1, path + (a.name,), tag))
                tree.append((path + (a.name,), tag))
        for g1, p1, tag in children:
            if tag == 'init':
                return list(reversed(p1))
        for g1, p1, tag in children:
            if tag == 'new':
                plan = expand(g1, p1)
                if plan is not None:
                    return plan
        return None

    if goal <= init:
        return [], tree
    return expand(goal, ()), tree
'''

HINTS = [
    'Write a recursive `expand(g, path)`. First loop: generate and tag all the children (append each to `tree`, add '
    'the new goals to `reached`). Second loop: if a child is tagged init, return the reversed path. Third loop: '
    'recurse on the new children in order.',
    'Tag order matters: test "satisfied by init" first, then the mutex sets (`m <= g1`), then `g1 in reached`.',
    'Backward search finds the last action first: the plan is the path read backwards.',
]

EXPLANATION = r"""
**The book's tree** (goals abbreviated; ✗ = inconsistent, ⟲ = repeated):

```text
AtRb(B)
└─ DropRb(B) → Ball(B), AtRobbyRb, Carry(B)                                      [N1]
   ├─ MoveRaRb  → Ball(B), Carry(B), AtRobbyRa                                   [N2]
   │  ├─ MoveRbRa  → Ball(B), Carry(B), AtRobbyRb                  ⟲ (= N1)
   │  ├─ PickRa(B) → Ball(B), AtRobbyRa, AtRa(B), GripperEmpty                   [N3]
   │  │  ├─ MoveRbRa  → Ball(B), AtRa(B), GripperEmpty, AtRobbyRb   satisfied by Init
   │  │  ├─ DropRa(B) → Ball(B), AtRobbyRa, Carry(B)                ⟲ (= N2)
   │  │  └─ DropRb(B) → Ball(B), AtRobbyRa, AtRa(B), AtRobbyRb, Carry(B)   ✗
   │  └─ PickRb(B) → Ball(B), AtRobbyRa, AtRb(B), AtRobbyRb, GripperEmpty  ✗
   ├─ PickRa(B) → Ball(B), AtRobbyRb, AtRa(B), AtRobbyRa, GripperEmpty     ✗
   └─ PickRb(B) → Ball(B), AtRobbyRb, AtRb(B), GripperEmpty   (never expanded)
Plan: MoveRbRa, PickRa(B), MoveRaRb, DropRb(B)
```

(The book's figure is rotated by 90°: read it with the root on top.) The book leaves the DropRa(B) child of N3 unmarked; it is the same goal as N2, a repeated goal — irrelevant
here because the search stops at the MoveRbRa child.

**Inconsistent goals.** PickRa(B) is relevant (adds Carry(B)) and consistent with N1 (it deletes AtRa(B) and
GripperEmpty, not in N1), yet its regression needs Robby in Ra (precondition) **and** in Rb (still required by
N1): no state satisfies both. Relevance and consistency are syntactic checks on the action; recognizing an
inconsistent goal needs domain knowledge (here: Robby is in exactly one room). Pruning such goals is what keeps
backward search small.
"""

ENTRY = 'backward_dfs'

_A = [Action('MoveRaRb', atoms('AtRobbyRa'), atoms('AtRobbyRb'), atoms('AtRobbyRa')),
      Action('MoveRbRa', atoms('AtRobbyRb'), atoms('AtRobbyRa'), atoms('AtRobbyRb')),
      Action('PickRa(B)', atoms('Ball(B), AtRa(B), AtRobbyRa, GripperEmpty'), atoms('Carry(B)'), atoms('AtRa(B), GripperEmpty')),
      Action('PickRb(B)', atoms('Ball(B), AtRb(B), AtRobbyRb, GripperEmpty'), atoms('Carry(B)'), atoms('AtRb(B), GripperEmpty')),
      Action('DropRa(B)', atoms('Ball(B), AtRobbyRa, Carry(B)'), atoms('AtRa(B), GripperEmpty'), atoms('Carry(B)')),
      Action('DropRb(B)', atoms('Ball(B), AtRobbyRb, Carry(B)'), atoms('AtRb(B), GripperEmpty'), atoms('Carry(B)'))]
_INIT = atoms('Ball(B), AtRa(B), AtRobbyRb, GripperEmpty')
_MUTEX = [atoms('AtRobbyRa, AtRobbyRb')]
_D, _M, _P = 'DropRb(B)', 'MoveRaRb', 'PickRa(B)'

TESTS = [
    Test('Exercise 6.2: plan', call=lambda sol: sol.backward_dfs(_INIT, atoms('AtRb(B)'), _A, _MUTEX)[0],
         expected=['MoveRbRa', 'PickRa(B)', 'MoveRaRb', 'DropRb(B)'], show='ball in Ra, Robby in Rb'),
    Test('Exercise 6.2: the tree', call=lambda sol: sol.backward_dfs(_INIT, atoms('AtRb(B)'), _A, _MUTEX)[1],
         expected=[((_D,), 'new'),
                   ((_D, _M), 'new'), ((_D, _P), 'inconsistent'), ((_D, 'PickRb(B)'), 'new'),
                   ((_D, _M, 'MoveRbRa'), 'repeated'), ((_D, _M, _P), 'new'), ((_D, _M, 'PickRb(B)'), 'inconsistent'),
                   ((_D, _M, _P, 'MoveRbRa'), 'init'), ((_D, _M, _P, 'DropRa(B)'), 'repeated'),
                   ((_D, _M, _P, 'DropRb(B)'), 'inconsistent')],
         show='every generated goal with its tag'),
    Test('Robby already in Ra', call=lambda sol: sol.backward_dfs(atoms('Ball(B), AtRa(B), AtRobbyRa, GripperEmpty'),
                                                                   atoms('AtRb(B)'), _A, _MUTEX)[0],
         expected=['PickRa(B)', 'MoveRaRb', 'DropRb(B)'], show='init with AtRobbyRa'),
    Test('ball already in Rb', call=lambda sol: sol.backward_dfs(atoms('Ball(B), AtRb(B), AtRobbyRa, GripperEmpty'),
                                                                  atoms('AtRb(B)'), _A, _MUTEX)[0],
         expected=[], show='the goal holds initially'),
]
