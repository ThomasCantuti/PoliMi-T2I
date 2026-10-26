import { ACC, at, Beat, E, FILL, Fx, fx, INK, MUTED, OK, PREV, Seg, SOFT, useTime } from "../anim";
import { argmax, BanditRows, mulberry32, runBandit } from "./bandit";

const css = `
  #b08-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .b08-t { font-family: Inter, sans-serif; font-variant-numeric: tabular-nums; }
`;
const V_MAX = "#7c8cff", V_MIN = "#f778ba", BAD = "#f85149", WARN = "#e3b341", PANEL = "#161b22";
const sp = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// ---- 1. Evaluation by rollouts (mcts.md): random playouts after X takes the center, seeded as the viz's tic-tac-toe
const TTT = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const winner = (b: string[]) => TTT.map(([a, c, d]) => (b[a] !== "." && b[a] === b[c] && b[a] === b[d] ? b[a] : "")).find((x) => x) ?? null;
const PLAYOUTS = 10000;
const RESULTS = (() => {
  const rng = mulberry32(1), out: number[] = [];
  for (let i = 0; i < PLAYOUTS; i++) {
    const b = "....X....".split("");
    let p = "O", u: number | null = null;
    while (u === null) {
      const win = winner(b), empty = b.map((c, k) => (c === "." ? k : -1)).filter((k) => k >= 0);
      if (win) u = win === "X" ? 1 : -1;
      else if (!empty.length) u = 0;
      else {
        b[empty[Math.floor(rng() * empty.length)]] = p;
        p = p === "X" ? "O" : "X";
      }
    }
    out.push(u);
  }
  return out;
})();
const WINS = [0]; // WINS[n] = X wins in the first n playouts
RESULTS.forEach((r) => WINS.push(WINS[WINS.length - 1] + (r > 0 ? 1 : 0)));
const rate = (n: number) => WINS[n] / n;
const SHOWN = 10; // playouts drawn one by one
const BX = 192, BY = 300, BC = 90, PX0 = BX + 3 * BC + 30, PX1 = 790;
const pyOf = (i: number) => BY + 1.5 * BC + (i - (SHOWN - 1) / 2) * 46;
const squiggle = (i: number) => {
  const y0 = BY + 1.5 * BC, y1 = pyOf(i), pts: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const s = k / 40, x = PX0 + (PX1 - PX0) * s, y = y0 + (y1 - y0) * s + Math.sin(s * 14 + i) * 7 * Math.sin(Math.PI * s);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return "M" + pts.join(" L");
};
const CX0 = 1040, CX1 = 1728, CY0 = 720, CY1 = 440;
const cX = (n: number) => CX0 + (Math.log10(n) / 4) * (CX1 - CX0), cY = (r: number) => CY0 + (CY1 - CY0) * r;
const SAMPLES: number[] = [];
for (let n = 1; n <= PLAYOUTS; n = n < 100 ? n + 1 : Math.min(PLAYOUTS, Math.max(n + 1, Math.round(n * 1.02)))) {
  SAMPLES.push(n);
  if (n === PLAYOUTS) break;
}

// ---- 2. UCB on the bandit viz's preset "UCB vs ε-greedy – 5 arms, close means" (seed 7, c = 1)
const MU = [0.3, 0.5, 0.6, 0.45, 0.65], FIRST = 14;
const BANDIT = runBandit(MU, 7, FIRST + 2, 1);
const AT = BANDIT[FIRST];
const EXPLOIT = argmax(AT.Q), EXPLORE = argmax(AT.N.map((n) => Math.sqrt(Math.log(AT.t) / n)));

