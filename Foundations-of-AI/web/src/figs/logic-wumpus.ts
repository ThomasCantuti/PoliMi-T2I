// The wumpus world (AIMA §7.2, Fig. 7.2–7.4) run by a knowledge-based agent: at each step it TELLs its percept and ASKs, for every
// square, whether KB ⊨ ¬P ∧ ¬W, by model checking computed live; it only walks into squares proved safe.
import { bar, card, label, md, s, style, type FigOptions } from './shell';
import { ev, models, parse } from './logic-truth';

const N = 4, C = 72, X0 = 34, Y0 = 14, HOME = 0, PX = 350;
const X = (i: number) => (i % N) + 1, Y = (i: number) => Math.floor(i / N) + 1;
const at = (x: number, y: number) => x - 1 + (y - 1) * N, nm = (i: number) => `[${X(i)},${Y(i)}]`;
const NB: number[][] = Array.from({ length: N * N }, (_, i) =>
  [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([dx, dy]) => [X(i) + dx, Y(i) + dy]).filter(([x, y]) => x >= 1 && x <= N && y >= 1 && y <= N).map(([x, y]) => at(x, y)));
interface World { pits: number[]; wumpus: number; gold: number }
const AIMA: World = { pits: [at(3, 1), at(3, 3), at(4, 4)], wumpus: at(1, 3), gold: at(2, 3) };
type Tri = 'yes' | 'no' | '?';
interface Know { pit: Tri[]; wum: Tri[]; pitModels: number; wModels: number; fringe: number[] }

/** Model checking over the symbols the KB mentions: the pits of the unvisited squares next to a visited one (2^|fringe|
 *  assignments) and the wumpus square (exactly one). Pits and wumpus are independent, so the models are their product. */
export function ask(seen: Map<number, { b: boolean; s: boolean }>): Know {
  const fringe = [...new Set([...seen.keys()].flatMap(v => NB[v]))].filter(c => !seen.has(c));
  const pitCount = new Array<number>(N * N).fill(0), wCount = new Array<number>(N * N).fill(0);
  let pitModels = 0, wModels = 0;
  for (let mask = 0; mask < 1 << fringe.length; mask++) {
    const pit = (c: number) => { const k = fringe.indexOf(c); return k >= 0 && !!(mask >> k & 1); };
    if (![...seen].every(([v, p]) => p.b === NB[v].some(pit))) continue;
    pitModels++;
    fringe.forEach(c => { if (pit(c)) pitCount[c]++; });
  }
  for (let w = 0; w < N * N; w++) {
    if (seen.has(w) || ![...seen].every(([v, p]) => p.s === NB[v].includes(w))) continue;
    wModels++;
    wCount[w]++;
  }
  const tri = (n: number, of: number): Tri => (n === 0 ? 'no' : n === of ? 'yes' : '?');
  const all = Array.from({ length: N * N }, (_, c) => c);
  return { pit: all.map(c => (seen.has(c) ? 'no' : fringe.includes(c) ? tri(pitCount[c], pitModels) : '?')),
    wum: all.map(c => (seen.has(c) ? 'no' : tri(wCount[c], wModels))), pitModels, wModels, fringe };
}

