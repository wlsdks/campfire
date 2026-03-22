// Pick Design Tokens
// Single source of truth for all design values.
// Usage: import { colors, spacing, motion } from '@/lib/design-tokens'

// ─── Colors ──────────────────────────────────────────
export const colors = {
  // Brand — Indigo
  brand: '#4F46E5',          // indigo-600
  brandHover: '#4338CA',     // indigo-700
  brandLight: '#6366F1',     // indigo-500 (dark mode)
  brandAccent: '#4F46E5',    // indigo-600

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

  // Bar chart (indigo gradient)
  chart: {
    bar1: '#4F46E5',         // indigo-600
    bar2: '#818CF8',         // indigo-400
    bar3: '#A5B4FC',         // indigo-300
    barWrong: '#CBD5E1',
  },

  // OX Battle
  ox: {
    o: '#4F46E5',            // indigo-600
    x: '#94A3B8',
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

// ─── Icons ──────────────────────────────────────────
export const icons = {
  // Size scale — lucide-react `size` prop
  inline: 12,       // inline with text
  accordion: 14,    // accordion headers
  button: 16,       // inside buttons
  header: 18,       // header actions
  headerLg: 20,     // large header icons
  action: 22,       // bottom bar (mobile)
  tab: 24,          // tab bar (mobile)
  // Stroke
  default: 2,
  active: 2,
  inactive: 1.5,
  // Color
  color: 'text-slate-400',
  colorActive: 'text-slate-700 dark:text-slate-200',
};

// ─── Press Feedback (Web + Mobile) ──────────────────
export const press = {
  // Web (desktop hover + click)
  button: { scale: 0.97 },          // CTA, secondary buttons
  buttonSm: { scale: 0.9 },         // icon-only buttons (send, close)
  card: { scale: 0.98 },            // clickable cards
  accordion: 'active:bg-slate-100', // accordion headers (CSS only)
  iconBtn: { scale: 0.9 },          // small icon buttons
  // Mobile (touch — stronger feedback as haptic substitute)
  mobileButton: { scale: 0.95 },    // choice/quiz options
  mobileTab: { scale: 0.92 },       // bottom tab bar
  mobileSend: { scale: 0.9 },       // send buttons
  mobileCard: { scale: 0.98 },      // tappable cards
  // Selection bounce (after selecting an option)
  selectionBounce: { scale: [0.95, 1.04, 1] },
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
  // Spring presets — use ONLY these values across all files
  spring: {
    default: { type: 'spring', stiffness: 300, damping: 25 },
    gentle: { type: 'spring', stiffness: 200, damping: 20 },
    bouncy: { type: 'spring', stiffness: 400, damping: 22 },
    stiff: { type: 'spring', stiffness: 500, damping: 30 },
    // Note: smooth(80/20) was replaced by gentle(200/20) across all files
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
  // Entry y-offset presets
  offset: { sm: 8, md: 12, lg: 20 },
  // Entry animations
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slideUp: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
  slideUpSm: { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } },
  slideUpLg: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
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
  card: 'bg-white rounded-xl shadow-sm border border-slate-200 p-5',
  cardHover: 'bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow',
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
  input: 'w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all',
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
  skeleton: 'animate-shimmer rounded-lg',
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

// ─── Mobile Design Tokens (< 768px) ─────────────────
// Reference: 토스, 당근, 카카오, Apple HIG
// These values override web defaults on mobile breakpoints.
export const mobile = {
  // Typography — all sizes +1~2px from web
  typography: {
    body: '15px',            // text-[15px] — web: 14px
    bodyLarge: '16px',       // text-base
    sectionTitle: '16px',    // text-[16px] — web: 14px
    pageTitle: '16px',       // text-base — web: 20px (space-saving)
    hero: '36px',            // text-4xl — big numbers
    caption: '13px',         // text-[13px] — web: 12px
    tabLabel: '11px',        // text-[11px] — Apple HIG standard
    chatBubble: '15px',      // text-[15px] — KakaoTalk reference
    chatSender: '13px',      // text-[13px]
    chatTime: '11px',        // text-[11px]
  },
  // Spacing — generous padding, bg contrast sections
  spacing: {
    pagePadding: '20px',     // px-5
    cardPadding: '20px',     // p-5
    sectionGap: '8px',       // space-y-2 (당근/카카오 thick divider)
    itemGap: '4px',          // space-y-1
    headerPadding: 'px-5 py-3.5',
  },
  // Components
  components: {
    touchTarget: '44px',     // Apple HIG minimum
    tabBarHeight: '56px',    // + safe area inset
    iconSize: '22px',        // bottom bar icons
    tabIconSize: '24px',     // tab bar icons
    avatarChat: '36px',      // w-9 chat avatar
    buttonRadius: '12px',    // rounded-xl
    cardRadius: '16px',      // rounded-2xl
  },
  // Section separation — no borders, bg contrast only
  separation: {
    method: 'bg-contrast',   // bg-slate-50 page + bg-white cards
    sectionDivider: 'h-2 bg-slate-100', // 8px gray bar (당근 pattern)
    itemDivider: 'border-b border-slate-100', // thin hairline
    forbidden: ['shadow', 'border+shadow', 'colored-borders'],
  },
  // Modal behavior
  modal: {
    mobile: 'fixed inset-0',           // fullscreen
    tablet: 'fixed inset-auto 420x600', // centered
    animation: 'y: 20→0',              // slide up from bottom
  },
  // Press feedback → use top-level `press` export instead
};
