// Search vs learning on the 10×10 grid (RL p. 39–53): Q-learning runs live, episode after episode, next to A* on the same grid.
// Same setting as the slides' Q-table: reward 1 into G and 0 otherwise, γ = 0.95, a move into a wall or the edge leaves the agent in place.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const N = 10, C = 34, X0 = 16, Y0 = 16, CAP = 1000, WINDOW = 100, S0 = 0, GOAL = N * N - 1;
const MOVES: [number, number, string][] = [[-1, 0, '↑'], [0, 1, '→'], [1, 0, '↓'], [0, -1, '←']];
const MAZES: [string, string[]][] = [
  ['empty 10×10 (RL p. 40)', Array<string>(N).fill('.'.repeat(N))],
  ["the slides' maze (RL p. 50)", ['......#...', '......#...', '......##..', '#####.....', '....#.....', '..........', '.....#####', '.....#....', '..........', '..........']],
];
const PX = 430, PY = 40, PW = 330, PH = 160; // the plot of steps per episode

const move = (i: number, a: number, wall: boolean[]) => {
  const r = Math.floor(i / N) + MOVES[a][0], c = (i % N) + MOVES[a][1], j = r * N + c;
  return r < 0 || r >= N || c < 0 || c >= N || wall[j] ? i : j;
};

