from harness import Test
from csp_lib import australia, queens

TITLE = 'Which value first? Least constraining value'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['LCV', 'value ordering', 'succeed first']

STATEMENT = r"""
Implement ORDER-DOMAIN-VALUES with the **least constraining value** heuristic (slides p. 298):
given a variable, try first the value that **rules out the fewest values** in the remaining variables.

`order_domain_values(csp, domains, var, assignment)` → the values of `domains[var]` sorted by

$$\text{ruled\_out}(v) = \#\{(Y, y) : Y \text{ unassigned neighbor of var},\ y \in \texttt{domains}[Y],\ \neg\,\texttt{constraints}(var, v, Y, y)\}$$

ascending. Ties keep the order of `domains[var]` (Python's `sorted` is stable).
Count against the **current** domains, not `csp.domains`.

**Example (p. 298):** WA=R, NT=G, and forward checking left Q={R,B}, SA={B}, NSW={R,G,B}.
`Q=R` rules out R from NSW (1 value); `Q=B` rules out B from SA **and** B from NSW (2 values, and SA is left
with nothing!). LCV order: `['R', 'B']`.
"""

STARTER = '''from typing import Any
from csp_lib import CSP

def order_domain_values(csp: CSP, domains: dict[str, list], var: str, assignment: dict[str, Any]) -> list:
    """Values of var, least constraining first (stable)."""
    def ruled_out(value: Any) -> int:
        # TODO: how many values of the unassigned neighbors' CURRENT domains does var=value kill?
        return 0
    return sorted(domains[var], key=ruled_out)
'''

SOLUTION = '''from typing import Any
from csp_lib import CSP

def order_domain_values(csp: CSP, domains: dict[str, list], var: str, assignment: dict[str, Any]) -> list:
    """Values of var, least constraining first (stable)."""
    def ruled_out(value: Any) -> int:
        return sum(1 for Y in csp.neighbors[var] if Y not in assignment
                   for y in domains[Y] if not csp.constraints(var, value, Y, y))
    return sorted(domains[var], key=ruled_out)
'''

HINTS = [
    'For each candidate value, simulate forward checking and **count** what it would delete – without deleting anything.',
    'Loop over `csp.neighbors[var]` not in `assignment`, and over `y in domains[Y]` (current domains!); count the `y` with `not csp.constraints(var, value, Y, y)`.',
]

EXPLANATION = r"""
Variables and values are ordered with **opposite** philosophies:

| | heuristic | idea |
|---|---|---|
| variable | MRV (+ degree) | **fail first**: every variable must be assigned anyway, so meet the hardest one early |
| value | LCV | **succeed first**: we need only **one** value to work, so try the one that leaves the most options to the others |

If the problem has no solution (or we are in a dead branch), all values get tried anyway and the value
order is irrelevant; LCV pays off when it lets us find a solution without backtracking.

In 4-queens, LCV puts the corners first for X2 (`[1, 4, 2, 3]`): a queen in the middle of a column
attacks more squares in the neighboring columns. After X1=1, LCV prefers X2=4 over X2=3 – and indeed
X2=3 is exactly the value AC-3 deletes on p. 308.

Cost: one LCV call does the work of a forward-checking pass per value, $O(d \cdot s\,d)$.
"""

ENTRY = 'order_domain_values'


def _doms(**kw):
    return {k: list(v) for k, v in kw.items()}


_AUS = australia()
_Q4 = queens(4)

TESTS = [
    Test('Q after WA=R, NT=G (p. 298)',
         args=(_AUS, _doms(WA='R', NT='G', Q='RB', NSW='RGB', V='RGB', SA='B', T='RGB'), 'Q', {'WA': 'R', 'NT': 'G'}),
         expected=['R', 'B'], show='WA=R NT=G  Q=RB NSW=RGB SA=B'),
    Test('ties keep the domain order', args=(_AUS, _doms(**{v: 'RGB' for v in _AUS.variables}), 'WA', {}),
         expected=['R', 'G', 'B'], show='all domains RGB, var=WA: every color kills 2 values'),
    Test('count against CURRENT domains',
         args=(_AUS, _doms(WA='R', NT='B', Q='RG', NSW='RGB', V='RGB', SA='G', T='RGB'), 'V', {'WA': 'R', 'NT': 'B'}),
         check=lambda got, *a: (list(got) == ['R', 'B', 'G'],
                                'Expected [R, B, G]: V=G kills G in NSW and in SA, V=R and V=B kill only one value of NSW '
                                '(SA has only G left). With the initial domains all colors would tie.'),
         show='WA=R NT=B  NSW=RGB SA=G, var=V'),
    Test('4-queens X2 at the start: corners first', args=(_Q4, {v: [1, 2, 3, 4] for v in _Q4.variables}, 'X2', {}),
         expected=[1, 4, 2, 3], show='all domains {1,2,3,4}, var=X2'),
    Test('4-queens X2 after X1=1', args=(_Q4, {'X1': [1], 'X2': [3, 4], 'X3': [2, 4], 'X4': [2, 3]}, 'X2', {'X1': 1}),
         expected=[4, 3], show='X1=1  X2={3,4} X3={2,4} X4={2,3}, var=X2'),
]
