# Pinggo Design System

> 이 문서만으로 동일한 UI/UX를 다른 프로젝트에서도 재현할 수 있어야 함.
> 모든 값은 `src/lib/design-tokens.js`에 코드로도 정의됨.
> 59차 사이클 기준 최종 업데이트.

---

## 1. 핵심 원칙

### Anti-AI Aesthetic
AI가 생성한 것처럼 보이면 안 됨. 토스, Linear, Notion처럼 절제되고 의도적인 디자인.

| 항목 | AI 기본값 (금지) | Human 디자인 (우리) |
|------|-----------------|-------------------|
| CTA 버튼 | `bg-indigo-600` | `bg-slate-900` |
| 배지 | `bg-indigo-50 text-indigo-700` | `bg-slate-100 text-slate-700` |
| 아이콘 | 컬러 원형 배경 안 | 아이콘만 bare |
| 카드 좌측 | `border-l-3 border-indigo-500` | `ring-1` or bg change |
| 바 차트 | 5색 레인보우 | 인디고 그라데이션 (브랜드 예외) |
| 빈 상태 | Sparkles + "데이터 없음" | 마스코트 + 도움말 텍스트 |
| 레이아웃 | 3열 대칭 그리드 | 비대칭, 콘텐츠 중심 |

### 체크리스트 (매 작업 후 확인)
```
[ ] 한 화면에 3가지 이상 색상? -> 2색으로 줄이기
[ ] 인디고/보라 CTA 버튼? -> bg-slate-900
[ ] 좌측 컬러 악센트 바? -> 제거
[ ] 아이콘이 색상 원형 배경 안? -> 제거
[ ] 배지가 3종 이상 다른 색상? -> slate 통일
[ ] 박스 배경에 색상 tint? -> bg-white 또는 bg-slate-50만
[ ] 과도한 그라디언트/글래스모피즘? -> 제거
[ ] 모든 요소에 동일한 hover? -> 맥락에 따라 차별화
```

---

## 2. 색상 (Colors)

### 브랜드 & 기본
| 용도 | 색상 | Tailwind | Hex |
|------|------|----------|-----|
| CTA / Primary | slate-900 | `bg-slate-900` | `#0F172A` |
| CTA hover | slate-800 | `hover:bg-slate-800` | `#1E293B` |
| 브랜드 아이콘 | indigo-600 | -- | `#4F46E5` |
| Input focus ring | -- | `focus:ring-slate-900/10` | -- |

### 배경 & 표면
| 용도 | Tailwind | Hex |
|------|----------|-----|
| 페이지 배경 | `bg-slate-50` | `#F8FAFC` |
| 카드/표면 | `bg-white` | `#FFFFFF` |
| 대체 표면 | `bg-slate-100` | `#F1F5F9` |
| hover 배경 | `bg-slate-50` | `#F8FAFC` |

### 테두리
| 용도 | Tailwind | Hex |
|------|----------|-----|
| 기본 테두리 | `border-slate-200` | `#E2E8F0` |
| 연한 테두리 | `border-slate-100` | `#F1F5F9` |
| 활성 테두리 | `border-slate-400` | `#94A3B8` |

### 텍스트
| 용도 | Tailwind | Hex |
|------|----------|-----|
| 주요 텍스트 | `text-slate-900` | `#0F172A` |
| 보조 텍스트 | `text-slate-600` | `#475569` |
| 흐린 텍스트 | `text-slate-400` | `#94A3B8` |
| 아주 흐린 | `text-slate-300` | `#CBD5E1` |
| 반전 (흰색) | `text-white` | `#FFFFFF` |

### 기능 색상 (상태 표시에만 사용, 장식 금지)
| 용도 | Tailwind | Hex |
|------|----------|-----|
| 성공/연결 | `emerald-500` | `#10B981` |
| 경고/타이머 | `amber-500` | `#F59E0B` |
| 에러/위험 | `red-500` | `#EF4444` |

### 차트 색상 (브랜드 예외)
| 용도 | Tailwind | Hex |
|------|----------|-----|
| 바 차트 1 (정답/상위) | indigo-600 | `#4F46E5` |
| 바 차트 2 | indigo-400 | `#818CF8` |
| 바 차트 3 | indigo-300 | `#A5B4FC` |
| 오답/비활성 바 | slate-300 | `#CBD5E1` |
| OX - O | indigo-600 | `#4F46E5` |
| OX - X | slate-400 | `#94A3B8` |

---

## 3. 다크 모드 (Dark Mode)

