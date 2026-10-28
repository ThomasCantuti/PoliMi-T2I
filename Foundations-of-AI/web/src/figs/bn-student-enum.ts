// The two worked examples on the student network (exams 6 Feb 2024 and 12 Jul 2024, uncertainty.md §13.3.1): P(L1) by summing
// out D, K and G, then P(k1 | d1, g3) as a ratio of two sums. Stepper; every number comes from the CPTs of bn-student.
import { edge } from './bn-burglary';
import { CPT, NODE, PARENTS, type V } from './bn-student';
import { arrow, card, num, s, stepper, style, type FigOptions, type Frame } from './shell';

const p = (v: V, val: string, par: Partial<Record<V, string>> = {}) => {
  const row = PARENTS[v].reduce((r, q) => r * NODE[q][3].length + NODE[q][3].indexOf(par[q]!), 0);
  return CPT[v][row][NODE[v][3].indexOf(val)];
};
const DS = NODE.D[3], KS = NODE.K[3], GS = NODE.G[3];
const pg = (g: string) => DS.reduce((a, d) => a + KS.reduce((b, k) => b + p('D', d) * p('K', k) * p('G', g, { K: k, D: d }), 0), 0);
const sub = (x: string) => x.replace(/(\d)$/, '_$1');

interface F extends Frame { part: 0 | 1; used: V[]; obs: V[]; gone: V[]; cols: number; sum?: boolean; rows: number; ratio?: boolean }

function build(): F[] {
  const f: F[] = [];
  const terms = (g: string) => DS.flatMap(d => KS.map(k => `${p('D', d)} \\cdot ${p('K', k)} \\cdot ${p('G', g, { K: k, D: d })}`)).join(' + ');
  f.push({ part: 0, used: ['D', 'K', 'G', 'L'], obs: [], gone: ['T'], cols: 0, rows: 0, group: 'P(L1)',
    cap: '**Exam 6 Feb 2024:** $P(L_1) = \\sum_d \\sum_k \\sum_g P(d)\\,P(k)\\,P(g \\mid d, k)\\,P(L_1 \\mid g)$. **Test** is neither queried nor observed: ' +
      '$\\sum_s P(s \\mid k) = 1$, so it disappears. Group the sum by grade.' });
  GS.forEach((g, i) => f.push({ part: 0, used: ['D', 'K', 'G', 'L'], obs: [], gone: ['T'], cols: i + 1, rows: 0, group: 'P(L1)',
    cap: `$P(${sub(g)}) = \\sum_d \\sum_k P(d)\\,P(k)\\,P(${sub(g)} \\mid d, k) = ${terms(g)} = ${num(pg(g), 4)}$; ` +
      `times $P(L_1 \\mid ${sub(g)}) = ${p('L', 'L1', { G: g })}$: $${num(pg(g) * p('L', 'L1', { G: g }), 5)}$.` }));
  const tot = GS.reduce((a, g) => a + pg(g) * p('L', 'L1', { G: g }), 0);
  f.push({ part: 0, used: ['L'], obs: [], gone: ['T'], cols: 3, sum: true, rows: 0, group: 'P(L1)',
    cap: `**Add the three products:** $P(L_1) = ${GS.map(g => num(pg(g) * p('L', 'L1', { G: g }), 5)).join(' + ')} = ${num(tot, 4)} \\approx ${tot.toFixed(3)}$. ` +
      'Grade is hidden **between** Difficulty/Knowledge and Letter, so it must be summed, not dropped.' });
  const num1 = (k: string) => p('G', 'g3', { K: k, D: 'd1' }) * p('K', k) * p('D', 'd1');
  const den = KS.reduce((a, k) => a + num1(k), 0);
  f.push({ part: 1, used: ['D', 'K', 'G'], obs: ['D', 'G'], gone: ['T', 'L'], cols: 0, rows: 0, group: 'P(k1 | d1, g3)',
    cap: '**Exam 12 Jul 2024:** the course is hard ($d_1$), the student got a C ($g_3$). $P(k_1 \\mid d_1, g_3) = \\dfrac{P(g_3 \\wedge k_1 \\wedge d_1)}{P(d_1 \\wedge g_3)}$. ' +
      'Letter and Test are below the query and not observed: they sum to 1 and disappear.' });
  f.push({ part: 1, used: ['D', 'K', 'G'], obs: ['D', 'G'], gone: ['T', 'L'], cols: 0, rows: 1, group: 'P(k1 | d1, g3)',
    cap: `**Numerator:** $P(g_3 \\mid k_1, d_1)\\,P(k_1)\\,P(d_1) = ${p('G', 'g3', { K: 'k1', D: 'd1' })} \\cdot ${p('K', 'k1')} \\cdot ${p('D', 'd1')} = ${num(num1('k1'), 4)}$. A joint, not yet the answer.` });
  f.push({ part: 1, used: ['D', 'K', 'G'], obs: ['D', 'G'], gone: ['T', 'L'], cols: 0, rows: 2, group: 'P(k1 | d1, g3)',
    cap: `**Denominator:** sum the same product over both values of K: $${num(p('G', 'g3', { K: 'k0', D: 'd1' }))} \\cdot ${p('K', 'k0')} \\cdot ${p('D', 'd1')} + ${num(num1('k1'), 4)} = ` +
      `${num(num1('k0'), 4)} + ${num(num1('k1'), 4)} = ${num(den, 4)}$.` });
  f.push({ part: 1, used: ['K'], obs: ['D', 'G'], gone: ['T', 'L'], cols: 0, rows: 2, ratio: true, group: 'P(k1 | d1, g3)',
    cap: `**$P(k_1 \\mid d_1, g_3) = ${num(num1('k1'), 4)} / ${num(den, 4)} = ${(num1('k1') / den).toFixed(3)}$**, down from the prior $P(k_1) = ${p('K', 'k1')}$: ` +
      'the C makes high knowledge much less likely. $P(d_1)$ appears in every term and cancels.' });
  return f;
}

