// Two reward functions on the same episodes (RL p. 32; exams 30 Aug 2022 and 18 Jan 2023): you move the agent, both Q-tables update.
// 3×3 grid, wall (2,2), G (3,3), γ = 0.5, β = 0.25, Q = 0; moves into the wall or the edge are not allowed, as in the exams.
import { DIRS, GOAL, S0, WALL, allowed, name, to } from './rl-mdp';
import { bar, card, md, num, s, style, type FigOptions } from './shell';

const GAMMA = 0.5, BETA = 0.25, C = 58, X0 = 16, Y0 = 44, EXAM = [1, 1, 2, 2]; // E, E, S, S
const ROWS = [0, 1, 2, 3, 5, 6, 7]; // the free cells before the goal, in the exams' table order
const SCHEMES = [
  { name: 'goal-reward', text: '1 into G, 0 otherwise', r: (into: boolean) => (into ? 1 : 0) },
  { name: 'action-penalty', text: '−1 per step, 0 into G', r: (into: boolean) => (into ? 0 : -1) },
];
const TX = [214, 500], TY = 64, LW = 54, CW = 54, RH = 23;
const p = (x: number) => (x < 0 ? `(${num(x)})` : num(x));

interface Upd { old: number; r: number; next: number[]; nu: number }
/** One Q-learning update, in place; into the goal there is no discounted term. */
function update(Q: number[], i: number, d: number, sc: number): Upd {
  const j = to(i, d), into = j === GOAL, old = Q[i * 4 + d], r = SCHEMES[sc].r(into);
  const next = into ? [] : allowed(j).map(e => Q[j * 4 + e]);
  Q[i * 4 + d] = old + BETA * (r + (into ? 0 : GAMMA * Math.max(...next)) - old);
  return { old, r, next, nu: Q[i * 4 + d] };
}
const fresh = () => Array<number>(36).fill(0);

