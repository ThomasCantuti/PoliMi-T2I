// Causal, evidential and intercausal reasoning (exam 12 Jul 2024; AIMA §13.1–13.3): click a value to observe it and every
// bar shows P(X = x | evidence), by enumeration over all the full assignments. Student network and burglary network.
import { CPT as BCPT, NAME as BNAME, PARENTS as BPAR } from './bn-burglary';
import { CPT as SCPT, NODE as SNODE, PARENTS as SPAR, type V } from './bn-student';
import { arrow, bar, card, md, num, s, style, type FigOptions } from './shell';

interface Node { id: string; name: string; vals: string[]; parents: string[]; cpt: number[][]; x: number; y: number }
interface Net { label: string; nodes: Node[]; show: number; presets: [string, Record<string, string>][]; checks: [string, Record<string, string>, number][] }
type Ev = Record<string, string>;

const SPOS: Record<V, [number, number]> = { D: [170, 62], K: [560, 62], G: [330, 196], T: [600, 214], L: [330, 340] };
const BPOS: Record<string, [number, number]> = { B: [170, 62], E: [560, 62], A: [365, 190], J: [175, 330], M: [555, 330] };
const NETS: Net[] = [
  { label: 'student network (exam 12 Jul 2024)', show: 1,
    nodes: (Object.keys(SNODE) as V[]).map(v => ({ id: v, name: SNODE[v][2], vals: SNODE[v][3], parents: SPAR[v], cpt: SCPT[v], x: SPOS[v][0], y: SPOS[v][1] })),
    presets: [['causal: P(L | k1)', { K: 'k1' }], ['evidential: g3', { G: 'g3' }], ['intercausal: g3, d1', { G: 'g3', D: 'd1' }], ['intercausal: g3, d0', { G: 'g3', D: 'd0' }]],
    checks: [['L1', {}, 0.36], ['L1', { K: 'k1' }, 0.655], ['k1', { G: 'g3' }, 0.106], ['d1', { G: 'g3' }, 0.958], ['k1', { G: 'g3', D: 'd1' }, 0.109], ['k1', { G: 'g3', D: 'd0' }, 0.028]] },
  { label: 'burglary network (AIMA Fig. 13.2)', show: 0,
    nodes: Object.keys(BPAR).map(k => ({ id: k, name: BNAME[k], vals: [k.toLowerCase(), '¬' + k.toLowerCase()], parents: BPAR[k],
      cpt: BCPT[k].map(p => [p, 1 - p]), x: BPOS[k][0], y: BPOS[k][1] })),
    presets: [['causal: b', { B: 'b' }], ['evidential: a', { A: 'a' }], ['explaining away: a, e', { A: 'a', E: 'e' }], ['j, m (AIMA)', { J: 'j', M: 'm' }]],
    checks: [['b', { A: 'a' }, 0.374], ['b', { A: 'a', E: 'e' }, 0.003], ['b', { J: 'j', M: 'm' }, 0.284]] },
];

/** P(X = x | ev) for every node and value: sum the chain-rule product over every full assignment consistent with ev. */
export function enumerate(nodes: Node[], ev: Ev): Record<string, number[]> {
  const out: Record<string, number[]> = Object.fromEntries(nodes.map(n => [n.id, n.vals.map(() => 0)]));
  const at: Record<string, number> = {}, idx = (id: string) => nodes.find(n => n.id === id)!;
  let z = 0;
  const rec = (i: number, p: number) => {
    if (i === nodes.length) { z += p; for (const n of nodes) out[n.id][at[n.id]] += p; return; }
    const n = nodes[i], row = n.parents.reduce((r, q) => r * idx(q).vals.length + at[q], 0);
    n.vals.forEach((v, k) => { if (ev[n.id] === undefined || ev[n.id] === v) { at[n.id] = k; rec(i + 1, p * n.cpt[row][k]); } });
  };
  rec(0, 1); // the nodes are listed parents first, so every parent is assigned before its children
  for (const id in out) out[id] = out[id].map(x => x / z);
  return out;
}

