// AND-OR search on the erratic vacuum world (AIMA §4.3, Fig. 4.9–4.11; planning.md §11.5): the search runs by itself and
// the contingent plan is assembled as the recursion returns. States numbered as in AIMA Fig. 4.9; Suck is erratic.
import { arrow, bar, card, md, s, style, type FigOptions } from './shell';

type Status = 'open' | 'goal' | 'loop' | 'ok' | 'fail' | 'skip';
type Plan = (string | [number, Plan][])[];
interface OrN { s: number; depth: number; ands: AndN[]; born: number; st: [number, Status][]; plan?: [number, string]; x: number }
interface AndN { act: string; kids: OrN[]; born: number; st: [number, Status][]; x: number }
interface Ev { cap: string; cur: OrN }

// state = 1 + loc + 2·(dirt pattern), loc 0 = left: 1 L dd, 2 R dd, 3 L d-, 4 R d-, 5 L -d, 6 R -d, 7 L --, 8 R --
const enc = (loc: number, dl: boolean, dr: boolean) => 1 + loc + 2 * (dl && dr ? 0 : dl ? 1 : dr ? 2 : 3);
const dec = (s: number) => { const p = (s - 1) >> 1; return { loc: (s - 1) & 1, dl: p < 2, dr: p === 0 || p === 2 }; };
export function results(s: number, a: string): number[] {
  const { loc, dl, dr } = dec(s), d = [dl, dr];
  if (a !== 'Suck') return [enc(a === 'Left' ? 0 : 1, dl, dr)];
  const set = (k: number, v: boolean) => { const e = [...d]; e[k] = v; return enc(loc, e[0], e[1]); };
  const out = d[loc] ? [set(loc, false), enc(loc, false, false)] : [s, set(loc, true)]; // dirty: maybe the other square too; clean: maybe dirt
  return [...new Set(out)];
}
const isGoal = (s: number) => s >= 7;
const fmt = (p: Plan): string => `[${p.map(x => (typeof x === 'string' ? x : x.map(([st, q], i) =>
  i === x.length - 1 ? fmt(q) : `if State = ${st} then ${fmt(q)} else `).join(''))).join(', ')}]`;

const ORDERS = [['Suck', 'Right', 'Left'], ['Left', 'Right', 'Suck']];

