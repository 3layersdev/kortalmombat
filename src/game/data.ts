import { signatureFor } from './finishers';

export type SpecialType = "projectile" | "freeze" | "dash" | "uppercut" | "teleport" | "slam";
export interface Special { name: string; input: string[]; type: SpecialType; dmg: number; color: string; desc: string }
export interface FighterDef {
  id: string; name: string; title: string; color: string; accent: string;
  skinId?: string; hue?: number;
  hp: number; speed: number; power: number; jump: number; scale?: number; boss?: boolean;
  specials: Special[];
}
export interface ArenaDef {
  name: string; sky: [string, string]; glow: string; far: string; pillar: string; floor: string;
  fx: "embers" | "snow" | "rain" | "leaves" | "ash"; deco: "pillars" | "trees" | "towers" | "torches" | "spikes";
}

export const ARENAS: ArenaDef[] = [
  { name: "The Ember Pit", sky: ["#1a0505", "#5a160a"], glow: "#ff9a3a", far: "#2a0806", pillar: "#0a0202", floor: "#2a0a06", fx: "embers", deco: "spikes" },
  { name: "Frozen Temple", sky: ["#04101e", "#1d4a6a"], glow: "#bfe8ff", far: "#0d2236", pillar: "#06121e", floor: "#1a3348", fx: "snow", deco: "pillars" },
  { name: "Storm Tower", sky: ["#05060f", "#2a2f5a"], glow: "#d8dcff", far: "#141838", pillar: "#05060c", floor: "#1a1c30", fx: "rain", deco: "towers" },
  { name: "Jade Forest", sky: ["#03140b", "#1f5a33"], glow: "#c8ffb0", far: "#0b2a17", pillar: "#03100a", floor: "#16301d", fx: "leaves", deco: "trees" },
  { name: "Blood Courtyard", sky: ["#14030a", "#5a0d2a"], glow: "#ff6a8a", far: "#2a0614", pillar: "#0c0206", floor: "#2a0a14", fx: "ash", deco: "torches" },
  { name: "Khaos Throne", sky: ["#0a0300", "#4a2a00"], glow: "#ffd36a", far: "#241400", pillar: "#080400", floor: "#2a1a06", fx: "embers", deco: "torches" },
  { name: "Sunken Catacomb", sky: ["#02110c", "#0f4a33"], glow: "#5aff9a", far: "#07231a", pillar: "#03100a", floor: "#0d2a1c", fx: "ash", deco: "pillars" },
  { name: "Obsidian Shore", sky: ["#0d020a", "#3a0d2e"], glow: "#ff5a6a", far: "#1c0716", pillar: "#0a0208", floor: "#1c0d16", fx: "rain", deco: "spikes" },
  { name: "Golden Dojo", sky: ["#1a0a02", "#6a3208"], glow: "#ffb04a", far: "#2e1606", pillar: "#120802", floor: "#33190a", fx: "leaves", deco: "torches" },
  { name: "Nebula Rift", sky: ["#0a0216", "#3a1a6a"], glow: "#8ad8ff", far: "#180a30", pillar: "#0a0416", floor: "#1c1030", fx: "snow", deco: "towers" },
];

