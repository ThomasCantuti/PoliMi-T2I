// Progress, drafts, chats and settings – saved by the local server in ~/.algodojo/state.json,
// so they survive a cleared or different browser. localStorage is only read to migrate older saves.
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { ChatMsg } from './types';

let pending: string | null = null, saving = false;
let readOnly = false; // the server was down at load: never overwrite its file with stale data

async function save() {
  if (saving) return;
  saving = true;
  while (pending !== null) { // one request at a time, always the latest state
    const body = pending;
    pending = null;
    try {
      const r = await fetch('/api/state', { method: 'PUT', body });
      if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    } catch (e) { console.warn('AlgoDojo: progress not saved', e); }
  }
  saving = false;
}

const serverStorage: StateStorage = {
  async getItem(name) {
    try {
      const r = await fetch('/api/state');
      if (!r.ok) throw new Error(String(r.status));
      const saved = await r.text();
      if (saved !== 'null') return saved;
      const old = localStorage.getItem(name);
      if (old) { pending = old; save(); } // first run: move the browser's copy to the server
      return old;
    } catch { // must not throw, or the app never finishes loading
      readOnly = true;
      return localStorage.getItem(name);
    }
  },
  setItem(_, value) {
    if (readOnly) return;
    pending = value;
    save();
  },
  removeItem() {},
};

export type Provider = 'ollama' | 'openai';
export interface LlmSettings {
  provider: Provider;
  url: string;
  model: string;
  think: boolean;
  ctx: number;
  temperature: number;
  pinned: boolean; // the user picked the model explicitly: don't auto-switch
}
export const DEFAULT_LLM: LlmSettings = {
  provider: 'ollama', url: 'http://127.0.0.1:11434', model: '', think: false, ctx: 16384, temperature: 0.4, pinned: false,
};

interface Score { correct: number; total: number }

interface State {
  solved: Record<string, number>;
  attempts: Record<string, number>;
  code: Record<string, string>;
  scores: Record<string, Score>;
  hints: Record<string, number>;
  sawSolution: Record<string, boolean>;
  chats: Record<string, ChatMsg[]>;
  last: string | null;
  theme: 'dark' | 'light';
  sidebar: boolean;
  llm: LlmSettings;

  markSolved(id: string): boolean; // true the first time
  attempt(id: string): void;
  setCode(id: string, code: string): void;
  setScore(id: string, s: Score): void;
  revealHint(id: string): void;
  revealSolution(id: string): void;
  setChat(key: string, msgs: ChatMsg[]): void;
  setLast(id: string): void;
  toggleTheme(): void;
  toggleSidebar(): void;
  setLlm(patch: Partial<LlmSettings>): void;
}

export const useStore = create<State>()(persist((set, get) => ({
  solved: {}, attempts: {}, code: {}, scores: {}, hints: {}, sawSolution: {}, chats: {},
  last: null, theme: 'dark', sidebar: true, llm: DEFAULT_LLM,

  markSolved(id) {
    if (get().solved[id]) return false;
    set(s => ({ solved: { ...s.solved, [id]: Date.now() } }));
    return true;
  },
  attempt: id => set(s => ({ attempts: { ...s.attempts, [id]: (s.attempts[id] ?? 0) + 1 } })),
  setCode: (id, code) => set(s => ({ code: { ...s.code, [id]: code } })),
  setScore: (id, sc) => set(s => ({ scores: { ...s.scores, [id]: sc } })),
  revealHint: id => set(s => ({ hints: { ...s.hints, [id]: (s.hints[id] ?? 0) + 1 } })),
  revealSolution: id => set(s => ({ sawSolution: { ...s.sawSolution, [id]: true } })),
  setChat: (key, msgs) => set(s => ({ chats: { ...s.chats, [key]: msgs.slice(-40) } })),
  setLast: id => set({ last: id }),
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  toggleSidebar: () => set(s => ({ sidebar: !s.sidebar })),
  setLlm: patch => set(s => ({ llm: { ...s.llm, ...patch } })),
}), { name: 'algodojo:v2', storage: createJSONStorage(() => serverStorage) }));

export type ProblemStatus = 'solved' | 'tried' | 'new';
export const statusOf = (s: Pick<State, 'solved' | 'attempts'>, id: string): ProblemStatus =>
  s.solved[id] ? 'solved' : s.attempts[id] ? 'tried' : 'new';
