import { getLength } from "@remotion/paths";
import { ACC, at, Beat, E, FILL, Fx, fx, INK, PREV, STROKE, useTime } from "../anim";
import { MapIntro, svgScale } from "../shared/map";

const css = `
  #p12-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .p12-pl text { font: 600 40px Inter, sans-serif; text-anchor: middle; }
  .p12-op { font: 500 60px Inter, sans-serif; fill: #e6edf3; stroke: #e6edf3; stroke-width: 2.5px; text-anchor: middle; }
  .p12-q { font: 700 72px Inter, sans-serif; fill: #e3b341; text-anchor: middle; }
  .p12-true { font: 600 34px Inter, sans-serif; fill: #3fb950; text-anchor: middle; }
  .p12-nd rect { fill: #1c232d; stroke: #4b5a6e; stroke-width: 2.5; }
  .p12-nd text { font: 600 25px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .p12-nd.pill text, #p12-n0 text, #p12-n1 text { font-size: 28px; }
  .p12-e { fill: none; stroke: #4b5a6e; stroke-width: 3; }
  .p12-m { font: 500 24px Inter, sans-serif; fill: #7d8a99; }
  .p12-ttl { font: 700 30px Inter, sans-serif; fill: #b4c0cc; }
  #p12-head { position: absolute; left: 192px; top: 96px; font: 700 60px/1.15 Inter, sans-serif; letter-spacing: -0.01em; color: #e6edf3; white-space: nowrap; }
  #p12-head sub, #p12-head sup { font-size: 0.55em; line-height: 0; }
  #p12-lbl { position: absolute; right: 192px; top: 118px; font: 600 28px/1.2 Inter, sans-serif; }
`;

// The logic sentence: [text, slot width, is a variable]; the variables are drawn as the burglary network's nodes.
const SENT: [string, number, boolean][] = [
  ["Alarm", 210, true], ["⇒", 120, false], ["Burglary", 260, true], ["∨", 110, false], ["Earthquake", 300, true],
];
const SY = 470, PH = 88;
const before = (i: number) => SENT.slice(0, i).reduce((a, s) => a + s[1], 0);
const pillX = (i: number) => 960 - before(SENT.length) / 2 + before(i);
const SX = SENT.map((s, i) => pillX(i) + s[1] / 2);
// the bracket under "Burglary ∨ Earthquake"
const BR = `M${pillX(2)},${SY + PH / 2 + 18} L${pillX(2)},${SY + PH / 2 + 34} L${pillX(4) + SENT[4][1]},${SY + PH / 2 + 34} L${pillX(4) + SENT[4][1]},${SY + PH / 2 + 18}`;
const BRL = getLength(BR);

// The utility-based agent of video 01 (src/v01/Arch.tsx, from web/src/figs/agents-arch.ts): its last stepper frame.
const U = 3, ALL = [0, 1, 2, 3], MODEL = [1, 2, 3];
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
const cur = (has: number[]) => has[0] === U; // what the utility-based agent adds, in the accent as in video 01

