/*
 * gametree.ts — minimax, alpha-beta and expectiminimax on an explicit game tree.
 *
 * The algorithms replicate the slides exactly: MINIMAX-SEARCH (p. 354-355) and ALPHA-BETA-SEARCH
 * (Figure 6.7, p. 368): children left to right, v/move updated only on strict improvement,
 * α ← max(α, v) at MAX, β ← min(β, v) at MIN, cut-off when v ≥ β (MAX) or v ≤ α (MIN).
 * Chance nodes: v = Σ P(r)·value(r) (p. 400); their children are searched with a full (−∞, +∞) window,
 * and with a known utility range they can be cut off with bounds (p. 398-399).
 */
import type { Preset, VizInstance, VizOptions } from './types';

/**
 * A game-tree node:
 *  - `number`                                 leaf, utility for MAX
 *  - `[node, …]`                              internal node; the root is MAX, then MIN/MAX alternate
 *  - `{ type: 'max' | 'min', label?, children }`
 *  - `{ type: 'chance', label?, children: [{ p, node } | node, …] }`   (missing p → uniform)
 *  - `{ value, label? }`                      leaf with a label
 * Nested lists below a chance node continue the alternation of the chance node's parent
 * (MAX → chance → MIN → chance → MAX …, Figure 5.13).
 * Internal nodes without a label get letters in breadth-first order (A = root, as in Figure 6.5);
 * leaves are named after their parent + position (B1, B2, …).
 */
export type GameTreeNode =
  | number
  | GameTreeNode[]
  | { value: number; label?: string }
  | { type: 'max' | 'min'; label?: string; children: GameTreeNode[] }
  | { type: 'chance'; label?: string; children: (ChanceOutcome | GameTreeNode)[] };

export interface ChanceOutcome { p?: number; node: GameTreeNode }

export interface GameTreeConfig {
  /** default 'minimax'; 'expectiminimax' is the same as 'minimax' on a tree with chance nodes */
  algorithm?: 'minimax' | 'alphabeta' | 'expectiminimax';
  tree: GameTreeNode;
  /** alphabeta only: known utility range → chance nodes can be pruned with bounds (slides p. 398-399) */
  range?: [number, number];
  /** predict + alphabeta: also ask the (α, β) every MAX/MIN node receives */
  askAlphaBeta?: boolean;
}

const FIG52: GameTreeNode = [[3, 12, 8], [2, 4, 6], [14, 5, 2]];

export const PRESETS: Preset<GameTreeConfig>[] = [
  { name: 'Figure 5.2 – minimax on a 3 × 3 tree', topic: 'adversarial',
    config: { algorithm: 'minimax', tree: FIG52 } },
  { name: 'Figure 6.5 – alpha-beta on the same tree', topic: 'adversarial',
    config: { algorithm: 'alphabeta', tree: FIG52 } },
  { name: 'Slide p. 376 – alpha-beta, depth 6', topic: 'adversarial',
    config: { algorithm: 'alphabeta', tree: [
      [[[[[0, 5], [-3, 3]], [[3], [-3, 0, 2], [-2, 3]]]], [[[[5, 2], [5, -5]]], [[[0, 1]]]]],
      [[[[[5, 1], [-3, 0]]], [[[-5, 5]], [[-3, 3]]]], [[[[2]]]]]] } },
  { name: 'Move ordering – slide p. 378', topic: 'adversarial',
    config: { algorithm: 'alphabeta', tree: [[10], [11, 0]] } },
  { name: 'Move ordering homework – slide p. 379', topic: 'adversarial',
    config: { algorithm: 'alphabeta', tree: [[[10, 6], [100, 8]], [[1, 2], [20, 4]]] } },
  { name: 'Expectimax – slide p. 393', topic: 'adversarial',
    config: { algorithm: 'expectiminimax', tree: { type: 'max', children: [
      { type: 'chance', children: [{ p: 0.5, node: 10 }, { p: 0.5, node: 10 }] },
      { type: 'chance', children: [{ p: 0.5, node: 9 }, { p: 0.5, node: 100 }] }] } } },
  { name: 'Expectiminimax – values matter, p. 397', topic: 'adversarial',
    config: { algorithm: 'expectiminimax', tree: { type: 'max', children: [
      { type: 'chance', children: [{ p: 0.9, node: [2, 2] }, { p: 0.1, node: [3, 3] }] },
      { type: 'chance', children: [{ p: 0.9, node: [1, 1] }, { p: 0.1, node: [4, 4] }] }] } } },
  { name: 'Chance-node pruning, range [0, 15] – p. 399', topic: 'adversarial',
    config: { algorithm: 'alphabeta', range: [0, 15], tree: { type: 'max', children: [
      { type: 'chance', children: [3, 12, 9] }, { type: 'chance', children: [2, 4, 6] },
      { type: 'chance', children: [0, 6, 15] }] } } },
];

// ------------------------------------------------------------------ model

type NodeType = 'max' | 'min' | 'chance' | 'leaf';
type Algorithm = 'minimax' | 'alphabeta';
const TYPES: Record<NodeType, string> = { max: 'MAX', min: 'MIN', chance: 'CHANCE', leaf: 'leaf' };
const INF = Infinity;

export interface TNode {
  id: number;
  parent: number | null;
  p: number;             // probability (children of chance nodes), else 1
  children: number[];
  depth: number;
  type: NodeType;
  value: number;         // leaves only
  fixed?: string;        // label from the config
  name: string;
}

type Question =
  | { type: 'value'; node: number; answer: number }
  | { type: 'prune'; node: number; answer: boolean; why?: string }
  | { type: 'ab'; node: number; answer: [number, number] };

/** 0 unvisited · 1 on the call stack · 2 done · 3 pruned */
type Status = 0 | 1 | 2 | 3;

export interface Step {
  kind: 'enter' | 'update' | 'prune' | 'done';
  cur: number;
  edge: number | null;   // child whose incoming edge is highlighted
  text: string;
  ptext: string;         // predict mode: same event without the running value v (it is being asked)
  qs: Question[];
  stack: number[];
  evaluated: number;
  status: Status[];
  v: (number | null)[];
  a: (number | null)[];
  b: (number | null)[];
  bound: string[];       // '≤' / '≥' for nodes that were cut off
  why: string[];         // pruned child → reason
  best: (number | null)[];
}

const fmt = (x: number | null | undefined): string => x == null ? '' : x === INF ? '+∞' : x === -INF ? '−∞'
  : String(Math.round(x * 100) / 100).replace('-', '−');
