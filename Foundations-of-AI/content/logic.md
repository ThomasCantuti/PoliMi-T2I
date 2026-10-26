# Logical Agents & Propositional Logic

A knowledge-based agent keeps what it knows as **sentences** in a knowledge base and decides by
**inference**: deriving new sentences that must be true whenever the old ones are. This topic gives the
language (propositional logic), the meaning of "follows from" (entailment, models), and the algorithms that
decide it: model checking, resolution, forward/backward chaining and DPLL (AIMA ch. 7, overview of ch. 8).
The written exam only ever asks **propositional** logic: translations, CNF, resolution proofs, chaining
trees, DPLL tables and true/false questions on soundness and completeness.

## Intuition

> **Intuition:** a sentence is a constraint on possible worlds. "It rains ⇒ the street is wet" rules out
> exactly one kind of world: rain with a dry street. A knowledge base is the set of worlds that survive all
> its constraints. $\alpha$ **follows** from the KB if $\alpha$ is true in **every** surviving world.

Two ways to check that:

- **model checking**: enumerate the worlds (truth table, or smarter: DPLL, WalkSAT) — semantic;
- **theorem proving**: manipulate the sentences with sound rules (resolution, Modus Ponens) until the goal
  (or a contradiction) appears — syntactic.

Both reduce to one question, **satisfiability**: $KB \models \alpha$ iff $KB \wedge \neg\alpha$ has no model.
Almost every exam answer is a variation on that sentence.

## Knowledge-based agents (AIMA §7.1)

The **knowledge base** (KB) is a set of sentences in a **knowledge representation language**. Two
operations: TELL (add a sentence) and ASK (query what follows). Both may involve **inference**.

```text
function KB-AGENT(percept) returns an action
    persistent: KB, a knowledge base;  t, a counter, initially 0 (time)
    TELL(KB, MAKE-PERCEPT-SENTENCE(percept, t))
    action <- ASK(KB, MAKE-ACTION-QUERY(t))
    TELL(KB, MAKE-ACTION-SENTENCE(action, t))
    t <- t + 1
    return action
```

The **declarative** approach: tell the agent what it needs to know (background knowledge + percepts) and let
inference work out the actions, instead of hard-coding behaviors (procedural approach). The agent can be
described at the **knowledge level** (what it knows and its goals) independently of the implementation.

## Logic: models and entailment (AIMA §7.3)

- **Syntax**: which sentences are well formed. **Semantics**: the truth of each sentence in each
  **possible world** (model).
- A **model** $m$ of $\alpha$: a world in which $\alpha$ is true. $M(\alpha)$ = the set of all models of $\alpha$.
- **Entailment**: $\alpha \models \beta$ iff in every model in which $\alpha$ is true, $\beta$ is true too:
  $$\alpha \models \beta \iff M(\alpha) \subseteq M(\beta).$$
  The **stronger** sentence has **fewer** models: $x = 0 \models xy = 0$.
- **Inference**: an algorithm $i$ derives $\alpha$ from KB, written $KB \vdash_i \alpha$
  ($\vdash_R$ resolution, $\vdash_{FC}$, $\vdash_{BC}$ in the exams).

> **Definition.** An inference algorithm is **sound** (truth-preserving) if everything it derives is
> entailed: $KB \vdash_i \alpha \Rightarrow KB \models \alpha$. It is **complete** if it derives everything
> that is entailed: $KB \models \alpha \Rightarrow KB \vdash_i \alpha$.

> **Exam trap:** soundness and completeness are about **which conclusions** the algorithm reaches, nothing
> else. "A sound algorithm derives all the entailed conclusions" is **false** (that is completeness);
> "a complete algorithm supports all the connectives" is **false** (exam 12 Jul 2024).

**Grounding**: if the KB is true in the real world, any sentence derived by a sound procedure is true in the
real world too. Whether the KB is true is a question of perception and learning, not of logic.

## Propositional logic (AIMA §7.4)

**Syntax.** Atomic sentences are **proposition symbols** ($P$, $W_{1,3}$, $Raining$) and the constants
$True$, $False$. Complex sentences use five connectives, in **decreasing precedence**:

| connective | name | example | read |
|---|---|---|---|
| $\neg$ | negation | $\neg W_{1,3}$ | not |
| $\wedge$ | conjunction | $W \wedge P$ | and |
| $\vee$ | disjunction | $W \vee P$ | or (inclusive) |
| $\Rightarrow$ (also $\rightarrow$) | implication | $(W \wedge P) \Rightarrow \neg W$ | premise ⇒ conclusion |
| $\Leftrightarrow$ | biconditional | $W \Leftrightarrow \neg W$ | if and only if |

