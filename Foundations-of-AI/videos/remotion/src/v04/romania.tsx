import { ACC, at, E, FILL, Fx, fx, INK, MUTED, OK, PREV, Seg, STROKE } from "../anim";

// The Romania map of the informed Playground presets (web/src/viz/search.ts ROMANIA): [x, y, h = straight-line
// distance to Bucharest, name], same coordinates, same roads. Drawn at one scale, like the Playground.
export const CITY: Record<string, [number, number, number, string]> = {
  A: [0, 26, 366, "Arad"], Z: [6, 13, 374, "Zerind"], O: [13, 0, 380, "Oradea"], S: [38, 37, 253, "Sibiu"],
  T: [1, 52, 329, "Timisoara"], L: [24, 62, 244, "Lugoj"], M: [25, 75, 241, "Mehadia"], D: [24, 88, 242, "Drobeta"],
  C: [52, 92, 160, "Craiova"], R: [46, 52, 193, "Rimnicu Vilcea"], F: [69, 40, 176, "Fagaras"], P: [74, 66, 100, "Pitesti"],
  B: [100, 79, 0, "Bucharest"],
};
const IDS = Object.keys(CITY);
// [a, b, cost, where the cost label sits along a → b]
export const ROADS: [string, string, number, number?][] = [
  ["A", "Z", 75], ["A", "S", 140], ["A", "T", 118], ["Z", "O", 71], ["O", "S", 151], ["T", "L", 111], ["L", "M", 70], ["M", "D", 75],
  ["D", "C", 120], ["C", "R", 146], ["C", "P", 138], ["S", "F", 99], ["S", "R", 80], ["R", "P", 97], ["F", "B", 211, 0.4], ["P", "B", 101, 0.33],
];
const K = 7.5, X0 = 800, Y0 = 157, NR = 21;
export const pos = (k: string): [number, number] => [X0 + CITY[k][0] * K, Y0 + CITY[k][1] * K];
export const hOf = (k: string) => CITY[k][2];
// where each city's value label sits (dx, dy, anchor), clear of its roads
export type Lbl = [number, number, "start" | "middle" | "end"];
const LBL: Record<string, Lbl> = {
  A: [-34, 34, "end"], Z: [-34, 9, "end"], O: [34, 9, "start"], S: [26, -30, "start"], T: [-34, 9, "end"], L: [34, 9, "start"],
  M: [34, 9, "start"], D: [-34, 9, "end"], C: [34, 9, "start"], R: [-34, 9, "end"], F: [24, -32, "start"], P: [33, 78, "middle"],
  B: [0, 52, "middle"],
};

/** One selection of the best-first loop: the node selected, its g, and the children added (new, or reached more cheaply). */
export type Step = { sel: string; g: number; gen: [string, number][] };

/** Best-first search Arad → Bucharest as the course code runs it (informed.md): goal test on selection, a reached
 *  table, a child is (re-)added only if new or cheaper, ties first-in first-out. key(g, city) orders the frontier. */
export function search(key: (g: number, k: string) => number): Step[] {
  const best: Record<string, number> = { A: 0 };
  const frontier: [string, number, number][] = [["A", 0, 0]];
  const steps: Step[] = [];
  let seq = 1;
  while (frontier.length) {
    frontier.sort((a, b) => key(a[1], a[0]) - key(b[1], b[0]) || a[2] - b[2]);
    const [s, g] = frontier.shift()!;
    if (g > best[s]) continue; // an outdated entry
    const step: Step = { sel: s, g, gen: [] };
    steps.push(step);
    if (s === "B") break;
    for (const n of [...ROADS].map(([a, b]) => (a === s ? b : b === s ? a : "")).filter(Boolean).sort()) {
      const g2 = g + ROADS.find(([a, b]) => (a === s && b === n) || (a === n && b === s))![2];
      if (!(n in best) || g2 < best[n]) {
        best[n] = g2;
        frontier.push([n, g2, seq++]);
        step.gen.push([n, g2]);
      }
    }
  }
  return steps;
}

export const UCS = search((g) => g);
export const ASTAR = search((g, k) => g + hOf(k));
// g*(n): uniform-cost search selects every city with its cheapest g
export const GSTAR: Record<string, number> = {};
UCS.forEach((s) => (GSTAR[s.sel] = s.g));

