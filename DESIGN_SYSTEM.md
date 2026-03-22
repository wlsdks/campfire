# Pick Design System

> 이 문서만으로 동일한 UI/UX를 다른 프로젝트에서도 재현할 수 있어야 함.
> 모든 값은 `src/lib/design-tokens.js`에 코드로도 정의됨.
> 2026-03-22 기준 최신 업데이트.

---

## 1. 핵심 원칙

### Anti-AI Aesthetic
AI가 생성한 것처럼 보이면 안 됨. 토스, Linear, Notion처럼 절제되고 의도적인 디자인.

| 항목 | AI 기본값 (금지) | Human 디자인 (우리) |
|------|-----------------|-------------------|
| CTA 버튼 | `bg-indigo-600` | `bg-slate-900` (dark CTA) |
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

### CTA & 브랜드
| 용도 | Tailwind | Hex | 비고 |
|------|----------|-----|------|
| CTA 버튼 | `bg-slate-900` | `#0F172A` | Dark CTA (Linear/Toss 스타일) |
| CTA hover | `hover:bg-slate-800` | `#1E293B` | |
| CTA dark mode | `dark:bg-slate-100 dark:text-slate-900` | | 반전 |
| 브랜드 아이콘 | `text-indigo-600` | `#4F46E5` | 사자 마스코트 (PickMascot) |
| 악센트 (indigo) | `indigo-600/500/400/300` | | 차트 바, 포커스 링, 진행바 전용 |
| 진행 바 fill | `bg-indigo-500 dark:bg-indigo-400` | | 학생 질문 진행, 응답률 바 |
| 참여율 바 fill | `bg-slate-700 dark:bg-slate-300` | | 수업 기록 참여율 (모노크롬) |
| Input focus ring | `focus:ring-indigo-500/20` | | |
| 활성/선택 상태 | `bg-slate-900 text-white` | | 탭, 토글, 선택지 |

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

### 차트 색상 (브랜드)
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
- 시각화: BarChart, OXBattle, QACards, ScaleChart, WordCloud, DebateChart, RankingChart, FillBlankChart, BetDistribution, ConfidenceStats
- 아코디언: EventBooster, ModeSwitcher, HandRaiseList, UrgentQuestionList, ClassQuestionList
- 기타: CenterContent, ExportMenu, TimerControls, ParticipantList, ClassSummary
- 스태프: StaffPage, StaffQuestionPanel, StaffQuestionDetail, StaffRightPanel, StaffMobileView

### 다크모드 주의사항
- `text-slate-400`은 라이트/다크 양쪽에서 보이므로 dark: 생략 가능하나, 더 나은 대비를 위해 `dark:text-slate-500` 권장
- `text-slate-300` (장식용)은 반드시 `dark:text-slate-600` 추가 (다크 배경에서 안 보임)
- WordCloud처럼 inline style로 색상 지정하면 다크모드 불가 → Tailwind 클래스 사용
- ScaleChart 히스토그램처럼 동적 색상 매핑은 `'bg-slate-200 dark:bg-slate-700'` 형태로 양쪽 포함

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
전환: transition-all duration-150
프레스: active:scale-[0.97]
포커스: focus-visible:ring-2 focus-visible:ring-offset-2
다크 Primary: dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900
다크 Secondary: dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600
다크 Ghost: dark:hover:bg-slate-700 dark:text-slate-300
다크 Danger: (동일)
```

### 입력 (Input)
```
패딩: px-4 py-3
모서리: rounded-lg (8px) / rounded-xl (12px, textarea)
테두리: border border-slate-200
포커스: focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
placeholder: text-slate-400
다크: dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100
```

### 배지 (Badge)
```
패딩: px-2.5 py-0.5
모서리: rounded-full
크기: text-xs font-medium
테두리: 없음 (border 사용 금지)
변형 3종만 사용:
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

### 채팅 메시지 (ChatPanel)
```
내 메시지:   bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-2xl rounded-br-sm
상대 메시지: bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm
아바타:      w-8 h-8 rounded-full bg-slate-100 text-xs font-semibold (이니셜 1자)
강사 배지:   bg-slate-100 rounded-full px-1.5 py-0.5 text-[10px]
메시지 간격: gap-3
스마트 스크롤: 하단 100px 이내→자동, 위 스크롤→유지
```

