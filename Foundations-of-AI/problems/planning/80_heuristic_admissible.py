import itertools
import math
from collections import deque

from harness import Test
from planning_lib import Action, Schema, atoms, ground_all, possible, applicable, result, hanoi

TITLE = 'Admissible heuristics for forward planning'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['heuristic', 'admissibility', 'A*', 'h*', 'relaxed problem', 'forward planning']

STATEMENT = r"""
Forward planning with A* needs a heuristic $h(s)$ that estimates the number of actions from state $s$ to a state
satisfying the goal; it is **admissible** iff $0 \le h(s) \le h^*(s)$ for every state, where $h^*(s)$ is the length
of a shortest plan from $s$.

Implement:

1. `h_star(init, goal, actions)` → a dict `{state: h*(state)}` for **every state reachable from `init`**
   (`math.inf` if no goal state can be reached from it);
2. `is_admissible(h, init, goal, actions)` → `True` iff $0 \le h(s) \le h^*(s)$ on every reachable state.

Hint: one forward search collects the reachable states and the edges $s \to s'$; then a single breadth-first
search **from all the goal states along reversed edges** gives every $h^*$ at once.

The tests check heuristics from the exams: the room of the box (30 Aug 2022), the painting problem
$h(s) = 2\,U_s(A) + P_s(B)$ (12 Jul 2024, 6 objects, 8192 reachable states), and the classic
"number of unsatisfied goal literals".
"""

STARTER = '''import math
from collections import deque
from planning_lib import Action, applicable, result

def h_star(init: frozenset, goal: frozenset, actions: list[Action]) -> dict[frozenset, float]:
    # TODO: reachable states and edges, then BFS backwards from the goal states
    return {}

def is_admissible(h, init: frozenset, goal: frozenset, actions: list[Action]) -> bool:
    # TODO
    return True
'''

SOLUTION = '''import math
from collections import deque
from planning_lib import Action, applicable, result

def h_star(init: frozenset, goal: frozenset, actions: list[Action]) -> dict[frozenset, float]:
    parents: dict[frozenset, set] = {init: set()}
    queue = deque([init])
    while queue:                                   # 1. reachable states, reversed edges
        s = queue.popleft()
        for a in actions:
            if applicable(s, a):
                s1 = result(s, a)
                if s1 not in parents:
                    parents[s1] = set()
                    queue.append(s1)
                parents[s1].add(s)
    dist = {s: math.inf for s in parents}
    queue = deque()
    for s in parents:                              # 2. BFS from every goal state
        if goal <= s:
            dist[s] = 0
            queue.append(s)
    while queue:
        s = queue.popleft()
        for p in parents[s]:
            if dist[p] == math.inf:
                dist[p] = dist[s] + 1
                queue.append(p)
    return dist

def is_admissible(h, init: frozenset, goal: frozenset, actions: list[Action]) -> bool:
    return all(0 <= h(s) <= d for s, d in h_star(init, goal, actions).items())
'''

HINTS = [
    'Phase 1: BFS from `init`; for every edge `s -> s1` record `s` in `parents[s1]` (a dict of sets).',
    'Phase 2: put **all** goal states (those with `goal <= s`) in the queue with distance 0, then BFS following '
    '`parents`: the first time a state is reached gives its $h^*$. States never reached keep `math.inf`.',
    '`is_admissible`: `all(0 <= h(s) <= d for s, d in h_star(...).items())` — `x <= math.inf` is always true.',
]

EXPLANATION = r"""
**Admissibility needs $h^*$; the exam needs an argument.** Here we brute-force $h^*$ on small instances. On paper
the standard argument is: *every action reduces $h$ by at most 1, and $h = 0$ in every goal state*; then along an
optimal plan $h$ can drop by at most $h^*(s)$, so $h(s) \le h^*(s)$.

| heuristic | admissible? | why |
|---|---|---|
| rooms (30 Aug 2022): $x - 1$, box in $R_x$ | yes | one `PushThru` moves the box by one room |
| painting (12 Jul 2024): $2\,U_s(A) + P_s(B)$ | yes | each unpainted object at A needs 2 `move-object` (A→B, B→A), each painted object at B needs 1, and `move-object` moves one object |
| painting: $3\,U_s(A) + P_s(B)$ | **no** | one `paint` serves up to 3 objects: from the initial state $h = 18 > h^* = 17$ |
| $h = 0$ | yes | trivially |
| number of unsatisfied goal literals | **no** in general | one action can achieve several goal literals: `PushThru` puts robot **and** box in R1 |
| Hanoi: discs not on their final place | yes | each move moves one disc |
| Hanoi: twice that number | no | one disc away from the goal: $h = 2 > h^* = 1$ |

**Relaxations** give admissible heuristics for free: the optimal plan length of a problem **with fewer
constraints** (ignore preconditions, ignore delete lists) never exceeds the real one (AIMA §11.3). "Number of
unsatisfied goals" is the ignore-preconditions relaxation **only if** each action achieves one goal literal.
"""

ENTRY = 'h_star'


def _ref(init, goal, actions):
    parents, q = {init: set()}, deque([init])
    while q:
        s = q.popleft()
        for a in actions:
            if applicable(s, a):
                s1 = result(s, a)
                if s1 not in parents:
                    parents[s1] = set()
                    q.append(s1)
                parents[s1].add(s)
    d = {s: math.inf for s in parents}
    q = deque(s for s in parents if goal <= s)
    for s in q:
        d[s] = 0
    while q:
        s = q.popleft()
        for p in parents[s]:
            if d[p] == math.inf:
                d[p] = d[s] + 1
                q.append(p)
    return d


