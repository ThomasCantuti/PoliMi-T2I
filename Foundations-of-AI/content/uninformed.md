# Uninformed Search

Uninformed (blind) strategies know only the problem definition: they cannot tell whether one
non-goal state is "closer" to the goal than another. All of them are the same loop — select a node
from the frontier, goal-test it, expand it — and **differ only in the order of the frontier**.
That single choice decides completeness, optimality, time and memory.

## Intuition

> **Key idea:** a search strategy *is* an ordering of the frontier (slides p. 112). FIFO queue →
> breadth-first; priority queue on $g$ → uniform-cost; LIFO stack → depth-first.

```fig search-order
The same binary tree of depth 3 explored completely with three frontiers; each node is numbered by when it is expanded. FIFO queue: level by level (breadth-first). Priority queue on g (edge costs shown): cheapest path first (uniform-cost). LIFO stack: down the leftmost branch first, then backtrack (depth-first).
```

The five ingredients a strategy may use (p. 114): the states and the initial state, `actions(s)`,
`result(s, a)`, the goal test `is_goal(s)`, and the step cost `cost(s, a, s')`. Nothing else: no
estimate of the distance to the goal (that is *informed* search, next topic).

Course notation (aima-python): `Node(state, parent, action, path_cost)`, `len(node)` = depth,
`expand(problem, node)` yields the children, `path_states(node)` gives the path, `failure` and
`cutoff` are special nodes, `FIFOQueue` (`appendleft` / `pop`), `LIFOQueue` (`append` / `pop`),
`PriorityQueue(items, key=f)` (`add` / `pop`, ties FIFO).

## Tree search vs graph search

Tree search (p. 115) just loops: *select a node not yet expanded; if goal, return; else expand it*.
On a graph with loops the search tree is **infinite** even when the state space is tiny (A, B, A, B, …).

Graph search (p. 116) adds a **reached** table: a child is added only if its state was never reached,
**or** it was reached with a higher path cost (then the entry is updated).

| | stores | pros | cons |
|---|---|---|---|
| tree-like search | frontier only (maybe `is_cycle` on the current path) | little memory | may re-explore states, loops forever without a cycle check |
| graph search | frontier + `reached` | each state handled (almost) once | memory for `reached` |

Tree search works well when the state space *is* a tree (8-queens: no repeated states); graph search
is the general case (8-puzzle, route finding: many repeated states) (p. 107, 170). Variants differ in
*when* repeated states are checked (at generation or at expansion): a trade-off between the memory of
`reached` and the time to check it (p. 171).

## Evaluating a strategy

(p. 117–119)

- **Completeness**: is it guaranteed to find a solution when one exists?
- **(Cost) optimality**: does it find a minimum-cost solution?
- **Time / space complexity**: number of nodes generated / stored, in the worst case.

| symbol | meaning |
|---|---|
| $b$ | branching factor: max number of successors of a node |
| $d$ | depth of the **shallowest** goal node |
| $m$ | maximum depth of the search tree (can be $\infty$; often $m \gg d$) |
| $C^*$ | cost of the optimal solution |
| $\varepsilon$ | minimum step cost ($> 0$) |
| $L$ | depth limit (depth-limited search) |

Level $i$ of a uniform tree has $b^i$ nodes, so the last level dominates:
$1 + b + \dots + b^d = O(b^d)$. A large $b$ makes the tree explode; a large $d$ forces deep exploration.

## Breadth-first search

All nodes at level $k$ are selected before any node at level $k+1$ (p. 120–121): **FIFO frontier**,
new nodes appended at the end. Ties at the same depth are broken by insertion order.

```python
def breadth_first_search(problem: Problem) -> Node:
    node = Node(problem.initial)
    frontier = FIFOQueue([node])
    reached: set = {problem.initial}
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):        # goal test at SELECTION (late)
            return node
        for child in expand(problem, node):
            s = child.state
            if s not in reached:
                reached.add(s)
                frontier.appendleft(child)
    return failure
```

**Worked example** (p. 122–124), binary tree, goal = 7:

| pop | goal? | frontier after |
|---|---|---|
| — | | ⟨1⟩ |
| 1 | no | ⟨2, 3⟩ |
| 2 | no | ⟨3, 4, 5⟩ |
| 3 | no | ⟨4, 5, 6, 7⟩ |
| 4 | no | ⟨5, 6, 7, 8, 9⟩ |
| 5, 6 | no | ⟨7, 8, …, 13⟩ |
| 7 | **yes** | |

