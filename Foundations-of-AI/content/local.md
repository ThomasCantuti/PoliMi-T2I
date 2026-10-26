# Local Search & Optimization

A different paradigm: instead of building a solution step by step, start from a **complete** candidate and
**improve it a little at a time**, guided by an objective function. Constant memory, often very fast, but it
can get stuck – and it never proves that no solution exists (slides p. 318–336, AIMA ch. 4.1).

## Intuition

Climbing a mountain in thick fog: you only see the ground around your feet, so you keep stepping uphill.
When every step goes down you stop – maybe on the summit, maybe on a foothill, maybe on a flat ledge where
you can't tell which way is up.

| so far … | local search |
|---|---|
| informed/uninformed search: start from an **empty path**, build one step by step | start from a **random complete state** |
| CSPs: start from an **empty assignment**, build a feasible one step by step | modify it a little until it is good/feasible |
| memory: frontier + reached set | memory: the **current state** only |
| returns a path | returns a state (the path is irrelevant) |

> **Key idea:** we need a function that evaluates whether the modified solution **improves** the current one
> (p. 320). For a CSP, a function that says how far an unfeasible solution is from a feasible one (p. 333).

## Ingredients

- **Complete-state formulation**: every state is a full candidate solution (both hospitals placed, all 8
  queens on the board).
- **Objective function** to maximize, or **cost** $h$ to minimize (the two are the same with a sign change).
- **Neighbors**: the states reachable by a small modification (move one hospital by one cell; move one queen
  inside its column). The neighborhood defines the *landscape*.

## Hill climbing (p. 321)

```text
function HILL-CLIMBING(problem) returns a state that is a local maximum
    current <- problem.INITIAL
    while true do
        neighbor <- a highest-valued successor state of current
        if VALUE(neighbor) <= VALUE(current) then return current
        current <- neighbor
```

At each step the current state is replaced by its **best neighbor** (steepest ascent – or steepest
descent when minimizing a cost); it stops when no neighbor is better. Ties between equally good neighbors
must be broken somehow (first, last, random).

## Example: homes and hospitals (p. 322–330)

Place two hospitals on a 5 × 10 grid so that the sum of the Manhattan distances from each house to its
**closest** hospital is minimal.

```viz local
Homes & hospitals – steepest descent (slides p. 322–330)
5 × 10 grid, houses at (0,8) (1,2) (3,1) (4,6), hospitals start at (0,4) (3,9): cost 3 + 6 + 4 + 4 = 17 (p. 324).
Steepest descent moves one hospital one cell at a time.
```

Neighbors: move one hospital one cell up/down/left/right (p. 325: 6 neighbors here, with costs
15, 15, 18, 17, 16, 15). The slides show the run

| step | hospitals | cost |
|---|---|---|
| start | (0,4) (3,9) | 17 |
| 1 | (0,4) (3,8) | 15 |
| 2 | (1,4) (3,8) | 13 |
| 3 | (1,3) (3,8) | 11 |
| 4 | (2,2) (3,8) | 9 |

> **Exam trap:** step 3 → 4 is **not** a single one-cell move. From (1,3),(3,8) every neighbor costs ≥ 11, so
> strict hill climbing **stops at 11** (whatever the tie-breaking). Reaching 9 – the global optimum – needs a
> **sideways move** first, e.g. to (2,3),(3,8) (still 11), then to (2,2),(3,8). "Hill climbing might converge
> to a maximum that is not the global maximum" (p. 330).

## Why hill climbing gets stuck (Figure 4.1, p. 331)

```fig local-landscape
The objective function over the state space: a shoulder, the global maximum, a local maximum and a "flat" local maximum.
From the current state every uphill step leads to the local maximum.
```

| landscape feature | what it is | effect |
|---|---|---|
| **global maximum** | the best state | the goal |
| **local maximum** | better than all its neighbors, worse than the global maximum | hill climbing stops there |
| **"flat" local maximum** | a plateau with no uphill exit | stops (or wanders forever with sideways moves) |
| **shoulder** | a plateau with an uphill exit | stops – unless sideways moves are allowed |
| ridge | a sequence of local maxima not connected by single moves | very hard for greedy moves |

