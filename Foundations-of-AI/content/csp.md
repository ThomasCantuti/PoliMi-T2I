# Constraint Satisfaction Problems

A CSP is a search problem whose state has **structure**: a set of variables, each to be given a value, under
constraints. Opening up the state lets generic algorithms **prune** (forward checking, AC-3), **order** (MRV,
degree, LCV) and **decompose** (independent subproblems) – with no problem-specific heuristic at all
(slides p. 257–317, AIMA ch. 6).

## Intuition

Coloring a map with three colors by hand, nobody enumerates colorings. You color one region, immediately
cross off that color in the neighboring regions, attack the region with the fewest colors left, and the
moment some region has no color left you undo the last choice. That is the whole chapter:

- **backtracking** = one variable at a time, undo on failure;
- **filtering** = cross off colors that became impossible (forward checking, arc consistency);
- **ordering** = choose the most constrained region first (MRV), the least constraining color first (LCV);
- **structure** = Tasmania does not touch anything: color it separately.

> **Key idea:** if we **specialize the representation**, we can design more efficient search algorithms –
> at the price of tackling a narrower class of problems (p. 259).

## From black boxes to factored states (p. 258–266)

In standard search a state is a **black box**: the goal test only compares states, the successor function can
be anything. Two different reasons to search (p. 260):

| | planning | identification |
|---|---|---|
| we look for | a **sequence of actions** | an **assignment** to variables |
| what matters | the path (costs, depth) | the goal itself, **not the path** |
| examples | 8-puzzle, navigation | 8-queens, map coloring – **CSPs** |

In a CSP the state has a **factored representation**: a set of **variable–value pairs**. Because the
algorithm can look *inside* the state it can "empower" `actions()` and the goal test (p. 266): propagate
constraints to limit the available actions and identify failures **as soon as possible**.

> **Intuition:** plain DFS on map coloring (p. 263) happily assigns WA = R, NT = R, … and only discovers the
> clash at the end – it does not use the knowledge about the constraints while exploring the tree.

## Definition (p. 265)

A CSP consists of
- a set of **variables** $\{X_1, \dots, X_n\}$;
- for each variable a (usually finite) **domain** $D_i$ of possible values;
- a set of **constraints** $\{C_1, \dots, C_p\}$, each involving a subset of the variables and specifying the
  valid (or invalid) combinations of their values.

A **solution** is an assignment that is **complete** (every variable has a value) and **consistent** (every
constraint is satisfied). With domains of size $d$ there are $O(d^n)$ complete assignments.

In code (`csp_lib`, as in aima-python): `csp.variables`, `csp.domains[X]`, `csp.neighbors[X]`,
`csp.constraints(A, a, B, b)` → `True` if `A=a, B=b` is allowed. An assignment is a dict `{var: value}`.

## Examples

**Map coloring (p. 261).** Variables WA, NT, Q, NSW, V, SA, T; domains {red, green, blue}; adjacent regions
must differ. A solution: {WA=red, NT=green, Q=red, NSW=green, V=red, SA=blue, T=green}.

**8-queens (p. 267).** $X_i \in \{1, \dots, 8\}$ = row of the queen in column $i$. Constraints: $X_i \ne X_j$
(rows) and $|X_i - X_j| \ne |i - j|$ (diagonals). "One queen per column" is **implicit in the
representation**. Equivalent forms: $\textit{nonthreatening}(X_i, X_j)$, or the explicit list of allowed pairs
$(X_1, X_2) \in \{(1,3), (1,4), \dots\}$.

**Cryptarithmetic (p. 268).** TWO + TWO = FOUR. Variables F, T, U, W, R, O and the **carries** $C_1, C_2, C_3$;
digits $\{0, \dots, 9\}$. Constraints: $Alldiff(F, T, U, W, R, O)$, $O + O = R + 10\,C_1$,
$C_1 + W + W = U + 10\,C_2$, $C_2 + T + T = O + 10\,C_3$, $C_3 = F$. These involve 3 or more variables: drawn as
a **constraint hypergraph** (square nodes = constraints).

**Sudoku (p. 269).** One variable per open square, domain $\{1, \dots, 9\}$; 27 nine-way $Alldiff$ constraints
(9 rows, 9 columns, 9 regions).

**Task scheduling (homework, p. 270).** Four tasks with temporal constraints: T1 during T3, T2 completed
before T1 starts, T2 overlaps T3, T4 starts after T1 is complete. Formulation: variables = **start times**
$s_i$, domains = integer times within a horizon (task durations $d_i$ given), and one binary constraint per
sentence, e.g. "T1 during T3" is $s_3 \le s_1 \wedge s_1 + d_1 \le s_3 + d_3$. The constraint graph has the edges
T1–T2, T1–T3, T2–T3, T1–T4.

