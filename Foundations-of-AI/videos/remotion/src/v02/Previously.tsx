import { interpolateColors } from "remotion";
import { ACC, at, Beat, E, FILL, Fx, fx, INK, MUTED, OK, PREV, SOFT, STROKE, useTime } from "../anim";
import { MapIntro } from "../shared/map";

const css = `
  #p02-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #p02-head { position: absolute; left: 192px; top: 96px; width: 1100px; height: 80px; }
  #p02-head div { position: absolute; left: 0; top: 0; font: 700 60px/1.15 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; white-space: nowrap; }
  #p02-steps { position: absolute; right: 192px; top: 118px; display: flex; gap: 34px; font: 600 27px/1.2 Inter, sans-serif; color: #7d8a99; }
  .p02-nd rect { fill: #1c232d; stroke: #4b5a6e; stroke-width: 2.5; }
  .p02-nd text { font: 600 25px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .p02-nd.big text { font-size: 28px; }
  .p02-e { fill: none; stroke: #4b5a6e; stroke-width: 3; }
  .p02-m { font: 500 24px Inter, sans-serif; fill: #7d8a99; }
  .p02-ttl { font: 700 30px Inter, sans-serif; fill: #b4c0cc; }
  .p02-opt { font: 600 34px Inter, sans-serif; }
  .p02-box text { font: 600 34px Inter, sans-serif; text-anchor: middle; }
`;

// The goal-based agent exactly as video 01 drew it (src/v01/Arch.tsx, from web/src/figs/agents-arch.ts): the boxes of
// architecture 2 only. [x, y, w, label, pill]; FUT = "what it will be like", GOALS = the goals pill.
const NODES: [number, number, number, string, boolean][] = [
  [545, 48, 100, "Sensors", false],
  [545, 392, 100, "Actuators", false],
  [360, 118, 250, "What the world is like now", false],
  [360, 190, 250, "What it will be like if I do action a", false],
  [360, 334, 250, "What action I should do now", false],
  [112, 60, 184, "State", true],
  [112, 108, 184, "How the world evolves", true],
  [112, 156, 184, "What my actions do", true],
  [112, 214, 184, "Goals", true],
];
const FUT = 3, GOALS = 8;
// [path, lights with: 0 none, FUT, GOALS]
const EDGES: [string, number][] = [
  ["M673,48 L599,48", 0], ["M545,66 C545,105 520,118 489,118", 0], ["M485,334 C525,334 545,345 545,370", 0], ["M595,392 L671,392", 0],
  ["M204,60 C222,60 214,112 231,112", 0], ["M204,108 C218,108 216,118 231,118", 0], ["M204,156 C222,156 214,124 231,124", 0],
  ["M360,138 L360,168", FUT], ["M204,156 C222,156 214,190 231,190", FUT],
  ["M360,210 L360,312", 0], ["M204,214 C225,214 214,330 231,330", GOALS],
];
const NOTES: [number, number, string, "middle" | "end"][] = [
  [643, 33, "percepts", "middle"], [643, 377, "actions", "middle"], [536, 88, "sensor model", "end"], [112, 189, "transition model ↑", "middle"],
];
const KX = 1196 / 600, KY = 680 / 406;
const X = (x: number) => 192 + (x - 12) * KX, Y = (y: number) => 190 + (y - 12) * KY;
const path = (d: string) => d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, a, b) => `${X(+a).toFixed(1)},${Y(+b).toFixed(1)}`);
const STEPS = ["Simple reflex", "Model-based", "Goal-based", "Utility-based"];

// The environment properties of web content agents.md, in the order the voice ticks them: [chosen, alternative].
// "discrete" is not spoken: it ticks right after "static", before "known".
const PROPS: [string, string][] = [
  ["Fully observable", "Partially observable"], ["Deterministic", "Stochastic"], ["Static", "Dynamic"], ["Discrete", "Continuous"], ["Known", "Unknown"],
];
const PANEL = { x: 192, y: 190, w: 1536, h: 680 };
const ROW = (k: number) => PANEL.y + 68 + 136 * k;

// inside the same agent box: formulate → search → execute (the page's first paragraph); Formulate is the missing piece
const BOX = { y: 474, h: 112, w: 260 };
const FORM = 232, SEARCH = 572, EXEC = 1068;
const CHIPS = [0, 1, 2, 3].map((k) => 846 + 56 * k);

