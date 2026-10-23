from harness import Test

TITLE = 'Exercise book 3.1 · AC-3 with constraints given as allowed pairs'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exercise book', 'AC-3', 'arc consistency', 'table constraints', 'hand simulation']

STATEMENT = r"""
*Exercise book, Exercise 3.1.* Constraints are given **extensionally**, as sets of allowed combinations:

```text
Variables: X1, X2, X3      Domains: D1 = {1, 2, 3, 4}, D2 = {α, β, γ}, D3 = {a, b}
C(X1, X2) = {<1,α>, <2,γ>, <3,α>, <4,γ>}
C(X1, X3) = {<1,a>, <3,a>, <4,b>}
C(X2, X3) = {<α,b>, <β,a>, <γ,b>}
```

Apply AC-3 and report the resulting domains. Can you find a solution of the simplified problem?

The exercise book writes the queue after every step; arcs are extracted from the **left** and appended on the
**right**, initially Q = {X1→X2, X2→X1, X1→X3, X3→X1, X2→X3, X3→X2}, and a re-queued arc is appended **even if it is
already in the queue** (exactly as in the pseudocode of p. 294 — the visualizer instead skips duplicates; the final
domains are the same).

Implement `ac3_table(domains, allowed, queue)`:

- `domains`: `{X: [values]}` — do **not** modify it; work on a copy (keep the value order).
- `allowed`: `{(X, Y): {(x, y), ...}}` — each constraint is given **once**, for one orientation of the pair; the arc
  Y → X must use the same set with the pairs read backwards.
- `queue`: the initial list of arcs `(Xi, Xj)`.
- neighbours of X = the variables sharing a constraint with X, **in the order of `domains`**. When
  `revise(Xi, Xj)` deletes something, append `(Xk, Xi)` for every neighbour `Xk ≠ Xj`, without checking for duplicates.
- Return `(ok, final_domains, log)`, where `log` has one entry `(Xi, Xj, [removed values in domain order])` for every
  popped arc. If a domain becomes empty, log that arc and return `False` immediately.
"""

STARTER = '''from collections import deque

def ac3_table(domains: dict[str, list], allowed: dict[tuple[str, str], set], queue: list[tuple[str, str]]):
    """AC-3 with extensional constraints. Returns (ok, domains, log)."""
    D = {X: list(vals) for X, vals in domains.items()}
    log: list[tuple[str, str, list]] = []
    # TODO: compatible(Xi, x, Xj, y) must work for both orientations of each constraint
    return True, D, log
'''

SOLUTION = '''from collections import deque

def ac3_table(domains: dict[str, list], allowed: dict[tuple[str, str], set], queue: list[tuple[str, str]]):
    """AC-3 with extensional constraints. Returns (ok, domains, log)."""
    D = {X: list(vals) for X, vals in domains.items()}
    log: list[tuple[str, str, list]] = []

    def compatible(Xi, x, Xj, y):
        if (Xi, Xj) in allowed:
            return (x, y) in allowed[(Xi, Xj)]
        return (y, x) in allowed[(Xj, Xi)]

    neighbors = {X: [Y for Y in D if (X, Y) in allowed or (Y, X) in allowed] for X in D}
    q = deque(tuple(arc) for arc in queue)
    while q:
        Xi, Xj = q.popleft()
        removed = [x for x in D[Xi] if not any(compatible(Xi, x, Xj, y) for y in D[Xj])]
        D[Xi] = [x for x in D[Xi] if x not in removed]
        log.append((Xi, Xj, removed))
        if removed:
            if not D[Xi]:
                return False, D, log
            for Xk in neighbors[Xi]:
                if Xk != Xj:
                    q.append((Xk, Xi))
    return True, D, log
'''

HINTS = [
    'Write `compatible(Xi, x, Xj, y)`: look up `(x, y)` in `allowed[(Xi, Xj)]` if that key exists, otherwise `(y, x)` in `allowed[(Xj, Xi)]`.',
    'REVISE: `removed = [x for x in D[Xi] if not any(compatible(Xi, x, Xj, y) for y in D[Xj])]`, then filter `D[Xi]`.',
    'Log every popped arc, also when nothing is removed. On a deletion: empty → `return False, D, log`; otherwise append `(Xk, Xi)` for the other neighbours.',
]

EXPLANATION = r"""
The exercise book's run (11 arcs popped):

| arc | effect | queue afterwards |
|---|---|---|
| X1→X2 | nothing | X2→X1, X1→X3, X3→X1, X2→X3, X3→X2 |
| X2→X1 | D2 = {α, γ} (β has no partner in C(X1, X2)) | X1→X3, X3→X1, X2→X3, X3→X2, **X3→X2** |
| X1→X3 | D1 = {1, 3, 4} (2 has no partner in C(X1, X3)) | X3→X1, X2→X3, X3→X2, X3→X2, **X2→X1** |
| X3→X1 | nothing | X2→X3, X3→X2, X3→X2, X2→X1 |
| X2→X3 | nothing | X3→X2, X3→X2, X2→X1 |
| X3→X2 | D3 = {b} (a needs X2 = β, which is gone) | X3→X2, X2→X1, **X1→X3** |
| X3→X2 | nothing | X2→X1, X1→X3 |
| X2→X1 | nothing | X1→X3 |
| X1→X3 | D1 = {4} (1 and 3 need X3 = a) | **X2→X1** |
| X2→X1 | D2 = {γ} (α needs X1 ∈ {1, 3}) | **X3→X2** |
| X3→X2 | nothing | empty → success |

Final domains D1 = {4}, D2 = {γ}, D3 = {b}: one value each, and (4, γ, b) is a solution. This is **not guaranteed
in general**: AC-3 may leave a simplified but still non-trivial problem, or fail to detect that no solution exists,
because it only removes arc inconsistencies.

Note the duplicate X3→X2 in the queue: the pseudocode does not check for duplicates. Skipping them (as the
visualizer does) saves work and gives the same final domains — the arc-consistent closure is unique.
"""

