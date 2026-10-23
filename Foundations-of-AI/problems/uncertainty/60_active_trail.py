from harness import Test
from uncertainty_lib import burglary, heart, student, five_vars, dag

TITLE = 'Active trails: chains, forks and v-structures'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['active trail', 'v-structure', 'explaining away', 'd-separation']

STATEMENT = r"""
A **trail** is a path in the network that ignores the direction of the arrows. Influence flows along it
through each consecutive triple $a - b - c$ according to three rules (AIMA §13.2.1; exam 16 Jan 2025):

| triple | $b$ not observed | $b$ observed |
|---|---|---|
| chain $a \to b \to c$ (or $a \leftarrow b \leftarrow c$) | active | blocked |
| fork $a \leftarrow b \to c$ | active | blocked |
| v-structure $a \to b \leftarrow c$ | blocked, **unless a descendant of $b$ is observed** | active |

A trail is **active** given the evidence iff every triple lets influence through **and** neither endpoint is
observed.

The structure is a DAG `{node: tuple of parents}`, e.g. `{'A': (), 'B': ('A', 'C'), 'C': ()}` for
$A \to B \leftarrow C$. Write `is_active(g, trail, evidence)`: `trail` is a list of nodes (consecutive nodes are
adjacent), `evidence` a set of observed nodes. `descendants(g, X)` (the set of nodes reachable from `X`
following the arrows) is given.

**Heart network (exam 16 Jan 2025):** $E \to HD \leftarrow D \to Hb$, $HD \to BP$, $HD \to CP \leftarrow Hb$.
`is_active(g, ['E', 'HD', 'CP'], {'Hb'})` → `True`; `is_active(g, ['E', 'HD', 'D'], {'Hb'})` → `False`.
"""

STARTER = '''from uncertainty_lib import descendants

def is_active(g: dict, trail: list, evidence: set) -> bool:
    """Is the trail active given the observed nodes?"""
    evidence = set(evidence)
    for a, b, c in zip(trail, trail[1:], trail[2:]):
        pass  # TODO: v-structure a -> b <- c, or chain/fork through b
    return False
'''

SOLUTION = '''from uncertainty_lib import descendants

def is_active(g: dict, trail: list, evidence: set) -> bool:
    """Is the trail active given the observed nodes?"""
    evidence = set(evidence)
    if trail[0] in evidence or trail[-1] in evidence:
        return False
    for a, b, c in zip(trail, trail[1:], trail[2:]):
        if a in g[b] and c in g[b]:                      # a -> b <- c
            if b not in evidence and not (descendants(g, b) & evidence):
                return False
        elif b in evidence:                              # chain or fork through an observed node
            return False
    return True
'''

HINTS = [
    'The triple $a - b - c$ is a v-structure exactly when **both** $a$ and $c$ are parents of $b$: '
    '`a in g[b] and c in g[b]`. Every other triple is a chain or a fork, and they behave the same way.',
    'v-structure: blocked unless `b in evidence` or `descendants(g, b) & evidence` is non-empty. '
    'Chain/fork: blocked if `b in evidence`.',
    'Check the endpoints first (an observed endpoint makes the trail inactive), then every triple; '
    'a trail of two adjacent unobserved nodes is active.',
]

EXPLANATION = r"""
**Why the v-structure is the odd one out.** Two causes of the same effect are independent (a burglary does not
make earthquakes more likely). Once the effect is observed they compete to explain it: learning one cause makes
the other less necessary (**explaining away**: $P(b \mid a) = 0.374$, $P(b \mid a, e) = 0.003$). Observing a
**descendant** of the effect (JohnCalls) is indirect evidence about it, so it opens the trail too.

**Exam 16 Jan 2025, given $Hb$ = yes:** the active trails with at least three variables are
$E \to HD \to CP$, $E \to HD \to BP$, $D \to HD \to CP$, $D \to HD \to BP$, $BP \leftarrow HD \to CP$ (and their
reverses). $D \to Hb \to CP$ is blocked ($Hb$ observed in a chain); $E \to HD \leftarrow D$ is blocked (no
observed node at or below $HD$). Observing also $HD$ = yes blocks every trail **through** $HD$ and opens the
v-structure $E \to HD \leftarrow D$, the only active trail left.

**Long trails** need every triple to pass: $D \to Hb \to CP \leftarrow HD \leftarrow E$ given $\{CP\}$ is
active (chain through unobserved $Hb$, observed collider $CP$, chain through unobserved $HD$).
"""

