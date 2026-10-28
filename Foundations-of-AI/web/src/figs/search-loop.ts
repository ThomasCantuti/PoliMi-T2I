// The tree-search loop of slides p. 98–102 run on a small state space: select from the frontier, goal test at selection,
// expand = generate the children. Generic tree search (no reached table), so a state can sit in several nodes.
import { arrow, bar, card, md, s, style, type FigOptions } from './shell';
import { btn, pick, ticker } from './search-kit';

const POS: Record<string, [number, number]> = { S: [28, 165], A: [92, 92], B: [92, 238], C: [168, 62], D: [168, 178], G: [214, 112] };
const ARCS: [string, string][] = [['S', 'A'], ['S', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'D'], ['C', 'G'], ['D', 'G']];
const GOAL = 'G', TX = 250, TW = 268, TY = 40, TD = 74, CX = 540;
const actions = (st: string) => ARCS.filter(([a]) => a === st).map(([, b]) => b);
const CODE = ['frontier ← [root]', 'LOOP', '  IF frontier empty: failure', '  n ← select(frontier)', '  IF goal(n.state): return n', '  frontier += expand(n)'];

interface TNode { id: number; state: string; parent: number; depth: number; x: number; kids: number[]; exp: number }
interface Ev { line: number; cur: number; gen: number[]; frontier: number[]; nGen: number; nExp: number; cap: string; found: boolean }

