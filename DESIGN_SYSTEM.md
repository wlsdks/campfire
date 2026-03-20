# Pinggo Design System

> 이 문서만으로 동일한 UI/UX를 다른 프로젝트에서도 재현할 수 있어야 함.
> 모든 값은 `src/lib/design-tokens.js`에 코드로도 정의됨.

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
□ 한 화면에 3가지 이상 색상? → 2색으로 줄이기
□ 인디고/보라 CTA 버튼? → bg-slate-900
□ 좌측 컬러 악센트 바? → 제거
□ 아이콘이 색상 원형 배경 안? → 제거
□ 배지가 3종 이상 다른 색상? → slate 통일
□ 박스 배경에 색상 tint? → bg-white 또는 bg-slate-50만
□ 과도한 그라디언트/글래스모피즘? → 제거
□ 모든 요소에 동일한 hover? → 맥락에 따라 차별화
```

---

## 2. 색상 (Colors)

### 브랜드 & 기본
| 용도 | 색상 | Tailwind | Hex |
|------|------|----------|-----|
| CTA / Primary | slate-900 | `bg-slate-900` | `#0F172A` |
| CTA hover | slate-800 | `hover:bg-slate-800` | `#1E293B` |
| 브랜드 아이콘 | indigo-600 | — | `#4F46E5` |
| Input focus ring | — | `focus:ring-slate-900/10` | — |

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

---

## 3. 타이포그래피 (Typography)

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
- 본문 line-height: 1.6~1.8
- 제목 letter-spacing: -0.01em
- 숫자/금액: 크고 굵게, 라벨은 작고 연하게

---

## 4. 간격 (Spacing)

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
| 페이지 가장자리 | 32px (`p-8`) |

---

## 5. 박스 규격 (Components)

### 카드
```
패딩: p-5 (20px)
테두리: border border-slate-100 (기본) / border-slate-200 (interactive)
모서리: rounded-xl (12px)
그림자: shadow-sm (기본) / shadow-md (hover)
배경: bg-white
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
```

### 입력 (Input)
```
패딩: px-4 py-3
모서리: rounded-lg (8px) / rounded-xl (12px, textarea)
테두리: border border-slate-200
포커스: focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400
placeholder: text-slate-400
```

### 배지 (Badge)
```
패딩: px-2.5 py-0.5
모서리: rounded-full
크기: text-xs font-medium
Primary: bg-slate-100 text-slate-700
Neutral: bg-slate-50 text-slate-500
Error: bg-red-50 text-red-700
```

### 아바타 (Avatar)
| 사이즈 | 크기 | 폰트 |
|--------|------|------|
| sm | w-7 h-7 | text-xs |
| md | w-9 h-9 | text-sm |
| lg | w-12 h-12 | text-base |

```
모서리: rounded-full
배경: bg-slate-100
텍스트: text-slate-700 font-semibold
```

### 모달
```
배경: fixed inset-0 bg-black/30 backdrop-blur-sm z-50
콘텐츠: bg-white rounded-2xl shadow-xl p-6 max-w-md
애니메이션: scale 0.95→1, opacity 0→1
```

### 아코디언
```
컨테이너: rounded-xl border border-slate-200 overflow-hidden
헤더: px-3.5 py-2.5 hover:bg-slate-50 active:bg-slate-100
제목: text-sm font-semibold text-slate-600
화살표: ChevronDown 14px text-slate-400, 회전 180°
콘텐츠: AnimatePresence + height 0→auto
```

### 터치 타겟
```
최소 크기: 48px (모바일)
드래그 활성화 거리: 5px
```

---

## 6. 그림자 (Shadows)

| 단계 | Tailwind | 용도 |
|------|----------|------|
| sm | `shadow-sm` | 기본 카드 |
| md | `shadow-md` | hover 상태 |
| lg | `shadow-lg` | 드롭다운, 팝업 |
| xl | `shadow-xl` | 모달, 플로팅 패널 |

---

## 7. 모션 (Motion)

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

### 입장 애니메이션 패턴
```jsx
// Fade + slide up (기본)
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}

// Scale in (모달, 팝업)
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}

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

### 규칙
- 모든 모션 400ms 이하
- `prefers-reduced-motion` 존중
- 장식 모션 금지 — 모든 모션에 목적이 있어야 함
- 화려함 < 자연스러움 < 의미

---

## 8. 아이콘 (Icons)

- **라이브러리**: lucide-react only
- **크기 체계**: 12px (인라인), 14px (아코디언), 16px (버튼), 18-20px (헤더), 22px (큰 액션)
- **스트로크**: 기본 2, 선택됨 2, 비선택 1.6
- **색상**: `text-slate-400` (기본), `text-slate-700` (활성), `text-white` (반전)
- **절대 금지**: Sparkles, Wand, Stars (AI 느낌), emoji

---

## 9. 레이아웃 (Layout)

### Admin 3패널 (Desktop 1024px+)
```
좌측: 28% (min 280px, max 460px) — 질문 관리
중앙: flex-1 — 시각화/결과
우측: 28% (min 280px, max 460px) — 참여자/상호작용
패널 접기: motion.div width 0 전환, 좌측 열기 버튼 표시
```

### Admin 태블릿 (768~1023px)
```
breakpoint: useMediaQuery('(max-width: 1023px)')
중앙: flex-1 p-4 (전폭, 패딩 축소)
좌측/우측: 오버레이 드로어 (fixed, w-[340px], max-w-[85vw])
드로어 열기: 헤더 List(좌) / Users(우) 아이콘 버튼
드로어 닫기: 백드롭 클릭 또는 X 버튼
애니메이션: Framer Motion x: -100%→0 (좌) / x: 100%→0 (우), 0.25s ease
백드롭: bg-black/30 z-40
헤더 컴팩트: 세션ID·경과시간 숨김, 버튼 라벨 축소 (발표/종료)
```

### 학생 모바일 (390x844 기준)
```
전체: min-h-dvh, flex flex-col
상단: 헤더 고정 (shrink-0)
중앙: flex-1 (콘텐츠)
하단: 고정 바 (shrink-0)
```

### 전체 화면 고정
```
루트: h-dvh overflow-hidden
패널: h-full overflow-y-auto scrollbar-hide
```

---

## 10. 한국 앱 스타일 가이드

토스/카카오 스타일:
- 큰 제목 + 넉넉한 여백 + 최소 장식
- 색상은 기능에만 (상태, 에러), 장식에 사용 금지
- 숫자/금액은 크고 굵게, 라벨은 작고 연하게
- 애니메이션은 상태 전환에만, 장식적 모션 없음
- 모든 아이콘/버튼에 한국어 텍스트 라벨 필수
