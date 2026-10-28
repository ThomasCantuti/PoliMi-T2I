// The dentist full joint distribution (AIMA Figure 12.3, uncertainty.md §12.2–12.4): pick an event and the evidence,
// the cells that are summed light up and P(A | B) is computed from them. Also exports the table to bn-bayes.
import { bar, card, md, num, s, style, type FigOptions } from './shell';

export type Var = 'Cavity' | 'Toothache' | 'Catch';
export const VARS: Var[] = ['Cavity', 'Toothache', 'Catch'];
const LIT: Record<Var, string> = { Cavity: 'cavity', Toothache: 'toothache', Catch: 'catch' };
/** P(cavity?, toothache?, catch?), index 0 = true, 1 = false (AIMA Figure 12.3). */
export const JOINT = [[[0.108, 0.012], [0.072, 0.008]], [[0.016, 0.064], [0.144, 0.576]]];
export type Event = Partial<Record<Var, 0 | 1>>;

const CELLS = [0, 1].flatMap(cv => [0, 1].flatMap(t => [0, 1].map(k => ({ Cavity: cv, Toothache: t, Catch: k, p: JOINT[cv][t][k] }))));
const holds = (c: (typeof CELLS)[number], e: Event) => VARS.every(v => e[v] === undefined || e[v] === c[v]);
/** P(e) by summing the cells of the full joint, with the terms that were added. */
export function prob(e: Event) {
  const terms = CELLS.filter(c => holds(c, e)).map(c => c.p);
  return { p: terms.reduce((a, b) => a + b, 0), terms };
}
const lit = (v: Var, x: 0 | 1) => (x ? '¬' : '') + LIT[v];
const name = (e: Event) => VARS.filter(v => e[v] !== undefined).map(v => lit(v, e[v]!)).join(' ∧ ') || 'true';
const tex = (t: string) => t.replace(/¬/g, '\\neg ').replace(/∧/g, '\\wedge');

