// h1 (misplaced tiles) and h2 (Manhattan distance) on the 8-puzzle example of slides p. 181–183: static figure, computed per tile.
import { board, type Tiles } from './search-8puzzle';
import { card, md, s } from './shell';

const NODE: Tiles = [5, 0, 8, 4, 2, 1, 7, 3, 6], GOAL: Tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const dist = (v: number, i: number) => {
  const j = GOAL.indexOf(v);
  return Math.abs(Math.floor(i / 3) - Math.floor(j / 3)) + Math.abs((i % 3) - (j % 3));
};

export function mount(el: HTMLElement) {
  const c = card(el, 'figure', '8-puzzle heuristics: misplaced tiles and Manhattan distance', '0 0 640 290');
  const C = 62;
  const tiles = NODE.map((v, i) => ({ v, i })).filter(t => t.v);
  const h1 = tiles.filter(t => dist(t.v, t.i) > 0).length, h2 = tiles.reduce((a, t) => a + dist(t.v, t.i), 0);
  board(c.svg, 40, 40, NODE, C, (i, v) => (!v ? '' : dist(v, i) ? 'bad' : 'ok'), (i, v) => (v ? String(dist(v, i)) : ''));
  board(c.svg, 414, 40, GOAL, C);
  s(c.svg, 'text', { x: 40 + 1.5 * C, y: 26, class: 'fg-t', 'text-anchor': 'middle' }, 'node n');
  s(c.svg, 'text', { x: 414 + 1.5 * C, y: 26, class: 'fg-t', 'text-anchor': 'middle' }, 'goal');
  s(c.svg, 'text', { x: 320, y: 40 + 1.5 * C + 5, class: 'fg-m', 'text-anchor': 'middle' }, 'corner number =');
  s(c.svg, 'text', { x: 320, y: 40 + 1.5 * C + 21, class: 'fg-m', 'text-anchor': 'middle' }, 'moves to its goal square');
  s(c.svg, 'text', { x: 40, y: 262, class: 'fg-h2' }, `h₁ = ${h1} misplaced tiles`);
  s(c.svg, 'text', { x: 640 - 40, y: 262, class: 'fg-h2', 'text-anchor': 'end' }, `h₂ = ${tiles.map(t => dist(t.v, t.i)).join(' + ')} = ${h2}`);
  c.cap.innerHTML = md('Orange tiles are **misplaced** (each counts 1 in $h_1$); green ones are already home. The corner number is the tile\'s ' +
    '**Manhattan distance** to its goal square, and $h_2$ adds them up. The blank is not a tile: it never counts.');
  return { destroy() {} };
}
