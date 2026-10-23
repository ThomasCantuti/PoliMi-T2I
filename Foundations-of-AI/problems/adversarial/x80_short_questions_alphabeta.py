TITLE = 'Exam · Short questions on minimax, alpha-beta and expectiminimax (2023–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'alpha-beta', 'true/false', 'expectiminimax', 'move ordering']

QUESTIONS = [
    {
        'q': '*Feb 2024 (Q4) and Jan 2025 (Q5).* "When doing alpha-beta pruning on a game tree which is traversed from left to right, the **leftmost branch** will never be pruned." True or false? Adequately motivate your answer.',
        'options': [
            'True: pruning needs bounds that come from children already explored; before the first child of a node is evaluated, nothing can be cut',
            'False: with a good move ordering even the leftmost branch can be pruned',
            'False: the leftmost branch is pruned whenever the root has $\\alpha \\ge \\beta$',
            'True, but only for trees of depth 2',
        ],
        'answer': 0,
        'explain': '**Model answer:** True. A cut-off happens only *after* a child has returned a value ($v \\ge \\beta$ at MAX, $v \\le \\alpha$ at MIN) and it removes the *remaining* children. Along the leftmost path every node is entered with $\\alpha = -\\infty$, $\\beta = +\\infty$ and has not evaluated anything yet, so there are no α/β values that could motivate pruning: the leftmost branch is always fully explored. (More generally, the first child of every node that is visited is always examined.) The trap: move ordering decides *which* branch comes first, not whether the first one can be skipped.',
    },
    {
        'q': '*Feb 2024 (Q3).* "Alpha-beta pruning may modify the computed minimax value of the root." True or false?',
        'options': [
            'True: pruned leaves are missing from the computation, so the root value is an approximation',
            'False: it only prunes branches that cannot change the value backed up to the root',
            'True when the leaves are not ordered',
            'False, but only with perfect move ordering',
        ],
        'answer': 1,
        'explain': '**Model answer:** False. Alpha-beta saves time by pruning branches that it knows will not modify the current node value: a pruned MIN node is already worth $\\le \\alpha$ (MAX has something at least as good elsewhere), a pruned MAX node $\\ge \\beta$. The root value is exactly the minimax value, whatever the ordering; ordering only changes how much is pruned (slides p. 361, 377). Inner nodes may return bounds instead of exact values — the root does not.',
    },
    {
        'q': '*Feb 2026 (Q1).* "Alpha-beta pruning is an approximation of minimax that allows us to avoid expanding the entire game tree. Accordingly, is it true or false that alpha-beta **always** returns the same best action as minimax?"',
        'options': [
            'False: being an approximation, it can occasionally pick a sub-optimal action',
            'True: it returns the same minimax values and hence the same best action; it is exact, not an approximation',
            'True only with perfect move ordering',
            'False when two actions have the same value',
        ],
        'answer': 1,
        'explain': '**Model answer:** True. Alpha-beta returns the same minimax value and thus the same best action as minimax; it simply avoids exploring subtrees that it already knows cannot change the current estimate of the minimax value. Point out the trap in the premise: alpha-beta is **not** an approximation. Ties do not break this: the first child with the best value is evaluated inside the window $(\\alpha, +\\infty)$ with $\\alpha$ below its value, so it gets its exact value; later children with the same value return at most $\\alpha$ and, with the strict `v2 > v` update, never replace it.',
    },
    {
        'q': '*Feb 2026 (Q3) and Jul 2026 (Q1).* "Write the pseudocode of expectiminimax." Which definition is correct?',
        'options': [
            'Utility at terminal states; $\\max_a$ at MAX; $\\min_a$ at MIN; $\\sum_r P(r)\\,\\text{EXPECTIMINIMAX}(\\text{RESULT}(s, r))$ at CHANCE nodes',
            'Utility at terminal states; $\\max_a$ at MAX; $\\min_a$ at MIN; $\\max_r$ at CHANCE nodes (nature plays for MAX)',
            'Utility at terminal states; $\\max_a$ at MAX; the plain average of the children at MIN and CHANCE nodes',
            'Utility at terminal states; $\\max_a$ at MAX; $\\min_a$ at MIN; $\\min_r$ at CHANCE nodes (worst case)',
        ],
        'answer': 0,
        'explain': '**Model answer** (official, slides p. 400): $\\text{EXPECTIMINIMAX}(s) = \\text{UTILITY}(s, \\text{MAX})$ if $s$ is terminal; $\\max_a \\text{EXPECTIMINIMAX}(\\text{RESULT}(s,a))$ if TO-MOVE$(s)$ = MAX; $\\min_a \\ldots$ if MIN; $\\sum_r P(r)\\,\\text{EXPECTIMINIMAX}(\\text{RESULT}(s,r))$ if CHANCE. In code: one recursive depth-first function that looks at `state.to_move` (problem *Expectiminimax*). Traps: chance nodes take the **probability-weighted** average (not max, not min, not a plain mean when outcomes are not equally likely), and MIN nodes stay MIN nodes.',
    },
    {
        'q': '*Jan 2026 (Q2).* On a binary tree with 31 nodes (root, 4 levels of moves, 16 leaves) alpha-beta evaluated **22 of the 31 nodes**. What does the official solution compare this with?',
        'options': [
            'Best case $O(b^{h/2})$ and average case $O(b^{3h/4})$ with $b = 2$, $h = 5$: about 5.7 and 13.5',
            'Best case $O(b^{h})$ = 32 and average case $O(b^{h/2})$ = 5.7',
            'Best case $O(bh)$ = 10 and average case $O(b^{h})$ = 32',
            'Best case $O(h)$ = 5 and average case $O(b^{h/2})$ = 5.7',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): we evaluated 22 of the 31 nodes; in the best case alpha-beta evaluates $O(b^{h/2})$ and in the average case $O(b^{3h/4})$, which with $b = 2$, $h = 5$ gives $2^{2.5} \\approx 5.7$ and $2^{3.75} \\approx 13.5$, so this ordering is far from the best case. Worth adding: the official $h = 5$ counts the **levels**; the depth (number of moves) is 4, giving $4$ and $8$ against $b^h = 16$ leaves. These are orders of growth, not exact counts. Exactly: perfect ordering reads $2^2 + 2^2 - 1 = 7$ leaves (18 nodes), and averaging over all $2^{15}$ child orderings of that tree gives about 12.6 leaves (26 nodes) — the exam\'s ordering (10 leaves, 22 nodes) lies between the best and the average case.',
    },
    {
        'q': '*Sep 2023 (Q2).* Alpha-beta prunes nothing on a binary tree of depth 4 (16 leaves). You may reorder the children of every node (keeping parent–child relations). With the best possible ordering, how many leaves must alpha-beta still evaluate?',
        'options': ['4', '7', '8', '16'],
        'answer': 1,
        'explain': '**Model answer:** order the children of MAX nodes by decreasing and those of MIN nodes by increasing minimax value (best move first, slides p. 377). Then every node refutes its siblings with their first child, and a uniform tree with distinct leaves needs $b^{\\lceil h/2 \\rceil} + b^{\\lfloor h/2 \\rfloor} - 1 = 4 + 4 - 1 = 7$ leaves, the minimum for any ordering. On the exam tree the official reordering prunes 4 internal nodes and 9 leaves (see the Sep 2023 trace problem). 8 would be the rough $b^{3h/4}$ estimate of a random order; 4 forgets that MIN also needs one leaf per refuted sibling.',
    },
    {
        'q': '*Jan 2023 / Jan 2024.* A MIN node receives $\\alpha = 13$, $\\beta = +\\infty$; its first leaf is 13 and the second is 1. What does alpha-beta (AIMA Figure 6.7) do?',
        'options': [
            'It evaluates the leaf 1 too, because $13 < 13$ is false',
            'It prunes the leaf 1: the test is $v \\le \\alpha$, so a branch that can at best tie MAX\'s current option is cut off',
            'It prunes the leaf 1 only if the leaves are sorted',
            'It returns $+\\infty$',
        ],
        'answer': 1,
        'explain': '**Model answer:** the cut-off tests are $v \\le \\alpha$ at MIN and $v \\ge \\beta$ at MAX, **with equality**: the MIN node is worth at most 13 and MAX already has 13 elsewhere, so this node cannot improve the decision. The official solutions of Jan 2023 (leaf 1 below N12 pruned) and Jan 2024 (N04 cut off on $14 \\ge 14$) use exactly this rule. The node returns the bound "≤ 13".',
    },
]
