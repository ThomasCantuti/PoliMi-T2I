// WalkSAT (AIMA §7.6.2, Fig. 7.18) live on a random 3-CNF: the unsatisfied clauses per flip, with p and m/n as sliders;
// DPLL (§7.6.1) on demand to settle what WalkSAT cannot. Exports the random 3-CNF generator and DPLL for logic-threshold.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

export type Cnf = number[][]; // a literal is ±v, v = 1…n

/** AIMA's random 3-CNF: m clauses, each over 3 distinct symbols, each negated with probability 1/2. */
export function random3(n: number, m: number): Cnf {
  return Array.from({ length: m }, () => {
    const vs: number[] = [];
    while (vs.length < 3) { const v = 1 + Math.floor(Math.random() * n); if (!vs.includes(v)) vs.push(v); }
    return vs.map(v => (Math.random() < 0.5 ? -v : v));
  });
}

/** DPLL as in AIMA Fig. 7.17 (early termination, pure symbol, unit clause, split on the first unassigned symbol, true first);
 *  `calls` counts the calls of the recursive function, AIMA's measure of its work (Fig. 7.19). */
export function dpll(cnf: Cnf, n: number): { sat: boolean; calls: number } {
  let calls = 0, found: Int8Array | null = null;
  const val = (l: number, m: Int8Array) => { const a = m[Math.abs(l)]; return a === 0 ? 0 : (a > 0) === (l > 0) ? 1 : -1; };
  const set = (m: Int8Array, l: number) => { const c = m.slice(); c[Math.abs(l)] = l > 0 ? 1 : -1; return c; };
  const go = (m: Int8Array): boolean => {
    calls++;
    let all = true, unit = 0;
    const sign = new Int8Array(n + 1); // 1: seen positive, 2: seen negative, in the clauses not yet true
    for (const cl of cnf) {
      let t = false, free = 0, last = 0;
      for (const l of cl) { const v = val(l, m); if (v === 1) { t = true; break; } if (v === 0) { free++; last = l; } }
      if (t) continue;
      if (!free) return false;
      all = false;
      if (free === 1 && !unit) unit = last;
      for (const l of cl) if (val(l, m) === 0) sign[Math.abs(l)] |= l > 0 ? 1 : 2;
    }
    if (all) { found = m; return true; }
    for (let v = 1; v <= n; v++) if (sign[v] === 1 || sign[v] === 2) return go(set(m, sign[v] === 1 ? v : -v));
    if (unit) return go(set(m, unit));
    let v = 1;
    while (m[v] !== 0) v++;
    return go(set(m, v)) || go(set(m, -v));
  };
  const sat = go(new Int8Array(n + 1)), m = found as Int8Array | null;
  if (sat && !cnf.every(cl => cl.some(l => m && m[Math.abs(l)] === (l > 0 ? 1 : -1)))) console.error('logic-walksat: DPLL returned a non-model');
  return { sat, calls };
}