const PRESETS: [string, Event, Event][] = [
  ['P(cavity)', { Cavity: 0 }, {}],
  ['P(toothache)', { Toothache: 0 }, {}],
  ['P(cavity | toothache)', { Cavity: 0 }, { Toothache: 0 }],
  ['Toothache ⫫ Catch?', { Toothache: 0, Catch: 0 }, {}],
  ['… given cavity?', { Toothache: 0, Catch: 0 }, { Cavity: 0 }],
];
const X0 = 150, CW = 140, Y0 = 70, RH = 40;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-bn-joint-css', CSS);
  const chk = [prob({ Cavity: 0 }).p, prob({ Cavity: 0, Toothache: 0 }).p / prob({ Toothache: 0 }).p, prob({ Toothache: 0, Catch: 0 }).p].map(x => +x.toFixed(3));
  if (chk.join() !== '0.2,0.6,0.124') console.error(`bn-joint: ${chk}, uncertainty.md says P(cavity) = 0.2, P(cavity | toothache) = 0.6, P(toothache ∧ catch) = 0.124`);
  const c = card(el, 'interactive', 'The full joint distribution: pick an event and the evidence', '0 0 760 290');
  // two header rows (toothache, then catch), two rows (cavity), one cell per atomic event
  [0, 1].forEach(t => s(c.svg, 'text', { x: X0 + (t * 2 + 1) * CW, y: 28, class: 'fg-t', 'text-anchor': 'middle' }, lit('Toothache', t as 0 | 1)));
  [0, 1, 2, 3].forEach(k => s(c.svg, 'text', { x: X0 + k * CW + CW / 2, y: 54, class: 'fg-m', 'text-anchor': 'middle' }, lit('Catch', (k % 2) as 0 | 1)));
  [0, 1].forEach(cv => s(c.svg, 'text', { x: X0 - 12, y: Y0 + cv * RH + RH / 2 + 5, class: 'fg-t', 'text-anchor': 'end' }, lit('Cavity', cv as 0 | 1)));
  const cell = CELLS.map(cl => {
    const x = X0 + (cl.Toothache * 2 + cl.Catch) * CW, y = Y0 + cl.Cavity * RH, g = s(c.svg, 'g', { class: 'uca-c' });
    s(g, 'rect', { x: x + 2, y: y + 2, width: CW - 4, height: RH - 4, rx: 6 });
    s(g, 'text', { x: x + CW / 2, y: y + RH / 2 + 5, 'text-anchor': 'middle' }, String(cl.p));
    return g;
  });
  const lines = [0, 1, 2, 3].map(k => s(c.svg, 'text', { x: 30, y: 196 + k * 26, class: k === 2 ? 'uca-res' : 'uca-l' }));
  const legend = s(c.svg, 'text', { x: X0 + 4 * CW, y: Y0 + 2 * RH + 20, class: 'fg-m', 'text-anchor': 'end' });

  let A: Event = { Cavity: 0 }, B: Event = { Toothache: 0 };
  const rows = [bar(c), bar(c)], presets = bar(c);
  const sel = rows.map((row, r) => {
    row.insertAdjacentHTML('beforeend', `<span class="uca-lab">${r ? 'given' : 'event'}</span>`);
    return VARS.map(v => {
      const e = document.createElement('select');
      e.setAttribute('aria-label', `${r ? 'evidence' : 'event'}: ${v}`);
      e.innerHTML = `<option value="">${v}: any</option><option value="0">${lit(v, 0)}</option><option value="1">${lit(v, 1)}</option>`;
      e.onchange = () => {
        const ev = r ? B : A;
        if (e.value === '') delete ev[v]; else ev[v] = +e.value as 0 | 1;
        render(true);
      };
      row.append(e);
      return e;
    });
  });
  for (const [label, a, b] of PRESETS) {
    const btn = document.createElement('button');
    btn.className = 'btn sm';
    btn.textContent = label;
    btn.onclick = () => { A = { ...a }; B = { ...b }; render(true); };
    presets.append(btn);
  }

  function render(say = false) {
    VARS.forEach((v, i) => { sel[0][i].value = String(A[v] ?? ''); sel[1][i].value = String(B[v] ?? ''); });
    const AB = { ...A, ...B }, clash = VARS.some(v => A[v] !== undefined && B[v] !== undefined && A[v] !== B[v]);
    const given = Object.keys(B).length > 0, pb = prob(B), pab = clash ? { p: 0, terms: [] } : prob(AB);
    CELLS.forEach((cl, i) => {
      const inB = holds(cl, B), inA = inB && !clash && holds(cl, A);
      cell[i].setAttribute('class', `uca-c${inA ? ' in' : given && inB ? ' ev' : ' out'}`);
    });
    legend.textContent = given ? 'blue: A ∧ B (numerator) · amber: B only · together: P(B)' : 'blue: the cells where A holds';
    const sum = (t: { p: number; terms: number[] }) => (t.terms.length > 1 ? `${t.terms.join(' + ')} = ` : '') + num(t.p, 4);
    const a = name(A), b = name(B), post = pb.p ? pab.p / pb.p : 0;
    lines[0].textContent = given ? `P(${b}) = ${sum(pb)}` : '';
    lines[1].textContent = `P(${given ? `${a} ∧ ${b}` : a}) = ${clash ? '0 (A contradicts B)' : sum(pab)}`;
    lines[2].textContent = given ? `P(${a} | ${b}) = ${num(pab.p, 4)} / ${num(pb.p, 4)} = ${num(post, 3)}` : `P(${a}) = ${num(pab.p, 3)}`;
    // independence check: is P(A | B) the product of the P(literal | B)?
    const set = VARS.filter(v => A[v] !== undefined && B[v] === undefined);
    let check = '';
    if (set.length === 2 && !clash) {
      const each = set.map(v => prob({ ...B, [v]: A[v] }).p / pb.p), prod = each[0] * each[1], same = Math.abs(prod - post) < 1e-9;
      lines[3].textContent = `P(${lit(set[0], A[set[0]]!)}${given ? ` | ${b}` : ''}) · P(${lit(set[1], A[set[1]]!)}${given ? ` | ${b}` : ''}) = ` +
        `${num(each[0], 3)} · ${num(each[1], 3)} = ${num(prod, 3)} ${same ? '=' : '≠'} ${num(post, 3)}`;
      lines[3].setAttribute('class', `uca-l ${same ? 'yes' : 'no'}`);
      check = same
        ? ` The product of the two single probabilities gives the same number: $${set.map(v => LIT[v]).join('$ and $')}$ are **independent${given ? ` given $${tex(b)}$` : ''}**.`
        : ` The product of the two single probabilities is different: $${set.map(v => LIT[v]).join('$ and $')}$ are **not independent${given ? ` given $${tex(b)}$` : ''}**.`;
    } else lines[3].textContent = '';
    const one = set.length === 1 && Object.keys(A).length === 1 && given && !clash ? set[0] : null;
    const vec = one ? [0, 1].map(x => prob({ ...B, [one]: x as 0 | 1 }).p) : [];
    const text = !given
      ? `**Marginalization:** $P(${tex(a)}) = ${num(pab.p, 3)}$ is the sum of the ${pab.terms.length} cells where it holds; the variables you do not mention are summed out.${check}`
      : clash ? '**The event contradicts the evidence:** no cell satisfies both, so the probability is 0.'
      : `**Conditioning:** keep only the ${pb.terms.length} cells where $${tex(b)}$ holds (they sum to $P(${tex(b)}) = ${num(pb.p, 3)}$), then take the share where $${tex(a)}$ also holds: ` +
        `$P(${tex(a)} \\mid ${tex(b)}) = ${num(pab.p, 4)} / ${num(pb.p, 4)} = ${num(post, 3)}$.` +
        (one ? ` With the normalization constant: $\\mathbf{P}(${one} \\mid ${tex(b)}) = \\alpha\\langle ${vec.map(x => num(x, 4)).join(', ')} \\rangle = \\langle ${vec.map(x => num(x / pb.p, 3)).join(', ')} \\rangle$.` : '') + check;
    c.cap.innerHTML = md(text);
    if (say) opts.onEvent?.(`[${c.title}] ${lines.map(l => l.textContent).filter(Boolean).join('; ')}`);
  }
  render();
  return { destroy() {} };
}

const CSS = `
.uca-c rect{fill:var(--panel-2);stroke:var(--border);transition:fill .25s,stroke .25s,opacity .25s}
.uca-c text{font:600 15px var(--mono);fill:var(--text);transition:opacity .25s}
.uca-c.in rect{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2}
.uca-c.in text{fill:var(--accent)}
.uca-c.ev rect{fill:var(--warn-soft);stroke:var(--warn)}
.uca-c.out{opacity:.4}
.uca-l{font:13px var(--mono);fill:var(--text-2)}
.uca-l.yes{fill:var(--ok)}
.uca-l.no{fill:var(--bad)}
.uca-res{font:600 15px var(--mono);fill:var(--text)}
.uca-lab{font-size:12.5px;color:var(--muted);min-width:42px}
`;
