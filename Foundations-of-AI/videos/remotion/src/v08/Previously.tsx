import { ACC, at, Beat, E, Fx, fx, MUTED, PREV, STROKE, useTime } from "../anim";
import { MapIntro } from "../shared/map";

const css = `
  #p08-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .p08-head { position: absolute; top: 104px; font: 700 68px/1.1 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
  .p08-row { font: 600 32px Inter, sans-serif; }
`;

// Figure 5.2 / 6.5 (the gametree presets of chapter 7): MAX over three MIN nodes, alpha-beta left to right.
const FIG52 = [[3, 12, 8], [2, 4, 6], [14, 5, 2]];
const alphaBeta = () => {
  let alpha = -Infinity;
  const kids = FIG52.map((leaves) => {
    let v = Infinity, read = 0;
    for (const x of leaves) {
      read++;
      v = Math.min(v, x);
      if (v <= alpha) break; // MIN prunes when v ≤ α
    }
    alpha = Math.max(alpha, v);
    return { v, read, bound: read < leaves.length };
  });
  return { root: alpha, kids };
};
const AB = alphaBeta();
const V_MAX = "#7c8cff", V_MIN = "#f778ba", BAD = "#f85149", PRUNED = "#4a5361";

// left column: the tree; right column: the Go board. Rows at the bottom pair each requirement with Go's answer.
const LEAF_X = (i: number) => 228 + 84 * i, MIN_X = (j: number) => LEAF_X(3 * j + 1), ROOT_X = MIN_X(1);
const ROOT_Y = 290, MIN_Y = 455, LEAF_Y = 620, ROW1 = 760, ROW2 = 820;
const GX = 1254, GY = 236, GS = 450, GP = GS / 18;
// an early-game position, hand placed (no stone on another)
const BLACK = [[3, 3], [15, 3], [3, 15], [15, 15], [9, 3], [2, 9], [16, 10], [13, 16], [5, 16], [12, 2], [16, 13], [6, 4], [10, 9], [3, 12]];
const WHITE = [[2, 5], [16, 5], [5, 15], [14, 13], [9, 16], [15, 7], [11, 4], [3, 10], [13, 9], [16, 16], [6, 2], [8, 10], [2, 13]];
const STAR = [3, 9, 15].flatMap((a) => [3, 9, 15].map((b) => [a, b]));
const taken = new Set([...BLACK, ...WHITE].map(([a, b]) => `${a},${b}`));
const EMPTY = Array.from({ length: 361 }, (_, i) => [i % 19, Math.floor(i / 19)]).filter(([a, b]) => !taken.has(`${a},${b}`));

