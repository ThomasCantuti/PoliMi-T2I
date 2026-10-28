// Search vs inference on n-queens (slides p. 277–298, 317): side-by-side simulation. Plain backtracking, forward checking and
// MAC (AC-3 at the start of every call + forward checking, p. 317) race on the same board; static order or MRV, values top to bottom.
import { bar, card, md, s, slider, style, type FigOptions } from './shell';

type Inf = 'bt' | 'fc' | 'mac';
const KINDS: [Inf, string, string][] = [
  ['bt', 'Backtracking', 'checks against the placed queens'],
  ['fc', '+ forward checking', 'crosses off attacked squares'],
  ['mac', '+ AC-3 (MAC)', 'then makes all arcs consistent'],
];
const CAP = 500_000, BX = 22, BY = 46, BW = 200, SPEEDS: Record<string, number> = { watch: 0.25, normal: 2, fast: 200 };
// the chapter's table (assignments to the first solution), used only as a cross-check of the solver
const BOOK: Record<string, number> = { 'bt 8': 113, 'bt 16': 10052, 'bt 20': 199635, 'fc 8': 88, 'fc 16': 7560, 'fc 20': 145151,
  'fc mrv 8': 75, 'fc mrv 16': 44, 'fc mrv 20': 145, 'mac 8': 20, 'mac 4': 5 };

interface Run { val: Int32Array; dom: number[][]; assigns: number; backs: number; checks: number; done: boolean; sol: boolean; gen: Generator<void, boolean> }