### 경품 추첨 (PrizeDraw)
```
슬롯 릴: text-3xl font-bold, 2.5s rapid cycling
당첨 카드: bg-white rounded-2xl shadow-xl p-8
당첨 배지: bg-slate-900 text-white rounded-full px-3 py-1 text-sm font-bold
레이아웃: 1명=중앙, 2-3명=flex row, 4+명=grid-cols-2
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
| StreakBadge 3단계 | 3+: 흰 배지 + 느린 flame(0.8s), 5+: 다크 배지 + 빠른 flame(0.5s), 10+: shadow-lg + pulse + 큰 flame(0.35s) + 🔥 | 연속 정답 |
| IdleMascot | 5종 랜덤 동작(눈 둘러보기/기울기/깜빡임/귀 흔들기), 3-6초 간격 | 대기 화면 |
| 리액션 버블 | 파티클 버스트 + 스케일/로테이션, 2초 fade-out | 학생 리액션 |
| 카운트업 | spring 기반 숫자 애니메이션 | 통계 숫자 |
| 드로어 slide | x: -100%/100% -> 0, 0.25s ease | 태블릿 사이드바 |
| 아코디언 흔들림 | x [0, -4, 4, -3, 3, -1, 1, 0], 0.5초 | 새 질문/손들기 수신 시 |
| ReviewingBanner | fade+slide, pulse dot | 강사 질문 확인 중 알림 |
| 경품 추첨 슬롯 | 이름 rapid cycling 2.5s → 당첨 spring bounce + ConfettiBurst | 경품 추첨 모드 |
| 참여자 수 bounce | key={count} scale 1.2→1 spring | 대기 화면 참여자 입장 시 |
| 리더보드 순위 reveal | scale 0→1, spring 400/22 | 순위 발표 |
| 타이머 긴박감 2단계 | 5초↓: pulse(1→1.03), 3초↓: shake(±3px) + 강한 pulse(1→1.04) | 퀴즈 카운트다운 |

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

### 마스코트 (PickMascot)
- 사자 캐릭터 — 팀 아슬란(Aslan) 브랜딩
- 뭉글뭉글한 갈기, 큰 눈, 볼터치
- 사이즈: xs(36px) 헤더/인라인, sm(48px) 조인/로그인, md(72px) 빈상태, lg(100px) 랜딩/대기
- 파일: `src/components/ui/PickMascot.jsx`
- 대기 화면용 IdleMascot: 눈 깜빡임, 좌우 눈동자, 귀 흔들림 애니메이션

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
btnPrimary:   'bg-slate-900 hover:bg-slate-800 text-white focus-visible:ring-slate-400'  // dark CTA (Linear/Toss style)
btnSecondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus-visible:ring-slate-300'
btnGhost:     'hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-300'
btnDanger:    'bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-400'

// Inputs
input:      'w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all'
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

## 14. Design Reference (2025-2026 트렌드)

> 출처: Apple HIG, Linear, Notion, Toss, Vercel Geist, Stripe
> 디자인 작업 시 항상 참고. 우리 앱에 적용 가능한 원칙 위주로 정리.

### 전략적 미니멀리즘 (Strategic Minimalism)

> "모든 요소가 자리를 차지할 자격을 증명해야 한다" — Linear
> "대부분의 사람이 뭐가 바뀌었는지 바로 못 알아차리면, 그게 좋은 거다" — Linear

- **타이포가 짐을 진다**: 색상/장식 대신 폰트 크기·두께·여백으로 위계
- **화면당 CTA 하나**: 주요 액션 1개만 시각적으로 강조
- **여백이 디자인이다**: "비어있는 것"이 아니라 "의도적으로 설계된 것"
- **빼기의 미학**: 요소를 추가하지 말고, 불필요한 것을 제거

### 여백(Whitespace) 원칙

| 원칙 | 설명 | 출처 |
|------|------|------|
| 심리적 그룹핑 | 미묘한 여백 차이로 관련 요소를 시각적으로 묶음 | Notion |
| 기능적 여백 | 여백은 장식이 아닌 시선 유도 도구 | Apple, Toss |
| 콘텐츠 밀도 | 적을수록 좋다 — 모든 것이 존재 이유를 증명해야 함 | Linear, Vercel |
| 점진적 공개 | 요약 → 확장 → 전체 분석 3단계 | Stripe |

**적용 가이드:**
```
같은 그룹 내 요소 간격:   gap-3~4 (12-16px)
다른 그룹/섹션 간 간격:   gap-5~8 (20-32px)
탭 ↔ 콘텐츠 간격:        최소 mb-5 (20px) — 시각적 분리
카드 내부 패딩:           일반 p-4~5, 히어로/입력 p-6~8 (중요도에 따라 차등)
빈 공간을 두려워하지 말 것
```

### 컬러 최소주의 (2025-2026 방향)

- **Linear 2025**: 모노크롬 블루 → 모노크롬 블랙/화이트로 전환
- **Vercel**: "악센트 색상도 장식도 없다. 타이포와 여백, 가끔 빛 같은 그라디언트만"
- **Toss**: OKLCH 색공간으로 지각적 균일성, 의미 있는 곳에만 색상
- **따뜻한 회색**: Notion, Linear 모두 순수 흑(#000)보다 slate-900 선호
- **우리 원칙**: slate 모노크롬 + indigo 악센트(차트/포커스링/진행바) + 기능색(red/emerald)

### 타이포 트렌드

| 트렌드 | 내용 | 출처 |
|--------|------|------|
| 본문 크기 상향 | 16px → 17-18px 추세 | 업계 전반 |
| 헤딩 letter-spacing | -0.003em (좁게) | Apple, Vercel |
| Weight 위계 명확 | 400 본문 / 500 라벨 / 600 헤딩 / 700 디스플레이 | Linear, Toss |
| 숫자 강조 | text-3xl~5xl font-bold, 라벨은 text-xs text-slate-400 | Toss, Stripe |
| Variable fonts | 단일 파일에서 무한 weight/width 변형 — 성능 향상 | Vercel Geist |

### 컴포넌트 패턴 참고

| 패턴 | 설명 | 출처 |
|------|------|------|
| 커맨드 팔레트 | Cmd+K 글로벌 검색이 SaaS 표준 | Linear, Vercel |
| 사이드바 축소 | 시각적 존재감 줄이기 — 어둡게, 작은 아이콘, 비활성 뮤트 | Linear |
| 프로그레시브 디스클로저 | 요약 → 확장 → 전체 분석 3단계 | Stripe |
| Bento Grid | 비대칭 카드 레이아웃, 12-24px 라운딩 | 대시보드/랜딩 트렌드 |
| 카드 표준 | bg-white, 12px 라운딩, 미세 그림자, 얇은 보더 | 업계 공통 |

### 모바일 & 터치 최적화

| 원칙 | 기준 | 출처 |
|------|------|------|
| 터치 타겟 | 최소 44-48px | Apple 44pt, Material 48px |
| 확장 터치 영역 | 가시 영역 너머까지 터치 영역 확장 | Notion |
| Thumb zone | 주요 액션은 화면 하단/중앙에 배치 | 업계 공통 |
| 모바일 대시보드 | 단일 컬럼 카드 스택 | 업계 공통 |
| 로딩 성능 | 카드당 <100ms 렌더, lazy loading 필수 | Stripe |

### 접근성 & 대비 기준

```
text-slate-400은 bg-slate-50 위에서 WCAG AA 미달 가능
→ 읽어야 하는 텍스트는 최소 text-slate-500 사용

