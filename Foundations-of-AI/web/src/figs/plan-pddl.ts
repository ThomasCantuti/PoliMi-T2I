// STRIPS vs PDDL side by side (planning.md §11.1): the exams' formulations of the same domain, grounded from the schema text
// and run on one shared state. Exam 18 Jan 2024 (Handfree vs ¬Holding(x)) and exam 6 Feb 2026 (fuel arithmetic).
import { box, md, s, style, type FigOptions } from './shell';

interface Sch { head: string; pre: string[]; eff: string[] }
interface Form { title: string; schemas: Sch[]; derived?: (w: Set<string>) => string[] }
interface Ex { label: string; consts: string[]; init: string[]; goal: string[]; forms: Form[]; draw: (svg: SVGSVGElement) => (w: Set<string>) => void; say: (w: Set<string>, apps: Ground[][], extra: Ground[][]) => string }
interface Ground { name: string; pos: string[]; neg: string[]; add: string[]; del: string[] }

const sub = (lit: string, env: Record<string, string>) => lit.replace(/\b[a-z]\w*\b/g, v => env[v] ?? v).replace(/(\d+) – (\d+)/g, (_, a, b) => String(+a - +b));
const test = (lit: string) => { const m = lit.match(/^(\S+) (≥|≠) (\S+)$/); return !m || (m[2] === '≠' ? m[1] !== m[3] : +m[1] >= +m[3]); };
/** Every ground action of a schema: substitute constants for the parameters, drop those whose static test (≥, ≠) fails. */
function ground(sc: Sch, consts: string[]): Ground[] {
  const [, name, ps] = sc.head.match(/^([\w-]+)\((.*)\)$/)!, params = ps.split(',').map(p => p.trim());
  let envs: Record<string, string>[] = [{}];
  for (const p of params) envs = envs.flatMap(e => consts.map(c => ({ ...e, [p]: c })));
  return envs.flatMap(env => {
    const pre = sc.pre.map(l => sub(l, env)), eff = sc.eff.map(l => sub(l, env));
    if (!pre.every(test)) return [];
    const lits = (xs: string[], neg: boolean) => xs.filter(l => !/ [≥≠] /.test(l) && l.startsWith('¬') === neg).map(l => l.replace(/^¬/, ''));
    return [{ name: `${name}(${params.map(p => env[p]).join(',')})`, pos: lits(pre, false), neg: lits(pre, true), add: lits(eff, false), del: lits(eff, true) }];
  });
}
const view = (f: Form, w: Set<string>) => new Set([...w, ...(f.derived?.(w) ?? [])]);
const ok = (g: Ground, st: Set<string>) => g.pos.every(p => st.has(p)) && !g.neg.some(p => st.has(p));
const preds = (f: Form, init: string[]) => new Set([...f.schemas.flatMap(sc => [...sc.pre, ...sc.eff]), ...init, ...(f.derived?.(new Set()) ?? [])]
  .map(l => l.replace(/^¬/, '').match(/^([A-Z][\w-]*)/)?.[1]).filter(Boolean));
/** The effect on the shared state, without the predicates that only one formulation has (Handfree). */
const effect = (f: Form, g: Ground) => { const d = new Set(f.derived?.(new Set()) ?? []); const k = (xs: string[]) => xs.filter(x => !d.has(x)).sort().join(' '); return `+${k(g.add)} −${k(g.del)}`; };

