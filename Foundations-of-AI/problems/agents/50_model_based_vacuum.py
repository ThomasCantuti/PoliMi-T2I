from harness import Test

TITLE = 'Model-based reflex vacuum agent'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['model-based reflex agent', 'internal state', 'transition model', 'vacuum world']

STATEMENT = r"""
The simple reflex agent wanders forever because it **forgets**. A **model-based reflex agent**
(AIMA Fig. 2.12, slides p. 43–44) keeps an internal **state**: its best guess of what the world is like.

```text
function MODEL-BASED-REFLEX-AGENT(percept) returns an action
    persistent: state, transition_model, sensor_model, rules, action
    state ← UPDATE-STATE(state, action, percept, transition_model, sensor_model)
    rule ← RULE-MATCH(state, rules)
    action ← rule.ACTION
    return action
```

Implement `make_model_based_vacuum_agent()`, which returns a fresh agent program
`program(percept) -> action` for the two-square vacuum world (`percept = (location, status)`).

- **State:** `model = {'A': None, 'B': None}` (`None` = unknown), private to each agent.
- **Update:** what you perceive is true: `model[location] = status`.
- **Rules:** if both squares are known to be `'Clean'` → `'NoOp'`; else if the current square is dirty →
  `'Suck'`; else move to the other square.

Scoring as in the previous problem: +1 per clean square per time step, −1 per move.
Your agent must beat the simple reflex agent.
"""

STARTER = '''from collections.abc import Callable

def make_model_based_vacuum_agent() -> Callable[[tuple], str]:
    model: dict[str, str | None] = {'A': None, 'B': None}  # persistent state: None = unknown

    def program(percept: tuple[str, str]) -> str:
        location, status = percept
        # TODO: update the model, then apply the rules
        return 'NoOp'

    return program
'''

SOLUTION = '''from collections.abc import Callable

def make_model_based_vacuum_agent() -> Callable[[tuple], str]:
    model: dict[str, str | None] = {'A': None, 'B': None}

    def program(percept: tuple[str, str]) -> str:
        location, status = percept
        model[location] = status                      # UPDATE-STATE
        if model['A'] == model['B'] == 'Clean':
            return 'NoOp'
        if status == 'Dirty':
            model[location] = 'Clean'                 # transition model: Suck cleans
            return 'Suck'
        return 'Right' if location == 'A' else 'Left'

    return program
'''

HINTS = [
    'The model must survive between calls and be private to each agent: create it inside '
    '`make_model_based_vacuum_agent`, like the percept list of the table-driven agent.',
    'First UPDATE-STATE (`model[location] = status`), then RULE-MATCH on the **model**, not only on the percept.',
    'Rule order: both known clean → `NoOp`; current dirty → `Suck`; otherwise go to the other square.',
]

EXPLANATION = r"""
The only difference from the simple reflex agent is the **internal state**: the agent remembers what
it saw in the square it is no longer perceiving. That is enough to know when the job is done and stop
paying for useless moves (scores in the last tests: model-based beats reflex in every configuration
where moves cost something).

Two things to notice:

- The agent does **not** stop immediately when both squares are clean at the start: it cannot *see* `B`
  from `A`, so it must go and look. Rational ≠ omniscient: it maximizes the *expected* performance
  **given its percepts**.
- The model encodes an assumption about the environment (*dirt never comes back*, a **static** world).
  If dirt could reappear, `NoOp` forever would be a bad policy: the transition model must describe how
  the world evolves (slides p. 43, "depends on environment").
"""

ENTRY = 'make_model_based_vacuum_agent'


def _run(agent, dirt, location, steps, move_cost=1):
    dirt, score = dict(dirt), 0
    for _ in range(steps):
        action = agent((location, dirt[location]))
        if action == 'Suck':
            dirt[location] = 'Clean'
        elif action in ('Left', 'Right'):
            location = 'A' if action == 'Left' else 'B'
            score -= move_cost
        score += list(dirt.values()).count('Clean')
    return score


def _reflex(percept):
    location, status = percept
    return 'Suck' if status == 'Dirty' else 'Right' if location == 'A' else 'Left'


def _reference():
    model = {'A': None, 'B': None}
    def program(percept):
        location, status = percept
        model[location] = status
        if model['A'] == model['B'] == 'Clean':
            return 'NoOp'
        if status == 'Dirty':
            return 'Suck'
        return 'Right' if location == 'A' else 'Left'
    return program


def _feed(sol, percepts):
    program = sol.make_model_based_vacuum_agent()
    return [program(p) for p in percepts]


def _two_agents(sol):
    a = sol.make_model_based_vacuum_agent()
    b = sol.make_model_based_vacuum_agent()
    return [a(('A', 'Clean')), a(('B', 'Clean')), b(('B', 'Clean'))]


def _independent(got):
    if got == ['Right', 'NoOp', 'Left']:
        return True
    return False, ("Agent b has never seen A, so it must go Left: each agent needs its own model "
                   "(create it inside make_model_based_vacuum_agent).")


def _score_test(a_status, b_status, location):
    world = {'A': a_status, 'B': b_status}
    best = _run(_reference(), world, location, 20)
    reflex = _run(_reflex, world, location, 20)

    def check(got):
        if got == best:
            return True, f'model-based {got} vs simple reflex {reflex}'
        return False, f'score {got}, expected {best} (the simple reflex agent scores {reflex})'

    return Test(f'20 steps from {location}, A {a_status}, B {b_status}',
                call=lambda sol: _run(sol.make_model_based_vacuum_agent(), world, location, 20),
                check=check, show=f"start in {location}, {world}, move_cost=1")


TESTS = [
    Test('both clean: go and look, then stop', call=lambda sol: _feed(sol, [('A', 'Clean'), ('B', 'Clean')]),
         expected=['Right', 'NoOp'], show="percepts (A, Clean), (B, Clean)"),
    Test('clean both squares, then NoOp forever',
         call=lambda sol: _feed(sol, [('A', 'Dirty'), ('A', 'Clean'), ('B', 'Dirty'), ('B', 'Clean'), ('B', 'Clean')]),
         expected=['Suck', 'Right', 'Suck', 'NoOp', 'NoOp'], show='A dirty, B dirty, start in A'),
    Test('start in B', call=lambda sol: _feed(sol, [('B', 'Clean'), ('A', 'Dirty'), ('A', 'Clean')]),
         expected=['Left', 'Suck', 'NoOp'], show="percepts (B, Clean), (A, Dirty), (A, Clean)"),
    Test('two agents do not share the model', call=_two_agents, check=_independent,
         show='agent a sees (A,Clean),(B,Clean); agent b sees (B,Clean)'),
] + [_score_test(a, b, loc) for loc in 'AB' for a in ('Dirty', 'Clean') for b in ('Dirty', 'Clean')]
