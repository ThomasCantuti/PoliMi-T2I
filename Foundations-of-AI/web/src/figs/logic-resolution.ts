// Resolution refutation of KB ⊨ R (exams 14 Jul 2022, 16 Jan 2025): the proof of logic.md drawn as a derivation tree.
// The pairs come from the theory's table; every resolvent is computed.
import { arrow, card, s, stepper, style, type FigOptions, type Frame } from './shell';

type Clause = { id: string; lits: string[]; from: string };
const INPUT: Clause[] = [
  { id: '1', lits: ['P'], from: 'KB' }, { id: '2', lits: ['¬P', '¬Q', 'R'], from: 'KB' }, { id: '3a', lits: ['¬S', 'Q'], from: 'KB' },
  { id: '3b', lits: ['¬T', 'Q'], from: 'KB' }, { id: '4', lits: ['T'], from: 'KB' }, { id: '5', lits: ['¬R'], from: '¬ query' },
];
const PROOF: [string, string][] = [['2', '5'], ['1', '6'], ['3b', '7'], ['4', '8']]; // (partner, clause derived last) as in the table

const neg = (l: string) => (l.startsWith('¬') ? l.slice(1) : '¬' + l);
const text = (lits: string[]) => (lits.length ? lits.join(' ∨ ') : '⊥');
const tex = (lits: string[]) => (lits.length ? lits.join(' \\vee ').replace(/¬/g, '\\neg ') : '\\bot');

/** Resolves a and b on their (single) complementary pair; factoring keeps one copy of each literal. */
export function resolve(a: string[], b: string[]): { lits: string[]; on: string } {
  const on = a.find(l => b.includes(neg(l)))!;
  return { lits: [...new Set([...a.filter(l => l !== on), ...b.filter(l => l !== neg(on))])], on: on.replace('¬', '') };
}

interface F extends Frame { k: number }