const PICK = ['Ball(b)', 'Basket(k)', 'At(k)', 'In(b,k)'], MOVE: Sch = { head: 'Move(k1,k2)', pre: ['Basket(k1)', 'Basket(k2)', 'At(k1)'], eff: ['¬At(k1)', 'At(k2)'] };
const DROP = (extra: string[]): Sch => ({ head: 'Drop(b,k)', pre: ['Ball(b)', 'Basket(k)', 'At(k)', 'Holding(b)'], eff: ['¬Holding(b)', ...extra, 'In(b,k)'] });
const LOCS = ['L1', 'L2', 'L3', 'L4', 'L5'], LPOS: Record<string, [number, number]> = { L1: [70, 80], L2: [190, 80], L3: [310, 38], L4: [310, 122], L5: [430, 122] };
const LINKS = [['L1', 'L2'], ['L2', 'L3'], ['L2', 'L4'], ['L3', 'L4'], ['L4', 'L5']];
const MOVEF = (k: number): Sch => ({ head: `Move-Fuel${k}(x,y)`, pre: ['Location(x)', 'Location(y)', 'Connected(x,y)', 'At(x)', `Fuel(${k})`], eff: ['¬At(x)', 'At(y)', `¬Fuel(${k})`, `Fuel(${k - 2})`] });
const RECH: Sch = { head: 'Recharging(x,z)', pre: ['Location(x)', 'Recharge(x)', 'At(x)', 'Fuel(z)'], eff: ['¬Fuel(z)', 'Fuel(5)'] };