/** probabilities: short decimals as on the slides (.5, .9), otherwise a fraction (1/3, 1/36) */
const fmtP = (p: number): string => {
  if (Math.abs(p * 1000 - Math.round(p * 1000)) > 1e-9) {
    for (let d = 2; d <= 36; d++) if (Math.abs(p * d - Math.round(p * d)) < 1e-9) return `${Math.round(p * d)}/${d}`;
  }
  return String(Math.round(p * 1000) / 1000).replace(/^0\./, '.');
};

const isLeafSpec = (x: GameTreeNode): x is number | { value: number; label?: string } =>
  typeof x === 'number' || (typeof x === 'object' && !Array.isArray(x) && 'value' in x);
const isOutcome = (x: ChanceOutcome | GameTreeNode): x is ChanceOutcome =>
  typeof x === 'object' && !Array.isArray(x) && 'node' in x;

/** Flatten the config tree into nodes[] (preorder ids, root = 0). */
export function normalize(tree: GameTreeNode): TNode[] {
  const nodes: TNode[] = [];
  const add = (x: GameTreeNode, defType: NodeType, parent: number | null, p: number): number => {
    const id = nodes.length;
    const n: TNode = { id, parent, p, children: [], depth: parent == null ? 0 : nodes[parent].depth + 1,
      type: 'leaf', value: 0, name: '' };
    nodes.push(n);
    if (isLeafSpec(x)) {
      n.value = Number(typeof x === 'number' ? x : x.value);
      if (typeof x !== 'number') n.fixed = x.label;
      return id;
    }
    const kids: (ChanceOutcome | GameTreeNode)[] = Array.isArray(x) ? x : x.children ?? [];
    n.type = Array.isArray(x) ? defType : x.type;
    if (!Array.isArray(x)) n.fixed = x.label;
    const above: NodeType = parent == null ? 'max' : nodes[parent].type;
    const childDef: NodeType = n.type === 'max' ? 'min' : n.type === 'min' ? 'max' : above === 'min' ? 'max' : 'min';
    const given = kids.map(k => n.type === 'chance' && isOutcome(k) && k.p != null ? Number(k.p) : null);
    const missing = given.filter(g => g == null).length;
    const rest = Math.max(0, 1 - given.reduce<number>((s, g) => s + (g ?? 0), 0));
    kids.forEach((k, i) => {
      const inner = isOutcome(k) ? k.node : k;
      const prob = n.type === 'chance' ? given[i] ?? rest / missing : 1;
      n.children.push(add(inner, childDef, id, prob));
    });
    if (!n.children.length) n.type = 'leaf';
    return id;
  };
  add(tree, 'max', null, 1);
  relabel(nodes);
  return nodes;
}

function letters(i: number): string {
  let s = '';
  for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s;
  return s;
}

/** Breadth-first letters for internal nodes, parent+index for leaves (call after any reorder). */
function relabel(nodes: TNode[]): void {
  let q = [0], k = 0;
  while (q.length) {
    const nq: number[] = [];
    for (const id of q) {
      const n = nodes[id];
      if (n.type !== 'leaf') n.name = n.fixed ?? letters(k++);
      nq.push(...n.children);
    }
    q = nq;
  }
  for (const n of nodes) if (n.type === 'leaf') {
    const par = n.parent == null ? null : nodes[n.parent];
    n.name = n.fixed ?? (par ? par.name + (par.children.indexOf(n.id) + 1) : 'leaf');
  }
}

function exactValue(nodes: TNode[], id: number): number {
  const n = nodes[id];
  if (n.type === 'leaf') return n.value;
  const vs = n.children.map(c => exactValue(nodes, c));
  if (n.type === 'max') return Math.max(...vs);
  if (n.type === 'min') return Math.min(...vs);
  return n.children.reduce((s, c, i) => s + nodes[c].p * vs[i], 0);
}

/**
 * Run the algorithm and record a snapshot after every event.
 * Step kinds: 'enter' (internal node called), 'update' (a child returned, parent's v/α/β updated),
 * 'prune' (cut-off of the remaining children), 'done'. `qs` = questions asked in predict mode before the step.
 */
