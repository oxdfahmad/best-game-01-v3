// ORRERY — every pixel: the star chart, the clockwork, the beams, the HUD,
// and the title / relic / win / lose screens. One canvas, no images.
import { ORRERY_CONFIG as CFG } from './orrery-config.js';
import { litDialCount, orreryGrade } from './orrery-state.js';

function starHash(i) {
  let x = (i * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519);
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function pill(ctx, x, y, w, h, fill, text, font) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
}

export function renderOrrery(ctx, state, audio) {
  const W = CFG.width;
  const H = CFG.height;
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  drawOrreryBackdrop(ctx, state);
  drawOrreryField(ctx, state);
  drawOrreryBeams(ctx, state);
  drawOrreryBuildItems(ctx, state);
  drawOrreryDials(ctx, state);
  drawOrreryHeart(ctx, state);
  drawOrreryMirrors(ctx, state);
  drawOrreryEmitters(ctx, state);
  drawOrreryMoths(ctx, state);
  drawOrreryBoss(ctx, state);
  drawOrreryParticles(ctx, state);
  drawOrreryFloaters(ctx, state);
  drawOrreryHud(ctx, state);
  if (state.flash) drawOrreryFlash(ctx, state);
  if (state.screen === 'title') drawOrreryTitle(ctx, state);
  else if (state.screen === 'relic') drawOrreryRelic(ctx, state);
  else if (state.screen === 'win') drawOrreryEnd(ctx, state, true);
  else if (state.screen === 'lose') drawOrreryEnd(ctx, state, false);
  else if (state.screen === 'paused') drawOrreryPaused(ctx, state);
  ctx.restore();
}

