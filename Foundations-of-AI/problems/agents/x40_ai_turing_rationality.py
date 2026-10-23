TITLE = 'Exam · Short questions on AI, the Turing test and rationality (2022–2026)'
DIFFICULTY = 'easy'
KIND = 'quiz'
TAGS = ['exam', 'Turing test', 'imitation game', 'Dartmouth', 'rationality', 'partial observability']

STATEMENT = r"""
Introductory questions from the written exams of **17 February 2022** (Problem 1, 3 points), **30 August 2022**
(Problem 1, 4 points), **10 July 2023** (Problem 2, 4 points), **8 July 2025** (Problem 1, Question 1) and
**6 February 2026** (Problem 1, Question 1). Material: slides p.3–30 (what is AI, Turing test and the original
imitation game, Dartmouth 1956, rational agents).

These answers are short texts: after each question, read the **model answer** (what to write).
"""

QUESTIONS = [
    {
        'q': '(Feb 2022) You present your AI startup to investors. One asks: *"AI looks like just algorithms and data '
             'structures, no different from traditional software engineering or matrix multiplication. Where is the '
             'intelligence?"* Which answer (in at most three short statements) is the right one?',
        'options': [
            '(1) We use the "acting" definition of AI: a system is intelligent if its **behaviour** is rational / '
            'recognized as intelligent. (2) Intelligence is judged on what the system does, not on how it is '
            'implemented. (3) So it can be built from algorithms, data structures or matrix multiplications (deep '
            'learning): what matters is whether its behaviour is intelligent',
            'The intelligence is in the neural networks, which work like the human brain',
            'The investor is right: AI is only marketing for software engineering',
            'The intelligence comes from the large amount of data, not from the algorithms',
        ],
        'answer': 0,
        'explain': '**Model answer:** stress two points (official answer). First, state the definition of AI in use: '
                   'the course takes the *acting* view (systems that act rationally / that show a behaviour we recognize '
                   'as intelligent, slides p.7–13). Second, under this view we do not consider **how** the behaviour is '
                   'implemented but **whether** it is intelligent: a system may well be a series of matrix '
                   'multiplications. Claims about "working like the brain" mix up the *thinking humanly* approach and do '
                   'not answer the question.',
    },
    {
        'q': '(Aug 2022) To distinguish humans from machines, students play three **chess** games in an isolated room '
             'against opponents that are either humans of different skill or a program at a random skill level; they '
             'can only move pieces. Is this a good setup?',
        'options': [
            'No: the only information exchanged is the moves, and with random skill levels nothing in a move '
            'distinguishes a human from a program. Turing\'s test relies on free conversation (complex, unstructured '
            'information). Improve it with a chat about the game, or a game with richer interaction (auctions in '
            'Monopoly, negotiations in Diplomacy)',
            'Yes: chess requires intelligence, so a program that plays well passes the test',
            'Yes, provided the program always plays at the maximum level',
            'No: the test should be done with the student able to see the opponent',
        ],
        'answer': 0,
        'explain': '**Model answer:** "The setup is inadequate: the exchanged information is just the move. Since skill '
                   'levels are random (a strong fast human, a weak slow program), no feature allows us to distinguish '
                   'humans from machines. The Turing test involves a dialogue, an exchange of complex and unstructured '
                   'information; chess moves are too elementary. Improvement: add a chat where players talk freely about '
                   'the game, or use a game whose actions have an identifiable human component (Monopoly auctions, '
                   'Diplomacy discussions)" (official answer). Seeing the opponent would defeat the purpose: the test '
                   'hides the physical appearance on purpose.',
    },
    {
        'q': '(Jul 2023) Describe Turing\'s **original imitation game** and how the **Turing test** was derived from it.',
        'options': [
            'Three players: a man (A), a woman (B) and an interrogator (C) in another room, communicating only by '
            'written messages. C must find out which one is the woman; A tries to deceive C, B tries to help. Turing '
            'then replaces A with a machine: if C is wrong as often as with the man, the machine "thinks". The '
            'Turing test keeps the idea: an interrogator chats with a human and a machine and must tell which is the '
            'machine',
            'A computer plays chess against a human; if the human loses, the computer is intelligent',
            'A machine must imitate the voice of a person well enough to fool a listener on the phone',
            'Two machines talk to each other and a human judges which one is more intelligent',
        ],
        'answer': 0,
        'explain': '**Model answer** (slides p.11–12; the exam gives no written solution for this question): describe '
                   'the three roles of the original game (man A, woman B, interrogator C; both A and B claim to be the '
                   'woman; typed answers so that voice and appearance do not help), then Turing\'s move (1950): replace '
                   'A with a computer and ask whether the interrogator decides wrongly as often as before. The standard '
                   'Turing test simplifies it to "human or machine?": a machine passes if it reaches a human-like '
                   'performance sufficient to trick a human interrogator. It is the *acting humanly* approach to AI.',
    },
    {
        'q': '(Jul 2025) Why does the **workshop at Dartmouth in the summer of 1956** represent a milestone for the '
             'field?',
        'options': [
            'Because the term **"Artificial Intelligence"** appears for the first time, in the proposal written for '
            'the workshop (McCarthy, Minsky, Shannon, Rochester), with the conjecture that every aspect of learning '
            'or intelligence can be described so precisely that a machine can simulate it',
            'Because the first program to beat a chess world champion was presented there',
            'Because Turing proposed the imitation game there',
            'Because the first neural network was trained there',
        ],
        'answer': 0,
        'explain': '**Model answer:** "In the proposal submitted for the Dartmouth workshop (1955–56, by J. McCarthy, M. '
                   'Minsky, C. Shannon and N. Rochester) the term \'Artificial Intelligence\' appears for the first '
                   'time: it is considered the birth of the field" (official answer, slides p.14). Turing\'s paper is '
                   'from 1950; Deep Blue beat Kasparov in 1997.',
    },
    {
        'q': '(Feb 2026) Can an agent that senses only **partial information** about the state of the environment behave '
             '**perfectly rationally**?',
        'options': [
            'Yes: rationality is defined with respect to the percept sequence and the knowledge the agent has, not '
            'to the full state. E.g. the environment can provide more information than what is needed: a robotic '
            'chess player only needs the board, not the lighting or the sounds',
            'No: a rational agent must know the complete state to choose the best action',
            'No: partial observability always makes an agent irrational',
            'Only if the environment is also deterministic',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Yes, it can. The environment can provide more information than what is needed to '
                   'act rationally: a robotic chess player should only care about the chessboard, not the lighting or '
                   'the sounds" (official answer). A second argument: a rational agent maximizes the **expected** '
                   'performance *given its percept sequence and knowledge*, so even when the missing information matters '
                   'it can still be perfectly rational (rational ≠ omniscient). The same statement appears among the '
                   'true/false exercises of AIMA chapter 2 ("an agent that senses only partial information about the '
                   'state cannot be perfectly rational"): it is false.',
    },
]
