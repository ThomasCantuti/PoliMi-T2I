from harness import Test
from logic_lib import clause, show_clause

TITLE = 'The resolution rule: all resolvents of two clauses'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['resolution', 'clauses', 'factoring', 'unit resolution']

STATEMENT = r"""
The **resolution rule** (AIMA §7.5.2): if clause $C_i$ contains a literal $\ell$ and clause $C_j$ contains its
complement $\neg\ell$, the **resolvent** is the disjunction of all the other literals of both clauses:

$$\frac{\ell \vee \alpha, \qquad \neg\ell \vee \beta}{\alpha \vee \beta}$$

Write `pl_resolve(ci, cj)` returning the **set of all resolvents**, one per complementary pair. Clauses are
`frozenset`s of literals `'P'` / `'~P'` (`clause('A | ~B')` builds them); the empty clause `frozenset()` is ⊥.
Since clauses are sets, a literal present in both parents appears once (**factoring**). Keep tautological
resolvents: deciding what to do with them is the caller's job.

```python
pl_resolve(clause('P | Q'), clause('P | ~Q')) == {frozenset({'P'})}
pl_resolve(clause('A'), clause('~A'))         == {frozenset()}           # ⊥
```
"""

STARTER = '''def neg(lit: str) -> str:
    return lit[1:] if lit.startswith('~') else '~' + lit

def pl_resolve(ci: frozenset, cj: frozenset) -> set[frozenset]:
    """All the clauses obtained by resolving ci and cj on one complementary pair."""
    resolvents = set()
    # TODO
    return resolvents
'''

SOLUTION = '''def neg(lit: str) -> str:
    return lit[1:] if lit.startswith('~') else '~' + lit

def pl_resolve(ci: frozenset, cj: frozenset) -> set[frozenset]:
    """All the clauses obtained by resolving ci and cj on one complementary pair."""
    resolvents = set()
    for lit in ci:
        if neg(lit) in cj:
            resolvents.add((ci - {lit}) | (cj - {neg(lit)}))
    return resolvents
'''

HINTS = [
    'Loop over the literals of `ci`; whenever the complement is in `cj` you have one resolvent.',
    'The resolvent is `(ci - {lit}) | (cj - {neg(lit)})`: remove exactly the two complementary literals.',
    'Never remove two pairs at once: $A \\vee B$ and $\\neg A \\vee \\neg B$ have two resolvents, $B \\vee \\neg B$ and '
    '$A \\vee \\neg A$, and neither is the empty clause.',
]

EXPLANATION = r"""
- **Soundness in one line:** in any model, $\ell$ is either true (then $\neg\ell$ is false, so $\beta$ must hold)
  or false (then $\alpha$ must hold): either way $\alpha \vee \beta$ is true.
- **Unit resolution** is the special case where one parent is a single literal: it just deletes the
  complement from the other clause ($\neg Q$ and $\neg T \vee Q$ give $\neg T$).
- **Resolving on two pairs at once is unsound.** $A \vee B$ and $\neg A \vee \neg B$ are both true in the model
  $A = true, B = false$, so they cannot entail ⊥. Their real resolvents are tautologies, useless for a
  refutation.
- **More than one resolvent** (exam 12 Jul 2024, Q7): $A \vee \neg B \vee C$ and $B \vee \neg C \vee D$ can be resolved
  on $B$ or on $C$ — the answer is "true", and here both resolvents happen to be tautologies.
"""

ENTRY = 'pl_resolve'


def _t(name, a, b, expected):
    exp = {clause(c) for c in expected}
    return Test(name, args=(clause(a), clause(b)),
                check=lambda got, *_: (isinstance(got, (set, frozenset)) and {frozenset(c) for c in got} == exp,
                                       'expected {' + ', '.join(sorted(show_clause(c) for c in exp)) + '}'),
                show=f'{show_clause(clause(a))}  with  {show_clause(clause(b))}')


TESTS = [
    _t('unit resolution', '~T | Q', '~Q', ['~T']),
    _t('two units give ⊥', 'A', '~A', ['⊥']),
    _t('no complementary pair', 'A | B', 'A | C', []),
    _t('factoring merges P', 'P | Q', 'P | ~Q', ['P']),
    _t('exam 11 Jun 2026: clauses 1 and 6', '~O | P | R', 'O', ['P | R']),
    _t('exam 14 Jun 2023: clauses 2 and 7', '~Raining | ~Outside | Wet', 'Raining', ['~Outside | Wet']),
    _t('one pair at a time (not ⊥!)', 'A | B', '~A | ~B', ['B | ~B', 'A | ~A']),
    _t('exam 12 Jul 2024 Q7: two ways', 'A | ~B | C', 'B | ~C | D', ['A | C | ~C | D', 'A | ~B | B | D']),
    _t('exercise book 5.3: clauses 4 and 5', 'B | Q', '~A | ~B', ['~A | Q']),
    _t('same clause twice', 'A | ~A', 'A | ~A', ['A | ~A']),
]
