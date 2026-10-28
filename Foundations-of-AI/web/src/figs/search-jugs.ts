// Water pouring (homework, search4e PourProblem; slides p. 110): BFS discovers the reachable state space of jugs (4, 3),
// then the shortest solution plays back on the jugs. actions() and result() are the aima ones, so self-loops (pouring into a full jug) exist.
import { arrow, bar, card, md, s, style, type FigOptions } from './shell';
import { btn, pick, SPEEDS, ticker } from './search-kit';

const SIZES = [4, 3] as const, L = 40, BOTTOM = 262, JX = [40, 160], JW = 84;
type State = number[];
export type Action = ['Fill' | 'Dump', number] | ['Pour', number, number];
const key = (st: State) => st.join(',');
export const say = (a: Action) => `('${a[0]}', ${a.slice(1).join(', ')})`;

export function actions(st: State): Action[] {
  const J = [0, 1];
  return [...J.filter(i => st[i] < SIZES[i]).map((i): Action => ['Fill', i]), ...J.filter(i => st[i]).map((i): Action => ['Dump', i]),
    ...J.filter(i => st[i]).flatMap(i => J.filter(j => j !== i).map((j): Action => ['Pour', i, j]))];
}

export function result(st: State, a: Action): State {
  const out = [...st];
  if (a[0] === 'Fill') out[a[1]] = SIZES[a[1]];
  else if (a[0] === 'Dump') out[a[1]] = 0;
  else { const [, i, j = 0] = a, m = Math.min(st[i], SIZES[j] - st[j]); out[i] -= m; out[j] += m; }
  return out;
}

interface Info { st: State; depth: number; parent?: string; act?: Action; col: number; row: number }
interface Expansion { from: string; kids: { a: Action; to: string; fresh: boolean }[] }

