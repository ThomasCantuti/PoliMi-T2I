import { ACC, at, Beat, E, FILL, Fx, fx, INK, MUTED, OK, PREV, Seg, STROKE, useTime } from "../anim";

const css = `
  #b09-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .b09-t { font-family: Inter, sans-serif; font-variant-numeric: tabular-nums; }
  .b09-head { position: absolute; left: 192px; top: 104px; font: 700 64px/1.1 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; white-space: nowrap; }
`;
const WARN = "#e3b341";

// ---- web/src/figs/rl-loop.ts (viewBox 600 × 240), scaled ×2.4 into the frame
const K = 2.4, LX = (x: number) => 240 + x * K, LY = (y: number) => 190 + y * K;
const scaled = (d: string) => d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, a, b) => `${LX(+a)},${LY(+b)}`);
const ARCS: [string, string, string][] = [
  ["M115,68 C115,8 485,8 485,64", "action a", "t"],
  ["M470,132 C470,188 130,188 130,138", "state s", "t+1"],
  ["M505,132 C505,222 95,222 95,138", "reward r", "t+1"],
];
const ARC_LABEL_Y = [52, 160, 224];

// ---- web/src/figs/rl-qlearning.ts: the 3×3 grid of exam 30 Aug 2022, every frame computed with the update rule
const GAMMA = 0.5, BETA = 0.25, EPISODES = 4;
const PATH: [number, number, "E" | "S"][] = [[1, 1, "E"], [1, 2, "E"], [1, 3, "S"], [2, 3, "S"]];
const GOAL: [number, number] = [3, 3];
const GLYPH = { E: "→", S: "↓" };
const num = (x: number, p = 6) => String(+x.toPrecision(p));
type F = { pos: [number, number]; Q: number[]; changed: number; ep: number; step: number; old: number; reward: number; future: number; goal: boolean };
const FRAMES: F[] = (() => {
  const Q = PATH.map(() => 0);
  const frames: F[] = [{ pos: [1, 1], Q: [...Q], changed: -1, ep: 0, step: 0, old: 0, reward: 0, future: 0, goal: false }];
  for (let ep = 1; ep <= EPISODES; ep++)
    PATH.forEach((_, i) => {
      const goal = i === PATH.length - 1, next: [number, number] = goal ? GOAL : [PATH[i + 1][0], PATH[i + 1][1]];
      const reward = goal ? 1 : 0, future = goal ? 0 : Q[i + 1], old = Q[i];
      Q[i] = old + BETA * (reward + GAMMA * future - old);
      frames.push({ pos: next, Q: [...Q], changed: Q[i] === old ? -1 : i, ep, step: i, old, reward, future, goal });
    });
  return frames;
})();
// the step the narration walks through: the first update that uses the value of the next state
const NUDGE = FRAMES.findIndex((f) => f.changed >= 0 && !f.goal);
const NF = FRAMES[NUDGE];
const QC = 170, GX = 192, GY = 240;
const qx = (k: number) => GX + (k - 0.5) * QC, qy = (r: number) => GY + (r - 0.5) * QC;
const PX = 820;

