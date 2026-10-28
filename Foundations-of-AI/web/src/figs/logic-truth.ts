// Live truth table (AIMA §7.4.4, §7.5.1, Fig. 7.9): type α (and a KB), every model is evaluated; valid / satisfiable /
// unsatisfiable, KB ⊨ α, and the deduction and refutation theorems as columns. Also exports the parser the other logic figures use.
import { box, md, style, type FigOptions } from './shell';

export type F = { k: 'sym'; n: string } | { k: 'const'; v: boolean } | { k: 'not'; a: F }
  | { k: 'and' | 'or'; xs: F[] } | { k: 'imp' | 'iff'; a: F; b: F };
export type Model = Record<string, boolean>;

const OPS: [RegExp, string][] = [
  [/^(<=>|<->|⇔|↔)/, 'iff'], [/^(=>|->|⇒|→)/, 'imp'], [/^(¬|~|!)/, 'not'], [/^(∧|&&?|\^)/, 'and'], [/^(∨|\|\|?)/, 'or'],
  [/^\(/, '('], [/^\)/, ')'], [/^(⊤|True\b|true\b)/, 'T'], [/^(⊥|False\b|false\b)/, 'F'], [/^[A-Za-z]+(?:_?\d+(?:,\d+)*)?/, 'sym'],
];

/** Parses ¬ ∧ ∨ ⇒ ⇔ (or ~ & | => <=>) with the usual precedence; ⇒ is right-associative. Throws on a syntax error. */
export function parse(src: string): F {
  const toks: [string, string][] = [];
  for (let s = src.trim(); s; s = s.trimStart()) {
    const hit = OPS.map(([re, k]) => [re.exec(s), k] as const).find(([m]) => m);
    if (!hit) throw new Error(`unexpected “${s[0]}”`);
    const text = hit[0]![0];
    toks.push([hit[1], text.replace('_', '')]);
    s = s.slice(text.length);
  }
  let i = 0;
  const peek = () => toks[i]?.[0], need = (k: string) => { if (peek() !== k) throw new Error(i < toks.length ? `unexpected “${toks[i][1]}”` : 'unexpected end'); i++; };
  const nary = (k: 'and' | 'or', sub: () => F): F => { const xs = [sub()]; while (peek() === k) { i++; xs.push(sub()); } return xs.length > 1 ? { k, xs } : xs[0]; };
  const unary = (): F => {
    const t = peek();
    if (t === 'not') { i++; return { k: 'not', a: unary() }; }
    if (t === '(') { i++; const f = iff(); need(')'); return f; }
    if (t === 'T' || t === 'F') { i++; return { k: 'const', v: t === 'T' }; }
    if (t === 'sym') return { k: 'sym', n: toks[i++][1] };
    throw new Error(t ? `unexpected “${toks[i][1]}”` : 'unexpected end');
  };
  const and = () => nary('and', unary), or = () => nary('or', and);
  const imp = (): F => { const a = or(); if (peek() !== 'imp') return a; i++; return { k: 'imp', a, b: imp() }; };
  const iff = (): F => { let a = imp(); while (peek() === 'iff') { i++; a = { k: 'iff', a, b: imp() }; } return a; };
  if (!toks.length) throw new Error('empty formula');
  const f = iff();
  if (i < toks.length) throw new Error(`unexpected “${toks[i][1]}”`);
  return f;
}

export function symbols(f: F, out: string[] = []): string[] {
  if (f.k === 'sym') { if (!out.includes(f.n)) out.push(f.n); }
  else if (f.k === 'not') symbols(f.a, out);
  else if (f.k === 'and' || f.k === 'or') f.xs.forEach(x => symbols(x, out));
  else if (f.k === 'imp' || f.k === 'iff') { symbols(f.a, out); symbols(f.b, out); }
  return out;
}

export function ev(f: F, m: Model): boolean {
  switch (f.k) {
    case 'sym': return m[f.n];
    case 'const': return f.v;
    case 'not': return !ev(f.a, m);
    case 'and': return f.xs.every(x => ev(x, m));
    case 'or': return f.xs.some(x => ev(x, m));
    case 'imp': return !ev(f.a, m) || ev(f.b, m);
    case 'iff': return ev(f.a, m) === ev(f.b, m);
  }
}

/** All 2ⁿ models, first symbol slowest, false before true (the order of AIMA's truth tables). */
export const models = (syms: string[]): Model[] =>
  Array.from({ length: 2 ** syms.length }, (_, r) => Object.fromEntries(syms.map((p, j) => [p, !!((r >> (syms.length - 1 - j)) & 1)])));

