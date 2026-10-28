// CNF conversion (AIMA §7.5.2): a real converter rewrites one subformula at a time (eliminate ⇔, eliminate ⇒, move ¬ inwards,
// distribute ∨ over ∧) and the stepper shows each rewrite with its rule; checked against the exams' clause lists and a truth table.
import { box, md, stepper, style, type Card, type FigOptions, type Frame } from './shell';
import { ev, models, parse, show, symbols, type F } from './logic-truth';

type Rule = { name: string; tex: string; phase: number; apply: (g: F) => F | null };
const clone = (g: F): F => (g.k === 'not' ? { k: 'not', a: clone(g.a) } : g.k === 'and' || g.k === 'or' ? { k: g.k, xs: g.xs.map(clone) }
  : g.k === 'imp' || g.k === 'iff' ? { k: g.k, a: clone(g.a), b: clone(g.b) } : { ...g });
const not = (a: F): F => ({ k: 'not', a });
const RULES: Rule[] = [
  { name: 'biconditional elimination', phase: 1, tex: '\\alpha \\Leftrightarrow \\beta \\;\\equiv\\; (\\alpha \\Rightarrow \\beta) \\wedge (\\beta \\Rightarrow \\alpha)',
    apply: g => (g.k === 'iff' ? { k: 'and', xs: [{ k: 'imp', a: g.a, b: g.b }, { k: 'imp', a: clone(g.b), b: clone(g.a) }] } : null) },
  { name: 'implication elimination', phase: 2, tex: '\\alpha \\Rightarrow \\beta \\;\\equiv\\; \\neg\\alpha \\vee \\beta',
    apply: g => (g.k === 'imp' ? { k: 'or', xs: [not(g.a), g.b] } : null) },
  { name: 'double negation', phase: 3, tex: '\\neg\\neg\\alpha \\;\\equiv\\; \\alpha', apply: g => (g.k === 'not' && g.a.k === 'not' ? g.a.a : null) },
  { name: 'De Morgan', phase: 3, tex: '\\neg(\\alpha \\wedge \\beta) \\;\\equiv\\; \\neg\\alpha \\vee \\neg\\beta',
    apply: g => (g.k === 'not' && g.a.k === 'and' ? { k: 'or', xs: g.a.xs.map(not) } : null) },
  { name: 'De Morgan', phase: 3, tex: '\\neg(\\alpha \\vee \\beta) \\;\\equiv\\; \\neg\\alpha \\wedge \\neg\\beta',
    apply: g => (g.k === 'not' && g.a.k === 'or' ? { k: 'and', xs: g.a.xs.map(not) } : null) },
  { name: 'negated constant', phase: 3, tex: '\\neg True \\equiv False', apply: g => (g.k === 'not' && g.a.k === 'const' ? { k: 'const', v: !g.a.v } : null) },
  { name: 'distributivity of ∨ over ∧', phase: 4, tex: '\\alpha \\vee (\\beta \\wedge \\gamma) \\;\\equiv\\; (\\alpha \\vee \\beta) \\wedge (\\alpha \\vee \\gamma)',
    apply: g => {
      if (g.k !== 'or') return null;
      const j = g.xs.findIndex(x => x.k === 'and'), conj = g.xs[j];
      if (!conj || conj.k !== 'and') return null;
      return { k: 'and', xs: conj.xs.map((c, i) => ({ k: 'or', xs: g.xs.map((x, k) => (k === j ? c : i ? clone(x) : x)) })) };
    } },
];
export const PHASES = ['eliminate ⇔', 'eliminate ⇒', 'move ¬ inwards', 'distribute ∨ over ∧'];

/** Rewrites the first (pre-order) subformula a rule applies to; null if none. */
function rewrite(f: F, rules: Rule[]) {
  const st: { redex?: F; repl?: F; rule?: Rule } = {};
  const go = (g: F): F => {
    if (st.repl) return g;
    for (const r of rules) { const out = r.apply(g); if (out) { Object.assign(st, { redex: g, repl: out, rule: r }); return out; } }
    if (g.k === 'not') { const a = go(g.a); return a === g.a ? g : not(a); }
    if (g.k === 'imp' || g.k === 'iff') { const a = go(g.a), b = go(g.b); return a === g.a && b === g.b ? g : { k: g.k, a, b }; }
    if (g.k === 'and' || g.k === 'or') { const xs = g.xs.map(go); return xs.every((x, i) => x === g.xs[i]) ? g : { k: g.k, xs }; }
    return g;
  };
  const out = go(f);
  return st.repl ? { out, redex: st.redex!, rule: st.rule!, hl: new Set([st.repl]) } : null;
}

