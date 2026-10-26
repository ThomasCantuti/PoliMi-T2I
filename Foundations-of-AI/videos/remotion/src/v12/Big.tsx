import { ACC, at, Beat, E, FILL, Fx, fx, INK, MUTED, OK, PREV, Seg, SOFT, STROKE, useTime } from "../anim";

const BAD = "#f85149", WARN = "#e3b341";

const css = `
  #b12-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #b12-head { position: absolute; left: 192px; top: 96px; font: 700 60px/1.15 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
  #b12-steps { position: absolute; right: 192px; top: 118px; display: flex; gap: 34px; font: 600 28px/1.2 Inter, sans-serif; color: #7d8a99; }
  .b12-nd text { font: 600 30px Inter, sans-serif; text-anchor: middle; }
  .b12-ch text { font: 600 28px Inter, sans-serif; text-anchor: middle; }
  .b12-th { font: 500 26px Inter, sans-serif; fill: #7d8a99; }
  .b12-tf { font: 600 28px Inter, sans-serif; fill: #b4c0cc; }
  .b12-tp { font: 600 28px Inter, sans-serif; fill: #e6edf3; font-variant-numeric: tabular-nums; }
  .b12-tr { font: 600 30px Inter, sans-serif; text-anchor: middle; }
  #b12-eq { position: absolute; left: 0; right: 0; top: 770px; height: 60px; font: 600 40px/1.2 Inter, sans-serif; color: #e6edf3; font-variant-numeric: tabular-nums; }
  #b12-eq > div { position: absolute; left: 0; right: 0; top: 0; text-align: center; white-space: nowrap; }
  #b12-eq sub { font-size: 0.6em; line-height: 0; }
`;

// web/src/figs/bn-burglary.ts: the network (AIMA Figure 13.2), its CPTs and P(x | parents)
type V = "B" | "E" | "A" | "J" | "M";
const NAME: Record<V, string> = { B: "Burglary", E: "Earthquake", A: "Alarm", J: "JohnCalls", M: "MaryCalls" };
const PARENTS: Record<V, V[]> = { B: [], E: [], A: ["B", "E"], J: ["A"], M: ["A"] };
const CPT: Record<V, number[]> = { B: [0.001], E: [0.002], A: [0.95, 0.94, 0.29, 0.001], J: [0.9, 0.05], M: [0.7, 0.01] };
const row = (x: V, ev: Partial<Record<V, boolean>>) => PARENTS[x].reduce((r, q) => 2 * r + (ev[q] ? 0 : 1), 0);
const P = (x: V, value: boolean, ev: Partial<Record<V, boolean>>) => (value ? CPT[x][row(x, ev)] : 1 - CPT[x][row(x, ev)]);
const POS: Record<V, [number, number]> = { B: [190, 50], E: [530, 50], A: [360, 160], J: [210, 280], M: [510, 280] };
const VARS: V[] = ["B", "E", "A", "J", "M"];
const EDGES: [V, V][] = [["B", "A"], ["E", "A"], ["A", "J"], ["A", "M"]];

// web/src/figs/bn-enumeration.ts: P(b, j, m) and P(¬b, j, m), every number from the CPTs
const TF = [true, false];
const path = (e: boolean, a: boolean, b: boolean) => P("A", a, { B: b, E: e }) * P("J", true, { A: a }) * P("M", true, { A: a });
const sumE = (e: boolean, b: boolean) => P("E", e, {}) * TF.reduce((s, a) => s + path(e, a, b), 0);
const joint = (b: boolean) => P("B", b, {}) * TF.reduce((s, e) => s + sumE(e, b), 0);
const num = (x: number, p = 6) => String(+x.toPrecision(p));
const p2 = (x: number) => (num(x).length < 4 ? x.toFixed(2) : num(x)); // 0.9 → 0.90, as the page writes it

// The chain-rule example of the page: P(j, m, a, ¬b, ¬e) = P(j | a) P(m | a) P(a | ¬b, ¬e) P(¬b) P(¬e)
const SC: Record<V, boolean> = { J: true, M: true, A: true, B: false, E: false };
const ORDER: V[] = ["J", "M", "A", "B", "E"];
const lit = (x: V, v: boolean) => (v ? "" : "¬") + x.toLowerCase();
const FACTORS = ORDER.map((x) => P(x, SC[x], SC));
const PRODUCT = FACTORS.reduce((a, b) => a * b, 1);
const Z = joint(true) + joint(false);
// the four scenarios summed in P(¬b, j, m): (e, a) = tt, tf, ft, ff
const COMBOS = [[true, true], [true, false], [false, true], [false, false]];

