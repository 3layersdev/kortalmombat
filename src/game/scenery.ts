import ember from '@/assets/ember-arena.jpg';
import ice from '@/assets/frozen-cathedral.jpg';
import storm from '@/assets/storm-tower.jpg';
import forest from '@/assets/jade-forest.jpg';
import courtyard from '@/assets/blood-courtyard.jpg';
import throne from '@/assets/khaos-throne.jpg';
import catacomb from '@/assets/sunken-catacomb.jpg';
import shore from '@/assets/obsidian-shore.jpg';
import dojo from '@/assets/golden-dojo.jpg';
import rift from '@/assets/nebula-rift.jpg';
import type { ArenaDef } from './data';

const scenes: Record<string,string> = {'The Ember Pit':ember,'Frozen Temple':ice,'Storm Tower':storm,'Jade Forest':forest,'Blood Courtyard':courtyard,'Khaos Throne':throne,'Sunken Catacomb':catacomb,'Obsidian Shore':shore,'Golden Dojo':dojo,'Nebula Rift':rift};
const images = new Map<string,HTMLImageElement>();
export const arenaArt = (arena:ArenaDef) => scenes[arena.name] ?? ember;
export function arenaImage(arena:ArenaDef) {
  const url=arenaArt(arena);const cached=images.get(url);if(cached)return cached;
  const image=new Image();image.decoding='async';image.src=url;images.set(url,image);return image;
}
export function warmScenery(arenas:ArenaDef[]) {
  for(const arena of arenas)void arenaImage(arena).decode().catch(()=>{});
}

