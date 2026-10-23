from harness import Test
from planning_lib import Action, atoms, air_cargo, spare_tire, blocks_hand, Schema, ground

TITLE = 'Applicable actions and RESULT(s, a)'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['STRIPS', 'PDDL', 'closed-world assumption', 'applicable', 'result', 'delete list']

STATEMENT = r"""
A **state** is a frozenset of the ground atoms that are true; every other atom is false (**closed-world
assumption**, AIMA §11.1). A ground action `a` (`Action(name, pre, add, delete, neg)`) is **applicable** in
`s` iff every positive precondition is in `s` and no negative precondition (`a.neg`, PDDL only) is in `s`. Then

$$\textit{RESULT}(s, a) = (s - \textit{DEL}(a)) \cup \textit{ADD}(a).$$

Implement:

1. `applicable(s, a)` → `bool`;
2. `result(s, a)` → the new state (a `frozenset`; do not modify `s`);
3. `applicable_actions(s, actions)` → the names of the applicable actions, in the order of `actions`.

The tests use the textbook domains (air cargo, spare tire) and the course blocks world, and one ground action
whose effect adds and deletes **the same atom** (`Move(B1,T1,T1)` of exam 16 Jan 2025, where nothing forbids
$y = z$): the formula above decides what happens.
"""

STARTER = '''from planning_lib import Action

def applicable(s: frozenset, a: Action) -> bool:
    # TODO
    return False

def result(s: frozenset, a: Action) -> frozenset:
    # TODO
    return s

def applicable_actions(s: frozenset, actions: list[Action]) -> list[str]:
    # TODO
    return []
'''

SOLUTION = '''from planning_lib import Action

def applicable(s: frozenset, a: Action) -> bool:
    return a.pre <= s and not (a.neg & s)

def result(s: frozenset, a: Action) -> frozenset:
    return (s - a.delete) | a.add

def applicable_actions(s: frozenset, actions: list[Action]) -> list[str]:
    return [a.name for a in actions if applicable(s, a)]
'''

HINTS = [
    'Sets do the work: `a.pre <= s` is "every precondition holds", `a.neg & s` is the set of negative '
    'preconditions that are (wrongly) true.',
    'RESULT removes the delete list **first** and then adds the add list: `(s - a.delete) | a.add`. '
    'The other order loses an atom that the action both deletes and adds.',
]

EXPLANATION = r"""
**Closed world.** A state lists only true atoms, so "is `¬At(Flat,Axle)` satisfied?" means "is `At(Flat,Axle)`
missing from the set?". This is why STRIPS states never contain negative literals.

**Frame problem for free.** Everything not in ADD or DEL is copied unchanged: `Fly(P1,SFO,JFK)` does not touch
`At(C2,JFK)`. In SATPlan this "nothing else changes" must instead be written explicitly, with the fluent
(successor-state) axioms.

**Delete first, then add.** AIMA defines $\textit{RESULT}(s,a) = (s - \textit{DEL}(a)) \cup \textit{ADD}(a)$.
With `Move(B1,T1,T1)` (exam 16 Jan 2025, $y = z$ allowed) the effect is `At(B1,T1) ∧ ¬At(B1,T1)`: by the formula
the box simply stays on T1. Writing $(s \cup \textit{ADD}) - \textit{DEL}$ would make the box vanish. The SATPlan
fluent axiom of that exam is consistent with the AIMA order: `Move(B1,T1,T1)` appears among the actions that make
`At(B1,T1)` true.

**Applicable ≠ useful.** In the initial air-cargo state four ground actions are applicable; two of them
(`Fly`) are useless for the moment. Forward search must consider them all: its branching factor is the number
of applicable ground actions.
"""

ENTRY = 'applicable_actions'

_CI, _CG, _CA = air_cargo()
_TI, _TG, _TA = spare_tire()
_BI, _BG, _BA = blocks_hand()
_ACT = {a.name: a for a in _CA + _TA + _BA}
_MOVE = ground(Schema('Move(x,y,z)', 'Box(x), Table(y), Table(z), At(x,y)', 'At(x,z), ¬At(x,y)'),
               {'x': ['B1'], 'y': ['T1'], 'z': ['T1', 'T2']})
_BOX0 = atoms('Box(B1), Table(T1), Table(T2), At(B1,T1)')
_AFTER_REMOVE = atoms('Tire(Flat), Tire(Spare), At(Flat,Ground), At(Spare,Trunk)')
_AFTER_BOTH = atoms('Tire(Flat), Tire(Spare), At(Flat,Ground), At(Spare,Ground)')


def _app(name, s):
    return lambda sol: sol.applicable(s, _ACT[name])


def _res(name, s):
    return lambda sol: sol.result(s, _ACT[name])


TESTS = [
    Test('Load(C1,P1,SFO) is applicable', call=_app('Load(C1,P1,SFO)', _CI), expected=True,
         show='air cargo, initial state'),
    Test('Load(C1,P2,SFO) is not (P2 is at JFK)', call=_app('Load(C1,P2,SFO)', _CI), expected=False,
         show='air cargo, initial state'),
    Test('negative precondition: PutOn needs ¬At(Flat,Axle)', call=_app('PutOn(Spare,Axle)', _AFTER_BOTH | atoms('At(Flat,Axle)')),
         expected=False, show='spare tire: Spare on the ground, Flat still on the axle'),
    Test('negative precondition satisfied by absence (CWA)', call=_app('PutOn(Spare,Axle)', _AFTER_BOTH),
         expected=True, show='spare tire: both tires on the ground'),
    Test('result of Load(C1,P1,SFO)', call=_res('Load(C1,P1,SFO)', _CI),
         expected=(_CI - {'At(C1,SFO)'}) | {'In(C1,P1)'}, show='At(C1,SFO) deleted, In(C1,P1) added, the rest copied'),
    Test('result of Remove(Flat,Axle)', call=_res('Remove(Flat,Axle)', _TI), expected=_AFTER_REMOVE,
         show='spare tire, initial state'),
    Test('result of Unstack(C,A)', call=_res('Unstack(C,A)', _BI),
         expected=(_BI - atoms('Handempty, Clear(C), On(C,A)')) | atoms('Holding(C), Clear(A)'),
         show='Sussman anomaly, initial state'),
    Test('the state passed in is not modified', call=lambda sol: (sol.result(_CI, _ACT['Fly(P1,SFO,JFK)']), _CI)[1],
         expected=_CI, show='result(s, a) must build a new set'),
    Test('delete first, then add: Move(B1,T1,T1) (exam 16 Jan 2025)', call=lambda sol: sol.result(_BOX0, _MOVE[0]),
         expected=_BOX0, show='effect At(B1,T1) ∧ ¬At(B1,T1): the box stays on T1'),
    Test('applicable actions, air cargo initial state', args=(_CI, _CA),
         expected=['Load(C1,P1,SFO)', 'Load(C2,P2,JFK)', 'Fly(P1,SFO,JFK)', 'Fly(P2,JFK,SFO)'],
         show='the 20 type-correct ground actions of AIMA Fig. 11.1'),
    Test('applicable actions, spare tire initial state', args=(_TI, _TA),
         expected=['Remove(Flat,Axle)', 'Remove(Spare,Trunk)', 'LeaveOvernight'], show='AIMA Fig. 11.2'),
    Test('applicable actions, Sussman anomaly', args=(_BI, _BA), expected=['Unstack(C,A)', 'Pickup(B)'],
         show='C on A, A and B on the table, hand empty'),
]
