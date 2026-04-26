# Pick — 기능/디자인/상호작용 정리 백로그

> 2026-04-26 audit 결과 통합. 3개 트랙(PM/Designer/QA) 병렬 audit → 우선순위 백로그.
> 이 문서는 20분 cadence loop의 작업 큐다. 사용자 승인 후 loop 시작.

## 목차

1. [Audit 요약](#audit-요약)
2. [사용자 결정 필요 (Decision Gates)](#사용자-결정-필요)
3. [P0 — 즉시 수정 (CRITICAL)](#p0--즉시-수정-critical)
4. [P1 — 높음 (HIGH)](#p1--높음-high)
5. [P2 — 중간 (MEDIUM)](#p2--중간-medium)
6. [P3 — 정리 (LOW)](#p3--정리-low)
7. [Loop 운영 규칙](#loop-운영-규칙)

---

## Audit 요약

### 트랙 #1 (PM 관점)
- **유지 명확**: session, participants, voting, quiz, visualization, timer, assignments, ai-judge, course
- **통합 후보 (folder만 분리, UI 이미 통합)**:
  - hand-raise + class-questions + questions(urgent) → `interactions`
  - chat + dm → `messaging`
- **Cut 후보 (이미 한번 제거됐다 복귀한 이력 있음)**: Plinko, Roulette, PrizeDraw
- **Cut 검토**: SlotMachine, MysteryBox/HintReveal 중복, teams, QuickSurvey/ComprehensionCheck/GroupDiscussion
- **결정 필요**: 게임 어디까지 남길지, chat 자체 필요한지, /report 학생 측 사용률

### 트랙 #2 (Designer 관점)
- **CRITICAL**: 컬러 원형 배지 5건, 이모지 주석 2건
- **HIGH**: tint 배경 71건(indigo-50 28 / emerald-50 24 / amber-50 19), 시상 그라디언트 4건, shadow+border 중복 3건
- **MEDIUM**: 인라인 style hex, BarChart indigo-600 강도, staff red-50 배지 5건
- **LOW**: 다크모드 페어 누락 10+건
- **모드 평가**: 전자칠판 가장 양호 → 학생 양호 → 강사 → 스태프(red-50 패턴 반복) 순

### 트랙 #3 (QA 관점)
- **CRITICAL**:
  1. 게임 결과 발행이 `LivePage`에서만 일어남 → 전자칠판 안 켜면 결과 표시 안 됨
  2. 강사 화면(`AdminPage`/`MobileAdminView`)에 `ChatBubbleOverlay` 없음 → 강사가 학생 한 줄 반응 못 봄
  3. 전자칠판에 손들기/긴급질문 표시 없음
- **HIGH**: drumroll이 PresentationView 전용, votes 150ms debounce, 답변자 신원 학생 비표시
- **MEDIUM**: resetAllQuestions 파괴적, 스태프 모바일이 currentMode 변화 미반영, useSession 13 listener 누락 위험
- **Race**: revealQuiz batch 중 다음 질문 / timer expired vs reveal / handRaises reset

---

## 결정 사항 (사용자 위임 → AI 결정, 2026-04-26)

| # | 결정 | 근거 |
|---|------|------|
| **D1** | RandomPicker + Lottery + BreakTimer만 유지. **Plinko, Roulette, PrizeDraw, SlotMachine cut** | 앞 3개는 이미 한번 제거됐다 복귀한 이력. SlotMachine은 Lottery와 연출만 다름. Roulette는 RandomPicker가 100% 흡수 |
| **D2** | **공개 chat cut, DM만 유지** | 최근 chat commit 0건, DM에는 활발한 commit. 강의 중 공개 채팅은 산만함 위험 |
| **D3** | **/report 학생 페이지 유지하되 P3로 강등 (추가 투자 0)** | evidence 없이 cut 위험. 강사가 링크 공유할 수도 |
| **D4** | **teams (TeamBattle) cut** | 6개월 commit 0건 |
| **D5** | **MysteryBox/HintReveal: 코드 중복 확인 후 games 측 cut** (voting/MysteryBoxVoter 이미 존재) | 이중 구현 정리 |
| **D6** | **interactions / messaging 통합 진행 (P2 후반)** | cleaner architecture. D1~D5 cut 작업 후 |

---

## P0 — 즉시 수정 (CRITICAL)

> 명백한 버그 또는 사용자 경험을 망가뜨리는 항목. 결정 없이 바로 진행 가능.

### P0-1. 게임 결과 발행을 강사 측에서도 보장
- **a) Lottery wiring** ✅ `ebd6405` — MainContent placeholder 제거, AdminPage/MobileAdminView/CenterContent에 publish handler chain
  - **Browser spot-check (Playwright)**: `/admin` 일반 모드 + 발표 모드 둘 다 추첨 컴포넌트 실제 렌더 확인. 0 console errors across 7 navigations. 데모 모드에서 모드 dropdown → 추첨 → "제비뽑기" UI 정상. 회귀 없음.
- **b) RandomPicker publish** 🚫 **cancelled** — 재검토 결과 신기능 영역으로 판단:
  1. WaitingPage `showGameResult` 조건이 `currentMode === 'lottery'`만 — randomPicker는 학생 측 표시 UI 자체 없음
  2. `GameResultOverlay` 컴포넌트는 orphan (import되는 곳 0)
  3. publish만 추가해도 학생 화면 변화 없음 → 학생 UI도 새로 만들어야 함 = 신기능
  4. anti-feature-bloat 원칙 위반. 강사 화면 RandomPicker는 이미 정상 동작. 발표자 호명은 강사가 구두로 진행하는 게 자연스러움.
- **c) Race guard** (강사 데스크톱+전자칠판 동시 lottery) — P1로 이관 검토

### P0-2. 강사 화면에 ChatBubbleOverlay 추가 ✅ `41a369b`
- **증상**: 학생 한 줄 채팅 버블이 학생/전자칠판/PresentationView에는 표시되나 강사 일반 화면(데스크톱·모바일)에는 안 나옴 → 강사가 학생 반응 못 봄
- **fix**: AdminPage + MobileAdminView에 `<ChatBubbleOverlay />` 추가

### P0-3. 컬러 원형 배지 → 토큰 패턴으로 교체 ✅ `334ae07`
- ClassInsightCard 번호 → bare `1.` 형식 (text-indigo-600 + tabular-nums)
- DrumrollOverlay → lucide Drum 아이콘 (Peak-End 모먼트 보존)
- ~~MysteryBoxPresenter, HintQuizPresenter~~ — D5 cut 시 함께 정리

### P0-4. 이모지 주석/문자 잔존 제거 ✅ `8f9c44d`
- **위치**: `CombinedRanking.jsx:85`, `SubmissionPreview.jsx:63`, `QARanking.jsx:7` (3개 발견)
- **fix**: 이모지 포함 주석 일괄 제거

---

## P1 — 높음 (HIGH)

### P1-1. tint 배경 71건 정리 (visualization/ai-judge 집중) ⏳ in progress
- ✅ batch 1 `76c1c75` — visualization 4건 (AISummaryBanner, AnalogyHelper, WrongAnswerAnalysis ×2)
- 남은: visualization CorrectAnswerRanking podium, ai-judge / assignments / class-questions / staff 영역
- **증상**: §1 "박스 배경에 색상 tint 금지 — bg-white 또는 bg-slate-50만" 위반
- **분포**: indigo-50/100 28건, emerald-50 24건, amber-50 19건
- **주요 위치**:
  - `src/features/visualization/components/AISummaryBanner.jsx:102` (bg-indigo-50)
  - `src/features/visualization/components/AnalogyHelper.jsx:72` (bg-amber-50)
  - `src/features/visualization/components/WrongAnswerAnalysis.jsx:90,114` (amber-50 + indigo-50 한 화면)
  - `src/features/assignments/components/SubmissionPreview.jsx:148` (bg-amber-50)
  - `src/features/class-questions/components/QuestionCard.jsx:72,85` (bg-indigo-100/50 배지)
- **fix**: bg-white + 좌측 미세 보더 또는 bg-slate-50로 통일. 위계는 텍스트 굵기/크기로
- **공수**: L (3h, 점진 진행)

### P1-2. 시상 그라디언트 → 단색 + 톤 차 ✅ `8fd681b`
- 6 RANK_META + 5 사용처 정리. 1등 amber-500 / 2등 slate-400 / 3등 amber-400

### P1-3. shadow + border 중복 제거 ✅ `7bafb27`
- 3건 모두 floating element라 border 제거 + shadow 유지로 elevation 표현

### P1-4. 전자칠판에 손들기/긴급질문 표시 추가 ✅ `7d3bcbd`
- LivePage: 두 hook 추가 → LiveHeader에 카운트 뱃지 (Hand slate / AlertCircle red)
- 카운트 0일 때 미렌더, 명단 미노출 (프라이버시)

### P1-5. drumroll 트리거를 일반 admin 화면에도 ✅ `991746d`
- PresentRevealControls export → AdminPage 데스크톱 floating bar로 마운트
- 모바일은 bottom tab 충돌 우려로 미적용 (별도 처리 필요시 추가)

### P1-6. revealQuiz batch race 방어 ✅ `0d4c489`
- module-level lock Map. revealQuiz Phase 2 동안 set, activateQuestion/clearActive/showLeaderboard에서 awaitRevealLock으로 대기.

### P1-7. timer expired vs reveal race ✅ `67c9926` (배포 대기)
- 서버: rules.json `votes` validate에 revealedAt + timer endTime+2s grace 체크
- 클라이언트: ActivePollView `votingLocked = timerExpired || !!revealedAt` 도출
- ⚠️ 배포 필요: `firebase deploy --only database` (사용자 결정)

### P1-8. handRaises reset race 정리 ✅ `6d7b4aa`
- 600ms 후 학생-write 영역 재-sweep + epoch guard로 연속 reset 충돌 방지
- **증상**: resetAllQuestions가 handRaises:null write 하는 순간 학생 손들기 → 잔여 데이터
- **fix**: reset 동안 학생 측 write 가드 (세션 status 체크 또는 재시도 로직 제거)
- **공수**: S (45min)

---

## P2 — 중간 (MEDIUM)

### P2-1. staff 영역 red-50 배지 패턴 → slate + dot
- **위치**: `src/app/routes/admin/staff/{StaffQuestionPanel.jsx:36,79, StaffQuestionsTab.jsx:74, StaffQuestionDetail.jsx:270,358}`
- **fix**: slate-100 배지 + 작은 red-500 dot으로 통일
- **공수**: M (1h)

### P2-2. resetAllQuestions 파괴적 동작에 확인 모달
- **증상**: staffChat·urgentQuestions·handRaises 일괄 삭제 — 스태프 답변 작성 중 사라짐
- **fix**: 진행 중 데이터 유무 체크 + 확인 모달 (이미 있으면 강화)
- **파일**: `src/hooks/useQuestionActions.js:430`
- **공수**: S (30min)

### P2-3. 스태프 모바일 currentMode 변화 미반영
- **증상**: 강사가 다음 질문 활성화해도 스태프 모바일 화면 그대로
- **fix**: StaffMobileView에 currentQuestion/currentMode listener 추가 + 자동 화면 갱신
- **파일**: `src/app/routes/admin/staff/StaffMobileView.jsx`
- **공수**: M (1h)

### P2-4. answeredByRole 학생 측 표시
- **증상**: 답변자 신원이 staff 패널에서만 표시됨. 학생은 "강사가 답변" 같은 표식 못 봄
- **fix**: 학생 질문 카드에 답변자 역할 배지 (강사/스태프) 추가
- **공수**: S (45min)

### P2-5. BarChart indigo-600 → indigo-500
- **위치**: `src/features/visualization/components/BarChart.jsx:74,78`
- **fix**: indigo-500로 통일 (CTA-급 강도 회피)
- **공수**: XS (5min)

### P2-6. votes debounce 150ms 검토
- **증상**: 시연/소수 인원에서 차트 반영 지연 체감
- **fix**: debounce 50ms로 줄이거나 첫 5건은 즉시 반영
- **파일**: `src/hooks/useVotes.js:5`
- **공수**: S (30min)

### P2-7. games 폴더 cut (D1) — Plinko/Roulette/PrizeDraw/SlotMachine
- 각 컴포넌트 import 제거 + 강사 게임 메뉴/그리드에서 항목 삭제
- 파일: `src/features/games/components/{Plinko,Roulette,PrizeDraw,SlotMachine}.jsx` 삭제 + 사용처 grep
- **공수**: M (각 30min, 총 2h, 4 iterations로 분할)

### P2-8. chat feature cut (D2)
- 공개 chat UI/listener/파일 일괄 제거. DM 코드는 유지
- 파일: `src/features/chat/`, ChatPanel 사용처, useChat hook
- **공수**: M (1.5h)
- **주의**: ChatBubbleOverlay는 reactions 측이라 영향 없음 확인 필요

### P2-9. teams cut (D4)
- TeamBattle/useMyTeam 등 일괄 제거
- **공수**: S (45min)

### P2-10. MysteryBox/HintReveal cut (D5)
- 코드 중복 검증 → games 측 파일 삭제. voting 측 잔존 확인
- **공수**: M (1.5h, 검증 포함)

### P2-11. /report 학생 페이지 — 작업 안 함 (D3)
- 향후 사용 데이터 확보 후 재검토

### P2-12. interactions / messaging 폴더 통합 (D6, P2 마지막)
- hand-raise + class-questions + questions(urgent) → `interactions`
- DM(messaging은 단일 채널) — 폴더명만 변경
- **공수**: L (3~4h)
- **주의**: import 변경량 큼. 단계별 (구조 → import → 검증)

---

## P3 — 정리 (LOW)

### P3-1. 다크모드 페어 누락 (~10건)
- **위치**: `AdminSessionHeader.jsx:227`, `StaffPage.jsx:161,173`, `MobileParticipantsTab.jsx:61`, `SessionList.jsx:58`, `LiveHeader.jsx:44`, `LiveParticipation.jsx:43` 등
- **fix**: dark: variant 추가
- **공수**: S (30min, 일괄)

### P3-2. 인라인 style hex 색상 정리
- **위치**: `src/features/games/components/JoinShow.jsx:53`, `src/app/routes/student/IdleMascot.jsx:173-226` (마스코트 SVG라 일부 허용)
- **fix**: design-tokens.js 사용 또는 Tailwind 클래스
- **공수**: S (30min)

### P3-3. useSession secondary fields 누락 정리
- **증상**: `activeAssignmentId` 등 SECONDARY_FIELDS에 없으나 LivePage에서 사용
- **fix**: SECONDARY_FIELDS 갱신 또는 listener 추가
- **파일**: `src/features/session/api/useSession.js`
- **공수**: S (30min)

### P3-4. 모바일 모드/화면별 정합성 spot check
- 360px (Galaxy S) / 390px / 402px / 440px 화면에서 학생/스태프 화면 회귀 spot check
- **공수**: M (1h)

---

## Loop 운영 규칙

### 각 iteration이 하는 일 (20분 cadence)
1. 백로그 top 1~2개 item 선택 (P0 우선 → P1 → 결정 완료된 P2)
2. 작업 → 빌드(`npm run build` 통과) → 커밋
3. 백로그 status 업데이트 (이 파일에 ✅/⏳ 표시)
4. 다음 iteration 예약

### 멈춰야 하는 시점
- 사용자 결정(D1~D6)이 필요한 작업 도달
- 빌드 실패/회귀 의심
- 5회 연속 iteration 후 (사용자 review 권장)

### 안전 가드
- 한 iteration에 200줄 이상 변경 금지 (분할)
- Firebase 스키마/database.rules.json 수정 시 사용자 확인 필요
- 라우팅 변경 시 사용자 확인 필요
- npm run build 실패 시 즉시 revert + 보고

### 진행 상태 표기 규칙
이 문서의 각 P0/P1/P2/P3 항목 옆에 다음 표기:
- (없음) = pending
- ⏳ = in progress
- ✅ = done (commit hash 첨부)
- ⏸️ = blocked (이유)
- 🚫 = cancelled (이유)

---

## 작업 순서 (실행 큐)

Loop가 이 순서대로 진행. 각 iteration은 1개 항목 또는 큰 항목의 1단계.

### 완료 (시간순)
- ~~**P0-4** 이모지 주석 제거~~ ✅ `8f9c44d`
- ~~**P0-2** 강사 ChatBubbleOverlay 추가~~ ✅ `41a369b`
- ~~**P0-3** 컬러 원형 배지 → 토큰~~ ✅ `334ae07`
- ~~**P0-1a** Lottery wiring~~ ✅ `ebd6405` + Playwright spot-check 통과
- ~~**P0-1b** RandomPicker publish~~ 🚫 cancelled (신기능 scope)
- ~~**P1-3** shadow+border 중복 제거~~ ✅ `7bafb27`
- ~~**P1-2** 시상 그라디언트 단색화~~ ✅ `8fd681b`
- ~~**P1-5** drumroll 일반 admin 화면에~~ ✅ `991746d`
- ~~**P1-4** 전자칠판 손들기/긴급질문 카운트~~ ✅ `7d3bcbd`
- ~~**P1-6** revealQuiz batch race 방어~~ ✅ `0d4c489`
- ~~**P1-7** timer expired vs reveal race~~ ✅ `67c9926` (rules.json 배포 대기)
- ~~**P1-8** handRaises reset race~~ ✅ `6d7b4aa`

### 다음 큐 (실행 순서)

1. **P1-1** tint 배경 71건 정리 ⏳ — batch 1 `76c1c75` 완료, 다음 batch 진행
3. **P0-1c** 게임 race guard (강사 데스크톱+전자칠판 동시) (45분)
4. **P2-1** staff red-50 배지 정리 (1h)
5. **P2-5** BarChart indigo-600 → 500 (5분)
6. **P2-7** games cut: Plinko (30분)
7. **P2-7** games cut: Roulette (30분)
8. **P2-7** games cut: PrizeDraw (30분)
9. **P2-7** games cut: SlotMachine (30분)
10. **P2-9** teams cut (45분)
11. **P2-8** ⏸️ 공개 chat cut (1.5h) — **사용자 final confirm 필요**
12. **P2-10** MysteryBox/HintReveal cut (1.5h, 검증 포함)
13. **P2-2** resetAllQuestions 확인 모달 (30분)
14. **P2-3** 스태프 모바일 currentMode 동기화 (1h)
15. **P2-4** answeredByRole 학생 표시 (45분)
16. **P2-6** votes debounce 검토 (30분)
17. **P2-12** ⏸️ interactions/messaging 폴더 통합 (3~4h) — **사용자 확인 필요**
18. **P3-1~4** 정리 일괄 (다크모드/inline style/SECONDARY_FIELDS/모바일 회귀 spot)

### 멈춤 지점 (사용자 확인 필요)
- #11 P2-8: chat 전체 cut 시작 전 final confirm
- #17 P2-12: 통합 작업 시작 전
- ⚠️ rules.json 배포: P1-7 commit 67c9926 — `firebase deploy --only database` 사용자 결정
- #18 P2-12: 통합 작업 시작 전

---

## 변경 이력 (백로그 자체)
- 2026-04-26 초안 작성 (audit 통합)
- 2026-04-26 D1~D6 결정 반영, 작업 순서 큐 추가
