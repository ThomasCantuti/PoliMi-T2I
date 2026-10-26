import { ACC, at, Beat, E, FILL, Fx, fx, INK, MUTED, OK, PREV, Seg, STROKE, useTime } from "../anim";
import { Rooms } from "./rooms";

const BAD = "#f85149", PANEL = "#161b22", OK_SOFT = "rgba(63,185,80,0.14)", BAD_SOFT = "rgba(248,81,73,0.14)";
const css = `
  #b11-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #b11-ex { position: absolute; left: 192px; top: 96px; width: 800px; height: 80px; }
  #b11-ex div { position: absolute; left: 0; top: 0; white-space: nowrap; font: 700 60px/1.15 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
  #b11-steps { position: absolute; right: 192px; top: 118px; display: flex; gap: 34px; font: 600 27px/1.2 Inter, sans-serif; color: #7d8a99; }
  .b11-h2 { font: 700 32px Inter, sans-serif; fill: #e6edf3; }
  .b11-f { font: 500 26px Inter, sans-serif; }
  .b11-name { font: 700 29px Inter, sans-serif; fill: #e6edf3; }
  .b11-m { font: 500 24px Inter, sans-serif; fill: #7d8a99; }
  .b11-tag { font: 600 24px Inter, sans-serif; }
  .b11-act { font: 600 24px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; paint-order: stroke; stroke: #0e1116; stroke-width: 10px; stroke-linejoin: round; }
  .b11-sat { font: 600 30px Inter, sans-serif; fill: #e6edf3; text-anchor: middle; }
  .b11-v { font: 700 28px Inter, sans-serif; text-anchor: middle; }
  .b11-L { font: 700 36px Inter, sans-serif; fill: #e6edf3; }
  .b11-t { font: 500 26px Inter, sans-serif; fill: #7d8a99; text-anchor: middle; }
`;

// ---- web/src/figs/plan-rooms.ts: the robot-and-box domain of exam 30 Aug 2022
interface Act { name: string; pre: string[]; add: string[]; del: string[] }
const CONNECTS: [string, string, string][] = [["D1", "R1", "R2"], ["D1", "R2", "R1"], ["D2", "R2", "R3"], ["D2", "R3", "R2"]];
const INIT = ["InRoom(ROBOT,R1)", "InRoom(BOX1,R2)", ...CONNECTS.map(([d, a, b]) => `Connects(${d},${a},${b})`), "Box(BOX1)"];
const GOAL = ["Box(BOX1)", "InRoom(BOX1,R1)"];
const ACTIONS: Act[] = CONNECTS.flatMap(([d, a, b]) => [
  { name: `GoThru(${d},${a},${b})`, pre: [`InRoom(ROBOT,${a})`, `Connects(${d},${a},${b})`], add: [`InRoom(ROBOT,${b})`], del: [`InRoom(ROBOT,${a})`] },
  {
    name: `PushThru(BOX1,${d},${a},${b})`, pre: [`InRoom(ROBOT,${a})`, `InRoom(BOX1,${a})`, `Connects(${d},${a},${b})`, "Box(BOX1)"],
    add: [`InRoom(ROBOT,${b})`, `InRoom(BOX1,${b})`], del: [`InRoom(ROBOT,${a})`, `InRoom(BOX1,${a})`],
  },
]).sort((x, y) => (x.name < y.name ? -1 : 1));
const applicable = (st: Set<string>, a: Act) => a.pre.every((p) => st.has(p));
const result = (st: Set<string>, a: Act) => new Set([...[...st].filter((f) => !a.del.includes(f)), ...a.add]);
const room = (st: Iterable<string>, obj: string) => +[...st].find((f) => f.startsWith(`InRoom(${obj},`))!.slice(-2, -1);
const rank = (f: string) => (f.startsWith("InRoom(ROBOT") ? 0 : f.startsWith("InRoom(BOX1") ? 1 : 2 + INIT.indexOf(f));
const sorted = (facts: Iterable<string>) => [...facts].sort((x, y) => rank(x) - rank(y));
const isStatic = (f: string) => !f.startsWith("InRoom(");
const GO = ACTIONS.find((a) => a.name === "GoThru(D1,R1,R2)")!; // the recipe card of the stepper
const FACTS = sorted(INIT);
const NO = ACTIONS.find((x) => x.name.startsWith("PushThru") && x.pre[0] === "InRoom(ROBOT,R1)")!; // not applicable in Init
const NO_MISSING = NO.pre.filter((p) => !INIT.includes(p));

