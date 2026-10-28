// Search tree vs state space on the 8-puzzle (slides p. 103–107): tree nodes up to depth d (a per-depth count of paths over states,
// no path is enumerated) against the distinct states within d moves (BFS). Checked against brute-force path enumeration for d ≤ 6.
import { actions, board, result, type Tiles } from './search-8puzzle';
import { bar, card, md, s, slider, style, type FigOptions } from './shell';
import { btn, fmt, pick } from './search-kit';

const D = 12, PX = 64, PY = 26, PW = 420, PH = 226, LOGMAX = 6;
export const STARTS: [string, Tiles][] = [
  ["the slides' state (blank on an edge)", [8, 2, 7, 3, 4, 0, 5, 1, 6]],
  ['blank in a corner (1 2 3 / 4 5 6 / 7 8 _)', [1, 2, 3, 4, 5, 6, 7, 8, 0]],
  ['blank in the centre (1 2 3 / 4 _ 5 / 6 7 8)', [1, 2, 3, 4, 0, 5, 6, 7, 8]],
];
const succ = (t: Tiles) => actions(t).map(a => result(t, a));

/** tree[d] = search-tree nodes with depth ≤ d (paths of ≤ d moves); states[d] = distinct states within d moves. */
export function growth(start: Tiles, depth = D) {
  let paths = new Map<string, [Tiles, number]>([[start.join(''), [start, 1]]]);
  const dist = new Map([[start.join(''), 0]]), tree = [1], states = [1];
  let layer = [start];
  for (let d = 1; d <= depth; d++) {
    const next = new Map<string, [Tiles, number]>();
    for (const [t, k] of paths.values()) for (const u of succ(t)) { const key = u.join(''); next.set(key, [u, (next.get(key)?.[1] ?? 0) + k]); }
    paths = next;
    tree.push(tree[d - 1] + [...next.values()].reduce((a, [, k]) => a + k, 0));
    const fresh: Tiles[] = [];
    for (const t of layer) for (const u of succ(t)) if (!dist.has(u.join(''))) { dist.set(u.join(''), d); fresh.push(u); }
    layer = fresh;
    states.push(states[d - 1] + fresh.length);
  }
  return { tree, states };
}

