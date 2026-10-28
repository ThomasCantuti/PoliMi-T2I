// Nodes vs states (slides p. 94–97): the 8-puzzle search tree from the slides' state, every node a path. Click a node to read
// its Node fields and see every other node that holds the same state; the tree has no repeated-state check, as on the slides.
import { actions, board, flat, result, type Tiles } from './search-8puzzle';
import { bar, card, md, s, slider, style, type FigOptions } from './shell';

const START: Tiles = [8, 2, 7, 3, 4, 0, 5, 1, 6], DMAX = 4, TX = 40, TW = 470, TY = 28, ROW = 62;
interface N { id: number; t: Tiles; parent: number; action: string; depth: number; kids: number[]; x: number }

function build() {
  const nodes: N[] = [{ id: 0, t: START, parent: -1, action: '', depth: 0, kids: [], x: 0 }];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.depth < DMAX) for (const a of actions(n.t)) {
      const k: N = { id: nodes.length, t: result(n.t, a), parent: i, action: a, depth: n.depth + 1, kids: [], x: 0 };
      nodes.push(k);
      n.kids.push(k.id);
    }
  }
  return nodes;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fmn-css', CSS);
  const c = card(el, 'interactive', 'One state, many nodes: every node is a path', '0 0 780 330');
  const nodes = build();
  let D = 2, sel = nodes.find(n => n.depth === 2 && n.t.join() === START.join())!.id;
  const treeG = s(c.svg, 'g'), RX = 528, side = s(c.svg, 'g');

  const ctl = bar(c);
  slider(ctl, 'tree depth', 1, DMAX, 1, D, v => { D = v; if (nodes[sel].depth > D) sel = 0; render(); }).addEventListener('change', () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`));

  const key = (n: N) => n.t.join('');
  function layout() {
    let leaf = 0;
    const place = (n: N): number => (n.x = n.depth < D && n.kids.length ? n.kids.map(k => place(nodes[k])).reduce((a, b) => a + b) / n.kids.length : leaf++);
    place(nodes[0]);
    nodes.forEach(n => { n.x = TX + ((n.x + 0.5) / leaf) * TW; });
  }
  function render() {
    layout();
    treeG.replaceChildren();
    const shown = nodes.filter(n => n.depth <= D), me = nodes[sel], twins = shown.filter(n => key(n) === key(me));
    const onPath = new Set<number>();
    for (let k = sel; k >= 0; k = nodes[k].parent) onPath.add(k);
    const y = (n: N) => TY + n.depth * ROW;
    for (let d = 0; d <= D; d++) s(treeG, 'text', { x: 4, y: TY + d * ROW + 4, class: 'fg-m' }, `d = ${d}`);
    for (const n of shown) if (n.parent >= 0) {
      const p = nodes[n.parent];
      s(treeG, 'line', { x1: p.x, y1: y(p), x2: n.x, y2: y(n), class: `fmn-e${onPath.has(n.id) ? ' path' : ''}` });
    }
    const r = D >= 4 ? 3.6 : D === 3 ? 6 : 9;
    for (const n of shown) {
      const cls = n.id === sel ? 'sel' : key(n) === key(me) ? 'twin' : '';
      const g = s(treeG, 'g', { class: `fmn-n ${cls}`, tabindex: 0, role: 'button', 'aria-label': `node ${n.id}: ${flat(n.t)}` });
      s(g, 'circle', { cx: n.x, cy: y(n), r: r + 5, class: 'fmn-hit' });
      s(g, 'circle', { cx: n.x, cy: y(n), r });
      const p = nodes[n.parent], leafRow = n.depth === D;
      if (D <= 2 && n.depth) s(treeG, 'text', leafRow ? { x: n.x, y: y(n) + r + 14, class: 'fmn-a', 'text-anchor': 'middle' }
        : { x: (p.x + n.x) / 2 + (n.x < p.x ? -6 : 6), y: (y(p) + y(n)) / 2 + 4, class: 'fmn-a', 'text-anchor': n.x < p.x ? 'end' : 'start' }, n.action);
      const pickIt = () => { sel = n.id; render(); opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`); };
      g.onclick = pickIt;
      g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickIt(); } };
    }
    side.replaceChildren();
    s(side, 'text', { x: RX, y: 22, class: 'fg-t' }, 'the selected node');
    board(s(side, 'g', { transform: `translate(${RX},30) scale(0.75)` }), 0, 0, me.t, 34);
    const path: string[] = [];
    for (let k = sel; k > 0; k = nodes[k].parent) path.unshift(nodes[k].action);
    const rows: [string, string][] = [['state', flat(me.t)], ['parent', me.parent < 0 ? 'None (the root)' : `node #${me.parent}`], ['action', me.action || 'None'],
      ['path_cost', String(me.depth)], ['depth', String(me.depth)]];
    rows.forEach(([k, v], i) => {
      s(side, 'text', { x: RX, y: 128 + i * 19, class: 'fmn-k' }, `${k} =`);
      s(side, 'text', { x: RX + 88, y: 128 + i * 19, class: 'fmn-v' }, v);
    });
    s(side, 'text', { x: RX, y: 236, class: 'fg-m' }, 'path from the root:');
    s(side, 'text', { x: RX, y: 254, class: 'fmn-v' }, path.length ? path.join(', ') : '(none)');
    s(side, 'text', { x: RX, y: 286, class: 'fmn-tw' }, `${twins.length} node${twins.length > 1 ? 's' : ''} of this tree hold this state`);
    s(side, 'text', { x: RX, y: 304, class: 'fg-m' }, `${shown.length} nodes, ${new Set(shown.map(key)).size} distinct states`);
    c.cap.innerHTML = md(`**Node #${sel}** is the path ${path.length ? path.join(' → ') : '(the root)'}; its state is ${flat(me.t)}. ` +
      (twins.length > 1 ? `The same state sits in **${twins.length} nodes** of this depth-${D} tree (orange): one node per path that reaches it. ` : 'No other node of this tree holds its state. ') +
      (key(me) === key(nodes[0]) && me.depth ? 'Here the moves undo each other and lead back to the initial state, one level deeper: the tree never ends although the state space is finite. ' : '') +
      'Click any node; the slider adds a level.');
  }
  render();
  return { destroy() {} };
}

const CSS = `
.fmn-e{stroke:var(--v-edge);stroke-width:1.5}
.fmn-e.path{stroke:var(--ok);stroke-width:3.5}
.fmn-n{cursor:pointer}
.fmn-n circle:not(.fmn-hit){fill:var(--panel-3);stroke:var(--v-node-stroke);stroke-width:1.5;transition:fill .2s}
.fmn-hit{fill:transparent;stroke:none}
.fmn-n:hover circle:not(.fmn-hit),.fmn-n:focus-visible circle:not(.fmn-hit){stroke:var(--accent);stroke-width:3}
.fmn-n:focus{outline:none}
.fmn-n.twin circle:not(.fmn-hit){fill:var(--warn);stroke:var(--warn)}
.fmn-n.sel circle:not(.fmn-hit){fill:var(--accent);stroke:var(--accent)}
.fmn-a{font:10.5px var(--mono);fill:var(--muted);paint-order:stroke;stroke:var(--panel);stroke-width:3px}
.fmn-k{font:12px var(--mono);fill:var(--muted)}
.fmn-v{font:600 12px var(--mono);fill:var(--text)}
.fmn-tw{font-size:13px;font-weight:650;fill:var(--warn)}
`;
