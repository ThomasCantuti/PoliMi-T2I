TITLE = 'Exam · Jun 2024 · States k → 2k, 2k+1: BFS, DFS, bidirectional search, reformulation'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Jun 2024', 'bidirectional search', 'branching factor', 'reformulation', 'BFS', 'DFS']

STATEMENT = r"""
*Written exam of 20 June 2024 — Problem 1 (Search), Questions 2–4.*

The initial state is **1** and each state $k$ has two successors, **2k** and **2k + 1** (left and right child).
The goal is **11**. Children are inserted in the frontier from left to right.

```text
                 1
         2               3
     4       5       6       7
   8   9  10  11  12  13  14  15
```

The depth-limited and iterative-deepening parts of Question 2 are trace problems in this topic.
"""

QUESTIONS = [
    {
        'q': 'Question 2: order in which nodes are **visited** (selected from the frontier) by **breadth-first '
             'search** with the goal test performed when a node is selected.',
        'options': [
            '1 2 3 4 5 6 7 8 9 10 11',
            '1 2 3 4 5',
            '1 2 4 8 9 5 10 11',
            '1 3 2 7 6 5 4 11',
        ],
        'answer': 0,
        'explain': '**Model answer:** "1 2 3 4 5 6 7 8 9 10 11": BFS visits the states level by level, left to right, '
                   'so here simply in increasing order until 11 (official answer). "1 2 3 4 5" is what BFS **expands** '
                   'with the early goal test: 11 is generated when 5 is expanded and the search stops there.',
    },
    {
        'q': 'The official solution also lists **depth-first search: 1 2 4 8 9 5 10 11**. When is this correct?',
        'options': [
            'Only on the drawn portion (states 1–15, where 8–15 have no successors); on the real state space DFS '
            'visits 1, 2, 4, 8, 16, 32, … and never terminates',
            'Always: DFS is complete because the branching factor is finite',
            'Always: DFS and depth-limited search with $L = 3$ coincide',
            'Never: DFS would visit 1 3 7 15 first',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "On the infinite state space DFS follows the leftmost branch 1, 2, 4, 8, 16, … '
                   r'forever (the tree has $m = \infty$), so it is not complete and never reaches 11. The sequence '
                   r'1 2 4 8 9 5 10 11 holds only if the space is cut at state 15, as in the drawing." This is a '
                   r'**caveat on the official answer**, which gives the sequence without stating the assumption; the depth '
                   r'limit $L = 3$ is exactly what makes the same visit order correct for depth-limited search.',
    },
    {
        'q': 'Question 3: how well would **bidirectional search** work on this problem? What is the branching factor '
             'in each direction?',
        'options': [
            'Forward 2, backward 1: very well, the backward search is a single path',
            'Forward 2, backward 2: as well as BFS from both sides, $O(2^{d/2})$',
            'It cannot be applied: the goal is not an explicit state',
            'Forward 1, backward 2: it would be worse than BFS',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "Forward each state has 2 successors ($b = 2$); backward each state $n > 1$ has '
                   r'exactly **one predecessor**, $\lfloor n/2 \rfloor$ ($b = 1$). Bidirectional search works very well: the '
                   r'backward frontier is a single chain 11, 5, 2, 1, so it meets the forward search almost immediately" '
                   r'(official answer). Bidirectional search needs an explicit goal state and computable predecessors: '
                   r'both hold here.',
    },
    {
        'q': 'Question 4: does this suggest a **reformulation** that solves "go from 1 to a given goal $n$" with almost '
             'no search?',
        'options': [
            r'Yes: start from the goal and repeatedly apply the unique predecessor $\lfloor n/2 \rfloor$ until 1, '
            r'then reverse the path (equivalently, read the binary digits of $n$: 0 = go to $2k$, 1 = go to $2k + 1$)',
            'No: every problem with branching factor 2 needs exponential search',
            'Yes: use iterative deepening, which needs only $O(bd)$ memory',
            'Yes: use uniform-cost search with cost $k$ for the arc to $2k$',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "Search backwards: the predecessor of $n$ is $\lfloor n/2 \rfloor$, so the path '
                   r'from 1 to $n$ is computed in $\lfloor \log_2 n \rfloor$ steps with no branching" (official answer: '
                   r'"floor(n/2)"). For $n = 11 = 1011_2$: 11 → 5 → 2 → 1, i.e. 1 → 2 → 5 → 11. After the leading 1, the '
                   r'binary digits 0, 1, 1 are the actions left, right, right. IDS still searches (with $O(2^d)$ time).',
    },
    {
        'q': r'How many nodes does BFS (goal test at selection, as in Question 2) **visit** to reach a goal $n$ in this '
             r'space?',
        'options': [r'$n$', r'$\lfloor \log_2 n \rfloor + 1$', r'$2n$', r'$2^n$'],
        'answer': 0,
        'explain': r'BFS visits the states in increasing order 1, 2, 3, …, so it visits exactly $n$ nodes: exponential in the '
                   r'depth $d = \lfloor \log_2 n \rfloor$ of the goal ($n \approx 2^d$), while the backward reformulation '
                   r'needs only $d + 1$ states.',
    },
]
