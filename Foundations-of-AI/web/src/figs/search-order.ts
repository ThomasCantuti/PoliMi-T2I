// "A strategy is an ordering of the frontier" (slides p. 112): one tree, three frontiers; each node shows when it is expanded.
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

// Complete binary tree of depth 3, heap numbering (children of k: 2k, 2k+1); COST[k] = cost of the edge into k.
const N = 15;
const COST: Record<number, number> = { 2: 1, 3: 4, 4: 5, 5: 1, 6: 1, 7: 2, 8: 1, 9: 3, 10: 1, 11: 6, 12: 1, 13: 2, 14: 1, 15: 1 };
const kids = (k: number) => (2 * k <= N ? [2 * k, 2 * k + 1] : []);
const g: Record<number, number> = { 1: 0 };
for (let k = 2; k <= N; k++) g[k] = g[k >> 1] + COST[k];

/** Expansion order of the whole tree (no goal) for a frontier discipline; children are generated left to right. */
function order(q: 'fifo' | 'lifo' | 'g'): number[] {
  const out: number[] = [];
  let fr: { k: number; seq: number }[] = [{ k: 1, seq: 0 }], seq = 1;
  while (fr.length) {
    let i = q === 'fifo' ? 0 : fr.length - 1;
    if (q === 'g') i = fr.reduce((b, x, j) => (g[x.k] < g[fr[b].k] || (g[x.k] === g[fr[b].k] && x.seq < fr[b].seq) ? j : b), 0);
    const [{ k }] = fr.splice(i, 1);
    out.push(k);
    const ch = kids(k).map(c => ({ k: c, seq: seq++ }));
    fr = fr.concat(q === 'lifo' ? ch.reverse() : ch); // LIFO: push the right child first, so the left one is popped first
  }
  return out;
}

const STRATS = [
  { q: 'fifo' as const, title: 'FIFO queue → breadth-first',
    cap: '**FIFO queue → breadth-first.** New nodes join the **back** of the queue, so the oldest node goes first: the whole level 1, then the whole level 2, then level 3. Edge costs are ignored.' },
  { q: 'g' as const, title: 'priority queue on g → uniform-cost',
    cap: '**Priority queue on $g$ → uniform-cost.** The node with the **cheapest path so far** goes first (ties: first in, first out). The cheap left branch is explored deep before the expensive right child at depth 1.' },
  { q: 'lifo' as const, title: 'LIFO stack → depth-first',
    cap: '**LIFO stack → depth-first.** The **newest** node goes first, so the search dives down the leftmost branch to a leaf and only then backtracks. Edge costs are ignored.' },
];

interface F extends Frame { s: number }

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-so-css', '.so-n circle{stroke:var(--v-node-stroke);stroke-width:1.5;transition:fill .35s}.so-n text{font:700 13px var(--mono);text-anchor:middle;fill:var(--text)}' +
    '.so-c{font:11px var(--mono);fill:var(--muted);text-anchor:middle;transition:opacity .3s}.so-g{font:11px var(--mono);fill:var(--warn);text-anchor:middle;transition:opacity .3s}');
  const c = card(el, 'stepper', 'One tree, three frontiers: the number is the expansion order', '0 0 680 300');
  const title = s(c.svg, 'text', { x: 16, y: 26, class: 'fg-h2' });
  const pos: Record<number, [number, number]> = {};
  for (let k = 1; k <= N; k++) {
    const d = Math.floor(Math.log2(k)), slot = k - 2 ** d;
    pos[k] = [((slot + 0.5) * 680) / 2 ** d, 62 + d * 68];
  }
  const costs: SVGTextElement[] = [], gs: Record<number, SVGTextElement> = {};
  for (let k = 2; k <= N; k++) {
    const [x1, y1] = pos[k >> 1], [x2, y2] = pos[k];
    s(c.svg, 'line', { x1, y1, x2, y2, class: 'fg-e' });
    costs.push(s(c.svg, 'text', { x: (x1 + x2) / 2 + (x2 < x1 ? -8 : 8), y: (y1 + y2) / 2 + 2, class: 'so-c' }, String(COST[k])));
  }
  const nodes: Record<number, { c: SVGCircleElement; t: SVGTextElement }> = {};
  for (let k = 1; k <= N; k++) {
    const gr = s(c.svg, 'g', { class: 'so-n' });
    nodes[k] = { c: s(gr, 'circle', { cx: pos[k][0], cy: pos[k][1], r: 15 }), t: s(gr, 'text', { x: pos[k][0], y: pos[k][1] + 4.5 }) };
    gs[k] = s(c.svg, 'text', { x: pos[k][0], y: pos[k][1] + 28, class: 'so-g' }, `g=${g[k]}`);
  }
  const orders = STRATS.map(st => order(st.q));
  const frames: F[] = STRATS.map((st, i) => ({ s: i, cap: st.cap, group: st.title }));
  return stepper(c, frames, f => {
    const st = STRATS[f.s], ord = orders[f.s];
    title.textContent = st.title;
    ord.forEach((k, i) => {
      nodes[k].t.textContent = String(i + 1);
      nodes[k].c.style.fill = `color-mix(in srgb, var(--accent) ${Math.round(70 - (i * 60) / (N - 1))}%, var(--panel-2))`;
    });
    const useCost = st.q === 'g';
    costs.forEach(t => t.classList.toggle('hide', !useCost));
    for (let k = 1; k <= N; k++) gs[k].classList.toggle('hide', !useCost);
  }, opts);
}
