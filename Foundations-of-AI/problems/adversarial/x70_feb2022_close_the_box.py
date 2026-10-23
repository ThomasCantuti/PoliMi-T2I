from harness import Test

TITLE = 'Exam · Feb 2022 · Close-the-box: the chance level below a dice roll'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'Feb 2022', 'chance nodes', 'expectiminimax', 'game formulation']

STATEMENT = r"""
*Written exam of 17 February 2022 — Adversarial Search (8 points), Questions 2–3.*

**Close-the-box.** Each of the two players has a box of 11 tiles, 2 … 12, all open at the start. In her turn a player
throws **two dice** and then closes either the tile equal to the **sum** of the dice, or **both** tiles showing the two
dice separately (if both are open; a double cannot close the same tile twice, and there is no tile 1). If she cannot
close anything, she passes. The player who first closes all her tiles wins. Example: with 6 and 2 she closes tile 8,
or tiles 6 and 2.

Current state: it is player #1's (MAX's) turn; her open tiles are **2, 5, 6, 11** (player #2 has 3, 5, 7 open).

**Question 2** asks for the game tree from this state down to the next player #2 (MIN) nodes: MAX rolls (a **chance**
node), then MAX decides which tiles to close, then MIN plays. Branches leading to the same state may be grouped.

**Question 3** asks for `generate_next_level_data(state)`: all the information needed to build the level below the
chance node, i.e. **which choices MAX will have, and with which probability**.

Write `generate_next_level_data(open_tiles)` returning a dict

```text
{ available_actions : number of the 36 equally likely ordered rolls (d1, d2) that give exactly those actions }
```

- an action is the sorted tuple of the tiles it closes: `(9,)` = close the sum, `(3, 6)` = close the two dice;
- `available_actions` is the **sorted tuple** of the actions available after a roll; `((),)` when MAX can only pass;
- the probability of a branch is count / 36.

```text
generate_next_level_data([3, 4, 7])
  -> {((3,),): 2, ((4,),): 3, ((7,),): 4, ((3, 4), (7,)): 2, ((),): 25}
     roll (3,4) or (4,3): MAX chooses between closing 3 and 4, or closing 7
```
"""

STARTER = '''def generate_next_level_data(open_tiles: list[int]) -> dict[tuple, int]:
    """For the player with these open tiles, about to roll two dice: map each set of available actions
    (sorted tuple of actions, ((),) = pass) to the number of the 36 ordered rolls that produce it."""
    data = {}
    for d1 in range(1, 7):
        for d2 in range(1, 7):
            actions = []
            # TODO: close the sum? close both dice?
            # TODO: group the roll with the others that offer the same actions
    return data
'''

SOLUTION = '''def generate_next_level_data(open_tiles: list[int]) -> dict[tuple, int]:
    """For the player with these open tiles, about to roll two dice: map each set of available actions
    (sorted tuple of actions, ((),) = pass) to the number of the 36 ordered rolls that produce it."""
    open_tiles = set(open_tiles)
    data = {}
    for d1 in range(1, 7):
        for d2 in range(1, 7):
            actions = []
            if d1 != d2 and d1 in open_tiles and d2 in open_tiles:
                actions.append((min(d1, d2), max(d1, d2)))
            if d1 + d2 in open_tiles:
                actions.append((d1 + d2,))
            key = tuple(sorted(actions)) or ((),)
            data[key] = data.get(key, 0) + 1
    return data
'''

HINTS = [
    'Loop over the 36 **ordered** rolls: (1, 4) and (4, 1) are different outcomes, so a non-double sum has probability 2/36 per pair of dice values, a double 1/36.',
    'Two separate actions are possible after one roll, e.g. (5, 6): close 11, or close 5 and 6. That roll leads to a MAX node with **two** children — keep both actions in the same key.',
    'For the exam state the counts are 1, 2, 4, 5, 2, 2 and 20 (pass): they must add up to 36.',
]