### 전략
- Tailwind CSS v4 `@custom-variant dark (&:where(.dark, .dark *))` 클래스 기반
- `useTheme` 훅: localStorage 기억 + prefers-color-scheme 연동 + html.dark 클래스 토글
- 3종 모드: 라이트 / 다크 / 시스템

### 다크 팔레트
| 용도 | 라이트 | 다크 | 다크 Tailwind |
|------|--------|------|---------------|
| 페이지 배경 | `bg-slate-50` | `bg-slate-900` | `dark:bg-slate-900` |
| 카드/패널 | `bg-white` | `bg-slate-800` | `dark:bg-slate-800` |
| 테두리 | `border-slate-200` | `border-slate-700` | `dark:border-slate-700` |
| 연한 테두리 | `border-slate-100` | `border-slate-700` | `dark:border-slate-700` |
| 주요 텍스트 | `text-slate-900` | `text-slate-100` | `dark:text-slate-100` |
| 보조 텍스트 | `text-slate-600` | `text-slate-300` | `dark:text-slate-300` |
| 흐린 텍스트 | `text-slate-400` | `text-slate-400` | (동일) |
| hover 배경 | `bg-slate-50` | `bg-slate-700` | `dark:hover:bg-slate-700` |
| CTA 버튼 | `bg-slate-900` | `bg-slate-100 text-slate-900` | `dark:bg-slate-100 dark:text-slate-900` |
| Input 배경 | `bg-white` | `bg-slate-700` | `dark:bg-slate-700` |
| 스크롤바 thumb | `#CBD5E1` | `#334155` | CSS `.dark ::-webkit-scrollbar-thumb` |
| focus-visible | indigo-600 | indigo-400 | CSS `.dark :focus-visible` |

### 다크 모드 CSS (index.css)
```css
@custom-variant dark (&:where(.dark, .dark *));

html.dark {
  color: #E2E8F0;
  background: #0F172A;
  color-scheme: dark;
}
.dark ::-webkit-scrollbar-thumb { background: #334155; }
.dark :focus-visible { outline-color: #818CF8; }
```

### 적용 범위
- 모든 UI 프리미티브: Button, Card, Badge, Avatar, Modal, IconButton, Toast, Skeleton
- 모든 레이아웃: AdminPage 3패널, SessionDashboard, VotePage, WaitingPage, JoinPage
- 모든 기능 컴포넌트: QuestionManager, ChatPanel, SessionList, Leaderboard 등
- 드로어, 에러바운더리, 연결배너 등
- 세션 헤더: AdminSessionHeader 전체 (버튼/뱃지/타이머 팝업)
- 질문 관리: QuestionList, QuickProgressCard, QuestionForm, QuestionFormSections
- 시각화: BarChart, OXBattle, QACards, ScaleChart, DebateChart, RankingChart, FillBlankChart, BetDistribution
- 아코디언: EventBooster, ModeSwitcher, HandRaiseList, UrgentQuestionList, ClassQuestionList
- 기타: CenterContent, ExportMenu, TimerControls, ParticipantList, ClassSummary

---

## 4. 타이포그래피 (Typography)

### 폰트
```css
font-family: 'Pretendard', 'Inter', -apple-system, 'Apple SD Gothic Neo', system-ui, sans-serif;
```
- Pretendard: 한국어 (CDN: cdn.jsdelivr.net/gh/orioncactus/pretendard)
- Inter: 영문/숫자 (Google Fonts)

### 크기 체계
| 이름 | 크기 | Tailwind | 용도 |
|------|------|----------|------|
| Display | 36px | `text-4xl` | 히어로 숫자, 대형 타이틀 |
| Title | 24px | `text-2xl` | 페이지 제목 |
| Heading | 20px | `text-xl` | 섹션 제목 |
| Section | 18px | `text-lg` | 서브 제목 |
| Body | 16px | `text-base` | 본문 |
| Small | 14px | `text-sm` | 보조 텍스트, 라벨 |
| Caption | 12px | `text-xs` | 캡션, 메타 정보 |
| Micro | 10px | `text-[10px]` | 힌트, 키보드 단축키 |

### 굵기
| Weight | 값 | 용도 |
|--------|---|------|
| Normal | 400 | 본문 |
| Medium | 500 | 라벨, 보조 |
| Semibold | 600 | 서브 제목, 강조 |
| Bold | 700 | 제목, 숫자 |

