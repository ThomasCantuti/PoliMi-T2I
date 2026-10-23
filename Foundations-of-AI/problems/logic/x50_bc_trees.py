from harness import Test
from logic_lib import definite

TITLE = 'Exam · Backward-chaining trees (Jan 2023, Feb 2025)'
DIFFICULTY = 'hard'
KIND = 'code'
TAGS = ['exam', 'backward chaining', 'Feb 2025', 'Jan 2023', 'AND-OR tree', 'backtracking']

STATEMENT = r"""
*Written exams of 3 Feb 2025 (Q1) and 18 Jan 2023 (Q1).* "Apply the backward chaining algorithm, considering the
formulas in the top-down order in which they are written … Report the tree built by the algorithm, with all the
nodes that have been generated, and indicate where the algorithm backtracks."

Write `bc_tree(kb, goal)` that returns the tree drawn in the official solutions. KB format as in problem 50
(`definite('B & C => A') == (('B', 'C'), 'A')`, facts `((), 'P')`). A node is a tuple
`(symbol, result, branches)`:

- `result` is `True` (proved ✓), `False` (failed ✗) or `None` (drawn but **not expanded**);
- `branches` has one list per rule **tried** for the symbol (in KB order), containing the nodes of that rule's
  premises (an AND arc when there are several).

Drawing conventions of the official trees:

1. a **fact** is a leaf ✓: `('P', True, [])`;
2. otherwise try the rules concluding the symbol in KB order; expand the premises left to right; at the first
   failing premise the rule fails and its **remaining premises are drawn but not expanded** (`(s, None, [])`);
3. the first rule whose premises all succeed proves the symbol: the later rules are **not tried** (not drawn);
4. a symbol already proved or already failed earlier in the tree is a leaf with that result and is **not expanded
   again**; a symbol with no rule is a leaf ✗. (The exam KBs have no cycles; for safety, treat a symbol already on
   the current path as a failed leaf.)

3 Feb 2025, KB in this order: $(B \wedge C) \Rightarrow A$, $J \Rightarrow B$, $P \Rightarrow D$, $K \Rightarrow G$, $G \Rightarrow A$,
$K \Rightarrow B$, $M \Rightarrow F$, $F \Rightarrow G$, $H \Rightarrow A$, $M \Rightarrow D$, $P \Rightarrow F$, $M \Rightarrow K$, $P$; goal $A$:

```text
A ✓
├── [B ∧ C]   B ✗  ├── J ✗
│                  └── K ✗ ── M ✗
│             C    (not expanded)
└── [G]       G ✓  ├── K ✗  (already failed: not expanded)
                   └── F ✓  ├── M ✗
                            └── P ✓
```
"""

STARTER = '''def bc_tree(kb: list[tuple[tuple[str, ...], str]], goal: str):
    known: dict[str, bool] = {}        # symbols already proved (True) or failed (False)

    def expand(symbol: str, path: frozenset):
        # TODO: conventions 1-4
        return (symbol, False, [])

    return expand(goal, frozenset())
'''

SOLUTION = '''def bc_tree(kb: list[tuple[tuple[str, ...], str]], goal: str):
    known: dict[str, bool] = {}        # symbols already proved (True) or failed (False)

    def expand(symbol: str, path: frozenset):
        if symbol in known:
            return (symbol, known[symbol], [])          # not expanded again
        if symbol in path:
            return (symbol, False, [])                  # loop check
        if ((), symbol) in kb:
            known[symbol] = True
            return (symbol, True, [])                   # fact
        branches = []
        for premises, conclusion in kb:
            if conclusion != symbol or not premises:
                continue
            nodes, ok = [], True
            for p in premises:
                if ok:
                    node = expand(p, path | {symbol})
                    ok = node[1]
                else:
                    node = (p, None, [])                # drawn, not expanded
                nodes.append(node)
            branches.append(nodes)
            if ok:
                known[symbol] = True
                return (symbol, True, branches)
        known[symbol] = False
        return (symbol, False, branches)

    return expand(goal, frozenset())
'''