// Bounded, deterministic scenery is visible from frame one. No new assets,
// particle warm-up, timers or combat-state changes are needed.
export function animateScenery(ctx:CanvasRenderingContext2D,arena:ArenaDef,tick:number,reduced:boolean) {
  if(reduced)return;
  ctx.save();
  ctx.beginPath();ctx.rect(0,0,960,470);ctx.clip();
  const t=tick/60;
  const wrap=(value:number,size:number)=>((value%size)+size)%size;

  // Fire tongues and reflected light remain anchored to the arena edges.
  if(arena.fx==='embers'||arena.fx==='ash') {
    const throne=arena.name==='Khaos Throne';
    const courtyard=arena.fx==='ash';
    for(const x of throne||courtyard?[94,864]:[56,904]) {
      const ground=throne?286:courtyard?303:238;
      ctx.globalCompositeOperation='screen';
      const light=ctx.createRadialGradient(x,ground-22,2,x,ground-22,96);
      light.addColorStop(0,arena.glow);light.addColorStop(1,arena.glow+'00');
      ctx.globalAlpha=.17+Math.sin(t*7+x)*.04;ctx.fillStyle=light;
      ctx.fillRect(x-96,ground-118,192,192);
      for(let i=0;i<4;i++) {
        const sway=Math.sin(t*(5+i)+x+i)*9;
        const height=25+i*6+Math.sin(t*8+i+x)*8;
        const width=12-i*2;
        ctx.globalAlpha=.14+i*.035;ctx.fillStyle=i>1?arena.glow:arena.sky[1];
        ctx.beginPath();ctx.moveTo(x-width,ground);
        ctx.bezierCurveTo(x-width-8,ground-25,x+sway-12,ground-height*.8,x+sway,ground-height);
        ctx.bezierCurveTo(x+sway+6,ground-height*.5,x+width+6,ground-18,x+width,ground);
        ctx.closePath();ctx.fill();
      }
      for(let i=0;i<10;i++) {
        const rise=wrap(t*(22+i*2)+i*19,170);
        ctx.globalAlpha=(1-rise/170)*.7;ctx.fillStyle=arena.glow;
        ctx.fillRect(x+Math.sin(t*2+i)*18,ground-rise,2,3);
      }
    }
    ctx.globalCompositeOperation='source-over';
  }

  // Weather fills the distant scene immediately rather than slowly spawning.
  if(arena.fx==='snow'||arena.fx==='rain'||arena.fx==='ash'||arena.fx==='leaves') {
    const count=arena.fx==='rain'?64:arena.fx==='snow'?42:20;
    ctx.fillStyle=arena.glow;ctx.strokeStyle=arena.glow;
    for(let i=0;i<count;i++) {
      const depth=.35+(i%5)*.14;
      const rain=arena.fx==='rain',leaves=arena.fx==='leaves';
      const speed=rain?390:leaves?30:arena.fx==='snow'?24:16;
      const y=wrap(i*83+t*speed*depth,490)-12;
      const x=wrap(i*137+t*(rain?-100:leaves?32:7)*depth+Math.sin(t+i)*14,1000)-20;
      ctx.globalAlpha=rain?.16+depth*.16:.25+depth*.3;
      if(rain){ctx.lineWidth=depth;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+19*depth);ctx.stroke();}
      else if(leaves){ctx.beginPath();ctx.ellipse(x,y,4,1.6,t*1.8+i,0,Math.PI*2);ctx.fill();}
      else {ctx.beginPath();ctx.arc(x,y,(arena.fx==='snow'?2.2:1.5)*depth,0,Math.PI*2);ctx.fill();}
    }
  }

  if(arena.fx==='rain') {
    // Slow cloud-shadow bands and a restrained, traveling lightning fork.
    ctx.globalAlpha=.1;ctx.fillStyle=arena.sky[0];
    for(let i=0;i<3;i++)ctx.fillRect(wrap(t*12+i*360,1320)-360,30+i*40,310,65);
    const cycle=wrap(t,7),strike=cycle>5.7&&cycle<6.05;
    if(strike){
      const strength=Math.sin((cycle-5.7)/.35*Math.PI);
      ctx.globalAlpha=strength*.13;ctx.fillStyle=arena.glow;ctx.fillRect(0,0,960,470);
      ctx.globalAlpha=strength*.8;ctx.strokeStyle=arena.glow;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(610,0);ctx.lineTo(578,57);ctx.lineTo(597,54);ctx.lineTo(550,130);ctx.lineTo(567,121);ctx.lineTo(526,194);ctx.stroke();
      ctx.beginPath();ctx.moveTo(578,57);ctx.lineTo(635,95);ctx.lineTo(621,122);ctx.stroke();
    }
  }

  if(arena.fx==='snow') {
    // Glints travel down the frozen columns like moving ice reflections.
    ctx.globalCompositeOperation='screen';ctx.strokeStyle=arena.glow;
    for(const x of [108,218,742,852]) {
      const y=110+wrap(t*19+x,220);
      ctx.globalAlpha=.3;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y-13);ctx.lineTo(x,y+13);ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.stroke();
    }
  }

  if(arena.fx==='leaves') {
    // Hanging leafy stems sway from fixed roots, leaving the fighters clear.
    ctx.strokeStyle=arena.far;ctx.fillStyle=arena.glow;
    for(let i=0;i<8;i++) {
      const x=i<4?26+i*38:820+(i-4)*38;
      const length=80+(i%3)*35,sway=Math.sin(t*1.5+i)*17;
      ctx.globalAlpha=.85;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+4,30,x+sway,length*.7,x+sway,length);ctx.stroke();
      for(let j=1;j<5;j++) {
        ctx.globalAlpha=.32;ctx.beginPath();
        ctx.ellipse(x+sway*j/5+(j%2?5:-5),length*j/5,8,3,Math.sin(t*1.5+i)*.3+(j%2?.6:-.6),0,Math.PI*2);ctx.fill();
      }
    }
  }

  if(arena.fx==='ash') {
    // Deform the painting's own hanging cloth, preserving its artwork rather
    // than placing flat replacement banners over the scenery.
    const image=arenaImage(arena);
    if(image.complete&&image.naturalWidth) {
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      for(const [x,width] of [[142,130],[692,124]] as const) {
        ctx.save();ctx.beginPath();ctx.rect(x,0,width,280);ctx.clip();
        for(let y=0;y<280;y+=4) {
          const sway=Math.sin(t*2.2-y*.025)*(y/280)*3;
          ctx.drawImage(image,(x-4)*image.naturalWidth/960,y*image.naturalHeight/540,(width+8)*image.naturalWidth/960,4*image.naturalHeight/540,x-4+sway,y,width+8,4);
        }
        ctx.restore();
      }
    }
  }
  ctx.restore();
}