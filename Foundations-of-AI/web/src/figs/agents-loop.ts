// Agents and environments (AIMA Fig. 2.1, slides p. 20–23): static figure.
import { arrow, card, label, md, s, style } from './shell';

export function mount(el: HTMLElement) {
  style('fig-al-css', '.al-box{fill:none;stroke:var(--border-strong);stroke-dasharray:6 5}.al-env{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:2}' +
    '.al-ttl{font-size:13px;font-weight:700;fill:var(--text-2)}');
  const c = card(el, 'figure', 'An agent perceives through sensors and acts through actuators', '0 0 680 250');
  const ah = arrow(c.svg);
  s(c.svg, 'rect', { x: 14, y: 14, width: 420, height: 222, rx: 14, class: 'al-box' });
  s(c.svg, 'text', { x: 30, y: 38, class: 'al-ttl' }, 'Agent');
  s(c.svg, 'rect', { x: 520, y: 14, width: 146, height: 222, rx: 14, class: 'al-env' });
  s(c.svg, 'text', { x: 593, y: 130, class: 'al-ttl', 'text-anchor': 'middle' }, 'Environment');
  const box = (x: number, y: number, w: number, name: string, sub?: string) => {
    const g = s(c.svg, 'g', { class: 'fg-nd' });
    s(g, 'rect', { x, y, width: w, height: sub ? 52 : 36, rx: 8 });
    s(g, 'text', { x: x + w / 2, y: y + 23 }, name);
    if (sub) s(c.svg, 'text', { x: x + w / 2, y: y + 42, class: 'fg-m', 'text-anchor': 'middle' }, sub);
  };
  box(310, 50, 110, 'Sensors');
  box(310, 170, 110, 'Actuators');
  box(40, 98, 190, 'Agent program', 'implements f: P* → A');
  s(c.svg, 'path', { class: 'fg-e', d: 'M518,68 L424,68', 'marker-end': ah });
  label(c.svg, 471, 58, 'percept p(t)', { class: 'fg-m', 'text-anchor': 'middle' });
  s(c.svg, 'path', { class: 'fg-e', d: 'M310,68 C260,68 240,90 236,104', 'marker-end': ah });
  s(c.svg, 'path', { class: 'fg-e', d: 'M236,146 C240,170 260,188 306,188', 'marker-end': ah });
  s(c.svg, 'path', { class: 'fg-e', d: 'M420,188 L516,188', 'marker-end': ah });
  s(c.svg, 'text', { x: 471, y: 178, class: 'fg-m', 'text-anchor': 'middle' }, 'action');
  c.cap.innerHTML = md('The **agent program** receives **one percept at a time** and must keep anything else it needs in persistent ' +
    'variables; the **agent function** $f$ maps whole percept **sequences** $P^\\ast$ to actions. The performance measure ' +
    'judges the resulting sequence of **environment** states.');
  return { destroy() {} };
}
