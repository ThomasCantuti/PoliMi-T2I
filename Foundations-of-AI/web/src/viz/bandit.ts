/*
 * bandit.ts — the k-armed bandit (slides p. 430-442): exploration vs exploitation.
 *
 * Rewards are Bernoulli: arm a pays 1 with its hidden probability μ(a), else 0.
 * Estimates use the sample average, updated incrementally: Q ← Q + (R − Q) / N   (p. 434, Q starts at 0).
 * ε-greedy: with probability ε a uniformly random arm, otherwise argmax Q (ties → lowest index).
 * UCB (p. 440-441): argmax  Q(a) + c·√(ln t / N(a)),  t = pulls made so far (the same as N(Parent) in
 * UCB1 for trees: a bandit is a one-level MCTS); an arm with N(a) = 0 has an infinite bound, so every arm
 * is pulled once first; ties → lowest index.
 * Regret = Σ_t (μ* − μ(a_t)) — what was lost in expectation by not always pulling the best arm.
 * Each arm's reward sequence is fixed by the seed, so every policy sees the same n-th reward of an arm.
 */
import type { Preset, VizInstance, VizOptions } from './types';

export interface BanditConfig {
  /** true success probabilities μ(a) (hidden). Default: k random values from the seed */
  arms?: number[];
  k?: number;                                // arms when `arms` is omitted (default 5)
  seed?: number;                             // rewards and ε-greedy randomness (default 1)
  policy?: 'manual' | 'egreedy' | 'ucb';     // explore default 'manual'; predict always uses UCB
  epsilon?: number;                          // default 0.1
  c?: number;                                // UCB exploration constant (default 1)
  steps?: number;                            // horizon of the automatic policies (default 200)
  predictSteps?: number;                     // predict: UCB choices to predict after the first round (default 10)
}

export const PRESETS: Preset<BanditConfig>[] = [
  { name: 'Pull the arms yourself – 4 arms', topic: 'mcts',
    config: { arms: [0.25, 0.55, 0.45, 0.7], seed: 3, policy: 'manual', c: 1 } },
  { name: 'UCB vs ε-greedy – 5 arms, close means', topic: 'mcts',
    config: { arms: [0.3, 0.5, 0.6, 0.45, 0.65], seed: 7, policy: 'ucb', c: 1, epsilon: 0.1, steps: 300 } },
  { name: 'Treatments (k = 3, slide p. 432)', topic: 'mcts',
    config: { arms: [0.8, 0.5, 0.2], seed: 11, policy: 'egreedy', epsilon: 0.1, c: 1, steps: 150 } },
];

// ------------------------------------------------------------------ model

