from harness import Test
from uncertainty_lib import burglary, heart, student, five_vars, dag

TITLE = 'd-separation: enumerate the trails'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['d-separation', 'active trail', 'conditional independence', 'DFS']

STATEMENT = r"""
$X$ and $Y$ are **d-separated** by the evidence $Z$ iff **no** trail between them is active given $Z$; then
$X \perp Y \mid Z$ holds in every distribution the network can represent (AIMA §13.2.1).

The structure is a DAG `{node: tuple of parents}`. `is_active(g, trail, evidence)` (previous problem) and
`children(g, X)` are given. Write

- `trails(g, X, Y)` → the list of **all** trails from `X` to `Y`: paths in the undirected skeleton (each node
  is adjacent to its parents and its children) that never repeat a node, each as a list `[X, ..., Y]`; any order;
- `d_separated(g, X, Y, evidence=())` → `True` iff no trail from `X` to `Y` is active given `evidence`.

**Example (heart network, exam 16 Jan 2025):** $E \to HD \leftarrow D \to Hb$, $HD \to BP$,
$HD \to CP \leftarrow Hb$. `trails(g, 'E', 'CP')` → `[['E', 'HD', 'CP'], ['E', 'HD', 'D', 'Hb', 'CP']]`;
`d_separated(g, 'E', 'D', {'Hb'})` → `True`; `d_separated(g, 'E', 'D', {'Hb', 'HD'})` → `False`.
"""

STARTER = '''from uncertainty_lib import is_active, children

def trails(g: dict, X: str, Y: str) -> list[list[str]]:
    """All simple paths from X to Y in the undirected skeleton of g."""
    out = []
    # TODO: depth-first search that extends the current path with unvisited neighbors
    return out

def d_separated(g: dict, X: str, Y: str, evidence=()) -> bool:
    """True iff no trail between X and Y is active given the evidence."""
    return False
'''

SOLUTION = '''from uncertainty_lib import is_active, children

def trails(g: dict, X: str, Y: str) -> list[list[str]]:
    """All simple paths from X to Y in the undirected skeleton of g."""
    out = []

    def extend(path):
        last = path[-1]
        if last == Y:
            out.append(path)
            return
        for nb in list(g[last]) + children(g, last):
            if nb not in path:
                extend(path + [nb])

    extend([X])
    return out

def d_separated(g: dict, X: str, Y: str, evidence=()) -> bool:
    """True iff no trail between X and Y is active given the evidence."""
    return not any(is_active(g, t, set(evidence)) for t in trails(g, X, Y))
'''

HINTS = [
    'Neighbors in the skeleton of node `n`: `list(g[n]) + children(g, n)` (parents and children).',
    'Recursive DFS on paths: `extend(path)`; if `path[-1] == Y` record it and stop; otherwise call `extend(path + [nb])` '
    'for every neighbor `nb` **not already in the path** (simple paths, no cycles in the skeleton walk).',
    '`d_separated` is one line: `not any(is_active(g, t, set(evidence)) for t in trails(g, X, Y))`.',
]

EXPLANATION = r"""
**One active trail is enough** to make $X$ and $Y$ (possibly) dependent; d-separation needs **all** of them
blocked. In the heart network, given $Hb$: $E$ and $D$ are d-separated (their only trails are
$E \to HD \leftarrow D$, a v-structure with nothing observed below, and $E \to HD \to CP \leftarrow Hb \leftarrow D$, blocked at $CP$ and at $Hb$). Adding $HD$ to the evidence opens $E \to HD \leftarrow D$.

**Typical exam reasoning** (6 Feb 2026, $A \to B \leftarrow C \to D \leftarrow E$): the only trail from $A$ to
$E$ is $A \to B \leftarrow C \to D \leftarrow E$, with two v-structures; with no evidence it is blocked, so
$P(A = 1 \mid E = 0) = P(A = 1)$. It becomes active only if **both** $B$ and $D$ (or descendants) are observed
and $C$ is not.

**Cost.** The number of simple paths can grow exponentially with the size of the graph; real implementations
use a linear-time reachability algorithm ("Bayes ball"), or AIMA's test on the moralized ancestral graph. For
the networks of the exams, listing trails by hand is exactly what is asked.
"""

ENTRY = 'd_separated'

_H, _B, _S, _F = dag(heart()), dag(burglary()), dag(student()), dag(five_vars())


def _trail_set(expected):
    def run(sol):
        return sorted(map(tuple, sol.trails(*expected)))
    return run


TESTS = [
    Test('trails(E, CP) in the heart network', call=_trail_set((_H, 'E', 'CP')),
         expected=[('E', 'HD', 'CP'), ('E', 'HD', 'D', 'Hb', 'CP')], show="trails(heart, 'E', 'CP')"),
    Test('trails(BP, Hb) in the heart network', call=_trail_set((_H, 'BP', 'Hb')),
         expected=[('BP', 'HD', 'CP', 'Hb'), ('BP', 'HD', 'D', 'Hb')], show="trails(heart, 'BP', 'Hb')"),
    Test('trails(A, E) in the 6 Feb 2026 network', call=_trail_set((_F, 'A', 'E')),
         expected=[('A', 'B', 'C', 'D', 'E')], show="trails(five_vars, 'A', 'E')"),
    Test('heart: E, D given Hb', args=(_H, 'E', 'D', {'Hb'}), expected=True),
    Test('heart: E, D given Hb, HD', args=(_H, 'E', 'D', {'Hb', 'HD'}), expected=False),
    Test('heart: E, D given CP (descendant of HD)', args=(_H, 'E', 'D', {'CP'}), expected=False),
    Test('heart: D, CP given Hb', args=(_H, 'D', 'CP', {'Hb'}), expected=False),
    Test('heart: D, CP given Hb, HD', args=(_H, 'D', 'CP', {'Hb', 'HD'}), expected=True),
    Test('heart: BP, CP given HD, Hb', args=(_H, 'BP', 'CP', {'HD', 'Hb'}), expected=True),
    Test('heart: E, Hb', args=(_H, 'E', 'Hb', set()), expected=True),
    Test('heart: E, Hb given HD', args=(_H, 'E', 'Hb', {'HD'}), expected=False),
    Test('burglary: B, E', args=(_B, 'Burglary', 'Earthquake', set()), expected=True),
    Test('burglary: B, E given JohnCalls', args=(_B, 'Burglary', 'Earthquake', {'JohnCalls'}), expected=False),
    Test('burglary: J, M given Alarm', args=(_B, 'JohnCalls', 'MaryCalls', {'Alarm'}), expected=True),
    Test('6 Feb 2026: A, E', args=(_F, 'A', 'E', set()), expected=True),
    Test('6 Feb 2026: A, E given B', args=(_F, 'A', 'E', {'B'}), expected=True),
    Test('6 Feb 2026: A, E given B, D', args=(_F, 'A', 'E', {'B', 'D'}), expected=False),
    Test('6 Feb 2026: B, D', args=(_F, 'B', 'D', set()), expected=False),
    Test('6 Feb 2026: B, D given C', args=(_F, 'B', 'D', {'C'}), expected=True),
    Test('student: Difficulty, Test', args=(_S, 'Difficulty', 'Test', set()), expected=True),
    Test('student: Difficulty, Test given Letter', args=(_S, 'Difficulty', 'Test', {'Letter'}), expected=False),
    Test('student: Letter, Test given Knowledge', args=(_S, 'Letter', 'Test', {'Knowledge'}), expected=True),
]