/** Flattens ∧ in ∧ and ∨ in ∨; the highlight follows the nodes (a merged node passes it to its children). */
function flat(g: F, hl: Set<F>): F {
  let out = g;
  if (g.k === 'not') { const a = flat(g.a, hl); if (a !== g.a) out = not(a); }
  else if (g.k === 'imp' || g.k === 'iff') { const a = flat(g.a, hl), b = flat(g.b, hl); if (a !== g.a || b !== g.b) out = { k: g.k, a, b }; }
  else if (g.k === 'and' || g.k === 'or') {
    const xs: F[] = [];
    let changed = false;
    for (const x of g.xs) {
      const y = flat(x, hl);
      changed ||= y !== x || y.k === g.k;
      if (y.k === g.k) { xs.push(...y.xs); if (hl.has(y)) y.xs.forEach(z => hl.add(z)); } else xs.push(y);
    }
    if (changed) out = { k: g.k, xs };
  }
  if (out !== g && hl.has(g)) hl.add(out);
  return out;
}

export interface Step { rule: Rule; before: F; redex: F; after: F; hl: Set<F> }
export const lits = (f: F): string[][] => (f.k === 'and' ? f.xs : [f]).map(c => (c.k === 'or' ? c.xs : [c]).map(l => show(l)));

/** All the rewrites from f to CNF, and the clauses (repeated literals removed: factoring). */
export function toCnf(f: F, cap = 120): { steps: Step[]; clauses: string[][]; cut: boolean } {
  const steps: Step[] = [];
  let cur = flat(f, new Set());
  for (let ph = 1; ph <= 4; ph++)
    for (let r = rewrite(cur, RULES.filter(x => x.phase === ph)); r && steps.length < cap; r = rewrite(cur, RULES.filter(x => x.phase === ph))) {
      const after = flat(r.out, r.hl);
      steps.push({ rule: r.rule, before: cur, redex: r.redex, after, hl: r.hl });
      cur = after;
    }
  return { steps, clauses: lits(cur).map(c => [...new Set(c)]), cut: steps.length >= cap };
}

const PRESETS: { name: string; f: string; exam?: string[]; same?: string[] }[] = [
  { name: 'AIMA §7.5.2', f: 'B1,1 ⇔ (P1,2 ∨ P2,1)', exam: ['¬B1,1 ∨ P1,2 ∨ P2,1', '¬P1,2 ∨ B1,1', '¬P2,1 ∨ B1,1'] },
  { name: 'exam 10 Jul 2023', f: 'Lucky ∧ (Smart ∨ Study) ⇒ Pass', exam: ['¬Lucky ∨ ¬Smart ∨ Pass', '¬Lucky ∨ ¬Study ∨ Pass'] },
  { name: 'exam 11 Jun 2026, sentence 4', f: '(¬D ∨ B) ⇒ T', exam: ['D ∨ T', '¬B ∨ T'] },
  { name: 'exam 11 Jun 2026, sentence 2', f: '(S ∧ ¬B) ⇒ D', exam: ['¬S ∨ B ∨ D'], same: ['S ⇒ (D ∨ B)', '(S ⇒ D) ∨ B'] },
  { name: 'blow-up (exam trap)', f: '(A1 ∧ B1) ∨ (A2 ∧ B2) ∨ (A3 ∧ B3)' },
];
const key = (cls: string[][]) => cls.map(c => [...c].sort().join('|')).sort().join(' & ');
const texOf = (s: string) => show(parse(s), true);

interface Fr extends Frame { step?: Step; phase: number; clauses?: string[][] }

