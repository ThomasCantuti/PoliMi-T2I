import itertools
from collections import deque

from harness import Test
from planning_lib import Schema, atoms, ground, ground_all, possible, applicable, result, forward_bfs, split_atom

TITLE = 'Exam · Write the action schemas (2023–2026)'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['exam', 'modeling', 'PDDL', 'STRIPS', 'action schema', 'Feb 2023', 'Jul 2023', 'Jan 2024', 'Jun 2024', 'Feb 2026']

STATEMENT = r"""
*Written exams of 9 February 2023, 10 July 2023, 18 January 2024, 20 June 2024 and 6 February 2026 — Planning
(8 points), the modeling questions.* Write each answer as `Schema(signature, pre, eff)` objects (`planning_lib`
syntax: literals separated by commas, `¬` for negation, `x≠y` for inequality). The tests ground your schemas
and check their **behavior** (applicable actions, invariants, plans), so any correct formulation passes.

**1. Wumpus world (9 Feb 2023, PDDL, ≠ allowed).** Constants Agent, Wumpus, Pit, Gold, … and cells 11 … 44
(column, row); predicates At(who, cell), Adj(cell, cell), Alive. Initial state: At(Agent,11), At(Wumpus,13),
At(Gold,23), At(Pit,31), At(Pit,33), At(Pit,44), Adj for every pair of orthogonally adjacent cells (both
directions), Alive. Goal At(Agent,x), At(Gold,x), Alive. Complete `Move(c1,c2)`,
`MoveToWumpusCell(c1,c2)`, `MoveToPitCell(c1,c2)`: a move of the agent to an adjacent cell that is free, has the
Wumpus, has a pit. The three schemas must be **mutually exclusive** (for each c1, c2 at most one is applicable)
and the agent **dies** entering a Wumpus or pit cell. (The Wumpus and the pits are never in the same cell.)

**2. Baskets (18 Jan 2024, STRIPS: no negative preconditions).** Constants Ba1, Ba2 (balls), Bk1, Bk2
(baskets); predicates Ball, Basket, In(ball, basket), At(basket) (the robot is at that basket), Handfree,
Holding(ball). Initial state Ball(Ba1), Ball(Ba2), Basket(Bk1), Basket(Bk2), Handfree, In(Ba1,Bk1),
In(Ba2,Bk1), At(Bk1); goal In(Ba1,Bk2), In(Ba2,Bk2). The given schemas are wrong — write correct
`PickUp(b,k)`, `Drop(b,k)`, `Move(k1,k2)`:

```text
PickUp(b,k)   P: Ball(b), Basket(k), At(k), In(b,k), Handfree     E: ¬Handfree, Holding(b)
Drop(b,k)     P: Ball(b), Basket(k), At(k), Holding(b)            E: ¬Holding(b), Handfree, In(b,k)
Move(k1,k2)   P: Basket(k1), Basket(k2), At(k1), Handfree         E: ¬At(k1), At(k2)
```

**3. Tower of Hanoi (20 Jun 2024, PDDL).** Discs d1 (largest) … d4 (smallest), pegs peg1, peg2, peg3; predicates
clear(x), on(x,y), smaller(x,y); smaller(d,peg) holds for every disc and peg ("a disc can go as the first disc
on any peg"); initially on(d4,d3), on(d3,d2), on(d2,d1), on(d1,peg1), clear(d4), clear(peg2), clear(peg3).
Write the **single** schema `Move(x,y,z)` (move disc x from y to z, where y and z are discs or pegs).

**4. Mars rover (6 Feb 2026, STRIPS).** The PDDL schema uses ≥ and −:

```text
Move(x,y,z)   P: Location(x), Location(y), Connected(x,y), At(x), Fuel(z), z ≥ 2
              E: ¬At(x), At(y), ¬Fuel(z), Fuel(z − 2)
```

with fuel constants 0 … 5. Write the equivalent STRIPS schemas **without ≥ and −**: `Move-Fuel2(x,y)`,
`Move-Fuel3(x,y)`, `Move-Fuel4(x,y)`, `Move-Fuel5(x,y)` (constants such as `Fuel(3)` may appear in the literals).

**5. Swap (10 Jul 2023).** Course blocks world (Unstack/Stack/Pickup/Putdown with Handempty, Holding, Clear,
On, Block, TABLE). Write `Swap(x,y,z)`: reverses the top two blocks of a stack — if x is on y, y is on z and x is
clear, afterwards y is on x, x is on z, and y is clear. The hand must be empty.
"""