A **literal** is a symbol or a negated symbol. So $\neg A \wedge B \vee C$ means $((\neg A) \wedge B) \vee C$.

**Semantics.** A model fixes the truth value of every symbol ($2^n$ models for $n$ symbols); complex sentences
are evaluated recursively with the truth tables:

| $P$ | $Q$ | $\neg P$ | $P \wedge Q$ | $P \vee Q$ | $P \Rightarrow Q$ | $P \Leftrightarrow Q$ |
|---|---|---|---|---|---|---|
| false | false | true | false | false | **true** | true |
| false | true | true | false | true | **true** | false |
| true | false | false | false | true | false | false |
| true | true | false | true | true | true | true |

> **Exam trap:** $P \Rightarrow Q$ is false **only** when $P$ is true and $Q$ false. It says nothing when
> the premise is false, and it needs no causal link: "5 is odd ⇒ Tokyo is in Japan" is true. And it is
> **not** symmetric: $Raining \Rightarrow Wet$ does not give $Wet \Rightarrow Raining$.

**Translating English** (exams 14 Jun 2023, 10 Jul 2023, 18 Jan 2024, 11 Jun 2025, 11 Jun 2026):

| English | propositional logic |
|---|---|
| "if A and B then C", "C if A and B" | $A \wedge B \Rightarrow C$ |
| "A only if B" | $A \Rightarrow B$ |
| "C unless B" | $\neg B \Rightarrow C$, i.e. $C \vee B$ |
| "if S then D unless B" (11 Jun 2026) | $S \Rightarrow (D \vee B)$ $\equiv$ $(S \wedge \neg B) \Rightarrow D$ $\equiv$ $(S \Rightarrow D) \vee B$ |
| "either A or B" (at least one) / "not both" | $A \vee B$ / $\neg A \vee \neg B$ |
| "A if B or C" | $B \vee C \Rightarrow A$ |
| "lucky and, in addition, smart or studies ⇒ pass" (10 Jul 2023) | $Lucky \wedge (Smart \vee Study) \Rightarrow Pass$ |

**A simple KB: the wumpus world** (§7.4.3). $P_{x,y}$ = pit in $[x,y]$, $B_{x,y}$ = breeze in $[x,y]$;
a square is breezy iff a neighbor has a pit.

$$R_1: \neg P_{1,1} \quad R_2: B_{1,1} \Leftrightarrow (P_{1,2} \vee P_{2,1}) \quad R_3: B_{2,1} \Leftrightarrow (P_{1,1} \vee P_{2,2} \vee P_{3,1}) \quad R_4: \neg B_{1,1} \quad R_5: B_{2,1}$$

$KB = R_1 \wedge \dots \wedge R_5$ entails $\neg P_{1,2}$ and $P_{2,2} \vee P_{3,1}$, but neither $P_{2,2}$ nor
$\neg P_{2,2}$: the agent does not know whether $[2,2]$ has a pit.

```fig logic-models
The 8 possible worlds for pits in [1,2], [2,2] and [3,1] ([1,1] and [2,1] are visited and safe). KB is true in 3 of them: no pit in [1,2], and a pit in [2,2] or [3,1].
All 3 models of KB are models of ¬P1,2, so KB ⊨ ¬P1,2. Two of them have a pit in [2,2] and one has none, so KB entails neither ¬P2,2 nor P2,2.
```

**Model checking: TT-ENTAILS** (§7.4.4). Enumerate all models; check $\alpha$ in those where KB is true.

```text
function TT-ENTAILS?(KB, α) returns true or false
    symbols <- a list of the proposition symbols in KB and α
    return TT-CHECK-ALL(KB, α, symbols, { })

function TT-CHECK-ALL(KB, α, symbols, model) returns true or false
    if EMPTY?(symbols) then
        if PL-TRUE?(KB, model) then return PL-TRUE?(α, model)
        else return true            // when KB is false, always return true
    else
        P <- FIRST(symbols);  rest <- REST(symbols)
        return TT-CHECK-ALL(KB, α, rest, model ∪ {P = true}) and
               TT-CHECK-ALL(KB, α, rest, model ∪ {P = false})
```

Sound and complete; time $O(2^n)$, space $O(n)$ (depth-first). Deciding entailment in PL is co-NP-complete:
every known complete algorithm is exponential in the worst case.

## Equivalence, validity, satisfiability (AIMA §7.5.1)

- **Logical equivalence**: $\alpha \equiv \beta$ iff they are true in the same models, i.e. $\alpha \models \beta$
  and $\beta \models \alpha$.
- **Valid** (a **tautology**): true in **all** models, e.g. $P \vee \neg P$.
- **Satisfiable**: true in **some** model. **Unsatisfiable**: true in no model, e.g. $P \wedge \neg P$.
  $\alpha$ is valid iff $\neg\alpha$ is unsatisfiable.

