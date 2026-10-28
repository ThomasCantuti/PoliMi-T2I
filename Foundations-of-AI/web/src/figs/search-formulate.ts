// The five components of a search problem (slides p. 62–65), live: pick a problem, apply actions(s) / result(s, a) yourself,
// and watch the goal test and the path cost. The 8-puzzle and jug functions are the ones of search-8puzzle.ts and search-jugs.ts.
import * as P8 from './search-8puzzle';
import * as J from './search-jugs';
import { bar, card, md, s, style, type FigOptions } from './shell';
import { btn, pick } from './search-kit';

interface Prob<S, A> {
  name: string; initial: S; goal: string; actions(s: S): A[]; result(s: S, a: A): S; isGoal(s: S): boolean;
  say(a: A): string; tuple(s: S): string; draw(g: SVGGElement, s: S): void; note: string;
}
/** Hides the state and action types behind closures, so the three problems fit in one array. */
function runner<S, A>(p: Prob<S, A>) {
  const path: { a: A; s: S }[] = [];
  const cur = () => (path.length ? path[path.length - 1].s : p.initial);
  return {
    p: { name: p.name, goal: p.goal, note: p.note },
    reset: () => { path.length = 0; },
    undo: () => { path.pop(); },
    acts: () => p.actions(cur()).map(p.say),
    take: (i: number) => { const a = p.actions(cur())[i]; path.push({ a, s: p.result(cur(), a) }); },
    state: () => p.tuple(cur()),
    isGoal: () => p.isGoal(cur()),
    steps: () => path.map(x => p.say(x.a)),
    draw: (g: SVGGElement) => p.draw(g, cur()),
  };
}

