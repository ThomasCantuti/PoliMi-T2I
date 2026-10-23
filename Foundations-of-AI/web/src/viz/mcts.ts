/*
 * mcts.ts — Monte Carlo Tree Search, step by step (slides p. 413-452, Figure 6.11).
 *
 * Conventions (exactly as in the slides' step-by-step example):
 *  - every node stores W/N = number of playouts won by MAX (the player at the root) / playouts through it;
 *  - SELECTION descends while the node is fully expanded, choosing the child with the largest
 *      UCB1(n) = U(n)/N(n) + C·√(log N(Parent(n)) / N(n))       (log = natural log)
 *    where U(n) is the wins of the player who chooses at the parent: W at MAX nodes, N − W at MIN nodes
 *    (MIN wants MAX to lose — this is what makes the slides pick the 0/1 child in step 10).
 *    Ties go to the leftmost child;
 *  - EXPANSION adds ONE child: the first untried action (left to right);
 *  - SIMULATION: abstract trees use the predetermined playout results of `rollouts`, tic-tac-toe plays
 *    uniformly random moves from a seeded generator;
 *  - BACKPROPAGATION: every node on the path gets N += 1 and W += 1 for a MAX win (0.5 for a draw, 0 for a loss);
 *  - the move returned is the root child with the most playouts.
 * With C = 1 these rules reproduce every choice of the slides' example (C = √2 would pick a2 in step 9).
 */
import type { Preset, VizInstance, VizOptions } from './types';

/** A pre-populated node (W = MAX's wins). `actions` = total legal moves (default: number of children, or `branching` for a leaf). */
export interface MctsNodeSpec { label?: string; W: number; N: number; actions?: number; children?: MctsNodeSpec[] }

export interface MctsConfig {
  game?: 'abstract' | 'tictactoe';   // default 'abstract'
  C?: number;                         // exploration constant (default 1 abstract, 1.41 tic-tac-toe)
  iterations?: number;                // default rollouts.length (abstract) or 12 (tic-tac-toe)
  /** abstract: legal moves of every new node, named a1, a2, … (default 2) */
  branching?: number;
  /** abstract: playout result of each iteration from MAX's point of view: 1 = MAX wins, -1 = MIN wins, 0 = draw */
  rollouts?: number[];
  /** abstract: optional starting tree with statistics (default: the root alone, 0/0) */
  init?: MctsNodeSpec;
  /** tic-tac-toe: 9 chars row by row ('X', 'O', '.'); the player to move (X if counts are equal) is MAX */
  board?: string;
  seed?: number;                      // tic-tac-toe playouts
}

export const PRESETS: Preset<MctsConfig>[] = [
  { name: 'Step-by-step example – slides p. 417-452', topic: 'mcts',
    config: { C: 1, branching: 2, rollouts: [1, -1, -1, 1, -1, 1] } },
  { name: 'UCB1 selection – 70/100, 30/50, 5/10 (p. 428)', topic: 'mcts',
    config: { C: 1.41, branching: 3, rollouts: [1, -1, 1], init: { W: 106, N: 160, children: [
      { W: 70, N: 100 }, { W: 30, N: 50 },
      { W: 6, N: 10, children: [{ W: 3, N: 6 }, { W: 2, N: 3, actions: 3, children: [{ W: 0, N: 1 }, { W: 1, N: 1 }] }] }] } } },
  { name: 'Tic-tac-toe – X must block at c2 (seeded random playouts)', topic: 'mcts',
    config: { game: 'tictactoe', board: 'X..OO.X..', C: 1.41, iterations: 30, seed: 4 } },
];

// ------------------------------------------------------------------ model

interface MNode {
  id: number; parent: number | null; depth: number;
  label: string;           // action that leads here (a2, b3 …)
  name: string;            // path name used in texts
  children: number[];
  untried: string[];       // action labels not expanded yet (left to right)
  board?: string[];        // tic-tac-toe position
  terminal: number | null; // utility for MAX if the game is over here
}
interface UcbRow { id: number; W: number; N: number; exploit: number; explore: number; total: number }
type MQuestion =
  | { type: 'pick'; options: number[]; answer: number; prompt: string; why: string }
  | { type: 'wn'; ids: number[]; answer: [number, number][] };
export interface MStep {
  kind: 'select' | 'expand' | 'simulate' | 'backprop' | 'final';
  phase: 0 | 1 | 2 | 3 | 4;
  iter: number;
  count: number;           // nodes existing in this snapshot
  W: number[]; N: number[];
  path: number[];
  focus: number;
  ucb?: { parent: number; rows: UcbRow[]; chosen: number; min: boolean; Np: number };
  rollout?: { from: number; result: number; moves: number[]; board?: string[] };
  delta?: { id: number; from: [number, number]; to: [number, number] }[];
  text: string;
  q?: MQuestion;
}

