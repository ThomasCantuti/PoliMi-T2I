import { ACC, at, Beat, E, Fx, fx, SOFT, useTime } from "../anim";
import { MapIntro } from "../shared/map";

const MIN = "#f778ba", BAD = "#f85149";
const css = `
  #p07-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .p07-m { font-family: Inter, sans-serif; font-weight: 700; text-anchor: middle; dominant-baseline: central; }
`;

// Tic-tac-toe as drawn by web/src/figs/adv-ttt-eval.ts: inner grid lines only, X in the MAX color, O in the MIN color.
// X plans the diagonal 0 → 4 → 8; after X's first move O takes the center.
const PLAN = [0, 4, 8], O_CELL = 4;
// a strategy: X's answer to each of O's eight replies, the move minimax_search returns (first best, cells in order)
const REPLIES = [1, 2, 3, 4, 5, 6, 7, 8], ANSWER = [3, 3, 1, 1, 2, 1, 2, 2];
const BC = 140, BX = 750, BY = 200; // the big board: cell, left, top
const RC = 60, RX = 960 - 1.5 * RC, RY = 200; // the root it shrinks into
const MC = 52, MS = 197, MX = 960 - (7 * MS + 3 * MC) / 2, MY = 560; // the reply boards
const ctr = (i: number, c: number) => [(i % 3 + 0.5) * c, (Math.floor(i / 3) + 0.5) * c];
const mark = (p: "X" | "O") => (p === "X" ? ACC : MIN);

const Grid = ({ c, w = 3 }: { c: number; w?: number }) => (
  <>
    {[1, 2].map((i) => (
      <g key={i} stroke="#3a4757" strokeWidth={w}>
        <line x1={i * c} y1={0} x2={i * c} y2={3 * c} vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={i * c} x2={3 * c} y2={i * c} vectorEffect="non-scaling-stroke" />
      </g>
    ))}
  </>
);
const Mark = ({ p, i, c, style }: { p: "X" | "O"; i: number; c: number; style?: React.CSSProperties }) => {
  const [x, y] = ctr(i, c);
  return <text className="p07-m" x={x} y={y + 2} fontSize={c * 0.6} fill={mark(p)} style={style}>{p}</text>;
};

