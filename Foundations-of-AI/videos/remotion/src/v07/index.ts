import b1 from "../../public/vo/07/b1.words.json";
import b2 from "../../public/vo/07/b2.words.json";
import b3 from "../../public/vo/07/b3.words.json";
import b4 from "../../public/vo/07/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch07: Chapter = {
  id: "07-adversarial",
  n: 7,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Games as search", "in this"],
    ["Minimax", "minimax"],
    ["Alpha-beta", "alpha-beta"],
    ["Move ordering", "move ordering"],
    ["Evaluation functions", "evaluation"],
    ["Expectiminimax", "games with dice"],
    ["More than two players", "more than"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Jan 2026 · Alpha-beta values and pruned nodes (version B)", "trace", "medium", "a game tree"],
    ["Exam · Sep 2023 · A tree where alpha-beta prunes nothing, and the best reordering", "trace", "medium", "the branches"],
  ],
  solved: "prunes",
};
