// Rationality depends on the performance measure and the environment (slides p. 24, 30): the two-square vacuum world,
// +1 per clean square per step, −c per move; after each step every clean square gets dirty again with probability q.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const NAMES = ['Keeps moving (simple reflex)', 'Stays once clean (model-based)'], CAP = 5000, X0 = 16, SQ = 60;
const PX = 330, PY = 30, PW = 230, PH = 160, HX = 612, HY = 30, HS = 148, CS = [0, 2, 0.1], QS = [0, 0.5, 0.025];

/** Long-run average score per step of the reflex program (Suck if dirty, else move): stationary distribution of its
 *  8-state Markov chain (location, dirt in A, dirt in B), by Gaussian elimination. */
export function reflexLongRun(c: number, q: number): number {
  if (q === 0) return 2 - c; // both clean for good, then a move every step
  const n = 8, A = Array.from({ length: n + 1 }, () => new Float64Array(n + 1)), r = new Float64Array(n);
  for (let st = 0; st < n; st++) {
    let loc = st >> 2;
    const d = [(st >> 1) & 1, st & 1];
    if (d[loc]) d[loc] = 0; else { loc = 1 - loc; r[st] -= c; }
    r[st] += 2 - d[0] - d[1];
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const p = (d[0] ? a : a ? q : 1 - q) * (d[1] ? b : b ? q : 1 - q);
      A[loc * 4 + a * 2 + b][st] += p; // row u: Σ_s π(s) P(s → u) = π(u)
    }
  }
  for (let u = 0; u < n; u++) A[u][u] -= 1;
  for (let st = 0; st <= n; st++) A[n][st] = 1; // Σ π = 1 replaces one balance equation
  A.splice(0, 1);
  for (let col = 0; col < n; col++) {
    const piv = A.reduce((b, row, i) => (i >= col && Math.abs(row[col]) > Math.abs(A[b][col]) ? i : b), col);
    [A[col], A[piv]] = [A[piv], A[col]];
    for (let i = 0; i < n; i++) if (i !== col) { const f = A[i][col] / A[col][col]; for (let j = col; j <= n; j++) A[i][j] -= f * A[col][j]; }
  }
  return A.reduce((sum, row, i) => sum + (row[n] / row[i]) * r[i], 0);
}
/** The model-based program stays put once it believes both squares clean: its own square is clean at every scoring time,
 *  the other one, once dirty again, is never revisited. */
export const stayLongRun = (q: number) => (q === 0 ? 2 : 1);

