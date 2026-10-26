import { ACC } from "../anim";

const WARN = "#e3b341", PANEL = "#161b22";

/** web/src/figs/plan-rooms.ts rooms(): R1–D1–R2–D2–R3 of width `w` at (x, y), the robot (R) in room `robot` and the box (B)
 *  in room `box` (fractional while they move). `labels` = opacity of the room/door names and of the R/B letters, which are
 *  drawn only where they reach 24 px. */
export const Rooms = ({ x, y, w, robot, box, labels = 1 }: { x: number; y: number; w: number; robot: number; box: number; labels?: number }) => {
  const rw = w / 3, h = rw * 0.62, r = rw * 0.15, fs = Math.max(24, rw * 0.13), letters = r * 1.1 >= 24;
  const at = (room: number, dx: number) => `translate(${x + (room - dx) * rw} ${y + h * 0.66})`;
  return (
    <g>
      {[0, 1, 2].map((k) => (
        <rect key={k} x={x + k * rw} y={y} width={rw} height={h} fill="#1c232d" stroke="#3a4757" strokeWidth="2.5" />
      ))}
      {[1, 2].map((k) => (
        <rect key={k} x={x + k * rw - rw * 0.03} y={y + h * 0.3} width={rw * 0.06} height={h * 0.4} fill={PANEL} />
      ))}
      <g opacity={labels} fontFamily="Inter" fontWeight="600" fill="#7d8a99">
        {[0, 1, 2].map((k) => (
          <text key={k} x={x + k * rw + rw * 0.05} y={y + fs + rw * 0.03} fontSize={fs}>R{k + 1}</text>
        ))}
        {[1, 2].map((k) => (
          <text key={k} x={x + k * rw} y={y + h + fs} fontSize={Math.max(24, fs * 0.85)} textAnchor="middle">D{k}</text>
        ))}
      </g>
      <g transform={at(robot, 0.7)}>
        <circle r={r} fill={ACC} stroke={PANEL} strokeWidth="2.5" />
        {letters && <text y={r * 0.4} fontSize={r * 1.1} fontFamily="Inter" fontWeight="700" fill="#fff" textAnchor="middle" opacity={labels}>R</text>}
      </g>
      <g transform={at(box, 0.3)}>
        <rect x={-r} y={-r} width={2 * r} height={2 * r} rx={r * 0.2} fill={WARN} stroke={PANEL} strokeWidth="2.5" />
        {letters && <text y={r * 0.4} fontSize={r * 1.1} fontFamily="Inter" fontWeight="700" fill="#fff" textAnchor="middle" opacity={labels}>B</text>}
      </g>
    </g>
  );
};