/** BFS over the whole reachable space (no goal stop), in aima's action order. */
function explore() {
  const info = new Map<string, Info>([['0,0', { st: [0, 0], depth: 0, col: 0, row: 0 }]]), queue = ['0,0'], log: Expansion[] = [];
  while (queue.length) {
    const k = queue.shift()!, st = info.get(k)!.st, kids: Expansion['kids'] = [];
    for (const a of actions(st)) {
      const t = result(st, a), tk = key(t), fresh = !info.has(tk);
      if (fresh) { info.set(tk, { st: t, depth: info.get(k)!.depth + 1, parent: k, act: a, col: 0, row: 0 }); queue.push(tk); }
      kids.push({ a, to: tk, fresh });
    }
    log.push({ from: k, kids });
  }
  const perCol: number[] = [];
  for (const v of info.values()) { v.col = v.depth; v.row = perCol[v.depth] = (perCol[v.depth] ?? 0) + 1; }
  return { info, log, perCol };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fmj-css', CSS);
  const c = card(el, 'simulation', 'Water pouring: BFS discovers the state space, then the solution plays on the jugs', '0 0 780 330');
  const { info, log, perCol } = explore();
  if (info.size !== 14) console.error(`search-jugs: ${info.size} reachable states, the page says 14`);
  let goal = 2, cur: State = [0, 0], k = 0, plan: Action[] = [], played = -1, said = '', manual = '';

  // the jugs
  const water: SVGRectElement[] = [], lvl: SVGTextElement[] = [];
  SIZES.forEach((cap, i) => {
    const x = JX[i], top = BOTTOM - cap * L;
    water.push(s(c.svg, 'rect', { x: x + 3, width: JW - 6, class: 'fmj-water' }));
    for (let l = 1; l <= cap; l++) s(c.svg, 'line', { x1: x, x2: x + 10, y1: BOTTOM - l * L, y2: BOTTOM - l * L, class: 'fmj-tick' });
    s(c.svg, 'path', { d: `M${x},${top - 6} L${x},${BOTTOM} L${x + JW},${BOTTOM} L${x + JW},${top - 6}`, class: 'fmj-glass' });
    lvl.push(s(c.svg, 'text', { x: x + JW / 2, y: BOTTOM - 12, class: 'fmj-lvl' }));
    s(c.svg, 'text', { x: x + JW / 2, y: BOTTOM + 22, class: 'fg-t', 'text-anchor': 'middle' }, `jug ${i} · ${cap} L`);
  });
  const stream = s(c.svg, 'path', { class: 'fmj-stream', 'marker-end': arrow(c.svg) });
  const actT = s(c.svg, 'text', { x: 142, y: 40, class: 'fmj-act' });
  const goalT = s(c.svg, 'text', { x: 142, y: 62, class: 'fg-m', 'text-anchor': 'middle' });

  // the state space, one column per BFS depth
  const GX = 318, GW = 446, colW = GW / perCol.length, pos = (v: Info) => [GX + (v.col + 0.5) * colW, 150 + (v.row - (perCol[v.col] + 1) / 2) * 72];
  perCol.forEach((_, d) => s(c.svg, 'text', { x: GX + (d + 0.5) * colW, y: 34, class: 'fg-m', 'text-anchor': 'middle' }, `d = ${d}`));
  s(c.svg, 'text', { x: GX, y: 14, class: 'fg-t' }, 'Reachable states (jug 0, jug 1), column = fewest actions from (0, 0)');
  const edgeG = s(c.svg, 'g'), edges = new Map<string, SVGPathElement>(), nodes = new Map<string, SVGGElement>();
  for (const [kk, v] of info) {
    const [x, y] = pos(v), g = s(c.svg, 'g', { class: 'fmj-n hide' });
    s(g, 'circle', { cx: x, cy: y, r: 19 });
    s(g, 'text', { x, y: y + 4 }, kk.replace(',', ', '));
    nodes.set(kk, g);
  }
  const stat = s(c.svg, 'text', { x: GX, y: 300, class: 'fg-t' }), stat2 = s(c.svg, 'text', { x: GX, y: 320, class: 'fg-m' });
  const edgeOf = (a: string, b: string) => {
    const id = [a, b].sort().join('|');
    if (!edges.has(id)) {
      const [x1, y1] = pos(info.get(a)!), [x2, y2] = pos(info.get(b)!), bend = Math.abs(x2 - x1) > colW * 1.5 || x1 === x2 ? 0.35 : 0;
      const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
      edges.set(id, s(edgeG, 'path', { d: `M${x1},${y1} Q${mx},${my} ${x2},${y2}`, class: 'fmj-e' }));
    }
    return edges.get(id)!;
  };

  const ctl = bar(c), hand = bar(c);
  const run = btn(ctl, '', () => {
    if (tick.on) return tick.stop();
    if (played >= plan.length - 1) reset();
    tick.start();
  }, 'primary');
  btn(ctl, '↺ Reset', () => { tick.stop(); reset(); });
  const speed = pick(ctl, SPEEDS, '450', () => {}, 'Speed');
  pick(ctl, [1, 2, 3, 4].map(g => [String(g), `goal: ${g} L in some jug`]), '2', v => { tick.stop(); goal = +v; reset(); }, 'Goal');
  const span = document.createElement('span');
  span.className = 'fmj-you';
  span.textContent = 'or pour yourself:';
  hand.append(span);
  const ACTS: Action[] = [['Fill', 0], ['Fill', 1], ['Dump', 0], ['Dump', 1], ['Pour', 0, 1], ['Pour', 1, 0]];
  const handBtns = ACTS.map(a => btn(hand, say(a), () => { tick.stop(); doManual(a); }));
  const tick = ticker(step, () => +speed.value * (k >= log.length ? 2.4 : 1), () => render());

  function solve(): Action[] {
    const hit = [...info.values()].filter(v => v.st.includes(goal)).sort((a, b) => a.depth - b.depth)[0], out: Action[] = [];
    for (let v: Info | undefined = hit; v?.act; v = info.get(v.parent!)) out.unshift(v.act);
    return out;
  }
  function reset() {
    k = 0; played = -1; manual = ''; cur = [0, 0]; plan = solve();
    nodes.forEach(n => n.setAttribute('class', 'fmj-n hide'));
    edges.forEach(e => e.remove());
    edges.clear();
    nodes.get('0,0')!.classList.remove('hide');
    stream.classList.remove('on');
    actT.textContent = '';
    render();
  }
  function step(): boolean {
    stream.classList.remove('on');
    manual = '';
    if (k < log.length) {
      expand(log[k++]);
      if (k === log.length) { cur = [0, 0]; nodes.forEach(n => n.classList.remove('cur')); edges.forEach(p => p.classList.remove('now')); } // the playback starts from (0, 0)
      render();
      return true;
    }
    if (played < plan.length - 1) { act(plan[++played]); render(); return played < plan.length - 1; }
    return false;
  }
  function expand(e: Expansion) {
    nodes.forEach(n => n.classList.remove('cur'));
    edges.forEach(p => p.classList.remove('now'));
    nodes.get(e.from)!.classList.add('cur', 'done');
    for (const kid of e.kids) {
      if (kid.to === e.from) continue; // self-loop: pouring into a full jug changes nothing
      const p = edgeOf(e.from, kid.to);
      p.classList.add('now');
      if (kid.fresh) p.classList.add('tree');
      nodes.get(kid.to)!.classList.remove('hide');
    }
    cur = info.get(e.from)!.st;
  }
  function act(a: Action) {
    const from = cur;
    cur = result(cur, a);
    actT.textContent = say(a);
    if (a[0] === 'Pour' && key(from) !== key(cur)) {
      const [, i, j] = a, x1 = JX[i] + JW / 2, x2 = JX[j] + JW / 2, top = BOTTOM - Math.max(...SIZES) * L - 30;
      stream.setAttribute('d', `M${x1},${BOTTOM - SIZES[i] * L} Q${(x1 + x2) / 2},${top} ${x2},${BOTTOM - from[j] * L - 4}`);
      void stream.getBBox();
      stream.classList.add('on');
    }
    nodes.forEach(n => n.classList.remove('cur'));
    nodes.get(key(cur))?.classList.add('cur');
  }
  function doManual(a: Action) {
    const before = key(cur);
    act(a);
    manual = `${say(a)}: (${before.replace(',', ', ')}) → (${key(cur).replace(',', ', ')})`;
    render();
    opts.onEvent?.(`[${c.title}] you did ${manual}`);
  }

  function render() {
    cur.forEach((v, i) => {
      water[i].style.y = `${BOTTOM - v * L}px`;
      water[i].style.height = `${v * L}px`;
      lvl[i].textContent = `${v} L`;
      lvl[i].classList.toggle('fmj-goal', v === goal);
    });
    goalT.textContent = `goal: ${goal} L in either jug`;
    const seen = [...nodes.values()].filter(n => !n.classList.contains('hide')).length, exp = Math.min(k, log.length);
    const onPath = new Set(['0,0']);
    if (played >= 0) { let st: State = [0, 0]; for (const a of plan.slice(0, played + 1)) { st = result(st, a); onPath.add(key(st)); } }
    for (const [kk, n] of nodes) {
      n.classList.toggle('goal', info.get(kk)!.st.includes(goal) && !n.classList.contains('hide'));
      n.classList.toggle('path', played >= 0 && onPath.has(kk));
    }
    edges.forEach(p => p.classList.remove('sol'));
    if (played >= 0) {
      let st: State = [0, 0];
      for (const a of plan.slice(0, played + 1)) { const t = result(st, a); edgeOf(key(st), key(t)).classList.add('sol'); st = t; }
    }
    stat.textContent = `reached ${seen} states · expanded ${exp} · frontier ${seen - exp}`;
    stat2.textContent = k >= log.length ? `BFS done: ${info.size} reachable states, ${plan.length}-action solution` : 'dashed: an action leading to a state already reached';
    run.textContent = tick.on ? '⏸ Pause' : k === 0 ? '⏵ Run BFS' : played >= plan.length - 1 ? '⏵ Replay' : '⏵ Continue';
    const app = actions(cur).map(say);
    handBtns.forEach((b, i) => { b.disabled = !app.includes(say(ACTS[i])); });
    explain();
  }

  function explain() {
    const firstGoal = log.findIndex(e => e.kids.some(kid => info.get(kid.to)!.st.includes(goal)));
    const sol = plan.map(say).join(', ');
    const [stage, text] = manual
      ? [`m${manual}`, `**You did ${manual}.** \`actions(s)\` keeps only what makes sense: a full jug cannot be filled, an empty one cannot be dumped or poured from (the disabled buttons). ` +
        (cur.includes(goal) ? `<span class="yes">**Goal test true**</span>: ${goal} L is in a jug.` : `Goal test false: no jug holds ${goal} L.`)]
      : k === 0
      ? ['idle', `**State = (liters in jug 0, liters in jug 1)**, start (0, 0). \`actions(s)\` lists Fill, Dump and Pour; \`result(s, a)\` pours until the source is empty or the target full. Press **Run BFS** to discover every state reachable from (0, 0).`]
      : k < log.length
      ? ['bfs', `**BFS expands the states in FIFO order** (blue ring = the state being expanded). Each expansion calls \`actions\` and \`result\`: a solid line reaches a **new** state, a dashed one a state already reached. ` +
        `Green fill = goal test true (${goal} L in a jug). With the goal test on, BFS would stop at expansion ${firstGoal + 1}; here it runs on to draw the whole space.`]
      : played < plan.length - 1
      ? ['play', `**All ${info.size} reachable states found** (out of ${(SIZES[0] + 1) * (SIZES[1] + 1)} pairs: in every reachable state one jug is empty or full). ` +
        `The shallowest goal is ${plan.length} actions deep. Watch the solution on the jugs: ${sol}.`]
      : ['done', `**Solution: ${sol}**: ${plan.length} action${plan.length > 1 ? 's' : ''}, the fewest possible (BFS, unit step cost). ` +
        `The solution is the **path**, not the goal state: the green line in the graph. Change the goal or pour yourself with the buttons.`];
    if (stage === said) return;
    said = stage;
    c.cap.innerHTML = md(text);
    if (stage !== 'idle' && !manual) opts.onEvent?.(`[${c.title}] ${text}`);
  }

  reset();
  return { destroy: () => tick.stop() };
}

