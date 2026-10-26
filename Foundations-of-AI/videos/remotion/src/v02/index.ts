import b1 from "../../public/vo/02/b1.words.json";
import b2 from "../../public/vo/02/b2.words.json";
import b3 from "../../public/vo/02/b3.words.json";
import b4 from "../../public/vo/02/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch02: Chapter = {
  id: "02-formulation",
  n: 2,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Formulating a problem", "the five"],
    ["The 8-puzzle", "counting"],
    ["Size of the state space", "counting"],
    ["Abstraction", "abstraction"],
    ["Different formulations", "different formulations"],
    ["The search tree", "search trees"],
    ["Graph search", "graph search"],
    ["Best-first search", "graph search"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Jan 2024 · Cryptarithmetic SAVE + MORE = MONEY as a search problem", "quiz", "medium", "formulate"],
    ["Exam · Jul 2026 · Word-concatenation game: formulation and branching factor", "code", "medium", "then give"],
  ],
  solved: "state space",
};
