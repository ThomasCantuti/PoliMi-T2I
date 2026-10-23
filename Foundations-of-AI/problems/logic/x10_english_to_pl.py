from harness import Test
from logic_lib import check_formulas

TITLE = 'Exam · From English to propositional logic (2023–2026)'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['exam', 'translation', 'Jun 2026', 'Jun 2025', 'Jan 2024', 'Jul 2023', 'Jun 2023', 'knowledge base']

STATEMENT = r"""
*Written exams of 14 Jun 2023, 10 Jul 2023, 18 Jan 2024, 11 Jun 2025 and 11 Jun 2026 — Question 1 of the
logic problem.* "Convert the statements into a Knowledge Base in propositional logic", one sentence per
statement. Each function returns a **list of strings**, one formula per statement in order, written with
`~ & | => <=>` (or `¬ ∧ ∨ → ⇔`) and parentheses, using **only the given symbols**. The tests accept any
**equivalent** formula and, when yours is wrong, show a model where it disagrees with the intended meaning.

**`jun23()`** — symbols `Swimming, Wet, Raining, Outside, Warm, Pleasant`:
(1) If you go swimming you will get wet. (2) If it is raining and you are outside then you will get wet.
(3) If it is warm and there is no rain then it is a pleasant day. (4) You are not wet. (5) You are outside.
(6) It is a warm day.

**`jul23()`** — symbols `POLIMI, Smart, Study, Lucky, Pass`:
(1) POLIMI students are smart. (2) If a student is smart and studies, then the student will pass the exam.
(3) If a student is lucky and, in addition, the student is smart or studies, then the student will pass the exam.

**`jan24()`** — symbols `P` (physical examination ready), `L` (laboratory results ready), `D` (diagnosis
available), `T` (therapy available), `AH` (admitted to the hospital), `C` (car ambulance available), `A` (air
ambulance available), `TH` (transferred to the hospital), `S` (saved):
(1) The diagnosis is available if both the physical examination and the laboratory analysis results are ready.
(2) The patient is admitted to the hospital if the diagnosis and the therapy are available.
(3) The patient is transferred to the hospital if the car ambulance or the air ambulance is available.
(4) The patient is saved if the patient is transferred to the hospital and admitted to the hospital.

**`jun25()`** — "heads I win, tails you lose", symbols `Heads, Tails, IWin, YouLose`:
(1) Either heads or tails is true. (2) Either heads or tails is false. (3) I win if heads is true.
(4) You lose if tails is true. (5) If you lose, I win. (6) I win, you lose (read: if I win, you lose).

**`jun26()`** — warehouse robot, symbols `O` (detects an obstacle), `P` (path is clear), `S` (must stop),
`R` (replans its route), `M` (map is updated), `B` (backup robot available), `D` (delivery delayed), `T`
(package delivered on time; `D` and `T` are different symbols):
(1) If the robot detects an obstacle and the path is not clear, then it must replan its route.
(2) If the robot must stop, then the delivery is delayed unless a backup robot is available.
(3) If the robot replans its route and the map is updated, then the delivery is not delayed.
(4) If the delivery is not delayed or a backup robot is available, then the package will be delivered on time.
(5) The robot detects an obstacle, the path is not clear, the map is updated, and no backup robot is available.
"""

STARTER = '''def jun23() -> list[str]:
    return []   # 6 formulas

def jul23() -> list[str]:
    return []   # 3 formulas

def jan24() -> list[str]:
    return []   # 4 formulas

def jun25() -> list[str]:
    return []   # 6 formulas

def jun26() -> list[str]:
    return []   # 5 formulas
'''

SOLUTION = '''def jun23() -> list[str]:
    return ['Swimming => Wet', 'Raining & Outside => Wet', 'Warm & ~Raining => Pleasant', '~Wet', 'Outside', 'Warm']

def jul23() -> list[str]:
    return ['POLIMI => Smart', 'Smart & Study => Pass', 'Lucky & (Smart | Study) => Pass']

def jan24() -> list[str]:
    return ['P & L => D', 'D & T => AH', 'C | A => TH', 'AH & TH => S']

def jun25() -> list[str]:
    return ['Heads | Tails', '~Heads | ~Tails', 'Heads => IWin', 'Tails => YouLose', 'YouLose => IWin', 'IWin => YouLose']

def jun26() -> list[str]:
    return ['O & ~P => R', 'S => (D | B)', 'R & M => ~D', '(~D | B) => T', 'O & ~P & M & ~B']
'''

