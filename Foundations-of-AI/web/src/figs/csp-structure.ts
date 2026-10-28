// Independent subproblems (slides p. 299–300): side-by-side simulation. k triangles and one K4 (no 3-coloring) are colored with
// 3 colors by one backtracking over the whole graph and by one backtracking per connected component (found by BFS on the graph).
import { bar, card, md, s, slider, style, type FigOptions } from './shell';

const COLORS = ['var(--bad)', 'var(--ok)', 'var(--accent)'], D = 3, SPEEDS: Record<string, number> = { slow: 0.1, normal: 1, fast: 20 };

function graph(k: number) {
  const E: [number, number][] = [], pos: [number, number][] = [];
  for (let t = 0; t < k; t++) {
    const x = 22 + t * 84, b = 3 * t;
    E.push([b, b + 1], [b, b + 2], [b + 1, b + 2]);
    pos.push([x + 26, 0], [x, 44], [x + 52, 44]);
  }
  const b = 3 * k, x = 22 + k * 84;
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) E.push([b + i, b + j]);
  pos.push([x, 0], [x + 52, 0], [x, 44], [x + 52, 44]);
  return { n: 3 * k + 4, E, pos };
}
/** Connected components by breadth-first search on the constraint graph, each sorted, in order of their first variable. */
function components(n: number, E: [number, number][]) {
  const adj = Array.from({ length: n }, () => [] as number[]), seen = new Uint8Array(n), out: number[][] = [];
  for (const [a, b] of E) { adj[a].push(b); adj[b].push(a); }
  for (let v = 0; v < n; v++) {
    if (seen[v]) continue;
    const comp = [v];
    seen[v] = 1;
    for (let h = 0; h < comp.length; h++) for (const w of adj[comp[h]]) if (!seen[w]) { seen[w] = 1; comp.push(w); }
    out.push(comp.sort((x, y) => x - y));
  }
  return out;
}
function* backtrack(vars: number[], E: [number, number][], a: Map<number, number>, i = 0): Generator<number, boolean> {
  if (i === vars.length) return true;
  const v = vars[i];
  for (let c = 0; c < D; c++) {
    if (E.some(([x, y]) => (x === v && a.get(y) === c) || (y === v && a.get(x) === c))) continue;
    a.set(v, c);
    yield 1;
    if (yield* backtrack(vars, E, a, i + 1)) return true;
    a.delete(v);
    yield -1;
  }
  return false;
}
function* perComponent(comps: number[][], E: [number, number][], a: Map<number, number>, at: { comp: number }): Generator<number, boolean> {
  for (let k = 0; k < comps.length; k++) { at.comp = k; if (!(yield* backtrack(comps[k], E, a))) return false; }
  return true;
}

