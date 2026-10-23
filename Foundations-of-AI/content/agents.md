# Intelligent Agents

The course takes the **acting rationally** view of AI: build *agents* that perceive an environment and act
to do "the right thing". This page gives the vocabulary used everywhere else: rationality, PEAS, the seven
environment properties, and the four agent architectures (slides p. 1–51, AIMA ch. 2).

## Intuition

An agent is a loop: **perceive → decide → act**, forever. Everything interesting is in *decide*:

- a thermostat decides from the current reading only (simple reflex);
- a Roomba with a map remembers where it has been (model-based);
- a navigator imagines the future and checks if it reaches the destination (goal-based);
- a taxi driver also weighs *how good* each future is: fast vs safe (utility-based).

> **Key idea:** an agent is judged by the **consequences** of its actions in the environment, measured by a
> performance measure chosen by the designer — not by how clever its reasoning looks.

## What is AI? (slides p. 3–19)

Definitions vary along two axes: *thinking vs acting* and *human vs rational* performance.

| | human-like | rational |
|---|---|---|
| **thinking** | cognitive modeling (GPS by Newell & Simon) | "laws of thought", logic |
| **acting** | Turing test (1950) | **rational agents** ← this course |

Acting rationally is more general than thinking rationally (correct inference is only one way to act well)
and easier to define precisely than human behaviour. AI was born at the **Dartmouth workshop (1956)**
(McCarthy, Minsky, Shannon, Rochester).

## Agents and environments (slides p. 20–23)

- An **agent** (robot, software program, …) perceives its **environment** through **sensors** and acts on it
  through **actuators** (effectors).
- **Percept** $p(t)$: what the agent perceives at time $t$. **Percept sequence**: $p(0), p(1), \dots, p(t)$,
  everything perceived so far.
- **Agent function** $f: P^\ast \to A$ maps every percept *sequence* to an action: an abstract, mathematical
  description of behaviour.
- **Agent program**: the concrete code that implements $f$ on a physical **architecture**. It receives
  **one** percept at a time; anything else it needs must be kept in persistent variables.

> **Exam trap:** agent *function* (a mapping, possibly infinite table) ≠ agent *program* (finite code).
> Two different programs can implement the same function.

## Rationality (slides p. 24, 30)

> **Rational agent:** for every possible percept sequence, a rational agent chooses the action that
> **maximizes the expected value** of its **performance measure**, given its **knowledge up to that moment**.

What is rational at a given time depends on four things:

1. the **performance measure** that defines success;
2. the agent's **prior knowledge** of the environment;
3. the **actions** it can perform;
4. its **percept sequence** to date.

The **performance measure** is the criterion for evaluating the success of the behaviour; it is
**defined by the designer** and evaluates the sequence of *environment* states. Design it according to
what you want in the environment, not according to how you think the agent should behave (rewarding
"dirt sucked" rewards dumping dirt and sucking it again).

> **Exam trap:** rational ≠ omniscient ≠ successful. An agent that looks both ways and is hit by a falling
> cargo door acted rationally: rationality maximizes **expected** performance given the percepts, not the
> actual outcome. It does include *gathering information* (look before crossing) and *learning*.

## PEAS: specifying the task environment (slides p. 25–26)

**P**erformance measure, **E**nvironment, **A**ctuators, **S**ensors. AIMA Fig. 2.5:

| agent | Performance | Environment | Actuators | Sensors |
|---|---|---|---|---|
| medical diagnosis | healthy patient, reduced costs | patient, hospital, staff | display of questions, tests, diagnoses, treatments | touchscreen/voice entry of symptoms and findings |
| satellite image analysis | correct categorization of objects, terrain | orbiting satellite, downlink, weather | display of scene categorization | high-resolution digital camera |
| part-picking robot | % of parts in correct bins | conveyor belt with parts; bins | jointed arm and hand | camera, tactile and joint angle sensors |
| refinery controller | purity, yield, safety | refinery, raw materials, operators | valves, pumps, heaters, stirrers, displays | temperature, pressure, flow, chemical sensors |
| English tutor | student's score on test | set of students, testing agency | display of exercises, feedback, speech | keyboard entry, voice |
| automated taxi | safe, fast, legal, comfortable trip, profit | roads, traffic, pedestrians, customers | steering, accelerator, brake, signal, horn, display | cameras, GPS, speedometer, odometer, accelerometer, engine sensors |

