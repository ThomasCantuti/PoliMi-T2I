TITLE = 'Exam · Short questions on modelling games: states, actions, tree size (2022–2025)'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'game formulation', 'complexity', 'Close-the-box', 'minimax']

QUESTIONS = [
    {
        'q': '*Feb 2022 (Q1).* Close-the-box: each player has her own box of tiles 2–12 (open or closed); players alternate; in her turn a player rolls two dice and closes the sum, or the two dice separately. Which data structure represents a **game state**?',
        'options': [
            'The open tiles of **both** players (two lists or sets of integers) and a flag telling whose turn it is',
            'Only the open tiles of the player to move',
            'The last roll of the dice',
            'The list of all moves played so far, with no board',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): two lists of integers with the open tiles of player #1 and player #2, plus a Boolean (or integer) for the player to move. If the tree is modelled with the chance node *before* the decision (dice rolled by a third party), the state must also store the last roll, so that MAX/MIN know which tiles they may close. The opponent\'s board must be in the state: it decides who finishes first, i.e. the terminal test and the utility.',
    },
    {
        'q': '*Jun 2022 (Q1).* A colleague says that Close-the-box does not require an adversarial search algorithm. What feature of adversarial search is **not** present in Close-the-box?',
        'options': [
            'Turn-taking: the players do not alternate',
            'Interaction: a player\'s actions never change the actions available to the other player (each closes tiles only in her own box)',
            'Chance: there are no random events',
            'A terminal test: the game may never end',
        ],
        'answer': 1,
        'explain': '**Model answer** (official): in adversarial games the actions of a player influence the set of actions available to the other player (chess, tic-tac-toe: you occupy or capture what the opponent could use). In Close-the-box the tiles player #1 closes have **no effect** on player #2\'s options, so there is nothing to "plan against": no MIN nodes are needed, and each player can just optimise her own sequence of turns (a single-agent stochastic problem: expectation over her own dice). The game is turn-taking and stochastic, so options 1 and 3 are false.',
    },
    {
        'q': '*Jun 2022 (Q2).* You must write `play_turn(state)` that plays the next turn of Close-the-box **without** adversarial search, with a non-trivial strategy. Which sketch is acceptable?',
        'options': [
            'Roll the two dice; list the legal closures (the sum, or the two dice separately); pick one with a heuristic, e.g. close two tiles when possible, otherwise one; if nothing can be closed, pass; return the new state',
            'Run minimax on the full game tree of both players and play the best move',
            'Close a random open tile, then roll the dice',
            'Always close the tile equal to the sum, without rolling',
        ],
        'answer': 0,
        'explain': '**Model answer** (official sketch): step 1 throw the dice; step 2 compute which tile combinations can be closed; step 3 apply your strategy (e.g. close as many tiles as possible: two tiles when possible, otherwise one; other reasonable heuristics: prefer the high tiles, which only few rolls can close); pass if nothing is legal; return the next state. The order roll → decide is essential (the second and fourth options ignore it; minimax is excluded by the question).',
    },
    {
        'q': '*Jun 2024 (Q1–Q2).* A 6×6 board game: players place discs of their colour on empty cells (first the 4 central cells, then the 12 around them, then the outer 20); black starts and players alternate. How do you represent states and actions?',
        'options': [
            'State: a 6×6 matrix (or a 36-vector) with 0 = empty, 1 = white, 2 = black; action: the coordinates of the cell where the player to move puts its disc',
            'State: the score of each player; action: +1 to the score',
            'State: the number of discs on the board; action: a colour',
            'State: the list of free cells only; action: a pair of cells',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): a vector or matrix with 36 positions, 0 = empty, 1 = white, 2 = black. An action is a position, e.g. (3, C); the colour follows from the player to move (which can itself be derived from the number of discs, since black moves first). The legal actions are the empty cells of the current ring (centre, then middle ring, then outer ring). The third and fourth options lose information needed to compute the final score.',
    },
    {
        'q': '*Jun 2024 (Q3).* How many nodes does minimax generate for this game (4 central cells, then 12, then 20)?',
        'options': [
            '$4! \\cdot 12! \\cdot 20!$ — of the order of $3 \\cdot 10^{28}$ complete games',
            '$36!$',
            '$3^{36}$',
            '$4 + 12 + 20 = 36$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): while the 4 central cells are being filled the players have 4, 3, 2, 1 actions ($4!$ sequences), then $12!$ for the middle ring and $20!$ for the outer one: $4!\\,12!\\,20! \\approx 2.8 \\cdot 10^{28}$. Precisely, this is the number of **leaves** (complete games); adding all the internal nodes, $\\sum_k$ (sequences of length $k$) $\\approx e \\cdot 4!\\,12!\\,20! \\approx 7.6 \\cdot 10^{28}$ — the same order of magnitude, so the official answer is fine as an estimate. $36!$ ignores the rings; $3^{36}$ counts board colourings (distinct states, at most), not tree nodes: minimax builds a **tree**, so the same position reached by different move orders is generated many times.',
    },
    {
        'q': '*Jun 2024 (Q4).* What is the space complexity of minimax for this game? Could it be exponential?',
        'options': [
            'Exponential, $O(b^m)$: minimax keeps the whole game tree in memory',
            'Linear in the depth, $O(bm)$ (or $O(m)$ generating one successor at a time): minimax is a depth-first search; here $m = 36$',
            'Constant: only the current board is stored',
            '$O(4!\\,12!\\,20!)$, the number of nodes',
        ],
        'answer': 1,
        'explain': '**Model answer** (official): minimax applies a depth-first search, so its space complexity is linear in the depth of the tree, $O(bm)$ — at most 36 levels, each holding at most 20 siblings — or $O(m)$ if successors are generated one at a time. Only the **time** is exponential (the number of nodes of the previous question).',
    },
    {
        'q': '*Feb 2025 (Q1).* Pursuit-evasion on a graph: the pursuer (MAX) starts at vertex a, the evader (MIN) at c; they move in turn to adjacent vertices. How do you represent the state, and what is $S_0$?',
        'options': [
            'The pair (pursuer\'s vertex, evader\'s vertex): $S_0 = (a, c)$; the player to move follows from the level (or is stored too)',
            'The pursuer\'s vertex only: $S_0 = a$',
            'The whole graph with the two tokens drawn on it, recopied at every node',
            'The distance between the players: $S_0 = 2$',
        ],
        'answer': 0,
        'explain': '**Model answer** (official): a pair of node labels with the positions of the pursuer and of the evader, $S_0 = (a, c)$. The graph never changes, so it does not belong in the state; the distance alone loses information (many positions have distance 2 but different futures) — it is what the **evaluation function** uses. Terminal test: both players on the same vertex. The tree and minimax values are in the Feb 2025 code problem.',
    },
]
