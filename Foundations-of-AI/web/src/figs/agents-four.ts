// The four agent architectures side by side (slides p. 35–51): simple reflex, model-based, goal-based and utility-based
// agents clean the same 3×6 room. Score as in the worked example: +1 per clean square per step, −c per move, T steps.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const R = 3, C = 6, N = R * C, CELL = 28, MAXD = 8, START = 0, PW = 192, GY = 46;
const NAMES = ['Simple reflex', 'Model-based reflex', 'Goal-based', 'Utility-based'];
const SUBS = ['current percept + rules', '+ state (the dirt map)', '+ goal "all clean" + search', '+ utility = the score'];
const COLORS = ['var(--v-min)', 'var(--warn)', 'var(--info)', 'var(--accent)'];
// the reflex rules: one fixed arrow per square, a tour through all 18 squares (the 2-square "back and forth", generalized)
const TOUR = [0, 1, 2, 3, 4, 5, 11, 17, 16, 10, 9, 15, 14, 8, 7, 13, 12, 6];
const NEXT: number[] = [];
TOUR.forEach((v, k) => { NEXT[v] = TOUR[(k + 1) % N]; });
const nbrs = (i: number) => [i - C, i + 1, i + C, i - 1].filter((j, k) => j >= 0 && j < N && (k % 2 === 0 || Math.floor(j / C) === Math.floor(i / C)));
const DIRS: Record<number, string> = { [-C]: 'Up', [C]: 'Down', [-1]: 'Left', 1: 'Right' };
const pop = (m: number) => { let n = 0; for (; m; m &= m - 1) n++; return n; };

type Act = 'Suck' | 'NoOp' | number; // a number = move to that square
interface Snap { pos: number; mask: number; act: Act | null; moves: number; dirtSteps: number; plan: number[] }
export interface Run { traces: Snap[][]; allClean: number } // allClean: best score of a plan that cleans everything (utility check)

