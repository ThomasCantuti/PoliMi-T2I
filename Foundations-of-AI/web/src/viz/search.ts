// AlgoDojo – search visualizer: state space + search tree + frontier + reached table, with predict mode.
// Replicates the course Python (slides p.130, 131, 145, 153, 155, 185, 186, 194) and IDA* (p.242).
import type { Preset, VizInstance, VizOptions } from './types';

// ================================================================ config (public)

export type Algorithm = 'bfs' | 'bfs_early' | 'dfs' | 'dls' | 'ids' | 'ucs' | 'greedy' | 'astar' | 'wastar' | 'idastar';

export interface GraphNodeSpec {
  x: number; // position in a 0..100 box (y grows downwards)
  y: number;
  h?: number; // heuristic value (informed algorithms)
  name?: string; // optional long name (tooltip / caption), the key stays the short state id
}

export interface GraphSpec {
  nodes: Record<string, GraphNodeSpec>;
  edges: Array<[string, string, number?]>; // [from, to, cost = 1]
  directed?: boolean; // default false
}

export interface SearchConfig {
  algorithm: Algorithm;
  graph?: GraphSpec; // explicit state space (omit when `grid` is given)
  grid?: string[]; // path-planning grid instead: '#' wall, 'S' start, 'G' goal; 4-connected, unit costs,
  diagonal?: boolean; //   h = Manhattan distance (Chebyshev if diagonal); states are "row,col"
  start?: string; // default 'S'
  goal?: string | string[]; // default 'G'
  /** true = reached table (aima best_first_search / BFS reached set); false = tree search, a child whose state is
   *  already on its own path is dropped (is_cycle); 'expanded' = expanded ("closed") list as in slides p.105.
   *  Default: true for bfs/ucs/greedy/A*, false for dfs/dls; ids/idastar are always tree search. */
  graphSearch?: boolean | 'expanded';
  limit?: number; // dls: nodes with depth >= limit are goal-tested but not expanded (default 2)
  idsStart?: number; // ids: first limit (default 0 like slides p.157; the aima code starts at 1)
  weight?: number; // wastar: f = g + w·h (default 2)
  /** LIFO algorithms: 'alpha' (default) = alphabetically-first child expanded first (hand traces, slides p.143);
   *  'code' = children pushed in expand() order and pop() takes the last one (aima code p.145). */
  childOrder?: 'alpha' | 'code';
  ties?: 'fifo' | 'alpha' | 'lifo'; // priority-queue ties: insertion order (aima PriorityQueue, default) / name / newest
}
// Children are always generated in alphabetical order of the state id (aima GraphProblem.actions is sorted).

// ================================================================ engine

type Queue = 'fifo' | 'lifo' | 'pq';
type GraphSearch = boolean | 'expanded';
type Ghost = 'cycle' | 'reached' | 'expanded' | 'bound';
type Status = 'found' | 'failure' | 'cutoff' | 'stopped';
type StepKind = 'init' | 'iter' | 'expand' | 'limit' | 'goal' | 'end';

interface AlgoInfo { name: string; short: string; q: Queue; key?: 'g' | 'h' | 'f'; early?: boolean }

const ALGOS: Record<Algorithm, AlgoInfo> = {
  bfs: { name: 'Breadth-first search', short: 'BFS', q: 'fifo' },
  bfs_early: { name: 'Breadth-first search · early goal test', short: 'BFS', q: 'fifo', early: true },
  dfs: { name: 'Depth-first search', short: 'DFS', q: 'lifo' },
  dls: { name: 'Depth-limited search', short: 'DLS', q: 'lifo' },
  ids: { name: 'Iterative deepening search', short: 'IDS', q: 'lifo' },
  ucs: { name: 'Uniform-cost search', short: 'UCS', q: 'pq', key: 'g' },
  greedy: { name: 'Greedy best-first search', short: 'Greedy', q: 'pq', key: 'h' },
  astar: { name: 'A* search', short: 'A*', q: 'pq', key: 'f' },
  wastar: { name: 'Weighted A* search', short: 'Weighted A*', q: 'pq', key: 'f' },
  idastar: { name: 'Iterative deepening A* (IDA*)', short: 'IDA*', q: 'lifo', key: 'f' },
};
const TREE_ONLY: Algorithm[] = ['ids', 'idastar'];
const INFORMED: Algorithm[] = ['greedy', 'astar', 'wastar', 'idastar'];
const MAX_STEPS = 600;

interface Norm {
  algorithm: Algorithm;
  graph: GraphSpec;
  grid: string[] | null;
  start: string;
  goals: Set<string>;
  graphSearch: GraphSearch;
  limit: number;
  idsStart: number;
  weight: number;
  childOrder: 'alpha' | 'code';
  ties: 'fifo' | 'alpha' | 'lifo';
}

interface TNode {
  id: number; state: string; parent: number | null; g: number; h: number; f: number; depth: number; iter: number;
  seq?: number; exp?: number; order?: number; cut?: boolean; stale?: number; ghost?: Ghost; vs?: number; better?: number;
}

interface Step {
  kind: StepKind; iter: number; limit: number | null; bound: number | null; nextBound: number | null;
  frontier: number[]; inserted: number[]; reached: number[] | null; closed: string[] | null; nNodes: number;
  cur: number | null; gen: number[]; skipped: number[]; intro: string | null; found: number | null; status: Status | null;
}

interface Trace {
  c: Norm; A: AlgoInfo; nodes: TNode[]; steps: Step[]; adj: Adj; w: number;
  result: { status: Status; node: number | null; path: string[] | null; cost: number | null };
  optimal: { path: string[]; cost: number } | null; fewest: string[] | null;
}

type Adj = Record<string, Array<[string, number]>>;

const defaultGraphSearch = (a: Algorithm): GraphSearch => !['dfs', 'dls', 'ids', 'idastar'].includes(a);

function gridGraph(rows: string[], diagonal: boolean): { graph: GraphSpec; start: string; goal: string } {
  const nodes: Record<string, GraphNodeSpec> = {}, edges: GraphSpec['edges'] = [], cell = new Map<string, [number, number]>();
  let start = '', goal = '';
  const C = Math.max(...rows.map(r => r.length));
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '#') return;
    const id = `${r},${c}`;
    cell.set(id, [r, c]);
    if (ch === 'S') start = id;
    if (ch === 'G') goal = id;
  }));
  const [gr, gc] = cell.get(goal) ?? [0, 0];
  for (const [id, [r, c]] of cell) {
    const dr = Math.abs(r - gr), dc = Math.abs(c - gc);
    nodes[id] = { x: (c + 0.5) * 100 / C, y: (r + 0.5) * 100 / C, h: diagonal ? Math.max(dr, dc) : dr + dc };
    const nb = diagonal ? [[0, 1], [1, -1], [1, 0], [1, 1]] : [[0, 1], [1, 0]];
    for (const [a, b] of nb) if (cell.has(`${r + a},${c + b}`)) edges.push([id, `${r + a},${c + b}`, 1]);
  }
  return { graph: { nodes, edges, directed: false }, start, goal };
}

export function normalize(cfg: SearchConfig): Norm {
  const algorithm: Algorithm = ALGOS[cfg.algorithm] ? cfg.algorithm : 'bfs';
  let graph = cfg.graph ?? { nodes: {}, edges: [] }, start = cfg.start ?? 'S', goal: string | string[] = cfg.goal ?? 'G';
  if (cfg.grid) ({ graph, start, goal } = gridGraph(cfg.grid, !!cfg.diagonal));
  return {
    algorithm, graph, start, grid: cfg.grid ?? null,
    goals: new Set(Array.isArray(goal) ? goal : [goal]),
    graphSearch: cfg.graphSearch === undefined || TREE_ONLY.includes(algorithm) ? defaultGraphSearch(algorithm) : cfg.graphSearch,
    limit: cfg.limit ?? 2, idsStart: cfg.idsStart ?? 0, weight: cfg.weight ?? 2,
    childOrder: cfg.childOrder ?? 'alpha', ties: cfg.ties ?? 'fifo',
  };
}

function adjacency(g: GraphSpec): Adj {
  const adj: Adj = {};
  for (const id in g.nodes) adj[id] = [];
  const add = (a: string, b: string, cost: number) => {
    const l = (adj[a] ??= []), k = l.findIndex(e => e[0] === b);
    if (k >= 0) l[k] = [b, cost]; else l.push([b, cost]);
  };
  for (const [a, b, cost = 1] of g.edges) { add(a, b, +cost); if (!g.directed) add(b, a, +cost); }
  for (const k in adj) adj[k].sort((p, q) => (p[0] < q[0] ? -1 : p[0] > q[0] ? 1 : 0));
  return adj;
}

const num = (v: number): string => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)));

/** Run the configured algorithm once and record every step (snapshots make "back" trivial). */
export function trace(cfg: SearchConfig | Norm): Trace {
  const c: Norm = 'goals' in cfg ? cfg : normalize(cfg);
  const A = ALGOS[c.algorithm], adj = adjacency(c.graph);
  const isGoal = (s: string) => c.goals.has(s);
  const w = c.algorithm === 'wastar' ? +c.weight : 1;
  const H = (s: string) => +(c.graph.nodes[s]?.h ?? 0);
  const nodes: TNode[] = [], steps: Step[] = [];
  let iter = 0, seq = 0, fr: TNode[] = [], bound: number | null = null, limit: number | null = null, nextBound = Infinity;
  let reached: Map<string, TNode> | null = null, closed: Set<string> | null = null;

  const mk = (state: string, parent: TNode | null, cost: number): TNode => {
    const g = parent ? parent.g + cost : 0, h = H(state);
    const n: TNode = { id: nodes.length, state, parent: parent ? parent.id : null, g, h, depth: parent ? parent.depth + 1 : 0, iter,
      f: A.key === 'g' ? g : A.key === 'h' ? h : g + w * h };
    nodes.push(n);
    return n;
  };
  const cmp = (a: TNode, b: TNode) => (a.f - b.f) || (c.ties === 'alpha' ? (a.state < b.state ? -1 : a.state > b.state ? 1 : 0) : 0) ||
    (c.ties === 'lifo' ? b.seq! - a.seq! : a.seq! - b.seq!);
  const push = (n: TNode) => { n.seq = seq++; fr.push(n); };
  const popOrder = () => (A.q === 'fifo' ? fr.slice() : A.q === 'lifo' ? fr.slice().reverse() : fr.slice().sort(cmp));
  const pop = (): TNode => {
    if (A.q === 'fifo') return fr.shift()!;
    if (A.q === 'lifo') return fr.pop()!;
    const best = popOrder()[0];
    fr.splice(fr.indexOf(best), 1);
    return best;
  };
  const onPath = (n: TNode, s: string) => { for (let a: TNode | null = n; a; a = a.parent == null ? null : nodes[a.parent]) if (a.state === s) return true; return false; };
  const snap = (kind: StepKind, extra: Partial<Step> = {}) => steps.push({ kind, iter, limit, bound, nextBound: nextBound === Infinity ? null : nextBound,
    frontier: popOrder().map(n => n.id), inserted: fr.map(n => n.id), reached: reached ? [...reached.values()].map(n => n.id) : null,
    closed: closed ? [...closed] : null, nNodes: nodes.length, cur: null, gen: [], skipped: [], intro: null, found: null, status: null, ...extra });

  function run(intro: string | null): { status: Status; node?: TNode; skipped?: number[] } {
    fr = []; seq = 0; nextBound = Infinity;
    reached = c.graphSearch === true ? new Map() : null;
    closed = c.graphSearch === 'expanded' ? new Set() : null;
    let status: Status = 'failure', order = 0;
    const root = mk(c.start, null, 0);
    if (A.early && isGoal(root.state)) {
      root.exp = steps.length; root.order = ++order;
      snap('goal', { cur: root.id, found: root.id, intro });
      return { status: 'found', node: root };
    }
    push(root);
    reached?.set(root.state, root);
    snap(steps.length ? 'iter' : 'init', { intro });
    while (fr.length) {
      if (steps.length > MAX_STEPS) return { status: 'stopped' };
      const skipped: number[] = [];
      let node: TNode | null = pop();
      while (node && closed?.has(node.state)) { node.stale = steps.length; skipped.push(node.id); node = fr.length ? pop() : null; }
      if (!node) return { status, skipped };
      node.exp = steps.length; node.order = ++order;
      if (!A.early && isGoal(node.state)) { snap('goal', { cur: node.id, skipped, found: node.id }); return { status: 'found', node }; }
      if (limit != null && node.depth >= limit) {
        status = 'cutoff'; node.cut = true;
        snap('limit', { cur: node.id, skipped });
        continue;
      }
      closed?.add(node.state);
      const gen: number[] = [], add: TNode[] = [];
      for (const [s1, cost] of adj[node.state] ?? []) {
        const ch = mk(s1, node, cost);
        gen.push(ch.id);
        if (A.early && isGoal(s1)) { snap('goal', { cur: node.id, skipped, gen, found: ch.id }); return { status: 'found', node: ch }; }
        if (c.graphSearch === false && onPath(node, s1)) {
          ch.ghost = 'cycle';
          if (limit != null && ch.depth >= limit) status = 'cutoff'; // aima DLS pops it and hits `len(node) >= limit` first
          continue;
        }
        if (reached) {
          const r = reached.get(s1);
          if (r && !(A.q === 'pq' && ch.g < r.g)) { ch.ghost = 'reached'; ch.vs = r.g; continue; }
          if (r) ch.better = r.g;
          reached.set(s1, ch);
        }
        if (closed?.has(s1)) { ch.ghost = 'expanded'; continue; }
        if (bound != null && ch.f > bound) { ch.ghost = 'bound'; nextBound = Math.min(nextBound, ch.f); continue; }
        add.push(ch);
      }
      if (A.q === 'lifo' && c.childOrder === 'alpha') add.reverse();
      add.forEach(push);
      snap('expand', { cur: node.id, skipped, gen });
    }
    return { status };
  }

  let res: ReturnType<typeof run> = { status: 'failure' }, intro: string | null = null;
  if (c.algorithm === 'ids') {
    for (let L = c.idsStart; L < 60; L++) {
      limit = L; iter = L - c.idsStart;
      res = run(intro);
      if (res.status !== 'cutoff') break;
      intro = `L = ${L} is exhausted with result cutoff (nodes at depth ${L} were not expanded) → restart from the root with L = ${L + 1}.`;
    }
  } else if (c.algorithm === 'idastar') {
    bound = H(c.start);
    for (let k = 0; k < 60; k++) {
      iter = k;
      res = run(intro);
      if (res.status !== 'failure' || nextBound === Infinity) break;
      intro = `No goal with f ≤ ${num(bound)}. The smallest f that exceeded the cutoff is ${num(nextBound)} → new cutoff ${num(nextBound)}; restart from the root.`;
      bound = nextBound;
    }
  } else {
    if (c.algorithm === 'dls') limit = c.limit;
    res = run(null);
  }
  if (res.status !== 'found') snap('end', { skipped: res.skipped ?? [] });
  steps[steps.length - 1].status = res.status;
  const pathOf = (n: TNode) => statesOf(nodes, n);
  return {
    c, A, nodes, steps, adj, w,
    result: { status: res.status, node: res.node ? res.node.id : null, path: res.node ? pathOf(res.node) : null, cost: res.node ? res.node.g : null },
    optimal: dijkstra(adj, c.start, c.goals), fewest: bfsPath(adj, c.start, c.goals),
  };
}

