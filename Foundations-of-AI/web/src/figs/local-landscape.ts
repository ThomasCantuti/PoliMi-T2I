// The state-space landscape (AIMA Figure 4.1, slides p. 331): static figure.
import { arrow, card, md, s, style } from './shell';

const CURVE = 'M20,240 C60,235 90,175 120,170 L190,170 C225,170 250,40 300,40 C350,40 360,190 390,190 C420,190 440,110 470,110 ' +
  'C500,110 515,180 540,180 C560,180 570,150 590,150 L660,150 C690,150 720,230 760,240';

export function mount(el: HTMLElement) {
  style('fig-ls-css', CSS);
  const c = card(el, 'figure', 'The state-space landscape (AIMA Figure 4.1)', '0 0 780 300');
  const ah = arrow(c.svg);
  s(c.svg, 'path', { class: 'ls-axis', d: 'M20,20 L20,262 L765,262' });
  s(c.svg, 'text', { x: 28, y: 30, class: 'fg-m' }, 'objective function');
  s(c.svg, 'text', { x: 765, y: 282, class: 'fg-m', 'text-anchor': 'end' }, 'state space →');
  s(c.svg, 'path', { class: 'ls-fill', d: CURVE + ' L760,262 L20,262 Z' });
  s(c.svg, 'path', { class: 'ls-curve', d: CURVE });
  for (const [x, y, t] of [[300, 28, 'global maximum'], [155, 160, 'shoulder'], [470, 98, 'local maximum'], [625, 138, '"flat" local maximum']] as const)
    s(c.svg, 'text', { x, y, class: 'fg-t', 'text-anchor': 'middle' }, t);
  s(c.svg, 'line', { x1: 430, y1: 150, x2: 430, y2: 262, class: 'ls-tick' });
  s(c.svg, 'text', { x: 430, y: 280, class: 'fg-t', 'text-anchor': 'middle' }, 'current state');
  s(c.svg, 'path', { class: 'ls-arrow', d: 'M436,140 Q448,116 462,112', 'marker-end': ah });
  s(c.svg, 'circle', { cx: 430, cy: 150, r: 7, class: 'ls-dot' });
  c.cap.innerHTML = md('From the **current state** every uphill step leads to the **local maximum**: hill climbing stops there and ' +
    'never sees the global maximum. On the **shoulder** and on the **"flat" local maximum** no neighbor is better, so it stops too, ' +
    'unless sideways moves are allowed (they help on the shoulder, not on the flat maximum).');
  return { destroy() {} };
}

const CSS = `
.ls-curve{fill:none;stroke:var(--accent);stroke-width:3}
.ls-fill{fill:var(--accent-soft)}
.ls-axis{fill:none;stroke:var(--border-strong);stroke-width:1.5}
.ls-tick{stroke:var(--muted);stroke-dasharray:3 3}
.ls-arrow{fill:none;stroke:var(--warn);stroke-width:2}
.ls-dot{fill:var(--warn);stroke:var(--panel);stroke-width:2.5}
`;
