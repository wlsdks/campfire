# Pick — Phase 3: 코드 health 정비

> 2026-04-27. Phase 1+2 후 종합 코드 health audit (dead code / architecture / docs)
> 3개 parallel agent 결과 통합 + 단계별 실행.

## Audit 요약

### Dead Code (Audit 1)
- **Orphan 파일**: quiz-bgm.js (201), AssignmentManager (153), BubbleInput (90), HelpRequestModal (76), CourseEditor (237) = 757줄
- **Unused exports**: hapticError, playTick, useCourseMap
- **Unused imports**: 9건 (App, ClassesTab, StaffMobileView 등)
- **console.log/TODO/FIXME**: 0건 (코드베이스 매우 깨끗)
- **Duplicate**: uuid 생성 3개 위치, formatTime 4개 위치, formatPercent 인라인

### Architecture (Audit 2)
- **Cross-feature imports 18건** — 핫스팟: ai-judge → assignments (judges/gemini API 5회)
- **Components > 200줄**: PresentationView 628, AiJudgeViz 545, QuestionFormSections 442, AiJudgeSubmitter 415, ClassQAPanel 399
- **Cleanup 누락 0건** — Firebase listener 패턴 양호
- **memo**: 큰 페이지 컴포넌트 미적용 (라우트라 영향 제한)

### Docs (Audit 3)
- **즉시 삭제**: progress.md, prompt.md (stale 작업 로그)
- **업데이트**: CLAUDE.md (features 폴더 트리), README (cut 표현), package.json metadata
- **고려**: PRD.md → docs/specs 이전, FEATURES.md → README 통합
- **유지**: DESIGN_SYSTEM.md (최신 770줄)

---

## Track A — Dead Code Cut (즉시, 안전)

### A1. Orphan 파일 4개 cut (529줄)
- `src/lib/quiz-bgm.js` (201)
- `src/features/assignments/components/AssignmentManager.jsx` (153)
- `src/features/reactions/components/BubbleInput.jsx` (90)
- `src/features/dm/components/HelpRequestModal.jsx` (76)
- `src/app/routes/admin/CourseEditor.jsx` (237) — 검증 후 결정 (question-types.js 주석 참조만)

### A2. Unused imports 9건 cleanup
- App.jsx (InstallPrompt), ClassesTab (PickMascot), StaffMobileView (Badge),
  ActivePollView (DrumrollOverlay), WaitingPage (Badge),
  MultiImageUpload (motion), AwardReveal (Avatar), VizRenderer (TextAnswerChart), csv.js (TYPE_LABELS)

### A3. Unused exports 3건 cleanup
- `lib/haptics.js :: hapticError`
- `lib/chime.js :: playTick`
- `features/course/api/useCourses.js :: useCourseMap`

### A4. .gitignore root *.png + 60개 untracked cleanup
- root에 60개 untracked PNG 누적 (이전 testing 잔여)
- .gitignore에 패턴 추가 + 로컬 cleanup (사용자 결정)

### A5. design-tokens.js 미사용 export
- typography/shadows/tw/viewports/motion/press/spacing/radius/icons/mobile/touch
- **유지 권장**: DESIGN_SYSTEM.md spec-as-code, 향후 사용 + 문서 가치
- cut 안 함

---

## Track B — Docs Cleanup (즉시)

### B1. stale 문서 삭제
- `progress.md` (3월 27, Phase 1~9 완료 로그)
- `prompt.md` (3월 27, 옛 cron loop 가이드)
- `docs/slack-integration-plan.md` (미구현, 검토 중 상태)

### B2. UX-PATROL.md 검토
- ui-patrol skill 활용 여부 확인 후 결정
- 활용 안 하면 삭제, 사용 시 유지

### B3. CLAUDE.md 업데이트
- features 폴더 트리 (line 26-30): 실제 17개 폴더로 갱신
- games에서 cut된 항목 제거 (Plinko/Roulette/PrizeDraw/SlotMachine 등)
- teams 제거

### B4. README.md 업데이트
- features 폴더 트리에 chat/dm/course/class-questions/ai-judge/report 추가
- 팀 대항전 / cut된 게임 표현 정리
- Phase 1+2 정리 사항 반영

### B5. package.json metadata 추가
- description: "실시간 강의 참여 플랫폼"
- homepage, repository, author 추가

### B6. PRD.md 처리
- docs/specs/2026-03-21-pick-prd.md 로 이전 (역사 문서로 보존)
- 또는 outdated 부분 업데이트

### B7. FEATURES.md
- README와 중복 큰 부분 제거, 차별점만 남기거나 README에 흡수

---

## Track C — Architecture Refactor (Phase 3 cron)

### C1. judges + gemini → lib/ai-judges/ 추출
- ai-judge → assignments cross import 5회 해소
- 공유 도메인 코드 적절한 위치로

### C2. PresentationView 628줄 → 3 분할
- PresentationHeader / PresentationStage / PresentationFooter

### C3. AiJudgeViz 545줄 → sub-component 추출
- JudgeRow / Top3Reveal / SubmissionGrid

### C4. 그 외 cross-feature imports 정리
- quiz → timer, session → quiz, report → session/quiz, chat → dm

### C5. 큰 파일 분할 (순차)
- QuestionFormSections 442, AiJudgeSubmitter 415, ClassQAPanel 399, StaffQuestionDetail 376

---

## Track D — Utility Consolidation

### D1. uuid 생성기 통합
- `lib/utils.js :: uuid` 단일 source
- `lib/auth.js :: generateId` (adm_ 접두) → utils.uuid 사용
- `lib/participant.js` 인라인 → utils.uuid 사용

### D2. formatTime → lib/utils
- QACards, TimerCountdown, BreakTimer 인라인 → lib/utils.formatTime

### D3. formatPercent enforcement
- csv.js, ConfidenceStats, TextAnswerChart, CheckProgress 인라인 → formatPercent

---

## 작업 순서

### Phase 3 첫 cron 사이클 (즉시 실행)
1. **A1** orphan 파일 4개 cut (5분, 검증 0)
2. **A2** unused imports 9건 (10분)
3. **A3** unused exports 3건 (10분)
4. **A4** .gitignore + PNG cleanup (5분)
5. **B1** stale 문서 삭제 (5분)
6. **B3** CLAUDE.md 업데이트 (15분)
7. **B5** package.json metadata (5분)
8. **B4** README.md 업데이트 (20분)
9. **B6** PRD.md 이전 (10분)
10. **B7** FEATURES.md 정리 (15분)
11. **B2** UX-PATROL.md 결정 (5분)

### Phase 3 후속 cron (이번 cycle 완료 후)
12. **D1~D3** Utility consolidation (1.5h)
13. **C1** judges/gemini 추출 (1.5h)
14. **C2** PresentationView 분할 (2h)
15. **C3** AiJudgeViz 분할 (2h)
16. **C4** cross-feature imports 정리 (분할)
17. **C5** 큰 파일 분할 (분할)
