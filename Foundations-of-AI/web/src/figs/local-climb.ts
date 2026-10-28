// Hill climbing on 8-queens, many times over (slides p. 321, 331–335; AIMA 4.1.1): simulation. Steepest descent on h = attacking
// pairs from random states (one queen per column), ties broken at random; plain, with up to 100 sideways moves, with random restarts.
import { bar, card, md, num, s, style, type FigOptions } from './shell';

const N = 8, CELL = 16, SIDE = 100, CAP = 20000, BY = 40;
const VARIANTS = [
  { name: 'steepest descent', side: 0, restart: false, cls: 'v0' },
  { name: '+ ≤ 100 sideways moves', side: SIDE, restart: false, cls: 'v1' },
  { name: '+ random restarts', side: 0, restart: true, cls: 'v2' },
];
const SPEEDS: Record<string, number> = { watch: 0.2, fast: 1, turbo: 0 };

/** One 8-queens state with line counts, so that moving a queen and scoring all 56 neighbours is cheap. */
class Board {
  q = new Int8Array(N); row = new Int8Array(N); d1 = new Int8Array(2 * N); d2 = new Int8Array(2 * N); h = 0;
  constructor() { for (let c = 0; c < N; c++) this.put(c, Math.floor(Math.random() * N)); }
  conf(c: number, r: number) { return this.row[r] + this.d1[r + c] + this.d2[r - c + N]; }
  put(c: number, r: number) { this.h += this.conf(c, r); this.q[c] = r; this.row[r]++; this.d1[r + c]++; this.d2[r - c + N]++; }
  lift(c: number) { const r = this.q[c]; this.row[r]--; this.d1[r + c]--; this.d2[r - c + N]--; this.h -= this.conf(c, r); }
  /** The best neighbours (move one queen within its column): their h and the moves, ties kept. */
  best(): [number, [number, number][]] {
    let b = Infinity, moves: [number, number][] = [];
    for (let c = 0; c < N; c++) {
      const r0 = this.q[c];
      this.lift(c);
      for (let r = 0; r < N; r++) {
        if (r === r0) continue;
        const v = this.h + this.conf(c, r);
        if (v < b) { b = v; moves = [[c, r]]; } else if (v === b) moves.push([c, r]);
      }
      this.put(c, r0);
    }
    return [b, moves];
  }
}
const pairs = (q: Int8Array) => { let k = 0; for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) k += +(q[i] === q[j] || Math.abs(q[i] - q[j]) === j - i); return k; };

