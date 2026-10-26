// Shared shell of the theory figures (see README.md): a card with a title, an SVG and a caption; steppers add the controls.
import { renderMarkdown } from '../lib/markdown';
import type { VizInstance } from '../viz/types';

export interface FigOptions { onEvent?: (text: string) => void }
export interface FigModule { mount(el: HTMLElement, opts?: FigOptions): VizInstance }
export interface Frame { cap: string; group?: string } // cap: markdown with $math$; group: label of a run of frames (dots gap)
export interface Card { root: HTMLElement; svg: SVGSVGElement; cap: HTMLElement; title: string }

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

export function s<K extends keyof SVGElementTagNameMap>(parent: Element, tag: K, attrs: Record<string, string | number> = {}, text?: string): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (text !== undefined) e.textContent = text;
  parent.append(e);
  return e;
}

/** SVG text where `_{…}` is written as a subscript. */
export function label(parent: Element, x: number, y: number, str: string, attrs: Record<string, string | number> = {}) {
  const t = s(parent, 'text', { x, y, ...attrs });
  for (const [i, part] of str.split(/_\{([^}]*)\}/).entries())
    if (part) s(t, 'tspan', i % 2 ? { dy: 4, 'font-size': '.75em' } : { dy: i ? -4 : 0 }, part);
  return t;
}

/** An arrowhead marker that takes the color of its line; returns the value for `marker-end`. */
export function arrow(svg: SVGSVGElement): string {
  const id = `fg-ah${++uid}`;
  const m = s(s(svg, 'defs'), 'marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' });
  s(m, 'path', { d: 'M0,0 L10,5 L0,10 z', fill: 'context-stroke' });
  return `url(#${id})`;
}

export const num = (x: number, p = 6) => String(+x.toPrecision(p));
export const md = (t: string) => renderMarkdown(t).replace(/^<p>|<\/p>\n?$/g, '');

export function style(id: string, css: string) {
  if (document.getElementById(id)) return;
  const st = document.createElement('style');
  st.id = id;
  st.textContent = css;
  document.head.append(st);
}

/** The empty card: header with tag + title; `body` is its inner HTML after the header. */
export function box(el: HTMLElement, tag: string, title: string, body: string): HTMLElement {
  style('fig-css', CSS);
  el.classList.add('on');
  const root = document.createElement('div');
  root.className = 'fg';
  root.innerHTML = '<div class="fg-h"><span class="fg-tag"></span><span></span></div>' + body;
  const [tg, tt] = root.querySelectorAll('.fg-h span');
  tg.textContent = tag;
  tt.textContent = title;
  el.append(root);
  return root;
}

export function card(el: HTMLElement, tag: 'figure' | 'stepper' | 'interactive', title: string, viewBox: string): Card {
  const root = box(el, tag, title, '<div class="fg-sv"></div><div class="fg-c"></div>');
  const svg = s(root.querySelector('.fg-sv')!, 'svg', { viewBox, 'aria-hidden': 'true' });
  return { root, svg, cap: root.querySelector('.fg-c')!, title };
}

/** Wires ⏮ ◀ ▶ play, dots and ←/→/space to `frames`; `show` redraws the SVG for a frame. */
export function stepper<F extends Frame>(c: Card, frames: F[], show: (f: F, i: number) => void, opts: FigOptions = {}): VizInstance {
  const bar = document.createElement('div');
  bar.className = 'fg-bar';
  bar.innerHTML = '<button class="btn sm" title="First (Home)">⏮</button><button class="btn sm" title="Previous (←)">◀</button>' +
    '<button class="btn sm" title="Next (→)">▶</button><button class="btn sm" title="Play / pause (space)">⏵ play</button>' +
    '<span class="fg-sp"></span><span class="fg-dots"></span><span class="fg-n"></span>';
  c.root.append(bar);
  c.root.tabIndex = 0;
  const [first, prev, next, play] = bar.querySelectorAll('button');
  const n = bar.querySelector('.fg-n')!;
  const dots = frames.map((f, i) => {
    const d = document.createElement('i');
    if (i && f.group !== frames[i - 1].group) d.className = 'gap';
    d.title = f.group ?? '';
    d.onclick = () => { stop(); go(i); };
    bar.querySelector('.fg-dots')!.append(d);
    return d;
  });
  let at = 0, timer = 0;
  function go(i: number, quiet = false) {
    at = Math.max(0, Math.min(frames.length - 1, i));
    show(frames[at], at);
    c.cap.innerHTML = md(frames[at].cap);
    n.textContent = `${at}/${frames.length - 1}`;
    dots.forEach((d, k) => { d.classList.toggle('now', k === at); d.classList.toggle('done', k < at); });
    first.disabled = prev.disabled = at === 0;
    next.disabled = at === frames.length - 1;
    if (!quiet) opts.onEvent?.(`[${c.title}] frame ${at}/${frames.length - 1}: ${frames[at].cap}`);
    if (at === frames.length - 1) stop();
  }
  function stop() { clearInterval(timer); timer = 0; play.textContent = '⏵ play'; }
  function toggle() {
    if (timer) return stop();
    if (at === frames.length - 1) go(0);
    play.textContent = '⏸ pause';
    timer = window.setInterval(() => go(at + 1), 1600);
  }
  first.onclick = () => { stop(); go(0); };
  prev.onclick = () => { stop(); go(at - 1); };
  next.onclick = () => { stop(); go(at + 1); };
  play.onclick = toggle;
  c.root.addEventListener('keydown', e => {
    if (e.target !== c.root) return;
    if (e.key === 'ArrowRight') { stop(); go(at + 1); }
    else if (e.key === 'ArrowLeft') { stop(); go(at - 1); }
    else if (e.key === 'Home') { stop(); go(0); }
    else if (e.key === ' ') toggle();
    else return;
    e.preventDefault();
  });
  go(0, true);
  return { destroy: stop };
}