const CELL = (i: number) => 'abc'[i % 3] + (Math.floor(i / 3) + 1);
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const winner = (b: string[]) => { for (const [a, c, d] of LINES) if (b[a] !== '.' && b[a] === b[c] && b[a] === b[d]) return b[a]; return null; };
const f3 = (x: number) => Number.isFinite(x) ? (Math.round(x * 1000) / 1000).toFixed(3).replace(/\.?0+$/, '') : '∞';
const wn = (w: number, n: number) => `${Math.round(w * 10) / 10}/${n}`;
const resultText = (r: number) => r > 0 ? 'MAX wins (+1)' : r < 0 ? 'MIN wins (−1)' : 'draw (0)';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Run MCTS and record a snapshot after every phase. */
export function runMcts(cfg: MctsConfig) {
  const ttt = cfg.game === 'tictactoe';
  const C = cfg.C ?? (ttt ? 1.41 : 1);
  const b = Math.max(1, Math.floor(cfg.branching ?? 2));
  const rollouts = cfg.rollouts ?? [1, -1, -1, 1, -1, 1];
  const iters = Math.max(1, Math.min(200, cfg.iterations ?? (ttt ? 12 : rollouts.length)));
  const rng = mulberry32(cfg.seed ?? 1);
  const nodes: MNode[] = [], W: number[] = [], N: number[] = [], steps: MStep[] = [];
  let maxChain = 0;

  // player to move at the root = MAX
  const rootBoard = (cfg.board ?? 'X.O.X.O..').replace(/[^XO.]/gi, '').toUpperCase().padEnd(9, '.').slice(0, 9).split('');
  const nx = rootBoard.filter(c => c === 'X').length, no = rootBoard.filter(c => c === 'O').length;
  const maxP = nx <= no ? 'X' : 'O', minP = maxP === 'X' ? 'O' : 'X';
  const toMove = (depth: number) => depth % 2 === 0 ? maxP : minP;
  const utilityOf = (bd: string[]): number | null => {
    const w = winner(bd);
    if (w) return w === maxP ? 1 : -1;
    return bd.includes('.') ? null : 0;
  };

  const add = (parent: number | null, label: string, board?: string[], actions?: number): number => {
    const id = nodes.length, depth = parent == null ? 0 : nodes[parent].depth + 1;
    const pn = parent == null ? null : nodes[parent];
    const n: MNode = { id, parent, depth, label, name: pn == null ? 'root' : pn.parent == null ? label : `${pn.name}·${label}`,
      children: [], untried: [], board, terminal: null };
    if (ttt && board) {
      n.terminal = utilityOf(board);
      if (n.terminal == null) n.untried = board.flatMap((c, i) => c === '.' ? [CELL(i)] : []);
    } else n.untried = Array.from({ length: actions ?? b }, (_, i) => `a${i + 1}`);
    nodes.push(n); W.push(0); N.push(0);
    pn?.children.push(id);
    return id;
  };
  const child = (p: number, action: string): number => {
    const pn = nodes[p];
    pn.untried = pn.untried.filter(a => a !== action);
    if (!ttt || !pn.board) return add(p, action);
    const bd = pn.board.slice();
    bd['abc'.indexOf(action[0]) + 3 * (Number(action[1]) - 1)] = toMove(pn.depth);
    return add(p, action, bd);
  };

  if (ttt) add(null, 'root', rootBoard);
  else {
    const build = (spec: MctsNodeSpec, parent: number | null, label: string) => {
      const kids = spec.children ?? [];
      const id = add(parent, spec.label ?? label, undefined, spec.actions ?? (kids.length || b));
      W[id] = Number(spec.W) || 0; N[id] = Number(spec.N) || 0;
      kids.forEach((k, i) => {
        const lbl = k.label ?? nodes[id].untried[0] ?? `a${i + 1}`;
        nodes[id].untried = nodes[id].untried.filter(a => a !== lbl);
        build(k, id, lbl);
      });
    };
    build(cfg.init ?? { W: 0, N: 0 }, null, 'root');
  }

  const isMin = (id: number) => nodes[id].depth % 2 === 1;
  const snap = (s: Omit<MStep, 'count' | 'W' | 'N'>) => steps.push({ ...s, count: nodes.length, W: W.slice(), N: N.slice() });
  const ucbRows = (p: number): UcbRow[] => nodes[p].children.map(c => {
    const exploit = (isMin(p) ? N[c] - W[c] : W[c]) / N[c];
    const explore = C * Math.sqrt(Math.log(N[p]) / N[c]);
    return { id: c, W: W[c], N: N[c], exploit: N[c] ? exploit : Infinity, explore: N[c] ? explore : Infinity, total: N[c] ? exploit + explore : Infinity };
  });

  for (let it = 1; it <= iters; it++) {
    let cur = 0;
    const path = [0];
    // --- selection
    while (!nodes[cur].untried.length && nodes[cur].children.length && nodes[cur].terminal == null) {
      const rows = ucbRows(cur);
      let best = rows[0];
      for (const r of rows) if (r.total > best.total + 1e-12) best = r;
      const min = isMin(cur), pn = nodes[cur];
      const fw = (w: number) => String(Math.round(w * 10) / 10);
      const formula = (r: UcbRow) => `UCB1(${nodes[r.id].label}) = ${min ? `(${r.N}−${fw(r.W)})` : fw(r.W)}/${r.N} + ${C}·√(ln ${N[cur]}/${r.N}) = ${f3(r.total)}`;
      const others = rows.filter(r => r !== best).map(formula).join('; ');
      snap({ kind: 'select', phase: 0, iter: it, path: path.concat(best.id), focus: best.id,
        ucb: { parent: cur, rows, chosen: best.id, min, Np: N[cur] },
        text: `Iteration ${it} · Selection at ${pn.name} (${min ? 'MIN' : 'MAX'} to move, N = ${N[cur]}): ${rows.map(r => `${nodes[r.id].label} ${f3(r.total)}`).join(', ')} → ${nodes[best.id].name}`,
        q: rows.length > 1 ? { type: 'pick', options: rows.map(r => r.id), answer: best.id,
          prompt: `Which child of ${pn.name} does UCB1 select?`,
          why: `${formula(best)} is the largest${others ? ` (${others})` : ''}.` } : undefined });
      cur = best.id; path.push(cur);
    }
    // --- expansion
    const sel = nodes[cur];
    let leaf = cur;
    const stopWhy = sel.terminal != null ? `${sel.name} is terminal (${resultText(sel.terminal)}), so there is nothing to expand`
      : `${sel.name} still has untried actions (${sel.untried.join(', ')})`;
    if (sel.terminal == null && sel.untried.length) {
      leaf = child(cur, sel.untried[0]);
      path.push(leaf);
      snap({ kind: 'expand', phase: 1, iter: it, path: path.slice(), focus: leaf,
        text: `Iteration ${it} · Expansion: selection stops at ${sel.name} because ${stopWhy} → add new node ${nodes[leaf].name}` });
    }
    // --- simulation
    let result: number, moves: number[] = [], final: string[] | undefined;
    if (nodes[leaf].terminal != null) result = nodes[leaf].terminal!;
    else if (ttt) {
      const bd = nodes[leaf].board!.slice();
      let d = nodes[leaf].depth, u = utilityOf(bd);
      while (u == null) {
        const empty = bd.flatMap((c, i) => c === '.' ? [i] : []);
        const m = empty[Math.floor(rng() * empty.length)];
        bd[m] = toMove(d++); moves.push(m); u = utilityOf(bd);
      }
      result = u; final = bd;
    } else result = Math.sign(Number(rollouts[(it - 1) % rollouts.length]) || 0);
    maxChain = Math.max(maxChain, Math.min(3, moves.length - 1, ttt ? 9 : 3));
    snap({ kind: 'simulate', phase: 2, iter: it, path: path.slice(), focus: leaf,
      rollout: { from: leaf, result, moves, board: final },
      text: `Iteration ${it} · Simulation: ` + (nodes[leaf].terminal != null ? `${stopWhy}; its utility is the result` :
        (leaf === cur ? `selection stops at ${sel.name}, which has no untried actions; ` : '') +
        `playout from ${nodes[leaf].name}` + (ttt ? ` (${moves.map(m => CELL(m)).join(' ')})` : ' (playout policy)')) + ` → ${resultText(result)}` });
    // --- backpropagation
    const gain = result > 0 ? 1 : result < 0 ? 0 : 0.5;
    const delta = path.map(id => ({ id, from: [W[id], N[id]] as [number, number], to: [W[id] + gain, N[id] + 1] as [number, number] }));
    for (const id of path) { W[id] += gain; N[id] += 1; }
    snap({ kind: 'backprop', phase: 3, iter: it, path: path.slice(), focus: leaf, delta,
      rollout: { from: leaf, result, moves, board: final },
      text: `Iteration ${it} · Backpropagation (${resultText(result)}): ` + delta.map(d => `${nodes[d.id].name} ${wn(...d.from)}→${wn(...d.to)}`).join(', '),
      q: { type: 'wn', ids: path.slice(), answer: delta.map(d => d.to) } });
  }
  // --- final decision
  const kids = nodes[0].children;
  let bestMove = kids[0];
  for (const c of kids) if (N[c] > N[bestMove]) bestMove = c;
  if (kids.length) snap({ kind: 'final', phase: 4, iter: iters, path: [0, bestMove], focus: bestMove,
    text: `Done after ${iters} iterations: MCTS returns ${nodes[bestMove].label}, the root move with the most playouts (N = ${N[bestMove]})`,
    q: kids.length > 1 ? { type: 'pick', options: kids.slice(), answer: bestMove, prompt: `After ${iters} iterations, which move does MCTS return?`,
      why: `MCTS returns the move whose node has the most playouts (Figure 6.11): ${kids.map(c => `${nodes[c].label} N = ${N[c]}`).join(', ')}. Not the best win rate!` } : undefined });
  return { nodes, steps, C, ttt, maxP, minP, rootBoard, maxChain: Math.max(2, maxChain) };
}

