import b1 from "../../public/vo/05/b1.words.json";
import b2 from "../../public/vo/05/b2.words.json";
import b3 from "../../public/vo/05/b3.words.json";
import b4 from "../../public/vo/05/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch05: Chapter = {
  id: "05-csp",
  n: 5,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Factored states", "in this"],
    ["Definition and examples", "defining"],
    ["Constraint graph", "defining"],
    ["Backtracking", "backtracking"],
    ["Forward checking", "forward checking"],
    ["Arc consistency (AC-3)", "arc consistency"],
    ["MRV, degree, LCV", "the ordering"],
    ["Problem structure", "the structure"],
    ["The complete 4-queens example", "helps"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Jan 2026 · 4×4 Sudoku with forward checking and MRV (version A)", "trace", "easy", "the backtracking"],
    ["Exam · Jun 2025 · AC-3 proves {WA = G, V = R} inconsistent (Australia)", "trace", "medium", "a full run"],
  ],
  solved: "arc by arc",
};
