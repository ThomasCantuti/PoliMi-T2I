TITLE = 'Exam · Jul 2023 · Rank task environments by property'
DIFFICULTY = 'medium'
KIND = 'quiz'
TAGS = ['exam', 'Jul 2023', 'environment properties', 'observable', 'stochastic', 'static', 'continuous']

STATEMENT = r"""
*Written exam of 10 July 2023 — Problem 3 (Artificial Intelligence, 4 points).*

For each task-environment property, **rank** the example task environments from the one that **most** satisfies the
property to the one that **least** satisfies it. Lay out any assumptions you make to reach your conclusions.

- **Fully observable:** driving; document classification; tutoring a high-school student in calculus; skin cancer
  diagnosis from images.
- **Continuous:** driving; spoken conversation; written conversation; climate engineering by stratospheric aerosol
  injection.
- **Stochastic:** driving; sudoku; poker; soccer.
- **Static:** chat room; checkers; tax planning; tennis.

The properties are not yes/no here: the question asks *how much* each environment has them. The ranking is graded
on its motivation, so the model answers below matter as much as the order.
"""

QUESTIONS = [
    {
        'q': '**Fully observable**: from most to least.',
        'options': [
            'document classification > skin cancer diagnosis from images > driving > tutoring',
            'skin cancer diagnosis > document classification > tutoring > driving',
            'driving > document classification > skin cancer diagnosis > tutoring',
            'tutoring > document classification > driving > skin cancer diagnosis',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Document classification is observable: the correct class depends almost entirely '
                   'on the visible text. Skin cancer diagnosis is based on the lesion image, but other relevant factors '
                   '(history, other tests) are not in it. Driving relies on what we see, but other vehicles\' intentions '
                   'and hidden obstacles are not observable. Tutoring is the least observable: the student\'s '
                   'understanding cannot be seen and must be inferred from clues" (official answer).',
    },
    {
        'q': '**Continuous**: from most to least.',
        'options': [
            'climate engineering > driving > spoken conversation > written conversation',
            'driving > climate engineering > written conversation > spoken conversation',
            'spoken conversation > climate engineering > driving > written conversation',
            'climate engineering > spoken conversation > written conversation > driving',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Climate engineering manages only continuous quantities (amounts, concentrations, '
                   'temperatures, time). Driving has mainly continuous controls (steering, speed) but also discrete '
                   'elements (turn signal, lights) and discrete decisions (change lane, take an exit). Spoken conversation '
                   'is made of discrete words produced with a continuous control (volume, pitch, speed). Written '
                   'conversation lacks even that: it is a sequence of discrete symbols" (official answer).',
    },
    {
        'q': '**Stochastic**: from most to least.',
        'options': [
            'poker > soccer > driving > sudoku',
            'soccer > poker > sudoku > driving',
            'driving > poker > soccer > sudoku',
            'poker > driving > sudoku > soccer',
        ],
        'answer': 0,
        'explain': '**Model answer:** "In poker almost everything is determined by the cards dealt, which is entirely '
                   'random from the players\' viewpoint. Soccer and driving have fairly deterministic elements but also '
                   'stochastic ones (outcome of a tackle, a tyre puncture); a driving plan is easier to predict than the '
                   'next state of a soccer match, so soccer is more stochastic. Sudoku is completely deterministic" '
                   '(official answer). Remember: from a single agent\'s point of view the unpredictable moves of other '
                   'agents also count as uncertainty.',
    },
    {
        'q': '**Static**: from most to least.',
        'options': [
            'tax planning > checkers > chat room > tennis',
            'checkers > tax planning > tennis > chat room',
            'tax planning > chat room > checkers > tennis',
            'chat room > checkers > tax planning > tennis',
        ],
        'answer': 0,
        'explain': '**Model answer:** "Tax planning is based on a deadline and on what happened in the previous year: '
                   'little changes while you deliberate. In checkers the state does not change until the opponent moves '
                   '(static without a clock). A chat room is fairly real-time, since it is not polite to leave people '
                   'waiting, but not as real-time as tennis, where the ball keeps moving while you decide" (official '
                   'answer).',
    },
    {
        'q': 'The exam asks to "lay out any assumptions". Which assumption could legitimately **change** one of the '
             'rankings above?',
        'options': [
            'Checkers played with a clock becomes semidynamic: the board does not change while you think, but your '
            'score (time) does — so it would move towards chat room in the static ranking',
            'Poker becomes deterministic if the rules are fixed',
            'Sudoku becomes stochastic if the puzzle is hard',
            'Document classification becomes partially observable if documents are long',
        ],
        'answer': 0,
        'explain': 'A clock is the classic example of a **semidynamic** environment (AIMA Fig. 2.6: chess with a clock). '
                   'Fixed rules do not make a card game deterministic (the deal is random), and difficulty or length do '
                   'not change observability or determinism. Writing such assumptions explicitly is what turns a '
                   'debatable ranking into a correct answer.',
    },
]
