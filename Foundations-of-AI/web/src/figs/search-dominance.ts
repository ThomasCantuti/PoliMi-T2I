// Dominance on the 8-puzzle (slides p. 181–184, 214): simulation. A breadth-first search from the goal labels all 181,440 states
// with their true cost h*; then A* (course best_first_search, FIFO ties, blank moves up/down/left/right) with h1 and with h2
// solves random instances grouped by solution depth. Everything runs in rAF chunks; nothing is computed on mount.
import { bar, card, md, num, s, style, type FigOptions } from './shell';

const GOAL = 123456780, P10 = [1e8, 1e7, 1e6, 1e5, 1e4, 1e3, 100, 10, 1], DEPTHS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
const digit = (s: number, p: number) => Math.floor(s / P10[p]) % 10;
const h1 = (s: number) => { let k = 0; for (let p = 0; p < 9; p++) { const t = digit(s, p); k += +(t !== 0 && t !== p + 1); } return k; };
const h2 = (s: number) => {
  let k = 0;
  for (let p = 0; p < 9; p++) { const t = digit(s, p); if (t) k += Math.abs(Math.floor(p / 3) - Math.floor((t - 1) / 3)) + Math.abs((p % 3) - ((t - 1) % 3)); }
  return k;
};
function children(s: number): number[] {
  let b = 0;
  while (digit(s, b)) b++;
  const out: number[] = [];
  for (const d of [-3, 3, -1, 1]) { // the blank moves UP, DOWN, LEFT, RIGHT (aima EightPuzzle.actions order)
    if ((d === -3 && b < 3) || (d === 3 && b > 5) || (d === -1 && b % 3 === 0) || (d === 1 && b % 3 === 2)) continue;
    const t = digit(s, b + d);
    out.push(s - t * P10[b + d] + t * P10[b]);
  }
  return out;
}

/** A* = best_first_search(f = g + h) with a binary heap, FIFO ties; yields every 3000 expansions so it can run in rAF chunks. */
function* astar(start: number, h: (s: number) => number): Generator<void, number> {
  const heap: [number, number, number, number][] = [], g = new Map([[start, 0]]);
  const less = (a: number[], b: number[]) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const push = (e: [number, number, number, number]) => {
    heap.push(e);
    for (let i = heap.length - 1, p = (i - 1) >> 1; i && less(heap[i], heap[p]); i = p, p = (i - 1) >> 1) [heap[i], heap[p]] = [heap[p], heap[i]];
  };
  const pop = () => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && less(heap[l], heap[m])) m = l;
        if (r < heap.length && less(heap[r], heap[m])) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m], heap[i]];
        i = m;
      }
    }
    return top;
  };
  let seq = 0, expanded = 0;
  push([h(start), seq++, start, 0]);
  while (heap.length) {
    const [, , n, gn] = pop();
    if (n === GOAL) return expanded;
    if (++expanded % 3000 === 0) yield;
    for (const m of children(n)) {
      const gm = gn + 1;
      if (gm < (g.get(m) ?? Infinity)) { g.set(m, gm); push([gm + h(m), seq++, m, gm]); }
    }
  }
  return -1;
}
/** Effective branching factor: the b with N = b + b² + … + b^d (a uniform tree of depth d with N + 1 nodes), N = nodes expanded. */
function bstar(N: number, d: number) {
  let lo = 0.1, hi = 10;
  for (let it = 0; it < 60; it++) {
    const b = (lo + hi) / 2;
    let sum = 0;
    for (let i = 1, p = b; i <= d; i++, p *= b) sum += p;
    if (sum > N) hi = b; else lo = b;
  }
  return lo;
}

