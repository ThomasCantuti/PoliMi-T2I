/*
 * csp.ts — Constraint Satisfaction Problems: backtracking search with forward checking / AC-3, and AC-3 alone.
 * Framework-agnostic (plain DOM + inline SVG), CSS injected once. Contract: ./README.md.
 *
 * CONVENTIONS (also stated in the trace problems)
 *   AC-3: FIFO queue, initially every arc (Xi, Xj) in variable order then neighbour order. revise(Xi, Xj) deletes
 *   every x in D(Xi) with no compatible y in D(Xj). If D(Xi) becomes empty → failure; otherwise, if something was
 *   deleted, (Xk, Xi) is appended for every neighbour Xk ≠ Xj that is not already queued. Inside backtracking
 *   (inference 'mac', slides p. 317) AC-3 runs at the start of every call on the arcs between unassigned variables
 *   (forward checking has already made the arcs touching assigned variables consistent).
 *   Forward checking: after X = v, remove from every unassigned neighbour of X the values inconsistent with X = v.
 *   MRV ties → static order (or degree first, for 'mrv+degree'); LCV ties → domain order.
 */
import type { Preset, VizInstance, VizOptions } from './types';

export type CspValue = string | number;
export type CspArc = [string, string];
export type CspQuestionType = 'var' | 'value' | 'prune' | 'revise';

/** Visualizer config (JSON-serializable; used by problems/csp/t*.py CONFIG). */
export interface CspConfig {
  /** Shorthand: 'australia' (7 regions, RGB, map backdrop) or 'nqueens' (board). Explicit keys override it. */
  preset?: 'australia' | 'nqueens';
  /** nqueens: board size 4..8 (default 4). Variable Xi = column i, value = row (1 = top). */
  n?: number;
  /** Display order of the variables (graph, domain table). */
  variables?: string[];
  /** Same domain for all, or per variable. A variable's list order is the order its values are TRIED. */
  domains?: CspValue[] | Record<string, CspValue[]>;
  /** Binary "different values" constraints (nqueens: implicit no-attack constraints). */
  constraints?: CspArc[];
  /** Node positions (any units) and where to draw the domain chips. Default: circle. */
  layout?: Record<string, { x: number; y: number; chips?: 'below' | 'above' | 'left' | 'right' }>;
  /** Draw the Australia silhouette behind the graph (preset 'australia' sets it). */
  map?: 'australia';
  algorithm?: 'backtracking' | 'ac3';
  /** none = check constraints only; fc = forward checking; mac = FC + AC-3 at the start of every call (p. 317). */
  inference?: 'none' | 'fc' | 'mac';
  varOrder?: 'static' | 'mrv' | 'mrv+degree';
  valOrder?: 'static' | 'lcv';
  /** Static variable order (default: variables). */
  order?: string[];
  /** Pre-assigned variables (their domain becomes that single value). */
  assignment?: Record<string, CspValue>;
  /** algorithm 'ac3': these arcs are queued first (e.g. to replay the slides), all the others follow. */
  queue?: CspArc[];
  /** Predict mode: question types to ask (default: all). */
  ask?: CspQuestionType[];
}

export const PRESETS: Preset<CspConfig>[] = [
  {
    name: 'Australia – backtracking + forward checking (slides p. 280–283)', topic: 'csp',
    config: {
      preset: 'australia', inference: 'fc', varOrder: 'static', valOrder: 'static',
      order: ['WA', 'Q', 'V', 'NT', 'NSW', 'SA', 'T'],
      domains: { WA: ['R', 'G', 'B'], NT: ['R', 'G', 'B'], Q: ['G', 'R', 'B'], NSW: ['R', 'G', 'B'], V: ['B', 'R', 'G'], SA: ['R', 'G', 'B'], T: ['R', 'G', 'B'] },
    },
  },
  {
    name: 'Australia – MRV + degree + forward checking', topic: 'csp',
    config: { preset: 'australia', inference: 'fc', varOrder: 'mrv+degree', valOrder: 'static' },
  },
  {
    name: '4-queens complete example – FC + AC-3 (slides p. 303–315)', topic: 'csp',
    config: { preset: 'nqueens', n: 4, inference: 'mac', varOrder: 'static', valOrder: 'static' },
  },
  {
    name: 'AC-3 after WA = R, Q = G (slides p. 290–293)', topic: 'csp',
    config: {
      preset: 'australia', algorithm: 'ac3', assignment: { WA: 'R', Q: 'G' },
      domains: { WA: ['R'], NT: ['B'], Q: ['G'], NSW: ['R', 'B'], V: ['R', 'G', 'B'], SA: ['B'], T: ['R', 'G', 'B'] },
      queue: [['NSW', 'V'], ['NSW', 'SA'], ['V', 'NSW'], ['SA', 'NT']],
    },
  },
  {
    name: 'Beyond AC-3: three variables, two values (slide p. 316)', topic: 'csp',
    config: {
      variables: ['X', 'Y', 'Z'], domains: [1, 2], constraints: [['X', 'Y'], ['X', 'Z'], ['Y', 'Z']],
      layout: { X: { x: 0, y: 0, chips: 'left' }, Y: { x: 220, y: 0, chips: 'right' }, Z: { x: 110, y: 150 } },
      algorithm: 'ac3',
    },
  },
];

/* ------------------------------------------------------------------ data */

type Doms = Record<string, CspValue[]>;
type Side = 'below' | 'above' | 'left' | 'right';

const COLOR: Record<string, string> = { R: '#e5484d', G: '#2f9e6a', B: '#3e6ee8', Y: '#d99a1e', O: '#ef7d2d', P: '#8e55d6' };
const CNAME: Record<string, string> = { red: 'R', green: 'G', blue: 'B', yellow: 'Y', orange: 'O', purple: 'P' };
const colorKey = (v: CspValue): string | undefined => (COLOR[v] ? String(v) : CNAME[String(v).toLowerCase()]);
const colorOf = (v: CspValue): string => COLOR[colorKey(v) ?? ''] ?? 'var(--panel-3)';

const AUS: Required<Pick<CspConfig, 'variables' | 'constraints' | 'domains' | 'map'>> = {
  variables: ['WA', 'NT', 'Q', 'NSW', 'V', 'SA', 'T'],
  constraints: [['WA', 'NT'], ['WA', 'SA'], ['NT', 'SA'], ['NT', 'Q'], ['SA', 'Q'], ['SA', 'NSW'], ['SA', 'V'], ['Q', 'NSW'], ['NSW', 'V']],
  domains: ['R', 'G', 'B'],
  map: 'australia',
};
const proj = ([lon, lat]: number[]): [number, number] => [(lon - 112) * 10, (-lat - 9.5) * 10];
const AUS_LAYOUT: Record<string, [number, number, Side]> = {
  WA: [121.5, -25, 'below'], NT: [133.5, -19.8, 'below'], SA: [135, -30.3, 'below'], Q: [144.3, -22.5, 'below'],
  NSW: [146.5, -32.3, 'right'], V: [143.8, -36.9, 'left'], T: [146.5, -42.3, 'right'],
};
const AUS_MAP: Record<string, number[][]> = {
  WA: [[129, -14.9], [129, -26], [129, -31.6], [126.5, -32.3], [124, -33.6], [121.5, -33.8], [119.5, -34.4], [117.8, -35.1], [116, -34.8], [115, -34.2], [115.6, -33.4], [115.7, -31.7], [115, -29.5], [114.2, -28], [113.5, -26], [113.7, -24], [114.2, -22], [116.7, -20.6], [119, -20], [121, -19.5], [122.3, -18], [123.5, -16.6], [125, -15], [126.8, -13.9], [128.2, -14.9]],
  NT: [[129, -14.9], [129.6, -13.6], [130.3, -12.4], [131.5, -11.3], [132.6, -11.5], [133.5, -11.8], [135.2, -12.2], [136.7, -12.1], [136.2, -13.6], [135.5, -14.8], [136.8, -15.9], [138, -16.6], [138, -26], [129, -26]],
  Q: [[138, -16.6], [139.5, -17.4], [140.8, -17.4], [141.5, -15.5], [141.6, -12.8], [142.5, -10.7], [143.4, -12.5], [143.8, -14.2], [145.3, -15], [145.5, -16.8], [146.3, -18.9], [148.8, -20.4], [150.5, -22.4], [151.2, -23.8], [153.1, -25.3], [153.5, -28.2], [151, -28.9], [149, -29], [141, -29], [141, -26], [138, -26]],
  NSW: [[141, -29], [149, -29], [151, -28.9], [153.5, -28.2], [153.1, -30.5], [152.5, -32.3], [151.3, -33.8], [150.6, -35.2], [150, -37.5], [148.2, -36.8], [147, -36.1], [144.5, -36], [143, -35.3], [141, -34]],
  V: [[141, -34], [143, -35.3], [144.5, -36], [147, -36.1], [148.2, -36.8], [150, -37.5], [148, -37.8], [146.4, -39.1], [145, -38.4], [143.5, -38.8], [142, -38.4], [141, -38.1]],
  SA: [[129, -26], [138, -26], [141, -26], [141, -29], [141, -34], [141, -38.1], [140, -37.5], [139.6, -36.8], [139.3, -35.6], [138.1, -35.6], [138.5, -34.5], [137.9, -33], [137.5, -34.4], [135.9, -34.9], [135.6, -34], [134.6, -33], [133.6, -32.2], [131.2, -31.5], [129, -31.6]],
  T: [[144.7, -40.7], [146.6, -41.1], [148.3, -40.9], [148.3, -42.1], [147.6, -43.1], [146.1, -43.6], [145.2, -42.2]],
};

