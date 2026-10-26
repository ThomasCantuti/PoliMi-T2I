# Chapter intro videos: scripts

One short video at the top of every Theory tab: a map of the chapter, not a lesson. Nothing appears in a video that
is not on the page.

## Template (same for all 12)

| beat | time | what you see |
|---|---|---|
| 1 · Previously | 0–25 s | The course map zooms to this chapter and the chapters it builds on light up. Two or three things they gave you, drawn with their own figures, then one concrete scene where they stop being enough. |
| 2 · Big picture | 25–55 s | The chapter's one core picture, animated. It reuses the figures from the Theory tab, so you recognize them later. |
| 3 · Roadmap | 55–75 s | The page's sections as stations on a line (the same list as "On this page"). |
| 4 · Exam payoff | 75–90 s | Real exam problems from the Problems tab, with their titles exactly as the app shows them. |

About 90 s and 200 words of English narration per video, with captions in the video so it also works muted. Same colors
as the app (dark theme), same title card, roadmap and end card in every video.

## The course map

The opening shot of every video. Video 01 shows it in full; the others zoom to their own station.

```text
1 Agents
└─ Searching for a plan:  2 Formulation → 3 Uninformed → 4 Informed
   ├─ Exploiting structure:  5 CSP → 6 Local search
   ├─ Opponents and learning:  7 Adversarial → 8 MCTS → 9 RL
   └─ Reasoning:  10 Logic → 11 Planning → 12 Uncertainty
```

---

## 01 · Intelligent Agents

**Builds on:** nothing, it's the first chapter. Beat 1 shows the whole course instead.

**1 · The course in one picture (0–25 s).** *Screen:* a loop, perceive → decide → act. The word "decide" opens into the
course map, and its groups light up one by one.
> This course builds one thing: an agent. It perceives the world, decides, acts, and then does it again. Every chapter
> after this one is a different answer to the same question: how should it decide? By searching, by satisfying
> constraints, by playing against an opponent, by learning from rewards, by reasoning with logic, and with probability.

**2 · Big picture (25–55 s).** *Screen:* the four architectures, one box added per step (the agents stepper).
> Start simple. A thermostat decides from the current reading only. A robot vacuum with a map remembers where it has
> been. A navigator imagines the future and checks whether it reaches the destination. A taxi driver also weighs how
> good each future is: fast, or safe? Each one adds a single box to the one before. Whatever is inside, an agent is
> judged by what its actions do to the world.

**3 · Roadmap (55–75 s).** *Screen:* What is AI · Agents and environments · Rationality · PEAS · Environment
properties · The four architectures.
> In this chapter: what AI is, agents and environments, rationality, describing a task with PEAS, the properties of an
> environment, and the four agent architectures.

**4 · Exam payoff (75–90 s).** *Screen:* "Exam · Jul 2023 · Rank task environments by property", "Exam · Jul 2022 ·
Simple reflex agent for a light-seeking robot".
> In the exam you'll rank task environments by their properties, or design a simple reflex agent for a robot that
> looks for light. After this chapter, both take a few minutes.

---

## 02 · Problem Solving by Search

**Builds on:** 01 Agents (the goal-based agent, environment properties).

**1 · Previously.** *Screen:* the goal-based agent from video 01; the environment checklist ticks: fully observable,
deterministic, static, discrete, known.
> Last chapter, the goal-based agent imagined the future and checked whether it reached its goal. In a world that is
> fully observable, deterministic, static and known, all of that imagining can happen before the first move: the
> solution is a fixed sequence of actions. What's missing is a way to describe the problem so a program can search for
> that sequence.

**2 · Big picture.** *Screen:* an 8-puzzle board; three cards appear: what a state is, which moves are legal, what a
move does. The board multiplies into a huge faint graph and a small tree grows from the start through it. Then
8-queens: 1.8 × 10¹⁴ shrinks to 2,057.
> Take the 8-puzzle. You never write down its 181,440 configurations. You describe what a configuration is, which moves
> are legal, and what a move does. That description defines a huge graph without drawing it. Search then grows a tree
> of paths from the start, hoping to reach the goal after seeing only a tiny corner of that graph. And the formulation
> decides how big the graph is: for eight queens, from about 10¹⁴ states down to about two thousand.

**3 · Roadmap.** *Screen:* Formulating a problem · The 8-puzzle · Size of the state space · Abstraction · Different
formulations · The search tree · Graph search · Best-first search.
> In this chapter: the five ingredients of a search problem, counting states, abstraction, different formulations of
> the same problem, and how search trees, tree search and graph search work.

