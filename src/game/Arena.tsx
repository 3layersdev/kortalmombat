import { useEffect, useRef, useState } from "react";
import { combosFor, roundWinner, finishersFor, inputLabel, type ArenaDef, type FighterDef, type Special } from "./data";
import { sfx } from "./sfx";
import { spriteImg, posesFor, motionPose, type Pose } from "./sprites";
import { Button } from "@/components/ui/button";
import { FINISH_TIMING, victimVisual, executionPose } from './finishers';
import { drawFinisherEffects } from './finisher-effects';
import { arenaArt, arenaImage, animateScenery } from './scenery';
import type { NetLink, NetMsg, Snap, SnapF } from './netplay';

const W = 960, H = 540, GROUND = 470, GRAV = 0.9;
type Act = "idle" | "walk" | "punch" | "kick" | "block" | "hit" | "ko" | "special" | "win" | "crouch" | "dizzy";
interface F {
  d: FighterDef; x: number; y: number; px: number; py: number; pose: Pose; priorPose: Pose; poseAt: number; vx: number; vy: number; hp: number; face: number; act: Act; t: number;
  level: string; land: number; hit: boolean; frozen: number; spCd: number; buf: { k: string; f: number }[]; spec: Special | null; combo: number; lastHit: number;
}
interface Proj { x: number; y: number; vx: number; owner: F; dmg: number; color: string; freeze: boolean; life: number; wave: boolean }
interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
interface Txt { x: number; y: number; text: string; life: number; color: string; size: number }

const mk = (d: FighterDef, x: number, face: number): F => ({
  d, x, y: GROUND, px: x, py: GROUND, pose: "idle", priorPose: "idle", poseAt: 0, vx: 0, vy: 0, hp: d.hp, face, act: "idle", t: 0, level: "HP", land: 0, hit: false, frozen: 0, spCd: 0, buf: [], spec: null, combo: 0, lastHit: -999,
});
const R = Math.random;

export interface MatchStats { rounds: string; damage: number; hits: number; bestCombo: number; remainingHealth: number; time: number }
export interface ArenaProps {
  p1: FighterDef; p2: FighterDef; arena: ArenaDef; difficulty: number; stage: string;
  roundSeconds?: number; training?: boolean; initialHealth?: number; challenge?: string;
  onEnd: (won: boolean, stats: MatchStats) => void; onQuit: () => void; net?: NetLink;
}

