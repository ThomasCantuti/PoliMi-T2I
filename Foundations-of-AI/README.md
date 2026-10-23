# AlgoDojo · Foundations of AI

An offline, LeetCode-style app to **understand** (not memorize) the algorithms of the course
*Foundations of Artificial Intelligence* (Amigoni & Lanzi, AIMA 4th ed.), with a tutor LLM running on your Mac.

```bash
./start.sh          # starts Ollama + the app, opens http://127.0.0.1:8765
```

Requirements: macOS, Python 3, Node.js (the first run installs and builds the web app). [Ollama](https://ollama.com)
is only needed for the tutor. The course PDFs (slides, `exams/`, `exercises.pdf`) are not in the repository: the app
does not need them, they were only the sources of the problems.

## How to learn with it

Every topic follows the same loop:

1. **Theory**: short notes in the course notation, with the exam traps (`> Exam trap:` boxes).
2. **Playground**: step through the algorithm on the slides' examples (← / → / space).
3. **Trace problems** (*Predict* mode): before each step is revealed, *you* pick it: the next node A* expands,
   the value minimax backs up, the domains forward checking prunes, the child UCB1 selects… This is exactly what the exam asks.
4. **Code problems**: implement it in Python with the course's `aima` helpers, run the tests (⌘↵), then read *Why it works*.
5. **Quizzes**: properties, complexities, theorems.
6. **Exam practice**: at the end of each problem list, the problems titled **"Exam · <month year> · …"** are the
   questions of the past written exams (2022–2026), with the official answer and a *Model answer* (what to write).
   Where an official solution is wrong or imprecise, the explanation says so. "Exercise book N.N" problems come
   from the exercise book.
7. **Tutor** (⌘J): a local LLM that sees the page, your code, your failing tests and the visualizer steps.
   It gives hints instead of answers unless you explicitly ask for the solution. *Think* mode = slower but deeper.

Other shortcuts: ⌘K search (try "Exam") · progress, drafts and chats are saved in `~/.algodojo/state.json` (copy it to back up).

## Topics

| # | topic | source of the theory |
|---|---|---|
| 1–8 | Agents, Formulation, Uninformed, Informed, CSP, Local search, Adversarial, MCTS & bandits | slides `Foundations Of AI.pdf` p. 1–478 |
| 9 | Learning to Search and Play (reinforcement learning, Q-learning) | slides `FAI2026-09-LearningToSearchAndPlay.pdf` ("RL p.") |
| 10–12 | Propositional logic, Classical planning, Uncertainty & Bayesian networks | AIMA sections of the course calendar + exam solutions (**no slides yet**: to be aligned when they are published) |

Topics 9–12 have no visualizer: theory, code problems and quizzes only. Not covered yet: the AI philosophy/ethics lecture.

## Before the flight ✈️ (checklist)

- [ ] `ollama list` shows **`qwen3.5:9b`** (the recommended tutor, 6.6 GB). If the download isn't finished:
      `ollama pull qwen3.5:9b` (it resumes). Fallback already installed: **Qwen3-8B** (picked automatically).
- [ ] `./start.sh` works, and asking the tutor something gets an answer.
- [ ] Plug in the charger if you can: the LLM uses the GPU (and the battery) while it answers.

## Why these choices (MacBook Pro M5, 24 GB)

| Choice | Why |
|---|---|
| **Ollama** | Already installed, one command, native Apple-Silicon backends, model registry, keeps the model warm. |
| **Qwen3.5-9B** (Q4, ~7 GB) | Best quality/speed trade-off that leaves plenty of RAM for the browser; 256K context, optional thinking mode. 27B+ models don't fit comfortably in 24 GB of unified memory. |
| vLLM | Built for NVIDIA servers; not a good fit for a Mac. |
| llama.cpp / MLX | Also supported: in Tutor ⚙︎ settings choose *OpenAI-compatible* and point it at `llama-server` or `mlx_lm.server` (commands are shown there). |

## Project layout

```
start.sh              launcher
server.py             stdlib HTTP server: serves web/dist, runs your code (POST /api/run)
runner/               aima.py (course helpers), harness.py (test runner), catalog.py, <topic>_lib.py
problems/<topic>/     one Python file per problem (NN_* code, qNN_* quiz, tNN_* trace,
                      wNN_* exercise-book exercise, xNN_* exam-style: titles start with "Exam ·")
content/<topic>.md    theory pages
exams/<year>/         past written exams with official solutions (_A, _B… = versions of the same exam)
*.pdf                 course slides, the RL slides, exercises.pdf (exercise book), FAI_Calendar.pdf
web/                  Vite 8 + React 19 + TypeScript 7 + Tailwind 4 frontend
  src/viz/*.ts        framework-agnostic visualizers (search, csp, local, gametree, mcts, bandit)
```

Development: `cd web && npm run dev` (http://127.0.0.1:5173, needs `python3 server.py` running for the API),
`npm run build` to rebuild `web/dist`, `npx tsc --noEmit` to type-check,
`python3 runner/catalog.py` to check that every reference solution passes its tests.

Adding a problem = adding a file in `problems/<topic>/` (copy an existing one); no rebuild needed.
