// Node statistics, two conventions (slides p. 419, 443–445): the tree of step 9 of the slides' example, stored as MAX's wins or as the
// wins of the player who moved into the node; UCB1 at both levels, and the C at which the root's choice flips. Interactive.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

// convention 1 (wins of MAX, the player at the root): root 2/4, a1 2/3 (b1 0/1, b2 1/1), a2 0/1
const T = { a1: [2, 3], a2: [0, 1], b1: [0, 1], b2: [1, 1] } as const, ROOT = [2, 4], ROOT_N = ROOT[1];
type Id = keyof typeof T;
const POS: Record<Id | 'root', [number, number]> = { root: [180, 46], a1: [100, 136], a2: [260, 136], b1: [50, 226], b2: [150, 226] };
const ucb = (u: number, n: number, np: number, C: number) => u / n + C * Math.sqrt(Math.log(np) / n);
const PX = 420, PY = 30, PW = 330, PH = 200, CMAX = 3, VMAX = 4;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-mcs-css', CSS);
  const c = card(el, 'interactive', 'Node statistics: the same tree in the two conventions, and UCB1 at each level', '0 0 780 300');
  let conv = 1, C = 1;

  // stored U/N: convention 2 stores, at the nodes reached by MIN's moves (b1, b2), MIN's wins N − U
  const stored = (id: Id) => { const [u, n] = T[id]; return conv === 2 && id[0] === 'b' ? [n - u, n] : [u, n]; };
  // what the chooser maximizes as its win rate: at MIN's level, convention 1 needs (N − U)/N
  const rate = (id: Id) => { const [u, n] = stored(id); return conv === 1 && id[0] === 'b' ? (n - u) / n : u / n; };
  const score = (id: Id) => rate(id) + C * Math.sqrt(Math.log(id[0] === 'a' ? ROOT_N : T.a1[1]) / T[id][1]);

  const edges = Object.fromEntries((['a1', 'a2', 'b1', 'b2'] as Id[]).map(id => {
    const [x1, y1] = POS[id[0] === 'a' ? 'root' : 'a1'], [x2, y2] = POS[id];
    return [id, s(c.svg, 'line', { x1, y1: y1 + 16, x2, y2: y2 - 16, class: 'fg-e' })];
  })) as Record<Id, SVGLineElement>;
  if (ucb(T.a1[0], T.a1[1], ROOT_N, 1) <= ucb(T.a2[0], T.a2[1], ROOT_N, 1)) console.error('mcts-stats: with C = 1 the slides select a1 at step 9');
  const box = (id: Id | 'root', who: string) => {
    const [x, y] = POS[id], g = s(c.svg, 'g', { class: `mcs-n ${who}` });
    s(g, 'rect', { x: x - 30, y: y - 15, width: 60, height: 30, rx: 8 });
    const t = s(g, 'text', { x, y: y + 5 });
    if (id !== 'root') s(c.svg, 'text', { x: x - 34, y: y - 18, class: 'fg-m' }, id);
    return { g, t };
  };
  const nodes = { root: box('root', 'max'), a1: box('a1', 'min'), a2: box('a2', 'min'), b1: box('b1', 'max'), b2: box('b2', 'max') };
  const scores = Object.fromEntries((['a1', 'a2', 'b1', 'b2'] as Id[]).map(id => [id, s(c.svg, 'text', { x: POS[id][0], y: POS[id][1] + 32, class: 'mcs-u' })])) as Record<Id, SVGTextElement>;
  s(c.svg, 'text', { x: 300, y: 50, class: 'mcs-who' }, 'MAX chooses');
  s(c.svg, 'text', { x: 300, y: 140, class: 'mcs-who' }, 'MIN chooses');
  s(c.svg, 'text', { x: 300, y: 230, class: 'mcs-who' }, 'MAX chooses');
  const legend = s(c.svg, 'text', { x: 20, y: 286, class: 'fg-m' });

  // right: UCB1 of a1 and a2 at the root as functions of C
  s(c.svg, 'text', { x: PX, y: PY - 12, class: 'fg-t' }, 'UCB1 at the root as C grows');
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'mcs-box' });
  const px = (x: number) => PX + (x / CMAX) * PW, py = (v: number) => PY + PH - (v / VMAX) * PH;
  for (let v = 0; v <= VMAX; v++) s(c.svg, 'text', { x: PX - 6, y: py(v) + 4, class: 'fg-m', 'text-anchor': 'end' }, String(v));
  for (let x = 0; x <= CMAX; x++) s(c.svg, 'text', { x: px(x), y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'middle' }, String(x));
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 30, class: 'fg-m', 'text-anchor': 'end' }, 'C');
  (['a1', 'a2'] as Id[]).forEach((id, k) => {
    let pts = '';
    for (let x = 0; x <= CMAX; x += 0.05) pts += `${px(x)},${py(ucb(T[id][0], T[id][1], ROOT_N, x))} `;
    s(c.svg, 'polyline', { points: pts, class: `mcs-l k${k}` });
    s(c.svg, 'text', { x: px(CMAX) - 4, y: py(ucb(T[id][0], T[id][1], ROOT_N, CMAX)) + (k ? -8 : 16), class: `mcs-lt k${k}`, 'text-anchor': 'end' }, id);
  });
  // where the two lines cross: 2/3 + C·√(ln 4 / 3) = 0 + C·√(ln 4)
  const cStar = (T.a1[0] / T.a1[1] - T.a2[0] / T.a2[1]) / (Math.sqrt(Math.log(ROOT_N) / T.a2[1]) - Math.sqrt(Math.log(ROOT_N) / T.a1[1]));
  s(c.svg, 'line', { x1: px(cStar), x2: px(cStar), y1: PY, y2: PY + PH, class: 'mcs-star' });
  s(c.svg, 'text', { x: px(cStar) + 4, y: PY + 14, class: 'mcs-st' }, `flip at C = ${num(cStar, 3)}`);
  const cur = s(c.svg, 'line', { y1: PY, y2: PY + PH, class: 'mcs-cur' });

  const knobs = bar(c);
  const cIn = slider(knobs, 'C', 0, CMAX, 0.01, C, v => { C = v; render(); });
  cIn.addEventListener('change', say);
  for (const [v, why] of [[1, 'slides'], [Math.SQRT2, 'AIMA, theory']] as const) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `C = ${v === 1 ? '1' : '√2'} (${why})`;
    b.onclick = () => { cIn.value = String(v); C = v; cIn.dispatchEvent(new Event('input')); C = v; render(); say(); };
    knobs.append(b);
  }
  const cv = document.createElement('select');
  cv.innerHTML = '<option value="1">convention 1: wins of MAX in every node</option><option value="2">convention 2: wins of the player who moved into the node</option>';
  cv.onchange = () => { conv = +cv.value; render(); say(); };
  knobs.append(cv);
  function say() { opts.onEvent?.(`[${c.title}] convention ${conv}, C = ${num(C, 3)}: ${c.cap.textContent}`); }

  function render() {
    nodes.root.t.textContent = conv === 1 ? `${ROOT[0]}/${ROOT_N}` : `N = ${ROOT_N}`;
    (['a1', 'a2', 'b1', 'b2'] as Id[]).forEach(id => {
      const [u, n] = stored(id);
      nodes[id].t.textContent = `${u}/${n}`;
      scores[id].textContent = `UCB1 ${num(score(id), 3)}`;
    });
    const top = score('a1') >= score('a2') ? 'a1' : 'a2', low = score('b1') >= score('b2') ? 'b1' : 'b2';
    for (const id of ['a1', 'a2', 'b1', 'b2'] as Id[]) edges[id].setAttribute('class', `fg-e${id === top || (top === 'a1' && id === low) ? ' cur' : ''}`);
    for (const id of ['root', 'a1', 'a2', 'b1', 'b2'] as const) nodes[id].g.classList.toggle('on', id === 'root' || id === top || (top === 'a1' && id === low));
    cur.setAttribute('x1', String(px(C)));
    cur.setAttribute('x2', String(px(C)));
    legend.textContent = conv === 1 ? 'U/N = MAX\'s wins / playouts in every node' : 'U/N = wins of the player who made the move into the node / playouts';
    const [ub1, nb1] = stored('b1'), [ub2, nb2] = stored('b2');
    const atMin = conv === 1
      ? `At $a_1$ **MIN** chooses, but the nodes store MAX's wins: MIN maximizes $\\frac{N-U}{N} + C\\sqrt{\\ln 3/N}$, so $b_1$ (${ub1}/${nb1} for MAX = ${nb1 - ub1}/${nb1} for MIN) scores ${num(score('b1'), 3)} and $b_2$ ${num(score('b2'), 3)}. `
      : `$b_1$ and $b_2$ now store **MIN's** wins (${ub1}/${nb1} and ${ub2}/${nb2}): MIN maximizes the plain UCB1, ${num(score('b1'), 3)} vs ${num(score('b2'), 3)}. Every player uses the same rule. `;
    c.cap.innerHTML = md(`The tree after step 8 of the slides' example, before the selection of step 9. ${atMin}` +
      `Both conventions pick the same nodes. At the root with $C = ${num(C, 3)}$: $a_1$ ${num(score('a1'), 4)}, $a_2$ ${num(score('a2'), 4)}, so MAX selects **${top === 'a1' ? '$a_1$' : '$a_2$'}**` +
      (top === 'a1' ? ' and then MIN $b_1$, as in the slides.' : ', which still has untried moves: it is expanded instead.') +
      ` The choice flips at $C = ${num(cStar, 3)}$: **$C = 1$ picks $a_1$, $C = \\sqrt 2$ picks $a_2$** (exam trap).`);
  }
  render();
  return { destroy() {} };
}

