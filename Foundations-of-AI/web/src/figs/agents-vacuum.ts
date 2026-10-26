// Reflex vs model-based agent in the two-square vacuum world (worked example in agents.md): stepper.
// Both agents are simulated with their rules; the scores are computed, never typed.
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

type Sq = 'A' | 'B';
type Act = 'Suck' | 'Left' | 'Right' | 'NoOp';
const STEPS = 6, X: Record<Sq, number> = { A: 75, B: 195 }, ROW = [95, 240];

interface Agent { loc: Sq; dirt: Record<Sq, boolean>; mem: Partial<Record<Sq, boolean>>; total: number }
interface Step { percept: string; act: Act; clean: number; move: boolean; pts: number }
interface F extends Frame { t: number; a: { loc: Sq; dirt: Record<Sq, boolean>; total: number; mem: Partial<Record<Sq, boolean>>; step?: Step }[] }

const other = (q: Sq): Sq => (q === 'A' ? 'B' : 'A');
const reflex = (ag: Agent): Act => (ag.dirt[ag.loc] ? 'Suck' : ag.loc === 'A' ? 'Right' : 'Left');
const modelBased = (ag: Agent): Act => (ag.dirt[ag.loc] ? 'Suck' : ag.mem[other(ag.loc)] === false ? 'NoOp' : ag.loc === 'A' ? 'Right' : 'Left');

function step(ag: Agent, rule: (ag: Agent) => Act): Step {
  const percept = `${ag.loc}, ${ag.dirt[ag.loc] ? 'Dirty' : 'Clean'}`;
  ag.mem[ag.loc] = ag.dirt[ag.loc];
  const act = rule(ag);
  if (act === 'Suck') ag.dirt[ag.loc] = ag.mem[ag.loc] = false;
  if (act === 'Left' || act === 'Right') ag.loc = act === 'Left' ? 'A' : 'B';
  const clean = (['A', 'B'] as Sq[]).filter(q => !ag.dirt[q]).length, move = act === 'Left' || act === 'Right';
  ag.total += clean - (move ? 1 : 0);
  return { percept, act, clean, move, pts: clean - (move ? 1 : 0) };
}

const pts = (st: Step) => `${st.clean} clean square${st.clean === 1 ? '' : 's'}${st.move ? ' − 1 move' : ''} = ${st.pts}`;

function build(): F[] {
  const ags: Agent[] = [0, 1].map(() => ({ loc: 'A', dirt: { A: true, B: true }, mem: {}, total: 0 }));
  const snap = (steps?: Step[]) => ags.map((ag, i) => ({ loc: ag.loc, dirt: { ...ag.dirt }, total: ag.total, mem: { ...ag.mem }, step: steps?.[i] }));
  const frames: F[] = [{ t: 0, a: snap(), group: 'start',
    cap: '**Start.** Both squares are dirty and both agents are in A. Each step scores **+1 per clean square** and **−1 per move**.' }];
  let diverged = false;
  for (let t = 1; t <= STEPS; t++) {
    const [r, m] = [step(ags[0], reflex), step(ags[1], modelBased)];
    let cap = r.act === m.act
      ? `Both perceive (${r.percept}) and do **${r.act}**: ${pts(r)}.`
      : `Reflex: (${r.percept}) → **${r.act}**, ${pts(r)}. Model-based: (${m.percept}) → **${m.act}**, ${pts(m)}.`;
    if (r.act !== m.act && !diverged) {
      diverged = true;
      cap += ' The reflex agent sees only the current square, so it cannot know A is already clean. The model-based agent **remembers** it.';
    } else if (r.act !== m.act && t < STEPS) cap += ' The reflex agent goes **back and forth** forever, paying for every move.';
    if (t === STEPS) cap += ` **Totals: reflex ${ags[0].total}, model-based ${ags[1].total}.** With a move cost only the agent with memory is rational; ` +
      'its NoOp is right only because its model assumes dirt never reappears.';
    frames.push({ t, a: snap([r, m]), group: 'steps', cap: `**t = ${t}.** ${cap}` });
  }
  return frames;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-vw-css', '.vw-dirt{fill:var(--warn);transition:opacity .3s}.vw-agent{fill:var(--accent);stroke:var(--panel);stroke-width:3;' +
    'transition:transform .45s cubic-bezier(.2,.7,.2,1)}.vw-sq{font-size:12px;font-weight:700;fill:var(--muted)}');
  const c = card(el, 'stepper', 'Reflex vs model-based agent in the vacuum world', '0 0 680 320');
  const ui = ['Simple reflex agent', 'Model-based reflex agent'].map((title, i) => {
    const y = ROW[i];
    s(c.svg, 'text', { x: 20, y: y - 50, class: 'fg-h2' }, title);
    const dirt = (['A', 'B'] as Sq[]).map(q => {
      s(c.svg, 'rect', { x: X[q] - 55, y: y - 36, width: 110, height: 76, rx: 6, class: 'fg-cell' });
      s(c.svg, 'text', { x: X[q] - 47, y: y - 20, class: 'vw-sq' }, q);
      const g = s(c.svg, 'g', { class: 'vw-dirt' });
      for (const [dx, dy] of [[-22, 24], [-8, 30], [8, 22], [24, 29]]) s(g, 'circle', { cx: X[q] + dx, cy: y + dy, r: 4 });
      return g;
    });
    return {
      dirt, agent: s(c.svg, 'circle', { r: 14, class: 'vw-agent' }),
      line: s(c.svg, 'text', { x: 290, y: y - 14, class: 'fg-t' }),
      pts: s(c.svg, 'text', { x: 290, y: y + 10, class: 'fg-m' }),
      mem: i ? s(c.svg, 'text', { x: 290, y: y + 32, class: 'fg-m' }) : null,
      total: s(c.svg, 'text', { x: 660, y: y - 14, class: 'fg-v ok', 'text-anchor': 'end' }),
      y,
    };
  });
  const memo = (v?: boolean) => (v === undefined ? '?' : v ? 'dirty' : 'clean');
  return stepper(c, build(), f => {
    f.a.forEach((a, i) => {
      const u = ui[i];
      u.agent.style.transform = `translate(${X[a.loc]}px, ${u.y - 2}px)`;
      (['A', 'B'] as Sq[]).forEach((q, k) => u.dirt[k].classList.toggle('hide', !a.dirt[q]));
      u.line.textContent = a.step ? `t = ${f.t} · (${a.step.percept}) → ${a.step.act}` : 'start in A';
      u.pts.textContent = a.step ? `this step: ${a.step.clean} clean${a.step.move ? ' − 1 move' : ''} = ${a.step.pts}` : 'both squares dirty';
      if (u.mem) u.mem.textContent = `memory: A ${memo(a.mem.A)}, B ${memo(a.mem.B)}`;
      u.total.textContent = `total ${a.total}`;
    });
  }, opts);
}