_ROOMS = [Schema('GoThru(d,r1,r2)', 'InRoom(ROBOT,r1), Connects(d,r1,r2)', 'InRoom(ROBOT,r2), ¬InRoom(ROBOT,r1)'),
          Schema('PushThru(b,d,r1,r2)', 'InRoom(ROBOT,r1), InRoom(b,r1), Connects(d,r1,r2), Box(b)',
                 'InRoom(ROBOT,r2), InRoom(b,r2), ¬InRoom(ROBOT,r1), ¬InRoom(b,r1)')]
_RI = atoms('InRoom(ROBOT,R3), InRoom(BOX1,R3), Connects(D1,R1,R2), Connects(D2,R2,R3), Connects(D1,R2,R1), '
            'Connects(D2,R3,R2), Box(BOX1)')
_RA = possible(ground_all(_ROOMS, ['BOX1', 'D1', 'D2', 'R1', 'R2', 'R3', 'ROBOT']), _RI)
_RG = atoms('InRoom(BOX1,R1)')
_RG2 = atoms('InRoom(BOX1,R1), InRoom(ROBOT,R1)')


def _box_room(s):
    return next(int(a[-2]) for a in s if a.startswith('InRoom(BOX1,')) - 1


_OBJ = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6']


def _painting(objs):
    acts = []
    for l, l2 in (('A', 'B'), ('B', 'A')):
        acts.append(Action(f'move({l},{l2})', atoms(f'at({l},Robot)'), atoms(f'at({l2},Robot)'), atoms(f'at({l},Robot)')))
        for o in objs:
            acts.append(Action(f'move-object({l},{l2},{o})', atoms(f'at({l},{o}), at({l},Robot)'),
                               atoms(f'at({l2},{o}), at({l2},Robot)'), atoms(f'at({l},{o}), at({l},Robot)')))
    for k in (1, 2, 3):   # paint(o,o',o'') with repeated arguments = painting 1, 2 or 3 distinct objects
        for c in itertools.combinations(objs, k):
            p = frozenset(f'painted({o})' for o in c)
            acts.append(Action('paint({})'.format(','.join(c)), frozenset(f'at(B,{o})' for o in c), p, frozenset(), p))
    init = frozenset({'at(A,Robot)'} | {f'at(A,{o})' for o in objs})
    goal = frozenset({f'at(A,{o})' for o in objs} | {f'painted({o})' for o in objs})
    return init, goal, acts


_PI, _PG, _PA = _painting(_OBJ)


def _count(s, loc, painted):
    return sum(f'at({loc},{o})' in s and (f'painted({o})' in s) == painted for o in _OBJ)


def _h_exam(s):
    return 2 * _count(s, 'A', False) + _count(s, 'B', True)


def _h_three(s):
    return 3 * _count(s, 'A', False) + _count(s, 'B', True)


_HI, _HG, _HA = hanoi(3)
_FINAL = {'d1': 'peg3', 'd2': 'd1', 'd3': 'd2'}


def _misplaced(s):
    return sum(f'on({d},{y})' not in s for d, y in _FINAL.items())


def _same_hstar(problem):
    def check(got, *args):
        want = _ref(*problem)
        if not isinstance(got, dict) or set(got) != set(want):
            return False, f'expected {len(want)} reachable states, got {len(got) if isinstance(got, dict) else got!r}'
        bad = [s for s in want if got[s] != want[s]]
        if bad:
            s = bad[0]
            return False, f'{len(bad)} wrong values, e.g. state {sorted(x for x in s if not x.startswith(("Connects", "Box", "smaller")))}: got {got[s]}, expected {want[s]}'
        return True, f'{len(want)} states, h*(init) = {want[problem[0]]}'
    return check


TESTS = [
    Test('h* on the rooms problem', args=(_RI, _RG, _RA), check=_same_hstar((_RI, _RG, _RA)),
         show='robot and box in R3, goal InRoom(BOX1,R1)'),
    Test('h* on the 3-disc Tower of Hanoi', args=(_HI, _HG, _HA), check=_same_hstar((_HI, _HG, _HA)), show='27 states'),
    Test('h* with unreachable goal = inf', args=(_RI, atoms('InRoom(BOX1,R4)'), _RA),
         check=_same_hstar((_RI, atoms('InRoom(BOX1,R4)'), _RA)), show='goal InRoom(BOX1,R4): no such room'),
    Test('exam 30 Aug 2022: h = x - 1 (box in Rx)', call=lambda sol: sol.is_admissible(_box_room, _RI, _RG, _RA),
         expected=True, show='admissible'),
    Test('unsatisfied goal literals', call=lambda sol: sol.is_admissible(lambda s: len(_RG2 - s), _RI, _RG2, _RA),
         expected=False, show='goal InRoom(BOX1,R1) ∧ InRoom(ROBOT,R1): one PushThru achieves both'),
    Test('Hanoi: discs not in their final place', call=lambda sol: sol.is_admissible(_misplaced, _HI, _HG, _HA),
         expected=True, show='admissible'),
    Test('Hanoi: twice that number', call=lambda sol: sol.is_admissible(lambda s: 2 * _misplaced(s), _HI, _HG, _HA),
         expected=False, show='overestimates near the goal'),
    Test('exam 12 Jul 2024: h = 2 U(A) + P(B)', call=lambda sol: sol.is_admissible(_h_exam, _PI, _PG, _PA),
         expected=True, show='6 objects, 8192 reachable states', timeout=20),
    Test('exam 12 Jul 2024: h = 0', call=lambda sol: sol.is_admissible(lambda s: 0, _PI, _PG, _PA),
         expected=True, show='trivially admissible', timeout=20),
    Test('painting: h = 3 U(A) + P(B)', call=lambda sol: sol.is_admissible(_h_three, _PI, _PG, _PA),
         expected=False, show='one paint action serves 3 objects', timeout=20),
]
