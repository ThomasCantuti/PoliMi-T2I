import { ACC, at, E, fx, INK, MUTED, PREV, STROKE, useTime } from "../anim";

// The course map: chapters as stations (SCRIPTS.md "The course map"). Chapter 1 sits at (250, 540).
export const LINES = [
  "M250,540 L910,540",
  "M910,540 L960,540 C1040,540 1030,360 1110,360 L1360,360",
  "M910,540 L1360,540",
  "M1360,540 L1600,540",
  "M910,540 L960,540 C1040,540 1030,720 1110,720 L1360,720",
  "M1360,720 L1600,720",
];
export const GLABELS: [number, number, string][] = [
  [450, 494, "Searching for a plan"],
  [1100, 318, "Exploiting structure"],
  [1100, 498, "Opponents and learning"],
  [1100, 678, "Reasoning"],
];
// chapters 2-12: [x, y, label x, label]
export const STATIONS: [number, number, number, string][] = [
  [460, 540, 460, "2 Formulation"], [685, 540, 685, "3 Uninformed"], [910, 540, 890, "4 Informed"],
  [1120, 360, 1120, "5 CSP"], [1360, 360, 1360, "6 Local search"],
  [1120, 540, 1120, "7 Adversarial"], [1360, 540, 1360, "8 MCTS"], [1600, 540, 1600, "9 RL"],
  [1120, 720, 1120, "10 Logic"], [1360, 720, 1360, "11 Planning"], [1600, 720, 1600, "12 Uncertainty"],
];
const ALL: [number, number, number, string][] = [[250, 540, 250, "1 Agents"], ...STATIONS];

export const svgScale = (s: number, ox: number, oy: number) => `translate(${ox} ${oy}) scale(${s}) translate(${-ox} ${-oy})`;

const css = `
  #m-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .m-ln { fill: none; stroke: #2f3a48; stroke-width: 8; stroke-linecap: round; }
  .m-sl { font: 600 28px Inter, sans-serif; text-anchor: middle; }
  .m-gl { font: 600 28px Inter, sans-serif; fill: #7d8a99; }
`;

/** "Previously" opener: the course map, this chapter in the accent, the chapters it builds on lit one by one,
 *  then the map zooms into this chapter's station and gives the stage to the scene (at `out`, scene-local s). */
export const MapIntro = ({ here, from, out }: { here: number; from: number[]; out: number }) => {
  const t = useTime();
  const go = Math.max(out, 2.4); // the map needs ~2.4 s to be read
  const [hx, hy] = ALL[here - 1];
  const lit = (c: number) => (c === here ? 0.5 : from.includes(c) ? 1.0 + 0.3 * from.indexOf(c) : -1);
  const color = (c: number, init: string, on: string) => (lit(c) < 0 ? init : at(t, init, [[lit(c), 0.3, on, E.p2o]]));
  return (
    <>
      <style>{css}</style>
      <svg id="m-svg" viewBox="0 0 1920 1080">
        <g
          style={fx(t, [0, 0], [[0.05, 0.5, 1, null, E.expo], [go, 0.5, 0, 8, E.p3i]])}
          transform={svgScale(at(t, 0.94, [[0.05, 0.5, 1, E.expo], [go, 0.5, 2.4, E.p3i]]), hx, hy)}
        >
          {LINES.map((d) => <path key={d} className="m-ln" d={d} />)}
          {GLABELS.map(([x, y, text]) => <text key={text} className="m-gl" x={x} y={y}>{text}</text>)}
          {ALL.map(([cx, cy, lx, text], i) => {
            const c = i + 1;
            return (
              <g key={text}>
                {c === here && (
                  <circle cx={cx} cy={cy} r={at(t, 21, [[0.6, 0.9, 40, E.p2o]])} fill="none" stroke={ACC} strokeWidth="4" opacity={at(t, 0, [[0.6, 0.05, 0.5], [0.65, 0.85, 0, E.p2o]])} />
                )}
                <circle
                  cx={cx} cy={cy} r={c === here ? 21 : 15} strokeWidth="5"
                  style={{ fill: color(c, "#0e1116", c === here ? ACC : PREV), stroke: color(c, STROKE, c === here ? ACC : PREV) }}
                />
                <text className="m-sl" x={lx} y={cy + (c === here ? 62 : 56)} style={{ fill: color(c, MUTED, INK), fontWeight: c === here ? 700 : 600 }}>
                  {text}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </>
  );
};
