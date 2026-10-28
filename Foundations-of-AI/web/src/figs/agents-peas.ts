// PEAS (slides p. 25–26, AIMA Figs. 2.4–2.5): pick an agent and see its Performance measure, Environment, Actuators and Sensors
// in place around the agent; "Quiz me" asks where a single entry belongs.
import { arrow, bar, card, md, s, style, type FigOptions } from './shell';

const CATS = ['Performance measure', 'Environment', 'Actuators', 'Sensors'];
const WHY = [
  'the performance measure is a **criterion** of success on the environment, defined by the designer; never a device',
  'the environment is what the agent lives in and acts upon',
  'actuators are how the agent acts; for a software agent: "display of …"',
  'sensors are how the agent perceives; for a software agent: "keyboard / entry of …"',
];
// slides p. 26 (Fig. 2.5), plus the automated taxi of Fig. 2.4; each cell split into its entries
const AGENTS: [string, string[][]][] = [
  ['Medical diagnosis', [['healthy patient', 'reduced costs'], ['patient', 'hospital', 'staff'],
    ['display of questions, tests, diagnoses, treatments'], ['touchscreen/voice entry of symptoms and findings']]],
  ['Satellite image analysis', [['correct categorization of objects, terrain'], ['orbiting satellite', 'downlink', 'weather'],
    ['display of scene categorization'], ['high-resolution digital camera']]],
  ['Part-picking robot', [['percentage of parts in correct bins'], ['conveyor belt with parts', 'bins'], ['jointed arm and hand'],
    ['camera', 'tactile sensors', 'joint angle sensors']]],
  ['Refinery controller', [['purity', 'yield', 'safety'], ['refinery', 'raw materials', 'operators'],
    ['valves', 'pumps', 'heaters', 'stirrers', 'displays'], ['temperature, pressure, flow, chemical sensors']]],
  ['Interactive English tutor', [["student's score on test"], ['set of students', 'testing agency'], ['display of exercises, feedback, speech'],
    ['keyboard entry', 'voice']]],
  ['Automated taxi', [['safe', 'fast', 'legal', 'comfortable trip', 'profit'], ['roads', 'traffic', 'pedestrians', 'customers'],
    ['steering', 'accelerator', 'brake', 'signal', 'horn', 'display'], ['cameras', 'GPS', 'speedometer', 'odometer', 'accelerometer', 'engine sensors']]],
];
// where each category is drawn: [x, y, width, height]
const BOX: [number, number, number, number][] = [[196, 236, 572, 58], [596, 12, 172, 208], [340, 140, 234, 80], [340, 12, 234, 80]];

