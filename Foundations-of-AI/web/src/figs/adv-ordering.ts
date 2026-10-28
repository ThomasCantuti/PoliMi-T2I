// Move ordering decides how much alpha-beta prunes (slides p. 377–380): alpha-beta (Figure 6.7) runs on random uniform trees,
// the same tree in three orders, and the average number of leaves read is plotted against b^h, b^(3h/4), b^(h/2).
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const ORDERS = [
  { name: 'best first', why: 'MAX children in decreasing, MIN children in increasing order of value' },
  { name: 'random order', why: 'children shuffled' },
  { name: 'worst first', why: 'the reverse of best first' },
];
const round = (x: number) => (x >= 100 ? Math.round(x).toLocaleString('en-US') : num(x, 3));
const TREES = 60, SX = 16, SW = 344, BINS = 172, PX = 440, PY = 26, PW = 270, PH = 220;

/** vals[d][i] = minimax value of node i at depth d (root MAX, leaves i.i.d. uniform). */
function randomTree(b: number, h: number): Float64Array[] {
  const vals: Float64Array[] = [];
  vals[h] = Float64Array.from({ length: b ** h }, Math.random);
  for (let d = h - 1; d >= 0; d--) {
    const n = b ** d, v = new Float64Array(n), ch = vals[d + 1], max = d % 2 === 0;
    for (let i = 0; i < n; i++) {
      let x = ch[i * b];
      for (let k = 1; k < b; k++) x = max ? Math.max(x, ch[i * b + k]) : Math.min(x, ch[i * b + k]);
      v[i] = x;
    }
    vals[d] = v;
  }
  return vals;
}