// ---- web/src/figs/plan-forward.ts: breadth-first graph search from Init, goal test at generation, lexicographic order
type Status = "root" | "new" | "repeated" | "goal";
interface N { st: Set<string>; parent: number; act: string; status: Status; depth: number; same?: number }
const key = (st: Set<string>) => sorted(st).join("|");
const TREE = (() => {
  const nodes: N[] = [{ st: new Set(INIT), parent: -1, act: "", status: "root", depth: 0 }];
  const reached = new Map([[key(nodes[0].st), 0]]), frontier = [0];
  while (frontier.length) {
    const i = frontier.shift()!;
    for (const a of ACTIONS.filter((b) => applicable(nodes[i].st, b))) {
      const st = result(nodes[i].st, a), goal = GOAL.every((g) => st.has(g)), same = reached.get(key(st));
      const status: Status = goal ? "goal" : same !== undefined ? "repeated" : "new", c = nodes.length;
      nodes.push({ st, parent: i, act: a.name, status, depth: nodes[i].depth + 1, same });
      if (status === "new") {
        reached.set(key(st), c);
        frontier.push(c);
      }
      if (goal) return nodes;
    }
  }
  return nodes;
})();
const LEVEL_Y = [222, 432, 652], NW = 300, NH = 116, MINI = 252;
const pos = TREE.map((n) => {
  const level = TREE.filter((m) => m.depth === n.depth);
  return [192 + ((level.indexOf(n) + 0.5) * 1536) / level.length, LEVEL_Y[n.depth]] as const;
});
const onPlan = (i: number): boolean => TREE[i].status === "goal" || TREE.some((m, j) => m.parent === i && onPlan(j));
const tag = (n: N, i: number) => `n${i}` + (n.status === "repeated" ? ` = n${n.same} · repeated` : n.status === "goal" ? " · goal" : "");

// ---- web/src/figs/plan-regression.ts: the only relevant and consistent action for the goal, and the regressed goal
const relevant = (g: Set<string>, a: Act) => a.add.some((x) => g.has(x));
const consistent = (g: Set<string>, a: Act) => !a.del.some((x) => g.has(x));
const G0 = new Set(GOAL), LAST = ACTIONS.find((a) => relevant(G0, a) && consistent(G0, a))!;
const G1 = new Set([...[...G0].filter((x) => !LAST.add.includes(x)), ...LAST.pre]);
const GX = [1180, 300], GW = 440, GTOP = 340; // G0 on the right, G1 to its left: the plan reads left to right

