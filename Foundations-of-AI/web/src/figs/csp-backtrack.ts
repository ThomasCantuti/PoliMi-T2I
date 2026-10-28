// Black-box depth-first search vs backtracking on the map of Australia (slides p. 262–263, 272–275): side-by-side simulation.
// Same variable order, same value order; the left one only tests complete assignments, the right one checks constraints as it goes.
import { CENTER, EDGES, MAP, proj } from './csp-graph';
import { bar, card, md, s, style, type FigOptions } from './shell';

const PRESETS: [string, string[], string[]][] = [
  ["the slides' order WA, NT, SA, T, NSW, V, Q (p. 263)", ['WA', 'NT', 'SA', 'T', 'NSW', 'V', 'Q'], ['R', 'G', 'B']],
  ['order WA, NT, Q, NSW, V, SA, T', ['WA', 'NT', 'Q', 'NSW', 'V', 'SA', 'T'], ['R', 'G', 'B']],
  ['only 2 colors (no solution), order WA, NT, Q, NSW, V, SA, T', ['WA', 'NT', 'Q', 'NSW', 'V', 'SA', 'T'], ['R', 'G']],
];
const TOKEN: Record<string, string> = { R: 'var(--bad)', G: 'var(--ok)', B: 'var(--accent)' };
const NAME: Record<string, string> = { R: 'red', G: 'green', B: 'blue' };
const SPEEDS: Record<string, number> = { slow: 0.08, normal: 0.5, fast: 4, turbo: 25 };
const SC = 0.66, PW = 385;

type Ev = { kind: 'assign' | 'undo' | 'reject' | 'test'; v: string; c: string; ok?: boolean; clash: string[][] };
interface Panel { a: Record<string, string>; gen: Generator<Ev, boolean>; done: boolean; found: boolean; assigns: number; undos: number; tests: number; rejects: number; last: Ev | null }

const clashes = (a: Record<string, string>, only?: string) => EDGES.filter(([x, y]) => a[x] && a[x] === a[y] && (!only || x === only || y === only));

