# Problem Solving by Search

A problem-solving agent is a **goal-based agent** that, before acting, *thinks ahead*: it **formulates** a
problem (states, actions, results, goal, costs), **searches** for a sequence of actions that reaches the goal,
then **executes** it. This page is about the first step and about the common skeleton of every search
algorithm: nodes, frontier, search tree vs state space, tree vs graph search (slides p. 52–110, AIMA ch. 3.1–3.3).

## Intuition

Think of the 8-puzzle. You never write down all 181 440 configurations: you only describe **what a
configuration is**, **which moves are legal** and **what a move does**. That description *implicitly*
defines a huge graph (the state space). Search then builds, piece by piece, a **tree of paths** from the
start, hoping to hit the goal after exploring only a tiny part of the graph.

```fig search-unfold
Starting from the 8-puzzle state 8 2 7 / 3 4 _ / 5 1 6, breadth-first expansion calls actions(s) and result(s, a) state after state; the generated states appear on concentric rings by distance from the start: 1, 3, 5, 10, 14, 28, 42, 80, 108 states at 0…8 moves, 291 in all, that is 0.16% of the 181 440 states reachable from the start. The side panel shows the state being expanded and its successors.
```

> **Key idea:** the *formulation* decides how big and how nasty the space is; the *strategy* only decides in
> which order it is explored. A good formulation can shrink the space by orders of magnitude (8-queens:
> $1.8 \times 10^{14}$ → 2057).

Search problems are typical of agents in **fully observable, static, discrete, deterministic** (and known)
environments (slides p. 69): there the solution is a fixed action sequence that can be computed in advance.

## Formulating a search problem (slides p. 62)

