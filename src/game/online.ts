// Pure online-tournament rules shared by the client and server functions.
export interface Ghost { name: string; fighterId: string; wins: number; bot: boolean }
export interface DuelResult { won: boolean; health: number; damage: number; time: number }

export const ONLINE_STAGES = 8;
const BOT_NAMES = ["SHADOW_BOT","IRON_BOT","EMBER_BOT","FROST_BOT","STORM_BOT","VENOM_BOT","JADE_BOT","DUSK_BOT"];

export function cleanName(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9_ ]/g, "").trim().slice(0, 14);
}

/** Fill a bracket with real player ghosts first, bots for empty slots. */
export function buildBracket(players: Ghost[], fighterIds: string[], rand: () => number = Math.random): Ghost[] {
  const out = players.slice(0, ONLINE_STAGES);
  let i = 0;
  while (out.length < ONLINE_STAGES) {
    const fighterId = fighterIds[Math.floor(rand() * fighterIds.length)] ?? fighterIds[0] ?? "";
    out.push({ name: BOT_NAMES[i++ % BOT_NAMES.length] ?? "BOT", fighterId, wins: Math.floor(rand() * 4), bot: true });
  }
  return out;
}

/** Duel winner: win beats loss, then more health left, then more damage, then faster. */
export function duelWinner(host: DuelResult, guest: DuelResult): "host" | "guest" | "draw" {
  if (host.won !== guest.won) return host.won ? "host" : "guest";
  if (host.health !== guest.health) return host.health > guest.health ? "host" : "guest";
  if (host.damage !== guest.damage) return host.damage > guest.damage ? "host" : "guest";
  if (host.time !== guest.time) return host.time < guest.time ? "host" : "guest";
  return "draw";
}