EXPLANATION = r"""
**Question 2 (official tree, verified).** MAX's only action is "roll", which leads to a chance node; each outcome
is a MAX node where she decides what to close; probabilities on the chance edges:

```text
                                    MAX
                                     | roll
                                   CHANCE
       1/36     2/36     4/36     5/36     2/36          2/36            20/36
       MAX      MAX      MAX      MAX      MAX           MAX              MAX
        | 2      | 2,5    | 5      | 6      | 2,6     5,6 /  \ 11          | pass
       MIN      MIN      MIN      MIN      MIN         MIN    MIN          MIN
```

Rolls: (1,1) → 2; (2,5) → 2 & 5 (7 is closed); (1,4), (2,3) → 5 (3 and 4 are closed); (1,5), (2,4), (3,3) → 6;
(2,6) → 2 & 6; (5,6) → **choice** between 11 and 5 & 6; the other 20 ordered rolls → pass. An equivalent model puts a
chance node first and keeps the last roll in the state (the official solution accepts it as well).

**Question 3.** The function must return, for each chance outcome, the actions MAX can choose from and the outcome's
probability — here `{((2,),): 1, ((2,5),): 2, ((5,),): 4, ((6,),): 5, ((2,6),): 2, ((5,6),(11,)): 2, ((),): 20}` (/36).

> **Discrepancy with the official code.** The official `generate_next_level_data` loops over
> `itertools.combinations_with_replacement(die, 2)` (21 *unordered* rolls) and adds 1/36 to the sum action for every
> roll, but a non-double roll such as {1, 4} has probability **2/36**. Its printed output gives close 5 = 2/36,
> close 6 = 3/36, close 11 = 1/36 and pass = 23/36 ≈ 0.639, which contradicts its own tree (4/36, 5/36, 2/36,
> 20/36). It also keys the result by action, so the roll (5,6) is counted twice (once for 11, once for 5 & 6) and the
> fact that MAX gets a *choice* after that roll is lost. Iterate over the 36 ordered rolls (or weight non-doubles by 2).

The tree has chance nodes, so it would be searched with **expectiminimax**. But see the June 2022 question in the
game-modelling quiz: since a player's moves never change the opponent's options, Close-the-box does not really need
adversarial search.
"""

ENTRY = 'generate_next_level_data'


def _norm(d):
    """Accept any order inside the keys, and probabilities instead of counts."""
    if not isinstance(d, dict):
        return d
    total = sum(float(v) for v in d.values())
    scale = 36 if abs(total - 1) < 1e-6 else 1
    out = {}
    for k, v in d.items():
        key = tuple(sorted(tuple(sorted(a)) for a in k))
        out[key] = round(float(v) * scale, 6)
    return out


def _check(exp):
    def check(got, *args):
        g, e = _norm(got), _norm(exp)
        if g == e:
            return True
        if not isinstance(g, dict):
            return False, 'return a dict'
        diff = [k for k in set(g) | set(e) if g.get(k) != e.get(k)]
        return False, 'differences (got vs expected count): ' + '; '.join(f'{k}: {g.get(k)} vs {e.get(k)}' for k in sorted(diff, key=str))
    return check


_EXAM = {((2,),): 1, ((2, 5),): 2, ((5,),): 4, ((6,),): 5, ((2, 6),): 2, ((5, 6), (11,)): 2, ((),): 20}
_FULL = {((2,),): 1, ((2, 3), (5,)): 2, ((2, 4), (6,)): 2, ((2, 5), (7,)): 2, ((2, 6), (8,)): 2, ((3,),): 2,
         ((3, 4), (7,)): 2, ((3, 5), (8,)): 2, ((3, 6), (9,)): 2, ((4,),): 3, ((4, 5), (9,)): 2, ((4, 6), (10,)): 2,
         ((5,),): 2, ((5, 6), (11,)): 2, ((6,),): 3, ((7,),): 2, ((8,),): 1, ((10,),): 1, ((12,),): 1}
_P2 = {((),): 3, ((2,),): 1, ((2, 3), (5,)): 2, ((2, 5), (7,)): 2, ((2, 6), (8,)): 2, ((3,),): 2, ((3, 5), (8,)): 2,
       ((3, 6), (9,)): 2, ((5,),): 2, ((5, 6),): 2, ((6,),): 5, ((7,),): 4, ((8,),): 1, ((9,),): 2, ((10,),): 3,
       ((12,),): 1}

TESTS = [
    Test('exam state: open tiles 2, 5, 6, 11', args=([2, 5, 6, 11],), check=_check(_EXAM)),
    Test('statement example: 3, 4, 7', args=([3, 4, 7],),
         check=_check({((3,),): 2, ((4,),): 3, ((7,),): 4, ((3, 4), (7,)): 2, ((),): 25})),
    Test('player #2 of the first figure (4 and 11 closed): roll 6+3 closes 9 or 3 and 6',
         args=([2, 3, 5, 6, 7, 8, 9, 10, 12],), check=_check(_P2)),
    Test('all tiles open', args=(list(range(2, 13)),), check=_check(_FULL)),
    Test('doubles cannot close the same tile twice', args=([3, 5, 7],),
         check=_check({((3,),): 2, ((3, 5),): 2, ((5,),): 4, ((7,),): 6, ((),): 22})),
    Test('only tile 12 left', args=([12],), check=_check({((12,),): 1, ((),): 35})),
    Test('nothing open: always pass', args=([],), check=_check({((),): 36})),
]
