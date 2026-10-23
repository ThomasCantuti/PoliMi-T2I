from harness import Test
from logic_lib import check_proof, check_cnf

TITLE = 'Exam · Resolution refutations (2022–2026)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'resolution', 'Jun 2026', 'Jun 2025', 'Jan 2025', 'Jun 2023', 'Jul 2022', 'refutation', 'unit resolution']

STATEMENT = r"""
*Written exams of 14 Jul 2022 (Q1, 8 points with Q2–Q3), 14 Jun 2023 (Q3), 16 Jan 2025 (Q1), 11 Jun 2025 (Q2)
and 11 Jun 2026 (Q2).* "Apply the resolution algorithm to prove that…". Write the proof exactly as on paper:
the KB clauses are numbered as below; **you add the negated query** (one or more clauses, numbered next), then
each new clause with the numbers of its two parents, ending with the empty clause `'⊥'`.

Each function returns `(negated_query, steps)`: `negated_query` is a list of clause strings (the CNF of
$\neg\alpha$), `steps` a list of `(clause, i, j)`. Example of the format for KB = {1. $A$, 2. $\neg A \vee B$}, query $B$:
`(['~B'], [('~A', 2, 3), ('⊥', 1, 4)])` — clause 3 is $\neg B$, clause 4 is $\neg A$ from 2 and 3, clause 5 is ⊥.

**`jul22()`** — 14 Jul 2022 (same KB as 16 Jan 2025): $P$, $(P \wedge Q) \Rightarrow R$, $(S \vee T) \Rightarrow Q$, $T$;
prove $R$ **with the unit resolution strategy** (every step has a unit clause among its parents). CNF:
`1. P   2. ~P | ~Q | R   3. ~S | Q   4. ~T | Q   5. T`

**`jun23()`** — 14 Jun 2023: prove that **it is not raining**, "using your intuition in order to minimize the length
of the proof" (at most 3 resolution steps). CNF:
`1. ~Swimming | Wet   2. ~Raining | ~Outside | Wet   3. ~Warm | Raining | Pleasant   4. ~Wet   5. Outside   6. Warm`

**`jun25()`** — 11 Jun 2025: prove that the KB entails $IWin$. CNF:
`1. Heads | Tails   2. ~Heads | ~Tails   3. ~Heads | IWin   4. ~Tails | YouLose   5. ~YouLose | IWin   6. ~IWin | YouLose`

**`jun26()`** — 11 Jun 2026: prove that the package is delivered on time ($T$). CNF:
`1. ~O | P | R   2. ~S | D | B   3. ~R | ~M | ~D   4. D | T   5. ~B | T   6. O   7. ~P   8. M   9. ~B`
"""

STARTER = '''def jul22():
    negated_query = []          # clause 6
    steps = []                  # (clause, i, j) for clauses 7, 8, ...
    return negated_query, steps

def jun23():
    return [], []

def jun25():
    return [], []

def jun26():
    return [], []
'''

SOLUTION = '''def jul22():
    negated_query = ['~R']                                   # 6
    steps = [('~P | ~Q', 2, 6),                              # 7
             ('~Q', 1, 7),                                   # 8
             ('~T', 4, 8),                                   # 9
             ('⊥', 5, 9)]                                    # 10
    return negated_query, steps

def jun23():
    return ['Raining'], [('~Outside | Wet', 2, 7), ('~Outside', 4, 8), ('⊥', 5, 9)]

def jun25():
    return ['~IWin'], [('~Heads', 3, 7), ('Tails', 1, 8), ('YouLose', 4, 9), ('IWin', 5, 10), ('⊥', 7, 11)]

def jun26():
    return ['~T'], [('P | R', 1, 6), ('R', 7, 11), ('~M | ~D', 3, 12), ('~D', 8, 13), ('T', 4, 14), ('⊥', 10, 15)]
'''

HINTS = [
    'The negated query of "it is not raining" is $\\neg\\neg Raining = Raining$. The negated query of $R$ is $\\neg R$.',
    'Short proofs start from the negated query and chase it backwards: $\\neg R$ with $\\neg P \\vee \\neg Q \\vee R$ gives '
    '$\\neg P \\vee \\neg Q$, then cancel $\\neg P$ with the fact $P$, and so on until a fact contradicts what is left.',
    'Each step cancels **one** complementary pair. Number the new clauses consecutively after the negated query.',
]

