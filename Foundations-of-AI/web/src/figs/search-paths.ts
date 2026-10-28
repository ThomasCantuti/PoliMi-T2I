// Path planning, three formulations of the same map (slides p. 78–86; obstacles copied from the slides' 20 × 12 grid):
// grid points (8 moves, cost 1 / √2), vertical cell decomposition, visibility graph. Uniform-cost search runs on each state graph.
import { bar, card, md, num, s, style, type FigOptions } from './shell';
import { btn, pick, ticker } from './search-kit';

type P = [number, number];
const W = 20, H = 12, U = 24, X0 = 14, Y0 = 14, START: P = [2, 5], GOAL: P = [19, 8];
const OBST: P[][] = [[[3.75, 2], [7, 3], [7, 8], [4, 8], [4, 6], [5, 5], [3, 3]], [[12, 8], [16, 8], [16, 3], [17, 3], [17, 9], [12, 9]]];
const EDGES = OBST.flatMap(p => p.map((a, i): [P, P] => [a, p[(i + 1) % p.length]]));
const VERTS = OBST.flat();
const px = ([x, y]: P) => `${X0 + x * U},${Y0 + y * U}`;
const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const cross = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

function onEdge(p: P, [a, b]: [P, P]) {
  const L = dist(a, b), t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (L * L)));
  return dist(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]) < 1e-9;
}
const inPoly = (p: P, poly: P[]) => poly.reduce((acc, a, i) => {
  const b = poly[(i + 1) % poly.length];
  return (a[1] > p[1]) !== (b[1] > p[1]) && p[0] < a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1]) ? !acc : acc;
}, false);
/** closed: the obstacle boundary counts as obstacle (grid points must keep off the walls); open: segments may run along it (visibility). */
const blocked = (p: P, closed: boolean) => (EDGES.some(e => onEdge(p, e)) ? closed : OBST.some(o => inPoly(p, o)));
function freeSeg(a: P, b: P, closed: boolean) {
  for (const [c, d] of EDGES) if (cross(a, b, c) * cross(a, b, d) < -1e-12 && cross(c, d, a) * cross(c, d, b) < -1e-12) return false;
  const n = Math.ceil(dist(a, b) / 0.05);
  for (let k = 0; k <= n; k++) if (blocked([a[0] + (k / n) * (b[0] - a[0]), a[1] + (k / n) * (b[1] - a[1])], closed)) return false;
  return true;
}

interface Graph { pts: P[]; adj: [number, number, P?][][]; start: number; goal: number; cells?: { traps: { q: P[]; cell: number }[]; rays: [P, P][] } }

function gridGraph(): Graph {
  const pts: P[] = [], id = new Map<string, number>();
  for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) if (!blocked([x, y], true)) { id.set(`${x},${y}`, pts.length); pts.push([x, y]); }
  const adj = pts.map(([x, y]) => [-1, 0, 1].flatMap(dx => [-1, 0, 1].map(dy => [x + dx, y + dy] as P))
    .filter(q => id.has(`${q}`) && (q[0] !== x || q[1] !== y) && freeSeg([x, y], q, true)).map((q): [number, number] => [id.get(`${q}`)!, dist([x, y], q)]));
  return { pts, adj, start: id.get(`${START}`)!, goal: id.get(`${GOAL}`)! };
}

function visibilityGraph(): Graph {
  const pts: P[] = [START, GOAL, ...VERTS];
  const adj = pts.map((a, i) => pts.flatMap((b, j): [number, number][] => (i !== j && freeSeg(a, b, false) ? [[j, dist(a, b)]] : [])));
  return { pts, adj, start: 0, goal: 1 };
}

