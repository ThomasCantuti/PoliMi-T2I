// TWO + TWO = FOUR as a CSP (slides p. 268, AIMA Fig. 6.2): interactive constraint checker on the constraint hypergraph.
// Click a variable to change its value; every constraint of the slide is evaluated live. Solutions are enumerated from the constraints.
import { bar, card, md, s, style, type FigOptions } from './shell';

const VARS = ['F', 'T', 'U', 'W', 'R', 'O', 'C1', 'C2', 'C3'], LETTERS = VARS.slice(0, 6);
type A = Record<string, number>;
const CONS: { name: string; vars: string[]; at: [number, number]; ok: (a: A) => boolean; show: (a: A) => string }[] = [
  { name: 'Alldiff(F, T, U, W, R, O)', vars: LETTERS, at: [415, 22], ok: a => new Set(LETTERS.map(v => a[v])).size === 6,
    show: a => { const d = LETTERS.filter(v => LETTERS.some(w => w !== v && a[w] === a[v])); return d.length ? `${d.join(', ')} share a digit` : 'all different'; } },
  { name: 'O + O = R + 10·C1', vars: ['O', 'R', 'C1'], at: [520, 140], ok: a => a.O + a.O === a.R + 10 * a.C1, show: a => `${a.O} + ${a.O} = ${a.O * 2},  ${a.R} + 10·${a.C1} = ${a.R + 10 * a.C1}` },
  { name: 'C1 + W + W = U + 10·C2', vars: ['C1', 'W', 'U', 'C2'], at: [450, 140], ok: a => a.C1 + 2 * a.W === a.U + 10 * a.C2, show: a => `${a.C1} + ${a.W} + ${a.W} = ${a.C1 + 2 * a.W},  ${a.U} + 10·${a.C2} = ${a.U + 10 * a.C2}` },
  { name: 'C2 + T + T = O + 10·C3', vars: ['C2', 'T', 'O', 'C3'], at: [380, 140], ok: a => a.C2 + 2 * a.T === a.O + 10 * a.C3, show: a => `${a.C2} + ${a.T} + ${a.T} = ${a.C2 + 2 * a.T},  ${a.O} + 10·${a.C3} = ${a.O + 10 * a.C3}` },
  { name: 'C3 = F', vars: ['C3', 'F'], at: [310, 140], ok: a => a.C3 === a.F, show: a => `${a.C3} ${a.C3 === a.F ? '=' : '≠'} ${a.F}` },
];
const POS: Record<string, [number, number]> = { F: [290, 80], T: [345, 80], U: [400, 80], W: [455, 80], R: [510, 80], O: [565, 80], C3: [345, 200], C2: [415, 200], C1: [485, 200] };

