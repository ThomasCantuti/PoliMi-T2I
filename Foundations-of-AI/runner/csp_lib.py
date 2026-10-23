"""Helpers for the Constraint Satisfaction Problems (slides p. 257-317).

    from csp_lib import CSP, australia, queens, is_solution
    from csp_lib import forward_checking, ac3, select_unassigned_variable   # course algorithms

A binary CSP, as in aima-python csp.py:
    csp.variables                 list of variable names (this order = the "static" variable order)
    csp.domains[X]                list of the initial values of X (this order = the value order)
    csp.neighbors[X]              list of the variables that share a constraint with X
    csp.constraints(A, a, B, b)   True if A=a and B=b satisfy the constraint between A and B
An assignment is a dict {var: value}; "current domains" are a dict {var: [values]}.

The algorithms below are the course versions: use them in later problems once you have
written your own in the earlier ones.
"""
from collections import deque


class CSP:
    def __init__(self, variables, domains, neighbors, constraints):
        self.variables = list(variables)
        self.domains = {v: list(domains[v]) for v in self.variables}
        self.neighbors = {v: list(neighbors.get(v, ())) for v in self.variables}
        self.constraints = constraints

    def __repr__(self):
        return 'CSP({})'.format(self.variables)


def different_values(A, a, B, b):
    return a != b


# ---------------------------------------------------------------- instances from the slides

AUSTRALIA_NEIGHBORS = {
    'WA': ['NT', 'SA'],
    'NT': ['WA', 'Q', 'SA'],
    'Q': ['NT', 'NSW', 'SA'],
    'NSW': ['Q', 'V', 'SA'],
    'V': ['NSW', 'SA'],
    'SA': ['WA', 'NT', 'Q', 'NSW', 'V'],
    'T': [],
}


def australia(colors='RGB', order=('WA', 'NT', 'Q', 'NSW', 'V', 'SA', 'T')):
    """Map coloring of Australia (slides p. 261). Colors 'R', 'G', 'B' in this order."""
    return CSP(order, {v: list(colors) for v in order}, AUSTRALIA_NEIGHBORS, different_values)


def queens(n):
    """n-queens (slides p. 267): variable Xi = row (1..n) of the queen in column i."""
    names = ['X{}'.format(i) for i in range(1, n + 1)]

    def no_attack(A, a, B, b):
        return a != b and abs(a - b) != abs(int(A[1:]) - int(B[1:]))

    return CSP(names, {v: list(range(1, n + 1)) for v in names},
               {v: [w for w in names if w != v] for v in names}, no_attack)


def is_solution(csp, assignment):
    """Complete (every variable has a value from its domain) and consistent."""
    return (isinstance(assignment, dict) and set(assignment) == set(csp.variables)
            and all(assignment[X] in csp.domains[X] for X in csp.variables)
            and all(csp.constraints(X, assignment[X], Y, assignment[Y])
                    for X in csp.variables for Y in csp.neighbors[X]))


# ---------------------------------------------------------------- course algorithms

def is_consistent(csp, var, value, assignment):
    "Does var=value satisfy every constraint with the variables already assigned?"
    return all(csp.constraints(var, value, Y, assignment[Y])
               for Y in csp.neighbors[var] if Y in assignment)


def backtracking_search(csp):
    """Plain backtracking (slides p. 275): static variable order, values in domain order.
    Returns (solution or None, number of assignments made)."""
    count = 0

    def backtrack(assignment):
        nonlocal count
        if len(assignment) == len(csp.variables):
            return dict(assignment)
        var = next(v for v in csp.variables if v not in assignment)
        for value in csp.domains[var]:
            if is_consistent(csp, var, value, assignment):
                assignment[var] = value
                count += 1
                result = backtrack(assignment)
                if result is not None:
                    return result
                del assignment[var]
        return None

    return backtrack({}), count


def forward_checking(csp, domains, var, value, assignment):
    """var=value was just added to assignment: return NEW domains where var has [value] and
    every unassigned neighbor Y keeps only the values compatible with var=value (slides p. 284).
    A domain may become empty: the caller checks."""
    new = {v: list(vals) for v, vals in domains.items()}
    new[var] = [value]
    for Y in csp.neighbors[var]:
        if Y not in assignment:
            new[Y] = [y for y in new[Y] if csp.constraints(var, value, Y, y)]
    return new


def revise(csp, domains, Xi, Xj):
    "Remove the values of Xi with no support in Xj (in place). True if Xi's domain changed."
    revised = False
    for x in list(domains[Xi]):
        if not any(csp.constraints(Xi, x, Xj, y) for y in domains[Xj]):
            domains[Xi].remove(x)
            revised = True
    return revised


def ac3(csp, domains):
    "AC-3 (slides p. 294), in place on domains. False iff some domain becomes empty."
    queue = deque((Xi, Xk) for Xi in csp.variables for Xk in csp.neighbors[Xi])
    while queue:
        Xi, Xj = queue.popleft()
        if revise(csp, domains, Xi, Xj):
            if not domains[Xi]:
                return False
            for Xk in csp.neighbors[Xi]:
                if Xk != Xj:
                    queue.append((Xk, Xi))
    return True


def select_unassigned_variable(csp, domains, assignment):
    "MRV, ties broken by the degree heuristic, then by the order of csp.variables (slides p. 298)."
    unassigned = [v for v in csp.variables if v not in assignment]
    return min(unassigned, key=lambda v: (len(domains[v]),
                                          -sum(Y not in assignment for Y in csp.neighbors[v])))


def order_domain_values(csp, domains, var, assignment):
    "Least constraining value first (stable: ties keep the domain order) (slides p. 298)."
    def ruled_out(value):
        return sum(not csp.constraints(var, value, Y, y)
                   for Y in csp.neighbors[var] if Y not in assignment for y in domains[Y])
    return sorted(domains[var], key=ruled_out)
