// f(n) decides everything (slides p. 175–180, 186, 198–202): uniform-cost, greedy best-first and A* race on the same grid.
// Simulation; every expansion comes from the Playground engine (viz/search.ts trace(): the course best_first_search, FIFO ties).
import { trace } from '../viz/search';
import { bar, card, md, s, style, type FigOptions } from './shell';

const MAPS: [string, string[]][] = [
  ["the slides' navigation grid (p. 198)", ['...........', '.#...#####.', '.##...G..#.', 'S.########.', '...........']],
  ['two walls', ['.....................', '.......#.............', '.......#.............', '.......#....#####....',
    '.......#........#....', '.......#........#....', '.S.....#........#..G.', '.......#........#....', '.......#........#....',
    '...........######....', '.....................', '.....................', '.....................']],
  ['open field', ['.....................', '.....................', '.....................', '.....................', '.....................',
    '.....................', '.S.................G.', '.....................', '.....................', '.....................',
    '.....................', '.....................', '.....................']],
];
const ALGOS = [['ucs', 'Uniform-cost', 'f = g'], ['greedy', 'Greedy best-first', 'f = h'], ['astar', 'A*', 'f = g + h']] as const;
const PW = 244, X0 = 10, DX = 258, TOP = 40, GH = 170, SPEEDS: Record<string, number> = { slow: 0.25, normal: 1, fast: 4 };

interface Run { cur: (string | null)[]; front: Set<string>[]; exp: Map<string, number>; nExp: number[]; path: string[] | null; cost: number | null; opt: number | null }

