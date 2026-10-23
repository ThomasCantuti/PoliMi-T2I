from harness import Test
from logic_lib import clause

TITLE = 'DPLL with a trace of its steps'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['DPLL', 'satisfiability', 'backtracking', 'pure symbol', 'unit clause']

STATEMENT = r"""
Put the pieces of problem 70 together into the DPLL algorithm of AIMA §7.6.1:

```text
function DPLL(clauses, symbols, model) returns true or false
    if every clause in clauses is true in model then return true
    if some clause in clauses is false in model then return false
    P, value <- FIND-PURE-SYMBOL(symbols, clauses, model)
    if P is non-null then return DPLL(clauses, symbols - P, model ∪ {P = value})
    P, value <- FIND-UNIT-CLAUSE(clauses, model)
    if P is non-null then return DPLL(clauses, symbols - P, model ∪ {P = value})
    P <- FIRST(symbols);  rest <- REST(symbols)
    return DPLL(clauses, rest, model ∪ {P = true}) or DPLL(clauses, rest, model ∪ {P = false})
```

Write `dpll(clauses, symbols, pure=True, unit=True)` returning `(satisfiable, model, steps)`:

- `model`: the partial model `{symbol: bool}` at the moment every clause became true (`None` if unsatisfiable);
- `steps`: the exam's step column, as strings `'pure L'`, `'unit L'`, `'split L'`, `'backtrack'` with
  `L = 'A'` or `'~A'`. When the `true` branch of a split on `P` fails, append `'backtrack'` and `'split ~P'`
  before trying `false` (the exam's "backtrack to 0 / split on ¬A").
- `pure=False` / `unit=False` switch the heuristics off (the exam variants "DPLL without the pure symbol
  heuristic", "without the unit clause heuristic").

Deterministic conventions, so that the trace is unique: FIND-PURE-SYMBOL scans `symbols` in order and takes the
first unassigned pure one (positive literal checked first); FIND-UNIT-CLAUSE takes the first unit clause in the
order of `clauses`; a split takes the first unassigned symbol of `symbols`, `true` first. The tests pass the
symbols in order of first appearance. `from logic_lib import row, pure_literals, unit_literals` gives you the
building blocks.

Exam 14 Jan 2026 (unsatisfiable): `['split X', 'unit Y', 'unit Z', 'backtrack', 'split ~X', 'unit ~T', 'unit ~Y', 'unit Z']`.
"""

STARTER = '''from logic_lib import row, pure_literals, unit_literals

def dpll(clauses: list[frozenset], symbols: list[str], pure: bool = True, unit: bool = True):
    """Return (satisfiable, model or None, steps)."""
    steps: list[str] = []

    def rec(model: dict[str, bool]):
        r = row(clauses, model)
        # TODO: early termination, pure symbol, unit clause, split (true first) with backtrack
        return None

    model = rec({})
    return model is not None, model, steps
'''

SOLUTION = '''from logic_lib import row, pure_literals, unit_literals

def dpll(clauses: list[frozenset], symbols: list[str], pure: bool = True, unit: bool = True):
    """Return (satisfiable, model or None, steps)."""
    steps: list[str] = []

    def assign(model, lit):
        return {**model, lit.lstrip('~'): not lit.startswith('~')}

    def rec(model: dict[str, bool]):
        r = row(clauses, model)
        if all(st is True for st in r):
            return model                                    # every clause true
        if any(st is not True and not st for st in r):
            return None                                     # some clause false
        if pure:
            candidates = pure_literals(clauses, model)
            for s in symbols:
                for lit in (s, '~' + s):
                    if lit in candidates:
                        steps.append('pure ' + lit)
                        return rec(assign(model, lit))
        if unit:
            for st in r:
                if st is not True and len(st) == 1:
                    lit = next(iter(st))
                    steps.append('unit ' + lit)
                    return rec(assign(model, lit))
        p = next(s for s in symbols if s not in model)
        steps.append('split ' + p)
        result = rec(assign(model, p))
        if result is not None:
            return result
        steps.extend(['backtrack', 'split ~' + p])
        return rec(assign(model, '~' + p))

    model = rec({})
    return model is not None, model, steps
'''

HINTS = [
    'Order of the checks in each call: all clauses true → return the model; some clause ⊥ → return `None`; '
    'then pure symbol, then unit clause, then split.',
    'Pure: `for s in symbols: for lit in (s, "~" + s): if lit in pure_literals(...)`. Unit: scan `row(...)` in order '
    'and take the first cell that is a one-literal frozenset.',
    'Split: `p = next(s for s in symbols if s not in model)`; record `split p`, recurse with `p` true; if that '
    'returns `None`, record `backtrack` and `split ~p` and recurse with `p` false.',
]

EXPLANATION = r"""
**Why the heuristics do not change the answer** (exams 17 Feb 2022, 8 Jul 2026): a pure literal can be set true
without losing any model of the remaining clauses, and a unit literal is forced. So they only skip branches
that cannot contain a model the full search would need: DPLL stays sound and complete with or without them,
and it always terminates (at worst it enumerates $2^n$ assignments). Compare the traces of the tests: with
both heuristics the Jan 2026 instance needs 8 steps, without any heuristic 18.

**The exam does not fix these conventions.** The official solutions pick unit clauses in other orders
(8 Jul 2026 takes the last one: $\neg E$ before $\neg D$), choose a unit clause while a pure symbol exists
(8 Sep 2025, after $\neg A$: unit $B$ although $D$ is pure; this code takes pure $D$, pure $B$, pure $\neg C$),
and split on $\neg H$ first. Same answer, same kind of table: any legal choice is accepted. Problem x60 checks
hand-written traces with exactly that freedom.

**For entailment**, run DPLL on $KB \wedge \neg\alpha$: unsatisfiable means $KB \models \alpha$ (exam 10 Jul 2023:
$KB + POLIMI + Study + \neg Pass$ is unsatisfiable, so you pass the exam).
"""

