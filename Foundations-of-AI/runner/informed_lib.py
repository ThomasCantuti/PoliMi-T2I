"""Helpers for the Informed Search problems (slides p. 174-256).

    from informed_lib import best_first_search, astar_search, Instrumented, GridProblem

The search functions are the course code (aima-python search4e): use them in later
problems once you have written your own version in the earlier ones.
"""
import math

from aima import Problem, Node, expand, PriorityQueue, failure, is_cycle

infinity = math.inf


# ---------------------------------------------------------------- course algorithms

def g(n):
    return n.path_cost


def best_first_search(problem, f):
    "Search nodes with minimum f(node) value first. (slides p. 186)"
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached = {problem.initial: node}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            s = child.state
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child
                frontier.add(child)
    return failure


def best_first_tree_search(problem, f):
    "A version of best_first_search without the `reached` table. (slides p. 185)"
    frontier = PriorityQueue([Node(problem.initial)], key=f)
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            if not is_cycle(child):
                frontier.add(child)
    return failure


def best_first_search_discard(problem, f):
    """Graph search that NEVER re-adds a reached state, even when a cheaper path to it
    is found (the variant discussed on slides p. 226-228). Not the course default!"""
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached = {problem.initial}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            if child.state not in reached:
                reached.add(child.state)
                frontier.add(child)
    return failure


def uniform_cost_search(problem):
    return best_first_search(problem, f=g)


def greedy_bfs(problem, h=None):
    "Greedy best-first search: f(n) = h(n)."
    h = h or problem.h
    return best_first_search(problem, f=h)


def astar_search(problem, h=None):
    "A*: f(n) = g(n) + h(n). (slides p. 194)"
    h = h or problem.h
    return best_first_search(problem, f=lambda n: g(n) + h(n))


def weighted_astar_search(problem, h=None, weight=1.4):
    "Weighted A*: f(n) = g(n) + w * h(n). (slides p. 238)"
    h = h or problem.h
    return best_first_search(problem, f=lambda n: g(n) + weight * h(n))


# ---------------------------------------------------------------- instrumentation

class Instrumented(Problem):
    """Wrap a problem and record what a search algorithm does with it.

        p = Instrumented(GraphProblem('S', 'G', graph))
        astar_search(p)
        p.expanded      # states expanded, in order (one entry per call to actions)
        p.goal_tests    # how many times is_goal was called (= nodes selected)
    """

    def __init__(self, problem):
        self.__dict__.update(problem=problem, initial=problem.initial, goal=problem.goal,
                             expanded=[], goal_tests=0)

    def actions(self, state):
        self.expanded.append(state)
        return self.problem.actions(state)

    def result(self, state, action):     return self.problem.result(state, action)
    def action_cost(self, s, a, s1):     return self.problem.action_cost(s, a, s1)
    def h(self, node):                   return self.problem.h(node)

    def is_goal(self, state):
        self.goal_tests += 1
        return self.problem.is_goal(state)

    def __getattr__(self, name):  # graph, h_table, ... of the wrapped problem
        if name.startswith('__') or 'problem' not in self.__dict__:
            raise AttributeError(name)
        return getattr(self.problem, name)


# ---------------------------------------------------------------- graphs: true costs, checks

def _dijkstra(adj, source):
    """Cheapest cost from source to every state, over adjacency {s: {s1: cost}}."""
    dist = {source: 0}
    frontier = PriorityQueue([(0, source)], key=lambda x: x[0])
    while frontier:
        d, s = frontier.pop()
        if d > dist[s]:
            continue
        for s1, c in adj.get(s, {}).items():
            if d + c < dist.get(s1, infinity):
                dist[s1] = d + c
                frontier.add((d + c, s1))
    return dist


def states_of(graph):
    "All states mentioned in a {state: {neighbor: cost}} graph."
    return set(graph) | {s1 for nbrs in graph.values() for s1 in nbrs}


def cost_from(graph, start):
    "g*(s): cheapest cost from start to every reachable state s."
    return _dijkstra(graph, start)


def cost_to(graph, goal):
    "h*(s): cheapest cost from every state s that can reach the goal (search backwards)."
    reverse = {}
    for s, nbrs in graph.items():
        for s1, c in nbrs.items():
            reverse.setdefault(s1, {})[s] = c
    return _dijkstra(reverse, goal)


