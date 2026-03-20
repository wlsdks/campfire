# Admin Session Dashboard

## Summary
로그인 후 세션 히스토리 대시보드를 보여주고, 과거 세션 결과 조회 + 새 세션 생성이 가능하도록 한다.

## Flow
```
/admin → AdminLogin (비밀번호) → SessionDashboard (세션 목록)
  → "새 세션 만들기" → AdminPage (기존 관리 화면)
  → 과거 세션 클릭 → AdminPage (읽기 전용 결과 조회)
```

## Components

### SessionDashboard.jsx (NEW)
- **위치**: `src/app/routes/admin/SessionDashboard.jsx`
- **역할**: 로그인 후 첫 화면. 세션 목록 + 새 세션 생성
- **UI**:
  - 상단: Pick 마스코트 + 환영 텍스트
  - "새 세션 만들기" 버튼
  - 세션 카드 리스트 (최신순 정렬)
- **카드 정보**: 세션코드, 생성일시, 참여자 수, 질문 수, 상태 배지(active/ended)
- **카드 클릭**: active → 관리모드, ended → 결과조회모드

### useSessionList.js (NEW)
- **위치**: `src/features/session/api/useSessionList.js`
- **역할**: Firebase `sessions/` 전체 메타데이터 조회
- **반환**: `{ sessions, loading }` — 각 세션의 id, createdAt, status, 참여자 수, 질문 수

### AdminPage.jsx (MODIFY)
- 세션 선택/생성 로직을 SessionDashboard로 이동
- `onBack` prop 추가: 대시보드로 돌아가기
- 결과 조회 모드: `readOnly` prop으로 수정 불가 처리

## Data
- Firebase 구조 변경 없음 — 기존 `sessions/` 데이터 그대로 활용
- 세션 종료: `sessions/{id}/status`를 `'ended'`로 업데이트

## Design
- 토스 스타일: 큰 제목, 넉넉한 여백, 최소 장식
- Pick 마스코트 재사용 (AdminLogin과 동일)
- Framer Motion 입장 애니메이션
