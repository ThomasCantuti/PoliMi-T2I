"""Course helper library: the same building blocks used in the slides
(aima-python search4e / games4e), so your code reads like the lecture code.

    from aima import Problem, Node, expand, FIFOQueue, LIFOQueue, PriorityQueue, failure, cutoff
"""
import heapq
import itertools
import math
from collections import defaultdict, deque

infinity = math.inf


# ---------------------------------------------------------------- search

class Problem:
    """Abstract search problem. Subclass and implement actions() and result()."""

    def __init__(self, initial=None, goal=None, **kwds):
        self.__dict__.update(initial=initial, goal=goal, **kwds)

    def actions(self, state):        raise NotImplementedError
    def result(self, state, action): raise NotImplementedError
    def is_goal(self, state):        return state == self.goal
    def action_cost(self, s, a, s1): return 1
    def h(self, node):               return 0

    def __repr__(self):
        return '{}({!r}, {!r})'.format(type(self).__name__, self.initial, self.goal)


class Node:
    """A node in a search tree. len(node) is its depth."""

    def __init__(self, state, parent=None, action=None, path_cost=0):
        self.__dict__.update(state=state, parent=parent, action=action, path_cost=path_cost)

    def __repr__(self): return '<{}>'.format(self.state)
    def __len__(self): return 0 if self.parent is None else (1 + len(self.parent))
    def __lt__(self, other): return self.path_cost < other.path_cost


failure = Node('failure', path_cost=infinity)  # algorithm cannot find a solution
cutoff = Node('cutoff', path_cost=infinity)    # depth-limited search hit the limit


def expand(problem, node):
    """Expand a node, generating the children nodes (in the order of problem.actions)."""
    s = node.state
    for action in problem.actions(s):
        s1 = problem.result(s, action)
        cost = node.path_cost + problem.action_cost(s, action, s1)
        yield Node(s1, node, action, cost)


def path_actions(node):
    """The sequence of actions to get to this node."""
    if node.parent is None:
        return []
    return path_actions(node.parent) + [node.action]


def path_states(node):
    """The sequence of states to get to this node."""
    if node in (cutoff, failure, None):
        return []
    return path_states(node.parent) + [node.state]


def is_cycle(node, k=30):
    """Does this node form a cycle of length k or less?"""
    def find_cycle(ancestor, k):
        return (ancestor is not None and k > 0 and
                (ancestor.state == node.state or find_cycle(ancestor.parent, k - 1)))
    return find_cycle(node.parent, k)


FIFOQueue = deque  # append on the left with appendleft(), pop() from the right
LIFOQueue = list   # append() and pop() from the end


class PriorityQueue:
    """A queue in which the item with minimum key(item) is always popped first.
    Ties are broken by insertion order (first in, first out)."""

    def __init__(self, items=(), key=lambda x: x):
        self.key = key
        self.items = []  # heap of (score, insertion counter, item)
        self._count = itertools.count()
        for item in items:
            self.add(item)

    def add(self, item):
        heapq.heappush(self.items, (self.key(item), next(self._count), item))

    def pop(self):
        return heapq.heappop(self.items)[2]

    def top(self):
        return self.items[0][2]

    def __len__(self):
        return len(self.items)


class GraphProblem(Problem):
    """Route finding on an explicit weighted graph.

    graph: {state: {neighbor: cost, ...}, ...}   (use undirected() to build one from edges)
    h_table: optional {state: heuristic estimate}.
    Actions are the neighbor names, in alphabetical order; result(s, a) = a.
    """

    def __init__(self, initial, goal, graph, h_table=None):
        super().__init__(initial, goal, graph=graph, h_table=h_table or {})

    def actions(self, state):
        return sorted(self.graph.get(state, {}))

    def result(self, state, action):
        return action

    def action_cost(self, s, a, s1):
        return self.graph[s][s1]

    def h(self, node):
        return self.h_table.get(node.state, 0)


def undirected(edges):
    """[('A', 'B', 3), ...] -> {'A': {'B': 3}, 'B': {'A': 3}, ...}"""
    graph = defaultdict(dict)
    for a, b, c in edges:
        graph[a][b] = c
        graph[b][a] = c
    return dict(graph)


def directed(edges):
    """[('A', 'B', 3), ...] -> {'A': {'B': 3}, 'B': {}, ...}"""
    graph = defaultdict(dict)
    for a, b, c in edges:
        graph[a][b] = c
        graph.setdefault(b, {})
    return dict(graph)


def inversions(board):
    """Number of times a piece is a smaller number than a following piece."""
    return sum((a > b != 0 and a != 0) for (a, b) in itertools.combinations(board, 2))


class EightPuzzle(Problem):
    """Sliding tiles on a 3x3 board. A state is a tuple of 9 ints, 0 is the blank:
        1 2 3
        4 5 6   ==>  (1, 2, 3, 4, 5, 6, 7, 8, 0)
        7 8 _
    An action is the index of the square the blank moves to."""

    MOVES = ((1, 3), (0, 2, 4), (1, 5),
             (0, 4, 6), (1, 3, 5, 7), (2, 4, 8),
             (3, 7), (4, 6, 8), (5, 7))

    def __init__(self, initial, goal=(1, 2, 3, 4, 5, 6, 7, 8, 0)):
        assert inversions(initial) % 2 == inversions(goal) % 2, 'unsolvable (parity)'
        super().__init__(tuple(initial), tuple(goal))

    def actions(self, state):
        return self.MOVES[state.index(0)]

    def result(self, state, action):
        s = list(state)
        blank = state.index(0)
        s[action], s[blank] = s[blank], s[action]
        return tuple(s)


