// UCS worked example (AIMA Fig. 3.10, Sibiu → Bucharest; slides p. 135–138): the course best_first_search (goal test at
// selection, reached table re-adds a cheaper path) next to the same search with the goal test moved to generation.
import { trace } from '../viz/search';
import { twoTests, type Side } from './search-bfstest';
import type { FigOptions } from './shell';

const NODES: Record<string, [number, number]> = { S: [0, 52], R: [30, 104], F: [52, 0], P: [72, 104], B: [100, 52] };
const NAMES: Record<string, string> = { S: 'Sibiu', R: 'Rimnicu', F: 'Fagaras', P: 'Pitesti', B: 'Bucharest' };
const EDGES: [string, string, number][] = [['S', 'R', 80], ['S', 'F', 99], ['R', 'P', 97], ['F', 'B', 211], ['P', 'B', 101]];

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  const nm = (x: string) => NAMES[x];
  return twoTests(el, opts, {
    title: 'Uniform-cost search: goal test at selection vs at generation', nodes: NODES, edges: EDGES, start: 'S', goal: 'B', pq: true, names: NAMES,
    check: (late, early) => {
      const L = late[late.length - 1], E = early[early.length - 1];
      const t = trace({ algorithm: 'ucs', graph: { directed: true, nodes: Object.fromEntries(Object.keys(NODES).map(k => [k, { x: 0, y: 0 }])), edges: EDGES }, start: 'S', goal: 'B' });
      if (L.foundG !== 278 || E.foundG !== 310 || t.result.cost !== 278) console.error(`search-ucstest: costs ${L.foundG} / ${E.foundG}, engine ${t.result.cost}; expected 278 / 310`);
    },
    caption: (sd: Side[], i, last) => {
      const [a, b] = sd, fr = (x: Side) => x.frontier.map(([s, g]) => `${nm(s)} ${g}`).join(', ');
      if (!i) return '**Start.** Priority queue on $g$ (ties first in, first out), goal **Bucharest**. Left: the course `best_first_search` with $f = g$, goal test when a node ' +
        'is **popped**. Right: the same code with the goal test moved to when a node is **generated**, as BFS may do.';
      const left = a.found ? `Left pops **Bucharest with g = ${a.foundG}**: only now is it tested, and it is the cheapest path. `
        : `Left pops ${nm(a.pop!)} (g = ${a.g[a.pop!]}), adds ${a.gen.map(x => `${nm(x)} ${a.g[x]}`).join(', ')}` +
          (a.updated ? `: **${a.g[a.updated]} < ${a.oldG}**, the cost of the ${nm(a.updated)} already reached, so the reached table is updated and the cheaper node added; the old entry stays in the queue` : '') +
          `. Frontier: ${fr(a)}. `;
      const right = b.found && b.pop === a.pop ? `Right generates **Bucharest with g = ${b.foundG}** from ${nm(b.pop!)} and returns it at once: **not optimal**, the path through Pitesti has not been generated yet. `
        : b.done ? '' : `Right pops ${nm(b.pop!)}, generates and tests ${b.gen.map(nm).join(', ')} (no). `;
      return left + right + (last ? `**Results:** late test ${a.foundG} (optimal), early test ${b.foundG}. With step costs the goal must be tested **at selection**: ` +
        'UCS pops nodes in order of $g$, so the first goal popped is a cheapest one; the first goal generated need not be.' : '');
    },
  });
}
