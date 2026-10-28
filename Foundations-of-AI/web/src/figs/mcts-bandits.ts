// Greedy vs ε-greedy vs UCB on random k-armed Bernoulli bandits (slides p. 430–442), averaged over many runs. Simulation.
// Same rules as the bandit visualizer: Q starts at 0, sample averages, ties to the lowest arm, UCB tries every arm once first.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const T = 1000, RUNS = 2000, POL = ['greedy', 'ε-greedy', 'UCB'];
const P1 = { x: 56, y: 28, w: 300, h: 190 }, P2 = { x: 450, y: 28, w: 300, h: 190 };

interface Stats { opt: Float64Array[]; regret: Float64Array[]; reward: number[]; best: number; runs: number; lastArm1: number }

/** One run of the three policies on the same bandit and the same reward sequence of every arm. */
function runOnce(k: number, eps: number, c: number, st: Stats) {
  const mu = Array.from({ length: k }, Math.random), top = Math.max(...mu), star = mu.indexOf(top);
  const u = Array.from({ length: k }, () => Float64Array.from({ length: T }, Math.random)); // n-th reward of arm a: u[a][n] < μ(a)
  st.best += top * T;
  for (let p = 0; p < 3; p++) {
    const Q = new Float64Array(k), N = new Float64Array(k);
    let regret = 0;
    for (let t = 0; t < T; t++) {
      let a = 0;
      if (p === 2) { // UCB: argmax Q + c·√(ln t / N), untried arms first; t = pulls so far
        let bv = -Infinity;
        for (let i = 0; i < k; i++) { const v = N[i] ? Q[i] + c * Math.sqrt(Math.log(t) / N[i]) : Infinity; if (v > bv) { bv = v; a = i; } }
      } else if (p === 1 && Math.random() < eps) a = Math.floor(Math.random() * k);
      else for (let i = 1; i < k; i++) if (Q[i] > Q[a]) a = i;
      const r = u[a][N[a]] < mu[a] ? 1 : 0;
      N[a]++;
      Q[a] += (r - Q[a]) / N[a];
      regret += top - mu[a];
      st.reward[p] += r;
      if (a === star) st.opt[p][t]++;
      st.regret[p][t] += regret;
      if (p === 0 && t === T - 1 && a === 0) st.lastArm1++;
    }
  }
  st.runs++;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-mcb-css', CSS);
  const c = card(el, 'simulation', 'Greedy, ε-greedy and UCB on random bandits, averaged over many runs', '0 0 780 300');
  let k = 5, eps = 0.1, cc = 0.5, st: Stats, running = false, raf = 0, perFrame = 10, said = '';

  const axes = [P1, P2].map((P, j) => {
    s(c.svg, 'text', { x: P.x - 40, y: P.y - 12, class: 'fg-t' }, j ? 'Cumulative regret Σ (μ* − μ(aₜ))' : '% of runs that pull the best arm at step t');
    s(c.svg, 'rect', { x: P.x, y: P.y, width: P.w, height: P.h, class: 'mcb-box' });
    for (const t of [0, 250, 500, 750, 1000]) s(c.svg, 'text', { x: P.x + (t / T) * P.w, y: P.y + P.h + 15, class: 'fg-m', 'text-anchor': 'middle' }, String(t));
    s(c.svg, 'text', { x: P.x + P.w, y: P.y + P.h + 30, class: 'fg-m', 'text-anchor': 'end' }, 'step t');
    return { g: s(c.svg, 'g', {}), lines: POL.map((_, p) => s(c.svg, 'polyline', { class: `mcb-l k${p}` })) };
  });
  s(c.svg, 'text', { x: 16, y: 280, class: 'fg-m' }, 'reward earned / best possible:');
  const legend = POL.map((_, p) => s(c.svg, 'text', { x: 196 + p * 196, y: 280, class: `mcb-leg k${p}` }));

  const ctl = bar(c), knobs = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); clear(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="10">10 runs per frame</option><option value="50">50 runs per frame</option>';
  sp.onchange = () => { perFrame = +sp.value; };
  ctl.append(run, reset, sp);
  const knob = (name: string, min: number, max: number, step: number, v: number, set: (x: number) => void) => {
    const i = slider(knobs, name, min, max, step, v, x => { set(x); clear(); render(); });
    i.addEventListener('change', () => opts.onEvent?.(`[${c.title}] ${name} = ${i.value}: averages restarted`));
  };
  knob('arms k', 2, 10, 1, k, x => { k = x; });
  knob('ε', 0, 0.5, 0.01, eps, x => { eps = x; });
  knob('UCB c', 0, 2, 0.05, cc, x => { cc = x; });

  function clear() {
    st = { opt: POL.map(() => new Float64Array(T)), regret: POL.map(() => new Float64Array(T)), reward: [0, 0, 0], best: 0, runs: 0, lastArm1: 0 };
    said = '';
  }
  function play() {
    if (st.runs >= RUNS) clear();
    running = true;
    opts.onEvent?.(`[${c.title}] run: k = ${k}, ε = ${eps}, c = ${cc}`);
    const frame = () => {
      for (let r = perFrame; r > 0 && st.runs < RUNS; r--) runOnce(k, eps, cc, st);
      if (st.runs >= RUNS) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  const share = (p: number) => (st.best ? (100 * st.reward[p]) / st.best : 0);
  const optEnd = (p: number) => { let x = 0; for (let t = T - 100; t < T; t++) x += st.opt[p][t]; return st.runs ? x / st.runs : 0; }; // % over the last 100 steps
  function render() {
    // the regret axis fits ε-greedy and UCB; greedy (much larger) leaves the plot at the top, with a label
    const R = Math.max(1, st.runs), top = Math.ceil((1.25 * Math.max(8, st.regret[1][T - 1] / R, st.regret[2][T - 1] / R)) / 20) * 20;
    [P1, P2].forEach((P, j) => {
      const g = axes[j].g, max = j ? top : 100;
      g.replaceChildren();
      for (let q = 0; q <= 4; q++) {
        const y = P.y + P.h - (q / 4) * P.h;
        s(g, 'line', { x1: P.x, x2: P.x + P.w, y1: y, y2: y, class: 'mcb-grid' });
        s(g, 'text', { x: P.x - 6, y: y + 4, class: 'fg-m', 'text-anchor': 'end' }, `${num((q / 4) * max, 3)}${j ? '' : '%'}`);
      }
      if (!j) { const y = P.y + P.h - (100 / k / 100) * P.h; s(g, 'line', { x1: P.x, x2: P.x + P.w, y1: y, y2: y, class: 'mcb-ref' }); s(g, 'text', { x: P.x + P.w - 4, y: y - 4, class: 'mcb-reft', 'text-anchor': 'end' }, `random: 1/k = ${num(100 / k, 3)}%`); }
      POL.forEach((_, p) => {
        let pts = '';
        if (st.runs) for (let t = 0; t < T; t += 5) { // the % curve averages 5 steps
          let v = st.regret[p][t] / R;
          if (!j) { v = 0; for (let d = 0; d < 5; d++) v += st.opt[p][t + d]; v = (100 * v) / 5 / R; }
          pts += `${P.x + (t / T) * P.w},${P.y + P.h - (Math.min(v, max) / max) * P.h} `;
          if (v > max) { s(g, 'text', { x: P.x + (t / T) * P.w + 6, y: P.y + 14, class: `mcb-leg k${p}` }, `${POL[p]} ↑ ${num(st.regret[p][T - 1] / R, 3)} at t = ${T}`); break; }
        }
        axes[j].lines[p].setAttribute('points', pts);
      });
    });
    legend.forEach((l, p) => { l.textContent = `${POL[p]}${p === 1 ? ` (ε = ${eps})` : p === 2 ? ` (c = ${cc})` : ''}  ${st.runs ? `${num(share(p), 3)}%` : '–'}`; });
    run.textContent = running ? '⏸ Pause' : st.runs >= RUNS ? '⏵ Run again' : st.runs ? `⏵ Continue (${st.runs}/${RUNS})` : '⏵ Run 2000 bandits';
    explain();
  }

  function explain() {
    const done = st.runs >= RUNS, best = [0, 1, 2].reduce((a, b) => (share(b) > share(a) ? b : a));
    const [key, text] = !st.runs
      ? ['idle', `Each run draws a new **${k}-armed bandit**: arm $a$ pays 1 with a hidden probability $\\mu(a)$ uniform in $[0, 1]$. The three policies play ${T} steps on the **same** bandit and see the same rewards. ` +
        `Press **Run**: the curves average ${RUNS} runs.`]
      : !done
      ? ['run', 'The curves are averages over the runs so far, so they get smoother as runs accumulate. **Left:** how often each policy pulls the best arm. **Right:** the expected reward lost so far.']
      : [`done${k}${eps}${cc}`, `**${RUNS} runs:** greedy earns **${num(share(0), 3)}%** of the best possible reward, ε-greedy **${num(share(1), 3)}%**, UCB **${num(share(2), 3)}%**. ` +
        `**Greedy** never leaves arm 1 (${num((100 * st.lastArm1) / st.runs, 3)}% of the runs end there): its $Q \\ge 0$ and every untried arm keeps $Q = 0$, with ties to the lowest arm. So it is right only when arm 1 happens to be the best, about $1/k$ of the time. ` +
        `**ε-greedy** finds the best arm but keeps exploring blindly: ${num(optEnd(1), 3)}% best-arm pulls in the last 100 steps, its regret grows **linearly**. ` +
        `**UCB** explores where the bound is still high: ${num(optEnd(2), 3)}% at the end, and its regret curve **flattens** (it grows like $\\ln t$). ` +
        (best !== 2 ? `With these settings ${POL[best]} wins: try c = 0.5 or a smaller ε.` : 'Drag c: too small and UCB gets greedy, too large and it explores like random.')];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key.startsWith('done')) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  clear();
  render();
  return { destroy: pause };
}

const CSS = `
.mcb-box{fill:var(--panel-2);stroke:var(--border)}
.mcb-grid{stroke:var(--border);stroke-dasharray:2 4}
.mcb-ref{stroke:var(--muted);stroke-dasharray:5 4}
.mcb-reft{font:11px var(--mono);fill:var(--muted)}
.mcb-l{fill:none;stroke-width:2}
.mcb-l.k0{stroke:var(--v-min)}
.mcb-l.k1{stroke:var(--accent)}
.mcb-l.k2{stroke:var(--ok)}
.mcb-leg{font-size:12.5px;font-weight:600}
.mcb-leg.k0{fill:var(--v-min)}
.mcb-leg.k1{fill:var(--accent)}
.mcb-leg.k2{fill:var(--ok)}
`;
