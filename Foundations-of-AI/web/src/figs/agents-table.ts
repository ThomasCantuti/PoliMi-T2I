// Agent programs (slides p. 31–34, AIMA Figs. 2.3, 2.7, 2.8): the TABLE-DRIVEN-AGENT's table has Σ_{t=1..T} |P|^t rows;
// REFLEX-VACUUM-AGENT implements the same behaviour in 4 lines. Log-scale plot of the table size against the lifetime T.
import { bar, card, label, md, s, slider, style, type FigOptions } from './shell';

const PERCEPTS = ['[A, Clean]', '[A, Dirty]', '[B, Clean]', '[B, Dirty]'];
const reflex = (p: string) => (p.includes('Dirty') ? 'Suck' : p.includes('A') ? 'Right' : 'Left'); // Fig. 2.8
const TMAX = 60, YMAX = 130, PX = 400, PY = 30, PW = 350, PH = 190;

/** log10 of Σ_{t=1..T} P^t = log10(P (P^T − 1) / (P − 1)), stable for huge values. */
export const log10Rows = (P: number, T: number) => T * Math.log10(P) + Math.log10((1 - P ** -T) / (1 - 1 / P));
const exact = (P: number, T: number) => { let n = 0n; for (let t = 1; t <= T; t++) n += BigInt(P) ** BigInt(t); return n; };
/** Writes "head 10^e tail" into an SVG text with e as a superscript. */
function sup(t: SVGTextElement, head: string, e: number | null, tail = '') {
  t.replaceChildren(head);
  if (e === null) return void t.append(tail);
  s(t, 'tspan', {}, '10');
  s(t, 'tspan', { dy: -6, 'font-size': '.72em' }, String(e));
  s(t, 'tspan', { dy: 6 }, tail);
}
const big = (P: number, T: number) => {
  const l = log10Rows(P, T);
  if (l < 15) return { head: exact(P, T).toLocaleString('en-US'), e: null, tex: exact(P, T).toLocaleString('en-US').replace(/,/g, '{,}') };
  const e = Math.floor(l), m = 10 ** (l - e);
  return { head: `${m.toFixed(1)} × `, e, tex: `${m.toFixed(1)} \\times 10^{${e}}` };
};

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-agt-css', CSS);
  const c = card(el, 'interactive', 'A table of every percept sequence vs a 4-line program', '0 0 780 282');
  let P = 4, T = 10;
  if (exact(4, 10) !== 1398100n || Math.abs(log10Rows(4, 10) - Math.log10(1398100)) > 1e-9) console.error('agents-table: vacuum T = 10 should give 1,398,100 rows');

  s(c.svg, 'text', { x: 16, y: 22, class: 'fg-t' }, 'TABLE-DRIVEN-AGENT: the vacuum world\'s table');
  const rows = Array.from({ length: 8 }, (_, i) => [s(c.svg, 'text', { x: 16, y: 46 + i * 18, class: 'agt-row' }), s(c.svg, 'text', { x: 330, y: 46 + i * 18, class: 'agt-act', 'text-anchor': 'end' })]);
  const count = s(c.svg, 'text', { x: 16, y: 200, class: 'fg-v ok' });
  s(c.svg, 'text', { x: 16, y: 230, class: 'fg-t' }, 'REFLEX-VACUUM-AGENT([location, status]): 4 lines, any T');
  s(c.svg, 'text', { x: 16, y: 250, class: 'agt-code' }, 'if status = Dirty then return Suck');
  s(c.svg, 'text', { x: 16, y: 266, class: 'agt-code' }, 'else if location = A then return Right · else Left');

  // plot: log10 of the number of rows against the lifetime T
  label(c.svg, PX - 34, 16, 'rows in the table (log scale)', { class: 'fg-t' });
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'agt-box' });
  const X = (t: number) => PX + ((t - 1) / (TMAX - 1)) * PW, Y = (l: number) => PY + PH - (Math.min(l, YMAX) / YMAX) * PH;
  for (const v of [0, 40, 80, 120]) {
    s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: Y(v), y2: Y(v), class: 'agt-grid' });
    sup(s(c.svg, 'text', { x: PX - 6, y: Y(v) + 4, class: 'fg-m', 'text-anchor': 'end' }), '', v ? v : null, v ? '' : '1');
  }
  for (const t of [1, 20, 40, 60]) s(c.svg, 'text', { x: X(t), y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'middle' }, String(t));
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 30, class: 'fg-m', 'text-anchor': 'end' }, 'lifetime T (percepts)');
  s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: Y(80), y2: Y(80), class: 'agt-atoms' });
  sup(s(c.svg, 'text', { x: PX + 6, y: Y(80) - 5, class: 'agt-atomt' }), 'atoms in the universe ≈ ', 80);
  s(c.svg, 'line', { x1: PX, x2: PX + PW, y1: Y(Math.log10(4)), y2: Y(Math.log10(4)), class: 'agt-prog' });
  s(c.svg, 'text', { x: PX + PW - 6, y: Y(Math.log10(4)) - 5, class: 'agt-progt', 'text-anchor': 'end' }, 'the 4-line program');
  const vac = s(c.svg, 'polyline', { class: 'agt-vac' }), cur = s(c.svg, 'polyline', { class: 'agt-cur' });
  const curT = s(c.svg, 'text', { class: 'agt-curt', 'text-anchor': 'end' }), dot = s(c.svg, 'circle', { r: 5, class: 'agt-dot' });
  vac.setAttribute('points', Array.from({ length: TMAX }, (_, i) => `${X(i + 1)},${Y(log10Rows(4, i + 1))}`).join(' '));

  const knobs = bar(c);
  const pIn = slider(knobs, 'percepts |P|', 2, 100, 1, P, v => { P = v; render(); });
  const tIn = slider(knobs, 'lifetime T', 1, TMAX, 1, T, v => { T = v; render(); });
  for (const inp of [pIn, tIn]) inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`));
  const b = document.createElement('button');
  b.className = 'btn sm';
  b.textContent = 'vacuum world, T = 10';
  b.onclick = () => { for (const [inp, v] of [[pIn, 4], [tIn, 10]] as const) { inp.value = String(v); inp.dispatchEvent(new Event('input')); } };
  knobs.append(b);

  function render() {
    // the first rows of the vacuum table (Fig. 2.3): every sequence of length 1, then of length 2, …; the action is the reflex rule on the last percept
    const seqs: string[][] = [];
    for (let len = 1; len <= T && seqs.length < 6; len++)
      for (let k = 0; k < 4 ** len && seqs.length < 6; k++) seqs.push(Array.from({ length: len }, (_, j) => PERCEPTS[Math.floor(k / 4 ** (len - 1 - j)) % 4]));
    const lines: [string, string][] = seqs.map(sq => [sq.join(', '), reflex(sq[sq.length - 1])]);
    if (T > 2) lines.push(['⋮', '']);
    if (T > 1) lines.push([T > 3 ? `${T} × [B, Dirty] (the last row)` : Array(T).fill('[B, Dirty]').join(', '), 'Suck']);
    rows.forEach(([r, a], i) => { r.textContent = lines[i]?.[0] ?? ''; a.textContent = lines[i]?.[1] ? `→ ${lines[i][1]}` : ''; });
    const n4 = big(4, T), n = big(P, T), l = log10Rows(P, T);
    sup(count, n4.head, n4.e, ` rows for T = ${T}`);
    cur.setAttribute('points', Array.from({ length: TMAX }, (_, i) => `${X(i + 1)},${Y(log10Rows(P, i + 1))}`).join(' '));
    cur.classList.toggle('hide', P === 4);
    dot.setAttribute('cx', String(X(T)));
    dot.setAttribute('cy', String(Y(l)));
    curT.setAttribute('x', String(PX + PW - 4));
    curT.setAttribute('y', String(Y(log10Rows(P, TMAX)) + 14));
    curT.textContent = P === 4 ? '' : `|P| = ${P}`;
    c.cap.innerHTML = md(`With $|P| = ${P}$ possible percepts and a lifetime of $T = ${T}$ the table needs $\\sum_{t=1}^{${T}} ${P}^t = ${n.tex}$ rows` +
      (P === 4 ? ' (the vacuum world: the blue curve)' : '') + (l > 80 ? ', **more than the atoms in the observable universe**' : '') + '. ' +
      `In the vacuum world every row only repeats the answer of the 4-line program for the **last** percept: the table grows as $4^T$ ($${n4.tex}$ rows at $T = ${T}$), the program does not grow at all. ` +
      'That is the slides\' point: produce rational behaviour from a **smallish program**, not from a table. The four architectures below are four ways to compress it.');
  }
  render();
  return { destroy() {} };
}

const CSS = `
.agt-row{font:11.5px var(--mono);fill:var(--text-2)}
.agt-act{font:600 11.5px var(--mono);fill:var(--accent)}
.agt-code{font:11.5px var(--mono);fill:var(--text-2)}
.agt-box{fill:var(--panel-2);stroke:var(--border)}
.agt-grid{stroke:var(--border);stroke-dasharray:2 4}
.agt-atoms{stroke:var(--bad);stroke-width:1.5;stroke-dasharray:6 4}
.agt-atomt{font:600 11px var(--mono);fill:var(--bad)}
.agt-prog{stroke:var(--ok);stroke-width:2}
.agt-progt{font:600 11px var(--mono);fill:var(--ok)}
.agt-vac{fill:none;stroke:var(--accent);stroke-width:2.5}
.agt-cur{fill:none;stroke:var(--warn);stroke-width:2.5}
.agt-curt{font:600 11px var(--mono);fill:var(--warn)}
.agt-dot{fill:var(--text);stroke:var(--panel);stroke-width:2}
`;
