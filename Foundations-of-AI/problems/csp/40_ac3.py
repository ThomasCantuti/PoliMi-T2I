from harness import Test
from csp_lib import CSP, australia, queens, different_values

TITLE = 'Arc consistency: REVISE and AC-3'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['arc consistency', 'AC-3', 'constraint propagation', 'inference']

STATEMENT = r"""
The arc $X_i \to X_j$ is **consistent** iff for **every** value $x$ in the tail $D_i$ there is **some**
$y$ in the head $D_j$ that satisfies the constraint (slides p. 287). Implement the two functions of
Figure 5.3 (p. 294); both work **in place** on `domains` (`{var: [values]}`, keep the order):

```text
function REVISE(csp, Xi, Xj) returns true iff we revise the domain of Xi
    revised <- false
    for each x in Di do
        if no value y in Dj allows (x, y) to satisfy the constraint between Xi and Xj then
            delete x from Di;  revised <- true
    return revised

function AC-3(csp) returns false if an inconsistency is found and true otherwise
    queue <- a queue of arcs, initially all the arcs in csp
    while queue is not empty do
        (Xi, Xj) <- POP(queue)
        if REVISE(csp, Xi, Xj) then
            if size of Di = 0 then return false
            for each Xk in Xi.NEIGHBORS - {Xj} do  add (Xk, Xi) to queue
    return true
```

- `revise(csp, domains, Xi, Xj)` → `bool`; only $D_i$ may shrink.
- `ac3(csp, domains)` → `bool`; "all the arcs" = `(Xi, Xk)` for every `Xi` and every `Xk` in `csp.neighbors[Xi]`
  (both directions of each constraint). Use a FIFO queue (`collections.deque`).

**Example (p. 291–293):** after WA=R and Q=G with forward checking, NT={B}, SA={B}, NSW={R,B}, V={R,G,B}.
AC-3 removes B from NSW, then R from V, then empties SA → returns `False`: the dead end that forward
checking could not see.
"""

STARTER = '''from collections import deque
from csp_lib import CSP

def revise(csp: CSP, domains: dict[str, list], Xi: str, Xj: str) -> bool:
    """Delete from domains[Xi] the values with no support in domains[Xj]. True iff something was deleted."""
    revised = False
    # TODO
    return revised

def ac3(csp: CSP, domains: dict[str, list]) -> bool:
    """Make every arc consistent, in place. False iff some domain becomes empty."""
    queue: deque[tuple[str, str]] = deque((Xi, Xk) for Xi in csp.variables for Xk in csp.neighbors[Xi])
    # TODO: pop arcs, revise, and re-queue the arcs pointing at a revised variable
    return True
'''

SOLUTION = '''from collections import deque
from csp_lib import CSP

def revise(csp: CSP, domains: dict[str, list], Xi: str, Xj: str) -> bool:
    """Delete from domains[Xi] the values with no support in domains[Xj]. True iff something was deleted."""
    revised = False
    for x in list(domains[Xi]):
        if not any(csp.constraints(Xi, x, Xj, y) for y in domains[Xj]):
            domains[Xi].remove(x)
            revised = True
    return revised

def ac3(csp: CSP, domains: dict[str, list]) -> bool:
    """Make every arc consistent, in place. False iff some domain becomes empty."""
    queue: deque[tuple[str, str]] = deque((Xi, Xk) for Xi in csp.variables for Xk in csp.neighbors[Xi])
    while queue:
        Xi, Xj = queue.popleft()
        if revise(csp, domains, Xi, Xj):
            if not domains[Xi]:
                return False
            for Xk in csp.neighbors[Xi]:
                if Xk != Xj:
                    queue.append((Xk, Xi))
    return True
'''

HINTS = [
    'REVISE is a "for all x … exists y" check. Iterate over a **copy** (`list(domains[Xi])`) since you delete while looping.',
    'For each `x`: `if not any(csp.constraints(Xi, x, Xj, y) for y in domains[Xj])` → remove `x`, `revised = True`.',
    'In AC-3, when `Di` shrinks, the values of **other** variables that relied on the deleted values may lose their '
    'support: the arcs to re-check are `(Xk, Xi)` – arrows pointing **at** `Xi` – for every neighbor `Xk` except `Xj`.',
    '`while queue: Xi, Xj = queue.popleft()` → `if revise(...)`: `if not domains[Xi]: return False`, then re-queue. After the loop: `return True`.',
]

