// ORRERY — mouse + keyboard: drag mirrors to aim them, click the chart to
// build, keys 1-3 pick a build, SPACE flares, P pauses, R restarts.
import { ORRERY_CONFIG as CFG } from './orrery-config.js';

export function attachOrreryInput(canvas, state, actions) {
  const toLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (CFG.width / r.width), y: (e.clientY - r.top) * (CFG.height / r.height) };
  };

  canvas.addEventListener('mousedown', (e) => {
    const p = toLocal(e);
    state.mouse.x = p.x;
    state.mouse.y = p.y;
    state.mouse.down = true;
    actions.onPress(p.x, p.y);
  });
  canvas.addEventListener('mousemove', (e) => {
    const p = toLocal(e);
    state.mouse.x = p.x;
    state.mouse.y = p.y;
    if (state.dragMirror >= 0) {
      const m = state.mirrors[state.dragMirror];
      // The mirror's normal points at the cursor: it faces where you look.
      m.rot = Math.atan2(p.y - m.y, p.x - m.x);
    }
  });
  window.addEventListener('mouseup', () => {
    state.mouse.down = false;
    state.dragMirror = -1;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === '1') actions.onSelectBuild('prism');
    else if (k === '2') actions.onSelectBuild('lens');
    else if (k === '3') actions.onSelectBuild('pillar');
    else if (k === ' ') { e.preventDefault(); actions.onFlare(); }
    else if (k === 'p') actions.onPause();
    else if (k === 'm') actions.onMute();
    else if (k === 'r') actions.onRestart();
    else if (k === 'enter') actions.onConfirm();
  });
}

export function mirrorAt(state, x, y) {
  for (let i = 0; i < state.mirrors.length; i++) {
    const m = state.mirrors[i];
    if (Math.hypot(m.x - x, m.y - y) < 26) return i;
  }
  return -1;
}

export function buildSlotAt(state, x, y) {
  // Bottom bar build cards.
  const cards = [
    { kind: 'prism', x0: 300 },
    { kind: 'lens', x0: 430 },
    { kind: 'pillar', x0: 560 },
  ];
  for (const c of cards) {
    if (x >= c.x0 && x <= c.x0 + 120 && y >= 664 && y <= 712) return c.kind;
  }
  return null;
}