> **Exam trap:** "Are the constraints compatible?" depends on the interval semantics. If *overlap* only means
> "share some time", yes: $T_3 = [0,4)$, $T_2 = [0,2)$, $T_1 = [2,4)$, $T_4 = [4,5)$. If "T2 overlaps T3" is
> read as "T2 ends after T3 ends", then $e_3 < e_2 \le s_1 < e_1 \le e_3$: contradiction, answer **no**. State
> your semantics explicitly.

## Binary constraints and the constraint graph (p. 271)

We consider **binary** constraints (two variables). Higher-order constraints can be transformed into binary
ones (**binarization**): $Alldiff$ over $k$ variables = $\binom{k}{2}$ pairwise $\ne$; arithmetic constraints
need auxiliary variables. A binary CSP is drawn as a **constraint graph**: nodes = variables, edges =
constraints.

```text
       NT --- Q
      /  \   / \
    WA -- SA -- NSW        T
            \   /
              V
```

The graph structure can speed up search: it shows at once that **Tasmania is an independent subproblem**.

## Backtracking search (p. 272–275)

Basic uninformed **depth-first search** for CSPs, applying two principles (p. 273):

1. **One variable at a time.** Assignments are commutative ([WA = red then NT = green] is the same as
   [NT = green then WA = red]), so fix the order: each tree level assigns one variable. The path is irrelevant
   and all solutions are at the same depth $n$.
2. **Check constraints as you go.** Consider only values that do not conflict with previous assignments – an
   **incremental goal test**.

```text
function BACKTRACKING-SEARCH(csp) returns a solution or failure
    return BACKTRACK(csp, {})

function BACKTRACK(csp, assignment) returns a solution or failure
    if assignment is complete then return assignment
    var <- SELECT-UNASSIGNED-VARIABLE(csp, assignment)
    for each value in ORDER-DOMAIN-VALUES(csp, var, assignment) do
        if value is consistent with assignment then
            add {var = value} to assignment
            inferences <- INFERENCE(csp, var, assignment)        # optional (p. 302)
            if inferences != failure then
                add inferences to csp
                result <- BACKTRACK(csp, assignment)
                if result != failure then return result
                remove inferences from csp
            remove {var = value} from assignment
    return failure
```

> **Key idea:** fixing the variable order shrinks the tree from $n!\,d^n$ leaves (any variable at any level)
> to $d^n$. Depth-first is natural: every solution is at depth $n$, and DFS needs only linear memory.

**How much work?** Assignments made before the first solution, static orders:

| instance | assignments |
|---|---|
| Australia, order WA NT Q NSW V SA T | 7 (no backtracking) |
| Australia, slide order WA NT SA T NSW V Q (p. 263) | 9 (NSW = R leaves Q without colors) |
| Australia with only 2 colors (unsolvable) | 10, before giving up |
| 8-queens / 16-queens / 20-queens | 113 / 10 052 / 199 635 |

Three questions improve it (p. 277): **filtering** (detect inevitable failure early), **ordering** (which
variable next, which value first), **structure** (exploit the constraint graph).

## Filtering 1: forward checking (p. 279–284)

Track the domains of the unassigned variables and **cross off** values that violate a constraint with the
existing assignment:

```text
When a variable-value pair (X, v) is added to an assignment A,
ForEach variable Y not in A Do
    ForEach constraint C involving Y and X Do
        Eliminate from the domain of Y all the values that do not satisfy C given A
```

Worked example (p. 280–283):

| step | WA | NT | Q | NSW | V | SA |
|---|---|---|---|---|---|---|
| initial | RGB | RGB | RGB | RGB | RGB | RGB |
| WA = R | **R** | GB | RGB | RGB | RGB | GB |
| Q = G | R | B | **G** | RB | RGB | B |
| V = B | R | B | G | R | **B** | ∅ |

After V = B the domain of SA is empty: {WA = R, Q = G, V = B} cannot be part of a solution, and we backtrack
**without ever trying SA**.

**Complexity** (p. 284): $n$ variables, domain size $d$, at most $s \le n - 1$ constraints per variable →
$O(n \cdot s \cdot d)$ per assignment.

> **Exam trap:** forward checking only checks constraints between the **just-assigned** variable and its
> neighbors. After WA = R, Q = G the row already shows NT = {B} and SA = {B}: NT and SA cannot both be blue,
> but FC cannot detect this inconsistency (p. 286). It backtracks only at V = B.

## Filtering 2: arc consistency and AC-3 (p. 285–295)

For binary constraints, look at the **directed** constraint graph: every constraint gives two arcs.