interface Stat { runs: number; ok: number; stepsOk: number; stepsBad: number; climbs: number; curve: number[] }
interface Climb { b: Board; steps: number; side: number; climbs: number; total: number; end: '' | 'goal' | 'stuck'; hold: number }

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-ls-cl-css', CSS);
  const c = card(el, 'simulation', 'Hill climbing on 8-queens, thousands of times', '0 0 780 352');
  let speed = 'watch', running = false, raf = 0, acc = 0, said = '';
  let stats: Stat[] = [], cur: Climb[] = [];
  const fresh = (): Climb => ({ b: new Board(), steps: 0, side: 0, climbs: 1, total: 0, end: '', hold: 0 });
  function clear() { stats = VARIANTS.map(() => ({ runs: 0, ok: 0, stepsOk: 0, stepsBad: 0, climbs: 0, curve: [] })); cur = VARIANTS.map(fresh); }

  /** One move of variant i; returns true when a run (a climb, or a whole restart sequence) has ended. */
  function move(i: number): boolean {
    const V = VARIANTS[i], C = cur[i];
    if (C.end) { cur[i] = fresh(); return false; }
    if (C.b.h === 0) return finish(i, true);
    const [b, moves] = C.b.best();
    if (b > C.b.h || (b === C.b.h && C.side >= V.side)) {
      if (!V.restart) return finish(i, false);
      C.b = new Board(); C.climbs++; C.side = 0; // stuck: start again from a new random state, same run
      return false;
    }
    C.side = b === C.b.h ? C.side + 1 : 0;
    const [col, r] = moves[Math.floor(Math.random() * moves.length)];
    C.b.lift(col); C.b.put(col, r);
    C.steps++; C.total++;
    if (C.b.h !== pairs(C.b.q)) console.error('local-climb: incremental h differs from the pair count');
    if (C.b.h === 0) return finish(i, true);
    return false;
  }
  function finish(i: number, ok: boolean) {
    const C = cur[i], S = stats[i];
    C.end = ok ? 'goal' : 'stuck';
    S.runs++; S.ok += +ok;
    if (ok) S.stepsOk += VARIANTS[i].restart ? C.total : C.steps; else S.stepsBad += C.steps;
    S.climbs += C.climbs;
    if (S.runs <= 200 || S.runs % 10 === 0) S.curve.push(S.runs, S.ok / S.runs);
    return true;
  }

  // three boards
  const views = VARIANTS.map((V, i) => {
    const x0 = 14 + i * 158;
    s(c.svg, 'text', { x: x0, y: 22, class: `fg-t lsc-${V.cls}` }, V.name);
    const g = s(c.svg, 'g', { transform: `translate(${x0},${BY})` });
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) s(g, 'rect', { x: k * CELL, y: r * CELL, width: CELL, height: CELL, class: (r + k) % 2 ? 'lsc-d' : 'lsc-l' });
    const frame = s(g, 'rect', { x: -2, y: -2, width: N * CELL + 4, height: N * CELL + 4, rx: 3, class: 'lsc-frame' });
    const qs = Array.from({ length: N }, (_, k) => s(g, 'circle', { cx: k * CELL + CELL / 2, r: 5.5, class: `lsc-q lsc-${V.cls}` }));
    const st = [0, 1, 2, 3].map(j => s(c.svg, 'text', { x: x0, y: BY + N * CELL + 20 + j * 18, class: j ? 'fg-m' : 'lsc-h' }));
    return { frame, qs, st };
  });
  // plot: success rate against the number of runs
  const PX = 512, PY = 34, PW = 214, PH = 140;
  s(c.svg, 'text', { x: PX - 30, y: PY - 14, class: 'fg-t' }, 'share of runs that reach h = 0');
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'lsc-plot' });
  for (const v of [0, 0.5, 1]) {
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: PY + PH - v * PH, y2: PY + PH - v * PH, class: 'lsc-grid' });
    s(c.svg, 'text', { x: PX - 6, y: PY + PH - v * PH + 4, class: 'fg-m', 'text-anchor': 'end' }, `${v * 100}%`);
  }
  const xmaxT = s(c.svg, 'text', { x: PX + PW, y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'end' });
  s(c.svg, 'text', { x: PX, y: PY + PH + 15, class: 'fg-m' }, 'runs: 0');
  const curves = VARIANTS.map(V => s(c.svg, 'polyline', { class: `lsc-curve lsc-${V.cls}` }));
  const ends = VARIANTS.map(V => s(c.svg, 'text', { class: `lsc-end lsc-${V.cls}` }));
  // bars: mean steps of a run
  const BX = 512, BYY = 230, BH = 80, BWID = 228;
  s(c.svg, 'text', { x: BX - 30, y: BYY - 14, class: 'fg-t' }, 'mean steps of a run');
  s(c.svg, 'line', { x1: BX, x2: BX + BWID, y1: BYY + BH, y2: BYY + BH, class: 'lsc-axis' });
  const bars = VARIANTS.map((V, i) => [0, 1].map(j => ({
    r: s(c.svg, 'rect', { x: BX + i * 82 + j * 34, width: 30, class: `lsc-bar lsc-${V.cls}${j ? ' stuck' : ''}` }),
    t: s(c.svg, 'text', { x: BX + i * 82 + j * 34 + 15, class: 'lsc-bt' }),
  })));
  s(c.svg, 'text', { x: BX, y: BYY + BH + 16, class: 'fg-m' }, 'solid: solved runs · faded: stuck runs');

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const rs = document.createElement('button');
  rs.className = 'btn sm';
  rs.textContent = '↺ Reset';
  rs.onclick = () => { pause(); clear(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch every move</option><option value="fast">1 move per frame</option><option value="turbo">as fast as possible</option>';
  sp.onchange = () => { speed = sp.value; render(); opts.onEvent?.(`[${c.title}] speed: ${sp.value}`); };
  ctl.append(run, rs, sp);

  function play() {
    if (running) return;
    if (stats.every(S => S.runs >= CAP)) clear();
    running = true;
    const frame = () => {
      if (speed === 'turbo') {
        const t0 = performance.now();
        while (performance.now() - t0 < 12) VARIANTS.forEach((_, i) => { if (stats[i].runs < CAP) move(i); });
      } else for (acc += SPEEDS[speed]; acc >= 1; acc--) VARIANTS.forEach((_, i) => {
        if (stats[i].runs >= CAP) return;
        if (cur[i].end && speed === 'watch' && cur[i].hold++ < 4) return; // keep the end of a climb on screen a moment
        move(i);
      });
      if (stats.every(S => S.runs >= CAP)) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const xmax = Math.max(100, ...stats.map(S => S.runs)), rate = (S: Stat) => (S.runs ? S.ok / S.runs : 0);
    const mean = stats.map(S => [S.ok ? S.stepsOk / S.ok : 0, S.runs - S.ok ? S.stepsBad / (S.runs - S.ok) : 0]);
    const top = Math.max(10, ...mean.flat());
    VARIANTS.forEach((V, i) => {
      const C = cur[i], S = stats[i], w = views[i];
      C.b.q.forEach((r, k) => w.qs[k].setAttribute('cy', String(r * CELL + CELL / 2)));
      w.frame.setAttribute('class', 'lsc-frame' + (C.end === 'goal' ? ' goal' : C.end === 'stuck' ? ' stuck' : ''));
      w.st[0].textContent = C.end === 'goal' ? (V.restart ? `✓ climb ${C.climbs}, ${C.total} steps` : `✓ h = 0, ${C.steps} steps`) : C.end === 'stuck' ? `✗ stuck, h = ${C.b.h}` :
        V.restart ? `climb ${C.climbs}: h = ${C.b.h}` : `h = ${C.b.h}, step ${C.steps}`;
      w.st[1].textContent = `${S.runs.toLocaleString('en-US')} runs · ${S.runs ? num(100 * rate(S), 3) : '–'}% solved`;
      w.st[2].textContent = V.restart ? `${S.runs ? num(S.climbs / S.runs, 3) : '–'} climbs per solution` : `${S.ok ? num(mean[i][0], 3) : '–'} steps when it succeeds`;
      w.st[3].textContent = V.restart ? `${S.ok ? num(mean[i][0], 3) : '–'} steps per solution in all` : `${S.runs - S.ok ? num(mean[i][1], 3) : '–'} steps when stuck`;
      const pts: string[] = [];
      for (let k = 0; k < S.curve.length; k += 2) pts.push(`${PX + (S.curve[k] / xmax) * PW},${PY + PH - S.curve[k + 1] * PH}`);
      curves[i].setAttribute('points', pts.join(' '));
      ends[i].setAttribute('x', String(PX + PW + 4));
      ends[i].setAttribute('y', String(PY + PH - rate(S) * PH + 4 + (i === 2 ? -6 : i === 1 ? 6 : 0)));
      ends[i].textContent = S.runs ? `${num(100 * rate(S), 2)}%` : '';
      [0, 1].forEach(j => {
        const v = mean[i][j], hgt = (v / top) * BH, b = bars[i][j], show = j === 0 ? S.ok > 0 : !V.restart && S.runs - S.ok > 0;
        b.r.setAttribute('y', String(BYY + BH - (show ? hgt : 0)));
        b.r.setAttribute('height', String(show ? hgt : 0));
        b.t.setAttribute('y', String(BYY + BH - (show ? hgt : 0) - 4));
        b.t.textContent = show ? num(v, 2) : '';
      });
    });
    xmaxT.textContent = xmax.toLocaleString('en-US');
    run.textContent = running ? '⏸ Pause' : stats.every(S => S.runs >= CAP) ? '⏵ Run again' : stats[0].runs ? '⏵ Continue' : '⏵ Run';
    explain();
  }

  function explain() {
    const n = Math.min(...stats.map(S => S.runs)), p = stats.map(S => (S.runs ? (100 * S.ok) / S.runs : 0));
    const m = stats.map(S => [S.ok ? S.stepsOk / S.ok : 0, S.runs - S.ok ? S.stepsBad / (S.runs - S.ok) : 0]);
    const [key, text] = !n && !running
      ? ['idle', 'Three hill climbers on 8-queens, each starting from a random state (one queen per column). A step moves the queen that most reduces $h$, the number of ' +
        'attacking pairs, ties broken at random. A green frame is a solution ($h = 0$), a red frame a climb that got stuck. Press **Run**.']
      : n < 20
      ? ['watch', '**Most plain climbs end red after 3 or 4 moves**: no single queen move lowers $h$ any more, a local minimum (or a plateau). ' +
        'With sideways moves the climber may keep walking on equal $h$, up to 100 moves in a row; with random restarts a stuck climb simply starts over from a new random state. ' +
        'Switch to **as fast as possible** to see the rates settle.']
      : n < 2000
      ? ['settle', 'The success rates settle as the runs pile up (left of the plot is noisy: few runs). Keep going to a few thousand runs.']
      : [`done${Math.floor(n / 10000)}`, `**After ${n.toLocaleString('en-US')}+ runs each:** steepest descent solves **${num(p[0], 3)}%** of the random states, in ${num(m[0][0], 2)} steps when it succeeds ` +
        `and ${num(m[0][1], 2)} when it gets stuck. Up to 100 sideways moves raise it to **${num(p[1], 3)}%**, at the price of longer runs (${num(m[1][0], 3)} steps when it succeeds, ` +
        `${num(m[1][1], 3)} when it fails). Random restarts always succeed: ${num(stats[2].climbs / stats[2].runs, 3)} climbs and ${num(m[2][0], 3)} steps per solution, close to $1/p$ = ${num(100 / p[0], 2)} climbs. ` +
        'AIMA (Section 4.1.1) reports 14% (about 4 steps) and 94% with 100 sideways moves.'];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  clear();
  render();
  return { destroy: pause };
}

const CSS = `
.lsc-l{fill:var(--panel-2)}
.lsc-d{fill:var(--panel-3)}
.lsc-frame{fill:none;stroke:var(--border);stroke-width:2;transition:stroke .2s}
.lsc-frame.goal{stroke:var(--ok);stroke-width:4}
.lsc-frame.stuck{stroke:var(--bad);stroke-width:4}
.lsc-q{stroke:var(--panel);stroke-width:1.5}
.lsc-h{font:600 11.5px var(--mono);fill:var(--text)}
.lsc-plot{fill:var(--panel-2);stroke:var(--border)}
.lsc-grid{stroke:var(--border);stroke-dasharray:2 4}
.lsc-axis{stroke:var(--border-strong)}
.lsc-curve{fill:none;stroke-width:2.2;stroke-linejoin:round}
.lsc-end{font:600 11px var(--mono)}
.lsc-bt{font:600 11px var(--mono);fill:var(--text-2);text-anchor:middle}
.lsc-bar.stuck{opacity:.4}
text.lsc-v0,.lsc-q.lsc-v0,.lsc-bar.lsc-v0{fill:var(--warn)}
text.lsc-v1,.lsc-q.lsc-v1,.lsc-bar.lsc-v1{fill:var(--accent)}
text.lsc-v2,.lsc-q.lsc-v2,.lsc-bar.lsc-v2{fill:var(--info)}
.lsc-curve.lsc-v0{stroke:var(--warn)}
.lsc-curve.lsc-v1{stroke:var(--accent)}
.lsc-curve.lsc-v2{stroke:var(--info)}
`;
