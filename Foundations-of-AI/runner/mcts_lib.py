"""Helpers for the MCTS & bandit problems.

    from mcts_lib import Bandit, MCTSNode, make_tree

Bandit:    a seeded k-armed bandit with win/lose (Bernoulli) arms.
MCTSNode:  a node of the MCTS tree with the statistics U(n) and N(n).
make_tree: build a tree of MCTSNodes from (U, N, {move: child}) tuples, e.g. a figure from the slides.
"""
import random


class Bandit:
    """k-armed bandit: pull(a) returns 1 with probability probs[a], else 0.
    Rewards come from the bandit's own seeded rng, so experiments are reproducible.
    history: [(arm, reward), ...] for every pull."""

    def __init__(self, probs, seed=0):
        self.probs = list(probs)
        self.k = len(self.probs)
        self.rng = random.Random(seed)
        self.history = []

    def pull(self, a):
        r = 1 if self.rng.random() < self.probs[a] else 0
        self.history.append((a, r))
        return r

    def __repr__(self):
        return 'Bandit({})'.format(self.probs)


class MCTSNode:
    """A node n of the Monte Carlo search tree.

    U       utility collected so far = wins (draw = 0.5) for `player`
    N       number of simulations that went through n
    player  the player who made the move INTO n (so the parent, whose turn it is,
            can simply pick the child with the largest UCB1)
    move    the move that leads from parent to n
    untried moves of n's state not expanded yet
    """

    def __init__(self, state=None, parent=None, move=None, player=None, untried=()):
        self.state, self.parent, self.move, self.player = state, parent, move, player
        self.untried = list(untried)
        self.children = []
        self.U = 0
        self.N = 0

    def __repr__(self):
        return '<{} {:g}/{}>'.format(self.move, self.U, self.N)


def make_tree(spec, players=('MAX', 'MIN'), move=None, parent=None):
    """Build MCTSNodes from (U, N) or (U, N, {move: child_spec, ...}).
    players[0] is the player to move at the root: the root's children have player players[0],
    the root itself players[1], and so on alternating. Returns the root."""
    U, N, *rest = spec
    node = MCTSNode(parent=parent, move=move, player=players[1])
    node.U, node.N = U, N
    for m, child in (rest[0] if rest else {}).items():
        node.children.append(make_tree(child, players[::-1], m, node))
    return node