export const Previously = ({ dur, w }: Beat) => {
  const t = useTime();
  const board = w("before moving"), plan = w("moving"), opp = w("an opponent"), first = w("the plan"), breaks = w("breaks");
  const shrink = w("what you should"), replies = w("depends on"), did = w("what they did"), answer = w("an answer");
  const landed = breaks + 0.35;
  const out = fx(t, [1, 0], [[dur - 0.25, 0.2, 0, 8, E.p2i]]);
  const arrive = (t1: number, d = 0.45): Fx => [t1, d, 1, 0, E.expo];
  const s = at(t, 1, [[shrink, 0.6, RC / BC, E.p2io]]);
  // the plan: numbered steps along the diagonal; after O lands on step 2 what is left of it turns red, then goes
  const red = at(t, ACC, [[landed, 0.25, BAD, E.p2o]]);
  const planOut: Fx = [shrink, 0.25, 0, 8, E.p2i];
  const seg = (a: number, b: number) => {
    const [x1, y1] = ctr(a, BC), [x2, y2] = ctr(b, BC), u = 44 / Math.SQRT2;
    return { x1: x1 + u, y1: y1 + u, x2: x2 - u, y2: y2 - u };
  };
  // O: beside the board, then onto the center, then down into its own reply board
  const [ox0, oy0] = [BX + 3 * BC + 130, BY + 1.5 * BC], oc = ctr(O_CELL, BC);
  const k4 = REPLIES.indexOf(O_CELL), [rx4, ry4] = ctr(O_CELL, MC);
  const ox = at(t, ox0, [[breaks, 0.35, BX + oc[0], E.p2io], [shrink, 0.6, MX + k4 * MS + rx4, E.p2io]]);
  const oy = at(t, oy0, [[breaks, 0.35, BY + oc[1], E.p2io], [shrink, 0.6, MY + ry4, E.p2io]]);
  const os = at(t, 1, [[shrink, 0.6, MC / BC, E.p2io]]);

  return (
    <>
      <MapIntro here={7} from={[3, 1]} out={w("of actions")} />
      <style>{css}</style>
      <svg id="p07-svg" viewBox="0 0 1920 1080" style={out}>
        <defs>
          <marker id="p07-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* the board; on "what you should do next" it becomes the root of the strategy */}
        <g
          style={fx(t, [0, 6], [arrive(board)])}
          transform={`translate(${at(t, BX, [[shrink, 0.6, RX, E.p2io]])} ${at(t, BY, [[shrink, 0.6, RY, E.p2io]])}) scale(${s})`}
        >
          <Grid c={BC} w={4} />
          <g style={fx(t, [1, 0], [planOut])}>
            {[[0, 4], [4, 8]].map(([a, b], k) => (
              <line
                key={a} {...seg(a, b)} strokeWidth="4" strokeDasharray="12 10" markerEnd="url(#p07-ah)"
                style={{ ...fx(t, [0, 0], [[plan + 0.2 * (k + 1) - 0.1, 0.3, 1, null, E.p2o]]), stroke: red }}
              />
            ))}
            {PLAN.map((i, k) => {
              const [x, y] = ctr(i, BC);
              const gone = k === 0 ? first : k === 1 ? landed - 0.1 : Infinity;
              return (
                <g key={i} style={fx(t, [0, 6], [arrive(plan + 0.2 * k, 0.35), [gone, 0.2, 0, null, E.p2i]])}>
                  <circle cx={x} cy={y} r="34" fill="#0e1116" strokeWidth="4" style={{ stroke: k ? red : ACC }} />
                  <text className="p07-m" x={x} y={y + 2} fontSize="34" style={{ fill: k ? red : ACC }}>{k + 1}</text>
                </g>
              );
            })}
          </g>
          <Mark p="X" i={PLAN[0]} c={BC} style={fx(t, [0, 6], [arrive(first, 0.35)])} />
        </g>
        <g transform={`translate(${ox} ${oy}) scale(${os})`} style={fx(t, [0, 6], [arrive(opp)])}>
          <text className="p07-m" x="0" y="2" fontSize={BC * 0.6} fill={MIN}>O</text>
        </g>

        {/* every reply O could make, each with X's answer */}
        {REPLIES.map((o, k) => {
          const x = MX + k * MS, [ax, ay] = ctr(ANSWER[k], MC), isDid = o === O_CELL;
          const tk = replies + 0.05 * k, ta = answer + 0.08 * k;
          return (
            <g key={o}>
              <line
                x1={960} y1={RY + 3 * RC + 14} x2={x + 1.5 * MC} y2={MY - 14} strokeWidth="3"
                style={{ ...fx(t, [0, 0], [[tk, 0.3, 1, null, E.p2o]]), stroke: isDid ? at(t, "#3a4757", [[did, 0.25, MIN, E.p2o]]) : "#3a4757" }}
              />
              <g transform={`translate(${x} ${MY})`}>
                <rect
                  x={-12} y={-12} width={3 * MC + 24} height={3 * MC + 24} rx="12" fill="none" stroke={MIN} strokeWidth="3"
                  opacity={isDid ? at(t, 0, [[did, 0.25, 1, E.p2o]]) : 0}
                />
                <g style={fx(t, [0, 6], [arrive(tk, 0.4)])}>
                  <Grid c={MC} />
                  <Mark p="X" i={0} c={MC} />
                  {!isDid && <Mark p="O" i={o} c={MC} />}
                </g>
                <g style={fx(t, [0, 6], [arrive(ta, 0.35)])}>
                  <rect x={ax - MC / 2 + 3} y={ay - MC / 2 + 3} width={MC - 6} height={MC - 6} rx="6" fill={SOFT} />
                  <Mark p="X" i={ANSWER[k]} c={MC} />
                </g>
              </g>
            </g>
          );
        })}
      </svg>
    </>
  );
};
