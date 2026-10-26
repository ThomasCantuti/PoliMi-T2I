import b1 from "../../public/vo/01/b1.words.json";
import b2 from "../../public/vo/01/b2.words.json";
import b3 from "../../public/vo/01/b3.words.json";
import b4 from "../../public/vo/01/b4.words.json";
import { Chapter } from "../video";
import { Arch } from "./Arch";
import { Course } from "./Course";

export const ch01: Chapter = {
  id: "01-agents",
  n: 1,
  vo: [b1, b2, b3, b4],
  previously: Course,
  big: Arch,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["What is AI", "what AI"],
    ["Agents and environments", "agents and"],
    ["Rationality", "rationality"],
    ["PEAS", "describing"],
    ["Environment properties", "the properties"],
    ["The four architectures", "the four"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Jul 2023 · Rank task environments by property", "quiz", "medium", "rank"],
    ["Exam · Jul 2022 · Simple reflex agent for a light-seeking robot", "code", "easy", "design"],
  ],
  solved: "both",
};
