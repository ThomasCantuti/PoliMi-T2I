from harness import Test

TITLE = 'Environment simulator and performance measure'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['environment', 'performance measure', 'agent-environment loop', 'vacuum world']

STATEMENT = r"""
An agent is judged by the **environment**, not by itself: the performance measure is defined by the
designer on the sequence of **environment states** (slides p. 21–30). Write the agent–environment loop
for the two-square vacuum world and compute the performance measure.

`run_vacuum(agent, dirt, location, steps, move_cost)`:

- `agent` is an agent program: `agent(percept) -> action`, with `percept = (location, dirt[location])`;
- `dirt` is a dict like `{'A': 'Dirty', 'B': 'Clean'}` — **do not modify the caller's dict**;
- `location` is `'A'` or `'B'`.

At each of the `steps` time steps:

1. give the agent its percept and get its action;
2. update the world: `'Suck'` makes the current square `'Clean'`; `'Right'` moves to `B`, `'Left'` moves to
   `A` (bumping into the wall leaves you where you are); `'NoOp'` does nothing;
3. score: **+1 for every clean square** after the action, and **−`move_cost`** if the action was
   `'Left'` or `'Right'` (even when bumping into the wall).

Return the total score.

**Example:** an agent that does `Suck, Right, Suck, NoOp` from `A` in a world where both squares are dirty
scores $1 + 1 + 2 + 2 = 6$ with `move_cost=0`, and $6 - 1 = 5$ with `move_cost=1`.
"""

STARTER = '''from collections.abc import Callable

def run_vacuum(agent: Callable[[tuple], str], dirt: dict[str, str], location: str,
               steps: int, move_cost: int = 0) -> int:
    dirt = dict(dirt)          # our own copy of the world
    score = 0
    for t in range(steps):
        # TODO: percept -> action -> update the world -> update the score
        pass
    return score
'''

SOLUTION = '''from collections.abc import Callable

def run_vacuum(agent: Callable[[tuple], str], dirt: dict[str, str], location: str,
               steps: int, move_cost: int = 0) -> int:
    dirt = dict(dirt)
    score = 0
    for t in range(steps):
        action = agent((location, dirt[location]))
        if action == 'Suck':
            dirt[location] = 'Clean'
        elif action == 'Right':
            location = 'B'
            score -= move_cost
        elif action == 'Left':
            location = 'A'
            score -= move_cost
        score += list(dirt.values()).count('Clean')
    return score
'''

HINTS = [
    'The agent never sees the dict: it only receives the tuple `(location, dirt[location])`.',
    'Each iteration: `action = agent((location, dirt[location]))`, then update `dirt` / `location`.',
    'Score after the update: `score += list(dirt.values()).count("Clean")`, and subtract `move_cost` '
    'for `Left`/`Right`.',
]

EXPLANATION = r"""
This loop **is** the agent–environment diagram of slides p. 21–23: percepts flow in, actions flow out,
and the environment (not the agent) keeps the true state and the score.

Notice that the same agent gets a different score when the measure changes: with `move_cost = 0` the
simple reflex agent is rational (moving is free), with `move_cost = 1` its endless back-and-forth costs
1 point per step. **Rationality is always relative to a performance measure** — next problem, a
model-based agent will exploit this.

Measure *what you want in the environment*, not how you think the agent should behave: rewarding
"amount of dirt sucked" would reward an agent that dumps dirt and sucks it again.
"""

ENTRY = 'run_vacuum'


def _script(actions):
    """An agent that ignores its percepts and plays a fixed list of actions."""
    it = iter(actions)
    return lambda percept: next(it)


def _reflex(percept):
    location, status = percept
    return 'Suck' if status == 'Dirty' else 'Right' if location == 'A' else 'Left'


def _spy(sol):
    seen = []
    def agent(percept):
        seen.append(percept)
        return ['Suck', 'Right', 'Suck', 'NoOp'][len(seen) - 1]
    sol.run_vacuum(agent, {'A': 'Dirty', 'B': 'Dirty'}, 'A', 4, 0)
    return seen


def _untouched(sol):
    world = {'A': 'Dirty', 'B': 'Dirty'}
    sol.run_vacuum(_reflex, world, 'A', 5, 0)
    return world


_BOTH_DIRTY = {'A': 'Dirty', 'B': 'Dirty'}

TESTS = [
    Test('slide example, free moves',
         call=lambda sol: sol.run_vacuum(_script(['Suck', 'Right', 'Suck', 'NoOp']), _BOTH_DIRTY, 'A', 4, 0),
         expected=6, show="Suck, Right, Suck, NoOp from A, both dirty, move_cost=0"),
    Test('slide example, moves cost 1',
         call=lambda sol: sol.run_vacuum(_script(['Suck', 'Right', 'Suck', 'NoOp']), _BOTH_DIRTY, 'A', 4, 1),
         expected=5, show="Suck, Right, Suck, NoOp from A, both dirty, move_cost=1"),
    Test('percepts given to the agent', call=_spy,
         expected=[('A', 'Dirty'), ('A', 'Clean'), ('B', 'Dirty'), ('B', 'Clean')],
         show='which percepts does the agent receive?'),
    Test('zero steps', call=lambda sol: sol.run_vacuum(_reflex, _BOTH_DIRTY, 'A', 0, 1), expected=0),
    Test('sucking a clean square changes nothing',
         call=lambda sol: sol.run_vacuum(_script(['Suck', 'Suck']), {'A': 'Dirty', 'B': 'Clean'}, 'B', 2, 1),
         expected=2, show="Suck, Suck in B, A dirty"),
    Test('bumping into the wall still costs',
         call=lambda sol: sol.run_vacuum(_script(['Left']), {'A': 'Clean', 'B': 'Clean'}, 'A', 1, 1),
         expected=1, show="Left from A, both clean, move_cost=1"),
    Test('reflex agent, 10 steps, free moves',
         call=lambda sol: sol.run_vacuum(_reflex, _BOTH_DIRTY, 'A', 10, 0), expected=18),
    Test('reflex agent, 10 steps, moves cost 1',
         call=lambda sol: sol.run_vacuum(_reflex, _BOTH_DIRTY, 'A', 10, 1), expected=10),
    Test("the caller's dict is not modified", call=_untouched, expected={'A': 'Dirty', 'B': 'Dirty'}),
]
