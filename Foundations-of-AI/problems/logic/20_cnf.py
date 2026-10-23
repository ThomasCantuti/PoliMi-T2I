from harness import Test
from logic_lib import parse, clause, show_clause, equivalent, clause_formula

TITLE = 'Conversion to CNF in four steps'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['CNF', 'clauses', 'De Morgan', 'distributivity']

STATEMENT = r"""
Resolution and DPLL work on **conjunctive normal form**: a conjunction of clauses, each a disjunction of
literals. Write `to_cnf(f)` following the four steps of AIMA §7.5.2:

1. eliminate $\Leftrightarrow$: $\alpha \Leftrightarrow \beta \;\to\; (\alpha \Rightarrow \beta) \wedge (\beta \Rightarrow \alpha)$
2. eliminate $\Rightarrow$: $\alpha \Rightarrow \beta \;\to\; \neg\alpha \vee \beta$
3. move $\neg$ inwards: $\neg\neg\alpha \to \alpha$, $\neg(\alpha \wedge \beta) \to \neg\alpha \vee \neg\beta$,
   $\neg(\alpha \vee \beta) \to \neg\alpha \wedge \neg\beta$
4. distribute $\vee$ over $\wedge$: $\alpha \vee (\beta \wedge \gamma) \to (\alpha \vee \beta) \wedge (\alpha \vee \gamma)$

Formulas are nested tuples (see problem 10; `('&', A, B, ...)` and `('|', A, B, ...)` may have more than two
arguments). Return the CNF as a **set of clauses**, each a `frozenset` of literals `'P'` / `'~P'`:

```python
to_cnf(parse('A <=> (B & C)')) == {frozenset({'~A', 'B'}), frozenset({'~A', 'C'}), frozenset({'A', '~B', '~C'})}
```

Sets merge repeated literals ($A \vee A$) and repeated clauses for free. Drop the **tautological** clauses
(containing both $P$ and $\neg P$: always true). Do **not** simplify anything else (keep subsumed clauses such as
$A \vee Q$ next to $A$: the exercise book keeps them).
"""

STARTER = '''def eliminate_iff_implies(f):
    """Steps 1 and 2: the result only uses ~, & and |."""
    if isinstance(f, str):
        return f
    op, args = f[0], [eliminate_iff_implies(a) for a in f[1:]]
    # TODO: rewrite '<=>' and '=>'
    return (op, *args)

def move_not_inwards(f):
    """Step 3: negation only in front of symbols (negation normal form)."""
    return f   # TODO

def distribute(f) -> list[frozenset]:
    """Step 4: an NNF formula -> list of clauses."""
    return []  # TODO

def to_cnf(f) -> set[frozenset]:
    clauses = distribute(move_not_inwards(eliminate_iff_implies(f)))
    return {c for c in clauses if not any('~' + l in c for l in c)}
'''

SOLUTION = '''def eliminate_iff_implies(f):
    """Steps 1 and 2: the result only uses ~, & and |."""
    if isinstance(f, str):
        return f
    op, args = f[0], [eliminate_iff_implies(a) for a in f[1:]]
    if op == '<=>':
        a, b = args
        return ('&', ('|', ('~', a), b), ('|', ('~', b), a))
    if op == '=>':
        a, b = args
        return ('|', ('~', a), b)
    return (op, *args)

def move_not_inwards(f):
    """Step 3: negation only in front of symbols (negation normal form)."""
    if isinstance(f, str):
        return f
    if f[0] == '~':
        g = f[1]
        if isinstance(g, str):
            return f
        if g[0] == '~':                                   # double negation
            return move_not_inwards(g[1])
        flip = {'&': '|', '|': '&'}[g[0]]                 # De Morgan
        return (flip, *[move_not_inwards(('~', a)) for a in g[1:]])
    return (f[0], *[move_not_inwards(a) for a in f[1:]])

def distribute(f) -> list[frozenset]:
    """Step 4: an NNF formula -> list of clauses."""
    if isinstance(f, str):
        return [frozenset([f])]
    if f[0] == '~':
        return [frozenset(['~' + f[1]])]
    if f[0] == '&':
        return [c for a in f[1:] for c in distribute(a)]
    clauses = [frozenset()]                               # '|': every combination of one clause per disjunct
    for a in f[1:]:
        clauses = [c | d for c in clauses for d in distribute(a)]
    return clauses

def to_cnf(f) -> set[frozenset]:
    clauses = distribute(move_not_inwards(eliminate_iff_implies(f)))
    return {c for c in clauses if not any('~' + l in c for l in c)}
'''

