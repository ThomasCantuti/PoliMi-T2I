from harness import Test
from logic_lib import parse

TITLE = 'Truth tables: PL-TRUE and TT-ENTAILS'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['semantics', 'models', 'entailment', 'model checking', 'validity']

STATEMENT = r"""
Entailment by brute force (AIMA §7.4.4): $KB \models \alpha$ iff $\alpha$ is true in **every** model in which
the KB is true. Formulas are nested tuples (`from logic_lib import parse` builds them from text):

```text
'P'                    a symbol             ('~', A)          ¬A
('&', A, B, ...)       A ∧ B ∧ ...          ('|', A, B, ...)  A ∨ B ∨ ...
('=>', A, B)           A ⇒ B                ('<=>', A, B)     A ⇔ B
parse('(P & Q) => R')  == ('=>', ('&', 'P', 'Q'), 'R')
```

Write:

1. `pl_true(f, model)` — the truth value of `f` in a **complete** model `{symbol: bool}`, by recursion on the
   connectives (truth tables of §7.4.2; remember: $A \Rightarrow B$ is false only when $A$ is true and $B$ false).
2. `tt_entails(kb, alpha)` — `kb` is a **list** of formulas (their conjunction). Enumerate all the $2^n$
   models over the symbols of `kb` and `alpha` (`itertools.product([True, False], repeat=n)`); return `False` as
   soon as one model makes every KB formula true and `alpha` false.
3. `is_valid(alpha)` and `is_satisfiable(alpha)`, as one-liners on top of `tt_entails`
   (valid = entailed by the empty KB; satisfiable = its negation is not valid).

Example (the wumpus KB of §7.4.3): $R_1..R_5 \models \neg P_{1,2}$, but neither $P_{2,2}$ nor $\neg P_{2,2}$.
"""

STARTER = '''import itertools

def pl_true(f, model: dict[str, bool]) -> bool:
    """Truth value of formula f (nested tuples) in a complete model."""
    if isinstance(f, str):
        return model[f]
    op, args = f[0], f[1:]
    # TODO: '~', '&', '|', '=>', '<=>'
    raise ValueError(op)

def symbols_of(f) -> set[str]:
    return {f} if isinstance(f, str) else set().union(*(symbols_of(g) for g in f[1:]))

def tt_entails(kb: list, alpha) -> bool:
    """True iff alpha is true in every model of the conjunction of kb."""
    syms = sorted(set().union(*(symbols_of(f) for f in kb), symbols_of(alpha)))
    # TODO: enumerate the models
    return False

def is_valid(alpha) -> bool:
    return False   # TODO

def is_satisfiable(alpha) -> bool:
    return False   # TODO
'''

SOLUTION = '''import itertools

def pl_true(f, model: dict[str, bool]) -> bool:
    """Truth value of formula f (nested tuples) in a complete model."""
    if isinstance(f, str):
        return model[f]
    op, args = f[0], f[1:]
    if op == '~':
        return not pl_true(args[0], model)
    if op == '&':
        return all(pl_true(a, model) for a in args)
    if op == '|':
        return any(pl_true(a, model) for a in args)
    if op == '=>':
        return not pl_true(args[0], model) or pl_true(args[1], model)
    if op == '<=>':
        return pl_true(args[0], model) == pl_true(args[1], model)
    raise ValueError(op)

def symbols_of(f) -> set[str]:
    return {f} if isinstance(f, str) else set().union(*(symbols_of(g) for g in f[1:]))

def tt_entails(kb: list, alpha) -> bool:
    """True iff alpha is true in every model of the conjunction of kb."""
    syms = sorted(set().union(*(symbols_of(f) for f in kb), symbols_of(alpha)))
    for values in itertools.product([True, False], repeat=len(syms)):
        model = dict(zip(syms, values))
        if all(pl_true(f, model) for f in kb) and not pl_true(alpha, model):
            return False          # a model of the KB where alpha is false: counterexample
    return True

def is_valid(alpha) -> bool:
    return tt_entails([], alpha)

def is_satisfiable(alpha) -> bool:
    return not is_valid(('~', alpha))
'''

HINTS = [
    'Implication: `not pl_true(A) or pl_true(B)`. Biconditional: the two sides have the same value.',
    'In `tt_entails`, a model where the KB is false says nothing: skip it. Only a model where the KB is true and '
    'alpha false is a counterexample.',
    'The empty KB is true in every model, so `tt_entails([], alpha)` checks validity. '
    'Satisfiable means "not unsatisfiable": $\\alpha$ is unsatisfiable iff $\\neg\\alpha$ is valid.',
]

