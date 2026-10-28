// Two reward functions, one ranking (RL p. 21, 32): the return of a path that reaches G in d moves, summed with the discount.
// goal-reward: G = γ^(d−1); action-penalty: G = −(1 − γ^(d−1))/(1 − γ), or −(d − 1) with γ = 1. Both fall as d grows.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const D = 12, SHORT = 4, DETOUR = 6, PW = 320, PH = 150, PY = 46, PXS = [56, 436];
const SCHEMES = [
  { name: 'goal-reward: 1 into G, 0 otherwise', step: 0, into: 1 },
  { name: 'action-penalty: −1 per step, 0 into G', step: -1, into: 0 },
];

/** Discounted return of a path of d moves that ends in G, summed move by move. */
export function ret(d: number, sc: number, gamma: number) {
  let g = 0;
  for (let k = 0; k < d; k++) g += gamma ** k * (k === d - 1 ? SCHEMES[sc].into : SCHEMES[sc].step);
  return g;
}
if (ret(4, 1, 0.5) !== -1.75 || ret(4, 0, 0.5) !== 0.125) console.error('rl-returns: d = 4 should give −1.75 (exam 11 Jun 2026) and 0.125');

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rln-css', CSS);
  const c = card(el, 'interactive', 'Return of a path to G of d moves, under the two reward functions', '0 0 780 250');
  let gamma = 0.5;
  const plots = SCHEMES.map((sc, k) => {
    const X = PXS[k];
    s(c.svg, 'text', { x: X - 40, y: 22, class: 'fg-t' }, sc.name);
    s(c.svg, 'rect', { x: X, y: PY, width: PW, height: PH, class: 'rln-plot' });
    for (let d = 1; d <= D; d++) if (d === 1 || d % 2 === 0) s(c.svg, 'text', { x: X + ((d - 1) / (D - 1)) * PW, y: PY + PH + 16, class: 'fg-m', 'text-anchor': 'middle' }, String(d));
    s(c.svg, 'text', { x: X + PW, y: PY + PH + 32, class: 'fg-m', 'text-anchor': 'end' }, 'd = moves to reach G');
    const yt = [0, 1].map(() => s(c.svg, 'text', { x: X - 6, class: 'fg-m', 'text-anchor': 'end' }));
    const line = s(c.svg, 'polyline', { class: 'rln-line' });
    const dots = Array.from({ length: D }, (_, d) => s(c.svg, 'circle', { r: d + 1 === SHORT || d + 1 === DETOUR ? 6 : 3.5, class: d + 1 === SHORT ? 'rln-dot short' : d + 1 === DETOUR ? 'rln-dot det' : 'rln-dot' }));
    const tags = [0, 1].map(() => s(c.svg, 'text', { class: 'rln-tag' }));
    return { X, yt, line, dots, tags };
  });

  const knobs = bar(c);
  const inp = slider(knobs, 'γ', 0.1, 1, 0.01, gamma, v => { gamma = v; render(); });
  inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] γ = ${gamma}: ${c.cap.textContent}`));
  for (const [v, why] of [[0.5, 'exams'], [0.95, 'RL p. 48'], [1, 'no discount']] as const) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `γ = ${v} (${why})`;
    b.onclick = () => { inp.value = String(v); inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change')); };
    knobs.append(b);
  }

  function render() {
    plots.forEach((p, k) => {
      const ys = Array.from({ length: D }, (_, d) => ret(d + 1, k, gamma));
      const lo = Math.min(0, ...ys), hi = Math.max(0, ...ys), span = hi - lo || 1;
      const x = (d: number) => p.X + ((d - 1) / (D - 1)) * PW, y = (v: number) => PY + 8 + ((hi - v) / span) * (PH - 16);
      p.yt[0].setAttribute('y', String(y(hi) + 4));
      p.yt[0].textContent = num(hi, 3);
      p.yt[1].setAttribute('y', String(y(lo) + 4));
      p.yt[1].textContent = num(lo, 3);
      p.line.setAttribute('points', ys.map((v, d) => `${x(d + 1)},${y(v)}`).join(' '));
      p.dots.forEach((dt, d) => { dt.setAttribute('cx', String(x(d + 1))); dt.setAttribute('cy', String(y(ys[d]))); });
      [SHORT, DETOUR].forEach((d, j) => {
        p.tags[j].setAttribute('x', String(x(d) + 8));
        p.tags[j].setAttribute('y', String(y(ys[d - 1]) - 10));
        p.tags[j].textContent = num(ys[d - 1], 3);
      });
    });
    const g = [0, 1].map(k => [ret(SHORT, k, gamma), ret(DETOUR, k, gamma)]);
    c.cap.innerHTML = md(`The exam grid's shortest path takes **${SHORT}** moves (green); a detour takes **${DETOUR}** (orange). ` +
      `Goal-reward: $\\gamma^{d-1}$ gives ${num(g[0][0], 3)} vs ${num(g[0][1], 3)}; action-penalty: $-\\frac{1-\\gamma^{d-1}}{1-\\gamma}$ gives ${num(g[1][0], 3)} vs ${num(g[1][1], 3)}. ` +
      (gamma < 1 ? 'Both returns **fall** with every extra move, so both reward functions make the shortest path optimal: the single reward is discounted more the later it comes, and every extra step costs −1. '
        : '**With $\\gamma = 1$ goal-reward is flat**: every path that reaches G is worth 1, so nothing favours the shortest one. Action-penalty still does: each extra move costs −1. ') +
      'The values differ, the best path does not.');
  }
  render();
  return { destroy() {} };
}

const CSS = `
.rln-plot{fill:var(--panel-2);stroke:var(--border)}
.rln-line{fill:none;stroke:var(--accent);stroke-width:2}
.rln-dot{fill:var(--accent);transition:cy .25s}
.rln-dot.short{fill:var(--ok)}
.rln-dot.det{fill:var(--warn)}
.rln-tag{font:600 11.5px var(--mono);fill:var(--text)}
`;