function statesOf(nodes: TNode[], n: TNode): string[] {
  const p: string[] = [];
  for (let a: TNode | null = n; a; a = a.parent == null ? null : nodes[a.parent]) p.unshift(a.state);
  return p;
}

function dijkstra(adj: Adj, start: string, goals: Set<string>): { path: string[]; cost: number } | null {
  const dist: Record<string, number> = { [start]: 0 }, prev: Record<string, string> = {}, done = new Set<string>();
  for (;;) {
    let u: string | null = null;
    for (const s in dist) if (!done.has(s) && (u == null || dist[s] < dist[u])) u = s;
    if (u == null) return null;
    if (goals.has(u)) { const p = [u]; while (prev[p[0]] != null) p.unshift(prev[p[0]]); return { path: p, cost: dist[u] }; }
    done.add(u);
    for (const [v, w] of adj[u] ?? []) if (dist[v] == null || dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
  }
}

function bfsPath(adj: Adj, start: string, goals: Set<string>): string[] | null {
  const prev: Record<string, string | null> = { [start]: null }, q = [start];
  while (q.length) {
    const u = q.shift()!;
    if (goals.has(u)) { const p = [u]; while (prev[p[0]] != null) p.unshift(prev[p[0]]!); return p; }
    for (const [v] of adj[u] ?? []) if (!(v in prev)) { prev[v] = u; q.push(v); }
  }
  return null;
}

// ================================================================ presets

const COSTS: GraphSpec = {
  nodes: { S: { x: 4, y: 55 }, A: { x: 26, y: 20 }, B: { x: 54, y: 4 }, D: { x: 82, y: 16 }, E: { x: 58, y: 46 }, C: { x: 40, y: 92 }, G: { x: 97, y: 62 } },
  edges: [['S', 'A', 1], ['A', 'B', 2], ['B', 'D', 1], ['D', 'G', 2], ['S', 'C', 3], ['C', 'G', 8], ['A', 'E', 4], ['E', 'G', 3]],
};
const REPEATED: GraphSpec = {
  nodes: { S: { x: 4, y: 50 }, A: { x: 34, y: 12 }, B: { x: 34, y: 88 }, C: { x: 66, y: 12 }, D: { x: 66, y: 88 }, G: { x: 96, y: 50 } },
  edges: [['S', 'A'], ['S', 'B'], ['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['C', 'G'], ['D', 'G']],
};
const SLIDES_DFS: GraphSpec = {
  directed: true,
  nodes: { 1: { x: 50, y: 4 }, 2: { x: 26, y: 28 }, 3: { x: 74, y: 28 }, 4: { x: 13, y: 52 }, 5: { x: 37, y: 52 }, 8: { x: 63, y: 52 },
    9: { x: 87, y: 52 }, 6: { x: 5, y: 76 }, 7: { x: 21, y: 76 }, 11: { x: 55, y: 76 }, 12: { x: 71, y: 76 }, 13: { x: 47, y: 98 }, 14: { x: 63, y: 98 } },
  edges: [['1', '2'], ['1', '3'], ['2', '4'], ['2', '5'], ['4', '6'], ['4', '7'], ['3', '8'], ['3', '9'], ['8', '11'], ['8', '12'], ['11', '13'], ['11', '14']],
};
const LOST: GraphSpec = {
  nodes: { S: { x: 4, y: 52 }, A: { x: 18, y: 16 }, C: { x: 40, y: 4 }, D: { x: 63, y: 4 }, E: { x: 82, y: 14 }, F: { x: 95, y: 34 },
    G: { x: 92, y: 66 }, B: { x: 48, y: 90 } },
  edges: [['S', 'A'], ['A', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'G'], ['S', 'B'], ['B', 'G']],
};
const BINARY: GraphSpec = (() => {
  const ids = 'ABCDEFGHIJKLMNO', nodes: Record<string, GraphNodeSpec> = {}, edges: GraphSpec['edges'] = [];
  [...ids].forEach((s, k) => {
    const d = Math.floor(Math.log2(k + 1)), slot = k + 1 - 2 ** d;
    nodes[s] = { x: ((slot + 0.5) * 100) / 2 ** d, y: 4 + d * 31 };
    if (k) edges.push([ids[(k - 1) >> 1], s]);
  });
  return { nodes, edges, directed: true };
})();
const ROMANIA: GraphSpec = {
  nodes: {
    A: { x: 0, y: 26, h: 366, name: 'Arad' }, Z: { x: 6, y: 13, h: 374, name: 'Zerind' }, O: { x: 13, y: 0, h: 380, name: 'Oradea' },
    S: { x: 38, y: 37, h: 253, name: 'Sibiu' }, T: { x: 1, y: 52, h: 329, name: 'Timisoara' }, L: { x: 24, y: 62, h: 244, name: 'Lugoj' },
    M: { x: 25, y: 75, h: 241, name: 'Mehadia' }, D: { x: 24, y: 88, h: 242, name: 'Drobeta' }, C: { x: 52, y: 92, h: 160, name: 'Craiova' },
    R: { x: 46, y: 52, h: 193, name: 'Rimnicu Vilcea' }, F: { x: 69, y: 40, h: 176, name: 'Fagaras' }, P: { x: 74, y: 66, h: 100, name: 'Pitesti' },
    B: { x: 100, y: 79, h: 0, name: 'Bucharest' },
  },
  edges: [['A', 'Z', 75], ['A', 'S', 140], ['A', 'T', 118], ['Z', 'O', 71], ['O', 'S', 151], ['T', 'L', 111], ['L', 'M', 70], ['M', 'D', 75],
    ['D', 'C', 120], ['C', 'R', 146], ['C', 'P', 138], ['S', 'F', 99], ['S', 'R', 80], ['R', 'P', 97], ['F', 'B', 211], ['P', 'B', 101]],
};
const INCONSISTENT: GraphSpec = {
  directed: true,
  nodes: { S: { x: 50, y: 2, h: 0 }, A: { x: 16, y: 36, h: 100 }, B: { x: 84, y: 36, h: 1 }, C: { x: 50, y: 64, h: 90 }, G: { x: 50, y: 98, h: 0 } },
  edges: [['S', 'A', 1], ['S', 'B', 2], ['A', 'C', 1], ['B', 'C', 2], ['C', 'G', 100]],
};
const WEIGHTED: GraphSpec = {
  nodes: { S: { x: 4, y: 48, h: 5 }, A: { x: 48, y: 6, h: 3 }, B: { x: 30, y: 46, h: 4 }, C: { x: 20, y: 90, h: 5 }, D: { x: 50, y: 88, h: 4 },
    E: { x: 78, y: 82, h: 3 }, G: { x: 96, y: 44, h: 0 } },
  edges: [['S', 'A', 3], ['A', 'G', 4], ['S', 'B', 2], ['B', 'D', 2], ['S', 'C', 1], ['C', 'D', 1], ['D', 'E', 1], ['E', 'G', 3]],
};
const IDA: GraphSpec = {
  nodes: { S: { x: 4, y: 50, h: 5 }, A: { x: 35, y: 14, h: 4 }, B: { x: 35, y: 86, h: 2 }, C: { x: 66, y: 14, h: 3 }, D: { x: 66, y: 86, h: 1 },
    G: { x: 96, y: 50, h: 0 } },
  edges: [['S', 'A', 2], ['S', 'B', 3], ['A', 'C', 2], ['B', 'D', 3], ['C', 'G', 3], ['D', 'G', 2]],
};
const NAV_GRID = ['...........', '.#...#####.', '.##...G..#.', 'S.########.', '...........'];

export const PRESETS: Preset<SearchConfig>[] = [
  { name: 'Repeated states: tree vs graph search (BFS)', topic: 'formulation', config: { algorithm: 'bfs', graphSearch: false, graph: REPEATED } },
  { name: 'BFS vs UCS: fewest steps is not cheapest', topic: 'uninformed', config: { algorithm: 'bfs', graph: COSTS } },
  { name: 'Uniform-cost search with a reached-table update', topic: 'uninformed', config: { algorithm: 'ucs', graph: COSTS } },
  { name: 'DFS on the slides tree (p.143)', topic: 'uninformed', config: { algorithm: 'dfs', graph: SLIDES_DFS, start: '1', goal: '12' } },
  { name: 'DFS gets lost (not optimal)', topic: 'uninformed', config: { algorithm: 'dfs', graph: LOST } },
  { name: 'Iterative deepening (slides p.157–159)', topic: 'uninformed', config: { algorithm: 'ids', graph: BINARY, start: 'A', goal: 'F' } },
  { name: 'Romania: greedy best-first (AIMA)', topic: 'informed', config: { algorithm: 'greedy', graph: ROMANIA, start: 'A', goal: 'B' } },
  { name: 'Romania: A* (AIMA)', topic: 'informed', config: { algorithm: 'astar', graph: ROMANIA, start: 'A', goal: 'B' } },
  { name: 'Inconsistent heuristic: expanded list vs tree search (slides p.227–229)', topic: 'informed',
    config: { algorithm: 'astar', graphSearch: 'expanded', graph: INCONSISTENT } },
  { name: 'Weighted A* (w = 2): fewer expansions, worse path', topic: 'informed', config: { algorithm: 'wastar', weight: 2, graph: WEIGHTED } },
  { name: 'IDA*: growing f-cutoffs', topic: 'informed', config: { algorithm: 'idastar', graph: IDA } },
  { name: 'Path planning grid: A* (slides p.198–201)', topic: 'informed', config: { algorithm: 'astar', grid: NAV_GRID } },
];

// ================================================================ UI

const ICON = {
  reset: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.8 8a5.2 5.2 0 1 0 1.6-3.8M2.6 2.2v3h3"/></svg>',
  back: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>',
  next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path class="sv-fill" d="M5 3.2v9.6L12.6 8z"/></svg>',
  pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9"/></svg>',
};

const esc = (s: string) => s.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
const NS = 'http://www.w3.org/2000/svg';
function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, html = ''): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (html) e.innerHTML = html;
  return e;
}

interface Opt { label: string; ok: boolean }
interface LabelSpot { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
interface Box { x: number; y: number; w: number; h: number }

/** Pick a label position around a node (radius R at X,Y) far from its incident edges, avoiding the obstacle boxes
 *  and the canvas border; the chosen box is added to the obstacles. */
function placeLabel(angles: number[], R: number, X: number, Y: number, w: number, boxes: Box[], W: number, H: number): LabelSpot {
  const cand: Array<[number, LabelSpot]> = [
    [-Math.PI / 4, { x: R - 3, y: -R - 4, anchor: 'start' }], [-3 * Math.PI / 4, { x: -R + 3, y: -R - 4, anchor: 'end' }],
    [Math.PI / 4, { x: R - 3, y: R + 13, anchor: 'start' }], [3 * Math.PI / 4, { x: -R + 3, y: R + 13, anchor: 'end' }],
    [-Math.PI / 2, { x: 0, y: -R - 7, anchor: 'middle' }], [Math.PI / 2, { x: 0, y: R + 17, anchor: 'middle' }],
    [0, { x: R + 5, y: 4, anchor: 'start' }], [Math.PI, { x: -R - 5, y: 4, anchor: 'end' }],
  ];
  const gap = (a: number) => Math.min(Math.PI, ...angles.map(b => { const d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); }));
  const boxOf = (p: LabelSpot): Box => ({ x: X + p.x - (p.anchor === 'start' ? 0 : p.anchor === 'end' ? w : w / 2), y: Y + p.y - 11, w, h: 14 });
  const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  let best = cand[0][1], bestScore = -Infinity;
  cand.forEach(([a, p], k) => {
    const bx = boxOf(p), out = bx.x < 1 || bx.y < 1 || bx.x + bx.w > W - 1 || bx.y + bx.h > H - 1;
    const score = gap(a) - k * 1e-3 - 4 * boxes.filter(o => hit(o, bx)).length - (out ? 6 : 0);
    if (score > bestScore) { bestScore = score; best = p; }
  });
  boxes.push(boxOf(best));
  return best;
}

let uidSeq = 0;

export function mount(el: HTMLElement, config: SearchConfig, opts: VizOptions = {}): VizInstance {
  injectCSS();
  const mode = opts.mode === 'predict' ? 'predict' : 'explore';
  const uid = `sv${++uidSeq}`;
  const root = document.createElement('div');
  root.className = 'sv';
  root.tabIndex = 0;
  root.innerHTML = skeleton(mode, uid);
  el.append(root);
  const $ = <E extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as E;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cfg: SearchConfig = structuredClone(config);
  let T: Trace = trace(cfg);
  let i = 0, timer = 0, speed = 1, raf = 0, lastEvent = -1;
  // predict state
  const P = { correct: 0, total: 0, first: true, fb: '', fbOk: true, done: false, opts: [] as Opt[], optsFor: -1, optsKind: '' };
  // graph geometry
  let gPos: Record<string, [number, number]> = {}, gCell = 0;
  // tree elements and displayed positions
  const tEls = new Map<number, { g: SVGGElement; line: SVGLineElement | null }>();
  const tPos = new Map<number, { x: number; y: number }>();
  let tIter = -1;

  // ---------------------------------------------------------------- helpers
  const alg = () => T.c.algorithm;
  const nm = (s: string) => (T.c.grid ? `(${s})` : s);
  const unitCosts = () => T.c.graph.edges.every(e => (e[2] ?? 1) === 1);
  const keyName = () => (T.A.key === 'g' ? 'g' : T.A.key === 'h' ? 'h' : 'f');
  const isLast = () => i === T.steps.length - 1;
  const visible = (s: Step) => T.nodes.filter(n => n.iter === s.iter && n.id < s.nNodes);
  const pathIds = (id: number | null) => { const out: number[] = []; for (let a = id; a != null; a = T.nodes[a].parent) out.unshift(a); return out; };
  const showSolution = () => mode === 'explore' || P.done;
  const pathCost = (p: string[]) => p.slice(1).reduce((s, v, k) => s + (T.adj[p[k]].find(e => e[0] === v)?.[1] ?? 0), 0);

  function vals(n: TNode): string {
    switch (alg()) {
      case 'ucs': return `g=${num(n.g)}`;
      case 'greedy': return `h=${num(n.h)}`;
      case 'astar': case 'idastar': return `g=${num(n.g)}, h=${num(n.h)}, f=${num(n.f)}`;
      case 'wastar': return `g=${num(n.g)}, h=${num(n.h)}, f=${num(n.g)}+${num(T.w)}·${num(n.h)}=${num(n.f)}`;
      case 'dls': case 'ids': return `depth ${n.depth}`;
      default: return unitCosts() ? `depth ${n.depth}` : `g=${num(n.g)}`;
    }
  }
  function childText(n: TNode, s: Step): string {
    switch (n.ghost) {
      case 'cycle': return `${nm(n.state)} (already on the path → dropped)`;
      case 'reached': return `${nm(n.state)} (already reached${T.A.q === 'pq' ? ` with g=${num(n.vs!)} ≤ ${num(n.g)}` : ''} → skipped)`;
      case 'expanded': return `${nm(n.state)} (already expanded → dropped)`;
      case 'bound': return `${nm(n.state)} (f=${num(n.f)} > cutoff ${num(s.bound!)} → pruned)`;
    }
    return `${nm(n.state)} (${vals(n)}${n.better != null ? `; cheaper than the reached g=${num(n.better)} → reached updated, re-added` : ''})`;
  }
  const pathText = (id: number) => { const n = T.nodes[id]; return `${statesOf(T.nodes, n).map(nm).join(' → ')} (cost ${num(n.g)})`; };

  /** One-line narration of step k (plain text). In predict mode the returned path stays hidden until answered. */
  function sayText(k: number): string {
    const s = T.steps[k], n = s.cur != null ? T.nodes[s.cur] : null;
    const stale = s.skipped.length ? `Pop ${s.skipped.map(id => nm(T.nodes[id].state)).join(', ')}: already expanded → discarded. ` : '';
    const kids = (ids: number[]) => ids.map(id => childText(T.nodes[id], s)).join(', ');
    const hide = mode === 'predict' && !P.done;
    switch (s.kind) {
      case 'init': {
        const r = T.nodes[s.frontier[0]];
        return `Start: the frontier holds the root ${nm(r.state)} (${vals(r)}).` +
          (s.limit != null && alg() === 'ids' ? ` Depth limit L = ${s.limit}.` : '') + (s.bound != null ? ` Cutoff = f(${nm(r.state)}) = ${num(s.bound)}.` : '');
      }
      case 'iter': return `${s.intro ?? ''} Frontier = [${nm(T.nodes[s.frontier[0]].state)}].`;
      case 'expand': return `${stale}Pop ${nm(n!.state)} (${vals(n!)}): not a goal → expand: ${kids(s.gen) || 'no successors'}.`;
      case 'limit': return `${stale}Pop ${nm(n!.state)} (depth ${n!.depth}): not a goal, and depth = L = ${s.limit} → not expanded (cutoff).`;
      case 'goal': {
        const ret = hide ? 'the search returns.' : `return ${pathText(s.found!)}.`;
        if (s.found === s.cur && s.gen.length === 0 && T.A.early) return `The initial state ${nm(n!.state)} is already a goal → ${ret}`;
        if (s.found !== s.cur) {
          const before = s.gen.slice(0, -1);
          return `${stale}Pop ${nm(n!.state)} (${vals(n!)}) and expand: ${before.length ? kids(before) + ', then ' : ''}generate ${nm(T.nodes[s.found!].state)}: goal test on generation succeeds → ${ret}`;
        }
        return `${stale}Pop ${nm(n!.state)} (${vals(n!)}): goal test succeeds → ${ret}`;
      }
      case 'end': {
        const st = s.status;
        return `${stale}Frontier empty → ${st === 'cutoff' ? 'cutoff: the depth limit stopped the search (a solution may be deeper).' : st === 'stopped' ? 'stopped after too many steps.' : 'failure: no solution.'}`;
      }
    }
  }

  function rules(): string[] {
    const c = T.c, A = T.A, r: string[] = [];
    const keyExpr = alg() === 'ucs' ? 'g' : alg() === 'greedy' ? 'h' : alg() === 'wastar' ? `f = g + ${num(T.w)}·h` : 'f = g + h';
    r.push(A.q === 'fifo' ? 'Frontier: FIFO queue' : A.q === 'lifo' ? 'Frontier: LIFO stack' : `Frontier: priority queue on ${keyExpr}`);
    if (alg() === 'idastar') r.push('Depth-first on nodes with f ≤ cutoff; cutoff starts at f(root), then the smallest f that exceeded it');
    if (alg() === 'dls') r.push(`Depth limit L = ${c.limit}: nodes at depth L are not expanded`);
    if (alg() === 'ids') r.push(`L = ${c.idsStart}, ${c.idsStart + 1}, ${c.idsStart + 2}, …`);
    r.push(A.early ? 'Goal test when generated' : 'Goal test when selected');
    r.push(c.graphSearch === true ? (A.q === 'pq' ? 'Graph search: reached table (re-add if cheaper)' : 'Graph search: reached set')
      : c.graphSearch === 'expanded' ? 'Graph search: expanded list' : 'Tree search: drop a child already on its path');
    r.push('Children generated alphabetically');
    if (A.q === 'lifo') r.push(c.childOrder === 'alpha' ? 'First child expanded first (pushed in reverse)' : 'Last child expanded first (aima push order)');
    if (A.q === 'pq') r.push(`Ties: ${c.ties === 'fifo' ? 'FIFO (insertion order)' : c.ties === 'alpha' ? 'alphabetical' : 'LIFO (newest first)'}`);
    return r;
  }

  // ---------------------------------------------------------------- header + controls
  function renderHead() {
    $('.sv-title').textContent = T.A.name + (alg() === 'wastar' ? ` (w = ${num(T.w)})` : '');
    $('.sv-rules').innerHTML = rules().map(r => `<span class="sv-rule">${esc(r)}</span>`).join('');
  }

  function syncControls() {
    if (mode !== 'explore') return;
    const a = alg(), q = T.A.q;
    const set = (k: string, v: string) => { const e = $<HTMLInputElement>(`[data-k="${k}"]`); if (e.type === 'checkbox') e.checked = v === 'true'; else e.value = v; };
    set('algorithm', a === 'bfs_early' ? 'bfs' : a);
    set('graphSearch', String(T.c.graphSearch));
    set('early', String(a === 'bfs_early'));
    set('limit', String(T.c.limit));
    set('weight', String(T.c.weight));
    set('childOrder', T.c.childOrder);
    set('ties', T.c.ties);
    const show: Record<string, boolean> = { gs: !TREE_ONLY.includes(a), early: a === 'bfs' || a === 'bfs_early', limit: a === 'dls',
      weight: a === 'wastar', order: q === 'lifo', ties: q === 'pq' };
    root.querySelectorAll<HTMLElement>('[data-show]').forEach(e => { e.hidden = !show[e.dataset.show!]; });
  }

  function onControl(t: HTMLInputElement | HTMLSelectElement) {
    const k = t.dataset.k, v = t.value;
    if (k === 'algorithm') { cfg.algorithm = v as Algorithm; delete cfg.graphSearch; }
    else if (k === 'graphSearch') cfg.graphSearch = v === 'expanded' ? 'expanded' : v === 'true';
    else if (k === 'early') cfg.algorithm = (t as HTMLInputElement).checked ? 'bfs_early' : 'bfs';
    else if (k === 'limit') cfg.limit = Math.max(0, Math.min(30, Math.round(+v || 0)));
    else if (k === 'weight') cfg.weight = Math.max(1, Math.min(10, +v || 1));
    else if (k === 'childOrder') cfg.childOrder = v as 'alpha' | 'code';
    else if (k === 'ties') cfg.ties = v as 'fifo' | 'alpha' | 'lifo';
    else return;
    rebuild();
  }

  // ---------------------------------------------------------------- state-space graph
  const edgeKey = (a: string, b: string) => (T.c.graph.directed ? `${a}>${b}` : a < b ? `${a}|${b}` : `${b}|${a}`);

  function drawGraph() {
    root.classList.toggle('sv-gridmode', !!T.c.grid);
    const wrap = $('.sv-gwrap'), svg = $<SVGSVGElement>('.sv-gsvg');
    const W = Math.max(300, Math.round(wrap.clientWidth - 12 || 480));
    const eG = svg.querySelector('.sv-ge')!, nG = svg.querySelector('.sv-gn')!;
    eG.replaceChildren(); nG.replaceChildren();
    const g = T.c.graph, informed = INFORMED.includes(alg());
    if (T.c.grid) return drawGrid(svg, nG, W);
    const ids = Object.keys(g.nodes), R = 15;
    const xs = ids.map(k => g.nodes[k].x), ys = ids.map(k => g.nodes[k].y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const dx = Math.max(maxX - minX, 1), dy = Math.max(maxY - minY, 1), padX = 34, padY = informed ? 36 : 30;
    const maxH = Math.max(260, Math.min(540, W * 0.95));
    let s = (W - 2 * padX) / dx;
    if (dy * s + 2 * padY > maxH) s = (maxH - 2 * padY) / dy;
    const Hh = Math.round(dy * s + 2 * padY);
    const ox = (W - dx * s) / 2 - minX * s, oy = padY - minY * s;
    gPos = {};
    for (const k of ids) gPos[k] = [g.nodes[k].x * s + ox, g.nodes[k].y * s + oy];
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(Hh));
    const showCost = !unitCosts();
    // obstacles for label placement: node discs and edge-cost labels
    const boxes: Box[] = ids.map(k => ({ x: gPos[k][0] - R - 3, y: gPos[k][1] - R - 3, w: 2 * R + 6, h: 2 * R + 6 }));
    for (const [a, b, cost = 1] of g.edges) {
      const [x1, y1] = gPos[a], [x2, y2] = gPos[b], L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const end = g.directed ? R + 3 : R;
      const line = svgEl('line', { class: 'sv-e', 'data-e': edgeKey(a, b), x1: x1 + ux * R, y1: y1 + uy * R, x2: x2 - ux * end, y2: y2 - uy * end });
      if (g.directed) line.setAttribute('marker-end', `url(#${uid}-a)`);
      eG.append(line);
      if (!showCost) continue;
      // slide the cost label along its edge until it overlaps no node and no other label
      const cw = num(cost).length * 7 + 6, at = (t: number): Box => ({ x: x1 + (x2 - x1) * t - cw / 2, y: y1 + (y2 - y1) * t - 8, w: cw, h: 16 });
      const free = (b: Box) => !boxes.some(o => b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h);
      const box = [0.5, 0.4, 0.6, 0.32, 0.68].map(at).find(free) ?? at(0.5);
      eG.append(svgEl('text', { class: 'sv-ec', x: box.x + cw / 2, y: box.y + 8 }, esc(num(cost))));
      boxes.push(box);
    }
    // h label in the free direction: away from incident edges (and the start arrow), no overlaps, inside the canvas
    const around = new Map<string, number[]>(ids.map(k => [k, k === T.c.start ? [Math.atan2(-1, -1.6)] : []]));
    for (const [a, b] of g.edges) {
      const [x1, y1] = gPos[a], [x2, y2] = gPos[b];
      around.get(a)!.push(Math.atan2(y2 - y1, x2 - x1));
      around.get(b)!.push(Math.atan2(y1 - y2, x1 - x2));
    }
    for (const k of ids) {
      const n = g.nodes[k], [x, y] = gPos[k], hText = `h=${num(n.h ?? 0)}`;
      let label = '';
      if (informed) {
        const p = placeLabel(around.get(k)!, R, x, y, hText.length * 7, boxes, W, Hh);
        label = `<text class="sv-h" x="${p.x}" y="${p.y}" text-anchor="${p.anchor}">${esc(hText)}</text>`;
      }
      const tip = `${k}${n.name ? ` · ${n.name}` : ''}${informed ? ` · ${hText}` : ''}`;
      nG.append(svgEl('g', { class: 'sv-n', 'data-s': k, transform: `translate(${x},${y})` },
        `<g class="sv-in"><circle class="sv-halo" r="${R + 7}"/>${T.c.goals.has(k) ? `<circle class="sv-ring" r="${R + 4}"/>` : ''}` +
        `<circle class="sv-c" r="${R}"/><text class="sv-t">${esc(k)}</text></g>${label}` +
        (k === T.c.start ? `<path class="sv-start" d="M${-R - 17},${-R - 9} L${-R - 2},${-4}" marker-end="url(#${uid}-s)"/>` : '') +
        `<title>${esc(tip)}</title>`));
    }
    const named = ids.filter(k => g.nodes[k].name).sort();
    $('.sv-key').innerHTML = named.map(k => `<span><b>${esc(k)}</b> ${esc(g.nodes[k].name!)}</span>`).join('');
    $('.sv-key').hidden = !named.length;
  }

  function drawGrid(svg: SVGSVGElement, nG: Element, W: number) {
    const rows = T.c.grid!, R = rows.length, C = Math.max(...rows.map(r => r.length));
    const cs = Math.max(26, Math.min(48, Math.floor((W - 8) / C)));
    gCell = cs;
    const Hh = R * cs + 8, ox = (W - C * cs) / 2;
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(Hh));
    gPos = {};
    rows.forEach((row, r) => [...row.padEnd(C, '#')].forEach((ch, c) => {
      const x = ox + c * cs + cs / 2, y = 4 + r * cs + cs / 2, id = `${r},${c}`, half = cs / 2 - 1;
      if (ch === '#') { nG.append(svgEl('rect', { class: 'sv-wall', x: x - half, y: y - half, width: 2 * half, height: 2 * half, rx: 3, fill: `url(#${uid}-hatch)` })); return; }
      gPos[id] = [x, y];
      const tag = ch === 'S' || ch === 'G' ? `<text class="sv-ctag" x="${-half + 4}" y="${-half + 4}">${ch}</text>` : '';
      nG.append(svgEl('g', { class: 'sv-n sv-cell', 'data-s': id, transform: `translate(${x},${y})` },
        `<g class="sv-in"><rect class="sv-c" x="${-half}" y="${-half}" width="${2 * half}" height="${2 * half}" rx="4"/>` +
        `<text class="sv-t sv-cv"></text></g>${tag}<title>(${id}) · h=${num(T.c.graph.nodes[id].h ?? 0)}</title>`));
    }));
  }

  function paintGraph(s: Step) {
    const vis = visible(s), cur = s.cur != null ? T.nodes[s.cur] : null;
    const front = new Set(s.inserted.map(id => T.nodes[id].state));
    const exp = new Set(vis.filter(n => n.exp != null && n.exp <= i).map(n => n.state));
    const sol = showSolution() && s.found != null ? statesOf(T.nodes, T.nodes[s.found]) : [];
    const curPath = cur ? statesOf(T.nodes, cur) : [];
    const solSet = new Set(sol);
    const bestG = new Map<string, number>();
    if (T.c.grid) for (const n of vis) if (!n.ghost && (bestG.get(n.state) ?? Infinity) > n.g) bestG.set(n.state, n.g);
    root.querySelectorAll<SVGGElement>('.sv-gn .sv-n').forEach(e => {
      const k = e.dataset.s!;
      const role = solSet.has(k) ? 'path' : cur?.state === k ? 'cur' : front.has(k) ? 'front' : exp.has(k) ? 'exp' : '';
      e.setAttribute('class', `sv-n${T.c.grid ? ' sv-cell' : ''}${role ? ' ' + role : ''}${mode === 'predict' && !P.done ? ' sv-pick' : ''}`);
      if (T.c.grid) {
        const h = T.c.graph.nodes[k].h ?? 0, g = bestG.get(k), t = e.querySelector('.sv-cv')!;
        const informed = INFORMED.includes(alg());
        t.textContent = g == null ? (informed ? num(h) : '') : alg() === 'greedy' ? num(h) : informed ? `${num(g)}+${num(h)}` : num(g);
        t.classList.toggle('dim', g == null);
        t.setAttribute('font-size', String(gCell < 38 ? 11.5 : 12));
      }
    });
    const onPath = (p: string[]) => { const set = new Set<string>(); for (let k = 1; k < p.length; k++) set.add(edgeKey(p[k - 1], p[k])); return set; };
    const pe = onPath(sol), ce = onPath(curPath);
    root.querySelectorAll<SVGLineElement>('.sv-ge .sv-e').forEach(e => {
      const k = e.dataset.e!, role = pe.has(k) ? 'path' : ce.has(k) ? 'cur' : '';
      e.setAttribute('class', `sv-e${role ? ' ' + role : ''}`);
      if (T.c.graph.directed) e.setAttribute('marker-end', `url(#${uid}-a${role ? '-' + role : ''})`);
    });
    $('.sv-gmeta').textContent = T.c.grid ? `${T.c.grid.length}×${Math.max(...T.c.grid.map(r => r.length))} grid · h = Manhattan`
      : `${Object.keys(T.c.graph.nodes).length} states · ${T.c.graph.directed ? 'directed' : 'undirected'}`;
  }

  // ---------------------------------------------------------------- search tree
  function treeLabels(n: TNode, s: Step): string[] {
    switch (n.ghost) {
      case 'cycle': return ['cycle'];
      case 'reached': return T.A.q === 'pq' ? [`g=${num(n.g)}`, 'reached'] : ['reached'];
      case 'expanded': return ['expanded'];
      case 'bound': return [`f=${num(n.f)}`, `> ${num(s.bound!)}`];
    }
    switch (alg()) {
      case 'ucs': return [`g=${num(n.g)}`];
      case 'greedy': return [`h=${num(n.h)}`];
      case 'astar': case 'idastar': return [`f=${num(n.f)}`, `${num(n.g)}+${num(n.h)}`];
      case 'wastar': return [`f=${num(n.f)}`, `${num(n.g)}+${num(T.w)}·${num(n.h)}`];
      case 'dls': case 'ids': return [];
      default: return unitCosts() ? [] : [`g=${num(n.g)}`];
    }
  }

  function drawTree(s: Step, animate = true) {
    if (T.c.grid) return; // a grid search tree has dozens of nodes: the coloured grid tells the story
    const svg = $<SVGSVGElement>('.sv-tsvg'), eG = svg.querySelector('.sv-te')!, nG = svg.querySelector('.sv-tn-g')!;
    if (s.iter !== tIter) { eG.replaceChildren(); nG.replaceChildren(); tEls.clear(); tPos.clear(); tIter = s.iter; }
    const vis = visible(s), two = ['astar', 'idastar', 'wastar'].includes(alg()) || T.c.graphSearch === true && T.A.q === 'pq';
    const longest = Math.max(3, ...T.nodes.map(n => Math.max(nm(n.state).length * 1.4, ...treeLabels(n, s).map(l => l.length))));
    const SW = Math.max(44, Math.round(longest * 6.9 + 12)), LG = two ? 78 : 66, top = 30, R = 14;
    // tidy layout: leaves left to right, parents centred over their children
    const kids = new Map<number, TNode[]>();
    for (const n of vis) if (n.parent != null) { const l = kids.get(n.parent); if (l) l.push(n); else kids.set(n.parent, [n]); }
    const tgt = new Map<number, { x: number; y: number }>();
    let x = 0, maxD = 0;
    const walk = (n: TNode) => {
      const ks = kids.get(n.id) ?? [];
      maxD = Math.max(maxD, n.depth);
      if (!ks.length) { tgt.set(n.id, { x: x + SW / 2, y: n.depth }); x += SW; return; }
      ks.forEach(walk);
      tgt.set(n.id, { x: (tgt.get(ks[0].id)!.x + tgt.get(ks[ks.length - 1].id)!.x) / 2, y: n.depth });
    };
    if (vis.length) walk(vis[0]);
    const box = $('.sv-tscroll'), cw = Math.max(280, box.clientWidth - 2), tw = x + 24, W = Math.max(cw, tw), off = (W - tw) / 2 + 12;
    const Hh = top + maxD * LG + (two ? 56 : 44);
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(Hh));
    for (const p of tgt.values()) { p.x += off; p.y = top + p.y * LG; }

    const ids = new Set(vis.map(n => n.id));
    for (const [id, e] of tEls) if (!ids.has(id)) { e.g.remove(); e.line?.remove(); tEls.delete(id); tPos.delete(id); }
    const sol = new Set(showSolution() && s.found != null ? pathIds(s.found) : []);
    const curAnc = new Set(pathIds(s.cur));
    const inF = new Set(s.inserted);
    for (const n of vis) {
      let e = tEls.get(n.id);
      if (!e) {
        const g = svgEl('g', { class: 'sv-tn sv-new', 'data-id': n.id });
        const lines = treeLabels(n, s);
        g.innerHTML = `<g class="sv-in"><circle class="sv-halo" r="${R + 6}"/><circle class="sv-c" r="${R}"/>` +
          `<text class="sv-t">${esc(nm(n.state))}</text></g>` +
          lines.map((l, k) => `<text class="sv-tl${k ? ' sv-tl2' : ''}" y="${R + 15 + k * 14}">${esc(l)}</text>`).join('') +
          `<text class="sv-ord" x="${-R - 3}" y="${-R - 3}"></text>` +
          `<title>${esc(`${nm(n.state)} · g=${num(n.g)}${INFORMED.includes(alg()) ? ` · h=${num(n.h)} · f=${num(n.f)}` : ''} · depth ${n.depth}\npath: ${statesOf(T.nodes, n).map(nm).join(' → ')}`)}</title>`;
        nG.append(g);
        const line = n.parent != null ? svgEl('line', { class: 'sv-tedge' }) : null;
        if (line) eG.append(line);
        e = { g, line };
        tEls.set(n.id, e);
      }
      const role = n.ghost ? 'ghost' : n.stale != null && n.stale <= i ? 'stale' : sol.has(n.id) ? 'path' : n.id === s.cur ? 'cur'
        : n.exp != null && n.exp <= i ? (n.cut ? 'cut' : 'exp') : inF.has(n.id) ? 'front' : '';
      e.g.setAttribute('class', `sv-tn${role ? ' ' + role : ''}${e.g.classList.contains('sv-new') ? ' sv-new' : ''}${mode === 'predict' && !P.done ? ' sv-pick' : ''}`);
      e.g.querySelector('.sv-ord')!.textContent = n.order != null && n.exp! <= i && !n.stale ? String(n.order) : '';
      e.line?.setAttribute('class', `sv-tedge${n.ghost ? ' ghost' : ''}${sol.has(n.id) ? ' path' : curAnc.has(n.id) ? ' cur' : ''}`);
    }
    requestAnimationFrame(() => root.querySelectorAll('.sv-tn.sv-new').forEach(g => g.classList.remove('sv-new')));
    tween(tgt, animate && !reduced);
    const nn = vis.filter(n => !n.ghost).length;
    $('.sv-tmeta').textContent = alg() === 'ids' || alg() === 'dls' ? `limit L = ${s.limit}` : alg() === 'idastar'
      ? `cutoff ${num(s.bound!)}${s.nextBound != null && mode === 'explore' ? ` · next ${num(s.nextBound)}` : ''}` : `${nn} node${nn === 1 ? '' : 's'}`;
    // keep the current node in view
    const c = s.cur != null ? tgt.get(s.cur) : null;
    if (c && (c.x < box.scrollLeft + 30 || c.x > box.scrollLeft + box.clientWidth - 30))
      box.scrollTo({ left: c.x - box.clientWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  }

  function tween(tgt: Map<number, { x: number; y: number }>, animate: boolean) {
    cancelAnimationFrame(raf);
    const from = new Map<number, { x: number; y: number }>();
    for (const [id, p] of tgt) {
      const par = T.nodes[id].parent;
      from.set(id, tPos.get(id) ?? (par != null ? tPos.get(par) : undefined) ?? p);
    }
    const t0 = performance.now(), D = animate ? 320 : 0;
    const frame = (now: number) => {
      const k = D ? Math.min(1, (now - t0) / D) : 1, e = 1 - (1 - k) ** 3;
      for (const [id, p] of tgt) {
        const a = from.get(id)!, q = { x: a.x + (p.x - a.x) * e, y: a.y + (p.y - a.y) * e };
        tPos.set(id, q);
        tEls.get(id)!.g.setAttribute('transform', `translate(${q.x.toFixed(1)},${q.y.toFixed(1)})`);
      }
      for (const [id, el] of tEls) {
        const par = T.nodes[id].parent, a = par != null ? tPos.get(par) : undefined, b = tPos.get(id);
        if (!el.line || !a || !b) continue;
        const L = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
        el.line.setAttribute('x1', (a.x + ux * 14).toFixed(1)); el.line.setAttribute('y1', (a.y + uy * 14).toFixed(1));
        el.line.setAttribute('x2', (b.x - ux * 14).toFixed(1)); el.line.setAttribute('y2', (b.y - uy * 14).toFixed(1));
      }
      if (k < 1) raf = requestAnimationFrame(frame);
    };
    frame(t0);
  }

  // ---------------------------------------------------------------- frontier + reached
  function renderFrontier(s: Step) {
    const pq = T.A.q === 'pq', predict = mode === 'predict';
    const ids = predict ? s.inserted : s.frontier;
    const closed = new Set(s.closed ?? []);
    const pick = predict && !P.done ? ' sv-pick' : '';
    $('.sv-fmeta').textContent = predict ? 'insertion order (oldest first)'
      : T.A.q === 'fifo' ? 'FIFO queue · next on the left' : T.A.q === 'lifo' ? 'LIFO stack · top on the left' : `priority queue · lowest ${keyName()} first`;
    const body = $('.sv-fbody');
    if (!ids.length) { body.innerHTML = '<div class="sv-empty">empty</div>'; return; }
    const via = (n: TNode) => (n.parent == null ? '—' : nm(T.nodes[n.parent].state));
    const staleTag = (n: TNode) => (closed.has(n.state) ? '<span class="sv-tag">expanded</span>' : '');
    if (pq) {
      const cols: Array<['g' | 'h' | 'f', string]> = alg() === 'ucs' ? [['g', 'g']] : alg() === 'greedy' ? [['g', 'g'], ['h', 'h']] : [['g', 'g'], ['h', 'h'], ['f', 'f']];
      const kn = keyName();
      const rows = ids.map((id, k) => {
        const n = T.nodes[id];
        return `<tr class="sv-row${!predict && k === 0 ? ' next' : ''}${closed.has(n.state) ? ' stale' : ''}${pick}" data-id="${id}">` +
          `<td class="sv-st">${esc(nm(n.state))}${staleTag(n)}</td><td class="sv-via">${esc(via(n))}</td>` +
          cols.map(([c]) => `<td class="${c === kn ? 'key' : ''}">${num(n[c])}</td>`).join('') + '</tr>';
      }).join('');
      let tie = '';
      if (!predict) {
        const live = ids.map(id => T.nodes[id]).filter(n => !closed.has(n.state));
        const same = live.filter(n => n.f === live[0]?.f);
        if (same.length > 1) tie = `<div class="sv-note">Tie on ${kn} = ${num(same[0].f)} (${same.map(n => nm(n.state)).join(', ')}): broken by ${T.c.ties === 'fifo' ? 'insertion order (FIFO)' : T.c.ties === 'alpha' ? 'alphabetical order' : 'newest first (LIFO)'}.</div>`;
      }
      body.innerHTML = `<table class="sv-tbl"><thead><tr><th>node</th><th>via</th>${cols.map(([, l]) => `<th class="${l === kn ? 'key' : ''}">${l}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>${tie}`;
      return;
    }
    const sub = (n: TNode) => (alg() === 'idastar' ? `f=${num(n.f)}` : alg() === 'dls' || alg() === 'ids' || unitCosts() ? `d=${n.depth}` : `g=${num(n.g)}`);
    const label = predict ? '' : `<span class="sv-qend">${T.A.q === 'fifo' ? 'front' : 'top'}</span>`;
    body.innerHTML = `<div class="sv-queue">${label}${ids.map((id, k) => {
      const n = T.nodes[id];
      return `<button type="button" class="sv-it${!predict && k === 0 ? ' next' : ''}${closed.has(n.state) ? ' stale' : ''}${pick}" data-id="${id}" tabindex="${pick ? 0 : -1}">` +
        `<b>${esc(nm(n.state))}</b><span>${esc(sub(n))}</span><span class="sv-via">via ${esc(via(n))}</span></button>`;
    }).join('')}</div>`;
  }

  function renderReached(s: Step) {
    const gs = T.c.graphSearch, prev = i > 0 ? T.steps[i - 1].nNodes : 0;
    $('.sv-rtitle').textContent = gs === true ? (T.A.q === 'pq' ? 'Reached table' : 'Reached set') : gs === 'expanded' ? 'Expanded list' : 'Repeated states';
    let html = '';
    if (gs === true && s.reached) {
      $('.sv-rmeta').textContent = `${s.reached.length} state${s.reached.length === 1 ? '' : 's'}`;
      html += `<div class="sv-rgrid">${s.reached.map(id => {
        const n = T.nodes[id];
        return `<span class="sv-rc${n.id >= prev && i > 0 ? (n.better != null ? ' upd' : ' new') : ''}" title="${esc(nm(n.state))}: g=${num(n.g)} via ${n.parent == null ? '—' : esc(nm(T.nodes[n.parent].state))}"><b>${esc(nm(n.state))}</b>${num(n.g)}</span>`;
      }).join('')}</div><div class="sv-note">state → best g so far${T.A.q === 'pq' ? '; a child is added if its state is new or its g is lower' : '; a child is added only if its state is new'}</div>`;
    } else if (gs === 'expanded') {
      $('.sv-rmeta').textContent = `${s.closed?.length ?? 0} state${s.closed?.length === 1 ? '' : 's'}`;
      html += s.closed?.length ? `<div class="sv-rgrid">${s.closed.map(st => `<span class="sv-rc"><b>${esc(nm(st))}</b></span>`).join('')}</div>` : '<div class="sv-empty">empty</div>';
      html += '<div class="sv-note">a popped node whose state is already here is discarded; children already here are dropped</div>';
    } else {
      $('.sv-rmeta').textContent = 'tree search';
      html += '<div class="sv-note">No reached table: a state can appear in many tree nodes. A child is dropped only if its state is already on its own path (is_cycle).</div>';
    }
    // selection order, per iteration
    const its = new Map<number, TNode[]>();
    for (const n of T.nodes) if (n.exp != null && n.exp <= i && n.stale == null && !n.ghost) { const l = its.get(n.iter); if (l) l.push(n); else its.set(n.iter, [n]); }
    const iterLabel = (k: number) => { const st = T.steps.find(x => x.iter === k)!; return alg() === 'ids' ? `L=${st.limit}` : alg() === 'idastar' ? `≤${num(st.bound!)}` : ''; };
    html += `<div class="sv-order"><div class="sv-olabel">Expansion order${alg() === 'ids' ? ' (greyed: at the limit, not expanded)' : ''}</div>`;
    if (!its.size) html += '<div class="sv-oline"><span class="sv-empty">—</span></div>';
    for (const [k, l] of its) html += `<div class="sv-oline">${iterLabel(k) ? `<span class="sv-tag">${iterLabel(k)}</span>` : ''}${l.sort((a, b) => a.exp! - b.exp!).map(n => `<span class="${n.cut ? 'cut' : ''}">${esc(nm(n.state))}</span>`).join('<i>›</i>')}</div>`;
    html += '</div>';
    if (isLast() && showSolution()) {
      const r = T.result, nexp = T.steps.filter(x => x.kind === 'expand' || (x.kind === 'goal' && x.gen.length)).length;
      if (r.status === 'found') {
        const opt = T.optimal, isOpt = !opt || r.cost! <= opt.cost + 1e-9;
        html += `<div class="sv-result ${isOpt ? 'ok' : 'warn'}"><div>Returned <b>${esc(r.path!.map(nm).join(' → '))}</b> · cost ${num(r.cost!)} · ${nexp} expansion${nexp === 1 ? '' : 's'}</div>` +
          `<div class="sv-rsub">${isOpt ? 'Optimal: no cheaper path exists.' : `Not optimal: ${esc(opt!.path.map(nm).join(' → '))} costs ${num(opt!.cost)}.`}</div></div>`;
      } else html += `<div class="sv-result bad"><div>${r.status === 'cutoff' ? 'Result: cutoff (no solution within the depth limit)' : r.status === 'stopped' ? 'Stopped (step limit)' : 'Result: failure (no solution)'}</div></div>`;
    }
    $('.sv-rbody').innerHTML = html;
  }

  // ---------------------------------------------------------------- transport / predict bar
  function renderTransport() {
    const last = T.steps.length - 1;
    $('.sv-count').textContent = `Step ${i} / ${last}`;
    const sc = $<HTMLInputElement>('.sv-scrub');
    sc.max = String(last); sc.value = String(i);
    $<HTMLButtonElement>('[data-a="back"]').disabled = i === 0;
    $<HTMLButtonElement>('[data-a="first"]').disabled = i === 0;
    $<HTMLButtonElement>('[data-a="step"]').disabled = i === last;
    $('.sv-play').innerHTML = timer ? `${ICON.pause}<span>Pause</span>` : `${ICON.play}<span>Play</span>`;
  }

  function finalOptions(): Opt[] {
    const r = T.result, out: Opt[] = [];
    const fmt = (p: string[], cost: number) => `${p.map(nm).join(' → ')}   ·   cost ${num(cost)}`;
    const add = (label: string, ok: boolean) => { if (!out.some(o => o.label === label)) out.push({ label, ok }); };
    const fail = 'failure (no solution)', cut = 'cutoff (no solution within the limit)';
    if (r.status === 'found') add(fmt(r.path!, r.cost!), true); else add(r.status === 'cutoff' ? cut : fail, true);
    if (T.optimal) add(fmt(T.optimal.path, T.optimal.cost), false);
    for (const n of T.nodes) if (T.c.goals.has(n.state)) add(fmt(statesOf(T.nodes, n), n.g), false);
    if (T.fewest) add(fmt(T.fewest, pathCost(T.fewest)), false);
    if (r.status === 'found' && T.A.q !== 'pq' && r.path!.length - 1 !== r.cost) add(fmt(r.path!, r.path!.length - 1), false); // cost = #steps confusion
    if (r.status === 'found') add(fail, false); else add(r.status === 'cutoff' ? fail : cut, false);
    const pickd = [out[0], ...out.slice(1, 4)];
    const h = (t: string) => [...t].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
    return pickd.sort((a, b) => h(a.label) - h(b.label));
  }

  function cutoffOptions(s: Step): Opt[] {
    const prevIter = s.iter - 1, nb = s.bound!;
    const fs = [...new Set(T.nodes.filter(n => n.iter === prevIter && n.ghost === 'bound').map(n => n.f))].sort((a, b) => a - b).slice(0, 4);
    const prevBound = T.steps.find(x => x.iter === prevIter)!.bound!;
    fs.push(prevBound); // "nothing changes" distractor
    if (fs.length < 3) fs.push(prevBound + 1);
    return [...new Set(fs)].sort((a, b) => a - b).map(f => ({ label: `cutoff = ${num(f)}`, ok: f === nb }));
  }

  /** What the learner must do before step i+1 is revealed. */
  function question(): { kind: 'pick' | 'choice' | 'continue' | 'done'; title: string; sub?: string } {
    if (P.done) return { kind: 'done', title: `Finished: ${P.correct} of ${P.total} right on the first try.` };
    const nx = T.steps[i + 1];
    if (!nx) {
      if (P.optsFor !== i) { P.opts = finalOptions(); P.optsFor = i; }
      return { kind: 'choice', title: `What does ${T.A.short} return?`, sub: 'Follow the parent links of the goal node and add up the step costs.' };
    }
    if (nx.cur != null) return { kind: 'pick', title: 'Which node is selected next?', sub: T.c.grid ? 'Click it in the grid or the frontier.' : 'Click it in the graph, the search tree or the frontier.' };
    if (nx.kind === 'iter' && alg() === 'idastar') {
      if (P.optsFor !== i) { P.opts = cutoffOptions(nx); P.optsFor = i; }
      return { kind: 'choice', title: `No goal with f ≤ ${num(T.steps[i].bound!)}. What is the new cutoff?`, sub: 'Look at the f values of the pruned (dashed) nodes.' };
    }
    if (nx.kind === 'iter') return { kind: 'continue', title: `Depth limit L = ${T.steps[i].limit} exhausted with some nodes cut off.`, sub: 'IDS restarts from the root with a larger limit; the tree is rebuilt from scratch.' };
    return { kind: 'continue', title: 'The frontier is empty: no node left to select.' };
  }

  function renderPredict() {
    const q = question(), bar = $('.sv-pbar');
    let act = '';
    if (q.kind === 'pick') act = '<button class="btn sm" data-a="reveal">Reveal</button>';
    else if (q.kind === 'continue') act = '<button class="btn sm primary" data-a="continue">Continue</button>';
    else if (q.kind === 'done') act = '<button class="btn sm" data-a="restart">Try again</button>';
    const choices = q.kind === 'choice' ? `<div class="sv-opts">${P.opts.map((o, k) => `<button class="btn sv-opt" data-opt="${k}">${esc(o.label)}</button>`).join('')}</div>` : '';
    bar.innerHTML = `<div class="sv-pq"><div class="sv-ptext"><div class="sv-ptitle">${esc(q.title)}</div>${q.sub ? `<div class="sv-psub">${esc(q.sub)}</div>` : ''}</div>` +
      `<div class="sv-pact">${act}<span class="sv-score" title="first-try correct / asked">${P.correct}<i>/</i>${P.total}</span></div></div>${choices}` +
      (P.fb ? `<div class="sv-fb ${P.fbOk ? 'ok' : 'bad'}">${esc(P.fb)}</div>` : '');
  }

  // ---------------------------------------------------------------- predict logic
  function inFrontierWhy(n: TNode | null, state: string, s: Step): string {
    const vis = visible(s), same = vis.filter(x => x.state === state);
    const target = n ?? same.find(x => x.exp != null && x.exp <= i) ?? same.find(x => x.ghost) ?? null;
    if (!target) return `${nm(state)} has not been generated yet: only nodes in the frontier can be selected.`;
    if (target.ghost) return `This ${nm(state)} was dropped when generated (${target.ghost === 'cycle' ? 'already on its path' : target.ghost === 'bound' ? 'f above the cutoff' : `already ${target.ghost}`}): it never entered the frontier.`;
    if (target.stale != null) return `This ${nm(state)} was popped and discarded (already expanded).`;
    if (target.exp != null && target.exp <= i) return `${nm(state)} ${n ? 'is a node that was' : 'was'} already ${target.cut ? 'selected (at the depth limit)' : 'expanded'}: it is no longer in the frontier.`;
    return `${nm(state)} is not in the frontier.`;
  }

  function compareWhy(cn: TNode, p: TNode, s: Step): string {
    const A = T.A, a = nm(cn.state), b = nm(p.state);
    if ((s.closed ?? []).includes(p.state)) return `${b} was already expanded: when popped it is discarded (expanded list).`;
    if (A.q === 'fifo') return `FIFO queue: ${a} entered the frontier before ${b}, so it comes out first.`;
    if (A.q === 'lifo') {
      const sib = cn.parent === p.parent && T.c.childOrder === 'alpha' ? ' (siblings are pushed in reverse alphabetical order, so the first child ends on top)' : '';
      return `LIFO stack: ${a} was pushed after ${b}, so it is on top${sib}.`;
    }
    const k = keyName();
    if (cn.f < p.f) return `${A.short} selects the lowest ${k}: ${a} has ${k}=${num(cn.f)} < ${b}'s ${k}=${num(p.f)}.`;
    const why = T.c.ties === 'fifo' ? `insertion order, and ${a} was inserted earlier (FIFO)`
      : T.c.ties === 'lifo' ? `insertion order, and ${a} was inserted later (LIFO)` : `name, and ${a} comes first alphabetically`;
    return `${a} and ${b} tie on ${k}=${num(cn.f)}; the tie is broken by ${why}.`;
  }

  function rightWhy(cn: TNode, s: Step): string {
    if (T.A.q === 'fifo') return 'the oldest node in the FIFO queue';
    if (T.A.q === 'lifo') return alg() === 'idastar' ? 'the top of the stack (depth-first within the cutoff)' : 'the top of the stack';
    const closed = new Set(s.closed ?? []), k = keyName();
    const tie = s.frontier.map(id => T.nodes[id]).filter(n => !closed.has(n.state) && n.f === cn.f).length > 1;
    return `the lowest ${k} (${num(cn.f)})${tie ? `, tie broken by ${T.c.ties === 'fifo' ? 'insertion order' : T.c.ties === 'alpha' ? 'name' : 'newest first'}` : ''}`;
  }

  function onPick(target: { id?: number; state?: string }, el0: Element) {
    if (mode !== 'predict' || P.done) return;
    const q = question();
    if (q.kind !== 'pick') return;
    const s = T.steps[i], cn = T.nodes[T.steps[i + 1].cur!];
    const ok = target.id != null ? target.id === cn.id : target.state === cn.state;
    if (ok) {
      P.total++; if (P.first) P.correct++;
      P.fb = `✓ ${nm(cn.state)}: ${rightWhy(cn, s)}.`; P.fbOk = true; P.first = true;
      opts.onEvent?.(`Learner predicted correctly: ${nm(cn.state)} is selected next.`);
      go(i + 1);
      return;
    }
    let p: TNode | null = null;
    if (target.id != null) p = s.inserted.includes(target.id) ? T.nodes[target.id] : null;
    else p = s.frontier.map(id => T.nodes[id]).find(n => n.state === target.state) ?? null;
    const st = target.id != null ? T.nodes[target.id].state : target.state!;
    const why = p ? compareWhy(cn, p, s) : inFrontierWhy(target.id != null ? T.nodes[target.id] : null, st, s);
    P.first = false; P.fb = `${nm(st)} is not next. ${why}`; P.fbOk = false;
    opts.onEvent?.(`Learner predicted ${nm(st)}, but ${nm(cn.state)} is selected next: ${why}`);
    renderPredict();
    shake(el0);
  }

  function onChoice(k: number, el0: Element) {
    const q = question();
    if (q.kind !== 'choice') return;
    const o = P.opts[k];
    if (!o) return;
    if (!o.ok) {
      P.first = false; P.fb = `Not quite: “${o.label}” is not what the search returns.`; P.fbOk = false;
      opts.onEvent?.(`Learner answered “${o.label}” (wrong) to: ${q.title}`);
      renderPredict(); shake(el0);
      return;
    }
    P.total++; if (P.first) P.correct++;
    P.first = true; P.fbOk = true;
    if (T.steps[i + 1]) { P.fb = `✓ ${o.label}: the smallest f among the pruned nodes.`; go(i + 1); return; }
    P.done = true; P.fb = `✓ ${o.label}.`;
    opts.onEvent?.(`Learner answered correctly: the search returns ${o.label}. Score ${P.correct}/${P.total}.`);
    opts.onDone?.({ correct: P.correct, total: P.total });
    render(true);
  }

  function reveal() {
    const q = question();
    if (q.kind !== 'pick') return;
    const s = T.steps[i], cn = T.nodes[T.steps[i + 1].cur!];
    P.total++; P.first = true; P.fbOk = false;
    P.fb = `It was ${nm(cn.state)}: ${rightWhy(cn, s)}.`;
    opts.onEvent?.(`Learner revealed the answer: ${nm(cn.state)} is selected next.`);
    go(i + 1);
  }

  function shake(e: Element) {
    const t = e.querySelector('.sv-in') ?? e;
    t.classList.remove('sv-shake');
    void (t as HTMLElement).getBoundingClientRect();
    t.classList.add('sv-shake');
  }

  // ---------------------------------------------------------------- main render
  function render(full = false) {
    const s = T.steps[i];
    if (full) { renderHead(); syncControls(); }
    paintGraph(s);
    drawTree(s);
    renderFrontier(s);
    renderReached(s);
    $('.sv-say').textContent = sayText(i);
    if (mode === 'explore') renderTransport(); else renderPredict();
    if (lastEvent !== i) { lastEvent = i; opts.onEvent?.(`Step ${i}: ${sayText(i)}`); }
  }

  function go(k: number) {
    i = Math.max(0, Math.min(T.steps.length - 1, k));
    render();
  }

  function stop() { if (timer) { clearInterval(timer); timer = 0; } }
  function play() {
    if (timer) { stop(); renderTransport(); return; }
    if (isLast()) go(0);
    timer = window.setInterval(() => { if (isLast()) { stop(); renderTransport(); } else go(i + 1); }, 1150 / speed);
    renderTransport();
  }

  function rebuild() {
    stop();
    T = trace(cfg);
    i = 0; lastEvent = -1; tIter = -1;
    Object.assign(P, { correct: 0, total: 0, first: true, fb: '', fbOk: true, done: false, optsFor: -1 });
    drawGraph();
    render(true);
  }

  // ---------------------------------------------------------------- events
  const onClick = (e: MouseEvent) => {
    const t = e.target as Element;
    const a = t.closest<HTMLElement>('[data-a]');
    if (a) {
      const act = a.dataset.a;
      if (act === 'step') { stop(); go(i + 1); }
      else if (act === 'back') { stop(); go(i - 1); }
      else if (act === 'first') { stop(); go(0); }
      else if (act === 'play') play();
      else if (act === 'reveal') reveal();
      else if (act === 'continue') { P.fb = ''; go(i + 1); }
      else if (act === 'restart') { rebuild(); }
      return;
    }
    const o = t.closest<HTMLElement>('[data-opt]');
    if (o) return onChoice(+o.dataset.opt!, o);
    if (mode !== 'predict') return;
    const n = t.closest<HTMLElement | SVGElement>('[data-id]');
    if (n) return onPick({ id: +n.dataset.id! }, n);
    const g = t.closest<SVGElement>('.sv-gn [data-s]');
    if (g) onPick({ state: g.dataset.s! }, g);
  };
  const onChange = (e: Event) => {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    if (t.classList.contains('sv-speed')) { speed = +t.value; if (timer) { stop(); play(); } return; }
    if (t.dataset.k) onControl(t);
  };
  const onInput = (e: Event) => {
    const t = e.target as HTMLInputElement;
    if (t.classList.contains('sv-scrub')) { stop(); go(+t.value); }
  };
  const onKey = (e: KeyboardEvent) => {
    if ((e.target as Element).closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (mode === 'explore') { stop(); go(i + 1); } else if (question().kind === 'continue') { P.fb = ''; go(i + 1); }
    } else if (e.key === 'ArrowLeft' && mode === 'explore') { e.preventDefault(); stop(); go(i - 1); }
    else if (e.key === ' ' && mode === 'explore' && !(e.target as Element).closest('button')) { e.preventDefault(); play(); }
    else if (e.key === 'Home' && mode === 'explore') { e.preventDefault(); stop(); go(0); }
  };
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onKey);
  root.addEventListener('animationend', e => (e.target as Element).classList.remove('sv-shake'));

  let lastW = 0;
  const ro = new ResizeObserver(() => {
    const w = $('.sv-gwrap').clientWidth;
    if (Math.abs(w - lastW) < 2) return;
    lastW = w;
    drawGraph();
    const s = T.steps[i];
    paintGraph(s);
    drawTree(s, false);
  });

  if (mode === 'explore') $('.sv-ctrl').innerHTML = controlsHTML();
  drawGraph();
  render(true);
  ro.observe(root);
  lastW = $('.sv-gwrap').clientWidth;

  return {
    destroy() {
      stop();
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      root.removeEventListener('input', onInput);
      root.removeEventListener('keydown', onKey);
      root.remove();
    },
  };
}

function controlsHTML(): string {
  const algs: Array<[Algorithm, string]> = [['bfs', 'Breadth-first (BFS)'], ['ucs', 'Uniform-cost (UCS)'], ['dfs', 'Depth-first (DFS)'],
    ['dls', 'Depth-limited (DLS)'], ['ids', 'Iterative deepening (IDS)'], ['greedy', 'Greedy best-first'], ['astar', 'A*'],
    ['wastar', 'Weighted A*'], ['idastar', 'IDA*']];
  return `<label class="sv-f"><span>Algorithm</span><select data-k="algorithm">${algs.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
    <label class="sv-f" data-show="gs"><span>Repeated states</span><select data-k="graphSearch"><option value="false">Tree search (is_cycle)</option>
      <option value="true">Graph search: reached</option><option value="expanded">Graph search: expanded list</option></select></label>
    <label class="sv-f sv-chk" data-show="early"><input type="checkbox" data-k="early"><span>Early goal test</span></label>
    <label class="sv-f" data-show="limit"><span>Depth limit L</span><input type="number" min="0" max="30" data-k="limit"></label>
    <label class="sv-f" data-show="weight"><span>Weight w</span><input type="number" min="1" max="10" step="0.5" data-k="weight"></label>
    <label class="sv-f" data-show="order"><span>Children</span><select data-k="childOrder"><option value="alpha">First child expanded first</option>
      <option value="code">Last child first (aima push order)</option></select></label>
    <label class="sv-f" data-show="ties"><span>Ties</span><select data-k="ties"><option value="fifo">FIFO (insertion order)</option>
      <option value="alpha">Alphabetical</option><option value="lifo">LIFO (newest first)</option></select></label>`;
}

function skeleton(mode: 'explore' | 'predict', uid: string): string {
  const marker = (id: string, cls: string) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path class="sv-ah ${cls}" d="M0,1 L9,5 L0,9 z"/></marker>`;
  const bar = mode === 'explore'
    ? `<div class="sv-ctrl"></div>
       <div class="sv-bar">
         <div class="sv-tp">
           <button class="btn sm sv-ib" data-a="first" title="Reset (Home)" aria-label="Reset">${ICON.reset}</button>
           <button class="btn sm sv-ib" data-a="back" title="Back (←)" aria-label="Back">${ICON.back}</button>
           <button class="btn sm primary sv-play" data-a="play" title="Play / pause (space)"></button>
           <button class="btn sm" data-a="step" title="Step (→)">Step${ICON.next}</button>
         </div>
         <input class="sv-scrub" type="range" min="0" value="0" aria-label="Step">
         <span class="sv-count"></span>
         <select class="sv-speed" aria-label="Speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select>
       </div>`
    : '<div class="sv-pbar" aria-live="polite"></div>';
  return `<div class="sv-head"><div class="sv-title"></div><div class="sv-rules"></div></div>${bar}
    <div class="sv-say" aria-live="polite"></div>
    <div class="sv-grid">
      <section class="sv-p sv-pg"><header class="sv-ph"><span>State space</span><span class="sv-meta sv-gmeta"></span></header>
        <div class="sv-gwrap"><svg class="sv-gsvg" role="img" aria-label="State-space graph"><defs>${marker(`${uid}-a`, '')}${marker(`${uid}-a-cur`, 'cur')}${marker(`${uid}-a-path`, 'path')}${marker(`${uid}-s`, 'start')}
          <pattern id="${uid}-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="sv-hbg" width="7" height="7"/><line class="sv-hl" x1="0" y1="0" x2="0" y2="7"/></pattern></defs>
          <g class="sv-ge"></g><g class="sv-gn"></g></svg></div>
        <div class="sv-legend"><span><i class="sv-sw cur"></i>current</span><span><i class="sv-sw front"></i>frontier</span><span><i class="sv-sw exp"></i>expanded</span>
          <span><i class="sv-sw path"></i>solution</span><span><i class="sv-sw goal"></i>goal</span><span><i class="sv-arr">→</i>start</span></div>
        <div class="sv-key" hidden></div></section>
      <section class="sv-p sv-pt"><header class="sv-ph"><span>Search tree</span><span class="sv-meta sv-tmeta"></span></header>
        <div class="sv-tscroll"><svg class="sv-tsvg" role="img" aria-label="Search tree"><g class="sv-te"></g><g class="sv-tn-g"></g></svg></div>
        <div class="sv-legend"><span><b class="sv-num">3</b>selection order</span><span><i class="sv-sw ghost"></i>generated, dropped</span></div></section>
      <section class="sv-p sv-pf"><header class="sv-ph"><span>Frontier</span><span class="sv-meta sv-fmeta"></span></header><div class="sv-fbody"></div></section>
      <section class="sv-p sv-pr"><header class="sv-ph"><span class="sv-rtitle">Reached</span><span class="sv-meta sv-rmeta"></span></header><div class="sv-rbody"></div></section>
    </div>`;
}

function injectCSS() {
  if (document.getElementById('viz-search-css')) return;
  const st = document.createElement('style');
  st.id = 'viz-search-css';
  st.textContent = CSS;
  document.head.append(st);
}

const CSS = `
.sv{container-type:inline-size;display:flex;flex-direction:column;gap:10px;font:13px/1.45 var(--font);color:var(--text);outline:none}
.sv:focus-visible{box-shadow:0 0 0 2px var(--accent-soft);border-radius:var(--radius)}
.sv svg{display:block;overflow:visible}
.sv .btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.sv .btn svg .sv-fill{fill:currentColor;stroke:none}
.sv-head{display:flex;flex-direction:column;gap:7px}
.sv-title{font-size:15px;font-weight:650;letter-spacing:-.01em}
.sv-rules{display:flex;flex-wrap:wrap;gap:5px}
.sv-rule{font-size:12px;line-height:1.3;padding:3px 9px;border-radius:99px;background:var(--panel-2);border:1px solid var(--border);color:var(--text-2)}
.sv-ctrl{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel-2)}
.sv-f{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--muted)}
.sv-f[hidden]{display:none}
.sv-f select,.sv-f input{font-size:12.5px;padding:3px 6px;background:var(--panel)}
.sv-f input[type=number]{width:60px}
.sv-chk input{accent-color:var(--accent);width:15px;height:15px;margin:0}
.sv-chk span{color:var(--text-2)}
.sv-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
.sv-tp{display:inline-flex;gap:6px}
.sv-ib{padding:3px 7px}
.sv-play{min-width:78px;justify-content:center}
.sv-scrub{flex:1 1 140px;min-width:110px;accent-color:var(--accent);margin:0}
.sv-count{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.sv-speed{font-size:12px;padding:2px 6px}
.sv-say{background:var(--panel-2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:var(--radius-sm);padding:9px 13px;font-size:13.5px;line-height:1.5;min-height:42px}
.sv-pbar{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel-2)}
.sv-pq{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 14px}
.sv-ptitle{font-weight:600;font-size:14px}
.sv-psub{font-size:12.5px;color:var(--muted)}
.sv-pact{display:flex;align-items:center;gap:8px}
.sv-score{font-variant-numeric:tabular-nums;font-weight:650;font-size:13px;padding:3px 10px;border-radius:99px;background:var(--panel);border:1px solid var(--border)}
.sv-score i{font-style:normal;color:var(--muted);margin:0 2px}
.sv-opts{display:flex;flex-direction:column;gap:6px}
.sv-opt{justify-content:flex-start;white-space:normal;text-align:left;font-variant-numeric:tabular-nums;background:var(--panel)}
.sv-opt:hover{border-color:var(--accent)}
.sv-fb{font-size:13px;padding:6px 10px;border-radius:var(--radius-sm);animation:sv-fade .25s ease}
.sv-fb.ok{color:var(--ok);background:var(--ok-soft)}
.sv-fb.bad{color:var(--bad);background:var(--bad-soft)}
.sv-grid{display:grid;gap:10px;grid-template-columns:minmax(0,1fr);grid-template-areas:"g" "f" "t" "r"}
@container (min-width:760px){.sv-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-areas:"g t" "f r"}.sv.sv-gridmode .sv-grid{grid-template-areas:"g g" "f r"}}
.sv.sv-gridmode .sv-pt{display:none}
.sv-pg{grid-area:g}.sv-pt{grid-area:t}.sv-pf{grid-area:f}.sv-pr{grid-area:r}
.sv-p{min-width:0;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);display:flex;flex-direction:column;overflow:hidden}
.sv-ph{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 12px;border-bottom:1px solid var(--border);font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.sv-meta{font-weight:500;letter-spacing:0;text-transform:none;color:var(--text-2);font-variant-numeric:tabular-nums;text-align:right}
.sv-gwrap{padding:6px;background-image:radial-gradient(var(--border) 1px,transparent 1.3px);background-size:16px 16px;flex:1;display:flex;align-items:center;justify-content:center}
.sv-legend{display:flex;flex-wrap:wrap;gap:4px 14px;padding:7px 12px 9px;font-size:12px;color:var(--muted);border-top:1px solid var(--border)}
.sv-legend span{display:inline-flex;align-items:center;gap:6px}
.sv-sw{display:inline-block;width:11px;height:11px;border-radius:50%;background:var(--v-node);border:1.6px solid var(--v-node-stroke)}
.sv-sw.cur{background:var(--v-current);border-color:var(--v-current)}
.sv-sw.front{background:var(--warn-soft);border-color:var(--v-frontier)}
.sv-sw.exp{background:var(--v-explored);border-color:var(--v-explored)}
.sv-sw.path{background:var(--v-path);border-color:var(--v-path)}
.sv-sw.goal{box-shadow:0 0 0 2px var(--panel),0 0 0 3.4px var(--v-node-stroke)}
.sv-sw.ghost{background:none;border-style:dashed;border-color:var(--muted)}
.sv-arr{font-style:normal;color:var(--text-2);font-weight:700}
.sv-key{display:flex;flex-wrap:wrap;gap:2px 12px;padding:0 12px 9px;font-size:12px;color:var(--muted)}
.sv-key[hidden]{display:none}
.sv-key b{color:var(--text-2);font-weight:650}
.sv-num{font-size:12px;color:var(--accent);font-weight:700}
/* graph */
.sv-e{stroke:var(--v-edge);stroke-width:1.6;transition:stroke .3s,stroke-width .3s}
.sv-e.cur{stroke:var(--v-current);stroke-width:2.6}
.sv-e.path{stroke:var(--v-path);stroke-width:3.4}
.sv-ah{fill:var(--v-edge)}.sv-ah.cur{fill:var(--v-current)}.sv-ah.path{fill:var(--v-path)}.sv-ah.start{fill:var(--text-2)}
.sv-start{stroke:var(--text-2);stroke-width:1.8;fill:none}
.sv-ec{font-size:12px;font-weight:600;fill:var(--text-2);text-anchor:middle;dominant-baseline:central;paint-order:stroke;stroke:var(--panel);stroke-width:5px;stroke-linejoin:round;font-variant-numeric:tabular-nums;pointer-events:none}
.sv-c{fill:var(--v-node);stroke:var(--v-node-stroke);stroke-width:1.6;transition:fill .3s,stroke .3s}
.sv-t{font-size:13px;font-weight:650;fill:var(--text);text-anchor:middle;dominant-baseline:central;pointer-events:none;transition:fill .3s}
.sv-halo{fill:var(--accent-soft);opacity:0;transition:opacity .3s}
.sv-ring{fill:none;stroke:var(--v-node-stroke);stroke-width:1.4}
.sv-h{font-size:12px;font-weight:600;fill:var(--accent-2);paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round;font-variant-numeric:tabular-nums}
.sv-n.front .sv-c,.sv-tn.front .sv-c{fill:var(--warn-soft);stroke:var(--v-frontier);stroke-width:2.2}
.sv-n.exp .sv-c,.sv-tn.exp .sv-c{fill:var(--v-explored);stroke:var(--v-explored)}
.sv-n.cur .sv-c,.sv-tn.cur .sv-c{fill:var(--v-current);stroke:var(--v-current)}
.sv-n.cur .sv-t,.sv-tn.cur .sv-t,.sv-n.path .sv-t,.sv-tn.path .sv-t{fill:#fff}
.sv-n.cur .sv-halo,.sv-tn.cur .sv-halo{opacity:1;animation:sv-pulse 1.6s ease-in-out infinite}
.sv-n.path .sv-c,.sv-tn.path .sv-c{fill:var(--v-path);stroke:var(--v-path)}
.sv-cell .sv-c{stroke-width:1}
.sv-cell .sv-t{font-size:12px;font-weight:600}
.sv-cell .sv-t.dim{fill:var(--muted);font-weight:500}
.sv-cell.cur .sv-t.dim,.sv-cell.path .sv-t.dim{fill:#fff}
.sv-ctag{font-size:12px;font-weight:700;fill:var(--text-2);dominant-baseline:hanging;pointer-events:none}
.sv-cell.path .sv-ctag,.sv-cell.cur .sv-ctag{fill:#fff}
.sv-wall{stroke:var(--border-strong);stroke-width:1}
.sv-hbg{fill:var(--panel-2)}.sv-hl{stroke:var(--border-strong);stroke-width:2.5}
.sv-pick{cursor:pointer}
.sv-n.sv-pick:hover .sv-c,.sv-tn.sv-pick:hover .sv-c{stroke:var(--accent);stroke-width:2.6}
/* tree */
.sv-tscroll{overflow:auto;max-height:470px;flex:1;padding:4px 0}
.sv-tedge{stroke:var(--v-edge);stroke-width:1.5;transition:stroke .3s}
.sv-tedge.cur{stroke:var(--v-current);stroke-width:2.4}
.sv-tedge.path{stroke:var(--v-path);stroke-width:3}
.sv-tedge.ghost{stroke-dasharray:3 4;opacity:.7}
.sv-tl{font-size:12px;fill:var(--text-2);text-anchor:middle;font-variant-numeric:tabular-nums;font-weight:600;paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round}
.sv-tl2{fill:var(--muted);font-weight:500}
.sv-ord{font-size:12px;font-weight:700;fill:var(--accent);text-anchor:end;paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round}
.sv-tn.ghost .sv-c{fill:none;stroke:var(--muted);stroke-dasharray:3 3}
.sv-tn.ghost .sv-t,.sv-tn.ghost .sv-tl{fill:var(--muted)}
.sv-tn.ghost{opacity:.8}
.sv-tn.stale .sv-c{fill:none;stroke:var(--muted);stroke-dasharray:2 3}
.sv-tn.stale .sv-t{fill:var(--muted);text-decoration:line-through}
.sv-tn.cut .sv-c{fill:var(--panel-3);stroke:var(--v-explored);stroke-width:2;stroke-dasharray:4 3}
.sv-tn{transition:opacity .3s}
.sv-tn.sv-new{opacity:0}
.sv-in{transform-box:fill-box;transform-origin:center}
.sv-shake{animation:sv-shake .42s ease}
/* frontier */
.sv-fbody{padding:10px 12px;overflow:auto;max-height:300px}
.sv-empty{color:var(--muted);font-size:12.5px;font-style:italic}
.sv-queue{display:flex;flex-wrap:wrap;gap:6px;align-items:stretch}
.sv-qend{align-self:center;font-size:12px;color:var(--muted);margin-right:2px}
.sv-it{display:inline-flex;flex-direction:column;align-items:center;gap:0;min-width:46px;padding:5px 9px;border-radius:8px;border:1px solid var(--border);background:var(--panel-2);font:inherit;color:inherit;line-height:1.25;animation:sv-fade .3s ease}
.sv-it b{font-size:14px}
.sv-it span{font-size:12px;color:var(--text-2);font-variant-numeric:tabular-nums}
.sv-it .sv-via{color:var(--muted)}
.sv-it.next{border-color:var(--v-frontier);background:var(--warn-soft)}
.sv-it.stale,.sv-row.stale{opacity:.55}
.sv-it.sv-pick{cursor:pointer}
.sv-it.sv-pick:hover,.sv-row.sv-pick:hover td{border-color:var(--accent);background:var(--accent-soft)}
.sv-tbl{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:13px}
.sv-tbl th{font-size:12px;font-weight:500;color:var(--muted);text-align:right;padding:2px 8px 5px}
.sv-tbl th:first-child,.sv-tbl td:first-child,.sv-tbl th:nth-child(2),.sv-tbl td:nth-child(2){text-align:left}
.sv-tbl td{padding:5px 8px;border-top:1px solid var(--border);text-align:right}
.sv-tbl .key{font-weight:700;color:var(--text)}
.sv-tbl th.key{color:var(--text-2)}
.sv-tbl .sv-st{font-weight:650}
.sv-tbl .sv-via{color:var(--muted)}
.sv-row{animation:sv-fade .3s ease}
.sv-row.next td{background:var(--warn-soft)}
.sv-row.next td:first-child{box-shadow:inset 3px 0 0 var(--v-frontier)}
.sv-row.sv-pick{cursor:pointer}
.sv-tag{display:inline-block;font-size:12px;font-weight:500;line-height:1.2;padding:1px 6px;margin-left:6px;border-radius:99px;background:var(--panel-3);color:var(--muted)}
.sv-note{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.45}
/* reached */
.sv-rbody{padding:10px 12px;display:flex;flex-direction:column;gap:10px}
.sv-rbody .sv-note{margin-top:0}
.sv-rgrid{display:flex;flex-wrap:wrap;gap:5px}
.sv-rc{display:inline-flex;align-items:baseline;gap:6px;padding:3px 9px;border-radius:7px;border:1px solid var(--border);background:var(--panel-2);font-size:12.5px;font-variant-numeric:tabular-nums;color:var(--text-2)}
.sv-rc b{color:var(--text);font-size:13px}
.sv-rc.new{border-color:var(--accent);background:var(--accent-soft);animation:sv-fade .3s ease}
.sv-rc.upd{border-color:var(--v-frontier);background:var(--warn-soft)}
.sv-order{display:flex;flex-direction:column;gap:4px}
.sv-olabel{font-size:12px;color:var(--muted)}
.sv-oline{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;font-weight:650;font-size:13.5px}
.sv-oline i{font-style:normal;color:var(--muted);font-weight:400}
.sv-oline .cut{color:var(--muted);font-weight:500}
.sv-oline .sv-tag{margin:0 4px 0 0}
.sv-result{border-radius:var(--radius-sm);padding:8px 11px;font-size:13px;border:1px solid var(--border);animation:sv-fade .3s ease}
.sv-result.ok{background:var(--ok-soft);border-color:color-mix(in srgb,var(--ok) 35%,transparent)}
.sv-result.warn{background:var(--warn-soft);border-color:color-mix(in srgb,var(--warn) 40%,transparent)}
.sv-result.bad{background:var(--bad-soft);border-color:color-mix(in srgb,var(--bad) 35%,transparent)}
.sv-rsub{font-size:12.5px;color:var(--text-2);margin-top:2px}
@keyframes sv-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
@keyframes sv-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes sv-fade{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.sv *{animation:none!important;transition:none!important}}
`;