| component | notation | 8-puzzle |
|---|---|---|
| set of **states** $S$ and **initial state** $s_0$ | `problem.initial` | arrangements of 8 tiles + blank |
| **actions**$(s)$: actions applicable in $s$ | `problem.actions(s)` | moves of the **blank**: up, down, left, right |
| **result**$(s, a)$: the state reached (transition model) | `problem.result(s, a)` | swap blank and neighbour |
| **goal test** | `problem.is_goal(s)` | `s == goal` |
| **step cost** $c(s, a, s')$ | `problem.action_cost(s, a, s1)` | 1 |

$s'$ = `result(s, a)` is a **successor** of $s$. In code (course library `aima`):

```python
class Problem:
    def __init__(self, initial: Any = None, goal: Any = None, **kwds: Any): ...
    def actions(self, state: Any) -> list:                   raise NotImplementedError
    def result(self, state: Any, action: Any) -> Any:        raise NotImplementedError
    def is_goal(self, state: Any) -> bool:                   return state == self.goal
    def action_cost(self, s: Any, a: Any, s1: Any) -> float: return 1
```

- **State space:** the directed graph whose nodes are states and with an arc $s \to s'$ iff $s'$ is a
  successor of $s$ (slides p. 63). It is defined **implicitly** by `initial` + `actions` + `result`.
- **Solution:** a **path** in the state space from the initial state to a state satisfying the goal test
  (slides p. 64) — the action sequence, not just the goal state.
- **Path cost:** the sum of the step costs. **Optimal solution:** a solution with the lowest path cost
  (slides p. 65). A problem could have **no solution**.

```fig search-formulate
Three problems behind the same five functions; the student applies actions by hand. 8-puzzle from 1 2 3 / 4 8 5 / _ 7 6 (4 moves from the goal: right, up, right, down), goal test s == (1, 2, 3, 4, 5, 6, 7, 8, 0). Water jugs (4, 3) from (0, 0), goal test: 2 liters in some jug. Incremental 8 queens: a state lists the queens' rows column by column, actions(s) are the safe rows of the next column, goal test: 8 queens placed. The panel shows s, actions(s), the goal test, the step cost 1, the path so far and its cost; when the goal test becomes true the path is the solution.
```

> **Exam trap:** the goal can be a *test* (a set of states: "some jug contains 2 liters", "8 non-attacking
> queens"), not a single state.

## Worked example: the 8-puzzle (slides p. 57–61)

State `8 2 7 / 3 4 _ / 5 1 6` (as a tuple: `(8, 2, 7, 3, 4, 0, 5, 1, 6)`, 0 = blank).
The blank is on the right edge, so `actions(s) = {up, down, left}`:

```fig search-8puzzle
State s = 8 2 7 / 3 4 _ / 5 1 6 and its successors. result(s, up) = 8 2 _ / 3 4 7 / 5 1 6; result(s, down) = 8 2 7 / 3 4 6 / 5 1 _; result(s, left) = 8 2 7 / 3 _ 4 / 5 1 6. Right is not applicable: the blank is on the right edge.
```

Choosing "the blank moves" as the action (instead of "tile $k$ moves") gives at most 4 actions per state;
the branching factor is 2, 3 or 4 ($b \approx 2.7$ on average). Every action is **reversible**.

## How big is the state space? (slides p. 66–68)

| puzzle | arrangements | reachable from a given state |
|---|---|---|
| 8-puzzle | $9! = 362\,880$ | $9!/2 = 181\,440$ |
| 15-puzzle | $16! \approx 2.1 \times 10^{13}$ | $16!/2$ |
| 24-puzzle | $25! \approx 10^{25}$ | $25!/2$ |

Chess has $10^{43}$–$10^{50}$ states, Go $10^{170}$, the universe $10^{79}$–$10^{81}$ atoms. Building the
explicit state space is impossible in time **and memory**:

```fig search-size
Horizontal log-scale bars: 8-puzzle 9! = 362 880 arrangements, 15-puzzle 16! ≈ 2.1×10^13, 24-puzzle 25! ≈ 1.6×10^25, chess 10^43–10^50, atoms in the universe 10^79–10^81, Go 10^170. A slider sets how many states are generated per second; at 10^8 per second (slides p. 67) listing them takes 3.6 ms, about 2.4 days and about 4.9×10^9 years for the three puzzles, and 1 byte per state needs 363 kB, 21 TB and 16 million EB.
```

> **Key idea (slides p. 68):** a problem-solving agent must find (build) a solution by exploring only a
> **small portion** of the state space.

> **Exam trap:** the slides count $9!$ arrangements, but only **half** are reachable: moves preserve the parity
> of the number of inversions, so the space splits into two disconnected components (`aima.EightPuzzle`
> refuses unsolvable instances for this reason).

## Abstraction (slides p. 70)

A state is an **abstract representation** of all physical situations that share the fundamental properties
and differ in irrelevant details (an 8-puzzle state ignores tile colors, materials, …). Keep in a state
*exactly* what is needed to determine applicable actions, results, goal test and costs:

- too much detail (e.g. the whole action history) → every path is a different state, repeated situations are
  never recognized, the space is infinite;
- a good abstraction is **valid** (abstract solutions can be executed in the real world) and **useful**
  (actions are easy to carry out).

```fig search-abstraction
Three physical 8-puzzles (wooden tiles, worn plastic tiles, a photo taken at an angle) with the same arrangement map to one abstract state, 8 2 7 / 3 4 _ / 5 1 6. Ticking "the history of the moves" makes every path a different state: within 12 moves there are 411 940 states instead of 2 021 and the space becomes infinite. Ticking "the look of the tiles" adds a detail that no action, result, goal test or cost depends on.
```

## Same problem, different formulations

### Eight queens (slides p. 71–75)

Place 8 queens so that no two share a row, a column or a diagonal.

| | first formulation | second (incremental) formulation |
|---|---|---|
| states | any arrangement of 0..8 queens | $k$ queens in the $k$ leftmost columns, none attacked |
| initial state | empty board | empty board |
| actions$(s)$ | add a queen to **any empty square** | add a queen to a **non-attacked** square of the **leftmost empty column** |
| goal test | 8 queens, none attacked | 8 queens on the board |
| size | $64 \times 63 \times \dots \times 57 \approx 1.8 \times 10^{14}$ | **2057** states |

Fixing the order and moving the constraint check into `actions` makes every state a consistent partial
solution reached by exactly one path. Even for 4×4, the naive search tree has 47 297 nodes over 2517
states; the incremental one has 17.

```fig search-queens
Two boards walked depth-first at the same pace. 1st formulation (a queen on any empty square): on 4×4 the search tree has 1 + 16 + 240 + 3 360 + 43 680 = 47 297 nodes over 2 517 distinct arrangements, with 48 goal nodes (each of the 2 solutions reached in 4! orders). 2nd formulation (leftmost empty column, non-attacked squares): 17 nodes, 2 solutions. 5×5: 6 693 626 nodes over 68 406 states vs 54. 8×8: about 1.8×10^14 nodes (the slides' 64 × 63 × … × 57 = 1.78×10^14 is depth 8 alone) vs 2 057 states and 92 solutions; the figure estimates how long the 1st tree would take at the measured pace.
```

> **Exam trap:** $64 \times \dots \times 57$ counts **sequences** of placements (search-tree nodes at depth 8):
> the same arrangement is counted $8!$ times. Distinct arrangements of 8 queens are $\binom{64}{8} \approx 4.4 \times 10^9$.

### Automatic assembly sequences (slides p. 76–77)

Find an order in which to assemble the parts of an object; a good sequence never needs to undo work.
States: partial assemblies; actions: add one part where it fits; few repeated states.

```fig search-assembly
A toy gearbox of five parts (base, shaft, gear, bearing, cover; the slides give no concrete instance). A state is the set of parts in place; a part can be added when its supports are there and the cover does not yet close the inside. The reachable state space has 11 states, 4 of them dead ends where the cover went on too early; the search tree from the empty assembly has 13 nodes and only 2 complete sequences (base, shaft, then gear and bearing in either order, then cover), so the two orders of gear and bearing are the only repeated state.
```

### Path planning (slides p. 78–86)

Robot from the red point to the green point among polygonal obstacles. Three formulations:

| formulation | states | actions / costs | solution |
|---|---|---|---|
| **grid** | cells of a grid overlay | move to one of the 8 neighbours; cost 1 straight, 1.41 diagonal | zig-zag at 45° multiples; many states and repeated states |
| **cell decomposition** | free regions (vertical slabs) | move to an adjacent region (through its center) | few states, paths not optimal |
| **visibility graph** | start, goal and obstacle vertices | straight segments between mutually visible vertices | very few states, **true shortest path** (hugs corners) |

```fig search-paths
The slides' map (20 × 12 units, two polygonal obstacles, start S at (2, 5), goal G at (19, 8)) in three formulations, each searched with uniform-cost search. Grid: the free grid points, 8 moves of cost 1 or √2; cell decomposition: the free cells cut by vertical lines through the obstacle vertices, moving through the middle of the shared borders; visibility graph: S, G and the 13 obstacle vertices joined by segments that do not cross an obstacle. The figure counts states and edges and shows the path length of each: the visibility graph has the fewest states and the shortest path, the grid the most states.
```

### Water pouring (homework, search4e — slides p. 110)

State: tuple of liters per jug; actions `('Fill', i)`, `('Dump', i)`, `('Pour', i, j)`; goal: the target
amount is in some jug. Jugs (4, 3), goal 2: 14 reachable states, solution of 4 actions.

```fig search-jugs
Jugs of 4 and 3 liters, both empty. Breadth-first search from (0, 0) discovers the reachable states column by column (fewest actions): (0,0); (4,0), (0,3); (4,3), (1,3), (3,0); (1,0), (3,3); (0,1), (4,2); (4,1), (0,2); (2,3), (2,0): 14 states out of the 20 pairs, because in every reachable state one jug is empty or full. The shallowest state with 2 liters is (4,2), at depth 4: ('Fill', 1), ('Pour', 1, 0), ('Fill', 1), ('Pour', 1, 0), which then plays on the jugs. You can also pour by hand; the goal can be set to 1–4 liters.
```

## Searching for solutions: the search tree (slides p. 87–97)

Solutions are found by **building a search tree** from the state-space graph: the root is the initial state,
children are successors.

- A **node** corresponds to a **path** from the initial state to a state; a **state** can correspond to
  **many nodes** (one per path that reaches it).
- If states can be revisited, the **search tree can be infinite even if the state space is finite**
  (8-puzzle: `up` then `down` gives back the root state, one level deeper).

```fig search-nodes
The 8-puzzle search tree from 8 2 7 / 3 4 _ / 5 1 6 without any repeated-state check, depth 1 to 4 (4, 12, 36 and 100 nodes). Selecting a node shows its Node fields (state, parent, action, path_cost, depth) and the path from the root, and marks every node holding the same state: at depth 2 the node "up, down" holds the initial state again, like the root and the nodes "down, up" and "left, right" (4 nodes, one state). The depth-4 tree has 100 nodes but only 33 distinct states.
```

```python
class Node:
    def __init__(self, state: Any, parent: Node | None = None, action: Any = None, path_cost: float = 0):
        self.state = state            # the state this node corresponds to
        self.parent = parent          # the node that generated it
        self.action = action          # the action applied to the parent
        self.path_cost = path_cost    # g(n): cost of the path from the root
        self.depth = 0 if parent is None else parent.depth + 1
```

(In the course library `len(node)` is the depth.) The solution is read back by following `parent` pointers
(`path_states(node)`, `path_actions(node)`).

### Tree search, frontier, strategy (slides p. 98–102)

```text
initialize the root of the tree with the initial state of problem
LOOP DO
    IF there are no more nodes candidate for expansion THEN RETURN failure
    select a node not yet expanded
    IF the node corresponds to a goal state THEN RETURN the corresponding solution
    ELSE expand the chosen node, adding the resulting nodes to the tree
```

- **Frontier:** the nodes generated but **not yet chosen** for expansion (a priority queue).
- **Search strategy:** determines the **ordering of nodes in the frontier**; the first node is selected.
- **Expansion:** apply `actions(s)` to the state of node $n$; for each action compute $s' = $ `result(s, a)`
  and generate a child node; insert the children into the frontier.

```python
def expand(problem: Problem, node: Node) -> Iterator[Node]:
    s = node.state
    for action in problem.actions(s):
        s1 = problem.result(s, action)
        cost = node.path_cost + problem.action_cost(s, action, s1)
        yield Node(s1, node, action, cost)
```

> **Exam trap:** *generating* a node (creating it as a child) ≠ *expanding* it (generating its children).
> The goal test in the generic scheme is done when a node is **selected**, not when it is generated.

```fig search-loop
The tree-search loop run on a state space of six states (S → A, B; A → C, D; B → D; C, D → G) with the pseudocode line in use highlighted. FIFO frontier: S1 is selected and expanded (A2, B3 generated), then A2 (C4, D5), B3 (D6: a second node for state D), C4 (G7 generated but not tested), D5 (G8), D6 (G9); then G7 is selected and passes the goal test: solution S → A → C → G after 6 expansions and 9 generated nodes. With a LIFO frontier: S1, A2, C4 are expanded and G6 is selected next: 3 expansions, 6 generated nodes.
```

## Repeated states and graph search (slides p. 103–107)

Many nodes can correspond to the same state; this is **unavoidable with reversible actions** and makes the
search inefficient (or infinite). To avoid it, keep a **reached** table of states and compare.

```text
initialize the root of the tree with the initial state of problem
initialize the reached list to the empty set
LOOP DO
    IF there are no more candidate nodes for expansion THEN RETURN failure
    choose a node not yet expanded
    IF the node corresponds to a goal state THEN RETURN the corresponding solution
    expand the chosen node into a list of child nodes
    for each child node:
        IF the state of the child is not in reached OR the path cost of the child is lower
           than the cost of the reached node
        THEN add/update reached with the child; add the child to the tree
```

| problem (slides p. 107) | repeated states | search tree |
|---|---|---|
| 8-queens (incremental) | none | finite |
| assembly planning | few | finite |
| 8-puzzle | many | **infinite** |
| robot navigation (grid) | many | **infinite** |

How fast does the tree outgrow the state space? From the slides' 8-puzzle state:

| depth $d$ | tree nodes up to depth $d$ | distinct states within $d$ moves |
|---|---|---|
| 5 | 292 | 61 |
| 10 | 51 492 | 771 |
| 12 | 411 940 | 2 021 |

```fig search-growth
Log-scale plot of the search-tree nodes up to depth d against the distinct states within d moves, d = 0…12, computed for three 8-puzzle start states. From the slides' state 8 2 7 / 3 4 _ / 5 1 6 (blank on an edge): d = 5: 292 nodes vs 61 states; d = 10: 51 492 vs 771; d = 12: 411 940 vs 2 021 (the table above). From a start with the blank in a corner (e.g. 1 2 3 / 4 5 6 / 7 8 _): 201 vs 51, 37 449 vs 706, 299 593 vs 1 850, smaller, because a corner blank has only 2 moves. In both cases the tree at depth 12 has more nodes than the 181 440 reachable states of the whole puzzle.
```

| | tree search | graph search |
|---|---|---|
| remembers | only the frontier (and the current paths) | frontier **+ reached** table |
| repeated states | re-explored every time | explored once (or again only with a cheaper path) |
| on finite spaces with cycles | may not terminate (infinite tree) | terminates |
| memory | can be small | proportional to the states reached |

> **Intuition:** graph search trades **memory** for **time**: it pays to store every reached state so that it
> never redoes the work under another path.

```viz search
Repeated states: tree vs graph search (BFS)
A state space of six states with loops (S, A, B, C, D, G) next to the search tree that breadth-first tree search builds on it: the same state appears in several nodes. Switch "Repeated states" to the reached table to see graph search handle each state once.
```

## Best-first search: the general scheme (slides p. 108–109)

All the algorithms of the next lectures are this one function with a different **evaluation function** $f(n)$:

```python
def best_first_search(problem: Problem, f: Callable[[Node], float]) -> Node:
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached: dict[Any, Node] = {problem.initial: node}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        for child in expand(problem, node):
            s = child.state
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child
                frontier.add(child)
    return failure
```

| $f(n)$ | algorithm |
|---|---|
| $g(n)$ = `n.path_cost` | uniform-cost search |
| depth `len(n)` | breadth-first (BFS is usually written with a FIFO queue and early goal test) |
| $h(n)$ | greedy best-first |
| $g(n) + h(n)$ | A* |

```fig search-bestfirst
Four copies of one graph (S–A–C–D–G costs 1 each; S–B 4, B–G 4; S–E 3, E–G 8; h = 4, 3, 2, 1, 0 along the top path, h(B) = 3, h(E) = 2), each running the same best_first_search with a different f. f = depth (breadth-first): returns S-B-G, cost 8, the fewest actions. f = g (uniform-cost): S-A-C-D-G, cost 4, after 7 selections. f = h (greedy): S-E-G, cost 11, after only 3 selections. f = g + h (A*): S-A-C-D-G, cost 4, after 5 selections.
```

> **Exam trap:** the `child.path_cost < reached[s].path_cost` condition matters only when step costs differ;
> without it, a state first reached by an expensive path keeps that path forever.

## How it connects

- **Uninformed search:** BFS, uniform-cost, DFS, depth-limited, iterative deepening — strategies for ordering
  the frontier without knowledge of the goal; their completeness/optimality/complexity are measured in terms
  of $b$ (branching factor), $d$ (depth of the shallowest solution), $m$ (maximum depth).
- **Informed search:** $f = g + h$ with heuristics; the 8-puzzle and path planning come back with Manhattan
  and straight-line distance.
- **CSP:** the incremental 8-queens formulation is exactly backtracking over a factored state.
- **Local search:** forgets paths entirely and keeps only a current state (complete-state 8-queens).
