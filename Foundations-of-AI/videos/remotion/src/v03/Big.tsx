import { interpolateColors } from "remotion";
import { ACC, at, Beat, E, FILL, Fx, fx, INK, MUTED, PREV, Seg, STROKE, useTime } from "../anim";

const css = `
  #b03-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #b03-head { position: absolute; left: 192px; top: 96px; width: 640px; height: 80px; }
  #b03-head > div { position: absolute; left: 0; top: 0; font: 700 60px/1.15 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; white-space: nowrap; }
  #b03-head .dig { position: relative; display: inline-block; width: 0.62em; height: 1.15em; vertical-align: top; }
  #b03-head .dig span { position: absolute; left: 0; top: 0; line-height: 1.15; }
  #b03-steps { position: absolute; right: 192px; top: 118px; display: flex; gap: 34px; font: 600 27px/1.2 Inter, sans-serif; color: #7d8a99; }
  .b03-n { font: 700 30px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .b03-c { font: 500 26px Inter, sans-serif; fill: #7d8a99; text-anchor: middle; }
  .b03-g { font: 500 26px Inter, sans-serif; fill: #e3b341; text-anchor: middle; }
  .b03-x { font: 700 30px Inter, sans-serif; fill: #e3b341; text-anchor: end; }
`;

// web/src/figs/search-order.ts: complete binary tree of depth 3, heap numbering (children of k: 2k, 2k+1),
// COST[k] = cost of the edge into k; viewBox 680 x 300 scaled to the 1536 px between the margins.
const N = 15;
const COST: Record<number, number> = { 2: 1, 3: 4, 4: 5, 5: 1, 6: 1, 7: 2, 8: 1, 9: 3, 10: 1, 11: 6, 12: 1, 13: 2, 14: 1, 15: 1 };
const kids = (k: number) => (2 * k <= N ? [2 * k, 2 * k + 1] : []);
const g: Record<number, number> = { 1: 0 };
for (let k = 2; k <= N; k++) g[k] = g[k >> 1] + COST[k];

/** Expansion order of the whole tree (no goal) for a frontier discipline; children are generated left to right. */
function order(q: "fifo" | "lifo" | "g"): number[] {
  const out: number[] = [];
  let fr: { k: number; seq: number }[] = [{ k: 1, seq: 0 }], seq = 1;
  while (fr.length) {
    let i = q === "fifo" ? 0 : fr.length - 1;
    if (q === "g") i = fr.reduce((b, x, j) => (g[x.k] < g[fr[b].k] || (g[x.k] === g[fr[b].k] && x.seq < fr[b].seq) ? j : b), 0);
    const [{ k }] = fr.splice(i, 1);
    out.push(k);
    const ch = kids(k).map((c) => ({ k: c, seq: seq++ }));
    fr = fr.concat(q === "lifo" ? ch.reverse() : ch); // LIFO: push the right child first, so the left one is popped first
  }
  return out;
}

const K = 1536 / 680;
const depth = (k: number) => Math.floor(Math.log2(k));
const LY = (d: number) => 300 + d * 68 * K;
const POS: [number, number][] = Array.from({ length: N + 1 }, (_, k) => (k ? [192 + (((k - 2 ** depth(k) + 0.5) * 680) / 2 ** depth(k)) * K, LY(depth(k))] : [0, 0]));
const NODES = Array.from({ length: N }, (_, i) => i + 1);
// the figure's fill: the earlier a node is expanded, the more accent
const tint = (i: number) => interpolateColors((70 - (i * 60) / (N - 1)) / 100, [0, 1], [FILL, ACC]);
const STEPS = ["Breadth-first", "Uniform-cost", "Depth-first", "Iterative deepening"];
const HEADS = ["FIFO queue", "Priority queue on g", "LIFO stack"];

