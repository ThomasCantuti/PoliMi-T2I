from harness import Test
from planning_lib import atoms, air_cargo, blocks_hand, Action

TITLE = 'Relevant, consistent, and the regression R[G, a]'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['backward planning', 'regression', 'relevant action', 'consistent action']

STATEMENT = r"""
Backward planning searches from the goal (AIMA §11.2.2). For a goal $G$ (a frozenset of positive ground
atoms) and a ground action $a$:

- $a$ is **relevant** iff it achieves at least one literal of $G$: $\textit{ADD}(a) \cap G \ne \emptyset$;
- $a$ is **consistent** iff it does not undo any literal of $G$: $\textit{DEL}(a) \cap G = \emptyset$;
- the **regression** of $G$ through $a$ is $R[G, a] = (G - \textit{ADD}(a)) \cup \textit{PRE}(a)$.

Implement `relevant(goal, a)`, `consistent(goal, a)`, `regress(goal, a)` and
`regressions(goal, actions)` → a dict `{action name: R[goal, a]}` with one entry for every action that is
relevant **and** consistent (in the order of `actions`).

Example (AIMA): $G$ = At(C1,JFK) ∧ At(C2,SFO). `Unload(C1,P1,JFK)` is relevant and consistent, and
$R[G, a]$ = At(C2,SFO) ∧ In(C1,P1) ∧ At(P1,JFK) ∧ Cargo(C1) ∧ Plane(P1) ∧ Airport(JFK).
"""

STARTER = '''from planning_lib import Action

def relevant(goal: frozenset, a: Action) -> bool:
    return False   # TODO

def consistent(goal: frozenset, a: Action) -> bool:
    return False   # TODO

def regress(goal: frozenset, a: Action) -> frozenset:
    return goal    # TODO

def regressions(goal: frozenset, actions: list[Action]) -> dict[str, frozenset]:
    return {}      # TODO
'''

SOLUTION = '''from planning_lib import Action

def relevant(goal: frozenset, a: Action) -> bool:
    return bool(a.add & goal)

def consistent(goal: frozenset, a: Action) -> bool:
    return not (a.delete & goal)

def regress(goal: frozenset, a: Action) -> frozenset:
    return (goal - a.add) | a.pre

def regressions(goal: frozenset, actions: list[Action]) -> dict[str, frozenset]:
    return {a.name: regress(goal, a) for a in actions if relevant(goal, a) and consistent(goal, a)}
'''

HINTS = [
    'Each definition is one set operation: intersection for relevant / consistent, difference and union for '
    'the regression.',
    'In the regression, remove what $a$ **adds** (it will be true after $a$ anyway) and require what $a$ '
    '**needs** (its whole precondition, static atoms included).',
]

EXPLANATION = r"""
**Reading the formula.** If a state $S$ satisfies $R[G, a]$, then $a$ is applicable in $S$ (PRE ⊆ R) and the
next state satisfies $G$: the literals added by $a$ become true, and the others ($G - \textit{ADD}$) were already
true and are not deleted, because $a$ is **consistent**. So $a$ can be the **last action** of a plan for $G$
(exam 8 Jul 2025: "regression of a goal $G$ through a relevant action $A$ is the less constraining goal
$R[G, A]$ such that, given a state $S$ that satisfies it, the preconditions of $A$ are satisfied in $S$ and the
application of $A$ reaches a state $S'$ that satisfies $G$").

**Why both checks?** An irrelevant action achieves nothing (regressing through it only adds requirements). An
inconsistent one destroys part of the goal: `Stack(A,B)` achieves On(A,B) but deletes Clear(B), so it can never
be the last action for On(A,B) ∧ Clear(B).

**Branching factor.** Only 4 of the 20 ground air-cargo actions are relevant and consistent for the goal, against
4 applicable ones forward in the initial state — but forward, deeper states have many more. With variables
(lifted regression) the 4 collapse to 2: `Unload(C1, p, JFK)` and `Unload(C2, p, SFO)`.

**With negative literals** (PDDL goals): $\textit{POS}(G') = (\textit{POS}(G) - \textit{ADD}) \cup
\textit{PRE}^+$, $\textit{NEG}(G') = (\textit{NEG}(G) - \textit{DEL}) \cup \textit{PRE}^-$, and an action is also
inconsistent if it adds an atom that $G$ requires to be false.
"""

