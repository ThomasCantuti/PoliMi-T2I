// Bidirectional search (slides p. 163–168): one ball of radius d vs two balls of radius d/2; node counts computed for b = 10, d = 6.
import { card, md, s, style } from './shell';

const B = 10, D = 6;
const fmt = (x: number) => x.toLocaleString('en-US'), tex = (x: number) => fmt(x).replace(/,/g, '{,}');

export function mount(el: HTMLElement) {
  style('fig-bd-css', '.bd-ball{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2}.bd-ball2{fill:var(--warn-soft);stroke:var(--warn);stroke-width:2}' +
    '.bd-pt{font:700 14px var(--font);fill:var(--text);text-anchor:middle}.bd-dot{fill:var(--text)}');
  const c = card(el, 'figure', 'Bidirectional search: two small balls instead of one big one', '0 0 680 300');
  const one = B ** D, two = 2 * B ** (D / 2);
  const pt = (x: number, y: number, name: string) => { s(c.svg, 'circle', { cx: x, cy: y, r: 4, class: 'bd-dot' }); s(c.svg, 'text', { x, y: y - 10, class: 'bd-pt' }, name); };
  // left: forward search only, the ball around S reaches G
  s(c.svg, 'circle', { cx: 120, cy: 140, r: 100, class: 'bd-ball' });
  s(c.svg, 'line', { x1: 120, y1: 140, x2: 220, y2: 140, class: 'fg-e' });
  s(c.svg, 'text', { x: 170, y: 158, class: 'fg-m', 'text-anchor': 'middle' }, `depth d = ${D}`);
  pt(120, 140, 'S'); pt(220, 140, 'G');
  s(c.svg, 'text', { x: 120, y: 268, class: 'fg-t', 'text-anchor': 'middle' }, `one search: b^d = ${fmt(one)}`);
  // right: forward from S and backward from G, meeting halfway
  s(c.svg, 'circle', { cx: 470, cy: 140, r: 50, class: 'bd-ball' });
  s(c.svg, 'circle', { cx: 570, cy: 140, r: 50, class: 'bd-ball2' });
  s(c.svg, 'text', { x: 470, y: 165, class: 'fg-m', 'text-anchor': 'middle' }, 'forward');
  s(c.svg, 'text', { x: 570, y: 165, class: 'fg-m', 'text-anchor': 'middle' }, 'backward');
  pt(420, 140, 'S'); pt(620, 140, 'G');
  s(c.svg, 'text', { x: 520, y: 82, class: 'fg-m', 'text-anchor': 'middle' }, 'the frontiers meet');
  s(c.svg, 'line', { x1: 520, y1: 88, x2: 520, y2: 126, class: 'fg-e cur' });
  s(c.svg, 'text', { x: 520, y: 268, class: 'fg-t', 'text-anchor': 'middle' }, `two searches: 2·b^(d/2) = ${fmt(two)}`);
  c.cap.innerHTML = md(`With $b = ${B}$ and $d = ${D}$: one search generates about $b^d = ${tex(one)}$ nodes, two searches of depth $d/2$ about ` +
    `$2\\,b^{d/2} = ${tex(two)}$, ${fmt(one / two)} times fewer. In a search tree the number of nodes grows as $b^{\\text{depth}}$, so halving the radius ` +
    'is far stronger than the picture suggests. The backward search needs an explicit goal state and computable predecessors.');
  return { destroy() {} };
}
