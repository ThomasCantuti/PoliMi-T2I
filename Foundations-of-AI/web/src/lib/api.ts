import type { Catalog, RunResult } from './types';

const KIND_ORDER = { trace: 0, code: 1, quiz: 2 } as const;

export async function fetchCatalog(): Promise<Catalog> {
  const c: Catalog = await fetch('/api/catalog').then(r => {
    if (!r.ok) throw new Error(`server answered ${r.status}`);
    return r.json();
  });
  const t = (id: string) => c.topics.findIndex(x => x.id === id);
  c.problems.sort((a, b) => t(a.topic) - t(b.topic) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
    a.id.localeCompare(b.id, undefined, { numeric: true }));
  return c;
}

export async function runCode(id: string, code: string): Promise<RunResult> {
  try {
    const r = await fetch('/api/run', { method: 'POST', body: JSON.stringify({ id, code }) });
    return await r.json();
  } catch (e) {
    return { ok: false, error: `Could not reach the local server: ${(e as Error).message}`, results: [] };
  }
}

// Theory markdown, cached. `theoryNow` gives synchronous access for the tutor prompt.
const cache = new Map<string, Promise<string>>();
export const theoryNow: Record<string, string> = {};

export function fetchTheory(topic: string): Promise<string> {
  if (!cache.has(topic)) {
    cache.set(topic, fetch(`/content/${topic}.md`)
      .then(r => (r.ok ? r.text() : ''))
      .catch(() => '')
      .then(t => (theoryNow[topic] = t)));
  }
  return cache.get(topic)!;
}