HINTS = [
    'Recurse bottom-up for steps 1–2: first convert the arguments, then rewrite the node itself.',
    'Step 3 only has to look at nodes `(\'~\', g)`: if `g` is a symbol stop, if it is a negation drop both, if it is '
    'a conjunction/disjunction flip the operator and push `~` into every argument (recursively).',
    'Step 4: a conjunction is the **union** of the clause lists of its arguments; a disjunction is the **product**: '
    'one clause from each argument, OR-ed together (`c | d` on frozensets).',
]

EXPLANATION = r"""
Each step preserves equivalence, so the result is equivalent to the input (the tests check it).

- Step 4 is where the size explodes: a disjunction of $n$ conjunctions of 2 literals gives $2^n$ clauses.
  $(A \wedge B) \vee (A \wedge Q)$ (exercise book 5.3) becomes $A \wedge (A \vee Q) \wedge (A \vee B) \wedge (B \vee Q)$.
- Useful shapes to recognize at once in the exams:
  $A \wedge B \Rightarrow C$ = one clause $\neg A \vee \neg B \vee C$;
  $A \vee B \Rightarrow C$ = two clauses $\neg A \vee C$, $\neg B \vee C$;
  $Lucky \wedge (Smart \vee Study) \Rightarrow Pass$ = $\neg Lucky \vee \neg Smart \vee Pass$ and $\neg Lucky \vee \neg Study \vee Pass$ (exam 10 Jul 2023).
- Removing tautologies is safe: a clause that is always true does not constrain the models.
"""

ENTRY = 'to_cnf'


def _cnf_check(expected):
    exp = {clause(c) for c in expected}

    def check(got, f):
        try:
            got = {frozenset(c) for c in got}
        except TypeError:
            return False, 'Return a set of frozensets of literals.'
        if got == exp:
            return True
        shown = '{' + ', '.join(sorted(show_clause(c) for c in got)) + '}'
        if got and equivalent(('&', *[clause_formula(c) for c in got]), f):
            return False, f'{shown} is equivalent but not the clause set of the four steps (did you simplify more?).'
        return False, f'{shown} is not equivalent to the input formula.'
    return check


def _t(name, text, expected):
    return Test(name, args=(parse(text),), check=_cnf_check(expected), show=text)


TESTS = [
    _t('a clause stays a clause', 'A | ~B', ['A | ~B']),
    _t('implication', '(P & Q) => R', ['~P | ~Q | R']),
    _t('disjunctive premise: two clauses', '(S | T) => Q', ['~S | Q', '~T | Q']),
    _t('De Morgan', '~(A | B) & C', ['~A', '~B', 'C']),
    _t('double negation', '~~A', ['A']),
    _t('wumpus R2 (AIMA §7.5.2)', 'B11 <=> (P12 | P21)', ['~B11 | P12 | P21', '~P12 | B11', '~P21 | B11']),
    _t('exercise book 5.1', 'U => (~T => (~S & P))', ['~U | T | ~S', '~U | T | P']),
    _t('exercise book 5.2', 'A <=> (B & C)', ['~A | B', '~A | C', '~B | ~C | A']),
    _t('exam 10 Jul 2023, statement 3', 'Lucky & (Smart | Study) => Pass',
       ['~Lucky | ~Smart | Pass', '~Lucky | ~Study | Pass']),
    _t('distribution: (A ∧ B) ∨ (A ∧ Q)', '(A & B) | (A & Q)', ['A', 'A | Q', 'A | B', 'B | Q']),
    _t('negated query of exercise 5.3', '~((A & B) | (A & Q))', ['~A | ~B', '~A | ~Q']),
    _t('tautologies are dropped', '(A => B) | (B => A)', []),
    _t('exam 11 Jun 2026, statement 5', 'O & ~P & M & ~B', ['O', '~P', 'M', '~B']),
    _t('nested biconditional', '(A <=> B) <=> C',
       ['A | B | C', '~A | ~B | C', 'A | ~B | ~C', '~A | B | ~C']),
]
