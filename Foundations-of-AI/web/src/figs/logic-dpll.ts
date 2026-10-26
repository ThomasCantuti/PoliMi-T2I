// DPLL on the exam of 8 Sep 2025, run for real with the choices of the exam table (unit clauses before pure symbols,
// split on the first symbol, true first): one frame per row of the table.
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

const CLAUSES = [['A', 'B'], ['¬A', '¬D'], ['C', 'D'], ['B', 'C'], ['A', '¬C'], ['¬B', 'D'], ['¬A', '¬C']];
const SYMBOLS = ['A', 'B', 'C', 'D'];
type Model = Record<string, boolean>;

const sym = (l: string) => l.replace('¬', ''), val = (l: string, m: Model) => (sym(l) in m ? m[sym(l)] !== l.startsWith('¬') : undefined);
const lit = (p: string, v: boolean) => (v ? p : '¬' + p);
const tex = (l: string) => l.replace('¬', '\\neg ');
/** The clause as the exam table writes it: T once satisfied, ⊥ once false, else the literals not yet false. */
export function reduce(cl: string[], m: Model): string {
  if (cl.some(l => val(l, m) === true)) return 'T';
  const rest = cl.filter(l => val(l, m) === undefined);
  return rest.length ? rest.join(' ∨ ') : '⊥';
}
function unit(m: Model): [string, number] | null {
  for (const [i, cl] of CLAUSES.entries()) { const r = reduce(cl, m); if (r !== 'T' && r !== '⊥' && !r.includes('∨')) return [r, i]; }
  return null;
}
function pure(m: Model): string | null {
  const open = CLAUSES.filter(cl => reduce(cl, m) !== 'T').flat().filter(l => val(l, m) === undefined);
  for (const p of SYMBOLS) {
    if (p in m) continue;
    const signs = new Set(open.filter(l => sym(l) === p).map(l => l.startsWith('¬')));
    if (signs.size === 1) return lit(p, ![...signs][0]);
  }
  return null;
}

interface F extends Frame { m: Model; path: string[]; how: string; conflict: boolean; sat: boolean }

