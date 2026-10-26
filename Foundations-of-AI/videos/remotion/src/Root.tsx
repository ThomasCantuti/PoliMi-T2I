import { Composition } from "remotion";
import { ch01 } from "./v01";
import { ch02 } from "./v02";
import { ch03 } from "./v03";
import { ch04 } from "./v04";
import { ch05 } from "./v05";
import { ch06 } from "./v06";
import { ch07 } from "./v07";
import { ch08 } from "./v08";
import { ch09 } from "./v09";
import { ch10 } from "./v10";
import { ch11 } from "./v11";
import { ch12 } from "./v12";
import { Chapter, FPS, frames, Video } from "./video";

// one composition per chapter; render with `npx remotion render <id> out/<id>.mp4`
const VIDEOS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12].map((ch: Chapter) => ({
  ch,
  Component: () => <Video ch={ch} />,
}));

export const RemotionRoot: React.FC = () => (
  <>
    {VIDEOS.map(({ ch, Component }) => (
      <Composition key={ch.id} id={ch.id} component={Component} fps={FPS} width={1920} height={1080} durationInFrames={frames(ch)} />
    ))}
  </>
);
