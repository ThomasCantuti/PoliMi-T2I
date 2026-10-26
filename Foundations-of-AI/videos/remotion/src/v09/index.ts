import b1 from "../../public/vo/09/b1.words.json";
import b2 from "../../public/vo/09/b2.words.json";
import b3 from "../../public/vo/09/b3.words.json";
import b4 from "../../public/vo/09/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch09: Chapter = {
  id: "09-rl",
  n: 9,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Learning agents", "in this"],
    ["The RL loop", "in this"],
    ["Expected payoff", "rewards"],
    ["Rewards", "rewards"],
    ["Values and the Bellman equation", "value functions"],
    ["Policies and exploration", "exploration"],
    ["MDPs", "exploration"],
    ["Q-learning", "Q-learning"],
    ["Why tables don't scale", "Q-learning"],
    ["Search vs learning", "with search"],
    ["Minimax vs Q-learning", "with minimax"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Aug 2022 & Jan 2023 · Q-table after given episodes, and at convergence", "quiz", "medium", "fill in"],
    ["Exam · Jun & Jul 2026 · State values V(s) at convergence in a small maze", "quiz", "easy", "the values"],
  ],
  solved: "convergence",
};