헤더 backdrop: bg-white/80보다 bg-white/90~95가 가독성 확보에 유리

알림 점(notification dot): 최소 w-2.5 h-2.5 (10px) — 8px은 놓치기 쉬움

다크모드: 단순 색상 반전이 아닌 별도 대비 튜닝 필요
```

### 디자인 자문 체크리스트 (매 작업 시 확인)

```
□ 이 요소를 빼도 화면이 작동하는가? → 빼라
□ 색상 대신 크기/두께/여백으로 위계를 만들 수 있는가? → 그렇게 하라
□ 섹션 사이 여백이 충분한가? → 의심되면 늘려라 (4px 단위)
□ 숫자/지표가 라벨보다 시각적으로 우선하는가? → 숫자를 크고 굵게
□ 하나의 화면에 사용자가 해야 할 일이 즉시 보이는가? → 1초 규칙
□ 프로젝터에서도 뒷자리에서 읽을 수 있는가? → 강사 화면은 큰 글자, 높은 대비
□ 모바일에서 한 손으로 조작할 수 있는가? → 주요 액션은 thumb zone에
```

### 래퍼런스 회사별 핵심 takeaway

| 회사 | 핵심 교훈 |
|------|----------|
| Apple | 8pt 그리드, 44pt 터치 타겟, Liquid Glass(2025) — 투명 레이어는 핵심 UI에만 |
| Linear | 색을 줄여라. 사이드바 존재감을 줄여라. 변화를 눈치채지 못하면 성공 |
| Notion | 콘텐츠가 인터페이스다. 장식 요소 0. 시스템 폰트로 네이티브 느낌 |
| Toss | OKLCH 색공간, UX 라이팅이 CTR 5-10% 좌우, 큰 제목+넉넉한 여백 |
| Vercel | 타이포+여백만으로 충분. Geist 서체 체계. 악센트 색상 거의 0 |
| Stripe | 프로그레시브 디스클로저 3단계, 카드 <100ms 렌더, 기능 색상만 |

---

## 15. 실전 디자인 팁 (Refactoring UI, Laws of UX 등)

> 출처: Refactoring UI (Adam Wathan & Steve Schoger), Laws of UX, Toss Design, shadcn/ui
> 디자인 작업 시 구체적으로 적용할 수 있는 실전 팁.

### 타이포그래피

| 팁 | 설명 | 적용 |
|----|------|------|
| **Weight + Color로 위계** | 크기만으로 위계를 만들지 말고, 두께(400~700)와 색상(slate-900~400)을 함께 사용 | 제목: `font-bold text-slate-900` / 라벨: `font-medium text-slate-500` / 보조: `font-normal text-slate-400` |
| **비선형 크기 체계** | 12-14-16-18 같은 균등 스케일 금지. 12-14-16-20-24-30-36처럼 큰 크기일수록 점프폭 확대 | 작은 차이는 눈에 안 보인다. 위계가 명확해야 한다 |
| **큰 텍스트는 가볍게, 작은 텍스트는 무겁게** | Display(36px)는 400-500, 캡션(12px)은 500-600 | 큰 글씨는 크기 자체가 시각적 무게. 작은 글씨는 두께로 보완 |
| **Line-height는 크기에 반비례** | 14px → 1.7-1.8, 16px → 1.5-1.6, 24px+ → 1.2-1.3 | 큰 텍스트의 넓은 줄간격은 흩어져 보인다 |
| **헤딩은 tracking-tight, 대문자 라벨은 tracking-wide** | 한국어 제목: `-0.01em`, 영문 라벨: `tracking-wide uppercase text-xs` | |
| **숫자는 tabular-nums** | 숫자 열은 `tabular-nums text-right` | 자릿수가 정렬되어 비교가 쉬워진다 |
| **45-75자 줄 길이** | `max-w-prose`(65ch) 또는 `max-w-xl` / `max-w-2xl` | 너무 긴 줄은 시선 복귀 시 위치를 잃는다 |

### 여백 & 레이아웃

| 팁 | 설명 |
|----|------|
| **많은 여백에서 시작, 줄여가기** | `p-8 gap-6`으로 시작 → 적절해질 때까지 축소. 부족한 여백보다 과한 여백이 나음 |
| **그룹 간격 > 그룹 내 간격** | 카드 내부 `gap-3` → 카드 사이 `gap-6`. Gestalt 근접성 원칙 |
| **화면 전체를 채우지 않기** | `max-w-4xl mx-auto`. 1440px 화면에 600px 콘텐츠도 괜찮다. 여백 = 자신감 |
| **너비보다 컬럼 추가** | 1200px 인풋은 이상하다. 550px 2컬럼이 자연스럽다 |
| **빈 화면은 온보딩** | "데이터 없음" 대신 일러스트 + CTA: "첫 질문을 만들어보세요!" |
| **카드 패딩 통일** | 같은 뷰 내 카드들은 동일한 패딩 사용. `p-4`/`p-5` 혼용 금지. 기본은 `p-5` (모바일 `p-4`) |
| **그리드 gap ≥ 4** | 카드 그리드 최소 `gap-4` (16px). `gap-3`은 카드 내부 요소 간격에만 사용 |

### 색상 & 배경

| 팁 | 설명 | 적용 |
|----|------|------|
| **컬러 배경 위의 보조 텍스트** | `bg-indigo-600` 위 보조 텍스트는 `text-gray-400`이 아닌 `text-indigo-200` 사용 | 같은 색조의 밝은 버전이 조화롭다 |
| **회색에 색조 섞기** | 순수 gray 대신 slate(파란 톤) 또는 stone(따뜻한 톤) 사용 | 순수 회색은 죽어 보인다. 약간의 색조가 세련됨 |
| **섹션 배경 교차** | `bg-white` ↔ `bg-slate-50` 교차 배치 | 보더 없이도 섹션 구분 가능. 시각적 리듬 생성 |
| **2-3색 규칙** | slate + brand(indigo) + 기능색(red/emerald). 그 이상은 혼란 | 프로 UI vs AI UI를 가르는 핵심 차이 |

### 그림자 & 깊이

| 팁 | 설명 | 적용 |
|----|------|------|
| **그림자는 아래로** | Y-offset 있는 그림자 사용 (빛은 위에서 온다) | Tailwind 기본 shadow가 이미 이렇게 설계됨 |
| **2중 그림자 레이어** | 타이트한 ambient + 부드러운 offset shadow 조합 | `box-shadow: 0 1px 2px rgba(0,0,0,.07), 0 4px 8px rgba(0,0,0,.07)` |
| **hover에 그림자 승급** | 클릭 가능한 카드: `shadow-sm hover:shadow-md` | "들어올림" 느낌으로 인터랙티브 시그널 |
| **색상으로도 깊이 표현** | `bg-slate-50` 페이지 위 `bg-white` 카드 = 그림자 없이도 부유 효과 | |

### 보더 & 구분선

| 팁 | 설명 |
|----|------|
| **보더를 줄여라** | 보더 대신 여백 or 배경색 대비로 구분. 모든 선은 주의력 세금 |
| **좌측 악센트 바 금지** | `border-l-4` = AI 기본값. `ring-1` 또는 bg 변경으로 대체 |
| **상단 보더로 브랜드 터치** | 페이지 최상단 `h-1 bg-gradient-to-r from-indigo-500 to-indigo-600` = 마감된 느낌 |

### 버튼

| 팁 | 설명 |
|----|------|
| **계층으로 디자인** | 모든 "삭제"가 빨간 버튼일 필요 없다. 위험 액션도 텍스트 링크 + 확인 다이얼로그로 |
| **Primary 1개만 강조** | 한 화면에 Primary 버튼은 하나. 나머지는 Secondary/Ghost |
| **hover 전환 150-200ms** | `transition-colors duration-150`. 100ms↓ = 깜빡임, 400ms↑ = 느림 |
| **hover + focus-visible 쌍** | 마우스 hover 스타일과 동일한 focus-visible 스타일 필수 |

### 폼 & 입력

| 팁 | 설명 |
|----|------|
| **라벨은 입력 위** | 좌측도, placeholder도 아닌 상단 배치. 모든 화면 크기에서 작동 |
| **placeholder ≠ 라벨** | placeholder는 예시("예: 김철수"). 입력하면 사라지므로 라벨 역할 불가 |
| **입력 너비 = 예상 내용 길이** | 우편번호 필드가 400px일 필요 없다. 크기가 힌트를 준다 |
| **입력-버튼 높이 일치** | 나란히 놓일 때 `h-11` 통일. 높이 불일치 = 미완성 느낌 |
| **에러는 필드 바로 아래** | 상단 배너가 아닌 해당 input 바로 밑에 `text-red-500 text-sm mt-1` |

### 데이터 표시

| 팁 | 설명 | Tailwind |
|----|------|----------|
| **라벨은 작게, 값은 크게** | "참여자" 작고 연하게, "24" 크고 굵게 | 값: `text-2xl font-bold text-slate-900`, 라벨: `text-xs text-slate-500 uppercase tracking-wide` |
| **자연어로 표시** | "재고: 12" 대신 "12개 남음" | 라벨:값 쌍보다 문장이 빠르게 읽힌다 |
| **바 차트 > 파이 차트** | 인간은 각도/면적 비교를 못한다. 길이 비교가 정확 | |
| **실시간 데이터는 애니메이트** | 숫자 변경 시 `AnimatePresence` + spring 카운터 | 급변은 놓치기 쉽다. 부드러운 전환이 인지를 돕는다 |

### UX 법칙 (Laws of UX) — Pick 적용

| 법칙 | 내용 | Pick 적용 |
|------|------|-------------|
| **Fitts's Law** | 크고 가까운 타겟 = 빠른 클릭 | 투표 버튼은 thumb zone(하단)에, 크게(48px+) |
| **Hick's Law** | 선택지가 적을수록 빠른 결정 | 학생 화면: 질문 + 선택지만. 부가 기능은 숨기기 |
| **Miller's Law** | 작업 기억 5-9개 | 선택지 4-6개, 대시보드 지표 3-4개 그룹 |
| **Gestalt 근접성** | 가까운 요소 = 관련된 것 | 질문 텍스트↔선택지는 밀착, 투표↔상태바는 분리 |
| **Jakob's Law** | 사용자는 다른 앱처럼 작동하길 기대 | 하단바는 iOS 탭바 패턴, 모달은 ESC로 닫기 |

### 아이콘

| 팁 | 설명 |
|----|------|
| **아이콘 크기 유지, 확대 금지** | 16px 아이콘을 48px로 키우면 뭉개진다. 대신 `w-10 h-10 bg-slate-100 rounded-lg` 안에 원래 크기로 |
| **텍스트 옆 아이콘은 연하게** | 아이콘: `text-slate-400`, 텍스트: `text-slate-600`. 아이콘은 면적이 커서 무거워 보인다 |
| **컬러 원형 배경 금지** | `bg-indigo-100 rounded-full p-2` = AI 기본값. bare 아이콘이 프로페셔널 |

### 빈 상태 & 대기 화면

| 팁 | 설명 |
|----|------|
| **빈 상태 = 온보딩** | "데이터 없음" 대신 일러스트 + 설명 + CTA 버튼 |
| **불필요한 액션 숨기기** | 데이터 없으면 "내보내기" 버튼 자체를 안 보여줌. disabled보다 hide |
| **대기 화면에 캐릭터** | 마스코트/일러스트로 따뜻함 전달 (한국 앱 표준 패턴) |

---

## 16. 버튼 & 인터랙션 표준 (2026-03-21 확정)

### 버튼 transition 규칙
```
모든 버튼/인터랙티브 요소:
  transition-colors duration-150   ← 색상 전환 150ms
  active:scale-[0.96]              ← 누를 때 살짝 축소 (선택)

