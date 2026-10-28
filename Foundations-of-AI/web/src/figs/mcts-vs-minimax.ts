// MCTS vs minimax at the same node budget (slides p. 405–410, 453): on a random two-move game the minimax tree is uniform up to a
// depth, the MCTS tree (UCB1, AIMA Figure 6.11) grows deep where the playouts win. Simulation.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const D = 10, SIZE = 2 ** (D + 1), ITERS = 500, RY = 24, Y0 = 46, W = 352, LX = [32, 418];
const depth = (i: number) => 31 - Math.clz32(i); // heap ids: root 1, children 2i (move 0) and 2i + 1 (move 1)

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The game: 10 plies, two moves each; every move adds a hidden number in [−1, 1] to the score; MAX wins if the final score is > 0. */
function game(seed: number) {
  const r = mulberry32(seed), score = new Float64Array(SIZE), val = new Int8Array(SIZE);
  for (let i = 2; i < SIZE; i++) score[i] = score[i >> 1] + r() * 2 - 1;
  for (let i = SIZE - 1; i >= 1; i--) val[i] = depth(i) === D ? (score[i] > 0 ? 1 : -1) : depth(i) % 2 ? Math.min(val[2 * i], val[2 * i + 1]) : Math.max(val[2 * i], val[2 * i + 1]);
  return { score, val };
}

/** x of every node of a tree given by `has`: leaves evenly spaced in depth-first order, parents centred over their children. */
function layout(has: (i: number) => boolean, x0: number) {
  const xs = new Map<number, number>(), leaves: number[] = [];
  const walk = (i: number) => {
    const kids = [2 * i, 2 * i + 1].filter(k => k < SIZE && has(k));
    if (!kids.length) { leaves.push(i); return; }
    kids.forEach(walk);
  };
  walk(1);
  leaves.forEach((i, k) => xs.set(i, x0 + ((k + 0.5) / leaves.length) * W));
  const place = (i: number): number => {
    if (xs.has(i)) return xs.get(i)!;
    const kids = [2 * i, 2 * i + 1].filter(k => k < SIZE && has(k)).map(place), x = (kids[0] + kids[kids.length - 1]) / 2;
    xs.set(i, x);
    return x;
  };
  place(1);
  return xs;
}