/** When each selection happens: from t0 to t1, half evenly spaced, half proportional to the selected value. */
export const schedule = (vals: number[], t0: number, t1: number) =>
  vals.map((v, i) => t0 + (t1 - t0) * (0.5 * (i / (vals.length - 1)) + 0.5 * ((v - vals[0]) / (vals[vals.length - 1] - vals[0]))));

/** Piecewise-linear clock through [time, value] knots. */
export const clock = (t: number, knots: [number, number][]) => {
  if (t <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++)
    if (t <= knots[i][0]) return knots[i - 1][1] + ((t - knots[i - 1][0]) / (knots[i][0] - knots[i - 1][0])) * (knots[i][1] - knots[i - 1][1]);
  return knots[knots.length - 1][1];
};

// node looks, from the Playground: frontier (warn), current (accent), expanded, solution path (ok); "never" = the
// dashed node of search-contours (f > C*)
export type St = "plain" | "front" | "cur" | "exp" | "path" | "never";
const LOOK: Record<St, [string, string, string]> = {
  plain: [FILL, STROKE, INK], front: ["#302b1d", "#e3b341", INK], cur: [ACC, ACC, "#ffffff"], exp: ["#5b6b80", "#5b6b80", INK],
  path: [OK, OK, "#ffffff"], never: [FILL, "rgba(74,83,97,0)", MUTED],
};
export type States = Record<string, [number, St][]>;
export type Labels = Record<string, [number, string][]>;

/** Node states and labels of a run: A in the frontier at tInit, each node current when selected, expanded at the next selection. */
export function runOf(steps: Step[], ts: number[], tInit: number, label: (k: string, g: number) => string) {
  const states: States = { A: [[tInit, "front"]] }, labels: Labels = { A: [[tInit, label("A", 0)]] };
  steps.forEach((st, i) => {
    states[st.sel].push([ts[i], "cur"]);
    if (i + 1 < steps.length) states[st.sel].push([ts[i + 1], "exp"]);
    for (const [n, g] of st.gen) {
      if (!states[n]) states[n] = [[ts[i], "front"]];
      (labels[n] ??= []).push([ts[i], label(n, g)]);
    }
  });
  return { states, labels };
}

// the explored region: every road painted from each reached end while value(point) <= c; [line, fill] colors
const POOL: [number, string][] = [[62, "#343c68"], [56, "#181d2e"]];
/** val(k) = value of city k (g* for uniform-cost, g* + h for A*); along a road the value grows linearly to the
 *  other end's estimate (rate per unit length). grow scales the first disc (it appears instead of popping). */
export const Pool = ({ c, val, rate, grow, start }: { c: number; val: (k: string) => number; rate: (u: string, v: string, len: number) => number; grow: number; start: string }) => {
  const segs: [number, number, number, number][] = [];
  for (const [a, b, len] of ROADS)
    for (const [u, v] of [[a, b], [b, a]]) {
      if (c < val(u)) continue;
      const span = rate(u, v, len) * len, p = span <= 0 ? 1 : Math.min(1, (c - val(u)) / span);
      if (p < 0.002) continue;
      const [x1, y1] = pos(u), [x2, y2] = pos(v);
      segs.push([x1, y1, x1 + (x2 - x1) * p, y1 + (y2 - y1) * p]);
    }
  const discs = IDS.filter((k) => c >= val(k));
  return (
    <g>
      {POOL.map(([w, col]) => (
        <g key={w} stroke={col} fill={col} strokeWidth={w} strokeLinecap="round">
          {segs.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />)}
          {discs.map((k) => <circle key={k} cx={pos(k)[0]} cy={pos(k)[1]} r={(w / 2) * (k === start ? grow : 1)} stroke="none" />)}
        </g>
      ))}
    </g>
  );
};

/** A path along cities as an SVG d (for the g line and the solution). */
export const pathD = (ks: string[]) => ks.map((k, i) => `${i ? "L" : "M"}${pos(k)[0]},${pos(k)[1]}`).join(" ");

export const MAP_CSS = (p: string) => `
  .${p}-rd { stroke: #4b5a6e; stroke-width: 3; }
  .${p}-ec { font: 500 24px Inter, sans-serif; fill: #7d8a99; text-anchor: middle; paint-order: stroke; stroke: #0e1116; stroke-width: 7px; stroke-linejoin: round; font-variant-numeric: tabular-nums; }
  .${p}-n text { font: 700 26px Inter, sans-serif; text-anchor: middle; }
  .${p}-lb { font: 600 24px Inter, sans-serif; fill: #b4c0cc; paint-order: stroke; stroke: #0e1116; stroke-width: 7px; stroke-linejoin: round; font-variant-numeric: tabular-nums; }
  .${p}-nm { font: 600 28px Inter, sans-serif; fill: #b4c0cc; }
`;

