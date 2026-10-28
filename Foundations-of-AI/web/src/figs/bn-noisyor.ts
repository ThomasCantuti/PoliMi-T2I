// Noisy-OR (AIMA §13.2.2, uncertainty.md): three inhibition probabilities q_j generate the whole CPT of Fever,
// P(¬fever | causes) = product of q_j over the true causes. Drag the q's, click the causes to pick a row.
import { arrow, bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const CAUSES = [{ name: 'Cold', q: 0.6, x: 70 }, { name: 'Flu', q: 0.2, x: 180 }, { name: 'Malaria', q: 0.1, x: 290 }];
const TX = 380, TY = 52, RH = 27, BW = 64;
const bits = (i: number) => CAUSES.map((_, j) => ((i >> (CAUSES.length - 1 - j)) & 1) === 1); // row 0 = F F F … row 7 = T T T

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-bn-noisyor-css', CSS);
  const c = card(el, 'interactive', 'Noisy-OR: three numbers generate the whole CPT of Fever', '0 0 760 300');
  const ah = arrow(c.svg), q = CAUSES.map(k => k.q);
  let row = 7;
  const FX = 180, FY = 190;
  const qT = CAUSES.map(k => {
    const x2 = FX + (k.x - FX) * 0.22, y2 = FY - 22;
    s(c.svg, 'line', { x1: k.x, y1: 68, x2, y2, class: 'fg-e', 'marker-end': ah });
    return s(c.svg, 'text', { x: k.x + (x2 - k.x) * 0.45 + (k.x < FX ? -7 : 7), y: 68 + (y2 - 68) * 0.45 + 4, class: 'ucd-q', 'text-anchor': k.x < FX ? 'end' : 'start' });
  });
  const nodes = CAUSES.map((k, j) => {
    const g = s(c.svg, 'g', { class: 'fg-nd', tabindex: 0, role: 'button', 'aria-label': `toggle ${k.name}` });
    s(g, 'rect', { x: k.x - 52, y: 32, width: 104, height: 36, rx: 18 });
    const t = s(g, 'text', { x: k.x, y: 54.5 });
    const flip = () => { row ^= 1 << (CAUSES.length - 1 - j); render(); tell(); };
    g.addEventListener('click', flip);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    Object.assign(g.style, { cursor: 'pointer' });
    return { g, t };
  });
  const fever = s(c.svg, 'g', { class: 'fg-nd cur' });
  s(fever, 'rect', { x: FX - 52, y: FY - 18, width: 104, height: 36, rx: 18 });
  s(fever, 'text', { x: FX, y: FY + 4.5 }, 'Fever');
  const fevT = s(c.svg, 'text', { x: FX, y: FY + 44, class: 'ucd-big', 'text-anchor': 'middle' });
  const count = s(c.svg, 'text', { x: 20, y: 280, class: 'fg-m' });

  // the CPT: one row per combination of the causes
  ['Cold', 'Flu', 'Mal.'].forEach((h, j) => s(c.svg, 'text', { x: TX + j * 30, y: TY - 14, class: 'fg-m' }, h));
  s(c.svg, 'text', { x: TX + 90, y: TY - 14, class: 'fg-m' }, 'P(fever)');
  s(c.svg, 'text', { x: TX + 222, y: TY - 14, class: 'fg-m' }, 'P(¬fever) = Π q');
  const rows = Array.from({ length: 2 ** CAUSES.length }, (_, i) => {
    const g = s(c.svg, 'g', { class: 'ucd-r' }), y = TY + i * RH;
    s(g, 'rect', { x: TX - 8, y: y - 4, width: 372, height: RH - 3, rx: 5, class: 'ucd-hl' });
    bits(i).forEach((b, j) => s(g, 'text', { x: TX + j * 30, y: y + 13, class: b ? 'ucd-t' : 'ucd-f' }, b ? 'T' : 'F'));
    s(g, 'rect', { x: TX + 90, y: y + 3, width: BW, height: 11, rx: 3, class: 'ucd-track' });
    const fill = s(g, 'rect', { x: TX + 90, y: y + 3, width: BW, height: 11, rx: 3, class: 'ucd-fill' });
    const p = s(g, 'text', { x: TX + 210, y: y + 13, class: 'ucd-p' });
    const prod = s(g, 'text', { x: TX + 222, y: y + 13, class: 'ucd-prod' });
    g.addEventListener('click', () => { row = i; render(); tell(); });
    return { g, fill, p, prod };
  });

  const knobs = bar(c);
  const inputs = CAUSES.map((k, j) => slider(knobs, `q(${k.name.toLowerCase()})`, 0, 1, 0.01, k.q, v => { q[j] = v; render(); }));
  inputs.forEach(inp => inp.addEventListener('change', () => tell()));
  const tell = () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);

  const pNot = (i: number) => bits(i).reduce((acc, b, j) => acc * (b ? q[j] : 1), 1);
  function render() {
    rows.forEach((r, i) => {
      const pn = pNot(i), on = bits(i).map((b, j) => (b ? num(q[j], 3) : '')).filter(Boolean);
      r.g.setAttribute('class', `ucd-r${i === row ? ' on' : ''}`);
      r.fill.style.transform = `scaleX(${Math.max(0.003, 1 - pn)})`;
      r.p.textContent = num(1 - pn, 4);
      r.prod.textContent = on.length ? `${on.join('·')}${on.length > 1 ? ` = ${num(pn, 4)}` : ''}` : '1 (no cause)';
    });
    const b = bits(row), pn = pNot(row), lit = (j: number) => (b[j] ? '' : '¬') + CAUSES[j].name.toLowerCase();
    nodes.forEach((n, j) => { n.t.textContent = lit(j); n.g.setAttribute('class', `fg-nd${b[j] ? ' obs' : ''}`); });
    qT.forEach((t, j) => { t.textContent = `q = ${num(q[j], 3)}`; t.classList.toggle('off', !b[j]); });
    fevT.textContent = `P(fever | ${CAUSES.map((_, j) => lit(j)).join(', ')}) = ${num(1 - pn, 4)}`;
    count.textContent = `${CAUSES.length} numbers (one q per cause) instead of 2${'⁰¹²³⁴⁵⁶⁷⁸⁹'[CAUSES.length]} = ${2 ** CAUSES.length} rows; with k causes: k instead of 2ᵏ.`;
    const on = b.map((x, j) => (x ? j : -1)).filter(j => j >= 0), cond = CAUSES.map((_, j) => (b[j] ? '' : '\\neg ') + CAUSES[j].name.toLowerCase()).join(', ');
    c.cap.innerHTML = md(on.length
      ? `Row ${cond.replace(/\\neg /g, '¬')}: the fever is absent only if **every** present cause is inhibited, independently: ` +
        `$P(\\neg fever \\mid ${cond}) = ${on.map(j => `q_{${CAUSES[j].name.toLowerCase()}}`).join(' \\cdot ')} = ${on.map(j => num(q[j], 3)).join(' \\cdot ')} = ${num(pn, 4)}$, ` +
        `so $P(fever \\mid ${cond}) = ${num(1 - pn, 4)}$. Absent causes contribute a factor 1. Drag a $q$: every row that contains that cause changes at once.`
      : 'With **no cause present** the product is empty (= 1): $P(fever) = 0$. Noisy-OR assumes every cause is listed; otherwise add a **leak** node for "other causes". Click a cause to switch it on.');
  }
  render();
  return { destroy() {} };
}

const CSS = `
.ucd-q{font:600 12px var(--mono);fill:var(--accent);transition:opacity .25s}
.ucd-q.off{opacity:.35}
.ucd-big{font:600 13px var(--mono);fill:var(--text)}
.ucd-r{cursor:pointer}
.ucd-hl{fill:transparent;transition:fill .2s}
.ucd-r:hover .ucd-hl{fill:var(--panel-2)}
.ucd-r.on .ucd-hl{fill:var(--accent-soft);stroke:var(--accent)}
.ucd-t{font:700 12px var(--mono);fill:var(--ok)}
.ucd-f{font:12px var(--mono);fill:var(--muted)}
.ucd-track{fill:var(--panel-3)}
.ucd-fill{fill:var(--accent);transform-box:fill-box;transform-origin:left;transition:transform .3s}
.ucd-p{font:600 12px var(--mono);fill:var(--text);text-anchor:end}
.ucd-prod{font:12px var(--mono);fill:var(--text-2)}
`;