STARTER = '''from planning_lib import Schema

WUMPUS = [
    Schema('Move(c1,c2)', pre='', eff=''),
    Schema('MoveToWumpusCell(c1,c2)', pre='', eff=''),
    Schema('MoveToPitCell(c1,c2)', pre='', eff=''),
]

BASKETS = [
    Schema('PickUp(b,k)', pre='Ball(b), Basket(k), At(k), In(b,k), Handfree', eff='¬Handfree, Holding(b)'),
    Schema('Drop(b,k)', pre='Ball(b), Basket(k), At(k), Holding(b)', eff='¬Holding(b), Handfree, In(b,k)'),
    Schema('Move(k1,k2)', pre='Basket(k1), Basket(k2), At(k1), Handfree', eff='¬At(k1), At(k2)'),
]

HANOI = Schema('Move(x,y,z)', pre='', eff='')

MARS = [
    Schema('Move-Fuel2(x,y)', pre='', eff=''),
    Schema('Move-Fuel3(x,y)', pre='', eff=''),
    Schema('Move-Fuel4(x,y)', pre='', eff=''),
    Schema('Move-Fuel5(x,y)', pre='', eff=''),
]

SWAP = Schema('Swap(x,y,z)', pre='', eff='')
'''

SOLUTION = '''from planning_lib import Schema

WUMPUS = [
    Schema('Move(c1,c2)', pre='Alive, At(Agent,c1), Adj(c1,c2), ¬At(Pit,c2), ¬At(Wumpus,c2), c1≠c2',
           eff='¬At(Agent,c1), At(Agent,c2)'),
    Schema('MoveToWumpusCell(c1,c2)', pre='Alive, At(Agent,c1), Adj(c1,c2), ¬At(Pit,c2), At(Wumpus,c2), c1≠c2',
           eff='¬At(Agent,c1), At(Agent,c2), ¬Alive'),
    Schema('MoveToPitCell(c1,c2)', pre='Alive, At(Agent,c1), Adj(c1,c2), At(Pit,c2), ¬At(Wumpus,c2), c1≠c2',
           eff='¬At(Agent,c1), At(Agent,c2), ¬Alive'),
]

BASKETS = [
    Schema('PickUp(b,k)', pre='Ball(b), Basket(k), At(k), In(b,k), Handfree', eff='¬In(b,k), ¬Handfree, Holding(b)'),
    Schema('Drop(b,k)', pre='Ball(b), Basket(k), At(k), Holding(b)', eff='¬Holding(b), Handfree, In(b,k)'),
    Schema('Move(k1,k2)', pre='Basket(k1), Basket(k2), At(k1)', eff='¬At(k1), At(k2)'),
]

HANOI = Schema('Move(x,y,z)', pre='on(x,y), clear(x), clear(z), smaller(x,z)',
               eff='¬on(x,y), clear(y), on(x,z), ¬clear(z)')

MARS = [
    Schema('Move-Fuel2(x,y)', pre='Location(x), Location(y), Connected(x,y), At(x), Fuel(2)',
           eff='¬At(x), At(y), ¬Fuel(2), Fuel(0)'),
    Schema('Move-Fuel3(x,y)', pre='Location(x), Location(y), Connected(x,y), At(x), Fuel(3)',
           eff='¬At(x), At(y), ¬Fuel(3), Fuel(1)'),
    Schema('Move-Fuel4(x,y)', pre='Location(x), Location(y), Connected(x,y), At(x), Fuel(4)',
           eff='¬At(x), At(y), ¬Fuel(4), Fuel(2)'),
    Schema('Move-Fuel5(x,y)', pre='Location(x), Location(y), Connected(x,y), At(x), Fuel(5)',
           eff='¬At(x), At(y), ¬Fuel(5), Fuel(3)'),
]

SWAP = Schema('Swap(x,y,z)', pre='Handempty, On(x,y), On(y,z), Clear(x)',
              eff='¬On(x,y), ¬On(y,z), ¬Clear(x), On(y,x), On(x,z), Clear(y)')
'''

