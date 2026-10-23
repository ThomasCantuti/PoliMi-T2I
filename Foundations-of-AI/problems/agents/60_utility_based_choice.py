from harness import Test

TITLE = 'Goal-based vs utility-based decisions'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['utility-based agent', 'goal-based agent', 'expected utility', 'rationality']

STATEMENT = r"""
Goal-based and utility-based agents (slides p. 46–51) both ask *"what will the world be like if I do
action a?"* — they differ in how they judge the result. A utility function $U(s)$ measures the
"happiness" of a state; with uncertain outcomes the rational choice maximizes the **expected utility**

$$EU(a \mid s) = \sum_{s'} P(s' \mid s, a)\, U(s'), \qquad a^* = \arg\max_a EU(a \mid s)$$

Implement:

- `expected_utility(state, action, model, utility)` where `model(state, action)` returns a list of
  `(probability, next_state)` pairs and `utility(state)` returns a number;
- `choose_action(state, actions, model, utility)`: the action with maximum expected utility
  (on ties, the **first** one in `actions`).

The tests use the slides' **taxi** example (*speed vs safety*). From `'downtown'` to catch a flight:

| action | outcomes |
|---|---|
| `'highway'` | 0.9 → airport in 20 min, 0.1 → airport in 60 min (traffic jam) |
| `'city'` | 1.0 → airport in 40 min |
| `'shortcut'` | 0.6 → airport in 10 min, 0.4 → stuck in a ditch |

Outcome states are `('airport', minutes)` or `('ditch', None)`. The flight is caught if you arrive within 45 minutes.
"""

STARTER = '''from collections.abc import Callable
from typing import Any

def expected_utility(state: Any, action: str, model: Callable[[Any, str], list[tuple]],
                     utility: Callable[[Any], float]) -> float:
    # TODO: sum of probability * utility over the outcomes of action
    return 0


def choose_action(state: Any, actions: list[str], model: Callable[[Any, str], list[tuple]],
                  utility: Callable[[Any], float]) -> str:
    # TODO: action with maximum expected utility (first one on ties)
    return None
'''

SOLUTION = '''from collections.abc import Callable
from typing import Any

def expected_utility(state: Any, action: str, model: Callable[[Any, str], list[tuple]],
                     utility: Callable[[Any], float]) -> float:
    return sum(p * utility(s1) for (p, s1) in model(state, action))


def choose_action(state: Any, actions: list[str], model: Callable[[Any, str], list[tuple]],
                  utility: Callable[[Any], float]) -> str:
    return max(actions, key=lambda a: expected_utility(state, a, model, utility))
'''

HINTS = [
    '`model(state, action)` is a list like `[(0.9, ("airport", 20)), (0.1, ("airport", 60))]`.',
    '`expected_utility` is a one-line `sum(...)` over the outcome pairs.',
    '`max(actions, key=...)` already returns the first maximal element on ties.',
]

EXPLANATION = r"""
The three tests on the taxi give three different answers with the same model:

| decision rule | highway | city | shortcut | choice |
|---|---|---|---|---|
| best **most likely** outcome (wrong!) | 80 | 60 | 90 | shortcut |
| **goal-based**: $U = 1$ if flight caught | 0.9 | **1.0** | 0.6 | city |
| **utility-based**: $U = 100 - \text{min}$, 0 if late, −100 in the ditch | **72** | 60 | 14 | highway |

- A **goal** is a binary utility: its expected value is just the *probability of success*, so the
  goal-based agent cannot trade a small risk for a big gain in speed — all ways to the goal look alike
  (slide p. 51: "we can drive to a destination in more and less desirable ways").
- A **utility** weighs the likelihood of success against the importance of the outcomes and resolves
  conflicting goals (speed vs safety).
- Looking only at the most likely outcome ignores the 40% chance of the ditch: rationality is about the
  **expected** value of the performance measure.

The price: the utility-based agent must predict *all* outcomes of every action — "more expensive in
computation" (slides p. 50).
"""

ENTRY = 'choose_action'

_ACTIONS = ['highway', 'city', 'shortcut']


def _taxi(state, action):
    return {'highway': [(0.9, ('airport', 20)), (0.1, ('airport', 60))],
            'city': [(1.0, ('airport', 40))],
            'shortcut': [(0.6, ('airport', 10)), (0.4, ('ditch', None))]}[action]


def _happiness(s):
    place, minutes = s
    if place == 'ditch':
        return -100
    return 100 - minutes if minutes <= 45 else 0


def _on_time(s):
    place, minutes = s
    return 1 if place == 'airport' and minutes <= 45 else 0


def _check_utility(got, *args):
    if got == 'highway':
        return True
    if got == 'shortcut':
        return False, ('shortcut has the best *most likely* outcome (90), but EU = 0.6·90 + 0.4·(−100) = 14. '
                       'Weigh every outcome by its probability.')
    return False, 'expected highway: EU(highway) = 0.9·80 + 0.1·0 = 72 > EU(city) = 60'


def _check_goal(got, *args):
    if got == 'city':
        return True
    return False, ('with a 0/1 goal utility, EU is the probability of catching the flight: '
                   'highway 0.9, city 1.0, shortcut 0.6')


def _grid(state, action):  # deterministic: one outcome with probability 1
    x = state + {'left': -1, 'stay': 0, 'right': +1}[action]
    return [(1.0, x)]


TESTS = [
    Test('EU(highway)', call=lambda sol: sol.expected_utility('downtown', 'highway', _taxi, _happiness),
         expected=72, show='0.9·U(airport, 20) + 0.1·U(airport, 60)'),
    Test('EU(shortcut)', call=lambda sol: sol.expected_utility('downtown', 'shortcut', _taxi, _happiness),
         expected=14, show='0.6·U(airport, 10) + 0.4·U(ditch)'),
    Test('utility-based taxi', call=lambda sol: sol.choose_action('downtown', _ACTIONS, _taxi, _happiness),
         check=_check_utility, show='U = 100 − minutes if on time, 0 if late, −100 in the ditch'),
    Test('goal-based taxi (0/1 utility)',
         call=lambda sol: sol.choose_action('downtown', _ACTIONS, _taxi, _on_time),
         check=_check_goal, show='U = 1 if the flight is caught, else 0'),
    Test('deterministic world', call=lambda sol: sol.choose_action(0, ['left', 'stay', 'right'], _grid,
                                                                    lambda x: -abs(x - 5)),
         expected='right', show='walk on a line towards x = 5'),
    Test('ties → first action', call=lambda sol: sol.choose_action(0, ['stay', 'left', 'right'], _grid,
                                                                    lambda x: 0),
         expected='stay', show='every action has utility 0'),
]
