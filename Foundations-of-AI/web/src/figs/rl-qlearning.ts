// Q-learning on the 3×3 grid (exam 30 Aug 2022): every frame is computed with the update rule.
import { arrow, card, num, s, stepper, style, type FigOptions, type Frame } from './shell';

const GAMMA = 0.5, BETA = 0.25, EPISODES = 4, C = 100, X0 = 30, Y0 = 30;
const PATH: [number, number, 'E' | 'S'][] = [[1, 1, 'E'], [1, 2, 'E'], [1, 3, 'S'], [2, 3, 'S']];
const GOAL: [number, number] = [3, 3];
const GLYPH = { E: '→', S: '↓' };

interface F extends Frame { pos: [number, number]; Q: number[]; changed: number; ep: number }

function build(): F[] {
  const Q = PATH.map(() => 0);
  const frames: F[] = [{ pos: [1, 1], Q: [...Q], changed: -1, ep: 0, group: 'start',
    cap: '**Start.** Every $Q$ entry is 0. Each episode moves east, east, south, south from S; press ▶ to take the first step.' }];
  for (let ep = 1; ep <= EPISODES; ep++) PATH.forEach(([r, k, a], i) => {
    const goal = i === PATH.length - 1, next: [number, number] = goal ? GOAL : [PATH[i + 1][0], PATH[i + 1][1]];
    const reward = goal ? 1 : 0, future = goal ? 0 : Q[i + 1], old = Q[i];
    Q[i] = old + BETA * (reward + GAMMA * future - old);
    const rule = goal
      ? `Q((${r},${k}),${a}) \\leftarrow ${num(old)} + ${BETA}\\cdot(1 - ${num(old)}) = \\mathbf{${num(Q[i])}}`
      : `Q((${r},${k}),${a}) \\leftarrow ${num(old)} + ${BETA}\\cdot(0 + ${GAMMA}\\cdot ${num(future)} - ${num(old)}) = \\mathbf{${num(Q[i])}}`;
    const why = goal ? 'Entering the goal ends the episode: **no discounted term**, only the reward.'
      : Q[i] === old ? 'Nothing changes: the next state has no value yet.'
      : 'The value of the next state has moved **one step back**.';
    frames.push({ pos: next, Q: [...Q], changed: Q[i] === old ? -1 : i, ep, group: `episode ${ep}`,
      cap: `**Episode ${ep} · step ${i + 1}:** (${r},${k}) ${GLYPH[a]} (${next.join(',')}). ${why} $${rule}$` +
        (ep === EPISODES && i === 0 ? ' The reward has reached S: **4 episodes for a 4-step path**.' : '') });
  });
  return frames;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-ql-css', CSS);
  const c = card(el, 'stepper', 'Q-learning: the reward travels back one step per episode', '0 0 560 350');
  const cx = (k: number) => X0 + (k - 1) * C + C / 2, cy = (r: number) => Y0 + (r - 1) * C + C / 2;
  for (let r = 1; r <= 3; r++) for (let k = 1; k <= 3; k++)
    s(c.svg, 'rect', { x: X0 + (k - 1) * C, y: Y0 + (r - 1) * C, width: C, height: C, class: r === 2 && k === 2 ? 'fg-wall' : r === 3 && k === 3 ? 'fg-goal' : 'fg-cell' });
  s(c.svg, 'text', { x: X0 + 8, y: Y0 + 18, class: 'ql-tag' }, 'S');
  s(c.svg, 'text', { x: cx(3), y: cy(3) + 6, class: 'ql-tag', 'text-anchor': 'middle', fill: 'var(--ok)' }, 'G  +1');
  s(c.svg, 'path', { class: 'ql-path', 'marker-end': arrow(c.svg), d: `M${cx(1) + 22},${cy(1) - 10} L${cx(3) + 36},${cy(1) - 10} L${cx(3) + 36},${cy(3) - 22}` });
  const flash: SVGRectElement[] = [], val: SVGTextElement[] = [], row: SVGTextElement[] = [];
  const px = X0 + 3 * C + 30;
  const epTxt = s(c.svg, 'text', { x: px, y: Y0 + 14, class: 'fg-h2' });
  s(c.svg, 'text', { x: px, y: Y0 + 40, class: 'fg-m' }, `γ = ${GAMMA}, β = ${BETA}, Q starts at 0`);
  s(c.svg, 'text', { x: px, y: Y0 + 74, class: 'fg-m' }, 'Q-table (entries on the path)');
  PATH.forEach(([r, k, a], i) => {
    flash.push(s(c.svg, 'rect', { x: X0 + (k - 1) * C + 2, y: Y0 + (r - 1) * C + 2, width: C - 4, height: C - 4, rx: 6, class: 'ql-flash' }));
    s(c.svg, 'text', { x: cx(k), y: cy(r) + 36, class: 'fg-m', 'text-anchor': 'middle' }, `Q((${r},${k}), ${GLYPH[a]})`);
    val.push(s(c.svg, 'text', { x: cx(k), y: cy(r) + 20, class: 'fg-v', 'text-anchor': 'middle' }));
    s(c.svg, 'text', { x: px, y: Y0 + 100 + i * 26, class: 'fg-t' }, `(${r},${k}) ${GLYPH[a]}`);
    row.push(s(c.svg, 'text', { x: px + 190, y: Y0 + 100 + i * 26, class: 'fg-v', 'text-anchor': 'end' }));
  });
  const agent = s(c.svg, 'circle', { r: 11, class: 'ql-agent' });
  return stepper(c, build(), f => {
    agent.style.transform = `translate(${cx(f.pos[1])}px, ${cy(f.pos[0]) - 28}px)`;
    f.Q.forEach((q, i) => {
      for (const t of [val[i], row[i]]) { t.textContent = num(q, 3); t.classList.toggle('ok', q !== 0); }
      flash[i].classList.remove('go');
    });
    if (f.changed >= 0) { void flash[f.changed].getBBox(); flash[f.changed].classList.add('go'); }
    epTxt.textContent = f.ep ? `Episode ${f.ep} of ${EPISODES}` : 'Before episode 1';
  }, opts);
}

const CSS = `
.ql-tag{font-size:12px;font-weight:700;fill:var(--muted)}
.ql-path{stroke:var(--border-strong);stroke-width:2;fill:none;stroke-dasharray:5 5}
.ql-flash{fill:var(--warn);opacity:0}
.ql-flash.go{animation:ql-flash 1s ease-out}
@keyframes ql-flash{0%{opacity:.45}100%{opacity:0}}
.ql-agent{fill:var(--accent);stroke:var(--panel);stroke-width:3;transition:transform .45s cubic-bezier(.2,.7,.2,1)}
`;
