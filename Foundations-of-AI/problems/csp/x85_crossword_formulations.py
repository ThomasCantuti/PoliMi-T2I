TITLE = 'Exam · Aug 2022 · Crossword as a CSP: word variables vs cell variables'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Aug 2022', 'formulation', 'degree heuristic', 'MRV', 'AC-3', 'non-binary constraints']

STATEMENT = r"""
*Written exam of 30 August 2022 — Constraint Satisfaction Problems (8 points).*

Fill the crossword below with words of a dictionary (ant, big, bus, car, has, book, buys, hold, lane, year, beast,
ginger, search, symbol, syntax, …). $W_n$ = number of words of length $n$ in the dictionary.

```text
      c0  c1  c2  c3  c4
 r0  [1 ][  ][2 ]
 r1  [  ]####[  ]
 r2  [3 ][  ][  ][  ]
 r3  [  ]    [  ]
 r4          [4 ][  ][  ]
 r5          [  ]
```

Words: **1H** = r0, c0–c2 (3 letters); **1V** = c0, r0–r3 (4); **2V** = c2, r0–r5 (6); **3H** = r2, c0–c3 (4);
**4H** = r4, c2–c4 (3). 15 white cells. Two formulations: **(a)** each word slot is a variable; **(b)** each cell
is a variable.

1. Describe, informally but precisely, the domains and the constraints in case (a) and in case (b).
2. Number of variables, size of the domains, number of constraints in (a) and (b).
3. Which variable does backtracking choose first with the **degree** heuristic, and with **MRV**, in (a) and (b)? Why?
4. Could arc consistency reduce the initial domains in (a) and in (b)? Why?
"""

QUESTIONS = [
    {
        'q': 'Case (a), one variable per word slot. Which description is right?',
        'options': [
            'Domain of each slot = the dictionary words of the slot\'s length; one binary constraint per crossing: the '
            'shared cell gets the same letter (e.g. 1st letter of 1H = 1st letter of 1V, 3rd letter of 1H = 1st letter of 2V)',
            'Domain = the whole dictionary; constraints: crossing words must be different',
            'Domain = the 26 letters; one constraint per word: the letters form a dictionary word',
            'Domain = the words of the right length; constraints: all words must be different (Alldiff)',
        ],
        'answer': 0,
        'explain': '**Model answer:** *Variables 1H, 1V, 2V, 3H, 4H; D(1H) = 3-letter words, D(1V) = 4-letter words, '
                   'D(2V) = 6-letter words, D(3H) = 4-letter words, D(4H) = 3-letter words (the length is a unary '
                   'constraint folded into the domain). Constraints: crossing words agree on the shared cell, e.g. '
                   'letter(1, 1H) = letter(1, 1V), letter(3, 1H) = letter(1, 2V), …* Option 3 is case (b).',
    },
    {
        'q': 'Case (b), one variable per cell. Which description is right?',
        'options': [
            'Domain = 26 letters; binary constraints between adjacent cells',
            'Domain = 26 letters; one constraint per word slot, involving all its cells: the sequence of letters must be '
            'a dictionary word (e.g. word(cell1, cell2, cell3) ∈ dictionary)',
            'Domain = the dictionary; one constraint per cell',
            'Domain = 26 letters; no constraints are needed, the dictionary is checked at the end',
        ],
        'answer': 1,
        'explain': '**Model answer:** *Each cell has the alphabet as domain; there is one constraint per word slot, over '
                   'the 3, 4 or 6 cells of the slot, requiring that they spell a word of the dictionary.* These '
                   'constraints are **not binary** (arity = word length).',
    },
    {
        'q': 'Number of variables, domain sizes and number of constraints:',
        'options': [
            '(a) 5 variables, |D| = W3, W4, W6, W4, W3, 5 constraints; (b) 15 variables, |D| = 26, 5 constraints',
            '(a) 5 variables, |D| = 26, 5 constraints; (b) 15 variables, |D| = W1, 5 constraints',
            '(a) 5 variables, 10 constraints; (b) 15 variables, 15 constraints',
            '(a) 15 variables; (b) 5 variables',
        ],
        'answer': 0,
        'explain': '**Model answer:** *(a) 5 variables (the 5 words to fill), with |D(1H)| = W3, |D(1V)| = W4, '
                   '|D(2V)| = W6, |D(3H)| = W4, |D(4H)| = W3, and 5 constraints (the 5 intersections). (b) 15 variables '
                   '(the 15 cells), |D| = 26 each, and 5 constraints (the 5 words to complete).* '
                   '(a) 5 slots; the 5 constraints are the 5 crossings (1H–1V, 1H–2V, 1V–3H, 2V–3H, 2V–4H). '
                   '(b) 15 cells with 26 letters each; the 5 constraints are the 5 words to complete. The two '
                   'formulations swap roles: the crossings are constraints in (a) and shared variables in (b).',
    },
    {
        'q': 'First variable chosen with the **degree** heuristic (constraints with unassigned variables)?',
        'options': [
            '(a) 2V, involved in 3 constraints; (b) any of the 5 crossing cells, involved in 2 constraints (the others in 1)',
            '(a) 1H, the first in the grid; (b) cell 1',
            '(a) any variable, all have 2 constraints; (b) any cell',
            '(a) 4H, the shortest word; (b) the cells of 2V',
        ],
        'answer': 0,
        'explain': '**Model answer:** *(a) 2V, because it crosses 1H, 3H and 4H (3 constraints); (b) any of the 5 cells '
                   'where two words cross, because each belongs to 2 word constraints, while the other cells belong to 1.* '
                   'Precision: in (a) 1H, 1V, 3H have 2 constraints and 4H only 1 (it crosses only 2V); the official '
                   'solution says "the other variables are involved in 2 constraints", which is not exact for 4H.',
    },
    {
        'q': 'First variable chosen with **MRV**?',
        'options': [
            '(a) the slot whose length n has the smallest W_n (ties possible, e.g. 1H and 4H both have W3); (b) any cell: '
            'all domains have 26 letters',
            '(a) always 2V, the longest word; (b) cell 1',
            '(a) and (b): any variable, MRV only works after the first assignment',
            '(a) the slot with the largest W_n',
        ],
        'answer': 0,
        'explain': '**Model answer:** *(a) the variable whose domain is smallest, i.e. the slot of the length n with the '
                   'minimum W_n; (b) any variable, since all the domains have the same size (26).* '
                   'MRV = fewest remaining values. In (a) the domain size of a slot of length n is W_n, so it depends on the '
                   'dictionary; in (b) all domains are equal (26) and MRV gives no information at the start — the degree '
                   'heuristic is the useful tie-breaker there.',
    },
    {
        'q': 'Could **arc consistency (AC-3)** reduce the initial domains?',
        'options': [
            'Yes in (a): e.g. a 3-letter word for 1H whose first letter starts no 4-letter word is removed by 1H → 1V; '
            'in (b) AC-3 does not apply, the constraints are not binary',
            'No in both cases: AC-3 only removes values after an assignment',
            'Yes in both cases, in the same way',
            'No in (a), because the constraints are equalities; yes in (b)',
        ],
        'answer': 0,
        'explain': '**Model answer:** *In (a) the constraints are binary, so AC-3 applies and can delete words that have no '
                   'compatible word in a crossing slot. In (b) the constraints involve 3–6 cells: AC-3, as defined in the '
                   'course, works on binary constraints (arcs between two variables), so it cannot be applied directly.* '
                   'AC-3 runs on the initial domains too (the slides apply it before any assignment, p. 304). Generalized '
                   'arc consistency for n-ary constraints exists in AIMA, but it is beyond the course.',
    },
]
