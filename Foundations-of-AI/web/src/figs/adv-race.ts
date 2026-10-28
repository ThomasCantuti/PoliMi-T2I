// The comparison table as a race (slides p. 354–400): four searches choose X's first move in tic-tac-toe, all advancing the same number
// of nodes per frame; every count, value and move is produced by the searches themselves. Simulation.
import { EMPTY, cell, empties, fmt, levels, LINES, minimax as solve, put, toMove, winner, type Board } from './adv-ttt-tree';
import { bar, card, md, num, s, style, type FigOptions } from './shell';

const e = (b: Board) => LINES.filter(l => l.every(i => b[i] !== 'O')).length - LINES.filter(l => l.every(i => b[i] !== 'X')).length;
const term = (b: Board) => { const w = winner(b); return w ? (w === 'X' ? 1 : -1) : b.includes('.') ? null : 0; };
type Gen = Generator<void, number, void>;

// each search yields once per node it generates; the root loop records the value and the move (first strict improvement)
function* minimax(b: Board): Gen {
  yield;
  const u = term(b);
  if (u !== null) return u;
  const p = toMove(b);
  let v = p === 'X' ? -Infinity : Infinity;
  for (const i of empties(b)) { const x = yield* minimax(put(b, i, p)); v = p === 'X' ? Math.max(v, x) : Math.min(v, x); }
  return v;
}
function* alphabeta(b: Board, alpha: number, beta: number, h = Infinity): Gen {
  yield;
  const u = term(b);
  if (u !== null) return u;
  if (h === 0) return e(b);
  const p = toMove(b);
  let v = p === 'X' ? -Infinity : Infinity;
  for (const i of empties(b)) {
    const x = yield* alphabeta(put(b, i, p), alpha, beta, h - 1);
    if (p === 'X') { if (x > v) { v = x; alpha = Math.max(alpha, v); } if (v >= beta) return v; }
    else { if (x < v) { v = x; beta = Math.min(beta, v); } if (v <= alpha) return v; }
  }
  return v;
}
function* expecti(b: Board): Gen { // O moves uniformly at random: its nodes are chance nodes
  yield;
  const u = term(b);
  if (u !== null) return u;
  const p = toMove(b), m = empties(b);
  let v = p === 'X' ? -Infinity : 0;
  for (const i of m) { const x = yield* expecti(put(b, i, p)); v = p === 'X' ? Math.max(v, x) : v + x / m.length; }
  return v;
}

interface Lane { name: string; note: string; child: (b: Board, alpha: number) => Gen; prune: boolean }
const LANES: Lane[] = [
  { name: 'minimax', note: 'whole tree, exact value', child: b => minimax(b), prune: false },
  { name: 'alpha-beta', note: 'whole tree, same value', child: (b, a) => alphabeta(b, a, Infinity), prune: true },
  { name: 'depth-limited α-β, h = 2', note: 'e(s) at the cut-off: an estimate', child: (b, a) => alphabeta(b, a, Infinity, 1), prune: true },
  { name: 'expectiminimax', note: 'O moves at random: expected value', child: b => expecti(b), prune: false },
];

/** The root (MAX = X) over its nine moves, as a generator too, so that every lane counts the root and its children alike. */
function* root(l: Lane, out: { v: number; move: number }): Generator<void, void, void> {
  yield;
  for (const i of empties(EMPTY)) {
    const x = yield* l.child(put(EMPTY, i, 'X'), l.prune ? out.v : -Infinity);
    if (x > out.v) { out.v = x; out.move = i; }
  }
}

