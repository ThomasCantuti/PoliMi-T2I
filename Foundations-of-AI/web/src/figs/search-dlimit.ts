// Depth-limited search (slides p. 152–153): drag the limit L and see the three outcomes, solution / cutoff / failure, on the
// slides' DFS tree (p. 143) and on a loop with and without is_cycle. The course code exactly: LIFO, goal test at pop, then
// `len(node) >= limit → cutoff`, then `not is_cycle(node) → expand` (left child first). Checked against the Playground engine.
import { trace, type GraphSpec } from '../viz/search';
import { bar, card, md, s, slider, style, type FigOptions } from './shell';

const TREE: Record<string, string[]> = { 1: ['2', '3'], 2: ['4', '5'], 3: ['8', '9'], 4: ['6', '7'], 8: ['11', '12'], 11: ['13', '14'] };
const LOOP: Record<string, string[]> = { S: ['A', 'B'], A: ['B', 'S'], B: ['A', 'S'] }; // a triangle, children in alphabetical order
const LMAX = 5, DY = 46, Y0 = 34;

interface N { id: number; state: string; parent: number; depth: number; order: number; st: 'exp' | 'cut' | 'cyc' | 'goal' | 'gen' }
/** DLS as in the course code; returns the generated search tree and the result. */
export function dls(adj: Record<string, string[]>, start: string, goal: string | null, limit: number, cycleCheck: boolean) {
  const nodes: N[] = [{ id: 0, state: start, parent: -1, depth: 0, order: 0, st: 'gen' }], frontier = [0];
  const onPath = (n: N) => { for (let a = n.parent; a >= 0; a = nodes[a].parent) if (nodes[a].state === n.state) return true; return false; };
  let result: 'failure' | 'cutoff' | 'solution' = 'failure', order = 0;
  while (frontier.length) {
    const n = nodes[frontier.pop()!];
    n.order = ++order;
    if (n.state === goal) { n.st = 'goal'; result = 'solution'; break; }
    else if (n.depth >= limit) { n.st = 'cut'; result = 'cutoff'; }
    else if (!(cycleCheck && onPath(n))) {
      n.st = 'exp';
      const kids = (adj[n.state] ?? []).map(st => nodes.push({ id: nodes.length, state: st, parent: n.id, depth: n.depth + 1, order: 0, st: 'gen' }) - 1);
      frontier.push(...kids.reverse());
    } else n.st = 'cyc';
  }
  return { nodes, result };
}
const spec = (adj: Record<string, string[]>, directed: boolean): GraphSpec => ({ directed,
  nodes: Object.fromEntries([...new Set([...Object.keys(adj), ...Object.values(adj).flat()])].map(k => [k, { x: 0, y: 0 }])),
  edges: Object.entries(adj).flatMap(([a, bs]) => bs.filter(b => directed || a < b).map(b => [a, b] as [string, string])) });

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-ufl-css', CSS);
  const c = card(el, 'interactive', 'Depth-limited search: solution, cutoff or failure', '0 0 780 320');
  let L = 2, inst = 0, goalOn = true, cyc = true;

  // cross-check every (instance, L) against the Playground's search engine (viz/search.ts trace())
  for (let l = 0; l <= LMAX; l++) for (const [adj, start, goal, directed] of [[TREE, '1', '12', true], [TREE, '1', null, true], [LOOP, 'S', null, false]] as const) {
    const mine = dls(adj, start, goal, l, true).result, t = trace({ algorithm: 'dls', graph: spec(adj, directed), start, goal: goal ?? '-', limit: l, graphSearch: false });
    if ((t.result.status === 'found' ? 'solution' : t.result.status) !== mine) console.error(`search-dlimit: L = ${l}, start ${start}: ${mine} vs engine ${t.result.status}`);
  }

  const g = s(c.svg, 'g');
  const badge = s(c.svg, 'g', { class: 'ufl-badge' });
  s(badge, 'rect', { x: 596, y: 8, width: 176, height: 30, rx: 15 });
  const badgeT = s(badge, 'text', { x: 684, y: 27.5 });
  const info = s(c.svg, 'text', { x: 598, y: 58, class: 'fg-m' }), info2 = s(c.svg, 'text', { x: 598, y: 74, class: 'fg-m' });

  const ctl = bar(c), knobs = bar(c);
  const sel = document.createElement('select');
  sel.innerHTML = '<option value="0">the slides\' tree (p. 143), goal 12</option><option value="1">a loop: S, A, B all connected, no goal</option>';
  sel.onchange = () => { inst = +sel.value; render(true); };
  const box = (text: string, on: () => boolean, set: (v: boolean) => void) => {
    const l = document.createElement('label');
    l.className = 'ufl-chk';
    l.innerHTML = '<input type="checkbox"><span></span>';
    l.querySelector('span')!.textContent = text;
    const inp = l.querySelector('input')!;
    inp.checked = on();
    inp.onchange = () => { set(inp.checked); render(true); };
    ctl.append(l);
    return l;
  };
  ctl.append(sel);
  const goalBox = box('goal 12 present', () => goalOn, v => { goalOn = v; });
  const cycBox = box('is_cycle check', () => cyc, v => { cyc = v; });
  const lIn = slider(knobs, 'depth limit L', 0, LMAX, 1, L, v => { L = v; render(false); });
  lIn.addEventListener('change', () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`));

  function render(said: boolean) {
    const adj = inst ? LOOP : TREE, start = inst ? 'S' : '1', goal = inst || !goalOn ? null : '12', cc = inst ? cyc : true;
    goalBox.style.display = inst ? 'none' : '';
    cycBox.style.display = inst ? '' : 'none';
    // layout: the tree DLS would generate with the largest limit (no goal), so positions do not jump as L changes
    const ctx = dls(adj, start, null, inst && !cc ? L : LMAX, cc).nodes, run = dls(adj, start, goal, L, cc); // a loop without is_cycle is infinite: draw it down to L
    const kids = (id: number) => ctx.filter(n => n.parent === id).map(n => n.id), key = (n: N, all: N[]): string => (n.parent < 0 ? n.state : key(all[n.parent], all) + '/' + n.state);
    const X: number[] = [];
    let slot = 0;
    const place = (id: number): number => { const ks = kids(id); X[id] = ks.length ? ks.map(place).reduce((a, b) => a + b) / ks.length : slot++; return X[id]; };
    place(0);
    const sx = (v: number) => 24 + (slot > 1 ? (v / (slot - 1)) * 540 : 270), R = Math.min(13, slot > 1 ? 270 / (slot - 1) - 1.5 : 13);
    const byKey = new Map(run.nodes.map(n => [key(n, run.nodes), n]));
    g.replaceChildren();
    s(g, 'line', { x1: 8, x2: 590, y1: Y0 + L * DY + 31, y2: Y0 + L * DY + 31, class: 'ufl-lim' });
    s(g, 'text', { x: 598, y: Y0 + L * DY + 35, class: 'ufl-limt' }, `limit L = ${L}`);
    for (const n of ctx) if (n.parent >= 0) {
      const p = ctx[n.parent], on = byKey.has(key(n, ctx));
      s(g, 'line', { x1: sx(X[p.id]), y1: Y0 + p.depth * DY, x2: sx(X[n.id]), y2: Y0 + n.depth * DY, class: on ? 'fg-e' : 'fg-e ufl-off' });
    }
    for (const n of ctx) {
      const r = byKey.get(key(n, ctx)), x = sx(X[n.id]), y = Y0 + n.depth * DY;
      const gg = s(g, 'g', { class: `ufl-n ${r ? r.st : 'off'}${r && !r.order ? ' wait' : ''}` });
      s(gg, 'circle', { cx: x, cy: y, r: R });
      if (R >= 9) s(gg, 'text', { x, y: y + 4.5 }, n.state);
      if (r?.order && R >= 9) s(g, 'text', { x: x + R + 1, y: y - 10, class: 'ufl-ord' }, String(r.order));
      if (r?.st === 'cyc' && R >= 9) s(g, 'text', { x: x, y: y + 27, class: 'ufl-tag', 'text-anchor': 'middle' }, 'cycle');
      if (r?.st === 'cut' && R >= 9) s(g, 'text', { x: x, y: y + 27, class: 'ufl-tag cut', 'text-anchor': 'middle' }, 'cut');
    }
    c.svg.setAttribute('viewBox', `0 0 780 ${Math.max(150, Y0 + Math.max(L, ...ctx.map(n => n.depth)) * DY + 44)}`);
    const cut = run.nodes.filter(n => n.st === 'cut'), tested = run.nodes.filter(n => n.order).length, deep = Math.max(...ctx.map(n => n.depth));
    const leafCut = cut.length > 0 && cut.every(n => !(adj[n.state] ?? []).length);
    const cutCycle = cut.some(n => key(n, run.nodes).split('/').slice(0, -1).includes(n.state));
    badge.setAttribute('class', `ufl-badge ${run.result}`);
    badgeT.textContent = run.result === 'solution' ? `solution: ${goal} at depth ${run.nodes.find(n => n.st === 'goal')!.depth}` : run.result;
    info.textContent = `${tested} goal tests · ${run.nodes.length - 1} generated`;
    info2.textContent = cut.length ? `${cut.length} cut at depth L` : '';
    const text = run.result === 'solution'
      ? `**Solution.** The goal is at depth 3 ≤ L = ${L}: DLS (depth-first, left child first) finds it at goal test number ${tested}. ` +
        (L === 3 ? 'With `len(node) >= limit` a goal at depth exactly L is still found: the goal test comes before the limit test. ' : '') +
        'For $L < 3$ the answer would be **cutoff**: DLS is complete only if $L \\ge d$.'
      : run.result === 'cutoff'
      ? `**Cutoff: "I don't know".** No goal within depth ${L}, but ${cut.length} node${cut.length > 1 ? 's were' : ' was'} popped at depth L and not expanded (dashed): ` +
        'a solution might lie deeper. ' +
        (inst && !cyc ? 'Without `is_cycle` the loop S → A → S → … never ends, so some branch **always** reaches the limit: the answer is cutoff for every L, never failure. Tick **is_cycle check**. '
          : cutCycle ? `With \`is_cycle\` a branch stops when it returns to a state on its path, but the code tests the limit **before** the cycle, so a cycle node at depth L still counts as cutoff. At L = ${deep + 1} the answer becomes failure. `
          : leafCut ? `Here every node at the limit is a leaf, yet the code still says cutoff: it does not look at the children of a node at depth L. At L = ${deep + 1} nothing reaches the limit and the answer becomes failure. ` : '') +
        'Iterative deepening calls DLS with L = 0, 1, 2, … while the answer is cutoff.'
      : `**Failure: a proof.** No node reached depth L = ${L}: the whole ${cc ? 'cycle-free ' : ''}tree (${run.nodes.length} nodes${inst ? ', cycles cut by `is_cycle`' : ''}) was explored and contains no goal, ` +
        'so there is **no solution at any depth**. Iterative deepening stops here too.';
    c.cap.innerHTML = md(text);
    if (said) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }
  render(false);
  return { destroy() {} };
}