export const FIGHTERS: FighterDef[] = [
  { id: "scorpan", name: "SCORPAN", title: "Spectre of Hellfire", color: "#e8b04a", accent: "#2a1a0a", hp: 100, speed: 5, power: 1, jump: 17,
    specials: [
      { name: "Hellfire", input: ["d", "f", "P"], type: "projectile", dmg: 12, color: "#ff7a2a", desc: "Hurls a fireball" },
      { name: "Hell Teleport", input: ["d", "b", "K"], type: "teleport", dmg: 11, color: "#ff4a1a", desc: "Appears behind the foe and strikes" },
    ] },
  { id: "frostek", name: "FROSTEK", title: "Lord of Ice", color: "#4ab8e8", accent: "#0a1a2a", hp: 105, speed: 4.6, power: 0.95, jump: 16,
    specials: [
      { name: "Ice Blast", input: ["d", "f", "P"], type: "freeze", dmg: 8, color: "#9ae8ff", desc: "Freezes the enemy solid" },
      { name: "Glacier Slide", input: ["b", "f", "K"], type: "dash", dmg: 11, color: "#bff0ff", desc: "Low sliding kick" },
    ] },
  { id: "raidon", name: "RAIDON", title: "God of Thunder", color: "#e8e8f0", accent: "#3a4aa8", hp: 95, speed: 5.2, power: 1, jump: 18,
    specials: [
      { name: "Thunder Bolt", input: ["d", "b", "P"], type: "projectile", dmg: 11, color: "#a8c8ff", desc: "Lightning projectile" },
      { name: "Torpedo", input: ["b", "f", "P"], type: "dash", dmg: 13, color: "#d8e4ff", desc: "Flies head-first across the arena" },
    ] },
  { id: "kanta", name: "KANTA", title: "Shokan Brute", color: "#c86a3a", accent: "#4a0a0a", hp: 120, speed: 4, power: 1.2, jump: 15, scale: 1.08,
    specials: [
      { name: "Dragon Rise", input: ["d", "d", "P"], type: "uppercut", dmg: 14, color: "#ff3a2a", desc: "Rising launcher uppercut" },
      { name: "Earthquake", input: ["d", "d", "K"], type: "slam", dmg: 12, color: "#c89a5a", desc: "Leaps and sends shockwaves" },
    ] },
  { id: "mirella", name: "MIRELLA", title: "Twin Blade Assassin", color: "#d84aa8", accent: "#2a0a20", hp: 90, speed: 6, power: 0.9, jump: 19,
    specials: [
      { name: "Sai Throw", input: ["f", "f", "P"], type: "projectile", dmg: 9, color: "#ff6ad8", desc: "Fast blade projectile" },
      { name: "Shadow Roll", input: ["b", "f", "K"], type: "dash", dmg: 10, color: "#ff9ae8", desc: "Rolling ball attack" },
    ] },
  { id: "jaxon", name: "JAXON", title: "Iron Arms Major", color: "#8a9aa8", accent: "#1a2a1a", hp: 115, speed: 4.3, power: 1.15, jump: 15,
    specials: [
      { name: "Ground Pound", input: ["d", "d", "K"], type: "slam", dmg: 13, color: "#ffd36a", desc: "Shockwaves along the floor" },
      { name: "Gotcha Rush", input: ["f", "f", "P"], type: "dash", dmg: 12, color: "#c8d8e8", desc: "Charging fist barrage" },
    ] },
];

export const BOSS: FighterDef = {
  id: "khaos", name: "KHAOS", title: "Emperor of Outworld", color: "#7a2a1a", accent: "#ffd36a", hp: 160, speed: 4.5, power: 1.3, jump: 15, scale: 1.25, boss: true,
  specials: [
    { name: "Spear Throw", input: ["d", "f", "P"], type: "projectile", dmg: 14, color: "#ffd36a", desc: "Golden spear" },
    { name: "Shoulder Charge", input: ["b", "f", "K"], type: "dash", dmg: 15, color: "#ffb04a", desc: "Crushing charge" },
    { name: "Wrath Uppercut", input: ["d", "d", "P"], type: "uppercut", dmg: 16, color: "#ff5a2a", desc: "Brutal launcher" },
  ],
};

export const inputLabel = (i: string[]) =>
  i.map((k) => ({ d: "↓", f: "→", b: "←", u: "↑", P: "P", K: "K" })[k] ?? k).join(" ");

