// The open-lines evaluation function of tic-tac-toe (slides p. 385–386): stepper. Every e(s) is counted on the board.
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const CELL = 46, SIZE = 3 * CELL, SLOT_X = [40, 251, 462], Y0 = 34;
const CELLS = { center: 4, corner: 0, edge: 1 } as const;

const open = (b: string, p: 'X' | 'O') => LINES.filter(l => l.every(i => b[i] !== (p === 'X' ? 'O' : 'X')));
const e = (b: string) => open(b, 'X').length - open(b, 'O').length;
const eText = (b: string) => `e = ${open(b, 'X').length} − ${open(b, 'O').length} = ${String(e(b)).replace('-', '−')}`;
const eMath = (b: string) => `$${open(b, 'X').length} - ${open(b, 'O').length} = ${e(b)}$`;
const put = (b: string, i: number, p: string) => b.slice(0, i) + p + b.slice(i + 1);
const EMPTY = '.........', SLIDES = [EMPTY, '....XO...', 'XOX.O....'];
// h = 2: X plays, O answers with the reply that minimizes e (first one on ties)
const DEPTH2 = Object.entries(CELLS).map(([name, i]) => {
  const b = put(EMPTY, i, 'X');
  const reply = [...b].map((ch, k) => (ch === '.' ? put(b, k, 'O') : null)).filter((x): x is string => !!x)
    .reduce((best, x) => (e(x) < e(best) ? x : best));
  return { name, board: reply, value: e(reply) };
});
const BEST = DEPTH2.reduce((a, b) => (b.value > a.value ? b : a));

interface Slot { board: string; label: string; lines?: 'X' | 'O'; nums?: boolean; best?: boolean }
interface F extends Frame { slots: (Slot | null)[] }

const FRAMES: F[] = [
  { group: 'e(s)', slots: SLIDES.map(b => ({ board: b, label: eText(b) })),
    cap: '**$e(s)$ = lines still open for X − lines still open for O**: a row, column or diagonal is open for a player if the opponent ' +
      `has no piece on it. The three positions of the slides: ${SLIDES.map(eMath).join(', ')}.` },
  { group: 'e(s)', slots: [null, { board: SLIDES[1], label: `${open(SLIDES[1], 'X').length} lines open for X`, lines: 'X' }, null],
    cap: `**Open for X:** every line without an O. Only the two lines through O's square are closed, so **${open(SLIDES[1], 'X').length}** are open.` },
  { group: 'e(s)', slots: [null, { board: SLIDES[1], label: `${open(SLIDES[1], 'O').length} lines open for O`, lines: 'O' }, null],
    cap: `**Open for O:** every line without an X. The center closes four lines, so **${open(SLIDES[1], 'O').length}** are open. ` +
      `$e = ${open(SLIDES[1], 'X').length} - ${open(SLIDES[1], 'O').length} = ${e(SLIDES[1])}$: good for X.` },
  { group: 'first move', slots: [null, { board: EMPTY, label: "e after X's first move", nums: true }, null],
    cap: `**X's first move, evaluated at depth 1:** ${Object.entries(CELLS).map(([n, i]) => `${n} ${eMath(put(EMPTY, i, 'X'))}`).join(', ')}. ` +
      'The number in each square is $e$ after X plays there.' },
  { group: 'depth 2', slots: DEPTH2.map(d => ({ board: d.board, label: `X ${d.name}: ${eText(d.board)}`, best: d === BEST })),
    cap: `**Depth $h = 2$:** X moves, O answers with the reply that is worst for X, then evaluate. The backed-up values are ` +
      `${DEPTH2.map(d => `${d.name} $${d.value}$`).join(', ')}: **X plays the ${BEST.name}**.` },
];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-ttt-css', CSS);
  const c = card(el, 'stepper', 'Tic-tac-toe: the open-lines evaluation function', '0 0 640 230');
  const slots = SLOT_X.map(x => {
    const g = s(c.svg, 'g', { transform: `translate(${x}, ${Y0})` });
    for (let i = 1; i < 3; i++) {
      s(g, 'line', { x1: i * CELL, y1: 0, x2: i * CELL, y2: SIZE, class: 'ttt-grid' });
      s(g, 'line', { x1: 0, y1: i * CELL, x2: SIZE, y2: i * CELL, class: 'ttt-grid' });
    }
    const lines = s(g, 'g');
    const marks = Array.from({ length: 9 }, (_, i) =>
      s(g, 'text', { x: (i % 3 + 0.5) * CELL, y: (Math.floor(i / 3) + 0.5) * CELL, class: 'ttt-m' }));
    const label = s(g, 'text', { x: SIZE / 2, y: SIZE + 26, class: 'fg-t', 'text-anchor': 'middle' });
    return { g, lines, marks, label };
  });
  const mid = (i: number) => [(i % 3 + 0.5) * CELL, (Math.floor(i / 3) + 0.5) * CELL];
  return stepper(c, FRAMES, f => {
    f.slots.forEach((sl, k) => {
      const v = slots[k];
      v.g.classList.toggle('hide', !sl);
      v.lines.replaceChildren();
      if (!sl) return;
      [...sl.board].forEach((ch, i) => {
        const n = sl.nums && ch === '.' ? e(put(sl.board, i, 'X')) : null;
        v.marks[i].textContent = n !== null ? String(n) : ch === '.' ? '' : ch;
        v.marks[i].setAttribute('class', `ttt-m ${n !== null ? 'num' : ch === 'X' ? 'x' : 'o'}`);
      });
      if (sl.lines) for (const l of open(sl.board, sl.lines)) {
        const [a, b] = [mid(l[0]), mid(l[2])], dx = (b[0] - a[0]) * 0.18, dy = (b[1] - a[1]) * 0.18;
        s(v.lines, 'line', { x1: a[0] - dx, y1: a[1] - dy, x2: b[0] + dx, y2: b[1] + dy, class: `ttt-l ${sl.lines === 'X' ? 'x' : 'o'}` });
      }
      v.label.textContent = sl.label;
      v.label.setAttribute('class', `fg-t${sl.best ? ' ttt-best' : ''}`);
    });
  }, opts);
}

const CSS = `
.ttt-grid{stroke:var(--border-strong);stroke-width:2}
.ttt-m{font:700 24px var(--font);text-anchor:middle;dominant-baseline:central}
.ttt-m.x{fill:var(--v-max)}
.ttt-m.o{fill:var(--v-min)}
.ttt-m.num{fill:var(--ok);font:700 18px var(--mono)}
.ttt-l{stroke-width:5;stroke-linecap:round;opacity:.45}
.ttt-l.x{stroke:var(--v-max)}
.ttt-l.o{stroke:var(--v-min)}
.fg .ttt-best{fill:var(--ok);font-weight:700}
`;
