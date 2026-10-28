// The tic-tac-toe game tree level by level (slides p. 341–344, 356): every count is computed by propagating the number of
// move sequences over the distinct positions. Also exports the tic-tac-toe helpers the other adv-/mcts- figures use.
import { bar, card, md, s, slider, style, type FigOptions } from './shell';

export type Board = string; // 9 chars row by row: 'X', 'O', '.'
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export const EMPTY: Board = '.........';
export const winner = (b: Board) => LINES.find(([a, c, d]) => b[a] !== '.' && b[a] === b[c] && b[a] === b[d])?.map(i => b[i])[0] ?? null;
export const over = (b: Board) => winner(b) !== null || !b.includes('.');
export const toMove = (b: Board) => ([...b].filter(c => c === 'X').length > [...b].filter(c => c === 'O').length ? 'O' : 'X');
export const empties = (b: Board) => [...b].flatMap((c, i) => (c === '.' ? [i] : []));
export const put = (b: Board, i: number, p: string) => b.slice(0, i) + p + b.slice(i + 1);
export const cell = (i: number) => 'abc'[i % 3] + (Math.floor(i / 3) + 1); // column letter + row, as in the MCTS visualizer
export const fmt = (n: number) => n.toLocaleString('en-US');
/** +1 X wins, −1 O wins, 0 draw, under perfect play (memoized over the 5 478 positions). */
const solved = new Map<Board, number>();
export function minimax(b: Board): number {
  let v = solved.get(b);
  if (v !== undefined) return v;
  const w = winner(b), p = toMove(b);
  v = w ? (w === 'X' ? 1 : -1) : !b.includes('.') ? 0 : empties(b).map(i => minimax(put(b, i, p))).reduce((x, y) => (p === 'X' ? Math.max(x, y) : Math.min(x, y)));
  solved.set(b, v);
  return v;
}

/** A small board drawn in SVG; `set` writes the position, `hi` the cells to emphasize (the others are faded). */
export function miniBoard(parent: Element, x: number, y: number, size: number) {
  style('fig-adt-board-css', BOARD_CSS);
  const g = s(parent, 'g', { transform: `translate(${x},${y})`, class: 'adt-b' });
  const c = size / 3;
  s(g, 'rect', { width: size, height: size, rx: 3, class: 'adt-bg' });
  for (let i = 1; i < 3; i++) {
    s(g, 'line', { x1: i * c, x2: i * c, y1: 2, y2: size - 2, class: 'adt-gl' });
    s(g, 'line', { y1: i * c, y2: i * c, x1: 2, x2: size - 2, class: 'adt-gl' });
  }
  const marks = Array.from({ length: 9 }, (_, i) => s(g, 'text', { x: (i % 3 + 0.5) * c, y: (Math.floor(i / 3) + 0.5) * c, 'font-size': c * 0.78, class: 'adt-m' }));
  return {
    g,
    set(b: Board, hi: number[] = []) {
      marks.forEach((m, i) => {
        m.textContent = b[i] === '.' ? '' : b[i];
        m.setAttribute('class', `adt-m ${b[i] === 'X' ? 'x' : 'o'}${hi.length && !hi.includes(i) ? ' lo' : ''}`);
      });
    },
  };
}

const BOARD_CSS = `
.adt-bg{fill:var(--panel-2);stroke:var(--border)}
.adt-gl{stroke:var(--border-strong);stroke-width:1}
.adt-m{font-weight:700;text-anchor:middle;dominant-baseline:central;font-family:var(--font)}
.adt-m.x{fill:var(--v-max)}
.adt-m.o{fill:var(--v-min)}
.adt-m.lo{opacity:.5}
.adt-b{transition:opacity .3s}
`;

// ------------------------------------------------------------------ the figure

export interface Level { nodes: number; positions: number; xWins: number; oWins: number; draws: number }

