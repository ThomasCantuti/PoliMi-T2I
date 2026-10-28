// Memory race (slides p. 147, 152–162, 172): BFS (early goal test, keeps every generated node), DFS and iterative deepening
// (tree-like, LIFO, left child first, late goal test) on the same uniform tree, one expansion per tick each.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const NAMES = ['Breadth-first', 'Depth-first', 'Iterative deepening'], SHORT = ['BFS', 'DFS', 'IDS'], COLORS = ['var(--warn)', 'var(--v-min)', 'var(--accent)'];
const PW = 244, IY = 30, ICH = 100, PX = 58, PY = 206, PLW = 450, PLH = 116;

interface Algo { status: Uint8Array; frontier: number[]; gen: number; mem: number; maxMem: number; cur: number; done: boolean; L: number; seen: Uint8Array; distinct: number; hist: [number, number][] }

/** The uniform tree: b children per node, depth m; node ids level by level, left to right. */
function tree(b: number, m: number) {
  const OFF = [0];
  for (let l = 1; l <= m + 1; l++) OFF.push(OFF[l - 1] + b ** (l - 1));
  const depth = (n: number) => { let l = 0; while (OFF[l + 1] <= n) l++; return l; };
  const kids = (n: number) => { const l = depth(n), i = n - OFF[l]; return Array.from({ length: b }, (_, j) => OFF[l + 1] + i * b + j); };
  const parent = (n: number) => { const l = depth(n); return OFF[l - 1] + Math.floor((n - OFF[l]) / b); };
  return { OFF, size: OFF[m + 1], depth, kids, parent };
}
type Tree = ReturnType<typeof tree>;

