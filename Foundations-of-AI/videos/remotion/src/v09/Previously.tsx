import { ACC, at, Beat, E, Fx, fx, INK, MUTED, OK, PREV, Seg, SOFT, useTime } from "../anim";
import { MapIntro } from "../shared/map";
import { BanditRows, runBandit } from "../v08/bandit";

const css = `
  #p09-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .p09-head { position: absolute; top: 104px; font: 700 68px/1.1 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
`;

// web/src/figs/search-grid.ts (chapter 4): 4-connected, unit costs, h = Manhattan distance to G
const GRID = ["...........", ".#...#####.", ".##...G..#.", "S.########.", "..........."];
const CELL = 80, X0 = 192, Y0 = 290;
const cells: [number, number][] = [];
GRID.forEach((row, r) => [...row].forEach((ch, c) => ch !== "#" && cells.push([r, c])));
const find = (ch: string) => cells.find(([r, c]) => GRID[r][c] === ch)!;
const [SR, SC] = find("S"), [GR, GC] = find("G");
const free = (r: number, c: number) => GRID[r]?.[c] !== undefined && GRID[r][c] !== "#";
const h = (r: number, c: number) => Math.abs(r - GR) + Math.abs(c - GC);
const id = (r: number, c: number) => `${r},${c}`;

// A* as viz/search.ts traces it: graph search, children in alphabetical order of the state id, ties first in first out
const astar = () => {
  type Nd = { r: number; c: number; g: number; f: number; seq: number; parent: Nd | null };
  const kids = (r: number, c: number) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => free(a, b)).sort((p, q) => (id(p[0], p[1]) < id(q[0], q[1]) ? -1 : 1));
  let seq = 0;
  const root: Nd = { r: SR, c: SC, g: 0, f: h(SR, SC), seq: seq++, parent: null };
  const frontier = [root], reached = new Map([[id(SR, SC), root]]);
  while (frontier.length) {
    frontier.sort((a, b) => a.f - b.f || a.seq - b.seq);
    const n = frontier.shift()!;
    if (n.r === GR && n.c === GC) {
      const path: Nd[] = [];
      for (let m: Nd | null = n; m; m = m.parent) path.unshift(m);
      return { cost: n.g, path: path.map((m) => [m.r, m.c]) };
    }
    for (const [r, c] of kids(n.r, n.c)) {
      const g = n.g + 1, old = reached.get(id(r, c));
      if (old && g >= old.g) continue;
      const ch: Nd = { r, c, g, f: g + h(r, c), seq: seq++, parent: n };
      reached.set(id(r, c), ch);
      frontier.push(ch);
    }
  }
  throw new Error("no path");
};
const A = astar();
const cx = (c: number) => (c + 0.5) * CELL, cy = (r: number) => (r + 0.5) * CELL;
const PATH_D = "M" + A.path.map(([r, c]) => `${cx(c)},${cy(r)}`).join(" L");
const PATH_LEN = (A.path.length - 1) * CELL;
// the model at S: its actions, where they lead, what they cost
const MOVES = [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dr, dc]) => free(SR + dr, SC + dc));
// no model: the agent's first steps, along the way out of the corner
const WALK = A.path.slice(1, 3);

// the bandit viz's preset "Pull the arms yourself – 4 arms": a person pulls each arm once
const MU = [0.25, 0.55, 0.45, 0.7];
const BANDIT = runBandit(MU, 3, [0, 1, 2, 3]);

