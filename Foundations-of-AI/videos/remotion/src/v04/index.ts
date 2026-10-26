import b1 from "../../public/vo/04/b1.words.json";
import b2 from "../../public/vo/04/b2.words.json";
import b3 from "../../public/vo/04/b3.words.json";
import b4 from "../../public/vo/04/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch04: Chapter = {
  id: "04-informed",
  n: 4,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Best-first template", "in this"],
    ["Greedy", "greedy"],
    ["8-puzzle heuristics", "greedy"],
    ["A*", "and A*"],
    ["Admissible", "admissible"],
    ["Consistent", "consistent"],
    ["Optimality", "optimal"],
    ["Which nodes A* expands", "which nodes"],
    ["Relaxed problems and dominance", "how to invent"],
    ["Weighted A*", "weighted"],
    ["IDA*", "IDA*"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Jun 2023 · Graph from C to F: A* search", "trace", "medium", "run"],
    ["Exam · Jan 2022 · Criss-Cross solitaire: admissible heuristic and one A* step", "quiz", "medium", "design"],
  ],
  solved: "admissible",
};
