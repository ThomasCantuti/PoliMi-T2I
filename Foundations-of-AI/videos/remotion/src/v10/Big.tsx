import { getLength } from "@remotion/paths";
import { ACC, at, Beat, E, FILL, Fx, fx, INK, MUTED, OK, PREV, Seg, SOFT, STROKE, useTime } from "../anim";

const BAD = "#f85149", INFO = "#39c5cf", EDGE = "#3a4757";
const css = `
  #b10-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #b10-head { position: absolute; left: 192px; top: 104px; font: 700 68px/1.1 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
  #b10-head .w { display: inline-block; }
  .b10-lit { font: 600 34px Inter, sans-serif; text-anchor: middle; }
  .b10-kb { font: 600 32px Inter, sans-serif; }
  .b10-lbl { font: 600 30px Inter, sans-serif; }
  .b10-m { font: 600 28px Inter, sans-serif; }
  .b10-road { font: 600 30px Inter, sans-serif; fill: #b4c0cc; text-anchor: middle; }
  .b10-cl { font: 600 26px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .b10-on { font: 500 24px Inter, sans-serif; fill: #7d8a99; text-anchor: end; }
  .b10-box { font: 700 44px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .b10-unsat { font: 600 30px Inter, sans-serif; fill: #3fb950; text-anchor: middle; }
`;

// ---- "If it rains, the street is wet" (logic.md, Intuition): the four worlds of Raining and Wet, in truth-table order
const RAIN: [boolean, boolean][] = [[false, false], [false, true], [true, false], [true, true]];
const implies = ([r, wet]: [boolean, boolean]) => !r || wet;
const RW = 260, RH = 150, RG = 40, RX0 = 960 - (4 * RW + 3 * RG) / 2, RY = 430;

// ---- web/src/figs/logic-models.ts: the 8 worlds for pits in [1,2], [2,2], [3,1]; [1,1] and [2,1] visited and safe
interface World { P12: boolean; P22: boolean; P31: boolean }
const P11 = false, P21 = false, B11 = false, B21 = true;
const R2 = (w: World) => B11 === (w.P12 || P21), R3 = (w: World) => B21 === (P11 || w.P22 || w.P31);
const kb = (w: World) => !P11 && R2(w) && R3(w) && !B11 && B21; // R1 ∧ … ∧ R5
const alpha = (w: World) => !w.P12; // α1 = ¬P1,2
const WORLDS: World[] = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ P12: !!(i & 4), P22: !!(i & 2), P31: !!(i & 1) }));
// the figure's order ¬α¬KB | ¬α KB | α KB | α ¬KB, so M(KB) and M(α) are contiguous runs of tiles
const key = (w: World) => (alpha(w) ? (kb(w) ? 2 : 3) : kb(w) ? 1 : 0);
const ORDER = [...WORLDS].sort((a, b) => key(a) - key(b));
const span = (f: (w: World) => boolean) => {
  const ix = ORDER.flatMap((w, i) => (f(w) ? [i] : []));
  return [ix[0], ix[ix.length - 1]];
};
const [K0, K1] = span(kb), [A0, A1] = span(alpha);
const TW = 60, TH = 44, DX = 70, CELL = 16, ROW = 7 * DX + TW;
const SQUARES: [number, number][] = [[1, 2], [2, 2], [1, 1], [2, 1], [3, 1]];
// the knowledge base as the page writes it; R2 (with R4) and R3 (with R5) are the sentences that cross worlds out
const KB_LINE = ["R_{1}: ¬P_{1,1}", "R_{2}: B_{1,1} ⇔ (P_{1,2} ∨ P_{2,1})", "R_{3}: B_{2,1} ⇔ (P_{1,1} ∨ P_{2,2} ∨ P_{3,1})", "R_{4}: ¬B_{1,1}", "R_{5}: B_{2,1}"];