function build() {
  const all = [...INPUT], steps: { partner: Clause; last: Clause; out: Clause; on: string }[] = [];
  for (const [p, l] of PROOF) {
    const partner = all.find(c => c.id === p)!, last = all.find(c => c.id === l)!;
    const r = resolve(partner.lits, last.lits);
    const out = { id: String(all.length), lits: r.lits, from: `${p}, ${l}` }; // 6 input lines numbered 1–5 (3a, 3b): next is 6
    all.push(out);
    steps.push({ partner, last, out, on: r.on });
  }
  const frames: F[] = [{ k: 0, group: 'setup',
    cap: 'Write the KB in CNF, one numbered clause per line, and add the **negated query** $\\neg R$ (5). ' +
      'The goal is the empty clause $\\bot$: then $KB \\wedge \\neg R$ has no model.' }];
  steps.forEach((st, i) => {
    frames.push({ k: i + 1, group: 'resolve',
      cap: `**Step ${i + 1}:** resolve (${st.partner.id}) $${tex(st.partner.lits)}$ with (${st.last.id}) $${tex(st.last.lits)}$ on $${st.on}$: ` +
        `$${st.on}$ and $\\neg ${st.on}$ cancel, ${st.out.lits.length ? 'the rest is kept' : 'nothing is left'} → (${st.out.id}) $${tex(st.out.lits)}$.` +
        (st.out.lits.length ? '' : ` **Empty clause:** $KB \\wedge \\neg R$ is unsatisfiable, so $KB \\models R$. ` +
          'Every step used a unit clause and an input clause: this is a unit **and** an input resolution proof. Clause 3a was never needed.') });
  });
  return { steps, all, frames };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lr-css', '.lr-b rect{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:fill .25s,stroke .25s}' +
    '.lr-b text{font-size:13px;fill:var(--text);text-anchor:middle}.lr-b .id{font-size:10.5px;fill:var(--muted);text-anchor:start}' +
    '.lr-b.cur rect{stroke:var(--accent);fill:var(--accent-soft)}.lr-b.bot rect{stroke:var(--ok);fill:var(--ok-soft)}' +
    '.lr-x{fill:var(--bad);font-weight:700}.lr-row{transition:opacity .3s}.lr-row.cur text{fill:var(--accent)}' +
    '.lr-hd{stroke:var(--border-strong)}');
  const { steps, all, frames } = build();
  const c = card(el, 'stepper', 'Resolution refutation: does KB entail R?', '0 0 720 356');
  const ah = arrow(c.svg);
  // left: the numbered clause table, as written in the exam
  [['#', 16], ['clause', 46], ['from', 190]].forEach(([h, x]) => s(c.svg, 'text', { x, y: 30, class: 'fg-m' }, String(h)));
  s(c.svg, 'line', { x1: 16, y1: 37, x2: 250, y2: 37, class: 'lr-hd' });
  const rows = all.map((cl, i) => {
    const g = s(c.svg, 'g', { class: 'lr-row' });
    s(g, 'text', { x: 16, y: 58 + i * 30, class: 'fg-t' }, cl.id);
    s(g, 'text', { x: 46, y: 58 + i * 30, class: 'fg-t', 'font-weight': 600 }, text(cl.lits));
    s(g, 'text', { x: 190, y: 58 + i * 30, class: 'fg-m' }, cl.from);
    return g;
  });
  // right: the staircase; row r has the clause derived last on the left and the input partner on the right
  const W = 112, H = 30, X = (r: number) => 320 + r * 65, Y = (r: number) => 30 + r * 72;
  const box = (x: number, y: number, cl: Clause) => {
    const g = s(c.svg, 'g', { class: 'lr-b' });
    s(g, 'rect', { x: x - W / 2, y, width: W, height: H, rx: 8 });
    const t = s(g, 'text', { x, y: y + 19.5 });
    s(g, 'text', { x: x - W / 2 + 2, y: y - 3, class: 'id' }, `(${cl.id})`);
    return { g, t, lits: cl.lits };
  };
  const paint = (b: { t: SVGTextElement; lits: string[] }, on: string | null) => {
    b.t.textContent = '';
    if (!b.lits.length) { s(b.t, 'tspan', { 'font-weight': 700 }, '⊥'); return; }
    b.lits.forEach((l, i) => {
      if (i) s(b.t, 'tspan', {}, ' ∨ ');
      s(b.t, 'tspan', on && l.replace('¬', '') === on ? { class: 'lr-x' } : {}, l);
    });
  };
  const left = [box(X(0), Y(0), steps[0].last), ...steps.map((st, r) => box(X(r + 1), Y(r + 1), st.out))];
  const right = steps.map((st, r) => box(X(r) + 130, Y(r), st.partner));
  const edges = steps.map((_, r) => [left[r], right[r]].map((_, j) =>
    s(c.svg, 'line', { x1: X(r) + j * 130, y1: Y(r) + H, x2: X(r + 1) + (j ? 14 : -14), y2: Y(r + 1) - 2, class: 'fg-e', 'marker-end': ah })));
  const ons = steps.map((st, r) => s(c.svg, 'text', { x: X(r + 1) - W / 2 - 8, y: Y(r + 1) + 19, class: 'fg-m', 'text-anchor': 'end' }, `on ${st.on}`));

  return stepper(c, frames, f => {
    rows.forEach((g, i) => { g.classList.toggle('hide', i >= INPUT.length + f.k); g.classList.toggle('cur', f.k > 0 && i === INPUT.length + f.k - 1); });
    left.forEach((b, r) => {
      b.g.classList.toggle('hide', r > f.k);
      b.g.classList.toggle('cur', r === f.k && !!b.lits.length);
      b.g.classList.toggle('bot', !b.lits.length);
      paint(b, r === f.k - 1 ? steps[r].on : null);
    });
    right.forEach((b, r) => { b.g.classList.toggle('hide', r >= f.k); paint(b, r === f.k - 1 ? steps[r].on : null); });
    edges.forEach((es, r) => es.forEach(e => { e.classList.toggle('hide', r >= f.k); e.classList.toggle('cur', r === f.k - 1); }));
    ons.forEach((t, r) => t.classList.toggle('hide', r >= f.k));
  }, opts);
}
