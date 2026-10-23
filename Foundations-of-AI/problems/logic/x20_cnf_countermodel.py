from harness import Test
from logic_lib import check_cnf, check_formulas, pl_true, parse

TITLE = 'Exam · CNF of the exam KBs and a countermodel (2023–2026)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['exam', 'CNF', 'Jan 2024', 'Jul 2023', 'Jun 2025', 'Jun 2026', 'countermodel', 'entailment']

STATEMENT = r"""
*Written exams of 10 Jul 2023 (Q2), 18 Jan 2024 (Q3–Q4), 11 Jun 2025 (Q1, CNF column) and 11 Jun 2026 (first
part of Q2).* Return each CNF as a **list of clause strings** (`'~P | ~L | D'`, one clause per string, any order):
the test checks that every item is a clause and that their conjunction is equivalent to the KB.

**`cnf_jul23()`** — the KB of 10 Jul 2023: $POLIMI \Rightarrow Smart$, $Smart \wedge Study \Rightarrow Pass$,
$Lucky \wedge (Smart \vee Study) \Rightarrow Pass$.

**`cnf_jan24()`** — the KB of 18 Jan 2024: $P \wedge L \Rightarrow D$, $D \wedge T \Rightarrow AH$, $C \vee A \Rightarrow TH$,
$AH \wedge TH \Rightarrow S$.

**`countermodel_jan24()`** — Q3 of 18 Jan 2024: "Can you actually conclude that the patient will be saved?" No:
return a **complete model** (a dict over the 9 symbols `P L D T AH C A TH S`) in which the KB is true and
$S$ is false.

**`cnf_jun25()`** — the CNF column of the 2025 table, **one clause per row** (6 strings), for
$Heads \vee Tails$, $\neg Heads \vee \neg Tails$, $Heads \Rightarrow IWin$, $Tails \Rightarrow YouLose$,
$YouLose \Rightarrow IWin$, $IWin \Rightarrow YouLose$.

**`cnf_jun26()`** — the KB of 11 Jun 2026: $(O \wedge \neg P) \Rightarrow R$, $S \Rightarrow (D \vee B)$,
$(R \wedge M) \Rightarrow \neg D$, $(\neg D \vee B) \Rightarrow T$, $O \wedge \neg P \wedge M \wedge \neg B$.
"""

STARTER = '''def cnf_jul23() -> list[str]:
    return []

def cnf_jan24() -> list[str]:
    return []

def countermodel_jan24() -> dict[str, bool]:
    return {}

def cnf_jun25() -> list[str]:
    return []

def cnf_jun26() -> list[str]:
    return []
'''

SOLUTION = '''def cnf_jul23() -> list[str]:
    return ['~POLIMI | Smart', '~Smart | ~Study | Pass', '~Lucky | ~Smart | Pass', '~Lucky | ~Study | Pass']

def cnf_jan24() -> list[str]:
    return ['~P | ~L | D', '~D | ~T | AH', '~C | TH', '~A | TH', '~AH | ~TH | S']

def countermodel_jan24() -> dict[str, bool]:
    # every symbol false: each implication has a false premise
    return {s: False for s in ['P', 'L', 'D', 'T', 'AH', 'C', 'A', 'TH', 'S']}

def cnf_jun25() -> list[str]:
    return ['Heads | Tails', '~Heads | ~Tails', '~Heads | IWin', '~Tails | YouLose', '~YouLose | IWin', '~IWin | YouLose']

def cnf_jun26() -> list[str]:
    return ['~O | P | R', '~S | D | B', '~R | ~M | ~D', 'D | T', '~B | T', 'O', '~P', 'M', '~B']
'''

HINTS = [
    '$A \\wedge B \\Rightarrow C$ is one clause $\\neg A \\vee \\neg B \\vee C$; $A \\vee B \\Rightarrow C$ is **two** clauses '
    '$\\neg A \\vee C$ and $\\neg B \\vee C$; a conjunction of facts is one clause per fact.',
    '$(\\neg D \\vee B) \\Rightarrow T$: eliminate ⇒ to get $\\neg(\\neg D \\vee B) \\vee T = (D \\wedge \\neg B) \\vee T$, then distribute.',
    'Countermodel: every sentence of the 2024 KB is an implication. What is the truth value of an implication '
    'whose premise is false?',
]