// app units (viewBox 720 x 330) → frame: x 1.9, nodes 104 x 36 → 198 x 68, centered with the Alarm CPT on its right
const K = 1.9, W = 104 * K, H = 36 * K;
const X = (x: number) => 546 + (x - 138) * K, Y = (y: number) => 215 + (y - 32) * K;
const cx = (v: V) => X(POS[v][0]), cy = (v: V) => Y(POS[v][1]);
const seg = (p: V, c: V) => {
  const [x1, y1, x2, y2] = [cx(p), cy(p), cx(c), cy(c)];
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const f = Math.min(W / 2 / Math.abs(dx || 1e-9), H / 2 / Math.abs(dy || 1e-9));
  return [x1 + dx * f, y1 + dy * f, x2 - dx * f - (dx / len) * 3 * K, y2 - dy * f - (dy / len) * 3 * K];
};
// the scenario's value of each node, in a chip beside it (left of B, J, A: the right of A holds its CPT)
const CW = 64, CH = 46;
const chipX = (v: V) => (["B", "J", "A"].includes(v) ? cx(v) - W / 2 - 12 - CW / 2 : cx(v) + W / 2 + 12 + CW / 2);
const TX = X(452), TY = Y(118), TCOL = [0, 44, 88];

const STEPS = ["product", "sum", "division", "reading the graph"];

