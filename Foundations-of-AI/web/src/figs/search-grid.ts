// Greedy best-first vs A* on the navigation grid of slides p. 198–201: static figure; both paths come from the Playground engine.
import { trace } from '../viz/search';
import { card, md, s, style } from './shell';

const GRID = ['...........', '.#...#####.', '.##...G..#.', 'S.########.', '...........'];
const CELL = 54, X0 = 16, Y0 = 16;

export function mount(el: HTMLElement) {
  style('fig-gr-css', '.gr-c{fill:var(--panel-2);stroke:var(--border)}.gr-w{fill:var(--panel-3);stroke:var(--border)}.gr-h{font:11px var(--mono);fill:var(--muted);text-anchor:middle}' +
    '.gr-sg{font:700 17px var(--font);fill:var(--text);text-anchor:middle;paint-order:stroke;stroke:var(--panel);stroke-width:5px}.gr-p{fill:none;stroke-width:4;stroke-linejoin:round;stroke-linecap:round;opacity:.9}' +
    '.gr-greedy{stroke:var(--warn);stroke-dasharray:9 6}.gr-astar{stroke:var(--ok)}.gr-min{fill:none;stroke:var(--bad);stroke-width:3}');
  const W = GRID[0].length, H = GRID.length;
  const c = card(el, 'figure', 'Greedy best-first falls into a local minimum; A* comes back', `0 0 ${X0 * 2 + W * CELL} ${Y0 + H * CELL + 44}`);
  const greedy = trace({ algorithm: 'greedy', grid: GRID }), astar = trace({ algorithm: 'astar', grid: GRID });
  const hOf = (id: string) => greedy.c.graph.nodes[id]?.h;
  GRID.forEach((row, r) => [...row].forEach((ch, col) => {
    const x = X0 + col * CELL, y = Y0 + r * CELL;
    s(c.svg, 'rect', { x, y, width: CELL, height: CELL, class: ch === '#' ? 'gr-w' : 'gr-c' });
    if (ch !== '#' && ch !== 'S' && ch !== 'G') s(c.svg, 'text', { x: x + CELL - 9, y: y + 14, class: 'gr-h' }, String(hOf(`${r},${col}`)));
  }));
  const pts = (path: string[], off: number) => path.map(id => {
    const [r, col] = id.split(',').map(Number);
    return `${X0 + col * CELL + CELL / 2 + off},${Y0 + r * CELL + CELL / 2 + off}`;
  }).join(' ');
  s(c.svg, 'polyline', { points: pts(greedy.result.path!, 6), class: 'gr-p gr-greedy' });
  s(c.svg, 'polyline', { points: pts(astar.result.path!, -6), class: 'gr-p gr-astar' });
  GRID.forEach((row, r) => [...row].forEach((ch, col) => {
    if (ch === 'S' || ch === 'G') s(c.svg, 'text', { x: X0 + col * CELL + CELL / 2, y: Y0 + r * CELL + CELL / 2 + 6, class: 'gr-sg' }, ch);
  }));
  // the trap: the deepest local minimum of h along greedy's path (first occurrence) = the cell under G, behind the wall
  const gr = greedy.result.path!, hs = gr.map(id => hOf(id)!);
  let trap = gr[0];
  for (let i = 1, best = Infinity; i < gr.length - 1; i++) if (hs[i] < hs[i - 1] && hs[i] < hs[i + 1] && hs[i] < best) { best = hs[i]; trap = gr[i]; }
  const [tr, tc] = trap.split(',').map(Number);
  s(c.svg, 'circle', { cx: X0 + tc * CELL + CELL / 2, cy: Y0 + tr * CELL + CELL / 2, r: CELL / 2 - 11, class: 'gr-min' });
  const ly = Y0 + H * CELL + 28;
  s(c.svg, 'line', { x1: X0, y1: ly - 5, x2: X0 + 34, y2: ly - 5, class: 'gr-p gr-greedy' });
  s(c.svg, 'text', { x: X0 + 44, y: ly, class: 'fg-t' }, `greedy (f = h): cost ${greedy.result.cost}`);
  s(c.svg, 'line', { x1: X0 + 300, y1: ly - 5, x2: X0 + 334, y2: ly - 5, class: 'gr-p gr-astar' });
  s(c.svg, 'text', { x: X0 + 344, y: ly, class: 'fg-t' }, `A* (f = g + h): cost ${astar.result.cost}, optimal`);
  c.cap.innerHTML = md(`The small number in each cell is $h$, the Manhattan distance to G ignoring walls. Greedy follows decreasing $h$ along the ` +
    `bottom corridor to the circled cell ($h = ${hOf(trap)}$): a **local minimum**, with the wall between it and G. Every way out raises $h$, so it ` +
    `goes all the way around and pays **${greedy.result.cost}**. A* also adds $g$: the corridor's $f$ keeps growing, the top route becomes cheaper ` +
    `and A* returns the optimal path of cost **${astar.result.cost}**.`);
  return { destroy() {} };
}
