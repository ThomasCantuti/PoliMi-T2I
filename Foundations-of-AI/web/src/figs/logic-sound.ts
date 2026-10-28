// Sound and complete (AIMA §7.3; exams 12 Jul 2024, 8 Jul 2025): for every literal, what the KB entails (truth table) next to what
// three inference procedures derive. A derived but not entailed literal breaks soundness; an entailed one not derived, completeness.
import { box, md, style, type FigOptions } from './shell';
import { ev, models, parse, symbols, symHtml, symTex, type F } from './logic-truth';
import { toCnf } from './logic-cnf';
import { saturate } from './logic-strategies';

const PRESETS: { name: string; kb: string[] }[] = [
  { name: 'Raining ⇒ Wet, Wet', kb: ['Raining ⇒ Wet', 'Wet'] },
  { name: 'exam 14 Jun 2023', kb: ['Swimming ⇒ Wet', 'Raining ∧ Outside ⇒ Wet', 'Warm ∧ ¬Raining ⇒ Pleasant', '¬Wet', 'Outside', 'Warm'] },
  { name: 'forward chaining (AIMA)', kb: ['P ⇒ Q', 'L ∧ M ⇒ P', 'B ∧ L ⇒ M', 'A ∧ P ⇒ L', 'A ∧ B ⇒ L', 'A', 'B'] },
];
const PROCS = [
  { name: 'resolution', how: 'refutation: KB ∧ ¬ℓ ⊢ ⊥' },
  { name: 'forward chaining', how: 'Modus Ponens on the definite clauses' },
  { name: 'affirming the consequent', how: 'from α ⇒ β and β, infer α (with Modus Ponens)' },
];

/** The definite clauses of the KB as rules premises ⇒ conclusion (a fact has no premises). */
const rules = (cls: string[][]) => cls.filter(c => c.filter(l => !l.startsWith('¬')).length === 1)
  .map(c => ({ p: c.filter(l => l.startsWith('¬')).map(l => l.slice(1)), c: c.find(l => !l.startsWith('¬'))! }));