/** Independent check of the pit verdicts: the breeze part of the KB as a sentence, entailment by a full truth table. */
function check(seen: Map<number, { b: boolean; s: boolean }>, k: Know) {
  const syms = new Set<number>([...seen.keys()].flatMap(v => [v, ...NB[v]]));
  if (syms.size + seen.size > 14) return;
  const P = (c: number) => `P${X(c)},${Y(c)}`, kb = parse([...seen].map(([v, p]) =>
    `¬${P(v)} ∧ (B${X(v)},${Y(v)} ⇔ (${NB[v].map(P).join(' ∨ ')})) ∧ ${p.b ? '' : '¬'}B${X(v)},${Y(v)}`).join(' ∧ '));
  const ms = models([...syms].map(P).concat([...seen.keys()].map(v => `B${X(v)},${Y(v)}`))).filter(m => ev(kb, m));
  for (const c of syms) {
    const tt: Tri = ms.every(m => m[P(c)]) ? 'yes' : ms.every(m => !m[P(c)]) ? 'no' : '?';
    if (tt !== k.pit[c]) console.error(`logic-wumpus: pit in ${nm(c)}: truth table says ${tt}, model checking ${k.pit[c]}`);
  }
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-lgw-css', CSS);
  const c = card(el, 'simulation', 'The wumpus world: a knowledge-based agent moves only where KB ⊨ safe', '0 0 780 340');
  let world = AIMA, pos = HOME, t = 0, gold = false, alive = true, out = false, stuck = false, reveal = true;
  let running = false, timer = 0, said = '', news = '', lastTell = '', lastAct = '';
  const seen = new Map<number, { b: boolean; s: boolean }>();
  let know: Know = ask(seen);
  const firsts = new Set<string>();

  // the grid: one group per square (KB status fill, label, percepts, verdict, the real world underneath)
  const sq = Array.from({ length: N * N }, (_, i) => {
    const x = X0 + (X(i) - 1) * C, y = Y0 + (N - Y(i)) * C, g = s(c.svg, 'g', { class: 'lgw-sq' });
    const r = s(g, 'rect', { x: x + 1, y: y + 1, width: C - 2, height: C - 2, rx: 6 });
    s(g, 'text', { x: x + 6, y: y + 14, class: 'lgw-id' }, `${X(i)},${Y(i)}`);
    const pitG = s(g, 'circle', { cx: x + C / 2, cy: y + C / 2 - 2, r: 14, class: 'lgw-pit' });
    const wG = s(g, 'text', { x: x + C / 2, y: y + C / 2 + 6, class: 'lgw-w' }, 'W');
    const gG = s(g, 'path', { d: `M${x + C - 16},${y + 8} l7,7 l-7,7 l-7,-7 z`, class: 'lgw-gold' });
    const per = s(g, 'text', { x: x + C - 6, y: y + C - 8, class: 'lgw-per' });
    const v = s(g, 'text', { x: x + C / 2, y: y + C - 9, class: 'lgw-v' });
    g.onclick = () => manual(i);
    return { g, r, pitG, wG, gG, per, v };
  });
  for (let k = 1; k <= N; k++) {
    s(c.svg, 'text', { x: X0 + (k - 0.5) * C, y: Y0 + N * C + 14, class: 'fg-m', 'text-anchor': 'middle' }, `x = ${k}`);
    s(c.svg, 'text', { x: X0 - 8, y: Y0 + (N - k + 0.5) * C + 4, class: 'fg-m', 'text-anchor': 'end' }, `${k}`);
  }
  const trail = s(c.svg, 'polyline', { class: 'lgw-trail' });
  const agent = s(c.svg, 'g', { class: 'lgw-ag' });
  s(agent, 'circle', { r: 12 });
  s(agent, 'text', { y: 4.5 }, 'A');
  const path: number[] = [HOME];

  // right: what happened at this step, the TELL, the ASK and its verdicts
  const head = s(c.svg, 'text', { x: PX, y: 30, class: 'fg-h2' });
  const lines = Array.from({ length: 8 }, () => s(c.svg, 'g'));
  const LEG: [string, string, number][] = [['vis', 'visited', 0], ['safe', 'proved safe', 75], ['bad', 'proved pit or wumpus', 175], ['unk', 'undecided', 325]];
  LEG.forEach(([k, t, dx]) => {
    const x = PX + dx;
    s(c.svg, 'rect', { x, y: 300, width: 14, height: 14, rx: 3, class: `lgw-sw ${k}` });
    s(c.svg, 'text', { x: x + 20, y: 311, class: 'fg-m' }, t);
  });
  s(c.svg, 'text', { x: PX, y: 333, class: 'fg-m' }, 'B breeze, S stench, G glitter · click a neighbour to move there');

  const ctl = bar(c);
  const run = document.createElement('button');
  run.className = 'btn sm primary';
  run.onclick = () => (running ? pause() : play());
  const stepB = document.createElement('button');
  stepB.className = 'btn sm';
  stepB.textContent = 'Step';
  stepB.onclick = () => { pause(); step(); };
  const reset = document.createElement('button');
  reset.className = 'btn sm';
  reset.textContent = '↺ Reset';
  reset.onclick = () => { pause(); restart(); opts.onEvent?.(`[${c.title}] reset`); };
  const ws = document.createElement('select');
  ws.innerHTML = '<option value="aima">AIMA Fig. 7.2 world</option><option value="rand">a random world</option>';
  ws.onchange = () => { pause(); world = ws.value === 'aima' ? AIMA : random(); restart(); opts.onEvent?.(`[${c.title}] world: ${ws.selectedOptions[0].text}`); };
  const again = document.createElement('button');
  again.className = 'btn sm';
  again.textContent = 'new random world';
  again.onclick = () => { pause(); ws.value = 'rand'; world = random(); restart(); opts.onEvent?.(`[${c.title}] new random world`); };
  const rv = document.createElement('label');
  rv.className = 'fg-sl';
  rv.innerHTML = '<input type="checkbox" checked style="width:auto"> show the real world';
  rv.querySelector('input')!.onchange = e => { reveal = (e.target as HTMLInputElement).checked; render(); };
  ctl.append(run, stepB, reset, ws, again, rv);

  function random(): World {
    const cells = Array.from({ length: N * N - 1 }, (_, k) => k + 1), pits = cells.filter(() => Math.random() < 0.2);
    const free = cells.filter(k => !pits.includes(k));
    return { pits, wumpus: cells[Math.floor(Math.random() * cells.length)], gold: free[Math.floor(Math.random() * free.length)] ?? cells[0] };
  }
  function restart() {
    pos = HOME; t = 0; gold = out = stuck = false; alive = true; news = said = ''; lastAct = 'start in [1,1]';
    seen.clear(); firsts.clear(); path.length = 0; path.push(HOME);
    perceive();
    render();
  }
  /** TELL the percept of the current square, then ASK about every square. */
  function perceive() {
    const b = NB[pos].some(n => world.pits.includes(n)), st = NB[pos].includes(world.wumpus), gl = pos === world.gold && !gold;
    const fresh = !seen.has(pos);
    seen.set(pos, { b, s: st });
    const p = `${X(pos)},${Y(pos)}`;
    lastTell = `TELL  ${st ? '' : '¬'}S_{${p}} ∧ ${b ? '' : '¬'}B_{${p}}${gl ? ` ∧ G_{${p}}` : ''}`;
    know = ask(seen);
    check(seen, know);
    if (world === AIMA && seen.size === 3 && [at(1, 1), at(2, 1), at(1, 2)].every(v => seen.has(v)) &&
      (know.wum[at(1, 3)] !== 'yes' || know.pit[at(3, 1)] !== 'yes' || !safe(at(2, 2))))
      console.error('logic-wumpus: after [1,1], [2,1], [1,2] AIMA §7.2 proves W1,3, P3,1 and [2,2] safe');
    if (!fresh) return;
    const pits = know.pit.flatMap((k, i) => (k === 'yes' && !firsts.has(`p${i}`) ? [i] : [])), wum = know.wum.indexOf('yes');
    pits.forEach(i => firsts.add(`p${i}`));
    if (gl) news = 'gold';
    else if (wum >= 0 && !firsts.has('w')) { firsts.add('w'); news = `wumpus:${wum}:${pits.join(',')}`; }
    else if (pits.length) news = `pit:${pits.join(',')}`;
    else if ((b || st) && !firsts.has('undecided')) { firsts.add('undecided'); news = `undecided:${b ? 'B' : 'S'}`; }
  }
  const safe = (i: number) => know.pit[i] === 'no' && know.wum[i] === 'no';
  const bad = (i: number) => know.pit[i] === 'yes' || know.wum[i] === 'yes';
  /** Shortest route through squares known to be safe to the closest target (ties: lowest y, then lowest x). */
  function route(targets: number[]): number[] | null {
    const prev = new Map<number, number>([[pos, -1]]), dist = new Map([[pos, 0]]), q = [pos];
    while (q.length) {
      const u = q.shift()!;
      for (const v of NB[u]) if (!prev.has(v) && safe(v)) { prev.set(v, u); dist.set(v, dist.get(u)! + 1); q.push(v); }
    }
    const goal = targets.filter(g => g !== pos && dist.has(g)).sort((a, b) => dist.get(a)! - dist.get(b)! || a - b)[0];
    if (goal === undefined) return null;
    const p = [goal];
    while (prev.get(p[0]) !== pos) p.unshift(prev.get(p[0])!);
    return p;
  }
  function moveTo(i: number) {
    pos = i;
    t++;
    path.push(i);
    if (world.pits.includes(i) || world.wumpus === i) { alive = false; lastAct = `Forward → ${nm(i)}: ${world.wumpus === i ? 'eaten by the wumpus' : 'fell into a pit'}`; news = `dead:${world.wumpus === i ? 'was eaten by the wumpus' : 'fell into a pit'}`; return; }
    lastAct = `Forward → ${nm(i)}`;
    perceive();
  }
  function step() {
    if (!alive || out) return;
    if (pos === world.gold && !gold) { gold = true; t++; lastAct = 'Grab: the agent has the gold'; news = 'grab'; render(); return; }
    if (pos === HOME && (gold || stuck)) { out = true; t++; lastAct = 'Climb out of the cave'; news = gold ? 'home' : 'out'; render(); return; }
    const targets = gold || stuck ? [HOME] : know.pit.flatMap((_, i) => (!seen.has(i) && safe(i) ? [i] : []));
    let r = targets.length ? route(targets) : null;
    if (!r && !gold && !stuck) { stuck = true; news = 'stuck'; r = pos === HOME ? null : route([HOME]); }
    if (r) moveTo(r[0]);
    else if (pos === HOME) { out = true; t++; lastAct = 'Climb out of the cave'; news = 'out'; }
    render();
  }
  function manual(i: number) {
    if (!alive || out || !NB[pos].includes(i)) return;
    pause();
    const risky = !safe(i);
    moveTo(i);
    if (alive && risky) news = `lucky:${i}`;
    render();
    opts.onEvent?.(`[${c.title}] you moved the agent to ${nm(i)}${risky ? ' (not proved safe)' : ''}: ${lastAct}`);
  }
  function play() {
    if (running || !alive || out) return;
    running = true;
    timer = window.setInterval(() => { step(); if (!alive || out) pause(); }, 800);
    render();
  }
  function pause() { running = false; clearInterval(timer); render(); }

  const list = (f: (i: number) => boolean) => know.pit.flatMap((_, i) => (f(i) ? [nm(i)] : [])).join(' ') || '–';
  function render() {
    for (let i = 0; i < N * N; i++) {
      const q = sq[i], vis = seen.has(i), no = bad(i);
      q.r.setAttribute('class', vis ? 'vis' : no ? 'bad' : safe(i) ? 'safe' : 'unk');
      q.g.classList.toggle('lgw-near', alive && !out && NB[pos].includes(i));
      q.pitG.classList.toggle('hide', !(reveal && world.pits.includes(i)));
      q.wG.classList.toggle('hide', !(reveal && world.wumpus === i));
      q.gG.classList.toggle('hide', !(reveal || vis) || world.gold !== i || gold);
      const p = seen.get(i);
      q.per.textContent = p ? `${p.b ? 'B' : ''}${p.s ? 'S' : ''}${i === world.gold && !gold ? 'G' : ''}` : '';
      q.v.textContent = vis ? '' : no ? (know.wum[i] === 'yes' ? 'W!' : 'P!') : safe(i) ? 'OK' : [know.pit[i] === '?' ? 'P?' : '', know.wum[i] === '?' ? 'W?' : ''].join(' ').trim();
      q.v.setAttribute('class', `lgw-v ${vis ? '' : no ? 'bad' : safe(i) ? 'safe' : 'unk'}`);
    }
    const cx = (i: number) => X0 + (X(i) - 0.5) * C, cy = (i: number) => Y0 + (N - Y(i) + 0.5) * C;
    agent.setAttribute('transform', `translate(${cx(pos)},${cy(pos) - 2})`);
    agent.classList.toggle('dead', !alive);
    agent.classList.toggle('hide', out);
    trail.setAttribute('points', path.map(i => `${cx(i)},${cy(i) - 2}`).join(' '));
    const f = know.fringe, undecided = know.pit.flatMap((_, i) => (!seen.has(i) && !safe(i) && !bad(i) ? [i] : []));
    head.textContent = `t = ${t} · ${!alive ? 'dead' : out ? 'out of the cave' : `agent in ${nm(pos)}`}${gold ? ' · has the gold' : ''}`;
    const p = seen.get(pos);
    const L = [
      `last action: ${lastAct}`,
      alive && !out ? `percept: ${p?.s ? 'stench' : 'no stench'}, ${p?.b ? 'breeze' : 'no breeze'}${pos === world.gold && !gold ? ', glitter' : ''}` : '',
      alive && !out ? lastTell : '',
      `ASK for every square: KB ⊨ ¬P ∧ ¬W ?`,
      `models: ${know.pitModels} pit assignment${know.pitModels > 1 ? 's' : ''} of the ${f.length} fringe squares × ${know.wModels} wumpus square${know.wModels > 1 ? 's' : ''}`,
      `proved safe, not visited: ${list(i => !seen.has(i) && safe(i))}`,
      `proved pit: ${list(i => know.pit[i] === 'yes')} · proved wumpus: ${list(i => know.wum[i] === 'yes')}`,
      `undecided (grey): ${undecided.length > 7 ? `${undecided.length} squares` : undecided.map(nm).join(' ') || '–'}`,
    ];
    lines.forEach((g, j) => { g.textContent = ''; label(g, PX, 58 + j * 22, L[j], { class: j === 4 ? 'fg-m' : 'fg-t' }); });
    run.textContent = running ? '⏸ Pause' : t ? '⏵ Continue' : '⏵ Run';
    run.disabled = stepB.disabled = !alive || out;
    explain();
  }

  // the caption follows the story of the run and changes only when something new is learned
  function explain() {
    const [kind, a, b] = news.split(':'), sq2 = (ix: string) => ix.split(',').filter(Boolean).map(i => nm(+i)).join(' and ');
    const unk = know.pit.flatMap((_, i) => (!seen.has(i) && !safe(i) && !bad(i) ? [nm(i)] : []));
    const key = t ? news : 'start', p0 = seen.get(HOME)!, ok0 = list(i => !seen.has(i) && safe(i));
    const text = !t ? `**t = 0.** The agent is in [1,1] and its KB holds only the rules: a square is breezy iff a neighbour has a pit, smelly iff a neighbour has the wumpus, there is exactly one wumpus. ` +
        `It TELLs its percept and ASKs, for every square, whether $KB \\models \\neg P \\wedge \\neg W$. In [1,1] it perceives ${p0.b ? 'a breeze' : 'no breeze'} and ${p0.s ? 'a stench' : 'no stench'}, so ` +
        (ok0 !== '–' ? `${ok0} are **proved safe** (green).` : 'no neighbour can be proved safe.') + ' Press **Run** or **Step**.'
      : !news ? ''
      : kind === 'undecided' ? `**${a === 'B' ? 'A breeze' : 'A stench'} in ${nm(pos)}.** ${a === 'B' ? 'Some neighbour has a pit' : 'Some neighbour has the wumpus'}, but the KB has models where it is one and models where it is the other: it entails the disjunction and neither square. ` +
        `Those squares stay **undecided** (grey, P? / W?), and the agent will not enter them: it goes to the next square proved safe.`
      : kind === 'wumpus' ? `**Wumpus located in ${nm(+a)}** (red): in every model of the KB the wumpus is there, so $KB \\models W_{${X(+a)},${Y(+a)}}$. ` +
        (b ? `In the same step the KB proves a pit in ${sq2(b)}. ` : '') + 'This is the chain of AIMA §7.2: a stench with no breeze, combined with what the earlier squares ruled out. New squares become safe.'
      : kind === 'pit' ? `**Pit proved in ${sq2(a)}**: every model of the KB has it. A breeze is now explained, so the other neighbours of that breezy square may become safe.`
      : kind === 'gold' ? `**Glitter in ${nm(pos)}**: the gold is here. Next step: Grab, then plan the way back to [1,1] through squares already proved safe.`
      : kind === 'grab' ? `**Grabbed the gold** (action ${t}). The way home only uses visited squares, so it is safe by construction.`
      : kind === 'home' ? `**Out of the cave with the gold** after ${t} actions, never entering a square the KB had not proved safe. ${unk.length ? `${unk.length} squares are still undecided (${unk.join(' ')}): the KB never needed them.` : ''}`
      : kind === 'stuck' ? `**No unvisited square is proved safe** and the gold is not found. Undecided: ${unk.join(' ') || '–'}. Logic says only what holds in **every** model; here it cannot tell, so this agent goes home. ` +
        'AIMA\'s hybrid agent would now gamble on a square not proved unsafe; how likely a pit is there is a question for probability (Uncertainty chapter).'
      : kind === 'out' ? `**Climbed out without the gold** after ${t} action${t === 1 ? '' : 's'}: no unvisited square was left that the KB could prove safe. Try another random world, or click a neighbouring square to take the risk yourself.`
      : kind === 'lucky' ? `**You moved into ${nm(+a)}, which the KB had not proved safe**, and survived: luck, not inference. The KB had models with a pit or the wumpus there.`
      : `**Dead in ${nm(pos)}**: the agent ${a}. The KB had not proved that square safe: in some of its models there was a pit or the wumpus.`;
    if (!text || key === said) return;
    said = key;
    c.cap.innerHTML = md(text);
    if (t) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }

  restart();
  return { destroy: pause };
}