ENTRY = 'is_active'

_H, _B, _S, _F = dag(heart()), dag(burglary()), dag(student()), dag(five_vars())
_CHAIN = {'X': (), 'Y': ('X',), 'Z': ('Y',)}
_FORK = {'Y': (), 'X': ('Y',), 'Z': ('Y',)}
_V = {'X': (), 'Z': (), 'Y': ('X', 'Z'), 'W': ('Y',)}

TESTS = [
    Test('chain, middle unobserved', args=(_CHAIN, ['X', 'Y', 'Z'], set()), expected=True, show='X -> Y -> Z, {}'),
    Test('chain, middle observed', args=(_CHAIN, ['X', 'Y', 'Z'], {'Y'}), expected=False, show='X -> Y -> Z, {Y}'),
    Test('chain read backwards', args=(_CHAIN, ['Z', 'Y', 'X'], set()), expected=True, show='Z <- Y <- X, {}'),
    Test('fork, middle unobserved', args=(_FORK, ['X', 'Y', 'Z'], set()), expected=True, show='X <- Y -> Z, {}'),
    Test('fork, middle observed', args=(_FORK, ['X', 'Y', 'Z'], {'Y'}), expected=False, show='X <- Y -> Z, {Y}'),
    Test('v-structure, nothing observed', args=(_V, ['X', 'Y', 'Z'], set()), expected=False, show='X -> Y <- Z, {}'),
    Test('v-structure, middle observed', args=(_V, ['X', 'Y', 'Z'], {'Y'}), expected=True, show='X -> Y <- Z, {Y}'),
    Test('v-structure, descendant observed', args=(_V, ['X', 'Y', 'Z'], {'W'}), expected=True, show='X -> Y <- Z, Y -> W, {W}'),
    Test('observed endpoint', args=(_CHAIN, ['X', 'Y', 'Z'], {'X'}), expected=False, show='X -> Y -> Z, {X}'),
    Test('two adjacent nodes', args=(_CHAIN, ['X', 'Y'], set()), expected=True, show='X -> Y, {}'),
    Test('16 Jan 2025: E -> HD -> CP given Hb', args=(_H, ['E', 'HD', 'CP'], {'Hb'}), expected=True),
    Test('16 Jan 2025: BP <- HD -> CP given Hb', args=(_H, ['BP', 'HD', 'CP'], {'Hb'}), expected=True),
    Test('16 Jan 2025: D -> Hb -> CP given Hb', args=(_H, ['D', 'Hb', 'CP'], {'Hb'}), expected=False),
    Test('16 Jan 2025: E -> HD <- D given Hb', args=(_H, ['E', 'HD', 'D'], {'Hb'}), expected=False),
    Test('16 Jan 2025: E -> HD <- D given Hb, HD', args=(_H, ['E', 'HD', 'D'], {'Hb', 'HD'}), expected=True),
    Test('16 Jan 2025: E -> HD -> CP given Hb, HD', args=(_H, ['E', 'HD', 'CP'], {'Hb', 'HD'}), expected=False),
    Test('long trail through an observed collider', args=(_H, ['D', 'Hb', 'CP', 'HD', 'E'], {'CP'}), expected=True),
    Test('burglary: B -> A <- E given JohnCalls', args=(_B, ['Burglary', 'Alarm', 'Earthquake'], {'JohnCalls'}), expected=True),
    Test('6 Feb 2026: A -> B <- C -> D <- E given B, D', args=(_F, ['A', 'B', 'C', 'D', 'E'], {'B', 'D'}), expected=True),
    Test('6 Feb 2026: same trail given B, C, D', args=(_F, ['A', 'B', 'C', 'D', 'E'], {'B', 'C', 'D'}), expected=False),
    Test('student: Difficulty -> Grade <- Knowledge given Letter',
         args=(_S, ['Difficulty', 'Grade', 'Knowledge'], {'Letter'}), expected=True),
]
