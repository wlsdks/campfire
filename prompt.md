# Pinggo Background Improvement Loop

> 15분 간격 자동 실행. 매 사이클 시작 시 반드시 CLAUDE.md 참조.
> 브랜치: `background-improve`에서만 작업. main은 절대 건드리지 않음.

## 서비스 핵심 (절대 잊지 말 것)

**Pinggo = 강사와 학생의 실시간 상호작용 플랫폼**

- **핵심 가치**: 수업 중 강사↔학생 소통. 이것이 모든 기능의 존재 이유.
- **강사**: 학생 참여를 이끌고, 학습 결과 데이터를 확인하고 활용할 수 있어야 함
- **학생**: 쉽고 빠르게 수업에 참여하고, 즉각적 피드백을 받아야 함
- **절대 안 됨**: 상호작용과 무관한 기능 추가, 핵심에서 벗어난 방향 전환
- **admin 데이터 활용**: 수업 기록, 참여율 분석, 학생별 참여도, 질문 결과 통계 → 강사가 수업 개선에 활용 가능해야 함

## 브랜치 규칙

- **작업 브랜치**: `background-improve` (이 브랜치에서만 커밋/푸시)
- **서브에이전트 worktree**: 사용 가능하나, 작업 완료 후 반드시 `background-improve`에 merge
- **main 브랜치**: 절대 직접 커밋/푸시하지 않음 (사용자가 직접 관리)
- **다른 브랜치 생성 금지**: worktree 임시 브랜치 외에 새 브랜치 만들지 않음
- **충돌 발생 시**: 반드시 해결 후 merge. 해결 못하면 해당 작업 버리고 다음으로

## 디자인 원칙 (최우선)

> 상세 규칙: CLAUDE.md의 `Anti-AI Aesthetic`, `AI 생성 UI 체크리스트`, `한국 앱 참고` 섹션 참조

### 디자인 시스템 지속 발전
- 디자인 토큰(색상, 타이포, 간격)을 매 사이클 점검하고 일관성 유지
- 새 컴포넌트 패턴이 생기면 CLAUDE.md에 추가 제안 메모
- 기존 화면에서 토큰 벗어난 하드코딩 값 발견 시 → 토큰으로 교체
- 컴포넌트 간 스타일 불일치 발견 시 → 통일

### 절대 금지
- AI 느낌의 디자인 (인디고 CTA, 컬러 서클 아이콘, 레인보우 바, Sparkles 아이콘)
- `bg-indigo-600` CTA 버튼 → `bg-slate-900` 사용
- 색상 원형 배경 안의 아이콘 → 아이콘만 표시
- 3가지 이상 색상이 한 화면에 → 최대 2색 (slate + accent)
- 과도한 그라디언트, 글래스모피즘, 장식적 모션

### 모션 & 캐릭터
- **Lottie 애니메이션**: 상업적 무료 라이선스 범위 내 자유롭게 활용 (LottieFiles CDN)
- **Framer Motion**: 부드럽고 동적인 전환, 마이크로 인터랙션 적극 사용
- **캐릭터 요소**: Pinggo 마스코트나 재미있는 캐릭터 활용 환영
  - 대기 화면에서 캐릭터가 장난스럽게 움직이기
  - 빈 상태에서 캐릭터가 안내하기
  - 투표 완료 시 축하 애니메이션
  - 콘텐츠 영역에 가끔 캐릭터가 등장하는 이스터에그
- **톤**: 딱딱하지 않고, 친근하고 재미있는 경험. 학생이 "이거 좀 쿨하다" 느끼게
- **단, 과하지 않게**: 수업 진행을 방해하면 안 됨. 장식 모션은 대기/빈 상태에만

### 반드시 지킬 것
- **심플하고 깔끔한 UI** — 복잡도 최소화, 불필요한 장식 제거
- **토스/Linear/Notion 스타일** — 절제된 디자인, 기능에만 색상 사용
- **한국 앱 UX** — 큰 제목 + 넉넉한 여백 + 최소 장식
- 매 사이클 작업 후 CLAUDE.md의 `AI 생성 UI 체크리스트` 10개 항목 하나씩 확인

