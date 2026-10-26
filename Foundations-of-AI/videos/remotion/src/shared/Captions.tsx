import { at, Beat, E, useTime, Word } from "../anim";

const css = `
  .cap { position: absolute; left: 0; right: 0; bottom: 96px; padding: 0 192px; text-align: center;
    font: 500 44px/1.25 Inter, sans-serif; color: #e6edf3; }
`;
const MAX_WORDS = 6, HOLD = 0.25;

// Clauses end at punctuation (before a closing quote or parenthesis); short clauses merge (never across a sentence end), long ones split evenly.
const groupsOf = (words: Word[]) => {
  const clauses: Word[][] = [[]];
  for (const w of words) {
    clauses[clauses.length - 1].push(w);
    if (/[.?!:,;]["”’)]?$/.test(w.text)) clauses.push([]);
  }
  const merged: Word[][] = [];
  for (const c of clauses.filter((c) => c.length)) {
    const prev = merged[merged.length - 1];
    if (prev && prev.length + c.length <= MAX_WORDS && !/[.?!]["”’)]?$/.test(prev[prev.length - 1].text)) prev.push(...c);
    else merged.push([...c]);
  }
  return merged.flatMap((c) => {
    const size = Math.ceil(c.length / Math.ceil(c.length / MAX_WORDS));
    return Array.from({ length: Math.ceil(c.length / size) }, (_, i) => c.slice(i * size, (i + 1) * size));
  });
};

/** One caption group at a time, from the voiceover's words: fade in 0.12 s at its start, fade out over its last 0.12 s. */
export const Captions = ({ words }: Beat) => {
  const t = useTime();
  const groups = groupsOf(words);
  const caps = groups.map((g, i): [number, number, string] => [
    Math.max(0.1, g[0].start - 0.05),
    Math.min(g[g.length - 1].end + HOLD, i + 1 < groups.length ? groups[i + 1][0].start - 0.07 : Infinity),
    g.map((w) => w.text).join(" "),
  ]);
  const cap = caps.find(([s, e]) => t >= s && t < e);
  if (!cap) return null;
  const [s, e, text] = cap;
  return (
    <>
      <style>{css}</style>
      <div className="cap" style={{ opacity: at(t, 0, [[s, 0.12, 1, E.p2o], [e - 0.12, 0.12, 0, E.p2i]]) }}>{text}</div>
    </>
  );
};
