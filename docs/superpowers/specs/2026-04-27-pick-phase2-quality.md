# Pick — Phase 2: 품질/UX/성능/신뢰도 강화 백로그

> 2026-04-27. Phase 1 (백로그 정리, 63 commits) 후 차세대 개선 트랙.
> 원칙: anti-feature-bloat 유지. 기존 기능 품질/안정성/UX 강화 위주.
> 신기능(D 트랙)은 사용자 명시 요청 시만 진행.

## 우선순위 구조

| 우선순위 | 성격 | 항목 |
|---------|------|------|
| **Q0** | Quick wins (즉시) | 빈 상태, skeleton, 번들 audit |
| **Q1** | UX 폴리시 | 에러 fallback, onboarding, 세션 종료 |
| **Q2** | 성능/신뢰도 | rules 보안, 메모리 audit, logger |
| **Q3** | 운영/PWA | PWA 강화, E2E 자동화 |
| **Q4** | 신기능 (보류 권장) | D 트랙 — anti-bloat 충돌 |

---

## Q0 — Quick Wins (이번 cron 사이클 우선)

### Q0-1. 빈 상태 (Empty States) 일관성 audit
- 모든 라우트의 빈 상태 (세션 0/질문 0/제출 0/리액션 0/손들기 0 등) 스캔
- 일관된 마스코트 + 안내 + CTA 패턴 적용
- 기존 EmptyState 컴포넌트 재사용 강화
- **공수**: M (1.5h, 분할 가능)

### Q0-2. Skeleton/로딩 상태 일관성
- VotePageSkeleton, SuspenseFallback 등 기존 패턴 검사
- 누락 영역 (admin 사이드바 진입, 과제 상세, AI 심사 등) 추가
- shimmer animation 토큰 활용
- **공수**: M (1h, 분할 가능)

### Q0-3. 번들 사이즈 audit ✅ 분석 완료 (수정은 Q2로 이관)

**Top chunks (raw bytes / brotli-gzip)**:
- AdminPage 242kb / 44kb — 가장 큼
- index 232kb / 62kb — 메인 entry
- VotePage 166kb / 29kb — 학생
- vendor-firebase 164kb / 42kb — modular, 추가 절감 어려움
- vendor-motion 135kb / 39kb — Framer Motion (큰 라이브러리)
- SubmitPage 133kb / 33kb — JSZip 포함
- VizRenderer 101kb / 19kb — 시각화
- ChatBubbleOverlay 28kb / 8kb — overlay라 lazy 가능
- ClassSummary 25kb, StatsView 22kb — chart 관련

**개선 후보 (Q2-perf로 이관)**:
1. **AdminPage lazy 추가** — AssignmentsTab/StatsView 분리 가능 (현재 일부만)
2. **ChatBubbleOverlay lazy** — 활성 시점에만 로드, 강사 진입 시 즉시 필요 X
3. **SubmitPage JSZip 분리** — code submission 시점에만 동적 import
4. **vendor-motion**: framer-motion → motion (smaller subset) 검토 가능

**유지 권장**:
- vendor-firebase 164kb — modular import 이미 적용, 추가 절감 어려움
- vendor-react 48kb — 정상 범위

---

## Q1 — UX 폴리시

### Q1-4. 에러 fallback 강화
- ErrorBoundary 라우트별 메시지 한국어화 + 마스코트
- Firebase 끊김 시 사용자 안내 (ConnectionBanner 강화)
- Gemini API 실패 시 retry 가이드
- **공수**: M (1.5h)

### Q1-5. 강사 onboarding (첫 세션)
- "첫 클래스 만들기" 가이드 (선택적, 1회만)
- 세션 만든 후 "QR로 학생 초대" hint
- 너무 강요하지 않게 dismissable
- **공수**: M (1.5h)

### Q1-6. 세션 종료 후 가치 회수
- 종료 화면에 요약 카드 (참여율 / 응답 / 인사이트)
- ClassSummary 강화
- 강사가 다음 수업 준비할 때 참고 가능
- **공수**: M (2h)

---

## Q2 — 성능/신뢰도

### Q2-7. Firebase rules 보안 deep audit
- admins 컬렉션 권한 (현재 .read .write true 비교적 open)
- 세션별 creatorId 검증 누락 위치
- courseId 소유권 검증
- **공수**: M (2h, P1-7 deploy와 묶을지 검토)

### Q2-8. 메모리 누수 audit
- listener cleanup 일관성 검증 (강제 unmount 시뮬레이션)
- React DevTools Profiler 분석
- useEffect dependency 미수
- **공수**: M (1.5h)

### Q2-9. 로거/에러 트래킹
- src/lib/logger.js 패턴 일관화
- Production 에러를 어디로 보낼지 (현재: console only)
- 외부 서비스 (Sentry 등) 연동 여부 결정
- **공수**: M (1.5h, 외부 의존성 결정 필요)

---

## Q3 — 운영/PWA

### Q3-10. PWA 강화
- Service Worker 캐시 전략 검토
- 오프라인 진입 시 사용자 안내
- Install prompt 제시 시점 최적화
- **공수**: M (2h)

### Q3-11. E2E 자동화
- 기존 Playwright 71 case 자동 실행 흐름
- CI 연동 가능성
- 회귀 prevention
- **공수**: L (3h+)

---

## Q4 — 신기능 (보류 권장, anti-bloat 위배)

> 사용자 명시 진행 신호 시만. 기본은 cancel.

### Q4-12. AI 심사 다양화
### Q4-13. 세션 템플릿
### Q4-14. 학습 리포트 강화

---

## 작업 순서 (실행 큐)

1. ~~**Q0-3** 번들 audit~~ ✅ 분석 완료 (개선은 Q2-perf로)
2. **Q0-1** 빈 상태 audit + 정리 (1.5h) ← 다음 iteration
3. **Q0-2** Skeleton 일관성 (1h)
4. **Q1-4** 에러 fallback 강화 (1.5h)
5. **Q1-6** 세션 종료 후 가치 회수 (2h)
6. **Q1-5** 강사 onboarding (1.5h)
7. **Q2-8** 메모리 누수 audit (1.5h)
8. **Q2-7** Firebase rules 보안 deep audit (2h, ⏸️ rules.json 수정 시 사용자 확인)
9. **Q2-9** 로거/에러 트래킹 (1.5h, ⏸️ 외부 의존성 결정 필요)
10. **Q3-10** PWA 강화 (2h)
11. **Q3-11** E2E 자동화 (3h+, ⏸️ 외부 CI 연동 결정 필요)
12. **Q4-12~14** ⏸️ 신기능 (사용자 진행 명시 시만)

### 멈춤 지점
- Q2-7: rules.json 수정 (P1-7 미배포 상태 — 두 작업 묶음 권장)
- Q2-9: Sentry 등 외부 의존성 결정
- Q3-11: CI 환경 결정
- Q4: 모두 사용자 명시 신호 필요

### Loop 운영
- 20분 cadence (Phase 1과 동일)
- 각 iteration: top 1개 항목 처리, 빌드 + 커밋 + 백로그 업데이트
- 5회 연속 후 review 권장 메시지
