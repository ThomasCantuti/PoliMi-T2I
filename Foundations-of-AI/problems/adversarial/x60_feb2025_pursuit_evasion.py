import math
from fractions import Fraction

from harness import Test

TITLE = 'Exam · Feb 2025 · Pursuit-evasion: game tree to level 3 and minimax with e(s)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Feb 2025', 'minimax', 'evaluation function', 'game formulation']

STATEMENT = r"""
*Written exam of 3 February 2025 — Section #2, Adversarial Search (versions A and B).*

A pursuit-evasion game is played on the graph below. The **pursuer** (MAX) starts at vertex `a`, the **evader** (MIN)
at vertex `c`. The players move in turn, pursuer first; at its turn a player **must** move to an adjacent vertex
(it cannot stay). If the two players are on the same vertex the game ends and the pursuer wins (utility $+1$); if the
evader escapes indefinitely, it wins.

```text
                  d
                /   \
  a --- b --- c       f          edges: a-b, b-c, c-d, c-e, d-f, e-f
                \   /
                  e
```

- **Q1.** How would you represent the game state? How is $S_0$ represented?
- **Q2.** Build the game tree up to **level 3** (level 0 = the root), generating the states in **lexicographic order**.
- **Q3.** Run minimax on that tree, using the utility at terminal states and, at the level-3 states that are not
  terminal, the evaluation function
  $e(s) = -\dfrac{\text{number of edges between the two players}}{6}$ (e.g. $e(S_0) = -2/6 = -1/3$).

Write `game_tree(graph, state, levels, norm, max_to_move=True)` that returns the tree **with its minimax values**
as nested tuples `(state, value, children)`:

- `graph`: adjacency dict, e.g. `{'a': ['b'], 'b': ['a', 'c'], ...}`; `state = (pursuer_vertex, evader_vertex)`;
- a state with both players on the same vertex is **terminal**: `(state, 1, [])`;
- at depth `levels` a non-terminal state is a leaf: `(state, -dist/norm, [])` (`dist` = shortest-path length);
- otherwise the player to move (pursuer if `max_to_move`) generates its moves in lexicographic order of the
  resulting state, and the value is the max (pursuer) or min (evader) of the children's values.

Use `fractions.Fraction` (or floats: the tests compare with a tolerance).

```text
game_tree(A, ('a', 'c'), 3, 6)  ->  (('a','c'), -1/6, [(('b','c'), -1/6, [(('b','b'), 1, []), (('b','d'), -1/6, [...]), ...])])
```
"""

STARTER = '''from collections import deque
from fractions import Fraction


def distance(graph: dict, a: str, b: str) -> int:
    """Number of edges on a shortest path from a to b (breadth-first search)."""
    # TODO
    return 0


def game_tree(graph: dict, state: tuple, levels: int, norm: int, max_to_move: bool = True) -> tuple:
    """Return (state, minimax value, [children]) for the game tree rooted at state, cut at depth `levels`."""
    pursuer, evader = state
    # TODO: terminal state (same vertex) -> (state, 1, [])
    # TODO: depth limit reached -> (state, Fraction(-distance(...), norm), [])
    # TODO: the player to move goes to each neighbour, in lexicographic order; max or min of the values
    return (state, 0, [])
'''

SOLUTION = '''from collections import deque
from fractions import Fraction


def distance(graph: dict, a: str, b: str) -> int:
    """Number of edges on a shortest path from a to b (breadth-first search)."""
    frontier, reached = deque([(a, 0)]), {a}
    while frontier:
        v, d = frontier.popleft()
        if v == b:
            return d
        for w in graph[v]:
            if w not in reached:
                reached.add(w)
                frontier.append((w, d + 1))
    raise ValueError('unreachable vertex')


def game_tree(graph: dict, state: tuple, levels: int, norm: int, max_to_move: bool = True) -> tuple:
    """Return (state, minimax value, [children]) for the game tree rooted at state, cut at depth `levels`."""
    pursuer, evader = state
    if pursuer == evader:                      # terminal: the pursuer caught the evader
        return (state, 1, [])
    if levels == 0:                            # cutoff: evaluation function
        return (state, Fraction(-distance(graph, pursuer, evader), norm), [])
    if max_to_move:                            # the pursuer moves
        children = [game_tree(graph, (v, evader), levels - 1, norm, False) for v in sorted(graph[pursuer])]
        return (state, max(c[1] for c in children), children)
    children = [game_tree(graph, (pursuer, v), levels - 1, norm, True) for v in sorted(graph[evader])]
    return (state, min(c[1] for c in children), children)
'''

HINTS = [
    'Only one player moves at each level, so the successors of (p, e) are (p2, e) for every neighbour p2 of p (pursuer to move) or (p, e2) for every neighbour e2 of e (evader to move). Sorting the neighbours gives the lexicographic order.',
    'Check "same vertex" **before** the depth limit: a capture at level 3 is a real win (+1), not an estimate.',
    'From (a, c) the pursuer has a single move, to b. At (b, c) the evader can go to b (and be caught!), d or e.',
]

