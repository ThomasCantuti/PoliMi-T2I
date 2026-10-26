// Converged values computed backward from the goal, one ring at a time (exam 11 Jun 2026): stepper.
// Each value is checked against plain value iteration, so the ring shortcut can never show a wrong number.
import { card, num, s, stepper, style, type FigOptions, type Frame } from './shell';

const ROWS = 2, COLS = 3, WALL = '2,2', GOAL = '2,3', GAMMA = 0.5, C = 100, X0 = 20, Y0 = 20;
const MOVES: [string, number, number, string][] = [['up', -1, 0, '↑'], ['down', 1, 0, '↓'], ['left', 0, -1, '←'], ['right', 0, 1, '→']];
const SCHEMES = [
  { name: 'action-penalty', into: 0, step: -1, text: 'reward −1 per step, 0 into G' },
  { name: 'goal-reward', into: 1, step: 0, text: 'reward 1 into G, 0 otherwise' },
];
const CELLS: string[] = [];
for (let r = 1; r <= ROWS; r++) for (let k = 1; k <= COLS; k++) if (`${r},${k}` !== WALL) CELLS.push(`${r},${k}`);
const moves = (c: string) => {
  const [r, k] = c.split(',').map(Number);
  return MOVES.map(([name, dr, dk, glyph]) => ({ name, glyph, to: `${r + dr},${k + dk}` })).filter(m => CELLS.includes(m.to));
};
const paren = (x: number) => (x < 0 ? `(${num(x)})` : num(x));

interface F extends Frame { V: Record<string, number>; best: Record<string, string>; ring: Record<string, number>; cur?: string; scheme: number }

