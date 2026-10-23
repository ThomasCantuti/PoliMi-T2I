"""Helpers for Uncertainty & Bayesian Networks (AIMA §12.1-12.5, §13.1-13.2, §13.3.1).

    from uncertainty_lib import burglary, dentist, student, flu, heart, five_vars, telescope_dag
    from uncertainty_lib import values, cond_prob, joint_prob, prob, enumeration_ask      # inference
    from uncertainty_lib import dag, children, descendants, is_active, trails, d_separated  # structure

A Bayesian network is a dict {variable: (parents, cpt)}:
    parents   tuple of parent names (() for a root)
    cpt       {tuple of the parents' values: {value: probability}}; a root has the single key ()
    net['Alarm'] = (('Burglary', 'Earthquake'),
                    {(True, True): {True: 0.95, False: 0.05}, (True, False): {...}, ...})
An event / the evidence is a dict {variable: value}. A DAG (structure only) is a dict
{variable: tuple of parents}; dag(net) extracts it from a network.

The inference and d-separation functions below are the course versions: use them in later
problems once you have written your own in the earlier ones.
"""
import itertools


# ---------------------------------------------------------------- building networks

def bool_cpt(table):
    """{parent values: P(X = True | parents)} -> full CPT rows {True: p, False: 1 - p}.
    Keys may be a single value (one parent), a tuple, or () for a root."""
    return {k if isinstance(k, tuple) else (k,): {True: p, False: round(1 - p, 12)} for k, p in table.items()}


def burglary():
    """The burglary network (AIMA §13.1, Figure 13.2). All variables are boolean."""
    return {
        'Burglary': ((), bool_cpt({(): 0.001})),
        'Earthquake': ((), bool_cpt({(): 0.002})),
        'Alarm': (('Burglary', 'Earthquake'), bool_cpt({(True, True): 0.95, (True, False): 0.94,
                                                         (False, True): 0.29, (False, False): 0.001})),
        'JohnCalls': (('Alarm',), bool_cpt({True: 0.90, False: 0.05})),
        'MaryCalls': (('Alarm',), bool_cpt({True: 0.70, False: 0.01})),
    }


def dentist():
    """Cavity -> Toothache, Cavity -> Catch (AIMA §12.5.2). Its joint is exactly the full joint
    distribution of AIMA Figure 12.3."""
    return {
        'Cavity': ((), bool_cpt({(): 0.2})),
        'Toothache': (('Cavity',), bool_cpt({True: 0.6, False: 0.1})),
        'Catch': (('Cavity',), bool_cpt({True: 0.9, False: 0.2})),
    }


# The full joint distribution of AIMA Figure 12.3: (Toothache, Catch, Cavity) -> probability.
DENTIST_VARIABLES = ('Toothache', 'Catch', 'Cavity')
DENTIST_JOINT = {
    (True, True, True): 0.108, (True, False, True): 0.012, (False, True, True): 0.072, (False, False, True): 0.008,
    (True, True, False): 0.016, (True, False, False): 0.064, (False, True, False): 0.144, (False, False, False): 0.576,
}

STUDENT_PRIORS = {'A': (0.9, 0.3), 'B': (0.5, 0.6), 'C': (0.4, 0.9), 'D': (0.4, 0.9)}   # version: (P(d1), P(k1))