const N = 50, MAX = 10000, PX = 440, PY = 46, PW = 316, PH = 180, COLS = 25, Q = 13;
const isTrue = (cl: number[], m: Uint8Array) => cl.some(l => (m[Math.abs(l)] === 1) === (l > 0));
const unsat = (cnf: Cnf, m: Uint8Array) => cnf.reduce((u, cl) => u + +!isTrue(cl, m), 0);

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lgs-css', CSS);
  const c = card(el, 'simulation', 'WalkSAT: local search on a random 3-CNF', '0 0 780 330');
  let p = 0.5, ratio = 4, speed = 1, cnf: Cnf = [], model = new Uint8Array(N + 1), hist: number[] = [], flips = 0, greedy = 0;
  let pick = -1, flipped = 0, running = false, raf = 0, said = '', verdict: { sat: boolean; calls: number } | null = null;

  // left: the model (one cell per symbol) and the clauses (one cell per clause, red while unsatisfied)
  s(c.svg, 'text', { x: 16, y: 22, class: 'fg-t' }, `model: ${N} symbols (filled = true)`);
  const vars = Array.from({ length: N }, (_, k) => s(c.svg, 'rect', { x: 16 + (k % COLS) * Q, y: 30 + Math.floor(k / COLS) * Q, width: Q - 2, height: Q - 2, rx: 2, class: 'lgs-var' }));
  const clsT = s(c.svg, 'text', { x: 16, y: 82, class: 'fg-t' });
  let cells: SVGRectElement[] = [];
  const cellG = s(c.svg, 'g');
  // right: the plot of unsatisfied clauses per flip
  s(c.svg, 'text', { x: PX - 36, y: PY - 18, class: 'fg-t' }, 'unsatisfied clauses after each flip');
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'lgs-plot' });
  const yt = [0, 1, 2].map(k => s(c.svg, 'text', { x: PX - 6, y: PY + PH - (k * PH) / 2 + 4, class: 'fg-m', 'text-anchor': 'end' }));
  const xt = [0, 1, 2].map(k => s(c.svg, 'text', { x: PX + (k * PW) / 2, y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'middle' }));
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 30, class: 'fg-m', 'text-anchor': 'end' }, 'flips');
  const line = s(c.svg, 'polyline', { class: 'lgs-line' });
  const stat = [0, 1, 2].map(k => s(c.svg, 'text', { x: PX - 36, y: 274 + k * 20, class: k ? 'fg-t' : 'fg-h2' }));

  const ctl = bar(c), knobs = bar(c);
  const btn = (t: string, cls = 'btn sm') => { const b = document.createElement('button'); b.className = cls; b.textContent = t; return b; };
  const run = btn('', 'btn sm primary'), restartB = btn('↺ Restart from a random model'), fresh = btn('New formula'), ask = btn('Ask DPLL');
  run.onclick = () => (running ? pause() : play());
  restartB.onclick = () => { pause(); restart(); render(); opts.onEvent?.(`[${c.title}] restart from a random model: ${hist[0]} clauses unsatisfied`); };
  fresh.onclick = () => { pause(); newFormula(); render(); opts.onEvent?.(`[${c.title}] new formula, m/n = ${ratio}`); };
  ask.onclick = () => { verdict = dpll(cnf, N); render(); opts.onEvent?.(`[${c.title}] DPLL: ${verdict.sat ? 'satisfiable' : 'unsatisfiable'} after ${verdict.calls} calls`); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="1">1 flip per frame</option><option value="10">10 flips per frame</option><option value="100">100 flips per frame</option>';
  sp.onchange = () => { speed = +sp.value; };
  ctl.append(run, restartB, fresh, ask, sp);
  slider(knobs, 'p', 0, 1, 0.05, p, v => { p = v; render(); }).addEventListener('change', () => opts.onEvent?.(`[${c.title}] p = ${p}`));
  slider(knobs, 'm/n', 2, 6, 0.1, ratio, v => { ratio = v; }).addEventListener('change', () => { pause(); newFormula(); render(); opts.onEvent?.(`[${c.title}] m/n = ${ratio}: new formula`); });

  function newFormula() {
    cnf = random3(N, Math.round(ratio * N));
    verdict = null;
    cellG.textContent = '';
    cells = cnf.map((_, k) => s(cellG, 'rect', { x: 16 + (k % COLS) * Q, y: 90 + Math.floor(k / COLS) * Q, width: Q - 2, height: Q - 2, rx: 2 }));
    restart();
  }
  function restart() {
    for (let v = 1; v <= N; v++) model[v] = Math.random() < 0.5 ? 1 : 0;
    hist = [unsat(cnf, model)];
    flips = greedy = 0;
    pick = -1;
    flipped = 0;
  }
  /** One iteration of WALKSAT: a random false clause, then a random-walk flip (prob. p) or the greedy flip. */
  function flip() {
    const bad = cnf.flatMap((cl, k) => (isTrue(cl, model) ? [] : [k]));
    pick = bad[Math.floor(Math.random() * bad.length)];
    const cl = cnf[pick];
    let v: number;
    if (Math.random() < p) v = Math.abs(cl[Math.floor(Math.random() * 3)]);
    else {
      let best = Infinity, cands: number[] = [];
      for (const l of cl) {
        const x = Math.abs(l);
        model[x] ^= 1;
        const u = unsat(cnf, model);
        model[x] ^= 1;
        if (u < best) { best = u; cands = [x]; } else if (u === best) cands.push(x);
      }
      v = cands[Math.floor(Math.random() * cands.length)];
      greedy++;
    }
    model[v] ^= 1;
    flipped = v;
    flips++;
    hist.push(unsat(cnf, model));
  }
  const done = () => hist[hist.length - 1] === 0 || flips >= MAX;
  function play() {
    if (running || done()) return;
    running = true;
    const frame = () => {
      for (let k = 0; k < speed && !done(); k++) flip();
      if (done()) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const now = hist[hist.length - 1], m = cnf.length;
    vars.forEach((r, k) => r.setAttribute('class', `lgs-var${model[k + 1] ? ' on' : ''}${flipped === k + 1 && running ? ' flip' : ''}`));
    cells.forEach((r, k) => r.setAttribute('class', `lgs-cl${isTrue(cnf[k], model) ? '' : ' bad'}${k === pick && running ? ' pick' : ''}`));
    clsT.textContent = `formula: ${m} clauses (m/n = ${num(m / N, 3)}), red = unsatisfied`;
    const ymax = Math.max(4, Math.ceil(Math.max(...hist) / 4) * 4), xmax = Math.max(100, Math.ceil(flips / 100) * 100);
    yt.forEach((t, k) => { t.textContent = String((k * ymax) / 2); });
    xt.forEach((t, k) => { t.textContent = String((k * xmax) / 2); });
    const every = Math.max(1, Math.ceil(hist.length / 600));
    let pts = '';
    for (let k = 0; k < hist.length; k += every) pts += `${PX + (k / xmax) * PW},${PY + PH - (hist[k] / ymax) * PH} `;
    line.setAttribute('points', pts + `${PX + (flips / xmax) * PW},${PY + PH - (now / ymax) * PH}`);
    stat[0].textContent = now === 0 ? `model found after ${flips} flips` : flips >= MAX ? `failure after ${MAX} flips` : `flip ${flips}: ${now} unsatisfied`;
    stat[1].textContent = `${greedy} greedy flips, ${flips - greedy} random-walk flips · best so far ${Math.min(...hist)}`;
    stat[2].textContent = verdict ? `DPLL: ${verdict.sat ? 'satisfiable' : 'unsatisfiable'} (${verdict.calls} calls)` : 'DPLL not asked yet';
    run.textContent = running ? '⏸ Pause' : flips ? '⏵ Continue' : '⏵ Run WalkSAT';
    run.disabled = done();
    ask.disabled = !!verdict;
    explain();
  }

  // the caption follows the stage of the run
  function explain() {
    const now = hist[hist.length - 1], m = cnf.length;
    const v = verdict ? `**DPLL**, which is complete, settles it: ${verdict.sat ? `**satisfiable** (${verdict.calls} calls). ` +
      (now ? 'A model exists: WalkSAT did not find it within its flips, which is why its failure means only "don\'t know".' : 'It agrees with the model WalkSAT found.')
      : `**unsatisfiable** (${verdict.calls} calls). No model exists, so no number of flips could have succeeded: WalkSAT can never prove this.`} ` : '';
    const [key, text] = now === 0
      ? [`ok${!!verdict}`, `**Model found after ${flips} flips**: every clause is true, so the formula is **satisfiable**. A returned model is always a real model (sound). ${v}` +
        `Restart a few times: the number of flips changes from run to run. Then try $p = 0$ (always greedy: it can cycle in a local minimum) and $p = 1$ (a pure random walk).`]
      : flips >= MAX ? [`fail${!!verdict}`, `**Failure after ${MAX} flips** (best: ${Math.min(...hist)} unsatisfied). WalkSAT is **not complete**: failure does not mean unsatisfiable, only **don't know**. ${v || 'Press **Ask DPLL** to settle it.'}`]
      : !flips ? [`idle${m}${!!verdict}`, `A random 3-CNF with $n = ${N}$ symbols and $m = ${m}$ clauses ($m/n = ${num(m / N, 3)}$). WalkSAT starts from a **random model**: ${now} clauses are false (red). ` +
        `The objective is that count; each flip changes one symbol. ${v}Press **Run**.`]
      : [`run${!!verdict}`, `Each flip picks a **red clause at random**; with probability $p = ${p}$ it flips a random symbol of that clause (random walk), otherwise the symbol whose flip leaves the **fewest** false clauses (greedy). ` +
        `The count drops fast at first, then wanders on a plateau of a few false clauses: that is the hard part. ${v}`];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (!key.startsWith('idle')) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  newFormula();
  render();
  return { destroy: pause };
}

const CSS = `
.lgs-var{fill:var(--panel-2);stroke:var(--border)}
.lgs-var.on{fill:var(--accent);stroke:var(--accent)}
.lgs-var.flip{stroke:var(--warn);stroke-width:2.5}
.lgs-cl{fill:var(--ok-soft);stroke:var(--border)}
.lgs-cl.bad{fill:var(--bad);stroke:var(--bad)}
.lgs-cl.pick{stroke:var(--warn);stroke-width:2.5}
.lgs-plot{fill:var(--panel-2);stroke:var(--border)}
.lgs-line{fill:none;stroke:var(--accent);stroke-width:1.5;stroke-linejoin:round}
`;
