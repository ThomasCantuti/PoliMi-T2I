from collections import Counter

from harness import Test
from aima import GraphProblem, path_states, failure
from informed_lib import (Instrumented, best_first_search, best_first_search_discard, cost_to,
                          states_of, validate_graph, check_admissible, check_consistent)

TITLE = 'Counterexample: admissible but inconsistent heuristic'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['A*', 'consistency', 'admissibility', 'graph search', 'reached table', 'counterexample']

STATEMENT = r"""
Slides p. 226–229 warn: with an heuristic that is **admissible but not consistent**, a graph
search that *discards* a state it has already reached may miss the optimal path. The course's
`best_first_search` does **not** discard it: when a cheaper path to a reached state is found it
updates `reached` and **re-adds** the state to the frontier.

Build your own example. Write `reopening_trap()` returning `(graph, h, start, goal)` (graph as
`{state: {neighbor: cost}}`, `h` as `{state: value}`) such that:

1. `h` is **admissible**;
2. `h` is **not consistent**;
3. A* with the course's `best_first_search` (re-add when cheaper) **expands some state twice**
   — and still returns an optimal path, because $h$ is admissible;
4. A* with a graph search that **never re-adds** a reached state (`reached` is just a set)
   returns a **suboptimal** path.

The tests check each property with reference implementations and show you the expansion
order of both versions.
"""

STARTER = '''from aima import directed, undirected

def reopening_trap() -> tuple[dict[str, dict], dict[str, float], str, str]:
    """Return (graph, h, start, goal): h admissible but inconsistent, so that a graph search
    that never re-adds reached states misses the optimal path."""
    graph = directed([('S', 'A', 1), ('A', 'G', 1)])     # TODO
    h = {'S': 2, 'A': 1, 'G': 0}                          # TODO
    return graph, h, 'S', 'G'
'''

SOLUTION = '''from aima import directed, undirected

def reopening_trap() -> tuple[dict[str, dict], dict[str, float], str, str]:
    """Return (graph, h, start, goal): h admissible but inconsistent, so that a graph search
    that never re-adds reached states misses the optimal path."""
    # Slides p. 227-229: the cheap route to C goes through A, but h(A) = 100 hides it,
    # so C is first reached (and expanded) through the expensive route via B.
    graph = directed([('S', 'A', 1), ('S', 'B', 2), ('A', 'C', 1), ('B', 'C', 2), ('C', 'G', 100)])
    h = {'S': 0, 'A': 100, 'B': 1, 'C': 90, 'G': 0}   # h(A) = 100 > c(A, C) + h(C) = 91
    return graph, h, 'S', 'G'
'''

HINTS = [
    'You need a state C that A* reaches **first through an expensive path** and only later through a '
    'cheaper one. When could the cheaper path be explored *later*?',
    'Make the start of the cheap route look bad: a state A on the cheap path with a large (but still '
    'admissible) $h(A)$, followed by a C with a much smaller $h(C)$: that drop $h(A) > c(A, C) + h(C)$ '
    'is exactly the inconsistency.',
    'Diamond shape: S→A (cheap), S→B (a bit more), A→C and B→C, then C→G expensive enough that h(A) can be '
    'large while staying ≤ h*(A). The slide p. 227 graph works — then try to change the numbers and see '
    'which constraints break.',
]

EXPLANATION = r"""
On the slide p. 227 graph ($h(A)=100$, $h(B)=1$, $h(C)=90$):

| step | course A* (re-add) | discard variant |
|---|---|---|
| 1 | S: A $f=101$, B $f=3$ | same |
| 2 | B: C with $g=4$, $f=94$ | same |
| 3 | C: G with $g=104$ | same |
| 4 | A ($f=101$): C with $g=2 < 4$ → **re-added**, $f = 92$ | A: C already reached → **dropped** |
| 5 | C again: G with $g=102 < 104$ → re-added | G ($f=104$) selected: **cost 104** |
| 6 | G ($f=102$) selected: **cost 102** ✓ | |

**Why it happens.** With a consistent $h$, $f$ never decreases along a path, so the first time A*
selects a state its $g$ is already optimal (slide p. 224): nothing to re-add. An inconsistent
$h$ lets $f$ *drop* along a path ($f(A) = 101$, then $f(C) = 92$), so a cheaper path can show up
after the state was already expanded.

**What it costs.** Three ways to handle it (slides p. 226–230):
- **tree search** (no `reached`): optimal with admissible $h$, but may keep many duplicates;
- **graph search that discards** reached states: optimal only with a **consistent** $h$;
- **course `best_first_search`** (re-add when cheaper): optimal with admissible $h$, paying with
  **re-expansions** (C was expanded twice).
"""

ENTRY = 'reopening_trap'


def _unpack(got):
    try:
        graph, h, start, goal = got
    except (TypeError, ValueError):
        raise ValueError('reopening_trap() must return a tuple (graph, h, start, goal)')
    validate_graph(graph)
    if not isinstance(h, dict):
        raise TypeError('h must be a dict {state: value}')
    if start not in states_of(graph) or goal not in states_of(graph):
        raise ValueError('start and goal must be states of the graph')
    if start not in cost_to(graph, goal):
        raise ValueError(f'{goal} is not reachable from {start}')
    return graph, h, start, goal


def _admissible(got):
    graph, h, start, goal = _unpack(got)
    ok, why = check_admissible(graph, h, goal)
    return ok, why or 'h <= h* everywhere'


def _inconsistent(got):
    graph, h, start, goal = _unpack(got)
    ok, why = check_consistent(graph, h, goal)
    if ok:
        return False, ('h is consistent: then A* never finds a cheaper path to a state it has already '
                       'expanded, so nothing can go wrong. You need h(n) > c(n, n\') + h(n\') on some edge.')
    return True, why


def _run(variant, graph, h, start, goal):
    p = Instrumented(GraphProblem(start, goal, graph, h))
    node = variant(p, lambda n: n.path_cost + p.h(n))
    return node, p.expanded


def _reexpands(got):
    graph, h, start, goal = _unpack(got)
    node, expanded = _run(best_first_search, graph, h, start, goal)
    twice = sorted((s for s, k in Counter(expanded).items() if k > 1), key=str)
    best = cost_to(graph, goal)[start]
    msg = f'course A* expands {expanded} and returns cost {node.path_cost} (C* = {best})'
    if not twice:
        return False, msg + ': no state is expanded twice'
    return node.path_cost == best, msg + f'; expanded twice: {twice}'


def _discard_fails(got):
    graph, h, start, goal = _unpack(got)
    node, expanded = _run(best_first_search_discard, graph, h, start, goal)
    best = cost_to(graph, goal)[start]
    if node is failure:
        return False, 'the discard variant found no solution'
    msg = (f'discard variant expands {expanded} and returns {path_states(node)} with cost '
           f'{node.path_cost} (C* = {best})')
    return node.path_cost > best, msg


TESTS = [
    Test('h is admissible', check=_admissible, show='h(n) <= h*(n) for every n'),
    Test('h is not consistent', check=_inconsistent, show="h(n) > c(n, n') + h(n') on some edge"),
    Test('course A* re-expands a state and stays optimal', check=_reexpands,
         show='best_first_search with f = g + h (re-add when cheaper)'),
    Test('graph search that discards reached states is suboptimal', check=_discard_fails,
         show='same A*, but a reached state is never added again'),
]
