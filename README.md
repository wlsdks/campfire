# Pick

> 가볍게 참여를 던지고 바로 반응하는, 실시간 강의 참여 플랫폼

강사가 수업 중 질문을 출제하면 학생들이 모바일·노트북으로 즉시 응답합니다. 객관식부터 워드클라우드, 퀴즈, 팀 대항전, AI 심사 과제까지 — 수업을 재미있게 만드는 20+ 참여 도구를 한 곳에.

**Live**: https://jinan-6c884.web.app

---

## ✨ 핵심 가치

- **1초 안에 이해되는 UX** — 학생이 화면 보자마자 뭘 해야 하는지 안다
- **실시간 반응성** — Firebase RTDB로 모든 변화가 즉시 동기화
- **한국 교실 맞춤** — Pretendard 폰트, 한국어 UI, 강의 흐름에 최적화
- **Anti-AI 디자인** — slate 모노크로매틱 + 신중한 인디고 액센트 (자세한 건 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md))
- **AI 도구 내장** — 질문 생성, 응답 요약, 과제 예심/본심까지 Gemini 기반

---

## 🎯 주요 기능

### 📱 학생 (Student)

| 기능 | 설명 |
|---|---|
| **QR 접속** | 링크/QR로 즉시 참여, 닉네임만 입력 |
| **투표·응답 10종** | 객관식, O/X, 워드클라우드, Q&A, 퀴즈, 척도, 토론, 순위, 빈칸채우기, 체크 |
| **타이머** | 질문별 원형 링 카운트다운, 5초 이하 펄스 |
| **리액션** | 👍🔥❤️😂👏 하단바 (lucide 아이콘, 3초 쿨다운) |
| **손들기·긴급 질문** | 익명으로 강사에게 도움 요청 |
| **공개 Q&A** | 질문 올리기 + 추천 기능 |
| **실시간 채팅** | 공개 채팅 + 스태프 1:1 DM |
| **리더보드·업적** | 퀴즈 점수, 연속 정답, 개인 리포트 |
| **다크모드** | Sun/Moon 토글, localStorage 저장 |

### 👨‍🏫 강사 (Instructor)

| 기능 | 설명 |
|---|---|
| **클래스 대시보드** | 강의별 그룹, 세션 생성/복제, 참여율 차트 |
| **질문 관리** | 추가/수정/삭제/드래그 정렬, 보관함 재사용 |
| **키보드 단축키** | ← → (이동), Space (다음), R (정답), L (리더보드), Esc (대기) |
| **게임 모드** | 룰렛, 추첨, 스피드퀴즈, 팀 대항전, 미스터리 박스 |
| **수업 기록** | 참여율·정답률 통계, 어려웠던 질문 분석, CSV 내보내기 |
| **스태프 관리** | 스태프 계정 초대, 역할 분담 |
| **세션 기록** | 질문별 응답 히스토리, 학생 리포트 |

### 🖥️ 프레젠터 (Projector)

- `/live?s={sessionId}` — 프로젝터·전자칠판용 대형 화면
- 뒷자리에서도 보이는 큰 글자, 높은 대비
- 실시간 막대 상승, 워드클라우드 형성, 리액션 버블

### 🤖 AI 도구 (Gemini 기반)

| 기능 | 사용자 | 설명 |
|---|---|---|
| **AI 질문 생성** | 강사 | 주제 입력 → 3~6개 질문(객관식/OX/워드클라우드/척도) 즉시 생성 |
| **실시간 응답 요약** | 강사 | 워드클라우드·Q&A 응답 5개 이상 → 테마 분류 + 인사이트 |
| **제출 전 AI 예심** | 학생 | 과제 제출 전 1명 AI 코치의 형성 피드백 (강점·개선점·퀵윈) |
| **7명 AI 심사위원** | 강사 | 사후 과제를 7인 패널이 다각도 평가 + 자동 시상 |

### 📝 사후 과제 (Assignment)

- 강사: 과제 등록 → 학생 제출 링크 공유 → 마감 후 AI 심사 → 시상식
- 학생: HTML 파일(또는 ZIP 통째로) 업로드 + PRD + 설명 → 이름·PIN으로 결과 조회
- AI 심사위원 7인: 김기획(PM), 박사용(사용자), 이디자(디자이너), 최실용(팀장), 정창의(대표), 한완성(QA), 강소통(교육자)
- 자동 시상: 대상/최우수/우수 + 기획상/창의상/디자인상/실용상

---

## 🛠️ Tech Stack

```
Frontend    React 19 + Vite 7
Styling     Tailwind CSS v4 + Framer Motion
Icons       lucide-react (이모지 금지)
Fonts       Pretendard (한국어) + Inter (숫자/영문)
Backend     Firebase Realtime Database + Auth + Storage + Hosting
AI          Gemini 2.5 flash-lite (@google/generative-ai)
Drag&Drop   @dnd-kit
ZIP         JSZip (과제 압축 파일 지원)
Animation   lottie-react + Framer Motion
```

---

## 📂 프로젝트 구조

Bulletproof React 패턴 — 기능별 수직 분할:

```
src/
├── app/routes/          # 얇은 페이지 컴포넌트 (조립만)
│   ├── admin/           # /admin — 강사 대시보드
│   ├── live/            # /live  — 프레젠터 화면
│   ├── submit/          # /submit — 과제 제출
│   └── report/          # /report — 학생 리포트
├── components/ui/       # 공통 UI 프리미티브 (비즈니스 로직 금지)
├── features/            # 도메인별 기능 (api/ + components/)
│   ├── session/
│   ├── participants/
│   ├── voting/
│   ├── questions/       # AIQuestionGenerator, summarizeResponses
│   ├── visualization/   # BarChart, WordCloud, AISummaryBanner
│   ├── games/           # Roulette, Plinko, PrizeDraw
│   ├── quiz/            # Leaderboard, useScores
│   ├── reactions/
│   ├── timer/
│   ├── hand-raise/
│   └── assignments/     # AI 심사, 과제 제출, SubmissionPreview
├── hooks/               # 크로스피처 훅
├── lib/                 # firebase.js, design-tokens.js
└── styles/              # Tailwind + globals
```

### 아키텍처 규칙

- **Import 방향**: `lib/ → components/ → features/ → app/routes/` (단방향)
- **Feature 격리**: 피처가 다른 피처를 직접 import하지 않음
- **Barrel 금지**: `index.js` 재수출 없이 직접 경로 import
- **Path alias**: `@/` = `src/`

---

## 🚀 시작하기

### 요구사항

- Node.js 20+
- npm 10+
- Firebase 프로젝트 (RTDB + Hosting)
- Gemini API 키 (AI 기능용)

### 설치

```bash
git clone https://github.com/AslanLabs/Pick.git
cd Pick
npm install
```

### 환경 변수 (`.env.local`)

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> Firebase 설정은 `src/lib/firebase.js`에 하드코딩 (공개 프로젝트). 개인 프로젝트로 전환 시 교체 필요.

### 로컬 개발

```bash
npm run dev         # Vite 개발 서버
npm run build       # 프로덕션 빌드
npm run preview     # 빌드 결과 미리보기
npm run lint        # ESLint
npm run check       # lint + build
```

### 배포

```bash
npm run build
firebase deploy --only hosting
```

---

## 🛣️ 라우트

| 경로 | 접근 | 설명 |
|---|---|---|
| `/` | 학생 | QR/링크 진입, 세션 참여 |
| `/admin` | 강사·스태프 | 로그인 → 대시보드 → 수업 진행 |
| `/live?s={sessionId}` | 누구나 | 프레젠터 화면 (프로젝터용) |
| `/submit?a={assignmentId}` | 학생 | 과제 제출 및 결과 조회 |
| `/report?s=&p=` | 학생 | 개인 학습 리포트 |

---

## 🔥 Firebase 데이터 구조

```
sessions/{sessionId}
├── info              # 세션 메타 (title, courseName, createdAt)
├── currentQuestion   # 활성 질문 ID
├── currentMode       # poll | quiz | leaderboard | waiting | game
├── questions/{qId}
│   ├── type          # choice | ox | wordcloud | qna | quiz | ...
│   ├── title
│   ├── options[]
│   ├── correctAnswer
│   ├── activatedAt, revealedAt, awardedAt
│   └── votes/{participantId}  # { nickname, value, timestamp }
├── participants/{pid}
├── scores/{pid}      # 퀴즈 점수, 연속 정답, 업적
├── reactions, handRaises, urgentQuestions, classQuestions
├── chat, staffChat
└── game state (roulette, lottery, plinko ...)

assignments/{assignmentId}
├── title, description, status, aiJudging
├── submissions/{subId}
│   ├── name, pin (4자리 숫자)
│   ├── fileContent (HTML/ZIP 추출 텍스트)
│   ├── prdContent, description
│   └── submittedAt, updatedAt
├── results/{subId}
│   ├── judges/{judgeId} # 7명 심사위원별 결과
│   └── summary          # avgScore, selectedCount, passed
└── awards/{awardId}     # 대상/최우수/우수/기획상/...

users/{uid}              # 강사 계정
```

---

## 🎨 디자인 시스템

**원칙**: 화면당 2~3색 이하, 장식 색상 0, 장식 모션 0

```
CTA          bg-slate-900  (dark CTA, indigo 아님)
악센트       indigo         (차트 바, 포커스 링, 진행바 전용)
간격 단위     4px 기본, 카드 p-5, 모달 p-6
모션         spring(300/25), 모두 400ms 이하
터치 타겟    모바일 최소 48px
폰트         Pretendard 400~700, 크기 12~36px
```

자세한 건 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) + [CLAUDE.md](./CLAUDE.md) 참조.

### Anti-AI Aesthetic (중요)

| ❌ AI 기본값 | ✅ Pick |
|---|---|
| `bg-indigo-600` CTA | `bg-slate-900` dark CTA |
| 컬러 원형 아이콘 배경 | bare lucide 아이콘 |
| 5색 배지/선택지 | slate 모노크로매틱 |
| Sparkles/Stars 아이콘 | 사자 마스코트 (`PickMascot`) |

