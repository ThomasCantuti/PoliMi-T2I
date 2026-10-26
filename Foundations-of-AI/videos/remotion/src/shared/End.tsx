import { E, fx, useTime } from "../anim";

const css = `
  #e-wrap { position: absolute; left: 192px; top: 410px; }
  #e-kicker { font: 600 36px/1.2 Inter, sans-serif; color: #b4c0cc; }
  #e-name { margin-top: 16px; font: 700 96px/1.05 Inter, sans-serif; letter-spacing: -0.025em; color: #e6edf3; }
  #e-name .w { display: inline-block; }
  #e-name .n { color: #7c8cff; }
`;

/** "Up next" and the next chapter (its number in the accent); after the last chapter, the course is done. */
export const End = ({ next }: { next: [number, string] | null }) => {
  const t = useTime();
  const WORDS = next ? [String(next[0]), ...next[1].split(" ")] : ["Course", "complete"];
  return (
    <>
      <style>{css}</style>
      <div id="e-wrap">
        <div id="e-kicker" style={fx(t, [0, 8], [[0.1, 0.2, 1, 0, E.p4o]])}>{next ? "Up next" : "Foundations of AI"}</div>
        <div id="e-name">
          {WORDS.map((w, i) => (
            <span key={i}>
              {i ? " " : ""}
              <span className={i || !next ? "w" : "w n"} style={fx(t, [0, 6], [[0.3 + 0.067 * i, 0.13, 1, 0, E.p2o]])}>{w}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
};
