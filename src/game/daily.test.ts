import {describe,it,expect} from 'vitest';
import {dailyGoals,completedBy,claim} from './daily';
const s={rounds:'2 — 0',damage:90,hits:20,bestCombo:7,remainingHealth:100,time:40};
describe('daily challenges',()=>{
 it('gives three stable goals per day',()=>{expect(dailyGoals('2026-11-01')).toHaveLength(3);expect(dailyGoals('2026-11-01')).toEqual(dailyGoals('2026-11-01'));});
 it('fighter goal needs a win with that fighter',()=>{const g=dailyGoals('2026-11-01');const fid=g[0]!.target as string;expect(completedBy(g,true,s,fid,'quick')).toContain(g[0]!.id);expect(completedBy(g,false,s,fid,'quick')).not.toContain(g[0]!.id);});
 it('training never counts',()=>{const g=dailyGoals('2026-11-01');expect(completedBy(g,true,s,g[0]!.target as string,'training')).toEqual([]);});
 it('rewards once, with 250 bonus for all three',()=>{const g=dailyGoals('2026-11-01');let p={day:'2026-11-01',done:g.map(x=>x.id),claimed:[] as string[],koins:0};p=claim(p,g,g[0]!.id);p=claim(p,g,g[0]!.id);expect(p.koins).toBe(300);p=claim(p,g,g[1]!.id);p=claim(p,g,g[2]!.id);expect(p.koins).toBe(300+150+200+250);});
});
