import {describe,it,expect} from 'vitest';
import {roundWinner,ROSTER,EXPANDED_FIGHTERS,combosFor,finishersFor} from './data';
describe('round resolution',()=>{
 it('awards time-up to more remaining health',()=>{expect(roundWinner(75,30)).toBe('p1');expect(roundWinner(10,45)).toBe('p2');});
 it('does not silently award identical health to player two',()=>expect(roundWinner(45,45)).toBe('draw'));
 it('awards knockouts correctly',()=>{expect(roundWinner(0,20)).toBe('p2');expect(roundWinner(20,0)).toBe('p1');});
});
describe('roster expansion',()=>{
 it('adds fifty selectable fighters',()=>{expect(EXPANDED_FIGHTERS).toHaveLength(50);expect(new Set(ROSTER.map(f=>f.id)).size).toBe(57);});
 it('provides twenty combo inputs and finishers per fighter',()=>{for(const f of ROSTER){expect(combosFor(f)).toHaveLength(20);expect(finishersFor(f)).toHaveLength(20);}});
});