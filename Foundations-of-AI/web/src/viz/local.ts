/*
 * local.ts — Local search: steepest-descent hill climbing (with optional sideways moves and random restarts)
 * and min-conflicts, on the slides' instances: homes & hospitals (p. 322–330) and N-queens (p. 332–335, Fig. 4.3).
 * Framework-agnostic (plain DOM + inline SVG), CSS injected once. Contract: ./README.md.
 *
 * CONVENTIONS (also stated in the trace problems)
 *   Cost is MINIMISED. Hospitals: sum over houses of the Manhattan distance to the nearest hospital; a neighbour
 *   moves ONE hospital one cell up/down/left/right (inside the grid, not onto a house or another hospital).
 *   N-queens: h = number of attacking pairs; a neighbour moves ONE queen within its column.
 *   Steepest descent evaluates every neighbour and moves to the cheapest; ties → first in enumeration order
 *   (hospitals in order, directions ↑ ↓ ← →; queens column by column, rows top to bottom). It stops when the
 *   best neighbour is not strictly better (unless a sideways move is still allowed).
 */
import type { Preset, VizInstance, VizOptions } from './types';

/** Visualizer config (JSON-serializable; used by problems/local/t*.py CONFIG). */
export interface LocalConfig {
  problem: 'hospitals' | 'queens';
  /** hospitals: grid size (default 10 × 5). */
  width?: number;
  height?: number;
  /** hospitals: [row, col], 0-based, row 0 = top. */
  houses?: [number, number][];
  hospitals?: [number, number][];
  /** queens: board size (default 8) and the starting row of the queen in each column (1 = top row). */
  n?: number;
  start?: number[];
  /** steepest = steepest-descent hill climbing; minconflicts = random conflicted queen → min-conflict row. */
  algorithm?: 'steepest' | 'minconflicts';
  /** Consecutive sideways (equal-cost) moves allowed (default 0 = stop on a plateau). */
  maxSideways?: number;
  /** Random restarts when stuck (default 0). */
  restarts?: number;
  /** Seed for the random parts (restarts, min-conflicts, "new start"). */
  seed?: number;
  /** Safety cap on iterations (default 200). */
  maxSteps?: number;
  /** Predict mode: start with the neighbour costs visible (default false: the learner computes them). */
  showCosts?: boolean;
}

export const PRESETS: Preset<LocalConfig>[] = [
  {
    name: 'Homes & hospitals – steepest descent (slides p. 322–330)', topic: 'local',
    config: { problem: 'hospitals', width: 10, height: 5, houses: [[0, 8], [1, 2], [3, 1], [4, 6]], hospitals: [[0, 4], [3, 9]], algorithm: 'steepest', maxSideways: 0 },
  },
  {
    name: '8-queens hill climbing from Fig. 4.3(b) (h = 17)', topic: 'local',
    config: { problem: 'queens', n: 8, start: [5, 6, 7, 4, 5, 6, 7, 6], algorithm: 'steepest', maxSideways: 0 },
  },
  {
    name: '4-queens as optimization (slide p. 334)', topic: 'local',
    config: { problem: 'queens', n: 4, start: [3, 2, 3, 2], algorithm: 'steepest' },
  },
  {
    name: 'Homes & hospitals – with sideways moves', topic: 'local',
    config: { problem: 'hospitals', width: 10, height: 5, houses: [[0, 8], [1, 2], [3, 1], [4, 6]], hospitals: [[0, 4], [3, 9]], algorithm: 'steepest', maxSideways: 1 },
  },
  {
    name: '8-queens – min-conflicts', topic: 'local',
    config: { problem: 'queens', n: 8, start: [5, 6, 7, 4, 5, 6, 7, 6], algorithm: 'minconflicts', seed: 14 },
  },
];

/* ------------------------------------------------------------------ model */

type Cell = [number, number];
type State = number[] | Cell[];
interface Eval { label: string; cost: number; target: Cell; who: number; state: State }
type Kind = 'start' | 'move' | 'sideways' | 'stuck' | 'goal' | 'restart' | 'pick' | 'limit';
interface Question { ok: number[]; stop: boolean } // acceptable eval indices of the PREVIOUS step, or "stop"
interface Step {
  kind: Kind;
  text: string;
  state: State;
  cost: number;
  evals: Eval[];
  best: number;
  next: number; // eval index taken from this state (-1 = none)
  pick?: number; // min-conflicts: chosen column
  nPts: number;
  stats: { iter: number; evaluated: number; sideways: number; restarts: number };
  q?: Question | null;
}
interface Pt { x: number; y: number; restart: boolean }
export interface LocalTrace { cfg: Required<LocalConfig>; steps: Step[]; pts: Pt[]; optimum: number; total: number }

const DIRS: [string, number, number][] = [['↑', -1, 0], ['↓', 1, 0], ['←', 0, -1], ['→', 0, 1]];

function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fill(c: LocalConfig): Required<LocalConfig> {
  const q = c.problem === 'queens';
  const n = Math.max(4, Math.min(8, c.n ?? 8));
  return {
    problem: c.problem, width: c.width ?? 10, height: c.height ?? 5,
    houses: c.houses ?? [], hospitals: c.hospitals ?? [],
    n, start: q ? (c.start && c.start.length === n ? c.start.slice() : randomQueens(n, rng(c.seed ?? 1))) : [],
    algorithm: q ? c.algorithm ?? 'steepest' : 'steepest', maxSideways: c.maxSideways ?? 0, restarts: c.restarts ?? 0,
    seed: c.seed ?? 1, maxSteps: c.maxSteps ?? 200, showCosts: c.showCosts ?? false,
  };
}
const randomQueens = (n: number, r: () => number) => Array.from({ length: n }, () => 1 + Math.floor(r() * n));

