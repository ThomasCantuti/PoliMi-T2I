from harness import Test
from csp_lib import australia, queens

TITLE = 'Forward checking: cross off the bad options'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['forward checking', 'filtering', 'domains']

STATEMENT = r"""
**Forward checking** (slides p. 279–284) keeps the *current domain* of every unassigned variable and,
each time a pair $(X, v)$ is added to the assignment $A$, crosses off the values that became impossible:

```text
When a variable-value pair (X, v) is added to an assignment A,
ForEach variable Y not in A Do
    ForEach constraint C involving Y and X Do
        Eliminate from the domain of Y all the values that do not satisfy C given A
```

Write `forward_checking(csp, domains, var, value, assignment)`:
- `domains` is `{variable: [values]}` (the current domains), `assignment` **already contains** `var = value`;
- return a **new** dict (do not modify `domains`): `var`'s domain becomes `[value]`, every **unassigned
  neighbor** `Y` keeps only the values `y` with `csp.constraints(var, value, Y, y)`, everything else is copied;
- keep the values in their original order; a domain may become **empty** (the caller detects the failure).

**The slide run (p. 280–283)**, columns WA NT Q NSW V SA:

| step | WA | NT | Q | NSW | V | SA |
|---|---|---|---|---|---|---|
| initial | RGB | RGB | RGB | RGB | RGB | RGB |
| WA = R | **R** | GB | RGB | RGB | RGB | GB |
| Q = G | R | B | **G** | RB | RGB | B |
| V = B | R | B | G | R | **B** | ∅ |
"""

STARTER = '''from typing import Any
from csp_lib import CSP

def forward_checking(csp: CSP, domains: dict[str, list], var: str, value: Any,
                     assignment: dict[str, Any]) -> dict[str, list]:
    """var=value was just added to assignment. Return the NEW pruned domains."""
    new = {v: list(vals) for v, vals in domains.items()}   # a copy: never touch `domains`
    # TODO: var's domain becomes [value]
    # TODO: prune the unassigned neighbors of var
    return new
'''

SOLUTION = '''from typing import Any
from csp_lib import CSP

def forward_checking(csp: CSP, domains: dict[str, list], var: str, value: Any,
                     assignment: dict[str, Any]) -> dict[str, list]:
    """var=value was just added to assignment. Return the NEW pruned domains."""
    new = {v: list(vals) for v, vals in domains.items()}
    new[var] = [value]
    for Y in csp.neighbors[var]:
        if Y not in assignment:
            new[Y] = [y for y in new[Y] if csp.constraints(var, value, Y, y)]
    return new
'''

HINTS = [
    'Only variables that share a constraint with `var` can lose values: loop over `csp.neighbors[var]`.',
    'Skip the neighbors already in `assignment`; for the others keep `[y for y in new[Y] if csp.constraints(var, value, Y, y)]`.',
    "Don't forget `new[var] = [value]`, and never write into `domains` itself: backtracking relies on the old domains being intact.",
]

EXPLANATION = r"""
Forward checking looks **one step ahead**: after each assignment it removes from the neighbors the values
that are now inconsistent. As soon as a domain becomes **empty**, the current partial assignment cannot be
part of a solution, and backtracking can stop *before* reaching that variable (p. 283: after
WA=R, Q=G, V=B the domain of SA is empty, although SA has not been tried yet).

**Cost** (p. 284): for $n$ variables, domain size $d$, and at most $s$ constraints per variable, one call is
$O(n \cdot s \cdot d)$ in the slide's formulation (with a neighbor list, just $O(s\,d)$).

**Why return a copy?** On backtracking you need the domains *as they were before* the assignment. With a
fresh dict per level, undoing is free: just drop it.

**What it misses** (p. 286): after WA=R, Q=G the table shows NT = {B} and SA = {B}. NT and SA are neighbors,
so they cannot both be blue – the state is already dead – but forward checking only checks the constraints
between the **assigned** variable and its neighbors, never between two **unassigned** variables. That
is exactly what **arc consistency** adds (next problem).
"""

ENTRY = 'forward_checking'


def _doms(**kw):
    return {k: list(v) for k, v in kw.items()}


_AUS = australia()
_A0 = {v: list('RGB') for v in _AUS.variables}
_A1 = _doms(WA='R', NT='GB', Q='RGB', NSW='RGB', V='RGB', SA='GB', T='RGB')
_A2 = _doms(WA='R', NT='B', Q='G', NSW='RB', V='RGB', SA='B', T='RGB')
_A3 = _doms(WA='R', NT='B', Q='G', NSW='R', V='B', SA='', T='RGB')

_Q4 = queens(4)
_Q0 = {v: [1, 2, 3, 4] for v in _Q4.variables}
_Q1 = {'X1': [1], 'X2': [3, 4], 'X3': [2, 4], 'X4': [2, 3]}
_Q2 = {'X1': [2], 'X2': [4], 'X3': [1, 3], 'X4': [1, 3, 4]}


def _expect(expected):
    def check(got, *args):
        if not isinstance(got, dict):
            return False, 'Return a dict {variable: [values]}.'
        if set(got) != set(expected):
            return False, f'The result must have every variable as a key: {sorted(expected)}.'
        bad = [v for v in expected if list(got[v]) != expected[v]]
        if bad:
            return False, '; '.join(f'{v}: expected {expected[v]}, got {list(got[v])}' for v in bad)
        return True
    return check


def _not_mutated(sol):
    doms = {v: list(d) for v, d in _A0.items()}
    sol.forward_checking(_AUS, doms, 'WA', 'R', {'WA': 'R'})
    return doms == _A0


def _fmt(d):
    return '  '.join(f"{k}={''.join(map(str, v)) or '∅'}" for k, v in d.items())


TESTS = [
    Test('p. 281: WA = R', args=(_AUS, _A0, 'WA', 'R', {'WA': 'R'}), check=_expect(_A1),
         show='initial domains, assign WA=R'),
    Test('p. 282: then Q = G', args=(_AUS, _A1, 'Q', 'G', {'WA': 'R', 'Q': 'G'}), check=_expect(_A2),
         show=_fmt(_A1) + '  →  assign Q=G'),
    Test('p. 283: then V = B empties SA', args=(_AUS, _A2, 'V', 'B', {'WA': 'R', 'Q': 'G', 'V': 'B'}),
         check=_expect(_A3), show=_fmt(_A2) + '  →  assign V=B'),
    Test('4-queens, X1 = 1 (p. 306)', args=(_Q4, _Q0, 'X1', 1, {'X1': 1}), check=_expect(_Q1),
         show='all domains {1,2,3,4}, assign X1=1'),
    Test('4-queens, X1 = 2 (p. 313)', args=(_Q4, _Q0, 'X1', 2, {'X1': 2}), check=_expect(_Q2),
         show='all domains {1,2,3,4}, assign X1=2'),
    Test('the input domains are not modified', call=_not_mutated,
         check=lambda got: (got, 'You modified the `domains` argument: build and return a new dict '
                                 '(backtracking needs the old domains when it undoes the assignment).'),
         show='forward_checking(...) must return a new dict and leave `domains` untouched'),
]
