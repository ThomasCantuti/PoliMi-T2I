// Alpha-beta with chance nodes (slides p. 398–399): a chance node can be cut off only with an upper bound on the utility.
// Drag the known maximum M: the bound after each leaf is Σ seen p·v + (1 − Σ seen p)·M, computed live.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const CH = [[3, 12, 9], [2, 4, 6], [0, 6, 15]], P = 1 / 3, LO = Math.max(...CH.flat());
const ROOT = [320, 40], CX = [130, 320, 510], CY = 130, LY = 216;

interface Trace { read: number; bounds: number[]; value: number | null; cut: number | null; alpha: number }

/** The root's alpha-beta loop over the chance nodes (children left to right), with the bound test after every leaf. */
function search(M: number) {
  let alpha = -Infinity, best = -1;
  const out = CH.map((leaves, j): Trace => {
    const t: Trace = { read: 0, bounds: [], value: null, cut: null, alpha };
    let sum = 0;
    for (const x of leaves) {
      sum += P * x;
      if (++t.read === leaves.length) break;
      const ub = sum + (1 - t.read * P) * M;
      t.bounds.push(ub);
      if (ub <= alpha) { t.cut = ub; break; }
    }
    if (t.cut === null) { t.value = sum; if (sum > alpha) { alpha = sum; best = j; } }
    return t;
  });
  return { out, v: alpha, best };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-adc-css', CSS);
  const c = card(el, 'interactive', 'Alpha-beta with chance nodes: pruning needs a bound on the utility', '0 0 640 300');
  const rootV = s(c.svg, 'text', { x: ROOT[0] + 28, y: ROOT[1] + 8, class: 'adc-v' });
  s(c.svg, 'path', { d: `M${ROOT[0]},${ROOT[1] - 17} L${ROOT[0] + 19},${ROOT[1] + 14} L${ROOT[0] - 19},${ROOT[1] + 14} Z`, class: 'adc-max' });
  const rootE = CX.map(x => s(c.svg, 'line', { x1: ROOT[0], y1: ROOT[1] + 14, x2: x, y2: CY - 22, class: 'fg-e' }));
  const nodes = CH.map((leaves, j) => {
    const x = CX[j];
    const leafs = leaves.map((v, k) => {
      const lx = x + (k - 1) * 58;
      const e = s(c.svg, 'line', { x1: x, y1: CY + 22, x2: lx, y2: LY - 16, class: 'fg-e' });
      const f = k === 1 ? 0.72 : 0.45; // the middle label lower down, so that the three do not touch
      s(c.svg, 'text', { x: x + (lx - x) * f + (k ? 6 : -6), y: CY + 22 + (LY - CY - 38) * f + 4, class: 'fg-m', 'text-anchor': k ? 'start' : 'end' }, '1/3');
      const g = s(c.svg, 'g', { class: 'adc-leaf' });
      s(g, 'rect', { x: lx - 20, y: LY - 16, width: 40, height: 30, rx: 6 });
      s(g, 'text', { x: lx, y: LY + 5 }, String(v));
      return { e, g };
    });
    s(c.svg, 'circle', { cx: x, cy: CY, r: 22, class: 'adc-ch' });
    const val = s(c.svg, 'text', { x, y: CY + 5, class: 'adc-cv' });
    const log = [0, 1].map(k => s(c.svg, 'text', { x, y: LY + 38 + k * 17, class: 'adc-log', 'text-anchor': 'middle' }));
    return { leafs, val, log };
  });

  let M = 15, unknown = false;
  const knobs = bar(c);
  const mIn = slider(knobs, 'max utility M', LO, 40, 1, M, v => { M = v; render(); });
  mIn.addEventListener('change', say);
  const un = document.createElement('label');
  un.className = 'fg-sl';
  un.innerHTML = '<input type="checkbox"> range unknown (M = ∞)';
  const box = un.querySelector('input')!;
  box.style.width = 'auto';
  box.onchange = () => { unknown = box.checked; mIn.disabled = unknown; render(); say(); };
  knobs.append(un);
  function say() { opts.onEvent?.(`[${c.title}] ${unknown ? 'range unknown' : `M = ${M}`}: ${c.cap.textContent}`); }

  // largest M that still prunes something, given α from the first chance node: Σ seen p·v + (1 − kP)·M ≤ α
  const a0 = CH[0].reduce((t, x) => t + P * x, 0);
  const mStar = Math.max(...CH.slice(1).flatMap(l => l.slice(0, -1).map((_, k) => (a0 - l.slice(0, k + 1).reduce((t, x) => t + P * x, 0)) / (1 - (k + 1) * P))));

  function render() {
    const m = unknown ? Infinity : M, { out, v, best } = search(m);
    out.forEach((t, j) => {
      const n = nodes[j];
      n.leafs.forEach((l, k) => { l.g.classList.toggle('cut', k >= t.read); l.e.classList.toggle('blk', k >= t.read); });
      n.val.textContent = t.value !== null ? num(t.value, 3) : `≤${num(t.cut!, 3)}`;
      n.val.classList.toggle('bnd', t.value === null);
      const steps = t.bounds.map((b, k) => `after ${CH[j].slice(0, k + 1).join(', ')}: ≤ ${b === Infinity ? '∞' : num(b, 3)}`);
      if (t.cut !== null) steps[steps.length - 1] += ' ≤ α: prune';
      if (j === 0) steps.splice(0, 2, 'all leaves read', `value ${num(t.value ?? 0, 3)} → α = ${num(t.value ?? 0, 3)}`);
      n.log.forEach((l, k) => { l.textContent = steps[k] ?? ''; l.classList.toggle('pr', t.cut !== null && k === steps.length - 1); });
      rootE[j].classList.toggle('act', j === best);
    });
    rootV.textContent = num(v, 3);
    const read = out.reduce((t, x) => t + x.read, 0);
    const fmtB = (j: number, k: number) => `\\frac{${CH[j].slice(0, k).join(' + ')} + ${3 - k === 1 ? '' : `${3 - k}\\cdot`}${unknown ? '\\infty' : M}}{3}`;
    const cuts = out.map((t, j) => (t.cut !== null ? `In chance node ${j + 1}, after ${CH[j].slice(0, t.read).join(' and ')}: $${fmtB(j, t.read)} = ${num(t.cut, 3)} \\le \\alpha = ${num(t.alpha, 3)}$, so ${CH[j].slice(t.read).join(' and ')} ${t.read === 2 ? 'is' : 'are'} pruned` : '')).filter(Boolean);
    c.cap.innerHTML = md(unknown
      ? `**Range unknown:** after any number of outcomes the unseen ones could be arbitrarily large, so every bound is $+\\infty$ and **nothing can be pruned**: all ${read} leaves are read. MAX still gets ${num(v, 3)}.`
      : `**Range $[0, ${M}]$.** The first chance node is worth ${num(a0, 3)}, so $\\alpha = ${num(a0, 3)}$. ` + (cuts.length ? cuts.join('. ') + '. ' : 'No bound ever drops to α: nothing is pruned. ') +
        `**${read} of 9 leaves** read, root value ${num(v, 3)}. ` + (M === 15 ? 'These are the slides\' ≤ 7 and ≤ 7 (p. 399). ' : '') +
        `The tighter the range, the earlier the cut: with this tree pruning stops once $M > ${num(mStar, 3)}$.`);
  }
  render();
  return { destroy() {} };
}

const CSS = `
.adc-max{fill:var(--panel-2);stroke:var(--v-max);stroke-width:2}
.adc-v{font:700 15px var(--mono);fill:var(--text)}
.adc-ch{fill:var(--panel-2);stroke:var(--v-chance);stroke-width:2}
.adc-cv{font:700 13px var(--mono);fill:var(--text);text-anchor:middle}
.adc-cv.bnd{fill:var(--warn)}
.adc-leaf rect{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5}
.adc-leaf text{font:700 14px var(--mono);fill:var(--text);text-anchor:middle}
.adc-leaf{transition:opacity .25s}
.adc-leaf.cut{opacity:.3}
.adc-leaf.cut rect{stroke-dasharray:4 3}
.adc-log{font:11px var(--mono);fill:var(--text-2)}
.adc-log.pr{fill:var(--bad);font-weight:600}
`;
