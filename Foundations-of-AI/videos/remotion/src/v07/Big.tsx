import { at, Beat, E, Fx, fx, INK, OK, PREV, Seg, useTime } from "../anim";

const VMAX = "#7c8cff", VMIN = "#f778ba", BAD = "#f85149", WARN = "#e3b341", EDGE = "#3a4757";
const css = `
  #b07-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #b07-ttl { position: absolute; left: 192px; top: 96px; width: 900px; height: 80px; }
  #b07-ttl div { position: absolute; left: 0; top: 0; font: 700 60px/1.15 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; white-space: nowrap; }
  .b07-nm { font: 700 28px Inter, sans-serif; text-anchor: middle; }
  .b07-v { font: 700 34px Inter, sans-serif; font-variant-numeric: tabular-nums; }
  .b07-lv { font: 600 30px Inter, sans-serif; text-anchor: middle; font-variant-numeric: tabular-nums; }
  .b07-lb { font: 700 28px Inter, sans-serif; }
  .b07-m { font: 700 32px Inter, sans-serif; text-anchor: middle; dominant-baseline: central; }
`;

// Figure 5.2 as the gametree visualizer draws it (MAX ▲, MIN ▼, leaves as boxes), scaled 2.2×: A over B, C, D.
const K = 2.2;
const LEAVES = [3, 12, 8, 2, 4, 6, 14, 5, 2];
const LX = (i: number) => 960 + (i - 4) * 145, AY = 250, MY = 430, LY = 610;
const MIN_X = [1, 4, 7].map(LX), MIN_V = [3, 2, 2], MIN_LEAF = [0, 3, 8]; // MIN's best reply under B, C, D
const PRUNED = [4, 5]; // alpha-beta (Figure 6.5): C is cut after its first leaf, 2 ≤ α = 3
const leafW = (v: number) => Math.max(30, String(v).length * 8.2 + 12) * K;
const TRI_UP = `M0 ${-15 * K} L${17 * K} ${13 * K} L${-17 * K} ${13 * K} Z`, TRI_DN = `M0 ${15 * K} L${17 * K} ${-13 * K} L${-17 * K} ${-13 * K} Z`;
// the tic-tac-toe position of the evaluation-function figure (adv-ttt-eval.ts): X center, O right edge, e = 6 − 4 = 2
const TTT: [number, "X" | "O"][] = [[4, "X"], [5, "O"]], TC = 54, TX = LX(3) - 1.5 * TC, TY = 696;

