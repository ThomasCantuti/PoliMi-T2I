import { interpolateColors } from "remotion";
import { ACC, at, Beat, E, Fx, fx, OK, useTime } from "../anim";
import { MapIntro } from "../shared/map";
import { Board, cellsOf, GOAL, LAYERS, MINI, NODES, Space, treeUpTo } from "../v02/space";

const css = `
  #p03-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
`;

// The state space and search tree of video 02 (src/v02/space.tsx), grown to depth 3: its leaves are the frontier.
const WARN = "#e3b341", WARN_SOFT = "rgba(227,179,65,0.16)", EXPLORED = "#5b6b80";
const TREE = treeUpTo(3).slice(1);
const FRONT = LAYERS[3];
const HOPS = [4, 1, 7, 2, 6]; // "which frontier node next?": the accent ring tries frontier nodes in turn
// the frontier as a line: the ellipse arc of layer 3 (space.tsx lays layer d on radius 140·d, squashed 0.62, ±1.36 rad)
const ARC = (() => {
  const rx = 420, ry = 420 * 0.62, p = (a: number) => `${(290 + rx * Math.cos(a)).toFixed(1)},${(470 + ry * Math.sin(a)).toFixed(1)}`;
  return `M${p(-1.3)} A${rx},${ry.toFixed(1)} 0 0 1 ${p(1.3)}`;
})();

export const Previously = ({ dur, w }: Beat) => {
  const t = useTime();
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const space = w("actions") + 0.15, goal = w("goal test");
  const grows = [w("grows"), w("paths"), w("start")];
  const wait = w("waiting"), front = w("the frontier"), one = w("one decision"), which = w("which frontier");
  const arrive: Fx = [space, 0.5, 1, 0, E.expo];
  const mix = (p: number, a: string, b: string) => interpolateColors(p, [0, 1], [a, b]);
  // the tree is in the accent while it grows; on "waiting" the expanded nodes go grey and the leaves turn into the frontier
  const done = at(t, 0, [[wait, 0.3, 1, E.p2o]]);
  const layerOp = (d: number) => at(t, 0, [[space + 0.05 * d, 0.4, 0.45, E.p2o], [one, 0.4, 0.2, E.p2o]]);
  const hop = (k: number) => w("which frontier") + 0.42 * k;
  const ring = (axis: "x" | "y") => at(t, NODES[FRONT[HOPS[0]]][axis], HOPS.slice(1).map((h, k) => [hop(k + 1), 0.25, NODES[FRONT[h]][axis], E.p2io]));

  return (
    <>
      <MapIntro here={3} from={[2]} out={w("actions") - 0.3} />
      <style>{css}</style>
      <svg id="p03-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <Space clip="p03-clip" op={layerOp}>
          {TREE.map((i) => {
            const nd = NODES[i], p = NODES[nd.parent], g = at(t, 0, [[grows[nd.d - 1], 0.35, 1, E.p2o]]);
            return g > 0 ? (
              <line key={i} x1={p.x} y1={p.y} x2={p.x + (nd.x - p.x) * g} y2={p.y + (nd.y - p.y) * g} stroke={mix(done, ACC, EXPLORED)} strokeWidth="3" strokeLinecap="round" />
            ) : null;
          })}
          {TREE.filter((i) => NODES[i].d > 1).map((i) => {
            const leaf = NODES[i].d === 3;
            return (
              <circle
                key={i} cx={NODES[i].x} cy={NODES[i].y} r={leaf ? 7 + 2 * done : 7} strokeWidth="3"
                fill={mix(done, ACC, leaf ? WARN_SOFT : EXPLORED)} stroke={mix(done, ACC, leaf ? WARN : EXPLORED)}
                opacity={at(t, 0, [[grows[NODES[i].d - 1] + 0.25, 0.15, 1]])}
              />
            );
          })}
          <g style={fx(t, [0, 0], [[goal, 0.3, 1, null, E.p2o]])}>
            <circle cx={NODES[GOAL].x} cy={NODES[GOAL].y} r={at(t, 22, [[goal, 0.5, 15, E.expo]])} fill="none" stroke={OK} strokeWidth="4" />
            <text x={NODES[GOAL].x + 26} y={NODES[GOAL].y - 14} fontFamily="Inter" fontWeight="700" fontSize="28" fill={OK}>goal</text>
          </g>
          {/* "the frontier": the line its nodes sit on */}
          <path d={ARC} fill="none" stroke={WARN} strokeWidth="2.5" strokeDasharray="10 8" style={fx(t, [0, 0], [[front, 0.4, 0.8, null, E.p2o]])} />
          <text x="400" y="200" textAnchor="end" fontFamily="Inter" fontWeight="700" fontSize="30" fill={WARN} style={fx(t, [0, 6], [[front, 0.5, 1, 0, E.expo]])}>
            frontier
          </text>
          <circle cx={ring("x")} cy={ring("y")} r="19" fill="none" stroke={ACC} strokeWidth="4" style={fx(t, [0, 0], [[which, 0.25, 1, null, E.p2o]])} />
        </Space>
        {/* the start and its successors, the boards of video 02 */}
        {[0, ...LAYERS[1]].map((i) => (
          <g key={i} style={fx(t, [0, 6], [arrive])}>
            <Board x={NODES[i].x} y={NODES[i].y} cell={MINI} cells={cellsOf(NODES[i].tiles)} num={0} />
            <rect
              x={NODES[i].x - 31} y={NODES[i].y - 31} width="62" height="62" rx="8" fill="none" strokeWidth="3"
              stroke={mix(done, ACC, EXPLORED)} opacity={at(t, 0, [[grows[0] + (i ? 0.25 : 0), 0.15, 1]])}
            />
          </g>
        ))}
      </svg>
    </>
  );
};
