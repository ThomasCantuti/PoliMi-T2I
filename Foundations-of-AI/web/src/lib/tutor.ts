// What the tutor knows about the current page, and how it is turned into a system prompt.
import { create } from 'zustand';
import type { Kind, Topic } from './types';

export interface TutorContext {
  key: string; // chat history id
  kind: Kind | 'topic' | 'home';
  title: string;
  topic?: Topic;
  difficulty?: string;
  tags?: string[];
  notes?: string;
  statement?: string;
  hints?: string[];
  solution?: string;
  code?: string;
  results?: string;
  config?: unknown;
  questions?: string;
  vizLog?: string[];
  topicsList?: string;
}

const HOME: TutorContext = { key: 'home', kind: 'home', title: 'Course overview' };

interface TutorUI {
  open: boolean;
  getContext: () => TutorContext;
  pending: string | null; // a message to send as soon as the drawer is ready
  setContext(fn: () => TutorContext): void;
  toggle(force?: boolean): void;
  ask(text: string): void;
}

export const useTutor = create<TutorUI>(set => ({
  open: false,
  getContext: () => HOME,
  pending: null,
  setContext: fn => set({ getContext: fn }),
  toggle: force => set(s => ({ open: force ?? !s.open })),
  ask: text => set({ open: true, pending: text }),
}));

function excerpt(notes: string, query: string, max: number): string {
  const parts = notes.split(/^(?=## )/m);
  const words = query.toLowerCase().match(/[a-z*α-ω0-9-]{3,}/g) ?? [];
  const scored = parts.slice(1).map((s, i) => {
    const low = s.toLowerCase();
    return { s, i, score: words.reduce((a, w) => a + low.split(w).length - 1, 0) / Math.sqrt(s.length + 200) };
  }).sort((a, b) => b.score - a.score);
  let len = parts[0].length;
  const keep: typeof scored = [];
  for (const x of scored) {
    if (len + x.s.length > max) continue;
    keep.push(x);
    len += x.s.length;
  }
  return [parts[0], ...keep.sort((a, b) => a.i - b.i).map(x => x.s)].join('\n').trim();
}

export function systemPrompt(c: TutorContext): string {
  const out = [`You are "Dojo", the tutor inside AlgoDojo, an offline practice app for the university course *Foundations of Artificial Intelligence* (Politecnico di Milano, Amigoni & Lanzi; textbook Russell & Norvig, AIMA 4th ed.; Python code in the style of aima-python).
The student wants to truly UNDERSTAND the algorithms, not memorize them, and to prepare for an exam made of hand-simulation exercises.

How to tutor:
- Be concise: usually under 180 words. Prefer a guiding question, a tiny concrete example or a short step table over long prose.
- Socratic by default: do NOT write the full solution code unless the student explicitly asks for the solution. 1–3 line snippets to illustrate an idea are fine.
- When code fails, point at the exact line or idea that is wrong and explain why, using the failing test.
- Use the course notation (frontier, reached, expand(problem, node), is_goal, f(n) = g(n) + h(n), α/β, UCB1…). Write math in LaTeX: $...$ inline, $$...$$ for display.
- Trust the reference solution, test results and visualizer log below over your own memory. If you are unsure, say so.`];
  const where = [c.kind === 'home' ? 'The home page (study plan overview).' : '',
    c.topic ? `Topic: ${c.topic.title}` : '',
    c.kind !== 'home' && c.kind !== 'topic' ? `Problem: "${c.title}" (${c.kind} exercise${c.difficulty ? ', ' + c.difficulty : ''})` : ''];
  out.push(`## Where the student is\n${where.filter(Boolean).join('\n')}`);
  if (c.topicsList) out.push(`## Course topics, in order\n${c.topicsList}`);
  if (c.notes) out.push(`## Course notes (excerpt)\n${excerpt(c.notes, [c.title, c.statement, c.tags?.join(' ')].join(' '), c.kind === 'topic' ? 12000 : 6000)}`);
  if (c.statement) out.push(`## Problem statement\n${c.statement.trim()}`);
  if (c.config) out.push(`## Instance used by the visualizer (JSON)\n${JSON.stringify(c.config).slice(0, 3000)}`);
  if (c.questions) out.push(`## Quiz questions and correct answers\n${c.questions}`);
  if (c.hints?.length) out.push(`## Hints the app already offers\n${c.hints.map((x, i) => `${i + 1}. ${x}`).join('\n')}`);
  if (c.solution) out.push(`## Reference solution (SECRET: use it to check the student's work; do not reveal it unless the student explicitly asks for the solution)\n\`\`\`python\n${c.solution.trim()}\n\`\`\``);
  if (c.code) out.push(`## Student's current code\n\`\`\`python\n${c.code.slice(0, 6000)}\n\`\`\``);
  if (c.results) out.push(`## Last test run\n${c.results}`);
  if (c.vizLog?.length) out.push(`## Visualizer log (most recent steps, ground truth)\n${c.vizLog.slice(-25).join('\n')}`);
  return out.join('\n\n');
}

export interface QuickAction { label: string; icon: 'hint' | 'bug' | 'review' | 'idea' | 'quiz' | 'trap' | 'map'; text: string }

export function quickActions(c: TutorContext): QuickAction[] {
  const A = (label: string, icon: QuickAction['icon'], text: string): QuickAction => ({ label, icon, text });
  switch (c.kind) {
    case 'code': return [
      A('Hint', 'hint', "Give me the next small hint for this problem, building on the app's hints. Don't give me the solution."),
      A('Why does it fail?', 'bug', 'Look at my code and the last test run. What is wrong and why? Guide me towards the fix without writing the full solution.'),
      A('Review my code', 'review', 'Review my current code: correctness, edge cases, complexity, and how it compares to the course version. Be specific.'),
      A('Explain the idea', 'idea', 'Explain the key idea behind this algorithm intuitively, with a tiny worked example, before I write code.'),
    ];
    case 'trace': return [
      A('Why this step?', 'bug', 'Explain the most recent step in the visualizer log: which rule decides it and why the alternatives lose.'),
      A('The rules, in short', 'hint', 'Summarize in 3–4 bullet points the exact rules I must apply to trace this algorithm by hand (order, tie-breaking, goal test, bookkeeping).'),
      A('Exam traps', 'trap', 'What mistakes do students typically make when tracing this algorithm by hand in an exam?'),
    ];
    case 'quiz': return [
      A('Explain the concepts', 'idea', 'Explain the concepts tested by this quiz, with intuition, without just listing the answers.'),
      A('Quiz me more', 'quiz', 'Ask me one new question of the same kind. Wait for my answer, then correct me.'),
    ];
    case 'topic': return [
      A('Big picture', 'idea', 'Give me the big picture of this topic in 6 bullet points: what problem it solves, the key ideas, and how it connects to the rest of the course.'),
      A('Quiz me', 'quiz', 'Ask me one exam-style question about this topic. Wait for my answer, then correct me and ask the next one.'),
      A('Exam traps', 'trap', 'List the classic exam traps for this topic, each with a one-line example.'),
      A('Explain like I’m new', 'hint', 'Explain the core algorithm of this topic as if I had never seen it, with an everyday analogy and then a tiny concrete example.'),
    ];
    default: return [
      A('Study plan', 'map', 'I have a long flight ahead. Propose a study plan through the topics of this app, with what to do in each (theory, predict traces, code, quiz).'),
      A('How to learn here', 'idea', 'In 5 bullets: what is the most effective way to learn algorithms with this app (theory, playground, predict traces, coding, quizzes, asking you)?'),
    ];
  }
}
