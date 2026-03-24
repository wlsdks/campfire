import { ThumbsUp, Flame, Heart, Laugh, PartyPopper } from 'lucide-react';

// 리액션은 감정 표현 — 각 리액션별 고유 색상으로 직관성 확보.
// 버튼 resting: 모노크롬 slate (Anti-AI 원칙 유지)
// 버튼 active + 버블: 각 리액션 고유 색상 (기능적 색상 사용)

const SHARED_BUTTON = 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200';

export const REACTIONS = [
  {
    type: 'thumbsup',
    icon: ThumbsUp,
    label: '좋아요',
    buttonClass: SHARED_BUTTON,
    activeClass: 'border-indigo-400 bg-indigo-500 text-white shadow-sm shadow-indigo-500/25',
    bubbleBg: 'bg-indigo-50',
    bubbleBorder: 'border-indigo-200/60',
    bubbleIcon: 'text-indigo-500',
    accentColor: '#6366F1', // indigo-500
  },
  {
    type: 'fire',
    icon: Flame,
    label: '불꽃',
    buttonClass: SHARED_BUTTON,
    activeClass: 'border-orange-400 bg-orange-500 text-white shadow-sm shadow-orange-500/25',
    bubbleBg: 'bg-orange-50',
    bubbleBorder: 'border-orange-200/60',
    bubbleIcon: 'text-orange-500',
    accentColor: '#F97316', // orange-500
  },
  {
    type: 'heart',
    icon: Heart,
    label: '하트',
    buttonClass: SHARED_BUTTON,
    activeClass: 'border-rose-400 bg-rose-500 text-white shadow-sm shadow-rose-500/25',
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
    activeClass: 'border-amber-400 bg-amber-500 text-white shadow-sm shadow-amber-500/25',
    bubbleBg: 'bg-amber-50',
    bubbleBorder: 'border-amber-200/60',
    bubbleIcon: 'text-amber-500',
    accentColor: '#F59E0B', // amber-500
  },
  {
    type: 'clap',
    icon: PartyPopper,
    label: '박수',
    buttonClass: SHARED_BUTTON,
    activeClass: 'border-emerald-400 bg-emerald-500 text-white shadow-sm shadow-emerald-500/25',
    bubbleBg: 'bg-emerald-50',
    bubbleBorder: 'border-emerald-200/60',
    bubbleIcon: 'text-emerald-500',
    accentColor: '#10B981', // emerald-500
  },
];

export const REACTION_META = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.type, reaction])
);