interface Problem {
  cfg: CspConfig;
  queens: boolean;
  V: string[];
  dom: Doms;
  edges: CspArc[];
  nb: Record<string, string[]>;
  ok: (a: string, x: CspValue, b: string, y: CspValue) => boolean;
  idx: Record<string, number>;
  values: CspValue[];
  isColor: boolean;
  algorithm: 'backtracking' | 'ac3';
  inference: 'none' | 'fc' | 'mac';
  varOrder: 'static' | 'mrv' | 'mrv+degree';
  valOrder: 'static' | 'lcv';
  order: string[];
  asg0: Record<string, CspValue>;
}

function normalize(cfg0: CspConfig): Problem {
  const c: CspConfig = cfg0.preset === 'australia' ? { ...AUS, ...cfg0 } : { ...cfg0 };
  const dom: Doms = {};
  let V: string[], edges: CspArc[];
  const queens = c.preset === 'nqueens';
  if (queens) {
    const n = Math.max(4, Math.min(8, c.n ?? 4));
    V = Array.from({ length: n }, (_, i) => 'X' + (i + 1));
    V.forEach(v => (dom[v] = Array.from({ length: n }, (_, i) => i + 1)));
    edges = [];
    V.forEach((a, i) => V.slice(i + 1).forEach(b => edges.push([a, b])));
  } else {
    V = (c.variables ?? []).slice();
    edges = c.constraints ?? [];
    const d = c.domains ?? [];
    V.forEach(v => (dom[v] = (Array.isArray(d) ? d : d[v] ?? []).slice()));
  }
  const idx: Record<string, number> = Object.fromEntries(V.map((v, i) => [v, i]));
  const adj: Record<string, Set<string>> = Object.fromEntries(V.map(v => [v, new Set<string>()]));
  edges.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });
  const nb: Record<string, string[]> = Object.fromEntries(V.map(v => [v, V.filter(w => adj[v].has(w))]));
  const ok = queens
    ? (a: string, x: CspValue, b: string, y: CspValue) => x !== y && Math.abs(+x - +y) !== Math.abs(idx[a] - idx[b])
    : (_a: string, x: CspValue, _b: string, y: CspValue) => x !== y;
  const values = [...new Set(V.flatMap(v => dom[v]))];
  const isColor = values.every(x => colorKey(x));
  if (values.every(x => typeof x === 'number')) values.sort((a, b) => +a - +b);
  else if (isColor) values.sort((a, b) => 'RGBYOP'.indexOf(colorKey(a) ?? '') - 'RGBYOP'.indexOf(colorKey(b) ?? ''));
  return {
    cfg: c, queens, V, dom, edges, nb, ok, idx, values, isColor,
    algorithm: c.algorithm ?? 'backtracking', inference: c.inference ?? 'none',
    varOrder: c.varOrder ?? 'static', valOrder: c.valOrder ?? 'static',
    order: c.order ?? V, asg0: { ...(c.assignment ?? {}) },
  };
}

/* ------------------------------------------------------------------ trace */

interface Counts { assign: number; backtracks: number; pruned: number; revisions: number }
interface QVar { type: 'var'; answer: string; m: Record<string, number>; deg: Record<string, number>; min: number }
interface QValue { type: 'value'; var: string; answer: CspValue; cands: CspValue[]; ruled?: Record<string, number>; conflicts: Record<string, string | undefined> }
interface QPrune { type: 'prune'; var: string; val: CspValue; answer: [string, CspValue][] }
interface QRevise { type: 'revise'; var: string; other: string; answer: CspValue[]; before: CspValue[]; head: CspValue[] }
type Question = QVar | QValue | QPrune | QRevise;
type Kind = 'init' | 'select' | 'assign' | 'fc' | 'ac3-start' | 'revise' | 'ac3-end' | 'undo' | 'backtrack' | 'solution' | 'failure' | 'done';

interface Step {
  kind: Kind;
  text: string;
  log: string[];
  dom: Doms;
  asg: Record<string, CspValue>;
  why: Record<string, Record<string, string>>;
  cnt: Counts;
  node: number;
  nNodes: number;
  nRows: number;
  focus?: string;
  arc?: CspArc;
  queue?: CspArc[];
  added?: CspArc[];
  hot?: [string, CspValue][];
  failed?: boolean;
  mrv?: Record<string, number>;
  q?: Question | null;
}
interface TreeNode { id: number; parent: number; label: string; depth: number; fail: number; sol: number }
interface Row { label: string; dead: boolean; dom: Doms; asg: Record<string, CspValue> }
export interface CspTrace { P: Problem; steps: Step[]; rows: Row[]; nodes: TreeNode[]; total: number }

const fmt = (vals: CspValue[]) => '{' + vals.join(', ') + '}';
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);
const key = (v: string, x: CspValue) => v + '|' + x;
const copyDoms = (D: Doms, V: string[]): Doms => Object.fromEntries(V.map(v => [v, D[v].slice()]));

