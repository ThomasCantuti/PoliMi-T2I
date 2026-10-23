import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check, ChevronLeft, ChevronRight, Eye, KeyRound, Lightbulb, Loader2, Play, RotateCcw, Sparkles, X,
} from 'lucide-react';
import { fetchTheory, runCode, theoryNow } from '../lib/api';
import { useStore } from '../lib/store';
import { useTutor } from '../lib/tutor';
import type { Problem, RunResult, TestResult } from '../lib/types';
import type { VizMode } from '../viz/types';
import { Markdown } from '../components/Markdown';
import { CodeEditor } from '../components/CodeEditor';
import { VizHost } from '../components/VizHost';
import { cn, DiffChip, KindChip, pct, StatusDot, topicIndex, useCatalog } from '../components/ui';

export function ProblemPage({ p }: { p: Problem }) {
  const { problems, topics } = useCatalog();
  const topic = topics.find(t => t.id === p.topic)!;
  const i = problems.indexOf(p);
  const prev = problems[i - 1], next = problems[i + 1];
  useEffect(() => { useStore.getState().setLast(p.id); fetchTheory(p.topic); }, [p]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-line px-5 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px]">
          <a href={`#/t/${topic.id}/problems`} className="shrink-0 text-muted hover:text-fg">{topicIndex(topic.id)}. {topic.short}</a>
          <ChevronRight size={13} className="shrink-0 text-muted" />
          <span className="truncate font-semibold">{p.title}</span>
        </div>
        <KindChip kind={p.kind} /><DiffChip d={p.difficulty} /><StatusDot id={p.id} />
        <div className="ml-2 flex gap-1">
          <a className={cn('btn sm icon', !prev && 'pointer-events-none opacity-40')} href={prev ? `#/p/${prev.id}` : undefined} title="Previous problem"><ChevronLeft size={15} /></a>
          <a className={cn('btn sm icon', !next && 'pointer-events-none opacity-40')} href={next ? `#/p/${next.id}` : undefined} title="Next problem"><ChevronRight size={15} /></a>
        </div>
      </header>
      {p.kind === 'code' && <CodeView key={p.id} p={p} next={next} />}
      {p.kind === 'trace' && <TraceView key={p.id} p={p} next={next} />}
      {p.kind === 'quiz' && <QuizView key={p.id} p={p} next={next} />}
    </div>
  );
}

