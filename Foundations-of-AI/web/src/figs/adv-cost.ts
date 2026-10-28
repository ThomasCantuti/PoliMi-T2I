// What a node budget buys (slides p. 357, 377, 383): b^h for minimax, b^(3h/4) and b^(h/2) for alpha-beta; drag b and the time per move.
import { fmt, levels } from './adv-ttt-tree';
import { bar, card, label, md, num, s, slider, style, type FigOptions } from './shell';

const X0 = 60, Y0 = 20, W = 420, H = 230, HMAX = 12, EMAX = 16; // depth 0…12, nodes 1…10^16
const CURVES = [
  { name: 'minimax', k: 1, tex: 'b^h' },
  { name: 'α-β, random order', k: 0.75, tex: 'b^{3h/4}' },
  { name: 'α-β, best order', k: 0.5, tex: 'b^{h/2}' },
];
const SPEEDS = [1e4, 1e6, 1e8];
const PRESETS = [
  { name: 'chess, slides p. 383', b: 35, t: 100, v: 1e4 },
  { name: 'Go', b: 250, t: 100, v: 1e4 },
  { name: 'chess, 1 h at 10⁸ nodes/s', b: 35, t: 3600, v: 1e8 },
];
const sup = (n: number) => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
/** 3.6×10¹¹ as text (`tex` for KaTeX); plain digits below 10⁴. */
function sci(x: number, tex = false) {
  if (x < 1e4) return num(x, 3);
  const e = Math.floor(Math.log10(x) + 1e-9), m = num(x / 10 ** e, 2);
  return tex ? `${m === '1' ? '' : `${m} \\times `}10^{${e}}` : `${m === '1' ? '' : `${m}×`}10${sup(e)}`;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-adk-css', CSS);
  const c = card(el, 'interactive', 'What a node budget buys: b^h grows too fast for full search', '0 0 780 300');
  const px = (h: number) => X0 + (h / HMAX) * W, py = (e: number) => Y0 + H - (Math.min(EMAX, Math.max(0, e)) / EMAX) * H;
  for (let e = 0; e <= EMAX; e += 4) {
    s(c.svg, 'line', { x1: X0, x2: X0 + W, y1: py(e), y2: py(e), class: 'adk-grid' });
    s(c.svg, 'text', { x: X0 - 6, y: py(e) + 4, class: 'fg-m', 'text-anchor': 'end' }, e ? `10${sup(e)}` : '1');
  }
  for (let h = 0; h <= HMAX; h += 2) s(c.svg, 'text', { x: px(h), y: Y0 + H + 16, class: 'fg-m', 'text-anchor': 'middle' }, String(h));
  s(c.svg, 'text', { x: X0 + W, y: Y0 + H + 32, class: 'fg-m', 'text-anchor': 'end' }, 'search depth h');
  s(c.svg, 'text', { x: X0 - 50, y: Y0 - 6, class: 'fg-m' }, 'nodes (log scale)');
  s(c.svg, 'rect', { x: X0, y: Y0, width: W, height: H, class: 'adk-box' });
  const budget = s(c.svg, 'line', { x1: X0, x2: X0 + W, class: 'adk-budget' }), budgetT = s(c.svg, 'text', { x: X0 + W - 6, class: 'adk-bt', 'text-anchor': 'end' });
  const curves = CURVES.map((_, k) => s(c.svg, 'polyline', { class: `adk-c k${k}` }));
  const drops = CURVES.map((_, k) => s(c.svg, 'line', { class: `adk-drop k${k}` }));
  const dots = CURVES.map((_, k) => s(c.svg, 'circle', { r: 5, class: `adk-dot k${k}` }));
  const RX = 520;
  s(c.svg, 'text', { x: RX, y: Y0 + 12, class: 'fg-h2' }, 'Depth reached in the budget');
  const rows = CURVES.map((cv, k) => {
    label(c.svg, RX, Y0 + 44 + k * 30, cv.name, { class: `adk-name k${k}` });
    return s(c.svg, 'text', { x: RX + 240, y: Y0 + 44 + k * 30, class: 'adk-val', 'text-anchor': 'end' });
  });
  const mem = s(c.svg, 'text', { x: RX, y: Y0 + 150, class: 'fg-t' }), mem2 = s(c.svg, 'text', { x: RX, y: Y0 + 168, class: 'fg-m' });
  const full = [0, 1, 2].map(k => s(c.svg, 'text', { x: RX, y: Y0 + 196 + k * 18, class: 'fg-m' }));
  const ttt = levels().reduce((n, l) => n + l.nodes, 0);

  let b = 35, t = 100, v = 1e4;
  const knobs = bar(c), pre = bar(c);
  const bIn = slider(knobs, 'b', 2, 300, 1, b, x => { b = x; render(); });
  const tIn = slider(knobs, 'seconds per move', 1, 3600, 1, t, x => { t = x; render(); });
  const sp = document.createElement('select');
  sp.innerHTML = SPEEDS.map(x => `<option value="${x}">${sci(x)} nodes/s</option>`).join('');
  sp.onchange = () => { v = +sp.value; render(); say(); };
  knobs.append(sp);
  for (const p of PRESETS) {
    const btn = document.createElement('button');
    btn.className = 'btn sm';
    btn.textContent = `${p.name}: b = ${p.b}`;
    btn.onclick = () => { b = p.b; t = p.t; v = p.v; bIn.value = String(b); tIn.value = String(t); sp.value = String(v); for (const i of [bIn, tIn]) i.dispatchEvent(new Event('input')); render(); say(); };
    pre.append(btn);
  }
  for (const i of [bIn, tIn]) i.addEventListener('change', say);
  function say() { opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`); }

  const depth = (k: number) => Math.log10(t * v) / (k * Math.log10(b)); // b^(k·h) = budget
  function render() {
    const E = Math.log10(t * v), lb = Math.log10(b);
    budget.setAttribute('y1', String(py(E)));
    budget.setAttribute('y2', String(py(E)));
    budgetT.setAttribute('y', String(py(E) - 6));
    budgetT.textContent = `budget: ${t} s × ${sci(v)} nodes/s = ${sci(t * v)} nodes`;
    CURVES.forEach((cv, k) => {
      let pts = '';
      const top = Math.min(HMAX, EMAX / (cv.k * lb)); // where the curve leaves the plot
      for (let h = 0; h < top; h += 0.25) pts += `${px(h)},${py(cv.k * h * lb)} `;
      pts += `${px(top)},${py(cv.k * top * lb)}`;
      curves[k].setAttribute('points', pts);
      const d = depth(cv.k), vis = d <= HMAX;
      for (const e of [drops[k], dots[k]]) e.classList.toggle('hide', !vis);
      dots[k].setAttribute('cx', String(px(Math.min(d, HMAX))));
      dots[k].setAttribute('cy', String(py(E)));
      drops[k].setAttribute('x1', String(px(Math.min(d, HMAX))));
      drops[k].setAttribute('x2', String(px(Math.min(d, HMAX))));
      drops[k].setAttribute('y1', String(py(E)));
      drops[k].setAttribute('y2', String(Y0 + H));
      rows[k].textContent = `h ≈ ${num(d, 3)}`;
    });
    const h = Math.floor(depth(1));
    mem.textContent = `memory at h = ${h}: b·h = ${b * h} nodes`;
    mem2.textContent = `(the tree it searches: b^h ≈ ${sci(b ** h)} nodes)`;
    full[2].textContent = `whole tic-tac-toe game: ${fmt(ttt)} nodes = ${num(ttt / v, 3)} s`;
    full[0].textContent = `whole chess game, b = 35, h = 100: 10${sup(Math.round(100 * Math.log10(35)))} nodes`;
    full[1].textContent = `whole Go game, b = 250, h = 150: 10${sup(Math.round(150 * Math.log10(250)))} nodes`;
    const [d1, d2, d3] = CURVES.map(cv => depth(cv.k));
    c.cap.innerHTML = md(`With **${t} s per move at ${sci(v)} nodes/s** the search can afford $${sci(t * v, true)}$ nodes. With $b = ${b}$ that is depth ` +
      `$\\log_b(${sci(t * v, true)}) = ${num(d1, 3)}$ for **minimax**, $\\frac43$ of it (${num(d2, 3)}) for **alpha-beta in random order** and **twice** it (${num(d3, 3)}) ` +
      `for **alpha-beta with perfect ordering**: on the log scale the three costs are straight lines, and halving the exponent doubles the depth. ` +
      (b === 35 && t === 100 && v === 1e4 ? 'These are the slides\' numbers (p. 383): $10^6$ nodes per move reach **about depth 8** with alpha-beta. ' : '') +
      'Time is exponential, but the **memory** of the depth-first search is only $O(bh)$: one path plus the siblings along it.');
  }
  render();
  return { destroy() {} };
}

const CSS = `
.adk-grid{stroke:var(--border);stroke-dasharray:2 4}
.adk-box{fill:none;stroke:var(--border)}
.adk-budget{stroke:var(--warn);stroke-width:2;stroke-dasharray:6 4}
.adk-bt{font:600 11px var(--mono);fill:var(--warn)}
.adk-c{fill:none;stroke-width:2.5}
.adk-c.k0,.adk-dot.k0{stroke:var(--v-min)}
.adk-c.k1,.adk-dot.k1{stroke:var(--accent)}
.adk-c.k2,.adk-dot.k2{stroke:var(--ok)}
.adk-dot{fill:var(--panel);stroke-width:3}
.adk-drop{stroke:var(--border-strong);stroke-dasharray:3 3}
.adk-name{font-size:13px;font-weight:600}
.adk-name.k0{fill:var(--v-min)}
.adk-name.k1{fill:var(--accent)}
.adk-name.k2{fill:var(--ok)}
.adk-val{font:600 14px var(--mono);fill:var(--text)}
`;
