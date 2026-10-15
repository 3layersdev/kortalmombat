import { createFileRoute } from "@tanstack/react-router";
import { FightGame } from '@/components/FightGame';

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({meta:[{title:'Ember Kombat — The Tournament'},{name:'description',content:'Enter Ember Kombat. Choose your warrior and battle across six arcade game modes.'},{property:'og:title',content:'Ember Kombat — The Tournament'},{property:'og:description',content:'57 warriors. Six modes. One throne.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component: FightGame,
});