// ------------------------------------------------------------ split + info panel
function Split({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  const [w, setW] = useState(() => Number(localStorage.getItem('algodojo:split')) || 42);
  const box = useRef<HTMLDivElement>(null);
  const drag = (e: React.PointerEvent) => {
    const rect = box.current!.getBoundingClientRect();
    const move = (ev: PointerEvent) => setW(Math.min(70, Math.max(25, ((ev.clientX - rect.left) / rect.width) * 100)));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.style.cursor = '';
      setW(x => { localStorage.setItem('algodojo:split', String(x)); return x; });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  };
  return (
    <div ref={box} className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="min-h-0 w-full overflow-hidden max-md:h-[45%] md:w-(--split-w) md:shrink-0" style={{ ['--split-w' as string]: `${w}%` }}>{left}</div>
      <div onPointerDown={drag} className="group hidden w-2 shrink-0 cursor-col-resize items-center justify-center md:flex">
        <div className="h-10 w-1 rounded-full bg-line transition group-hover:bg-accent" />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{right}</div>
    </div>
  );
}

type InfoTab = 'desc' | 'hints' | 'sol' | 'why';

function InfoPanel({ p, tab, setTab, onLoadSolution }: { p: Problem; tab: InfoTab; setTab: (t: InfoTab) => void; onLoadSolution?: () => void }) {
  const shown = useStore(s => s.hints[p.id] ?? 0);
  const saw = useStore(s => !!s.sawSolution[p.id] || !!s.solved[p.id]);
  const tabs: [InfoTab, string, number?][] = [['desc', 'Description'], ['hints', 'Hints', p.hints.length]];
  if (p.solution) tabs.push(['sol', 'Solution']);
  if (p.explanation) tabs.push(['why', 'Why it works']);
  return (
    <section className="flex h-full min-h-0 flex-col border-line md:border-r">
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 [scrollbar-width:none]">
        {tabs.map(([k, l, n]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn('relative shrink-0 whitespace-nowrap px-3 py-2.5 text-[13px] font-medium transition-colors', tab === k ? 'text-fg' : 'text-muted hover:text-fg')}>
            {l}{n ? <span className="ml-1.5 rounded-full bg-panel-3 px-1.5 text-[11px]">{n}</span> : null}
            {tab === k && <motion.span layoutId="info-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {tab === 'desc' && <>
          <Markdown text={p.statement} className="text-[14.5px]" />
          {p.tags.length > 0 && <div className="mt-6 flex flex-wrap gap-1.5">{p.tags.map(t => <span key={t} className="rounded-md bg-panel-3 px-2 py-0.5 text-[11.5px] text-muted">{t}</span>)}</div>}
        </>}
        {tab === 'hints' && <div className="grid gap-3">
          {!p.hints.length && <p className="text-muted">No hints for this one. Ask the tutor!</p>}
          {p.hints.slice(0, shown).map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-warn/25 bg-warn/5 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-warn"><Lightbulb size={13} /> Hint {i + 1}</div>
              <Markdown text={h} className="text-[14px]" />
            </motion.div>
          ))}
          {shown < p.hints.length && (
            <button className="btn w-fit" onClick={() => useStore.getState().revealHint(p.id)}>
              <Lightbulb size={14} /> Reveal hint {shown + 1} of {p.hints.length}
            </button>
          )}
          <button className="btn ghost w-fit" onClick={() => useTutor.getState().ask("I'm stuck. Give me a small nudge in the right direction, not the solution.")}>
            <Sparkles size={14} /> Ask the tutor for a nudge
          </button>
        </div>}
        {tab === 'sol' && p.solution && (saw ? <>
          <Markdown text={'```python\n' + p.solution.trim() + '\n```'} />
          {onLoadSolution && <button className="btn sm mt-2" onClick={onLoadSolution}>Load into the editor</button>}
        </> : (
          <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
            <KeyRound size={24} className="text-muted" />
            <p className="max-w-xs text-[13.5px] text-fg-2">Struggling is where the learning happens. Did you try the hints and the tutor first?</p>
            <button className="btn" onClick={() => useStore.getState().revealSolution(p.id)}>Show the solution anyway</button>
          </div>
        ))}
        {tab === 'why' && <Markdown text={p.explanation} className="text-[14.5px]" />}
      </div>
    </section>
  );
}

function Success({ title, next, hasWhy, onWhy }: { title: string; next?: Problem; hasWhy: boolean; onWhy: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: .96, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="m-3 flex items-center gap-3 rounded-xl border border-ok/30 bg-ok/10 p-3">
      <motion.div initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: .1, type: 'spring' }}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-ok text-white"><Check size={18} strokeWidth={3} /></motion.div>
      <div className="min-w-0 flex-1">
        <b className="text-[14px]">{title}</b>
        {hasWhy && <p className="text-[12.5px] text-fg-2">Read <button className="underline underline-offset-2" onClick={onWhy}>Why it works</button> to lock in the idea.</p>}
      </div>
      {next && <a className="btn primary sm" href={`#/p/${next.id}`}>Next <ChevronRight size={13} /></a>}
    </motion.div>
  );
}

// ------------------------------------------------------------ code
function summarize(r: RunResult): string {
  if (r.error && !r.results.length) return `Error before running the tests:\n${r.error}`;
  const passed = r.results.filter(x => x.ok).length;
  return `${passed}/${r.results.length} tests passed.\n` + r.results.filter(x => !x.ok).slice(0, 3).map(x =>
    `FAILED "${x.name}": input ${x.input}${x.expected ? `; expected ${x.expected}` : ''}${x.got ? `; got ${x.got}` : ''}${x.message ? `; ${x.message}` : ''}${x.error ? `\n${x.error}` : ''}${x.stdout ? `\nprinted: ${x.stdout.slice(0, 300)}` : ''}`).join('\n');
}

