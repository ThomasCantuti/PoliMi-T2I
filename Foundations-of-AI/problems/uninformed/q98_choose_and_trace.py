TITLE = 'Which algorithm? Hand traces and exam traps'
DIFFICULTY = 'hard'
KIND = 'quiz'
TAGS = ['choosing an algorithm', 'hand simulation', 'exam traps', 'cutoff', 'goal test']

STATEMENT = r"""
Exam-style questions: pick a strategy for a scenario, simulate a search by hand, spot the bug.
Convention for the traces: actions in **alphabetical order**, ties in the frontier broken by insertion
order (FIFO).

Graph 1 (directed, unit costs):

```text
S → A, S → B,  A → C, A → D,  B → D, B → G,  C → G
```

Graph 2 (directed, with costs):

```text
S →A 1   S →B 5   A →B 2   A →C 5   B →C 1   B →G 6   C →G 3
```
"""

QUESTIONS = [
    {
        'q': 'Graph 1, **BFS** with the goal test when a node is **selected**, graph search. Which nodes are '
             '**expanded**, in order?',
        'options': ['S, A, B', 'S, A, B, C, D', 'S, A, C', 'S, A, B, C, D, G'],
        'answer': 1,
        'explain': 'Frontier: ⟨S⟩ → ⟨A,B⟩ → ⟨B,C,D⟩ → ⟨C,D,G⟩ (D already reached from A) → ⟨D,G⟩ → ⟨G⟩. '
                   'G is generated when B is expanded but recognized only when **selected**, after C and D '
                   'have been expanded. Solution S-B-G.',
    },
    {
        'q': 'Same graph, BFS with the **early** goal test (at generation). Which nodes are expanded?',
        'options': ['S, A, B', 'S, A, B, C, D', 'S, B', 'S'],
        'answer': 0,
        'explain': 'Expanding B generates G, which is immediately recognized as a goal: C and D are never '
                   'expanded. Same solution (S-B-G), fewer nodes: $O(b^d)$ instead of $O(b^{d+1})$.',
    },
    {
        'q': 'Graph 2, **uniform-cost search**. Which solution is returned?',
        'options': ['S-B-G, cost 11', 'S-A-C-G, cost 9', 'S-A-B-G, cost 9', 'S-A-B-C-G, cost 7'],
        'answer': 3,
        'explain': 'pop S(0): A=1, B=5 · pop A(1): B=3 (cheaper: replaces 5), C=6 · pop B(3): C=4 (replaces 6), '
                   'G=9 · pop C(4): G=7 (replaces 9) · … · pop G(7): goal. With the course code the outdated '
                   'entries B(5), C(6) are still popped and re-expanded, but they generate nothing cheaper; on '
                   'paper you can cross them out. BFS would return S-B-G (cost 11).',
    },
    {
        'q': 'Graph 2: what would UCS return if it goal-tested nodes when they are **generated**?',
        'options': ['S-A-B-C-G, cost 7', 'S-A-B-G, cost 9', 'S-B-G, cost 11', 'failure'],
        'answer': 1,
        'explain': 'G is first generated when B(3) is expanded, with cost 3 + 6 = 9: the early test stops there. '
                   'The optimal path (cost 7) through C is discovered only later. UCS must goal-test at '
                   '**selection**: a node popped from the priority queue has its optimal cost.',
    },
    {
        'q': 'Slide code for iterative DFS (children pushed with `frontier.append` in the order `expand` '
             'generates them). From S with neighbors A, B, C (alphabetical), which node is **selected** right after S?',
        'options': ['A', 'B', 'C', 'It depends on the costs'],
        'answer': 2,
        'explain': 'A, B, C are pushed in this order, so C is on top of the LIFO stack. The recursive version '
                   '(and the drawing on p. 143) explore A first. Both are DFS; in an exam follow the tie-breaking '
                   'rule given by the exercise.',
    },
    {
        'q': 'Depth-limited search with $L = 3$ returns **cutoff**. What can you conclude?',
        'options': [
            'The problem has no solution',
            'There is no solution of depth $\\le 3$; a deeper solution may or may not exist',
            'There is a solution of depth exactly 4',
            'The search got stuck in a loop',
        ],
        'answer': 1,
        'explain': '`cutoff` = some node was not expanded because of the limit, so nothing is known beyond depth 3. '
                   '`failure` = the whole (cycle-free) tree was explored: no solution at any depth. Iterative '
                   'deepening continues on cutoff and stops on failure.',
    },
    {
        'q': 'Route planning on a road map with different road lengths; the **shortest route** in km is required. '
             'Which uninformed strategy?',
        'options': ['Breadth-first search', 'Uniform-cost search', 'Iterative deepening', 'Depth-first search'],
        'answer': 1,
        'explain': 'Step costs differ, so only UCS (ordering by $g$) is optimal. BFS and IDS minimize the number '
                   'of roads, not the km.',
    },
    {
        'q': 'Huge state space, all actions cost 1, solution depth unknown, little memory. Which strategy?',
        'options': ['Breadth-first search', 'Depth-first search', 'Iterative deepening', 'Depth-limited search with $L = 20$'],
        'answer': 2,
        'explain': 'IDS is complete and optimal for unit costs like BFS, with the $O(bd)$ memory of DFS — the '
                   'preferred uninformed method when the space is large and $d$ is unknown. DFS is neither '
                   'complete nor optimal; a fixed limit may be below $d$.',
    },
    {
        'q': '8-queens, incremental formulation (place one queen per column, only safe squares). Every solution '
             'is at depth 8 and the tree is finite. Which strategy is a sensible choice?',
        'options': [
            'Depth-first search',
            'Breadth-first search',
            'Bidirectional search',
            'Uniform-cost search',
        ],
        'answer': 0,
        'explain': 'All solutions have the same depth (p. 119), so optimality is not an issue, and the tree is '
                   'finite with no repeated states: DFS finds a solution with $O(bm)$ memory. BFS would store '
                   'nearly all of level 7–8. Bidirectional search is impossible: the goal is defined by a test, '
                   'there is no explicit goal state to search back from.',
    },
    {
        'q': 'With $b = 10$ and $d = 5$, iterative deepening generates 123,450 nodes and BFS (early goal test) '
             '111,110. Why is IDS\'s overhead so small despite regenerating the tree $d$ times?',
        'options': [
            'Because IDS caches the nodes of previous iterations',
            'Because most nodes of a tree are in its last level, which IDS generates only once',
            'Because IDS uses a priority queue',
            'Because BFS also regenerates nodes',
        ],
        'answer': 1,
        'explain': 'Level $i$ is generated $d+1-i$ times, but level $d$ alone has $b^d$ nodes, more than all upper '
                   'levels together. The ratio tends to $b/(b-1)$: about 11% extra for $b = 10$.',
    },
]