EXPLANATION = r"""
**Direction matters.** REVISE$(X_i, X_j)$ only prunes the **tail** $X_i$. On p. 288 the arc NT→WA removes R
from NT; the reverse arc WA→NT removes nothing (R in WA is supported by G or B in NT).

**Why re-queue?** Deleting a value from $D_i$ can only hurt the variables that *used* that value as support,
i.e. the tails of arcs $(X_k, X_i)$. In the chain $X<Y<Z$ (test below) one pass leaves $X=\{1,2\}$: the
value 2 of X lost its support only when $Y$ shrank to $\{2\}$, *after* the arc $X\to Y$ had been checked.

**Complexity** (p. 295): with $n$ variables, $s$ constraints per variable ($\le ns$ arcs) and domain size $d$,
- each arc is inserted at most $d$ times (its head can lose at most $d$ values),
- REVISE costs $O(d^2)$,
- so AC-3 is $O(n s d^3)$ (the textbook writes $O(c\,d^3)$ with $c$ binary constraints).

**What it buys:** the 4-queens run of p. 307–315 – after X1=1, AC-3 empties $X_3$ (backtrack immediately);
after X1=2 it shrinks every domain to one value, so the solution falls out without further search.
After WA=R, NT=G it colors the whole mainland by inference alone.

**What it cannot do** (p. 316): X, Y, Z pairwise different with domains {1,2} is arc-consistent – every
value has a support on every single arc – yet there is no solution. AC-3 only looks at **pairs** of
variables; detecting this needs path / k-consistency, which costs more. AC-3 is the usual compromise.
"""

ENTRY = 'ac3'


def _doms(**kw):
    return {k: list(v) for k, v in kw.items()}


_AUS = australia()
_Q4 = queens(4)
_IDX = {'W': 0, 'X': 1, 'Y': 2, 'Z': 3}


def _less(A, a, B, b):
    return a < b if _IDX[A] < _IDX[B] else a > b


_CHAIN = CSP('XYZ', {v: [1, 2, 3] for v in 'XYZ'}, {'X': ['Y'], 'Y': ['X', 'Z'], 'Z': ['Y']}, _less)
_CHAIN4 = CSP('ZYXW', {v: [1, 2, 3, 4] for v in 'WXYZ'},
              {'W': ['X'], 'X': ['W', 'Y'], 'Y': ['X', 'Z'], 'Z': ['Y']}, _less)
_TRIANGLE = CSP('XYZ', {v: [1, 2] for v in 'XYZ'}, {'X': ['Y', 'Z'], 'Y': ['X', 'Z'], 'Z': ['X', 'Y']},
                different_values)


def _revise_case(domains, Xi, Xj, csp=_AUS):
    def run(sol):
        d = {k: list(v) for k, v in domains.items()}
        return sol.revise(csp, d, Xi, Xj), d
    return run


def _ac3(expected_ok, expected=None):
    def check(got, csp, domains):
        if got is not expected_ok:
            return False, f'AC-3 should return {expected_ok}.'
        if expected is not None:
            bad = [v for v in expected if list(domains[v]) != expected[v]]
            if bad:
                return False, 'Domains after AC-3 (modify `domains` in place): ' + '; '.join(
                    f'{v}: expected {expected[v]}, got {list(domains[v])}' for v in bad)
        return True
    return check


_Q4_X1_1 = {'X1': [1], 'X2': [3, 4], 'X3': [2, 4], 'X4': [2, 3]}
_Q4_X1_2 = {'X1': [2], 'X2': [4], 'X3': [1, 3], 'X4': [1, 3, 4]}
_AUS_WR_QG = _doms(WA='R', NT='B', Q='G', NSW='RB', V='RGB', SA='B', T='RGB')
_AUS_WR_NG = _doms(WA='R', NT='G', Q='RB', NSW='RGB', V='RGB', SA='B', T='RGB')