def student(p_d1=0.9, p_k1=0.3):
    """The course's student network (exams 6 Feb 2024, 12 Jul 2024). Variables and values:
    Difficulty d0/d1, Knowledge k0/k1, Grade g1/g2/g3 (A/B/C), Letter L0/L1, Test s0/s1.
    The defaults are the priors of 6 Feb 2024 version A and of 12 Jul 2024."""
    return {
        'Difficulty': ((), {(): {'d0': round(1 - p_d1, 12), 'd1': p_d1}}),
        'Knowledge': ((), {(): {'k0': round(1 - p_k1, 12), 'k1': p_k1}}),
        'Grade': (('Knowledge', 'Difficulty'), {
            ('k0', 'd0'): {'g1': 0.3, 'g2': 0.4, 'g3': 0.3},
            ('k0', 'd1'): {'g1': 0.05, 'g2': 0.25, 'g3': 0.7},
            ('k1', 'd0'): {'g1': 0.9, 'g2': 0.08, 'g3': 0.02},
            ('k1', 'd1'): {'g1': 0.5, 'g2': 0.3, 'g3': 0.2}}),
        'Letter': (('Grade',), {('g1',): {'L0': 0.1, 'L1': 0.9}, ('g2',): {'L0': 0.4, 'L1': 0.6},
                                ('g3',): {'L0': 0.99, 'L1': 0.01}}),
        'Test': (('Knowledge',), {('k0',): {'s0': 0.95, 's1': 0.05}, ('k1',): {'s0': 0.2, 's1': 0.8}}),
    }


FLU_VERSIONS = {   # version: (P(V=True), P(M=True), P(F=True | V, M) for (V, M) = FF, TF, FT, TT)
    'A': (0.8, 0.6, (0.2, 0.0, 0.7, 0.0)),
    'B': (0.7, 0.7, (0.3, 0.1, 0.8, 0.1)),
    'C': (0.8, 0.7, (0.1, 0.2, 0.7, 0.0)),
}


def flu(version='A'):
    """The influenza network of the exam of 9 Feb 2023: V -> F <- M (all boolean)."""
    pv, pm, (ff, tf, ft, tt) = FLU_VERSIONS[version]
    return {
        'V': ((), bool_cpt({(): pv})),
        'M': ((), bool_cpt({(): pm})),
        'F': (('V', 'M'), bool_cpt({(False, False): ff, (True, False): tf, (False, True): ft, (True, True): tt})),
    }


def heart():
    """The heart-disease network of the exam of 16 Jan 2025. E (exercise) yes/no, D (diet) healthy/unhealthy,
    HD (heart disease), Hb (heartburn), CP (chest pain) yes/no, BP (blood pressure) high/low."""
    yn = lambda p: {'yes': p, 'no': round(1 - p, 12)}
    return {
        'E': ((), {(): yn(0.7)}),
        'D': ((), {(): {'healthy': 0.25, 'unhealthy': 0.75}}),
        'HD': (('E', 'D'), {('yes', 'healthy'): yn(0.25), ('yes', 'unhealthy'): yn(0.45),
                            ('no', 'healthy'): yn(0.55), ('no', 'unhealthy'): yn(0.75)}),
        'Hb': (('D',), {('healthy',): yn(0.2), ('unhealthy',): yn(0.85)}),
        'BP': (('HD',), {('yes',): {'high': 0.85, 'low': 0.15}, ('no',): {'high': 0.2, 'low': 0.8}}),
        'CP': (('HD', 'Hb'), {('yes', 'yes'): yn(0.8), ('yes', 'no'): yn(0.6),
                              ('no', 'yes'): yn(0.4), ('no', 'no'): yn(0.1)}),
    }


FIVE_VARS_VERSIONS = {   # version: (P(A=0) = P(C=0) = P(E=0), theta = a*y + b*z, phi = c*y + d*z)
    'A': (0.7, (0.2, 0.4), (0.4, 0.2)),
    'B': (0.6, (0.1, 0.3), (0.3, 0.1)),
}


def five_vars(version='A'):
    """The network of the exam of 6 Feb 2026: A -> B <- C -> D <- E, binary 0/1 variables,
    P(B=1 | A=y, C=z) = theta(y, z) = a*y + b*z,  P(D=1 | C=y, E=z) = phi(y, z) = c*y + d*z."""
    p0, (a, b), (c, d) = FIVE_VARS_VERSIONS[version]
    root = {(): {0: p0, 1: round(1 - p0, 12)}}
    bern = lambda t: {1: t, 0: round(1 - t, 12)}
    return {
        'A': ((), root), 'C': ((), root), 'E': ((), root),
        'B': (('A', 'C'), {(y, z): bern(round(a * y + b * z, 12)) for y in (0, 1) for z in (0, 1)}),
        'D': (('C', 'E'), {(y, z): bern(round(c * y + d * z, 12)) for y in (0, 1) for z in (0, 1)}),
    }


