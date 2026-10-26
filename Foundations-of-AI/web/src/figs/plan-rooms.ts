// Robot, doors and a box (exam 30 Aug 2022): a state is a list of facts, an action a recipe card (stepper).
// Also exports the domain and the room drawing to plan-forward and plan-regression.
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

export interface Act { name: string; pre: string[]; add: string[]; del: string[] }
const CONNECTS: [string, string, string][] = [['D1', 'R1', 'R2'], ['D1', 'R2', 'R1'], ['D2', 'R2', 'R3'], ['D2', 'R3', 'R2']];
export const INIT = ['InRoom(ROBOT,R1)', 'InRoom(BOX1,R2)', ...CONNECTS.map(([d, a, b]) => `Connects(${d},${a},${b})`), 'Box(BOX1)'];
export const GOAL = ['Box(BOX1)', 'InRoom(BOX1,R1)']; // Box(x) ∧ InRoom(x, R1) with x = BOX1, the only box
export const SCHEMA = { GoThru: 'GoThru(d, r1, r2)', PushThru: 'PushThru(b, d, r1, r2)' };
/** The ground actions whose static Connects fact holds (the possible ones), in lexicographic order. */
export const ACTIONS: Act[] = CONNECTS.flatMap(([d, a, b]) => [
  { name: `GoThru(${d},${a},${b})`, pre: [`InRoom(ROBOT,${a})`, `Connects(${d},${a},${b})`], add: [`InRoom(ROBOT,${b})`], del: [`InRoom(ROBOT,${a})`] },
  { name: `PushThru(BOX1,${d},${a},${b})`, pre: [`InRoom(ROBOT,${a})`, `InRoom(BOX1,${a})`, `Connects(${d},${a},${b})`, 'Box(BOX1)'],
    add: [`InRoom(ROBOT,${b})`, `InRoom(BOX1,${b})`], del: [`InRoom(ROBOT,${a})`, `InRoom(BOX1,${a})`] },
]).sort((x, y) => (x.name < y.name ? -1 : 1));

export const applicable = (st: Set<string>, a: Act) => a.pre.every(p => st.has(p));
export const result = (st: Set<string>, a: Act) => new Set([...[...st].filter(f => !a.del.includes(f)), ...a.add]);
const room = (st: Iterable<string>, obj: string) => +[...st].find(f => f.startsWith(`InRoom(${obj},`))!.slice(-2, -1);
/** Display order: the robot, the box, then the static facts as in INIT. */
export const sorted = (facts: Iterable<string>) => [...facts].sort((x, y) => rank(x) - rank(y));
const rank = (f: string) => (f.startsWith('InRoom(ROBOT') ? 0 : f.startsWith('InRoom(BOX1') ? 1 : 2 + INIT.indexOf(f));
export const isStatic = (f: string) => !f.startsWith('InRoom(');

/** Rooms R1–D1–R2–D2–R3 of width `w` at (x, y) with the robot (R) and the box (B); the returned function moves them. */
export function rooms(parent: Element, x: number, y: number, w: number) {
  style('fig-pr-css', CSS);
  const rw = w / 3, h = rw * 0.62, fs = Math.max(9, rw * 0.13);
  for (let k = 0; k < 3; k++) {
    s(parent, 'rect', { x: x + k * rw, y, width: rw, height: h, class: 'pr-room' });
    s(parent, 'text', { x: x + k * rw + 5, y: y + fs + 3, class: 'pr-rl', 'font-size': fs }, `R${k + 1}`);
  }
  for (let k = 1; k < 3; k++) {
    s(parent, 'rect', { x: x + k * rw - 3, y: y + h * 0.3, width: 6, height: h * 0.4, class: 'pr-door' });
    s(parent, 'text', { x: x + k * rw, y: y + h + fs, class: 'pr-rl pr-dl', 'font-size': fs * 0.85, 'text-anchor': 'middle' }, `D${k}`);
  }
  const r = rw * 0.15, robot = s(parent, 'g', { class: 'pr-obj' }), box = s(parent, 'g', { class: 'pr-obj' });
  s(robot, 'circle', { r, class: 'pr-robot' });
  s(robot, 'text', { y: r * 0.4, 'font-size': r * 1.1, class: 'pr-in' }, 'R');
  s(box, 'rect', { x: -r, y: -r, width: 2 * r, height: 2 * r, rx: 3, class: 'pr-box' });
  s(box, 'text', { y: r * 0.4, 'font-size': r * 1.1, class: 'pr-in' }, 'B');
  return (st: Iterable<string>) => {
    robot.style.transform = `translate(${x + (room(st, 'ROBOT') - 0.7) * rw}px, ${y + h * 0.66}px)`;
    box.style.transform = `translate(${x + (room(st, 'BOX1') - 0.3) * rw}px, ${y + h * 0.66}px)`;
  };
}

type Phase = 'state' | 'check' | 'apply';
interface F extends Frame { st: Set<string>; act: Act | null; phase: Phase; next?: Set<string> }

