// Action schemas vs ground actions (planning.md; AIMA Fig. 11.1, exams 9 Feb 2023 and 16 Jan 2025): drag the number of
// objects and watch the groundings grow on a log scale. Every count comes from enumerating the parameter tuples.
import { bar, card, md, s, slider, style, type FigOptions } from './shell';

interface Schema { name: string; params: string[]; keep?: [string, (args: number[], n: number) => boolean][] }
interface Dom { name: string; unit: string; min: number; max: number; def: number; types: (n: number) => Record<string, number>; schemas: Schema[]; fluents: Schema[]; note: string }
const adj = (a: number, b: number, n: number) => Math.abs((a % n) - (b % n)) + Math.abs(Math.floor(a / n) - Math.floor(b / n)) === 1;
const DOMS: Dom[] = [
  { name: 'air cargo (AIMA Fig. 11.1)', unit: 'cargo = planes = airports', min: 1, max: 12, def: 2, types: n => ({ cargo: n, plane: n, airport: n }),
    schemas: [{ name: 'Load(c, p, a)', params: ['cargo', 'plane', 'airport'] }, { name: 'Unload(c, p, a)', params: ['cargo', 'plane', 'airport'] },
      { name: 'Fly(p, from, to)', params: ['plane', 'airport', 'airport'] }],
    fluents: [{ name: 'At(c, a)', params: ['cargo', 'airport'] }, { name: 'At(p, a)', params: ['plane', 'airport'] }, { name: 'In(c, p)', params: ['cargo', 'plane'] }],
    note: 'AIMA\'s Fly has no from ≠ to, so Fly(P1, SFO, SFO) is a legal (useless) ground action.' },
  { name: 'boxes and tables (exam 16 Jan 2025)', unit: 'boxes = tables', min: 1, max: 12, def: 2, types: n => ({ box: n, table: n }),
    schemas: [{ name: 'Move(x, y, z)', params: ['box', 'table', 'table'] }], fluents: [{ name: 'At(x, y)', params: ['box', 'table'] }],
    note: 'the exam reifies all 8 typed Moves, MoveB1T1T1 included (no y ≠ z in the schema).' },
  { name: 'Wumpus Move(c1, c2) (exam 9 Feb 2023)', unit: 'grid side', min: 2, max: 10, def: 4, types: n => ({ cell: n * n, other: 6 }),
    schemas: [{ name: 'Move(c1, c2)', params: ['cell', 'cell'], keep: [['c1≠c2', ([a, b]) => a !== b], ['Adj', ([a, b], n) => adj(a, b, n)]] }],
    fluents: [{ name: 'At(Agent, c)', params: ['cell'] }],
    note: 'the other constants are Agent, Wumpus, Pit, Breeze, Stench, Gold.' },
];

