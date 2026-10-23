# Classical Planning

Search treats a state as a black box; CSPs open it into variables and values. **Planning** opens it a step
further: a state is a set of **logical facts**, and every action says in logic **what it needs** and **what it
changes**. With that structure the same problem can be searched forwards from the initial state, backwards
from the goal, or turned into one big propositional formula and handed to a SAT solver. Classical planning
assumes a fully observable, deterministic, static, discrete world with a single agent (AIMA §11.1–11.2, with
the SATPlan encoding of §7.7.4 and a glimpse of §11.5).

## Intuition

> **Intuition:** a planning problem is a search problem **written in logic**. The state is the list of facts
> that are true right now ("the box is in R2, the robot is in R1"); an action is a recipe card: *if* these
> facts hold, *then* erase these facts and write these others. Because the cards are readable, the planner
> can reason about them: start from the goal and ask "which card could have produced this?" (backward
> planning), or translate "there is a sequence of $L$ cards that reaches the goal" into a satisfiability
> problem (SATPlan).

The whole chapter in five ideas:

- **representation**: states = sets of ground atoms, actions = schemas with preconditions and effects (STRIPS, PDDL);
- **forward (progression) planning**: ordinary search in the space of states;
- **backward (regression) planning**: search in the space of goals, through relevant and consistent actions;
- **heuristics**: estimates of the number of actions still needed; admissible ones keep A* optimal;
- **SATPlan**: for $L = 0, 1, 2, \dots$ encode "a plan of length $L$ exists" in propositional logic and run a SAT solver.

