// The course's student network (exams 6 Feb 2024 and 12 Jul 2024): static figure with every CPT next to its node.
import { edge } from './bn-burglary';
import { arrow, card, md, s, style } from './shell';

type V = 'D' | 'K' | 'G' | 'T' | 'L';
const NODE: Record<V, [number, number, string, string[]]> = {
  D: [200, 50, 'Difficulty', ['d0', 'd1']], K: [480, 50, 'Knowledge', ['k0', 'k1']], G: [300, 180, 'Grade', ['g1', 'g2', 'g3']],
  T: [600, 180, 'Test', ['s0', 's1']], L: [300, 305, 'Letter', ['L0', 'L1']],
};
const PARENTS: Record<V, V[]> = { D: [], K: [], G: ['K', 'D'], T: ['K'], L: ['G'] };
/** One row per combination of the parents' values (first parent slowest), one column per value of the node. */
const CPT: Record<V, number[][]> = {
  D: [[0.1, 0.9]], K: [[0.7, 0.3]],
  G: [[0.3, 0.4, 0.3], [0.05, 0.25, 0.7], [0.9, 0.08, 0.02], [0.5, 0.3, 0.2]],
  T: [[0.95, 0.05], [0.2, 0.8]], L: [[0.1, 0.9], [0.4, 0.6], [0.99, 0.01]],
};
const TABLE: Record<V, [number, number]> = { D: [30, 32], K: [610, 32], G: [20, 138], T: [560, 232], L: [70, 272] };

export function mount(el: HTMLElement) {
  style('fig-bs-css', '.bs-rule{stroke:var(--border-strong)}.bs-p{font:600 13px var(--mono);fill:var(--text)}');
  for (const v in CPT) for (const r of CPT[v as V]) if (Math.abs(r.reduce((a, b) => a + b) - 1) > 1e-9) console.error(`bn-student: a row of P(${v}) does not sum to 1`);
  const c = card(el, 'figure', 'The student network and its CPTs', '0 0 720 350');
  const ah = arrow(c.svg);
  for (const v in PARENTS) for (const p of PARENTS[v as V]) edge(c.svg, NODE[p].slice(0, 2) as [number, number], NODE[v as V].slice(0, 2) as [number, number], ah);
  for (const v of Object.keys(NODE) as V[]) {
    const [x, y, name, vals] = NODE[v];
    const g = s(c.svg, 'g', { class: 'fg-nd' });
    s(g, 'rect', { x: x - 52, y: y - 18, width: 104, height: 36, rx: 18 });
    s(g, 'text', { x, y: y + 4.5 }, name);
    s(c.svg, 'text', { x: x + 60, y: y + 4, class: 'fg-m' }, `{${vals.join(', ')}}`);
    // the table: one column per parent (its values), then one column per value of the node
    const ps = PARENTS[v], [tx, ty] = TABLE[v], head = [...ps, ...vals.map(x => `${v === 'D' || v === 'K' ? 'P(' : ''}${x}${v === 'D' || v === 'K' ? ')' : ''}`)];
    const w = head.map((_, i) => (i < ps.length ? 26 : 46)), at = (i: number) => tx + w.slice(0, i).reduce((a, b) => a + b, 0);
    if (ps.length) s(c.svg, 'text', { x: tx, y: ty - 17, class: 'fg-t' }, `P(${v} | ${ps.join(', ')})`);
    head.forEach((h, i) => s(c.svg, 'text', { x: at(i), y: ty, class: 'fg-m' }, h));
    s(c.svg, 'line', { x1: tx, y1: ty + 5, x2: at(head.length) - 8, y2: ty + 5, class: 'bs-rule' });
    CPT[v].forEach((row, j) => {
      const pv = ps.map((p, i) => {
        const stride = ps.slice(i + 1).reduce((n, q) => n * NODE[q][3].length, 1);
        return NODE[p][3][Math.floor(j / stride) % NODE[p][3].length];
      });
      [...pv, ...row.map(String)].forEach((t, i) => s(c.svg, 'text', { x: at(i), y: ty + 20 + j * 17, class: i < ps.length ? 'fg-t' : 'bs-p' }, t));
    });
  }
  const free = (Object.keys(CPT) as V[]).reduce((n, v) => n + CPT[v].length * (CPT[v][0].length - 1), 0);
  const joint = (Object.keys(NODE) as V[]).reduce((n, v) => n * NODE[v][3].length, 1) - 1;
  c.cap.innerHTML = md('Each node lists its values; next to it, its CPT with **one row per combination of the parents\' values**, each ' +
    `row summing to 1. In total $${free}$ free numbers instead of $${joint}$ for the full joint. The priors of Difficulty and ` +
    'Knowledge change between exam versions; the other tables do not.');
  return { destroy() {} };
}
