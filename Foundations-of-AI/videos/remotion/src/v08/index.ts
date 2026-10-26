import b1 from "../../public/vo/08/b1.words.json";
import b2 from "../../public/vo/08/b2.words.json";
import b3 from "../../public/vo/08/b3.words.json";
import b4 from "../../public/vo/08/b4.words.json";
import { Chapter } from "../video";
import { Big } from "./Big";
import { Previously } from "./Previously";

export const ch08: Chapter = {
  id: "08-mcts",
  n: 8,
  vo: [b1, b2, b3, b4],
  previously: Previously,
  big: Big,
  // "On this page" sections, each with the roadmap narration's phrase that lights it
  roadmap: [
    ["Why not alpha-beta", "in this"],
    ["Rollouts", "rollouts"],
    ["The four phases", "the four"],
    ["Node statistics", "the four"],
    ["Step-by-step example", "the four"],
    ["Bandits, ε-greedy, UCB1", "multi-armed"],
    ["UCT", "UCT"],
    ["MCTS vs minimax", "UCT"],
    ["Four ways to build a player", "how AlphaZero"],
    ["AlphaZero", "how AlphaZero"],
  ],
  // the problems as the Problems tab titles them: [title, kind, difficulty, phrase it lands on]
  exam: [
    ["Exam · Feb 2023 · MCTS for the white player: UCB1, selection, three iterations", "quiz", "medium", "a partial"],
  ],
  solved: "after each playout",
};
