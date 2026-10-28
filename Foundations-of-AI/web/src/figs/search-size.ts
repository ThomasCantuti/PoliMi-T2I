// How big is the state space (slides p. 66–68): log-scale sizes, and the time and memory to enumerate them at a chosen rate.
// The puzzle sizes are computed (n!, n!/2); chess, Go and the atoms are the slides' orders of magnitude.
import { bar, card, md, s, slider, style, type FigOptions } from './shell';
import { btn } from './search-kit';

const fact = (n: number) => { let p = 1; for (let k = 2; k <= n; k++) p *= k; return p; };
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const pow = (e: number) => `10${[...String(e)].map(d => SUP[+d]).join('')}`;
const sci = (x: number) => {
  if (x < 1e6) return Math.round(x).toLocaleString('en-US').replace(/,/g, ' ');
  const e = Math.floor(Math.log10(x)), m = x / 10 ** e;
  return `${m.toFixed(1)}×${pow(e)}`;
};
/** [name, log10 low, log10 high, note]; puzzles: all arrangements n! (the reachable half is n!/2). */
const ITEMS: [string, number, number, string][] = [
  ['8-puzzle', Math.log10(fact(9)), Math.log10(fact(9)), '9!'],
  ['15-puzzle', Math.log10(fact(16)), Math.log10(fact(16)), '16!'],
  ['24-puzzle', Math.log10(fact(25)), Math.log10(fact(25)), '25!'],
  ['chess', 43, 50, 'states'],
  ['atoms in the universe', 79, 81, ''],
  ['Go', 170, 170, 'states'],
];
const X0 = 168, XW = 296, LMAX = 180, ROW = 34, Y0 = 46;

function dur(sec: number) {
  const units: [number, string][] = [[3.15e7, 'years'], [86400, 'days'], [3600, 'hours'], [60, 'min'], [1, 's'], [1e-3, 'ms'], [1e-6, 'µs']];
  const [u, name] = units.find(([v]) => sec >= v) ?? units[units.length - 1];
  const v = sec / u;
  return v >= 1e6 ? `${sci(v)} ${name}` : `${+v.toPrecision(3)} ${name}`;
}
function bytes(n: number) {
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB'], k = Math.min(units.length - 1, Math.max(0, Math.floor(Math.log10(n) / 3)));
  const v = n / 1000 ** k;
  return v >= 1e6 ? `${sci(v)} ${units[k]}` : `${+v.toPrecision(3)} ${units[k]}`;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fms-css', CSS);
  const c = card(el, 'interactive', 'How big is the state space? (log scale)', `0 0 780 ${Y0 + ITEMS.length * ROW + 34}`);
  const X = (l: number) => X0 + (l / LMAX) * XW;
  for (let e = 0; e <= LMAX; e += 30) {
    s(c.svg, 'line', { x1: X(e), x2: X(e), y1: Y0 - 8, y2: Y0 + ITEMS.length * ROW, class: 'fms-grid' });
    s(c.svg, 'text', { x: X(e), y: Y0 + ITEMS.length * ROW + 16, class: 'fg-m', 'text-anchor': 'middle' }, pow(e));
  }
  s(c.svg, 'text', { x: X0, y: 20, class: 'fg-t' }, 'number of states');
  const TX = 560, MX = 680;
  const hT = s(c.svg, 'text', { x: TX, y: 20, class: 'fg-t' });
  s(c.svg, 'text', { x: MX, y: 20, class: 'fg-t' }, 'memory');
  const time = ITEMS.map(([name, lo, hi, note], k) => {
    const y = Y0 + k * ROW;
    s(c.svg, 'text', { x: X0 - 10, y: y + 13, class: 'fg-t', 'text-anchor': 'end' }, name);
    s(c.svg, 'rect', { x: X0, y, width: Math.max(2, X(hi) - X0), height: 18, rx: 3, class: k < 3 ? 'fms-bar' : k === 4 ? 'fms-atoms' : 'fms-game' });
    if (hi > lo) s(c.svg, 'rect', { x: X(lo), y, width: X(hi) - X(lo), height: 18, class: 'fms-range' });
    const lab = k < 3 ? `${note} = ${sci(10 ** hi)}` : lo === hi ? pow(lo) : `${pow(lo)} – ${pow(hi)}`;
    s(c.svg, 'text', { x: X(hi) + 6, y: y + 13, class: 'fms-val' }, `${lab}${k >= 3 && note ? ` ${note}` : ''}`);
    s(c.svg, 'text', { x: MX, y: y + 13, class: 'fms-cell' }, k === 4 ? '' : bytes(10 ** lo));
    return s(c.svg, 'text', { x: TX, y: y + 13, class: 'fms-cell' });
  });

  let e = 8;
  const ctl = bar(c);
  const sl = slider(ctl, 'log₁₀ of states per second', 6, 15, 1, e, v => { e = v; render(); });
  sl.addEventListener('change', () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`));
  for (const [v, why] of [[8, 'slides p. 67'], [12, 'a very fast machine']] as const)
    btn(ctl, `${pow(v)}/s (${why})`, () => { sl.value = String(v); sl.dispatchEvent(new Event('input')); sl.dispatchEvent(new Event('change')); });

  function render() {
    const rate = 10 ** e;
    hT.textContent = `time at ${pow(e)} states/s`;
    ITEMS.forEach(([, lo], k) => { time[k].textContent = k === 4 ? '' : dur(10 ** lo / rate); });
    const t = ITEMS.slice(0, 3).map(([, l]) => dur(10 ** l / rate));
    c.cap.innerHTML = md(`Generating ${pow(e)} states per second, just listing every arrangement takes **${t[0]}** for the 8-puzzle, **${t[1]}** for the 15-puzzle and **${t[2]}** for the 24-puzzle; ` +
      'chess and Go are beyond any machine, and Go has more states than there are atoms in the universe. Storing them is no better: at 1 byte per state, the right column. ' +
      'So a search agent can only ever build a **small portion** of the state space (slides p. 68).' +
      (e === 8 ? ' (The slides print 0.036 s and "a little less than 4 hours" for this rate; computed from 9! = 362 880 and 16! ≈ 2.1×10¹³ the times are those above.)' : ''));
  }
  render();
  return { destroy() {} };
}

const CSS = `
.fms-grid{stroke:var(--border);stroke-dasharray:2 4}
.fms-bar{fill:var(--accent)}
.fms-game{fill:var(--warn)}
.fms-atoms{fill:var(--info)}
.fms-range{fill:var(--panel);opacity:.45}
.fms-val{font:600 11.5px var(--mono);fill:var(--text-2)}
.fms-cell{font:12px var(--mono);fill:var(--text)}
`;