export function solve(nodes: TNode[], algorithm: Algorithm, range: [number, number] | null = null, askAB = false) {
  const N = nodes.length, ab = algorithm === 'alphabeta';
  const st = {
    status: Array<Status>(N).fill(0), v: Array<number | null>(N).fill(null), a: Array<number | null>(N).fill(null),
    b: Array<number | null>(N).fill(null), bound: Array<string>(N).fill(''), why: Array<string>(N).fill(''),
    best: Array<number | null>(N).fill(null), evaluated: 0,
  };
  const stack: number[] = [], steps: Step[] = [], leaves: number[] = [];
  let pending: Question[] = [];
  const emit = (kind: Step['kind'], cur: number, text: string, edge: number | null, qs: Question[] = [], ptext = text) => {
    steps.push({ kind, cur, edge, text, ptext, qs: pending.concat(qs), stack: stack.slice(), evaluated: st.evaluated,
      status: st.status.slice(), v: st.v.slice(), a: st.a.slice(), b: st.b.slice(),
      bound: st.bound.slice(), why: st.why.slice(), best: st.best.slice() });
    pending = [];
  };
  const markPruned = (id: number): void => { st.status[id] = 3; nodes[id].children.forEach(markPruned); };

  function value(id: number, α: number, β: number): number {
    const n = nodes[id];
    if (n.type === 'leaf') { st.evaluated++; leaves.push(id); st.status[id] = 2; st.v[id] = n.value; return n.value; }
    stack.push(id); st.status[id] = 1;
    const isMax = n.type === 'max', isMin = n.type === 'min', isCh = n.type === 'chance';
    let v = isMax ? -INF : isMin ? INF : 0;
    st.v[id] = v;
    if (ab) { st.a[id] = α; st.b[id] = β; }
    emit('enter', id, `Enter ${n.name} (${TYPES[n.type]})` + (ab && !isCh ? ` with α = ${fmt(α)}, β = ${fmt(β)}` : '') +
      (isCh ? ', v = Σ P·value of its outcomes' : `, v = ${fmt(v)}`), id,
      ab && askAB && !isCh ? [{ type: 'ab', node: id, answer: [α, β] }] : []);
    for (let i = 0; i < n.children.length; i++) {
      const c = n.children[i], cn = nodes[c];
      const v2 = isCh ? value(c, -INF, INF) : value(c, α, β);
      let t = cn.type === 'leaf' ? `Leaf ${cn.name} = ${fmt(v2)}` : `${cn.name} returns ${st.bound[c]}${fmt(v2)}`;
      let pt = `${t} → back to ${n.name}`;
      if (isMax || isMin) {
        const better = isMax ? v2 > v : v2 < v, op = isMax ? 'max' : 'min';
        if (better) {
          t += ` → ${n.name}: v = ${op}(${fmt(v)}, ${fmt(v2)}) = ${fmt(v2)}`; v = v2; st.best[id] = c;
          if (ab && isMax && v > α) { α = v; t += `, α = ${fmt(α)}`; pt += `, α = ${fmt(α)}`; }
          if (ab && isMin && v < β) { β = v; t += `, β = ${fmt(β)}`; pt += `, β = ${fmt(β)}`; }
        } else t += ` → ${n.name}: v stays ${fmt(v)}`;
      } else {
        const nv = v + cn.p * v2;
        t += ` → ${n.name}: v = ${fmt(v)} + ${fmtP(cn.p)} × ${fmt(v2)} = ${fmt(nv)}`; v = nv;
        pt += ` (weight ${fmtP(cn.p)})`;
      }
      st.v[id] = v; if (ab) { st.a[id] = α; st.b[id] = β; }
      emit('update', id, t, c, cn.type !== 'leaf' ? [{ type: 'value', node: c, answer: v2 }] : [], pt);
      if (i === n.children.length - 1 || !ab) continue;
      let cut: { sym: string; val: number; why: string; text: string } | null = null;
      if (isMax && v >= β) cut = { sym: '≥', val: v, why: `v = ${fmt(v)} ≥ β = ${fmt(β)}`,
        text: `${n.name} (MAX) has v = ${fmt(v)} ≥ β = ${fmt(β)}: the MIN player above already has a choice worth ${fmt(β)}, so it will never let play reach ${n.name} → prune the remaining children` };
      if (isMin && v <= α) cut = { sym: '≤', val: v, why: `v = ${fmt(v)} ≤ α = ${fmt(α)}`,
        text: `${n.name} (MIN) has v = ${fmt(v)} ≤ α = ${fmt(α)}: the MAX player above already has a move worth ${fmt(α)}, so ${n.name} can only be worse → prune the remaining children` };
      if (isCh && range) {
        const rest = n.children.slice(i + 1).reduce((s, k) => s + nodes[k].p, 0);
        const hi = v + rest * range[1], lo = v + rest * range[0];
        if (hi <= α) cut = { sym: '≤', val: hi, why: `v ≤ ${fmt(hi)} ≤ α = ${fmt(α)}`,
          text: `${n.name}: even if every unseen outcome scored the maximum ${fmt(range[1])}, v ≤ ${fmt(v)} + ${fmtP(rest)} × ${fmt(range[1])} = ${fmt(hi)} ≤ α = ${fmt(α)} → prune the remaining outcomes` };
        else if (lo >= β) cut = { sym: '≥', val: lo, why: `v ≥ ${fmt(lo)} ≥ β = ${fmt(β)}`,
          text: `${n.name}: even if every unseen outcome scored the minimum ${fmt(range[0])}, v ≥ ${fmt(v)} + ${fmtP(rest)} × ${fmt(range[0])} = ${fmt(lo)} ≥ β = ${fmt(β)} → prune the remaining outcomes` };
      }
      if (cut) {
        const rest = n.children.slice(i + 1);
        rest.forEach(markPruned);
        rest.forEach(k => { st.why[k] = cut.why; });
        st.bound[id] = cut.sym; v = cut.val; st.v[id] = v;
        emit('prune', id, cut.text, rest[0], [{ type: 'prune', node: id, answer: true, why: cut.why }]);
        break;
      }
      // only ask when a cut-off was actually possible (MIN with α = −∞ or MAX with β = +∞ can never prune)
      const possible = isMax ? β !== INF : isMin ? α !== -INF : !!range && (α !== -INF || β !== INF);
      if (possible) pending.push({ type: 'prune', node: id, answer: false });
    }
    stack.pop(); st.status[id] = 2; st.v[id] = v;
    return v;
  }

  const val = value(0, -INF, INF);
  const best = st.best[0];
  const nLeaves = nodes.filter(n => n.type === 'leaf').length;
  emit('done', 0, `Done: the value of ${nodes[0].name} is ${fmt(val)}` +
    (best != null ? `; best move → ${nodes[best].name}` : '') + ` (${st.evaluated} of ${nLeaves} leaves evaluated)`,
    best, nodes[0].type === 'leaf' ? [] : [{ type: 'value', node: 0, answer: val }]);
  return { steps, value: val, move: best, evaluated: leaves.map(id => nodes[id].value) };
}

// ------------------------------------------------------------------ view

