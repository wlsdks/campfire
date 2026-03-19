// Pinggo Design Tokens
// Single source of truth for all design values.
// Usage: import { colors, spacing, motion } from '@/lib/design-tokens'

// ─── Colors ──────────────────────────────────────────
export const colors = {
  // Brand
  brand: '#0F172A',          // slate-900 — CTA, primary actions
  brandLight: '#1E293B',     // slate-800 — hover state
  brandAccent: '#4F46E5',    // indigo-600 — Radio brand icon ONLY, input focus ring ONLY

  // Functional (status only, not decorative)
  success: '#10B981',        // emerald-500
  warning: '#F59E0B',        // amber-500
  error: '#EF4444',          // red-500

  // Surfaces
  bg: '#F8FAFC',             // slate-50
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',     // slate-100
  surfaceHover: '#F8FAFC',   // slate-50

  // Borders
  border: '#E2E8F0',         // slate-200
  borderLight: '#F1F5F9',    // slate-100
  borderActive: '#94A3B8',   // slate-400

  // Text
  text: {
    primary: '#0F172A',      // slate-900
    secondary: '#475569',    // slate-600
    muted: '#94A3B8',        // slate-400
    subtle: '#CBD5E1',       // slate-300
    inverse: '#FFFFFF',
  },

  // Bar chart (indigo gradient — brand exception)
  chart: {
    bar1: '#4F46E5',         // indigo-600 — correct answer / top
    bar2: '#818CF8',         // indigo-400
    bar3: '#A5B4FC',         // indigo-300
    barWrong: '#CBD5E1',     // slate-300
  },

  // OX Battle (brand differentiation)
  ox: {
    o: '#4F46E5',            // indigo-600
    x: '#94A3B8',            // slate-400
  },
};

// ─── Typography ──────────────────────────────────────
export const typography = {
  fontFamily: "'Pretendard', 'Inter', -apple-system, 'Apple SD Gothic Neo', system-ui, sans-serif",
  sizes: {
    display: 'text-4xl',     // 36px
    title: 'text-2xl',       // 24px
    heading: 'text-xl',      // 20px
    section: 'text-lg',      // 18px
    body: 'text-base',       // 16px
    small: 'text-sm',        // 14px
    caption: 'text-xs',      // 12px
    micro: 'text-[10px]',    // 10px
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

// ─── Spacing ─────────────────────────────────────────
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
};

// ─── Radius ──────────────────────────────────────────
export const radius = {
  sm: 'rounded-md',          // 6px — small buttons
  md: 'rounded-lg',          // 8px — buttons, inputs
  lg: 'rounded-xl',          // 12px — cards
  xl: 'rounded-2xl',         // 16px — modals, large cards
  full: 'rounded-full',      // avatars, badges
};

// ─── Shadows ─────────────────────────────────────────
export const shadows = {
  sm: 'shadow-sm',           // resting cards
  md: 'shadow-md',           // hover state
  lg: 'shadow-lg',           // modals, dropdowns
  xl: 'shadow-xl',           // floating panels
};

// ─── Motion ──────────────────────────────────────────
export const motion = {
  // Spring presets
  spring: {
    default: { type: 'spring', stiffness: 300, damping: 25 },
    gentle: { type: 'spring', stiffness: 200, damping: 20 },
    bouncy: { type: 'spring', stiffness: 400, damping: 22 },
    stiff: { type: 'spring', stiffness: 500, damping: 30 },
  },
  // Duration presets
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
    enter: 0.3,
    exit: 0.2,
  },
  // Easing
  ease: {
    default: [0.4, 0, 0.2, 1],
    in: [0.4, 0, 1, 1],
    out: [0, 0, 0.2, 1],
  },
  // Entry animations
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slideUp: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
  slideDown: { initial: { opacity: 0, y: -12 }, animate: { opacity: 1, y: 0 } },
  scaleIn: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } },
  // Stagger
  stagger: {
    fast: 0.03,
    normal: 0.05,
    slow: 0.08,
  },
};

// ─── Component Recipes (Tailwind) ────────────────────
export const tw = {
  // Cards
  card: 'bg-white rounded-xl shadow-sm border border-slate-100 p-5',
  cardHover: 'bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow',
  cardInteractive: 'bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]',

  // Buttons
  btnBase: 'font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]',
  btnPrimary: 'bg-slate-900 hover:bg-slate-800 text-white focus-visible:ring-slate-400',
  btnSecondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus-visible:ring-slate-300',
  btnGhost: 'hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-300',
  btnDanger: 'bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-400',
  btnSm: 'py-1.5 px-3 text-sm',
  btnMd: 'py-2.5 px-5 text-base',
  btnLg: 'py-3 px-6 text-lg',

  // Inputs
  input: 'w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all',
  inputError: 'border-red-400 focus:ring-red-500/20 focus:border-red-500',

  // Badges
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  badgePrimary: 'bg-slate-100 text-slate-700',
  badgeNeutral: 'bg-slate-50 text-slate-500',
  badgeError: 'bg-red-50 text-red-700',

  // Avatar
  avatar: 'rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold',

  // Modal
  modalBackdrop: 'fixed inset-0 bg-black/30 backdrop-blur-sm z-50',
  modalContent: 'bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto',

  // Accordion
  accordionHeader: 'w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors',
  accordionTitle: 'text-sm font-semibold text-slate-600',

  // Skeleton
  skeleton: 'animate-pulse bg-slate-200 rounded-lg',
};

// ─── Timing ──────────────────────────────────────────
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
  autoScrollDelay: 250,
};

// ─── Limits ──────────────────────────────────────────
export const limits = {
  maxReactionBubbles: 15,
  maxStoredReactions: 50,
  nicknameMinLength: 2,
  nicknameMaxLength: 10,
  chatMaxLength: 500,
  urgentQuestionMaxLength: 300,
  componentMaxLines: 200,
};

// ─── Touch ───────────────────────────────────────────
export const touch = {
  minTarget: '48px',         // minimum touch target on mobile
  dragActivation: 5,         // px distance before drag starts
};