const CSS = `
.fmj-water{fill:var(--info);opacity:.55;transition:y .6s ease,height .6s ease}
.fmj-glass{fill:none;stroke:var(--text-2);stroke-width:2.5;stroke-linejoin:round}
.fmj-tick{stroke:var(--muted);stroke-width:1.5}
.fmj-lvl{font:650 15px var(--mono);fill:var(--text);text-anchor:middle}
.fmj-lvl.fmj-goal{fill:var(--ok)}
.fmj-act{font:600 14px var(--mono);fill:var(--accent);text-anchor:middle}
.fmj-stream{fill:none;stroke:var(--info);stroke-width:5;stroke-linecap:round;opacity:0}
.fmj-stream.on{animation:fmj-pour 1.2s ease forwards}
@keyframes fmj-pour{20%,70%{opacity:.85}100%{opacity:0}}
.fmj-n circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .3s,stroke .3s}
.fmj-n text{font:600 11.5px var(--mono);fill:var(--text);text-anchor:middle;pointer-events:none}
.fmj-n{transition:opacity .35s}
.fmj-n.done circle{fill:var(--panel-3)}
.fmj-n.goal circle{fill:var(--ok-soft)}
.fmj-n.cur circle{stroke:var(--accent);stroke-width:3.5}
.fmj-n.path circle{stroke:var(--ok);stroke-width:3.5}
.fmj-e{fill:none;stroke:var(--v-edge);stroke-width:1.3;stroke-dasharray:4 4;opacity:.5;transition:stroke .25s,opacity .25s}
.fmj-e.tree{stroke-dasharray:none;stroke-width:2;opacity:1}
.fmj-e.now{stroke:var(--accent)}
.fmj-e.sol{stroke:var(--ok);stroke-width:4;stroke-dasharray:none;opacity:1}
.fmj-you{font-size:12.5px;color:var(--muted)}
`;
