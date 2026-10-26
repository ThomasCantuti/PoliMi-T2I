import b1 from "../../public/vo/11/b1.words.json";
import b2 from "../../public/vo/11/b2.words.json";
import b3 from "../../public/vo/11/b3.words.json";
import b4 from "../../public/vo/11/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch11: Chapter = {
  id: "11-planning",
  n: 11,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Representation", "writing"],
    ["STRIPS vs PDDL", "action schemas"],
    ["Schemas vs ground actions", "action schemas"],
    ["Forward planning", "forward"],
    ["Backward planning", "backward"],
    ["Heuristics", "planning heuristics"],
    ["SATPlan", "SATPlan"],
    ["Nondeterministic domains", "SATPlan"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Write the action schemas (2023–2026)", "code", "hard", "write"],
    ["Exam · Regressing the goal: how many ways, which new goals (2022–2026)", "code", "medium", "regress"],
  ],
  solved: "relevant action",
};
