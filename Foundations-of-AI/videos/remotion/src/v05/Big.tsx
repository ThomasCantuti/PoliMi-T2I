import { ACC, at, Beat, E, FILL, Fx, fx, INK, Seg, STROKE, useTime } from "../anim";
import { AusMap, COLOR, EDGES, MAP_CSS, NEIGHBORS, onGraph, onMap, TINT, VALUES, VARS } from "./australia";

const css = `
  #b05-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .b05-st { font: 600 30px Inter, sans-serif; fill: #7d8a99; }
  .b05-pl text { font: 600 28px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .b05-n text { font: 700 24px Inter, sans-serif; text-anchor: middle; }
  .b05-mrv { font: 700 24px Inter, sans-serif; fill: #1b1b1b; text-anchor: middle; }
  ${MAP_CSS("b05")}
`;

// The box opens into the CSP of figs/csp-graph.ts: variables (one node per region), domains (the CSP visualizer's
// color chips), constraints (one edge per shared border); then the graph moves next to the map (csp-graph frame 4).
// The run is the page's forward-checking example (csp.md p. 280–283): WA = R, Q = G leave NT = {B} and SA = {B};
// MRV with degree as tie-breaker picks SA; SA = B empties NT, so that choice is undone.
const CW = 26, GAP = 6, ROW = 3 * CW + 2 * GAP;
// where each node's chip row starts, relative to the node (clear of its edges in the graph layout)
const CHIPS: Record<string, [number, number]> = {
  WA: [-ROW / 2, 46], NT: [-ROW / 2, -80], Q: [-ROW / 2, -80], SA: [-100, 46], NSW: [46, -5], V: [-136, -13], T: [46, -13],
};
type Chip = "live" | "pruned" | "gone";
const NODE = "#161b22"; // csg-n: an unassigned node is panel-colored

