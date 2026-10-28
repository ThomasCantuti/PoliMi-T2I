// Size of a Q-table, |S|·|A| at 8 bytes per entry (RL p. 20, 38, 74–79; exams 25 Jan 2022, 20 Jun 2024, 11 Jun 2025), on a log scale.
// Grid, tic-tac-toe, Criss-Cross and the disc game are computed; chess and Go use published position counts (not in the slides).
import { bar, card, md, s, slider, style, type FigOptions } from './shell';

const X0 = 214, W = 400, DEC = 180, Y0 = 52, RH = 36, BYTES = 8;
const fact = (n: number) => { let f = 1n; for (let k = 2n; k <= BigInt(n); k++) f *= k; return f; };
const comb = (n: number, k: number) => fact(n) / (fact(k) * fact(n - k));
const log10 = (b: bigint) => { const t = b.toString(); return t.length - 1 + Math.log10(+`0.${t.slice(0, 15)}` * 10); };

/** Reachable tic-tac-toe boards (X moves first, play stops at a win): [all, not over]. */
function tttBoards(): [number, number] {
  const seen = new Set<string>();
  let open = 0;
  const won = (b: string) => [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]].some(([i, j, k]) => b[i] !== '.' && b[i] === b[j] && b[i] === b[k]);
  const go = (b: string, p: string) => {
    if (seen.has(b)) return;
    seen.add(b);
    if (won(b) || !b.includes('.')) return;
    open++;
    for (let i = 0; i < 9; i++) if (b[i] === '.') go(b.slice(0, i) + p + b.slice(i + 1), p === 'X' ? 'O' : 'X');
  };
  go('.........', 'X');
  return [seen.size, open];
}

