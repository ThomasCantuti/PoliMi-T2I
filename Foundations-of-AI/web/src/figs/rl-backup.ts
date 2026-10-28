// The Bellman backup V(s) = max_a Q(s, a), Q(s, a) = E[r + γ V(s')] (RL p. 33–35), on the exams' 3×3 grid: click a cell to see its backup.
// V is computed by value iteration; with p = 1 (deterministic, as in the exams) it is checked against γ^(d−1) and −(1 − γ^(d−1))/(1 − γ).
import { DIRS, GOAL, WALL, allowed, dist, name } from './rl-mdp';
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const C = 78, X0 = 18, Y0 = 34, TX = 290;
const SCHEMES = [
  { name: 'goal-reward', r: (j: number) => (j === GOAL ? 1 : 0) },
  { name: 'action-penalty', r: (j: number) => (j === GOAL ? 0 : -1) },
];
const pr = (x: number) => (x < 0 ? `(${num(x, 3)})` : num(x, 3));

/** Converged V by value iteration; Q(s, a) = Σ p(s'|s,a)·(r + γ V(s')), V(G) = 0. */
function solve(sc: number, gamma: number, p: number) {
  let V = Array<number>(9).fill(0);
  const q = (i: number, a: number, W: number[]) => dist(i, a, p).reduce((x, [j, w]) => x + w * (SCHEMES[sc].r(j) + gamma * W[j]), 0);
  for (let it = 0; it < 500; it++) {
    const W = V;
    V = W.map((_, i) => (i === WALL || i === GOAL ? 0 : Math.max(...allowed(i).map(a => q(i, a, W)))));
  }
  return { V, q: (i: number, a: number) => q(i, a, V) };
}
// independent check of the deterministic case: BFS distance d to G gives the closed forms of the course
{
  const d = Array<number>(9).fill(-1), queue = [GOAL];
  d[GOAL] = 0;
  while (queue.length) { const j = queue.shift()!; for (let i = 0; i < 9; i++) if (d[i] < 0 && i !== WALL && allowed(i).some(a => dist(i, a, 1)[0][0] === j)) { d[i] = d[j] + 1; queue.push(i); } }
  const [g, a] = [solve(0, 0.5, 1).V, solve(1, 0.5, 1).V];
  for (let i = 0; i < 9; i++) if (i !== WALL && i !== GOAL && (Math.abs(g[i] - 0.5 ** (d[i] - 1)) > 1e-9 || Math.abs(a[i] + (1 - 0.5 ** (d[i] - 1)) / 0.5) > 1e-9))
    console.error(`rl-backup: V${name(i)} = ${g[i]} / ${a[i]}, closed form ${0.5 ** (d[i] - 1)} / ${-(1 - 0.5 ** (d[i] - 1)) / 0.5}`);
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rlb-css', CSS);
  const c = card(el, 'interactive', 'The Bellman backup: V(s) is the best Q(s, a)', '0 0 780 300');
  let sc = 0, gamma = 0.5, p = 1, sel = 0;

  const val: SVGTextElement[] = [], pol: SVGTextElement[] = [], rects: SVGRectElement[] = [];
  for (let i = 0; i < 9; i++) {
    const x = X0 + (i % 3) * C, y = Y0 + Math.floor(i / 3) * C;
    rects.push(s(c.svg, 'rect', { x, y, width: C, height: C, class: i === WALL ? 'fg-wall' : i === GOAL ? 'fg-goal' : 'fg-cell rlb-c' }));
    if (i === WALL) continue;
    s(c.svg, 'text', { x: x + 5, y: y + 14, class: 'fg-m' }, name(i));
    val.push(s(c.svg, 'text', { x: x + C / 2, y: y + C / 2 + 8, class: 'rlb-v' }));
    pol.push(s(c.svg, 'text', { x: x + C - 8, y: y + C - 8, class: 'rlb-p' }));
    rects[i].onclick = () => { if (i !== GOAL) { sel = i; render(); opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`); } };
  }
  const vi = (i: number) => i - +(i > WALL); // index into val/pol, which skip the wall
  const qline = DIRS.map(() => s(c.svg, 'line', { class: 'rlb-a' }));
  const head = s(c.svg, 'text', { x: TX, y: 52, class: 'fg-h2' });
  const lines = [0, 1, 2, 3].map(k => [s(c.svg, 'text', { x: TX, y: 88 + k * 48, class: 'rlb-line' }), s(c.svg, 'text', { x: TX + 14, y: 108 + k * 48, class: 'rlb-terms' })]);
  const foot = s(c.svg, 'text', { x: TX, y: 286, class: 'fg-m' });
  s(c.svg, 'text', { x: X0, y: Y0 + 3 * C + 18, class: 'fg-m' }, 'Click a cell. Arrows: the best action.');

  const knobs = bar(c), knobs2 = bar(c);
  const schB = SCHEMES.map((x, k) => {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = x.name;
    b.onclick = () => { sc = k; render(); opts.onEvent?.(`[${c.title}] ${x.name}`); };
    knobs.append(b);
    return b;
  });
  const g = slider(knobs, 'γ', 0.1, 0.99, 0.01, gamma, v => { gamma = v; render(); });
  g.addEventListener('change', () => opts.onEvent?.(`[${c.title}] γ = ${gamma}`));
  const ps = slider(knobs2, 'p (move succeeds; slips to the sides otherwise)', 0.4, 1, 0.05, p, v => { p = v; render(); });
  ps.addEventListener('change', () => opts.onEvent?.(`[${c.title}] p = ${p}`));

  /** True when both reward functions give the same best actions (ties count as agreement) for the current γ and p. */
  function same() {
    const [A, B] = [0, 1].map(k => solve(k, gamma, p));
    const bestSet = (S: ReturnType<typeof solve>, i: number) => { const m = Math.max(...allowed(i).map(a => S.q(i, a))); return allowed(i).filter(a => S.q(i, a) > m - 1e-9); };
    return [0, 1, 2, 3, 5, 6, 7].every(i => bestSet(A, i).some(a => bestSet(B, i).includes(a)));
  }
  const cx = (i: number) => X0 + (i % 3) * C + C / 2, cy = (i: number) => Y0 + Math.floor(i / 3) * C + C / 2;
  function render() {
    const { V, q } = solve(sc, gamma, p);
    for (let i = 0; i < 9; i++) {
      if (i === WALL) continue;
      val[vi(i)].textContent = num(V[i], 3);
      const acts = allowed(i);
      pol[vi(i)].textContent = i === GOAL ? 'G' : DIRS[acts.reduce((x, y) => (q(i, y) > q(i, x) + 1e-12 ? y : x))][1];
      rects[i].classList.toggle('rlb-sel', i === sel);
    }
    const acts = allowed(sel), qs = acts.map(a => q(sel, a)), top = Math.max(...qs);
    DIRS.forEach(([, , dr, dk], a) => {
      const k = acts.indexOf(a), ln = qline[a];
      for (const [at, v] of [['x1', cx(sel) + dk * (C / 2 - 8)], ['y1', cy(sel) + dr * (C / 2 - 8)], ['x2', cx(sel) + dk * (C / 2 + 14)], ['y2', cy(sel) + dr * (C / 2 + 14)]] as const) ln.setAttribute(at, String(v));
      ln.classList.toggle('hide', k < 0);
      ln.classList.toggle('best', k >= 0 && Math.abs(qs[k] - top) < 1e-12);
    });
    head.textContent = `V${name(sel)} = max over ${acts.map(a => DIRS[a][0]).join(', ')} = ${num(top, 3)}`;
    lines.forEach(([ln, tm], k) => {
      const a = acts[k];
      ln.textContent = tm.textContent = '';
      if (a === undefined) return;
      const terms = dist(sel, a, p).map(([j, w]) => `${p < 1 ? `${num(w, 3)}·` : ''}(${num(SCHEMES[sc].r(j))} + ${gamma}·V${j === GOAL ? '(G)' : name(j)})`);
      const nums = dist(sel, a, p).map(([j, w]) => `${p < 1 ? `${num(w, 3)}·` : ''}(${num(SCHEMES[sc].r(j))} + ${gamma}·${pr(V[j])})`);
      ln.textContent = `${DIRS[a][1]} ${DIRS[a][0]}: Q = ${terms.join(' + ')}`;
      tm.textContent = `= ${nums.join(' + ')} = ${num(qs[k], 3)}`;
      for (const e of [ln, tm]) e.classList.toggle('best', Math.abs(qs[k] - top) < 1e-12);
    });
    foot.textContent = p < 1 ? 'Q = Σ over s′ of p(s′|s,a)·(r + γ·V(s′)), each slip side (1 − p)/2' : 'Q(s, a) = r + γ·V(result(s, a)), V(G) = 0';
    schB.forEach((b, k) => b.classList.toggle('primary', k === sc));
    c.cap.innerHTML = md(`**${SCHEMES[sc].name}, $\\gamma = ${gamma}$${p < 1 ? `, $p = ${p}$` : ''}.** Each $Q(s, a)$ is the reward of the move plus the discounted value of where it lands; ` +
      `$V(s)$ is the **best** of them (green), because the best action is always selected. ` +
      (p < 1 ? 'With slips the backup is an **expectation**: every possible next cell counts with its probability (Bellman expectation equation, RL p. 35). '
        : 'With $p = 1$ (the exams) the expectation has one term. ') +
      'Change $\\gamma$ or the reward: the values change; ' + (same() ? `the arrows are the same under both reward functions${p === 1 ? ': both make the shortest path optimal' : ' here'}.` : 'here the two reward functions give **different** arrows.'));
  }
  render();
  return { destroy() {} };
}

const CSS = `
.rlb-c{cursor:pointer}
.fg-cell.rlb-sel{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2}
.rlb-v{font:600 15px var(--mono);fill:var(--text);text-anchor:middle;pointer-events:none}
.rlb-p{font-size:15px;font-weight:700;fill:var(--accent);text-anchor:end;pointer-events:none}
.rlb-a{stroke:var(--v-edge);stroke-width:4;stroke-linecap:round;pointer-events:none}
.rlb-a.best{stroke:var(--ok)}
.rlb-line{font:600 12px var(--mono);fill:var(--text-2)}
.rlb-terms{font:11.5px var(--mono);fill:var(--text-2)}
.rlb-line.best,.rlb-terms.best{fill:var(--ok)}
`;
