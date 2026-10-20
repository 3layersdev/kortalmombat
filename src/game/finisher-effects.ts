import type { FinishEffect } from './finishers';
import { FINISH_TIMING } from './finishers';

// The victim remains the actual selected sprite; these effects wrap its silhouette.
export function drawFinisherEffects(ctx: CanvasRenderingContext2D, effect: FinishEffect, tick: number, x: number, attackerX: number, ground: number, color: string, variant: number) {
  if (tick < FINISH_TIMING.windup) return;
  const progress = Math.min(1, (tick - 60) / 120), after = tick >= 180;
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4;
  const ellipse = (y: number, rx: number, ry: number) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); };
  if (['burial', 'iron', 'crush', 'throne'].includes(effect)) {
    ctx.globalAlpha = .85; ellipse(ground, 80 + progress * 25, 14);
    for (let i = 0; i < 9; i++) {
      const dx = (i - 4) * 21, rise = after ? 0 : Math.sin(progress * Math.PI) * (30 + i % 3 * 20);
      ctx.fillRect(x + dx - 7, ground - rise, 14, 12 + rise);
    }
    if (after) {
      ctx.fillRect(x - 75, ground - 7, 150, 14);
      if (effect === 'throne' || effect === 'burial') { ctx.fillRect(x - 27, ground - 77, 54, 70); ctx.strokeRect(x - 35, ground - 85, 70, 78); }
    }
  } else if (effect === 'ice') {
    if (!after) {
      ctx.globalAlpha = .3 + progress * .4;
      ctx.beginPath(); ctx.moveTo(x - 60, ground); ctx.lineTo(x - 78, ground - 155); ctx.lineTo(x, ground - 242); ctx.lineTo(x + 65, ground - 155); ctx.lineTo(x + 55, ground); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    }
    for (let i = 0; i < 18; i++) {
      const angle = i * 2.4, spread = after ? Math.min(1, (tick - 180) / 35) : 0;
      const dx = Math.sin(angle) * 100 * spread, dy = after ? ground - 100 + Math.cos(angle) * 100 * spread + (tick - 180) * 1.3 : ground - i * 12;
      ctx.save(); ctx.translate(x + dx, Math.min(ground - 4, dy)); ctx.rotate(angle); ctx.fillRect(-4, -10, 8, 20); ctx.restore();
    }
  } else if (['hellfire', 'magma'].includes(effect)) {
    if (!after) for (let i = 0; i < 11; i++) {
      const height = (70 + Math.sin(tick * .17 + i) * 35) * (1 + progress);
      ctx.globalAlpha = .65; ctx.beginPath(); ctx.moveTo(x - 65 + i * 12, ground); ctx.quadraticCurveTo(x - 80 + i * 12, ground - height * .5, x - 55 + i * 12, ground - height); ctx.quadraticCurveTo(x - 30 + i * 12, ground - height * .4, x - 45 + i * 12, ground); ctx.fill();
    }
    if (after) { ctx.globalAlpha = .6; ctx.beginPath(); ctx.ellipse(x, ground - 3, 58, 9, 0, 0, 7); ctx.fill(); }
  } else if (effect === 'tide') {
    ctx.globalAlpha = after ? .45 : .8;
    for (let i = 0; i < (after ? 2 : 8); i++) ellipse(ground - (after ? 0 : i * 27), 70 + Math.sin(tick * .12 + i) * 18, 10);
  } else if (effect === 'thunder' || effect === 'hunt') {
    if (!after) {
      ctx.lineWidth = effect === 'hunt' ? 7 : 4;
      for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(effect === 'hunt' ? attackerX : x + (j - 1) * 70, effect === 'hunt' ? ground - 125 : 50); for (let i = 0; i < 8; i++) ctx.lineTo(x + Math.sin(tick * .3 + i * 6 + j) * 25, 100 + i * 45); ctx.stroke(); }
      if (effect === 'hunt') { ellipse(ground - 115, 75, 75); ctx.fillRect(x - 95, ground - 117, 190, 3); }
    } else { ellipse(ground, 60, 9); }
  } else if (effect === 'ravens' || effect === 'blades') {
    for (let i = 0; i < 10; i++) {
      const angle = tick * .09 + i * .63 + variant * .1, spread = after ? Math.min(2, 1 + (tick - 180) / 60) : 1 - progress * .3;
      const px = x + Math.cos(angle) * 90 * spread, py = ground - 105 + Math.sin(angle) * 95 * spread;
      ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
      ctx.beginPath(); if (effect === 'ravens') { ctx.moveTo(-18, -8); ctx.lineTo(0, 4); ctx.lineTo(18, -8); ctx.lineTo(5, 10); ctx.lineTo(-5, 10); } else { ctx.moveTo(-25, 0); ctx.lineTo(16, -4); ctx.lineTo(27, 0); ctx.lineTo(16, 4); } ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  // Persistent sparks/debris make the final state readable after the impact.
  for (let i = 0; i < 16; i++) {
    const age = (tick + i * 13) % 70;
    ctx.globalAlpha = after ? .5 * (1 - age / 70) : .8;
    ctx.fillRect(x + Math.sin(i * 31 + variant) * (after ? 65 : 85), ground - (after ? age * .5 : age * 3), 3, 5);
  }
  ctx.restore();
}