HINTS = [
    'Check, in this order: already known → leaf with the known result; on the current path → failed leaf; fact → '
    'proved leaf; otherwise loop over the rules that conclude the symbol.',
    'Inside a rule keep a flag `ok`: while it is true, expand the next premise and update `ok` with its result; once '
    'it is false, append the remaining premises as `(p, None, [])`.',
    'Record the result in `known` before returning, both for success and failure: that is what keeps K from being '
    'expanded a second time under G.',
]

EXPLANATION = r"""
**3 Feb 2025.** B is tried first (rule 1): $J$ has no rule ✗, $K$ needs $M$ which has no rule ✗, so $B$ fails and
the conjunct $C$ is **not expanded** — "backward chaining does not continue downward here: why?" Because the rule
$(B \wedge C) \Rightarrow A$ already failed: proving $C$ could not help. BC backtracks to the next rule for $A$,
$G \Rightarrow A$. Under $G$, $K$ is again not expanded: it **already failed** (AIMA §7.5.4: avoid repeated work by
remembering failed subgoals). $F \Rightarrow G$: $M$ ✗, then $P$ is a fact ✓. $H \Rightarrow A$ is never tried.

**18 Jan 2023, "worst case".** For $C$ there are two rules; the worst case tries $G \wedge E \Rightarrow C$ first
(it is also the KB order): $G$ has no rule ✗ and $E$ is left unexpanded; then $D \wedge E \Rightarrow C$ succeeds through
$D \leftarrow F \leftarrow H$ and $E \leftarrow H$ ($H$ already proved: a leaf).

**Q2 of both exams** — $KB \vdash_{BC} A$ holds because BC found a proof; $KB \models A$ holds because BC is **sound**
(and complete) for definite clauses. FC would reach the same result for the same reason (3 Feb 2025, Q2); neither
derives $A \wedge D$ in one run, only symbols (Q3–Q4).
"""

ENTRY = 'bc_tree'


def _kb(*rules):
    return [definite(r) for r in rules]


_FEB25 = _kb('B & C => A', 'J => B', 'P => D', 'K => G', 'G => A', 'K => B', 'M => F', 'F => G', 'H => A',
             'M => D', 'P => F', 'M => K', 'P')
_JAN23 = _kb('A => B', 'C => A', 'G & E => C', 'F => D', 'D & E => C', 'H => E', 'H => F', 'H')

_FEB25_TREE = ('A', True, [
    [('B', False, [[('J', False, [])], [('K', False, [[('M', False, [])]])]]), ('C', None, [])],
    [('G', True, [[('K', False, [])], [('F', True, [[('M', False, [])], [('P', True, [])]])]])],
])
_JAN23_TREE = ('B', True, [[('A', True, [[('C', True, [
    [('G', False, []), ('E', None, [])],
    [('D', True, [[('F', True, [[('H', True, [])]])]]), ('E', True, [[('H', True, [])]])],
])]])]])

TESTS = [
    Test('a fact', args=(_kb('P'), 'P'), expected=('P', True, []), show='KB = {P}, goal P'),
    Test('no rule for the goal', args=(_kb('P'), 'Q'), expected=('Q', False, []), show='KB = {P}, goal Q'),
    Test('second premise not expanded', args=(_kb('B & C => A', 'C'), 'A'),
         expected=('A', False, [[('B', False, []), ('C', None, [])]]), show='B ∧ C ⇒ A, C; goal A'),
    Test('a failed symbol is not expanded twice', args=(_kb('K => B', 'M => K', 'K => G', 'B & G => A'), 'A'),
         expected=('A', False, [[('B', False, [[('K', False, [[('M', False, [])]])]]), ('G', None, [])]]),
         show='K⇒B, M⇒K, K⇒G, B∧G⇒A; goal A'),
    Test('3 Feb 2025: goal A', args=(_FEB25, 'A'), expected=_FEB25_TREE, show='13-formula KB, goal A'),
    Test('18 Jan 2023: goal B (worst case)', args=(_JAN23, 'B'), expected=_JAN23_TREE,
         show='A⇒B, C⇒A, G∧E⇒C, F⇒D, D∧E⇒C, H⇒E, H⇒F, H; goal B'),
    Test('loop check', args=(_kb('A => B', 'B => A', 'C => A', 'C'), 'B'),
         expected=('B', True, [[('A', True, [[('B', False, [])], [('C', True, [])]])]]),
         show='A⇒B, B⇒A, C⇒A, C; goal B'),
]
