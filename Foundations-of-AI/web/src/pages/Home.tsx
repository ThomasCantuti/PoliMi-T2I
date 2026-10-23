import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Code, Eye, Play, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { useTutor } from '../lib/tutor';
import { Bar, KIND, KindChip, pct, Ring, useCatalog, useSolvedCount } from '../components/ui';
import type { Kind } from '../lib/types';

const LOOP = [
  { Icon: BookOpen, t: 'Read', d: 'Short theory in the course notation, with the exam traps.' },
  { Icon: Play, t: 'Watch', d: 'Step through each algorithm on the slides’ own examples.' },
  { Icon: Eye, t: 'Predict', d: 'Trace it yourself: pick the next step before it’s revealed.' },
  { Icon: Code, t: 'Implement', d: 'Write it in Python, run the tests, learn why it works.' },
  { Icon: Sparkles, t: 'Ask', d: 'A local tutor sees your code and tests. Press ⌘J.' },
];

export function Home() {
  const { topics, problems, byId, errors } = useCatalog();
  const solved = useStore(s => s.solved);
  const lastId = useStore(s => s.last);
  const done = useSolvedCount(problems);
  const last = lastId ? byId[lastId] : undefined;
  const next = problems.find(p => !solved[p.id]);

  useEffect(() => {
    useTutor.getState().setContext(() => ({
      key: 'home', kind: 'home', title: 'Course overview',
      topicsList: topics.map((t, i) => {
        const l = problems.filter(p => p.topic === t.id);
        return `${i + 1}. ${t.title}: ${t.blurb} (${l.length} problems, ${l.filter(p => useStore.getState().solved[p.id]).length} solved)`;
      }).join('\n'),
    }));
  }, [topics, problems]);

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-8 lg:px-10">
      <section className="relative grid items-center gap-8 overflow-hidden rounded-3xl border border-line bg-panel p-8 md:grid-cols-[1fr_auto] md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-accent-2/15 blur-3xl" />
        <div className="relative">
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[.12em] text-accent">Foundations of Artificial Intelligence</div>
          <h1 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.08] tracking-[-.03em]">
            Understand the algorithms<br />by <span className="grad">running them in your head.</span>
          </h1>
          <p className="mt-4 max-w-[620px] text-[15.5px] leading-relaxed text-fg-2">
            Every topic follows the same loop: get the idea, watch it run, predict each step yourself,
            then implement it and check the concepts. A tutor model runs on your Mac and helps when you’re stuck, even offline.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {last ? (
              <a className="btn primary lg" href={`#/p/${last.id}`}><Play size={15} /> Continue: {last.title}</a>
            ) : topics[0] && (
              <a className="btn primary lg" href={`#/t/${topics[0].id}`}><Play size={15} /> Start with {topics[0].short}</a>
            )}
            {next && next !== last && <a className="btn lg" href={`#/p/${next.id}`}>Next unsolved <ArrowRight size={15} /></a>}
          </div>
        </div>
        <div className="relative flex items-center gap-6">
          <Ring pct={pct(done, problems.length)} size={128} stroke={9}>
            <div className="text-center"><div className="text-[26px] font-bold tabular-nums">{pct(done, problems.length)}%</div>
              <div className="text-[12px] text-muted">{done} / {problems.length}</div></div>
          </Ring>
          <div className="grid gap-2.5">
            {(['trace', 'code', 'quiz'] as Kind[]).map(k => {
              const l = problems.filter(p => p.kind === k);
              return (
                <div key={k} className="flex items-center gap-2 text-[13px]">
                  <KindChip kind={k} /><b className="tabular-nums">{l.filter(p => solved[p.id]).length}</b><span className="text-muted">/ {l.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {LOOP.map(({ Icon, t, d }, i) => (
          <motion.div key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card flex gap-3 p-4">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Icon size={17} /></div>
            <div><div className="text-[13.5px] font-semibold">{i + 1}. {t}</div><p className="mt-0.5 text-[12.5px] leading-snug text-muted">{d}</p></div>
          </motion.div>
        ))}
      </section>

      <h2 className="mb-4 mt-12 text-[13px] font-semibold uppercase tracking-[.08em] text-muted">Study path</h2>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topics.map((t, i) => {
          const list = problems.filter(p => p.topic === t.id);
          const s = list.filter(p => solved[p.id]).length;
          return (
            <motion.a key={t.id} href={`#/t/${t.id}`} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="card group flex flex-col p-5 transition-colors hover:border-accent/50">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span className="font-mono text-[13px] font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
                <span>{/^\d/.test(t.pages) ? `slides ${t.pages}` : t.pages}</span>
              </div>
              <h3 className="mt-2 text-[16px] font-semibold leading-snug tracking-tight">{t.title}</h3>
              <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted">{t.blurb}</p>
              <div className="mt-4 flex items-center justify-between text-[12px] text-muted">
                <div className="flex gap-3">
                  {(['trace', 'code', 'quiz'] as Kind[]).map(k => {
                    const n = list.filter(p => p.kind === k).length;
                    const { Icon } = KIND[k];
                    return n ? <span key={k} className="flex items-center gap-1" title={KIND[k].label}><Icon size={12} />{n}</span> : null;
                  })}
                </div>
                <span className="tabular-nums">{s}/{list.length}</span>
              </div>
              <Bar pct={pct(s, list.length)} className="mt-2" />
            </motion.a>
          );
        })}
      </section>

      {errors.length > 0 && (
        <details className="mt-8 rounded-xl border border-bad/30 bg-bad/10 p-4 text-[13px]">
          <summary className="cursor-pointer">{errors.length} problem file(s) failed to load</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[12px]">{errors.join('\n')}</pre>
        </details>
      )}
    </div>
  );
}