### 한국어 규칙
- 본문 line-height: 1.6~1.8 (html 기본 1.6, body 1.7)
- 제목 letter-spacing: -0.01em
- 숫자/금액: 크고 굵게, 라벨은 작고 연하게

---

## 5. 간격 (Spacing)

### 기본 단위: 4px
| 토큰 | 값 | Tailwind |
|------|---|----------|
| xs | 4px | `p-1` / `gap-1` |
| sm | 8px | `p-2` / `gap-2` |
| md | 12px | `p-3` / `gap-3` |
| lg | 16px | `p-4` / `gap-4` |
| xl | 24px | `p-6` / `gap-6` |
| 2xl | 32px | `p-8` / `gap-8` |
| 3xl | 48px | `p-12` / `gap-12` |

### 컴포넌트 간격
| 상황 | 간격 |
|------|------|
| 같은 그룹 내 요소 | 8px (`gap-2`) |
| 다른 섹션 사이 | 16px (`gap-4`) |
| 카드 내부 패딩 | 20px (`p-5`) |
| 모달 내부 패딩 | 24px (`p-6`) |
| 페이지 가장자리 (데스크탑) | 32px (`p-8`) |
| 페이지 가장자리 (태블릿) | 16px (`p-4`) |

---

## 6. 박스 규격 (Components)

### 카드
```
패딩: p-5 (20px)
테두리: border border-slate-100 (기본) / border-slate-200 (interactive)
모서리: rounded-xl (12px)
그림자: shadow-sm (기본) / shadow-md (hover)
배경: bg-white
다크: dark:bg-slate-800 dark:border-slate-700
```

### 버튼
| 사이즈 | 패딩 | 높이 (약) | 용도 |
|--------|------|-----------|------|
| sm | `py-1.5 px-3` | 32px | 인라인 액션 |
| md | `py-2.5 px-5` | 40px | 기본 |
| lg | `py-3 px-6` | 48px | CTA, 주요 액션 |

```
모서리: rounded-lg (8px)
전환: transition-all
프레스: active:scale-[0.97]
포커스: focus-visible:ring-2 focus-visible:ring-offset-2
다크 Primary: dark:bg-slate-100 dark:text-slate-900
다크 Secondary: dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600
다크 Ghost: dark:hover:bg-slate-700 dark:text-slate-300
다크 Danger: (동일)
```

### 입력 (Input)
```
패딩: px-4 py-3
모서리: rounded-lg (8px) / rounded-xl (12px, textarea)
테두리: border border-slate-200
포커스: focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
placeholder: text-slate-400
다크: dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100
```

### 배지 (Badge)
```
패딩: px-2.5 py-0.5
모서리: rounded-full
크기: text-xs font-medium
Primary: bg-slate-100 text-slate-700 / dark:bg-slate-700 dark:text-slate-200
Neutral: bg-slate-50 text-slate-500 / dark:bg-slate-800 dark:text-slate-400
Error: bg-red-50 text-red-700 / dark:bg-red-900/30 dark:text-red-400
```

### 아바타 (Avatar)
| 사이즈 | 크기 | 폰트 |
|--------|------|------|
| sm | w-7 h-7 | text-xs |
| md | w-9 h-9 | text-sm |
| lg | w-12 h-12 | text-base |

```
모서리: rounded-full
배경: bg-slate-100 / dark:bg-slate-700
텍스트: text-slate-700 font-semibold / dark:text-slate-200
```

### 모달
```
배경: fixed inset-0 bg-black/30 backdrop-blur-sm z-50
콘텐츠: bg-white rounded-2xl shadow-xl p-6 max-w-md
다크: dark:bg-slate-800
애니메이션: scale 0.95->1, opacity 0->1
```

### 아코디언
```
컨테이너: rounded-xl border border-slate-200 overflow-hidden / dark:border-slate-700
헤더: px-3.5 py-2.5 hover:bg-slate-50 active:bg-slate-100 / dark:hover:bg-slate-700
제목: text-sm font-semibold text-slate-600 / dark:text-slate-300
화살표: ChevronDown 14px text-slate-400, 회전 180deg
콘텐츠: AnimatePresence + height 0->auto
```

### 터치 타겟
```
최소 크기: 48px (모바일)
드래그 활성화 거리: 5px
```

### 토스트
```
위치: fixed bottom-6 left-1/2 -translate-x-1/2
배경: bg-slate-900 text-white
다크: dark:bg-slate-100 dark:text-slate-900
패딩: px-4 py-2.5
모서리: rounded-lg
그림자: shadow-lg
크기: text-sm
지속시간: 3000ms (일반), 2000ms (성공)
```

