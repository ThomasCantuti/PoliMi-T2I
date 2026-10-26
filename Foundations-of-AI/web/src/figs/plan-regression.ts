// Backward (regression) planning on the robot-and-box rooms (exam 30 Aug 2022 domain): relevant and consistent actions,
// R[G, a] = (G − ADD(a)) ∪ PRE(a), goal test "Init satisfies G" at generation. Everything is computed.
import { ACTIONS, GOAL, INIT, sorted, type Act } from './plan-rooms';
import { arrow, card, s, stepper, style, type FigOptions, type Frame } from './shell';

const relevant = (g: Set<string>, a: Act) => a.add.some(x => g.has(x));
const consistent = (g: Set<string>, a: Act) => !a.del.some(x => g.has(x));
const regress = (g: Set<string>, a: Act) => new Set([...[...g].filter(x => !a.add.includes(x)), ...a.pre]);
const code = (x: string) => `\`${x}\``;

type Phase = 'goal' | 'table' | 'regress' | 'check';
interface G { lits: Set<string>; from?: Act; prev?: number }
interface F extends Frame { phase: Phase; upto: number; level: number }

/** Backward BFS (as backward_bfs in planning.md). ponytail: the drawing assumes the generated goals form one chain, true here. */
function search() {
  const init = new Set(INIT), goals: G[] = [{ lits: new Set(GOAL) }], frames: F[] = [];
  frames.push({ phase: 'goal', upto: 0, level: 0, group: 'goal',
    cap: `**Start from the goal** $Box(x) \\wedge InRoom(x, R1)$ with $x = BOX1$, the only box: G0 = {${GOAL.join(', ')}}. ` +
      'Backward search asks: which action could be the **last** one of the plan?' });
  const frontier = [0];
  while (frontier.length) {
    const i = frontier.shift()!, g = goals[i].lits, ok = ACTIONS.filter(a => relevant(g, a) && consistent(g, a));
    frames.push({ phase: 'table', upto: i, level: i, group: `G${i}`,
      cap: `**Successors of G${i}:** an action is **relevant** if it adds a literal of G${i}, **consistent** if it deletes none. ` +
        `${ok.length} of ${ACTIONS.length} ground actions pass both: ${ok.map(a => code(a.name)).join(', ')}` +
        (ok.length > 1 ? ', generated in this order.' : '.') });
    for (const a of ok) {
      const lits = regress(g, a), c = goals.length;
      goals.push({ lits, from: a, prev: i });
      const added = [...lits].filter(x => !g.has(x)), dropped = a.add.filter(x => g.has(x));
      frames.push({ phase: 'regress', upto: c, level: i, group: `G${i}`,
        cap: `$R[G${i}, a] = (G${i} - ADD(a)) \\cup PRE(a)$ with $a$ = ${code(a.name)}: drop ${dropped.map(code).join(', ')} ` +
          `(the action achieves it), add the preconditions ${added.map(code).join(', ')}. Static ones like \`Connects\` stay in the goal.` });
      const missing = [...lits].filter(x => !init.has(x));
      if (!missing.length) {
        frames.push({ phase: 'check', upto: c, level: i, group: `G${i}`,
          cap: `**Init satisfies G${c}**: every literal is in the initial state → **stop**. Read the actions from G${c} back up to G0 ` +
            `(found last-first): **${plan(goals, c).join(', ')}**, the same plan forward search found.` });
        return { goals, frames };
      }
      frames.push({ phase: 'check', upto: c, level: i, group: `G${i}`,
        cap: `Does Init satisfy G${c}? No: ${missing.map(code).join(', ')} ${missing.length > 1 ? 'are' : 'is'} not in the initial state. ` +
          `G${c} joins the frontier.` });
      frontier.push(c);
    }
  }
  return { goals, frames };
}

function plan(goals: G[], i: number): string[] {
  const out: string[] = [];
  for (let k = i; goals[k].from; k = goals[k].prev!) out.push(goals[k].from!.name);
  return out;
}

