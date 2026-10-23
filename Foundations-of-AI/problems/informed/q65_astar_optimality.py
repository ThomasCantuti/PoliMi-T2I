TITLE = 'A*: admissibility, consistency and optimality'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['A*', 'admissibility', 'consistency', 'optimality', 'greedy', 'graph search']

QUESTIONS = [
    {
        'q': r'Which condition defines an **admissible** heuristic?',
        'options': [
            r"$h(n) \le c(n, a, n') + h(n')$ for every successor $n'$ of $n$",
            r'$0 \le h(n) \le h^*(n)$ for every node $n$',
            r'$h(n) \ge h^*(n)$ for every node $n$',
            r'$h(\text{goal}) = 0$',
        ],
        'answer': 1,
        'explain': r'Admissible = **never overestimates** the true cost $h^*(n)$ of the cheapest path to a '
                   r'goal: it is *optimistic* (slide p. 206). The first option is consistency; '
                   r'$h(\text{goal}) = 0$ follows from admissibility but is not enough.',
    },
    {
        'q': r"Edge $n \to n'$ costs 10 and $h(n') = 20$. For which values of $h(n)$ does the consistency "
             r'inequality hold on this edge?',
        'options': [r'$h(n) \le 10$', r'$h(n) \le 20$', r'$h(n) \le 30$', r'$h(n) \ge 30$'],
        'answer': 2,
        'explain': r"$h(n) \le c(n, a, n') + h(n') = 10 + 20 = 30$: the triangle inequality. With $h(n) = 100$ "
                   r'(slide p. 219) the estimate drops by 80 while moving costs only 10: inconsistent.',
    },
    {
        'q': r'Slide p. 227: S→A (1), S→B (2), A→C (1), B→C (2), C→G (100); $h(A) = 100$, $h(B) = 1$, '
             r'$h(C) = 90$, $h(G) = 0$. The heuristic is:',
        'options': ['admissible and consistent', 'admissible but not consistent',
                    'consistent but not admissible', 'neither'],
        'answer': 1,
        'explain': r'$h^*(A) = 101 \ge 100$, $h^*(B) = 102 \ge 1$, $h^*(C) = 100 \ge 90$: admissible. But on edge '
                   r'A→C: $100 > 1 + 90$, so not consistent. (Consistent but not admissible is impossible: '
                   r'consistency implies admissibility.)',
    },
    {
        'q': r'Which statements are true? (select all)',
        'options': [
            'Every consistent heuristic is admissible',
            'Every admissible heuristic is consistent',
            r'$h_0(n) = 0$ is consistent',
            r'With a consistent $h$, $f(n) = g(n) + h(n)$ never decreases along a path',
        ],
        'answer': [0, 2, 3],
        'explain': r"Chaining $h(n) \le c + h(n')$ along an optimal path gives $h(n) \le h^*(n)$ (slide p. 218, 223). "
                   r'The converse fails (previous question). $h_0$ satisfies $0 \le c + 0$. And '
                   r"$f(n') = g(n) + c + h(n') \ge g(n) + h(n) = f(n)$ (slide p. 225).",
    },
    {
        'q': r"Tree-search optimality proof (slide p. 216): $G'$ is a suboptimal goal in the frontier, $n$ is a "
             r'frontier node on an optimal path. Which chain shows that A* selects $n$ first?',
        'options': [
            r"$f(n) = g(n) + h(n) \le C^* < g(G') = f(G')$",
            r"$f(G') \le C^* \le f(n)$",
            r"$f(n) = C^* = f(G')$",
            r"$f(n) \ge h^*(n) > f(G')$",
        ],
        'answer': 0,
        'explain': r'$h$ admissible gives $g(n) + h(n) \le g(n) + h^*(n) = C^*$ ($n$ is on an optimal path). '
                   r"$G'$ is a goal, so $h(G') = 0$ and $f(G') = g(G') > C^*$. Hence $n$ is popped before $G'$.",
    },
    {
        'q': r'The heuristic is admissible but **not** consistent. Which versions of A* are still guaranteed to '
             r'return an optimal solution? (select all)',
        'options': [
            'Tree search (`best_first_tree_search`, no `reached` table)',
            'Graph search that never adds a state that is already in `reached`',
            'The course `best_first_search`, which re-adds a state when a cheaper path to it is found',
            'None of them',
        ],
        'answer': [0, 2],
        'explain': r'Tree search keeps every path, so the proof of slide p. 216 applies. The "discard" variant can '
                   r'lose the cheaper path found later (slide p. 228: it returns 104 instead of 102). The course code '
                   r'updates `reached` and re-adds the state, so the cheaper path is not lost — at the price of '
                   r'expanding that state twice.',
    },
    {
        'q': r'With a **consistent** heuristic, how many times can the course `best_first_search` (A*) expand '
             r'the same state?',
        'options': ['At most once', 'At most twice', 'Any number of times', 'It depends on tie-breaking'],
        'answer': 0,
        'explain': r'With a consistent $h$ the first time a state is selected its path is already optimal '
                   r'(slide p. 224), so no cheaper path can be found later: "we never have to re-add a state '
                   r'to the frontier, and never change an entry in reached".',
    },
    {
        'q': r'A* with a consistent heuristic, $C^* = 20$. Which statements are true? (select all)',
        'options': [
            r'Every node with $f(n) = 18$ is expanded',
            r'A node with $f(n) = 20$ may be expanded',
            r'A node with $f(n) = 21$ may be expanded',
            r'Every node with $f(n) = 20$ is expanded',
        ],
        'answer': [0, 1],
        'explain': r'A* expands **all** nodes with $f < C^*$, **some** with $f = C^*$ (tie-breaking decides), '
                   r'**none** with $f > C^*$ (slide p. 232).',
    },
    {
        'q': 'A* is **optimally efficient**. What does that mean?',
        'options': [
            'A* expands fewer nodes than any other search algorithm',
            r'No other optimal algorithm using the same heuristic is guaranteed to expand fewer nodes than A* '
            r'(apart from some nodes with $f = C^*$)',
            'A* uses the least possible memory',
            'A* runs in polynomial time',
        ],
        'answer': 1,
        'explain': r'Any algorithm that guarantees optimal solutions must expand every node with $f(n) < C^*$, '
                   r'otherwise a cheaper solution could be hidden below it (slide p. 232). Greedy may expand '
                   r'fewer nodes, but it is not optimal. A* still needs exponential time and memory in general.',
    },
    {
        'q': r'A* with $h(n) = 0$ for every $n$ is:',
        'options': ['Breadth-first search', 'Uniform-cost search', 'Greedy best-first search',
                    'Depth-first search'],
        'answer': 1,
        'explain': r'$f(n) = g(n)$: the frontier is ordered by path cost (slides p. 234–235). $h_0$ is consistent '
                   r'but uninformative: uniform-cost search is a special case of A*.',
    },
    {
        'q': r'Greedy best-first search ($f = h$). Which statements are true? (select all)',
        'options': [
            r'It is optimal when $h$ is admissible',
            r'It may return a suboptimal path even when $h = h^*$',
            r'Its worst-case time and space are $O(b^m)$, $m$ = maximum depth',
            'It always expands fewer nodes than A*',
        ],
        'answer': [1, 2],
        'explain': r'Greedy ignores $g$: the node closest to the goal can be expensive to reach (S→A costs 10, '
                   r'A→G 1, while S→B→G costs 6). Complexity from slide p. 191. On the slide grid greedy expands '
                   r'27 nodes, A* only 25: a misleading $h$ (local minimum) can make greedy slower too.',
    },
]
