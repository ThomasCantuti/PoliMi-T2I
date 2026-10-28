// Admissible heuristics on the robot grid of slides p. 206–212: interactive. h(n) and the true h*(n) (Dijkstra from G) in every cell;
// scale h until it overestimates and watch A* (course best_first_search, FIFO ties, goal test on selection) lose optimality.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const GRID = ['............', '...........G', '....#.......', '....#.......', '.##.#.......', '....#.......', 'S...........'];
const R = GRID.length, C = GRID[0].length, CELL = 46, X0 = 12, Y0 = 12, SQ2 = Math.SQRT2, EPS = 1e-9;
const at = (ch: string) => GRID.join('').indexOf(ch), S = at('S'), G = at('G'), FREE = GRID.join('').split('').map(ch => ch !== '#');
const HS: Record<string, [string, (dx: number, dy: number) => number]> = {
  man: ['Manhattan', (dx, dy) => dx + dy],
  euc: ['Euclidean', (dx, dy) => Math.hypot(dx, dy)],
  oct: ['octile', (dx, dy) => SQ2 * Math.min(dx, dy) + Math.abs(dx - dy)],
};

function neighbors(i: number, diag: boolean): [number, number][] {
  const r = Math.floor(i / C), c = i % C, ok = (a: number, b: number) => a >= 0 && a < R && b >= 0 && b < C && FREE[a * C + b], out: [number, number][] = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (ok(r + dr, c + dc)) out.push([(r + dr) * C + c + dc, 1]);
  if (diag) for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) // no corner cutting: both side cells must be free
    if (ok(r + dr, c + dc) && ok(r + dr, c) && ok(r, c + dc)) out.push([(r + dr) * C + c + dc, SQ2]);
  return out;
}

/** Dijkstra from `src`: cost of the cheapest path to every cell and the predecessor towards `src`. */
function dijkstra(src: number, diag: boolean) {
  const d = new Array<number>(R * C).fill(Infinity), prev = new Array<number>(R * C).fill(-1), done = new Set<number>();
  d[src] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < R * C; i++) if (!done.has(i) && d[i] < Infinity && (u < 0 || d[i] < d[u])) u = i;
    if (u < 0) return { d, prev };
    done.add(u);
    for (const [v, w] of neighbors(u, diag)) if (d[u] + w < d[v] - EPS) { d[v] = d[u] + w; prev[v] = u; }
  }
}

