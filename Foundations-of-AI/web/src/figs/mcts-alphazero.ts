// The AlphaZero self-play loop (slides p. 473–477): stepper around the cycle network → MCTS → play → outcome → training → network.
// The p vs π bars are computed: a uniform p (an untrained network) and the visit counts of 200 MCTS iterations on a real position.
import { cell, empties, miniBoard, type Board } from './adv-ttt-tree';
import { mctsVisits } from './mcts-players';
import { mulberry32 } from './mcts-vs-minimax';
import { arrow, card, label, num, s, stepper, style, type FigOptions, type Frame } from './shell';

const POS: Board = 'X..OO.X..', ITERS = 200; // X to move must block at c2 (the MCTS visualizer's tic-tac-toe preset)
const BOX = {
  game: [20, 20, 170, 70], mcts: [250, 20, 170, 70], net: [470, 20, 150, 70], data: [20, 232, 260, 64], train: [330, 232, 290, 64],
} as const;
type Box = keyof typeof BOX;
const mid = (b: Box): [number, number] => [BOX[b][0] + BOX[b][2] / 2, BOX[b][1] + BOX[b][3] / 2];

interface F extends Frame { on: Box[]; arrows: number[]; bars: 0 | 1 | 2; at: Box }

export function mount(el: HTMLElement, opts: FigOptions = {}) {
  style('fig-mca-css', CSS);
  const c = card(el, 'stepper', 'AlphaZero: self-play with MCTS inside the training loop', '0 0 640 310');
  const ah = arrow(c.svg);
  const moves = empties(POS), visits = new Map(mctsVisits(POS, ITERS, mulberry32(7)));
  const pi = moves.map(m => (visits.get(m) ?? 0) / ITERS), p = moves.map(() => 1 / moves.length), top = moves[pi.indexOf(Math.max(...pi))];
  const scale = Math.max(0.5, ...pi); // the bar height of the tallest bar (or of 0.5)

  const boxes = {} as Record<Box, SVGGElement>;
  const TXT: Record<Box, [string, string]> = {
    game: ['self-play game', 's_{1}, s_{2}, …, s_{T}'], mcts: ['MCTS guided by f_{θ}', 'prior p, leaf value v'], net: ['network f_{θ}', 'f_{θ}(s) = (p, v)'],
    data: ['training data', '(s_{t}, π_{t}, z) for every t'], train: ['train θ', 'p → π,  v → z'],
  };
  (Object.keys(BOX) as Box[]).forEach(b => {
    const [x, y, w, h] = BOX[b], g = s(c.svg, 'g', { class: 'mca-box' });
    s(g, 'rect', { x, y, width: w, height: h, rx: 10 });
    label(g, x + w / 2, y + 28, TXT[b][0], { class: 'mca-t', 'text-anchor': 'middle' });
    label(g, x + w / 2, y + 50, TXT[b][1], { class: 'mca-s', 'text-anchor': 'middle' });
    boxes[b] = g;
  });
  // the loop: net → mcts → game → data → train → net
  const ARROWS: [string, string, number, number, string][] = [
    [`M${BOX.net[0]},55 L${BOX.mcts[0] + BOX.mcts[2] + 4},55`, 'p, v', 445, 47, 'middle'],
    [`M${BOX.mcts[0]},55 L${BOX.game[0] + BOX.game[2] + 4},55`, 'aₜ ~ πₜ', 220, 47, 'middle'],
    [`M100,${BOX.game[1] + BOX.game[3]} L100,${BOX.data[1] - 4}`, 'outcome z', 108, 166, 'start'],
    [`M${BOX.data[0] + BOX.data[2]},264 L${BOX.train[0] - 4},264`, '', 0, 0, 'start'],
    [`M560,${BOX.train[1]} L560,${BOX.net[1] + BOX.net[3] + 4}`, 'new θ', 568, 166, 'start'],
  ];
  const arrows = ARROWS.map(([d, t, x, y, anchor]) => {
    const e = s(c.svg, 'path', { d, class: 'mca-a', 'marker-end': ah });
    if (t) s(c.svg, 'text', { x, y, class: 'fg-m', 'text-anchor': anchor }, t);
    return e;
  });

  // p vs π for the position X..OO.X.. (between the rows)
  const CX = 260, CY = 112, CW = 170, CH = 80, bw = CW / moves.length;
  const chart = s(c.svg, 'g', { class: 'mca-chart' });
  miniBoard(chart, CX - 76, CY + 12, 60).set(POS);
  const pBars = moves.map((m, k) => {
    const x = CX + k * bw;
    s(chart, 'text', { x: x + bw / 2, y: CY + CH + 14, class: 'fg-m', 'text-anchor': 'middle' }, cell(m));
    return [s(chart, 'rect', { x: x + 4, width: bw / 2 - 5, class: 'mca-p' }), s(chart, 'rect', { x: x + bw / 2, width: bw / 2 - 5, class: 'mca-pi' })];
  });
  s(chart, 'line', { x1: CX, x2: CX + CW, y1: CY + CH, y2: CY + CH, class: 'mca-axis' });
  const keyP = s(chart, 'text', { x: CX + CW + 8, y: CY + 30, class: 'mca-kp' }, 'p (network)');
  const keyPi = s(chart, 'text', { x: CX + CW + 8, y: CY + 48, class: 'mca-kpi' }, 'π (search)');
  const token = s(c.svg, 'circle', { r: 9, class: 'mca-token' });

  const pct = (x: number) => num(x, 2);
  const FRAMES: F[] = [
    { on: ['net'], arrows: [], bars: 0, at: 'net', group: 'network',
      cap: '**The network** $f_\\theta$ reads the raw board $s$ (and its history) and outputs $\\mathbf p$, one probability per move ($p_a = \\Pr(a \\mid s)$), ' +
        'and $v$, the estimated probability that the player to move wins. No hand-written features, no evaluation function.' },
    { on: ['net'], arrows: [], bars: 1, at: 'net', group: 'network',
      cap: `**At the start θ is random.** On this position (X to move, O threatens c2) an untrained network knows nothing: say $\\mathbf p$ is uniform, ${pct(p[0])} on each of the ${moves.length} moves.` },
    { on: ['net', 'mcts'], arrows: [0], bars: 1, at: 'mcts', group: 'self-play',
      cap: '**In each position $s_t$ of a self-play game an MCTS is run, guided by $f_\\theta$:** selection prefers moves with a high prior $p_a$, and a new leaf is evaluated by $v$ ' +
        'instead of a random rollout.' },
    { on: ['mcts'], arrows: [0], bars: 2, at: 'mcts', group: 'self-play',
      cap: `**The search outputs $\\pi_t$**, the root's visit counts normalized. Here ${ITERS} iterations of this chapter's MCTS (random playouts standing in for $v$) give ` +
        moves.map((m, k) => `${cell(m)} ${pct(pi[k])}`).join(', ') + `: the search concentrates on **${cell(top)}**, the block, which $\\mathbf p$ did not know. ` +
        '**MCTS is a policy improvement operator**: $\\pi$ is a much stronger policy than $\\mathbf p$.' },
    { on: ['mcts', 'game'], arrows: [0, 1], bars: 2, at: 'game', group: 'self-play',
      cap: '**Play $a_t \\sim \\pi_t$** (sampled, so self-play games differ) and search again from $s_{t+1}$, with the same network, until the game ends at $s_T$.' },
    { on: ['game', 'data'], arrows: [2], bars: 0, at: 'data', group: 'training',
      cap: '**The outcome $z$** of the game ($+1$, $-1$ or $0$ for the player to move in $s_t$) is attached to every position: each step gives a training example $(s_t, \\pi_t, z)$.' },
    { on: ['data', 'train'], arrows: [3], bars: 0, at: 'train', group: 'training',
      cap: '**Train θ** (reinforcement learning) so that $\\mathbf p$ matches the search probabilities $\\pi$ and $v$ matches the outcome $z$: ' +
        'the loss $(z - v)^2 - \\pi^\\top \\log \\mathbf p$ (plus a regularization term) of the AlphaGo Zero paper. Lookahead search sits **inside** the training loop.' },
    { on: ['train', 'net'], arrows: [4], bars: 0, at: 'net', group: 'training',
      cap: '**Repeat with the new θ:** a better $\\mathbf p$ focuses the search, a better $v$ replaces the rollouts, and the stronger search produces better targets $\\pi$ for the next round. ' +
        'Option #4 of the four ways to build a player: once learned, no random rollouts are needed.' },
  ];

  return stepper(c, FRAMES, f => {
    (Object.keys(BOX) as Box[]).forEach(b => boxes[b].classList.toggle('on', f.on.includes(b)));
    arrows.forEach((a, k) => a.classList.toggle('on', f.arrows.includes(k)));
    chart.classList.toggle('hide', !f.bars);
    pBars.forEach(([pb, qb], k) => {
      for (const [r, v, show] of [[pb, p[k], true], [qb, pi[k], f.bars === 2]] as const) {
        const h = show ? (v / scale) * CH : 0;
        r.setAttribute('y', String(CY + CH - h));
        r.setAttribute('height', String(h));
      }
    });
    keyPi.classList.toggle('hide', f.bars !== 2);
    keyP.classList.toggle('hide', !f.bars);
    const [x, y] = mid(f.at);
    token.style.transform = `translate(${x + BOX[f.at][2] / 2 - 12}px, ${y - BOX[f.at][3] / 2 + 12}px)`;
  }, opts);
}

const CSS = `
.mca-box rect{fill:var(--panel-2);stroke:var(--border-strong);stroke-width:1.5;transition:fill .3s,stroke .3s}
.mca-box.on rect{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2.5}
.mca-t{font-size:13.5px;font-weight:650;fill:var(--text)}
.mca-s{font:12px var(--mono);fill:var(--text-2)}
.mca-a{fill:none;stroke:var(--border-strong);stroke-width:2;transition:stroke .3s}
.mca-a.on{stroke:var(--accent);stroke-width:3}
.mca-chart{transition:opacity .3s}
.mca-axis{stroke:var(--border-strong)}
.mca-p{fill:var(--muted);transition:y .4s,height .4s}
.mca-pi{fill:var(--accent);transition:y .4s,height .4s}
.mca-kp{font-size:11.5px;font-weight:600;fill:var(--muted)}
.mca-kpi{font-size:11.5px;font-weight:600;fill:var(--accent)}
.mca-token{fill:var(--warn);stroke:var(--panel);stroke-width:2.5;transition:transform .5s cubic-bezier(.2,.7,.2,1)}
`;
