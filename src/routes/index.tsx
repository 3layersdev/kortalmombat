import { createFileRoute } from "@tanstack/react-router";
import { FightGame } from '@/components/FightGame';

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({meta:[{title:'Kortal Mombat — The Tournament'},{name:'description',content:'Enter Kortal Mombat. Choose your warrior and battle across six arcade game modes.'},{property:'og:title',content:'Kortal Mombat — The Tournament'},{property:'og:description',content:'62 warriors. Six modes. One throne.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component: FightGame,
});
