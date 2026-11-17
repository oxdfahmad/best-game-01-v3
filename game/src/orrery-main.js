// ORRERY — the loop: update the night, trace the light, burn the moths,
// light the dials, and decide win or lose. Also the ?shot= demo states
// the screenshots are taken from, and the debug hooks the playtest uses.
import { ORRERY_CONFIG as CFG } from './orrery-config.js';
import { createOrreryState, startOrreryNight, offerOrreryRelics, applyOrreryRelic, litDialCount, addOrreryScore, bumpOrreryCombo } from './orrery-state.js';
import { traceOrreryBeams } from './orrery-beams.js';
import { spawnOrreryMoth, spawnOrreryBoss, updateOrreryMoths, burnOrreryMoth } from './orrery-moths.js';
import { attachOrreryInput, mirrorAt, buildSlotAt } from './orrery-input.js';
import { createOrreryAudio } from './orrery-audio.js';
import { renderOrrery } from './orrery-render.js';

const params = new URLSearchParams(window.location.search);
const seed = parseInt(params.get('seed') || '7', 10) || 7;
const shot = params.get('shot') || '';

const canvas = document.getElementById('orrery');
const ctx = canvas.getContext('2d');
const audio = createOrreryAudio();

let state = createOrreryState(seed);
let best = 0;

function resetOrrery() {
  const keepBest = Math.max(best, state.score);
  // Re-initialize IN PLACE: the input handlers captured this exact object at
  // attach time, so replacing it would silently disconnect all dragging.
  Object.assign(state, createOrreryState(seed));
  best = keepBest;
  state.best = best;
}

function beginOrrery() {
  audio.unlock();
  resetOrrery();
  startOrreryNight(state);
}

function endOrrery(won) {
  state.won = won;
  state.best = Math.max(best, state.score);
  best = state.best;
  state.screen = won ? 'win' : 'lose';
  if (won) audio.win();
  else audio.lose();
}

function onOrreryHeartHit(mo) {
  state.heart -= 1;
  state.shake = 16;
  state.flash = { text: 'HEART HIT!', sub: `${state.heart} ${state.heart === 1 ? 'hit' : 'hits'} left`, t: 0 };
  audio.heartHit();
  burstOrreryParticles((CFG.field.left + CFG.field.right) / 2, (CFG.field.top + CFG.field.bottom) / 2, '#ff5a6e', 16);
  if (state.heart <= 0) endOrrery(false);
}

function onOrreryMothBurned(mo) {
  state.gears += mo.gears + state.gearBonus;
  state.stats.burns += 1;
  bumpOrreryCombo(state);
  addOrreryScore(state, mo.score, mo.x, mo.y);
  burstOrreryParticles(mo.x, mo.y, '#ffe9a8', 8);
  audio.burn();
}

function burstOrreryParticles(x, y, tint, n) {
  for (let i = 0; i < n; i++) {
    const a = state.rng() * Math.PI * 2;
    const sp = 40 + state.rng() * 120;
    state.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: 2 + state.rng() * 3, tint, t: 0, life: 0.5 + state.rng() * 0.4 });
  }
}

function fireOrreryFlare() {
  if (state.screen !== 'play' || state.flareCd > 0) return;
  state.flareCd = CFG.flareCooldown * state.flareCooldownScale;
  const hx = (CFG.field.left + CFG.field.right) / 2;
  const hy = (CFG.field.top + CFG.field.bottom) / 2;
  burstOrreryParticles(hx, hy, '#ffd166', 40);
  const victims = [...state.moths];
  for (const mo of victims) {
    if (Math.hypot(mo.x - hx, mo.y - hy) < CFG.flareRadius) {
      burnOrreryMoth(state, mo, CFG.flareDamage, onOrreryMothBurned);
    }
  }
  if (state.boss && !state.boss.dead && Math.hypot(state.boss.x - hx, state.boss.y - hy) < CFG.flareRadius + CFG.boss.radius) {
    state.boss.hp -= 5;
  }
  state.flash = { text: 'FLARE!', sub: 'Nova burst around the heart', t: 0 };
  audio.flare();
}

