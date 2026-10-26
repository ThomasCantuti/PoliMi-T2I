import { getLength, getPointAtLength } from "@remotion/paths";
import { ACC, at, Beat, E, Fx, fx, OK, PREV, Seg, useTime } from "../anim";

const BAD = "#f85149", WARN = "#e3b341";
const css = `
  #b06-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .b06-lb { font: 600 28px Inter, sans-serif; fill: #7d8a99; text-anchor: middle; }
  .b06-h { font: 700 96px Inter, sans-serif; fill: #e6edf3; letter-spacing: -0.02em; }
  .b06-t { font: 600 28px Inter, sans-serif; fill: #b4c0cc; }
  .b06-m { font: 600 28px Inter, sans-serif; fill: #7d8a99; }
`;

/* ---- 8-queens: the h = 17 state of Figure 4.3(b) and the first steepest-descent moves of the local-search
   visualizer (ties: first in column order, rows top to bottom): 17 → 12 → 7 → 3. Row 1 = top. */
const S0 = [5, 6, 7, 4, 5, 6, 7, 6];
const MOVES: [number, number][] = [[1, 1], [4, 2], [6, 8]]; // [column, new row]
const STATES = MOVES.reduce((ss, [c, r]) => [...ss, ss[ss.length - 1].map((x, k) => (k === c ? r : x))], [S0]);
const attacks = (s: number[], i: number, j: number) => s[i] === s[j] || Math.abs(s[i] - s[j]) === j - i;
const H = STATES.map((s) => s.reduce((n, _, i) => n + s.slice(i + 1).filter((__, k) => attacks(s, i, i + 1 + k)).length, 0));
const PAIRS = S0.flatMap((_, i) => S0.slice(i + 1).map((__, k): [number, number] => [i, i + 1 + k]))
  .filter(([i, j]) => STATES.some((s) => attacks(s, i, j)));
const CS = 76, BX = 452, BY = 200, SLIDE = 0.35;
const QUEEN = "M-13 9h26v4h-26zM-12 7l-3-14 7 7 8-12 8 12 7-7-3 14z";

/* ---- the state-space landscape: web/src/figs/local-landscape.ts (viewBox 780 x 300), scaled to the frame */
const CURVE = "M20,240 C60,235 90,175 120,170 L190,170 C225,170 250,40 300,40 C350,40 360,190 390,190 C420,190 440,110 470,110 " +
  "C500,110 515,180 540,180 C560,180 570,150 590,150 L660,150 C690,150 720,230 760,240";
const K = 1.95, OX = 195, OY = 200;
const X = (x: number) => OX + x * K, Y = (y: number) => OY + y * K;
const tf = (d: string) => d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, a, b) => `${X(+a).toFixed(1)},${Y(+b).toFixed(1)}`);
const C = tf(CURVE), LEN = getLength(C);
const pt = (l: number) => getPointAtLength(C, Math.max(0, Math.min(LEN, l))) as { x: number; y: number };
const SAMPLES = Array.from({ length: 801 }, (_, i) => ({ l: (LEN * i) / 800, ...pt((LEN * i) / 800) }));
/** arc length at the figure's x (the curve runs left to right) */
const L = (x: number) => SAMPLES.find((s) => s.x >= X(x) - 0.5)?.l ?? LEN;
// labels as in the figure; global maximum, local maximum and shoulder nudged up to clear the climbers
const LABELS: [number, number, string, string][] = [
  [300, 22, "global maximum", "summit"], [470, 94, "local maximum", "foothill"],
  [155, 150, "shoulder", "flat ledge"], [625, 138, "“flat” local maximum", "flat ledge"],
];
const FOG = 40; // half-width of what the climber sees, in figure units

/** A climber: arc length stepped hill-climbing style, [time, figure x] per step. */
const walk = (t: number, x0: number, steps: [number, number][]) =>
  pt(at(t, L(x0), steps.map(([t0, x]): Seg<number> => [t0, 0.22, L(x), E.p2o])));