| equivalence | |
|---|---|
| $(\alpha \Rightarrow \beta) \equiv (\neg\alpha \vee \beta)$ | implication elimination |
| $(\alpha \Rightarrow \beta) \equiv (\neg\beta \Rightarrow \neg\alpha)$ | contraposition |
| $(\alpha \Leftrightarrow \beta) \equiv (\alpha \Rightarrow \beta) \wedge (\beta \Rightarrow \alpha)$ | biconditional elimination |
| $\neg(\alpha \wedge \beta) \equiv \neg\alpha \vee \neg\beta$, $\neg(\alpha \vee \beta) \equiv \neg\alpha \wedge \neg\beta$ | De Morgan |
| $\alpha \vee (\beta \wedge \gamma) \equiv (\alpha \vee \beta) \wedge (\alpha \vee \gamma)$ | distributivity of $\vee$ over $\wedge$ |
| $\neg\neg\alpha \equiv \alpha$ | double negation |

> **Theorem (deduction).** $\alpha \models \beta$ iff the sentence $(\alpha \Rightarrow \beta)$ is valid.
>
> **Theorem (refutation, proof by contradiction).** $\alpha \models \beta$ iff $(\alpha \wedge \neg\beta)$ is
> unsatisfiable.

The refutation theorem is the engine of resolution and of DPLL used for entailment: add $\neg\beta$ to the KB
and show that no model survives.

**Monotonicity**: if $KB \models \alpha$ then $KB \wedge \beta \models \alpha$. Adding knowledge never retracts
a conclusion — in particular an **inconsistent** KB (no models) entails **every** sentence (exam 8 Jul 2025).

> **Exam trap:** keep the three questions apart (exam 16 Jan 2025): from "$KB \cup \{\neg R\}$ is
> unsatisfiable" you conclude $KB \models R$; you do **not** conclude that $R$ is valid (it is false in the
> model with $R$ false) nor that the KB is unsatisfiable (only $KB \cup \{\neg R\}$ is).

## Conjunctive normal form (AIMA §7.5.2)

A **clause** is a disjunction of literals; a sentence is in **CNF** if it is a **conjunction of clauses**.
Every PL sentence has an equivalent CNF, obtained in four steps:

1. eliminate $\Leftrightarrow$: $\alpha \Leftrightarrow \beta$ becomes $(\alpha \Rightarrow \beta) \wedge (\beta \Rightarrow \alpha)$;
2. eliminate $\Rightarrow$: $\alpha \Rightarrow \beta$ becomes $\neg\alpha \vee \beta$;
3. move $\neg$ inwards (De Morgan, double negation) until it only applies to symbols;
4. distribute $\vee$ over $\wedge$ and flatten.

Example (§7.5.2): $B_{1,1} \Leftrightarrow (P_{1,2} \vee P_{2,1})$

| step | result |
|---|---|
| 1 | $(B_{1,1} \Rightarrow (P_{1,2} \vee P_{2,1})) \wedge ((P_{1,2} \vee P_{2,1}) \Rightarrow B_{1,1})$ |
| 2 | $(\neg B_{1,1} \vee P_{1,2} \vee P_{2,1}) \wedge (\neg(P_{1,2} \vee P_{2,1}) \vee B_{1,1})$ |
| 3 | $(\neg B_{1,1} \vee P_{1,2} \vee P_{2,1}) \wedge ((\neg P_{1,2} \wedge \neg P_{2,1}) \vee B_{1,1})$ |
| 4 | $(\neg B_{1,1} \vee P_{1,2} \vee P_{2,1}) \wedge (\neg P_{1,2} \vee B_{1,1}) \wedge (\neg P_{2,1} \vee B_{1,1})$ |

Useful patterns: $A \wedge B \Rightarrow C$ becomes the single clause $\neg A \vee \neg B \vee C$;
$A \vee B \Rightarrow C$ becomes **two** clauses $\neg A \vee C$ and $\neg B \vee C$ (exam 18 Jan 2024: clauses
3.1 and 3.2); a conjunction of facts becomes one unit clause per fact.

> **Exam trap:** in CNF each clause is a **disjunction** of literals, and the clauses are joined by $\wedge$
> (exam 12 Jul 2024, "each clause is a conjunction of literals" is false). Distribution can blow up
> exponentially: $(A_1 \wedge B_1) \vee \dots \vee (A_n \wedge B_n)$ has $2^n$ clauses.

## Resolution (AIMA §7.5.2)