// ---- 3. MCTS, the viz's preset "Step-by-step example – slides p. 417-452" (C = 1, two moves per node) run for its
// first five playouts +1, −1, −1, +1, −1 (the Playground's Iterations field = 5): the tree is then most lopsided.
// W = MAX's wins, U = N − W at MIN nodes; ties → leftmost; one child per expansion
type MNode = { parent: number | null; depth: number; label: string; kids: number[]; untried: string[] };
type MStep = { kind: "select" | "expand" | "simulate" | "backprop" | "final"; it: number; count: number; W: number[]; N: number[]; path: number[]; focus: number; ucb?: [number, number][]; result?: number };
const C = 1;
const runMcts = (rollouts: number[]) => {
  const nodes: MNode[] = [], W: number[] = [], N: number[] = [], steps: MStep[] = [];
  const add = (parent: number | null, label: string) => {
    nodes.push({ parent, depth: parent === null ? 0 : nodes[parent].depth + 1, label, kids: [], untried: ["a1", "a2"] });
    W.push(0);
    N.push(0);
    if (parent !== null) nodes[parent].kids.push(nodes.length - 1);
    return nodes.length - 1;
  };
  const snap = (s: Omit<MStep, "count" | "W" | "N">) => steps.push({ ...s, count: nodes.length, W: W.slice(), N: N.slice() });
  add(null, "root");
  rollouts.forEach((result, k) => {
    const it = k + 1, path = [0];
    let cur = 0;
    while (!nodes[cur].untried.length && nodes[cur].kids.length) {
      const p = cur, min = nodes[p].depth % 2 === 1;
      const rows = nodes[p].kids.map((c): [number, number] => [c, ((min ? N[c] - W[c] : W[c]) / N[c]) + C * Math.sqrt(Math.log(N[p]) / N[c])]);
      cur = rows.reduce((b, r) => (r[1] > b[1] + 1e-12 ? r : b))[0];
      path.push(cur);
      snap({ kind: "select", it, path: path.slice(), focus: cur, ucb: rows });
    }
    const leaf = add(cur, nodes[cur].untried.shift()!);
    path.push(leaf);
    snap({ kind: "expand", it, path: path.slice(), focus: leaf });
    snap({ kind: "simulate", it, path: path.slice(), focus: leaf, result });
    for (const id of path) {
      W[id] += result > 0 ? 1 : 0;
      N[id] += 1;
    }
    snap({ kind: "backprop", it, path: path.slice(), focus: leaf, result });
  });
  const best = nodes[0].kids.reduce((b, c) => (N[c] > N[b] ? c : b));
  snap({ kind: "final", it: rollouts.length, path: [0, best], focus: best });
  return { nodes, steps };
};
const MCTS = runMcts([1, -1, -1, 1, -1]);
const START = MCTS.steps.findIndex((s) => s.kind === "backprop" && s.it === 2); // the tree after the slides' step 2
const SHOWN_STEPS = MCTS.steps.slice(START);
const PHASE = { select: 0, expand: 1, simulate: 2, backprop: 3, final: -1 };
const PHASES = ["Selection", "Expansion", "Simulation", "Backpropagation"];
const GAP = 300, TOP = 330, LEVEL = 130, NH = 54;
const layout = (s: MStep) => {
  const ux: number[] = [];
  let k = 0;
  const walk = (id: number) => {
    const kids = MCTS.nodes[id].kids.filter((c) => c < s.count);
    if (!kids.length) ux[id] = k++;
    else {
      kids.forEach(walk);
      ux[id] = (ux[kids[0]] + ux[kids[kids.length - 1]]) / 2;
    }
  };
  walk(0);
  const x0 = 960 - ((k - 1) * GAP) / 2;
  return MCTS.nodes.map((n, i) => [x0 + (ux[i] ?? 0) * GAP, TOP + n.depth * LEVEL]);
};
const wn = (w: number, n: number) => `${Math.round(w * 10) / 10}/${n}`;
const f3 = (x: number) => (Math.round(x * 1000) / 1000).toFixed(3);

