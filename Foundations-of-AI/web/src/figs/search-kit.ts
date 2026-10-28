// Small helpers shared by the search-* figures of the formulation chapter (not a figure itself).

/** A `.btn sm` button appended to `parent`. */
export function btn(parent: HTMLElement, text: string, on: () => void, cls = ''): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = `btn sm ${cls}`;
  b.textContent = text;
  b.onclick = on;
  parent.append(b);
  return b;
}

/** A <select> with `[value, label]` options; `on` runs on change. */
export function pick(parent: HTMLElement, items: [string, string][], value: string, on: (v: string) => void, title = ''): HTMLSelectElement {
  const sel = document.createElement('select');
  sel.innerHTML = items.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  sel.value = value;
  sel.title = title;
  sel.onchange = () => on(sel.value);
  parent.append(sel);
  return sel;
}

/** A requestAnimationFrame loop that calls `step` every `ms()` milliseconds while on; `step` returns false to stop. */
export function ticker(step: () => boolean, ms: () => number, onStop: () => void = () => {}) {
  let raf = 0, last = -Infinity, on = false;
  const frame = (t: number) => {
    if (!on) return;
    if (t - last >= ms()) { last = t; if (!step()) { stop(); return; } }
    raf = requestAnimationFrame(frame);
  };
  function start() { if (on) return; on = true; last = -Infinity; raf = requestAnimationFrame(frame); }
  function stop() { if (!on) return; on = false; cancelAnimationFrame(raf); onStop(); }
  return { start, stop, get on() { return on; } };
}

export const SPEEDS: [string, string][] = [['900', 'slow'], ['450', 'normal'], ['150', 'fast']];
export const fmt = (x: number) => x.toLocaleString('en-US').replace(/,/g, ' ');
