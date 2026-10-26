import { getLength } from "@remotion/paths";
import { ACC, at, Beat, E, FILL, Fx, fx, INK, PREV, Seg, SOFT, STROKE, useTime } from "../anim";
import { GLABELS, LINES, STATIONS, svgScale } from "../shared/map";

const css = `
  #c-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #c-head { position: absolute; left: 192px; top: 104px; font: 700 68px/1.1 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
  #c-head .w { display: inline-block; }
  #c-head .acc { color: #7c8cff; }
  .c-nd rect { fill: #1c232d; stroke: #4b5a6e; stroke-width: 2.5; }
  .c-nd text { font: 600 34px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .c-e { fill: none; stroke: #4b5a6e; stroke-width: 3; }
  .c-ln { fill: none; stroke: #2f3a48; stroke-width: 8; stroke-linecap: round; }
  .c-st { fill: #0e1116; stroke: #4b5a6e; stroke-width: 5; }
  .c-sl { font: 600 28px Inter, sans-serif; fill: #7d8a99; text-anchor: middle; }
  .c-gl { font: 600 28px Inter, sans-serif; fill: #7d8a99; }
`;

// perceive, decide, act, environment: [x, y, w, h, rx, label]; each lights when named (lits below),
// the arrow into a node lights with it
type Lit = [number, boolean, number?];
const NODES: [number, number, number, number, number, string][] = [
  [410, 494, 300, 92, 10, "Perceive"],
  [810, 284, 300, 92, 10, "Decide"],
  [1210, 494, 300, 92, 10, "Act"],
  [750, 742, 420, 96, 14, "Environment"],
];
const EDGES = [
  "M750,790 C620,790 560,700 560,594",
  "M560,486 C560,390 650,330 802,330",
  "M1110,330 C1270,330 1360,390 1360,486",
  "M1360,594 C1360,700 1300,790 1178,790",
];
const LIGHT = "M560,540 C560,400 680,330 960,330 C1240,330 1360,400 1360,540 C1360,680 1240,790 960,790 C680,790 560,680 560,540 Z";
const L = getLength(LIGHT);

// each way of deciding lights its line, stations and group label; the previous group steps down to grey
// [word, stations, group label (-1 = none)]: searching, constraints, opponent, rewards, logic, probability
const GROUPS: [string, number[], number][] = [
  ["searching", [0, 1, 2], 0], ["satisfying", [3, 4], 1], ["playing", [5, 6], 2], ["learning", [7], -1], ["reasoning", [8, 9], 3], ["probability", [10], -1],
];
const groupOf = (s: number) => GROUPS.findIndex((g) => g[1].includes(s));

const WORDS = ["How", "should", "it", "decide?"];