const qPairs = (s: number[]) => {
  const out: [number, number][] = [];
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (s[i] === s[j] || Math.abs(s[i] - s[j]) === j - i) out.push([i, j]);
  return out;
};
const qCost = (s: number[]) => qPairs(s).length;
const qAttacks = (s: number[], c: number, r: number) => s.reduce((k, rr, cc) => k + (cc !== c && (rr === r || Math.abs(rr - r) === Math.abs(cc - c)) ? 1 : 0), 0);
const dist = (a: Cell, b: Cell) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const nearest = (h: Cell, H: Cell[]) => H.reduce((bi, x, k) => (dist(h, x) < dist(h, H[bi]) ? k : bi), 0);
const hCost = (C: Required<LocalConfig>, H: Cell[]) => C.houses.reduce((s, h) => s + dist(h, H[nearest(h, H)]), 0);
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];

function neighbours(C: Required<LocalConfig>, s: State): Eval[] {
  const out: Eval[] = [];
  if (C.problem === 'queens') {
    const q = s as number[];
    q.forEach((row, c) => {
      for (let r = 1; r <= C.n; r++) {
        if (r === row) continue;
        const t = q.slice();
        t[c] = r;
        out.push({ label: `column ${c + 1} → row ${r}`, cost: qCost(t), target: [r, c], who: c, state: t });
      }
    });
  } else {
    const H = s as Cell[];
    H.forEach((p, k) => DIRS.forEach(([arrow, dr, dc]) => {
      const t: Cell = [p[0] + dr, p[1] + dc];
      if (t[0] < 0 || t[1] < 0 || t[0] >= C.height || t[1] >= C.width) return;
      if (C.houses.some(h => same(h, t)) || H.some(h => same(h, t))) return;
      const ns = H.map(h => [h[0], h[1]] as Cell);
      ns[k] = t;
      out.push({ label: `H${k + 1} ${arrow} (${t[0]}, ${t[1]})`, cost: hCost(C, ns), target: t, who: k, state: ns });
    }));
  }
  return out;
}

function hospitalsOptimum(C: Required<LocalConfig>): number {
  const cells: Cell[] = [];
  for (let r = 0; r < C.height; r++) for (let c = 0; c < C.width; c++) if (!C.houses.some(h => same(h, [r, c]))) cells.push([r, c]);
  const k = C.hospitals.length;
  if (k > 3) return NaN;
  let best = Infinity;
  const pick = (from: number, H: Cell[]) => {
    if (H.length === k) { best = Math.min(best, hCost(C, H)); return; }
    for (let i = from; i < cells.length; i++) pick(i + 1, [...H, cells[i]]);
  };
  pick(0, []);
  return best;
}

const fmtState = (C: Required<LocalConfig>, s: State) => C.problem === 'queens'
  ? `[${(s as number[]).join(', ')}]`
  : (s as Cell[]).map((h, k) => `H${k + 1} (${h[0]}, ${h[1]})`).join(', ');
const costWord = (C: Required<LocalConfig>) => (C.problem === 'queens' ? 'h' : 'cost');

