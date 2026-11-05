import { createServerFn } from "@tanstack/react-start";
import { cleanName, type DuelResult } from "./online";

const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
const str = (v: unknown, max = 40) => {
  if (typeof v !== "string" || !v.trim()) throw new Error("Invalid input");
  return v.trim().slice(0, max);
};
const nameOf = (v: unknown) => { const n = cleanName(str(v)); if (!n) throw new Error("Name required"); return n; };
const result = (v: unknown): DuelResult => {
  const r = (v ?? {}) as Record<string, unknown>;
  const n = (x: unknown, m: number) => Math.max(0, Math.min(m, Math.round(Number(x) || 0)));
  return { won: r.won === true, health: n(r.health, 100), damage: n(r.damage, 999), time: n(r.time, 999) };
};

export const findRivals = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string }) => ({ name: nameOf(d.name) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db.from("online_ghosts").select("player_name,fighter_id,wins")
      .neq("player_name", data.name).order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    const seen = new Set<string>(); const unique = [];
    for (const r of rows ?? []) { if (seen.has(r.player_name)) continue; seen.add(r.player_name); unique.push(r); }
    unique.sort(() => Math.random() - 0.5);
    return unique.slice(0, 8).map(r => ({ name: r.player_name, fighterId: r.fighter_id, wins: r.wins, bot: false }));
  });

export const recordRun = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; fighterId: string; wins: number }) => ({
    name: nameOf(d.name), fighterId: str(d.fighterId), wins: Math.max(0, Math.min(8, Math.round(Number(d.wins) || 0))),
  }))
  .handler(async ({ data }) => {
    const { error } = await (await admin()).from("online_ghosts").insert({ player_name: data.name, fighter_id: data.fighterId, wins: data.wins });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const lobbyCols = "code,host_name,host_fighter,host_result,guest_name,guest_fighter,guest_result";

export const createLobby = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; fighterId: string }) => ({ name: nameOf(d.name), fighterId: str(d.fighterId) }))
  .handler(async ({ data }) => {
    const db = await admin();
    for (let i = 0; i < 5; i++) {
      const code = Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
      const { data: row, error } = await db.from("duel_lobbies").insert({ code, host_name: data.name, host_fighter: data.fighterId }).select(lobbyCols).single();
      if (!error && row) return row;
    }
    throw new Error("Could not create lobby");
  });

export const joinLobby = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; name: string; fighterId: string }) => ({ code: str(d.code, 8).toUpperCase(), name: nameOf(d.name), fighterId: str(d.fighterId) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from("duel_lobbies").select(lobbyCols).eq("code", data.code).maybeSingle();
    if (!row) throw new Error("Lobby not found");
    if (row.guest_name && row.guest_name !== data.name) throw new Error("Lobby is full");
    if (row.host_name === data.name) throw new Error("Use a different name than the host");
    const { data: upd, error } = await db.from("duel_lobbies").update({ guest_name: data.name, guest_fighter: data.fighterId }).eq("code", data.code).select(lobbyCols).single();
    if (error) throw new Error(error.message);
    return upd;
  });

export const getLobby = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({ code: str(d.code, 8).toUpperCase() }))
  .handler(async ({ data }) => {
    const { data: row } = await (await admin()).from("duel_lobbies").select(lobbyCols).eq("code", data.code).maybeSingle();
    if (!row) throw new Error("Lobby not found");
    return row;
  });

export const submitDuel = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; name: string; result: DuelResult }) => ({ code: str(d.code, 8).toUpperCase(), name: nameOf(d.name), result: result(d.result) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from("duel_lobbies").select(lobbyCols).eq("code", data.code).maybeSingle();
    if (!row) throw new Error("Lobby not found");
    const role = row.host_name === data.name ? "host" : row.guest_name === data.name ? "guest" : null;
    if (!role) throw new Error("Not in this lobby");
    if (row[`${role}_result`]) return row; // one attempt only
    const { data: upd, error } = await db.from("duel_lobbies").update({ [`${role}_result`]: data.result }).eq("code", data.code).select(lobbyCols).single();
    if (error) throw new Error(error.message);
    return upd;
  });
