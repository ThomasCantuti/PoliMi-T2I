from harness import Test
from logic_lib import parse, show, equivalent, counter_model

TITLE = 'Exercise book 5.1–5.2 · CNF step by step'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['exercise book', 'CNF', 'conversion steps', 'De Morgan']

STATEMENT = r"""
*Exercise book, exercises 5.1 and 5.2:* "Convert the formula in conjunctive normal form (CNF), reporting all
the steps and intermediate formulas."

For each formula return a list of **four strings**: the formula after step 1 (eliminate $\Leftrightarrow$), after
step 2 (eliminate $\Rightarrow$), after step 3 (move $\neg$ inwards) and after step 4 (distribute $\vee$ over $\wedge$). If a
step changes nothing, repeat the previous formula. Write them with `~ & | => <=>` (or `¬ ∧ ∨ ⇒ ⇔`) and parentheses.

The test checks that every intermediate formula is **equivalent** to the original and has the shape the step must
produce: no ⇔ after step 1; no ⇒ either after step 2; negations only in front of symbols after step 3; a
conjunction of clauses after step 4.

- `ex51()` — $U \Rightarrow (\neg T \Rightarrow (\neg S \wedge P))$
- `ex52()` — $A \Leftrightarrow (B \wedge C)$
"""

STARTER = '''def ex51() -> list[str]:
    return []

def ex52() -> list[str]:
    return []
'''

SOLUTION = '''def ex51() -> list[str]:
    return ['U => (~T => (~S & P))',
            '~U | (~~T | (~S & P))',
            '~U | T | (~S & P)',
            '(~U | T | ~S) & (~U | T | P)']

def ex52() -> list[str]:
    return ['(A => (B & C)) & ((B & C) => A)',
            '(~A | (B & C)) & (~(B & C) | A)',
            '(~A | (B & C)) & (~B | ~C | A)',
            '(~A | B) & (~A | C) & (~B | ~C | A)']
'''

HINTS = [
    '$\\alpha \\Rightarrow \\beta$ becomes $\\neg\\alpha \\vee \\beta$; for the inner implication, $\\neg T \\Rightarrow \\dots$ becomes '
    '$\\neg\\neg T \\vee \\dots$, and $\\neg\\neg T = T$ is a step-3 move.',
    'Step 3 for 5.2: $\\neg(B \\wedge C) = \\neg B \\vee \\neg C$ (De Morgan).',
    'Step 4: $\\neg A \\vee (B \\wedge C) = (\\neg A \\vee B) \\wedge (\\neg A \\vee C)$.',
]

EXPLANATION = r"""
Book answers:

- **5.1** $\neg U \vee (\neg T \Rightarrow (\neg S \wedge P))$, then $\neg U \vee T \vee (\neg S \wedge P)$ (implications eliminated, double
  negation removed), then distribution: $(\neg U \vee T \vee \neg S) \wedge (\neg U \vee T \vee P)$.
- **5.2** $(A \Rightarrow (B \wedge C)) \wedge ((B \wedge C) \Rightarrow A)$; $(\neg A \vee (B \wedge C)) \wedge (\neg(B \wedge C) \vee A)$;
  $(\neg A \vee (B \wedge C)) \wedge (\neg B \vee \neg C \vee A)$; $(\neg A \vee B) \wedge (\neg A \vee C) \wedge (\neg B \vee \neg C \vee A)$.

The book merges steps that change little (5.1 has no ⇔, so step 1 is empty). In the exam, write each
intermediate formula on its own line, naming the step: the conversion is graded step by step.
"""

ENTRY = 'ex51'


def _is_literal(f):
    return isinstance(f, str) or (f[0] == '~' and isinstance(f[1], str))


def _is_clause(f):
    return _is_literal(f) or (f[0] == '|' and all(_is_literal(g) for g in f[1:]))


def _ops(f):
    return set() if isinstance(f, str) else {f[0]} | set().union(*(_ops(g) for g in f[1:]))


def _nnf(f):
    if isinstance(f, str):
        return True
    if f[0] == '~':
        return isinstance(f[1], str)
    return all(_nnf(g) for g in f[1:])


_SHAPE = [
    ('no ⇔ left', lambda f: '<=>' not in _ops(f)),
    ('no ⇔ or ⇒ left', lambda f: not ({'<=>', '=>'} & _ops(f))),
    ('negation only in front of symbols, no ⇔ or ⇒', lambda f: not ({'<=>', '=>'} & _ops(f)) and _nnf(f)),
    ('a conjunction of clauses', lambda f: _is_clause(f) or (f[0] == '&' and all(_is_clause(g) for g in f[1:]))),
]


def _check(original):
    def check(got):
        if not isinstance(got, (list, tuple)) or len(got) != 4:
            return False, 'Return the four intermediate formulas (after steps 1, 2, 3, 4).'
        for k, (text, (what, ok)) in enumerate(zip(got, _SHAPE), 1):
            try:
                f = parse(text)
            except (ValueError, AttributeError) as e:
                return False, f'step {k}: {e}'
            if not equivalent(f, original):
                m = counter_model(f, original)
                return False, f'step {k}: {show(f)} is not equivalent to the original (they differ in {m}).'
            if not ok(f):
                return False, f'step {k}: {show(f)} is equivalent, but after step {k} the formula must have {what}.'
        return True
    return check


TESTS = [
    Test('exercise 5.1', call=lambda sol: sol.ex51(), check=_check(parse('U => (~T => (~S & P))')), show='ex51()'),
    Test('exercise 5.2', call=lambda sol: sol.ex52(), check=_check(parse('A <=> (B & C)')), show='ex52()'),
]