금지: transition-all (무엇이 전환되는지 명시적으로)
금지: transition 없이 hover 색상 변경
```

### hover 상태 규칙
| 요소 | hover 패턴 |
|------|-----------|
| 카드 (클릭 가능) | `hover:shadow-md transition-shadow` |
| 목록 행 | `hover:bg-slate-50 dark:hover:bg-slate-700/50` |
| 아이콘 버튼 | `text-slate-400 hover:text-slate-600 dark:hover:text-slate-300` |
| 삭제 버튼 | `text-slate-300 dark:text-slate-600 hover:text-red-500` |
| 고스트 버튼 | `hover:bg-slate-100 dark:hover:bg-slate-700` |

### 카드 깊이 표현 (택 1)
```
방법 A: shadow-sm (그림자만) ← 권장: QuickProgressCard, QuizResult, LeaderboardPage
방법 B: border border-slate-200 (테두리만) ← 아코디언, 질문 카드, 입력 필드
금지: shadow-sm + border 동시 사용 (이중 깊이 단서)
```

### 알림 점 (Notification Dot)
```
크기: 최소 w-2.5 h-2.5 (10px)
색상: bg-red-500
애니메이션: animate-pulse (새 알림 시)
위치: absolute top-1.5 right-1.5
```

---

## 17. 라이브 관전 뷰 (Live Spectator View)

### URL & 접근
- 경로: `/live?s={sessionId}`
- 로그인 불필요, 순수 읽기전용
- 강제 다크모드 (프로젝터/전자칠판 최적화)

### 레이아웃
```
전체 h-dvh bg-slate-900
├── LiveHeader (슬림): Pick 로고 + 강의명 + 차수 배지 + 접속자 수
├── 메인 콘텐츠 (max-w-5xl 중앙):
│   ├── VizRenderer (기존 차트 재사용, max-w-xl→max-w-2xl 오버라이드)
│   ├── LiveParticipation (인디고 진행 바, max-w-2xl)
│   └── 대기 상태: 마스코트 + "다음 질문을 기다리는 중..."
├── ReactionOverlay (기존 재사용)
└── JoinToast (기존 재사용)
```

### 공유 방법
강사 RightSidebar 하단: "전자칠판 링크 복사" 버튼 (초대 링크 아래)

---

## 18. DM & 채팅 패턴

### 채널 구조
| 채널 | 참여자 | Firebase 경로 |
|------|--------|--------------|
| 공개 채팅 | 전체 | `sessions/{id}/chat` |
| 운영 채팅 | 스태프+강사 | `sessions/{id}/staffChat` |
| 1:1 DM | 학생↔스태프 | `sessions/{id}/dm/{dmId}` |

### 메시지 버블 스타일
```
내 메시지 (우측):    bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-2xl rounded-br-sm
상대 메시지 (좌측):  bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm
타임스탬프:          text-[10px] text-slate-300 dark:text-slate-500
발신자 이름:         text-[11px] font-medium text-slate-500
```

### 역할 배지 (채팅 내)
```
강사: bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-[10px] font-semibold rounded-full px-1.5
스태프: bg-slate-50 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-full px-1.5
```

### DM 알림 (StaffDMAlert)
- 위치: `fixed top-3 right-3 z-50`
- 카드: `bg-white rounded-xl border shadow-md p-3.5`
- 아이콘: bare (원형 배경 없음)
- 배지: `bg-red-50 text-red-700` (기능적 — 긴급/도움 요청)
- CTA: "응답 →" dark CTA 스타일, "확인" ghost

### DM 플로팅 버블 (DMBubble, 학생용)
- 위치: `fixed bottom-28 right-4 z-40`
- 접힌 상태: `w-12 h-12 rounded-full bg-slate-900 shadow-lg`
- 펼친 상태: `rounded-2xl shadow-xl border max-h-[50vh]`
- 대기 상태: 펄스 dots 애니메이션

---

## 19. 접근성 (Accessibility)

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

## 20. 번들 구조

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

---

## 21. 모바일 앱 디자인 시스템 (Mobile-First)

> 래퍼런스: 토스, 당근마켓, 카카오톡, Apple HIG, Linear
> 적용 범위: `(max-width: 767px)` — MobileAdminView + 학생 전체 화면

### 핵심 원칙
1. **앱처럼 보여야 한다** — PWA이지만 네이티브 앱 수준의 UX
2. **큰 글씨, 큰 터치 타겟** — 모든 텍스트 +1~2px, 터치 타겟 44px+
3. **배경색 대비로 섹션 구분** — border/shadow 대신 `bg-slate-50` 위에 `bg-white` 카드
4. **밀도 < 여유** — 데스크탑보다 더 넉넉한 padding/gap

### 모바일 타이포그래피 (vs 데스크탑)
| 용도 | 데스크탑 | 모바일 | 비고 |
|------|---------|--------|------|
| 히어로 숫자 | text-3xl~5xl | text-5xl | 참여자 수 등 |
| 페이지 제목 | text-xl | text-base~text-lg | 헤더 공간 절약 |
| 섹션 제목 | text-sm semibold | text-[17px] semibold | Apple Body 기준 |
| 본문 | text-sm (14px) | text-[15px]~text-base | iOS 최소 가독성 |
| 채팅 버블 | text-sm | text-[15px] | 카카오톡 참고 |
| 캡션/시간 | text-[10px] | text-[11px]~text-[13px] | 가독성 확보 |
| 탭바 라벨 | — | text-[11px] | Apple HIG 기준 |

### 모바일 섹션 구분 패턴
```
방법 1 (토스): bg-slate-50 페이지 배경 + bg-white 카드 섹션 (border 없음)
방법 2 (당근/카카오): 8px 높이 회색 구분선 (h-2 bg-slate-100)
방법 3 (Apple): rounded-2xl 카드 + bg-slate-50 배경