/** Level d: move sequences of length d (tree nodes), distinct positions, games that end there. */
export function levels(): Level[] {
  const out: Level[] = [];
  let cur = new Map<Board, number>([[EMPTY, 1]]);
  for (let d = 0; d <= 9; d++) {
    const L: Level = { nodes: 0, positions: cur.size, xWins: 0, oWins: 0, draws: 0 }, next = new Map<Board, number>();
    for (const [b, n] of cur) {
      L.nodes += n;
      const w = winner(b);
      if (w === 'X') L.xWins += n; else if (w === 'O') L.oWins += n; else if (!b.includes('.')) L.draws += n;
      if (over(b)) continue;
      for (const i of empties(b)) { const nb = put(b, i, toMove(b)); next.set(nb, (next.get(nb) ?? 0) + n); }
    }
    out.push(L);
    cur = next;
  }
  // independent check: nobody can win before move 5, so level d has exactly 9!/(9 − d)! move sequences up to d = 4
  for (let d = 0, f = 1; d <= 4; f *= 9 - d, d++) if (out[d].nodes !== f) console.error(`adv-ttt-tree: level ${d} has ${out[d].nodes} nodes, expected ${f}`);
  return out;
}

const PATH = [4, 0, 6, 2, 1, 7, 3, 5, 8]; // one line of play (a draw): b2 a1 a3 c1 b1 b3 a2 c2 c3
const RY = 32, Y0 = 30, BS = 24, BX = 92, LX = 384, LW = 186, COLS = [626, 694, 772];
const lx = (n: number) => LX + (Math.log10(Math.max(1, n)) / 6) * LW;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-adt-css', CSS);
  const c = card(el, 'interactive', 'The tic-tac-toe game tree, level by level', '0 0 780 372');
  const L = levels(), ended = (l: Level) => l.xWins + l.oWins + l.draws;
  const pathBoards = PATH.reduce<Board[]>((bs, i, k) => [...bs, put(bs[k], i, toMove(bs[k]))], [EMPTY]);

  s(c.svg, 'text', { x: 8, y: 14, class: 'fg-m' }, 'level');
  s(c.svg, 'text', { x: BX, y: 14, class: 'fg-m' }, 'the children of the highlighted node');
  s(c.svg, 'text', { x: LX, y: 14, class: 'fg-m' }, 'log scale');
  ['nodes', 'positions', 'games end'].forEach((t, k) => s(c.svg, 'text', { x: COLS[k], y: 14, class: `adt-hd k${k}`, 'text-anchor': 'end' }, t));
  for (let e = 0; e <= 6; e += 2) {
    s(c.svg, 'line', { x1: lx(10 ** e), x2: lx(10 ** e), y1: Y0 - 8, y2: Y0 + 10 * RY - 6, class: 'adt-grid' });
    s(c.svg, 'text', { x: lx(10 ** e), y: Y0 + 10 * RY + 6, class: 'fg-m', 'text-anchor': 'middle' }, e ? `10${'⁰¹²³⁴⁵⁶'[e]}` : '1');
  }
  const rows = L.map((l, d) => {
    const y = Y0 + d * RY, g = s(c.svg, 'g', { class: 'adt-row' });
    s(g, 'text', { x: 8, y: y + 15, class: 'fg-t' }, `${d}`);
    s(g, 'text', { x: 24, y: y + 15, class: 'fg-m' }, d === 9 ? 'game over' : `${toMove(pathBoards[d])} to move`);
    // the children of the path node at level d − 1 (the root alone at level 0)
    const parent = d ? pathBoards[d - 1] : null, kids = parent ? empties(parent).map(i => ({ i, b: put(parent, i, toMove(parent)) })) : [{ i: -1, b: EMPTY }];
    kids.forEach(({ i, b }, k) => {
      const mb = miniBoard(g, BX + k * (BS + 4), y, BS);
      mb.set(b, i >= 0 ? [i] : []);
      if (b === pathBoards[d]) s(mb.g, 'rect', { x: -2, y: -2, width: BS + 4, height: BS + 4, rx: 4, class: 'adt-on' });
    });
    s(g, 'rect', { x: LX, y: y + 3, width: lx(l.nodes) - LX, height: 9, rx: 2, class: 'adt-nodes' });
    s(g, 'rect', { x: LX, y: y + 14, width: lx(l.positions) - LX, height: 6, rx: 2, class: 'adt-pos' });
    s(g, 'text', { x: COLS[0], y: y + 15, class: 'adt-n', 'text-anchor': 'end' }, fmt(l.nodes));
    s(g, 'text', { x: COLS[1], y: y + 15, class: 'adt-n', 'text-anchor': 'end' }, fmt(l.positions));
    s(g, 'text', { x: COLS[2], y: y + 15, class: 'adt-n end', 'text-anchor': 'end' }, ended(l) ? fmt(ended(l)) : '–');
    return g;
  });
  const total = s(c.svg, 'text', { x: 8, y: Y0 + 10 * RY + 8, class: 'fg-t' });

  let h = 0, timer = 0;
  const knobs = bar(c);
  const play = document.createElement('button');
  play.className = 'btn sm primary';
  knobs.append(play);
  const inp = slider(knobs, 'levels shown', 0, 9, 1, h, v => { h = v; render(); });
  inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] level ${h}: ${c.cap.textContent}`));
  play.onclick = () => {
    if (timer) return stop();
    if (h === 9) set(0);
    play.textContent = '⏸ Pause';
    timer = window.setInterval(() => { set(h + 1); opts.onEvent?.(`[${c.title}] level ${h}: ${c.cap.textContent}`); if (h === 9) stop(); }, 1100);
  };
  function stop() { clearInterval(timer); timer = 0; play.textContent = '⏵ Grow the tree'; }
  function set(v: number) { h = v; inp.value = String(v); inp.dispatchEvent(new Event('input')); }

  function render() {
    rows.forEach((g, d) => g.classList.toggle('hide', d > h));
    const upTo = L.slice(0, h + 1), sum = (f: (l: Level) => number) => upTo.reduce((t, l) => t + f(l), 0);
    total.textContent = `levels 0–${h}: ${fmt(sum(l => l.nodes))} nodes, ${fmt(sum(l => l.positions))} positions, ${fmt(sum(ended))} games`;
    const l = L[h], all = L.reduce((t, x) => t + x.nodes, 0), games = L.reduce((t, x) => t + ended(x), 0);
    const pos = L.reduce((t, x) => t + x.positions, 0);
    c.cap.innerHTML = md(h === 0
      ? '**The root:** the empty board, MAX (X) to move. Press **Grow the tree**: each level holds every position reachable in that many moves. The left column follows one line of play and shows **all** the children of the highlighted node.'
      : h < 5
      ? `**Level ${h}:** ${fmt(l.nodes)} move sequences = ${h === 1 ? '9' : `${fmt(L[h - 1].nodes)} × ${10 - h}`} (every node has one child per empty square), but only **${fmt(l.positions)} distinct positions**: ` +
        `different move orders reach the same board (a **graph**, not a tree). No game can end before move 5.`
      : h < 9
      ? `**Level ${h}:** ${fmt(l.nodes)} nodes. **${fmt(ended(l))} games end here** (${l.xWins ? `X wins ${fmt(l.xWins)}` : `O wins ${fmt(l.oWins)}`}), ` +
        'so their nodes have no children: the tree is narrower than the full 9 × 8 × 7 … fan would be.'
      : `**The whole tree: ${fmt(all)} nodes**, the "≈ 550 000" of the Minimax properties table; **${fmt(games)} complete games** (${fmt(L.reduce((t, x) => t + x.xWins, 0))} X wins, ` +
        `${fmt(L.reduce((t, x) => t + x.oWins, 0))} O wins, ${fmt(l.draws)} draws), but only **${fmt(pos)} distinct positions**. Minimax visits every node: $b^h$ growth even for a game a child can play.`);
  }
  stop();
  render();
  return { destroy: stop };
}

const CSS = `
.adt-grid{stroke:var(--border);stroke-dasharray:2 4}
.adt-nodes{fill:var(--accent)}
.adt-pos{fill:var(--v-chance)}
.adt-on{fill:none;stroke:var(--accent);stroke-width:2}
.adt-n{font:600 11.5px var(--mono);fill:var(--text)}
.adt-n.end{fill:var(--warn)}
.adt-hd{font-size:11.5px;font-weight:600}
.adt-hd.k0{fill:var(--accent)}
.adt-hd.k1{fill:var(--v-chance)}
.adt-hd.k2{fill:var(--warn)}
.adt-row{transition:opacity .35s}
`;