**Unit resolution**: from $\ell_1 \vee \dots \vee \ell_k$ and $m$, where $m$ is the complement of $\ell_i$,
derive the clause without $\ell_i$. **Full resolution**: from two clauses containing complementary literals
$\ell_i$ and $m_j$, derive the disjunction of all the other literals:
$$\frac{\ell_1 \vee \dots \vee \ell_k, \qquad m_1 \vee \dots \vee m_n}{\ell_1 \vee \dots \vee \ell_{i-1} \vee \ell_{i+1} \vee \dots \vee \ell_k \vee m_1 \vee \dots \vee m_{j-1} \vee m_{j+1} \vee \dots \vee m_n}$$
The result keeps **one copy** of each literal (**factoring**): $A \vee B$ and $A \vee \neg B$ give $A$.

> **Exam trap:** resolve on **one** complementary pair at a time. $A \vee B$ and $\neg A \vee \neg B$ give
> $B \vee \neg B$ or $A \vee \neg A$ (both tautologies), **never** the empty clause. Two clauses can have more
> than one resolvent: $A \vee \neg B \vee C$ and $B \vee \neg C \vee D$ resolve on $B$ or on $C$ (exam 12 Jul 2024).

```text
function PL-RESOLUTION(KB, α) returns true or false
    clauses <- the set of clauses in the CNF representation of KB ∧ ¬α
    new <- { }
    loop do
        for each pair of clauses Ci, Cj in clauses do
            resolvents <- PL-RESOLVE(Ci, Cj)
            if resolvents contains the empty clause then return true
            new <- new ∪ resolvents
        if new ⊆ clauses then return false
        clauses <- clauses ∪ new
```

**Worked example** (exams 14 Jul 2022 and 16 Jan 2025): $KB = \{P,\ (P \wedge Q) \Rightarrow R,\ (S \vee T) \Rightarrow Q,\ T\}$, does
$KB \models R$? Write the numbered CNF, add the **negated** query, resolve until $\bot$:

| # | clause | from |
|---|---|---|
| 1 | $P$ | KB |
| 2 | $\neg P \vee \neg Q \vee R$ | KB |
| 3a | $\neg S \vee Q$ | KB |
| 3b | $\neg T \vee Q$ | KB |
| 4 | $T$ | KB |
| 5 | $\neg R$ | negated query |
| 6 | $\neg P \vee \neg Q$ | 2, 5 |
| 7 | $\neg Q$ | 1, 6 |
| 8 | $\neg T$ | 3b, 7 |
| 9 | $\bot$ | 4, 8 |

$KB \wedge \neg R$ is unsatisfiable, so $KB \models R$ by the refutation theorem (and the soundness of resolution).

```fig logic-resolution
The proof above as a derivation tree: ¬R (5) with ¬P ∨ ¬Q ∨ R (2) on R gives ¬P ∨ ¬Q (6); with P (1) on P gives ¬Q (7); with ¬T ∨ Q (3b) on Q gives ¬T (8); with T (4) on T gives the empty clause (9).
```

**Properties.** Resolution is **sound**. It is **refutation-complete** (ground resolution theorem): if a set
of clauses is unsatisfiable, its **resolution closure** $RC(S)$ contains the empty clause. It is *not*
complete for generating every entailed sentence ($A \models A \vee B$ cannot be derived directly) — that is
why we always prove by refutation. PL-RESOLUTION always terminates: over $n$ symbols there are finitely
many clauses ($3^n$), so it also answers "**not entailed**" (exam 18 Jan 2024).

## Resolution strategies (AIMA §9.5.6, applied to PL)

Strategies restrict which pairs may be resolved, to find proofs faster:

| strategy | every resolution step… | complete? |
|---|---|---|
| **unit resolution** | involves at least one **unit clause** | for **Horn** clauses; not in general |
| **unit preference** | prefers pairs with a unit clause (no restriction) | yes |
| **input resolution** | involves at least one **input clause** (KB or negated query) | for **Horn** clauses; not in general |
| **set of support** | involves a clause of the set of support (the negated query and its descendants) | yes, if the rest of the clauses is satisfiable |
| **subsumption** | (deletes clauses more specific than an existing one) | yes |

The proof above uses a unit clause at every step, and an input clause at every step: it is a unit
resolution **and** an input resolution proof.

**Unit resolution is not complete in general** (exam 14 Jul 2022): $\{P \vee Q,\ P \vee \neg Q,\ \neg P \vee R,\ \neg P \vee \neg R\}$
is unsatisfiable, but it contains no unit clause, so unit resolution cannot even start.