// ------------------------------------------------------------------ view

const CSS = `
.mc{display:flex;flex-direction:column;gap:12px;outline:none;font-size:13.5px;color:var(--text)}
.mc-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.mc-sp{flex:1}
.mc-lbl{font-size:12px;color:var(--muted);display:inline-flex;gap:6px;align-items:center}
.mc-lbl input{width:64px;font-family:var(--mono)}
.mc-phases{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.mc-ph{border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 8px;font-size:12.5px;color:var(--muted);background:var(--panel);transition:background .2s,color .2s,border-color .2s;display:flex;gap:6px;align-items:center;min-width:0}
.mc-ph b{font:600 11px var(--mono);border-radius:99px;background:var(--panel-3);width:18px;height:18px;display:inline-grid;place-items:center;flex:none}
.mc-ph span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc-ph.on{border-color:var(--accent);color:var(--text);background:var(--accent-soft)}
.mc-ph.on b{background:var(--accent);color:#fff}
.mc-ph.past{color:var(--text-2)}
@media (max-width:560px){.mc-phases{grid-template-columns:repeat(2,minmax(0,1fr))}}
.mc-canvas{position:relative;overflow-x:auto;overflow-y:hidden;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);scrollbar-width:thin}
.mc-canvas svg{display:block;font-family:var(--font)}
.mc-edge{stroke:var(--border-strong);stroke-width:1.5;transition:stroke .25s,stroke-width .25s,opacity .3s}
.mc-edge.path{stroke:var(--accent);stroke-width:2.6}
.mc-edge.best{stroke:var(--ok);stroke-width:3.2}
.mc-al{font:12px var(--mono);fill:var(--muted);paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round;transition:opacity .3s}
.mc-n{transition:transform .45s cubic-bezier(.2,.7,.2,1),opacity .35s;cursor:default}
.mc-n rect{fill:var(--panel-2);stroke-width:1.6;transition:fill .25s,stroke .25s,stroke-width .25s}
.mc-n.max rect{stroke:var(--v-max)} .mc-n.min rect{stroke:var(--v-min)}
.mc-n text{font:600 12.5px var(--mono);fill:var(--text);pointer-events:none}
.mc-n.path rect{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2.2}
.mc-n.new rect{stroke-dasharray:4 3}
.mc-n.upd rect{fill:var(--ok-soft);stroke:var(--ok);stroke-width:2.2}
.mc-n.best rect{fill:var(--ok-soft);stroke:var(--ok);stroke-width:2.4}
.mc-n.cand{cursor:pointer}
.mc-n.cand rect{stroke:var(--warn);stroke-width:2.4}
.mc-n.cand:hover rect{fill:var(--warn-soft)}
.mc-n.term rect{stroke-dasharray:2 2}
.mc-n.hide{opacity:0;pointer-events:none}
.mc-ro{transition:opacity .3s}
.mc-ro line{stroke:var(--muted);stroke-width:1.4;stroke-dasharray:3 3}
.mc-ro circle{fill:var(--panel);stroke:var(--muted);stroke-width:1.4}
.mc-ro .end{fill:var(--text);stroke:var(--text)}
.mc-ro text{font:700 12px var(--mono);fill:var(--panel)}
.mc-ro .lbl{font:12px var(--font);fill:var(--muted)}
.mc-info{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
@media (max-width:760px){.mc-info{grid-template-columns:1fr}}
.mc-card{border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);padding:10px 12px;min-width:0}
.mc-card h4{margin:0 0 6px;font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.mc-card h4 code{text-transform:none;letter-spacing:0;font:600 12px var(--mono);color:var(--text-2)}
.mc-step{line-height:1.5}
.mc-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.mc-f{font:12.5px var(--mono);color:var(--text-2);margin-bottom:6px;line-height:1.5}
.mc-tbl{width:100%;border-collapse:collapse;font:12.5px var(--mono)}
.mc-tbl td,.mc-tbl th{padding:4px 6px;text-align:right;border-bottom:1px solid var(--border);white-space:nowrap}
.mc-tbl th{font:600 12px var(--font);color:var(--muted)}
.mc-tbl td:first-child,.mc-tbl th:first-child{text-align:left}
.mc-tbl tr:last-child td{border-bottom:0}
.mc-tbl tr.win td{color:var(--ok);font-weight:700}
.mc-tblw{overflow-x:auto}
.mc-note{font-size:12.5px;color:var(--muted);margin-top:6px;line-height:1.45}
.mc-board{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.mc-board svg{flex:none}
.mc-board .g{stroke:var(--border-strong);stroke-width:1.5}
.mc-board .x{font:700 22px var(--mono)}
.mc-board .k{font:600 12px var(--mono);fill:var(--muted)}
.mc-board .co{font:12px var(--mono);fill:var(--muted)}
.mc-ctl{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.mc-ctl .btn{padding:6px 10px}
.mc-ctl svg{width:15px;height:15px;display:block}
.mc-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted);align-items:center}
.mc-legend i{display:inline-block;width:14px;height:10px;border-radius:3px;border:1.6px solid;margin-right:4px;vertical-align:-1px}
.mc-q{border:1px solid var(--border);border-left:3px solid var(--warn);border-radius:var(--radius);background:var(--panel);padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.mc-q.idle{border-left-color:var(--border-strong)}
.mc-q.good{border-left-color:var(--ok)}
.mc-q-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.mc-q-title{font-weight:600}
.mc-q-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.mc-q-wn{display:flex;gap:6px 14px;flex-wrap:wrap}
.mc-q-wn label{display:inline-flex;gap:6px;align-items:center;font:12.5px var(--mono);color:var(--text-2)}
.mc-q-wn input{width:70px;font-family:var(--mono)}
.mc-q-wn input.bad{border-color:var(--bad)}
.mc-q-msg{font-size:13px;color:var(--text-2)}
.mc-q-msg:empty{display:none}
.mc-q-msg.bad{color:var(--bad)} .mc-q-msg.ok{color:var(--ok)}
.mc-shake{animation:mc-shake .38s}
@keyframes mc-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
`;

