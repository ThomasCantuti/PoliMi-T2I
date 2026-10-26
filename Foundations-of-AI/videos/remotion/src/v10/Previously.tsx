import { ACC, at, Beat, E, FILL, Fx, fx, OK, Seg, STROKE, useTime } from "../anim";
import { MapIntro } from "../shared/map";

const BAD = "#f85149", EDGE = "#3a4757", PANEL = "#161b22";
const css = `
  #p10-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .p10-k { font: 600 28px Inter, sans-serif; fill: #7d8a99; }
  .p10-p text { font: 600 30px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .p10-g text { font: 700 24px Inter, sans-serif; fill: #fff; text-anchor: middle; }
  .p10-m { font: 700 60px Inter, sans-serif; text-anchor: middle; }
  .p10-note { font: 600 36px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .p10-var { font: 700 30px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .p10-dom { font: 500 28px Inter, sans-serif; fill: #7d8a99; text-anchor: middle; }
`;

// Three states from earlier chapters, one card each, under the station names of the course map.
const CW = 480, CH = 440, CY = 340, CX = [192, 720, 1248], MID = CX.map((x) => x + CW / 2);
const KICKER = ["2 Formulation", "5 CSP", "7 Adversarial"];
// web/src/figs/search-8puzzle.ts: the start state (0 = blank); its blank can move up, down, left: three successors
const PUZZLE = [8, 2, 7, 3, 4, 0, 5, 1, 6];
// web/src/figs/csp-graph.ts: the constraint graph, the p. 261 solution and its colors (the edges are the 9 shared borders it computes)
const GRAPH: Record<string, [number, number]> = { WA: [468, 175], NT: [528, 95], Q: [624, 95], SA: [576, 175], NSW: [668, 175], V: [624, 255], T: [668, 325] };
const SOLUTION: Record<string, string> = { WA: "#e5484d", NT: "#2f9e6a", Q: "#e5484d", NSW: "#2f9e6a", V: "#e5484d", SA: "#3e6ee8", T: "#2f9e6a" };
const BORDERS = [["WA", "NT"], ["WA", "SA"], ["NT", "SA"], ["NT", "Q"], ["SA", "Q"], ["SA", "NSW"], ["SA", "V"], ["Q", "NSW"], ["NSW", "V"]];
const gx = (x: number) => MID[1] + (x - 568) * 1.2, gy = (y: number) => 590 + (y - 210) * 1.2;
// web/src/figs/adv-ttt-eval.ts: the third position of the slides; X and O in the game-tree MAX/MIN colors
const TTT = "XOX.O....";
// logic.md: a rule between two true/false variables, the CSP view of SAT
const VARS: [number, string][] = [[1080, "Raining"], [1560, "Wet"]];
const VY = 560, VR = 72;

