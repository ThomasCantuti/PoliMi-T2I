import { E, fx, useTime } from "../anim";

const css = `
  #t-wrap { position: absolute; left: 192px; top: 400px; }
  #t-kicker { font: 600 36px/1.2 Inter, sans-serif; color: #b4c0cc; }
  #t-kicker b { color: #7c8cff; font-weight: 600; }
  #t-name { margin-top: 16px; font: 700 128px/1.05 Inter, sans-serif; letter-spacing: -0.025em; color: #e6edf3; }
`;

export const Title = ({ n, name }: { n: number; name: string }) => {
  const t = useTime();
  return (
    <>
      <style>{css}</style>
      <div id="t-wrap" style={fx(t, [1, 0], [[2.15, 0.2, 0, 8, E.p2i]])}>
        <div id="t-kicker">
          Foundations of AI · <b>Chapter {n}</b>
        </div>
        <div id="t-name">{name}</div>
      </div>
    </>
  );
};
