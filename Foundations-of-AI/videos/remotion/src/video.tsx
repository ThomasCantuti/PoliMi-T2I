import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, Series, staticFile } from "remotion";
import { Beat, beat, INK, Word } from "./anim";
import { Captions } from "./shared/Captions";
import { End } from "./shared/End";
import { Exam, ExamRow } from "./shared/Exam";
import { Roadmap } from "./shared/Roadmap";
import { Title } from "./shared/Title";

export const FPS = 30;
const f = (s: number) => Math.round(s * FPS);

// content/topics.json, in course order
export const TITLES = [
  "Intelligent Agents",
  "Problem Solving by Search",
  "Uninformed Search",
  "Informed Search",
  "Constraint Satisfaction Problems",
  "Local Search & Optimization",
  "Adversarial Search",
  "Monte Carlo Tree Search & Bandits",
  "Learning to Search and Play",
  "Logical Agents & Propositional Logic",
  "Classical Planning",
  "Uncertainty & Bayesian Networks",
];

/** One chapter intro (SCRIPTS.md template): title, 1 previously, 2 big picture, 3 roadmap, 4 exam payoff, end card.
 *  vo = the word timings of public/vo/<nn>/b1..b4 (made by ../tools/vo.sh); the two middle scenes are the chapter's own. */
export type Chapter = {
  id: string;
  n: number;
  vo: Word[][];
  previously: React.FC<Beat>;
  big: React.FC<Beat>;
  roadmap: [string, string][];
  exam: ExamRow[];
  solved: string;
};

// The voice is the clock: a voiced scene starts its clip LEAD s in and holds TAIL s after the last word.
const LEAD = 0.3,
  TAIL = 0.8;

const scenes = (ch: Chapter) => {
  const nn = String(ch.n).padStart(2, "0");
  const voiced = (Scene: React.FC<Beat>, k: number) => {
    const vo = ch.vo[k];
    return {
      Scene,
      wav: `vo/${nn}/b${k + 1}.wav`,
      beat: beat(vo, LEAD, LEAD + vo[vo.length - 1].end + TAIL),
    };
  };
  return [
    {
      Scene: () => <Title n={ch.n} name={TITLES[ch.n - 1]} />,
      wav: null,
      beat: beat([], 0, 2.4),
    },
    voiced(ch.previously, 0),
    voiced(ch.big, 1),
    voiced((b) => <Roadmap {...b} stations={ch.roadmap} />, 2),
    voiced((b) => <Exam {...b} rows={ch.exam} solved={ch.solved} />, 3),
    {
      Scene: () => <End next={ch.n < 12 ? [ch.n + 1, TITLES[ch.n]] : null} />,
      wav: null,
      beat: beat([], 0, 3.6),
    },
  ];
};

export const frames = (ch: Chapter) =>
  scenes(ch).reduce((n, s) => n + f(s.beat.dur), 0);

export const Video = ({ ch }: { ch: Chapter }) => {
  const list = useMemo(() => scenes(ch), [ch]); // stable scene components, so React does not remount them every frame
  return (
    <AbsoluteFill
      style={{
        background: "#0e1116",
        fontFamily: "Inter, sans-serif",
        color: INK,
      }}
    >
      {/* HyperFrames injects this into every page it renders; without it Chrome draws text visibly heavier */}
      <style>{"html,body,*{text-rendering:geometricPrecision}"}</style>
      <Series>
        {list.map(({ Scene, wav, beat }, i) => (
          <Series.Sequence key={i} durationInFrames={f(beat.dur)}>
            <Scene {...beat} />
            <Captions {...beat} />
            {wav && (
              <Sequence from={f(LEAD)}>
                <Audio src={staticFile(wav)} />
              </Sequence>
            )}
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
