# Pick UI/UX Improvement Progress

> Auto-updated each cycle. [x] = done, [ ] = pending, [~] = in progress
> Last updated: 2026-03-26

## Current: Phase 10 - Continuous Improvement

### Phase 1: Foundation
- [x] 1.0: Architecture migration → Bulletproof React structure + @ path alias
- [x] 1.1: Install deps + fonts + design tokens
- [x] 1.2: Shared UI components
- [x] 1.3: Global styles + shotshot → pinggo cleanup

### Phase 2: Student Pages
- [x] 2.1: JoinPage
- [x] 2.2: VotePage
- [x] 2.3: Voters (Choice/OX/Text)
- [x] 2.4: WaitingPage
- [x] 2.5: BottomBar + modals
- [x] 2.6: VoteConfirm
- [x] 2.R: Student review cycle

### Phase 3: Admin Pages
- [x] 3.1: AdminLogin
- [x] 3.2: AdminPage layout
- [x] 3.3: QuestionManager
- [x] 3.4: Sidebar panels
- [x] 3.5: Presentation mode
- [x] 3.R: Admin review cycle

### Phase 4: Visualizations
- [x] 4.1: BarChart
- [x] 4.2: OXBattle
- [x] 4.3: WordCloud
- [x] 4.4: QACards
- [x] 4.R: Viz review cycle

### Phase 5: Games
- [x] 5.1: Roulette
- [x] 5.2: Lottery
- [x] 5.R: Games review cycle

### Phase 6: Timer Feature
- [x] 6.1: Timer component
- [x] 6.2: Firebase timer + hook
- [x] 6.3: Admin controls
- [x] 6.4: Student display
- [x] 6.R: Timer review cycle

### Phase 7: Reactions
- [x] 7.1: Data model + hook
- [x] 7.2: ReactionBar (student)
- [x] 7.3: ReactionOverlay (admin)
- [x] 7.4: Integration
- [x] 7.R: Reactions review cycle

### Phase 8: Quiz Mode
- [x] 8.1: Data model
- [x] 8.2: Admin quiz UI (pending integration)
- [x] 8.3: Student quiz result
- [x] 8.4: Leaderboard
- [x] 8.5: Quiz flow polish (pending full integration)
- [x] 8.R: Quiz review cycle

### Phase 9: Global Polish
- [x] 9.1: Loading states (skeleton screens implemented)
- [x] 9.2: Error + empty states (consistent icon-in-box pattern)
- [x] 9.3: Micro-interactions audit (spring taps, stagger, ring feedback)
- [x] 9.4: Responsive audit (mobile + desktop verified via Playwright)
- [x] 9.5: Animation performance (purposeful animations only)
- [x] 9.6: Presenter mode polish (ESC key, dark pill, session badges)
- [x] 9.7: Connection status (ConnectionDot with emerald/amber states)
- [x] 9.R: Final review

---

## Feature Ideas (Proposals - Not Yet Approved)
> Add ideas here during cycles. Only build if genuinely high-impact.

| Idea | Rationale | Priority |
|------|-----------|----------|

---

