// Four ways to build a player (slides p. 455–472) as a tic-tac-toe tournament: random, hand-written rules (#1), minimax (#2),
// MCTS with n playouts (#3). The players swap sides every game; the tallies are counted live. Simulation.
import { EMPTY, LINES, empties, minimax, miniBoard, over, put, toMove, winner, type Board } from './adv-ttt-tree';
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

type Kind = 'random' | 'rules' | 'minimax' | 'mcts';
const KINDS: Record<Kind, string> = { random: 'random', rules: '#1 rules', minimax: '#2 minimax', mcts: '#3 MCTS' };
const GAMES = 100;
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** #1 (slide p. 459): win if you can, else block, else the center, else a corner on a line with one of your pieces, else any corner, else a side. */
function rules(b: Board): number {
  const p = toMove(b), o = p === 'X' ? 'O' : 'X', free = empties(b);
  const win = free.filter(i => winner(put(b, i, p)) === p), block = free.filter(i => winner(put(b, i, o)) === o);
  const corners = [0, 2, 6, 8].filter(i => b[i] === '.'), near = corners.filter(i => LINES.some(l => l.includes(i) && l.some(j => b[j] === p)));
  return win.length ? pick(win) : block.length ? pick(block) : b[4] === '.' ? 4 : near.length ? pick(near) : corners.length ? pick(corners) : pick(free);
}

/** #2: the first move with the best minimax value (deterministic). */
function perfect(b: Board): number {
  const p = toMove(b), sign = p === 'X' ? 1 : -1;
  return empties(b).reduce((a, i) => (sign * minimax(put(b, i, p)) > sign * minimax(put(b, a, p)) ? i : a));
}

interface Nd { b: Board; move: number; kids: Nd[]; untried: number[]; U: number; N: number; parent: Nd | null }
/** #3: MCTS (AIMA Figure 6.11) with n iterations, UCB1 C = √2, wins of the player who moved into the node; returns the root's
 *  children as [move, visits]. */
export function mctsVisits(b: Board, n: number, rnd: () => number = Math.random): [number, number][] {
  const any = <T>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const root: Nd = { b, move: -1, kids: [], untried: empties(b), U: 0, N: 0, parent: null };
  for (let it = 0; it < n; it++) {
    let nd = root;
    while (!nd.untried.length && nd.kids.length) {
      const lnN = Math.log(nd.N);
      nd = nd.kids.reduce((a, k) => (k.U / k.N + Math.SQRT2 * Math.sqrt(lnN / k.N) > a.U / a.N + Math.SQRT2 * Math.sqrt(lnN / a.N) ? k : a));
    }
    if (nd.untried.length) {
      const m = nd.untried.splice(Math.floor(rnd() * nd.untried.length), 1)[0], nb = put(nd.b, m, toMove(nd.b));
      const kid: Nd = { b: nb, move: m, kids: [], untried: over(nb) ? [] : empties(nb), U: 0, N: 0, parent: nd };
      nd.kids.push(kid);
      nd = kid;
    }
    let x = nd.b;
    while (!over(x)) x = put(x, any(empties(x)), toMove(x));
    const w = winner(x);
    for (let q: Nd | null = nd; q; q = q.parent) { q.N++; if (q.parent) q.U += w === toMove(q.parent.b) ? 1 : w ? 0 : 0.5; }
  }
  return root.kids.map(k => [k.move, k.N]);
}
/** The move with the most playouts. */
export const mctsMove = (b: Board, n: number) => mctsVisits(b, n).reduce((a, k) => (k[1] > a[1] ? k : a))[0];

