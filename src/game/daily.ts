import { ROSTER, MODES, type GameMode } from './data';
import type { MatchStats } from './Arena';

export type GoalKind = 'fighter' | 'combo' | 'flawless' | 'mode';
export interface DailyGoal { id: string; kind: GoalKind; label: string; reward: number; target: string | number }
export interface DailyProgress { day: string; done: string[]; koins: number; claimed: string[] }

export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

function seeded(day: string) {
  let h = 2166136261;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 100000) / 100000; };
}

/** Three deterministic goals per calendar day (UTC). */
export function dailyGoals(day: string): DailyGoal[] {
  const r = seeded(day);
  const f = ROSTER[Math.floor(r() * ROSTER.length)]!;
  const combo = 3 + Math.floor(r() * 4);
  const modes = MODES.filter(m => m.id !== 'training');
  const m = modes[Math.floor(r() * modes.length)]!;
  const hp = [50, 60, 70, 80][Math.floor(r() * 4)];
  const third: DailyGoal = r() < 0.5
    ? { id: `${day}-hp`, kind: 'flawless', label: `Win with ${hp}%+ health left`, reward: 200, target: hp }
    : { id: `${day}-mode`, kind: 'mode', label: `Win a fight in ${m.name}`, reward: 200, target: m.id };
  return [
    { id: `${day}-f`, kind: 'fighter', label: `Win with ${f.name}`, reward: 300, target: f.id },
    { id: `${day}-c`, kind: 'combo', label: `Land a ${combo}-hit combo`, reward: 150, target: combo },
    third,
  ];
}

/** Returns ids of goals satisfied by this match. Training never counts. */
export function completedBy(goals: DailyGoal[], won: boolean, s: MatchStats, fighterId: string, mode: GameMode): string[] {
  if (mode === 'training') return [];
  return goals.filter(g => {
    if (g.kind === 'combo') return s.bestCombo >= (g.target as number);
    if (!won) return false;
    if (g.kind === 'fighter') return fighterId === g.target;
    if (g.kind === 'flawless') return s.remainingHealth >= (g.target as number);
    return mode === g.target;
  }).map(g => g.id);
}

const KEY = 'kortal-daily';
export function loadProgress(day: string): DailyProgress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '') as DailyProgress;
    return p.day === day ? p : { day, done: [], claimed: [], koins: p.koins ?? 0 };
  } catch { return { day, done: [], claimed: [], koins: 0 }; }
}
export function saveProgress(p: DailyProgress) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable */ } }

/** Claim reward for a finished goal once; all three finished grants a +250 bonus. */
export function claim(p: DailyProgress, goals: DailyGoal[], id: string): DailyProgress {
  const g = goals.find(x => x.id === id);
  if (!g || !p.done.includes(id) || p.claimed.includes(id)) return p;
  const claimed = [...p.claimed, id];
  const bonus = claimed.length === goals.length ? 250 : 0;
  return { ...p, claimed, koins: p.koins + g.reward + bonus };
}