// ---- web/src/figs/plan-satplan.ts: two rooms; every model is found by checking all assignments against the axioms
const FLUENTS = ["AtR1", "AtR2"], INIT_TRUE = ["AtR1"], SGOAL = "AtR2";
const ACTS = [{ n: "MoveR", pre: "AtR1", add: "AtR2", del: "AtR1" }, { n: "MoveL", pre: "AtR2", add: "AtR1", del: "AtR2" }];
type Model = Record<string, boolean>;
const range = (n: number) => [...Array(n).keys()];
const symbols = (L: number) => [...FLUENTS.flatMap((f) => range(L + 1).map((t) => `${f}^${t}`)), ...ACTS.flatMap((a) => range(L).map((t) => `${a.n}^${t}`))];
const holds = (v: Model, L: number) => {
  if (FLUENTS.some((f) => v[`${f}^0`] !== INIT_TRUE.includes(f)) || !v[`${SGOAL}^${L}`]) return false;
  for (let t = 0; t < L; t++) {
    if (ACTS.some((a) => v[`${a.n}^${t}`] && !v[`${a.pre}^${t}`])) return false;
    for (const f of FLUENTS) {
      const causes = ACTS.some((a) => a.add === f && v[`${a.n}^${t}`]), undoes = ACTS.some((a) => a.del === f && v[`${a.n}^${t}`]);
      if (v[`${f}^${t + 1}`] !== (causes || (v[`${f}^${t}`] && !undoes))) return false;
    }
    if (ACTS.filter((a) => v[`${a.n}^${t}`]).length > 1) return false;
  }
  return true;
};
const models = (L: number) => {
  const syms = symbols(L);
  return range(2 ** syms.length).map((m) => Object.fromEntries(syms.map((x, i) => [x, !!((m >> i) & 1)])) as Model).filter((v) => holds(v, L));
};
const UNSAT0 = models(0).length === 0, M1 = models(1)[0];
const PLAN = ACTS.filter((a) => M1[`${a.n}^0`]).map((a) => a.n).join(", ");
// figure geometry (viewBox 760 x 252), columns t = 0, actions at t = 0, t = 1 (SATPLAN stops at the first satisfiable L)
const SY: Record<string, number> = { AtR1: 84, MoveR: 128, MoveL: 182, AtR2: 226 };
const SX = (x: number) => 960 + (x - 227) * 2.4, SYv = (y: number) => 300 + (y - 84) * 2.4;
const SW = 92 * 2.4, SH = 64;
type Val = "?" | "T" | "F" | "✗";
const SNODES: { k: string; name: string; t: number; x: number; y: number; col: number }[] = [
  ...FLUENTS.map((f) => ({ k: `${f}^0`, name: f, t: 0, x: SX(75), y: SYv(SY[f]), col: 0 })),
  ...ACTS.map((a) => ({ k: `${a.n}^0`, name: a.n, t: 0, x: SX(227), y: SYv(SY[a.n]), col: 1 })),
  ...FLUENTS.map((f) => ({ k: `${f}^1`, name: f, t: 1, x: SX(380), y: SYv(SY[f]), col: 2 })),
];

const DOMAINS = ["Robot and box", "Two rooms", "Blocks world", "Air cargo", "Mars rover"];
const STEPS = ["Representation", "Forward planning", "Backward planning", "SATPlan"];

