import { ThumbsUp, Flame, Heart, Laugh, PartyPopper } from 'lucide-react';

// Resting state: all monochromatic slate (no color)
// Active/flash state: each reaction gets a subtle tint for feedback
// Bubble overlay: each reaction gets a soft tint for visual variety

const SHARED_BUTTON = 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200';

export const REACTIONS = [
  {
    type: 'thumbsup',
    icon: ThumbsUp,
    label: '좋아요',
    buttonClass: SHARED_BUTTON,
    activeClass: 'border-slate-400 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm',
    bubbleBg: 'bg-slate-100',
    bubbleBorder: 'border-slate-200/60',
    bubbleIcon: 'text-slate-800',
    // For programmatic color in particles
    accentColor: '#334155', // slate-700
  },
  {
    type: 'fire',
    icon: Flame,
    label: '불꽃',
    buttonClass: SHARED_BUTTON,
    activeClass: 'border-indigo-300 bg-indigo-50 text-indigo-600 shadow-sm',
    bubbleBg: 'bg-indigo-50',
    bubbleBorder: 'border-indigo-200/60',
    bubbleIcon: 'text-indigo-600',
    accentColor: '#4F46E5', // indigo-600
  },
  {
    type: 'heart',
    icon: Heart,
    label: '하트',
    buttonClass: SHARED_BUTTON,
    activeClass: 'border-rose-300 bg-rose-50 text-rose-500 shadow-sm',
    bubbleBg: 'bg-rose-50',
    bubbleBorder: 'border-rose-200/60',
    bubbleIcon: 'text-rose-500',
    accentColor: '#F43F5E', // rose-500
  },
  {
    type: 'laugh',
    icon: Laugh,
    label: '웃음',
    buttonClass: SHARED_BUTTON,
    activeClass: 'border-amber-300 bg-amber-50 text-amber-600 shadow-sm',
    bubbleBg: 'bg-amber-50',
    bubbleBorder: 'border-amber-200/60',
    bubbleIcon: 'text-amber-600',
    accentColor: '#D97706', // amber-600
  },
  {
    type: 'clap',
    icon: PartyPopper,
    label: '박수',
    buttonClass: SHARED_BUTTON,
    activeClass: 'border-violet-300 bg-violet-50 text-violet-600 shadow-sm',
    bubbleBg: 'bg-violet-50',
    bubbleBorder: 'border-violet-200/60',
    bubbleIcon: 'text-violet-600',
    accentColor: '#7C3AED', // violet-600
  },
];

export const REACTION_META = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.type, reaction])
);
