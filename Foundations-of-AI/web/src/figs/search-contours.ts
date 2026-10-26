// Which nodes A* expands (slides p. 232): the worked-example graph colored by f(n) = g*(n) + h(n) against C*. Static figure;
// g*(n) comes from uniform-cost search with the Playground engine (the g of a node when UCS selects it is optimal).
import { trace } from '../viz/search';
import { GRAPH, drawGraph } from './search-astar';
import { card, md, s, style } from './shell';

export function mount(el: HTMLElement) {
  style('fig-ct-css', '.as-n.lt circle{fill:color-mix(in srgb,var(--ok) 30%,var(--panel-2));stroke:var(--ok)}' +
    '.as-n.eq circle{fill:var(--warn-soft);stroke:var(--warn)}.as-n.gt circle{fill:var(--panel-2);stroke:var(--v-pruned);stroke-dasharray:4 3}.as-n.gt text{fill:var(--muted)}' +
    '.ct-k rect{stroke-width:2}.ct-k text{font-size:12.5px;fill:var(--text-2)}');
  const c = card(el, 'figure', 'Which nodes does A* expand? Compare f(n) = g*(n) + h(n) with C*', '0 0 620 350');
  const { nodes, labels } = drawGraph(c.svg);
  const t = trace({ algorithm: 'ucs', graph: GRAPH });
  const gStar: Record<string, number> = {};
  for (const st of t.steps) if (st.cur != null) gStar[t.nodes[st.cur].state] ??= t.nodes[st.cur].g;
  const C = t.result.cost!;
  const groups: Record<'lt' | 'eq' | 'gt', string[]> = { lt: [], eq: [], gt: [] };
  for (const k in nodes) {
    const f = gStar[k] + GRAPH.nodes[k].h!, cls = f < C ? 'lt' : f === C ? 'eq' : 'gt';
    groups[cls].push(k);
    nodes[k].setAttribute('class', `as-n ${cls}`);
    labels[k].textContent = `${gStar[k]}+${GRAPH.nodes[k].h}=${f}`;
  }
  const KEY = [['lt', `f < C* = ${C}: always expanded`, 'color-mix(in srgb,var(--ok) 30%,var(--panel-2))', 'var(--ok)'],
    ['eq', `f = C*: maybe (ties)`, 'var(--warn-soft)', 'var(--warn)'], ['gt', 'f > C*: never', 'var(--panel-2)', 'var(--v-pruned)']] as const;
  KEY.forEach(([, txt, fill, stroke], i) => {
    const g = s(c.svg, 'g', { class: 'ct-k' });
    s(g, 'rect', { x: 16 + i * 205, y: 318, width: 16, height: 16, rx: 4, fill, stroke });
    s(g, 'text', { x: 40 + i * 205, y: 331 }, txt);
  });
  const list = (a: string[]) => a.join(', ');
  c.cap.innerHTML = md(`Under each node: $g^*(n) + h(n) = f(n)$, with $g^*$ the cost of the cheapest path from S. The optimal cost is $C^* = ${C}$. ` +
    `${list(groups.lt)} have $f < C^*$: any optimal algorithm with this $h$ must expand them. ${list(groups.eq)} sit exactly on $C^*$: ` +
    `expanded or not depending on tie-breaking. ${list(groups.gt)} ${groups.gt.length > 1 ? 'have' : 'has'} $f > C^*$: A* never expands ${groups.gt.length > 1 ? 'them' : 'it'}.`);
  return { destroy() {} };
}