def check_admissible(graph, h, goal):
    "(True, '') or (False, why) - h is a {state: value} dict, missing states count as 0."
    hstar = cost_to(graph, goal)
    for s in sorted(states_of(graph), key=str):
        hs = h.get(s, 0)
        if hs < 0:
            return False, f'h({s}) = {hs} is negative'
        if s in hstar and hs > hstar[s] + 1e-9:
            return False, f'h({s}) = {hs} > h*({s}) = {hstar[s]:g}: h overestimates'
    return True, ''


def check_consistent(graph, h, goal):
    "(True, '') or (False, why) - checks h(goal) = 0 and h(n) <= c(n, n') + h(n') on every edge."
    if h.get(goal, 0) != 0:
        return False, f'h(goal) = {h[goal]} must be 0'
    for s in sorted(graph, key=str):
        for s1, c in sorted(graph[s].items(), key=str):
            if h.get(s, 0) > c + h.get(s1, 0) + 1e-9:
                return False, (f'edge {s}->{s1}: h({s}) = {h.get(s, 0)} > '
                               f'c = {c} + h({s1}) = {h.get(s1, 0)}')
    return True, ''


def problem_graph(problem):
    "The explicit {state: {next_state: cost}} graph of all states reachable from problem.initial."
    graph, todo = {}, [problem.initial]
    while todo:
        s = todo.pop()
        if s in graph:
            continue
        graph[s] = {}
        for a in problem.actions(s):
            s1 = problem.result(s, a)
            graph[s][s1] = problem.action_cost(s, a, s1)
            todo.append(s1)
    return graph


def validate_graph(graph):
    "Raise a readable error if graph is not a {state: {neighbor: positive cost}} dict."
    if not isinstance(graph, dict):
        raise TypeError('graph must be a dict {state: {neighbor: cost}}')
    for s, nbrs in graph.items():
        if not isinstance(nbrs, dict):
            raise TypeError(f'graph[{s!r}] must be a dict {{neighbor: cost}}')
        for s1, c in nbrs.items():
            if not isinstance(c, (int, float)) or c <= 0:
                raise ValueError(f'cost of {s}->{s1} must be a positive number (got {c!r})')


# ---------------------------------------------------------------- grid navigation

class GridProblem(Problem):
    """Robot navigation on a grid map (slides p. 198-215). A state is a cell (x, y):
    x = column (left to right), y = row (top to bottom).

        rows: list of strings, '.' free, '#' obstacle, 'S' start, 'G' goal.
        diagonal=False: 4 moves of cost 1.
        diagonal=True:  also the 4 diagonal moves, of cost sqrt(2).
    An action is the move (dx, dy); h is 0 unless you pass h=...(node).
    """
    STRAIGHT = ((0, -1), (1, 0), (0, 1), (-1, 0))
    DIAGONAL = ((1, -1), (1, 1), (-1, 1), (-1, -1))

    def __init__(self, rows, diagonal=False, h=None):
        cells = {(x, y): ch for y, row in enumerate(rows) for x, ch in enumerate(row)}
        start = next(c for c, ch in cells.items() if ch == 'S')
        goal = next(c for c, ch in cells.items() if ch == 'G')
        free = {c for c, ch in cells.items() if ch != '#'}
        moves = self.STRAIGHT + (self.DIAGONAL if diagonal else ())
        super().__init__(start, goal, free=free, moves=moves, diagonal=diagonal,
                         rows=list(rows), heuristic=h)

    def actions(self, state):
        x, y = state
        return [(dx, dy) for dx, dy in self.moves if (x + dx, y + dy) in self.free]

    def result(self, state, action):
        return (state[0] + action[0], state[1] + action[1])

    def action_cost(self, s, a, s1):
        return math.sqrt(2) if a[0] and a[1] else 1

    def h(self, node):
        return self.heuristic(node) if self.heuristic else 0


# The navigation example of slides p. 198-201 (C* = 11 with 4 moves).
SLIDE_GRID = [
    '...........',
    '.#...#####.',
    '.##...G..#.',
    'S.########.',
    '...........',
]


# ---------------------------------------------------------------- 8-puzzle

GOAL = (1, 2, 3, 4, 5, 6, 7, 8, 0)


def misplaced_tiles(state, goal=GOAL):
    "h1: number of misplaced tiles (the blank is not a tile)."
    return sum(1 for s, g_ in zip(state, goal) if s != 0 and s != g_)


def manhattan_tiles(state, goal=GOAL):
    "h2: sum of the Manhattan distances of every tile from its goal square."
    where = {tile: i for i, tile in enumerate(goal)}
    return sum(abs(i // 3 - where[t] // 3) + abs(i % 3 - where[t] % 3)
               for i, t in enumerate(state) if t != 0)