/** Simulates the four agents for T steps on the dirty squares D (bit k of a mask = D[k] still dirty). */
export function simulate(D: number[], c: number, T: number): Run {
  const M = 1 << D.length, bit = (i: number) => { const k = D.indexOf(i); return k < 0 ? 0 : 1 << k; };
  const succ = (p: number, m: number): [Act, number, number][] =>
    [['NoOp', p, m], ...(m & bit(p) ? [['Suck', p, m & ~bit(p)] as [Act, number, number]] : []), ...nbrs(p).map(j => [j, j, m] as [Act, number, number])];
  const reward = (m: number, a: Act) => N - pop(m) - (typeof a === 'number' ? c : 0);
  const SUCC = Array.from({ length: N * M }, (_, x) => succ(Math.floor(x / M), x % M));
  // utility-based: finite-horizon dynamic programming on (t, square, dirt); deterministic, so expected utility = actual score
  const dp = (forceClean: boolean) => {
    const V = new Float64Array((T + 1) * N * M);
    if (forceClean) for (let x = 0; x < N * M; x++) if (x % M) V[T * N * M + x] = -Infinity;
    for (let t = T - 1; t >= 0; t--) for (let x = 0; x < N * M; x++) {
      let v = -Infinity;
      for (const [a, q, m2] of SUCC[x]) v = Math.max(v, reward(m2, a) + V[((t + 1) * N + q) * M + m2]);
      V[t * N * M + x] = v;
    }
    return V;
  };
  const V = dp(false), Vclean = dp(true);
  const best = (t: number, p: number, m: number) => { // ties: NoOp, then Suck, then the moves
    let out = SUCC[p * M + m][0], v = -Infinity;
    for (const x of SUCC[p * M + m]) { const w = reward(x[2], x[0]) + V[((t + 1) * N + x[1]) * M + x[2]]; if (w > v + 1e-9) { v = w; out = x; } }
    return out;
  };
  // goal-based: breadth-first search on (square, dirt) for a shortest action sequence to "all clean"
  const goalPlan: Act[] = [];
  const prev = new Map<number, [number, Act] | null>([[START * M + M - 1, null]]), q = [START * M + M - 1];
  for (let h = 0; h < q.length; h++) {
    if (q[h] % M === 0) { for (let k = q[h]; prev.get(k); k = prev.get(k)![0]) goalPlan.unshift(prev.get(k)![1]); break; }
    for (const [a, p2, m2] of SUCC[q[h]].slice(1)) if (!prev.has(p2 * M + m2)) { prev.set(p2 * M + m2, [q[h], a]); q.push(p2 * M + m2); }
  }
  const moveSquares = (from: number, acts: Act[]) => [from, ...acts.filter((a): a is number => typeof a === 'number')];
  const policies: ((t: number, p: number, m: number) => Act)[] = [
    (_, p, m) => (m & bit(p) ? 'Suck' : NEXT[p]),
    (_, p, m) => (m & bit(p) ? 'Suck' : m === 0 ? 'NoOp' : NEXT[p]), // its state is exact: it knew the map and sees every Suck
    t => goalPlan[t] ?? 'NoOp',
    (t, p, m) => best(t, p, m)[0],
  ];
  const traces = policies.map((pol, k) => {
    const out: Snap[] = [];
    let pos = START, mask = M - 1, moves = 0, dirtSteps = 0, act: Act | null = null;
    for (let t = 0; ; t++) {
      let plan: number[] = [];
      if (k === 2) plan = moveSquares(pos, goalPlan.slice(t));
      if (k === 3) {
        const acts: Act[] = [];
        for (let u = t, p = pos, m = mask; u < T; u++) { const [a, p2, m2] = best(u, p, m); acts.push(a); p = p2; m = m2; }
        plan = moveSquares(pos, acts);
      }
      out.push({ pos, mask, act, moves, dirtSteps, plan });
      if (t === T) return out;
      act = pol(t, pos, mask);
      if (act === 'Suck') mask &= ~bit(pos);
      else if (typeof act === 'number') { pos = act; moves++; }
      dirtSteps += pop(mask);
    }
  });
  const total = (tr: Snap[]) => N * T - tr[T].dirtSteps - c * tr[T].moves;
  traces.forEach((tr, k) => { if (total(tr) > total(traces[3]) + 1e-9) console.error(`agents-four: ${NAMES[k]} scores ${total(tr)} > utility-based ${total(traces[3])}`); });
  if (Math.abs(total(traces[3]) - V[START * M + M - 1]) > 1e-9) console.error('agents-four: utility trace != DP value');
  if (goalPlan.length && traces.some(tr => tr[T].mask === 0 && tr.findIndex(sn => sn.mask === 0) < goalPlan.length)) console.error('agents-four: an agent cleaned faster than BFS');
  return { traces, allClean: Vclean[START * M + M - 1] };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-agf-css', CSS);
  const c = card(el, 'simulation', 'Four architectures, one room: who stops, who plans, who trades off', '0 0 780 380');
  let D = [1, 6, 7, 17], cost = 1, T = 30, t = 0, running = false, raf = 0, last = 0, ms = 500, said = '';
  let run = simulate(D, cost, T);

  const ui = NAMES.map((name, k) => {
    const x0 = 12 + k * PW;
    s(c.svg, 'circle', { cx: x0 + 5, cy: 15, r: 5, fill: COLORS[k] });
    s(c.svg, 'text', { x: x0 + 15, y: 20, class: 'fg-h2 agf-name' }, name);
    s(c.svg, 'text', { x: x0, y: 37, class: 'fg-m' }, SUBS[k]);
    const dirt: SVGGElement[] = [];
    for (let i = 0; i < N; i++) {
      const x = x0 + (i % C) * CELL, y = GY + Math.floor(i / C) * CELL;
      s(c.svg, 'rect', { x, y, width: CELL, height: CELL, class: 'fg-cell agf-c' }).onclick = () => toggle(i);
      if (k === 0) {
        const [dx, dy] = [(NEXT[i] % C) - (i % C), Math.floor(NEXT[i] / C) - Math.floor(i / C)];
        s(c.svg, 'text', { x: x + CELL / 2 + dx * 8, y: y + CELL / 2 + 4 + dy * 8, class: 'agf-rule' }, dx ? (dx > 0 ? '→' : '←') : dy > 0 ? '↓' : '↑');
      }
      const g = s(c.svg, 'g', { class: 'agf-dirt' });
      for (const [ex, ey] of [[-6, 3], [0, 7], [6, 2]]) s(g, 'circle', { cx: x + CELL / 2 + ex, cy: y + CELL / 2 + ey, r: 2.6 });
      dirt.push(g);
    }
    const plan = s(c.svg, 'polyline', { class: 'agf-plan', stroke: COLORS[k] });
    const agent = s(c.svg, 'circle', { r: 8, class: 'agf-agent', fill: COLORS[k] });
    const l1 = s(c.svg, 'text', { x: x0, y: 150, class: 'fg-t' }), l2 = s(c.svg, 'text', { x: x0, y: 168, class: 'fg-m' });
    const perf = s(c.svg, 'text', { x: x0, y: 192, class: 'fg-v' });
    return { x0, dirt, plan, agent, l1, l2, perf };
  });

  // points lost so far = dirty squares × steps + c × moves (performance = 18·t − loss)
  const BX = 128, BW = 520;
  s(c.svg, 'text', { x: 12, y: 226, class: 'fg-t' }, 'Points lost so far: one per dirty square per step (dirt) + c per move (moves)');
  const bars = NAMES.map((name, k) => {
    const y = 240 + k * 30;
    s(c.svg, 'text', { x: BX - 8, y: y + 14, class: 'fg-m', 'text-anchor': 'end' }, name);
    s(c.svg, 'rect', { x: BX, y, width: BW, height: 20, class: 'agf-track' });
    return { y, d: s(c.svg, 'rect', { x: BX, y, height: 20, class: 'agf-d' }), m: s(c.svg, 'rect', { y, height: 20, class: 'agf-m' }),
      v: s(c.svg, 'text', { y: y + 14, class: 'agf-bv' }) };
  });
  s(c.svg, 'rect', { x: BX, y: 362, width: 10, height: 8, class: 'agf-d' });
  s(c.svg, 'text', { x: BX + 14, y: 370, class: 'fg-m' }, 'dirt');
  s(c.svg, 'rect', { x: BX + 54, y: 362, width: 10, height: 8, class: 'agf-m' });
  s(c.svg, 'text', { x: BX + 68, y: 370, class: 'fg-m' }, 'moves');

  const ctl = bar(c), knobs = bar(c);
  const go = document.createElement('button');
  go.className = 'btn sm primary';
  go.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); t = 0; render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="500">slow</option><option value="140">fast</option>';
  sp.onchange = () => { ms = +sp.value; };
  ctl.append(go, reset, sp);
  const costIn = slider(knobs, 'move cost c', 0, 6, 1, cost, v => { cost = v; restart(); });
  slider(knobs, 'steps T', 10, 60, 5, T, v => { T = v; restart(); });
  costIn.addEventListener('change', () => opts.onEvent?.(`[${c.title}] move cost c = ${cost}`));

  function restart() { run = simulate(D, cost, T); t = 0; said = ''; render(); }
  function toggle(i: number) {
    if (!D.includes(i) && D.length >= MAXD) { c.cap.innerHTML = md(`At most **${MAXD}** dirty squares (the utility-based agent plans over every subset of them).`); said = ''; return; }
    D = D.includes(i) ? D.filter(j => j !== i) : [...D, i].sort((a, b) => a - b);
    opts.onEvent?.(`[${c.title}] dirt now on ${D.length} squares`);
    restart();
  }
  function play() {
    if (running) return;
    if (t >= T) t = 0;
    running = true;
    last = performance.now();
    const frame = (now: number) => {
      if (now - last >= ms) { last = now; t++; render(); }
      if (t >= T) return pause();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  const cx = (k: number, i: number) => ui[k].x0 + (i % C) * CELL + CELL / 2, cy = (i: number) => GY + Math.floor(i / C) * CELL + CELL / 2;
  const total = (sn: Snap, at: number) => N * at - sn.dirtSteps - cost * sn.moves;
  function render() {
    const maxLoss = Math.max(1, ...run.traces.map(tr => tr[T].dirtSteps + cost * tr[T].moves));
    run.traces.forEach((tr, k) => {
      const sn = tr[t], u = ui[k];
      D.forEach((i, b) => u.dirt[i].classList.toggle('on', (sn.mask >> b) & 1 ? true : false));
      for (let i = 0; i < N; i++) if (!D.includes(i)) u.dirt[i].classList.remove('on');
      u.agent.setAttribute('transform', `translate(${cx(k, sn.pos)},${cy(sn.pos)})`);
      u.plan.setAttribute('points', sn.plan.length > 1 ? sn.plan.map(i => `${cx(k, i)},${cy(i)}`).join(' ') : '');
      const a = sn.act === null ? 'start' : typeof sn.act === 'number' ? DIRS[sn.act - tr[t - 1].pos] : sn.act;
      u.l1.textContent = `t = ${t} · ${a}`;
      u.l2.textContent = `moves ${sn.moves} · dirt left ${pop(sn.mask)}`;
      u.perf.textContent = `performance ${total(sn, t)}`;
      const b = bars[k], wd = (sn.dirtSteps / maxLoss) * BW, wm = ((cost * sn.moves) / maxLoss) * BW;
      b.d.setAttribute('width', String(wd));
      b.m.setAttribute('x', String(BX + wd));
      b.m.setAttribute('width', String(wm));
      b.v.setAttribute('x', String(BX + wd + wm + 6));
      b.v.textContent = `${sn.dirtSteps} + ${cost}·${sn.moves} = ${sn.dirtSteps + cost * sn.moves}`;
    });
    const best = Math.max(...run.traces.map(tr => total(tr[t], t)));
    ui.forEach((u, k) => u.perf.classList.toggle('ok', t > 0 && total(run.traces[k][t], t) === best));
    go.textContent = running ? '⏸ Pause' : t >= T ? '⏵ Run again' : t ? '⏵ Continue' : '⏵ Run';
    explain();
  }

  // the caption follows the run: the latest milestone reached (computed from the traces), the summary at t = T
  function events(): [number, string, string][] {
    const [rf, mb, gb, ub] = run.traces, clean = (tr: Snap[]) => tr.findIndex(sn => sn.mask === 0);
    const lastAct = (tr: Snap[]) => { let k = 0; tr.forEach((sn, i) => { if (sn.act !== null && sn.act !== 'NoOp') k = i; }); return k; };
    const ev: [number, string, string][] = [];
    const tg = clean(gb), tm = clean(mb), tr = clean(rf), tu = lastAct(ub);
    if (tg >= 0) ev.push([tg, 'goal', `**Goal-based: all clean at t = ${tg}** with **${gb[tg].moves} moves**, the fewest that clean everything: it predicted the result of each action and ` +
      'searched (breadth-first) for a shortest action sequence to its goal. Then NoOp.']);
    if (tm >= 0) ev.push([tm, 'model', `**Model-based: all clean at t = ${tm}**, after ${mb[tm].moves} moves along its arrows (past clean squares too). ` +
      'Its **state** says nothing is left, so it does **NoOp**: memory stops the waste.']);
    if (tr >= 0) ev.push([tr + 1, 'reflex', `**Reflex: the room has been clean since t = ${tr}, but the agent cannot know it.** It sees one square and has no memory, ` +
      `so it keeps following its arrows: ${cost ? `−${cost} every step, forever` : 'with free moves that costs nothing'} (the 2-square "back and forth", generalized).`]);
    const left = pop(ub[T].mask), U = N * T - ub[T].dirtSteps - cost * ub[T].moves, G = N * T - gb[T].dirtSteps - cost * gb[T].moves;
    if (left) ev.push([tu, 'util', `**Utility-based: stops at t = ${tu} with ${left} dirty square${left > 1 ? 's' : ''} left, on purpose.** ` +
      `The trip costs c = ${cost} per move, more than the square would earn before T = ${T}: the best plan that cleans everything scores ${num(run.allClean)}, ` +
      (U > run.allClean ? `${num(U - run.allClean)} less than its ${U}. A goal is yes/no; a utility can say "not worth it".` : 'the same as its own: a tie, and it prefers to rest.')]);
    else if (tu > 0) ev.push([tu, 'util', `**Utility-based: all clean at t = ${tu}.** ` + (U > G
      ? `Same goal as the goal-based agent, but a better order: it cleans the near squares first, so they count as clean for more steps (${U} vs ${G}).`
      : `With c = ${cost} cleaning everything is worth it, so its best plan is also a shortest plan to the goal (${U} = ${G}). With a high enough move cost far squares stop being worth the trip: try c = 4 on the starting room.`)]);
    const tot = run.traces.map(tr2 => N * T - tr2[T].dirtSteps - cost * tr2[T].moves);
    ev.push([T, 'end', `**t = T = ${T}. Performance:** ${NAMES.map((n, k) => `${n.toLowerCase()} ${tot[k]}`).join(', ')}. ` +
      (cost === 0 ? 'With **free moves** circling costs nothing: the reflex agent is as good as the model-based one, as in the 2-square world. '
        : `The reflex agent paid for ${rf[T].moves - mb[T].moves} more moves than the model-based one. `) +
      (left ? 'The utility-based agent left dirt and still scored the most: rational means maximizing the **performance measure**, not reaching a goal.'
        : 'Only the utility-based agent optimizes the score itself; raise c until it starts leaving far squares dirty.')]);
    return ev.sort((a, b) => a[0] - b[0]);
  }
  function explain() {
    const ev = events().filter(e => e[0] <= t && t > 0);
    const [key, text] = !t
      ? ['idle', `**Same room, same start, same measure:** +1 per clean square per step, −c per move (c = ${cost}), T = ${T} steps. ` +
        'All four are told where the dirt is at t = 0; afterwards each perceives only its own square. Gray arrows: the reflex agent\'s rules. ' +
        'Lines: the plans of the goal- and utility-based agents. Press **Run**; click a square to add or remove dirt.']
      : !ev.length
      ? ['run', 'All four **Suck** on a dirty square; they differ in **where they go next**. Reflex: the fixed arrow of this square (it cannot see the dirt). ' +
        'Model-based: the same arrows, but it keeps the dirt map in its state. Goal-based: a shortest plan to "all clean". Utility-based: the plan with the highest score.']
      : [ev[ev.length - 1][1], ev.filter(e => e[0] === ev[ev.length - 1][0]).map(e => e[2]).join(' ')];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  render();
  return { destroy: pause };
}

const CSS = `
.agf-name{font-size:14px}
.agf-c{cursor:pointer}
.agf-rule{font-size:11px;fill:var(--muted);opacity:.55;text-anchor:middle;pointer-events:none}
.agf-dirt{fill:var(--warn);opacity:0;pointer-events:none;transition:opacity .3s}
.agf-dirt.on{opacity:1}
.agf-plan{fill:none;stroke-width:2.5;stroke-dasharray:5 4;stroke-linejoin:round;opacity:.8;pointer-events:none}
.agf-agent{stroke:var(--panel);stroke-width:2.5;pointer-events:none;transition:transform .25s ease-out}
.agf-track{fill:var(--panel-2);stroke:var(--border)}
.agf-d{fill:var(--warn);opacity:.75}
.agf-m{fill:var(--bad);opacity:.75}
.agf-bv{font:600 11.5px var(--mono);fill:var(--text-2)}
`;