금지: 모바일에서 shadow로 섹션 구분 (한국 앱 어디에서도 안 씀)
금지: 모바일에서 border + shadow 동시 사용
```

### 모바일 컴포넌트 규격
| 컴포넌트 | 높이 | 패딩 | 아이콘 | 모서리 |
|----------|------|------|--------|--------|
| 헤더 | auto (py-3.5) | px-5 | 22px | — |
| 하단 탭 바 | 56px + safe area | — | 24px | — |
| 리스트 행 | 48-56px | px-5 py-3.5 | 20px | — |
| 섹션 아코디언 | auto (py-4) | px-5 | 20px | rounded-2xl |
| 버튼 (CTA) | 48px+ | px-5 py-3.5 | 18px | rounded-xl |
| 학생 하단 버튼 | 56px | — | 22px | rounded-xl |
| 채팅 아바타 | 36px (w-9) | — | 13px text | rounded-full |

### 모바일 모달 규격
```
모바일 (< 640px): fixed inset-0 (전체 화면, 둥근 모서리 없음)
태블릿+: fixed inset-auto, 420x600px, rounded-2xl shadow-2xl

모달 애니메이션:
  모바일: y: 20→0 (아래에서 올라옴)
  데스크탑: scale: 0.95→1 (센터 스케일)
