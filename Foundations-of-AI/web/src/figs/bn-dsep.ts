// d-separation on the burglary network: click a node to observe it. Same rule as is_active() in uncertainty.md.
import { NAME, net, PARENTS, POS } from './bn-burglary';
import { card, md, type FigOptions } from './shell';

export function descendants(parents: Record<string, string[]>, x: string): string[] {
  const kids = Object.keys(parents).filter(k => parents[k].includes(x));
  return [...kids, ...kids.flatMap(k => descendants(parents, k))];
}

export function isActive(parents: Record<string, string[]>, trail: string[], ev: Set<string>): boolean {
  if (ev.has(trail[0]) || ev.has(trail[trail.length - 1])) return false;
  for (let i = 1; i < trail.length - 1; i++) {
    const [a, b, c] = trail.slice(i - 1, i + 2);
    if (parents[b].includes(a) && parents[b].includes(c)) {
      if (!ev.has(b) && !descendants(parents, b).some(d => ev.has(d))) return false;
    } else if (ev.has(b)) return false;
  }
  return true;
}

const QUESTIONS = [['B', 'A', 'E'], ['J', 'A', 'M'], ['B', 'A', 'J']];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  const c = card(el, 'interactive', 'd-separation on the burglary network: click a node to observe it', '0 0 720 330');
  const { nodes, edges } = net(c.svg, c.svg, POS);
  const bar = document.createElement('div');
  bar.className = 'fg-bar';
  bar.innerHTML = '<span class="fg-m" style="font-size:12.5px">Question:</span>';
  c.root.insertBefore(bar, c.cap);
  const ev = new Set<string>();
  let q = 0;
  const qb = QUESTIONS.map(([x, , z], i) => {
    const b = document.createElement('button');
    b.className = 'btn sm';
    b.textContent = `${NAME[x]} ⫫ ${NAME[z]}?`;
    b.onclick = () => { q = i; render(); };
    bar.append(b);
    return b;
  });
  const clear = document.createElement('button');
  clear.className = 'btn sm';
  clear.textContent = 'Clear evidence';
  clear.onclick = () => { ev.clear(); render(); };
  bar.append(clear);
  for (const k in nodes) {
    const g = nodes[k], toggle = () => { ev.has(k) ? ev.delete(k) : ev.add(k); render(); };
    Object.assign(g.style, { cursor: 'pointer' });
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `observe ${NAME[k]}`);
    g.onclick = toggle;
    g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
  }

  function render(quiet = false) {
    const [x, y, z] = QUESTIONS[q], trail = `${NAME[x]} – ${NAME[y]} – ${NAME[z]}`;
    const active = isActive(PARENTS, QUESTIONS[q], ev), end = ev.has(x) || ev.has(z);
    const v = PARENTS[y].includes(x) && PARENTS[y].includes(z);
    const kind = v ? 'V-structure' : PARENTS[y].includes(x) || PARENTS[y].includes(z) ? 'Causal chain' : 'Common cause (fork)';
    const below = descendants(PARENTS, y).filter(d => ev.has(d));
    const why = end ? 'An **endpoint** is observed: a trail with an observed endpoint is not counted.'
      : v && active ? `${kind} with ${ev.has(y) ? NAME[y] : `its descendant ${NAME[below[0]]}`} observed: the trail **opens**. ` +
        'Explaining away: once the alarm (or a call it causes) is known, the two causes compete to explain it: $P(b \\mid a) = 0.374$, but $P(b \\mid a, e) = 0.003$.'
      : v ? `${kind} with neither ${NAME[y]} nor a descendant observed: **blocked**. Two causes of the same effect are independent until you see the effect. Try clicking JohnCalls.`
      : active ? `${kind} through ${NAME[y]}, which is not observed: influence flows. Click ${NAME[y]} to block it.`
      : `${kind} through ${NAME[y]}, which is observed: **blocked**. Once you know ${NAME[y]}, ${NAME[x]} tells you nothing more about ${NAME[z]}.`;
    for (const k in edges) edges[k].setAttribute('class', 'fg-e');
    for (const [a, b] of [[x, y], [y, z]]) (edges[a + b] ?? edges[b + a]).setAttribute('class', `fg-e ${active ? 'act' : 'blk'}`);
    for (const k in nodes) nodes[k].setAttribute('class', `fg-nd${ev.has(k) ? ' obs' : ''}${k === x || k === z ? ' end' : ''}`);
    qb.forEach((b, i) => b.classList.toggle('active', i === q));
    const evText = ev.size ? `{${[...ev].map(k => NAME[k]).join(', ')}}` : 'nothing';
    const verdict = active ? 'active → dependent' : end ? 'not counted' : 'blocked → independent';
    c.cap.innerHTML = md(`Trail ${trail}, evidence ${evText}: <b class="${active ? 'yes' : 'no'}">${verdict}</b>. ${why}`);
    if (!quiet) opts.onEvent?.(`[${c.title}] Trail ${trail}, evidence ${evText}: ${verdict}. ${why}`);
  }
  render(true);
  return { destroy() {} };
}
