TITLE = 'Exam · Jun 2025 · Maze navigation by repeated A*: design and complexity'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Jun 2025', 'A*', 'time complexity', 'principle of optimality', 'maze']

STATEMENT = r"""
*Written exam of 11 June 2025 — Problem 1 (Informed Search), Questions 2–3* (Questions 1 and 4 are about
Q-learning, see the reinforcement-learning topic).

A rational agent must reach the exit of a maze from **any** position. The maze is discrete, completely observable and
deterministic; the agent knows all the $N$ free cells and can move in four directions, each move costs one. A
colleague proposes to **apply A\* several times** to compute the optimal path to the exit from all the states and
memorize all the optimal paths; the heuristic is the **Euclidean distance**.

- **Question 2.** Write the pseudo-code to implement this solution in the most efficient way. *Hint: do you need to
  compute all the shortest paths starting from scratch?* Adequately motivate your answer.
- **Question 3.** Discuss the time complexity of the solution based on A\*.

The code exercise *Optimal paths from every cell of a maze by repeated A\** implements Question 2.
"""

QUESTIONS = [
    {
        'q': 'Question 2: which pseudo-code implements the colleague\'s idea most efficiently?',
        'options': [
            'Keep a set of processed cells (initially only the exit). Repeat: pick an unprocessed cell S, run A* from S '
            'until it reaches a processed cell, add **all** the cells of the found path to the processed ones; until '
            'every cell is processed',
            'For each of the N cells run A* from that cell to the exit, from scratch',
            'Run A* once from the exit to the farthest cell and store that path',
            'Run A* from each cell, but stop each search after a fixed number of expansions',
        ],
        'answer': 0,
        'explain': r'**Model answer** (official): "CandidateStates = all the states; ProcessedStates = {Exit}; repeat: '
                   r'randomly select S from CandidateStates, apply A* to compute the optimal path P from S to one of '
                   r'the ProcessedStates, remove all the states in P from CandidateStates and add them to '
                   r'ProcessedStates; until CandidateStates is empty." Motivation: we do not need to start from '
                   r'scratch, because every cell on an optimal path already has its optimal path (next question), so '
                   r'later searches stop early. The second option repeats the same work $N$ times; the third only '
                   r'covers one path; the fourth loses optimality.',
    },
    {
        'q': 'Why can **all** the cells of the path P found from S be marked as solved?',
        'options': [
            'Every suffix of an optimal path is itself optimal: if a cell n on P had a cheaper way to the exit, '
            'S could use it and P would not be optimal',
            'Because A* with an admissible heuristic expands each cell at most once',
            'Because the Euclidean distance is consistent',
            'Because in a maze there is only one path between two cells',
        ],
        'answer': 0,
        'explain': r'This is the **principle of optimality** (sub-paths of shortest paths are shortest paths). It is '
                   r'what makes the reuse correct; the other options are true facts (except the last: a maze can have '
                   r'loops) that do not justify it.',
    },
    {
        'q': r'The search from S stops at the first **processed** cell $p$ it selects. Which heuristic value must $p$ '
             r'get so that the complete route S → $p$ → exit is still optimal?',
        'options': [
            r'Its stored optimal cost to the exit, $h(p) = d^*(p)$ (exact), while unprocessed cells keep the Euclidean '
            r'distance',
            r'The Euclidean distance from $p$ to the exit, like every other cell',
            r'$h(p) = 0$, since $p$ is a goal of the search',
            r'Any value: A* is optimal anyway',
        ],
        'answer': 0,
        'explain': r'The goal is still the **exit**: the search must minimize $g(p) + d^*(p)$, not just $g(p)$. With '
                   r'$h(p) = d^*(p)$, $f(p)$ is the true cost of the complete route, and every other frontier node has '
                   r'$f \le$ its true cost (Euclidean is admissible), so the first selected processed cell gives an '
                   r'optimal route. With the Euclidean value (or 0) A* can stop at a cell that looks close to the exit '
                   r'through a wall but is far along the maze: in the code exercise, cell (7, 3) gets 16 moves '
                   r'instead of 14. The official pseudo-code ("the optimal path from S to one of the ProcessedStates") '
                   r'leaves this implicit; write it explicitly in the exam.',
    },
    {
        'q': 'Question 3: which statements about the time complexity of the A*-based solution are correct? (select all)',
        'options': [
            r'One run is exponential in the length $d$ of the solution, $O(b^d) = O(4^d)$, which is $O(4^N)$ in the '
            r'worst case (a path can cross all $N$ cells)',
            r'Later runs are cheaper: their cost depends on how many cells the previous paths already cover',
            r'With graph search and the consistent Euclidean heuristic one run expands each cell at most once, so it '
            r'is also bounded by $O(N \log N)$ (priority queue)',
            r'The total time is always $N$ times the time of the first run',
        ],
        'answer': [0, 1, 2],
        'explain': r'**Model answer** (official): "For one run, the time complexity is exponential in the length of '
                   r'the solution, which is $O(4^N)$ in the worst case. In the following iterations, the complexity '
                   r'depends on the number of states included in the previous paths." That is the textbook bound '
                   r'$O(b^d)$ with $b = 4$. The third statement is a tighter remark worth adding: on a finite maze, '
                   r'A* graph search with a consistent heuristic never re-expands a cell, so a run costs at most '
                   r'$O(N \log N)$ and the whole solution at most $O(N^2 \log N)$ even without reuse. The last option '
                   r'ignores the reuse. (A single breadth-first search backwards from the exit would compute every '
                   r'cost in $O(N)$, but that is not the colleague\'s A*-based idea.)',
    },
]