function start(n: number, inf: Inf, mrv: boolean): Run {
  const R: Run = { val: new Int32Array(n).fill(-1), dom: [], assigns: 0, backs: 0, checks: 0, done: false, sol: false, gen: null! };
  const ok = (i: number, a: number, j: number, b: number) => (R.checks++, a !== b && Math.abs(a - b) !== Math.abs(i - j));
  const consistent = (x: number, v: number) => { for (let j = 0; j < n; j++) if (R.val[j] >= 0 && !ok(x, v, j, R.val[j])) return false; return true; };
  function ac3(d: number[][]) { // FIFO queue of the arcs between unassigned variables (csp.ts conventions)
    const q: number[] = [], inq = new Uint8Array(n * n);
    for (let i = 0; i < n; i++) if (R.val[i] < 0) for (let j = 0; j < n; j++) if (j !== i && R.val[j] < 0) { q.push(i * n + j); inq[i * n + j] = 1; }
    for (let h = 0; h < q.length; h++) {
      const i = Math.floor(q[h] / n), j = q[h] % n;
      inq[q[h]] = 0;
      const keep = d[i].filter(a => d[j].some(b => ok(i, a, j, b)));
      if (keep.length === d[i].length) continue;
      d[i] = keep;
      if (!keep.length) return false;
      for (let k = 0; k < n; k++) if (k !== i && k !== j && R.val[k] < 0 && !inq[k * n + i]) { q.push(k * n + i); inq[k * n + i] = 1; }
    }
    return true;
  }
  function* bt(d: number[][]): Generator<void, boolean> {
    if (R.assigns >= CAP) return false;
    if (inf === 'mac') {
      const alive = ac3(d);
      R.dom = d;
      yield;
      if (!alive) return false;
    }
    let x = -1, best = Infinity;
    for (let i = 0; i < n; i++) {
      if (R.val[i] >= 0) continue;
      if (!mrv) { x = i; break; }
      const k = inf === 'bt' ? d[i].filter(v => consistent(i, v)).length : d[i].length; // without filtering, MRV must count legal values itself
      if (k < best) { best = k; x = i; }
    }
    if (x < 0) return true;
    for (const v of d[x]) {
      if (inf === 'bt' && !consistent(x, v)) continue;
      R.val[x] = v;
      R.assigns++;
      let nd = d, dead = false;
      if (inf !== 'bt') {
        nd = d.map((D, j) => (R.val[j] < 0 ? D.filter(b => ok(x, v, j, b)) : D));
        nd[x] = [v];
        dead = nd.some((D, j) => R.val[j] < 0 && !D.length);
      }
      R.dom = nd;
      yield;
      if (!dead && (yield* bt(nd))) return true;
      R.val[x] = -1;
      R.backs++;
      R.dom = d;
      yield;
      if (R.assigns >= CAP) return false;
    }
    return false;
  }
  R.dom = Array.from({ length: n }, () => Array.from({ length: n }, (_, r) => r));
  R.gen = bt(R.dom);
  return R;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-cs-q-css', CSS);
  const c = card(el, 'simulation', 'Search vs inference: three ways to place n queens', '0 0 780 372');
  let n = 8, mrv = false, runs: Run[] = [], running = false, raf = 0, acc = 0, speed = 'normal', said = '';
  const panes = KINDS.map(([, name, sub], i) => {
    const x0 = 10 + i * 258;
    s(c.svg, 'text', { x: x0, y: 18, class: 'fg-h2' }, name);
    s(c.svg, 'text', { x: x0, y: 35, class: 'fg-m' }, sub);
    const board = s(c.svg, 'g', { transform: `translate(${x0 + BX},${BY})` });
    const st = [0, 1, 2, 3].map(j => s(c.svg, 'text', { x: x0, y: BY + BW + 22 + j * 19, class: j ? 'fg-t' : 'csq-n' }));
    return { board, st, sq: [] as SVGRectElement[], q: [] as SVGCircleElement[], code: [] as number[] };
  });

  function reset() {
    running = false;
    cancelAnimationFrame(raf);
    runs = KINDS.map(([inf]) => start(n, inf, mrv));
    const C = BW / n;
    for (const p of panes) {
      p.board.replaceChildren();
      p.sq = []; p.code = [];
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
        p.sq.push(s(p.board, 'rect', { x: k * C, y: r * C, width: C, height: C, class: (r + k) % 2 ? 'csq-d' : 'csq-l' }));
        p.code.push(0);
      }
      p.q = Array.from({ length: n }, (_, k) => s(p.board, 'circle', { cx: k * C + C / 2, r: C * 0.33, class: 'csq-q' }));
    }
    render();
  }
  function step(R: Run, i: number) {
    if (R.done) return;
    const r = R.gen.next();
    if (!r.done) return;
    R.done = true;
    R.sol = r.value;
    const key = `${KINDS[i][0]}${mrv ? ' mrv' : ''} ${n}`;
    if (BOOK[key] !== undefined && BOOK[key] !== R.assigns) console.error(`csp-queens: ${key} made ${R.assigns} assignments, the chapter says ${BOOK[key]}`);
  }

  const ctl = bar(c), knobs = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const rs = document.createElement('button');
  rs.className = 'btn sm';
  rs.textContent = '↺ Reset';
  rs.onclick = reset;
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch</option><option value="normal" selected>normal</option><option value="fast">fast</option><option value="turbo">turbo</option>';
  sp.onchange = () => { speed = sp.value; };
  const ord = document.createElement('select');
  ord.innerHTML = '<option value="static">static order (column 1, 2, …)</option><option value="mrv">MRV (fewest legal rows)</option>';
  ord.onchange = () => { mrv = ord.value === 'mrv'; reset(); opts.onEvent?.(`[${c.title}] variable order: ${ord.value}`); };
  ctl.append(run, rs, sp, ord);
  const nIn = slider(knobs, 'n', 4, 30, 1, n, v => { n = v; reset(); });
  nIn.addEventListener('change', () => opts.onEvent?.(`[${c.title}] n = ${n}`));
  for (const v of [4, 8, 16, 20]) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `${v}-queens`;
    b.onclick = () => { nIn.value = String(v); nIn.dispatchEvent(new Event('input')); nIn.dispatchEvent(new Event('change')); };
    knobs.append(b);
  }

  function play() {
    if (running) return;
    if (runs.every(R => R.done)) reset();
    running = true;
    const frame = () => {
      if (speed === 'turbo') {
        const t0 = performance.now();
        while (performance.now() - t0 < 12 && !runs.every(R => R.done)) for (let k = 0; k < 50; k++) runs.forEach(step);
      } else for (acc += SPEEDS[speed]; acc >= 1; acc--) runs.forEach(step);
      if (runs.every(R => R.done)) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  const fmt = (x: number) => x.toLocaleString('en-US'), started = () => runs.some(R => R.assigns || R.checks);
  function render() {
    const C = BW / n;
    runs.forEach((R, i) => {
      const p = panes[i];
      for (let k = 0; k < n; k++) {
        const v = R.val[k], d = R.dom[k] ?? [];
        p.q[k].setAttribute('cy', String(v * C + C / 2));
        p.q[k].classList.toggle('hide', v < 0);
        for (let r = 0; r < n; r++) {
          const code = v >= 0 ? 0 : i && !d.includes(r) ? 1 : 0, idx = r * n + k;
          if (code !== p.code[idx]) { p.code[idx] = code; p.sq[idx].classList.toggle('csq-x', code === 1); }
        }
      }
      p.st[0].textContent = !R.done ? (R.assigns || R.checks ? 'searching…' : 'ready') : R.sol ? '✓ solution' : R.assigns >= CAP ? `gave up after ${fmt(CAP)} assignments` : '✗ no solution';
      p.st[1].textContent = `${fmt(R.assigns)} assignments`;
      p.st[2].textContent = `${fmt(R.backs)} backtracks`;
      p.st[3].textContent = `${fmt(R.checks)} constraint checks`;
    });
    run.textContent = running ? '⏸ Pause' : runs.every(R => R.done) ? '⏵ Replay' : started() ? '⏵ Continue' : '⏵ Run';
    explain();
  }

  // the caption follows the stage of the race; it changes only when the stage changes
  function explain() {
    const done = runs.every(R => R.done), A = runs.map(R => fmt(R.assigns)), K = runs.map(R => fmt(R.checks));
    const cheap = runs.reduce((b, R, i) => (R.checks < runs[b].checks ? i : b), 0), few = runs.reduce((b, R, i) => (R.assigns < runs[b].assigns ? i : b), 0);
    const [key, text] = !started()
      ? ['idle', `**${n}-queens**, $X_i$ = row of the queen in column $i$, rows tried top to bottom. The three solvers differ only in how much they **infer** after each ` +
        'assignment; the shaded squares are the values crossed off the domains of the columns still empty. Press **Run**.']
      : !done
      ? ['run', 'Plain backtracking only discovers a dead end when a column has no safe row **at the moment it is reached**. Forward checking sees an emptied column one step earlier; ' +
        'MAC propagates further, so it often backtracks **before** placing a queen that is already doomed.']
      : [`end${n}${mrv}`, `**${n}-queens, ${mrv ? 'MRV' : 'static order'}.** Assignments: ${A.join(' / ')}. Constraint checks: ${K.join(' / ')}. ` +
        `More inference means a smaller tree: **${KINDS[few][1].replace('+ ', '')}** made the fewest assignments. But every node costs more, and the fewest constraint checks here go to **${KINDS[cheap][1].replace('+ ', '')}**: ` +
        'this is the trade-off between time spent in search and time spent in propagation (p. 316–317). ' +
        (runs.some(R => R.assigns >= CAP) ? `Some solvers hit the cap of ${fmt(CAP)} assignments: try **MRV**. ` : '') +
        (mrv ? 'With MRV plain backtracking makes the same choices as forward checking, but it has to recount the legal rows of every column by brute force: same tree, many more checks.' :
          n >= 16 ? 'Switch to **MRV**: with a good variable order the static-order explosion disappears.' : '')];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  reset();
  return { destroy: pause };
}

const CSS = `
.csq-l{fill:var(--panel-2)}
.csq-d{fill:var(--panel-3)}
.csq-l.csq-x,.csq-d.csq-x{fill:color-mix(in srgb,var(--bad) 30%,var(--panel-2))}
.csq-q{fill:var(--accent);stroke:var(--panel);stroke-width:1.5}
.csq-n{font:600 13px var(--font);fill:var(--text)}
`;