// ---- web/src/figs/logic-resolution.ts: the refutation of KB ⊨ R as a derivation staircase; resolvents are computed
const INPUT: Record<string, string[]> = { "1": ["P"], "2": ["¬P", "¬Q", "R"], "3b": ["¬T", "Q"], "4": ["T"], "5": ["¬R"] };
const PROOF = ["2", "1", "3b", "4"]; // the input partner of each step, starting from the negated query (5)
const neg = (l: string) => (l.startsWith("¬") ? l.slice(1) : "¬" + l);
const resolve = (a: string[], b: string[]) => {
  const on = a.find((l) => b.includes(neg(l)))!;
  return { lits: [...new Set([...a.filter((l) => l !== on), ...b.filter((l) => l !== neg(on))])], on: on.replace("¬", "") };
};
const STEPS = PROOF.reduce<{ last: string[]; partner: string[]; out: string[]; on: string }[]>((acc, p) => {
  const last = acc.length ? acc[acc.length - 1].out : INPUT["5"], r = resolve(INPUT[p], last);
  return [...acc, { last, partner: INPUT[p], out: r.lits, on: r.on }];
}, []);
// figure geometry (viewBox 720 x 356): row r has the clause derived last at X(r), its input partner at X(r) + 130
const FX = (r: number) => 320 + r * 65, FY = (r: number) => 30 + r * 72;
const VX = (x: number) => 1000 + (x - 264) * 1.6, VY = (y: number) => 270 + (y - 30) * 1.4;
const BW = 112 * 1.6, BH = 48;

// ---- both roads end in one box
const ROAD_A = "M555,600 C555,760 610,810 736,810";
const ROAD_B = `M${VX(FX(4))},${VY(FY(4)) + BH + 4} C${VX(FX(4))},790 1420,810 1184,810`;
const LA = getLength(ROAD_A), LB = getLength(ROAD_B);

/** Text with `_{…}` subscripts as tspans (like label() in web/src/figs/shell.ts). */
const Sub = ({ s, prevSub = false }: { s: string; prevSub?: boolean }) => {
  const parts = s.split(/_\{([^}]*)\}/);
  return (
    <>
      {parts.map((p, i) => {
        const sub = i % 2 === 1, before = i === 0 ? prevSub : (i - 1) % 2 === 1;
        return p ? (
          <tspan key={i} dy={(sub ? 7 : 0) - (before && !sub ? 7 : 0)} fontSize={sub ? "0.7em" : undefined}>{p}</tspan>
        ) : null;
      })}
    </>
  );
};
const endsSub = (s: string) => s.endsWith("}");

