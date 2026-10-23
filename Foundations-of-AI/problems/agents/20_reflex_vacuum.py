from harness import Test

TITLE = 'Simple reflex vacuum agent'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['simple reflex agent', 'condition-action rules', 'vacuum world']

STATEMENT = r"""
The **two-square vacuum world** (AIMA Fig. 2.2, slides p. 32): squares `A` (left) and `B` (right),
each `'Clean'` or `'Dirty'`. The agent perceives **only its own square**:

```text
percept = (location, status)      e.g. ('A', 'Dirty')
actions:  'Suck', 'Left', 'Right'
```

Implement the **simple reflex agent** of AIMA Fig. 2.8 (slides p. 33) as condition–action rules:

```text
function REFLEX-VACUUM-AGENT([location, status]) returns an action
    if status = Dirty then return Suck
    else if location = A then return Right
    else if location = B then return Left
```

**Example:** `reflex_vacuum_agent(('B', 'Clean'))` → `'Left'`
"""

STARTER = '''def reflex_vacuum_agent(percept: tuple[str, str]) -> str:
    location, status = percept
    # TODO: condition-action rules (dirty first!)
    return None
'''

SOLUTION = '''def reflex_vacuum_agent(percept: tuple[str, str]) -> str:
    location, status = percept
    if status == 'Dirty':
        return 'Suck'
    elif location == 'A':
        return 'Right'
    elif location == 'B':
        return 'Left'
'''

HINTS = [
    'The action depends **only on the current percept**: no variables survive between calls.',
    'Unpack the percept: `location, status = percept`, then check the rules in order.',
    'First rule: if the square is dirty, clean it. Otherwise move towards the other square.',
]

EXPLANATION = r"""
A simple reflex agent maps the **current percept** straight to an action through condition–action rules
(`state ← INTERPRET-INPUT(percept); rule ← RULE-MATCH(state, rules)`, slides p. 37–39).
The whole agent function fits in 4 table rows instead of a table indexed by percept *sequences*.

Its weakness is the lack of memory: once both squares are clean it keeps going
**back and forth** forever (look at the last test), wasting energy if moving has a cost.
It is rational only if the performance measure does not penalize movement. Remembering what it already
knows about the world is exactly what a **model-based reflex agent** adds.
"""

ENTRY = 'reflex_vacuum_agent'


def _run(agent, dirt, location, steps):
    """Tiny two-square world: returns the list of actions the agent takes."""
    dirt, actions = dict(dirt), []
    for _ in range(steps):
        action = agent((location, dirt[location]))
        actions.append(action)
        if action == 'Suck':
            dirt[location] = 'Clean'
        elif action in ('Left', 'Right'):
            location = 'A' if action == 'Left' else 'B'
    return actions


def _behavior(got, *args):
    expected = ['Suck', 'Right', 'Suck', 'Left', 'Right', 'Left']
    if got == expected:
        return True, 'Both squares are clean after 3 steps, yet the agent keeps moving: no memory!'
    return False, f'expected {expected}'


TESTS = [
    Test('dirty square in A', args=(('A', 'Dirty'),), expected='Suck'),
    Test('dirty square in B', args=(('B', 'Dirty'),), expected='Suck'),
    Test('clean square in A → go right', args=(('A', 'Clean'),), expected='Right'),
    Test('clean square in B → go left', args=(('B', 'Clean'),), expected='Left'),
    Test('6 steps in the world (A and B dirty, start in A)',
         call=lambda sol: _run(sol.reflex_vacuum_agent, {'A': 'Dirty', 'B': 'Dirty'}, 'A', 6),
         check=_behavior, show="run 6 steps from A with {'A': 'Dirty', 'B': 'Dirty'}"),
]