> **Exam trap:** for software agents the actuators are "display …" and the sensors are "keyboard/entry of …".
> The performance measure is a *criterion*, never a device.

## Properties of task environments (slides p. 27–29)

From the agent's standpoint the environment can be:

| property | meaning |
|---|---|
| **fully** vs **partially observable** | sensors give the complete relevant state at each time, or not (noise, hidden parts) |
| **single-agent** vs **multiagent** | other agents whose performance depends on ours (competitive: chess; cooperative: …) |
| **deterministic** vs **stochastic** vs **nondeterministic** | next state completely determined by state + action; or uncertain with **probabilities**; or uncertain with possible outcomes listed **without** probabilities |
| **episodic** vs **sequential** | independent episodes (decision depends only on the current one), or current decisions affect future ones |
| **static** vs **dynamic** (vs **semidynamic**) | the world does not change while the agent deliberates; it does; the world doesn't but the score does (chess with a clock) |
| **discrete** vs **continuous** | finite/countable states, time, percepts, actions; or real-valued |
| **known** vs **unknown** | the agent (designer) knows the "laws" of the environment — the outcomes of actions — or not |

AIMA Fig. 2.6 (slides p. 29) — learn the reasoning, not the table:

| task | Observable | Agents | Deterministic | Episodic | Static | Discrete |
|---|---|---|---|---|---|---|
| crossword puzzle | fully | single | deterministic | sequential | static | discrete |
| chess with a clock | fully | multi | deterministic | sequential | semi | discrete |
| poker | partially | multi | stochastic | sequential | static | discrete |
| backgammon | fully | multi | stochastic | sequential | static | discrete |
| taxi driving | partially | multi | stochastic | sequential | dynamic | continuous |
| medical diagnosis | partially | single | stochastic | sequential | dynamic | continuous |
| image analysis | fully | single | deterministic | episodic | semi | continuous |
| part-picking robot | partially | single | stochastic | episodic | dynamic | continuous |
| refinery controller | partially | single | stochastic | sequential | dynamic | continuous |
| English tutor | partially | multi | stochastic | sequential | dynamic | discrete |

> **Exam trap:** *known/unknown* is about knowledge of the rules, *observable* is about perception. Solitaire
> is known but partially observable; a new video game can be fully observable but unknown.

> **Exam trap:** fixed rules do not make a game deterministic: dice (backgammon) and shuffled decks (poker)
> make it stochastic.

The hardest case is partially observable, multiagent, stochastic, sequential, dynamic, continuous and unknown —
the real world (taxi driving).

## Agent programs (slides p. 31–34)

The **vacuum world** (AIMA Fig. 2.2): squares `A` and `B`, each clean or dirty. Percept `[location, status]`,
actions `Left`, `Right`, `Suck` (and `NoOp`).

The most literal program is a giant lookup table indexed by **percept sequences** (Fig. 2.7):

```text
function TABLE-DRIVEN-AGENT(percept) returns an action
    persistent: percepts, a sequence, initially empty
                table, a table of actions, indexed by percept sequences
    append percept to the end of percepts
    action ← LOOKUP(percepts, table)
    return action
```

With $|P|$ possible percepts and lifetime $T$ the table has $\sum_{t=1}^{T} |P|^t$ entries: 1 398 100 for
the vacuum world ($|P| = 4$) with $T = 10$, astronomically many for a taxi.

> **Key idea (slides p. 34):** the key challenge is to write programs that produce rational behaviour from a
> **smallish program**. The four architectures below are four ways to compress the table.

## The four agent architectures (slides p. 35–51)

### 1. Simple reflex agent (slides p. 36–41)

Acts on the **current percept only**, through **condition–action rules** (if *condition* then *action*).