ENTRY = 'regressions'

_CI, _CG, _CA = air_cargo()
_BI, _BG, _BA = blocks_hand()
_ACT = {a.name: a for a in _CA + _BA}
_TWO = [Action('MoveR', atoms('At(R1)'), atoms('At(R2)'), atoms('At(R1)')),
        Action('MoveL', atoms('At(R2)'), atoms('At(R1)'), atoms('At(R2)'))]
_ONTOP = atoms('On(A,B), Clear(B)')


def _one(fn, goal, name):
    return lambda sol: getattr(sol, fn)(goal, _ACT[name])


TESTS = [
    Test('relevant: Unload(C1,P1,JFK)', call=_one('relevant', _CG, 'Unload(C1,P1,JFK)'), expected=True,
         show='G = At(C1,JFK) ∧ At(C2,SFO)'),
    Test('not relevant: Fly(P1,SFO,JFK)', call=_one('relevant', _CG, 'Fly(P1,SFO,JFK)'), expected=False,
         show='G = At(C1,JFK) ∧ At(C2,SFO)'),
    Test('not consistent: Load(C2,P1,SFO) deletes At(C2,SFO)', call=_one('consistent', _CG, 'Load(C2,P1,SFO)'),
         expected=False, show='G = At(C1,JFK) ∧ At(C2,SFO)'),
    Test('relevant but not consistent: Stack(A,B)', call=lambda sol: (sol.relevant(_ONTOP, _ACT['Stack(A,B)']),
                                                                        sol.consistent(_ONTOP, _ACT['Stack(A,B)'])),
         expected=(True, False), show='(relevant, consistent) for G = On(A,B) ∧ Clear(B)'),
    Test('regress through Unload(C1,P1,JFK)', call=_one('regress', _CG, 'Unload(C1,P1,JFK)'),
         expected=atoms('At(C2,SFO), In(C1,P1), At(P1,JFK), Cargo(C1), Plane(P1), Airport(JFK)'),
         show='R[G, Unload(C1,P1,JFK)]'),
    Test('regress through Stack(B,C) (Sussman goal)', call=_one('regress', _BG, 'Stack(B,C)'),
         expected=atoms('On(A,B), Holding(B), Block(B), Block(C), Clear(C)'), show='G = On(A,B) ∧ On(B,C)'),
    Test('two rooms: one regression', args=(atoms('At(R2)'), _TWO), expected={'MoveR': atoms('At(R1)')},
         show='MoveR: P At(R1), E ¬At(R1) ∧ At(R2);  MoveL symmetric;  G = At(R2)'),
    Test('air cargo: all regressions of the goal', args=(_CG, _CA),
         expected={'Unload(C1,P1,JFK)': atoms('At(C2,SFO), In(C1,P1), At(P1,JFK), Cargo(C1), Plane(P1), Airport(JFK)'),
                   'Unload(C1,P2,JFK)': atoms('At(C2,SFO), In(C1,P2), At(P2,JFK), Cargo(C1), Plane(P2), Airport(JFK)'),
                   'Unload(C2,P1,SFO)': atoms('At(C1,JFK), In(C2,P1), At(P1,SFO), Cargo(C2), Plane(P1), Airport(SFO)'),
                   'Unload(C2,P2,SFO)': atoms('At(C1,JFK), In(C2,P2), At(P2,SFO), Cargo(C2), Plane(P2), Airport(SFO)')},
         show='20 type-correct ground actions'),
    Test('Sussman goal: the two Stack actions', args=(_BG, _BA),
         expected={'Stack(A,B)': atoms('On(B,C), Holding(A), Block(A), Block(B), Clear(B)'),
                   'Stack(B,C)': atoms('On(A,B), Holding(B), Block(B), Block(C), Clear(C)')},
         show='G = On(A,B) ∧ On(B,C), course blocks world'),
]
