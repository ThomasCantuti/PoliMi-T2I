import { ACC, at, Beat, E, Fx, fx, INK, MUTED, PREV, Seg, useTime } from "../anim";

const css = `
  #r-head { position: absolute; left: 192px; top: 104px; font: 700 68px/1.1 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
  #r-track, #r-fill { position: absolute; left: 248px; width: 8px; border-radius: 4px; }
  #r-track { background: #2f3a48; }
  #r-fill { background: #7c8cff; transform-origin: 50% 0; }
  .r-st { position: absolute; left: 232px; width: 40px; height: 40px; margin-top: -20px; border-radius: 50%; background: #0e1116; border: 5px solid #4b5a6e; }
  .r-lb { position: absolute; left: 310px; transform: translateY(-50%); font: 600 36px/1.2 Inter, sans-serif; color: #7d8a99; white-space: nowrap; }
`;

/** The page's sections ("On this page") as stations down one line: [label, phrase that lights it]. Stations that share
 *  a phrase light together, 0.12 s apart; the group just named is in the accent, the ones before step down to grey. */
export const Roadmap = ({ dur, w, stations }: Beat & { stations: [string, string][] }) => {
  const t = useTime();
  const n = stations.length, sp = Math.min(100, 600 / (n - 1)), y0 = 560 - ((n - 1) * sp) / 2;
  const T = stations.map(([, p], i) => w(p) + 0.12 * stations.slice(0, i).filter((s) => s[1] === p).length);
  const groupEnd = (i: number) => T.find((x, j) => j > i && stations[j][1] !== stations[i][1]);
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i]; // every element leaves together
  const arrive = (k: number) => fx(t, [0, 0], [[0.2 + 0.02 * k, 0.4, 1, null, E.p2o], out]); // track, stations, labels, staggered
  const light = (i: number, init: string, on: string) => {
    const end = groupEnd(i);
    return at(t, init, [[T[i], 0.25, on, E.p2o], ...(end === undefined ? [] : [[end, 0.25, PREV] as Seg<string>])]);
  };
  return (
    <>
      <style>{css}</style>
      <div id="r-head" style={fx(t, [0, 8], [[0.1, 0.2, 1, 0, E.p4o], out])}>In this chapter</div>
      <div id="r-track" style={{ top: y0, height: (n - 1) * sp, ...arrive(0) }} />
      <div
        id="r-fill"
        style={{ top: y0, height: (n - 1) * sp, ...fx(t, [1, 0], [out]), transform: `scaleY(${at(t, 0, T.map((x, i): Seg<number> => [x - 0.2, 0.4, i / (n - 1), E.p2io]))})` }}
      />
      {stations.map(([label], i) => (
        <div key={label}>
          <div className="r-st" style={{ top: y0 + sp * i, ...arrive(1 + i), backgroundColor: light(i, "#0e1116", ACC), borderColor: light(i, "#4b5a6e", ACC) }} />
          <div className="r-lb" style={{ top: y0 + sp * i, ...arrive(1 + n + i), color: light(i, MUTED, INK) }}>{label}</div>
        </div>
      ))}
    </>
  );
};
