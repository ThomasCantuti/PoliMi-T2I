import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Command, CornerDownLeft, Moon, PanelLeftClose, PanelLeftOpen, Search, Sparkles, Sun, BookOpen } from 'lucide-react';
import { useStore } from '../lib/store';
import { useLlm, prettyModel } from '../lib/llm';
import { useTutor } from '../lib/tutor';
import { Bar, cn, KindChip, pct, Ring, StatusDot, useCatalog, useSolvedCount } from './ui';

export function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lg)" />
      <g stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".95">
        <line x1="16" y1="9" x2="10" y2="21" /><line x1="16" y1="9" x2="22" y2="21" /><line x1="10" y1="21" x2="22" y2="21" />
      </g>
      <circle cx="16" cy="9" r="3.2" fill="#fff" /><circle cx="10" cy="21" r="3.2" fill="#fff" /><circle cx="22" cy="21" r="3.2" fill="#fff" opacity=".7" />
    </svg>
  );
}

export function TopBar({ onPalette }: { onPalette: () => void }) {
  const theme = useStore(s => s.theme);
  const toggleTheme = useStore(s => s.toggleTheme);
  const sidebar = useStore(s => s.sidebar);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const model = useStore(s => s.llm.model);
  const online = useLlm(s => s.online);
  const { open, toggle } = useTutor();
  const ok = online && !!model;
  return (
    <header className="glass sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line px-4">
      <button className="btn ghost icon hidden lg:inline-flex" onClick={toggleSidebar} title={sidebar ? 'Hide study path' : 'Show study path'}>
        {sidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>
      <a href="#/" className="flex items-center gap-2.5">
        <Logo />
        <span className="text-[15px] font-semibold tracking-tight">AlgoDojo</span>
        <span className="hidden text-[12.5px] text-muted md:inline">Foundations of AI</span>
      </a>
      <button onClick={onPalette}
        className="mx-auto flex w-[min(420px,40vw)] items-center gap-2 rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-[13px] text-muted transition hover:border-line-strong">
        <Search size={14} /><span className="flex-1 text-left">Search problems & topics…</span>
        <kbd className="hidden sm:inline">⌘K</kbd>
      </button>
      <button onClick={() => toggle(true)} title={ok ? 'Local model ready' : 'Local model not reachable'}
        className="hidden items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[12px] text-fg-2 md:flex">
        <span className={cn('size-2 rounded-full', ok ? 'bg-ok shadow-[0_0_8px_var(--ok)]' : 'bg-bad')} />
        {ok ? prettyModel(model) : 'Tutor offline'}
      </button>
      <button className="btn ghost icon" onClick={toggleTheme} title="Toggle theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
      <button className={cn('btn', open ? 'active' : 'primary')} onClick={() => toggle()}>
        <Sparkles size={14} /> Tutor <kbd className="!border-white/30 !bg-white/10 !text-current">⌘J</kbd>
      </button>
    </header>
  );
}

export function Sidebar({ current }: { current?: string }) {
  const { topics, problems } = useCatalog();
  const solved = useStore(s => s.solved);
  const done = useSolvedCount(problems);
  const open = useStore(s => s.sidebar);
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.nav initial={{ width: 0 }} animate={{ width: 248 }} exit={{ width: 0 }} transition={{ duration: .2 }}
          className="hidden shrink-0 overflow-hidden border-r border-line bg-panel/40 lg:block">
          <div className="flex h-full w-[248px] flex-col">
            <div className="px-5 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[.08em] text-muted">Study path</div>
            <div className="flex-1 space-y-0.5 overflow-y-auto px-3">
              {topics.map((t, i) => {
                const list = problems.filter(p => p.topic === t.id);
                const s = list.filter(p => solved[p.id]).length;
                const full = list.length > 0 && s === list.length;
                const active = current === t.id;
                return (
                  <a key={t.id} href={`#/t/${t.id}`}
                    className={cn('group relative grid grid-cols-[24px_1fr_auto] items-center gap-x-2.5 gap-y-1 rounded-lg px-2.5 py-2 transition',
                      active ? 'bg-accent/10 text-fg' : 'text-fg-2 hover:bg-panel-2 hover:text-fg')}>
                    {active && <motion.span layoutId="side-active" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent" />}
                    <span className={cn('grid size-6 place-items-center rounded-md text-[11.5px] font-semibold',
                      full ? 'bg-ok text-white' : active ? 'bg-accent text-white' : 'bg-panel-3 text-fg-2')}>
                      {full ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="truncate text-[13.5px] font-medium">{t.short}</span>
                    <span className="text-[11px] tabular-nums text-muted">{s}/{list.length}</span>
                    <Bar pct={pct(s, list.length)} className="col-start-2 col-end-4 !h-[3px]" />
                  </a>
                );
              })}
            </div>
            <div className="m-3 flex items-center gap-3 rounded-xl border border-line bg-panel p-3">
              <Ring pct={pct(done, problems.length)} size={44}><span className="text-[11px] font-semibold">{pct(done, problems.length)}%</span></Ring>
              <div className="text-[12.5px]"><b className="text-[14px]">{done}</b> / {problems.length} solved<div className="text-muted">across the course</div></div>
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

type Item = { href: string; title: string; sub: string; kind?: 'trace' | 'code' | 'quiz'; id?: string };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { topics, problems } = useCatalog();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const items = useMemo<Item[]>(() => {
    const all: Item[] = [
      ...topics.map((t, i) => ({ href: `#/t/${t.id}`, title: `${i + 1}. ${t.title}`, sub: 'Topic · theory, playground, problems' })),
      ...problems.map(p => ({ href: `#/p/${p.id}`, title: p.title, sub: `${topics.find(t => t.id === p.topic)?.short} · ${p.tags.slice(0, 3).join(', ')}`, kind: p.kind, id: p.id })),
    ];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return all.filter(x => words.every(w => `${x.title} ${x.sub} ${x.kind ?? ''}`.toLowerCase().includes(w))).slice(0, 50);
  }, [q, topics, problems]);
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 10); } }, [open]);
  useEffect(() => setSel(0), [q]);
  const go = (x?: Item) => { if (x) { location.hash = x.href; onClose(); } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/40 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div onMouseDown={e => e.stopPropagation()}
            initial={{ y: -8, scale: .98 }} animate={{ y: 0, scale: 1 }} exit={{ y: -8, scale: .98 }}
            className="w-[min(640px,92vw)] overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Command size={16} className="text-muted" />
              <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Jump to a topic or problem… (try “A* trace”)"
                className="!border-0 !bg-transparent !px-0 py-3.5 text-[15px] !outline-none flex-1"
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, items.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
                  if (e.key === 'Enter') go(items[sel]);
                  if (e.key === 'Escape') onClose();
                }} />
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {!items.length && <div className="p-6 text-center text-muted">Nothing found.</div>}
              {items.map((x, i) => (
                <button key={x.href} onMouseEnter={() => setSel(i)} onClick={() => go(x)}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left', i === sel && 'bg-accent/10')}>
                  {x.id ? <StatusDot id={x.id} /> : <BookOpen size={16} className="text-muted" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px]">{x.title}</div>
                    <div className="truncate text-[11.5px] text-muted">{x.sub}</div>
                  </div>
                  {x.kind && <KindChip kind={x.kind} />}
                  {i === sel && <CornerDownLeft size={14} className="text-muted" />}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
