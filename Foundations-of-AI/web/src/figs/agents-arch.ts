// The four agent architectures (AIMA Figs. 2.9–2.14, slides p. 35–51): one stepper, each step adds (or replaces) boxes.
import { arrow, card, s, stepper, style, type FigOptions, type Frame } from './shell';

const NAMES = ['Simple reflex agent', 'Model-based reflex agent', 'Goal-based agent', 'Utility-based agent'];
const ALL = [0, 1, 2, 3], MODEL = [1, 2, 3];

// [x center, y center, width, label, pill (= knowledge) or box (= computed), frames where it is shown]
const NODES: [number, number, number, string, boolean, number[]][] = [
  [545, 48, 100, 'Sensors', false, ALL],
  [545, 392, 100, 'Actuators', false, ALL],
  [360, 118, 250, 'What the world is like now', false, ALL],
  [360, 190, 250, 'What it will be like if I do action a', false, [2, 3]],
  [360, 262, 250, 'How happy I will be in such a state', false, [3]],
  [360, 334, 250, 'What action I should do now', false, ALL],
  [112, 60, 184, 'State', true, MODEL],
  [112, 108, 184, 'How the world evolves', true, MODEL],
  [112, 156, 184, 'What my actions do', true, MODEL],
  [112, 214, 184, 'Goals', true, [2]],
  [112, 262, 184, 'Utility', true, [3]],
  [112, 334, 184, 'Condition–action rules', true, [0, 1]],
];
const EDGES: [string, number[]][] = [
  ['M658,48 L599,48', ALL], ['M545,66 C545,105 520,118 489,118', ALL], ['M485,334 C525,334 545,345 545,370', ALL], ['M595,392 L656,392', ALL],
  ['M360,138 L360,312', [0, 1]], ['M204,334 L231,334', [0, 1]],
  ['M204,60 C222,60 214,112 231,112', MODEL], ['M204,108 C218,108 216,118 231,118', MODEL], ['M204,156 C222,156 214,124 231,124', MODEL],
  ['M360,138 L360,168', [2, 3]], ['M204,156 C222,156 214,190 231,190', [2, 3]],
  ['M360,210 L360,312', [2]], ['M204,214 C225,214 214,330 231,330', [2]],
  ['M360,210 L360,240', [3]], ['M360,282 L360,312', [3]], ['M204,262 L231,262', [3]],
];
const NOTES: [number, number, string, string, number[]][] = [
  [628, 38, 'percepts', 'middle', ALL], [628, 382, 'actions', 'middle', ALL],
  [538, 88, 'sensor model', 'end', MODEL], [112, 189, 'transition model ↑', 'middle', MODEL],
];

const CAPS = [
  'Acts on the **current percept only**: condition–action rules map "what the world is like now" straight to an action. ' +
    'It works only if the current percept is enough (≈ fully observable); with no memory the vacuum agent goes back and forth forever. ' +
    'Examples: the first Roomba, IFTTT recipes.',
  'Adds an internal **state**, its best guess of the world, updated with the **transition model** (how the world evolves, ' +
    'what my actions do) and the **sensor model** (how the world shows up in the percepts). It remembers what it cannot see now, ' +
    'so it handles **partial observability**. Example: Roomba 980 with SLAM.',
  'Replaces the fixed rules with **goals**: it uses the model to predict "what the world will be like if I do action $a$" and ' +
    'chooses actions that reach a goal, possibly after a long sequence → **search and planning**. To change its behaviour, ' +
    'change the goal, not the rules.',
  'Replaces the yes/no goal with a **utility** $U(s)$, how happy a state makes it, and chooses ' +
    '$a^* = \\arg\\max_a \\sum_{s\'} P(s\' \\mid s, a)\\,U(s\')$. Needed when goals conflict (speed vs safety) or success is ' +
    'uncertain. The most flexible, and the most expensive to compute.',
];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-ar-css', '.ar-box{fill:none;stroke:var(--border-strong);stroke-dasharray:6 5}.ar-env{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2}' +
    '.ar-ttl{font-size:13px;font-weight:700;fill:var(--text-2)}.fg-nd.ar text{font-size:12px}.ar-note{transition:opacity .3s}');
  const c = card(el, 'stepper', 'The four agent architectures: each one adds a box', '0 0 760 430');
  const ah = arrow(c.svg);
  s(c.svg, 'rect', { x: 12, y: 12, width: 600, height: 406, rx: 14, class: 'ar-box' });
  s(c.svg, 'text', { x: 28, y: 36, class: 'ar-ttl' }, 'Agent');
  s(c.svg, 'rect', { x: 660, y: 12, width: 88, height: 406, rx: 14, class: 'ar-env' });
  s(c.svg, 'text', { x: 704, y: 219, class: 'ar-ttl', 'text-anchor': 'middle', transform: 'rotate(-90 704 215)' }, 'Environment');
  const name = s(c.svg, 'text', { x: 235, y: 36, class: 'fg-h2' });
  const edges = EDGES.map(([d]) => s(c.svg, 'path', { d, class: 'fg-e', 'marker-end': ah }));
  const nodes = NODES.map(([x, y, w, text, pill]) => {
    const g = s(c.svg, 'g', { class: 'fg-nd ar' });
    s(g, 'rect', { x: x - w / 2, y: y - (pill ? 18 : 20), width: w, height: pill ? 36 : 40, rx: pill ? 18 : 6 });
    s(g, 'text', { x, y: y + 4 }, text);
    return g;
  });
  const notes = NOTES.map(([x, y, text, anchor]) => s(c.svg, 'text', { x, y, class: 'fg-m ar-note', 'text-anchor': anchor }, text));
  const cls = (base: string, on: number[], i: number) => base + (!on.includes(i) ? ' hide' : on[0] === i && i > 0 ? ' cur' : '');
  const frames: Frame[] = NAMES.map((n, i) => ({ group: n, cap: `**${i + 1} · ${n}.** ${CAPS[i]}` }));
  return stepper(c, frames, (_, i) => {
    name.textContent = `${i + 1} · ${NAMES[i]}`;
    NODES.forEach((n, k) => nodes[k].setAttribute('class', cls('fg-nd ar', n[5], i)));
    EDGES.forEach((e, k) => edges[k].setAttribute('class', cls('fg-e', e[1], i)));
    NOTES.forEach((n, k) => notes[k].setAttribute('class', cls('fg-m ar-note', n[4], i).replace(' cur', '')));
  }, opts);
}
