// Dev harness for visualizers: http://127.0.0.1:5173/viz-dev.html?viz=search&preset=0&mode=predict
import './styles/tokens.css';
import type { VizInstance, VizModule, VizMode } from './viz/types';

const modules = import.meta.glob<VizModule<unknown>>('./viz/*.ts');

const css = document.createElement('style');
css.textContent = `
  body { padding: 16px; }
  #bar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
  #stage { max-width: 1100px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--panel); padding: 12px; }
  #log { font: 12px var(--mono); color: var(--muted); white-space: pre-wrap; max-height: 200px; overflow: auto; margin-top: 12px; }`;
document.head.append(css);

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const q = new URLSearchParams(location.search);
const name = q.get('viz') ?? 'search';
const loader = modules[`./viz/${name}.ts`];
if (!loader) throw new Error(`no visualizer src/viz/${name}.ts`);
const mod = await loader();

const sel = $<HTMLSelectElement>('preset');
const mode = $<HTMLSelectElement>('mode');
mod.PRESETS.forEach((p, i) => sel.add(new Option(p.name, String(i))));
sel.value = q.get('preset') ?? '0';
mode.value = q.get('mode') ?? 'explore';

let inst: VizInstance | undefined;
function go() {
  inst?.destroy();
  const stage = $('stage'), log = $('log');
  stage.innerHTML = '';
  log.textContent = '';
  $('done').textContent = '';
  const cfg = q.get('config') ? JSON.parse(q.get('config')!) : structuredClone(mod.PRESETS[+sel.value].config);
  inst = mod.mount(stage, cfg, {
    mode: mode.value as VizMode,
    onEvent: t => (log.textContent += t + '\n'),
    onDone: r => ($('done').textContent = `done: ${r.correct}/${r.total}`),
  });
}
sel.onchange = mode.onchange = go;
$('theme').onclick = () => {
  const r = document.documentElement;
  r.dataset.theme = r.dataset.theme === 'light' ? 'dark' : 'light';
};
go();