function astar(h: (i: number) => number, diag: boolean) {
  const g = new Map([[S, 0]]), parent = new Map<number, number>(), open: [number, number, number, number][] = [[h(S), 0, S, 0]], expanded = new Set<number>();
  let seq = 1;
  while (open.length) {
    let b = 0;
    for (let j = 1; j < open.length; j++) if (open[j][0] < open[b][0] - EPS || (Math.abs(open[j][0] - open[b][0]) <= EPS && open[j][1] < open[b][1])) b = j;
    const [, , n, gn] = open.splice(b, 1)[0];
    if (n === G) {
      const path = [n];
      while (path[0] !== S) path.unshift(parent.get(path[0])!);
      return { cost: gn, path, expanded };
    }
    expanded.add(n);
    for (const [m, w] of neighbors(n, diag)) {
      const gm = gn + w;
      if (g.has(m) && gm >= g.get(m)! - EPS) continue;
      g.set(m, gm);
      parent.set(m, n);
      open.push([gm + h(m), seq++, m, gm]);
    }
  }
  return null;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-if-adm-css', CSS);
  const c = card(el, 'interactive', 'Admissible or not: h(n) against the true cost h*(n)', '0 0 780 352');
  let diag = true, hk = 'man', k = 1;
  const box: SVGRectElement[] = [], hT: SVGTextElement[] = [], sT: SVGTextElement[] = [], dot: SVGCircleElement[] = [], ring: SVGRectElement[] = [];
  const cx = (i: number) => X0 + (i % C) * CELL + CELL / 2, cy = (i: number) => Y0 + Math.floor(i / C) * CELL + CELL / 2;
  for (let i = 0; i < R * C; i++) {
    const x = X0 + (i % C) * CELL, y = Y0 + Math.floor(i / C) * CELL;
    box.push(s(c.svg, 'rect', { x, y, width: CELL, height: CELL, class: FREE[i] ? 'ifa-c' : 'ifa-w' }));
    if (!FREE[i]) { hT.push(s(c.svg, 'text')); sT.push(s(c.svg, 'text')); dot.push(s(c.svg, 'circle')); ring.push(s(c.svg, 'rect')); continue; }
    ring.push(s(c.svg, 'rect', { x: x + 2.5, y: y + 2.5, width: CELL - 5, height: CELL - 5, rx: 5, class: 'ifa-ring' }));
    dot.push(s(c.svg, 'circle', { cx: x + CELL - 8, cy: y + 8, r: 3, class: 'ifa-dot' }));
    hT.push(s(c.svg, 'text', { x: x + 5, y: y + 16, class: 'ifa-h' }));
    sT.push(s(c.svg, 'text', { x: x + CELL - 5, y: y + CELL - 6, class: 'ifa-s', 'text-anchor': 'end' }));
  }
  for (const [i, ch] of [[S, 'S'], [G, 'G']] as const) s(c.svg, 'text', { x: cx(i) + CELL / 2 - 9, y: cy(i) - 6, class: 'ifa-sg' }, ch);
  const optLine = s(c.svg, 'polyline', { class: 'ifa-opt' }), path = s(c.svg, 'polyline', { class: 'ifa-path' });
  const PX = 588, out = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(j => s(c.svg, 'text', { x: PX, y: 30 + j * 21 + (j > 2 ? 10 : 0) + (j > 5 ? 10 : 0), class: j % 3 ? 'fg-t' : 'fg-h2' }));
  s(c.svg, 'text', { x: PX, y: 300, class: 'fg-m' }, 'top: h(n) · bottom: h*(n)');
  s(c.svg, 'text', { x: PX, y: 318, class: 'fg-m' }, 'red: h > h* · dot: expanded by A*');
  s(c.svg, 'text', { x: PX, y: 336, class: 'fg-m' }, 'solid: A* · dashed: an optimal path');

  const knobs = bar(c), presets = bar(c);
  const mv = document.createElement('select');
  mv.innerHTML = '<option value="4">4 moves (cost 1)</option><option value="8" selected>8 moves (diagonal √2)</option>';
  mv.onchange = () => { diag = mv.value === '8'; render(); say(); };
  const hs = document.createElement('select');
  hs.innerHTML = Object.entries(HS).map(([key, [name]]) => `<option value="${key}">${name}</option>`).join('');
  hs.onchange = () => { hk = hs.value; render(); say(); };
  knobs.append(mv, hs);
  const kIn = slider(knobs, 'h × ', 0, 3, 0.05, k, v => { k = v; render(); });
  kIn.addEventListener('change', say);
  for (const [label, d, h, kk] of [['p. 212: Manhattan, 8 moves', true, 'man', 1], ['Manhattan, 4 moves', false, 'man', 1], ['octile, 8 moves', true, 'oct', 1], ['octile × 1.5', true, 'oct', 1.5]] as const) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = label;
    b.onclick = () => {
      diag = d; hk = h; k = kk; mv.value = d ? '8' : '4'; hs.value = h; kIn.value = String(kk);
      kIn.parentElement!.querySelector('b')!.textContent = String(kk);
      render(); say();
    };
    presets.append(b);
  }

  function render() {
    const { d: hstar } = dijkstra(G, diag), fromS = dijkstra(S, diag), Cs = hstar[S], gx = G % C, gy = Math.floor(G / C);
    const h = (i: number) => k * HS[hk][1](Math.abs(i % C - gx), Math.abs(Math.floor(i / C) - gy));
    const res = astar(h, diag)!, opt = [G];
    while (opt[0] !== S) opt.unshift(fromS.prev[opt[0]]);
    let over = 0, free = 0, worst = 0, exact = 0;
    const late = new Set(opt.filter(i => fromS.d[i] + h(i) > Cs + EPS)); // on the optimal route, f = g* + h > C*
    for (let i = 0; i < R * C; i++) {
      if (!FREE[i]) continue;
      free++;
      const hi = h(i), ratio = hstar[i] ? hi / hstar[i] : 1, bad = hi > hstar[i] + EPS;
      over += +bad; worst = Math.max(worst, ratio); exact += +(Math.abs(hi - hstar[i]) < EPS);
      box[i].setAttribute('class', 'ifa-c' + (bad ? ' bad' : ''));
      box[i].style.fillOpacity = bad ? String(Math.min(0.5, 0.16 + 0.6 * (ratio - 1))) : String(0.04 + 0.26 * ratio);
      hT[i].textContent = num(hi, 3);
      hT[i].classList.toggle('bad', bad);
      sT[i].textContent = num(hstar[i], 3);
      dot[i].classList.toggle('hide', !res.expanded.has(i) || i === S);
      ring[i].classList.toggle('hide', !late.has(i));
    }
    const pts = (p: number[]) => p.map(i => `${cx(i)},${cy(i)}`).join(' ');
    path.setAttribute('points', pts(res.path));
    optLine.setAttribute('points', pts(opt));
    const ok = res.cost <= Cs + EPS;
    path.classList.toggle('worse', !ok);
    const lines = [
      `h = ${k === 1 ? '' : `${k} × `}${HS[hk][0]}`, `${diag ? '8 moves, diagonal costs √2' : '4 moves, each costs 1'}`,
      over ? `h > h* in ${over} of ${free} cells` : `h ≤ h* in all ${free} cells`,
      'A* with this h', `path cost ${num(res.cost, 4)}`, `${res.expanded.size} nodes expanded`,
      'true optimum', `C* = h*(S) = ${num(Cs, 4)}`, ok ? 'A* is optimal' : `A* pays ${num(res.cost - Cs, 3)} more`,
    ];
    out.forEach((t, j) => { t.textContent = lines[j]; t.classList.toggle('ifa-bad', (j === 2 && over > 0) || (j === 8 && !ok)); });
    c.cap.innerHTML = md(over === 0
      ? `**Admissible:** $h(n) \\le h^*(n)$ in every cell (largest ratio ${num(worst, 3)}), so A* returns the optimal cost **${num(Cs, 4)}**. ` +
        (exact > free / 2 ? `In ${exact} of ${free} cells $h = h^*$ exactly: wherever no wall is in the way, the ${HS[hk][0]} distance *is* the cost of the relaxed problem without obstacles, so it is the most informed choice. ` :
          `The darker the green, the closer $h$ is to $h^*$: a more informed $h$ expands fewer nodes (${res.expanded.size} here). `) +
        (k < 1 ? 'Shrinking $h$ keeps it admissible but less informed; at $h \\times 0$ A* is uniform-cost search.' : '')
      : `**Not admissible:** $h(n) > h^*(n)$ in ${over} of ${free} cells (red), up to ${num(worst, 3)} times the true cost. ` +
        (ok ? `A* still returns the optimal cost ${num(Cs, 4)} on this map, but only by luck: the guarantee is gone. ` :
          `A* returns a path of cost **${num(res.cost, 4)}** instead of ${num(Cs, 4)}. The ringed cells lie on an optimal route but have $f = g + h > C^*$: ` +
          `they looked worse than the goal reached by the other route, so A* selected G first.`) +
        (hk === 'man' && diag && k === 1 ? ' With diagonal moves Manhattan counts a diagonal step as 2 while it costs $\\sqrt 2$ (p. 212).' : ''));
  }
  function say() { opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`); }
  render();
  return { destroy() {} };
}

const CSS = `
.ifa-c{fill:var(--ok);stroke:var(--border);stroke-width:1;transition:fill-opacity .2s}
.ifa-c.bad{fill:var(--bad)}
.ifa-w{fill:var(--text-2);stroke:var(--text-2)}
.ifa-h{font:600 12px var(--mono);fill:var(--text)}
.ifa-h.bad{fill:var(--bad)}
.ifa-s{font:11px var(--mono);fill:var(--muted)}
.ifa-sg{font-size:14px;font-weight:800;fill:var(--text);text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:var(--panel);stroke-width:4px}
.ifa-dot{fill:var(--text-2)}
.ifa-ring{fill:none;stroke:var(--bad);stroke-width:2.5;stroke-dasharray:4 3}
.ifa-opt{fill:none;stroke:var(--ok);stroke-width:2.5;stroke-dasharray:6 5;opacity:.9}
.ifa-path{fill:none;stroke:var(--ok);stroke-width:4;stroke-linejoin:round;opacity:.85}
.ifa-path.worse{stroke:var(--warn)}
.ifa-bad{fill:var(--bad)}
`;
