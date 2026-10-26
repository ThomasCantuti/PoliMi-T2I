import b1 from "../../public/vo/12/b1.words.json";
import b2 from "../../public/vo/12/b2.words.json";
import b3 from "../../public/vo/12/b3.words.json";
import b4 from "../../public/vo/12/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch12: Chapter = {
  id: "12-uncertainty",
  n: 12,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Acting under uncertainty", "in this"],
    ["Probability basics", "probability"],
    ["Bayes' rule", "Bayes'"],
    ["Bayesian networks", "Bayesian"],
    ["The chain rule", "chain rule"],
    ["Node ordering", "building"],
    ["d-separation", "active trails"],
    ["Compact CPTs", "inference"],
    ["Inference by enumeration", "inference"],
    ["Causal, evidential and intercausal reasoning", "inference"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Jul 2024 · Student network: evidential reasoning P(k1 | g3, d1)", "code", "medium", "compute"],
    ["Exam · Jan 2025 · Heart-disease network: active trails", "quiz", "medium", "list the trails"],
  ],
  solved: "some evidence",
};
