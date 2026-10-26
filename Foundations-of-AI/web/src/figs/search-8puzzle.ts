// One 8-puzzle state and its successors (slides p. 57–61): static figure; the children are computed with result(s, a).
import { arrow, card, md, s, style } from './shell';

export type Tiles = number[]; // row by row, 0 = blank

const MOVES = { up: -3, down: 3, left: -1, right: 1 } as const;
type Move = keyof typeof MOVES;

export function actions(t: Tiles): Move[] {
  const b = t.indexOf(0), r = Math.floor(b / 3), c = b % 3;
  return (['up', 'down', 'left', 'right'] as Move[]).filter(a => (a !== 'up' || r > 0) && (a !== 'down' || r < 2) && (a !== 'left' || c > 0) && (a !== 'right' || c < 2));
}

export function result(t: Tiles, a: Move): Tiles {
  const b = t.indexOf(0), n = b + MOVES[a], out = [...t];
  [out[b], out[n]] = [out[n], out[b]];
  return out;
}

export const flat = (t: Tiles) => [0, 3, 6].map(i => t.slice(i, i + 3).map(v => v || '_').join(' ')).join(' / ');

/** A 3×3 board at (x, y); `cls(i, tile)` adds a class to a tile (`hi`, `ok`, `bad`), `badge(i, tile)` a small corner label. */
export function board(parent: Element, x: number, y: number, t: Tiles, cell: number,
  cls: (i: number, v: number) => string = () => '', badge: (i: number, v: number) => string = () => '') {
  style('fig-p8-css', '.p8 rect{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:1.5;transition:fill .25s}' +
    '.p8 .bl rect{fill:var(--panel-3)}.p8 .hi rect{fill:var(--accent-soft);stroke:var(--accent)}' +
    '.p8 .ok rect{fill:var(--ok-soft);stroke:var(--ok)}.p8 .bad rect{fill:var(--warn-soft);stroke:var(--warn)}' +
    '.p8 text{font:650 18px var(--mono);fill:var(--text);text-anchor:middle}.p8 .bd{font:600 11px var(--mono);fill:var(--muted);text-anchor:end}');
  const g = s(parent, 'g', { class: 'p8' });
  t.forEach((v, i) => {
    const cx = x + (i % 3) * cell, cy = y + Math.floor(i / 3) * cell;
    const tg = s(g, 'g', { class: `${v ? '' : 'bl '}${cls(i, v)}` });
    s(tg, 'rect', { x: cx + 2, y: cy + 2, width: cell - 4, height: cell - 4, rx: 6 });
    if (v) s(tg, 'text', { x: cx + cell / 2, y: cy + cell / 2 + 6.5, 'font-size': Math.round(cell * 0.42) }, String(v));
    const bd = badge(i, v);
    if (bd) s(tg, 'text', { x: cx + cell - 6, y: cy + 15, class: 'bd' }, bd);
  });
  return g;
}

const START: Tiles = [8, 2, 7, 3, 4, 0, 5, 1, 6];

export function mount(el: HTMLElement) {
  const c = card(el, 'figure', 'The 8-puzzle: one state and its successors', '0 0 640 330');
  const ah = arrow(c.svg);
  const C = 34, W = 3 * C, px = 320 - W / 2;
  board(c.svg, px, 14, START, C);
  s(c.svg, 'text', { x: px + W + 14, y: 14 + W / 2 + 4, class: 'fg-m' }, 's');
  const acts = actions(START);
  acts.forEach((a, k) => {
    const t = result(START, a), cx = 320 + (k - 1) * 200, x = cx - W / 2, y = 200, moved = START.indexOf(0);
    const x1 = 320 + (k - 1) * 30, y1 = 14 + W + 6, y2 = y - 10;
    s(c.svg, 'line', { x1, y1, x2: cx, y2, class: 'fg-e', 'marker-end': ah });
    s(c.svg, 'text', { x: (x1 + cx) / 2 + (k ? 10 : -10), y: (y1 + y2) / 2 + 4, class: 'fg-t', 'text-anchor': k ? 'start' : 'end' }, a);
    board(c.svg, x, y, t, C, i => (i === moved ? 'hi' : ''));
    s(c.svg, 'text', { x: x + W / 2, y: y + W + 18, class: 'fg-m', 'text-anchor': 'middle' }, `result(s, ${a})`);
  });
  const missing = (['up', 'down', 'left', 'right'] as Move[]).filter(a => !acts.includes(a));
  s(c.svg, 'text', { x: px + W + 14, y: 14 + W / 2 + 24, class: 'fg-m' }, `${missing.join(', ')}: not applicable (blank on the edge)`);
  c.cap.innerHTML = md(`The action moves the **blank**: here it is on the right edge, so $\\text{actions}(s) = \\{\\text{${acts.join(', ')}}\\}$. ` +
    'Each arrow is one edge of the state space; the highlighted tile is the one that slid into the old blank square. ' +
    'You never draw this graph: `actions` and `result` generate it on demand.');
  return { destroy() {} };
}
