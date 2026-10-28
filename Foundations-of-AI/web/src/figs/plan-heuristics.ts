// Heuristics for planning (AIMA §11.3) on the painting problem of exam 12 Jul 2024: six objects, the exam's PDDL schemas
// move-object, move, paint. h* and the two relaxed problems are solved exactly by breadth-first search; click to edit the state.
import { bar, card, md, s, style, type FigOptions } from './shell';

const N = 6, RA = 1 << (3 * N), RB = 1 << (3 * N + 1);
const atA = (i: number) => 1 << (3 * i), atB = (i: number) => 1 << (3 * i + 1), pt = (i: number) => 1 << (3 * i + 2);
interface Act { name: string; pre: number; neg: number; add: number; del: number }
const ACTS: Act[] = [];
{
  const seen = new Set<string>(), push = (a: Act) => { const k = `${a.pre},${a.neg},${a.add},${a.del}`; if (!seen.has(k)) { seen.add(k); ACTS.push(a); } };
  const objs = [...Array(N).keys()], at = (l: string, i: number) => (l === 'A' ? atA(i) : atB(i)), rob = (l: string) => (l === 'A' ? RA : RB);
  for (const [l, l2] of [['A', 'B'], ['B', 'A']]) {
    // move-object(ℓ, ℓ′, o)  P: location(ℓ), location(ℓ′), at(ℓ, o), at(ℓ, Robot), ℓ ≠ ℓ′   E: ¬at(ℓ, o), ¬at(ℓ, Robot), at(ℓ′, o), at(ℓ′, Robot)
    for (const i of objs) push({ name: `move-object(${l},${l2},O${i + 1})`, pre: at(l, i) | rob(l), neg: 0, add: at(l2, i) | rob(l2), del: at(l, i) | rob(l) });
    // move(ℓ, ℓ′)  P: location(ℓ), location(ℓ′), at(ℓ, Robot), ℓ ≠ ℓ′   E: ¬at(ℓ, Robot), at(ℓ′, Robot)
    push({ name: `move(${l},${l2})`, pre: rob(l), neg: 0, add: rob(l2), del: rob(l) });
  }
  // paint(o, o′, o″)  P: at(B, o), at(B, o′), at(B, o″), ¬painted(o), ¬painted(o′), ¬painted(o″)   E: painted(o), painted(o′), painted(o″)
  for (const i of objs) for (const j of objs) for (const k of objs)
    push({ name: `paint(O${i + 1},O${j + 1},O${k + 1})`, pre: atB(i) | atB(j) | atB(k), neg: pt(i) | pt(j) | pt(k), add: pt(i) | pt(j) | pt(k), del: 0 });
}
const GOAL = [...Array(N).keys()].reduce((g, i) => g | atA(i) | pt(i), 0);
const isGoal = (s: number) => (s & GOAL) === GOAL;
const ok = (s: number, a: Act) => (s & a.pre) === a.pre && !(s & a.neg);

/** Breadth-first search to the goal; returns a shortest plan (names), or null. */
function bfs(s0: number, app: (s: number, a: Act) => boolean, res: (s: number, a: Act) => number): string[] | null {
  if (isGoal(s0)) return [];
  const par = new Map<number, [number, number]>([[s0, [-1, -1]]]);
  for (let fr = [s0]; fr.length;) {
    const nx: number[] = [];
    for (const s of fr) for (let i = 0; i < ACTS.length; i++) {
      if (!app(s, ACTS[i])) continue;
      const t = res(s, ACTS[i]);
      if (par.has(t)) continue;
      par.set(t, [s, i]);
      if (isGoal(t)) { const p: string[] = []; for (let x = t; x !== s0; x = par.get(x)![0]) p.unshift(ACTS[par.get(x)![1]].name); return p; }
      nx.push(t);
    }
    fr = nx;
  }
  return null;
}
const real = (s: number) => bfs(s, ok, (x, a) => (x & ~a.del) | a.add);
const noDel = (s: number) => bfs(s, ok, (x, a) => x | a.add);                  // ignore delete lists (¬painted still checked)
const noPre = (s: number) => bfs(s, () => true, (x, a) => (x & ~a.del) | a.add); // ignore preconditions

