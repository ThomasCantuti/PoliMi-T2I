// Backward chaining (exam 3 Feb 2025) with the exam conventions of logic.md, run for real: the AND-OR tree grows one goal at a time.
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

const KB: { p: string[]; c: string }[] = [
  { p: ['B', 'C'], c: 'A' }, { p: ['J'], c: 'B' }, { p: ['P'], c: 'D' }, { p: ['K'], c: 'G' }, { p: ['G'], c: 'A' }, { p: ['K'], c: 'B' },
  { p: ['M'], c: 'F' }, { p: ['F'], c: 'G' }, { p: ['H'], c: 'A' }, { p: ['M'], c: 'D' }, { p: ['P'], c: 'F' }, { p: ['M'], c: 'K' },
];
const FACTS = new Set(['P']), GOAL = 'A';
const rule = (r: { p: string[]; c: string }) => `${r.p.join(' \\wedge ')} \\Rightarrow ${r.c}`;

type State = 'pend' | 'cur' | 'ok' | 'no' | 'skip';
interface Node { sym: string; parent: number; group: number; state: State; note: string; on: boolean }
interface F extends Frame { nodes: { state: State; note: string; on: boolean }[] }

/** Runs BC and returns the final tree plus one frame per "try a rule / next premise" step. */
function run() {
  const nodes: Node[] = [], frames: F[] = [], failed = new Set<string>(), proved = new Set<string>();
  let cur: F | null = null;
  const snap = () => nodes.map(n => ({ state: n.state, note: n.note, on: n.on }));
  const step = (cap: string) => { if (cur) cur.nodes = snap(); cur = { cap, nodes: [], group: 'bc' }; frames.push(cur); };
  const add = (t: string) => { cur!.cap += ' ' + t; };
  const set = (i: number, state: State, note = '') => { nodes[i].state = state; nodes[i].note = note; };
  const mk = (sym: string, parent: number, group: number) => nodes.push({ sym, parent, group, state: 'pend', note: '', on: true }) - 1;

  function prove(i: number, path: string[]): boolean {
    const g = nodes[i].sym;
    if (FACTS.has(g)) { set(i, 'ok', 'fact'); add(`**${g}** is a fact: ✓.`); return true; }
    if (failed.has(g)) { set(i, 'no', 'already failed'); add(`**${g}** already failed: ✗, not expanded again.`); return false; }
    if (proved.has(g)) { set(i, 'ok', 'already proved'); add(`**${g}** was already proved: ✓.`); return true; }
    if (path.includes(g)) { set(i, 'no', 'loop'); add(`**${g}** is already on the path: ✗ (loop).`); return false; }
    const rules = KB.filter(r => r.c === g);
    if (!rules.length) { set(i, 'no', 'no rule'); failed.add(g); add(`No rule concludes **${g}** and it is not a fact: ✗.`); return false; }
    set(i, 'cur');
    for (const [ri, r] of rules.entries()) {
      step(`${ri ? `Next rule for **${g}**` : `**${g}**: ${rules.length > 1 ? `${rules.length} rules, tried top-down; first` : 'one rule'}`}: try $${rule(r)}$.`);
      const kids = r.p.map(p => mk(p, i, ri));
      let ok = true;
      for (const [k, kid] of kids.entries()) {
        if (k) step(`Next premise of $${rule(r)}$: **${r.p[k]}**.`);
        if (prove(kid, [...path, g])) continue;
        ok = false;
        kids.slice(k + 1).forEach(x => set(x, 'skip', 'not expanded'));
        add(r.p.length > 1 ? `So $${rule(r)}$ fails` + (k + 1 < kids.length ? `: ${r.p.slice(k + 1).join(', ')} is drawn but not expanded.` : '.') : '');
        break;
      }
      if (ok) {
        set(i, 'ok'); proved.add(g);
        add(`So **${g}** ✓ (via $${rule(r)}$).`);
        if (ri < rules.length - 1) add(`${rules.slice(ri + 1).map(x => `$${rule(x)}$`).join(', ')} ${ri + 2 < rules.length ? 'are' : 'is'} never tried.`);
        return true;
      }
    }
    set(i, 'no', ''); failed.add(g);
    add(`No rule left for **${g}**: ✗.`);
    return false;
  }

  const root = mk(GOAL, -1, 0);
  step(`**Goal ${GOAL}.** Rules are tried in the top-down order of the KB, premises left to right; P is the only fact.`);
  nodes[root].state = 'cur';
  prove(root, []);
  cur!.nodes = snap();
  // the tree grows: a node is visible from the first frame in which it exists
  frames.forEach(f => { while (f.nodes.length < nodes.length) f.nodes.push({ state: 'pend', note: '', on: false }); });
  return { nodes, frames };
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-bc-css', '.bc-n rect{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .25s,stroke .25s}' +
    '.bc-n text{font-size:15px;font-weight:700;fill:var(--text);text-anchor:middle}.bc-n .mk{font-size:14px}' +
    '.bc-n.pend rect,.bc-n.skip rect{stroke-dasharray:4 3;fill:var(--panel)}.bc-n.pend text,.bc-n.skip text{fill:var(--muted)}' +
    '.bc-n.cur rect{fill:var(--accent-soft);stroke:var(--accent)}.bc-n.ok rect{fill:var(--ok-soft);stroke:var(--ok)}' +
    '.bc-n.no rect{fill:var(--bad-soft);stroke:var(--bad)}.bc-n.ok .mk{fill:var(--ok)}.bc-n.no .mk{fill:var(--bad)}' +
    '.bc-n .bc-note{font-size:11px;font-weight:400;fill:var(--muted)}.bc-arc{fill:none;stroke:var(--text-2);stroke-width:1.5}' +
    '.bc-rl{font-size:11px;fill:var(--muted);text-anchor:middle}');
  const { nodes, frames } = run();
  const c = card(el, 'stepper', 'Backward chaining: the AND-OR tree for goal A', '0 0 720 330');
  // tidy layout: leaves left to right in DFS order, parents centered over their children
  const kids = (i: number) => nodes.flatMap((n, j) => (n.parent === i ? [j] : []));
  const depth = (i: number): number => (nodes[i].parent < 0 ? 0 : 1 + depth(nodes[i].parent));
  const xs: number[] = [];
  let leaf = 0;
  const place = (i: number): number => {
    const ks = kids(i);
    return (xs[i] = ks.length ? ks.map(place).reduce((a, b) => a + b) / ks.length : leaf++);
  };
  place(0);
  const DX = 620 / Math.max(1, leaf - 1), X = (i: number) => 50 + xs[i] * DX, Y = (i: number) => 34 + depth(i) * 82;
  const edges = nodes.map((n, i) => (n.parent < 0 ? null : s(c.svg, 'line', { x1: X(n.parent), y1: Y(n.parent) + 16, x2: X(i), y2: Y(i) - 16, class: 'fg-e' })));
  // rule labels and AND arcs, one per (parent, rule) group
  const groups = new Map<string, number[]>();
  nodes.forEach((n, i) => { if (n.parent >= 0) groups.set(`${n.parent}:${n.group}`, [...(groups.get(`${n.parent}:${n.group}`) ?? []), i]); });
  const extras = [...groups.entries()].map(([k, members]) => {
    const p = +k.split(':')[0], g = s(c.svg, 'g');
    const r = KB.filter(x => x.c === nodes[p].sym)[+k.split(':')[1]];
    if (members.length > 1) {
      const a = (i: number) => Math.atan2(Y(i) - Y(p), X(i) - X(p)), R = 34;
      const [a0, a1] = [a(members[0]), a(members[members.length - 1])];
      s(g, 'path', { class: 'bc-arc', d: `M${X(p) + R * Math.cos(a0)},${Y(p) + R * Math.sin(a0)} A${R},${R} 0 0 0 ${X(p) + R * Math.cos(a1)},${Y(p) + R * Math.sin(a1)}` });
    }
    const mx = members.reduce((t, i) => t + X(i), 0) / members.length;
    s(g, 'text', { x: (X(p) + mx) / 2 + (mx >= X(p) ? 14 : -14), y: (Y(p) + Y(members[0])) / 2 + 4, class: 'bc-rl' }, `${r.p.join('∧')}⇒${r.c}`);
    return { g, first: members[0] };
  });
  const boxes = nodes.map((n, i) => {
    const g = s(c.svg, 'g', { class: 'bc-n' });
    s(g, 'rect', { x: X(i) - 20, y: Y(i) - 16, width: 40, height: 32, rx: 9 });
    s(g, 'text', { x: X(i), y: Y(i) + 5.5 }, n.sym);
    const mk = s(g, 'text', { x: X(i) + 28, y: Y(i) + 5, class: 'mk' });
    const note = s(g, 'text', { x: X(i), y: Y(i) + 32, class: 'bc-note' });
    return { g, mk, note };
  });

  return stepper(c, frames, f => {
    f.nodes.forEach((st, i) => {
      const b = boxes[i];
      b.g.setAttribute('class', `bc-n ${st.state}${st.on ? '' : ' hide'}`);
      b.mk.textContent = st.state === 'ok' ? '✓' : st.state === 'no' ? '✗' : '';
      b.note.textContent = st.note;
      edges[i]?.classList.toggle('hide', !st.on);
    });
    extras.forEach(e => e.g.classList.toggle('hide', !f.nodes[e.first].on));
  }, opts);
}