/** Groundings of a schema: over every constant, then type-correct, then each static filter in turn (enumerated). */
function ground(sc: Schema, types: Record<string, number>, n: number): number[] {
  const all = Object.values(types).reduce((a, b) => a + b, 0), out = [all ** sc.params.length, sc.params.reduce((p, t) => p * types[t], 1)];
  if (!sc.keep) return out;
  const tuples: number[][] = [[]];
  for (const t of sc.params) for (const tu of tuples.splice(0)) for (let v = 0; v < types[t]; v++) tuples.push([...tu, v]);
  let kept = tuples;
  for (const [, f] of sc.keep) { kept = kept.filter(a => f(a, n)); out.push(kept.length); }
  return out;
}
const PX = 66, PY = 30, PW = 300, PH = 230, DEC = 8; // log plot, 1 … 10^8

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-plan-ground-css', CSS);
  const wum = ground(DOMS[2].schemas[0], DOMS[2].types(4), 4), box = ground(DOMS[1].schemas[0], DOMS[1].types(2), 2);
  if (wum.join() !== '484,256,240,48' || box[1] !== 8) console.error(`plan-ground: Wumpus ${wum}, boxes ${box}; planning.md says 256/240/48 and 8`);
  const c = card(el, 'interactive', 'Action schemas vs ground actions: how many actions does the planner really have?', '0 0 780 300');
  let dom = DOMS[0], n = dom.def;
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'plg-plot' });
  for (let d = 0; d <= DEC; d += 2) {
    const y = PY + PH - (d / DEC) * PH;
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: y, y2: y, class: 'plg-grid' });
    s(c.svg, 'text', { x: PX - 6, y: y + 4, class: 'fg-m', 'text-anchor': 'end' }, d ? `10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]}` : '1');
  }
  const xt = [0, 1, 2].map(() => s(c.svg, 'text', { y: PY + PH + 16, class: 'fg-m', 'text-anchor': 'middle' }));
  const xl = s(c.svg, 'text', { x: PX + PW, y: PY + PH + 32, class: 'fg-m', 'text-anchor': 'end' });
  const SERIES = ['every constant in every slot', 'type-correct', 'type-correct + static relations', 'fluents (ground)', 'SATPlan exclusion axioms per step'];
  const curves = SERIES.map((_, k) => s(c.svg, 'polyline', { class: `plg-c k${k}` }));
  const now = s(c.svg, 'line', { y1: PY, y2: PY + PH, class: 'plg-now' });
  const legend = SERIES.map((t, k) => {
    const g = s(c.svg, 'g');
    s(g, 'line', { x1: 400, x2: 420, y1: 30 + k * 18, y2: 30 + k * 18, class: `plg-c k${k}` });
    s(g, 'text', { x: 426, y: 34 + k * 18, class: 'fg-m' }, t);
    return g;
  });
  const table = s(c.svg, 'g');

  const ctl = bar(c);
  const pick = document.createElement('select');
  pick.innerHTML = DOMS.map((d, i) => `<option value="${i}">${d.name}</option>`).join('');
  ctl.append(pick);
  let inp = slider(ctl, '', 0, 1, 1, 0, () => {});
  const mkSlider = () => {
    inp.parentElement!.remove();
    inp = slider(ctl, dom.unit, dom.min, dom.max, 1, n, v => { n = v; render(); });
    inp.addEventListener('change', () => tell());
  };
  pick.onchange = () => { dom = DOMS[+pick.value]; n = dom.def; mkSlider(); render(); tell(); };
  mkSlider();
  const tell = () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);

  /** Totals per level for size n: [all constants, typed, typed + filters, fluents, exclusion axioms]. */
  const totals = (k: number) => {
    const t = dom.types(k), per = dom.schemas.map(sc => ground(sc, t, k)), sum = (i: number) => per.reduce((a, g) => a + g[Math.min(i, g.length - 1)], 0);
    const acts = sum(9), fl = dom.fluents.reduce((a, f) => a + f.params.reduce((p, x) => p * t[x], 1), 0);
    return { per, row: [sum(0), sum(1), acts, fl, (acts * (acts - 1)) / 2], t };
  };
  const ly = (v: number) => PY + PH - (Math.min(DEC, Math.log10(Math.max(1, v))) / DEC) * PH;
  const lx = (k: number) => PX + ((k - dom.min) / (dom.max - dom.min)) * PW;

  function render() {
    const filt = dom.schemas.some(sc => sc.keep);
    const pts = SERIES.map(() => '' as string);
    for (let k = dom.min; k <= dom.max; k++) totals(k).row.forEach((v, i) => { pts[i] += `${lx(k)},${ly(v)} `; });
    curves.forEach((cv, i) => { cv.setAttribute('points', pts[i]); cv.classList.toggle('hide', i === 2 && !filt); });
    legend[2].classList.toggle('hide', !filt);
    xt.forEach((t, k) => { const v = Math.round(dom.min + (k * (dom.max - dom.min)) / 2); t.setAttribute('x', String(lx(v))); t.textContent = String(v); });
    xl.textContent = dom.unit;
    for (const a of ['x1', 'x2']) now.setAttribute(a, String(lx(n)));
    const { per, row, t } = totals(n), consts = Object.values(t).reduce((a, b) => a + b, 0);
    // the table at the current size: one row per schema, then the totals
    table.replaceChildren();
    const TX = 400, TY = 140, cols = filt ? ['schema', 'all', 'typed', ...dom.schemas[0].keep!.map(([l]) => `+${l}`)] : ['schema', 'all consts', 'typed'];
    const cx = (i: number) => (i ? TX + 130 + (i - 1) * (filt ? 62 : 90) : TX);
    cols.forEach((h, i) => s(table, 'text', { x: cx(i), y: TY, class: 'fg-m' }, h));
    s(table, 'line', { x1: TX, x2: 770, y1: TY + 6, y2: TY + 6, class: 'plg-rule' });
    dom.schemas.forEach((sc, j) => {
      s(table, 'text', { x: TX, y: TY + 24 + j * 19, class: 'plg-name' }, sc.name);
      per[j].forEach((v, i) => s(table, 'text', { x: cx(i + 1), y: TY + 24 + j * 19, class: i === per[j].length - 1 ? 'plg-n on' : 'plg-n' }, v.toLocaleString('en')));
    });
    const y2 = TY + 34 + dom.schemas.length * 19;
    s(table, 'text', { x: TX, y: y2, class: 'plg-name' }, `fluents: ${dom.fluents.map(f => f.name).join(', ')}`);
    s(table, 'text', { x: TX, y: y2 + 19, class: 'plg-n on' }, `${row[3].toLocaleString('en')} ground fluents · ${consts} constants`);
    s(table, 'text', { x: TX, y: y2 + 44, class: 'fg-m' }, `SATPlan per time step: ${row[2].toLocaleString('en')} action symbols and precondition axioms,`);
    s(table, 'text', { x: TX, y: y2 + 60, class: 'fg-m' }, `${row[3].toLocaleString('en')} fluent axioms, ${row[4].toLocaleString('en')} exclusion axioms (n(n−1)/2)`);
    const big = dom.schemas.map(sc => `${sc.name.split('(')[0]}: ${sc.params.length} parameters`).join(', ');
    c.cap.innerHTML = md(`**${dom.name}, ${dom.unit} = ${n}** (${consts} constants). Over all constants a schema with $k$ parameters has $${consts}^k$ groundings ` +
      `(${big}): ${row[0].toLocaleString('en')} in total. Only **${row[1].toLocaleString('en')}** are type-correct` +
      (filt ? `, and only **${row[2].toLocaleString('en')}** also satisfy the static relations` : '') + `: the planner generates only those. Note: ${dom.note} ` +
      `The exclusion axioms grow with the **square** of the ground actions (${row[2].toLocaleString('en')} → ${row[4].toLocaleString('en')}): drag the slider and watch the top curve. ` +
      'Ground actions grow polynomially in the objects, with the number of parameters as the degree.');
  }
  render();
  return { destroy() {} };
}

const CSS = `
.plg-plot{fill:var(--panel-2);stroke:var(--border)}
.plg-grid{stroke:var(--border);stroke-dasharray:2 4}
.plg-c{fill:none;stroke-width:2.5}
.plg-c.k0{stroke:var(--muted);stroke-dasharray:5 4}
.plg-c.k1{stroke:var(--accent)}
.plg-c.k2{stroke:var(--ok)}
.plg-c.k3{stroke:var(--warn)}
.plg-c.k4{stroke:var(--bad);stroke-width:1.8}
.plg-now{stroke:var(--text-2);stroke-width:1.5;stroke-dasharray:3 3}
.plg-rule{stroke:var(--border-strong)}
.plg-name{font:12px var(--mono);fill:var(--text-2)}
.plg-n{font:600 12px var(--mono);fill:var(--muted)}
.plg-n.on{fill:var(--text)}
`;