function build(): F[] {
  const ring: Record<string, number> = { [GOAL]: 0 }, order: string[] = [], queue = [GOAL];
  while (queue.length) {
    const c = queue.shift()!;
    for (const m of moves(c)) if (!(m.to in ring)) { ring[m.to] = ring[c] + 1; order.push(m.to); queue.push(m.to); }
  }
  const frames: F[] = [];
  SCHEMES.forEach((sc, si) => {
    const reward = (to: string) => (to === GOAL ? sc.into : sc.step);
    let vi: Record<string, number> = Object.fromEntries(CELLS.map(c => [c, 0]));
    for (let it = 0; it < 200; it++)
      vi = Object.fromEntries(CELLS.map(c => [c, c === GOAL ? 0 : Math.max(...moves(c).map(m => reward(m.to) + GAMMA * vi[m.to]))]));
    const V: Record<string, number> = { [GOAL]: 0 }, best: Record<string, string> = {};
    if (si === 0) frames.push({ V: { ...V }, best: {}, ring, scheme: si, group: sc.name,
      cap: '**Start at the goal:** $V(G) = 0$, because nothing follows the end of the episode. Then move backwards, one ring of cells at a time.' });
    for (const c of order) {
      const all = moves(c), known = all.filter(m => m.to in V);
      const cand = known.map(m => ({ ...m, v: reward(m.to) + GAMMA * V[m.to] }));
      const b = cand.reduce((x, y) => (y.v > x.v ? y : x));
      if (Math.abs(b.v - vi[c]) > 1e-9) console.error(`rl-bellman: ring value ${b.v} != value iteration ${vi[c]} at ${c}`);
      V[c] = b.v;
      best[c] = b.glyph;
      if (si === 0) frames.push({ V: { ...V }, best: { ...best }, ring, cur: c, scheme: si, group: sc.name,
        cap: `**Ring ${ring[c]}: cell (${c}).** ` + cand.map(m => `${m.name}${m.to === GOAL ? ' into G' : ` to (${m.to})`}: ` +
          `$${num(reward(m.to))} + ${GAMMA}\\cdot ${paren(V[m.to])} = ${num(m.v)}$`).join('; ') + '.' +
          (all.length > known.length ? ' The other moves lead farther from G, so they are worth less.' : '') });
    }
    if (si === 1) frames.push({ V, best, ring, scheme: si, group: sc.name,
      cap: `**Goal-reward** on the same grid: the same rings give $V = \\gamma^{d-1}$: ${order.map(c => num(V[c])).join(', ')}. ` +
        'The arrows do not change: both reward functions make the shortest path optimal.' });
  });
  return frames;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-bl-css', CSS);
  const c = card(el, 'stepper', 'Converged values, computed backward from the goal', '0 0 600 240');
  const cx = (k: number) => X0 + (k - 1) * C + C / 2, cy = (r: number) => Y0 + (r - 1) * C + C / 2;
  const val: Record<string, SVGTextElement> = {}, pol: Record<string, SVGTextElement> = {}, rg: Record<string, SVGTextElement> = {};
  for (let r = 1; r <= ROWS; r++) for (let k = 1; k <= COLS; k++) {
    const id = `${r},${k}`;
    s(c.svg, 'rect', { x: X0 + (k - 1) * C, y: Y0 + (r - 1) * C, width: C, height: C, class: id === WALL ? 'fg-wall' : id === GOAL ? 'fg-goal' : 'fg-cell' });
    if (id === WALL) continue;
    s(c.svg, 'text', { x: X0 + (k - 1) * C + 7, y: Y0 + (r - 1) * C + 16, class: 'fg-m' }, `(${id})`);
    rg[id] = s(c.svg, 'text', { x: X0 + k * C - 7, y: Y0 + (r - 1) * C + 16, class: 'fg-m', 'text-anchor': 'end' });
    val[id] = s(c.svg, 'text', { x: cx(k), y: cy(r) + 8, class: 'fg-v', 'text-anchor': 'middle' });
    pol[id] = s(c.svg, 'text', { x: cx(k), y: cy(r) + 32, class: 'bl-pol', 'text-anchor': 'middle' });
  }
  pol[GOAL].textContent = 'G';
  const cur = s(c.svg, 'rect', { width: C - 6, height: C - 6, rx: 6, class: 'bl-cur' });
  const px = 350;
  const sch = s(c.svg, 'text', { x: px, y: 50, class: 'fg-h2' });
  const rew = s(c.svg, 'text', { x: px, y: 76, class: 'fg-t' });
  s(c.svg, 'text', { x: px, y: 100, class: 'fg-t' }, `γ = ${GAMMA}, moves up/down/left/right`);
  s(c.svg, 'text', { x: px, y: 140, class: 'fg-m' }, 'V(s) = best over the moves of');
  s(c.svg, 'text', { x: px, y: 158, class: 'fg-m' }, 'reward + γ · V(next cell)');
  s(c.svg, 'text', { x: px, y: 196, class: 'fg-m' }, 'ring d = moves to reach G');
  return stepper(c, build(), f => {
    for (const id in val) {
      const known = id in f.V;
      val[id].textContent = known ? num(f.V[id]) : '?';
      val[id].classList.toggle('ok', known);
      if (id !== GOAL) pol[id].textContent = f.best[id] ?? '';
      rg[id].textContent = id === GOAL || known ? `d = ${f.ring[id]}` : '';
    }
    cur.classList.toggle('hide', !f.cur);
    if (f.cur) {
      const [r, k] = f.cur.split(',').map(Number);
      cur.setAttribute('x', String(X0 + (k - 1) * C + 3));
      cur.setAttribute('y', String(Y0 + (r - 1) * C + 3));
    }
    sch.textContent = SCHEMES[f.scheme].name;
    rew.textContent = SCHEMES[f.scheme].text;
  }, opts);
}

const CSS = `
.bl-cur{fill:none;stroke:var(--accent);stroke-width:3;transition:x .35s,y .35s,opacity .3s}
.bl-pol{font-size:20px;font-weight:700;fill:var(--accent)}
`;
