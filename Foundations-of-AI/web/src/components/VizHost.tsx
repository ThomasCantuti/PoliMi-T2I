import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { VizModule, VizMode, VizResult } from '../viz/types';
import { Empty } from './ui';

const modules = import.meta.glob<VizModule<unknown>>(['../viz/*.ts', '!../viz/types.ts']);

export function loadViz(name: string): Promise<VizModule<unknown>> | null {
  return modules[`../viz/${name}.ts`]?.() ?? null;
}

interface Props {
  name: string;
  config: unknown;
  mode: VizMode;
  onEvent?: (text: string) => void;
  onDone?: (r: VizResult) => void;
}

/** Mounts a framework-agnostic visualizer module. Change `key` to restart it. */
export function VizHost({ name, config, mode, onEvent, onDone }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const cb = useRef({ onEvent, onDone });
  cb.current = { onEvent, onDone };
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const load = loadViz(name);
    if (!load) { setMissing(true); return; }
    let inst: { destroy(): void } | undefined, dead = false;
    load.then(m => {
      if (dead || !el.current) return;
      el.current.innerHTML = '';
      inst = m.mount(el.current, structuredClone(config), {
        mode,
        onEvent: t => cb.current.onEvent?.(t),
        onDone: r => cb.current.onDone?.(r),
      });
    });
    return () => { dead = true; inst?.destroy(); };
  }, [name, config, mode]);

  if (missing) return <Empty icon={Play}>The <code>{name}</code> visualizer isn't available yet.</Empty>;
  return <div ref={el} className="viz-host" />;
}