export const Previously = ({ dur, w }: Beat) => {
  const t = useTime();
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  // logic: the sentence, the alarm rings, "burglary or earthquake" is true, but which one?
  const sIn = w("or") - 0.1, alarm = w("alarm"), ring = w("goes off"), either = w("burglary or earthquake"), which = w("not which");
  // chapter one: the utility-based agent and its expected-utility formula; the accent moves to the probabilities
  const back = w("back"), agent = w("chapter one"), util = w("utility-based"), weighed = w("weighed"), probs = w("probabilities"), from = w("where those");
  const arrive = (t0: number): Fx => [t0, 0.5, 1, 0, E.expo];
  const pulse = (p: number) => ({
    opacity: at(t, 0, [[p, 0.05, 0.7], [p + 0.05, 0.75, 0, E.p2o]]),
    transform: svgScale(at(t, 1, [[p, 0.8, 1.4, E.p2o]]), SX[0], SY),
  });

  return (
    <>
      <MapIntro here={12} from={[10, 1, 8]} out={w("false") + 0.3} />
      <style>{css}</style>
      <svg id="p12-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <defs>
          <marker id="p12-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* Alarm ⇒ Burglary ∨ Earthquake */}
        <g style={fx(t, [1, 0], [[back, 0.3, 0, 8, E.p2i]])}>
          {[ring, ring + 0.4].map((p) => {
            const { opacity, transform } = pulse(p);
            return <rect key={p} x={pillX(0)} y={SY - PH / 2} width={SENT[0][1]} height={PH} rx={PH / 2} fill="none" stroke={ACC} strokeWidth="4" opacity={opacity} transform={transform} />;
          })}
          {SENT.map(([text, sw, isVar], i) => (
            <g key={text} style={fx(t, [0, 6], [arrive(sIn + 0.08 * i)])}>
              {isVar ? (
                <g className="p12-pl">
                  <rect
                    x={pillX(i)} y={SY - PH / 2} width={sw} height={PH} rx={PH / 2} strokeWidth="2.5"
                    style={{ fill: i ? FILL : at(t, FILL, [[alarm, 0.25, ACC, E.p2o]]), stroke: i ? STROKE : at(t, STROKE, [[alarm, 0.25, ACC, E.p2o]]) }}
                  />
                  <text x={SX[i]} y={SY + 14} style={{ fill: i ? INK : at(t, INK, [[alarm, 0.25, "#ffffff", E.p2o]]) }}>{text}</text>
                </g>
              ) : (
                <text className="p12-op" x={SX[i]} y={SY + 20}>{text}</text>
              )}
            </g>
          ))}
          <path d={BR} fill="none" stroke="#3fb950" strokeWidth="3" strokeDasharray={BRL} strokeDashoffset={at(t, BRL, [[either, 0.45, 0, E.p2o]])} />
          <text className="p12-true" x={(pillX(2) + pillX(4) + SENT[4][1]) / 2} y={SY + PH / 2 + 84} style={fx(t, [0, 6], [[either + 0.25, 0.35, 1, 0, E.p2o]])}>
            true
          </text>
          {[2, 4].map((i, k) => (
            <text key={i} className="p12-q" x={SX[i]} y={SY - PH / 2 - 34} style={fx(t, [0, 6], [arrive(which + 0.12 * k)])} transform={`translate(0 ${at(t, -18, [[which + 0.12 * k, 0.5, 0, E.expo]])})`}>
              ?
            </text>
          ))}
        </g>

        {/* the utility-based agent */}
        <g style={fx(t, [0, 6], [arrive(agent)])}>
          <g style={{ opacity: at(t, 1, [[probs, 0.4, 0.2, E.p2o]]) }}>
            <rect x="192" y="190" width="1196" height="680" rx="22" fill="none" stroke="#3a4757" strokeWidth="2" strokeDasharray="10 8" />
            <text className="p12-ttl" x="224" y="846">Agent</text>
            <rect x="1514" y="190" width="176" height="680" rx="22" strokeWidth="3" fill="#1c232d" stroke={STROKE} />
            <text className="p12-ttl" x="1602" y="530" textAnchor="middle" transform="rotate(-90 1602 530)" dy="10">Environment</text>
            {EDGES.filter(([, has]) => has.includes(U)).map(([d, has]) => (
              <path key={d} className="p12-e" d={path(d)} markerEnd="url(#p12-ah)" style={{ stroke: cur(has) ? ACC : STROKE }} />
            ))}
            {NODES.map(([x, y, nw, text, pill, has], k) => {
              if (!has.includes(U)) return null;
              const h = pill ? 56 : 64;
              return (
                <g key={k} id={`p12-n${k}`} className={pill ? "p12-nd pill" : "p12-nd"}>
                  <rect
                    x={X(x) - (nw * KX) / 2} y={Y(y) - h / 2} width={nw * KX} height={h} rx={pill ? h / 2 : 10}
                    style={cur(has) ? { fill: "rgba(124,140,255,0.16)", stroke: ACC } : undefined}
                  />
                  <text x={X(x)} y={Y(y) + 9}>{text}</text>
                </g>
              );
            })}
            {NOTES.map(([x, y, text, anchor]) => (
              <text key={text} className="p12-m" x={X(x)} y={Y(y)} textAnchor={anchor}>{text}</text>
            ))}
          </g>
        </g>
      </svg>
      <div id="p12-head" style={fx(t, [0, 6], [[util, 0.4, 1, 0, E.p2o], out])}>
        <span style={{ opacity: at(t, 1, [[from, 0.4, 0.35, E.p2o]]) }}>
          a<sup>*</sup> = argmax<sub>a</sub> Σ<sub>s′</sub>{" "}
        </span>
        <span style={{ color: at(t, INK, [[probs, 0.25, ACC, E.p2o]]) }}>P(s′ | s, a)</span>{" "}
        <span style={{ color: at(t, INK, [[weighed, 0.25, ACC, E.p2o], [probs, 0.25, INK, E.p2o]]), opacity: at(t, 1, [[from, 0.4, 0.35, E.p2o]]) }}>
          U(s′)
        </span>
      </div>
      <div id="p12-lbl" style={{ ...fx(t, [0, 6], [[util + 0.1, 0.4, 1, 0, E.p2o], [from, 0.4, 0.35, null, E.p2o], out]), color: at(t, ACC, [[probs, 0.25, PREV, E.p2o]]) }}>
        Utility-based agent
      </div>
    </>
  );
};
