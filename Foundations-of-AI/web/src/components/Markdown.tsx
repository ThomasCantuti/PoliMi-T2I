import { useEffect, useMemo, useRef } from 'react';
import { renderMarkdown } from '../lib/markdown';
import type { FigModule } from '../figs/shell';
import type { VizInstance } from '../viz/types';
import { cn } from './ui';

const figs = import.meta.glob<FigModule>(['../figs/*.ts', '!../figs/shell.ts']);

/** Rendered markdown (KaTeX + highlighted Python + callouts + ```fig``` figures). `safe` escapes raw HTML (LLM output).
 *  `onEvent` receives one line per figure step (forwarded to the tutor). */
export function Markdown({ text, safe, className, inline, onEvent }: { text: string; safe?: boolean; className?: string; inline?: boolean; onEvent?: (text: string) => void }) {
  const html = useMemo(() => {
    const out = renderMarkdown(text, safe);
    return inline ? out.replace(/^<p>|<\/p>\n?$/g, '') : out;
  }, [text, safe, inline]);
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onEvent);
  cb.current = onEvent;
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
    const live: VizInstance[] = [];
    let dead = false;
    for (const el of ref.current?.querySelectorAll<HTMLElement>('.fig-mount') ?? []) {
      figs[`../figs/${el.dataset.fig}.ts`]?.().then(m => {
        if (!dead) live.push(m.mount(el, { onEvent: t => cb.current?.(t) }));
      });
    }
    return () => { dead = true; live.forEach(f => f.destroy()); };
  }, [html]);
  return <div ref={ref} className={cn('md', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
