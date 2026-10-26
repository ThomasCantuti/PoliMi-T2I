// Inference by enumeration of P(B | j, m) on the burglary network (AIMA Figure 13.8): stepper. Every number comes from the CPTs.
import { P } from './bn-burglary';
import { arrow, card, num, s, stepper, style, type FigOptions, type Frame } from './shell';

const TF = [true, false];
const neg = (name: string, v: boolean) => (v ? '' : '¬') + name;
const path = (e: boolean, a: boolean, b: boolean) => P('A', a, { B: b, E: e }) * P('J', true, { A: a }) * P('M', true, { A: a });
const sumE = (e: boolean, b: boolean) => P('E', e, {}) * TF.reduce((t, a) => t + path(e, a, b), 0);
const joint = (b: boolean) => P('B', b, {}) * TF.reduce((t, e) => t + sumE(e, b), 0);

interface F extends Frame { b: boolean; cols: number; es: number; root: boolean; hi: [number, number] | null; norm?: boolean }

function build(): F[] {
  const f: F[] = [{ b: true, cols: 0, es: 0, root: false, hi: null, group: 'b',
    cap: 'ENUMERATE-ALL walks this tree depth-first: **multiply** down each path, **add** at each $+$. ' +
      '$P(b, j, m) = P(b)\\sum_e P(e)\\sum_a P(a \\mid b, e)\\,P(j \\mid a)\\,P(m \\mid a)$' }];
  let cols = 0;
  TF.forEach((e, ei) => {
    TF.forEach((a, ai) => {
      cols++;
      f.push({ b: true, cols, es: ei, root: false, hi: [ei, ai], group: 'b',
        cap: `Path ${neg('e', e)}, ${neg('a', a)}: $P(${neg('a', a)} \\mid b, ${neg('e', e)})\\,P(j \\mid ${neg('a', a)})\\,P(m \\mid ${neg('a', a)}) = ` +
          `${num(P('A', a, { B: true, E: e }))} \\cdot ${num(P('J', true, { A: a }))} \\cdot ${num(P('M', true, { A: a }))} = ${num(path(e, a, true))}$` });
    });
    f.push({ b: true, cols, es: ei + 1, root: false, hi: null, group: 'b',
      cap: `Add the two paths under ${neg('e', e)} and multiply by $P(${neg('e', e)})$: $${num(P('E', e, {}))} \\cdot (${num(path(e, true, true))} + ${num(path(e, false, true))}) = ${num(sumE(e, true))}$` });
  });
  f.push({ b: true, cols, es: 2, root: true, hi: null, group: 'b',
    cap: `Add the two branches and multiply by $P(b)$: $${num(P('B', true, {}))} \\cdot (${num(sumE(true, true))} + ${num(sumE(false, true))}) = \\mathbf{${num(joint(true), 5)}}$` });
  f.push({ b: false, cols, es: 2, root: true, hi: null, group: '¬b',
    cap: `The same tree for $\\neg b$ (only the numbers change: $P(\\neg b) = ${num(P('B', false, {}))}$, $P(a \\mid \\neg b, e) = ${P('A', true, { B: false, E: true })}$, ` +
      `$P(a \\mid \\neg b, \\neg e) = ${P('A', true, { B: false, E: false })}$): $P(\\neg b, j, m) = \\mathbf{${num(joint(false), 5)}}$. ` +
      'The products $P(j \\mid a)\\,P(m \\mid a)$ are recomputed under every branch: that repeated work is why enumeration takes $O(2^n)$ time.' });
  const z = joint(true) + joint(false);
  f.push({ b: false, cols, es: 2, root: true, hi: null, norm: true, group: 'normalize',
    cap: `**Normalize:** $\\alpha = 1 / (${num(joint(true), 5)} + ${num(joint(false), 5)})$, so $\\mathbf{P}(B \\mid j, m) = \\langle ${num(joint(true) / z, 3)}, ${num(joint(false) / z, 3)} \\rangle$.` });
  return f;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-en-css', '.en-n rect{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:stroke .25s,fill .25s}' +
    '.en-n.cur rect{stroke:var(--accent);fill:var(--accent-soft)}.en-n text{font:12px var(--mono);fill:var(--text);text-anchor:middle}' +
    '.en-plus circle{fill:var(--panel);stroke:var(--border-strong)}.en-plus text{font-size:14px;font-weight:700;fill:var(--text-2);text-anchor:middle}' +
    '.en-r{font:600 12px var(--mono);fill:var(--ok);transition:opacity .3s}');
  const c = card(el, 'stepper', 'Inference by enumeration: P(B | j, m)', '0 0 700 420');
  const ah = arrow(c.svg);
  const X = [[95, 265], [435, 605]], XE = [180, 520], Y = [40, 115, 190, 265, 340];
  const box = (x: number, y: number) => {
    const g = s(c.svg, 'g', { class: 'en-n' });
    s(g, 'rect', { x: x - 79, y: y - 15, width: 158, height: 30, rx: 8 });
    return { g, t: s(g, 'text', { x, y: y + 4.5 }) };
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => s(c.svg, 'line', { x1, y1: y1 + 15, x2, y2: y2 - 18, class: 'fg-e', 'marker-end': ah });
  const plus = (x: number, y: number) => { const g = s(c.svg, 'g', { class: 'en-plus' }); s(g, 'circle', { cx: x, cy: y, r: 10 }); s(g, 'text', { x, y: y + 5 }, '+'); };
  const eEdge = XE.map(x => line(350, Y[0], x, Y[1]));
  const aEdge = X.map((xs, ei) => xs.map(x => line(XE[ei], Y[1], x, Y[2])));
  const jEdge = X.map(xs => xs.map(x => line(x, Y[2], x, Y[3])));
  const mEdge = X.map(xs => xs.map(x => line(x, Y[3], x, Y[4])));
  plus(350, 78);
  XE.forEach(x => plus(x, 153));
  const root = box(350, Y[0]), eN = XE.map(x => box(x, Y[1]));
  const aN = X.map(xs => xs.map(x => box(x, Y[2]))), jN = X.map(xs => xs.map(x => box(x, Y[3]))), mN = X.map(xs => xs.map(x => box(x, Y[4])));
  const colR = X.flat().map(x => s(c.svg, 'text', { x, y: 384, class: 'en-r', 'text-anchor': 'middle' }));
  const eR = XE.map(x => s(c.svg, 'text', { x: x + 86, y: Y[1] + 5, class: 'en-r' }));
  const rootR = s(c.svg, 'text', { x: 432, y: Y[0] + 5, class: 'en-r' });
  const normR = s(c.svg, 'text', { x: 350, y: 410, class: 'en-r', 'text-anchor': 'middle' });

  return stepper(c, build(), f => {
    const b = f.b, B = b ? 'b' : '¬b';
    root.t.textContent = `P(${B}) = ${num(P('B', b, {}))}`;
    TF.forEach((e, ei) => {
      eN[ei].t.textContent = `P(${neg('e', e)}) = ${num(P('E', e, {}))}`;
      TF.forEach((a, ai) => {
        const on = !!f.hi && f.hi[0] === ei && f.hi[1] === ai;
        aN[ei][ai].t.textContent = `P(${neg('a', a)}|${B},${neg('e', e)}) = ${num(P('A', a, { B: b, E: e }))}`;
        jN[ei][ai].t.textContent = `P(j|${neg('a', a)}) = ${num(P('J', true, { A: a }))}`;
        mN[ei][ai].t.textContent = `P(m|${neg('a', a)}) = ${num(P('M', true, { A: a }))}`;
        for (const n of [aN[ei][ai], jN[ei][ai], mN[ei][ai]]) n.g.classList.toggle('cur', on);
        for (const l of [aEdge[ei][ai], jEdge[ei][ai], mEdge[ei][ai]]) l.classList.toggle('cur', on);
        const k = ei * 2 + ai;
        colR[k].textContent = k < f.cols ? `= ${num(path(e, a, b))}` : '';
      });
      eEdge[ei].classList.toggle('cur', !!f.hi && f.hi[0] === ei);
      eR[ei].textContent = ei < f.es ? `= ${num(sumE(e, b))}` : '';
    });
    rootR.textContent = f.root ? `P(${B}, j, m) = ${num(joint(b), 5)}` : '';
    const z = joint(true) + joint(false);
    normR.textContent = f.norm ? `P(B | j, m) = ⟨${num(joint(true) / z, 3)}, ${num(joint(false) / z, 3)}⟩` : '';
  }, opts);
}
