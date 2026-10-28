// The learning agent (RL p. 2–4) running on the exams' 3×3 grid: each step lights up the component that is working.
// Performance element = greedy policy over Q; problem generator = the ε exploration; critic = reward vs the standard "reach G";
// learning element = the Q-learning update (RL p. 36). Exam setting: γ = 0.5, β = 0.25, reward 1 into G, Q = 0.
import { DIRS, GOAL, S0, WALL, allowed, name, to } from './rl-mdp';
import { arrow, bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const GAMMA = 0.5, BETA = 0.25, C = 52, GX = 560, GY = 66, CAP = 200;
const PHASES = ['sense', 'decide', 'act', 'critic', 'learn'] as const;
type Phase = typeof PHASES[number];
const BOX: Record<string, [number, number, number, number, string]> = { // x, y, w, h, label
  critic: [34, 64, 160, 46, 'critic'], learn: [34, 160, 160, 46, 'learning element'],
  gen: [34, 256, 160, 46, 'problem generator'], perf: [270, 160, 170, 46, 'performance element'],
};

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-rla-css', CSS);
  const c = card(el, 'simulation', 'A learning agent at work: who does what at each step', '0 0 780 350');
  const Q = Array<number>(36).fill(0), lens: number[] = [];
  let eps = 0.2, speed = 'phases', running = false, raf = 0, last = 0, said = '';
  let pos = S0, t = 0, phase: Phase | '' = '', a = -1, explored = false, nxt = -1, r = 0, old = 0;
  const ah = arrow(c.svg);

  // the agent: four components and the arrows of RL p. 3
  s(c.svg, 'rect', { x: 14, y: 40, width: 470, height: 280, rx: 10, class: 'rla-agent' });
  s(c.svg, 'text', { x: 26, y: 58, class: 'fg-m' }, 'agent');
  const box: Record<string, SVGGElement> = {}, sub: Record<string, SVGTextElement> = {};
  for (const k in BOX) {
    const [x, y, w, h, lab] = BOX[k];
    box[k] = s(c.svg, 'g', { class: 'rla-box' });
    s(box[k], 'rect', { x, y, width: w, height: h, rx: 8 });
    s(box[k], 'text', { x: x + w / 2, y: y + 19, class: 'rla-name' }, lab);
    sub[k] = s(box[k], 'text', { x: x + w / 2, y: y + 36, class: 'rla-sub' });
  }
  const E = (id: string, d: string, lab: string, lx: number, ly: number, anchor = 'start') => {
    const g = s(c.svg, 'g', { class: 'rla-e' });
    s(g, 'path', { d, 'marker-end': ah });
    s(g, 'text', { x: lx, y: ly, 'text-anchor': anchor }, lab);
    return [id, g] as const;
  };
  const edges = Object.fromEntries([
    E('std', 'M114,8 L114,60', 'performance standard: reach G', 122, 24),
    E('senseC', 'M540,87 L198,87', 'sensors', 300, 80),
    E('senseP', 'M355,87 L355,156', '', 0, 0),
    E('feedback', 'M114,110 L114,156', 'feedback r', 120, 138),
    E('changes', 'M194,176 L266,176', 'changes', 230, 170, 'middle'),
    E('goals', 'M114,206 L114,252', 'learning goals', 120, 234),
    E('explore', 'M194,272 C250,272 330,250 340,210', 'exploratory action', 262, 290),
    E('effect', 'M440,190 L540,190', 'effectors', 490, 184, 'middle'),
  ]);
  const status = s(c.svg, 'text', { x: 14, y: 340, class: 'rla-status' });

  // the environment: the grid, the greedy arrows learned so far and the agent
  s(c.svg, 'rect', { x: 544, y: 40, width: 222, height: 280, rx: 10, class: 'rla-env' });
  s(c.svg, 'text', { x: 556, y: 58, class: 'fg-m' }, 'environment');
  const pol: SVGTextElement[] = [], heat: SVGRectElement[] = [];
  for (let i = 0; i < 9; i++) {
    const x = GX + (i % 3) * C, y = GY + Math.floor(i / 3) * C;
    s(c.svg, 'rect', { x, y, width: C, height: C, class: i === WALL ? 'fg-wall' : i === GOAL ? 'fg-goal' : 'fg-cell' });
    heat.push(s(c.svg, 'rect', { x: x + 1, y: y + 1, width: C - 2, height: C - 2, class: 'rla-heat' }));
    pol.push(s(c.svg, 'text', { x: x + C / 2, y: y + C / 2 + 7, class: 'rla-pol' }));
  }
  pol[GOAL].textContent = 'G';
  pol[GOAL].classList.add('g');
  const agentDot = s(c.svg, 'circle', { r: 9, class: 'rla-dot' });
  const epT = s(c.svg, 'text', { x: GX, y: GY + 3 * C + 18, class: 'fg-t' });
  // steps of the last 30 episodes (the shortest path takes 4)
  const SX = GX, SY = GY + 3 * C + 30, SW = 3 * C + 30, SH = 40;
  s(c.svg, 'line', { x1: SX, x2: SX + SW, y1: SY + SH, y2: SY + SH, class: 'rla-axis' });
  const opt = s(c.svg, 'line', { x1: SX, x2: SX + SW, class: 'rla-opt' });
  const bars = Array.from({ length: 30 }, (_, k) => s(c.svg, 'rect', { x: SX + k * (SW / 30) + 1, width: SW / 30 - 2, class: 'rla-bar' }));
  const lenT = s(c.svg, 'text', { x: SX, y: SY + SH + 14, class: 'fg-m' });

  const ctl = bar(c), knobs = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const one = document.createElement('button');
  one.className = 'btn sm';
  one.textContent = 'Next phase ▸';
  one.onclick = () => { pause(); advance(); render(); opts.onEvent?.(`[${c.title}] ${status.textContent}`); };
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset Q';
  reset.onclick = () => { pause(); Q.fill(0); lens.length = 0; pos = S0; t = 0; phase = ''; render(); };
  const sp = document.createElement('select');
  sp.innerHTML = '<option value="phases">one phase every 0.8 s</option><option value="steps">one step every 0.15 s</option><option value="episodes">one episode per frame</option>';
  sp.onchange = () => { speed = sp.value; render(); };
  ctl.append(run, one, reset, sp);
  const inp = slider(knobs, 'ε (problem generator)', 0, 1, 0.05, eps, v => { eps = v; });
  inp.addEventListener('change', () => opts.onEvent?.(`[${c.title}] ε = ${eps}`));

  const best = (i: number) => {
    const acts = allowed(i), m = Math.max(...acts.map(d => Q[i * 4 + d])), ties = acts.filter(d => Q[i * 4 + d] === m);
    return ties[Math.floor(Math.random() * ties.length)];
  };
  const fmt = (d: number) => `${DIRS[d][1]} ${DIRS[d][0]}`;
  /** One phase of the cycle; the five phases together are one Q-learning step. */
  function advance() {
    const k = phase ? (PHASES.indexOf(phase) + 1) % PHASES.length : 0;
    phase = PHASES[k];
    if (phase === 'decide') {
      explored = Math.random() < eps;
      const acts = allowed(pos);
      a = explored ? acts[Math.floor(Math.random() * acts.length)] : best(pos);
    } else if (phase === 'act') {
      nxt = to(pos, a);
    } else if (phase === 'critic') {
      r = nxt === GOAL ? 1 : 0;
    } else if (phase === 'learn') {
      old = Q[pos * 4 + a];
      const future = nxt === GOAL ? 0 : Math.max(...allowed(nxt).map(d => Q[nxt * 4 + d]));
      Q[pos * 4 + a] = old + BETA * (r + GAMMA * future - old);
    } else if (phase === 'sense' && nxt >= 0) { // the previous step is over: move on, or start a new episode at S
      t++;
      if (nxt === GOAL || t >= CAP) { lens.push(t); t = 0; pos = S0; } else pos = nxt;
      nxt = -1;
    }
  }
  const fullStep = () => { do advance(); while (phase !== 'learn'); };
  function play() {
    running = true;
    const frame = (now: number) => {
      if (speed === 'phases') { if (now - last > 800) { last = now; advance(); } }
      else if (speed === 'steps') { if (now - last > 150) { last = now; fullStep(); } }
      else for (let n = lens.length; lens.length === n;) fullStep();
      render();
      if (running) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { running = false; cancelAnimationFrame(raf); render(); }

  function says() {
    const there = nxt === GOAL ? 'G' : name(nxt);
    switch (phase) {
      case '': return 'Press Run, or Next phase to go one component at a time.';
      case 'sense': return `Sensors: the agent perceives s = ${name(pos)}.`;
      case 'decide': return explored ? `Problem generator: with probability ε it proposes an exploratory move, ${fmt(a)}.` : `Performance element: the greedy move in ${name(pos)} is ${fmt(a)}.`;
      case 'act': return `Effectors: the agent does ${fmt(a)} and the environment moves it to ${there}.`;
      case 'critic': return `Critic: compares the new state with the performance standard (reach G): r = ${r}.`;
      case 'learn': return `Learning element: Q ← ${num(old, 3)} + ${BETA}·(${r} + ${GAMMA}·max Q(${there}) − ${num(old, 3)}) = ${num(Q[pos * 4 + a], 3)}, a change to the performance element.`;
    }
  }
  const cx = (i: number) => GX + (i % 3) * C + C / 2, cy = (i: number) => GY + Math.floor(i / 3) * C + C / 2;
  function render() {
    const on = speed === 'phases' || !running ? phase : '';
    const lit: Record<Phase, string[]> = {
      sense: ['senseC', 'senseP', 'perf'], decide: explored ? ['gen', 'explore', 'perf', 'goals'] : ['perf'],
      act: ['effect', 'perf'], critic: ['senseC', 'std', 'critic'], learn: ['feedback', 'learn', 'changes'],
    };
    const now = on ? lit[on] : [];
    for (const k in box) box[k].classList.toggle('on', now.includes(k));
    for (const k in edges) edges[k].classList.toggle('on', now.includes(k));
    const here = phase === 'act' || phase === 'critic' || phase === 'learn' ? nxt : pos;
    sub.perf.textContent = !phase ? 'greedy: argmax Q(s, a)' : phase === 'sense' ? `s = ${name(pos)}` : `does ${fmt(a)}${explored ? ' (suggested)' : ' (greedy)'}`;
    sub.gen.textContent = phase === 'decide' || phase === 'act' ? (explored ? `explore: try ${fmt(a)}` : `no (prob. ε = ${eps})`) : `random move with prob. ε`;
    sub.critic.textContent = phase === 'critic' || phase === 'learn' ? `r = ${r}${r ? ': reached G' : ': not G yet'}` : 'reward from the new state';
    sub.learn.textContent = phase === 'learn' ? `Q(${name(pos)},${DIRS[a][0]}): ${num(old, 3)} → ${num(Q[pos * 4 + a], 3)}` : 'Q-learning update';
    status.textContent = says();
    for (let i = 0; i < 9; i++) {
      if (i === WALL || i === GOAL) continue;
      const acts = allowed(i), m = Math.max(...acts.map(d => Q[i * 4 + d]));
      heat[i].style.opacity = String(m * 0.9);
      pol[i].textContent = m > 0 ? DIRS[acts.find(d => Q[i * 4 + d] === m) ?? 0][1] : '';
    }
    agentDot.setAttribute('transform', `translate(${cx(here === GOAL ? GOAL : here)},${cy(here === GOAL ? GOAL : here)})`);
    epT.textContent = `episode ${lens.length + 1}, step ${t + (phase && phase !== 'sense' ? 1 : 0)}`;
    const recent = lens.slice(-30), top = Math.max(8, ...recent), y = (v: number) => SY + SH - (Math.min(v, top) / top) * SH;
    bars.forEach((b, k) => {
      const v = recent[k] ?? 0;
      b.setAttribute('y', String(y(v)));
      b.setAttribute('height', String(SY + SH - y(v)));
    });
    for (const k of ['y1', 'y2']) opt.setAttribute(k, String(y(4)));
    lenT.textContent = lens.length ? `steps, last ${recent.length} episode${recent.length > 1 ? 's' : ''} · dashed: 4` : 'steps per episode appear here';
    run.textContent = running ? '⏸ Pause' : phase ? '⏵ Continue' : '⏵ Run';
    explain();
  }

  function explain() {
    const n = lens.length, recent = lens.slice(-10), avg = recent.reduce((x, y) => x + y, 0) / Math.max(1, recent.length);
    const [key, text] = !phase
      ? ['idle', '**Four components, one concrete agent.** The **performance element** picks the move with the largest $Q$: it is the agent we had before. ' +
        'The **critic** judges each new state against a fixed **performance standard** (reach G) and turns it into a reward. ' +
        'The **learning element** uses that feedback to change the performance element (the Q-learning update). The **problem generator** sometimes proposes a random move, to explore. Press **Next phase** to follow one step.']
      : n === 0
      ? ['first', '**Episode 1.** Every $Q$ is 0, so the performance element has no preference and the critic gives $r = 0$ until the agent stumbles into G: nothing changes in the table before then.']
      : n >= 10 && avg <= 5
      ? [`learned${eps}`, `**Learned.** The last 10 episodes took ${num(avg, 3)} steps on average (shortest: 4). The arrows in the grid are the performance element after the learning element's changes. ` +
        (eps > 0 ? `With $\\varepsilon = ${eps}$ the problem generator still sends the agent on detours now and then: exploration has a cost once the task is learned.` : 'With $\\varepsilon = 0$ nobody proposes new moves: the agent only repeats what it already believes.')]
      : ['learning', '**The critic\'s feedback reaches back.** Each update copies part of the next cell\'s value into the current one, so the arrows appear backwards from G, episode after episode. Try **one episode per frame**.'];
    if (key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (key !== 'idle') opts.onEvent?.(`[${c.title}] ${text}`);
  }

  render();
  return { destroy: pause };
}

const CSS = `
.rla-agent{fill:none;stroke:var(--border-strong);stroke-width:1.5}
.rla-env{fill:var(--bad-soft);stroke:var(--bad);stroke-width:1.5;opacity:.9}
.rla-box rect{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:fill .25s,stroke .25s}
.rla-box.on rect{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2.5}
.rla-name{font-size:13px;font-weight:650;fill:var(--text);text-anchor:middle}
.rla-sub{font:11px var(--mono);fill:var(--muted);text-anchor:middle}
.rla-box.on .rla-sub{fill:var(--text)}
.rla-e path{fill:none;stroke:var(--v-edge);stroke-width:2;transition:stroke .25s,stroke-width .25s}
.rla-e text{font-size:11px;fill:var(--muted)}
.rla-e.on path{stroke:var(--accent);stroke-width:3.5}
.rla-e.on text{fill:var(--accent);font-weight:600}
.rla-status{font-size:12.5px;fill:var(--text)}
.rla-heat{fill:var(--accent);opacity:0;pointer-events:none}
.rla-pol{font-size:19px;font-weight:700;fill:var(--text);text-anchor:middle;pointer-events:none}
.rla-pol.g{fill:var(--ok);font-size:16px}
.rla-dot{fill:var(--warn);stroke:var(--panel);stroke-width:2.5;transition:transform .3s}
.rla-axis{stroke:var(--border-strong)}
.rla-opt{stroke:var(--ok);stroke-dasharray:4 3}
.rla-bar{fill:var(--accent);opacity:.75}
`;