HINTS = [
    'Wumpus: the three schemas share Alive, At(Agent,c1), Adj(c1,c2), c1≠c2; they differ on the two literals about '
    'c2 — (¬Pit, ¬Wumpus), (¬Pit, Wumpus), (Pit, ¬Wumpus) — which makes them mutually exclusive. Dying = ¬Alive '
    'in the effect.',
    'Baskets: a ball that is picked up must leave the basket (¬In(b,k)), and the robot must be able to move while '
    'holding a ball (drop Handfree from Move).',
    'Hanoi: x must be on y and clear, the destination z must be clear and **larger** than x (smaller(x,z)); after '
    'the move y becomes clear and z is no longer clear. Pegs are covered because smaller(d, peg) is always true.',
    'Mars: one schema per fuel level z = 2, 3, 4, 5, with the constants Fuel(z) and Fuel(z − 2) written out.',
    'Swap: delete On(x,y), On(y,z), Clear(x); add On(y,x), On(x,z), Clear(y). Typing atoms are not needed: On '
    'already says that x and y are blocks.',
]

EXPLANATION = r"""
**Wumpus (official answer).** Common part `Alive, At(Agent,c1), Adj(c1,c2), c1 ≠ c2`, plus
`¬At(Pit,c2), ¬At(Wumpus,c2)` (Move), `¬At(Pit,c2), At(Wumpus,c2)` (MoveToWumpusCell),
`At(Pit,c2), ¬At(Wumpus,c2)` (MoveToPitCell); the last two also have `¬Alive` in the effect. Mutual exclusivity
comes from the two c2 literals, not from the effects. Negative preconditions make this a **PDDL** model. From
the initial state only Move(11,12) and Move(11,21) are applicable.

**Baskets (official answer).** Add `¬In(b,k)` to PickUp ("otherwise a ball will be both held by the robot and in
a basket") and remove `Handfree` from Move ("otherwise the robot cannot move a ball from one basket to another").
With the original schemas there is **no plan** at all. The shortest plan has 7 actions.

**Hanoi (official answer).** `Move(x,y,z)  P: on(x,y), clear(x), clear(z), smaller(x,z)  E: ¬on(x,y), clear(y),
on(x,z), ¬clear(z)` — it works whether z is a disc or a peg, thanks to the facts smaller(d, peg) and on(d1, peg1)
(the bottom disc is "on" the peg). Only on() and clear() are fluents; from the initial state Move(d4,d3,peg2)
and Move(d4,d3,peg3) are applicable; BFS finds the optimal $2^4 - 1 = 15$ moves.

**Mars (official answer).** One schema per fuel level, `Move-Fuel3(x,y)  P: Location(x), Location(y),
Connected(x,y), At(x), Fuel(3)  E: ¬At(x), At(y), ¬Fuel(3), Fuel(1)`, and so on. The ground actions are exactly
those of the PDDL schema with $z \in \{2, 3, 4, 5\}$, so the two formulations have the same state space and the
same branching factor (exam Question 3: at most 3 successors, e.g. at L3 move to L2, move to L4, or recharge).

**Swap (official answer).** `P: Handempty, On(x,y), On(y,z), Clear(x)  D: On(x,y), On(y,z), Clear(x)
A: On(y,x), On(x,z), Clear(y)` — "minimal" means no redundant typing atoms. It also works with z = TABLE.
"""

ENTRY = 'WUMPUS'

# ------------------------------------------------------------------ Wumpus
_CELLS = ['{}{}'.format(x, y) for x in range(1, 5) for y in range(1, 5)]
_ADJ = {f'Adj({a},{b})' for a in _CELLS for b in _CELLS
        if abs(int(a[0]) - int(b[0])) + abs(int(a[1]) - int(b[1])) == 1}