/** Vertical cell decomposition: from every vertex a ray goes up and/or down until it hits an obstacle; the free space splits into cells. */
function cellGraph(): Graph {
  const xs = [...new Set([0, W, ...VERTS.map(v => v[0])])].sort((a, b) => a - b);
  const yAt = (e: [P, P] | number, x: number) => (typeof e === 'number' ? e : e[0][1] + ((x - e[0][0]) / (e[1][0] - e[0][0])) * (e[1][1] - e[0][1]));
  const traps: { i: number; top: [P, P] | number; bot: [P, P] | number }[] = [];
  xs.slice(0, -1).forEach((x0, i) => {
    const xm = (x0 + xs[i + 1]) / 2, cuts: { y: number; e: [P, P] | number }[] = [{ y: 0, e: 0 }, { y: H, e: H }];
    for (const e of EDGES) if ((e[0][0] - xm) * (e[1][0] - xm) < 0) cuts.push({ y: yAt(e, xm), e });
    cuts.sort((a, b) => a.y - b.y);
    for (let k = 0; k + 1 < cuts.length; k++) if (!blocked([xm, (cuts[k].y + cuts[k + 1].y) / 2], true)) traps.push({ i, top: cuts[k].e, bot: cuts[k + 1].e });
  });
  const rays: [P, P][] = [];
  for (const v of VERTS) for (const dir of [-1, 1]) {
    if (blocked([v[0], v[1] + dir * 1e-6], true)) continue;
    let end = dir < 0 ? 0 : H;
    for (const e of EDGES) {
      if ((e[0][0] - v[0]) * (e[1][0] - v[0]) > 0 || e[0][0] === e[1][0]) continue;
      const y = yAt(e, v[0]);
      if ((y - v[1]) * dir > 1e-9 && (y - end) * dir < 0) end = y;
    }
    rays.push([v, [v[0], end]]);
  }
  // merge trapezoids across a slab line unless a ray separates them; separated neighbours become adjacent cells
  const root = traps.map((_, k) => k), find = (k: number): number => (root[k] === k ? k : (root[k] = find(root[k])));
  const links: [number, number, P][] = [];
  traps.forEach((a, ka) => traps.forEach((b, kb) => {
    if (b.i !== a.i + 1) return;
    const x = xs[b.i], lo = Math.max(yAt(a.top, x), yAt(b.top, x)), hi = Math.min(yAt(a.bot, x), yAt(b.bot, x));
    if (hi - lo < 1e-6) return;
    const cut = rays.some(([p, q]) => p[0] === x && Math.min(hi, Math.max(p[1], q[1])) - Math.max(lo, Math.min(p[1], q[1])) > 1e-6);
    if (cut) links.push([ka, kb, [x, (lo + hi) / 2]]); else root[find(kb)] = find(ka);
  }));
  const ids = [...new Set(traps.map((_, k) => find(k)))], cellOf = (k: number) => ids.indexOf(find(k));
  const poly = (t: (typeof traps)[number]): P[] => {
    const x0 = xs[t.i], x1 = xs[t.i + 1];
    return [[x0, yAt(t.top, x0)], [x1, yAt(t.top, x1)], [x1, yAt(t.bot, x1)], [x0, yAt(t.bot, x0)]];
  };
  const area = (q: P[]) => ((q[2][1] - q[1][1]) + (q[3][1] - q[0][1])) / 2 * (q[1][0] - q[0][0]);
  const pts = ids.map(r => {
    const qs = traps.filter((_, k) => find(k) === r).map(poly), A = qs.reduce((a, q) => a + area(q), 0);
    return [0, 1].map(d => qs.reduce((a, q) => a + area(q) * q.reduce((m, p) => m + p[d], 0) / 4, 0) / A) as P;
  });
  const inTrap = (p: P) => traps.findIndex(t => xs[t.i] <= p[0] && p[0] <= xs[t.i + 1] && yAt(t.top, p[0]) <= p[1] && p[1] <= yAt(t.bot, p[0]));
  const start = cellOf(inTrap(START)), goal = cellOf(inTrap(GOAL));
  const at = (c: number) => (c === start ? START : c === goal ? GOAL : pts[c]); // the robot enters at S and leaves at G
  const adj: Graph['adj'] = pts.map(() => []);
  for (const [ka, kb, m] of links) {
    const a = cellOf(ka), b = cellOf(kb), cost = dist(at(a), m) + dist(m, at(b)), old = adj[a].find(([v]) => v === b);
    if (a === b || (old && old[1] <= cost)) continue;
    adj[a] = adj[a].filter(([v]) => v !== b).concat([[b, cost, m]]);
    adj[b] = adj[b].filter(([v]) => v !== a).concat([[a, cost, m]]);
  }
  return { pts, adj, start, goal, cells: { traps: traps.map((t, k) => ({ q: poly(t), cell: cellOf(k) })), rays } };
}

/** Uniform-cost search (graph search); returns the expansion order and the cheapest path. */
export function ucs(g: Graph) {
  const cost = g.pts.map(() => Infinity), parent = g.pts.map(() => -1), done = g.pts.map(() => false), order: number[] = [];
  cost[g.start] = 0;
  for (;;) {
    let u = -1;
    cost.forEach((c, k) => { if (!done[k] && c < Infinity && (u < 0 || c < cost[u])) u = k; });
    if (u < 0) return { order, path: [] as number[], cost: Infinity };
    order.push(u);
    if (u === g.goal) break;
    done[u] = true;
    for (const [v, w] of g.adj[u]) if (cost[u] + w < cost[v]) { cost[v] = cost[u] + w; parent[v] = u; }
  }
  const path = [g.goal];
  while (path[0] !== g.start) path.unshift(parent[path[0]]);
  return { order, path, cost: cost[g.goal] };
}

