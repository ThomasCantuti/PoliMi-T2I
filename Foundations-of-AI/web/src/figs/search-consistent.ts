// Consistency as a triangle inequality (slides p. 218–219): static figure, one consistent and one inconsistent triangle.
import { arrow, card, label, md, s, style } from './shell';

const CASES = [
  { title: 'consistent (A → C in the A* example)', n: 'A', n1: 'C', h: 6, c: 3, h1: 3 },
  { title: 'inconsistent (slides p. 219)', n: 'n', n1: "n'", h: 100, c: 10, h1: 20 },
];

export function mount(el: HTMLElement) {
  style('fig-cs-css', '.cs-n circle{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2}.cs-n text{font-size:14px;font-weight:700;fill:var(--text);text-anchor:middle}' +
    '.cs-h{stroke:var(--accent);stroke-width:2;stroke-dasharray:6 5;fill:none}.cs-ok{fill:var(--ok);font-weight:650}.cs-no{fill:var(--bad);font-weight:650}');
  const c = card(el, 'figure', 'Consistency: h(n) ≤ c(n, a, n′) + h(n′)', '0 0 680 300');
  const ah = arrow(c.svg);
  CASES.forEach((k, i) => {
    const ox = i * 340, N = [ox + 170, 60], N1 = [ox + 60, 210], G = [ox + 280, 210];
    const ok = k.h <= k.c + k.h1;
    s(c.svg, 'text', { x: ox + 170, y: 22, class: 'fg-t', 'text-anchor': 'middle', 'font-weight': 650 }, k.title);
    const edge = (a: number[], b: number[], cls: string) => {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
      s(c.svg, 'line', { x1: a[0] + ux * 20, y1: a[1] + uy * 20, x2: b[0] - ux * 23, y2: b[1] - uy * 23, class: cls, 'marker-end': ah });
    };
    edge(N, N1, 'fg-e');
    edge(N1, G, 'cs-h');
    edge(N, G, 'cs-h');
    label(c.svg, (N[0] + N1[0]) / 2 - 12, (N[1] + N1[1]) / 2, `c = ${k.c}`, { class: 'fg-t', 'text-anchor': 'end' });
    label(c.svg, (N1[0] + G[0]) / 2, G[1] + 24, `h(${k.n1}) = ${k.h1}`, { class: 'fg-t', 'text-anchor': 'middle' });
    label(c.svg, (N[0] + G[0]) / 2 + 12, (N[1] + G[1]) / 2, `h(${k.n}) = ${k.h}`, { class: 'fg-t', 'text-anchor': 'start' });
    for (const [p, name] of [[N, k.n], [N1, k.n1], [G, 'goal']] as const) {
      const g = s(c.svg, 'g', { class: 'cs-n' });
      s(g, 'circle', { cx: p[0], cy: p[1], r: 20 });
      s(g, 'text', { x: p[0], y: p[1] + 5, 'font-size': name === 'goal' ? 11 : 14 }, name);
    }
    s(c.svg, 'text', { x: ox + 170, y: 280, 'text-anchor': 'middle', class: ok ? 'cs-ok' : 'cs-no' },
      `${k.h} ${ok ? '≤' : '>'} ${k.c} + ${k.h1} = ${k.c + k.h1}: ${ok ? 'consistent on this edge' : 'inconsistent'}`);
  });
  c.cap.innerHTML = md('Solid arrow: one real step of cost $c$. Dashed arrows: the heuristic estimates to the goal. **Consistent** means the direct ' +
    'estimate from $n$ is never larger than paying the step to $n\'$ and then trusting $h(n\')$. On the right, $h(n) = 100$ claims the goal is ' +
    'far, yet one step of cost 10 reaches a node that claims only 20: the estimates contradict each other.');
  return { destroy() {} };
}