_WORLD = frozenset(_ADJ) | atoms('At(Wumpus,13), At(Gold,23), At(Pit,31), At(Pit,33), At(Pit,44)')
_WI = _WORLD | atoms('At(Agent,11), Alive')
_WG = atoms('At(Agent,23), At(Gold,23), Alive')
_WNAMES = ['Move(c1,c2)', 'MoveToWumpusCell(c1,c2)', 'MoveToPitCell(c1,c2)']


def _sig(schemas, names):
    got = [getattr(s, 'signature', None) for s in schemas]
    return got == names, f'signatures must be {names}, got {got}'


def _wumpus_exclusive(sol):
    ok, msg = _sig(sol.WUMPUS, _WNAMES)
    if not ok:
        return ok, msg
    groups = [{split_atom(a.name)[1]: a for a in ground(s, _CELLS)} for s in sol.WUMPUS]
    for c in _CELLS:
        s = _WORLD | {f'At(Agent,{c})', 'Alive'}
        for pair in itertools.product(_CELLS, repeat=2):
            on = [g[pair].name for g in groups if pair in g and applicable(s, g[pair])]
            if len(on) > 1:
                return False, f'agent in {c}: {on} are all applicable'
    return True, 'at most one of the three is applicable, for every agent cell and every (c1, c2)'


def _wumpus_kinds(sol):
    acts = {a.name: a for a in ground_all(sol.WUMPUS, _CELLS)}
    s12 = _WORLD | atoms('At(Agent,12), Alive')
    s21 = _WORLD | atoms('At(Agent,21), Alive')
    checks = [(s12, 'MoveToWumpusCell(12,13)', True), (s12, 'Move(12,13)', False), (s12, 'Move(12,22)', True),
              (s21, 'MoveToPitCell(21,31)', True), (s21, 'Move(21,31)', False), (s21, 'MoveToWumpusCell(21,31)', False),
              (s12, 'Move(12,14)', False), (s12, 'Move(12,12)', False)]
    for s, name, want in checks:
        if (name in acts and applicable(s, acts[name])) != want:
            where = 'agent in ' + next(a[9:11] for a in s if a.startswith('At(Agent'))
            return False, f'{where}: {name} should {"" if want else "not "}be applicable'
    for name in ('MoveToWumpusCell(12,13)', 'MoveToPitCell(21,31)'):
        s = s12 if '12,' in name else s21
        s1 = result(s, acts[name])
        if 'Alive' in s1 or f'At(Agent,{name[-3:-1]})' not in s1:
            return False, f'after {name} the agent must be in {name[-3:-1]} and dead'
        if any(applicable(s1, a) for a in acts.values()):
            return False, f'after {name} (dead agent) no move may be applicable'
    return True


# ------------------------------------------------------------------ Baskets
_BI = atoms('Ball(Ba1), Ball(Ba2), Basket(Bk1), Basket(Bk2), Handfree, In(Ba1,Bk1), In(Ba2,Bk1), At(Bk1)')
_BG = atoms('In(Ba1,Bk2), In(Ba2,Bk2)')


def _reachable(init, acts, limit=20000):
    seen, q = {init}, deque([init])
    while q and len(seen) < limit:
        s = q.popleft()
        for a in acts:
            if applicable(s, a):
                s1 = result(s, a)
                if s1 not in seen:
                    seen.add(s1)
                    q.append(s1)
    return seen


def _baskets(sol):
    ok, msg = _sig(sol.BASKETS, ['PickUp(b,k)', 'Drop(b,k)', 'Move(k1,k2)'])
    if not ok:
        return ok, msg
    if any(lit.startswith('¬') for s in sol.BASKETS for lit in s.pre):
        return False, 'STRIPS: no negative preconditions'
    acts = possible(ground_all(sol.BASKETS, ['Ba1', 'Ba2', 'Bk1', 'Bk2']), _BI)
    for s in _reachable(_BI, acts):
        held = [b for b in ('Ba1', 'Ba2') if f'Holding({b})' in s]
        if len(held) > 1:
            return False, f'reachable state holding two balls: {sorted(s - _BI)}'
        for b in held:
            if any(f'In({b},{k})' in s for k in ('Bk1', 'Bk2')):
                return False, f'{b} is both held and in a basket: {sorted(s)}'
        if ('Handfree' in s) == bool(held):
            return False, f'Handfree must be true exactly when no ball is held: {sorted(s)}'
        if sum(f'At({k})' in s for k in ('Bk1', 'Bk2')) != 1:
            return False, f'the robot must be at exactly one basket: {sorted(s)}'
    plan = forward_bfs(_BI, _BG, acts)
    if plan is None or len(plan) != 7:
        return False, f'expected a shortest plan of 7 actions, BFS found {plan}'
    return True, 'invariants hold in every reachable state; shortest plan: ' + ', '.join(plan)


