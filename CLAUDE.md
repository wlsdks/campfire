# Pinggo - Project Guidelines

## What is Pinggo?
Real-time classroom engagement platform. Instructors create sessions, students join via QR/code and participate in polls, quizzes, word clouds, Q&A. Korean market (한국어 UI).

## Tech Stack
- React 19 + Vite 7 + Tailwind CSS v4 + Firebase Realtime DB + Framer Motion
- Icons: lucide-react (NO emoji icons)
- Animations: lottie-react + Framer Motion (sparingly, high-impact only)
  - Lottie JSON: create inline (simple shapes/motions) or fetch from LottieFiles CDN
  - If download fails: use Framer Motion CSS animation as fallback, never block on missing Lottie
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

### Component Patterns (Tailwind recipes — use these exactly)
```
Button Primary:   bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors
Button Secondary: bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-5 rounded-lg border border-slate-200 transition-colors
Button Ghost:     hover:bg-slate-100 text-slate-600 font-medium py-2.5 px-5 rounded-lg transition-colors
Button Danger:    bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-5 rounded-lg transition-colors

Input:            w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
Input Error:      + border-red-400 focus:ring-red-500/20 focus:border-red-500

Card:             bg-white rounded-xl shadow-sm border border-slate-100 p-5
Card Hover:       + hover:shadow-md transition-shadow

Badge:            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
Badge Primary:    bg-indigo-50 text-indigo-700
Badge Success:    bg-emerald-50 text-emerald-700
Badge Warning:    bg-amber-50 text-amber-700

Modal Backdrop:   fixed inset-0 bg-black/40 backdrop-blur-sm z-50
Modal Content:    bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto

Avatar:           w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold

Toast:            fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm
```

### Key UX Flows

**Student Journey:**
```
QR/Link → JoinPage (닉네임 입력, 아바타 미리보기) → VotePage/WaitingPage 전환
  VotePage: 질문 카드 상단 + 투표 버튼 하단(thumb zone) + 하단바(손들기/질문)
  투표 후: VoteConfirm (체크 애니메이션) → "결과 기다리는 중" 상태
  WaitingPage: 부드러운 대기 애니메이션 + 참여자 수 + 세션코드
```

**Quiz Flow (Phase 8):**
```
강사: 퀴즈 질문 활성화 (타이머 시작)
학생: 답변 선택 → 타이머 종료 → 정답 공개 화면 (맞음/틀림 + 획득 점수)
강사: "정답 공개" 버튼 → 정답 하이라이트 + 분포 표시 → "리더보드" 버튼
전체: 리더보드 (상위 5명 포디움, 순위 변동 애니메이션)
점수: 정답 기본 100점 + 속도 보너스 최대 50점 (빠를수록 높음)
```

**Timer Flow (Phase 6):**
```
강사: 질문별 타이머 설정 (15/30/60/커스텀) → 질문 활성화 시 자동 시작
학생: 원형 링 카운트다운 (초록→노랑→빨강) → 5초 이하 펄스 → 0초 투표 잠금
Firebase: timerEnd timestamp로 동기화 (서버 시간 기준, 클라이언트 차이 방지)
```

**Reactions Flow (Phase 7):**
```
학생: 하단 리액션 바 (👍🔥❤️😂👏 → lucide 아이콘) → 탭 시 쿨다운 3초
강사/프레젠터: 화면 위로 떠오르는 버블 애니메이션 (2초 fade-out) + 실시간 카운트
Rate limit: 학생당 3초에 1회, Firebase에 최근 50개만 유지
```

### User Personas (작업 시 반드시 해당 관점에서 생각하기)

**학생 (Student)** — 모바일로 수업 중 참여
- 20대 대학생, 한 손으로 폰 들고 빠르게 투표해야 함
- 수업 중이라 집중 시간 짧음 → 화면 보자마자 뭘 해야 하는지 1초 안에 파악
- 투표 눌렀는데 반응 없으면 불안 → 즉각적 피드백 필수
- 퀴즈에서 순위 올라가면 은근 경쟁심 → 리더보드 보는 재미
- Wi-Fi 불안정할 수 있음 → 연결 상태 표시 중요
- "이거 좀 쿨하다" 느낌 → 친구한테 보여주고 싶은 UI

**강사 (Instructor)** — 노트북/태블릿으로 수업 진행
- 30~50대, 기술에 익숙하지 않을 수 있음 → 직관적이어야 함
- 수업 중 학생들 앞에서 사용 → 헤매면 안 됨, 자신감 있게 조작 가능해야
- 프로젝터에 띄울 때 → 글자 크고, 깔끔하고, 전문적으로 보여야
- 질문 전환이 빨라야 함 → 원클릭으로 다음 질문, 결과 보기
- 학생 참여 현황 한눈에 → 몇 명 참여했는지, 손든 학생 누구인지
- 수업 후 결과 확인 → 어떤 질문에서 학생들이 어려워했는지

**프레젠터 화면 (관객이 보는 화면)** — 프로젝터/대형 화면
- 뒷자리에서도 잘 보여야 함 → 큰 글자, 높은 대비
- 시각적으로 인상적이어야 → 실시간으로 막대 올라가는 거, 워드클라우드 형성되는 거
- 깔끔하고 프로페셔널 → 학교/기업 어디서든 어색하지 않은 UI

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