**Input resolution is not complete in general** (exam 31 Aug 2026): with $KB = \{A \vee B,\ A \vee \neg B,\ \neg A \vee B\}$ and
the negated query $\neg A \vee \neg B$, input resolution derives $A$ (1,2), $B$ (1,3), $\neg B$ (2,4), $\neg A$ (3,4)
and then nothing new: $A$ and $\neg A$ would give $\bot$, but neither is an input clause. Yet $KB \models A \wedge B$.

> **Key idea:** on **Horn** clauses (next section) unit resolution and input resolution are complete
> (exam 18 Jan 2023: "we can conclude $KB \models B$ because this strategy is complete for Horn clauses").
> Both counterexamples above contain a clause with two positive literals.

## Horn clauses and definite clauses (AIMA §7.5.3)

| kind | positive literals | example | as implication |
|---|---|---|---|
| **definite clause** | exactly one | $\neg L \vee \neg B \vee M$ | $(L \wedge B) \Rightarrow M$; a fact $M$ has no premise |
| **goal clause** (integrity constraint) | zero | $\neg W \vee \neg P$ | $(W \wedge P) \Rightarrow False$ |
| **Horn clause** | at most one | either of the two above | |

Horn clauses are closed under resolution. With definite clauses, inference is **Modus Ponens** and entailment
can be decided in time **linear** in the size of the KB (forward and backward chaining).

> **Exam trap:** "is the KB composed of definite clauses?" — write each sentence as a clause and count the
> positive literals. $Warm \wedge \neg Raining \Rightarrow Pleasant$ is $\neg Warm \vee Raining \vee Pleasant$: **two**
> positive literals; $\neg Wet$ has **zero** (exam 14 Jun 2023). $X \vee Y \vee Z$ is not definite either
> (exam 14 Jan 2026), so FC cannot be used there.

## Forward chaining (AIMA §7.5.4)

Data-driven: start from the known facts, fire every rule whose premises are all known, add its conclusion,
repeat until the query appears or nothing new can be added.

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

AIMA example: $P \Rightarrow Q$, $L \wedge M \Rightarrow P$, $B \wedge L \Rightarrow M$, $A \wedge P \Rightarrow L$,
$A \wedge B \Rightarrow L$, $A$, $B$. Query $Q$: popped in the order $A, B, L, M, P, Q$ ($A \wedge B \Rightarrow L$ fires
after $B$; $B \wedge L \Rightarrow M$ after $L$; $L \wedge M \Rightarrow P$ after $M$).

```fig logic-fc
The rules as a graph, each with its counter of unproved premises (P ⇒ Q: 1, L ∧ M ⇒ P: 2, B ∧ L ⇒ M: 2, A ∧ P ⇒ L: 2, A ∧ B ⇒ L: 2). Queue A, B.
Pop A: A ∧ P ⇒ L and A ∧ B ⇒ L go to 1. Pop B: A ∧ B ⇒ L reaches 0, L is queued. Pop L: B ∧ L ⇒ M reaches 0, M is queued.
Pop M: L ∧ M ⇒ P reaches 0, P is queued. Pop P: P ⇒ Q and A ∧ P ⇒ L reach 0, Q and L are queued. Pop Q: the query, return true.
```

- **Sound** (each step is Modus Ponens) and **complete for definite clauses**: at the fixed point, the model
  that makes true exactly the inferred symbols satisfies every clause, so any atom entailed is inferred.
- Time **linear** in the size of the KB (each premise symbol is counted down once).
- It only derives **positive literals** (symbols): it cannot derive $A \wedge D$ in one run, nor $\neg Z \Rightarrow \neg Y$
  (exams 3 Feb 2025, 14 Jan 2026). Workaround: run it once per conjunct.

> **Exam trap:** "FC is complete" holds **for KBs of definite clauses** only. "If $KB \models \alpha$ then
> $KB \vdash_{FC} \alpha$ for a generic KB" is false (exam 8 Jul 2025); "only BC is complete" is false too:
> both are sound and complete on definite clauses (exam 12 Jul 2024).

## Backward chaining (AIMA §7.5.4)

Goal-driven: to prove $q$, if $q$ is a known fact you are done; otherwise take the rules with conclusion $q$
and prove **all** the premises of one of them, recursively. It builds an **AND-OR tree**: the rules for a goal
are alternatives (OR), the premises of a rule must all hold (AND, drawn with an arc across the edges).

Exam conventions (exams 18 Jan 2023, 3 Feb 2025):

- rules are tried in the **top-down order** of the KB, premises left to right;
- when a premise fails, the remaining premises of that rule are drawn but **not expanded**, and the next rule
  is tried; a goal with no rule left is marked ✗ (**backtracking**);
- the first rule whose premises all succeed proves the goal: later rules are not tried;
- a goal that already **failed** (or was already **proved**) is not expanded again; a goal already on the
  current path fails (loop check). "Worst case" = the rule order that makes BC do the most work.

