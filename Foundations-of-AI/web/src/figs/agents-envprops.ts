// Properties of task environments (slides p. 27–29, AIMA Fig. 2.6): pick a task (or set the properties yourself) and see which
// of the course's techniques assume that kind of environment.
import { card, md, s, style, type FigOptions } from './shell';

const PROPS: [string, string[]][] = [['Observable', ['Fully', 'Partially']], ['Agents', ['Single', 'Multi']], ['Deterministic', ['Deterministic', 'Stochastic']],
  ['Episodic', ['Episodic', 'Sequential']], ['Static', ['Static', 'Semi', 'Dynamic']], ['Discrete', ['Discrete', 'Continuous']]];
const HARD = ['Partially', 'Multi', 'Stochastic', 'Sequential', 'Dynamic', 'Continuous'];
// Fig. 2.6 (slides p. 29), one row per task, with the reason for each value
const TASKS: [string, string, string[]][] = [
  ['Crossword puzzle', 'F S D Q St Di', ['the whole grid and every clue are in view', 'nobody else plays', 'writing a word has a sure result',
    'each word constrains the crossing ones', 'the grid waits while you think', 'letters and squares are finite']],
  ['Chess with a clock', 'F M D Q Se Di', ['the board shows everything', 'an opponent: its win is your loss', 'a move has a sure result',
    'every move shapes the rest of the game', 'the board waits but the clock runs: semidynamic', 'squares, pieces and moves are finite']],
  ['Poker', 'P M S Q St Di', ["the opponents' cards are hidden", 'opponents bet against you', 'the deck is shuffled',
    'bets in one round shape the next', 'nothing changes while you decide', 'cards and bets are finite']],
  ['Backgammon', 'F M S Q St Di', ['the board and the dice are in view', 'an opponent', 'dice decide which moves are possible',
    'every move shapes the rest of the game', 'nothing changes while you decide', 'points and moves are finite']],
  ['Taxi driving', 'P M S Q Dy C', ["other drivers' intentions, blind spots", 'other cars and pedestrians', 'traffic and road grip are unpredictable',
    'every manoeuvre shapes what follows', 'traffic moves while it decides', 'speed, position, steering are real-valued']],
  ['Medical diagnosis', 'P S S Q Dy C', ['the disease inside the patient is hidden', 'only the diagnosing system is an agent here', 'the same treatment can end differently',
    'tests and treatments affect later decisions', 'the patient changes meanwhile', 'symptoms, doses and time are real-valued']],
  ['Image analysis', 'F S D E Se C', ['the whole image is given', 'nobody else acts', 'analysing does not change the image',
    'each image is judged on its own', 'the image stays still, but slow answers score less: semidynamic', 'intensities and positions are real-valued']],
  ['Part-picking robot', 'P S S E Dy C', ['the camera sees only part of the scene', 'no other agents', 'parts slip, grasps fail',
    'each part is picked on its own', 'the conveyor keeps moving', 'joint angles and positions are real-valued']],
  ['Refinery controller', 'P S S Q Dy C', ['the inside of the pipes is known only through sensors', 'one controller; operators are part of the environment', 'reactions vary',
    "today's settings shape tomorrow's product", 'the process runs while it decides', 'temperatures, pressures, flows are real-valued']],
  ['English tutor', 'P M S Q Dy Di', ['what the student knows is hidden', 'the students act too', 'answers are unpredictable',
    'each lesson builds on the previous ones', 'students change while it plans', 'exercises and answers are discrete']],
];
const CODE: Record<string, string> = { F: 'Fully', P: 'Partially', S: 'Single', M: 'Multi', D: 'Deterministic', E: 'Episodic', Q: 'Sequential',
  St: 'Static', Se: 'Semi', Dy: 'Dynamic', Di: 'Discrete', C: 'Continuous' };
