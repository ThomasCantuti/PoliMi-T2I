// With chance nodes the magnitudes matter (slides p. 397): stepper. Each outcome leads to a MIN node whose leaves are
// equal, so it is drawn as its value. The chance values and the best move are computed.
import { arrow, card, label, num, s, stepper, style, type FigOptions, type Frame } from './shell';

const P = [0.9, 0.1];
const BEFORE = [[2, 3], [1, 4]];
const MAP: Record<number, number> = { 1: 1, 2: 20, 3: 30, 4: 400 };
const AFTER = BEFORE.map(r => r.map(v => MAP[v]));
const exp = (r: number[]) => r.reduce((t, v, i) => t + P[i] * v, 0);
const best = (t: number[][]) => (exp(t[0]) >= exp(t[1]) ? 0 : 1);
const sum = (t: number[][], a: number) => `${t[a].map((v, i) => `${P[i]}\\cdot ${v}`).join(' + ')} = ${num(exp(t[a]))}`;

interface F extends Frame { leaves: number[][]; values: boolean; changed: boolean }

const FRAMES: F[] = [
  { leaves: BEFORE, values: true, changed: false, group: 'original',
    cap: `**Original values.** $a_1$: $${sum(BEFORE, 0)}$; $a_2$: $${sum(BEFORE, 1)}$. MAX plays **$a_${best(BEFORE) + 1}$**.` },
  { leaves: AFTER, values: false, changed: true, group: 'transformed',
    cap: '**Transform the leaves** with $1 \\to 1,\\ 2 \\to 20,\\ 3 \\to 30,\\ 4 \\to 400$. The **order** is unchanged: ' +
      '$1 < 2 < 3 < 4$ and $1 < 20 < 30 < 400$. A deterministic game (max and min only) would make the same choice.' },
  { leaves: AFTER, values: true, changed: false, group: 'transformed',
    cap: `**Recompute the averages.** $a_1$: $${sum(AFTER, 0)}$; $a_2$: $${sum(AFTER, 1)}$. The best move flips to **$a_${best(AFTER) + 1}$**: ` +
      'with chance nodes $e(s)$ must be a positive **linear** transformation of the expected utility, not just keep the order.' },
];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-vm-css', CSS);
  const c = card(el, 'stepper', 'Values matter: an order-preserving change flips the best move', '0 0 600 300');
  const ah = arrow(c.svg);
  const ROOT = [300, 46], CH = [[170, 146], [430, 146]], LEAF = [[110, 250], [230, 250], [370, 250], [490, 250]];
  const rootEdges = CH.map(([x, y], a) => {
    const e = s(c.svg, 'line', { x1: ROOT[0], y1: ROOT[1] + 14, x2: x, y2: y - 22, class: 'fg-e', 'marker-end': ah });
    label(c.svg, (ROOT[0] + x) / 2 + (a ? 26 : -26), (ROOT[1] + y) / 2 - 4, `a_{${a + 1}}`, { class: 'fg-t', 'text-anchor': 'middle' });
    return e;
  });
  LEAF.forEach(([x, y], k) => {
    const [cx, cy] = CH[k >> 1];
    s(c.svg, 'line', { x1: cx, y1: cy + 22, x2: x, y2: y - 18, class: 'fg-e' });
    s(c.svg, 'text', { x: (cx + x) / 2 + (k % 2 ? 12 : -12), y: (cy + y) / 2, class: 'fg-m', 'text-anchor': 'middle' }, String(P[k % 2]));
  });
  s(c.svg, 'path', { d: `M${ROOT[0]},${ROOT[1] - 17} L${ROOT[0] + 19},${ROOT[1] + 14} L${ROOT[0] - 19},${ROOT[1] + 14} Z`, class: 'vm-max' });
  s(c.svg, 'text', { x: ROOT[0] + 28, y: ROOT[1] + 9, class: 'fg-m' }, 'MAX');
  const chVal = CH.map(([x, y]) => {
    s(c.svg, 'circle', { cx: x, cy: y, r: 22, class: 'vm-ch' });
    return s(c.svg, 'text', { x, y: y + 5, class: 'vm-v' });
  });
  const leaf = LEAF.map(([x, y]) => {
    s(c.svg, 'rect', { x: x - 26, y: y - 18, width: 52, height: 36, rx: 8, class: 'vm-leaf' });
    return s(c.svg, 'text', { x, y: y + 5, class: 'vm-v' });
  });
  s(c.svg, 'text', { x: 300, y: 292, class: 'fg-m', 'text-anchor': 'middle' }, 'each value = a MIN node whose leaves are all equal');
  return stepper(c, FRAMES, f => {
    f.leaves.flat().forEach((v, k) => { leaf[k].textContent = String(v); leaf[k].classList.toggle('vm-hot', f.changed); });
    chVal.forEach((t, a) => (t.textContent = f.values ? num(exp(f.leaves[a])) : '?'));
    rootEdges.forEach((e, a) => e.classList.toggle('cur', f.values && a === best(f.leaves)));
  }, opts);
}

const CSS = `
.vm-max{fill:var(--panel-2);stroke:var(--v-max);stroke-width:2}
.vm-ch{fill:var(--panel-2);stroke:var(--v-chance);stroke-width:2}
.vm-leaf{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5}
.vm-v{font:700 14px var(--mono);fill:var(--text);text-anchor:middle;transition:fill .3s}
.vm-v.vm-hot{fill:var(--warn)}
`;
