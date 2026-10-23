TITLE = 'Exam · Aug 2026 · City planning with road tiles: choosing and sizing a CSP'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Aug 2026', 'formulation', 'complexity', 'backtracking', 'all solutions']

STATEMENT = r"""
*Written exam of 31 August 2026 — City Planning.*

City planners design the roads of new areas, represented as grids of tiles. Each tile is covered with one of 4
road blocks: **A** = crossing (+), **B** = straight road, **C** = turn, **D** = T-crossing. Tiles can be rotated
(B is a horizontal or a vertical road, C gives four kinds of turns); all roads are two-way.

The algorithm receives the four blocks, an N×M grid and a block placed on the grid border: the **only** entry/exit
road of the area. Example: a 4×4 grid with a tile of type A in the top row, third column. It must generate a feasible
map such that (1) every cell contains a tile, (2) all the roads are connected, (3) the first tile is the only
entry/exit point of the area (e.g. block A cannot be used in any other border tile). Tiles can be repeated.

```text
+---+---+---+---+
|   |   | + |   |      + = the given crossing (entry/exit)
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
```

1. Considering **all** the algorithms of the course, which one is the best choice? Motivate.
2. Complexity (memory and time) of the proposed solution.
3. Precisely define all the elements needed to implement the tool with the selected algorithm.
4. The city council wants **all** the possible maps from the initial configuration. How do time and memory change?
"""

QUESTIONS = [
    {
        'q': 'Which algorithm is the best choice, and why?',
        'options': [
            'A CSP solved by backtracking search, with an inference algorithm (forward checking or arc consistency): '
            'the tile and rotation allowed in a cell depend on the neighbouring tiles, i.e. on constraints',
            'A*: it finds the optimal map',
            'Breadth-first search on the space of partial maps, because it is complete',
            'Minimax: the planner plays against the constraints',
        ],
        'answer': 0,
        'explain': '**Model answer:** *It is a typical CSP: we must generate coherent roads, so which tile (and rotation) can '
                   'go in a position depends on the surrounding tiles. We apply backtracking search, possibly with one of '
                   'the inference algorithms of the course (forward checking, AC-3) and the MRV/degree heuristics.* There is '
                   'no path cost to optimize (identification problem), so A* or UCS bring nothing; BFS wastes memory since '
                   'every solution is at depth N·M. Local search (min-conflicts) is a possible alternative, but it is '
                   'incomplete: it cannot prove that no map exists.',
    },
    {
        'q': 'How many distinct values (tile + rotation) can a cell take?',
        'options': ['4', '11', '16', '10'],
        'answer': 1,
        'explain': 'A crossing looks the same in every rotation (1); a straight road is horizontal or vertical (2); a turn has '
                   '4 orientations (4); a T-crossing has 4 orientations, one per missing side (4): 1 + 2 + 4 + 4 = **11** '
                   '— the branching factor b used in the official solution. 16 = 4 blocks × 4 rotations counts identical '
                   'tiles several times.',
    },
    {
        'q': 'Memory and time complexity of backtracking on an N×M grid?',
        'options': [
            'Memory O(11 · N · M) (linear, depth-first), time O(11^(N·M)) (exponential)',
            'Memory O(11^(N·M)), time O(11^(N·M))',
            'Memory O(N · M), time O(11 · N · M)',
            'Memory O((N·M)!), time O(11^(N·M))',
        ],
        'answer': 0,
        'explain': '**Model answer:** *Backtracking is a depth-first search: its memory is linear in the depth N·M (the number '
                   'of variables) times the branching factor b = 11, so O(11·N·M). Time is exponential: in the worst case '
                   'all 11^(N·M) complete assignments are explored.* (Strictly the given tile is fixed, so 11^(N·M−1); the '
                   'order does not change. Backtracking that generates one value at a time even needs only O(N·M) plus the '
                   'current domains.)',
    },
    {
        'q': 'Which formulation is complete and correct?',
        'options': [
            'Variables = the grid positions; domains = the 11 (tile, rotation) values (A1, B1, B2, C1…C4, D1…D4); '
            'constraints: adjacent tiles must match (a road leaving a side must enter the neighbour), no road may exit '
            'the grid except at the given entry tile, all road segments must be connected',
            'Variables = the 4 blocks; domains = the grid positions; constraints: each block used once',
            'Variables = the grid positions; domains = {A, B, C, D}; constraint: adjacent tiles must be different',
            'Variables = the roads; domains = their lengths; constraint: total length ≤ N·M',
        ],
        'answer': 0,
        'explain': '**Model answer:** *The state is a set of (tile, rotation) assignments to at most N×M positions. Variables: '
                   'the positions. Domains: the (tile, rotation) pairs, encoded e.g. as A1, B1, B2, C1…C4, D1…D4. '
                   'Constraints: (1) which tiles with which rotation can be placed next to a given tile (roads must '
                   'continue across shared sides: binary constraints between adjacent cells); (2) no entrance/exit except '
                   'the given tile (unary constraints on the border cells); (3) all the segments are connected.* Note that '
                   '(3) is a **global** constraint over all the cells: local matching prevents dangling roads but not two '
                   'separate road networks.',
    },
    {
        'q': 'The algorithm must now generate **all** the possible maps. How do the complexities change?',
        'options': [
            'Worst-case time stays exponential, O(11^(N·M)), and the search memory stays linear; but now the whole tree '
            'is always explored, and storing the solutions needs extra memory proportional to their number',
            'Time becomes O(11^(N·M)) while it was polynomial before',
            'Memory becomes exponential because backtracking must keep the whole tree',
            'Nothing can be said: the number of maps is infinite',
        ],
        'answer': 0,
        'explain': '**Model answer:** *Nothing changes in the worst case: time is still exponential, O(11^(N·M)), and the '
                   'memory of the depth-first search remains linear.* (Official answer.) Worth adding: the best case gets '
                   'worse — the first-solution version can stop early, the all-solutions version always explores the whole '
                   '(pruned) tree — and if the maps are collected in a list rather than output one by one, that list can be '
                   'exponentially large.',
    },
]
