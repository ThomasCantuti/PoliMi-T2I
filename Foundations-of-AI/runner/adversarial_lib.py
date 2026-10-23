"""Helpers for the adversarial-search problems.

    from adversarial_lib import ChanceTreeGame, ttt_position

ChanceTreeGame: an explicit game tree with MAX, MIN and CHANCE nodes (for expectiminimax).
ttt_position:   build a TicTacToe position from three strings, e.g. ['X.O', '.X.', '..O'].
"""
from aima import Game, TreeState, TicTacToe, k_in_row


class ChanceTreeGame(Game):
    """An explicit game tree with chance nodes. A tree is either
        a number                         -> terminal state, its utility for MAX
        ('MAX', [tree, ...])             -> MAX chooses a child
        ('MIN', [tree, ...])             -> MIN chooses a child
        ('CHANCE', [(p, tree), ...])     -> nature picks child r with probability p

    States are TreeState paths with .to_move in {'MAX', 'MIN', 'CHANCE', None (terminal)}.
    At a CHANCE state, actions(state) are the outcome indices r and probability(state, r) is P(r).
    game.evaluated lists the leaves whose utility was read, in order (to see pruning).

        game = ChanceTreeGame(('MAX', [('CHANCE', [(.5, 10), (.5, 10)]),
                                       ('CHANCE', [(.5, 9), (.5, 100)])]))
    """

    def __init__(self, tree):
        self.tree = tree
        self.evaluated = []
        self.initial = TreeState((), self.kind(tree))

    @staticmethod
    def kind(t):
        return None if isinstance(t, (int, float)) else t[0]

    def subtree(self, state):
        t = self.tree
        for i in state:
            kind, children = t
            t = children[i][1] if kind == 'CHANCE' else children[i]
        return t

    def actions(self, state):
        t = self.subtree(state)
        return [] if self.kind(t) is None else list(range(len(t[1])))

    def result(self, state, move):
        child = self.subtree(TreeState(tuple(state) + (move,), None))
        return TreeState(tuple(state) + (move,), self.kind(child))

    def probability(self, state, r):
        return self.subtree(state)[1][r][0]

    def utility(self, state, player):
        v = self.subtree(state)
        self.evaluated.append(v)
        return v if player == 'MAX' else -v


def ttt_position(rows, to_move=None):
    """A 3x3 TicTacToe state from rows like ['X.O', '.X.', '..O'] (rows[y][x], '.' = empty).
    The player to move is inferred (X moves first) unless given. Use with game = TicTacToe()."""
    pieces = {(x, y): c for y, row in enumerate(rows) for x, c in enumerate(row) if c in 'XO'}
    if to_move is None:
        xs = sum(c == 'X' for c in pieces.values())
        to_move = 'X' if xs == len(pieces) - xs else 'O'
    board = TicTacToe().initial.new(pieces, to_move=to_move)
    board.utility = 0
    for sq, p in pieces.items():
        if k_in_row(board, p, sq, 3):
            board.utility = +1 if p == 'X' else -1
    return board
