// The landscape of random 3-SAT (AIMA §7.6.3, Fig. 7.19): on demand, many random 3-CNFs per m/n are generated and solved by
// DPLL in rAF chunks; the probability of satisfiability falls around m/n ≈ 4.26 and DPLL's work peaks there.
import { bar, card, md, num, s, style, type FigOptions } from './shell';
import { dpll, random3 } from './logic-walksat';

const R0 = 1, R1 = 8, DR = 0.25, X0 = 64, Y0 = 34, W = 620, H = 200, BUDGET = 12;
const RATIOS = Array.from({ length: (R1 - R0) / DR + 1 }, (_, k) => R0 + k * DR);
const SIZES: [number, number][] = [[20, 200], [30, 100], [50, 40]]; // n, instances per m/n
const px = (r: number) => X0 + ((r - R0) / (R1 - R0)) * W;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lgh-css', CSS);
  const c = card(el, 'simulation', 'Random 3-SAT: satisfiable or not, and how hard for DPLL', '0 0 780 290');
  for (const v of [0, 0.5, 1]) {
    s(c.svg, 'line', { x1: X0, x2: X0 + W, y1: Y0 + H - v * H, y2: Y0 + H - v * H, class: 'lgh-grid' });
    s(c.svg, 'text', { x: X0 - 8, y: Y0 + H - v * H + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
  }
  for (let r = R0; r <= R1; r++) s(c.svg, 'text', { x: px(r), y: Y0 + H + 16, class: 'fg-m', 'text-anchor': 'middle' }, String(r));
  s(c.svg, 'text', { x: X0 + W, y: Y0 + H + 32, class: 'fg-m', 'text-anchor': 'end' }, 'clause/symbol ratio m/n');
  s(c.svg, 'text', { x: X0 - 50, y: Y0 - 14, class: 'lgh-pt' }, 'P(satisfiable)');
  const rt = [0, 1, 2].map(k => s(c.svg, 'text', { x: X0 + W + 8, y: Y0 + H - (k * H) / 2 + 4, class: 'lgh-wt' }));
  s(c.svg, 'text', { x: X0 + W + 30, y: Y0 - 14, class: 'lgh-wt', 'text-anchor': 'end' }, 'median DPLL calls');
  s(c.svg, 'line', { x1: px(4.26), x2: px(4.26), y1: Y0, y2: Y0 + H, class: 'lgh-th' });
  s(c.svg, 'text', { x: px(4.26), y: Y0 - 6, class: 'lgh-tht', 'text-anchor': 'middle' }, 'm/n = 4.26 (large n)');
  const half = s(c.svg, 'circle', { r: 5, class: 'lgh-half hide' });
  const pLine = s(c.svg, 'polyline', { class: 'lgh-p' }), wLine = s(c.svg, 'polyline', { class: 'lgh-w' });
  const pDots = RATIOS.map(() => s(c.svg, 'circle', { r: 3, class: 'lgh-pd hide' })), wDots = RATIOS.map(() => s(c.svg, 'circle', { r: 3, class: 'lgh-wd hide' }));
  const prog = s(c.svg, 'text', { x: X0 + 10, y: Y0 + H - 10, class: 'fg-m' });

  let [n, K] = SIZES[0], raf = 0, running = false, said = '';
  let res: { sat: number; calls: number[] }[] = [];
  const ctl = bar(c);
  const go = document.createElement('button');
  go.className = 'btn sm primary';
  go.onclick = () => (running ? stop() : start());
  const sel = document.createElement('select');
  sel.innerHTML = SIZES.map(([sn, k], i) => `<option value="${i}">n = ${sn} symbols, ${k} formulas per m/n</option>`).join('');
  sel.onchange = () => { stop(); [n, K] = SIZES[+sel.value]; res = []; render(); opts.onEvent?.(`[${c.title}] ${sel.selectedOptions[0].text}`); };
  ctl.append(go, sel);

  function start() {
    if (res.length === RATIOS.length && res[RATIOS.length - 1].calls.length === K) res = [];
    running = true;
    opts.onEvent?.(`[${c.title}] computing, n = ${n}`);
    const frame = () => {
      const t0 = performance.now();
      while (performance.now() - t0 < BUDGET) {
        let i = res.length - 1;
        if (i < 0 || res[i].calls.length === K) { if (++i === RATIOS.length) { running = false; break; } res.push({ sat: 0, calls: [] }); }
        const r = dpll(random3(n, Math.round(RATIOS[i] * n)), n);
        res[i].sat += +r.sat;
        res[i].calls.push(r.calls);
      }
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function stop() { running = false; cancelAnimationFrame(raf); render(); }

  const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };
  function render() {
    const full = res.filter(r => r.calls.length === K), P = full.map(r => r.sat / K), M = full.map(r => median(r.calls));
    const mmax = Math.max(10, ...M), top = Math.ceil(mmax / 10 ** Math.floor(Math.log10(mmax))) * 10 ** Math.floor(Math.log10(mmax));
    rt.forEach((t, k) => { t.textContent = full.length ? String((k * top) / 2) : ''; });
    pLine.setAttribute('points', P.map((v, i) => `${px(RATIOS[i])},${Y0 + H - v * H}`).join(' '));
    wLine.setAttribute('points', M.map((v, i) => `${px(RATIOS[i])},${Y0 + H - (v / top) * H}`).join(' '));
    RATIOS.forEach((r, i) => {
      pDots[i].classList.toggle('hide', i >= P.length);
      wDots[i].classList.toggle('hide', i >= M.length);
      if (i < P.length) { pDots[i].setAttribute('cx', String(px(r))); pDots[i].setAttribute('cy', String(Y0 + H - P[i] * H)); }
      if (i < M.length) { wDots[i].setAttribute('cx', String(px(r))); wDots[i].setAttribute('cy', String(Y0 + H - (M[i] / top) * H)); }
    });
    const j = P.findIndex(v => v < 0.5), cross = j > 0 ? RATIOS[j - 1] + (DR * (P[j - 1] - 0.5)) / (P[j - 1] - P[j]) : NaN;
    half.classList.toggle('hide', !(cross > 0));
    if (cross > 0) { half.setAttribute('cx', String(px(cross))); half.setAttribute('cy', String(Y0 + H / 2)); }
    const cur = res.length && res[res.length - 1].calls.length < K ? res.length - 1 : -1;
    prog.textContent = running && cur >= 0 ? `m/n = ${RATIOS[cur]}: ${res[cur].calls.length} of ${K} formulas solved` : '';
    go.textContent = running ? '⏸ Stop' : full.length === RATIOS.length ? '↺ Compute again' : full.length ? '⏵ Continue' : `⏵ Compute (${RATIOS.length * K} formulas)`;
    explain(full.length === RATIOS.length, P, M, cross);
  }

  function explain(done: boolean, P: number[], M: number[], cross: number) {
    const key = done ? `done${n}${res.map(r => r.sat).join()}` : running ? 'run' : P.length ? 'paused' : `idle${n}`;
    if (key === said) return;
    said = key;
    let text: string;
    if (!done && (running || P.length)) text = `Generating ${K} random 3-CNFs with $n = ${n}$ symbols for each $m/n$ from ${R0} to ${R1}, and running DPLL on each. ` +
      'Blue: the fraction that is satisfiable. Orange: the median number of DPLL calls (its work).';
    else if (!done) text = `Press **Compute**: for each ratio $m/n$ from ${R0} to ${R1} (step ${DR}) the figure generates ${K} random 3-CNFs with $n = ${n}$ symbols ` +
      `(each clause: 3 distinct symbols, each negated with probability ½) and decides each with DPLL, ${RATIOS.length * K} formulas in all.`;
    else {
      const k = M.indexOf(Math.max(...M)), lo = M[RATIOS.indexOf(2)], hi = M[M.length - 1];
      text = `**$n = ${n}$, ${K} formulas per ratio.** Below $m/n \\approx 3.5$ almost every formula is satisfiable (${P.slice(0, RATIOS.indexOf(3.5) + 1).every(v => v >= 0.9) ? 'at least 90%' : 'most'} of them), ` +
        `above 6 almost none (${num(P[RATIOS.indexOf(6)] * 100, 2)}% at 6). The fraction crosses **50% at $m/n \\approx ${num(cross, 3)}$**. ` +
        `DPLL's median work peaks at $m/n = ${RATIOS[k]}$ (**${M[k]} calls**, against ${lo} at 2 and ${hi} at 8)` +
        (Math.abs(RATIOS[k] - cross) <= 0.5 ? ': the hardest formulas sit at the threshold, where they are neither under-constrained (easy to satisfy) nor over-constrained (quickly refuted). ' : '. ') +
        (n < 50 ? `With so few symbols the drop is gradual${cross > 4.26 ? ' and the 50% point lies above 4.26' : ''}; as $n$ grows it sharpens around 4.26 (AIMA Fig. 7.19 uses $n = 50$). Try a larger $n$.`
          : 'This is the $n$ of AIMA Fig. 7.19: compare the steeper drop with $n = 20$.');
    }
    c.cap.innerHTML = md(text);
    if (done) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  render();
  return { destroy: stop };
}

const CSS = `
.lgh-grid{stroke:var(--border);stroke-dasharray:2 4}
.lgh-th{stroke:var(--muted);stroke-width:1.5;stroke-dasharray:6 4}
.lgh-tht{font:600 11px var(--mono);fill:var(--muted)}
.lgh-pt{font:600 12px var(--font);fill:var(--accent)}
.lgh-wt{font:600 11px var(--mono);fill:var(--warn)}
.lgh-p{fill:none;stroke:var(--accent);stroke-width:2.5;stroke-linejoin:round}
.lgh-w{fill:none;stroke:var(--warn);stroke-width:2.5;stroke-linejoin:round}
.lgh-pd{fill:var(--accent)}
.lgh-wd{fill:var(--warn)}
.lgh-half{fill:none;stroke:var(--accent);stroke-width:2}
`;