// cross-check with the official solutions: the exam episode gives 0.25 on the last step (30 Aug 2022) and −0.25 on the others (18 Jan 2023)
{
  const T = [fresh(), fresh()];
  let i = S0;
  for (const d of EXAM) { T.forEach((Q, sc) => update(Q, i, d, sc)); i = to(i, d); }
  const want = [{ 22: 0.25 }, { 1: -0.25, 5: -0.25, 10: -0.25 }] as Record<number, number>[];
  T.forEach((Q, sc) => Q.forEach((v, k) => { if (v !== (want[sc][k] ?? 0)) console.error(`rl-rewards: ${SCHEMES[sc].name} Q[${k}] = ${v}, exam says ${want[sc][k] ?? 0}`); }));
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rlr-css', CSS);
  const c = card(el, 'interactive', 'Goal-reward vs action-penalty: which Q entries move first', '0 0 780 290');
  const T = [fresh(), fresh()];
  let pos = S0, ep = 1, step = 0, timer = 0, changed: number[][] = [[], []];

  const cx = (i: number) => X0 + (i % 3) * C + C / 2, cy = (i: number) => Y0 + Math.floor(i / 3) * C + C / 2;
  for (let i = 0; i < 9; i++) {
    s(c.svg, 'rect', { x: X0 + (i % 3) * C, y: Y0 + Math.floor(i / 3) * C, width: C, height: C, class: i === WALL ? 'fg-wall' : i === GOAL ? 'fg-goal' : 'fg-cell' });
    if (i !== WALL) s(c.svg, 'text', { x: X0 + (i % 3) * C + 4, y: Y0 + Math.floor(i / 3) * C + 13, class: 'rlr-id' }, name(i));
  }
  s(c.svg, 'text', { x: cx(S0), y: cy(S0) + 10, class: 'rlr-big' }, 'S');
  s(c.svg, 'text', { x: cx(GOAL), y: cy(GOAL) + 10, class: 'rlr-big g' }, 'G');
  const trail = s(c.svg, 'polyline', { class: 'rlr-trail' });
  const agent = s(c.svg, 'circle', { r: 10, class: 'rlr-agent' });
  const epT = s(c.svg, 'text', { x: X0, y: 24, class: 'fg-h2' });
  s(c.svg, 'text', { x: X0, y: Y0 + 3 * C + 22, class: 'fg-m' }, `γ = ${GAMMA}, β = ${BETA}, Q starts at 0`);
  s(c.svg, 'text', { x: X0, y: Y0 + 3 * C + 40, class: 'fg-m' }, 'Arrow keys or the buttons move.');
  let path = [S0];

  // the two Q-tables, laid out like the exams' answer tables (blank = move not allowed)
  const cell: SVGTextElement[][] = [[], []], flash: SVGRectElement[][] = [[], []], cnt: SVGTextElement[] = [];
  SCHEMES.forEach((sc, k) => {
    const x = TX[k];
    s(c.svg, 'text', { x, y: 20, class: 'fg-h2' }, sc.name);
    s(c.svg, 'text', { x, y: 38, class: 'fg-m' }, sc.text);
    cnt.push(s(c.svg, 'text', { x: x + LW + 4 * CW, y: 20, class: 'rlr-cnt', 'text-anchor': 'end' }));
    DIRS.forEach(([n], d) => s(c.svg, 'text', { x: x + LW + d * CW + CW / 2, y: TY, class: 'fg-m', 'text-anchor': 'middle' }, n));
    ROWS.forEach((i, r) => {
      const y = TY + 8 + r * RH;
      s(c.svg, 'text', { x, y: y + 16, class: 'rlr-row' }, name(i));
      for (let d = 0; d < 4; d++) {
        const ok = to(i, d) >= 0;
        s(c.svg, 'rect', { x: x + LW + d * CW, y, width: CW, height: RH, class: ok ? 'rlr-td' : 'rlr-td off' });
        flash[k][i * 4 + d] = s(c.svg, 'rect', { x: x + LW + d * CW + 1, y: y + 1, width: CW - 2, height: RH - 2, class: 'rlr-fl' });
        cell[k][i * 4 + d] = s(c.svg, 'text', { x: x + LW + d * CW + CW / 2, y: y + 16, class: 'rlr-v' }, ok ? '0' : '');
      }
    });
  });

  const ctl = bar(c);
  const exam = document.createElement('button');
  exam.className = 'btn sm primary';
  exam.textContent = '▶ Exam episode: E, E, S, S';
  exam.onclick = () => playExam();
  const moveB = DIRS.map(([n, g], d) => {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `${g} ${n}`;
    b.onclick = () => move(d);
    return b;
  });
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset Q';
  reset.onclick = () => { clearTimeout(timer); timer = 0; T.forEach(Q => Q.fill(0)); pos = S0; ep = 1; step = 0; path = [S0]; changed = [[], []]; render(); intro(); };
  ctl.append(exam, ...moveB, reset);
  c.root.tabIndex = 0;
  c.root.addEventListener('keydown', e => {
    const d = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(e.key);
    if (e.target !== c.root || d < 0) return;
    e.preventDefault();
    move(d);
  });

  function playExam() {
    let k = 0;
    const go = () => { move(EXAM[k++], true); timer = k < EXAM.length ? window.setTimeout(go, 900) : 0; render(); };
    go();
  }
  function move(d: number, auto = false) {
    if ((timer && !auto) || to(pos, d) < 0) return;
    const i = pos, j = to(i, d), into = j === GOAL;
    if (step === 0) changed = [[], []];
    const u = T.map((Q, sc) => update(Q, i, d, sc));
    u.forEach((x, sc) => { if (x.nu !== x.old) changed[sc].push(i * 4 + d); });
    step++;
    path.push(j);
    const cap = `**Episode ${ep}, step ${step}: ${name(i)} ${DIRS[d][1]} ${into ? 'G' : name(j)}.** ` +
      (into ? 'Into the goal: **no discounted term**, the episode ends. ' : `The max is over the moves allowed in ${name(j)}, with the table as it is now. `) +
      u.map((x, sc) => `<br>${SCHEMES[sc].name}: $Q(${name(i)},${DIRS[d][0]}) \\leftarrow ${p(x.old)} + ${BETA}\\cdot(${p(x.r)}` +
        (into ? '' : ` + ${GAMMA}\\cdot\\max(${x.next.map(v => num(v)).join(', ')})`) + ` - ${p(x.old)}) = \\mathbf{${num(x.nu)}}$` + (x.nu === x.old ? ' (unchanged)' : '')).join('') +
      (into ? endOfEpisode() : '');
    c.cap.innerHTML = md(cap);
    opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
    if (into) { ep++; step = 0; pos = S0; path = [S0]; } else pos = j;
    flashNow(u.map(x => (x.nu !== x.old ? i * 4 + d : -1)));
    render();
  }
  function endOfEpisode() {
    const [g, a] = changed.map(x => x.length), first = ep === 1 && path.join() === '0,1,2,5,8';
    return `<br>**Episode ${ep} done:** goal-reward changed **${g}** ${g === 1 ? 'entry' : 'entries'}, action-penalty **${a}**. ` +
      (first ? 'These are the official answers: only the last step is non-zero with goal-reward (0.25, exam 30 Aug 2022), every step but the last with action-penalty (−0.25, exam 18 Jan 2023). ' : '') +
      (ep === 1 ? 'With goal-reward nothing is learned until the goal is found; with action-penalty every step is punished at once, so a tried move ($Q < 0$) looks worse than an untried one ($Q = 0$): $Q = 0$ is an **optimistic** start that pushes a greedy agent to try new moves.' : '');
  }
  function flashNow(ix: number[]) {
    ix.forEach((k, sc) => {
      for (const f of flash[sc]) f?.classList.remove('go');
      if (k >= 0) { void flash[sc][k].getBBox(); flash[sc][k].classList.add('go'); }
    });
  }
  function render() {
    T.forEach((Q, sc) => {
      let nz = 0;
      for (const i of ROWS) for (let d = 0; d < 4; d++) if (to(i, d) >= 0) {
        const v = Q[i * 4 + d], t = cell[sc][i * 4 + d];
        nz += +(v !== 0);
        t.textContent = num(v, 4);
        t.setAttribute('class', `rlr-v ${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}`);
      }
      cnt[sc].textContent = `${nz} ${nz === 1 ? 'entry' : 'entries'} ≠ 0`;
    });
    agent.setAttribute('transform', `translate(${cx(pos)},${cy(pos)})`);
    trail.setAttribute('points', path.map(i => `${cx(i)},${cy(i)}`).join(' '));
    epT.textContent = `Episode ${ep}${step ? `, step ${step}` : ''}`;
    moveB.forEach((b, d) => { b.disabled = !!timer || to(pos, d) < 0; });
    exam.disabled = !!timer || step > 0;
  }
  function intro() {
    c.cap.innerHTML = md('**Same grid, same moves, two reward functions.** Both tables start at 0 and use the same update. ' +
      'Press **Exam episode** (east, east, south, south, as in the exams) or move the agent yourself, and watch which entries change: with goal-reward only the step **into** G, with action-penalty every step **before** it.');
  }

  render();
  intro();
  return { destroy() { clearTimeout(timer); } };
}

const CSS = `
.rlr-id{font-size:10px;fill:var(--muted)}
.rlr-big{font-size:17px;font-weight:700;fill:var(--muted);text-anchor:middle}
.rlr-big.g{fill:var(--ok)}
.rlr-trail{fill:none;stroke:var(--warn);stroke-width:3;stroke-linejoin:round;opacity:.6}
.rlr-agent{fill:var(--accent);stroke:var(--panel);stroke-width:3;transition:transform .35s cubic-bezier(.2,.7,.2,1)}
.rlr-cnt{font:600 12px var(--mono);fill:var(--text-2)}
.rlr-row{font:600 12px var(--mono);fill:var(--text-2)}
.rlr-td{fill:var(--panel-2);stroke:var(--border)}
.rlr-td.off{fill:var(--panel-3)}
.rlr-fl{fill:var(--warn);opacity:0;pointer-events:none}
.rlr-fl.go{animation:rlr-fl 1.2s ease-out}
@keyframes rlr-fl{0%{opacity:.5}100%{opacity:0}}
.rlr-v{font:600 12px var(--mono);fill:var(--muted);text-anchor:middle}
.rlr-v.pos{fill:var(--ok)}
.rlr-v.neg{fill:var(--bad)}
`;