**4 · Exam payoff.** *Screen:* "Exam · Jan 2024 · Cryptarithmetic SAVE + MORE = MONEY as a search problem", "Exam ·
Jul 2026 · Word-concatenation game: formulation and branching factor".
> Exams often open with exactly this: formulate a puzzle as a search problem, then give its branching factor and the
> size of its state space.

---

## 03 · Uninformed Search

**Builds on:** 02 Formulation (search tree, frontier).

**1 · Previously.** *Screen:* the search tree from video 02, frontier nodes glowing yellow.
> You can now write a problem as states, actions and a goal test, and search grows a tree of paths from the start. At
> every moment some nodes are waiting to be expanded: the frontier. One decision is left, and it changes everything:
> which frontier node do you expand next?

**2 · Big picture.** *Screen:* the same tree three times, nodes numbered in expansion order: FIFO queue (rings),
priority on g (cheapest first), LIFO stack (one branch). Then iterative deepening: limits 0, 1, 2, 3, the tree regrowing
each round.
> A search strategy is an ordering of the frontier. With a first-in, first-out queue, search spreads out in rings:
> breadth-first. Order by the path cost so far and you get uniform-cost search, which always extends the cheapest path.
> Use a stack and it dives down one branch: depth-first. Iterative deepening runs depth-first with a limit that grows by
> one each round. It sounds wasteful, yet it combines the strengths of both.

**3 · Roadmap.** *Screen:* Tree vs graph search · Evaluating a strategy (b, d, m) · Breadth-first · Uniform-cost ·
Depth-first · Depth-limited · Iterative deepening · Bidirectional · Summary table.
> In this chapter: how to judge a strategy (completeness, optimality, time and space), six strategies, and one table
> that compares them all.

**4 · Exam payoff.** *Screen:* "Exam · Jun 2024 · States k → 2k, 2k+1: iterative deepening search", "Exam · Jul 2022 ·
Knight on a 3×4 board: breadth-first search".
> In the exam you run these by hand: the order in which nodes are expanded, the frontier at each step, the solution
> found.

---

## 04 · Informed Search

**Builds on:** 03 Uninformed (uniform-cost search, the best-first loop).

**1 · Previously.** *Screen:* uniform-cost search on the Romania map: rings of equal cost grow around Arad, as far west
as toward Bucharest.
> Uniform-cost search always extends the cheapest path found so far, so it is optimal. It is also blind: it spreads in
> every direction, away from the goal as much as toward it, because it only looks back at what it has already paid.

**2 · Big picture.** *Screen:* f = g + h assembles: g as a solid line behind the node, h as a dashed straight line to
Bucharest. Greedy (f = h), uniform-cost (f = g), A* (f = g + h); the rings stretch toward the goal.
> Give it a guess of the cost still to go: a heuristic, h. Greedy search looks only ahead, at h. Uniform-cost looks
> only back, at g. A* looks both ways: g plus h, the cost of the whole trip through this node. When the guess never
> overestimates, A* still returns the cheapest path, and it expands far fewer nodes to find it. The chapter shows
> exactly when, and why.

**3 · Roadmap.** *Screen:* Best-first template · Greedy · 8-puzzle heuristics · A* · Admissible · Consistent ·
Optimality · Which nodes A* expands · Relaxed problems and dominance · Weighted A* · IDA*.
> In this chapter: greedy search and A*, admissible and consistent heuristics, why A* is optimal and which nodes it
> expands, how to invent heuristics, and two variants, weighted A* and IDA*.

**4 · Exam payoff.** *Screen:* "Exam · Jun 2023 · Graph from C to F: A* search", "Exam · Jan 2022 · Criss-Cross
solitaire: admissible heuristic and one A* step".
> The exam asks you to run A* on a graph step by step, and to design a heuristic and prove it admissible.

---

## 05 · Constraint Satisfaction Problems

**Builds on:** 03 Uninformed (depth-first search), 04 Informed (heuristics), 02 Formulation (8-queens).

**1 · Previously.** *Screen:* a search node drawn as a sealed box that only answers "goal?" and "next?". The Australia
map: plain search fills all seven regions and finds the clash only at the end.
> Until now a state was a black box. Search could ask two things: is this the goal, and what comes next? To color a
> map, that means filling in every region and discovering a clash only at the end. Depth-first search and heuristics
> are still useful here. They just can't see inside the box.

