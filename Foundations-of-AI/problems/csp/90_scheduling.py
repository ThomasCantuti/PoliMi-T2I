import itertools

from harness import Test
from csp_lib import is_solution

TITLE = 'Formulate it yourself: the task-scheduling homework'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['formulation', 'temporal constraints', 'constraint graph', 'binary constraints']

STATEMENT = r"""
The homework of slide p. 270: 4 tasks $T_1, T_2, T_3, T_4$ are temporally constrained:

- $T_1$ must be done **during** $T_3$;
- $T_2$ must be **completed before** $T_1$ starts;
- $T_2$ must **overlap** $T_3$;
- $T_4$ must **start after** $T_1$ is complete.

Formulate it as a binary CSP with `scheduling_csp(durations, horizon)`:
- **variables** `['T1', 'T2', 'T3', 'T4']`, the value of `Ti` is its integer **start time** $s_i$;
  task $i$ occupies the time units $s_i, s_i+1, \dots, s_i+d_i-1$ where $d_i$ = `durations['Ti']`;
- **domains**: every start time such that the task ends within the horizon: $0 \le s_i \le H - d_i$;
- **neighbors**: exactly the constraint graph of the slide (T1–T2, T1–T3, T2–T3, T1–T4);
- **constraints(A, a, B, b)** with this precise semantics:

| constraint | meaning |
|---|---|
| T1 during T3 | $s_3 \le s_1$ and $s_1 + d_1 \le s_3 + d_3$ |
| T2 before T1 | $s_2 + d_2 \le s_1$ |
| T2 overlaps T3 | they share at least one time unit: $s_2 < s_3 + d_3$ and $s_3 < s_2 + d_2$ |
| T4 after T1 | $s_1 + d_1 \le s_4$ |

⚠️ The solvers call `constraints` with the arguments in **both** orders: `constraints('T3', 1, 'T1', 2)`
must give the same answer as `constraints('T1', 2, 'T3', 1)`.

Build it with `from csp_lib import CSP` → `CSP(variables, domains, neighbors, constraints)`.
"""

STARTER = '''from csp_lib import CSP

def scheduling_csp(durations: dict[str, int], horizon: int) -> CSP:
    d = durations
    variables = ['T1', 'T2', 'T3', 'T4']
    domains: dict[str, list[int]] = {}      # TODO: start times 0 .. horizon - d[T]
    neighbors: dict[str, list[str]] = {}    # TODO: the constraint graph of the slide

    def constraints(A: str, a: int, B: str, b: int) -> bool:
        # TODO: one case per edge of the graph, valid in both argument orders
        return True

    return CSP(variables, domains, neighbors, constraints)
'''

SOLUTION = '''from csp_lib import CSP

def scheduling_csp(durations: dict[str, int], horizon: int) -> CSP:
    d = durations
    variables = ['T1', 'T2', 'T3', 'T4']
    domains: dict[str, list[int]] = {t: list(range(horizon - d[t] + 1)) for t in variables}
    neighbors: dict[str, list[str]] = {'T1': ['T2', 'T3', 'T4'], 'T2': ['T1', 'T3'],
                                       'T3': ['T1', 'T2'], 'T4': ['T1']}

    def constraints(A: str, a: int, B: str, b: int) -> bool:
        if A > B:                       # put the pair in a canonical order: T1 < T2 < T3 < T4
            A, a, B, b = B, b, A, a
        if (A, B) == ('T1', 'T3'):      # T1 during T3
            return b <= a and a + d['T1'] <= b + d['T3']
        if (A, B) == ('T1', 'T2'):      # T2 completed before T1 starts
            return b + d['T2'] <= a
        if (A, B) == ('T2', 'T3'):      # T2 overlaps T3
            return a < b + d['T3'] and b < a + d['T2']
        if (A, B) == ('T1', 'T4'):      # T4 starts after T1 is complete
            return a + d['T1'] <= b
        return True

    return CSP(variables, domains, neighbors, constraints)
'''

HINTS = [
    'Domains: `list(range(horizon - d[t] + 1))`. Neighbors: write the 4 edges in both directions (T1 has 3 neighbors, T4 only 1).',
    'For the constraint function, avoid writing 8 cases: if the pair comes "reversed" (`A > B` as strings), swap `(A, a)` with `(B, b)`, then handle the 4 canonical pairs.',
    'Translate each row of the table literally, e.g. for (T1, T3): `return b <= a and a + d["T1"] <= b + d["T3"]` (here `a` is the start of T1 and `b` the start of T3).',
]

