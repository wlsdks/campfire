# UI Patrol Findings

> Playwright 기반 자동 UI 순회 — 디자인 시스템 준수 + 사용성 개선.
> 2026-03-29 최초 시작, 지속 운영 중.

---

## 구현 완료된 수정 (Implemented)

| # | 날짜 | 요약 | 파일 | 카테고리 |
|---|------|------|------|----------|
| 1 | 03-29 | Submit 에러 상태 마스코트 누락 → PickMascot 추가 | `SubmitPage.jsx` | cross-view |
| 2 | 03-29 | Live/Report 에러 상태 텍스트 스타일 불일치 → 통일 | `LivePage.jsx`, `ReportPage.jsx` | token-consistency |
| 3 | 03-29 | Live/Report/Submit 에러 마스코트 센터링 → `flex flex-col items-center` | 3개 파일 | responsive |
| 4 | 03-29 | "질문 목록" h2 헤더 한국어 단어 중간 줄바꿈 → `shrink-0` | `QuestionManager.jsx` | responsive |
| 5 | 03-30 | 하단 도구바 iPhone 가로모드 safe-area 미적용 → 가로 inset 추가 | `StudentBottomBar.jsx` | UX-3 |
| 6 | 03-30 | 투표 대기 상태 시각 피드백 부족 → breathing 애니메이션 + dots 강화 | `VoteConfirm.jsx` | UX-4 |
| 7 | 03-30 | 투표 후 disabled 상태 미묘 → opacity 0.3 + pointer-events-none | `ChoiceVoter.jsx`, `QuizVoter.jsx` | UX-1 |

## 리뷰 필요 (Needs Review)

| # | 요약 | 카테고리 |
|---|------|----------|
| 1 | 200줄 초과 컴포넌트 15개 (PresentationView 408줄 등) — 수동 분할 필요 | optimization |

---

## 순회 커버리지

### 완료된 영역 ✅
- **학생**: 랜딩, JoinPage, VotePage(퀴즈 투표/자신감/정답/리더보드), 실습 체크, 리액션 바, 손들기, 긴급질문, 수업 질문, 채팅
- **강사**: 로그인, 대시보드(5탭), 세션 상세(3컬럼/모바일 4탭), 질문 활성화/정답 공개/리더보드, 타이머, 새 클래스/질문 추가/과제 등록 모달
- **프레젠터**: 바 차트, 정답 하이라이트, 리더보드
- **과제**: 제출 랜딩/폼, 상세(제출물/AI심사/시상)
- **에러 상태**: Submit, Live, Report — 마스코트+센터링 통일
- **뷰포트**: Mobile 390x844, Tablet 768x1024, Desktop 1440x900, Galaxy S 360px, iPhone 16 Pro Max 440px
- **테마**: 다크 모드 + 라이트 모드 전환 검증

### 미체크 ⬜
- OX 투표 학생 화면 + 프레젠터 OXBattle (해당 유형 질문 데이터 필요)
- 텍스트 입력 학생 화면 + 프레젠터 워드클라우드
- 강사 채팅 드로어 (데스크탑 사이드 드로어)

---

## UX 개선 백로그

> 디자인 시스템 위반이 아닌, **실제 사용 관점**에서의 개선 포인트.
> 크론이 1시간마다 하나씩 구현하거나, 새 포인트를 발견해서 추가.

### 🟢 구현 완료

**UX-1**: 투표 후 disabled 상태 미묘 → opacity 0.3 + pointer-events-none ✅
**UX-3**: 하단 도구바 iPhone 가로모드 safe-area → 가로 inset 추가 ✅
**UX-4**: 투표 대기 상태 피드백 부족 → breathing 애니메이션 + dots 강화 ✅

### 🟡 구현 대기 (found — needs review)

**UX-5: 프레젠터 뷰 질문 전환 시 동기화 갭** [영향: 높 | 리스크: 주의]
- 강사가 질문을 전환하면 Firebase 지연(300-800ms) 동안 프로젝터는 이전 질문 표시. 강사는 이미 다음 질문 설명 중인데 프로젝터가 안 바뀌면 혼란.
- 파일: `src/app/routes/live/LivePage.jsx` (VizRenderer)
- 제안: `currentQId` 변경 시 즉시 fade-out → 새 데이터 도착 후 fade-in
- 참조: Keynote — 슬라이드 전환은 즉시 시각 피드백

**UX-6: 하단 도구바 5개 버튼 시각 위계 부재** [관찰 완료 — 현재 유지]
- 재분석: 5개 버튼은 각기 다른 lucide 아이콘 + 한국어 라벨로 이미 구분됨. 손들기=active 시 BTN_ACTIVE+pulse ring, 도움=emerald 상태색.
- 추가 위계 넣으면 디자인 시스템 "빼는 디자인"+"색상은 기능에만" 원칙 위반.
- **결론**: 의도적 균일 스타일 (Linear 패턴). 현재 유지.