# ------------------------------------------------------------------ Hanoi
_DISCS, _PEGS = ['d1', 'd2', 'd3', 'd4'], ['peg1', 'peg2', 'peg3']
_SMALLER = {f'smaller({a},{b})' for i, a in enumerate(_DISCS) for b in _DISCS[:i]} | \
           {f'smaller({d},{p})' for d in _DISCS for p in _PEGS}
_HI = frozenset(_SMALLER) | atoms('on(d4,d3), on(d3,d2), on(d2,d1), on(d1,peg1), clear(d4), clear(peg2), clear(peg3)')
_HG = atoms('on(d1,peg3), on(d2,d1), on(d3,d2), on(d4,d3)')


def _hanoi_applicable(sol):
    acts = ground(sol.HANOI, _DISCS + _PEGS)
    return sorted(a.name for a in acts if applicable(_HI, a))


def _hanoi(sol):
    if getattr(sol.HANOI, 'signature', None) != 'Move(x,y,z)':
        return False, 'the schema must be Move(x,y,z)'
    acts = possible(ground(sol.HANOI, _DISCS + _PEGS), _HI)
    for s in _reachable(_HI, acts):
        for d in _DISCS:
            under = [y for y in _DISCS + _PEGS if f'on({d},{y})' in s]
            if len(under) != 1:
                return False, f'{d} is on {under}'
            if under[0] in _DISCS and f'smaller({d},{under[0]})' not in s:
                return False, f'{d} sits on the smaller disc {under[0]}'
        for x in _DISCS + _PEGS:
            covered = any(f'on({d},{x})' in s for d in _DISCS)
            if covered == (f'clear({x})' in s):
                return False, f'clear({x}) is wrong in a reachable state'
    plan = forward_bfs(_HI, _HG, acts)
    if plan is None or len(plan) != 15:
        return False, f'expected the optimal 15-move plan, BFS found {None if plan is None else len(plan)} moves'
    return True, '81 reachable states, all legal; 15 moves'


# ------------------------------------------------------------------ Mars
_LOCS = ['L1', 'L2', 'L3', 'L4', 'L5']
_CONN = [('L1', 'L2'), ('L2', 'L3'), ('L2', 'L4'), ('L3', 'L4'), ('L4', 'L5')]
_MI = frozenset({f'Connected({a},{b})' for a, b in _CONN} | {f'Connected({b},{a})' for a, b in _CONN} |
                {f'Location({l})' for l in _LOCS} | {'Recharge(L3)', 'At(L1)', 'Fuel(5)'})


_RECHARGE = [a for z in range(6) for a in ground(
    Schema(f'Recharging(x,{z})', f'Location(x), Recharge(x), At(x), Fuel({z})', f'¬Fuel({z}), Fuel(5)'), {'x': _LOCS})]
_PDDL_MOVES = [a for z in range(2, 6) for a in ground(
    Schema(f'Move(x,y,{z})', f'Location(x), Location(y), Connected(x,y), At(x), Fuel({z})',
           f'¬At(x), At(y), ¬Fuel({z}), Fuel({z - 2})'), {'x': _LOCS, 'y': _LOCS})]


def _edges(init, acts):
    out = set()
    for s in _reachable(init, acts):
        for a in acts:
            if applicable(s, a):
                out.add((s, result(s, a)))
    return out


