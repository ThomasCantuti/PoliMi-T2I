// Markdown → HTML with KaTeX math ($…$, $$…$$, \(…\), \[…\]), Python highlighting and callouts.
import { Marked, type MarkedExtension, type Tokens } from 'marked';
import katex from 'katex';
import { parser as pythonParser } from '@lezer/python';
import { highlightCode, classHighlighter } from '@lezer/highlight';

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function tex(src: string, displayMode: boolean) {
  try { return katex.renderToString(src.trim(), { displayMode, throwOnError: false, output: 'html' }); }
  catch { return esc(src); }
}

export function highlightPython(code: string): string {
  let out = '';
  highlightCode(code, pythonParser.parse(code), classHighlighter,
    (text, classes) => { out += classes ? `<span class="${classes}">${esc(text)}</span>` : esc(text); },
    () => { out += '\n'; });
  return out;
}

const CALLOUTS: [RegExp, string][] = [
  [/^(exam trap|trap|common mistake|warning|pitfall|careful)/i, 'trap'],
  [/^(key idea|remember|theorem|definition|rule)/i, 'key'],
  [/^(intuition|analogy|why)/i, 'intuition'],
  [/^(example|try it|note|tip)/i, 'note'],
];

interface MathToken { type: string; raw: string; text: string; display?: boolean }

const math: MarkedExtension = {
  extensions: [
    {
      name: 'mathBlock', level: 'block',
      start: (s: string) => { const i = s.search(/\$\$|\\\[/); return i < 0 ? undefined : i; },
      tokenizer(src: string) {
        const m = /^\$\$([\s\S]+?)\$\$/.exec(src) ?? /^\\\[([\s\S]+?)\\\]/.exec(src);
        if (m) return { type: 'mathBlock', raw: m[0], text: m[1] };
      },
      renderer: t => `<div class="math-block">${tex((t as MathToken).text, true)}</div>`,
    },
    {
      name: 'mathInline', level: 'inline',
      start: (s: string) => { const i = s.search(/\$|\\\(/); return i < 0 ? undefined : i; },
      tokenizer(src: string) {
        let m = /^\$\$([\s\S]+?)\$\$/.exec(src);
        if (m) return { type: 'mathInline', raw: m[0], text: m[1], display: true };
        // Spaces inside the delimiters are allowed: LLMs often write `$ x $`.
        m = /^\$((?:\\.|[^\\$\n])+?)\$(?!\d)/.exec(src) ?? /^\\\(([\s\S]+?)\\\)/.exec(src);
        if (m) return { type: 'mathInline', raw: m[0], text: m[1] };
      },
      renderer: t => tex((t as MathToken).text, !!(t as MathToken).display),
    },
  ],
  renderer: {
    code({ text, lang }: Tokens.Code) {
      const l = (lang ?? '').trim().toLowerCase();
      const body = !l || l === 'python' || l === 'py' ? highlightPython(text) : esc(text);
      return `<pre><code>${body}</code></pre>\n`;
    },
    blockquote(this: { parser: { parse(t: Tokens.Blockquote['tokens']): string } }, { tokens }: Tokens.Blockquote) {
      const body = this.parser.parse(tokens);
      const lead = /^\s*<p><strong>([^<]*)<\/strong>/.exec(body)?.[1]?.trim() ?? '';
      const kind = CALLOUTS.find(([re]) => re.test(lead))?.[1];
      return `<blockquote${kind ? ` class="callout ${kind}"` : ''}>${body}</blockquote>\n`;
    },
  },
};

// ```fig <name>``` mounts web/src/figs/<name>.ts (Markdown.tsx); the body is its text alternative (screen readers, tutor, fallback).
// ```viz <visualizer>``` embeds a Playground preset (figs/playground.ts): first line = preset name, the rest = text alternative.
const figs: MarkedExtension = {
  renderer: {
    code({ text, lang }: Tokens.Code) {
      const m = /^(fig|viz)\s+([\w-]+)/.exec(lang ?? '');
      if (!m) return false;
      if (m[1] === 'fig') return `<div class="fig-mount" data-fig="${m[2]}"><p class="fig-alt">${esc(text)}</p></div>\n`;
      const [preset, ...alt] = text.split('\n');
      return `<div class="fig-mount" data-fig="playground" data-viz="${m[2]}" data-preset="${esc(preset.trim())}"><p class="fig-alt">${esc(alt.join('\n') || preset)}</p></div>\n`;
    },
  },
};

const trusted = new Marked({ gfm: true }, math, figs);
// LLM output: raw HTML is displayed as text.
const untrusted = new Marked({ gfm: true }, math, { renderer: { html: ({ text }: Tokens.HTML | Tokens.Tag) => esc(text) } });

export function renderMarkdown(text: string, safe = false): string {
  return (safe ? untrusted : trusted).parse(text ?? '', { async: false });
}
