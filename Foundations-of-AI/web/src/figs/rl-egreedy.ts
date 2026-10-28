// ε-greedy (RL p. 22–26): the agent picks actions again and again from one Q row; the histogram converges to π(s, a).
// The Q row is the converged one of cell (1,10) on the slides' empty 10×10 grid (RL p. 40–48, γ = 0.95, reward 1 into G).
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const N = 10, GAMMA = 0.95, ROW = 1, COL = 10, ACTS: [string, number, number][] = [['↑', -1, 0], ['→', 0, 1], ['↓', 1, 0], ['←', 0, -1]];
const X0 = 300, Y0 = 34, H = 200, BW = 90, GAP = 22;

/** Converged goal-reward value of the action-value function on the empty grid; a move into the edge leaves the agent in place. */
function q(r: number, c: number, dr: number, dc: number) {
  const nr = Math.min(N, Math.max(1, r + dr)), nc = Math.min(N, Math.max(1, c + dc)), d = 2 * N - nr - nc; // moves left to G
  return d === 0 ? 1 : GAMMA ** d; // V(s') = γ^(d−1), so Q = 0 + γ V(s') = γ^d
}
const Q = ACTS.map(([, dr, dc]) => q(ROW, COL, dr, dc)), GREEDY = Q.indexOf(Math.max(...Q));
if (num(q(1, 2, 0, 1), 3) !== '0.44' || num(q(2, 2, 0, 1), 3) !== '0.463') console.error('rl-egreedy: Q differs from the slides\' table (RL p. 48)');

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rle-css', CSS);
  const c = card(el, 'simulation', 'ε-greedy: how often each action is picked', '0 0 780 300');
  let eps = 0.1, speed = 'watch', running = false, raf = 0, last = 0, said = '';
  const greedyN = [0, 0, 0, 0], randomN = [0, 0, 0, 0];
  let lastPick = -1, lastRandom = false, conv = false;

  // left: the state and its Q row; arrow width = probability of the action
  const cx = 140, cy = 140;
  s(c.svg, 'rect', { x: cx - 34, y: cy - 34, width: 68, height: 68, rx: 8, class: 'rle-s' });
  s(c.svg, 'text', { x: cx, y: cy + 5, class: 'rle-st' }, `(${ROW},${COL})`);
  s(c.svg, 'text', { x: 18, y: 24, class: 'fg-t' }, `cell (${ROW},${COL}) of the 10×10 grid, γ = ${GAMMA}`);
  const arrows = ACTS.map(([, dr, dc]) => s(c.svg, 'line', { x1: cx + dc * 40, y1: cy + dr * 40, x2: cx + dc * 76, y2: cy + dr * 76, class: 'rle-ar' }));
  ACTS.forEach(([g, dr, dc], a) => s(c.svg, 'text', { x: cx + dc * 74, y: dr ? cy + dr * 92 + 5 : cy - 14, class: `rle-q ${a === GREEDY ? 'g' : ''}` }, `${g} ${num(Q[a], 3)}`));

  // right: frequencies (stacked: picked by the greedy branch / by the random branch) and π(s, a) as dashed marks
  for (const v of [0, 0.5, 1]) {
    s(c.svg, 'line', { x1: X0 - 6, x2: X0 + 4 * (BW + GAP), y1: Y0 + H - v * H, y2: Y0 + H - v * H, class: 'rle-grid' });
    s(c.svg, 'text', { x: X0 - 10, y: Y0 + H - v * H + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
  }
  const bx = (a: number) => X0 + a * (BW + GAP);
  const gBar = ACTS.map((_, a) => s(c.svg, 'rect', { x: bx(a), width: BW, class: 'rle-g' }));
  const rBar = ACTS.map((_, a) => s(c.svg, 'rect', { x: bx(a), width: BW, class: 'rle-r' }));
  const mark = ACTS.map((_, a) => s(c.svg, 'line', { x1: bx(a) - 4, x2: bx(a) + BW + 4, class: 'rle-pi' }));
  const piT = ACTS.map((_, a) => s(c.svg, 'text', { x: bx(a) + BW / 2, class: 'rle-pit' }));
  const fT = ACTS.map((_, a) => s(c.svg, 'text', { x: bx(a) + BW / 2, y: Y0 + H + 34, class: 'fg-m', 'text-anchor': 'middle' }));
  ACTS.forEach(([g], a) => s(c.svg, 'text', { x: bx(a) + BW / 2, y: Y0 + H + 18, class: `rle-q ${a === GREEDY ? 'g' : ''}` }, g));
  s(c.svg, 'rect', { x: X0, y: Y0 + H + 46, width: 12, height: 10, class: 'rle-g' });
  s(c.svg, 'text', { x: X0 + 18, y: Y0 + H + 55, class: 'fg-m' }, 'picked as the greedy action');
  s(c.svg, 'rect', { x: X0 + 190, y: Y0 + H + 46, width: 12, height: 10, class: 'rle-r' });
  s(c.svg, 'text', { x: X0 + 208, y: Y0 + H + 55, class: 'fg-m' }, 'picked by the random draw');
  s(c.svg, 'line', { x1: X0 + 370, x2: X0 + 392, y1: Y0 + H + 51, y2: Y0 + H + 51, class: 'rle-pi' });
  s(c.svg, 'text', { x: X0 + 398, y: Y0 + H + 55, class: 'fg-m' }, 'π(s, a)');
  const tot = s(c.svg, 'text', { x: 18, y: 284, class: 'fg-t' });

  const ctl = bar(c), knobs = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset counts';
  reset.onclick = () => { clear(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">4 picks per second</option><option value="fast">50 picks per frame</option>';
  sp.onchange = () => { speed = sp.value; };
  ctl.append(run, reset, sp);
  const inp = slider(knobs, 'ε', 0, 1, 0.05, eps, v => { eps = v; clear(); render(); });
  inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] ε = ${eps}`));
  for (const [v, name] of [[0, 'greedy'], [0.1, 'ε = 0.1'], [0.5, 'ε = 0.5'], [1, 'random']] as const) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = name;
    b.onclick = () => { inp.value = String(v); inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change')); };
    knobs.append(b);
  }

  const pi = (a: number) => (a === GREEDY ? 1 - eps : 0) + eps / ACTS.length;
  function pick() {
    lastRandom = Math.random() < eps;
    lastPick = lastRandom ? Math.floor(Math.random() * ACTS.length) : GREEDY;
    (lastRandom ? randomN : greedyN)[lastPick]++;
  }
  function clear() { greedyN.fill(0); randomN.fill(0); lastPick = -1; conv = false; }
  function play() {
    running = true;
    const frame = (now: number) => {
      if (speed === 'fast') for (let k = 0; k < 50; k++) pick();
      else if (now - last > 250) { last = now; pick(); }
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const n = greedyN.reduce((x, y) => x + y, 0) + randomN.reduce((x, y) => x + y, 0), y = (v: number) => Y0 + H - v * H;
    ACTS.forEach((_, a) => {
      const g = n ? greedyN[a] / n : 0, r = n ? randomN[a] / n : 0;
      gBar[a].setAttribute('y', String(y(g)));
      gBar[a].setAttribute('height', String(g * H));
      rBar[a].setAttribute('y', String(y(g + r)));
      rBar[a].setAttribute('height', String(r * H));
      for (const k of ['y1', 'y2']) mark[a].setAttribute(k, String(y(pi(a))));
      piT[a].setAttribute('y', String(y(pi(a)) - 6));
      piT[a].textContent = num(pi(a), 3);
      fT[a].textContent = n ? `${greedyN[a] + randomN[a]} picks` : '';
      arrows[a].style.strokeWidth = String(2 + 14 * pi(a));
      arrows[a].classList.toggle('now', a === lastPick);
    });
    tot.textContent = n ? `${n} picks · last: ${ACTS[lastPick][0]} ${lastRandom ? '(random draw)' : '(greedy)'}` : '';
    run.textContent = running ? '⏸ Pause' : n ? '⏵ Continue' : '⏵ Pick actions';
    explain(n);
  }

  function explain(n: number) {
    const err = n ? Math.max(...ACTS.map((_, a) => Math.abs((greedyN[a] + randomN[a]) / n - pi(a)))) : 1;
    const g = ACTS[GREEDY][0], k = ACTS.length;
    conv ||= n >= 200 && err < 0.01; // once the bars are within a point, the caption stays there
    const stage = eps === 0 ? 'greedy' : eps === 1 ? 'random' : conv ? 'conv' : n < 200 ? 'few' : 'many';
    const head = eps === 0
      ? `**Greedy** ($\\varepsilon = 0$): always ${g}, the action with the largest $Q$. ${ACTS.filter((_, a) => a !== GREEDY).map(([d]) => d).join(' ')} are never tried again, so their estimates never change: if one of them were better, the agent would never find out.`
      : eps === 1
      ? `**$\\varepsilon = 1$: a random policy.** Every action has probability $1/${k} = ${num(1 / k)}$; the $Q$ values are ignored.`
      : `**$\\varepsilon$-greedy, $\\varepsilon = ${eps}$.** With probability $1 - \\varepsilon$ the greedy action ${g}; with probability $\\varepsilon$ a random one of the ${k}, **including** ${g}. ` +
        `So $\\pi(s, ${g}) = 1 - \\varepsilon + \\varepsilon/${k} = ${num(pi(GREEDY), 4)}$ and every other action gets $\\varepsilon/${k} = ${num(eps / k, 4)}$; the four probabilities sum to 1 (a stochastic policy, RL p. 23).`;
    const tail = stage === 'few' ? ' Press **Pick actions**: with few picks the bars are still far from the dashed marks.'
      : stage === 'many' ? ' The bars approach the dashed marks as the picks add up.'
      : stage === 'conv' ? ` After ${n} picks every bar is within 1 point of $\\pi(s, a)$. The green part of ${g} is the greedy branch, the orange parts are the random draws, which also land on ${g} one time in ${k}.`
      : '';
    const key = `${eps}${stage}`;
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(head + tail);
    if (stage === 'conv') opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  render();
  return { destroy: pause };
}

const CSS = `
.rle-s{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2}
.rle-st{font:600 13px var(--mono);fill:var(--text);text-anchor:middle}
.rle-ar{stroke:var(--v-edge);stroke-linecap:round;transition:stroke-width .3s,stroke .15s}
.rle-ar.now{stroke:var(--accent)}
.rle-q{font:600 12.5px var(--mono);fill:var(--text-2);text-anchor:middle}
.rle-q.g{fill:var(--ok)}
.rle-grid{stroke:var(--border);stroke-dasharray:2 4}
.rle-g{fill:var(--ok);opacity:.8}
.rle-r{fill:var(--warn);opacity:.8}
.rle-pi{stroke:var(--text);stroke-width:2;stroke-dasharray:5 3}
.rle-pit{font:600 11px var(--mono);fill:var(--text);text-anchor:middle}
`;
