import {describe,it,expect} from 'vitest';
import {roundWinner,ROSTER,EXPANDED_FIGHTERS,ORIGINAL_FIGHTERS,combosFor,finishersFor} from './data';
import {ALL_POSES,WALK_POSES,posesFor,motionPose,spriteUrl} from './sprites';
import {ARENAS} from './data';
import {arenaArt} from './scenery';
describe('round resolution',()=>{
 it('awards time-up to more remaining health',()=>{expect(roundWinner(75,30)).toBe('p1');expect(roundWinner(10,45)).toBe('p2');});
 it('does not silently award identical health to player two',()=>expect(roundWinner(45,45)).toBe('draw'));
 it('awards knockouts correctly',()=>{expect(roundWinner(0,20)).toBe('p2');expect(roundWinner(20,0)).toBe('p1');});
});
describe('roster expansion',()=>{
 it('keeps four additional skin-matched walk frames available for all 62 fighters',()=>{expect(WALK_POSES).toHaveLength(4);for(const f of ROSTER)for(const pose of WALK_POSES)expect(spriteUrl(f.skinId??f.id,pose),`${f.id} ${pose}`).not.toBe('');});
 it('cycles the walk poses without changing combat state',()=>{expect([0,6,12,18,24].map(t=>motionPose('walk',t,0,'frostek'))).toEqual(['walk1','walk2','walk3','walk4','walk1']);});
 it('gives Vesper separate anticipation and recovery assets',()=>{expect(posesFor('vesper')).toHaveLength(20);expect(motionPose('strike',0,16,'vesper')).toBe('punchwind');expect(motionPose('strike',0,4,'vesper')).toBe('punchrecover');for(const pose of ['punchwind','punchrecover','kickwind','kickrecover'] as const)expect(spriteUrl('vesper',pose)).not.toBe('');});
 it('uses a distinct painting for every fight location',()=>{expect(ARENAS).toHaveLength(10);expect(new Set(ARENAS.map(arenaArt)).size).toBe(ARENAS.length);});
 it('keeps fifty variants and adds five original fighters',()=>{expect(EXPANDED_FIGHTERS).toHaveLength(50);expect(ORIGINAL_FIGHTERS).toHaveLength(5);expect(new Set(ROSTER.map(f=>f.id)).size).toBe(62);expect(ORIGINAL_FIGHTERS.every(f=>!f.skinId)).toBe(true);});
 it('provides twenty combo inputs and finishers per fighter',()=>{for(const f of ROSTER){expect(combosFor(f)).toHaveLength(20);expect(finishersFor(f)).toHaveLength(20);}});
 it('provides all twelve real pose assets for every selectable fighter',()=>{expect(ALL_POSES).toHaveLength(12);for(const f of ROSTER)for(const pose of ALL_POSES)expect(spriteUrl(f.skinId??f.id,pose),`${f.id} ${pose}`).not.toBe('');});
 it('gives each original fighter distinct combos and its own tactical special types',()=>{expect(new Set(ORIGINAL_FIGHTERS.map(f=>JSON.stringify(combosFor(f).map(c=>c.input)))) .size).toBe(5);for(const f of ROSTER){const combos=combosFor(f);expect(new Set(combos.map(c=>c.input.join(','))).size).toBe(20);for(const c of combos){expect(f.specials.some(s=>s.type===c.type)).toBe(true);expect(c.damage).toBeLessThanOrEqual(14);}}});
});