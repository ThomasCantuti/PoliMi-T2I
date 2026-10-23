from harness import Test

TITLE = 'Table-driven agent (and why it cannot scale)'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['table-driven agent', 'agent function', 'percept sequence', 'persistent state']

STATEMENT = r"""
The most literal implementation of the agent function $f: P^\ast \to A$ is a **lookup table indexed by
the whole percept sequence** (AIMA Fig. 2.7, slides p. 33):

```text
function TABLE-DRIVEN-AGENT(percept) returns an action
    persistent: percepts, a sequence, initially empty
                table, a table of actions, indexed by percept sequences, fully specified
    append percept to the end of percepts
    action ← LOOKUP(percepts, table)
    return action
```

**1.** Implement `make_table_driven_agent(table)`: it returns an **agent program**, i.e. a function
`program(percept) -> action`. `table` is a dict whose keys are **tuples of percepts**.
"persistent" means: the percept sequence must survive between calls, and every agent built by
`make_table_driven_agent` must have **its own** sequence.

**2.** Implement `table_size(num_percepts, lifetime)`: how many entries must the table have for an agent
that can receive `num_percepts` different percepts and lives `lifetime` steps?
(one entry for every possible percept sequence of length $1, 2, \dots, T$).

```python
program = make_table_driven_agent({(('A', 'Dirty'),): 'Suck',
                                   (('A', 'Dirty'), ('A', 'Clean')): 'Right'})
program(('A', 'Dirty'))   # 'Suck'
program(('A', 'Clean'))   # 'Right'
table_size(4, 2)          # 20  (4 sequences of length 1 + 16 of length 2)
```
"""

STARTER = '''from collections.abc import Callable

def make_table_driven_agent(table: dict[tuple, str]) -> Callable[[tuple], str]:
    percepts: list[tuple] = []         # persistent: survives between calls
    def program(percept: tuple[str, str]) -> str:
        # TODO: append the percept, look up the whole sequence in the table
        return None
    return program


def table_size(num_percepts: int, lifetime: int) -> int:
    # TODO: number of percept sequences of length 1..lifetime
    return 0
'''

SOLUTION = '''from collections.abc import Callable

def make_table_driven_agent(table: dict[tuple, str]) -> Callable[[tuple], str]:
    percepts: list[tuple] = []
    def program(percept: tuple[str, str]) -> str:
        percepts.append(percept)
        return table[tuple(percepts)]
    return program


def table_size(num_percepts: int, lifetime: int) -> int:
    return sum(num_percepts ** t for t in range(1, lifetime + 1))
'''

HINTS = [
    'A closure is the Python way to get a "persistent" variable: `percepts` lives in `make_table_driven_agent`, '
    'and `program` can append to it.',
    'Dict keys must be hashable: look up `tuple(percepts)`, not the list.',
    'There are $|P|^t$ percept sequences of length $t$; sum them for $t = 1..T$. '
    'Careful with closed formulas when $|P| = 1$.',
]

EXPLANATION = r"""
The table-driven agent *does* implement any agent function — even one that needs memory — but the table has

$$\sum_{t=1}^{T} |P|^t$$

entries. With only 4 percepts (the vacuum world) and a lifetime of 30 steps that is more than $10^{18}$
entries; an automated taxi with a camera would need more entries than atoms in the universe.

That is the point of slides p. 34: *the key challenge is to write programs that produce rational behavior
from a smallish program*. The four agent architectures (simple reflex, model-based, goal-based,
utility-based) are four ways of compressing this table into rules, models, goals and utilities.
"""

ENTRY = 'make_table_driven_agent'

_VACUUM_TABLE = {
    (('A', 'Clean'),): 'Right',
    (('A', 'Dirty'),): 'Suck',
    (('B', 'Clean'),): 'Left',
    (('B', 'Dirty'),): 'Suck',
    (('A', 'Dirty'), ('A', 'Clean')): 'Right',
    (('A', 'Clean'), ('B', 'Dirty')): 'Suck',
    (('A', 'Clean'), ('B', 'Clean')): 'NoOp',      # both squares seen clean: stop!
    (('B', 'Clean'), ('A', 'Clean')): 'NoOp',
    (('A', 'Dirty'), ('A', 'Clean'), ('B', 'Dirty')): 'Suck',
    (('A', 'Dirty'), ('A', 'Clean'), ('B', 'Clean')): 'NoOp',
}


def _feed(sol, percepts):
    program = sol.make_table_driven_agent(_VACUUM_TABLE)
    return [program(p) for p in percepts]


def _two_agents(sol):
    a = sol.make_table_driven_agent(_VACUUM_TABLE)
    b = sol.make_table_driven_agent(_VACUUM_TABLE)
    return [a(('A', 'Dirty')), b(('A', 'Clean')), a(('A', 'Clean'))]


def _independent(got):
    if got == ['Suck', 'Right', 'Right']:
        return True
    return False, 'Each agent needs its own percept sequence: create the list inside make_table_driven_agent.'


TESTS = [
    Test('first percept', call=lambda sol: _feed(sol, [('A', 'Dirty')]), expected=['Suck'],
         show="[('A', 'Dirty')]"),
    Test('the whole sequence is the key', call=lambda sol: _feed(sol, [('A', 'Dirty'), ('A', 'Clean')]),
         expected=['Suck', 'Right'], show="[('A', 'Dirty'), ('A', 'Clean')]"),
    Test('same percept, different history → different action',
         call=lambda sol: [_feed(sol, [('B', 'Clean')]), _feed(sol, [('A', 'Clean'), ('B', 'Clean')])],
         expected=[['Left'], ['Right', 'NoOp']],
         show="('B', 'Clean') alone vs after ('A', 'Clean')"),
    Test('3-step lifetime', call=lambda sol: _feed(sol, [('A', 'Dirty'), ('A', 'Clean'), ('B', 'Clean')]),
         expected=['Suck', 'Right', 'NoOp'], show="[('A', 'Dirty'), ('A', 'Clean'), ('B', 'Clean')]"),
    Test('two agents do not share memory', call=_two_agents, check=_independent,
         show='agent a sees (A,Dirty),(A,Clean); agent b sees (A,Clean)'),
    Test('table_size(4, 1)', call=lambda sol: sol.table_size(4, 1), expected=4),
    Test('table_size(4, 2)', call=lambda sol: sol.table_size(4, 2), expected=20),
    Test('table_size(4, 10)', call=lambda sol: sol.table_size(4, 10), expected=1398100),
    Test('table_size(1, 5): a single possible percept', call=lambda sol: sol.table_size(1, 5), expected=5),
    Test('table_size(4, 30) > 10**18', call=lambda sol: sol.table_size(4, 30),
         expected=sum(4 ** t for t in range(1, 31))),
]