function build(): F[] {
  const frames: F[] = [];
  let pureNoted = false;
  const show = (m: Model, path: string[], how: string, cap: string) => {
    const red = CLAUSES.map(cl => reduce(cl, m));
    const conflict = red.includes('⊥'), sat = red.every(r => r === 'T');
    frames.push({ m: { ...m }, path: [...path], how, conflict, sat, group: path[0] ?? 'root', cap });
    return { conflict, sat };
  };
  function dpll(m: Model, path: string[]): boolean {
    const red = CLAUSES.map(cl => reduce(cl, m));
    if (red.every(r => r === 'T')) return true;
    if (red.includes('⊥')) return false;
    const u = unit(m);
    if (u) {
      const [l, i] = u, p = pure(m);
      const r = show({ ...m, [sym(l)]: !l.startsWith('¬') }, [...path, l], 'unit',
        `**Row ${frames.length} · unit clause** $${CLAUSES[i].map(tex).join(' \\vee ')}$ has only $${tex(l)}$ left: set $${tex(l)}$.` +
          (p && !pureNoted && (pureNoted = true) ? ` ($${tex(p)}$ is pure here too: AIMA would take the pure symbol first; both choices are accepted.)` : ''));
      return after(r, { ...m, [sym(l)]: !l.startsWith('¬') }, [...path, l]);
    }
    const p = pure(m);
    if (p) {
      const r = show({ ...m, [sym(p)]: !p.startsWith('¬') }, [...path, p], 'pure',
        `**Row ${frames.length} · pure symbol** ${sym(p)} appears only as $${tex(p)}$ in the open clauses: set $${tex(p)}$.`);
      return after(r, { ...m, [sym(p)]: !p.startsWith('¬') }, [...path, p]);
    }
    const x = SYMBOLS.find(q => !(q in m))!;
    for (const v of [true, false]) {
      const l = lit(x, v);
      const r = show({ ...m, [x]: v }, [...path, l], 'split', v
        ? `**Row ${frames.length} · split on ${x}.** No unit clause and no pure symbol: DPLL must guess. Try $${x} = true$ first.`
        : `**Row ${frames.length} · backtrack** to the last split and try the other value: $${x} = false$.`);
      if (after(r, { ...m, [x]: v }, [...path, l])) return true;
    }
    return false;
  }
  function after(r: { conflict: boolean; sat: boolean }, m: Model, path: string[]): boolean {
    const f = frames[frames.length - 1];
    if (r.conflict) { f.cap += ` A clause is now false (⊥): **dead end**.`; return false; }
    if (r.sat) { f.cap += ` Every clause is true: **satisfiable**, model $\\{${SYMBOLS.map(q => tex(lit(q, m[q]))).join(', ')}\\}$.`; return true; }
    return dpll(m, path);
  }
  show({}, [], 'root', '**Start.** One column per clause. At the root no symbol is pure and no clause is unit, so DPLL must split.');
  dpll({}, []);
  return frames;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-dp-css', '.dp-c rect{fill:var(--panel-2);stroke:var(--border);transition:fill .25s,stroke .25s}' +
    '.dp-c .o{font-size:11px;fill:var(--muted);text-anchor:middle}.dp-c .r{font:600 14px var(--mono);fill:var(--text);text-anchor:middle}' +
    '.dp-c.t rect{fill:var(--ok-soft);stroke:var(--ok)}.dp-c.t .r{fill:var(--ok)}.dp-c.f rect{fill:var(--bad-soft);stroke:var(--bad)}.dp-c.f .r{fill:var(--bad)}' +
    '.dp-c.u rect{stroke:var(--warn);stroke-width:2}' +
    '.dp-n rect{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:fill .25s,stroke .25s,opacity .3s}' +
    '.dp-n text{font:600 13px var(--mono);fill:var(--text);text-anchor:middle}.dp-n.cur rect{fill:var(--accent-soft);stroke:var(--accent)}' +
    '.dp-n.x rect{fill:var(--bad-soft);stroke:var(--bad)}.dp-n.ok rect{fill:var(--ok-soft);stroke:var(--ok)}.dp-n.old{opacity:.45}' +
    '.dp-h{font-size:11px;fill:var(--muted)}');
  const frames = build();
  const c = card(el, 'stepper', 'DPLL: early termination, unit clauses, pure symbols, splitting', '0 0 720 370');
  // top: one chip per clause, reduced by the current partial model (the exam table, one row at a time)
  const CW = 94, chips = CLAUSES.map((cl, i) => {
    const x = 14 + i * (CW + 7), g = s(c.svg, 'g', { class: 'dp-c' });
    s(g, 'rect', { x, y: 14, width: CW, height: 54, rx: 9 });
    s(g, 'text', { x: x + CW / 2, y: 32, class: 'o' }, cl.join(' ∨ '));
    return { g, r: s(g, 'text', { x: x + CW / 2, y: 56, class: 'r' }) };
  });
  // bottom: the search tree, one branch per value of the split symbol
  const paths = frames.map(f => f.path);
  const key = (p: string[]) => p.join(',');
  const nodes = new Map<string, { g: SVGGElement; edge: SVGLineElement | null; how: SVGTextElement | null }>();
  const XS = [360, 230, 490], NY = (d: number) => 112 + d * 50;
  for (const p of paths) {
    if (nodes.has(key(p))) continue;
    const x = p.length ? XS[p[0].startsWith('¬') ? 2 : 1] : XS[0], y = NY(p.length);
    const parent = p.length ? (p.length === 1 ? XS[0] : x) : 0, py = NY(p.length - 1);
    const f = frames.find(fr => key(fr.path) === key(p))!;
    const edge = p.length ? s(c.svg, 'line', { x1: parent, y1: py + 14, x2: x, y2: y - 15, class: 'fg-e' }) : null;
    const left = x < XS[0], mx = (parent + x) / 2;
    const how = p.length ? s(c.svg, 'text', { x: left ? mx - 8 : mx + 8, y: (py + y) / 2 + (p.length === 1 ? -6 : 4), class: 'dp-h', 'text-anchor': left ? 'end' : 'start' }, f.how) : null;
    const g = s(c.svg, 'g', { class: 'dp-n' });
    s(g, 'rect', { x: x - 30, y: y - 14, width: 60, height: 28, rx: 8 });
    s(g, 'text', { x, y: y + 5 }, p.length ? p[p.length - 1] : '{ }');
    nodes.set(key(p), { g, edge, how });
  }

  return stepper(c, frames, (f, i) => {
    CLAUSES.forEach((cl, k) => {
      const r = reduce(cl, f.m), isUnit = r !== 'T' && r !== '⊥' && !r.includes('∨') && !f.sat && !f.conflict;
      chips[k].r.textContent = r;
      chips[k].g.setAttribute('class', 'dp-c' + (r === 'T' ? ' t' : r === '⊥' ? ' f' : isUnit ? ' u' : ''));
    });
    const seen = new Set(frames.slice(0, i + 1).map(fr => key(fr.path)));
    const onPath = new Set(f.path.map((_, d) => key(f.path.slice(0, d + 1))).concat(''));
    for (const [k, n] of nodes) {
      const fr = frames.find(x => key(x.path) === k)!;
      const cls = !seen.has(k) ? ' hide' : k === key(f.path) ? (f.conflict ? ' x' : f.sat ? ' ok' : ' cur') : fr.conflict ? ' x' : onPath.has(k) ? '' : ' old';
      n.g.setAttribute('class', 'dp-n' + cls);
      n.edge?.setAttribute('class', 'fg-e' + (seen.has(k) ? (onPath.has(k) ? ' cur' : '') : ' hide'));
      n.how?.classList.toggle('hide', !seen.has(k));
    }
  }, opts);
}
