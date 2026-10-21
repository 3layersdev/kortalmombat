import ember from '@/assets/ember-arena.jpg';
import ice from '@/assets/frozen-cathedral.jpg';
import storm from '@/assets/storm-tower.jpg';
import forest from '@/assets/jade-forest.jpg';
import courtyard from '@/assets/blood-courtyard.jpg';
import throne from '@/assets/khaos-throne.jpg';
import type { ArenaDef } from './data';

const scenes: Record<string,string> = {'The Ember Pit':ember,'Frozen Temple':ice,'Storm Tower':storm,'Jade Forest':forest,'Blood Courtyard':courtyard,'Khaos Throne':throne};
const images = new Map<string,HTMLImageElement>();
export const arenaArt = (arena:ArenaDef) => scenes[arena.name] ?? ember;
export function arenaImage(arena:ArenaDef) {
  const url=arenaArt(arena);const cached=images.get(url);if(cached)return cached;
  const image=new Image();image.decoding='async';image.src=url;images.set(url,image);return image;
}
export function warmScenery(arenas:ArenaDef[]) {
  for(const arena of arenas)void arenaImage(arena).decode().catch(()=>{});
}

// Deterministic background motion never advances the combat simulation.
export function animateScenery(ctx:CanvasRenderingContext2D,arena:ArenaDef,tick:number,reduced:boolean) {
  if(reduced)return;
  ctx.save();
  if(arena.fx==='rain') {
    const flash=Math.max(0,Math.sin(tick*.013)-.985)*18;
    ctx.globalAlpha=flash;ctx.fillStyle=arena.glow;ctx.fillRect(0,0,960,470);
  }
  if(arena.fx==='embers'||arena.fx==='ash') {
    ctx.globalCompositeOperation='screen';
    for(const x of [94,864]) {
      ctx.globalAlpha=.18+Math.sin(tick*.09+x)*.05;ctx.fillStyle=arena.glow;
      ctx.beginPath();ctx.ellipse(x,330,12+Math.sin(tick*.13+x)*3,28+Math.cos(tick*.11)*7,0,0,Math.PI*2);ctx.fill();
    }
  }
  if(arena.fx==='leaves'||arena.name==='Khaos Throne') {
    ctx.strokeStyle=arena.glow;ctx.lineWidth=1;
    for(let i=0;i<9;i++) {
      ctx.globalAlpha=.1;const x=i*120+Math.sin(tick*.01+i)*30;
      ctx.beginPath();ctx.moveTo(x,380);ctx.bezierCurveTo(x+20,310,x-20,290,x+Math.sin(tick*.015+i)*40,230);ctx.stroke();
    }
  }
  ctx.restore();
}