import { ACC, at, Beat, E, fx, INK, OK, SOFT, useTime } from "../anim";
import { MapIntro } from "../shared/map";

const BAD = "#f85149", BAD_SOFT = "rgba(248,81,73,0.14)";
const css = `
  #p06-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .p06-nd text { font: 600 28px Inter, sans-serif; text-anchor: middle; }
  .p06-lb { font: 600 28px Inter, sans-serif; fill: #7d8a99; text-anchor: middle; }
`;

// 8-queens with plain backtracking, as the CSP visualizer runs it (no inference, static order X1..X8, rows tried 1..8):
// the first solution is (1, 5, 8, 6, 3, 7, 2, 4), after 113 assignments. Drawn as the app's search tree, but only the
// solution path and the failed siblings of its nodes, in the order they were tried (their own subtrees left out).
// [label, depth, slot left of the path (0 = on the path), failed]
const TREE: [string, number, number, boolean][] = [
  ["{ }", 0, 0, false], ["X1=1", 1, 0, false],
  ["X2=3", 2, 2, true], ["X2=4", 2, 1, true], ["X2=5", 2, 0, false],
  ["X3=2", 3, 2, true], ["X3=7", 3, 1, true], ["X3=8", 3, 0, false],
  ["X4=2", 4, 1, true], ["X4=6", 4, 0, false],
  ["X5=3", 5, 0, false], ["X6=7", 6, 0, false], ["X7=2", 7, 0, false], ["X8=4", 8, 0, false],
];
const SOL = [1, 5, 8, 6, 3, 7, 2, 4];
const PX = 504, GX = 130, TY = 190, GY = 82, NW = 104, NH = 44;
const nx = (slot: number) => PX - slot * GX, ny = (d: number) => TY + d * GY;
const pathAt = (d: number) => TREE.findIndex(([, dd, slot]) => dd === d && slot === 0);

// the board: column = variable Xi, row = value (1 = top), as in the CSP visualizer
const CS = 76, BY = 210, BX0 = 1040, BX1 = 960 - 4 * CS;
const QUEEN = "M-13 9h26v4h-26zM-12 7l-3-14 7 7 8-12 8 12 7-7-3 14z";

export const Previously = ({ dur, w }: Beat) => {
  const t = useTime();
  // the tree grows from "assignment" to "that led", one node per tick; the last node is the solution on "there"
  const t0 = w("from an empty"), g0 = w("assignment"), step = (w("that led") - g0) / (TREE.length - 2);
  const born = (k: number) => (k === 0 ? t0 : g0 + (k - 1) * step);
  const sol = w("there"), dim = w("doesn't matter"), center = w("the final board"), away = w("throw away");
  const out = fx(t, [1, 0], [[dur - 0.25, 0.2, 0, 8, E.p2i]]);
  const arrive = (t1: number) => fx(t, [0, 6], [[t1, 0.4, 1, 0, E.expo]]);

  return (
    <>
      <MapIntro here={6} from={[5, 4]} out={w("time")} />
      <style>{css}</style>
      <svg id="p06-svg" viewBox="0 0 1920 1080" style={out}>
        <defs>
          <path id="p06-q" d={QUEEN} transform={`scale(${CS / 46})`} />
        </defs>

        {/* the search tree: current node filled, path outlined in the accent, failed siblings red */}
        <g style={fx(t, [1, 0], [[dim, 0.3, 0.3, null, E.p2o], [away, 0.4, 0, 8, E.p2i]])}>
          {TREE.map(([, d, slot, failed], k) => {
            if (!d) return null;
            return (
              <line
                key={k}
                x1={nx(0)} y1={ny(d - 1) + NH / 2} x2={nx(slot)} y2={ny(d) - NH / 2}
                stroke={failed ? "#3a4757" : ACC} strokeWidth={failed ? 3 : 4}
                opacity={at(t, 0, [[born(k), 0.25, 1, E.p2o]])}
              />
            );
          })}
          {TREE.map(([label, d, slot, failed], k) => {
            const next = born(k + 1), last = k === TREE.length - 1;
            const done = failed ? BAD_SOFT : SOFT, edge = failed ? BAD : ACC;
            return (
              <g key={label} className="p06-nd" style={arrive(born(k))}>
                <rect
                  x={nx(slot) - NW / 2} y={ny(d) - NH / 2} width={NW} height={NH} rx={NH / 2} strokeWidth="3"
                  style={{
                    fill: at(t, ACC, last ? [[sol, 0.25, OK, E.p2o]] : [[next, 0.25, done, E.p2o]]),
                    stroke: at(t, ACC, last ? [[sol, 0.25, OK, E.p2o]] : [[next, 0.25, edge, E.p2o]]),
                  }}
                />
                <text x={nx(slot)} y={ny(d) + 10} style={{ fill: last ? "#fff" : at(t, "#fff", [[next, 0.25, failed ? BAD : INK, E.p2o]]) }}>
                  {label}
                </text>
              </g>
            );
          })}
        </g>

        {/* the board fills one column per level; on "the final board" it takes the stage alone */}
        <g style={arrive(t0)} transform={`translate(${at(t, BX0, [[center, 0.7, BX1, E.p2io]])} ${BY})`}>
          {SOL.map((_, c) => (
            <g key={c}>
              <text className="p06-lb" x={(c + 0.5) * CS} y={-18}>{`X${c + 1}`}</text>
              <text className="p06-lb" x={-26} y={(c + 0.5) * CS + 10}>{c + 1}</text>
              {SOL.map((__, r) => (
                <rect key={r} x={c * CS} y={r * CS} width={CS} height={CS} fill={(r + c) % 2 ? "#232c38" : "#1c232d"} />
              ))}
            </g>
          ))}
          {SOL.map((r, c) => {
            const k = pathAt(c + 1);
            return (
              <g key={c} style={arrive(born(k))} transform={`translate(${(c + 0.5) * CS} ${(r - 0.5) * CS + at(t, -14, [[born(k), 0.4, 0, E.expo]]) + 2})`}>
                <use href="#p06-q" style={{ fill: at(t, ACC, [[sol, 0.25, OK, E.p2o]]) }} />
              </g>
            );
          })}
        </g>
      </svg>
    </>
  );
};