### 스켈레톤
```
animate-pulse bg-slate-200 rounded-lg
다크: dark:bg-slate-700
```

### IconButton
```
기본: p-2 rounded-lg transition-all text-slate-400 hover:bg-slate-100 hover:text-slate-600
다크: dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200
프레스: active:scale-90
```

---

## 7. 그림자 (Shadows)

| 단계 | Tailwind | 용도 |
|------|----------|------|
| sm | `shadow-sm` | 기본 카드 |
| md | `shadow-md` | hover 상태 |
| lg | `shadow-lg` | 드롭다운, 팝업 |
| xl | `shadow-xl` | 모달, 플로팅 패널 |

---

## 8. 모션 (Motion)

### Spring 프리셋
| 이름 | stiffness | damping | 용도 |
|------|-----------|---------|------|
| default | 300 | 25 | 일반 전환 |
| gentle | 200 | 20 | 부드러운 등장 |
| bouncy | 400 | 22 | 탭 피드백, 카운터 |
| stiff | 500 | 30 | 빠른 스냅 |

### Duration
| 이름 | 값 | 용도 |
|------|---|------|
| instant | 100ms | 즉각 피드백 |
| fast | 150ms | 토글, 호버 |
| normal | 200ms | 아코디언, 전환 |
| slow | 300ms | 페이지 전환 |
| enter | 300ms | 등장 |
| exit | 200ms | 퇴장 |

### Easing
| 이름 | 값 | 용도 |
|------|---|------|
| default | [0.4, 0, 0.2, 1] | 일반 |
| in | [0.4, 0, 1, 1] | 진입 |
| out | [0, 0, 0.2, 1] | 퇴출 |

### 입장 애니메이션 패턴
```jsx
// Fade + slide up (기본)
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}

// Scale in (모달, 팝업)
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}

// Slide down (드롭다운)
initial={{ opacity: 0, y: -12 }}
animate={{ opacity: 1, y: 0 }}

// Stagger (리스트)
transition={{ delay: index * 0.05 }}
```

### 프레스 피드백
| 요소 | 효과 |
|------|------|
| 작은 아이콘 버튼 | `active:scale-90` |
| 토글/선택 버튼 | `active:scale-[0.96]` |
| 큰 카드 버튼 | `active:scale-[0.98]` |
| 아코디언 헤더 | `active:bg-slate-100` |
| CTA 버튼 | `active:scale-[0.97]` |

### Stagger 프리셋
| 이름 | 값 | 용도 |
|------|---|------|
| fast | 0.03s | 밀접한 리스트 |
| normal | 0.05s | 카드 그리드 |
| slow | 0.08s | 큰 요소 |

### 특수 애니메이션
| 애니메이션 | 설명 | 적용 |
|-----------|------|------|
| 정답 파티클 버스트 | 24개 SVG 파티클(원/사각/다이아몬드), 1.2초 | 퀴즈 정답 |
| StreakBadge | Flame 아이콘 + 떨림 모션, 5연속+ 빠른 화염 | 연속 정답 |
| IdleMascot | 5종 랜덤 동작(눈 둘러보기/기울기/깜빡임/안테나), 3-6초 간격 | 대기 화면 |
| 리액션 버블 | 파티클 버스트 + 스케일/로테이션, 2초 fade-out | 학생 리액션 |
| 카운트업 | spring 기반 숫자 애니메이션 | 통계 숫자 |
| 드로어 slide | x: -100%/100% -> 0, 0.25s ease | 태블릿 사이드바 |

### 규칙
- 모든 모션 400ms 이하
- `prefers-reduced-motion` 존중 (CSS 0.01ms 강제)
- 장식 모션 금지 -- 모든 모션에 목적이 있어야 함
- 화려함 < 자연스러움 < 의미

---

## 9. 아이콘 (Icons)

- **라이브러리**: lucide-react only
- **크기 체계**: 12px (인라인), 14px (아코디언), 16px (버튼), 18-20px (헤더), 22px (큰 액션)
- **스트로크**: 기본 2, 선택됨 2, 비선택 1.6
- **색상**: `text-slate-400` (기본), `text-slate-700` (활성), `text-white` (반전)
- **다크**: `dark:text-slate-400` (기본), `dark:text-slate-200` (활성)
- **절대 금지**: Sparkles, Wand, Stars (AI 느낌), emoji

