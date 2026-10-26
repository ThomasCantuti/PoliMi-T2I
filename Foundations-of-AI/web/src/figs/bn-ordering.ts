// Node ordering (AIMA §13.2): the same five variables added in three orders; parents from the table in uncertainty.md.
import { NAME, net, type Pos } from './bn-burglary';
import { card, s, stepper, type FigOptions, type Frame } from './shell';

const ORDERS: { label: string; parents: Record<string, string[]>; pos: Pos }[] = [
  { label: 'B, E, A, J, M (causal)', parents: { B: [], E: [], A: ['B', 'E'], J: ['A'], M: ['A'] },
    pos: { B: [150, 80], E: [450, 80], A: [300, 175], J: [170, 275], M: [430, 275] } },
  { label: 'M, J, A, B, E', parents: { M: [], J: ['M'], A: ['M', 'J'], B: ['A'], E: ['A', 'B'] },
    pos: { M: [150, 80], J: [450, 80], A: [300, 175], B: [150, 275], E: [450, 275] } },
  { label: 'M, J, E, B, A', parents: { M: [], J: ['M'], E: ['M', 'J'], B: ['M', 'J', 'E'], A: ['M', 'J', 'E', 'B'] },
    pos: { M: [150, 80], J: [450, 80], E: [130, 180], B: [470, 180], A: [300, 285] } },
];
const FULL = 2 ** 5 - 1;

interface F extends Frame { o: number; upto: number; total: number }

function build(): F[] {
  const frames: F[] = [];
  ORDERS.forEach((o, oi) => {
    let total = 0;
    Object.entries(o.parents).forEach(([x, ps], i, all) => {
      const n = 2 ** ps.length;
      total += n;
      const cpt = ps.length ? `P(${x} \\mid ${ps.join(', ')})` : `P(${x})`;
      const end = i === all.length - 1
        ? ` **Total: ${total} numbers**` + (oi === 0 ? '.' : oi === 1 ? ` instead of ${frames[4].total}.` : `: every earlier node is a parent, as many as the full joint ($2^5 - 1 = ${FULL}$).`)
        : '';
      frames.push({ o: oi, upto: i, total, group: o.label,
        cap: `**Ordering ${o.label} · add ${NAME[x]}.** ` + (ps.length ? `Its minimal set of parents among the earlier nodes: ${ps.map(p => NAME[p]).join(', ')}.` : 'No parents.') +
          ` CPT $${cpt}$: $2^${ps.length} = ${n}$ number${n > 1 ? 's' : ''}.${end}` +
          (oi === 1 && x === 'E' ? ' A diagnostic ordering also asks for numbers that are hard to assess: who knows $P(E \\mid A, B)$?' : '') });
    });
  });
  return frames;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  const c = card(el, 'stepper', 'Node ordering: same variables, different networks', '0 0 640 320');
  const label = s(c.svg, 'text', { x: 16, y: 28, class: 'fg-h2' });
  const count = s(c.svg, 'text', { x: 624, y: 28, class: 'fg-v ok', 'text-anchor': 'end' });
  const drawn = ORDERS.map(o => {
    const g = s(c.svg, 'g');
    return { g, ...net(c.svg, g, o.pos, o.parents), keys: Object.keys(o.parents) };
  });
  return stepper(c, build(), f => {
    drawn.forEach((d, oi) => {
      d.g.classList.toggle('hide', oi !== f.o);
      d.keys.forEach((k, i) => {
        d.nodes[k].setAttribute('class', `fg-nd${i > f.upto ? ' hide' : i === f.upto ? ' cur' : ''}`);
        for (const p of ORDERS[oi].parents[k]) d.edges[p + k].setAttribute('class', `fg-e${i > f.upto ? ' hide' : i === f.upto ? ' cur' : ''}`);
      });
    });
    label.textContent = `ordering ${ORDERS[f.o].label}`;
    count.textContent = `${f.total} / ${FULL} numbers`;
  }, opts);
}