function race(grid: string[]): Run[] {
  return ALGOS.map(([algorithm]) => {
    const t = trace({ algorithm, grid }), exp = new Map<string, number>();
    let n = 0;
    const nExp = t.steps.map(p => (n += +(p.kind === 'expand')));
    t.steps.forEach((p, k) => { if (p.cur != null && !exp.has(t.nodes[p.cur].state)) exp.set(t.nodes[p.cur].state, k); });
    if (t.result.status === 'stopped') console.error('search-race: trace cut at the engine step limit');
    return { cur: t.steps.map(p => (p.cur == null ? null : t.nodes[p.cur].state)), front: t.steps.map(p => new Set(p.frontier.map(i => t.nodes[i].state))),
      exp, nExp, path: t.result.path, cost: t.result.cost, opt: t.optimal?.cost ?? null };
  });
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-if-race-css', CSS);
  const c = card(el, 'simulation', 'Same loop, three evaluation functions: what each one expands', '0 0 780 268');
  let grid = MAPS[0][1].slice(), runs = race(grid), t = 0, acc = 0, speed = 'normal', running = false, raf = 0, said = '';
  let cells: Map<string, SVGRectElement>[] = [], paths: SVGPolylineElement[] = [], stats: SVGTextElement[][] = [];
  const layer = s(c.svg, 'g');

  function build() {
    layer.replaceChildren();
    const H = grid.length, W = grid[0].length, C = Math.min(Math.floor(PW / W), Math.floor(GH / H)), y0 = TOP + (GH - H * C) / 2;
    cells = []; paths = []; stats = [];
    ALGOS.forEach(([, name, f], i) => {
      const x0 = X0 + i * DX + (PW - W * C) / 2, m = new Map<string, SVGRectElement>();
      s(layer, 'text', { x: X0 + i * DX, y: 18, class: 'fg-h2' }, name);
      s(layer, 'text', { x: X0 + i * DX + PW, y: 18, class: 'ifr-f', 'text-anchor': 'end' }, f);
      grid.forEach((row, r) => [...row].forEach((ch, k) => {
        const rect = s(layer, 'rect', { x: x0 + k * C, y: y0 + r * C, width: C, height: C, class: ch === '#' ? 'ifr-w' : 'ifr-c' });
        rect.onclick = () => toggle(r, k);
        m.set(`${r},${k}`, rect);
        if (ch === 'S' || ch === 'G') s(layer, 'text', { x: x0 + k * C + C / 2, y: y0 + r * C + C / 2 + Math.min(C, 18) * 0.33, class: 'ifr-sg', 'font-size': Math.min(C, 18) }, ch);
      }));
      cells.push(m);
      paths.push(s(layer, 'polyline', { class: 'ifr-path' }));
      paths[i].dataset.x0 = String(x0);
      stats.push([0, 1].map(j => s(layer, 'text', { x: X0 + i * DX, y: TOP + GH + 22 + j * 20, class: j ? 'fg-t' : 'ifr-n' })));
    });
    paths.forEach(p => { p.dataset.y0 = String(y0); p.dataset.c = String(C); });
  }
  function toggle(r: number, k: number) {
    if ('SG'.includes(grid[r][k])) return;
    grid[r] = grid[r].slice(0, k) + (grid[r][k] === '#' ? '.' : '#') + grid[r].slice(k + 1);
    pause(); runs = race(grid); t = 0; build(); render();
    opts.onEvent?.(`[${c.title}] wall toggled at (${r},${k})`);
  }

  const last = () => Math.max(...runs.map(r => r.cur.length - 1));
  function play() {
    if (running) return;
    if (t >= last()) t = 0;
    running = true;
    const frame = () => {
      acc += SPEEDS[speed];
      while (acc >= 1) { acc--; t++; }
      if (t >= last()) { t = last(); running = false; }
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); t = 0; render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="slow">slow</option><option value="normal" selected>1 expansion per frame</option><option value="fast">4 per frame</option>';
  sp.onchange = () => { speed = sp.value; };
  const mp = document.createElement('select');
  mp.innerHTML = MAPS.map(([name], k) => `<option value="${k}">${name}</option>`).join('');
  mp.onchange = () => { grid = MAPS[+mp.value][1].slice(); pause(); runs = race(grid); t = 0; build(); render(); opts.onEvent?.(`[${c.title}] map: ${MAPS[+mp.value][0]}`); };
  const hint = document.createElement('span');
  hint.className = 'fg-sl';
  hint.textContent = 'click a cell: wall on/off';
  ctl.append(run, reset, sp, mp, hint);

  function render() {
    runs.forEach((R, i) => {
      const k = Math.min(t, R.cur.length - 1), done = k === R.cur.length - 1;
      for (const [id, rect] of cells[i]) {
        if (rect.classList.contains('ifr-w')) continue;
        const e = R.exp.get(id);
        rect.setAttribute('class', 'ifr-c' + (R.cur[k] === id ? ' cur' : e !== undefined && e <= k ? ' ex' : R.front[k].has(id) ? ' fr' : ''));
      }
      const C = +paths[i].dataset.c!, x0 = +paths[i].dataset.x0!, y0 = +paths[i].dataset.y0!;
      paths[i].setAttribute('points', done && R.path ? R.path.map(id => { const [r, q] = id.split(',').map(Number); return `${x0 + q * C + C / 2},${y0 + r * C + C / 2}`; }).join(' ') : '');
      stats[i][0].textContent = `${R.nExp[k]} expanded · frontier ${R.front[k].size}`;
      stats[i][1].textContent = !done ? 'searching…' : R.cost == null ? 'failure: G unreachable' :
        `path cost ${R.cost}${R.cost === R.opt ? ' (optimal)' : ` (optimal is ${R.opt})`}`;
    });
    run.textContent = running ? '⏸ Pause' : t ? (t >= last() ? '⏵ Replay' : '⏵ Continue') : '⏵ Run';
    explain();
  }

  // the caption follows the stage of the race; it changes only when the stage changes
  function explain() {
    const done = runs.map(R => t >= R.cur.length - 1), [u, g, a] = runs, E = runs.map(R => R.nExp[R.nExp.length - 1]);
    const [key, text] = u.cost == null
      ? ['none', '**G is unreachable.** All three explore every reachable cell and report failure. Click a wall to open a way.']
      : !t
      ? ['idle', 'The same `best_first_search` three times; only $f(n)$, the key of the priority queue, changes. Expanded cells are light blue, the frontier is ' +
        'yellow, the node being expanded now is dark blue, walls are grey. Press **Run**: one expansion per algorithm per tick.']
      : !done.some(Boolean)
      ? ['run', '**Uniform-cost** ($f = g$) only looks back: it grows evenly in every direction, ring after ring of equal $g$. **Greedy** ($f = h$) only ' +
        'looks ahead: it runs straight at G. **A*** ($f = g + h$) looks both ways: it leans towards G but pays attention to what the path has cost so far.']
      : !done.every(Boolean)
      ? [`part${done.join()}`, (done[1] ? `**Greedy reached G after ${E[1]} expansions** with a path of cost ${g.cost}${g.cost === g.opt ? '' : ` (the optimum is ${g.opt})`}. ` : '') +
        (done[2] ? `**A* reached G after ${E[2]} expansions**, cost ${a.cost}. ` : '') + 'The goal test happens when G is **selected**, not when it is generated.']
      : ['end', `**Expanded:** uniform-cost ${E[0]}, greedy ${E[1]}, A* ${E[2]}. **Path cost:** ${u.cost}, ${g.cost}, ${a.cost}. ` +
        (g.cost! > g.opt! ? `Greedy paid ${g.cost! - g.opt!} more than the optimum: following $h$ alone, it committed to a route that looked short and turned out long. ` :
          'Here greedy also found an optimal path, but only because nothing lures it away: it ignores $g$, so nothing guarantees it. ') +
        (E[2] < E[0] ? `A* returned the same optimal cost as uniform-cost search with ${E[0] - E[2]} fewer expansions: $h$ kept it out of the regions that lead away from G.` :
          'A* returned the optimal cost too.')];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  build();
  render();
  return { destroy: pause };
}

const CSS = `
.ifr-f{font:600 12px var(--mono);fill:var(--accent)}
.ifr-c{fill:var(--panel-2);stroke:var(--border);stroke-width:.6;cursor:pointer;transition:fill .15s}
.ifr-c.ex{fill:color-mix(in srgb,var(--accent) 38%,var(--panel-2))}
.ifr-c.fr{fill:var(--warn)}
.ifr-c.cur{fill:var(--accent)}
.ifr-w{fill:var(--text-2);stroke:var(--text-2);stroke-width:.6;cursor:pointer}
.ifr-sg{font-weight:800;fill:var(--text);text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:var(--panel);stroke-width:3px}
.ifr-path{fill:none;stroke:var(--ok);stroke-width:3;stroke-linejoin:round;stroke-linecap:round;pointer-events:none}
.ifr-n{font:600 12.5px var(--mono);fill:var(--text)}
`;
