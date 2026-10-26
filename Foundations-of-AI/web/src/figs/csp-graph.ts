// From the map of Australia to its constraint graph (p. 261, 271): stepper. The edges are computed from the outlines
// (two regions are neighbors iff they share a border); outlines and region centers are the CSP visualizer's.
import { card, s, stepper, style, type FigOptions, type Frame } from './shell';

const MAP: Record<string, number[][]> = {
  WA: [[129, -14.9], [129, -26], [129, -31.6], [126.5, -32.3], [124, -33.6], [121.5, -33.8], [119.5, -34.4], [117.8, -35.1], [116, -34.8], [115, -34.2], [115.6, -33.4], [115.7, -31.7], [115, -29.5], [114.2, -28], [113.5, -26], [113.7, -24], [114.2, -22], [116.7, -20.6], [119, -20], [121, -19.5], [122.3, -18], [123.5, -16.6], [125, -15], [126.8, -13.9], [128.2, -14.9]],
  NT: [[129, -14.9], [129.6, -13.6], [130.3, -12.4], [131.5, -11.3], [132.6, -11.5], [133.5, -11.8], [135.2, -12.2], [136.7, -12.1], [136.2, -13.6], [135.5, -14.8], [136.8, -15.9], [138, -16.6], [138, -26], [129, -26]],
  Q: [[138, -16.6], [139.5, -17.4], [140.8, -17.4], [141.5, -15.5], [141.6, -12.8], [142.5, -10.7], [143.4, -12.5], [143.8, -14.2], [145.3, -15], [145.5, -16.8], [146.3, -18.9], [148.8, -20.4], [150.5, -22.4], [151.2, -23.8], [153.1, -25.3], [153.5, -28.2], [151, -28.9], [149, -29], [141, -29], [141, -26], [138, -26]],
  NSW: [[141, -29], [149, -29], [151, -28.9], [153.5, -28.2], [153.1, -30.5], [152.5, -32.3], [151.3, -33.8], [150.6, -35.2], [150, -37.5], [148.2, -36.8], [147, -36.1], [144.5, -36], [143, -35.3], [141, -34]],
  V: [[141, -34], [143, -35.3], [144.5, -36], [147, -36.1], [148.2, -36.8], [150, -37.5], [148, -37.8], [146.4, -39.1], [145, -38.4], [143.5, -38.8], [142, -38.4], [141, -38.1]],
  SA: [[129, -26], [138, -26], [141, -26], [141, -29], [141, -34], [141, -38.1], [140, -37.5], [139.6, -36.8], [139.3, -35.6], [138.1, -35.6], [138.5, -34.5], [137.9, -33], [137.5, -34.4], [135.9, -34.9], [135.6, -34], [134.6, -33], [133.6, -32.2], [131.2, -31.5], [129, -31.6]],
  T: [[144.7, -40.7], [146.6, -41.1], [148.3, -40.9], [148.3, -42.1], [147.6, -43.1], [146.1, -43.6], [145.2, -42.2]],
};
const CENTER: Record<string, number[]> = { WA: [121.5, -25], NT: [133.5, -19.8], SA: [135, -30.3], Q: [144.3, -22.5], NSW: [146.5, -32.3], V: [143.8, -36.9], T: [146.5, -42.3] };
const GRAPH: Record<string, number[]> = { WA: [468, 175], NT: [528, 95], Q: [624, 95], SA: [576, 175], NSW: [668, 175], V: [624, 255], T: [668, 325] };
const SOLUTION: Record<string, string> = { WA: 'R', NT: 'G', Q: 'R', NSW: 'G', V: 'R', SA: 'B', T: 'G' }; // p. 261
const COLOR: Record<string, string> = { R: '#e5484d', G: '#2f9e6a', B: '#3e6ee8' };
const NAMES: Record<string, string> = { R: 'red', G: 'green', B: 'blue' };
const proj = ([lon, lat]: number[]) => [(lon - 112) * 10 + 10, (-lat - 9.5) * 10];

const V = Object.keys(MAP);
// a shared border = at least two common outline points (one common point would only be a corner)
const EDGES = V.flatMap((a, i) => V.slice(i + 1)
  .filter(b => MAP[a].filter(p => MAP[b].some(q => q[0] === p[0] && q[1] === p[1])).length >= 2).map(b => [a, b]));
