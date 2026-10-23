from harness import Test
from logic_lib import clause, show_clause

TITLE = 'One row of the DPLL table: early termination, pure symbols, unit clauses'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['DPLL', 'early termination', 'pure symbol', 'unit clause', 'partial model']

STATEMENT = r"""
The exam reports DPLL as a table: one column per clause, one row per assignment, each cell showing the clause
**under the current partial model** (AIMA §7.6.1; exams 8 Sep 2025, 14 Jan 2026, 8 Jul 2026). Write the three
functions that produce a row and the heuristics' candidates. Clauses are `frozenset`s of literals
`'P'`/`'~P'`; `model` is a partial assignment `{symbol: bool}`.

1. `row(clauses, model)` — for each clause, in order: `True` if some literal is true (**early termination**: one
   true literal is enough, even with other symbols unassigned); otherwise the `frozenset` of its literals whose
   symbol is still **unassigned** (the false ones disappear). An empty frozenset means the clause is false: ⊥.
2. `pure_literals(clauses, model)` — the set of literals $\ell$ such that $\ell$ appears in some clause **not yet
   satisfied** (among its unassigned literals) and its complement appears in none of them.
3. `unit_literals(clauses, model)` — the set of literals that are the **only** remaining literal of a clause
   not yet satisfied.

Exam 8 Sep 2025, after the split on $A$ (`model = {'A': True}`):

```text
clauses:  A ∨ B   ¬A ∨ ¬D   C ∨ D   B ∨ C   A ∨ ¬C   ¬B ∨ D   ¬A ∨ ¬C
row:      True    {¬D}      {C, D}  {B, C}  True     {¬B, D}  {¬C}
unit literals: {¬D, ¬C}        pure literals: { }   (B, C, D all appear with both signs)
```
"""

STARTER = '''def row(clauses: list[frozenset], model: dict[str, bool]) -> list:
    """Each clause -> True (satisfied) or the frozenset of its unassigned literals (empty = false)."""
    out = []
    for c in clauses:
        out.append(c)   # TODO
    return out

def pure_literals(clauses: list[frozenset], model: dict[str, bool]) -> set[str]:
    return set()   # TODO

def unit_literals(clauses: list[frozenset], model: dict[str, bool]) -> set[str]:
    return set()   # TODO
'''

SOLUTION = '''def symbol(lit: str) -> str:
    return lit.lstrip('~')

def is_true(lit: str, model: dict[str, bool]) -> bool:
    return symbol(lit) in model and model[symbol(lit)] == (not lit.startswith('~'))

def row(clauses: list[frozenset], model: dict[str, bool]) -> list:
    """Each clause -> True (satisfied) or the frozenset of its unassigned literals (empty = false)."""
    out = []
    for c in clauses:
        if any(is_true(l, model) for l in c):
            out.append(True)
        else:
            out.append(frozenset(l for l in c if symbol(l) not in model))
    return out

def pure_literals(clauses: list[frozenset], model: dict[str, bool]) -> set[str]:
    seen = set()
    for st in row(clauses, model):
        if st is not True:
            seen |= st
    return {l for l in seen if (l[1:] if l.startswith('~') else '~' + l) not in seen}

def unit_literals(clauses: list[frozenset], model: dict[str, bool]) -> set[str]:
    return {next(iter(st)) for st in row(clauses, model) if st is not True and len(st) == 1}
'''

HINTS = [
    'A literal `l` is true in the model if its symbol is assigned and the value matches the sign: '
    '`model[sym] == (not l.startswith("~"))`.',
    'A clause that is not satisfied keeps only the literals whose symbol is **not in** the model: the assigned ones '
    'are all false (otherwise the clause would be satisfied).',
    'For both heuristics, look only at the rows that are not `True`: purity ignores the clauses already satisfied '
    '(AIMA: "the algorithm can ignore clauses that are already known to be true").',
]

EXPLANATION = r"""
**Early termination** is what makes DPLL much better than TT-ENTAILS: a clause is decided by its first true
literal, and the whole formula is decided as soon as one clause is ⊥ — no need to complete the model.

**Pure symbol.** If a symbol appears only positively (or only negatively) in the clauses still open, making
its literals true can only satisfy clauses, never falsify one: if the formula has a model, it has one with that
value. Note that purity depends on the model: in the Sep 2025 run, after $\neg A$ the symbol $D$ becomes pure
because $\neg A \vee \neg D$ is satisfied.

**Unit clause.** If all literals but one are false, the last one is **forced**. Assigning it can create new unit
clauses: **unit propagation**, a cascade like forward chaining (8 Jul 2026: $\neg H$ forces $\neg G$, which forces
$\neg F$, …). A literal can be both pure and unit (the last step of that run, $\neg A$).

If two unit clauses demand opposite literals ($Z$ and $\neg Z$ on 14 Jan 2026), assigning either makes the
other clause ⊥: a conflict, detected at the next row.
"""

