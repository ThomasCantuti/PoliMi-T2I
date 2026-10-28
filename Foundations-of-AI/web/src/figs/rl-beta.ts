// The learning rate β (RL p. 36–37): one entry of the exam grid, Q((2,3), S) into G (exam 30 Aug 2022), updated once per episode.
// Each update closes the fraction β of the gap to the new estimate r = 1; every β < 1 heads to the same limit.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const K = 25, TARGET = 1, LX = 34, LW = 290, LY = 118, PX = 400, PY = 30, PW = 350, PH = 180;
const BETAS: [number, string][] = [[0.2, 'exams 2026'], [0.25, 'exams 2022–23'], [0.9, 'tic-tac-toe runs'], [1, '']];

/** Q after each of K episodes, applying Q ← Q + β(r − Q) (into the goal: no discounted term). */
function series(beta: number) {
  const q = [0];
  for (let k = 1; k <= K; k++) q.push(q[k - 1] + beta * (TARGET - q[k - 1]));
  return q;
}
{
  const q = series(0.25);
  if (q[1] !== 0.25 || q[2] !== 0.4375) console.error(`rl-beta: ${q[1]}, ${q[2]}; the exam says 0.25, 0.4375`);
  if (q.some((v, k) => Math.abs(v - (1 - 0.75 ** k)) > 1e-12)) console.error('rl-beta: the series differs from 1 − (1 − β)^k');
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rlc-css', CSS);
  const c = card(el, 'interactive', 'The learning rate β: how far one update moves the estimate', '0 0 780 260');
  let beta = 0.25, k = 2;
  const lx = (v: number) => LX + v * LW;

  // number line for episode k: old value, new estimate, updated value
  const epT = s(c.svg, 'text', { x: LX, y: 40, class: 'fg-h2' });
  s(c.svg, 'line', { x1: lx(0), x2: lx(1), y1: LY, y2: LY, class: 'rlc-axis' });
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    s(c.svg, 'line', { x1: lx(v), x2: lx(v), y1: LY - 4, y2: LY + 4, class: 'rlc-axis' });
    s(c.svg, 'text', { x: lx(v), y: LY + 18, class: 'fg-m', 'text-anchor': 'middle' }, String(v));
  }
  const gap = s(c.svg, 'line', { y1: LY - 26, y2: LY - 26, class: 'rlc-gap' });
  const step = s(c.svg, 'line', { y1: LY - 26, y2: LY - 26, class: 'rlc-step' });
  const gapT = s(c.svg, 'text', { y: LY - 34, class: 'rlc-gt' });
  const old = s(c.svg, 'circle', { cy: LY, r: 7, class: 'rlc-old' });
  const nu = s(c.svg, 'circle', { cy: LY, r: 7, class: 'rlc-new' });
  s(c.svg, 'rect', { x: lx(1) - 6, y: LY - 6, width: 12, height: 12, transform: `rotate(45 ${lx(1)} ${LY})`, class: 'rlc-tgt' });
  [['rlc-old', 'old Q'], ['rlc-new', 'updated Q'], ['rlc-tgt', 'new estimate r = 1']].forEach(([cl, t], i) => {
    s(c.svg, 'circle', { cx: LX + 6 + i * 100, cy: LY + 44, r: 5, class: cl });
    s(c.svg, 'text', { x: LX + 16 + i * 100, y: LY + 48, class: 'fg-m' }, t);
  });
  const rule = s(c.svg, 'text', { x: LX, y: LY + 82, class: 'rlc-rule' });

  // plot: Q after k episodes, for this β and for the exams' β = 0.25
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'rlc-plot' });
  const px = (e: number) => PX + (e / K) * PW, py = (v: number) => PY + PH - v * PH;
  for (const v of [0, 0.5, 1]) s(c.svg, 'text', { x: PX - 6, y: py(v) + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
  for (const e of [0, 5, 10, 15, 20, 25]) s(c.svg, 'text', { x: px(e), y: PY + PH + 16, class: 'fg-m', 'text-anchor': 'middle' }, String(e));
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 32, class: 'fg-m', 'text-anchor': 'end' }, 'episode');
  s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: py(1), y2: py(1), class: 'rlc-lim' });
  s(c.svg, 'text', { x: PX + PW - 6, y: PY + PH - 8, class: 'rlc-limt', 'text-anchor': 'end' }, 'dashed: the limit, 1');
  const ref = s(c.svg, 'polyline', { class: 'rlc-ref' }), cur = s(c.svg, 'polyline', { class: 'rlc-cur' });
  const dots = Array.from({ length: K + 1 }, (_, e) => {
    const d = s(c.svg, 'circle', { r: 4.5, class: 'rlc-dot' });
    d.onclick = () => { if (e) { k = e; render(); } };
    return d;
  });
  s(c.svg, 'text', { x: PX, y: PY - 10, class: 'fg-t' }, 'Q((2,3), S) after k episodes (click a point)');
  const refT = s(c.svg, 'text', { class: 'rlc-reft' });

  const knobs = bar(c);
  const inp = slider(knobs, 'β', 0.05, 1, 0.05, beta, v => { beta = v; render(); });
  inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] β = ${beta}: ${c.cap.textContent}`));
  for (const [v, why] of BETAS) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `β = ${v}${why ? ` (${why})` : ''}`;
    b.onclick = () => { inp.value = String(v); inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change')); };
    knobs.append(b);
  }

  function render() {
    const q = series(beta), r25 = series(0.25), a = q[k - 1], b = q[k];
    epT.textContent = `Episode ${k}: the update into G`;
    old.setAttribute('cx', String(lx(a)));
    nu.setAttribute('cx', String(lx(b)));
    for (const [e, x1, x2] of [[gap, a, TARGET], [step, a, b]] as const) { e.setAttribute('x1', String(lx(x1))); e.setAttribute('x2', String(lx(x2))); }
    gapT.setAttribute('x', String(lx((a + b) / 2)));
    gapT.textContent = `β · gap = ${num(beta)} · ${num(TARGET - a, 4)}`;
    rule.textContent = `Q ← ${num(a, 4)} + ${num(beta)}·(1 − ${num(a, 4)}) = ${num(b, 4)}`;
    const pts = (v: number[]) => v.map((y, e) => `${px(e)},${py(y)}`).join(' ');
    cur.setAttribute('points', pts(q));
    ref.setAttribute('points', pts(r25));
    ref.classList.toggle('hide', beta === 0.25);
    refT.classList.toggle('hide', beta === 0.25);
    refT.setAttribute('x', String(px(6) + 4));
    refT.setAttribute('y', String(py(r25[6]) + 16));
    refT.textContent = 'β = 0.25';
    dots.forEach((d, e) => {
      d.setAttribute('cx', String(px(e)));
      d.setAttribute('cy', String(py(q[e])));
      d.classList.toggle('now', e === k || e === k - 1);
    });
    const near = q.findIndex(v => TARGET - v < 0.01);
    c.cap.innerHTML = md(`**$Q \\leftarrow Q + \\beta\\,(\\text{new estimate} - Q)$**: each update closes the fraction $\\beta = ${beta}$ of the gap. ` +
      `Into G the new estimate is just $r = 1$, so after $k$ episodes $Q = 1 - (1 - \\beta)^k$: ${q.slice(1, 4).map(v => num(v, 4)).join(', ')}, … ` +
      (beta === 1 ? 'With $\\beta = 1$ the old value is thrown away: $Q$ jumps to the newest estimate. That is fine in a deterministic grid, but with random outcomes it would keep only the last sample. '
        : `It is within 1% of the limit after **${near < 0 ? `more than ${K}` : near}** episodes. `) +
      'Every $\\beta$ heads to the **same** limit, 1: $\\beta$ sets the speed, the rewards and $\\gamma$ set the converged value, which is why $\\beta$ never appears in the converged-values exercises.');
  }
  render();
  return { destroy() {} };
}

const CSS = `
.rlc-axis{stroke:var(--border-strong);stroke-width:1.5}
.rlc-gap{stroke:var(--border-strong);stroke-width:6;stroke-linecap:round;opacity:.6}
.rlc-step{stroke:var(--accent);stroke-width:6;stroke-linecap:round;transition:x1 .3s,x2 .3s}
.rlc-gt{font:600 11px var(--mono);fill:var(--accent);text-anchor:middle}
.rlc-old{fill:var(--muted);stroke:var(--panel);stroke-width:2;transition:cx .3s}
.rlc-new{fill:var(--accent);stroke:var(--panel);stroke-width:2;transition:cx .3s}
.rlc-tgt{fill:var(--ok)}
.rlc-rule{font:600 13px var(--mono);fill:var(--text)}
.rlc-plot{fill:var(--panel-2);stroke:var(--border)}
.rlc-lim{stroke:var(--ok);stroke-width:1.5;stroke-dasharray:6 4}
.rlc-limt{font:600 11px var(--mono);fill:var(--ok)}
.rlc-ref{fill:none;stroke:var(--muted);stroke-width:1.5;stroke-dasharray:3 3}
.rlc-reft{font:11px var(--mono);fill:var(--muted)}
.rlc-cur{fill:none;stroke:var(--accent);stroke-width:2.5}
.rlc-dot{fill:var(--panel);stroke:var(--accent);stroke-width:2;cursor:pointer}
.rlc-dot.now{fill:var(--accent)}
`;
