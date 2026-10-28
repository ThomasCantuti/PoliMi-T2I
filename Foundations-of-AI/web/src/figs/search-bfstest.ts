// BFS worked example (slides p. 122–131): the goal test at selection (course breadth_first_search) and at generation
// (breadth_first_search_early_goal_test) side by side on the binary tree with goal 7. Stepper, one pop per frame on each side.
// `twoTests` is shared with search-ucstest.ts (the same comparison for uniform-cost search).
import { trace } from '../viz/search';
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

export interface Spec {
  title: string; nodes: Record<string, [number, number]>; edges: [string, string, number?][]; start: string; goal: string;
  pq: boolean; // false: FIFO queue (BFS, reached = set); true: priority queue on g (UCS, reached = best g, re-add if cheaper)
  names?: Record<string, string>; caption: (side: Side[], i: number, last: boolean) => string; check?: (late: Side[], early: Side[]) => void;
}
export interface Side { pop: string | null; gen: string[]; found: string | null; foundG: number; path: string[]; frontier: [string, number][]; tests: number; exp: number;
  generated: number; status: Record<string, string>; g: Record<string, number>; done: boolean; updated: string | null; oldG: number }
interface F extends Frame { sides: Side[] }

/** Runs the course code with the goal test late (k = 0) or early (k = 1); one snapshot after every pop. */
function run(sp: Spec, early: boolean): Side[] {
  const adj: Record<string, [string, number][]> = {};
  for (const [a, b, c = 1] of sp.edges) (adj[a] ??= []).push([b, c]);
  let fr: [string, number, number, string[]][] = [[sp.start, 0, 0, [sp.start]]], seq = 1, tests = 0, exp = 0, generated = 0;
  const reached: Record<string, number> = { [sp.start]: 0 }, status: Record<string, string> = { [sp.start]: 'fr' };
  const snap = (pop: string | null, gen: string[], found: string | null, foundG: number, path: string[] = [], updated: string | null = null, oldG = 0): Side => ({ pop, gen, found, foundG, path, updated, oldG,
    frontier: [...fr].sort((a, b) => (sp.pq ? a[1] - b[1] : 0) || a[2] - b[2]).map(([x, g]) => [x, g] as [string, number]),
    tests, exp, generated, status: { ...status }, g: { ...reached }, done: found !== null });
  if (early) tests++; // the initial state is tested before the loop
  const out = [snap(null, [], null, 0)];
  while (fr.length) {
    if (sp.pq) fr.sort((a, b) => a[1] - b[1] || a[2] - b[2]); // ties: first in, first out
    const [n, g, , path] = fr.shift()!;
    for (const k in status) if (status[k] === 'cur') status[k] = 'ex';
    if (!early) { tests++; if (n === sp.goal) { status[n] = 'goal'; out.push(snap(n, [], n, g, path)); return out; } }
    status[n] = 'cur';
    exp++;
    const gen: string[] = [];
    let updated: string | null = null, oldG = 0;
    for (const [c, w] of adj[n] ?? []) {
      generated++;
      gen.push(c);
      if (early) { tests++; if (c === sp.goal) { status[c] = 'goal'; out.push(snap(n, gen, c, g + w, [...path, c])); return out; } }
      if (!(c in reached) || (sp.pq && g + w < reached[c])) {
        if (c in reached) { updated = c; oldG = reached[c]; }
        reached[c] = g + w;
        fr.push([c, g + w, seq++, [...path, c]]);
        status[c] = 'fr';
      }
    }
    out.push(snap(n, gen, null, 0, [], updated, oldG));
  }
  return out;
}

export function twoTests(el: HTMLElement, opts: FigOptions, sp: Spec) {
  style('fig-ufb-css', CSS);
  const c = card(el, 'stepper', sp.title, '0 0 780 300');
  const runs = [run(sp, false), run(sp, true)], n = Math.max(runs[0].length, runs[1].length);
  sp.check?.(runs[0], runs[1]);
  const frames: F[] = Array.from({ length: n }, (_, i) => ({ sides: runs.map(r => r[Math.min(i, r.length - 1)]), cap: '', group: i ? 'pops' : 'start' }));
  frames.forEach((f, i) => { f.cap = sp.caption(f.sides, i, i === n - 1); });
  const nm = (x: string) => sp.names?.[x] ?? x;
  const ui = ['Goal test at selection (late)', 'Goal test at generation (early)'].map((title, k) => {
    const x0 = 10 + k * 390, g = s(c.svg, 'g');
    s(c.svg, 'text', { x: x0, y: 20, class: 'fg-h2 ufb-h' }, title);
    const P = (id: string): [number, number] => [x0 + 10 + sp.nodes[id][0] * 3.5, 40 + sp.nodes[id][1] * 1.45];
    for (const [a, b, w] of sp.edges) {
      const [x1, y1] = P(a), [x2, y2] = P(b);
      s(g, 'line', { x1, y1, x2, y2, class: 'fg-e' });
      if (sp.pq) s(g, 'text', { x: (x1 + x2) / 2 + (y1 === y2 ? 0 : 9), y: (y1 + y2) / 2 + (y1 === y2 ? -5 : 4), class: 'ufb-w' }, String(w));
    }
    const nodes = Object.fromEntries(Object.keys(sp.nodes).map(id => {
      const [x, y] = P(id), gg = s(g, 'g', { class: 'ufb-n' });
      s(gg, 'circle', { cx: x, cy: y, r: sp.pq ? 15 : 13 });
      s(gg, 'text', { x, y: y + 4.5 }, nm(id).slice(0, sp.pq ? 3 : 2));
      return [id, { gg, gl: sp.pq ? s(g, 'text', { x, y: y + 28, class: 'ufb-g' }) : null }];
    }));
    return { nodes, fr: s(c.svg, 'text', { x: x0, y: 246, class: 'ufb-fr' }), cnt: s(c.svg, 'text', { x: x0, y: 266, class: 'fg-m' }),
      res: s(c.svg, 'text', { x: x0, y: 290, class: 'ufb-res' }) };
  });
  return stepper(c, frames, f => f.sides.forEach((sd, k) => {
    const u = ui[k];
    for (const id in u.nodes) {
      u.nodes[id].gg.setAttribute('class', `ufb-n ${sd.status[id] ?? ''}${sd.gen.includes(id) && sd.status[id] !== 'goal' ? ' new' : ''}`);
      const gl = u.nodes[id].gl;
      if (gl) gl.textContent = id in sd.g ? `g=${sd.g[id]}` : '';
    }
    u.fr.textContent = `frontier ⟨${sd.frontier.map(([x, g]) => (sp.pq ? `${nm(x).slice(0, 3)} ${g}` : nm(x))).join(', ')}⟩`;
    u.cnt.textContent = `expanded ${sd.exp} · generated ${sd.generated} · goal tests ${sd.tests}`;
    u.res.textContent = sd.done ? `returns ${sd.path.map(x => nm(x).slice(0, sp.pq ? 3 : 2)).join(' → ')}${sp.pq ? `, cost ${sd.foundG}` : ''}` : '';
  }), opts);
}