const CSS = `
.ufl-chk{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-2);margin-left:8px;cursor:pointer}
.ufl-chk input{accent-color:var(--accent)}
.ufl-n circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .25s,stroke .25s,opacity .25s}
.ufl-n text{font:600 12px var(--mono);fill:var(--text);text-anchor:middle;pointer-events:none}
.ufl-n.off{opacity:.25}
.ufl-n.wait circle{stroke:var(--warn);stroke-dasharray:3 3}
.ufl-n.exp circle{fill:var(--v-explored);stroke:var(--v-explored)}
.ufl-n.cut circle{fill:var(--warn-soft);stroke:var(--warn);stroke-dasharray:4 3;stroke-width:2.5}
.ufl-n.cyc circle{fill:var(--panel-3);stroke:var(--muted);stroke-dasharray:2 3}
.ufl-n.goal circle{fill:var(--ok);stroke:var(--ok)}
.ufl-n.goal text{fill:#fff}
.ufl-off{opacity:.25}
.ufl-ord{font:600 10.5px var(--mono);fill:var(--accent)}
.ufl-tag{font:600 10px var(--mono);fill:var(--muted)}
.ufl-tag.cut{fill:var(--warn)}
.ufl-lim{stroke:var(--warn);stroke-width:1.5;stroke-dasharray:6 4}
.ufl-limt{font:600 11px var(--mono);fill:var(--warn)}
.ufl-badge rect{fill:var(--panel-3);stroke:var(--border-strong)}
.ufl-badge text{font:700 12px var(--mono);text-anchor:middle;fill:var(--text)}
.ufl-badge.solution rect{fill:var(--ok-soft);stroke:var(--ok)}
.ufl-badge.solution text{fill:var(--ok)}
.ufl-badge.cutoff rect{fill:var(--warn-soft);stroke:var(--warn)}
.ufl-badge.cutoff text{fill:var(--warn)}
.ufl-badge.failure rect{fill:var(--bad-soft);stroke:var(--bad)}
.ufl-badge.failure text{fill:var(--bad)}
`;