export const Big = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const exit: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];

  // 1 · the loop: each arrow arrives in the accent when the voice names it, the one before steps down
  const arcT = [w("acts"), w("new state"), w("a reward")];
  const loopOut: Fx = [w("one number") - 0.3, 0.2, 0, 8, E.p2i];
  const arcCol = (i: number) => at(t, ACC, arcT[i + 1] === undefined ? [] : [[arcT[i + 1], 0.25, STROKE, E.p2o]]);

  // 2 · Q-learning: episode 1 while the voice says what Q means, episode 2 up to the narrated update, then 3 and 4
  const gridIn = w("one number");
  const ep3 = w("episode after"), tbl = w("and the table");
  const d = (tbl - 0.15 - ep3) / 8;
  const T = FRAMES.map((_, j) =>
    j === 0 ? gridIn
      : j <= 4 ? w(["how much", "to expect", "doing this", "playing well"][j - 1])
      : j <= 8 ? [w("after each"), w("it nudges"), w("that number"), wEnd("landed") + 0.15][j - 5]
      : ep3 + (j - 9) * d,
  );
  const landed = wEnd("landed") - 0.25;
  const TV = T.map((x, j) => (j === NUDGE ? landed : x)); // the narrated update lands when its explanation ends
  const shown = TV.filter((x) => x <= t).length - 1;
  const F0 = FRAMES[Math.max(0, shown)];
  const theReward = w("the reward"), discounted = w("plus the discounted");
  const startOf = (j: number) => j > 4 && FRAMES[j].step === 0; // a new episode starts from S
  const S0: [number, number] = [qx(1), qy(1) - 46];
  const agent = (dim: 0 | 1) =>
    at(t, S0[dim], FRAMES.flatMap((f, j): Seg<number>[] => {
      if (j === 0) return [];
      const v = dim ? qy(f.pos[0]) - 46 : qx(f.pos[1]);
      return startOf(j) ? [[T[j] - 0.02, 0, S0[dim]], [T[j], 0.4, v, E.p2o]] : [[T[j], 0.4, v, E.p2o]];
    }));
  const agentOp = at(t, 0, [[gridIn + 0.2, 0.3, 1, E.p2o], ...FRAMES.flatMap((_, j): Seg<number>[] => (startOf(j) ? [[T[j] - 0.14, 0.12, 0], [T[j], 0.15, 1]] : [])), [tbl, 0.3, 0, E.p2o]]);
  const flash = (i: number) => at(t, 0, FRAMES.flatMap((f, j): Seg<number>[] => (f.changed === i ? [[TV[j], 0, 0.45], [TV[j] + 0.02, 1, 0, E.p2o]] : [])));
  const valCol = (i: number) => at(t, MUTED, FRAMES.flatMap((f, j): Seg<string>[] => (f.Q[i] !== FRAMES[Math.max(0, j - 1)].Q[i] || j === 0 ? [[TV[j], 0.25, f.Q[i] ? OK : MUTED, E.p2o]] : [])));
  const labelCol = at(t, MUTED, [[w("Q"), 0.25, ACC, E.p2o], [w("how much"), 0.25, MUTED, E.p2o]]);
  const nudged = NF.changed, landedIn = nudged + 1;
  const headStates = [0, ...Array.from({ length: EPISODES }, (_, e) => T[FRAMES.findIndex((f) => f.ep === e + 1)])];

  return (
    <>
      <style>{css}</style>
      <svg id="b09-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [exit])}>
        <defs>
          <marker id="b09-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* 1 · the reinforcement-learning loop */}
        <g style={fx(t, [1, 0], [loopOut])}>
          {[[40, "Agent"], [410, "Environment"]].map(([x, name], i) => (
            <g key={name} style={fx(t, [0, 6], [[0.1 + 0.1 * i, 0.45, 1, 0, E.expo]])}>
              <rect x={LX(+x)} y={LY(70)} width={150 * K} height={60 * K} rx="24" fill={FILL} stroke={STROKE} strokeWidth="3" />
              <text className="b09-t" x={LX(+x + 75)} y={LY(105)} textAnchor="middle" fontSize="38" fontWeight="600" fill={INK}>{name}</text>
            </g>
          ))}
          {ARCS.map(([dd, label, sub], i) => (
            <g key={label} style={fx(t, [0, 6], [[arcT[i], 0.4, 1, 0, E.p2o]])}>
              <path d={scaled(dd)} fill="none" strokeWidth={at(t, 5, arcT[i + 1] === undefined ? [] : [[arcT[i + 1], 0.25, 4, E.p2o]])} markerEnd="url(#b09-ah)" style={{ stroke: arcCol(i) }} />
              <text className="b09-t" x={LX(300)} y={LY(ARC_LABEL_Y[i])} textAnchor="middle" fontSize="32" fontWeight="500" fill={PREV}>
                {label}<tspan dy="9" fontSize="24">{sub}</tspan>
              </text>
            </g>
          ))}
          <text className="b09-t" x={LX(300)} y={LY(108)} textAnchor="middle" fontSize="28" fill={MUTED} style={fx(t, [0, 6], [[wEnd("a reward") + 0.15, 0.4, 1, 0, E.p2o]])}>
            then t ← t + 1
          </text>
        </g>

        {/* 2 · Q-learning on the 3×3 grid */}
        <g style={fx(t, [0, 6], [[gridIn, 0.5, 1, 0, E.expo]])}>
          {[1, 2, 3].flatMap((r) =>
            [1, 2, 3].map((k) => {
              const wall = r === 2 && k === 2, goal = r === GOAL[0] && k === GOAL[1];
              return (
                <rect key={`${r}${k}`} x={GX + (k - 1) * QC} y={GY + (r - 1) * QC} width={QC} height={QC}
                  fill={wall ? "#232c38" : goal ? "rgba(63,185,80,0.14)" : "#1c232d"} stroke={goal ? OK : "#2a3441"} strokeWidth="2.5" />
              );
            }),
          )}
          <text className="b09-t" x={GX + 14} y={GY + 34} fontSize="28" fontWeight="700" fill={MUTED}>S</text>
          <text className="b09-t" x={qx(3)} y={qy(3) + 12} textAnchor="middle" fontSize="36" fontWeight="700" fill={OK}>G  +1</text>
          <path d={`M${qx(1) + 37},${qy(1) - 17} L${qx(3) + 61},${qy(1) - 17} L${qx(3) + 61},${qy(3) - 37}`} fill="none" stroke="#3a4757" strokeWidth="3" strokeDasharray="9 9" markerEnd="url(#b09-ah)" />
          {PATH.map(([r, k, a], i) => (
            <g key={i}>
              <rect x={GX + (k - 1) * QC + 4} y={GY + (r - 1) * QC + 4} width={QC - 8} height={QC - 8} rx="10" fill={WARN} opacity={flash(i)} />
              {i === nudged && (
                <rect x={GX + (k - 1) * QC + 4} y={GY + (r - 1) * QC + 4} width={QC - 8} height={QC - 8} rx="10" fill="none" stroke={ACC} strokeWidth="4"
                  opacity={at(t, 0, [[T[NUDGE], 0.25, 1, E.p2o], [theReward, 0.25, 0, E.p2o]])} />
              )}
              <text className="b09-t" x={qx(k)} y={qy(r) + 32} textAnchor="middle" fontSize="32" fontWeight="700"
                style={{ fill: i === landedIn ? at(t, valCol(i), [[discounted, 0.25, ACC, E.p2o], [landed, 0.25, valCol(i), E.p2o]]) : valCol(i) }}>
                {num(F0.Q[i], 3)}
              </text>
              <text className="b09-t" x={qx(k)} y={qy(r) + 68} textAnchor="middle" fontSize="24" style={{ fill: labelCol }}>Q(({r},{k}), {GLYPH[a]})</text>
              <text className="b09-t" x={qx(k)} y={qy(r) - 16} textAnchor="middle" fontSize="80" fontWeight="700" fill={ACC}
                style={fx(t, [0, 6], [[w("a map") + 0.12 * (PATH.length - 1 - i), 0.35, FRAMES[FRAMES.length - 1].Q[i] > 0 ? 1 : 0, 0, E.p2o]])}>
                {GLYPH[a]}
              </text>
            </g>
          ))}
          <circle cx={agent(0)} cy={agent(1)} r="19" fill={ACC} stroke="#161b22" strokeWidth="5" opacity={agentOp} />

          <text className="b09-t" x={PX} y="290" fontSize="30" fill={MUTED}>γ = {GAMMA}, β = {BETA}, Q starts at 0</text>
          <text className="b09-t" x={PX} y="380" fontSize="30" fill={MUTED} style={fx(t, [0, 6], [[w("every state"), 0.4, 1, 0, E.p2o]])}>Q-table (entries on the path)</text>
          {PATH.map(([r, k, a], i) => (
            <text key={i} className="b09-t" y={440 + i * 56} fontSize="32" style={fx(t, [0, 6], [[w("every state") + 0.1 + 0.08 * i, 0.4, 1, 0, E.p2o]])}>
              <tspan x={PX} fill={PREV} fontWeight="500">({r},{k}) {GLYPH[a]}</tspan>
              <tspan x={PX + 360} textAnchor="end" fontWeight="700" style={{ fill: valCol(i) }}>{num(F0.Q[i], 3)}</tspan>
            </text>
          ))}
          {/* the narrated update, built as the voice names its parts */}
          <g style={fx(t, [1, 0], [[ep3, 0.3, 0, 8, E.p2i]])}>
            <text className="b09-t" x={PX} y="728" fontSize="36" fontWeight="600" fill={INK}>
              <tspan fillOpacity={at(t, 0, [[T[NUDGE], 0.3, 1, E.p2o]])}>
                Q(({PATH[NF.step][0]},{PATH[NF.step][1]}), {GLYPH[PATH[NF.step][2]]}) ← {num(NF.old)} + {BETA} · (
              </tspan>
              <tspan fillOpacity={at(t, 0, [[theReward, 0.3, 1, E.p2o]])} style={{ fill: at(t, ACC, [[discounted, 0.25, INK, E.p2o]]) }}>{NF.reward}</tspan>
              <tspan fillOpacity={at(t, 0, [[discounted, 0.3, 1, E.p2o]])}> + </tspan>
              <tspan fillOpacity={at(t, 0, [[discounted, 0.3, 1, E.p2o]])} style={{ fill: at(t, ACC, [[landed, 0.25, INK, E.p2o]]) }}>
                {GAMMA} · {num(NF.future)}
              </tspan>
              <tspan fillOpacity={at(t, 0, [[discounted, 0.3, 1, E.p2o]])}> − {num(NF.old)})</tspan>
            </text>
            <text className="b09-t" x={PX} y="790" fontSize="36" fontWeight="700" fill={OK} style={fx(t, [0, 6], [[landed, 0.35, 1, 0, E.p2o]])}>
              = {num(FRAMES[NUDGE].Q[NF.step])}
            </text>
          </g>
        </g>
      </svg>
      {["Before episode 1", ...Array.from({ length: EPISODES }, (_, e) => `Episode ${e + 1} of ${EPISODES}`)].map((h, s) => (
        <div key={h} className="b09-head" style={fx(t, [0, 6], [
          [s ? headStates[s] + 0.1 : gridIn, 0.25, 1, 0, E.p2o, [0, 6]],
          ...(s < EPISODES ? [[headStates[s + 1], 0.15, 0, 8, E.p2i] as Fx] : []),
          exit,
        ])}>
          {h}
        </div>
      ))}
    </>
  );
};
