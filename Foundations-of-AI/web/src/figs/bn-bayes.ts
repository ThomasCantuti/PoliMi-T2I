// Bayes' rule with natural frequencies (AIMA §12.5, uncertainty.md): 1000 people, then the 1000 who show the evidence.
// The cavity presets are read from the full joint of bn-joint; meningitis uses P(s | m) = 0.7, P(m) = 1/50000, P(s) = 0.01.
import { JOINT, prob } from './bn-joint';
import { bar, card, md, num, s, slider, style, type FigOptions } from './shell';

const COLS = 40, ROWS = 25, D = 8, N = COLS * ROWS;
interface Case { label: string; h: string; e: string; prior: number; sens: number; fpr: number }
const P_M = 1 / 50000, P_S = 0.01, P_S_M = 0.7;
const PRESETS: Case[] = [
  { label: 'cavity | toothache (Fig. 12.3)', h: 'cavity', e: 'toothache', prior: prob({ Cavity: 0 }).p,
    sens: prob({ Cavity: 0, Toothache: 0 }).p / prob({ Cavity: 0 }).p, fpr: prob({ Cavity: 1, Toothache: 0 }).p / prob({ Cavity: 1 }).p },
  { label: 'cavity | toothache ∧ catch', h: 'cavity', e: 'toothache ∧ catch', prior: prob({ Cavity: 0 }).p,
    sens: JOINT[0][0][0] / prob({ Cavity: 0 }).p, fpr: JOINT[1][0][0] / prob({ Cavity: 1 }).p },
  { label: 'meningitis | stiff neck (§12.5)', h: 'meningitis', e: 'stiff neck', prior: P_M, sens: P_S_M, fpr: (P_S - P_S_M * P_M) / (1 - P_M) },
];

