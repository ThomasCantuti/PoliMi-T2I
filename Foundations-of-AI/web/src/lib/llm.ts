// Local LLM client: Ollama native API, or any OpenAI-compatible server
// (llama.cpp's llama-server, mlx_lm.server, LM Studio…). Everything stays on localhost.
import { create } from 'zustand';
import { useStore, type LlmSettings } from './store';

const PREFERRED = [/qwen3\.5:9b/i, /qwen3\.5/i, /gpt-oss/i, /qwen3/i, /gemma/i];

interface LlmStatus {
  online: boolean;
  models: string[];
  caps: Record<string, string[]>;
  error: string;
}
export const useLlm = create<LlmStatus>(() => ({ online: false, models: [], caps: {}, error: '' }));

const base = (s: LlmSettings) => s.url.replace(/\/+$/, '');

export async function ping(): Promise<void> {
  const s = useStore.getState().llm;
  try {
    const signal = AbortSignal.timeout(3000);
    let models: string[];
    if (s.provider === 'ollama') {
      const j = await fetch(base(s) + '/api/tags', { signal }).then(r => r.json());
      models = j.models.map((m: { name: string }) => m.name);
    } else {
      const j = await fetch(base(s) + '/models', { signal }).then(r => r.json());
      models = j.data.map((m: { id: string }) => m.id);
    }
    if (!s.pinned || !models.includes(s.model)) {
      const pick = PREFERRED.map(re => models.find(m => re.test(m))).find(Boolean) ?? models[0] ?? '';
      if (pick !== s.model) useStore.getState().setLlm({ model: pick });
    }
    const model = useStore.getState().llm.model;
    const caps = { ...useLlm.getState().caps };
    if (s.provider === 'ollama' && model && !caps[model]) {
      try {
        const j = await fetch(base(s) + '/api/show', { method: 'POST', body: JSON.stringify({ model }) }).then(r => r.json());
        caps[model] = j.capabilities ?? [];
      } catch { caps[model] = []; }
    }
    useLlm.setState({ online: true, models, caps, error: '' });
  } catch (e) {
    useLlm.setState({ online: false, models: [], error: String((e as Error).message ?? e) });
  }
}

export function canThink(): boolean {
  const s = useStore.getState().llm;
  return s.provider !== 'ollama' || (useLlm.getState().caps[s.model] ?? []).includes('thinking');
}

export interface Delta { content: string; thinking: string }
export interface WireMsg { role: 'system' | 'user' | 'assistant'; content: string }

async function* lines(body: ReadableStream<BufferSource>): AsyncGenerator<string> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i: number;
    while ((i = buf.indexOf('\n')) >= 0) {
      const l = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (l) yield l;
    }
  }
  if (buf.trim()) yield buf.trim();
}

export async function* chat(messages: WireMsg[], signal: AbortSignal): AsyncGenerator<Delta> {
  const s = useStore.getState().llm;
  if (!s.model) throw new Error('No model selected.');
  if (s.provider === 'ollama') {
    const body: Record<string, unknown> = {
      model: s.model, messages, stream: true,
      options: { num_ctx: s.ctx, temperature: s.temperature },
    };
    if (canThink()) body.think = s.think;
    const r = await fetch(base(s) + '/api/chat', { method: 'POST', body: JSON.stringify(body), signal });
    if (!r.ok || !r.body) throw new Error(`${r.status} ${await r.text()}`);
    for await (const line of lines(r.body)) {
      const j = JSON.parse(line);
      if (j.error) throw new Error(j.error);
      yield { content: j.message?.content ?? '', thinking: j.message?.thinking ?? '' };
    }
    return;
  }
  const r = await fetch(base(s) + '/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ model: s.model, messages, stream: true, temperature: s.temperature }),
  });
  if (!r.ok || !r.body) throw new Error(`${r.status} ${await r.text()}`);
  for await (const line of lines(r.body)) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (data === '[DONE]') return;
    const d = JSON.parse(data).choices?.[0]?.delta ?? {};
    yield { content: d.content ?? '', thinking: d.reasoning_content ?? d.reasoning ?? '' };
  }
}

/** Some models inline their reasoning as <think>…</think>: split it out. */
export function splitThink(content: string, thinking = ''): { content: string; thinking: string } {
  const t = /<think>([\s\S]*?)(<\/think>|$)/.exec(content);
  if (t) return { content: content.replace(t[0], '').trim(), thinking: thinking + t[1] };
  return { content, thinking };
}

/** 'hf.co/unsloth/Qwen3-8B-GGUF:UD-Q4_K_XL' → 'Qwen3-8B' ; 'qwen3.5:9b' stays. */
export const prettyModel = (m: string) => m.split('/').pop()!.replace(/-GGUF.*$/i, '');