EXPLANATION = r"""
Official proofs (the test accepts any correct one):

- **14 Jul 2022** (unit strategy), with 6. $\neg R$: 7. $\neg Q \vee R$ (1, 2), 8. $Q$ (4, 5), 9. $\neg P \vee \neg Q$ (2, 6),
  10. $\neg Q$ (6, 7), 11. ⊥ (8, 10). Every step has a unit parent. **16 Jan 2025** (same KB): 6. $\neg P \vee \neg Q$
  (2, 5), 7. $\neg Q$ (1, 6), 8. $\neg T$ (3b, 7), 9. ⊥ (4, 8).
- **14 Jun 2023**, with 7. $Raining$: 8. $\neg Outside \vee Wet$ (2, 7), 9. $\neg Outside$ (4, 8), 10. ⊥ (5, 9). Every step
  uses a unit clause **and** an input clause: it is both a unit and an input resolution proof (Q4).
- **11 Jun 2025**, with 7. $\neg IWin$: 8. $\neg Heads$ (3, 7), 9. $Tails$ (1, 8), 10. $YouLose$ (4, 9), 11. $IWin$ (5, 10), 12. ⊥ (7, 11).
- **11 Jun 2026**, with 10. $\neg T$: 11. $P \vee R$ (1, 6), 12. $R$ (7, 11), 13. $\neg M \vee \neg D$ (3, 12), 14. $\neg D$ (8, 13),
  15. $T$ (4, 14), 16. ⊥ (10, 15).

**What to write after the proof** (Q2 of 2022, Q5 of 2023): $KB \cup \{\neg\alpha\} \vdash_R \bot$; resolution is sound,
so $KB \wedge \neg\alpha$ is unsatisfiable, and by the **refutation theorem** $KB \models \alpha$ (AIMA §7.5).
Equivalently in terms of models: no model of the KB makes $\alpha$ false.

Trap: in 2023 the query is already negative. Adding "¬Raining" again (instead of $Raining$) gives nothing to refute.
"""

ENTRY = 'jul22'

_KB = {
    'jul22': (['P', '~P | ~Q | R', '~S | Q', '~T | Q', 'T'], '~R', 'unit', None),
    'jun23': (['~Swimming | Wet', '~Raining | ~Outside | Wet', '~Warm | Raining | Pleasant', '~Wet', 'Outside', 'Warm'],
              'Raining', None, 3),
    'jun25': (['Heads | Tails', '~Heads | ~Tails', '~Heads | IWin', '~Tails | YouLose', '~YouLose | IWin',
               '~IWin | YouLose'], '~IWin', None, None),
    'jun26': (['~O | P | R', '~S | D | B', '~R | ~M | ~D', 'D | T', '~B | T', 'O', '~P', 'M', '~B'], '~T', None, None),
}


def _check(fn):
    kb, negq, strategy, max_steps = _KB[fn]

    def check(got):
        if not isinstance(got, tuple) or len(got) != 2:
            return False, 'Return a pair (negated_query, steps).'
        neg_query, steps = got
        ok, msg = check_cnf(neg_query, [negq])
        if not ok:
            return False, 'negated query: ' + msg
        ok, msg = check_proof(kb + list(neg_query), steps, strategy)
        if not ok:
            return False, msg
        if max_steps and len(steps) > max_steps:
            return False, f'Correct, but {len(steps)} steps: the official proof needs only {max_steps}.'
        return True
    return check


TESTS = [
    Test('14 Jul 2022: KB ⊨ R with unit resolution', call=lambda sol: sol.jul22(), check=_check('jul22'), show='jul22()'),
    Test('14 Jun 2023: KB ⊨ ¬Raining in at most 3 steps', call=lambda sol: sol.jun23(), check=_check('jun23'),
         show='jun23()'),
    Test('11 Jun 2025: KB ⊨ IWin', call=lambda sol: sol.jun25(), check=_check('jun25'), show='jun25()'),
    Test('11 Jun 2026: KB ⊨ T', call=lambda sol: sol.jun26(), check=_check('jun26'), show='jun26()'),
]