/** Every solution: for each T, W, O and carry vector, the column constraints fix R, U, F; keep the assignments satisfying all five. */
function solutions(): A[] {
  const out: A[] = [];
  for (let T = 0; T < 10; T++) for (let W = 0; W < 10; W++) for (let O = 0; O < 10; O++) for (let k = 0; k < 8; k++) {
    const C1 = k & 1, C2 = (k >> 1) & 1, C3 = k >> 2, a: A = { T, W, O, C1, C2, C3, R: O + O - 10 * C1, U: C1 + 2 * W - 10 * C2, F: C3 };
    if (a.R >= 0 && a.R < 10 && a.U >= 0 && a.U < 10 && CONS.every(c => c.ok(a))) out.push(a);
  }
  return out.sort((x, y) => +!(x.F && x.T) - +!(y.F && y.T)); // the ones without leading zeros first
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-cs-cr-css', CSS);
  const c = card(el, 'interactive', 'TWO + TWO = FOUR: a live constraint checker', '0 0 780 352');
  const SOL = solutions(), a: A = { T: 7, W: 3, O: 4, F: 1, U: 6, R: 8, C1: 0, C2: 0, C3: 0 };
  // brute-force check of the enumeration over the six letters (carries follow from the columns)
  const brute = Array.from({ length: 1000 }, (_, i) => 2 * i).filter(s2 => {
    const [T, W, O] = [Math.floor(s2 / 200), Math.floor(s2 / 20) % 10, (s2 / 2) % 10], d = [Math.floor(s2 / 1000), Math.floor(s2 / 100) % 10, Math.floor(s2 / 10) % 10, s2 % 10];
    return d[1] === O && new Set([d[0], T, d[2], W, d[3], O]).size === 6;
  }).length;
  if (brute !== SOL.length) console.error(`csp-crypt: ${SOL.length} solutions from the constraints, ${brute} by brute force`);
  let pick = -1;

  // the sum, written in columns
  const sum = s(c.svg, 'g', { class: 'csc-sum' });
  const digit: Record<string, SVGTextElement[]> = {};
  const put = (v: string, x: number, y: number) => {
    s(sum, 'text', { x, y: y - 24, class: 'csc-let' }, v);
    (digit[v] ??= []).push(s(sum, 'text', { x, y, class: 'csc-dig' }));
  };
  ['T', 'W', 'O'].forEach((v, i) => { put(v, 92 + i * 40, 62); put(v, 92 + i * 40, 122); });
  ['F', 'O', 'U', 'R'].forEach((v, i) => put(v, 52 + i * 40, 196));
  s(sum, 'text', { x: 40, y: 122, class: 'csc-dig' }, '+');
  s(sum, 'line', { x1: 30, x2: 190, y1: 136, y2: 136, class: 'csc-rule' });
  const carry = ['C3', 'C2', 'C1'].map((_, i) => s(sum, 'text', { x: 52 + i * 40, y: 18, class: 'csc-car' }));

  // the hypergraph: circles = variables, squares = constraints (p. 268)
  const links = CONS.map(k => k.vars.map(v => s(c.svg, 'line', { x1: k.at[0], y1: k.at[1], x2: POS[v][0], y2: POS[v][1], class: 'csc-link' })));
  const boxes = CONS.map((k, i) => i
    ? s(c.svg, 'rect', { x: k.at[0] - 13, y: k.at[1] - 13, width: 26, height: 26, rx: 3, class: 'csc-con' })
    : s(c.svg, 'rect', { x: 268, y: 10, width: 320, height: 24, rx: 4, class: 'csc-con' }));
  s(c.svg, 'text', { x: 428, y: 27, class: 'csc-cn' }, 'Alldiff');
  const nodes: Record<string, SVGTextElement> = {};
  for (const v of VARS) {
    const [x, y] = POS[v], g = s(c.svg, 'g', { class: 'csc-v', tabindex: 0, role: 'button', 'aria-label': `${v}: click to change` });
    s(g, 'circle', { cx: x, cy: y, r: 21 });
    s(g, 'text', { x, y: y - 26, class: 'csc-vn' }, v);
    nodes[v] = s(g, 'text', { x, y: y + 7, class: 'csc-vv' });
    const bump = (d: number) => { a[v] = (a[v] + d + 10) % 10; pick = -1; render(); say(`${v} = ${a[v]}`); };
    g.addEventListener('click', e => bump(e.shiftKey ? -1 : 1));
    g.addEventListener('contextmenu', e => { e.preventDefault(); bump(-1); });
    g.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'Enter') bump(1); else if (e.key === 'ArrowDown') bump(-1); else return; e.preventDefault(); });
  }
  s(c.svg, 'text', { x: 620, y: 70, class: 'fg-m' }, 'click: +1');
  s(c.svg, 'text', { x: 620, y: 88, class: 'fg-m' }, 'shift/right-click: −1');
  s(c.svg, 'text', { x: 620, y: 106, class: 'fg-m' }, 'domains {0, …, 9}');
  const rows = CONS.map((k, i) => [s(c.svg, 'text', { x: 24, y: 250 + i * 20, class: 'csc-mark' }), s(c.svg, 'text', { x: 44, y: 250 + i * 20, class: 'csc-row' }, k.name),
    s(c.svg, 'text', { x: 250, y: 250 + i * 20, class: 'csc-eq' })]);

  const ctl = bar(c);
  const btn = (label: string, on: () => void) => { const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = label; b.onclick = on; ctl.append(b); return b; };
  const next = btn('', () => { pick = (pick + 1) % SOL.length; Object.assign(a, SOL[pick]); render(); say(`solution ${pick + 1} of ${SOL.length}`); });
  btn('random assignment', () => { for (const v of VARS) a[v] = Math.floor(Math.random() * (v[0] === 'C' ? 2 : 10)); pick = -1; render(); say('random assignment'); });

  function render() {
    for (const v of VARS) nodes[v].textContent = String(a[v]);
    for (const v in digit) digit[v].forEach(t => { t.textContent = String(a[v]); });
    carry.forEach((t, i) => { t.textContent = a[['C3', 'C2', 'C1'][i]] ? String(a[['C3', 'C2', 'C1'][i]]) : ''; });
    CONS.forEach((k, i) => {
      const ok = k.ok(a);
      boxes[i].classList.toggle('bad', !ok);
      links[i].forEach(l => l.classList.toggle('bad', !ok));
      rows[i][0].textContent = ok ? '✓' : '✗';
      rows[i][0].classList.toggle('bad', !ok);
      rows[i][2].textContent = k.show(a);
    });
    next.textContent = pick < 0 ? `show a solution (${SOL.length} in all)` : `solution ${pick + 1} of ${SOL.length} ▸`;
    const bad = CONS.filter(k => !k.ok(a)).length, lead = SOL.filter(x => x.F && x.T).length;
    const two = 100 * a.T + 10 * a.W + a.O, four = 1000 * a.F + 100 * a.O + 10 * a.U + a.R;
    c.cap.innerHTML = md(bad
      ? `**${bad} of ${CONS.length} constraints violated** (red squares): this complete assignment is **not consistent**, so not a solution. ` +
        (two * 2 === four && CONS[0].ok(a) ? `The letters already spell a correct sum (${two} + ${two} = ${four}), but the carries do not match it: they are variables too, and each one must take the value its column produces. ` :
          `As numbers, ${two} + ${two} = ${two * 2} while FOUR reads ${four}. `) +
        'Each column constraint links only the letters of its column and the carries, so these constraints involve 3 or 4 variables: a **hypergraph**, not a graph.'
      : `**Complete and consistent: a solution.** ${two} + ${two} = ${two * 2}. The slide's constraints admit **${SOL.length}** solutions; ` +
        `${SOL.length - lead} of them have F = 0 (FOUR with a leading zero). Adding "no leading zeros" (F ≠ 0, T ≠ 0), as AIMA does, leaves ${lead}.`);
  }
  function say(what: string) { opts.onEvent?.(`[${c.title}] ${what}: ${c.cap.textContent}`); }
  render();
  return { destroy() {} };
}

