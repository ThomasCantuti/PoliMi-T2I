import { interpolateColors } from "remotion";
import { ACC, at, Beat, E, FILL, Fx, fx, INK, MUTED, OK, SOFT, STROKE, useTime } from "../anim";
import { actions, Board, Cell, cellsOf, GOAL, LAYERS, MINI, Move, NODES, pathTo, result, Space, START, Tiles, treeUpTo } from "./space";

const css = `
  #b02-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .b02-ct { font: 700 30px Inter, sans-serif; fill: #b4c0cc; }
  .b02-cv { font: 500 30px Inter, sans-serif; fill: #e6edf3; }
  .b02-l { font: 500 28px Inter, sans-serif; fill: #b4c0cc; }
  .b02-m { font: 500 26px Inter, sans-serif; fill: #7d8a99; }
  .b02-num { font: 700 64px Inter, sans-serif; text-anchor: middle; font-variant-numeric: tabular-nums; }
`;

// web/src/figs/search-8puzzle.ts (viewBox 640 x 330, cell 34) scaled so a cell is 60 px, right-aligned at 1728
const K = 60 / 34,
  ox = 1728 - 571 * K,
  oy = 200 - 14 * K;
const FX = (x: number) => ox + x * K,
  FY = (y: number) => oy + y * K;
const S0 = { x: FX(320), y: FY(65) }; // the state s
const ACTS = actions(START); // up, down, left
const KIDS = ACTS.map((a, k) => ({
  a,
  t: result(START, a),
  x: FX(320 + (k - 1) * 200),
  y: FY(251),
  x1: FX(320 + (k - 1) * 30),
  y1: FY(122),
  y2: FY(190),
}));
const MOVED = START.indexOf(0); // the tile that slid into the old blank square is highlighted
// the cards: the formulation table's rows for the 8-puzzle (content formulation.md)
const CARDS: [string, string][] = [
  ["state", "arrangement of 8 tiles + blank"],
  ["actions(s)", "moves of the blank: up, down, left"],
  ["result(s, a)", "swap blank and neighbour"],
];
const CY = (k: number) => 214 + 170 * k;

// "181,440 configurations": the tiles slide through a seeded walk of legal moves and back to s
const REV: Record<Move, Move> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
const WALK: Tiles[] = (() => {
  let seed = 11,
    t = START,
    last: Move | null = null;
  const fw = [START];
  for (let i = 0; i < 10; i++) {
    const as = actions(t).filter((a) => a !== (last && REV[last]));
    seed = (seed * 16807) % 2147483647;
    last = as[seed % as.length];
    t = result(t, last);
    fw.push(t);
  }
  return [...fw, ...fw.slice(0, -1).reverse()];
})();
const STEP = 0.09;
const walkCells = (u: number): Cell[] => {
  const k = Math.min(WALK.length - 1, Math.max(0, Math.floor(u))),
    p = E.p2io(Math.min(1, Math.max(0, u - k)));
  const a = WALK[k],
    b = WALK[Math.min(k + 1, WALK.length - 1)];
  return a.map((v, i) => {
    const j = b.indexOf(v),
      c = (i % 3) + ((j % 3) - (i % 3)) * p,
      r = Math.floor(i / 3) + (Math.floor(j / 3) - Math.floor(i / 3)) * p;
    return [v, c, r];
  });
};

// the state space: the goal (a node at depth 5) and the breadth-first tree growing to it
const PATH = pathTo(GOAL);
const TREE = treeUpTo(5).slice(1);

// eight queens: two empty boards (the initial state), the squares where actions(s) may add a queen
const QC = 50,
  QX = [376, 1144],
  QY = 250;
const QUEEN = "M-13 9h26v4h-26zM-12 7l-3-14 7 7 8-12 8 12 7-7-3 14z"; // the app's queen (viz/csp.ts)

const mix = (p: number, a: string, b: string) => interpolateColors(p, [0, 1], [a, b]);

