// Eight queens, two formulations of the same problem (slides p. 71–75): both search trees are walked depth-first at the same pace.
// Every count is enumerated live or computed (Σ falling factorials, Σ binomials); 2057 (slides p. 75) is checked at mount.
import { bar, card, md, s, style, type FigOptions } from './shell';
import { btn, fmt, pick, ticker } from './search-kit';

const BX = [20, 410], BY = 52, BS = 176;
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sci = (x: number) => {
  const e = Math.floor(Math.log10(x));
  return x < 1e9 ? fmt(x) : `${(x / 10 ** e).toFixed(1)}×10${[...String(e)].map(d => SUP[+d]).join('')}`;
};
const falling = (m: number, k: number) => { let p = 1; for (let i = 0; i < k; i++) p *= m - i; return p; };
const binom = (m: number, k: number) => falling(m, k) / falling(k, k);
const attack = (n: number, a: number, b: number) => {
  const ra = Math.floor(a / n), ca = a % n, rb = Math.floor(b / n), cb = b % n;
  return ra === rb || ca === cb || Math.abs(ra - rb) === Math.abs(ca - cb);
};
const safe = (n: number, q: number[]) => q.every((a, i) => q.slice(i + 1).every(b => !attack(n, a, b)));

/** Children (squares) of a node, in order: the two formulations differ only here. */
const KIDS = {
  naive: (n: number, q: number[]) => Array.from({ length: n * n }, (_, sq) => sq).filter(sq => !q.includes(sq)),
  incremental: (n: number, q: number[]) => Array.from({ length: n }, (_, r) => r * n + q.length).filter(sq => q.every(a => !attack(n, a, sq))),
};
type Form = keyof typeof KIDS;

/** Preorder depth-first walk with an explicit stack; `next()` moves to the next node of the search tree, false at the end. */
function walker(n: number, form: Form) {
  const q: number[] = [], it: number[][] = [], pos: number[] = [];
  let started = false;
  return {
    q,
    next(): boolean {
      if (!started) { started = true; it.push(KIDS[form](n, q)); pos.push(0); return true; }
      while (it.length) {
        const top = it.length - 1;
        if (pos[top] < it[top].length) {
          q.push(it[top][pos[top]++]);
          it.push(q.length < n ? KIDS[form](n, q) : []);
          pos.push(0);
          return true;
        }
        it.pop(); pos.pop(); q.pop();
      }
      return false;
    },
  };
}