export const Previously = ({ dur, w }: Beat) => {
  const t = useTime();
  const out = w("A* plans");
  const gridIn = Math.max(out, 2.4) + 0.45; // after the map has zoomed away
  const draw = Math.max(w("a path") + 0.1, gridIn + 0.35);
  const actions = w("the actions"), lead = w("where they lead"), cost = w("what they cost");
  const bandits = w("bandits"), alone = w("stands alone");
  const whatIf = w("what if"), noModel = w("no model"), steps = [w("changes"), w("you'll face")];
  const exit: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  const leave: Fx = [whatIf, 0.2, 0, 8, E.p2i];
  const arrive = (t0: number): Fx => [t0, 0.5, 1, 0, E.expo];
  // the grid moves to the middle of the frame and grows to cells of 100 px
  const p = at(t, 0, [[whatIf + 0.1, 0.7, 1, E.p2io]]);
  const k = 1 + (100 / CELL - 1) * p, gx = X0 + (410 - X0) * p, gy = Y0 + (220 - Y0) * p;
  const pulls = [w("learn from"), w("rewards"), w("by trying"), w("each choice")];
  const fogAt = (r: number, c: number) => {
    const clear = WALK.findIndex(([a, b]) => a === r && b === c);
    return at(t, 0, [[noModel + 0.04 * c + 0.02 * r, 0.35, 1, E.p2o], ...(clear >= 0 ? [[steps[clear] + 0.15, 0.3, 0, E.p2o] as Seg<number>] : [])]);
  };
  const agentAt = (d: 0 | 1) => at(t, d ? cy(SR) : cx(SC), WALK.map(([r, c], i): Seg<number> => [steps[i], 0.45, d ? cy(r) : cx(c), E.p2o]));

  return (
    <>
      <MapIntro here={9} from={[8, 4]} out={out} />
      <style>{css}</style>
      <svg id="p09-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [exit])}>
        <defs>
          <marker id="p09-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>
        <g transform={`translate(${gx} ${gy}) scale(${k})`} style={fx(t, [0, 6], [arrive(gridIn)])}>
          {GRID.map((row, r) =>
            [...row].map((ch, c) => {
              const res = MOVES.some(([dr, dc]) => SR + dr === r && SC + dc === c);
              const lit = res ? at(t, 0, [[lead, 0.25, 1, E.p2o], [whatIf, 0.2, 0, E.p2o]]) : 0;
              return (
                <g key={id(r, c)}>
                  <rect x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill={ch === "#" ? "#232c38" : "#1c232d"} stroke="#2a3441" strokeWidth="2" />
                  {res && <rect x={c * CELL + 3} y={r * CELL + 3} width={CELL - 6} height={CELL - 6} rx="6" fill={SOFT} stroke={ACC} strokeWidth="3" opacity={lit} />}
                  {ch === "." && (
                    <text x={c * CELL + CELL - 8} y={r * CELL + 26} textAnchor="end" fontFamily="Inter" fontSize="24" fill={MUTED} opacity={at(t, 1, [[noModel, 0.3, 0, E.p2o]])}>{h(r, c)}</text>
                  )}
                </g>
              );
            }),
          )}
          <path d={PATH_D} fill="none" stroke={OK} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${PATH_LEN} ${PATH_LEN}`}
            strokeDashoffset={at(t, PATH_LEN, [[draw, 0.7, 0, E.p2io]])} style={fx(t, [1, 0], [[actions, 0.25, 0.25, null, E.p2o], leave])} />
          {MOVES.map(([dr, dc]) => (
            <g key={id(dr, dc)} style={fx(t, [0, 4], [[actions + 0.1, 0.3, 1, 0, E.p2o], leave])}>
              <line x1={cx(SC) + dc * 22} y1={cy(SR) + dr * 22} x2={cx(SC) + dc * (CELL - 6)} y2={cy(SR) + dr * (CELL - 6)} stroke={ACC} strokeWidth="4" markerEnd="url(#p09-ah)" />
              {/* the step cost beside its arrow, at the cell boundary, like the edge costs of the app's graph figures */}
              <text x={cx(SC) + dc * CELL * 0.55 + (dc ? 0 : -13)} y={cy(SR) + dr * CELL * 0.55 + (dc ? -13 : 10)} textAnchor={dc ? "middle" : "end"} fontFamily="Inter" fontSize="28" fontWeight="700" fill={ACC}
                stroke="#0e1116" strokeWidth="7" paintOrder="stroke" style={fx(t, [0, 4], [[cost, 0.3, 1, 0, E.p2o]])}>1</text>
            </g>
          ))}
          {GRID.map((row, r) =>
            [...row].map((ch, c) =>
              ch === "S" || ch === "G" ? (
                <text key={id(r, c)} x={cx(c)} y={cy(r) + 12} textAnchor="middle" fontFamily="Inter" fontSize="34" fontWeight="700" fill={INK} stroke="#161b22" strokeWidth="6" paintOrder="stroke">{ch}</text>
              ) : null,
            ),
          )}
          {/* no model: fog over every cell but the agent's */}
          {GRID.map((row, r) => [...row].map((ch, c) => (ch === "S" ? null : <rect key={id(r, c)} x={c * CELL + 1} y={r * CELL + 1} width={CELL - 2} height={CELL - 2} fill="#2f3a48" opacity={fogAt(r, c)} />)))}
          <circle cx={agentAt(0)} cy={agentAt(1)} r="15" fill={ACC} stroke="#161b22" strokeWidth="4" style={fx(t, [0, 4], [[noModel + 0.3, 0.3, 1, 0, E.p2o]])} />
        </g>
        <g style={fx(t, [0, 6], [[draw + 0.7, 0.3, 1, 0, E.p2o], leave])}>
          <line x1={X0} x2={X0 + 36} y1={Y0 + 5 * CELL + 48} y2={Y0 + 5 * CELL + 48} stroke={OK} strokeWidth="6" strokeLinecap="round" />
          <text x={X0 + 52} y={Y0 + 5 * CELL + 57} fontFamily="Inter" fontSize="28" fontWeight="500" fill={PREV}>A* (f = g + h): cost {A.cost}, optimal</text>
        </g>
        <g style={fx(t, [0, 6], [arrive(bandits), leave])}>
          <BanditRows t={t} steps={BANDIT} pulls={pulls} x={1140} y={340} gap={84} trackX={1330} trackW={200} numX={1552} right={1712} clear={alone} />
        </g>
      </svg>
      <div className="p09-head" style={{ left: X0, ...fx(t, [0, 6], [arrive(gridIn), leave]) }}>A*</div>
      <div className="p09-head" style={{ left: 1140, ...fx(t, [0, 6], [arrive(bandits), leave]) }}>Bandits</div>
    </>
  );
};