const FORMS = [
  { key: 'grid', name: 'grid', make: gridGraph, states: 'grid points off the obstacles', acts: 'move to one of the 8 neighbours (cost 1, diagonal √2 ≈ 1.41)' },
  { key: 'cells', name: 'cell decomposition', make: cellGraph, states: 'free cells of the vertical decomposition', acts: 'move to an adjacent cell, through the middle of the shared border' },
  { key: 'vis', name: 'visibility graph', make: visibilityGraph, states: 'S, G and the obstacle vertices', acts: 'straight segment to any vertex in sight' },
];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fmp-css', CSS);
  const c = card(el, 'simulation', 'Path planning: one map, three formulations', '0 0 780 320');
  const graphs = FORMS.map(f => f.make()), runs = graphs.map(ucs);
  const nEdges = (g: Graph) => g.adj.reduce((a, l) => a + l.length, 0) / 2;
  if (runs[2].cost > Math.min(runs[0].cost, runs[1].cost) + 1e-9) console.error('search-paths: the visibility graph should give the shortest path');
  let f = 0, k = 0, said = '';

  s(c.svg, 'rect', { x: X0, y: Y0, width: W * U, height: H * U, class: 'fmp-map' });
  const back = s(c.svg, 'g'), marks = s(c.svg, 'g');
  for (const o of OBST) s(c.svg, 'polygon', { points: o.map(px).join(' '), class: 'fmp-obst' });
  const path = s(c.svg, 'polyline', { class: 'fmp-path' });
  for (const [p, cls, t] of [[START, 'fmp-s', 'S'], [GOAL, 'fmp-g', 'G']] as const) {
    s(c.svg, 'circle', { cx: X0 + p[0] * U, cy: Y0 + p[1] * U, r: 6, class: cls });
    s(c.svg, 'text', { x: X0 + p[0] * U + (t === 'S' ? -10 : 10), y: Y0 + p[1] * U - 9, class: 'fmp-lab', 'text-anchor': t === 'S' ? 'end' : 'start' }, t);
  }
  const RX = X0 + W * U + 22;
  const head = s(c.svg, 'text', { x: RX, y: 30, class: 'fg-h2' });
  const lines = [0, 1, 2, 3, 4].map(i => s(c.svg, 'text', { x: RX, y: 62 + i * 24, class: 'fg-t' }));
  s(c.svg, 'text', { x: RX, y: 196, class: 'fg-m' }, 'shortest path, by formulation');
  const table = FORMS.map((fm, i) => s(c.svg, 'text', { x: RX, y: 218 + i * 22, class: 'fmp-row' }));
  s(c.svg, 'text', { x: RX, y: 296, class: 'fg-m' }, '1 unit = one grid square');

  const ctl = bar(c);
  const run = btn(ctl, '', () => { if (tick.on) return tick.stop(); if (k > runs[f].order.length) k = 0; tick.start(); }, 'primary');
  btn(ctl, '↺ Reset', () => { tick.stop(); k = 0; render(); });
  pick(ctl, FORMS.map((fm, i) => [String(i), `formulation: ${fm.name}`]), '0', v => { tick.stop(); f = +v; k = 0; draw(); render(); }, 'Formulation');
  const speed = pick(ctl, [['120', 'slow'], ['40', 'normal'], ['8', 'fast']], '40', () => {}, 'Speed');
  const tick = ticker(() => { k++; render(); return k <= runs[f].order.length; }, () => +speed.value * (f === 0 ? 1 : 8), () => render());

  function draw() {
    back.replaceChildren();
    const g = graphs[f];
    if (g.cells) {
      for (const { q, cell } of g.cells.traps) s(back, 'polygon', { points: q.map(px).join(' '), class: `fmp-cell fmp-c${cell % 6}` });
      for (const [a, b] of g.cells.rays) s(back, 'line', { x1: X0 + a[0] * U, y1: Y0 + a[1] * U, x2: X0 + b[0] * U, y2: Y0 + b[1] * U, class: 'fmp-ray' });
    } else if (f === 0) {
      for (let x = 0; x <= W; x++) s(back, 'line', { x1: X0 + x * U, x2: X0 + x * U, y1: Y0, y2: Y0 + H * U, class: 'fmp-gl' });
      for (let y = 0; y <= H; y++) s(back, 'line', { x1: X0, x2: X0 + W * U, y1: Y0 + y * U, y2: Y0 + y * U, class: 'fmp-gl' });
    }
    g.adj.forEach((l, a) => l.forEach(([b, , m]) => {
      if (a < b && f !== 0) s(back, 'polyline', { points: [g.pts[a], ...(m ? [m] : []), g.pts[b]].map(px).join(' '), class: 'fmp-e' });
    }));
    g.pts.forEach((p, i) => { if (i !== g.start && i !== g.goal) s(back, 'circle', { cx: X0 + p[0] * U, cy: Y0 + p[1] * U, r: f === 0 ? 2.2 : 4, class: 'fmp-st' }); });
  }

  function render() {
    const g = graphs[f], r = runs[f], fm = FORMS[f], shown = Math.min(k, r.order.length), over = k > r.order.length;
    marks.replaceChildren();
    for (const u of r.order.slice(0, shown)) s(marks, 'circle', { cx: X0 + g.pts[u][0] * U, cy: Y0 + g.pts[u][1] * U, r: f === 0 ? 4.5 : 7, class: 'fmp-exp' });
    const way: P[] = [];
    r.path.forEach((u, i) => {
      if (i) { const m = g.adj[r.path[i - 1]].find(([v]) => v === u)?.[2]; if (m) way.push(m); }
      way.push(i === 0 ? START : i === r.path.length - 1 ? GOAL : g.pts[u]);
    });
    path.setAttribute('points', over ? way.map(px).join(' ') : '');
    head.textContent = fm.name;
    lines[0].textContent = `states: ${g.pts.length}`;
    lines[1].textContent = `actions (edges): ${nEdges(g)}`;
    lines[2].textContent = `expanded by UCS: ${shown}`;
    lines[3].textContent = over ? `path: ${r.path.length - 1} actions` : '';
    lines[4].textContent = over ? `path length: ${num(r.cost, 4)}` : '';
    table.forEach((t, i) => { t.textContent = `${FORMS[i].name}: ${num(runs[i].cost, 4)}`; t.classList.toggle('on', i === f); });
    run.textContent = tick.on ? '⏸ Pause' : over ? '⏵ Run again' : k ? '⏵ Continue' : '⏵ Run UCS';
    explain();
  }

  function explain() {
    const g = graphs[f], r = runs[f], fm = FORMS[f], over = k > r.order.length;
    const best = Math.min(...runs.map(x => x.cost));
    const [stage, text] = !over
      ? [`f${f}`, `**${fm.name[0].toUpperCase() + fm.name.slice(1)}.** States: ${fm.states} (**${g.pts.length}**). Actions: ${fm.acts}. ` +
        'Goal test: the robot is at G. Press **Run UCS**: uniform-cost search expands the states in order of path cost (blue).']
      : [`d${f}`, `**Path found: ${num(r.cost, 4)} units, ${r.path.length - 1} actions, after ${r.order.length} expansions over ${g.pts.length} states.** ` +
        (f === 0 ? 'The path zig-zags at multiples of 45° and many states are explored: a fine grid is a big state space with many repeated states (every point is reachable by many paths).'
          : f === 1 ? 'Very few states, but the path through the middle of the borders is longer than needed: a cell decomposition does not give the optimal path.'
          : 'The fewest states and the **true shortest path**: it hugs the obstacle corners.') +
        ` Shortest of the three: ${num(best, 4)} (visibility graph).`];
    if (stage === said) return;
    said = stage;
    c.cap.innerHTML = md(text);
    if (over) opts.onEvent?.(`[${c.title}] ${text}`);
  }

  draw();
  render();
  return { destroy: () => tick.stop() };
}

