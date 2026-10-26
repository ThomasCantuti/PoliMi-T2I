import { loadFont } from "@remotion/google-fonts/Inter";
import { Easing, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";

loadFont("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext", "greek"] });

// The app's dark theme (web/src/styles/tokens.css), same hex values as the HyperFrames original.
export const ACC = "#7c8cff", SOFT = "rgba(124,140,255,0.16)", FILL = "rgba(28,35,45,1)", STROKE = "#4b5a6e";
export const OK = "#3fb950", INK = "#e6edf3", PREV = "#b4c0cc", MUTED = "#7d8a99";

// GSAP eases as Remotion Easing: powerN = polynomial of degree N+1. GSAP's default ease is power1.out.
type Ease = (x: number) => number;
export const E = {
  p1o: Easing.out(Easing.quad),
  p1io: Easing.inOut(Easing.quad),
  p2o: Easing.out(Easing.cubic),
  p2i: Easing.cubic,
  p2io: Easing.inOut(Easing.cubic),
  p3i: Easing.poly(4),
  p4o: Easing.out(Easing.poly(5)),
  expo: Easing.out(Easing.exp),
};

/** Seconds local to the enclosing <Sequence> (the original's GSAP times are scene-local seconds). */
export const useTime = () => useCurrentFrame() / useVideoConfig().fps;

/** One GSAP tween on one property: [start s, duration s, to, ease = power1.out, from (fromTo only)]. */
export type Seg<T> = [number, number, T, Ease?, T?];

const mix = (a: number | string, b: number | string, p: number) =>
  typeof a === "number" ? a + ((b as number) - a) * p : interpolateColors(p, [0, 1], [a, b as string]);

/** Value of a property at time t: the latest-started tween wins, starting from where the chain was (GSAP to()). */
export function at(t: number, init: number, segs: Seg<number>[]): number;
export function at(t: number, init: string, segs: Seg<string>[]): string;
export function at(t: number, init: number | string, segs: Seg<number | string>[]) {
  const ev = ([t0, d, to, ease = E.p1o]: Seg<number | string>, from: number | string, now: number) => {
    const p = d ? Math.min(1, Math.max(0, (now - t0) / d)) : 1;
    return p >= 1 ? to : mix(from, to, ease(p));
  };
  let cur: Seg<number | string> | null = null, from = init;
  for (const s of [...segs].sort((a, b) => a[0] - b[0])) {
    if (s[0] > t) break;
    from = s[4] ?? (cur ? ev(cur, from, s[0]) : from);
    cur = s;
  }
  return cur ? ev(cur, from, t) : init;
}

export type Word = { text: string; start: number; end: number };
/** A scene's clock: its length and its voiceover's words in scene-local seconds. w(phrase) = when the voice starts
 *  the phrase, wEnd(phrase) = when it finishes it; cues hang on words, so a new voice or speed needs no retiming. */
export type Beat = { dur: number; words: Word[]; w: (phrase: string) => number; wEnd: (phrase: string) => number };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
export const beat = (vo: Word[], lead: number, dur: number): Beat => {
  const words = vo.map((x) => ({ text: x.text, start: x.start + lead, end: x.end + lead }));
  const find = (phrase: string) => {
    const p = phrase.split(" ").map(norm);
    const i = words.findIndex((_, i) => p.every((x, k) => i + k < words.length && norm(words[i + k].text) === x));
    if (i < 0) throw new Error(`"${phrase}" is not in the voiceover`);
    return [i, i + p.length - 1];
  };
  return { dur, words, w: (p) => words[find(p)[0]].start, wEnd: (p) => words[find(p)[1]].end };
};

/** Opacity + blur tweened together, the original's arrival/exit move. null = this tween leaves that property alone. */
export type Fx = [number, number, number | null, number | null, Ease?, [number, number]?];
export const fx = (t: number, init: [number, number], segs: Fx[]) => ({
  opacity: at(t, init[0], segs.filter((s) => s[2] !== null).map(([t0, d, o, , e, f]) => [t0, d, o!, e, f?.[0]])),
  filter: `blur(${at(t, init[1], segs.filter((s) => s[3] !== null).map(([t0, d, , b, e, f]) => [t0, d, b!, e, f?.[1]]))}px)`,
});