## 기획 & 신규 기능

매 사이클마다 기획적 관점에서도 고민:
- **강사에게 도움이 되는 기능**: 수업 진행 편의, 학생 관리, 결과 분석
- **학생에게 도움이 되는 기능**: 참여 경험, 피드백, 학습 동기부여
- 가치 있다고 판단되면 **한 사이클에 하나씩** 도전 (여러 개도 OK, 단 각각 완결)
- 기능 추가 시 admin 화면과 **student 화면 모두** 반드시 구현
- 학생 화면은 모바일 퍼스트 — 한 손 조작, 1초 안에 뭘 해야 하는지 파악

### 기능 아이디어 검토 기준
- "이 기능이 없으면 수업이 불편한가?" → Yes면 필수
- "이 기능이 있으면 수업이 더 재미있어지는가?" → Yes면 우선
- "이건 쿨해 보이지만 실제로 쓸까?" → No면 보류

## PRD (Product Requirements Document) 관리

- **`PRD.md` 파일을 항상 최신 상태로 유지**
- 매 사이클마다 현재 구현된 기능과 PRD를 대조
- **기존 기능 중 PRD에 없는 것** → 역추적해서 PRD에 추가
- **신규 기능 개발 시** → 반드시 PRD에 먼저 기록 후 구현
- PRD 구조: 기능명 / 설명 / 대상(강사/학생/양쪽) / 상태(구현완료/진행중/계획)
- 기능 간 의존성, 데이터 흐름도 간단히 기록

## 백엔드 & 데이터 규칙

### 아키텍처: React + Firebase (서버리스)
- 별도 백엔드 서버 없음. React에서 Firebase SDK로 직접 읽기/쓰기
- **Mock 데이터 절대 금지**: 하드코딩된 가짜 데이터로 UI 채우지 않기
- **모든 데이터는 Firebase Realtime DB**에서 읽고 쓰기 (`onValue`, `set`, `push`, `update`)
- **테이블(경로) 추가**: 새 기능에 필요하면 자유롭게 추가
  - `database.rules.json`에 규칙 반드시 추가
  - 기존 데이터 구조와 일관성 유지 (CLAUDE.md 아키텍처 참고)
- **데모 데이터 갱신**: 구조 변경 시 `scripts/seed-demo.mjs` 업데이트 후 재실행
  - `node scripts/seed-demo.mjs`로 기존 데이터 삭제 + 새 데이터 시드
- **기존 테이블 구조 변경 시**: database.rules.json도 함께 수정

### 프론트-백 연동 체크
- 새 훅 만들 때: `onValue`/`onChildAdded` 실시간 구독 사용
- `useEffect` cleanup에서 Firebase 리스너 해제 필수
- 데이터 쓰기: `set`/`update`/`push` 직접 호출
- 에러 처리: try-catch로 감싸고, 사용자에게 실패 피드백
- **매 사이클 검증**: Playwright로 실제 데이터가 Firebase에 저장/조회되는지 확인

## 사이클 워크플로우

### 0. 안전 점검
```bash
cd /Users/jinan/ai/Pinggo
git checkout background-improve
git pull origin background-improve   # 원격 변경 반영
git status
npm run build
```

### 1. 상태 파악
- `CLAUDE.md` 읽기 (디자인 시스템, 안티-AI 규칙, 컴포넌트 패턴)
- `git log --oneline -10` → 최근 작업 파악 (중복 방지)
- Playwright로 앱 현재 상태 확인 (admin + student 화면 모두)

### 2. 개선 실행
- 한 사이클에 **한 가지 개선에 집중** (산만하게 여러 개 건드리지 않기)
- 소스 파일 읽고 나서 수정
- **admin 화면 작업 시 → student 화면도 함께 확인/개선**
- **student 화면 작업 시 → admin에서 어떻게 보이는지도 확인**

