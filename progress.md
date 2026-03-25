# Pick UI/UX Improvement Progress

> Auto-updated each cycle. [x] = done, [ ] = pending, [~] = in progress
> Last updated: 2026-03-26

## Current: Phase 10 - Continuous Improvement

### Phase 1: Foundation
- [x] 1.0: Architecture migration → Bulletproof React structure + @ path alias
- [x] 1.1: Install deps + fonts + design tokens
- [x] 1.2: Shared UI components
- [x] 1.3: Global styles + shotshot → pinggo cleanup

### Phase 2: Student Pages
- [x] 2.1: JoinPage
- [x] 2.2: VotePage
- [x] 2.3: Voters (Choice/OX/Text)
- [x] 2.4: WaitingPage
- [x] 2.5: BottomBar + modals
- [x] 2.6: VoteConfirm
- [x] 2.R: Student review cycle

### Phase 3: Admin Pages
- [x] 3.1: AdminLogin
- [x] 3.2: AdminPage layout
- [x] 3.3: QuestionManager
- [x] 3.4: Sidebar panels
- [x] 3.5: Presentation mode
- [x] 3.R: Admin review cycle

### Phase 4: Visualizations
- [x] 4.1: BarChart
- [x] 4.2: OXBattle
- [x] 4.3: WordCloud
- [x] 4.4: QACards
- [x] 4.R: Viz review cycle

### Phase 5: Games
- [x] 5.1: Roulette
- [x] 5.2: Lottery
- [x] 5.R: Games review cycle

### Phase 6: Timer Feature
- [x] 6.1: Timer component
- [x] 6.2: Firebase timer + hook
- [x] 6.3: Admin controls
- [x] 6.4: Student display
- [x] 6.R: Timer review cycle

### Phase 7: Reactions
- [x] 7.1: Data model + hook
- [x] 7.2: ReactionBar (student)
- [x] 7.3: ReactionOverlay (admin)
- [x] 7.4: Integration
- [x] 7.R: Reactions review cycle

### Phase 8: Quiz Mode
- [x] 8.1: Data model
- [x] 8.2: Admin quiz UI (pending integration)
- [x] 8.3: Student quiz result
- [x] 8.4: Leaderboard
- [x] 8.5: Quiz flow polish (pending full integration)
- [x] 8.R: Quiz review cycle

### Phase 9: Global Polish
- [x] 9.1: Loading states (skeleton screens implemented)
- [x] 9.2: Error + empty states (consistent icon-in-box pattern)
- [x] 9.3: Micro-interactions audit (spring taps, stagger, ring feedback)
- [x] 9.4: Responsive audit (mobile + desktop verified via Playwright)
- [x] 9.5: Animation performance (purposeful animations only)
- [x] 9.6: Presenter mode polish (ESC key, dark pill, session badges)
- [x] 9.7: Connection status (ConnectionDot with emerald/amber states)
- [x] 9.R: Final review

---

## Feature Ideas (Proposals - Not Yet Approved)
> Add ideas here during cycles. Only build if genuinely high-impact.

| Idea | Rationale | Priority |
|------|-----------|----------|

---

