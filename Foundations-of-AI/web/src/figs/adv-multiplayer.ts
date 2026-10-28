// Three players (slides p. 401): vector values backed up level by level, each player maximizing its own component. Stepper.
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

type V = [number, number, number];
const PLAYERS = ['red', 'blue', 'green'];
const LEAVES: V[] = [[1, 6, 6], [7, 1, 2], [6, 1, 2], [7, 2, 1], [5, 1, 7], [1, 5, 2], [7, 7, 1], [5, 2, 5]];
// node k (heap order: 1 root, 2–3 blue, 4–7 green, 8–15 leaves); the player at depth d is PLAYERS[d]
const POS: Record<number, [number, number]> = { 1: [295, 34], 2: [155, 100], 3: [435, 100], 4: [85, 166], 5: [225, 166], 6: [365, 166], 7: [505, 166] };
for (let k = 8; k < 16; k++) POS[k] = [POS[k >> 1][0] + (k % 2 ? 35 : -35), 244];
const depth = (k: number) => Math.floor(Math.log2(k));
const tup = (v: V) => `(${v.join(',')})`;

interface F extends Frame { val: Record<number, V>; cur: number; pick: Record<number, number> }

function build(): F[] {
  const val: Record<number, V> = {}, pick: Record<number, number> = {};
  LEAVES.forEach((v, i) => { val[8 + i] = v; });
  const frames: F[] = [{ val: { ...val }, pick: {}, cur: 0, group: 'leaves',
    cap: '**Three players** move in turn: red at the root, then blue, then green. A terminal state gives a **tuple** (red, blue, green): ' +
      'one utility per player, and it is not zero-sum. Each player picks the child whose tuple is best **for its own component**.' }];
  for (const d of [2, 1, 0]) for (let k = 2 ** d; k < 2 ** (d + 1); k++) {
    const p = d, [a, b] = [2 * k, 2 * k + 1], best = val[b][p] > val[a][p] ? b : a;
    val[k] = val[best];
    pick[k] = best;
    frames.push({ val: { ...val }, pick: { ...pick }, cur: k, group: PLAYERS[p],
      cap: `**${PLAYERS[p][0].toUpperCase() + PLAYERS[p].slice(1)} chooses** between ${tup(val[a])} and ${tup(val[b])}: it compares only component ${p + 1}, ` +
        `${val[a][p]} vs ${val[b][p]}, and backs up **${tup(val[k])}**.` +
        (k === 1 ? ` That is the value of the game: red gets ${val[1][0]}, blue ${val[1][1]}, green ${val[1][2]}.` : '') });
  }
  const top = Math.max(...LEAVES.map(v => v[0])), n = LEAVES.filter(v => v[0] === top).length, [r, , g] = val[1];
  frames.push({ val, pick, cur: 0, group: 'red',
    cap: `**Result ${tup(val[1])}.** Red would love a ${top} (${n} leaves have one), but blue and green never let the game get there: ` +
      `on the left blue takes ${tup(val[2])}, on the right ${tup(val[3])}. Two-player minimax is the special case where the tuple is $(u, -u)$. ` +
      (r === g ? `With more players interests can coincide (red and green both get ${r} here): **alliances** can emerge.` : 'With more players interests can coincide: **alliances** can emerge.') });
  return frames;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-adm-css', CSS);
  const c = card(el, 'stepper', 'More than two players: tuples backed up, each player maximizing its own component', '0 0 640 280');
  const edges: Record<number, SVGLineElement> = {};
  for (let k = 2; k < 16; k++) {
    const [x1, y1] = POS[k >> 1], [x2, y2] = POS[k];
    edges[k] = s(c.svg, 'line', { x1, y1: y1 + 14, x2, y2: y2 - (k >= 8 ? 14 : 13), class: 'fg-e' });
  }
  const vals: Record<number, SVGTextElement> = {}, nodes: Record<number, SVGGElement> = {};
  for (let k = 1; k < 16; k++) {
    const [x, y] = POS[k], g = s(c.svg, 'g', { class: 'adm-n' });
    nodes[k] = g;
    if (k < 8) {
      s(g, 'path', { d: `M${x},${y - 14} L${x + 16},${y + 13} L${x - 16},${y + 13} Z`, class: `adm-tri p${depth(k)}` });
      const side = k === 1 ? 24 : k < 4 ? -24 : 0; // root: right, blue: left, green: below
      vals[k] = s(c.svg, 'text', { x: x + side, y: side ? y + 6 : y + 30, class: 'adm-v', 'text-anchor': side > 0 ? 'start' : side < 0 ? 'end' : 'middle' });
    } else {
      s(g, 'rect', { x: x - 30, y: y - 14, width: 60, height: 26, rx: 5, class: 'adm-leaf' });
      vals[k] = s(g, 'text', { x, y: y + 4, class: 'adm-v', 'text-anchor': 'middle' });
    }
  }
  PLAYERS.forEach((p, d) => s(c.svg, 'text', { x: 636, y: POS[2 ** d][1] + 5, class: `adm-who p${d}`, 'text-anchor': 'end' }, `${p} to move`));
  const write = (t: SVGTextElement, v?: V) => {
    t.replaceChildren();
    if (!v) return;
    s(t, 'tspan', {}, '(');
    v.forEach((x, i) => { s(t, 'tspan', { class: `adm-c p${i}` }, String(x)); if (i < 2) s(t, 'tspan', {}, ','); });
    s(t, 'tspan', {}, ')');
  };
  return stepper(c, build(), f => {
    for (let k = 1; k < 16; k++) {
      write(vals[k], f.val[k]);
      nodes[k].classList.toggle('cur', k === f.cur || f.cur === (k >> 1) && f.cur > 0);
    }
    for (let k = 2; k < 16; k++) edges[k].setAttribute('class', `fg-e${f.pick[k >> 1] === k ? (k >> 1 === f.cur ? ' cur' : ' act') : ''}`);
  }, opts);
}

const CSS = `
.adm-tri{stroke-width:2;fill:var(--panel-2)}
.adm-tri.p0{stroke:var(--bad)}
.adm-tri.p1{stroke:var(--v-max)}
.adm-tri.p2{stroke:var(--ok)}
.adm-n.cur .adm-tri{stroke-width:3.5}
.adm-n.cur .adm-tri.p0{fill:var(--bad-soft)}
.adm-n.cur .adm-tri.p1{fill:var(--accent-soft)}
.adm-n.cur .adm-tri.p2{fill:var(--ok-soft)}
.adm-leaf{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:stroke .25s}
.adm-n.cur .adm-leaf{stroke:var(--accent);stroke-width:2.5}
.adm-v{font:700 13px var(--mono);fill:var(--text-2);paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round}
.adm-leaf+.adm-v{stroke:var(--panel-2)}
.adm-c.p0,.adm-who.p0{fill:var(--bad)}
.adm-c.p1,.adm-who.p1{fill:var(--v-max)}
.adm-c.p2,.adm-who.p2{fill:var(--ok)}
.adm-who{font-size:12px;font-weight:600}
`;