const CSS = `
.lgw-sq rect{stroke:var(--border);stroke-width:1.5;transition:fill .3s,stroke .3s}
.lgw-sq rect.vis{fill:var(--panel-3)}
.lgw-sq rect.safe{fill:var(--ok-soft);stroke:var(--ok)}
.lgw-sq rect.bad{fill:var(--bad-soft);stroke:var(--bad)}
.lgw-sq rect.unk{fill:var(--panel-2)}
.lgw-sq.lgw-near{cursor:pointer}
.lgw-sq.lgw-near rect{stroke-dasharray:5 3;stroke:var(--accent)}
.lgw-id{font-size:10px;fill:var(--muted)}
.lgw-pit{fill:none;stroke:var(--text-2);stroke-width:1.5;stroke-dasharray:3 3;opacity:.7}
.lgw-w{font:700 22px var(--font);fill:var(--v-min);text-anchor:middle;opacity:.55}
.lgw-gold{fill:var(--warn);opacity:.85}
.lgw-per{font:700 12px var(--mono);fill:var(--info);text-anchor:end}
.lgw-v{font:700 12px var(--mono);text-anchor:middle;fill:var(--muted)}
.lgw-v.safe{fill:var(--ok)}
.lgw-v.bad{fill:var(--bad)}
.lgw-sw.vis{fill:var(--panel-3);stroke:var(--border)}
.lgw-sw.safe{fill:var(--ok-soft);stroke:var(--ok)}
.lgw-sw.bad{fill:var(--bad-soft);stroke:var(--bad)}
.lgw-sw.unk{fill:var(--panel-2);stroke:var(--border)}
.lgw-ag{transition:transform .35s ease;pointer-events:none}
.lgw-ag circle{fill:var(--accent);stroke:var(--panel);stroke-width:2}
.lgw-ag text{font:700 12px var(--font);fill:#fff;text-anchor:middle}
.lgw-ag.dead circle{fill:var(--bad)}
.lgw-trail{fill:none;stroke:var(--accent);stroke-width:2;stroke-dasharray:2 5;opacity:.6;pointer-events:none}
`;