function drawOrreryBackdrop(ctx, state) {
  const g = ctx.createRadialGradient(640, 360, 60, 640, 360, 760);
  g.addColorStop(0, '#1c2454');
  g.addColorStop(0.55, '#12173c');
  g.addColorStop(1, '#070a1e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.width, CFG.height);
  for (let i = 0; i < 140; i++) {
    const x = starHash(i) * CFG.width;
    const y = starHash(i + 500) * CFG.height;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(state.time * 0.8 + i));
    ctx.fillStyle = `rgba(255,255,255,${0.25 * tw})`;
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
}

function drawOrreryField(ctx, state) {
  const f = CFG.field;
  const cx = (f.left + f.right) / 2;
  const cy = (f.top + f.bottom) / 2;
  ctx.strokeStyle = 'rgba(217,164,65,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, CFG.dialRing, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, CFG.mirrorRing, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(217,164,65,0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, f.left, f.top, f.right - f.left, f.bottom - f.top, 14);
  ctx.stroke();
  // Faint constellation ticks.
  ctx.fillStyle = 'rgba(255,233,168,0.35)';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('✦ STAR CHART — SECTOR VII', f.left + 10, f.top + 18);
}

function drawOrreryBeams(ctx, state) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const s of state.beams) {
    const w = 6 * state.beamWidth * (0.5 + s.power * 0.5);
    ctx.strokeStyle = `rgba(255,190,60,${0.16 + 0.10 * s.power})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,246,201,${0.75 + 0.25 * s.power})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOrreryBuildItems(ctx, state) {
  for (const item of state.buildItems) {
    item.glow = Math.max(0, (item.glow || 0) - 0.03);
    if (item.kind === 'prism') {
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 13);
      ctx.lineTo(item.x + 12, item.y + 9);
      ctx.lineTo(item.x - 12, item.y + 9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (item.kind === 'lens') {
      ctx.fillStyle = `rgba(125,211,252,${0.25 + 0.5 * item.glow})`;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
      ctx.stroke();
    } else if (item.kind === 'pillar') {
      ctx.fillStyle = '#b08968';
      ctx.fillRect(item.x - 8, item.y - 15, 16, 30);
      ctx.fillStyle = '#e7c496';
      ctx.fillRect(item.x - 11, item.y - 18, 22, 6);
      ctx.fillRect(item.x - 11, item.y + 12, 22, 6);
    }
  }
}

function drawOrreryDials(ctx, state) {
  for (const d of state.dials) {
    // Brass ring.
    ctx.fillStyle = '#3a2f1d';
    ctx.beginPath();
    ctx.arc(d.x, d.y, CFG.dialRadius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Charge arc.
    if (d.charge > 0) {
      ctx.strokeStyle = d.lit ? '#ffe9a8' : '#f2c14e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(d.x, d.y, CFG.dialRadius - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * d.charge);
      ctx.stroke();
    }
    if (d.lit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.5 + 0.3 * Math.sin(state.time * 4 + d.angle * 3);
      const g = ctx.createRadialGradient(d.x, d.y, 2, d.x, d.y, 34);
      g.addColorStop(0, `rgba(255,233,168,${0.55 * pulse})`);
      g.addColorStop(1, 'rgba(255,233,168,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#fff6c9';
      ctx.font = '700 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', d.x, d.y + 1);
    } else {
      ctx.fillStyle = '#8a7a55';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('○', d.x, d.y + 1);
    }
    if (d.latched) {
      ctx.fillStyle = '#ff5a6e';
      ctx.font = '700 11px system-ui, sans-serif';
      ctx.fillText('DRAINED', d.x, d.y - 28);
    }
  }
}

function drawOrreryHeart(ctx, state) {
  const cx = (CFG.field.left + CFG.field.right) / 2;
  const cy = (CFG.field.top + CFG.field.bottom) / 2;
  const pulse = 1 + 0.06 * Math.sin(state.time * 3);
  ctx.fillStyle = '#2a1c10';
  ctx.beginPath();
  ctx.arc(cx, cy, CFG.heart.radius + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ff5a6e';
  ctx.beginPath();
  ctx.arc(cx, cy, (CFG.heart.radius - 8) * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cx, cy, 7 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // Heart pips.
  for (let i = 0; i < CFG.heart.maxHits; i++) {
    ctx.fillStyle = i < state.heart ? '#ff5a6e' : 'rgba(255,90,110,0.25)';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♥', cx - 22 + i * 22, cy - CFG.heart.radius - 22);
  }
}

function drawOrreryMirrors(ctx, state) {
  for (const m of state.mirrors) {
    m.glow = Math.max(0, (m.glow || 0) - 0.04);
    ctx.fillStyle = '#4a3b22';
    ctx.beginPath();
    ctx.arc(m.x, m.y, CFG.mirrorRadius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = m.glow > 0.3 ? '#ffe9a8' : '#d9a441';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Mirror face: a bright line across the disc, perpendicular to its normal.
    const px = Math.cos(m.rot + Math.PI / 2);
    const py = Math.sin(m.rot + Math.PI / 2);
    ctx.strokeStyle = '#fff6c9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(m.x - px * 11, m.y - py * 11);
    ctx.lineTo(m.x + px * 11, m.y + py * 11);
    ctx.stroke();
    // Drag hint ring when the mouse is near.
    if (Math.hypot(state.mouse.x - m.x, state.mouse.y - m.y) < 26) {
      ctx.strokeStyle = 'rgba(255,233,168,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(m.x, m.y, CFG.mirrorRadius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawOrreryEmitters(ctx, state) {
  for (const e of CFG.emitters) {
    const flick = 0.7 + 0.3 * Math.sin(state.time * 5 + e.x);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, 40);
    g.addColorStop(0, `rgba(255,233,168,${0.5 * flick})`);
    g.addColorStop(1, 'rgba(255,233,168,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6c9';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOrreryMoths(ctx, state) {
  for (const mo of state.moths) {
    const flutter = Math.sin(state.time * 9 + mo.wobble) * 3;
    ctx.fillStyle = mo.burnT > 0 ? '#ffffff' : mo.tint;
    ctx.beginPath();
    ctx.ellipse(mo.x, mo.y + flutter, mo.radius, mo.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1030';
    ctx.beginPath();
    ctx.arc(mo.x - 4, mo.y + flutter - 2, 2.4, 0, Math.PI * 2);
    ctx.arc(mo.x + 4, mo.y + flutter - 2, 2.4, 0, Math.PI * 2);
    ctx.fill();
    // Wing flick.
    ctx.strokeStyle = 'rgba(201,140,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mo.x - 4, mo.y + flutter);
    ctx.lineTo(mo.x - 13, mo.y + flutter - 7);
    ctx.moveTo(mo.x + 4, mo.y + flutter);
    ctx.lineTo(mo.x + 13, mo.y + flutter - 7);
    ctx.stroke();
    if (mo.maxHp > 1) {
      ctx.fillStyle = '#ff8fa3';
      for (let i = 0; i < mo.maxHp; i++) {
        ctx.beginPath();
        ctx.arc(mo.x - (mo.maxHp - 1) * 4 + i * 8, mo.y + mo.radius + 6, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = i < mo.hp ? '#ff8fa3' : 'rgba(255,143,163,0.25)';
        ctx.fill();
      }
    }
    if (mo.latched) {
      ctx.fillStyle = '#ff5a6e';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DRAINING', mo.x, mo.y - mo.radius - 10);
    }
  }
}

function drawOrreryBoss(ctx, state) {
  const b = state.boss;
  if (!b || b.dead) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, b.radius + 30);
  g.addColorStop(0, 'rgba(139,92,246,0.35)');
  g.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius + 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#12081f';
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a86ef0';
  ctx.lineWidth = 3;
  ctx.stroke();
  // The eye.
  ctx.fillStyle = '#e0aaff';
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, 14, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#12081f';
  ctx.beginPath();
  ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrreryParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.fillStyle = p.tint;
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 - p.t / p.life) + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawOrreryFloaters(ctx, state) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of state.floaters) {
    const a = Math.max(0, 1 - f.t / 1.2);
    ctx.globalAlpha = a;
    ctx.fillStyle = f.tint;
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.fillText(f.text, f.x, f.y - f.t * 34);
  }
  ctx.globalAlpha = 1;
}

function drawOrreryHud(ctx, state) {
  const f = CFG.field;
  // ---- Top bar ----
  ctx.fillStyle = 'rgba(7,10,30,0.85)';
  ctx.fillRect(0, 0, CFG.width, 60);
  ctx.strokeStyle = 'rgba(217,164,65,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 60);
  ctx.lineTo(CFG.width, 60);
  ctx.stroke();
  // Left: title + night + dawn.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f2c14e';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText('ORRERY', 16, 26);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 13px system-ui, sans-serif';
  const dawnPct = state.screen === 'title' ? 1 : Math.max(0, state.dawnT / CFG.nightLength);
  ctx.fillText(`NIGHT ${state.night} / ${CFG.nights}   ☀ DAWN IN ${Math.ceil(Math.max(0, state.dawnT))}s`, 16, 48);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(120, 40, 150, 6);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(120, 40, 150 * dawnPct, 6);
  // Center: WIN / LOSE pills.
  const lit = litDialCount(state);
  pill(ctx, 470, 6, 340, 22, '#1d9e57', `WIN: light all ${CFG.dialCount} dials by final dawn  (${lit}/${CFG.dialCount})`, '700 13px system-ui, sans-serif');
  pill(ctx, 470, 32, 340, 22, '#c22744', 'LOSE: the heart breaks, or dawn finds dials dark', '700 13px system-ui, sans-serif');
  // Right: score + gears.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('SCORE', 1064, 20);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '800 24px system-ui, sans-serif';
  ctx.fillText(String(state.score), 1064, 46);
  ctx.fillStyle = '#ffd166';
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.fillText(`⚙ ${state.gears}`, 1240, 26);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(`BEST ${Math.max(state.best, state.score)}`, 1240, 48);
  // ---- Boss bar ----
  if (state.boss && !state.boss.dead) {
    const b = state.boss;
    const bw = 420;
    const bx = (CFG.width - bw) / 2;
    ctx.fillStyle = 'rgba(18,8,31,0.9)';
    roundRect(ctx, bx - 8, 68, bw + 16, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#e0aaff';
    ctx.font = '800 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, CFG.width / 2, 82);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(bx, 88, bw, 8);
    ctx.fillStyle = '#a86ef0';
    ctx.fillRect(bx, 88, bw * Math.max(0, b.hp / b.maxHp), 8);
  }
  // ---- Right panel ----
  const px = 1064;
  const pw = 216;
  ctx.fillStyle = 'rgba(7,10,30,0.8)';
  roundRect(ctx, px, 66, pw, 586, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,164,65,0.35)';
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2c14e';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.fillText('INCOMING', px + 12, 88);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 12px system-ui, sans-serif';
  const incoming = {};
  for (const mo of state.moths) incoming[mo.type] = (incoming[mo.type] || 0) + 1;
  const order = ['mote', 'lurker', 'bulwark', 'splitter'];
  let iy = 108;
  let shown = 0;
  for (const k of order) {
    if (!incoming[k]) continue;
    ctx.fillStyle = CFG.mothTypes[k].tint;
    ctx.fillText(`● ${k.toUpperCase()}`, px + 12, iy);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('×' + incoming[k], px + pw - 12, iy);
    ctx.textAlign = 'left';
    iy += 20;
    shown++;
  }
  if (shown === 0) {
    ctx.fillStyle = '#8a90b8';
    ctx.fillText('— the chart is quiet —', px + 12, iy);
    iy += 20;
  }
  ctx.fillStyle = '#f2c14e';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.fillText('DIALS  ' + lit + ' / ' + CFG.dialCount, px + 12, iy + 16);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('✦ lit dials hold the dawn', px + 12, iy + 36);
  // Relics.
  const ry = iy + 66;
  ctx.fillStyle = '#f2c14e';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.fillText('RELICS  ' + state.relicsHeld.length + '/6', px + 12, ry);
  ctx.font = '700 12px system-ui, sans-serif';
  if (state.relicsHeld.length === 0) {
    ctx.fillStyle = '#8a90b8';
    ctx.fillText('Clear a night to earn one.', px + 12, ry + 20);
  } else {
    let ryy = ry + 20;
    for (const r of state.relicsHeld) {
      ctx.fillStyle = '#ffd166';
      ctx.fillText('◆ ' + r.name, px + 12, ryy);
      ryy += 18;
    }
  }
  // Combo + grade. (Panel ends at y=652; keep the big letter inside it.)
  const gy = 512;
  ctx.fillStyle = '#f2c14e';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.fillText('COMBO', px + 12, gy);
  ctx.fillStyle = state.combo > 1 ? '#ffe9a8' : '#8a90b8';
  ctx.font = '800 30px system-ui, sans-serif';
  ctx.fillText('×' + state.combo, px + 12, gy + 32);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('chain burns to raise it', px + 12, gy + 50);
  ctx.fillStyle = '#f2c14e';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.fillText('GRADE', px + 12, gy + 76);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillText(orreryGrade(state.score), px + 12, gy + 110);
  // ---- Bottom bar ----
  ctx.fillStyle = 'rgba(7,10,30,0.85)';
  ctx.fillRect(0, 658, CFG.width, 62);
  ctx.strokeStyle = 'rgba(217,164,65,0.4)';
  ctx.beginPath();
  ctx.moveTo(0, 658);
  ctx.lineTo(CFG.width, 658);
  ctx.stroke();
  const cards = [
    { kind: 'prism', key: '1', name: 'PRISM', cost: CFG.buildCosts.prism, text: 'splits a beam in two', x0: 300 },
    { kind: 'lens', key: '2', name: 'LENS', cost: CFG.buildCosts.lens, text: 'beam ×2.5 here', x0: 430 },
    { kind: 'pillar', key: '3', name: 'PILLAR', cost: CFG.buildCosts.pillar, text: 'blocks moths', x0: 560 },
  ];
  for (const c of cards) {
    const afford = state.gears >= c.cost;
    const sel = state.selected === c.kind;
    ctx.fillStyle = sel ? '#3a2f1d' : 'rgba(255,255,255,0.06)';
    roundRect(ctx, c.x0, 664, 120, 48, 8);
    ctx.fill();
    ctx.strokeStyle = sel ? '#ffe9a8' : afford ? '#d9a441' : 'rgba(217,164,65,0.3)';
    ctx.lineWidth = sel ? 2.5 : 1.5;
    ctx.stroke();
    ctx.fillStyle = afford ? '#ffe9a8' : '#8a90b8';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`[${c.key}] ${c.name}  ⚙${c.cost}`, c.x0 + 8, 682);
    ctx.fillStyle = '#cdd3f5';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText(c.text, c.x0 + 8, 700);
  }
  // Flare.
  const flareReady = state.flareCd <= 0;
  ctx.fillStyle = flareReady ? '#3a2f1d' : 'rgba(255,255,255,0.05)';
  roundRect(ctx, 700, 664, 150, 48, 8);
  ctx.fill();
  ctx.strokeStyle = flareReady ? '#ffd166' : 'rgba(255,209,102,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = flareReady ? '#ffd166' : '#8a90b8';
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('[SPACE] FLARE', 712, 682);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText(flareReady ? 'nova: burns moths by the heart' : `recharging ${Math.ceil(state.flareCd)}s`, 712, 700);
  // Controls hint.
  ctx.fillStyle = '#8a90b8';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DRAG mirror to aim  ·  CLICK chart to build', 16, 682);
  ctx.fillText('Beams burn moths — light every dial.', 16, 702);
  // Selected-build ghost at the cursor.
  if (state.selected && state.screen === 'play' && state.mouse.x > f.left && state.mouse.x < f.right && state.mouse.y > f.top && state.mouse.y < f.bottom) {
    ctx.strokeStyle = 'rgba(255,233,168,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(state.mouse.x, state.mouse.y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawOrreryFlash(ctx, state) {
  const fl = state.flash;
  if (!fl) return;
  const a = Math.max(0, 1 - fl.t / 2.2);
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillText(fl.text, CFG.width / 2, 150);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText(fl.sub || '', CFG.width / 2, 176);
  ctx.globalAlpha = 1;
}

function dimOverlay(ctx) {
  ctx.fillStyle = 'rgba(4,6,18,0.72)';
  ctx.fillRect(0, 0, CFG.width, CFG.height);
}

function drawOrreryTitle(ctx, state) {
  dimOverlay(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2c14e';
  ctx.font = '800 84px system-ui, sans-serif';
  ctx.fillText('ORRERY', CFG.width / 2, 210);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('— LIGHT THE NINE DIALS —', CFG.width / 2, 252);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText('A clockwork star-chart. Starlight pours in from the corners — bend it with mirrors,', CFG.width / 2, 300);
  ctx.fillText('burn the void moths in it, and light every sundial before the final dawn.', CFG.width / 2, 324);
  pill(ctx, CFG.width / 2 - 330, 348, 660, 30, '#1d9e57', 'WIN: light all 9 dials by the end of night 7', '700 15px system-ui, sans-serif');
  pill(ctx, CFG.width / 2 - 330, 384, 660, 30, '#c22744', 'LOSE: the heart takes 3 hits, or dawn finds dials dark', '700 15px system-ui, sans-serif');
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText('DRAG mirrors to aim  ·  1 / 2 / 3 build prism, lens, pillar  ·  SPACE flare  ·  P pause  ·  R restart', CFG.width / 2, 452);
  const blink = 0.6 + 0.4 * Math.sin(state.time * 4);
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '800 24px system-ui, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', CFG.width / 2, 510);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#8a90b8';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('7 nights · 6 relics · 1 boss: THE ECLIPSE', CFG.width / 2, 548);
}

function drawOrreryRelic(ctx, state) {
  dimOverlay(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillText(`NIGHT ${state.night - 1} CLEARED`, CFG.width / 2, 150);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText('The dawn holds. Choose one relic before the next night.', CFG.width / 2, 182);
  const cards = state.relicOffer;
  const cw = 300;
  const gap = 24;
  const total = cards.length * cw + (cards.length - 1) * gap;
  let x = (CFG.width - total) / 2;
  for (let i = 0; i < cards.length; i++) {
    const r = cards[i];
    const y = 240;
    ctx.fillStyle = '#1c2454';
    roundRect(ctx, x, y, cw, 220, 12);
    ctx.fill();
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillText('◆', x + cw / 2, y + 52);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '800 19px system-ui, sans-serif';
    ctx.fillText(r.name, x + cw / 2, y + 92);
    ctx.fillStyle = '#cdd3f5';
    ctx.font = '700 14px system-ui, sans-serif';
    wrapOrreryText(ctx, r.text, x + cw / 2, y + 126, cw - 36, 20);
    ctx.fillStyle = '#8a90b8';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText(`CLICK CARD ${i + 1}`, x + cw / 2, y + 196);
    x += cw + gap;
  }
}

function wrapOrreryText(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      line = w;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}

function drawOrreryEnd(ctx, state, won) {
  dimOverlay(ctx);
  ctx.textAlign = 'center';
  if (won) {
    ctx.fillStyle = '#2fd07a';
    ctx.font = '800 76px system-ui, sans-serif';
    ctx.fillText('WIN!', CFG.width / 2, 220);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText('All nine dials lit — the orrery sings again.', CFG.width / 2, 262);
  } else {
    ctx.fillStyle = '#ff5a6e';
    ctx.font = '800 76px system-ui, sans-serif';
    ctx.fillText('LOSE', CFG.width / 2, 220);
    ctx.fillStyle = '#ffd0d8';
    ctx.font = '700 22px system-ui, sans-serif';
    const reason = state.heart <= 0 ? 'The heart went dark under the moths.' : 'Dawn came and dials still stood dark.';
    ctx.fillText(reason, CFG.width / 2, 262);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 30px system-ui, sans-serif';
  ctx.fillText(`SCORE  ${state.score}`, CFG.width / 2, 330);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText(`GRADE  ${orreryGrade(state.score)}`, CFG.width / 2, 388);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText(`Moths burned ${state.stats.burns}  ·  Dials lit ${state.stats.dialsLit}  ·  Nights cleared ${state.stats.nightsCleared}  ·  Best combo ×${state.comboMax}`, CFG.width / 2, 436);
  const blink = 0.6 + 0.4 * Math.sin(state.time * 4);
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText('PRESS R TO PLAY AGAIN', CFG.width / 2, 500);
  ctx.globalAlpha = 1;
}

function drawOrreryPaused(ctx, state) {
  dimOverlay(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '800 54px system-ui, sans-serif';
  ctx.fillText('PAUSED', CFG.width / 2, 330);
  ctx.fillStyle = '#cdd3f5';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText('Press P to resume  ·  R to restart', CFG.width / 2, 372);
}
