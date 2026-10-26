// The three triples of d-separation, with Y hidden and observed: static figure computed with isActive().
import { isActive } from './bn-dsep';
import { arrow, card, md, s, style } from './shell';

const R = 17;
const TRIPLES: { name: string; arrows: string; parents: Record<string, string[]>; pos: (cx: number, cy: number) => Record<string, [number, number]> }[] = [
  { name: 'causal chain', arrows: 'X → Y → Z', parents: { X: [], Y: ['X'], Z: ['Y'] },
    pos: (cx, cy) => ({ X: [cx - 62, cy], Y: [cx, cy], Z: [cx + 62, cy] }) },
  { name: 'common cause (fork)', arrows: 'X ← Y → Z', parents: { X: ['Y'], Y: [], Z: ['Y'] },
    pos: (cx, cy) => ({ X: [cx - 62, cy + 20], Y: [cx, cy - 20], Z: [cx + 62, cy + 20] }) },
  { name: 'common effect (v-structure)', arrows: 'X → Y ← Z', parents: { X: [], Y: ['X', 'Z'], Z: [] },
    pos: (cx, cy) => ({ X: [cx - 62, cy - 20], Y: [cx, cy + 20], Z: [cx + 62, cy - 20] }) },
];

export function mount(el: HTMLElement) {
  style('fig-tr-css', '.tr-n circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2}.tr-n.obs circle{fill:var(--accent);stroke:var(--accent)}' +
    '.tr-n text{font-size:13px;font-weight:650;fill:var(--text);text-anchor:middle}.tr-n.obs text{fill:#fff}' +
    '.tr-ok{fill:var(--ok);font-weight:650}.tr-no{fill:var(--bad);font-weight:650}');
  const c = card(el, 'figure', 'The three triples: when does influence flow from X to Z?', '0 0 690 300');
  const ah = arrow(c.svg);
  [['Y not observed', 120], ['Y observed', 235]].forEach(([t, y]) => s(c.svg, 'text', { x: 10, y: +y + 4, class: 'fg-t' }, String(t)));
  TRIPLES.forEach((tr, i) => {
    const cx = 210 + i * 190;
    s(c.svg, 'text', { x: cx, y: 26, class: 'fg-t', 'text-anchor': 'middle', 'font-weight': 650 }, tr.name);
    s(c.svg, 'text', { x: cx, y: 46, class: 'fg-m', 'text-anchor': 'middle' }, tr.arrows);
    for (const [cy, ev] of [[120, new Set<string>()], [235, new Set(['Y'])]] as const) {
      const pos = tr.pos(cx, cy), on = isActive(tr.parents, ['X', 'Y', 'Z'], ev);
      for (const ch in tr.parents) for (const p of tr.parents[ch]) {
        const [x1, y1] = pos[p], [x2, y2] = pos[ch], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
        s(c.svg, 'line', { x1: x1 + ux * R, y1: y1 + uy * R, x2: x2 - ux * (R + 3), y2: y2 - uy * (R + 3), class: `fg-e ${on ? 'act' : 'blk'}`, 'marker-end': ah });
      }
      for (const k in pos) {
        const g = s(c.svg, 'g', { class: `tr-n${ev.has(k) ? ' obs' : ''}` });
        s(g, 'circle', { cx: pos[k][0], cy: pos[k][1], r: R });
        s(g, 'text', { x: pos[k][0], y: pos[k][1] + 4.5 }, k);
      }
      s(c.svg, 'text', { x: cx, y: cy + 52, 'text-anchor': 'middle', class: on ? 'tr-ok' : 'tr-no', 'font-size': 13 }, on ? 'active' : 'blocked');
    }
  });
  c.cap.innerHTML = md('Chains and forks are **blocked** by observing the middle node $Y$. The v-structure works the opposite way: ' +
    'it is **blocked** until $Y$, or one of its descendants, is observed.');
  return { destroy() {} };
}
