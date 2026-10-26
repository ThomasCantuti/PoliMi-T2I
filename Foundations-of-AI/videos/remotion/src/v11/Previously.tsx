import { ACC, at, Beat, E, FILL, Fx, fx, INK, Seg, STROKE, useTime } from "../anim";
import { MapIntro } from "../shared/map";
import { Rooms } from "./rooms";

const PANEL = "#161b22";
const css = `
  #p11-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .p11-code { font: 600 30px Inter, sans-serif; fill: #e6edf3; }
  .p11-note { font: 500 24px Inter, sans-serif; fill: #7d8a99; }
  .p11-s { font: 600 56px Inter, sans-serif; fill: #7d8a99; text-anchor: middle; }
  .p11-sen { font: 600 36px Inter, sans-serif; fill: #e6edf3; }
`;

// Left, search: a node holding a state of the robot-and-box rooms (plan-rooms.ts), the successor function and a hand-written
// heuristic beside it (planning.md: forward planning's actions(s), result(s, a); exam 30 Aug 2022's h(s) = x − 1).
const NODE = { x: 192, y: 395, w: 400, h: 150 };
const CARDS: { y: number; lines: [string, string][] }[] = [
  { y: 350, lines: [["actions(s)", "p11-code"], ["result(s, a)", "p11-code"]] },
  { y: 510, lines: [["h(s) = x − 1", "p11-code"], ["x: the box is in R", "p11-note"]] },
];
const CX = 642, CW = 300, CH = 120;
// Right, logic (logic.md): a state and a rule as sentences, and what a program derives from them (Modus Ponens)
const LOGIC = { x: 1188, y: 325, w: 540, h: 290 };

export const Previously = ({ dur, w }: Beat) => {
  const t = useTime();
  const IN = (t0: number, d = 0.5): Fx => [t0, d, 1, 0, E.expo];
  const out = fx(t, [1, 0], [[dur - 0.25, 0.2, 0, 8, E.p2i]]);
  const nodeT = w("domain"), cardT = [w("successor function"), w("heuristic")], opaque = w("opaque");
  const logicT = w("logic describes"), stateT = w("states and rules"), ruleT = w("rules in"), readT = w("program can read");
  const planT = w("planning puts"), togetherT = w("together");
  // the two halves slide together, then the box opens: its state is now readable
  const slide = at(t, 0, [[planT, 0.7, 100, E.p2io]]);
  const lid = at(t, 0, [[opaque, 0.3, 1, E.p2o], [togetherT, 0.4, 0, E.p2o]]);
  const lit = (on: number, off: number): Seg<string>[] => [[on, 0.25, ACC, E.p2o], [off, 0.25, STROKE]];

  return (
    <>
      <MapIntro here={11} from={[3, 4, 10]} out={nodeT - 0.45} />
      <style>{css}</style>
      <svg id="p11-svg" viewBox="0 0 1920 1080" style={out}>
        {/* both halves become one */}
        <rect
          x={NODE.x + 100 - 36} y="290" width={LOGIC.x + LOGIC.w - 100 + 36 - (NODE.x + 100 - 36)} height="370" rx="24" fill="none" stroke={ACC} strokeWidth="3"
          style={fx(t, [0, 0], [[togetherT, 0.4, 1, null, E.p2o]])}
        />
        <g transform={`translate(${slide} 0)`}>
          <g style={fx(t, [0, 6], [IN(nodeT)])}>
            <rect x={NODE.x} y={NODE.y} width={NODE.w} height={NODE.h} rx="14" fill={PANEL} stroke={STROKE} strokeWidth="2.5" />
            <Rooms x={NODE.x + 20} y={NODE.y + 26} w={NODE.w - 40} robot={1} box={2} />
            {/* "the states are opaque": search only ever sees s */}
            <g opacity={lid}>
              <rect x={NODE.x + 2} y={NODE.y + 2} width={NODE.w - 4} height={NODE.h - 4} rx="12" fill="#232c38" />
              <text className="p11-s" x={NODE.x + NODE.w / 2} y={NODE.y + NODE.h / 2 + 20}>s</text>
            </g>
          </g>
          {CARDS.map((c, i) => (
            <g key={i} style={fx(t, [0, 6], [IN(cardT[i])])}>
              <line x1={NODE.x + NODE.w} y1={NODE.y + NODE.h / 2 + (i ? 30 : -30)} x2={CX} y2={c.y + CH / 2} stroke={STROKE} strokeWidth="2.5" strokeDasharray="7 6" />
              <rect
                x={CX} y={c.y} width={CW} height={CH} rx="12" fill={FILL} strokeWidth="2.5"
                style={{ stroke: at(t, STROKE, lit(cardT[i], i ? opaque : cardT[1])) }}
              />
              {c.lines.map(([text, cls], j) => (
                <text key={j} className={cls} x={CX + 28} y={c.y + 50 + j * 44}>
                  {text}
                  {j === 1 && i === 1 && <tspan dy="6" fontSize="0.75em">x</tspan>}
                </text>
              ))}
            </g>
          ))}
        </g>

        <g transform={`translate(${-slide} 0)`}>
          <g style={fx(t, [0, 6], [IN(logicT)])}>
            <rect x={LOGIC.x} y={LOGIC.y} width={LOGIC.w} height={LOGIC.h} rx="14" fill={PANEL} stroke={STROKE} strokeWidth="2.5" />
          </g>
          <text className="p11-sen" x={LOGIC.x + 44} y={LOGIC.y + 76} style={fx(t, [0, 6], [IN(stateT, 0.4)])}>Raining</text>
          <text className="p11-sen" x={LOGIC.x + 44} y={LOGIC.y + 140} style={fx(t, [0, 6], [IN(ruleT, 0.4)])}>Raining ⇒ Wet</text>
          <line
            x1={LOGIC.x + 44} y1={LOGIC.y + 174} x2={LOGIC.x + 290} y2={LOGIC.y + 174} stroke={INK} strokeWidth="2.5"
            strokeDasharray="246" strokeDashoffset={at(t, 246, [[readT, 0.35, 0, E.p2o]])}
          />
          <text className="p11-note" x={LOGIC.x + 312} y={LOGIC.y + 182} style={fx(t, [0, 6], [IN(readT + 0.2, 0.4)])}>Modus Ponens</text>
          <text
            className="p11-sen" x={LOGIC.x + 44} y={LOGIC.y + 238}
            style={{ ...fx(t, [0, 6], [IN(readT + 0.3, 0.4)]), fill: at(t, ACC, [[togetherT, 0.25, INK]]) }}
          >
            Wet
          </text>
        </g>
      </svg>
    </>
  );
};