export const Big = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const IN = (t0: number, d = 0.5): Fx => [t0, d, 1, 0, E.expo];
  const OUT = (t0: number): Fx => [t0, 0.2, 0, 8, E.p2i];
  const out = fx(t, [1, 0], [OUT(dur - 0.25)]);
  const draw = (len: number, t0: number, d = 0.3) => ({
    strokeDasharray: len, strokeDashoffset: at(t, len, [[t0, d, 0, E.p2o]]), opacity: at(t, 0, [[t0, 0.05, 1]]),
  });
  const head = (t0: number, d = 0.3) => (t >= t0 + d * 0.8 ? "url(#b11-ah)" : undefined);

  // A: a state is a list of facts, an action a recipe card
  const stateT = w("a state"), factsT = w("list of facts"), cardT = w("recipe card");
  const checkT = w("if these facts hold"), eraseT = w("erase these"), writeT = w("write these");
  // B: the planner reads the cards: the result becomes a node of a search tree
  const becauseT = w("because the cards"), plannerT = w("the planner");
  // C: forward from the current state
  const fwdT = w("search forward"), curT = w("from the current"), goalT = w("current state") + 0.1;
  // D: backward from the goal
  const bwdT = w("or backward"), g0T = w("from the goal"), whichT = w("which card"), prodT = w("produced it");
  // E: SATPlan
  const turnT = w("or turn"), planLT = w("a plan of"), logicT = w("into logic"), handT = w("hand it"), satT = w("sat solver");
  // F: one planner, any domain
  const oneT = w("one planner"), anyT = w("any domain");

  // head: the domain (swaps like the examples in v01), and where we are in the chapter
  const SHOWS: [number, number][] = [[stateT, 0], [turnT, 1], [anyT, 2], [anyT + 0.3, 3], [anyT + 0.6, 4]];
  const exFx = (e: number) =>
    fx(t, [0, 0], SHOWS.flatMap(([t0, i], j): Fx[] => [
      ...(j > 0 && SHOWS[j - 1][1] === e ? [[t0, 0.15, 0, 8, E.p2i] as Fx] : []),
      ...(i === e ? [[t0 + 0.1, 0.25, 1, 0, E.p2o, [0, 6]] as Fx] : []),
    ]));
  const stepT = [stateT, fwdT, bwdT, turnT];
  const stepColor = (k: number) => at(t, MUTED, [...stepT.map((t0, i): Seg<string> => [t0, 0.25, k === i ? ACC : k < i ? PREV : MUTED, E.p2o]), [oneT, 0.3, INK, E.p2o]]);

  // A + B: the big rooms are n1's state in the tree
  const morph = (from: number, to: number) => at(t, from, [[becauseT, 0.7, to, E.p2io]]);
  const shift = at(t, 0, [[writeT, 0.3, 1, E.p2o]]);
  const rowY = (i: number) => 278 + i * 50.4;
  const n1 = TREE.findIndex((n) => n.depth === 1);

  // C: node colors
  const nodeStroke = (i: number) => {
    const n = TREE[i];
    if (n.status === "goal") return at(t, STROKE, [[goalT, 0.3, OK, E.p2o]]);
    if (i === 0) return at(t, STROKE, [[fwdT, 0.25, ACC, E.p2o], [curT, 0.25, STROKE]]);
    if (i === n1) return at(t, STROKE, [[curT, 0.25, ACC, E.p2o], [goalT, 0.25, STROKE]]);
    return STROKE;
  };
  const childT = (i: number) => curT + 0.15 * (i - n1 - 1);
  const appearT = (i: number) => (i === 0 ? becauseT + 0.5 : i === n1 ? becauseT + 0.45 : childT(i));
  const edgeT = (i: number) => (i === n1 ? becauseT + 0.65 : childT(i));

  // E: one value per SAT node over time
  const valSegs = (k: string): [number, Val][] => {
    const solved: Val = M1[k] ? "T" : "F";
    const col = SNODES.find((s) => s.k === k)!.col;
    if (k.endsWith("^0") && FLUENTS.some((f) => k.startsWith(f)))
      return [[logicT, k === `${SGOAL}^0` && UNSAT0 ? "✗" : INIT_TRUE.some((f) => k.startsWith(f)) ? "T" : "F"], [handT, "?"], [satT + 0.15 * col, solved]];
    return [[satT + 0.15 * col, solved]];
  };
  const valAt = (k: string, v: Val) => at(t, v === "?" ? 1 : 0, valSegs(k).map(([t0, x]): Seg<number> => [t0, 0.2, x === v ? 1 : 0]));
  const sColor = (k: string, kind: "fill" | "stroke") =>
    at(t, kind === "fill" ? FILL : STROKE, valSegs(k).map(([t0, x]): Seg<string> => [
      t0, 0.25,
      x === "T" ? (kind === "fill" ? OK_SOFT : OK) : x === "✗" ? (kind === "fill" ? BAD_SOFT : BAD) : x === "F" ? (kind === "fill" ? "#232c38" : STROKE) : kind === "fill" ? FILL : STROKE,
      E.p2o,
    ]));
  const satIn = (s: (typeof SNODES)[number]) => (s.col === 0 ? planLT : handT + 0.1 * s.col);

  return (
    <>
      <style>{css}</style>
      {/* on "one planner" the two-rooms figure steps back, so the domain names cycling in the head don't label it */}
      <svg id="b11-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [[oneT, 0.4, 0.15, null, E.p2o], OUT(dur - 0.25)])}>
        <defs>
          <marker id="b11-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* A: the state as a list of facts */}
        <g style={fx(t, [1, 0], [OUT(becauseT)])}>
          <text className="b11-h2" x="969" y="215" style={fx(t, [0, 6], [IN(factsT)])}>state s</text>
          {FACTS.map((f, i) => {
            const pre = GO.pre.includes(f), del = GO.del.includes(f), base = isStatic(f) ? MUTED : INK;
            const color = at(t, base, [...(pre ? ([[checkT, 0.25, ACC, E.p2o]] as Seg<string>[]) : []), ...(pre || del ? ([[eraseT, 0.25, del ? BAD : base, E.p2o]] as Seg<string>[]) : [])]);
            return (
              <g key={f} transform={`translate(0 ${rowY(i ? i + shift : i)})`} style={fx(t, [0, 6], [IN(factsT + 0.06 * (i + 1), 0.4)])}>
                {pre && <text className="b11-f" x="969" fill={ACC} opacity={at(t, 0, [[checkT, 0.25, 1], [eraseT, 0.2, 0]])}>✓</text>}
                {del && <text className="b11-f" x="972" fill={BAD} opacity={at(t, 0, [[eraseT, 0.25, 1]])}>−</text>}
                <text className="b11-f" x="1001" style={{ fill: color, textDecoration: del && t >= eraseT ? "line-through" : "none" }}>{f}</text>
              </g>
            );
          })}
          <g transform={`translate(0 ${rowY(1)})`} style={fx(t, [0, 6], [IN(writeT + 0.1, 0.4)])}>
            <text className="b11-f" x="969" fill={OK}>+</text>
            <text className="b11-f" x="1001" fill={OK} fontWeight="700">{GO.add[0]}</text>
          </g>
        </g>

        {/* A: the action as a recipe card */}
        <g style={fx(t, [0, 6], [IN(cardT), OUT(becauseT)])}>
          <rect x="192" y="429" width="693" height="311" rx="20" fill={FILL} strokeWidth="2.5" style={{ stroke: at(t, ACC, [[checkT, 0.25, STROKE]]) }} />
          <text className="b11-name" x="221" y="483">{GO.name}</text>
          <text className="b11-m" x="221" y="521">schema GoThru(d, r1, r2)</text>
          <text className="b11-m" x="221" y="568">P:</text>
          {GO.pre.map((p, i) => (
            <g key={p}>
              <text className="b11-f" x="276" y={568 + i * 40} fill={ACC} opacity={at(t, 0, [[checkT, 0.25, 1]])}>✓</text>
              <text className="b11-f" x="306" y={568 + i * 40} style={{ fill: at(t, INK, [[checkT, 0.25, ACC, E.p2o], [eraseT, 0.25, INK]]) }}>{p}</text>
            </g>
          ))}
          <text className="b11-m" x="221" y="664">DEL:</text>
          <text className="b11-f" x="305" y="664" fill={BAD} textDecoration="line-through" opacity={at(t, 0.45, [[eraseT, 0.25, 1, E.p2o]])}>{GO.del.join(", ")}</text>
          <text className="b11-m" x="221" y="706">ADD:</text>
          <text className="b11-f" x="305" y="706" fill={OK} opacity={at(t, 0.45, [[writeT, 0.25, 1, E.p2o]])} fontWeight="700">{GO.add.join(", ")}</text>
        </g>

        {/* B + C: the forward search tree; its n1 is the state the card just produced */}
        <g style={fx(t, [1, 0], [OUT(bwdT)])}>
          {TREE.map((n, i) => {
            if (n.parent < 0) return null;
            const [px, py] = pos[n.parent], [x, y] = pos[i], len = Math.hypot(x - px, y - 3 - py - NH);
            const plan = onPlan(i);
            return (
              <g key={i}>
                <line
                  x1={px} y1={py + NH} x2={x} y2={y - 3} strokeWidth={plan ? at(t, 3, [[goalT, 0.3, 4]]) : 3} markerEnd={head(edgeT(i))}
                  style={{ ...draw(len, edgeT(i)), stroke: plan ? at(t, STROKE, [[goalT, 0.3, OK, E.p2o]]) : STROKE }}
                />
                <text className="b11-act" x={x} y={y - 12} style={fx(t, [0, 6], [IN(edgeT(i) + 0.15, 0.4)])}>{n.act}</text>
              </g>
            );
          })}
          {TREE.map((n, i) => {
            const [x, y] = pos[i], goal = n.status === "goal", rep = n.status === "repeated";
            return (
              <g key={i} style={fx(t, [0, 6], [IN(appearT(i), i === n1 ? 0.4 : 0.5)])} opacity={rep ? 0.6 : 1}>
                <rect
                  x={x - NW / 2} y={y} width={NW} height={NH} rx="12" strokeWidth="2.5" strokeDasharray={rep ? "8 6" : undefined}
                  style={{ fill: goal ? at(t, PANEL, [[goalT, 0.3, OK_SOFT, E.p2o]]) : PANEL, stroke: nodeStroke(i) }}
                />
                <text className="b11-tag" x={x - NW / 2 + 16} y={y + 32} style={{ fill: goal ? at(t, MUTED, [[goalT, 0.3, OK, E.p2o]]) : MUTED }}>{tag(n, i)}</text>
                {i !== n1 && <Rooms x={x - MINI / 2} y={y + 46} w={MINI} robot={room(n.st, "ROBOT")} box={room(n.st, "BOX1")} labels={0} />}
              </g>
            );
          })}
          {/* "the planner can reason about them": a card it rejects by reading it (plan-rooms.ts frame 1) */}
          <g style={fx(t, [0, 6], [IN(plannerT)])}>
            <line x1={pos[0][0] + NW / 2} y1={pos[0][1] + 58} x2={pos[0][0] + NW / 2 + 150} y2={pos[0][1] + 58} stroke={BAD} strokeWidth="3" strokeDasharray="8 7" />
            <text className="b11-tag" x={pos[0][0] + NW / 2 + 170} y={pos[0][1] + 48} fill={INK}>{NO.name}</text>
            <text className="b11-tag" x={pos[0][0] + NW / 2 + 170} y={pos[0][1] + 84} fill={BAD}>✗ {NO_MISSING.join(", ")}</text>
          </g>
          <g style={fx(t, [0, 6], [IN(stateT)])}>
            <Rooms
              x={morph(192, pos[n1][0] - MINI / 2)} y={morph(215, pos[n1][1] + 46)} w={morph(693, MINI)}
              robot={at(t, 1, [[writeT, 0.5, 2, E.p2io]])} box={2} labels={at(t, 1, [[becauseT, 0.3, 0, E.p2o]])}
            />
          </g>
        </g>

        {/* D: backward from the goal: which card could have produced it? */}
        <g style={fx(t, [1, 0], [OUT(turnT)])}>
          {[G0, G1].map((g, gi) => {
            const lits = sorted(g), h = 70 + lits.length * 40, x = GX[gi];
            const arrive = gi ? prodT : g0T;
            return (
              <g key={gi} style={fx(t, [0, 6], [IN(arrive)])}>
                <rect
                  x={x} y={GTOP} width={GW} height={h} rx="14" fill={PANEL} strokeWidth="2.5"
                  style={{ stroke: at(t, ACC, gi ? [[turnT, 0.25, STROKE]] : [[prodT, 0.25, STROKE]]) }}
                />
                <text className="b11-tag" x={x + 24} y={GTOP + 38} fill={MUTED}>G{gi}</text>
                {lits.map((l, k) => {
                  const dropped = !gi && LAST.add.includes(l), added = gi > 0 && !G0.has(l);
                  return (
                    <g key={l}>
                      {dropped && <text className="b11-f" x={x + 28} y={GTOP + 82 + k * 40} fill={BAD} opacity={at(t, 0, [[whichT + 0.3, 0.25, 1]])}>−</text>}
                      {added && <text className="b11-f" x={x + 26} y={GTOP + 82 + k * 40} fill={OK}>+</text>}
                      <text
                        className="b11-f" x={x + 56} y={GTOP + 82 + k * 40}
                        style={{
                          fill: dropped ? at(t, INK, [[whichT + 0.3, 0.25, BAD, E.p2o]]) : added ? OK : isStatic(l) ? MUTED : INK,
                          textDecoration: dropped && t >= whichT + 0.3 ? "line-through" : "none",
                          fontWeight: added ? 700 : 500,
                        }}
                      >
                        {l}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          <line x1={GX[1] + GW} y1={GTOP + 75} x2={GX[0] - 6} y2={GTOP + 75} stroke={ACC} strokeWidth="3" markerEnd={head(whichT, 0.4)} style={draw(GX[0] - 6 - GX[1] - GW, whichT, 0.4)} />
          <text className="b11-act" x="960" y={GTOP + 58} style={fx(t, [0, 6], [IN(whichT + 0.1, 0.4)])}>{LAST.name}</text>
        </g>

        {/* E: SATPlan, one layer per time step; L grows until the SAT solver finds a model */}
        <g>
          {[0, 1].map((L) => (
            <text key={L} className="b11-L" x="192" y="236" style={fx(t, [0, 6], L ? [IN(handT, 0.4)] : [IN(planLT, 0.4), OUT(handT - 0.05)])}>L = {L}</text>
          ))}
          {[0, 1].map((k) => (
            <text key={k} className="b11-t" x={SX([75, 380][k])} y="236" style={fx(t, [0, 6], [IN(k ? handT : planLT, 0.4)])}>t = {k}</text>
          ))}
          {ACTS.map((a) => {
            const pre = [SX(75) + SW / 2, SYv(SY[a.pre]), SX(227) - SW / 2, SYv(SY[a.n])];
            const eff = [SX(227) + SW / 2, SYv(SY[a.n]), SX(380) - SW / 2 - 5, SYv(SY[a.add])];
            return (
              <g key={a.n}>
                <line x1={pre[0]} y1={pre[1]} x2={pre[2]} y2={pre[3]} stroke={STROKE} strokeWidth="2.5" strokeDasharray="8 7" opacity={at(t, 0, [[handT + 0.15, 0.3, 1, E.p2o]])} />
                <line x1={eff[0]} y1={eff[1]} x2={eff[2]} y2={eff[3]} stroke={STROKE} strokeWidth="2.5" markerEnd={head(handT + 0.25)} style={draw(Math.hypot(eff[2] - eff[0], eff[3] - eff[1]), handT + 0.25)} />
              </g>
            );
          })}
          {SNODES.map((s) => (
            <g key={s.k} style={fx(t, [0, 6], [IN(satIn(s), 0.4)])}>
              <rect x={s.x - SW / 2} y={s.y - SH / 2} width={SW} height={SH} rx="12" strokeWidth="2.5" style={{ fill: sColor(s.k, "fill"), stroke: sColor(s.k, "stroke") }} />
              <text className="b11-sat" x={s.x - 22} y={s.y + 10}>
                {s.name}
                <tspan dy="-12" fontSize="0.65em">{s.t}</tspan>
              </text>
              {(["?", "T", "F", "✗"] as Val[]).map((v) => (
                <text key={v} className="b11-v" x={s.x + SW / 2 - 30} y={s.y + 10} fill={v === "T" ? OK : v === "✗" ? BAD : MUTED} opacity={valAt(s.k, v)}>{v}</text>
              ))}
            </g>
          ))}
          <text className="b11-sat" x="960" y="742" style={fx(t, [0, 6], [IN(logicT, 0.4), OUT(handT - 0.05)])}>
            AtR1<tspan dy="-12" fontSize="0.65em">0</tspan>
            <tspan dy="12"> ∧ </tspan>
            <tspan style={{ fill: BAD }}>¬AtR2<tspan dy="-12" fontSize="0.65em">0</tspan><tspan dy="12"> ∧ AtR2</tspan><tspan dy="-12" fontSize="0.65em">0</tspan></tspan>
          </text>
          <text className="b11-m" x="960" y="742" textAnchor="middle" style={fx(t, [0, 6], [IN(handT + 0.3, 0.4)])}>
            dashed: precondition axiom · arrow: effect (fluent axiom)
          </text>
          <text className="b11-sat" x="960" y="800" style={{ ...fx(t, [0, 6], [IN(wEnd("sat solver"), 0.4)]), fill: OK }}>plan = {PLAN}</text>
        </g>
      </svg>
      <div id="b11-ex" style={out}>
        {DOMAINS.map((d, e) => (
          <div key={d} style={exFx(e)}>{d}</div>
        ))}
      </div>
      <div id="b11-steps" style={fx(t, [0, 6], [IN(stateT), OUT(dur - 0.25)])}>
        {STEPS.map((s, k) => (
          <span key={s} style={{ color: stepColor(k) }}>{s}</span>
        ))}
      </div>
    </>
  );
};
