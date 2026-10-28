// Min-conflicts on n-queens, from 8 to 8192 queens (AIMA 6.4, csp.ipynb min_conflicts, slides p. 336): simulation.
// Initial assignment: greedy (each column in turn takes its min-conflict row, as aima-python does) or random; then
// max_steps = 100,000 repairs of a random conflicted queen, moved to its min-conflict row (ties at random, staying is allowed).
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const MAX_STEPS = 100_000, LOGS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], DRAW = 32, BS = 224;
const INITS = [['greedy', 'greedy start (aima-python)'], ['random', 'random start']] as const;
type Init = (typeof INITS)[number][0];

interface Run { n: number; q: Int32Array; row: Int32Array; d1: Int32Array; d2: Int32Array; placed: number; steps: number; conflicted: number; first: number; pick: number; done: boolean; ok: boolean; gen: Generator<void, void> }

function start(n: number, init: Init): Run {
  const R: Run = { n, q: new Int32Array(n), row: new Int32Array(n), d1: new Int32Array(2 * n), d2: new Int32Array(2 * n), placed: 0, steps: 0, conflicted: n, first: -1, pick: -1, done: false, ok: false, gen: null! };
  const conf = (c: number, r: number) => R.row[r] + R.d1[r + c] + R.d2[r - c + n]; // queens on the lines of (r, c), the one in column c excluded if lifted
  const put = (c: number, r: number, k: number) => { R.row[r] += k; R.d1[r + c] += k; R.d2[r - c + n] += k; };
  const minRow = (c: number) => { // ties broken uniformly at random (reservoir sampling)
    let best = Infinity, r = 0, ties = 0;
    for (let x = 0; x < n; x++) { const v = conf(c, x); if (v < best) { best = v; r = x; ties = 1; } else if (v === best && Math.random() * ++ties < 1) r = x; }
    return r;
  };
  R.gen = (function* () {
    for (let c = 0; c < n; c++) { // complete assignment, column by column
      R.q[c] = init === 'greedy' ? minRow(c) : Math.floor(Math.random() * n);
      put(c, R.q[c], 1);
      R.placed = c + 1;
      if (c % 64 === 63 || n <= DRAW) yield;
    }
    const list: number[] = [];
    for (;;) {
      list.length = 0;
      for (let c = 0; c < n; c++) if (conf(c, R.q[c]) > 3) list.push(c); // > 3: the queen itself is on 3 lines
      R.conflicted = list.length;
      if (R.first < 0) R.first = list.length;
      if (!list.length) { R.ok = true; break; }
      if (R.steps >= MAX_STEPS) break;
      const c = list[Math.floor(Math.random() * list.length)];
      R.pick = c;
      put(c, R.q[c], -1);
      R.q[c] = minRow(c);
      put(c, R.q[c], 1);
      R.steps++;
      yield;
    }
    R.done = true;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n && R.ok && n <= 1024; j++) // cross-check the line counts on a solved board
      if (R.q[i] === R.q[j] || Math.abs(R.q[i] - R.q[j]) === j - i) { console.error(`local-minconf: columns ${i} and ${j} attack each other`); R.ok = false; }
  })();
  return R;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-ls-mc-css', CSS);
  const c = card(el, 'simulation', 'Min-conflicts: the number of repairs barely depends on n', '0 0 780 330');
  let lg = 3, init: Init = 'greedy', speed = 'watch', running = false, raf = 0, acc = 0, said = '', sweep = false, dirty = true, R = start(8, init);
  const res: Record<string, number[]> = {}, first: Record<string, number[]> = {}; // `${init} ${log2 n}` → steps of every finished run (-1 = none within MAX_STEPS), share of queens in conflict at the start
  const n = () => 2 ** lg, key = (i: Init, l: number) => `${i} ${l}`;

  // left: the board (n ≤ 32) or the counters only
  const board = s(c.svg, 'g', { transform: 'translate(14,38)' }), note = s(c.svg, 'text', { x: 14 + BS / 2, y: 38 + BS / 2, class: 'fg-m', 'text-anchor': 'middle' });
  const head = s(c.svg, 'text', { x: 14, y: 24, class: 'fg-h2' }), st = [0, 1].map(j => s(c.svg, 'text', { x: 14, y: 286 + j * 20, class: j ? 'fg-m' : 'fg-t' }));
  let sq: SVGRectElement[] = [];
  function drawBoard() {
    board.replaceChildren();
    sq = [];
    note.textContent = R.n > DRAW ? `${R.n.toLocaleString('en-US')} queens: board not drawn` : '';
    if (R.n > DRAW) return;
    const C = BS / R.n;
    for (let r = 0; r < R.n; r++) for (let k = 0; k < R.n; k++) s(board, 'rect', { x: k * C, y: r * C, width: C, height: C, class: (r + k) % 2 ? 'lsm-d' : 'lsm-l' });
    sq = Array.from({ length: R.n }, (_, k) => s(board, 'rect', { x: k * C + C * 0.15, width: C * 0.7, height: C * 0.7, rx: C * 0.2, class: 'lsm-q' }));
  }
  // right: steps per run against n, log-log; dots = runs, line = median of each start
  const PX = 310, PY = 34, PW = 440, PH = 220, ly = (v: number) => PY + PH - (Math.log10(Math.max(1, v)) / 5) * PH, lx = (l: number) => PX + ((l - 3) / 10) * PW;
  s(c.svg, 'text', { x: PX - 40, y: PY - 14, class: 'fg-t' }, 'repair steps of each run (log scale) against n');
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'lsm-plot' });
  for (let e = 0; e <= 5; e++) {
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: ly(10 ** e), y2: ly(10 ** e), class: 'lsm-grid' });
    s(c.svg, 'text', { x: PX - 6, y: ly(10 ** e) + 4, class: 'fg-m', 'text-anchor': 'end' }, e < 3 ? String(10 ** e) : `10${'³⁴⁵'[e - 3]}`);
  }
  for (const l of LOGS) s(c.svg, 'text', { x: lx(l), y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'middle' }, String(2 ** l));
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 31, class: 'fg-m', 'text-anchor': 'end' }, 'n (queens), log scale');
  const dots = s(c.svg, 'g'), meds = INITS.map(([i]) => s(c.svg, 'polyline', { class: `lsm-med ${i}` }));
  INITS.forEach(([i, name], k) => {
    s(c.svg, 'line', { x1: PX + 10, x2: PX + 30, y1: PY + 14 + k * 17, y2: PY + 14 + k * 17, class: `lsm-med ${i}` });
    s(c.svg, 'text', { x: PX + 36, y: PY + 18 + k * 17, class: 'fg-m' }, `${name}: median`);
  });

  const ctl = bar(c), knobs = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const sw = document.createElement('button');
  sw.className = 'btn sm';
  sw.textContent = 'Sweep n = 8 … 8192 (10 runs each)';
  sw.onclick = () => { sweep = true; setN(3); speed = sp.value = 'turbo'; play(); opts.onEvent?.(`[${c.title}] sweep with the ${init} start`); };
  const rs = document.createElement('button');
  rs.className = 'btn sm';
  rs.textContent = '↺ Clear plot';
  rs.onclick = () => { pause(); for (const k in res) { delete res[k]; delete first[k]; } dirty = true; R = start(n(), init); drawBoard(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch every repair</option><option value="turbo">as fast as possible</option>';
  sp.onchange = () => { speed = sp.value; };
  const ini = document.createElement('select');
  ini.innerHTML = INITS.map(([i, name]) => `<option value="${i}">${name}</option>`).join('');
  ini.onchange = () => { init = ini.value as Init; pause(); R = start(n(), init); drawBoard(); render(); opts.onEvent?.(`[${c.title}] ${ini.value} start`); };
  ctl.append(run, sw, rs, sp, ini);
  const nIn = slider(knobs, 'n', 3, 13, 1, lg, v => setN(v));
  nIn.addEventListener('change', () => opts.onEvent?.(`[${c.title}] n = ${n()}`));
  function setN(v: number) {
    lg = v;
    nIn.value = String(v);
    nIn.parentElement!.querySelector('b')!.textContent = n().toLocaleString('en-US');
    R = start(n(), init);
    drawBoard();
    render();
  }

  function finished() {
    (res[key(init, lg)] ??= []).push(R.ok ? R.steps : -1);
    (first[key(init, lg)] ??= []).push(R.first / R.n);
    dirty = true;
    if (sweep) {
      if (res[key(init, lg)].length < 10) R = start(n(), init);
      else if (lg < 13) setN(lg + 1);
      else pause();
    } else if (speed === 'watch') pause();
    else R = start(n(), init);
  }
  function play() {
    if (running) return;
    if (R.done) R = start(n(), init);
    running = true;
    const frame = () => {
      if (speed === 'turbo') { const t0 = performance.now(); while (running && performance.now() - t0 < 12) { if (R.gen.next().done) finished(); } }
      else if ((acc += 0.25) >= 1) { acc = 0; if (R.gen.next().done) finished(); }
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; sweep = false; cancelAnimationFrame(raf); render(); }

  const median = (a: number[]) => { const b = a.filter(x => x >= 0).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
  function render() {
    head.textContent = `${R.n.toLocaleString('en-US')}-queens`;
    if (R.n <= DRAW) {
      const C = BS / R.n;
      for (let k = 0; k < R.n; k++) {
        const placed = k < R.placed;
        sq[k].setAttribute('y', String(R.q[k] * C + C * 0.15));
        sq[k].setAttribute('class', 'lsm-q' + (!placed ? ' hide' : R.row[R.q[k]] + R.d1[R.q[k] + k] + R.d2[R.q[k] - k + R.n] > 3 ? ' bad' : '') + (k === R.pick && !R.done ? ' pick' : ''));
      }
    }
    st[0].textContent = R.placed < R.n ? `initial assignment: ${R.placed} of ${R.n} columns` : R.done ? (R.ok ? `✓ solved after ${R.steps} repair${R.steps === 1 ? '' : 's'}` : `✗ no solution in ${MAX_STEPS.toLocaleString('en-US')} repairs`) :
      `repair ${R.steps}: ${R.conflicted} queen${R.conflicted === 1 ? '' : 's'} in conflict`;
    st[1].textContent = R.n <= DRAW ? 'red: queens under attack · outlined: the one being moved' : '';
    if (dirty) drawResults();
    run.textContent = running ? '⏸ Pause' : '⏵ Run';
    explain();
  }
  function drawResults() {
    dirty = false;
    dots.replaceChildren();
    INITS.forEach(([i], k) => {
      const pts: string[] = [];
      for (const l of LOGS) {
        const a = res[key(i, l)];
        if (!a) continue;
        a.slice(-40).forEach((v, j) => s(dots, 'circle', { cx: lx(l) + (k ? 5 : -5) + ((j % 5) - 2), cy: ly(v < 0 ? 1e5 : v), r: 2.2, class: `lsm-dot ${i}${v < 0 ? ' fail' : ''}` }));
        const m = median(a);
        if (!isNaN(m)) pts.push(`${lx(l)},${ly(m)}`);
      }
      meds[k].setAttribute('points', pts.join(' '));
    });
  }

  function explain() {
    const got = (i: Init) => LOGS.filter(l => res[key(i, l)]?.length), gG = got('greedy'), gR = got('random');
    const m = (i: Init, l: number) => median(res[key(i, l)]), fails = (i: Init, l: number) => res[key(i, l)].filter(v => v < 0).length;
    const share = (i: Init, ls: number[]) => { const a = first[key(i, ls[ls.length - 1])]; return num((100 * a.reduce((x, y) => x + y, 0)) / a.length, 2); };
    const span = (i: Init, all: number[]) => { const ls = all.filter(l => l >= 5).length >= 2 ? all.filter(l => l >= 5) : all; return `${m(i, ls[0]).toLocaleString('en-US')} at n = ${2 ** ls[0]}, ${m(i, ls[ls.length - 1]).toLocaleString('en-US')} at n = ${(2 ** ls[ls.length - 1]).toLocaleString('en-US')}`; }; // n ≥ 32: 8 and 16 are noisy (runs that cycle)
    const small = [3, 4].filter(l => res[key('greedy', l)]?.length || res[key('random', l)]?.length);
    const stuck = small.flatMap(l => INITS.filter(([i]) => res[key(i, l)]?.length).map(([i]) => [fails(i, l), res[key(i, l)].length])).reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
    const [k, text] = sweep
      ? ['sweep', `**Sweeping** n = 8 … 8192 with the ${init} start, 10 runs each; the dots and the median appear as each n is done.`]
      : gG.length < 4 && gR.length < 4
      ? [`few${gG.length}${gR.length}`, `**${init === 'greedy' ? 'Greedy start' : 'Random start'}.** First a complete assignment, then repairs: a random queen under attack moves to the row with the fewest conflicts. ` +
        'Every finished run is a dot on the right. Press **Run** to watch, or **Sweep** to run 10 times each for n = 8 to 8192 (the large boards take a few seconds).']
      : [`many${gG.length}${gR.length}`, (gG.length >= 4 ? `**Greedy start, median repairs: ${span('greedy', gG)}**: almost flat, as AIMA reports (about 50 steps even for a million queens). ` : '') +
        (gR.length >= 4 ? `**Random start, median repairs: ${span('random', gR)}**: here the repairs grow with $n$. A random assignment starts with about ${share('random', gR)}% of the queens in conflict, the greedy one with ${gG.length ? `${share('greedy', gG)}%` : 'only a handful'}, and each repair fixes only a few. ` : '') +
        (gG.length < 4 || gR.length < 4 ? `Switch to the ${gG.length < 4 ? 'greedy' : 'random'} start and sweep again to compare. ` : 'With the greedy start the board is almost solved before the first repair; the repairs only fix the few conflicts left. ') +
        (stuck[0] ? `On the smallest boards ${stuck[0]} of ${stuck[1]} runs found no solution within ${MAX_STEPS.toLocaleString('en-US')} repairs (the dots on the top line): min-conflicts is still a local search and can cycle on a plateau.` : '')];
    if (k === said) return;
    said = k;
    c.cap.innerHTML = md(text);
    if (!k.startsWith('few') && k !== 'sweep') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  setN(3);
  return { destroy: pause };
}

const CSS = `
.lsm-l{fill:var(--panel-2)}
.lsm-d{fill:var(--panel-3)}
.lsm-q{fill:var(--accent);transition:y .15s}
.lsm-q.bad{fill:var(--bad)}
.lsm-q.pick{stroke:var(--text);stroke-width:2}
.lsm-plot{fill:var(--panel-2);stroke:var(--border)}
.lsm-grid{stroke:var(--border);stroke-dasharray:2 4}
.lsm-med{fill:none;stroke-width:2.5;stroke-linejoin:round}
.lsm-med.greedy{stroke:var(--ok)}
.lsm-med.random{stroke:var(--warn)}
.lsm-dot{opacity:.45}
.lsm-dot.greedy{fill:var(--ok)}
.lsm-dot.random{fill:var(--warn)}
.lsm-dot.fail{fill:var(--bad);opacity:.9}
`;