def telescope_dag():
    """The causal network (ii) of the exam of 8 Sep 2025: N -> M1 <- F1, N -> M2 <- F2."""
    return {'N': (), 'F1': (), 'F2': (), 'M1': ('N', 'F1'), 'M2': ('N', 'F2')}


# ---------------------------------------------------------------- inference (course algorithms)

def values(net, X):
    "The domain of X, read from its CPT."
    return list(next(iter(net[X][1].values())))


def cond_prob(net, X, x, event):
    "P(X = x | parents(X)), the parents' values read from `event`."
    parents, cpt = net[X]
    return cpt[tuple(event[p] for p in parents)][x]


def joint_prob(net, event):
    "Chain rule of Bayesian networks: P(x1, ..., xn) = prod_i P(xi | parents(Xi)). `event` must be complete."
    p = 1.0
    for X in net:
        p *= cond_prob(net, X, event[X], event)
    return p


def all_events(net, fixed=None):
    "Every complete event that agrees with `fixed`."
    fixed = fixed or {}
    free = [X for X in net if X not in fixed]
    for combo in itertools.product(*(values(net, X) for X in free)):
        yield {**fixed, **dict(zip(free, combo))}


def prob(net, event):
    "P(event) for a partial event: marginalization = sum of the joint over the missing variables."
    return sum(joint_prob(net, e) for e in all_events(net, event))


def enumeration_ask(X, evidence, net):
    "P(X | evidence) by enumeration (AIMA §13.3.1): {x: probability}, normalized."
    dist = {x: prob(net, {**evidence, X: x}) for x in values(net, X)}
    total = sum(dist.values())
    return {x: p / total for x, p in dist.items()}


# ---------------------------------------------------------------- structure (course algorithms)

def dag(net):
    "The structure of a network: {variable: tuple of parents}."
    return {X: tuple(net[X][0]) for X in net}


def children(g, X):
    return [Y for Y in g if X in g[Y]]


def descendants(g, X):
    "Every node reachable from X following the arrows (X excluded)."
    out, stack = set(), [X]
    while stack:
        for c in children(g, stack.pop()):
            if c not in out:
                out.add(c)
                stack.append(c)
    return out


def is_active(g, trail, evidence):
    """Is the trail X1 - X2 - ... - Xn active given the evidence (a set of observed variables)?
    No node of the trail is observed, except the middle node of a v-structure X(i-1) -> Xi <- X(i+1),
    which must be observed or have an observed descendant."""
    evidence = set(evidence)
    if trail[0] in evidence or trail[-1] in evidence:
        return False
    for a, b, c in zip(trail, trail[1:], trail[2:]):
        if a in g[b] and c in g[b]:                       # a -> b <- c: v-structure
            if b not in evidence and not descendants(g, b) & evidence:
                return False
        elif b in evidence:                                # chain or fork through an observed node
            return False
    return True


def trails(g, X, Y):
    "Every trail (path in the undirected skeleton, no repeated node) from X to Y, as lists."
    nbrs = {Z: set(g[Z]) | set(children(g, Z)) for Z in g}
    out, path = [], [X]

    def extend(Z):
        if Z == Y:
            out.append(list(path))
            return
        for W in sorted(nbrs[Z]):
            if W not in path:
                path.append(W)
                extend(W)
                path.pop()
    extend(X)
    return out


def d_separated(g, X, Y, evidence=()):
    "True iff no trail between (any node of) X and (any node of) Y is active given the evidence."
    Xs = {X} if isinstance(X, str) else set(X)
    Ys = {Y} if isinstance(Y, str) else set(Y)
    return not any(is_active(g, t, evidence) for x in Xs for y in Ys for t in trails(g, x, y))
