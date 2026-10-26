// A* on the exam-style worked example of informed.md: stepper. Every step comes from the Playground engine (viz/search.ts trace()).
import { trace, type GraphSpec } from '../viz/search';
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

export const GRAPH: GraphSpec = {
  nodes: { S: { x: 60, y: 150, h: 8 }, A: { x: 200, y: 60, h: 6 }, B: { x: 200, y: 240, h: 6 }, C: { x: 310, y: 150, h: 3 },
    D: { x: 450, y: 60, h: 2 }, E: { x: 450, y: 240, h: 5 }, G: { x: 560, y: 150, h: 0 } },
  edges: [['S', 'A', 2], ['S', 'B', 3], ['A', 'C', 3], ['A', 'D', 4], ['B', 'C', 4], ['B', 'E', 3], ['C', 'G', 4], ['D', 'G', 5], ['E', 'G', 6]],
};

const R = 20;

/** The graph with edge costs; returns the node groups, the label under each node (initially h=…) and the edges keyed 'XY' (sorted). */
export function drawGraph(svg: SVGSVGElement) {
  style('fig-as-css', '.as-n circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .3s,stroke .3s}' +
    '.as-n text{font-size:14px;font-weight:700;fill:var(--text);text-anchor:middle}' +
    '.as-n.fr circle{stroke:var(--v-frontier);stroke-width:3}.as-n.ex circle{fill:var(--v-explored)}.as-n.cur circle{fill:var(--v-current);stroke:var(--v-current)}' +
    '.as-n.cur text{fill:#fff}.as-n.path circle{stroke:var(--v-path);stroke-width:3.5}.as-c{font:12px var(--mono);fill:var(--text-2);text-anchor:middle;paint-order:stroke;stroke:var(--panel);stroke-width:4px}' +
    '.as-f{font:600 12px var(--mono);fill:var(--text-2);text-anchor:middle;transition:opacity .3s}.fg-e.path{stroke:var(--v-path);stroke-width:4}');
  const P = GRAPH.nodes, edges: Record<string, SVGLineElement> = {};
  for (const [a, b, cost] of GRAPH.edges) {
    const [x1, y1, x2, y2] = [P[a].x, P[a].y, P[b].x, P[b].y];
    edges[[a, b].sort().join('')] = s(svg, 'line', { x1, y1, x2, y2, class: 'fg-e' });
    s(svg, 'text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + 4, class: 'as-c' }, String(cost));
  }
  const nodes: Record<string, SVGGElement> = {}, labels: Record<string, SVGTextElement> = {};
  for (const k in P) {
    const g = s(svg, 'g', { class: 'as-n' });
    s(g, 'circle', { cx: P[k].x, cy: P[k].y, r: R });
    s(g, 'text', { x: P[k].x, y: P[k].y + 5 }, k);
    nodes[k] = g;
    labels[k] = s(svg, 'text', { x: P[k].x, y: P[k].y + R + 17, class: 'as-f' }, `h=${P[k].h}`);
  }
  return { nodes, labels, edges };
}

interface F extends Frame { cur: string | null; ex: string[]; fr: string[]; f: Record<string, string>; path: string[] | null }

function build(): F[] {
  const t = trace({ algorithm: 'astar', graph: GRAPH });
  const N = t.nodes, frames: F[] = [];
  const best: Record<string, string> = {}, ex: string[] = [];
  let k = 0;
  for (const st of t.steps) {
    const fr = st.frontier.map(i => N[i].state);
    for (const i of st.frontier) best[N[i].state] = `${N[i].g}+${N[i].h}=${N[i].f}`;
    if (st.kind === 'init') {
      frames.push({ cur: null, ex: [], fr, f: { ...best }, path: null, group: 'A*',
        cap: `**Start.** Under each node: its $h$, and once it is reached, $g + h = f$. The frontier holds the root: S with $f = 0 + 8 = 8$.` });
      continue;
    }
    const cur = N[st.cur!];
    k++;
    const sel = `**Step ${k}: select ${cur.state}**, $f = ${cur.g} + ${cur.h} = ${cur.f}$`;
    const prev = frames[frames.length - 1];
    const tie = prev.fr.find(x => x !== cur.state && prev.f[x]?.endsWith(`=${cur.f}`));
    const tieTxt = tie ? ` (tie with ${tie} at ${cur.f}: first in, first out)` : '';
    if (st.kind === 'goal') {
      const path = t.result.path!;
      frames.push({ cur: cur.state, ex: [...ex], fr, f: { ...best }, path, group: 'A*',
        cap: `${sel}${tieTxt}. It is the goal, tested when **selected**: return ${path.join(' → ')}, cost **${t.result.cost}**.` });
      break;
    }
    ex.push(cur.state);
    // children: new or cheaper → added; same state still in the frontier but not cheaper → dropped (worth saying); already expanded → ignored
    const gen = st.gen.map(i => N[i]).filter(n => n.ghost !== 'cycle');
    const parts = gen.filter(n => n.ghost !== 'reached' || prev.fr.includes(n.state)).map(n => n.ghost === 'reached'
      ? `${n.state} again with $g = ${n.g}$: **dropped**, the frontier already has it with $g = ${n.vs}$`
      : `${n.state}: $${n.g} + ${n.h} = ${n.f}$`);
    const old = gen.filter(n => n.ghost === 'reached' && !prev.fr.includes(n.state)).map(n => n.state);
    const gtxt = parts.length ? `Generate ${parts.join('; ')}` : 'No new children';
    frames.push({ cur: cur.state, ex: [...ex], fr, f: { ...best }, path: null, group: 'A*',
      cap: `${sel}${tieTxt}. ${gtxt}${old.length ? ` (${old.join(', ')}: already reached more cheaply, ignored)` : ''}.` });
  }
  return frames;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  const c = card(el, 'stepper', 'A* on the worked example: f = g + h', '0 0 620 330');
  const { nodes, labels, edges } = drawGraph(c.svg);
  const frLine = s(c.svg, 'text', { x: 16, y: 318, class: 'fg-t' });
  return stepper(c, build(), f => {
    for (const k in nodes) {
      const cls = f.cur === k ? 'cur' : f.path?.includes(k) ? 'path' : f.ex.includes(k) ? 'ex' : f.fr.includes(k) ? 'fr' : '';
      nodes[k].setAttribute('class', `as-n ${cls}`);
      labels[k].textContent = f.f[k] ?? `h=${GRAPH.nodes[k].h}`;
    }
    for (const e in edges) edges[e].classList.toggle('path', !!f.path && f.path.some((x, i) => i && [f.path![i - 1], x].sort().join('') === e));
    frLine.textContent = `frontier (by f): ${f.fr.map(x => `${x} ${f.f[x].split('=')[1]}`).join(' · ') || '—'}`;
  }, opts);
}
