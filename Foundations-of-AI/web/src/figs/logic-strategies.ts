// Resolution strategies (AIMA §9.5.6 applied to PL; exams 14 Jul 2022, 14 Jun 2023, 31 Aug 2026): the same refutation run by
// plain PL-RESOLUTION and by the unit, input and set-of-support restrictions, side by side, with the clauses each one generates.
import { bar, card, md, s, style, type FigOptions } from './shell';

type Lits = string[];
interface Cl { lits: Lits; id: number; from?: [number, number]; input: boolean; sos: boolean; round: number }
interface Run { gen: Cl[]; empty: Cl | null }
const neg = (l: string) => (l.startsWith('¬') ? l.slice(1) : '¬' + l);
const key = (ls: Lits) => [...ls].sort().join('|');
const txt = (ls: Lits) => (ls.length ? ls.join(' ∨ ') : '⊥');

/** All resolvents of a and b, one per complementary pair, factored; tautologies are dropped. */
export function resolvents(a: Lits, b: Lits): Lits[] {
  return a.filter(l => b.includes(neg(l))).map(l => [...new Set([...a.filter(x => x !== l), ...b.filter(x => x !== neg(l))])])
    .filter(r => !r.some(x => r.includes(neg(x))));
}

const STRATS: { name: string; rule: string; complete: string; ok: (a: Cl, b: Cl) => boolean }[] = [
  { name: 'plain resolution', rule: 'any two clauses', complete: 'refutation-complete', ok: () => true },
  { name: 'unit resolution', rule: 'a parent is a unit clause', complete: 'complete for Horn clauses only', ok: (a, b) => a.lits.length === 1 || b.lits.length === 1 },
  { name: 'input resolution', rule: 'a parent is an input clause', complete: 'complete for Horn clauses only', ok: (a, b) => a.input || b.input },
  { name: 'set of support', rule: 'a parent is in the support set', complete: 'complete if the KB is satisfiable', ok: (a, b) => a.sos || b.sos },
];

/** PL-RESOLUTION level by level (AIMA Fig. 7.13), resolving only the pairs the strategy allows. */
export function saturate(kb: Lits[], query: Lits[], ok: (a: Cl, b: Cl) => boolean, cap = 400): Run {
  const all: Cl[] = [...kb, ...query].map((lits, i) => ({ lits, id: i + 1, input: true, sos: i >= kb.length, round: 0 }));
  const seen = new Set(all.map(c => key(c.lits))), gen: Cl[] = [];
  for (let round = 1; ; round++) {
    const fresh: Cl[] = [], n = all.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (!ok(all[i], all[j])) continue;
      for (const r of resolvents(all[i].lits, all[j].lits)) {
        const cl: Cl = { lits: r, id: all.length + fresh.length + 1, from: [all[i].id, all[j].id], input: false, sos: all[i].sos || all[j].sos, round };
        if (!r.length) { gen.push(cl); return { gen, empty: cl }; }
        if (seen.has(key(r))) continue;
        seen.add(key(r));
        fresh.push(cl);
        gen.push(cl);
        if (gen.length >= cap) return { gen, empty: null };
      }
    }
    if (!fresh.length) return { gen, empty: null };
    all.push(...fresh);
  }
}

/** The derived clauses the proof of ⊥ uses, in order, renumbered after the input clauses as the exam writes them. */
export function proof(r: Run, k: number): { lits: Lits; id: number; from: [number, number] }[] {
  const byId = new Map(r.gen.map(c => [c.id, c])), need = new Set<number>(), stack = [r.empty!];
  while (stack.length) { const c = stack.pop()!; if (c.from) for (const p of c.from) if (p > k && !need.has(p)) { need.add(p); stack.push(byId.get(p)!); } }
  const steps = [...r.gen.filter(c => need.has(c.id)), r.empty!], num = new Map<number, number>();
  steps.forEach((c, i) => num.set(c.id, k + i + 1));
  return steps.map(c => ({ lits: c.lits, id: num.get(c.id)!, from: c.from!.map(p => num.get(p) ?? p) as [number, number] }));
}

