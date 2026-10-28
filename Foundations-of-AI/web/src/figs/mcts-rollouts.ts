// Evaluation by rollouts (slides p. 409, 427–428): random playouts after X's first move, the win rate with its 95% band, and the
// exact random-play probability (an expectation over the whole tree) it converges to. Simulation.
import { EMPTY, empties, minimax, over, put, toMove, winner, miniBoard, type Board } from './adv-ttt-tree';
import { bar, card, md, num, s, style, type FigOptions } from './shell';

const LANES = [{ name: 'center', i: 4, e: 4 }, { name: 'corner', i: 0, e: 3 }, { name: 'edge', i: 1, e: 2 }];
const SLIDES = [69.2, 60.9, 53.8], END = 10000; // the slides' X-win percentages after 10 000 playouts
const PX = 300, PY = 26, PW = 450, PH = 236, LY = 30, LH = 92;

/** P(X wins), P(O wins), P(draw) when both players move uniformly at random from b. */
const memo = new Map<Board, number[]>();
function exact(b: Board): number[] {
  let r = memo.get(b);
  if (r) return r;
  const w = winner(b);
  if (w || !b.includes('.')) r = [+(w === 'X'), +(w === 'O'), +!w];
  else {
    const m = empties(b), p = toMove(b);
    r = [0, 0, 0];
    for (const i of m) exact(put(b, i, p)).forEach((x, k) => { r![k] += x / m.length; });
  }
  memo.set(b, r);
  return r;
}