7 is generated when 3 is expanded but recognized only when **selected**: meanwhile 4, 5, 6 were
expanded and 8–13 generated. Worst case: the goal is the last node of level $d$, all other level-$d$
nodes are expanded, generating $b^{d+1} - b$ nodes of level $d+1$ → $O(b^{d+1})$ (p. 125–126).

**Early goal test variant** (p. 127–131): test each child when it is **generated**
(and test the initial state before the loop):

```python
def breadth_first_search_early_goal_test(problem: Problem) -> Node:
    node = Node(problem.initial)
    if problem.is_goal(problem.initial):
        return node
    frontier = FIFOQueue([node])
    reached: set = {problem.initial}
    while frontier:
        node = frontier.pop()
        for child in expand(problem, node):
            s = child.state
            if problem.is_goal(s):             # goal test at GENERATION (early)
                return child
            if s not in reached:
                reached.add(s)
                frontier.appendleft(child)
    return failure
```

On the example it stops when 3 generates 7: 3 expansions, 6 generated nodes instead of 12.
Worst case $O(b^d)$ (p. 128). Still complete and optimal, because BFS generates nodes in order of
depth: the first goal *generated* is a shallowest one.

**BFS as best-first** (p. 132): BFS = best-first search with $f(n) = $ depth. The native version is
faster (FIFO instead of a priority queue), `reached` can be a plain **set** (the first path found to a
state is already a shallowest one) and the early test is allowed.

**Properties** (p. 125): complete if $b$ is finite; optimal if all step costs are equal (more
generally, if path cost never decreases with depth); time and space $O(b^{d+1})$ (late test) or
$O(b^d)$ (early test). **Memory is the real problem**: every generated node is kept.

> **Exam trap:** BFS returns the **fewest actions**, not the cheapest path. With costs, a 2-step path
> of cost 10 beats a 4-step path of cost 4.

```viz search
BFS vs UCS: fewest steps is not cheapest
Breadth-first search on a graph with step costs: it returns the path with the fewest steps, S → C → G (cost 11), not the cheapest one, S → A → B → D → G (cost 6).
```

## Uniform-cost search

Generalizes BFS to arbitrary step costs: it **selects the node with the smallest path cost** $g(n)$
from the root, not necessarily the shallowest (p. 135). It is best-first search with $f = g$ (p. 136):

```python
def best_first_search(problem: Problem, f: Callable[[Node], float]) -> Node:
    node = Node(problem.initial)
    frontier = PriorityQueue([node], key=f)
    reached: dict[Any, Node] = {problem.initial: node}  # state -> best node so far
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):          # late goal test: mandatory
            return node
        for child in expand(problem, node):
            s = child.state
            if s not in reached or child.path_cost < reached[s].path_cost:
                reached[s] = child
                frontier.add(child)
    return failure

def uniform_cost_search(problem: Problem) -> Node:
    return best_first_search(problem, f=lambda n: n.path_cost)
```

**Worked example** (textbook Fig. 3.10), Sibiu → Bucharest:

| pop ($g$) | children generated | frontier after |
|---|---|---|
| Sibiu (0) | Rimnicu 80, Fagaras 99 | Rimnicu 80, Fagaras 99 |
| Rimnicu (80) | Pitesti 177 | Fagaras 99, Pitesti 177 |
| Fagaras (99) | **Bucharest 310** | Pitesti 177, Bucharest 310 |
| Pitesti (177) | **Bucharest 278** (< 310: update) | Bucharest 278, Bucharest 310 |
| Bucharest (278) | goal | |

> **Exam trap:** the goal is *generated* first with cost 310 and *selected* first with cost 278. An early
> goal test returns the wrong (310) path, and so does a `reached` **set** that refuses the cheaper path.

With the course code an outdated frontier entry (here Bucharest 310) stays in the queue; if it is ever
popped it is just re-expanded uselessly. In a hand simulation you can cross it out when it is replaced.

**Properties** (p. 137–138): complete if $b$ is finite and every step cost $\ge \varepsilon > 0$ (zero-cost
loops could trap it); **optimal** (nodes are expanded in order of their optimal path cost); time and space
$O(b^{1 + \lfloor C^*/\varepsilon \rfloor})$, which can be much larger than $b^d$ when there are many cheap
steps. With equal step costs this is $O(b^{d+1})$ and UCS behaves like BFS.

> **Intuition:** UCS spreads like a wave of equal cost ("contours" of $g$) instead of equal depth.

```viz search
Uniform-cost search with a reached-table update
Uniform-cost search on the same graph as the BFS example: nodes are selected in order of g, a state reached again through a cheaper path updates the reached table, and the goal is returned only when selected (cheapest path, cost 6).
```