function start(t: Tree): Algo {
  const a: Algo = { status: new Uint8Array(t.size), frontier: [0], gen: 0, mem: 1, maxMem: 1, cur: -1, done: false, L: 0, seen: new Uint8Array(t.size), distinct: 0, hist: [[0, 1]] };
  a.status[0] = 1;
  return a;
}
/** One expansion of algorithm k (0 BFS, 1 DFS, 2 IDS). Status: 1 frontier, 2 expanded, 3 goal. */
function step(k: number, a: Algo, t: Tree, m: number, goal: number) {
  if (a.done) return;
  if (k === 2 && !a.frontier.length) { a.L++; a.status.fill(0); a.frontier = [0]; a.status[0] = 1; } // next iteration: regenerate from the root
  const n = k === 0 ? a.frontier.shift()! : a.frontier.pop()!;
  a.cur = n;
  if (k && n === goal) { a.status[n] = 3; a.done = true; return; } // late goal test (DFS, DLS)
  a.status[n] = 2;
  if (t.depth(n) < (k === 2 ? a.L : m)) {
    const ch = t.kids(n);
    for (const c of ch) {
      a.gen++;
      a.status[c] = 1;
      if (!a.seen[c]) { a.seen[c] = 1; a.distinct++; }
      if (k === 0 && c === goal) { a.status[c] = 3; a.done = true; break; } // early goal test (BFS)
    }
    if (k === 0) a.frontier.push(...ch);
    else a.frontier.push(...ch.reverse()); // the left child ends on top of the stack
  }
  a.mem = k === 0 ? a.gen + 1 : a.frontier.length + t.depth(n) + 1; // BFS keeps every node in `reached`; DFS/IDS keep the stack + the current path
  a.maxMem = Math.max(a.maxMem, a.mem);
  a.hist.push([a.gen, a.mem]);
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-ufm-css', CSS);
  const c = card(el, 'simulation', 'Memory race: BFS, DFS and iterative deepening on the same tree', '0 0 780 346');
  let b = 3, d = 4, where = 'right', running = false, raf = 0, last = 0, speed = 'watch', said = '', ticks = 0;
  let m = d + 1, T = tree(b, m), goal = 0, algos: Algo[] = [], final: Algo[] = [], fin = [0, 0, 0];

  const panels = NAMES.map((name, k) => {
    const x0 = 12 + k * (PW + 12);
    s(c.svg, 'circle', { cx: x0 + 5, cy: 13, r: 5, fill: COLORS[k] });
    s(c.svg, 'text', { x: x0 + 15, y: 18, class: 'fg-h2 ufm-name' }, name);
    const g = s(c.svg, 'g');
    const paths = ['ufm-bg', 'ufm-ex', 'ufm-fr', 'ufm-cur', 'ufm-goal'].map(cl => s(c.svg, 'path', { class: cl }));
    const mark = s(c.svg, 'path', { class: 'ufm-mark' });
    const l1 = s(c.svg, 'text', { x: x0, y: IY + ICH + 18, class: 'fg-t' }), l2 = s(c.svg, 'text', { x: x0, y: IY + ICH + 34, class: 'fg-m' });
    return { x0, g, paths, mark, l1, l2 };
  });

  s(c.svg, 'text', { x: PX - 40, y: PY - 10, class: 'fg-t' }, 'nodes in memory, against nodes generated (time)');
  s(c.svg, 'rect', { x: PX, y: PY, width: PLW, height: PLH, class: 'ufm-box' });
  const yt = [0, 1, 2].map(i => s(c.svg, 'text', { x: PX - 6, class: 'fg-m', 'text-anchor': 'end' }));
  const xt = [0, 1, 2].map(i => s(c.svg, 'text', { x: PX + (i * PLW) / 2, y: PY + PLH + 14, class: 'fg-m', 'text-anchor': 'middle' }));
  const lines = COLORS.map(col => s(c.svg, 'polyline', { class: 'ufm-line', stroke: col }));
  const ends = COLORS.map(col => s(c.svg, 'circle', { r: 4, fill: col, class: 'ufm-end' }));
  const stats = [0, 1, 2, 3, 4].map(i => s(c.svg, 'text', { x: 540, y: PY + 10 + i * 24, class: i < 3 ? 'fg-t' : 'fg-m' }));

  const ctl = bar(c), knobs = bar(c);
  const go = document.createElement('button');
  go.className = 'btn sm primary';
  go.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); restart(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch every expansion</option><option value="fast">5 per frame</option><option value="turbo">40 per frame</option>';
  sp.onchange = () => { speed = sp.value; };
  const gs = document.createElement('select');
  gs.innerHTML = '<option value="left">goal: leftmost at depth d</option><option value="mid">goal: middle of depth d</option><option value="right">goal: rightmost at depth d</option>';
  gs.value = where;
  gs.onchange = () => { where = gs.value; rebuild(); opts.onEvent?.(`[${c.title}] ${gs.selectedOptions[0].text}`); };
  ctl.append(go, reset, sp, gs);
  const dIn = slider(knobs, 'goal depth d', 2, 5, 1, d, v => { d = v; rebuild(); });
  slider(knobs, 'branching b', 2, 4, 1, b, v => {
    b = v;
    const max = b === 2 ? 6 : b === 3 ? 5 : 4; // keeps the tree (depth m = d + 1) below ~1400 nodes
    dIn.max = String(max);
    if (d > max) { d = max; dIn.value = String(max); dIn.dispatchEvent(new Event('input')); return; }
    rebuild();
  });
  const note = document.createElement('span');
  note.className = 'ufm-note';
  knobs.append(note);

  function rebuild() {
    running = false;
    cancelAnimationFrame(raf);
    m = d + 1;
    T = tree(b, m);
    goal = T.OFF[d] + (where === 'left' ? 0 : where === 'mid' ? Math.floor(b ** d / 2) : b ** d - 1);
    final = [0, 1, 2].map(k => { const a = start(T); while (!a.done) step(k, a, T, m, goal); return a; }); // dry run: the extent of the plot
    const nb = Array.from({ length: d }, (_, i) => b ** (i + 1));
    if (where === 'right') {
      const bfs = nb.reduce((x, y) => x + y, 0), ids = nb.reduce((x, y, i) => x + (d - i) * y, 0);
      if (final[0].gen !== bfs || final[2].gen !== ids) console.error(`search-race: BFS ${final[0].gen} vs ${bfs}, IDS ${final[2].gen} vs ${ids}`);
    }
    if (final[1].maxMem > (b - 1) * m + m + 1) console.error(`search-race: DFS memory ${final[1].maxMem} > O(bm) bound`);
    note.textContent = `tree depth m = ${m}: ${T.size.toLocaleString('en-US')} nodes`;
    for (const p of panels) {
      p.mark.setAttribute('d', (() => { const RH = ICH / (m + 1), w = PW / b ** d, x = p.x0 + (goal - T.OFF[d] + 0.5) * w, y = IY + d * RH + RH - 1; return `M${x - 5},${y + 7} L${x + 5},${y + 7} L${x},${y + 1} z`; })());
    }
    restart();
  }
  function restart() { algos = [0, 1, 2].map(() => start(T)); ticks = 0; fin = [0, 0, 0]; said = ''; render(); }
  function tick() { ticks++; algos.forEach((a, k) => { if (!a.done) { step(k, a, T, m, goal); if (a.done) fin[k] = ticks; } }); }
  function play() {
    if (running) return;
    if (algos.every(a => a.done)) restart();
    running = true;
    const frame = (now: number) => {
      if (speed === 'watch') { if (now - last > 100) { last = now; tick(); } }
      else for (let i = speed === 'fast' ? 5 : 40; i > 0 && !algos.every(a => a.done); i--) tick();
      if (algos.every(a => a.done)) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  /** Icicle drawing: each level is a row, each node a cell; consecutive cells with the same status merge into one rectangle. */
  function icicle(p: (typeof panels)[number], a: Algo) {
    const onPath = new Set<number>();
    if (a.cur >= 0 && !a.done) for (let n = a.cur; ; n = T.parent(n)) { onPath.add(n); if (!n) break; }
    const ds = ['', '', '', '', ''], RH = ICH / (m + 1);
    for (let l = 0; l <= m; l++) {
      const w = PW / b ** l, y = IY + l * RH;
      let runStart = 0, runCls = -1;
      const flush = (i: number) => { if (runCls > 0) ds[runCls] += `M${p.x0 + runStart * w},${y}h${(i - runStart) * w}v${RH - 2}h${-(i - runStart) * w}z`; };
      for (let i = 0; i <= b ** l; i++) {
        const n = T.OFF[l] + i, st = i === b ** l ? -2 : a.status[n];
        const cls = st === -2 ? -2 : st === 3 ? 4 : onPath.has(n) ? 3 : st === 1 ? 2 : st === 2 ? 1 : 0;
        if (cls !== runCls) { flush(i); runStart = i; runCls = cls; }
      }
      ds[0] += `M${p.x0},${y}h${PW}v${RH - 2}h${-PW}z`;
    }
    p.paths.forEach((path, i) => path.setAttribute('d', ds[i]));
  }

  function render() {
    const xmax = Math.max(...final.map(a => a.gen)), ymax = Math.max(...final.map(a => a.maxMem));
    const X = (g: number) => PX + (g / xmax) * PLW, Y = (v: number) => PY + PLH - (v / ymax) * PLH;
    algos.forEach((a, k) => {
      const p = panels[k];
      icicle(p, a);
      p.l1.textContent = `generated ${a.gen} · in memory ${a.mem}`;
      p.l2.textContent = k === 2 ? `limit L = ${a.L} · re-generated ${a.gen - a.distinct}${a.distinct ? ` (+${num((100 * (a.gen - a.distinct)) / a.distinct, 2)}%)` : ''}`
        : k === 1 ? `max memory ${a.maxMem} · goes down to m = ${m}` : `max memory ${a.maxMem} (all it generated)`;
      let pts = '';
      const every = Math.max(1, Math.ceil(a.hist.length / 400));
      for (let i = 0; i < a.hist.length; i += every) pts += `${X(a.hist[i][0])},${Y(a.hist[i][1])} `;
      const h = a.hist[a.hist.length - 1];
      lines[k].setAttribute('points', pts + `${X(h[0])},${Y(h[1])}`);
      ends[k].setAttribute('cx', String(X(h[0])));
      ends[k].setAttribute('cy', String(Y(h[1])));
      ends[k].classList.toggle('hide', !a.done);
      stats[k].textContent = a.done ? `${SHORT[k]}: ${a.gen} generated, max ${a.maxMem} stored` : `${SHORT[k]}: searching…`;
      stats[k].setAttribute('fill', COLORS[k]);
    });
    yt.forEach((t, i) => { t.textContent = String(Math.round((i * ymax) / 2)); t.setAttribute('y', String(Y((i * ymax) / 2) + 4)); });
    xt.forEach((t, i) => { t.textContent = String(Math.round((i * xmax) / 2)); });
    const [bf, , id] = algos;
    stats[3].textContent = bf.done && id.done ? `IDS / BFS time: ${id.gen} / ${bf.gen} = ${num(id.gen / bf.gen, 3)}` : '';
    stats[4].textContent = bf.done && id.done ? `the limit for large d: b/(b−1) = ${num(b / (b - 1), 3)}` : '';
    go.textContent = running ? '⏸ Pause' : algos.every(a => a.done) ? '⏵ Run again' : ticks ? '⏵ Continue' : '⏵ Run';
    explain();
  }

  // the caption follows the race: who has finished so far; the summary when all three are done
  function explain() {
    const [bf, df, id] = algos, nb = Array.from({ length: d }, (_, i) => b ** (i + 1));
    const done = algos.map(a => a.done);
    const key = !ticks ? 'idle' : done.map(Number).join('');
    if (key === said) return;
    said = key;
    const gpos = where === 'left' ? 'the leftmost' : where === 'mid' ? 'the middle' : 'the rightmost';
    let text: string;
    if (!ticks) text = `A uniform tree with $b = ${b}$, maximum depth $m = ${m}$ and one goal: ${gpos} node at depth $d = ${d}$ (▲). Each tick, every algorithm ` +
      'expands one node. Orange: frontier; grey: expanded; colour: the current path. **Memory** counts the nodes an algorithm must store: BFS keeps every ' +
      'generated node (its `reached` table), DFS and IDS only their stack plus the current path. Press **Run**.';
    else if (done.every(Boolean)) text = `**All three found the goal.** Time (nodes generated): BFS ${bf.gen}, IDS ${id.gen}, DFS ${df.gen}. ` +
      `Memory (max nodes stored): BFS **${bf.maxMem}**, IDS **${id.maxMem}**, DFS **${df.maxMem}**. ` +
      `IDS paid ${num(id.gen / bf.gen, 3)}× the time of BFS` + (where === 'right' ? ` (the course formula: $${nb.map((v, i) => `${d - i}\\cdot ${v}`).join(' + ')} = ${id.gen}$ against $${nb.join(' + ')} = ${bf.gen}$)` : '') +
      ` for a memory like DFS's: **the best of both**. ` + (df.gen > id.gen ? `DFS was the slowest: it first explored the subtrees on the left all the way down to $m = ${m}$, below the goal's depth.`
        : 'DFS was lucky: the goal lies on its leftmost dive. Move the goal to the right and run again.');
    else {
      const k = [0, 1, 2].filter(i => done[i]).sort((x, y) => fin[y] - fin[x])[0], upTo = nb.slice(0, d - 1).reduce((x, y) => x + y, 0);
      text = k === undefined ? 'BFS fills the tree **level by level** and stores everything; DFS dives to depth $m$ and backtracks, storing one path and its siblings; ' +
        'IDS runs depth-limited searches with $L = 0, 1, 2, \\dots$, **regenerating** the top levels each time. Watch the memory lines.'
        : k === 0 ? `**BFS found the goal** after generating ${bf.gen} nodes: ` + (where === 'right' ? `$${nb.join(' + ')}$, every node down to depth $d$. `
          : `all ${upTo} down to depth $d - 1$, then ${bf.gen - upTo} at depth $d$ until the goal was generated (early goal test). `) +
          `It **keeps all of them**: ${bf.maxMem} nodes in memory, and its memory line climbed with every node it generated.`
        : k === 2 ? `**IDS found the goal** in iteration $L = ${id.L}$ after ${id.gen} nodes, ${id.gen - id.distinct} of them re-generated by the earlier iterations; ` +
          `it never stored more than ${id.maxMem}.`
        : `**DFS found the goal** after ${df.gen} nodes, never storing more than ${df.maxMem}.`;
    }
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  rebuild();
  return { destroy: pause };
}

const CSS = `
.ufm-name{font-size:14px}
.ufm-bg{fill:var(--panel-2);stroke:var(--border);stroke-width:.5}
.ufm-ex{fill:var(--v-explored)}
.ufm-fr{fill:var(--warn)}
.ufm-cur{fill:var(--accent)}
.ufm-goal{fill:var(--ok)}
.ufm-mark{fill:var(--ok)}
.ufm-box{fill:var(--panel-2);stroke:var(--border)}
.ufm-line{fill:none;stroke-width:2.2;stroke-linejoin:round}
.ufm-end{stroke:var(--panel);stroke-width:2}
.ufm-note{font:12px var(--mono);color:var(--muted);margin-left:6px}
`;
