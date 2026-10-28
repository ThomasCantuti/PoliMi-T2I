# Informed Search

Uninformed search only knows the problem definition. **Informed** search also gets a hint: a
**heuristic** $h(n)$ that estimates how far a node is from the goal. The algorithm is the same
best-first loop as uniform-cost search; only the evaluation function $f(n)$ that orders the
frontier changes — and with it optimality, speed and memory (slides p. 174–256).

## Intuition

> **Key idea:** informed strategies select from the frontier the node with the **smallest**
> evaluation $f(n)$, an estimate of how *promising* the node is. The frontier is a priority queue
> ordered by increasing $f(n)$ (slides p. 175–176).

- $g(n)$: cost of the path from the root to $n$ — **known for sure**.
- $h(n)$: estimated cost of the cheapest path from $n$ to a goal — **a guess**. If we knew the
  true value we would have already solved the problem (p. 180).
- $h^*(n)$: the **true** cost of the cheapest path from $n$ to a goal. $C^*$: cost of the optimal
  solution, i.e. $h^*(\text{root})$.

| $f(n)$ | algorithm |
|---|---|
| $g(n)$ | uniform-cost search (previous topic) |
| $h(n)$ | greedy best-first search |
| $g(n) + h(n)$ | A* |
| $g(n) + w\,h(n)$, $w > 1$ | weighted A* |

> **Intuition:** greedy only looks **ahead** ("how close am I?"), uniform-cost only looks **back**
> ("how much have I paid?"), A* looks both ways ("how much will the whole trip cost through here?").

```fig search-race
Uniform-cost search (f = g), greedy best-first (f = h) and A* (f = g + h) run side by side on the same grid, one expansion each per tick, with the course best_first_search (FIFO ties). On the slides' navigation grid: 29, 27 and 25 nodes expanded; path costs 11, 25 and 11. On the "two walls" map: 238, 92 and 121 expanded; costs 26, 32 and 26. In an open field: 211, 18 and 18 expanded, all cost 18.
```

## The best-first search template

The course code (aima-python, p. 186). The `reached` table maps each state to the best node found
for it so far.

```python
def best_first_search(problem: Problem, f: Callable[[Node], float]) -> Node:
    "Search nodes with minimum f(node) value first."
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached: dict[Any, Node] = {problem.initial: node}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):          # goal test on SELECTION
            return node
        for child in expand(problem, node):
            s = child.state
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child               # new state, or a CHEAPER path to it:
                frontier.add(child)              # (re-)add it
    return failure

def g(n: Node) -> float: return n.path_cost

def astar_search(problem: Problem, h: Callable[[Node], float] | None = None) -> Node:
    """Search nodes with minimum f(n) = g(n) + h(n)."""
    h = h or problem.h
    return best_first_search(problem, f=lambda n: g(n) + h(n))
```

The **tree-search** version (p. 185) has no `reached` table: it only refuses children that close a
cycle on their own path (`if not is_cycle(child): frontier.add(child)`).

Conventions used in the exercises: children are generated in the order of `actions` (alphabetical
for `GraphProblem`), and the `PriorityQueue` breaks ties **first-in first-out**.

> **Exam trap:** the goal test happens when a node is **selected**, not when it is generated.
> Testing at generation can return a goal reached through an expensive path while a cheaper one is
> still in the frontier.

## Greedy best-first search

$f(n) = h(n)$ (p. 179): always expand the node that *looks* closest to the goal.

Navigation example (p. 198–200): start S, goal G, `#` obstacles, $h$ = Manhattan distance ignoring
obstacles.

```fig search-grid
Grid of 5 rows and 11 columns, # = obstacle:
. . . . . . . . . . .
. # . . . # # # # # .
. # # . . . G . . # .
S . # # # # # # # # .
. . . . . . . . . . .
Greedy follows the bottom corridor to the cell under G (h = 2), goes around and pays 25; A* returns the optimal path over the top, cost 11.
```

Greedy follows the decreasing $h$ along the bottom corridor up to the cell just under G ($h = 2$),
but a wall is in between: a **local minimum**. It then goes all the way around and returns a path of
cost 25; the optimal one (over the top) costs 11.

| property | greedy best-first (p. 191) |
|---|---|
| complete | no in general: it can follow an infinite path (yes on finite graphs with `reached`) |
| optimal | **no** |
| time / space | $O(b^m)$ worst case, $m$ = maximum depth (can be $\infty$); a good $h$ helps a lot |