/** ALPHA-BETA-SEARCH (AIMA Figure 6.7) with the children visited in the given order; marks the leaves it reads. */
function alphaBeta(vals: Float64Array[], b: number, h: number, order: number, read: Uint8Array): number {
  let leaves = 0;
  const rec = (d: number, i: number, alpha: number, beta: number): number => {
    if (d === h) { leaves++; read[i] = 1; return vals[h][i]; }
    const max = d % 2 === 0, ch = vals[d + 1], kids = Array.from({ length: b }, (_, k) => i * b + k);
    if (order === 1) for (let k = b - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [kids[k], kids[j]] = [kids[j], kids[k]]; }
    else kids.sort((x, y) => (max === (order === 0) ? ch[y] - ch[x] : ch[x] - ch[y]));
    let v = max ? -Infinity : Infinity;
    for (const k of kids) {
      const x = rec(d + 1, k, alpha, beta);
      if (max) { if (x > v) { v = x; alpha = Math.max(alpha, v); } if (v >= beta) return v; }
      else { if (x < v) { v = x; beta = Math.min(beta, v); } if (v <= alpha) return v; }
    }
    return v;
  };
  if (rec(0, 0, -Infinity, Infinity) !== vals[0][0]) console.error('adv-ordering: alpha-beta value differs from minimax');
  return leaves;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-ado-css', CSS);
  const c = card(el, 'simulation', 'Move ordering: the same trees, three orders, how many leaves alpha-beta reads', '0 0 780 300');
  let b = 3, H = 6, sum: number[][] = [], n: number[] = [], last: { read: Uint8Array; leaves: number }[] = [], running = false, raf = 0, fast = false, said = '';

  // left: the leaves of the last tree of depth H, in the tree's own left-to-right order, one strip per ordering
  s(c.svg, 'text', { x: SX, y: 16, class: 'fg-t' }, 'Leaves read on the last random tree (left to right)');
  const strips = ORDERS.map((o, k) => {
    const y = 40 + k * 76;
    const t = s(c.svg, 'text', { x: SX, y, class: `ado-name k${k}` });
    s(c.svg, 'rect', { x: SX, y: y + 8, width: SW, height: 30, rx: 3, class: 'ado-strip' });
    const bins = Array.from({ length: BINS }, (_, j) => s(c.svg, 'rect', { x: SX + (j * SW) / BINS, y: y + 8, width: SW / BINS, height: 30, class: `ado-bin k${k}` }));
    const sub = s(c.svg, 'text', { x: SX, y: y + 54, class: 'fg-m' }, o.why);
    return { t, bins, sub };
  });

  // right: average leaves read against the depth, log scale, with the three textbook curves
  s(c.svg, 'text', { x: PX - 40, y: PY - 10, class: 'fg-t' }, 'Average leaves read (log scale)');
  s(c.svg, 'rect', { x: PX, y: PY, width: PW, height: PH, class: 'ado-box' });
  const axis = s(c.svg, 'g', {}), refs = s(c.svg, 'g', {}), lines = ORDERS.map((_, k) => s(c.svg, 'polyline', { class: `ado-line k${k}` }));
  const dots = s(c.svg, 'g', {});
  s(c.svg, 'text', { x: PX + PW, y: PY + PH + 30, class: 'fg-m', 'text-anchor': 'end' }, 'depth h');

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); clear(); render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="0">1 tree per depth per frame</option><option value="1">10 trees per depth per frame</option>';
  sp.onchange = () => { fast = sp.value === '1'; };
  ctl.append(run, reset, sp);
  const knob = (name: string, min: number, max: number, v: number, set: (x: number) => void) => {
    const i = slider(ctl, name, min, max, 1, v, x => { pause(); set(x); clear(); render(); });
    i.addEventListener('change', () => opts.onEvent?.(`[${c.title}] ${name} = ${i.value}`));
  };
  knob('b', 2, 5, b, x => { b = x; });
  knob('h', 2, 8, H, x => { H = x; });

  const best = (h: number) => b ** Math.ceil(h / 2) + b ** Math.floor(h / 2) - 1;
  function clear() { sum = Array.from({ length: H + 1 }, () => [0, 0, 0]); n = Array<number>(H + 1).fill(0); last = []; said = ''; }
  function grow() {
    for (let h = 1; h <= H; h++) {
      const vals = randomTree(b, h);
      ORDERS.forEach((_, k) => {
        const read = new Uint8Array(b ** h), leaves = alphaBeta(vals, b, h, k, read);
        if (k === 0 && leaves !== best(h)) console.error(`adv-ordering: best-first read ${leaves} leaves, formula ${best(h)}`);
        sum[h][k] += leaves;
        if (h === H) last[k] = { read, leaves };
      });
      n[h]++;
    }
  }
  function play() {
    if (n[H] >= TREES) clear();
    running = true;
    opts.onEvent?.(`[${c.title}] run: b = ${b}, h = 1…${H}`);
    const frame = () => {
      for (let r = fast ? 10 : 1; r > 0 && n[H] < TREES; r--) grow();
      if (n[H] >= TREES) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const L = b ** H, emax = Math.ceil(Math.log10(L) + 1e-9) || 1;
    const px = (h: number) => PX + ((h - 1) / Math.max(1, H - 1)) * PW, py = (v: number) => PY + PH - (Math.log10(Math.max(1, v)) / emax) * PH;
    axis.replaceChildren();
    for (let e = 0; e <= emax; e++) {
      s(axis, 'line', { x1: PX, x2: PX + PW, y1: py(10 ** e), y2: py(10 ** e), class: 'ado-grid' });
      s(axis, 'text', { x: PX - 6, y: py(10 ** e) + 4, class: 'fg-m', 'text-anchor': 'end' }, e ? `10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[e]}` : '1');
    }
    for (let h = 1; h <= H; h++) s(axis, 'text', { x: px(h), y: PY + PH + 15, class: 'fg-m', 'text-anchor': 'middle' }, String(h));
    refs.replaceChildren();
    ([[1, 'b^h'], [0.75, 'b^(3h/4)'], [0.5, 'b^(h/2)']] as const).forEach(([k, name]) => {
      let pts = '';
      for (let h = 1; h <= H; h += 0.1) pts += `${px(h)},${py(b ** (k * h))} `;
      s(refs, 'polyline', { points: pts, class: 'ado-ref' });
      s(refs, 'text', { x: PX + PW + 4, y: py(b ** (k * H)) + 4, class: 'ado-reft' }, name);
    });
    dots.replaceChildren();
    ORDERS.forEach((_, k) => {
      let pts = '';
      for (let h = 1; h <= H; h++) if (n[h]) {
        const v = sum[h][k] / n[h];
        pts += `${px(h)},${py(v)} `;
        s(dots, 'circle', { cx: px(h), cy: py(v), r: 3.5, class: `ado-dot k${k}` });
      }
      lines[k].setAttribute('points', pts);
    });
    strips.forEach((st, k) => {
      const l = last[k];
      const per = L < BINS; // fewer leaves than bins: one block per leaf
      st.bins.forEach((r, j) => {
        const lo = per ? j : Math.floor((j * L) / BINS), hi = per ? Math.min(j + 1, L) : Math.floor(((j + 1) * L) / BINS);
        let read = 0;
        if (l) for (let i = lo; i < hi; i++) read += l.read[i];
        r.setAttribute('x', String(per ? SX + (j * SW) / L + 1 : SX + (j * SW) / BINS));
        r.setAttribute('width', String(per ? (j < L ? SW / L - 2 : 0) : SW / BINS));
        r.style.opacity = hi > lo ? String(read / (hi - lo)) : '0';
      });
      const avg = n[H] ? sum[H][k] / n[H] : 0;
      st.t.textContent = `${ORDERS[k].name}: ${l ? `${l.leaves} of ${L} leaves` : `– of ${L} leaves`}${n[H] ? ` · average ${round(avg)} (${num((avg / L) * 100, 2)}%)` : ''}`;
    });
    run.textContent = running ? '⏸ Pause' : n[H] >= TREES ? '⏵ Run again' : n[H] ? '⏵ Continue' : '⏵ Run alpha-beta';
    explain();
  }

  // the caption follows the stage of the run
  function explain() {
    const done = n[H] >= TREES, avg = (k: number, h: number) => sum[h][k] / n[h];
    const ebf = (k: number) => (H >= 3 ? (avg(k, H) / avg(k, H - 2)) ** 0.5 : avg(k, H) ** (1 / H)); // growth per level
    const [key, text] = !n[H]
      ? ['idle', `**Random trees** with $b = ${b}$ children per node and depth $h$ up to ${H}, leaves uniform in $[0, 1]$. Each tree is searched three times by the same alpha-beta, ` +
        'changing only the **order** in which the children are visited. Press **Run**: every frame adds one random tree for every depth.']
      : !done
      ? ['run', `**${n[H]} trees per depth so far.** Best first always reads exactly $b^{\\lceil h/2\\rceil} + b^{\\lfloor h/2\\rfloor} - 1 = ${best(H)}$ leaves at $h = ${H}$; ` +
        'the other two vary from tree to tree, so their dots move until the averages settle.']
      : [`done${b}${H}`, `**After ${TREES} trees per depth** (h = ${H}, ${b ** H} leaves): best first reads **${best(H)}** leaves every time, random order **${round(avg(1, H))}** on average, ` +
        `worst first **${round(avg(2, H))}**. Per extra level the count grows by about **${num(ebf(0), 3)}** ($\\sqrt b = ${num(b ** 0.5, 3)}$), **${num(ebf(1), 3)}** ($b^{3/4} = ${num(b ** 0.75, 3)}$) ` +
        `and **${num(ebf(2), 3)}** ($b = ${b}$): on the log scale the dots run **parallel** to $b^{h/2}$, $b^{3h/4}$ and $b^h$. Random order sits a constant factor above $b^{3h/4}$, ` +
        'the $O(\\cdot)$ hides it. Worst first still prunes a few leaves, through cut-offs that come from α and β passed down from higher up.'];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key.startsWith('done')) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  clear();
  render();
  return { destroy: pause };
}

const CSS = `
.ado-strip{fill:var(--panel-2);stroke:var(--border)}
.ado-bin{transition:opacity .2s}
.ado-bin.k0,.ado-dot.k0{fill:var(--ok)}
.ado-bin.k1,.ado-dot.k1{fill:var(--accent)}
.ado-bin.k2,.ado-dot.k2{fill:var(--v-min)}
.ado-name{font-size:12.5px;font-weight:600}
.ado-name.k0{fill:var(--ok)}
.ado-name.k1{fill:var(--accent)}
.ado-name.k2{fill:var(--v-min)}
.ado-box{fill:var(--panel-2);stroke:var(--border)}
.ado-grid{stroke:var(--border);stroke-dasharray:2 4}
.ado-ref{fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:5 4}
.ado-reft{font:11px var(--mono);fill:var(--muted)}
.ado-line{fill:none;stroke-width:2}
.ado-line.k0{stroke:var(--ok)}
.ado-line.k1{stroke:var(--accent)}
.ado-line.k2{stroke:var(--v-min)}
.ado-dot{stroke:var(--panel);stroke-width:1.5}
`;