export const Big = ({ dur, w }: Beat) => {
  const t = useTime();
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const max = w("max"), moves = w("for each move"), imagine = w("imagine"), reply = w("best reply"), worst = w("worst case");
  const pick = w("whose worst"), best = w("is best"), flow = w("flow up"), ab = w("alpha-beta"), same = w("same answer");
  const skip = w("skipping"), real = w("real games"), deep = w("too deep"), stop = w("stop at"), limit = w("depth limit");
  const score = w("score the position"), evalF = w("evaluation function");
  const TITLES: [number, string][] = [[w("minimax"), "Minimax"], [ab, "Alpha-beta"], [limit, "Depth-limited search"]];
  const col = (init: string, segs: [number, string, number?][]) => at(t, init, segs.map(([t0, c, d = 0.25]): Seg<string> => [t0, d, c, E.p2o]));
  const pruned = (i: number) => PRUNED.includes(i);
  const edge = (x1: number, y1: number, x2: number, y2: number, stroke: string, width: number, extra: React.SVGProps<SVGLineElement> = {}) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" style={{ stroke }} strokeWidth={width} {...extra} />
  );

  return (
    <>
      <style>{css}</style>
      <svg id="b07-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <g style={fx(t, [0, 6], [[0, 0.4, 1, 0, E.expo]])}>
          <text className="b07-lb" x="192" y={AY + 10} fill={VMAX}>MAX</text>
          <text className="b07-lb" x="192" y={MY + 10} fill={VMIN}>MIN</text>

          {/* edges: MAX's moves, MIN's replies; the best move goes green, alpha-beta's cut-off is dashed */}
          {MIN_X.map((x, m) => {
            const isBest = m === 0;
            return (
              <g key={m}>
                {edge(960, AY + 13 * K, x, MY - 14 * K, col(EDGE, [[moves + 0.15 * m, PREV], ...(isBest ? [[best, OK] as [number, string]] : [])]),
                  at(t, 3, [[moves + 0.15 * m, 0.25, 4, E.p2o], ...(isBest ? [[best, 0.25, 7, E.p2o] as Seg<number>] : [])]))}
                {[0, 1, 2].map((j) => {
                  const i = 3 * m + j, isMin = MIN_LEAF[m] === i;
                  const stroke = col(EDGE, [
                    [imagine + 0.04 * i, PREV],
                    ...(isMin ? [[reply, VMIN] as [number, string]] : []),
                    ...(i === 0 ? [[flow + 0.15, OK] as [number, string]] : []),
                    ...(pruned(i) ? [[skip + 0.15 * (i - 4), "#4a5361"] as [number, string]] : []),
                  ]);
                  const width = at(t, 3, [[imagine + 0.04 * i, 0.25, 4, E.p2o], ...(i === 0 ? [[flow + 0.15, 0.25, 7, E.p2o] as Seg<number>] : [])]);
                  const cut = pruned(i) && t >= skip + 0.15 * (i - 4);
                  return <g key={j}>{edge(x, MY + 13 * K, LX(i), LY - 12 * K, stroke, width, cut ? { strokeDasharray: "9 9" } : {})}</g>;
                })}
              </g>
            );
          })}

          {/* alpha-beta's cut marks on C's last two edges */}
          {PRUNED.map((i, k) => {
            const x1 = MIN_X[1], y1 = MY + 13 * K, x2 = LX(i), y2 = LY - 12 * K;
            const cx = x1 + (x2 - x1) * 0.4, cy = y1 + (y2 - y1) * 0.4, len = Math.hypot(x2 - x1, y2 - y1);
            const nx = (-(y2 - y1) / len) * 16, ny = ((x2 - x1) / len) * 16;
            return (
              <line
                key={i} x1={cx - nx} y1={cy - ny} x2={cx + nx} y2={cy + ny} stroke={BAD} strokeWidth="5" strokeLinecap="round"
                opacity={at(t, 0, [[skip + 0.15 * k, 0.2, 1, E.p2o], [real, 0.3, 0.5, E.p2o]])}
              />
            );
          })}

          {/* too deep: the tree goes on below every leaf that was read, until the depth limit cuts it */}
          {LEAVES.map((_, i) =>
            pruned(i) ? null : (
              <g key={i} style={{ opacity: at(t, 0, [[deep + 0.03 * i, 0.3, 0.7, E.p2o], [stop, 0.3, 0, E.p2i]]) }}>
                {[-30, 0, 30].map((dx) => <g key={dx}>{edge(LX(i), LY + 12 * K + 4, LX(i) + dx, 720, EDGE, 3, { strokeDasharray: "5 7" })}</g>)}
              </g>
            ),
          )}
          <g style={fx(t, [0, 6], [[limit, 0.4, 1, 0, E.expo]])}>
            <line x1="192" y1="660" x2="1728" y2="660" stroke={WARN} strokeWidth="3" strokeDasharray="12 10" />
            <text className="b07-lb" x="192" y="702" fill={WARN}>depth limit</text>
          </g>

          {/* the root ring: "you are MAX", then the same answer under alpha-beta */}
          <circle cx="960" cy={AY} r={24 * K} fill="none" strokeWidth="4.5"
            style={{ stroke: at(t, VMAX, [[same, 0.01, OK]]), opacity: at(t, 0, [[max, 0.25, 0.6, E.p2o], [moves, 0.3, 0, E.p2o], [same, 0.25, 0.9, E.p2o], [real, 0.3, 0, E.p2o]]) }}
          />

          {/* nodes */}
          <g>
            <path d={TRI_UP} transform={`translate(960 ${AY})`} strokeWidth="4" strokeLinejoin="round" stroke={VMAX} style={{ fill: col("#1c232d", [[pick, VMAX]]) }} />
            <text className="b07-nm" x="960" y={AY + 8 * K} style={{ fill: col("#b4c0cc", [[pick, "#ffffff"]]) }}>A</text>
            <text className="b07-v" x={960 + 27 * K} y={AY + 5 * K} fill={VMAX} style={fx(t, [0, 6], [[pick, 0.3, 1, 0, E.p2o]])}>3</text>
            <text className="b07-v" x={885} y={AY + 5 * K} fill={VMAX} textAnchor="end" style={fx(t, [0, 6], [[ab + 0.3, 0.3, 1, 0, E.p2o], [real, 0.3, 0, null, E.p2o]])}>
              α = 3
            </text>
          </g>
          {MIN_X.map((x, m) => {
            const tv = worst + 0.12 * m;
            return (
              <g key={m}>
                <path d={TRI_DN} transform={`translate(${x} ${MY})`} strokeWidth="4" strokeLinejoin="round" stroke={VMIN} style={{ fill: col("#1c232d", [[tv, VMIN]]) }} />
                <text className="b07-nm" x={x} y={MY - 1.5 * K} style={{ fill: col("#b4c0cc", [[tv, "#ffffff"]]) }}>{"BCD"[m]}</text>
                <text className="b07-v" x={x + 27 * K} y={MY + 5 * K} fill={VMIN} style={fx(t, [0, 6], [[tv, 0.3, 1, 0, E.p2o], ...(m === 1 ? [[skip + 0.3, 0.15, 0, 8, E.p2i] as Fx] : [])])}>
                  {MIN_V[m]}
                </text>
                {m === 1 && (
                  <text className="b07-v" x={x + 27 * K} y={MY + 5 * K} fill={VMIN} style={fx(t, [0, 6], [[skip + 0.4, 0.25, 1, 0, E.p2o]])}>≤2</text>
                )}
              </g>
            );
          })}
          {LEAVES.map((v, i) => {
            const lit = imagine + 0.04 * i, lw = leafW(v), green = i === 0 ? [[flow, OK] as [number, string]] : [];
            const warn = i === 3 ? [[evalF, WARN] as [number, string]] : [];
            return (
              <g
                key={i} transform={`translate(${LX(i)} ${LY})`}
                style={{ opacity: at(t, 0.45, [[lit, 0.25, 1, E.p2o], ...(pruned(i) ? [[skip + 0.15 * (i - 4), 0.25, 0.32, E.p2o] as Seg<number>] : [])]) }}
              >
                <rect
                  x={-lw / 2} y={-12 * K} width={lw} height={24 * K} rx={6 * K} strokeWidth="3"
                  strokeDasharray={pruned(i) && t >= skip + 0.15 * (i - 4) ? "7 7" : undefined}
                  style={{ fill: col("#1c232d", [[lit, "#232c38"]]), stroke: col("#4b5a6e", [[lit, "#b4c0cc"], ...green, ...warn]) }}
                />
                <text className="b07-lv" y={10} style={{ fill: col("#b4c0cc", [[lit, INK]]) }}>{v}</text>
              </g>
            );
          })}

          {/* the evaluation function scores the position where the search stops */}
          <g style={fx(t, [0, 6], [[score, 0.45, 1, 0, E.expo]])}>
            <line x1={LX(3)} y1={LY + 12 * K + 6} x2={LX(3)} y2={TY - 10} stroke={WARN} strokeWidth="3" strokeDasharray="3 7" strokeLinecap="round" />
            <g transform={`translate(${TX} ${TY})`}>
              {[1, 2].map((i) => (
                <g key={i} stroke="#3a4757" strokeWidth="3">
                  <line x1={i * TC} y1={0} x2={i * TC} y2={3 * TC} />
                  <line x1={0} y1={i * TC} x2={3 * TC} y2={i * TC} />
                </g>
              ))}
              {TTT.map(([c, p]) => (
                <text key={c} className="b07-m" x={(c % 3 + 0.5) * TC} y={(Math.floor(c / 3) + 0.5) * TC + 2} fill={p === "X" ? VMAX : VMIN}>{p}</text>
              ))}
            </g>
          </g>
          <text className="b07-v" x={TX + 3 * TC + 40} y={TY + 1.5 * TC + 12} fill={INK} style={fx(t, [0, 6], [[evalF, 0.35, 1, 0, E.p2o]])}>
            e = 6 − 4 = 2
          </text>
        </g>
      </svg>
      <div id="b07-ttl" style={fx(t, [1, 0], [out])}>
        {TITLES.map(([t0, text], k) => (
          <div key={text} style={fx(t, [0, 0], [[t0 + 0.1, 0.25, 1, 0, E.p2o, [0, 6]], ...(k + 1 < TITLES.length ? [[TITLES[k + 1][0], 0.15, 0, 8, E.p2i] as Fx] : [])])}>
            {text}
          </div>
        ))}
      </div>
    </>
  );
};
