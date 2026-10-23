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
  // Expanded fighters — one unique signature each, effect matched to their skin family.
  ashen: { name: 'Pyre of the Dawn', effect: 'hellfire', aftermath: 'SCATTERED TO THE WINDS' },
  cinder: { name: 'Whiteout Verdict', effect: 'ice', aftermath: 'SHATTERED INTO DIAMOND DUST' },
  vex: { name: 'Storm’s Final Answer', effect: 'thunder', aftermath: 'UNMADE BY THE LIGHTNING' },
  onyx: { name: 'Obsidian Avalanche', effect: 'crush', aftermath: 'GROUND INTO THE STONE' },
  nyx: { name: 'Midnight Dissection', effect: 'blades', aftermath: 'UNDONE IN THE DARK' },
  solaris: { name: 'Solar Anvil', effect: 'iron', aftermath: 'HAMMERED INTO OBLIVION' },
  tempest: { name: 'Cyclone of Cinders', effect: 'hellfire', aftermath: 'BURNED FROM THE SKY' },
  zenith: { name: 'Apex Frostfall', effect: 'ice', aftermath: 'BURIED UNDER THE GLACIER' },
  revenant: { name: 'Grave Lightning', effect: 'thunder', aftermath: 'STRUCK BACK INTO THE GRAVE' },
  kira: { name: 'Titan’s Guillotine', effect: 'crush', aftermath: 'BROKEN BENEATH THE BLADE OF STONE' },
  raven: { name: 'Feast of Wings', effect: 'blades', aftermath: 'PICKED CLEAN BY THE FLOCK' },
  talon: { name: 'Iron Talon Drop', effect: 'iron', aftermath: 'CRUSHED IN THE IRON GRIP' },
  rift: { name: 'Inferno Between Worlds', effect: 'hellfire', aftermath: 'CONSUMED BETWEEN WORLDS' },
  ember: { name: 'Last Spark Supper', effect: 'ice', aftermath: 'EXTINGUISHED IN FROST' },
  sable: { name: 'Blackout Execution', effect: 'thunder', aftermath: 'ERASED BY THE STORM' },
  orion: { name: 'Hunter’s Meteor', effect: 'crush', aftermath: 'FELLED BY A FALLING STAR' },
  valkyr: { name: 'Wings of Judgment', effect: 'blades', aftermath: 'CARRIED OFF BY THE VALKYRIES' },
  havoc: { name: 'Wrecking Psalm', effect: 'iron', aftermath: 'FLATTENED BY THE WAR HYMN' },
  storm: { name: 'Eye of Ruin', effect: 'hellfire', aftermath: 'NOTHING LEFT IN THE EYE' },
  blaze: { name: 'Frozen Wildfire', effect: 'ice', aftermath: 'A FLAME SEALED IN ICE' },
  shiver: { name: 'Cold Snap Kill', effect: 'thunder', aftermath: 'SNAPPED BY FROST AND THUNDER' },
  volt: { name: 'Overload Crush', effect: 'crush', aftermath: 'SHORT-CIRCUITED UNDERFOOT' },
  echo: { name: 'Screaming Silence', effect: 'blades', aftermath: 'SILENCED BY A THOUSAND CUTS' },
  dread: { name: 'Iron Nightmare', effect: 'iron', aftermath: 'BURIED ALIVE IN IRON' },
  jade: { name: 'Emerald Immolation', effect: 'hellfire', aftermath: 'ASHES AMONG THE LEAVES' },
  raze: { name: 'Demolition Frost', effect: 'ice', aftermath: 'RAZED TO FROZEN RUBBLE' },
  akira: { name: 'Rising Thunder God', effect: 'thunder', aftermath: 'JUDGED BY THE STORM GOD' },
  nova: { name: 'Supernova Collapse', effect: 'crush', aftermath: 'COLLAPSED INTO A DEAD STAR' },
  vulcan: { name: 'Forge of Blood', effect: 'blades', aftermath: 'FORGED INTO A WARNING' },
  spectre: { name: 'Phantom Iron Vice', effect: 'iron', aftermath: 'CRUSHED BY UNSEEN HANDS' },
  kobra: { name: 'Venom Fire Fang', effect: 'hellfire', aftermath: 'DEVOURED BY FIRE AND FANG' },
  rush: { name: 'Avalanche Express', effect: 'ice', aftermath: 'RUN DOWN BY THE AVALANCHE' },
  ivory: { name: 'Pale Thunder Hunt', effect: 'thunder', aftermath: 'STRUCK DOWN IN THE OPEN' },
  azura: { name: 'Sapphire Skyfall', effect: 'crush', aftermath: 'BURIED UNDER A FALLEN SKY' },
  kazan: { name: 'Volcano’s Teeth', effect: 'blades', aftermath: 'CHEWED UP BY THE MOUNTAIN' },
  morrow: { name: 'Funeral Bell Toll', effect: 'iron', aftermath: 'TOLLED INTO THE EARTH' },
  strix: { name: 'Owl of Endings', effect: 'hellfire', aftermath: 'TAKEN IN THE NIGHT' },
  fang: { name: 'Glacier Bite', effect: 'ice', aftermath: 'TORN APART BY THE COLD' },
  warden: { name: 'Prison of Thunder', effect: 'thunder', aftermath: 'EXECUTED IN THE STORM CELL' },
  vigil: { name: 'Final Watch', effect: 'crush', aftermath: 'CRUSHED ON THE LAST WATCH' },
  nox: { name: 'Eclipse of Knives', effect: 'blades', aftermath: 'CARVED BENEATH THE ECLIPSE' },
  fury: { name: 'Wrath of the Anvil', effect: 'iron', aftermath: 'BEATEN INTO THE DIRT' },
  sakura: { name: 'Petal Pyre', effect: 'hellfire', aftermath: 'PETALS AND ASHES FALL TOGETHER' },
  kryo: { name: 'Absolute Zero Hour', effect: 'ice', aftermath: 'FROZEN AT ZERO HOUR' },
  hollow: { name: 'Empty Thunder', effect: 'thunder', aftermath: 'HOLLOWED OUT BY LIGHTNING' },
  titan: { name: 'Worldbreaker Stomp', effect: 'crush', aftermath: 'BROKEN WITH THE WORLD' },
  rune: { name: 'Blade of Old Runes', effect: 'blades', aftermath: 'SLAIN BY THE ANCIENT SCRIPT' },
  zeal: { name: 'Martyr’s Iron Pyre', effect: 'iron', aftermath: 'CRUCIFIED ON IRON' },
  venom: { name: 'Cauldron of Fangs', effect: 'hellfire', aftermath: 'BOILED IN VENOM AND FIRE' },
  inferna: { name: 'Frozen Hell', effect: 'ice', aftermath: 'HELL FROZE OVER' },
};
export function signatureFor(fighter: FighterDef) {
  const signature = signatures[fighter.id];
  if (!signature) throw new Error(`Missing finisher signature for ${fighter.id}`);
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