function build(): F[] {
  const named = (n: string) => ACTIONS.find(a => a.name === n)!;
  const no = named('PushThru(BOX1,D1,R1,R2)'), go = named('GoThru(D1,R1,R2)'), push = named('PushThru(BOX1,D1,R2,R1)');
  const s0 = new Set(INIT), s1 = result(s0, go), s2 = result(s1, push);
  const code = (xs: string[]) => xs.map(x => `\`${x}\``).join(', ');
  const missing = no.pre.filter(p => !s0.has(p));
  return [
    { st: s0, act: null, phase: 'state', group: 'state',
      cap: '**A state is a list of facts** that are true right now. Closed world: `InRoom(BOX1,R1)` is not in the list, so it is ' +
        '**false**. `Connects` and `Box` are static: no action ever changes them.' },
    { st: s0, act: no, phase: 'check', group: 'not applicable',
      cap: `**Recipe card** \`${no.name}\`: an action is applicable only if **every** precondition is in the state. ` +
        `${code(missing)} is missing, so it is **not applicable**: the box is not with the robot.` },
    { st: s0, act: go, phase: 'check', group: 'GoThru',
      cap: `\`${go.name}\`: both preconditions are in the state, so it is **applicable**.` },
    { st: s0, act: go, phase: 'apply', next: s1, group: 'GoThru',
      cap: `$RESULT(s, a) = (s - DEL(a)) \\cup ADD(a)$: erase ${code(go.del)}, write ${code(go.add)}. ` +
        `The other ${s0.size - go.del.length} facts are copied unchanged: that is how STRIPS avoids the frame problem.` },
    { st: s1, act: push, phase: 'check', group: 'PushThru',
      cap: `Now robot and box are both in R2: \`${push.name}\` has all ${push.pre.length} preconditions, so it is **applicable**.` },
    { st: s1, act: push, phase: 'apply', next: s2, group: 'PushThru',
      cap: `Erase ${code(push.del)}, write ${code(push.add)}: one action moves the robot **and** the box. ` +
        (GOAL.every(g => s2.has(g)) ? 'The goal $Box(x) \\wedge InRoom(x, R1)$ now holds with $x = BOX1$: a plan of two actions.' : '') },
  ];
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  const c = card(el, 'stepper', 'A state is a list of facts, an action a recipe card', '0 0 720 330');
  const move = rooms(c.svg, 20, 30, 330);
  s(c.svg, 'text', { x: 390, y: 30, class: 'fg-h2' }, 'state s');
  const facts = s(c.svg, 'g'), cardG = s(c.svg, 'g');
  const line = (g: SVGGElement, x: number, y: number, t: string, cls: string) => s(g, 'text', { x, y, class: cls }, t);
  return stepper(c, build(), f => {
    move(f.next ?? f.st);
    facts.replaceChildren();
    const list = f.phase === 'apply' ? sorted(new Set([...f.st, ...f.act!.add])) : sorted(f.st);
    list.forEach((x, i) => {
      const del = f.phase === 'apply' && f.act!.del.includes(x), add = f.phase === 'apply' && f.act!.add.includes(x);
      const pre = f.phase === 'check' && f.act!.pre.includes(x);
      const mark = del ? '−' : add ? '+' : pre ? '✓' : ' ';
      line(facts, 390, 60 + i * 24, `${mark} ${x}`, `pr-f${del ? ' del' : add ? ' add' : pre ? ' pre' : isStatic(x) ? ' st' : ''}`);
    });
    cardG.replaceChildren();
    const a = f.act;
    if (!a) return;
    s(cardG, 'rect', { x: 20, y: 132, width: 330, height: 186, rx: 10, class: 'pr-card' });
    line(cardG, 34, 156, a.name, 'pr-name');
    line(cardG, 34, 174, `schema ${a.name.startsWith('Go') ? SCHEMA.GoThru : SCHEMA.PushThru}`, 'fg-m');
    line(cardG, 34, 198, 'P:', 'fg-m');
    a.pre.forEach((p, i) => {
      const ok = f.st.has(p);
      line(cardG, 60, 198 + i * 19, `${ok ? '✓' : '✗'} ${p}`, `pr-f ${ok ? 'pre' : 'miss'}`);
    });
    const yd = 198 + a.pre.length * 19 + 8, on = f.phase === 'apply' ? '' : ' dim';
    line(cardG, 34, yd, 'DEL:', 'fg-m');
    line(cardG, 74, yd, a.del.join(', '), 'pr-f del' + on);
    line(cardG, 34, yd + 20, 'ADD:', 'fg-m');
    line(cardG, 74, yd + 20, a.add.join(', '), 'pr-f add' + on);
  }, opts);
}

const CSS = `
.pr-room{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:1.5}
.pr-door{fill:var(--panel)}
.pr-rl{fill:var(--muted);font-weight:600}
.pr-obj{transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.pr-robot{fill:var(--accent);stroke:var(--panel);stroke-width:2}
.pr-box{fill:var(--warn);stroke:var(--panel);stroke-width:2}
.pr-in{fill:#fff;font-weight:700;text-anchor:middle;pointer-events:none}
.pr-card{fill:var(--panel-2);stroke:var(--border-strong)}
.pr-name{font:600 14px var(--mono);fill:var(--text)}
.pr-f{font:12.5px var(--mono);fill:var(--text);white-space:pre}
.pr-f.st{fill:var(--muted)}
.pr-f.pre{fill:var(--accent)}
.pr-f.miss{fill:var(--bad);font-weight:700}
.pr-f.add{fill:var(--ok);font-weight:700}
.pr-f.del{fill:var(--bad);text-decoration:line-through}
.pr-f.dim{opacity:.55;font-weight:400}
`;
