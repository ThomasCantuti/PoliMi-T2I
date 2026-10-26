// SATPlan on the two-rooms example of planning.md (exam 14 Jun 2022): the time layers for L = 0, 1, 2. Every model is
// found by checking all assignments against the five groups of axioms, so the counts are computed, not typed.
import { arrow, card, s, stepper, style, type FigOptions, type Frame } from './shell';

const FLUENTS = ['AtR1', 'AtR2'], INIT_TRUE = ['AtR1'], GOAL = 'AtR2';
const ACTS = [{ n: 'MoveR', pre: 'AtR1', add: 'AtR2', del: 'AtR1' }, { n: 'MoveL', pre: 'AtR2', add: 'AtR1', del: 'AtR2' }];
type Model = Record<string, boolean>;

const range = (n: number) => [...Array(n).keys()];
const symbols = (L: number) => [...FLUENTS.flatMap(f => range(L + 1).map(t => `${f}^${t}`)), ...ACTS.flatMap(a => range(L).map(t => `${a.n}^${t}`))];

function holds(v: Model, L: number): boolean {
  if (FLUENTS.some(f => v[`${f}^0`] !== INIT_TRUE.includes(f)) || !v[`${GOAL}^${L}`]) return false;   // init (with negations), goal
  for (let t = 0; t < L; t++) {
    if (ACTS.some(a => v[`${a.n}^${t}`] && !v[`${a.pre}^${t}`])) return false;                     // precondition axioms
    for (const f of FLUENTS) {                                                                    // fluent axioms
      const causes = ACTS.some(a => a.add === f && v[`${a.n}^${t}`]), undoes = ACTS.some(a => a.del === f && v[`${a.n}^${t}`]);
      if (v[`${f}^${t + 1}`] !== (causes || (v[`${f}^${t}`] && !undoes))) return false;
    }
    if (ACTS.filter(a => v[`${a.n}^${t}`]).length > 1) return false;                               // pairwise exclusion
  }
  return true;
}

function models(L: number): Model[] {
  const syms = symbols(L);
  return range(2 ** syms.length).map(m => Object.fromEntries(syms.map((x, i) => [x, !!((m >> i) & 1)])) as Model)
    .filter(v => holds(v, L)).sort((a, b) => +!a['MoveR^0'] - +!b['MoveR^0']);
}

type Val = boolean | 'x';
interface F extends Frame { L: number; vals: Record<string, Val>; hi: string[] }

function build(): F[] {
  const m0 = models(0), m1 = models(1), m2 = models(2), v = m1[0];
  const pick = (...xs: string[]) => Object.fromEntries(xs.map(x => [x, v[x]]));
  const fixed = ['AtR1^0', 'AtR2^0', 'AtR2^1'];
  const plan = (m: Model, L: number) => range(L).map(t => ACTS.find(a => m[`${a.n}^${t}`])?.n ?? 'no action');
  return [
    { L: 0, vals: { 'AtR1^0': true, 'AtR2^0': 'x' }, hi: ['AtR2^0'], group: 'L = 0',
      cap: `**L = 0.** No actions: the sentence is just init ∧ goal, $AtR1^0 \\land \\lnot AtR2^0 \\land AtR2^0$. ` +
        `It has ${m0.length} models: unsatisfiable, **no plan with 0 actions**.` },
    { L: 1, vals: {}, hi: [], group: 'L = 1',
      cap: `**L = 1.** Reify: one symbol per fluent and time step ($AtR1^0, AtR2^0, AtR1^1, AtR2^1$) and one per action and ` +
        `step $t < L$ ($MoveR^0, MoveL^0$): ${symbols(1).length} symbols, ${2 ** symbols(1).length} assignments.` },
    { L: 1, vals: pick(...fixed), hi: fixed, group: 'L = 1',
      cap: '**Initial state and goal:** $AtR1^0 \\land \\lnot AtR2^0$ and $AtR2^1$. SAT has no closed-world assumption, so the ' +
        'false fluents of Init must be **negated** explicitly.' },
    { L: 1, vals: pick(...fixed, 'MoveL^0'), hi: ['MoveR^0', 'MoveL^0', 'AtR1^0', 'AtR2^0'], group: 'L = 1',
      cap: '**Precondition axioms** $MoveR^0 \\Rightarrow AtR1^0$ and $MoveL^0 \\Rightarrow AtR2^0$. $AtR2^0$ is false, so ' +
        '$MoveL^0$ must be **false**.' },
    { L: 1, vals: pick(...fixed, 'MoveL^0', 'MoveR^0', 'AtR1^1'), hi: ['AtR2^1', 'MoveR^0', 'AtR1^1'], group: 'L = 1',
      cap: '**Fluent axioms** $AtR2^1 \\Leftrightarrow MoveR^0 \\lor (AtR2^0 \\land \\lnot MoveL^0)$: $AtR2^1$ is true and $AtR2^0$ ' +
        'false, so $MoveR^0$ must be **true**. Then $AtR1^1 \\Leftrightarrow MoveL^0 \\lor (AtR1^0 \\land \\lnot MoveR^0)$ makes ' +
        '$AtR1^1$ false: nothing else changes a fluent.' },
    { L: 1, vals: { ...v }, hi: ['MoveR^0', 'MoveL^0'], group: 'L = 1',
      cap: `**Exclusion axiom** $\\lnot MoveR^0 \\lor \\lnot MoveL^0$ holds. ${m1.length === 1 ? 'This is the **only model**' : `One of ${m1.length} models`}: ` +
        `EXTRACT-SOLUTION reads the true action symbols, **plan = ${plan(v, 1).join(', ')}**. SATPLAN stops at the first ` +
        'satisfiable L, so the plan is a shortest one.' },
    ...m2.map((m, i): F => ({ L: 2, vals: { ...m }, hi: range(2).flatMap(t => ACTS.filter(a => m[`${a.n}^${t}`]).map(a => `${a.n}^${t}`)), group: 'L = 2',
      cap: (i ? '' : `**L = 2 would be satisfiable too** (${m2.length} models): the axioms forbid two actions in one step, not zero. `) +
        `Model ${i + 1}: ${plan(m, 2).map((p, t) => `$t = ${t}$: ${p}`).join(', ')}.` })),
  ];
}

