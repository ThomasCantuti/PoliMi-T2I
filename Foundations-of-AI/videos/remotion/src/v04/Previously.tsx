import { getLength } from "@remotion/paths";
import { ACC, at, Beat, E, Fx, fx, useTime } from "../anim";
import { MapIntro } from "../shared/map";
import { clock, GSTAR, MAP_CSS, pathD, Pool, RomaniaMap, runOf, schedule, UCS } from "./romania";

const css = `
  #p04-svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  #p04-head { position: absolute; left: 192px; top: 104px; font: 700 60px/1.1 Inter, sans-serif; letter-spacing: -0.02em; color: #e6edf3; }
  #p04-f { position: absolute; left: 192px; top: 190px; font: 600 40px/1.2 Inter, sans-serif; color: #b4c0cc; }
  ${MAP_CSS("p04")}
`;

// uniform-cost search on the Romania map: the cheapest path first, so the explored region grows as rings of equal g
// around Arad, west as much as east, until Bucharest is selected; then the path it paid for is traced back
const BACK = pathD(["B", "P", "R", "S", "A"]);
const BL = getLength(BACK);

export const Previously = ({ dur, w, wEnd }: Beat) => {
  const t = useTime();
  const go = Math.max(w("extends"), 2.4), tIn = go + 0.3;
  const ts = schedule(UCS.map((s) => s.g), w("path found"), wEnd("toward it"));
  const { states, labels } = runOf(UCS, ts, tIn + 0.5, (_, g) => `g=${g}`);
  const c = clock(t, UCS.map((s, i): [number, number] => [ts[i], s.g]));
  const back = w("looks back"), paid = w("already paid");
  const out: Fx = [dur - 0.25, 0.2, 0, 8, E.p2i];

  return (
    <>
      <MapIntro here={4} from={[3]} out={w("extends")} />
      <style>{css}</style>
      <svg id="p04-svg" viewBox="0 0 1920 1080" style={fx(t, [1, 0], [out])}>
        {t >= ts[0] && (
          <Pool c={c} val={(k) => GSTAR[k]} rate={() => 1} grow={at(t, 0, [[ts[0], 0.5, 1, E.expo]])} start="A" />
        )}
        <RomaniaMap
          t={t} tIn={tIn} p="p04" states={states} labels={labels}
          labelColor={{ B: [[paid, 0.25, ACC, E.p2o]] }} lbl={{ P: [0, -32, "middle"] }}
          over={
            <path
              d={BACK} fill="none" stroke={ACC} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={BL} strokeDashoffset={at(t, BL, [[back, 0.9, 0, E.p2io]])}
            />
          }
        />
      </svg>
      <div id="p04-head" style={fx(t, [0, 6], [[tIn + 0.1, 0.5, 1, 0, E.expo], out])}>Uniform-cost search</div>
      <div id="p04-f" style={fx(t, [0, 6], [[tIn + 0.25, 0.5, 1, 0, E.expo], out])}>f(n) = g(n)</div>
    </>
  );
};