> **Key idea:** the representation is **domain-independent**. One planner solves blocks worlds, air cargo,
> Mars rovers and security tests: you only write a new domain description (exam 6 Feb 2026: "specialized
> representations restrict the application domain but allow to exploit the knowledge of the domain and design
> better algorithms").

## Representation: states, goals, action schemas (AIMA §11.1)

**Atoms.** The language has constants (objects: `A`, `B`, `Table`, `R1`), predicates (`On(x,y)`, `Clear(x)`,
`Handempty`) and variables (`x`, `y`). A **ground atom** has no variables: `On(C,A)`. Atoms are
**function-free**: `At(Spouse(Ali), Sydney)` is not allowed.

**State.** A conjunction (a set) of ground positive atoms. Two assumptions, as in a database:

- **closed-world assumption (CWA)**: every atom that is not listed is **false** (`Clear(A)` is not in the
  state, so A is not clear);
- **unique names assumption**: different constants denote different objects.

**Goal.** A conjunction of literals that a state must satisfy: a **partial** description, satisfied by many
states. A goal may contain variables, read existentially: `Box(x) ∧ InRoom(x, R1)` = "some box is in R1"
(exam 30 Aug 2022), `inFinished(?x)` (exam 8 Sep 2025).

**Action schema.** A name with parameters, a **precondition** (P) and an **effect** (E), both conjunctions of
literals over the parameters. The course writes them as:

```text
Move(x, y, z)
P: Box(x) ∧ Table(y) ∧ Table(z) ∧ At(x, y)
E: At(x, z) ∧ ¬At(x, y)
```

The positive literals of the effect form the **add list** ADD(a), the negated ones the **delete list** DEL(a)
(some exams write them as `A:` and `D:`, exam 10 Jul 2023). Substituting constants for all the parameters
gives a **ground action** (an *action*): `Move(B1, T1, T2)`.

**Semantics.** A ground action $a$ is **applicable** in state $s$ iff $s$ satisfies its precondition, and

$$\textit{RESULT}(s, a) = (s - \textit{DEL}(a)) \cup \textit{ADD}(a).$$

Every atom not mentioned in the effect keeps its value: this is how STRIPS sidesteps the **frame problem**.

```python
def applicable(state, a):            # state: frozenset of ground atoms (CWA)
    return a.pre <= state and not (a.neg & state)     # a.neg: negative preconditions (PDDL)

def result(state, a):
    return (state - a.delete) | a.add
```

A **planning domain** is a set of action schemas; a **planning problem** adds the constants, the initial state
and the goal. A **plan** is a sequence of ground actions, each applicable in the state produced by the previous
ones, whose final state satisfies the goal.

**Air cargo (AIMA Fig. 11.1).**

```text
Init(At(C1,SFO) ∧ At(C2,JFK) ∧ At(P1,SFO) ∧ At(P2,JFK) ∧ Cargo(C1) ∧ Cargo(C2)
     ∧ Plane(P1) ∧ Plane(P2) ∧ Airport(JFK) ∧ Airport(SFO))
Goal(At(C1,JFK) ∧ At(C2,SFO))
Load(c, p, a)      P: At(c,a) ∧ At(p,a) ∧ Cargo(c) ∧ Plane(p) ∧ Airport(a)     E: ¬At(c,a) ∧ In(c,p)
Unload(c, p, a)    P: In(c,p) ∧ At(p,a) ∧ Cargo(c) ∧ Plane(p) ∧ Airport(a)     E: At(c,a) ∧ ¬In(c,p)
Fly(p, from, to)   P: At(p,from) ∧ Plane(p) ∧ Airport(from) ∧ Airport(to)      E: ¬At(p,from) ∧ At(p,to)
```

A solution: Load(C1,P1,SFO), Fly(P1,SFO,JFK), Unload(C1,P1,JFK), Load(C2,P2,JFK), Fly(P2,JFK,SFO),
Unload(C2,P2,SFO).

**Blocks world (AIMA Fig. 11.3–11.4).** Initial state On(A,Table), On(B,Table), On(C,A), Clear(B), Clear(C),
goal On(A,B) ∧ On(B,C) (the Sussman anomaly, also in exams 17 Feb 2022 and 8 Jul 2026). The course version
has a hand: `Pickup(x)`, `Putdown(x)`, `Stack(x,y)`, `Unstack(x,y)` with `Handempty` and `Holding(x)`.
The textbook uses `Move(b, x, y)` plus `MoveToTable(b, x)`: a single Move schema would treat the table like a
block and delete `Clear(Table)` the first time a block is put on it.

> **Exam trap — the formulation must be "precise and overall coherent".** The exams repeatedly give a broken
> formulation and ask to fix it, or ask you to write one. Check:
> - every effect that should disappear is **deleted** (PickUp without ¬In(b,k) leaves the ball both in the
>   basket and in the hand, exam 18 Jan 2024; Putdown without Clear(x) makes the block unusable, exam 8 Jul 2026);
> - **typing** preconditions: without Box(b), PushThru(b,…) can "push" the ROBOT itself (exam 30 Aug 2022);
>   without Block(y), Unstack(B, Table) is applicable;
> - **symmetric** relations need both directions in the initial state: Connects(D1,R1,R2) and Connects(D1,R2,R1)
>   (exams 30 Aug 2022, 6 Feb 2026);
> - **no precondition that blocks the intended plan** (Move with Handfree means the robot can never carry a ball,
>   exam 18 Jan 2024);
> - the initial state contains every fact the actions need: with no Clear(…) facts nothing is applicable and
>   no plan exists (exam 8 Jul 2025).

## STRIPS vs PDDL (AIMA §11.1)

PDDL (Planning Domain Definition Language) descends from STRIPS. In the course:

| | STRIPS | PDDL |
|---|---|---|
| state | set of ground positive atoms, CWA | same |
| preconditions | **positive** literals only | positive **and negative** literals (`¬At(Pit, c2)`) |
| effects | add list + delete list | same (written as positive / negative literals) |
| goal | positive literals | positive and negative literals |
| equality | `x ≠ y` usually allowed as an extension ("you can use ≠") | `x ≠ y` |
| arithmetic | none | extensions (`z ≥ 2`, `Fuel(z − 2)`, exam 6 Feb 2026) |

**Consequences.** With negative preconditions some predicates become redundant: a PDDL model needs the same
constants and action schemas but **fewer predicates** (exam 18 Jan 2023: `HandEmpty` can be replaced by
negated `Holding` literals). Conversely, to write a PDDL model in STRIPS, every negative precondition needs a
complementary positive predicate (`NotPainted(o)`, `CanMove(x)`), and every arithmetic condition needs one
schema per value (exam 6 Feb 2026: `Move-Fuel2`, …, `Move-Fuel5`).

> **Exam trap — free variables in negative preconditions.** In `PickUp(b, k, x)  P: …, ¬Holding(x)` the
> variable x is a parameter, so the planner may choose **any** x: when the robot holds Ba1, `PickUp(Ba2, Bk1, Ba2)`
> is applicable (¬Holding(Ba2) is true) and the robot ends up holding two balls. A parameter in a negative
> literal means "**some** x is not held", not "nothing is held". Correct options: list the constants
> (`¬Holding(Ba1) ∧ ¬Holding(Ba2)`), keep a positive predicate (`Handfree`), or use a universally quantified
> precondition (a PDDL extension). (The official solutions of 18 Jan 2023 and 18 Jan 2024 use the flawed form.)

**Fluents vs static predicates.** A predicate that some action adds or deletes is **time-dependent** (a
**fluent**: `In(x,y)`, `Hot(x)`, `Empty(x)`); one that no action changes is **time-independent / static**
(`Water(x)`, `Kettle(x)`, `Connected(x,y)`, `Smaller(x,y)`). Static predicates are used for **typing** (which
constants can fill a parameter) and for fixed relations (adjacency). Exam 25 Jan 2022 asks to separate them.

## Action schemas vs ground actions

A schema with $k$ parameters over $n$ constants has $n^k$ groundings: `Move(c1, c2)` over the 16 cells of the
Wumpus world gives $16^2 = 256$ ground actions, 240 with $c_1 \ne c_2$, 48 if only adjacent pairs are kept
(exam 9 Feb 2023). Typing preconditions (`Box(x)`, `Table(y)`) and static relations whose atoms are false in
the initial state make most groundings useless, and planners only generate the **possible** ones (exam 16 Jan
2025: 8 Move actions for 2 boxes and 2 tables, instead of $4^3 = 64$).

A description whose "actions" have **no parameters** (`mix-dry-ingredients`, `bake-cake`, exam 11 Jun 2025)
really lists ground actions, not schemas: calling them actions is correct.

## Forward (progression) planning (AIMA §11.2.1)

Planning is a search problem:

| element | planning version |
|---|---|
| state | set of ground atoms |
| initial state | the Init of the problem |
| actions(s) | every ground action **applicable** in s |
| result(s, a) | $(s - \textit{DEL}(a)) \cup \textit{ADD}(a)$ |
| goal test | $\textit{Goal} \subseteq s$ |
| step cost | 1 (plan length) |

Any search algorithm of the previous topics applies. The exams use breadth-first **graph** search with the
goal test **when a node is generated** (exams 30 Aug 2022, 8 Sep 2025, 8 Jul 2026), actions in the stated
order (lexicographic, or the order of the schemas), and draw the tree with the full state in every node:

```python
def forward_bfs(init, goal, actions):           # actions: ground actions, in the stated order
    if goal <= init:
        return []
    frontier, reached = deque([(init, [])]), {init}
    while frontier:
        s, plan = frontier.popleft()
        for a in actions:
            if applicable(s, a):
                s1 = result(s, a)
                if goal <= s1:                  # goal test at GENERATION
                    return plan + [a.name]
                if s1 not in reached:           # graph search: repeated states are dropped
                    reached.add(s1)
                    frontier.append((s1, plan + [a.name]))
    return None
```

**Worked example (exam 30 Aug 2022).** Rooms R1–R2–R3 linked by doors D1, D2 (connections in both
directions), robot in R1, BOX1 in R2, goal Box(x) ∧ InRoom(x, R1). Lexicographic order of the actions:

```text
[InRoom(ROBOT,R1), InRoom(BOX1,R2), Connects(...)×4, Box(BOX1)]
 └─ GoThru(D1,R1,R2) → [InRoom(ROBOT,R2), InRoom(BOX1,R2), …]
     ├─ GoThru(D1,R2,R1)          → same as the root: repeated
     ├─ GoThru(D2,R2,R3)          → [InRoom(ROBOT,R3), InRoom(BOX1,R2), …]
     └─ PushThru(BOX1,D1,R2,R1)   → [InRoom(ROBOT,R1), InRoom(BOX1,R1), …]   goal (generated)
Plan: GoThru(D1,R1,R2), PushThru(BOX1,D1,R2,R1)
```

**Properties.** Forward search is sound and complete (with graph search on a finite state space), but the
**branching factor** is the number of applicable ground actions, and many of them are **irrelevant** to the goal
(picking up books when the goal is about boxes). BFS returns a shortest plan; DFS returns *a* plan, and with
tree search it may loop forever on an action that leaves the state unchanged (exam 8 Sep 2025: `GetSite(x)`
has an empty precondition and is applicable in every state).

## Backward (regression) planning (AIMA §11.2.2)

Search in the space of **goals** (sets of states), from the goal to the initial state.

- An action $a$ is **relevant** for a goal $G$ if it achieves at least one literal of $G$:
  $\textit{ADD}(a) \cap G \ne \emptyset$.
- An action is **consistent** with $G$ if it does not undo any literal of $G$: $\textit{DEL}(a) \cap G = \emptyset$.
- The **regression** of $G$ through a relevant and consistent action $a$ is

$$R[G, a] = (G - \textit{ADD}(a)) \cup \textit{PRE}(a).$$

> **Definition (exam 8 Jul 2025).** The regression of a goal $G$ through a relevant action $A$ is the (less
> constraining) goal $R[G, A]$ such that, in every state $S$ that satisfies $R[G, A]$, the preconditions of $A$
> are satisfied and the application of $A$ reaches a state $S'$ that satisfies $G$. In words: if we achieve
> $R[G, A]$, we achieve $G$ by simply performing $A$ — $A$ could be the **last action** of a plan for $G$.

With negative literals (PDDL): $\textit{POS}(G') = (\textit{POS}(G) - \textit{ADD}(a)) \cup \textit{PRE}^+(a)$ and
$\textit{NEG}(G') = (\textit{NEG}(G) - \textit{DEL}(a)) \cup \textit{PRE}^-(a)$; $a$ is inconsistent if it adds an
atom that $G$ requires to be false.

```python
def backward_bfs(init, goal, actions):
    if goal <= init:
        return []
    frontier, reached = deque([(goal, [])]), {goal}
    while frontier:
        g, plan = frontier.popleft()
        for a in actions:
            if relevant(g, a) and consistent(g, a):
                g1 = (g - a.add) | a.pre
                if g1 <= init:                  # the initial state satisfies the new goal
                    return [a.name] + plan      # actions are found LAST-first
                if g1 not in reached:
                    reached.add(g1)
                    frontier.append((g1, [a.name] + plan))
    return None
```

**Worked example (exam 14 Jan 2026).** Robot with two arms, four balls in room RA, goal
G = AtBall(B1,RB) ∧ … ∧ AtBall(B4,RB). Only `Drop(x,y,z)` adds AtBall(…), so the goal can be regressed in
**8 ways** (4 balls × 2 arms, y = RB), e.g.

$$R[G, \textit{Drop}(B1,RB,Left)] = AtBall(B2,RB), AtBall(B3,RB), AtBall(B4,RB), Ball(B1), Room(RB), Arm(Left), Carry(Left,B1), AtRobot(RB).$$

Static preconditions stay in the regressed goal (they are part of PRE); the exams sometimes omit them from the
drawing "for simplicity" (exam 8 Jul 2025).

**Worked example (exam 8 Jul 2025).** Root On(B,C) ∧ On(C,A). The relevant and consistent actions are
MoveFromTable(B,C), Move(B,A,C), MoveFromTable(C,A), Move(C,B,A): four children, e.g.
R[G, Move(C,B,A)] = Box(A), Box(B), Box(C), Clear(C), Clear(A), On(B,C), On(C,B). The initial state of that
exam contains no Clear(…) fact: every regressed goal contains some Clear(…) (every action requires it), so
no goal is ever satisfied by the initial state and **no plan exists**.

**Lifted regression.** Backward search does not need to ground every parameter: regressing At(C1,JFK) through
`Unload(C1, p, JFK)` gives In(C1,p) ∧ At(p,JFK) with p still a variable (exam 6 Feb 2024, "if the values of some
variables cannot be determined, keep them as variables"). This is why the backward branching factor is
usually much smaller than the forward one.

**Inconsistent goals.** A regressed goal can describe **no reachable state**: it contains $p$ and $\neg p$, or
two facts that the domain makes mutually exclusive (AtRobbyRa and AtRobbyRb, exercise book 6.2; On(B,A) and
On(C,A)). Such goals can be pruned. In the $n$-rooms problem of 14 Jul 2022 they cannot arise: regressing the
single-literal goal At(Rx) through Move$_{x'\text{-}x}$ gives the single literal At(Rx'), and one literal is
never inconsistent.

> **Exam trap — relevant but not consistent.** In the Wumpus world of 9 Feb 2023 the goal is
> At(Agent,x) ∧ At(Gold,x) ∧ Alive. `MoveToWumpusCell(c1, c2)` with c2 = the gold's cell adds At(Agent, c2)
> (relevant) but deletes Alive (**not consistent**): it can never be the last action of a plan. `Move(c1,c2)`
> is relevant and never deletes a goal literal.

| | forward (progression) | backward (regression) |
|---|---|---|
| searches | states (complete descriptions) | goals (partial descriptions = sets of states) |
| successors | applicable actions | relevant and consistent actions |
| stops when | a state satisfies the goal | the initial state satisfies a goal |
| plan built | first action first | last action first |
| branching | all applicable actions, many irrelevant | only relevant ones; smaller, especially lifted |
| heuristics | easy to design (exams use A* forward) | harder: goals are sets of states |

Which is better? Compare the branching factors: in the $n$-rooms problem (14 Jul 2022) both are $n - 1$ with
moves between any rooms and at most 2 with moves between adjacent rooms, so they are equivalent. In the Mars
rover problem (6 Feb 2026) the maximum number of successors is 3 in both the PDDL and the STRIPS formulation:
splitting `Move(x,y,z)` into one schema per fuel level does not change the ground actions.

Backward is **not** always better: it may regress through ground actions whose static preconditions are false
(`Unload(C1, C2, JFK)` needs `Plane(C2)`) and it generates goals that describe impossible situations (two discs on
the same disc). On the 3-disc Tower of Hanoi a plain backward BFS does not finish within a minute, while forward
BFS visits at most $3^3 = 27$ states. Always reify only the type-correct ground actions, and prune inconsistent
goals when the domain lets you recognize them.

## Heuristics for planning (AIMA §11.3)

Forward planning with A* needs $h(s)$ = an estimate of the number of actions from $s$ to the goal;
**admissible** = it never overestimates. Domain-independent recipes come from **relaxed problems**:

- **ignore delete lists**: no action ever undoes progress; the optimal relaxed plan length is admissible;
- **ignore preconditions**: every action is always applicable;
- **number of unsatisfied goal literals**: *not* admissible in general, because one action can achieve
  several goal literals at once (PushThru moves the robot **and** the box);
- $h = 0$ is (trivially) admissible.

Domain-specific heuristics must be justified action by action. Exam 30 Aug 2022: $h(s) = x - 1$ where $R_x$ is
the room of the box — one action moves the box by at most one room. Exam 12 Jul 2024 (paint objects at B, bring
them back to A): $h(s) = 2\,U_s(A) + P_s(B)$ is admissible, because every unpainted object at A needs at least
two `move-object` actions (A→B and B→A) and every painted object at B at least one, and `move-object` moves a
single object; $3\,U_s(A) + P_s(B)$ would overestimate (one `paint` serves three objects).

> **Exam trap:** "one action can reduce the heuristic by at most $k$ and the goal has $h = 0$" ⇒
> $h(s) \le k \cdot h^*(s)$, so $h/k$ is admissible. Argue it in exactly these terms.

## SATPlan: planning as satisfiability (AIMA §7.7.4, §11.2)

Translate "there is a plan of length $L$" into a propositional sentence; a model of the sentence **is** a plan.

```text
function SATPLAN(init, transition, goal, Lmax) returns solution or failure
    for L = 0 to Lmax do
        cnf <- TRANSLATE-TO-SAT(init, transition, goal, L)
        model <- SAT-SOLVER(cnf)              # e.g. DPLL
        if model is not null then return EXTRACT-SOLUTION(model)   # the A^t that are true
    return failure
```

**Reification.** Every ground **fluent** F gets one propositional symbol per time step, $F^0, \dots, F^L$; every
ground **action** A gets $A^0, \dots, A^{L-1}$ ($A^t$ = "A is executed at time $t$"). The course writes the
ground atom glued together: `AtR1^0`, `MoveB1T1T2^t`, `CarryLeftB1^{t+1}`. Static predicates are not fluents:
they get no time index and are accounted for by **not reifying impossible actions** (exam 11 Jun 2026: no
symbol MoveStorageShipping because Connected(Storage, Shipping) is false).

The sentence is the conjunction of five groups (two rooms, exam 14 Jun 2022, L = 1):

| group | formula | example |
|---|---|---|
| initial state | every fluent at $t = 0$, **negated** if false (the CWA must be made explicit) | $AtR1^0 \land \lnot AtR2^0$ |
| goal | goal literals at $t = L$ | $AtR2^1$ |
| precondition axioms | $A^t \Rightarrow \textit{PRE}(A)^t$, one per ground action and $t$ | $MoveR^0 \Rightarrow AtR1^0$, $MoveL^0 \Rightarrow AtR2^0$ |
| fluent (successor-state) axioms | $F^{t+1} \Leftrightarrow \textit{ActionCausesF}^t \lor (F^t \land \lnot \textit{ActionCausesNotF}^t)$ | $AtR1^1 \Leftrightarrow MoveL^0 \lor (AtR1^0 \land \lnot MoveR^0)$ |
| action exclusion axioms | $\lnot A_i^t \lor \lnot A_j^t$ for every pair | $\lnot MoveR^0 \lor \lnot MoveL^0$ |

*ActionCausesF* is the disjunction of the actions that add F, *ActionCausesNotF* that of the actions that
delete it; if no action deletes F the axiom is $F^{t+1} \Leftrightarrow \textit{ActionCausesF}^t \lor F^t$
(exam 31 Aug 2026: $A^1 \Leftrightarrow a1^0 \lor A^0$).

**Why each group.**

- **precondition axioms** are implications: executing $A$ *requires* its precondition, but the precondition
  does not force $A$.
- **fluent axioms** are biconditionals: they say *both* how a fluent becomes true and that **nothing else
  changes it** — the propositional solution of the frame problem. Without them the solver could flip fluents
  at will.
- **exclusion axioms** forbid two actions at the same step (otherwise their preconditions could interfere).
  They must be **pairwise**: the single clause $\lnot A_1^t \lor \dots \lor \lnot A_n^t$ only forbids executing
  **all** $n$ actions together and is satisfied with up to $n - 1$ simultaneous actions (exam 3 Feb 2025). With
  $n$ ground actions there are $\binom{n}{2} = n(n-1)/2$ exclusion axioms per time step.
- **init with negations**: SAT has no closed-world assumption; an unconstrained $AtR2^0$ could be set to true.

**How many axioms?** For each time step $t = 0, \dots, L-1$: one precondition axiom per reified action (with a
non-empty precondition), one fluent axiom per fluent, $\binom{n}{2}$ exclusion axioms. Exam 16 Jan 2025, two
boxes and two tables, $L = 1$: 8 actions `Move(Bi, Tj, Tk)` → 8 precondition axioms, 4 fluents `At(Bi, Tj)` →
4 fluent axioms, $\binom{8}{2} = 28$ exclusion axioms.

**Choosing L.** The loop starts at $L = 0$: then there are no actions and the sentence is just init ∧ goal.
Exam 16 Jan 2025: init contains $\lnot AtB1T2^0$, goal contains $AtB1T2^0$ → DPLL finds the contradiction by
unit propagation; there is no plan with zero actions. The first satisfiable $L$ is the length of a shortest
plan (exam 8 Sep 2023: $L = 1$, the plan Move(R1, L1, L2)). For a larger $L$ the sentence stays satisfiable,
because the axioms allow time steps with **no action** (they forbid two actions per step, not zero).

> **Exam trap:** list the fluents **ground** and **only the time-dependent ones**: In(Ba1,Bk1), In(Ba1,Bk2),
> In(Ba2,Bk1), In(Ba2,Bk2) — not In(Ba1,Ba1) (exam 18 Jan 2024); the 5 `…-mixed`/`batter-in-pan`/`cake-baked`
> atoms of the cake domain, not the static `has-ingredients(…)` (exam 11 Jun 2025); on() and clear() for the
> Tower of Hanoi, not smaller() (exam 20 Jun 2024).

## Planning in nondeterministic domains (AIMA §11.5)

When the environment is partially observable or nondeterministic, the agent plans over **belief states**
(sets of possible states) and the closed-world assumption is dropped: an atom that is not mentioned is
*unknown*, not false.

- **Sensorless (conformant) planning**: one fixed sequence of actions that works in every possible initial
  state (paint both the chair and the table with the same can, whatever their colors).
- **Contingent planning**: plans with branches `if <percept condition> then … else …`, for partially
  observable or nondeterministic environments; percept schemas say what can be sensed.
- **Online planning and replanning**: execute, **monitor** (action monitoring: is the next action still
  applicable? plan monitoring: does the rest of the plan still work? goal monitoring: is there a better goal?)
  and replan when something unexpected happens.

## Summary

| task | what to write |
|---|---|
| model a domain | constants, predicates (static vs fluents), init (CWA: only true atoms), goal, schemas with P/E |
| applicable actions | ground every schema, keep those whose preconditions hold in the state |
| forward tree | BFS/DFS, state in every node, mark repeated states, goal test at generation if requested |
| backward tree | relevant + consistent actions, $R[G,a] = (G - \textit{ADD}) \cup \textit{PRE}$, stop when Init ⊨ goal |
| admissible $h$ | argue "one action reduces $h$ by at most 1" and $h(\text{goal}) = 0$ |
| SATPlan | init (with negations), goal at $L$, precondition, fluent and exclusion axioms; count them |

## How the exam asks it

Almost every exam since 2022 has one *Planning* problem (8 points; only 14 Jun 2023 has none). The recurring question types:

1. **Write or fix a formulation** (25 Jan 2022 tea, 18 Jan 2023 arm and boxes, 9 Feb 2023 Wumpus,
   10 Jul 2023 Swap/Clone/Destroy, 20 Jun 2024 Hanoi, 12 Jul 2024 painting, 3 Feb 2025 check and assemble,
   6 Feb 2026 Mars rover, 8 Jul 2026 LLM blocks prompt; fixes: 30 Aug 2022, 18 Jan 2024, 11 Jun 2025 LLM cake,
   17 Feb 2022 "each block moved at most once"). Report constants, predicates (say which are fluents), init,
   goal, schemas with P and E; check deletes, typing, symmetric relations, ≠.
2. **Applicable actions in the initial state** (18 Jan 2023: 5, 9 Feb 2023: 2, 20 Jun 2024: 2, 12 Jul 2024: 7,
   3 Feb 2025: 6, 14 Jan 2026: 9). List them all with their signatures: ground every schema, check every
   precondition.
3. **Forward search tree** (30 Aug 2022, 6 Feb 2024 DFS, 8 Sep 2025, 8 Jul 2026, exercise book 6.1). Full state in
   each node, children in the stated order, repeated states marked, the plan read along the path.
4. **Backward search / regression** (14 Jul 2022, 9 Feb 2023, 6 Feb 2024, 8 Jul 2025, 14 Jan 2026, 11 Jun 2026,
   exercise book 6.2). Define regression; count the relevant and consistent actions; write $R[G, a]$.
5. **Forward vs backward** (14 Jul 2022, 6 Feb 2026): compare branching factors; say why.
6. **Admissible heuristic** (30 Aug 2022, 12 Jul 2024): propose or check one; argue action by action.
7. **SATPlan** (14 Jun 2022 and 8 Sep 2023 full encoding for $L = 1$, 31 Aug 2026 for $L = 2$, 16 Jan 2025
   $L = 0$ + DPLL and axiom counts, 9 Feb 2023 number of reified actions, 18 Jan 2024 / 20 Jun 2024 /
   11 Jun 2025 / 11 Jun 2026 fluents, 14 Jan 2026 and 11 Jun 2026 fluent and precondition axioms, 3 Feb 2025
   pairwise exclusion).
8. **Checking an LLM** (11 Jun 2025, 8 Jul 2026): is the model syntactically consistent and faithful to the
   description? Is the LLM's plan executable, does it reach the goal, is it optimal (compare with BFS)?
