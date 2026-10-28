// Supervised, unsupervised and reinforcement learning (RL p. 6–8): the same random-walk episode on the exams' 3×3 grid,
// and the feedback each kind of learner would receive at every step. The teacher's labels are the shortest-path moves (BFS).
import { DIRS, GOAL, S0, WALL, allowed, to } from './rl-mdp';
import { bar, card, md, s, style, type FigOptions } from './shell';

const C = 50, X0 = 16, Y0 = 46, TX = 312, CW = 35, COLS = 13, ROWY = [92, 140, 188];
const ROWS: [string, string][] = [['supervised', 'the right move'], ['unsupervised', 'nothing'], ['reinforcement', 'a reward r(t+1)']];

// moves to G from every cell, by breadth-first search backwards from G
const DIST = Array<number>(9).fill(-1);
{
  DIST[GOAL] = 0;
  const q = [GOAL];
  while (q.length) { const j = q.shift()!; for (let i = 0; i < 9; i++) if (DIST[i] < 0 && i !== WALL && allowed(i).some(d => to(i, d) === j)) { DIST[i] = DIST[j] + 1; q.push(i); } }
  if (DIST[S0] !== 4) console.error(`rl-ml: S is ${DIST[S0]} moves from G, expected 4`);
}
const right = (i: number) => allowed(i).filter(d => DIST[to(i, d)] === DIST[i] - 1);

