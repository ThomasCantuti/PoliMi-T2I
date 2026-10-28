// Quantifiers on a finite model (AIMA §8.2, Fig. 8.2: Richard, John, their left legs, the crown): ∀ needs every object, ∃ one;
// toggle the relations and the four sentences of logic.md (and their common mistakes) are re-evaluated object by object.
import { box, md, style, type FigOptions } from './shell';

const OBJ = ['Richard', 'John', 'the crown', 'Richard’s left leg', 'John’s left leg'];
const REL = ['King(x)', 'Person(x)', 'Crown(x)', 'OnHead(x, John)'];
const AIMA = [[false, true, false, false], [true, true, false, false], [false, false, true, true], [false, false, false, false], [false, false, false, false]];
type Row = boolean[];
const SENT: { q: '∀' | '∃'; text: string; tex: string; body: (r: Row) => boolean; right: boolean }[] = [
  { q: '∀', text: '∀x King(x) ⇒ Person(x)', tex: '\\forall x\\ \\mathit{King}(x) \\Rightarrow \\mathit{Person}(x)', body: r => !r[0] || r[1], right: true },
  { q: '∀', text: '∀x King(x) ∧ Person(x)', tex: '\\forall x\\ \\mathit{King}(x) \\wedge \\mathit{Person}(x)', body: r => r[0] && r[1], right: false },
  { q: '∃', text: '∃x Crown(x) ∧ OnHead(x, John)', tex: '\\exists x\\ \\mathit{Crown}(x) \\wedge \\mathit{OnHead}(x, \\mathit{John})', body: r => r[2] && r[3], right: true },
  { q: '∃', text: '∃x Crown(x) ⇒ OnHead(x, John)', tex: '\\exists x\\ \\mathit{Crown}(x) \\Rightarrow \\mathit{OnHead}(x, \\mathit{John})', body: r => !r[2] || r[3], right: false },
];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lgf-css', CSS);
  const title = 'Quantifiers on a model: ∀ goes with ⇒, ∃ with ∧';
  const root = box(el, 'interactive', title, '<div class="fg-pg lgf-b"><div class="lgf-tb"></div><button class="btn sm">↺ AIMA Fig. 8.2</button></div><div class="fg-c"></div>');
  const tb = root.querySelector<HTMLElement>('.lgf-tb')!, cap = root.querySelector<HTMLElement>('.fg-c')!;
  const m = AIMA.map(r => [...r]);
  root.querySelector('button')!.onclick = () => { AIMA.forEach((r, i) => { m[i] = [...r]; }); render(); opts.onEvent?.(`[${title}] back to the AIMA model: ${cap.textContent}`); };

  function render() {
    const vals = SENT.map(st => m.map(st.body)), truth = SENT.map((st, k) => (st.q === '∀' ? vals[k].every(Boolean) : vals[k].some(Boolean)));
    tb.innerHTML = `<table><thead><tr><th>object x</th>${REL.map(r => `<th class="r">${r}</th>`).join('')}${SENT.map((st, k) =>
      `<th class="s ${st.right ? '' : 'w'}">${st.text}<small>${st.right ? 'the right way' : 'the common mistake'}</small></th>`).join('')}</tr></thead><tbody>` +
      m.map((row, i) => `<tr><td class="o">${OBJ[i]}</td>${row.map((v, j) => `<td class="r"><input type="checkbox" data-i="${i}" data-j="${j}"${v ? ' checked' : ''} aria-label="${REL[j].replace('x', OBJ[i])}"></td>`).join('')}` +
        SENT.map((_, k) => `<td class="${vals[k][i] ? 't' : 'f'}">${vals[k][i] ? 'T' : 'F'}</td>`).join('') + '</tr>').join('') +
      `</tbody><tfoot><tr><td colspan="${REL.length + 1}">the sentence (∀: every row T; ∃: some row T)</td>${truth.map(v => `<td class="${v ? 't' : 'f'}">${v ? 'true' : 'false'}</td>`).join('')}</tr></tfoot></table>`;
    tb.querySelectorAll<HTMLInputElement>('input').forEach(inp => {
      inp.onchange = () => { m[+inp.dataset.i!][+inp.dataset.j!] = inp.checked; render(); opts.onEvent?.(`[${title}] ${inp.getAttribute('aria-label')} = ${inp.checked}: ${cap.textContent}`); };
    });
    const who = (k: number, v: boolean) => OBJ.filter((_, i) => vals[k][i] === v);
    const crowns = OBJ.filter((_, i) => m[i][2]);
    const parts = [
      `$${SENT[0].tex}$ is **${truth[0]}**: ${truth[0] ? `every row is T; the ${m.filter(r => !r[0]).length} objects that are not kings make it true vacuously` : `${who(0, false).join(', ')} ${who(0, false).length > 1 ? 'are kings but not persons' : 'is a king but not a person'}`}.`,
      `The mistake $${SENT[1].tex}$ is **${truth[1]}**${truth[1] ? '' : `: it claims that everything is a king and a person, and ${who(1, false)[0]} is not`}.`,
      `$${SENT[2].tex}$ is **${truth[2]}**${truth[2] ? ` (witness: ${who(2, true).join(', ')})` : ': no crown is on John’s head'}.`,
      `The mistake $${SENT[3].tex}$ is **${truth[3]}**` + (truth[3] ? (who(3, true).some(o => !crowns.includes(o)) ? `, but only because ${who(3, true).filter(o => !crowns.includes(o))[0]} is not a crown: the implication is true for any non-crown, so it says almost nothing.` : '.') : '.'),
    ];
    cap.innerHTML = md(parts.join(' ') + ' Click the boxes to change the model.');
  }
  render();
  return { destroy() {} };
}

const CSS = `
.lgf-b{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.lgf-tb{max-width:100%;overflow-x:auto}
.fg .lgf-tb table{display:table;margin:0;border-collapse:collapse;font-size:12.5px;word-break:normal;overflow-wrap:normal}
.fg .lgf-tb th{background:var(--panel-2);color:var(--text);font-weight:600;padding:5px 5px;border:0;border-bottom:1px solid var(--border);text-align:center;vertical-align:bottom;font-family:var(--mono);font-size:11.5px}
.fg .lgf-tb th small{display:block;font:400 11px var(--font);color:var(--muted)}
.fg .lgf-tb th.s{border-left:1px solid var(--border)}
.fg .lgf-tb th.w{color:var(--warn)}
.fg .lgf-tb tr td{padding:3px 5px;border:0;border-bottom:1px solid var(--border);background:transparent;text-align:center;font-family:var(--mono);color:var(--muted)}
.fg .lgf-tb td.o{text-align:left;font-family:var(--font);color:var(--text)}
.fg .lgf-tb td.t{color:var(--ok);font-weight:650}
.fg .lgf-tb td.f{color:var(--bad)}
.fg .lgf-tb tfoot td{font-family:var(--font);font-weight:600;border-bottom:0;color:var(--text-2)}
.lgf-tb input{accent-color:var(--accent)}
`;