function bruteTree(start: Tiles, depth: number) {
  let n = 0;
  const walk = (t: Tiles, d: number) => { n++; if (d < depth) for (const u of succ(t)) walk(u, d + 1); };
  walk(start, 0);
  return n;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fmg-css', CSS);
  const c = card(el, 'interactive', 'The search tree outgrows the state space', '0 0 780 300');
  const data = STARTS.map(([, t]) => growth(t));
  STARTS.forEach(([, t], k) => { if (bruteTree(t, 6) !== data[k].tree[6]) console.error(`search-growth: DP ${data[k].tree[6]} != brute force ${bruteTree(t, 6)}`); });
  const ALL = [...Array(9).keys()].reduce((a, i) => a * (i + 1), 1) / 2; // 9!/2 reachable states
  let d = 10, si = 0;

  const X = (k: number) => PX + (k / D) * PW, Y = (v: number) => PY + PH - (Math.log10(v) / LOGMAX) * PH;
  for (let e = 0; e <= LOGMAX; e++) {
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: Y(10 ** e), y2: Y(10 ** e), class: 'fmg-grid' });
    s(c.svg, 'text', { x: PX - 8, y: Y(10 ** e) + 4, class: 'fg-m', 'text-anchor': 'end' }, e < 3 ? String(10 ** e) : `10${'⁰¹²³⁴⁵⁶'[e]}`);
  }
  for (let k = 0; k <= D; k += 2) s(c.svg, 'text', { x: X(k), y: PY + PH + 16, class: 'fg-m', 'text-anchor': 'middle' }, String(k));
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 32, class: 'fg-m', 'text-anchor': 'end' }, 'depth d (moves)');
  s(c.svg, 'text', { x: PX - 46, y: PY - 12, class: 'fg-t' }, 'Count up to depth d (log scale)');
  s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: Y(ALL), y2: Y(ALL), class: 'fmg-all' });
  s(c.svg, 'text', { x: PX + 6, y: Y(ALL) - 6, class: 'fmg-allt' }, `all reachable states: 9!/2 = ${fmt(ALL)}`);
  s(c.svg, 'text', { x: X(5.6), y: Y(14), class: 'fmg-key fmg-kt' }, '━ tree nodes (tree search)');
  s(c.svg, 'text', { x: X(5.6), y: Y(4.5), class: 'fmg-key fmg-ks' }, '━ states (graph search)');
  const cursor = s(c.svg, 'line', { y1: PY, y2: PY + PH, class: 'fmg-cur' });
  const tree = s(c.svg, 'polyline', { class: 'fmg-tree' }), states = s(c.svg, 'polyline', { class: 'fmg-states' });
  const dotT = s(c.svg, 'circle', { r: 5, class: 'fmg-dt' }), dotS = s(c.svg, 'circle', { r: 5, class: 'fmg-ds' });
  const labT = s(c.svg, 'text', { class: 'fmg-lt' }), labS = s(c.svg, 'text', { class: 'fmg-ls' });

  const RX = 520;
  const boardG = s(c.svg, 'g');
  s(c.svg, 'text', { x: RX, y: 22, class: 'fg-t' }, 'start state');
  const rows = ['tree nodes, depth ≤ d', 'distinct states within d', 'nodes per state'].map((lab, i) => {
    s(c.svg, 'text', { x: RX, y: 160 + i * 50, class: 'fg-m' }, lab);
    return s(c.svg, 'text', { x: RX, y: 183 + i * 50, class: `fmg-v fmg-v${i}` });
  });

  const ctl = bar(c);
  const sl = slider(ctl, 'depth d', 0, D, 1, d, v => { d = v; render(); });
  sl.addEventListener('change', () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`));
  pick(ctl, STARTS.map(([name], k) => [String(k), name]), '0', v => { si = +v; render(); opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`); }, 'Start state');
  for (const v of [5, 10, 12]) btn(ctl, `d = ${v}`, () => { sl.value = String(v); sl.dispatchEvent(new Event('input')); sl.dispatchEvent(new Event('change')); });

  function render() {
    const { tree: T, states: S } = data[si];
    tree.setAttribute('points', T.map((v, k) => `${X(k)},${Y(v)}`).join(' '));
    states.setAttribute('points', S.map((v, k) => `${X(k)},${Y(v)}`).join(' '));
    for (const [dot, lab, v, dy] of [[dotT, labT, T[d], 18], [dotS, labS, S[d], 20]] as const) {
      dot.setAttribute('cx', String(X(d)));
      dot.setAttribute('cy', String(Y(v)));
      lab.setAttribute('x', String(Math.min(X(d) + 8, PX + PW - 4)));
      lab.setAttribute('y', String(Y(v) + dy));
      lab.setAttribute('text-anchor', X(d) + 60 > PX + PW ? 'end' : 'start');
      lab.textContent = fmt(v);
    }
    cursor.setAttribute('x1', String(X(d)));
    cursor.setAttribute('x2', String(X(d)));
    boardG.replaceChildren();
    board(boardG, RX, 32, STARTS[si][1], 34);
    s(boardG, 'text', { x: RX + 112, y: 54, class: 'fg-m' }, `${actions(STARTS[si][1]).length} moves possible`);
    rows[0].textContent = fmt(T[d]);
    rows[1].textContent = fmt(S[d]);
    rows[2].textContent = (T[d] / S[d]).toFixed(1);
    const over = T.findIndex(v => v > ALL);
    c.cap.innerHTML = md(`From ${STARTS[si][0]}: up to depth **${d}** the search tree has **${fmt(T[d])} nodes** but they hold only **${fmt(S[d])} distinct states**, ` +
      `so on average every state appears **${(T[d] / S[d]).toFixed(1)} times** (every move can be undone, so the tree keeps walking back). ` +
      (over >= 0 ? `From depth ${over} on the tree has more nodes than the whole puzzle has reachable states (${fmt(ALL)}). ` : '') +
      `Graph search stores the reached states to pay only for the lower curve. Change the start: a blank in a corner has only 2 moves, so both curves grow more slowly.`);
  }
  render();
  return { destroy() {} };
}

const CSS = `
.fmg-grid{stroke:var(--border);stroke-dasharray:2 4}
.fmg-all{stroke:var(--bad);stroke-width:1.5;stroke-dasharray:6 4}
.fmg-allt{font:600 11px var(--mono);fill:var(--bad)}
.fmg-cur{stroke:var(--muted);stroke-dasharray:3 3}
.fmg-tree{fill:none;stroke:var(--warn);stroke-width:2.5}
.fmg-states{fill:none;stroke:var(--accent);stroke-width:2.5}
.fmg-dt{fill:var(--warn)}
.fmg-ds{fill:var(--accent)}
.fmg-lt{font:600 12px var(--mono);fill:var(--warn)}
.fmg-ls{font:600 12px var(--mono);fill:var(--accent)}
.fmg-key{font-size:12px}
.fmg-kt{fill:var(--warn)}
.fmg-ks{fill:var(--accent)}
.fmg-v{font:600 16px var(--mono);fill:var(--text)}
.fmg-v0{fill:var(--warn)}
.fmg-v1{fill:var(--accent)}
`;