/** Precompute the whole run as an array of snapshots (pure; exported for tests). */
export function buildTrace(cfg: CspConfig): CspTrace {
  const P = normalize(cfg);
  const { V, nb, ok } = P;
  const A: Record<string, CspValue> = { ...P.asg0 };
  const D: Doms = Object.fromEntries(V.map(v => [v, v in A ? [A[v]] : P.dom[v].slice()]));
  let why: Record<string, Record<string, string>> = Object.fromEntries(V.map(v => [v, {}]));
  const cnt: Counts = { assign: 0, backtracks: 0, pruned: 0, revisions: 0 };
  const steps: Step[] = [], rows: Row[] = [];
  const nodes: TreeNode[] = [{ id: 0, parent: -1, label: '{ }', depth: 0, fail: Infinity, sol: Infinity }];
  let node = 0;
  const ask = (t: CspQuestionType) => !P.cfg.ask || P.cfg.ask.includes(t);
  const push = (kind: Kind, text: string, extra: Partial<Step> = {}) => steps.push({
    kind, text, log: [], dom: copyDoms(D, V), asg: { ...A },
    why: Object.fromEntries(V.map(v => [v, { ...why[v] }])), cnt: { ...cnt }, node, nNodes: nodes.length, nRows: rows.length,
    ...extra,
  });
  const row = (label: string, dead = false) => rows.push({ label, dead, dom: copyDoms(D, V), asg: { ...A } });
  const fail = (n: number, at: number) => { if (nodes[n].fail === Infinity) nodes[n].fail = at; };
  const conflictWith = (v: string, x: CspValue) => nb[v].find(w => w in A && !ok(v, x, w, A[w]));
  const legal = (v: string) => (P.inference === 'none' ? D[v].filter(x => !conflictWith(v, x)) : D[v]);

  function ac3(mac: boolean): boolean {
    const act = (v: string) => !mac || !(v in A);
    let q: CspArc[] = [];
    V.forEach(i => nb[i].forEach(j => { if (act(i) && act(j)) q.push([i, j]); }));
    if (!mac && P.cfg.queue) {
      const first = P.cfg.queue.map(a => [a[0], a[1]] as CspArc);
      q = first.concat(q.filter(a => !first.some(f => f[0] === a[0] && f[1] === a[1])));
    }
    if (!q.length) return true;
    push('ac3-start', mac
      ? `AC-3 on the ${q.length} arcs between unassigned variables (FIFO queue).`
      : `AC-3 starts with all ${q.length} arcs in the queue (FIFO).`,
    { queue: q.map(a => [...a] as CspArc), log: ['ac3 ' + q.map(a => a.join('>')).join(' ')] });
    while (q.length) {
      const [i, j] = q.shift()!;
      const before = D[i].slice();
      const rem = before.filter(x => !D[j].some(y => ok(i, x, j, y)));
      cnt.revisions++;
      D[i] = before.filter(x => !rem.includes(x));
      rem.forEach(x => (why[i][String(x)] = `AC-3: no value of ${j} is compatible`));
      cnt.pruned += rem.length;
      const empty = !D[i].length;
      const added: CspArc[] = [];
      if (rem.length && !empty) {
        nb[i].forEach(k => {
          if (k !== j && act(k) && !q.some(a => a[0] === k && a[1] === i)) { q.push([k, i]); added.push([k, i]); }
        });
      }
      let text = `revise(${i}, ${j}): `;
      if (!rem.length) text += `every value of ${i} in ${fmt(before)} has a compatible value in D(${j}) = ${fmt(D[j])} → no change.`;
      else {
        text += `${andList(rem.map(x => `${i} = ${x}`))} ${rem.length > 1 ? 'have' : 'has'} no compatible value in D(${j}) = ${fmt(D[j])} → remove.`;
        if (empty) text += ` D(${i}) is empty → AC-3 returns failure.`;
        else if (added.length) text += ` Re-queue ${added.map(a => `(${a[0]}, ${a[1]})`).join(', ')}.`;
        else text += ` The arcs into ${i} are already queued.`;
      }
      const log = [`rev ${i}>${j} -${rem.join(',')} +${added.map(a => a.join('>')).join(' ')}`];
      if (empty) { log.push('ac3fail ' + i); row('AC-3', true); fail(node, steps.length); }
      push('revise', text, {
        arc: [i, j], queue: q.map(a => [...a] as CspArc), added, hot: rem.map(x => [i, x] as [string, CspValue]), focus: i, log, failed: empty,
        q: ask('revise') ? { type: 'revise', var: i, other: j, answer: rem, before, head: D[j].slice() } : null,
      });
      if (empty) return false;
    }
    row('AC-3');
    push('ac3-end', 'Queue empty → every arc is consistent.', { queue: [], log: ['ac3ok'] });
    return true;
  }

  function select() {
    const un = P.order.filter(v => !(v in A));
    if (P.varOrder === 'static') return { v: un[0], text: `Next variable in the static order: ${un[0]}.`, m: {}, deg: {}, min: 0 };
    const m: Record<string, number> = Object.fromEntries(un.map(v => [v, legal(v).length]));
    const deg: Record<string, number> = Object.fromEntries(un.map(v => [v, nb[v].filter(w => !(w in A)).length]));
    const min = Math.min(...un.map(v => m[v]));
    let cand = un.filter(v => m[v] === min);
    const vs = `value${min === 1 ? '' : 's'}`;
    let text: string;
    if (cand.length === 1) text = `MRV: ${cand[0]} has the fewest legal values (${min}) → select ${cand[0]}.`;
    else if (P.varOrder === 'mrv+degree') {
      const max = Math.max(...cand.map(v => deg[v]));
      const best = cand.filter(v => deg[v] === max);
      text = `MRV tie at ${min} ${vs} (${cand.join(', ')}). Degree (unassigned neighbours): ${cand.map(v => `${v} ${deg[v]}`).join(', ')}`
        + ` → ${best.length > 1 ? `tie again, first in the static order: ${best[0]}` : `select ${best[0]}`}.`;
      cand = best;
    } else text = `MRV tie at ${min} ${vs} (${cand.join(', ')}) → first in the static order: ${cand[0]}.`;
    return { v: cand[0], text, m, deg, min };
  }

  function valuesFor(v: string): { vals: CspValue[]; ruled?: Record<string, number> } {
    const vals = D[v].slice();
    if (P.valOrder !== 'lcv') return { vals };
    const others = nb[v].filter(w => !(w in A));
    const ruled: Record<string, number> = Object.fromEntries(vals.map(x => [String(x),
      others.reduce((s, w) => s + legal(w).filter(y => !ok(v, x, w, y)).length, 0)]));
    vals.sort((a, b) => ruled[String(a)] - ruled[String(b)]);
    return { vals, ruled };
  }

  function bt(): boolean {
    if (V.every(v => v in A)) {
      nodes[node].sol = steps.length;
      push('solution', 'All variables are assigned and consistent → solution: ' + V.map(v => `${v} = ${A[v]}`).join(', ') + '.',
        { log: ['solution ' + V.map(v => `${v}=${A[v]}`).join(' ')] });
      return true;
    }
    if (P.inference === 'mac' && !ac3(true)) return false;
    const s = select();
    const v = s.v;
    if (P.varOrder !== 'static') {
      push('select', s.text, {
        focus: v, mrv: s.m, log: ['select ' + v],
        q: ask('var') ? { type: 'var', answer: v, m: s.m, deg: s.deg, min: s.min } : null,
      });
    }
    const { vals, ruled } = valuesFor(v);
    const tried: CspValue[] = [];
    let skipped: [CspValue, string][] = [];
    const skipText = () => skipped.map(([x, c]) => `${v} = ${x} conflicts with ${c} = ${A[c]}`).join('; ') + '. ';
    const skipLog = () => skipped.map(([x]) => `reject ${v}=${x}`);
    for (const x of vals) {
      const c = P.inference === 'none' ? conflictWith(v, x) : undefined;
      if (c) { skipped.push([x, c]); continue; }
      const saved = { D: copyDoms(D, V), why: Object.fromEntries(V.map(w => [w, { ...why[w] }])) };
      const cands = vals.filter(y => !tried.includes(y));
      const first = !tried.length;
      tried.push(x);
      const conflicts = Object.fromEntries(D[v].map(y => [String(y), conflictWith(v, y)]));
      A[v] = x; D[v] = [x]; cnt.assign++;
      const parent = node;
      node = nodes.length;
      nodes.push({ id: node, parent, label: `${v}=${x}`, depth: nodes[parent].depth + 1, fail: Infinity, sol: Infinity });
      let text = P.varOrder === 'static' && first ? s.text + ' ' : '';
      if (skipped.length) text += skipText();
      if (ruled) text += `LCV: ${vals.map(y => `${y} rules out ${ruled[String(y)]}`).join(', ')} → `;
      text += `Assign ${v} = ${x}${!ruled && !first ? ' (next value)' : ''}.`;
      const askVal = ask('value') && (P.valOrder === 'lcv' || P.inference === 'none');
      push('assign', text, {
        focus: v, log: [...(P.varOrder === 'static' && first ? ['select ' + v] : []), ...skipLog(), `assign ${v}=${x}`],
        q: askVal ? { type: 'value', var: v, answer: x, cands, ruled, conflicts } : null,
      });
      skipped = [];
      let dead: string | null = null;
      if (P.inference === 'none') row(`${v}=${x}`);
      else {
        const rem: [string, CspValue][] = [];
        V.forEach(w => {
          if (w in A || !nb[v].includes(w)) return;
          const r = D[w].filter(y => !ok(v, x, w, y));
          D[w] = D[w].filter(y => !r.includes(y));
          r.forEach(y => { why[w][String(y)] = `forward checking: ${v} = ${x}`; rem.push([w, y]); });
          if (!D[w].length && !dead) dead = w;
        });
        cnt.pruned += rem.length;
        row(`${v}=${x}`, !!dead);
        if (dead) fail(node, steps.length);
        const by = new Map<CspValue, string[]>();
        if (P.isColor) rem.forEach(([w, y]) => by.set(y, [...(by.get(y) ?? []), w]));
        else rem.forEach(([w, y]) => by.set(w, [...(by.get(w) ?? []), String(y)]));
        let t = `Forward checking after ${v} = ${x}: ` + (rem.length
          ? 'remove ' + [...by].map(([a, bs]) => (P.isColor ? `${a} from ${andList(bs)}` : `${bs.join(', ')} from ${a}`)).join('; ') + '.'
          : 'no unassigned neighbour loses a value.');
        if (dead) t += ` D(${dead}) is empty → dead end.`;
        push('fc', t, {
          focus: v, hot: rem, failed: !!dead, log: ['fc ' + rem.map(([w, y]) => w + y).join(' ') + (dead ? ' DEAD' : '')],
          q: ask('prune') ? { type: 'prune', var: v, val: x, answer: rem } : null,
        });
      }
      if (!dead && bt()) return true;
      fail(node, steps.length);
      for (const w of V) D[w] = saved.D[w];
      why = saved.why;
      delete A[v];
      node = parent;
      cnt.backtracks++;
      push('undo', `Backtrack: undo ${v} = ${x}${P.inference === 'none' ? '' : ' and restore the values it pruned'}.`, { focus: v, log: [`undo ${v}=${x}`] });
    }
    const unseen = P.varOrder === 'static' && !tried.length;
    push('backtrack', (unseen ? s.text + ' ' : '') + (skipped.length ? skipText() : '') + `No value left for ${v} → return failure to the previous level.`,
      { focus: v, failed: true, log: [...(unseen ? ['select ' + v] : []), ...skipLog(), 'backtrack ' + v] });
    return false;
  }

  const names = { none: 'no inference (check constraints)', fc: 'forward checking', mac: 'forward checking + AC-3 (p. 317)' };
  row('initial');
  if (P.algorithm === 'ac3') {
    push('init', 'Initial domains. AC-3 makes every arc consistent, or finds an empty domain.');
    if (ac3(false)) {
      push('done', 'AC-3 returns true: the CSP is arc consistent.'
        + (solvable(P, D) ? '' : ' Yet it has no solution — arc consistency does not detect every inconsistency.'));
    } else push('done', 'AC-3 returns false: no solution exists with these domains.', { failed: true });
  } else {
    const vo = P.varOrder === 'static' ? 'static order ' + P.order.join(', ') : P.varOrder === 'mrv' ? 'MRV' : 'MRV + degree';
    push('init', `Backtracking with ${names[P.inference]}. Variables: ${vo}. Values: ${P.valOrder === 'lcv' ? 'LCV' : 'domain order'}.`);
    if (!bt()) push('failure', 'Every value of the first variable failed → the CSP has no solution.', { failed: true, log: ['failure'] });
  }
  if (steps.length > 6000) throw new Error('trace too long');
  return { P, steps, rows, nodes, total: steps.filter(s => s.q).length };
}