ENTRY = 'dpll'


def _inst(*cls):
    out = []
    for c in cls:
        for s in c.replace('~', ' ').replace('|', ' ').split():
            if s not in out:
                out.append(s)
    return [clause(c) for c in cls], out


_SEP25 = _inst('A | B', '~A | ~D', 'C | D', 'B | C', 'A | ~C', '~B | D', '~A | ~C')
_JAN26 = _inst('X | Y | Z', 'X | Y | ~Z', 'X | T | ~Y', '~T | X', '~X | Y', '~Y | Z', '~Y | ~Z')
_JUL26 = _inst('~A | B | C', 'A | ~B', 'A | ~C', '~B | D', '~C | E', '~D | F', '~E | F', '~F | G', '~G | H', '~H')
_JUL23 = _inst('~POLIMI | Smart', '~Smart | ~Study | Pass', '~Lucky | ~Smart | Pass', '~Lucky | ~Study | Pass',
               'POLIMI', 'Study', '~Pass')
_SEP23 = _inst('a | ~b', 'a | c | ~d', '~c | ~e', '~c | e', 'c | d')
_FEB22 = _inst('~p | ~q', '~s | t', '~t | p', 's', '~s | u', '~u | q')
_EX54 = _inst('P | Q | ~R', 'P | ~Q', '~P', 'R', 'U')
_EX56 = _inst('P | Q', 'P | ~Q', '~P | Q', '~P | ~R')


def _t(name, inst, expected, **flags):
    cls, syms = inst
    opts = ', '.join(f'{k}={v}' for k, v in flags.items())
    return Test(name, call=lambda sol: sol.dpll(cls, syms, **flags), expected=expected,
                show=f'symbols {syms}' + (f', {opts}' if opts else ''))


_F = False
TESTS = [
    _t('exam 8 Sep 2023, classical DPLL: three pure symbols', _SEP23,
       (True, {'a': True, 'd': True, 'c': False}, ['pure a', 'pure d', 'pure ~c'])),
    _t('exam 14 Jan 2026: unsatisfiable', _JAN26,
       (False, None, ['split X', 'unit Y', 'unit Z', 'backtrack', 'split ~X', 'unit ~T', 'unit ~Y', 'unit Z'])),
    _t('exam 8 Sep 2025', _SEP25,
       (True, {'A': False, 'D': True, 'B': True, 'C': False},
        ['split A', 'unit ~D', 'unit C', 'backtrack', 'split ~A', 'pure D', 'pure B', 'pure ~C'])),
    _t('exam 8 Jul 2026: unit propagation', _JUL26,
       (True, {s: False for s in 'HGFDBECA'},
        ['unit ~H', 'unit ~G', 'unit ~F', 'unit ~D', 'unit ~B', 'unit ~E', 'unit ~C', 'pure ~A'])),
    _t('exam 10 Jul 2023: KB + POLIMI + Study + ¬Pass', _JUL23,
       (False, None, ['pure ~Lucky', 'unit POLIMI', 'unit Smart', 'unit Study', 'unit Pass'])),
    _t('exercise book 5.4', _EX54, (False, None, ['pure U', 'unit ~P', 'unit ~Q', 'unit ~R'])),
    _t('exercise book 5.6', _EX56, (True, {'R': False, 'P': True, 'Q': True}, ['pure ~R', 'split P', 'pure Q'])),
    _t('exam 17 Feb 2022 without the pure symbol heuristic', _FEB22,
       (False, None, ['unit s', 'unit t', 'unit p', 'unit ~q', 'unit u']), pure=_F),
    _t('exam 8 Sep 2023 with unit clauses only', _SEP23,
       (True, {'a': True, 'b': True, 'c': False, 'd': True},
        ['split a', 'split b', 'split c', 'unit ~e', 'backtrack', 'split ~c', 'unit d']), pure=_F),
    _t('exam 14 Jan 2026 without any heuristic', _JAN26,
       (False, None, ['split X', 'split Y', 'split Z', 'backtrack', 'split ~Z', 'backtrack', 'split ~Y', 'backtrack',
                      'split ~X', 'split Y', 'split Z', 'backtrack', 'split ~Z', 'backtrack', 'split ~Y', 'split Z',
                      'backtrack', 'split ~Z']), pure=_F, unit=_F),
    _t('exam 8 Jul 2026 without unit clauses: pure symbols appear', _JUL26,
       (True, {s: False for s in 'ABCDEFGH'},
        ['split A', 'split B', 'pure ~C', 'pure ~E', 'split D', 'split F', 'split G', 'split H', 'backtrack',
         'split ~H', 'backtrack', 'split ~G', 'backtrack', 'split ~F', 'backtrack', 'split ~D', 'backtrack',
         'split ~B', 'pure ~D', 'split C', 'split E', 'split F', 'split G', 'split H', 'backtrack', 'split ~H',
         'backtrack', 'split ~G', 'backtrack', 'split ~F', 'backtrack', 'split ~E', 'backtrack', 'split ~C',
         'backtrack', 'split ~A', 'pure ~B', 'pure ~C', 'pure ~D', 'pure ~E', 'pure ~F', 'pure ~G', 'pure ~H']),
       unit=_F),
]
