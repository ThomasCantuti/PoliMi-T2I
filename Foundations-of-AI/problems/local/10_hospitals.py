from harness import Test
from local_lib import ROWS, COLS, HOUSES, START

TITLE = 'Homes & hospitals: objective function and neighbors'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['complete-state formulation', 'objective function', 'neighborhood', 'Manhattan distance']

STATEMENT = r"""
Local search works on **complete states** and needs two ingredients: a function that **evaluates** a state
and a definition of **neighbor** states (slides p. 320–325).

Place the hospitals on a 5 × 10 grid to **minimize** the sum, over all houses, of the Manhattan distance
to the **closest** hospital. Cells are `(row, col)`, `(0, 0)` is the top-left corner.

```text
      0 1 2 3 4 5 6 7 8 9
   0  . . . . H . . . h .        h = house, H = hospital
   1  . . h . . . . . . .        houses:    (0,8) (1,2) (3,1) (4,6)
   2  . . . . . . . . . .        hospitals: (0,4) (3,9)   (slide p. 324)
   3  . h . . . . . . . H
   4  . . . . . . h . . .
```

1. `hospital_cost(hospitals, houses)` → the cost. For the state above: $3 + 6 + 4 + 4 = 17$.
2. `hospital_neighbors(hospitals, houses, rows, cols)` → the list of neighbor states: move **one** hospital by
   **one** cell up, down, left or right, staying on the grid and never onto a house or the other hospital.
   A state is a tuple of `(row, col)` tuples; keep the hospitals in the same order as the input.

The slide instance is in `local_lib`: `ROWS, COLS, HOUSES, START`.
"""

STARTER = '''def hospital_cost(hospitals: tuple[tuple[int, int], ...], houses: list[tuple[int, int]]) -> int:
    """Sum over the houses of the Manhattan distance to the closest hospital."""
    # TODO
    return 0

def hospital_neighbors(hospitals: tuple[tuple[int, int], ...], houses: list[tuple[int, int]],
                       rows: int, cols: int) -> list[tuple]:
    """All states obtained by moving one hospital one cell (up, down, left, right)."""
    result: list[tuple] = []
    # TODO
    return result
'''

SOLUTION = '''def hospital_cost(hospitals: tuple[tuple[int, int], ...], houses: list[tuple[int, int]]) -> int:
    """Sum over the houses of the Manhattan distance to the closest hospital."""
    return sum(min(abs(r - hr) + abs(c - hc) for hr, hc in hospitals) for r, c in houses)

def hospital_neighbors(hospitals: tuple[tuple[int, int], ...], houses: list[tuple[int, int]],
                       rows: int, cols: int) -> list[tuple]:
    """All states obtained by moving one hospital one cell (up, down, left, right)."""
    result: list[tuple] = []
    for i, (r, c) in enumerate(hospitals):
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            cell = (r + dr, c + dc)
            if 0 <= cell[0] < rows and 0 <= cell[1] < cols and cell not in houses and cell not in hospitals:
                result.append(hospitals[:i] + (cell,) + hospitals[i + 1:])
    return result
'''

HINTS = [
    'Cost: for every house take `min(...)` over the hospitals of `abs(dr) + abs(dc)`, then `sum(...)`.',
    'Neighbors: two nested loops – over the hospitals (`enumerate`) and over the 4 moves `(-1,0), (1,0), (0,-1), (0,1)`.',
    'Keep a move only if the new cell is inside `0 <= row < rows`, `0 <= col < cols`, and is neither a house nor a hospital; '
    'build the new state with `hospitals[:i] + (cell,) + hospitals[i + 1:]`.',
]

EXPLANATION = r"""
Here the **path does not matter**, only the final configuration: the state *is* a candidate solution
(complete-state formulation), and the objective function says how good it is. Local search keeps a single
current state and only looks at its neighbors – memory $O(1)$, no frontier, no explored set.

The neighborhood defines the "landscape": with 2 hospitals and 4 moves each, a state has at most 8 neighbors,
out of the $\binom{46}{2} = 1035$ possible placements. The slide run goes $17 \to 15 \to 13 \to 11 \to 9$ by
always picking an improving neighbor; you'll code that loop next.

Notice the hidden trade-off: a richer neighborhood (e.g. teleport a hospital anywhere) means fewer local
optima but more neighbors to evaluate at each step.
"""

ENTRY = 'hospital_cost'


def _neighbors_case(hospitals, expected_count):
    def check(got):
        got = {tuple(map(tuple, s)) for s in got}
        want = set(_ref_neighbors(hospitals))
        if got != want:
            return False, f'missing {sorted(want - got)}, unexpected {sorted(got - want)}'
        return True
    return Test(f'neighbors of {hospitals}', call=lambda sol: sol.hospital_neighbors(hospitals, HOUSES, ROWS, COLS),
                check=check, show=f'{hospitals}: {expected_count} neighbors')


def _ref_neighbors(h):
    out = []
    for i, (r, c) in enumerate(h):
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            cell = (r + dr, c + dc)
            if 0 <= cell[0] < ROWS and 0 <= cell[1] < COLS and cell not in HOUSES and cell not in h:
                out.append(h[:i] + (cell,) + h[i + 1:])
    return out


TESTS = [
    Test('slide p. 324', args=(START, HOUSES), expected=17, show='hospitals (0,4) (3,9): 3 + 6 + 4 + 4'),
    Test('slide p. 326', args=(((0, 4), (3, 8)), HOUSES), expected=15, show='hospitals (0,4) (3,8)'),
    Test('slide p. 327', args=(((1, 4), (3, 8)), HOUSES), expected=13, show='hospitals (1,4) (3,8)'),
    Test('slide p. 328', args=(((1, 3), (3, 8)), HOUSES), expected=11, show='hospitals (1,3) (3,8)'),
    Test('slide p. 329', args=(((2, 2), (3, 8)), HOUSES), expected=9, show='hospitals (2,2) (3,8)'),
    Test('a single hospital', args=(((2, 5),), HOUSES), expected=17, show='one hospital at (2,5)'),
    Test('three hospitals on houses', args=(((0, 8), (1, 2), (3, 1)), HOUSES), expected=6,
         show='hospitals on three of the houses: only (4,6) pays'),
    _neighbors_case(START, 6),
    _neighbors_case(((1, 3), (3, 8)), 7),
    _neighbors_case(((2, 5), (2, 6)), 6),
    _neighbors_case(((0, 0), (4, 9)), 4),
]