const TREE: Record<string, [number, number]> = {};
for (let k = 1; k <= 15; k++) { const d = Math.floor(Math.log2(k)), slot = k - 2 ** d; TREE[k] = [((slot + 0.5) * 100) / 2 ** d, d * 36]; }

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  const edges: [string, string][] = [];
  for (let k = 2; k <= 15; k++) edges.push([String(k >> 1), String(k)]);
  return twoTests(el, opts, {
    title: 'BFS: goal test at selection vs at generation (goal 7)', nodes: TREE, edges, start: '1', goal: '7', pq: false,
    check: (late, early) => { // uninformed.md: 12 vs 6 generated; and the Playground engine agrees
      const L = late[late.length - 1], E = early[early.length - 1], spec = { directed: true, nodes: Object.fromEntries(Object.keys(TREE).map(k => [k, { x: 0, y: 0 }])), edges };
      const tl = trace({ algorithm: 'bfs', graph: spec, start: '1', goal: '7' }), te = trace({ algorithm: 'bfs_early', graph: spec, start: '1', goal: '7' });
      if (L.generated !== 12 || E.generated !== 6 || tl.nodes.length - 1 !== L.generated || te.nodes.length - 1 !== E.generated)
        console.error(`search-bfstest: generated ${L.generated}/${E.generated}, engine ${tl.nodes.length - 1}/${te.nodes.length - 1}, expected 12/6`);
    },
    caption: (sd, i, last) => {
      const [a, b] = sd, fr = (x: Side) => `⟨${x.frontier.map(f => f[0]).join(', ')}⟩`;
      if (!i) return '**Start.** Same tree, same FIFO queue, goal **7**. Left: the course `breadth_first_search` tests a node when it is **popped**. ' +
        'Right: `breadth_first_search_early_goal_test` tests the root first, then every child as soon as it is **generated**.';
      const left = a.found ? `Left pops **7**: the goal, recognized only now. ` : `Left pops ${a.pop}, not the goal, generates ${a.gen.join(', ')}: frontier ${fr(a)}. `;
      const right = b.found && b.pop === a.pop ? `Right expands ${b.pop} and tests its children: **${b.found} is the goal**, returned at once. `
        : b.done ? '' : `Right pops ${b.pop}, tests ${b.gen.join(' and ')} (no): frontier ${fr(b)}. `;
      return left + right + (last ? `**Totals:** late test ${a.exp} expansions, ${a.generated} generated (8–13 were generated only because 7 was not recognized at once); ` +
        `early test ${b.exp} expansions, ${b.generated} generated. Worst case: $O(b^{d+1})$ vs $O(b^d)$.` : '');
    },
  });
}

const CSS = `
.ufb-h{font-size:14px}
.ufb-n circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .3s,stroke .3s}
.ufb-n text{font:600 11.5px var(--mono);fill:var(--text);text-anchor:middle;pointer-events:none}
.ufb-n.fr circle{fill:var(--warn-soft);stroke:var(--warn)}
.ufb-n.new circle{stroke-width:3.5}
.ufb-n.ex circle{fill:var(--v-explored);stroke:var(--v-explored)}
.ufb-n.cur circle{fill:var(--accent);stroke:var(--accent)}
.ufb-n.cur text,.ufb-n.goal text{fill:#fff}
.ufb-n.goal circle{fill:var(--ok);stroke:var(--ok)}
.ufb-w{font:11px var(--mono);fill:var(--muted);text-anchor:middle}
.ufb-g{font:600 10.5px var(--mono);fill:var(--warn);text-anchor:middle}
.ufb-fr{font:12px var(--mono);fill:var(--text-2)}
.ufb-res{font:700 13px var(--mono);fill:var(--ok)}
`;