### 3. 검증
```bash
npm run build   # 반드시 통과
```
- Playwright 스크린샷으로 시각적 확인
- **CLAUDE.md AI 생성 UI 체크리스트 10개 항목 점검**
- "토스/Linear처럼 보이는가, AI 데모처럼 보이는가?" 자문

### 4. 커밋 & 푸시
```bash
git add -A && git commit -m "improve: 설명"
git push origin background-improve
```

### 5. 에러 복구
- 빌드 3회 실패 → `git checkout .`, 다음 사이클로
- Playwright 연결 실패 → 시각적 검증 스킵, 빌드만 확인
- 막히면 → 포기하고 다음 사이클로

## 서브에이전트 활용 (적극 권장)

- **Research agent**: 디자인 레퍼런스, UX 패턴, 경쟁 서비스 조사
- **Explore agent**: 코드베이스 분석, 패턴 찾기, 의존성 추적
- **Code review agent**: 변경 후 품질 검토
- **git worktree**: 병렬 작업 (완료 후 반드시 `background-improve`에 merge)

## 개선 카테고리 (순환 선택)

1. **디자인 디테일**: 정렬, 색상, 그림자/보더 일관성, hover/active 상태, 마이크로 인터랙션
2. **UX 개선**: 사용자 흐름, 에러 메시지, 빈 상태, 로딩 경험, 접근성
3. **코드 품질**: 큰 컴포넌트 분리(200줄 초과), 중복 제거, 성능 최적화
4. **기능 고도화**: 애니메이션 타이밍, 전환 효과, 엣지케이스 처리
5. **신규 기능**: 강사/학생 모두에게 가치 있는 것, admin+student 양쪽 구현

## Playwright 기능 검증 (매 사이클 필수)

스크린샷만 찍지 말고, **실제로 클릭하고 동작을 확인**:

### 강사 화면 검증
- 데모 로그인 → 세션 입장 → 질문 활성화 → 투표 결과 확인
- 질문 추가 폼 열기 → 입력 → 제출 → 목록에 나오는지 확인
- 타이머 팝업 열기/닫기, 채팅 팝업 열기/닫기
- 패널 접기/펼치기, 아코디언 동작
- 세션 종료 → 완료 상태에서 결과 보기

### 학생 화면 검증
- 세션 링크 접속 → 닉네임 입력 → 참여
- 투표 선택 → 확인 → 결과 대기
- 하단 바 (손들기, 긴급질문) 동작
- 리액션 전송
- 모바일 뷰포트(390x844)에서 레이아웃 확인

### 검증 규칙
- **클릭 → 결과 확인**: 버튼 눌렀는데 반응 없으면 버그 → 즉시 수정
- **빈 상태 확인**: 데이터 없을 때 화면이 어떻게 보이는지
- **에러 상태 확인**: 잘못된 입력, 네트워크 끊김 등
- 신규 기능 추가 시 → 반드시 Playwright로 전체 플로우 테스트

## 자기 진화 (Self-Improvement)

### prompt.md 진화
- 매 사이클 중 더 나은 규칙/패턴을 발견하면 → prompt.md 자체를 개선
- 반복적으로 발생하는 문제 → 규칙으로 추가
- 불필요하거나 오래된 규칙 → 정리/삭제
- 새로운 개선 카테고리 발견 → 추가

### CLAUDE.md 참조 강화
- CLAUDE.md에 없는 새로운 패턴을 발견하면 → 메모해두고 사용자에게 제안
- 디자인 토큰, 컴포넌트 패턴이 실제 코드와 다르면 → 코드를 CLAUDE.md에 맞추기

### 학습 기록
매 사이클 끝에 아래에 한 줄 기록 (최근 10개만 유지):

---

## 사이클 로그
> 최근 10개만 유지. 오래된 것은 삭제.

