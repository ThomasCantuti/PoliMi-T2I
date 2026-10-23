from harness import Test
from csp_lib import CSP, australia, queens, different_values

TITLE = 'Which variable next? MRV + degree heuristic'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['MRV', 'degree heuristic', 'variable ordering', 'fail first']

STATEMENT = r"""
Implement SELECT-UNASSIGNED-VARIABLE with the heuristics of slides p. 298:

1. **Minimum Remaining Values (MRV)** – choose the unassigned variable with the **fewest values left** in its
   current domain (`len(domains[v])`);
2. **Degree heuristic** (tie-breaker) – among those, choose the one involved in the **largest number of
   constraints with unassigned variables** (neighbors not in `assignment`);
3. still tied → the one that comes first in `csp.variables`.

`select_unassigned_variable(csp, domains, assignment)` → a variable name.

**Example (p. 298):** after WA=R and NT=G (with forward checking) SA has only {B} left → `'SA'`.
At the very start every domain has 3 colors, and SA wins on degree (5 neighbors).
"""

STARTER = '''from typing import Any
from csp_lib import CSP

def select_unassigned_variable(csp: CSP, domains: dict[str, list], assignment: dict[str, Any]) -> str:
    """MRV, then degree (constraints with UNASSIGNED variables), then csp.variables order."""
    unassigned = [v for v in csp.variables if v not in assignment]
    # TODO
    return unassigned[0]
'''

SOLUTION = '''from typing import Any
from csp_lib import CSP

def select_unassigned_variable(csp: CSP, domains: dict[str, list], assignment: dict[str, Any]) -> str:
    """MRV, then degree (constraints with UNASSIGNED variables), then csp.variables order."""
    unassigned = [v for v in csp.variables if v not in assignment]

    def degree(v: str) -> int:
        return sum(1 for Y in csp.neighbors[v] if Y not in assignment)

    return min(unassigned, key=lambda v: (len(domains[v]), -degree(v)))
'''

HINTS = [
    'Build the list of unassigned variables in `csp.variables` order; the answer is the "smallest" of them for a suitable key.',
    'A key can be a tuple, compared element by element: first the domain size (smaller is better), then the degree (larger is better → use `-degree`).',
    '`min(unassigned, key=lambda v: (len(domains[v]), -degree(v)))` — `min` returns the **first** of equal keys, which gives you rule 3 for free. '
    'Count only the neighbors that are **not** in `assignment`.',
]

EXPLANATION = r"""
**Why the minimum, not the maximum? To fail fast.** If some variable is going to run out of values, the
current branch is dead whatever we do elsewhere: picking it now detects the failure at the top of the
subtree instead of after exploring all of it. And if MRV picks a variable with **one** value, the "choice"
is forced – no branching at all. That is why MRV is also called *most constrained variable*.

**Degree** is the tie-breaker – in particular at the start, when all domains are equal (Australia: SA, 5
constraints). Assigning the most connected variable first shrinks the most other domains, which makes MRV
informative sooner. Only constraints with **unassigned** variables count: a constraint with an already
assigned neighbor cannot shrink anything any more.

These heuristics are **domain-independent**: they only look at domains and the constraint graph, which
the factored representation exposes (p. 297). With forward checking + MRV, n-queens goes from ~200 000
assignments (plain backtracking, n = 20) to ~150 (problem 70).
"""

ENTRY = 'select_unassigned_variable'


def _doms(**kw):
    return {k: list(v) for k, v in kw.items()}


_AUS = australia()
_Q4 = queens(4)
# A has 4 constraints but 3 of them with assigned variables; B has 2, both with unassigned ones.
_G = CSP('ABCDEFG', {v: [1, 2] for v in 'ABCDEFG'},
         {'A': ['C', 'D', 'E', 'F'], 'B': ['F', 'G'], 'C': ['A'], 'D': ['A'], 'E': ['A'],
          'F': ['A', 'B'], 'G': ['B']}, different_values)

TESTS = [
    Test('Australia, nothing assigned', args=(_AUS, _doms(**{v: 'RGB' for v in _AUS.variables}), {}),
         expected='SA', show='all domains RGB: everyone ties on MRV, SA has degree 5'),
    Test('after WA=R: MRV tie, degree decides',
         args=(_AUS, _doms(WA='R', NT='GB', Q='RGB', NSW='RGB', V='RGB', SA='GB', T='RGB'), {'WA': 'R'}),
         expected='SA', show='WA=R  NT=GB SA=GB (others RGB)'),
    Test('after WA=R, NT=G (p. 298)',
         args=(_AUS, _doms(WA='R', NT='G', Q='RB', NSW='RGB', V='RGB', SA='B', T='RGB'), {'WA': 'R', 'NT': 'G'}),
         expected='SA', show='WA=R NT=G  Q=RB NSW=RGB V=RGB SA=B T=RGB'),
    Test('never pick an assigned variable',
         args=(_AUS, _doms(WA='R', NT='G', Q='R', NSW='G', V='R', SA='B', T='RGB'),
               {'WA': 'R', 'NT': 'G', 'Q': 'R', 'NSW': 'G', 'V': 'R', 'SA': 'B'}),
         expected='T', show='mainland colored, T=RGB'),
    Test('4-queens at the start: full tie', args=(_Q4, {v: [1, 2, 3, 4] for v in _Q4.variables}, {}),
         expected='X1', show='all domains {1,2,3,4}: first in csp.variables'),
    Test('MRV picks the smallest domain', args=(_Q4, {'X1': [1, 2, 3, 4], 'X2': [1, 2, 3], 'X3': [2], 'X4': [1, 3]}, {}),
         expected='X3', show='X1={1,2,3,4} X2={1,2,3} X3={2} X4={1,3}'),
    Test('degree counts only UNASSIGNED neighbors',
         args=(_G, {v: [1, 2] for v in 'ABFG'} | {'C': [1], 'D': [1], 'E': [1]}, {'C': 1, 'D': 1, 'E': 1}),
         check=lambda got, *a: (got == 'B', 'A has 4 constraints but only 1 with an unassigned variable (F); '
                                           'B has 2 (F and G). Expected B.'),
         show='A–C, A–D, A–E, A–F, B–F, B–G; C, D, E assigned; all other domains {1,2}'),
]