EXPLANATION = r"""
Official CNFs:

- **10 Jul 2023**: $\neg POLIMI \vee Smart$, $\neg Smart \vee \neg Study \vee Pass$, $\neg Lucky \vee \neg Smart \vee Pass$,
  $\neg Lucky \vee \neg Study \vee Pass$ — the third statement splits in two (distribute $\vee$ over the $\wedge$ produced
  by $\neg(Smart \vee Study)$).
- **18 Jan 2024**: 1. $\neg P \vee \neg L \vee D$, 2. $\neg D \vee \neg T \vee AH$, 3.1 $\neg C \vee TH$, 3.2 $\neg A \vee TH$,
  4. $\neg AH \vee \neg TH \vee S$.
- **11 Jun 2025**: $Heads \vee Tails$, $\neg Heads \vee \neg Tails$, $\neg Heads \vee IWin$, $\neg Tails \vee YouLose$,
  $\neg YouLose \vee IWin$, $\neg IWin \vee YouLose$.
- **11 Jun 2026**: $\neg O \vee P \vee R$, $\neg S \vee D \vee B$, $\neg R \vee \neg M \vee \neg D$, $D \vee T$, $\neg B \vee T$, $O$,
  $\neg P$, $M$, $\neg B$ — statement 4 gives **two** clauses, statement 5 gives four unit clauses.

**18 Jan 2024, Q2–Q3.** To conclude that the patient is saved we must prove $KB \models S$: $S$ true in **every**
model of the KB. It does not hold: the KB only contains implications, so the model with **all symbols false**
satisfies it (every premise is false) and has $S$ false — a counterexample. Nothing says that the examination,
the analyses, the therapy or an ambulance are available: the KB has rules but no facts.
"""

ENTRY = 'cnf_jul23'

_JAN24 = ['P & L => D', 'D & T => AH', 'C | A => TH', 'AH & TH => S']
_SYMS24 = ['P', 'L', 'D', 'T', 'AH', 'C', 'A', 'TH', 'S']


def _countermodel(got):
    if not isinstance(got, dict) or set(got) != set(_SYMS24) or not all(isinstance(v, bool) for v in got.values()):
        return False, 'Return a dict with a bool for each of P, L, D, T, AH, C, A, TH, S.'
    bad = [f for f in _JAN24 if not pl_true(parse(f), got)]
    if bad:
        return False, f'The KB is false in your model: {bad[0]} is violated.'
    return (not got['S'], 'In your model S is true: it does not show that S fails to follow.')


TESTS = [
    Test('10 Jul 2023: CNF', call=lambda sol: sol.cnf_jul23(),
         check=lambda got: check_cnf(got, ['POLIMI => Smart', 'Smart & Study => Pass', 'Lucky & (Smart | Study) => Pass']),
         show='cnf_jul23()'),
    Test('18 Jan 2024: CNF', call=lambda sol: sol.cnf_jan24(), check=lambda got: check_cnf(got, _JAN24),
         show='cnf_jan24()'),
    Test('18 Jan 2024: a model of the KB where S is false', call=lambda sol: sol.countermodel_jan24(),
         check=_countermodel, show='countermodel_jan24()'),
    Test('11 Jun 2025: the CNF column, row by row', call=lambda sol: sol.cnf_jun25(),
         check=lambda got: check_formulas(got, ['Heads | Tails', '~Heads | ~Tails', 'Heads => IWin', 'Tails => YouLose',
                                                'YouLose => IWin', 'IWin => YouLose'],
                                          ['Heads', 'Tails', 'IWin', 'YouLose'], clauses=True),
         show='cnf_jun25()'),
    Test('11 Jun 2026: CNF', call=lambda sol: sol.cnf_jun26(),
         check=lambda got: check_cnf(got, ['(O & ~P) => R', 'S => (D | B)', '(R & M) => ~D', '(~D | B) => T',
                                           'O & ~P & M & ~B']),
         show='cnf_jun26()'),
]