# ---------------------------------------------------------------- games

class Game:
    """A game: subclass and implement actions, result, utility (and is_terminal).
    States must have a .to_move attribute."""

    def actions(self, state):        raise NotImplementedError
    def result(self, state, move):   raise NotImplementedError
    def is_terminal(self, state):    return not self.actions(state)
    def utility(self, state, player): raise NotImplementedError


def play_game(game, strategies: dict, verbose=False):
    """Play a turn-taking game. `strategies` is a {player_name: function} dict,
    where function(game, state) is used to get the player's move."""
    state = game.initial
    while not game.is_terminal(state):
        player = state.to_move
        move = strategies[player](game, state)
        state = game.result(state, move)
        if verbose:
            print('Player', player, 'move:', move)
            print(state)
    return state


class TreeState(tuple):
    """A position in an explicit game tree: the tuple of child indices from the root."""
    to_move = 'MAX'

    def __new__(cls, path, to_move):
        self = super().__new__(cls, path)
        self.to_move = to_move
        return self

    def __getnewargs__(self):  # so copy/deepcopy/pickle keep to_move
        return (tuple(self), self.to_move)


class TreeGame(Game):
    """An explicit game tree given as nested lists; leaves are utilities for MAX.
    MAX moves at the root, then players alternate.

        game = TreeGame([[3, 12, 8], [2, 4, 6], [14, 5, 2]])
        game.evaluated  -> leaves whose utility was read, in order (to see pruning)
    """

    def __init__(self, tree):
        self.tree = tree
        self.initial = TreeState((), 'MAX')
        self.evaluated = []

    def subtree(self, state):
        t = self.tree
        for i in state:
            t = t[i]
        return t

    def actions(self, state):
        t = self.subtree(state)
        return list(range(len(t))) if isinstance(t, list) else []

    def result(self, state, move):
        return TreeState(tuple(state) + (move,), 'MIN' if state.to_move == 'MAX' else 'MAX')

    def utility(self, state, player):
        v = self.subtree(state)
        self.evaluated.append(v)
        return v if player == 'MAX' else -v


class Board(defaultdict):
    """A board has the player to move, a cached utility value,
    and a dict of {(x, y): player} entries, where player is 'X' or 'O'."""
    empty = '.'
    off = '#'

    def __init__(self, width=8, height=8, to_move=None, **kwds):
        self.__dict__.update(width=width, height=height, to_move=to_move, **kwds)

    def new(self, changes: dict, **kwds) -> 'Board':
        "Given a dict of {(x, y): contents} changes, return a new Board with the changes."
        board = Board(width=self.width, height=self.height, **kwds)
        board.update(self)
        board.update(changes)
        return board

    def __missing__(self, loc):
        x, y = loc
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.empty
        return self.off

    def __hash__(self):
        return hash(tuple(sorted(self.items()))) + hash(self.to_move)

    def __reduce__(self):  # so copy/deepcopy/pickle keep size, to_move and utility
        return (_rebuild_board, (dict(self), dict(self.__dict__)))

    def __repr__(self):
        def row(y): return ' '.join(self[x, y] for x in range(self.width))
        return '\n'.join(map(row, range(self.height))) + '\n'


def _rebuild_board(squares, attrs):
    board = Board(**attrs)
    board.update(squares)
    return board


def k_in_row(board, player, square, k):
    """True if player has k pieces in a line through square."""
    def in_row(x, y, dx, dy):
        return 0 if board[x, y] != player else 1 + in_row(x + dx, y + dy, dx, dy)
    return any(in_row(*square, dx, dy) + in_row(*square, -dx, -dy) - 1 >= k
               for (dx, dy) in ((0, 1), (1, 0), (1, 1), (1, -1)))


class TicTacToe(Game):
    """Play TicTacToe on an `height` by `width` board, needing `k` in a row to win.
    'X' plays first against 'O'. Moves are (x, y) squares, listed in sorted order."""

    def __init__(self, height=3, width=3, k=3):
        self.k = k
        self.squares = {(x, y) for x in range(width) for y in range(height)}
        self.initial = Board(height=height, width=width, to_move='X', utility=0)

    def actions(self, board):
        return sorted(self.squares - set(board))

    def result(self, board, square):
        player = board.to_move
        board = board.new({square: player}, to_move=('O' if player == 'X' else 'X'))
        win = k_in_row(board, player, square, self.k)
        board.utility = (0 if not win else +1 if player == 'X' else -1)
        return board

    def utility(self, board, player):
        return board.utility if player == 'X' else -board.utility

    def is_terminal(self, board):
        return board.utility != 0 or len(self.squares) == len(board)

    def display(self, board):
        print(board)


def random_player(game, state, rng=None):
    import random
    return (rng or random).choice(list(game.actions(state)))