export type GameMode = "quick" | "tournament" | "competition" | "survival" | "timeattack" | "training" | "online" | "duel";
export const MODES: {id: GameMode; name: string; detail: string; tag: string}[] = [
 {id:"quick",name:"QUICK FIGHT",detail:"One rival. Best of three.",tag:"VERSUS"},
 {id:"tournament",name:"THE TOURNAMENT",detail:"16 stages to claim the throne.",tag:"CAMPAIGN"},
 {id:"competition",name:"CHAMPIONS LEAGUE",detail:"Eight challengers. Rising stakes.",tag:"COMPETITION"},
 {id:"survival",name:"SURVIVAL",detail:"Carry your health into the next fight.",tag:"ENDURANCE"},
 {id:"timeattack",name:"TIME ATTACK",detail:"30-second rounds. No second chances.",tag:"SPEED"},
 {id:"training",name:"TRAINING",detail:"A passive rival. Unlimited practice.",tag:"PRACTICE"},
 {id:"online",name:"ONLINE TOURNAMENT",detail:"Your own 8-stage bracket vs real players' fighters.",tag:"MULTIPLAYER"},
 {id:"duel",name:"PRIVATE LOBBY",detail:"Share a code. Duel a friend.",tag:"FRIENDS"},
];
const names = ["ASHEN","CINDER","VEX","ONYX","NYX","SOLARIS","TEMPEST","ZENITH","REVENANT","KIRA","RAVEN","TALON","RIFT","EMBER","SABLE","ORION","VALKYR","HAVOC","STORM","BLAZE","SHIVER","VOLT","ECHO","DREAD","JADE","RAZE","AKIRA","NOVA","VULCAN","SPECTRE","KOBRA","RUSH","IVORY","AZURA","KAZAN","MORROW","STRIX","FANG","WARDEN","VIGIL","NOX","FURY","SAKURA","KRYO","HOLLOW","TITAN","RUNE","ZEAL","VENOM","INFERNA"];
export const EXPANDED_FIGHTERS: FighterDef[] = names.map((name,i) => {
 const base = FIGHTERS[i % FIGHTERS.length];
 if (!base) throw new Error("Missing base fighter");
 return {...base,id:name.toLowerCase(),name,skinId:base.id,hue:(Math.floor(i/6)+1)*31,title:["Flamebound Sentinel","Glacial Executioner","Stormborn Warrior","Stoneblood Titan","Shadowblade Adept","Steel Vanguard"][i%6] ?? "Warrior",hp:100+(i%5)*5,speed:4.5+(i%7)*.22,power:.92+(i%6)*.04,specials:base.specials.map((sp,j)=>({...sp,name:`${name[0]}${name.slice(1).toLowerCase()} ${j===0?"Surge":"Reversal"}`,dmg:9+(i+j)%5}))};
});
export const ORIGINAL_FIGHTERS: FighterDef[] = [
 {id:'vesper',name:'VESPER',title:'Ravenblade Assassin',color:'#51ccb9',accent:'#931735',hp:92,speed:6.1,power:.92,jump:19,specials:[{name:'Raven Step',input:['d','b','K'],type:'teleport',dmg:10,color:'#51ccb9',desc:'Crosses behind a guard to punish recovery'},{name:'Talon Rush',input:['b','f','P'],type:'dash',dmg:11,color:'#51ccb9',desc:'Fast gap closer into blade range'}]},
 {id:'aegis',name:'AEGIS',title:'Emerald Bastion',color:'#66da91',accent:'#b22b40',hp:125,speed:3.9,power:1.14,jump:14,specials:[{name:'Bastion Break',input:['d','d','K'],type:'slam',dmg:13,color:'#66da91',desc:'Ground waves punish grounded approaches'},{name:'Sentinel Rise',input:['d','f','P'],type:'uppercut',dmg:12,color:'#66da91',desc:'Heavy anti-air launcher'}]},
 {id:'calder',name:'CALDER',title:'The Magma Disciple',color:'#ef8051',accent:'#9c283d',hp:103,speed:4.9,power:1.04,jump:17,specials:[{name:'Cinder Palm',input:['d','f','P'],type:'projectile',dmg:11,color:'#ef8051',desc:'Controls space with a molten palm shot'},{name:'Caldera Rise',input:['d','d','P'],type:'uppercut',dmg:12,color:'#ef8051',desc:'Launches close rivals into the air'}]},
 {id:'nymira',name:'NYMIRA',title:'Crescent Tide Duelist',color:'#54d8e5',accent:'#a82442',hp:96,speed:5.7,power:.96,jump:18,specials:[{name:'Undertow',input:['b','f','K'],type:'dash',dmg:10,color:'#54d8e5',desc:'A rushing crescent strike closes distance'},{name:'Pearl Prison',input:['d','f','P'],type:'freeze',dmg:7,color:'#54d8e5',desc:'A binding tide creates a follow-up opening'}]},
 {id:'oryx',name:'ORYX',title:'The Ivory Hunter',color:'#8edff0',accent:'#d94839',hp:108,speed:5.2,power:1,jump:17,specials:[{name:'Ion Lance',input:['d','f','P'],type:'projectile',dmg:10,color:'#8edff0',desc:'Long-range energy lance checks advances'},{name:'Predator Shift',input:['d','b','K'],type:'teleport',dmg:11,color:'#8edff0',desc:'Repositions behind ranged opponents'}]},
];
export const ROSTER = [...ORIGINAL_FIGHTERS,...FIGHTERS,...EXPANDED_FIGHTERS,BOSS];
export const COMBO_INPUTS = [
 ["LP","LP","HP"],["LP","HP","HK"],["LK","LP","HP"],["HP","LK","HK"],["LP","LK","HK"],
 ["LK","LK","HP"],["HP","HP","HK"],["HK","LP","HP"],["LP","HP","LK","HK"],["LK","LP","HK"],
 ["HP","LK","LP"],["HK","LK","HP"],["LP","LK","HP"],["LK","HP","HK"],["HP","LP","LK"],
 ["HK","LP","LK"],["LP","LP","LK","HK"],["LK","LK","LP","HP"],["HP","LK","HK","LP"],["HK","HP","LK","LP"]
];
const comboNames = ["Fang","Crescent","Rising Storm","Shatter","Requiem","Undertow","Breaker","Spiral","Judgment","Tempest","Reversal","Eclipse","Vortex","Avalanche","Crossfire","Aftershock","Cascade","Rampage","Last Light","Oblivion"];
const attackButtons = ['LP','HP','LK','HK'];
const signatureNames:Record<string,string[]> = {vesper:['Raven','Talon','Feather','Nightfall'],aegis:['Bastion','Sentinel','Bulwark','Emerald'],calder:['Caldera','Cinder','Molten','Eruption'],nymira:['Crescent','Undertow','Pearl','Tide'],oryx:['Ion','Predator','Ivory','Hunter']};
export const combosFor = (f:FighterDef) => {
 const seed=Array.from(f.id).reduce((n,c)=>n+c.charCodeAt(0),0);
 const order=[...attackButtons];let n=seed;
 for(let i=3;i>0;i--){const j=n%(i+1);const a=order[i],b=order[j];if(a&&b){order[i]=b;order[j]=a;}n=Math.floor(n/(i+1));}
 return COMBO_INPUTS.map((input,i)=>{const special=f.specials[i%f.specials.length];const type=special?.type??'uppercut';return {name:`${f.name} ${signatureNames[f.id]?.[i%4]??special?.name.split(' ')[0]??''} ${comboNames[i]}`,input:input.map(x=>order[attackButtons.indexOf(x)]??x),damage:8+(i+seed)%7,type,color:special?.color??f.color,advantage:type==='freeze'?'BIND':type==='uppercut'?'LAUNCH':type==='teleport'?'CROSS-UP':type==='dash'?'GAP CLOSE':type==='slam'?'GROUND CONTROL':'RANGE'};});
};
export const FINISHERS = ["Soul Eclipse","Infernal Spiral","Frozen Judgment","Thunderfall","Shadow Rift","Meteor Crown","Dragon's Wrath","Crystal Prison","Void Collapse","Solar Rupture","Phantom Swarm","Iron Tempest","Crimson Nova","Abyssal Gate","Storm Requiem","Celestial Break","Spectral Chain","Obsidian Rain","Eternal Frost","Final Ascension"];
export const finishersFor = (f:FighterDef) => {
 const signature=signatureFor(f);
 return FINISHERS.map((name,i)=>({...signature,name:i===0?`${f.name} · ${signature.name}`:`${f.name} · ${signature.name} — ${name}`,index:i}));
};
export function roundWinner(h1:number,h2:number): "p1"|"p2"|"draw" { return Math.abs(h1-h2)<.001?"draw":h1>h2?"p1":"p2"; }