<!-- 예시: 2026-03-20 01:30 | improve: 학생 투표 화면 터치 타겟 48px로 통일 -->
2026-03-20 | improve: 에러 바운더리 — ErrorBoundary 컴포넌트 신설(112줄). React class component로 getDerivedStateFromError/componentDidCatch 구현. 라우트 레벨(student/admin) 2개 + 세분화 경계(VizRenderer visualization, VotePage voter) 2개 = 총 4개 경계. 한국어 복구 UI(다시 시도/새로고침), details 태그로 에러 상세 접기, scope별 console.error 로깅. fullPage prop으로 전체화면/인라인 모드 분기
2026-03-20 | improve: 컴포넌트 크기 감사 — AdminPage.jsx(1022줄) → 425줄로 분리. 5개 서브컴포넌트 추출: AdminSessionHeader(186줄, 헤더바+타이머+ElapsedTime), ClassSummary(179줄, 클래스 요약+질문별 인사이트), RightSidebar(204줄, 참여자 패널+QR+아코디언), PresentationView(90줄, 발표 모드+MainContent), ModeSwitcher(79줄, 모드 전환 아코디언). 미사용 import 정리
2026-03-20 | improve: 발표 모드 QR 오버레이 — PresentQROverlay 컴포넌트 신설. 기본 축소 상태(slate-900 QR아이콘+세션코드+참여자 수 pill), 클릭 시 확대(QR 180px+세션코드 bold+링크복사+접속 수). Framer Motion AnimatePresence 전환, stopPropagation으로 발표 종료 미스클릭 방지. 기존 120px 고정 QR+URL 텍스트 제거, 하단좌측 세션코드 뱃지도 QR 오버레이로 통합
2026-03-20 | improve: 학생 실시간 투표 결과 — StudentLiveResults 컴포넌트 신설(95줄). 투표 후 VoteConfirm 아래에 실시간 분포 미니 바 차트 표시. 내 선택 강조(bold+dark bar), 참여자 수 실시간 갱신, useVotes 훅으로 Firebase 실시간 연동. ChoiceVoter(객관식), OXVoter(O/X)에 적용. QuizVoter는 정답 공개 전까지 결과 비공개 유지. slate 모노크로매틱, 모바일(390px) 최적화
2026-03-20 | improve: 디자인 토큰 감사 — Anti-AI 체크리스트 기반 전수 조사. design-tokens.js의 stale 레시피(btnPrimary/badgePrimary/avatar) indigo→slate 동기화, Avatar bg-indigo-100→bg-slate-100, Lottery 레인보우 카드→슬레이트 모노크로매틱, AdminSessionHeader 세팅중 배지 amber→slate, SessionDashboard 세팅 상태 amber→slate, QuizEventBanner/Roulette/Leaderboard/QuestionManager 장식적 색상 제거. 허용 유지: Radio 아이콘(indigo), BarChart/OXBattle 브랜드(indigo gradient), 타이머 기능색(amber/red), 접속 상태(emerald), 리액션 피드백(각 고유색)
2026-03-20 | improve: 성능 최적화 감사 — React.memo 14개 컴포넌트(BarChart, OXBattle, WordCloud, QACards, VizRenderer, ParticipantList, QuestionList, AdminSessionHeader, RightSidebar, StudentLiveResults, ModeSwitcher, ClassSummary, Leaderboard + 기존 ReactionButton) 적용. useVotes/useParticipants/useScores 3개 훅의 파생값(voteList/tallied/countByValue/list/onlineList/leaderboard/totalTickets) useMemo/useCallback으로 안정화. AdminPage 콜백 12개 useCallback으로 감싸서 하위 memo 컴포넌트가 불필요하게 리렌더되지 않도록. drawParticipants/studentUrl useMemo 적용
2026-03-20 | improve: 접근성 감사 — 전체 앱 aria 속성 감사 및 적용. aria-label: 아이콘 전용 버튼(채팅/타이머/뒤로가기), 모든 input/textarea에 추가. role: progressbar(참여율 바 2곳), alert(에러 메시지 5곳), status+aria-live(토스트 3곳), log(JoinToast), toolbar(학생 하단바), dialog aria-label(모달). aria-expanded: 아코디언 버튼, 타이머 팝업. aria-pressed: 손들기/채팅 토글. focus-visible: Button/IconButton focus→focus-visible 변경(키보드 전용 포커스 링). aria-hidden: 장식 SVG 마스코트 3곳. group role: 객관식/OX 선택지 그룹화
2026-03-20 | improve: 학생 질문 진행 표시 — VotePage 질문 헤더에 "질문 1/3" 텍스트 + 슬레이트 진행 바 추가. order 기준 정렬, useMemo로 계산, spring 애니메이션. 학생이 현재 진행 상황을 즉시 파악. TimerExpiredOverlay 서브컴포넌트 추출로 VotePage 본체 200줄 이하 유지
2026-03-20 | improve: 질문 순서 변경 — QuestionList에 위/아래 화살표 버튼 추가, QuestionManager에 Firebase order 필드 스왑 로직 구현. CourseEditor(강의 템플릿 편집)에도 동일 적용. 첫/마지막 질문은 해당 방향 비활성화. Framer Motion layout 애니메이션으로 부드러운 순서 전환. 읽기전용 세션에서는 화살표 미표시
2026-03-20 | improve: 퀴즈 정답 축하 이펙트 — ConfettiBurst 컴포넌트 신설(114줄). 정답 시 24개 슬레이트 파티클(원/사각/다이아몬드)이 체크마크 주변에서 폭발. Framer Motion SVG 순수 구현(외부 의존성 없음), seededRandom으로 deterministic 배치, 1.2초 후 자동 언마운트. QuizResult 카드 overflow-hidden으로 파티클을 카드 경계 내에 제한. 오답 시에는 렌더링하지 않음
2026-03-20 | improve: 학생 리더보드 폴리시 — LeaderboardPage: MyRankCard 히어로(순위 5xl, 상위 % 표시, 연속정답/최고연속/티켓 배지), 8위 밖 StickyMyRank 하단 고정 카드. Leaderboard: LeaderboardRow 서브컴포넌트 추출, layoutId 기반 순서 변경 애니메이션, RankChange 화살표(실시간 순위 변동), "나" 태그(podium/일반 분기), 3연속 이상 streak amber 강조, lastPoints AnimatePresence 전환
2026-03-20 | feat: CSV 내보내기 — ClassSummary(완료 세션 요약 페이지)에 "내보내기" 드롭다운 메뉴 추가. 2가지 CSV 다운로드: (1) 질문 결과(번호/질문/유형/선택지/정답/응답수/응답률/정답률/선택지별 분포), (2) 참여자별 응답(닉네임/각 질문 답변/총점/티켓). UTF-8 BOM 포함 Excel 호환. lib/csv.js 유틸리티, ExportMenu.jsx 드롭다운 컴포넌트. bg-slate-900 CTA, lucide Download/FileSpreadsheet/Users 아이콘
2026-03-20 | feat: PWA 매니페스트 — manifest.json(standalone, portrait-primary, theme-color #0F172A), 아이콘 4종(192/512 일반+maskable, Playwright로 SVG→PNG 변환), service worker(네트워크 우선+앱 셸 캐시, Firebase 요청 패스스루), Apple 메타태그 7개(apple-touch-icon, web-app-capable, status-bar-style, title, description, theme-color, viewport-fit:cover), InstallPrompt 컴포넌트(Chrome beforeinstallprompt 처리 + iOS Safari 수동 안내 배너, sessionStorage 기반 해제 기억)

## 페르소나 (매 사이클 반드시 해당 관점으로 사고)

- **학생** → "나는 수업 중 한 손으로 폰 잡고 있는 20대. 1초 안에 뭘 해야 하는지 알아야 함"
- **강사** → "나는 학생들 앞에서 수업 진행 중. 헤매면 안 되고, 원클릭으로 다 되어야 함"
- **프레젠터 화면** → "나는 강의실 뒷자리에서 프로젝터 보는 학생. 글자 크고 깔끔해야 함"
