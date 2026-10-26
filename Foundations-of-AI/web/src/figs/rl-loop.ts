// The reinforcement-learning loop (RL p. 13–17): static figure.
import { arrow, card, label, md, s } from './shell';

export function mount(el: HTMLElement) {
  const c = card(el, 'figure', 'The reinforcement-learning loop', '0 0 600 240');
  const ah = arrow(c.svg);
  for (const [x, name] of [[40, 'Agent'], [410, 'Environment']] as const) {
    const g = s(c.svg, 'g', { class: 'fg-nd' });
    s(g, 'rect', { x, y: 70, width: 150, height: 60, rx: 12 });
    s(g, 'text', { x: x + 75, y: 105 }, name);
  }
  s(c.svg, 'path', { class: 'fg-e cur', d: 'M115,68 C115,8 485,8 485,64', 'marker-end': ah });
  label(c.svg, 300, 52, 'action a_{t}', { class: 'fg-t', 'text-anchor': 'middle' });
  s(c.svg, 'path', { class: 'fg-e', d: 'M470,132 C470,188 130,188 130,138', 'marker-end': ah });
  label(c.svg, 300, 160, 'state s_{t+1}', { class: 'fg-t', 'text-anchor': 'middle' });
  s(c.svg, 'path', { class: 'fg-e', d: 'M505,132 C505,222 95,222 95,138', 'marker-end': ah });
  label(c.svg, 300, 224, 'reward r_{t+1}', { class: 'fg-t', 'text-anchor': 'middle' });
  s(c.svg, 'text', { x: 300, y: 108, class: 'fg-m', 'text-anchor': 'middle' }, 'then t ← t + 1');
  c.cap.innerHTML = md('At time $t$ the agent perceives $s_t$ and performs $a_t$; the environment moves to $s_{t+1}$ and ' +
    'gives the reward $r_{t+1}$. Then the loop repeats from $s_{t+1}$.');
  return { destroy() {} };
}
