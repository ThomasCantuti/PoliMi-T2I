// Forward chaining (PL-FC-ENTAILS?, AIMA Fig. 7.15) on the AIMA example of logic.md, run for real: one frame per pop.
import { arrow, card, s, stepper, style, type FigOptions, type Frame } from './shell';

const RULES: { p: string[]; c: string }[] = [
  { p: ['P'], c: 'Q' }, { p: ['L', 'M'], c: 'P' }, { p: ['B', 'L'], c: 'M' }, { p: ['A', 'P'], c: 'L' }, { p: ['A', 'B'], c: 'L' },
];
const FACTS = ['A', 'B'], QUERY = 'Q';
const SYM: Record<string, [number, number]> = { A: [50, 110], B: [50, 250], L: [230, 180], M: [420, 250], P: [590, 180], Q: [715, 180] };
const RULE_AT: [number, number][] = [[655, 180], [505, 180], [325, 250], [330, 75], [140, 180]];
const name = (r: { p: string[]; c: string }) => `${r.p.join(' ∧ ')} ⇒ ${r.c}`;
const tex = (r: { p: string[]; c: string }) => `${r.p.join(' \\wedge ')} \\Rightarrow ${r.c}`;

interface F extends Frame { count: number[]; dec: number[]; inferred: string[]; queue: string[]; cur: string; done: boolean }

