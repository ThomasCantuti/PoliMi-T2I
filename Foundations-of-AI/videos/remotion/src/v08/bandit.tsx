import { ACC, at, E, INK, MUTED, OK, Seg, SOFT } from "../anim";

// The k-armed bandit of web/src/viz/bandit.ts: Bernoulli arms whose n-th reward is fixed by the seed,
// Q ← Q + (R − Q) / N, UCB = Q + c·√(ln t / N) (∞ for an untried arm, ties → lowest arm). Same seeds, same numbers.
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type BStep = { t: number; arm: number; reward: number; Q: number[]; N: number[] };
export const ucb = (s: BStep, c: number) => s.Q.map((q, a) => (s.N[a] === 0 ? Infinity : q + c * Math.sqrt(Math.log(Math.max(1, s.t)) / s.N[a])));
export const argmax = (xs: number[]) => xs.reduce((b, x, i) => (x > xs[b] + 1e-12 ? i : b), 0);
export const f2 = (x: number) => (Number.isFinite(x) ? (Math.round(x * 100) / 100).toFixed(2) : "∞");

/** `picks` = number of UCB pulls, or the arms a person pulls (the "You pull" mode). */
export const runBandit = (mu: number[], seed: number, picks: number | number[], c = 1): BStep[] => {
  const streams = mu.map((_, a) => mulberry32(seed * 7919 + a * 104729 + 1));
  const drawn: number[][] = mu.map(() => []);
  const reward = (a: number, n: number) => {
    while (drawn[a].length <= n) drawn[a].push(streams[a]() < mu[a] ? 1 : 0);
    return drawn[a][n];
  };
  const steps: BStep[] = [{ t: 0, arm: -1, reward: 0, Q: mu.map(() => 0), N: mu.map(() => 0) }];
  const n = typeof picks === "number" ? picks : picks.length;
  for (let i = 0; i < n; i++) {
    const p = steps[steps.length - 1];
    const a = typeof picks === "number" ? argmax(ucb(p, c)) : picks[i];
    const N = p.N.slice(), Q = p.Q.slice();
    const r = reward(a, N[a]);
    N[a] += 1;
    Q[a] += (r - Q[a]) / N[a];
    steps.push({ t: p.t + 1, arm: a, reward: r, Q, N });
  }
  return steps;
};

type Rows = {
  t: number;
  steps: BStep[];
  /** when step k (k ≥ 1) is shown; before pulls[0] the bandit is in step 0 */
  pulls: number[];
  x: number; y: number; gap: number; trackX: number; trackW: number; numX: number; right: number;
  /** UCB policy: the dashed bonus box after the Q bar, and the scale 0–max bound (as the viz) */
  c?: number;
  ucbOn?: number;
  rowOpacity?: (a: number) => number;
  /** the last pull's highlight and reward badge clear here */
  clear?: number;
};

/** The arms as the viz draws them: name + reward badge, a track with the Q bar (and the UCB bonus), Q · N (· UCB). */
export const BanditRows = ({ t, steps, pulls, x, y, gap, trackX, trackW, numX, right, c, ucbOn = 0, rowOpacity, clear }: Rows) => {
  const k = pulls.filter((p) => p <= t).length;
  const s = steps[k];
  const scale = (st: BStep) => {
    const fin = ucb(st, c ?? 1).filter(Number.isFinite);
    return c === undefined ? 1 : Math.max(1, fin.length ? Math.min(3, Math.max(...fin)) : 1);
  };
  const px = (st: BStep, v: number) => Math.min(1, v / scale(st)) * trackW;
  const tween = (f: (st: BStep) => number): Seg<number>[] => pulls.map((p, j) => [p, 0.3, f(steps[j + 1]), E.p2o]);
  const lastSegs = (a: number): Seg<number>[] => [
    ...pulls.map((p, j): Seg<number> => [p, 0.15, steps[j + 1].arm === a ? 1 : 0, E.p2o]),
    ...(clear === undefined ? [] : [[clear, 0.25, 0, E.p2o] as Seg<number>]),
  ];
  const H = 40;
  return (
    <g>
      {s.Q.map((_, a) => {
        const cy = y + a * gap;
        const q0 = steps[0].Q[a];
        const qw = at(t, px(steps[0], q0), tween((st) => px(st, st.Q[a])));
        const bound = (st: BStep) => ucb(st, c ?? 1)[a];
        const bw = c === undefined ? 0 : at(t, trackW - px(steps[0], q0), tween((st) => (Number.isFinite(bound(st)) ? px(st, bound(st)) : trackW) - px(st, st.Q[a])));
        const last = at(t, 0, lastSegs(a));
        const prev = steps.slice(0, k + 1).filter((st) => st.arm === a);
        const r = prev.length ? prev[prev.length - 1].reward : 0;
        return (
          <g key={a} style={{ opacity: rowOpacity ? rowOpacity(a) : 1 }}>
            <rect x={x - 16} y={cy - gap / 2 + 6} width={right - x + 32} height={gap - 12} rx="10" fill={SOFT} opacity={last} />
            <text x={x} y={cy + 10} fontFamily="Inter" fontSize="30" fontWeight="600" fill={INK}>Arm {a + 1}</text>
            <g opacity={last}>
              <rect x={x + 122} y={cy - 18} width="56" height="36" rx="18" fill={r ? "rgba(63,185,80,0.14)" : "#232c38"} />
              <text x={x + 150} y={cy + 9} textAnchor="middle" fontFamily="Inter" fontSize="24" fontWeight="700" fill={r ? OK : MUTED}>{r ? "+1" : "0"}</text>
            </g>
            <rect x={trackX} y={cy - H / 2} width={trackW} height={H} rx="8" fill="#1c232d" />
            {c !== undefined && trackW / scale(s) < trackW && <line x1={trackX + trackW / scale(s)} x2={trackX + trackW / scale(s)} y1={cy - H / 2} y2={cy + H / 2} stroke="#3a4757" strokeWidth="2" />}
            <rect x={trackX} y={cy - H / 2} width={Math.max(0, qw)} height={H} rx="8" fill={ACC} />
            {c !== undefined && bw > 1 && (
              <rect x={trackX + qw} y={cy - H / 2 + 5} width={bw} height={H - 10} rx="6" fill={SOFT} stroke={ACC} strokeWidth="2" strokeDasharray="7 5" />
            )}
            <text x={numX} y={cy + 9} fontFamily="Inter" fontSize="26" fontWeight="500" fill="#b4c0cc" style={{ fontVariantNumeric: "tabular-nums" }}>
              Q <tspan fill={INK} fontWeight="600">{f2(s.Q[a])}</tspan>
              <tspan dx="22">N </tspan><tspan fill={INK} fontWeight="600">{s.N[a]}</tspan>
              {c !== undefined && <tspan dx="22" fill={ACC} fillOpacity={ucbOn}>UCB {f2(ucb(s, c)[a])}</tspan>}
            </text>
          </g>
        );
      })}
    </g>
  );
};
