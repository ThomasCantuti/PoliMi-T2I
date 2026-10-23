export type Kind = 'trace' | 'code' | 'quiz';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Topic {
  id: string;
  title: string;
  short: string;
  pages: string;
  viz: string[];
  blurb: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number | number[];
  explain?: string;
}

export interface Problem {
  id: string;
  topic: string;
  kind: Kind;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  statement: string;
  hints: string[];
  explanation: string;
  starter?: string;
  solution?: string;
  tests?: { name: string; input: string }[];
  questions?: QuizQuestion[];
  viz?: string;
  config?: unknown;
}

export interface TestResult {
  name: string;
  input: string;
  ok: boolean;
  expected?: string;
  got?: string;
  message?: string;
  error?: string;
  stdout?: string;
  ms?: number;
}

export interface RunResult {
  ok: boolean;
  error?: string;
  stdout?: string;
  results: TestResult[];
}

export interface Catalog {
  topics: Topic[];
  problems: Problem[];
  errors: string[];
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  error?: boolean;
  stats?: string;
}