export const Big = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const open = w("the box"), vars = w("variables"), vals = w("possible values"), cons = w("and constraints"), move = w("now search");
  const moved = at(t, 0, [[move, 0.8, 1, E.p2io]]);
  const fewest = w("the fewest"), pick = w("colors left"), dead = w("no color left"), undo = w("undo the") + 0.1;
  const filt = w("filtering"), ord = w("ordering");

  // forward checking, step by step: [time, variable, value, when its neighbors lose that value]
  const a2 = wEnd("neighbors") + 0.05;
  const SETS: [number, string, string, number][] = [
    [w("color one") + 0.1, "WA", "R", w("cross that") + 0.25],
    [a2, "Q", "G", a2 + 0.45],
    [wEnd("colors left") + 0.05, "SA", "B", w("the moment") + 0.1],
  ];
  const chip: Record<string, [number, Chip][]> = {}, node: Record<string, Seg<string>[]> = {}, region: Record<string, Seg<string>[]> = {};
  const flashes: Record<string, number[]> = {}, deadAt: Record<string, number> = {};
  const dom: Record<string, string[]> = Object.fromEntries(VARS.map((v) => [v, [...VALUES]]));
  const asg: Record<string, string> = {}, pruned: Record<string, [string, string][]> = {};
  const set = (v: string, x: string, t0: number) => VALUES.forEach((y) => (chip[v + y] ??= []).push([t0, x === "" ? (dom[v].includes(y) ? "live" : "pruned") : "gone"]));
  for (const [t0, v, x, tp] of SETS) {
    asg[v] = x;
    set(v, x, t0);
    (node[v] ??= []).push([t0, 0.25, COLOR[x], E.p2o]);
    (region[v] ??= []).push([t0, 0.25, TINT[x], E.p2o]);
    pruned[v] = [];
    NEIGHBORS(v).filter((n) => !(n in asg) && dom[n].includes(x)).forEach((n, i) => {
      dom[n] = dom[n].filter((y) => y !== x);
      pruned[v].push([n, x]);
      (chip[n + x] ??= []).push([tp + 0.08 * i, "pruned"]);
      (flashes[[v, n].sort().join()] ??= []).push(tp + 0.08 * i);
      if (!dom[n].length) deadAt[n] = Math.max(tp, dead);
    });
  }
  // undo SA = B: its neighbors get B back, SA shows its domain again
  const last = SETS[SETS.length - 1][1];
  for (const [n, x] of pruned[last]) {
    dom[n].push(x);
    chip[n + x].push([undo, "live"]);
  }
  delete asg[last];
  set(last, "", undo);
  node[last].push([undo, 0.25, NODE, E.p2o]);
  region[last].push([undo, 0.25, "#1c232d", E.p2o]);
  // MRV: remaining values of the unassigned variables, shown when the narration picks, and again on "ordering"
  const mrv = (v: string) => (v in asg ? 0 : dom[v].length);
  const badge: Seg<number>[] = [[fewest, 0.3, 1, E.p2o], [SETS[2][0], 0.2, 0], [ord, 0.3, 1, E.p2o]];

  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const P = (v: string) => {
    const [x1, y1] = onMap(v), [x2, y2] = onGraph(v);
    return [x1 + (x2 - x1) * moved, y1 + (y2 - y1) * moved];
  };
  const r = 30 + 4 * moved;
  const boxGone: Fx = [open + 0.25, 0.4, 0, 6, E.p2i];

  return (
    <>
      <style>{css}</style>
      <svg id="b05-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <g style={fx(t, [0, 6], [[0, 0.35, 1, 0, E.p2o]])}>
          <AusMap
            t={t} p="b05" fill={region}
            names={[[vars, 0.25, 0, E.p2o], [move + 0.4, 0.4, 1, E.p2o]]}
            regionOp={[[vars, 0.3, 0.5, E.p2o], [move + 0.4, 0.4, 1, E.p2o]]}
          />
          {/* the closed box of the previous scene opens */}
          <rect x="210" y="175" width="760" height="640" rx="22" fill={FILL} style={{ opacity: at(t, 1, [[open, 0.5, 0, E.p2o]]) }} />
          <g style={fx(t, [1, 0], [boxGone])}>
            <rect x="210" y="175" width="760" height="640" rx="22" fill="none" stroke={STROKE} strokeWidth="3" />
            <text className="b05-st" x="238" y="220">state</text>
            {(["goal?", "next?"] as const).map((q, i) => (
              <g key={q} className="b05-pl">
                <line x1="970" y1={451 + 88 * i} x2="1014" y2={451 + 88 * i} stroke={STROKE} strokeWidth="3" />
                <rect x="1014" y={423 + 88 * i} width="132" height="56" rx="28" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
                <text x="1080" y={461 + 88 * i}>{q}</text>
              </g>
            ))}
          </g>
        </g>
        {/* constraints: one edge per shared border */}
        {EDGES.map(([a, b], i) => {
          const [x1, y1] = P(a), [x2, y2] = P(b), d = at(t, 0, [[cons + 0.05 * i, 0.4, 1, E.p2o]]);
          const fl = (flashes[[a, b].sort().join()] ?? []).flatMap((t0): Seg<string>[] => [[t0, 0.15, ACC, E.p2o], [t0 + 0.5, 0.3, STROKE]]);
          return <line key={a + b} x1={x1} y1={y1} x2={x1 + (x2 - x1) * d} y2={y1 + (y2 - y1) * d} strokeWidth="3" strokeLinecap="round" style={{ stroke: at(t, STROKE, fl), opacity: d > 0 ? 1 : 0 }} />;
        })}
        {VARS.map((v, i) => {
          const [x, y] = P(v), [cx, cy] = CHIPS[v];
          const focus: Seg<number>[] = v === last ? [[pick, 0.25, 1, E.p2o], [filt, 0.25, 0]] : [];
          return (
            <g key={v} className="b05-n" style={fx(t, [0, 6], [[vars + 0.04 * i, 0.45, 1, 0, E.expo]])}>
              <circle cx={x} cy={y} r={r + 9} fill="none" stroke={ACC} strokeWidth="4" style={{ opacity: at(t, 0, focus) }} />
              <circle
                cx={x} cy={y} r={r}
                style={{
                  fill: at(t, NODE, node[v] ?? []),
                  stroke: at(t, STROKE, v in deadAt ? [[deadAt[v], 0.2, "#f85149", E.p2o], [undo, 0.25, STROKE]] : []),
                  strokeWidth: at(t, 2.5, v in deadAt ? [[deadAt[v], 0.2, 5, E.p2o], [undo, 0.25, 2.5]] : []),
                }}
              />
              <text x={x} y={y + 9} style={{ fill: at(t, INK, (node[v] ?? []).map(([t0, d, c]) => [t0, d, c === NODE ? INK : "#ffffff"])) }}>{v}</text>
              {/* the domain: one chip per value, crossed off when pruned, gone once assigned */}
              <g style={fx(t, [0, 6], [[vals + 0.04 * i, 0.4, 1, 0, E.expo]])}>
                {VALUES.map((val, k) => {
                  const segs = chip[v + val] ?? [];
                  const X = x + cx + k * (CW + GAP), Y = y + cy;
                  const op = at(t, 1, segs.map(([t0, s]): Seg<number> => [t0, 0.25, s === "live" ? 1 : s === "pruned" ? 0.22 : 0, E.p2o]));
                  const cross = at(t, 0, segs.map(([t0, s]): Seg<number> => [t0, 0.25, s === "pruned" ? 1 : 0, E.p2o]));
                  return (
                    <g key={val}>
                      <rect x={X} y={Y} width={CW} height={CW} rx="6" fill={COLOR[val]} style={{ opacity: op }} />
                      <line x1={X - 2} y1={Y + CW + 2} x2={X + CW + 2} y2={Y - 2} stroke="#f85149" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="43" strokeDashoffset={43 * (1 - cross)} opacity={cross > 0.01 ? 1 : 0} />
                    </g>
                  );
                })}
                {/* filtering: the rows forward checking has cut */}
                {["NT", "SA", "NSW"].includes(v) && (
                  <rect x={x + cx - 8} y={y + cy - 8} width={ROW + 16} height={CW + 16} rx="10" fill="none" stroke={ACC} strokeWidth="3" style={{ opacity: at(t, 0, [[filt, 0.25, 1, E.p2o], [ord, 0.25, 0]]) }} />
                )}
              </g>
              {/* ordering: MRV counts the values left */}
              {mrv(v) > 0 && (
                <g style={{ opacity: at(t, 0, badge) }}>
                  <circle cx={x + 26} cy={y - 26} r="17" fill="#e3b341" />
                  <text className="b05-mrv" x={x + 26} y={y - 17}>{mrv(v)}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </>
  );
};