const CSS = `
.gt{display:flex;flex-direction:column;gap:12px;outline:none;font-size:13.5px;color:var(--text)}
.gt-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.gt-sp{flex:1}
.gt-seg{display:inline-flex;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;background:var(--panel-2)}
.gt-seg button{border:0;background:transparent;padding:5px 10px;cursor:pointer;color:var(--text-2);font-size:12.5px;transition:background .12s,color .12s}
.gt-seg button+button{border-left:1px solid var(--border)}
.gt-seg button:hover{background:var(--panel-3)}
.gt-seg button.on{background:var(--accent-soft);color:var(--text)}
.gt-lbl{font-size:12px;color:var(--muted)}
.gt-canvas{position:relative;overflow-x:auto;overflow-y:hidden;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);scrollbar-width:thin}
.gt-canvas svg{display:block;font-family:var(--font)}
.gt-edge{stroke:var(--border-strong);stroke-width:1.4;transition:stroke .25s,stroke-width .25s,opacity .25s}
.gt-edge.vis{stroke:var(--text-2);stroke-width:1.8}
.gt-edge.cur{stroke:var(--accent);stroke-width:2.6}
.gt-edge.pr{stroke:var(--v-pruned);stroke-dasharray:4 4}
.gt-edge.best{stroke:var(--ok);stroke-width:3.4}
.gt-cut{opacity:0;transition:opacity .25s;pointer-events:none}
.gt-cut.on{opacity:1}
.gt-cut line{stroke:var(--bad);stroke-width:2.4;stroke-linecap:round}
.gt-cut text{font:600 12px var(--mono);fill:var(--bad);paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round}
.gt-p{font:12px var(--mono);fill:var(--muted);paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round}
.gt-n{transition:transform .45s cubic-bezier(.2,.7,.2,1),opacity .25s}
.gt-n .sh{fill:var(--panel-2);stroke-width:1.8;transition:fill .25s,stroke .25s}
.gt-n.max .sh{stroke:var(--v-max)} .gt-n.min .sh{stroke:var(--v-min)} .gt-n.chance .sh{stroke:var(--v-chance)}
.gt-n.s1.max .sh{fill:color-mix(in srgb,var(--v-max) 26%,var(--panel))}
.gt-n.s1.min .sh{fill:color-mix(in srgb,var(--v-min) 26%,var(--panel))}
.gt-n.s1.chance .sh{fill:color-mix(in srgb,var(--v-chance) 26%,var(--panel))}
.gt-n.s2.max .sh{fill:var(--v-max)} .gt-n.s2.min .sh{fill:var(--v-min)} .gt-n.s2.chance .sh{fill:var(--v-chance)}
.gt-n .nm{font-size:12px;font-weight:650;fill:var(--text-2);pointer-events:none}
.gt-n.s2 .nm{fill:#fff}
.gt-n .val{font:700 13.5px var(--mono);pointer-events:none;paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round}
.gt-n.max .val{fill:var(--v-max)} .gt-n.min .val{fill:var(--v-min)} .gt-n.chance .val{fill:var(--v-chance)}
.gt-n .ab{font:12px var(--mono);pointer-events:none;paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round}
.gt-n .ab .al{fill:var(--v-max)} .gt-n .ab .be{fill:var(--v-min)}
.gt-n.leaf .sh{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.2}
.gt-n.leaf .lv{font:600 13px var(--mono);fill:var(--text-2);pointer-events:none}
.gt-n.leaf.s2 .sh{fill:var(--panel-3);stroke:var(--text-2)}
.gt-n.leaf.s2 .lv{fill:var(--text)}
.gt-n.s3{opacity:.32}
.gt-n.s3 .sh{stroke-dasharray:3 3}
.gt-n.cur .sh{stroke:var(--accent);stroke-width:2.6}
.gt-n.ask .sh{stroke:var(--warn);stroke-width:2.8}
.gt-n.edit{cursor:pointer}
.gt-n.edit:hover .sh{stroke:var(--accent)}
.gt-ring{fill:none;stroke:var(--accent);stroke-width:2;opacity:0;transition:transform .35s cubic-bezier(.2,.7,.2,1),opacity .2s;pointer-events:none}
.gt-ring.on{opacity:.5}
.gt-ring.best{stroke:var(--ok);opacity:.8}
.gt-info{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,260px);gap:12px}
@media (max-width:700px){.gt-info{grid-template-columns:1fr}}
.gt-card{border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);padding:10px 12px;min-width:0}
.gt-card h4{margin:0 0 6px;font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.gt-step{min-height:42px;line-height:1.5}
.gt-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.gt-stack{width:100%;border-collapse:collapse;font:12.5px var(--mono)}
.gt-stack td,.gt-stack th{padding:3px 6px;text-align:left;border-bottom:1px solid var(--border)}
.gt-stack th{font:600 12px var(--font);color:var(--muted)}
.gt-stack tr:last-child td{border-bottom:0}
.gt-stack .al{color:var(--v-max)} .gt-stack .be{color:var(--v-min)} .gt-stack .ty{color:var(--muted);font-size:12px}
.gt-empty{color:var(--muted);font-size:12.5px}
.gt-ctl{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.gt-ctl .btn{padding:6px 10px}
.gt-ctl svg{width:15px;height:15px;display:block}
.gt-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted);align-items:center}
.gt-legend svg{vertical-align:-2px;margin-right:4px}
.gt-q{border:1px solid var(--border);border-left:3px solid var(--warn);border-radius:var(--radius);background:var(--panel);padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.gt-q.idle{border-left-color:var(--border-strong)}
.gt-q.good{border-left-color:var(--ok)}
.gt-q-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.gt-q-title{font-weight:600}
.gt-q-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.gt-q-row input[type=text]{width:92px;font-family:var(--mono)}
.gt-q-msg{font-size:13px;color:var(--text-2)}
.gt-q-msg:empty{display:none}
.gt-q-msg.bad{color:var(--bad)} .gt-q-msg.ok{color:var(--ok)}
.gt-shake{animation:gt-shake .38s}
@keyframes gt-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.gt-edit-in{position:absolute;width:58px;font:600 13px var(--mono);text-align:center;padding:3px 4px;z-index:2}
`;

const ICON = {
  back: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>',
  step: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3v10l8.5-5z"/></svg>',
  pause: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx=".8"/><rect x="9" y="3" width="3" height="10" rx=".8"/></svg>',
  reset: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.5v3h3"/></svg>',
};

const SVGNS = 'http://www.w3.org/2000/svg';
function S<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e;
}
function H<T extends HTMLElement = HTMLElement>(html: string): T {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as T;
}
const esc = (s: string): string => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));

