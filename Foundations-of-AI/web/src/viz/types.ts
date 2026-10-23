// Contract shared by every visualizer module in src/viz/ (see README.md).

export type VizMode = 'explore' | 'predict';

export interface VizResult {
  correct: number; // predictions right on the first try
  total: number;   // predictions asked
}

export interface VizOptions {
  mode?: VizMode;
  onDone?: (result: VizResult) => void; // predict mode: called once at the end
  onEvent?: (text: string) => void;     // one plain-text line per step (forwarded to the LLM tutor)
}

export interface VizInstance {
  destroy(): void;
}

export interface Preset<C> {
  name: string;
  topic?: string; // topic id from content/topics.json
  config: C;
}

export interface VizModule<C = unknown> {
  PRESETS: Preset<C>[];
  mount(el: HTMLElement, config: C, opts?: VizOptions): VizInstance;
}