export const Big = ({ dur, w }: Beat) => {
  const t = useTime();
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const take = w("take"),
    count = w("181,440"),
    desc = w("you describe");
  const c = [w("what a configuration"), w("which moves"), w("what a move")];
  const that = w("that description"),
    morph = w("defines"),
    huge = w("huge graph");
  const grows = [w("grows"), w("paths"), w("start"), w("hoping"), w("seeing")],
    goal = w("goal"),
    corner = w("tiny corner");
  const big = w("how big"),
    queens = w("for eight"),
    qIn = w("eight queens"),
    from = w("from about"),
    many = w("about 10"),
    down = w("down to"),
    two = w("two thousand");

  // shot 1 → 2: the board shuffles in the middle, then becomes s of the figure
  const toFan = at(t, 0, [[morph, 0.8, 1, E.p2io]]);
  const sx = at(t, 960, [
    [desc, 0.6, S0.x, E.p2io],
    [morph, 0.8, NODES[0].x, E.p2io],
  ]);
  const sy = at(t, 400, [
    [desc, 0.6, S0.y, E.p2io],
    [morph, 0.8, NODES[0].y, E.p2io],
  ]);
  const scell = at(t, 100, [
    [desc, 0.6, 60, E.p2io],
    [morph, 0.8, MINI, E.p2io],
  ]);
  const num = at(t, 1, [[morph, 0.3, 0]]);
  const n = Math.round(181440 * at(t, 0, [[count, 1.4, 1, E.p2o]]));
  // one accent at a time: card k (and its part of the figure) from its cue to the next one, until "that description"
  const lit = (k: number) =>
    at(t, 0, [
      [c[k], 0.25, 1, E.p2o],
      [k < 2 ? c[k + 1] : that, 0.25, 0, E.p2o],
    ]);
  const figOut: Fx = [that, 0.3, 0, 8, E.p2i];
  const arrive = (t0: number): Fx => [t0, 0.5, 1, 0, E.expo];
  // the state space and the tree: tree node at depth d grows at grows[d - 1]; on the path it turns green at "tiny corner"
  const layerOp = (d: number) =>
    at(t, 0, [
      [huge + 0.05 * d, 0.4, 0.45, E.p2o],
      [big, 0.4, 0.9, E.p2o],
    ]);
  const onPath = (i: number) => PATH.includes(i);
  const green = at(t, 0, [[corner, 0.3, 1, E.p2o]]);
  const treeCol = (i: number) => (onPath(i) ? mix(green, ACC, OK) : ACC);
  const spaceOut: Fx = [queens, 0.3, 0, 8, E.p2i];
  // queens: the left board's 64 squares, then the right board's leftmost column, each in the accent while named
  const qLeft = at(t, 0, [
    [from, 0.25, 1, E.p2o],
    [down, 0.25, 0.35, E.p2o],
  ]);
  const qRight = at(t, 0, [[down, 0.25, 1, E.p2o]]);

  return (
    <>
      <style>{css}</style>
      <svg id="b02-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <defs>
          <marker id="b02-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        <g style={fx(t, [1, 0], [spaceOut])}>
          {/* the state space, faint: the description defines it without drawing it */}
          <Space clip="b02-clip" op={layerOp}>
            {/* the search tree */}
            {TREE.map((i) => {
              const nd = NODES[i],
                p = NODES[nd.parent],
                g = at(t, 0, [[grows[nd.d - 1], 0.35, 1, E.p2o]]);
              return g > 0 ? (
                <line
                  key={i}
                  x1={p.x}
                  y1={p.y}
                  x2={p.x + (nd.x - p.x) * g}
                  y2={p.y + (nd.y - p.y) * g}
                  stroke={treeCol(i)}
                  strokeWidth={onPath(i) ? 3 + green : 3}
                  strokeLinecap="round"
                />
              ) : null;
            })}
            {TREE.filter((i) => NODES[i].d > 1).map((i) => (
              <circle key={i} cx={NODES[i].x} cy={NODES[i].y} r="7" fill={treeCol(i)} opacity={at(t, 0, [[grows[NODES[i].d - 1] + 0.25, 0.15, 1]])} />
            ))}
            <g style={fx(t, [0, 0], [[goal, 0.3, 1, null, E.p2o]])}>
              <circle cx={NODES[GOAL].x} cy={NODES[GOAL].y} r={at(t, 22, [[goal, 0.5, 15, E.expo]])} fill="none" stroke={OK} strokeWidth="4" />
              <text x={NODES[GOAL].x + 26} y={NODES[GOAL].y - 14} fontFamily="Inter" fontWeight="700" fontSize="28" fill={OK}>
                goal
              </text>
            </g>
          </Space>
        </g>

        {/* the figure: edges, labels and the three successors */}
        <g style={fx(t, [1, 0], [figOut])}>
          {KIDS.map(({ a, x, x1, y1, y2 }, k) => {
            const g = at(t, 0, [[c[1] + 0.08 * k, 0.4, 1, E.p2o]]);
            return (
              <g key={a} style={{ opacity: at(t, 0, [[c[1] + 0.08 * k, 0.1, 1]]) }}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x1 + (x - x1) * g}
                  y2={y1 + (y2 - y1) * g}
                  stroke={mix(lit(1), STROKE, ACC)}
                  strokeWidth="3"
                  markerEnd="url(#b02-ah)"
                />
                <text
                  className="b02-l"
                  x={(x1 + x) / 2 + (k - 1) * 24 + (k === 1 ? 18 : 0)}
                  y={(y1 + y2) / 2 + (k === 1 ? 10 : -8)}
                  textAnchor={k ? "start" : "end"}
                  style={fx(t, [0, 6], [arrive(c[1] + 0.08 * k)])}
                >
                  {a}
                </text>
              </g>
            );
          })}
          <text className="b02-l" x={FX(385)} y={S0.y + 4} fontStyle="italic" style={fx(t, [0, 6], [arrive(c[0])])}>
            s
          </text>
          <g style={fx(t, [0, 6], [arrive(c[1] + 0.3)])}>
            <text className="b02-m" x={FX(385)} y={S0.y + 50}>
              right: not applicable
            </text>
            <text className="b02-m" x={FX(385)} y={S0.y + 84}>
              (blank on the edge)
            </text>
          </g>
          {KIDS.map(({ a, x }, k) => (
            <text key={a} className="b02-m" x={x} y={FY(320) + 8} textAnchor="middle" style={fx(t, [0, 6], [arrive(c[2] + 0.1 * k + 0.1)])}>
              result(s, {a})
            </text>
          ))}
          <rect x={S0.x - 100} y={S0.y - 100} width="200" height="200" rx="16" fill="none" stroke={ACC} strokeWidth="3" opacity={lit(0)} />
        </g>

        {/* the boards: s, then its successors; on "defines" they shrink into the start of the state space */}
        {KIDS.map(({ a, t: tiles, x, y }, k) => {
          const nd = NODES[LAYERS[1][k]],
            t0 = c[2] + 0.1 * k;
          return (
            <g key={a} style={fx(t, [0, 6], [arrive(t0), spaceOut])}>
              <Board
                x={at(t, x, [[morph, 0.8, nd.x, E.p2io]])}
                y={at(t, y, [[morph, 0.8, nd.y, E.p2io]])}
                cell={at(t, 60, [[morph, 0.8, MINI, E.p2io]])}
                cells={cellsOf(tiles)}
                hi={tiles[MOVED]}
                hiP={at(t, 0, [
                  [t0, 0.25, 1, E.p2o],
                  [morph, 0.3, 0],
                ])}
                num={num}
              />
              <rect
                x={nd.x - 31}
                y={nd.y - 31}
                width="62"
                height="62"
                rx="8"
                fill="none"
                strokeWidth="3"
                stroke={treeCol(LAYERS[1][k])}
                opacity={toFan * at(t, 0, [[grows[0] + 0.25, 0.15, 1]])}
              />
            </g>
          );
        })}
        <g style={fx(t, [0, 6], [arrive(take), spaceOut])}>
          <Board x={sx} y={sy} cell={scell} cells={walkCells((t - count + 0.2) / STEP)} num={num} />
          <rect
            x={sx - 31}
            y={sy - 31}
            width="62"
            height="62"
            rx="8"
            fill="none"
            strokeWidth="3"
            stroke={mix(green, ACC, OK)}
            opacity={toFan * at(t, 0, [[grows[0], 0.15, 1]])}
          />
        </g>
        <text className="b02-num" x="960" y="660" fill={INK} style={fx(t, [0, 6], [arrive(count), [desc, 0.3, 0, 8, E.p2i]])}>
          {n.toLocaleString("en-US")}
        </text>

        {/* the cards */}
        {CARDS.map(([title, value], k) => (
          <g key={title} style={fx(t, [0, 6], [arrive(c[k]), figOut])}>
            <rect x="192" y={CY(k)} width="600" height="140" rx="14" strokeWidth="2.5" fill={mix(lit(k), FILL, SOFT)} stroke={mix(lit(k), STROKE, ACC)} />
            <text className="b02-ct" x="224" y={CY(k) + 56}>
              {title}
            </text>
            <text className="b02-cv" x="224" y={CY(k) + 104}>
              {value}
            </text>
          </g>
        ))}

        {/* eight queens: the same problem, two formulations */}
        {QX.map((x0, b) => {
          const on = b ? qRight : qLeft;
          return (
            <g key={x0} style={fx(t, [0, 6], [arrive(qIn + 0.1 * b)])}>
              <text className="b02-l" x={x0 + 4 * QC} y={QY - 30} textAnchor="middle">
                {b ? "leftmost empty column" : "any empty square"}
              </text>
              {Array.from({ length: 64 }, (_, i) => {
                const col = i % 8,
                  row = Math.floor(i / 8),
                  cand = b ? col === 0 : true;
                return (
                  <g key={i}>
                    <rect x={x0 + col * QC} y={QY + row * QC} width={QC} height={QC} fill={(row + col) % 2 ? "#232c38" : "#1c232d"} />
                    {cand && (
                      <path
                        d={QUEEN}
                        transform={`translate(${x0 + col * QC + QC / 2} ${QY + row * QC + QC / 2 + 1})`}
                        fill={mix(on, MUTED, ACC)}
                        opacity={at(t, 0, [[(b ? down : from) + 0.02 * col, 0.25, 1, E.p2o]]) * (0.35 + 0.65 * on)}
                      />
                    )}
                  </g>
                );
              })}
              <rect x={x0} y={QY} width={8 * QC} height={8 * QC} fill="none" stroke="#3a4757" strokeWidth="2" />
            </g>
          );
        })}
        <text
          className="b02-num"
          x={QX[0] + 4 * QC}
          y={QY + 8 * QC + 96}
          style={{
            ...fx(t, [0, 6], [arrive(many)]),
            fill: mix(at(t, 0, [[down, 0.25, 1, E.p2o]]), INK, MUTED),
          }}
        >
          1.8 × 10
          <tspan dy="-26" fontSize="38">
            14
          </tspan>
        </text>
        <text className="b02-num" x={QX[1] + 4 * QC} y={QY + 8 * QC + 96} fill={INK} style={fx(t, [0, 6], [arrive(two)])}>
          2,057
        </text>
      </svg>
    </>
  );
};
