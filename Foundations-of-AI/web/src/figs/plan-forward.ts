// Forward (progression) planning on the robot-and-box rooms (exam 30 Aug 2022): BFS graph search with the goal test at
// generation, actions in lexicographic order. The tree is computed, one frame per generated node.
import { ACTIONS, GOAL, INIT, applicable, result, rooms, sorted, isStatic } from './plan-rooms';
import { arrow, card, s, stepper, style, type FigOptions, type Frame } from './shell';

type Status = 'root' | 'new' | 'repeated' | 'goal';
interface N { st: Set<string>; parent: number; act: string; status: Status; depth: number; same?: number }
interface F extends Frame { upto: number; cur: number }

const key = (st: Set<string>) => sorted(st).join('|');
const code = (x: string) => `\`${x}\``;

function search() {
  const nodes: N[] = [{ st: new Set(INIT), parent: -1, act: '', status: 'root', depth: 0 }];
  const frames: F[] = [{ upto: 0, cur: -1, group: 'root',
    cap: '**Root = Init.** Breadth-first **graph** search, goal test **when a node is generated**, actions in lexicographic ' +
      `order (the ${ACTIONS.length} ground actions whose \`Connects\` fact holds). Frontier = [n0].` }];
  const reached = new Map([[key(nodes[0].st), 0]]), frontier = [0];
  while (frontier.length) {
    const i = frontier.shift()!, apps = ACTIONS.filter(a => applicable(nodes[i].st, a));
    for (const [j, a] of apps.entries()) {
      const st = result(nodes[i].st, a), goal = GOAL.every(g => st.has(g)), same = reached.get(key(st));
      const status: Status = goal ? 'goal' : same !== undefined ? 'repeated' : 'new', c = nodes.length;
      nodes.push({ st, parent: i, act: a.name, status, depth: nodes[i].depth + 1, same });
      if (status === 'new') { reached.set(key(st), c); frontier.push(c); }
      let cap = j ? '' : `**Expand n${i}.** Applicable: ${apps.map(b => code(b.name)).join(', ')} (${apps.length} of ${ACTIONS.length})` +
        (apps.every(b => b.name.startsWith('GoThru')) ? ': the robot is not with the box, so no PushThru applies. ' : '. ');
      cap += `Generate n${c} with ${code(a.name)}: ` + (status === 'goal'
        ? `the goal $Box(x) \\wedge InRoom(x, R1)$ holds → **stop at generation**` +
          (apps.length > j + 1 ? ` (${apps.slice(j + 1).map(b => code(b.name)).join(', ')} is never tried)` : '') +
          `. Plan along the path: **${plan(nodes, c).join(', ')}**.`
        : status === 'repeated' ? `the same state as n${same}: **repeated**, dropped (graph search).`
        : `a new state without the goal → frontier = [${frontier.map(k => 'n' + k).join(', ')}].`);
      frames.push({ upto: c, cur: i, group: `expand n${i}`, cap });
      if (goal) return { nodes, frames };
    }
  }
  return { nodes, frames };
}

function plan(nodes: N[], i: number): string[] {
  return i <= 0 ? [] : [...plan(nodes, nodes[i].parent), nodes[i].act];
}

const W = 760, BW = 224, BH = 70, DY = 140;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-pf-css', CSS);
  const { nodes, frames } = search();
  const depth = Math.max(...nodes.map(n => n.depth));
  const c = card(el, 'stepper', 'Forward planning: breadth-first search from Init', `0 0 ${W} ${16 + depth * DY + BH + 12}`);
  const ah = arrow(c.svg);
  const level = nodes.map(n => nodes.filter(m => m.depth === n.depth));
  const pos = nodes.map((n, i) => [(level[i].indexOf(n) + 0.5) * W / level[i].length, 16 + n.depth * DY] as const);
  const edges = nodes.map((n, i) => {
    if (n.parent < 0) return null;
    const [px, py] = pos[n.parent], [x, y] = pos[i], g = s(c.svg, 'g');
    s(g, 'line', { x1: px, y1: py + BH, x2: x, y2: y - 3, class: 'fg-e', 'marker-end': ah });
    s(g, 'text', { x, y: y - 9, class: 'pf-act', 'text-anchor': 'middle' }, n.act);
    return g;
  });
  const boxes = nodes.map((n, i) => {
    const [x, y] = pos[i], g = s(c.svg, 'g', { class: 'pf-n' });
    s(g, 'rect', { x: x - BW / 2, y, width: BW, height: BH, rx: 10, class: 'pf-box' });
    s(g, 'text', { x: x - BW / 2 + 8, y: y + 16, class: 'pf-tag' },
      `n${i}` + (n.status === 'repeated' ? ` = n${n.same} · repeated` : n.status === 'goal' ? ' · goal' : ''));
    rooms(g, x - BW / 2 + 10, y + 26, 129)(n.st);
    sorted(n.st).filter(f => !isStatic(f)).forEach((f, k) => s(g, 'text', { x: x + 68, y: y + 38 + k * 18, class: 'pf-f', 'text-anchor': 'middle' },
      f.slice(7, -1).replace(',', ' in ')));
    return g;
  });
  return stepper(c, frames, f => {
    nodes.forEach((n, i) => {
      const on = i <= f.upto;
      boxes[i].setAttribute('class', `pf-n ${n.status}${on ? '' : ' hide'}${i === f.cur || (i === f.upto && f.cur >= 0) ? ' cur' : ''}`);
      edges[i]?.classList.toggle('hide', !on);
    });
  }, opts);
}

const CSS = `
.pf-n{transition:opacity .3s}
.pf-box{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:stroke .25s,fill .25s}
.pf-n.cur .pf-box{stroke:var(--accent);stroke-width:2.5}
.pf-n.goal .pf-box{stroke:var(--ok);stroke-width:2.5;fill:var(--ok-soft)}
.pf-n.repeated .pf-box{stroke-dasharray:6 5}
.pf-n .pr-dl{display:none}
.pf-n.repeated{opacity:.6}
.pf-n.repeated.hide,.pf-n.hide{opacity:0}
.pf-tag{font:600 11.5px var(--mono);fill:var(--muted)}
.pf-n.goal .pf-tag{fill:var(--ok)}
.pf-f{font:11px var(--mono);fill:var(--text-2)}
.pf-act{font:11.5px var(--mono);fill:var(--text);paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round}
`;