const EXAMPLES: Ex[] = [
  { label: 'negative preconditions (exam 18 Jan 2024)', consts: ['Ba1', 'Ba2', 'Bk1', 'Bk2'],
    init: ['Ball(Ba1)', 'Ball(Ba2)', 'Basket(Bk1)', 'Basket(Bk2)', 'In(Ba1,Bk1)', 'In(Ba2,Bk1)', 'At(Bk1)'], goal: ['In(Ba1,Bk2)', 'In(Ba2,Bk2)'],
    forms: [
      { title: 'STRIPS (Question 1, corrected)', derived: w => ([...w].some(f => f.startsWith('Holding')) ? [] : ['Handfree']),
        schemas: [{ head: 'PickUp(b,k)', pre: [...PICK, 'Handfree'], eff: ['¬In(b,k)', '¬Handfree', 'Holding(b)'] }, DROP(['Handfree']), MOVE] },
      { title: 'PDDL (Question 4, official)', schemas: [{ head: 'PickUp(b,k,x)', pre: [...PICK, '¬Holding(x)'], eff: ['¬In(b,k)', 'Holding(b)'] }, DROP([]), MOVE] },
      { title: 'PDDL, constants listed', schemas: [{ head: 'PickUp(b,k)', pre: [...PICK, '¬Holding(Ba1)', '¬Holding(Ba2)'], eff: ['¬In(b,k)', 'Holding(b)'] }, DROP([]), MOVE] },
    ],
    draw: svg => {
      const g = s(svg, 'g'), held = s(svg, 'text', { x: 560, y: 70, class: 'plp-warn' });
      [['Bk1', 150], ['Bk2', 390]].forEach(([k, x]) => {
        s(g, 'path', { d: `M${+x - 60},${90} L${+x - 45},${140} L${+x + 45},${140} L${+x + 60},${90}`, class: 'plp-basket' });
        s(g, 'text', { x: +x, y: 156, class: 'fg-m', 'text-anchor': 'middle' }, String(k));
      });
      const arm = s(svg, 'g', { class: 'plp-arm' });
      s(arm, 'line', { x1: 0, y1: 0, x2: 0, y2: 26, class: 'plp-rod' });
      s(arm, 'path', { d: 'M-16,40 L-16,28 L16,28 L16,40', class: 'plp-claw' });
      const balls = ['Ba1', 'Ba2'].map(b => { const e = s(svg, 'g', { class: 'plp-ball' }); s(e, 'circle', { r: 15 }); s(e, 'text', { y: 4.5 }, b); return e; });
      return w => {
        const at = w.has('At(Bk1)') ? 150 : 390, hold = ['Ba1', 'Ba2'].filter(b => w.has(`Holding(${b})`));
        arm.style.transform = `translate(${at}px, 6px)`;
        ['Ba1', 'Ba2'].forEach((b, i) => {
          const h = hold.indexOf(b), k = w.has(`In(${b},Bk1)`) ? 150 : 390;
          const [x, y] = h >= 0 ? [at + (hold.length > 1 ? (h ? 17 : -17) : 0), 58] : [k + (i ? 22 : -22), 118];
          balls[i].style.transform = `translate(${x}px, ${y}px)`;
          balls[i].classList.toggle('bad', hold.length > 1 && h >= 0);
        });
        held.textContent = hold.length > 1 ? 'the robot holds TWO balls!' : '';
      };
    },
    say: (w, apps, extra) => {
      const hold = [...w].filter(f => f.startsWith('Holding')).length;
      return '**Same constants, same three schemas, one predicate fewer:** PDDL drops `Handfree` and tests `¬Holding(…)` instead (exam 18 Jan 2023 asks exactly this). ' +
        (hold > 1 ? '**The robot now holds two balls**, a state the STRIPS model can never reach: the official PDDL schema let it happen. '
          : extra[1].length ? `**The robot holds a ball, yet the official PDDL allows ${extra[1].map(g => `\`${g.name}\``).join(', ')}** (red): \`x\` is a parameter, so \`¬Holding(x)\` only says that *some* x is not held. ` +
            'Listing the constants (third column) restores the meaning of Handfree. Click a red action to see what happens. '
          : `With nothing in the hand all three allow the same moves, but the official PDDL grounds each PickUp ${apps[1].filter(g => g.name.startsWith('PickUp')).length / Math.max(1, apps[0].filter(g => g.name.startsWith('PickUp')).length)} times, once per value of the free \`x\`. Pick up a ball. `) +
        'Highlighted: what differs between the columns. Click an applicable action to execute it.';
    } },
  { label: 'arithmetic (exam 6 Feb 2026)', consts: [...LOCS, '0', '1', '2', '3', '4', '5'],
    init: [...LOCS.map(l => `Location(${l})`), 'Recharge(L3)', ...LINKS.flatMap(([a, b]) => [`Connected(${a},${b})`, `Connected(${b},${a})`]), 'At(L1)', 'Fuel(5)'], goal: ['At(L5)'],
    forms: [
      { title: 'PDDL (≥ and − on numbers)', schemas: [{ head: 'Move(x,y,z)', pre: ['Location(x)', 'Location(y)', 'Connected(x,y)', 'At(x)', 'Fuel(z)', 'z ≥ 2'], eff: ['¬At(x)', 'At(y)', '¬Fuel(z)', 'Fuel(z – 2)'] }, RECH] },
      { title: 'STRIPS (Question 2)', schemas: [MOVEF(2), MOVEF(3), MOVEF(4), MOVEF(5), RECH] },
    ],
    draw: svg => {
      for (const [a, b] of LINKS) s(svg, 'line', { x1: LPOS[a][0], y1: LPOS[a][1], x2: LPOS[b][0], y2: LPOS[b][1], class: 'fg-e' });
      for (const l of LOCS) {
        s(svg, 'circle', { cx: LPOS[l][0], cy: LPOS[l][1], r: 20, class: l === 'L5' ? 'fg-goal' : l === 'L3' ? 'plp-rech' : 'fg-cell' });
        s(svg, 'text', { x: LPOS[l][0], y: LPOS[l][1] + 4.5, class: 'plp-loc', 'text-anchor': 'middle' }, l);
      }
      s(svg, 'text', { x: 310, y: 12, class: 'fg-m', 'text-anchor': 'middle' }, 'recharge');
      s(svg, 'text', { x: 470, y: 127, class: 'fg-m' }, 'goal');
      const rover = s(svg, 'circle', { r: 8, class: 'plp-rover' }), cells = [0, 1, 2, 3, 4].map(i => s(svg, 'rect', { x: 560 + i * 34, y: 60, width: 30, height: 22, rx: 4, class: 'plp-fuel' }));
      s(svg, 'text', { x: 560, y: 50, class: 'fg-t' }, 'fuel');
      const ft = s(svg, 'text', { x: 560, y: 104, class: 'fg-m' });
      return w => {
        const at = LOCS.find(l => w.has(`At(${l})`))!, f = +[...w].find(x => x.startsWith('Fuel('))!.slice(5, -1);
        rover.style.transform = `translate(${LPOS[at][0] + 14}px, ${LPOS[at][1] - 14}px)`;
        cells.forEach((c, i) => c.classList.toggle('on', i < f));
        ft.textContent = `Fuel(${f}): a move costs 2`;
      };
    },
    say: (w, apps) => {
      const f = +[...w].find(x => x.startsWith('Fuel('))!.slice(5, -1);
      return '**Arithmetic is not STRIPS:** PDDL\'s `Move(x, y, z)` tests `z ≥ 2` and writes `Fuel(z – 2)`; STRIPS needs **one schema per fuel level**, `Move-Fuel2` … `Move-Fuel5`. ' +
        `The ground actions are the same: in this state both columns list **${apps[0].length}** applicable actions with the same effects, so the branching factor does not change ` +
        '(at most 3 in this map, exam 6 Feb 2026). ' + (f >= 2 ? '' : w.has('At(L3)') ? `With fuel ${f} no Move is applicable in either: only \`Recharging\` refills the tank. `
          : `With fuel ${f} away from L3 nothing is applicable in either formulation: a **dead end** (Reset to start again). `) +
        'Click an applicable action to drive.';
    } },
];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-plan-pddl-css', CSS);
  const root = box(el, 'interactive', 'STRIPS vs PDDL: the same domain in two languages, on the same state',
    '<div class="fg-bar plp-pick"></div><div class="fg-sv"></div><div class="plp-cols"></div><div class="fg-c"></div>');
  const pickBar = root.querySelector<HTMLElement>('.plp-pick')!, cols = root.querySelector<HTMLElement>('.plp-cols')!, cap = root.querySelector<HTMLElement>('.fg-c')!;
  const svg = s(root.querySelector('.fg-sv')!, 'svg', { viewBox: '0 0 780 165', 'aria-hidden': 'true' });
  let ex = EXAMPLES[0], world = new Set<string>(), paint: (w: Set<string>) => void = () => {}, grounds: Ground[][] = [];
  const btns = EXAMPLES.map((e, i) => {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = e.label;
    b.onclick = () => choose(i);
    pickBar.append(b);
    return b;
  });
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset state';
  reset.onclick = () => { world = new Set(ex.init); render(); };
  pickBar.append(reset);

  function choose(i: number) {
    ex = EXAMPLES[i];
    btns.forEach((b, k) => b.classList.toggle('active', k === i));
    svg.replaceChildren();
    paint = ex.draw(svg);
    grounds = ex.forms.map(f => f.schemas.flatMap(sc => ground(sc, ex.consts)));
    world = new Set(ex.init);
    render();
  }

  function render(said = '') {
    paint(world);
    const apps = ex.forms.map((f, i) => grounds[i].filter(g => ok(g, view(f, world))));
    const effs = ex.forms.map((f, i) => new Set(apps[i].map(g => effect(f, g))));
    const extra = ex.forms.map((f, i) => apps[i].filter(g => effs.some((e, j) => j !== i && !e.has(effect(f, g)))));
    cols.style.gridTemplateColumns = `repeat(${ex.forms.length}, 1fr)`;
    cols.replaceChildren(...ex.forms.map((f, i) => column(f, i, apps[i], extra[i])));
    const goal = ex.goal.every(g => world.has(g));
    cap.innerHTML = md((said ? `${said} ` : '') + (goal ? '**Goal reached.** ' : '') + ex.say(world, apps, extra));
  }

  /** One formulation: its size, its schemas (differences highlighted), the ground actions applicable now. */
  function column(f: Form, i: number, apps: Ground[], extra: Ground[]) {
    const col = document.createElement('div');
    col.className = 'plp-col';
    const others = ex.forms.filter((_, j) => j !== i);
    const same = (sc: Sch) => others.map(o => o.schemas.find(t => t.head.split('(')[0].replace(/-Fuel\d/, '') === sc.head.split('(')[0].replace(/-Fuel\d/, '')));
    const lit = (l: string, sc: Sch, kind: 'pre' | 'eff') => {
      const diff = same(sc).some(t => !t || !t[kind].includes(l));
      return `<span class="${diff ? 'plp-diff' : ''}">${esc(l)}</span>`;
    };
    const head = (sc: Sch) => `<b class="${same(sc).some(t => !t || t.head !== sc.head) ? 'plp-diff' : ''}">${esc(sc.head)}</b>`;
    const np = preds(f, ex.init).size;
    col.innerHTML = `<div class="plp-t">${esc(f.title)}</div><div class="plp-meta">${ex.consts.length} constants · ${np} predicates · ${f.schemas.length} schemas</div>` +
      f.schemas.map(sc => `<div class="plp-s">${head(sc)}<br>P: ${sc.pre.map(l => lit(l, sc, 'pre')).join(', ')}<br>E: ${sc.eff.map(l => lit(l, sc, 'eff')).join(', ')}</div>`).join('') +
      `<div class="plp-meta">applicable now: ${apps.length}</div>`;
    const list = document.createElement('div');
    list.className = 'plp-apps';
    // ground actions that differ only in a last parameter with the same effect are shown once (the free x of PickUp)
    const groups = new Map<string, Ground[]>();
    for (const g of apps) { const k = g.name.replace(/,[^,]*\)$/, ',·)') + effect(f, g); groups.set(k, [...(groups.get(k) ?? []), g]); }
    for (const gs of groups.values()) {
      const g = gs[0], b = document.createElement('button'), bad = extra.includes(g);
      b.className = `btn sm plp-a${bad ? ' extra' : ''}`;
      b.textContent = gs.length > 1 ? `${g.name.replace(/,[^,]*\)$/, ',x)')}, x ∈ {${gs.map(x => x.name.match(/,([^,]*)\)$/)![1]).join(', ')}}` : g.name;
      const st = view(f, world), next = new Set([...[...st].filter(x => !g.del.includes(x)), ...g.add]);
      if (next.size === st.size && [...next].every(x => st.has(x))) b.textContent += ' (no effect)';
      b.onclick = () => {
        const st = view(f, world), d = new Set(f.derived?.(new Set()) ?? []);
        world = new Set([...[...st].filter(x => !g.del.includes(x)), ...g.add].filter(x => !d.has(x)));
        const line = `Executed \`${g.name}\` from the column "${f.title}".`;
        render(line);
        opts.onEvent?.(`[STRIPS vs PDDL] ${line} ${cap.textContent}`);
      };
      list.append(b);
    }
    if (!apps.length) list.textContent = 'none';
    col.append(list);
    return col;
  }
  choose(0);
  return { destroy() {} };
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const CSS = `
.plp-cols{display:grid;gap:10px;padding:10px 14px;border-top:1px solid var(--border)}
.plp-col{min-width:0;display:flex;flex-direction:column;gap:6px}
.plp-t{font-weight:650;font-size:13px;color:var(--text)}
.plp-meta{font-size:12px;color:var(--muted)}
.plp-s{font:11.5px/1.5 var(--mono);color:var(--text-2);background:var(--panel-2);border:1px solid var(--border);border-radius:8px;padding:5px 8px}
.plp-s b{color:var(--text);font-weight:650}
.plp-diff{background:var(--warn-soft);color:var(--warn);border-radius:3px;padding:0 2px}
.plp-apps{display:flex;flex-wrap:wrap;gap:4px}
.plp-a{font-family:var(--mono);font-size:11.5px;white-space:normal;text-align:left}
.plp-a.extra{border-color:var(--bad);color:var(--bad);background:var(--bad-soft)}
.plp-basket{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:2}
.plp-arm{transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.plp-rod{stroke:var(--text-2);stroke-width:4}
.plp-claw{fill:none;stroke:var(--text-2);stroke-width:4;stroke-linejoin:round}
.plp-ball{transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.plp-ball circle{fill:var(--accent);stroke:var(--panel);stroke-width:2}
.plp-ball.bad circle{fill:var(--bad)}
.plp-ball text{font:700 10.5px var(--font);fill:#fff;text-anchor:middle}
.plp-warn{font-weight:700;font-size:14px;fill:var(--bad)}
.plp-rech{fill:var(--warn-soft);stroke:var(--warn)}
.plp-loc{font:600 12px var(--mono);fill:var(--text)}
.plp-rover{fill:var(--accent);stroke:var(--panel);stroke-width:2;transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.plp-fuel{fill:var(--panel-3);stroke:var(--border)}
.plp-fuel.on{fill:var(--ok)}
`;