TESTS = [
    Test('revise(NT, WA): p. 288', call=_revise_case(_doms(WA='R', NT='RGB'), 'NT', 'WA'),
         expected=(True, _doms(WA='R', NT='GB')), show="WA={R}, NT={R,G,B}: revise(NT, WA)"),
    Test('revise(WA, NT): the other direction', call=_revise_case(_doms(WA='R', NT='RGB'), 'WA', 'NT'),
         expected=(False, _doms(WA='R', NT='RGB')), show="WA={R}, NT={R,G,B}: revise(WA, NT)"),
    Test('revise(NSW, SA): p. 291', call=_revise_case(_doms(NSW='RB', SA='B'), 'NSW', 'SA'),
         expected=(True, _doms(NSW='R', SA='B')), show="NSW={R,B}, SA={B}: revise(NSW, SA)"),
    Test('revise(NSW, V): p. 290 "Ok!"', call=_revise_case(_doms(NSW='RB', V='RGB'), 'NSW', 'V'),
         expected=(False, _doms(NSW='RB', V='RGB')), show="NSW={R,B}, V={R,G,B}: revise(NSW, V)"),
    Test('revise(X2, X1): two values deleted in a row', call=_revise_case({'X1': [1], 'X2': [1, 2, 3, 4]}, 'X2', 'X1', _Q4),
         check=lambda got: (got == (True, {'X1': [1], 'X2': [3, 4]}),
                            'Expected (True, X2=[3, 4]). If 2 survived: you deleted from the list you were looping over, '
                            'which skips the element right after a deleted one. Loop over a copy.'),
         show='X1={1}, X2={1,2,3,4}: revise(X2, X1)'),
    Test('revise(X2, X3): 4-queens p. 308', call=_revise_case({'X2': [3, 4], 'X3': [2, 4]}, 'X2', 'X3', _Q4),
         expected=(True, {'X2': [4], 'X3': [2, 4]}), show='X2={3,4}, X3={2,4}: revise(X2, X3)'),
    Test('AC-3 on the initial 4-queens (p. 304)', args=(_Q4, {v: [1, 2, 3, 4] for v in _Q4.variables}),
         check=_ac3(True, {v: [1, 2, 3, 4] for v in _Q4.variables}), show='all domains {1,2,3,4}'),
    Test('AC-3 after X1 = 1 (p. 307–311)', args=(_Q4, _Q4_X1_1), check=_ac3(False),
         show='X1={1}, X2={3,4}, X3={2,4}, X4={2,3}'),
    Test('AC-3 after X1 = 2 (p. 313–315)', args=(_Q4, _Q4_X1_2),
         check=_ac3(True, {'X1': [2], 'X2': [4], 'X3': [1], 'X4': [3]}),
         show='X1={2}, X2={4}, X3={1,3}, X4={1,3,4}'),
    Test('AC-3 after WA=R, Q=G (p. 293)', args=(_AUS, _AUS_WR_QG), check=_ac3(False),
         show='WA=R NT=B Q=G NSW=RB V=RGB SA=B T=RGB'),
    Test('AC-3 after WA=R, NT=G: inference colors the mainland', args=(_AUS, _AUS_WR_NG),
         check=_ac3(True, _doms(WA='R', NT='G', Q='R', NSW='G', V='R', SA='B', T='RGB')),
         show='WA=R NT=G Q=RB NSW=RGB V=RGB SA=B T=RGB'),
    Test('chain X<Y<Z: why re-queue', args=(_CHAIN, {v: [1, 2, 3] for v in 'XYZ'}),
         check=_ac3(True, {'X': [1], 'Y': [2], 'Z': [3]}), show='X<Y<Z, all domains {1,2,3}'),
    Test('chain W<X<Y<Z, listed backwards', args=(_CHAIN4, {v: [1, 2, 3, 4] for v in 'WXYZ'}),
         check=_ac3(True, {'W': [1], 'X': [2], 'Y': [3], 'Z': [4]}), show='variables Z, Y, X, W; domains {1..4}'),
    Test('beyond AC-3 (p. 316): consistent arcs, no solution', args=(_TRIANGLE, {v: [1, 2] for v in 'XYZ'}),
         check=_ac3(True, {v: [1, 2] for v in 'XYZ'}), show='X≠Y, Y≠Z, X≠Z, all domains {1,2}'),
]