const CSS = `
.mcs-n rect{fill:var(--panel-2);stroke-width:2;transition:stroke-width .2s,fill .2s}
.mcs-n.max rect{stroke:var(--v-max)}
.mcs-n.min rect{stroke:var(--v-min)}
.mcs-n.on rect{stroke-width:3.5;fill:var(--accent-soft)}
.mcs-n text{font:700 13px var(--mono);fill:var(--text);text-anchor:middle}
.mcs-u{font:600 11px var(--mono);fill:var(--accent);text-anchor:middle;paint-order:stroke;stroke:var(--panel);stroke-width:4px}
.mcs-who{font-size:12px;font-weight:600;fill:var(--muted)}
.mcs-box{fill:var(--panel-2);stroke:var(--border)}
.mcs-l{fill:none;stroke-width:2.5}
.mcs-l.k0{stroke:var(--accent)}
.mcs-l.k1{stroke:var(--warn)}
.mcs-lt{font:600 12px var(--mono)}
.mcs-lt.k0{fill:var(--accent)}
.mcs-lt.k1{fill:var(--warn)}
.mcs-star{stroke:var(--muted);stroke-dasharray:4 4}
.mcs-st{font:11px var(--mono);fill:var(--muted)}
.mcs-cur{stroke:var(--ok);stroke-width:2}
`;
