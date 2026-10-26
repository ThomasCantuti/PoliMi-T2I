import { getLength } from "@remotion/paths";
import { ACC, at, Beat, E, Fx, fx, OK, PREV, useTime } from "../anim";
import { ASTAR, clock, CITY, GSTAR, hOf, Labels, MAP_CSS, pathD, Pool, pos, RomaniaMap, runOf, schedule, States, UCS } from "./romania";

const css = `
  #b04-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .b04-hd { position: absolute; left: 192px; top: 104px; font: 700 60px/1.1 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; white-space: nowrap; }
  .b04-f { position: absolute; left: 192px; top: 190px; font: 600 40px/1.2 Inter, sans-serif; color: #b4c0cc; white-space: nowrap; }
  #b04-adm { position: absolute; left: 192px; top: 268px; font: 600 34px/1.2 Inter, sans-serif; white-space: nowrap; }
  .b04-tag { font: 700 34px Inter, sans-serif; fill: #7c8cff; text-anchor: middle; paint-order: stroke; stroke: #0e1116; stroke-width: 8px; stroke-linejoin: round; }
  .b04-lg { font: 600 28px Inter, sans-serif; fill: #b4c0cc; }
  .b04-lg tspan.v { fill: #e6edf3; font-weight: 700; }
  ${MAP_CSS("b04")}
`;

// f = g + h on the Romania map (the Playground's informed presets; labels g+h=f as in figs/search-astar.ts):
// h is the dashed straight line to Bucharest (figs/search-consistent.ts draws estimates dashed), g the road behind.
// "This node" is Sibiu, AIMA's 140 + 253 = 393. Then A* runs: the explored region stretches toward Bucharest.
const HEADS: [string, string, string][] = [
  ["greedy", "Greedy search", "f(n) = h(n)"],
  ["uniform-cost", "Uniform-cost search", "f(n) = g(n)"],
  ["A* looks", "A* search", "f(n) = g(n) + h(n)"],
];
const [SX, SY] = pos("S"), [BX, BY] = pos("B"), [AX, AY] = pos("A");
const HL = Math.hypot(BX - SX, BY - SY), UX = (BX - SX) / HL, UY = (BY - SY) / HL;
const GL = Math.hypot(SX - AX, SY - AY);
const H0: [number, number] = [SX + UX * 27, SY + UY * 27], H1: [number, number] = [BX - UX * 27, BY - UY * 27];
const SOL = pathD(["A", "S", "R", "P", "B"]);
const SL = getLength(SOL);
const SELECTED = ASTAR.map((s) => s.sel);

