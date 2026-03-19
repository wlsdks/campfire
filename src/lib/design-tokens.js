// Pinggo Design Tokens
// Single source of truth for all design values.
// Usage: import { colors, spacing } from '@/lib/design-tokens'

export const colors = {
  primary: {
    DEFAULT: '#4F46E5',
    light: '#818CF8',
    dark: '#3730A3',
    subtle: '#EEF2FF',
  },
  accent: {
    DEFAULT: '#06B6D4',
    light: '#22D3EE',
    subtle: '#CFFAFE',
  },
  success: { DEFAULT: '#10B981', subtle: '#D1FAE5' },
  warning: { DEFAULT: '#F59E0B', subtle: '#FEF3C7' },
  error: { DEFAULT: '#EF4444', subtle: '#FEE2E2' },

  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },

  vote: {
    A: '#4F46E5',
    B: '#10B981',
    C: '#F59E0B',
    D: '#8B5CF6',
    E: '#EC4899',
  },
};

export const typography = {
  fontFamily: "'Pretendard', 'Inter', -apple-system, system-ui, sans-serif",
  sizes: {
    display: 'text-4xl',   // 36px
    title: 'text-2xl',     // 24px
    section: 'text-lg',    // 18px
    body: 'text-base',     // 16px
    small: 'text-sm',      // 14px
    caption: 'text-xs',    // 12px
  },
};

// Tailwind class recipes for consistent components
export const tw = {
  card: 'bg-white rounded-xl shadow-sm border border-slate-100 p-5',
  cardHover: 'bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow',

  btnBase: 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  btnPrimary: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-400',
  btnSecondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus:ring-slate-300',
  btnGhost: 'hover:bg-slate-100 text-slate-600 focus:ring-slate-300',
  btnDanger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
  btnSm: 'py-1.5 px-3 text-sm',
  btnMd: 'py-2.5 px-5 text-base',
  btnLg: 'py-3 px-6 text-lg',

  input: 'w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all',
  inputError: 'border-red-400 focus:ring-red-500/20 focus:border-red-500',

  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  badgePrimary: 'bg-slate-100 text-slate-700',
  badgeSuccess: 'bg-slate-100 text-slate-600',
  badgeWarning: 'bg-slate-100 text-slate-600',
  badgeError: 'bg-red-50 text-red-700',

  avatar: 'rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold',

  modalBackdrop: 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50',
  modalContent: 'bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto',

  skeleton: 'animate-pulse bg-slate-200 rounded-lg',
};

export const timing = {
  toastDuration: 3000,
  toastGracePeriod: 2000,
  successToastDuration: 2000,
  voteConfirmDelay: 2500,
  rouletteSpinDuration: 4000,
  lotteryRevealInterval: 800,
  reactionBubbleLifetime: 2000,
  reactionCooldown: 3000,
  timerTickInterval: 200,
};

export const limits = {
  maxReactionBubbles: 15,
  maxStoredReactions: 50,
  nicknameMaxLength: 10,
  urgentQuestionMaxLength: 300,
};
