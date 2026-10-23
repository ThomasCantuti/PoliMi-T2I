from harness import Test
from logic_lib import definite

TITLE = 'Backward chaining with a loop check'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['backward chaining', 'definite clauses', 'AND-OR search', 'goal-driven']

STATEMENT = r"""
Backward chaining (AIMA §7.5.4) works **from the query**: $q$ is proved if it is a fact, or if for **some**
clause $p_1 \wedge \dots \wedge p_k \Rightarrow q$ **all** the premises can be proved, recursively. It is an
AND-OR depth-first search.

Write `bc_entails(kb, q)` returning `(proved, visited)` with the KB format of problem 50
(`(premises, conclusion)` pairs, facts have `()` premises). Conventions (the exams use the same):

- clauses with conclusion $q$ are tried in **KB order**, premises **left to right**; a fact is a clause with no
  premises, so it proves $q$ immediately (`all([])` is true);
- stop at the first clause whose premises are all proved; a clause fails at its first failing premise;
- **loop check**: a goal that is already on the current path of goals fails immediately (otherwise
  $A \wedge P \Rightarrow L$ inside the proof of $P$ would recurse forever);
- `visited` lists the goal of **every** call, in order (including the calls cut by the loop check). No memo:
  a goal proved earlier is proved again.

AIMA example ($P \Rightarrow Q$, $L \wedge M \Rightarrow P$, $B \wedge L \Rightarrow M$, $A \wedge P \Rightarrow L$,
$A \wedge B \Rightarrow L$, $A$, $B$), query $Q$:
`visited = ['Q', 'P', 'L', 'A', 'P', 'A', 'B', 'M', 'B', 'L', 'A', 'P', 'A', 'B']` — the two `'P'` after `'A'`
are the loop check at work.
"""

STARTER = '''def bc_entails(kb: list[tuple[tuple[str, ...], str]], q: str) -> tuple[bool, list[str]]:
    visited: list[str] = []

    def prove(goal: str, path: list[str]) -> bool:
        visited.append(goal)
        # TODO: loop check, then try the clauses that conclude goal
        return False

    return prove(q, []), visited
'''

SOLUTION = '''def bc_entails(kb: list[tuple[tuple[str, ...], str]], q: str) -> tuple[bool, list[str]]:
    visited: list[str] = []

    def prove(goal: str, path: list[str]) -> bool:
        visited.append(goal)
        if goal in path:                        # loop: this goal is already being proved above us
            return False
        for premises, conclusion in kb:
            if conclusion == goal and all(prove(p, path + [goal]) for p in premises):
                return True
        return False

    return prove(q, []), visited
'''

HINTS = [
    'The path is the list of goals from the root to the current one: pass `path + [goal]` to the recursive calls.',
    '`all(...)` over a generator stops at the first `False`: that is exactly "a clause fails at its first failing '
    'premise" (the later premises are never called, so they do not appear in `visited`).',
    'A fact `((), goal)` makes `all(())` true: no special case needed.',
]

EXPLANATION = r"""
**Goal-driven.** BC only touches clauses relevant to the query. On exam 3 Feb 2025 it never looks at
$P \Rightarrow D$ or $M \Rightarrow D$, which forward chaining fires anyway. Its cost can be much less than
linear in the size of the KB.

**The loop check** makes it terminate and keeps it complete for definite clauses: a proof that needs $P$ to
prove $P$ is circular, and some other branch will find a real proof if one exists ($A \wedge B \Rightarrow L$
here).

**Avoiding repeated work** (AIMA §7.5.4): an efficient BC also remembers goals already **proved** and goals
already **failed**, so it does not expand them twice. Without that memo this implementation proves $L$ twice
in the AIMA example; the exam trees (problem x50) draw an already-failed goal as a leaf ✗ that is not
expanded again.

**$\vdash_{BC}$ vs $\models$** (exam 18 Jan 2023): if BC finds a proof, $KB \vdash_{BC} B$; since BC is sound,
$KB \models B$. If the KB is definite and BC fails, completeness gives $KB \not\models B$.
"""

ENTRY = 'bc_entails'


def _kb(*rules):
    return [definite(r) for r in rules]


_AIMA = _kb('P => Q', 'L & M => P', 'B & L => M', 'A & P => L', 'A & B => L', 'A', 'B')
_FEB25 = _kb('B & C => A', 'J => B', 'P => D', 'K => G', 'G => A', 'K => B', 'M => F', 'F => G', 'H => A',
             'M => D', 'P => F', 'M => K', 'P')
_JAN23 = _kb('A => B', 'C => A', 'G & E => C', 'F => D', 'D & E => C', 'H => E', 'H => F', 'H')

TESTS = [
    Test('a fact', args=(_kb('A'), 'A'), expected=(True, ['A']), show='KB = {A}, q = A'),
    Test('no clause for the goal', args=(_kb('A'), 'B'), expected=(False, ['B']), show='KB = {A}, q = B'),
    Test('AIMA example: Q', args=(_AIMA, 'Q'),
         expected=(True, ['Q', 'P', 'L', 'A', 'P', 'A', 'B', 'M', 'B', 'L', 'A', 'P', 'A', 'B']), show='AIMA KB, q = Q'),
    Test('pure loop', args=(_kb('A => B', 'B => A'), 'A'), expected=(False, ['A', 'B', 'A']), show='A⇒B, B⇒A; q = A'),
    Test('exam 3 Feb 2025: A', args=(_FEB25, 'A'),
         expected=(True, ['A', 'B', 'J', 'K', 'M', 'G', 'K', 'M', 'F', 'M', 'P']), show='13-formula KB, q = A'),
    Test('exam 3 Feb 2025: D', args=(_FEB25, 'D'), expected=(True, ['D', 'P']), show='13-formula KB, q = D'),
    Test('exam 18 Jan 2023: B', args=(_JAN23, 'B'),
         expected=(True, ['B', 'A', 'C', 'G', 'D', 'F', 'H', 'E', 'H']), show='A⇒B, C⇒A, G∧E⇒C, F⇒D, D∧E⇒C, H⇒E, H⇒F, H'),
    Test('exam 18 Jan 2023: G fails', args=(_JAN23, 'G'), expected=(False, ['G']), show='same KB, q = G'),
]
