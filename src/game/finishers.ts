import type { FighterDef } from './data';
import type { Pose } from './sprites';

export type FinishEffect = 'ravens' | 'burial' | 'magma' | 'tide' | 'hunt' | 'hellfire' | 'ice' | 'thunder' | 'crush' | 'blades' | 'iron' | 'throne';
export const FINISH_TIMING = { windup: 60, impact: 180, end: 300, ready: 480 } as const;
const signatures: Record<string, { name: string; effect: FinishEffect; aftermath: string }> = {
  vesper: { name: 'Nightfall Requiem', effect: 'ravens', aftermath: 'CLAIMED BY THE RAVENS' },
  aegis: { name: 'Bastion Burial', effect: 'burial', aftermath: 'ENTOMBED BENEATH THE ARENA' },
  calder: { name: 'Caldera Cremation', effect: 'magma', aftermath: 'REDUCED TO CINDERS' },
  nymira: { name: 'Abyssal Undertow', effect: 'tide', aftermath: 'TAKEN BY THE DEEP' },
  oryx: { name: 'Predator Execution', effect: 'hunt', aftermath: 'IONIZED BY THE HUNTER' },
  scorpan: { name: 'Hellfire Ascension', effect: 'hellfire', aftermath: 'ONLY ASH REMAINS' },
  frostek: { name: 'Glacial Tomb', effect: 'ice', aftermath: 'FROZEN AND SHATTERED' },
  raidon: { name: 'Thunder Judgment', effect: 'thunder', aftermath: 'STRUCK DOWN BY THUNDER' },
  kanta: { name: 'Fourfold Cataclysm', effect: 'crush', aftermath: 'CRUSHED INTO THE CRATER' },
  mirella: { name: 'Crimson Sai Eclipse', effect: 'blades', aftermath: 'FALLEN TO THE TWIN BLADES' },
  jaxon: { name: 'Iron Funeral', effect: 'iron', aftermath: 'BURIED BY THE IRON FISTS' },
  khaos: { name: 'Emperor’s Last Decree', effect: 'throne', aftermath: 'SEALED BENEATH THE THRONE' },
};
export function signatureFor(fighter: FighterDef) {
  const signature = signatures[fighter.skinId ?? fighter.id] ?? signatures.khaos;
  if (!signature) throw new Error('Missing finisher signature');
  return { ...signature, name: fighter.skinId ? `${fighter.name} ${signature.name}` : signature.name, color: fighter.specials[0]?.color ?? fighter.color };
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function finishStage(tick: number): 'windup' | 'execution' | 'aftermath' | 'complete' {
  return tick < FINISH_TIMING.windup ? 'windup' : tick < FINISH_TIMING.impact ? 'execution' : tick < FINISH_TIMING.end ? 'aftermath' : 'complete';
}
export function victimVisual(effect: FinishEffect, tick: number) {
  const attack = clamp((tick - 60) / 120), aftermath = clamp((tick - 180) / 55);
  const buried = ['burial', 'iron', 'throne', 'crush'].includes(effect);
  const dissolved = ['ravens', 'magma', 'hellfire', 'hunt', 'tide'].includes(effect);
  return {
    rotation: tick < 60 ? Math.sin(tick * .12) * .065 : buried ? attack * .15 : attack * -.4 + aftermath * -1.1,
    offsetX: tick < 60 ? Math.sin(tick * .12) * 6 : Math.sin(tick * .8) * 7 * (1 - aftermath),
    offsetY: buried ? attack * 235 : effect === 'tide' ? -Math.sin(attack * Math.PI) * 80 : effect === 'thunder' || effect === 'hunt' ? -Math.sin(attack * Math.PI) * 55 : 0,
    opacity: dissolved || effect === 'ice' ? 1 - aftermath : 1,
    buried,
    frozen: effect === 'ice' && tick >= 60,
    pose: (tick < 60 ? 'idle' : 'hit') as Pose,
  };
}
export function executionPose(effect: FinishEffect, tick: number): Pose {
  if (tick >= 180) return 'victory';
  if (tick < 60) return 'block';
  if (['burial', 'crush', 'iron', 'throne'].includes(effect)) return tick < 105 ? 'uppercut' : 'crouch';
  if (['ravens', 'blades', 'hunt'].includes(effect)) return Math.floor((tick - 60) / 24) % 2 ? 'kick' : 'strike';
  return 'strike';
}