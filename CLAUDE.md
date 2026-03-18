# Pinggo - Project Guidelines

## What is Pinggo?
Real-time classroom engagement platform. Instructors create sessions, students join via QR/code and participate in polls, quizzes, word clouds, Q&A. Korean market (한국어 UI).

## Tech Stack
- React 19 + Vite 7 + Tailwind CSS v4 + Firebase Realtime DB + Framer Motion
- Icons: lucide-react (NO emoji icons)
- Animations: lottie-react + Framer Motion (sparingly, high-impact only)
- Fonts: Pretendard (Korean) + Inter (Latin/numbers)

## Architecture: Bulletproof React (MIT, open-source pattern)
```
src/
  app/routes/       → Thin page components (compose features, no business logic)
  components/ui/    → Shared UI primitives (Button, Card, Modal). NO business logic.
  features/         → Business features, each with api/ + components/ subdirs
    session/        → useSession, SessionStatus
    participants/   → useParticipants, ParticipantList, JoinToast
    voting/         → useVotes, ChoiceVoter, OXVoter, TextInput, VoteConfirm
    questions/      → useUrgentQuestions, UrgentQuestionList
    hand-raise/     → useHandRaises, HandRaiseList
    visualization/  → BarChart, OXBattle, WordCloud, QACards, VizRenderer
    games/          → Roulette, Lottery
    timer/          → useTimer, TimerRing (new)
    reactions/      → useReactions, ReactionBar, ReactionOverlay (new)
    quiz/           → useScores, QuizResult, Leaderboard (new)
  hooks/            → Cross-feature shared hooks only
  lib/              → firebase.js, design-tokens.js, utils
  assets/lottie/    → Lottie JSON files
  styles/           → index.css (Tailwind + globals)
```

### Import Rules
- `lib/ → components/ → features/ → app/routes/` (unidirectional only)
- Features NEVER import from other features
- No barrel files (no index.js re-exports) — direct imports only
- Use `@/` path alias (`vite.config.js` resolve alias)

---

## Design System

### Colors (design-tokens.js)
```
Primary:        #4F46E5 (Indigo-600)    Primary Subtle: #EEF2FF (Indigo-50)
Accent:         #06B6D4 (Cyan-500)      Accent Subtle:  #CFFAFE (Cyan-100)
Success:        #10B981 (Emerald-500)    Warning:        #F59E0B (Amber-500)
Error:          #EF4444 (Red-500)

Background:     #F8FAFC (Slate-50)      Surface: #FFFFFF
Border:         #E2E8F0 (Slate-200)     Border Light: #F1F5F9

Text Primary:   #0F172A (Slate-900)     Text Secondary: #475569 (Slate-600)
Text Muted:     #94A3B8 (Slate-400)     Text Inverse:   #FFFFFF

Vote: A=#4F46E5  B=#10B981  C=#F59E0B  D=#8B5CF6  E=#EC4899
```
**Rule**: MAX 2-3 colors per screen. All colors from tokens only. No random hex values.

### Typography
```css
font-family: 'Pretendard', 'Inter', -apple-system, system-ui, sans-serif;
```
- CDN: Pretendard (cdn.jsdelivr.net/gh/orioncactus/pretendard) + Inter (Google Fonts)
- Weights: 400, 500, 600, 700
- Scale: Display 36px / Title 24px / Section 18px / Body 16px / Small 14px / Caption 12px
- Korean body: line-height 1.6-1.8, letter-spacing -0.01em for headings

### Spacing & Components
- Radius: xl (12px) cards, lg (8px) buttons/inputs, full for avatars
- Shadows: shadow-sm resting, shadow-md hover, shadow-lg modals
- Spacing rhythm: 4px base (8, 12, 16, 24, 32, 48)
- Touch targets: min 48px on mobile
- Cards: `bg-white rounded-xl shadow-sm border border-slate-100 p-5`

### Framer Motion
- Entry: `opacity: 0, y: 12 → opacity: 1, y: 0` (0.3s ease-out)
- Spring: `stiffness: 400, damping: 25`
- Stagger: 0.05s per item
- Page transition: 0.2s fade

---

## Anti-AI Aesthetic (CRITICAL)

Reference: Toss (토스), Linear, Notion — restrained, clean, professional.

**NEVER**: Rainbow/gradients, 5+ colors per screen, blue-purple AI gradients, mixed icon styles, everything animated, excessive shadows+borders+radius on every element, generic tech-startup look

**ALWAYS**: Monochromatic + 1 accent, consistent shapes throughout, whitespace over decoration, lucide-react icons only (same stroke/size), Lottie only for success/celebration/empty states (under 2s, subtle)

---

## Code Quality
- JSX only (no TypeScript)
- Components under 200 lines → extract sub-components
- Hooks return `{ data, loading, error, actions }` pattern
- Cleanup Firebase listeners in useEffect
- React.memo for heavy components, useCallback for handlers-as-props
- All user-facing text in Korean
- Debounce rapid Firebase writes

## Do NOT
- Change Firebase DB structure without updating database.rules.json
- Change routing without careful consideration
- Add features without clear justification (proven effective or genuinely needed)
- Commit broken builds
- Use random colors/hex outside design tokens