ENTRY = 'row'

_SEP25 = [clause(c) for c in ['A | B', '~A | ~D', 'C | D', 'B | C', 'A | ~C', '~B | D', '~A | ~C']]
_JAN26 = [clause(c) for c in ['X | Y | Z', 'X | Y | ~Z', 'X | T | ~Y', '~T | X', '~X | Y', '~Y | Z', '~Y | ~Z']]
_JUL26 = [clause(c) for c in ['~A | B | C', 'A | ~B', 'A | ~C', '~B | D', '~C | E', '~D | F', '~E | F', '~F | G',
                              '~G | H', '~H']]
_JUL23 = [clause(c) for c in ['~POLIMI | Smart', '~Smart | ~Study | Pass', '~Lucky | ~Smart | Pass',
                              '~Lucky | ~Study | Pass', 'POLIMI', 'Study', '~Pass']]


def _row(cls, cells):
    return [True if c is True else clause(c) for c in cells]


def _show_row(r):
    return '[' + ', '.join('True' if x is True else show_clause(x) for x in r) + ']'


def _row_test(name, cls, model, cells):
    exp = _row(cls, cells)
    return Test(name, args=(cls, model), check=lambda got, *_: (
        isinstance(got, list) and len(got) == len(exp)
        and all((g is True and e is True) or (g is not True and e is not True and frozenset(g) == e)
                for g, e in zip(got, exp)), 'expected ' + _show_row(exp)),
        show=f'model {model}')


def _set_test(name, fn, cls, model, expected):
    return Test(name, call=lambda sol: getattr(sol, fn)(cls, model), check=lambda got: set(got) == set(expected),
                expected=set(expected), show=f'{fn}, model {model}')


TESTS = [
    _row_test('Sep 2025 row 1: split on A', _SEP25, {'A': True},
              [True, '~D', 'C | D', 'B | C', True, '~B | D', '~C']),
    _row_test('Sep 2025 row 3: conflict', _SEP25, {'A': True, 'D': False, 'C': True},
              [True, True, True, True, True, '~B', '⊥']),
    _row_test('Sep 2025 row 4: split on ¬A', _SEP25, {'A': False},
              ['B', True, 'C | D', 'B | C', '~C', '~B | D', True]),
    _row_test('Jan 2026: split on ¬X, unit ¬T', _JAN26, {'X': False, 'T': False},
              ['Y | Z', 'Y | ~Z', '~Y', True, True, '~Y | Z', '~Y | ~Z']),
    _row_test('Jul 2023: after ¬Lucky, ¬Pass', _JUL23, {'Lucky': False, 'Pass': False},
              ['~POLIMI | Smart', '~Smart | ~Study', True, True, 'POLIMI', 'Study', True]),
    _row_test('empty model: clauses unchanged', _SEP25, {},
              ['A | B', '~A | ~D', 'C | D', 'B | C', 'A | ~C', '~B | D', '~A | ~C']),
    _set_test('Sep 2025 after A: unit literals', 'unit_literals', _SEP25, {'A': True}, {'~D', '~C'}),
    _set_test('Sep 2025 after A: no pure literal', 'pure_literals', _SEP25, {'A': True}, set()),
    _set_test('Sep 2025 after ¬A: D is pure', 'pure_literals', _SEP25, {'A': False}, {'D'}),
    _set_test('Sep 2025 after ¬A: unit literals', 'unit_literals', _SEP25, {'A': False}, {'B', '~C'}),
    _set_test('Jul 2023 at the start: ¬Lucky is pure', 'pure_literals', _JUL23, {}, {'~Lucky'}),
    _set_test('Jul 2023 at the start: three unit clauses', 'unit_literals', _JUL23, {}, {'POLIMI', 'Study', '~Pass'}),
    _set_test('Jul 2026 after ¬H, ¬G, ¬F: two units', 'unit_literals', _JUL26, {'H': False, 'G': False, 'F': False},
              {'~D', '~E'}),
    _set_test('Jan 2026 after ¬X, ¬T, ¬Y: Z and ¬Z both unit', 'unit_literals', _JAN26,
              {'X': False, 'T': False, 'Y': False}, {'Z', '~Z'}),
    _set_test('Jul 2026 last step: ¬A pure and unit', 'pure_literals', _JUL26,
              {s: False for s in 'BCDEFGH'}, {'~A'}),
]