const SUBS = /^([A-Za-z]+)(\d.*)?$/;
const GLYPH = { and: ' ∧ ', or: ' ∨ ', imp: ' ⇒ ', iff: ' ⇔ ' }, TEX = { and: ' \\wedge ', or: ' \\vee ', imp: ' \\Rightarrow ', iff: ' \\Leftrightarrow ' };
/** A symbol for HTML (P1,2 → P<sub>1,2</sub>) or TeX (P_{1,2}). */
export const symHtml = (n: string) => { const [, a, d] = SUBS.exec(n) ?? [, n]; return d ? `${a}<sub>${d}</sub>` : a ?? n; };
export const symTex = (n: string) => { const [, a, d] = SUBS.exec(n) ?? [, n]; return d ? `${a}_{${d}}` : `\\mathit{${a}}`; };

/** Prints f with parentheses around every binary child of another connective (as the course writes it);
 *  nodes in `hl` are wrapped by `mark` (HTML highlighting). */
export function show(f: F, tex = false, hl: Set<F> = new Set(), mark = (s: string) => s): string {
  const go = (g: F, parent?: F): string => {
    let s: string;
    if (g.k === 'sym') s = tex ? symTex(g.n) : symHtml(g.n);
    else if (g.k === 'const') s = tex ? (g.v ? '\\top' : '\\bot') : g.v ? 'True' : 'False';
    else if (g.k === 'not') s = (tex ? '\\neg ' : '¬') + go(g.a, g);
    else {
      const parts = 'xs' in g ? g.xs : [g.a, g.b];
      s = parts.map(x => go(x, g)).join((tex ? TEX : GLYPH)[g.k]);
      const binary = g.k !== 'and' && g.k !== 'or';
      if (parent && (parent.k === 'not' || parent.k !== g.k || binary)) s = `(${s})`;
    }
    return hl.has(g) ? mark(s) : s;
  };
  return go(f);
}