```

### 모바일 하단 탭 바 (강사)
```
4탭: 진행 | 결과 | 참여 | 채팅
아이콘: 24px, 활성 strokeWidth=2, 비활성 strokeWidth=1.5
라벨: text-[11px] font-medium
활성: text-slate-900 dark:text-slate-100
비활성: text-slate-400 dark:text-slate-500
미읽음: w-2.5 h-2.5 bg-red-500 absolute
safe area: paddingBottom env(safe-area-inset-bottom)
```

### 모바일 학생 하단 바
```
리액션 바: 5개 아이콘 (좋아요/불꽃/하트/웃음/박수)
액션 바: 5열 grid (손들기/긴급/질문/채팅/도움)
버튼 높이: 56px, 아이콘 22px, 라벨 text-[11px]
safe area: pb-[calc(0.75rem+env(safe-area-inset-bottom))]
```

### CSS 최적화 (index.css)
```css
body { overscroll-behavior-y: contain; }  /* pull-to-refresh 방지 */
input, select, textarea { font-size: max(16px, 1em); }  /* iOS 줌 방지 */
a, button, [role="button"] { touch-action: manipulation; }  /* 300ms 딜레이 제거 */
button, a { -webkit-tap-highlight-color: transparent; }  /* 파란 탭 플래시 제거 */
<body ontouchstart="">  /* iOS :active 활성화 */
```

### 모바일 애니메이션 & 모션
```
원칙: 부드러움 + 역동적 + 의미있는 모션

