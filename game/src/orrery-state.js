// ORRERY — the whole game state: one object, created fresh per run.
import { ORRERY_CONFIG as CFG } from './orrery-config.js';
import { makeOrreryRng } from './orrery-rng.js';

export function createOrreryState(seed) {
  const rng = makeOrreryRng(seed);
  const cx = (CFG.field.left + CFG.field.right) / 2;
  const cy = (CFG.field.top + CFG.field.bottom) / 2;
  const dials = [];
  for (let i = 0; i < CFG.dialCount; i++) {
    const a = (i / CFG.dialCount) * Math.PI * 2 - Math.PI / 2;
    dials.push({
      angle: a,
      x: cx + Math.cos(a) * CFG.dialRing,
      y: cy + Math.sin(a) * CFG.dialRing,
      charge: 0,
      lit: false,
      latched: null, // moth draining this dial, if any
    });
  }
  const mirrors = [];
  for (let i = 0; i < CFG.mirrorCount; i++) {
    const a = (i / CFG.mirrorCount) * Math.PI * 2 + Math.PI / 6;
    mirrors.push({
      ringAngle: a,
      x: cx + Math.cos(a) * CFG.mirrorRing,
      y: cy + Math.sin(a) * CFG.mirrorRing,
      // Mirror normal: start facing the heart so beams bend inward.
      rot: Math.atan2(cy - (cy + Math.sin(a) * CFG.mirrorRing), cx - (cx + Math.cos(a) * CFG.mirrorRing)),
      glow: 0,
    });
  }
  return {
    rng,
    seed,
    screen: 'title', // title | play | relic | win | lose | paused
    prevScreen: 'play',
    time: 0,
    night: 1,
    dawnT: CFG.nightLength,
    score: 0,
    best: 0,
    gears: 6,
    gearBonus: 0,
    combo: 1,
    comboT: 0,
    comboMax: 1,
    heart: CFG.heart.maxHits,
    dials,
    mirrors,
    moths: [],
    buildItems: [], // {kind, x, y, hp?}
    relicsHeld: [],
    relicOffer: [],
    beamWidth: 1.0,
    chargeRate: 1.0,
    beamDamageScale: 1.0,
    flareCooldownScale: 1.0,
    flareCd: 0,
    flareReady: true,
    selected: null, // 'prism' | 'lens' | 'pillar'
    boss: null,
    spawnT: 0,
    bossSpawnT: 0,
    shake: 0,
    flash: null, // {text, sub, t}
    floaters: [], // {x, y, text, tint, t}
    particles: [],
    beams: [], // traced this frame: {x1,y1,x2,y2,power}
    stats: { burns: 0, dialsLit: 0, nightsCleared: 0, mothsSpawned: 0 },
    muted: false,
    dragMirror: -1,
    mouse: { x: 0, y: 0, down: false },
    won: false,
  };
}

export function startOrreryNight(state) {
  state.screen = 'play';
  state.dawnT = CFG.nightLength;
  state.spawnT = 1.2;
  state.bossSpawnT = CFG.boss.spawnAt;
  state.boss = null;
  state.moths.length = 0;
  // Dials keep their charge between nights; latched moths are cleared.
  for (const d of state.dials) d.latched = null;
}

export function offerOrreryRelics(state) {
  const pool = CFG.relics.filter((r) => !state.relicsHeld.some((h) => h.id === r.id));
  const offer = [];
  while (offer.length < 3 && pool.length > 0) {
    const i = Math.floor(state.rng() * pool.length);
    offer.push(pool.splice(i, 1)[0]);
  }
  state.relicOffer = offer;
  state.screen = 'relic';
}

export function applyOrreryRelic(state, relic) {
  relic.apply(state);
  state.relicsHeld.push(relic);
  state.flash = { text: relic.name + '!', sub: relic.text, t: 0 };
}

export function orreryGrade(score) {
  for (const g of CFG.grades) if (score >= g.min) return g.letter;
  return 'D';
}

export function litDialCount(state) {
  let n = 0;
  for (const d of state.dials) if (d.lit) n++;
  return n;
}

export function addOrreryScore(state, base, x, y, label) {
  const gained = Math.round(base * state.combo);
  state.score += gained;
  state.floaters.push({ x, y, text: '+' + gained + (label ? ' ' + label : ''), tint: '#ffe9a8', t: 0 });
  return gained;
}

export function bumpOrreryCombo(state) {
  state.combo = Math.min(CFG.comboCap, state.combo + 1);
  state.comboT = CFG.comboWindow;
  if (state.combo > state.comboMax) state.comboMax = state.combo;
}
