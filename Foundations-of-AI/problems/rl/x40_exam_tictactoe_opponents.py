TITLE = 'Exam · Jul 2025 · Minimax, Q-learning and MCTS: who wins at tic-tac-toe?'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Jul 2025', 'tic-tac-toe', 'Q-learning vs minimax']

STATEMENT = r"""
*Written exam of 8 July 2025 — Adversarial Search.*

We must compare how well different algorithms play tic-tac-toe. For each pair of algorithms A and B we run 1000
matches: in the first match A plays first, then B plays first, and so on, alternating. We record the percentage of
wins for A, for B, and of draws. For each comparison, explain what you would expect and sketch the performance plot.

This is the experiment of RL p. 61–73 (there the learner always plays second): reason with the same ideas, a
deterministic opponent makes the environment deterministic, a stochastic one does not.
"""

QUESTIONS = [
    {
        'q': 'Comparison #1: (A) Minimax vs (B) Minimax.',
        'options': [
            '50% wins each, since they alternate who plays first',
            '100% draws in every match: both are deterministic and optimal',
            'The player who moves first always wins',
            'Random outcomes, since the first move is random',
        ],
        'answer': 1,
        'explain': '**Model answer:** Minimax is deterministic and plays optimally, so the result is always the same, and tic-tac-toe with perfect play is a draw: the plot shows draws at 100% and wins at 0% for both, constant over the 1000 matches.',
    },
    {
        'q': 'Comparison #2: (A) Minimax vs (B) Q-learning (the learner starts from scratch).',
        'options': [
            'Q-learning wins most games from the start',
            'Minimax wins most games at first (Q-learning occasionally ties by chance); once Q-learning has learned a reply to Minimax\'s fixed strategy, 100% draws',
            'Always 100% draws',
            'The curves oscillate forever',
        ],
        'answer': 1,
        'explain': '**Model answer:** Minimax is deterministic and optimal, so initially it wins most games. Since it is deterministic, Q-learning only needs a policy against that specific strategy: it learns quickly (about 100 games in RL p. 64) and from then on every game is a draw. Minimax can never lose.',
    },
    {
        'q': 'Comparison #3: (A) Random Minimax vs (B) Q-learning. Random Minimax is optimal but, among moves with the same value, it chooses randomly.',
        'options': [
            'Exactly like comparison #2',
            'Random Minimax still wins most games for longer: the policy Q-learning must learn is more complex, so draws increase slowly',
            'Q-learning wins because Random Minimax makes mistakes',
            'Draws from the first game',
        ],
        'answer': 1,
        'explain': '**Model answer:** Random Minimax is optimal but stochastic, so the same board and move can lead to different replies: the Q-learner must learn a reply to every optimal line. Random Minimax keeps winning most games for longer and the percentage of draws increases slowly (about 5000 games to reach 100% in RL p. 67). Random Minimax never loses.',
    },
    {
        'q': 'Comparison #4: (A) Monte Carlo Tree Search with **one** playout vs (B) Minimax.',
        'options': [
            'MCTS wins, since it does not need an evaluation function',
            'About 50% each',
            'Minimax wins almost 100% of the matches; MCTS with one playout is basically a random player and only ties by chance',
            '100% draws',
        ],
        'answer': 2,
        'explain': '**Model answer:** with one playout MCTS runs a single simulation and then selects the only action it tried, so it is equivalent to a random player. Minimax wins almost 100% of the times, unless the random moves of MCTS happen to tie a game. MCTS plays well only with enough playouts.',
    },
    {
        'q': 'In comparison #2, why is it important that the opponent of the learner is deterministic?',
        'options': [
            'Q-learning only works in deterministic environments',
            'From the learner\'s point of view the opponent is part of the environment: a deterministic opponent makes the transitions deterministic, so each (state, action) always leads to the same next state',
            'A deterministic opponent plays worse',
            'It is not important',
        ],
        'answer': 1,
        'explain': 'The learner sees $s_t$, plays, and observes $s_{t+2}$ after the opponent\'s reply (RL p. 59–60). Q-learning also works in stochastic environments (it estimates expectations), but it needs many more games.',
    },
]