export const Big = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const node = w("a guess"), hIn = w("cost still"), heur = w("a heuristic"), back = w("looks only back"), both = w("both ways");
  const whole = w("the cost of"), when = w("when the");
  const ts = schedule(ASTAR.map((s) => s.g + hOf(s.sel)), wEnd("overestimates"), w("path"));
  const solved = wEnd("path"), fewer = w("far fewer"), exact = w("exactly when");
  const run = runOf(ASTAR, ts, ts[0] - 0.3, (k, g) => `${g}+${hOf(k)}=${g + hOf(k)}`);
  // every city first shows its h; the A* run then writes g+h=f (Sibiu already shows it)
  const labels: Labels = {};
  Object.keys(CITY).forEach((k, i) => {
    labels[k] = [[heur + 0.03 * i, `h=${hOf(k)}`], ...(k === "S" ? [[whole, "140+253=393"] as [number, string]] : [])];
    for (const v of run.labels[k] ?? []) if (v[1] !== labels[k][labels[k].length - 1][1]) labels[k].push(v);
  });
  const states: States = {};
  Object.keys(CITY).forEach((k) => {
    states[k] = [
      ...(k === "S" ? [[node, "cur"], [when, "plain"]] as States[string] : []),
      ...(run.states[k] ?? []),
      ...(["A", "S", "R", "P", "B"].includes(k) ? [[solved, "path"]] as States[string] : []),
      ...(!SELECTED.includes(k) ? [[fewer + 0.1, "never"]] as States[string] : []),
    ];
  });
  const c = clock(t, ASTAR.map((s, i): [number, number] => [ts[i], s.g + hOf(s.sel)]));
  const gone: Fx = [when, 0.3, 0, null, E.p2o];
  const hOp = at(t, 1, [[back, 0.25, 0.35, E.p2o], [both, 0.25, 1, E.p2o], [when, 0.3, 0, E.p2o]]);
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const headT = HEADS.map(([word]) => w(word));
  const headFx = (i: number) =>
    fx(t, [0, 0], [[headT[i] + 0.1, 0.3, 1, 0, E.p2o, [0, 6]], ...(i + 1 < HEADS.length ? [[headT[i + 1], 0.15, 0, 8, E.p2i] as Fx] : []), out]);
  const row = (t0: number): React.CSSProperties => fx(t, [0, 6], [[t0, 0.4, 1, 0, E.expo], out]);

  return (
    <>
      <style>{css}</style>
      <svg id="b04-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        {t >= ts[0] && (
          <Pool
            c={c} val={(k) => GSTAR[k] + hOf(k)} rate={(u, v, len) => 1 + (hOf(v) - hOf(u)) / len}
            grow={at(t, 0, [[ts[0], 0.5, 1, E.expo]])} start="A"
          />
        )}
        <RomaniaMap
          t={t} tIn={0} p="b04" states={states} labels={labels}
          over={
            <>
              {/* g: the road already paid, from Sibiu back to Arad */}
              <line
                x1={SX} y1={SY} x2={SX + (AX - SX) * at(t, 0, [[back, 0.6, 1, E.p2o]])} y2={SY + (AY - SY) * at(t, 0, [[back, 0.6, 1, E.p2o]])}
                stroke={ACC} strokeWidth="7" strokeLinecap="round" style={fx(t, [1, 0], [gone])}
              />
              {/* h: the guess, a straight dashed line to Bucharest */}
              <line
                x1={H0[0]} y1={H0[1]} x2={H0[0] + (H1[0] - H0[0]) * at(t, 0, [[hIn, 0.6, 1, E.p2o]])} y2={H0[1] + (H1[1] - H0[1]) * at(t, 0, [[hIn, 0.6, 1, E.p2o]])}
                stroke={ACC} strokeWidth="5" strokeDasharray="14 10" strokeLinecap="round" opacity={t < hIn ? 0 : hOp}
              />
              {/* A*'s answer: the cheapest path */}
              <path d={SOL} fill="none" stroke={OK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={SL} strokeDashoffset={at(t, SL, [[solved, 0.6, 0, E.p2io]])} />
            </>
          }
        />
        <text className="b04-tag" x={(AX + SX) / 2 + ((SY - AY) / GL) * 38} y={(AY + SY) / 2 - ((SX - AX) / GL) * 38 + 12} style={fx(t, [0, 6], [[w("at g"), 0.3, 1, 0, E.p2o], gone])}>g</text>
        <text className="b04-tag" x={(H0[0] + H1[0]) / 2 + UY * 34} y={(H0[1] + H1[1]) / 2 - UX * 34 + 12} style={{ ...fx(t, [0, 6], [[heur, 0.3, 1, 0, E.p2o], gone]), opacity: t < heur ? 0 : Math.min(at(t, 0, [[heur, 0.3, 1, E.p2o]]), hOp) }}>h</text>
        {/* the result, as figs/search-grid.ts writes its key */}
        <g style={row(solved + 0.1)}>
          <line x1="192" y1="751" x2="232" y2="751" stroke={OK} strokeWidth="6" strokeLinecap="round" />
          <text className="b04-lg" x="250" y="761">A* (f = g + h): cost <tspan className="v">{ASTAR[ASTAR.length - 1].g}</tspan>, optimal</text>
        </g>
        <g style={row(fewer + 0.1)}>
          <circle cx="212" cy="806" r="15" fill="#1c232d" stroke="#4a5361" strokeWidth="2.5" strokeDasharray="7 5" />
          <text className="b04-lg" x="250" y="816">
            A* selects <tspan className="v">{ASTAR.length}</tspan> nodes, uniform-cost <tspan className="v">{UCS.length}</tspan>
          </text>
        </g>
      </svg>
      {HEADS.map(([, head, f], i) => (
        <div key={head} style={headFx(i)}>
          <div className="b04-hd">{head}</div>
          <div className="b04-f">{f}</div>
        </div>
      ))}
      <div id="b04-adm" style={{ ...fx(t, [0, 6], [[w("never overestimates"), 0.4, 1, 0, E.expo], out]), color: at(t, PREV, [[exact, 0.25, ACC, E.p2o]]) }}>
        admissible: h(n) ≤ h*(n)
      </div>
    </>
  );
};
