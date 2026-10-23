import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useStore, type LlmSettings } from '../lib/store';
import { useLlm, ping } from '../lib/llm';
import { Markdown } from './Markdown';

const HELP = `**Ollama** (recommended): \`http://127.0.0.1:11434\` · start with \`open -a Ollama\`
**llama.cpp**: \`llama-server -hf unsloth/Qwen3.5-9B-GGUF:Q4_K_M --port 8080\` → OpenAI-compatible, \`http://127.0.0.1:8080/v1\`
**MLX**: \`mlx_lm.server --model mlx-community/Qwen3.5-9B-4bit --port 8080\` → OpenAI-compatible, \`http://127.0.0.1:8080/v1\``;

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const llm = useStore(s => s.llm);
  const models = useLlm(s => s.models);
  const [f, setF] = useState<LlmSettings>(llm);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const set = <K extends keyof LlmSettings>(k: K, v: LlmSettings[K]) => setF(x => ({ ...x, [k]: v }));
  const field = 'grid gap-1 text-[12.5px] text-muted';

  return (
    <dialog ref={ref} onClose={onClose}
      className="m-auto w-[min(520px,92vw)] rounded-2xl border border-line bg-panel p-0 text-fg shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm">
      <form method="dialog" className="grid gap-4 p-5" onSubmit={() => {
        let url = f.url.trim();
        if (f.provider !== llm.provider && url === llm.url) url = f.provider === 'ollama' ? 'http://127.0.0.1:11434' : 'http://127.0.0.1:8080/v1';
        useStore.getState().setLlm({ ...f, url, pinned: f.pinned || f.model !== llm.model });
        ping();
      }}>
        <h3 className="flex items-center gap-2 text-[16px] font-semibold"><SlidersHorizontal size={17} /> Tutor settings</h3>
        <label className={field}>Runtime
          <select value={f.provider} onChange={e => set('provider', e.target.value as LlmSettings['provider'])}>
            <option value="ollama">Ollama (recommended)</option>
            <option value="openai">OpenAI-compatible (llama.cpp / MLX / LM Studio)</option>
          </select>
        </label>
        <label className={field}>Server URL<input type="text" value={f.url} onChange={e => set('url', e.target.value)} /></label>
        <label className={field}>Model
          <select value={f.model} onChange={e => set('model', e.target.value)}>
            {[...new Set([f.model, ...models])].filter(Boolean).map(m => <option key={m}>{m}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={field}>Context window (tokens)
            <input type="number" min={2048} step={1024} value={f.ctx} onChange={e => set('ctx', +e.target.value || 16384)} />
          </label>
          <label className={field}>Temperature
            <input type="number" min={0} max={1.5} step={0.1} value={f.temperature} onChange={e => set('temperature', +e.target.value)} />
          </label>
        </div>
        <Markdown text={HELP} className="rounded-xl bg-panel-2 p-3 text-[12px] text-fg-2 [&_p]:my-0 [&_p]:leading-7" />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" className="btn primary">Save</button>
        </div>
      </form>
    </dialog>
  );
}