> **Definition.** The arc $X \to Y$ is **consistent** iff for **every** value $x$ in the tail $D_X$ there is
> **some** value $y$ in the head $D_Y$ that satisfies the constraint (p. 287). We make it consistent by
> removing from $D_X$ the values with no support in $D_Y$.

The direction matters: with WA = {R}, the arc NT → WA removes R from NT (p. 288); the arc WA → NT removes
nothing. Arc consistency can be applied to unassigned variables as well (p. 289).

```text
function AC-3(csp) returns false if an inconsistency is found and true otherwise
    queue <- a queue of arcs, initially all the arcs in csp
    while queue is not empty do
        (Xi, Xj) <- POP(queue)
        if REVISE(csp, Xi, Xj) then
            if size of Di = 0 then return false
            for each Xk in Xi.NEIGHBORS - {Xj} do  add (Xk, Xi) to queue
    return true

function REVISE(csp, Xi, Xj) returns true iff we revise the domain of Xi
    revised <- false
    for each x in Di do
        if no value y in Dj allows (x, y) to satisfy the constraint between Xi and Xj then
            delete x from Di;  revised <- true
    return revised
```

Worked example (p. 290–293), starting from the forward-checking row WA = R, Q = G:

| arc | effect | NT | NSW | V | SA |
|---|---|---|---|---|---|
| (start) | | B | RB | RGB | B |
| NSW → V | ok: every color of NSW has a support in V | B | RB | RGB | B |
| NSW → SA | B of NSW has no support (SA = {B}) | B | **R** | RGB | B |
| V → NSW | re-checked because NSW shrank: R of V loses its support | B | R | **GB** | B |
| SA → NT | B of SA has no support (NT = {B}) | B | R | GB | **∅** |

AC-3 returns false: the dead end is detected **two levels earlier** than with forward checking.

> **Intuition (why re-queue):** deleting $x$ from $D_i$ can only hurt variables that were using $x$ as a
> support, i.e. the tails of arcs $(X_k, X_i)$. $(X_j, X_i)$ is not re-added: $x$ had no compatible value in
> $D_j$, so no value of $X_j$ relied on it. In the chain $X < Y < Z$ with domains {1,2,3}, a single pass over
> the arcs leaves $X = \{1, 2\}$; re-queuing gives $X = 1, Y = 2, Z = 3$.

**Complexity of AC-3** (p. 295): each arc is inserted in the queue at most $d$ times (its head can lose at most
$d$ values); REVISE is $O(d^2)$; with at most $n s$ arcs, AC-3 is $O(n s d^3)$ (textbook: $O(c\,d^3)$ for $c$
constraints). Polynomial – it never enumerates assignments.

## Ordering: MRV, degree, LCV (p. 296–298)

These are **domain-independent** heuristics, possible thanks to the factored representation (p. 297).

| heuristic | chooses | why |
|---|---|---|
| **Minimum Remaining Values** (MRV, "most constrained variable") | the variable with the **fewest legal values** in its domain | **fail fast**: a doomed variable is detected at the top of the subtree, a 1-value variable is a forced move |
| **Degree** (tie-breaker for MRV) | the variable involved in the **most constraints with unassigned variables** | shrinks the most other domains; at the start of Australia it picks SA (degree 5) |
| **Least Constraining Value** (LCV) | for the chosen variable, the value that **rules out the fewest values** in the remaining variables | **succeed first**: only one value has to work, keep the others' options open |

Example (p. 298): after WA = R, NT = G, MRV picks SA (only {B} left). For Q, the value R leaves SA = {B}
while B leaves SA = {} – LCV tries R first.

> **Exam trap:** "Why min rather than max?" MRV is about failing fast; LCV is about succeeding fast. Variable
> order affects the size of the tree in every case; value order only matters if a solution exists in the
> current branch.

MRV is only as good as the domains it reads: it needs filtering to keep them up to date.

| n-queens, assignments to the first solution | 8 | 16 | 20 | 50 |
|---|---|---|---|---|
| plain backtracking | 113 | 10 052 | 199 635 | – |
| forward checking, static order | 88 | 7 560 | 145 151 | – |
| forward checking + MRV | 75 | 44 | 145 | 2 068 |

## Problem structure (p. 299–300)

Independent subproblems = **connected components** of the constraint graph (find them with a BFS/DFS on the
graph). Tasmania and the mainland do not interact. If $n$ variables split into subproblems of $c$ variables
each, the worst-case cost is $O\!\left(\frac{n}{c}\, d^{c}\right)$, **linear in $n$**:

$n = 80$, $d = 2$, $c = 20$: $2^{80}$ nodes ≈ 4 billion years vs $4 \cdot 2^{20}$ nodes ≈ 0.4 s
(at 10 million nodes/s).

## Putting it together: the complete 4-queens example (p. 301–315)

The modified backtracking of p. 317 runs **AC-3 at the start of every call** and **forward checking after
every assignment**:

```text
CSP-BACKTRACKING(A, var-domains)
    IF assignment A is complete THEN RETURN A
    run AC-3 and reduce var-domains of unassigned variables
    IF a variable has an empty domain THEN RETURN failure
    X <- choose a variable not in A
    D <- choose an order of values in the domain of X
    FOR EACH v in D DO
        add (X <- v) to A
        var-domains <- FORWARD-CHECKING(var-domains, X, v, A)
        IF no variable has an empty domain THEN
            result <- CSP-BACKTRACKING(A, var-domains)
            IF result != failure THEN RETURN result
        remove (X <- v) from A
    RETURN failure
```

On 4-queens ($X_i$ = row of the queen in column $i$; heuristics do not help, X1 and value 1 are chosen first):

| step | X1 | X2 | X3 | X4 | comment |
|---|---|---|---|---|---|
| AC-3 at the root | 1234 | 1234 | 1234 | 1234 | nothing removed (p. 304) |
| X1 = 1, forward checking | **1** | 34 | 24 | 23 | two values removed per column (p. 306) |
| AC-3 | 1 | 4 | ∅ | 23 | X2 = 3 has no support in X3; X3 loses 2 (vs X4) and 4 (vs X2) → **backtrack** (p. 308–311) |
| X1 = 2, forward checking | **2** | 4 | 13 | 134 | (p. 313) |
| AC-3 | 2 | 4 | 1 | 3 | every domain is a singleton: **solution** (p. 315) |

Search tree: {} → {X1 = 1} (dead) and {X1 = 2} → solution (2, 4, 1, 3). Five assignments in total versus
eight for plain backtracking (113 vs 20 on 8-queens).

> **Exam trap:** when hand-simulating, write a **row of domains per step** exactly like the table above, and
> state the arc you are revising ("X2 → X3: 3 has no support"). On backtracking, the domains go back to the
> values they had **before** the undone assignment (X1 = 2 starts again from {1,2,3,4} everywhere).

## Beyond AC-3 (p. 316)

AC-3 does **not** detect all inconsistencies among binary constraints. X ≠ Y, Y ≠ Z, X ≠ Z with domains
{1, 2}: every arc is consistent (each value has a different partner), yet no solution exists – the conflict
involves three variables at once. Generalized propagation (path consistency, **k-consistency**) detects more
but costs more; AC-3 is usually a good **compromise between time spent in search and time spent in
constraint propagation**.

## Search vs inference (p. 317)

Constraint propagation is **inference**; backtracking is **search**. Some CSPs can be solved by inference
alone, without any search – e.g. many **Sudoku** puzzles, or 3-queens, which AC-3 proves unsolvable before
any assignment. Others (the triangle above) need search even when AC-3 finds nothing to prune.

| method | looks at | cost per node | detects |
|---|---|---|---|
| consistency check (plain backtracking) | assigned neighbors of the new variable | $O(s)$ | a conflict with the past |
| forward checking | constraints between the new variable and its unassigned neighbors | $O(nsd)$ | an emptied neighbor domain |
| AC-3 (MAC) | every arc, propagated transitively | $O(nsd^3)$ | any pairwise inconsistency |
| k-consistency | groups of k variables | exponential in k | more, at a higher price |

## How it connects

- **Search** (uninformed/informed): backtracking is depth-first tree search with a specialized `actions()`
  (one variable per level) and an incremental goal test. MRV/LCV play the role heuristics play in A*, but
  they are **generic**, derived from the representation.
- **Local search** (next topic): the same CSP can be attacked from the other side – start from a complete
  but infeasible assignment and minimize the number of violated constraints (min-conflicts).
- **Formulation** matters as much as the algorithm: implicit constraints (one queen per column), binary vs
  global constraints, auxiliary variables (carries).

## Exam checklist

- Formulate: variables, domains, constraints (in formulas), constraint graph; say what a solution is.
- Simulate backtracking with forward checking: one row of domains per assignment, mark the empty domain.
- Simulate AC-3: list the arcs you revise, the deleted values, and which arcs get re-queued.
- MRV / degree / LCV: count remaining values, constraints with **unassigned** variables, values ruled out.
- Complexities: complete assignments $O(d^n)$; FC $O(nsd)$; REVISE $O(d^2)$; AC-3 $O(nsd^3)$; independent
  subproblems $O(\frac{n}{c} d^c)$.