const LH = 18, GW = 290, TX = 350;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-prg-css', CSS);
  const { goals, frames } = search();
  const init = new Set(INIT);
  const tops: number[] = [];
  goals.reduce((y, g) => (tops.push(y), y + 30 + g.lits.size * LH + 52), 16);
  const H = tops[tops.length - 1] + 30 + goals[goals.length - 1].lits.size * LH + 12;
  const c = card(el, 'stepper', 'Backward planning: regress the goal until Init satisfies it', `0 0 760 ${Math.max(H, 300)}`);
  const ah = arrow(c.svg);
  const goalG = s(c.svg, 'g'), tableG = s(c.svg, 'g');
  const t = (g: SVGGElement, x: number, y: number, str: string, cls: string, anchor = 'start') =>
    s(g, 'text', { x, y, class: cls, 'text-anchor': anchor }, str);
  return stepper(c, frames, f => {
    goalG.replaceChildren();
    goals.forEach((g, i) => {
      if (i > f.upto) return;
      const y = tops[i], h = 22 + g.lits.size * LH, last = i === f.upto;
      const prev = g.prev === undefined ? null : goals[g.prev].lits;
      const cls = last && f.phase === 'check' ? ([...g.lits].every(x => init.has(x)) ? ' ok' : ' no') : last ? ' cur' : '';
      s(goalG, 'rect', { x: 20, y, width: GW, height: h, rx: 10, class: 'prg-g' + cls });
      t(goalG, 32, y + 16, `G${i}`, 'prg-tag');
      const next = goals[i + 1];
      const dropped = new Set(i + 1 <= f.upto && next ? next.from!.add : []);
      sorted(g.lits).forEach((x, k) => {
        const mark = last && f.phase === 'check' ? (init.has(x) ? '✓' : '✗') : dropped.has(x) ? '−' : last && prev && !prev.has(x) ? '+' : ' ';
        const kind = mark === '✓' ? ' in' : mark === '✗' ? ' out' : mark === '−' ? ' drop' : mark === '+' ? ' new' : '';
        t(goalG, 62, y + 34 + k * LH, `${mark} ${x}`, 'prg-l' + kind);
      });
      if (g.from) {
        const py = tops[i - 1] + 22 + goals[i - 1].lits.size * LH;
        s(goalG, 'line', { x1: 165, y1: y - 3, x2: 165, y2: py + 4, class: 'fg-e cur', 'marker-end': ah });
        t(goalG, 175, (y + py) / 2 + 4, g.from.name, 'prg-act');
      }
    });
    tableG.replaceChildren();
    if (f.phase === 'goal') return;
    const g = goals[f.level].lits, chosen = goals[f.upto].from;
    t(tableG, TX, 30, `ground actions vs G${f.level}`, 'fg-h2');
    t(tableG, TX + 230, 52, 'relevant', 'fg-m', 'middle');
    t(tableG, TX + 330, 52, 'consistent', 'fg-m', 'middle');
    ACTIONS.forEach((a, k) => {
      const y = 76 + k * 24, r = relevant(g, a), cs = consistent(g, a), on = f.phase !== 'table' && a === chosen;
      if (on) s(tableG, 'rect', { x: TX - 6, y: y - 16, width: 404, height: 22, rx: 5, class: 'prg-sel' });
      t(tableG, TX, y, a.name, 'prg-l' + (r && cs ? '' : ' dim'));
      t(tableG, TX + 230, y, r ? '✓' : '·', r ? 'prg-l in' : 'prg-l dim', 'middle');
      t(tableG, TX + 330, y, r ? (cs ? '✓' : '✗') : '·', r ? (cs ? 'prg-l in' : 'prg-l out') : 'prg-l dim', 'middle');
    });
  }, opts);
}

const CSS = `
.prg-g{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:stroke .25s,fill .25s}
.prg-g.cur{stroke:var(--accent);stroke-width:2.5}
.prg-g.ok{stroke:var(--ok);stroke-width:2.5;fill:var(--ok-soft)}
.prg-g.no{stroke:var(--bad);stroke-width:2}
.prg-tag{font:700 12px var(--mono);fill:var(--muted)}
.prg-l{font:12px var(--mono);fill:var(--text);white-space:pre}
.prg-l.dim{fill:var(--muted);opacity:.7}
.prg-l.in{fill:var(--ok);font-weight:700}
.prg-l.out{fill:var(--bad);font-weight:700}
.prg-l.new{fill:var(--ok);font-weight:700}
.prg-l.drop{fill:var(--bad);text-decoration:line-through}
.prg-act{font:600 11.5px var(--mono);fill:var(--accent)}
.prg-sel{fill:var(--accent-soft);stroke:var(--accent)}
`;