---

## 🤖 AI 기능 상세

### 1. 질문 생성 (`AIQuestionGenerator`)

강사가 수업 중 즉흥 대응할 때 사용. 주제를 입력하면 Gemini가 다양한 타입의 질문을 생성:

- **지원 타입**: choice, ox, wordcloud, scale
- **속도**: ~2초 (gemini-2.5-flash-lite)
- **통합**: 생성 후 기존 `importFromLibrary` 경로로 Firebase에 저장

### 2. 응답 요약 (`AISummaryBanner`)

wordcloud·Q&A 질문에서 응답 5개 이상 쌓이면 활성화. 결과:

```json
{
  "themes": [
    { "label": "개인적 효용", "count": 8, "summary": "..." },
    { "label": "성장/경험", "count": 6, "summary": "..." }
  ],
  "insight": "학생들은 효율성을 가장 큰 동기로 삼고 있으며..."
}
```

- **강사 전용**: `isAdmin` 프롭이 있는 VizRenderer에서만 렌더 (학생 화면 비노출)
- **재분석 유도**: 응답 +3개 이상 새로 들어오면 "새 응답이 있어요" 배지

### 3. 제출 전 AI 예심 (`SubmissionPreview`)

본 심사 전 학생이 자발적으로 받는 형성 피드백. 점수 없이 개선 힌트만:

```json
{
  "overallImpression": "전반적 인상 1~2문장",
  "strengths": ["강점1", "강점2", ...],
  "improvements": ["구체적 개선점1", ...],
  "quickWin": "지금 당장 바꾸면 좋아질 한 가지"
}
```

- **쿨다운**: 2분 (localStorage 기반)
- **활성화 조건**: 코드 파일 업로드 후

### 4. 7명 AI 심사위원 (본 심사)

과제 제출물을 7개 관점에서 병렬 평가 (`Promise.all`). 각 심사위원의 캐릭터·말투·평가 기준이 구분되어 있음:

| 심사위원 | 역할 | 전문 |
|---|---|---|
| 김기획 | PM | 문제 정의·PRD |
| 박사용 | 실사용자 | 직관성·UX |
| 이디자 | 디자이너 | 레이아웃·시각 |
| 최실용 | 팀장 | 실무 활용성 |
| 정창의 | 대표 | 아이디어 독창성 |
| 한완성 | QA | 기능 완성도 |
| 강소통 | 교육자 | AI 협업 품질 |

- **점수 앵커**: 1~3 결함 / 6~7 평균 / 8 인상적 / 9 베스트 / 10 예외적
- **자동 시상**: 대상·최우수·우수 (평균 점수) + 특별상 4개 (판단 심사위원 기준)

---

## 📋 개발 가이드라인

상세 규칙은 [CLAUDE.md](./CLAUDE.md) 참조.

- **JSX only** — TypeScript 없음
- **컴포넌트 200줄 이하** — 넘으면 서브컴포넌트로 분리
- **훅 반환 패턴**: `{ data, loading, error, actions }`
- **Firebase listener**: `useEffect`에서 cleanup 필수
- **Performance**: 무거운 컴포넌트는 `React.memo`, prop 핸들러는 `useCallback`
- **한국어 UI** — 모든 사용자 대면 텍스트는 한국어
- **Firebase 쓰기** — 빠른 연속 쓰기는 debounce

---

## 📚 문서

- [CLAUDE.md](./CLAUDE.md) — 프로젝트 규칙 (AI 코드 어시스턴트용)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — 디자인 토큰·패턴
- [FEATURES.md](./FEATURES.md) — 상세 기능 명세
- [PRD.md](./PRD.md) — 제품 요구사항 문서

---

## 📦 주요 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | Vite 개발 서버 |
| `npm run build` | 프로덕션 빌드 (브로틀리·gzip 압축 포함) |
| `npm run lint` | ESLint |
| `npm run check` | lint + build |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `firebase deploy --only hosting` | 배포 |

---

## 🏗️ 배포

Firebase Hosting. Service Worker가 hashed asset만 캐싱하고 `index.html`은 네트워크-온리라 배포 후 즉시 반영됨. CDN 캐시 반영에 몇 분 걸릴 수 있음.

```bash
npm run build
firebase deploy --only hosting --project jinan-6c884
```

---

## ⚠️ 보안 참고

- **Gemini API 키**: 클라이언트 번들에 포함됨 (학원용 프로토타입). 상용화 시 서버 프록시 필수
- **PIN 저장**: 과제 제출 PIN은 평문으로 RTDB에 저장. Firebase Rules로 read 제한 권장
- **동명이인 보호**: 클라이언트 `isEdit` 플래그 기반. 엄격한 보호는 RTDB Rules에서 처리 필요

---

## 🤝 기여

Private 프로젝트 — 이슈·PR 이전에 [AslanLabs/Pick](https://github.com/AslanLabs/Pick)에 접근 권한 확인.

---

## 📄 License

Private. © AslanLabs.