## Cycle Log
| # | Time | Task | Notes |
|---|------|------|-------|
| 27 | 2026-03-26 | 모바일 바텀시트 UX + spring 프리셋 일관성 | ChatPanel/ClassQAPanel/DMBubble 바텀시트 전환 (y:100%→0 spring, rounded-t-2xl, drag handle), pb-safe 입력영역, ChatMessage/DMMessage/ChoiceVoter spring 프리셋 통일, OXVoter transition-all→transition-colors |
| 26 | 2026-03-26 | assignments 디자인 시스템 정합성 개선 | shadow-sm+border 이중 깊이 단서 제거 10곳, tracking-tight 추가 4곳, motion.span bounce 숫자 5곳, transition-shadow→transition-colors 2곳, spring 프리셋 1곳 |
| 25 | 2026-03-26 | 디자인 시스템 spring/transition 규칙 적용 | spring 프리셋 위반 3건(Modal/SpeedQuizCombo/GameResultOverlay) + transition-all→transition-colors 8곳 + DebateVoter tracking-tight |
| 1 | 2026-03-19 | 1.0 Architecture migration | Bulletproof React structure, @ alias, all imports updated, build passing |
| 2 | 2026-03-19 | 1.1 Deps + fonts + tokens | lucide-react, lottie-react, Pretendard+Inter CDN, design-tokens.js, global CSS |
| 3 | 2026-03-19 | 1.2 Shared UI components | Button, Card, Badge, IconButton, Skeleton, Avatar, Modal — all from design tokens |
| 4 | 2026-03-19 | 1.3 Rename + global styles | shotshot→pinggo in all files, no-session screen: dark→light + emoji→lucide icon |
| 5 | 2026-03-19 | 2.1 JoinPage redesign | Card+Badge+Avatar+Button components, Sparkles icon, avatar preview, indigo palette |
| 6 | 2026-03-19 | 2.2 VotePage redesign | Skeleton loading, question Card+Badge, ConnectionDot top-right, slate tokens |
| 7 | 2026-03-19 | 2.3 Voters redesign | Light tint buttons, selection ring, OX=indigo/slate, TextInput w/ Send icon+Button |
| 8 | 2026-03-19 | 2.4 WaitingPage | Sparkles pulse, participant count Badge, session code Badge, slate tokens |
| 9 | 2026-03-19 | 2.5 BottomBar+modals | Hand+MessageCircle icons, Modal component, Button component, slate-900 toast |
| 10 | 2026-03-19 | 2.6 VoteConfirm | Animated checkmark, 2.5s delay → waiting text transition, Clock icon, emerald-100 |
| 11 | 2026-03-19 | 2.R Student review | All checklist items pass. Zero gray/blue/emoji remnants. Desktop+mobile verified. |
| 12 | 2026-03-19 | 3.1 AdminLogin | Sparkles icon, Card+Button components, error state with AlertCircle, indigo palette |
| 13 | 2026-03-19 | 3.2 AdminPage layout | Header bar, lucide icons, mode buttons, no-session/loading screens, slate/indigo tokens |
| 14 | 2026-03-19 | 3.3 QuestionManager | Lucide type icons, icon action buttons, indigo left border active, Badge LIVE, Button components |
| 15 | 2026-03-19 | 3.4 Sidebar panels | Avatar initials, Hand/AlertCircle/Trash2 icons, Badge counts, IconButton dismiss |
| 16 | 2026-03-19 | 3.5 Presentation mode | ESC key exit, dark pill hint, session info badges, p-12 projector padding, text-lg |
| 17 | 2026-03-19 | 3.R Admin review | All checks pass. Fixed JoinToast+ConnectionDot. Zero remnants in admin scope. |
| 18 | 2026-03-19 | 4.1 BarChart+VizRenderer | Indigo bars, colored tracks, Sparkles empty state, type Badge, slate tokens |
| 19 | 2026-03-19 | 4.2 OXBattle | Indigo/slate split, dynamic winner emphasis, 2-color progress bar |
| 20 | 2026-03-19 | 4.3+4.4 WordCloud+QACards | Indigo/slate word palette, Cloud/MessageSquare empty states, slate tokens |
| 21 | 2026-03-19 | 4.R+5.1 VizReview+Roulette | Viz review passed. Roulette: indigo mono segments, Target icon, Button component |
| 22 | 2026-03-19 | 5.2+5.R Lottery+GamesReview | Indigo/slate cards, Trophy icon, Button comp. ENTIRE codebase: 0 gray/blue/emoji! |
| 23 | 2026-03-19 | 6.1+6.2 Timer component+hook | TimerRing (SVG ring, color transition, pulse), TimerControls, useTimer Firebase hook |
| 24 | 2026-03-19 | 6.3+6.4+6.R Timer full integration | Admin sidebar controls, student VotePage timer, Playwright verified, deployed |