const GOAL8: P8.Tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const puzzle: Prob<P8.Tiles, ReturnType<typeof P8.actions>[number]> = {
  name: '8-puzzle', initial: [1, 2, 3, 4, 8, 5, 0, 7, 6], goal: 's == (1, 2, 3, 4, 5, 6, 7, 8, 0)', note: 'a start 4 moves from the goal, so it can be solved by hand',
  actions: P8.actions, result: P8.result, isGoal: t => t.join() === GOAL8.join(), say: a => a, tuple: t => `(${t.join(', ')})`,
  draw: (g, t) => P8.board(s(g, 'g', { transform: 'translate(36,40) scale(1.25)' }), 0, 0, t, 40),
};
const jugs: Prob<number[], J.Action> = {
  name: 'water jugs (4, 3)', initial: [0, 0], goal: '2 in s', note: 'goal: 2 liters in some jug',
  actions: J.actions, result: J.result, isGoal: st => st.includes(2), say: J.say, tuple: st => `(${st.join(', ')})`,
  draw: (g, st) => [4, 3].forEach((cap, i) => {
    const x = 40 + i * 100, b = 220;
    s(g, 'rect', { x: x + 2, y: b - st[i] * 36, width: 66, height: st[i] * 36, class: 'fmf-water' });
    s(g, 'path', { d: `M${x},${b - cap * 36 - 6} L${x},${b} L${x + 70},${b} L${x + 70},${b - cap * 36 - 6}`, class: 'fmf-glass' });
    s(g, 'text', { x: x + 35, y: b + 20, class: 'fg-m', 'text-anchor': 'middle' }, `jug ${i}: ${st[i]} / ${cap} L`);
  }),
};
const N = 8, safe = (q: number[], r: number) => q.every((row, c) => row !== r && Math.abs(row - r) !== q.length - c);
const queens: Prob<number[], number> = {
  name: '8 queens (incremental)', initial: [], goal: 'len(s) == 8', note: 'a state lists the row of the queen in each filled column',
  actions: q => (q.length < N ? [...Array(N).keys()].filter(r => safe(q, r)) : []), result: (q, r) => [...q, r], isGoal: q => q.length === N,
  say: r => `row ${r}`, tuple: q => `(${q.join(', ')}${q.length === 1 ? ',' : ''})`,
  draw: (g, q) => {
    const C = 25, x0 = 36, y0 = 26;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const free = c === q.length && safe(q, r);
      s(g, 'rect', { x: x0 + c * C, y: y0 + r * C, width: C, height: C, class: (r + c) % 2 ? 'fmf-d' : 'fmf-l' });
      if (free) s(g, 'circle', { cx: x0 + c * C + C / 2, cy: y0 + r * C + C / 2, r: 4, class: 'fmf-dot' });
      if (q[c] === r) s(g, 'text', { x: x0 + c * C + C / 2, y: y0 + r * C + C * 0.74, class: 'fmf-q' }, '♛');
    }
  },
};

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-fmf-css', CSS);
  const c = card(el, 'interactive', 'A search problem is five functions: try them', '0 0 780 270');
  const probs = [runner(puzzle), runner(jugs), runner(queens)];
  let R = probs[0], said = '';
  const pic = s(c.svg, 'g'), RX = 300;
  const rows = ['state s', 'actions(s)', 'goal test', 'step cost c(s, a, s′)', 'path so far', 'path cost g'].map((lab, i) => {
    s(c.svg, 'text', { x: RX, y: 34 + i * 40, class: 'fg-m' }, lab);
    return s(c.svg, 'text', { x: RX, y: 52 + i * 40, class: 'fmf-v' });
  });
  const ctl = bar(c), acts = bar(c);
  pick(ctl, probs.map((r, k) => [String(k), r.p.name]), '0', v => { R = probs[+v]; R.reset(); render(); }, 'Problem');
  btn(ctl, '↶ Undo', () => { R.undo(); render(); });
  btn(ctl, '↺ Reset', () => { R.reset(); render(); });

  function render() {
    pic.replaceChildren();
    R.draw(pic);
    const a = R.acts(), path = R.steps(), goal = R.isGoal();
    rows[0].textContent = R.state();
    rows[1].textContent = a.length ? `{${a.join(', ')}}` : '{ } — no applicable action';
    rows[2].textContent = `${R.p.goal}  →  ${goal}`;
    rows[2].classList.toggle('ok', goal);
    rows[3].textContent = '1 for every action';
    rows[4].textContent = path.length ? (path.length > 4 ? '… ' : '') + path.slice(-4).join(', ') : '(empty: at the initial state)';
    rows[5].textContent = String(path.length);
    acts.replaceChildren();
    const lab = document.createElement('span');
    lab.className = 'fmf-lab';
    lab.textContent = 'apply result(s, a):';
    acts.append(lab);
    a.forEach((name, i) => btn(acts, name, () => { R.take(i); render(); opts.onEvent?.(`[${c.title}] ${R.p.name}: applied ${name}, now s = ${R.state()}${R.isGoal() ? ' (goal)' : ''}`); }));
    const [stage, text] = goal
      ? [`goal${R.p.name}${path.length}`, `<span class="yes">**Goal test true.**</span> The **solution** is the path ${path.join(', ')}: ${path.length} action${path.length === 1 ? '' : 's'}, path cost ${path.length}. ` +
        'The solution is this sequence of actions, not the goal state alone. Undo and look for a cheaper one: the optimal solution is the cheapest path.']
      : !a.length
      ? [`dead${R.p.name}`, `**No action applies** in ${R.state()} and the goal test is false: a dead end. Search would back up to another branch; here, press **Undo**.`]
      : [`p${R.p.name}`, `**${R.p.name}** (${R.p.note}). The buttons are \`actions(s)\`; pressing one computes $s' = $ \`result(s, a)\`, a **successor** of $s$. ` +
        'The goal test and the path cost are recomputed after every action. Together, initial state + actions + result define the state space without ever listing it.'];
    if (stage === said) return;
    said = stage;
    c.cap.innerHTML = md(text);
  }
  render();
  return { destroy() {} };
}

const CSS = `
.fmf-v{font:600 14px var(--mono);fill:var(--text);white-space:pre}
.fmf-v.ok{fill:var(--ok)}
.fmf-water{fill:var(--info);opacity:.55}
.fmf-glass{fill:none;stroke:var(--text-2);stroke-width:2.5}
.fmf-l{fill:var(--panel-2)}
.fmf-d{fill:var(--panel-3)}
.fmf-dot{fill:var(--ok)}
.fmf-q{font-size:18px;fill:var(--text);text-anchor:middle}
.fmf-lab{font-size:12.5px;color:var(--muted)}
`;
