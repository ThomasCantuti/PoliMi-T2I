import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Code, Play } from 'lucide-react';
import { fetchTheory, theoryNow } from '../lib/api';
import { useTutor } from '../lib/tutor';
import type { Kind, Problem, Topic } from '../lib/types';
import type { Preset } from '../viz/types';
import { Markdown } from '../components/Markdown';
import { loadViz, VizHost } from '../components/VizHost';
import { cn, DiffChip, Empty, KIND, KindChip, pct, Ring, StatusDot, topicIndex, useCatalog, useSolvedCount } from '../components/ui';

type Tab = 'theory' | 'play' | 'problems';

export function TopicPage({ topic, tab }: { topic: Topic; tab: Tab }) {
  const problems = useCatalog(s => s.problems).filter(p => p.topic === topic.id);
  const solved = useSolvedCount(problems);
  const tabs: [Tab, typeof BookOpen, string][] = [['theory', BookOpen, 'Theory'], ['play', Play, 'Playground'], ['problems', Code, 'Problems']];
  const figLog = useRef<string[]>([]);

  useEffect(() => {
    figLog.current.length = 0;
    useTutor.getState().setContext(() => ({ key: 'topic:' + topic.id, kind: 'topic', topic, title: topic.title, notes: theoryNow[topic.id], vizLog: figLog.current }));
  }, [topic, tab]); // tab: coming back from the Playground restores the Theory context

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      <header className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[.1em] text-accent">Topic {topicIndex(topic.id)} · {/^\d/.test(topic.pages) ? `slides p. ${topic.pages}` : topic.pages}</div>
          <h1 className="mt-1.5 text-[32px] font-bold tracking-[-.025em]">{topic.title}</h1>
          <p className="mt-1.5 max-w-[720px] text-[15px] text-fg-2">{topic.blurb}</p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Ring pct={pct(solved, problems.length)} size={58} stroke={6}><span className="text-[12px] font-semibold">{pct(solved, problems.length)}%</span></Ring>
          <div className="text-[13px]"><b>{solved}/{problems.length}</b><div className="text-muted">solved</div></div>
        </div>
      </header>

      <nav className="mt-6 flex gap-1 border-b border-line">
        {tabs.map(([k, Icon, label]) => (
          <a key={k} href={`#/t/${topic.id}/${k}`}
            className={cn('relative flex items-center gap-2 px-2 py-2.5 text-[13.5px] font-medium transition-colors sm:px-3.5',
              tab === k ? 'text-fg' : 'text-muted hover:text-fg')}>
            <Icon size={15} />{label}
            {k === 'problems' && <span className="rounded-full bg-panel-3 px-1.5 text-[11px] tabular-nums">{problems.length}</span>}
            {tab === k && <motion.span layoutId="topic-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </a>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'theory' && <Theory topic={topic} log={figLog.current} />}
        {tab === 'play' && <Playground topic={topic} />}
        {tab === 'problems' && <ProblemList problems={problems} />}
      </div>
    </div>
  );
}

function Theory({ topic, log }: { topic: Topic; log: string[] }) {
  const [text, setText] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { fetchTheory(topic.id).then(t => setText(t.replace(/^\s*# .*\n/, ''))); }, [topic.id]);
  const heads = useMemo(() => (text ?? '').split('\n').filter(l => /^## /.test(l)).map(l => l.slice(3).replace(/[*`$]/g, '')), [text]);

  useEffect(() => {
    const hs = [...(ref.current?.querySelectorAll('h2') ?? [])];
    const onScroll = () => setActive(hs.reduce((a, h, i) => (h.getBoundingClientRect().top < 180 ? i : a), 0));
    document.addEventListener('scroll', onScroll, true);
    onScroll();
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [text]);

  if (text === null) return <div className="h-96 animate-pulse rounded-2xl bg-panel" />;
  if (!text) return <Empty icon={BookOpen}>Theory for this topic is not available yet.</Empty>;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 xl:grid-cols-[minmax(0,760px)_220px]">
      <div>
        <ChapterVideo id={topic.id} />
        <div ref={ref}><Markdown text={text} className="text-[15px]" onEvent={t => { log.push(t); if (log.length > 60) log.shift(); }} /></div>
        <div className="card mt-12 flex flex-wrap items-center justify-between gap-4 p-5">
          <div><b>Ready to practice?</b><p className="text-[13px] text-muted">Watch it run in the playground, then predict the steps yourself.</p></div>
          <div className="flex gap-2">
            {topic.viz.length > 0 && <a className="btn" href={`#/t/${topic.id}/play`}><Play size={14} /> Playground</a>}
            <a className="btn primary" href={`#/t/${topic.id}/problems`}><Code size={14} /> Problems</a>
          </div>
        </div>
      </div>
      <aside className="sticky top-6 hidden h-fit max-h-[calc(100vh-120px)] overflow-y-auto xl:block">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.08em] text-muted">On this page</div>
        {heads.map((h, i) => (
          <button key={i} onClick={() => ref.current?.querySelectorAll('h2')[i]?.scrollIntoView({ behavior: 'smooth' })}
            className={cn('block w-full border-l-2 py-1 pl-3 text-left text-[12.5px] transition',
              active === i ? 'border-accent text-fg' : 'border-line text-muted hover:text-fg')}>{h}</button>
        ))}
      </aside>
    </div>
  );
}

// The chapter's intro video (content/videos/<id>.mp4, made in videos/remotion). Played from a blob URL because
// server.py answers no HTTP range requests, which Safari needs to play (and every browser to seek) a plain src.
function ChapterVideo({ id }: { id: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url = '', live = true;
    fetch(`/content/videos/${id}.mp4`).then(r => (r.ok ? r.blob() : null)).then(b => {
      if (b && live) setSrc(url = URL.createObjectURL(b));
    });
    return () => { live = false; setSrc(null); if (url) URL.revokeObjectURL(url); };
  }, [id]);
  return src ? <video className="mb-8 aspect-video w-full rounded-2xl border border-line bg-black" src={src} controls /> : null;
}

function Playground({ topic }: { topic: Topic }) {
  if (!topic.viz.length) return <Empty icon={Play}>This topic is conceptual: there's no visualizer. Try the problems and quizzes!</Empty>;
  return <div className="grid gap-6">{topic.viz.map(v => <PlaygroundCard key={v} topic={topic} name={v} />)}</div>;
}

function PlaygroundCard({ topic, name }: { topic: Topic; name: string }) {
  const [presets, setPresets] = useState<Preset<unknown>[] | null>(null);
  const [i, setI] = useState(0);
  const log = useRef<string[]>([]);
  useEffect(() => {
    loadViz(name)?.then(m => {
      const own = m.PRESETS.filter(p => !p.topic || p.topic === topic.id);
      setPresets(own.length ? own : m.PRESETS);
    }) ?? setPresets([]);
  }, [name, topic.id]);
  useEffect(() => {
    useTutor.getState().setContext(() => ({ key: 'play:' + topic.id, kind: 'topic', topic, title: `${topic.title} · Playground`, notes: theoryNow[topic.id], vizLog: log.current }));
    fetchTheory(topic.id);
  }, [topic]);
  const config = presets?.[i]?.config;
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-panel-2/60 px-4 py-2.5">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold capitalize"><Play size={14} className="text-accent" /> {name} visualizer</span>
        <div className="flex-1" />
        {presets && presets.length > 0 && (
          <select value={i} onChange={e => { setI(+e.target.value); log.current.length = 0; }}>
            {presets.map((p, k) => <option key={k} value={k}>{p.name}</option>)}
          </select>
        )}
      </div>
      <div className="p-4">
        {presets === null ? <div className="h-80 animate-pulse rounded-xl bg-panel-2" /> :
          config !== undefined ? <VizHost name={name} config={config} mode="explore" onEvent={t => { log.current.push(t); if (log.current.length > 60) log.current.shift(); }} /> :
            <Empty icon={Play}>The <code>{name}</code> visualizer isn't available yet.</Empty>}
      </div>
    </section>
  );
}

function ProblemList({ problems }: { problems: Problem[] }) {
  if (!problems.length) return <Empty icon={Code}>No problems for this topic yet.</Empty>;
  return (
    <div className="grid gap-8">
      {(['trace', 'code', 'quiz'] as Kind[]).map(k => {
        const items = problems.filter(p => p.kind === k);
        return items.length ? <ProblemGroup key={k} kind={k} items={items} /> : null;
      })}
    </div>
  );
}

function ProblemGroup({ kind, items }: { kind: Kind; items: Problem[] }) {
  const s = useSolvedCount(items);
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-3 text-[13px]">
        <KindChip kind={kind} /><span className="font-medium">{KIND[kind].verb}</span><span className="text-muted tabular-nums">{s}/{items.length}</span>
      </div>
      <div className="card divide-y divide-line overflow-hidden">{items.map(p => <ProblemRow key={p.id} p={p} />)}</div>
    </section>
  );
}

export function ProblemRow({ p }: { p: Problem }) {
  return (
    <a href={`#/p/${p.id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-panel-2">
      <StatusDot id={p.id} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium group-hover:text-accent">{p.title}</span>
      <span className="hidden gap-1.5 md:flex">
        {p.tags.slice(0, 3).map(t => <span key={t} className="rounded-md bg-panel-3 px-1.5 py-0.5 text-[11px] text-muted">{t}</span>)}
      </span>
      <span className="w-14 text-right"><DiffChip d={p.difficulty} /></span>
    </a>
  );
}
