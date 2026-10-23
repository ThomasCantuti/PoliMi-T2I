import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Brain, Bug, CircleHelp, Lightbulb, Map, ScanEye, SendHorizontal, SlidersHorizontal, Sparkles, Square,
  Trash2, TriangleAlert, WifiOff, X, type LucideIcon,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { useLlm, ping, chat, canThink, splitThink, prettyModel, type WireMsg } from '../lib/llm';
import { useTutor, systemPrompt, quickActions, type QuickAction } from '../lib/tutor';
import type { ChatMsg } from '../lib/types';
import { Markdown } from './Markdown';
import { cn } from './ui';
import { SettingsDialog } from './SettingsDialog';

const QA_ICON: Record<QuickAction['icon'], LucideIcon> = {
  hint: Lightbulb, bug: Bug, review: ScanEye, idea: Sparkles, quiz: CircleHelp, trap: TriangleAlert, map: Map,
};

export function Tutor() {
  const { getContext, pending, toggle } = useTutor();
  const ctx = getContext();
  const llm = useStore(s => s.llm);
  const setLlm = useStore(s => s.setLlm);
  const history = useStore(s => s.chats[ctx.key]) ?? [];
  const setChat = useStore(s => s.setChat);
  const status = useLlm();
  const [live, setLive] = useState<ChatMsg | null>(null); // message being streamed
  const [input, setInput] = useState('');
  const [settings, setSettings] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ta.current?.focus(); }, []);
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history.length, live?.content, live?.thinking, ctx.key]);

  async function send(text: string) {
    if (abort.current || !text.trim()) return;
    if (!useLlm.getState().online) await ping();
    const c = useTutor.getState().getContext();
    const key = c.key;
    const prior = useStore.getState().chats[key] ?? [];
    const withUser: ChatMsg[] = [...prior, { role: 'user', content: text }];
    setChat(key, withUser);
    const messages: WireMsg[] = [{ role: 'system', content: systemPrompt(c) },
      ...withUser.slice(-12).filter(m => !m.error).map(m => ({ role: m.role, content: splitThink(m.content).content }))];
    const bot: ChatMsg = { role: 'assistant', content: '', thinking: '' };
    setLive({ ...bot });
    abort.current = new AbortController();
    const t0 = performance.now();
    let chunks = 0, frame = 0;
    try {
      for await (const d of chat(messages, abort.current.signal)) {
        bot.content += d.content;
        bot.thinking += d.thinking;
        chunks++;
        if (!frame) frame = requestAnimationFrame(() => { frame = 0; setLive({ ...bot }); });
      }
      const s = (performance.now() - t0) / 1000;
      bot.stats = `${prettyModel(useStore.getState().llm.model)} · ${s.toFixed(1)}s · ~${Math.round(chunks / s)} tok/s`;
    } catch (e) {
      const err = e as Error;
      if (err.name === 'AbortError') bot.content += bot.content ? '\n\n*(stopped)*' : '*(stopped)*';
      else {
        bot.error = true;
        bot.content = `**Couldn't reach the local model.** ${err.message}\n\nCheck that Ollama is running (\`open -a Ollama\`) and that the model \`${useStore.getState().llm.model || '?'}\` is installed (\`ollama list\`).`;
        ping();
      }
    } finally {
      cancelAnimationFrame(frame);
      abort.current = null;
      setLive(null);
      setChat(key, [...withUser, bot]);
    }
  }

  // messages queued by "ask the tutor" buttons elsewhere in the app
  useEffect(() => {
    if (pending) {
      useTutor.setState({ pending: null });
      send(pending);
    }
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = !!live;
  const ready = status.online && !!llm.model;
  const msgs = live ? [...history, live] : history;

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      className="tutor fixed right-0 top-14 bottom-0 z-30 flex w-[min(440px,100vw)] flex-col border-l border-line bg-panel shadow-2xl xl:static xl:z-auto xl:shadow-none">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <div className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white"><Sparkles size={15} /></div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold leading-tight">Tutor</div>
          <div className="truncate text-[11.5px] text-muted">{ctx.title}</div>
        </div>
        {canThink() && (
          <button className={cn('btn sm', llm.think && 'active')} onClick={() => setLlm({ think: !llm.think })}
            title="Let the model reason before answering: slower, better on hard questions">
            <Brain size={13} /> Think {llm.think ? 'on' : 'off'}
          </button>
        )}
        <button className="btn ghost sm icon" title="Tutor settings" onClick={() => setSettings(true)}><SlidersHorizontal size={15} /></button>
        <button className="btn ghost sm icon" title="Clear this conversation" onClick={() => { abort.current?.abort(); setChat(ctx.key, []); }}><Trash2 size={15} /></button>
        <button className="btn ghost sm icon" title="Close (⌘J)" onClick={() => toggle(false)}><X size={16} /></button>
      </header>

      {!ready && (
        <div className="m-3 flex gap-3 rounded-xl border border-warn/30 bg-warn/10 p-3 text-[13px]">
          <WifiOff size={18} className="mt-0.5 shrink-0 text-warn" />
          <div className="min-w-0">
            <b>{status.online ? 'No model installed' : 'Local model not reachable'}</b>
            <p className="my-1 text-fg-2">{status.online ? 'Pull one once, while you still have internet:' : 'Start Ollama. It runs fully offline:'}</p>
            <pre className="rounded-md bg-panel-2 px-2 py-1 font-mono text-[12px]">{status.online ? 'ollama pull qwen3.5:9b' : 'open -a Ollama'}</pre>
            <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
              <span className="truncate">{llm.provider} · {llm.url}</span>
              <button className="btn sm" onClick={() => ping()}>Retry</button>
            </div>
          </div>
        </div>
      )}

      <div ref={box} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!msgs.length && (
          <div className="mt-6 grid justify-items-center gap-2 px-6 text-center text-[13px] text-muted">
            <div className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent"><Sparkles size={20} /></div>
            <b className="text-[14px] text-fg">Stuck? Ask me.</b>
            <p>
              I can see this page{ctx.kind === 'code' ? ', your code and your last test run' : ctx.kind === 'trace' ? ' and every visualizer step' : ''}.
              I'll guide you instead of giving answers away. Ask for the solution explicitly if you really want it.
            </p>
          </div>
        )}
        {msgs.map((m, i) => <Message key={i} m={m} streaming={busy && i === msgs.length - 1} />)}
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
        {quickActions(ctx).map(a => {
          const Icon = QA_ICON[a.icon];
          return (
            <button key={a.label} disabled={busy} onClick={() => send(a.text)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-2.5 py-1 text-[12px] text-fg-2 transition hover:border-accent hover:text-fg disabled:opacity-40">
              <Icon size={12} />{a.label}
            </button>
          );
        })}
      </div>

      <form className="mx-3 mb-2 flex items-end gap-2 rounded-xl border border-line bg-panel-2 p-1.5 focus-within:border-accent"
        onSubmit={e => { e.preventDefault(); if (busy) return abort.current?.abort(); send(input.trim()); setInput(''); }}>
        <textarea ref={ta} rows={1} value={input} placeholder="Ask anything about this page…"
          className="max-h-44 min-h-[34px] flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-[13.5px] outline-none focus:outline-none"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
        <button type="submit" className="btn primary icon size-8 justify-center" title={busy ? 'Stop' : 'Send (Enter)'}>
          {busy ? <Square size={14} /> : <SendHorizontal size={15} />}
        </button>
      </form>
      <div className="px-4 pb-2.5 text-[11px] text-muted">
        {ready ? `${prettyModel(llm.model)} · runs on this Mac · nothing leaves your computer` : 'offline'}
      </div>
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}
    </motion.aside>
  );
}

function Message({ m, streaming }: { m: ChatMsg; streaming: boolean }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-[13.5px] text-white">{m.content}</div>
      </div>
    );
  }
  const { content, thinking } = splitThink(m.content, m.thinking);
  return (
    <div className={cn('text-[13.5px]', m.error && 'rounded-xl border border-bad/30 bg-bad/10 p-3')}>
      {thinking && (
        <details className="mb-2 rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-[12.5px] text-muted" open={streaming && !content}>
          <summary className="cursor-pointer select-none">{streaming && !content ? 'Thinking…' : 'Reasoning'}</summary>
          <Markdown text={thinking} safe className="mt-1 text-[12.5px] text-muted" />
        </details>
      )}
      {content ? <Markdown text={content} safe /> : streaming && !thinking && <span className="typing"><i /><i /><i /></span>}
      {m.stats && <div className="mt-1.5 text-[11px] text-muted">{m.stats}</div>}
    </div>
  );
}
