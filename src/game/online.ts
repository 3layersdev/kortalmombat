// Shared online-play constants.
export const ONLINE_STAGES = 8;
export function cleanName(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9_ ]/g, "").trim().slice(0, 14);
}

/** Silence longer than this pauses a live fight for both players. */
export const NET_STALL_MS = 1500;
/** After this long without reconnecting, the duel is decided. */
export const NET_TIMEOUT_MS = 20000;
/** Fair end after a lost connection: more remaining health wins, equal health is a draw. */
export function netVerdict(hostHealthPct: number, guestHealthPct: number, iAmGuest: boolean): "win" | "loss" | "draw" {
  const h = Math.round(hostHealthPct), g = Math.round(guestHealthPct);
  if (h === g) return "draw";
  return (h > g) !== iAmGuest ? "win" : "loss";
}
