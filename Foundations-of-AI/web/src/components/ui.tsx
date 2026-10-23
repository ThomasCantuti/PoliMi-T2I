import { Check, CircleHelp, Code, Eye, type LucideIcon } from 'lucide-react';
import { create } from 'zustand';
import type { Catalog, Kind, Difficulty, Problem } from '../lib/types';
import { useStore, statusOf } from '../lib/store';

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ------------------------------------------------------------ catalog (loaded once)
export const useCatalog = create<Catalog & { byId: Record<string, Problem>; loaded: boolean }>(() => ({
  topics: [], problems: [], errors: [], byId: {}, loaded: false,
}));
export const topicIndex = (id: string) => useCatalog.getState().topics.findIndex(t => t.id === id) + 1;

export const KIND: Record<Kind, { label: string; Icon: LucideIcon; verb: string; color: string }> = {
  trace: { label: 'Trace', Icon: Eye, verb: 'Predict each step', color: 'text-info bg-info/10 border-info/25' },
  code: { label: 'Code', Icon: Code, verb: 'Implement it', color: 'text-accent bg-accent/10 border-accent/25' },
  quiz: { label: 'Quiz', Icon: CircleHelp, verb: 'Check the concepts', color: 'text-warn bg-warn/10 border-warn/25' },
};

export function KindChip({ kind }: { kind: Kind }) {
  const k = KIND[kind];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium', k.color)}>
      <k.Icon size={12} />{k.label}
    </span>
  );
}

const DIFF: Record<Difficulty, string> = { easy: 'text-ok', medium: 'text-warn', hard: 'text-bad' };
export function DiffChip({ d }: { d: Difficulty }) {
  return <span className={cn('text-[12px] font-medium capitalize', DIFF[d])}>{d}</span>;
}

export function StatusDot({ id }: { id: string }) {
  const s = useStore(st => statusOf(st, id));
  return (
    <span title={{ solved: 'Solved', tried: 'Attempted', new: 'Not started' }[s]}
      className={cn('inline-grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors',
        s === 'solved' && 'border-ok bg-ok text-white',
        s === 'tried' && 'border-warn bg-warn/15',
        s === 'new' && 'border-line-strong')}>
      {s === 'solved' && <Check size={11} strokeWidth={3} />}
    </span>
  );
}

export function Ring({ pct, size = 40, stroke = 5, children }: { pct: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke - 1) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" /><stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" style={{ strokeWidth: stroke }} />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fg" style={{ strokeWidth: stroke }}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}

export function Bar({ pct, className }: { pct: number; className?: string }) {
  return <div className={cn('bar-track', className)}><div className="bar-fill" style={{ width: `${pct}%` }} /></div>;
}

export const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

export function useSolvedCount(list: Problem[]) {
  return useStore(s => list.filter(p => s.solved[p.id]).length);
}

export function Empty({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-16 text-center text-muted">
      <Icon size={26} strokeWidth={1.6} />
      <div className="max-w-sm">{children}</div>
    </div>
  );
}
