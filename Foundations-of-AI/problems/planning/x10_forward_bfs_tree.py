from harness import Test
from planning_lib import Schema, atoms, ground_all, possible

TITLE = 'Exam · Aug 2022, Sep 2025, Jul 2026 · Forward BFS planning trees'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Aug 2022', 'Sep 2025', 'Jul 2026', 'forward planning', 'BFS', 'search tree']

STATEMENT = r"""
*Written exams of 30 August 2022, 8 September 2025 and 8 July 2026 — Planning (8 points), the forward-search
questions.* All three ask: "solve the planning problem using forward planning and breadth-first search
(checking the goal when a node is generated); report the planning tree and the solution found".

Implement `bfs_tree(init, goal, actions)` that returns the **tree as drawn in the exam**: the list of the
generated nodes in generation order, each as `(path, tag)` where `path` is the tuple of action names from the
root and `tag` is

- `'new'` — a new state, added to the frontier;
- `'repeated'` — a state generated before (graph search: drawn in the tree, not expanded);
- `'goal'` — a state satisfying the goal: append it and **stop**.

The root is not in the list. Actions are tried in the order of `actions`; return the list built so far if the
frontier empties.

**30 Aug 2022** (fixed formulation, lexicographic order). Rooms R1, R2, R3; doors D1 (R1–R2), D2 (R2–R3),
`Connects` in both directions; robot in R1, BOX1 in R2; goal Box(x) ∧ InRoom(x, R1).

```text
GoThru(d,r1,r2)      P: InRoom(ROBOT,r1), Connects(d,r1,r2)         E: InRoom(ROBOT,r2), ¬InRoom(ROBOT,r1)
PushThru(b,d,r1,r2)  P: InRoom(ROBOT,r1), InRoom(b,r1), Connects(d,r1,r2), Box(b)
                     E: InRoom(ROBOT,r2), InRoom(b,r2), ¬InRoom(ROBOT,r1), ¬InRoom(b,r1)
```

**8 Sep 2025** (security testing, schemas in this order, initial state `ininitial(A)`, goal `inFinished(A)`):

```text
GetSite(x)        P: —                                   E: inGotSite(x)
AttackXSSGet(x)   P: inGotSite(x), inAttackedSQL(x)      E: inAttackedXSS(x), inFinished(x)
AttackXSSPost(x)  P: inGotSite(x), inAttackedSQL(x)      E: inAttackedXSS(x), inFinished(x)
AttackSQLGet(x)   P: inGotSite(x)                        E: inAttackedSQL(x), inFinished(x)
AttackSQLPost(x)  P: inGotSite(x), inAttackedXSS(x)      E: inAttackedSQL(x), inFinished(x)
```

**8 Jul 2026** (blocks world from an LLM prompt; schemas in this order; initial state On(A,Table),
On(B,Table), On(C,A), Clear(B), Clear(C), HandEmpty; goal On(B,C) ∧ On(C,A)):

```text
PickUp(x)     P: Clear(x), On(x,Table), HandEmpty   E: Holding(x), ¬Clear(x), ¬On(x,Table), ¬HandEmpty
Putdown(x)    P: Holding(x)                         E: On(x,Table), Clear(x), HandEmpty, ¬Holding(x)
Stack(x,y)    P: Holding(x), Clear(y)               E: On(x,y), HandEmpty, Clear(x), ¬Holding(x), ¬Clear(y)
UnStack(x,y)  P: On(x,y), Clear(x), HandEmpty, Block(y)
              E: Holding(x), Clear(y), ¬On(x,y), ¬Clear(x), ¬HandEmpty
```

(`Clear(x)` in Putdown and `Block(y)` in UnStack are our corrections of the official formulation: see the
explanation.)
"""

STARTER = '''from collections import deque
from planning_lib import Action, applicable, result

def bfs_tree(init: frozenset, goal: frozenset, actions: list[Action]) -> list[tuple[tuple, str]]:
    tree: list[tuple[tuple, str]] = []
    # TODO: BFS graph search, goal test at generation; record every generated node
    return tree
'''