def _mars(sol):
    ok, msg = _sig(sol.MARS, ['Move-Fuel2(x,y)', 'Move-Fuel3(x,y)', 'Move-Fuel4(x,y)', 'Move-Fuel5(x,y)'])
    if not ok:
        return ok, msg
    if any('≥' in lit or '>' in lit or '−' in lit or '-' in lit.split('(')[-1] for s in sol.MARS for lit in s.pre + s.eff):
        return False, 'STRIPS: no ≥ and no arithmetic'
    mine = possible(ground_all(sol.MARS, _LOCS) + _RECHARGE, _MI)
    ref = possible(_PDDL_MOVES + _RECHARGE, _MI)
    if _edges(_MI, mine) != _edges(_MI, ref):
        return False, 'your schemas (plus Recharging) do not produce the same transitions as the PDDL Move'
    plan = forward_bfs(_MI, atoms('At(L5)'), mine)
    return (plan is not None and len(plan) == 5), f'shortest plan to L5: {plan}'


# ------------------------------------------------------------------ Swap
_SW = atoms('Block(A), Block(B), Block(C), On(A,B), On(B,C), On(C,TABLE), Clear(A), Handempty')


def _swap(sol, state, binding, want):
    if getattr(sol.SWAP, 'signature', None) != 'Swap(x,y,z)':
        return None
    acts = {a.name: a for a in ground(sol.SWAP, ['A', 'B', 'C', 'TABLE'])}
    a = acts[binding]
    if want is None:
        return applicable(state, a)
    return applicable(state, a) and result(state, a)


TESTS = [
    Test('Wumpus: applicable actions in the initial state', call=lambda sol: sorted(a.name for a in ground_all(sol.WUMPUS, _CELLS)
                                                                              if applicable(_WI, a)),
         expected=['Move(11,12)', 'Move(11,21)'], show='agent in 11, Wumpus in 13, pits in 31, 33, 44'),
    Test('Wumpus: the three schemas are mutually exclusive', call=_wumpus_exclusive, check=lambda got: got,
         show='every agent cell, every (c1, c2)'),
    Test('Wumpus: free / Wumpus / pit cells, and death', call=_wumpus_kinds, check=lambda got: got,
         show='agent in 12 (next to the Wumpus) and in 21 (next to a pit)'),
    Test('Wumpus: shortest plan to the gold', call=lambda sol: len(forward_bfs(_WI, _WG, possible(ground_all(sol.WUMPUS, _CELLS), _WI)) or []),
         expected=3, show='goal At(Agent,23), At(Gold,23), Alive'),
    Test('Baskets (18 Jan 2024): fixed STRIPS schemas', call=_baskets, check=lambda got: got,
         show='invariants on every reachable state + a 7-action plan'),
    Test('Hanoi (20 Jun 2024): applicable actions in the initial state', call=_hanoi_applicable,
         expected=['Move(d4,d3,peg2)', 'Move(d4,d3,peg3)'], show='4 discs on peg1'),
    Test('Hanoi: only legal states, optimal plan', call=_hanoi, check=lambda got: got, show='4 discs to peg3'),
    Test('Mars (6 Feb 2026): STRIPS schemas equivalent to the PDDL Move', call=_mars, check=lambda got: got,
         show='same reachable transitions, plan to L5 of 5 actions'),
    Test('Swap (10 Jul 2023): A on B on C', call=lambda sol: _swap(sol, _SW, 'Swap(A,B,C)', True),
         expected=atoms('Block(A), Block(B), Block(C), On(B,A), On(A,C), On(C,TABLE), Clear(B), Handempty'),
         show='Swap(A,B,C): B on A, A on C, B clear'),
    Test('Swap on the table', call=lambda sol: _swap(sol, atoms('Block(A), Block(B), On(A,B), On(B,TABLE), Clear(A), Handempty'),
                                                     'Swap(A,B,TABLE)', True),
         expected=atoms('Block(A), Block(B), On(B,A), On(A,TABLE), Clear(B), Handempty'), show='Swap(A,B,TABLE)'),
    Test('Swap needs the empty hand', call=lambda sol: _swap(sol, (_SW - {'Handempty'}) | {'Holding(D)'}, 'Swap(A,B,C)', None),
         expected=False, show='holding another block'),
    Test('Swap needs x clear', call=lambda sol: _swap(sol, _SW, 'Swap(B,C,TABLE)', None),
         expected=False, show='Swap(B,C,TABLE) while A is on B'),
]
