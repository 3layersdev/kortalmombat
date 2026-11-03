let ctx: AudioContext | null = null;
let muted = false;
let musicInterval: ReturnType<typeof setInterval> | undefined;
export function sceneMusic(scene: 'menu' | 'fight' | 'victory') {
  if (musicInterval) clearInterval(musicInterval);
  let beat = 0;
  const step = () => {
    if (muted) return;
    const notes = scene === 'victory' ? [130.81,164.81,196,261.63] : scene === 'fight' ? [65.41,65.41,77.78,58.27,65.41,87.31,77.78,58.27] : [65.41,77.78,98,87.31];
    const note = notes[beat % notes.length] ?? 65.41;
    tone(note,note,.5,'triangle',.09);
    if (beat % 4 === 0) tone(note*4,note*4,1.7,'sine',.035);
    if(scene === 'fight') {tone(120,35,.13,'sine',.15);if(beat%2)noise(.07,4000,.06,'highpass');}
    beat++;
  };
  step();musicInterval=setInterval(step,scene==='fight'?230:scene==='victory'?360:570);
  return () => { if(musicInterval) clearInterval(musicInterval); };
}

export const setMuted = (m: boolean) => {
  muted = m;
  if (m && typeof window !== "undefined") window.speechSynthesis?.cancel();
};

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(dur: number, freq: number, gain: number, type: BiquadFilterType = "lowpass") {
  const c = ac(); if (!c || muted) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination); src.start();
}

function tone(f1: number, f2: number, dur: number, type: OscillatorType, gain: number) {
  const c = ac(); if (!c || muted) return;
  const o = c.createOscillator(); o.type = type;
  const g = c.createGain(); const t = c.currentTime;
  o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
}

export const sfx = {
  unlock: () => { ac(); },
  punch: () => { const v = 0.9 + Math.random() * 0.2; noise(0.07, 2200 * v, 0.55); tone(200 * v, 60, 0.08, "square", 0.22); tone(95 * v, 45, 0.1, "sine", 0.4); },
  kick: () => { const v = 0.9 + Math.random() * 0.2; noise(0.15, 850 * v, 0.75); tone(125 * v, 32, 0.2, "sine", 0.75); noise(0.05, 3200, 0.2, "highpass"); },
  jump: () => { noise(0.1, 1100, 0.14, "bandpass"); tone(220, 420, 0.09, "triangle", 0.06); },
  land: (heavy = false) => { noise(heavy ? 0.14 : 0.08, 500, heavy ? 0.45 : 0.28); tone(90, 40, heavy ? 0.16 : 0.1, "sine", heavy ? 0.5 : 0.3); },
  block: () => { tone(1500, 900, 0.07, "square", 0.15); noise(0.05, 4000, 0.3, "highpass"); },
  whoosh: () => noise(0.12, 700, 0.18, "bandpass"),
  freeze: () => { tone(2400, 800, 0.4, "triangle", 0.15); noise(0.3, 5000, 0.2, "highpass"); },
  special: (kind: string) => {
    if (kind === "teleport") tone(1200, 100, 0.35, "sine", 0.3);
    else if (kind === "slam" || kind === "uppercut") tone(90, 400, 0.3, "sawtooth", 0.2);
    else tone(220, 900, 0.3, "sawtooth", 0.15);
    noise(0.3, 1200, 0.25, "bandpass");
  },
  gong: () => { tone(110, 100, 2.2, "sine", 0.5); tone(222, 205, 1.6, "triangle", 0.2); tone(333, 318, 1.2, "sine", 0.12); },
  ko: () => { tone(300, 40, 0.9, "sawtooth", 0.3); noise(0.5, 400, 0.5); },
  select: () => tone(600, 900, 0.08, "square", 0.1),
  confirm: () => { tone(300, 1200, 0.2, "square", 0.12); noise(0.15, 2000, 0.2, "bandpass"); },
  say: (text: string) => {
    if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const spoken = text.replace(/\b[A-Z]{2,}\b/g, (w) => w[0] + w.slice(1).toLowerCase());
    const u = new SpeechSynthesisUtterance(spoken);
    u.pitch = 0.2; u.rate = 0.85; u.volume = 1;
    window.speechSynthesis.speak(u);
  },
};