export const Previously = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const arrive = [w("a node"), w("an assignment"), w("a board")];
  const rule = w("general rule");
  // "use it to work out new facts": the note tries each state in turn and does not stick
  const hop = [w("and use it"), w("work out"), w("new facts")], H = 0.35;
  const home = wEnd("new facts"), csp = w("the csp chapter"), hint = w("left a hint");
  // "that's where logic starts": the note flies onto the constraint, rewriting itself in logic on the way
  const vars = w("variables"), tf = w("true or false"), cons = w("with constraints"), logic = w("that's where logic"), swap = w("where logic");
  const FLY = 0.8, land = logic + FLY;
  const IN = (t0: number): Fx => [t0, 0.5, 1, 0, E.expo];
  const out = fx(t, [1, 0], [[dur - 0.25, 0.2, 0, 8, E.p2i]]);

  const flash = (h: number, base: string): Seg<string>[] => [[h + H, 0.15, BAD, E.p2o], [h + H + 0.3, 0.25, base]];
  const cardFx = (i: number) => fx(t, [0, 6], [IN(arrive[i]), ...(i === 1 ? [] : [[csp, 0.3, 0, 8, E.p2i] as Fx])]);
  const cardStroke = (i: number) =>
    at(t, EDGE, [...flash(hop[i], EDGE), ...(i === 1 ? ([[csp, 0.25, ACC, E.p2o], [vars, 0.25, EDGE]] as Seg<string>[]) : [])]);
  const card = (i: number) => (
    <>
      <rect x={CX[i]} y={CY} width={CW} height={CH} rx="18" fill={PANEL} strokeWidth="2.5" style={{ stroke: cardStroke(i) }} />
      <text className="p10-k" x={CX[i] + 28} y={CY + 52}>{KICKER[i]}</text>
    </>
  );

  const shake = (a: number): Seg<number>[] => [[a, 0.06, 10], [a + 0.06, 0.06, -8], [a + 0.12, 0.06, 0]];
  const nx =
    at(t, 960, [...hop.map((h, i): Seg<number> => [h, H, MID[i], E.p2io]), [home, 0.4, 960, E.p2io], [logic, FLY, 1320, E.p2io]]) +
    at(t, 0, hop.flatMap((h) => shake(h + H)));
  const ny = at(t, 232, [[hop[0], H, CY - 18, E.p2io], [home, 0.4, 232, E.p2io], [logic, FLY, VY, E.p2io]]);
  const ns = at(t, 1, [[hop[0], H, 0.72, E.p2io], [home, 0.4, 1, E.p2io], [logic, FLY, 0.8, E.p2io]]);
  const noteStroke = at(t, ACC, [...hop.flatMap((h) => flash(h, ACC)), [csp, 0.25, STROKE], [logic, 0.25, ACC, E.p2o], [land, 0.3, OK, E.p2o]]);
  const nw = at(t, 640, [[swap, 0.35, 380, E.p2o]]);
  const edgeLen = VARS[1][0] - VARS[0][0] - 2 * VR;

  return (
    <>
      <MapIntro here={10} from={[1, 5, 3]} out={arrive[0] - 0.45} />
      <style>{css}</style>
      <svg id="p10-svg" viewBox="0 0 1920 1080" style={out}>
        <defs>
          <marker id="p10-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* a node: an 8-puzzle state with its three successors */}
        <g style={cardFx(0)}>
          {card(0)}
          <g className="p10-p">
            {PUZZLE.map((v, i) => {
              const x = MID[0] - 108 + (i % 3) * 72, y = 412 + Math.floor(i / 3) * 72;
              return (
                <g key={i}>
                  <rect x={x + 2} y={y + 2} width="68" height="68" rx="8" fill={v ? "#1c232d" : "#232c38"} stroke={EDGE} strokeWidth="2" />
                  {v ? <text x={x + 36} y={y + 47}>{v}</text> : null}
                </g>
              );
            })}
          </g>
          {[-80, 0, 80].map((dx) => (
            <g key={dx}>
              <line x1={MID[0]} y1="634" x2={MID[0] + dx} y2="684" stroke={STROKE} strokeWidth="3" markerEnd="url(#p10-ah)" />
              <rect x={MID[0] + dx - 32} y="690" width="64" height="44" rx="8" fill="none" stroke={STROKE} strokeWidth="2.5" strokeDasharray="7 6" />
            </g>
          ))}
        </g>

        {/* an assignment: the colored constraint graph of Australia; it slides left when the CSP hint is taken up */}
        <g style={cardFx(1)} transform={`translate(${at(t, 0, [[hint, 0.6, CX[0] - CX[1], E.p2io]])} 0)`}>
          {card(1)}
          {BORDERS.map(([a, b]) => (
            <line key={a + b} x1={gx(GRAPH[a][0])} y1={gy(GRAPH[a][1])} x2={gx(GRAPH[b][0])} y2={gy(GRAPH[b][1])} stroke={STROKE} strokeWidth="2.5" />
          ))}
          <g className="p10-g">
            {Object.entries(GRAPH).map(([v, [x, y]]) => (
              <g key={v}>
                <circle cx={gx(x)} cy={gy(y)} r="32" fill={SOLUTION[v]} stroke={PANEL} strokeWidth="2.5" />
                <text x={gx(x)} y={gy(y) + 9}>{v}</text>
              </g>
            ))}
          </g>
        </g>

        {/* a board: tic-tac-toe */}
        <g style={cardFx(2)}>
          {card(2)}
          {[1, 2].map((k) => (
            <g key={k} stroke={EDGE} strokeWidth="3">
              <line x1={MID[2] - 132 + k * 88} y1="458" x2={MID[2] - 132 + k * 88} y2="722" />
              <line x1={MID[2] - 132} y1={458 + k * 88} x2={MID[2] + 132} y2={458 + k * 88} />
            </g>
          ))}
          {[...TTT].map((m, i) =>
            m === "." ? null : (
              <text key={i} className="p10-m" x={MID[2] - 132 + (i % 3) * 88 + 44} y={458 + Math.floor(i / 3) * 88 + 66} fill={m === "X" ? "#7c8cff" : "#f778ba"}>
                {m}
              </text>
            ),
          )}
        </g>

        {/* the CSP hint: two variables that are true or false, and a constraint between them */}
        <line
          x1={VARS[0][0] + VR} y1={VY} x2={VARS[1][0] - VR} y2={VY} strokeWidth="3"
          strokeDasharray={edgeLen} strokeDashoffset={at(t, edgeLen, [[cons, 0.45, 0, E.p2o]])}
          style={{ stroke: at(t, ACC, [[logic, 0.25, STROKE]]) }}
        />
        {VARS.map(([x, name], i) => (
          <g key={name}>
            <g style={fx(t, [0, 6], [IN(vars + 0.12 * i)])}>
              <circle cx={x} cy={VY} r={VR} fill={PANEL} stroke={STROKE} strokeWidth="2.5" />
              <text className="p10-var" x={x} y={VY + 11}>{name}</text>
            </g>
            <text className="p10-dom" x={x} y={VY + VR + 48} style={fx(t, [0, 6], [IN(tf + 0.12 * i)])}>
              {"{true, false}"}
            </text>
          </g>
        ))}

        {/* the rule: no state has a place for it, until it becomes the constraint */}
        <g style={fx(t, [0, 6], [IN(rule), [csp, 0.3, 0.45, null, E.p2o], [logic, 0.3, 1, null, E.p2o]])} transform={`translate(${nx} ${ny}) scale(${ns})`}>
          <rect x={-nw / 2} y="-44" width={nw} height="88" rx="14" fill={FILL} strokeWidth="3" style={{ stroke: noteStroke }} />
          <text className="p10-note" y="13" opacity={at(t, 1, [[swap, 0.15, 0, E.p2i]])}>It rains ⇒ the street is wet</text>
          <text className="p10-note" y="13" opacity={at(t, 0, [[swap + 0.12, 0.25, 1, E.p2o]])}>Raining ⇒ Wet</text>
        </g>
      </svg>
    </>
  );
};