function frames(src: string, preset?: (typeof PRESETS)[number]): Fr[] {
  const f = parse(src), { steps, clauses, cut } = toCnf(f), syms = symbols(f);
  if (syms.length <= 12 && cut === false) {
    const cnf: F = parse(clauses.map(c => `(${c.join(' ∨ ').replace(/<\/?sub>/g, '')})`).join(' ∧ '));
    if (models(syms).some(m => ev(cnf, m) !== ev(f, m))) console.error(`logic-cnf: CNF of ${src} is not equivalent to it`);
  }
  const plain = clauses.map(c => c.map(l => l.replace(/<\/?sub>/g, '')));
  if (preset?.exam && key(plain) !== key(preset.exam.map(c => c.split(' ∨ ')))) console.error(`logic-cnf: ${preset.name} gives ${key(plain)}, the exam ${preset.exam.join(' ∧ ')}`);
  const out: Fr[] = [{ phase: 0, group: 'start', cap: `**Start:** $${show(f, true)}$. Four phases, each repeated until it no longer applies: ` +
    PHASES.map((p, i) => `**${i + 1}** ${p}`).join(', ') + '. Each step below rewrites one subformula (amber) into an equivalent one (green).' }];
  let last = 0;
  steps.forEach((st, i) => {
    const skipped = PHASES.slice(last, st.rule.phase - 1);
    const note = skipped.length ? ` (Nothing to do for ${skipped.map(p => `“${p}”`).join(', ')}.)` : '';
    last = st.rule.phase;
    const r = st.redex;
    const bind = r.k === 'iff' || r.k === 'imp' ? `with $\\alpha = ${show(r.a, true)}$, $\\beta = ${show(r.b, true)}$`
      : r.k === 'or' ? (() => { const j = r.xs.findIndex(x => x.k === 'and'); const rest = r.xs.filter((_, k) => k !== j);
        return `with $\\alpha = ${rest.map(x => show(x, true)).join(' \\vee ')}$ and the conjunction $${show(r.xs[j], true)}$: each conjunct becomes a clause with its own copy of $\\alpha$`; })()
      : r.k === 'not' && (r.a.k === 'and' || r.a.k === 'or') ? `on $${show(r, true)}$: the $\\neg$ moves onto each of the ${r.a.xs.length} parts and the connective flips` : `on $${show(r, true)}$`;
    out.push({ step: st, phase: st.rule.phase, group: PHASES[st.rule.phase - 1],
      cap: `**Step ${i + 1} · ${st.rule.name}** $${st.rule.tex}$, ${bind}.${note}` });
  });
  const same = preset?.same?.filter(s => key(toCnf(parse(s)).clauses) === key(clauses)) ?? [];
  if (preset?.same && same.length !== preset.same.length) console.error(`logic-cnf: ${preset.name}: not all forms give the same CNF`);
  out.push({ phase: 5, clauses, group: 'CNF', cap: cut ? `**Stopped after ${steps.length} rewrites**: distribution keeps multiplying clauses. Try a smaller formula.`
    : `**CNF: ${clauses.length} clause${clauses.length > 1 ? 's' : ''}**, one per line as the exam wants them, joined by $\\wedge$; each is a disjunction of literals.` +
      (last < 4 ? ` (Nothing to do for ${PHASES.slice(last).map(p => `“${p}”`).join(', ')}.)` : '') +
      (preset === PRESETS[4] ? ` Three conjunctions of 2 give $2^3 = ${clauses.length}$ clauses: distribution can blow up exponentially.` : '') +
      (same.length ? ` ${same.map(s => `$${texOf(s)}$`).join(' and ')} give the **same** clause: that is why the three forms are equivalent.` : '') });
  return out;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lgc-css', CSS);
  const title = 'CNF conversion, one rewrite at a time';
  let src = PRESETS[0].f, inst: { destroy(): void } | null = null, root: HTMLElement | null = null;
  function build(focus = false) {
    inst?.destroy();
    root?.remove();
    const preset = PRESETS.find(p => p.f === src);
    let fr: Fr[];
    try { fr = frames(src, preset); } catch (e) { fr = [{ phase: 0, cap: `**Cannot parse:** ${(e as Error).message}. Use ¬ ∧ ∨ ⇒ ⇔ (or ~ & | => <=>) and parentheses.` }]; }
    root = box(el, 'stepper', title, '<div class="fg-pg lgc-b"><div class="lgc-ph"></div><div class="lgc-rule"></div><div class="lgc-f"></div><div class="lgc-f2"></div></div><div class="fg-c"></div>');
    const c: Card = { root, svg: document.createElementNS('http://www.w3.org/2000/svg', 'svg'), cap: root.querySelector('.fg-c')!, title };
    const ctl = document.createElement('div');
    ctl.className = 'fg-bar';
    ctl.innerHTML = `<select>${PRESETS.map((p, i) => `<option value="${i}">${p.name}</option>`).join('')}<option value="-1">your formula</option></select>` +
      '<input type="text" class="lgc-in" spellcheck="false"><button class="btn sm">convert</button>';
    root.insertBefore(ctl, c.cap);
    const sel = ctl.querySelector('select')!, inp = ctl.querySelector('input')!, go = ctl.querySelector('button')!;
    sel.value = String(preset ? PRESETS.indexOf(preset) : -1);
    inp.value = src;
    sel.onchange = () => { if (+sel.value >= 0) { src = PRESETS[+sel.value].f; build(); opts.onEvent?.(`[${title}] ${PRESETS[+sel.value].name}: ${src}`); } };
    const run = () => { src = inp.value; build(true); opts.onEvent?.(`[${title}] converting ${src}`); };
    go.onclick = run;
    inp.onkeydown = e => { if (e.key === 'Enter') run(); };
    if (focus) inp.focus();
    const ph = root.querySelector<HTMLElement>('.lgc-ph')!, rule = root.querySelector<HTMLElement>('.lgc-rule')!;
    const f1 = root.querySelector<HTMLElement>('.lgc-f')!, f2 = root.querySelector<HTMLElement>('.lgc-f2')!;
    const startF = (() => { try { return parse(src); } catch { return null; } })();
    inst = stepper(c, fr, f => {
      ph.innerHTML = [...PHASES, 'CNF'].map((p, i) => `<span class="${i + 1 === f.phase ? 'now' : i + 1 < f.phase ? 'done' : ''}">${i < 4 ? `${i + 1} ` : ''}${p}</span>`).join('');
      const st = f.step;
      rule.innerHTML = st ? `<b>${st.rule.name}</b> ${md(`$${st.rule.tex}$`)}` : '';
      if (st) {
        f1.innerHTML = show(st.before, false, new Set([st.redex]), s => `<span class="lgc-old">${s}</span>`);
        f2.innerHTML = '<i>≡</i> ' + show(st.after, false, st.hl, s => `<span class="lgc-new">${s}</span>`);
      } else if (f.clauses) {
        f1.innerHTML = `<ol>${f.clauses.map(cl => `<li>${cl.join(' ∨ ')}</li>`).join('')}</ol>`;
        f2.innerHTML = '';
      } else {
        f1.innerHTML = startF ? show(startF) : '';
        f2.innerHTML = '';
      }
    }, opts);
  }
  build();
  return { destroy: () => inst?.destroy() };
}