EXPLANATION = r"""
**Formulating** is the exam skill here: choose the variables (start times), the domains (bounded by the
horizon), and express every sentence as a constraint on a **pair** of variables – which makes this a
binary CSP whose constraint graph is the one drawn on the slide. Notice that T3 and T4 are **not**
neighbors: no sentence relates them directly (they interact only *through* T1).

**Are the constraints compatible?** Yes, under these semantics: e.g. with durations 2, 2, 4, 1,
$T_3=[0,4)$, $T_2=[0,2)$, $T_1=[2,4)$, $T_4=[4,5)$. Chaining the constraints gives
$s_3 < s_2 + d_2 \le s_1$ and $s_1 + d_1 \le s_3 + d_3$: $T_2$ must start the overlap **before** $T_1$, inside or
just before $T_3$.

> **Exam trap:** the answer depends on what "overlap" means. If "T2 overlaps T3" is read as Allen's relation
> "T3 starts first and T2 ends **after** T3 ends", then $s_3+d_3 < s_2+d_2 \le s_1 < s_1+d_1 \le s_3+d_3$ –
> a contradiction, and the answer becomes **no**. Always state your interval semantics before answering.

With durations $d_1 = 3 > d_3 = 2$ the CSP is unsolvable (T1 cannot fit during T3), and plain backtracking
discovers it only after 21 assignments – while one AC-3 pass on the arc T1→T3 empties $D_1$ immediately.
"""

ENTRY = 'scheduling_csp'

_D = {'T1': 2, 'T2': 2, 'T3': 4, 'T4': 1}
_EDGES = {('T1', 'T2'), ('T1', 'T3'), ('T2', 'T3'), ('T1', 'T4')}


def _ref_ok(d, A, a, B, b):
    if A > B:
        A, a, B, b = B, b, A, a
    return {('T1', 'T3'): lambda: b <= a and a + d['T1'] <= b + d['T3'],
            ('T1', 'T2'): lambda: b + d['T2'] <= a,
            ('T2', 'T3'): lambda: a < b + d['T3'] and b < a + d['T2'],
            ('T1', 'T4'): lambda: a + d['T1'] <= b}.get((A, B), lambda: True)()


def _ref_solutions(d, H):
    names = ['T1', 'T2', 'T3', 'T4']
    doms = [range(H - d[t] + 1) for t in names]
    return {s for s in itertools.product(*doms)
            if all(_ref_ok(d, A, s[names.index(A)], B, s[names.index(B)]) for A, B in _EDGES)}


def _structure(got, d, H):
    if list(got.variables) != ['T1', 'T2', 'T3', 'T4']:
        return False, f"variables should be ['T1', 'T2', 'T3', 'T4'], got {got.variables}"
    for t in got.variables:
        if list(got.domains[t]) != list(range(H - d[t] + 1)):
            return False, f'domain of {t} should be 0..{H - d[t]} (the task must end by the horizon {H}), got {got.domains[t]}'
    for t in got.variables:
        want = sorted({b for a, b in _EDGES if a == t} | {a for a, b in _EDGES if b == t})
        if sorted(got.neighbors[t]) != want:
            return False, f'neighbors of {t} should be {want}, got {sorted(got.neighbors[t])}'
    return True


def _constraints(got, d, H):
    for A, B in sorted(_EDGES):
        for a in range(H - d[A] + 1):
            for b in range(H - d[B] + 1):
                want = _ref_ok(d, A, a, B, b)
                if bool(got.constraints(A, a, B, b)) != want:
                    return False, f'constraints({A!r}, {a}, {B!r}, {b}) should be {want}'
                if bool(got.constraints(B, b, A, a)) != want:
                    return False, f'constraints({B!r}, {b}, {A!r}, {a}) should be {want} (reversed argument order!)'
    return True


def _solutions(got, d, H):
    sols = {s for s in itertools.product(*(got.domains[t] for t in got.variables))
            if is_solution(got, dict(zip(got.variables, s)))}
    want = _ref_solutions(d, H)
    if sols != want:
        return False, f'your CSP has {len(sols)} solutions, expected {len(want)} (e.g. missing {sorted(want - sols)[:2]}, extra {sorted(sols - want)[:2]})'
    return True


TESTS = [
    Test('variables, domains, constraint graph', args=(_D, 8), check=_structure,
         show='durations T1=2 T2=2 T3=4 T4=1, horizon 8'),
    Test('constraints, in both argument orders', args=(_D, 8), check=_constraints,
         show='every pair of start times on every edge'),
    Test('all 26 schedules found', args=(_D, 8), check=_solutions, show='durations 2, 2, 4, 1, horizon 8'),
    Test('tight horizon: 2 schedules', args=(_D, 5), check=_solutions, show='durations 2, 2, 4, 1, horizon 5'),
    Test('too tight: no schedule', args=(_D, 4), check=_solutions, show='durations 2, 2, 4, 1, horizon 4'),
    Test('T1 longer than T3: unsolvable', args=({'T1': 3, 'T2': 1, 'T3': 2, 'T4': 1}, 8), check=_solutions,
         show='durations 3, 1, 2, 1, horizon 8'),
    Test('unit tasks', args=({'T1': 1, 'T2': 1, 'T3': 3, 'T4': 1}, 4), check=_solutions,
         show='durations 1, 1, 3, 1, horizon 4: 5 schedules'),
]