/** Rounds the shares of N so that they still add up to N (largest remainder). */
function counts(shares: number[], total: number): number[] {
  const raw = shares.map(x => x * total), out = raw.map(Math.floor);
  const order = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  const missing = total - out.reduce((a, b) => a + b, 0);
  for (let k = 0; k < missing; k++) out[order[k][1]]++;
  return out;
}
const leg = (t: SVGTextElement, items: [string, string][]) => {
  t.replaceChildren();
  for (const [cls, str] of items) { s(t, 'tspan', { class: cls }, '■ '); s(t, 'tspan', {}, `${str}    `); }
};
export const posterior = (c: Case) => (c.sens * c.prior) / (c.sens * c.prior + c.fpr * (1 - c.prior) || 1); // 0 when nobody shows e

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-bn-bayes-css', CSS);
  const check = [posterior(PRESETS[0]) - prob({ Cavity: 0, Toothache: 0 }).p / prob({ Toothache: 0 }).p, posterior(PRESETS[2]) - (P_S_M * P_M) / P_S];
  if (check.some(d => Math.abs(d) > 1e-12)) console.error('bn-bayes: Bayes\' rule disagrees with the direct computation', check);
  const c = card(el, 'interactive', "Bayes' rule with natural frequencies: who has the cause among those with the evidence?", '0 0 780 312');
  const grid = (x0: number, title: string) => {
    s(c.svg, 'text', { x: x0, y: 22, class: 'fg-t' }, title);
    return Array.from({ length: N }, (_, i) => s(c.svg, 'circle', { cx: x0 + 4 + (i % COLS) * D, cy: 38 + Math.floor(i / COLS) * D, r: 3.1 }));
  };
  const left = grid(20, '1000 people'), right = grid(420, '');
  const rightT = s(c.svg, 'text', { x: 420, y: 22, class: 'fg-t' });
  const legL = [0, 1, 2, 3].map(k => s(c.svg, 'text', { x: 20, y: 254 + k * 17, class: 'fg-m' }));
  const legR = [0, 1, 2].map(k => s(c.svg, 'text', { x: 420, y: 258 + k * 19, class: k ? 'fg-m' : 'ucb-post' }));

  let cs: Case = { ...PRESETS[0] };
  const knobs = bar(c), pre = bar(c);
  const pr = slider(knobs, 'prior P(H)', -5, -0.3, 0.01, Math.log10(cs.prior), v => { cs.prior = 10 ** v; render(); });
  const se = slider(knobs, 'P(e | H)', 0, 1, 0.01, cs.sens, v => { cs.sens = v; render(); });
  const fp = slider(knobs, 'P(e | ¬H)', 0, 0.5, 0.001, cs.fpr, v => { cs.fpr = v; render(); });
  for (const inp of [pr, se, fp]) inp.addEventListener('change', () => say());
  PRESETS.forEach(p => {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = p.label;
    b.onclick = () => { cs = { ...p }; pr.value = String(Math.log10(p.prior)); se.value = String(p.sens); fp.value = String(p.fpr); render(); say(); };
    pre.append(b);
  });
  const say = () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);

  function render() {
    const { prior, sens, fpr, h, e } = cs, post = posterior(cs), pe = sens * prior + fpr * (1 - prior);
    for (const [inp, v] of [[pr, prior], [se, sens], [fp, fpr]] as const) inp.nextElementSibling!.textContent = num(v, 3);
    const [tp, fn, fpos] = counts([prior * sens, prior * (1 - sens), (1 - prior) * fpr, (1 - prior) * (1 - fpr)], N);
    left.forEach((d, i) => d.setAttribute('class', i < tp ? 'ucb-tp' : i < tp + fn ? 'ucb-fn' : i < tp + fn + fpos ? 'ucb-fp' : 'ucb-tn'));
    const [rtp] = counts([post, 1 - post], N);
    right.forEach((d, i) => d.setAttribute('class', i < rtp ? 'ucb-tp' : 'ucb-fp'));
    rightT.textContent = `1000 people with ${e}`;
    const no = (x: string) => (x.includes(' ') ? `¬(${x})` : `¬${x}`);
    ([['ucb-tp', `${h} ∧ ${e}: ${tp}`], ['ucb-fn', `${h} ∧ ${no(e)}: ${fn}`], ['ucb-fp', `${no(h)} ∧ ${e}: ${fpos}`],
      ['ucb-tn', `${no(h)} ∧ ${no(e)}: ${N - tp - fn - fpos}`]] as [string, string][]).forEach((it, k) => leg(legL[k], [it]));
    legR[0].textContent = `P(${h} | ${e}) = ${num(post, 3)}`;
    leg(legR[1], [['ucb-tp', `${h}: ${rtp}`]]);
    leg(legR[2], [['ucb-fp', `${no(h)} (false alarms): ${N - rtp}`]]);
    // natural frequencies: the smallest power of ten (≥ 1000) in which at least one person has both H and e
    const pop = 10 ** Math.max(3, Math.ceil(Math.log10(1 / Math.max(prior * sens, 1e-12))));
    const f = (x: number) => (pop * x >= 100 ? Math.round(pop * x).toLocaleString('en') : num(pop * x, 3));
    if (!pe) { c.cap.innerHTML = md('**Nobody shows the evidence** (both likelihoods are 0), so $P(H \\mid e)$ is undefined. Raise a slider.'); return; }
    c.cap.innerHTML = md(`**Out of ${pop.toLocaleString('en')} people**, ${f(prior)} have the cause (${h}) and ${f(prior * sens)} of them show the evidence (${e}); ` +
      `of the ${f(1 - prior)} without the cause, ${f((1 - prior) * fpr)} show the evidence anyway. So of the ${f(pe)} people with the evidence, ${f(prior * sens)} have the cause: ` +
      `$P(H \\mid e) = \\frac{P(e \\mid H)\\,P(H)}{P(e)} = \\frac{${num(sens, 3)} \\cdot ${num(prior, 3)}}{${num(pe, 4)}} = ${num(post, 3)}$. ` +
      `The evidence multiplies the prior by $P(e \\mid H) / P(e) = ${num(sens / pe, 3)}$` +
      (post < 0.5 && sens / pe > 2 ? `, yet ${h} stays unlikely: it is so rare that most people with the evidence are false alarms (right panel).` : '.') +
      (tp === 0 && prior > 0 ? ` In the 1000 people on the left, ${h} is too rare for a single dot.` : ''));
  }
  render();
  return { destroy() {} };
}

const CSS = `
.ucb-tp{fill:var(--accent)}
.ucb-fn{fill:none;stroke:var(--accent);stroke-width:1.2}
.ucb-fp{fill:var(--warn)}
.ucb-tn{fill:var(--border-strong)}
.ucb-post{font:600 15px var(--mono);fill:var(--accent)}
`;