/** Run tree search once with a FIFO or LIFO frontier and record one event per line of the loop. */
function trace(lifo: boolean) {
  const nodes: TNode[] = [{ id: 0, state: 'S', parent: -1, depth: 0, x: 0, kids: [], exp: 0 }], evs: Ev[] = [];
  const name = (n: TNode) => `${n.state}${n.id + 1}`;
  let fr = [0], nExp = 0;
  const ev = (line: number, cap: string, cur = -1, gen: number[] = [], found = false) => evs.push({ line, cur, gen, frontier: [...fr], nGen: nodes.length, nExp, cap, found });
  ev(0, '**Start:** the root node S1 (state S) is the only node of the tree and the whole frontier. Press **Run** or **Step**.');
  for (;;) {
    if (!fr.length) { ev(2, '**The frontier is empty: failure.**'); break; }
    const id = lifo ? fr[fr.length - 1] : fr[0], n = nodes[id];
    fr = fr.filter(k => k !== id);
    ev(3, `**Select ${name(n)}**, the ${lifo ? 'last node in (LIFO: depth-first)' : 'first node in (FIFO: breadth-first)'}. It leaves the frontier.`, id);
    if (n.state === GOAL) {
      const path: string[] = [];
      for (let p: TNode | undefined = n; p; p = nodes[p.parent]) path.unshift(p.state);
      const waiting = fr.filter(k => nodes[k].state === GOAL).map(k => name(nodes[k]));
      ev(4, `**Goal test on ${name(n)}: true. Return the solution ${path.join(' → ')}.** ${nExp} nodes expanded, ${nodes.length} generated` +
        (waiting.length ? `; ${waiting.join(', ')} also hold G but were never tested.` : '.'), id, [], true);
      break;
    }
    ev(4, `**Goal test on ${name(n)}: false** (state ${n.state} is not G).`, id);
    n.exp = ++nExp;
    const kids = actions(n.state).map(st => {
      const k: TNode = { id: nodes.length, state: st, parent: id, depth: n.depth + 1, x: 0, kids: [], exp: 0 };
      nodes.push(k);
      n.kids.push(k.id);
      return k.id;
    });
    fr = [...fr, ...(lifo ? [...kids].reverse() : kids)]; // LIFO: the first child is selected first
    const gk = kids.map(k => nodes[k]), goalKid = gk.find(k => k.state === GOAL), twin = gk.find(k => nodes.some(o => o.id < k.id && o.state === k.state));
    ev(5, `**Expand ${name(n)}**: actions(${n.state}) = {${actions(n.state).join(', ')}}, so ${gk.map(name).join(', ') || 'nothing'} ${gk.length === 1 ? 'is' : 'are'} **generated** and join the frontier. ` +
      `${name(n)} is now **expanded**.` + (goalKid ? ` ${name(goalKid)} holds the goal state, but it is **not tested now**: the test comes when it is selected.` : '') +
      (twin && !goalKid ? ` ${name(twin)} holds state ${twin.state} again: a second node for the same state.` : ''), id, kids);
  }
  // tree layout: leaves in order, parents centred over their children
  let leaf = 0;
  const place = (n: TNode): number => (n.x = n.kids.length ? n.kids.map(k => place(nodes[k])).reduce((a, b) => a + b) / n.kids.length : leaf++);
  place(nodes[0]);
  nodes.forEach(n => { n.x = TX + ((n.x + 0.5) / leaf) * TW; });
  return { nodes, evs };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fml-css', CSS);
  const c = card(el, 'simulation', 'The tree-search loop: select, goal test, expand', '0 0 780 330');
  const ah = arrow(c.svg);
  let lifo = false, T = trace(lifo), i = 0;

  s(c.svg, 'text', { x: 12, y: 22, class: 'fg-t' }, 'state space');
  for (const [a, b] of ARCS) {
    const [x1, y1] = POS[a], [x2, y2] = POS[b], d = Math.hypot(x2 - x1, y2 - y1), r = 17 / d;
    s(c.svg, 'line', { x1: x1 + (x2 - x1) * r, y1: y1 + (y2 - y1) * r, x2: x2 - (x2 - x1) * r * 1.2, y2: y2 - (y2 - y1) * r * 1.2, class: 'fg-e', 'marker-end': ah });
  }
  const st: Record<string, SVGGElement> = {};
  for (const k in POS) {
    st[k] = s(c.svg, 'g', { class: `fml-s${k === GOAL ? ' goal' : ''}` });
    s(st[k], 'circle', { cx: POS[k][0], cy: POS[k][1], r: 15 });
    s(st[k], 'text', { x: POS[k][0], y: POS[k][1] + 5 }, k);
  }
  s(c.svg, 'text', { x: TX, y: 22, class: 'fg-t' }, 'search tree');
  const treeG = s(c.svg, 'g');
  CODE.forEach((l, k) => s(c.svg, 'text', { x: CX, y: 34 + k * 22, class: 'fml-code', 'xml:space': 'preserve' }, l));
  const hl = s(c.svg, 'rect', { x: CX - 6, width: 240, height: 20, rx: 4, class: 'fml-hl' });
  c.svg.insertBefore(hl, c.svg.querySelector('.fml-code'));
  const count = [0, 1, 2].map(k => s(c.svg, 'text', { x: CX, y: 192 + k * 22, class: 'fg-t' }));
  s(c.svg, 'text', { x: CX, y: 266, class: 'fg-m' }, 'frontier (next to be selected first)');
  const frT = s(c.svg, 'text', { x: CX, y: 288, class: 'fml-fr' });
  s(c.svg, 'text', { x: 12, y: 318, class: 'fg-m' }, 'dashed = generated, in the frontier · grey = expanded · blue = selected now · subscript = node number · badge = expansion order');

  const ctl = bar(c);
  const run = btn(ctl, '', () => { if (tick.on) return tick.stop(); if (i === T.evs.length - 1) i = 0; tick.start(); }, 'primary');
  btn(ctl, 'Step ▶', () => { tick.stop(); if (i < T.evs.length - 1) { i++; render(true); } });
  btn(ctl, '↺ Reset', () => { tick.stop(); i = 0; render(); });
  pick(ctl, [['fifo', 'frontier: FIFO queue (breadth-first)'], ['lifo', 'frontier: LIFO stack (depth-first)']], 'fifo', v => { tick.stop(); lifo = v === 'lifo'; T = trace(lifo); i = 0; render(); }, 'Strategy');
  const speed = pick(ctl, [['1800', 'slow'], ['1100', 'normal'], ['500', 'fast']], '1100', () => {}, 'Speed');
  const tick = ticker(() => { i++; render(true); return i < T.evs.length - 1; }, () => +speed.value, () => render());

  function render(say = false) {
    const e = T.evs[i], fr = new Set(e.frontier);
    treeG.replaceChildren();
    const shown = T.nodes.slice(0, e.nGen), y = (n: TNode) => TY + 18 + n.depth * TD;
    for (const n of shown) if (n.parent >= 0) {
      const p = T.nodes[n.parent];
      s(treeG, 'line', { x1: p.x, y1: y(p) + 16, x2: n.x, y2: y(n) - 16, class: `fg-e${e.gen.includes(n.id) ? ' cur' : ''}` });
    }
    for (const n of shown) {
      const done = n.exp > 0 && n.exp <= e.nExp, cls = n.id === e.cur ? (e.found ? 'found' : 'cur') : done ? 'exp' : fr.has(n.id) ? 'fr' : '';
      const g = s(treeG, 'g', { class: `fml-n ${cls}${e.gen.includes(n.id) ? ' new' : ''}` });
      s(g, 'circle', { cx: n.x, cy: y(n), r: 16 });
      s(g, 'text', { x: n.x - 3, y: y(n) + 5 }, n.state);
      s(g, 'text', { x: n.x + 6, y: y(n) + 9, class: 'fml-id' }, String(n.id + 1));
      if (done) { s(g, 'circle', { cx: n.x + 16, cy: y(n) - 15, r: 8, class: 'fml-badge' }); s(g, 'text', { x: n.x + 16, y: y(n) - 11, class: 'fml-ord' }, String(n.exp)); }
    }
    for (const k in st) st[k].classList.toggle('cur', e.cur >= 0 && T.nodes[e.cur].state === k);
    hl.setAttribute('y', String(34 + e.line * 22 - 15));
    count[0].textContent = `generated: ${e.nGen} nodes`;
    count[1].textContent = `expanded: ${e.nExp} nodes`;
    count[2].textContent = `in the frontier: ${e.frontier.length}`;
    const order = lifo ? [...e.frontier].reverse() : e.frontier;
    frT.textContent = order.length ? order.map(k => `${T.nodes[k].state}${k + 1}`).join('  ') : '(empty)';
    c.cap.innerHTML = md(e.cap);
    run.textContent = tick.on ? '⏸ Pause' : i === T.evs.length - 1 ? '⏵ Run again' : i ? '⏵ Continue' : '⏵ Run';
    if (say) opts.onEvent?.(`[${c.title}] ${e.cap}`);
  }
  render();
  return { destroy: () => tick.stop() };
}

