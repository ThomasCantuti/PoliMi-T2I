// ```viz <visualizer>``` blocks: a Playground preset embedded in the theory, in explore mode (see README.md).
import { loadViz } from '../components/VizHost';
import type { VizInstance } from '../viz/types';
import { box, type FigOptions } from './shell';

export function mount(el: HTMLElement, opts: FigOptions = {}): VizInstance {
  const { viz = '', preset = '' } = el.dataset;
  let inst: VizInstance | undefined, dead = false;
  loadViz(viz)?.then(m => {
    const p = m.PRESETS.find(p => p.name === preset);
    if (dead || !p) return; // unknown preset: the text alternative stays visible
    const root = box(el, 'playground', preset, '<div class="fg-pg"></div>');
    inst = m.mount(root.querySelector<HTMLElement>('.fg-pg')!, structuredClone(p.config), { mode: 'explore', onEvent: t => opts.onEvent?.(`[${preset}] ${t}`) });
  });
  return { destroy() { dead = true; inst?.destroy(); } };
}
