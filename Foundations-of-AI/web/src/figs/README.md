# Theory figures

A fenced block in `content/<topic>.md` mounts a figure right where it is written:

````md
```fig rl-qlearning
Text alternative: what the figure shows, with the key numbers (read by screen readers and the tutor; shown if the figure fails to load).
```
````

To embed an existing Playground preset instead (topics with a visualizer), name the visualizer and, on the first line,
the preset exactly as in its `PRESETS` (`figs/playground.ts` mounts it in explore mode):

````md
```viz gametree
Figure 6.5 – alpha-beta on the same tree
Text alternative.
```
````

Each figure is one module `web/src/figs/<name>.ts` (strict TS, no dependencies, plain DOM + inline SVG):

```ts
export function mount(el: HTMLElement, opts?: FigOptions): VizInstance   // FigOptions = { onEvent?(text) }
```

- `shell.ts` has the pieces: `card()` (header with tag + title, SVG, caption), `stepper()` (⏮ ◀ ▶ play, dots,
  ←/→/space/Home when the card has focus), `s()`/`label()`/`arrow()` for SVG, `md()` for captions (markdown + `$math$`).
- Kinds: **figure** (static: draw, set the caption), **stepper** (an array of `{ cap, group? }` frames plus a `show(frame)`
  that updates the SVG; frames in the same `group` share a run of dots), **interactive** (own controls, own caption),
  **simulation** (the algorithm runs live in a `requestAnimationFrame` loop with run/pause/speed, a live plot and sliders;
  `rl-navigation.ts`). `bar(card)` adds a control row, `slider(row, name, min, max, step, value, on)` a labelled range.
  Captions of simulations follow the *stage* of the run and change only when the stage changes.
- Numbers are **computed** from the rule (Q-learning update, CPTs, …), never typed by hand, so they cannot drift from the theory.
- Captions and interactions go to `opts.onEvent` (one line each); the Theory tab forwards them to the tutor.
- Styling: the `.fg-*` classes in `shell.ts` and the tokens of `web/src/styles/tokens.css`, so both themes work.
  Extra CSS goes through `style('<id>', css)` with a module prefix (`.ql-`, `.en-`…).

Preview: open the topic's Theory tab (`npm run dev`). Type-check: `npx tsc --noEmit`.