export const Previously = ({ dur, w }: Beat) => {
  const t = useTime();
  const out = w("a branching") - 0.5;
  const tree = Math.max(out, 2.4) + 0.45; // after the map has zoomed away
  const branch = w("factor"), small = w("small enough"), evalT = w("an evaluation"), pos = w("the positions");
  const go = w("go has"), n250 = w("250"), chess = w("against"), nobody = w("nobody");
  const exit: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const arrive = (t0: number): Fx => [t0, 0.5, 1, 0, E.expo];
  const edgeCol = at(t, STROKE, [[branch, 0.25, ACC, E.p2o], [evalT, 0.25, STROKE, E.p2o]]);
  const leafCol = at(t, STROKE, [[pos, 0.25, ACC, E.p2o], [go, 0.25, STROKE, E.p2o]]);
  const rowCol = (off: number) => at(t, ACC, [[off, 0.25, PREV, E.p2o]]); // each requirement is lit while it is named
  const dots = at(t, 1, [[nobody, 0.4, 0, E.p2o]]);

  return (
    <>
      <MapIntro here={8} from={[7, 6]} out={out} />
      <style>{css}</style>
      <svg id="p08-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [exit])}>
        {/* the alpha-beta tree, values and cuts as alpha-beta leaves them */}
        <g style={fx(t, [0, 6], [arrive(tree)])}>
          {AB.kids.map((_, j) => (
            <line key={j} x1={ROOT_X} y1={ROOT_Y + 26} x2={MIN_X(j)} y2={MIN_Y - 26} strokeWidth={at(t, 3, [[branch, 0.25, 5, E.p2o], [evalT, 0.25, 3, E.p2o]])} style={{ stroke: edgeCol }} />
          ))}
          {FIG52.flatMap((leaves, j) =>
            leaves.map((_, i) => {
              const cut = i >= AB.kids[j].read, lx = LEAF_X(3 * j + i), mx = MIN_X(j), y1 = MIN_Y + 26, y2 = LEAF_Y - 24;
              const cx = mx + (lx - mx) * 0.4, cy = y1 + (y2 - y1) * 0.4, len = Math.hypot(lx - mx, y2 - y1);
              const nx = (-(y2 - y1) / len) * 14, ny = ((lx - mx) / len) * 14;
              return (
                <g key={`${j}${i}`}>
                  <line x1={mx} y1={y1} x2={lx} y2={y2} stroke={cut ? PRUNED : STROKE} strokeWidth="3" strokeDasharray={cut ? "8 8" : undefined} />
                  {cut && <line x1={cx - nx} y1={cy - ny} x2={cx + nx} y2={cy + ny} stroke={BAD} strokeWidth="4" strokeLinecap="round" />}
                </g>
              );
            }),
          )}
          <path d={`M${ROOT_X},${ROOT_Y - 30} L${ROOT_X + 34},${ROOT_Y + 26} L${ROOT_X - 34},${ROOT_Y + 26} Z`} fill="#1c232d" stroke={V_MAX} strokeWidth="3.5" strokeLinejoin="round" />
          <text x={ROOT_X} y={ROOT_Y + 18} textAnchor="middle" fontFamily="Inter" fontSize="26" fontWeight="700" fill="#b4c0cc">A</text>
          <text x={ROOT_X + 52} y={ROOT_Y + 12} fontFamily="Inter" fontSize="32" fontWeight="700" fill={V_MAX}>{AB.root}</text>
          {AB.kids.map((k, j) => (
            <g key={j}>
              <path d={`M${MIN_X(j)},${MIN_Y + 30} L${MIN_X(j) + 34},${MIN_Y - 26} L${MIN_X(j) - 34},${MIN_Y - 26} Z`} fill="#1c232d" stroke={V_MIN} strokeWidth="3.5" strokeLinejoin="round" />
              <text x={MIN_X(j)} y={MIN_Y + 2} textAnchor="middle" fontFamily="Inter" fontSize="26" fontWeight="700" fill="#b4c0cc">{"BCD"[j]}</text>
              <text x={MIN_X(j) + 50} y={MIN_Y + 4} fontFamily="Inter" fontSize="32" fontWeight="700" fill={V_MIN}>{k.bound ? `≤ ${k.v}` : k.v}</text>
            </g>
          ))}
          {FIG52.flatMap((leaves, j) =>
            leaves.map((v, i) => {
              const cut = i >= AB.kids[j].read;
              return (
                <g key={`${j}${i}`} opacity={cut ? 0.32 : 1}>
                  <rect x={LEAF_X(3 * j + i) - 32} y={LEAF_Y - 24} width="64" height="48" rx="10" fill="#1c232d" strokeWidth={cut ? 2.5 : 3} strokeDasharray={cut ? "6 6" : undefined} style={{ stroke: cut ? STROKE : leafCol }} />
                  <text x={LEAF_X(3 * j + i)} y={LEAF_Y + 10} textAnchor="middle" fontFamily="Inter" fontSize="28" fontWeight="600" fill="#b4c0cc">{v}</text>
                </g>
              );
            }),
          )}
        </g>

        {/* what alpha-beta needs */}
        <text className="p08-row" x="192" y={ROW1} style={{ ...fx(t, [0, 6], [[small, 0.4, 1, 0, E.p2o]]), fill: rowCol(evalT) }}>small branching factor</text>
        <text className="p08-row" x="192" y={ROW2} style={{ ...fx(t, [0, 6], [[evalT, 0.4, 1, 0, E.p2o]]), fill: rowCol(go) }}>evaluation function e(s)</text>

        {/* Go: a 19 × 19 board, every empty point a legal move */}
        <g style={fx(t, [0, 6], [arrive(go)])}>
          <rect x={GX - 22} y={GY - 22} width={GS + 44} height={GS + 44} rx="12" fill="#2b3544" stroke="#3a4757" strokeWidth="2" />
          {Array.from({ length: 19 }, (_, i) => (
            <g key={i} stroke="#5b6b80" strokeWidth="1.5">
              <line x1={GX} x2={GX + GS} y1={GY + i * GP} y2={GY + i * GP} />
              <line y1={GY} y2={GY + GS} x1={GX + i * GP} x2={GX + i * GP} />
            </g>
          ))}
          {STAR.map(([a, b]) => <circle key={`${a},${b}`} cx={GX + a * GP} cy={GY + b * GP} r="4.5" fill="#7d8a99" />)}
          {EMPTY.map(([a, b]) => (
            <circle key={`${a},${b}`} cx={GX + a * GP} cy={GY + b * GP} r="4.5" fill={ACC} opacity={Math.min(dots, at(t, 0, [[n250 + 0.012 * (a + b), 0.25, 1, E.p2o]]))} />
          ))}
          {BLACK.map(([a, b]) => <circle key={`b${a},${b}`} cx={GX + a * GP} cy={GY + b * GP} r="11" fill="#0e1116" stroke="#0e1116" strokeWidth="2" />)}
          {WHITE.map(([a, b]) => <circle key={`w${a},${b}`} cx={GX + a * GP} cy={GY + b * GP} r="11" fill="#e6edf3" stroke="#9aa5b5" strokeWidth="2" />)}
        </g>
        <text className="p08-row" x={GX} y={ROW1} style={fx(t, [0, 6], [[n250, 0.4, 1, 0, E.p2o]])}>
          <tspan fill={BAD}>b ≈ 250</tspan>
          <tspan fill={MUTED} fillOpacity={at(t, 0, [[chess, 0.4, 1, E.p2o]])}> (chess ≈ 20–35)</tspan>
        </text>
        <text className="p08-row" x={GX} y={ROW2} fill={BAD} style={fx(t, [0, 6], [[nobody, 0.4, 1, 0, E.p2o]])}>e(s) = ?</text>
      </svg>
      <div className="p08-head" style={{ left: 192, ...fx(t, [0, 6], [arrive(tree), exit]) }}>Alpha-beta</div>
      <div className="p08-head" style={{ left: GX - 22, ...fx(t, [0, 6], [arrive(go), exit]) }}>Go</div>
    </>
  );
};
