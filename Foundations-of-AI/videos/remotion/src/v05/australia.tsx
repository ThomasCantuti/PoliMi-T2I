import { at, Seg } from "../anim";

// Australia from web/src/figs/csp-graph.ts (outlines, region centers, graph layout; viewBox 700 x 360) and the colors
// of the CSP visualizer (web/src/viz/csp.ts): a region is filled with color-mix(value 40%, panel-2).
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
export const VARS = Object.keys(MAP);
export const COLOR: Record<string, string> = { R: "#e5484d", G: "#2f9e6a", B: "#3e6ee8" };
// color-mix(in srgb, COLOR 40%, #1c232d)
export const TINT: Record<string, string> = { R: "#6c323a", G: "#245445", B: "#2a4178" };
export const VALUES = ["R", "G", "B"];

// figure units → frame: the map sits left (inside the state box of beat 1), the graph right
const proj = ([lon, lat]: number[]) => [(lon - 112) * 10 + 10, (-lat - 9.5) * 10];
const MK = 1.7, MX = 250, MY = 215, GK = 2.4, GX = 1350, GY = 470;
const toMap = ([x, y]: number[]): [number, number] => [MX + (x - 25) * MK, MY + (y - 12) * MK];
export const onMap = (v: string) => toMap(proj(CENTER[v]));
export const onGraph = (v: string): [number, number] => [GX + (GRAPH[v][0] - 568) * GK, GY + (GRAPH[v][1] - 210) * GK];
export const regionD = (v: string) => "M" + MAP[v].map((p) => toMap(proj(p)).map((n) => n.toFixed(1)).join(" ")).join("L") + "Z";

// a shared border = a run of common outline points (as csp-graph.ts: at least two); the constraint edges follow from it
const same = (p: number[], q: number[]) => p[0] === q[0] && p[1] === q[1];
const border = (a: string, b: string) => {
  const A = MAP[a], inB = A.map((p) => MAP[b].some((q) => same(p, q)));
  const s = inB.findIndex((x, i) => x && !inB[(i - 1 + A.length) % A.length]);
  const run: number[][] = [];
  for (let i = s; s >= 0 && inB[i % A.length] && run.length < A.length; i++) run.push(A[i % A.length]);
  return run;
};
export const EDGES: [string, string, string][] = [];
VARS.forEach((a, i) =>
  VARS.slice(i + 1).forEach((b) => {
    const run = border(a, b);
    if (run.length >= 2) EDGES.push([a, b, "M" + run.map((p) => toMap(proj(p)).map((n) => n.toFixed(1)).join(" ")).join("L")]);
  }),
);
export const NEIGHBORS = (v: string) => EDGES.filter(([a, b]) => a === v || b === v).map(([a, b]) => (a === v ? b : a));

export const MAP_CSS = (p: string) => `
  .${p}-reg { stroke: #3a4757; stroke-width: 2; stroke-linejoin: round; }
  .${p}-nm { font: 600 28px Inter, sans-serif; fill: #b4c0cc; text-anchor: middle; }
`;

/** The map: regions (fill segments per region), names (opacity segments). */
export const AusMap = ({ t, p, fill = {}, names = [], regionOp = [] }: { t: number; p: string; fill?: Record<string, Seg<string>[]>; names?: Seg<number>[]; regionOp?: Seg<number>[] }) => (
  <g>
    {VARS.map((v) => (
      <path key={v} className={`${p}-reg`} d={regionD(v)} style={{ fill: at(t, "#1c232d", fill[v] ?? []), opacity: at(t, 1, regionOp) }} />
    ))}
    <g style={{ opacity: at(t, 1, names) }}>
      {VARS.map((v) => {
        const [x, y] = onMap(v);
        return <text key={v} className={`${p}-nm`} x={x} y={y + 10}>{v}</text>;
      })}
    </g>
  </g>
);