EXPLANATION = r"""
**Q1 (model answer).** A state is the pair of vertices *(pursuer position, evader position)*: $S_0 = (a, c)$. (Strictly,
the player to move is part of the state too; here it is implied by the level, since the players alternate and the
pursuer moves first.) Terminal test: same vertex.

**Q2–Q3, version A** (official solution, verified):

```text
level 0   MAX  (a,c)  -1/6
level 1   MIN    (b,c)  -1/6
level 2   MAX      (b,b)  +1        terminal: the evader walked into the pursuer
          MAX      (b,d)  -1/6 = max(-3/6, -1/6)
level 3                (a,d) -3/6    (c,d) -1/6
          MAX      (b,e)  -1/6 = max(-3/6, -1/6)
level 3                (a,e) -3/6    (c,e) -1/6
```

The evader avoids $(b,b)$ and the root is worth $-1/6$: within three moves the pursuer can at best get within one edge.

**Version B** (pursuer at `f`, evader at `d`, graph `f-e, e-d, d-b, d-c, b-a, c-a, a-g`): $(f,d) \to (e,d) \to$
$(e,b), (e,c), (e,e)$; $(e,b) \to (d,b), (f,b)$; $(e,c) \to (d,c), (f,c)$. Values: $(d,b) = (d,c) = -1/7$,
$(f,b) = (f,c) = -3/7$, $(e,b) = (e,c) = -1/7$, $(e,e) = +1$, $(e,d) = (f,d) = -1/7$.

Notes on the official solutions:

- in version A's drawing the level-2 nodes $(b,d)$, $(b,e)$ are drawn as MIN triangles, but it is the **pursuer** (MAX)
  who moves there; the values written ($-1/6 = \max$) are the MAX ones, which is correct;
- version B's text keeps "$/6$" in the formula, but its example ($e(S_0) = -2/7$) and its solution divide by **7** — the
  number of vertices of that graph (6 in version A). The tests reproduce the official values (`norm = 7` for B);
- version B's drawing lists $(e,e)$ first and $(f,b)$ before $(d,b)$: lexicographic order puts $(e,b), (e,c), (e,e)$ and
  $(d,b), (f,b)$. The values do not change.
"""

ENTRY = 'game_tree'


def _graph(edges):
    g = {}
    for a, b in edges.split():
        g.setdefault(a, []).append(b)
        g.setdefault(b, []).append(a)
    return g


_A = _graph('ab bc cd ce df ef')
_B = _graph('fe ed db dc ba ca ag')
F = Fraction


def _leaf(s, v):
    return (tuple(s), v, [])


_TREE_A = (('a', 'c'), F(-1, 6), [
    (('b', 'c'), F(-1, 6), [
        _leaf('bb', 1),
        (('b', 'd'), F(-1, 6), [_leaf('ad', F(-1, 2)), _leaf('cd', F(-1, 6))]),
        (('b', 'e'), F(-1, 6), [_leaf('ae', F(-1, 2)), _leaf('ce', F(-1, 6))])])])

_TREE_B = (('f', 'd'), F(-1, 7), [
    (('e', 'd'), F(-1, 7), [
        (('e', 'b'), F(-1, 7), [_leaf('db', F(-1, 7)), _leaf('fb', F(-3, 7))]),
        (('e', 'c'), F(-1, 7), [_leaf('dc', F(-1, 7)), _leaf('fc', F(-3, 7))]),
        _leaf('ee', 1)])])


def _same(got, exp, path='root'):
    if not isinstance(got, (tuple, list)) or len(got) != 3:
        return False, f'{path}: expected a (state, value, children) triple, got {got!r}'
    if tuple(got[0]) != tuple(exp[0]):
        return False, f'{path}: expected state {exp[0]}, got {got[0]}'
    if not math.isclose(float(got[1]), float(exp[1]), abs_tol=1e-9):
        return False, f'state {exp[0]}: expected value {exp[1]}, got {got[1]}'
    if len(got[2]) != len(exp[2]):
        return False, f'state {exp[0]}: expected {len(exp[2])} children, got {len(got[2])}'
    for g, e in zip(got[2], exp[2]):
        ok, msg = _same(g, e, str(exp[0]))
        if not ok:
            return ok, msg
    return True, ''


def _check(exp):
    return lambda got, *args: _same(got, exp)


def _first_value(levels):
    return lambda sol: float(sol.game_tree(_A, ('a', 'c'), levels, 6)[1])


TESTS = [
    Test('version A: tree to level 3 with minimax values', args=(_A, ('a', 'c'), 3, 6), check=_check(_TREE_A),
         show="A = a-b, b-c, c-d, c-e, d-f, e-f ; game_tree(A, ('a', 'c'), 3, 6)"),
    Test('version B: tree to level 3 (official solution divides by 7)', args=(_B, ('f', 'd'), 3, 7),
         check=_check(_TREE_B), show="B = f-e, e-d, d-b, d-c, b-a, c-a, a-g ; game_tree(B, ('f', 'd'), 3, 7)"),
    Test('level 0: just e(S0) = -2/6', args=(_A, ('a', 'c'), 0, 6), check=_check(_leaf('ac', F(-1, 3))),
         show="game_tree(A, ('a', 'c'), 0, 6)"),
    Test('the pursuer can capture at once', args=(_B, ('b', 'a'), 1, 7),
         check=_check((('b', 'a'), 1, [_leaf('aa', 1), _leaf('da', F(-2, 7))])),
         show="game_tree(B, ('b', 'a'), 1, 7)"),
    Test('a capture at the depth limit is a win, not an estimate', args=(_A, ('b', 'c'), 1, 6),
         check=_check((('b', 'c'), 1, [_leaf('ac', F(-1, 3)), _leaf('cc', 1)])),
         show="game_tree(A, ('b', 'c'), 1, 6)"),
    Test('deeper search, same root value', call=_first_value(5), check=lambda got: math.isclose(got, -1 / 6),
         show="game_tree(A, ('a', 'c'), 5, 6)[1]"),
    Test('evader to move at the root', args=(_A, ('b', 'c'), 1, 6, False),
         check=_check((('b', 'c'), F(-1, 3), [_leaf('bb', 1), _leaf('bd', F(-1, 3)), _leaf('be', F(-1, 3))])),
         show="game_tree(A, ('b', 'c'), 1, 6, max_to_move=False)"),
]