type Obj = 0 | 1 | 2 | 3; // at A unpainted, at B unpainted, at B painted, at A painted (the click cycle)
const encode = (o: Obj[], robotB: boolean) => o.reduce((s, v, i) => s | (v === 0 || v === 3 ? atA(i) : atB(i)) | (v >= 2 ? pt(i) : 0), robotB ? RB : RA);
interface H { label: string; f?: (o: Obj[], s: number) => number; plan?: (s: number) => string[] | null }
const count = (o: Obj[], v: Obj) => o.filter(x => x === v).length;
const HS: H[] = [
  { label: 'h* (true cost, BFS)', plan: real },
  { label: '2·U(A) + P(B)  (exam)', f: o => 2 * count(o, 0) + count(o, 2) },
  { label: '3·U(A) + P(B)', f: o => 3 * count(o, 0) + count(o, 2) },
  { label: 'ignore delete lists', plan: noDel },
  { label: 'unsatisfied goal literals', f: (_, s) => [...Array(2 * N).keys()].filter(b => !(s & (b % 2 ? pt(b >> 1) : atA(b >> 1)))).length },
  { label: 'ignore preconditions', plan: noPre },
  { label: 'h = 0', f: () => 0 },
];
/** Every heuristic in state s, with the plans of the ones that come from a search (the goal is reachable from every state). */
const evalAll = (o: Obj[], s: number) => {
  const plans = HS.map(h => h.plan?.(s) ?? null);
  return { plans, hs: HS.map((h, k) => plans[k]?.length ?? h.f!(o, s)) };
};
const PRESETS: [string, Obj[], boolean][] = [
  ['Init (exam)', [0, 0, 0, 0, 0, 0], false],
  ['3 painted at B', [2, 2, 2, 0, 0, 0], true],
  ['all at B, unpainted', [1, 1, 1, 1, 1, 1], true],
];
const BX = 540, SC = 9, ROW = 25;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-plan-heuristics-css', CSS);
  const init = encode(PRESETS[0][1], false), n0 = ACTS.filter(a => ok(init, a)).length;
  if (n0 !== 7) console.error(`plan-heuristics: ${n0} actions applicable in the initial state, the exam's solution says 7`);
  const c = card(el, 'interactive', 'Heuristics for planning: relaxed problems vs the true cost (painting problem, exam 12 Jul 2024)', '0 0 780 440');
  let objs: Obj[] = [...PRESETS[0][1]], robotB = false, verdict: string[] | null = null, raf = 0;

  // the world: locations A and B, six objects (hollow = unpainted), the robot
  (['A', 'B'] as const).forEach((l, k) => {
    s(c.svg, 'rect', { x: 20 + k * 160, y: 30, width: 150, height: 150, rx: 10, class: 'plh-loc' });
    s(c.svg, 'text', { x: 30 + k * 160, y: 50, class: 'fg-h2' }, l);
    if (l === 'B') s(c.svg, 'text', { x: 330 - 10, y: 50, class: 'fg-m', 'text-anchor': 'end' }, 'painting system');
  });
  const slot = (i: number, b: boolean) => [20 + (b ? 160 : 0) + 33 + (i % 3) * 42, 30 + 82 + Math.floor(i / 3) * 44];
  const items = objs.map((_, i) => {
    const g = s(c.svg, 'g', { class: 'plh-o', tabindex: 0 });
    s(g, 'circle', { r: 15 });
    s(g, 'text', { y: 4.5 }, `O${i + 1}`);
    const next = () => { objs[i] = ((objs[i] + 1) % 4) as Obj; update(); };
    g.addEventListener('click', next);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
    return g;
  });
  const robot = s(c.svg, 'g', { class: 'plh-r', tabindex: 0 });
  s(robot, 'rect', { x: -15, y: -12, width: 30, height: 24, rx: 6 });
  s(robot, 'text', { y: 4.5 }, 'R');
  const flip = () => { robotB = !robotB; update(); };
  robot.addEventListener('click', flip);
  robot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  s(c.svg, 'text', { x: 20, y: 200, class: 'fg-m' }, 'Click an object (A → B → painted → A) or R.');

  // the heuristic values against h*
  s(c.svg, 'text', { x: 360, y: 22, class: 'fg-t' }, 'h(s) for the state on the left');
  const hstar = s(c.svg, 'line', { y1: 32, y2: 36 + HS.length * ROW, class: 'plh-star' });
  const rows = HS.map((h, k) => {
    const y = 40 + k * ROW;
    s(c.svg, 'text', { x: 360, y: y + 12, class: 'fg-t' }, h.label);
    const b = s(c.svg, 'rect', { x: BX, y, width: 0, height: 15, rx: 3, class: 'plh-bar' });
    return { b, v: s(c.svg, 'text', { y: y + 12, class: 'plh-v' }), mark: s(c.svg, 'text', { x: 772, y: y + 12, class: 'plh-mark', 'text-anchor': 'end' }) };
  });
  const plans = [0, 1, 2].map(() => s(c.svg, 'text', { x: 20, class: 'plh-plan' }));

  const ctl = bar(c);
  for (const [label, o, rb] of PRESETS) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = label;
    b.onclick = () => { objs = [...o]; robotB = rb; update(); };
    ctl.append(b);
  }
  const check = document.createElement('button');
  check.className = 'btn sm primary';
  check.textContent = 'Check every state (admissible?)';
  check.onclick = checkAll;
  ctl.append(check);

  /** h ≤ h* in all 4^6 · 2 = 8192 states? Objects are interchangeable, so one state per count pattern is enough (168). */
  function checkAll() {
    cancelAnimationFrame(raf);
    const todo: [Obj[], boolean, number][] = [];
    const fact = (n: number): number => (n < 2 ? 1 : n * fact(n - 1));
    for (let a = 0; a <= N; a++) for (let b = 0; a + b <= N; b++) for (let p = 0; a + b + p <= N; p++) {
      const q = N - a - b - p, o = [...Array(a).fill(0), ...Array(b).fill(1), ...Array(p).fill(2), ...Array(q).fill(3)] as Obj[];
      for (const rb of [false, true]) todo.push([o, rb, fact(N) / (fact(a) * fact(b) * fact(p) * fact(q))]);
    }
    const over = HS.map(() => 0), worst = HS.map(() => 0);
    let i = 0;
    const chunk = () => {
      for (const t0 = performance.now(); i < todo.length && performance.now() - t0 < 12; i++) {
        const [o, rb, mult] = todo[i], { hs } = evalAll(o, encode(o, rb));
        hs.forEach((v, k) => { if (v > hs[0]) { over[k] += mult; worst[k] = Math.max(worst[k], v - hs[0]); } });
      }
      check.textContent = `checking… ${i} / ${todo.length}`;
      if (i < todo.length) { raf = requestAnimationFrame(chunk); return; }
      const total = todo.reduce((n, t) => n + t[2], 0);
      verdict = HS.map((_, k) => (over[k] ? `above the true cost in ${over[k]} of ${total} states (by up to ${worst[k]})` : `never above the true cost (${total} states)`));
      check.textContent = 'Check every state (admissible?)';
      update();
      opts.onEvent?.(`[${c.title}] checked all ${total} states: ` + HS.map((h, k) => `${h.label}: ${verdict![k]}`).join('; '));
    };
    raf = requestAnimationFrame(chunk);
  }

  function update(quiet = false) {
    const st = encode(objs, robotB);
    items.forEach((g, i) => {
      const [x, y] = slot(i, objs[i] === 1 || objs[i] === 2);
      g.style.transform = `translate(${x}px, ${y}px)`;
      g.setAttribute('class', `plh-o${objs[i] >= 2 ? ' painted' : ''}`);
    });
    robot.style.transform = `translate(${20 + (robotB ? 160 : 0) + 118}px, 70px)`;
    const { hs, plans: ps } = evalAll(objs, st), star = hs[0];
    for (const a of ['x1', 'x2']) hstar.setAttribute(a, String(BX + star * SC));
    rows.forEach((r, k) => {
      r.b.setAttribute('width', String(Math.max(1, hs[k] * SC)));
      r.b.setAttribute('class', `plh-bar${k === 0 ? ' star' : hs[k] > star ? ' over' : ''}`);
      r.v.setAttribute('x', String(BX + hs[k] * SC + 6));
      r.v.textContent = String(hs[k]);
      r.mark.textContent = !verdict || k === 0 ? '' : verdict[k].startsWith('never') ? '✓' : '✗';
      r.mark.setAttribute('class', `plh-mark${verdict && k && !verdict[k].startsWith('never') ? ' no' : ' yes'}`);
    });
    let py = 236;
    HS.map((h, k) => [h, ps[k]] as const).filter(([, p]) => p).forEach(([h, p], k) => {
      const t = plans[k];
      t.setAttribute('y', String(py));
      t.replaceChildren();
      s(t, 'tspan', { x: 20, class: 'head' }, `${h.label.replace(' (true cost, BFS)', ': a shortest real plan')} (${p!.length} actions)`);
      let line = '';
      const lines: string[] = [];
      for (const a of p!.length ? p! : ['(the goal already holds)']) { if ((line + a).length > 110) { lines.push(line); line = ''; } line += (line ? ', ' : '') + a; }
      lines.push(line);
      lines.forEach(l => s(t, 'tspan', { x: 20, dy: 16 }, l));
      py += 22 + lines.length * 16;
    });
    const U = count(objs, 0), P = count(objs, 2), above = HS.map((h, k) => [h.label, hs[k]] as const).filter(([, v]) => v > star);
    c.cap.innerHTML = md(`**True cost $h^{\\ast} = ${star}$**, found by breadth-first search on the real problem. ` +
      `The exam's $2\\,U_s(A) + P_s(B) = 2 \\cdot ${U} + ${P} = ${hs[1]}$` + (hs[1] <= star ? ' does not exceed it' : ' **exceeds** it') + `; $3\\,U_s(A) + P_s(B) = ${hs[2]}$` +
      (hs[2] > star ? ' **overestimates**: one paint serves up to three objects, so an object does not cost three actions of its own.' : ' does not exceed it in this state.') +
      ` **Relaxed problems** are solved exactly too: ignoring delete lists, nothing ever leaves A (robot and objects stay "at A" too), so the relaxed plan only carries and paints: $h = ${hs[3]}$; ` +
      `ignoring preconditions, paint works anywhere: $h = ${hs[5]}$. A relaxed problem has more solutions, so its optimal cost never exceeds $h^{\\ast}$: both are admissible, but far below it. ` +
      (above.length ? `Here ${above.map(([l]) => l).join(', ')} ${above.length > 1 ? 'are' : 'is'} above $h^{\\ast}$ (red). ` : 'No bar is above $h^{\\ast}$ in this state. ') +
      (verdict ? 'Over **all** states: ' + HS.slice(1).map((h, k) => `${h.label} ${verdict![k + 1]}`).join('; ') + '.' : 'Admissible means **never** above $h^{\\ast}$, in any state: press **Check every state**.'));
    if (!quiet) opts.onEvent?.(`[${c.title}] state: ${objs.map((o, i) => `O${i + 1} ${['A', 'B', 'B painted', 'A painted'][o]}`).join(', ')}, robot ${robotB ? 'B' : 'A'}; ` +
      HS.map((h, k) => `${h.label} = ${hs[k]}`).join(', '));
  }
  update(true);
  return { destroy() { cancelAnimationFrame(raf); } };
}

