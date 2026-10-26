import b1 from "../../public/vo/10/b1.words.json";
import b2 from "../../public/vo/10/b2.words.json";
import b3 from "../../public/vo/10/b3.words.json";
import b4 from "../../public/vo/10/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch10: Chapter = {
  id: "10-logic",
  n: 10,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Knowledge-based agents", "in this"],
    ["Models and entailment", "propositional"],
    ["Propositional logic", "propositional"],
    ["Validity and satisfiability", "entailment"],
    ["CNF", "CNF"],
    ["Resolution", "resolution"],
    ["Horn clauses", "forward and"],
    ["Forward and backward chaining", "forward and"],
    ["DPLL", "DPLL"],
    ["WalkSAT", "WalkSAT"],
    ["First-order logic", "WalkSAT"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Resolution refutations (2022–2026)", "code", "medium", "prove a query"],
    ["Exam · DPLL tables (2023–2026)", "code", "medium", "run DPLL"],
  ],
  solved: "step by step",
};