interface Run { a: Map<number, number>; gen: Generator<number, boolean>; assigns: number; undos: number; done: boolean; ok: boolean }

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-cs-st-css', CSS);
  const c = card(el, 'simulation', 'Independent subproblems: one search or one per component', '0 0 780 320');
  let k = 3, G = graph(k), comps = components(G.n, G.E), runs: Run[] = [], at = { comp: 0 }, running = false, raf = 0, acc = 0, speed = 'normal', said = '';
  const rows = [0, 1].map(i => {
    const y0 = i * 158;
    s(c.svg, 'text', { x: 10, y: y0 + 20, class: 'fg-h2' }, i ? 'One backtracking per connected component' : 'One backtracking over the whole graph');
    const g = s(c.svg, 'g', { transform: `translate(0,${y0 + 56})` });
    const st = [0, 1, 2].map(j => s(c.svg, 'text', { x: 612, y: y0 + 54 + j * 22, class: j ? 'fg-t' : 'css-n' }));
    return { g, st, nodes: [] as SVGCircleElement[], box: [] as SVGRectElement[] };
  });

  function reset() {
    running = false;
    cancelAnimationFrame(raf);
    G = graph(k);
    comps = components(G.n, G.E);
    if (comps.length !== k + 1) console.error(`csp-structure: ${comps.length} components, expected ${k + 1}`);
    at = { comp: 0 };
    const order = [...Array(G.n).keys()], A = [new Map<number, number>(), new Map<number, number>()];
    runs = [backtrack(order, G.E, A[0]), perComponent(comps, G.E, A[1], at)].map((gen, i) => ({ a: A[i], gen, assigns: 0, undos: 0, done: false, ok: false }));
    rows.forEach((r, i) => {
      r.g.replaceChildren();
      r.box = i ? comps.map(cp => {
        const xs = cp.map(v => G.pos[v][0]);
        return s(r.g, 'rect', { x: Math.min(...xs) - 14, y: -16, width: Math.max(...xs) - Math.min(...xs) + 28, height: 76, rx: 10, class: 'css-box' });
      }) : [];
      for (const [a, b] of G.E) s(r.g, 'line', { x1: G.pos[a][0], y1: G.pos[a][1], x2: G.pos[b][0], y2: G.pos[b][1], class: 'fg-e' });
      r.nodes = G.pos.map(([x, y]) => s(r.g, 'circle', { cx: x, cy: y, r: 11, class: 'css-v' }));
      s(r.g, 'text', { x: G.pos[G.n - 4][0] + 26, y: 82, class: 'fg-m', 'text-anchor': 'middle' }, 'K4');
    });
    render();
  }
  function step(R: Run) {
    if (R.done) return;
    const r = R.gen.next();
    if (r.done) { R.done = true; R.ok = r.value; } else if (r.value > 0) R.assigns++; else R.undos++;
  }

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const rs = document.createElement('button');
  rs.className = 'btn sm';
  rs.textContent = '↺ Reset';
  rs.onclick = reset;
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="slow">slow</option><option value="normal" selected>normal</option><option value="fast">fast</option><option value="turbo">turbo</option>';
  sp.onchange = () => { speed = sp.value; };
  ctl.append(run, rs, sp);
  const kIn = slider(ctl, 'triangles k', 1, 6, 1, k, v => { k = v; reset(); });
  kIn.addEventListener('change', () => opts.onEvent?.(`[${c.title}] k = ${k} triangles`));

  function play() {
    if (running) return;
    if (runs.every(R => R.done)) reset();
    running = true;
    const frame = () => {
      if (speed === 'turbo') { const t0 = performance.now(); while (performance.now() - t0 < 12 && !runs.every(R => R.done)) for (let j = 0; j < 200; j++) runs.forEach(step); }
      else for (acc += SPEEDS[speed]; acc >= 1; acc--) runs.forEach(step);
      if (runs.every(R => R.done)) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  const fmt = (x: number) => x.toLocaleString('en-US');
  function render() {
    runs.forEach((R, i) => {
      const r = rows[i];
      r.nodes.forEach((nd, v) => { const col = R.a.get(v); nd.style.fill = col === undefined ? '' : COLORS[col]; });
      r.box.forEach((b, j) => b.classList.toggle('on', !R.done && j === at.comp));
      r.st[0].textContent = !R.done ? (R.assigns ? 'searching…' : 'ready') : R.ok ? '✓ solution' : '✗ no solution';
      r.st[1].textContent = `${fmt(R.assigns)} assignments`;
      r.st[2].textContent = `${fmt(R.undos)} undone`;
    });
    run.textContent = running ? '⏸ Pause' : runs.every(R => R.done) ? '⏵ Replay' : runs[0].assigns ? '⏵ Continue' : '⏵ Run';
    explain();
  }

  function explain() {
    const [w, p] = runs, years = 2 ** 80 / 1e7 / (365.25 * 24 * 3600), secs = (4 * 2 ** 20) / 1e7;
    const [key, text] = !w.assigns
      ? [`idle${k}`, `**${k} triangle${k > 1 ? 's' : ''} and one K4**: n = ${G.n} variables, ${comps.length} connected components (found by a breadth-first search on the graph), 3 colors. ` +
        'Four mutually adjacent nodes cannot get 3 different colors, so the last component, and with it the whole CSP, has **no solution**. Press **Run**.']
      : !w.done
      ? ['run', '**Top:** each time the K4 fails, chronological backtracking undoes the **last** assignment, a triangle that has nothing to do with the K4, and ' +
        'tries the K4 again: it ends up repeating the K4 for every coloring of every triangle. **Bottom:** each component is solved on its own, so the K4 fails exactly once.']
      : [`end${k}`, `**Whole graph: ${fmt(w.assigns)} assignments. One search per component: ${fmt(p.assigns)}.** Add a triangle and the top count is multiplied by about 6 ` +
        '(its 3 · 2 · 1 colorings), the bottom one grows by 3: a product against a sum, $O(d^n)$ against $O\\!\\left(\\frac{n}{c}\\, d^{c}\\right)$. ' +
        `The slides' example (p. 300), $n = 80$, $d = 2$, $c = 20$, at 10 million nodes/s: $2^{80}$ nodes take ${(years / 1e9).toFixed(1)} billion years, ` +
        `$4 \\cdot 2^{20}$ nodes take ${secs.toFixed(2)} s.`];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (!key.startsWith('idle')) opts.onEvent?.(`[${c.title}] ${text}`);
  }

  reset();
  return { destroy: pause };
}

const CSS = `
.css-v{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .12s}
.css-box{fill:none;stroke:var(--border-strong);stroke-dasharray:5 4}
.css-box.on{stroke:var(--accent);stroke-width:2}
.css-n{font:600 13px var(--font);fill:var(--text)}
`;