/** A* with the Manhattan distance; returns the path from S0 to GOAL and the number of expanded nodes, or null. */
export function astar(wall: boolean[]): { path: number[]; expanded: number } | null {
  const h = (i: number) => N - 1 - Math.floor(i / N) + N - 1 - (i % N);
  const g = new Map([[S0, 0]]), parent = new Map<number, number>(), closed = new Set<number>(), open = [S0];
  while (open.length) {
    open.sort((a, b) => g.get(a)! + h(a) - g.get(b)! - h(b) || h(a) - h(b));
    const n = open.shift()!;
    if (n === GOAL) {
      const path = [n];
      while (path[0] !== S0) path.unshift(parent.get(path[0])!);
      return { path, expanded: closed.size };
    }
    closed.add(n);
    for (let a = 0; a < 4; a++) {
      const m = move(n, a, wall), gm = g.get(n)! + 1;
      if (m === n || closed.has(m) || gm >= (g.get(m) ?? Infinity)) continue;
      g.set(m, gm);
      parent.set(m, n);
      if (!open.includes(m)) open.push(m);
    }
  }
  return null;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-nv-css', CSS);
  const c = card(el, 'simulation', 'Search vs learning: Q-learning learns the grid while A* plans one path', '0 0 780 384');
  let gamma = 0.95, beta = 0.25, eps = 0.1, speed = 'watch', wall: boolean[] = [], plan = astar([]);
  const Q = new Float64Array(N * N * 4), seen = new Uint8Array(N * N), steps: number[] = [], avg: number[] = [];
  let pos = S0, t = 0, running = false, raf = 0, changedAt = 0, said = '';

  const qmax = (i: number) => Math.max(Q[i * 4], Q[i * 4 + 1], Q[i * 4 + 2], Q[i * 4 + 3]);
  const best = (i: number) => {
    const m = qmax(i), ties = [0, 1, 2, 3].filter(a => Q[i * 4 + a] === m);
    return ties[Math.floor(Math.random() * ties.length)];
  };
  function step() {
    const a = Math.random() < eps ? Math.floor(Math.random() * 4) : best(pos), next = move(pos, a, wall);
    const r = next === GOAL ? 1 : 0, future = next === GOAL ? 0 : qmax(next); // into the goal: no discounted term
    Q[pos * 4 + a] += beta * (r + gamma * future - Q[pos * 4 + a]);
    pos = next;
    seen[pos] = 1;
    if (++t < CAP && pos !== GOAL) return;
    steps.push(t);
    const w = steps.slice(-WINDOW);
    avg.push(w.reduce((x, y) => x + y) / w.length);
    pos = S0;
    t = 0;
    seen.fill(0);
    if (steps.length % 1000 === 0) pause();
  }

  // grid: free cells, the value heat map, this episode's trail, the greedy arrow, then the A* path and the agent on top
  const heat: SVGRectElement[] = [], trail: SVGRectElement[] = [], pol: SVGTextElement[] = [], cell: SVGRectElement[] = [];
  for (let i = 0; i < N * N; i++) {
    const x = X0 + (i % N) * C, y = Y0 + Math.floor(i / N) * C;
    cell.push(s(c.svg, 'rect', { x, y, width: C, height: C, class: 'nv-cell' }));
    heat.push(s(c.svg, 'rect', { x: x + 1, y: y + 1, width: C - 2, height: C - 2, class: 'nv-heat' }));
    trail.push(s(c.svg, 'rect', { x: x + 1, y: y + 1, width: C - 2, height: C - 2, class: 'nv-trail' }));
    pol.push(s(c.svg, 'text', { x: x + C / 2, y: y + C / 2 + 6, class: 'nv-pol' }));
    cell[i].onclick = () => toggleWall(i); // the layers above let clicks through
  }
  s(c.svg, 'text', { x: X0 + 5, y: Y0 + 13, class: 'nv-tag' }, 'S');
  s(c.svg, 'text', { x: X0 + N * C - 5, y: Y0 + N * C - 6, class: 'nv-tag', 'text-anchor': 'end' }, 'G');
  const path = s(c.svg, 'polyline', { class: 'nv-path' });
  const agent = s(c.svg, 'circle', { r: 9, class: 'nv-agent' });
  s(c.svg, 'text', { x: X0, y: Y0 + N * C + 20, class: 'fg-m' }, 'Click a cell to add or remove a wall.');

  // plot: steps per episode, log scale (the drop and the last few steps above the optimum both stay visible)
  s(c.svg, 'text', { x: PX - 46, y: PY - 16, class: 'fg-t' }, 'Steps per episode (log scale)');
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'nv-plot' });
  const ly = (v: number) => PY + PH - ((Math.log10(Math.min(CAP, Math.max(10, v))) - 1) / 2) * PH;
  for (const v of [10, 100, 1000]) {
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: ly(v), y2: ly(v), class: 'nv-grid' });
    s(c.svg, 'text', { x: PX - 6, y: ly(v) + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
  }
  const xt = [0, 1, 2].map(k => s(c.svg, 'text', { x: PX + (k * PW) / 2, y: PY + PH + 16, class: 'fg-m', 'text-anchor': 'middle' }));
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 32, class: 'fg-m', 'text-anchor': 'end' }, 'episode');
  const opt = s(c.svg, 'line', { x1: PX, x2: PX + PW, class: 'nv-opt' });
  const optTxt = s(c.svg, 'text', { x: PX - 6, class: 'nv-optt', 'text-anchor': 'end' });
  const raw = s(c.svg, 'polyline', { class: 'nv-raw' }), mean = s(c.svg, 'polyline', { class: 'nv-mean' });
  const stat = [0, 1, 2, 3, 4].map(k => s(c.svg, 'text', { x: PX - 46, y: 262 + k * 22 + (k > 2 ? 12 : 0), class: k % 3 ? 'fg-t' : 'fg-h2' }));

  const ctl = bar(c), knobs = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset Q';
  reset.onclick = () => { pause(); clear(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch every step</option><option value="fast">1 episode per frame</option><option value="turbo">25 episodes per frame</option>';
  sp.onchange = () => { speed = sp.value; render(); };
  const mz = document.createElement('select');
  mz.innerHTML = MAZES.map(([name], k) => `<option value="${k}">${name}</option>`).join('');
  mz.onchange = () => { wall = MAZES[+mz.value][1].join('').split('').map(ch => ch === '#'); pause(); clear(); replan(); render(); };
  ctl.append(run, reset, sp, mz);
  slider(knobs, 'γ', 0.5, 0.99, 0.01, gamma, v => { gamma = v; });
  slider(knobs, 'β', 0.05, 1, 0.05, beta, v => { beta = v; });
  slider(knobs, 'ε', 0, 0.5, 0.05, eps, v => { eps = v; render(); });

  function clear() { Q.fill(0); seen.fill(0); steps.length = avg.length = 0; pos = S0; t = 0; changedAt = 0; }
  function replan() {
    plan = astar(wall);
    for (let i = 0; i < N * N; i++) cell[i].setAttribute('class', wall[i] ? 'nv-wall nv-c' : i === GOAL ? 'fg-goal' : 'nv-cell nv-c');
  }
  function toggleWall(i: number) {
    if (i === S0 || i === GOAL) return;
    wall[i] = !wall[i];
    if (pos === i) pos = S0;
    if (steps.length) changedAt = steps.length; // only news for an agent that has already learned something
    replan();
    if (!plan) pause();
    render();
  }
  function play() {
    if (!plan || running) return;
    running = true;
    const frame = () => {
      if (speed === 'watch') step();
      else for (let e = speed === 'fast' ? 1 : 25, n = steps.length; e > 0 && running; e--, n = steps.length) while (steps.length === n) step();
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  const cx = (i: number) => X0 + (i % N) * C + C / 2, cy = (i: number) => Y0 + Math.floor(i / N) * C + C / 2;
  function render() {
    let nonzero = 0;
    for (let i = 0; i < N * N; i++) {
      const v = wall[i] ? 0 : qmax(i);
      for (let a = 0; a < 4; a++) nonzero += +(Q[i * 4 + a] !== 0 && !wall[i]);
      heat[i].style.opacity = String(v * 0.8);
      const a = [0, 1, 2, 3].reduce((x, y) => (Q[i * 4 + y] > Q[i * 4 + x] ? y : x));
      pol[i].textContent = v > 0 && i !== GOAL ? MOVES[a][2] : '';
      trail[i].classList.toggle('on', speed === 'watch' && seen[i] === 1);
    }
    agent.setAttribute('transform', `translate(${cx(pos)},${cy(pos)})`);
    agent.classList.toggle('hide', speed !== 'watch' && running);
    path.setAttribute('points', plan ? plan.path.map(i => `${cx(i)},${cy(i)}`).join(' ') : '');
    const n = steps.length, xmax = Math.max(200, Math.ceil(n / 100) * 100), every = Math.max(1, Math.ceil(n / 400));
    const at = (ys: number[], k: number) => `${PX + (k / xmax) * PW},${ly(ys[k])} `;
    const pts = (ys: number[]) => { let p = ''; for (let k = 0; k < n; k += every) p += at(ys, k); return n ? p + at(ys, n - 1) : p; };
    raw.setAttribute('points', pts(steps));
    mean.setAttribute('points', pts(avg));
    xt.forEach((tx, k) => { tx.textContent = String((k * xmax) / 2); });
    for (const e of [opt, optTxt]) e.classList.toggle('hide', !plan);
    if (plan) {
      const L = plan.path.length - 1;
      opt.setAttribute('y1', String(ly(L)));
      opt.setAttribute('y2', String(ly(L)));
      optTxt.setAttribute('y', String(ly(L) + 4));
      optTxt.textContent = `A* ${L}`;
    }
    const free = N * N - wall.filter(Boolean).length;
    stat[0].textContent = 'Q-learning: no model, learns by acting';
    stat[1].textContent = `episode ${n + 1}, step ${t} · last ${Math.min(n, WINDOW)} episodes: ${n ? num(avg[n - 1], 3) : '–'} steps on average`;
    stat[2].textContent = `Q-table: ${nonzero} of ${4 * free} entries learned (one per cell and move)`;
    stat[3].textContent = 'A*: has the model (actions, result, h)';
    stat[4].textContent = plan ? `${plan.path.length - 1} steps, ${plan.expanded} nodes expanded, one run, one path` : 'failure: G is unreachable';
    run.textContent = running ? '⏸ Pause' : n || t ? '⏵ Continue' : '⏵ Run Q-learning';
    run.disabled = !plan;
    explain();
  }

  // the caption follows the stage of learning; it changes only when the stage changes
  function explain() {
    const n = steps.length, L = plan ? plan.path.length - 1 : 0, recent = steps.slice(-20);
    const learned = n - changedAt >= 20 && recent.reduce((x, y) => x + y, 0) / recent.length < 1.5 * L;
    const [key, text] = !plan
      ? ['none', '**G is unreachable.** A* reports failure at once, because it explores the whole reachable space; Q-learning would wander until the step limit. Remove a wall.']
      : changedAt && !learned
      ? ['moved', '**You changed the world.** A* re-planned at once: it has the model (`actions`, `result`). Q-learning has no model: it only finds out by bumping into the change, so near it the old arrows stay wrong until enough episodes re-learn them.']
      : !n && !t
      ? ['idle', '**Q = 0 everywhere**: the agent knows nothing about where G is. Press **Run** and watch the first episode. A* (green line) already has its answer, because it was given the model.']
      : !n
      ? ['walk', '**Episode 1.** Every $Q$ is 0, so every choice is a tie, broken at random: a **random walk**. The orange cells are where it has been. Nothing is learned until it stumbles into G (at most 1000 steps).']
      : n < 4
      ? [`first${n}`, `**G reached after ${steps[0]} steps** in episode 1. Only the last move earned a reward, so only one entry became non-zero: the blue cell next to G. ` +
        'In each new episode the value moves back along the path: $Q \\leftarrow Q + \\beta\\,(r + \\gamma \\max_a Q\' - Q)$ copies a discounted share of the next cell\'s value into the current one. Try **25 episodes per frame**.']
      : !learned
      ? ['spread', 'The blue values spread **backwards from G** and the arrows point the way. Each episode the agent finds G sooner, so the steps per episode fall (faint line: each episode; bold line: average of the last 100, as in the slides\' plot, RL p. 45).']
      : [`learned${eps}`, `**Learned the way from S.** The episodes are now almost as short as the A* path (${L} steps). ` +
        (eps > 0 ? `The gap is **exploration**: with $\\varepsilon = ${eps}$, ${num(eps * 100)}% of the moves are random. Drag ε to 0 and the agent just follows its arrows. ` : '') +
        'Now look at the grid: arrows appear **only where the agent has been**, and some point to the best move *tried so far*, not the best one. ' +
        'Cells it rarely visits keep $Q = 0$: that is why Q-learning is optimal only **asymptotically**, when every state–action pair is tried infinitely often (exam 11 Jun 2025). ' +
        'Raise ε and continue: more of the grid fills in, but the episodes get longer. That is the exploration–exploitation trade-off.'];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  replan();
  render();
  return { destroy: pause };
}

const CSS = `
.nv-cell{fill:var(--panel-2);stroke:var(--border)}
.nv-c{cursor:pointer}
.nv-wall{fill:var(--border-strong);stroke:var(--border-strong)}
.nv-heat{fill:var(--accent);opacity:0;pointer-events:none}
.nv-trail{fill:var(--warn);opacity:0;pointer-events:none}
.nv-trail.on{opacity:.28}
.nv-pol{font-size:17px;font-weight:700;fill:var(--text);text-anchor:middle;pointer-events:none}
.nv-tag{font-size:11px;font-weight:700;fill:var(--muted);pointer-events:none}
.nv-path{fill:none;stroke:var(--ok);stroke-width:3;stroke-linejoin:round;opacity:.85;pointer-events:none}
.nv-agent{fill:var(--warn);stroke:var(--panel);stroke-width:2.5;pointer-events:none}
.nv-plot{fill:var(--panel-2);stroke:var(--border)}
.nv-grid{stroke:var(--border);stroke-dasharray:2 4}
.nv-opt{stroke:var(--ok);stroke-width:1.5;stroke-dasharray:6 4}
.nv-optt{font:600 11px var(--mono);fill:var(--ok)}
.nv-raw{fill:none;stroke:var(--muted);stroke-width:1;opacity:.45}
.nv-mean{fill:none;stroke:var(--accent);stroke-width:2.5}
`;
