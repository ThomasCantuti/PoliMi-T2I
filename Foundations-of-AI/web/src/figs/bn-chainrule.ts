// The chain rule of Bayesian networks (AIMA §13.2, uncertainty.md): one atomic event of the burglary network is the
// product of one CPT entry per node; click a node to flip its value and the product is rebuilt factor by factor.
import { CPT, NAME, P, PARENTS, net, type Pos } from './bn-burglary';
import { bar, card, md, num, s, style, type FigOptions } from './shell';

const ORDER = ['B', 'E', 'A', 'J', 'M']; // topological: every parent before its children
const POS: Pos = { B: [250, 50], E: [470, 50], A: [360, 150], J: [250, 255], M: [470, 255] };
const TABLE: Record<string, [number, number]> = { B: [20, 30], E: [552, 30], A: [20, 112], J: [20, 238], M: [552, 238] };
const PRESETS: [string, Record<string, boolean>][] = [
  ['j, m, a, ¬b, ¬e (page)', { B: false, E: false, A: true, J: true, M: true }],
  ['b, ¬e, a, j, m', { B: true, E: false, A: true, J: true, M: true }],
  ['all false', { B: false, E: false, A: false, J: false, M: false }],
];
const lit = (x: string, v: boolean) => (v ? '' : '¬') + x.toLowerCase();
const factor = (x: string, ev: Record<string, boolean>) => `P(${lit(x, ev[x])}${PARENTS[x].length ? ' | ' + PARENTS[x].map(p => lit(p, ev[p])).join(', ') : ''})`;
const joint = (ev: Record<string, boolean>) => ORDER.reduce((p, x) => p * P(x, ev[x], ev), 1);
const LOGW = 300, DECADES = 6;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-bn-chainrule-css', CSS);
  let total = 0;
  for (let m = 0; m < 32; m++) total += joint(Object.fromEntries(ORDER.map((x, i) => [x, ((m >> i) & 1) === 1])));
  if (Math.abs(total - 1) > 1e-12) console.error(`bn-chainrule: the 32 atomic events sum to ${total}`);
  if (num(joint(PRESETS[0][1]), 3) !== '0.000628') console.error('bn-chainrule: P(j, m, a, ¬b, ¬e) is not the 0.000628 of uncertainty.md');

  const c = card(el, 'interactive', 'The chain rule: one atomic event = one CPT entry per node, multiplied', '0 0 720 404');
  const { nodes } = net(c.svg, c.svg, POS);
  let ev = { ...PRESETS[0][1] }, shown = ORDER.length, timer = 0;
  const badge: Record<string, SVGTextElement> = {}, rowHl: Record<string, SVGRectElement[]> = {}, fac: Record<string, SVGTextElement> = {};
  let anim = false;
  for (const x of ORDER) {
    const g = nodes[x], flip = () => { ev[x] = !ev[x]; play(); };
    badge[x] = s(c.svg, 'text', { x: POS[x][0], y: POS[x][1] + (x === 'A' ? -26 : 36), class: 'uce-badge', 'text-anchor': 'middle' });
    Object.assign(g.style, { cursor: 'pointer' });
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `flip ${NAME[x]}`);
    g.addEventListener('click', flip);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    // its CPT, P(x = true | parents) per row, the row in use highlighted
    const [tx, ty] = TABLE[x], ps = PARENTS[x], head = [...ps, `P(${x.toLowerCase()}${ps.length ? ' | ' + ps.join(', ') : ''})`];
    const at = (i: number) => tx + i * 24;
    rowHl[x] = CPT[x].map((_, r) => s(c.svg, 'rect', { x: tx - 5, y: ty + 9 + r * 18, width: ps.length * 24 + 150, height: 17, rx: 4, class: 'uce-hl' }));
    head.forEach((h, i) => s(c.svg, 'text', { x: at(i), y: ty, class: 'fg-m' }, h));
    CPT[x].forEach((p, r) => {
      ps.forEach((_, j) => s(c.svg, 'text', { x: at(j), y: ty + 22 + r * 18, class: 'fg-t' }, ((r >> (ps.length - 1 - j)) & 1) ? 'f' : 't'));
      s(c.svg, 'text', { x: at(ps.length), y: ty + 22 + r * 18, class: 'uce-p' }, String(p));
    });
    fac[x] = s(c.svg, 'text', { x: at(ps.length) + 48, class: 'uce-f' });
  }
  const general = s(c.svg, 'text', { x: 20, y: 326, class: 'uce-gen' });
  const network = s(c.svg, 'text', { x: 20, y: 350, class: 'uce-net' });
  s(c.svg, 'rect', { x: 20, y: 364, width: LOGW, height: 14, rx: 4, class: 'uce-track' });
  const run = s(c.svg, 'rect', { x: 20, y: 364, width: LOGW, height: 14, rx: 4, class: 'uce-run' });
  for (let d = 0; d <= DECADES; d += 2) s(c.svg, 'text', { x: 20 + (1 - d / DECADES) * LOGW, y: 394, class: 'fg-m', 'text-anchor': 'middle' }, d ? `1e−${d}` : '1');
  const runT = s(c.svg, 'text', { x: 30 + LOGW, y: 376, class: 'uce-val' });

  const ctl = bar(c);
  const again = document.createElement('button');
  again.className = 'btn sm';
  again.textContent = '⏵ rebuild the product';
  again.onclick = () => play(true);
  ctl.append(again);
  for (const [label, e] of PRESETS) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = label;
    b.onclick = () => { ev = { ...e }; play(); };
    ctl.append(b);
  }

  /** Reveal the factors one by one (parents first), then report the event. */
  function play(quiet = false) {
    clearTimeout(timer);
    shown = 0;
    anim = true;
    const tick = () => {
      render();
      if (shown < ORDER.length) { shown++; timer = window.setTimeout(tick, 550); return; }
      anim = false;
      render();
      if (!quiet) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
    };
    tick();
  }

  function render() {
    const done = ORDER.slice(0, shown), cur = anim ? ORDER[shown - 1] : '', p = done.reduce((acc, x) => acc * P(x, ev[x], ev), 1);
    for (const x of ORDER) {
      const row = PARENTS[x].reduce((r, q) => 2 * r + (ev[q] ? 0 : 1), 0), on = done.includes(x), v = P(x, ev[x], ev);
      nodes[x].setAttribute('class', `fg-nd${x === cur ? ' cur' : ''}`);
      badge[x].textContent = lit(x, ev[x]);
      badge[x].setAttribute('class', `uce-badge ${ev[x] ? 'yes' : 'no'}`);
      rowHl[x].forEach((r, i) => r.setAttribute('class', `uce-hl${on && i === row ? (x === cur ? ' cur' : ' on') : ''}`));
      fac[x].setAttribute('y', String(TABLE[x][1] + 22 + row * 18));
      fac[x].textContent = on ? `→ ${ev[x] ? '' : '1−p = '}${num(v)}` : '';
    }
    // general chain rule (same order) vs the network: the struck-out variables are the non-parents the network drops
    general.replaceChildren();
    s(general, 'tspan', { class: 'lab' }, 'chain rule:  ');
    ORDER.forEach((x, i) => {
      const before = ORDER.slice(0, i);
      s(general, 'tspan', { class: x === cur ? 'on' : '' }, `${i ? ' · ' : ''}P(${lit(x, ev[x])}${before.length ? ' | ' : ''}`);
      before.forEach((q, k) => s(general, 'tspan', { class: PARENTS[x].includes(q) ? (x === cur ? 'on' : '') : 'gone' }, `${k ? ', ' : ''}${lit(q, ev[q])}`));
      s(general, 'tspan', { class: x === cur ? 'on' : '' }, ')');
    });
    network.replaceChildren();
    s(network, 'tspan', { class: 'lab' }, 'network:     ');
    done.forEach((x, i) => s(network, 'tspan', { class: x === cur ? 'on' : '' }, `${i ? ' × ' : ''}${num(P(x, ev[x], ev))}`));
    if (shown === ORDER.length) s(network, 'tspan', { class: 'res' }, ` = ${num(p, 3)}`);
    run.style.transform = `scaleX(${Math.max(0.004, 1 - Math.min(DECADES, -Math.log10(p)) / DECADES)})`;
    runT.textContent = shown ? `running product ${num(p, 3)}` : 'running product 1';
    const all = ORDER.map(x => lit(x, ev[x])).join(', '), rank = rankOf(ev);
    c.cap.innerHTML = md(`$P(${all.replace(/¬/g, '\\neg ')}) = ${ORDER.map(x => factor(x, ev).replace(/¬/g, '\\neg ')).join('\\,')}$ ` +
      `$= ${ORDER.map(x => num(P(x, ev[x], ev))).join(' \\cdot ')} = ${num(joint(ev), 3)}$. One factor per node, read from the row of its parents' values ` +
      `(for a false value, $1 - p$ of the same row). The network drops the struck-out variables of the general chain rule: each node depends only on its parents. ` +
      `This event is number ${rank} of the 32 by probability, and the 32 products add up to 1. **Click a node** to flip its value.`);
  }
  const rankOf = (e: Record<string, boolean>) => {
    const pe = joint(e);
    let r = 1;
    for (let m = 0; m < 32; m++) if (joint(Object.fromEntries(ORDER.map((x, i) => [x, ((m >> i) & 1) === 1]))) > pe) r++;
    return r;
  };
  render();
  return { destroy() { clearTimeout(timer); } };
}

const CSS = `
.uce-badge{font:700 13px var(--mono)}
.uce-badge.yes{fill:var(--ok)}
.uce-badge.no{fill:var(--bad)}
.uce-hl{fill:transparent;transition:fill .25s}
.uce-hl.on{fill:var(--accent-soft)}
.uce-hl.cur{fill:var(--accent-soft);stroke:var(--accent)}
.uce-p{font:600 13px var(--mono);fill:var(--text)}
.uce-f{font:600 12px var(--mono);fill:var(--accent)}
.uce-gen,.uce-net{font:12px var(--mono);fill:var(--text-2);white-space:pre}
.uce-gen .lab,.uce-net .lab{fill:var(--muted)}
.uce-gen .gone{fill:var(--muted);text-decoration:line-through;opacity:.7}
.uce-gen .on,.uce-net .on{fill:var(--accent);font-weight:700}
.uce-net .res{fill:var(--text);font-weight:700}
.uce-track{fill:var(--panel-3)}
.uce-run{fill:var(--accent);transform-box:fill-box;transform-origin:left;transition:transform .4s}
.uce-val{font:600 13px var(--mono);fill:var(--text)}
`;