function playout(b: Board): { end: Board; order: number[] } {
  const order: number[] = [];
  while (!over(b)) { const m = empties(b), i = m[Math.floor(Math.random() * m.length)]; b = put(b, i, toMove(b)); order.push(i); }
  return { end: b, order };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-mcr-css', CSS);
  const c = card(el, 'simulation', 'Evaluation by rollouts: random playouts after X\'s first move', '0 0 780 300');
  const start = LANES.map(l => put(EMPTY, l.i, 'X')), ex = start.map(exact);
  ex.forEach((p, k) => {
    const z = (SLIDES[k] / 100 - p[0]) / Math.sqrt((p[0] * (1 - p[0])) / END);
    if (Math.abs(z) > 3) console.error(`mcts-rollouts: slide ${SLIDES[k]}% is ${num(z, 2)} σ from the exact ${num(p[0] * 100, 4)}%`);
  });
  const tally = LANES.map(() => [0, 0, 0]), hist: [number, number][][] = LANES.map(() => []);
  let running = false, raf = 0, speed = 'watch', lastT = 0, said = '', sepAt = 0;

  // lanes: the first move (and the last playout, numbered), the tallies as in the slide
  const lanes = LANES.map((l, k) => {
    const y = LY + k * LH, b = miniBoard(c.svg, 16, y, 66);
    const nums = Array.from({ length: 9 }, (_, i) => s(c.svg, 'text', { x: 16 + (i % 3) * 22 + 19, y: y + Math.floor(i / 3) * 22 + 8, class: 'mcr-ord' }));
    s(c.svg, 'text', { x: 94, y: y + 12, class: `mcr-name k${k}` }, `X plays the ${l.name}`);
    const t = [0, 1, 2, 3].map(r => s(c.svg, 'text', { x: 94, y: y + 30 + r * 15, class: r === 3 ? 'fg-m' : 'mcr-t' }));
    b.set(start[k], [l.i]);
    return { b, nums, t };
  });

  // plot: X's win rate against the number of playouts (log scale), with the band and the exact value
  s(c.svg, 'text', { x: PX - 34, y: PY - 10, class: 'fg-t' }, 'X wins (estimate ± 1.96·σ/√n)');
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'mcr-box' });
  const px = (n: number) => PX + (Math.log10(n) / Math.log10(END)) * PW, py = (p: number) => PY + PH - p * PH;
  for (let q = 0; q <= 1; q += 0.25) {
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: py(q), y2: py(q), class: 'mcr-grid' });
    s(c.svg, 'text', { x: PX - 6, y: py(q) + 4, class: 'fg-m', 'text-anchor': 'end' }, `${q * 100}%`);
  }
  for (const n of [1, 10, 100, 1000, END]) s(c.svg, 'text', { x: px(n), y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'middle' }, n.toLocaleString('en-US'));
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 30, class: 'fg-m', 'text-anchor': 'end' }, 'playouts n');
  const bands = LANES.map((_, k) => s(c.svg, 'polygon', { class: `mcr-band k${k}` }));
  ex.forEach((p, k) => {
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: py(p[0]), y2: py(p[0]), class: `mcr-exact k${k}` });
    s(c.svg, 'text', { x: PX + PW - 4, y: py(p[0]) - 4, class: `mcr-et k${k}`, 'text-anchor': 'end' }, `${num(p[0] * 100, 4)}%`);
  });
  const lines = LANES.map((_, k) => s(c.svg, 'polyline', { class: `mcr-line k${k}` }));

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); clear(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch: 4 playouts per second</option><option value="fast">20 playouts per frame</option><option value="turbo">250 playouts per frame</option>';
  sp.onchange = () => { speed = sp.value; opts.onEvent?.(`[${c.title}] speed: ${sp.selectedOptions[0].text}`); };
  ctl.append(run, reset, sp);

  const n = () => tally[0][0] + tally[0][1] + tally[0][2];
  function clear() { tally.forEach(t => t.fill(0)); hist.forEach(h => { h.length = 0; }); sepAt = 0; said = ''; lanes.forEach((l, k) => { l.b.set(start[k], [LANES[k].i]); l.nums.forEach(x => { x.textContent = ''; }); }); }
  function once(show: boolean) {
    LANES.forEach((l, k) => {
      const { end, order } = playout(start[k]), w = winner(end);
      tally[k][w === 'X' ? 0 : w === 'O' ? 1 : 2]++;
      if (show) { lanes[k].b.set(end, [l.i, ...order]); lanes[k].nums.forEach((x, i) => { const o = order.indexOf(i); x.textContent = o >= 0 ? String(o + 1) : ''; }); }
    });
    const m = n(), last = hist[0][hist[0].length - 1]?.[0] ?? 0;
    if (m <= 20 || Math.floor(60 * Math.log10(m)) > Math.floor(60 * Math.log10(last)) || m === END)
      LANES.forEach((_, k) => hist[k].push([m, tally[k][0] / m]));
    if (!sepAt && sep()) sepAt = m;
  }
  const est = (k: number) => tally[k][0] / Math.max(1, n()), half = (k: number) => 1.96 * Math.sqrt((est(k) * (1 - est(k))) / Math.max(1, n()));
  const lo = (k: number) => est(k) - half(k), hi = (k: number) => est(k) + half(k);
  const sep = () => n() >= 10 && hi(1) < lo(0) && hi(2) < lo(1); // the three bands are disjoint, in this order
  function play() {
    if (n() >= END) clear();
    running = true;
    opts.onEvent?.(`[${c.title}] run (${sp.selectedOptions[0].text})`);
    const frame = (ts: number) => {
      if (speed === 'watch') { if (ts - lastT > 250) { lastT = ts; once(true); } }
      else for (let r = speed === 'fast' ? 20 : 250; r > 0 && n() < END; r--) once(r === 1);
      if (n() >= END) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const m = n();
    LANES.forEach((_, k) => {
      const h = hist[k], band = (sgn: number) => h.map(([x, p]) => `${px(x)},${py(Math.min(1, Math.max(0, p + sgn * 1.96 * Math.sqrt((p * (1 - p)) / x))))}`);
      lines[k].setAttribute('points', h.map(([x, p]) => `${px(x)},${py(p)}`).join(' '));
      bands[k].setAttribute('points', [...band(1), ...band(-1).reverse()].join(' '));
      const [xw, ow, d] = tally[k], pc = (v: number) => (m ? ` (${num((100 * v) / m, 3)}%)` : '');
      lanes[k].t[0].textContent = `X wins ${xw}${pc(xw)}`;
      lanes[k].t[1].textContent = `O wins ${ow}${pc(ow)}`;
      lanes[k].t[2].textContent = `ties ${d}${pc(d)}`;
      lanes[k].t[3].textContent = m ? `95% band: ± ${num(100 * half(k), 2)} points` : 'no playouts yet';
    });
    run.textContent = running ? '⏸ Pause' : m >= END ? '⏵ Run again' : m ? '⏵ Continue' : '⏵ Run playouts';
    explain();
  }

  function explain() {
    const m = n(), pct = (k: number) => `${num(100 * est(k), 3)}%`;
    const [key, text] = !m
      ? ['idle', `**X has played its first move**; from there **both players move at random** until the game ends, and we count who wins. No evaluation function, no knowledge of the game. ` +
        `Press **Run**: the three first moves get one playout each per step (the slides ran ${END.toLocaleString('en-US')}).`]
      : m < 30
      ? ['few', '**Few playouts:** one game moves an estimate by many points, so the lines jump and the bands are wide. "5 of 10" is almost no information (slides p. 428).']
      : !sep()
      ? ['overlap', '**The bands still overlap:** we cannot yet tell the moves apart with confidence. They shrink like $1/\\sqrt n$: 4× the playouts for half the width.']
      : m < END
      ? ['sep', `**The bands are separated** (first after ${sepAt} playouts): they no longer overlap, so the ranking **center > corner > edge** is now reliable even though each value is still uncertain. ` +
        'Each estimate wanders around its dashed line, the exact value it converges to.']
      : ['done', `**${END.toLocaleString('en-US')} playouts each:** center ${pct(0)}, corner ${pct(1)}, edge ${pct(2)}; the slides got ${SLIDES.map(x => `${x}%`).join(', ')}. ` +
        `The dashed lines are the **exact** random-play probabilities, an average over the whole tree: ${ex.map(p => `${num(100 * p[0], 4)}%`).join(', ')}. ` +
        `With **perfect** play all three moves are ${start.every(b => minimax(b) === 0) ? 'draws' : 'not equal'}: rollouts measure the value under random play, not the minimax value, ` +
        `yet the ranking matches the open-lines $e(s)$: ${LANES.map(l => `${l.name} ${l.e}`).join(' > ')}.`];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  render();
  return { destroy: pause };
}

const CSS = `
.mcr-box{fill:var(--panel-2);stroke:var(--border)}
.mcr-grid{stroke:var(--border);stroke-dasharray:2 4}
.mcr-ord{font:600 8.5px var(--mono);fill:var(--muted);text-anchor:end}
.mcr-name{font-size:13px;font-weight:650}
.mcr-t{font:12px var(--mono);fill:var(--text-2)}
.mcr-line{fill:none;stroke-width:2}
.mcr-band{opacity:.18}
.mcr-exact{stroke-width:1.3;stroke-dasharray:6 4}
.mcr-et{font:600 11px var(--mono)}
.mcr-name.k0,.mcr-et.k0{fill:var(--accent)}
.mcr-name.k1,.mcr-et.k1{fill:var(--ok)}
.mcr-name.k2,.mcr-et.k2{fill:var(--v-min)}
.mcr-line.k0,.mcr-exact.k0{stroke:var(--accent)}
.mcr-line.k1,.mcr-exact.k1{stroke:var(--ok)}
.mcr-line.k2,.mcr-exact.k2{stroke:var(--v-min)}
.mcr-band.k0{fill:var(--accent)}
.mcr-band.k1{fill:var(--ok)}
.mcr-band.k2{fill:var(--v-min)}
`;