HINTS = [
    '"C if A and B" is $A \\wedge B \\Rightarrow C$: the condition after "if" is the **premise**, wherever it appears in '
    'the sentence.',
    '"D unless B" means "if not B then D": $\\neg B \\Rightarrow D$, i.e. $D \\vee B$. So (2) of 2026 is '
    '$S \\Rightarrow (D \\vee B)$.',
    '"Either heads or tails is false" = at least one of them is false: $\\neg Heads \\vee \\neg Tails$. A plain fact '
    '("you are outside") is just the symbol; a negative fact is a negated symbol; statement 5 of 2026 is one conjunction.',
]

EXPLANATION = r"""
Official translations (any equivalent form is fine):

| exam | formulas |
|---|---|
| 14 Jun 2023 | $Swimming \Rightarrow Wet$, $Raining \wedge Outside \Rightarrow Wet$, $Warm \wedge \neg Raining \Rightarrow Pleasant$, $\neg Wet$, $Outside$, $Warm$ |
| 10 Jul 2023 | $POLIMI \Rightarrow Smart$, $Smart \wedge Study \Rightarrow Pass$, $Lucky \wedge (Smart \vee Study) \Rightarrow Pass$ |
| 18 Jan 2024 | $P \wedge L \Rightarrow D$, $D \wedge T \Rightarrow AH$, $C \vee A \Rightarrow TH$, $AH \wedge TH \Rightarrow S$ |
| 11 Jun 2025 | $Heads \vee Tails$, $\neg Heads \vee \neg Tails$, $Heads \Rightarrow IWin$, $Tails \Rightarrow YouLose$, $YouLose \Rightarrow IWin$, $IWin \Rightarrow YouLose$ |
| 11 Jun 2026 | $(O \wedge \neg P) \Rightarrow R$, $S \Rightarrow (D \vee B)$, $(R \wedge M) \Rightarrow \neg D$, $(\neg D \vee B) \Rightarrow T$, $O \wedge \neg P \wedge M \wedge \neg B$ |

**"Why are these statements equivalent?"** (11 Jun 2026, statement 2): $S \Rightarrow (D \vee B)$,
$(S \wedge \neg B) \Rightarrow D$ and $(S \Rightarrow D) \vee B$ all become the **same clause**
$\neg S \vee D \vee B$ once implications are eliminated (and De Morgan applied to $\neg(S \wedge \neg B)$). Same CNF,
same models.

Traps: "if" vs "only if" (the premise is what follows "if"); "unless" = "or"; "either… or" in the exam means
inclusive or, with the exclusion stated separately (2025: statements 1 and 2 together make it exclusive);
the 2023 symbols are **imposed** ("using only the following symbols"), so "smart or studies" must stay a
disjunction inside the premise.
"""

ENTRY = 'jun23'

_EXPECTED = {
    'jun23': (['Swimming => Wet', 'Raining & Outside => Wet', 'Warm & ~Raining => Pleasant', '~Wet', 'Outside', 'Warm'],
              ['Swimming', 'Wet', 'Raining', 'Outside', 'Warm', 'Pleasant']),
    'jul23': (['POLIMI => Smart', 'Smart & Study => Pass', 'Lucky & (Smart | Study) => Pass'],
              ['POLIMI', 'Smart', 'Study', 'Lucky', 'Pass']),
    'jan24': (['P & L => D', 'D & T => AH', 'C | A => TH', 'AH & TH => S'],
              ['P', 'L', 'D', 'T', 'AH', 'C', 'A', 'TH', 'S']),
    'jun25': (['Heads | Tails', '~Heads | ~Tails', 'Heads => IWin', 'Tails => YouLose', 'YouLose => IWin',
               'IWin => YouLose'], ['Heads', 'Tails', 'IWin', 'YouLose']),
    'jun26': (['(O & ~P) => R', '(S & ~B) => D', '(R & M) => ~D', '(~D | B) => T', 'O & ~P & M & ~B'],
              ['O', 'P', 'S', 'R', 'M', 'B', 'D', 'T']),
}


def _t(name, fn):
    expected, allowed = _EXPECTED[fn]
    return Test(name, call=lambda sol: getattr(sol, fn)(), check=lambda got: check_formulas(got, expected, allowed),
                show=f'{fn}()')


TESTS = [
    _t('14 Jun 2023: swimming and rain', 'jun23'),
    _t('10 Jul 2023: POLIMI students', 'jul23'),
    _t('18 Jan 2024: the patient', 'jan24'),
    _t('11 Jun 2025: heads I win, tails you lose', 'jun25'),
    _t('11 Jun 2026: the warehouse robot', 'jun26'),
]