const actions = {
  onPress(x, y) {
    audio.unlock();
    if (state.screen === 'title') { beginOrrery(); return; }
    if (state.screen === 'win' || state.screen === 'lose') return;
    if (state.screen === 'paused') { state.screen = state.prevScreen; return; }
    if (state.screen === 'relic') {
      const cards = state.relicOffer;
      const cw = 300;
      const gap = 24;
      const total = cards.length * cw + (cards.length - 1) * gap;
      let cx = (CFG.width - total) / 2;
      for (let i = 0; i < cards.length; i++) {
        if (x >= cx && x <= cx + cw && y >= 240 && y <= 460) {
          applyOrreryRelic(state, cards[i]);
          audio.relic();
          state.night += 1;
          startOrreryNight(state);
          return;
        }
        cx += cw + gap;
      }
      return;
    }
    // Play screen.
    const mi = mirrorAt(state, x, y);
    if (mi >= 0) { state.dragMirror = mi; state.selected = null; return; }
    const slot = buildSlotAt(state, x, y);
    if (slot) {
      state.selected = state.selected === slot ? null : slot;
      return;
    }
    if (state.selected) {
      const kind = state.selected;
      const cost = CFG.buildCosts[kind];
      const f = CFG.field;
      if (x > f.left + 20 && x < f.right - 20 && y > f.top + 20 && y < f.bottom - 20 && state.gears >= cost) {
        state.gears -= cost;
        state.buildItems.push({ kind, x, y, glow: 0 });
        audio.place();
        state.floaters.push({ x, y: y - 18, text: kind.toUpperCase() + ' PLACED', tint: '#7dd3fc', t: 0 });
      }
      state.selected = null;
      return;
    }
  },
  onSelectBuild(kind) {
    if (state.screen !== 'play') return;
    state.selected = state.selected === kind ? null : kind;
  },
  onFlare() { fireOrreryFlare(); },
  onPause() {
    if (state.screen === 'play') { state.prevScreen = 'play'; state.screen = 'paused'; }
    else if (state.screen === 'paused') { state.screen = state.prevScreen; }
  },
  onMute() {
    state.muted = !state.muted;
    audio.setMuted(state.muted);
  },
  onRestart() { beginOrrery(); },
  onConfirm() {
    if (state.screen === 'title') beginOrrery();
    else if (state.screen === 'win' || state.screen === 'lose') beginOrrery();
  },
};

attachOrreryInput(canvas, state, actions);