/** Greedy word wrap to lines of at most `n` characters. */
function wrap(items: string[], n: number): string[] {
  const lines: string[] = [];
  for (const w of items.join(' · ').split(' ')) {
    if (lines.length && (lines[lines.length - 1] + ' ' + w).length <= n) lines[lines.length - 1] += ' ' + w;
    else lines.push(w);
  }
  return lines;
}

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-agp-css', CSS);
  const c = card(el, 'interactive', 'PEAS: the four things to specify before designing an agent', '0 0 780 302');
  const ah = arrow(c.svg);
  let sel = 0, quiz: { a: number; k: number; text: string } | null = null, right = 0, asked = 0, tries = 0;

  const list = AGENTS.map(([name], i) => {
    const g = s(c.svg, 'g', { class: 'agp-ag', tabindex: 0, role: 'button' });
    s(g, 'rect', { x: 8, y: 22 + i * 27 - 16, width: 172, height: 23, rx: 6 });
    s(g, 'text', { x: 16, y: 22 + i * 27 }, name);
    g.onclick = () => { quiz = null; sel = i; render(); opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`); };
    return g;
  });
  s(c.svg, 'rect', { x: 196, y: 6, width: 382, height: 222, rx: 12, class: 'agp-agent' });
  s(c.svg, 'text', { x: 208, y: 28, class: 'agp-ttl' }, 'Agent');
  const prog = s(c.svg, 'g', { class: 'fg-nd' });
  s(prog, 'rect', { x: 208, y: 94, width: 120, height: 44, rx: 8 });
  s(prog, 'text', { x: 268, y: 121 }, 'agent program');
  s(c.svg, 'path', { d: 'M594,52 L578,52', class: 'fg-e', 'marker-end': ah });
  s(c.svg, 'path', { d: 'M338,52 C300,52 270,70 268,90', class: 'fg-e', 'marker-end': ah });
  s(c.svg, 'path', { d: 'M268,142 C270,166 296,180 334,180', class: 'fg-e', 'marker-end': ah });
  s(c.svg, 'path', { d: 'M574,180 L592,180', class: 'fg-e', 'marker-end': ah });
  s(c.svg, 'path', { d: 'M682,222 L682,232', class: 'fg-e', 'marker-end': ah });

  const boxes = BOX.map(([x, y, w, h], k) => {
    const g = s(c.svg, 'g', { class: `agp-box agp-k${k}` });
    s(g, 'rect', { x, y, width: w, height: h, rx: 10 });
    s(g, 'text', { x: x + 10, y: y + 17, class: 'agp-cat' }, `${'PEAS'[k]} · ${CATS[k]}`);
    const body = s(g, 'text', { x: x + 10, y: y + 35, class: 'agp-body' });
    g.onclick = () => answer(k);
    return { g, body, w };
  });
  s(c.svg, 'text', { x: 758, y: 253, class: 'fg-m', 'text-anchor': 'end' }, 'judges the sequence of environment states ↑');
  const chip = s(c.svg, 'g', { class: 'agp-chip hide' });
  s(chip, 'rect', { x: 8, y: 186, width: 172, height: 106, rx: 10 });
  s(chip, 'text', { x: 18, y: 206, class: 'agp-cat' }, 'Where does it go?');
  const chipT = s(chip, 'text', { x: 18, y: 228, class: 'agp-body' });

  const ctl = bar(c);
  const qb = document.createElement('button');
  qb.className = 'btn sm primary';
  qb.textContent = 'Quiz me: where does it go?';
  qb.onclick = ask;
  const score = document.createElement('span');
  score.className = 'agp-score';
  ctl.append(qb, score);

  function ask() {
    const all = AGENTS.flatMap(([, cells], a) => cells.flatMap((items, k) => items.map(text => ({ a, k, text }))));
    let next = all[Math.floor(Math.random() * all.length)];
    while (quiz && next.text === quiz.text) next = all[Math.floor(Math.random() * all.length)];
    quiz = next;
    sel = next.a;
    tries = 0;
    render();
    c.cap.innerHTML = md(`**${AGENTS[sel][0]}:** where does **"${next.text}"** belong? Click the box.`);
  }
  function answer(k: number) {
    if (!quiz) return;
    const ok = k === quiz.k, q = quiz;
    if (!tries) { asked++; right += +ok; }
    tries++;
    const g = boxes[k].g;
    g.classList.remove('yes', 'no');
    void g.getBBox();
    g.classList.add(ok ? 'yes' : 'no');
    if (ok) quiz = null;
    render();
    const text = ok ? `**Right:** "${q.text}" is in **${CATS[q.k]}**: ${WHY[q.k]}.`
      : `**Not ${CATS[k]}:** ${WHY[k]}. Try another box.`;
    c.cap.innerHTML = md(text);
    opts.onEvent?.(`[${c.title}] quiz "${q.text}" (${AGENTS[q.a][0]}) → ${CATS[k]}: ${ok ? 'right' : 'wrong'}`);
  }
  function render() {
    list.forEach((g, i) => g.classList.toggle('on', i === sel));
    AGENTS[sel][1].forEach((items, k) => {
      const b = boxes[k], shown = quiz ? items.filter(t => t !== quiz!.text) : items;
      b.body.replaceChildren();
      const lines = wrap(shown.length ? shown : ['…'], Math.floor(b.w / 6.6) - 2), room = Math.floor((BOX[k][3] - 35) / 15) + 1;
      if (lines.length > room) console.error(`agents-peas: ${AGENTS[sel][0]} ${CATS[k]} needs ${lines.length} lines, room for ${room}`);
      lines.forEach((line, i) => s(b.body, 'tspan', { x: BOX[k][0] + 10, dy: i ? 15 : 0 }, line));
      b.g.classList.toggle('ask', !!quiz);
    });
    chip.classList.toggle('hide', !quiz);
    chipT.replaceChildren();
    if (quiz) wrap([`“${quiz.text}”`], 24).forEach((line, i) => s(chipT, 'tspan', { x: 18, dy: i ? 16 : 0 }, line));
    score.textContent = asked ? `right at the first try: ${right} of ${asked}` : '';
    if (!quiz) c.cap.innerHTML = md(`**${AGENTS[sel][0]}.** The performance measure (bottom) is a **criterion** that judges the sequence of ` +
      'environment states; the environment is what the agent acts upon; actuators and sensors are its "hands" and "eyes". ' +
      (sel === 0 || sel === 4 ? 'A **software agent**: its actuators are "display of …" and its sensors "entry of …". ' : '') +
      'Press **Quiz me** to drill it.');
  }
  render();
  return { destroy() {} };
}

const CSS = `
.agp-ag{cursor:pointer}
.agp-ag rect{fill:transparent;transition:fill .2s}
.agp-ag text{font-size:13px;fill:var(--text-2)}
.agp-ag:hover rect{fill:var(--panel-2)}
.agp-ag.on rect{fill:var(--accent-soft);stroke:var(--accent)}
.agp-ag.on text{fill:var(--text);font-weight:650}
.agp-ag:focus{outline:none}
.agp-ag:focus-visible rect{stroke:var(--accent);stroke-width:2}
.agp-agent{fill:none;stroke:var(--border-strong);stroke-dasharray:6 5}
.agp-ttl{font-size:13px;font-weight:700;fill:var(--text-2)}
.agp-box rect{fill:var(--panel-2);stroke:var(--v-node-stroke);stroke-width:1.5;transition:fill .3s,stroke .3s}
.agp-k0 rect{stroke-dasharray:6 4}
.agp-box.ask{cursor:pointer}
.agp-box.ask:hover rect{stroke:var(--accent);stroke-width:2.5}
.agp-box.yes rect{animation:agp-ok 1.2s ease-out}
.agp-box.no rect{animation:agp-no 1.2s ease-out}
@keyframes agp-ok{0%{fill:var(--ok-soft);stroke:var(--ok)}100%{}}
@keyframes agp-no{0%{fill:var(--bad-soft);stroke:var(--bad)}100%{}}
.agp-cat{font-size:11.5px;font-weight:700;fill:var(--accent)}
.agp-body{font-size:12px;fill:var(--text)}
.agp-chip rect{fill:var(--warn-soft);stroke:var(--warn)}
.agp-chip{transition:opacity .2s}
.agp-score{font:12px var(--mono);color:var(--muted);margin-left:6px}
`;
