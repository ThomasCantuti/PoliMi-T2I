"""Helpers for Local Search & Optimization (slides p. 318-336).

    from local_lib import ROWS, COLS, HOUSES, START, queens_h, queen_neighbors, hill_climbing

N-queens states are tuples: state[i] = row (1..n, 1 = top) of the queen in column i+1,
like the CSP variables X1..Xn of the slides. (3, 1, 4, 2) is a 4-queens solution.

The functions are the course versions: use them in later problems once you have
written your own in the earlier ones.
"""
import itertools

# Homes & hospitals (slides p. 323-329): a 5 x 10 grid, cells are (row, col), (0, 0) top-left.
ROWS, COLS = 5, 10
HOUSES = [(0, 8), (1, 2), (3, 1), (4, 6)]
START = ((0, 4), (3, 9))  # the two hospitals of p. 324: cost 17


def queens_h(state):
    "Number of pairs of queens that attack each other (slides p. 334)."
    return sum(state[i] == state[j] or abs(state[i] - state[j]) == j - i
               for i, j in itertools.combinations(range(len(state)), 2))


def queen_neighbors(state):
    "Move one queen inside its column: column 1 first, rows 1..n in order."
    n = len(state)
    return [state[:c] + (r,) + state[c + 1:]
            for c in range(n) for r in range(1, n + 1) if r != state[c]]


def hill_climbing(initial, neighbors, cost, max_sideways=0):
    """Steepest-descent hill climbing (slides p. 321, minimizing cost).
    Moves to the FIRST neighbor of minimum cost while it is strictly better, or equal and fewer
    than max_sideways consecutive sideways moves were made. Returns the list of visited states."""
    path, sideways = [initial], 0
    while True:
        current = path[-1]
        options = list(neighbors(current))
        if not options:
            return path
        best = min(options, key=cost)  # min() keeps the first of equal costs
        if cost(best) < cost(current):
            sideways = 0
        elif cost(best) == cost(current) and sideways < max_sideways:
            sideways += 1
        else:
            return path
        path.append(best)
