import b1 from "../../public/vo/03/b1.words.json";
import b2 from "../../public/vo/03/b2.words.json";
import b3 from "../../public/vo/03/b3.words.json";
import b4 from "../../public/vo/03/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch03: Chapter = {
  id: "03-uninformed",
  n: 3,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Tree vs graph search", "in this"],
    ["Evaluating a strategy (b, d, m)", "how to judge"],
    ["Breadth-first", "six strategies"],
    ["Uniform-cost", "six strategies"],
    ["Depth-first", "six strategies"],
    ["Depth-limited", "six strategies"],
    ["Iterative deepening", "six strategies"],
    ["Bidirectional", "six strategies"],
    ["Summary table", "one table"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Jun 2024 · States k → 2k, 2k+1: iterative deepening search", "trace", "medium", "run these"],
    ["Exam · Jul 2022 · Knight on a 3×4 board: breadth-first search", "trace", "easy", "the order"],
  ],
  solved: "solution found",
};