### 주요 아이콘 매핑
| 기능 | 아이콘 |
|------|--------|
| 객관식 | BarChart3 |
| 퀴즈 | Trophy |
| O/X | Circle |
| 워드클라우드 | Cloud |
| Q&A | MessageSquare |
| 감정 온도계 | Thermometer |
| 찬반 토론 | Swords |
| 순위 맞추기 | ArrowUpDown |
| 빈칸 채우기 | TextCursorInput |
| 손들기 | Hand |
| 긴급 질문 | MessageCircle |
| 수업 질문 | HelpCircle |
| 채팅 | MessageSquare |
| 삭제 | Trash2 |
| 타이머 | Clock |
| 발표 모드 | Presentation |
| 팀 대항전 | Users |
| 리더보드 | Award |
| 설정 | Settings |
| 보관함 저장 | BookmarkPlus |
| CSV 내보내기 | Download |
| 사이드바 열기 | PanelLeftOpen |
| 드로어 좌측 | List |
| 드로어 우측 | Users |
| 음소거 | Volume2 / VolumeOff |
| 테마 | Sun / Moon / Monitor |
| 트렌드 상승 | TrendingUp |
| 트렌드 하락 | TrendingDown |
| 난이도 경고 | AlertTriangle |

---

## 10. 레이아웃 (Layout)

### Admin 3패널 (Desktop 1024px+)
```
좌측: 28% (min 280px, max 460px) -- 질문 관리 + 팀 대항전 + 모드 전환
중앙: flex-1 -- 시각화/결과/질문 추가 폼
우측: 28% (min 280px, max 460px) -- 참여자/손들기/긴급질문/수업질문/랭킹/QR
패널 접기: motion.div width 0 전환, 좌측 열기 버튼 표시
```

### Admin 태블릿 (768~1023px)
```
breakpoint: useMediaQuery('(max-width: 1023px)')
중앙: flex-1 p-4 (전폭, 패딩 축소)
좌측/우측: 오버레이 드로어 (fixed, w-[340px], max-w-[85vw])
드로어 열기: 헤더 List(좌) / Users(우) 아이콘 버튼
드로어 닫기: 백드롭 클릭 또는 X 버튼
애니메이션: Framer Motion x: -100%->0 (좌) / x: 100%->0 (우), 0.25s ease
백드롭: bg-black/30 z-40
헤더 컴팩트: 세션ID/경과시간 숨김, 버튼 라벨 축소 (발표/종료)
```

### 학생 모바일 (390x844 기준)
```
전체: min-h-dvh, flex flex-col
상단: 헤더 고정 (shrink-0) -- 강의명, 질문 진행, 음소거
중앙: flex-1 (콘텐츠) -- 투표/대기/리더보드/종료
하단: 고정 바 (shrink-0) -- 손들기/긴급/질문/채팅 (4열)
```

### 전체 화면 고정
```
루트: h-dvh overflow-hidden
패널: h-full overflow-y-auto scrollbar-hide
```

### 반응형 규칙
- **텍스트 truncate**: 좁은 패널에서 긴 텍스트 잘림 처리
- **터치 타겟**: 모바일에서 최소 48px
- **패딩 축소**: 모바일/태블릿에서 p-8 -> p-4
- **폰트 축소**: 모바일에서 text-2xl -> text-xl
- **QR 코드**: 모바일에서 숨김 또는 축소
- **아코디언 기본 접힘**: 태블릿 이하에서 공간 절약
- **모바일 세션 행**: 축약 표시 ("N명"으로 간소화)

---

## 11. Tailwind 레시피 (design-tokens.js tw 객체)

```js
// Cards
card:            'bg-white rounded-xl shadow-sm border border-slate-100 p-5'
cardHover:       'bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow'
cardInteractive: 'bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]'

// Buttons
btnBase:      'font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]'
btnPrimary:   'bg-slate-900 hover:bg-slate-800 text-white focus-visible:ring-slate-400'
btnSecondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus-visible:ring-slate-300'
btnGhost:     'hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-300'
btnDanger:    'bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-400'

// Inputs
input:      'w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all'
inputError: 'border-red-400 focus:ring-red-500/20 focus:border-red-500'

// Badges
badge:        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
badgePrimary: 'bg-slate-100 text-slate-700'
badgeNeutral: 'bg-slate-50 text-slate-500'
badgeError:   'bg-red-50 text-red-700'

// Avatar
avatar: 'rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold'

// Modal
modalBackdrop: 'fixed inset-0 bg-black/30 backdrop-blur-sm z-50'
modalContent:  'bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto'

// Accordion
accordionHeader: 'w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors'
accordionTitle:  'text-sm font-semibold text-slate-600'

// Skeleton
skeleton: 'animate-pulse bg-slate-200 rounded-lg'
```