**2 · Big picture.** *Screen:* the box opens into variables, domains and constraints. The map next to its constraint
graph: WA becomes red, red disappears from NT and SA, SA (fewest colors left) goes next, Tasmania is set aside.
> Open the box: variables, their possible values, and constraints between them. Now search can do what you'd do by
> hand. Color one region. Cross that color off in its neighbors. Pick the region with the fewest colors left. And the
> moment some region has no color left, undo the last choice. Backtracking, filtering, ordering: that's the whole
> chapter.

**3 · Roadmap.** *Screen:* Factored states · Definition and examples · Constraint graph · Backtracking · Forward
checking · Arc consistency (AC-3) · MRV, degree, LCV · Problem structure · The complete 4-queens example.
> In this chapter: defining a CSP, backtracking search, forward checking and arc consistency, the ordering heuristics
> MRV, degree and LCV, and how the structure of a problem helps.

**4 · Exam payoff.** *Screen:* "Exam · Jan 2026 · 4×4 Sudoku with forward checking and MRV (version A)", "Exam · Jun
2025 · AC-3 proves {WA = G, V = R} inconsistent (Australia)".
> The exam gives you a small CSP and asks for the backtracking tree with forward checking and MRV, or a full run of
> AC-3, arc by arc.

---

## 06 · Local Search & Optimization

**Builds on:** 05 CSP (same problems), 04 Informed (h as an objective).

**1 · Previously.** *Screen:* the CSP backtracking tree building an assignment one variable at a time, the path
highlighted; then the finished 8-queens board alone while the path fades out.
> Backtracking builds a solution one variable at a time, from an empty assignment, and search keeps the whole path that
> led there. For many problems the path doesn't matter: for eight queens, the final board is all you need. And a
> frontier of millions of nodes is a high price for a path you'll throw away.

**2 · Big picture.** *Screen:* a random full 8-queens board, conflicts as red lines; one queen moves and the conflicts
drop. Then the landscape figure: a climber steps uphill and stops on the local maximum; a random restart drops it
somewhere else.
> Local search starts from a complete state, even a bad one, and repairs it a little at a time. Hill climbing is a walk
> in thick fog: you only see the ground at your feet, so you always step uphill. When every step goes down, you stop.
> Maybe on the summit, maybe on a foothill or a flat ledge. Random restarts and sideways moves are the ways out.

**3 · Roadmap.** *Screen:* Ingredients · Hill climbing · Homes and hospitals · Why it gets stuck · CSPs as
optimization · Min-conflicts.
> In this chapter: hill climbing on a worked example, local maxima, plateaus and ridges, and solving CSPs as
> optimization with min-conflicts.

**4 · Exam payoff.** *Screen:* "Exam · Jan 2023 · Grid navigation as a hill-climbing problem".
> The exam asks you to model a problem for local search: the states, the neighbors, the objective, and where hill
> climbing gets stuck.

---

## 07 · Adversarial Search

**Builds on:** 03 Uninformed (depth-first and depth-limited search), 01 Agents (multiagent environments).

**1 · Previously.** *Screen:* a path planned in advance; an opponent's piece appears and moves; the planned path
breaks.
> Search computed a fixed sequence of actions before moving, because nothing else changed the world. Add an opponent
> and the plan breaks after your first move: what you should do next depends on what they did. You need a strategy,
> an answer to every reply.

**2 · Big picture.** *Screen:* the Figure 5.2 tree: leaves light up, MIN nodes take the minimum, MAX the maximum, the
root gets 3. Then alpha-beta on the same tree: two leaves are cut away and the answer is still 3.
> You are MAX. For each move you imagine MIN's best reply, the worst case for you, and you pick the move whose worst
> case is best. That's minimax: values flow up from the end of the game. Alpha-beta gets the same answer while skipping
> branches that cannot change it. Real games are too deep to search to the end, so programs stop at a depth limit and
> score the position with an evaluation function.

**3 · Roadmap.** *Screen:* Games as search · Minimax · Alpha-beta · Move ordering · Evaluation functions ·
Expectiminimax · More than two players.
> In this chapter: minimax, alpha-beta pruning and move ordering, evaluation functions, games with dice, and games with
> more than two players.

**4 · Exam payoff.** *Screen:* "Exam · Jan 2026 · Alpha-beta values and pruned nodes (version B)", "Exam · Sep 2023 · A
tree where alpha-beta prunes nothing, and the best reordering".
> This is one of the most common exam questions: a game tree, the minimax value of every node, and the branches
> alpha-beta prunes.

---

## 08 · Monte Carlo Tree Search & Bandits