const dot = (x: number, y: number, r: number) => `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-mcv-css', CSS);
  const c = card(el, 'simulation', 'MCTS vs minimax with the same number of nodes: selective vs uniform', '0 0 780 360');
  let seed = 30, C = Math.SQRT2, g = game(seed), running = false, raf = 0, fast = false, said = '', reachedAt: number[] = [];
  const U = new Float64Array(SIZE), N = new Float64Array(SIZE), has = new Uint8Array(SIZE);
  let count = 1, it = 0, lastPath: number[] = [], added = 0;

  for (let d = 0; d <= D; d++) s(c.svg, 'text', { x: 18, y: Y0 + d * RY + 4, class: 'fg-m', 'text-anchor': 'end' }, String(d));
  s(c.svg, 'text', { x: 6, y: Y0 - 24, class: 'fg-m' }, 'ply');
  const panels = LX.map((x, j) => {
    s(c.svg, 'text', { x: x + W / 2, y: 16, class: 'fg-h2', 'text-anchor': 'middle' }, j ? 'MCTS (UCB1, random playouts)' : 'Minimax (iterative deepening + e(s))');
    s(c.svg, 'rect', { x: x - 6, y: Y0 - 14, width: W + 12, height: D * RY + 28, rx: 8, class: 'mcv-box' });
    return {
      edges: s(c.svg, 'path', { class: 'mcv-e' }), pvE: s(c.svg, 'path', { class: 'mcv-pv' }), cur: s(c.svg, 'path', { class: 'mcv-cur' }),
      play: s(c.svg, 'line', { class: 'mcv-play' }), nodes: s(c.svg, 'path', { class: 'mcv-n' }), fresh: s(c.svg, 'path', { class: 'mcv-new' }),
      t: [0, 1].map(k => s(c.svg, 'text', { x: x + W / 2, y: Y0 + D * RY + 34 + k * 17, class: k ? 'fg-m' : 'fg-t', 'text-anchor': 'middle' })),
    };
  });

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); clear(); render(); };
  const other = document.createElement('button');
  other.className = 'btn sm';
  other.textContent = 'Another game';
  other.onclick = () => { pause(); seed++; g = game(seed); clear(); render(); opts.onEvent?.(`[${c.title}] new game (seed ${seed})`); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="0">1 iteration per frame</option><option value="1">10 iterations per frame</option>';
  sp.onchange = () => { fast = sp.value === '1'; };
  ctl.append(run, reset, other, sp);
  const cIn = slider(ctl, 'C', 0, 3, 0.05, +C.toFixed(2), v => { C = v; pause(); clear(); render(); });
  cIn.addEventListener('change', () => opts.onEvent?.(`[${c.title}] C = ${C}: MCTS restarted`));

  function clear() { U.fill(0); N.fill(0); has.fill(0); has[1] = 1; count = 1; it = 0; lastPath = []; added = 0; said = ''; reachedAt = []; }
  /** One iteration: selection by UCB1, expansion of one child, a random playout, backpropagation (wins of the player who moved in). */
  function iterate() {
    let n = 1;
    const path = [1];
    while (depth(n) < D && has[2 * n] && has[2 * n + 1]) {
      const ucb = (k: number) => U[k] / N[k] + C * Math.sqrt(Math.log(N[n]) / N[k]);
      n = ucb(2 * n + 1) > ucb(2 * n) ? 2 * n + 1 : 2 * n;
      path.push(n);
    }
    added = 0;
    if (depth(n) < D) {
      const free = [2 * n, 2 * n + 1].filter(k => !has[k]);
      n = free[Math.floor(Math.random() * free.length)];
      has[n] = 1;
      count++;
      added = n;
      path.push(n);
    }
    let x = n;
    while (depth(x) < D) x = 2 * x + (Math.random() < 0.5 ? 1 : 0);
    const maxWins = g.score[x] > 0;
    for (const p of path) { N[p]++; if (p > 1 && (depth(p) % 2 === 1) === maxWins) U[p]++; }
    lastPath = path;
    it++;
    const d = Math.max(...path.map(depth));
    if (!reachedAt[d]) reachedAt[d] = count;
  }
  function play() {
    if (it >= ITERS) clear();
    running = true;
    opts.onEvent?.(`[${c.title}] run MCTS (C = ${num(C, 3)}), seed ${seed}`);
    const frame = () => {
      for (let r = fast ? 10 : 1; r > 0 && it < ITERS; r--) iterate();
      if (it >= ITERS) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  // minimax with the same budget: the first `count` nodes in breadth-first order; it decides with the deepest complete level
  const full = () => Math.floor(Math.log2(count + 1)) - 1;
  function minimaxMove() {
    const d = full(), v = (i: number): number => (depth(i) === d ? g.score[i] : depth(i) % 2 ? Math.min(v(2 * i), v(2 * i + 1)) : Math.max(v(2 * i), v(2 * i + 1)));
    if (d === 0) return { move: -1, pv: [1] };
    const pv = [1];
    while (depth(pv[pv.length - 1]) < d) { const i = pv[pv.length - 1], a = v(2 * i), b = v(2 * i + 1); pv.push((depth(i) % 2 ? b < a : b > a) ? 2 * i + 1 : 2 * i); }
    return { move: pv[1] & 1, pv };
  }
  const mctsPV = () => { const pv = [1]; for (let i = 1; has[2 * i] || has[2 * i + 1];) { i = N[2 * i + 1] > N[2 * i] ? 2 * i + 1 : 2 * i; pv.push(i); } return pv; };
  const truth = () => (g.val[2] === g.val[3] ? -1 : g.val[3] > g.val[2] ? 1 : 0);
  const name = (m: number) => (m < 0 ? '–' : m ? 'right' : 'left');

  function draw(j: number, inTree: (i: number) => boolean, pv: number[], cur: number[], fresh: number) {
    const P = panels[j], xs = layout(inTree, LX[j]), y = (i: number) => Y0 + depth(i) * RY;
    let e = '', n = '';
    for (const [i, x] of xs) { n += dot(x, y(i), 2.6); if (i > 1) e += `M${xs.get(i >> 1)},${y(i >> 1)}L${x},${y(i)}`; }
    const line = (ids: number[]) => ids.slice(1).map(i => `M${xs.get(i >> 1)},${y(i >> 1)}L${xs.get(i)},${y(i)}`).join('');
    P.edges.setAttribute('d', e);
    P.nodes.setAttribute('d', n);
    P.pvE.setAttribute('d', line(pv));
    P.cur.setAttribute('d', line(cur));
    P.fresh.setAttribute('d', fresh ? dot(xs.get(fresh)!, y(fresh), 4.5) : '');
    P.play.classList.toggle('hide', !fresh);
    if (fresh) { const x = xs.get(fresh)!; for (const [k, v] of [['x1', x], ['x2', x], ['y1', y(fresh) + 5], ['y2', Y0 + D * RY]] as const) P.play.setAttribute(k, String(v)); }
    return xs;
  }

  function render() {
    const mm = minimaxMove(), pv = mctsPV(), t = truth(), d = full();
    draw(0, i => i <= count, mm.pv, [], 0);
    draw(1, i => has[i] === 1, pv, running && !fast ? lastPath : [], running && !fast ? added : 0);
    let deepest = 0;
    for (let i = 1; i < SIZE; i++) if (has[i]) deepest = Math.max(deepest, depth(i));
    const ok = (m: number) => (m < 0 || t < 0 ? '' : m === t ? ' ✓' : ' ✗');
    panels[0].t[0].textContent = `${count} nodes · complete to ply ${d} · plays ${name(mm.move)}${ok(mm.move)}`;
    panels[0].t[1].textContent = `cut-off at ply ${d}: e(s) = the score so far`;
    const mv = it ? (N[3] > N[2] ? 1 : 0) : -1;
    panels[1].t[0].textContent = `${count} nodes · deepest ply ${deepest} · plays ${name(mv)}${ok(mv)}`;
    panels[1].t[1].textContent = it ? `root visits: left ${N[2]}, right ${N[3]} (most visits wins)` : 'one node added per iteration';
    run.textContent = running ? '⏸ Pause' : it >= ITERS ? '⏵ Run again' : it ? '⏵ Continue' : '⏵ Run MCTS';
    explain(deepest, mm.move, mv, t);
  }

  function explain(deepest: number, mmMove: number, mv: number, t: number) {
    const best = t < 0 ? 'both moves have the same value' : `the true best move (full minimax) is **${name(t)}**`;
    const firstDeep = reachedAt[D];
    const [key, text] = !it
      ? ['idle', '**A random game with two moves per turn** (as in the slides\' MCTS example): 10 plies, every move adds a hidden number in $[-1, 1]$ to a score, and MAX wins if the final score is positive. ' +
        `Both searches get the **same number of nodes**: minimax fills the tree level by level and evaluates the cut-off with $e(s)$ = score so far; MCTS adds one node per iteration where UCB1 leads it. Press **Run**; ${best}.`]
      : count < 8
      ? ['start', '**First iterations:** a node is expanded only after **both** its children exist, so MCTS starts breadth-first: the root\'s two moves, then their replies. Thin orange segment = this iteration\'s selection, dashed = its random playout.']
      : !firstDeep
      ? [`grow${deepest}`, `**MCTS reached ply ${deepest} with ${reachedAt[deepest]} nodes;** minimax with as many nodes is complete only to ply ${Math.floor(Math.log2(reachedAt[deepest] + 1)) - 1}. ` +
        'The playouts win more often below some moves, UCB1 sends the next iterations there, and the tree grows **deep and narrow** on those lines. The bold line is the most-visited path.']
      : it < ITERS
      ? ['deep', `**MCTS reached the end of the game (ply ${D}) with only ${firstDeep} nodes**, along its most promising line; a uniform tree would need ${(2 ** (D + 1) - 1).toLocaleString('en-US')} nodes to reach it everywhere. ` +
        'Other branches stay shallow: they get just enough playouts to keep their UCB1 bound below the best one.']
      : [`done${seed}${C}`, `**${count} nodes each.** Minimax: complete to ply ${full()}, plays **${name(mmMove)}**; MCTS: deepest ply ${deepest}, plays **${name(mv)}** (${N[2]} vs ${N[3]} visits); ${best}. ` +
        `Same budget, different shape: minimax spends it **uniformly** and needs $e(s)$ at the cut-off, MCTS spends it **selectively** and needs only playouts. ` +
        `${mmMove === t && mv === t ? 'Here both find the best move.' : mmMove !== t && mv === t ? 'Here $e(s)$ misleads minimax, while the playouts lead MCTS to the right move.' : mv !== t ? 'Here MCTS is wrong: few iterations, or a misleading playout signal.' : ''} Try **Another game** or change $C$ (0 = pure exploitation).`];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle' && key !== 'start') opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  clear();
  render();
  return { destroy: pause };
}

const CSS = `
.mcv-box{fill:var(--panel-2);stroke:var(--border)}
.mcv-e{fill:none;stroke:var(--v-edge);stroke-width:1}
.mcv-n{fill:var(--v-node-stroke)}
.mcv-pv{fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round}
.mcv-cur{fill:none;stroke:var(--warn);stroke-width:1.5}
.mcv-new{fill:var(--warn)}
.mcv-play{stroke:var(--warn);stroke-width:1.5;stroke-dasharray:3 3}
`;