/** Size of the whole incremental tree (= its number of states: one path per state). */
export function incrementalSize(n: number) {
  const w = walker(n, 'incremental');
  let nodes = 0, sols = 0;
  while (w.next()) { nodes++; if (w.q.length === n) sols++; }
  return { nodes, sols };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fmq-css', CSS);
  const c = card(el, 'simulation', 'Eight queens: same problem, two formulations, two very different search trees', '0 0 780 266');
  const eight = incrementalSize(8);
  if (eight.nodes !== 2057 || eight.sols !== 92) console.error(`search-queens: incremental 8×8 has ${eight.nodes} states and ${eight.sols} solutions (slides: 2057, 92)`);
  let n = 4, said = '', busy = 0;
  const TITLE = ['1st formulation: any empty square', '2nd formulation: next column, safe squares'];
  const ACT = ['actions(s): every empty square', 'actions(s): safe squares of the next column'];
  interface Side { form: Form; w: ReturnType<typeof walker>; nodes: number; total: number; states: Set<number> | null; sols: number; lastGoal: number[]; done: boolean;
    sq: SVGRectElement[]; qs: SVGTextElement[]; dots: SVGCircleElement[]; val: SVGTextElement[]; fill: SVGRectElement; eta: SVGTextElement }
  const sides: Side[] = (['naive', 'incremental'] as Form[]).map((form, k) => {
    const x = BX[k] + BS + 16, g = s(c.svg, 'g');
    s(g, 'text', { x: BX[k], y: 18, class: 'fg-h2' }, TITLE[k]);
    s(g, 'text', { x: BX[k], y: 38, class: 'fg-m' }, ACT[k]);
    const val = ['tree nodes generated', 'distinct states', 'goal nodes found'].map((lab, i) => {
      s(g, 'text', { x, y: BY + 14 + i * 46, class: 'fg-m' }, lab);
      return s(g, 'text', { x, y: BY + 32 + i * 46, class: 'fmq-v' });
    });
    s(g, 'rect', { x, y: BY + 140, width: 168, height: 8, rx: 4, class: 'fmq-track' });
    return { form, w: walker(4, form), nodes: 0, total: 0, states: null, sols: 0, lastGoal: [], done: false, sq: [], qs: [], dots: [], val,
      fill: s(g, 'rect', { x, y: BY + 140, width: 0, height: 8, rx: 4, class: 'fmq-fill' }), eta: s(g, 'text', { x, y: BY + 166, class: 'fg-m' }) };
  });
  const boards = sides.map(() => s(c.svg, 'g'));
  const foot = s(c.svg, 'text', { x: 20, y: 254, class: 'fg-m' });

  const ctl = bar(c);
  const run = btn(ctl, '', () => (tick.on ? tick.stop() : start()), 'primary');
  btn(ctl, '↺ Reset', () => { tick.stop(); reset(); });
  const speed = pick(ctl, [['watch', 'watch: 1 node per step'], ['fast', '200 nodes per frame'], ['max', 'as fast as possible']], 'watch', () => render(), 'Speed');
  pick(ctl, [['4', '4×4 board'], ['5', '5×5 board'], ['8', '8×8 board (slides)']], '4', v => { tick.stop(); n = +v; reset(); }, 'Board');
  const tick = ticker(step, () => (speed.value === 'watch' ? 420 : 0), () => render());

  function start() { if (sides.every(sd => sd.done)) reset(); tick.start(); }
  function reset() {
    busy = 0;
    sides.forEach((sd, k) => {
      sd.w = walker(n, sd.form);
      sd.nodes = sd.sols = 0;
      sd.lastGoal = [];
      sd.done = false;
      sd.states = sd.form === 'naive' && n <= 5 ? new Set() : null;
      sd.total = sd.form === 'naive' ? Array.from({ length: n + 1 }, (_, i) => falling(n * n, i)).reduce((a, b) => a + b) : incrementalSize(n).nodes;
      drawBoard(sd, boards[k], BX[k]);
    });
    render();
  }
  function drawBoard(sd: Side, g: SVGGElement, x: number) {
    g.replaceChildren();
    const C = BS / n;
    sd.sq = []; sd.qs = []; sd.dots = [];
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), col = i % n, cx = x + col * C, cy = BY + r * C;
      sd.sq.push(s(g, 'rect', { x: cx, y: cy, width: C, height: C, class: (r + col) % 2 ? 'fmq-d' : 'fmq-l' }));
      sd.dots.push(s(g, 'circle', { cx: cx + C / 2, cy: cy + C / 2, r: C * 0.12, class: 'fmq-dot hide' }));
      sd.qs.push(s(g, 'text', { x: cx + C / 2, y: cy + C * 0.72, 'font-size': C * 0.66, class: 'fmq-q hide' }, '♛'));
    }
  }
  function advance(sd: Side) {
    if (sd.done) return;
    if (!sd.w.next()) { sd.done = true; return; }
    sd.nodes++;
    const q = sd.w.q;
    if (sd.states) { let key = 0; for (const a of q) key += 2 ** a; sd.states.add(key); }
    if (q.length === n && (sd.form === 'incremental' || safe(n, q))) { sd.sols++; sd.lastGoal = [...q]; }
  }
  function step(): boolean {
    const t = performance.now();
    if (speed.value === 'watch') sides.forEach(advance);
    else if (speed.value === 'fast') for (let i = 0; i < 200; i++) sides.forEach(advance);
    else while (performance.now() - t < 14) for (let i = 0; i < 500; i++) sides.forEach(advance);
    busy += performance.now() - t;
    render();
    if (sides.every(sd => sd.done)) {
      const [a, b] = sides;
      if (a.nodes !== a.total || b.nodes !== b.total) console.error(`search-queens: walked ${a.nodes}/${b.nodes} nodes, computed ${a.total}/${b.total}`);
      if (a.states && a.states.size !== Array.from({ length: n + 1 }, (_, i) => binom(n * n, i)).reduce((x, y) => x + y)) console.error('search-queens: naive state count differs from Σ C(n², k)');
      return false;
    }
    return true;
  }

  function render() {
    for (const sd of sides) {
      const live = sd.nodes > 0 && !sd.done, q = sd.done ? sd.lastGoal : sd.w.q, last = q[q.length - 1];
      const next = live && q.length < n ? (sd.form === 'naive' ? [] : KIDS.incremental(n, q)) : [];
      sd.qs.forEach((t, i) => {
        const on = (live || sd.done) && q.includes(i);
        t.classList.toggle('hide', !on);
        t.classList.toggle('last', on && i === last && live);
        t.classList.toggle('sol', on && sd.done);
        t.classList.toggle('bad', on && q.some(b => b !== i && attack(n, i, b)));
      });
      sd.dots.forEach((d, i) => d.classList.toggle('hide', !next.includes(i)));
      const states = sd.states ? sd.states.size : sd.form === 'incremental' ? sd.nodes : -1;
      const naiveStates = Array.from({ length: n + 1 }, (_, i) => binom(n * n, i)).reduce((x, y) => x + y);
      sd.val[0].textContent = `${fmt(sd.nodes)} of ${sci(sd.total)}`;
      sd.val[1].textContent = states >= 0 ? `${fmt(states)} of ${fmt(sd.form === 'naive' ? naiveStates : sd.total)}` : `not tracked (${sci(naiveStates)})`;
      sd.val[2].textContent = fmt(sd.sols);
      sd.val[0].classList.toggle('ok', sd.done);
      sd.fill.setAttribute('width', String(168 * Math.min(1, sd.nodes / sd.total)));
      const rate = busy > 0 ? sd.nodes / (busy / 1000) : 0, left = (sd.total - sd.nodes) / rate;
      sd.eta.textContent = sd.done ? 'done (last solution shown)' : rate && speed.value !== 'watch' && left > 2 ? `still to go at this pace: ${dur(left)}` : '';
    }
    foot.textContent = n === 8 ? `8×8: the slides' 64 × 63 × … × 57 = ${sci(falling(64, 8))} counts the depth-8 nodes alone; the 2nd formulation has ${fmt(sides[1].total)} states.`
      : `${n}×${n}: the 1st tree is Σ ${n * n}!/(${n * n}−k)! over k = 0…${n}; the 2nd has one node per state.`;
    run.textContent = tick.on ? '⏸ Pause' : sides.every(sd => sd.done) ? '⏵ Run again' : sides[0].nodes ? '⏵ Continue' : '⏵ Run both';
    explain();
  }
  const dur = (sec: number) => sec < 120 ? `${Math.ceil(sec)} s` : sec < 3 * 3600 ? `${Math.round(sec / 60)} min` : sec < 3 * 86400 ? `${Math.round(sec / 3600)} h`
    : sec < 3 * 365 * 86400 ? `${Math.round(sec / 86400)} days` : `${sci(Math.round(sec / (365 * 86400)))} years`;

  function explain() {
    const [a, b] = sides;
    const [stage, text] = !a.nodes
      ? ['idle', `**Same goal, two formulations.** Left: a state is *any* arrangement of 0…${n} queens and an action adds a queen anywhere. ` +
        `Right: queens go column by column, only on squares no queen attacks (dots = the actions). Press **Run both**: the two trees are walked depth-first at the same pace.`]
      : !b.done
      ? ['both', '**Both searches are running.** Left, red queens attack each other: the 1st formulation happily builds arrangements that can never become a solution, ' +
        'and reaches the same arrangement again in another order (tree nodes > distinct states).']
      : !a.done
      ? [`left${n}`, `**The 2nd formulation is done: ${fmt(b.total)} nodes, ${fmt(b.sols)} solutions**, every node a different consistent state reached by exactly one path. ` +
        (n === 8 ? `The 1st has ${sci(a.total)} nodes to walk: watch its estimate of the time still needed, at the fastest speed.` : `The 1st is still walking its ${fmt(a.total)} nodes: switch to a faster speed.`)]
      : [`done${n}`, `**Both trees walked.** 1st formulation: **${fmt(a.total)} nodes** over ${fmt(a.states?.size ?? 0)} states and ${fmt(a.sols)} goal nodes ` +
        `(each of the ${b.sols} solutions is reached in ${n}! = ${falling(n, n)} orders). 2nd formulation: **${fmt(b.total)} nodes**, ${b.sols} goal nodes. ` +
        'Fixing the order of the placements and moving the constraint into `actions` is what shrinks the space.'];
    if (stage === said) return;
    said = stage;
    c.cap.innerHTML = md(text);
    if (stage !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  reset();
  return { destroy: () => tick.stop() };
}

const CSS = `
.fmq-l{fill:var(--panel-2)}
.fmq-d{fill:var(--panel-3)}
.fmq-q{fill:var(--text);text-anchor:middle;pointer-events:none}
.fmq-q.last{fill:var(--accent)}
.fmq-q.bad{fill:var(--bad)}
.fmq-q.sol{fill:var(--ok)}
.fmq-dot{fill:var(--ok)}
.fmq-v{font:600 14px var(--mono);fill:var(--text)}
.fmq-v.ok{fill:var(--ok)}
.fmq-track{fill:var(--panel-3)}
.fmq-fill{fill:var(--accent)}
`;
