from harness import Test
from aima import GraphProblem, path_states, failure
from informed_lib import (greedy_bfs, astar_search, cost_to, states_of, validate_graph)

TITLE = 'Counterexample: greedy fails even with the perfect heuristic'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['greedy', 'counterexample', 'optimality', 'h*']

STATEMENT = r"""
You know that greedy best-first search is not optimal. A natural guess is: *"that's because
the heuristic is not accurate enough"*. Let's test the guess with the **best possible
heuristic**, the true cost to the goal: $h(n) = h^*(n)$.

Write `greedy_trap()` returning a tuple `(graph, h, start, goal)` such that:

1. `graph` is a dict `{state: {neighbor: cost}}` with positive costs (build it with
   `directed([...])` or `undirected([...])`);
2. `h` is a dict `{state: value}` with **`h[s] == h*(s)`** for every state that can reach the
   goal (the exact cheapest cost from `s` to `goal`);
3. greedy best-first search (slide p. 186 code with $f = h$) from `start` returns a path that
   is **more expensive** than the optimal one.

The tests compute $h^*$ and run greedy and A* on your graph. Neighbors are generated in
alphabetical order; ties in the priority queue are broken first-in first-out.
"""

STARTER = '''from aima import directed, undirected

def greedy_trap() -> tuple[dict[str, dict], dict[str, float], str, str]:
    """Return (graph, h, start, goal): h = h* exactly, yet greedy returns a suboptimal path."""
    graph = directed([('S', 'G', 1)])    # TODO: design your graph
    h = {'S': 1, 'G': 0}                 # TODO: h(s) must equal the true cost from s to G
    return graph, h, 'S', 'G'
'''

SOLUTION = '''from aima import directed, undirected

def greedy_trap() -> tuple[dict[str, dict], dict[str, float], str, str]:
    """Return (graph, h, start, goal): h = h* exactly, yet greedy returns a suboptimal path."""
    graph = directed([('S', 'A', 10), ('A', 'G', 1),     # A is close to G but far from S
                      ('S', 'B', 1), ('B', 'G', 5)])     # the cheap route goes through B
    h = {'S': 6, 'A': 1, 'B': 5, 'G': 0}                # h = h*
    return graph, h, 'S', 'G'
'''

HINTS = [
    'Greedy selects the node with the smallest $h$, i.e. the one that *looks* closest to the goal. '
    'What does it ignore about that node?',
    'It ignores $g(n)$, the cost already paid to get there. Make the state that is closest to the goal '
    'very **expensive to reach** from the start.',
    'Two routes from S to G: S→A costs a lot but A→G is cheap; S→B is cheap and B→G costs a bit more. '
    'Then $h^*(A) < h^*(B)$, greedy expands A first and finds G through A.',
]

EXPLANATION = r"""
Greedy best-first search uses $f(n) = h(n)$: it ranks nodes by how close they *seem* to the
goal and never looks at $g(n)$, the cost already spent. Even with $h = h^*$ the node that is
closest to the goal can be expensive to reach, and greedy commits to it:

```text
S --10--> A --1--> G        h*(A) = 1  -> greedy expands A first, returns S-A-G (cost 11)
S --1---> B --5--> G        h*(B) = 5     optimal is S-B-G (cost 6)
```

So the problem of greedy is **not the quality of $h$**, it is the evaluation function.
A* fixes it by ranking nodes with $f(n) = g(n) + h(n)$, an estimate of the cost of the *whole*
solution through $n$: with $h = h^*$, $f(n)$ is exactly the cost of the best solution through
$n$ and A* goes straight along an optimal path.
"""

ENTRY = 'greedy_trap'


def _unpack(got):
    try:
        graph, h, start, goal = got
    except (TypeError, ValueError):
        raise ValueError('greedy_trap() must return a tuple (graph, h, start, goal)')
    validate_graph(graph)
    if not isinstance(h, dict):
        raise TypeError('h must be a dict {state: value}')
    if start not in states_of(graph) or goal not in states_of(graph):
        raise ValueError('start and goal must be states of the graph')
    return graph, h, start, goal


def _perfect(got):
    graph, h, start, goal = _unpack(got)
    hstar = cost_to(graph, goal)
    if start not in hstar:
        return False, 'the goal is not reachable from the start'
    for s in sorted(hstar, key=str):
        if h.get(s, 0) != hstar[s]:
            return False, f'h({s}) = {h.get(s, 0)} but the true cost h*({s}) = {hstar[s]}'
    return True, f'h = h* on all {len(hstar)} states that can reach {goal}'


def _greedy_fails(got):
    graph, h, start, goal = _unpack(got)
    best = cost_to(graph, goal).get(start)
    node = greedy_bfs(GraphProblem(start, goal, graph, h))
    if node is failure:
        return False, 'greedy found no solution: is the goal reachable?'
    msg = f'greedy returns {path_states(node)} with cost {node.path_cost}; optimal cost C* = {best}'
    return node.path_cost > best, msg


def _astar_ok(got):
    graph, h, start, goal = _unpack(got)
    node = astar_search(GraphProblem(start, goal, graph, h))
    if node is failure:
        return False, 'A* found no solution: is the goal reachable?'
    best = cost_to(graph, goal)[start]
    return node.path_cost == best, f'A* returns {path_states(node)} with cost {node.path_cost}'


TESTS = [
    Test('h is the perfect heuristic h*', check=_perfect, show='h(s) == h*(s) for every state'),
    Test('greedy best-first returns a suboptimal path', check=_greedy_fails,
         show='greedy (f = h) vs optimal cost'),
    Test('A* with the same h is optimal', check=_astar_ok, show='A* (f = g + h)'),
]