const XT = [75, 380, 685], XA = [227, 532], NW = 92, Y: Record<string, number> = { AtR1: 84, AtR2: 226, MoveR: 128, MoveL: 182 };

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-ps-css', CSS);
  const c = card(el, 'stepper', 'SATPlan: one copy of every fluent per time step, one of every action per step', '0 0 760 252');
  const ah = arrow(c.svg);
  const Ltxt = s(c.svg, 'text', { x: 16, y: 26, class: 'fg-h2' });
  const cols = XT.map((x, t) => s(c.svg, 'text', { x, y: 52, class: 'fg-m', 'text-anchor': 'middle' }, `t = ${t}`));
  const edges: [SVGElement, number][] = [];
  const nodes: Record<string, { g: SVGGElement; v: SVGTextElement; t: number }> = {};
  const node = (name: string, t: number, x: number, w: number) => {
    const y = Y[name], g = s(c.svg, 'g', { class: 'ps-n' });
    s(g, 'rect', { x: x - w / 2, y: y - 16, width: w, height: 32, rx: 8 });
    const tx = s(g, 'text', { x: x - 12, y: y + 5, class: 'ps-l', 'text-anchor': 'middle' }, name);
    s(tx, 'tspan', { dy: -7, 'font-size': '.72em' }, String(t));
    nodes[`${name}^${t}`] = { g, v: s(g, 'text', { x: x + w / 2 - 14, y: y + 5, class: 'ps-v', 'text-anchor': 'middle' }), t };
  };
  for (let t = 0; t < 2; t++) for (const a of ACTS) {   // edges first, so the nodes cover their ends
    edges.push([s(c.svg, 'line', { x1: XT[t] + NW / 2, y1: Y[a.pre], x2: XA[t] - NW / 2, y2: Y[a.n], class: 'fg-e ps-pre' }), t]);
    edges.push([s(c.svg, 'line', { x1: XA[t] + NW / 2, y1: Y[a.n], x2: XT[t + 1] - NW / 2 - 5, y2: Y[a.add], class: 'fg-e', 'marker-end': ah }), t]);
  }
  XT.forEach((x, t) => FLUENTS.forEach(f => node(f, t, x, NW)));
  XA.forEach((x, t) => ACTS.forEach(a => node(a.n, t, x, NW)));
  s(c.svg, 'text', { x: 744, y: 26, class: 'fg-m', 'text-anchor': 'end' }, 'dashed: precondition axiom · arrow: effect (fluent axiom)');
  return stepper(c, build(), f => {
    Ltxt.textContent = `L = ${f.L}`;
    cols.forEach((col, t) => col.classList.toggle('hide', t > f.L));
    edges.forEach(([e, t]) => e.classList.toggle('hide', t >= f.L));
    for (const [k, n] of Object.entries(nodes)) {
      const action = k.startsWith('Move'), val = f.vals[k];
      n.g.setAttribute('class', `ps-n${val === 'x' ? ' x' : val === true ? ' t' : val === false ? ' f' : ''}${f.hi.includes(k) ? ' cur' : ''}` +
        ((action ? n.t >= f.L : n.t > f.L) ? ' hide' : ''));
      n.v.textContent = val === 'x' ? '✗' : val === true ? 'T' : val === false ? 'F' : '?';
    }
  }, opts);
}

const CSS = `
.ps-n{transition:opacity .3s}
.ps-n rect{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:fill .25s,stroke .25s}
.ps-n.t rect{fill:var(--ok-soft);stroke:var(--ok)}
.ps-n.f rect{fill:var(--panel-3)}
.ps-n.x rect{fill:var(--bad-soft);stroke:var(--bad);stroke-width:2.5}
.ps-n.cur rect{stroke-width:3}
.ps-n.cur:not(.t):not(.x) rect{stroke:var(--accent)}
.ps-l{font:600 13px var(--mono);fill:var(--text)}
.ps-v{font:700 12.5px var(--mono);fill:var(--muted)}
.ps-n.t .ps-v{fill:var(--ok)}
.ps-n.x .ps-v{fill:var(--bad)}
.ps-pre{stroke-dasharray:5 4}
`;
