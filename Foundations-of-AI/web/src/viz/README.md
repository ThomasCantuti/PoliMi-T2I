# Visualizer contract (TypeScript)

The app is Vite 8 + React 19 + TypeScript 7 + Tailwind 4. Visualizers stay **framework-agnostic**:
each one is a single TypeScript module `web/src/viz/<name>.ts` (strict TS, no `any` unless unavoidable,
no runtime dependencies, plain DOM + inline SVG) implementing `VizModule` from `./types.ts`:

```ts
import type { Preset, VizInstance, VizOptions } from './types';

export interface SearchConfig { ... }                   // export your config type, documented
export const PRESETS: Preset<SearchConfig>[] = [ ... ]; // examples for the topic Playground (first = default)
export function mount(el: HTMLElement, config: SearchConfig, opts: VizOptions = {}): VizInstance { ... }
```

- `opts.mode`: `'explore'` (default) – free play: selectors, ⏮ back, ▶ step, ⏵ play/pause, reset, speed, and the
  data structures (frontier, explored, α/β, domains…). `'predict'` – trace exercise: the learner must PREDICT each
  step before it is revealed (click the node expanded next / type a value / pick pruned branches). Wrong → gentle
  shake + one-line reason; retry or reveal. Count first-try correct answers.
- `opts.onDone({correct, total})`: predict mode, called once when the trace is complete.
- `opts.onEvent(text)`: on every step, a one-line plain-text description
  ("Expanded B (g=3, h=4, f=7); frontier = [C:7, D:9]") — forwarded to the local LLM tutor as context.
- `el` is an empty `<div>` (any width ≥ 360px; height grows with content). `destroy()` must remove listeners/timers.

Styling: inject the module's CSS once (`<style id="viz-<name>-css">`), using only the CSS variables from
`web/src/styles/tokens.css` (`--panel`, `--panel-2`, `--border`, `--text`, `--muted`, `--accent`, `--ok`, `--bad`,
`--warn`, `--v-frontier`, `--v-explored`, `--v-current`, `--v-path`, `--v-pruned`, `--v-max`, `--v-min`,
`--v-chance`, `--radius`, `--mono`…) so light/dark themes work. Generic classes `.btn`, `.btn.primary`, `.btn.sm`,
`.chip`, `select`, `input` are already styled. Prefix your own classes (`.sv-…`, `.gt-…`) to avoid collisions.

Keyboard: `→` step, `←` back, `space` play/pause (only when focus is inside the visualizer).

Dev page (Vite dev server, hot reload): `http://127.0.0.1:5173/viz-dev.html?viz=search&preset=0&mode=predict`
Type-check: `cd web && npx tsc --noEmit`.