SOLUTION = '''from collections import deque
from planning_lib import Action, applicable, result

def bfs_tree(init: frozenset, goal: frozenset, actions: list[Action]) -> list[tuple[tuple, str]]:
    tree: list[tuple[tuple, str]] = []
    frontier = deque([(init, ())])
    reached = {init}
    while frontier:
        s, path = frontier.popleft()
        for a in actions:
            if not applicable(s, a):
                continue
            s1, p1 = result(s, a), path + (a.name,)
            if goal <= s1:
                tree.append((p1, 'goal'))
                return tree
            if s1 in reached:
                tree.append((p1, 'repeated'))
            else:
                reached.add(s1)
                frontier.append((s1, p1))
                tree.append((p1, 'new'))
    return tree
'''

HINTS = [
    'Start from the forward BFS of problem 30 and add one `tree.append(...)` per generated child.',
    'Order of the checks for a child: goal first (tag `goal`, return), then repeated, then new.',
    'Keep the path as a tuple: `path + (a.name,)`.',
]

EXPLANATION = r"""
**30 Aug 2022** — exactly the official tree:

```text
root
 └─ GoThru(D1,R1,R2)                              new
     ├─ GoThru(D1,R2,R1)                          repeated (= root)
     ├─ GoThru(D2,R2,R3)                          new
     └─ PushThru(BOX1,D1,R2,R1)                   goal
Solution: GoThru(D1,R1,R2), PushThru(BOX1,D1,R2,R1)
```

From the root only GoThru(D1,R1,R2) is applicable (the box is not with the robot). The goal is detected when
generated, before PushThru(BOX1,D2,R2,R3) is even considered.

**8 Sep 2025.** Tree: root → GetSite(A) → AttackSQLGet(A) (goal); plan GetSite(A), AttackSQLGet(A). The official
tree omits one child: `GetSite(A)` has an **empty precondition**, so it is applicable again in the second node;
it generates the same state (tag `repeated`). With 3 objects A, B, C the root has **3 children**, GetSite(A),
GetSite(B), GetSite(C) (Question 4). `inAttackedXSS(A)` is never generated (Question 3): both XSS attacks need
inAttackedSQL(A), which is only added together with inFinished(A), so the search stops first. DFS would give the
same plan **with graph search** (Question 2; the official "the applicable actions at each level are unique" is
imprecise: GetSite(A) is always applicable, and a tree-search DFS that tries it first would loop forever).

**8 Jul 2026.** With our corrected schemas:

```text
root
 ├─ PickUp(B)                 new
 ├─ UnStack(C,A)              new
 ├─ PickUp(B), Putdown(B)     repeated (= root)
 └─ PickUp(B), Stack(B,C)     goal
Solution: PickUp(B), Stack(B,C)   (2 actions: shortest, since BFS)
```

The official solution draws the same tree and plan, but its formulation has two flaws that the drawing hides:
1. **Putdown(x) does not add Clear(x)**: literally, the Putdown(B) child is {On(A,Table), On(B,Table), On(C,A),
   Clear(C), HandEmpty} *without* Clear(B) (a new state, and B could never be picked up again); the official
   drawing shows Clear(B) anyway.
2. **UnStack(x,y) does not require y to be a block**: `UnStack(B,Table)` is applicable in the initial state
   (On(B,Table), Clear(B), HandEmpty), so the root has **three** children with the literal formulation. The last
   test shows it. The solution found is the same in all versions.

The LLM answers: A1 = PickUp(B), Stack(B,C) is **correct and optimal** (same length as the BFS plan). A2 =
Unstack(C,A), Putdown(C), PickUp(B), Stack(B,C) is executable but **not correct**: it ends with C on the table,
violating On(C,A); asking whether it is optimal is pointless.
"""

ENTRY = 'bfs_tree'

_ROOMS = [Schema('GoThru(d,r1,r2)', 'InRoom(ROBOT,r1), Connects(d,r1,r2)', 'InRoom(ROBOT,r2), ¬InRoom(ROBOT,r1)'),
          Schema('PushThru(b,d,r1,r2)', 'InRoom(ROBOT,r1), InRoom(b,r1), Connects(d,r1,r2), Box(b)',
                 'InRoom(ROBOT,r2), InRoom(b,r2), ¬InRoom(ROBOT,r1), ¬InRoom(b,r1)')]
_RI = atoms('InRoom(ROBOT,R1), InRoom(BOX1,R2), Connects(D1,R1,R2), Connects(D2,R2,R3), Connects(D1,R2,R1), '
            'Connects(D2,R3,R2), Box(BOX1)')
_RA = sorted(possible(ground_all(_ROOMS, ['BOX1', 'D1', 'D2', 'R1', 'R2', 'R3', 'ROBOT']), _RI), key=lambda a: a.name)

