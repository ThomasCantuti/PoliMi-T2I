TITLE = 'Exam · Short questions on uninformed search (2022–2025)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'complexity', 'completeness', 'DFS', 'IDS', 'UCS', 'true/false']

STATEMENT = r"""
Open and true/false questions on uninformed search from the written exams of **14 June 2022** (Problem 2,
Questions 2–3), **6 February 2024** (Artificial Intelligence, Question 3), **16 January 2025** (Problem 4,
Question 2) and **11 June 2025** (CSP and Uninformed Search, Questions 2–3).

In the exam every answer must be *adequately motivated* and completely wrong answers get negative points: after
each question, read the **model answer** (what to write) and the trap.
"""

QUESTIONS = [
    {
        'q': '(Jun 2022) **Discuss the spatial and time complexity of depth-first search.** Which statement is the '
             'correct answer? ($b$ = branching factor, $d$ = depth of the shallowest goal, $m$ = maximum depth)',
        'options': [
            r'Space $O(bm)$: only one root-to-leaf path plus the unexpanded siblings of its nodes; time $O(b^m)$, where '
            r'$m$ can be much larger than $d$ (even infinite)',
            r'Space $O(b^d)$ and time $O(b^d)$, like breadth-first search',
            r'Space $O(m)$ and time $O(bm)$, because DFS follows a single path',
            r'Space $O(b^m)$ and time $O(bm)$',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "DFS is not complete (it can follow an infinite path) and not optimal. In the worst '
                   r'case it generates the whole tree: time $O(b^m)$, with $m \ge d$ (often $m \gg d$, possibly '
                   r'$\infty$). It only stores the current path and, for each node on it, the siblings not yet expanded: '
                   r'space $O(bm)$" (official answer: slides p.147). The small memory is the reason DFS matters; with an '
                   r'expanded/reached set (graph search) the memory becomes proportional to the visited states.',
    },
    {
        'q': '(Jun 2022) To **show that DFS is not optimal** on the 8-puzzle from `1 2 3 / 4 5 6 / 7 _ 8` (goal: the '
             'blank in the bottom-right corner, one move away), what must your example fix first?',
        'options': [
            'An order of the actions (moves of the blank) in which **Right** is not the first one: DFS dives into '
            'the subtree of the first move and returns a longer solution (or loops, with tree search)',
            'Nothing: DFS is never optimal, whatever the order',
            'The goal test must be done at generation',
            'A heuristic that overestimates the distance',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Order the blank\'s moves Up, Right, Left, Down: DFS expands the Up child first and '
                   'goes deeper in that subtree, so the first solution it finds is longer than the optimal one (Right, 1 '
                   'move); with tree search and the order Up, Down, … it even loops forever." With graph search and '
                   'the order Up, Right, Left, Down it returns a 41-move solution (code problem of this exam). DFS '
                   '*can* return the optimal solution with a lucky order: non-optimality means it is not guaranteed.',
    },
    {
        'q': '(Feb 2024, all four versions) True or false: **depth-first graph search is always complete on problems '
             'with finite search graphs.**',
        'options': ['True', 'False'],
        'answer': 0,
        'explain': '**Model answer:** "True. Graph search never expands a state twice, so on a finite graph it expands '
                   'at most all the reachable states and terminates; if a goal is reachable it is found." The trap is '
                   'confusing it with **tree-search** DFS, which can loop forever on a finite graph with cycles '
                   '(A, B, A, B, …) — and with DFS on an **infinite** space, where graph search does not help.',
    },
    {
        'q': r'(Jan 2025) **Write the formula for the time/space complexity of uniform-cost search** and explain how it '
             r'is derived ($C^*$ = cost of the optimal solution, $\varepsilon$ = minimum step cost).',
        'options': [
            r'$O\big(b^{1 + \lfloor C^*/\varepsilon \rfloor}\big)$: every step costs at least $\varepsilon$, so the '
            r'optimal path has at most $\lfloor C^*/\varepsilon \rfloor$ steps; UCS explores all nodes with cost '
            r'$\le C^*$, i.e. down to that depth, plus one more level of generated children',
            r'$O(b^{C^*})$: one level per unit of cost',
            r'$O(b^{d})$ like BFS, since UCS is BFS with costs',
            r'$O\big(b^{C^*\cdot\varepsilon}\big)$',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "Time and space $O(b^{1+\lfloor C^*/\varepsilon\rfloor})$. UCS selects nodes in '
                   r'order of $g$, so before selecting the goal it expands every node with $g < C^*$. A path whose steps '
                   r'cost at least $\varepsilon$ reaches cost $C^*$ in at most $C^*/\varepsilon$ steps, so the expanded '
                   r'nodes lie within depth $\lfloor C^*/\varepsilon \rfloor$, and their children one level deeper '
                   r'(the +1)." It can be much bigger than $b^d$ when there are many cheap steps; with equal step costs '
                   r'it becomes $O(b^{d+1})$.',
    },
    {
        'q': '(Jun 2025) **Describe a state space in which iterative deepening performs much worse than depth-first '
             'search** in terms of time (e.g. $O(n^2)$ vs $O(n)$).',
        'options': [
            r'A chain: every state has a **single successor** and the only goal is at depth $n$. DFS reaches it in $n$ '
            r'steps; IDS repeats the chain for $L = 0, 1, \dots, n$: $1 + 2 + \dots + n = O(n^2)$',
            r'A complete binary tree with the goal at the leftmost leaf of depth $d$: IDS is $O(2^d)$, DFS $O(d)$',
            r'Any space with $b \ge 2$: IDS always generates twice the nodes of DFS',
            r'There is none: IDS is never asymptotically worse than DFS',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "A linear chain with $b = 1$ and the goal at depth $n$: DFS finds it in $O(n)$, IDS '
                   r're-runs depth-limited search $n + 1$ times, $\sum_{L=0}^{n} (L + 1) = O(n^2)$" (official answer). The '
                   r'usual argument "the overhead is small because the last level dominates" needs $b \ge 2$: with $b = 1$ '
                   r'every level has one node, so the repetitions are not negligible. The binary-tree option is also a case '
                   r'where DFS is luckier (its leftmost leaf), but there IDS is $O(2^d)$ against $O(d)$ — a valid but '
                   r'different example from the one asked ($n^2$ vs $n$).',
    },
    {
        'q': r'(Jun 2025) Prove or give a counterexample: **(1) breadth-first search is a special case of uniform-cost '
             r'search; (2) uniform-cost search is a special case of A\*.**',
        'options': [
            r'Both true: (1) with all step costs equal, $g(n)$ is proportional to the depth, so ordering by $g$ (ties '
            r'FIFO) is the BFS order; (2) UCS is A* with $h(n) = 0$',
            r'(1) true, (2) false: A* needs a non-zero heuristic',
            r'(1) false: BFS uses a FIFO queue and UCS a priority queue, so they are different algorithms; (2) true',
            r'Both false: they return different solutions on graphs with different step costs',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "(1) UCS orders the frontier by $g(n)$; if every step costs the same $c > 0$, '
                   r'$g(n) = c \cdot \text{depth}(n)$, so UCS selects nodes level by level exactly like BFS (ties by '
                   r'insertion order). (2) A* orders by $f = g + h$; with $h(n) = 0$ (admissible) $f = g$, which is UCS." '
                   r'Different data structures do not make them different strategies. Detail: the *early*-goal-test BFS '
                   r'of the slides differs from UCS only in when the goal is tested, not in the order of expansion.',
    },
]