function CodeView({ p, next }: { p: Problem; next?: Problem }) {
  const saved = useStore(s => s.code[p.id]);
  const [code, setCode] = useState(saved ?? p.starter ?? '');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [firstSolve, setFirstSolve] = useState(false);
  const [tab, setTab] = useState<InfoTab>('desc');
  const codeRef = useRef(code);
  const lastRun = useRef<string | undefined>(undefined);

  useEffect(() => {
    useTutor.getState().setContext(() => ({
      key: 'p:' + p.id, kind: 'code', topic: useCatalog.getState().topics.find(t => t.id === p.topic), title: p.title,
      difficulty: p.difficulty, tags: p.tags, statement: p.statement, hints: p.hints, solution: p.solution,
      code: codeRef.current, results: lastRun.current, notes: theoryNow[p.topic],
    }));
  }, [p]);

  const onChange = useCallback((v: string) => { setCode(v); codeRef.current = v; useStore.getState().setCode(p.id, v); }, [p.id]);
  const run = useCallback(async () => {
    setRunning(true);
    const r = await runCode(p.id, codeRef.current);
    setRunning(false);
    setResult(r);
    lastRun.current = summarize(r);
    const st = useStore.getState();
    st.attempt(p.id);
    if (r.ok) {
      const first = st.markSolved(p.id);
      setFirstSolve(first);
      if (first && p.explanation) setTab('why');
    }
  }, [p]);

  const passed = result?.results.filter(x => x.ok).length ?? 0;
  return (
    <Split
      left={<InfoPanel p={p} tab={tab} setTab={setTab} onLoadSolution={() => { if (confirm('Replace your code with the reference solution?')) onChange(p.solution!); }} />}
      right={<>
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <button className="btn ok" onClick={run} disabled={running}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={13} />} Run tests <kbd className="!border-white/30 !bg-white/15 !text-white">⌘↵</kbd>
          </button>
          {result && <span className={cn('text-[13px] font-medium', result.ok ? 'text-ok' : 'text-bad')}>
            {result.error && !result.results.length ? 'Error' : `${passed}/${result.results.length} passed`}
          </span>}
          <div className="flex-1" />
          <button className="btn ghost sm" onClick={() => useTutor.getState().toggle(true)}><Sparkles size={13} /> Ask</button>
          <button className="btn ghost sm" onClick={() => { if (confirm('Reset the editor to the starter code? Your code will be lost.')) onChange(p.starter ?? ''); }}>
            <RotateCcw size={13} /> Reset
          </button>
        </div>
        <div className="min-h-[200px] flex-[3] overflow-hidden"><CodeEditor value={code} onChange={onChange} onRun={run} /></div>
        <div className="min-h-[160px] flex-[2] overflow-y-auto border-t border-line bg-panel">
          <AnimatePresence>{result?.ok && <Success title={firstSolve ? 'All tests passed. Solved!' : 'All tests passed.'} next={next} hasWhy={!!p.explanation} onWhy={() => setTab('why')} />}</AnimatePresence>
          <div className="flex items-center justify-between px-4 pb-1 pt-3 text-[12px]">
            <span className="font-semibold uppercase tracking-wider text-muted">Tests</span>
            <span className="text-muted">{result ? `${pct(passed, result.results.length)}%` : `${p.tests?.length ?? 0} cases · ⌘↵ to run`}</span>
          </div>
          {result?.error && <pre className="mx-3 my-2 whitespace-pre-wrap rounded-lg border border-bad/30 bg-bad/10 p-3 font-mono text-[12.5px] text-bad">{result.error}</pre>}
          {result?.stdout && <KV k="printed" v={result.stdout} pre />}
          <div className="grid gap-1.5 p-3 pt-1">
            {result ? result.results.map(t => <TestCard key={t.name} t={t} />) :
              p.tests?.map(t => (
                <div key={t.name} className="rounded-lg border border-line px-3 py-2">
                  <div className="flex items-center gap-2 text-[13px]"><span className="size-2 rounded-full bg-line-strong" />{t.name}</div>
                  {t.input && <KV k="input" v={t.input} />}
                </div>
              ))}
          </div>
        </div>
      </>} />
  );
}

function KV({ k, v, pre, bad }: { k: string; v?: string; pre?: boolean; bad?: boolean }) {
  if (!v) return null;
  return (
    <div className="mt-1 grid grid-cols-[70px_1fr] gap-2 px-1 text-[12.5px]">
      <span className="pt-0.5 text-muted">{k}</span>
      {pre ? <pre className={cn('overflow-x-auto whitespace-pre-wrap rounded-md bg-panel-2 px-2 py-1 font-mono text-[12px]', bad && 'text-bad')}>{v}</pre>
        : <code className={cn('break-all font-mono text-[12px]', bad && 'text-bad')}>{v}</code>}
    </div>
  );
}

function TestCard({ t }: { t: TestResult }) {
  return (
    <details open={!t.ok} className={cn('group rounded-lg border px-3 py-2', t.ok ? 'border-line' : 'border-bad/35 bg-bad/5')}>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px]">
        <span className={cn('grid size-4 place-items-center rounded-full text-white', t.ok ? 'bg-ok' : 'bg-bad')}>
          {t.ok ? <Check size={10} strokeWidth={3.5} /> : <X size={10} strokeWidth={3.5} />}
        </span>
        <span className="flex-1">{t.name}</span><span className="text-[11px] text-muted">{t.ms} ms</span>
      </summary>
      <div className="pb-1 pt-1.5">
        <KV k="input" v={t.input} /><KV k="expected" v={t.expected} /><KV k="got" v={t.got} bad={!t.ok} />
        <KV k="why" v={t.message} /><KV k="error" v={t.error} pre bad /><KV k="printed" v={t.stdout} pre />
        {!t.ok && <button className="btn ghost sm mt-1.5" onClick={() => useTutor.getState().ask(`Test "${t.name}" fails. Help me understand why, without giving me the full solution.`)}>
          <Sparkles size={12} /> Ask the tutor why
        </button>}
      </div>
    </details>
  );
}