const profile = (codes: string) => codes.split(' ').map((x, k) => (k === 1 && x === 'S' ? 'Single' : k === 2 && x === 'S' ? 'Stochastic' : CODE[x]));
// what each technique of the course assumes (formulation p. 69, adversarial p. 339, planning AIMA §11.1, the wumpus world, BNs)
const TECH: [string, Record<number, string[]>][] = [
  ['Search: BFS, UCS, A*', { 0: ['Fully'], 1: ['Single'], 2: ['Deterministic'], 3: ['Sequential'], 4: ['Static'], 5: ['Discrete'] }],
  ['CSP, local search', { 0: ['Fully'], 1: ['Single'], 2: ['Deterministic'], 4: ['Static'], 5: ['Discrete'] }],
  ['Minimax, α–β', { 0: ['Fully'], 1: ['Multi'], 2: ['Deterministic'], 3: ['Sequential'], 4: ['Static', 'Semi'], 5: ['Discrete'] }],
  ['Expectiminimax', { 0: ['Fully'], 1: ['Multi'], 2: ['Stochastic'], 3: ['Sequential'], 4: ['Static', 'Semi'], 5: ['Discrete'] }],
  ['MCTS', { 0: ['Fully'], 1: ['Multi'], 3: ['Sequential'], 4: ['Static', 'Semi'], 5: ['Discrete'] }],
  ['Q-learning (tabular)', { 0: ['Fully'], 3: ['Sequential'], 5: ['Discrete'] }],
  ['Logical agent (KB)', { 1: ['Single'], 2: ['Deterministic'], 4: ['Static'], 5: ['Discrete'] }],
  ['Classical planning', { 0: ['Fully'], 1: ['Single'], 2: ['Deterministic'], 3: ['Sequential'], 4: ['Static'], 5: ['Discrete'] }],
  ['Bayesian networks', { 0: ['Partially'] }],
];
const misfit = (p: string[], req: Record<number, string[]>) => Object.keys(req).map(Number).find(k => !req[k].includes(p[k]));
const PX = 266, PWALL = 204, TX = 486, TY = 50;

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-age-css', CSS);
  const c = card(el, 'interactive', 'Task environments: what each one is like, and which technique fits', '0 0 780 318');
  let sel = 2, prof = profile(TASKS[2][1]);
  s(c.svg, 'text', { x: 14, y: 26, class: 'fg-t' }, 'Task (Fig. 2.6)');
  s(c.svg, 'text', { x: 180, y: 26, class: 'fg-t' }, 'Properties (click to change)');
  s(c.svg, 'text', { x: TX, y: 26, class: 'fg-t' }, 'Course techniques that assume it');
  const tasks = TASKS.map(([name], i) => {
    const g = s(c.svg, 'g', { class: 'age-task', tabindex: 0, role: 'button' });
    s(g, 'rect', { x: 8, y: TY + i * 25 - 15, width: 158, height: 22, rx: 6 });
    s(g, 'text', { x: 16, y: TY + i * 25 }, name);
    g.onclick = () => pick(i);
    g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(i); } };
    return g;
  });
  const pills = PROPS.map(([name, vals], k) => {
    const y = TY + k * 40;
    s(c.svg, 'text', { x: 180, y, class: 'fg-m' }, name);
    const w = (PWALL - 4 * (vals.length - 1)) / vals.length;
    return vals.map((v, j) => {
      const g = s(c.svg, 'g', { class: 'age-pill', tabindex: 0, role: 'button' });
      s(g, 'rect', { x: PX + j * (w + 4), y: y - 15, width: w, height: 22, rx: 11 });
      s(g, 'text', { x: PX + j * (w + 4) + w / 2, y }, v);
      g.onclick = () => setProp(k, v);
      g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProp(k, v); } };
      return g;
    });
  });
  const hardTxt = s(c.svg, 'text', { x: 180, y: TY + 6 * 40 - 4, class: 'fg-m' });
  const hardBar = [0, 1, 2, 3, 4, 5].map(k => s(c.svg, 'rect', { x: 180 + k * 46, y: TY + 6 * 40 + 4, width: 42, height: 8, rx: 4, class: 'age-hb' }));
  const techs = TECH.map(([name], i) => {
    const y = TY + i * 27;
    s(c.svg, 'text', { x: TX, y, class: 'age-tn' }, name);
    return s(c.svg, 'text', { x: 772, y, class: 'age-v', 'text-anchor': 'end' });
  });

  function pick(i: number) { sel = i; prof = profile(TASKS[i][1]); render(true); }
  function setProp(k: number, v: string) {
    prof = prof.map((x, j) => (j === k ? v : x));
    sel = TASKS.findIndex(t => profile(t[1]).every((x, j) => x === prof[j]));
    render(true);
  }
  function render(said: boolean) {
    tasks.forEach((g, i) => g.classList.toggle('on', i === sel));
    pills.forEach((row, k) => row.forEach((g, j) => g.classList.toggle('on', PROPS[k][1][j] === prof[k])));
    const hard = prof.filter(x => HARD.includes(x)).length;
    hardBar.forEach((b, k) => b.classList.toggle('on', k < hard));
    hardTxt.textContent = `on the hard side: ${hard} of 6`;
    const fits: string[] = [];
    TECH.forEach(([name, req], i) => {
      const bad = misfit(prof, req);
      techs[i].textContent = bad === undefined ? '✓ fits' : `✗ ${prof[bad].toLowerCase()}`;
      techs[i].classList.toggle('ok', bad === undefined);
      if (bad === undefined) fits.push(name);
    });
    const desc = prof.map((v, k) => `**${v.toLowerCase()}**${k === 0 ? ' observable' : k === 1 ? '-agent' : ''}` + (sel >= 0 ? `: ${TASKS[sel][2][k]}` : ''));
    const text = (sel >= 0 ? `**${TASKS[sel][0]}** (slides p. 29) is ` : '**Your environment** (not in Fig. 2.6) is ') + desc.join('; ') + '. ' +
      (fits.length ? `It meets the assumptions of: **${fits.join(', ')}**. ` : '**None** of the course techniques assumes this environment as it is. ') +
      (prof[3] === 'Episodic' ? 'Episodic means each decision stands alone: there is no sequence of actions to plan, so the search-based chapters have nothing to look ahead for. ' : '') +
      (hard === 6 ? 'Every property is on the hard side: this is the real world: taxi driving is the textbook example (only its rules are mostly known). '
        : hard === 0 ? 'Every property is on the easy side: the world of search, CSPs and planning. ' : '') +
      'Known vs unknown (are the rules given?) is not in the table: unknown rules call for learning (Q-learning).';
    c.cap.innerHTML = md(text);
    if (said) opts.onEvent?.(`[${c.title}] ${c.cap.textContent}`);
  }
  render(false);
  return { destroy() {} };
}

const CSS = `
.age-task,.age-pill{cursor:pointer}
.age-task rect{fill:transparent;transition:fill .2s}
.age-task text{font-size:13px;fill:var(--text-2)}
.age-task:hover rect{fill:var(--panel-2)}
.age-task.on rect{fill:var(--accent-soft);stroke:var(--accent)}
.age-task.on text{fill:var(--text);font-weight:650}
.age-pill rect{fill:var(--panel-2);stroke:var(--border);transition:fill .2s,stroke .2s}
.age-pill text{font-size:11.5px;fill:var(--muted);text-anchor:middle}
.age-pill:hover rect{stroke:var(--border-strong)}
.age-pill.on rect{fill:var(--accent);stroke:var(--accent)}
.age-pill.on text{fill:#fff;font-weight:600}
.age-task:focus,.age-pill:focus{outline:none}
.age-task:focus-visible rect,.age-pill:focus-visible rect{stroke:var(--accent);stroke-width:2}
.age-hb{fill:var(--panel-3);transition:fill .2s}
.age-hb.on{fill:var(--warn)}
.age-tn{font-size:12.5px;fill:var(--text-2)}
.age-v{font:600 11px var(--mono);fill:var(--bad)}
.age-v.ok{fill:var(--ok)}
`;