## Cycle Log
| # | Time | Task | Notes |
|---|------|------|-------|
| 43 | 2026-03-26 | 강사 MobileAdminView 질문 관리 터치 UX 개선 (4파일) | QuickProgressCard: 퀴즈 상태별 컨텍스트 인지 CTA — 일반질문(다음질문/대기화면), 퀴즈미공개(정답공개/대기화면), 퀴즈공개(리더보드/다음질문). min-h-[52px] 모바일 버튼. mobileStickyProgress prop — 스크롤 중에도 컨트롤 sticky 노출. QuestionList 모바일 액션 버튼 min-h-[48px]+rounded-xl+active:scale-[0.96] 48px 터치 타겟 준수. |
| 42 | 2026-03-26 | 200줄+ 컴포넌트 분리 — CreateSessionModal, ClassQABoard (7파일) | CreateSessionModal(365→179줄): CreateSessionStepCourse(51줄)+CreateSessionStepNewCourse(46줄)+CreateSessionStepConfirm(146줄)로 3스텝 분리. ClassQABoard(313→162줄): QuestionCard(128줄)+AnswerItem(31줄) 분리. Modal/Board는 오케스트레이션만 담당. 빌드 통과, 전 파일 200줄 미만 |
| 41 | 2026-03-26 | VotePage 컴포넌트 분리 (5파일) | VotePage 448줄→134줄: QuestionCard(59줄) 진행도바+질문카드, ActivePollView(180줄) 활성투표 레이아웃, VoteModeContent(117줄) 모드별 lazy 디스패치, VoteHelpers(97줄) getModeVariants+ENTER_TRANSITION+TimerExpiredOverlay. VotePage는 훅/상태 오케스트레이션만 담당. 빌드 통과, 전 파일 200줄 미만 |
| 40 | 2026-03-26 | VoteConfirm 축하 애니메이션 강화 (1파일) | ParticleBurst: 8개 도트 방사형 scatter (0.55s, 0.18s 딜레이 stagger). AnimatedCheck: 원형 ring pulse expand (scale 0.6→1.6→fade), 체크원 scale keyframe [0,1.22,0.92,1.06,1] 강한 overshoot, 체크마크 pathLength w7→w8. 텍스트: scale pop keyframe [0.85,1.08,0.97,1] + stagger. 선택 답변: border→ring-1 indigo (anti-AI 패턴 준수). 총 1파일 |
| 39 | 2026-03-26 | 퀴즈 정답 공개 화면 연출 개선 (2파일) | QuizResult: 아이콘 원형 강화(scale keyframe 0→1.25→0.9→1.05→1 + 확산 ring pulse), 오답 shake 강화(x: [0,-7,6,-5,4,-2,0]), 점수 카운트업 후 pop keyframe [1,1.22,0.96,1.06,1], 점수 text-3xl, 단계별 stagger (icon→text 0.18→score 0.32s). QuizVoter 정답 미참여 화면: 단순 텍스트 → 선택지 목록 + 정답 슬레이트-900 하이라이트 (x:-8→0 stagger) |
| 38 | 2026-03-26 | 게임 결과 위너 공개 연출 개선 (6파일) | Roulette/Plinko/SlotMachine/PrizeDraw: 단일 scale:0→1 → Avatar·이름·배지 3단계 스태거 reveal (delay 0/0.15/0.3s, spring 400/22→300/25→500/22). Plinko 볼 낙착 느낌으로 y:30 bounce-in. SlotMachine 잭팟: scale keyframe [0,1.3,0.95,1.08,1] 잭팟 feel. Lottery 카드: perspective 자식→부모 이동(3D 플립 실제 적용), rotateY 180→90(더 자연스러운 언폴드), sheen sweep 효과 추가. GameResultOverlay(학생): 트로피 원형 확대(w16→w20, 내부 아이콘 trophy), 진동(rotate keyframe), 반복 pulse ring, 당첨! 폰트 3xl→4xl, 카드 더 극적인 entrance (scale 0.75, y:28) |
| 37 | 2026-03-26 | 실시간 바 차트 grow + 워드클라우드 형성 모션 (4파일) | BarChart: spring 200/20→120/18 유동적 grow + AnimatedCount RAF 카운터 (투표 수/총합), tabular-nums. WordCloud: layout prop 추가 → 단어 재배치 smooth, scale 팝인 0.8→0.6, stiffness 200→260, hover:scale 장식 모션 제거. OXBattle: progress bar spring 일관성 120/18. WaitingPage: GameResultOverlay eager→lazy (코드 스플리팅) |
| 36 | 2026-03-26 | 코드 품질 + WaitingPage 마스코트 idle 다양화 | useAwards.js err 미사용 변수 2개 제거. SubmissionsView.jsx 미사용 useSubmissionList import 제거. no-unused-vars 에러 0개. IdleMascot: nod(앞뒤 기울기+overshoot) + bounce(scale pulse+happy squint) 2가지 idle 액션 추가 (5→7종). WaitingPage 참여자 카운트: 증가 시 전체 컨테이너 scale bounce + Users 아이콘 rotate 연출 추가 |
| 35 | 2026-03-26 | 디자인 토큰 감사 — quiz/session/participants/hand-raise (7파일) | transition-all→colors: ComprehensionCheck/GroupDiscussion(2)/QuickSurvey. HandRaiseList 흔들기 duration/ease→spring 300/25. JoinToast 누락 spring transition 추가. AchievementToast damping 20→25. LeaderboardRow ScoreDelta custom bezier→spring, 플래시 0.55→0.4s |
| 34 | 2026-03-26 | 리더보드 순위 변동 애니메이션 드라마틱 개선 (3파일) | delta useRef→useState 버그 수정. RankChange 4초 자동 숨김. ScoreDelta Kahoot 스타일 위로 떠오름. AnimatedCrown spring 500/18 회전+스케일. 순위 상승 emerald 플래시. layout spring 500/30 강화. AnimatedScore.jsx + LeaderboardRow.jsx 분리 |
| 33 | 2026-03-26 | 디자인 토큰 감사 — games/timer/reactions/visualization (5파일) | TimerRing hex 색상 → design-tokens colors. LiveParticipation 진행 바 gradient → solid. BreakTimer whileHover 장식 모션 제거. ReactionBar custom bezier → spring bouncy. RankingChart inline gradient style → Tailwind 클래스 |
| 32 | 2026-03-26 | 200줄+ 컴포넌트 분리 (코드 품질) | SessionDashboard(320→246줄): ClassesTab.jsx 분리. SubmissionPage(428→260줄): SubmissionLanding.jsx + SubmissionAwardsView.jsx 분리. 3개 신규 파일 모두 200줄 미만. 미사용 import 정리 (5파일) |
| 31 | 2026-03-26 | 페이지/모드 전환 AnimatePresence 애니메이션 | VotePage: 대기→질문→리더보드→특수모드 전환 AnimatePresence mode="wait" + getModeVariants (방향성 있는 spring). App.jsx: JoinPage→VotePage 전환 AnimatePresence. SessionDashboard: 탭 전환 mode="wait"+spring. MobileAdminView: 탭 opacity→spring y (4파일) |
| 30 | 2026-03-26 | 게임 위너 표시 Avatar 컴포넌트 통일 | Roulette/SlotMachine/Plinko/PrizeDraw/RandomPicker raw 초성 원형 DIV → Avatar. Avatar에 xl(w-20)/2xl(w-32) 사이즈 추가 (5파일) |
| 29 | 2026-03-26 | Firebase 훅 파생 데이터 메모이제이션 | useHandRaises/useUrgentQuestions/useClassQuestions/useSpeedQuiz — 매 렌더 재계산 연산을 useMemo로 감싸 Firebase 변경 시에만 재실행 (4파일) |
| 28 | 2026-03-26 | 모바일 voter UX + transition-all 전면 정리 | StudentLiveResults uppercase 제거, OXVoter whileHover 제거+min-h, ChoiceVoter/QuizVoter min-h-[56px], QuizVoter 다크배지 색상 완성, OXBattle transition 정밀화, Card/QACards/QuestionList/SessionList/QuestionLibraryView/JoinPage/StudentBottomBar transition-all→colors (15파일) |
| 27 | 2026-03-26 | 모바일 바텀시트 UX + spring 프리셋 일관성 | ChatPanel/ClassQAPanel/DMBubble 바텀시트 전환 (y:100%→0 spring, rounded-t-2xl, drag handle), pb-safe 입력영역, ChatMessage/DMMessage/ChoiceVoter spring 프리셋 통일, OXVoter transition-all→transition-colors |
| 26 | 2026-03-26 | assignments 디자인 시스템 정합성 개선 | shadow-sm+border 이중 깊이 단서 제거 10곳, tracking-tight 추가 4곳, motion.span bounce 숫자 5곳, transition-shadow→transition-colors 2곳, spring 프리셋 1곳 |
| 25 | 2026-03-26 | 디자인 시스템 spring/transition 규칙 적용 | spring 프리셋 위반 3건(Modal/SpeedQuizCombo/GameResultOverlay) + transition-all→transition-colors 8곳 + DebateVoter tracking-tight |
| 1 | 2026-03-19 | 1.0 Architecture migration | Bulletproof React structure, @ alias, all imports updated, build passing |
| 2 | 2026-03-19 | 1.1 Deps + fonts + tokens | lucide-react, lottie-react, Pretendard+Inter CDN, design-tokens.js, global CSS |
| 3 | 2026-03-19 | 1.2 Shared UI components | Button, Card, Badge, IconButton, Skeleton, Avatar, Modal — all from design tokens |
| 4 | 2026-03-19 | 1.3 Rename + global styles | shotshot→pinggo in all files, no-session screen: dark→light + emoji→lucide icon |
| 5 | 2026-03-19 | 2.1 JoinPage redesign | Card+Badge+Avatar+Button components, Sparkles icon, avatar preview, indigo palette |
| 6 | 2026-03-19 | 2.2 VotePage redesign | Skeleton loading, question Card+Badge, ConnectionDot top-right, slate tokens |
| 7 | 2026-03-19 | 2.3 Voters redesign | Light tint buttons, selection ring, OX=indigo/slate, TextInput w/ Send icon+Button |
| 8 | 2026-03-19 | 2.4 WaitingPage | Sparkles pulse, participant count Badge, session code Badge, slate tokens |
| 9 | 2026-03-19 | 2.5 BottomBar+modals | Hand+MessageCircle icons, Modal component, Button component, slate-900 toast |
| 10 | 2026-03-19 | 2.6 VoteConfirm | Animated checkmark, 2.5s delay → waiting text transition, Clock icon, emerald-100 |
| 11 | 2026-03-19 | 2.R Student review | All checklist items pass. Zero gray/blue/emoji remnants. Desktop+mobile verified. |
| 12 | 2026-03-19 | 3.1 AdminLogin | Sparkles icon, Card+Button components, error state with AlertCircle, indigo palette |
| 13 | 2026-03-19 | 3.2 AdminPage layout | Header bar, lucide icons, mode buttons, no-session/loading screens, slate/indigo tokens |
| 14 | 2026-03-19 | 3.3 QuestionManager | Lucide type icons, icon action buttons, indigo left border active, Badge LIVE, Button components |
| 15 | 2026-03-19 | 3.4 Sidebar panels | Avatar initials, Hand/AlertCircle/Trash2 icons, Badge counts, IconButton dismiss |
| 16 | 2026-03-19 | 3.5 Presentation mode | ESC key exit, dark pill hint, session info badges, p-12 projector padding, text-lg |
| 17 | 2026-03-19 | 3.R Admin review | All checks pass. Fixed JoinToast+ConnectionDot. Zero remnants in admin scope. |
| 18 | 2026-03-19 | 4.1 BarChart+VizRenderer | Indigo bars, colored tracks, Sparkles empty state, type Badge, slate tokens |
| 19 | 2026-03-19 | 4.2 OXBattle | Indigo/slate split, dynamic winner emphasis, 2-color progress bar |
| 20 | 2026-03-19 | 4.3+4.4 WordCloud+QACards | Indigo/slate word palette, Cloud/MessageSquare empty states, slate tokens |
| 21 | 2026-03-19 | 4.R+5.1 VizReview+Roulette | Viz review passed. Roulette: indigo mono segments, Target icon, Button component |
| 22 | 2026-03-19 | 5.2+5.R Lottery+GamesReview | Indigo/slate cards, Trophy icon, Button comp. ENTIRE codebase: 0 gray/blue/emoji! |
| 23 | 2026-03-19 | 6.1+6.2 Timer component+hook | TimerRing (SVG ring, color transition, pulse), TimerControls, useTimer Firebase hook |
| 24 | 2026-03-19 | 6.3+6.4+6.R Timer full integration | Admin sidebar controls, student VotePage timer, Playwright verified, deployed |