export const Big = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const exit: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const arrive = (t0: number): Fx => [t0, 0.5, 1, 0, E.expo];

  // 1 · rollouts
  const play = w("play them"), count = w("count the wins"), g0 = wEnd("count the wins") + 0.15, g1 = w("converge") + 0.2, conv = wEnd("converge");
  const aOut: Fx = [w("then spend") - 0.1, 0.2, 0, 8, E.p2i];
  const lineT = (i: number) => play + 0.12 * i;
  const grow = Math.min(1, Math.max(0, (t - g0) / (g1 - g0)));
  const nNow = t < count ? 0 : Math.round(Math.pow(10, 1 + 3 * E.p1io(grow)));
  const done = at(t, 0, [[conv, 0.3, 1, E.p2o]]);
  const finalRate = rate(PLAYOUTS);

  // 2 · bandit: the first 14 UCB pulls spend the simulations, then exploit vs explore, then UCB1 pulls
  const bIn = w("then spend") + 0.15, paid = w("paid best"), unless = w("unless another"), ucbT = w("UCB1");
  const pulls = [...Array.from({ length: FIRST }, (_, i) => w("the next simulation") + 0.3 * i), w("balances"), w("the two")];
  const bOut: Fx = [wEnd("the two") + 0.05, 0.2, 0, 8, E.p2i];
  const spot = (a: number) => at(t, 1, [[paid, 0.3, a === EXPLOIT ? 1 : 0.3, E.p2o], [unless, 0.3, a === EXPLORE ? 1 : 0.3, E.p2o], [ucbT, 0.3, 1, E.p2o]]);

  // 3 · MCTS: the narrated iteration on its four words, then the next two iterations in the time left, then the move
  const dIn = wEnd("the two") + 0.2;
  const rep0 = w("and repeat") + 0.05, rep1 = w("good moves") - 0.3, nRep = SHOWN_STEPS.length - 6;
  const T = SHOWN_STEPS.map((s, j) =>
    j === 0 ? dIn : j <= 4 ? w(["select", "expand", "simulate", "backpropagate"][j - 1]) : s.kind === "final" ? w("good moves") : rep0 + ((rep1 - rep0) * (j - 5)) / Math.max(1, nRep - 1),
  );
  const cur = Math.max(0, T.filter((x) => x <= t).length - 1);
  const S = SHOWN_STEPS[cur];
  const P = SHOWN_STEPS.map(layout);
  const born = (i: number) => SHOWN_STEPS.findIndex((s) => i < s.count);
  const pos = (i: number) => {
    const b = Math.max(0, born(i)); // a node is laid out where it is born, then follows the layout of each step
    const seg = (d: number) => SHOWN_STEPS.flatMap((_, j): Seg<number>[] => (j >= b ? [[T[j], 0.45, P[j][i][d], E.p2o]] : []));
    return [at(t, P[b][i][0], seg(0)), at(t, P[b][i][1], seg(1))];
  };
  const phaseCol = (k: number, on: string, off: string) => at(t, off, SHOWN_STEPS.map((s, j): Seg<string> => [T[j], 0.2, j > 0 && PHASE[s.kind] === k ? on : off, E.p2o]));
  const simT = T[SHOWN_STEPS.findIndex((s) => s.kind === "simulate" && s.it === S.it)];
  const role = (s: MStep, i: number) => {
    if (s === SHOWN_STEPS[0] || i >= s.count) return "";
    if (s.kind === "final") return i === s.focus ? "best" : "";
    if (!s.path.includes(i)) return "";
    return s.kind === "backprop" ? "upd" : "path";
  };
  const style = (i: number, k: "fill" | "stroke") => {
    const base = k === "fill" ? FILL : MCTS.nodes[i].depth % 2 ? V_MIN : V_MAX;
    const c = (r: string) => (r === "path" ? (k === "fill" ? SOFT : ACC) : r === "upd" || r === "best" ? (k === "fill" ? "rgba(63,185,80,0.14)" : OK) : base);
    return at(t, base, SHOWN_STEPS.map((s, j): Seg<string> => [T[j], 0.25, c(role(s, i)), E.p2o]));
  };
  const XY = MCTS.nodes.map((_, i) => pos(i));

  return (
    <>
      <style>{css}</style>
      <svg id="b08-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [exit])}>
        <defs>
          {Array.from({ length: SHOWN }, (_, i) => (
            <clipPath key={i} id={`b08-cl${i}`}>
              <rect x={PX0 - 10} y="0" height="1080" width={at(t, 0, [[lineT(i), 0.4, PX1 - PX0 + 20, E.p2o]])} />
            </clipPath>
          ))}
        </defs>

        {/* 1 · one position, many random playouts, a win counter */}
        <g style={fx(t, [0, 6], [arrive(0.1), aOut])}>
          {[1, 2].map((k) => (
            <g key={k} stroke="#3a4757" strokeWidth="4" strokeLinecap="round">
              <line x1={BX + k * BC} x2={BX + k * BC} y1={BY + 8} y2={BY + 3 * BC - 8} />
              <line y1={BY + k * BC} y2={BY + k * BC} x1={BX + 8} x2={BX + 3 * BC - 8} />
            </g>
          ))}
          <text x={BX + 1.5 * BC} y={BY + 1.5 * BC + 28} textAnchor="middle" fontFamily="Inter" fontSize="80" fontWeight="700" fill={V_MAX}>X</text>
          {RESULTS.slice(0, SHOWN).map((r, i) => (
            <g key={i}>
              <path d={squiggle(i)} fill="none" stroke={WARN} strokeWidth="3" strokeDasharray="8 6" clipPath={`url(#b08-cl${i})`} />
              <g style={fx(t, [0, 4], [[lineT(i) + 0.35, 0.2, 1, 0, E.p2o]])}>
                <circle cx={PX1 + 34} cy={pyOf(i)} r="21" fill={r > 0 ? OK : r < 0 ? BAD : MUTED} />
                <text className="b08-t" x={PX1 + 34} y={pyOf(i) + 8} textAnchor="middle" fontSize="24" fontWeight="700" fill="#0e1116">{r > 0 ? "+1" : r < 0 ? "−1" : "0"}</text>
              </g>
            </g>
          ))}
          <g style={fx(t, [0, 6], [[count, 0.4, 1, 0, E.p2o]])}>
            <text className="b08-t" x={CX0} y="290" fontSize="30" fontWeight="600" fill={PREV}>X wins</text>
            <text className="b08-t" x={CX0} y="372">
              <tspan fontSize="72" fontWeight="700" style={{ fill: at(t, INK, [[conv, 0.3, OK, E.p2o]]) }}>{nNow ? `${(100 * rate(nNow)).toFixed(1)}%` : ""}</tspan>
              <tspan dx="22" fontSize="30" fontWeight="500" fill={MUTED}>of {sp(nNow)} playouts</tspan>
            </text>
            {[0, 0.5, 1].map((r) => (
              <g key={r}>
                <line x1={CX0} x2={CX1} y1={cY(r)} y2={cY(r)} stroke="#2a3441" strokeWidth="2" />
                <text className="b08-t" x={CX0 - 14} y={cY(r) + 8} textAnchor="end" fontSize="24" fill={MUTED}>{100 * r}%</text>
              </g>
            ))}
            {[1, 10, 100, 1000, 10000].map((n) => (
              <text key={n} className="b08-t" x={cX(n)} y={CY0 + 40} textAnchor={n === PLAYOUTS ? "end" : "middle"} fontSize="24" fill={MUTED}>{sp(n)}</text>
            ))}
            <line x1={CX0} x2={CX1} y1={cY(finalRate)} y2={cY(finalRate)} stroke={OK} strokeWidth="3" strokeDasharray="10 8" opacity={done} />
            {nNow > 1 && (
              <path d={"M" + SAMPLES.filter((n) => n <= nNow).map((n) => `${cX(n).toFixed(1)},${cY(rate(n)).toFixed(1)}`).join(" L")} fill="none" stroke={ACC} strokeWidth="4" strokeLinejoin="round" />
            )}
          </g>
        </g>

        {/* 2 · each move a slot machine: the bandit viz's arms */}
        <g style={fx(t, [0, 6], [arrive(bIn), bOut])}>
          <text className="b08-t" y="262" fontSize="24" fill={MUTED}>
            <tspan x="208">arm</tspan>
            <tspan x="450">bar: Q · dashed: + c·√(ln t / N)</tspan>
            <tspan x="1370">estimate · pulls</tspan>
          </text>
          <BanditRows t={t} steps={BANDIT} pulls={pulls} x={208} y={340} gap={92} trackX={450} trackW={870} numX={1370} right={1712} c={1} ucbOn={at(t, 0, [[ucbT, 0.3, 1, E.p2o]])} rowOpacity={spot} clear={paid} />
          <text className="b08-t" x="208" y="808" fontSize="34" fontWeight="600" fill={INK} style={fx(t, [0, 6], [[ucbT, 0.4, 1, 0, E.p2o]])}>
            UCB(a) = Q(a) + c·√(ln t / N(a)), <tspan fill={MUTED}>c = 1</tspan>
          </text>
        </g>

        {/* 3 · select, expand, simulate, backpropagate: the MCTS viz's tree */}
        <g style={fx(t, [0, 6], [arrive(dIn)])}>
          {PHASES.map((ph, k) => {
            const x = 192 + k * (366 + 24);
            return (
              <g key={ph}>
                <rect x={x} y="150" width="366" height="64" rx="10" strokeWidth="2.5" style={{ fill: phaseCol(k, "#1f2540", PANEL), stroke: phaseCol(k, ACC, "#2a3441") }} />
                <circle cx={x + 38} cy="182" r="19" style={{ fill: phaseCol(k, ACC, "#232c38") }} />
                <text className="b08-t" x={x + 38} y="191" textAnchor="middle" fontSize="24" fontWeight="700" style={{ fill: phaseCol(k, "#ffffff", MUTED) }}>{k + 1}</text>
                <text className="b08-t" x={x + 70} y="192" fontSize="28" fontWeight="600" style={{ fill: phaseCol(k, INK, MUTED) }}>{ph}</text>
              </g>
            );
          })}
          {MCTS.nodes.map((n, i) => {
            if (n.parent === null) return null;
            const [x, y] = XY[i], [px, py] = XY[n.parent];
            const r = (s: MStep) => (s.kind === "final" ? (i === s.focus ? "best" : "") : role(s, i) && s.path.includes(n.parent!) ? "path" : "");
            const segs = SHOWN_STEPS.map((s, j): Seg<string> => [T[j], 0.25, r(s) === "best" ? OK : r(s) === "path" ? ACC : "#3a4757", E.p2o]);
            const wd = SHOWN_STEPS.map((s, j): Seg<number> => [T[j], 0.25, r(s) === "best" ? 6 : r(s) === "path" ? 5 : 3, E.p2o]);
            const vis = at(t, 0, [[T[Math.max(0, born(i))], 0.3, 1, E.p2o]]);
            return (
              <g key={i} opacity={vis}>
                <line x1={px} y1={py + NH / 2} x2={x} y2={y - NH / 2} strokeWidth={at(t, 3, wd)} style={{ stroke: at(t, "#3a4757", segs) }} />
                <text className="b08-t" x={(px + x) / 2 + (x < px ? -14 : x > px ? 14 : 12)} y={(py + y) / 2 + 8} textAnchor={x < px ? "end" : "start"} fontSize="24" fontWeight="600" fill={MCTS.nodes[n.parent].depth % 2 ? V_MIN : V_MAX}>
                  {n.label}
                </text>
              </g>
            );
          })}
          {cur > 0 && S.result !== undefined && (S.kind === "simulate" || S.kind === "backprop") && (() => {
            const [x, y] = XY[S.focus], y0 = y + NH / 2, end = y0 + 96;
            return (
              <g style={fx(t, [0, 4], [[simT, 0.25, 1, 0, E.p2o]])}>
                <line x1={x} y1={y0} x2={x} y2={end - 20} stroke={MUTED} strokeWidth="2.5" strokeDasharray="6 6" />
                {[30, 60].map((d) => <circle key={d} cx={x} cy={y0 + d} r="8" fill={PANEL} stroke={MUTED} strokeWidth="2.5" />)}
                <circle cx={x} cy={end} r="21" fill={INK} />
                <text className="b08-t" x={x} y={end + 8} textAnchor="middle" fontSize="24" fontWeight="700" fill={PANEL}>{S.result > 0 ? "+1" : "−1"}</text>
                <text className="b08-t" x={x + 36} y={y0 + 54} fontSize="24" fill={MUTED}>playout</text>
              </g>
            );
          })()}
          {MCTS.nodes.map((n, i) => {
            const [x, y] = XY[i], label = wn(S.W[i] ?? 0, S.N[i] ?? 0), wd = Math.max(108, label.length * 17 + 40);
            const b = born(i);
            const isNew = S.kind === "expand" && S.focus === i;
            return (
              <g key={i} opacity={b < 0 ? 0 : at(t, 0, [[T[b], 0.3, 1, E.p2o]])}>
                <rect x={x - wd / 2} y={y - NH / 2} width={wd} height={NH} rx="12" strokeWidth="3.5" strokeDasharray={isNew ? "9 7" : undefined} style={{ fill: style(i, "fill"), stroke: style(i, "stroke") }} />
                <text className="b08-t" x={x} y={y + 10} textAnchor="middle" fontSize="28" fontWeight="600" fill={INK}>{label}</text>
              </g>
            );
          })}
          {cur === 1 && S.ucb && S.ucb.map(([id, u]) => {
            const [x, y] = XY[id], label = wn(S.W[id], S.N[id]), wd = Math.max(108, label.length * 17 + 40);
            return (
              <text key={id} className="b08-t" x={x + wd / 2 + 16} y={y + 10} fontSize="28" fontWeight="700" fill={id === S.focus ? ACC : MUTED} style={fx(t, [0, 4], [[T[1], 0.25, 1, 0, E.p2o]])}>
                {f3(u)}
              </text>
            );
          })}
        </g>
      </svg>
    </>
  );
};
