// Abstraction (slides p. 70): many physical situations, one state. Toggle what the state keeps and see the count of states
// within 12 moves of the slides' 8-puzzle state (positions only vs every path a different state, computed in search-growth.ts).
import { board, flat, type Tiles } from './search-8puzzle';
import { growth } from './search-growth';
import { arrow, bar, card, md, s, style, type FigOptions } from './shell';
import { fmt } from './search-kit';

const T: Tiles = [8, 2, 7, 3, 4, 0, 5, 1, 6], D = 12, LOOKS: [string, string, number][] = [['wooden tiles', 'fma-wood', -3], ['plastic, worn', 'fma-plastic', 2], ['photo, at an angle', 'fma-photo', 8]];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fma-css', CSS);
  const c = card(el, 'interactive', 'Abstraction: one state stands for many physical situations', '0 0 780 270');
  const ah = arrow(c.svg), g = growth(T, D);
  LOOKS.forEach(([name, cls, rot], k) => {
    const y = 14 + k * 84, gg = s(c.svg, 'g', { class: cls, transform: `rotate(${rot} 58 ${y + 33})` });
    T.forEach((v, i) => {
      if (!v) return;
      const x = 26 + (i % 3) * 22, yy = y + Math.floor(i / 3) * 22;
      s(gg, 'rect', { x, y: yy, width: 21, height: 21, rx: k === 1 ? 6 : 2 });
      s(gg, 'text', { x: x + 10.5, y: yy + 15.5 }, String(v));
    });
    s(c.svg, 'text', { x: 104, y: y + 37, class: 'fg-m' }, name);
    s(c.svg, 'line', { x1: 210, y1: y + 33, x2: 268, y2: 120 + (k - 1) * 18, class: 'fg-e', 'marker-end': ah });
  });
  board(c.svg, 280, 74, T, 32);
  s(c.svg, 'text', { x: 328, y: 194, class: 'fg-m', 'text-anchor': 'middle' }, flat(T));
  s(c.svg, 'text', { x: 328, y: 62, class: 'fg-t', 'text-anchor': 'middle' }, 'one abstract state');

  const RX = 440, BW = 320, LMAX = Math.log10(g.tree[D]);
  s(c.svg, 'text', { x: RX, y: 30, class: 'fg-t' }, `states within ${D} moves of this one`);
  const big = s(c.svg, 'text', { x: RX, y: 64, class: 'fma-big' });
  const fill = s(c.svg, 'rect', { x: RX, y: 78, height: 12, rx: 6, class: 'fma-fill' });
  s(c.svg, 'rect', { x: RX, y: 78, width: BW, height: 12, rx: 6, class: 'fma-track' });
  c.svg.append(fill);
  s(c.svg, 'text', { x: RX, y: 106, class: 'fg-m' }, 'bar: log scale');
  const lines = [0, 1, 2].map(k => s(c.svg, 'text', { x: RX, y: 140 + k * 24, class: 'fg-t' }));

  let looks = false, history = false;
  const ctl = bar(c);
  const box = (label: string, on: (v: boolean) => void) => {
    const l = document.createElement('label');
    l.className = 'fma-cb';
    l.innerHTML = '<input type="checkbox"> <span></span>';
    l.querySelector('span')!.textContent = label;
    const inp = l.querySelector('input')!;
    inp.onchange = () => { on(inp.checked); render(); opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`); };
    ctl.append(l);
  };
  const lab = document.createElement('span');
  lab.className = 'fma-cb';
  lab.textContent = 'The state also keeps:';
  ctl.append(lab);
  box('the look of the tiles', v => { looks = v; });
  box('the history of the moves', v => { history = v; });

  function render() {
    const n = history ? g.tree[D] : g.states[D];
    big.textContent = fmt(n);
    fill.setAttribute('width', String((BW * Math.log10(n)) / LMAX));
    lines[0].textContent = history ? 'every path is a different state' : `positions only: ${fmt(g.states[D])}`;
    lines[1].textContent = history ? 'the whole space is infinite' : 'the whole space: 9!/2 = 181 440';
    lines[2].textContent = looks ? 'the look never changes with a move' : '';
    c.cap.innerHTML = md(history
      ? `**Too much detail.** With the move history in the state, a configuration reached by two different paths gives two different states: within ${D} moves there are **${fmt(g.tree[D])} states** instead of ${fmt(g.states[D])}, ` +
        'the same configurations are never recognized as repeated, and the space becomes infinite (it is the search tree itself).'
      : looks
      ? '**Irrelevant detail.** The material or the photo angle cannot change what moves are legal, where a move leads, whether the goal is reached or what a move costs, so no action, result, goal test or cost needs it: keeping it only multiplies the descriptions of the same situation.'
      : `**The right abstraction:** the three physical puzzles on the left share the relative positions of the tiles, and that is all the state keeps (a 9-tuple). ` +
        `It is enough to decide the applicable actions, their results, the goal test and the costs. Tick the boxes to see what extra detail costs.`);
  }
  render();
  return { destroy() {} };
}

const CSS = `
.fma-wood rect{fill:var(--warn-soft);stroke:var(--warn);stroke-width:1.5}
.fma-wood text{font:700 14px Georgia,serif;fill:var(--warn);text-anchor:middle}
.fma-plastic rect{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5}
.fma-plastic text{font:600 14px var(--font);fill:var(--accent);text-anchor:middle}
.fma-photo rect{fill:var(--panel-3);stroke:var(--muted);stroke-width:1;stroke-dasharray:3 2}
.fma-photo text{font:italic 600 14px var(--font);fill:var(--text-2);text-anchor:middle}
.fma-big{font:700 26px var(--mono);fill:var(--text)}
.fma-track{fill:none;stroke:var(--border-strong)}
.fma-fill{fill:var(--accent);transition:width .4s}
.fma-cb{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;color:var(--text-2)}
`;
