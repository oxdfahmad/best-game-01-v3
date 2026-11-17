// ORRERY — the things that crawl in from the dark: moths, and on the last
// night, the Eclipse itself. Moths hunt dials first, then the heart.
import { ORRERY_CONFIG as CFG } from './orrery-config.js';
import { pickWeighted } from './orrery-rng.js';

const MOTH_KEYS = ['mote', 'lurker', 'bulwark', 'splitter'];

export function spawnOrreryMoth(state, forceType) {
  const table = CFG.nightTable[state.night - 1];
  const keys = MOTH_KEYS;
  let type = forceType;
  if (!type) {
    const idx = pickWeighted(state.rng, table.weights);
    type = keys[idx];
  }
  const spec = CFG.mothTypes[type];
  const f = CFG.field;
  const side = Math.floor(state.rng() * 4);
  let x;
  let y;
  if (side === 0) { x = f.left + state.rng() * (f.right - f.left); y = f.top + 6; }
  else if (side === 1) { x = f.left + state.rng() * (f.right - f.left); y = f.bottom - 6; }
  else if (side === 2) { x = f.left + 6; y = f.top + state.rng() * (f.bottom - f.top); }
  else { x = f.right - 6; y = f.top + state.rng() * (f.bottom - f.top); }
  const moth = {
    type,
    x, y,
    hp: spec.hp,
    maxHp: spec.hp,
    speed: spec.speed * (0.9 + state.rng() * 0.2),
    radius: spec.radius,
    tint: spec.tint,
    gears: spec.gears,
    score: spec.score,
    latched: null,
    wobble: state.rng() * Math.PI * 2,
    dead: false,
    burnT: 0,
  };
  state.moths.push(moth);
  state.stats.mothsSpawned++;
  return moth;
}

export function spawnOrreryBoss(state) {
  const f = CFG.field;
  state.boss = {
    name: CFG.boss.name,
    x: (f.left + f.right) / 2,
    y: f.top + 90,
    hp: CFG.boss.hp,
    maxHp: CFG.boss.hp,
    radius: CFG.boss.radius,
    drift: 0,
    spawnT: 0,
    dead: false,
  };
  state.flash = { text: 'THE ECLIPSE', sub: 'Burn it with focused light — it eats beams', t: 0 };
}

export function updateOrreryMoths(state, dt, onHeartHit, onMothBurned) {
  const heart = { x: (CFG.field.left + CFG.field.right) / 2, y: (CFG.field.top + CFG.field.bottom) / 2 };
  for (const mo of state.moths) {
    if (mo.dead) continue;
    mo.burnT = Math.max(0, mo.burnT - dt);
    if (mo.latched) {
      // Latched moths drain the dial they sit on until burned off.
      const d = mo.latched;
      d.charge = Math.max(0, d.charge - 0.12 * dt);
      if (d.charge <= 0 && d.lit) { d.lit = false; }
      continue;
    }
    // Target: nearest unlit dial, else the heart.
    let tx = heart.x;
    let ty = heart.y;
    let best = Infinity;
    for (const d of state.dials) {
      if (d.lit) continue;
      const dd = (d.x - mo.x) * (d.x - mo.x) + (d.y - mo.y) * (d.y - mo.y);
      if (dd < best) { best = dd; tx = d.x; ty = d.y; }
    }
    const dx = tx - mo.x;
    const dy = ty - mo.y;
    const dist = Math.hypot(dx, dy) || 1;
    mo.wobble += dt * 3;
    const wob = Math.sin(mo.wobble) * 4;
    const px = -dy / dist;
    const py = dx / dist;
    mo.x += (dx / dist) * mo.speed * dt + px * wob * dt;
    mo.y += (dy / dist) * mo.speed * dt + py * wob * dt;
    // Reached a dial: latch on and drain it.
    for (const d of state.dials) {
      if (Math.hypot(d.x - mo.x, d.y - mo.y) < CFG.dialRadius + mo.radius - 2) {
        mo.latched = d;
        d.latched = mo;
        break;
      }
    }
    // Reached the heart: it bites, then dies.
    if (!mo.latched && Math.hypot(heart.x - mo.x, heart.y - mo.y) < CFG.heart.radius + mo.radius) {
      mo.dead = true;
      onHeartHit(mo);
    }
  }
  // Boss drift + spawning.
  if (state.boss && !state.boss.dead) {
    const b = state.boss;
    b.drift += dt;
    b.x = (CFG.field.left + CFG.field.right) / 2 + Math.sin(b.drift * 0.35) * 260;
    b.y = (CFG.field.top + CFG.field.bottom) / 2 - 40 + Math.cos(b.drift * 0.5) * 90;
    b.spawnT -= dt;
    if (b.spawnT <= 0) {
      b.spawnT = CFG.boss.spawnInterval;
      const m = spawnOrreryMoth(state, 'mote');
      m.x = b.x;
      m.y = b.y + b.radius;
    }
  }
  // Sweep the dead.
  state.moths = state.moths.filter((mo) => !mo.dead);
}

export function burnOrreryMoth(state, mo, dmg, onMothBurned) {
  if (mo.dead) return;
  mo.hp -= dmg;
  mo.burnT = 0.15;
  if (mo.hp <= 0) {
    mo.dead = true;
    if (mo.latched) {
      mo.latched.latched = null;
      mo.latched = null;
    }
    if (mo.type === 'splitter') {
      for (let i = 0; i < 2; i++) {
        const child = spawnOrreryMoth(state, 'mote');
        child.x = mo.x + (i === 0 ? -14 : 14);
        child.y = mo.y;
      }
    }
    onMothBurned(mo);
  }
}
