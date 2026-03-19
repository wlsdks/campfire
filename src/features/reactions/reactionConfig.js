import { ThumbsUp, Flame, Heart, Laugh, HandMetal } from 'lucide-react';

export const REACTIONS = [
  {
    type: 'thumbsup',
    icon: ThumbsUp,
    label: '좋아요',
    buttonClass: 'border-[#ddd6cb] bg-white/88 text-slate-500 hover:border-[#cdd6cf] hover:bg-[#f7f7f4] hover:text-[#355247]',
    activeClass: 'border-[#b8cbbb] bg-[#eef3ee] text-[#355247] shadow-[0_10px_24px_rgba(86,118,95,0.14)]',
    bubbleShell: 'from-sky-100/95 via-white to-sky-50/90',
    bubbleBorder: 'border-sky-200/80',
    bubbleIcon: 'text-sky-700',
    bubbleShadow: 'shadow-[0_22px_45px_rgba(56,189,248,0.20)]',
    bubbleTrail: 'bg-sky-200/70',
  },
  {
    type: 'fire',
    icon: Flame,
    label: '불꽃',
    buttonClass: 'border-[#ddd6cb] bg-white/88 text-slate-500 hover:border-[#cdd6cf] hover:bg-[#f7f7f4] hover:text-[#355247]',
    activeClass: 'border-[#b8cbbb] bg-[#eef3ee] text-[#355247] shadow-[0_10px_24px_rgba(86,118,95,0.14)]',
    bubbleShell: 'from-amber-100/95 via-white to-orange-50/90',
    bubbleBorder: 'border-amber-200/80',
    bubbleIcon: 'text-amber-700',
    bubbleShadow: 'shadow-[0_22px_45px_rgba(245,158,11,0.20)]',
    bubbleTrail: 'bg-amber-200/70',
  },
  {
    type: 'heart',
    icon: Heart,
    label: '하트',
    buttonClass: 'border-[#ddd6cb] bg-white/88 text-slate-500 hover:border-[#cdd6cf] hover:bg-[#f7f7f4] hover:text-[#355247]',
    activeClass: 'border-[#b8cbbb] bg-[#eef3ee] text-[#355247] shadow-[0_10px_24px_rgba(86,118,95,0.14)]',
    bubbleShell: 'from-rose-100/95 via-white to-pink-50/90',
    bubbleBorder: 'border-rose-200/80',
    bubbleIcon: 'text-rose-700',
    bubbleShadow: 'shadow-[0_22px_45px_rgba(244,63,94,0.20)]',
    bubbleTrail: 'bg-rose-200/70',
  },
  {
    type: 'laugh',
    icon: Laugh,
    label: '웃음',
    buttonClass: 'border-[#ddd6cb] bg-white/88 text-slate-500 hover:border-[#cdd6cf] hover:bg-[#f7f7f4] hover:text-[#355247]',
    activeClass: 'border-[#b8cbbb] bg-[#eef3ee] text-[#355247] shadow-[0_10px_24px_rgba(86,118,95,0.14)]',
    bubbleShell: 'from-yellow-100/95 via-white to-lime-50/85',
    bubbleBorder: 'border-yellow-200/80',
    bubbleIcon: 'text-yellow-700',
    bubbleShadow: 'shadow-[0_22px_45px_rgba(234,179,8,0.18)]',
    bubbleTrail: 'bg-yellow-200/70',
  },
  {
    type: 'clap',
    icon: HandMetal,
    label: '박수',
    buttonClass: 'border-[#ddd6cb] bg-white/88 text-slate-500 hover:border-[#cdd6cf] hover:bg-[#f7f7f4] hover:text-[#355247]',
    activeClass: 'border-[#b8cbbb] bg-[#eef3ee] text-[#355247] shadow-[0_10px_24px_rgba(86,118,95,0.14)]',
    bubbleShell: 'from-teal-100/95 via-white to-cyan-50/85',
    bubbleBorder: 'border-teal-200/80',
    bubbleIcon: 'text-teal-700',
    bubbleShadow: 'shadow-[0_22px_45px_rgba(20,184,166,0.18)]',
    bubbleTrail: 'bg-teal-200/70',
  },
];

export const REACTION_META = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.type, reaction])
);
