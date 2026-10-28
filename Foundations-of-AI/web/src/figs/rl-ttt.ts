// Tic-tac-toe: tabular Q-learning trained live against the four opponents of RL p. 62–73, binned per 100 games like the slides' plots.
// Defaults follow the plotted runs (source cited on RL p. 64: learner = Player 2 (O), β = 0.9, γ = 0.95, greedy, optimistic q0);
// the update is the course's Q-learning rule (RL p. 36), applied at the learner's next turn s_{t+2} (RL p. 60), rewards +1/−1/0 (RL p. 57).
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const P3 = [1, 3, 9, 27, 81, 243, 729, 2187, 6561], BIN = 100, REACHABLE = 5478;
export type Opp = 'minimax' | 'rndminimax' | 'qlearner' | 'random';
export interface Params { beta: number; gamma: number; eps: number; q0: number }
const OPP: Record<Opp, { name: string; horizon: number; page: string; ref: number; slides: string }> = {
  minimax: { name: 'Minimax', horizon: 1000, page: 'RL p. 64', ref: 100, slides: 'Minimax wins about 95% of the first 100 games, then every game is a draw' },
  rndminimax: { name: 'Random Minimax', horizon: 10000, page: 'RL p. 67', ref: 5000, slides: 'draws rise slowly and reach 100% at about game 5000' },
  qlearner: { name: 'another Q-learner', horizon: 10000, page: 'RL p. 70', ref: 6500, slides: 'noisy until about game 6000, all draws from about game 6500' },
  random: { name: 'a Random player', horizon: 50000, page: 'RL p. 73', ref: 90, slides: 'the Q-learner wins about 90%, draws about 10%' },
};

/** 1 or 2 if that side has three in a row, 3 for a full board, 0 while the game goes on. */
export function outcome(b: number[]): number {
  for (const [i, j, k] of LINES) if (b[i] && b[i] === b[j] && b[i] === b[k]) return b[i];
  return b.includes(0) ? 0 : 3;
}

// Minimax values from X's point of view (+1, 0, −1), memoized lazily: the whole tree visits each reachable position once.
const memo = new Map<number, number>();
function mmValue(b: number[], key: number, tm: number): number {
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  const w = outcome(b);
  let v = w === 1 ? 1 : w === 2 ? -1 : 0;
  if (!w) {
    v = tm === 1 ? -2 : 2;
    for (let i = 0; i < 9; i++) if (!b[i]) {
      b[i] = tm;
      const c = mmValue(b, key + P3[i] * tm, 3 - tm);
      b[i] = 0;
      v = tm === 1 ? Math.max(v, c) : Math.min(v, c);
    }
  }
  memo.set(key, v);
  return v;
}
/** Minimax takes the first best move; Random Minimax picks at random among the equally good ones (RL p. 65). */
function mmMove(b: number[], key: number, tm: number, random: boolean, rnd: () => number): number {
  let best = -Infinity, bs: number[] = [];
  for (let i = 0; i < 9; i++) if (!b[i]) {
    b[i] = tm;
    const v = (tm === 1 ? 1 : -1) * mmValue(b, key + P3[i] * tm, 3 - tm);
    b[i] = 0;
    if (v > best) { best = v; bs = [i]; } else if (v === best) bs.push(i);
  }
  return random ? bs[Math.floor(rnd() * bs.length)] : bs[0];
}
/** Checks the memo against the known count of reachable positions and the value of the empty board (a draw);
 * returns the number of non-terminal boards with X and with O to move. */
function checkMinimax(): [number, number, number] {
  const v = mmValue(Array<number>(9).fill(0), 0, 1);
  if (memo.size !== REACHABLE || v !== 0) console.error(`rl-ttt: minimax memo ${memo.size} positions (expected ${REACHABLE}), root value ${v} (expected 0)`);
  const turn: [number, number, number] = [0, 0, 0];
  for (const k of memo.keys()) {
    const b = P3.map(p => Math.floor(k / p) % 3), x = b.filter(c => c === 1).length, o = b.filter(c => c === 2).length;
    if (!outcome(b)) turn[x > o ? 2 : 1]++;
  }
  return turn;
}

