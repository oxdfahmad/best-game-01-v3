// ORRERY — starlight tracing: emitters fire rays, mirrors reflect them,
// prisms split them, lenses boost them, dials drink them, moths burn in them.
import { ORRERY_CONFIG as CFG } from './orrery-config.js';

function rayCircle(ox, oy, dx, dy, cx, cy, r) {
  const ex = cx - ox;
  const ey = cy - oy;
  const tca = ex * dx + ey * dy;
  if (tca < 0) return -1;
  const d2 = ex * ex + ey * ey - tca * tca;
  const r2 = r * r;
  if (d2 > r2) return -1;
  return tca - Math.sqrt(r2 - d2);
}

function rayRectExit(ox, oy, dx, dy, f) {
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (f.right - ox) / dx);
  else if (dx < 0) t = Math.min(t, (f.left - ox) / dx);
  if (dy > 0) t = Math.min(t, (f.bottom - oy) / dy);
  else if (dy < 0) t = Math.min(t, (f.top - oy) / dy);
  return t;
}

export function traceOrreryBeams(state) {
  const segments = [];
  const dialHits = new Map();
  const mothHits = new Map();
  let bossPower = 0;
  const heart = { x: (CFG.field.left + CFG.field.right) / 2, y: (CFG.field.top + CFG.field.bottom) / 2 };
  const queue = [];
  for (const e of CFG.emitters) {
    const wob = Math.sin(state.time * 0.35 + e.x) * e.wobble;
    const base = Math.atan2(heart.y - e.y, heart.x - e.x) + wob;
    queue.push({ x: e.x, y: e.y, dx: Math.cos(base), dy: Math.sin(base), power: 1, depth: 0 });
  }
  let traced = 0;
  while (queue.length > 0 && traced < CFG.beamMaxRays) {
    const ray = queue.shift();
    traced++;
    let ox = ray.x;
    let oy = ray.y;
    let dx = ray.dx;
    let dy = ray.dy;
    let power = ray.power;
    // Lens zones boost the ray as it passes through them.
    for (const item of state.buildItems) {
      if (item.kind !== 'lens') continue;
      const t = rayCircle(ox, oy, dx, dy, item.x, item.y, 26);
      if (t >= 0 && t < 900) {
        power *= 2.5;
        item.glow = 1;
      }
    }
    // Find the nearest thing this ray hits.
    let bestT = rayRectExit(ox, oy, dx, dy, CFG.field);
    let bestKind = 'wall';
    let bestObj = null;
    const consider = (t, kind, obj) => {
      if (t >= 0.5 && t < bestT) { bestT = t; bestKind = kind; bestObj = obj; }
    };
    for (const m of state.mirrors) {
      consider(rayCircle(ox, oy, dx, dy, m.x, m.y, CFG.mirrorRadius), 'mirror', m);
    }
    for (const item of state.buildItems) {
      if (item.kind === 'prism') consider(rayCircle(ox, oy, dx, dy, item.x, item.y, 13), 'prism', item);
      if (item.kind === 'pillar') consider(rayCircle(ox, oy, dx, dy, item.x, item.y, 15), 'pillar', item);
    }
    for (const d of state.dials) {
      consider(rayCircle(ox, oy, dx, dy, d.x, d.y, CFG.dialRadius), 'dial', d);
    }
    for (const mo of state.moths) {
      if (mo.dead) continue;
      consider(rayCircle(ox, oy, dx, dy, mo.x, mo.y, mo.radius), 'moth', mo);
    }
    if (state.boss && !state.boss.dead) {
      consider(rayCircle(ox, oy, dx, dy, state.boss.x, state.boss.y, CFG.boss.radius), 'boss', state.boss);
    }
    consider(rayCircle(ox, oy, dx, dy, heart.x, heart.y, CFG.heart.radius), 'heart', null);
    const hx = ox + dx * bestT;
    const hy = oy + dy * bestT;
    segments.push({ x1: ox, y1: oy, x2: hx, y2: hy, power });
    if (bestKind === 'mirror') {
      const m = bestObj;
      m.glow = 1;
      const nx = Math.cos(m.rot);
      const ny = Math.sin(m.rot);
      const dot = dx * nx + dy * ny;
      const rx = dx - 2 * dot * nx;
      const ry = dy - 2 * dot * ny;
      if (ray.depth < CFG.beamMaxBounces) {
        queue.push({ x: hx + rx * 2, y: hy + ry * 2, dx: rx, dy: ry, power: power * 0.95, depth: ray.depth + 1 });
      }
    } else if (bestKind === 'prism') {
      const item = bestObj;
      item.glow = 1;
      if (ray.depth < CFG.beamMaxBounces) {
        const base = Math.atan2(dy, dx);
        for (const off of [-0.45, 0.45]) {
          queue.push({ x: hx + Math.cos(base + off) * 2, y: hy + Math.sin(base + off) * 2, dx: Math.cos(base + off), dy: Math.sin(base + off), power: power * 0.6, depth: ray.depth + 1 });
        }
      }
    } else if (bestKind === 'dial') {
      const d = bestObj;
      dialHits.set(d, (dialHits.get(d) || 0) + power);
    } else if (bestKind === 'moth') {
      const mo = bestObj;
      mothHits.set(mo, (mothHits.get(mo) || 0) + power);
    } else if (bestKind === 'boss') {
      bossPower += power;
    }
    // wall / pillar / heart: the ray simply ends.
  }
  return { segments, dialHits, mothHits, bossPower };
}
