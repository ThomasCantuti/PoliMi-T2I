// Discounting (RL p. 18–20, 30): drag γ and watch what a reward k steps away is worth now, and how the sum stays below 1/(1 − γ).
import { bar, card, label, md, num, s, slider, style, type FigOptions } from './shell';

const K = 40, X0 = 46, Y0 = 24, W = 420, H = 190, BW = W / K;
const SX = 520, SW = 220; // the running sum G_t, scaled to the bound 1/(1 − γ)

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-dc-css', CSS);
  const c = card(el, 'interactive', 'Discounting: what a reward k steps away is worth now', '0 0 780 270');
  for (const v of [0, 0.5, 1]) {
    s(c.svg, 'line', { x1: X0, x2: X0 + W, y1: Y0 + H - v * H, y2: Y0 + H - v * H, class: 'dc-grid' });
    s(c.svg, 'text', { x: X0 - 8, y: Y0 + H - v * H + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
  }
  const bars = Array.from({ length: K }, (_, k) => s(c.svg, 'rect', { x: X0 + k * BW + 1, y: Y0, width: BW - 2, height: H, class: 'dc-bar' }));
  for (const k of [0, 10, 20, 30]) s(c.svg, 'text', { x: X0 + k * BW + BW / 2, y: Y0 + H + 16, class: 'fg-m', 'text-anchor': 'middle' }, String(k));
  s(c.svg, 'text', { x: X0 + W, y: Y0 + H + 34, class: 'fg-m', 'text-anchor': 'end' }, 'k = steps from now');
  label(c.svg, X0, Y0 - 8, 'γᵏ: the weight of the reward r_{t+k+1}', { class: 'fg-t' });
  const half = s(c.svg, 'line', { y1: Y0, y2: Y0 + H, class: 'dc-half' }), halfT = s(c.svg, 'text', { y: Y0 + 14, class: 'dc-halft' });

  label(c.svg, SX, Y0 - 8, 'G_{t} with a reward of 1 at every step', { class: 'fg-t' });
  s(c.svg, 'rect', { x: SX, y: Y0, width: SW, height: H, class: 'dc-box' });
  s(c.svg, 'line', { x1: SX, x2: SX + SW, y1: Y0, y2: Y0, class: 'dc-bound' });
  const boundT = s(c.svg, 'text', { x: SX + SW - 4, y: Y0 + 14, class: 'dc-halft', 'text-anchor': 'end' });
  const sum = s(c.svg, 'polyline', { class: 'dc-sum' }), sumT = s(c.svg, 'text', { x: SX + 6, class: 'fg-t' });
  s(c.svg, 'text', { x: SX + SW, y: Y0 + H + 16, class: 'fg-m', 'text-anchor': 'end' }, `after ${K} steps`);

  let gamma = 0.95;
  const knobs = bar(c);
  const inp = slider(knobs, 'γ', 0.05, 0.99, 0.01, gamma, v => { gamma = v; render(); });
  for (const [v, why] of [[0.5, 'exams 2022, 2026'], [0.9, ''], [0.95, 'RL p. 48']] as const) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `γ = ${v}${why ? ` (${why})` : ''}`;
    b.onclick = () => { inp.value = String(v); inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change')); };
    knobs.append(b);
  }
  inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] γ = ${gamma}: ${c.cap.textContent}`));

  function render() {
    const bound = 1 / (1 - gamma), h = Math.log(0.5) / Math.log(gamma); // γ^h = 1/2
    bars.forEach((b, k) => { b.style.transform = `scaleY(${gamma ** k})`; });
    half.setAttribute('x1', String(X0 + Math.min(h, K) * BW));
    half.setAttribute('x2', String(X0 + Math.min(h, K) * BW));
    halfT.setAttribute('x', String(X0 + Math.min(h, K) * BW + 4));
    halfT.textContent = h < K ? `half after ${num(h, 2)} steps` : '';
    let g = 0, pts = '';
    for (let k = 0; k < K; k++) { g += gamma ** k; pts += `${SX + ((k + 1) / K) * SW},${Y0 + H - (g / bound) * H} `; }
    sum.setAttribute('points', `${SX},${Y0 + H} ${pts}`);
    sumT.setAttribute('y', String(Math.max(Y0 + 34, Y0 + H - (g / bound) * H - 8)));
    sumT.textContent = `${num(g, 3)} so far`;
    boundT.textContent = `bound 1/(1 − γ) = ${num(bound, 3)}`;
    c.cap.innerHTML = md(`With $\\gamma = ${gamma}$ a reward $k$ steps away is worth $\\gamma^k$ of the same reward now; it halves every **${num(h, 2)}** steps. ` +
      (gamma <= 0.6 ? 'A **short-sighted** agent: after a handful of steps rewards hardly count. ' : gamma >= 0.9 ? 'A **far-sighted** agent: rewards dozens of steps away still count. ' : '') +
      `The sum of a reward of 1 at every step approaches $\\frac{1}{1-\\gamma} = ${num(bound, 3)}$ (right) but never exceeds it: that is why $\\mathbb{E}[G_t] \\le R_{max}\\frac{1}{1-\\gamma}$. ` +
      `Goal-reward grids read the same bars: a cell $d$ steps from G is worth $\\gamma^{d-1}$, the bar at $k = d - 1$ (${[1, 2, 3].map(d => num(gamma ** (d - 1), 3)).join(', ')}, …).`);
  }
  render();
  return { destroy() {} };
}

const CSS = `
.dc-grid{stroke:var(--border);stroke-dasharray:2 4}
.dc-bar{fill:var(--accent);opacity:.85;transform-box:fill-box;transform-origin:bottom;transition:transform .35s cubic-bezier(.2,.7,.2,1)}
.dc-half{stroke:var(--warn);stroke-width:1.5;stroke-dasharray:5 4}
.dc-halft{font:600 11px var(--mono);fill:var(--warn)}
.dc-box{fill:var(--panel-2);stroke:var(--border)}
.dc-bound{stroke:var(--warn);stroke-width:1.5;stroke-dasharray:5 4}
.dc-sum{fill:none;stroke:var(--ok);stroke-width:2.5}
`;