export const Big = ({ dur, w }: Beat) => {
  const t = useTime();
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const arrive = (t1: number, d = 0.5): Fx => [t1, d, 1, 0, E.expo];

  // shot 1: the board
  const complete = w("complete state"), bad = w("bad one"), climb = w("hill climbing");
  const moveT = [w("repairs"), w("a little"), w("time")];
  const hT = [bad, ...moveT.map((m) => m + SLIDE)];
  const leave: Fx = [climb, 0.3, 0, 8, E.p2i];
  const row = (c: number) => at(t, S0[c], MOVES.flatMap(([mc, r], m): Seg<number>[] => (mc === c ? [[moveT[m], SLIDE, r, E.p2io]] : [])));
  const qx = (c: number) => BX + (c + 0.5) * CS, qy = (c: number) => BY + (row(c) - 0.5) * CS;
  // a pair's line fades out when a move starts if that move ends the attack, in when the move lands if it starts one
  const lineOp = (i: number, j: number) =>
    at(t, 0, STATES.flatMap((s, m): Seg<number>[] => {
      const was = m > 0 && attacks(STATES[m - 1], i, j), is = attacks(s, i, j);
      if (m === 0) return is ? [[bad + 0.02 * i, 0.3, 0.55, E.p2o]] : [];
      return was && !is ? [[moveT[m - 1], 0.15, 0, E.p2i]] : !was && is ? [[hT[m], 0.2, 0.55, E.p2o]] : [];
    }));

  // shot 2: the landscape, fog, climbers
  const fig = climb + 0.25, fog = w("thick fog"), up = w("step uphill"), down = w("goes down"), stop = w("stop");
  const clear = w("maybe on the summit"), restart = w("random restarts"), drop = w("restarts"), side = w("sideways");
  const c1 = walk(t, 430, [[up, 443], [up + 0.35, 456], [up + 0.7, 470]]);
  const c2 = walk(t, 240, [[drop + 0.45, 270], [drop + 0.75, 300]]);
  const c3 = walk(t, 130, [[side + 0.3, 160], [side + 0.6, 190], [side + 0.9, 225], [side + 1.2, 262], [side + 1.5, 300]]);
  // in the fog only the ground under the climber's feet is drawn
  const seen = at(t, 1, [[fog, 0.6, 0, E.p2o], [clear, 0.6, 1, E.p2o]]);
  const dot = (p: { x: number; y: number }, style: React.CSSProperties) => (
    <circle cx={p.x} cy={p.y} r={7 * K} stroke="#161b22" strokeWidth="5" style={style} />
  );

  return (
    <>
      <style>{css}</style>
      <svg id="b06-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        <defs>
          <path id="b06-q" d={QUEEN} transform={`scale(${CS / 46})`} />
          <mask id="b06-fog">
            <rect x="0" y="0" width="1920" height="1080" fill="#fff" opacity={seen} />
            <rect x={c1.x - FOG * K} y="0" width={2 * FOG * K} height="1080" fill="#fff" />
          </mask>
          <marker id="b06-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* 1 · a complete state, even a bad one, repaired one queen at a time */}
        <g style={fx(t, [0, 6], [arrive(w("local search")), leave])}>
          {S0.map((_, c) => (
            <g key={c}>
              <text className="b06-lb" x={BX + (c + 0.5) * CS} y={BY - 18}>{c + 1}</text>
              <text className="b06-lb" x={BX - 26} y={BY + (c + 0.5) * CS + 10}>{c + 1}</text>
              {S0.map((__, r) => (
                <rect key={r} x={BX + c * CS} y={BY + r * CS} width={CS} height={CS} fill={(r + c) % 2 ? "#232c38" : "#1c232d"} />
              ))}
            </g>
          ))}
          {PAIRS.map(([i, j]) => (
            <line key={`${i}-${j}`} x1={qx(i)} y1={qy(i)} x2={qx(j)} y2={qy(j)} stroke={BAD} strokeWidth="3" strokeLinecap="round" opacity={lineOp(i, j)} />
          ))}
          {S0.map((_, c) => (
            <g key={c} style={fx(t, [0, 6], [arrive(complete + 0.05 * c, 0.4)])} transform={`translate(${qx(c)} ${qy(c) + 2 + at(t, -16, [[complete + 0.05 * c, 0.4, 0, E.expo]])})`}>
              <use href="#b06-q" fill={ACC} />
            </g>
          ))}
          <g style={fx(t, [0, 6], [arrive(bad)])}>
            {H.map((h, m) => (
              <text
                key={m} className="b06-h" x="1180" y="470"
                style={fx(t, [m ? 0 : 1, 0], [
                  ...(m ? [[hT[m], 0.25, 1, 0, E.p2o, [0, 6]] as Fx] : []),
                  ...(m + 1 < hT.length ? [[hT[m + 1] - 0.1, 0.15, 0, 8, E.p2i] as Fx] : []),
                ])}
              >
                h = {h}
              </text>
            ))}
            <text className="b06-m" x="1184" y="526">attacking pairs</text>
          </g>
        </g>

        {/* 2 · the landscape (AIMA Figure 4.1): fog, a climb, a stop, the view, the ways out */}
        <g style={fx(t, [0, 6], [arrive(fig)])}>
          <path d={tf("M20,20 L20,262 L765,262")} fill="none" stroke="#3a4757" strokeWidth="3" />
          <text className="b06-m" x={X(28)} y={Y(30)}>objective function</text>
          <text className="b06-m" x={X(765)} y={Y(282)} textAnchor="end">state space →</text>
          <path d={`${C} L${X(760)},${Y(262)} L${X(20)},${Y(262)} Z`} fill="rgba(124,140,255,0.14)" opacity={seen} />
          <path d={C} fill="none" stroke={ACC} strokeWidth="6" mask="url(#b06-fog)" />
          {LABELS.map(([x, y, text, cue], k) => (
            <text key={text} className="b06-t" x={X(x)} y={Y(y)} textAnchor="middle" style={fx(t, [0, 6], [arrive(w(cue) + (k === 3 ? 0.15 : 0), 0.4)])}>
              {text}
            </text>
          ))}
          <g style={{ opacity: at(t, 1, [[up, 0.25, 0, E.p2o]]) }}>
            <line x1={X(430)} y1={Y(150)} x2={X(430)} y2={Y(262)} stroke="#7d8a99" strokeWidth="2.5" strokeDasharray="6 6" />
            <text className="b06-t" x={X(430)} y={Y(280)} textAnchor="middle">current state</text>
          </g>
          {/* every step from the top goes down */}
          <g style={{ opacity: at(t, 0, [[down, 0.25, 1, E.p2o], [clear, 0.25, 0, E.p2o]]) }}>
            {[[456, 102, 438, 124], [484, 102, 502, 124]].map(([x1, y1, x2, y2]) => (
              <line key={x1} x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} stroke={PREV} strokeWidth="4" markerEnd="url(#b06-ah)" />
            ))}
          </g>
          {/* a random restart: the climber is dropped somewhere else */}
          <line
            x1={X(240)} y1={Y(55)} x2={X(240)} y2={Y(262)} stroke={WARN} strokeWidth="2.5" strokeDasharray="6 6"
            opacity={at(t, 0, [[restart, 0.25, 0.8, E.p2o]])}
          />
          {dot(c1, { fill: at(t, WARN, [[stop, 0.25, BAD, E.p2o]]), opacity: at(t, 1, [[restart, 0.3, 0, E.p2i]]) })}
          {dot({ x: c2.x, y: c2.y + at(t, -60, [[drop, 0.4, 0, E.expo]]) }, {
            fill: at(t, WARN, [[drop + 1, 0.25, OK, E.p2o]]), opacity: at(t, 0, [[drop, 0.3, 1, E.p2o]]),
          })}
          {dot(c3, { fill: at(t, WARN, [[side + 1.75, 0.25, OK, E.p2o]]), opacity: at(t, 0, [[side, 0.3, 1, E.p2o]]) })}
        </g>
      </svg>
    </>
  );
};