## Depth-first search

Always selects the **deepest** node; at a dead end it backtracks to the deepest node not yet chosen
(p. 140). Frontier = **LIFO queue** (stack): the most recently generated nodes are selected first (p. 142).
Usually implemented as a **tree-like** search, without `reached` (p. 148), using `is_cycle` to cut paths
that revisit a state of the current path (p. 146):

```python
def depth_first_recursive_search(problem: Problem, node: Node | None = None) -> Node:  # p. 144
    if node is None:
        node = Node(problem.initial)
    if problem.is_goal(node.state):
        return node
    elif is_cycle(node):
        return failure
    else:
        for child in expand(problem, node):
            result = depth_first_recursive_search(problem, child)
            if result:                      # failure has len 0, so it is falsy
                return result
        return failure

def depth_first_search_iterative(problem: Problem) -> Node:                           # p. 145
    frontier = LIFOQueue([Node(problem.initial)])
    result = failure
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        elif not is_cycle(node):
            for child in expand(problem, node):
                frontier.append(child)
    return result
```

**Worked example** (p. 141–143), goal = 12, left child first:

```text
frontier: ⟨1⟩ ⟨2,3⟩ ⟨4,5,3⟩ ⟨6,7,5,3⟩ ⟨7,5,3⟩ ⟨5,3⟩ ⟨3⟩ ⟨8,9⟩ ⟨11,12,9⟩ ⟨13,14,12,9⟩ ⟨14,12,9⟩ ⟨12,9⟩
```

```viz search
DFS on the slides tree (p.143)
The slides' tree with goal 12, left child first: depth-first search goes down to 6 and 7, backtracks through 5 and 3, then 8, 11, 13, 14 and finally 12.
```

> **Exam trap:** sibling order. The drawing (and the recursive code) explore children **left to right**.
> The iterative code appends 2 then 3 and pops **3 first** (right to left): on the same tree it selects
> 1, 3, 9, 8, 12. Both are DFS. In exercises, apply the stated tie-break (usually alphabetical =
> leftmost first, i.e. push the children in reverse order).

**Properties** (p. 147): **not complete** (it can follow an infinite path; with cycle checking it is complete
on finite state spaces); **not optimal** (it returns the first goal on its way); time $O(b^m)$; space
$O(bm)$ — only one root-to-leaf path plus the unexpanded siblings of its nodes. That tiny memory is
why DFS matters (and why CSP backtracking is a DFS).

## Depth-limited search

DFS with a predetermined depth limit $L$: **nodes at depth $L$ are treated as if they had no successors**
(p. 152). It never runs forever, but it introduces a third outcome:

```python
def depth_limited_search(problem: Problem, limit: int = 10) -> Node:                  # p. 153
    frontier = LIFOQueue([Node(problem.initial)])
    result = failure
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node
        elif len(node) >= limit:
            result = cutoff                 # remember: something was not explored
        elif not is_cycle(node):
            for child in expand(problem, node):
                frontier.append(child)
    return result
```

| result | meaning |
|---|---|
| solution node | a goal at depth $\le L$ |
| `cutoff` | no goal within $L$, but some node was cut off: a solution **might** exist deeper |
| `failure` | the whole cycle-free tree was explored: **no solution at any depth** |

> **Exam trap:** `cutoff` is "I don't know", `failure` is a proof. Without `is_cycle`, a loop always
> reaches the limit, so the answer can never be `failure`.

**Properties** (p. 152): complete only if $L \ge d$ ($d$ is usually unknown); not optimal; time $O(b^L)$,
space $O(bL)$. With `len(node) >= limit` a goal at depth exactly $L$ is still found (the textbook figure
writes `DEPTH(node) > ℓ`: an off-by-one variant, check which one an exercise uses).

## Iterative deepening search

Repeated depth-limited searches with $L = 0, 1, 2, \dots$ until the result is not `cutoff` (p. 154–155):

```python
def iterative_deepening_search(problem: Problem) -> Node:
    for limit in range(1, sys.maxsize):     # the textbook starts from 0
        result = depth_limited_search(problem, limit)
        if result != cutoff:
            return result                   # a solution, or failure
```

Every time the limit grows, **the whole tree is regenerated** (p. 157–160). That sounds wasteful but is
not: a node of level $i$ is generated $d + 1 - i$ times, and the last level dominates.

```viz search
Iterative deepening (slides p.157–159)
Iterative deepening on the slides' binary tree (goal F): depth-limited search with L = 0, 1, 2, each round restarting from the root and regenerating the levels above the limit.
```

