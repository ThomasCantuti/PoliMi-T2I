// Automatic assembly sequences (slides p. 76–77, 107): a toy gearbox of five parts. A state is the set of parts in place,
// an action adds a part whose supports are there and whose way in is still open. The slides give no instance: this one is ours.
import { bar, card, md, s, style, type FigOptions } from './shell';
import { btn } from './search-kit';

const PARTS = ['base', 'shaft', 'gear', 'bearing', 'cover'] as const;
type Part = (typeof PARTS)[number];
const LETTER: Record<Part, string> = { base: 'B', shaft: 'S', gear: 'G', bearing: 'R', cover: 'C' };
const NEEDS: Record<Part, Part[]> = { base: [], shaft: ['base'], gear: ['shaft'], bearing: ['shaft'], cover: ['base'] };
const INSIDE: Part[] = ['shaft', 'gear', 'bearing']; // cannot be inserted once the cover is on
const key = (st: Part[]) => PARTS.filter(p => st.includes(p)).map(p => LETTER[p]).join('') || '∅';

export const actions = (st: Part[]) => PARTS.filter(p => !st.includes(p) && NEEDS[p].every(q => st.includes(q)) && !(st.includes('cover') && INSIDE.includes(p)));

/** All reachable states (by number of parts) and the number of search-tree nodes (paths from the empty assembly). */
function space() {
  const states = new Map<string, Part[]>(), edges: [string, string][] = [];
  let paths = 0, complete = 0;
  const walk = (st: Part[]) => {
    paths++;
    if (st.length === PARTS.length) complete++;
    if (!states.has(key(st))) states.set(key(st), st);
    for (const p of actions(st)) { edges.push([key(st), key([...st, p])]); walk([...st, p]); }
  };
  walk([]);
  return { states, edges: [...new Set(edges.map(e => e.join('>')))].map(e => e.split('>') as [string, string]), paths, complete };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fmy-css', CSS);
  const c = card(el, 'interactive', 'Assembly sequences: some orders lead to a dead end', '0 0 780 262');
  const S = space(), cols: string[][] = [];
  for (const [k, st] of S.states) (cols[st.length] ??= []).push(k);
  const pos = new Map<string, [number, number]>();
  cols.forEach((ks, n) => ks.forEach((k, j) => pos.set(k, [318 + n * 88, 130 + (j - (ks.length - 1) / 2) * 62])));
  const dead = [...S.states].filter(([, st]) => st.length < PARTS.length && !actions(st).length).map(([k]) => k);
  let st: Part[] = [], said = '';

  // the gearbox, side view: missing parts are dashed ghosts
  const shapes: Record<Part, string> = {
    base: 'M40,206 h210 v18 h-210 z', shaft: 'M137,86 h16 v120 h-16 z', gear: 'M100,136 h90 v18 h-90 z',
    bearing: 'M121,100 h48 v14 h-48 z', cover: 'M52,206 V62 Q52,48 66,48 H224 Q238,48 238,62 V206',
  };
  const look = Object.fromEntries(PARTS.map(p => [p, s(c.svg, 'path', { d: shapes[p], class: `fmy-p fmy-${p}` })])) as Record<Part, SVGPathElement>;
  s(c.svg, 'text', { x: 40, y: 250, class: 'fmy-key' }, PARTS.map(p => `${LETTER[p]} ${p}`).join(' · '));
  for (const [a, b] of S.edges) { const [x1, y1] = pos.get(a)!, [x2, y2] = pos.get(b)!; s(c.svg, 'line', { x1: x1 + 20, y1, x2: x2 - 20, y2, class: 'fg-e' }); }
  const nodes = new Map<string, SVGGElement>();
  for (const [k, [x, y]] of pos) {
    const g = s(c.svg, 'g', { class: `fmy-n${dead.includes(k) ? ' dead' : ''}${k.length === PARTS.length ? ' goal' : ''}` });
    s(g, 'circle', { cx: x, cy: y, r: 20 });
    s(g, 'text', { x, y: y + 4 }, k);
    nodes.set(k, g);
  }
  s(c.svg, 'text', { x: 300, y: 22, class: 'fg-t' }, `${S.states.size} states · ${S.paths} search-tree nodes · ${S.complete} complete sequences`);

  const ctl = bar(c), add = bar(c);
  btn(ctl, '↶ Undo', () => { st = st.slice(0, -1); render(); });
  btn(ctl, '↺ Reset', () => { st = []; render(); });

  function render() {
    for (const p of PARTS) look[p].classList.toggle('on', st.includes(p));
    nodes.forEach((g, k) => g.classList.toggle('cur', k === key(st)));
    add.replaceChildren();
    const lab = document.createElement('span');
    lab.className = 'fmy-lab';
    lab.textContent = 'add a part:';
    add.append(lab);
    const acts = actions(st);
    for (const p of PARTS) if (!st.includes(p)) btn(add, p, () => { st = [...st, p]; render(); opts.onEvent?.(`[${c.title}] added the ${p}: state ${key(st)}`); }).disabled = !acts.includes(p);
    const k = key(st), [stage, text] = st.length === PARTS.length
      ? ['goal', `<span class="yes">**Assembled**</span> in the order ${st.join(', ')}. Only ${S.complete} of the ${S.paths} search-tree nodes are complete sequences; the gear and the bearing commute, so two paths reach the same state (a **repeated state**, but only a few: the tree is finite).`]
      : dead.includes(k)
      ? [`dead${k}`, `**Dead end at ${k}:** the cover is on, so the ${INSIDE.filter(p => !st.includes(p)).join(' and ')} can no longer go in. A good assembly sequence never has to undo work; here the only way out is **Undo**. ${dead.length} of the ${S.states.size} states are dead ends (red).`]
      : ['play', `**State = the set of parts in place** (now ${k}). \`actions(s)\`: a part whose supports are in place and whose way in is still open (the cover closes the inside). Build the gearbox: the graph shows where you are.`];
    if (stage === said) return;
    said = stage;
    c.cap.innerHTML = md(text);
  }
  render();
  return { destroy() {} };
}

const CSS = `
.fmy-p{fill:none;stroke:var(--muted);stroke-width:1.5;stroke-dasharray:4 3;transition:fill .3s,stroke .3s}
.fmy-p.on{stroke-dasharray:none;stroke-width:2.5}
.fmy-base.on{fill:var(--v-explored);stroke:var(--text-2)}
.fmy-shaft.on{fill:var(--accent);stroke:var(--accent)}
.fmy-gear.on{fill:var(--warn);stroke:var(--warn)}
.fmy-bearing.on{fill:var(--info);stroke:var(--info)}
.fmy-cover.on{fill:var(--accent-soft);stroke:var(--accent-2)}
.fmy-key{font:11px var(--mono);fill:var(--muted)}
.fmy-n circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .25s,stroke .25s}
.fmy-n text{font:600 10.5px var(--mono);fill:var(--text);text-anchor:middle}
.fmy-n.dead circle{stroke:var(--bad);fill:var(--bad-soft)}
.fmy-n.goal circle{stroke:var(--ok);fill:var(--ok-soft)}
.fmy-n.cur circle{stroke:var(--accent);stroke-width:4}
.fmy-lab{font-size:12.5px;color:var(--muted)}
`;
