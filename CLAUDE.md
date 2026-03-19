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

Reference: Toss (토스), Linear, Notion, Vercel, Raycast — restrained, clean, professional.

### "AI Purple Problem" 인지 (2026)
AI 코드 생성 도구는 Tailwind의 `bg-indigo-500` 기본값 때문에 인디고/보라 그라디언트를 과다 생성한다.
이것이 "AI가 만든 느낌"의 가장 큰 원인. 우리도 인디고를 쓰지만, 아래 규칙으로 차별화한다.

### AI 생성 UI의 공통 패턴 (이것을 피할 것)
1. **인디고/보라 도배** — 모든 요소가 인디고. 버튼, 배지, 카드, 배경까지 전부 같은 색
2. **과도한 그라디언트** — `bg-gradient-to-r from-indigo-500 to-purple-600` 같은 AI 기본 패턴
3. **글래스모피즘 남용** — backdrop-blur + 반투명 bg를 모든 요소에 적용
4. **균일한 radius** — 모든 요소가 `rounded-xl` 또는 `rounded-2xl`로 동일
5. **빈 공간 공포** — 여백이 있으면 장식 요소를 채워넣음
6. **과잉 애니메이션** — 모든 요소에 hover scale, transition, 스프링 효과
7. **Sparkles/Wand 아이콘** — AI 도구가 기본으로 넣는 아이콘
8. **대칭적 그리드** — 모든 카드가 완벽히 동일한 크기와 간격

### NEVER
- 인디고 + 보라 그라디언트 조합 (가장 대표적인 AI 시그니처)
- 5+ 색상을 한 화면에 사용
- 모든 요소에 그림자 + 테두리 + 라운드를 동시 적용
- `backdrop-blur`를 2개 이상의 요소에 사용
- 빈 상태에 Sparkles 아이콘 (대안: 맥락에 맞는 구체적 아이콘 사용)
- 모든 버튼/카드에 동일한 hover 효과
- 장식용 그라디언트 배경

### ALWAYS
- **색상 절제**: 인디고는 CTA(주요 액션) 버튼에만. 나머지는 슬레이트 계열
- **의미 있는 색상만**: 각 색상에 역할 부여 (인디고=액션, 에메랄드=성공, 앰버=경고/보상)
- **여백 > 장식**: 빈 공간을 장식으로 채우지 않음
- **비대칭 레이아웃**: 약간의 비대칭이 인간적 느낌을 줌
- **일관된 아이콘**: lucide-react만, 같은 stroke width/size
- **미묘한 차이**: 같은 컴포넌트도 맥락에 따라 미세하게 다른 스타일링
- **텍스트 위계**: 제목-본문-캡션의 크기/무게 차이를 명확하게
- **실제 콘텐츠 우선**: 장식적 UI 요소보다 콘텐츠가 주인공

### 한국 앱 참고 (토스 스타일)
- 큰 제목 + 넉넉한 여백 + 최소 장식
- 색상은 기능에만 사용 (상태, 액션), 장식에 사용하지 않음
- 카드 간 구분은 간격으로, 테두리가 아닌 여백으로
- 숫자/금액은 크고 굵게, 라벨은 작고 연하게
- 애니메이션은 상태 전환에만, 장식적 모션은 거의 없음

### Motion & 인터랙션 원칙
- **부드럽고 유기적** — 모든 전환은 ease-out 또는 spring, 갑작스러운 변화 없음
- **목적 있는 모션만** — 피드백/가이드/연결을 위한 것만. 장식 모션 없음
- **400ms 이하** — UI 피드백. spring: stiffness 300, damping 20-30
- **Lottie는 신중하게** — 성공/축하/빈 상태에만, 2초 이내, 인라인 JSON 우선
- **과한 것보다 없는 게 낫다** — 제거해도 UX가 깨지지 않으면 넣지 말 것

### 색상 원칙 (모노크로매틱)
- **슬레이트 중심** — 선택지, 바 차트, 액션 버튼 등 기본 UI는 슬레이트 계열
- **인디고는 CTA에만** — 주요 버튼(참여하기, 로그인)과 배지에만 사용
- **한 화면 2-3색 최대** — 슬레이트 + 1 accent (상황에 따라 인디고 or 에메랄드)
- **박스 안에 색상 넣지 말 것** — 배경색 tint 대신 텍스트 색상과 여백으로 구분
- **왼쪽 컬러 바 금지** — border-l-3 같은 좌측 악센트 바는 AI 안티패턴

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