export const Big = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const IN = (t0: number, d = 0.5): Fx => [t0, d, 1, 0, E.expo];
  const OUT = (t0: number): Fx => [t0, 0.2, 0, 8, E.p2i];
  const out = fx(t, [1, 0], [OUT(dur - 0.25)]);

  // A: one sentence crosses out one kind of world
  const worldsT = w("possible worlds"), ifT = w("if it rains"), rulesT = w("rules out");
  const kbT = w("a knowledge base");
  // B: the knowledge base keeps the worlds that survive all its sentences; α covers them all
  const setT = w("set of worlds"), r2T = w("survive"), r3T = w("all its sentences"), kbDone = wEnd("all its sentences");
  const factT = w("a fact follows"), everyT = w("true in every"), verdictT = w("every one of them") + 0.3;
  // C: two roads, model checking and theorem proving
  const checkT = w("you can check"), enumT = w("enumerating worlds"), rewT = w("rewriting sentences");
  const stepT = [w("sentences with"), w("with sound"), w("rules like"), w("resolution")];
  // D: one test
  const bothT = w("both come down"), testT = w("one test"), kbPlusT = w("knowledge base plus"), negT = w("negated query"), noneT = w("has no model");

  // the row of worlds: big in B, then it moves to the left road
  const k = at(t, 2.4, [[checkT, 0.7, 1.25, E.p2io]]);
  const x0 = at(t, 960 - (ROW * 2.4) / 2, [[checkT, 0.7, 555 - (ROW * 1.25) / 2, E.p2io]]);
  const y0 = at(t, 430, [[checkT, 0.7, 460, E.p2io]]);
  const L = (u: number) => x0 + u * k, T = (u: number) => y0 + u * k;
  const crossAt = (w: World, i: number) => (!R2(w) ? r2T + 0.06 * i : !R3(w) ? r3T + 0.1 : null);
  const kbLineColor = (i: number) => at(t, PREV, i === 1 ? [[r2T, 0.25, ACC, E.p2o], [r3T, 0.25, PREV]] : i === 2 ? [[r3T, 0.25, ACC, E.p2o], [kbDone, 0.25, PREV]] : []);
  const sweep = at(t, 0, ORDER.map((_, i): Seg<number> => [enumT + 0.13 * i, 0.09, i * DX, E.p2o]));
  const DIAG = Math.hypot(TW - 8, TH - 8);

  // the staircase: step s (1..4) brings in its input partner, cancels a pair, and derives the next clause
  const cur = (r: number) => (r === 0 ? rewT : stepT[r - 1] + 0.3);
  const nextCur = (r: number) => (r < 4 ? stepT[r] + 0.3 : Infinity);
  const box = (r: number, x: number, lits: string[], arrive: number, on: string | null, onT: number, isCur: boolean) => {
    const bot = !lits.length;
    const offT = r < 4 ? nextCur(r) : Infinity;
    const stroke = bot ? OK : isCur ? at(t, ACC, [[offT, 0.25, STROKE]]) : STROKE;
    const fill = bot ? "rgba(63,185,80,0.14)" : isCur ? at(t, SOFT, [[offT, 0.25, FILL]]) : FILL;
    return (
      <g key={`${r}-${x}`} style={fx(t, [0, 6], [IN(arrive, 0.4)])}>
        <rect x={VX(x) - BW / 2} y={VY(FY(r))} width={BW} height={BH} rx="10" strokeWidth="2.5" style={{ fill, stroke }} />
        <text className="b10-cl" x={VX(x)} y={VY(FY(r)) + 33}>
          {bot ? (
            <tspan fontWeight="700" fontSize="44" fill={OK}>⊥</tspan>
          ) : (
            lits.map((l, i) => (
              <tspan key={l}>
                {i ? " ∨ " : ""}
                <tspan style={{ fill: l.replace("¬", "") === on ? at(t, INK, [[onT, 0.2, BAD, E.p2o], [onT + 0.4, 0.2, INK]]) : INK }}>{l}</tspan>
              </tspan>
            ))
          )}
        </text>
      </g>
    );
  };

  return (
    <>
      <style>{css}</style>
      <svg id="b10-svg" viewBox="0 0 1920 1080" style={out}>
        <defs>
          <marker id="b10-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* A: Raining ⇒ Wet rules out rain with a dry street */}
        <g style={fx(t, [1, 0], [OUT(kbT - 0.05)])}>
          {RAIN.map((world, i) => {
            const x = RX0 + i * (RW + RG), crossed = !implies(world);
            return (
              <g key={i} style={fx(t, [0, 6], [IN(worldsT + 0.08 * i)])}>
                <g opacity={crossed ? at(t, 1, [[rulesT, 0.3, 0.35, E.p2o]]) : 1}>
                  <rect x={x} y={RY} width={RW} height={RH} rx="16" fill="#1c232d" strokeWidth="2.5" style={{ stroke: crossed ? at(t, "#2a3441", [[rulesT, 0.25, BAD, E.p2o]]) : "#2a3441" }} />
                  {["Raining", "Wet"].map((name, j) => (
                    <text key={name} className="b10-lit" x={x + RW / 2} y={RY + 62 + j * 50} fill={world[j] ? INK : MUTED}>
                      {world[j] ? name : "¬" + name}
                    </text>
                  ))}
                </g>
                {crossed && (
                  <line
                    x1={x + 14} y1={RY + 14} x2={x + RW - 14} y2={RY + RH - 14} stroke={BAD} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={Math.hypot(RW - 28, RH - 28)} strokeDashoffset={at(t, Math.hypot(RW - 28, RH - 28), [[rulesT, 0.3, 0, E.p2o]])}
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* B: the knowledge base */}
        <text className="b10-kb" x="192" y="250" style={fx(t, [0, 6], [IN(w("knowledge base") + 0.15), OUT(checkT)])}>
          {KB_LINE.map((s, i) => (
            <tspan key={s} dx={i ? 40 : 0} style={{ fill: kbLineColor(i) }}>
              <Sub s={s} prevSub={i > 0 && endsSub(KB_LINE[i - 1])} />
            </tspan>
          ))}
        </text>
        <g transform={`translate(${x0} ${y0}) scale(${k})`}>
          <rect
            x={K0 * DX - 6} y="-6" width={(K1 - K0) * DX + TW + 12} height={TH + 12} rx="10" fill="rgba(124,140,255,0.14)" stroke={ACC} strokeWidth="2.5" vectorEffect="non-scaling-stroke"
            style={fx(t, [0, 0], [[kbDone, 0.4, 1, null, E.p2o]])}
          />
          <rect
            x={A0 * DX - 12} y="-14" width={(A1 - A0) * DX + TW + 24} height={TH + 28} rx="14" fill="none" stroke={INFO} strokeWidth="3" strokeDasharray="12 8" vectorEffect="non-scaling-stroke"
            style={fx(t, [0, 0], [[everyT, 0.4, 1, null, E.p2o]])}
          />
          {ORDER.map((world, i) => {
            const c = crossAt(world, i), inKb = kb(world);
            return (
              <g key={i} transform={`translate(${i * DX} 0)`} style={fx(t, [0, 6], [IN(setT + 0.05 * i)])}>
                <g opacity={c === null ? 1 : at(t, 1, [[c, 0.3, 0.35, E.p2o]])}>
                  <rect
                    width={TW} height={TH} rx="7" fill="#1c232d" vectorEffect="non-scaling-stroke"
                    style={{ stroke: inKb ? at(t, "#2a3441", [[kbDone, 0.25, ACC, E.p2o]]) : c === null ? "#2a3441" : at(t, "#2a3441", [[c, 0.25, BAD, E.p2o]]), strokeWidth: inKb ? at(t, 2, [[kbDone, 0.25, 3.5]]) : 2 }}
                  />
                  {SQUARES.map(([sx, sy]) => {
                    const cx = 6 + (sx - 1) * CELL, cy = 6 + (2 - sy) * CELL;
                    const pit = sx === 1 && sy === 2 ? world.P12 : sx === 2 && sy === 2 ? world.P22 : sx === 3 && sy === 1 ? world.P31 : false;
                    return (
                      <g key={`${sx}${sy}`}>
                        <rect x={cx} y={cy} width={CELL} height={CELL} fill={sy === 1 && sx < 3 ? "#232c38" : "#161b22"} stroke={EDGE} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        {pit && <circle cx={cx + CELL / 2} cy={cy + CELL / 2} r="5" fill={INK} />}
                      </g>
                    );
                  })}
                </g>
                {c !== null && (
                  <line x1="4" y1="4" x2={TW - 4} y2={TH - 4} stroke={BAD} strokeWidth="2.2" strokeLinecap="round" strokeDasharray={DIAG} strokeDashoffset={at(t, DIAG, [[c, 0.3, 0, E.p2o]])} />
                )}
              </g>
            );
          })}
          {/* C: enumerating the worlds, one at a time */}
          <rect
            x={sweep - 5} y="-5" width={TW + 10} height={TH + 10} rx="9" fill="none" stroke={INK} strokeWidth="3" vectorEffect="non-scaling-stroke"
            opacity={at(t, 0, [[enumT, 0.1, 1], [enumT + 0.13 * 8, 0.2, 0]])}
          />
        </g>
        <text className="b10-lbl" x={L(-12)} y={T(-14) - 22} fill={PREV} style={fx(t, [0, 6], [IN(factT), OUT(checkT)])}>
          <Sub s="α_{1} = ¬P_{1,2} (no pit in [1,2])" />
        </text>
        <text className="b10-lbl" x={L(ROW + 12)} y={T(-14) - 22} textAnchor="end" fill={OK} style={fx(t, [0, 6], [IN(verdictT), OUT(checkT)])}>
          <Sub s="M(KB) ⊆ M(α_{1}): entailed" />
        </text>
        <text className="b10-m" x={L(K0 * DX - 6)} y={T(TH + 14) + 34} fill={ACC} style={fx(t, [0, 6], [IN(kbDone, 0.4)])}>M(KB)</text>
        <text className="b10-m" x={L(A1 * DX + TW + 12)} y={T(TH + 14) + 34} textAnchor="end" fill={INFO} style={fx(t, [0, 6], [IN(everyT, 0.4)])}>
          <Sub s="M(α_{1})" />
        </text>

        {/* C: the two roads */}
        <text className="b10-road" x="555" y="220" style={fx(t, [0, 6], [IN(enumT)])}>model checking</text>
        <text className="b10-road" x={VX(482.5)} y="220" style={fx(t, [0, 6], [IN(rewT)])}>theorem proving</text>
        {STEPS.map((s, r) => (
          <g key={r}>
            {[FX(r), FX(r) + 130].map((x, j) => {
              const x2 = VX(FX(r + 1)) + (j ? 22 : -22), y1 = VY(FY(r)) + BH, y2 = VY(FY(r + 1)) - 3;
              const len = Math.hypot(x2 - VX(x), y2 - y1);
              return (
                <line
                  key={j} x1={VX(x)} y1={y1} x2={x2} y2={y2} strokeWidth="3" markerEnd={t >= stepT[r] + 0.35 ? "url(#b10-ah)" : undefined}
                  strokeDasharray={len} strokeDashoffset={at(t, len, [[stepT[r] + 0.15, 0.25, 0, E.p2o]])} opacity={at(t, 0, [[stepT[r] + 0.15, 0.05, 1]])}
                  style={{ stroke: at(t, ACC, [[r < 3 ? stepT[r + 1] + 0.15 : bothT, 0.25, STROKE]]) }}
                />
              );
            })}
            <text className="b10-on" x={VX(FX(r + 1)) - BW / 2 - 12} y={VY(FY(r + 1)) + 33} style={fx(t, [0, 6], [IN(stepT[r] + 0.15, 0.4)])}>
              on {s.on}
            </text>
          </g>
        ))}
        {box(0, FX(0), STEPS[0].last, rewT, STEPS[0].on, stepT[0] + 0.1, true)}
        {STEPS.map((s, r) => box(r, FX(r) + 130, s.partner, stepT[r], s.on, stepT[r] + 0.1, false))}
        {STEPS.map((s, r) => box(r + 1, FX(r + 1), s.out, cur(r + 1), r + 1 < 4 ? STEPS[r + 1].on : null, r + 1 < 4 ? stepT[r + 1] + 0.1 : Infinity, true))}

        {/* D: both roads end in the same test */}
        {[[ROAD_A, LA], [ROAD_B, LB]].map(([d, len], i) => (
          <path
            key={i} d={d as string} fill="none" stroke={STROKE} strokeWidth="3" markerEnd={t >= bothT + 0.1 * i + 0.5 ? "url(#b10-ah)" : undefined}
            strokeDasharray={len} strokeDashoffset={at(t, len as number, [[bothT + 0.1 * i, 0.6, 0, E.p2io]])} opacity={at(t, 0, [[bothT + 0.1 * i, 0.05, 1]])}
          />
        ))}
        <g style={fx(t, [0, 6], [IN(testT)])}>
          <rect
            x="740" y="750" width="440" height="120" rx="16" strokeWidth="3"
            style={{ fill: at(t, FILL, [[noneT, 0.3, "rgba(63,185,80,0.14)", E.p2o]]), stroke: at(t, ACC, [[noneT, 0.3, OK, E.p2o]]) }}
          />
          <text className="b10-box" x="960" y="806">
            <tspan style={{ fill: at(t, "#3a4757", [[kbPlusT, 0.3, INK, E.p2o]]) }}>KB</tspan>
            <tspan style={{ fill: at(t, "#3a4757", [[negT, 0.3, INK, E.p2o]]) }}> ∧ ¬α</tspan>
          </text>
          <text className="b10-unsat" x="960" y="850" style={fx(t, [0, 6], [IN(noneT, 0.4)])}>unsatisfiable</text>
        </g>
      </svg>
      <div id="b10-head" style={fx(t, [1, 0], [OUT(kbT - 0.05)])}>
        {["Raining", "⇒", "Wet"].map((word, i) => (
          <span key={word}>
            {i ? " " : ""}
            <span className="w" style={fx(t, [0, 6], [[ifT + 0.12 * i, 0.2, 1, 0]])}>{word}</span>
          </span>
        ))}
      </div>
    </>
  );
};
