import b1 from "../../public/vo/06/b1.words.json";
import b2 from "../../public/vo/06/b2.words.json";
import b3 from "../../public/vo/06/b3.words.json";
import b4 from "../../public/vo/06/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch06: Chapter = {
  id: "06-local",
  n: 6,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Ingredients", "in this"],
    ["Hill climbing", "hill climbing"],
    ["Homes and hospitals", "a worked"],
    ["Why it gets stuck", "local maxima"],
    ["CSPs as optimization", "solving"],
    ["Min-conflicts", "min-conflicts"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Jan 2023 · Grid navigation as a hill-climbing problem", "code", "medium", "model"],
  ],
  solved: "gets stuck",
};