const LX = 50, RX = 450, PY = 34, PW = 290, PH = 170, TY = 268;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-if-dom-css', CSS);
  const c = card(el, 'simulation', 'Dominance: h2 sees more of the true cost, so A* expands fewer nodes', '0 0 780 400');
  let per = 20, running = false, raf = 0, said = '';
  // phase 1 state: BFS from the goal
  let depth = new Map<number, number>(), queue: number[] = [], qi = 0, byDepth: number[][] = [], bad = 0;
  let sum1: number[] = [], sum2: number[] = [];
  // phase 2 state: instance k of depth index j, with heuristic hh (0 = h1, 1 = h2)
  let k = 0, j = 0, hh = 0, job: Generator<void, number> | null = null, inst = 0, solved = 0, last1 = 0, notWorse = 0;
  let exp: number[][] = [], cnt: number[] = [];

  function clear() {
    depth = new Map([[GOAL, 0]]); queue = [GOAL]; qi = 0; byDepth = [[GOAL]]; bad = 0; sum1 = [0]; sum2 = [0];
    k = j = hh = solved = notWorse = 0; job = null; exp = DEPTHS.map(() => [0, 0]); cnt = DEPTHS.map(() => 0);
  }
  function selfCheck() { // the chapter's numbers for 5 _ 8 / 4 2 1 / 7 3 6: C* = 21, 5802 expansions with h1, 932 with h2
    const n = 508421736, run = (g: Generator<void, number>) => { let r = g.next(); while (!r.done) r = g.next(); return r.value; };
    const e1 = run(astar(n, h1)), e2 = run(astar(n, h2));
    if (e1 !== 5802 || e2 !== 932 || depth.get(n) !== 21) console.error(`search-dominance: got ${e1}/${e2} expansions, h* = ${depth.get(n)}; expected 5802/932, 21`);
  }
  function work(budget: number) {
    const t0 = performance.now();
    while (performance.now() - t0 < budget) {
      if (qi < queue.length) { // BFS, 2000 states at a time
        for (let end = Math.min(queue.length, qi + 2000); qi < end; qi++) {
          const st = queue[qi], d = depth.get(st)!, a = h1(st), b = h2(st);
          if (!(a <= b && b <= d)) bad++;
          sum1[d] += a; sum2[d] += b;
          for (const m of children(st)) if (!depth.has(m)) {
            depth.set(m, d + 1); queue.push(m);
            (byDepth[d + 1] ??= []).push(m); sum1[d + 1] ??= 0; sum2[d + 1] ??= 0;
          }
        }
        if (qi === queue.length) {
          if (bad || queue.length !== 181440) console.error(`search-dominance: ${queue.length} states, ${bad} violate h1 <= h2 <= h*`);
          selfCheck();
        }
        continue;
      }
      if (k >= per) return pause();
      if (!job) { // the same instance for h1 and then h2
        const pool = byDepth[DEPTHS[j]];
        if (!hh) inst = pool[Math.floor(Math.random() * pool.length)];
        job = astar(inst, hh ? h2 : h1);
      }
      const r = job.next();
      if (!r.done) continue;
      exp[j][hh] += r.value;
      job = null;
      if (hh === 0) { hh = 1; last1 = r.value; continue; }
      hh = 0; cnt[j]++; solved++; notWorse += +(r.value <= last1);
      if (++j === DEPTHS.length) { j = 0; k++; }
    }
  }

  // left plot: mean h1 and h2 against the true cost h*; right plot: mean nodes expanded (log scale) against the depth d
  const ly = (v: number) => PY + PH - (v / 31) * PH, lx = (v: number) => LX + (v / 31) * PW;
  const rx = (d: number) => RX + ((d - 2) / 22) * PW, ry = (v: number) => PY + PH - (Math.log10(Math.max(1, v)) / 5) * PH;
  for (const [x0, title] of [[LX, 'mean h over all states with true cost h*'], [RX, 'mean nodes expanded by A* (log scale)']] as const) {
    s(c.svg, 'text', { x: x0 - 40, y: PY - 14, class: 'fg-t' }, title);
    s(c.svg, 'rect', { x: x0, y: PY, width: PW, height: PH, class: 'ifd-plot' });
  }
  for (const v of [0, 10, 20, 30]) {
    s(c.svg, 'line', { x1: LX, x2: LX + PW, y1: ly(v), y2: ly(v), class: 'ifd-grid' });
    s(c.svg, 'text', { x: LX - 6, y: ly(v) + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
    s(c.svg, 'text', { x: lx(v), y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'middle' }, String(v));
  }
  s(c.svg, 'text', { x: LX + PW, y: PY + PH + 30, class: 'fg-m', 'text-anchor': 'end' }, 'h* (true solution cost)');
  s(c.svg, 'line', { x1: lx(0), y1: ly(0), x2: lx(31), y2: ly(31), class: 'ifd-diag' });
  s(c.svg, 'text', { x: lx(24), y: ly(27), class: 'ifd-dt' }, 'h = h*');
  for (let e = 0; e <= 5; e++) {
    s(c.svg, 'line', { x1: RX, x2: RX + PW, y1: ry(10 ** e), y2: ry(10 ** e), class: 'ifd-grid' });
    s(c.svg, 'text', { x: RX - 6, y: ry(10 ** e) + 4, class: 'fg-m', 'text-anchor': 'end' }, e < 3 ? String(10 ** e) : `10${'³⁴⁵'[e - 3]}`);
  }
  for (const d of [2, 8, 14, 20, 24]) s(c.svg, 'text', { x: rx(d), y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'middle' }, String(d));
  s(c.svg, 'text', { x: RX + PW, y: PY + PH + 30, class: 'fg-m', 'text-anchor': 'end' }, 'd (solution depth)');
  const lines = [0, 1].map(i => [s(c.svg, 'polyline', { class: `ifd-l h${i}` }), s(c.svg, 'polyline', { class: `ifd-l h${i}` })]);
  const tags = [0, 1].map(i => s(c.svg, 'text', { class: `ifd-tag h${i}` }, `h${i + 1}`));
  const ltags = [0, 1].map(i => s(c.svg, 'text', { x: LX + PW - 8, class: `ifd-tag h${i}`, 'text-anchor': 'end' }, `h${i + 1}`));
  const prog = s(c.svg, 'text', { x: LX + 6, y: PY + 18, class: 'fg-m' });
  // table: one column per depth
  const row = (y: number, name: string, cls: string) => {
    s(c.svg, 'text', { x: 12, y, class: `ifd-th ${cls}` }, name);
    return DEPTHS.map((_, i) => s(c.svg, 'text', { x: 128 + i * 54, y, class: `ifd-td ${cls}`, 'text-anchor': 'end' }));
  };
  const head = row(TY, 'd', ''), e1 = row(TY + 22, 'A*(h1) expanded', 'h0'), e2 = row(TY + 42, 'A*(h2) expanded', 'h1');
  const b1 = row(TY + 66, 'b* with h1', 'h0'), b2 = row(TY + 86, 'b* with h2', 'h1'), nT = row(TY + 108, 'instances', '');
  DEPTHS.forEach((d, i) => { head[i].textContent = String(d); });
  s(c.svg, 'line', { x1: 12, x2: 770, y1: TY + 7, y2: TY + 7, class: 'ifd-grid' });

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); clear(); render(); };
  const sel = document.createElement('select');
  sel.innerHTML = [10, 20, 50, 100].map(v => `<option value="${v}"${v === per ? ' selected' : ''}>${v} instances per depth</option>`).join('');
  sel.onchange = () => { per = +sel.value; render(); opts.onEvent?.(`[${c.title}] ${per} instances per depth`); };
  ctl.append(run, reset, sel);

  function play() {
    if (running) return;
    running = true;
    const frame = () => { work(14); render(); if (running) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const bfsDone = qi > 0 && qi === queue.length, maxD = byDepth.length - 1;
    for (let i = 0; i < 2; i++) {
      const sum = i ? sum2 : sum1, pts: string[] = [];
      if (bfsDone) for (let d = 0; d <= maxD; d++) pts.push(`${lx(d)},${ly(sum[d] / byDepth[d].length)}`);
      lines[i][0].setAttribute('points', pts.join(' '));
      const done = DEPTHS.map((d, q) => [d, q] as const).filter(([, q]) => cnt[q] > 0);
      lines[i][1].setAttribute('points', done.map(([d, q]) => `${rx(d)},${ry(exp[q][i] / cnt[q])}`).join(' '));
      const lastQ = done.length ? done[done.length - 1][1] : -1;
      tags[i].setAttribute('x', String(lastQ >= 0 ? rx(DEPTHS[lastQ]) + 6 : -99));
      tags[i].setAttribute('y', String(lastQ >= 0 ? ry(exp[lastQ][i] / cnt[lastQ]) + 4 : -99));
      ltags[i].setAttribute('y', String(bfsDone ? ly(sum[28] / byDepth[28].length) + (i ? -8 : 16) : -99));
    }
    DEPTHS.forEach((d, q) => {
      const n = cnt[q], m1 = exp[q][0] / n, m2 = exp[q][1] / n;
      e1[q].textContent = n ? num(m1, 3 + +(m1 >= 1000)) : '';
      e2[q].textContent = n ? num(m2, 3 + +(m2 >= 1000)) : '';
      b1[q].textContent = n ? bstar(m1, d).toFixed(2) : '';
      b2[q].textContent = n ? bstar(m2, d).toFixed(2) : '';
      nT[q].textContent = String(n);
    });
    prog.textContent = !qi ? '' : bfsDone ? '' : `breadth-first search from the goal: ${queue.length.toLocaleString('en-US')} states, depth ${depth.get(queue[qi - 1])}`;
    run.textContent = running ? '⏸ Pause' : k >= per ? '✓ Done' : qi ? '⏵ Continue' : '⏵ Run';
    run.disabled = k >= per && !running;
    explain(bfsDone, maxD);
  }

  function explain(bfsDone: boolean, maxD: number) {
    const last = DEPTHS.length - 1, ratio = cnt[last] ? exp[last][0] / exp[last][1] : 0;
    const [key, text] = !qi
      ? ['idle', '**Press Run.** First a breadth-first search from the goal labels every reachable 8-puzzle state with its true cost $h^*$; ' +
        'then A* solves random instances at each depth, once with $h_1$ (misplaced tiles) and once with $h_2$ (Manhattan).']
      : !bfsDone
      ? ['bfs', '**Labelling the state space.** Breadth-first search from the goal: the depth at which a state is reached is its true cost $h^*$ (every move costs 1).']
      : k < per
      ? [`solve${solved ? 1 : 0}`, `**All ${queue.length.toLocaleString('en-US')} reachable states labelled** (the other half of the 9! arrangements cannot reach the goal); ` +
        `the hardest need ${maxD} moves. ${bad ? `**${bad} states violate** $h_1 \\le h_2 \\le h^*$!` : '$h_1 \\le h_2 \\le h^*$ holds in **every** state: both are admissible and $h_2$ dominates $h_1$.'} ` +
        `Left: on average $h_2$ recovers about ${num((100 * sum2[20]) / byDepth[20].length / 20, 2)}% of a true cost of 20, $h_1$ only ${num((100 * sum1[20]) / byDepth[20].length / 20, 2)}%. ` +
        'Right: A* is now solving random instances of each depth.']
      : [`end${per}`, `**${per} instances per depth.** At $d = 24$ A* expands on average ${num(exp[last][0] / cnt[last], 3)} nodes with $h_1$ and ${num(exp[last][1] / cnt[last], 3)} with $h_2$: ` +
        `**${num(ratio, 2)} times fewer**. Both counts still grow exponentially with $d$ (roughly straight lines on the log scale); a better $h$ lowers the base, ` +
        `the effective branching factor $b^*$ (${bstar(exp[last][0] / cnt[last], 24).toFixed(2)} vs ${bstar(exp[last][1] / cnt[last], 24).toFixed(2)} at $d = 24$). ` +
        `Instance by instance, $h_2$ expanded no more nodes than $h_1$ in ${notWorse} of ${solved}: every node with $g + h_2 < C^*$ also has $g + h_1 < C^*$` +
        (notWorse < solved ? ' (the exceptions come from ties at $f = C^*$, which the theorem leaves to tie-breaking).' : '.')];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle' && key !== 'bfs') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  clear();
  render();
  return { destroy: pause };
}

const CSS = `
.ifd-plot{fill:var(--panel-2);stroke:var(--border)}
.ifd-grid{stroke:var(--border);stroke-dasharray:2 4}
.ifd-diag{stroke:var(--ok);stroke-width:1.5;stroke-dasharray:6 4}
.ifd-dt{font:600 11px var(--mono);fill:var(--ok)}
.ifd-l{fill:none;stroke-width:2.5;stroke-linejoin:round}
.ifd-l.h0,.ifd-tag.h0{stroke:var(--warn)}
.ifd-l.h1,.ifd-tag.h1{stroke:var(--accent)}
.ifd-tag{font:700 12px var(--mono);stroke:none!important}
.ifd-tag.h0,.ifd-td.h0,.ifd-th.h0{fill:var(--warn)}
.ifd-tag.h1,.ifd-td.h1,.ifd-th.h1{fill:var(--accent)}
.ifd-th{font-size:12px;fill:var(--text-2)}
.ifd-td{font:12px var(--mono);fill:var(--text)}
`;
