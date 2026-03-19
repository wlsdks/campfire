import { ThumbsUp, Flame, Heart, Laugh, PartyPopper } from 'lucide-react';

export const REACTIONS = [
  {
    type: 'thumbsup',
    icon: ThumbsUp,
    label: '좋아요',
    buttonClass: 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600',
    activeClass: 'border-indigo-300 bg-indigo-50 text-indigo-600 shadow-sm',
    bubbleBg: 'bg-indigo-50',
    bubbleBorder: 'border-indigo-200/60',
    bubbleIcon: 'text-indigo-600',
  },
  {
    type: 'fire',
    icon: Flame,
    label: '불꽃',
    buttonClass: 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600',
    activeClass: 'border-amber-300 bg-amber-50 text-amber-600 shadow-sm',
    bubbleBg: 'bg-amber-50',
    bubbleBorder: 'border-amber-200/60',
    bubbleIcon: 'text-amber-600',
  },
  {
    type: 'heart',
    icon: Heart,
    label: '하트',
    buttonClass: 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500',
    activeClass: 'border-rose-300 bg-rose-50 text-rose-500 shadow-sm',
    bubbleBg: 'bg-rose-50',
    bubbleBorder: 'border-rose-200/60',
    bubbleIcon: 'text-rose-500',
  },
  {
    type: 'laugh',
    icon: Laugh,
    label: '웃음',
    buttonClass: 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500',
    activeClass: 'border-amber-300 bg-amber-50 text-amber-500 shadow-sm',
    bubbleBg: 'bg-amber-50',
    bubbleBorder: 'border-amber-200/60',
    bubbleIcon: 'text-amber-500',
  },
  {
    type: 'clap',
    icon: PartyPopper,
    label: '박수',
    buttonClass: 'border-slate-200 bg-white text-slate-500 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600',
    activeClass: 'border-cyan-300 bg-cyan-50 text-cyan-600 shadow-sm',
    bubbleBg: 'bg-cyan-50',
    bubbleBorder: 'border-cyan-200/60',
    bubbleIcon: 'text-cyan-600',
  },
];

export const REACTION_META = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.type, reaction])
);