const CASES: { name: string; kb: string[]; q: string[]; note: string }[] = [
  { name: 'worked example (14 Jul 2022, 16 Jan 2025)', kb: ['P', '¬P ∨ ¬Q ∨ R', '¬S ∨ Q', '¬T ∨ Q', 'T'], q: ['¬R'], note: 'KB ⊨ R?' },
  { name: 'unit counterexample (14 Jul 2022)', kb: ['P ∨ Q', 'P ∨ ¬Q', '¬P ∨ R'], q: ['¬P ∨ ¬R'], note: 'the exam\'s 4 clauses; the last one read as the negated query of P ∧ R' },
  { name: 'input counterexample (31 Aug 2026)', kb: ['A ∨ B', 'A ∨ ¬B', '¬A ∨ B'], q: ['¬A ∨ ¬B'], note: 'KB ⊨ A ∧ B?' },
  { name: 'raining (14 Jun 2023)', kb: ['¬Swimming ∨ Wet', '¬Raining ∨ ¬Outside ∨ Wet', '¬Warm ∨ Raining ∨ Pleasant', '¬Wet', 'Outside', 'Warm'], q: ['Raining'], note: 'KB ⊨ ¬Raining?' },
  { name: 'warehouse robot (11 Jun 2026)', kb: ['¬O ∨ P ∨ R', '¬S ∨ D ∨ B', '¬R ∨ ¬M ∨ ¬D', 'D ∨ T', '¬B ∨ T', 'O', '¬P', 'M', '¬B'], q: ['¬T'], note: 'KB ⊨ T?' },
];
const split = (c: string) => c.split(' ∨ ');
const isHorn = (cs: Lits[]) => cs.every(c => c.filter(l => !l.startsWith('¬')).length <= 1);
const CW = 186, CX = (k: number) => 12 + k * (CW + 6), TOP = 74, ROWS = 9, LH = 21;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lgr-css', CSS);
  const c = card(el, 'simulation', 'Resolution strategies on the same refutation', '0 0 780 402');
  let ci = 0, runs: Run[] = [], t = 0, raf = 0, last = 0, rate = 6, running = false, said = '';
  const inputT = s(c.svg, 'g');
  const cols = STRATS.map((st, k) => {
    const x = CX(k);
    s(c.svg, 'rect', { x, y: TOP, width: CW, height: 320, rx: 10, class: 'lgr-col' });
    s(c.svg, 'text', { x: x + 10, y: TOP + 20, class: 'lgr-name' }, st.name);
    s(c.svg, 'text', { x: x + 10, y: TOP + 37, class: 'fg-m' }, st.rule);
    const big = s(c.svg, 'text', { x: x + 10, y: TOP + 66, class: 'lgr-big' }), sub = s(c.svg, 'text', { x: x + 10, y: TOP + 84, class: 'fg-m' });
    const lines = Array.from({ length: ROWS }, (_, j) => s(c.svg, 'text', { x: x + 10, y: TOP + 110 + j * LH, class: 'lgr-l' }));
    const status = s(c.svg, 'text', { x: x + 10, y: TOP + 296, class: 'lgr-st' }), comp = s(c.svg, 'text', { x: x + 10, y: TOP + 315, class: 'fg-m' }, st.complete);
    return { big, sub, lines, status, comp };
  });

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); t = 0; render(); };
  const end = document.createElement('button');
  end.className = 'btn sm';
  end.textContent = '⏭ Show the end';
  end.onclick = () => { pause(); t = total(); render(); opts.onEvent?.(`[${c.title}] jumped to the end`); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="3">3 clauses / s</option><option value="6" selected>6 clauses / s</option><option value="20">20 clauses / s</option>';
  sp.onchange = () => { rate = +sp.value; };
  const cs = document.createElement('select');
  cs.innerHTML = CASES.map((x, i) => `<option value="${i}">${x.name}</option>`).join('');
  cs.onchange = () => { pause(); load(+cs.value); opts.onEvent?.(`[${c.title}] instance: ${CASES[ci].name}`); };
  ctl.append(run, reset, end, sp, cs);

  const total = () => Math.max(...runs.map(r => r.gen.length));
  function load(i: number) {
    ci = i;
    const cse = CASES[i], kb = cse.kb.map(split), q = cse.q.map(split);
    runs = STRATS.map(st => saturate(kb, q, st.ok));
    if (!runs[0].empty) console.error(`logic-strategies: plain resolution found no refutation for ${cse.name}`);
    t = 0;
    inputT.textContent = '';
    const items = [...cse.kb, ...cse.q].map((cl, k) => `${k + 1}. ${cl}${k >= cse.kb.length ? ' (¬query)' : ''}`);
    let x = 12, y = 18;
    for (const it of items) {
      const w = it.length * 7.6 + 16;
      if (x + w > 770) { x = 12; y += 18; }
      s(inputT, 'text', { x, y, class: it.includes('¬query') ? 'lgr-q' : 'lgr-in' }, it);
      x += w;
    }
    s(inputT, 'text', { x: 12, y: y + 18, class: 'fg-m' }, `${cse.note} · ${isHorn([...kb, ...q]) ? 'all Horn clauses' : 'not all Horn: some clause has two positive literals'}`);
    render();
  }
  function play() {
    if (running) return;
    if (t >= total()) t = 0;
    running = true;
    last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      acc += ((now - last) / 1000) * rate;
      last = now;
      if (acc >= 1) { t = Math.min(total(), t + Math.floor(acc)); acc %= 1; render(); }
      if (t >= total()) { running = false; render(); }
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const k = CASES[ci].kb.length + CASES[ci].q.length;
    runs.forEach((r, j) => {
      const col = cols[j], shown = r.gen.slice(0, t), fin = t >= r.gen.length, found = fin && r.empty;
      col.big.textContent = `${shown.length - (found ? 1 : 0)} clause${shown.length - (found ? 1 : 0) === 1 ? '' : 's'}`;
      col.sub.textContent = r.gen.length === 0 ? 'no pair it may resolve' : `generated · round ${shown.length ? shown[shown.length - 1].round : 0}`;
      const lines: [string, string][] = found
        ? [['proof:', 'fg-m'] as [string, string]].concat(proof(r, k).map(p => [`${p.id}. ${txt(p.lits)}  (${p.from.join(', ')})`, p.lits.length ? 'lgr-l' : 'lgr-l bot']))
        : shown.slice(-ROWS).map(cl => [`${cl.id}. ${txt(cl.lits)}  (${cl.from!.join(', ')})`, cl === shown[shown.length - 1] && !fin ? 'lgr-l new' : 'lgr-l']);
      col.lines.forEach((l, i) => { l.textContent = lines[i]?.[0] ?? (found && i === ROWS - 1 && lines.length > ROWS ? '…' : ''); l.setAttribute('class', lines[i]?.[1] ?? 'lgr-l'); });
      if (found && lines.length > ROWS) col.lines[ROWS - 1].textContent = `… ${lines.length - ROWS + 1} more lines, ending in ⊥`;
      col.status.textContent = !fin ? '' : found ? `⊥ found in round ${r.empty!.round}` : r.gen.length ? 'stops: nothing new' : 'cannot start';
      col.status.setAttribute('class', `lgr-st ${found ? 'ok' : 'no'}`);
    });
    run.textContent = running ? '⏸ Pause' : t ? (t >= total() ? '↺ Run again' : '⏵ Continue') : '⏵ Run';
    explain();
  }

  function explain() {
    const done = t >= total(), cse = CASES[ci], horn = isHorn([...cse.kb, ...cse.q].map(split));
    const key = `${ci}${done}${t > 0}`;
    if (key === said) return;
    said = key;
    let text: string;
    if (!done) text = `**${cse.name}.** The input clauses are numbered as in the exam; each column runs PL-RESOLUTION round by round (AIMA Fig. 7.13: resolve every allowed pair, add the new clauses, repeat), ` +
      'but resolves only the pairs its strategy allows. The counter is the number of distinct new clauses (tautologies dropped). Press **Run** or **Show the end**.';
    else {
      const res = runs.map((r, j) => `${STRATS[j].name} ${r.empty ? `**${r.gen.length - 1}**` : `**fails** (${r.gen.length} clauses)`}`).join(', ');
      const fails = STRATS.filter((_, j) => !runs[j].empty).map(x => x.name), a = runs[3].gen.length, b = runs[0].gen.length;
      const sosVsPlain = a < b ? `here it generates ${b - a} fewer clauses than plain resolution` : a === b ? 'here it generates as many clauses as plain resolution' : 'here it generates more clauses than plain resolution';
      text = `Clauses generated before $\\bot$: ${res}. ` +
        (fails.length ? `${fails.join(' and ').replace(/^./, ch => ch.toUpperCase())} cannot reach $\\bot$ although the clauses are unsatisfiable: ${horn ? '' : 'the set is not Horn, and '}these strategies are complete only for Horn clauses. ` +
          (runs[1].gen.length === 0 ? 'Unit resolution cannot even start: no clause is a unit. ' : '') +
          (fails.includes('input resolution') ? 'Input resolution would need two derived clauses (like $A$ and $\\neg A$) as parents. ' : '')
          : horn ? 'All four succeed: on Horn clauses unit and input resolution are complete. '
            : 'All four succeed, although the set is not Horn: completeness is only guaranteed for Horn clauses, but a proof may exist anyway (exam 14 Jun 2023). ') +
        `Set of support only resolves with the negated query and its descendants: ${sosVsPlain}.`;
    }
    c.cap.innerHTML = md(text);
    if (done) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  load(0);
  return { destroy: pause };
}

const CSS = `
.lgr-col{fill:var(--panel-2);stroke:var(--border)}
.lgr-name{font-size:14px;font-weight:650;fill:var(--text)}
.lgr-big{font:700 20px var(--mono);fill:var(--accent)}
.lgr-l{font:12px var(--mono);fill:var(--text-2)}
.lgr-l.new{fill:var(--accent)}
.lgr-l.bot{fill:var(--ok);font-weight:700}
.lgr-st{font-size:12.5px;font-weight:650}
.lgr-st.ok{fill:var(--ok)}
.lgr-st.no{fill:var(--bad)}
.lgr-in{font:12.5px var(--mono);fill:var(--text)}
.lgr-q{font:12.5px var(--mono);fill:var(--warn)}
`;
