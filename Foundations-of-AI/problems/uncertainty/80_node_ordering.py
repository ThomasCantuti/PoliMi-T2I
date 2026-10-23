from harness import Test
from uncertainty_lib import burglary, dag, telescope_dag

TITLE = 'Building a network from a node ordering'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['network construction', 'node ordering', 'compactness', 'causal ordering']

STATEMENT = r"""
AIMA's method for building a Bayesian network (AIMA §13.2):

```text
1. Nodes: choose an ordering X1, ..., Xn of the variables
2. Links: for i = 1 to n
     choose a minimal set of parents for Xi among X1, ..., X(i-1) such that
         P(Xi | X(i-1), ..., X1) = P(Xi | Parents(Xi))
     draw an arrow from each parent to Xi
```

The condition says: $X_i$ is conditionally independent of its **other** predecessors given the chosen parents.
To know which independences hold in the domain we use a "true" causal network `g` (a DAG
`{node: tuple of parents}`) as an oracle: `d_separated(g, X, Ys, evidence)` (given; `Ys` may be a set) tells
whether $X \perp Ys \mid evidence$.

Write
- `build_network(g, order)` → `{X: tuple of parents}` for the network obtained with that ordering: for each
  $X_i$, the **smallest** subset $S$ of its predecessors such that $X_i$ is d-separated from the remaining
  predecessors given $S$ (try subsets by increasing size, `itertools.combinations`); list each node's parents in
  the order in which they appear in `order`;
- `num_parameters(parents)` → the number of independent numbers in the CPTs if every variable is **boolean**:
  $\sum_i 2^{\lvert Parents(X_i) \rvert}$.

**Example (AIMA Figure 13.3):** with the burglary network and the ordering MaryCalls, JohnCalls, Alarm,
Burglary, Earthquake you get $M$; $M \to J$; $M, J \to A$; $A \to B$; $A, B \to E$: 13 numbers instead of 10.
"""

STARTER = '''import itertools
from uncertainty_lib import d_separated

def build_network(g: dict, order: list) -> dict:
    """Parents chosen by the construction method for this ordering."""
    parents = {}
    for i, X in enumerate(order):
        preds = order[:i]
        parents[X] = tuple(preds)          # TODO: keep only a minimal sufficient subset
    return parents

def num_parameters(parents: dict) -> int:
    """Independent CPT numbers, all variables boolean."""
    return 0
'''

SOLUTION = '''import itertools
from uncertainty_lib import d_separated

def build_network(g: dict, order: list) -> dict:
    """Parents chosen by the construction method for this ordering."""
    parents = {}
    for i, X in enumerate(order):
        preds = order[:i]
        for size in range(len(preds) + 1):
            S = next((S for S in itertools.combinations(preds, size)
                      if not set(preds) - set(S) or d_separated(g, X, set(preds) - set(S), set(S))), None)
            if S is not None:
                parents[X] = S
                break
    return parents

def num_parameters(parents: dict) -> int:
    """Independent CPT numbers, all variables boolean."""
    return sum(2 ** len(P) for P in parents.values())
'''

HINTS = [
    'For node `order[i]` the candidates are `preds = order[:i]`. For `size = 0, 1, 2, ...` try every '
    '`S in itertools.combinations(preds, size)` (combinations keep the order of `preds`).',
    '`S` is good if `rest = set(preds) - set(S)` is empty, or `d_separated(g, X, rest, set(S))`. The first good '
    '`S` of the smallest size is the parent set.',
    'A boolean node with $k$ boolean parents has $2^k$ CPT rows and one free number per row: '
    '`sum(2 ** len(P) for P in parents.values())`.',
]