const CSS = `
.fml-s circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .25s,stroke .25s}
.fml-s text{font-size:13px;font-weight:700;fill:var(--text);text-anchor:middle}
.fml-s.goal circle{stroke:var(--ok)}
.fml-s.cur circle{fill:var(--accent-soft);stroke:var(--accent);stroke-width:3}
.fml-n circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2}
.fml-n text{font-size:14px;font-weight:700;fill:var(--text);text-anchor:middle}
.fml-n .fml-id{font:600 9.5px var(--mono);fill:var(--muted)}
.fml-n .fml-ord{font:700 10.5px var(--mono);fill:var(--text)}
.fml-n .fml-badge{fill:var(--panel-3);stroke:var(--border-strong);stroke-width:1}
.fml-n.fr circle{fill:var(--panel);stroke:var(--warn);stroke-dasharray:4 3}
.fml-n.exp circle{fill:var(--v-explored);stroke:var(--v-explored)}
.fml-n.cur circle{fill:var(--accent);stroke:var(--accent)}
.fml-n.cur text,.fml-n.found text{fill:#fff}
.fml-n.found circle{fill:var(--ok);stroke:var(--ok)}
.fml-n.new circle{stroke-width:3}
.fml-code{font:12.5px var(--mono);fill:var(--text-2);white-space:pre}
.fml-hl{fill:var(--accent-soft);stroke:var(--accent);transition:y .25s}
.fml-fr{font:600 14px var(--mono);fill:var(--warn)}
`;