**Builds on:** 07 Adversarial (alpha-beta and its limits), 06 Local search (randomness as a tool).

**1 · Previously.** *Screen:* the alpha-beta tree with its two requirements labeled, "small branching factor" and "an
evaluation function e(s)". Then a Go board: b ≈ 250, e(s) = ?
> Alpha-beta needs two things: a branching factor small enough to search deep, and an evaluation function for the
> positions where it stops. Go has about 250 moves per position, against 20 to 35 in chess, and nobody knows how to
> score a Go position by hand.

**2 · Big picture.** *Screen:* from one position, many random playouts to the end and a win counter. Then a row of slot
machines, one per move. Then the tree growing lopsided while the four phases cycle: select, expand, simulate,
backpropagate.
> So stop scoring positions by hand: play them out at random, many times, and count the wins. Noisy, but averages
> converge. Then spend the next simulation where it matters most. Each move is a slot machine: play the one that has
> paid best, unless another has been tried so rarely that it might be better. UCB1 balances the two. Select, expand,
> simulate, backpropagate, and repeat: the tree grows where the good moves are.

**3 · Roadmap.** *Screen:* Why not alpha-beta · Rollouts · The four phases · Node statistics · Step-by-step example ·
Bandits, ε-greedy, UCB1 · UCT · MCTS vs minimax · Four ways to build a player · AlphaZero.
> In this chapter: rollouts, the four phases of MCTS, multi-armed bandits with ε-greedy and UCB1, UCT, and how AlphaZero
> puts it all together.

**4 · Exam payoff.** *Screen:* "Exam · Feb 2023 · MCTS for the white player: UCB1, selection, three iterations".
> The exam gives you a partial tree with win counts: compute UCB1, choose where to expand, and update the statistics
> after each playout.

---

## 09 · Learning to Search and Play

**Builds on:** 08 MCTS (bandits, ε-greedy), 04 Informed (A* needs a model).

**1 · Previously.** *Screen:* A* on a grid with its model visible (actions, results, costs). Then a bandit: one choice,
one reward, done. Then a grid with no model, covered in fog.
> Two tools so far. A* plans a path, but it needs a model of the world: the actions, where they lead, what they cost.
> Bandits learn from rewards by trying, but each choice stands alone. What if there's no model, and every action
> changes the situation you'll face next?

**2 · Big picture.** *Screen:* the RL loop figure. Then the Q-learning stepper: the reward travels back one cell per
episode and arrows fill the grid.
> The agent acts, and the world answers with a new state and a reward. The agent keeps one number for every state and
> action, Q: how much future reward to expect from doing this here and then playing well. After each step it nudges
> that number toward what it just saw: the reward, plus the discounted value of where it landed. Episode after episode
> the reward flows back from the goal, and the table becomes a map of arrows.

**3 · Roadmap.** *Screen:* Learning agents · The RL loop · Expected payoff · Rewards · Values and the Bellman equation ·
Policies and exploration · MDPs · Q-learning · Why tables don't scale · Search vs learning · Minimax vs Q-learning.
> In this chapter: rewards and discounting, value functions and the Bellman equation, exploration, Q-learning, and how
> learning compares with search and with minimax.

**4 · Exam payoff.** *Screen:* "Exam · Aug 2022 & Jan 2023 · Q-table after given episodes, and at convergence", "Exam ·
Jun & Jul 2026 · State values V(s) at convergence in a small maze".
> The exam gives you a small grid and a few episodes: fill in the Q-table after each one, and the values at
> convergence.

---

## 10 · Logical Agents & Propositional Logic

**Builds on:** 01 Agents (knowledge-based agents), 05 CSP (true/false variables with constraints), 03 Uninformed
(search over models).

**1 · Previously.** *Screen:* three states from earlier chapters (a search node, a CSP assignment, a game board); a
note saying "if it rains, the street is wet" finds nowhere to stick on any of them.
> Every agent so far knew the world as a state: a node, an assignment, a board. None of them could store a general
> rule like "if it rains, the street is wet" and use it to work out new facts. The CSP chapter left a hint: variables
> that are true or false, with constraints between them. That's where logic starts.

**2 · Big picture.** *Screen:* a grid of possible worlds. Each sentence of the knowledge base crosses some out; the
survivors stay lit, and α's region covers all of them. Then two roads, "enumerate the worlds" and "rewrite the
sentences", meet at one box: KB ∧ ¬α has no model.
> A sentence is a constraint on possible worlds. "If it rains, the street is wet" rules out one kind of world: rain
> with a dry street. A knowledge base is the set of worlds that survive all its sentences, and a fact follows when it
> is true in every one of them. You can check that by enumerating worlds, or by rewriting sentences with sound rules
> like resolution. Both come down to one test: the knowledge base plus the negated query has no model.