ENTRY = 'ac3_table'

_Q = [('X1', 'X2'), ('X2', 'X1'), ('X1', 'X3'), ('X3', 'X1'), ('X2', 'X3'), ('X3', 'X2')]
_D31 = {'X1': [1, 2, 3, 4], 'X2': ['α', 'β', 'γ'], 'X3': ['a', 'b']}
_C31 = {('X1', 'X2'): {(1, 'α'), (2, 'γ'), (3, 'α'), (4, 'γ')}, ('X1', 'X3'): {(1, 'a'), (3, 'a'), (4, 'b')},
        ('X2', 'X3'): {('α', 'b'), ('β', 'a'), ('γ', 'b')}}
_D32 = {'X1': [1, 2, 3, 4], 'X2': ['a', 'b', 'c'], 'X3': ['α', 'β', 'γ']}
_C32 = {('X1', 'X2'): {(1, 'a'), (2, 'b'), (3, 'a'), (3, 'b'), (4, 'b')}, ('X1', 'X3'): {(1, 'β'), (3, 'β'), (4, 'β')},
        ('X2', 'X3'): {('a', 'γ'), ('b', 'β'), ('b', 'α'), ('c', 'γ')}}
_R = range(1, 5)
_DJ = {v: [1, 2, 3, 4] for v in 'ABCD'}
_CJ = {('A', 'B'): {(a, b) for a in _R for b in _R if a > b}, ('B', 'C'): {(b, b) for b in _R},
       ('D', 'A'): {(d, a) for d in _R for a in _R if d != a}}
_LT = {(1, 2)}

_LOG31 = [('X1', 'X2', []), ('X2', 'X1', ['β']), ('X1', 'X3', [2]), ('X3', 'X1', []), ('X2', 'X3', []),
          ('X3', 'X2', ['a']), ('X3', 'X2', []), ('X2', 'X1', []), ('X1', 'X3', [1, 3]), ('X2', 'X1', ['α']),
          ('X3', 'X2', [])]


def _domains_only(expected_ok, expected):
    def check(got, *args):
        ok, D, _ = got
        if ok is not expected_ok:
            return False, f'AC-3 should return {expected_ok}.'
        if {k: list(v) for k, v in D.items()} != expected:
            return False, f'Final domains {D}, expected {expected}.'
        return True
    return check


def _no_side_effect(sol):
    d = {k: list(v) for k, v in _D31.items()}
    sol.ac3_table(d, _C31, _Q)
    return d


TESTS = [
    Test('Exercise 3.1: the whole log', args=(_D31, _C31, _Q),
         expected=(True, {'X1': [4], 'X2': ['γ'], 'X3': ['b']}, _LOG31),
         show='exercise 3.1, book queue X1→X2, X2→X1, X1→X3, X3→X1, X2→X3, X3→X2'),
    Test('the input domains are not modified', call=_no_side_effect, expected=_D31, show='exercise 3.1'),
    Test('Exercise 3.2 constraints', args=(_D32, _C32, _Q),
         check=_domains_only(True, {'X1': [3, 4], 'X2': ['b'], 'X3': ['β']}),
         show='exercise 3.2: same queue'),
    Test('Exam Jun 2022: A > B, B = C, D ≠ A — first two steps', args=(_DJ, _CJ, [('A', 'B'), ('B', 'A'), ('B', 'C'), ('C', 'B'), ('D', 'A'), ('A', 'D')]),
         check=lambda got, *a: (got[2][:2] == [('A', 'B', [1]), ('B', 'A', [4])] and got[1] ==
                                {'A': [2, 3, 4], 'B': [1, 2, 3], 'C': [1, 2, 3], 'D': [1, 2, 3, 4]},
                                f'log starts {got[2][:2]}, domains {got[1]}'),
         show='queue A>B, B<A, B=C, C=B, D≠A, A≠D; domains {1,2,3,4}'),
    Test('X < Y < Z with domains {1, 2}: failure', args=({'X': [1, 2], 'Y': [1, 2], 'Z': [1, 2]},
                                                        {('X', 'Y'): _LT, ('Y', 'Z'): _LT},
                                                        [('X', 'Y'), ('Y', 'X'), ('Y', 'Z'), ('Z', 'Y')]),
         expected=(False, {'X': [1], 'Y': [], 'Z': [1, 2]}, [('X', 'Y', [2]), ('Y', 'X', [1]), ('Y', 'Z', [2])]),
         show='C(X,Y) = C(Y,Z) = {<1,2>}'),
]