---

## 12. 타이밍 & 제한 (design-tokens.js)

### Timing
| 이름 | 값 | 용도 |
|------|---|------|
| toastDuration | 3000ms | 일반 토스트 |
| toastGracePeriod | 2000ms | 토스트 겹침 방지 |
| successToastDuration | 2000ms | 성공 토스트 |
| voteConfirmDelay | 2500ms | 투표 확인 표시 시간 |
| rouletteSpinDuration | 4000ms | 룰렛 회전 |
| lotteryRevealInterval | 800ms | 제비뽑기 카드 간격 |
| reactionBubbleLifetime | 2000ms | 리액션 버블 수명 |
| reactionCooldown | 3000ms | 리액션 재전송 대기 |
| timerTickInterval | 200ms | 타이머 갱신 주기 |
| autoScrollDelay | 250ms | 자동 스크롤 지연 |

### Limits
| 이름 | 값 | 설명 |
|------|---|------|
| maxReactionBubbles | 15 | 동시 표시 버블 수 |
| maxStoredReactions | 50 | Firebase 저장 리액션 수 |
| nicknameMinLength | 2 | 닉네임 최소 글자 |
| nicknameMaxLength | 10 | 닉네임 최대 글자 |
| chatMaxLength | 500 | 채팅 메시지 최대 |
| urgentQuestionMaxLength | 300 | 긴급 질문 최대 |
| componentMaxLines | 200 | 컴포넌트 최대 줄 수 |

### Touch
| 이름 | 값 | 설명 |
|------|---|------|
| minTarget | 48px | 모바일 최소 터치 영역 |
| dragActivation | 5px | 드래그 시작 거리 |

---

## 13. 한국 앱 스타일 가이드

토스/카카오 스타일:
- 큰 제목 + 넉넉한 여백 + 최소 장식
- 색상은 기능에만 (상태, 에러), 장식에 사용 금지
- 숫자/금액은 크고 굵게, 라벨은 작고 연하게
- 애니메이션은 상태 전환에만, 장식적 모션 없음
- 모든 아이콘/버튼에 한국어 텍스트 라벨 필수

---

## 14. 접근성 (Accessibility)

### aria 속성
| 속성 | 적용 대상 |
|------|-----------|
| aria-label | 모든 아이콘 전용 버튼, 모든 input/textarea |
| role="progressbar" | 참여율 바, 진행 바 |
| role="alert" | 에러 메시지 |
| role="status" | 토스트 |
| role="log" | 참여자 알림 |
| role="toolbar" | 학생 하단 바 |
| role="dialog" + aria-label | 모든 모달 |
| aria-expanded | 아코디언, 타이머 팝업 |
| aria-pressed | 손들기, 채팅 토글, 음소거 |
| aria-hidden | 장식용 SVG (마스코트) |
| role="group" | 객관식/OX 선택지 그룹 |

### 포커스
- `focus-visible` (키보드 전용 포커스 링, 마우스 클릭 시 링 없음)
- `focus-visible:ring-2 focus-visible:ring-offset-2`

### 모션
- `@media (prefers-reduced-motion: reduce)`: 모든 애니메이션/전환 0.01ms로 강제

---

## 15. 번들 구조

### Vite manualChunks
| 청크 | 포함 라이브러리 | 크기 (gzip) |
|------|----------------|-------------|
| vendor-react | react, react-dom, react-router-dom | ~17kB |
| vendor-firebase | firebase/app, firebase/database | ~50kB |
| vendor-motion | framer-motion | ~44kB |
| vendor-ui | lucide-react, qrcode.react | ~13kB |
| vendor-dnd | @dnd-kit/core, sortable, utilities | ~15kB |

### 코드 스플리팅 (React.lazy)
| 경로/기능 | 지연 로드 |
|-----------|-----------|
| AdminPage | 라우트 레벨 |
| VotePage | 라우트 레벨 |
| LeaderboardPage | 기능 레벨 |
| SessionEndedPage | 기능 레벨 |
| StatsView | 대시보드 탭 |
| QuestionLibraryView | 대시보드 탭 |
| MoreView | 대시보드 탭 |
| Roulette | 게임 |
| Lottery | 게임 |
| ClassSummary | 완료 세션 |
