// One MCTS iteration on AIMA Figure 6.10 (slides p. 425), C = √2: stepper through the four phases.
// The UCB1 values, the selected path and the backed-up statistics are computed from the tree.
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

const C = Math.SQRT2;
interface Nd { u: number; n: number; x: number; y: number; black: boolean; kids: Nd[] }
const nd = (u: number, n: number, x: number, y: number, black: boolean, kids: Nd[] = []): Nd => ({ u, n, x, y, black, kids });
// U/N = wins of the player who moved INTO the node / playouts through it. Black is to move at the root.
const tree = () => nd(37, 100, 300, 40, false, [
  nd(60, 79, 190, 118, true, [nd(3, 26, 110, 196, false), nd(16, 53, 300, 196, false, [nd(27, 35, 230, 274, true), nd(10, 18, 370, 274, true)])]),
  nd(1, 10, 390, 118, true), nd(2, 11, 530, 118, true)]);
const ucb = (k: Nd, p: Nd) => k.u / k.n + C * Math.sqrt(Math.log(p.n) / k.n);
const frac = (k: Nd) => `${k.u}/${k.n}`;

interface F extends Frame { stats: string[]; ucbs: string[]; path: number; added: boolean; playout: boolean; pick: number; won?: boolean }

function build() {
  const root = tree(), all: Nd[] = [];
  const walk = (n: Nd) => { all.push(n); n.kids.forEach(walk); };
  walk(root);
  const path = [root];
  while (path[path.length - 1].kids.length) {
    const p = path[path.length - 1];
    path.push(p.kids.reduce((a, b) => (ucb(b, p) > ucb(a, p) ? b : a)));
  }
  const leaf = path[path.length - 1];
  const fresh = nd(0, 0, leaf.x, leaf.y + 78, !leaf.black);
  const stats = () => [...all, fresh].map(frac);
  const none = () => [...all, fresh].map(() => '');
  const frames: F[] = [{ stats: stats(), ucbs: none(), path: 0, added: false, playout: false, pick: -1, group: 'selection',
    cap: '**The tree before the iteration.** Black is to move at the root. Each node stores $U/N$: the wins of the player who made the move ' +
      '**into** the node (black nodes = black\'s moves, white nodes = white\'s moves) and the playouts through it. $C = \\sqrt 2$.' }];
  path.slice(0, -1).forEach((p, d) => {
    const chosen = path[d + 1], who = chosen.black ? 'Black' : 'White';
    frames.push({ stats: stats(), ucbs: [...all, fresh].map(k => (p.kids.includes(k) ? ucb(k, p).toFixed(3) : '')), path: d + 1, added: false, playout: false, pick: -1, group: 'selection',
      cap: `**Selection, level ${d + 1}** ($N = ${p.n}$ at the parent). ${who} picks the largest UCB1: ` +
        p.kids.map(k => `${frac(k)} → ${ucb(k, p).toFixed(3)}`).join(', ') +
        `. Chosen: **${frac(chosen)}**: $\\frac{${chosen.u}}{${chosen.n}} + \\sqrt2\\sqrt{\\frac{\\ln ${p.n}}{${chosen.n}}} = ${ucb(chosen, p).toFixed(3)}$.` +
        (chosen.kids.length ? '' : ' It has no children yet: **selection stops** here.') });
  });
  frames.push({ stats: stats(), ucbs: none(), path: path.length - 1, added: true, playout: false, pick: -1, group: 'expansion',
    cap: `**Expansion:** add one child of ${frac(leaf)}, a ${fresh.black ? 'black' : 'white'} move, with statistics 0/0.` });
  frames.push({ stats: stats(), ucbs: none(), path: path.length - 1, added: true, playout: true, pick: -1, group: 'simulation',
    cap: '**Simulation:** play the game out from the new node with random moves (the playout policy). The playout is not stored. **Black wins.**' });
  for (const n of [...path, fresh]) { n.n++; if (n.black) n.u++; }
  frames.push({ stats: stats(), ucbs: none(), path: path.length - 1, added: true, playout: true, pick: -1, won: true, group: 'backpropagation',
    cap: `**Backpropagation:** every node on the path gets $N + 1$; only the nodes reached by a **black** move (green) get $U + 1$: ` +
      [...path, fresh].map(frac).join(' → ') + '.' });
  const pick = root.kids.reduce((a, b) => (b.n > a.n ? b : a));
  frames.push({ stats: stats(), ucbs: none(), path: path.length - 1, added: true, playout: false, pick: all.indexOf(pick), group: 'backpropagation',
    cap: `**If time ran out now,** black would play the move with the most playouts: **${frac(pick)}** ` +
      `(${root.kids.map(k => `N = ${k.n}`).join(', ')}), not the largest UCB1 and not the best win rate.` });
  return { frames, all, path: path.map(p => all.indexOf(p)), fresh };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-mc-css', CSS);
  const c = card(el, 'stepper', 'One MCTS iteration (AIMA Figure 6.10): selection, expansion, simulation, backpropagation', '0 0 640 440');
  const { frames, all, path, fresh } = build();
  const parent = new Map<Nd, Nd>();
  all.forEach(p => p.kids.forEach(k => parent.set(k, p)));
  parent.set(fresh, all[path[path.length - 1]]);
  const nodes = [...all, fresh];
  const edges = nodes.map(n => {
    const p = parent.get(n);
    return p ? s(c.svg, 'line', { x1: p.x, y1: p.y + 15, x2: n.x, y2: n.y - 15, class: 'fg-e' }) : null;
  });
  const play = s(c.svg, 'g', { class: 'mc-play' });
  s(play, 'path', { d: `M${fresh.x},${fresh.y + 16} q10,8 0,16 q-10,8 0,16 q10,8 0,16`, class: 'mc-squig' });
  s(play, 'text', { x: fresh.x, y: fresh.y + 82, class: 'fg-t', 'text-anchor': 'middle' }, 'black wins');
  const g = nodes.map(n => {
    const gr = s(c.svg, 'g', { class: `mc-n ${n.black ? 'b' : 'w'}` });
    s(gr, 'rect', { x: n.x - 32, y: n.y - 15, width: 64, height: 30, rx: 8 });
    return { gr, t: s(gr, 'text', { x: n.x, y: n.y + 5 }), ucb: s(c.svg, 'text', { x: n.x + 38, y: n.y + 5, class: 'mc-ucb' }) };
  });
  const iFresh = nodes.length - 1;
  return stepper(c, frames, f => {
    const on = new Set(path.slice(0, f.path + 1));
    if (f.added) on.add(iFresh);
    nodes.forEach((n, i) => {
      g[i].t.textContent = f.stats[i];
      g[i].gr.classList.toggle('hide', i === iFresh && !f.added);
      g[i].gr.classList.toggle('on', on.has(i) && f.pick < 0);
      g[i].gr.classList.toggle('pick', i === f.pick || (!!f.won && on.has(i) && n.black));
      edges[i]?.classList.toggle('hide', i === iFresh && !f.added);
      edges[i]?.classList.toggle('cur', on.has(i) && f.pick < 0);
      g[i].ucb.textContent = f.ucbs[i];
    });
    play.classList.toggle('hide', !f.playout);
  }, opts);
}

const CSS = `
.mc-n rect{stroke-width:1.5;transition:stroke .25s,stroke-width .25s}
.mc-n.b rect{fill:#1d2128;stroke:#59636f}
.mc-n.w rect{fill:#f3f4f6;stroke:#9aa5b5}
.mc-n text{font:600 13px var(--mono);text-anchor:middle;pointer-events:none}
.mc-n.b text{fill:#fff}
.mc-n.w text{fill:#1b2330}
.mc-n.on rect{stroke:var(--accent);stroke-width:3}
.mc-n.pick rect{stroke:var(--ok);stroke-width:3.5}
.mc-n{transition:opacity .3s}
.mc-ucb{font:600 12px var(--mono);fill:var(--accent)}
.mc-squig{fill:none;stroke:var(--warn);stroke-width:2;stroke-dasharray:4 3}
.mc-play{transition:opacity .3s}
.mc-play text{fill:var(--warn);font-weight:700}
`;