const PRESETS: { name: string; a: string; kb?: string }[] = [
  { name: 'P ∨ ¬P', a: 'P ∨ ¬P' },
  { name: 'P ∧ ¬P', a: 'P ∧ ¬P' },
  { name: 'P ⇒ Q', a: 'P ⇒ Q' },
  { name: 'contraposition', a: '¬Q ⇒ ¬P', kb: 'P ⇒ Q' },
  { name: '“unless” (11 Jun 2026)', a: '(S ∧ ¬B) ⇒ D', kb: 'S ⇒ (D ∨ B)' },
  { name: 'wumpus R₁–R₅ (Fig. 7.9)', a: '¬P1,2', kb: '¬P1,1 ∧ (B1,1 ⇔ (P1,2 ∨ P2,1)) ∧ (B2,1 ⇔ (P1,1 ∨ P2,2 ∨ P3,1)) ∧ ¬B1,1 ∧ B2,1' },
  { name: 'resolution example (14 Jul 2022)', a: 'R', kb: 'P ∧ (P ∧ Q ⇒ R) ∧ (S ∨ T ⇒ Q) ∧ T' },
  { name: 'inconsistent KB (8 Jul 2025)', a: 'Q', kb: 'A ∧ ¬A' },
  { name: '14 Jan 2026', a: '¬Z ⇒ ¬Y', kb: '(X ∨ Y ∨ Z) ∧ (X ∨ Y ∨ ¬Z) ∧ (X ∨ T ∨ ¬Y) ∧ (¬T ∨ X) ∧ (¬X ∨ Y) ∧ (¬Y ∨ ¬Z)' },
];
const MAX = 8; // 256 rows

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lgt-css', CSS);
  const title = 'Truth table: valid, satisfiable, unsatisfiable, and KB ⊨ α';
  const root = box(el, 'interactive', title,
    '<div class="fg-pg lgt-in"><label><b>α</b><input type="text" spellcheck="false"></label>' +
    '<label><b>KB</b><input type="text" spellcheck="false" placeholder="optional: a KB, to test KB ⊨ α"></label>' +
    '<div class="lgt-ps"></div><div class="lgt-v"></div><label class="lgt-only"><input type="checkbox" checked> only the rows where KB is true</label>' +
    '<div class="lgt-tb"></div></div><div class="fg-c"></div>');
  const [ina, inkb] = root.querySelectorAll<HTMLInputElement>('.lgt-in > label > input');
  const only = root.querySelector<HTMLInputElement>('.lgt-only input')!, onlyRow = root.querySelector<HTMLElement>('.lgt-only')!;
  const verdict = root.querySelector<HTMLElement>('.lgt-v')!, tb = root.querySelector<HTMLElement>('.lgt-tb')!, cap = root.querySelector<HTMLElement>('.fg-c')!;
  for (const p of PRESETS) {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = p.name;
    b.onclick = () => { ina.value = p.a; inkb.value = p.kb ?? ''; render(); opts.onEvent?.(`[${title}] preset ${p.name}: ${cap.textContent}`); };
    root.querySelector('.lgt-ps')!.append(b);
  }
  ina.value = PRESETS[2].a;

  function render() {
    let a: F, kb: F | null;
    try {
      a = parse(ina.value);
      kb = inkb.value.trim() ? parse(inkb.value) : null;
    } catch (e) {
      verdict.innerHTML = `<span class="lgt-err">${(e as Error).message}</span>`;
      return;
    }
    const syms = symbols(a, kb ? symbols(kb) : []);
    if (syms.length > MAX) { verdict.innerHTML = `<span class="lgt-err">${syms.length} symbols: at most ${MAX} (${2 ** MAX} rows)</span>`; return; }
    const ms = models(syms), va = ms.map(m => ev(a, m)), vk = ms.map(m => (kb ? ev(kb, m) : true));
    const na = va.filter(Boolean).length, N = ms.length, nk = vk.filter(Boolean).length;
    const counter = ms.findIndex((_, r) => vk[r] && !va[r]), entailed = counter < 0;
    const aTex = show(a, true), kTex = kb ? 'KB' : '';
    if (kb && inkb.value === PRESETS[5].kb && nk !== 3) console.error(`logic-truth: wumpus KB has ${nk} models, AIMA Fig. 7.9 has 3`);

    const word = na === N ? 'valid' : na ? 'satisfiable' : 'unsatisfiable';
    const chips = [`<span class="lgt-chip ${na === N ? 'ok' : na ? 'acc' : 'bad'}">α is ${word}</span> <span>true in ${na} of ${N} models</span>`];
    if (kb) {
      chips.push(`<span class="lgt-chip ${nk ? 'acc' : 'bad'}">KB ${nk ? 'satisfiable' : 'unsatisfiable'}</span> <span>${nk} of ${N}</span>`,
        `<span class="lgt-chip ${entailed ? 'ok' : 'bad'}">KB ${entailed ? '⊨' : '⊭'} α</span>`);
      if (entailed && ms.every((_, r) => va[r] === vk[r])) chips.push('<span class="lgt-chip ok">KB ≡ α</span>');
    }
    verdict.innerHTML = chips.join('<span class="lgt-gap"></span>');

    onlyRow.style.display = kb && N > 16 ? '' : 'none';
    const rows = ms.map((_, r) => r).filter(r => !(kb && N > 16 && only.checked) || vk[r]);
    const tf = (v: boolean) => `<td class="${v ? 't' : 'f'}">${v ? 'T' : 'F'}</td>`;
    const head = syms.map(p => `<th>${symHtml(p)}</th>`).join('') + (kb ? '<th class="sep">KB</th>' : '') + `<th class="sep">α</th>` +
      (kb ? '<th class="sep">KB ⇒ α</th><th>KB ∧ ¬α</th>' : '<th class="sep">¬α</th>');
    tb.innerHTML = `<table><thead><tr><th>#</th>${head}</tr></thead><tbody>` + rows.map(r => {
      const cls = kb ? (vk[r] ? (va[r] ? 'kb ok' : 'kb bad') : 'out') : va[r] ? 'ok' : '';
      return `<tr class="${cls}"><td class="n">${r + 1}</td>${syms.map(p => tf(ms[r][p])).join('')}` +
        (kb ? `<td class="sep ${vk[r] ? 't' : 'f'}">${vk[r] ? 'T' : 'F'}</td>` : '') + `<td class="sep ${va[r] ? 't' : 'f'}"><b>${va[r] ? 'T' : 'F'}</b></td>` +
        (kb ? `<td class="sep ${!vk[r] || va[r] ? 't' : 'f'}">${!vk[r] || va[r] ? 'T' : 'F'}</td>${tf(vk[r] && !va[r])}` : `<td class="sep ${va[r] ? 'f' : 't'}">${va[r] ? 'F' : 'T'}</td>`) + '</tr>';
    }).join('') + '</tbody></table>' + (rows.length < N ? `<p class="lgt-more">${N - rows.length} rows where KB is false not shown: there α may be anything.</p>` : '');

    let text: string;
    if (!kb) text = `$\\alpha = ${aTex}$ is **${word}**: true in ${na} of the ${N} models (the lit rows). ` +
      (na === N ? 'Valid means $\\neg\\alpha$ is unsatisfiable: its column is all F.' : na ? `It is not valid: row ${va.indexOf(false) + 1} makes it false.` :
        'No row makes it true, so $\\neg\\alpha$ is valid.') + ' Add a KB to test entailment.';
    else if (!nk) text = `The KB has **no model**: no row survives, so $KB \\models \\alpha$ holds **vacuously** for every $\\alpha$ (the "KB ⇒ α" column is all T). An inconsistent KB entails everything.`;
    else if (entailed) text = `KB is true in **${nk} of ${N}** rows (lit), and $\\alpha = ${aTex}$ is true in **${nk === 2 ? 'both' : `all ${nk}`}**: $${kTex} \\models \\alpha$. ` +
      'The same fact twice: the column **KB ⇒ α** is all T (deduction theorem: the implication is valid) and **KB ∧ ¬α** is all F (refutation theorem: unsatisfiable). ' +
      (ms.every((_, r) => va[r] === vk[r]) ? 'Here α has exactly the same models as KB, so the two are **equivalent**: each entails the other.' :
        na === N ? 'α is valid, so any KB entails it.' : `α has more models (${na}) than KB (${nk}): KB is the stronger sentence.`);
    else text = `KB is true in **${nk} of ${N}** rows (lit), and row **${counter + 1}** is one of them with α false (red): a counterexample, so $${kTex} \\not\\models \\alpha$. ` +
      (vk.every((v, r) => !v || !va[r]) ? `In fact α is false in **every** model of KB, so $KB \\models \\neg\\alpha$: $KB \\wedge \\alpha$ is unsatisfiable, yet that does not give $KB \\models \\alpha$ (exam 14 Jan 2026).` :
        `Other models of KB do make α true, so KB entails neither α nor $\\neg\\alpha$: the KB cannot decide it.`);
    cap.innerHTML = md(text);
  }
  for (const inp of [ina, inkb]) {
    inp.oninput = render;
    inp.onchange = () => opts.onEvent?.(`[${title}] α = ${ina.value}${inkb.value ? `, KB = ${inkb.value}` : ''}: ${cap.textContent}`);
  }
  only.onchange = render;
  render();
  return { destroy() {} };
}