/** AND-OR-SEARCH as in AIMA Fig. 4.11, recording the tree and one event per step. */
function trace(start: number, order: string[]) {
  const ev: Ev[] = [], t = () => ev.length;
  const orSearch = (s: number, path: number[], depth: number, n: OrN): Plan | null => {
    const way = [...path].reverse().concat(s).join(' → ');
    if (isGoal(s)) { n.st.push([t(), 'goal']); n.plan = [t(), '[]']; ev.push({ cur: n, cap: `**State ${s} is a goal** (both squares clean): return the empty plan $[\\,]$.` }); return []; }
    if (path.includes(s)) { n.st.push([t(), 'loop']); ev.push({ cur: n, cap: `**State ${s} is already on the path** ${way}: a cycle. Return **failure**: a plan that may come back here is not guaranteed to finish.` }); return null; }
    ev.push({ cur: n, cap: `**OR node, state ${s}** (path ${way}). Not a goal, not on the path: the agent **chooses** an action, so one that works is enough. Try ${order.join(', ')} in this order.` });
    for (const a of order) {
      const out = results(s, a), and: AndN = { act: a, kids: [], born: t(), st: [[t(), 'open']], x: 0 };
      and.kids = out.map(o => ({ s: o, depth: depth + 1, ands: [], born: t(), st: [[t(), 'open']], x: 0 }));
      n.ands.push(and);
      ev.push({ cur: n, cap: `**Try ${a} in state ${s}:** RESULTS(${s}, ${a}) = {${out.join(', ')}}. ` + (out.length > 1
        ? `An **AND node**: nature picks the outcome${a === 'Suck' ? (dec(s)[dec(s).loc ? 'dr' : 'dl'] ? ' (Suck may also clean the other square)' : ' (Suck on a clean square may deposit dirt)') : ''}, so **every** outcome needs a plan.`
        : 'One outcome only.') });
      const sub: [number, Plan][] = [];
      let ok = true;
      for (const k of and.kids) {
        const p = orSearch(k.s, [s, ...path], depth + 1, k);
        if (!p) { ok = false; break; }
        sub.push([k.s, p]);
      }
      if (!ok) {
        and.st.push([t(), 'fail']);
        for (const k of and.kids) if (k.st.length === 1) k.st.push([t(), 'skip']);
        ev.push({ cur: n, cap: `An outcome of ${a} has no plan, so **${a} fails** in state ${s}` + (and.kids.some(k => k.st[1]?.[1] === 'skip') ? ': the remaining outcomes are not even explored.' : '.') });
        continue;
      }
      const plan: Plan = [a, ...(sub.length === 1 ? sub[0][1] : [sub])];
      and.st.push([t(), 'ok']);
      n.st.push([t(), 'ok']);
      n.plan = [t(), fmt(plan)];
      ev.push({ cur: n, cap: `**Every outcome of ${a} is solved**, so state ${s} gets the plan **${fmt(plan)}**` +
        (sub.length > 1 ? `: the $if$ tests the state the agent **observes** after ${a}.` : '.') });
      return plan;
    }
    n.st.push([t(), 'fail']);
    ev.push({ cur: n, cap: `No action works in state ${s}: **failure**.` });
    return null;
  };
  const root: OrN = { s: start, depth: 0, ands: [], born: 0, st: [[0, 'open']], x: 0 };
  ev.push({ cur: root, cap: '' }); // step 0: before the first call
  const plan = orSearch(start, [], 0, root);
  const branches = !!plan && fmt(plan).includes('if');
  ev.push({ cur: root, cap: !plan ? `**No plan from state ${start}.**` : !plan.length ? `**State ${start} is already a goal:** the empty plan.`
    : `**Plan found from state ${start}:** ${fmt(plan)}. ` + (branches
      ? 'A **contingent plan**: it branches on the state the agent perceives, and reaches a clean state **whatever** Suck does. AND-OR search is depth-first and returns the first plan it finds: change the action order and the plan can change.'
      : 'Here every action on the way has a single outcome, so a plain sequence is enough.') });
  let slot = 0;
  const place = (n: OrN): number => {
    if (!n.ands.length) return (n.x = slot++);
    const xs = n.ands.map(a => { const k = a.kids.map(place); return (a.x = (Math.min(...k) + Math.max(...k)) / 2); });
    return (n.x = (Math.min(...xs) + Math.max(...xs)) / 2);
  };
  place(root);
  const all: OrN[] = [], walk = (n: OrN) => { all.push(n); n.ands.forEach(a => a.kids.forEach(walk)); };
  walk(root);
  return { root, all, ev, slots: slot, depth: Math.max(...all.map(n => n.depth)) };
}

