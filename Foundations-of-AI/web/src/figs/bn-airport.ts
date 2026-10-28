// Acting under uncertainty (AIMA §12.1, uncertainty.md): plan A_t = leave t minutes before the flight. The probability of
// making it only grows with t; the expected utility (probability + preferences) has a maximum. Travel time is an assumed model.
import { bar, card, label, md, num, s, slider, style, type FigOptions } from './shell';

const MEDIAN = 50, SIGMA = 0.3, DT = 0.5, TMAX = 3000; // assumed: door-to-gate time is lognormal, median 50 minutes
const LO = 15, HI = 1500;
const PX = [60, 450], PW = 290, PY = 34, PH = 190;

// cumulative sums over a grid of travel times: F(t) = P(T ≤ t), S(t) = Σ_{T ≤ t} T·f(T)
const F: number[] = [], S: number[] = [];
{
  let f = 0, sf = 0, z = 0;
  const dens = (x: number) => Math.exp(-((Math.log(x / MEDIAN)) ** 2) / (2 * SIGMA * SIGMA)) / x;
  for (let x = DT; x <= TMAX; x += DT) z += dens(x);
  for (let x = DT; x <= TMAX; x += DT) { f += dens(x) / z; sf += (x * dens(x)) / z; F.push(f); S.push(sf); }
}
const at = (t: number) => Math.min(F.length - 1, Math.max(0, Math.round(t / DT) - 1));
const pOn = (t: number) => F[at(t)];
const wait = (t: number) => t * F[at(t)] - S[at(t)]; // E[(t − T) when on time]
const eu = (t: number, M: number) => -wait(t) - M * (1 - pOn(t));
const sub = (n: number) => String(n).replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[+d]);
const lx = (t: number) => (Math.log10(t) - Math.log10(LO)) / (Math.log10(HI) - Math.log10(LO));

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-bn-airport-css', CSS);
  const c = card(el, 'interactive', 'Plan Aₜ: leave t minutes before the flight. Which t is rational?', '0 0 780 290');
  let t = 90, M = 600;
  const ticks = [15, 30, 60, 120, 240, 480, 1440];
  const plots = PX.map((x0, k) => {
    s(c.svg, 'rect', { x: x0, y: PY, width: PW, height: PH, class: 'ucf-plot' });
    label(c.svg, x0, PY - 12, k ? 'expected utility EU(A_{t}), in minutes of waiting' : 'P(make the flight | A_{t})', { class: 'fg-t' });
    for (const v of ticks) {
      s(c.svg, 'line', { x1: x0 + lx(v) * PW, x2: x0 + lx(v) * PW, y1: PY, y2: PY + PH, class: 'ucf-grid' });
      s(c.svg, 'text', { x: x0 + lx(v) * PW, y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'middle' }, String(v));
    }
    s(c.svg, 'text', { x: x0 + PW, y: PY + PH + 31, class: 'fg-m', 'text-anchor': 'end' }, 't (minutes, log scale)');
    return { x0, curve: s(c.svg, 'polyline', { class: 'ucf-curve' }), now: s(c.svg, 'line', { y1: PY, y2: PY + PH, class: 'ucf-now' }),
      dot: s(c.svg, 'circle', { r: 5, class: 'ucf-dot' }), lab: s(c.svg, 'text', { class: 'ucf-lab' }) };
  });
  for (const v of [0, 0.5, 1]) s(c.svg, 'text', { x: PX[0] - 6, y: PY + PH - v * PH + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
  const yT = [0, 1, 2].map(k => s(c.svg, 'text', { x: PX[1] - 6, y: PY + PH - (k / 2) * PH + 4, class: 'fg-m', 'text-anchor': 'end' }));
  const bestL = s(c.svg, 'line', { y1: PY, y2: PY + PH, class: 'ucf-bestl' });
  const best = s(c.svg, 'circle', { r: 6, class: 'ucf-best' }), bestT = s(c.svg, 'text', { y: PY + PH - 8, class: 'ucf-bestt' });
  plots.forEach(p => c.svg.append(p.lab)); // the value labels stay above the best-plan line

  const knobs = bar(c), pre = bar(c);
  const ti = slider(knobs, 'leave t min before', Math.log10(LO), Math.log10(HI), 0.005, Math.log10(t), v => { t = Math.round(10 ** v); render(); });
  const mi = slider(knobs, 'missing the flight costs (min of waiting)', 1.5, 4, 0.01, Math.log10(M), v => { M = Math.round(10 ** v); render(); });
  for (const inp of [ti, mi]) inp.addEventListener('change', () => tell());
  for (const v of [30, 90, 120, 1440]) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `A${sub(v)}`;
    b.onclick = () => { t = v; ti.value = String(Math.log10(v)); render(); tell(); };
    pre.append(b);
  }
  const tell = () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);

  function render() {
    ti.nextElementSibling!.textContent = String(t);
    mi.nextElementSibling!.textContent = String(M);
    let tb = LO;
    for (let x = LO; x <= HI; x++) if (eu(x, M) > eu(tb, M)) tb = x;
    const lo = Math.min(-M, eu(HI, M)) * 1.02, yv = [(v: number) => PY + PH - v * PH, (v: number) => PY + PH - ((v - lo) / -lo) * PH];
    const ts = Array.from({ length: 241 }, (_, k) => 10 ** (Math.log10(LO) + (k / 240) * (Math.log10(HI) - Math.log10(LO))));
    const val = [pOn, (x: number) => eu(x, M)];
    plots.forEach((p, k) => {
      p.curve.setAttribute('points', ts.map(x => `${p.x0 + lx(x) * PW},${yv[k](val[k](x))}`).join(' '));
      const x = p.x0 + lx(t) * PW, y = yv[k](val[k](t));
      for (const a of ['x1', 'x2']) p.now.setAttribute(a, String(x));
      p.dot.setAttribute('cx', String(x));
      p.dot.setAttribute('cy', String(y));
      p.lab.setAttribute('x', String(x + (lx(t) > 0.7 ? -8 : 8)));
      p.lab.setAttribute('y', String(Math.min(PY + PH - 8, Math.max(PY + 14, y + (k ? 18 : -10)))));
      p.lab.setAttribute('text-anchor', lx(t) > 0.7 ? 'end' : 'start');
      p.lab.textContent = k ? `EU = ${num(eu(t, M), 3)}` : `${num(pOn(t), 3)}`;
    });
    yT.forEach((e, k) => { e.textContent = num((lo * (2 - k)) / 2, 2); if (!k) e.setAttribute('y', String(PY + PH)); });
    best.setAttribute('cx', String(PX[1] + lx(tb) * PW));
    best.setAttribute('cy', String(yv[1](eu(tb, M))));
    for (const a of ['x1', 'x2']) bestL.setAttribute(a, String(PX[1] + lx(tb) * PW));
    bestT.setAttribute('x', String(PX[1] + lx(tb) * PW + (lx(tb) > 0.7 ? -6 : 6)));
    bestT.setAttribute('text-anchor', lx(tb) > 0.7 ? 'end' : 'start');
    bestT.textContent = `best: A${sub(tb)}`;
    const p1440 = pOn(1440), here = tb === t;
    c.cap.innerHTML = md(`**Plan $A_{${t}}$** makes the flight with probability **${num(pOn(t), 3)}** and, when it does, waits ${num(wait(t) / pOn(t), 3)} minutes on average. ` +
      `With a missed flight as bad as ${M} minutes of waiting, $EU(A_{${t}}) = -E[\\text{wait}] - ${M}\\,P(\\text{miss}) = ${num(eu(t, M), 3)}$; ` +
      (here ? 'this is the **best plan**: the rational choice. ' : `the best plan is **$A_{${tb}}$** (EU ${num(eu(tb, M), 3)}, P = ${num(pOn(tb), 3)}). `) +
      `$A_{1440}$ makes it with probability ${p1440 > 0.9999 ? 'practically 1' : num(p1440, 4)} but waits about ${Math.round(wait(1440) / p1440 / 60)} hours: the most likely plan to succeed is not the rational one. ` +
      'Make missing the flight more costly and the best $t$ moves right: decision theory = probability theory + utility theory. ' +
      `(Travel time is an assumed model: lognormal, median ${MEDIAN} minutes.)`);
  }
  render();
  return { destroy() {} };
}

const CSS = `
.ucf-plot{fill:var(--panel-2);stroke:var(--border)}
.ucf-grid{stroke:var(--border);stroke-dasharray:2 4}
.ucf-curve{fill:none;stroke:var(--accent);stroke-width:2.5}
.ucf-now{stroke:var(--warn);stroke-width:1.5;stroke-dasharray:5 4}
.ucf-dot{fill:var(--warn);stroke:var(--panel);stroke-width:2}
.ucf-lab{font:600 12px var(--mono);fill:var(--warn);paint-order:stroke;stroke:var(--panel-2);stroke-width:4px;stroke-linejoin:round}
.ucf-bestl{stroke:var(--ok);stroke-width:1.5;stroke-dasharray:3 3}
.ucf-best{fill:var(--ok);stroke:var(--panel);stroke-width:2}
.ucf-bestt{font:600 12px var(--mono);fill:var(--ok);paint-order:stroke;stroke:var(--panel-2);stroke-width:4px;stroke-linejoin:round}
`;