> **Exam trap:** greedy is not optimal **even with the perfect heuristic** $h = h^*$. With
> S→A (10), A→G (1), S→B (1), B→G (5): $h^*(A) = 1 < h^*(B) = 5$, so greedy goes through A and pays
> 11 instead of 6. The problem is the evaluation function (it ignores $g$), not the heuristic.

## Heuristics for the 8-puzzle

(p. 181–183) A state is read row by row, `_` is the blank. The **blank is not a tile**: never count it.

- $h_1(n)$ = number of misplaced tiles.
- $h_2(n)$ = sum of the Manhattan distances of the tiles from their goal squares.

```fig search-heuristics
Node n = 5 _ 8 / 4 2 1 / 7 3 6, goal = 1 2 3 / 4 5 6 / 7 8 _. Misplaced tiles: 5, 8, 2, 1, 3, 6 (h1 = 6). Manhattan distances 2 + 3 + 0 + 1 + 3 + 0 + 3 + 1 = 13 (h2).
```

| tile | 5 | 8 | 4 | 2 | 1 | 7 | 3 | 6 | total |
|---|---|---|---|---|---|---|---|---|---|
| misplaced? | 1 | 1 | 0 | 1 | 1 | 0 | 1 | 1 | $h_1 = 6$ |
| Manhattan | 2 | 3 | 0 | 1 | 3 | 0 | 3 | 1 | $h_2 = 13$ |

The true cost of this state is 21. Intuitions (p. 182): a misplaced tile needs **at least one** move
($h_1$); a tile needs at least its Manhattan distance in moves **if no other tile were on the board**
($h_2$). Both are costs of **simpler (relaxed) problems** (p. 183).

## A* search

$f(n) = g(n) + h(n)$ estimates the cost of the cheapest solution **through** $n$ (p. 193). With
$h = 0$ it is uniform-cost search.

**Worked example** (exam style). Undirected graph, $h$ in brackets:

```fig search-astar
Undirected graph, h in brackets: S(8), A(6), B(6), C(3), D(2), E(5), G(0). Edges: S–A 2, S–B 3, A–C 3, A–D 4, B–C 4, B–E 3, C–G 4, D–G 5, E–G 6. A* selects S, A, C, D, B, G and returns S → A → C → G, cost 9.
```

| step | selected: $g + h = f$ | frontier after expanding it ($f$) |
|---|---|---|
| 1 | S: 0 + 8 = 8 | A 8, B 9 |
| 2 | A: 2 + 6 = 8 | C 8, D 8, B 9 |
| 3 | C: 5 + 3 = 8 | D 8, B 9, G 9 |
| 4 | D: 6 + 2 = 8 | B 9, G 9  (G through D: $g = 11$, not cheaper than 9 → dropped) |
| 5 | B: 3 + 6 = 9 | G 9, E 11 |
| 6 | G: 9 + 0 = 9 | **goal**: S → A → C → G, cost 9 |

C before D and B before G are **ties** broken FIFO. On the same graph greedy returns S → A → D → G
(cost 11) and uniform-cost search selects 7 nodes instead of 6.

On the navigation grid (p. 201) A* also starts towards the bottom corridor, but as $g$ grows the
$f$ of those cells exceeds that of the top route, and A* "comes back": it returns the optimal path
of cost 11 (25 nodes expanded, against 29 for uniform-cost search).

```viz search
Path planning grid: A* (slides p.198–201)
A* on the navigation grid of the greedy example: it first follows the bottom corridor, then the growing f sends it back to the top route; optimal path of cost 11, 25 nodes expanded.
```

> **Key idea:** by using both $g(n)$ and $h(n)$, A* can lead the agent away from suboptimal paths
> (p. 202).

**Completeness** (p. 204): if a solution exists it has finite cost $C^*$; since every step costs at
least $\varepsilon > 0$, $g$ keeps growing, so A* cannot expand nodes forever below $C^*$ and
terminates with a solution.

## Admissible heuristics

$$h \text{ is admissible} \iff 0 \le h(n) \le h^*(n) \text{ for every node } n$$

It never overestimates: it is **optimistic**; on a goal $h = 0$ (p. 206).

- $h_1$, $h_2$ are admissible (p. 208–209): each misplaced tile needs at least one move; each move
  moves one tile by one square, reducing $h_2$ by at most 1.
- Robot on a grid, step cost 1 for horizontal/vertical moves and $\sqrt 2$ for diagonal ones (p. 210–212):