interface World { loc: number; dirt: number[]; mem: (number | null)[]; clean: number; moves: number; now: number; moved: boolean }
const fresh = (): World => ({ loc: 0, dirt: [1, 1], mem: [null, null], clean: 0, moves: 0, now: 0, moved: false });
function act(w: World, model: boolean) {
  w.mem[w.loc] = w.dirt[w.loc];
  let move = false;
  if (w.dirt[w.loc]) w.dirt[w.loc] = w.mem[w.loc] = 0;
  else if (!(model && w.mem[1 - w.loc] === 0)) { w.loc = 1 - w.loc; move = true; }
  const clean = 2 - w.dirt[0] - w.dirt[1];
  w.clean += clean;
  w.moves += +move;
  w.now = clean;
  w.moved = move;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-agr-css', CSS);
  const c = card(el, 'simulation', 'Rational for which measure? Keep moving or stay once clean', '0 0 780 252');
  let cost = 1, q = 0, worlds = [fresh(), fresh()], hist: [number, number][][] = [[], []], running = false, raf = 0, lastT = 0, speed = 'watch', said = '';

  // worked-example check: q = 0, c = 1, six steps → reflex 6, model-based 9 (agents.md table)
  {
    const ws = [fresh(), fresh()];
    for (let t = 0; t < 6; t++) ws.forEach((w, k) => act(w, k === 1));
    const tot = ws.map(w => w.clean - w.moves);
    if (tot[0] !== 6 || tot[1] !== 9) console.error(`agents-rational: worked example gives ${tot}, expected 6,9`);
  }

  const rows = NAMES.map((name, k) => {
    const y = 36 + k * 104;
    s(c.svg, 'text', { x: X0, y: y - 12, class: 'fg-h2 agr-h' }, name);
    const dirt = [0, 1].map(i => {
      s(c.svg, 'rect', { x: X0 + i * (SQ + 6), y, width: SQ, height: 52, rx: 6, class: 'fg-cell' });
      s(c.svg, 'text', { x: X0 + i * (SQ + 6) + 7, y: y + 14, class: 'agr-sq' }, 'AB'[i]);
      const g = s(c.svg, 'g', { class: 'agr-dirt' });
      for (const [dx, dy] of [[-15, 33], [-5, 39], [5, 32], [15, 38]]) s(g, 'circle', { cx: X0 + i * (SQ + 6) + SQ / 2 + dx, cy: y + dy, r: 3.3 });
      return g;
    });
    const agent = s(c.svg, 'circle', { r: 10, cy: y + 17, class: 'agr-agent', fill: k ? 'var(--accent)' : 'var(--warn)' });
    return { dirt, agent, now: s(c.svg, 'text', { x: 152, y: y + 18, class: 'fg-m' }), avg: s(c.svg, 'text', { x: 152, y: y + 44, class: 'fg-v' }) };
  });
  const stepTxt = s(c.svg, 'text', { x: X0, y: 240, class: 'fg-m' });

  // plot: running average score per step, with the exact long-run values dashed
  s(c.svg, 'text', { x: PX - 30, y: PY - 12, class: 'fg-t' }, 'Average score per step so far');
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'agr-box' });
  const ly = (v: number) => PY + PH - ((Math.max(-0.5, Math.min(2.2, v)) + 0.5) / 2.7) * PH;
  for (const v of [0, 1, 2]) {
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: ly(v), y2: ly(v), class: 'agr-grid' });
    s(c.svg, 'text', { x: PX - 6, y: ly(v) + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
  }
  const xmaxT = s(c.svg, 'text', { x: PX + PW, y: PY + PH + 14, class: 'fg-m', 'text-anchor': 'end' });
  s(c.svg, 'text', { x: PX, y: PY + PH + 14, class: 'fg-m' }, 'step 0');
  const lr = [0, 1].map(k => s(c.svg, 'line', { x1: PX, x2: PX + PW, class: 'agr-lr', stroke: k ? 'var(--accent)' : 'var(--warn)' }));
  const lines = [0, 1].map(k => s(c.svg, 'polyline', { class: 'agr-line', stroke: k ? 'var(--accent)' : 'var(--warn)' }));
  const leg = [0, 1].map(k => {
    s(c.svg, 'line', { x1: PX, x2: PX + 18, y1: 220 + k * 18, y2: 220 + k * 18, class: 'agr-line', stroke: k ? 'var(--accent)' : 'var(--warn)' });
    return s(c.svg, 'text', { x: PX + 24, y: 224 + k * 18, class: 'fg-m' });
  });

  // map: which program has the higher long-run average, for every (c, q)
  s(c.svg, 'text', { x: HX - 22, y: HY - 12, class: 'fg-t' }, 'Who wins in the long run');
  const nc = Math.round((CS[1] - CS[0]) / CS[2]) + 1, nq = Math.round((QS[1] - QS[0]) / QS[2]) + 1, cw = HS / nc, ch = HS / nq;
  for (let i = 0; i < nc; i++) for (let j = 0; j < nq; j++) {
    const cc = i * CS[2], qq = j * QS[2], d = reflexLongRun(cc, qq) - stayLongRun(qq);
    const pct = Math.round(35 + 65 * Math.min(1, Math.abs(d)));
    s(c.svg, 'rect', { x: HX + i * cw, y: HY + HS - (j + 1) * ch, width: cw + 0.5, height: ch + 0.5,
      'shape-rendering': 'crispEdges', fill: Math.abs(d) < 1e-9 ? 'var(--panel-3)' : `color-mix(in srgb, var(${d > 0 ? '--warn' : '--accent'}) ${pct}%, var(--panel-2))` });
  }
  s(c.svg, 'rect', { x: HX, y: HY, width: HS, height: HS, class: 'agr-frame' });
  for (const v of [0, 1, 2]) s(c.svg, 'text', { x: HX + (v / CS[1]) * (HS - cw) + cw / 2, y: HY + HS + 13, class: 'fg-m', 'text-anchor': 'middle' }, String(v));
  for (const v of [0, 0.25, 0.5]) s(c.svg, 'text', { x: HX - 5, y: HY + HS - (v / QS[1]) * (HS - ch) - ch / 2 + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
  s(c.svg, 'text', { x: HX + HS / 2, y: HY + HS + 27, class: 'fg-m', 'text-anchor': 'middle' }, 'move cost c →');
  s(c.svg, 'text', { x: HX - 30, y: HY + HS / 2, class: 'fg-m', 'text-anchor': 'middle', transform: `rotate(-90 ${HX - 30} ${HY + HS / 2})` }, 'dirt returns q →');
  const dot = s(c.svg, 'circle', { r: 5.5, class: 'agr-dot' });
  s(c.svg, 'rect', { x: HX, y: 214, width: 12, height: 10, class: 'agr-mv' });
  s(c.svg, 'text', { x: HX + 17, y: 223, class: 'fg-m' }, 'keeps moving');
  s(c.svg, 'rect', { x: HX, y: 232, width: 12, height: 10, class: 'agr-st' });
  s(c.svg, 'text', { x: HX + 17, y: 241, class: 'fg-m' }, 'stays');

  const ctl = bar(c), knobs = bar(c);
  const go = document.createElement('button');
  go.className = 'btn sm primary';
  go.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); clear(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch every step</option><option value="fast">20 steps per frame</option>';
  sp.onchange = () => { speed = sp.value; };
  ctl.append(go, reset, sp);
  const cIn = slider(knobs, 'move cost c', CS[0], CS[1], CS[2], cost, v => { cost = v; render(); });
  const qIn = slider(knobs, 'dirt returns q', QS[0], QS[1], 0.05, q, v => { q = v; clear(); render(); });
  for (const [cc, qq, why] of [[1, 0, 'worked example'], [0, 0, 'free moves'], [0.5, 0.2, 'dirt comes back']] as const) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `c = ${cc}, q = ${qq} (${why})`;
    b.onclick = () => {
      for (const [inp, v] of [[cIn, cc], [qIn, qq]] as const) { inp.value = String(v); inp.dispatchEvent(new Event('input')); }
      opts.onEvent?.(`[${c.title}] preset c = ${cc}, q = ${qq}: ${c.cap.textContent}`);
    };
    ctl.append(b);
  }
  for (const inp of [cIn, qIn]) inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] c = ${cost}, q = ${q}: ${c.cap.textContent}`));

  function clear() { worlds = [fresh(), fresh()]; hist = [[], []]; }
  function step() {
    const r = [Math.random(), Math.random()]; // the same dirt draws for both worlds
    worlds.forEach((w, k) => {
      act(w, k === 1);
      hist[k].push([w.clean, w.moves]);
      for (const i of [0, 1]) if (!w.dirt[i] && r[i] < q) w.dirt[i] = 1;
    });
    if (hist[0].length >= CAP) pause();
  }
  function play() {
    if (running) return;
    if (hist[0].length >= CAP) clear();
    running = true;
    const frame = (now: number) => {
      if (speed === 'fast') for (let i = 0; i < 20 && running; i++) step();
      else if (now - lastT > 260) { lastT = now; step(); }
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const n = hist[0].length, avg = (k: number, i: number) => (hist[k][i][0] - cost * hist[k][i][1]) / (i + 1);
    const long = [reflexLongRun(cost, q), stayLongRun(q)];
    worlds.forEach((w, k) => {
      const u = rows[k];
      u.dirt.forEach((g, i) => g.classList.toggle('hide', !w.dirt[i]));
      u.agent.setAttribute('cx', String(X0 + w.loc * (SQ + 6) + SQ / 2));
      u.now.textContent = n ? `last: ${w.now} clean${w.moved ? `, −${cost} move` : ''}` : 'start: A, both dirty';
      u.avg.textContent = n ? `average ${avg(k, n - 1).toFixed(3)}` : 'average –';
    });
    const xmax = Math.max(100, Math.ceil(n / 100) * 100), every = Math.max(1, Math.ceil(n / 300));
    lines.forEach((l, k) => {
      let p = '';
      for (let i = 0; i < n; i += every) p += `${PX + ((i + 1) / xmax) * PW},${ly(avg(k, i))} `;
      if (n) p += `${PX + (n / xmax) * PW},${ly(avg(k, n - 1))}`;
      l.setAttribute('points', p);
      lr[k].setAttribute('y1', String(ly(long[k])));
      lr[k].setAttribute('y2', String(ly(long[k])));
      leg[k].textContent = `${k ? 'stays' : 'keeps moving'}: long run ${num(long[k], 3)} (dashed)`;
    });
    xmaxT.textContent = String(xmax);
    stepTxt.textContent = `step ${n} · both worlds get the same random dirt`;
    dot.setAttribute('cx', String(HX + (cost / CS[2]) * cw + cw / 2));
    dot.setAttribute('cy', String(HY + HS - (q / QS[2]) * ch - ch / 2));
    go.textContent = running ? '⏸ Pause' : n ? '⏵ Continue' : '⏵ Run';
    explain(n, long);
  }

  // the caption follows the stage (idle / first steps / long run) and the parameters, never single frames
  function explain(n: number, [mv, st]: number[]) {
    const win = Math.abs(mv - st) < 1e-9 ? 'tie' : mv > st ? 'move' : 'stay';
    const verdict = win === 'tie' ? '**a tie**: both programs are rational here'
      : win === 'move' ? '**keeping moving** is the better program' : '**staying once clean** is the better program';
    const why = q === 0
      ? (cost === 0 ? 'Dirt never comes back and moves are free: patrolling costs nothing, so both reach 2 per step.'
        : `Dirt never comes back, so once both squares are clean every move just costs ${cost}: the reflex agent ends at ${num(2 - cost, 3)} per step, the one with memory at 2.`)
      : `Dirt comes back with probability ${q}. The staying agent keeps its own square clean but never returns to the other one: 1 per step in the long run. ` +
        (win === 'move' ? `Patrolling keeps both squares cleaner, and at c = ${cost} that is worth the moves.` : `Patrolling would clean more, but at c = ${cost} the moves cost more than they earn.`);
    const phase = !n ? 'idle' : n < 40 ? 'early' : 'late';
    const key = `${phase}|${phase === 'late' || phase === 'idle' ? `${cost}|${q}` : ''}`;
    const text = phase === 'idle'
      ? `Both agents start in A with both squares dirty. Score: **+1 per clean square per step, −c per move** (c = ${cost}); after each step a clean square ` +
        `gets dirty again with probability **q = ${q}**. Press **Run**, then drag c and q: the map shows which program wins for every pair.`
      : phase === 'early'
      ? 'The first steps are those of the worked example: Suck, Right, Suck. Then the reflex agent cannot tell that the other square is clean, so it keeps going ' +
        'back and forth; the model-based agent remembers and does **NoOp**. ' + (q ? 'Here dirt can come back, so its memory "A is clean" can be out of date. ' : '') +
        'Which one is rational depends on c and q.'
      : `**Long run (exact, from the Markov chain): keeps moving ${num(mv, 3)}, stays ${num(st, 3)} per step**, so ${verdict}. ${why} ` +
        'Same agents, same world: change the **performance measure** (c) or the **environment** (q) and the rational choice changes. ' +
        'A smarter program could beat both (e.g. go back now and then): rationality is about the best expected score, not about these two.';
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (phase !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  render();
  return { destroy: pause };
}

const CSS = `
.agr-h{font-size:14px}
.agr-sq{font-size:12px;font-weight:700;fill:var(--muted)}
.agr-dirt{fill:var(--warn);transition:opacity .25s}
.agr-agent{stroke:var(--panel);stroke-width:2.5;transition:cx .2s ease-out}
.agr-box{fill:var(--panel-2);stroke:var(--border)}
.agr-grid{stroke:var(--border);stroke-dasharray:2 4}
.agr-line{fill:none;stroke-width:2.2}
.agr-lr{stroke-width:1.3;stroke-dasharray:6 4;opacity:.9}
.agr-mv{fill:var(--warn)}
.agr-st{fill:var(--accent)}
.agr-frame{fill:none;stroke:var(--border-strong)}
.agr-dot{fill:var(--text);stroke:var(--panel);stroke-width:2}
`;