EXPLANATION = r"""
**Any ordering gives a correct network**: by construction each node is independent of its other predecessors
given its parents, so the chain rule of the network equals the general chain rule. But the size changes a lot
(AIMA Figure 13.3):

| ordering | network | numbers |
|---|---|---|
| B, E, A, J, M (causal) | the original | 10 |
| M, J, A, B, E | $M \to J$; $M, J \to A$; $A \to B$; $A, B \to E$ | 13 |
| M, J, E, B, A | every earlier node is a parent | 31 = $2^5 - 1$ |

Why $E$ needs $B$ as a parent in the second ordering: given the alarm, burglary and earthquake compete to
explain it (v-structure $B \to A \leftarrow E$ opened by $A$). Why $A$ needs both calls: given only Mary's call,
John's call still says something about the alarm.

**Telescopes (exam 8 Sep 2025):** with the causal network $N \to M_1 \leftarrow F_1$, $N \to M_2 \leftarrow F_2$
and the ordering $M_1, M_2, N, F_1, F_2$ the method returns network (iii): $P(M_1)$, $P(M_2 \mid M_1)$,
$P(N \mid M_1, M_2)$, $P(F_1 \mid M_1, N)$, $P(F_2 \mid M_2, N)$ — correct but bigger (15 numbers vs 11 if all
boolean), and harder to assess. Network (i) $F_1 \to M_1 \to N \leftarrow M_2 \leftarrow F_2$ is never
produced, whatever the ordering: it lacks a needed arrow (it claims $M_1 \perp M_2$, but both measure $N$).

> **Exam trap:** "correct" ≠ "causal". A diagnostic ordering still gives a correct network if no needed arrow is
> dropped. The causal ordering is preferred because it is compact and its numbers are easy to estimate.
"""

ENTRY = 'build_network'

_B = dag(burglary())
_T = telescope_dag()
_ORIG = ['Burglary', 'Earthquake', 'Alarm', 'JohnCalls', 'MaryCalls']
_MJABE = ['MaryCalls', 'JohnCalls', 'Alarm', 'Burglary', 'Earthquake']
_MJEBA = ['MaryCalls', 'JohnCalls', 'Earthquake', 'Burglary', 'Alarm']
_TEL = ['M1', 'M2', 'N', 'F1', 'F2']


def _parents(expected):
    def check(got, g, order):
        if not isinstance(got, dict) or set(got) != set(expected):
            return False, 'Return a dict with one entry per variable.'
        bad = [X for X in expected if set(got[X]) != set(expected[X])]
        return (not bad), ('' if not bad else 'Wrong parents for ' + ', '.join(
            f'{X} (expected {sorted(expected[X])}, got {sorted(got[X])})' for X in bad))
    return check


TESTS = [
    Test('causal ordering gives back the original network', args=(_B, _ORIG),
         check=_parents({'Burglary': (), 'Earthquake': (), 'Alarm': ('Burglary', 'Earthquake'),
                         'JohnCalls': ('Alarm',), 'MaryCalls': ('Alarm',)}), show='burglary, B E A J M'),
    Test('AIMA Figure 13.3(a): M, J, A, B, E', args=(_B, _MJABE),
         check=_parents({'MaryCalls': (), 'JohnCalls': ('MaryCalls',), 'Alarm': ('MaryCalls', 'JohnCalls'),
                         'Burglary': ('Alarm',), 'Earthquake': ('Alarm', 'Burglary')}), show='burglary, M J A B E'),
    Test('AIMA Figure 13.3(b): M, J, E, B, A', args=(_B, _MJEBA),
         check=_parents({'MaryCalls': (), 'JohnCalls': ('MaryCalls',), 'Earthquake': ('MaryCalls', 'JohnCalls'),
                         'Burglary': ('MaryCalls', 'JohnCalls', 'Earthquake'),
                         'Alarm': ('MaryCalls', 'JohnCalls', 'Earthquake', 'Burglary')}), show='burglary, M J E B A'),
    Test('8 Sep 2025: ordering M1, M2, N, F1, F2 gives network (iii)', args=(_T, _TEL),
         check=_parents({'M1': (), 'M2': ('M1',), 'N': ('M1', 'M2'), 'F1': ('M1', 'N'), 'F2': ('M2', 'N')}),
         show='telescopes, M1 M2 N F1 F2'),
    Test('parents listed in the order of the ordering', call=lambda sol: sol.build_network(_B, _MJABE)['Earthquake'],
         expected=('Alarm', 'Burglary'), show="build_network(burglary, M J A B E)['Earthquake']"),
    Test('10 numbers for the causal burglary network',
         call=lambda sol: sol.num_parameters({X: _B[X] for X in _B}), expected=10, show='num_parameters(burglary)'),
    Test('13 numbers for M, J, A, B, E', call=lambda sol: sol.num_parameters(sol.build_network(_B, _MJABE)), expected=13),
    Test('31 numbers for M, J, E, B, A', call=lambda sol: sol.num_parameters(sol.build_network(_B, _MJEBA)), expected=31),
    Test('telescopes: 11 numbers (causal) vs 15 (iii)',
         call=lambda sol: (sol.num_parameters(_T), sol.num_parameters(sol.build_network(_T, _TEL))), expected=(11, 15)),
]