interface Row { name: string; src: string; log: number; exact?: bigint; how: string }

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rlq-css', CSS);
  const c = card(el, 'interactive', 'How big is the Q-table? |S| · |A| entries, 8 bytes each', '0 0 780 308');
  const [all, open] = tttBoards();
  if (all !== 5478 || open !== 4520) console.error(`rl-qsize: ${all} reachable boards (expected 5478), ${open} not over (expected 4520)`);
  const cc = 17n * comb(16, 8) * 8n, disc = fact(4) * fact(12) * fact(20) * 36n;
  if (cc !== 1750320n) console.error(`rl-qsize: Criss-Cross ${cc}, the exam says 1 750 320`);
  let n = 10, sel = -1;
  const rows = (): Row[] => [
    { name: `${n}×${n} grid`, src: 'RL p. 40', exact: BigInt(4 * n * n), log: Math.log10(4 * n * n),
      how: `${n}·${n} = ${n * n} cells × 4 moves = **${fmt(BigInt(4 * n * n))}** entries (the exams' 4N for N cells)` },
    { name: 'tic-tac-toe', src: 'RL p. 57', exact: BigInt(open * 9), log: Math.log10(open * 9),
      how: `${fmt(BigInt(open))} reachable boards where the game is not over (enumerated: ${fmt(BigInt(all))} reachable boards in all) × 9 squares = **${fmt(BigInt(open * 9))}** entries; counting every filling of the board, $3^9 \\cdot 9$ = ${fmt(3n ** 9n * 9n)}` },
    { name: 'Criss-Cross', src: 'exam 25 Jan 2022', exact: cc, log: log10(cc),
      how: `17 cells for the empty one × $\\binom{16}{8} = ${fmt(comb(16, 8))}$ ways to place the 8 white tokens × 8 actions = **${fmt(cc)}** entries` },
    { name: '6×6 disc game', src: 'exam 20 Jun 2024', exact: disc, log: log10(disc),
      how: `$4! \\cdot 12! \\cdot 20!$ states (the exam's bound, from the minimax tree) × 36 actions = **${sci(log10(disc))}** entries` },
    { name: 'chess', src: 'published estimate', log: Math.log10(4.8e44 * 218),
      how: 'about $4.8 \\cdot 10^{44}$ legal positions (a published estimate, not in the slides) × at most 218 legal moves ≈ **' + sci(Math.log10(4.8e44 * 218)) + '** entries' },
    { name: 'Go 19×19', src: 'published count', log: 170 + Math.log10(2.08 * 362),
      how: 'about $2.08 \\cdot 10^{170}$ legal positions (Tromp and Farnebäck, 2016; not in the slides) × 362 moves (361 points and pass) ≈ **' + sci(170 + Math.log10(2.08 * 362)) + '** entries' },
  ];

  const x = (lg: number) => X0 + (lg / DEC) * W;
  for (let d = 0; d <= DEC; d += 30) {
    s(c.svg, 'line', { x1: x(d), x2: x(d), y1: Y0 - 8, y2: Y0 + 6 * RH, class: 'rlq-grid' });
    s(c.svg, 'text', { x: x(d), y: Y0 + 6 * RH + 16, class: 'fg-m', 'text-anchor': 'middle' }, `10${sup(d)}`);
  }
  s(c.svg, 'text', { x: X0 + W, y: Y0 + 6 * RH + 32, class: 'fg-m', 'text-anchor': 'end' }, 'bytes, log scale (8 per entry)');
  for (const [lg, lab, dy] of [[Math.log10(16 * 2 ** 30), '16 GB of RAM', 0], [80, '≈ 10⁸⁰ atoms in the universe', 0]] as const) {
    s(c.svg, 'line', { x1: x(lg), x2: x(lg), y1: Y0 - 14, y2: Y0 + 6 * RH, class: 'rlq-ref' });
    s(c.svg, 'text', { x: x(lg) + 4, y: Y0 - 18 + dy, class: 'rlq-reft' }, lab);
  }
  const els = [0, 1, 2, 3, 4, 5].map(k => {
    const y = Y0 + k * RH, g = s(c.svg, 'g', { class: 'rlq-row', tabindex: 0, role: 'button' });
    s(g, 'rect', { x: 8, y: y - 2, width: 764, height: RH - 4, class: 'rlq-hit' });
    const nm = s(g, 'text', { x: 14, y: y + 14, class: 'rlq-name' });
    const src = s(g, 'text', { x: 14, y: y + 28, class: 'fg-m' });
    const b = s(g, 'rect', { x: X0, y: y + 4, height: RH - 14, rx: 3, class: k > 3 ? 'rlq-bar est' : 'rlq-bar' });
    const v = s(g, 'text', { x: 772, y: y + 14, class: 'rlq-v', 'text-anchor': 'end' });
    const m = s(g, 'text', { x: 772, y: y + 28, class: 'fg-m', 'text-anchor': 'end' });
    g.onclick = () => pick(k);
    g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(k); } };
    return { g, nm, src, b, v, m };
  });

  const knobs = bar(c);
  const inp = slider(knobs, 'grid side n', 3, 1000, 1, n, v => { n = v; render(); if (sel === 0) explain(); });
  inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] grid ${n}×${n}: ${fmt(BigInt(4 * n * n))} entries`));
  for (const v of [3, 10, 100, 1000]) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `${v}×${v}`;
    b.onclick = () => { inp.value = String(v); inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change')); };
    knobs.append(b);
  }

  function pick(k: number) { sel = k; render(); explain(); opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`); }
  function render() {
    rows().forEach((r, k) => {
      const e = els[k], lb = r.log + Math.log10(BYTES);
      e.nm.textContent = r.name;
      e.src.textContent = r.src;
      e.b.setAttribute('width', String(Math.max(2, x(lb) - X0)));
      e.v.textContent = r.exact !== undefined && r.exact < 10n ** 9n ? `${fmt(r.exact)} entries` : `${sci(r.log)} entries`;
      e.m.textContent = mem(lb);
      e.g.classList.toggle('sel', k === sel);
    });
  }
  function explain() {
    const r = rows()[sel], lb = r.log + Math.log10(BYTES);
    c.cap.innerHTML = md(`**${r.name}:** ${r.how}; at 8 bytes per entry, **${mem(lb)}**` +
      (lb > Math.log10(16 * 2 ** 30) ? `, about ${sci(lb - Math.log10(16 * 2 ** 30))} times a 16 GB memory.` : ', which fits in memory easily.') +
      (sel >= 3 ? ' A table this size can never be stored or filled by trial and error: this is why approximators (e.g. a neural network from the board to the q-values, RL p. 75) replace the table.' : ''));
  }
  render();
  c.cap.innerHTML = md('**Q-table size = $|S| \\cdot |A|$**, one number per state–action pair. The bars are on a **log scale**: each grid line is a factor $10^{30}$. ' +
    'The examples of the course fit in memory up to Criss-Cross; the disc game of the exam already needs more bytes than any computer has. Click a row to see its computation; drag $n$ to grow the grid.');
  return { destroy() {} };
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (d: number) => String(d).split('').map(ch => SUP[+ch]).join('');
const fmt = (b: bigint) => b.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const sci = (lg: number) => { const e = Math.floor(lg), m = 10 ** (lg - e); return `${m.toFixed(2)}·10${sup(e)}`; };
function mem(lb: number) {
  const units: [string, number][] = [['B', 0], ['kB', 3], ['MB', 6], ['GB', 9], ['TB', 12], ['PB', 15]];
  if (lb >= 18) return `${sci(lb)} bytes`;
  const [u, e] = units.filter(([, e]) => lb >= e).pop()!;
  return `${+(10 ** (lb - e)).toPrecision(3)} ${u}`;
}

const CSS = `
.rlq-grid{stroke:var(--border);stroke-dasharray:2 4}
.rlq-ref{stroke:var(--warn);stroke-width:1.5;stroke-dasharray:5 4}
.rlq-reft{font:600 11px var(--mono);fill:var(--warn)}
.rlq-row{cursor:pointer;outline:none}
.rlq-hit{fill:transparent;rx:6px}
.rlq-row:hover .rlq-hit,.rlq-row:focus-visible .rlq-hit{fill:var(--panel-2)}
.rlq-row.sel .rlq-hit{fill:var(--accent-soft)}
.rlq-name{font-size:13px;font-weight:600;fill:var(--text)}
.rlq-bar{fill:var(--accent);opacity:.85}
.rlq-bar.est{fill:var(--v-explored)}
.rlq-v{font:600 12px var(--mono);fill:var(--text)}
`;