탭 전환: AnimatePresence mode="wait", fade 0.15s
모달 등장: y: 20→0, 0.2s ease-out (아래에서 올라옴)
리스트 아이템: stagger 0.03s per item
숫자 변경: motion.span key={value}, scale 1.1→1 spring
히어로 숫자: scale 1.1→1, spring 300/25
카드 프레스: active:scale-[0.98], 0.15s
버튼 프레스: active:scale-[0.96], 즉각 피드백

금지:
- 장식 모션 (반짝임, 무한 루프)
- 400ms 초과 전환
- scale 0.8 미만 축소 (과도한 줄어듦)
- 모바일에서 복잡한 layout 애니메이션 (성능)
```

### 모바일 디자인 토큰 상수 (design-tokens.js 연동)
```
// 모바일 타이포
mobile.body:          15px (text-[15px])
mobile.bodyLarge:     16px (text-base)
mobile.sectionTitle:  16-17px (text-[16px] ~ text-[17px])
mobile.pageTitle:     16-18px (text-base ~ text-lg)
mobile.hero:          36px (text-4xl)
mobile.caption:       13px (text-[13px])
mobile.tabLabel:      11px (text-[11px])
mobile.chatBubble:    15px (text-[15px])
mobile.chatSender:    13px (text-[13px])
mobile.chatTime:      11px (text-[11px])