function updateOrrery(dt) {
  state.time += dt;
  if (state.flash) {
    state.flash.t += dt;
    if (state.flash.t > 2.4) state.flash = null;
  }
  for (const fl of state.floaters) fl.t += dt;
  state.floaters = state.floaters.filter((fl) => fl.t < 1.2);
  for (const p of state.particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  state.particles = state.particles.filter((p) => p.t < p.life);
  state.shake = Math.max(0, state.shake - dt * 30);
  state.flareCd = Math.max(0, state.flareCd - dt);

  if (state.screen === 'title') {
    // Idle backdrop: trace beams with no moths so the chart glows.
    state.beams = traceOrreryBeams(state).segments;
    return;
  }
  if (state.screen !== 'play') return;

  // Dawn countdown.
  state.dawnT -= dt;
  if (state.dawnT <= 0) {
    if (state.night >= CFG.nights) {
      if (litDialCount(state) >= CFG.dialCount) endOrrery(true);
      else endOrrery(false);
      return;
    }
    state.stats.nightsCleared += 1;
    audio.nightClear();
    offerOrreryRelics(state);
    return;
  }
  // Spawning.
  state.spawnT -= dt;
  if (state.spawnT <= 0) {
    state.spawnT = CFG.nightTable[state.night - 1].interval;
    spawnOrreryMoth(state);
  }
  if (state.night >= CFG.nights && !state.boss) {
    state.bossSpawnT -= dt;
    if (state.bossSpawnT <= 0) spawnOrreryBoss(state);
  }
  // Beams: charge dials, burn moths, hurt the boss.
  const traced = traceOrreryBeams(state);
  state.beams = traced.segments;
  for (const [d, power] of traced.dialHits) {
    if (d.lit) continue;
    d.charge += (power * CFG.beamCharge * state.chargeRate * dt) / CFG.dialChargeTime;
    if (d.charge >= 1) {
      d.charge = 1;
      d.lit = true;
      state.stats.dialsLit += 1;
      addOrreryScore(state, 25, d.x, d.y - 24, 'DIAL LIT!');
      burstOrreryParticles(d.x, d.y, '#ffe9a8', 12);
      audio.dialLit();
    }
  }
  for (const [mo, power] of traced.mothHits) {
    burnOrreryMoth(state, mo, power * CFG.beamDamage * state.beamDamageScale * dt, onOrreryMothBurned);
  }
  if (traced.bossPower > 0 && state.boss && !state.boss.dead) {
    state.boss.hp -= traced.bossPower * CFG.beamDamage * state.beamDamageScale * dt;
    if (state.boss.hp <= 0) {
      state.boss.dead = true;
      state.stats.burns += 1;
      addOrreryScore(state, 500, state.boss.x, state.boss.y, 'ECLIPSE BROKEN!');
      burstOrreryParticles(state.boss.x, state.boss.y, '#e0aaff', 40);
      state.flash = { text: 'ECLIPSE BROKEN!', sub: '+500 — the chart is yours again', t: 0 };
      audio.nightClear();
    }
  }
  // Moths crawl, latch, bite.
  updateOrreryMoths(state, dt, onOrreryHeartHit, onOrreryMothBurned);
  // Combo decay.
  if (state.comboT > 0) {
    state.comboT -= dt;
    if (state.comboT <= 0) state.combo = 1;
  }
}

// ---- Screenshot demo states: real renders of this game's own code. ----
function enterOrreryShot(name) {
  if (name === 'title') {
    state.screen = 'title';
    return;
  }
  if (name === 'play') {
    // Night 7, boss live, six dials lit, moths everywhere, combo running.
    state.screen = 'play';
    state.night = 7;
    state.dawnT = 22;
    state.score = 2840;
    state.gears = 42;
    state.combo = 4;
    state.comboT = 2.5;
    state.comboMax = 4;
    state.heart = 3;
    state.dials.forEach((d, i) => {
      if (i < 6) { d.charge = 99; d.lit = true; } // 99: a latched moth can't drain it inside the shot window
      else { d.charge = 0.55 + (i - 6) * 0.15; }
    });
    state.stats.dialsLit = 6;
    state.buildItems = [
      { kind: 'prism', x: 430, y: 250, glow: 0 },
      { kind: 'lens', x: 800, y: 470, glow: 0 },
      { kind: 'pillar', x: 520, y: 520, glow: 0 },
    ];
    state.relicsHeld = [
      { id: 'widebeam', name: 'WIDE BEAM' },
      { id: 'quickcharge', name: 'QUICK CHARGE' },
    ];
    state.mirrors[0].rot = 0.6;
    state.mirrors[2].rot = -1.1;
    state.mirrors[4].rot = 2.4;
    spawnOrreryBoss(state);
    state.boss.hp = 41;
    const types = ['mote', 'mote', 'lurker', 'bulwark', 'splitter', 'mote', 'lurker', 'mote'];
    for (let i = 0; i < types.length; i++) {
      const mo = spawnOrreryMoth(state, types[i]);
      mo.x = 260 + (i * 97) % 700;
      mo.y = 130 + ((i * 173) % 420);
    }
    // A couple of live floaters for the feedback feel.
    state.floaters.push({ x: 700, y: 220, text: '+40', tint: '#ffe9a8', t: 0.2 });
    state.floaters.push({ x: 480, y: 430, text: '+120 COMBO ×4', tint: '#ffe9a8', t: 0.1 });
    return;
  }
  if (name === 'win') {
    state.screen = 'win';
    state.night = 7;
    state.dawnT = 0;
    state.score = 5240;
    state.best = 5240;
    state.dials.forEach((d) => { d.lit = true; d.charge = 1; });
    state.relicsHeld = [
      { id: 'widebeam', name: 'WIDE BEAM' },
      { id: 'quickcharge', name: 'QUICK CHARGE' },
      { id: 'longnight', name: 'LONG NIGHT' },
      { id: 'sharplight', name: 'SHARP LIGHT' },
      { id: 'gearworks', name: 'GEARWORKS' },
      { id: 'heartguard', name: 'HEARTGUARD' },
    ];
    state.stats = { burns: 61, dialsLit: 9, nightsCleared: 7, mothsSpawned: 88 };
    state.comboMax = 8;
    return;
  }
  if (name === 'lose') {
    state.screen = 'lose';
    state.night = 5;
    state.dawnT = 0;
    state.heart = 0;
    state.score = 1980;
    state.best = 5240;
    state.dials.forEach((d, i) => { if (i < 5) { d.lit = true; d.charge = 1; } });
    state.relicsHeld = [
      { id: 'widebeam', name: 'WIDE BEAM' },
      { id: 'quickcharge', name: 'QUICK CHARGE' },
      { id: 'longnight', name: 'LONG NIGHT' },
      { id: 'gearworks', name: 'GEARWORKS' },
    ];
    state.stats = { burns: 34, dialsLit: 5, nightsCleared: 4, mothsSpawned: 61 };
    state.comboMax = 5;
  }
}

if (shot) enterOrreryShot(shot);

// Debug hooks for the local playtest (window.__orrery).
window.__orrery = {
  get state() { return state; },
  begin: beginOrrery,
  winNow() { endOrrery(true); },
  loseNow() { endOrrery(false); },
  fireFlare: fireOrreryFlare,
};

let last = performance.now();
function orreryFrame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updateOrrery(dt);
  renderOrrery(ctx, state, audio);
  requestAnimationFrame(orreryFrame);
}
requestAnimationFrame(orreryFrame);