**3 · Roadmap.** *Screen:* Knowledge-based agents · Models and entailment · Propositional logic · Validity and
satisfiability · CNF · Resolution · Horn clauses · Forward and backward chaining · DPLL · WalkSAT · First-order logic.
> In this chapter: propositional logic, entailment, CNF and resolution, forward and backward chaining, and the SAT
> solvers DPLL and WalkSAT.

**4 · Exam payoff.** *Screen:* "Exam · Resolution refutations (2022–2026)", "Exam · DPLL tables (2023–2026)".
> The exam asks you to translate English into logic, convert it to CNF, prove a query by resolution, and run DPLL step
> by step.

---

## 11 · Classical Planning

**Builds on:** 03–04 search (forward planning is search), 10 Logic (states and actions as sentences).

**1 · Previously.** *Screen:* a search node as an opaque box with a hand-written heuristic next to it; a logic sentence,
readable. The two slide together.
> Search can solve any problem, but each new domain needs its own successor function and its own heuristic, and the
> states are opaque. Logic describes states and rules in sentences a program can read. Planning puts the two together.

**2 · Big picture.** *Screen:* a robot and a box in rooms R1 and R2; the state as a list of facts. An action as a recipe
card: preconditions, then facts to delete and facts to add. Forward: a tree from the state. Backward: from the goal,
"which card could produce this?". Then SATPlan: plan lengths L = 0, 1, 2 as layers.
> A state is a list of facts that are true right now. An action is a recipe card: if these facts hold, erase these and
> write these. Because the cards are readable, the planner can reason about them. Search forward from the current
> state, or backward from the goal, asking which card could have produced it. Or turn "a plan of length L exists" into
> logic and hand it to a SAT solver. One planner, any domain.

**3 · Roadmap.** *Screen:* Representation · STRIPS vs PDDL · Schemas vs ground actions · Forward planning · Backward
planning · Heuristics · SATPlan · Nondeterministic domains.
> In this chapter: writing states and action schemas in STRIPS and PDDL, forward and backward planning, relevant and
> consistent actions, planning heuristics, and SATPlan.

**4 · Exam payoff.** *Screen:* "Exam · Write the action schemas (2023–2026)", "Exam · Regressing the goal: how many
ways, which new goals (2022–2026)".
> The exam asks you to write the action schemas for a domain, draw a forward planning tree, and regress a goal through
> each relevant action.

---

## 12 · Uncertainty & Bayesian Networks

**Builds on:** 10 Logic (true/false knowledge), 01 Agents (the utility-based agent), 08 Bandits (probabilities from
experience).

**1 · Previously.** *Screen:* a logic sentence, Alarm ⇒ Burglary ∨ Earthquake. The alarm rings; question marks over
Burglary and Earthquake. Then the utility-based agent from video 01 with its expected-utility formula.
> Logic answers true, false, or "I don't know". The alarm goes off: logic can say "burglary or earthquake", but not
> which is more likely, and the agent has to act anyway. Back in chapter one, the utility-based agent already weighed
> outcomes by their probabilities. Now you'll see where those probabilities come from.

**2 · Big picture.** *Screen:* the burglary network builds node by node; one CPT fills in; then multiply along one
scenario, add scenarios, divide (the figures from the Theory tab).
> A Bayesian network is a causal story drawn with arrows. Each node answers one local question: how likely is this,
> given its direct causes? Multiply the local answers along the story and you get the probability of a whole scenario.
> Add scenarios together and you get any probability you want. Divide two of them and you get a conditional one. And
> the arrows tell you which variables can influence which, given what you've observed.

**3 · Roadmap.** *Screen:* Acting under uncertainty · Probability basics · Bayes' rule · Bayesian networks · The chain
rule · Node ordering · d-separation · Compact CPTs · Inference by enumeration · Causal, evidential and intercausal
reasoning.
> In this chapter: probability and Bayes' rule, Bayesian networks and their chain rule, building a network, active
> trails and d-separation, and inference by enumeration.

**4 · Exam payoff.** *Screen:* "Exam · Jan 2025 · Heart-disease network: active trails", "Exam · Jul 2024 · Student
network: evidential reasoning P(k1 | g3, d1)".
> The exam gives you a network with its tables: compute a probability by enumeration, and list the trails that are
> active given some evidence.
