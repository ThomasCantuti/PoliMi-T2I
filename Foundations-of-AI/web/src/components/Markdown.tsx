import { useEffect, useMemo, useRef } from 'react';
import { renderMarkdown } from '../lib/markdown';
import { cn } from './ui';

/** Rendered markdown (KaTeX + highlighted Python + callouts). `safe` escapes raw HTML (LLM output). */
export function Markdown({ text, safe, className, inline }: { text: string; safe?: boolean; className?: string; inline?: boolean }) {
  const html = useMemo(() => {
    const out = renderMarkdown(text, safe);
    return inline ? out.replace(/^<p>|<\/p>\n?$/g, '') : out;
  }, [text, safe, inline]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    for (const pre of ref.current?.querySelectorAll('pre') ?? []) {
      if (pre.querySelector('.copy')) continue;
      const b = document.createElement('button');
      b.className = 'copy';
      b.textContent = 'copy';
      b.onclick = () => {
        navigator.clipboard?.writeText(pre.querySelector('code')?.textContent ?? '');
        b.textContent = 'copied';
        setTimeout(() => (b.textContent = 'copy'), 1200);
      };
      pre.append(b);
    }
  }, [html]);
  return <div ref={ref} className={cn('md', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
