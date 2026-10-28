# Uncertainty & Bayesian Networks

A logical agent only has "true", "false" and "I don't know". A real agent almost never knows for sure what
state the world is in or what its actions will do, yet it still has to act. **Probability** attaches a
**degree of belief** to every proposition and tells the agent how to update it when evidence arrives. A
**Bayesian network** writes the joint distribution of many variables compactly: one small conditional table per
variable, glued together by the independences that the graph shows (AIMA §12.1, §13.1, §13.2 without
§13.2.3). The exam exercises also need the basic rules of probability (AIMA §12.2–12.5) and inference by
enumeration (AIMA §13.3.1), so they are covered here too.

## Intuition

> **Intuition:** a Bayesian network is a **causal story drawn with arrows**. Each node only answers one local
> question: "how likely is this value, *given its direct causes*?" Multiply the local answers along the story
> and you get the probability of a whole scenario; add up scenarios and you get any probability you want;
> divide two such sums and you get a conditional probability.

The whole chapter in four operations:

- **product**: $P(\text{scenario}) = \prod_i P(x_i \mid \text{parents})$ (chain rule of Bayesian networks);
- **sum**: $P(X = x) = \sum_y P(X = x \wedge Y = y)$ over the variables you do not care about (marginalization);
- **division**: $P(a \mid b) = P(a \wedge b) / P(b)$ (conditioning, Bayes' rule);
- **reading the graph**: which variables can influence which, given what you observed (active trails).

## Acting under uncertainty (AIMA §12.1)

Dental diagnosis in logic: $Toothache \Rightarrow Cavity$ is wrong (gum problems, abscesses, …), and the fix
$Toothache \Rightarrow Cavity \vee GumProblem \vee Abscess \vee \dots$ never ends. Logic fails here for three
reasons:

| reason | meaning |
|---|---|
| **laziness** | listing every antecedent and consequent needed for an exceptionless rule is too much work |
| **theoretical ignorance** | the domain (medicine) has no complete theory |
| **practical ignorance** | even with all the rules, we cannot run every test on this patient |

Probability **summarizes** the uncertainty that comes from laziness and ignorance: "the patient has a cavity
with probability 0.8" is a **degree of belief**, not a **degree of truth** (that would be fuzzy logic). It is
always relative to the evidence the agent has; new evidence changes it.

**Rational decisions.** Plan $A_{90}$ = leave for the airport 90 minutes before the flight. Is it rational? It
depends on how likely it is to make the flight (probability) **and** on how much we dislike missing it
versus waiting at the airport (preferences). $A_{1440}$ (leave 24 hours earlier) almost surely makes the
flight but is a terrible plan.

$$\text{decision theory} = \text{probability theory} + \text{utility theory}$$

```fig bn-airport
Plans A_t (leave t minutes before the flight) with an assumed travel time (lognormal, median 50 minutes): P(make the flight | A_t)
rises with t (A_30 0.047, A_90 0.975, A_120 0.998, A_1440 practically 1), while the expected waiting grows (A_1440: about 23 hours).
Expected utility EU(A_t) = −E[wait] − M · P(miss) has a maximum: with a missed flight worth 600 minutes of waiting the best plan is A_93;
a costlier miss moves it right (M = 6000: A_119), a cheaper one left (M = 60: A_65).
```

An agent is rational iff it chooses the action with **maximum expected utility** (MEU), averaged over all the
possible outcomes of the action (AIMA §12.1.2):

```text
function DT-AGENT(percept) returns an action
    persistent: belief_state, probabilistic beliefs about the current state of the world
                action, the agent's action
    update belief_state based on action and percept
    calculate outcome probabilities for actions, given action descriptions and current belief_state
    select action with highest expected utility given probabilities of outcomes and utility information
    return action
```

## Probability basics (AIMA §12.2–12.4)

- **Random variables** have a domain: boolean ($cavity$ / $\neg cavity$), discrete
  ($Grade \in \{g_1, g_2, g_3\}$), …; a possible world assigns a value to every variable.
- **Prior** (unconditional) probability $P(a)$; **conditional** probability
  $P(a \mid b) = \dfrac{P(a \wedge b)}{P(b)}$ (when $P(b) > 0$).
- **Product rule**: $P(a \wedge b) = P(a \mid b)\,P(b) = P(b \mid a)\,P(a)$.
- **Chain rule** (any distribution, any order): $P(X_1, \dots, X_n) = \prod_i P(X_i \mid X_{i-1}, \dots, X_1)$.
- **Full joint distribution**: the probability of every possible world; every other probability follows from it.

Dentist full joint distribution (AIMA Figure 12.3):

| | toothache, catch | toothache, ¬catch | ¬toothache, catch | ¬toothache, ¬catch |
|---|---|---|---|---|
| **cavity** | 0.108 | 0.012 | 0.072 | 0.008 |
| **¬cavity** | 0.016 | 0.064 | 0.144 | 0.576 |

**Marginalization** (exam 6 Feb 2024, Question 1): sum the joint over every value of the other variables.

$$P(X = x_i) = \sum_j P(X = x_i \wedge Y = y_j)$$

$P(cavity) = 0.108 + 0.012 + 0.072 + 0.008 = 0.2$; $P(toothache) = 0.108 + 0.012 + 0.016 + 0.064 = 0.2$.
Variant **conditioning**: $P(Y) = \sum_z P(Y \mid z)\,P(z)$.

**Conditional probability** = ratio of two marginals:
$P(cavity \mid toothache) = \dfrac{0.108 + 0.012}{0.2} = 0.6$. The denominator does not depend on the value
of $Cavity$, so it is often written as a **normalization constant** $\alpha$:

$$\mathbf{P}(X \mid e) = \alpha\,\mathbf{P}(X, e) = \alpha \sum_y \mathbf{P}(X, e, y)
\qquad \mathbf{P}(Cavity \mid toothache) = \alpha \langle 0.12, 0.08 \rangle = \langle 0.6, 0.4 \rangle$$

**Independence** (AIMA §12.4): $X$ and $Y$ are independent iff $P(x \wedge y) = P(x)\,P(y)$ for all values,
equivalently $P(x \mid y) = P(x)$. **Conditional independence** given $Z$:
$P(x \wedge y \mid z) = P(x \mid z)\,P(y \mid z)$ for all values. In the dentist table $Toothache$ and $Catch$
are **not** independent ($P(toothache \wedge catch) = 0.124 \ne 0.2 \cdot 0.34$), but they are independent
**given** $Cavity$: both are caused by the cavity, and once we know about it, one tells nothing more about the
other ($0.108 / 0.2 = 0.54 = 0.6 \cdot 0.9$).

```fig bn-joint
Interactive full joint of Toothache, Catch, Cavity (AIMA Fig. 12.3): choose an event and evidence; the cells summed light up.
P(cavity) = 0.108 + 0.012 + 0.072 + 0.008 = 0.2; P(cavity | toothache) = 0.12 / 0.2 = 0.6, i.e. P(Cavity | toothache) = α⟨0.12, 0.08⟩ = ⟨0.6, 0.4⟩.
P(toothache ∧ catch) = 0.124 ≠ P(toothache) P(catch) = 0.2 · 0.34 = 0.068 (dependent);
P(toothache ∧ catch | cavity) = 0.54 = 0.6 · 0.9 (independent given cavity).
```

> **Exam trap:** "independent" and "conditionally independent" are different claims, and neither implies the
> other. Toothache and Catch are dependent but conditionally independent given Cavity; two independent causes
> become dependent once their common effect is observed (explaining away, below).

## Bayes' rule (AIMA §12.5)

From the two forms of the product rule:

$$P(b \mid a) = \frac{P(a \mid b)\,P(b)}{P(a)} \qquad\qquad \mathbf{P}(Y \mid x) = \alpha\,\mathbf{P}(x \mid Y)\,\mathbf{P}(Y)$$

Experts know (and tables store) the **causal** direction $P(\text{effect} \mid \text{cause})$; diagnosis needs
the **diagnostic** direction $P(\text{cause} \mid \text{effect})$. Meningitis: $P(s \mid m) = 0.7$,
$P(m) = 1/50000$, $P(s) = 0.01$ give $P(m \mid s) = 0.7 \cdot 0.00002 / 0.01 = 0.0014$: a stiff neck makes
meningitis 70 times more likely, but it stays very unlikely. The causal number $P(s \mid m)$ is also more
**robust**: an epidemic changes $P(m)$ and $P(m \mid s)$, not $P(s \mid m)$.

**Combining evidence.** With effects that are conditionally independent given the cause:

$$\mathbf{P}(Cavity \mid toothache \wedge catch) = \alpha\,\mathbf{P}(toothache \mid Cavity)\,\mathbf{P}(catch \mid Cavity)\,\mathbf{P}(Cavity)
= \alpha \langle 0.6 \cdot 0.9 \cdot 0.2,\ 0.1 \cdot 0.2 \cdot 0.8 \rangle = \langle 0.871, 0.129 \rangle$$

the same value as the full joint table ($0.108 / 0.124$). One cause with many conditionally independent effects
is the **naive Bayes** model.

```fig bn-bayes
Natural frequencies: 1000 people coloured by cause and evidence, then 1000 people who show the evidence.
Sliders for P(H), P(e | H), P(e | ¬H). Presets: cavity | toothache (0.2, 0.6, 0.1 → 0.6); cavity | toothache ∧ catch (0.2, 0.54, 0.02 → 0.871);
meningitis | stiff neck (1/50000, 0.7, P(s) = 0.01 → 0.0014: of 100,000 people 1.4 have both, about 999 have a stiff neck without meningitis).
```

## Bayesian networks (AIMA §13.1)

A Bayesian network is a **directed acyclic graph** where

- each node is a random variable;
- an arrow $X \to Y$ means $X$ is a **parent** of $Y$ ("$X$ has a direct influence on $Y$");
- each node $X_i$ has a **conditional probability table** (CPT) $P(X_i \mid Parents(X_i))$: one row per
  combination of the parents' values, each row sums to 1. A root has just its prior.

Burglary network (AIMA Figure 13.2): the alarm reacts to burglaries and (sometimes) to earthquakes; John and
Mary call when they hear it.

```fig bn-burglary
Burglary → Alarm ← Earthquake; Alarm → JohnCalls; Alarm → MaryCalls.
P(b) = 0.001, P(e) = 0.002. P(a | B, E): tt 0.95, tf 0.94, ft 0.29, ff 0.001.
P(j | A): t 0.90, f 0.05. P(m | A): t 0.70, f 0.01.
```

**Compactness.** A boolean node with $k$ boolean parents needs $2^k$ numbers (one per row; the other column is
$1 - p$). With $n$ nodes and at most $k$ parents each: $n \cdot 2^k$ numbers instead of $2^n - 1$ for the full
joint. Burglary: $1 + 1 + 4 + 2 + 2 = 10$ instead of 31; $n = 30$, $k = 5$: 960 instead of more than a billion.

The **student network** used by the course (exams 6 Feb 2024 and 12 Jul 2024):

```fig bn-student
Difficulty {d0, d1} → Grade {g1, g2, g3} ← Knowledge {k0, k1}; Knowledge → Test {s0, s1}; Grade → Letter {L0, L1}. Each node is drawn with its CPT (the numbers of the table below).
```

| $P(D)$ | $P(K)$ | $K, D$ | $g_1$ | $g_2$ | $g_3$ | $G$ | $L_0$ | $L_1$ | $K$ | $s_0$ | $s_1$ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| $d_0$: 0.1 | $k_0$: 0.7 | $k_0, d_0$ | 0.3 | 0.4 | 0.3 | $g_1$ | 0.1 | 0.9 | $k_0$ | 0.95 | 0.05 |
| $d_1$: 0.9 | $k_1$: 0.3 | $k_0, d_1$ | 0.05 | 0.25 | 0.7 | $g_2$ | 0.4 | 0.6 | $k_1$ | 0.2 | 0.8 |
| | | $k_1, d_0$ | 0.9 | 0.08 | 0.02 | $g_3$ | 0.99 | 0.01 | | | |
| | | $k_1, d_1$ | 0.5 | 0.3 | 0.2 | | | | | | |

(The priors of $D$ and $K$ change between exam versions; the other tables do not.)

## Semantics: the chain rule of Bayesian networks (AIMA §13.2)

A network defines the full joint distribution as the product of its CPTs (exam 6 Feb 2024, Question 2):

$$P(X_1, \dots, X_n) = \prod_i P(X_i \mid \text{Parents}_G(X_i))$$

$$P(j, m, a, \neg b, \neg e) = P(j \mid a)\,P(m \mid a)\,P(a \mid \neg b \wedge \neg e)\,P(\neg b)\,P(\neg e)
= 0.90 \cdot 0.70 \cdot 0.001 \cdot 0.999 \cdot 0.998 = 0.000628$$

For $A \to B \leftarrow C \to D \leftarrow E$ (exam 6 Feb 2026):
$P(A, B, C, D, E) = P(A)\,P(C)\,P(E)\,P(B \mid A, C)\,P(D \mid C, E)$.

Compared with the general chain rule, each factor $P(X_i \mid X_{i-1}, \dots, X_1)$ has been shortened to
$P(X_i \mid Parents(X_i))$: the network **claims** that each variable is conditionally independent of its other
predecessors given its parents. That claim is what makes it compact, and what can make it wrong.

```fig bn-chainrule
Burglary network with its CPTs; click a node to flip its value. The probability of the atomic event is rebuilt one factor per node,
parents first, with the CPT row in use highlighted: P(¬b) P(¬e) P(a | ¬b, ¬e) P(j | a) P(m | a) = 0.999 · 0.998 · 0.001 · 0.9 · 0.7 = 0.000628.
Under it, the general chain rule in the same order with the non-parents struck out (P(j | ¬b, ¬e, a) becomes P(j | a)). The 32 events sum to 1.
```

> **Exam trap:** exam tables often list only $P(X = \text{True} \mid \dots)$. For $X = \text{False}$ use
> $1 - p$ **of the same row**: $P(\neg a \mid b, \neg e) = 1 - 0.94 = 0.06$. Each **row** sums to 1, not each
> column. Write the symbolic product first: the exam grades the number only if the formula is right.

## Constructing a network: node ordering (AIMA §13.2)

```text
1. Nodes: choose an ordering X1, ..., Xn of the variables (causes before effects works best)
2. Links: for i = 1 to n
     choose a minimal set of parents for Xi among X1, ..., X(i-1) such that
         P(Xi | X(i-1), ..., X1) = P(Xi | Parents(Xi))
     draw an arrow from each parent to Xi and write the CPT P(Xi | Parents(Xi))
```

**Every** ordering yields a correct network (it represents the domain's joint distribution exactly), but not an
equally good one:

| ordering of the burglary variables | arrows | numbers |
|---|---|---|
| $B, E, A, J, M$ (causal) | the network above | 10 |
| $M, J, A, B, E$ | $M \to J$; $M, J \to A$; $A \to B$; $A, B \to E$ | 13 |
| $M, J, E, B, A$ | every earlier node is a parent | 31 (= full joint) |

With a diagnostic ordering, the numbers are also harder to assess ($P(E \mid A, B)$: who knows that?).

```fig bn-ordering
The three orderings of the table built node by node: B, E, A, J, M gives 1 + 1 + 4 + 2 + 2 = 10 numbers;
M, J, A, B, E gives 1 + 2 + 4 + 2 + 4 = 13; M, J, E, B, A gives 1 + 2 + 4 + 8 + 16 = 31.
```

Telescopes (exam 8 Sep 2025): $N$ stars, measurements $M_1, M_2$, focus problems $F_1, F_2$. The causal network
is $N \to M_1 \leftarrow F_1$, $N \to M_2 \leftarrow F_2$, with $P(F_1), P(F_2), P(N), P(M_1 \mid N, F_1), P(M_2 \mid N, F_2)$. The ordering $M_1, M_2, N, F_1, F_2$ gives a correct but bigger network:
$P(M_1), P(M_2 \mid M_1), P(N \mid M_1, M_2), P(F_1 \mid M_1, N), P(F_2 \mid M_2, N)$.

> **Exam trap:** "correct" is not "causal". A network is a correct representation iff every independence it
> claims holds in the domain. An **extra** arrow never makes a network wrong (only less efficient); a
> **missing** arrow can. $F_1 \to M_1 \to N \leftarrow M_2 \leftarrow F_2$ is wrong: it claims that $M_1$ and
> $M_2$ are independent (v-structure at $N$), although they measure the same stars, and that given $M_1, M_2$
> the focus says nothing more about $N$ (but a blurred telescope explains a low count).

## Conditional independence in Bayesian networks (AIMA §13.2.1)

Two local properties follow from the semantics:

- each variable is conditionally independent of its **non-descendants** given its **parents**
  (JohnCalls is independent of Burglary and MaryCalls given Alarm);
- each variable is conditionally independent of **all** the others given its **Markov blanket**: parents,
  children, and the children's other parents.

For any other question, look at how influence flows along a **trail** (a path that ignores the arrow
directions). Everything follows from three triples:

| triple | name | middle node $Y$ **not** observed | $Y$ observed |
|---|---|---|---|
| $X \to Y \to Z$ | causal chain | active | **blocked** |
| $X \leftarrow Y \to Z$ | common cause (fork) | active | **blocked** |
| $X \to Y \leftarrow Z$ | common effect (**v-structure**) | **blocked** | active (also if a **descendant** of $Y$ is observed) |

```fig bn-triples
Chain X → Y → Z and fork X ← Y → Z: active when Y is not observed, blocked when Y is observed.
V-structure X → Y ← Z: blocked when Y is not observed, active when Y (or a descendant of Y) is observed.
```

> **Key idea:** a trail $X_1 - X_2 - \dots - X_n$ is **active** given the evidence $Z$ iff
> (1) for every v-structure $X_{i-1} \to X_i \leftarrow X_{i+1}$, $X_i$ or one of its descendants is in $Z$, and
> (2) no other node of the trail is in $Z$. If no trail between $X$ and $Y$ is active, $X$ and $Y$ are
> **d-separated** by $Z$, and then $X \perp Y \mid Z$ in every distribution the network represents.

```python
def is_active(g, trail, evidence):          # g = {node: tuple of parents}
    if trail[0] in evidence or trail[-1] in evidence:
        return False
    for a, b, c in zip(trail, trail[1:], trail[2:]):
        if a in g[b] and c in g[b]:                         # a -> b <- c
            if b not in evidence and not descendants(g, b) & evidence:
                return False
        elif b in evidence:                                 # chain or fork through b
            return False
    return True
```

**Worked example** (exam 16 Jan 2025): $E \to HD \leftarrow D \to Hb$, $HD \to BP$, $HD \to CP \leftarrow Hb$.

| evidence | active trails with at least 3 variables | blocked (examples) |
|---|---|---|
| $Hb$ = yes | $E \to HD \to CP$, $E \to HD \to BP$, $D \to HD \to CP$, $D \to HD \to BP$, $BP \leftarrow HD \to CP$ (and their reverses) | $D \to Hb \to CP$ ($Hb$ observed), $E \to HD \leftarrow D$ (v-structure, nothing below $HD$ observed) |
| $Hb$ = yes, $HD$ = yes | only $E \to HD \leftarrow D$ | everything else goes **through** $HD$ or $Hb$ as a chain/fork |

**Explaining away.** Burglary and Earthquake are independent ($B \to A \leftarrow E$ is blocked). Once the
alarm is heard they compete to explain it: $P(b \mid a) = 0.374$, but $P(b \mid a, e) = 0.003$. Hearing John
call (a descendant of Alarm) is enough to make them dependent.

```fig bn-dsep
Interactive burglary network: click nodes to observe them and check the trails Burglary–Alarm–Earthquake (v-structure),
JohnCalls–Alarm–MaryCalls (fork) and Burglary–Alarm–JohnCalls (chain).
```

> **Exam trap:** the v-structure works the **opposite** way from chains and forks: observing the middle node
> (or any descendant) **opens** it. In the exam of 16 Jan 2025, observing $HD$ closes all the trails through
> $HD$ **and** opens $E \to HD \leftarrow D$. Also, a trail with an observed **endpoint** is not counted.

## Efficient representation of conditional distributions (AIMA §13.2.2)

A CPT grows as $2^k$ with $k$ parents; often the relation has a simple shape:

- **deterministic nodes**: the value is a function of the parents ($NorthAmerican \Leftrightarrow Canadian \vee US \vee Mexican$);
- **context-specific independence**: a parent only matters for some values of the others;
- **noisy-OR**: each cause $j$ alone produces the effect unless an independent **inhibitor** blocks it, with
  probability $q_j$; then $P(\neg \text{effect} \mid \text{causes}) = \prod_{j \text{ true}} q_j$ ($k$ numbers
  instead of $2^k$). Fever with $q_{cold} = 0.6$, $q_{flu} = 0.2$, $q_{malaria} = 0.1$:
  $P(fever \mid cold, flu, malaria) = 1 - 0.6 \cdot 0.2 \cdot 0.1 = 0.988$.

```fig bn-noisyor
Cold, Flu, Malaria → Fever with inhibition probabilities q = 0.6, 0.2, 0.1 (sliders). The 8-row CPT is computed live:
P(¬fever | causes) = product of q over the true causes: e.g. cold, flu: 0.6 · 0.2 = 0.12 → P(fever) = 0.88; all three: 0.012 → 0.988; no cause: P(fever) = 0.
3 numbers instead of 2^3 = 8.
```

(Continuous variables, AIMA §13.2.3, are not in the program.)

## Inference by enumeration (AIMA §13.3.1)

Query $\mathbf{P}(X \mid e)$ with hidden variables $Y$: marginalize the joint, and compute each joint term with
the chain rule.

$$\mathbf{P}(X \mid e) = \alpha\,\mathbf{P}(X, e) = \alpha \sum_y \mathbf{P}(X, e, y)$$

```text
function ENUMERATION-ASK(X, e, bn) returns a distribution over X
    Q(X) <- a distribution over X, initially empty
    for each value xi of X do
        Q(xi) <- ENUMERATE-ALL(bn.VARS, e extended with X = xi)
    return NORMALIZE(Q(X))

function ENUMERATE-ALL(vars, e) returns a real number        # vars in topological order
    if EMPTY?(vars) then return 1.0
    V <- FIRST(vars)
    if V has value v in e then return P(v | parents(V)) * ENUMERATE-ALL(REST(vars), e)
    else return SUM over v of P(v | parents(V)) * ENUMERATE-ALL(REST(vars), e extended with V = v)
```

Burglary: $\mathbf{P}(B \mid j, m) = \alpha \langle 0.00059224, 0.0014919 \rangle = \langle 0.284, 0.716 \rangle$.
Time $O(2^n)$ for $n$ boolean variables, space $O(n)$.

```fig bn-enumeration
The enumeration tree of P(b, j, m) = P(b) Σ_e P(e) Σ_a P(a | b, e) P(j | a) P(m | a): paths e,a 0.5985; e,¬a 0.000025;
¬e,a 0.5922; ¬e,¬a 0.00003; branch e 0.002·0.598525 = 0.00119705; branch ¬e 0.998·0.59223 = 0.59104554;
P(b, j, m) = 0.00059224, P(¬b, j, m) = 0.0014919, normalized ⟨0.284, 0.716⟩.
```

**Worked example 1: a marginal** (exam 6 Feb 2024, student network above):

$$P(L_1) = \sum_d \sum_k \sum_g P(L_1 \wedge d \wedge k \wedge g) = \sum_d \sum_k \sum_g P(d)\,P(k)\,P(g \mid d \wedge k)\,P(L_1 \mid g)$$

Test does not appear: summed out, $\sum_s P(s \mid k) = 1$. Group by grade:

| | $g_1$ | $g_2$ | $g_3$ |
|---|---|---|---|
| $P(g) = \sum_d \sum_k P(d) P(k) P(g \mid d, k)$ | 0.2145 | 0.2689 | 0.5166 |
| $P(L_1 \mid g)$ | 0.9 | 0.6 | 0.01 |
| product | 0.19305 | 0.16134 | 0.00517 |

$P(L_1) = 0.360$ (e.g. $P(g_1) = 0.1 \cdot 0.7 \cdot 0.3 + 0.9 \cdot 0.7 \cdot 0.05 + 0.1 \cdot 0.3 \cdot 0.9 + 0.9 \cdot 0.3 \cdot 0.5 = 0.2145$).

**Worked example 2: a posterior** (exam 12 Jul 2024): the course is hard ($d_1$) and the student got a C
($g_3$). Knowledge?

$$P(k_1 \mid d_1, g_3) = \frac{P(g_3 \wedge k_1 \wedge d_1)}{P(d_1 \wedge g_3)}
= \frac{P(g_3 \mid k_1, d_1)\,P(k_1)\,P(d_1)}{\sum_k P(g_3 \mid d_1, k)\,P(d_1)\,P(k)}
= \frac{0.2 \cdot 0.9 \cdot 0.3}{0.7 \cdot 0.9 \cdot 0.7 + 0.2 \cdot 0.9 \cdot 0.3} = \frac{0.054}{0.495} = 0.109$$

The prior was $P(k_1) = 0.3$: the C makes high knowledge much less likely.

```fig bn-student-enum
Stepper on the student network. P(L1): Test sums out; P(g1) = 0.1·0.7·0.3 + 0.9·0.7·0.05 + 0.1·0.3·0.9 + 0.9·0.3·0.5 = 0.2145,
P(g2) = 0.2689, P(g3) = 0.5166; times P(L1 | g) = 0.9, 0.6, 0.01: 0.19305 + 0.16134 + 0.00517 = 0.3596 ≈ 0.360.
P(k1 | d1, g3): numerator 0.2·0.3·0.9 = 0.054, denominator 0.441 + 0.054 = 0.495, ratio 0.109 (prior 0.3).
```

> **Exam trap:** a leaf that is neither queried nor observed (Test, Blood Pressure) sums to 1 and disappears;
> a hidden variable **between** the query and the rest (Grade in $P(L_1)$) does not. And never forget the
> denominator: $P(k_1 \wedge g_3 \wedge d_1) = 0.054$ is a joint, not the answer.

## Causal, evidential and intercausal reasoning (exam 12 Jul 2024)

| pattern | direction | student network, version of Jul 2024 |
|---|---|---|
| **causal** (predictive) | from causes to effects, top-down | $P(L_1) = 0.360$; knowing she studied: $P(L_1 \mid k_1) = 0.655$ |
| **evidential** (diagnostic) | from effects to causes, bottom-up | $P(k_1) = 0.3$; she got a C: $P(k_1 \mid g_3) = 0.106$, and $P(d_1 \mid g_3) = 0.958$ (prior 0.9) |
| **intercausal** (explaining away) | between causes of a common effect | $P(k_1 \mid g_3, d_1) = 0.109$ but $P(k_1 \mid g_3, d_0) = 0.028$ |

```fig bn-reasoning
Click a value to observe it; every bar shows P(X = x | evidence) computed by enumeration, with a tick at the prior.
Student network: P(L1) = 0.360, P(L1 | k1) = 0.655 (causal); P(k1 | g3) = 0.106 and P(d1 | g3) = 0.958 (evidential);
P(k1 | g3, d1) = 0.109 but P(k1 | g3, d0) = 0.028 (intercausal). Burglary network: P(b | a) = 0.374, P(b | a, e) = 0.003 (explaining away), P(b | j, m) = 0.284.
```

The official model answer: causal reasoning flows in the causal direction, from the priors (Difficulty,
Knowledge) down, e.g. the probability of a recommendation letter given that the student studied a lot;
evidential reasoning flows the opposite way and revises our beliefs about the priors given what happened,
e.g. "the student got a C: how does this change the probability that the exam was difficult, or that the
student knew the material?".

## Summary

| task | formula |
|---|---|
| marginal | $P(X = x_i) = \sum_j P(X = x_i \wedge Y = y_j)$ |
| conditional | $P(a \mid b) = P(a \wedge b) / P(b)$, or $\alpha\,\mathbf{P}(X, e)$ |
| Bayes' rule | $P(b \mid a) = P(a \mid b)\,P(b) / P(a)$ |
| joint in a network | $P(X_1, \dots, X_n) = \prod_i P(X_i \mid \text{Parents}_G(X_i))$ |
| query by enumeration | $\mathbf{P}(X \mid e) = \alpha \sum_y \prod_i P(\cdot \mid \text{parents})$ |
| independence in a network | no active trail (d-separation) |
| size of a network | $\sum_i 2^{\lvert Parents(X_i) \rvert}$ numbers (boolean) vs $2^n - 1$ |

## How the exam asks it

An *Uncertainty* problem appeared on 9 Feb 2023, 6 Feb 2024, 12 Jul 2024, 16 Jan 2025, 8 Sep 2025 and
6 Feb 2026 (not in every session). The recurring question types:

1. **Joint probability of a full assignment** (9 Feb 2023: four entries of the flu network; 6 Feb 2026:
   $P(A=1, B=1, C=1, D=1, E=1)$). Write the chain-rule product with one factor per node, then the numbers;
   mind $1 - p$ for "False" columns.
2. **Joint of some variables / marginal of one variable** (9 Feb 2023: $P(F = False)$; 6 Feb 2024: derive
   and compute $P(Letter = L_1)$ or $L_0$; 16 Jan 2025: $P(CP, HD, Hb)$). Sum the chain rule over the hidden
   variables, $\sum_e \sum_d \dots$; drop unobserved leaves. Three-digit precision: keep four or more digits in
   the intermediate results.
3. **Posterior given evidence** (12 Jul 2024: $P(k_1 \mid g_3, d_1)$ and compare with the prior; 6 Feb 2026:
   $P(E = 1 \mid D = 1, C = 1)$, $P(C = 1 \mid A = 1, B = 0)$). Ratio of two sums; the factors that do not
   depend on the query variable cancel.
4. **Independence shortcuts** (6 Feb 2026: $P(A = 1 \mid E = 0) = P(A = 1)$). Say **why**: no active trail
   between $A$ and $E$ without evidence (the v-structures at $B$ and $D$ are blocked).
5. **Formulas to write** (6 Feb 2024: marginalization formula, chain rule of a network; 6 Feb 2026: the
   expression of $P(A, B, C, D, E)$).
6. **Reasoning patterns** (12 Jul 2024): causal vs evidential reasoning, and write an evidential question.
7. **Active trails** (16 Jan 2025): list active trails given some evidence; say how they change when another
   variable is observed (trails through it close, v-structures on it open).
8. **Network structure** (9 Feb 2023: add new variables $P$ and $R$ and draw the network; 8 Sep 2025: which
   networks are correct representations and which distributions each one needs).
