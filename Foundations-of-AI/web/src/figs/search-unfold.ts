// The state space is implicit (slides p. 57–68): starting from the slides' 8-puzzle state, actions() and result() generate it
// ring by ring (ring d = states d moves away). Nothing is stored in advance; the counter compares the part built with 9!/2.
import { actions, board, flat, result, type Tiles } from './search-8puzzle';
import { bar, card, md, s, style, type FigOptions } from './shell';
import { btn, fmt, pick, ticker } from './search-kit';

const START: Tiles = [8, 2, 7, 3, 4, 0, 5, 1, 6], DMAX = 8, CX = 220, CY = 168, RING = 18.5;
const ALL = 181440; // 9!/2, the states reachable from any given one
interface St { t: Tiles; d: number; x: number; y: number }

/** BFS over the implicit graph; positions on concentric rings, children kept near their parent. */
function unfold() {
  const at = new Map<string, St>([[START.join(''), { t: START, d: 0, x: CX, y: CY }]]), order = [START.join('')], edges: [string, string, boolean][] = [];
  const ring: string[][] = [[START.join('')]];
  for (let i = 0; i < order.length; i++) {
    const u = at.get(order[i])!;
    if (u.d === DMAX) continue;
    for (const a of actions(u.t)) {
      const t = result(u.t, a), key = t.join('');
      const fresh = !at.has(key);
      if (fresh) { at.set(key, { t, d: u.d + 1, x: 0, y: 0 }); order.push(key); (ring[u.d + 1] ??= []).push(key); }
      if (at.get(key)!.d > u.d) edges.push([order[i], key, fresh]); // fresh: the first path to that state
    }
  }
  // radial tree layout over the first-discovery edges: each subtree gets a wedge proportional to its leaves
  const kids = new Map<string, string[]>();
  for (const [a, b, first] of edges) if (first) kids.set(a, [...(kids.get(a) ?? []), b]);
  const leaves = new Map<string, number>(), count = (k: string): number => {
    const n = (kids.get(k) ?? []).reduce((acc, c) => acc + count(c), 0) || 1;
    leaves.set(k, n);
    return n;
  };
  count(order[0]);
  const place = (k: string, a0: number, a1: number) => {
    const v = at.get(k)!, ang = (a0 + a1) / 2;
    if (v.d) { v.x = CX + v.d * RING * Math.cos(ang); v.y = CY + v.d * RING * Math.sin(ang); }
    let a = a0;
    for (const c of kids.get(k) ?? []) { const w = ((a1 - a0) * leaves.get(c)!) / leaves.get(k)!; place(c, a, a + w); a += w; }
  };
  place(order[0], -Math.PI / 2, 1.5 * Math.PI);
  return { at, order: order.filter(k => at.get(k)!.d < DMAX), ring, edges };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fmu-css', CSS);
  const c = card(el, 'simulation', 'The state space is never stored: actions() and result() unfold it on demand', '0 0 780 340');
  const U = unfold();
  let i = 0, said = '';
  for (let d = 1; d <= DMAX; d++) s(c.svg, 'circle', { cx: CX, cy: CY, r: d * RING, class: 'fmu-ring' });
  const eG = s(c.svg, 'g'), nG = s(c.svg, 'g');
  const dots = new Map<string, SVGCircleElement>(), lines = U.edges.map(([a, b, first]) => {
    const p = U.at.get(a)!, q = U.at.get(b)!;
    return { a, b, first, el: s(eG, 'line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: 'fmu-e hide' }) };
  });
  for (const [key, v] of U.at) dots.set(key, s(nG, 'circle', { cx: v.x, cy: v.y, r: v.d ? 3.2 : 6, class: 'fmu-n hide' }));
  s(c.svg, 'text', { x: CX, y: CY + DMAX * RING + 18, class: 'fg-m', 'text-anchor': 'middle' }, `ring d = states d moves from the start (d ≤ ${DMAX})`);
  const RX = 470, side = s(c.svg, 'g');
  const cnt = [0, 1, 2].map(k => s(c.svg, 'text', { x: RX, y: 258 + k * 20, class: k ? 'fg-t' : 'fg-h2' }));
  s(c.svg, 'rect', { x: RX, y: 314, width: 290, height: 8, rx: 4, class: 'fmu-track' });
  const fill = s(c.svg, 'rect', { x: RX, y: 314, height: 8, rx: 4, class: 'fmu-fill' });
  const grow = (U.ring[DMAX].length / U.ring[1].length) ** (1 / (DMAX - 1)); // average growth of a ring per move

  const ctl = bar(c);
  const run = btn(ctl, '', () => { if (tick.on) return tick.stop(); if (i >= U.order.length) i = 0; tick.start(); }, 'primary');
  btn(ctl, 'Step ▶', () => { tick.stop(); if (i < U.order.length) { i++; render(); } });
  btn(ctl, '↺ Reset', () => { tick.stop(); i = 0; render(); });
  const speed = pick(ctl, [['1200', 'slow: one state at a time'], ['250', 'normal'], ['16', 'fast']], '250', () => {}, 'Speed');
  const tick = ticker(() => { i++; render(); return i < U.order.length; }, () => +speed.value, () => render());

  function render() {
    const known = new Set<string>([U.order[0]]), cur = i ? U.order[i - 1] : '';
    for (const key of U.order.slice(0, i)) for (const a of actions(U.at.get(key)!.t)) known.add(result(U.at.get(key)!.t, a).join(''));
    for (const [key, el] of dots) el.setAttribute('class', `fmu-n${known.has(key) ? '' : ' hide'}${U.order.indexOf(key) < i && key !== cur ? ' done' : ''}${key === cur ? ' cur' : ''}`);
    const expanded = new Set(U.order.slice(0, i));
    for (const l of lines) l.el.setAttribute('class', `fmu-e${l.first ? '' : ' x'}${expanded.has(l.a) ? '' : ' hide'}${l.a === cur ? ' now' : ''}`);
    side.replaceChildren();
    const u = cur ? U.at.get(cur)! : U.at.get(U.order[0])!;
    s(side, 'text', { x: RX, y: 22, class: 'fg-t' }, cur ? 'expanding the blue state s' : 'start state s₀');
    board(s(side, 'g', { transform: `translate(${RX},30) scale(0.86)` }), 0, 0, u.t, 30);
    s(side, 'text', { x: RX + 92, y: 56, class: 'fg-m' }, flat(u.t));
    s(side, 'text', { x: RX + 92, y: 76, class: 'fg-m' }, `${u.d} move${u.d === 1 ? '' : 's'} from s₀`);
    if (cur) {
      const acts = actions(u.t);
      s(side, 'text', { x: RX, y: 128, class: 'fmu-code' }, `actions(s) = {${acts.join(', ')}}`);
      s(side, 'text', { x: RX, y: 148, class: 'fg-m' }, 'successors s′ = result(s, a):');
      acts.forEach((a, k) => {
        const x = RX + k * 76;
        s(side, 'text', { x: x + 30, y: 168, class: 'fmu-code', 'text-anchor': 'middle' }, a);
        board(s(side, 'g', { transform: `translate(${x},174) scale(0.6)` }), 0, 0, result(u.t, a), 34);
      });
    }
    const n = known.size;
    cnt[0].textContent = `${fmt(n)} state${n === 1 ? '' : 's'} generated`;
    cnt[1].textContent = `${fmt(i)} expanded (actions + result called on them)`;
    cnt[2].textContent = `${(100 * n / ALL).toFixed(n < 182 ? 3 : 2)}% of the ${fmt(ALL)} reachable states`;
    fill.setAttribute('width', String(Math.max(2, (290 * n) / ALL)));
    run.textContent = tick.on ? '⏸ Pause' : i >= U.order.length ? '⏵ Run again' : i ? '⏵ Continue' : '⏵ Run';
    const ringDone = U.ring.findIndex((keys, d) => d && keys.some(k => !known.has(k))) - 1, full = ringDone < 0 ? DMAX : ringDone;
    const [stage, text] = !i
      ? ['idle', `**Only the start state exists.** The program knows how to compute \`actions(s)\` and \`result(s, a)\`, nothing else. Press **Run**: each step expands one state (breadth-first) and its successors appear on the next ring.`]
      : i < U.order.length
      ? [`r${full}`, `**${full ? `All states within ${full} move${full > 1 ? 's' : ''} are known` : 'Unfolding the first ring'}.** Every dot was produced by \`result(s, a)\` from a dot one ring in; ` +
        `the graph exists only as far as it has been generated. A ring is only about ×${grow.toFixed(1)} the previous one: many moves lead back to a state already generated.`]
      : ['done', `**${fmt(n)} states within ${DMAX} moves, ${(100 * n / ALL).toFixed(2)}% of the ${fmt(ALL)} states reachable from the start** (9!/2: the other half of the 9! arrangements is unreachable). ` +
        'The whole space was never built: that is the point of search, to reach a goal while generating only a small part of the graph.'];
    if (stage === said) return;
    said = stage;
    c.cap.innerHTML = md(text);
    if (stage !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }
  render();
  return { destroy: () => tick.stop() };
}

const CSS = `
.fmu-ring{fill:none;stroke:var(--border);stroke-dasharray:2 4}
.fmu-e{stroke:var(--v-edge);stroke-width:1;opacity:.7;transition:opacity .3s}
.fmu-e.x{opacity:.18}
.fmu-e.now{stroke:var(--accent);stroke-width:2.2;opacity:1}
.fmu-n{fill:var(--warn);transition:opacity .3s}
.fmu-n.done{fill:var(--v-explored)}
.fmu-n.cur{fill:var(--accent);r:6}
.fmu-code{font:600 12.5px var(--mono);fill:var(--accent)}
.fmu-track{fill:var(--panel-3)}
.fmu-fill{fill:var(--accent)}
`;