const OK = EDGES.every(([a, b]) => SOLUTION[a] !== SOLUTION[b]);

interface F extends Frame { nodes: boolean; edges: boolean; graph: boolean; color: boolean }

const FRAMES: F[] = [
  { nodes: false, edges: false, graph: false, color: false, group: 'map',
    cap: '**Map coloring (p. 261).** Seven regions, each colored red, green or blue; two regions that share a border must get different colors.' },
  { nodes: true, edges: false, graph: false, color: false, group: 'map',
    cap: '**One node per variable:** WA, NT, Q, NSW, V, SA, T, each with the domain {R, G, B}.' },
  { nodes: true, edges: true, graph: false, color: false, group: 'graph',
    cap: `**One edge per binary constraint:** two regions that share a border. That gives ${EDGES.length} edges (${EDGES.map(e => e.join('–')).join(', ')}). Tasmania shares a border with nobody.` },
  { nodes: true, edges: true, graph: true, color: false, group: 'graph',
    cap: '**The constraint graph** (p. 271): the same nodes and edges, without the map. SA is the most connected node (degree 5); ' +
      'T is a separate connected component, an **independent subproblem** that can be colored on its own.' },
  { nodes: true, edges: true, graph: true, color: true, group: 'solution',
    cap: `**A solution** (p. 261): ${V.map(v => `${v} = ${NAMES[SOLUTION[v]]}`).join(', ')}. ` +
      (OK ? `Every one of the ${EDGES.length} edges joins two different colors: all constraints are satisfied.` : 'Some edge joins two equal colors!') },
];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-csg-css', CSS);
  const c = card(el, 'stepper', 'From the map to the constraint graph', '0 0 700 360');
  const regions: Record<string, SVGPathElement> = {}, names: SVGTextElement[] = [];
  for (const v of V) {
    regions[v] = s(c.svg, 'path', { class: 'csg-reg', d: 'M' + MAP[v].map(p => proj(p).map(n => n.toFixed(1)).join(' ')).join('L') + 'Z' });
    const [x, y] = proj(CENTER[v]);
    names.push(s(c.svg, 'text', { x, y: y + 4, class: 'csg-name' }, v));
  }
  const line = (pos: (v: string) => number[]) => EDGES.map(([a, b]) => {
    const [x1, y1] = pos(a), [x2, y2] = pos(b);
    return s(c.svg, 'line', { x1, y1, x2, y2, class: 'fg-e' });
  });
  const onMap = line(v => proj(CENTER[v])), onGraph = line(v => GRAPH[v]);
  const nodes = V.map(v => {
    const g = s(c.svg, 'g', { class: 'csg-n' });
    s(g, 'circle', { r: 19 });
    s(g, 'text', {}, v);
    return g;
  });
  return stepper(c, FRAMES, f => {
    V.forEach((v, i) => {
      const [x, y] = f.graph ? GRAPH[v] : proj(CENTER[v]);
      nodes[i].style.transform = `translate(${x}px, ${y}px)`;
      nodes[i].classList.toggle('hide', !f.nodes);
      nodes[i].classList.toggle('col', f.color);
      nodes[i].querySelector('circle')!.style.fill = f.color ? COLOR[SOLUTION[v]] : '';
      regions[v].classList.toggle('dim', f.nodes && !f.color);
      regions[v].style.fill = f.color ? `color-mix(in srgb, ${COLOR[SOLUTION[v]]} 40%, var(--panel-2))` : '';
      names[i].classList.toggle('hide', f.nodes);
    });
    onMap.forEach(e => e.classList.toggle('hide', !f.edges || f.graph));
    onGraph.forEach(e => e.classList.toggle('hide', !f.graph));
  }, opts);
}

const CSS = `
.csg-reg{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:1.2;transition:fill .4s,opacity .4s}
.csg-reg.dim{opacity:.5}
.csg-name{font-size:12px;font-weight:650;fill:var(--text-2);text-anchor:middle;transition:opacity .3s}
.csg-n{transition:transform .7s cubic-bezier(.2,.7,.2,1),opacity .3s}
.csg-n circle{fill:var(--panel);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .4s}
.csg-n text{font-size:12px;font-weight:700;fill:var(--text);text-anchor:middle;dominant-baseline:central;pointer-events:none}
.csg-n.col circle{stroke:var(--panel)}
.csg-n.col text{fill:#fff}
`;