$$N(\text{IDS}) = d\,b + (d-1)\,b^2 + \dots + 1 \cdot b^d \qquad N(\text{BFS}) = b + b^2 + \dots + b^d$$

| $b = 10$, $d = 5$ | nodes generated |
|---|---|
| BFS, early goal test | 111,110 |
| **IDS** | **123,450** (+11%) |
| BFS, late goal test | 1,111,100 |

The ratio tends to $\frac{b}{b-1}$ (2 for $b = 2$, 1.11 for $b = 10$).

**Properties** (p. 161–162): complete ($b$ finite: eventually $L = d$); optimal when all step costs are equal;
time $O(b^d)$; space $O(bd)$. It **combines the best of BFS and DFS**, and is the preferred uninformed
method when the state space is large and the solution depth unknown. Unlike DFS it also works on
infinite state spaces.

## Bidirectional search

Two searches in parallel: **forward** from the initial state, **backward** from a goal state; stop when
the two frontiers meet (p. 163–168).

> **Intuition:** two balls of radius $d/2$ are much smaller than one ball of radius $d$:
> $2\,b^{d/2} \ll b^d$ (for $b = 10, d = 6$: 2,000 vs 1,000,000).

```fig search-bidir
Left: one search from S whose ball of radius d = 6 reaches G, about b^d = 1,000,000 nodes for b = 10. Right: a forward search from S and a backward search from G, each of radius d/2, meeting in the middle: about 2·b^(d/2) = 2,000 nodes.
```

- Time and space $O(b^{d/2})$; one side must keep its reached states to detect the meeting.
- Requires an **explicit goal state** and computable **predecessors** (reversible actions, e.g. the
  8-puzzle, p. 164–165). Impossible when the goal is only a test (8-queens, checkmate).
- With BFS on both sides and unit costs it is complete and optimal, provided you expand **whole layers**
  and check the meeting against the other side's reached states.

## Summary table

(p. 172) "With repeated states" = state spaces with loops, searched without eliminating them.

| strategy | complete (with rep.) | optimal (with rep.) | complete (no rep.) | optimal (no rep.) | space | time |
|---|---|---|---|---|---|---|
| Breadth-first | yes | yes¹ | yes | yes¹ | $O(b^d)$ | $O(b^{d+1})$ |
| Uniform-cost | yes² | yes | yes² | yes | $O(b^{1+\lfloor C^*/\varepsilon\rfloor})$ | $O(b^{1+\lfloor C^*/\varepsilon\rfloor})$ |
| Depth-first | no | no | yes³ | no | $O(bm)$ | $O(b^m)$ |
| Depth-limited | no | no | no⁴ | no | $O(bL)$ | $O(b^L)$ |
| Iterative deepening | yes | yes¹ | yes | yes¹ | $O(bd)$ | $O(b^d)$ |
| Bidirectional (BFS) | yes | yes¹ | yes | yes¹ | $O(b^{d/2})$ | $O(b^{d/2})$ |

¹ if all step costs are equal · ² if $b$ finite and step costs $\ge \varepsilon > 0$ · ³ on finite trees ·
⁴ complete only if $L \ge d$. The table gives BFS space $O(b^d)$; p. 125 gives $O(b^{d+1})$ for both time and
space with the late goal test. Safest exam answer: $O(b^{d+1})$ with the goal test at selection, $O(b^d)$
with the early test. Bidirectional is not in the slide table.

> **Exam trap:** "optimal" always means *cost*-optimal. BFS and IDS are optimal only for equal step costs;
> UCS is the only optimal one for arbitrary positive costs.

## Choosing a strategy

| situation | choice |
|---|---|
| different step costs, optimal solution needed | uniform-cost search |
| unit costs, large space, unknown depth, little memory | iterative deepening |
| unit costs, small space, memory is not an issue | BFS (early goal test) |
| all solutions at the same known depth, finite tree (8-queens) | DFS / depth-limited with $L = d$ |
| explicit goal, reversible actions, very deep solution | bidirectional search |

## How it connects

- **Informed search** keeps the same `best_first_search` and only changes $f$: greedy best-first uses
  $f = h$, **A\*** uses $f = g + h$. UCS is A* with $h = 0$; the late goal test and the `reached` update
  rule are exactly the ones you met here, and IDA* is iterative deepening on $f$ instead of depth.
- **CSPs** are solved by backtracking search, a recursive depth-first search: all solutions are at depth
  $n$ (one variable per level), so DFS's weaknesses disappear and its $O(bm)$ memory shines.
- **Adversarial search**: minimax is a depth-first exploration of the game tree; depth-limited search with
  an evaluation function at the cutoff is how real game programs work.