_SEC = [Schema('GetSite(x)', '', 'inGotSite(x)'),
        Schema('AttackXSSGet(x)', 'inGotSite(x), inAttackedSQL(x)', 'inAttackedXSS(x), inFinished(x)'),
        Schema('AttackXSSPost(x)', 'inGotSite(x), inAttackedSQL(x)', 'inAttackedXSS(x), inFinished(x)'),
        Schema('AttackSQLGet(x)', 'inGotSite(x)', 'inAttackedSQL(x), inFinished(x)'),
        Schema('AttackSQLPost(x)', 'inGotSite(x), inAttackedXSS(x)', 'inAttackedSQL(x), inFinished(x)')]


def _blocks(official=False):
    return [Schema('PickUp(x)', 'Clear(x), On(x,Table), HandEmpty', 'Holding(x), ¬Clear(x), ¬On(x,Table), ¬HandEmpty'),
            Schema('Putdown(x)', 'Holding(x)', 'On(x,Table), HandEmpty, ¬Holding(x)' + ('' if official else ', Clear(x)')),
            Schema('Stack(x,y)', 'Holding(x), Clear(y)', 'On(x,y), HandEmpty, Clear(x), ¬Holding(x), ¬Clear(y)'),
            Schema('UnStack(x,y)', 'On(x,y), Clear(x), HandEmpty' + ('' if official else ', Block(y)'),
                   'Holding(x), Clear(y), ¬On(x,y), ¬Clear(x), ¬HandEmpty')]


_BI = atoms('On(A,Table), On(B,Table), On(C,A), Clear(B), Clear(C), HandEmpty')
_BG = atoms('On(B,C), On(C,A)')
_BLOCKS = ['A', 'B', 'C', 'Table']


def _prefix(n, want):
    def check(got, *args):
        return (isinstance(got, list) and [tuple(x) for x in got[:n]] == want,
                f'first {n} generated nodes: expected {want}')
    return check


TESTS = [
    Test('30 Aug 2022: robot, doors and box', args=(_RI, atoms('Box(BOX1), InRoom(BOX1,R1)'), _RA),
         expected=[(('GoThru(D1,R1,R2)',), 'new'),
                   (('GoThru(D1,R1,R2)', 'GoThru(D1,R2,R1)'), 'repeated'),
                   (('GoThru(D1,R1,R2)', 'GoThru(D2,R2,R3)'), 'new'),
                   (('GoThru(D1,R1,R2)', 'PushThru(BOX1,D1,R2,R1)'), 'goal')],
         show='fixed formulation, actions in lexicographic order'),
    Test('8 Sep 2025: security testing, one object', args=(atoms('ininitial(A)'), atoms('inFinished(A)'), ground_all(_SEC, ['A'])),
         expected=[(('GetSite(A)',), 'new'), (('GetSite(A)', 'GetSite(A)'), 'repeated'),
                   (('GetSite(A)', 'AttackSQLGet(A)'), 'goal')],
         show='initial state ininitial(A), goal inFinished(A)'),
    Test('8 Sep 2025, Question 4: three objects', args=(atoms('ininitial(A)'), atoms('inFinished(A)'), ground_all(_SEC, ['A', 'B', 'C'])),
         check=_prefix(3, [(('GetSite(A)',), 'new'), (('GetSite(B)',), 'new'), (('GetSite(C)',), 'new')]),
         show='objects A, B, C: the children of the root'),
    Test('8 Jul 2026: LLM blocks prompt (corrected schemas)',
         args=(_BI | atoms('Block(A), Block(B), Block(C)'), _BG, ground_all(_blocks(), _BLOCKS)),
         expected=[(('PickUp(B)',), 'new'), (('UnStack(C,A)',), 'new'),
                   (('PickUp(B)', 'Putdown(B)'), 'repeated'), (('PickUp(B)', 'Stack(B,C)'), 'goal')],
         show='initial state + Block(A), Block(B), Block(C)'),
    Test('8 Jul 2026 with the official schemas, taken literally', args=(_BI, _BG, ground_all(_blocks(True), _BLOCKS)),
         expected=[(('PickUp(B)',), 'new'), (('UnStack(B,Table)',), 'new'), (('UnStack(C,A)',), 'new'),
                   (('PickUp(B)', 'Putdown(B)'), 'new'), (('PickUp(B)', 'Stack(B,C)'), 'goal')],
         show='Putdown without Clear(x), UnStack without Block(y)'),
]