Exam 3 Feb 2025: KB $(B \wedge C) \Rightarrow A$, $J \Rightarrow B$, $P \Rightarrow D$, $K \Rightarrow G$, $G \Rightarrow A$,
$K \Rightarrow B$, $M \Rightarrow F$, $F \Rightarrow G$, $H \Rightarrow A$, $M \Rightarrow D$, $P \Rightarrow F$, $M \Rightarrow K$, $P$;
goal $A$:

```fig logic-bc
AND-OR tree for goal A. Rule (B ∧ C) ⇒ A [AND]: B tries J ⇒ B (J ✗, no rule for J) and K ⇒ B (K tries M ⇒ K: M ✗, no rule for M; K ✗), so B fails and C is drawn but not expanded.
Rule G ⇒ A: G tries K ⇒ G (K ✗, already failed: not expanded again) and F ⇒ G; F tries M ⇒ F (M ✗) and P ⇒ F (P ✓, fact).
So F, G and A are proved; H ⇒ A is never tried.
```

BC is sound and complete for definite clauses, and often **much cheaper** than FC: it only touches facts
relevant to the goal (time can be much less than linear in the KB size).

## DPLL (AIMA §7.6.1)

Model checking done well: a depth-first enumeration of partial models, with three improvements over
TT-ENTAILS. It decides **satisfiability** of a set of clauses (CNF); for entailment, run it on
$KB \wedge \neg\alpha$ and conclude $KB \models \alpha$ iff the answer is "unsatisfiable".

```text
function DPLL-SATISFIABLE?(s) returns true or false
    clauses <- the set of clauses in the CNF representation of s
    symbols <- a list of the proposition symbols in s
    return DPLL(clauses, symbols, { })

function DPLL(clauses, symbols, model) returns true or false
    if every clause in clauses is true in model then return true
    if some clause in clauses is false in model then return false
    P, value <- FIND-PURE-SYMBOL(symbols, clauses, model)
    if P is non-null then return DPLL(clauses, symbols - P, model ∪ {P = value})
    P, value <- FIND-UNIT-CLAUSE(clauses, model)
    if P is non-null then return DPLL(clauses, symbols - P, model ∪ {P = value})
    P <- FIRST(symbols);  rest <- REST(symbols)
    return DPLL(clauses, rest, model ∪ {P = true}) or DPLL(clauses, rest, model ∪ {P = false})
```

- **Early termination**: a clause is true as soon as **one** literal is true; the formula is false as soon as
  **one** clause is false. A partial model can decide the answer ($A$ true already satisfies $A \vee B \vee C$).
- **Pure symbol heuristic**: a symbol that appears with the **same sign** in all clauses **not yet satisfied**
  can be set to make its literals true: it can never make a clause false.
- **Unit clause heuristic**: a clause whose literals are all false but one (or a clause with one literal)
  forces that literal. Assigning it can create new unit clauses: **unit propagation** (a cascade, like forward
  chaining). Here a unit clause also counts after the other literals have become false.

**The exam table** (exams 8 Sep 2025, 14 Jan 2026, 8 Jul 2026): one column per clause, one row per
assignment; each cell shows the clause **reduced** by the partial model (false literals deleted), `true` once
satisfied, ⊥ once false; the step is written on the right. Exam 8 Sep 2025,
$(A \vee B) \wedge (\neg A \vee \neg D) \wedge (C \vee D) \wedge (B \vee C) \wedge (A \vee \neg C) \wedge (\neg B \vee D) \wedge (\neg A \vee \neg C)$:

| | $A \vee B$ | $\neg A \vee \neg D$ | $C \vee D$ | $B \vee C$ | $A \vee \neg C$ | $\neg B \vee D$ | $\neg A \vee \neg C$ | step |
|---|---|---|---|---|---|---|---|---|
| 1 | T | $\neg D$ | $C \vee D$ | $B \vee C$ | T | $\neg B \vee D$ | $\neg C$ | split on $A$ |
| 2 | T | T | $C$ | $B \vee C$ | T | $\neg B$ | $\neg C$ | unit $\neg D$ |
| 3 | T | T | T | T | T | $\neg B$ | ⊥ | unit $C$ |
| | | | | | | | | backtrack to 0 |
| 4 | $B$ | T | $C \vee D$ | $B \vee C$ | $\neg C$ | $\neg B \vee D$ | T | split on $\neg A$ |
| 5 | T | T | $C \vee D$ | T | $\neg C$ | $D$ | T | unit $B$ |
| 6 | T | T | $D$ | T | T | $D$ | T | unit $\neg C$ |
| 7 | T | T | T | T | T | T | T | unit $D$ |