/** Precompute the run as an array of snapshots (pure; exported for tests). */
export function buildTrace(cfg: LocalConfig): LocalTrace {
  const C = fill(cfg);
  const queens = C.problem === 'queens';
  const rand = rng(C.seed * 7919 + 17);
  const optimum = queens ? 0 : hospitalsOptimum(C);
  const steps: Step[] = [], pts: Pt[] = [];
  const stats = { iter: 0, evaluated: 0, sideways: 0, restarts: 0 };
  let state: State = queens ? C.start.slice() : C.hospitals.map(h => [h[0], h[1]] as Cell);
  let cost = queens ? qCost(state as number[]) : hCost(C, state as Cell[]);
  const W = costWord(C);
  pts.push({ x: 0, y: cost, restart: false });
  const push = (kind: Kind, text: string, evals: Eval[], extra: Partial<Step> = {}) => steps.push({
    kind, text, state, cost, evals, best: evals.length ? Math.min(...evals.map(e => e.cost)) : NaN, next: -1,
    nPts: pts.length, stats: { ...stats }, ...extra,
  });
  const breakdown = () => queens ? '' : ' = ' + C.houses.map(h => dist(h, (state as Cell[])[nearest(h, state as Cell[])])).join(' + ');
  const restart = (why: string) => {
    stats.restarts++;
    state = queens ? randomQueens(C.n, rand) : randomHospitals();
    cost = queens ? qCost(state as number[]) : hCost(C, state as Cell[]);
    stats.iter++;
    pts.push({ x: stats.iter, y: cost, restart: true });
    return `${why} → random restart #${stats.restarts}: ${fmtState(C, state)}, ${W} = ${cost}.`;
  };
  const randomHospitals = (): Cell[] => {
    const H: Cell[] = [];
    while (H.length < C.hospitals.length) {
      const t: Cell = [Math.floor(rand() * C.height), Math.floor(rand() * C.width)];
      if (!C.houses.some(h => same(h, t)) && !H.some(h => same(h, t))) H.push(t);
    }
    return H;
  };
  let bestSeen = { cost, state };

  if (C.algorithm === 'steepest') {
    let evals = neighbours(C, state);
    stats.evaluated += evals.length;
    push('start', `Start: ${fmtState(C, state)}, ${W}${breakdown()} = ${cost}. Steepest descent looks at all ${evals.length} neighbours.`, evals);
    let side = 0, restartText = '';
    for (;;) {
      if (queens && cost === 0) { push('goal', 'h = 0: no pair of queens attacks each other → solution, stop.', [], { q: { ok: [], stop: true } }); break; }
      if (stats.iter >= C.maxSteps) { push('limit', `Iteration limit (${C.maxSteps}) reached.`, []); break; }
      const prev = steps[steps.length - 1];
      const best = Math.min(...evals.map(e => e.cost));
      const ties = evals.map((e, k) => [e, k] as const).filter(([e]) => e.cost === best);
      const k = ties[0][1];
      const tieNote = ties.length > 1 ? ` ${ties.length} neighbours tie at ${best}; the first in enumeration order is taken.` : '';
      const okIdx = ties.map(([, j]) => j);
      if (best < cost || (best === cost && side < C.maxSideways)) {
        const sideways = best === cost;
        side = sideways ? side + 1 : 0;
        if (sideways) stats.sideways++;
        prev.next = k;
        const from = cost;
        state = evals[k].state;
        cost = best;
        stats.iter++;
        pts.push({ x: stats.iter, y: cost, restart: false });
        if (cost < bestSeen.cost) bestSeen = { cost, state };
        evals = neighbours(C, state);
        stats.evaluated += evals.length;
        const text = sideways
          ? `No neighbour is better (best = ${best} = current) → sideways move ${side} of ${C.maxSideways}: move ${prev.evals[k].label}, ${W} stays ${cost}.${tieNote}`
          : `Best of ${prev.evals.length} neighbours: move ${prev.evals[k].label}, ${W} ${from} → ${cost}${breakdown() ? ` (${breakdown().slice(3)})` : ''}.${tieNote}`;
        push(sideways ? 'sideways' : 'move', restartText + text, evals, { q: { ok: okIdx, stop: false } });
        restartText = '';
        continue;
      }
      const kindTxt = best > cost
        ? `every neighbour is worse (best = ${best} > ${cost}): a local minimum`
        : `the best neighbours only tie (${best} = ${cost})${C.maxSideways ? ` and the ${C.maxSideways} sideways move${C.maxSideways > 1 ? 's are' : ' is'} used up` : ''}: a plateau / shoulder`;
      const glob = cost === optimum ? ' This happens to be the global optimum.' : ` The global optimum is ${optimum}, so hill climbing got stuck.`;
      if (stats.restarts < C.restarts && !(queens && cost === 0)) {
        const t = restart(`Stuck at ${W} = ${cost} (${kindTxt})`);
        side = 0;
        if (cost < bestSeen.cost) bestSeen = { cost, state };
        evals = neighbours(C, state);
        stats.evaluated += evals.length;
        push('restart', t, evals, { q: { ok: [], stop: true } });
        continue;
      }
      const final = C.restarts ? ` Best state found: ${W} = ${bestSeen.cost}.` : '';
      push('stuck', `Stop: ${kindTxt}.${glob}${final}`, evals, { q: { ok: [], stop: true } });
      break;
    }
  } else {
    // min-conflicts (queens): random conflicted column → row with the fewest attacks (random tie-break)
    let s = state as number[];
    push('start', `Start: ${fmtState(C, s)}, h = ${cost}. Min-conflicts repeatedly picks a random conflicted queen and moves it to the row with the fewest conflicts.`, []);
    for (;;) {
      if (cost === 0) { push('goal', 'h = 0: no conflicts left → solution.', []); break; }
      if (stats.iter >= C.maxSteps) { push('limit', `Iteration limit (${C.maxSteps}) reached with h = ${cost}.`, []); break; }
      const conflicted = s.map((r, c) => (qAttacks(s, c, r) ? c : -1)).filter(c => c >= 0);
      const c = conflicted[Math.floor(rand() * conflicted.length)];
      const evals: Eval[] = [];
      for (let r = 1; r <= C.n; r++) {
        const t = s.slice();
        t[c] = r;
        evals.push({ label: `column ${c + 1} → row ${r}`, cost: qAttacks(s, c, r), target: [r, c], who: c, state: t });
      }
      stats.evaluated += evals.length;
      push('pick', `Conflicted queens in columns ${conflicted.map(x => x + 1).join(', ')}; pick column ${c + 1} at random and count the conflicts of each of its squares.`, evals, { pick: c });
      const min = Math.min(...evals.map(e => e.cost));
      const ties = evals.map((e, k) => [e, k] as const).filter(([e]) => e.cost === min).map(([, k]) => k);
      const k = ties[Math.floor(rand() * ties.length)];
      const prev = steps[steps.length - 1];
      prev.next = k;
      const from = cost;
      s = evals[k].state as number[];
      state = s;
      cost = qCost(s);
      stats.iter++;
      pts.push({ x: stats.iter, y: cost, restart: false });
      push('move', `Row ${k + 1} has the fewest conflicts (${min})${ties.length > 1 ? `, tied with ${ties.length - 1} other row${ties.length > 2 ? 's' : ''} (random choice)` : ''} → move the queen of column ${c + 1} there: h ${from} → ${cost}.`, [], { pick: c, q: { ok: ties, stop: false } });
    }
  }
  return { cfg: C, steps, pts, optimum, total: steps.filter(s => s.q).length };
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
  back: 'M11 17l-5-5 5-5M18 17l-5-5 5-5', step: 'M9 6l6 6-6 6', play: 'M8 5.5v13l10-6.5z',
  pause: 'M8 5h3v14H8zM13 5h3v14h-3z', reset: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5',
  shuffle: 'M4 7h3c4 0 6 10 10 10h3M4 17h3c1.6 0 2.8-1.6 3.9-3.6M14 8.6C15 7.6 16 7 17 7h3M18 4l3 3-3 3M18 14l3 3-3 3',
};
const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="${name === 'play' || name === 'pause' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[name]}"/></svg>`;

const CSS = `
.ls{container-type:inline-size;display:flex;flex-direction:column;gap:12px;color:var(--text);outline:none;font-size:13.5px;line-height:1.5}
.ls *{box-sizing:border-box}
.ls-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:flex-end}
.ls-bar label{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--muted);letter-spacing:.02em}
.ls-bar select{font-size:13px;padding:4px 6px}
.ls-ctrl{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ls-ctrl .btn{padding:5px 9px}
.ls-ctrl .btn svg{display:block}
.ls-pos{font:12px var(--mono);color:var(--muted);min-width:60px}
.ls-speed{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
.ls-speed input{width:76px;accent-color:var(--accent)}
.ls-toggle{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-2);cursor:pointer}
.ls-toggle input{accent-color:var(--accent)}
.ls-narr{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:var(--radius);background:var(--panel-2);border:1px solid var(--border);min-height:46px}
.ls-badge{flex:none;font:600 12px/1 var(--font);letter-spacing:.05em;padding:5px 7px;border-radius:5px;background:var(--accent-soft);color:var(--accent);margin-top:2px}
.ls-badge.k-fail{background:var(--bad-soft);color:var(--bad)}
.ls-badge.k-ok{background:var(--ok-soft);color:var(--ok)}
.ls-badge.k-warn{background:var(--warn-soft);color:var(--warn)}
.ls-ask{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:var(--radius);border:1px solid var(--accent);background:var(--accent-soft)}
.ls-ask[hidden]{display:none}
.ls-ask.idle{border-color:var(--border);background:transparent}
.ls-ask .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ls-ask .prompt{font-weight:600}
.ls-ask .fb{font-size:13px;color:var(--text-2)}
.ls-ask .fb.bad{color:var(--bad)}
.ls-ask .fb.good{color:var(--ok)}
.ls-ask.shake{animation:ls-shake .38s}
@keyframes ls-shake{0%,100%{transform:none}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.ls-main{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
@container (min-width: 760px){.ls-main{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}}
.ls-card{border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);padding:10px 12px;min-width:0}
.ls-card h4{margin:0 0 8px;font:600 12px/1.3 var(--font);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:flex;justify-content:space-between;gap:8px}
.ls-card h4 span{text-transform:none;letter-spacing:0;font-weight:500;color:var(--text-2)}
.ls-side{display:flex;flex-direction:column;gap:12px;min-width:0}
.ls-stage svg{display:block;width:100%;height:auto;margin:0 auto}
.ls-stage text{font-family:var(--font)}
.ls-big{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.ls-big b{font:600 30px/1 var(--font);font-variant-numeric:tabular-nums}
.ls-big small{color:var(--muted);font-size:12.5px}
.ls-stats{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.ls-stats .chip b{color:var(--text);font-weight:600;font-variant-numeric:tabular-nums}
.ls-sum{font:12.5px var(--mono);color:var(--text-2);margin-top:6px}
.ls-nb{display:flex;flex-wrap:wrap;gap:5px}
.ls-nb span{font:12px var(--mono);padding:2px 8px;border-radius:99px;border:1px solid var(--border);background:var(--panel-2);color:var(--text-2)}
.ls-nb span.better{border-color:var(--ok);color:var(--ok)}
.ls-nb span.equal{border-color:var(--warn);color:var(--warn)}
.ls-nb span.best{background:var(--ok);border-color:var(--ok);color:#fff}
.ls-nb span.best.equal{background:var(--warn);border-color:var(--warn);color:#1b1b1b}
.ls-chart svg{display:block;width:100%;height:auto}
.ls-chart .ax{stroke:var(--border-strong);stroke-width:1}
.ls-chart .grid{stroke:var(--border);stroke-width:1;stroke-dasharray:2 3}
.ls-chart .ln{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.ls-chart .pt{fill:var(--accent)}
.ls-chart .pt.cur{fill:var(--panel);stroke:var(--accent);stroke-width:2.5}
.ls-chart .pt.stuck{stroke:var(--bad);fill:var(--bad)}
.ls-chart .pt.goal{stroke:var(--ok);fill:var(--ok)}
.ls-chart .rs{stroke:var(--warn);stroke-dasharray:3 3;stroke-width:1.2}
.ls-chart .opt{stroke:var(--ok);stroke-dasharray:4 3;stroke-width:1.2;opacity:.8}
.ls-chart text{font:12px var(--font);fill:var(--muted)}
.ls .ls-cellbg{fill:var(--panel-2);stroke:var(--border);stroke-width:1}
.ls .ls-sq.l{fill:var(--panel-2)}
.ls .ls-sq.d{fill:var(--panel-3)}
.ls .ls-house{fill:var(--text-2)}
.ls .ls-dlabel{font-size:calc(12px * var(--ls-k, 1));font-weight:600;fill:var(--info)}
.ls .ls-route{fill:none;stroke:var(--info);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;opacity:.75}
.ls .ls-hosp rect{fill:var(--accent)}
.ls .ls-hosp path{fill:#fff}
.ls .ls-hosp text{font-size:calc(12px * var(--ls-k, 1));font-weight:700;fill:var(--accent)}
.ls .ls-cand rect{fill:var(--panel);stroke:var(--border-strong);stroke-width:1.2}
.ls .ls-cand text{font-size:calc(13px * var(--ls-k, 1));font-weight:600;text-anchor:middle;dominant-baseline:central;fill:var(--muted)}
.ls .ls-cand.better rect{fill:var(--ok-soft);stroke:var(--ok)}
.ls .ls-cand.better text{fill:var(--ok)}
.ls .ls-cand.equal rect{fill:var(--warn-soft);stroke:var(--warn)}
.ls .ls-cand.equal text{fill:var(--warn)}
.ls .ls-cand.best rect{stroke-width:2.6}
.ls .ls-cand.next rect{stroke:var(--accent);stroke-width:3}
.ls .ls-cand.next text{fill:var(--accent)}
.ls .ls-cand.hidden rect{fill:transparent;stroke:var(--accent);stroke-dasharray:4 3}
.ls .ls-cand.hidden text{fill:var(--accent)}
.ls .clickable{cursor:pointer}
.ls .clickable:hover rect{stroke:var(--accent);stroke-width:2.4}
.ls .ls-num{font-size:calc(13px * var(--ls-k, 1));font-weight:500;text-anchor:middle;dominant-baseline:central;fill:var(--text-2)}
.ls .ls-num.lbl{fill:var(--muted);font-weight:600}
.ls .ls-num.worse{fill:var(--muted);opacity:.7}
.ls .ls-num.equal{fill:var(--warn);font-weight:600}
.ls .ls-num.best{fill:var(--ok);font-weight:700}
.ls .ls-num.next{fill:var(--accent)}
.ls .ls-box.next{stroke:var(--accent);stroke-width:3}
.ls .ls-box{fill:none;stroke:var(--ok);stroke-width:2.6;rx:5}
.ls .ls-box.equal{stroke:var(--warn)}
.ls .ls-queen{fill:var(--accent)}
.ls .ls-queen.ok{fill:var(--ok)}
.ls .ls-att{stroke:var(--bad);stroke-width:1.6;opacity:.38;stroke-linecap:round}
.ls .ls-colhl{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5}
`;

/* ------------------------------------------------------------------ mount */

const KIND: Record<Kind, [string, string]> = {
  start: ['START', ''], move: ['MOVE', ''], sideways: ['SIDEWAYS', 'k-warn'], stuck: ['STUCK', 'k-fail'],
  goal: ['SOLUTION', 'k-ok'], restart: ['RESTART', 'k-warn'], pick: ['PICK', ''], limit: ['LIMIT', 'k-fail'],
};

export function mount(el: HTMLElement, config: LocalConfig, opts: VizOptions = {}): VizInstance {
  if (!document.getElementById('viz-local-css')) {
    const st = document.createElement('style');
    st.id = 'viz-local-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const mode = opts.mode === 'predict' ? 'predict' : 'explore';
  let cfg: LocalConfig = { ...config };
  let T: LocalTrace | null = null;
  let i = 0, timer: ReturnType<typeof setInterval> | null = null, speed = 3, tries = 0, correct = 0, doneSent = false;
  let showCosts = mode === 'explore' || !!config.showCosts, answered = new Set<number>();
  let fb: { cls: string; text: string; prev?: boolean } | null = null;
  let lastPos = new Map<string, string>(); // piece key → transform, to animate moves between redraws
  const place = (g: SVGGElement, k: string, x: number, y: number) => {
    const to = `translate(${x}px, ${y}px)`, from = lastPos.get(k);
    g.style.transform = to;
    if (from && from !== to) g.animate([{ transform: from }, { transform: to }], { duration: 420, easing: 'cubic-bezier(.3,.7,.3,1)' });
    lastPos.set(k, to);
  };

  el.innerHTML = '';
  const root = H('div', 'ls', el);
  // keep SVG text at ≥ its nominal px size when the drawing is scaled down (narrow layouts)
  const fitText = () => {
    const svg = svgBox.querySelector('svg');
    if (svg?.clientWidth) root.style.setProperty('--ls-k', String(Math.min(1.8, Math.max(1, svg.viewBox.baseVal.width / svg.clientWidth))));
  };
  const ro = new ResizeObserver(fitText);
  root.tabIndex = 0;
  const bar = H('div', 'ls-bar', root);
  const ctrl = H('div', 'ls-ctrl', root);
  const narr = H('div', 'ls-narr', root);
  const badge = H('span', 'ls-badge', narr);
  const ntext = H('span', '', narr);
  const askEl = H('div', 'ls-ask', root);
  askEl.hidden = true;
  const main = H('div', 'ls-main', root);
  const stage = H('div', 'ls-card ls-stage', main);
  const stageH = H('h4', '', stage);
  const svgBox = H('div', '', stage);
  ro.observe(svgBox);
  const side = H('div', 'ls-side', main);
  const costCard = H('div', 'ls-card', side);
  const costH = H('h4', '', costCard);
  const big = H('div', 'ls-big', costCard);
  const sum = H('div', 'ls-sum', costCard);
  const statsEl = H('div', 'ls-stats', costCard);
  const chartCard = H('div', 'ls-card ls-chart', side);
  const chartH = H('h4', '', chartCard);
  const chartBox = H('div', '', chartCard);
  const nbCard = H('div', 'ls-card', side);
  const nbH = H('h4', '', nbCard);
  const nbBox = H('div', 'ls-nb', nbCard);

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
  const sp = H('label', 'ls-speed', ctrl, 'speed');
  const spIn = H('input', '', sp);
  Object.assign(spIn, { type: 'range', min: '1', max: '5', value: String(speed) });
  spIn.oninput = () => { speed = +spIn.value; if (timer) { stop(); play(); } };
  const posEl = H('span', 'ls-pos', ctrl);
  if (mode === 'predict') {
    const lab = H('label', 'ls-toggle', ctrl);
    const cb = H('input', '', lab);
    cb.type = 'checkbox';
    cb.checked = showCosts;
    lab.append(' show neighbour costs');
    cb.onchange = () => { showCosts = cb.checked; render(); };
  }

  function selector(label: string, k: keyof LocalConfig, options: [string, string][], dflt: string) {
    const l = H('label', '', bar, label);
    const s = H('select', '', l);
    options.forEach(([v, t]) => s.add(new Option(t, v)));
    s.value = String(cfg[k] ?? dflt);
    s.onchange = () => { cfg = { ...cfg, [k]: k === 'algorithm' ? s.value : +s.value }; stop(); rebuild(); };
    return s;
  }
  let selSide: HTMLSelectElement | null = null;
  if (mode === 'explore') {
    if (config.problem === 'queens') selector('Algorithm', 'algorithm', [['steepest', 'Steepest descent'], ['minconflicts', 'Min-conflicts']], 'steepest');
    selSide = selector('Sideways moves', 'maxSideways', ['0', '1', '2', '5', '20', '100'].map(v => [v, v === '0' ? 'none' : `up to ${v}`]), '0');
    selector('Random restarts', 'restarts', ['0', '1', '3', '10'].map(v => [v, v === '0' ? 'none' : v]), '0');
    const shuffle = H('button', 'btn sm', bar);
    shuffle.innerHTML = icon('shuffle') + 'New random start';
    shuffle.onclick = () => {
      const seed = (cfg.seed ?? 1) + 1;
      const r = rng(seed * 31 + 5);
      if (cfg.problem === 'queens') cfg = { ...cfg, seed, start: randomQueens(cfg.n ?? 8, r) };
      else {
        const C = fill(cfg), Hs: Cell[] = [];
        while (Hs.length < C.hospitals.length) {
          const t: Cell = [Math.floor(r() * C.height), Math.floor(r() * C.width)];
          if (!C.houses.some(h => same(h, t)) && !Hs.some(h => same(h, t))) Hs.push(t);
        }
        cfg = { ...cfg, seed, hospitals: Hs };
      }
      stop();
      rebuild();
    };
  } else bar.remove();

  /* ---------- lifecycle ---------- */

  function rebuild() {
    T = buildTrace(cfg);
    if (selSide) selSide.disabled = T.cfg.algorithm === 'minconflicts';
    answered = new Set();
    correct = 0;
    tries = 0;
    doneSent = false;
    reset();
  }
  function reset() { i = 0; fb = null; lastPos = new Map(); render(); emit(); }
  function go(k: number) {
    if (!T) return;
    k = Math.max(0, Math.min(T.steps.length - 1, k));
    if (k === i) return;
    i = k;
    render();
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

  function answer(pick: number) { // eval index of the current step, or -1 = stop
    const q = pendingQ();
    if (!q || !T) return;
    const st = T.steps[i];
    tries++;
    const ok = pick < 0 ? q.stop : q.ok.includes(pick);
    if (ok) {
      if (tries === 1) correct++;
      answered.add(i + 1);
      tries = 0;
      const tie = pick >= 0 && q.ok.length > 1 ? ` (${q.ok.length} moves tie; the trace takes ${st.evals[st.next]?.label ?? 'one of them'}).` : '';
      fb = { cls: 'good', text: 'Correct.' + tie, prev: true };
      go(i + 1);
      return;
    }
    const W = costWord(T.cfg);
    let msg: string;
    if (pick < 0) {
      const b = st.evals.length ? Math.min(...st.evals.map(e => e.cost)) : NaN;
      msg = T.cfg.algorithm === 'minconflicts' ? 'Min-conflicts always moves the chosen queen to its least-conflicted row.'
        : b < st.cost ? `Not stuck yet: some neighbour has ${W} < ${st.cost}.` : `A sideways move is still allowed here (equal ${W}).`;
    } else if (q.stop) msg = `No neighbour is strictly better than the current ${W} = ${st.cost} — hill climbing stops here.`;
    else {
      const e = st.evals[pick];
      msg = T.cfg.algorithm === 'minconflicts'
        ? `Row ${e.target[0]} has ${e.cost} conflict${e.cost === 1 ? '' : 's'}; another row of this column has fewer.`
        : `That move gives ${W} = ${e.cost}; steepest descent takes the BEST of all neighbours, and there is a cheaper one.`;
    }
    fb = { cls: 'bad', text: msg };
    renderAsk();
    shake();
  }
  function reveal() {
    if (!pendingQ()) return;
    answered.add(i + 1);
    tries = 0;
    fb = { cls: '', text: 'Revealed — compare the move with your prediction.', prev: true };
    go(i + 1);
  }

  function renderAsk() {
    if (!T) return;
    const q = pendingQ();
    askEl.innerHTML = '';
    askEl.hidden = mode !== 'predict';
    askEl.classList.toggle('idle', !q);
    if (fb?.prev) H('div', 'fb ' + fb.cls, askEl, (q ? 'Last prediction: ' : '') + fb.text);
    if (q) {
      const queens = T.cfg.problem === 'queens';
      const prompt = T.cfg.algorithm === 'minconflicts'
        ? `Predict: to which row does min-conflicts move the queen of column ${(T.steps[i].pick ?? 0) + 1}? Click the square.`
        : `Predict: which neighbour does steepest descent pick? Click the ${queens ? 'square the queen moves to' : 'cell the hospital moves to'} — or Stop if no move is taken.`;
      H('div', 'prompt', askEl, prompt);
      const row = H('div', 'row', askEl);
      if (T.cfg.algorithm === 'steepest') H('button', 'btn sm', row, 'Stop: no move (stuck / solved)').onclick = () => answer(-1);
      H('button', 'btn sm', row, 'Reveal').onclick = reveal;
      H('span', 'chip', row, `${correct} of ${answered.size} right on the first try`);
    } else if (!fb?.prev) {
      H('div', 'fb', askEl, i >= T.steps.length - 1 ? `Done: ${correct} / ${T.total} predictions right on the first try.` : 'No prediction needed for the next step — press → to continue.');
    }
    if (fb && !fb.prev) H('div', 'fb ' + fb.cls, askEl, fb.text);
  }

  /* ---------- rendering ---------- */

  function render() {
    if (!T) return;
    const st = T.steps[i], C = T.cfg, W = costWord(C);
    const [bl, bc] = KIND[st.kind];
    badge.textContent = bl;
    badge.className = 'ls-badge ' + bc;
    ntext.textContent = st.text;
    posEl.textContent = `${i + 1} / ${T.steps.length}`;
    bBack.disabled = i === 0;
    bStep.disabled = i === T.steps.length - 1;
    renderAsk();
    const q = pendingQ();
    const reveal = mode === 'explore' || showCosts || !q;
    stageH.textContent = C.problem === 'queens' ? `${C.n}-queens · h = attacking pairs` : `Homes & hospitals · ${C.width} × ${C.height}`;
    H('span', '', stageH, !reveal ? 'costs hidden — predict!' : C.algorithm === 'minconflicts' ? 'numbers = conflicts of each square' : 'numbers = cost of each neighbour');
    svgBox.innerHTML = '';
    const svg = C.problem === 'queens' ? drawQueens(C, st, reveal, !!q) : drawHospitals(C, st, reveal, !!q);
    svgBox.appendChild(svg);
    fitText();
    svg.addEventListener('click', e => {
      const t = (e.target as Element).closest('[data-ev]');
      if (t && pendingQ()) answer(+(t.getAttribute('data-ev') ?? -1));
    });
    // side panel
    costH.textContent = W === 'h' ? 'Current h' : 'Current cost';
    H('span', '', costH, `global optimum ${T.optimum}`);
    big.innerHTML = '';
    H('b', '', big, st.cost);
    H('small', '', big, st.kind === 'goal' ? 'solution' : st.kind === 'stuck' ? (st.cost === T.optimum ? 'stuck — but optimal' : 'stuck') : '');
    sum.textContent = C.problem === 'hospitals'
      ? 'distances: ' + C.houses.map(h => dist(h, (st.state as Cell[])[nearest(h, st.state as Cell[])])).join(' + ') + ` = ${st.cost}`
      : 'queens (row per column): ' + fmtState(C, st.state);
    statsEl.innerHTML = '';
    const chip = (l: string, v: number) => H('b', '', H('span', 'chip', statsEl, l + ' '), v);
    chip('iteration', st.stats.iter);
    chip('neighbours evaluated', st.stats.evaluated);
    if (C.maxSideways) chip('sideways', st.stats.sideways);
    if (C.restarts) chip('restarts', st.stats.restarts);
    chartH.textContent = `${W} over iterations`;
    chartBox.innerHTML = '';
    chartBox.appendChild(drawChart(T, st));
    renderNeighbours(C, st, reveal);
  }

  function renderNeighbours(C: Required<LocalConfig>, st: Step, reveal: boolean) {
    nbBox.innerHTML = '';
    nbCard.style.display = C.problem === 'hospitals' && st.evals.length ? '' : 'none';
    if (C.problem !== 'hospitals') return;
    nbH.textContent = 'Neighbours';
    H('span', '', nbH, `${st.evals.length} moves`);
    st.evals.forEach(e => {
      const cls = !reveal ? '' : [e.cost < st.cost ? 'better' : e.cost === st.cost ? 'equal' : '', e.cost === st.best && e.cost <= st.cost ? 'best' : ''].join(' ');
      H('span', cls, nbBox, `${e.label}  ${reveal ? e.cost : '?'}`);
    });
  }

  function candClass(e: Eval, st: Step, reveal: boolean) {
    if (!reveal) return 'hidden';
    return [e.cost < st.cost ? 'better' : e.cost === st.cost ? 'equal' : '', e.cost === st.best && e.cost <= st.cost ? 'best' : ''].join(' ');
  }

  function drawHospitals(C: Required<LocalConfig>, st: Step, reveal: boolean, asking: boolean): SVGSVGElement {
    const cs = 44, pad = 4;
    const svg = S('svg', { viewBox: `0 0 ${C.width * cs + pad + 20} ${C.height * cs + pad + 14}`, role: 'img', 'aria-label': 'Grid with houses and hospitals' });
    const g = S('g', { transform: `translate(${pad} ${pad})` }, svg);
    for (let r = 0; r < C.height; r++) for (let c = 0; c < C.width; c++) S('rect', { class: 'ls-cellbg', x: c * cs, y: r * cs, width: cs, height: cs }, g);
    const Hs = st.state as Cell[];
    const mid = (x: number) => x * cs + cs / 2;
    C.houses.forEach(h => {
      const p = Hs[nearest(h, Hs)];
      S('path', { class: 'ls-route', d: `M${mid(h[1])} ${mid(h[0])}H${mid(p[1])}V${mid(p[0])}` }, g);
    });
    st.evals.forEach((e, k) => {
      const cg = S('g', { class: 'ls-cand ' + candClass(e, st, reveal) + (asking ? ' clickable' : '') + (k === st.next && reveal && !asking ? ' next' : ''), transform: `translate(${e.target[1] * cs} ${e.target[0] * cs})`, 'data-ev': k }, g);
      S('rect', { x: 5, y: 5, width: cs - 10, height: cs - 10, rx: 7 }, cg);
      S('text', { x: cs / 2, y: cs / 2 + 0.5 }, cg).textContent = reveal ? String(e.cost) : '?';
      S('title', {}, cg).textContent = `${e.label}: cost ${reveal ? e.cost : '?'}`;
    });
    C.houses.forEach(h => {
      const hg = S('g', { transform: `translate(${mid(h[1])} ${mid(h[0])})` }, g);
      S('path', { class: 'ls-house', d: 'M-12 -1L0 -12L12 -1H8.5V11H2.5V4H-2.5V11H-8.5V-1Z' }, hg);
      const d = dist(h, Hs[nearest(h, Hs)]);
      S('text', { class: 'ls-dlabel', x: 13, y: -9 }, hg).textContent = String(d);
    });
    Hs.forEach((h, k) => {
      const hg = S('g', { class: 'ls-hosp' }, g);
      place(hg, 'h' + k, mid(h[1]), mid(h[0]));
      S('rect', { x: -14, y: -14, width: 28, height: 28, rx: 7 }, hg);
      S('path', { d: 'M-3 -9H3V-3H9V3H3V9H-3V3H-9V-3H-3Z' }, hg);
      S('text', { x: 15, y: 18 }, hg).textContent = `H${k + 1}`;
    });
    svg.style.maxWidth = `${C.width * 70}px`;
    return svg;
  }

  function drawQueens(C: Required<LocalConfig>, st: Step, reveal: boolean, asking: boolean): SVGSVGElement {
    const n = C.n, cs = 46, left = 22, top = 22;
    const svg = S('svg', { viewBox: `0 0 ${left + n * cs + 4} ${top + n * cs + 4}`, role: 'img', 'aria-label': 'Board: one queen per column' });
    const s = st.state as number[];
    for (let c = 0; c < n; c++) {
      S('text', { class: 'ls-num lbl', x: left + c * cs + cs / 2, y: 11 }, svg).textContent = String(c + 1);
      for (let r = 1; r <= n; r++) S('rect', { class: 'ls-sq ' + ((r + c) % 2 ? 'd' : 'l'), x: left + c * cs, y: top + (r - 1) * cs, width: cs, height: cs }, svg);
    }
    for (let r = 1; r <= n; r++) S('text', { class: 'ls-num lbl', x: left / 2, y: top + (r - 0.5) * cs }, svg).textContent = String(r);
    const cx = (c: number) => left + c * cs + cs / 2, cy = (r: number) => top + (r - 0.5) * cs;
    if (st.pick !== undefined) S('rect', { class: 'ls-colhl', x: left + st.pick * cs + 1, y: top + 1, width: cs - 2, height: n * cs - 2, rx: 4 }, svg);
    qPairs(s).forEach(([a, b]) => S('line', { class: 'ls-att', x1: cx(a), y1: cy(s[a]), x2: cx(b), y2: cy(s[b]) }, svg));
    st.evals.forEach((e, k) => {
      const [r, c] = e.target;
      if (s[c] === r) return;
      const g = S('g', { 'data-ev': k, class: asking ? 'clickable' : '' }, svg);
      S('rect', { x: left + c * cs + 2, y: top + (r - 1) * cs + 2, width: cs - 4, height: cs - 4, fill: 'transparent', rx: 5 }, g);
      const isBest = e.cost === st.best && (C.algorithm === 'minconflicts' || e.cost <= st.cost);
      const isNext = k === st.next && !asking;
      const cmp = isNext ? 'next' : isBest ? (e.cost === st.cost && C.algorithm === 'steepest' ? 'equal' : 'best') : C.algorithm === 'steepest' && e.cost > st.cost ? 'worse' : '';
      if (reveal) S('text', { class: 'ls-num ' + cmp, x: cx(c), y: cy(r) }, g).textContent = String(e.cost);
      if (reveal && (isBest || isNext)) S('rect', { class: 'ls-box ' + cmp, x: left + c * cs + 4, y: top + (r - 1) * cs + 4, width: cs - 8, height: cs - 8 }, g);
      S('title', {}, g).textContent = `${e.label}: ${C.algorithm === 'minconflicts' ? 'conflicts' : 'h'} = ${reveal ? e.cost : '?'}`;
    });
    if (C.algorithm === 'minconflicts' && st.pick !== undefined && st.evals.length) {
      // the queen's own square is also a candidate for min-conflicts
      const r = s[st.pick], e = st.evals[r - 1];
      const g = S('g', { 'data-ev': r - 1, class: asking ? 'clickable' : '' }, svg);
      S('rect', { x: left + st.pick * cs + 2, y: top + (r - 1) * cs + 2, width: cs - 4, height: cs - 4, fill: 'transparent' }, g);
      if (reveal) S('text', { class: 'ls-num', x: cx(st.pick) + 14, y: cy(r) - 14, style: 'font-size:calc(12px * var(--ls-k, 1))' }, g).textContent = String(e.cost);
    }
    s.forEach((r, c) => {
      const g = S('g', { class: 'ls-queen' + (st.kind === 'goal' ? ' ok' : '') }, svg);
      place(g, 'q' + c, cx(c), cy(r) + 1);
      S('path', { d: 'M-13 9h26v4h-26zM-12 7l-3-14 7 7 8-12 8 12 7-7-3 14z' }, g);
    });
    svg.style.maxWidth = `${n * 66 + 30}px`;
    return svg;
  }

  function drawChart(T: LocalTrace, st: Step): SVGSVGElement {
    const pts = T.pts.slice(0, st.nPts);
    const all = T.pts;
    const W = 320, Hh = 130, l = 34, r = 10, t = 10, b = 22;
    const maxX = Math.max(4, all[all.length - 1].x), maxY = Math.max(1, ...all.map(p => p.y)), minY = Math.min(T.optimum, ...all.map(p => p.y));
    const X = (x: number) => l + ((W - l - r) * x) / maxX;
    const Y = (y: number) => t + ((Hh - t - b) * (maxY - y)) / Math.max(1, maxY - Math.min(0, minY));
    const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Cost over iterations' });
    [maxY, Math.round(maxY / 2), Math.min(0, minY)].forEach(y => {
      S('line', { class: 'grid', x1: l, x2: W - r, y1: Y(y), y2: Y(y) }, svg);
      S('text', { x: l - 6, y: Y(y) + 4, 'text-anchor': 'end' }, svg).textContent = String(y);
    });
    if (Number.isFinite(T.optimum)) S('line', { class: 'opt', x1: l, x2: W - r, y1: Y(T.optimum), y2: Y(T.optimum) }, svg);
    S('line', { class: 'ax', x1: l, x2: W - r, y1: Hh - b, y2: Hh - b }, svg);
    S('text', { x: W - r, y: Hh - 6, 'text-anchor': 'end' }, svg).textContent = `iteration ${maxX}`;
    S('text', { x: l, y: Hh - 6 }, svg).textContent = '0';
    pts.forEach(p => { if (p.restart) S('line', { class: 'rs', x1: X(p.x), x2: X(p.x), y1: t, y2: Hh - b }, svg); });
    let d = '';
    pts.forEach((p, k) => (d += (k && !p.restart ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)));
    S('path', { class: 'ln', d }, svg);
    pts.forEach((p, k) => {
      const last = k === pts.length - 1;
      const cls = last ? (st.kind === 'stuck' ? 'pt stuck' : st.kind === 'goal' ? 'pt goal' : 'pt cur') : 'pt';
      S('circle', { class: cls, cx: X(p.x), cy: Y(p.y), r: last ? 4.5 : 2.6 }, svg);
    });
    return svg;
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
