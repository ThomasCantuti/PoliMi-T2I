// Burglary network (AIMA Figure 13.2): static figure. Also exports the network and its drawing helpers to the other bn-* figures.
import { arrow, card, md, s, style } from './shell';

export const NAME: Record<string, string> = { B: 'Burglary', E: 'Earthquake', A: 'Alarm', J: 'JohnCalls', M: 'MaryCalls' };
export const PARENTS: Record<string, string[]> = { B: [], E: [], A: ['B', 'E'], J: ['A'], M: ['A'] };
/** P(X = true | parents), one entry per row; the parents' values run tt, tf, ft, ff. */
export const CPT: Record<string, number[]> = { B: [0.001], E: [0.002], A: [0.95, 0.94, 0.29, 0.001], J: [0.90, 0.05], M: [0.70, 0.01] };

export function P(x: string, value: boolean, ev: Record<string, boolean>): number {
  const p = CPT[x][PARENTS[x].reduce((row, q) => 2 * row + (ev[q] ? 0 : 1), 0)];
  return value ? p : 1 - p;
}

export type Pos = Record<string, [number, number]>;
const W = 104, H = 36;

export function edge(svg: SVGSVGElement | SVGGElement, [x1, y1]: [number, number], [x2, y2]: [number, number], marker: string) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const t = Math.min(W / 2 / Math.abs(dx || 1e-9), H / 2 / Math.abs(dy || 1e-9));
  return s(svg, 'line', { x1: x1 + dx * t, y1: y1 + dy * t, x2: x2 - dx * t - dx / len * 3, y2: y2 - dy * t - dy / len * 3, class: 'fg-e', 'marker-end': marker });
}

/** Draws the nodes at `pos` and an arrow for every parent; returns them keyed by node and by parent+child. */
export function net(svg: SVGSVGElement, parent: SVGSVGElement | SVGGElement, pos: Pos, parents: Record<string, string[]> = PARENTS) {
  const ah = arrow(svg), edges: Record<string, SVGLineElement> = {}, nodes: Record<string, SVGGElement> = {};
  for (const ch in parents) for (const p of parents[ch]) edges[p + ch] = edge(parent, pos[p], pos[ch], ah);
  for (const k in pos) {
    const g = nodes[k] = s(parent, 'g', { class: 'fg-nd' });
    s(g, 'rect', { x: pos[k][0] - W / 2, y: pos[k][1] - H / 2, width: W, height: H, rx: 18 });
    s(g, 'text', { x: pos[k][0], y: pos[k][1] + 4.5 }, NAME[k]);
  }
  return { nodes, edges };
}

export const POS: Pos = { B: [190, 50], E: [530, 50], A: [360, 160], J: [210, 280], M: [510, 280] };
const p2 = (x: number) => (x < 0.01 ? String(x) : x.toFixed(2));

function table(svg: SVGSVGElement, x: number, y: number, head: string[], rows: string[][]) {
  const w = head.map(h => (h.length > 2 ? 66 : 22));
  const at = (i: number) => x + w.slice(0, i).reduce((a, b) => a + b, 0);
  head.forEach((h, i) => s(svg, 'text', { x: at(i), y, class: 'fg-m' }, h));
  s(svg, 'line', { x1: x, y1: y + 5, x2: at(head.length) - 8, y2: y + 5, class: 'bb-rule' });
  rows.forEach((r, j) => r.forEach((v, i) => s(svg, 'text', { x: at(i), y: y + 22 + j * 18, class: i === r.length - 1 ? 'bb-p' : 'fg-t' }, v)));
}

export function mount(el: HTMLElement) {
  style('fig-bb-css', '.bb-rule{stroke:var(--border-strong)}.bb-p{font:600 13px var(--mono);fill:var(--text)}');
  const c = card(el, 'figure', 'The burglary network and its CPTs (AIMA Figure 13.2)', '0 0 720 330');
  net(c.svg, c.svg, POS);
  const tf = ['t', 'f'];
  table(c.svg, 40, 32, ['P(b)'], [[p2(CPT.B[0])]]);
  table(c.svg, 600, 32, ['P(e)'], [[p2(CPT.E[0])]]);
  table(c.svg, 452, 118, ['B', 'E', 'P(a | B, E)'], CPT.A.map((p, i) => [tf[i >> 1], tf[i & 1], p2(p)]));
  table(c.svg, 40, 262, ['A', 'P(j | A)'], CPT.J.map((p, i) => [tf[i], p2(p)]));
  table(c.svg, 580, 262, ['A', 'P(m | A)'], CPT.M.map((p, i) => [tf[i], p2(p)]));
  const sizes = Object.values(CPT).map(r => r.length), n = sizes.length;
  c.cap.innerHTML = md(`Each node stores $P(X \\mid Parents(X))$: one row per combination of its parents' values, and the "false" ` +
    `column is $1 - p$ of the same row. In total $${sizes.join(' + ')} = ${sizes.reduce((a, b) => a + b)}$ numbers instead of ` +
    `$2^${n} - 1 = ${2 ** n - 1}$ for the full joint.`);
  return { destroy() {} };
}