```text
function SIMPLE-REFLEX-AGENT(percept) returns an action
    persistent: rules, a set of condition–action rules
    state ← INTERPRET-INPUT(percept)
    rule ← RULE-MATCH(state, rules)
    action ← rule.ACTION
    return action

function REFLEX-VACUUM-AGENT([location, status]) returns an action
    if status = Dirty then return Suck
    else if location = A then return Right
    else if location = B then return Left
```

Works only if the right decision can be made from the current percept (≈ fully observable). With no memory
it can loop forever: the vacuum agent goes **back and forth** after cleaning. Examples: early Roomba (random
moves, turn on bump), IFTTT recipes, tic-tac-toe rules ("if you can win, win; if the opponent wins, block").

### 2. Model-based reflex agent — reflex agent with state (slides p. 42–45)

Adds an internal **state**: its best guess of the current world, updated with two models.

- **transition model** (action model + environment model): how the world evolves and what actions do;
- **sensor model**: how the world state is reflected in the percepts.

```text
function MODEL-BASED-REFLEX-AGENT(percept) returns an action
    persistent: state, transition_model, sensor_model, rules, action (most recent, initially none)
    state ← UPDATE-STATE(state, action, percept, transition_model, sensor_model)
    rule ← RULE-MATCH(state, rules)
    action ← rule.ACTION
    return action
```

Handles partial observability by remembering what it cannot see now. Example: Roomba 980 builds a map
with SLAM.

### 3. Goal-based agent (slides p. 46–48)

Adds **goals** and uses the model to predict **"what the world will be like if I do action a"**: it chooses
actions that lead to a goal, possibly after a long sequence → **search** and **planning** (next topics).
More flexible: change the goal, not the rules. Example: game-tree search in tic-tac-toe.

### 4. Utility-based agent (slides p. 49–51)

Replaces the binary goal (happy / unhappy) with a **utility function** $U(s)$, the "happiness" in a state, and
chooses the action that maximizes the **expected utility**:

$$a^* = \arg\max_a \sum_{s'} P(s' \mid s, a)\, U(s')$$

Needed when goals conflict (speed vs safety) or when the likelihood of success must be weighed against the
importance of the goals. More expensive in computation.

| architecture | uses | adds to the previous one | example |
|---|---|---|---|
| simple reflex | current percept + rules | — | first Roomba, IFTTT |
| model-based reflex | + internal state | memory, transition & sensor model | Roomba 980 (SLAM) |
| goal-based | + prediction + goals | "what if I do $a$?", search/planning | route finder, game tree |
| utility-based | + utility | *how good* a state is, expected utility | taxi trading speed vs safety |

## Worked example: reflex vs model-based in the vacuum world

Both squares dirty, start in `A`. Score per step: +1 per clean square, −1 per move.

| t | reflex: percept → action | points | model-based: percept → action | points |
|---|---|---|---|---|
| 1 | (A, Dirty) → Suck | 1 | (A, Dirty) → Suck | 1 |
| 2 | (A, Clean) → Right | 1 − 1 = 0 | (A, Clean) → Right | 0 |
| 3 | (B, Dirty) → Suck | 2 | (B, Dirty) → Suck | 2 |
| 4 | (B, Clean) → Left | 2 − 1 = 1 | (B, Clean) → **NoOp** (both known clean) | 2 |
| 5 | (A, Clean) → Right | 1 | (B, Clean) → NoOp | 2 |
| 6 | (B, Clean) → Left | 1 | (B, Clean) → NoOp | 2 |
| | **total** | **6** | **total** | **9** |

With free moves both agents are rational; with a move cost only the agent with **memory** is. The
model-based agent's `NoOp` is right only because its model assumes dirt never reappears.

> **Intuition:** the agent's rationality is always relative to a performance measure *and* to what it can
> know. Change either and the best program changes.

## How it connects

- **Problem formulation & search** (next): a problem-solving agent is a **goal-based** agent for environments
  that are fully observable, static, discrete, deterministic and known: it formulates a problem, searches for
  an action sequence and executes it.
- **CSP, local search:** factored states and goal tests inside goal-based agents.
- **Adversarial search & MCTS:** multiagent environments; **expected utility** reappears in expectiminimax,
  bandits and UCB.