const W = 190, RH = 20, TW = 84;
/** Three decimals as in the exam solutions; tiny values keep two significant digits. */
const f3 = (x: number) => (x >= 0.01 || x === 0 ? String(+x.toFixed(3)) : num(x, 2));
const tex = (v: string) => v.replace(/^¬/, '\\neg ').replace(/([a-zA-Z])(\d)$/, '$1_$2');

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-bn-reasoning-css', CSS);
  for (const net of NETS) for (const [x, ev, want] of net.checks) {
    const node = net.nodes.find(n => n.vals.includes(x))!, got = enumerate(net.nodes, ev)[node.id][node.vals.indexOf(x)];
    if (Math.round(got * 1000) / 1000 !== want) console.error(`bn-reasoning: P(${x} | ${JSON.stringify(ev)}) = ${got}, uncertainty.md says ${want}`);
  }
  const c = card(el, 'interactive', 'Causal, evidential and intercausal reasoning: observe a value, watch every belief move', '0 0 760 400');
  const ah = arrow(c.svg), layer = s(c.svg, 'g');
  let net = NETS[0], ev: Ev = {}, prior: Record<string, number[]> = {};
  let draw: Record<string, { box: SVGGElement; rows: { g: SVGGElement; fill: SVGRectElement; tick: SVGLineElement; val: SVGTextElement }[] }> = {};

  const ctl = bar(c), pre = bar(c);
  const pick = document.createElement('select');
  pick.innerHTML = NETS.map((n, i) => `<option value="${i}">${n.label}</option>`).join('');
  pick.onchange = () => { net = NETS[+pick.value]; ev = {}; build(); render(); tell(); };
  const clear = document.createElement('button');
  clear.className = 'btn sm';
  clear.textContent = 'Clear evidence';
  clear.onclick = () => { ev = {}; render(); tell(); };
  ctl.append(pick, clear);
  const tell = () => opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);

  const height = (n: Node) => 30 + n.vals.length * RH;
  function build() {
    layer.replaceChildren();
    pre.replaceChildren();
    for (const [label, e] of net.presets) {
      const b = document.createElement('button');
      b.className = 'btn sm';
      b.textContent = label;
      b.onclick = () => { ev = { ...e }; render(); tell(); };
      pre.append(b);
    }
    prior = enumerate(net.nodes, {});
    const byId = Object.fromEntries(net.nodes.map(n => [n.id, n]));
    for (const n of net.nodes) for (const p of n.parents) {     // arrows from box edge to box edge
      const a = byId[p], dx = n.x - a.x, dy = n.y - a.y;
      const t = (m: Node) => Math.min(W / 2 / Math.abs(dx || 1e-9), height(m) / 2 / Math.abs(dy || 1e-9));
      s(layer, 'line', { x1: a.x + dx * t(a), y1: a.y + dy * t(a), x2: n.x - dx * (t(n) + 0.02), y2: n.y - dy * (t(n) + 0.02), class: 'fg-e', 'marker-end': ah });
    }
    draw = {};
    for (const n of net.nodes) {
      const x = n.x - W / 2, y = n.y - height(n) / 2, box = s(layer, 'g', { class: 'ucc-n' });
      s(box, 'rect', { x, y, width: W, height: height(n), rx: 10, class: 'ucc-box' });
      s(box, 'text', { x: n.x, y: y + 17, class: 'ucc-name', 'text-anchor': 'middle' }, n.name);
      const rows = n.vals.map((v, k) => {
        const ry = y + 26 + k * RH, g = s(box, 'g', { class: 'ucc-v', tabindex: 0, role: 'button', 'aria-label': `observe ${n.name} = ${v}` });
        s(g, 'rect', { x: x + 4, y: ry, width: W - 8, height: RH, rx: 5, class: 'ucc-hit' });
        s(g, 'text', { x: x + 12, y: ry + 14, class: 'ucc-lab' }, v);
        s(g, 'rect', { x: x + 46, y: ry + 5, width: TW, height: 10, rx: 3, class: 'ucc-track' });
        const fill = s(g, 'rect', { x: x + 46, y: ry + 5, width: TW, height: 10, rx: 3, class: 'ucc-fill' });
        const tick = s(g, 'line', { x1: x + 46, x2: x + 46, y1: ry + 2, y2: ry + 18, class: 'ucc-tick' });
        const val = s(g, 'text', { x: x + W - 10, y: ry + 14, class: 'ucc-num', 'text-anchor': 'end' });
        const toggle = () => { if (ev[n.id] === v) delete ev[n.id]; else ev[n.id] = v; render(); tell(); };
        g.addEventListener('click', toggle);
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        return { g, fill, tick, val };
      });
      draw[n.id] = { box, rows };
    }
  }

  const anc = (id: string): string[] => net.nodes.find(n => n.id === id)!.parents.flatMap(p => [p, ...anc(p)]);
  const desc = (id: string): string[] => net.nodes.filter(n => n.parents.includes(id)).flatMap(n => [n.id, ...desc(n.id)]);
  /** Which reasoning pattern carries the evidence to X. */
  function pattern(id: string): [string, string | null] {
    const E = Object.keys(ev), up = anc(id), down = desc(id);
    const co = net.nodes.filter(z => z.parents.includes(id) && (E.includes(z.id) || desc(z.id).some(d => E.includes(d))))
      .flatMap(z => z.parents).find(p => p !== id && E.includes(p));
    if (co) return ['intercausal: another cause of the same observed effect', co];
    if (E.every(e => up.includes(e))) return ['causal: from causes down to an effect', null];
    if (E.every(e => down.includes(e))) return ['evidential: from an effect up to its causes', null];
    return ['mixed: up to a common cause and down again', null];
  }

  function render() {
    const post = enumerate(net.nodes, ev);
    for (const n of net.nodes) {
      const obs = ev[n.id] !== undefined;
      draw[n.id].box.setAttribute('class', `ucc-n${obs ? ' obs' : ''}`);
      draw[n.id].rows.forEach((r, k) => {
        r.fill.style.transform = `scaleX(${Math.max(0.005, post[n.id][k])})`;
        const tx = +r.fill.getAttribute('x')! + prior[n.id][k] * TW;
        r.tick.setAttribute('x1', String(tx));
        r.tick.setAttribute('x2', String(tx));
        r.val.textContent = f3(post[n.id][k]);
        r.g.setAttribute('class', `ucc-v${ev[n.id] === n.vals[k] ? ' on' : ''}`);
      });
    }
    const E = Object.keys(ev), evTex = E.map(id => tex(ev[id])).join(', ');
    if (!E.length) {
      c.cap.innerHTML = md('**No evidence:** every bar is a prior marginal, e.g. ' +
        net.nodes.filter(n => n.parents.length).slice(-1).map(n => `$P(${tex(n.vals[net.show])}) = ${f3(prior[n.id][net.show])}$`).join('') +
        ', summed over all the full assignments. **Click a value** to observe it (or pick a preset); the tick on each bar keeps the prior.');
      return;
    }
    const pick = (n: Node) => (n.vals.length === 2 ? net.show : post[n.id].map((p, k) => [Math.abs(p - prior[n.id][k]), k]).sort((a, b) => b[0] - a[0])[0][1]);
    const moved = net.nodes.filter(n => !E.includes(n.id)).map(n => ({ n, k: pick(n), d: Math.max(...post[n.id].map((p, k) => Math.abs(p - prior[n.id][k]))) }))
      .filter(m => m.d > 5e-4).sort((a, b) => +!pattern(a.n.id)[1] - +!pattern(b.n.id)[1] || b.d - a.d).slice(0, 3); // intercausal first
    const lines = moved.map(({ n, k }) => {
      const [kind, co] = pattern(n.id);
      if (!co) return `$P(${tex(n.vals[k])})$: ${f3(prior[n.id][k])} → **${f3(post[n.id][k])}** (${kind})`;
      // intercausal: compare with the evidence without the other cause, on the value the rest of the evidence supports
      const rest = { ...ev };
      delete rest[co];
      const pr = enumerate(net.nodes, rest), restTex = Object.values(rest).map(tex).join(', ');
      const x = pr[n.id].map((p, j) => [p - prior[n.id][j], j]).sort((a, b) => b[0] - a[0])[0][1], v = tex(n.vals[x]), y = tex(ev[co]);
      const yk = net.nodes.find(m => m.id === co)!.vals.indexOf(ev[co]), now = post[n.id][x], before = pr[n.id][x];
      const why = pr[co][yk] > prior[co][yk] && now < before - 5e-4 ? `$${y}$ also explains $${restTex}$, so it **explains away** part of the evidence for $${v}$`
        : pr[co][yk] < prior[co][yk] && now > before + 5e-4 ? `$${y}$ rules out the other explanation, so $${v}$ has to account for $${restTex}$`
        : `once $${restTex}$ is observed the two causes are dependent`;
      return `$P(${v})$: ${f3(prior[n.id][x])} → **${f3(now)}** (${kind}): without $${y}$ it is $P(${v} \\mid ${restTex}) = ${f3(before)}$; ${why}`;
    });
    c.cap.innerHTML = md(`**Evidence** $${evTex}$. Every bar is $P(X = x \\mid ${evTex})$, by enumeration; the tick marks the prior. ` +
      (lines.length ? `Biggest changes: ${lines.join('; ')}.` : 'Nothing else moves: no active trail from the evidence.'));
  }
  build();
  render();
  return { destroy() {} };
}

const CSS = `
.ucc-box{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:stroke .25s}
.ucc-n.obs .ucc-box{stroke:var(--accent);stroke-width:2.5}
.ucc-name{font-size:13px;font-weight:650;fill:var(--text)}
.ucc-v{cursor:pointer}
.ucc-v:focus{outline:none}
.ucc-hit{fill:transparent;transition:fill .2s}
.ucc-v:hover .ucc-hit,.ucc-v:focus-visible .ucc-hit{fill:var(--panel-3)}
.ucc-v.on .ucc-hit{fill:var(--accent-soft);stroke:var(--accent)}
.ucc-lab{font:600 12px var(--mono);fill:var(--text-2)}
.ucc-track{fill:var(--panel-3)}
.ucc-fill{fill:var(--accent);transform-box:fill-box;transform-origin:left;transition:transform .45s cubic-bezier(.2,.7,.2,1)}
.ucc-tick{stroke:var(--warn);stroke-width:2}
.ucc-num{font:600 12px var(--mono);fill:var(--text)}
`;