function build(): F[] {
  const count = RULES.map(r => r.p.length), inferred = new Set<string>(), queue = [...FACTS];
  const frames: F[] = [{ count: [...count], dec: [], inferred: [], queue: [...queue], cur: '', done: false, group: 'start',
    cap: `**Start.** Each rule's counter is the number of its premises. The queue holds the known facts ${FACTS.join(', ')}; the query is ${QUERY}.` }];
  while (queue.length) {
    const p = queue.shift()!;
    if (p === QUERY) {
      frames.push({ count: [...count], dec: [], inferred: [...inferred], queue: [...queue], cur: p, done: true, group: 'pop',
        cap: `**Pop ${p}.** It is the query: return **true**, $KB \\models ${QUERY}$. Popped in the order ${[...inferred, p].join(', ')}` +
          (queue.length ? `; ${queue.join(', ')} is still in the queue and never popped.` : '.') });
      return frames;
    }
    if (inferred.has(p)) continue; // already inferred: skipped (does not happen before the query here)
    inferred.add(p);
    const dec: number[] = [], notes: string[] = [];
    RULES.forEach((r, i) => {
      if (!r.p.includes(p)) return;
      count[i]--;
      dec.push(i);
      notes.push(`$${tex(r)}$ (${count[i] + 1} → ${count[i]})`);
      if (count[i] === 0) queue.push(r.c);
    });
    const fired = dec.filter(i => count[i] === 0).map(i => RULES[i]);
    frames.push({ count: [...count], dec, inferred: [...inferred], queue: [...queue], cur: p, done: false, group: 'pop',
      cap: `**Pop ${p}.** Not the query: mark it inferred. ` +
        (notes.length ? `${p} is a premise of ${notes.join(' and ')}.` : `${p} is no rule's premise.`) +
        (fired.length ? ` Counter at 0: ${fired.length > 1 ? 'both rules fire' : 'the rule fires'}, add ${fired.map(r => r.c + (inferred.has(r.c) ? ` (already inferred)` : '')).join(' and ')} to the queue.` : '') +
        ` Queue: [${queue.join(', ')}].` });
  }
  frames.push({ count: [...count], dec: [], inferred: [...inferred], queue: [], cur: '', done: false, group: 'end', cap: 'Queue empty: return **false**.' });
  return frames;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fc-css', '.fc-s circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .25s,stroke .25s}' +
    '.fc-s text{font-size:14px;font-weight:700;fill:var(--text);text-anchor:middle;pointer-events:none}' +
    '.fc-s.q circle{stroke:var(--warn);stroke-width:3}.fc-s.inf circle{fill:var(--ok-soft);stroke:var(--ok)}' +
    '.fc-s.cur circle{fill:var(--accent);stroke:var(--accent)}.fc-s.cur text{fill:#fff}.fc-s.goal circle{stroke-dasharray:4 3}' +
    '.fc-r circle{fill:var(--panel);stroke:var(--border-strong);stroke-width:1.5;transition:fill .25s,stroke .25s}' +
    '.fc-r text{font:700 13px var(--mono);fill:var(--text-2);text-anchor:middle}.fc-r.dec circle{stroke:var(--warn);stroke-width:2.5}' +
    '.fc-r.fired circle{fill:var(--ok);stroke:var(--ok)}.fc-r.fired text{fill:#fff}.fc-l{font-size:11.5px;fill:var(--muted);text-anchor:middle}');
  const frames = build();
  const c = card(el, 'stepper', 'Forward chaining: counters go down until the query is popped', '0 0 760 330');
  const ah = arrow(c.svg);
  const at = (a: [number, number], b: [number, number], ra: number, rb: number) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
    return { x1: a[0] + ux * ra, y1: a[1] + uy * ra, x2: b[0] - ux * rb, y2: b[1] - uy * rb };
  };
  const prem = RULES.map((r, i) => r.p.map(p => s(c.svg, 'line', { ...at(SYM[p], RULE_AT[i], 18, 16), class: 'fg-e' })));
  const concl = RULES.map((r, i) => s(c.svg, 'line', { ...at(RULE_AT[i], SYM[r.c], 16, 21), class: 'fg-e', 'marker-end': ah }));
  const rules = RULES.map((r, i) => {
    const [x, y] = RULE_AT[i], g = s(c.svg, 'g', { class: 'fc-r' });
    s(g, 'circle', { cx: x, cy: y, r: 15 });
    s(c.svg, 'text', { x, y: i === 1 ? y + 32 : y - 22, class: 'fc-l' }, name(r)); // L ∧ M ⇒ P: below, clear of the P → A ∧ P ⇒ L edge
    return { g, t: s(g, 'text', { x, y: y + 4.5 }) };
  });
  const syms = Object.entries(SYM).map(([k, [x, y]]) => {
    const g = s(c.svg, 'g', { class: 'fc-s' + (k === QUERY ? ' goal' : '') });
    s(g, 'circle', { cx: x, cy: y, r: 18 });
    s(g, 'text', { x, y: y + 5 }, k);
    return [k, g] as const;
  });
  s(c.svg, 'text', { x: SYM[QUERY][0], y: SYM[QUERY][1] + 36, class: 'fc-l' }, 'query');
  FACTS.forEach(f => s(c.svg, 'text', { x: SYM[f][0], y: SYM[f][1] + 36, class: 'fc-l' }, 'fact'));
  const qTxt = s(c.svg, 'text', { x: 16, y: 312, class: 'fg-t' });
  const iTxt = s(c.svg, 'text', { x: 330, y: 312, class: 'fg-t' });

  return stepper(c, frames, f => {
    rules.forEach((r, i) => {
      r.t.textContent = String(f.count[i]);
      r.g.setAttribute('class', 'fc-r' + (f.count[i] === 0 ? ' fired' : f.dec.includes(i) ? ' dec' : ''));
      prem[i].forEach((e, j) => e.setAttribute('class', 'fg-e' + (f.inferred.includes(RULES[i].p[j]) ? ' act' : '')));
      concl[i].setAttribute('class', 'fg-e' + (f.count[i] === 0 ? ' act' : ''));
    });
    for (const [k, g] of syms)
      g.setAttribute('class', 'fc-s' + (k === QUERY ? ' goal' : '') + (k === f.cur ? ' cur' : f.inferred.includes(k) ? ' inf' : f.queue.includes(k) ? ' q' : ''));
    qTxt.textContent = `queue: [${f.queue.join(', ')}]`;
    iTxt.textContent = `inferred: {${f.inferred.join(', ')}}`;
  }, opts);
}