Satisfiable, model $\{\neg A, B, \neg C, D\}$. At the root no symbol is pure and no clause is unit, so DPLL
must split.

```fig logic-dpll
The table above, row by row: the seven clauses reduced by the partial model, and the search tree. Split on A: unit ¬D, unit C, ¬A ∨ ¬C becomes false (dead end).
Backtrack to ¬A: unit B, unit ¬C, unit D: every clause is true, model {¬A, B, ¬C, D}.
```

> **Exam trap:** the course does not fix the order among applicable heuristics or the split variable/value:
> the official solutions sometimes pick a unit clause while a pure symbol exists (row 4 above: $D$ is pure),
> pick the last unit clause instead of the first (8 Jul 2026), or split on $\neg H$ first. Any legal choice is
> accepted; what is checked is that you use a heuristic whenever one applies (if allowed), name each step,
> and backtrack to the **other value of the last split**. AIMA's pseudocode checks pure symbols first,
> then unit clauses, and splits on the first symbol with $true$ first.

**Same answer without heuristics?** Yes (exams 17 Feb 2022, 8 Jul 2026): pure symbols and unit clauses only
prune branches that cannot contain a needed model (a pure literal can be set true without loss; a unit literal
is forced), so DPLL stays sound and complete and **always terminates** — in the worst case it enumerates
all $2^n$ assignments (exam 12 Jul 2024). Without heuristics it just explores more nodes.

> **Exam trap — what DPLL says about entailment** (exams 8 Sep 2025, 14 Jan 2026). If DPLL finds
> $KB \wedge \neg\alpha$ **satisfiable**, then $KB \not\models \alpha$ (the model found is a counterexample). If it
> finds $KB \wedge \alpha$ unsatisfiable, that does **not** decide $KB \models \alpha$: it says $KB \models \neg\alpha$, and
> then $KB \not\models \alpha$ only if the KB itself is satisfiable. Check which formula was actually tested.

DPLL in practice also uses component analysis, variable/value ordering (degree heuristic), intelligent
backtracking (conflict clause learning), random restarts and clever indexing.

**DPLL vs CSP backtracking** (exam 6 Feb 2024): a SAT problem is a CSP with Boolean variables and one
constraint per clause. Solving it as a CSP (backtracking + forward checking + MRV/degree) works, but DPLL is
specialized: it uses early termination on clauses, pure symbols and unit propagation (unit propagation is
forward checking that cascades), instead of the generic CSP heuristics. AC-3 prunes nothing on two-literal
clauses with domains $\{t, f\}$: each value always finds a support.

## WalkSAT and the landscape of random SAT (AIMA §7.6.2–7.6.3)

Local search on complete assignments; the objective is the number of unsatisfied clauses.

```text
function WALKSAT(clauses, p, max_flips) returns a satisfying model or failure
    model <- a random assignment of true/false to the symbols in clauses
    for i = 1 to max_flips do
        if model satisfies clauses then return model
        clause <- a randomly selected clause from clauses that is false in model
        with probability p flip the value in model of a randomly selected symbol from clause
        else flip whichever symbol in clause maximizes the number of satisfied clauses
    return failure
```

If it returns a model, the formula is satisfiable; if it returns failure, we **don't know** (maybe too few
flips). WalkSAT is not complete: it can never prove unsatisfiability, so it cannot be used to prove entailment.
It is useful when a model is expected to exist.

Random 3-CNF with $m$ clauses and $n$ symbols: for small $m/n$ almost all are satisfiable (easy), for large
$m/n$ almost none are; the **satisfiability threshold** is around $m/n \approx 4.26$, where the hardest
problems are.

## First-order logic: an overview (AIMA ch. 8)

Propositional logic has no objects or relations: "every square adjacent to a pit is breezy" needs one
sentence per square. **First-order logic** (FOL) talks about a world of **objects**, **relations** among them
and **functions**:

- **terms** denote objects: constants ($John$), variables ($x$), function applications ($LeftLeg(John)$);
- **atomic sentences**: a predicate applied to terms, $Brother(Richard, John)$, or equality $t_1 = t_2$;
- connectives as in PL, plus **quantifiers**: $\forall x\, P$ (for all objects) and $\exists x\, P$ (for some).

| pattern | write | common mistake |
|---|---|---|
| "all kings are persons" | $\forall x\ King(x) \Rightarrow Person(x)$ | $\forall x\ King(x) \wedge Person(x)$ (everything is a king and a person) |
| "some crown is on John's head" | $\exists x\ Crown(x) \wedge OnHead(x, John)$ | $\exists x\ Crown(x) \Rightarrow OnHead(x, John)$ (true as soon as something is not a crown) |