export const Course = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const does = w("does it again"), decide = w("decide");
  // perceive, decide, act light in turn; decide lights again after the token's lap and stays lit
  const lits: Lit[][] = [
    [[w("perceives"), true], [w("decides"), false]],
    [[w("decides"), true], [w("acts"), false], [does + 1.6, true, 0.3]],
    [[w("acts"), true], [w("then"), false]],
    [],
  ];
  const groupT = GROUPS.map(([word]) => w(word));
  const nextT = (g: number) => groupT[g + 1] ?? wEnd("probability");
  // "a different answer": the rest steps back, then blurs out as decide grows into the map
  const back: Fx[] = [[w("a different"), 0.5, 0.3, null, E.p2o], [decide - 0.1, 0.3, 0, 8, E.p2i]];
  const lit = (segs: Lit[], on: string, off: string): Seg<string>[] =>
    segs.map(([t0, isOn, d = 0.25]) => [t0, d, isOn ? on : off, isOn ? E.p2o : E.p1o]);
  const lightUp = (g: number, init: string, on: string, dim: string) =>
    at(t, init, [[groupT[g], 0.3, on, E.p2o], [nextT(g), 0.3, dim]]);
  const out = fx(t, [1, 0], [[dur - 0.25, 0.2, 0, 8, E.p2i]]);

  return (
    <>
      <style>{css}</style>
      <svg id="c-svg" viewBox="0 0 1920 1080" style={out}>
        <defs>
          <marker id="c-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* the agent loop: perceive → decide → act → environment */}
        <g>
          <g style={fx(t, [0, 0], [[w("an agent"), 0.4, 1, null, E.p2o], ...back])}>
            <rect x="370" y="250" width="1180" height="400" rx="18" fill="none" stroke="#3a4757" strokeWidth="2" strokeDasharray="10 8" />
            <text x="396" y="294" fontFamily="Inter" fontSize="28" fontWeight="700" fill="#b4c0cc">Agent</text>
          </g>
          {EDGES.map((d, i) => {
            const segs = lits[i].slice(0, 2); // e1..e3 light with perceive, decide, act
            const on: Seg<number>[] = segs.map(([t0, isOn]) => [t0, 0.25, isOn ? 4 : 3, isOn ? E.p2o : E.p1o]);
            return (
              <path
                key={d}
                className="c-e"
                d={d}
                markerEnd="url(#c-ah)"
                style={{ ...fx(t, [0, 0], [[0.6, 0.4, 1, null, E.p2o], ...back]), stroke: at(t, STROKE, lit(segs, ACC, STROKE)), strokeWidth: at(t, 3, on) }}
              />
            );
          })}
          {/* "and then does it again": a light runs once around the loop */}
          <path
            d={LIGHT}
            fill="none"
            stroke="#7c8cff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`160 ${L}`}
            strokeDashoffset={at(t, 160, [[does, 1.5, -L + 160, E.p1io]])}
            opacity={at(t, 0, [[does, 0.15, 1], [does + 1.35, 0.2, 0]])}
          />
          {NODES.map(([x, y, nw, h, rx, label], i) => {
            const isDec = i === 1; // decide stays lit and grows into the course map
            const arrive: Fx = [0.15 + 0.1 * i, 0.45, 1, 0, E.expo];
            return (
              <g
                key={label}
                className="c-nd"
                style={fx(t, [0, 6], isDec ? [arrive, [decide - 0.05, 0.5, 0, null, E.p3i]] : [arrive, ...back])}
                transform={isDec ? svgScale(at(t, 1, [[decide - 0.05, 0.5, 2.6, E.p3i]]), 960, 330) : undefined}
              >
                <rect x={x} y={y} width={nw} height={h} rx={rx} style={{ fill: at(t, FILL, lit(lits[i], SOFT, FILL)), stroke: at(t, STROKE, lit(lits[i], ACC, STROKE)) }} />
                <text x={x + nw / 2} y={y + h / 2 + 12}>{label}</text>
              </g>
            );
          })}
        </g>

        {/* the course map */}
        <g style={{ opacity: at(t, 0, [[decide + 0.3, 0.6, 1, E.expo]]) }} transform={svgScale(at(t, 0.94, [[decide + 0.3, 0.6, 1, E.expo]]), 960, 540)}>
          <g style={{ opacity: at(t, 1, [[wEnd("probability"), 0.3, 0.35, E.p2o]]) }}>
            {LINES.map((d, g) => (
              <path key={d} className="c-ln" d={d} style={{ stroke: lightUp(g, "#2f3a48", ACC, "#6b7787") }} />
            ))}
            {GLABELS.map(([x, y, text], k) => {
              const g = GROUPS.findIndex((gr) => gr[2] === k);
              return (
                <text key={text} className="c-gl" x={x} y={y} style={{ fill: at(t, "#7d8a99", [[groupT[g], 0.3, INK, E.p2o]]) }}>
                  {text}
                </text>
              );
            })}
            {STATIONS.map(([cx, cy, lx, text], s) => {
              const g = groupOf(s);
              return (
                <g key={text}>
                  <circle className="c-st" cx={cx} cy={cy} r="15" style={{ fill: lightUp(g, "#0e1116", ACC, PREV), stroke: lightUp(g, STROKE, ACC, PREV) }} />
                  <text className="c-sl" x={lx} y={cy + 56} style={{ fill: at(t, "#7d8a99", [[groupT[g], 0.3, INK, E.p2o]]) }}>
                    {text}
                  </text>
                </g>
              );
            })}
          </g>
          {/* chapter 1 is where we are */}
          <g>
            <circle cx="250" cy="540" r="21" fill="#7c8cff" stroke="#7c8cff" strokeWidth="5" />
            <text x="250" y="600" className="c-sl" style={{ fill: "#e6edf3", fontWeight: 700 }}>
              1 Agents
            </text>
          </g>
        </g>
      </svg>
      <div id="c-head" style={out}>
        {WORDS.map((word, i) => (
          <span key={word}>
            {i ? " " : ""}
            <span className={i === 3 ? "w acc" : "w"} style={fx(t, [0, 6], [[w("how should") + 0.067 * i, 0.13, 1, 0]])}>{word}</span>
          </span>
        ))}
      </div>
    </>
  );
};