**UX-2: 헤더 점수 카운터 네트워크 지터** [영향: 낮 | ✅ implemented]
- Wi-Fi 불안정 시 Firebase 값이 역방향으로 오면 카운터가 깜빡임.
- 파일: `src/app/routes/student/StudentHeader.jsx` (HeaderScore)
- 수정: `value < prevRef.current` 시 `motionVal.set(value)`로 즉시 설정 (애니메이션 없이). 정상 증가 시에만 0.6초 ease 애니메이션 유지.

**UX-7: 대기 화면 팁 자동 회전이 퀴즈 진입과 충돌** [영향: 낮 | ✅ implemented]
- 팁 캐러셀이 무한 회전 → 5개 팁 1회 순환(25초) 후 자동 정지로 변경.
- 파일: `src/app/routes/student/WaitingPage.jsx`
- 수정: `setIndex` 콜백에서 `next >= TIPS.length` 시 `clearInterval` 호출. 모든 팁을 1번씩 보여준 후 마지막 팁에서 정지 → 퀴즈 진입 시 시선 분산 방지.

### 🔵 탐색 중 (아직 코드 미확인, 관찰 기반 가설)

**UX-8: 학생 화면 정보 밀도 — 헤더가 빽빽함** [영향: 낮→관찰 완료 | 리스크: 안전]
- 390px: gap-4(16px) 간격으로 적절히 배치, 여유 있음. 360px(Galaxy S): 밀집되지만 overflow/wrapping 없이 한 줄 유지.
- 점수/티켓은 조건부 렌더링(0이면 숨김)이라 첫 진입 시에는 더 여유로움.
- 코드 확인: `StudentHeader.jsx` — gap-4 + 아이콘 14-16px + 버튼 32x32 = 합리적 밀도.
- **결론**: 현재 수준 유지 가능. 추후 헤더에 항목이 추가되면 재검토.

**UX-9: 리더보드 카드 간격이 좁아서 순위 스캔이 어려움** [영향: 중 | 리스크: 안전]
- 9명 이상일 때 리더보드 항목이 빽빽하게 쌓임. 점수+스트릭+티켓+이름이 한 행에 몰려 있어 빠른 순위 확인 어려움.
- 고려: 상위 3명은 카드 크기 키우고, 4위 이하는 컴팩트 리스트로 시각 분리
- 참조: Duolingo — 상위 3명 포디움은 크게, 나머지는 작게

**UX-10: 강사 3컬럼 레이아웃에서 중앙 결과 영역 스크롤 독립성** [관찰 완료 — 이미 구현됨]
- 코드 확인: 좌측(`AdminPage.jsx:140` overflow-y-auto h-full), 중앙(`:144` overflow-auto h-full), 우측(`RightSidebar.jsx:241` overflow-y-auto h-full) — 3패인 모두 독립 스크롤 이미 적용됨.
- **결론**: 이슈 없음. 20개 질문 리스트 스크롤 시 다른 패인에 영향 없음 확인.

**UX-11: 과제 제출 폼 — 필수 필드 표시 없음** [관찰 완료 — 현재 유지]
- 코드 확인: "프로젝트 설명"에만 `<span>선택</span>` 표시 → 나머지(이름/비밀번호/URL)는 암묵적 필수.
- Apple HIG: "대부분 필수면 선택 필드만 표시" 패턴과 일치. 빨간 * 추가는 anti-AI 색상 규칙 위반.
- **결론**: 현재 패턴이 올바름. 변경 불필요.

**UX-12: 프레젠터 뷰 — 질문 유형 배지 가독성** [관찰 완료 — 현재 유지]
- 1920x1080 실측: "실습 체크" 배지 ~60px — 프로젝터에서 작지만, 질문 텍스트 자체가 대형으로 유형을 충분히 전달. 배지는 보조 정보.
- 배지 키우면 질문 텍스트와 시각 경쟁 → 오히려 위계 혼란. 강사가 구두로 유형 안내하는 것이 일반적.
- **결론**: 현재 크기 유지. 질문 텍스트가 primary, 배지가 secondary — 위계 적절.

**UX-13: 학생 투표 후 "다른 학생 응답 분포" 실시간 미리보기** [영향: 중 | 리스크: 주의]
- 현재 투표 후 VoteConfirm만 보이고, 다른 학생들의 응답 분포는 정답 공개 전까지 안 보임. StudentLiveResults가 있지만 ChoiceVoter에서만 사용, QuizVoter에서는 정답 공개 전에는 숨김.
- 고려: 투표 후 "현재 N명 투표 완료" 카운터라도 보여주면 참여감 증가
- 참조: Mentimeter — 투표 후 실시간 카운트 표시

---

## 크론 운영 가이드

- **주기**: 1시간마다 (`7 * * * *`)
- **순회 우선순위**: 코드 변경 회귀 테스트 > UX 백로그 구현 (높→낮) > 새 UX 발견
- **구현 규칙**: 디자인 시스템 준수, 최소 변경, Playwright 확인, findings 업데이트