| heuristic | 4 moves | 8 moves |
|---|---|---|
| Euclidean $\sqrt{(x_n - x_G)^2 + (y_n - y_G)^2}$ | admissible | admissible |
| Manhattan $\lvert x_n - x_G\rvert + \lvert y_n - y_G\rvert$ | admissible (and better) | **not** admissible |

From $(0,0)$ to $(4,4)$ with diagonals: $h^* = 4\sqrt 2 \approx 5.66$ but Manhattan says 8 (p. 212).
The exact cost without obstacles is the **octile distance**
$\sqrt 2 \min(dx, dy) + \lvert dx - dy\rvert$: admissible and better than Euclidean.

```fig search-admissible
A 7 × 12 robot grid with a wall; every cell shows h(n) and the true cost h*(n) (computed by Dijkstra from G), red where h overestimates. With 8 moves (diagonal √2) the optimal cost is C* = 13.07. Euclidean and octile are admissible and A* returns 13.07; Manhattan overestimates (a diagonal step counts 2) and A* returns 15.41; octile × 1.5 also overestimates and A* returns 13.9. With 4 moves Manhattan is admissible. A slider scales h from 0 to 3.
```

## Consistent heuristics

$$h \text{ is consistent} \iff h(n) \le c(n, a, n') + h(n') \text{ for every } n \text{ and successor } n', \quad h(\text{goal}) = 0$$

The **triangle inequality** (p. 218): going to $n'$ first and then estimating cannot look cheaper
than the direct estimate from $n$.

```fig search-consistent
Triangle n → n' (step cost c) → goal, with the estimates h(n) and h(n'). Consistent example (A → C in the A* example): 6 ≤ 3 + 3. Inconsistent example (p. 219): h(n) = 100, c(n, a, n') = 10, h(n') = 20, and 100 > 10 + 20.
```

- Every **consistent** heuristic is **admissible** (not vice versa): chain the inequality along an
  optimal path $n_0, \dots, n_k$: $h(n_0) \le \sum_i c(n_i, n_{i+1}) + h(\text{goal}) = h^*(n_0)$.
- $h_1$ and $h_2$ are consistent (p. 220): a move costs 1 and changes $h_1$ by at most 1, $h_2$ by exactly 1.
- Euclidean is consistent; Manhattan is consistent with 4 moves, **not** with diagonal moves (p. 221–222).
- Admissibility needs $h^*$ everywhere (solving the problem from every state); consistency is a
  **local** check on each edge.

## Optimality of A*

