import { at, Beat, E, Fx, fx, OK, useTime } from "../anim";

/** A problem as the Problems tab lists it: [title, kind, difficulty, phrase it lands on]. */
export type ExamRow = [string, "quiz" | "code" | "trace", "easy" | "medium" | "hard", string];

const css = `
  #x-head { position: absolute; left: 192px; top: 104px; font: 700 68px/1.1 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
  #x-card { position: absolute; left: 192px; top: 340px; width: 1536px; background: #161b22; border: 2px solid #2a3441; border-radius: 22px; overflow: hidden; }
  .x-row { display: flex; align-items: center; gap: 28px; min-height: 132px; padding: 24px 44px; }
  .x-row + .x-row { border-top: 2px solid #2a3441; }
  .x-dot { position: relative; flex: none; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #3a4757; }
  .x-dot svg { position: absolute; inset: 3px; }
  .x-chip { flex: none; padding: 4px 18px; border-radius: 99px; border: 2px solid; font: 600 28px/1.3 Inter, sans-serif; }
  .x-quiz { color: #e3b341; background: rgba(227,179,65,0.1); border-color: rgba(227,179,65,0.25); }
  .x-code { color: #7c8cff; background: rgba(124,140,255,0.1); border-color: rgba(124,140,255,0.25); }
  .x-trace { color: #39c5cf; background: rgba(57,197,207,0.1); border-color: rgba(57,197,207,0.25); }
  .x-title { flex: 1; font: 500 34px/1.25 Inter, sans-serif; color: #e6edf3; }
  .x-diff { flex: none; font: 600 28px/1.2 Inter, sans-serif; }
`;
const DIFF = { easy: "#3fb950", medium: "#e3b341", hard: "#f85149" };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Each row lands just before the voice names its task; all turn solved, 0.25 s apart, on `solved`. */
export const Exam = ({ dur, w, rows, solved: done }: Beat & { rows: ExamRow[]; solved: string }) => {
  const t = useTime();
  const lands = rows.map((r) => w(r[3]) - 0.15), solved = rows.map((_, r) => w(done) + 0.25 * r);
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];
  return (
    <>
      <style>{css}</style>
      <div id="x-head" style={fx(t, [0, 8], [[0.1, 0.2, 1, 0, E.p4o], out])}>In the exam</div>
      <div id="x-card" style={fx(t, [0, 0], [[lands[0] - 0.1, 0.3, 1, null, E.p2o], out])}>
        {rows.map(([title, kind, diff], r) => (
          <div
            key={title}
            className="x-row"
            style={{
              opacity: at(t, 0, [[lands[r], 0.5, 1, E.expo]]),
              transform: `translate(${at(t, 0, [[lands[r], 0.5, 0, E.expo, 40]])}px, 0px)`,
            }}
          >
            <span
              className="x-dot"
              style={{
                backgroundColor: at(t, "rgba(0,0,0,0)", [[solved[r], 0.25, OK, E.p2o]]),
                borderColor: at(t, "#3a4757", [[solved[r], 0.25, OK, E.p2o]]),
              }}
            >
              <svg viewBox="0 0 24 24" style={{ opacity: at(t, 0, [[solved[r] + 0.05, 0.2, 1]]) }}>
                <path d="M6 12.5l4 4 8-9" fill="none" stroke="#0e1116" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={`x-chip x-${kind}`}>{cap(kind)}</span>
            <span className="x-title">{title}</span>
            <span className="x-diff" style={{ color: DIFF[diff] }}>
              {cap(diff)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};
