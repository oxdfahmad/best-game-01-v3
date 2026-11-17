// ORRERY — tuning table: every number the game balances on lives here.
// Palette: deep indigo star chart, warm brass clockwork, gold starlight.
export const ORRERY_CONFIG = {
  width: 1280,
  height: 720,
  // Playfield bounds (HUD bars live outside these).
  field: { left: 176, top: 66, right: 1058, bottom: 652 },
  heart: { x: 617, y: 359, radius: 27, maxHits: 3 },
  dialRing: 192,
  dialCount: 9,
  dialRadius: 19,
  dialChargeTime: 2.6, // seconds of full beam on a dial to light it
  mirrorRing: 302,
  mirrorCount: 6,
  mirrorRadius: 16,
  // Four corner starlight emitters, each aimed at the heart with a slow
  // sweep (so the beams cross the dial ring even before the player aims).
  emitters: [
    { x: 196, y: 86, wobble: 0.22 },
    { x: 1038, y: 86, wobble: -0.22 },
    { x: 196, y: 632, wobble: -0.22 },
    { x: 1038, y: 632, wobble: 0.22 },
  ],
  beamMaxBounces: 8,
  beamMaxRays: 28,
  beamDamage: 1.6, // moth hp per second of beam contact
  beamCharge: 1.0, // dial charge per second of beam contact
  nights: 7,
  nightLength: 40, // seconds per night
  mothTypes: {
    mote:     { hp: 1, speed: 27, gears: 1, score: 10, radius: 11, tint: '#c98cff' },
    lurker:   { hp: 2, speed: 19, gears: 2, score: 20, radius: 13, tint: '#a86ef0' },
    bulwark:  { hp: 4, speed: 12, gears: 3, score: 40, radius: 16, tint: '#8b5cf6' },
    splitter: { hp: 2, speed: 22, gears: 2, score: 25, radius: 12, tint: '#e0aaff' },
  },
  // Spawn table per night: [mote, lurker, bulwark, splitter] weights + interval.
  nightTable: [
    { interval: 2.6, weights: [10, 0, 0, 0] },
    { interval: 2.3, weights: [8, 3, 0, 0] },
    { interval: 2.0, weights: [7, 4, 1, 1] },
    { interval: 1.8, weights: [6, 4, 2, 2] },
    { interval: 1.6, weights: [5, 4, 3, 3] },
    { interval: 1.45, weights: [5, 4, 3, 4] },
    { interval: 1.35, weights: [4, 4, 3, 5] },
  ],
  buildCosts: { prism: 8, lens: 12, pillar: 6 },
  flareCooldown: 12,
  flareRadius: 170,
  flareDamage: 3,
  comboWindow: 3.0,
  comboCap: 8,
  relics: [
    { id: 'widebeam', name: 'WIDE BEAM', text: 'Beams +60% wide: burn 2 moths at once', apply: (s) => { s.beamWidth += 0.6; } },
    { id: 'quickcharge', name: 'QUICK CHARGE', text: 'Dials charge +50% faster', apply: (s) => { s.chargeRate += 0.5; } },
    { id: 'ironheart', name: 'IRON HEART', text: 'Repair the heart +1 hit', apply: (s) => { s.heart = Math.min(3, s.heart + 1); } },
    { id: 'greedygears', name: 'GREEDY GEARS', text: 'Moths drop +1 gear each', apply: (s) => { s.gearBonus += 1; } },
    { id: 'twinflare', name: 'TWIN FLARE', text: 'Flare recharges twice as fast', apply: (s) => { s.flareCooldownScale *= 0.5; } },
    { id: 'brightcore', name: 'BRIGHT CORE', text: 'Beams burn +50% damage', apply: (s) => { s.beamDamageScale += 0.5; } },
  ],
  boss: { name: 'THE ECLIPSE', hp: 70, radius: 48, spawnAt: 8, spawnInterval: 4 },
  grades: [
    { min: 5200, letter: 'S' },
    { min: 3600, letter: 'A' },
    { min: 2200, letter: 'B' },
    { min: 1200, letter: 'C' },
    { min: 0, letter: 'D' },
  ],
};
