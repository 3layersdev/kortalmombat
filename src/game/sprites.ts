import type { FighterDef } from './data';
const files = import.meta.glob('../assets/sprites/*.asset.json', {eager:true,import:'default'}) as Record<string,{url:string}>;
export type Pose = 'idle'|'walk'|'jump'|'strike'|'kick'|'block'|'hit'|'crouch'|'uppercut'|'airpunch'|'airkick'|'victory';
const aliases:Partial<Record<Pose,Pose>> = {crouch:'block',uppercut:'strike',airpunch:'strike',airkick:'kick',victory:'idle'};
const sourcePose = (pose:Pose) => aliases[pose] ?? pose;
export const spriteUrl = (id:string,pose:Pose) => files[`../assets/sprites/${id}-${sourcePose(pose)}.png.asset.json`]?.url ?? '';
export const fighterSprite = (f:FighterDef,pose:Pose='idle') => spriteUrl(f.skinId ?? f.id,pose);
const cache:Record<string,HTMLImageElement>={};
export function spriteImg(id:string,pose:Pose) {
 const key=`${id}-${sourcePose(pose)}`;
 let image=cache[key];
 if(!image){image=new Image(); image.src=spriteUrl(id,pose);cache[key]=image;}
 return image;
}