export const Big = ({ dur, w }: Beat) => {
  const t = useTime();
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const arrive = (t0: number): Fx => [t0, 0.5, 1, 0, E.expo];
  const leave = (t0: number): Fx => [t0, 0.3, 0, 8, E.p2i];
  // a causal story drawn with arrows: the nodes in causal order, then the arrows
  const ARR: Record<V, number> = { B: w("bayesian"), E: w("bayesian") + 0.12, A: w("causal"), J: w("story"), M: w("story") + 0.12 };
  const drawn = w("drawn");
  // one local question: Alarm given its direct causes, its CPT fills in
  const each = w("each node"), likely = w("how likely"), causes = w("direct causes");
  // multiply: each factor of the page's example in turn, its node lit; then the product
  const mult = w("multiply"), slot = (i: number) => w("local answers") + 0.35 * i, scen = w("probability");
  // add: the hidden E and A run through their four values; divide: the conditional
  const add = w("add"), cyc = (i: number) => w("scenarios together") + 0.3 * i, anyP = w("any probability");
  const div = w("divide"), cond = w("conditional");
  // reading the graph: JohnCalls – Alarm – MaryCalls is active, observing Alarm blocks it
  const graph = w("and the arrows"), tell = w("arrows tell"), vars = w("which variables"), infl = w("influence"), obs = w("what you've"), blk = obs + 0.3;
  const STEP_T = [mult, add, div, graph];
  // one equation slot: each line blurs out at the next step, the next one blurs in 0.1 s later
  const lineFx = (t0: number, t1: number) => fx(t, [0, 0], [[t0, 0.25, 1, 0, E.p2o, [0, 6]], [t1, 0.15, 0, 8, E.p2i]]);
  const on = (t0: number, d = 0.35): Seg<number>[] => [[t0, d, 1, E.p2o]];
  const isSlot = (v: V) => ORDER.indexOf(v);
  const lights = (v: V, onC: string, offC: string): Seg<string>[] => [
    ...(v === "A" ? ([[each, 0.25, onC, E.p2o], [mult, 0.25, offC, E.p2o]] as Seg<string>[]) : []),
    [slot(isSlot(v)), 0.2, onC, E.p2o],
    [slot(isSlot(v)) + 0.35, 0.25, offC, E.p2o],
  ];
  // chip texts: [time, text]; E and A run through the four scenarios, then are summed out
  const chipTexts = (v: V): [number, string][] => {
    const first: [number, string] = [slot(isSlot(v)), lit(v, SC[v])];
    if (v !== "E" && v !== "A") return [first];
    const vals = COMBOS.map(([e, a]) => lit(v, v === "E" ? e : a));
    return [first, ...vals.map((s, i): [number, string] => [cyc(i), s]).filter(([, s], i) => s !== (i ? vals[i - 1] : first[1]))];
  };
  const hidden = (v: V) => v === "E" || v === "A";

  return (
    <>
      <style>{css}</style>
      <svg id="b12-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <defs>
          <marker id="b12-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* the arrows grow from parent to child */}
        {EDGES.map(([p, c], i) => {
          const [x1, y1, x2, y2] = seg(p, c);
          const g = at(t, 0, [[drawn + 0.12 * i, 0.4, 1, E.p2o]]);
          const trail = p === "A";
          const color: Seg<string>[] = trail
            ? [[tell, 0.25, PREV, E.p2o], [infl, 0.25, OK, E.p2o], [blk, 0.25, BAD, E.p2o]]
            : [[causes, 0.25, ACC, E.p2o], [mult, 0.25, STROKE, E.p2o], [tell, 0.25, PREV, E.p2o], [vars, 0.25, STROKE, E.p2o]];
          const width: Seg<number>[] = trail
            ? [[tell, 0.25, 4, E.p2o], [infl, 0.25, 4.5, E.p2o]]
            : [[causes, 0.25, 4, E.p2o], [mult, 0.25, 3, E.p2o], [tell, 0.25, 4, E.p2o], [vars, 0.25, 3, E.p2o]];
          return (
            <line
              key={p + c} x1={x1} y1={y1} x2={x1 + (x2 - x1) * g} y2={y1 + (y2 - y1) * g} markerEnd="url(#b12-ah)" fill="none"
              strokeDasharray={trail ? `14 ${at(t, 0, [[blk, 0.25, 10, E.p2o]])}` : undefined}
              style={{ opacity: at(t, 0, [[drawn + 0.12 * i, 0.1, 1]]), stroke: at(t, STROKE, color), strokeWidth: at(t, 3, width) }}
            />
          );
        })}

        {/* the nodes */}
        {VARS.map((v) => {
          const end = v === "J" || v === "M";
          const fill: Seg<string>[] = [...lights(v, SOFT, FILL), ...(v === "A" ? ([[obs, 0.25, ACC, E.p2o]] as Seg<string>[]) : [])];
          const stroke: Seg<string>[] = [...lights(v, ACC, STROKE), ...(v === "A" ? [[obs, 0.25, ACC, E.p2o] as Seg<string>] : end ? [[vars, 0.25, WARN, E.p2o] as Seg<string>] : [])];
          return (
            <g key={v} className="b12-nd" style={fx(t, [0, 6], [arrive(ARR[v])])}>
              <rect
                x={cx(v) - W / 2} y={cy(v) - H / 2} width={W} height={H} rx={H / 2}
                style={{ fill: at(t, FILL, fill), stroke: at(t, STROKE, stroke), strokeWidth: end ? at(t, 2.5, [[vars, 0.25, 3.5, E.p2o]]) : 2.5 }}
              />
              <text x={cx(v)} y={cy(v) + 11} style={{ fill: v === "A" ? at(t, INK, [[obs, 0.25, "#ffffff", E.p2o]]) : INK }}>{NAME[v]}</text>
            </g>
          );
        })}

        {/* the scenario: one value per node */}
        {VARS.map((v) => {
          const texts = chipTexts(v);
          const t0 = texts[0][0];
          return (
            <g key={v} className="b12-ch" style={fx(t, [0, 6], [[t0, 0.4, 1, 0, E.expo], leave(hidden(v) ? cyc(4) : graph)])}>
              <rect
                x={chipX(v) - CW / 2} y={cy(v) - CH / 2} width={CW} height={CH} rx={CH / 2} fill="#0e1116" strokeWidth="2.5"
                style={{ stroke: at(t, PREV, [[t0, 0.2, ACC, E.p2o], [t0 + 0.35, 0.25, PREV, E.p2o], ...(hidden(v) ? ([[cyc(0), 0.2, ACC, E.p2o]] as Seg<string>[]) : [])]) }}
              />
              {texts.map(([t1, s], k) => (
                <text
                  key={k} x={chipX(v)} y={cy(v) + 10}
                  style={{ fill: INK, opacity: at(t, 0, [[t1, 0.12, 1, E.p2o], ...(k + 1 < texts.length ? ([[texts[k + 1][0] - 0.06, 0.08, 0]] as Seg<number>[]) : [])]) }}
                >
                  {s}
                </text>
              ))}
            </g>
          );
        })}

        {/* Alarm's CPT, where the app draws it */}
        <g style={fx(t, [1, 0], [leave(graph)])}>
          <g style={fx(t, [0, 6], [[likely, 0.35, 1, 0, E.p2o]])}>
            {["B", "E", "P(a | B, E)"].map((s, i) => (
              <text key={s} className="b12-th" x={TX + TCOL[i]} y={TY}>{s}</text>
            ))}
            <line x1={TX} y1={TY + 12} x2={TX + TCOL[2] + 140} y2={TY + 12} stroke="#3a4757" strokeWidth="2" />
          </g>
          {CPT.A.map((p, j) => {
            const hit = j === row("A", SC);
            const color = (base: string) => (hit ? at(t, base, [[slot(2), 0.2, ACC, E.p2o], [slot(2) + 0.35, 0.25, base, E.p2o]]) : base);
            return (
              <g key={j} style={fx(t, [0, 6], [[causes + 0.12 * j, 0.35, 1, 0, E.p2o]])}>
                <text className="b12-tf" x={TX} y={TY + 46 + 40 * j} style={{ fill: color(PREV) }}>{TF[j >> 1] ? "t" : "f"}</text>
                <text className="b12-tf" x={TX + TCOL[1]} y={TY + 46 + 40 * j} style={{ fill: color(PREV) }}>{TF[j & 1] ? "t" : "f"}</text>
                <text className="b12-tp" x={TX + TCOL[2]} y={TY + 46 + 40 * j} style={{ fill: color(INK) }}>{p2(p)}</text>
              </g>
            );
          })}
        </g>

        {/* JohnCalls – Alarm – MaryCalls */}
        <text className="b12-tr" x={cx("A")} y={cy("J") + 10} fill={OK} style={fx(t, [0, 6], [[infl, 0.3, 1, 0, E.p2o], [blk, 0.15, 0, 8, E.p2i]])}>active</text>
        <text className="b12-tr" x={cx("A")} y={cy("J") + 10} fill={BAD} style={fx(t, [0, 6], [[blk + 0.05, 0.3, 1, 0, E.p2o]])}>blocked</text>
      </svg>

      <div id="b12-head" style={fx(t, [0, 6], [[ARR.B, 0.35, 1, 0, E.p2o], out])}>Burglary network</div>
      <div id="b12-steps" style={fx(t, [0, 6], [[ARR.B, 0.35, 1, 0, E.p2o], out])}>
        {STEPS.map((s, k) => (
          <span key={s} style={{ color: at(t, MUTED, STEP_T.map((t0, i): Seg<string> => [t0, 0.25, k === i ? ACC : k < i ? PREV : MUTED, E.p2o])) }}>{s}</span>
        ))}
      </div>

      <div id="b12-eq" style={fx(t, [1, 0], [out])}>
        <div style={lineFx(mult, add)}>
          P({ORDER.map((x) => lit(x, SC[x])).join(", ")}) ={" "}
          {FACTORS.map((f, i) => (
            <span key={i} style={{ opacity: at(t, 0, on(slot(i), 0.25)), color: at(t, ACC, [[slot(i) + 0.35, 0.25, INK, E.p2o]]) }}>
              {i ? " · " : ""}
              {p2(f)}
            </span>
          ))}
          <span style={{ opacity: at(t, 0, on(scen)), color: ACC }}> = {num(PRODUCT, 3)}</span>
        </div>
        <div style={lineFx(add + 0.1, div)}>
          P(¬b, j, m) = Σ<sub>e</sub> Σ<sub>a</sub> P(j, m, a, ¬b, e)
          <span style={{ opacity: at(t, 0, on(anyP)), color: ACC }}> = {num(joint(false), 5)}</span>
        </div>
        <div style={lineFx(div + 0.1, graph)}>
          P(¬b | j, m) = {num(joint(false), 5)} / ({num(joint(true), 5)} + {num(joint(false), 5)})
          <span style={{ opacity: at(t, 0, on(cond)), color: ACC }}> = {num(joint(false) / Z, 3)}</span>
        </div>
      </div>
    </>
  );
};