// ------------------------------------------------------------ trace
function TraceView({ p, next }: { p: Problem; next?: Problem }) {
  const [mode, setMode] = useState<VizMode>('predict');
  const [run, setRun] = useState(0); // bump to restart
  const [done, setDone] = useState<{ correct: number; total: number; first: boolean } | null>(null);
  const [tab, setTab] = useState<InfoTab>('desc');
  const log = useRef<string[]>([]);

  useEffect(() => {
    useTutor.getState().setContext(() => ({
      key: 'p:' + p.id, kind: 'trace', topic: useCatalog.getState().topics.find(t => t.id === p.topic), title: p.title,
      difficulty: p.difficulty, tags: p.tags, statement: p.statement, hints: p.hints, config: p.config, vizLog: log.current, notes: theoryNow[p.topic],
    }));
  }, [p]);

  const restart = (m: VizMode) => { setMode(m); setRun(r => r + 1); setDone(null); log.current.length = 0; };
  return (
    <Split
      left={<InfoPanel p={p} tab={tab} setTab={setTab} />}
      right={<>
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <div className="flex rounded-lg border border-line bg-panel-2 p-0.5">
            {([['predict', Eye, 'Predict'], ['explore', Play, 'Watch']] as const).map(([m, Icon, l]) => (
              <button key={m} onClick={() => restart(m)}
                className={cn('flex items-center gap-1.5 rounded-md px-3 py-1 text-[13px] transition', mode === m ? 'bg-panel text-fg shadow-sm' : 'text-muted hover:text-fg')}>
                <Icon size={13} />{l}
              </button>
            ))}
          </div>
          <span className="hidden text-[12.5px] text-muted sm:inline">{mode === 'predict' ? 'Predict every step before it is revealed.' : 'Free play: step through at your pace.'}</span>
          <div className="flex-1" />
          <button className="btn ghost sm" onClick={() => useTutor.getState().toggle(true)}><Sparkles size={13} /> Ask</button>
          <button className="btn ghost sm" onClick={() => restart(mode)}><RotateCcw size={13} /> Restart</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <AnimatePresence>{done && <Success next={next} hasWhy={!!p.explanation} onWhy={() => setTab('why')}
            title={`Trace complete: ${done.correct}/${done.total} right on the first try${done.correct === done.total ? '. Flawless!' : '.'}`} />}</AnimatePresence>
          <VizHost key={run} name={p.viz!} config={p.config} mode={mode}
            onEvent={t => { log.current.push(t); if (log.current.length > 80) log.current.shift(); }}
            onDone={r => {
              const st = useStore.getState();
              st.setScore(p.id, r);
              st.attempt(p.id);
              const first = st.markSolved(p.id);
              setDone({ ...r, first });
              if (first && p.explanation) setTab('why');
            }} />
        </div>
      </>} />
  );
}

// ------------------------------------------------------------ quiz
interface QState { picked: number[]; checked: boolean; right: boolean }