const PRESETS: { a: Kind; b: Kind; n: number; why: string }[] = [
  { a: 'minimax', b: 'random', n: 0, why: 'quiz p. 455' },
  { a: 'minimax', b: 'minimax', n: 0, why: 'quiz p. 455' },
  { a: 'minimax', b: 'mcts', n: 1, why: 'exam 8 Jul 2025' },
  { a: 'minimax', b: 'mcts', n: 1000, why: 'quiz p. 455' },
  { a: 'rules', b: 'random', n: 0, why: '' },
  { a: 'rules', b: 'mcts', n: 200, why: '' },
];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-mcp-css', CSS);
  const c = card(el, 'simulation', 'Four ways to build a player, as a tic-tac-toe tournament', '0 0 780 250');
  let A: Kind = 'minimax', B: Kind = 'random', n = 200, games = 0, res = [0, 0, 0], seen = new Set<string>(), running = false, raf = 0, said = '';
  let board: Board = EMPTY, xIsA = true, order: number[] = [];

  const big = miniBoard(c.svg, 30, 44, 150);
  const nums = Array.from({ length: 9 }, (_, i) => s(c.svg, 'text', { x: 30 + (i % 3) * 50 + 46, y: 44 + Math.floor(i / 3) * 50 + 13, class: 'mcp-ord' }));
  const who = s(c.svg, 'text', { x: 105, y: 24, class: 'fg-t', 'text-anchor': 'middle' });
  const out = s(c.svg, 'text', { x: 105, y: 216, class: 'fg-t', 'text-anchor': 'middle' });
  const BX = 240, BW = 500;
  const head = s(c.svg, 'text', { x: BX, y: 50, class: 'fg-h2' });
  s(c.svg, 'rect', { x: BX, y: 70, width: BW, height: 40, rx: 6, class: 'mcp-track' });
  const segs = [0, 1, 2].map(k => s(c.svg, 'rect', { y: 70, height: 40, class: `mcp-seg k${k}` }));
  const segT = [0, 1, 2].map(k => s(c.svg, 'text', { y: 95, class: 'mcp-st', 'text-anchor': 'middle' }));
  const keys = ['A wins', 'draws', 'B wins'].map((t, k) => s(c.svg, 'text', { x: BX + k * 170, y: 136, class: `mcp-k k${k}` }));
  const stat = [0, 1].map(k => s(c.svg, 'text', { x: BX, y: 170 + k * 20, class: 'fg-m' }));

  const ctl = bar(c), pre = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const sel = (v: Kind) => {
    const e = document.createElement('select');
    e.innerHTML = (Object.keys(KINDS) as Kind[]).map(k => `<option value="${k}">${KINDS[k]}</option>`).join('');
    e.value = v;
    e.onchange = () => { pause(); A = sa.value as Kind; B = sb.value as Kind; clear(); render(); };
    return e;
  };
  const sa = sel(A), sb = sel(B), vs = document.createElement('span');
  vs.textContent = 'vs';
  vs.className = 'fg-sl';
  ctl.append(run, sa, vs, sb);
  const nIn = slider(ctl, 'MCTS playouts per move', 1, 1000, 1, n, v => { n = v; pause(); clear(); render(); });
  nIn.addEventListener('change', () => opts.onEvent?.(`[${c.title}] MCTS playouts per move = ${n}`));
  for (const p of PRESETS) {
    const btn = document.createElement('button');
    btn.className = 'btn sm';
    btn.textContent = `${KINDS[p.a]} vs ${KINDS[p.b]}${p.n ? ` (${p.n})` : ''}${p.why ? ` · ${p.why}` : ''}`;
    btn.onclick = () => {
      pause();
      A = p.a; B = p.b; sa.value = A; sb.value = B;
      if (p.n) { n = p.n; nIn.value = String(n); nIn.dispatchEvent(new Event('input')); }
      clear();
      play();
    };
    pre.append(btn);
  }

  const name = (k: Kind) => (k === 'mcts' ? `#3 MCTS (${n})` : KINDS[k]);
  const move = (k: Kind, b: Board) => (k === 'random' ? pick(empties(b)) : k === 'rules' ? rules(b) : k === 'minimax' ? perfect(b) : mctsMove(b, n));
  function clear() { games = 0; res = [0, 0, 0]; seen = new Set(); board = EMPTY; order = []; said = ''; xIsA = true; }
  /** One whole game; A plays X in even games, O in odd ones. */
  function game() {
    xIsA = games % 2 === 0;
    let b = EMPTY;
    const seq: number[] = [];
    while (!over(b)) { const k = (toMove(b) === 'X') === xIsA ? A : B, i = move(k, b); b = put(b, i, toMove(b)); seq.push(i); }
    const w = winner(b), aWon = w !== null && (w === 'X') === xIsA;
    res[w === null ? 1 : aWon ? 0 : 2]++;
    seen.add(seq.join(''));
    board = b;
    order = seq;
    games++;
  }
  function play() {
    if (games >= GAMES) clear();
    running = true;
    opts.onEvent?.(`[${c.title}] ${name(A)} vs ${name(B)}, ${GAMES} games`);
    let last = 0;
    const frame = (ts: number) => {
      const slow = A === 'mcts' || B === 'mcts' ? n > 300 : false;
      if (ts - last > (slow ? 0 : 40)) { last = ts; game(); } // about 25 games per second, or as fast as MCTS allows
      if (games >= GAMES) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    big.set(board);
    nums.forEach((t, i) => { const o = order.indexOf(i); t.textContent = o >= 0 ? String(o + 1) : ''; });
    who.textContent = games ? `last game: X = ${xIsA ? 'A' : 'B'}, O = ${xIsA ? 'B' : 'A'}` : 'A = player 1, B = player 2';
    const w = winner(board);
    out.textContent = games ? (w ? `${w} wins (${(w === 'X') === xIsA ? 'A' : 'B'})` : 'draw') : '';
    head.textContent = `A = ${name(A)}  vs  B = ${name(B)}`;
    let x = BX;
    res.forEach((r, k) => {
      const wd = games ? (r / games) * BW : 0;
      segs[k].setAttribute('x', String(x));
      segs[k].setAttribute('width', String(wd));
      segT[k].setAttribute('x', String(x + wd / 2));
      segT[k].textContent = wd > 28 ? String(r) : '';
      x += wd;
      keys[k].textContent = `${['A wins', 'draws', 'B wins'][k]}: ${r}${games ? ` (${num((100 * r) / games, 3)}%)` : ''}`;
    });
    stat[0].textContent = `${games} of ${GAMES} games · the players swap sides every game (X moves first)`;
    stat[1].textContent = games ? `${seen.size} different game${seen.size > 1 ? 's' : ''} (move sequences) among them` : '';
    run.textContent = running ? '⏸ Pause' : games >= GAMES ? '⏵ Play again' : games ? '⏵ Continue' : `⏵ Play ${GAMES} games`;
    explain();
  }

  function explain() {
    const done = games >= GAMES, [a, d, b] = res;
    const notes: string[] = [];
    if (A === 'minimax' || B === 'minimax') {
      const mmLost = A === 'minimax' ? b : a;
      if (mmLost) console.error(`mcts-players: minimax lost ${mmLost} games`);
      else notes.push('**Minimax never lost**: it plays perfectly, so the best an opponent can get is a draw.');
    }
    if (A === B && A === 'minimax') notes.push(seen.size === 1 ? '**Every game is the same game**: both players are deterministic and pick the same moves, a draw every time.' : '');
    if ((A === 'mcts' || B === 'mcts') && n === 1) notes.push('**MCTS with one playout** expands one random child and returns it: it is a **random player**.');
    const lost = (k: Kind) => (A === k && B !== k ? b : B === k && A !== k ? a : 0);
    if ((A === 'mcts') !== (B === 'mcts') && n >= 500) notes.push(`With ${n} playouts per move MCTS ${d === games ? 'drew every game' : `drew ${d} of ${games}`}` +
      `${lost('mcts') ? ` and lost ${lost('mcts')}: random playouts can still misjudge a line` : ''}. Enough simulations make random playouts a strong evaluation.`);
    if ((A === 'rules') !== (B === 'rules')) notes.push(`**#1 rules** needs knowledge of the game (win, block, center, corners) and has no lookahead, so it cannot see a fork coming; ${lost('rules') ? `it lost ${lost('rules')} game${lost('rules') > 1 ? 's' : ''}` : 'it never lost here'}.`);
    const [key, text] = !games
      ? ['idle', 'Pick two players, or a preset from the slides\' quiz (p. 455) and the exams, then press **Play**: 100 games, sides swapped every game. ' +
        '**#1 rules**: hand-written knowledge. **#2 minimax**: lookahead on the whole tree. **#3 MCTS**: random playouts, $n$ per move. (#4, learning the evaluation, is AlphaZero below.)']
      : !done
      ? [`run${A}${B}${n}`, `**${name(A)} vs ${name(B)}** is being played. The bar counts A's wins, the draws and B's wins so far.`]
      : [`done${A}${B}${n}${a}${d}`, `**After ${GAMES} games:** A won ${a}, ${d} draws, B won ${b}. ` + notes.filter(Boolean).join(' ')];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key.startsWith('done')) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  render();
  return { destroy: pause };
}

const CSS = `
.mcp-ord{font:600 11px var(--mono);fill:var(--muted);text-anchor:end}
.mcp-track{fill:var(--panel-2);stroke:var(--border)}
.mcp-seg{transition:x .2s,width .2s}
.mcp-seg.k0,.mcp-k.k0{fill:var(--ok)}
.mcp-seg.k1,.mcp-k.k1{fill:var(--muted)}
.mcp-seg.k2,.mcp-k.k2{fill:var(--bad)}
.mcp-st{font:700 13px var(--mono);fill:var(--panel)}
.mcp-k{font-size:13px;font-weight:600}
`;