interface Step { from: number; d: number; ok: boolean }

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rll-css', CSS);
  const c = card(el, 'simulation', 'Three kinds of learning, one episode: what feedback arrives, and when', '0 0 780 250');
  let pos = S0, steps: Step[] = [], running = false, timer = 0, said = '';

  for (let i = 0; i < 9; i++)
    s(c.svg, 'rect', { x: X0 + (i % 3) * C, y: Y0 + Math.floor(i / 3) * C, width: C, height: C, class: i === WALL ? 'fg-wall' : i === GOAL ? 'fg-goal' : 'fg-cell' });
  s(c.svg, 'text', { x: X0 + 2.5 * C, y: Y0 + 2.5 * C + 6, class: 'rll-g' }, 'G');
  s(c.svg, 'text', { x: X0 + 0.5 * C, y: Y0 + 0.5 * C + 6, class: 'rll-g s' }, 'S');
  s(c.svg, 'text', { x: X0, y: 30, class: 'fg-m' }, 'random moves from S');
  const trail = s(c.svg, 'polyline', { class: 'rll-trail' }), agent = s(c.svg, 'circle', { r: 8, class: 'rll-agent' });

  s(c.svg, 'text', { x: 186, y: 30, class: 'fg-m' }, 'what the learner receives after each move');
  const head = Array.from({ length: COLS }, (_, k) => s(c.svg, 'text', { x: TX + k * CW + CW / 2, y: 58, class: 'fg-m', 'text-anchor': 'middle' }));
  const moveT = Array.from({ length: COLS }, (_, k) => s(c.svg, 'text', { x: TX + k * CW + CW / 2, y: 74, class: 'rll-mv' }));
  const cells = ROWS.map(([lab, sub], r) => {
    s(c.svg, 'text', { x: 186, y: ROWY[r] + 12, class: 'rll-row' }, lab);
    s(c.svg, 'text', { x: 186, y: ROWY[r] + 28, class: 'fg-m' }, sub);
    return Array.from({ length: COLS }, (_, k) => {
      s(c.svg, 'rect', { x: TX + k * CW + 2, y: ROWY[r], width: CW - 4, height: 34, rx: 5, class: 'rll-box' });
      return s(c.svg, 'text', { x: TX + k * CW + CW / 2, y: ROWY[r] + 22, class: 'rll-fb' });
    });
  });
  const more = s(c.svg, 'text', { x: TX, y: 240, class: 'fg-m' });

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ New episode';
  reset.onclick = () => { pause(); pos = S0; steps = []; render(); };
  ctl.append(run, reset);

  function step() {
    const acts = allowed(pos), d = acts[Math.floor(Math.random() * acts.length)];
    steps.push({ from: pos, d, ok: right(pos).includes(d) });
    pos = to(pos, d);
    if (pos === GOAL) pause();
  }
  function play() {
    if (pos === GOAL) { pos = S0; steps = []; }
    running = true;
    const tick = () => { step(); render(); if (running) timer = window.setTimeout(tick, 450); };
    tick();
  }
  function pause() { running = false; clearTimeout(timer); render(); }

  const cx = (i: number) => X0 + (i % 3) * C + C / 2, cy = (i: number) => Y0 + Math.floor(i / 3) * C + C / 2;
  function render() {
    const first = Math.max(0, steps.length - COLS);
    for (let k = 0; k < COLS; k++) {
      const st = steps[first + k], t = first + k + 1, end = st && to(st.from, st.d) === GOAL;
      head[k].textContent = st ? `t=${t}` : '';
      moveT[k].textContent = st ? DIRS[st.d][1] : '';
      cells[0][k].textContent = st ? (st.ok ? '✓' : right(st.from).map(d => DIRS[d][1]).join('')) : '';
      cells[0][k].setAttribute('class', `rll-fb ${st && !st.ok ? 'no' : 'ok'}`);
      cells[1][k].textContent = st ? '·' : '';
      cells[2][k].textContent = st ? (end ? '1' : '0') : '';
      cells[2][k].setAttribute('class', `rll-fb ${end ? 'ok' : 'zero'}`);
    }
    more.textContent = first ? `moves 1–${first} scrolled out on the left` : '';
    trail.setAttribute('points', [S0, ...steps.map(st => to(st.from, st.d))].map(i => `${cx(i)},${cy(i)}`).join(' '));
    agent.setAttribute('transform', `translate(${cx(pos)},${cy(pos)})`);
    run.textContent = running ? '⏸ Pause' : pos === GOAL ? '⏵ Another episode' : steps.length ? '⏵ Continue' : '⏵ Walk';
    explain();
  }
  function explain() {
    const n = steps.length, wrong = steps.filter(st => !st.ok).length;
    const key = pos === GOAL ? `end${n}` : n ? 'walk' : 'idle';
    if (key === said) return;
    said = key;
    const text = key === 'idle'
      ? '**The same experience, three kinds of feedback.** The agent walks at random from S. A **supervised** learner would be told the right move after every step; an **unsupervised** one gets the states only; a **reinforcement** learner gets a number, the reward. Press **Walk**.'
      : key === 'walk'
      ? 'Under each move: ✓ when it was a shortest-path move, otherwise the arrows a teacher would give. The reinforcement row stays at **0**: nothing says whether a move was good until the goal.'
      : `**Episode over in ${n} moves** (shortest: 4). The supervised learner got ${n} labels, ${wrong} of them correcting a wrong move: **direct** feedback. The unsupervised learner got none. ` +
        `The reinforcement learner got ${n - 1} zeros and one 1, at the very end: a **delayed** reward, and it has to work out which of the ${n} moves deserve the credit. That is the job of the value function and Q-learning in the rest of this chapter.`;
    c.cap.innerHTML = md(text);
    if (key !== 'idle' && key !== 'walk') opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }
  render();
  return { destroy: pause };
}

const CSS = `
.rll-g{font-size:16px;font-weight:700;fill:var(--ok);text-anchor:middle}
.rll-g.s{fill:var(--muted)}
.rll-trail{fill:none;stroke:var(--warn);stroke-width:3;stroke-linejoin:round;opacity:.5}
.rll-agent{fill:var(--accent);stroke:var(--panel);stroke-width:2.5;transition:transform .3s}
.rll-row{font-size:13px;font-weight:650;fill:var(--text)}
.rll-mv{font-size:14px;font-weight:700;fill:var(--text-2);text-anchor:middle}
.rll-box{fill:var(--panel-2);stroke:var(--border)}
.rll-fb{font:700 13px var(--mono);text-anchor:middle}
.rll-fb.ok{fill:var(--ok)}
.rll-fb.no{fill:var(--bad)}
.rll-fb.zero{fill:var(--muted)}
.rll-fb:not(.ok):not(.no):not(.zero){fill:var(--muted)}
`;
