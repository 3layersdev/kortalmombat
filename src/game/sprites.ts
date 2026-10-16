import type { FighterDef } from './data';
const files = import.meta.glob('../assets/sprites/*.asset.json', {eager:true,import:'default'}) as Record<string,{url:string}>;
const generated = import.meta.glob('../assets/generated-sprites/*.png', {eager:true,import:'default'}) as Record<string,string>;
export type Pose = 'idle'|'walk'|'jump'|'strike'|'kick'|'block'|'hit'|'crouch'|'uppercut'|'airpunch'|'airkick'|'victory';
export const ALL_POSES:Pose[]=['idle','walk','jump','strike','kick','block','hit','crouch','uppercut','airpunch','airkick','victory'];
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