export const Previously = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const t1 = w("imagined"), fut = w("the future"), goal = w("its goal");
  const world = w("in a world"), imag = w("all of that"), search = w("imagining");
  const first = w("before the first"), sol = w("the solution"), missing = w("what's missing"), describe = w("describe the problem"), prog = w("so a program");
  // shot 1, the agent: arrives on "imagined"; its inside leaves on "in a world", its box and the environment stay
  const box = fx(t, [0, 6], [[t1, 0.5, 1, 0, E.expo]]);
  const agent = fx(t, [0, 6], [[t1, 0.5, 1, 0, E.expo], [world, 0.3, 0, 8, E.p2i]]);
  const lit = (k: number) =>
    k === FUT ? at(t, 0, [[fut, 0.25, 1, E.p2o], [goal, 0.25, 0, E.p2o]]) : k === GOALS ? at(t, 0, [[goal, 0.25, 1, E.p2o]]) : 0;
  const mixed = (p: number, a: string, b: string) => interpolateColors(p, [0, 1], [a, b]);
  // shot 2, the environment: the column grows into a panel, one property ticks per word, then it shrinks back
  const ticks = [w("fully observable"), w("deterministic"), w("static"), wEnd("static"), w("known")];
  const grow = (from: number, to: number) => at(t, from, [[world + 0.1, 0.6, to, E.p2io], [imag + 0.1, 0.6, from, E.p2io]]);
  // shot 3: search (lit while it imagines), execute, the solution as a row of actions, then the missing formulate
  const arrive = (t0: number): Fx => [t0, 0.5, 1, 0, E.expo];
  const searchLit = at(t, 0, [[search, 0.25, 1, E.p2o], [sol, 0.25, 0, E.p2o]]);
  const formLit = at(t, 0, [[describe, 0.25, 1, E.p2o]]);
  // heads: the old one blurs out, the new one blurs in 0.1 s later (as in Arch.tsx)
  const HEADS: [string, number, number][] = [["Navigator", t1, world], ["Environment", world, imag], ["Problem-solving agent", imag, Infinity]];

  return (
    <>
      <MapIntro here={2} from={[1]} out={t1 - 0.3} />
      <style>{css}</style>
      <svg id="p02-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <defs>
          <marker id="p02-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* shot 1: the goal-based agent */}
        <g style={box}>
          <rect x="192" y="190" width="1196" height="680" rx="22" fill="none" stroke="#3a4757" strokeWidth="2" strokeDasharray="10 8" />
          <text className="p02-ttl" x="224" y="846">Agent</text>
        </g>
        <g style={agent}>
          {EDGES.map(([d, k], i) => (
            <path key={i} className="p02-e" d={path(d)} markerEnd="url(#p02-ah)" style={{ stroke: mixed(lit(k), STROKE, ACC) }} />
          ))}
          {NODES.map(([x, y, nw, text, pill], k) => {
            const h = pill ? 56 : 64;
            return (
              <g key={k} className={pill || k < 2 ? "p02-nd big" : "p02-nd"}>
                <rect
                  x={X(x) - (nw * KX) / 2} y={Y(y) - h / 2} width={nw * KX} height={h} rx={pill ? h / 2 : 10}
                  style={{ fill: mixed(lit(k), FILL, SOFT), stroke: mixed(lit(k), STROKE, ACC) }}
                />
                <text x={X(x)} y={Y(y) + 9}>{text}</text>
              </g>
            );
          })}
          {NOTES.map(([x, y, text, anchor]) => (
            <text key={text} className="p02-m" x={X(x)} y={Y(y)} textAnchor={anchor}>{text}</text>
          ))}
        </g>

        {/* the environment column, then the panel of its properties */}
        <g style={box}>
          <rect
            x={grow(1514, PANEL.x)} y={PANEL.y} width={grow(176, PANEL.w)} height={PANEL.h} rx="22" strokeWidth="3"
            style={{ fill: FILL, stroke: STROKE }}
          />
          <text className="p02-ttl" x="1602" y="530" textAnchor="middle" transform="rotate(-90 1602 530)" dy="10" opacity={at(t, 1, [[world, 0.2, 0], [imag + 0.5, 0.3, 1]])}>
            Environment
          </text>
          {PROPS.map(([yes, no], k) => {
            const y = ROW(k), tick = ticks[k], on = at(t, 0, [[tick, 0.25, 1, E.p2o]]);
            return (
              <g key={yes} style={fx(t, [0, 6], [[world + 0.45 + 0.05 * k, 0.5, 1, 0, E.expo], [imag, 0.3, 0, 8, E.p2i]])}>
                <rect x="300" y={y - 42} width="560" height="84" rx="14" strokeWidth="2.5" fill={mixed(on, FILL, "rgba(63,185,80,0.14)")} stroke={mixed(on, STROKE, OK)} />
                <path
                  d={`M330,${y} l14,14 l26,-28`} fill="none" stroke={OK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="60" strokeDashoffset={at(t, 60, [[tick, 0.3, 0, E.p2o]])}
                />
                <text className="p02-opt" x="392" y={y + 12} fill={mixed(on, PREV, INK)}>{yes}</text>
                <text className="p02-m" x="960" y={y + 9} textAnchor="middle" fontSize="28">vs</text>
                <g opacity={at(t, 1, [[tick, 0.25, 0.4, E.p2o]])}>
                  <rect x="1060" y={y - 42} width="560" height="84" rx="14" strokeWidth="2.5" fill="none" stroke={STROKE} strokeDasharray="10 8" />
                  <text className="p02-opt" x="1152" y={y + 12} fill={MUTED}>{no}</text>
                </g>
              </g>
            );
          })}
        </g>

        {/* shot 3: formulate → search → execute */}
        <g className="p02-box">
          <g style={fx(t, [0, 6], [arrive(missing)])}>
            <rect
              x={FORM} y={BOX.y} width={BOX.w} height={BOX.h} rx="14" strokeWidth="3" strokeDasharray={`12 ${9 * (1 - formLit)}`}
              fill={mixed(formLit, "rgba(0,0,0,0)", SOFT)} stroke={mixed(formLit, STROKE, ACC)}
            />
            <text x={FORM + BOX.w / 2} y={BOX.y + 68} fill={mixed(formLit, MUTED, INK)}>Formulate</text>
          </g>
          <path
            className="p02-e" markerEnd="url(#p02-ah)" d={`M${FORM + BOX.w + 8},530 L${at(t, FORM + BOX.w + 8, [[prog, 0.4, SEARCH - 8, E.p2o]])},530`}
            style={{ opacity: at(t, 0, [[prog, 0.1, 1]]) }}
          />
          <g style={fx(t, [0, 0], [[first, 0.4, 1, null, E.p2o]])}>
            <path className="p02-e" markerEnd="url(#p02-ah)" d={`M${SEARCH + BOX.w + 8},530 L${EXEC - 8},530`} />
            <path className="p02-e" markerEnd="url(#p02-ah)" d={`M${EXEC + BOX.w + 8},530 L1506,530`} />
            <text className="p02-m" x="1421" y="512" textAnchor="middle">actions</text>
          </g>
          {CHIPS.map((x, k) => (
            <rect
              key={x} x={at(t, SEARCH + BOX.w - 40, [[sol + 0.08 * k, 0.5, x, E.expo]])} y="510" width="40" height="40" rx="9" strokeWidth="3"
              fill="rgba(63,185,80,0.14)" stroke={OK} style={fx(t, [0, 0], [[sol + 0.08 * k, 0.2, 1, null, E.p2o]])}
            />
          ))}
          {([[SEARCH, "Search", search, searchLit], [EXEC, "Execute", first, 0]] as [number, string, number, number][]).map(([x, label, t0, l]) => (
            <g key={label} style={fx(t, [0, 6], [arrive(t0)])}>
              <rect x={x} y={BOX.y} width={BOX.w} height={BOX.h} rx="14" strokeWidth="3" fill={mixed(l, FILL, SOFT)} stroke={mixed(l, STROKE, ACC)} />
              <text x={x + BOX.w / 2} y={BOX.y + 68} fill={INK}>{label}</text>
            </g>
          ))}
        </g>
      </svg>
      <div id="p02-head" style={fx(t, [1, 0], [out])}>
        {HEADS.map(([text, t0, t2]) => (
          <div key={text} style={fx(t, [0, 6], [[t0 + 0.1, 0.4, 1, 0, E.p2o], [t2, 0.15, 0, 8, E.p2i]])}>{text}</div>
        ))}
      </div>
      <div id="p02-steps" style={fx(t, [0, 6], [[t1, 0.5, 1, 0, E.expo], [world, 0.3, 0, 8, E.p2i]])}>
        {STEPS.map((s, k) => (
          <span key={s} style={{ color: k === 2 ? ACC : k < 2 ? PREV : MUTED }}>{s}</span>
        ))}
      </div>
    </>
  );
};