interface Learner { Q: Float64Array; seen: Uint8Array; n: number; s: number; a: number }
const learner = (): Learner => ({ Q: new Float64Array(19683 * 9), seen: new Uint8Array(19683), n: 0, s: -1, a: -1 });

/** Training loop, one ply at a time. `side` is the learner's mark (1 = X moves first, 2 = O). */
export function trainer(opp: Opp, side: number, p: Params, rnd: () => number = Math.random) {
  const me = learner(), other = learner(), b = Array<number>(9).fill(0);
  const t = { b, games: 0, bins: [] as number[][], cur: [0, 0, 0], over: 0, row: [] as number[], lastMove: -1, me, ply };
  let key = 0, tm = 1;
  const touch = (L: Learner) => { if (!L.seen[key]) { L.seen[key] = 1; L.n++; L.Q.fill(p.q0, key * 9, key * 9 + 9); } };
  function qMove(L: Learner): number {
    touch(L);
    const legal = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !b[i]), q = (i: number) => L.Q[key * 9 + i];
    const top = Math.max(...legal.map(q));
    if (L.s >= 0) L.Q[L.s * 9 + L.a] += p.beta * (p.gamma * top - L.Q[L.s * 9 + L.a]); // r = 0 until the game ends
    if (L === me) t.row = b.map((c, i) => (c ? NaN : q(i)));
    const pool = rnd() < p.eps ? legal : legal.filter(i => q(i) === top); // ε: random move; else greedy, ties at random
    L.s = key;
    L.a = pool[Math.floor(rnd() * pool.length)];
    return L.a;
  }
  function end(L: Learner, r: number) { L.Q[L.s * 9 + L.a] += p.beta * (r - L.Q[L.s * 9 + L.a]); L.s = -1; } // no discounted term at the end
  function ply(): number {
    if (t.over) { b.fill(0); key = 0; tm = 1; t.over = 0; t.row = []; t.lastMove = -1; }
    const free = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(k => !b[k]);
    const i = tm === side ? qMove(me) : opp === 'qlearner' ? qMove(other) : opp === 'random'
      ? free[Math.floor(rnd() * free.length)] : mmMove(b, key, tm, opp === 'rndminimax', rnd);
    b[i] = tm;
    key += P3[i] * tm;
    t.lastMove = i;
    const w = outcome(b);
    if (!w) { tm = 3 - tm; return 0; }
    const r = w === 3 ? 0 : w === side ? 1 : -1;
    end(me, r);
    if (opp === 'qlearner') end(other, -r);
    t.cur[w === 3 ? 0 : w === side ? 1 : 2]++;
    if (++t.games % BIN === 0) { t.bins.push(t.cur); t.cur = [0, 0, 0]; }
    t.over = w;
    return w;
  }
  return t;
}

/** First game from which every 100-game bin is at least 98% draws (needs 3 such bins), or −1. */
export function drawsFrom(bins: number[][]): number {
  let i = bins.length;
  while (i > 0 && bins[i - 1][0] >= 98) i--;
  return bins.length - i >= 3 ? i * BIN : -1;
}

