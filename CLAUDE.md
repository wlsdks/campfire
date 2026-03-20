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

### Brand Color: Orange (#EA580C / orange-600)
- CTA buttons: `bg-orange-600 hover:bg-orange-700`
- Dark mode CTA: `dark:bg-orange-500 dark:hover:bg-orange-400`
- Input focus: `focus:ring-orange-500/20 focus:border-orange-500`
- Selected/active states: `bg-orange-600`
- Keep slate for text, cards, borders, backgrounds

### Colors (design-tokens.js)
```
Brand:          #EA580C (Orange-600)     Brand Hover: #C2410C (Orange-700)
Brand Light:    #F97316 (Orange-500)     — dark mode CTA

Success:        #10B981 (Emerald-500)    Warning:        #F59E0B (Amber-500)
Error:          #EF4444 (Red-500)

Background:     #F8FAFC (Slate-50)      Surface: #FFFFFF
Border:         #E2E8F0 (Slate-200)     Border Light: #F1F5F9

Text Primary:   #0F172A (Slate-900)     Text Secondary: #475569 (Slate-600)
Text Muted:     #94A3B8 (Slate-400)     Text Inverse:   #FFFFFF

Chart bars:     Orange gradient (#EA580C → #FB923C → #FDBA74)
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
Button Primary:   bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors
                  dark: dark:bg-orange-500 dark:hover:bg-orange-400
Button Secondary: bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-5 rounded-lg border border-slate-200 transition-colors
Button Ghost:     hover:bg-slate-100 text-slate-600 font-medium py-2.5 px-5 rounded-lg transition-colors
Button Danger:    bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-5 rounded-lg transition-colors

Input:            w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all
Input Error:      + border-red-400 focus:ring-red-500/20 focus:border-red-500

Card:             bg-white rounded-xl shadow-sm border border-slate-100 p-5
Card Hover:       + hover:shadow-md transition-shadow

Badge:            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
Badge Primary:    bg-slate-100 text-slate-700
Badge Neutral:    bg-slate-50 text-slate-500
Badge Error:      bg-red-50 text-red-700

Modal Backdrop:   fixed inset-0 bg-black/30 backdrop-blur-sm z-50
Modal Content:    bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto

Avatar:           w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-semibold

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

**학생 (Student)** — 모바일 또는 노트북 웹브라우저로 수업 중 참여
- 20대 대학생, 폰(한 손) 또는 노트북 브라우저로 접속 → 둘 다 쾌적해야 함
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

Reference: Toss (토스), Linear, Notion, Vercel — restrained, dark CTA, monochromatic.

### AI 생성 UI 체크리스트 (디자인 작업 전 반드시 확인)

작업 전 아래 항목을 하나씩 확인한다. 하나라도 해당되면 수정한다.

```
□ 인디고/보라 CTA 버튼을 사용하고 있는가?
  → bg-indigo-600은 AI 기본값. bg-orange-600 사용할 것
□ 한 화면에 3가지 이상 색상이 보이는가?
  → 슬레이트 + 브랜드(orange) 최대 2색. 그 외 색상 제거
□ 왼쪽에 컬러 악센트 바(border-l-3)가 있는가?
  → 제거. ring-1 또는 bg 변경으로 대체
□ 아이콘이 색상 원형 배경 안에 있는가? (bg-XXX-100 rounded-XX)
  → 장식적이면 제거. 아이콘만 표시
□ Sparkles/Wand/Stars 아이콘을 사용하고 있는가?
  → 맥락에 맞는 구체적 아이콘으로 교체
□ 배지가 3종 이상 다른 색상인가? (success/warning/primary/error)
  → primary(slate-100) + neutral(slate-50) + error(red)만 사용
□ 박스/카드 배경에 색상 tint가 들어가 있는가? (bg-indigo-50, bg-amber-50)
  → 제거. bg-white 또는 bg-slate-50만 사용
□ 모든 요소에 동일한 hover 효과가 있는가?
  → 맥락에 따라 다른 hover 사용 (일부는 hover 없음이 적절)
□ 과도한 그라디언트/글래스모피즘이 있는가?
  → backdrop-blur는 헤더 1곳만. 그라디언트 배경 금지
□ 모든 카드/버튼이 동일한 크기와 간격인가?
  → 의도적 변화를 주어 "디자인된" 느낌 부여
```

### 우리 앱의 색상 체계 (확정)
```
브랜드 CTA:      bg-orange-600 (#EA580C)
CTA hover:       hover:bg-orange-700 (#C2410C)
CTA dark mode:   dark:bg-orange-500 (#F97316)
배지 primary:    bg-slate-100 text-slate-700
배지 neutral:    bg-slate-50 text-slate-500
배지 error:      bg-red-50 text-red-700

브랜드 아이콘:   text-orange-600 (Radio 아이콘)
Input focus:     focus:ring-orange-500/20 focus:border-orange-500
활성/선택 상태:  bg-orange-600 (탭, 토글, 선택지)
그 외 모든 UI:   slate-50 ~ slate-900 범위

절대 사용 금지:  bg-indigo-600 (AI default), bg-amber-50 (장식), bg-emerald-50 (장식)
```

### AI Default vs Human-Crafted 비교표
| 요소 | AI 기본값 (피할 것) | Human 디자인 (우리) |
|------|-------------------|-------------------|
| CTA 버튼 | `bg-indigo-600` | `bg-orange-600` |
| 배지 | `bg-indigo-50 text-indigo-700` | `bg-slate-100 text-slate-700` |
| 아이콘 | Sparkles in colored circle | Radio icon, bare |
| 카드 좌측 | `border-l-3 border-indigo-500` | `ring-1` or bg change |
| 선택지 색상 | A=인디고 B=에메랄드 C=앰버 D=바이올렛 | 전부 slate 모노크로매틱 |
| 바 차트 | 5색 레인보우 | Teal 그라데이션 (브랜드) |
| 빈 상태 | Sparkles + "데이터 없음" | 마스코트 + 도움말 텍스트 |
| 레이아웃 | 3열 대칭 그리드 | 비대칭, 콘텐츠 중심 |
| 폰트 | Inter only, 균일 weight | Pretendard, 명확한 위계 |

### 한국 앱 참고 (토스/카카오 스타일)
- 큰 제목 + 넉넉한 여백 + 최소 장식
- 색상은 기능에만 (상태, 에러), 장식에 사용하지 않음
- 숫자/금액은 크고 굵게, 라벨은 작고 연하게
- 애니메이션은 상태 전환에만, 장식적 모션 없음
- 모든 아이콘/버튼에 한국어 텍스트 라벨 필수

### Motion 원칙
- **부드럽고 유기적** — ease-out 또는 spring (stiffness 260-340, damping 22-30)
- **목적 있는 모션만** — 피드백/가이드/연결. 장식 모션 없음
- **400ms 이하** — UI 피드백은 빠르게
- **스태거는 미세하게** — 0.03-0.06s per item, 눈에 띄면 과함
- **Lottie 인라인 JSON 사용 금지** — 브라우저 호환 불안정. Framer Motion SVG로 대체
- **SVG path 애니메이션 추천** — `motion.path` + `pathLength` 조합이 가장 안정적
- **과한 것보다 없는 게 낫다**

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