const CSS = `
.lgt-in{display:flex;flex-direction:column;gap:8px}
.lgt-in>label{display:flex;align-items:center;gap:8px}
.lgt-in>label>b{font:600 14px var(--mono);width:24px;color:var(--text)}
.lgt-in>label>input{flex:1;font:14px var(--mono)}
.lgt-ps{display:flex;flex-wrap:wrap;gap:5px}
.lgt-v{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:13px;color:var(--text-2);min-height:24px}
.lgt-gap{width:10px}
.lgt-chip{font-weight:650;padding:2px 9px;border-radius:99px;border:1px solid}
.lgt-chip.ok{color:var(--ok);background:var(--ok-soft);border-color:var(--ok)}
.lgt-chip.bad{color:var(--bad);background:var(--bad-soft);border-color:var(--bad)}
.lgt-chip.acc{color:var(--accent);background:var(--accent-soft);border-color:var(--accent)}
.lgt-err{color:var(--bad);font:13px var(--mono)}
.lgt-only{font-size:12.5px;color:var(--text-2);display:flex;align-items:center;gap:6px}
.lgt-in>label.lgt-only>input{flex:none;accent-color:var(--accent)}
.lgt-tb{max-height:320px;overflow:auto;width:fit-content;max-width:100%;border:1px solid var(--border);border-radius:8px}
.fg .lgt-tb table{display:table;margin:0;border-collapse:collapse;font:12.5px var(--mono)}
.fg .lgt-tb th{position:sticky;top:0;z-index:1;background:var(--panel-2);color:var(--text);font-weight:600;padding:4px 8px;border:0;border-bottom:1px solid var(--border);white-space:nowrap;text-align:center}
.fg .lgt-tb tr td{padding:2px 12px;border:0;text-align:center;color:var(--muted);background:transparent}
.fg .lgt-tb td.t{color:var(--text)}
.fg .lgt-tb td.n{color:var(--muted);font-size:11px}
.fg .lgt-tb th.sep,.fg .lgt-tb td.sep{border-left:1px solid var(--border)}
.fg .lgt-tb tr.ok td{background:var(--ok-soft)}
.fg .lgt-tb tr.kb td{background:var(--accent-soft)}
.fg .lgt-tb tr.kb.bad td{background:var(--bad-soft)}
.fg .lgt-tb tr.out td{opacity:.5}
.lgt-tb sub{font-size:.75em}
.lgt-more{margin:6px 10px;font-size:12px;color:var(--muted)}
`;