const POS: Record<V, [number, number]> = { D: [70, 50], K: [230, 50], G: [150, 140], T: [290, 140], L: [150, 230] };

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-bn-student-enum-css', CSS);
  const tot = GS.reduce((a, g) => a + pg(g) * p('L', 'L1', { G: g }), 0);
  if (tot.toFixed(3) !== '0.360') console.error(`bn-student-enum: P(L1) = ${tot}, uncertainty.md says 0.360`);
  const c = card(el, 'stepper', 'Enumeration on the student network: P(L1), then P(k1 | d1, g3)', '0 0 760 280');
  const ah = arrow(c.svg);
  for (const v of Object.keys(PARENTS) as V[]) for (const q of PARENTS[v]) edge(c.svg, POS[q], POS[v], ah);
  const nodes = Object.fromEntries((Object.keys(POS) as V[]).map(v => {
    const g = s(c.svg, 'g', { class: 'fg-nd' });
    s(g, 'rect', { x: POS[v][0] - 52, y: POS[v][1] - 18, width: 104, height: 36, rx: 18 });
    s(g, 'text', { x: POS[v][0], y: POS[v][1] + 4.5 }, NODE[v][2]);
    return [v, g];
  })) as Record<V, SVGGElement>;
  const right = s(c.svg, 'g');
  const t = (x: number, y: number, str: string, cls = 'ucg-n', anchor = 'start') => s(right, 'text', { x, y, class: cls, 'text-anchor': anchor }, str);

  return stepper(c, build(), f => {
    for (const v of Object.keys(nodes) as V[])
      nodes[v].setAttribute('class', `fg-nd${f.obs.includes(v) ? ' obs' : f.used.includes(v) ? ' cur' : ''}${f.gone.includes(v) ? ' ucg-gone' : ''}`);
    right.replaceChildren();
    if (f.part === 0) {
      t(380, 40, 'P(L1) grouped by grade', 'fg-h2');
      ['P(g)', 'P(L1 | g)', 'product'].forEach((r, i) => t(380, 100 + i * 34, r, 'fg-t'));
      GS.forEach((g, i) => {
        const x = 540 + i * 80, on = i < f.cols;
        t(x, 70, g, 'fg-m', 'middle');
        if (!on) return;
        t(x, 100, num(pg(g), 4), 'ucg-n', 'middle');
        t(x, 134, String(p('L', 'L1', { G: g })), 'ucg-n', 'middle');
        t(x, 168, num(pg(g) * p('L', 'L1', { G: g }), 5), 'ucg-n ok', 'middle');
      });
      if (f.sum) t(380, 220, `P(L1) = ${num(tot, 4)} ≈ ${tot.toFixed(3)}`, 'ucg-big');
    } else {
      t(380, 40, 'P(k1 | d1, g3) = numerator / denominator', 'fg-h2');
      KS.forEach((k, i) => {
        if (f.rows < (k === 'k1' ? 1 : 2)) return;
        const v = p('G', 'g3', { K: k, D: 'd1' }) * p('K', k) * p('D', 'd1');
        t(380, 90 + i * 32, `${k}: P(g3 | ${k}, d1) · P(${k}) · P(d1) = ${num(v, 4)}`, k === 'k1' ? 'ucg-n ok' : 'ucg-n');
      });
      const den = KS.reduce((a, k) => a + p('G', 'g3', { K: k, D: 'd1' }) * p('K', k) * p('D', 'd1'), 0), n1 = p('G', 'g3', { K: 'k1', D: 'd1' }) * p('K', 'k1') * p('D', 'd1');
      if (f.rows >= 2) t(380, 168, `denominator = ${num(den, 4)}`, 'ucg-n');
      if (f.ratio) t(380, 220, `P(k1 | d1, g3) = ${(n1 / den).toFixed(3)}  (prior 0.3)`, 'ucg-big');
    }
  }, opts);
}

const CSS = `
.ucg-n{font:600 13px var(--mono);fill:var(--text)}
.ucg-n.ok{fill:var(--ok)}
.ucg-big{font:700 16px var(--mono);fill:var(--accent)}
.fg-nd.ucg-gone{opacity:.3}
`;