export function Arena({ p1: p1Def, p2: p2Def, arena, difficulty, stage, onEnd, onQuit, roundSeconds = 99, training = false, initialHealth = 100, challenge = "", net }: ArenaProps) {
  const guest = net?.role === "guest";
  const me = guest ? p2Def : p1Def;
  const cv = useRef<HTMLCanvasElement>(null);
  const keys = useRef<{[key:string]: boolean | number | Record<string,boolean> | undefined; taps?:Record<string,boolean>; sp?:number; finish?:number; a?:boolean; d?:boolean; w?:boolean; s?:boolean; l?:boolean}>({});
  const paused = useRef(false);
  const [isPaused, setPaused] = useState(false);
  const [hud, setHud] = useState({ h1: 100, h2: 100, w1: 0, w2: 0, time: 99, cd: 0 });
  const [announcement,setAnnouncement] = useState("");
  const [finisher,setFinisher] = useState<number | null>(null);
  const [finishState,setFinishState] = useState('');
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  useEffect(() => {
    const canvas = cv.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const compact = window.innerWidth <= 520;
    const background = arenaImage(arena);
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const matchStats = {damage:0,hits:0,bestCombo:0,time:0};
    for (const d of [p1Def, p2Def]) for (const ps of posesFor(d.skinId??d.id)) spriteImg(d.skinId ?? d.id, ps);
    let frame = 0;
    let p1 = mk(p1Def, 260, 1), p2 = mk(p2Def, 700, -1);
    let projs: Proj[] = [];
    const parts: Part[] = [], txts: Txt[] = [], amb: Part[] = [];
    let round = 1, w1 = 0, w2 = 0, timer = roundSeconds * 60, phase: "intro" | "fight" | "ko" | "draw" | "ready" | "finish" | "end" = "intro", phaseT = 0;
    let cinematic: ReturnType<typeof finishersFor>[number] | null = null;
    let banner = "", bannerSub = "", hitstop = 0, shake = 0, flash = 0, winner: F | null = null, flawless = false, bolt = 0, finisherUsed = false;
    const prev: Record<string, boolean> = {};
    const remote = { k: {} as Record<string, boolean>, taps: {} as Record<string, boolean>, sp: undefined as number | undefined };
    const rprev: Record<string, boolean> = {};
    let annText = "", fsText = "";
    const announce = (t: string) => { annText = t; setAnnouncement(t); };
    const stageFs = (t: string) => { fsText = t; setFinishState(t); };
    const gStats = { damage: 0, hits: 0 };
    const ai = { move: 0, block: false, next: 0 };

    const burst = (x: number, y: number, color: string, n = 14, sp = 6) => {
      for (let i = 0; i < n; i++) parts.push({ x, y, vx: (R() - 0.5) * sp * 2, vy: (R() - 0.5) * sp * 2 - 2, life: 20 + R() * 15, max: 35, color, size: 2 + R() * 4 });
    };
    const float = (x: number, y: number, text: string, color: string, size = 28) => txts.push({ x, y, text, life: 60, color, size });

    const startRound = () => {
      p1 = mk(p1Def, 260, 1); p2 = mk(p2Def, 700, -1); projs = []; timer = roundSeconds * 60;
      p1.hp = p1.d.hp * initialHealth / 100;
      finisherUsed = false; cinematic = null; winner = null; setFinisher(null); stageFs(''); announce("");
      phase = "intro"; phaseT = 0; banner = round === 3 ? "FINAL ROUND" : `ROUND ${round}`; bannerSub = "";
      sfx.gong(); sfx.say(round === 3 ? "Final round" : round === 1 ? "Round one" : "Round two");
    };
    startRound();

    const other = (f: F) => (f === p1 ? p2 : p1);
    const busy = (f: F) => f.frozen > 0 || ["punch", "kick", "hit", "special", "ko", "win", "dizzy"].includes(f.act);
    const completeMatch = () => {
      phase = 'end'; setFinisher(null); stageFs('');
      net?.send({ t: 'end', w1, w2, h1: p1.hp / p1.d.hp * 100, h2: p2.hp / p2.d.hp * 100 });
      endRef.current(w1 >= 2,{rounds:`${w1} — ${w2}`,damage:Math.round(matchStats.damage),hits:matchStats.hits,bestCombo:matchStats.bestCombo,remainingHealth:Math.round(p1.hp/p1.d.hp*100),time:Math.round(matchStats.time/60)});
    };
    const beginFinish = (index: number) => {
      if (phase !== 'ready' || !winner || finisherUsed) return;
      const selected = finishersFor(winner.d)[index]; if (!selected) return;
      cinematic = selected; finisherUsed = true; phase = 'finish'; phaseT = 0;
      setFinisher(null); stageFs('windup'); announce(`${winner.d.name} · ${selected.name.split(' · ')[1] ?? selected.name}`);
      winner.act = 'special'; winner.spec = null; winner.t = 0;
      winner.x = winner === p1 ? 340 : 620; winner.px = winner.x;
      const loser = other(winner); loser.x = winner === p1 ? 620 : 340; loser.px = loser.x;
      winner.face = winner.x < loser.x ? 1 : -1; loser.face = -winner.face;
      banner = ''; bannerSub = ''; sfx.special(selected.effect);
    };

    const applyHit = (a: F, d: F, base: number, kb: number, o: { launch?: boolean; freeze?: boolean; heavy?: boolean; kick?: boolean } = {}) => {
      if (d.act === "ko" || phase !== "fight") return;
      let dmg = Math.min(18, base * Math.max(.35,1-a.combo*.08)) * a.d.power * (a === p2 && !net ? 0.7 + difficulty * 0.4 : 1);
      const hx = d.x - a.face * 15, hy = d.y - 110 * (d.d.scale ?? 1);
      if (d.act === "block") {
        hitstop = 2; dmg *= 0.15; d.hp = Math.max(0, d.hp - dmg); d.vx = a.face * 5;
        sfx.block(); burst(hx, hy, "#9ad8ff", 8, 4); float(d.x, d.y - 200, "BLOCK", "#9ad8ff", 22);
        return;
      }
      d.hp = Math.max(0, d.hp - dmg); d.face = -a.face; a.vx += a.face * 1.5; d.act = "hit"; d.t = o.heavy ? 22 : 15; d.vx = a.face * kb; d.spec = null;
      if (o.launch) d.vy = -12;
      if (o.freeze) { d.frozen = 75; sfx.freeze(); }
      if(a===p1){matchStats.damage += dmg; matchStats.hits++;}
      a.combo = frame - a.lastHit < 50 ? a.combo + 1 : 1; a.lastHit = frame;
      if(a===p1)matchStats.bestCombo=Math.max(matchStats.bestCombo,a.combo);
      if (a.combo >= 2) float(a.x, a.y - 240, `${a.combo} HIT COMBO`, "#ffd36a", 30);
      float(d.x + (R() - 0.5) * 30, d.y - 180, `-${Math.round(dmg)}`, "#ff5a3a", 26);
      if (o.kick ?? o.heavy) sfx.kick(); else sfx.punch();
      shake = o.heavy ? 9 : 5; hitstop = o.heavy ? 5 : 3;
      burst(hx, hy, "#ffb04a", 16, 7); burst(hx, hy, "#c81a1a", 10, 4);
    };

    const attack = (f: F, kind: "punch" | "kick", level = kind === "punch" ? "HP" : "HK") => { f.level = level; f.act = kind; f.t = kind === "punch" ? 16 : 22; f.hit = false; sfx.whoosh(); };

    const doSpecial = (f: F, sp: Special) => {
      const o = other(f), s = f.d.scale ?? 1;
      f.act = "special"; f.spec = sp; f.hit = false; f.spCd = 70; f.t = 24;
      float(f.x, f.y - 250 * s, sp.name.toUpperCase(), sp.color, 30); sfx.special(sp.type);
      if (sp.type === "projectile" || sp.type === "freeze") {
        projs.push({ x: f.x + f.face * 55, y: f.y - 118 * s, vx: f.face * 11, owner: f, dmg: sp.dmg, color: sp.color, freeze: sp.type === "freeze", life: 110, wave: false });
        burst(f.x + f.face * 55, f.y - 118 * s, sp.color, 10, 3);
      } else if (sp.type === "dash") { f.vx = f.face * 16; f.t = 20; }
      else if (sp.type === "uppercut") { f.vy = -16; f.vx = f.face * 3; f.t = 28; }
      else if (sp.type === "teleport") {
        burst(f.x, f.y - 90, sp.color, 24, 5);
        f.x = Math.max(50, Math.min(W - 50, o.x - o.face * 95)); f.px=f.x; f.face = f.x < o.x ? 1 : -1;
        burst(f.x, f.y - 90, sp.color, 24, 5); f.t = 20;
      } else if (sp.type === "slam") { f.vy = -11; f.t = 34; }
    };

    const matches = (f: F, seq: string[]) => {
      const b = f.buf; if (b.length < seq.length) return false;
      const tail = b.slice(-seq.length);
      return tail.every((e, i) => e.k === seq[i]) && frame - (tail[0]?.f ?? frame) < 90;
    };
    const push = (f: F, k: string) => { f.buf.push({ k, f: frame }); if (f.buf.length > 10) f.buf.shift(); };
    const press = (f: F, btn: "LP" | "HP" | "LK" | "HK", crouching = false) => {
      push(f, btn);
      if(phase!=="fight" || f.frozen>0 || f.act==="hit")return;
      const matching = combosFor(f.d).find(c=>matches(f,c.input));
      if(matching && f.spCd===0){
        doSpecial(f,{name:matching.name,input:matching.input,type:matching.type,dmg:matching.damage,color:matching.color,desc:"Combo finisher"});f.buf=[];return;
      }
      if(busy(f) && f.t>6)return;
      if(crouching && btn==="HP") {doSpecial(f,{name:"RISING UPPERCUT",input:[],type:"uppercut",dmg:10,color:f.d.color,desc:"Launcher"});return;}
      for(const sp of f.d.specials){const seq=sp.input.map(k=>k==="P"?"HP":k==="K"?"HK":k);if(matches(f,seq)&&f.spCd===0){doSpecial(f,sp);f.buf=[];return;}}
      attack(f,btn.endsWith("P")?"punch":"kick",btn);
    };

    const updAttack = (f: F) => {
      if ((f.act !== "punch" && f.act !== "kick") || f.hit) return;
      const active = f.act === "punch" ? f.t <= 12 && f.t >= 8 : f.t <= 16 && f.t >= 10;
      if (!active) return;
      const o = other(f), s = f.d.scale ?? 1;
      const reach = (f.act === "punch" ? 140 : 160) * s, dx = (o.x - f.x) * f.face;
      if (dx > 0 && dx < reach && Math.abs(o.y - f.y) < 120) {
        f.hit = true;
        applyHit(f, o, f.level === "LP" ? 4 : f.level === "LK" ? 5 : f.act === "punch" ? 6 : 8, f.act === "punch" ? 7 : 12, { heavy: f.act === "kick", kick: f.act === "kick" });
      }
    };
    const updSpecial = (f: F) => {
      const sp = f.spec; if (!sp || f.act !== "special") return;
      const o = other(f), dx = Math.abs(o.x - f.x), dy = Math.abs(o.y - f.y);
      if (frame % 2 === 0) parts.push({ x: f.x + (R() - 0.5) * 40, y: f.y - R() * 150, vx: 0, vy: -1.5, life: 16, max: 16, color: sp.color, size: 5 });
      if (sp.type === "dash") {
        if (f.t > 6 && !f.hit) f.vx = f.face * 15;
        if (!f.hit && dx < 115 && dy < 110) { f.hit = true; applyHit(f, o, sp.dmg, 16, { heavy: true }); f.vx = 0; }
      }
      if (sp.type === "uppercut" && !f.hit && dx < 125 && dy < 140) { f.hit = true; applyHit(f, o, sp.dmg, 6, { launch: true, heavy: true }); }
      if (sp.type === "teleport" && !f.hit && f.t <= 14 && dx < 135) { f.hit = true; applyHit(f, o, sp.dmg, 14, { heavy: true }); }
      if (sp.type === "slam" && !f.hit && f.t < 26 && f.y >= GROUND) {
        f.hit = true; shake = 14; sfx.kick();
        for (const v of [-1, 1]) projs.push({ x: f.x + v * 40, y: GROUND - 18, vx: v * 9, owner: f, dmg: sp.dmg, color: sp.color, freeze: false, life: 60, wave: true });
        burst(f.x, GROUND, sp.color, 30, 8);
      }
    };

    const runAI = () => {
      const f = p2, o = p1;
      if (training || phase !== "fight" || f.frozen > 0 || f.act === "ko") return;
      const dist = Math.abs(o.x - f.x);
      if (frame >= ai.next) {
        ai.next = frame + Math.max(6, 42 - difficulty * 36) + R() * 12;
        const r = R(); ai.block = false; ai.move = 0;
        const threat = o.act === "punch" || o.act === "kick" || o.act === "special" || projs.some((p) => p.owner === o && Math.abs(p.x - f.x) < 260);
        if (threat && R() < difficulty * 0.6) ai.block = true;
        else if (!busy(f)) {
          const sps = f.d.specials;
          if (f.spCd === 0 && r < 0.05 + difficulty * 0.28) {
            const ranged = sps.find((s) => s.type === "projectile" || s.type === "freeze");
            const melee = sps.filter((s) => s !== ranged);
            const pick = dist > 260 ? ranged ?? melee.find((s) => s.type === "dash" || s.type === "teleport") : melee[Math.floor(R() * melee.length)] ?? ranged;
            if (pick) { doSpecial(f, pick); return; }
          }
          if (dist > 140) ai.move = o.x < f.x ? -1 : 1;
          else if (r < 0.55) attack(f, R() < 0.55 ? "punch" : "kick");
          else if (r < 0.65) ai.move = o.x < f.x ? 1 : -1;
          else if (r < 0.7 && f.y >= GROUND) { f.vy = -f.d.jump; sfx.jump(); }
        }
      }
      if (!busy(f)) {
        f.act = ai.block && f.y >= GROUND ? "block" : "idle";
        if (dist < 120 && ai.move === (o.x < f.x ? -1 : 1)) ai.move = 0;
        if (!ai.block && ai.move) { f.vx += (ai.move * f.d.speed * 0.9 - f.vx) * 0.3; if (f.y >= GROUND) f.act = "walk"; }
      }
    };

    const drawF = (f: F, alpha: number, now: number) => {
      const x=f.px+(f.x-f.px)*alpha, y=f.py+(f.y-f.py)*alpha, visualFrame=frame+alpha;
      const s = f.d.scale ?? 1, a = f.act, air = f.y < GROUND - 2, sp = f.spec;
      const victim = phase === 'finish' && cinematic && winner && f !== winner ? victimVisual(cinematic.effect,phaseT) : null;
      const basePose:Pose = phase === 'finish' && cinematic ? f === winner ? executionPose(cinematic.effect,phaseT) : victim?.pose ?? 'hit' : a === 'dizzy' ? 'idle' : a === "crouch" ? "crouch" : a === "win" ? "victory" : a === "special" && sp?.type === "uppercut" ? "uppercut" : a === "hit" || a === "ko" ? "hit" : a === "block" ? "block" : a === "punch" ? air ? "airpunch" : "strike" : a === "kick" ? air ? "airkick" : "kick" : a === "special" ? "strike" : air ? "jump" : a === "walk" ? "walk" : "idle";
      const pose=phase==='finish'?basePose:motionPose(basePose,visualFrame,f.t,f.d.skinId??f.d.id);
      if(pose!==f.pose){f.priorPose=f.pose;f.pose=pose;f.poseAt=now;}
      const fastPose=["strike","kick","uppercut","airpunch","airkick","hit"].includes(pose);
      const rawBlend=Math.min(1,(now-f.poseAt)/(fastPose?55:110));
      const blend=rawBlend*rawBlend*(3-2*rawBlend);
      const ft=Math.max(0,f.t-(hitstop>0?0:alpha));
      const strike = ["strike","kick","uppercut","airpunch","airkick","punchwind","punchrecover","kickwind","kickrecover"].includes(pose);
      const img = spriteImg(f.d.skinId ?? f.d.id, pose);
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.globalAlpha= victim?.opacity ?? 1; ctx.beginPath(); ctx.ellipse(x, GROUND + 4, Math.max(20,48-(GROUND-y)*.08) * s, 8, 0, 0, 7); ctx.fill(); ctx.globalAlpha=1;
      if(victim?.buried){ctx.beginPath();ctx.rect(0,0,W,GROUND+4);ctx.clip();}
      if (!img.complete || !img.naturalWidth) { ctx.restore(); return; }
      const h = (pose === "crouch" ? 150 : 215) * s, w = (img.naturalWidth / img.naturalHeight) * h;
      const ax = pose === "kick" ? 0.3 : strike ? 0.36 : 0.5;
      let rot = 0, sx = 1, sy = 1, ox = 0, oy = 0;
      if (a === "idle") { const br = Math.sin(visualFrame * 0.065); sy = 1 + br * 0.012; sx = 1 - br * 0.004; rot = Math.sin(visualFrame * 0.031) * 0.008; }
      if (a === "walk") { oy = -Math.abs(Math.sin(visualFrame * 0.22)) * 3; rot = Math.sin(visualFrame * 0.22) * 0.018; sx = 1 + Math.sin(visualFrame * 0.22) * 0.015; }
      if (a === "punch") { const pr = (16 - ft) / 16, k = Math.sin(pr * Math.PI); ox = pr < 0.2 ? -pr * 20 : k * k * 18; rot = pr < 0.2 ? 0.03 : -0.03 * k; }
      if (a === "kick") { const pr = (22 - ft) / 22, k = Math.sin(pr * Math.PI); rot = pr < 0.25 ? 0.05 * pr * 4 : -0.08 * k; ox = pr < 0.25 ? -pr * 24 : k * k * 14; oy = -k * 4; }
      if(a === "crouch"){ sx=1.02; }
      if(f.level.startsWith("L") && (a==="punch" || a==="kick")){sy=.78;rot=.1;}
      if (a === "block") { ox = -4; }
      if (a === "hit") { const hk=Math.min(1,ft/12); const e=hk*hk*(3-2*hk); rot = -0.09*e; ox = -14*e; oy = -3*e; sx = 1-0.04*e; }
      if (a === 'dizzy') { rot = Math.sin(visualFrame*.09)*.065; ox = Math.sin(visualFrame*.09)*8; oy = Math.cos(visualFrame*.18)*2; }
      if (victim) { rot = victim.rotation; ox = victim.offsetX; oy = victim.offsetY; }
      if (a === "win") { sy = 1.04 + Math.sin(visualFrame * 0.08) * 0.008; }
      if (f.land > 0 && !air) { const lk = f.land / 8; sy *= 1 - 0.07 * lk; sx *= 1 + 0.05 * lk; }
      if ((a === "walk" || a === "idle") && !air) rot += Math.max(-0.05, Math.min(0.05, f.vx * f.face * 0.008));
      if (air && a !== "ko") { rot += f.vy < 0 ? -0.08 : 0.06; sy *= 0.96; }
      if (a === "special" && sp?.type === "uppercut") rot = -0.35;
      if (a === "special" && sp?.type === "dash") rot = 0.18;
      ctx.translate(x, y); ctx.scale(f.face, 1);
      if (a === "ko" && !victim) { ctx.translate(-20, -8); ctx.rotate(-Math.PI / 2); ctx.translate(-h * 0.5 + 10, h * 0.25); }
      if(victim && phaseT>=180 && !victim.buried && victim.opacity===1){ctx.translate(0,-12);ctx.rotate(-Math.PI/2);ctx.translate(-h*.5,h*.25);rot=0;}
      ctx.translate(ox, oy); ctx.rotate(rot); ctx.scale(sx, sy);
      const filters: string[] = [];
      if(f.d.hue)filters.push(`hue-rotate(${f.d.hue}deg)`);
      if (a === "hit" && f.t > 13) filters.push("brightness(2.6)");
      else if (a === "hit") filters.push("sepia(.6) saturate(2.5) hue-rotate(-30deg)");
      if (f.frozen > 0) filters.push("saturate(.3) brightness(1.3) hue-rotate(160deg)");
      if (a === "special" && sp) filters.push(`drop-shadow(0 0 14px ${sp.color})`);
      if (f.d.boss && a !== "hit") filters.push("drop-shadow(0 0 10px rgba(255,200,80,.5))");
      if (a === "ko") filters.push("brightness(.6)");
      if(victim?.frozen)filters.push('saturate(.2) brightness(1.6)');
      if(victim && phaseT>=180)filters.push('brightness(.55)');
      if (a === "special" && sp?.type === "dash") {
        ctx.globalAlpha = 0.25;
        for (let i = 1; i <= 3; i++) ctx.drawImage(img, -w * ax - i * 26, -h, w, h);
        ctx.globalAlpha = 1;
      }
      ctx.filter = filters.join(" ") || "none";
      if(blend<1){const prior=spriteImg(f.d.skinId??f.d.id,f.priorPose);if(prior.complete&&prior.naturalWidth){const ph=(f.priorPose==="crouch"?150:215)*s,pw=prior.naturalWidth/prior.naturalHeight*ph;ctx.globalAlpha=(1-blend)*0.5*(victim?.opacity??1);ctx.drawImage(prior,-pw*ax,-ph,pw,ph);}}
      ctx.globalAlpha=(victim?.opacity??1);ctx.drawImage(img, -w * ax, -h, w, h);ctx.globalAlpha=1;
      ctx.filter = "none";
      if (a === "block") {
        ctx.strokeStyle = "rgba(154,216,255,.8)"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(w * (1 - ax) - 20, -h * 0.55, h * 0.4, -1.1, 1.1); ctx.stroke();
      }
      if (f.frozen > 0) { ctx.fillStyle = "rgba(160,225,255,.3)"; ctx.strokeStyle = "rgba(220,245,255,.8)"; ctx.lineWidth = 2; ctx.fillRect(-w * 0.5, -h - 6, w, h + 6); ctx.strokeRect(-w * 0.5, -h - 6, w, h + 6); }
      ctx.restore();
    };

    const drawBg = (alpha:number) => {
      if(background.complete && background.naturalWidth){ctx.drawImage(background,0,0,W,H);animateScenery(ctx,arena,frame+alpha,reducedMotion);return;}
      const g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, arena.sky[0]); g.addColorStop(1, arena.sky[1]);
      ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, GROUND + 20);
      const rg = ctx.createRadialGradient(W / 2, 160, 20, W / 2, 160, 260);
      rg.addColorStop(0, arena.glow + "66"); rg.addColorStop(1, arena.glow + "00");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, GROUND);
      ctx.fillStyle = arena.glow + "cc"; ctx.beginPath(); ctx.arc(W / 2, 160, 66, 0, 7); ctx.fill();
      ctx.fillStyle = arena.far; ctx.beginPath(); ctx.moveTo(0, GROUND);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 300 + Math.sin(x * 0.013) * 40 + Math.sin(x * 0.041) * 18);
      ctx.lineTo(W, GROUND); ctx.fill();
      ctx.fillStyle = arena.pillar;
      for (let i = 0; i < 6; i++) {
        const px = 50 + i * 172;
        if (arena.deco === "trees") { ctx.beginPath(); ctx.moveTo(px - 50, GROUND); ctx.lineTo(px + 20, 150 + (i % 2) * 50); ctx.lineTo(px + 90, GROUND); ctx.fill(); }
        else if (arena.deco === "towers") { ctx.fillRect(px, 90 + (i % 3) * 40, 46, GROUND); ctx.fillStyle = arena.glow + "88"; for (let w = 0; w < 5; w++) ctx.fillRect(px + 18, 120 + (i % 3) * 40 + w * 50, 10, 16); ctx.fillStyle = arena.pillar; }
        else {
          ctx.fillRect(px, 130, 40, GROUND - 130); ctx.fillRect(px - 12, 118, 64, 18);
          if (arena.deco === "torches") { ctx.fillStyle = `rgba(255,${140 + R() * 80},40,.9)`; ctx.beginPath(); ctx.ellipse(px + 20, 104 + R() * 3, 9, 16 + R() * 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = arena.pillar; }
        }
      }
      const fg = ctx.createLinearGradient(0, GROUND, 0, H);
      fg.addColorStop(0, arena.floor); fg.addColorStop(1, "#000");
      ctx.fillStyle = fg; ctx.fillRect(-20, GROUND, W + 40, H - GROUND + 20);
      ctx.strokeStyle = arena.glow + "33"; ctx.lineWidth = 1;
      for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 60, GROUND); ctx.lineTo(W / 2 + i * 160, H); ctx.stroke(); }
      ctx.strokeStyle = arena.glow + "66"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke();
      if (arena.deco === "spikes") { ctx.fillStyle = "#000"; for (let x = 0; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 12, H - 26); ctx.lineTo(x + 24, H); ctx.fill(); } }
      animateScenery(ctx,arena,frame+alpha,reducedMotion);
    };

    const ambient = () => {
      const fx = arena.fx;
      if (amb.length < 70 && R() < 0.6) {
        if (fx === "embers") amb.push({ x: R() * W, y: H, vx: (R() - 0.5), vy: -1 - R() * 2, life: 200, max: 200, color: "#ff9a3a", size: 2 + R() * 2 });
        if (fx === "snow") amb.push({ x: R() * W, y: -10, vx: (R() - 0.5), vy: 1 + R(), life: 400, max: 400, color: "#ffffff", size: 1.5 + R() * 2 });
        if (fx === "rain") amb.push({ x: R() * W, y: -10, vx: -2, vy: 14, life: 60, max: 60, color: "#a8b8ff", size: 1 });
        if (fx === "leaves") amb.push({ x: R() * W, y: -10, vx: 1 + R(), vy: 1 + R(), life: 400, max: 400, color: "#8ae86a", size: 3 });
        if (fx === "ash") amb.push({ x: R() * W, y: -10, vx: (R() - 0.5) * 2, vy: 0.6 + R(), life: 500, max: 500, color: "#c8a0a0", size: 2 });
      }
      for (let i = amb.length - 1; i >= 0; i--) {
        const p = amb[i]; if(!p)continue; p.x += p.vx + (fx === "leaves" ? Math.sin(frame * 0.05 + i) : 0); p.y += p.vy; p.life--;
        ctx.globalAlpha = Math.min(1, p.life / 40) * 0.8; ctx.fillStyle = p.color;
        if (fx === "rain") { ctx.fillRect(p.x, p.y, 1.5, 14); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); }
        if (p.life <= 0 || p.y > H || p.y < -20) amb.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (fx === "rain" && R() < 0.004) bolt = 8;
    };

    const bigText = (t: string, y: number, size: number, color = "#ffd36a") => {
      if(compact)size=Math.min(size,t.length>10?38:76);
      ctx.font = `${size}px "Bebas Neue", Impact, sans-serif`; ctx.textAlign = "center";
      ctx.lineWidth = 8; ctx.strokeStyle = "#000"; ctx.strokeText(t, W / 2, y);
      ctx.fillStyle = color; ctx.fillText(t, W / 2, y);
    };

    const control = (f: F, K: Record<string, unknown>, taps: Record<string, boolean>, pv: Record<string, boolean>, spi?: number) => {
      const edge = (k: string) => !!taps[k] || (!!K[k] && !pv[k]);
      if (phase === "fight" && f.frozen === 0 && f.act !== "ko") {
        if (edge("s")) push(f, "d");
        if (edge("w")) push(f, "u");
        if (edge("a")) push(f, f.face === 1 ? "b" : "f");
        if (edge("d")) push(f, f.face === 1 ? "f" : "b");
        if (edge("j")) press(f, "HP", !!K.s);
        if (edge("k")) press(f, "HK", !!K.s);
        if (edge("u")) press(f, "LP", !!K.s);
        if (edge("i")) press(f, "LK", !!K.s);
        if (spi !== undefined) { const sp = f.d.specials[spi]; if (sp && !busy(f) && f.spCd === 0) doSpecial(f, sp);  }
        if (!busy(f)) {
          const blk = !!K.l && f.y >= GROUND;
          f.act = blk ? "block" : K.s && f.y>=GROUND ? "crouch" : "idle";
          if (!blk) {
            const m = (K.d ? 1 : 0) - (K.a ? 1 : 0);
            if (m && !K.s) { f.vx += (m * f.d.speed - f.vx) * (f.y >= GROUND ? 0.35 : 0.08); if (f.y >= GROUND) f.act = "walk"; }
            if (K.w && f.y >= GROUND) { f.vy = -f.d.jump; sfx.jump(); }
          }
        }
      }
      for (const k of ["a", "d", "w", "s", "j", "k", "l", "u", "i"]) pv[k] = !!K[k];
    };
    const sf = (f: F): SnapF => ({ x: f.x, y: f.y, vx: f.vx, vy: f.vy, hp: f.hp, face: f.face, act: f.act, t: f.t, level: f.level, land: f.land, frozen: f.frozen, spCd: f.spCd, sp: f.spec ? { name: f.spec.name, type: f.spec.type, color: f.spec.color } : null });
    const snap = (): Snap => ({ f: frame, ph: phase, pt: phaseT, b: banner, bs: bannerSub, w1, w2, tm: timer, sh: shake, fl: flash, a: sf(p1), c: sf(p2), pr: projs.map(p => ({ x: p.x, y: p.y, vx: p.vx, c: p.color, w: p.wave })), ann: annText, fs: fsText, cin: cinematic && winner ? finishersFor(winner.d).indexOf(cinematic) : -1, win: winner === p1 ? 1 : winner === p2 ? 2 : 0 });
    let snapAt = performance.now();
    const applyF = (f: F, d: SnapF) => {
      f.px = f.x; f.py = f.y;
      if (d.hp < f.hp - 0.5) {
        burst(f.x, f.y - 120, "#ffb04a", 14, 7); burst(f.x, f.y - 120, "#c81a1a", 8, 4); float(f.x, f.y - 180, `-${Math.round(f.hp - d.hp)}`, "#ff5a3a", 26); sfx.punch();
        if (f === p1) { gStats.damage += f.hp - d.hp; gStats.hits++; }
      }
      if (d.act !== f.act && (d.act === "punch" || d.act === "kick")) sfx.whoosh();
      Object.assign(f, { x: d.x, y: d.y, vx: d.vx, vy: d.vy, hp: d.hp, face: d.face, act: d.act as Act, t: d.t, level: d.level, land: d.land, frozen: d.frozen, spCd: d.spCd, spec: d.sp ? ({ ...d.sp, input: [], dmg: 0, desc: "" } as unknown as Special) : null });
    };
    const applySnap = (sn: Snap) => {
      snapAt = performance.now();
      applyF(p1, sn.a); applyF(p2, sn.c);
      if (sn.b && sn.b !== banner && (sn.b.startsWith("ROUND") || sn.b === "FINAL ROUND")) sfx.gong();
      if (sn.b === "FIGHT!" && banner !== "FIGHT!") sfx.say("Fight!");
      if (sn.b === "K.O." && banner !== "K.O.") sfx.ko();
      frame = sn.f; phase = sn.ph as typeof phase; phaseT = sn.pt; banner = sn.b; bannerSub = sn.bs; w1 = sn.w1; w2 = sn.w2; timer = sn.tm; shake = sn.sh; if (sn.fl > flash) flash = sn.fl;
      projs = sn.pr.map(p => ({ x: p.x, y: p.y, vx: p.vx, owner: p1, dmg: 0, color: p.c, freeze: false, life: 1, wave: p.w }));
      if (sn.ann !== annText) announce(sn.ann);
      if (sn.fs !== fsText) stageFs(sn.fs);
      winner = sn.win === 1 ? p1 : sn.win === 2 ? p2 : null;
      cinematic = sn.cin >= 0 && winner ? finishersFor(winner.d)[sn.cin] ?? null : null;
    };
    const unlisten = net?.listen((m: NetMsg) => {
      if (m.t === "in" && !guest) { remote.k = m.k; for (const k of m.taps) remote.taps[k] = true; if (m.sp !== undefined) remote.sp = m.sp; }
      else if (m.t === "st" && guest) applySnap(m.s);
      else if (m.t === "end" && guest && phase !== "end") { phase = "end"; endRef.current(m.w2 >= 2, { rounds: `${m.w2} — ${m.w1}`, damage: Math.round(gStats.damage), hits: gStats.hits, bestCombo: 0, remainingHealth: Math.round(m.h2), time: Math.round(frame / 60) }); }
    });
    let netTick = 0;

    const update = () => {
      for(const f of [p1,p2]){f.px=f.x;f.py=f.y;}
      if(shake>0){shake*=0.86;if(shake<0.4)shake=0;}
      if(hitstop>0&&phase==="fight"){hitstop--;return;}
      frame++; phaseT++;
      const K = keys.current;
      if(K.finish!==undefined){const index=Number(K.finish);delete K.finish;beginFinish(index);}
      if(phase === 'ready' || phase === 'finish') {
        if(phase === 'ready') {
          if(winner === p2 && phaseT >= 110)beginFinish(0);
          else if(phaseT >= FINISH_TIMING.ready)beginFinish(0);
        } else if(cinematic && winner) {
          if(phaseT === 60){stageFs('execution');sfx.special(cinematic.effect);}
          if(phaseT >= 60 && phaseT < 180 && phaseT%24===0){sfx.whoosh();burst(other(winner).x,GROUND-110,cinematic.color,10,5);shake=4;}
          if(phaseT === 180){stageFs('aftermath');shake=16;flash=7;sfx.ko();burst(other(winner).x,GROUND-100,cinematic.color,55,9);winner.act='win';announce(`${other(winner).d.name} · ${cinematic.aftermath}`);sfx.say('Fatality');}
          if(phaseT >= FINISH_TIMING.end){completeMatch();return;}
        }
        for(const k of ['a','d','w','s','j','k','l','u','i'])prev[k]=!!K[k];
        K.taps={};delete K.sp;return;
      }
      const taps: Record<string, boolean> = K.taps ?? {}; K.taps = {};
      control(p1, K as Record<string, unknown>, taps, prev, K.sp); delete K.sp;
      if (net) { control(p2, remote.k, remote.taps, rprev, remote.sp); remote.taps = {}; remote.sp = undefined; } else runAI();
      for (const f of [p1, p2]) {
        updAttack(f); updSpecial(f);
        const airborne = f.y < GROUND;
        f.vy += airborne ? (Math.abs(f.vy) < 3 ? GRAV * 0.6 : f.vy > 0 ? GRAV * 1.25 : GRAV) : 0; f.y += f.vy;
        if (f.y >= GROUND) { if (airborne && f.vy > 3) sfx.land(f.vy > 14);
        if (airborne && f.vy > 6) { f.land = 8; burst(f.x, GROUND, "#b8a58a", 6, 2.5); } f.y = GROUND; f.vy = 0; }
        if (f.land > 0) f.land--;
        f.x += f.vx; f.vx *= f.y < GROUND ? 0.97 : f.act === "walk" ? 0.9 : 0.8; if (Math.abs(f.vx) < 0.1) f.vx = 0;
        f.x = Math.max(110, Math.min(W - 110, f.x));
        if (f.spCd > 0) f.spCd--;
        if (f.frozen > 0) f.frozen--;
        if (f.t > 0) { f.t--; if (f.t === 0 && f.act !== "ko" && f.act !== "win") { f.act = "idle"; f.spec = null; } }
      }
      for (const f of [p1, p2]) { const o = other(f); if (!busy(f)) f.face = f.x < o.x ? 1 : -1; }
      if (Math.abs(p1.x - p2.x) < 90 && Math.abs(p1.y - p2.y) < 100 && p1.act !== "ko" && p2.act !== "ko") {
        const m = (p1.x + p2.x) / 2, s = p1.x < p2.x ? -1 : 1; p1.x = m + s * 45; p2.x = m - s * 45;
      }
      for (let i = projs.length - 1; i >= 0; i--) {
        const p = projs[i]; if(!p)continue; p.x += p.vx; p.life--;
        if (frame % 2 === 0) parts.push({ x: p.x, y: p.y + (R() - 0.5) * 10, vx: -p.vx * 0.1, vy: (R() - 0.5) * 2, life: 14, max: 14, color: p.color, size: p.wave ? 8 : 6 });
        const t = other(p.owner), sc = t.d.scale ?? 1;
        let dead = p.life <= 0 || p.x < -40 || p.x > W + 40;
        if (!dead && Math.abs(p.x - t.x) < 40 && p.y > t.y - 175 * sc && p.y < t.y + 5 && t.act !== "ko") {
          applyHit(p.owner, t, p.dmg, 10, { freeze: p.freeze, heavy: true }); burst(p.x, p.y, p.color, 20, 6); dead = true;
        }
        if (!dead) for (const q of projs) if (q !== p && q.owner !== p.owner && Math.abs(q.x - p.x) < 28 && Math.abs(q.y - p.y) < 40) { q.life = 0; dead = true; burst(p.x, p.y, "#ffffff", 20, 6); sfx.block(); }
        if (dead) projs.splice(i, 1);
      }
      if (phase === "intro") {
        if (phaseT === 24) { banner = "FIGHT!"; sfx.say("Fight!"); sfx.punch(); }
        if (phaseT >= 48) { phase = "fight"; banner = ""; }
      } else if (phase === "fight") {
        if(!training)timer--;
        matchStats.time++;
        if(training){p1.hp=p1.d.hp;p2.hp=p2.d.hp;}
        if (p1.hp <= 0 || p2.hp <= 0 || timer <= 0) {
          const result = roundWinner(p1.hp,p2.hp);
          if(result==="draw"){phase="draw";phaseT=0;banner="DRAW";bannerSub="ROUND REPLAY";announce("Equal health · Round drawn");return;}
          const p1w = result==="p1"; winner = p1w ? p1 : p2; const loser = p1w ? p2 : p1;
          flawless = winner.hp >= winner.d.hp;
          loser.act = "ko"; loser.t = 0; loser.frozen = 0; loser.vy = -8; loser.spec = null; projs = [];
          if (!busy(winner)) winner.act = "idle";
          if (p1w) w1++; else w2++;
          if(w1>=2 || w2>=2){
            loser.act='dizzy';loser.y=GROUND;loser.py=GROUND;loser.vy=0;loser.vx=0;
            winner.act='idle';winner.t=0;winner.spec=null;winner.frozen=0;winner.y=GROUND;winner.py=GROUND;winner.vx=0;winner.vy=0;
            phase='ready';phaseT=0;banner='FINISH THEM';bannerSub='';stageFs('ready');
            announce(`ROUND ${round} · ${winner.d.name} WINS${timer<=0?' · MORE HEALTH':''}`);
            if(p1w)setFinisher(0);sfx.say('Finish them');return;
          }
          phase = "ko"; phaseT = 0; banner = timer <= 0 ? "TIME UP" : "K.O.";
          announce(`ROUND ${round} · ${winner.d.name} WINS${timer<=0?" · MORE HEALTH":""}`); flash = 12; sfx.ko();
        }
      } else if(phase==="draw" && phaseT>=180){startRound();}
      else if (phase === "ko" && winner) {
        if (phaseT >= 40 && winner.act !== "win" && winner.y >= GROUND && winner.frozen === 0) { winner.act = "win"; winner.t = 0; winner.spec = null; }
        if (phaseT === 70) {
          banner = `${winner.d.name} WINS`; bannerSub = timer <= 0 ? "TIME UP · HEALTH ADVANTAGE" : flawless ? "FLAWLESS VICTORY" : "";
          sfx.say(flawless ? `${winner.d.name} wins. Flawless victory` : `${winner.d.name} wins`);
        }
        if (phaseT === 360) {
          if (w1 >= 2 || w2 >= 2) { completeMatch(); }
          else { round++; startRound(); }
        }
      }
    };

    const render = (alpha:number,now:number) => {
      ctx.clearRect(0,0,W,H);
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
      ctx.save();
      if (shake > 0) { const st=now*0.055; ctx.translate(Math.sin(st*1.7)*shake*0.6+Math.sin(st*3.1)*shake*0.25, Math.cos(st*2.3)*shake*0.45); }
      drawBg(alpha);
      ambient();
      if(phase==='ready'||phase==='finish'){ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(0,0,W,H);}
      if (bolt > 0) { ctx.fillStyle = `rgba(220,230,255,${bolt / 16})`; ctx.fillRect(0, 0, W, H); bolt--; }
      for (const f of [p1, p2].sort((a) => (a.act === "ko" ? -1 : 1))) drawF(f,alpha,now);
      if(phase==='finish' && cinematic && winner)drawFinisherEffects(ctx,cinematic.effect,phaseT+alpha,other(winner).x,winner.x,GROUND,cinematic.color,cinematic.index);
      for (const p of projs) {
        const r = p.wave ? 22 : 18;
        const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, r * 2);
        g.addColorStop(0, "#ffffff"); g.addColorStop(0.3, p.color); g.addColorStop(1, p.color + "00");
        ctx.fillStyle = g; ctx.beginPath();
        if (p.wave) ctx.ellipse(p.x, p.y, r * 2, r, 0, 0, 7); else ctx.arc(p.x, p.y, r * 2, 0, 7);
        ctx.fill();
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; if(!p)continue; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
        ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
        if (p.life <= 0) parts.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      for (let i = txts.length - 1; i >= 0; i--) {
        const t = txts[i]; if(!t)continue; t.y -= 1; t.life--;
        ctx.globalAlpha = Math.min(1, t.life / 20);
        ctx.font = `${t.size}px "Bebas Neue", Impact, sans-serif`; ctx.textAlign = "center";
        ctx.lineWidth = 5; ctx.strokeStyle = "#000"; ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
        if (t.life <= 0) txts.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash / 14})`; ctx.fillRect(0, 0, W, H); flash--; }
      if (banner) bigText(banner, phase==='ready'?155:250, banner.length > 10 ? 76 : 110, banner === "K.O." ? "#ff3a2a" : "#ffd36a");
      if (bannerSub) bigText(bannerSub, 320, 52, "#ffffff");
    };

    let raf = 0;
    let last = performance.now(), accumulator = 0;
    const loop = (now = performance.now()) => {
      accumulator += Math.min(now-last,100);last=now;
      if (!paused.current) {
        if (guest) {
          while(accumulator>=1000/60){accumulator-=1000/60;if(++netTick%2===0){const K=keys.current;const k:Record<string,boolean>={};for(const c of ["a","d","w","s","j","k","l","u","i"])k[c]=!!K[c];net.send({t:"in",k,taps:Object.keys(K.taps??{}),sp:K.sp});K.taps={};delete K.sp;}}
          render(Math.min(1,(now-snapAt)/33),now);
        } else {
          while(accumulator>=1000/60){update();accumulator-=1000/60;if(net&&++netTick%2===0)net.send({t:"st",s:snap()});}
          render(accumulator/(1000/60),now);
        }
        if (frame % 2 === 0) setHud({ h1: (p1.hp / p1.d.hp) * 100, h2: (p2.hp / p2.d.hp) * 100, w1, w2, time: Math.ceil(timer / 60), cd: (guest ? p2 : p1).spCd });
      }
      if(paused.current)accumulator=0;
      raf = requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    const map: Record<string, string> = { arrowleft: "a", arrowright: "d", arrowup: "w", arrowdown: "s", z: "j", x: "k", c: "l" };
    const kd = (e: KeyboardEvent) => {
      const k = map[e.key.toLowerCase()] ?? e.key.toLowerCase();
      if ((k === "escape" || k === "p") && !net) { paused.current = !paused.current; setPaused(paused.current); return; }
      if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault();
      if (!keys.current[k]) { keys.current.taps = { ...(keys.current.taps ?? {}), [k]: true }; }
      keys.current[k] = true;
    };
    const ku = (e: KeyboardEvent) => { const k = map[e.key.toLowerCase()] ?? e.key.toLowerCase(); keys.current[k] = false; };
    const clr = () => { keys.current = {}; if (!net) { paused.current=true;setPaused(true); } };
    addEventListener("keydown", kd); addEventListener("keyup", ku); addEventListener("blur", clr);
    return () => { removeEventListener("blur", clr); cancelAnimationFrame(raf); removeEventListener("keydown", kd); removeEventListener("keyup", ku); unlisten?.(); window.speechSynthesis?.cancel(); };
  }, [p1Def, p2Def, arena, difficulty, roundSeconds, training, initialHealth, net, guest]);

  const hold = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); keys.current.taps = { ...(keys.current.taps ?? {}), [k]: true }; keys.current[k] = true; },
    onPointerUp: () => { keys.current[k] = false; },
    onLostPointerCapture: () => { keys.current[k] = false; },
    onPointerCancel: () => { keys.current[k] = false; },
  });
  const togglePause = () => { paused.current = !paused.current; setPaused(paused.current); };

  const currentFinishers=finishersFor(hud.w1>=2?p1Def:p2Def);
  return (
    <div className={`battle-shell ${finishState ? 'finishing-scene' : ''}`} data-finisher-stage={finishState || undefined}>
      <img src={arenaArt(arena)} alt="" className="arena-backdrop"/>
      <div className="battle-hud">
        <Bar hp={hud.h1} name={p1Def.name} wins={hud.w1}/>
        <div className="round-clock"><strong>{training ? "∞" : hud.time}</strong><span>{stage}</span></div>
        <Bar hp={hud.h2} name={p2Def.name} wins={hud.w2} right/>
      </div>
      <canvas ref={cv} width={W} height={H} className="arena-canvas" aria-label="Fighting arena"/>
      <div className="arena-caption"><span>{arena.name}</span><span>{challenge || "BEST OF THREE"}</span></div>
      {net ? <Button variant="ghost" size="icon" onClick={onQuit} className="pause-button" aria-label="Leave match">✕</Button> : <Button variant="ghost" size="icon" onClick={togglePause} className="pause-button" aria-label="Pause">Ⅱ</Button>}
      {announcement && <div className="round-announcement" role="status">{announcement}</div>}
      {finisher!==null && !guest && <div className="finisher-picker"><select aria-label="Select finisher" value={finisher} onChange={e=>setFinisher(Number(e.target.value))}>{currentFinishers.map((f,i)=><option key={f.name} value={i}>{f.name}</option>)}</select><Button variant="game" onClick={()=>{setFinisher(null);keys.current.finish=finisher;}}>FINISH</Button></div>}
      <div className="combat-dock">
        <div className="direction-pad"><span/><Button variant="control" {...hold("w")} aria-label="Jump">↑</Button><span/><Button variant="control" {...hold("a")} aria-label="Move left">←</Button><Button variant="control" {...hold("s")} aria-label="Crouch">↓</Button><Button variant="control" {...hold("d")} aria-label="Move right">→</Button></div>
        <div className="special-controls">{me.specials.map((sp,i)=><Button key={sp.name} variant="outline" disabled={hud.cd>0} onPointerDown={e=>{e.preventDefault();keys.current.sp=i;}}>{sp.name}</Button>)}<Button variant="outline" {...hold("l")}>GUARD</Button></div>
        <div className="attack-pad"><Button variant="control" {...hold("u")} aria-label="Low punch"><b>LP</b><small>LOW PUNCH</small></Button><Button variant="control" {...hold("j")} aria-label="High punch"><b>HP</b><small>HIGH PUNCH</small></Button><Button variant="control" {...hold("i")} aria-label="Low kick"><b>LK</b><small>LOW KICK</small></Button><Button variant="control" {...hold("k")} aria-label="High kick"><b>HK</b><small>HIGH KICK</small></Button></div>
      </div>
      {isPaused && <div className="pause-overlay"><h2>PAUSED</h2><Button variant="game" onClick={togglePause}>RESUME</Button><Button variant="outline" onClick={onQuit}>MAIN MENU</Button></div>}
    </div>
  );
}

function Bar({ hp, name, wins, right }: { hp: number; name: string; wins: number; right?: boolean }) {
  return (
    <div className="flex-1">
      <div className={`mb-1 flex items-center gap-2 font-display text-sm tracking-widest text-foreground ${right ? "flex-row-reverse" : ""}`}>
        {name}
        {[0, 1].map((i) => <span key={i} className={`h-3 w-3 rotate-45 border border-primary ${i < wins ? "bg-primary" : "bg-transparent"}`} />)}
      </div>
      <div className="health-track">
        <div className={`health-lag ${right ? "right-0" : "left-0"}`} style={{ width: `${Math.max(0, hp)}%` }} />
        <div className={`health-fill ${right ? "ml-auto" : ""}`} style={{ width: `${Math.max(0, hp)}%` }} />
      </div>
    </div>
  );
}
