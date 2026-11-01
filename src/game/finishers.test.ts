import { describe, expect, it } from 'vitest';
import { ROSTER, finishersFor } from './data';
import { signatureFor, victimVisual, finishStage, FINISH_TIMING } from './finishers';

describe('signature finishers', () => {
  it('gives every fighter a named signature and a visible victim outcome', () => {
    for (const fighter of ROSTER) {
      const finish = finishersFor(fighter)[0];
      expect(finish?.name).toContain(fighter.name);
      expect(finish?.aftermath.length).toBeGreaterThan(0);
      expect(finish?.effect).toBe(signatureFor(fighter).effect);
    }
    expect(new Set(ROSTER.filter(f=>!f.skinId).map(f=>signatureFor(f).effect)).size).toBe(12);
  });
  it('gives every fighter a unique signature name and aftermath', () => {
    const names = ROSTER.map(f => signatureFor(f).name);
    const aftermaths = ROSTER.map(f => signatureFor(f).aftermath);
    expect(new Set(names).size).toBe(ROSTER.length);
    expect(new Set(aftermaths).size).toBe(ROSTER.length);
  });
  it('keeps the victim upright and swaying before execution', () => {
    const a = victimVisual('ice', 0), b = victimVisual('ice', 15);
    expect(a.pose).toBe('idle'); expect(b.pose).toBe('idle');
    expect(a.opacity).toBe(1);expect(b.opacity).toBe(1);
    expect(a.rotation).not.toBe(b.rotation);expect(b.offsetY).toBe(0);
  });
  it('leaves visible ice fragments, ash, burials or a fallen body instead of restoring the enemy', () => {
    expect(victimVisual('ice',240).opacity).toBe(0);
    expect(victimVisual('hellfire',240).opacity).toBe(0);
    expect(victimVisual('burial',240).offsetY).toBe(235);
    expect(victimVisual('blades',240).rotation).toBeLessThan(-1);
  });
  it('runs the entire cinematic and aftermath before completing the match', () => {
    expect(finishStage(0)).toBe('windup');expect(finishStage(60)).toBe('execution');
    expect(finishStage(180)).toBe('aftermath');expect(finishStage(299)).toBe('aftermath');
    expect(finishStage(FINISH_TIMING.end)).toBe('complete');
  });
});