Remedies (AIMA 4.1): **sideways moves** (allow moving to an equally good neighbor, with a limit on
consecutive ones), **random restarts** (repeat from new random states until success), randomization in the
choice of the neighbor.

> **Intuition (random restart):** if one climb succeeds with probability $p$, the expected number of climbs
> is $1/p$. For 8-queens steepest descent succeeds ≈ 14% of the time → about 7 climbs, each only a few steps.

## CSPs as optimization (p. 332–335)

Start from an **unfeasible** complete assignment and repair it. The cost is the **number of violated
constraints**: $h = 0$ iff the assignment is a solution.

4-queens (p. 334), state = row of the queen in each column:

| state | attacking pairs | $h$ |
|---|---|---|
| (3, 2, 3, 2) | rows 1–3, 2–4; diagonals 1–2, 2–3, 3–4 | 5 |
| (3, 1, 3, 2) | row 1–3; diagonal 3–4 | 2 |
| (3, 1, 4, 2) | none | 0 – a solution |

Figure 4.3 (p. 335): (b) an 8-queens state with $h = 17$; the numbers on the board are the $h$ of its 56
neighbors (move one queen within its column), 8 of which tie for the best value 12. Steepest descent from it
goes $17 \to 12 \to 7 \to 3 \to 2 \to 1$ and stops. (a) a state with $h = 1$ (only the queens of columns 4 and
7 attack each other) where **every** neighbor is worse: a local minimum.

```viz local
8-queens hill climbing from Fig. 4.3(b) (h = 17)
Steepest descent on 8-queens from the h = 17 state of Figure 4.3(b): 17 → 12 → 7 → 3 → 2 → 1, then stuck.
```

## Min-conflicts

The local-search algorithm for CSPs (AIMA 6.4, the `min_conflicts` of csp.ipynb the slides point to, p. 336):

```text
current <- a complete assignment
repeat max_steps times:
    if current is a solution: return current
    var <- a randomly chosen conflicted variable
    value <- the value of var that minimizes the number of conflicts (ties broken at random)
    set var = value in current
return failure
```

It is hill climbing that changes **one variable at a time** with random choices, which makes plateaus easy
to cross. On n-queens the number of steps barely depends on $n$ (≈ 50 steps for a million queens, with a
greedy initial assignment). Still local: from Figure 4.3(a) it never moves.

```viz local
8-queens – min-conflicts
Min-conflicts on 8-queens: pick a conflicted queen at random, move it to the row with the fewest conflicts.
```

| | backtracking (+ FC, AC-3, MRV) | hill climbing / min-conflicts |
|---|---|---|
| state | consistent **partial** assignment | **complete**, possibly infeasible assignment |
| memory | $O(n)$ stack (+ domains) | $O(n)$: just the current state |
| complete? | yes – finds a solution or proves none exists | no – can get stuck, cannot prove unsolvability |
| optimal? | n/a (any solution) | no – local optima |
| strength | small/tight problems, proofs of infeasibility | huge problems with many solutions, optimization, online repair |

## How it connects

- **CSPs** (previous topic): same problems, opposite direction – extend a consistent partial assignment vs
  repair an inconsistent complete one. The heuristic $h$ = number of violated constraints is the CSP's
  constraint list turned into a cost.
- **Informed search**: $h$ here is an objective, not an estimate of the remaining path cost; there is no
  path, no frontier and no optimality guarantee.
- **Adversarial search / MCTS** (next topics): randomness and restarts reappear as tools to escape bad
  regions of a huge space.

## Exam checklist

- Give the complete-state formulation: state, neighbors, objective/cost.
- Compute the cost of a state and of all its neighbors; pick the best (state your tie-breaking).
- Run hill climbing to the end and say whether it stopped at a global or a local optimum, and why
  (local maximum, plateau, shoulder).
- For n-queens: count attacking pairs; each pair once.
- Explain why hill climbing is neither complete nor optimal, and what restarts / sideways moves change.
