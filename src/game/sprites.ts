import type { FighterDef } from './data';
const files = import.meta.glob('../assets/sprites/*.asset.json', {eager:true,import:'default'}) as Record<string,{url:string}>;
const generated = import.meta.glob('../assets/generated-sprites/*.png', {eager:true,import:'default'}) as Record<string,string>;
export type Pose = 'idle'|'walk'|'jump'|'strike'|'kick'|'block'|'hit'|'crouch'|'uppercut'|'airpunch'|'airkick'|'victory'|'walk1'|'walk2'|'walk3'|'walk4'|'punchwind'|'punchrecover'|'kickwind'|'kickrecover';
export const ALL_POSES:Pose[]=['idle','walk','jump','strike','kick','block','hit','crouch','uppercut','airpunch','airkick','victory'];
export const WALK_POSES:Pose[]=['walk1','walk2','walk3','walk4'];
export function motionPose(pose:Pose,frame:number,remaining:number,skin:string):Pose {
  if(pose==='walk')return WALK_POSES[Math.floor(frame/6)%4] ?? 'walk1';
  if(skin==='vesper' && pose==='strike')return remaining>12?'punchwind':remaining<6?'punchrecover':'strike';
  if(skin==='vesper' && pose==='kick')return remaining>16?'kickwind':remaining<8?'kickrecover':'kick';
  return pose;
}
export const posesFor = (id:string):Pose[] => [...ALL_POSES,...WALK_POSES,...(id==='vesper'?['punchwind','punchrecover','kickwind','kickrecover'] as Pose[]:[])];
export const skinClass = (f:FighterDef) => `skin-${Math.round((f.hue??0)/31)}`;
export const spriteUrl = (id:string,pose:Pose) => generated[`../assets/generated-sprites/${id}-${pose}.png`] ?? files[`../assets/sprites/${id}-${pose}.png.asset.json`]?.url ?? '';
export const fighterSprite = (f:FighterDef,pose:Pose='idle') => spriteUrl(f.skinId ?? f.id,pose);
const cache:Record<string,HTMLImageElement>={};
export function spriteImg(id:string,pose:Pose) {
 const key=`${id}-${pose}`;
 let image=cache[key];
 if(!image){image=new Image(); image.src=spriteUrl(id,pose);cache[key]=image;}
 return image;
}
export async function warmFighter(f:FighterDef) {
  const id=f.skinId??f.id;
  await Promise.all(posesFor(id).map(pose=>spriteImg(id,pose).decode().catch(()=>{})));
}