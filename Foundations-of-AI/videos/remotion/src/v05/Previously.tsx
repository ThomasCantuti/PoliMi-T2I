import { ACC, at, Beat, E, FILL, Fx, fx, Seg, SOFT, STROKE, useTime } from "../anim";
import { MapIntro } from "../shared/map";
import { AusMap, COLOR, EDGES, MAP_CSS, TINT } from "./australia";

const css = `
  #p05-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .p05-st { font: 600 30px Inter, sans-serif; fill: #7d8a99; }
  .p05-pl text { font: 600 28px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .p05-no { font: 700 30px Inter, sans-serif; fill: #f85149; }
  .p05-ch { font: 600 28px Inter, sans-serif; fill: #e6edf3; }
  ${MAP_CSS("p05")}
`;

// a state as a black box that only answers "goal?" and "next?"; inside it, the map of Australia. Plain depth-first
// search (csp.md: "happily assigns WA = R, NT = R, …") fills every region in the slide order and the goal test finds
// the clash only at the end
const ORDER = ["WA", "NT", "SA", "T", "NSW", "V", "Q"];
const SMALL = [732, 370, 280, 200], BIG = [210, 175, 760, 640]; // the small box and its two questions sit centered
const PW = 132, PH = 56, CX = 1290, CY = 214, CS = 80;
const lerp = (a: number[], b: number[], p: number) => a.map((x, i) => x + (b[i] - x) * p);

export const Previously = ({ dur, w }: Beat) => {
  const t = useTime();
  const go = Math.max(w("black box"), 2.4), tIn = go + 0.3;
  const grow = w("to color") + 0.05, open = w("a map") + 0.15;
  const step = (w("a clash") - 0.3 - w("filling")) / (ORDER.length - 1);
  const tf = ORDER.map((_, i) => w("filling") + i * step);
  const clash = w("a clash") + 0.1, dfs = w("depth-first"), close = w("can't see");
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const [bx, by, bw, bh] = lerp(SMALL, BIG, at(t, 0, [[grow, 0.7, 1, E.p2io]]));
  const R = bx + bw, cy = by + bh / 2;
  const flash = (t0: number): Seg<string>[] => [[t0, 0.1, ACC, E.p2o], [t0 + 0.22, 0.15, STROKE]];
  const flashFill = (t0: number): Seg<string>[] => [[t0, 0.1, SOFT, E.p2o], [t0 + 0.22, 0.15, FILL]];
  const pills: [string, number, number, number[]][] = [
    ["goal?", w("is this the goal"), cy - 44, [clash]],
    ["next?", w("what comes next"), cy + 44, tf],
  ];
  const lit: Seg<string>[] = [[dfs, 0.25, ACC, E.p2o], [w("they just"), 0.3, STROKE]];
  const chainStroke = (i: number): Seg<string>[] => (i === ORDER.length ? [[clash + 0.15, 0.25, "#f85149", E.p2o]] : lit);
  const [lx, ly] = lerp([837, 481], [238, 220], at(t, 0, [[grow, 0.7, 1, E.p2io]]));
  const chainAt = (i: number) => (i ? tf[i - 1] : w("that means"));

  return (
    <>
      <MapIntro here={5} from={[3, 4, 2]} out={w("black box")} />
      <style>{css}</style>
      <svg id="p05-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <defs>
          <clipPath id="p05-clip">
            <rect x={bx} y={by} width={bw} height={bh} rx="22" />
          </clipPath>
        </defs>
        {/* inside the box: the map, filled region by region; then the clashing borders */}
        <g clipPath="url(#p05-clip)" style={{ opacity: t < open ? 0 : 1 }}>
          <AusMap t={t} p="p05" fill={Object.fromEntries(ORDER.map((v, i) => [v, [[tf[i] + 0.05, 0.25, TINT.R, E.p2o]]]))} />
          <g style={{ opacity: at(t, 0, [[clash + 0.2, 0.3, 1, E.p2o]]) }}>
            {EDGES.map(([a, b, d]) => <path key={a + b} d={d} fill="none" stroke="#f85149" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />)}
          </g>
        </g>
        <g style={fx(t, [0, 6], [[tIn, 0.5, 1, 0, E.expo]])}>
          {/* the lid: opaque while search cannot look inside */}
          <rect x={bx} y={by} width={bw} height={bh} rx="22" fill={FILL} style={{ opacity: at(t, 1, [[open, 0.5, 0, E.p2o], [close, 0.45, 1, E.p2o]]) }} />
          <rect x={bx} y={by} width={bw} height={bh} rx="22" fill="none" stroke={STROKE} strokeWidth="3" />
          <text className="p05-st" x={lx} y={ly}>state</text>
        </g>
        {/* the only two questions search can ask */}
        {pills.map(([q, t0, y, flashes]) => (
          <g key={q} className="p05-pl" style={fx(t, [0, 6], [[t0, 0.45, 1, 0, E.expo]])}>
            <line x1={R} y1={y} x2={R + 44} y2={y} stroke={STROKE} strokeWidth="3" />
            <rect
              x={R + 44} y={y - PH / 2} width={PW} height={PH} rx={PH / 2} strokeWidth="2.5"
              style={{ fill: at(t, FILL, flashes.flatMap(flashFill)), stroke: at(t, STROKE, flashes.flatMap(flash)) }}
            />
            <text x={R + 44 + PW / 2} y={y + 10}>{q}</text>
          </g>
        ))}
        <text className="p05-no" x={R + 44 + PW + 18} y={cy - 44 + 11} style={fx(t, [0, 6], [[clash + 0.15, 0.3, 1, 0, E.p2o]])}>no</text>
        {/* depth-first search: one assignment per level, never looking inside */}
        {[...ORDER, ""].map((_, i) => {
          const y = CY + i * CS, t0 = chainAt(i);
          return (
            <g key={i} style={fx(t, [0, 6], [[t0, 0.35, 1, 0, E.expo]])}>
              {i > 0 && <line x1={CX + 20} y1={y - CS + 40} x2={CX + 20} y2={y} strokeWidth="3" style={{ stroke: at(t, STROKE, lit) }} />}
              <rect x={CX} y={y} width="40" height="40" rx="8" fill={FILL} strokeWidth="2.5" style={{ stroke: at(t, STROKE, chainStroke(i)) }} />
              <text className="p05-ch" x={CX + 62} y={y + 30}>
                {i ? <>{ORDER[i - 1]} = <tspan fill={COLOR.R}>R</tspan></> : "{ }"}
              </text>
            </g>
          );
        })}
      </svg>
    </>
  );
};
