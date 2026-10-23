TITLE = 'Properties and complexities of uninformed search'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['completeness', 'optimality', 'complexity', 'summary table']

STATEMENT = r"""
The summary table of slide p. 172, one question at a time. Try to answer from the *reason*
(what the frontier looks like, what is stored), not from memory.
"""

QUESTIONS = [
    {
        'q': 'In the complexity formulas, what are $d$ and $m$?',
        'options': [
            '$d$ = maximum depth of the search tree, $m$ = depth of the shallowest goal',
            '$d$ = depth of the shallowest goal node, $m$ = maximum depth of the search tree (possibly $\\infty$)',
            '$d$ = number of goal states, $m$ = number of states',
            '$d$ = depth of the cheapest goal, $m$ = maximum branching factor',
        ],
        'answer': 1,
        'explain': '$b$ = branching factor (max number of successors), $d$ = depth of the **shallowest** goal '
                   '(p. 117), $m$ = **maximum** depth of the search tree (p. 147). Often $m \\gg d$, and $m$ '
                   'is infinite when paths can be extended forever.',
    },
    {
        'q': 'Breadth-first search is **optimal** when… (select all that apply)',
        'options': [
            'all step costs are equal',
            'the path cost is a non-decreasing function of the depth of the node',
            'the branching factor is finite',
            'always: it finds the shallowest goal',
        ],
        'answer': [0, 1],
        'explain': 'BFS returns the **shallowest** goal. That is the cheapest one only if deeper never means '
                   'cheaper, e.g. with unit costs (p. 125). A finite $b$ gives **completeness**, not optimality.',
    },
    {
        'q': 'Worst-case time of BFS with the goal test done when a node is **selected** from the frontier?',
        'options': ['$O(bd)$', '$O(b^d)$', '$O(b^{d+1})$', '$O(b^m)$'],
        'answer': 2,
        'explain': 'If the goal is the last node of level $d$, every other node of level $d$ is expanded '
                   'before it is selected: $b^{d+1}-b$ nodes of level $d+1$ are generated (p. 125–126). '
                   'With the **early** goal test (at generation) this extra level disappears: $O(b^d)$ (p. 127–128).',
    },
    {
        'q': 'Why is BFS so impractical on large problems, even when $O(b^d)$ time would be acceptable?',
        'options': [
            'It is not complete',
            'It keeps every generated node in memory (frontier + reached): space $O(b^d)$',
            'It needs a priority queue',
            'It expands nodes more than once',
        ],
        'answer': 1,
        'explain': 'Space equals time for BFS: the frontier alone holds a whole level of the tree. With '
                   '$b=10$, $d=10$ that is $10^{10}$ nodes. Memory, not time, is the first wall BFS hits.',
    },
    {
        'q': 'Uniform-cost search has complexity $O(b^{1+\\lfloor C^*/\\varepsilon \\rfloor})$. What does '
             '$\\lfloor C^*/\\varepsilon \\rfloor$ stand for?',
        'options': [
            'The depth of the shallowest goal',
            'A bound on the depth UCS may reach: with every step costing at least $\\varepsilon$, a path of cost '
            '$\\le C^*$ has at most $C^*/\\varepsilon$ steps',
            'The number of goal states',
            'The number of times a node is re-expanded',
        ],
        'answer': 1,
        'explain': '$C^*$ = optimal solution cost, $\\varepsilon$ = minimum step cost. UCS explores every node with '
                   '$g < C^*$; these can be as deep as $C^*/\\varepsilon$ (many cheap steps). This can be much '
                   'worse than $b^d$. With all costs equal, it is $O(b^{d+1})$, as BFS (p. 138).',
    },
    {
        'q': 'Uniform-cost search is **complete** provided that… (select all that apply)',
        'options': [
            'the branching factor $b$ is finite',
            'every step cost is $\\ge \\varepsilon$ for some $\\varepsilon > 0$',
            'all step costs are equal',
            'the state space is a tree',
        ],
        'answer': [0, 1],
        'explain': 'With zero-cost steps, UCS could loop forever along an infinite path of cost 0 (its $g$ never '
                   'grows past $C^*$). With costs $\\ge \\varepsilon > 0$, $g$ grows with depth and every node '
                   'with $g \\le C^*$ is eventually expanded (p. 137).',
    },
    {
        'q': 'Why is the space complexity of depth-first search only $O(bm)$?',
        'options': [
            'Because it uses a `reached` table',
            'Because it stores only the current path from the root, plus the not-yet-expanded siblings of '
            'each node on it',
            'Because $m \\le d$',
            'Because it never generates more than $b$ nodes',
        ],
        'answer': 1,
        'explain': 'DFS is a tree-like search: once a subtree has been fully explored it is dropped. At most $m$ '
                   'levels × $b$ siblings are in memory (p. 147). Time is still $O(b^m)$.',
    },
    {
        'q': 'Summary table (p. 172): which strategies are **complete** on a finite state space **with repeated '
             'states** (loops), using the tree-like versions without cycle checking? (select all)',
        'options': ['Breadth-first', 'Uniform-cost', 'Depth-first', 'Depth-limited', 'Iterative deepening'],
        'answer': [0, 1, 4],
        'explain': 'BFS, UCS and IDS explore the tree by increasing depth/cost, so they reach the goal even if '
                   'the tree is infinite because of loops. DFS can follow a loop forever. Depth-limited search '
                   'never fails to stop, but it misses goals deeper than $L$ — it is complete only if $L \\ge d$.',
    },
    {
        'q': 'Iterative deepening: space and time complexity?',
        'options': [
            'space $O(b^d)$, time $O(b^d)$',
            'space $O(bd)$, time $O(b^d)$',
            'space $O(bd)$, time $O(b^{d+1})$',
            'space $O(bm)$, time $O(b^m)$',
        ],
        'answer': 1,
        'explain': 'Each iteration is a depth-limited DFS: $O(bd)$ memory. The repeated upper levels add only a '
                   'constant factor ≈ $b/(b-1)$ because the last level dominates: time $O(b^d)$ (p. 161).',
    },
    {
        'q': 'Depth-limited search with limit $L$ is complete when…',
        'options': ['$L \\ge d$', '$L \\ge m$', '$L = 0$', 'never'],
        'answer': 0,
        'explain': 'With $L \\ge d$ the shallowest goal lies within the limit (p. 152). The catch: $d$ is usually '
                   'unknown, which is why iterative deepening tries $L = 0, 1, 2, \\dots$',
    },
    {
        'q': 'Bidirectional search with BFS in both directions: time and space?',
        'options': ['$O(b^{d/2})$', '$O(b^d / 2)$', '$O(2^{d})$', '$O(bd)$'],
        'answer': 0,
        'explain': 'Each search goes about $d/2$ deep: $2 \\cdot b^{d/2}$ is far smaller than $b^d$ '
                   '(not half of it!). Space is also $O(b^{d/2})$: one side must store its reached states to '
                   'detect the meeting.',
    },
]