const BW = 80, BH = 38, DY = 104, Y0 = 30, W = 780;
const at = <T>(st: [number, T][], k: number) => st.filter(([i]) => i <= k).pop()?.[1];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-plan-andor-css', CSS);
  const runs = ORDERS.flatMap(o => [1, 2, 3, 4, 5, 6, 7, 8].map(s => trace(s, o)));
  if (runs[0].root.plan?.[1] !== '[Suck, if State = 5 then [Right, Suck] else []]') console.error(`plan-andor: plan from state 1 is ${runs[0].root.plan?.[1]}, AIMA Fig. 4.10 gives [Suck, if State = 5 then [Right, Suck] else []]`);
  const H = Y0 + Math.max(...runs.map(r => r.depth)) * DY + BH + 70;
  const c = card(el, 'simulation', 'AND-OR search on the erratic vacuum world: the contingent plan is built as the recursion returns', `0 0 ${W} ${H}`);
  const ah = arrow(c.svg), layer = s(c.svg, 'g');
  const planT = s(c.svg, 'text', { x: 20, y: H - 34, class: 'pla-plan' }), stats = s(c.svg, 'text', { x: 20, y: H - 12, class: 'fg-m' });
  let start = 1, order = 0, run = trace(1, ORDERS[0]), k = 0, playing = false, raf = 0, last = 0;
  let draw: { n: OrN; g: SVGGElement; lab: SVGTextElement }[] = [], ands: { a: AndN; g: SVGGElement }[] = [];

  const ctl = bar(c);
  const mk = (txt: string, on: () => void, cls = 'btn sm') => { const b = document.createElement('button'); b.className = cls; b.textContent = txt; b.onclick = on; ctl.append(b); return b; };
  const play = mk('', () => (playing ? pause() : go()), 'btn sm primary');
  mk('Step', () => { pause(); step(); tell(); });
  mk('↺ Reset', () => { pause(); k = 0; render(); });
  const sel = (html: string, on: (v: number) => void) => { const e = document.createElement('select'); e.innerHTML = html; e.onchange = () => on(+e.value); ctl.append(e); return e; };
  const speed = sel('<option value="1100">slow</option><option value="600" selected>normal</option><option value="200">fast</option>', () => {});
  sel([1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option value="${s}">start: state ${s}</option>`).join(''), v => { start = v; rebuild(); });
  sel(ORDERS.map((o, i) => `<option value="${i}">order ${o.join(', ')}</option>`).join(''), v => { order = v; rebuild(); });
  const tell = () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);

  function rebuild() {
    pause();
    run = runs[order * 8 + start - 1];
    k = 0;
    layer.replaceChildren();
    const sw = Math.min(118, (W - 120) / Math.max(1, run.slots - 1)), x0 = W / 2 - ((run.slots - 1) * sw) / 2;
    const X = (x: number) => x0 + x * sw, Y = (d: number) => Y0 + d * DY;
    ands = [];
    draw = [];
    for (const n of run.all) for (const a of n.ands) {      // edges first: OR → junction (action) → outcomes
      const g = s(layer, 'g', { class: 'pla-and' }), jx = X(a.x), jy = Y(n.depth) + BH + 26;
      s(g, 'line', { x1: X(n.x), y1: Y(n.depth) + BH, x2: jx, y2: jy, class: 'pla-e' });
      s(g, 'text', { x: (X(n.x) + jx) / 2 + 6, y: Y(n.depth) + BH + 16, class: 'pla-act' }, a.act);
      const ends = a.kids.map(kid => {
        const dx = X(kid.x) - jx, dy = Y(kid.depth) - 14 - jy, len = Math.hypot(dx, dy);
        s(g, 'line', { x1: jx, y1: jy, x2: X(kid.x), y2: Y(kid.depth) - 16, class: 'pla-e', 'marker-end': ah });
        return [jx + (dx / len) * 16, jy + (dy / len) * 16];
      });
      if (ends.length > 1) s(g, 'path', { d: `M${ends[0][0]},${ends[0][1]} A16,16 0 0 0 ${ends[ends.length - 1][0]},${ends[ends.length - 1][1]}`, class: 'pla-arc' });
      ands.push({ a, g });
    }
    for (const n of run.all) {
      const x = X(n.x), y = Y(n.depth), g = s(layer, 'g', { class: 'pla-or' }), { loc, dl, dr } = dec(n.s);
      s(g, 'rect', { x: x - BW / 2, y, width: BW, height: BH, rx: 7, class: 'pla-box' });
      [dl, dr].forEach((d, j) => {
        const sx = x - 35 + j * 36;
        s(g, 'rect', { x: sx, y: y + 6, width: 34, height: BH - 12, rx: 3, class: 'pla-sq' });
        if (d) for (const [ox, oy] of [[18, 7], [24, 16], [29, 7]]) s(g, 'circle', { cx: sx + ox, cy: y + 6 + oy, r: 2.6, class: 'pla-dirt' });
        if (j === loc) s(g, 'circle', { cx: sx + 9, cy: y + BH / 2, r: 6, class: 'pla-bot' });
      });
      draw.push({ n, g, lab: s(layer, 'text', { x, y: y - 6, class: 'pla-lab', 'text-anchor': 'middle' }) });
    }
    render();
    tell();
  }

  function step() { if (k < run.ev.length - 1) k++; render(); if (k === run.ev.length - 1) { pause(); tell(); } }
  function go() {
    if (k === run.ev.length - 1) k = 0;
    playing = true;
    last = performance.now();
    const frame = (now: number) => {
      if (now - last >= +speed.value) { last = now; step(); }
      if (playing) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    render();
  }
  function pause() { playing = false; cancelAnimationFrame(raf); render(); }

  function render() {
    const cur = run.ev[k].cur;
    for (const { n, g, lab } of draw) {
      const st = at(n.st, k), plan = n.plan && n.plan[0] <= k ? n.plan[1] : '';
      g.setAttribute('class', `pla-or ${st}${n.born > k ? ' hide' : ''}${n === cur && k < run.ev.length - 1 ? ' cur' : ''}`);
      lab.setAttribute('class', `pla-lab ${st}${n.born > k ? ' hide' : ''}`);
      lab.textContent = `${n.s}` + (st === 'loop' ? ': loop' : st === 'skip' ? ': not explored' : st === 'fail' ? ': failure' : plan ? `: ${plan.length > 22 ? 'plan ✓' : plan}` : '');
    }
    for (const { a, g } of ands) g.setAttribute('class', `pla-and ${at(a.st, k)}${a.born > k ? ' hide' : ''}`);
    const done = k === run.ev.length - 1, rootPlan = run.root.plan && run.root.plan[0] <= k ? run.root.plan[1] : '';
    planT.textContent = rootPlan ? `plan from state ${start}: ${rootPlan}` : done ? 'no plan' : 'plan: …';
    planT.classList.toggle('ok', !!rootPlan);
    const seen = run.all.filter(n => n.born <= k && at(n.st, k) !== 'skip');
    stats.textContent = `step ${k} / ${run.ev.length - 1} · OR nodes visited ${seen.filter(n => run.ev.slice(0, k + 1).some(e => e.cur === n)).length} · ` +
      `loops ${seen.filter(n => at(n.st, k) === 'loop').length} · AND nodes ${ands.filter(x => x.a.born <= k).length}`;
    play.textContent = playing ? '⏸ Pause' : k ? (done ? '⏵ Replay' : '⏵ Continue') : '⏵ Run AND-OR search';
    c.cap.innerHTML = md(k ? run.ev[k].cap : `**Erratic vacuum world:** Suck on a dirty square cleans it and *sometimes* the other square too; on a clean square it *sometimes* deposits dirt. ` +
      `Left and Right are deterministic. No fixed sequence is guaranteed to work, so the agent needs a plan with branches. Press **Run** (start: state ${start}, goal: states 7 and 8).`);
  }
  rebuild();
  return { destroy: () => { playing = false; cancelAnimationFrame(raf); } };
}

const CSS = `
.pla-or,.pla-and,.pla-lab{transition:opacity .3s}
.pla-box{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:stroke .25s,fill .25s}
.pla-or.cur .pla-box{stroke:var(--accent);stroke-width:3}
.pla-or.goal .pla-box,.pla-or.ok .pla-box{stroke:var(--ok);stroke-width:2.5;fill:var(--ok-soft)}
.pla-or.loop .pla-box,.pla-or.fail .pla-box{stroke:var(--bad);stroke-width:2;stroke-dasharray:5 4}
.pla-or.skip{opacity:.35}
.pla-sq{fill:var(--panel);stroke:var(--border)}
.pla-dirt{fill:var(--warn)}
.pla-bot{fill:var(--accent);stroke:var(--panel);stroke-width:1.5}
.pla-lab{font:600 11.5px var(--mono);fill:var(--muted)}
.pla-lab.goal,.pla-lab.ok{fill:var(--ok)}
.pla-lab.loop,.pla-lab.fail{fill:var(--bad)}
.pla-e{stroke:var(--v-edge);stroke-width:1.8;fill:none}
.pla-arc{stroke:var(--text-2);stroke-width:1.8;fill:none}
.pla-and.ok .pla-e{stroke:var(--ok);stroke-width:2.5}
.pla-and.fail .pla-e{stroke:var(--bad);stroke-dasharray:6 4}
.pla-act{font:600 11.5px var(--mono);fill:var(--text)}
.pla-plan{font:600 14px var(--mono);fill:var(--muted)}
.pla-plan.ok{fill:var(--ok)}
`;