function parseNum(raw: string): number {
  const s = raw.trim().replace(/−/g, '-').replace(/\s+/g, '').toLowerCase();
  if (/^\+?(inf|infinity|∞)$/.test(s)) return INF;
  if (/^-(inf|infinity|∞)$/.test(s)) return -INF;
  const m = s.match(/^(-?\d*\.?\d+)\/(\d*\.?\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return s === '' ? NaN : Number(s);
}
const same = (a: number, b: number) => a === b || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.011);

interface NodeEls {
  g: SVGGElement; title: SVGTitleElement; sh: SVGGeometryElement;
  lv?: SVGTextElement; nm?: SVGTextElement; val?: SVGTextElement; al?: SVGTSpanElement; be?: SVGTSpanElement;
  edge?: SVGLineElement; cut?: SVGGElement; cutLine?: SVGLineElement; cutText?: SVGTextElement; prob?: SVGTextElement;
}

export function mount(el: HTMLElement, config: GameTreeConfig, opts: VizOptions = {}): VizInstance {
  if (!document.getElementById('viz-gametree-css')) {
    document.head.appendChild(Object.assign(document.createElement('style'), { id: 'viz-gametree-css', textContent: CSS }));
  }
  const predict = opts.mode === 'predict';
  const onEvent = opts.onEvent ?? (() => {});
  const treeSpec: GameTreeNode = config.tree ?? FIG52;
  let algorithm: Algorithm = config.algorithm === 'alphabeta' ? 'alphabeta' : 'minimax';
  const range = Array.isArray(config.range) ? [Number(config.range[0]), Number(config.range[1])] as [number, number] : null;
  let askAB = !!config.askAlphaBeta;
  let nodes = normalize(treeSpec);
  const hasChance = nodes.some(n => n.type === 'chance');
  let trace: Step[] = [], idx = 0, timer: number | null = null, speed = 1, order = 'original', lastW = 0;
  // predict state
  const answered = new Set<string>();  // `${step}:${question}`
  let correct = 0, total = 0, doneFired = false, firstTry = true, qMsg = '', qMsgCls = '', qMsgPrev = false;

  el.innerHTML = '';
  const root = H(`<div class="gt" tabindex="0"></div>`);
  el.appendChild(root);

  // ---- toolbar
  const bar = H(`<div class="gt-bar"></div>`);
  const algName = (a: Algorithm) => a === 'alphabeta' ? 'Alpha-beta' : hasChance ? 'Expectiminimax' : 'Minimax';
  if (!predict) {
    bar.append(H(`<div class="gt-seg" data-k="alg"><button data-v="minimax">${algName('minimax')}</button><button data-v="alphabeta">Alpha-beta</button></div>`),
      H(`<div class="gt-seg" data-k="ord" title="Order in which children are examined"><button data-v="original">Original order</button><button data-v="shuffle">Shuffle</button><button data-v="best">Best ordering</button></div>`),
      H(`<span class="gt-sp"></span>`), H(`<span class="gt-lbl">Click a leaf to edit its value</span>`));
  } else {
    bar.append(H(`<span class="chip">${algName(algorithm)} · predict</span>`));
    if (algorithm === 'alphabeta') bar.append(H(`<label class="gt-lbl" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-k="askab"${askAB ? ' checked' : ''}> also ask α, β at each node</label>`));
    bar.append(H(`<span class="gt-sp"></span>`), H(`<span class="chip" data-k="score"></span>`));
  }
  root.append(bar);

  // ---- canvas
  const canvas = H(`<div class="gt-canvas"></div>`);
  root.append(canvas);
  const svg = S('svg', { role: 'img', 'aria-label': 'game tree' }, canvas);
  const gEdges = S('g', {}, svg), gProbs = S('g', {}, svg);
  const ring = S('circle', { r: 24, class: 'gt-ring' }, svg);
  const gNodes = S('g', {}, svg), gCuts = S('g', {}, svg);

  // ---- predict card
  const qcard = predict ? H(`<div class="gt-q idle"></div>`) : null;
  if (qcard) root.append(qcard);

  // ---- info
  const info = H(`<div class="gt-info">
    <div class="gt-card"><h4>Current step</h4><div class="gt-step"></div><div class="gt-meta"></div></div>
    <div class="gt-card"><h4>Call stack</h4><div class="gt-stk"></div></div></div>`);
  root.append(info);
  const stepEl = info.querySelector<HTMLElement>('.gt-step')!, metaEl = info.querySelector<HTMLElement>('.gt-meta')!;
  const stkEl = info.querySelector<HTMLElement>('.gt-stk')!;

  // ---- controls + legend
  const ctl = H(`<div class="gt-bar">
    <div class="gt-ctl">
      <button class="btn" data-a="back" title="Back (←)" aria-label="Back">${ICON.back}</button>
      <button class="btn primary" data-a="step" title="Step (→)" aria-label="Step">${ICON.step}</button>
      <button class="btn" data-a="play" title="Play / pause (space)" aria-label="Play">${ICON.play}</button>
      <button class="btn" data-a="reset" title="Reset" aria-label="Reset">${ICON.reset}</button>
      <select data-a="speed" title="Speed" aria-label="Speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select>
    </div><span class="gt-sp"></span>
    <div class="gt-legend">
      <span><svg width="14" height="12"><path d="M7 1 13 11H1z" fill="var(--v-max)"/></svg>MAX</span>
      <span><svg width="14" height="12"><path d="M7 11 13 1H1z" fill="var(--v-min)"/></svg>MIN</span>
      ${hasChance ? '<span><svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="var(--v-chance)"/></svg>chance</span>' : ''}
      <span><svg width="14" height="12"><rect x="1" y="2" width="12" height="9" rx="2" fill="none" stroke="var(--v-node-stroke)"/></svg>leaf</span>
      ${algorithm === 'alphabeta' || !predict ? '<span><svg width="18" height="12"><path d="M1 6h16" stroke="var(--v-pruned)" stroke-width="2" stroke-dasharray="3 3"/></svg>pruned</span>' : ''}
    </div></div>`);
  root.append(ctl);
  const btnBack = ctl.querySelector<HTMLButtonElement>('[data-a="back"]')!;
  const btnStep = ctl.querySelector<HTMLButtonElement>('[data-a="step"]')!;
  const btnPlay = ctl.querySelector<HTMLButtonElement>('[data-a="play"]')!;

  // ---- persistent SVG elements (updated in place so CSS transitions animate)
  let els: NodeEls[] = [];
  function buildSvg(): void {
    for (const g of [gEdges, gCuts, gProbs, gNodes]) g.textContent = '';
    els = nodes.map(n => {
      const g = S('g', { class: `gt-n ${n.type}` }, gNodes);
      const title = S('title', {}, g);
      let e: NodeEls;
      if (n.type === 'leaf') {
        e = { g, title, sh: S('rect', { class: 'sh', y: -12, height: 24, rx: 6 }, g) };
        e.lv = S('text', { class: 'lv', 'text-anchor': 'middle', y: 4.5 }, g);
      } else {
        const sh = n.type === 'max' ? S('path', { class: 'sh', d: 'M0 -15 L17 13 L-17 13 Z', 'stroke-linejoin': 'round' }, g)
          : n.type === 'min' ? S('path', { class: 'sh', d: 'M0 15 L17 -13 L-17 -13 Z', 'stroke-linejoin': 'round' }, g)
          : S('circle', { class: 'sh', r: 14 }, g);
        e = { g, title, sh };
        e.nm = S('text', { class: 'nm', 'text-anchor': 'middle', y: n.type === 'max' ? 8 : n.type === 'min' ? -1.5 : 4.2 }, g);
        e.val = S('text', { class: 'val', x: 27, y: 5 }, g);
        const ab = S('text', { class: 'ab', 'text-anchor': 'end' }, g);
        e.al = S('tspan', { class: 'al', x: -27, y: -2 }, ab);
        e.be = S('tspan', { class: 'be', x: -27, dy: 14 }, ab);
      }
      if (n.parent != null) {
        e.edge = S('line', { class: 'gt-edge' }, gEdges);
        e.cut = S('g', { class: 'gt-cut' }, gCuts);
        e.cutLine = S('line', {}, e.cut);
        e.cutText = S('text', {}, e.cut);
        if (nodes[n.parent].type === 'chance') { e.prob = S('text', { class: 'gt-p', 'text-anchor': 'middle' }, gProbs); e.prob.textContent = fmtP(n.p); }
      }
      g.addEventListener('click', () => onNodeClick(n.id));
      return e;
    });
    setTexts();
  }
  function setTexts(): void {
    nodes.forEach((n, i) => {
      const e = els[i];
      if (n.type === 'leaf' && e.lv) {
        e.lv.textContent = fmt(n.value);
        const w = Math.max(30, fmt(n.value).length * 8.2 + 12);
        e.sh.setAttribute('x', String(-w / 2)); e.sh.setAttribute('width', String(w));
      } else if (e.nm) e.nm.textContent = n.name;
    });
  }

  // ---- layout in pixel space (the SVG is never scaled, so text stays ≥ 12px; wide trees scroll)
  let pos: [number, number][] = [];
  function layout(): void {
    const avail = Math.max(320, canvas.clientWidth || el.clientWidth || 600);
    const ux: number[] = [], depthMax = Math.max(...nodes.map(n => n.depth));
    let k = 0;
    const walk = (id: number): void => {
      const n = nodes[id];
      if (!n.children.length) { ux[id] = k++; return; }
      n.children.forEach(walk);
      ux[id] = (ux[n.children[0]] + ux[n.children[n.children.length - 1]]) / 2;
    };
    walk(0);
    const L = Math.max(1, k), pad = 58;
    const gap = Math.min(110, Math.max(36, (avail - 2 * pad) / Math.max(1, L - 1)));
    const W = Math.max(avail, 2 * pad + (L - 1) * gap);
    const x0 = (W - (L - 1) * gap) / 2, levelH = depthMax > 4 ? 66 : 84, top = 36;
    const height = top + depthMax * levelH + 30;
    svg.setAttribute('width', String(W)); svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${W} ${height}`);
    pos = nodes.map(n => [x0 + ux[n.id] * gap, top + n.depth * levelH]);
    nodes.forEach((n, i) => {
      const e = els[i], [x, y] = pos[i];
      e.g.style.transform = `translate(${x}px,${y}px)`;
      if (n.parent == null || !e.edge || !e.cutLine || !e.cutText) return;
      const [px, py] = pos[n.parent];
      const y1 = py + 13, y2 = y - (n.type === 'leaf' ? 12 : 14);
      e.edge.setAttribute('x1', String(px)); e.edge.setAttribute('y1', String(y1));
      e.edge.setAttribute('x2', String(x)); e.edge.setAttribute('y2', String(y2));
      const t = e.prob ? .3 : .4, cx = px + (x - px) * t, cy = y1 + (y2 - y1) * t, dx = x - px, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len * 7, ny = dx / len * 7;
      e.cutLine.setAttribute('x1', String(cx - nx)); e.cutLine.setAttribute('y1', String(cy - ny));
      e.cutLine.setAttribute('x2', String(cx + nx)); e.cutLine.setAttribute('y2', String(cy + ny));
      e.cutText.setAttribute('x', String(cx + 10)); e.cutText.setAttribute('y', String(cy + 4));
      if (e.prob) {
        e.prob.setAttribute('x', String(px + (x - px) * .66 + (x < px ? -14 : x > px ? 14 : 16)));
        e.prob.setAttribute('y', String(y1 + (y2 - y1) * .66 + 4));
      }
    });
    render(false);
  }

  // ---- trace
  function rebuild(keep = false): void {
    stop();
    trace = solve(nodes, algorithm, range, askAB).steps;
    if (!keep) { idx = 0; answered.clear(); correct = 0; total = 0; doneFired = false; qMsg = ''; qMsgCls = ''; firstTry = true; }
    idx = Math.min(idx, trace.length - 1);
    render(true);
  }
  const leafCount = () => nodes.filter(n => n.type === 'leaf').length;

  // ---- predict
  interface Pending { q: Question; qi: number; step: number }
  function pendingQ(): Pending | null {
    if (!predict || idx + 1 >= trace.length) return null;
    const s = trace[idx + 1];
    for (let qi = 0; qi < s.qs.length; qi++) if (!answered.has(`${idx + 1}:${qi}`)) return { q: s.qs[qi], qi, step: idx + 1 };
    return null;
  }
  function reasonFor(q: Question): string {
    const n = nodes[q.node], s = trace[idx];
    if (q.type === 'value') {
      if (n.type === 'chance') return `${n.name} is a chance node: its value is the probability-weighted sum Σ P·value of its outcomes.`;
      const kids = n.children.filter(c => s.status[c] === 2).map(c => fmt(s.v[c]));
      const cutNote = s.bound[q.node] ? ' — it was cut off early, so it returns its current v' : '';
      return `${n.name} is a ${TYPES[n.type]} node: it returns the ${n.type === 'max' ? 'largest' : 'smallest'} value among its evaluated children (${kids.join(', ')})${cutNote}.`;
    }
    if (q.type === 'prune') {
      if (n.type === 'chance') return q.answer
        ? 'Bound it: even if every unseen outcome got the best possible value, the chance node could not beat α.'
        : 'Even with the best possible unseen outcomes the bound still beats α, so the remaining outcomes could matter.';
      const rule = n.type === 'max' ? `MAX prunes when v ≥ β (here v = ${fmt(s.v[q.node])}, β = ${fmt(s.b[q.node])})`
        : `MIN prunes when v ≤ α (here v = ${fmt(s.v[q.node])}, α = ${fmt(s.a[q.node])})`;
      return q.answer ? `It should prune: ${rule}.` : `Not yet: ${rule}.`;
    }
    const p = n.parent == null ? null : nodes[n.parent];
    return `A node receives α and β from its parent${p ? ' ' + p.name : ''} as they are right now (α only grows at MAX nodes, β only shrinks at MIN nodes).`;
  }
  function answerText(q: Question): string {
    if (q.type === 'value') return `${nodes[q.node].name} = ${fmt(q.answer)}`;
    if (q.type === 'prune') return q.answer ? `prune (${q.why ?? ''})` : 'no pruning, keep searching';
    return `α = ${fmt(q.answer[0])}, β = ${fmt(q.answer[1])}`;
  }
  function resolveQ(p: Pending, ok: boolean): void {
    answered.add(`${p.step}:${p.qi}`);
    total++; if (ok && firstTry) correct++;
    const what = p.q.type === 'value' ? 'value of ' : p.q.type === 'prune' ? 'pruning at ' : 'α/β of ';
    onEvent(`Predicted ${what}${nodes[p.q.node].name}: ${ok ? (firstTry ? 'correct' : 'correct after retry') : 'revealed'} (${answerText(p.q)})`);
    qMsg = ok ? `Correct — ${answerText(p.q)}.` : `Answer: ${answerText(p.q)}. ${reasonFor(p.q)}`;
    qMsgCls = ok ? 'ok' : 'bad'; qMsgPrev = true;
    firstTry = true;
    if (!pendingQ()) go(idx + 1); else render(false);
  }
  function check(p: Pending, given: (string | boolean)[]): void {
    const q = p.q;
    const ok = q.type === 'value' ? same(parseNum(String(given[0])), q.answer)
      : q.type === 'prune' ? given[0] === q.answer
      : same(parseNum(String(given[0])), q.answer[0]) && same(parseNum(String(given[1])), q.answer[1]);
    if (ok) return resolveQ(p, true);
    firstTry = false;
    qMsg = reasonFor(q); qMsgCls = 'bad'; qMsgPrev = false;
    renderQ();
    if (qcard) { qcard.classList.remove('gt-shake'); void qcard.offsetWidth; qcard.classList.add('gt-shake'); }
  }
  function renderQ(): void {
    if (!qcard) return;
    const p = pendingQ();
    const score = root.querySelector('[data-k="score"]');
    if (score) score.textContent = `First try: ${correct} / ${total}`;
    qcard.className = 'gt-q ' + (p ? '' : qMsgCls === 'ok' ? 'good' : 'idle');
    if (!p) {
      const end = idx >= trace.length - 1;
      qcard.innerHTML = `<div class="gt-q-head"><span class="gt-q-title">${end ? 'Trace complete' : 'Step through the search'}</span></div>
        <div class="gt-q-msg ${qMsgCls}">${esc(qMsg || (end ? '' : 'Press → or Step. Before key moments you will be asked to predict what the algorithm does.'))}</div>
        ${end ? `<div class="gt-q-msg">You predicted <b>${correct}</b> of <b>${total}</b> correctly on the first try.</div>` : ''}`;
      return;
    }
    const n = nodes[p.q.node];
    let title: string, body: string;
    if (p.q.type === 'value') {
      title = `What value does ${n.name} (${TYPES[n.type]}) return?`;
      body = `<input type="text" inputmode="decimal" placeholder="value" aria-label="value"> <button class="btn primary sm" data-q="check">Check</button>`;
    } else if (p.q.type === 'prune') {
      title = `${n.name} (${TYPES[n.type]}) just updated. Does it cut off its remaining ${n.type === 'chance' ? 'outcomes' : 'children'} now?`;
      body = `<button class="btn sm" data-q="yes">Yes, prune</button> <button class="btn sm" data-q="no">No, keep searching</button>`;
    } else {
      title = `Which α and β does ${n.name} (${TYPES[n.type]}) receive?`;
      body = `<span class="gt-lbl">α</span><input type="text" placeholder="e.g. −inf" aria-label="alpha"> <span class="gt-lbl">β</span><input type="text" placeholder="e.g. +inf" aria-label="beta"> <button class="btn primary sm" data-q="check">Check</button>`;
    }
    qcard.innerHTML = `<div class="gt-q-head"><span class="chip">Predict</span><span class="gt-q-title">${esc(title)}</span></div>
      <div class="gt-q-row">${body}<span class="gt-sp"></span><button class="btn ghost sm" data-q="reveal">Reveal</button></div>
      <div class="gt-q-msg ${qMsgCls}">${qMsg && qMsgPrev ? 'Previous question: ' : ''}${esc(qMsg)}</div>`;
    const inputs = [...qcard.querySelectorAll('input')];
    const submit = () => check(p, inputs.map(i => i.value));
    qcard.querySelector('[data-q="check"]')?.addEventListener('click', submit);
    inputs.forEach(i => i.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); submit(); } }));
    qcard.querySelector('[data-q="yes"]')?.addEventListener('click', () => check(p, [true]));
    qcard.querySelector('[data-q="no"]')?.addEventListener('click', () => check(p, [false]));
    qcard.querySelector('[data-q="reveal"]')?.addEventListener('click', () => resolveQ(p, false));
    if (inputs[0] && root.contains(document.activeElement)) inputs[0].focus({ preventScroll: true });
  }

  // ---- render one snapshot
  function render(fire: boolean): void {
    if (!trace.length || !els.length) return;
    const s = trace[idx], ask = pendingQ(), abAlg = algorithm === 'alphabeta';
    let lastCut = -1;  // parent of the most recent cut-off: only its reason is written on the tree
    for (let j = idx; j >= 0; j--) if (trace[j].kind === 'prune') { lastCut = trace[j].cur; break; }
    nodes.forEach((n, i) => {
      const e = els[i], st = s.status[i];
      e.g.setAttribute('class', `gt-n ${n.type} s${st}` + (s.cur === i && s.kind !== 'done' ? ' cur' : '') +
        (ask && ask.q.node === i ? ' ask' : '') + (!predict && n.type === 'leaf' ? ' edit' : ''));
      if (e.val && e.al && e.be) {
        // predict mode hides running values: a node's value appears once it is final
        const vv = s.v[i];
        const show = vv != null && (st === 2 || (st === 1 && !predict && Number.isFinite(vv)));
        e.val.textContent = show ? (s.bound[i] || '') + fmt(vv) : '';
        const showAB = abAlg && st === 1 && n.type !== 'chance';
        e.al.textContent = showAB ? `α ${fmt(s.a[i])}` : '';
        e.be.textContent = showAB ? `β ${fmt(s.b[i])}` : '';
      }
      const why = st === 3 ? s.why[i] : '';
      e.title.textContent = `${n.name} (${TYPES[n.type]}${n.type === 'leaf' ? ' = ' + fmt(n.value) : ''})` + (why ? ` — pruned because ${why}` : '');
      if (e.edge && e.cut && e.cutText) {
        const best = s.kind === 'done' && n.parent === 0 && s.best[0] === i;
        e.edge.setAttribute('class', 'gt-edge' + (st === 3 ? ' pr' : st ? ' vis' : '') + (s.edge === i && s.kind !== 'done' ? ' cur' : '') + (best ? ' best' : ''));
        e.cut.setAttribute('class', 'gt-cut' + (why ? ' on' : ''));
        // write the reason only next to the first pruned child of the latest cut-off (hover shows the others)
        const first = why && n.parent === lastCut && nodes[lastCut].children.find(c => s.status[c] === 3) === i;
        e.cutText.textContent = first ? why.replace(/^v = /, '').replace(/^v /, '') : '';
      }
    });
    const target = s.kind === 'done' ? s.best[0] : s.cur;
    const tp = target == null ? null : pos[target];
    if (tp) ring.style.transform = `translate(${tp[0]}px,${tp[1]}px)`;
    ring.setAttribute('class', 'gt-ring' + (tp ? ' on' : '') + (s.kind === 'done' ? ' best' : ''));
    // wide trees scroll: keep the current node in view
    if (tp && canvas.scrollWidth > canvas.clientWidth && (tp[0] < canvas.scrollLeft + 70 || tp[0] > canvas.scrollLeft + canvas.clientWidth - 70)) {
      canvas.scrollTo({ left: tp[0] - canvas.clientWidth / 2, behavior: 'smooth' });
    }

    const text = predict ? s.ptext : s.text;
    stepEl.textContent = text;
    metaEl.innerHTML = `<span class="chip">Step ${idx + 1} / ${trace.length}</span><span class="chip">Leaves evaluated ${s.evaluated} / ${leafCount()}</span>` +
      (s.kind === 'done' && abAlg ? `<span class="chip">Pruned leaves ${leafCount() - s.evaluated}</span>` : '');
    if (!s.stack.length) stkEl.innerHTML = `<div class="gt-empty">${s.kind === 'done' ? 'Search finished.' : 'Empty'}</div>`;
    else {
      stkEl.innerHTML = `<table class="gt-stack"><tr><th>node</th>${abAlg ? '<th>α</th><th>β</th>' : ''}<th>v</th></tr>` +
        s.stack.slice().reverse().map(id => `<tr><td>${esc(nodes[id].name)} <span class="ty">${TYPES[nodes[id].type]}</span></td>` +
          (abAlg ? (nodes[id].type === 'chance' ? '<td colspan="2" class="ty">full window</td>' : `<td class="al">${fmt(s.a[id])}</td><td class="be">${fmt(s.b[id])}</td>`) : '') +
          `<td>${predict ? '?' : fmt(s.v[id])}</td></tr>`).join('') + '</table>';
    }
    btnBack.disabled = idx === 0; btnStep.disabled = idx >= trace.length - 1;
    btnPlay.innerHTML = timer ? ICON.pause : ICON.play;
    root.querySelectorAll<HTMLButtonElement>('.gt-seg[data-k="alg"] button').forEach(b => b.classList.toggle('on', b.dataset.v === algorithm));
    root.querySelectorAll<HTMLButtonElement>('.gt-seg[data-k="ord"] button').forEach(b => b.classList.toggle('on', b.dataset.v === order));
    renderQ();
    if (fire) onEvent(text);
    if (predict && idx === trace.length - 1 && !doneFired && !pendingQ()) {
      doneFired = true; opts.onDone?.({ correct, total });
    }
  }

  function go(i: number): void {
    i = Math.max(0, Math.min(trace.length - 1, i));
    if (i === idx) return render(false);
    const fwd = i > idx;
    idx = i;
    if (!fwd) { qMsg = ''; qMsgCls = ''; }
    render(fwd);
  }
  function step(): boolean {
    if (idx >= trace.length - 1) { stop(); return false; }
    if (pendingQ()) {
      stop(); render(false);
      qcard?.querySelector<HTMLElement>('input, .gt-q-row .btn')?.focus({ preventScroll: true });
      return false;
    }
    if (predict) { qMsg = ''; qMsgCls = ''; }
    go(idx + 1);
    return true;
  }
  function stop(): void { if (timer != null) { clearInterval(timer); timer = null; } }
  function play(): void {
    if (timer != null) { stop(); return render(false); }
    if (idx >= trace.length - 1) go(0);
    timer = window.setInterval(() => { if (!step()) { stop(); render(false); } }, 800 / speed);
    render(false);
  }

  function onNodeClick(id: number): void {
    const n = nodes[id];
    if (predict || n.type !== 'leaf') return;
    stop();
    const [x, y] = pos[id];
    const inp = H<HTMLInputElement>(`<input class="gt-edit-in" type="text" aria-label="leaf value" value="${fmt(n.value).replace('−', '-')}">`);
    inp.style.left = `${x - 29}px`; inp.style.top = `${y - 14}px`;
    canvas.append(inp); inp.focus(); inp.select();
    let done = false;
    const commit = (ok: boolean) => {
      if (done) return; done = true;
      const v = parseNum(inp.value);
      inp.remove();
      if (ok && Number.isFinite(v) && v !== n.value) {
        n.value = v; setTexts(); rebuild(true);
        onEvent(`Edited leaf ${n.name} = ${fmt(v)}`);
      }
      root.focus({ preventScroll: true });
    };
    inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') commit(true); if (ev.key === 'Escape') commit(false); });
    inp.addEventListener('blur', () => commit(true));
  }

  function reorder(kind: string): void {
    order = kind;
    if (kind === 'original') {
      const vals = nodes.map(n => n.value);
      nodes = normalize(treeSpec);
      nodes.forEach((n, i) => { if (n.type === 'leaf') n.value = vals[i]; });  // keep leaf edits (ids are stable)
    } else if (kind === 'shuffle') {
      for (const n of nodes) for (let i = n.children.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [n.children[i], n.children[j]] = [n.children[j], n.children[i]];
      }
    } else {
      const val = nodes.map((_, i) => exactValue(nodes, i));
      for (const n of nodes) {
        if (n.type === 'max') n.children.sort((a, b) => val[b] - val[a]);
        if (n.type === 'min') n.children.sort((a, b) => val[a] - val[b]);
      }
    }
    relabel(nodes);
    setTexts(); layout(); rebuild();
    onEvent(`Children reordered: ${kind === 'best' ? 'best ordering (MAX children by decreasing value, MIN by increasing)' : kind}`);
  }

  // ---- events
  root.addEventListener('click', ev => {
    const b = (ev.target as Element).closest('button');
    if (!b) return;
    const seg = (b.parentElement as HTMLElement | null)?.dataset.k;
    if (seg === 'alg') { algorithm = b.dataset.v === 'alphabeta' ? 'alphabeta' : 'minimax'; rebuild(); }
    else if (seg === 'ord') reorder(b.dataset.v ?? 'original');
    else if (b.dataset.a === 'back') { stop(); go(idx - 1); }
    else if (b.dataset.a === 'step') { stop(); step(); }
    else if (b.dataset.a === 'play') play();
    else if (b.dataset.a === 'reset') rebuild();
  });
  ctl.querySelector('select')!.addEventListener('change', ev => {
    speed = Number((ev.target as HTMLSelectElement).value);
    if (timer != null) { stop(); play(); }
  });
  root.querySelector('[data-k="askab"]')?.addEventListener('change', ev => { askAB = (ev.target as HTMLInputElement).checked; rebuild(); });
  const onKey = (ev: KeyboardEvent) => {
    if ((ev.target as Element).matches('input, select, textarea')) return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); stop(); step(); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); stop(); go(idx - 1); }
    else if (ev.key === ' ') { ev.preventDefault(); play(); }
  };
  root.addEventListener('keydown', onKey);
  const ro = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    if (w && Math.abs(w - lastW) > 4) { lastW = w; layout(); }
  });

  buildSvg();
  trace = solve(nodes, algorithm, range, askAB).steps;
  layout();
  render(true);
  ro.observe(canvas);

  return {
    destroy() { stop(); ro.disconnect(); root.removeEventListener('keydown', onKey); el.innerHTML = ''; },
  };
}