$\forall$ usually goes with $\Rightarrow$, $\exists$ with $\wedge$. Quantifier order matters
($\forall x\, \exists y\, Loves(x, y)$ vs $\exists y\, \forall x\, Loves(x, y)$), and
$\neg\forall x\, P \equiv \exists x\, \neg P$. A model of FOL fixes a domain of objects and the
interpretation of every symbol; there are infinitely many models, so truth tables are impossible.
Knowledge engineering in FOL: identify the questions, assemble the vocabulary (predicates, functions,
constants), encode general knowledge, encode the instance, query, debug. The written exam does not ask FOL.

## Summary

| algorithm | decides | sound | complete | for | cost |
|---|---|---|---|---|---|
| TT-ENTAILS | $KB \models \alpha$ | yes | yes | any PL | $O(2^n)$ time |
| resolution (PL-RESOLUTION) | unsatisfiability of $KB \wedge \neg\alpha$ | yes | refutation-complete | any PL in CNF | exponential |
| unit / input resolution | same | yes | **only for Horn** clauses | Horn | |
| forward chaining | $KB \vdash_{FC} q$, $q$ a symbol | yes | for **definite** clauses | definite clauses | linear |
| backward chaining | $KB \vdash_{BC} q$, $q$ a symbol | yes | for **definite** clauses | definite clauses | often sublinear |
| DPLL | satisfiability | yes | yes, always terminates | any PL in CNF | exponential worst case |
| WalkSAT | finds models | yes (a returned model is a model) | **no** | any PL in CNF | depends on max_flips |

## How it connects

- **CSP**: SAT is a CSP with Boolean domains; DPLL is backtracking search with clause-specific inference
  (unit propagation ≈ forward checking that cascades) and early termination. WalkSAT is min-conflicts.
- **Search**: forward chaining is a breadth-first expansion of facts; backward chaining is depth-first
  AND-OR search with backtracking; TT-ENTAILS is depth-first enumeration of models.
- **Planning** (next topic): SATPlan encodes a planning problem as a SAT instance and solves it with DPLL or
  WalkSAT; STRIPS states are conjunctions of positive literals.

## How the exam asks it

- **Translate English into PL** (14 Jun 2023, 10 Jul 2023, 18 Jan 2024, 11 Jun 2025, 11 Jun 2026): one
  sentence per statement, symbols named as requested; watch "unless", "either… or", "not both", and say
  why equivalent forms are equivalent (rewrite both into the same CNF).
- **Convert to CNF** (10 Jul 2023, 18 Jan 2024, 11 Jun 2025, 11 Jun 2026; exercise book 5.1–5.2): the four
  steps, one clause per line, number them.
- **Resolution proof** (14 Jul 2022, 14 Jun 2023, 16 Jan 2025, 11 Jun 2025, 11 Jun 2026): number the CNF
  clauses, **add the negated query**, write each new clause with its two parents, end with ⊥, then cite the
  refutation theorem / soundness of resolution. "Use your intuition to minimize the length": start from the
  negated query and resolve towards the facts.
- **Strategies** (14 Jul 2022, 18 Jan 2023, 14 Jun 2023, 31 Aug 2026): check that each step has a unit parent
  (unit) or an input parent (input); for completeness say "complete for Horn clauses, not in general" and
  give the counterexample.
- **Backward chaining tree** (18 Jan 2023, 3 Feb 2025): rules in top-down order, AND arcs, ✗ where it
  backtracks, unexpanded conjuncts after a failure, failed goals not re-expanded. Then: $\vdash_{BC}$ holds
  because a proof was found, $\models$ holds because BC is sound; FC would give the same result (definite
  clauses, both sound and complete); neither derives $A \wedge D$ directly.
- **DPLL table** (17 Feb 2022, 10 Jul 2023, 8 Sep 2023, 8 Sep 2025, 14 Jan 2026, 8 Jul 2026): the table
  above, every step named (pure / unit / split / backtrack), final answer and model. Variants: without pure
  symbol, without unit clause, without any heuristic ("first three steps"); same final answer (complete), more
  work without heuristics; deduce the differences of a variant from its execution tree.
- **DPLL / resolution and entailment** (8 Sep 2025, 14 Jan 2026, 18 Jan 2024): $KB \models \alpha$ iff
  $KB \wedge \neg\alpha$ unsatisfiable; a model of $KB \wedge \neg\alpha$ is a counterexample.
- **True/false on the theory** (12 Jul 2024, 8 Jul 2025, 16 Jan 2025): sound vs complete, valid vs
  satisfiable, CNF definition, FC/BC completeness, DPLL termination, inconsistent KB entails everything.
  Answer "true/false" **and** the one-line reason (the definition or a counterexample).