const CSS = `
.fmp-map{fill:var(--panel-2);stroke:var(--text-2);stroke-width:2}
.fmp-obst{fill:var(--border-strong);stroke:var(--text-2);stroke-width:2;stroke-linejoin:round}
.fmp-gl{stroke:var(--border);stroke-width:1}
.fmp-st{fill:var(--muted)}
.fmp-e{fill:none;stroke:var(--v-edge);stroke-width:1;opacity:.6}
.fmp-ray{stroke:var(--accent-2);stroke-width:1.5;stroke-dasharray:4 3}
.fmp-cell{stroke:none;fill-opacity:.18}
.fmp-c0{fill:var(--accent)}.fmp-c1{fill:var(--ok)}.fmp-c2{fill:var(--warn)}.fmp-c3{fill:var(--info)}.fmp-c4{fill:var(--accent-2)}.fmp-c5{fill:var(--bad)}
.fmp-exp{fill:var(--accent);opacity:.75}
.fmp-path{fill:none;stroke:var(--ok);stroke-width:4;stroke-linejoin:round;stroke-linecap:round}
.fmp-s{fill:var(--bad)}
.fmp-g{fill:var(--ok)}
.fmp-lab{font:700 13px var(--font);fill:var(--text)}
.fmp-row{font:12.5px var(--mono);fill:var(--text-2)}
.fmp-row.on{font-weight:700;fill:var(--text)}
`;