function solvable(P: Problem, D: Doms): boolean {
  const A: Record<string, CspValue> = {};
  const go = (k: number): boolean => {
    if (k === P.V.length) return true;
    const v = P.V[k];
    for (const x of D[v]) {
      if (!P.nb[v].every(w => !(w in A) || P.ok(v, x, w, A[w]))) continue;
      A[v] = x;
      if (go(k + 1)) return true;
      delete A[v];
    }
    return false;
  };
  return go(0);
}

/* ------------------------------------------------------------------ predict checks */

type Answer = CspValue | Set<string>;
function checkQ(q: Question, pick: Answer, st: Step, P: Problem): { ok: boolean; msg?: string } {
  if (q.type === 'var') {
    const p = String(pick);
    if (p === q.answer) return { ok: true };
    if (!(p in q.m)) return { ok: false, msg: `${p} is already assigned.` };
    if (q.m[p] > q.min) return { ok: false, msg: `${p} still has ${q.m[p]} legal values — MRV picks the variable with the fewest.` };
    if (P.varOrder === 'mrv+degree' && q.deg[p] < q.deg[q.answer])
      return { ok: false, msg: `${p} ties on MRV, but the degree heuristic prefers more constraints on unassigned variables (${p} has ${q.deg[p]}).` };
    return { ok: false, msg: `${p} ties — ties are broken by the static order ${P.order.join(', ')}.` };
  }
  if (q.type === 'value') {
    const p = pick as CspValue;
    if (p === q.answer) return { ok: true };
    const c = q.conflicts[String(p)];
    if (c) return { ok: false, msg: `${q.var} = ${p} conflicts with ${c} = ${st.asg[c]}.` };
    if (!q.cands.includes(p)) return { ok: false, msg: `${q.var} = ${p} was already tried.` };
    if (q.ruled) return { ok: false, msg: `${p} rules out ${q.ruled[String(p)]} neighbour values — LCV tries the value that rules out the fewest first.` };
    return { ok: false, msg: 'Values are tried in domain order: take the first one still available.' };
  }
  const sel = pick as Set<string>;
  const want = new Set(q.type === 'revise' ? q.answer.map(a => key(q.var, a)) : q.answer.map(([w, y]) => key(w, y)));
  const extra = [...sel].filter(k => !want.has(k));
  const missing = [...want].filter(k => !sel.has(k));
  if (!extra.length && !missing.length) return { ok: true };
  if (q.type === 'prune') {
    if (extra.length) {
      const [w, y] = extra[0].split('|');
      return {
        ok: false, msg: P.nb[q.var].includes(w)
          ? `${w} = ${y} is still consistent with ${q.var} = ${q.val}.`
          : `${w} is not constrained by ${q.var}: forward checking only touches the neighbours of ${q.var}.`,
      };
    }
    return { ok: false, msg: `Some values inconsistent with ${q.var} = ${q.val} are still there — check every unassigned neighbour of ${q.var}.` };
  }
  if (extra.length) {
    const x = extra[0].split('|')[1];
    const xv = q.before.find(v => String(v) === x) ?? x;
    const y = q.head.find(v => P.ok(q.var, xv, q.other, v));
    return { ok: false, msg: `${q.var} = ${x} is supported: ${q.other} = ${y} is compatible with it.` };
  }
  return { ok: false, msg: `Look again: some value of ${q.var} has no compatible value in D(${q.other}) = ${fmt(q.head)}.` };
}

/* ------------------------------------------------------------------ DOM helpers */