function closure(rs: { p: string[]; c: string }[], backwards: boolean): Set<string> {
  const known = new Set<string>();
  for (let grew = true; grew;) {
    grew = false;
    for (const r of rs) {
      const add = (x: string) => { if (!known.has(x)) { known.add(x); grew = true; } };
      if (r.p.every(x => known.has(x))) add(r.c);
      if (backwards && r.p.length && known.has(r.c)) r.p.forEach(add);
    }
  }
  return known;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lgd-css', CSS);
  const title = 'Sound and complete: what is entailed vs what is derived';
  const root = box(el, 'interactive', title, '<div class="fg-pg lgd-b"><div class="lgd-ps"></div><div class="lgd-kb"></div><div class="lgd-tb"></div></div><div class="fg-c"></div>');
  const kbEl = root.querySelector<HTMLElement>('.lgd-kb')!, tb = root.querySelector<HTMLElement>('.lgd-tb')!, cap = root.querySelector<HTMLElement>('.fg-c')!;
  PRESETS.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = p.name;
    b.onclick = () => { show(i); opts.onEvent?.(`[${title}] KB ${p.name}: ${cap.textContent}`); };
    root.querySelector('.lgd-ps')!.append(b);
  });

  function show(pi: number) {
    root.querySelectorAll('.lgd-ps button').forEach((b, i) => b.classList.toggle('primary', i === pi));
    const fs = PRESETS[pi].kb.map(parse), kb: F = { k: 'and', xs: fs }, syms = symbols(kb).sort();
    const cls = fs.flatMap(f => toCnf(f).clauses), ms = models(syms).filter(m => ev(kb, m));
    const lits = syms.flatMap(p => [p, '¬' + p]), val = (l: string, m: Record<string, boolean>) => (l.startsWith('¬') ? !m[l.slice(1)] : m[l]);
    const html = (l: string) => (l.startsWith('¬') ? '¬' + symHtml(l.slice(1)) : symHtml(l));
    const entailed = new Set(lits.filter(l => ms.every(m => val(l, m))));
    const key = (l: string) => (l.startsWith('¬') ? '¬' + symHtml(l.slice(1)) : symHtml(l)); // the clause literals are HTML
    const res = new Set(lits.filter(l => !!saturate(cls, [[key(l.startsWith('¬') ? l.slice(1) : '¬' + l)]], () => true).empty));
    const plain = (x: string) => x.replace(/<\/?sub>/g, '');
    const fc = new Set([...closure(rules(cls), false)].map(plain)), ac = new Set([...closure(rules(cls), true)].map(plain));
    const derived = [res, fc, ac];
    if ([...entailed].some(l => !res.has(l)) || [...res].some(l => !entailed.has(l))) console.error('logic-sound: resolution and the truth table disagree');
    kbEl.innerHTML = `<b>KB =</b> { ${PRESETS[pi].kb.join(', ')} }`;
    const mark = (d: boolean, e: boolean) => (d && e ? '<td class="y">✓</td>' : d ? '<td class="x">✓ not entailed</td>' : e ? '<td class="m">— missed</td>' : '<td></td>');
    tb.innerHTML = `<table><thead><tr><th>literal</th><th>KB ⊨ ℓ<small>truth table</small></th>${PROCS.map(p => `<th>${p.name}<small>${p.how}</small></th>`).join('')}</tr></thead><tbody>` +
      lits.map(l => `<tr><td class="l">${html(l)}</td><td class="${entailed.has(l) ? 'y' : ''}">${entailed.has(l) ? '✓' : ''}</td>${derived.map(d => mark(d.has(l), entailed.has(l))).join('')}</tr>`).join('') +
      `</tbody><tfoot><tr><td>on this KB</td><td>${ms.length} model${ms.length === 1 ? '' : 's'}</td>${derived.map(d => {
        const unsound = [...d].some(l => !entailed.has(l)), incomplete = [...entailed].some(l => !d.has(l));
        return `<td><span class="${unsound ? 'x' : 'y'}">${unsound ? 'unsound' : 'sound'}</span> · <span class="${incomplete ? 'm' : 'y'}">${incomplete ? 'incomplete' : 'complete'}</span></td>`;
      }).join('')}</tr></tfoot></table>`;
    const tex = (l: string) => `$${l.startsWith('¬') ? '\\neg ' + symTex(l.slice(1)) : symTex(l)}$`;
    const bad = [...ac].filter(l => !entailed.has(l)), miss = [...entailed].filter(l => !fc.has(l)), definite = rules(cls).length === cls.length;
    cap.innerHTML = md(`The KB has **${ms.length}** model${ms.length === 1 ? '' : 's'} over ${syms.length} symbols; a literal is entailed when it holds in all of them. ` +
      '**Resolution** derives exactly the entailed literals: sound and (refutation-)complete. ' +
      (miss.length ? `**Forward chaining** is sound but misses ${miss.map(tex).join(', ')}: ${definite ? 'it only derives positive literals' : 'the KB is not made of definite clauses, so FC has no completeness guarantee here (it skips the other clauses and never derives a negative literal)'}. `
        : `**Forward chaining** derives every entailed literal: the KB is made of definite clauses, where FC is complete. `) +
      (bad.length ? `**Affirming the consequent** derives ${bad.map(tex).join(', ')}, which is **not entailed** (a model of KB makes it false): the rule is unsound. A sound rule never does this, but soundness says nothing about deriving *everything*: that is completeness (exam 12 Jul 2024).`
        : '**Affirming the consequent** happens to derive nothing wrong on this KB, but it is unsound in general: try the first KB.'));
  }
  show(0);
  return { destroy() {} };
}

const CSS = `
.lgd-b{display:flex;flex-direction:column;gap:8px}
.lgd-ps{display:flex;flex-wrap:wrap;gap:5px}
.lgd-kb{font:13px var(--mono);color:var(--text)}
.lgd-kb b{font-family:var(--font);color:var(--muted);font-weight:600}
.lgd-kb sub{font-size:.75em}
.fg .lgd-tb table{display:table;margin:0;border-collapse:collapse;font-size:13px;width:100%}
.fg .lgd-tb th{background:var(--panel-2);color:var(--text);font-weight:600;padding:5px 10px;border:0;border-bottom:1px solid var(--border);text-align:center;vertical-align:bottom}
.fg .lgd-tb th small{display:block;font-weight:400;font-size:11px;color:var(--muted)}
.fg .lgd-tb tr td{padding:3px 10px;border:0;border-bottom:1px solid var(--border);background:transparent;text-align:center;color:var(--text-2)}
.fg .lgd-tb td.l{font-family:var(--mono);color:var(--text);text-align:left;white-space:nowrap}
.fg .lgd-tb tfoot td{font-weight:600;border-bottom:0}
.lgd-tb .y{color:var(--ok)}
.lgd-tb .x{color:var(--bad);font-weight:650}
.lgd-tb .m{color:var(--warn)}
.fg .lgd-tb td.x{background:var(--bad-soft)}
.fg .lgd-tb td.m{background:var(--warn-soft)}
.lgd-tb sub{font-size:.75em}
`;
