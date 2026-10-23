TITLE = 'Exam · Short questions on A*, greedy and heuristics (2024–2026)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', '2024–2026', 'A*', 'admissibility', 'greedy', 'true/false']

STATEMENT = r"""
*True/false and short open questions from the written exams of 6 February 2024 (Problem 2, Q1–Q2),
16 January 2025 (Problem 4, Q3), 8 September 2025 (Problem 2, Q1–Q2), 6 February 2026 (Problem 1, Q3) and
11 June 2026 (Problem 2, Q1).*

In the exam every answer must be **motivated**: a bare "true"/"false" is worth nothing, and a completely wrong
answer costs negative points. Read the model answer after each question.
"""

QUESTIONS = [
    {
        'q': r'*Feb 2024, Q1 (true or false?).* Given an **admissible** heuristic $h_1(s)$ and an **inadmissible** '
             r'one $h_2(s)$, then $h_3(s) = \min(h_1(s), h_2(s))$ will be admissible.',
        'options': [
            r'True: $h_3(s) \le h_1(s) \le h^*(s)$',
            r'False: wherever $h_2$ overestimates, $h_3$ can overestimate too',
            r'True only if $h_2$ is consistent',
            r'False: the minimum of two heuristics is never admissible',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "True, since $h_3(s) = \min(h_1(s), h_2(s)) \le h_1(s) \le h^*(s)$ (and '
                   r'$h_3 \ge 0$ if both are non-negative)." The minimum is never above the admissible one, whatever '
                   r'$h_2$ does. The trap is the **max**: $\max(h_1, h_2) \ge h_2$ can overestimate.',
    },
    {
        'q': r'*Jun 2026, Q1.* Given two **admissible** heuristics $H_1$ and $H_2$, we define '
             r'$H_3 = \min(H_1, H_2)$. Which statements are true? (select all)',
        'options': [
            r'$H_3$ is admissible: $0 \le \min(H_1(s), H_2(s)) \le H_1(s) \le H^*(s)$ for every $s$',
            r'$H_3$ dominates $H_1$ and $H_2$, so A* with $H_3$ expands fewer nodes',
            r'$\max(H_1, H_2)$ is admissible too, and it is the better choice',
            r'$H_3$ is admissible only if $H_1$ and $H_2$ are consistent',
        ],
        'answer': [0, 2],
        'explain': r'**Model answer** (the exam asks for a high-level proof): "$H_1, H_2$ admissible means '
                   r'$0 \le H_1(s) \le H^*(s)$ and $0 \le H_2(s) \le H^*(s)$ for every state $s$. Hence '
                   r'$0 \le \min(H_1(s), H_2(s)) \le H^*(s)$: $H_3$ is admissible." It is **dominated** by both (it is '
                   r'the less informed of the two everywhere), so it is a poor choice: $\max(H_1, H_2)$ is also '
                   r'admissible (both are $\le H^*$) and dominates both (slide p. 184). Consistency is not needed. '
                   r'Same idea as Feb 2024 Q1, where one of the two was even inadmissible.',
    },
    {
        'q': r'*Feb 2024, Q2 and Jan 2025, Q3 (consistent heuristic).* In A*, will the **first path to the goal '
             r'inserted in (added to) the frontier** always be optimal?',
        'options': [
            r'No: only the first goal node **extracted** (selected) from the frontier is guaranteed optimal',
            'Yes, if the heuristic is consistent',
            'Yes, if the heuristic is admissible',
            'Yes: A* never inserts a suboptimal path to the goal',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "False. A goal node can be generated first through an expensive path while a '
                   r'cheaper one is still being built; with an admissible (or consistent) heuristic it is the first '
                   r'path to the goal **removed** from the frontier that is optimal, which is why the goal test is done '
                   r'on selection." Counterexample: S→G 10, S→A 1, A→G 1, $h = 0$: expanding S inserts G with $g = 10$ '
                   r'first; A is selected next and inserts G with $g = 2$, which is selected before the old one. A '
                   r'consistent heuristic does not change this (here $h = 0$ is consistent). Asked twice: Feb 2024 and '
                   r'Jan 2025.',
    },
    {
        'q': r'*Sep 2025, Q1.* Graph search problem, every action costs at least $\varepsilon > 0$, **consistent** '
             r'heuristic. Is A* guaranteed to expand **no more nodes than depth-first search**?',
        'options': [
            'No: DFS might by chance go straight down an optimal path and expand fewer nodes',
            'Yes: A* is optimally efficient, so it expands fewer nodes than any other algorithm',
            'Yes, because the heuristic is consistent',
            'No: A* always expands every node of the state space',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "No. DFS might by chance expand the optimal path right away (e.g. when the '
                   r'first child is always on the solution path), while A* is guided by $g$ and $h$ and may expand '
                   r'other nodes with $f < C^*$ first." Optimal efficiency compares A* only with other algorithms that '
                   r'are **guaranteed optimal** and use the same heuristic; DFS is not one of them.',
    },
    {
        'q': r'*Sep 2025, Q2.* Same scenario. Is A* graph search guaranteed to expand **no more nodes than '
             r'uniform-cost graph search**?',
        'options': [
            r'Yes: UCS is A* with $h = 0$, and every node A* surely expands is also expanded by UCS',
            'No: A* may expand more nodes when the heuristic is very small',
            'No: UCS is optimally efficient, A* is not',
            'Only if the heuristic is also admissible',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "Yes. Uniform-cost search is A* with $h(n) = 0$; with $h \ge 0$ every node '
                   r'that A* surely expands ($g(n) + h(n) < C^*$) has $g(n) < C^*$ and is expanded by UCS too, so in '
                   r'the worst case ($h = 0$) A* expands the same nodes as UCS." The only freedom is in the ties at '
                   r'$f = C^*$ (slide p. 232). The last option is redundant: consistent already implies admissible.',
    },
    {
        'q': r'*Feb 2026, Q3.* Does **greedy best-first search** have the same **worst-case** number of node '
             r'expansions as **depth-first search**?',
        'options': [
            r'Yes: both are $O(b^m)$ — a misleading heuristic can make greedy expand the whole state space, like DFS',
            'No: greedy always expands fewer nodes thanks to the heuristic',
            'No: greedy is like breadth-first search, $O(b^d)$',
            'Yes, but only if the heuristic is admissible',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "Yes. In the worst case both might end up expanding the entire state space: '
                   r'$O(b^m)$, with $m$ the maximum depth (slide p. 191). A good heuristic helps greedy in practice, '
                   r'not in the worst case." The official solution adds that greedy "might behave exactly like DFS '
                   r'when $h(s) = 0$": with $h$ constant every node ties, so the order depends on tie-breaking '
                   r'(LIFO ties = DFS, while the FIFO ties of the course `PriorityQueue` give breadth-first order). '
                   r'Admissibility plays no role for greedy.',
    },
]
