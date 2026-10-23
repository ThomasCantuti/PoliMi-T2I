TITLE = 'Exercise book 2.1 · Uniform-cost, greedy and A*, with and without repeated-state elimination'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exercise book', 'uniform-cost search', 'greedy', 'A*', 'repeated states', 'consistency']

STATEMENT = r"""
*Exercise book (Restelli et al.), Exercise 2.1, parts 5–11* (parts 1–4, BFS and DFS, belong to the uninformed
topic).

Directed graph, initial state **A**, goal **G**, step costs on the arcs, $h$ for every state:

```text
arcs:  A→B 3   A→C 5   A→F 2   B→E 5   B→F 2   B→H 1   C→B 1   C→E 4   E→H 2   G→B 6   G→F 2   H→G 1
h:     A 5   B 2   C 2   E 2   F 100   G 0   H 1          (F has no outgoing arcs)

              C(2) ----4----> E(2)
             ^  |            ^  |
           5/   |1         5/   |2
           /    v          /    v
   A(5) ---3---> B(2) ----1----> H(1)
           \      |  ^            |
           2\    2|   \6          |1
             v    v    \          v
              F(100) <-----2----- G(0)
```

Conventions of the book: goal test when a node is **selected**; "with elimination of repeated states" = a
**closed list** checked when a node is generated (if a state is found again, the node with the smallest value of
the evaluation function is kept); ties broken in **lexicographic order** — the solutions apply it to the whole path
(A-B-F comes before A-C).
"""

QUESTIONS = [
    {
        'q': r'5. **Uniform-cost search without** elimination of repeated states: in which order are the nodes '
             r'selected?',
        'options': ['A, F, B, H, F, G', 'A, F, B, H, C, F, G', 'A, F, B, H, G', 'A, B, H, G'],
        'answer': 0,
        'explain': r'Frontier after A: F 2, B 3, C 5. F has no successors. B: E 8, F 5, H 4. H: G 5. Now C (path A-C), '
                   r'F (A-B-F) and G (A-B-H-G) all have $g = 5$: by path order A-B-F < A-B-H-G < A-C, so F is selected '
                   r'(nothing to expand) and then **G**. Result A → B → H → G, cost 5 (book: A1, F2, B3, H4, F5, G). '
                   r'With ties broken by state name or FIFO, C would come first: always state the tie rule.',
    },
    {
        'q': r'6. **Uniform-cost search with** elimination of repeated states: what changes?',
        'options': [
            'The second F (A-B-F, g = 5) is not added because F was already expanded with g = 2: the order is '
            'A, F, B, H, G',
            'Nothing: the order is A, F, B, H, F, G',
            'H is eliminated because it is reached twice',
            'The search returns A → F because F is expanded first',
        ],
        'answer': 0,
        'explain': r'F is in the closed list with $g = 2 < 5$, so the new node is eliminated at generation (crossed in '
                   r'the book). Then G (A-B-H-G) is selected before C (A-C) at $g = 5$: A, F, B, H, G; path '
                   r'A → B → H → G, cost 5. A → F is a dead end: F has no outgoing arcs.',
    },
    {
        'q': r'7–8. **Greedy best-first search** (with or without elimination): selection order and returned path?',
        'options': [
            'A, B, H, G — path A → B → H → G, cost 5',
            'A, C, E, H, G — path A → C → E → H → G, cost 12',
            'A, B, E, H, G — path A → B → E → H → G, cost 9',
            'A, F, B, H, G — path A → B → H → G, cost 5',
        ],
        'answer': 0,
        'explain': r'After A: B 2, C 2, F 100. B and C tie on $h = 2$: A-B < A-C, so **B**. B: E 2, F 100, H 1 → H '
                   r'(h = 1). H: G 0 → G. The F generated under B has the same $h$ as the F already in the frontier, '
                   r'so with elimination it is dropped; it is never selected anyway. Here greedy happens to find the '
                   r'optimal path, because $h$ is exact on B and H.',
    },
    {
        'q': r'9–10. **A\*** (with or without elimination): what are the $f$ values of the children of B?',
        'options': [
            r'E: 8 + 2 = 10,  F: 5 + 100 = 105,  H: 4 + 1 = 5',
            r'E: 5 + 2 = 7,  F: 2 + 100 = 102,  H: 1 + 1 = 2',
            r'E: 2,  F: 100,  H: 1',
            r'E: 8 + 2 = 10,  F: 2 + 100 = 102,  H: 4 + 1 = 5',
        ],
        'answer': 0,
        'explain': r'$g$ is the cost from the **root**: $g(B) = 3$. After A: B 3+2 = 5, C 5+2 = 7, F 2+100 = 102. B '
                   r'is selected; its children E 10, F 105, H 5. H (5) is selected; G 5+0 = 5 is selected next: '
                   r'**A, B, H, G**, path A → B → H → G, cost 5 = $C^*$. With elimination the F under B (105) is '
                   r'dropped because the F in the frontier has a smaller $f$ (102). The second option uses step costs '
                   r'instead of path costs; the last one copies $f(F)$ from the other branch.',
    },
    {
        'q': r'11. Is $h$ admissible? Is it consistent? (select all true statements)',
        'options': [
            r"$h$ is consistent: on every arc $h(n) - h(n') \le c(n, n')$, e.g. B→H: $2 - 1 \le 1$, A→B: $5 - 2 \le 3$",
            r'$h$ is admissible, because it is consistent and $h(G) = 0$',
            r'$h$ is not admissible because $h(F) = 100$ is larger than any arc cost',
            r'To prove consistency you must first compute $h^*$ for every state',
        ],
        'answer': [0, 1],
        'explain': r'**Model answer** (book): "The cost of each edge is never smaller than the difference of the '
                   r'heuristic values of its source and sink: $h$ is consistent. When goal states have $h = 0$, '
                   r'consistency implies admissibility." F cannot reach G at all ($h^*(F) = \infty$), so $h(F) = 100$ '
                   r'overestimates nothing. True costs: $h^*(A) = 5$, $h^*(B) = 2$, $h^*(C) = 3$, $h^*(E) = 3$, '
                   r'$h^*(H) = 1$ — $h$ is exact on A, B and H, which is why every strategy finds the cost-5 path so '
                   r'quickly. Consistency is a local check on arcs; it needs no $h^*$.',
    },
]
