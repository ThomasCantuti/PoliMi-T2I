from harness import Test

TITLE = 'Exercise book 4.3 · Minimax on the brick-splitting game (seven bricks)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exercise book', 'minimax', 'game formulation', 'transpositions']

STATEMENT = r"""
*Exercise book (Restelli, Gatti, Papini, Metelli), Exercise 4.3.*

Two-player zero-sum game. The game begins with a pile of **seven** bricks. On your move you must split **one** pile into
two piles of **different** sizes. If it is your turn and every pile has one or two bricks (no legal split), you have
**lost**. Apply minimax to find the best action for MAX (the first player).

A state is the tuple of pile sizes in **decreasing** order, e.g. `(4, 2, 1)` — the order of the piles does not matter,
so `(1, 2, 4)` and `(4, 2, 1)` are the same state (the book's "state equivalences").

Write:

- `successors(state)` → the list of distinct states reachable with one split, each sorted in decreasing order, in the
  order: piles from left to right, and for each pile the splits $(p-1, 1), (p-2, 2), \dots$ (bigger part first),
  skipping states already listed;
- `minimax_value(state, max_to_move=True)` → $+1$ if MAX wins with optimal play from `state`, $-1$ otherwise.

```text
successors((7,))    -> [(6, 1), (5, 2), (4, 3)]
successors((4, 3))  -> [(3, 3, 1), (4, 2, 1)]
minimax_value((7,)) -> -1      # MAX always loses
```

The tests also try bigger piles: the same position is reached through many different move orders, so remember the
values you have already computed.
"""

STARTER = '''def successors(state: tuple) -> list[tuple]:
    """States reachable by splitting one pile into two different non-empty piles (sorted decreasing, no duplicates)."""
    result = []
    # TODO
    return result


def minimax_value(state: tuple, max_to_move: bool = True) -> int:
    """+1 if MAX wins from state with optimal play, -1 otherwise. No legal move = the player to move loses."""
    # TODO
    return 0
'''

SOLUTION = '''from functools import lru_cache


def successors(state: tuple) -> list[tuple]:
    """States reachable by splitting one pile into two different non-empty piles (sorted decreasing, no duplicates)."""
    result = []
    for i, pile in enumerate(state):
        for small in range(1, (pile + 1) // 2):          # small < pile - small
            child = tuple(sorted(state[:i] + (pile - small, small) + state[i + 1:], reverse=True))
            if child not in result:
                result.append(child)
    return result


@lru_cache(maxsize=None)
def minimax_value(state: tuple, max_to_move: bool = True) -> int:
    """+1 if MAX wins from state with optimal play, -1 otherwise. No legal move = the player to move loses."""
    children = successors(state)
    if not children:                                     # terminal: the player to move has lost
        return -1 if max_to_move else +1
    values = [minimax_value(child, not max_to_move) for child in children]
    return max(values) if max_to_move else min(values)
'''

HINTS = [
    'A pile p can be split into (p − s, s) for s = 1, 2, … while s < p − s. Rebuild the tuple, sort it with `reverse=True`, and skip it if it is already in the list.',
    'Terminal test = `successors(state) == []`. The utility is from MAX\'s point of view: if MAX is the one who cannot move, −1; if MIN cannot move, +1.',
    'For the big tests, cache the values: `@functools.lru_cache(maxsize=None)` on `minimax_value` works because states are tuples (hashable). This is a transposition table.',
]

EXPLANATION = r"""
**Book solution (verified).** The complete tree from 7, with minimax values ($+1$ = MAX wins):

```text
(7)  MAX  -1
├── (6,1)  MIN  -1
│   ├── (5,1,1)  MAX  +1
│   │   ├── (4,1,1,1)  MIN  +1 ── (3,1,1,1,1)  MAX  +1 ── (2,1,1,1,1,1)  MIN cannot move: +1
│   │   └── (3,2,1,1)  MIN  -1 ── (2,2,1,1,1)  MAX cannot move: -1
│   └── (4,2,1)  MAX  -1 ── (3,2,1,1)  MIN  -1 ── (2,2,1,1,1)  -1
├── (5,2)  MIN  -1
│   ├── (4,2,1)  MAX  -1 ── (3,2,1,1) ── (2,2,1,1,1)  -1
│   └── (3,2,2)  MAX  +1 ── (2,2,2,1)  MIN cannot move: +1
└── (4,3)  MIN  -1
    ├── (3,3,1)  MAX  -1 ── (3,2,1,1) ── (2,2,1,1,1)  -1
    └── (4,2,1)  MAX  -1 ── (3,2,1,1) ── (2,2,1,1,1)  -1
```

Each MIN node has a reply leading to (4,2,1) or (3,3,1), from which MAX is forced into (3,2,1,1) and then stuck.
**Every first move loses: the value of 7 is −1** — "the max player always loses". The book then runs alpha-beta on the
tree with the linear chains replaced by their leaf: after (6,1) returns −1 the root has $\alpha = -1$, and (5,2) and
(4,3) are cut off right after their first child (worth −1 ≤ α), so their second children are pruned.

**Why memoisation.** A tree search generates (4,2,1) three times already from 7; with 16 bricks plain minimax visits
about 520 000 nodes, with 20 bricks tens of millions. Since a state's value does not depend on how it was reached,
storing it (a *transposition table*) makes the search linear in the number of distinct states. The losing starting
piles are 1, 2, 4, 7, 10, 20, 23, 26, … (this is Grundy's game).

"""

ENTRY = 'minimax_value'

TESTS = [
    Test('successors of 7', call=lambda sol: sol.successors((7,)), expected=[(6, 1), (5, 2), (4, 3)],
         show='successors((7,))'),
    Test('successors of (6, 1)', call=lambda sol: sol.successors((6, 1)), expected=[(5, 1, 1), (4, 2, 1)],
         show='successors((6, 1))'),
    Test('successors of (4, 3): no duplicates, no equal halves', call=lambda sol: sol.successors((4, 3)),
         expected=[(3, 3, 1), (4, 2, 1)], show='successors((4, 3))'),
    Test('terminal state: nothing to split', call=lambda sol: sol.successors((2, 2, 1, 1)), expected=[],
         show='successors((2, 2, 1, 1))'),
    Test('seven bricks: MAX loses', args=((7,),), expected=-1),
    Test('three bricks: MAX splits into (2, 1) and wins', args=((3,),), expected=1),
    Test('four bricks: the only move (3, 1) loses', args=((4,),), expected=-1),
    Test('MAX cannot move at all', args=((2, 1),), expected=-1),
    Test('MIN to move from seven bricks', args=((7,), False), expected=1),
    Test('a position with several piles', args=((5, 3),), expected=1),
    Test('8, 9, 10 bricks', call=lambda sol: [sol.minimax_value((n,)) for n in (8, 9, 10)], expected=[1, 1, -1],
         show='[minimax_value((n,)) for n in (8, 9, 10)]'),
    Test('20 bricks, fast (transpositions!)', args=((20,),), expected=-1, timeout=5),
]
