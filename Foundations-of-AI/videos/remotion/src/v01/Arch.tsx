import { ACC, at, Beat, E, FILL, Fx, fx, MUTED, OK, PREV, Seg, SOFT, STROKE, useTime } from "../anim";

const css = `
  #a-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #a-ex { position: absolute; left: 192px; top: 96px; width: 700px; height: 80px; }
  #a-ex div { position: absolute; left: 0; top: 0; font: 700 60px/1.15 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
  #a-steps { position: absolute; right: 192px; top: 118px; display: flex; gap: 34px; font: 600 27px/1.2 Inter, sans-serif; color: #7d8a99; }
  .a-nd rect { fill: #1c232d; stroke: #4b5a6e; stroke-width: 2.5; }
  .a-nd text { font: 600 25px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .a-nd.pill text, #a-n0 text, #a-n1 text { font-size: 28px; }
  .a-e { fill: none; stroke: #4b5a6e; stroke-width: 3; }
  .a-m { font: 500 24px Inter, sans-serif; fill: #7d8a99; }
  .a-ttl { font: 700 30px Inter, sans-serif; fill: #b4c0cc; }
`;

// Geometry copied from web/src/figs/agents-arch.ts (viewBox 760 x 430), scaled to the frame.
const ALL = [0, 1, 2, 3], MODEL = [1, 2, 3];
const NODES: [number, number, number, string, boolean, number[]][] = [
  [545, 48, 100, "Sensors", false, ALL],
  [545, 392, 100, "Actuators", false, ALL],
  [360, 118, 250, "What the world is like now", false, ALL],
  [360, 190, 250, "What it will be like if I do action a", false, [2, 3]],
  [360, 262, 250, "How happy I will be in such a state", false, [3]],
  [360, 334, 250, "What action I should do now", false, ALL],
  [112, 60, 184, "State", true, MODEL],
  [112, 108, 184, "How the world evolves", true, MODEL],
  [112, 156, 184, "What my actions do", true, MODEL],
  [112, 214, 184, "Goals", true, [2]],
  [112, 262, 184, "Utility", true, [3]],
  [112, 334, 184, "Condition–action rules", true, [0, 1]],
];
const EDGES: [string, number[]][] = [
  ["M673,48 L599,48", ALL], ["M545,66 C545,105 520,118 489,118", ALL], ["M485,334 C525,334 545,345 545,370", ALL], ["M595,392 L671,392", ALL],
  ["M360,138 L360,312", [0, 1]], ["M204,334 L231,334", [0, 1]],
  ["M204,60 C222,60 214,112 231,112", MODEL], ["M204,108 C218,108 216,118 231,118", MODEL], ["M204,156 C222,156 214,124 231,124", MODEL],
  ["M360,138 L360,168", [2, 3]], ["M204,156 C222,156 214,190 231,190", [2, 3]],
  ["M360,210 L360,312", [2]], ["M204,214 C225,214 214,330 231,330", [2]],
  ["M360,210 L360,240", [3]], ["M360,282 L360,312", [3]], ["M204,262 L231,262", [3]],
];
const NOTES: [number, number, string, "middle" | "end", number[]][] = [
  [643, 33, "percepts", "middle", ALL], [643, 377, "actions", "middle", ALL],
  [536, 88, "sensor model", "end", MODEL], [112, 189, "transition model ↑", "middle", MODEL],
];
const KX = 1196 / 600, KY = 680 / 406;
const X = (x: number) => 192 + (x - 12) * KX, Y = (y: number) => 190 + (y - 12) * KY;
const path = (d: string) => d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, a, b) => `${X(+a).toFixed(1)},${Y(+b).toFixed(1)}`);
const EXAMPLES = ["Thermostat", "Robot vacuum", "Navigator", "Taxi driver"];
const STEPS = ["Simple reflex", "Model-based", "Goal-based", "Utility-based"];

// hide what an architecture lacks; mark what it adds (first architecture that has it, from 1 on) in the accent
const on = (has: number[], i: number) => has.includes(i);
const cur = (has: number[], i: number) => has.includes(i) && has[0] === i && i > 0;
const nodeInside = (k: number) => k > 1 && NODES[k][5].includes(3);
const edgeInside = (k: number) => (k === 1 || k === 2 || k > 3) && EDGES[k][1].includes(3);