const CSS = `
.plh-loc{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:1.5}
.plh-o{cursor:pointer;transition:transform .45s cubic-bezier(.2,.7,.2,1)}
.plh-o circle{fill:var(--panel);stroke:var(--text-2);stroke-width:2;transition:fill .25s}
.plh-o text{font:600 11.5px var(--font);fill:var(--text);text-anchor:middle;pointer-events:none}
.plh-o.painted circle{fill:var(--warn);stroke:var(--warn)}
.plh-o.painted text{fill:#fff}
.plh-o:focus{outline:none}
.plh-o:focus-visible circle{stroke:var(--accent);stroke-width:3}
.plh-r{cursor:pointer;transition:transform .45s cubic-bezier(.2,.7,.2,1)}
.plh-r rect{fill:var(--accent)}
.plh-r text{font:700 13px var(--font);fill:#fff;text-anchor:middle;pointer-events:none}
.plh-r:focus{outline:none}
.plh-bar{fill:var(--accent);opacity:.85;transition:width .35s}
.plh-bar.star{fill:var(--ok)}
.plh-bar.over{fill:var(--bad)}
.plh-star{stroke:var(--ok);stroke-width:1.5;stroke-dasharray:4 3;transition:x1 .35s,x2 .35s}
.plh-v{font:600 12px var(--mono);fill:var(--text)}
.plh-mark{font:600 11px var(--font)}
.plh-mark.yes{fill:var(--ok)}
.plh-mark.no{fill:var(--bad)}
.plh-plan{font:11px var(--mono);fill:var(--text-2)}
.plh-plan .head{font:600 12px var(--font);fill:var(--text)}
`;