EXPLANATION = r"""
**Why it is right.** `tt_entails` is the definition $M(KB) \subseteq M(\alpha)$ turned into a loop: it looks for a
model in $M(KB) \setminus M(\alpha)$. It is sound and complete, and always terminates — but takes $2^n$ models
(AIMA's recursive TT-CHECK-ALL enumerates the same models depth-first in $O(n)$ space).

**What the tests show.**
- Wumpus (§7.4.3): the KB entails $\neg P_{1,2}$ and $P_{2,2} \vee P_{3,1}$ but not $P_{2,2}$: the agent knows
  "a pit in [2,2] or [3,1]" without knowing which.
- An **inconsistent** KB ($A$ and $\neg A$) has no models, so the loop never finds a counterexample: it entails
  everything (exam 8 Jul 2025, Q3).
- $\alpha \vee \neg\alpha \vee A$ is valid; $R$ alone is satisfiable but not valid (exam 16 Jan 2025, Q2).
- Deduction theorem: $KB \models \alpha$ iff $\bigwedge KB \Rightarrow \alpha$ is valid — the last test checks it.
"""

ENTRY = 'tt_entails'

_W = [parse(s) for s in ['~P11', 'B11 <=> (P12 | P21)', 'B21 <=> (P11 | P22 | P31)', '~B11', 'B21']]
_JUL22 = [parse(s) for s in ['P', '(P & Q) => R', '(S | T) => Q', 'T']]
_JAN24 = [parse(s) for s in ['P & L => D', 'D & T => AH', 'C | A => TH', 'AH & TH => S']]


def _pt(f, model):
    return lambda sol: sol.pl_true(parse(f), model)


TESTS = [
    Test('pl_true: implication with a false premise', call=_pt('P => Q', {'P': False, 'Q': False}), expected=True,
         show='P ⇒ Q with P=false, Q=false'),
    Test('pl_true: implication true ⇒ false', call=_pt('P => Q', {'P': True, 'Q': False}), expected=False,
         show='P ⇒ Q with P=true, Q=false'),
    Test('pl_true: precedence ¬A ∧ B ∨ C', call=_pt('~A & B | C', {'A': True, 'B': True, 'C': True}), expected=True,
         show='¬A ∧ B ∨ C = ((¬A) ∧ B) ∨ C, all true'),
    Test('pl_true: biconditional', call=_pt('B11 <=> (P12 | P21)', {'B11': False, 'P12': False, 'P21': True}),
         expected=False, show='B11 ⇔ (P12 ∨ P21), B11=false, P21=true'),
    Test('wumpus: KB ⊨ ¬P12', args=(_W, parse('~P12')), expected=True, show='R1..R5 ⊨ ¬P12 ?'),
    Test('wumpus: KB ⊭ P22', args=(_W, parse('P22')), expected=False, show='R1..R5 ⊨ P22 ?'),
    Test('wumpus: KB ⊭ ¬P22', args=(_W, parse('~P22')), expected=False, show='R1..R5 ⊨ ¬P22 ?'),
    Test('wumpus: KB ⊨ P22 ∨ P31', args=(_W, parse('P22 | P31')), expected=True, show='R1..R5 ⊨ P22 ∨ P31 ?'),
    Test('exam 14 Jul 2022: KB ⊨ R', args=(_JUL22, parse('R')), expected=True,
         show='P, (P ∧ Q) ⇒ R, (S ∨ T) ⇒ Q, T ⊨ R ?'),
    Test('exam 18 Jan 2024: KB ⊭ S', args=(_JAN24, parse('S')), expected=False,
         show='P∧L⇒D, D∧T⇒AH, C∨A⇒TH, AH∧TH⇒S ⊨ S ?'),
    Test('inconsistent KB entails anything', args=([parse('A'), parse('~A')], parse('Z')), expected=True,
         show='{A, ¬A} ⊨ Z ?'),
    Test('valid: α ∨ ¬α ∨ A (exam 8 Jul 2025)', call=lambda sol: sol.is_valid(parse('(P & Q) | ~(P & Q) | A')),
         expected=True, show='is_valid((P ∧ Q) ∨ ¬(P ∧ Q) ∨ A)'),
    Test('R is satisfiable but not valid (exam 16 Jan 2025)',
         call=lambda sol: (sol.is_valid('R'), sol.is_satisfiable('R')), expected=(False, True),
         show='(is_valid(R), is_satisfiable(R))'),
    Test('P ∧ ¬P is unsatisfiable', call=lambda sol: sol.is_satisfiable(parse('P & ~P')), expected=False,
         show='is_satisfiable(P ∧ ¬P)'),
    Test('deduction theorem', call=lambda sol: sol.is_valid(('=>', ('&', *_JUL22), 'R')), expected=True,
         show='is_valid((P ∧ (P∧Q⇒R) ∧ (S∨T⇒Q) ∧ T) ⇒ R)'),
]
