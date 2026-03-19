import { ThumbsUp, Flame, Heart, Laugh, PartyPopper } from 'lucide-react';

const SHARED_STYLES = {
  buttonClass: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700',
  activeClass: 'border-slate-400 bg-slate-100 text-slate-700 shadow-sm',
  bubbleBg: 'bg-slate-100',
  bubbleBorder: 'border-slate-200/60',
  bubbleIcon: 'text-slate-700',
};

export const REACTIONS = [
  {
    type: 'thumbsup',
    icon: ThumbsUp,
    label: '좋아요',
    ...SHARED_STYLES,
  },
  {
    type: 'fire',
    icon: Flame,
    label: '불꽃',
    ...SHARED_STYLES,
  },
  {
    type: 'heart',
    icon: Heart,
    label: '하트',
    ...SHARED_STYLES,
  },
  {
    type: 'laugh',
    icon: Laugh,
    label: '웃음',
    ...SHARED_STYLES,
  },
  {
    type: 'clap',
    icon: PartyPopper,
    label: '박수',
    ...SHARED_STYLES,
  },
];

export const REACTION_META = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.type, reaction])
);