const NS = 'http://www.w3.org/2000/svg';
function S<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e;
}
function H<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', parent?: Element | null, text?: string | number): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = String(text);
  parent?.appendChild(e);
  return e;
}
const ICON: Record<string, string> = {
  back: 'M11 17l-5-5 5-5M18 17l-5-5 5-5',
  step: 'M9 6l6 6-6 6',
  play: 'M8 5.5v13l10-6.5z',
  pause: 'M8 5h3v14H8zM13 5h3v14h-3z',
  reset: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5',
};
const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="${name === 'play' || name === 'pause' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[name]}"/></svg>`;

const CSS = `
.csp{container-type:inline-size;display:flex;flex-direction:column;gap:12px;color:var(--text);outline:none;font-size:13.5px;line-height:1.5}
.csp *{box-sizing:border-box}
.csp-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:flex-end}
.csp-bar label{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--muted);letter-spacing:.02em}
.csp-bar select{font-size:13px;padding:4px 6px;min-width:0}
.csp-ctrl{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.csp-ctrl .btn{padding:5px 9px}
.csp-ctrl .btn svg{display:block}
.csp-pos{font:12px var(--mono);color:var(--muted);min-width:60px}
.csp-speed{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
.csp-speed input{width:76px;accent-color:var(--accent)}
.csp-counters{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto}
.csp-counters .chip b{color:var(--text);font-weight:600;font-variant-numeric:tabular-nums}
.csp-narr{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:var(--radius);background:var(--panel-2);border:1px solid var(--border);min-height:46px}
.csp-badge{flex:none;font:600 12px/1 var(--font);letter-spacing:.05em;padding:5px 7px;border-radius:5px;background:var(--accent-soft);color:var(--accent);margin-top:2px}
.csp-badge.k-fail{background:var(--bad-soft);color:var(--bad)}
.csp-badge.k-ok{background:var(--ok-soft);color:var(--ok)}
.csp-badge.k-ac3{background:var(--warn-soft);color:var(--warn)}
.csp-ask{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:var(--radius);border:1px solid var(--accent);background:var(--accent-soft)}
.csp-ask[hidden]{display:none}
.csp-ask.idle{border-color:var(--border);background:transparent}
.csp-ask .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.csp-ask .prompt{font-weight:600}
.csp-ask .fb{font-size:13px;color:var(--text-2)}
.csp-ask .fb.bad{color:var(--bad)}
.csp-ask .fb.good{color:var(--ok)}
.csp-ask.shake{animation:csp-shake .38s}
@keyframes csp-shake{0%,100%{transform:none}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.csp-main{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
@container (min-width: 760px){.csp-main{grid-template-columns:minmax(0,1.45fr) minmax(0,1fr)}}
.csp-card{border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);padding:10px 12px;min-width:0}
.csp-card h4{margin:0 0 8px;font:600 12px/1.3 var(--font);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:flex;justify-content:space-between;gap:8px}
.csp-card h4 span{text-transform:none;letter-spacing:0;font-weight:500;color:var(--text-2)}
.csp-side{display:flex;flex-direction:column;gap:12px;min-width:0}
.csp-stage svg{display:block;width:100%;height:auto;max-height:520px}
.csp-stage text{font-family:var(--font);fill:var(--text)}
.csp .csp-map path{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:1;stroke-linejoin:round;transition:fill .35s}
.csp .csp-edge{stroke:var(--v-edge);stroke-width:1.6;opacity:.8}
.csp .csp-edge.on{stroke:var(--accent);opacity:1;stroke-width:2.4}
.csp .csp-arc{stroke:var(--accent);stroke-width:3.2;fill:none;stroke-linecap:round;transition:opacity .2s}
.csp .csp-node .csp-body{fill:var(--v-node);stroke:var(--v-node-stroke);stroke-width:1.6;transition:fill .35s,stroke .2s}
.csp .csp-node .csp-lbl{font-size:calc(12.5px * var(--csp-k, 1));font-weight:600;text-anchor:middle;dominant-baseline:central;pointer-events:none;transition:fill .3s}
.csp .csp-node.asg .csp-lbl{fill:#fff}
.csp .csp-node .csp-ring{fill:none;stroke:var(--accent);stroke-width:2.5;opacity:0;transition:opacity .2s}
.csp .csp-node.focus .csp-ring{opacity:1}
.csp .csp-node.dead .csp-body{stroke:var(--bad);stroke-width:2.6}
.csp .csp-mrv circle{fill:var(--warn);transform:scale(var(--csp-k, 1))}
.csp .csp-mrv text{font-size:calc(12px * var(--csp-k, 1));font-weight:700;fill:#1b1b1b;text-anchor:middle;dominant-baseline:central}
.csp .csp-chip .csp-c{stroke:rgba(0,0,0,.18);stroke-width:1;transition:opacity .3s}
.csp .csp-chip text{font-size:calc(12px * var(--csp-k, 1));font-weight:600;text-anchor:middle;dominant-baseline:central;pointer-events:none}
.csp .csp-chip .csp-x{stroke:var(--bad);stroke-width:2;stroke-linecap:round;opacity:0;transition:opacity .25s}
.csp .csp-sel{fill:none;stroke:var(--accent);stroke-width:2;stroke-dasharray:3 2;opacity:0}
.csp .csp-chip{transition:opacity .3s}
.csp .csp-chip.pruned .csp-c{opacity:.22}
.csp .csp-chip.pruned text{opacity:.35}
.csp .csp-chip.pruned .csp-x{opacity:.9}
.csp .csp-chip.hot .csp-x{opacity:1;stroke-width:2.6}
.csp .csp-chip.hot .csp-c{animation:csp-pulse .9s ease-out}
.csp .csp-chip.gone{opacity:0}
.csp .picked .csp-sel{opacity:1}
@keyframes csp-pulse{0%{opacity:1}100%{opacity:.22}}
.csp .clickable{cursor:pointer}
.csp .clickable:hover .csp-sel{opacity:.6}
.csp .csp-node.clickable:hover .csp-ring{opacity:.6}
.csp .csp-sq{transition:fill .25s}
.csp .csp-sq.l{fill:var(--panel-2)}
.csp .csp-sq.d{fill:var(--panel-3)}
.csp .csp-sq.pr{fill:var(--bad-soft)}
.csp .csp-sq.hotc{fill:var(--bad-soft);stroke:var(--bad);stroke-width:2}
.csp .csp-dot{fill:var(--muted);opacity:.6}
.csp .csp-bx{stroke:var(--bad);stroke-width:2.4;stroke-linecap:round;opacity:.85}
.csp .csp-queen{fill:var(--accent);transition:fill .3s}
.csp .csp-queen.sol{fill:var(--ok)}
.csp .csp-colh text{font-size:calc(13px * var(--csp-k, 1));font-weight:600;text-anchor:middle}
.csp .csp-colh rect{fill:transparent;stroke:transparent}
.csp .csp-colh.focus rect{fill:var(--accent-soft);stroke:var(--accent)}
.csp .csp-colh.clickable:hover rect{stroke:var(--accent)}
.csp .csp-rowl{font-size:calc(12px * var(--csp-k, 1));fill:var(--muted);text-anchor:middle;dominant-baseline:central}
.csp .csp-cell .csp-sel{stroke-width:2.5;stroke-dasharray:4 3}
.csp-tree{overflow:auto;max-height:340px}
.csp-tree svg{display:block}
.csp-tree text{font:12px var(--mono);fill:var(--text-2);text-anchor:middle;dominant-baseline:central}
.csp-tree line{stroke:var(--border-strong);stroke-width:1.4}
.csp-tree line.path{stroke:var(--accent);stroke-width:2}
.csp-tree rect{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:1.2}
.csp-tree g.path rect{stroke:var(--accent);fill:color-mix(in srgb, var(--accent) 16%, var(--panel))}
.csp-tree g.path text{fill:var(--text)}
.csp-tree g.cur rect{fill:var(--accent);stroke:var(--accent)}
.csp-tree g.cur text{fill:#fff}
.csp-tree g.fail rect{stroke:var(--bad);fill:color-mix(in srgb, var(--bad) 12%, var(--panel))}
.csp-tree g.fail text{fill:var(--bad)}
.csp-tree g.sol rect{stroke:var(--ok);fill:var(--ok)}
.csp-tree g.sol text{fill:#fff}
.csp-tree g.new{animation:csp-in .35s ease-out}
@keyframes csp-in{from{opacity:0}to{opacity:1}}
.csp-stack{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;font-size:12px;color:var(--muted);align-items:center}
.csp-q{display:flex;flex-wrap:wrap;gap:5px}
.csp-q .arcc{font:12px var(--mono);padding:2px 7px;border-radius:99px;border:1px solid var(--border);background:var(--panel-2);color:var(--text-2)}
.csp-q .arcc.next{border-color:var(--warn);color:var(--text)}
.csp-q .arcc.add{border-color:var(--ok);background:var(--ok-soft);color:var(--text)}
.csp-q .cur{font:12px var(--mono);padding:2px 8px;border-radius:99px;background:var(--accent);color:#fff}
.csp-q .empty{font-size:12px;color:var(--muted)}
.csp-tbl{overflow:auto;max-height:300px}
.csp-tbl table{border-collapse:separate;border-spacing:0;font-size:12.5px;width:100%}
.csp-tbl th{position:sticky;top:0;background:var(--panel);font-weight:600;color:var(--text-2);text-align:left;padding:4px 8px;border-bottom:1px solid var(--border);white-space:nowrap}
.csp-tbl td{padding:4px 8px;border-bottom:1px solid var(--border);white-space:nowrap;vertical-align:middle}
.csp-tbl td.lbl{font:12px var(--mono);color:var(--text-2)}
.csp-tbl tr.dead td{background:var(--bad-soft)}
.csp-tbl tr.dead td.lbl{color:var(--bad)}
.csp-tbl tr.last td{background:var(--accent-soft)}
.csp-tbl tr.last.dead td{background:var(--bad-soft)}
.csp-tbl tr.new{animation:csp-in .35s ease-out}
.csp-dc{display:inline-flex;gap:3px;align-items:center}
.csp-dc i{display:inline-block;width:12px;height:12px;border-radius:3px}
.csp-dc i.wide{width:30px}
.csp-dc .num{font:12px var(--mono)}
.csp-dc .num.asg{font-weight:700;color:var(--accent)}
.csp-dc .emp{color:var(--bad);font-weight:700}
`;

/* ------------------------------------------------------------------ views */

interface ChipEl { g: SVGGElement; title: SVGTitleElement }
interface GraphView {
  kind: 'graph'; svg: SVGSVGElement; R: number;
  pos: Record<string, { x: number; y: number }>;
  nodes: Record<string, { g: SVGGElement; body: SVGCircleElement; bdg: SVGGElement; bt: SVGTextElement }>;
  chips: Record<string, Map<CspValue, ChipEl>>;
  edges: { a: string; b: string; el: SVGLineElement }[];
  arc: SVGPathElement; regions: Record<string, SVGPathElement>;
}
interface CellEl { g: SVGGElement; sq: SVGRectElement; dot: SVGCircleElement; bx: SVGPathElement; q: SVGPathElement; title: SVGTitleElement; shade: string }
interface BoardView {
  kind: 'board'; svg: SVGSVGElement; cs: number; left: number; top: number; arc: SVGPathElement;
  cols: Record<string, { g: SVGGElement; bdg: SVGGElement; bt: SVGTextElement }>;
  cells: Record<string, CellEl[]>;
}

function marker(svg: SVGSVGElement, id: string) {
  const mk = S('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4.2, markerHeight: 4.2, orient: 'auto-start-reverse' }, S('defs', {}, svg));
  S('path', { d: 'M0 0L10 5L0 10z', fill: 'var(--accent)' }, mk);
}

let uid = 0;
function buildGraphView(P: Problem): GraphView {
  const pos: Record<string, { x: number; y: number; side: Side }> = {};
  P.V.forEach((v, k) => {
    const l = P.cfg.layout?.[v];
    if (l) pos[v] = { x: l.x, y: l.y, side: l.chips ?? 'below' };
    else if (P.cfg.map === 'australia' && AUS_LAYOUT[v]) { const [lon, lat, side] = AUS_LAYOUT[v], [x, y] = proj([lon, lat]); pos[v] = { x, y, side }; }
    else { const a = -Math.PI / 2 + (2 * Math.PI * k) / P.V.length; pos[v] = { x: 150 * Math.cos(a), y: 150 * Math.sin(a), side: 'below' }; }
  });
  const R = 17, cw = P.isColor ? 15 : 20, gap = 4;
  const chipXY = (v: string, k: number, n: number): [number, number] => {
    const p = pos[v], w = n * cw + (n - 1) * gap;
    if (p.side === 'right') return [p.x + R + 8 + k * (cw + gap), p.y - cw / 2];
    if (p.side === 'left') return [p.x - R - 8 - w + k * (cw + gap), p.y - cw / 2];
    if (p.side === 'above') return [p.x - w / 2 + k * (cw + gap), p.y - R - 8 - cw];
    return [p.x - w / 2 + k * (cw + gap), p.y + R + 7];
  };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const grow = (x: number, y: number) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  P.V.forEach(v => {
    grow(pos[v].x - R - 10, pos[v].y - R - 10); grow(pos[v].x + R + 10, pos[v].y + R + 4);
    const n = P.dom[v].length, [a, b] = chipXY(v, 0, n), [c] = chipXY(v, n - 1, n);
    grow(a - 4, b - 4); grow(c + cw + 4, b + cw + 4);
  });
  if (P.cfg.map === 'australia') { grow(12, 8); grow(418, 342); }
  const pad = 8;
  const svg = S('svg', { viewBox: `${x0 - pad} ${y0 - pad} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}`, role: 'img', 'aria-label': 'Constraint graph' });
  const mid = `csp-ah${++uid}`;
  marker(svg, mid);
  const regions: Record<string, SVGPathElement> = {};
  if (P.cfg.map === 'australia') {
    const g = S('g', { class: 'csp-map' }, svg);
    for (const r in AUS_MAP) regions[r] = S('path', { d: 'M' + AUS_MAP[r].map(p => proj(p).map(n => n.toFixed(1)).join(' ')).join('L') + 'Z' }, g);
  }
  const edges = P.edges.map(([a, b]) => ({ a, b, el: S('line', { class: 'csp-edge', x1: pos[a].x, y1: pos[a].y, x2: pos[b].x, y2: pos[b].y }, svg) }));
  const arc = S('path', { class: 'csp-arc', 'marker-end': `url(#${mid})`, opacity: 0 }, svg);
  const nodes: GraphView['nodes'] = {}, chips: GraphView['chips'] = {};
  P.V.forEach(v => {
    const g = S('g', { class: 'csp-node', transform: `translate(${pos[v].x} ${pos[v].y})`, 'data-var': v }, svg);
    S('circle', { class: 'csp-ring', r: R + 4.5 }, g);
    const body = S('circle', { class: 'csp-body', r: R }, g);
    S('text', { class: 'csp-lbl' }, g).textContent = v;
    const bdg = S('g', { class: 'csp-mrv', transform: `translate(${R * 0.8} ${-R * 0.8})`, opacity: 0 }, g);
    S('circle', { r: 8.5 }, bdg);
    const bt = S('text', {}, bdg);
    S('title', {}, g).textContent = v;
    nodes[v] = { g, body, bdg, bt };
    const vals = P.values.filter(x => P.dom[v].includes(x));
    chips[v] = new Map();
    vals.forEach((x, k) => {
      const [cx, cy] = chipXY(v, k, vals.length);
      const cg = S('g', { class: 'csp-chip', transform: `translate(${cx} ${cy})`, 'data-var': v, 'data-val': x }, svg);
      S('rect', { class: 'csp-sel', x: -3, y: -3, width: cw + 6, height: cw + 6, rx: 5 }, cg);
      S('rect', { class: 'csp-c', width: cw, height: cw, rx: 3.5, fill: P.isColor ? colorOf(x) : 'var(--panel-3)' }, cg);
      if (!P.isColor) S('text', { x: cw / 2, y: cw / 2 + 0.5 }, cg).textContent = String(x);
      S('path', { class: 'csp-x', d: `M-1 ${cw + 1}L${cw + 1} -1` }, cg);
      chips[v].set(x, { g: cg, title: S('title', {}, cg) });
    });
  });
  return { kind: 'graph', svg, pos, nodes, chips, edges, arc, regions, R };
}

function buildBoardView(P: Problem): BoardView {
  const n = P.V.length, cs = 46, top = 34, left = 26;
  const svg = S('svg', { viewBox: `0 0 ${left + n * cs + 6} ${top + n * cs + 6}`, role: 'img', 'aria-label': 'Board: column i = variable Xi, row = value' });
  const mid = `csp-ahb${++uid}`;
  marker(svg, mid);
  const cols: BoardView['cols'] = {}, cells: BoardView['cells'] = {};
  P.V.forEach((v, c) => {
    const g = S('g', { class: 'csp-colh', 'data-var': v }, svg);
    S('rect', { x: left + c * cs + 4, y: 2, width: cs - 8, height: top - 8, rx: 6 }, g);
    S('text', { x: left + c * cs + cs / 2, y: 18 }, g).textContent = v;
    const bdg = S('g', { class: 'csp-mrv', transform: `translate(${left + c * cs + cs - 7} 9)`, opacity: 0 }, g);
    S('circle', { r: 8.5 }, bdg);
    cols[v] = { g, bdg, bt: S('text', {}, bdg) };
    cells[v] = [];
    for (let r = 1; r <= n; r++) {
      const shade = (r + c) % 2 ? 'd' : 'l';
      const cg = S('g', { class: 'csp-cell', transform: `translate(${left + c * cs} ${top + (r - 1) * cs})`, 'data-var': v, 'data-val': r }, svg);
      const sq = S('rect', { class: 'csp-sq ' + shade, width: cs, height: cs }, cg);
      const dot = S('circle', { class: 'csp-dot', cx: cs / 2, cy: cs / 2, r: 3.2 }, cg);
      const bx = S('path', { class: 'csp-bx', d: `M${cs / 2 - 8} ${cs / 2 - 8}l16 16m0 -16l-16 16` }, cg);
      const q = S('path', { class: 'csp-queen', transform: `translate(${cs / 2} ${cs / 2 + 1})`, d: 'M-13 9h26v4h-26zM-12 7l-3-14 7 7 8-12 8 12 7-7-3 14z' }, cg);
      S('rect', { class: 'csp-sel', x: 3, y: 3, width: cs - 6, height: cs - 6, rx: 6 }, cg);
      cells[v][r] = { g: cg, sq, dot, bx, q, title: S('title', {}, cg), shade };
    }
  });
  for (let r = 1; r <= n; r++) S('text', { class: 'csp-rowl', x: left / 2, y: top + (r - 0.5) * cs }, svg).textContent = String(r);
  const arc = S('path', { class: 'csp-arc', 'marker-end': `url(#${mid})`, opacity: 0 }, svg);
  svg.style.maxWidth = `${n * 64 + 40}px`;
  svg.style.margin = '0 auto';
  return { kind: 'board', svg, cols, cells, arc, cs, left, top };
}

/* ------------------------------------------------------------------ mount */

const KIND: Record<Kind, [string, string]> = {
  init: ['START', ''], select: ['SELECT', ''], assign: ['ASSIGN', ''], fc: ['FORWARD CHECK', ''],
  'ac3-start': ['AC-3', 'k-ac3'], revise: ['REVISE', 'k-ac3'], 'ac3-end': ['AC-3', 'k-ac3'],
  undo: ['BACKTRACK', 'k-fail'], backtrack: ['BACKTRACK', 'k-fail'], solution: ['SOLUTION', 'k-ok'],
  failure: ['FAILURE', 'k-fail'], done: ['RESULT', 'k-ok'],
};

export function mount(el: HTMLElement, config: CspConfig, opts: VizOptions = {}): VizInstance {
  if (!document.getElementById('viz-csp-css')) {
    const st = document.createElement('style');
    st.id = 'viz-csp-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const mode = opts.mode === 'predict' ? 'predict' : 'explore';
  let cfg: CspConfig = { ...config };
  let T: CspTrace | null = null, view: GraphView | BoardView | null = null;
  let i = 0, timer: ReturnType<typeof setInterval> | null = null, speed = 3, tries = 0, correct = 0, doneSent = false;
  let answered = new Set<number>();
  let fb: { cls: string; text: string; prev?: boolean } | null = null;
  let lastTreeN = 0, lastRows = 0;
  const picked = new Set<string>();
  // keep SVG text at ≥ its nominal px size when the drawing is scaled down (narrow layouts)
  const ro = new ResizeObserver(() => {
    const vb = view?.svg.viewBox.baseVal;
    if (!vb || !view?.svg.clientWidth) return;
    root.style.setProperty('--csp-k', String(Math.min(1.8, Math.max(1, vb.width / view.svg.clientWidth))));
  });

  el.innerHTML = '';
  const root = H('div', 'csp', el);
  root.tabIndex = 0;
  const bar = H('div', 'csp-bar', root);
  const ctrl = H('div', 'csp-ctrl', root);
  const narr = H('div', 'csp-narr', root);
  const badge = H('span', 'csp-badge', narr);
  const ntext = H('span', '', narr);
  const askEl = H('div', 'csp-ask', root);
  askEl.hidden = true;
  const main = H('div', 'csp-main', root);
  const stage = H('div', 'csp-card csp-stage', main);
  const stageH = H('h4', '', stage);
  const side = H('div', 'csp-side', main);
  const treeCard = H('div', 'csp-card', side);
  const treeH = H('h4', '', treeCard);
  const stackEl = H('div', 'csp-stack', treeCard);
  const treeBox = H('div', 'csp-tree', treeCard);
  const qCard = H('div', 'csp-card', side);
  H('h4', '', qCard, 'AC-3 queue');
  const qBox = H('div', 'csp-q', qCard);
  const tblCard = H('div', 'csp-card', root);
  H('h4', '', tblCard, 'Domains, step by step');
  const tblBox = H('div', 'csp-tbl', tblCard);

  const mkBtn = (ic: string, title: string, fn: () => void, cls = 'btn sm') => {
    const b = H('button', cls, ctrl);
    b.innerHTML = icon(ic);
    b.title = title;
    b.setAttribute('aria-label', title);
    b.onclick = fn;
    return b;
  };
  const bBack = mkBtn('back', 'Back (←)', () => { stop(); go(i - 1); });
  const bStep = mkBtn('step', 'Step (→)', () => { stop(); step(); }, 'btn sm primary');
  const bPlay = mkBtn('play', 'Play / pause (space)', () => (timer ? stop() : play()));
  mkBtn('reset', 'Reset', () => { stop(); reset(); });
  const sp = H('label', 'csp-speed', ctrl, 'speed');
  const spIn = H('input', '', sp);
  Object.assign(spIn, { type: 'range', min: '1', max: '5', value: String(speed) });
  spIn.oninput = () => { speed = +spIn.value; if (timer) { stop(); play(); } };
  const posEl = H('span', 'csp-pos', ctrl);
  const counters = H('div', 'csp-counters', ctrl);

  const selects: HTMLSelectElement[] = [];
  function selector(label: string, k: keyof CspConfig, options: [string, string][], dflt: string) {
    const l = H('label', '', bar, label);
    const s = H('select', '', l);
    options.forEach(([v, t]) => s.add(new Option(t, v)));
    s.value = String(cfg[k] ?? dflt);
    s.onchange = () => { cfg = { ...cfg, [k]: k === 'n' ? +s.value : s.value }; stop(); rebuild(); };
    return s;
  }
  if (mode === 'explore') {
    selector('Algorithm', 'algorithm', [['backtracking', 'Backtracking'], ['ac3', 'AC-3 only']], 'backtracking');
    selects.push(
      selector('Inference', 'inference', [['none', 'None (check constraints)'], ['fc', 'Forward checking'], ['mac', 'FC + AC-3 (p. 317)']], 'none'),
      selector('Variable order', 'varOrder', [['static', 'Static'], ['mrv', 'MRV'], ['mrv+degree', 'MRV + degree']], 'static'),
      selector('Value order', 'valOrder', [['static', 'Domain order'], ['lcv', 'LCV']], 'static'),
    );
    if (config.preset === 'nqueens') selector('Board', 'n', [4, 5, 6, 7, 8].map(n => [String(n), `${n} × ${n}`]), '4');
  } else bar.remove();

  /* ---------- lifecycle ---------- */

  function rebuild() {
    try { T = buildTrace(cfg); } catch (e) {
      T = null;
      ntext.textContent = 'Cannot build this trace: ' + (e as Error).message;
      return;
    }
    const P = T.P;
    selects.forEach(s => (s.disabled = P.algorithm === 'ac3'));
    view?.svg.remove();
    view = P.queens ? buildBoardView(P) : buildGraphView(P);
    stage.appendChild(view.svg);
    view.svg.addEventListener('click', onStageClick);
    ro.disconnect();
    ro.observe(view.svg);
    stageH.textContent = P.queens ? `${P.V.length}-queens · column = variable, row = value` : 'Constraint graph';
    treeCard.style.display = P.algorithm === 'ac3' ? 'none' : '';
    qCard.style.display = P.algorithm === 'ac3' || P.inference === 'mac' ? '' : 'none';
    answered = new Set();
    correct = 0;
    tries = 0;
    doneSent = false;
    reset();
  }

  function reset() { i = 0; picked.clear(); fb = null; lastTreeN = 0; lastRows = 0; render(false); emit(); }

  function go(k: number) {
    if (!T) return;
    k = Math.max(0, Math.min(T.steps.length - 1, k));
    if (k === i) return;
    const fwd = k === i + 1;
    i = k;
    picked.clear();
    render(fwd);
    emit();
  }

  function emit() {
    if (!T) return;
    opts.onEvent?.(T.steps[i].text);
    if (mode === 'predict' && i === T.steps.length - 1 && !doneSent) {
      doneSent = true;
      opts.onDone?.({ correct, total: T.total });
    }
  }

  const pendingQ = (): Question | null => {
    const s = T?.steps[i + 1];
    return mode === 'predict' && s?.q && !answered.has(i + 1) ? s.q : null;
  };

  function step(): boolean {
    if (!T || i >= T.steps.length - 1) return false;
    if (pendingQ()) { shake(); return false; }
    fb = null;
    go(i + 1);
    return true;
  }
  function play() {
    if (!T || i >= T.steps.length - 1) return;
    bPlay.innerHTML = icon('pause');
    timer = setInterval(() => { if (!step()) stop(); }, [1500, 1050, 700, 420, 220][speed - 1]);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    bPlay.innerHTML = icon('play');
  }
  function shake() {
    askEl.classList.remove('shake');
    void askEl.offsetWidth;
    askEl.classList.add('shake');
  }

  /* ---------- predict ---------- */

  function answer(pick: Answer) {
    const q = pendingQ();
    if (!q || !T) return;
    const r = checkQ(q, pick, T.steps[i], T.P);
    tries++;
    if (r.ok) {
      if (tries === 1) correct++;
      answered.add(i + 1);
      tries = 0;
      fb = { cls: 'good', text: 'Correct.', prev: true };
      go(i + 1);
    } else {
      fb = { cls: 'bad', text: r.msg ?? 'Not quite.' };
      renderAsk();
      shake();
    }
  }
  function reveal() {
    if (!pendingQ()) return;
    answered.add(i + 1);
    tries = 0;
    fb = { cls: '', text: 'Revealed — compare the result with your prediction.', prev: true };
    go(i + 1);
  }

  function onStageClick(e: MouseEvent) {
    const q = pendingQ();
    const t = (e.target as Element).closest('[data-var]');
    if (!q || !T || !t) return;
    const v = t.getAttribute('data-var') ?? '';
    const raw = t.getAttribute('data-val');
    const st = T.steps[i];
    if (q.type === 'var') { if (!(v in st.asg)) answer(v); return; }
    const x = T.P.values.find(y => String(y) === raw);
    if (x === undefined || !st.dom[v].includes(x)) return;
    if (q.type === 'value') { if (v === q.var) answer(x); return; }
    if (v in st.asg || (q.type === 'revise' && v !== q.var)) return;
    const k = key(v, x);
    if (picked.has(k)) picked.delete(k); else picked.add(k);
    render(false);
  }

  function renderAsk() {
    if (!T) return;
    const q = pendingQ(), P = T.P, st = T.steps[i];
    askEl.innerHTML = '';
    askEl.hidden = mode !== 'predict';
    askEl.classList.toggle('idle', !q);
    if (fb?.prev) H('div', 'fb ' + fb.cls, askEl, (q ? 'Last prediction: ' : '') + fb.text);
    if (q) {
      const what = P.queens ? 'cell' : 'chip';
      const prompts: Record<CspQuestionType, string> = {
        var: `Predict: which variable does ${P.varOrder === 'mrv' ? 'MRV' : 'MRV + degree'} select next? Click it.`,
        value: q.type === 'value' ? `Predict: which value is assigned to ${q.var}${P.valOrder === 'lcv' ? ' (least constraining value first)' : ' (first value consistent with the assignment)'}? Click its ${what}.` : '',
        prune: q.type === 'prune' ? `Predict: which values does forward checking remove after ${q.var} = ${q.val}? Click the ${what}s to cross out, then Check.` : '',
        revise: q.type === 'revise' ? `Predict: revise(${q.var}, ${q.other}) — which values of ${q.var} have no compatible value in D(${q.other}) = ${fmt(st.dom[q.other])}? Select them (or none), then Check.` : '',
      };
      H('div', 'prompt', askEl, prompts[q.type]);
      const row = H('div', 'row', askEl);
      if (q.type === 'prune' || q.type === 'revise') {
        H('button', 'btn sm primary', row, picked.size ? `Check (${picked.size} selected)` : 'Check: nothing removed').onclick = () => answer(new Set(picked));
      }
      H('button', 'btn sm', row, 'Reveal').onclick = reveal;
      H('span', 'chip', row, `${correct} of ${answered.size} right on the first try`);
    } else if (!fb?.prev) {
      H('div', 'fb', askEl, i >= T.steps.length - 1 ? `Done: ${correct} / ${T.total} predictions right on the first try.` : 'No prediction needed for the next step — press → to continue.');
    }
    if (fb && !fb.prev) H('div', 'fb ' + fb.cls, askEl, fb.text);
  }

  /* ---------- rendering ---------- */

  function render(fwd: boolean) {
    if (!T || !view) return;
    const P = T.P, st = T.steps[i], q = pendingQ();
    const [bl, bc] = KIND[st.kind];
    badge.textContent = bl;
    badge.className = 'csp-badge ' + (st.failed ? 'k-fail' : bc);
    ntext.textContent = st.text;
    posEl.textContent = `${i + 1} / ${T.steps.length}`;
    bBack.disabled = i === 0;
    bStep.disabled = i === T.steps.length - 1;
    counters.innerHTML = '';
    const chip = (l: string, v: number) => H('b', '', H('span', 'chip', counters, l + ' '), v);
    if (P.algorithm !== 'ac3') { chip('assignments', st.cnt.assign); chip('backtracks', st.cnt.backtracks); }
    chip('pruned', st.cnt.pruned);
    if (P.algorithm === 'ac3' || P.inference === 'mac') chip('revisions', st.cnt.revisions);
    renderAsk();
    const hot = new Set((st.hot ?? []).map(([v, x]) => key(v, x)));
    if (view.kind === 'graph') renderGraph(view, P, st, hot, q);
    else renderBoard(view, P, st, hot, q);
    renderTree(P, st, fwd);
    renderQueue(st);
    renderTable(P, st, fwd);
  }

  const canPick = (q: Question | null, v: string, live: boolean, asg: boolean) =>
    !!q && live && !asg && (q.type === 'prune' || ((q.type === 'revise' || q.type === 'value') && q.var === v));

  function renderGraph(view: GraphView, P: Problem, st: Step, hot: Set<string>, q: Question | null) {
    const mrv = st.kind === 'select' ? st.mrv : undefined;
    P.V.forEach(v => {
      const n = view.nodes[v], asg = v in st.asg, color = asg && P.isColor;
      n.body.style.fill = color ? colorOf(st.asg[v]) : '';
      n.g.classList.toggle('asg', color);
      n.g.classList.toggle('focus', st.focus === v);
      n.g.classList.toggle('dead', !st.dom[v].length);
      n.g.classList.toggle('clickable', q?.type === 'var' && !asg);
      n.bdg.setAttribute('opacity', mrv && v in mrv ? '1' : '0');
      if (mrv && v in mrv) n.bt.textContent = String(mrv[v]);
      const reg = view.regions[v];
      if (reg) reg.style.fill = color ? `color-mix(in srgb, ${colorOf(st.asg[v])} 40%, var(--panel-2))` : '';
      view.chips[v].forEach((ch, x) => {
        const live = st.dom[v].includes(x);
        ch.g.classList.toggle('pruned', !live && !asg);
        ch.g.classList.toggle('hot', hot.has(key(v, x)));
        ch.g.classList.toggle('gone', asg && (P.isColor || st.asg[v] !== x));
        ch.g.classList.toggle('picked', picked.has(key(v, x)));
        ch.g.classList.toggle('clickable', canPick(q, v, live, asg));
        ch.title.textContent = asg ? `${v} = ${st.asg[v]}` : live ? `${v} = ${x}: still possible` : `${v} = ${x} removed — ${st.why[v][String(x)] ?? 'not in the domain'}`;
      });
    });
    view.edges.forEach(e => e.el.classList.toggle('on', !!st.arc && [e.a, e.b].includes(st.arc[0]) && [e.a, e.b].includes(st.arc[1])));
    if (st.arc) {
      const a = view.pos[st.arc[0]], b = view.pos[st.arc[1]];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, R = view.R + 5;
      const sx = a.x + (dx / d) * R, sy = a.y + (dy / d) * R, ex = b.x - (dx / d) * R, ey = b.y - (dy / d) * R;
      const mx = (sx + ex) / 2 - (dy / d) * 16, my = (sy + ey) / 2 + (dx / d) * 16;
      view.arc.setAttribute('d', `M${sx} ${sy}Q${mx} ${my} ${ex} ${ey}`);
      view.arc.setAttribute('opacity', '1');
    } else view.arc.setAttribute('opacity', '0');
  }

  function renderBoard(view: BoardView, P: Problem, st: Step, hot: Set<string>, q: Question | null) {
    const mrv = st.kind === 'select' ? st.mrv : undefined;
    const solved = st.kind === 'solution';
    P.V.forEach(v => {
      const col = view.cols[v], asg = v in st.asg;
      col.g.classList.toggle('focus', st.focus === v);
      col.g.classList.toggle('clickable', q?.type === 'var' && !asg);
      col.bdg.setAttribute('opacity', mrv && v in mrv ? '1' : '0');
      if (mrv && v in mrv) col.bt.textContent = String(mrv[v]);
      for (let r = 1; r <= P.V.length; r++) {
        const c = view.cells[v][r];
        const live = st.dom[v].includes(r), isQ = asg && st.asg[v] === r, pruned = !asg && !live;
        c.sq.setAttribute('class', 'csp-sq ' + (hot.has(key(v, r)) ? 'hotc' : pruned ? 'pr' : c.shade));
        c.dot.style.display = live && !asg ? '' : 'none';
        c.bx.style.display = pruned ? '' : 'none';
        c.q.style.display = isQ ? '' : 'none';
        c.q.classList.toggle('sol', solved);
        c.g.classList.toggle('picked', picked.has(key(v, r)));
        c.g.classList.toggle('clickable', (q?.type === 'var' && !asg) || canPick(q, v, live, asg));
        c.title.textContent = isQ ? `${v} = ${r} (queen)` : asg ? `${v} is assigned` : live ? `${v} = ${r}: still possible` : `${v} = ${r} removed — ${st.why[v][r] ?? ''}`;
      }
    });
    if (st.arc) {
      const ci = P.idx[st.arc[0]], cj = P.idx[st.arc[1]], { cs, left, top } = view;
      const sx = left + ci * cs + cs / 2, ex = left + cj * cs + cs / 2;
      view.arc.setAttribute('d', `M${sx} ${top - 6}Q${(sx + ex) / 2} ${top - 30 - Math.abs(cj - ci) * 3} ${ex + (ex > sx ? -5 : 5)} ${top - 6}`);
      view.arc.setAttribute('opacity', '1');
    } else view.arc.setAttribute('opacity', '0');
  }

  function renderTree(P: Problem, st: Step, fwd: boolean) {
    if (!T || P.algorithm === 'ac3') return;
    const nodes = T.nodes;
    stackEl.innerHTML = '';
    H('span', '', stackEl, 'assignment');
    const path: string[] = [];
    for (let n = st.node; n > 0; n = nodes[n].parent) path.unshift(nodes[n].label.replace('=', ' = '));
    if (!path.length) H('span', 'chip', stackEl, '{ }');
    path.forEach(l => H('span', 'chip', stackEl, l));
    const N = nodes.slice(0, st.nNodes);
    treeH.textContent = 'Search tree';
    H('span', '', treeH, `${N.length - 1} assignment${N.length === 2 ? '' : 's'} tried`);
    treeBox.innerHTML = '';
    if (N.length > 150) { H('span', 'csp-q', treeBox, 'Tree too large to draw — the current path is shown above.'); return; }
    const kids: number[][] = N.map(() => []);
    N.forEach(n => { if (n.parent >= 0) kids[n.parent].push(n.id); });
    const X: number[] = [], W = 66, HH = 44;
    let leaf = 0, maxD = 0;
    const lay = (id: number) => {
      maxD = Math.max(maxD, N[id].depth);
      if (!kids[id].length) { X[id] = leaf++ * W; return; }
      kids[id].forEach(lay);
      X[id] = (X[kids[id][0]] + X[kids[id][kids[id].length - 1]]) / 2;
    };
    lay(0);
    const w = Math.max(leaf, 1) * W + 16, h = (maxD + 1) * HH + 8;
    const svg = S('svg', { width: w, height: h, viewBox: `${-W / 2 + 8} -16 ${w} ${h}` }, treeBox);
    const onPath = new Set<number>();
    for (let n = st.node; n >= 0; n = N[n].parent) onPath.add(n);
    N.forEach(n => { if (n.parent >= 0) S('line', { x1: X[n.parent], y1: (n.depth - 1) * HH, x2: X[n.id], y2: n.depth * HH, class: onPath.has(n.id) ? 'path' : '' }, svg); });
    N.forEach(n => {
      const cls = n.sol <= i ? 'sol' : n.fail <= i ? 'fail' : n.id === st.node ? 'cur' : onPath.has(n.id) ? 'path' : '';
      const g = S('g', { class: cls + (fwd && n.id >= lastTreeN ? ' new' : ''), transform: `translate(${X[n.id]} ${n.depth * HH})` }, svg);
      const tw = n.label.length * 7.4 + 14;
      S('rect', { x: -tw / 2, y: -11, width: tw, height: 22, rx: 11 }, g);
      S('text', { y: 0.5 }, g).textContent = n.label;
    });
    lastTreeN = N.length;
    treeBox.scrollTo({ left: Math.max(0, X[st.node] - treeBox.clientWidth / 2 + W / 2), top: Math.max(0, N[st.node].depth * HH - treeBox.clientHeight / 2), behavior: 'smooth' });
  }

  function renderQueue(st: Step) {
    qBox.innerHTML = '';
    if (!st.queue && !st.arc) { H('span', 'empty', qBox, 'Not running.'); return; }
    if (st.arc) H('span', 'cur', qBox, `revise(${st.arc[0]}, ${st.arc[1]})`).title = 'arc being revised';
    const added = new Set((st.added ?? []).map(a => a.join('>')));
    (st.queue ?? []).forEach((a, k) => {
      const isAdd = added.has(a.join('>'));
      const s = H('span', 'arcc' + (isAdd ? ' add' : k === 0 ? ' next' : ''), qBox, `${a[0]} → ${a[1]}`);
      s.title = isAdd ? 're-queued by this revision' : k === 0 ? 'next arc to pop' : '';
    });
    if (!st.queue?.length) H('span', 'empty', qBox, 'queue empty');
  }

  function renderTable(P: Problem, st: Step, fwd: boolean) {
    if (!T) return;
    tblBox.innerHTML = '';
    const tb = H('table', '', tblBox);
    const hr = H('tr', '', H('thead', '', tb));
    H('th', '', hr, '');
    P.V.forEach(v => H('th', '', hr, v));
    const body = H('tbody', '', tb);
    const rows = T.rows.slice(0, st.nRows);
    const sorted = (xs: CspValue[]) => xs.slice().sort((a, b) => P.values.indexOf(a) - P.values.indexOf(b));
    rows.forEach((r, k) => {
      const tr = H('tr', [r.dead ? 'dead' : '', k === rows.length - 1 ? 'last' : '', fwd && k >= lastRows ? 'new' : ''].join(' ').trim(), body);
      H('td', 'lbl', tr, (r.dead ? '✕ ' : '') + r.label.replace('=', ' = '));
      P.V.forEach(v => {
        const d = H('span', 'csp-dc', H('td', '', tr));
        if (v in r.asg) {
          if (P.isColor) { const b = H('i', 'wide', d); b.style.background = colorOf(r.asg[v]); b.title = `${v} = ${r.asg[v]}`; }
          else H('span', 'num asg', d, '= ' + r.asg[v]);
        } else if (!r.dom[v].length) H('span', 'emp', d, '∅');
        else if (P.isColor) sorted(r.dom[v]).forEach(x => { const b = H('i', '', d); b.style.background = colorOf(x); b.title = String(x); });
        else H('span', 'num', d, fmt(sorted(r.dom[v])));
      });
    });
    lastRows = rows.length;
    tblBox.scrollTop = tblBox.scrollHeight;
  }

  function onKey(e: KeyboardEvent) {
    if ((e.target as Element).closest('select, input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); step(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(i - 1); }
    else if (e.key === ' ') { e.preventDefault(); if (timer) stop(); else play(); }
  }
  root.addEventListener('keydown', onKey);
  rebuild();

  return {
    destroy() {
      stop();
      ro.disconnect();
      root.removeEventListener('keydown', onKey);
      el.innerHTML = '';
    },
  };
}
