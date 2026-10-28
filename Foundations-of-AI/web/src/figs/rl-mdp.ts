// A Markov decision process (RL p. 27–28): the exams' 3×3 grid made slippery. The intended move succeeds with probability p,
// otherwise the agent slips to one side ((1 − p)/2 each) or stays put if that side is a wall or the edge. A random walk samples it live.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const C = 74, X0 = 20, Y0 = 34, BX = 330, BW = 420, BH = 22;
export const WALL = 4, S0 = 0, GOAL = 8;
export const DIRS: [string, string, number, number][] = [['N', '↑', -1, 0], ['E', '→', 0, 1], ['S', '↓', 1, 0], ['W', '←', 0, -1]];
export const name = (i: number) => `(${Math.floor(i / 3) + 1},${(i % 3) + 1})`;
const COLORS = ['var(--ok)', 'var(--warn)', 'var(--accent)'];

/** The cell reached by moving in direction d, or -1 for a wall or the edge (the exams do not allow those moves). */
export function to(i: number, d: number) {
  const r = Math.floor(i / 3) + DIRS[d][2], k = (i % 3) + DIRS[d][3], j = r * 3 + k;
  return r < 0 || r > 2 || k < 0 || k > 2 || j === WALL ? -1 : j;
}
export const allowed = (i: number) => [0, 1, 2, 3].filter(d => to(i, d) >= 0);
/** p(s' | s, a) as [s', probability] pairs: intended with p, each side with (1 − p)/2, a blocked side keeps the agent in place. */
export function dist(i: number, a: number, p: number): [number, number][] {
  const m = new Map<number, number>();
  for (const [d, w] of [[a, p], [(a + 1) % 4, (1 - p) / 2], [(a + 3) % 4, (1 - p) / 2]]) {
    const j = to(i, d) < 0 ? i : to(i, d);
    m.set(j, (m.get(j) ?? 0) + w);
  }
  const out = [...m].filter(([, w]) => w > 1e-12).sort((x, y) => y[1] - x[1]);
  const sum = out.reduce((x, [, w]) => x + w, 0);
  if (Math.abs(sum - 1) > 1e-9) console.error(`rl-mdp: p(s', r | s, a) sums to ${sum}`);
  return out;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rlm-css', CSS);
  const c = card(el, 'simulation', 'A slippery grid: the one-step dynamics p(s′, r | s, a)', '0 0 780 300');
  let p = 0.8, sel = 0, act = 1, speed = 'watch', running = false, raf = 0, last = 0, said = '';
  let pos = S0, prev = -1, D = dist(sel, act, p), agreed = false;
  const counts = new Map<number, number[]>(); // history (previous cell, −1 = start of the episode) → outcome counts

  // grid
  const cells: SVGRectElement[] = [];
  for (let i = 0; i < 9; i++) {
    const x = X0 + (i % 3) * C, y = Y0 + Math.floor(i / 3) * C;
    cells.push(s(c.svg, 'rect', { x, y, width: C, height: C, class: i === WALL ? 'fg-wall' : i === GOAL ? 'fg-goal' : 'fg-cell rlm-pick' }));
    if (i !== WALL) s(c.svg, 'text', { x: x + 5, y: y + 14, class: 'fg-m' }, name(i));
    cells[i].onclick = () => { if (i !== WALL && i !== GOAL) { sel = i; if (!allowed(i).includes(act)) act = allowed(i)[0]; restart(); } };
  }
  s(c.svg, 'text', { x: X0 + 2.5 * C, y: Y0 + 2.5 * C + 18, class: 'rlm-g' }, 'G');
  const outT = [0, 1, 2].map(() => s(c.svg, 'text', { class: 'rlm-pct' }));
  const arrowLine = s(c.svg, 'line', { class: 'rlm-act' });
  const agent = s(c.svg, 'circle', { r: 8, class: 'rlm-agent' });
  s(c.svg, 'text', { x: X0, y: Y0 + 3 * C + 18, class: 'fg-m' }, 'Click a cell to choose s; choose a below.');
  s(c.svg, 'text', { x: X0, y: Y0 + 3 * C + 34, class: 'fg-m' }, 'Reward: 1 into G, 0 otherwise.');

  // stacked bars: the exact distribution, then the observed one, overall and split by where the agent came from
  const head = s(c.svg, 'text', { x: BX, y: Y0 - 12, class: 'fg-t' });
  const rows = [0, 1, 2, 3, 4, 5].map(k => {
    const y = Y0 + 8 + k * 38 + (k ? 14 : 0);
    const g = s(c.svg, 'g', {});
    const lab = s(g, 'text', { x: BX, y: y - 4, class: 'fg-m' });
    s(g, 'rect', { x: BX, y, width: BW, height: BH, class: 'rlm-bg' });
    const segs = [0, 1, 2].map(o => s(g, 'rect', { y, height: BH, fill: COLORS[o], class: 'rlm-seg' }));
    const txt = [0, 1, 2].map(() => s(g, 'text', { y: y + 15, class: 'rlm-st' }));
    return { g, lab, segs, txt };
  });
  const legend = [0, 1, 2].map(o => {
    const g = s(c.svg, 'g', {});
    s(g, 'rect', { x: BX + o * 140, y: 284, width: 12, height: 10, fill: COLORS[o] });
    return { g, t: s(g, 'text', { x: BX + o * 140 + 17, y: 293, class: 'fg-m' }) };
  });

  const ctl = bar(c), knobs = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset counts';
  reset.onclick = () => restart();
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch: 5 steps per second</option><option value="fast">200 steps per frame</option><option value="turbo">5000 steps per frame</option>';
  sp.onchange = () => { speed = sp.value; render(); };
  ctl.append(run, reset, sp);
  const actBtn = DIRS.map(([, g], d) => {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `a = ${g}`;
    b.onclick = () => { act = d; restart(); };
    ctl.append(b);
    return b;
  });
  const inp = slider(knobs, 'p (intended move succeeds)', 0, 1, 0.05, p, v => { p = v; restart(true); });
  inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] p = ${p}`));
  for (const v of [1, 0.8, 0.5]) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = v === 1 ? 'p = 1 (the exams)' : `p = ${v}`;
    b.onclick = () => { inp.value = String(v); inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change')); };
    knobs.append(b);
  }

  function restart(quiet = false) {
    D = dist(sel, act, p);
    counts.clear();
    agreed = false;
    render();
    if (!quiet) opts.onEvent?.(`[${c.title}] s = ${name(sel)}, a = ${DIRS[act][1]}: ${D.map(([j, w]) => `${name(j)} ${num(w, 3)}`).join(', ')}`);
  }
  // one step of the random walk; transitions out of (sel, act) are recorded by history
  function step() {
    const acts = allowed(pos), a = acts[Math.floor(Math.random() * acts.length)];
    let u = Math.random(), next = pos;
    for (const [j, w] of dist(pos, a, p)) { next = j; if ((u -= w) < 0) break; }
    if (pos === sel && a === act) {
      const row = counts.get(prev) ?? [0, 0, 0];
      row[D.findIndex(([j]) => j === next)]++;
      counts.set(prev, row);
    }
    prev = next === GOAL ? -1 : pos;
    pos = next === GOAL ? S0 : next;
  }
  function play() {
    running = true;
    const frame = (now: number) => {
      if (speed === 'watch') { if (now - last > 200) { last = now; step(); } }
      else for (let k = speed === 'fast' ? 200 : 5000; k > 0; k--) step();
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  const cx = (i: number) => X0 + (i % 3) * C + C / 2, cy = (i: number) => Y0 + Math.floor(i / 3) * C + C / 2;
  function fill(r: typeof rows[number], label: string, fr: number[]) {
    r.g.classList.remove('hide');
    r.lab.textContent = label;
    let x = BX;
    fr.forEach((f, o) => {
      r.segs[o].setAttribute('x', String(x));
      r.segs[o].setAttribute('width', String(f * BW));
      r.txt[o].setAttribute('x', String(x + (f * BW) / 2));
      r.txt[o].textContent = f * BW > 34 ? `${num(f * 100, 3)}%` : '';
      x += f * BW;
    });
  }
  function render() {
    const total = [0, 0, 0];
    for (const row of counts.values()) row.forEach((v, o) => { total[o] += v; });
    const n = total.reduce((x, y) => x + y, 0), freq = (row: number[]) => { const m = row.reduce((x, y) => x + y, 0); return row.map(v => (m ? v / m : 0)); };
    head.textContent = `s = ${name(sel)}, a = ${DIRS[act][1]}`;
    fill(rows[0], "exact p(s′, r | s, a)", D.map(([, w]) => w).concat([0, 0]).slice(0, 3));
    fill(rows[1], `observed, all ${n} times the walk did a in s`, freq(total));
    const hist = [...counts].sort((x, y) => y[1].reduce((a, b) => a + b, 0) - x[1].reduce((a, b) => a + b, 0));
    rows.slice(2).forEach((r, k) => {
      const h = hist[k];
      if (!h) { r.g.classList.add('hide'); return; }
      const m = h[1].reduce((a, b) => a + b, 0);
      fill(r, `… after arriving ${h[0] < 0 ? 'at the start of an episode' : h[0] === sel ? 'by staying in s' : `from ${name(h[0])}`} (${m})`, freq(h[1]));
    });
    D.forEach(([j, w], o) => {
      outT[o].setAttribute('x', String(cx(j)));
      outT[o].setAttribute('y', String(cy(j) + (j === sel ? 28 : 6)));
      outT[o].setAttribute('fill', COLORS[o]);
      outT[o].textContent = num(w, 3);
      legend[o].t.textContent = `s′ = ${name(j)}, r = ${j === GOAL ? 1 : 0}`;
    });
    for (let o = 0; o < 3; o++) legend[o].g.classList.toggle('hide', o >= D.length);
    for (let o = D.length; o < 3; o++) outT[o].textContent = '';
    const t = to(sel, act);
    arrowLine.setAttribute('x1', String(cx(sel)));
    arrowLine.setAttribute('y1', String(cy(sel)));
    arrowLine.setAttribute('x2', String((cx(sel) + cx(t)) / 2));
    arrowLine.setAttribute('y2', String((cy(sel) + cy(t)) / 2));
    cells.forEach((e, i) => e.classList.toggle('rlm-sel', i === sel));
    agent.setAttribute('transform', `translate(${cx(pos)},${cy(pos)})`);
    agent.classList.toggle('hide', !running || speed !== 'watch');
    actBtn.forEach((b, d) => { b.disabled = !allowed(sel).includes(d); b.classList.toggle('primary', d === act); });
    run.textContent = running ? '⏸ Pause' : n ? '⏵ Continue' : '⏵ Walk';
    explain(n, hist.map(h => freq(h[1])), hist.map(h => h[1].reduce((a, b) => a + b, 0)));
  }

  function explain(n: number, rowsF: number[][], rowsN: number[]) {
    const big = rowsF.filter((_, k) => rowsN[k] >= 300);
    agreed ||= big.length >= 2 && big.every(f => f.every((v, o) => Math.abs(v - (D[o]?.[1] ?? 0)) < 0.04)); // once reached, the caption stays
    const agree = agreed;
    const ex = D.map(([j, w]) => `$${num(w, 3)}$ for ${name(j)}`).join(', ');
    const stage = D.length === 1 ? 'det' : !n ? 'idle' : agree ? 'agree' : 'few';
    const key = `${sel}${act}${p}${stage}`;
    if (key === said) return;
    said = key;
    const text = stage === 'det'
      ? `**$p = 1$: a deterministic environment**, as in every exam grid: doing ${DIRS[act][1]} in ${name(sel)} always leads to ${name(D[0][0])}, so $p(s', r \\mid s, a)$ puts probability 1 on a single outcome. Lower $p$ to make the floor slippery.`
      : stage === 'idle'
      ? `**The outcome of an action is a probability distribution.** Doing ${DIRS[act][1]} in ${name(sel)} gives ${ex}, and these sum to 1 for every $s$ and every $a \\in A(s)$ (RL p. 28). A slip into a wall or the edge leaves the agent where it is. Press **Walk**: a random walk samples the environment.`
      : stage === 'few'
      ? '**Sampling.** Each time the walk does $a$ in $s$, the next cell is drawn from $p(s\', r \\mid s, a)$. The rows below split those times by **where the agent came from**; with few samples they still differ. Try **5000 steps per frame**.'
      : `**Markov property.** Every row converges to the same ${ex}, however the agent got to ${name(sel)}: the next state and reward depend only on $s_t$ and $a_t$, not on the earlier history (RL p. 28). ` +
        'That is what lets Q-learning keep one value per $(s, a)$ pair.';
    c.cap.innerHTML = md(text);
    if (stage === 'agree') opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  render();
  return { destroy: pause };
}

const CSS = `
.rlm-pick{cursor:pointer}
.fg-cell.rlm-sel{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2}
.rlm-g{font-size:18px;font-weight:700;fill:var(--ok);text-anchor:middle}
.rlm-pct{font:600 13px var(--mono);text-anchor:middle;pointer-events:none}
.rlm-act{stroke:var(--accent);stroke-width:4;stroke-linecap:round;pointer-events:none}
.rlm-agent{fill:var(--warn);stroke:var(--panel);stroke-width:2;pointer-events:none}
.rlm-bg{fill:var(--panel-2);stroke:var(--border)}
.rlm-seg{opacity:.85;transition:width .2s,x .2s}
.rlm-st{font:600 11px var(--mono);fill:var(--bg);text-anchor:middle;pointer-events:none}
`;