const ICON = {
  back: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>',
  step: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  skip: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 3.5 8 8l-4.5 4.5M8.5 3.5 13 8l-4.5 4.5"/></svg>',
  play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3v10l8.5-5z"/></svg>',
  pause: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx=".8"/><rect x="9" y="3" width="3" height="10" rx=".8"/></svg>',
  reset: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.5v3h3"/></svg>',
};
const PHASES = ['Selection', 'Expansion', 'Simulation', 'Backpropagation'];

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

interface NodeEls { g: SVGGElement; rect: SVGRectElement; text: SVGTextElement; title: SVGTitleElement; edge?: SVGLineElement; al?: SVGTextElement }

export function mount(el: HTMLElement, config: MctsConfig, opts: VizOptions = {}): VizInstance {
  if (!document.getElementById('viz-mcts-css')) {
    document.head.appendChild(Object.assign(document.createElement('style'), { id: 'viz-mcts-css', textContent: CSS }));
  }
  const predict = opts.mode === 'predict';
  const onEvent = opts.onEvent ?? (() => {});
  const cfg: MctsConfig = { ...config };
  let R = runMcts(cfg);
  let idx = 0, timer: number | null = null, speed = 1, lastW = 0;
  const answered = new Set<number>();
  let correct = 0, total = 0, doneFired = false, firstTry = true, qMsg = '', qMsgCls = '', qMsgPrev = false;

  el.innerHTML = '';
  const root = H(`<div class="mc" tabindex="0"></div>`);
  el.append(root);

  // ---- toolbar
  const bar = H(`<div class="mc-bar"></div>`);
  if (!predict) {
    bar.append(H(`<label class="mc-lbl" title="Exploration constant">C <input type="number" step="0.1" min="0" data-k="C"></label>`),
      H(`<label class="mc-lbl">Iterations <input type="number" min="1" max="200" step="1" data-k="it"></label>`));
    if (R.ttt) bar.append(H(`<label class="mc-lbl" title="Seed of the random playouts">Seed <input type="number" step="1" data-k="seed"></label>`));
  } else bar.append(H(`<span class="chip">MCTS · predict</span>`));
  bar.append(H(`<span class="mc-sp"></span>`), H(`<span class="chip" data-k="iter"></span>`));
  if (predict) bar.append(H(`<span class="chip" data-k="score"></span>`));
  root.append(bar);
  const setInputs = () => {
    const set = (k: string, v: number) => { const i = bar.querySelector<HTMLInputElement>(`[data-k="${k}"]`); if (i) i.value = String(v); };
    set('C', R.C); set('it', R.steps.filter(s => s.kind === 'backprop').length); set('seed', cfg.seed ?? 1);
  };
  setInputs();

  const phases = H(`<div class="mc-phases">${PHASES.map((p, i) => `<div class="mc-ph" data-p="${i}"><b>${i + 1}</b><span>${p}</span></div>`).join('')}</div>`);
  root.append(phases);

  // ---- canvas
  const canvas = H(`<div class="mc-canvas"></div>`);
  root.append(canvas);
  const svg = S('svg', { role: 'img', 'aria-label': 'Monte Carlo search tree' }, canvas);
  const gEdges = S('g', {}, svg), gLabels = S('g', {}, svg), gRoll = S('g', { class: 'mc-ro' }, svg), gNodes = S('g', {}, svg);

  const qcard = predict ? H(`<div class="mc-q idle"></div>`) : null;
  if (qcard) root.append(qcard);

  const info = H(`<div class="mc-info">
    <div class="mc-card"><h4>Current step</h4><div class="mc-step"></div><div class="mc-meta"></div></div>
    <div class="mc-card"><h4 class="mc-ph-title">Details</h4><div class="mc-det"></div></div></div>`);
  root.append(info);
  const stepEl = info.querySelector<HTMLElement>('.mc-step')!, metaEl = info.querySelector<HTMLElement>('.mc-meta')!;
  const detEl = info.querySelector<HTMLElement>('.mc-det')!, detTitle = info.querySelector<HTMLElement>('.mc-ph-title')!;

  const ctl = H(`<div class="mc-bar">
    <div class="mc-ctl">
      <button class="btn" data-a="back" title="Back (←)" aria-label="Back">${ICON.back}</button>
      <button class="btn primary" data-a="step" title="Step (→)" aria-label="Step">${ICON.step}</button>
      ${predict ? '' : `<button class="btn" data-a="iter" title="Jump to the end of this iteration" aria-label="Next iteration">${ICON.skip}</button>`}
      <button class="btn" data-a="play" title="Play / pause (space)" aria-label="Play">${ICON.play}</button>
      <button class="btn" data-a="reset" title="Reset" aria-label="Reset">${ICON.reset}</button>
      <select data-a="speed" title="Speed" aria-label="Speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select>
    </div><span class="mc-sp"></span>
    <div class="mc-legend"><span><i style="border-color:var(--v-max)"></i>MAX to move</span><span><i style="border-color:var(--v-min)"></i>MIN to move</span><span>W/N = MAX's wins / playouts</span>${R.ttt ? '<span>dashed = game over</span>' : ''}</div></div>`);
  root.append(ctl);
  const btnBack = ctl.querySelector<HTMLButtonElement>('[data-a="back"]')!, btnStep = ctl.querySelector<HTMLButtonElement>('[data-a="step"]')!;
  const btnPlay = ctl.querySelector<HTMLButtonElement>('[data-a="play"]')!;

  // ---- persistent SVG elements
  let els: NodeEls[] = [];
  const NODE_H = 26;
  function buildSvg(): void {
    for (const g of [gEdges, gLabels, gNodes]) g.textContent = '';
    els = R.nodes.map(n => {
      const g = S('g', { class: 'mc-n hide' }, gNodes);
      const title = S('title', {}, g);
      const rect = S('rect', { y: -NODE_H / 2, height: NODE_H, rx: 8 }, g);
      const text = S('text', { 'text-anchor': 'middle', y: 4.5 }, g);
      const e: NodeEls = { g, rect, text, title };
      if (n.parent != null) {
        e.edge = S('line', { class: 'mc-edge' }, gEdges);
        e.al = S('text', { class: 'mc-al' }, gLabels);
        e.al.textContent = n.label;
      }
      g.addEventListener('click', () => onPick(n.id));
      return e;
    });
  }

  // ---- layout of the nodes that exist in step s (pixel space; wide trees scroll)
  function layout(s: MStep): [number, number][] {
    const avail = Math.max(320, canvas.clientWidth || el.clientWidth || 600);
    const nodes = R.nodes, ux: number[] = [];
    let k = 0, depthMax = 0;
    const walk = (id: number) => {
      depthMax = Math.max(depthMax, nodes[id].depth);
      const kids = nodes[id].children.filter(c => c < s.count);
      if (!kids.length) { ux[id] = k++; return; }
      kids.forEach(walk);
      ux[id] = (ux[kids[0]] + ux[kids[kids.length - 1]]) / 2;
    };
    walk(0);
    const finalDepth = Math.max(...nodes.map(n => n.depth));
    const gap = Math.min(120, Math.max(66, (avail - 100) / Math.max(1, k - 1)));
    const W = Math.max(avail, 100 + (k - 1) * gap);
    const x0 = (W - (k - 1) * gap) / 2, levelH = 64, top = 26;
    const height = top + finalDepth * levelH + (R.maxChain + 1) * 22 + 46;
    svg.setAttribute('width', String(W)); svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${W} ${height}`);
    return nodes.map(n => [x0 + (ux[n.id] ?? 0) * gap, top + n.depth * levelH]);
  }

  // ---- predict
  function pendingQ(): MQuestion | null {
    if (!predict || idx + 1 >= R.steps.length || answered.has(idx + 1)) return null;
    return R.steps[idx + 1].q ?? null;
  }
  function resolveQ(ok: boolean, msg: string): void {
    answered.add(idx + 1); total++;
    if (ok && firstTry) correct++;
    onEvent(`Prediction ${ok ? (firstTry ? 'correct' : 'correct after retry') : 'revealed'}: ${msg}`);
    qMsg = (ok ? 'Correct — ' : 'Answer: ') + msg; qMsgCls = ok ? 'ok' : 'bad'; qMsgPrev = true; firstTry = true;
    go(idx + 1);
  }
  function wrong(msg: string): void {
    firstTry = false; qMsg = msg; qMsgCls = 'bad'; qMsgPrev = false;
    renderQ();
    if (qcard) { qcard.classList.remove('mc-shake'); void qcard.offsetWidth; qcard.classList.add('mc-shake'); }
  }
  function onPick(id: number): void {
    const q = pendingQ();
    if (!q || q.type !== 'pick' || !q.options.includes(id)) return;
    const name = R.nodes[q.answer].label;
    if (id === q.answer) resolveQ(true, `${name}. ${q.why}`);
    else wrong(`Not ${R.nodes[id].label}. ` + (R.steps[idx + 1].kind === 'final'
      ? 'MCTS does not return the best win rate: look at the number of playouts N.'
      : `Compute UCB1 for every child: U/N with U = ${R.steps[idx + 1].ucb?.min ? 'N − W (MIN chooses here)' : 'W (MAX chooses here)'}, plus C·√(ln N(parent) / N).`));
  }
  function parseWN(s: string): [number, number] | null {
    const m = s.trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+)$/);
    return m ? [Number(m[1]), Number(m[2])] : null;
  }
  function renderQ(): void {
    if (!qcard) return;
    const q = pendingQ(), s = R.steps[idx];
    const score = root.querySelector('[data-k="score"]');
    if (score) score.textContent = `First try: ${correct} / ${total}`;
    qcard.className = 'mc-q ' + (q ? '' : qMsgCls === 'ok' ? 'good' : 'idle');
    const msg = `<div class="mc-q-msg ${qMsgCls}">${qMsg && qMsgPrev && q ? 'Previous question: ' : ''}${esc(qMsg)}</div>`;
    if (!q) {
      const end = idx >= R.steps.length - 1;
      qcard.innerHTML = `<div class="mc-q-head"><span class="mc-q-title">${end ? 'Search complete' : 'Step through the iterations'}</span></div>${msg}` +
        (end ? `<div class="mc-q-msg">You predicted <b>${correct}</b> of <b>${total}</b> correctly on the first try.</div>`
          : qMsg ? '' : `<div class="mc-q-msg">Press → or Step. You will predict every UCB1 choice and every backpropagation update.</div>`);
      return;
    }
    if (q.type === 'pick') {
      const next = R.steps[idx + 1];
      const hint = next.kind === 'final' ? 'Click the root child that MCTS returns.'
        : `Click a highlighted child. C = ${R.C}, N(${R.nodes[next.ucb!.parent].name}) = ${next.ucb!.Np}, ${next.ucb!.min ? 'MIN' : 'MAX'} chooses here.`;
      qcard.innerHTML = `<div class="mc-q-head"><span class="chip">Predict</span><span class="mc-q-title">${esc(q.prompt)}</span></div>
        <div class="mc-q-row"><span class="mc-lbl">${esc(hint)}</span><span class="mc-sp"></span>
        ${q.options.map(o => `<button class="btn sm" data-pick="${o}">${esc(R.nodes[o].label)} · ${wn(s.W[o], s.N[o])}</button>`).join('')}
        <button class="btn ghost sm" data-q="reveal">Reveal</button></div>${msg}`;
      qcard.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach(b => b.addEventListener('click', () => onPick(Number(b.dataset.pick))));
      qcard.querySelector('[data-q="reveal"]')?.addEventListener('click', () => resolveQ(false, `${R.nodes[q.answer].label}. ${q.why}`));
      return;
    }
    const res = s.rollout?.result ?? 0;
    qcard.innerHTML = `<div class="mc-q-head"><span class="chip">Predict</span><span class="mc-q-title">The playout ended with ${esc(resultText(res))}. New W/N of every node on the path?</span></div>
      <div class="mc-q-wn">${q.ids.map((id, i) => `<label>${esc(R.nodes[id].name)} <span style="color:var(--muted)">${wn(s.W[id], s.N[id])} →</span><input type="text" data-i="${i}" placeholder="W/N" aria-label="new W/N of ${esc(R.nodes[id].name)}"></label>`).join('')}</div>
      <div class="mc-q-row"><button class="btn primary sm" data-q="check">Check</button><span class="mc-sp"></span><button class="btn ghost sm" data-q="reveal">Reveal</button></div>${msg}`;
    const inputs = [...qcard.querySelectorAll<HTMLInputElement>('input')];
    const ansText = q.ids.map((id, i) => `${R.nodes[id].name} ${wn(...q.answer[i])}`).join(', ');
    const submit = () => {
      let ok = true;
      inputs.forEach((inp, i) => {
        const v = parseWN(inp.value), a = q.answer[i];
        const good = !!v && Math.abs(v[0] - a[0]) < 1e-9 && v[1] === a[1];
        inp.classList.toggle('bad', !good); ok &&= good;
      });
      if (ok) resolveQ(true, ansText);
      else wrong(`Every node on the path gets N + 1; W (MAX's wins) grows by 1 only if MAX won the playout${res === 0 ? ' — a draw adds 0.5' : ''}. Nodes off the path do not change.`);
    };
    qcard.querySelector('[data-q="check"]')?.addEventListener('click', submit);
    inputs.forEach(i => i.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); submit(); } }));
    qcard.querySelector('[data-q="reveal"]')?.addEventListener('click', () => resolveQ(false, ansText));
    if (inputs[0] && root.contains(document.activeElement)) inputs[0].focus({ preventScroll: true });
  }

  // ---- details panel
  function boardSvg(board: string[], moves: number[]): string {
    const c = 34, o = 18;
    let h = `<svg width="${3 * c + o + 4}" height="${3 * c + o + 4}" viewBox="0 0 ${3 * c + o + 4} ${3 * c + o + 4}">`;
    for (let i = 0; i < 3; i++) {
      h += `<text class="co" x="${o + c * i + c / 2}" y="12" text-anchor="middle">${'abc'[i]}</text><text class="co" x="6" y="${o + c * i + c / 2 + 4}" text-anchor="middle">${i + 1}</text>`;
    }
    for (let i = 1; i < 3; i++) h += `<line class="g" x1="${o + c * i}" y1="${o}" x2="${o + c * i}" y2="${o + 3 * c}"/><line class="g" x1="${o}" y1="${o + c * i}" x2="${o + 3 * c}" y2="${o + c * i}"/>`;
    board.forEach((p, i) => {
      if (p === '.') return;
      const x = o + (i % 3) * c + c / 2, y = o + Math.floor(i / 3) * c + c / 2, k = moves.indexOf(i);
      const col = p === R.maxP ? 'var(--v-max)' : 'var(--v-min)';
      h += `<text class="x" x="${x}" y="${y + 8}" text-anchor="middle" fill="${col}" opacity="${k >= 0 ? .45 : 1}">${p}</text>`;
      if (k >= 0) h += `<text class="k" x="${x + 12}" y="${y - 6}" text-anchor="middle">${k + 1}</text>`;
    });
    return h + '</svg>';
  }
  function renderDetails(s: MStep, hide: boolean): void {
    const nodes = R.nodes;
    if (s.kind === 'select' && s.ucb) {
      const u = s.ucb;
      detTitle.innerHTML = `UCB1 at <code>${esc(nodes[u.parent].name)}</code>`;
      const row = (r: UcbRow) => `<tr class="${!hide && r.id === u.chosen ? 'win' : ''}"><td>${esc(nodes[r.id].label)}</td><td>${wn(r.W, r.N)}</td>` +
        (hide ? '<td>?</td><td>?</td><td>?</td>' : `<td>${f3(r.exploit)}</td><td>${f3(r.explore)}</td><td>${f3(r.total)}</td>`) + '</tr>';
      detEl.innerHTML = `<div class="mc-f">UCB1(n) = U(n)/N(n) + C·√(ln N(Parent(n)) / N(n))<br>C = ${R.C}, N(Parent) = ${u.Np}, U = ${u.min ? 'N − W (MIN to move: MIN\'s wins)' : 'W (MAX to move)'}</div>
        <div class="mc-tblw"><table class="mc-tbl"><tr><th>child</th><th>W/N</th><th>U/N</th><th>+ explore</th><th>UCB1</th></tr>${u.rows.map(row).join('')}</table></div>`;
    } else if (s.kind === 'backprop' && s.delta) {
      detTitle.textContent = 'Backpropagation';
      detEl.innerHTML = `<div class="mc-f">${esc(resultText(s.rollout?.result ?? 0))}: every node on the path gets N + 1, W + ${(s.rollout?.result ?? 0) > 0 ? 1 : (s.rollout?.result ?? 0) < 0 ? 0 : 0.5}</div>
        <div class="mc-tblw"><table class="mc-tbl"><tr><th>node</th><th>before</th><th>after</th></tr>${s.delta.map(d => `<tr><td>${esc(nodes[d.id].name)}</td><td>${wn(...d.from)}</td><td>${hide ? '?' : wn(...d.to)}</td></tr>`).join('')}</table></div>`;
    } else if (s.kind === 'final') {
      detTitle.textContent = 'Decision at the root';
      const kids = nodes[0].children.filter(c => c < s.count);
      detEl.innerHTML = `<div class="mc-tblw"><table class="mc-tbl"><tr><th>move</th><th>W/N</th><th>win rate</th><th>playouts</th></tr>${kids.map(c => `<tr class="${!hide && c === s.focus ? 'win' : ''}"><td>${esc(nodes[c].label)}</td><td>${wn(s.W[c], s.N[c])}</td><td>${f3(s.W[c] / s.N[c])}</td><td>${s.N[c]}</td></tr>`).join('')}</table></div>
        <div class="mc-note">MCTS returns the move with the highest number of playouts (Figure 6.11).</div>`;
    } else {
      detTitle.textContent = s.kind === 'expand' ? 'Expansion' : 'Simulation';
      const n = nodes[s.focus];
      const txt = s.kind === 'expand'
        ? `New node <b>${esc(n.name)}</b> (${n.depth % 2 ? 'MIN' : 'MAX'} to move) starts at 0/0; ${nodes[n.parent ?? 0].untried.length ? `untried actions left at its parent: ${esc(nodes[n.parent ?? 0].untried.join(', '))}` : 'its parent is now fully expanded'}.`
        : `The playout policy plays to the end of the game; the simulated positions are <b>not</b> added to the tree — only the result is kept: <b>${esc(resultText(s.rollout?.result ?? 0))}</b>.`;
      detEl.innerHTML = `<div class="mc-note" style="margin:0">${txt}</div>`;
    }
    if (R.ttt && s.kind !== 'select') {
      const n = nodes[s.focus];
      const board = s.kind === 'simulate' && s.rollout?.board ? s.rollout.board : n.board ?? R.rootBoard;
      const moves = s.kind === 'simulate' ? s.rollout?.moves ?? [] : [];
      detEl.insertAdjacentHTML('beforeend', `<div class="mc-board" style="margin-top:10px">${boardSvg(board, moves)}<div class="mc-note">${esc(n.name)}${moves.length ? ' + playout (faded, numbered)' : ''}<br>MAX = ${R.maxP}, MIN = ${R.minP}</div></div>`);
    }
  }

  // ---- render one snapshot
  function render(fire: boolean): void {
    const s = R.steps[idx], q = pendingQ();
    const P = layout(s);
    const best = s.kind === 'final' ? s.focus : -1;
    const updated = new Set(s.kind === 'backprop' ? s.path : []);
    const onPath = new Set(s.path);
    const hideNext = !!q;  // values of the step being predicted are not shown yet
    R.nodes.forEach((n, i) => {
      const e = els[i], exists = i < s.count;
      const [x, y] = P[i];
      const label = wn(s.W[i] ?? 0, s.N[i] ?? 0);
      const w = Math.max(44, label.length * 7.8 + 16);
      e.rect.setAttribute('x', String(-w / 2)); e.rect.setAttribute('width', String(w));
      e.text.textContent = label;
      e.title.textContent = `${n.name}: W = ${s.W[i] ?? 0} (MAX's wins), N = ${s.N[i] ?? 0}${n.terminal != null ? ` · terminal, ${resultText(n.terminal)}` : ''}`;
      const cand = q?.type === 'pick' && q.options.includes(i);
      const cls = ['mc-n', n.depth % 2 ? 'min' : 'max'];
      if (!exists) cls.push('hide');
      if (i === best) cls.push('best');
      else if (cand) cls.push('cand');
      else if (updated.has(i)) cls.push('upd');
      else if (onPath.has(i) && s.kind !== 'final') cls.push('path');
      if (s.kind === 'expand' && i === s.focus) cls.push('new');
      if (n.terminal != null) cls.push('term');
      e.g.setAttribute('class', cls.join(' '));
      e.g.style.transform = `translate(${x}px,${y}px)`;
      if (e.edge && e.al && n.parent != null) {
        const [px, py] = P[n.parent];
        e.edge.setAttribute('x1', String(px)); e.edge.setAttribute('y1', String(py + NODE_H / 2));
        e.edge.setAttribute('x2', String(x)); e.edge.setAttribute('y2', String(y - NODE_H / 2));
        e.edge.setAttribute('class', 'mc-edge' + (i === best ? ' best' : onPath.has(i) && onPath.has(n.parent) && s.kind !== 'final' ? ' path' : ''));
        e.edge.style.opacity = exists ? '1' : '0';
        e.al.setAttribute('x', String((px + x) / 2 + (x < px ? -8 : x > px ? 8 : 6)));
        e.al.setAttribute('y', String((py + y) / 2 + 2));
        e.al.setAttribute('text-anchor', x < px ? 'end' : 'start');
        e.al.style.fill = n.parent != null && R.nodes[n.parent].depth % 2 ? 'var(--v-min)' : 'var(--v-max)';
        e.al.style.opacity = exists ? '1' : '0';
      }
    });
    // wide trees scroll: keep the node of interest in view
    const fx = P[s.focus][0];
    if (canvas.scrollWidth > canvas.clientWidth && (fx < canvas.scrollLeft + 70 || fx > canvas.scrollLeft + canvas.clientWidth - 70)) {
      canvas.scrollTo({ left: fx - canvas.clientWidth / 2, behavior: 'smooth' });
    }
    // rollout chain
    gRoll.textContent = '';
    if (s.rollout && (s.kind === 'simulate' || s.kind === 'backprop')) {
      const [x, y] = P[s.rollout.from];
      const isTerm = R.nodes[s.rollout.from].terminal != null;
      const k = isTerm ? 0 : R.ttt ? Math.min(3, Math.max(0, s.rollout.moves.length - 1)) : 2;
      let yy = y + NODE_H / 2;
      const endY = yy + (k + 1) * 22 + 4;
      if (!isTerm) S('line', { x1: x, y1: yy, x2: x, y2: endY - 11 }, gRoll);
      for (let j = 0; j < k; j++) { yy += 22; S('circle', { cx: x, cy: yy, r: 6 }, gRoll); }
      if (!isTerm) {
        S('circle', { class: 'end', cx: x, cy: endY, r: 11 }, gRoll);
        const t = S('text', { x, y: endY + 4, 'text-anchor': 'middle' }, gRoll);
        t.textContent = s.rollout.result > 0 ? '+1' : s.rollout.result < 0 ? '−1' : '0';
        const l = S('text', { class: 'lbl', x: x + 18, y: (y + endY) / 2 + 4 }, gRoll);
        l.textContent = R.ttt ? `playout · ${s.rollout.moves.length} moves` : 'playout';
      }
    }
    // phases
    phases.querySelectorAll<HTMLElement>('.mc-ph').forEach(p => {
      const i = Number(p.dataset.p);
      p.classList.toggle('on', i === s.phase);
      p.classList.toggle('past', s.phase === 4 || i < s.phase);
    });
    const iters = R.steps.filter(x => x.kind === 'backprop').length;
    bar.querySelector('[data-k="iter"]')!.textContent = s.kind === 'final' ? `Done · ${iters} iterations` : `Iteration ${s.iter} / ${iters}`;
    stepEl.textContent = s.text;
    metaEl.innerHTML = `<span class="chip">Step ${idx + 1} / ${R.steps.length}</span><span class="chip">Tree nodes ${s.count}</span><span class="chip">Root ${wn(s.W[0], s.N[0])}</span>`;
    // a pending pick/backprop question shows the NEXT step's table with its answers hidden
    renderDetails(hideNext ? R.steps[idx + 1] : s, hideNext);
    btnBack.disabled = idx === 0; btnStep.disabled = idx >= R.steps.length - 1;
    btnPlay.innerHTML = timer != null ? ICON.pause : ICON.play;
    renderQ();
    if (fire) onEvent(s.text);
    if (predict && idx === R.steps.length - 1 && !doneFired) { doneFired = true; opts.onDone?.({ correct, total }); }
  }

  function go(i: number): void {
    i = Math.max(0, Math.min(R.steps.length - 1, i));
    const fwd = i > idx;
    idx = i;
    if (!fwd) { qMsg = ''; qMsgCls = ''; }
    render(fwd);
  }
  function step(): boolean {
    if (idx >= R.steps.length - 1) { stop(); return false; }
    if (pendingQ()) { stop(); render(false); qcard?.querySelector<HTMLElement>('input, [data-pick]')?.focus({ preventScroll: true }); return false; }
    if (predict) { qMsg = ''; qMsgCls = ''; }
    go(idx + 1);
    return true;
  }
  function stop(): void { if (timer != null) { clearInterval(timer); timer = null; } }
  function play(): void {
    if (timer != null) { stop(); return render(false); }
    if (idx >= R.steps.length - 1) go(0);
    timer = window.setInterval(() => { if (!step()) { stop(); render(false); } }, 900 / speed);
    render(false);
  }
  function rebuild(): void {
    stop();
    R = runMcts(cfg);
    idx = 0; answered.clear(); correct = 0; total = 0; doneFired = false; qMsg = ''; qMsgCls = ''; firstTry = true;
    buildSvg(); setInputs(); render(true);
  }

  root.addEventListener('click', ev => {
    const b = (ev.target as Element).closest<HTMLButtonElement>('button[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'back') { stop(); go(idx - 1); }
    else if (a === 'step') { stop(); step(); }
    else if (a === 'iter') { stop(); const it = R.steps[idx].iter; let j = idx + 1; while (j < R.steps.length - 1 && !(R.steps[j].kind === 'backprop' && R.steps[j].iter >= it)) j++; go(j); }
    else if (a === 'play') play();
    else if (a === 'reset') rebuild();
  });
  bar.addEventListener('change', ev => {
    const t = ev.target as HTMLInputElement, v = Number(t.value);
    if (!Number.isFinite(v)) return;
    if (t.dataset.k === 'C' && v >= 0) cfg.C = v;
    else if (t.dataset.k === 'it' && v >= 1) cfg.iterations = Math.min(200, Math.round(v));
    else if (t.dataset.k === 'seed') cfg.seed = Math.round(v);
    else return;
    rebuild();
    onEvent(`Settings changed: C = ${R.C}, iterations = ${R.steps.filter(x => x.kind === 'backprop').length}${R.ttt ? `, seed = ${cfg.seed ?? 1}` : ''}`);
  });
  ctl.querySelector('select')!.addEventListener('change', ev => {
    speed = Number((ev.target as HTMLSelectElement).value);
    if (timer != null) { stop(); play(); }
  });
  const onKey = (ev: KeyboardEvent) => {
    if ((ev.target as Element).matches('input, select, textarea')) return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); stop(); step(); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); stop(); go(idx - 1); }
    else if (ev.key === ' ') { ev.preventDefault(); play(); }
  };
  root.addEventListener('keydown', onKey);
  const ro = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    if (w && Math.abs(w - lastW) > 4) { lastW = w; render(false); }
  });

  buildSvg();
  render(true);
  ro.observe(canvas);
  return { destroy() { stop(); ro.disconnect(); root.removeEventListener('keydown', onKey); el.innerHTML = ''; } };
}
