// Shared online-play constants.
export const ONLINE_STAGES = 8;
export function cleanName(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9_ ]/g, "").trim().slice(0, 14);
}
