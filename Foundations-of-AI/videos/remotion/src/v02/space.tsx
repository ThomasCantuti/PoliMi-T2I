import { interpolateColors } from "remotion";
import { INK, SOFT, ACC, STROKE } from "../anim";

// The 8-puzzle of web/src/figs/search-8puzzle.ts: same start state, same actions and result.
export type Tiles = number[]; // row by row, 0 = blank
const MOVES = { up: -3, down: 3, left: -1, right: 1 } as const;
export type Move = keyof typeof MOVES;
export const START: Tiles = [8, 2, 7, 3, 4, 0, 5, 1, 6];

export function actions(t: Tiles): Move[] {
  const b = t.indexOf(0), r = Math.floor(b / 3), c = b % 3;
  return (["up", "down", "left", "right"] as Move[]).filter((a) => (a !== "up" || r > 0) && (a !== "down" || r < 2) && (a !== "left" || c > 0) && (a !== "right" || c < 2));
}

export function result(t: Tiles, a: Move): Tiles {
  const b = t.indexOf(0), n = b + MOVES[a], out = [...t];
  [out[b], out[n]] = [out[n], out[b]];
  return out;
}

/** [tile, col, row] for every tile (0 = blank); col/row may be fractional while a tile slides. */
export type Cell = [number, number, number];
export const cellsOf = (t: Tiles): Cell[] => t.map((v, i) => [v, i % 3, Math.floor(i / 3)]);

/** A 3×3 board centred at (x, y), the app's .p8 look: tiles panel-2, blank panel-3, `hi` tile in the accent (0..1). */
export const Board = ({ x, y, cell, cells, hi = -1, hiP = 0, num = 1 }: { x: number; y: number; cell: number; cells: Cell[]; hi?: number; hiP?: number; num?: number }) => {
  const g = cell * 0.06;
  return (
    <g>
      {[...cells].sort((a, b) => a[0] - b[0]).map(([v, c, r]) => {
        const X = x + (c - 1.5) * cell, Y = y + (r - 1.5) * cell, lit = v === hi ? hiP : 0;
        return (
          <g key={v}>
            <rect
              x={X + g} y={Y + g} width={cell - 2 * g} height={cell - 2 * g} rx={cell * 0.1} strokeWidth={Math.max(1.5, cell * 0.045)}
              fill={v ? interpolateColors(lit, [0, 1], ["#1c232d", SOFT]) : "#232c38"}
              stroke={interpolateColors(lit, [0, 1], ["#3a4757", ACC])}
            />
            {v > 0 && num > 0 && (
              <text x={X + cell / 2} y={Y + cell / 2 + cell * 0.155} textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize={cell * 0.44} fill={INK} opacity={num}>
                {v}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

// The state space the description defines, breadth-first from START up to depth D, laid out as a fan from the
// start (layer d on an ellipse arc of radius R·d; each layer ordered by its parents, so edges cross little).
const D = 10, X0 = 290, Y0 = 470, R = 140, SQ = 0.62, A = 1.36;
export type FNode = { tiles: Tiles; d: number; parent: number; x: number; y: number; f: number };
export const NODES: FNode[] = [{ tiles: START, d: 0, parent: -1, x: X0, y: Y0, f: 0.5 }];
export const LAYERS: number[][] = [[0]];
const ups: number[][] = [[]]; // neighbours one layer up
{
  const seen = new Map<string, number>([[START.join(""), 0]]);
  for (let d = 0; d < D; d++) {
    const next: number[] = [];
    for (const u of LAYERS[d])
      for (const a of actions(NODES[u].tiles)) {
        const t = result(NODES[u].tiles, a), k = t.join("");
        let v = seen.get(k);
        if (v === undefined) {
          v = NODES.length;
          seen.set(k, v);
          NODES.push({ tiles: t, d: d + 1, parent: u, x: 0, y: 0, f: 0 });
          ups.push([]);
          next.push(v);
        }
        if (NODES[v].d === d + 1) ups[v].push(u);
      }
    const bary = (v: number) => ups[v].reduce((s, u) => s + NODES[u].f, 0) / ups[v].length;
    next.sort((a, b) => bary(a) - bary(b) || a - b);
    next.forEach((v, i) => {
      const n = NODES[v], ang = -A + (2 * A * (i + 0.5)) / next.length;
      n.f = (i + 0.5) / next.length;
      n.x = X0 + R * n.d * Math.cos(ang);
      n.y = Y0 + R * n.d * SQ * Math.sin(ang);
    });
    LAYERS.push(next);
  }
}
const f1 = (x: number) => x.toFixed(1);
// per layer: the edges into it and its nodes (layers 0 and 1 are drawn as boards)
const EDGE_D = LAYERS.map((l) => l.flatMap((v) => ups[v].map((u) => `M${f1(NODES[u].x)},${f1(NODES[u].y)}L${f1(NODES[v].x)},${f1(NODES[v].y)}`)).join(""));
const DOT_D = LAYERS.map((l, d) => (d < 2 ? "" : l.map((v) => `M${f1(NODES[v].x - 5)},${f1(NODES[v].y)}a5,5 0 1 0 10,0a5,5 0 1 0 -10,0`).join("")));

/** The faint state space, clipped above the captions; layer d at opacity op(d); children are drawn on top, clipped too. */
export const Space = ({ clip, op, children }: { clip: string; op: (d: number) => number; children?: React.ReactNode }) => (
  <g clipPath={`url(#${clip})`}>
    <defs>
      <clipPath id={clip}>
        <rect x="0" y="40" width="1920" height="820" />
      </clipPath>
    </defs>
    {EDGE_D.map((d, k) => k > 0 && <path key={k} d={d} fill="none" stroke={STROKE} strokeWidth="1.5" opacity={op(k)} />)}
    {DOT_D.map((d, k) => k > 1 && <path key={k} d={d} fill="#2b3544" stroke={STROKE} strokeWidth="1.5" opacity={op(k)} />)}
    {children}
  </g>
);

/** Root to node i through the breadth-first tree. */
export const pathTo = (i: number): number[] => (i < 0 ? [] : [...pathTo(NODES[i].parent), i]);
/** The tree's nodes up to depth d (the root and layer 1 are boards). */
export const treeUpTo = (d: number) => LAYERS.slice(0, d + 1).flat();
export const MINI = 18; // cell of the boards at the root and on layer 1
export const GOAL = LAYERS[5][8]; // a state 5 moves from the start