const C = 64, BX = 22, BY = 52, PX = 300, PY = 30, PW = 450, PH = 190;
const COLORS = ['var(--accent)', 'var(--ok)', 'var(--bad)'];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rlt-css', CSS);
  const c = card(el, 'simulation', 'Tic-tac-toe: Q-learning trained against four opponents', '0 0 780 370');
  const p: Params = { beta: 0.9, gamma: 0.95, eps: 0, q0: 0.2 };
  let opp: Opp = 'minimax', side = 2, speed = 'fast', running = false, raf = 0, last = 0, said = '', boards: number[] = [];
  let t = trainer(opp, side, p);

  // board: the current (or last) game; at the learner's turn its Q row is written in the empty cells
  const cells: SVGTextElement[] = [], qs: SVGTextElement[] = [], bg: SVGRectElement[] = [];
  for (let i = 0; i < 9; i++) {
    const x = BX + (i % 3) * C, y = BY + Math.floor(i / 3) * C;
    bg.push(s(c.svg, 'rect', { x, y, width: C, height: C, class: 'rlt-cell' }));
    qs.push(s(c.svg, 'text', { x: x + C / 2, y: y + C / 2 + 4, class: 'rlt-q' }));
    cells.push(s(c.svg, 'text', { x: x + C / 2, y: y + C / 2 + 12, class: 'rlt-mark' }));
  }
  const who = s(c.svg, 'text', { x: BX, y: BY - 12, class: 'fg-t' });
  const res = s(c.svg, 'text', { x: BX + 1.5 * C, y: BY + 3 * C + 24, class: 'rlt-res' });

  // plot: outcome per bin of 100 games, from the learner's point of view
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'rlt-plot' });
  const py = (v: number) => PY + PH - (v / 100) * PH;
  for (const v of [0, 50, 100]) {
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: py(v), y2: py(v), class: 'rlt-grid' });
    s(c.svg, 'text', { x: PX - 6, y: py(v) + 4, class: 'fg-m', 'text-anchor': 'end' }, `${v}%`);
  }
  const xt = [0, 1, 2, 3, 4].map(k => s(c.svg, 'text', { x: PX + (k * PW) / 4, y: PY + PH + 16, class: 'fg-m', 'text-anchor': 'middle' }));
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 32, class: 'fg-m', 'text-anchor': 'end' }, 'games (each step = 100 games)');
  const ref = s(c.svg, 'line', { class: 'rlt-ref' }), refT = s(c.svg, 'text', { y: PY - 8, class: 'rlt-reft' });
  const lines = COLORS.map(col => s(c.svg, 'polyline', { class: 'rlt-line', stroke: col }));
  const keys = ['draws', 'Q-learner wins', 'Q-learner loses'].map((name, k) => {
    s(c.svg, 'rect', { x: PX + k * 140, y: PY + PH + 44, width: 14, height: 4, fill: COLORS[k] });
    return s(c.svg, 'text', { x: PX + k * 140 + 20, y: PY + PH + 50, class: 'fg-m' }, name);
  });
  const stat = [0, 1, 2].map(k => s(c.svg, 'text', { x: PX, y: PY + PH + 76 + k * 20, class: 'fg-t' }));

  const ctl = bar(c), knobs = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset Q';
  reset.onclick = () => restart('reset');
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch every move</option><option value="fast">20 games per frame</option><option value="turbo">500 games per frame</option>';
  sp.value = speed;
  sp.onchange = () => { speed = sp.value; render(); };
  const op = document.createElement('select');
  op.innerHTML = (Object.keys(OPP) as Opp[]).map(k => `<option value="${k}">vs ${OPP[k].name} (${OPP[k].page})</option>`).join('');
  op.onchange = () => { opp = op.value as Opp; restart(`opponent: ${OPP[opp].name}`); };
  const sd = document.createElement('select');
  sd.innerHTML = '<option value="2">learner plays O, second (the slides\' runs)</option><option value="1">learner plays X, first (RL p. 57)</option>';
  sd.onchange = () => { side = +sd.value; restart(`learner plays ${side === 1 ? 'X' : 'O'}`); };
  ctl.append(run, reset, sp, op, sd);
  const knob = (name: string, k: keyof Params, min: number, max: number, step: number, again: boolean) => {
    const inp = slider(knobs, name, min, max, step, p[k], v => { p[k] = v; });
    inp.addEventListener('change', () => (again ? restart(`${name} = ${p[k]}`) : opts.onEvent?.(`[${c.title}] ${name} = ${p[k]}`)));
  };
  knob('β', 'beta', 0.05, 1, 0.05, false);
  knob('γ', 'gamma', 0.5, 0.99, 0.01, false);
  knob('ε', 'eps', 0, 0.3, 0.05, false);
  knob('q₀', 'q0', -1, 1, 0.1, true);

  function restart(why: string) {
    pause();
    t = trainer(opp, side, p);
    render();
    opts.onEvent?.(`[${c.title}] ${why}: Q-table cleared`);
  }
  function play() {
    if (running || t.games >= OPP[opp].horizon) return;
    if (!boards.length) boards = checkMinimax();
    running = true;
    const frame = (now: number) => {
      const H = OPP[opp].horizon;
      if (speed === 'watch') {
        if (now - last > (t.over ? 900 : 450)) { last = now; t.ply(); }
      } else for (let g = speed === 'fast' ? 20 : 500, n = t.games; g > 0 && t.games < H; g--, n = t.games) while (t.games === n) t.ply();
      if (t.games >= H) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const me = side === 1 ? 'X' : 'O', H = OPP[opp].horizon, showQ = speed === 'watch' || !running;
    t.b.forEach((v, i) => {
      cells[i].textContent = v ? (v === 1 ? 'X' : 'O') : '';
      cells[i].setAttribute('class', `rlt-mark ${v === side ? 'me' : ''}`);
      bg[i].classList.toggle('last', i === t.lastMove);
      const q = t.row[i];
      qs[i].textContent = showQ && !v && q !== undefined && !Number.isNaN(q) ? num(q, 2) : '';
    });
    who.textContent = `Q-learner (${me}) vs ${OPP[opp].name.replace(/^a /, '')} (${side === 1 ? 'O' : 'X'})`;
    res.textContent = t.over ? (t.over === 3 ? 'draw' : t.over === side ? 'Q-learner wins' : 'Q-learner loses') : t.games || t.b.some(Boolean) ? `game ${t.games + 1}` : '';
    const xs = (g: number) => PX + (g / H) * PW;
    lines.forEach((ln, k) => {
      let pts = '';
      t.bins.forEach((bn, i) => { pts += `${xs(i * BIN)},${py(bn[k])} ${xs((i + 1) * BIN)},${py(bn[k])} `; });
      ln.setAttribute('points', pts);
    });
    xt.forEach((tx, k) => { tx.textContent = String((k * H) / 4); });
    const r = OPP[opp];
    if (opp === 'random') {
      for (const [a, v] of [['x1', PX], ['x2', PX + PW], ['y1', py(r.ref)], ['y2', py(r.ref)]] as const) ref.setAttribute(a, String(v));
      refT.setAttribute('x', String(PX + PW));
      refT.setAttribute('text-anchor', 'end');
      refT.textContent = `slides: ≈ ${r.ref}% wins`;
    } else {
      for (const [a, v] of [['x1', xs(r.ref)], ['x2', xs(r.ref)], ['y1', PY], ['y2', PY + PH]] as const) ref.setAttribute(a, String(v));
      refT.setAttribute('x', String(xs(r.ref)));
      refT.setAttribute('text-anchor', r.ref / H > 0.5 ? 'end' : 'start');
      refT.textContent = `slides: all draws from ≈ ${r.ref}`;
    }
    const lb = t.bins[t.bins.length - 1];
    keys.forEach((k, i) => { k.textContent = `${['draws', 'Q-learner wins', 'Q-learner loses'][i]}${lb ? ` ${lb[i]}%` : ''}`; });
    stat[0].textContent = `game ${Math.min(t.games, H)} of ${H}` + (lb ? ' (legend: the last 100)' : '');
    stat[1].textContent = `Q-table: ${t.me.n} rows (boards)` + (boards.length ? ` of the ${boards[side]} with ${me} to move` : '');
    stat[2].textContent = boards.length ? `Minimax values memoized: ${memo.size} positions` : '';
    run.textContent = running ? '⏸ Pause' : t.games >= H ? 'done' : t.games || t.b.some(Boolean) ? '⏵ Continue' : '⏵ Train';
    run.disabled = t.games >= H;
    explain();
  }

  // the caption follows the stage of training; numbers are read from this run when the stage changes
  function explain() {
    const r = OPP[opp], from = drawsFrom(t.bins), n = t.games, H = r.horizon, me = side === 1 ? 'X' : 'O';
    const tail = t.bins.slice(-10), avg = (k: number) => num(tail.reduce((x, b) => x + b[k], 0) / Math.max(1, tail.length), 3);
    const epsNote = p.eps > 0 ? ` With $\\varepsilon = ${p.eps}$ some moves are random even after learning, so the curves cannot settle at 100%.` : '';
    const [key, text] = !n && !t.b.some(Boolean)
      ? ['idle', `**Every $Q$ starts at $q_0 = ${p.q0}$.** The learner (${me}) gets $+1$ for a win, $-1$ for a loss and $0$ for a draw, only at the end (RL p. 57). ` +
        `Its next state is the board at its **next turn**: the opponent's reply is part of the environment (RL p. 60). Press **Train** and compare with the slides (${r.page}): ${r.slides}.`]
      : n < BIN
      ? ['early', `**The first 100 games.** With $q_0 = ${p.q0}$ above the value of a draw (0), every move not yet tried looks better than one that led to a draw, ` +
        'so the greedy learner keeps trying moves it has not tried yet: for now it plays almost at random. In **watch** mode the empty cells show the $Q$ row of its last board.']
      : n >= H
      ? [`done${opp}${side}${from}`, `**${H} games.** ` + (from >= 0
        ? `From game **${from}** on, at least 98 of every 100 games are draws; the slides: ${r.slides} (${r.page}). `
        : `Last 1000 games: the learner wins **${avg(1)}%**, draws **${avg(0)}%**, loses **${avg(2)}%**; the slides: ${r.slides} (${r.page}). `) +
        `It filled **${t.me.n}** board rows of its Q-table (of the ${boards[side]} boards where ${me} can move).` +
        (side === 1 ? ' Here the learner plays X; in the slides\' runs it plays O, second.' : '') +
        (from >= 0 ? ' The program behind the slides\' plots applies the same update backwards over each finished game, so there the reward reaches the early moves sooner.' : '') +
        (opp === 'minimax' ? ' A deterministic opponent always leads to the same few boards: the learner only learns a reply to **one** fixed strategy.' : '') + epsNote]
      : from >= 0
      ? [`conv${from}`, `**At least 98% draws in every 100 games since game ${from}** (slides: all draws from ≈ ${r.ref}, ${r.page}). The learner (almost) no longer loses, and the opponent never lets it win.` +
        (opp === 'minimax' ? ` Only **${t.me.n}** boards ever occurred: Minimax answers each board with the same move.` : '')]
      : [`learn${opp}`, ({
        minimax: '**Minimax is deterministic**: the same board always gets the same reply, so the learner sees the same few boards again and again and its values settle fast.',
        rndminimax: '**Random Minimax** plays as well as Minimax but picks at random among equally good moves: the same board and move can lead to different next boards. The learner sees far more boards, and draws rise slowly.',
        qlearner: '**Both players are learning.** Each one is part of the other\'s environment, and that environment keeps changing while the opponent learns: the curves stay noisy for thousands of games.',
        random: '**A random opponent** never plays a strong move, so the learner can exploit its mistakes: wins rise towards the slides\' 90%. It cannot reach 100%: some random games still end in a draw.',
      } as Record<Opp, string>)[opp] + epsNote];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  render();
  return { destroy: pause };
}

const CSS = `
.rlt-cell{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:1.5;transition:fill .2s}
.rlt-cell.last{fill:var(--accent-soft)}
.rlt-mark{font:700 34px var(--font);fill:var(--muted);text-anchor:middle;pointer-events:none}
.rlt-mark.me{fill:var(--accent)}
.rlt-q{font:600 11px var(--mono);fill:var(--warn);text-anchor:middle;pointer-events:none}
.rlt-res{font-size:13px;font-weight:600;fill:var(--text);text-anchor:middle}
.rlt-plot{fill:var(--panel-2);stroke:var(--border)}
.rlt-grid{stroke:var(--border);stroke-dasharray:2 4}
.rlt-line{fill:none;stroke-width:2;stroke-linejoin:round}
.rlt-ref{stroke:var(--warn);stroke-width:1.5;stroke-dasharray:6 4}
.rlt-reft{font:600 11px var(--mono);fill:var(--warn)}
`;
