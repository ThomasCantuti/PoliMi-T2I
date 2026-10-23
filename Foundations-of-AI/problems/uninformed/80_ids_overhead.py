from harness import Test

TITLE = 'How many nodes? BFS vs iterative deepening'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['complexity', 'iterative deepening', 'BFS', 'counting nodes']

STATEMENT = r"""
Exam questions often ask *how many nodes* an algorithm generates. Take a uniform search tree: every node
has exactly $b$ children, and the **only goal is the last node of depth $d$** (worst case). Count the
**generated** nodes (children produced by `expand`; the root is not counted).

Write `count_generated(b, d)` returning a dict:

| key | algorithm | what it generates |
|---|---|---|
| `'bfs_early'` | BFS, goal test at generation | every node of levels $1 \dots d$ |
| `'bfs_late'` | BFS, goal test at selection | the above **plus** the children of every level-$d$ node except the goal (slide p. 125) |
| `'ids'` | iterative deepening | iteration $L = 1, \dots, d$ generates every node of levels $1 \dots L$ (assume the last iteration also generates its whole tree) |

Example: `count_generated(2, 3)` → `{'bfs_early': 14, 'bfs_late': 28, 'ids': 22}`.

Use exact integer arithmetic (no simulation: one test uses $d = 50$).
"""

STARTER = '''def count_generated(b: int, d: int) -> dict[str, int]:
    bfs_early = 0   # TODO: nodes of levels 1..d
    bfs_late = 0    # TODO: bfs_early + children of the non-goal level-d nodes
    ids = 0         # TODO: a node of level i is generated in iterations L = i, ..., d
    return {'bfs_early': bfs_early, 'bfs_late': bfs_late, 'ids': ids}
'''

SOLUTION = '''def count_generated(b: int, d: int) -> dict[str, int]:
    bfs_early = sum(b ** i for i in range(1, d + 1))
    bfs_late = bfs_early + (b ** (d + 1) - b)          # (b^d - 1) nodes expanded at level d
    ids = sum((d + 1 - i) * b ** i for i in range(1, d + 1))
    return {'bfs_early': bfs_early, 'bfs_late': bfs_late, 'ids': ids}
'''

HINTS = [
    'Level $i$ of the tree contains $b^i$ nodes.',
    'Late BFS: before the goal is *selected*, all the other $b^d - 1$ nodes of level $d$ are expanded, '
    'each generating $b$ children. Check with $d = 0$: nothing is generated.',
    'IDS: a node of level $i$ is generated once in each iteration $L \\ge i$, i.e. $(d + 1 - i)$ times. '
    'So `ids = sum((d + 1 - i) * b**i for i in range(1, d + 1))`.',
]

EXPLANATION = r"""
$$N_{\text{BFS-early}} = \sum_{i=1}^{d} b^i, \qquad
N_{\text{BFS-late}} = \sum_{i=1}^{d} b^i + (b^{d+1} - b), \qquad
N_{\text{IDS}} = \sum_{i=1}^{d} (d+1-i)\, b^i$$

| $b = 10$, $d = 5$ | generated nodes |
|---|---|
| BFS, early goal test | 111,110 |
| iterative deepening | 123,450 (+11%) |
| BFS, late goal test | 1,111,100 |

IDS regenerates the upper levels again and again, yet costs only about $\frac{b}{b-1}$ times BFS
(1.11 for $b=10$, 2 for $b=2$): in a tree, **the last level dominates**. It is even ~9 times
*cheaper* than BFS with the late goal test, which pays for a whole extra level. And it needs only
$O(bd)$ memory instead of $O(b^d)$.

The ratio $\frac{b}{b-1}$ explodes as $b \to 1$: on a chain ($b = 1$) IDS does $d(d+1)/2$ work instead
of $d$ — the "small overhead" argument relies on the tree growing exponentially.
"""

ENTRY = 'count_generated'


def _ratio(sol):
    r = sol.count_generated(10, 20)
    return round(r['ids'] / r['bfs_early'], 3)


TESTS = [
    Test('b = 2, d = 3', args=(2, 3), expected={'bfs_early': 14, 'bfs_late': 28, 'ids': 22}),
    Test('b = 10, d = 5 (the textbook numbers)', args=(10, 5),
         expected={'bfs_early': 111110, 'bfs_late': 1111100, 'ids': 123450}),
    Test('d = 0: the root is the goal', args=(3, 0), expected={'bfs_early': 0, 'bfs_late': 0, 'ids': 0}),
    Test('b = 1: a chain', args=(1, 4), expected={'bfs_early': 4, 'bfs_late': 4, 'ids': 10}),
    Test('IDS / BFS-early for b = 10, d = 20 (≈ b/(b-1))', call=_ratio, expected=1.111,
         show='ratio ids / bfs_early, rounded to 3 decimals'),
    Test('b = 10, d = 50 (exact integers)', args=(10, 50),
         expected={'bfs_early': sum(10 ** i for i in range(1, 51)),
                   'bfs_late': sum(10 ** i for i in range(1, 51)) + 10 ** 51 - 10,
                   'ids': sum((51 - i) * 10 ** i for i in range(1, 51))}),
]
