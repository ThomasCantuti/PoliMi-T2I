// Best-first search, the general scheme (slides p. 108–109): the same best_first_search with four evaluation functions f
// on one graph, side by side. The orders for g, h and g + h are checked against the Playground engine (viz/search.ts trace()).
import { trace, type Algorithm, type GraphSpec } from '../viz/search';
import { bar, card, md, s, style, type FigOptions } from './shell';
import { btn, pick, ticker } from './search-kit';

const NODES: Record<string, { x: number; y: number; h: number }> = {
  S: { x: 0, y: 50, h: 4 }, A: { x: 22, y: 8, h: 3 }, C: { x: 50, y: 0, h: 2 }, D: { x: 78, y: 8, h: 1 }, G: { x: 100, y: 50, h: 0 },
  B: { x: 50, y: 100, h: 3 }, E: { x: 38, y: 55, h: 2 },
};
const EDGES: [string, string, number][] = [['S', 'A', 1], ['A', 'C', 1], ['C', 'D', 1], ['D', 'G', 1], ['S', 'B', 4], ['B', 'G', 4], ['S', 'E', 3], ['E', 'G', 8]];
const FS = [
  { f: 'depth', name: 'f = depth', algo: 'breadth-first', engine: 'bfs' },
  { f: 'g', name: 'f = g', algo: 'uniform-cost', engine: 'ucs' },
  { f: 'h', name: 'f = h', algo: 'greedy best-first', engine: 'greedy' },
  { f: 'g+h', name: 'f = g + h', algo: 'A*', engine: 'astar' },
] as const;
type F = (typeof FS)[number]['f'];
/** Successors in alphabetical order, as in aima's GraphProblem (and the Playground engine). */
const NEXT: Record<string, [string, number][]> = Object.fromEntries(Object.keys(NODES).map(k => [k,
  EDGES.flatMap(([a, b, c]): [string, number][] => (a === k ? [[b, c]] : b === k ? [[a, c]] : [])).sort((p, q) => p[0].localeCompare(q[0]))]));

