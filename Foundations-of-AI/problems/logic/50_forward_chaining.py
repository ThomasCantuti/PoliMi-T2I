from harness import Test
from logic_lib import definite

TITLE = 'Forward chaining with counts (PL-FC-ENTAILS)'
DIFFICULTY = 'medium'
KIND = 'code'
TAGS = ['forward chaining', 'definite clauses', 'Modus Ponens', 'agenda']

STATEMENT = r"""
Forward chaining (AIMA §7.5.4) decides $KB \models q$ for a KB of **definite clauses** and a symbol $q$:

```text
function PL-FC-ENTAILS?(KB, q) returns true or false
    count <- a table, count[c] = the number of symbols in c's premise
    inferred <- a table, inferred[s] = false for all symbols
    queue <- a queue of symbols, initially the symbols known to be true in KB
    while queue is not empty do
        p <- POP(queue)
        if p = q then return true
        if inferred[p] = false then
            inferred[p] <- true
            for each clause c in KB where p is in c.PREMISE do
                decrement count[c]
                if count[c] = 0 then add c.CONCLUSION to queue
    return false
```

The KB is a list of `(premises, conclusion)` pairs: `(('L', 'M'), 'P')` is $L \wedge M \Rightarrow P$ and
`((), 'A')` is the fact $A$ (`from logic_lib import definite`: `definite('L & M => P')` builds them).

Write `fc_entails(kb, q)` returning `(entailed, trace)`, where `trace` lists the symbols **popped and processed**
in order (popped symbols already inferred are skipped, not listed); when $q$ is popped, append it and stop.
Conventions: FIFO queue (`collections.deque`), initial facts in KB order, clauses scanned in KB order.

AIMA example: $P \Rightarrow Q$, $L \wedge M \Rightarrow P$, $B \wedge L \Rightarrow M$, $A \wedge P \Rightarrow L$,
$A \wedge B \Rightarrow L$, $A$, $B$ with $q = Q$ gives `(True, ['A', 'B', 'L', 'M', 'P', 'Q'])`.
"""

STARTER = '''from collections import deque

def fc_entails(kb: list[tuple[tuple[str, ...], str]], q: str) -> tuple[bool, list[str]]:
    count = [len(premises) for premises, _ in kb]
    inferred: set[str] = set()
    queue = deque(conclusion for premises, conclusion in kb if not premises)
    trace: list[str] = []
    # TODO
    return False, trace
'''

SOLUTION = '''from collections import deque

def fc_entails(kb: list[tuple[tuple[str, ...], str]], q: str) -> tuple[bool, list[str]]:
    count = [len(premises) for premises, _ in kb]
    inferred: set[str] = set()
    queue = deque(conclusion for premises, conclusion in kb if not premises)
    trace: list[str] = []
    while queue:
        p = queue.popleft()
        if p in inferred:
            continue
        trace.append(p)
        if p == q:
            return True, trace
        inferred.add(p)
        for k, (premises, conclusion) in enumerate(kb):
            if p in premises:
                count[k] -= 1
                if count[k] == 0:
                    queue.append(conclusion)
    return False, trace
'''

HINTS = [
    'Pop from the left; skip a symbol that is already inferred (it can be added twice by two different rules).',
    'For every clause whose premise contains `p`, decrement its counter; at zero, all its premises are known: '
    'append its conclusion to the queue.',
    'Check `p == q` right after popping it (after appending it to the trace).',
]

EXPLANATION = r"""
**Why the counters.** `count[c]` is the number of premises of `c` not yet known. Each symbol is processed once
and decrements the counters of the clauses it appears in, so the total work is **linear** in the size of the
KB — much better than the $2^n$ of model checking.

**Soundness**: every addition is an application of Modus Ponens. **Completeness** (for definite clauses):
at the fixed point, consider the model where exactly the inferred symbols are true. Every clause is true in it
(if all premises were true, the conclusion would have been inferred), so it is a model of the KB; any symbol
entailed by the KB is true in every model of the KB, hence in this one, hence inferred.

**Exam 3 Feb 2025, Q2**: "could FC have been used instead of BC to derive $A$?" — yes: the KB is made of
definite clauses and both algorithms are sound and complete for them. The test below shows FC deriving
$P, D, F, G, A$: it also derives $D$, which is irrelevant to the goal (FC is **data-driven**). Neither FC nor
BC derives $A \wedge D$ in one run: they only conclude symbols.
"""

ENTRY = 'fc_entails'


def _kb(*rules):
    return [definite(r) for r in rules]


_AIMA = _kb('P => Q', 'L & M => P', 'B & L => M', 'A & P => L', 'A & B => L', 'A', 'B')
_FEB25 = _kb('B & C => A', 'J => B', 'P => D', 'K => G', 'G => A', 'K => B', 'M => F', 'F => G', 'H => A',
             'M => D', 'P => F', 'M => K', 'P')
_JAN23 = _kb('A => B', 'C => A', 'G & E => C', 'F => D', 'D & E => C', 'H => E', 'H => F', 'H')

TESTS = [
    Test('AIMA example: Q', args=(_AIMA, 'Q'), expected=(True, ['A', 'B', 'L', 'M', 'P', 'Q']), show='AIMA KB, q = Q'),
    Test('AIMA example: a fact is entailed at once', args=(_AIMA, 'A'), expected=(True, ['A']), show='AIMA KB, q = A'),
    Test('AIMA example: unknown symbol', args=(_AIMA, 'Z'), expected=(False, ['A', 'B', 'L', 'M', 'P', 'Q']),
         show='AIMA KB, q = Z'),
    Test('exam 3 Feb 2025: A', args=(_FEB25, 'A'), expected=(True, ['P', 'D', 'F', 'G', 'A']), show='13-formula KB, q = A'),
    Test('exam 3 Feb 2025: B is not entailed', args=(_FEB25, 'B'), expected=(False, ['P', 'D', 'F', 'G', 'A']),
         show='13-formula KB, q = B'),
    Test('exam 18 Jan 2023: B', args=(_JAN23, 'B'), expected=(True, ['H', 'E', 'F', 'D', 'C', 'A', 'B']),
         show='A⇒B, C⇒A, G∧E⇒C, F⇒D, D∧E⇒C, H⇒E, H⇒F, H; q = B'),
    Test('exam 18 Jan 2023: G is not entailed', args=(_JAN23, 'G'), expected=(False, ['H', 'E', 'F', 'D', 'C', 'A', 'B']),
         show='same KB, q = G'),
    Test('a conclusion reached twice is processed once',
         args=(_kb('A => C', 'B => C', 'C => D', 'A', 'B'), 'D'), expected=(True, ['A', 'B', 'C', 'D']),
         show='A⇒C, B⇒C, C⇒D, A, B; q = D'),
    Test('premise repeated in two rules', args=(_kb('A & B => C', 'A & C => D', 'B', 'A'), 'D'),
         expected=(True, ['B', 'A', 'C', 'D']), show='A∧B⇒C, A∧C⇒D, B, A; q = D'),
]
