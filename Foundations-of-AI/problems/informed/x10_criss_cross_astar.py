TITLE = 'Exam · Jan 2022 · Criss-Cross solitaire: admissible heuristic and one A* step'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Jan 2022', 'A*', 'admissible heuristic', 'misplaced tiles', 'relaxed problem']

STATEMENT = r"""
*Written exam of 25 January 2022 — Problem 1 (Search, 8 points), Questions 2–3.*

**Criss-Cross solitaire.** The board has 17 square cells: two 3 × 3 squares that **share one corner cell**
(the central cell). Initially the 8 other cells of the left square hold **white** tokens, the 8 other cells of
the right square hold **black** tokens, and the central cell is empty. Goal: **exchange** the two sets of tokens
with the minimum number of moves. A token moves either to an **adjacent** empty cell (cells are adjacent if they
share an edge, not just a corner) or **jumps over one adjacent token** (of any colour) into an empty cell. Every
move costs 1. As in the 8-puzzle, the official solution describes a move as a move of the **empty cell**
(MoveNE, …, JumpNW).

The exam draws the squares as diamonds. Rotated by 45° clockwise (NE → right, SE → down, SW → left, NW → up)
the board is a 5 × 5 grid where `·` is not a cell:

```text
   start            goal             configuration of Question 3 (its g is G)
 W W W · ·        B B B · ·                a=0 a=1 a=2 a=3 a=4
 W W W · ·        B B B · ·         b=0     B   B   B   ·   ·
 W W _ B B        B B _ W W         b=1     W   W   W   ·   ·
 · · B B B        · · W W W         b=2     W   _   B   B   W      _ = empty cell
 · · B B B        · · W W W         b=3     ·   ·   W   B   B      (a=2, b=2) = central cell
                                    b=4     ·   ·   B   W   W
```

- **Question 2.** Find a (non-trivial) **admissible** heuristic for A* and explain why it is admissible.
- **Question 3.** Use it to carry out **one step of A\*** from the configuration above, whose $g$ is $G$: draw the
  successors and their values of the evaluation function.
"""

QUESTIONS = [
    {
        'q': r'Question 2: which of these is a **non-trivial admissible** heuristic for the Criss-Cross solitaire?',
        'options': [
            r'$h$ = number of **misplaced tokens**: white tokens not in the right square and black tokens not in '
            r'the left square (a token on the central cell is misplaced)',
            r'$h$ = sum of the **Manhattan distances** of the tokens from their goal cells, as for the 8-puzzle',
            r'$h$ = twice the number of misplaced tokens, since every token must cross the central cell',
            r'$h(n) = 0$ for every $n$',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "$h$ = number of misplaced tokens (the 8-puzzle $h_1$). It is admissible '
                   r'because every move moves exactly one token, and every misplaced token must be moved at least '
                   r'once, so at least $h(n)$ moves (of cost 1) are needed: $h(n) \le h^*(n)$." It is the exact cost '
                   r'of the relaxed problem where a token can jump to any cell. $h = 0$ is admissible but trivial. '
                   r'The Manhattan distance is **not** admissible (next question), and doubling $h_1$ overestimates '
                   r'near the goal. Check: on the start state $h = 16$, the true cost is $h^* = 46$ (exhaustive search '
                   r'of all $17 \cdot \binom{16}{8} = 218\,790$ states), and $h \le h^*$ on every state.',
    },
    {
        'q': r'The official solution warns that **distance functions** (e.g. the Manhattan distance) are **not** '
             r'admissible here. Why?',
        'options': [
            'A **jump** moves a token by **two** cells with a single move of cost 1, so the distance can count 2 '
            'where the true cost is 1',
            'Tokens of the same colour are indistinguishable, so the distance is undefined',
            'The board is not a rectangle',
            'They are admissible: each move changes the distance of one token by at most 1',
        ],
        'answer': 0,
        'explain': r'**Model answer:** "Manhattan overestimates: a jump moves a token two cells at cost 1." Example: '
                   r'from the goal, let the black token at $(a,b) = (0,2)$ jump over $(1,2)$ into the central cell. '
                   r'From that state one jump back solves the puzzle ($h^* = 1$), but the black token is at Manhattan '
                   r'distance 2 from the only free goal cell: $h = 2 > h^*$. Halving it, '
                   r'$\lceil \text{Manhattan}/2 \rceil$, is admissible again: one move reduces the total distance by '
                   r'at most 2. The last option is the 8-puzzle argument, which fails because of jumps.',
    },
    {
        'q': r'Question 3: with misplaced tokens, what is $h$ of the configuration of Question 3?',
        'options': ['8', '9', '10', '16'],
        'answer': 1,
        'explain': r'Left square (central cell excluded): whites at $(0,1), (1,1), (2,1), (0,2)$ → **4** misplaced. '
                   r'Right square: blacks at $(3,2), (3,3), (4,3), (2,4)$ → **4**. The black token on the **central '
                   r'cell** is not in the left square → **1**. $h = 9$ (true cost: 23 moves).',
    },
    {
        'q': r'How many successors does that configuration have (moves of the empty cell)?',
        'options': ['4', '5', '6', '8'],
        'answer': 1,
        'explain': r'Empty cell at $(a,b) = (1,2)$. Move: NE → $(2,2)$, SW → $(0,2)$, NW → $(1,1)$ are cells; SE → '
                   r'$(1,3)$ is not. Jump (the cell in between must hold a token): NE → $(3,2)$ over $(2,2)$, NW → '
                   r'$(1,0)$ over $(1,1)$; SW → $(-1,2)$ and SE → $(1,4)$ are off the board. **5 successors**: '
                   r'MoveNE, MoveSW, MoveNW, JumpNE, JumpNW (official solution).',
    },
    {
        'q': r'One step of A*: the values $f = g + h$ of the successors MoveNE, MoveSW, MoveNW, JumpNE, JumpNW are:',
        'options': [
            r'$G{+}9,\; G{+}10,\; G{+}10,\; G{+}9,\; G{+}10$',
            r'$G{+}8,\; G{+}9,\; G{+}9,\; G{+}8,\; G{+}9$',
            r'$G{+}9,\; G{+}9,\; G{+}10,\; G{+}10,\; G{+}10$',
            r'$G{+}10$ for all of them',
        ],
        'answer': 0,
        'explain': r'**Model answer** (draw the root with 5 children, one per action): $g = G + 1$ for every child. '
                   r'MoveNE: the central black token goes into the left square → $h = 8$, $f = G + 9$. MoveSW and '
                   r'MoveNW move a white token inside the left square → $h = 9$, $f = G + 10$. JumpNE: the black token '
                   r'at $(3,2)$ jumps over the centre into the left square → $h = 8$, $f = G + 9$. JumpNW moves a '
                   r'black token inside the left square → $h = 9$, $f = G + 10$. The second option forgets the step '
                   r'cost in $g$.',
    },
    {
        'q': r'Is the misplaced-tokens heuristic also **consistent**?',
        'options': [
            r"Yes: a move costs 1 and moves one token, so $h$ changes by at most 1: $h(n) \le 1 + h(n')$",
            'No: a jump can fix two tokens at once',
            'Only if jumps are forbidden',
            'Consistency cannot be checked without computing $h^*$',
        ],
        'answer': 0,
        'explain': r'One move changes the cell of exactly **one** token (a jump does not remove or move the token '
                   r"jumped over), so at most one token changes from misplaced to placed: $h(n) - h(n') \le 1 = c$. "
                   r'Consistency is a local check on single moves; it implies admissibility, and A* graph search with '
                   r'it never needs to re-open a state.',
    },
]
