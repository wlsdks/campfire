import { Sparkles, Ticket, Trophy, Zap } from 'lucide-react';
import { getQuizEventBadges, normalizeQuizEvent } from '@/lib/quiz';

const STATE_STYLES = {
  pending: {
    card: 'border-[#d9d2c5] bg-[#fdfbf7] text-[#342d23] shadow-[0_16px_28px_rgba(41,37,36,0.06)]',
    accent: 'bg-[#7c7a66]',
    label: 'bg-white text-[#6a6757] border border-[#ddd6ca]',
    chip: 'border-[#ddd6ca] bg-white text-[#5f5b4d]',
    icon: 'border-[#ddd6ca] bg-white text-[#5b604a]',
    title: '다음 퀴즈 이벤트',
  },
  active: {
    card: 'border-[#d4d6cf] bg-[#fbfcf9] text-[#2f332c] shadow-[0_16px_28px_rgba(41,37,36,0.06)]',
    accent: 'bg-[#5d725d]',
    label: 'bg-white text-[#596756] border border-[#d7dbd2]',
    chip: 'border-[#d7dbd2] bg-white text-[#4f5d4b]',
    icon: 'border-[#d7dbd2] bg-white text-[#4f5d4b]',
    title: '보너스 라운드 진행 중',
  },
  result: {
    card: 'border-[#d9d2c5] bg-[#fdfbf7] text-[#342d23] shadow-[0_16px_28px_rgba(41,37,36,0.06)]',
    accent: 'bg-[#5d725d]',
    label: 'bg-white text-[#596756] border border-[#ddd6ca]',
    chip: 'border-[#ddd6ca] bg-white text-[#5f5b4d]',
    icon: 'border-[#ddd6ca] bg-white text-[#4f5d4b]',
    title: '적용된 이벤트',
  },
};

const EVENT_ICONS = {
  'double-points': Trophy,
  'ticket-rush': Ticket,
  jackpot: Zap,
};

export default function QuizEventBanner({ event, state = 'active', compact = false, className = '' }) {
  const normalized = normalizeQuizEvent(event);
  if (!normalized) return null;

  const style = STATE_STYLES[state] || STATE_STYLES.active;
  const Icon = EVENT_ICONS[normalized.id] || Sparkles;
  const badges = getQuizEventBadges(normalized);

  return (
    <div className={`relative overflow-hidden rounded-[24px] border px-4 py-3 ${style.card} ${className}`}>
      <div className={`absolute inset-y-0 left-0 w-1.5 ${style.accent}`} />
      <div className={`relative flex items-start gap-3 ${compact ? 'items-center' : ''}`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border ${style.icon}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase ${style.label}`}>
              {style.title}
            </span>
            <span className="font-semibold text-sm tracking-[-0.01em]">{normalized.label}</span>
          </div>
          {!compact && (
            <p className="max-w-[28rem] text-sm leading-relaxed opacity-90">
              {normalized.description}
            </p>
          )}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${style.chip}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
