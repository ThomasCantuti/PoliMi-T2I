// Horn and definite clauses (AIMA §7.5.3; exams 14 Jun 2023, 14 Jan 2026): type a KB, each sentence is converted to clauses by
// the CNF converter and its positive literals are counted: definite (exactly one), goal (none), not Horn (two or more).
import { box, md, style, type FigOptions } from './shell';
import { parse, show } from './logic-truth';
import { toCnf } from './logic-cnf';

const PRESETS: { name: string; kb: string[] }[] = [
  { name: 'exam 14 Jun 2023', kb: ['Swimming ⇒ Wet', 'Raining ∧ Outside ⇒ Wet', 'Warm ∧ ¬Raining ⇒ Pleasant', '¬Wet', 'Outside', 'Warm'] },
  { name: 'exam 14 Jan 2026', kb: ['X ∨ Y ∨ Z', 'X ∨ Y ∨ ¬Z', 'X ∨ T ∨ ¬Y', '¬T ∨ X', '¬X ∨ Y', '¬Y ∨ ¬Z'] },
  { name: 'forward chaining (AIMA)', kb: ['P ⇒ Q', 'L ∧ M ⇒ P', 'B ∧ L ⇒ M', 'A ∧ P ⇒ L', 'A ∧ B ⇒ L', 'A', 'B'] },
  { name: 'wumpus sentences', kb: ['L1,1 ∧ Breeze ⇒ B1,1', 'W1,1 ∧ P1,1 ⇒ False', '¬W1,1 ∨ ¬P1,1', 'B1,1 ⇔ (P1,2 ∨ P2,1)'] },
];
const KIND = (pos: number) => (pos === 1 ? ['definite', 'ok'] : pos === 0 ? ['goal clause', 'acc'] : ['not Horn', 'bad']);

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lgn-css', CSS);
  const title = 'Horn or not? Count the positive literals of each clause';
  const root = box(el, 'interactive', title, '<div class="fg-pg lgn-b"><div class="lgn-ps"></div>' +
    '<textarea rows="6" spellcheck="false" aria-label="one sentence per line"></textarea><div class="lgn-tb"></div></div><div class="fg-c"></div>');
  const ta = root.querySelector('textarea')!, tb = root.querySelector<HTMLElement>('.lgn-tb')!, cap = root.querySelector<HTMLElement>('.fg-c')!;
  for (const p of PRESETS) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = p.name;
    b.onclick = () => { ta.value = p.kb.join('\n'); render(); opts.onEvent?.(`[${title}] ${p.name}: ${cap.textContent}`); };
    root.querySelector('.lgn-ps')!.append(b);
  }
  ta.value = PRESETS[0].kb.join('\n');

  function render() {
    const rows: string[] = [], kinds: number[] = [];
    let err = '';
    for (const [i, line] of ta.value.split('\n').entries()) {
      if (!line.trim()) continue;
      let f, clauses: string[][];
      try { f = parse(line); clauses = toCnf(f).clauses; } catch (e) { err ||= `line ${i + 1}: ${(e as Error).message}`; continue; }
      // a clause with True is always true (dropped); False adds nothing to a disjunction (removed)
      clauses = clauses.filter(cl => !cl.includes('True')).map(cl => cl.filter(l => l !== 'False'));
      clauses.forEach((cl, j) => {
        const pos = cl.filter(l => !l.startsWith('¬')).length, [k, cls] = KIND(pos);
        kinds.push(pos);
        rows.push(`<tr>${j ? '' : `<td class="s" rowspan="${clauses.length}">${show(f)}</td>`}<td>${cl.map(l => `<span class="${l.startsWith('¬') ? 'n' : 'p'}">${l}</span>`).join(' ∨ ')}</td>` +
          `<td class="c">${pos}</td><td><span class="lgn-k ${cls}">${k}</span></td></tr>`);
      });
    }
    tb.innerHTML = `<table><thead><tr><th>sentence</th><th>clause (positive literals in green)</th><th>positive</th><th>kind</th></tr></thead><tbody>${rows.join('')}</tbody></table>` +
      (err ? `<p class="lgn-err">${err}</p>` : '');
    const bad = kinds.filter(p => p > 1).length, goal = kinds.filter(p => p === 0).length, def = kinds.length - bad - goal;
    cap.innerHTML = md(!kinds.length ? 'Type one sentence per line.' : bad
      ? `**Not a Horn KB:** ${bad} of the ${kinds.length} clauses ${bad > 1 ? 'have' : 'has'} two or more positive literals. Forward and backward chaining do not apply (they need definite clauses); use resolution or DPLL. ` +
        'Typical causes: a negated premise ($A \\wedge \\neg B \\Rightarrow C$ becomes $\\neg A \\vee B \\vee C$, with $B$ positive) or a disjunction in a conclusion or a fact ($B \\Leftrightarrow (P \\vee Q)$ contains $\\neg B \\vee P \\vee Q$).'
      : goal ? `**Horn but not definite:** ${def} definite clause${def === 1 ? '' : 's'} and ${goal} goal clause${goal === 1 ? '' : 's'} (no positive literal, an integrity constraint $\\ldots \\Rightarrow False$). ` +
        'Resolution with the unit or input strategy is complete here; forward and backward chaining work on the definite part.'
      : `**Definite KB:** all ${kinds.length} clauses have exactly one positive literal, so every one reads as $premises \\Rightarrow conclusion$ (a fact has no premise). ` +
        'Forward and backward chaining are sound and complete here, in time linear in the size of the KB.');
  }
  ta.oninput = render;
  ta.onchange = () => opts.onEvent?.(`[${title}] edited the KB: ${cap.textContent}`);
  render();
  return { destroy() {} };
}

const CSS = `
.lgn-b{display:flex;flex-direction:column;gap:8px}
.lgn-ps{display:flex;flex-wrap:wrap;gap:5px}
.lgn-b textarea{font:13px/1.5 var(--mono);resize:vertical}
.fg .lgn-tb table{display:table;margin:0;border-collapse:collapse;font-size:13px;width:100%}
.fg .lgn-tb th{background:var(--panel-2);font-weight:600;color:var(--text);padding:4px 10px;border:0;border-bottom:1px solid var(--border);text-align:left}
.fg .lgn-tb tr td{padding:3px 10px;border:0;border-bottom:1px solid var(--border);background:transparent;font-family:var(--mono);color:var(--text-2)}
.fg .lgn-tb td.s{color:var(--muted)}
.fg .lgn-tb td.c{text-align:center}
.lgn-tb .p{color:var(--ok);font-weight:650}
.lgn-tb .n{color:var(--text-2)}
.lgn-tb sub{font-size:.75em}
.lgn-k{font:600 12px var(--font);padding:1px 8px;border-radius:99px;border:1px solid}
.lgn-k.ok{color:var(--ok);border-color:var(--ok);background:var(--ok-soft)}
.lgn-k.acc{color:var(--accent);border-color:var(--accent);background:var(--accent-soft)}
.lgn-k.bad{color:var(--bad);border-color:var(--bad);background:var(--bad-soft)}
.lgn-err{color:var(--bad);font:12.5px var(--mono);margin:4px 0 0}
`;