function QuizView({ p, next }: { p: Problem; next?: Problem }) {
  const qs = p.questions ?? [];
  const [state, setState] = useState<QState[]>(() => qs.map(() => ({ picked: [], checked: false, right: false })));
  const [round, setRound] = useState(0);
  const answered = state.filter(s => s.checked).length, right = state.filter(s => s.right).length;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    useTutor.getState().setContext(() => ({
      key: 'p:' + p.id, kind: 'quiz', topic: useCatalog.getState().topics.find(t => t.id === p.topic), title: p.title, notes: theoryNow[p.topic],
      questions: qs.map((q, i) => {
        const s = stateRef.current[i];
        return `Q${i + 1}. ${q.q}\nOptions: ${q.options.map((o, j) => `(${j + 1}) ${o}`).join(' ')}\nCorrect: ${[q.answer].flat().map(a => a + 1).join(', ')}` +
          (s?.checked ? ` · student answered ${s.picked.map(a => a + 1).join(', ')} (${s.right ? 'right' : 'wrong'})` : '');
      }).join('\n\n'),
    }));
  }, [p]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (answered === qs.length && qs.length) {
      const st = useStore.getState();
      st.setScore(p.id, { correct: right, total: qs.length });
      st.attempt(p.id);
      if (right === qs.length) st.markSolved(p.id);
    }
  }, [answered]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (i: number, f: (s: QState) => QState) => setState(st => st.map((s, k) => (k === i ? f(s) : s)));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[760px] px-6 pb-24 pt-6">
        {p.statement && <Markdown text={p.statement} className="mb-4 text-[14.5px]" />}
        <div className="sticky top-0 z-10 -mx-2 mb-4 flex items-center gap-3 rounded-xl bg-bg/85 px-2 py-2 backdrop-blur">
          <div className="bar-track flex-1"><div className="bar-fill" style={{ width: `${pct(answered, qs.length)}%` }} /></div>
          <span className="text-[12.5px] text-muted tabular-nums">{answered}/{qs.length} answered · <b className="text-fg">{right}</b> correct</span>
          {answered === qs.length && <button className="btn sm" onClick={() => { setState(qs.map(() => ({ picked: [], checked: false, right: false }))); setRound(r => r + 1); }}><RotateCcw size={12} /> Retry</button>}
        </div>
        <AnimatePresence>{answered === qs.length && (
          <Success next={next} hasWhy={false} onWhy={() => {}}
            title={right === qs.length ? 'Perfect score. Solved!' : `${right}/${qs.length} correct. Read the explanations, then retry for a perfect score.`} />
        )}</AnimatePresence>
        <div className="grid gap-4">
          {qs.map((q, i) => <QuestionCard key={`${round}-${i}`} i={i} q={q} s={state[i]} update={f => update(i, f)} />)}
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ i, q, s, update }: { i: number; q: NonNullable<Problem['questions']>[number]; s: QState; update: (f: (s: QState) => QState) => void }) {
  const multi = Array.isArray(q.answer);
  const answer = [q.answer].flat();
  const pick = (j: number) => !s.checked && update(st => ({
    ...st, picked: multi ? (st.picked.includes(j) ? st.picked.filter(x => x !== j) : [...st.picked, j]) : [j],
  }));
  const check = () => update(st => ({
    ...st, checked: true, right: st.picked.length === answer.length && st.picked.every(x => answer.includes(x)),
  }));
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
      className={cn('card p-5', s.checked && !s.right && 'shake')}>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md bg-accent/15 text-[12px] font-semibold text-accent">{i + 1}</span>
        {multi && <span className="chip">select all that apply</span>}
      </div>
      <Markdown text={q.q} className="text-[14.5px]" />
      <div className="mt-3 grid gap-2">
        {q.options.map((o, j) => {
          const picked = s.picked.includes(j), isRight = answer.includes(j);
          return (
            <button key={j} onClick={() => pick(j)} disabled={s.checked}
              className={cn('flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[14px] transition',
                !s.checked && (picked ? 'border-accent bg-accent/10' : 'border-line hover:border-line-strong hover:bg-panel-2'),
                s.checked && isRight && 'border-ok/50 bg-ok/10',
                s.checked && !isRight && picked && 'border-bad/50 bg-bad/10',
                s.checked && !isRight && !picked && 'border-line opacity-60')}>
              <span className={cn('mt-0.5 grid size-[18px] shrink-0 place-items-center border-[1.5px]', multi ? 'rounded-[5px]' : 'rounded-full',
                picked ? 'border-accent bg-accent text-white' : 'border-line-strong',
                s.checked && isRight && 'border-ok bg-ok text-white')}>
                {(picked || (s.checked && isRight)) && <Check size={11} strokeWidth={3.5} />}
              </span>
              <Markdown text={o} inline className="min-w-0 flex-1" />
            </button>
          );
        })}
      </div>
      {!s.checked ? (
        <div className="mt-3 flex justify-end"><button className="btn primary sm" disabled={!s.picked.length} onClick={check}>Check</button></div>
      ) : (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 overflow-hidden">
          <div className={cn('mb-2 flex items-center gap-1.5 text-[13.5px] font-semibold', s.right ? 'text-ok' : 'text-bad')}>
            {s.right ? <Check size={15} /> : <X size={15} />}{s.right ? 'Correct' : 'Not quite'}
          </div>
          {q.explain && <Markdown text={q.explain} className="rounded-xl bg-panel-2 p-3.5 text-[13.5px]" />}
          {!s.right && <button className="btn ghost sm mt-2" onClick={() => useTutor.getState().ask(`Question ${i + 1}: I answered wrong. Explain the concept behind it in a different way.`)}>
            <Sparkles size={12} /> Explain it differently
          </button>}
        </motion.div>
      )}
    </motion.div>
  );
}
