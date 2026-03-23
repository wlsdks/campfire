import { ThumbsUp, Flame, Heart, Laugh, PartyPopper } from 'lucide-react';

// Resting state: all monochromatic slate (no color)
// Active/flash state: dark CTA style (same for all — icon is the differentiator)
// Bubble overlay: slate monochrome (icon shape distinguishes reactions)

const SHARED_BUTTON = 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200';
const SHARED_ACTIVE = 'border-slate-400 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm';

export const REACTIONS = [
  {
    type: 'thumbsup',
    icon: ThumbsUp,
    label: '좋아요',
    buttonClass: SHARED_BUTTON,
    activeClass: SHARED_ACTIVE,
    bubbleBg: 'bg-slate-100',
    bubbleBorder: 'border-slate-200/60',
    bubbleIcon: 'text-slate-800',
    accentColor: '#334155', // slate-700
  },
  {
    type: 'fire',
    icon: Flame,
    label: '불꽃',
    buttonClass: SHARED_BUTTON,
    activeClass: SHARED_ACTIVE,
    bubbleBg: 'bg-slate-100',
    bubbleBorder: 'border-slate-200/60',
    bubbleIcon: 'text-slate-700',
    accentColor: '#334155',
  },
  {
    type: 'heart',
    icon: Heart,
    label: '하트',
    buttonClass: SHARED_BUTTON,
    activeClass: SHARED_ACTIVE,
    bubbleBg: 'bg-slate-100',
    bubbleBorder: 'border-slate-200/60',
    bubbleIcon: 'text-slate-700',
    accentColor: '#334155',
  },
  {
    type: 'laugh',
    icon: Laugh,
    label: '웃음',
    buttonClass: SHARED_BUTTON,
    activeClass: SHARED_ACTIVE,
    bubbleBg: 'bg-slate-100',
    bubbleBorder: 'border-slate-200/60',
    bubbleIcon: 'text-slate-700',
    accentColor: '#334155',
  },
  {
    type: 'clap',
    icon: PartyPopper,
    label: '박수',
    buttonClass: SHARED_BUTTON,
    activeClass: SHARED_ACTIVE,
    bubbleBg: 'bg-slate-100',
    bubbleBorder: 'border-slate-200/60',
    bubbleIcon: 'text-slate-700',
    accentColor: '#334155',
  },
];

export const REACTION_META = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.type, reaction])
);