type Policy = 'manual' | 'egreedy' | 'ucb';
interface BStep {
  t: number;              // pulls made after this step
  arm: number;            // arm pulled at this step (-1 for the initial state)
  reward: number;
  Q: number[]; N: number[];
  bound: number[];        // UCB values at decision time (before this pull)
  explored: boolean;      // ε-greedy random choice
  sum: number; regret: number; optimal: number;
  text: string;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f2 = (x: number) => Number.isFinite(x) ? (Math.round(x * 100) / 100).toFixed(2) : '∞';
const f3 = (x: number) => Number.isFinite(x) ? (Math.round(x * 1000) / 1000).toFixed(3) : '∞';

/** UCB values Q + c·√(ln t / N) for the state of step s (t = pulls so far). */
function ucb(s: BStep, c: number): number[] {
  return s.Q.map((q, a) => s.N[a] === 0 ? Infinity : q + c * Math.sqrt(Math.log(Math.max(1, s.t)) / s.N[a]));
}
const argmax = (xs: number[]) => xs.reduce((b, x, i) => x > xs[b] + 1e-12 ? i : b, 0);

export class Bandit {
  mu: number[]; best: number; steps: BStep[];
  private streams: (() => number)[]; private drawn: number[][]; private coin: () => number;
  constructor(mu: number[], seed: number) {
    this.mu = mu;
    this.best = Math.max(...mu);
    this.streams = mu.map((_, a) => mulberry32(seed * 7919 + a * 104729 + 1));
    this.drawn = mu.map(() => []);
    this.coin = mulberry32(seed * 31 + 99991);
    this.steps = [{ t: 0, arm: -1, reward: 0, Q: mu.map(() => 0), N: mu.map(() => 0), bound: mu.map(() => Infinity),
      explored: false, sum: 0, regret: 0, optimal: 0, text: `A new ${mu.length}-armed bandit: every estimate Q starts at 0` }];
  }
  /** n-th reward of arm a (0-based), fixed by the seed */
  reward(a: number, n: number): number {
    while (this.drawn[a].length <= n) this.drawn[a].push(this.streams[a]() < this.mu[a] ? 1 : 0);
    return this.drawn[a][n];
  }
  pull(a: number, why: string, bound: number[], explored = false): BStep {
    const p = this.steps[this.steps.length - 1];
    const N = p.N.slice(), Q = p.Q.slice();
    const r = this.reward(a, N[a]);
    N[a] += 1; Q[a] += (r - Q[a]) / N[a];
    const s: BStep = { t: p.t + 1, arm: a, reward: r, Q, N, bound, explored, sum: p.sum + r,
      regret: p.regret + this.best - this.mu[a], optimal: p.optimal + (this.mu[a] === this.best ? 1 : 0),
      text: `t = ${p.t + 1}: ${why} → pull arm ${a + 1}, reward ${r}; Q(${a + 1}) = ${f2(Q[a])}, N(${a + 1}) = ${N[a]}` };
    this.steps.push(s);
    return s;
  }
  next(policy: Policy, eps: number, c: number): BStep {
    const p = this.steps[this.steps.length - 1];
    const bound = ucb(p, c);
    if (policy === 'ucb') {
      const a = argmax(bound);
      return this.pull(a, p.N[a] === 0 ? `UCB: arm ${a + 1} untried (bound ∞)` : `UCB: max Q + c√(ln t/N) = ${f3(bound[a])}`, bound);
    }
    if (this.coin() < eps) {
      const a = Math.floor(this.coin() * this.mu.length);
      return this.pull(a, `ε-greedy explores (random arm)`, bound, true);
    }
    const a = argmax(p.Q);
    return this.pull(a, `ε-greedy exploits: max Q = ${f2(p.Q[a])}`, bound);
  }
}

// ------------------------------------------------------------------ view

const CSS = `
.bd{display:flex;flex-direction:column;gap:12px;outline:none;font-size:13.5px;color:var(--text)}
.bd-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.bd-sp{flex:1}
.bd-seg{display:inline-flex;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;background:var(--panel-2)}
.bd-seg button{border:0;background:transparent;padding:5px 10px;cursor:pointer;color:var(--text-2);font-size:12.5px;transition:background .12s,color .12s}
.bd-seg button+button{border-left:1px solid var(--border)}
.bd-seg button:hover{background:var(--panel-3)}
.bd-seg button.on{background:var(--accent-soft);color:var(--text)}
.bd-lbl{font-size:12px;color:var(--muted);display:inline-flex;gap:6px;align-items:center}
.bd-lbl input{width:64px;font-family:var(--mono)}
.bd-arms{display:flex;flex-direction:column;gap:6px;border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);padding:10px 12px}
.bd-head{display:grid;grid-template-columns:88px minmax(0,1fr) 168px;gap:10px;font-size:12px;color:var(--muted)}
.bd-arm{display:grid;grid-template-columns:88px minmax(0,1fr) 168px;gap:10px;align-items:center;padding:6px 6px;margin:0 -6px;border-radius:var(--radius-sm);border:1px solid transparent;background:transparent;color:inherit;font:inherit;text-align:left;transition:background .15s,border-color .15s}
.bd-arm.click{cursor:pointer}
.bd-arm.click:hover{background:var(--panel-2);border-color:var(--border)}
.bd-arm.last{background:var(--accent-soft)}
.bd-arm.ask{border-color:var(--warn)}
.bd-name{font-weight:600;display:flex;gap:6px;align-items:center;white-space:nowrap}
.bd-rw{font:700 12px var(--mono);border-radius:99px;padding:0 6px;opacity:0;transition:opacity .2s}
.bd-rw.on{opacity:1}
.bd-rw.r1{background:var(--ok-soft);color:var(--ok)} .bd-rw.r0{background:var(--panel-3);color:var(--muted)}
.bd-track{position:relative;height:18px;border-radius:5px;background:var(--panel-2);overflow:hidden}
.bd-qb{position:absolute;left:0;top:0;bottom:0;background:var(--accent);border-radius:5px;transition:width .35s cubic-bezier(.2,.7,.2,1)}
.bd-b{position:absolute;top:3px;bottom:3px;background:var(--accent-soft);border:1px dashed var(--accent);border-left:0;border-radius:0 4px 4px 0;transition:left .35s cubic-bezier(.2,.7,.2,1),width .35s cubic-bezier(.2,.7,.2,1),opacity .2s}
.bd-mu{position:absolute;top:-2px;bottom:-2px;width:3px;margin-left:-1.5px;background:var(--ok);border-radius:2px;transition:left .3s,opacity .2s}
.bd-one{position:absolute;top:0;bottom:0;width:1px;background:var(--border-strong)}
.bd-num{font:12.5px var(--mono);color:var(--text-2);display:flex;gap:10px;justify-content:flex-end;white-space:nowrap}
.bd-num b{color:var(--text);font-weight:600}
.bd-num .u{color:var(--accent)}
.bd-num .m{color:var(--ok)}
@media (max-width:520px){
  .bd-head,.bd-arm{grid-template-columns:82px minmax(0,1fr);row-gap:4px}
  .bd-head span:last-child{display:none}
  .bd-num{grid-column:2;justify-content:flex-start}
}
.bd-info{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
@media (max-width:760px){.bd-info{grid-template-columns:1fr}}
.bd-card{border:1px solid var(--border);border-radius:var(--radius);background:var(--panel);padding:10px 12px;min-width:0}
.bd-card h4{margin:0 0 6px;font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.bd-step{line-height:1.5;min-height:40px}
.bd-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.bd-f{font:12.5px var(--mono);color:var(--text-2);line-height:1.5}
.bd-chart svg{display:block;width:100%}
.bd-chart .ax{stroke:var(--border-strong);stroke-width:1}
.bd-chart .gr{stroke:var(--border);stroke-width:1}
.bd-chart .tk{font:12px var(--mono);fill:var(--muted)}
.bd-chart .ln{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round}
.bd-chart .opt{fill:none;stroke:var(--ok);stroke-width:1.6;stroke-dasharray:5 4}
.bd-chart .gap{fill:var(--bad-soft)}
.bd-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:6px}
.bd-legend i{display:inline-block;width:16px;height:3px;border-radius:2px;margin-right:5px;vertical-align:3px}
.bd-ctl{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.bd-ctl .btn{padding:6px 10px}
.bd-ctl svg{width:15px;height:15px;display:block}
.bd-ask{border:1px solid var(--border);border-left:3px solid var(--warn);border-radius:var(--radius);background:var(--panel);padding:10px 12px;display:flex;flex-direction:column;gap:6px}
.bd-ask.idle{border-left-color:var(--border-strong)}
.bd-ask.good{border-left-color:var(--ok)}
.bd-ask-title{font-weight:600}
.bd-ask-msg{font-size:13px;color:var(--text-2)}
.bd-ask-msg:empty{display:none}
.bd-ask-msg.bad{color:var(--bad)} .bd-ask-msg.ok{color:var(--ok)}
.bd-shake{animation:bd-shake .38s}
@keyframes bd-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
`;

const ICON = {
  back: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>',
  step: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3v10l8.5-5z"/></svg>',
  pause: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx=".8"/><rect x="9" y="3" width="3" height="10" rx=".8"/></svg>',
  reset: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.5v3h3"/></svg>',
};

function H<T extends HTMLElement = HTMLElement>(html: string): T {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as T;
}

export function mount(el: HTMLElement, config: BanditConfig, opts: VizOptions = {}): VizInstance {
  if (!document.getElementById('viz-bandit-css')) {
    document.head.appendChild(Object.assign(document.createElement('style'), { id: 'viz-bandit-css', textContent: CSS }));
  }
  const predict = opts.mode === 'predict';
  const onEvent = opts.onEvent ?? (() => {});
  let seed = Math.round(config.seed ?? 1);
  const mkArms = () => {
    if (Array.isArray(config.arms) && config.arms.length) return config.arms.map(x => Math.min(1, Math.max(0, Number(x))));
    const r = mulberry32(seed * 13 + 5);
    return Array.from({ length: Math.max(2, Math.min(10, config.k ?? 5)) }, () => Math.round((0.1 + 0.8 * r()) * 100) / 100);
  };
  let policy: Policy = predict ? 'ucb' : config.policy ?? 'manual';
  let eps = config.epsilon ?? 0.1, c = config.c ?? 1;
  const horizon = Math.max(10, Math.min(2000, config.steps ?? 200));
  const k0 = mkArms().length;
  const nPredict = Math.max(1, config.predictSteps ?? 10);
  let B = new Bandit(mkArms(), seed);
  let idx = 0, timer: number | null = null, speed = 1, reveal = false;
  let correct = 0, total = 0, doneFired = false, firstTry = true, qMsg = '', qMsgCls = '';
  const answered = new Set<number>();

  /** automatic policies: precompute the whole run so ⏮ is trivial */
  function rebuild(): void {
    stop();
    B = new Bandit(mkArms(), seed);
    if (policy !== 'manual') {
      const T = predict ? B.mu.length + nPredict : horizon;
      for (let i = 0; i < T; i++) B.next(policy, eps, c);
    }
    idx = predict ? B.mu.length : 0;   // predict starts after the initial round (every arm once)
    answered.clear(); correct = 0; total = 0; doneFired = false; qMsg = ''; qMsgCls = ''; firstTry = true;
  }
  rebuild();

  el.innerHTML = '';
  const root = H(`<div class="bd" tabindex="0"></div>`);
  el.append(root);
  const bar = H(`<div class="bd-bar"></div>`);
  if (!predict) {
    bar.append(H(`<div class="bd-seg" data-k="pol"><button data-v="manual">You pull</button><button data-v="egreedy">ε-greedy</button><button data-v="ucb">UCB</button></div>`),
      H(`<label class="bd-lbl" data-show="egreedy">ε <input type="number" min="0" max="1" step="0.05" data-k="eps"></label>`),
      H(`<label class="bd-lbl" data-show="ucb">c <input type="number" min="0" step="0.1" data-k="c"></label>`),
      H(`<span class="bd-sp"></span>`),
      H(`<button class="btn sm" data-a="reveal">Reveal true μ</button>`),
      H(`<button class="btn sm" data-a="new" title="Same arms, new random rewards">New seed</button>`));
  } else {
    bar.append(H(`<span class="chip">UCB · predict</span>`), H(`<span class="bd-lbl">c = ${c}, t = pulls so far</span>`),
      H(`<span class="bd-sp"></span>`), H(`<span class="chip" data-k="score"></span>`));
  }
  root.append(bar);
  const setInputs = () => {
    const ie = bar.querySelector<HTMLInputElement>('[data-k="eps"]'), ic = bar.querySelector<HTMLInputElement>('[data-k="c"]');
    if (ie) ie.value = String(eps);
    if (ic) ic.value = String(c);
  };
  setInputs();

  const arms = H(`<div class="bd-arms"><div class="bd-head"><span>arm</span><span class="bd-scale"></span><span style="text-align:right">estimate · pulls</span></div></div>`);
  root.append(arms);
  const rows = B.mu.map((_, a) => {
    const r = H<HTMLButtonElement>(`<button class="bd-arm" type="button" aria-label="arm ${a + 1}">
      <span class="bd-name">Arm ${a + 1}<span class="bd-rw"></span></span>
      <span class="bd-track"><span class="bd-one"></span><span class="bd-qb"></span><span class="bd-b"></span><span class="bd-mu"></span></span>
      <span class="bd-num"></span></button>`);
    r.addEventListener('click', () => onArm(a));
    arms.append(r);
    return { r, rw: r.querySelector<HTMLElement>('.bd-rw')!, q: r.querySelector<HTMLElement>('.bd-qb')!, b: r.querySelector<HTMLElement>('.bd-b')!,
      mu: r.querySelector<HTMLElement>('.bd-mu')!, one: r.querySelector<HTMLElement>('.bd-one')!, num: r.querySelector<HTMLElement>('.bd-num')! };
  });
  const scaleEl = arms.querySelector<HTMLElement>('.bd-scale')!;

  const qcard = predict ? H(`<div class="bd-ask idle"></div>`) : null;
  if (qcard) root.append(qcard);

  const info = H(`<div class="bd-info">
    <div class="bd-card"><h4>Current step</h4><div class="bd-step"></div><div class="bd-meta"></div></div>
    <div class="bd-card bd-chart"><h4>Cumulative reward</h4><div class="bd-svg"></div>
      <div class="bd-legend"><span><i style="background:var(--accent)"></i>collected</span><span><i style="background:var(--ok)"></i>μ* · t (always best arm)</span><span><i style="background:var(--bad-soft);height:8px;vertical-align:0"></i>≈ regret</span></div></div></div>`);
  root.append(info);
  const stepEl = info.querySelector<HTMLElement>('.bd-step')!, metaEl = info.querySelector<HTMLElement>('.bd-meta')!;
  const chartEl = info.querySelector<HTMLElement>('.bd-svg')!;

  const ctl = H(`<div class="bd-bar"><div class="bd-ctl">
      <button class="btn" data-a="back" title="Back (←)" aria-label="Back">${ICON.back}</button>
      <button class="btn primary" data-a="step" title="Step (→)" aria-label="Step">${ICON.step}</button>
      <button class="btn" data-a="play" title="Play / pause (space)" aria-label="Play">${ICON.play}</button>
      <button class="btn" data-a="reset" title="Reset" aria-label="Reset">${ICON.reset}</button>
      <select data-a="speed" title="Speed" aria-label="Speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option><option value="16">16×</option></select>
    </div><span class="bd-sp"></span><span class="bd-lbl bd-formula"></span></div>`);
  root.append(ctl);
  const btnBack = ctl.querySelector<HTMLButtonElement>('[data-a="back"]')!, btnStep = ctl.querySelector<HTMLButtonElement>('[data-a="step"]')!;
  const btnPlay = ctl.querySelector<HTMLButtonElement>('[data-a="play"]')!, formulaEl = ctl.querySelector<HTMLElement>('.bd-formula')!;

  // ---- predict
  const pendingQ = () => predict && idx + 1 < B.steps.length && !answered.has(idx + 1);
  function onArm(a: number): void {
    if (predict) {
      if (!pendingQ()) return;
      const nxt = B.steps[idx + 1], cur = B.steps[idx];
      const why = `UCB(a) = Q + ${c}·√(ln ${cur.t} / N): ` + nxt.bound.map((u, i) => `arm ${i + 1} ${f3(u)}`).join(', ');
      if (a === nxt.arm) {
        answered.add(idx + 1); total++; if (firstTry) correct++;
        onEvent(`Predicted UCB choice at t = ${nxt.t}: arm ${a + 1} (${firstTry ? 'correct' : 'correct after retry'})`);
        qMsg = `Correct — arm ${a + 1}. ${why}.`; qMsgCls = 'ok'; firstTry = true;
        go(idx + 1);
      } else {
        firstTry = false;
        qMsg = `Not arm ${a + 1}: its bound ${cur.N[a] ? `Q + c·√(ln t/N) = ${f2(cur.Q[a])} + ${c}·√(ln ${cur.t}/${cur.N[a]})` : 'is ∞'} is not the largest. A rarely pulled arm gets a bigger bonus.`;
        qMsgCls = 'bad';
        render(false);
        if (qcard) { qcard.classList.remove('bd-shake'); void qcard.offsetWidth; qcard.classList.add('bd-shake'); }
      }
      return;
    }
    if (policy !== 'manual') return;
    B.steps.length = idx + 1;            // pulling after going back discards the undone future
    B.pull(a, 'you choose', ucb(B.steps[idx], c));
    go(idx + 1);
  }
  function revealQ(): void {
    const nxt = B.steps[idx + 1], cur = B.steps[idx];
    answered.add(idx + 1); total++;
    onEvent(`Predicted UCB choice at t = ${nxt.t}: revealed (arm ${nxt.arm + 1})`);
    qMsg = `Answer: arm ${nxt.arm + 1}. UCB(a) = Q + ${c}·√(ln ${cur.t} / N): ` + nxt.bound.map((u, i) => `arm ${i + 1} ${f3(u)}`).join(', ') + '.';
    qMsgCls = 'bad'; firstTry = true;
    go(idx + 1);
  }
  function renderQ(): void {
    if (!qcard) return;
    const score = root.querySelector('[data-k="score"]');
    if (score) score.textContent = `First try: ${correct} / ${total}`;
    const ask = pendingQ();
    qcard.className = 'bd-ask ' + (ask ? '' : qMsgCls === 'ok' ? 'good' : 'idle');
    const s = B.steps[idx];
    const msg = qMsg ? `<div class="bd-ask-msg ${qMsgCls}">${ask && qMsgCls !== 'bad' ? 'Previous: ' : ''}${qMsg}</div>` : '';
    if (ask) {
      qcard.innerHTML = `<div class="bd-ask-title"><span class="chip">Predict</span> Which arm does UCB pull next (t = ${s.t} pulls so far)?</div>
        <div class="bd-ask-msg">Click an arm. UCB(a) = Q(a) + ${c}·√(ln ${s.t} / N(a)); ties go to the lowest arm. <button class="btn ghost sm" data-q="reveal">Reveal</button></div>${msg}`;
      qcard.querySelector('[data-q="reveal"]')?.addEventListener('click', revealQ);
    } else {
      const end = idx >= B.steps.length - 1;
      qcard.innerHTML = `<div class="bd-ask-title">${end ? 'Done' : 'First round'}</div>${msg}` +
        (end ? `<div class="bd-ask-msg">You predicted <b>${correct}</b> of <b>${total}</b> UCB choices on the first try.</div>` : '');
    }
  }

  // ---- render
  function chart(): void {
    const w = Math.max(240, chartEl.clientWidth || 320), h = 136, L = 34, Rr = 8, T = 14, Bm = 20;
    const upto = B.steps.slice(0, idx + 1);
    const tMax = Math.max(10, idx);
    const yMax = Math.max(1, B.best * tMax);
    const X = (t: number) => L + (w - L - Rr) * t / tMax, Y = (v: number) => T + (h - T - Bm) * (1 - v / yMax);
    const pts = upto.map(s => `${X(s.t).toFixed(1)},${Y(s.sum).toFixed(1)}`).join(' ');
    const optEnd = upto[upto.length - 1].t;
    const gap = upto.length > 1 ? `<polygon class="gap" points="${pts} ${X(optEnd).toFixed(1)},${Y(B.best * optEnd).toFixed(1)} ${X(0)},${Y(0)}"/>` : '';
    const ticks = [0, Math.round(yMax / 2), Math.round(yMax)];
    chartEl.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="cumulative reward chart">
      ${ticks.map(v => `<line class="gr" x1="${L}" x2="${w - Rr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tk" x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      <line class="ax" x1="${L}" x2="${L}" y1="${T}" y2="${h - Bm}"/>
      <text class="tk" x="${L}" y="${h - 4}">0</text><text class="tk" x="${w - Rr}" y="${h - 4}" text-anchor="end">t = ${tMax}</text>
      ${gap}<line class="opt" x1="${X(0)}" y1="${Y(0)}" x2="${X(tMax)}" y2="${Y(B.best * tMax)}"/>
      <polyline class="ln" points="${pts}"/></svg>`;
  }
  function render(fire: boolean): void {
    const s = B.steps[idx];
    const ask = pendingQ();
    const bounds = ucb(s, c);
    const showBonus = policy === 'ucb' && !ask;
    const finite = bounds.filter(Number.isFinite);
    const xMax = Math.max(1, showBonus && finite.length ? Math.min(3, Math.max(...finite)) : 1);
    const pct = (v: number) => `${Math.min(100, (v / xMax) * 100)}%`;
    scaleEl.textContent = showBonus ? `bar: Q  ·  dashed: + c·√(ln t / N)  ·  scale 0–${xMax.toFixed(2)}` : 'bar: estimate Q (0–1)';
    rows.forEach((row, a) => {
      const q = s.Q[a], u = bounds[a];
      row.q.style.width = pct(q);
      row.b.style.left = pct(q);
      row.b.style.width = showBonus ? (Number.isFinite(u) ? `${Math.max(0, Math.min(100, (u / xMax) * 100) - Math.min(100, (q / xMax) * 100))}%` : `${100 - Math.min(100, q / xMax * 100)}%`) : '0%';
      row.b.style.opacity = showBonus ? '1' : '0';
      row.mu.style.left = pct(B.mu[a]); row.mu.style.opacity = reveal ? '1' : '0';
      row.one.style.left = pct(1); row.one.style.opacity = xMax > 1 ? '1' : '0';
      row.num.innerHTML = `<span>Q <b>${f2(q)}</b></span><span>N <b>${s.N[a]}</b></span>` +
        (policy === 'ucb' ? `<span class="u">UCB ${ask ? '?' : f2(u)}</span>` : '') + (reveal ? `<span class="m">μ ${f2(B.mu[a])}</span>` : '');
      row.r.className = 'bd-arm' + ((policy === 'manual' && !predict) || ask ? ' click' : '') + (s.arm === a ? ' last' : '') + (ask ? ' ask' : '');
      row.rw.className = 'bd-rw' + (s.arm === a ? ` on r${s.reward}` : '');
      row.rw.textContent = s.arm === a ? (s.reward ? '+1' : '0') : '';
    });
    stepEl.textContent = predict && idx === B.mu.length && !qMsg
      ? `UCB first pulls every arm once (N = 0 → bound ∞): ${B.steps.slice(1, idx + 1).map(x => `arm ${x.arm + 1} → ${x.reward}`).join(', ')}.`
      : policy === 'manual' && idx === 0 ? 'Click an arm to pull it. Which one pays best? Balance trying arms (exploration) with using the best so far (exploitation).' : s.text;
    const pctOpt = s.t ? Math.round(100 * s.optimal / s.t) : 0;
    metaEl.innerHTML = `<span class="chip">t = ${s.t}</span><span class="chip">reward ${s.sum}</span><span class="chip">regret ${f2(s.regret)}</span><span class="chip">best arm ${pctOpt}%</span>`;
    formulaEl.textContent = policy === 'ucb' ? `UCB(a) = Q(a) + c·√(ln t / N(a)), c = ${c}` : policy === 'egreedy' ? `ε = ${eps}: explore with prob. ε, else argmax Q` : 'Q ← Q + (R − Q) / N';
    bar.querySelectorAll<HTMLElement>('[data-show]').forEach(x => { x.style.display = x.dataset.show === policy ? '' : 'none'; });
    bar.querySelectorAll<HTMLButtonElement>('.bd-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === policy));
    const rv = bar.querySelector<HTMLButtonElement>('[data-a="reveal"]');
    if (rv) rv.textContent = reveal ? 'Hide true μ' : 'Reveal true μ';
    btnBack.disabled = idx === 0 || (predict && idx <= B.mu.length);
    btnStep.disabled = policy === 'manual' || idx >= B.steps.length - 1;
    btnPlay.disabled = policy === 'manual';
    btnPlay.innerHTML = timer != null ? ICON.pause : ICON.play;
    chart();
    renderQ();
    if (fire) onEvent(stepEl.textContent ?? '');
    if (predict && idx === B.steps.length - 1 && !doneFired) { doneFired = true; opts.onDone?.({ correct, total }); }
  }
  function go(i: number): void {
    i = Math.max(predict ? B.mu.length : 0, Math.min(B.steps.length - 1, i));
    const fwd = i > idx;
    idx = i;
    if (!fwd) { qMsg = ''; qMsgCls = ''; }
    render(fwd);
  }
  function step(): boolean {
    if (idx >= B.steps.length - 1) { stop(); return false; }
    if (pendingQ()) { stop(); render(false); return false; }
    go(idx + 1);
    return true;
  }
  function stop(): void { if (timer != null) { clearInterval(timer); timer = null; } }
  function play(): void {
    if (policy === 'manual') return;
    if (timer != null) { stop(); return render(false); }
    if (idx >= B.steps.length - 1) go(0);
    timer = window.setInterval(() => { if (!step()) { stop(); render(false); } }, 600 / speed);
    render(false);
  }

  root.addEventListener('click', ev => {
    const b = (ev.target as Element).closest<HTMLButtonElement>('button');
    if (!b || b.classList.contains('bd-arm')) return;
    if ((b.parentElement as HTMLElement | null)?.dataset.k === 'pol') {
      policy = (b.dataset.v as Policy) ?? 'manual'; rebuild(); render(true);
      onEvent(`Policy: ${policy === 'manual' ? 'you choose' : policy === 'ucb' ? `UCB (c = ${c})` : `ε-greedy (ε = ${eps})`}`);
      return;
    }
    const a = b.dataset.a;
    if (a === 'back') { stop(); go(idx - 1); }
    else if (a === 'step') { stop(); step(); }
    else if (a === 'play') play();
    else if (a === 'reset') { rebuild(); render(true); }
    else if (a === 'reveal') { reveal = !reveal; render(false); onEvent(reveal ? `True means revealed: ${B.mu.map((m, i) => `arm ${i + 1} μ = ${f2(m)}`).join(', ')}` : 'True means hidden'); }
    else if (a === 'new') { seed++; rebuild(); render(true); }
  });
  bar.addEventListener('change', ev => {
    const t = ev.target as HTMLInputElement, v = Number(t.value);
    if (!Number.isFinite(v) || v < 0) return;
    if (t.dataset.k === 'eps') eps = Math.min(1, v);
    else if (t.dataset.k === 'c') c = v;
    else return;
    rebuild(); render(true);
  });
  ctl.querySelector('select')!.addEventListener('change', ev => {
    speed = Number((ev.target as HTMLSelectElement).value);
    if (timer != null) { stop(); play(); }
  });
  const onKey = (ev: KeyboardEvent) => {
    if ((ev.target as Element).matches('input, select, textarea')) return;
    if (ev.key === 'ArrowRight') { ev.preventDefault(); stop(); step(); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); stop(); go(idx - 1); }
    else if (ev.key === ' ') { ev.preventDefault(); play(); }
    else if (/^[1-9]$/.test(ev.key) && Number(ev.key) <= k0) onArm(Number(ev.key) - 1);
  };
  root.addEventListener('keydown', onKey);
  let lastW = 0;
  const ro = new ResizeObserver(() => { const w = chartEl.clientWidth; if (w && Math.abs(w - lastW) > 4) { lastW = w; chart(); } });

  render(true);
  ro.observe(chartEl);
  return { destroy() { stop(); ro.disconnect(); root.removeEventListener('keydown', onKey); el.innerHTML = ''; } };
}