**Theorem 1 (tree search, p. 216).** A* tree search is optimal if $h$ is admissible (step costs
$\ge \varepsilon > 0$). Let $G'$ be a suboptimal goal in the frontier, so $f(G') = g(G') > C^*$ (as
$h(G') = 0$), and let $n$ be a frontier node on an optimal path:
$$f(n) = g(n) + h(n) \le g(n) + h^*(n) = C^* < f(G')$$
so $n$ is always selected before $G'$, until the optimal goal itself is selected.

**Theorem 2 (graph search, p. 225).** A* graph search is complete and optimal if $h$ is consistent.
For a successor $n'$ of $n$:
$$f(n') = g(n) + c(n, a, n') + h(n') \ge g(n) + h(n) = f(n)$$
so $f$ is non-decreasing along paths, A* selects nodes in non-decreasing order of $f$, and **the
first time a state is selected its path is optimal**. Hence with a consistent $h$ we never re-add a
state to the frontier and never change an entry in `reached` (p. 223–224).

**What if $h$ is admissible but inconsistent?** (p. 226–231) A cheaper path to an
already-expanded state can show up later. Slide example: S→A (1), S→B (2), A→C (1), B→C (2),
C→G (100); $h(A) = 100$, $h(B) = 1$, $h(C) = 90$ — admissible, but $100 > 1 + 90$.

| step | course A* (re-add if cheaper) | graph search that discards reached states |
|---|---|---|
| 1 | S → A ($f$ 101), B ($f$ 3) | same |
| 2 | B → C with $g = 4$ ($f$ 94) | same |
| 3 | C → G with $g = 104$ | same |
| 4 | A ($f$ 101) → C with $g = 2$: **re-added** ($f$ 92) | A → C already reached: **dropped** |
| 5 | C again → G with $g = 102$, re-added | G selected: **cost 104** ✗ |
| 6 | G selected: **cost 102** ✓ | |

```viz search
Inconsistent heuristic: expanded list vs tree search (slides p.227–229)
The slide example with the admissible but inconsistent h (h(A) = 100, h(B) = 1, h(C) = 90), run as graph search with an expanded list: the cheaper path to C through A is dropped and G is returned with cost 104 instead of 102.
```

| variant | guaranteed optimal with | price |
|---|---|---|
| tree search (`best_first_tree_search`) | admissible $h$ | many duplicate paths in the frontier |
| graph search that discards reached states | **consistent** $h$ | — |
| course `best_first_search` (re-add when cheaper) | admissible $h$ | some states expanded more than once |

> **Exam trap:** "with an admissible heuristic graph search is not guaranteed optimal" (p. 227)
> refers to the version that **discards** already-reached states. The course code re-adds a state
> reached through a cheaper path, so it stays optimal; it just re-expands it (C twice above).
> Some implementations instead keep each state once and propagate the better cost to its
> successors (p. 230).

## Which nodes does A* expand?

With a consistent heuristic (p. 232), comparing $f(n) = g^*(n) + h(n)$ with $C^*$:

| $f(n)$ | expanded? |
|---|---|
| $< C^*$ | **always** |
| $= C^*$ | **some** (depends on tie-breaking) |
| $> C^*$ | **never** |

In the worked example ($C^* = 9$): S, A, C, D ($f = 8$) surely; B and G ($f = 9$) maybe; E
($f = 11$) never.

```fig search-contours
The A* worked-example graph with each node colored by f(n) = g*(n) + h(n) against C* = 9: S, A, C, D have f = 8 (always expanded), B and G have f = 9 (maybe, depending on ties), E has f = 11 (never expanded).
```

A* is **optimally efficient**: no other optimal algorithm using the same $h$ is guaranteed to expand
fewer nodes (apart from ties at $f = C^*$), because any of them must expand every node with
$f < C^*$, or a cheaper solution could be hiding below it.

> **Exam trap:** a consistent heuristic is not automatically a *good* one. $h_0(n) = 0$ is
> consistent, and A* with $h_0$ is just uniform-cost search (p. 234–235).

## Designing heuristics: relaxed problems and dominance

> **Key idea:** an admissible heuristic can usually be seen as the cost of an **optimal solution
> to a relaxed problem**, obtained by removing constraints (p. 214). Removing constraints only adds
> actions, so the relaxed optimum can only be cheaper: $h \le h^*$.

| problem | relaxation | heuristic |
|---|---|---|
| 8-puzzle | a tile can move to any square | $h_1$ misplaced tiles |
| 8-puzzle | a tile can move to any adjacent square (as if alone) | $h_2$ Manhattan |
| grid, 4 moves | remove obstacles | Manhattan |
| grid, 8 moves | remove obstacles | octile ($\ge$ Euclidean) |
| grid, any direction | remove obstacles, move in any direction | Euclidean |

**Dominance** (p. 184). If $h_1(n) \le h_2(n)$ for every $n$ (both admissible), $h_2$ **dominates**
$h_1$: it is more accurate, more informed. A* with $h_2$ expands no more nodes, because every node
with $g + h_2 < C^*$ also has $g + h_1 < C^*$. In the 8-puzzle $h_2$ dominates $h_1$ (a misplaced
tile has Manhattan distance $\ge 1$). On `5 _ 8 / 4 2 1 / 7 3 6` ($C^* = 21$): **5802** expansions
with $h_1$, **932** with $h_2$.

```fig search-dominance
A breadth-first search from the goal labels all 181,440 reachable 8-puzzle states with their true cost h* (at most 31 moves) and checks h1 ≤ h2 ≤ h* in every one. Left: mean h1 and h2 against h*, both below the diagonal h = h*, h2 closer. Right: A* with h1 and with h2 on random instances of depth 2 to 24 (log scale), with the effective branching factor b* in a table; h2 expands several times fewer nodes at depth 24, and the gap grows with the depth.
```

If several admissible heuristics are available and none dominates, $\max(h_a, h_b)$ is admissible
and dominates both.

> **Exam trap:** a bigger $h$ is better **only while it stays admissible**. $2 h_1$ dominates
> $h_1$, but one move from the goal it says 2: it overestimates.

## Weighted A*: satisficing solutions

A* expands a lot of nodes. If we accept **satisficing** solutions ("good enough", p. 236), weighted
A* inflates the heuristic (p. 238):
$$f(n) = g(n) + w \cdot h(n), \qquad 1 \le w < \infty .$$

With an admissible $h$ the solution costs **at most $w \cdot C^*$**: when the goal $G'$ is selected,
a node $n$ of an optimal path is still in the frontier, and
$g(G') \le g(n) + w\,h(n) \le w\,(g(n) + h^*(n)) = w\,C^*$.

Hard 8-puzzle `8 6 7 / 2 5 4 / 3 _ 1` with $h_2$ ($C^* = 31$):

| $w$ | 1 (A*) | 1.5 | 2 | 5 |
|---|---|---|---|---|
| cost | 31 | 31 | 31 | 45 |
| expanded | 20450 | 967 | 427 | 286 |

$w = 0$ gives uniform-cost search, $w = 1$ A*, $w \to \infty$ greedy best-first search. The slide
p. 239 picture shows the same effect on a map: the explored area shrinks to a narrow band around
the path.

```viz search
Weighted A* (w = 2): fewer expansions, worse path
Weighted A* with f = g + 2h on a small graph: it expands only S and A and returns S → A → G with cost 7, while the optimal path S → C → D → E → G costs 6.
```

## Iterative deepening A* (IDA*)

IDA* cuts the memory of A* by bounding $f$ instead of the depth (p. 241–242). It assumes a
consistent heuristic.

```text
cutoff = f(root-node)
repeat
  1. perform depth-first search by expanding all nodes n such that f(n) <= cutoff
  2. cutoff = smallest value f() of non-expanded (leaf) nodes
until (a solution is found) or (a termination condition on time or memory is met)
```

Slide example (p. 243–254): 8-puzzle `2 8 3 / 1 6 4 / 7 _ 5` → `1 2 3 / 8 _ 4 / 7 6 5`, $h_1$.
Iteration 1, cutoff = $f(\text{root}) = 0 + 4 = 4$: only the root and its child with $f = 4$ are
expanded; the pruned nodes have $f = 5, 6$. Iteration 2, cutoff = 5: the depth-first search
reaches the goal with $f = 5 + 0 = 5$. Cutoffs: 4, 5.

```viz search
IDA*: growing f-cutoffs
IDA* on a small graph (not the 8-puzzle): each iteration is a depth-first search that prunes nodes with f above the cutoff; the next cutoff is the smallest pruned f, until the goal is reached.
```

| property (p. 255) | IDA* |
|---|---|
| complete | yes, if $h$ admissible |
| optimal | yes, if $h$ admissible (the next cutoff never skips a cheaper solution) |
| space | linear in the depth: only the current path and the cutoff; no frontier to sort |
| time | regenerates previous iterations; revisits states not on the current path |

The number of iterations depends on the number of distinct $f$ values: from `7 2 4 / 5 _ 6 / 8 3 1`
to `1 2 3 / 4 5 6 / 7 8 _` the cutoffs are 14, 16, 18, 20 with $h_2$ (each move changes $f$ by 0
or 2) but 6, 7, …, 20 with $h_1$.

## Summary

| algorithm | $f(n)$ | complete | optimal | memory |
|---|---|---|---|---|
| uniform-cost | $g$ | yes | yes | $O(b^{1 + \lfloor C^*/\varepsilon \rfloor})$ |
| greedy best-first | $h$ | no (yes on finite graphs) | no | $O(b^m)$ |
| A* tree search | $g + h$ | yes | if $h$ admissible | exponential |
| A* graph search, discard reached | $g + h$ | yes | if $h$ consistent | exponential |
| A* course code (re-add if cheaper) | $g + h$ | yes | if $h$ admissible | exponential |
| weighted A* | $g + w h$ | yes | no: cost $\le w\,C^*$ | exponential, much smaller in practice |
| IDA* | $g + h$ with cutoff | yes | if $h$ admissible | linear |

> **Exam trap:** "optimal" is about the **cost** of the returned solution, "optimally efficient"
> is about the **number of expanded nodes**. A* has both (with a consistent $h$); greedy has neither.

## How it connects

- **Uninformed search**: same loop, same `reached` rule; uniform-cost search is A* with $h = 0$, and
  IDA* is iterative deepening with $f$ in place of the depth.
- **Problem formulation**: a heuristic is extra knowledge *outside* the formulation (p. 175); good
  heuristics come from relaxing the formulation's constraints.
- **CSP and local search**: heuristics return as variable/value ordering (MRV, LCV) and as the
  objective that hill climbing greedily follows — with the same local-minimum problem as greedy
  best-first search.
- **Games**: an evaluation function is a heuristic estimate of the value of a non-terminal position.
- Practice: 8-puzzle heuristics, greedy and its traps, the A* expansion table, admissibility and
  consistency checks, the inconsistent-heuristic counterexample, grid heuristics, $f$ vs $C^*$,
  weighted A*, IDA*.