const CSS = `
.fig-mount{margin:1.3em 0}
.fig-mount.on>.fig-alt{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.fg{background:var(--panel);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.fg:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.fg-h{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--border);background:var(--panel-2);font-size:13px;font-weight:600;line-height:1.4}
.fg-tag{font-size:11px;font-weight:600;padding:1px 8px;border-radius:99px;background:var(--accent-soft);color:var(--accent);flex:none}
.fg-sv{overflow-x:auto}
.fg-pg{padding:12px 14px}
.fg-sv svg{display:block;width:100%;min-width:440px;height:auto;font-family:var(--font)}
.fg-c{padding:10px 14px 12px;font-size:13.5px;line-height:1.6;color:var(--text-2);min-height:3.8em;border-top:1px solid var(--border)}
.fg-c strong{color:var(--text)}
.fg-c .katex{font-size:1em}
.fg-c .yes{color:var(--ok)}
.fg-c .no{color:var(--bad)}
.fg-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 14px;border-top:1px solid var(--border)}
.fg-sp{flex:1}
.fg-dots{display:flex;gap:4px;flex-wrap:wrap}
.fg-dots i{width:8px;height:8px;border-radius:50%;background:var(--panel-3);cursor:pointer;transition:background .2s,transform .2s}
.fg-dots i.gap{margin-left:7px}
.fg-dots i.done{background:var(--v-explored)}
.fg-dots i.now{background:var(--accent);transform:scale(1.35)}
.fg-n{font:12px var(--mono);color:var(--muted);min-width:44px;text-align:right}
.fg-t{font-size:13px;fill:var(--text-2)}
.fg-m{font-size:11.5px;fill:var(--muted)}
.fg-v{font:600 15px var(--mono);fill:var(--muted);transition:fill .3s}
.fg-v.ok{fill:var(--ok)}
.fg-h2{font-size:15px;font-weight:650;fill:var(--text)}
.fg-cell{fill:var(--panel-2);stroke:var(--border)}
.fg-wall{fill:var(--panel-3);stroke:var(--border)}
.fg-goal{fill:var(--ok-soft);stroke:var(--ok)}
.fg-nd rect{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2;transition:fill .25s,stroke .25s}
.fg-nd text{font-size:13px;font-weight:600;fill:var(--text);text-anchor:middle;pointer-events:none}
.fg-nd.cur rect{fill:var(--accent-soft);stroke:var(--accent)}
.fg-nd.obs rect{fill:var(--accent);stroke:var(--accent)}
.fg-nd.obs text{fill:#fff}
.fg-nd.end rect{stroke:var(--warn);stroke-width:3}
.fg-nd:focus{outline:none}
.fg-nd:focus-visible rect{stroke:var(--accent);stroke-width:3}
.fg-nd,.fg-e{transition:opacity .3s}
.fg-e{stroke:var(--v-edge);stroke-width:2;fill:none;transition:stroke .25s,stroke-width .25s,opacity .3s}
.fg-e.cur{stroke:var(--accent);stroke-width:3}
.fg-e.act{stroke:var(--ok);stroke-width:3.5}
.fg-e.blk{stroke:var(--bad);stroke-width:3.5;stroke-dasharray:7 5}
.fg .hide{opacity:0}
`;