/** The map: roads, cost labels, cities in their run states, value labels, the names of start and goal.
 *  `over` is drawn between the roads and the cities (highlighted paths, the h line). */
export const RomaniaMap = ({ t, tIn, p, states, labels, labelColor = {}, lbl = {}, roadsDim = [], over }: {
  t: number; tIn: number; p: string; states: States; labels: Labels; labelColor?: Record<string, Seg<string>[]>; lbl?: Record<string, Lbl>;
  roadsDim?: Seg<number>[]; over?: React.ReactNode;
}) => {
  const arrive = (d: number): Fx => [tIn + d, 0.5, 1, 0, E.expo];
  const look = (k: string, i: 0 | 1 | 2): Seg<string>[] => (states[k] ?? []).map(([t0, s]) => [t0, 0.25, LOOK[s][i], E.p2o]);
  const never = (k: string): Seg<number>[] => (states[k] ?? []).map(([t0, s]) => [t0, 0.25, s === "never" ? 1 : 0, E.p2o]);
  return (
    <g>
      <g style={{ opacity: at(t, 0, [[tIn, 0.5, 1, E.p2o], ...roadsDim]) }}>
        {ROADS.map(([a, b]) => <line key={a + b} className={`${p}-rd`} x1={pos(a)[0]} y1={pos(a)[1]} x2={pos(b)[0]} y2={pos(b)[1]} />)}
      </g>
      {over}
      <g style={{ opacity: at(t, 0, [[tIn + 0.2, 0.5, 1, E.p2o], ...roadsDim]) }}>
        {ROADS.map(([a, b, cost, q = 0.5]) => {
          const [x1, y1] = pos(a), [x2, y2] = pos(b);
          return <text key={a + b} className={`${p}-ec`} x={x1 + (x2 - x1) * q} y={y1 + (y2 - y1) * q + 8}>{cost}</text>;
        })}
      </g>
      {IDS.map((k) => {
        const [x, y] = pos(k), d = CITY[k][0] / 400;
        return (
          <g key={k} className={`${p}-n`} style={fx(t, [0, 6], [arrive(d)])}>
            <circle cx={x} cy={y} r={NR} strokeWidth="2.5" style={{ fill: at(t, FILL, look(k, 0)), stroke: at(t, STROKE, look(k, 1)) }} />
            <circle cx={x} cy={y} r={NR} strokeWidth="2.5" fill="none" stroke="#4a5361" strokeDasharray="7 5" style={{ opacity: at(t, 0, never(k)) }} />
            <text x={x} y={y + 9} style={{ fill: at(t, INK, look(k, 2)) }}>{k}</text>
          </g>
        );
      })}
      {Object.keys(labels).map((k) => {
        const [x, y] = pos(k), [dx, dy, anchor] = lbl[k] ?? LBL[k], vs = labels[k];
        const dim = (states[k] ?? []).filter(([, s]) => s === "never").map(([t0]): Seg<string> => [t0, 0.25, MUTED, E.p2o]);
        return vs.map(([t0, text], i) => (
          <text
            key={`${k}${i}`} className={`${p}-lb`} x={x + dx} y={y + dy} textAnchor={anchor}
            style={{ ...fx(t, [0, 4], [[t0, 0.25, 1, 0, E.p2o], ...(i + 1 < vs.length ? [[vs[i + 1][0], 0.15, 0, 4, E.p2i] as Fx] : [])]), fill: at(t, PREV, [...(labelColor[k] ?? []), ...dim]) }}
          >
            {text}
          </text>
        ));
      })}
      <g style={{ opacity: at(t, 0, [[tIn + 0.3, 0.5, 1, E.p2o]]) }}>
        <text className={`${p}-nm`} x={pos("A")[0] - 34} y={pos("A")[1] - 4} textAnchor="end">Arad</text>
        <text className={`${p}-nm`} x={pos("B")[0] + 34} y={pos("B")[1] + 10}>Bucharest</text>
      </g>
    </g>
  );
};