/** check = false: depth-first search on the black box, goal test on complete assignments only; true: backtracking (p. 275). */
function* search(order: string[], cols: string[], check: boolean, a: Record<string, string>, i = 0): Generator<Ev, boolean> {
  if (i === order.length) {
    const bad = clashes(a);
    yield { kind: 'test', v: '', c: '', ok: !bad.length, clash: bad };
    return !bad.length;
  }
  const v = order[i];
  for (const c of cols) {
    if (check) {
      const bad = clashes({ ...a, [v]: c }, v);
      if (bad.length) { yield { kind: 'reject', v, c, clash: bad }; continue; }
    }
    a[v] = c;
    yield { kind: 'assign', v, c, clash: [] };
    if (yield* search(order, cols, check, a, i + 1)) return true;
    delete a[v];
    yield { kind: 'undo', v, c, clash: [] };
  }
  return false;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-cs-bt-css', CSS);
  const c = card(el, 'simulation', 'Depth-first search on a black box vs backtracking', '0 0 780 372');
  let preset = 0, panels: Panel[] = [], running = false, raf = 0, acc = 0, speed = 'normal', said = '';
  const V = Object.keys(MAP), view = [0, 1].map(i => {
    const x0 = i * (PW + 10);
    s(c.svg, 'text', { x: x0 + 8, y: 20, class: 'fg-h2' }, i ? 'Backtracking' : 'Depth-first search, black box');
    s(c.svg, 'text', { x: x0 + 8, y: 38, class: 'fg-m' }, i ? 'checks every constraint as soon as it can (p. 273)' : 'goal test on complete assignments only (p. 263)');
    const g = s(c.svg, 'g', { transform: `translate(${x0 + 50},${42}) scale(${SC})` });
    const reg: Record<string, SVGPathElement> = {}, edge = new Map<string, SVGLineElement>();
    for (const v of V) reg[v] = s(g, 'path', { class: 'csb-reg', d: 'M' + MAP[v].map(p => proj(p).map(n => n.toFixed(1)).join(' ')).join('L') + 'Z' });
    for (const [a, b] of EDGES) {
      const [x1, y1] = proj(CENTER[a]), [x2, y2] = proj(CENTER[b]);
      edge.set(a + b, s(g, 'line', { x1, y1, x2, y2, class: 'csb-clash' }));
    }
    for (const v of V) { const [x, y] = proj(CENTER[v]); s(g, 'text', { x, y: y + 5, class: 'csb-name' }, v); }
    const chips = s(c.svg, 'g'), st = [0, 1, 2].map(j => s(c.svg, 'text', { x: x0 + 8, y: 316 + j * 19, class: j ? 'fg-t' : 'csb-ev' }));
    return { x0, reg, edge, chips, st };
  });

  function reset() {
    const [, order, cols] = PRESETS[preset];
    panels = [false, true].map(check => {
      const a: Record<string, string> = {};
      return { a, gen: search(order, cols, check, a), done: false, found: false, assigns: 0, undos: 0, tests: 0, rejects: 0, last: null };
    });
  }
  function step(p: Panel) {
    if (p.done) return;
    const r = p.gen.next();
    if (r.done) { p.done = true; p.found = r.value; p.last = null; return; }
    const e = (p.last = r.value);
    if (e.kind === 'assign') p.assigns++;
    else if (e.kind === 'undo') p.undos++;
    else if (e.kind === 'reject') p.rejects++;
    else if (e.kind === 'test') p.tests++;
  }

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const one = document.createElement('button');
  one.className = 'btn sm';
  one.textContent = 'Step';
  one.onclick = () => { pause(); panels.forEach(step); render(); };
  const rs = document.createElement('button');
  rs.className = 'btn sm';
  rs.textContent = '↺ Reset';
  rs.onclick = () => { pause(); reset(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="slow">slow</option><option value="normal" selected>normal</option><option value="fast">fast</option><option value="turbo">turbo</option>';
  sp.onchange = () => { speed = sp.value; };
  const pr = document.createElement('select');
  pr.innerHTML = PRESETS.map(([name], k) => `<option value="${k}">${name}</option>`).join('');
  pr.onchange = () => { preset = +pr.value; pause(); reset(); render(); opts.onEvent?.(`[${c.title}] ${PRESETS[preset][0]}`); };
  ctl.append(run, one, rs, sp, pr);

  function play() {
    if (running) return;
    if (panels.every(p => p.done)) reset();
    running = true;
    const frame = () => {
      for (acc += SPEEDS[speed]; acc >= 1; acc--) panels.forEach(step);
      if (panels.every(p => p.done)) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const [, order, cols] = PRESETS[preset];
    panels.forEach((p, i) => {
      const w = view[i], e = p.last;
      for (const v of V) {
        w.reg[v].style.fill = p.a[v] ? `color-mix(in srgb, ${TOKEN[p.a[v]]} 62%, var(--panel-2))` : '';
        w.reg[v].classList.toggle('rej', e?.kind === 'reject' && e.v === v);
      }
      for (const [k, line] of w.edge) line.classList.toggle('on', !!e?.clash.some(([a, b]) => a + b === k));
      w.chips.replaceChildren();
      order.forEach((v, j) => {
        const x = w.x0 + 8 + j * 53, val = p.a[v];
        s(w.chips, 'rect', { x, y: 274, width: 48, height: 22, rx: 5, class: 'csb-chip', style: val ? `fill:color-mix(in srgb, ${TOKEN[val]} 62%, var(--panel-2))` : '' });
        s(w.chips, 'text', { x: x + 24, y: 289, class: 'csb-ct' }, val ? `${v}=${val}` : v);
      });
      w.st[0].textContent = !e ? (p.done ? (p.found ? '✓ solution found' : '✗ no solution: every value of the first variable failed') : 'ready') :
        e.kind === 'assign' ? `${e.v} = ${NAME[e.c]}` : e.kind === 'undo' ? `undo ${e.v} = ${NAME[e.c]} (backtrack)` :
        e.kind === 'reject' ? `${e.v} = ${NAME[e.c]}? clashes with ${e.clash.map(([a, b]) => (a === e.v ? b : a)).join(', ')}: skip` :
        e.ok ? 'complete and consistent: goal!' : `complete, but ${e.clash.length} constraint${e.clash.length > 1 ? 's' : ''} violated: goal test fails`;
      w.st[0].classList.toggle('bad', e?.kind === 'reject' || (e?.kind === 'test' && !e.ok));
      w.st[1].textContent = `${p.assigns} assignments · ${p.undos} undone`;
      w.st[2].textContent = i ? `${p.rejects} values rejected by the check` : `${p.tests} complete assignments tested (of ${cols.length ** order.length})`;
    });
    run.textContent = running ? '⏸ Pause' : panels.every(p => p.done) ? '⏵ Replay' : panels[0].assigns ? '⏵ Continue' : '⏵ Run';
    explain();
  }

  // the caption follows the stage of the race; it changes only when the stage changes
  function explain() {
    const [dfs, bt] = panels, cols = PRESETS[preset][2], n = PRESETS[preset][1].length;
    const [key, text] = !dfs.assigns
      ? ['idle', 'Same variable order, same value order (' + cols.map(x => NAME[x]).join(', ') + '). **Left:** the state is a black box, so depth-first search assigns ' +
        'anything and only the goal test, on a complete assignment, looks at the constraints. **Right:** backtracking checks each new value against the assigned neighbors ' +
        'before going deeper (an *incremental goal test*). Press **Run** or **Step**.']
      : !bt.done
      ? ['run', 'Each tick both make one move. A red dashed line is a violated constraint: backtracking sees it **at once** and skips the value; ' +
        'the black-box search only sees it when all 7 regions are colored, and then it undoes the last choice and tries the next complete coloring.']
      : !dfs.done
      ? ['btdone', `**Backtracking is done after ${bt.assigns} assignments** ` + (bt.found ? `(${bt.undos} undone): a solution.` : `: no solution exists with ${cols.length} colors.`) +
        ' The black-box search is still enumerating complete colorings in the same order: try **turbo**.']
      : [`end${preset}`, `**Black box: ${dfs.assigns} assignments and ${dfs.tests} complete colorings tested** (out of $${cols.length}^${n} = ${cols.length ** n}$). ` +
        `**Backtracking: ${bt.assigns} assignments.** ` + (bt.found
          ? `Both return the same solution, the first consistent one in the same order; the constraints only told backtracking *earlier*. ` +
            (!bt.undos ? 'With this order it never has to undo anything.' : preset === 0 ? `Its ${bt.undos} undone assignments are the dead end of the slides' order: with NSW = red, Q has no color left.` : '')
          : `Both prove that 2 colors are not enough, but the black box had to try every one of the ${cols.length ** n} complete colorings; backtracking gave up after ${bt.assigns} assignments, as soon as every value of WA had led to a dead end.`)];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  reset();
  render();
  return { destroy: pause };
}

const CSS = `
.csb-reg{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:1.4;transition:fill .2s}
.csb-reg.rej{stroke:var(--bad);stroke-width:3;stroke-dasharray:6 4}
.csb-name{font-size:14px;font-weight:700;fill:var(--text);text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:var(--panel);stroke-width:4px}
.csb-clash{stroke:var(--bad);stroke-width:4;stroke-dasharray:7 5;opacity:0;transition:opacity .15s}
.csb-clash.on{opacity:1}
.csb-chip{fill:var(--panel-2);stroke:var(--border)}
.csb-ct{font:600 11px var(--mono);fill:var(--text);text-anchor:middle}
.csb-ev{font-size:13px;font-weight:600;fill:var(--text)}
.csb-ev.bad{fill:var(--bad)}
`;
