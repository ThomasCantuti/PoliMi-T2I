// Models and entailment on the wumpus KB (AIMA Fig. 7.5): the 8 worlds for pits in [1,2], [2,2], [3,1]; static figure.
import { card, md, s, style } from './shell';

interface World { P12: boolean; P22: boolean; P31: boolean }
// [1,1] and [2,1] are visited: no pit there (R1, and R2 with ¬B11), no breeze in [1,1] (R4), breeze in [2,1] (R5).
const P11 = false, P21 = false, B11 = false, B21 = true;
const kb = (w: World) => !P11 && B11 === (w.P12 || P21) && B21 === (P11 || w.P22 || w.P31) && !B11 && B21; // R1 ∧ … ∧ R5
const WORLDS: World[] = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ P12: !!(i & 4), P22: !!(i & 2), P31: !!(i & 1) }));
const ROWS: { name: string; tex: string; alpha: (w: World) => boolean }[] = [
  { name: 'α₁ = ¬P₁,₂ (no pit in [1,2])', tex: '\\neg P_{1,2}', alpha: w => !w.P12 },
  { name: 'α₂ = ¬P₂,₂ (no pit in [2,2])', tex: '\\neg P_{2,2}', alpha: w => !w.P22 },
];
const X0 = 130, DX = 70, TW = 60, TH = 44, CELL = 16;
// Square (x, y) inside a tile: [1,2] [2,2] on top, [1,1] [2,1] [3,1] below.
const SQUARES: [number, number][] = [[1, 2], [2, 2], [1, 1], [2, 1], [3, 1]];

function tile(svg: SVGSVGElement, x: number, y: number, w: World, inKb: boolean) {
  const g = s(svg, 'g');
  s(g, 'rect', { x, y, width: TW, height: TH, rx: 7, class: inKb ? 'lm-t kb' : 'lm-t' });
  for (const [sx, sy] of SQUARES) {
    const cx = x + 6 + (sx - 1) * CELL, cy = y + 6 + (2 - sy) * CELL;
    s(g, 'rect', { x: cx, y: cy, width: CELL, height: CELL, class: sy === 1 && sx < 3 ? 'lm-c seen' : 'lm-c' });
    const pit = sx === 1 && sy === 2 ? w.P12 : sx === 2 && sy === 2 ? w.P22 : sx === 3 && sy === 1 ? w.P31 : false;
    if (pit) s(g, 'circle', { cx: cx + CELL / 2, cy: cy + CELL / 2, r: 5, class: 'lm-pit' });
  }
}

export function mount(el: HTMLElement) {
  style('fig-lm-css', '.lm-t{fill:var(--panel-2);stroke:var(--border)}.lm-t.kb{stroke:var(--accent);stroke-width:2}' +
    '.lm-c{fill:var(--panel);stroke:var(--border-strong);stroke-width:.8}.lm-c.seen{fill:var(--panel-3)}.lm-pit{fill:var(--text)}' +
    '.lm-kb{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5}.lm-al{fill:none;stroke:var(--info);stroke-width:2;stroke-dasharray:6 4}' +
    '.lm-key{font-size:9.5px;fill:var(--muted);text-anchor:middle}.lm-ok{fill:var(--ok);font-weight:650}.lm-no{fill:var(--bad);font-weight:650}');
  const c = card(el, 'figure', 'Models and entailment: is every model of KB a model of α?', '0 0 700 300');
  // key: which square is which
  s(c.svg, 'text', { x: 16, y: 60, class: 'fg-m' }, 'the squares');
  for (const [sx, sy] of SQUARES) {
    const x = 16 + (sx - 1) * 30, y = 70 + (2 - sy) * 30;
    s(c.svg, 'rect', { x, y, width: 30, height: 30, class: sy === 1 && sx < 3 ? 'lm-c seen' : 'lm-c' });
    s(c.svg, 'text', { x: x + 15, y: y + 18, class: 'lm-key' }, `${sx},${sy}`);
  }
  s(c.svg, 'circle', { cx: 22, cy: 152, r: 5, class: 'lm-pit' });
  s(c.svg, 'text', { x: 32, y: 156, class: 'fg-m' }, 'pit');
  s(c.svg, 'rect', { x: 16, y: 164, width: 12, height: 12, class: 'lm-c seen' });
  s(c.svg, 'text', { x: 32, y: 174, class: 'fg-m' }, 'visited, safe');
  s(c.svg, 'rect', { x: 16, y: 184, width: 12, height: 12, rx: 3, class: 'lm-t kb' });
  s(c.svg, 'text', { x: 32, y: 194, class: 'fg-m' }, 'model of KB');

  const verdicts: string[] = [];
  ROWS.forEach((row, ri) => {
    const y = 70 + ri * 145;
    // order: ¬α¬KB | ¬α KB | α KB | α ¬KB, so both M(KB) and M(α) are contiguous runs of tiles
    const key = (w: World) => (row.alpha(w) ? (kb(w) ? 2 : 3) : (kb(w) ? 1 : 0));
    const order = [...WORLDS].sort((a, b) => key(a) - key(b));
    const span = (f: (w: World) => boolean) => { const ix = order.flatMap((w, i) => (f(w) ? [i] : [])); return [ix[0], ix[ix.length - 1]]; };
    const [k0, k1] = span(kb), [a0, a1] = span(row.alpha);
    s(c.svg, 'rect', { x: X0 + k0 * DX - 6, y: y - 6, width: (k1 - k0) * DX + TW + 12, height: TH + 12, rx: 10, class: 'lm-kb' });
    s(c.svg, 'rect', { x: X0 + a0 * DX - 12, y: y - 14, width: (a1 - a0) * DX + TW + 24, height: TH + 28, rx: 14, class: 'lm-al' });
    order.forEach((w, i) => tile(c.svg, X0 + i * DX, y, w, kb(w)));
    s(c.svg, 'text', { x: X0 + k0 * DX - 6, y: y + TH + 30, class: 'fg-m', fill: 'var(--accent)' }, 'M(KB)');
    s(c.svg, 'text', { x: X0 + a1 * DX + TW + 12, y: y + TH + 30, class: 'fg-m', 'text-anchor': 'end', fill: 'var(--info)' }, `M(${row.name.slice(0, 2)})`);
    s(c.svg, 'text', { x: X0 - 12, y: y - 24, class: 'fg-t', 'font-weight': 650 }, row.name);
    const models = WORLDS.filter(kb), missing = models.filter(w => !row.alpha(w)).length, ok = missing === 0;
    s(c.svg, 'text', { x: 692, y: y - 24, 'text-anchor': 'end', class: ok ? 'lm-ok' : 'lm-no', 'font-size': 13 },
      ok ? `M(KB) ⊆ M(${row.name.slice(0, 2)}): entailed` : `${missing} of ${models.length} models of KB outside: not entailed`);
    verdicts.push(ok ? `every model of KB is a model of $${row.tex}$, so $KB \\models ${row.tex}$`
      : `${missing} of the ${models.length} models of KB are not models of $${row.tex}$, so $KB \\not\\models ${row.tex}$`);
  });
  const n = WORLDS.filter(kb).length;
  c.cap.innerHTML = md(`Each tile is a possible world for the three unknown squares. KB holds in **${n} of 8** of them (blue border): ` +
    `no pit in [1,2], a pit in [2,2] or [3,1]. **Top:** ${verdicts[0]}. **Bottom:** ${verdicts[1]}; one model has no pit in [2,2], ` +
    'so $P_{2,2}$ is not entailed either: the agent cannot tell.');
  return { destroy() {} };
}