interface Node { state: string; parent?: Node; g: number; depth: number; seq: number }
/** best_first_search of the course code: pop the lowest f (ties: first inserted), goal test when popped, reached table on path cost. */
export function bestFirst(f: F) {
  const val = (n: Node) => (f === 'depth' ? n.depth : f === 'g' ? n.g : f === 'h' ? NODES[n.state].h : n.g + NODES[n.state].h);
  let seq = 0;
  const root: Node = { state: 'S', g: 0, depth: 0, seq: seq++ }, frontier = [root], reached = new Map([['S', root]]), pops: Node[] = [];
  while (frontier.length) {
    const best = frontier.reduce((a, b) => (val(b) < val(a) || (val(b) === val(a) && b.seq < a.seq) ? b : a));
    frontier.splice(frontier.indexOf(best), 1);
    pops.push(best);
    if (best.state === 'G') break;
    for (const [v, c] of NEXT[best.state]) {
      const child: Node = { state: v, parent: best, g: best.g + c, depth: best.depth + 1, seq: 0 };
      const r = reached.get(v);
      if (!r || child.g < r.g) { child.seq = seq++; reached.set(v, child); frontier.push(child); }
    }
  }
  return { pops, val };
}
const pathOf = (n: Node) => { const p: string[] = []; for (let x: Node | undefined = n; x; x = x.parent) p.unshift(x.state); return p; };

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fmb-css', CSS);
  const c = card(el, 'simulation', 'Best-first search: one function, four evaluation functions f', '0 0 780 372');
  const runs = FS.map(x => bestFirst(x.f));
  const spec: GraphSpec = { nodes: Object.fromEntries(Object.entries(NODES).map(([k, v]) => [k, { x: v.x, y: v.y, h: v.h }])), edges: EDGES };
  // children are generated in alphabetical order in both engines (aima GraphProblem.actions is sorted): compare the popped states
  FS.forEach((x, k) => {
    const t = trace({ algorithm: x.engine as Algorithm, graph: spec });
    const theirs = t.steps.filter(st => st.cur != null).map(st => t.nodes[st.cur!].state).join(''), ours = runs[k].pops.map(n => n.state).join('');
    if (theirs !== ours) console.error(`search-bestfirst: ${x.name} pops ${ours}, the Playground engine ${theirs}`);
  });
  let i = 0, said = '';
  const PW = 380, PH = 176, panels = FS.map((x, k) => {
    const ox = (k % 2) * (PW + 10) + 5, oy = Math.floor(k / 2) * (PH + 8) + 4, X = (v: number) => ox + 40 + v * 2.9, Y = (v: number) => oy + 40 + v * 0.98;
    const g = s(c.svg, 'g');
    s(g, 'rect', { x: ox, y: oy, width: PW, height: PH, rx: 10, class: 'fmb-panel' });
    s(g, 'text', { x: ox + 12, y: oy + 20, class: 'fmb-title' }, `${x.name}`);
    s(g, 'text', { x: ox + 12 + x.name.length * 8.6, y: oy + 20, class: 'fg-m' }, `→ ${x.algo}`);
    const edges = new Map<string, SVGLineElement>();
    for (const [a, b, cost] of EDGES) {
      const [x1, y1, x2, y2] = [X(NODES[a].x), Y(NODES[a].y), X(NODES[b].x), Y(NODES[b].y)];
      edges.set(a + b, s(g, 'line', { x1, y1, x2, y2, class: 'fmb-e' }));
      s(g, 'text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + 4, class: 'fmb-c' }, String(cost));
    }
    const nodes: Record<string, { g: SVGGElement; o: SVGTextElement }> = {};
    for (const k2 in NODES) {
      const ng = s(g, 'g', { class: 'fmb-n' }), nx = X(NODES[k2].x), ny = Y(NODES[k2].y);
      s(ng, 'circle', { cx: nx, cy: ny, r: 12 });
      s(ng, 'text', { x: nx, y: ny + 4.5 }, k2);
      s(g, 'text', { x: nx, y: ny + (k2 === 'B' ? -17 : 25), class: 'fmb-h' }, `h=${NODES[k2].h}`);
      nodes[k2] = { g: ng, o: s(g, 'text', { x: nx + 14, y: ny - 9, class: 'fmb-o' }) };
    }
    const sum = s(g, 'text', { x: ox + 12, y: oy + PH - 10, class: 'fmb-sum' });
    return { edges, nodes, sum };
  });

  const ctl = bar(c);
  const run = btn(ctl, '', () => { if (tick.on) return tick.stop(); if (done()) i = 0; tick.start(); }, 'primary');
  btn(ctl, 'Step ▶', () => { tick.stop(); if (!done()) { i++; render(); } });
  btn(ctl, '↺ Reset', () => { tick.stop(); i = 0; render(); });
  const speed = pick(ctl, [['1400', 'slow'], ['800', 'normal'], ['350', 'fast']], '800', () => {}, 'Speed');
  const tick = ticker(() => { i++; render(); return !done(); }, () => +speed.value, () => render());
  const done = () => runs.every(r => i >= r.pops.length);

  function render() {
    runs.forEach((r, k) => {
      const P = panels[k], seen = r.pops.slice(0, i), last = seen[seen.length - 1], fin = i >= r.pops.length;
      const order = new Map<string, number[]>();
      seen.forEach((n, j) => order.set(n.state, [...(order.get(n.state) ?? []), j + 1]));
      const path = fin ? pathOf(last) : [];
      for (const st in P.nodes) {
        P.nodes[st].g.setAttribute('class', `fmb-n${order.has(st) ? ' exp' : ''}${last?.state === st && !fin ? ' cur' : ''}${path.includes(st) ? ' path' : ''}`);
        P.nodes[st].o.textContent = order.get(st)?.join(',') ?? '';
      }
      P.edges.forEach((e, key) => e.classList.toggle('path', path.some((st, j) => j && (path[j - 1] + st === key || st + path[j - 1] === key))));
      P.sum.textContent = fin ? `${r.pops.length} nodes selected · path ${path.join('-')} · cost ${last.g}` : last ? `selected ${seen.length}: ${last.state} with f = ${r.val(last)}` : '';
    });
    run.textContent = tick.on ? '⏸ Pause' : done() ? '⏵ Run again' : i ? '⏵ Continue' : '⏵ Run all four';
    const fin = done(), res = runs.map(r => r.pops[r.pops.length - 1]);
    const [stage, text] = !i
      ? ['idle', '**The same code, four orders.** Each panel runs `best_first_search` on the same graph (edge costs on the lines, $h$ under the nodes); only `f` changes. ' +
        'Press **Run**: each step selects one node per panel (badge = when it was selected).']
      : !fin
      ? ['run', '**Watch the orders split.** `f = depth` takes the shallowest node first, `f = g` the cheapest path so far, `f = h` the node that *looks* closest to G, `f = g + h` both.']
      : ['done', `**Results:** depth → ${pathOf(res[0]).join('-')} (cost ${res[0].g}, fewest actions); g → ${pathOf(res[1]).join('-')} (cost ${res[1].g}, optimal, ${runs[1].pops.length} selections); ` +
        `h → ${pathOf(res[2]).join('-')} (cost ${res[2].g}, only ${runs[2].pops.length} selections but a bad path); g + h → ${pathOf(res[3]).join('-')} (cost ${res[3].g}, optimal with ${runs[3].pops.length} selections). ` +
        'With f = g, G is first generated through E with g = 11; a cheaper path through D (g = 4) replaces it in `reached` before G is selected, and the goal test happens only then.'];
    if (stage === said) return;
    said = stage;
    c.cap.innerHTML = md(text);
    if (stage !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }
  render();
  return { destroy: () => tick.stop() };
}

const CSS = `
.fmb-panel{fill:var(--panel-2);stroke:var(--border)}
.fmb-title{font:700 14px var(--mono);fill:var(--text)}
.fmb-e{stroke:var(--v-edge);stroke-width:2;transition:stroke .3s}
.fmb-e.path{stroke:var(--ok);stroke-width:4}
.fmb-c{font:600 11px var(--mono);fill:var(--text-2);text-anchor:middle;paint-order:stroke;stroke:var(--panel-2);stroke-width:4px}
.fmb-n circle{fill:var(--panel);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .3s,stroke .3s}
.fmb-n text{font-size:12.5px;font-weight:700;fill:var(--text);text-anchor:middle}
.fmb-n.exp circle{fill:var(--v-explored)}
.fmb-n.cur circle{fill:var(--accent);stroke:var(--accent)}
.fmb-n.cur text{fill:#fff}
.fmb-n.path circle{stroke:var(--ok);stroke-width:3.5}
.fmb-h{font:10.5px var(--mono);fill:var(--muted);text-anchor:middle}
.fmb-o{font:700 11px var(--mono);fill:var(--accent)}
.fmb-sum{font:600 12px var(--mono);fill:var(--text-2)}
`;