export const Arch = ({ dur, w }: Beat) => {
  const t = useTime();
  // one stepper frame, as in the app: [time, architecture, duration]. Each example swaps it 0.15 s before the voice
  // names it, then "each one adds a single box to the one before" replays the four steps 0.5 s apart.
  const SHOWS: [number, number, number][] = [
    ...["thermostat", "robot", "navigator", "taxi"].map((ex, i): [number, number, number] => [w(ex) - 0.15, i, 0.3]),
    ...[0, 1, 2, 3].map((i): [number, number, number] => [w("each one") + 0.5 * i, i, 0.2]),
  ];
  const stepped = <T,>(f: (i: number) => T, ease?: (x: number) => number): Seg<T>[] => SHOWS.map(([t0, i, d]) => [t0, d, f(i), ease]);
  // "whatever is inside, an agent is judged by what its actions do to the world": the inside dims,
  // the environment (with the performance measure), the actions arrow and the actuators go green
  const DIM: Seg<number> = [w("whatever"), 0.4, 0.18, E.p2o];
  const judged = w("judged"), actions = w("actions");
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const arrive: Fx = [0, 0.35, 1, 0, E.p2o];
  // the example name swaps: the old one blurs out at the step, the new one blurs in 0.1 s later
  const exFx = (e: number) =>
    fx(t, [0, 0], SHOWS.flatMap(([t0, i], j): Fx[] => [
      ...(j > 0 && SHOWS[j - 1][1] === e ? [[t0, 0.15, 0, 8, E.p2i] as Fx] : []),
      ...(i === e ? [[t0 + 0.1, 0.25, 1, 0, E.p2o, [0, 6]] as Fx] : []),
    ]));

  return (
    <>
      <style>{css}</style>
      <svg id="a-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <defs>
          <marker id="a-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>
        <g style={fx(t, [0, 6], [arrive])}>
          <rect x="192" y="190" width="1196" height="680" rx="22" fill="none" stroke="#3a4757" strokeWidth="2" strokeDasharray="10 8" />
          <text className="a-ttl" x="224" y="846">Agent</text>
          <rect
            x="1514" y="190" width="176" height="680" rx="22" strokeWidth="3"
            style={{ fill: at(t, "#1c232d", [[w("world"), 0.4, "rgba(63,185,80,0.14)", E.p2o]]), stroke: at(t, STROKE, [[judged, 0.3, OK, E.p2o]]) }}
          />
          <text className="a-ttl" x="1602" y="530" textAnchor="middle" transform="rotate(-90 1602 530)" dy="10">Environment</text>
          <text
            x="1652" y="530" textAnchor="middle" transform="rotate(-90 1652 530)" fontFamily="Inter" fontSize="26" fontWeight="600" fill="#3fb950"
            style={{ opacity: at(t, 0, [[judged, 0.3, 1, E.p2o]]) }}
          >
            performance measure
          </text>
        </g>
        <g>
          {EDGES.map(([d, has], k) => (
            <path
              key={k}
              className="a-e"
              d={path(d)}
              markerEnd="url(#a-ah)"
              style={{
                opacity: at(t, 0, [...stepped((i) => (on(has, i) ? 1 : 0)), ...(edgeInside(k) ? [DIM] : [])]),
                stroke: at(t, STROKE, [...stepped((i) => (cur(has, i) ? ACC : STROKE)), ...(k === 3 ? [[actions, 0.25, OK, E.p2o] as Seg<string>] : [])]),
                strokeWidth: k === 3 ? at(t, 3, [[actions, 0.25, 5, E.p2o]]) : undefined,
              }}
            />
          ))}
        </g>
        <g>
          {NODES.map(([x, y, w, text, pill, has], k) => {
            const h = pill ? 56 : 64;
            return (
              <g
                key={k}
                id={`a-n${k}`}
                className={pill ? "a-nd pill" : "a-nd"}
                style={{ opacity: at(t, 0, [...stepped((i) => (on(has, i) ? 1 : 0), E.p2o), ...(nodeInside(k) ? [DIM] : [])]) }}
              >
                <rect
                  x={X(x) - (w * KX) / 2} y={Y(y) - h / 2} width={w * KX} height={h} rx={pill ? h / 2 : 10}
                  style={{
                    fill: at(t, FILL, stepped((i) => (cur(has, i) ? SOFT : FILL))),
                    stroke: at(t, STROKE, [...stepped((i) => (cur(has, i) ? ACC : STROKE)), ...(k === 1 ? [[actions, 0.25, OK, E.p2o] as Seg<string>] : [])]),
                  }}
                />
                <text x={X(x)} y={Y(y) + 9}>{text}</text>
              </g>
            );
          })}
        </g>
        <g>
          {NOTES.map(([x, y, text, anchor, has], k) => (
            <text
              key={text} className="a-m" x={X(x)} y={Y(y)} textAnchor={anchor}
              style={{ opacity: at(t, 0, [...stepped((i) => (on(has, i) ? 1 : 0)), ...(k > 1 ? [DIM] : [])]) }}
            >
              {text}
            </text>
          ))}
        </g>
      </svg>
      <div id="a-ex" style={fx(t, [1, 0], [out])}>
        {EXAMPLES.map((ex, e) => (
          <div key={ex} style={exFx(e)}>{ex}</div>
        ))}
      </div>
      <div id="a-steps" style={fx(t, [0, 6], [arrive, out])}>
        {STEPS.map((s, k) => (
          <span key={s} style={{ color: at(t, MUTED, stepped((i) => (k === i ? ACC : k < i ? PREV : MUTED))) }}>{s}</span>
        ))}
      </div>
    </>
  );
};