const CSS = `
.csc-let{font:600 12px var(--mono);fill:var(--muted);text-anchor:middle}
.csc-dig{font:700 26px var(--mono);fill:var(--text);text-anchor:middle}
.csc-car{font:600 12px var(--mono);fill:var(--accent);text-anchor:middle}
.csc-rule{stroke:var(--text-2);stroke-width:2}
.csc-link{stroke:var(--v-edge);stroke-width:1.5;transition:stroke .2s}
.csc-link.bad{stroke:var(--bad);stroke-width:2}
.csc-con{fill:var(--ok-soft);stroke:var(--ok);stroke-width:2;transition:fill .2s,stroke .2s}
.csc-con.bad{fill:var(--bad-soft);stroke:var(--bad)}
.csc-cn{font:600 12px var(--font);fill:var(--text-2);text-anchor:middle;pointer-events:none}
.csc-v{cursor:pointer;outline:none}
.csc-v circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2}
.csc-v:hover circle,.csc-v:focus-visible circle{stroke:var(--accent);stroke-width:3}
.csc-vn{font:600 12px var(--font);fill:var(--muted);text-anchor:middle}
.csc-vv{font:700 19px var(--mono);fill:var(--text);text-anchor:middle;pointer-events:none}
.csc-mark{font-weight:700;font-size:14px;fill:var(--ok)}
.csc-mark.bad{fill:var(--bad)}
.csc-row{font:12.5px var(--mono);fill:var(--text)}
.csc-eq{font:12.5px var(--mono);fill:var(--text-2)}
`;