// 모바일 간격
mobile.pagePadding:   20px (px-5)
mobile.cardPadding:   20px (p-5)
mobile.sectionGap:    8px (space-y-2)
mobile.itemGap:       4px (space-y-1)
mobile.headerPadding: px-5 py-3.5

// 모바일 컴포넌트
mobile.touchTarget:   44px min, 48-56px 권장
mobile.tabBarHeight:  56px + safe area
mobile.iconSize:      22-24px (탭바/하단바)
mobile.avatarSize:    36px (w-9, 채팅)
mobile.buttonRadius:  12px (rounded-xl)
mobile.cardRadius:    16px (rounded-2xl)

// 웹 타이포 (비교용)
web.body:             14px (text-sm)
web.sectionTitle:     14px semibold
web.pageTitle:        20-24px (text-xl ~ text-2xl)
web.hero:             36-48px (text-4xl ~ text-5xl)
web.caption:          10-12px (text-[10px] ~ text-xs)
```

### 모바일에서 사용하면 안 되는 패턴
```
❌ border + shadow 동시 사용 (이중 깊이)
❌ shadow로 섹션 구분 (배경색 대비 사용)
❌ 데스크탑 사이드바를 그대로 모바일에 표시
❌ 햄버거 메뉴 (하단 탭 사용)
❌ hover 전용 UI (모바일은 hover 없음)
❌ text-sm 미만 본문 (14px 이하 → iOS 줌 유발)
❌ 44px 미만 터치 타겟
❌ 모달에 inset-4 (전체 화면 inset-0 사용)
```

### 래퍼런스 요약
| 출처 | 핵심 교훈 |
|------|----------|
| 토스 | 배경색 대비, border 없음, 큰 숫자, 패딩 내장 리스트 |
| 당근 | 8px 회색 구분선, thin hairline 아이템 구분, SEED 디자인 시스템 |
| 카카오 | 배경색 버블, 8px 구분선, 15-16pt 채팅 본문 |
| Apple | 17pt 본문, 44pt 터치 타겟, inset grouped 카드, backdrop-blur 헤더 |
| Linear | 모노크롬 + spacing 위계, 3변수 색상 체계, 밀도 적응 |
