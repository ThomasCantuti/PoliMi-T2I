// Bandits vs RL (exams 8 Sep 2025, 31 Aug 2026; RL p. 14): one choice, "stop" pays 1 now, "go" pays 5 three moves later.
// A bandit learner averages the reward that follows each choice at once; Q-learning also adds the discounted value of what comes next.
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const EPS = 0.1, BETA = 0.5, BIG = 5, HORIZON = 300, WIN = 50;
const NX = [150, 250, 340, 430, 520], ENDX = 44, PANEL = [34, 164];

interface Agent { name: string; est: number[]; n: number[]; picks: number[]; rewards: number[] } // est: [stop, go, c1, c2, c3]

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rld-css', CSS);
  const c = card(el, 'simulation', 'Bandit learner vs Q-learning when the reward comes later', '0 0 780 300');
  let gamma = 0.9, speed = 'watch', running = false, raf = 0, last = 0, said = '';
  const mk = (name: string): Agent => ({ name, est: [0, 0, 0, 0, 0], n: [0, 0], picks: [], rewards: [] });
  let A = [mk('bandit learner'), mk('Q-learning')];
  let pos = 0, choice = -1; // watch mode: where both agents are in the current episode (0 = S, 1..3 corridor, 4 = end)

  // two panels with the same tiny world
  const ui = A.map((ag, k) => {
    const y = PANEL[k] + 50, g = s(c.svg, 'g', {});
    s(g, 'text', { x: 14, y: PANEL[k], class: 'fg-h2' }, k ? 'Q-learning (RL)' : 'bandit learner');
    s(g, 'text', { x: 14, y: PANEL[k] + 18, class: 'fg-m' }, k ? `Q ← Q + β(r + γ·max Q′ − Q), β = ${BETA}` : 'average of the reward right after each choice');
    s(g, 'line', { x1: ENDX + 16, x2: NX[0] - 16, y1: y, y2: y, class: 'rld-e' });
    for (let i = 0; i < 4; i++) s(g, 'line', { x1: NX[i] + 16, x2: NX[i + 1] - 16, y1: y, y2: y, class: 'rld-e' });
    s(g, 'rect', { x: ENDX - 18, y: y - 16, width: 36, height: 32, rx: 6, class: 'rld-end' });
    s(g, 'text', { x: ENDX, y: y + 5, class: 'rld-r' }, '+1');
    NX.forEach((x, i) => {
      s(g, 'circle', { cx: x, cy: y, r: 15, class: i === 4 ? 'rld-goal' : 'rld-n' });
      s(g, 'text', { x, y: y + 4, class: 'rld-nt' }, i === 4 ? `+${BIG}` : i ? `c${i}` : 'S');
    });
    s(g, 'text', { x: (ENDX + NX[0]) / 2, y: y + 22, class: 'fg-m', 'text-anchor': 'middle' }, 'stop');
    s(g, 'text', { x: (NX[0] + NX[1]) / 2, y: y + 22, class: 'fg-m', 'text-anchor': 'middle' }, 'go');
    const lab = [(ENDX + NX[0]) / 2, (NX[0] + NX[1]) / 2, (NX[1] + NX[2]) / 2, (NX[2] + NX[3]) / 2, (NX[3] + NX[4]) / 2]
      .map(x => s(g, 'text', { x, y: y - 10, class: 'rld-v' }));
    const dot = s(g, 'circle', { r: 20, cy: y, class: 'rld-dot' });
    const stat = [0, 1, 2].map(j => s(g, 'text', { x: 580, y: PANEL[k] + 30 + j * 20, class: j ? 'fg-t' : 'rld-big' }));
    return { lab, dot, stat, ag };
  });

  const ctl = bar(c), knobs = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); A = [mk('bandit learner'), mk('Q-learning')]; ui.forEach((u, k) => { u.ag = A[k]; }); pos = 0; choice = -1; render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="watch">watch each move</option><option value="fast">10 episodes per frame</option>';
  sp.onchange = () => { speed = sp.value; render(); };
  ctl.append(run, reset, sp);
  const inp = slider(knobs, 'γ', 0.3, 0.99, 0.01, gamma, v => { gamma = v; render(); });
  inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] γ = ${gamma}: Q-learning's value of go tends to ${num(BIG * gamma ** 3, 3)}`));
  s(c.svg, 'text', { x: 14, y: 290, class: 'fg-m' }, `Both explore with ε = ${EPS}; ${HORIZON} episodes.`);

  const pick = (est: number[]) => (Math.random() < EPS || est[0] === est[1] ? +(Math.random() < 0.5) : +(est[1] > est[0]));
  /** One episode for one agent; returns its choice (0 stop, 1 go). */
  function episode(ag: Agent, k: number) {
    const a = pick(ag.est), e = ag.est;
    ag.picks.push(a);
    ag.rewards.push(a ? BIG : 1);
    if (!k) { ag.n[a]++; e[a] += ((a ? 0 : 1) - e[a]) / ag.n[a]; return; } // bandit: the immediate reward of go is 0
    if (!a) { e[0] += BETA * (1 - e[0]); return; }
    e[1] += BETA * (gamma * e[2] - e[1]); // S → c1 → c2 → c3 → +5, one update per move, in order
    e[2] += BETA * (gamma * e[3] - e[2]);
    e[3] += BETA * (gamma * e[4] - e[3]);
    e[4] += BETA * (BIG - e[4]);
  }
  function play() {
    if (A[0].picks.length >= HORIZON) return;
    running = true;
    const frame = (now: number) => {
      if (speed === 'fast') { for (let k = 0; k < 10 && A[0].picks.length < HORIZON; k++) A.forEach(episode); pos = 0; }
      else if (now - last > 260) { // watch: both agents choose and learn at S, then the dots walk the chosen way
        last = now;
        if (pos === 0 && choice < 0) { A.forEach(episode); choice = 0; pos = 1; }
        else if (pos < 4) pos++;
        else { pos = 0; choice = -1; }
      }
      if (A[0].picks.length >= HORIZON && pos === 0) running = false;
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  const share = (ag: Agent) => { const w = ag.picks.slice(-WIN); return w.length ? w.reduce((x, y) => x + y, 0) / w.length : 0; };
  const mean = (ag: Agent) => { const w = ag.rewards.slice(-WIN); return w.length ? w.reduce((x, y) => x + y, 0) / w.length : 0; };
  function render() {
    ui.forEach(({ lab, dot, stat, ag }, k) => {
      const e = ag.est;
      lab[0].textContent = num(e[0], 3);
      lab[1].textContent = num(e[1], 3);
      for (let i = 2; i < 5; i++) lab[i].textContent = k ? num(e[i], 3) : '';
      const a = ag.picks[ag.picks.length - 1];
      const x = choice < 0 || speed === 'fast' ? NX[0] : a ? NX[pos] : ENDX;
      dot.setAttribute('cx', String(x));
      dot.classList.toggle('hide', !ag.picks.length || (running && speed === 'fast'));
      const n = ag.picks.length, w = Math.min(n, WIN);
      stat[0].textContent = n ? `go in ${num(share(ag) * 100, 3)}% of the last ${w}` : 'no episodes yet';
      stat[1].textContent = n ? `reward per episode: ${num(mean(ag), 3)}` : '';
      stat[2].textContent = `prefers ${e[1] > e[0] ? 'go' : e[1] < e[0] ? 'stop' : '—'} (episode ${n})`;
    });
    run.textContent = running ? '⏸ Pause' : A[0].picks.length >= HORIZON ? 'done' : A[0].picks.length ? '⏵ Continue' : '⏵ Run';
    run.disabled = A[0].picks.length >= HORIZON && !running;
    explain();
  }
  function explain() {
    const n = A[0].picks.length, v = BIG * gamma ** 3;
    const stage = !n ? 'idle' : n < 100 ? 'early' : `${n >= HORIZON ? 'done' : 'late'}${gamma}${A[1].est[1] > A[1].est[0]}`;
    if (stage === said) return;
    said = stage;
    const text = !n
      ? `**One decision, then consequences.** In S, *stop* pays 1 at once and ends the episode; *go* pays 0 now and ${BIG} three moves later. ` +
        `With $\\gamma = ${gamma}$ the discounted value of *go* is $\\gamma^3 \\cdot ${BIG} = ${num(v, 3)}$, ${v > 1 ? 'more' : 'less'} than 1. Press **Run**.`
      : n < 100
      ? '**Learning.** The bandit learner only sees the reward that follows each choice at once: 1 for *stop*, 0 for *go*. Q-learning adds $\\gamma \\max Q$ of the next state, so the 5 travels back along the corridor, one step per *go* episode.'
      : `**After ${n} episodes** the bandit learner chooses *go* in ${num(share(A[0]) * 100, 3)}% of the last ${WIN} (only when exploring) and earns ${num(mean(A[0]), 3)} per episode; ` +
        `Q-learning chooses *go* in ${num(share(A[1]) * 100, 3)}% and earns ${num(mean(A[1]), 3)}. ` +
        (v > 1 ? 'A bandit method (UCB, a sample average) is right when the reward comes at once and the choice does not change what comes next; here the reward is **delayed**, so only RL finds the better choice. '
          : `With $\\gamma = ${gamma}$ even Q-learning prefers *stop*: $\\gamma^3 \\cdot ${BIG} = ${num(v, 3)} < 1$, a short-sighted agent. `) +
        'Drag $\\gamma$ below about 0.585 (where $\\gamma^3 \\cdot 5 = 1$) and Reset to see the switch.';
    c.cap.innerHTML = md(text);
    if (n) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }
  render();
  return { destroy: pause };
}

const CSS = `
.rld-e{stroke:var(--v-edge);stroke-width:2.5}
.rld-n{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2}
.rld-goal{fill:var(--ok-soft);stroke:var(--ok);stroke-width:2}
.rld-end{fill:var(--warn-soft);stroke:var(--warn);stroke-width:1.5}
.rld-r{font:700 13px var(--mono);fill:var(--warn);text-anchor:middle}
.rld-nt{font-size:11px;font-weight:700;fill:var(--text);text-anchor:middle;pointer-events:none}
.rld-v{font:600 12px var(--mono);fill:var(--accent);text-anchor:middle}
.rld-dot{fill:none;stroke:var(--accent);stroke-width:3;transition:cx .22s;pointer-events:none}
.rld-big{font-size:14px;font-weight:650;fill:var(--text)}
`;