const X0 = 230, BW = 380, Y0 = 34, LH = 54;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-adr-css', CSS);
  const c = card(el, 'simulation', 'The comparison table as a race: X\'s first move in tic-tac-toe', '0 0 780 250');
  let gens: Generator<void, void, void>[] = [], outs: { v: number; move: number }[] = [], nodes: number[] = [], done: boolean[] = [];
  let running = false, raf = 0, per = 2000, said = '';
  const whole = levels().reduce((t, l) => t + l.nodes, 0), equal = empties(EMPTY).every(i => solve(put(EMPTY, i, 'X')) === solve(EMPTY));

  const rows = LANES.map((l, k) => {
    const y = Y0 + k * LH;
    s(c.svg, 'text', { x: 16, y: y + 4, class: 'adr-name' }, l.name);
    s(c.svg, 'text', { x: 16, y: y + 21, class: 'fg-m' }, l.note);
    s(c.svg, 'rect', { x: X0, y: y - 10, width: BW, height: 22, rx: 4, class: 'adr-track' });
    return { fill: s(c.svg, 'rect', { x: X0, y: y - 10, height: 22, rx: 4, class: 'adr-fill' }), n: s(c.svg, 'text', { x: X0 + BW + 10, y: y + 5, class: 'adr-n' }),
      res: s(c.svg, 'text', { x: X0 + 6, y: y + 28, class: 'adr-res' }) };
  });
  s(c.svg, 'text', { x: X0, y: 16, class: 'fg-m' }, 'nodes generated (bar: share of the whole tree)');

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); clear(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="2000">2 000 nodes per frame</option><option value="200">200 nodes per frame</option><option value="20000">20 000 nodes per frame</option>';
  sp.onchange = () => { per = +sp.value; };
  ctl.append(run, reset, sp);

  function clear() {
    outs = LANES.map(() => ({ v: -Infinity, move: -1 }));
    gens = LANES.map((l, k) => root(l, outs[k]));
    nodes = LANES.map(() => 0);
    done = LANES.map(() => false);
    said = '';
  }
  function step() {
    gens.forEach((g, k) => {
      for (let i = 0; i < per && !done[k]; i++) { if (g.next().done) done[k] = true; else nodes[k]++; }
    });
  }
  function play() {
    if (done.every(Boolean)) clear();
    running = true;
    opts.onEvent?.(`[${c.title}] run, ${per} nodes per frame`);
    const frame = () => {
      step();
      if (done.every(Boolean)) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  const val = (v: number) => num(v, 4).replace('-', '−');
  function render() {
    rows.forEach((r, k) => {
      r.fill.setAttribute('width', String(Math.max(nodes[k] ? 2 : 0, (nodes[k] / whole) * BW)));
      r.fill.classList.toggle('fin', done[k]);
      r.n.textContent = fmt(nodes[k]);
      r.res.textContent = done[k] ? `value ${val(outs[k].v)}, plays ${cell(outs[k].move)}` : nodes[k] ? 'searching…' : '';
    });
    run.textContent = running ? '⏸ Pause' : done.every(Boolean) ? '⏵ Race again' : nodes[0] ? '⏵ Continue' : '⏵ Start the race';
    explain();
  }

  function explain() {
    const [mm, ab, dl, ex] = outs, ratio = nodes[0] / Math.max(1, nodes[1]);
    const [key, text] = !nodes[0]
      ? ['idle', '**Four searches choose X\'s first move** on the empty board, each advancing the same number of nodes per frame, so the bars race at the same speed. ' +
        'The bar is the share of the whole game tree generated so far.']
      : !done[1]
      ? ['run', '**Racing.** The depth-limited search stops after a handful of nodes: it never looks past ply 2.']
      : !done[0]
      ? ['ab', `**Alpha-beta is done after ${fmt(nodes[1])} nodes** with value ${val(ab.v)} and move ${cell(ab.move)}. Minimax is still generating the same tree, node by node.`]
      : ['done', `**Minimax: ${fmt(nodes[0])} nodes** (the whole tree), value ${val(mm.v)}${mm.v === 0 ? ' (a draw)' : ''}, move ${cell(mm.move)}${equal ? ', the first of nine equally good moves' : ''}. ` +
        `**Alpha-beta: same value, same move, ${num(ratio, 3)}× fewer nodes** in this move order. ` +
        `**Depth-limited**: ${fmt(nodes[2])} nodes, plays ${cell(dl.move)} with value ${val(dl.v)}: an **estimate** from $e(s)$, not the true 0. ` +
        `**Expectiminimax** with O as a random player: ${fmt(nodes[3])} nodes (no pruning without bounds), value ${val(ex.v)}${ex.v > 0.99 ? ': X wins almost surely' : ''}, and the best move is ${cell(ex.move)}` +
        `${[0, 2, 6, 8].includes(ex.move) ? ', a **corner**' : ''}${equal ? ': the nine moves minimax rates equal are **not** equal against this opponent' : ''}. A model of the opponent changes the values (homework, p. 402).`];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  clear();
  render();
  return { destroy: pause };
}

const CSS = `
.adr-name{font-size:13.5px;font-weight:650;fill:var(--text)}
.adr-track{fill:var(--panel-2);stroke:var(--border)}
.adr-fill{fill:var(--accent);opacity:.75}
.adr-fill.fin{fill:var(--ok);opacity:.9}
.adr-n{font:600 13px var(--mono);fill:var(--text)}
.adr-res{font:600 11.5px var(--mono);fill:var(--text-2)}
`;