export const Big = ({ dur, w }: Beat) => {
  const t = useTime();
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const arrive = (t0: number): Fx => [t0, 0.5, 1, 0, E.expo];
  // the four strategies, each on the phrase that names its frontier
  const S = [w("with a"), w("order by"), w("use a"), w("iterative deepening")];
  const R = [S[3], w("runs"), w("limit"), w("each round")]; // iterative deepening: limit L = 0, 1, 2, 3
  const cost = w("path cost"), waste = w("wasteful"), comb = w("combines");
  // numbering phases: [reset, cascade start, step, order]; each round of iterative deepening restarts from the root
  const lifo = order("lifo");
  const phases: [number, number, number, number[]][] = [
    [S[0], w("spreads"), 0.1, order("fifo")],
    [S[1], w("uniform-cost"), 0.15, order("g")],
    [S[2], w("dives"), 0.12, lifo],
    ...R.map((r, L): [number, number, number, number[]] => {
      const ord = lifo.filter((k) => depth(k) <= L);
      return [r, r + 0.2, Math.min(0.08, ((R[L + 1] ?? Infinity) - r - 0.45) / ord.length), ord];
    }),
  ];
  const shown = (k: number) => phases.map(([, c0, dt, ord]) => (ord.includes(k) ? c0 + dt * ord.indexOf(k) : Infinity));
  const num = (k: number) => {
    const ts = shown(k);
    let p = -1;
    ts.forEach((x, i) => x <= t && (p = i));
    return p < 0 ? "" : String(phases[p][3].indexOf(k) + 1);
  };
  const numOp = (k: number) => at(t, 0, phases.flatMap(([r], i): Seg<number>[] => [[r, 0.15, 0], [shown(k)[i], 0.2, 1, E.p2o]]));
  const fill = (k: number) => at(t, FILL, phases.flatMap(([r, , , ord], i): Seg<string>[] => [[r, 0.2, FILL], [shown(k)[i], 0.25, tint(ord.indexOf(k)), E.p2o]]));
  // iterative deepening: every round the tree vanishes but for the root and regrows as the nodes are generated
  const vis = (k: number) =>
    at(t, 1, k === 1 ? [] : R.flatMap((r, L): Seg<number>[] => [[r, 0.15, 0], ...(depth(k) <= L ? [[shown(k)[3 + L], 0.3, 1, E.p2o] as Seg<number>] : [])]));
  const costOp = at(t, 0, [[cost, 0.3, 1, E.p2o], [S[2], 0.2, 0]]);
  const limitY = at(t, LY(0) + 77, R.slice(1).map((r, L): Seg<number> => [r, 0.3, LY(L + 1) + 77, E.p2o]));
  const stepCol = (i: number) =>
    at(t, MUTED, [
      ...S.map((s, j): Seg<string> => [s, 0.25, i === j ? ACC : i < j ? PREV : MUTED, E.p2o]),
      [comb, 0.25, i === 0 || i === 2 ? ACC : i === 3 ? INK : PREV, E.p2o],
    ]);

  return (
    <>
      <style>{css}</style>
      <svg id="b03-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <g style={fx(t, [0, 6], [arrive(w("a search"))])}>
          {NODES.slice(1).map((k) => {
            const [x1, y1] = POS[k >> 1], [x2, y2] = POS[k];
            return (
              <g key={k} style={{ opacity: vis(k) }}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={STROKE} strokeWidth="3" />
                <text className="b03-c" x={(x1 + x2) / 2 + (x2 < x1 ? -18 : 18)} y={(y1 + y2) / 2 + 9} opacity={costOp}>{COST[k]}</text>
              </g>
            );
          })}
          {NODES.map((k) => (
            <g key={k} style={{ opacity: vis(k) }}>
              <circle cx={POS[k][0]} cy={POS[k][1]} r="34" fill={fill(k)} stroke="#4b5a6e" strokeWidth="3" />
              <text className="b03-n" x={POS[k][0]} y={POS[k][1] + 11} opacity={numOp(k)}>{num(k)}</text>
              <text className="b03-g" x={POS[k][0]} y={POS[k][1] + 66} opacity={costOp}>g={g[k]}</text>
            </g>
          ))}
        </g>
        {/* iterative deepening: the depth limit, one level lower each round */}
        <line x1="192" x2="1728" y1={limitY} y2={limitY} stroke={MUTED} strokeWidth="2.5" strokeDasharray="12 9" style={fx(t, [0, 0], [[R[0], 0.3, 1, null, E.p2o]])} />
        {/* "it sounds wasteful": level i is generated d + 1 - i times */}
        {[0, 1, 2, 3].map((d) => (
          <text key={d} className="b03-x" x="1728" y={LY(d) + 11} style={fx(t, [0, 6], [[waste + 0.08 * d, 0.4, 1, 0, E.expo], [comb, 0.25, 0.35, null, E.p2o]])}>
            ×{4 - d}
          </text>
        ))}
      </svg>
      <div id="b03-head" style={fx(t, [1, 0], [out])}>
        {HEADS.map((h, i) => (
          <div key={h} style={fx(t, [0, 6], [[S[i] + 0.1, 0.4, 1, 0, E.p2o], [S[i + 1], 0.15, 0, 8, E.p2i]])}>
            {h === "Priority queue on g" ? (
              <>
                Priority queue on <i>g</i>
              </>
            ) : (
              h
            )}
          </div>
        ))}
        <div style={fx(t, [0, 6], [[S[3] + 0.1, 0.4, 1, 0, E.p2o]])}>
          Depth limit <i>L</i> ={" "}
          <span className="dig">
            {R.map((r, L) => (
              <span key={L} style={fx(t, [L ? 0 : 1, L ? 6 : 0], [...(L ? [[r, 0.25, 1, 0, E.p2o] as Fx] : []), ...(L < 3 ? [[R[L + 1], 0.15, 0, 8, E.p2i] as Fx] : [])])}>
                {L}
              </span>
            ))}
          </span>
        </div>
      </div>
      <div id="b03-steps" style={fx(t, [0, 6], [arrive(w("ordering")), out])}>
        {STEPS.map((s, i) => (
          <span key={s} style={{ color: stepCol(i) }}>{s}</span>
        ))}
      </div>
    </>
  );
};
