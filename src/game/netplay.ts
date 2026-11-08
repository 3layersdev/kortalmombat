// Live online play over realtime broadcast channels.
// Host-authoritative: the host runs the 60 Hz simulation, the guest streams its
// held keys and renders the host's state snapshots.
import { supabase } from "@/integrations/supabase/client";

export interface SnapF { x: number; y: number; vx: number; vy: number; hp: number; face: number; act: string; t: number; level: string; land: number; frozen: number; spCd: number; sp: { name: string; type: string; color: string } | null }
export interface Snap {
  f: number; ph: string; pt: number; b: string; bs: string; w1: number; w2: number; tm: number; sh: number; fl: number;
  a: SnapF; c: SnapF; pr: { x: number; y: number; vx: number; c: string; w: boolean }[];
  ann: string; fs: string; cin: number; win: 0 | 1 | 2;
}
export type NetMsg =
  | { t: "in"; k: Record<string, boolean>; taps: string[]; sp?: number | undefined }
  | { t: "st"; s: Snap }
  | { t: "end"; w1: number; w2: number; h1: number; h2: number };
export interface NetLink { role: "host" | "guest"; send: (m: NetMsg) => void; listen: (cb: (m: NetMsg) => void) => () => void }
export interface Peer { name: string; fighterId: string }
export interface Match { room: string; role: "host" | "guest"; foe: Peer; arena: number }

const uid = () => (crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/-/g, "");
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/** Random matchmaking: the lower id of a waiting pair invites, the other accepts. */
export function joinQueue(me: Peer, onMatch: (m: Match) => void): () => void {
  const id = uid();
  const ch = supabase.channel("kortal-queue", { config: { presence: { key: id }, broadcast: { self: false } } });
  let done = false; let pending: { to: string; room: string; arena: number; foe: Peer; at: number } | null = null;
  const finish = (m: Match) => { done = true; clearInterval(timer); void ch.untrack().finally(() => supabase.removeChannel(ch)); onMatch(m); };
  const attempt = () => {
    if (done) return;
    if (pending && Date.now() - pending.at > 3000) pending = null;
    if (pending) return;
    const st = ch.presenceState<Peer>();
    const target = Object.keys(st).filter(k => k > id).sort()[0];
    const foe = target ? st[target]?.[0] : undefined;
    if (!target || !foe) return;
    pending = { to: target, room: uid().slice(0, 10), arena: Math.floor(Math.random() * 1000), foe: { name: foe.name, fighterId: foe.fighterId }, at: Date.now() };
    void ch.send({ type: "broadcast", event: "invite", payload: { to: target, from: id, room: pending.room, arena: pending.arena, ...me } });
  };
  ch.on("presence", { event: "sync" }, attempt)
    .on("broadcast", { event: "invite" }, ({ payload }) => {
      if (done || pending || payload.to !== id) return;
      void ch.send({ type: "broadcast", event: "accept", payload: { to: payload.from, room: payload.room } }).then(() =>
        finish({ room: payload.room, role: "guest", arena: payload.arena, foe: { name: payload.name, fighterId: payload.fighterId } }));
    })
    .on("broadcast", { event: "accept" }, ({ payload }) => {
      if (done || !pending || payload.to !== id || payload.room !== pending.room) return;
      finish({ room: pending.room, role: "host", arena: pending.arena, foe: pending.foe });
    })
    .subscribe(s => { if (s === "SUBSCRIBED") void ch.track(me); });
  const timer = setInterval(attempt, 1500);
  return () => { if (done) return; done = true; clearInterval(timer); void ch.untrack().finally(() => supabase.removeChannel(ch)); };
}

/** Private room by code: the first two players present are matched. */
export function joinPrivate(code: string, me: Peer, onMatch: (m: Match) => void): () => void {
  const id = `${Date.now().toString(36).padStart(10, "0")}${uid().slice(0, 6)}`;
  const ch = supabase.channel(`kortal-priv-${code}`, { config: { presence: { key: id } } });
  let done = false;
  ch.on("presence", { event: "sync" }, () => {
    if (done) return;
    const st = ch.presenceState<Peer>(); const keys = Object.keys(st).sort().slice(0, 2);
    if (keys.length < 2 || !keys.includes(id)) return;
    const other = keys.find(k => k !== id)!; const foe = st[other]?.[0]; if (!foe) return;
    done = true; void ch.untrack().finally(() => supabase.removeChannel(ch));
    onMatch({ room: `p${code}${keys[0]}`, role: keys[0] === id ? "host" : "guest", arena: hash(code), foe: { name: foe.name, fighterId: foe.fighterId } });
  }).subscribe(s => { if (s === "SUBSCRIBED") void ch.track(me); });
  return () => { if (done) return; done = true; void ch.untrack().finally(() => supabase.removeChannel(ch)); };
}

/** Match room: resolves once both players are connected. */
export function openRoom(m: Match, onLeave: () => void): { link: NetLink; ready: Promise<void>; close: () => void } {
  const ch = supabase.channel(`kortal-room-${m.room}`, { config: { presence: { key: m.role }, broadcast: { self: false, ack: false } } });
  const cbs = new Set<(x: NetMsg) => void>(); let both = false; let closed = false; let resolve = () => {};
  const ready = new Promise<void>(r => { resolve = r; });
  ch.on("broadcast", { event: "m" }, ({ payload }) => { for (const cb of cbs) cb(payload as NetMsg); })
    .on("presence", { event: "sync" }, () => {
      const n = Object.keys(ch.presenceState()).length;
      if (n >= 2 && !both) { both = true; resolve(); }
      else if (n < 2 && both && !closed) onLeave();
    })
    .subscribe(s => { if (s === "SUBSCRIBED") void ch.track({ at: Date.now() }); });
  const link: NetLink = {
    role: m.role,
    send: msg => { if (!closed) void ch.send({ type: "broadcast", event: "m", payload: msg }); },
    listen: cb => { cbs.add(cb); return () => { cbs.delete(cb); }; },
  };
  return { link, ready, close: () => { if (closed) return; closed = true; void ch.untrack().finally(() => supabase.removeChannel(ch)); } };
}