const CSS = `
.lgc-b{display:flex;flex-direction:column;gap:10px;min-height:190px}
.lgc-ph{display:flex;flex-wrap:wrap;gap:6px}
.lgc-ph span{font-size:12px;padding:2px 10px;border-radius:99px;border:1px solid var(--border);color:var(--muted)}
.lgc-ph span.done{color:var(--text-2);border-color:var(--border-strong)}
.lgc-ph span.now{color:var(--accent);background:var(--accent-soft);border-color:var(--accent);font-weight:650}
.lgc-rule{font-size:13px;color:var(--text-2);min-height:22px}
.lgc-rule b{color:var(--text);margin-right:8px}
.lgc-f,.lgc-f2{font:15px/1.9 var(--mono);color:var(--text);overflow-wrap:anywhere}
.lgc-f2 i{font-style:normal;color:var(--muted);margin-right:4px}
.lgc-f sub,.lgc-f2 sub{font-size:.7em}
.lgc-old{background:var(--warn-soft);box-shadow:inset 0 -2px var(--warn);border-radius:3px}
.lgc-new{background:var(--ok-soft);box-shadow:inset 0 -2px var(--ok);border-radius:3px}
.lgc-f ol{margin:0;padding-left:2em}
.lgc-in{flex:1;min-width:220px;font:13px var(--mono)}
`;
